import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { MATERIALS } from "./rules.js";
import type {
  AmmoKind,
  BlockSpec,
  ImpactReport,
  MaterialKind,
  PhysicsStats,
  StageDefinition,
} from "./types.js";

const FIXED_STEP = 1 / 60;
const MAX_DEBRIS = 150;

interface PhysicsBlock {
  spec: BlockSpec;
  object: THREE.Group;
  pickMesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  initialPosition: THREE.Vector3;
  health: number;
  fractured: boolean;
  collapsed: boolean;
  weight: number;
}

interface PhysicsDebris {
  object: THREE.Mesh;
  body: RAPIER.RigidBody;
  bornAt: number;
  lifetime: number;
}

interface PhysicsProjectile {
  object: THREE.Group;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  ammo: AmmoKind;
  power: number;
  bornAt: number;
  impacted: boolean;
}

interface LaunchOptions {
  origin: THREE.Vector3;
  target: THREE.Vector3;
  power: number;
  ammo: AmmoKind;
}

interface PhysicsRuntimeOptions {
  scene: THREE.Scene;
  onImpact: (report: ImpactReport) => void;
}

function magnitude(vector: { x: number; y: number; z: number }): number {
  return Math.hypot(vector.x, vector.y, vector.z);
}

function makeLabelSprite(text: string, accent: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Label canvas unavailable");
  context.fillStyle = "rgba(7,12,18,.82)";
  context.roundRect(8, 8, 496, 112, 12);
  context.fill();
  context.strokeStyle = `#${accent.toString(16).padStart(6, "0")}`;
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = "#fff4d3";
  context.font = text.length > 8 ? "800 42px sans-serif" : "900 58px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.8, 0.7, 1);
  return sprite;
}

