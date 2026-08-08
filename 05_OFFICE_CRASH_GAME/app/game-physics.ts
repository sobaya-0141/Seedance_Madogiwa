import RAPIER from "@dimforge/rapier3d";
import { createWorld, trait, type Entity } from "koota";
import * as THREE from "three";

const FIXED_STEP = 1 / 60;
const MAX_DYNAMIC_BODIES = 150;

type PhysicsKind = "debris" | "archive-box" | "rolling-chair" | "recycle-bin";

type PhysicsNodeData = {
  object: THREE.Object3D;
  body: RAPIER.RigidBody;
  bornAt: number;
  age: number;
  lifetime: number;
  fadeDuration: number;
  radius: number;
  damageScale: number;
  lastImpactAt: number;
  kind: PhysicsKind;
};

const PhysicsNode = trait((): PhysicsNodeData => ({
  object: new THREE.Object3D(),
  body: null as unknown as RAPIER.RigidBody,
  bornAt: 0,
  age: 0,
  lifetime: 0,
  fadeDuration: 0,
  radius: 0.25,
  damageScale: 1,
  lastImpactAt: -10,
  kind: "debris",
}));

const DynamicBody = trait();
const KineticDamage = trait();
const LooseOfficeProp = trait();

export type PhysicsImpact = {
  position: THREE.Vector3;
  speed: number;
  radius: number;
  damageScale: number;
  kind: PhysicsKind;
  consume: () => void;
};

export type OfficePhysicsStats = {
  bodies: number;
  moving: number;
  sleeping: number;
};

type DynamicObjectOptions = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  halfExtents: THREE.Vector3;
  velocity?: THREE.Vector3;
  angularVelocity?: THREE.Vector3;
  lifetime: number;
  fadeDuration?: number;
  density?: number;
  restitution?: number;
  friction?: number;
  radius?: number;
  damageScale?: number;
  kind: PhysicsKind;
  looseProp?: boolean;
  ccd?: boolean;
};

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) material.dispose();
  });
}

function setObjectOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      material.transparent = true;
      material.opacity = Math.min(material.opacity, opacity);
      material.depthWrite = opacity > 0.35;
    }
  });
}

function makeBoxVisual(
  size: THREE.Vector3,
  color: number,
  options: { emissive?: number; roughness?: number } = {},
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshStandardMaterial({
      color,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissive ? 0.18 : 0,
      roughness: options.roughness ?? 0.78,
      transparent: true,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeArchiveBox(accent: number) {
  const group = new THREE.Group();
  const box = makeBoxVisual(new THREE.Vector3(0.82, 0.62, 0.72), 0xc99052);
  box.position.y = 0.31;
  const stripe = makeBoxVisual(new THREE.Vector3(0.84, 0.13, 0.74), accent, {
    emissive: accent,
    roughness: 0.52,
  });
  stripe.position.y = 0.39;
  const label = makeBoxVisual(new THREE.Vector3(0.48, 0.18, 0.02), 0xfff7d6);
  label.position.set(0, 0.34, 0.371);
  group.add(box, stripe, label);
  return group;
}

function makeRollingChair(accent: number) {
  const group = new THREE.Group();
  const seat = makeBoxVisual(new THREE.Vector3(0.78, 0.16, 0.72), accent, {
    emissive: accent,
    roughness: 0.58,
  });
  seat.position.y = 0.67;
  const back = makeBoxVisual(new THREE.Vector3(0.78, 0.82, 0.16), accent, {
    emissive: accent,
    roughness: 0.58,
  });
  back.position.set(0, 1.07, 0.28);
  const stem = makeBoxVisual(new THREE.Vector3(0.12, 0.52, 0.12), 0x44525a);
  stem.position.y = 0.36;
  group.add(seat, back, stem);
  for (let index = 0; index < 5; index += 1) {
    const angle = index / 5 * Math.PI * 2;
    const spoke = makeBoxVisual(new THREE.Vector3(0.08, 0.08, 0.52), 0x38454c);
    spoke.position.set(Math.sin(angle) * 0.24, 0.12, Math.cos(angle) * 0.24);
    spoke.rotation.y = angle;
    group.add(spoke);
  }
  return group;
}

function makeRecycleBin(accent: number) {
  const group = new THREE.Group();
  const bin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.31, 0.74, 12),
    new THREE.MeshStandardMaterial({
      color: 0x647882,
      emissive: accent,
      emissiveIntensity: 0.08,
      roughness: 0.72,
      transparent: true,
    }),
  );
  bin.position.y = 0.37;
  bin.castShadow = true;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.37, 0.045, 6, 18),
    new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.25,
      roughness: 0.45,
      transparent: true,
    }),
  );
  rim.position.y = 0.73;
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  group.add(bin, rim);
  return group;
}