function materialFor(kind: MaterialKind): THREE.MeshStandardMaterial {
  const spec = MATERIALS[kind];
  if (kind === "glass") {
    return new THREE.MeshPhysicalMaterial({
      color: spec.color,
      roughness: spec.roughness,
      metalness: spec.metalness,
      transparent: true,
      opacity: 0.72,
      transmission: 0.08,
      thickness: 0.16,
      emissive: 0x164657,
      emissiveIntensity: 0.14,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: spec.color,
    roughness: spec.roughness,
    metalness: spec.metalness,
    emissive: kind === "steel" ? 0x061019 : 0x000000,
    emissiveIntensity: kind === "steel" ? 0.16 : 0,
  });
}

export class BuildingPhysics {
  readonly groundMesh: THREE.Mesh;

  private readonly scene: THREE.Scene;
  private readonly onImpact: (report: ImpactReport) => void;
  private readonly world: RAPIER.World;
  private readonly events: RAPIER.EventQueue;
  private readonly blocks: PhysicsBlock[] = [];
  private readonly colliderToBlock = new Map<number, PhysicsBlock>();
  private readonly colliderToProjectile = new Map<number, PhysicsProjectile>();
  private readonly pickToBlock = new Map<string, PhysicsBlock>();
  private readonly debris: PhysicsDebris[] = [];
  private readonly sharedMaterials = new Map<MaterialKind, THREE.MeshStandardMaterial>();
  private readonly sharedGeometries = new Map<string, THREE.BoxGeometry>();
  private readonly stageRoot = new THREE.Group();
  private projectile: PhysicsProjectile | null = null;
  private accumulator = 0;
  private elapsed = 0;
  private totalWeight = 1;
  private timeScale = 1;
  private slowMotionTimer = 0;
  private stageAccent = 0xf5bd55;

  private constructor(options: PhysicsRuntimeOptions) {
    this.scene = options.scene;
    this.onImpact = options.onImpact;
    this.world = new RAPIER.World({ x: 0, y: -12.8, z: 0 });
    this.world.integrationParameters.dt = FIXED_STEP;
    this.events = new RAPIER.EventQueue(true);
    this.stageRoot.name = "DestructibleBuilding";
    this.scene.add(this.stageRoot);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x202a2b,
      roughness: 0.96,
      metalness: 0.05,
    });
    this.groundMesh = new THREE.Mesh(new THREE.BoxGeometry(38, 0.24, 26), groundMaterial);
    this.groundMesh.position.set(0, -0.12, 0);
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = "DemolitionGround";
    this.scene.add(this.groundMesh);

    const groundBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.12, 0),
    );
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(19, 0.12, 13)
        .setFriction(0.9)
        .setRestitution(0.04),
      groundBody,
    );
  }

  static async create(options: PhysicsRuntimeOptions): Promise<BuildingPhysics> {
    await RAPIER.init();
    return new BuildingPhysics(options);
  }

  spawnStage(stage: StageDefinition): void {
    this.clearStage();
    this.stageAccent = stage.accent;
    for (const spec of stage.build()) this.spawnBlock(spec);
    this.totalWeight = Math.max(
      1,
      this.blocks.reduce((sum, block) => sum + block.weight, 0),
    );
    for (const block of this.blocks) block.body.sleep();
  }

  private geometryFor(size: readonly [number, number, number]): THREE.BoxGeometry {
    const key = size.map((value) => value.toFixed(3)).join(":");
    const cached = this.sharedGeometries.get(key);
    if (cached) return cached;
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2], 1, 1, 1);
    this.sharedGeometries.set(key, geometry);
    return geometry;
  }

  private visualMaterial(kind: MaterialKind): THREE.MeshStandardMaterial {
    const cached = this.sharedMaterials.get(kind);
    if (cached) return cached;
    const material = materialFor(kind);
    this.sharedMaterials.set(kind, material);
    return material;
  }

  private spawnBlock(spec: BlockSpec): void {
    const material = MATERIALS[spec.material];
    const object = new THREE.Group();
    object.name = spec.id;

    const mesh = new THREE.Mesh(this.geometryFor(spec.size), this.visualMaterial(spec.material));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.blockId = spec.id;
    object.add(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(this.geometryFor(spec.size), 24),
      new THREE.LineBasicMaterial({
        color: material.edgeColor,
        transparent: true,
        opacity: spec.material === "glass" ? 0.8 : 0.42,
      }),
    );
    edges.renderOrder = 2;
    object.add(edges);

    if (spec.material === "drywall") {
      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.size[0] * 0.68, spec.size[1] * 0.32),
        new THREE.MeshBasicMaterial({ color: 0x827866, transparent: true, opacity: 0.22 }),
      );
      paper.position.z = spec.size[2] / 2 + 0.003;
      object.add(paper);
    }

    if (spec.label) {
      const label = makeLabelSprite(spec.label, this.stageAccent);
      label.position.set(0, 0, spec.size[2] / 2 + 0.03);
      label.scale.set(
        Math.min(spec.size[0] * 0.9, 3.4),
        Math.min(spec.size[1] * 0.72, 0.9),
        1,
      );
      object.add(label);
    }

    object.position.set(...spec.position);
    this.stageRoot.add(object);

    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(spec.position[0], spec.position[1], spec.position[2])
        .setLinearDamping(spec.material === "glass" ? 0.06 : 0.12)
        .setAngularDamping(0.14)
        .setCanSleep(true),
    );
    const bevel = Math.min(0.035, spec.size[0] * 0.04, spec.size[1] * 0.04, spec.size[2] * 0.04);
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.roundCuboid(
        spec.size[0] / 2 - bevel,
        spec.size[1] / 2 - bevel,
        spec.size[2] / 2 - bevel,
        bevel,
      )
        .setDensity(material.density)
        .setFriction(material.friction)
        .setRestitution(material.restitution),
      body,
    );

    const block: PhysicsBlock = {
      spec,
      object,
      pickMesh: mesh,
      body,
      collider,
      initialPosition: new THREE.Vector3(...spec.position),
      health: material.health,
      fractured: false,
      collapsed: false,
      weight:
        spec.size[0]
        * spec.size[1]
        * spec.size[2]
        * material.density
        * (spec.structural ? 1 : 0.28),
    };
    this.blocks.push(block);
    this.colliderToBlock.set(collider.handle, block);
    this.pickToBlock.set(mesh.uuid, block);
  }

  launchMug(options: LaunchOptions): void {
    this.removeProjectile();
    const special = options.ammo === "kanpai";
    const object = this.makeMugVisual(special);
    object.position.copy(options.origin);
    this.scene.add(object);

    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(options.origin.x, options.origin.y, options.origin.z)
        .setLinearDamping(0.015)
        .setAngularDamping(0.05)
        .setCcdEnabled(true)
        .setCanSleep(false),
    );
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.ball(special ? 0.38 : 0.29)
        .setDensity(special ? 11 : 5.2)
        .setFriction(0.48)
        .setRestitution(special ? 0.2 : 0.32)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body,
    );

    const distance = options.origin.distanceTo(options.target);
    const duration = THREE.MathUtils.clamp(distance / (8.5 + options.power * 2.8), 0.8, 1.5);
    const gravity = 12.8;
    const velocity = options.target.clone().sub(options.origin);
    velocity.x /= duration;
    velocity.z /= duration;
    velocity.y = (options.target.y - options.origin.y + 0.5 * gravity * duration * duration) / duration;
    body.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    body.setAngvel(
      {
        x: 8 + options.power * 7,
        y: special ? 5 : 2.5,
        z: -5 - options.power * 4,
      },
      true,
    );

    const projectile: PhysicsProjectile = {
      object,
      body,
      collider,
      ammo: options.ammo,
      power: options.power,
      bornAt: this.elapsed,
      impacted: false,
    };
    this.projectile = projectile;
    this.colliderToProjectile.set(collider.handle, projectile);
  }

  private makeMugVisual(special: boolean): THREE.Group {
    const group = new THREE.Group();
    const glass = new THREE.MeshPhysicalMaterial({
      color: special ? 0xffeb84 : 0xd9f7ff,
      transparent: true,
      opacity: special ? 0.86 : 0.68,
      roughness: 0.12,
      metalness: special ? 0.28 : 0.02,
      emissive: special ? 0xffb627 : 0x17485a,
      emissiveIntensity: special ? 1.3 : 0.12,
    });
    const beer = new THREE.MeshStandardMaterial({
      color: special ? 0xffd43b : 0xd89222,
      emissive: special ? 0xff9e00 : 0x2a1200,
      emissiveIntensity: special ? 1.1 : 0.1,
      roughness: 0.36,
    });
    const foam = new THREE.MeshStandardMaterial({
      color: 0xfff7dc,
      emissive: special ? 0xffe59a : 0x000000,
      emissiveIntensity: special ? 0.45 : 0,
      roughness: 0.88,
    });

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.62, 18, 1, true), glass);
    cup.castShadow = true;
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.22, 0.43, 16), beer);
    liquid.position.y = -0.07;
    const foamTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16), foam);
    foamTop.position.y = 0.19;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 8, 18, Math.PI * 1.55), glass);
    handle.rotation.y = Math.PI / 2;
    handle.rotation.z = Math.PI * 0.23;
    handle.position.x = 0.3;
    group.add(cup, liquid, foamTop, handle);

    if (special) {
      const light = new THREE.PointLight(0xffc643, 4.5, 5);
      group.add(light);
    }
    group.scale.setScalar(special ? 1.35 : 1);
    return group;
  }

  private handleCollision(handleA: number, handleB: number, started: boolean): void {
    if (!started) return;
    const projectile =
      this.colliderToProjectile.get(handleA) ?? this.colliderToProjectile.get(handleB);
    if (!projectile || projectile.impacted) return;
    const directBlock =
      this.colliderToBlock.get(handleA) ?? this.colliderToBlock.get(handleB);
    const translation = projectile.body.translation();
    const impactPosition = new THREE.Vector3(translation.x, translation.y, translation.z);
    const velocity = projectile.body.linvel();
    const speed = magnitude(velocity);
    projectile.impacted = true;

    if (directBlock && !directBlock.fractured) {
      directBlock.health -=
        (projectile.ammo === "kanpai" ? 165 : 54)
        * (0.72 + projectile.power * 0.75)
        + speed * (projectile.ammo === "kanpai" ? 7 : 2.4);
    }

    const fractured = this.blast(
      impactPosition,
      projectile.ammo,
      projectile.power,
      speed,
      directBlock,
    );
    this.slowMotionTimer = projectile.ammo === "kanpai" ? 0.82 : 0.46;
    this.timeScale = projectile.ammo === "kanpai" ? 0.36 : 0.58;
    const stats = this.getStats();
    this.onImpact({
      position: [impactPosition.x, impactPosition.y, impactPosition.z],
      fractured,
      newlyCollapsed: stats.collapsed,
      force: speed,
      special: projectile.ammo === "kanpai",
    });
  }

  private blast(
    center: THREE.Vector3,
    ammo: AmmoKind,
    power: number,
    impactSpeed: number,
    directBlock?: PhysicsBlock,
  ): number {
    const special = ammo === "kanpai";
    const radius = special ? 3.25 + power * 1.15 : 1.55 + power * 0.78;
    const impulse = special ? 19 + power * 20 : 5.8 + power * 8.5;
    const damage = special ? 98 + power * 112 : 27 + power * 48;
    let fractured = 0;
    const toFracture: PhysicsBlock[] = [];

    for (const block of this.blocks) {
      if (block.fractured) continue;
      const translation = block.body.translation();
      const delta = new THREE.Vector3(
        translation.x - center.x,
        translation.y - center.y,
        translation.z - center.z,
      );
      const distance = delta.length();
      if (distance > radius) continue;
      if (distance < 0.05) delta.set(Math.random() - 0.5, 0.4, Math.random() - 0.5);
      const falloff = Math.max(0.08, 1 - distance / radius);
      delta.normalize();
      const material = MATERIALS[block.spec.material];
      const densityResistance = 0.74 + material.density * 0.13;
      const upward = special ? 0.44 : 0.26;
      const appliedImpulse = impulse * falloff * (special ? 1 : 1 / densityResistance);
      block.body.wakeUp();
      block.body.applyImpulse(
        {
          x: delta.x * appliedImpulse,
          y: (delta.y + upward) * appliedImpulse,
          z: delta.z * appliedImpulse,
        },
        true,
      );
      block.body.applyTorqueImpulse(
        {
          x: (Math.random() - 0.5) * appliedImpulse * 0.42,
          y: (Math.random() - 0.5) * appliedImpulse * 0.34,
          z: (Math.random() - 0.5) * appliedImpulse * 0.42,
        },
        true,
      );
      block.health -= damage * falloff * (special && block.spec.material === "steel" ? 1.35 : 1);
      if (block === directBlock) block.health -= impactSpeed * (special ? 5.5 : 2);
      if (block.health <= 0) toFracture.push(block);
    }

    for (const block of toFracture) {
      if (block.fractured) continue;
      this.fractureBlock(block, center, impulse);
      fractured += 1;
    }

    for (const block of this.blocks) {
      if (!block.fractured) block.body.wakeUp();
    }
    return fractured;
  }

  private fractureBlock(block: PhysicsBlock, source: THREE.Vector3, force: number): void {
    if (block.fractured) return;
    block.fractured = true;
    this.colliderToBlock.delete(block.collider.handle);
    this.pickToBlock.delete(block.pickMesh.uuid);
    this.stageRoot.remove(block.object);
    const translation = block.body.translation();
    const rotation = block.body.rotation();
    const velocity = block.body.linvel();
    this.world.removeRigidBody(block.body);

    const center = new THREE.Vector3(translation.x, translation.y, translation.z);
    const size = new THREE.Vector3(...block.spec.size);
    const pieces = block.spec.material === "glass" ? 7 : block.spec.material === "steel" ? 3 : 5;
    for (let index = 0; index < pieces; index += 1) {
      const shardSize = size.clone().multiply(
        new THREE.Vector3(
          0.24 + Math.random() * 0.22,
          0.22 + Math.random() * 0.24,
          0.3 + Math.random() * 0.25,
        ),
      );
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * size.x * 0.65,
        (Math.random() - 0.5) * size.y * 0.65,
        (Math.random() - 0.5) * size.z * 0.65,
      );
      const direction = center.clone().add(offset).sub(source);
      if (direction.lengthSq() < 0.01) direction.randomDirection();
      direction.normalize();
      this.spawnDebris(
        center.clone().add(offset),
        shardSize,
        block.spec.material,
        new THREE.Vector3(velocity.x, velocity.y, velocity.z)
          .multiplyScalar(0.35)
          .add(direction.multiplyScalar(force * (0.32 + Math.random() * 0.38)))
          .add(new THREE.Vector3(0, 1.5 + Math.random() * 3.2, 0)),
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
      );
    }
  }

  private spawnDebris(
    position: THREE.Vector3,
    size: THREE.Vector3,
    materialKind: MaterialKind,
    velocity: THREE.Vector3,
    rotation: THREE.Quaternion,
  ): void {
    while (this.debris.length >= MAX_DEBRIS) this.removeDebris(this.debris[0]);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      this.visualMaterial(materialKind),
    );
    mesh.position.copy(position);
    mesh.quaternion.copy(rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w })
        .setLinvel(velocity.x, velocity.y, velocity.z)
        .setAngvel({
          x: (Math.random() - 0.5) * 12,
          y: (Math.random() - 0.5) * 12,
          z: (Math.random() - 0.5) * 12,
        })
        .setLinearDamping(0.08)
        .setAngularDamping(0.12)
        .setCanSleep(true),
    );
    const material = MATERIALS[materialKind];
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
        .setDensity(material.density * 0.65)
        .setFriction(material.friction)
        .setRestitution(Math.min(0.4, material.restitution + 0.12)),
      body,
    );
    this.debris.push({
      object: mesh,
      body,
      bornAt: this.elapsed,
      lifetime: materialKind === "glass" ? 4.2 : 6.5,
    });
  }

  private removeDebris(debris: PhysicsDebris): void {
    const index = this.debris.indexOf(debris);
    if (index >= 0) this.debris.splice(index, 1);
    this.scene.remove(debris.object);
    debris.object.geometry.dispose();
    this.world.removeRigidBody(debris.body);
  }

  step(delta: number): void {
    this.elapsed += delta;
    if (this.slowMotionTimer > 0) {
      this.slowMotionTimer -= delta;
      if (this.slowMotionTimer <= 0) this.timeScale = 1;
    }
    this.accumulator = Math.min(this.accumulator + delta * this.timeScale, FIXED_STEP * 5);
    while (this.accumulator >= FIXED_STEP) {
      this.world.step(this.events);
      this.events.drainCollisionEvents((handleA, handleB, started) => {
        this.handleCollision(handleA, handleB, started);
      });
      this.accumulator -= FIXED_STEP;
    }

    for (const block of this.blocks) {
      if (block.fractured) continue;
      const translation = block.body.translation();
      const rotation = block.body.rotation();
      block.object.position.set(translation.x, translation.y, translation.z);
      block.object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      if (!block.collapsed) {
        const displacement = block.object.position.distanceTo(block.initialPosition);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(block.object.quaternion);
        if (
          displacement > 0.92
          || up.y < 0.68
          || translation.y < Math.max(0.06, block.spec.size[1] * 0.2)
        ) {
          block.collapsed = true;
        }
      }
    }

    if (this.projectile) {
      const translation = this.projectile.body.translation();
      const rotation = this.projectile.body.rotation();
      this.projectile.object.position.set(translation.x, translation.y, translation.z);
      this.projectile.object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      if (this.elapsed - this.projectile.bornAt > 7 || translation.y < -2) {
        this.removeProjectile();
      }
    }

    for (const debris of [...this.debris]) {
      const translation = debris.body.translation();
      const rotation = debris.body.rotation();
      debris.object.position.set(translation.x, translation.y, translation.z);
      debris.object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      if (
        this.elapsed - debris.bornAt > debris.lifetime
        || translation.y < -3
        || Math.abs(translation.x) > 24
        || Math.abs(translation.z) > 24
      ) {
        this.removeDebris(debris);
      }
    }
  }

  getStats(): PhysicsStats {
    let stableWeight = 0;
    let fractured = 0;
    let collapsed = 0;
    let moving = 0;
    for (const block of this.blocks) {
      if (block.fractured) {
        fractured += 1;
        continue;
      }
      if (block.collapsed) collapsed += 1;
      const velocity = block.body.linvel();
      const angular = block.body.angvel();
      if (!block.body.isSleeping() && magnitude(velocity) + magnitude(angular) * 0.2 > 0.34) moving += 1;
      stableWeight += block.weight * (block.collapsed ? 0.18 : 1);
    }
    return {
      integrity: THREE.MathUtils.clamp(stableWeight / this.totalWeight, 0, 1),
      fractured,
      collapsed,
      total: this.blocks.length,
      moving,
    };
  }

  scoreValue(): number {
    let score = 0;
    for (const block of this.blocks) {
      const materialScore = MATERIALS[block.spec.material].score;
      if (block.fractured) score += materialScore;
      else if (block.collapsed) score += Math.round(materialScore * 0.58);
    }
    return score;
  }

  getPickMeshes(): THREE.Object3D[] {
    return this.blocks.filter((block) => !block.fractured).map((block) => block.pickMesh);
  }

  getProjectilePosition(target = new THREE.Vector3()): THREE.Vector3 | null {
    if (!this.projectile) return null;
    const translation = this.projectile.body.translation();
    return target.set(translation.x, translation.y, translation.z);
  }

  projectileHasImpacted(): boolean {
    return this.projectile?.impacted ?? false;
  }

  hasProjectile(): boolean {
    return Boolean(this.projectile);
  }

  isTargetMesh(object: THREE.Object3D): boolean {
    return this.pickToBlock.has(object.uuid);
  }

  wakeAll(): void {
    for (const block of this.blocks) {
      if (!block.fractured) block.body.wakeUp();
    }
  }

  private removeProjectile(): void {
    if (!this.projectile) return;
    this.colliderToProjectile.delete(this.projectile.collider.handle);
    this.scene.remove(this.projectile.object);
    this.projectile.object.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    this.world.removeRigidBody(this.projectile.body);
    this.projectile = null;
  }

  clearStage(): void {
    this.removeProjectile();
    for (const debris of [...this.debris]) this.removeDebris(debris);
    for (const block of this.blocks) {
      if (!block.fractured) this.world.removeRigidBody(block.body);
      this.stageRoot.remove(block.object);
      this.colliderToBlock.delete(block.collider.handle);
      this.pickToBlock.delete(block.pickMesh.uuid);
      block.object.traverse((object) => {
        if (object === block.pickMesh) return;
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose();
          object.material.dispose();
          return;
        }
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    }
    this.blocks.length = 0;
    this.accumulator = 0;
    this.totalWeight = 1;
  }

  dispose(): void {
    this.clearStage();
    this.scene.remove(this.stageRoot, this.groundMesh);
    for (const geometry of this.sharedGeometries.values()) geometry.dispose();
    for (const material of this.sharedMaterials.values()) material.dispose();
    this.groundMesh.geometry.dispose();
    const groundMaterials = Array.isArray(this.groundMesh.material)
      ? this.groundMesh.material
      : [this.groundMesh.material];
    groundMaterials.forEach((material) => material.dispose());
    this.events.free();
    this.world.free();
  }
}