export class OfficePhysicsRuntime {
  private readonly scene: THREE.Scene;
  private readonly physics: RAPIER.World;
  private readonly ecs = createWorld();
  private accumulator = 0;
  private elapsed = 0;

  private constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.physics = new RAPIER.World({ x: 0, y: -15.5, z: 0 });
    this.physics.integrationParameters.dt = FIXED_STEP;

    this.physics.createCollider(
      RAPIER.ColliderDesc.cuboid(10.5, 0.12, 14.6)
        .setTranslation(0, -0.12, -1.2)
        .setFriction(0.86)
        .setRestitution(0.08),
    );
    this.physics.createCollider(
      RAPIER.ColliderDesc.cuboid(0.18, 2.2, 14.6)
        .setTranslation(-10.15, 2.2, -1.2)
        .setFriction(0.74)
        .setRestitution(0.22),
    );
    this.physics.createCollider(
      RAPIER.ColliderDesc.cuboid(0.18, 2.2, 14.6)
        .setTranslation(10.15, 2.2, -1.2)
        .setFriction(0.74)
        .setRestitution(0.22),
    );
    this.physics.createCollider(
      RAPIER.ColliderDesc.cuboid(10.5, 2.2, 0.18)
        .setTranslation(0, 2.2, -13.55)
        .setFriction(0.74)
        .setRestitution(0.22),
    );
    this.physics.createCollider(
      RAPIER.ColliderDesc.cuboid(10.5, 2.2, 0.18)
        .setTranslation(0, 2.2, 11.55)
        .setFriction(0.74)
        .setRestitution(0.22),
    );
  }

  static async create(scene: THREE.Scene) {
    return new OfficePhysicsRuntime(scene);
  }

  private removeEntity(entity: Entity) {
    if (!entity.isAlive()) return;
    const node = entity.get(PhysicsNode);
    if (!node) {
      entity.destroy();
      return;
    }
    this.scene.remove(node.object);
    this.physics.removeRigidBody(node.body);
    disposeObject(node.object);
    entity.destroy();
  }

  private trimBodies(incoming = 1) {
    const entities = [...this.ecs.query(PhysicsNode)];
    const overflow = entities.length + incoming - MAX_DYNAMIC_BODIES;
    if (overflow <= 0) return;
    entities
      .sort((left, right) => (
        (left.get(PhysicsNode)?.bornAt ?? 0) - (right.get(PhysicsNode)?.bornAt ?? 0)
      ))
      .slice(0, overflow)
      .forEach((entity) => this.removeEntity(entity));
  }

  private spawnDynamic(options: DynamicObjectOptions) {
    this.trimBodies();
    const body = this.physics.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(options.position.x, options.position.y, options.position.z)
        .setLinvel(
          options.velocity?.x ?? 0,
          options.velocity?.y ?? 0,
          options.velocity?.z ?? 0,
        )
        .setAngvel({
          x: options.angularVelocity?.x ?? 0,
          y: options.angularVelocity?.y ?? 0,
          z: options.angularVelocity?.z ?? 0,
        })
        .setLinearDamping(options.looseProp ? 0.18 : 0.08)
        .setAngularDamping(options.looseProp ? 0.22 : 0.14)
        .setCcdEnabled(options.ccd ?? false)
        .setCanSleep(true),
    );
    this.physics.createCollider(
      RAPIER.ColliderDesc.roundCuboid(
        Math.max(0.025, options.halfExtents.x),
        Math.max(0.025, options.halfExtents.y),
        Math.max(0.025, options.halfExtents.z),
        Math.min(
          0.055,
          options.halfExtents.x * 0.25,
          options.halfExtents.y * 0.25,
          options.halfExtents.z * 0.25,
        ),
      )
        .setDensity(options.density ?? 1)
        .setRestitution(options.restitution ?? 0.24)
        .setFriction(options.friction ?? 0.72),
      body,
    );
    options.object.position.copy(options.position);
    this.scene.add(options.object);
    const node = PhysicsNode({
      object: options.object,
      body,
      bornAt: this.elapsed,
      age: 0,
      lifetime: options.lifetime,
      fadeDuration: options.fadeDuration ?? 0.8,
      radius: options.radius ?? options.halfExtents.length(),
      damageScale: options.damageScale ?? 1,
      lastImpactAt: -10,
      kind: options.kind,
    });
    const entity = this.ecs.spawn(node, DynamicBody, KineticDamage);
    if (options.looseProp) entity.add(LooseOfficeProp);
    return entity;
  }

  spawnPlayground(accent: number, darkFloor: boolean) {
    const boxColor = darkFloor ? 0x9b714b : 0xc99052;
    const stacks: Array<[number, number, number]> = [
      [-8.5, -9.6, 3],
      [8.45, -5.4, 3],
      [-8.35, 2.8, 2],
    ];
    for (const [x, z, height] of stacks) {
      for (let level = 0; level < height; level += 1) {
        const group = makeArchiveBox(level % 2 === 0 ? accent : boxColor);
        const position = new THREE.Vector3(
          x + (level % 2 === 0 ? -0.08 : 0.08),
          0.32 + level * 0.66,
          z + (level % 2 === 0 ? 0.05 : -0.05),
        );
        this.spawnDynamic({
          object: group,
          position,
          halfExtents: new THREE.Vector3(0.41, 0.31, 0.36),
          lifetime: 90,
          fadeDuration: 1,
          density: 0.72,
          restitution: 0.16,
          friction: 0.84,
          radius: 0.58,
          damageScale: 1.1,
          kind: "archive-box",
          looseProp: true,
        });
      }
    }

    const chairs: Array<[number, number, number]> = [
      [8.4, 3.8, -0.32],
      [-8.2, -2.2, 0.28],
      [7.9, -10.1, -0.18],
    ];
    for (const [x, z, rotation] of chairs) {
      const group = makeRollingChair(accent);
      group.rotation.y = rotation;
      this.spawnDynamic({
        object: group,
        position: new THREE.Vector3(x, 0.02, z),
        halfExtents: new THREE.Vector3(0.42, 0.75, 0.42),
        angularVelocity: new THREE.Vector3(0, rotation * 0.8, 0),
        lifetime: 90,
        fadeDuration: 1,
        density: 0.88,
        restitution: 0.24,
        friction: 0.48,
        radius: 0.78,
        damageScale: 1.35,
        kind: "rolling-chair",
        looseProp: true,
      });
    }

    for (const [x, z] of [[-8.3, 7.1], [8.25, -0.4], [8.15, 7.4]] as Array<[number, number]>) {
      this.spawnDynamic({
        object: makeRecycleBin(accent),
        position: new THREE.Vector3(x, 0.02, z),
        halfExtents: new THREE.Vector3(0.37, 0.38, 0.37),
        lifetime: 90,
        fadeDuration: 1,
        density: 0.62,
        restitution: 0.32,
        friction: 0.52,
        radius: 0.52,
        damageScale: 0.82,
        kind: "recycle-bin",
        looseProp: true,
      });
    }
  }

  spawnDebrisBurst(
    position: THREE.Vector3,
    color: number,
    amount: number,
    options: { force?: number; paper?: boolean; mega?: boolean } = {},
  ) {
    const count = Math.min(amount, options.mega ? 28 : 18);
    this.trimBodies(count);
    for (let index = 0; index < count; index += 1) {
      const paper = options.paper ?? false;
      const size = paper
        ? new THREE.Vector3(0.2 + Math.random() * 0.22, 0.025, 0.15 + Math.random() * 0.2)
        : new THREE.Vector3(
            0.12 + Math.random() * 0.24,
            0.08 + Math.random() * 0.22,
            0.1 + Math.random() * 0.22,
          );
      const visual = makeBoxVisual(
        size,
        index % 6 === 0 ? 0xfff4d2 : color,
        { roughness: paper ? 0.96 : 0.8 },
      );
      const force = options.force ?? (options.mega ? 10 : 6);
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 1.25,
        0.55 + Math.random() * 0.8,
        (Math.random() - 0.5) * 1.25,
      ).normalize();
      const spawnPosition = position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.55,
        Math.random() * 0.45,
        (Math.random() - 0.5) * 0.55,
      ));
      this.spawnDynamic({
        object: visual,
        position: spawnPosition,
        halfExtents: size.clone().multiplyScalar(0.5),
        velocity: direction.multiplyScalar(force * (0.65 + Math.random() * 0.65)),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14,
        ),
        lifetime: paper ? 4.2 + Math.random() * 1.8 : 3.2 + Math.random() * 2.2,
        fadeDuration: 0.9,
        density: paper ? 0.1 : 0.9,
        restitution: paper ? 0.08 : 0.36,
        friction: paper ? 0.92 : 0.7,
        radius: size.length() * 0.48,
        damageScale: paper ? 0.2 : options.mega ? 1.1 : 0.55,
        kind: "debris",
        ccd: options.mega,
      });
    }
  }

  spawnBrokenProp(
    kind: "monitor" | "paper" | "cooler",
    position: THREE.Vector3,
    color: number,
    mega: boolean,
  ) {
    if (kind === "paper") {
      this.spawnDebrisBurst(position.clone().add(new THREE.Vector3(0, 0.45, 0)), color, 18, {
        force: mega ? 11 : 7,
        paper: true,
        mega,
      });
      return;
    }

    const chunkSizes = kind === "cooler"
      ? [
          new THREE.Vector3(0.62, 0.76, 0.58),
          new THREE.Vector3(0.42, 0.28, 0.42),
          new THREE.Vector3(0.3, 0.22, 0.3),
        ]
      : [
          new THREE.Vector3(0.82, 0.48, 0.16),
          new THREE.Vector3(0.2, 0.58, 0.2),
          new THREE.Vector3(0.5, 0.12, 0.34),
        ];
    chunkSizes.forEach((size, index) => {
      const visual = makeBoxVisual(size, index === 0 ? color : index === 1 ? 0x384954 : 0xffffff, {
        emissive: index === 0 ? color : undefined,
      });
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 1.4,
        0.6 + Math.random() * 0.7,
        (Math.random() - 0.5) * 1.4,
      ).normalize();
      this.spawnDynamic({
        object: visual,
        position: position.clone().add(new THREE.Vector3(
          (index - 1) * 0.18,
          0.34 + index * 0.2,
          (Math.random() - 0.5) * 0.25,
        )),
        halfExtents: size.clone().multiplyScalar(0.5),
        velocity: direction.multiplyScalar((mega ? 11 : 6.6) * (1 - index * 0.08)),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 11,
          (Math.random() - 0.5) * 11,
          (Math.random() - 0.5) * 11,
        ),
        lifetime: mega ? 7 : 5.6,
        fadeDuration: 1.1,
        density: kind === "cooler" ? 1.25 : 0.88,
        restitution: kind === "cooler" ? 0.28 : 0.2,
        friction: 0.68,
        radius: size.length() * 0.52,
        damageScale: kind === "cooler" ? 1.35 : 1.05,
        kind: "debris",
        ccd: mega,
      });
    });
    this.spawnDebrisBurst(position.clone().add(new THREE.Vector3(0, 0.5, 0)), color, mega ? 16 : 9, {
      force: mega ? 10 : 5.8,
      mega,
    });
  }

  blast(center: THREE.Vector3, radius: number, force: number, upward = 0.55) {
    this.ecs.query(PhysicsNode, DynamicBody).readEach(([node]) => {
      const translation = node.body.translation();
      const delta = new THREE.Vector3(
        translation.x - center.x,
        translation.y - center.y,
        translation.z - center.z,
      );
      const distance = delta.length();
      if (distance > radius) return;
      if (distance < 0.08) delta.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      delta.normalize();
      const falloff = Math.max(0.12, 1 - distance / radius);
      node.body.applyImpulse({
        x: delta.x * force * falloff,
        y: force * (upward + falloff * 0.3),
        z: delta.z * force * falloff,
      }, true);
      node.body.applyTorqueImpulse({
        x: (Math.random() - 0.5) * force * 0.32,
        y: (Math.random() - 0.5) * force * 0.5,
        z: (Math.random() - 0.5) * force * 0.32,
      }, true);
    });
  }

  pushFromPlayer(position: THREE.Vector3, direction: THREE.Vector3, force: number) {
    if (direction.lengthSq() < 0.01) return;
    const movement = direction.clone().setY(0).normalize();
    this.ecs.query(PhysicsNode, LooseOfficeProp).readEach(([node]) => {
      const translation = node.body.translation();
      const dx = translation.x - position.x;
      const dz = translation.z - position.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq > 1.25 * 1.25) return;
      node.body.applyImpulse({
        x: movement.x * force,
        y: 0.12,
        z: movement.z * force,
      }, true);
    });
  }

  collectKineticImpacts(time: number): PhysicsImpact[] {
    const impacts: PhysicsImpact[] = [];
    this.ecs.query(PhysicsNode, KineticDamage).readEach(([node]) => {
      if (time - node.lastImpactAt < 0.24 || node.body.isSleeping()) return;
      const velocity = node.body.linvel();
      const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
      if (speed < (node.kind === "debris" ? 5.8 : 3.6)) return;
      const translation = node.body.translation();
      if (translation.y > 2.7 || translation.y < -0.2) return;
      impacts.push({
        position: new THREE.Vector3(translation.x, translation.y, translation.z),
        speed,
        radius: node.radius,
        damageScale: node.damageScale,
        kind: node.kind,
        consume: () => {
          node.lastImpactAt = time;
          node.body.applyImpulse({
            x: -velocity.x * node.body.mass() * 0.08,
            y: Math.abs(velocity.y) * node.body.mass() * 0.04,
            z: -velocity.z * node.body.mass() * 0.08,
          }, true);
        },
      });
    });
    return impacts.slice(0, 12);
  }

  step(dt: number) {
    this.elapsed += dt;
    this.accumulator = Math.min(this.accumulator + dt, FIXED_STEP * 4);
    while (this.accumulator >= FIXED_STEP) {
      this.physics.step();
      this.accumulator -= FIXED_STEP;
    }

    const expired: Entity[] = [];
    this.ecs.query(PhysicsNode, DynamicBody).updateEach(([node], entity) => {
      node.age += dt;
      const translation = node.body.translation();
      const rotation = node.body.rotation();
      node.object.position.set(translation.x, translation.y, translation.z);
      node.object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      if (node.lifetime > 0 && node.age >= node.lifetime - node.fadeDuration) {
        const opacity = THREE.MathUtils.clamp(
          (node.lifetime - node.age) / Math.max(0.01, node.fadeDuration),
          0,
          1,
        );
        setObjectOpacity(node.object, opacity);
      }
      if (
        node.age >= node.lifetime
        || translation.y < -3
        || Math.abs(translation.x) > 28
        || Math.abs(translation.z) > 32
      ) {
        expired.push(entity);
      }
    }, { changeDetection: "never" });
    expired.forEach((entity) => this.removeEntity(entity));
  }

  getStats(): OfficePhysicsStats {
    let moving = 0;
    let sleeping = 0;
    const bodies = this.ecs.query(PhysicsNode, DynamicBody);
    bodies.readEach(([node]) => {
      if (node.body.isSleeping()) sleeping += 1;
      else {
        const velocity = node.body.linvel();
        if (Math.hypot(velocity.x, velocity.y, velocity.z) > 0.35) moving += 1;
      }
    });
    return { bodies: bodies.length, moving, sleeping };
  }

  clear() {
    [...this.ecs.query(PhysicsNode)].forEach((entity) => this.removeEntity(entity));
    this.accumulator = 0;
  }

  dispose() {
    this.clear();
    this.physics.free();
  }
}
