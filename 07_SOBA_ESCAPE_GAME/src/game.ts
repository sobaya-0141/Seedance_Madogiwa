import * as THREE from "three";
import { SOBAYA } from "./characters";
import {
  BOUNDS,
  COLLIDERS,
  ENEMIES,
  EXIT,
  OBSTACLES,
  OUTER_WALLS,
  PLAYER_START,
  type Box,
  type EnemyConfig,
} from "./level";
import { collideBoxes, hasLineOfSight } from "./geom";
import { Radar, type RadarSnapshot } from "./radar";
import { loadVoxelCharacter, type VoxelActionController } from "./voxel-character-kit";

export type GameState = "ready" | "playing" | "caught" | "won";

type Actor = {
  x: number;
  z: number;
  facing: number;
  faceOffset: number;
  moving: boolean;
  model?: THREE.Group;
  actions?: VoxelActionController;
};

type Enemy = Actor & {
  cfg: EnemyConfig;
  segIndex: number;
  dir: number;
  sweepPhase: number;
  alerted: boolean;
};

const PLAYER_RADIUS = 0.85;
const PLAYER_SPEED = 6.2;
const PLAYER_SNEAK_SPEED = 3.1;

// Detection tuning.
const DETECT_BASE_RATE = 0.55; // per second at the edge of a cone
const DETECT_NEAR_BONUS = 0.85; // extra per second when right on top of you
const DETECT_DECAY = 0.7; // per second while unseen

export type GameCallbacks = {
  onState: (state: GameState) => void;
  onDetection: (level: number, seer: string | null) => void;
  onLoaded: () => void;
};

export class Game {
  private scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private radar: Radar;

  private player: Actor;
  private enemies: Enemy[] = [];

  private input = new THREE.Vector2(); // x = east, y = south (world +z)
  private sneaking = false;
  private detection = 0;
  private state: GameState = "ready";
  private elapsed = 0;
  private modelsToLoad = 0;
  private modelsLoaded = 0;
  private rafId = 0;
  private exitMarker?: THREE.Object3D;

  constructor(
    private host: HTMLElement,
    radarCanvas: HTMLCanvasElement,
    private cb: GameCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      46,
      host.clientWidth / host.clientHeight,
      0.1,
      500,
    );

    this.radar = new Radar(radarCanvas);

    this.player = {
      x: PLAYER_START.x,
      z: PLAYER_START.z,
      facing: 0,
      faceOffset: SOBAYA.faceOffset,
      moving: false,
    };

    this.buildScene();
    this.loadCharacters();
    window.addEventListener("resize", this.handleResize);
  }

  // ---- setup ---------------------------------------------------------------

  private buildScene() {
    this.scene.background = new THREE.Color("#0a1712");
    this.scene.fog = new THREE.Fog("#0a1712", 45, 90);

    const hemi = new THREE.HemisphereLight("#cfe8ff", "#1b2a22", 0.85);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight("#fff2d8", 1.15);
    key.position.set(18, 34, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const s = 40;
    key.shadow.camera.left = -s;
    key.shadow.camera.right = s;
    key.shadow.camera.top = s;
    key.shadow.camera.bottom = -s;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 120;
    key.shadow.bias = -0.0004;
    this.scene.add(key);

    // Floor.
    const floorW = BOUNDS.xMax - BOUNDS.xMin;
    const floorD = BOUNDS.zMax - BOUNDS.zMin;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorW, floorD),
      new THREE.MeshStandardMaterial({ color: "#16241d", roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Carpet grid for a bit of texture.
    const grid = new THREE.GridHelper(Math.max(floorW, floorD), 22, "#25473a", "#1c3529");
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Walls (tall) and furniture (shorter).
    const wallMat = new THREE.MeshStandardMaterial({ color: "#31473c", roughness: 0.85 });
    const deskMat = new THREE.MeshStandardMaterial({ color: "#2b5344", roughness: 0.8 });
    for (const b of OUTER_WALLS) this.addBox(b, 4, wallMat);
    for (const b of OBSTACLES) this.addBox(b, 1.9, deskMat);

    this.buildExit();
  }

  private addBox(b: Box, height: number, mat: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, height, b.d), mat);
    mesh.position.set(b.x, height / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  private buildExit() {
    const group = new THREE.Group();
    // Glowing floor pad.
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(EXIT.w, EXIT.d + 1),
      new THREE.MeshBasicMaterial({ color: "#5effa6", transparent: true, opacity: 0.4 }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(EXIT.x, 0.05, EXIT.z + 0.5);
    group.add(pad);

    // Portal frame in the wall gap.
    const frameMat = new THREE.MeshStandardMaterial({
      color: "#8dffc0",
      emissive: "#3bd982",
      emissiveIntensity: 1.4,
      roughness: 0.4,
    });
    const post = new THREE.BoxGeometry(0.5, 5, 0.5);
    const left = new THREE.Mesh(post, frameMat);
    left.position.set(EXIT.x - EXIT.w / 2, 2.5, EXIT.z);
    const right = new THREE.Mesh(post, frameMat);
    right.position.set(EXIT.x + EXIT.w / 2, 2.5, EXIT.z);
    const top = new THREE.Mesh(new THREE.BoxGeometry(EXIT.w + 0.5, 0.5, 0.5), frameMat);
    top.position.set(EXIT.x, 5, EXIT.z);
    group.add(left, right, top);

    const light = new THREE.PointLight("#5effa6", 40, 30, 2);
    light.position.set(EXIT.x, 3, EXIT.z + 1);
    group.add(light);

    this.scene.add(group);
    this.exitMarker = group;
  }

  private loadCharacters() {
    // Player.
    this.modelsToLoad = 1 + ENEMIES.length;
    loadVoxelCharacter({
      definition: SOBAYA.def,
      parent: this.scene,
      onReady: (loaded) => {
        this.player.model = loaded.model;
        this.player.actions = loaded.actions;
        loaded.model.position.set(this.player.x, 0, this.player.z);
        this.markLoaded();
      },
      onError: (e) => console.error("failed to load sobaya", e),
    });

    // Enemies.
    for (const cfg of ENEMIES) {
      const enemy: Enemy = {
        cfg,
        x: cfg.kind === "camera" ? cfg.at.x : cfg.points[0].x,
        z: cfg.kind === "camera" ? cfg.at.z : cfg.points[0].z,
        facing: cfg.kind === "camera" ? cfg.baseFacing : 0,
        faceOffset: cfg.meta.faceOffset,
        moving: false,
        segIndex: cfg.kind === "patrol" ? 1 % cfg.points.length : 0,
        dir: 1,
        sweepPhase: 0,
        alerted: false,
      } as Enemy;
      this.enemies.push(enemy);
      loadVoxelCharacter({
        definition: cfg.meta.def,
        parent: this.scene,
        onReady: (loaded) => {
          enemy.model = loaded.model;
          enemy.actions = loaded.actions;
          loaded.model.position.set(enemy.x, 0, enemy.z);
          this.markLoaded();
        },
        onError: (e) => console.error(`failed to load ${cfg.meta.def.id}`, e),
      });
    }
  }

  private markLoaded() {
    this.modelsLoaded += 1;
    if (this.modelsLoaded >= this.modelsToLoad) {
      this.cb.onLoaded();
    }
  }

  // ---- lifecycle -----------------------------------------------------------

  start() {
    this.reset();
    this.state = "playing";
    this.cb.onState(this.state);
    this.clock.start();
    if (!this.rafId) this.loop();
  }

  reset() {
    this.player.x = PLAYER_START.x;
    this.player.z = PLAYER_START.z;
    this.player.facing = 0;
    this.detection = 0;
    this.elapsed = 0;
    for (const e of this.enemies) {
      if (e.cfg.kind === "patrol") {
        e.x = e.cfg.points[0].x;
        e.z = e.cfg.points[0].z;
        e.segIndex = 1 % e.cfg.points.length;
      } else {
        e.x = e.cfg.at.x;
        e.z = e.cfg.at.z;
        e.facing = e.cfg.baseFacing;
      }
      e.dir = 1;
      e.sweepPhase = 0;
      e.alerted = false;
    }
    this.cb.onDetection(0, null);
  }

  setInput(x: number, z: number) {
    this.input.set(x, z);
  }
  setSneaking(v: boolean) {
    this.sneaking = v;
  }

  private loop = () => {
    this.rafId = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  // ---- per-frame update ----------------------------------------------------

  private update(dt: number) {
    if (this.state === "playing") {
      this.elapsed += dt;
      this.updatePlayer(dt);
      this.updateEnemies(dt);
      this.updateDetection(dt);
      this.checkExit();
    }
    this.syncModels(dt);
    this.updateCamera(dt);
    this.radar.draw(this.snapshot());
  }

  private updatePlayer(dt: number) {
    const len = this.input.length();
    this.player.moving = len > 0.05;
    if (this.player.moving) {
      const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
      const nx = this.player.x + (this.input.x / Math.max(len, 1)) * speed * dt;
      const nz = this.player.z + (this.input.y / Math.max(len, 1)) * speed * dt;
      const resolved = collideBoxes(nx, nz, PLAYER_RADIUS, COLLIDERS);
      this.player.x = THREE.MathUtils.clamp(resolved.x, BOUNDS.xMin + 1, BOUNDS.xMax - 1);
      this.player.z = THREE.MathUtils.clamp(resolved.z, BOUNDS.zMin + 1, BOUNDS.zMax);
      this.player.facing = Math.atan2(this.input.x, this.input.y);
    }
  }

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      if (e.cfg.kind === "camera") {
        e.sweepPhase += e.cfg.sweepSpeed * dt;
        e.facing = e.cfg.baseFacing + Math.sin(e.sweepPhase) * e.cfg.sweepAmp;
        e.moving = false;
        continue;
      }
      const pts = e.cfg.points;
      const target = pts[e.segIndex];
      const dx = target.x - e.x;
      const dz = target.z - e.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.15) {
        // Advance ping-pong index.
        let next = e.segIndex + e.dir;
        if (next >= pts.length || next < 0) {
          e.dir *= -1;
          next = e.segIndex + e.dir;
        }
        e.segIndex = next;
        e.moving = false;
      } else {
        const step = Math.min(e.cfg.speed * dt, dist);
        e.x += (dx / dist) * step;
        e.z += (dz / dist) * step;
        e.moving = true;
        // Smoothly turn toward travel direction.
        const targetFacing = Math.atan2(dx, dz);
        e.facing = turnToward(e.facing, targetFacing, 8 * dt);
      }
    }
  }

  private seesPlayer(e: Enemy): number {
    const range = e.cfg.range;
    const dx = this.player.x - e.x;
    const dz = this.player.z - e.z;
    const dist = Math.hypot(dx, dz);
    if (dist > range || dist < 0.001) return 0;
    const forwardX = Math.sin(e.facing);
    const forwardZ = Math.cos(e.facing);
    const dot = (dx * forwardX + dz * forwardZ) / dist;
    const cosHalf = Math.cos(e.cfg.fov / 2);
    if (dot < cosHalf) return 0;
    // Eye height a bit up; test on the floor plane against furniture + walls.
    if (!hasLineOfSight(e.x, e.z, this.player.x, this.player.z, COLLIDERS)) return 0;
    return 1 - dist / range; // 0 (edge) .. ~1 (point blank)
  }

  private updateDetection(dt: number) {
    let bestStrength = 0;
    let seer: string | null = null;
    for (const e of this.enemies) {
      const strength = this.seesPlayer(e);
      e.alerted = strength > 0;
      if (strength > bestStrength) {
        bestStrength = strength;
        seer = e.cfg.meta.label;
      }
    }
    if (bestStrength > 0) {
      this.detection += (DETECT_BASE_RATE + DETECT_NEAR_BONUS * bestStrength) * dt;
    } else {
      this.detection -= DETECT_DECAY * dt;
    }
    this.detection = THREE.MathUtils.clamp(this.detection, 0, 1);
    this.cb.onDetection(this.detection, bestStrength > 0 ? seer : null);
    if (this.detection >= 1) {
      this.state = "caught";
      this.cb.onState(this.state);
    }
  }

  private checkExit() {
    const inX = Math.abs(this.player.x - EXIT.x) < EXIT.w / 2;
    const inZ = this.player.z < EXIT.z + EXIT.d / 2;
    if (inX && inZ) {
      this.state = "won";
      this.cb.onState(this.state);
    }
  }

  private syncModels(dt: number) {
    const elapsed = this.elapsed;
    const sync = (a: Actor) => {
      if (!a.model) return;
      a.model.position.x = a.x;
      a.model.position.z = a.z;
      a.model.rotation.y = a.facing + a.faceOffset;
      a.actions?.update(dt, elapsed, a.moving && this.state === "playing");
    };
    sync(this.player);
    for (const e of this.enemies) sync(e);
    if (this.exitMarker) {
      const pulse = 0.9 + Math.sin(elapsed * 3) * 0.1;
      this.exitMarker.scale.setScalar(pulse * 0.02 + 0.99);
    }
  }

  private updateCamera(dt: number) {
    const target = new THREE.Vector3(this.player.x, 1.4, this.player.z);
    const desired = new THREE.Vector3(this.player.x, 26, this.player.z + 17);
    const t = 1 - Math.exp(-dt * 6);
    this.camera.position.lerp(desired, t);
    this.camera.lookAt(target);
  }

  private snapshot(): RadarSnapshot {
    return {
      player: { x: this.player.x, z: this.player.z, facing: this.player.facing },
      enemies: this.enemies.map((e) => ({
        x: e.x,
        z: e.z,
        facing: e.facing,
        fov: e.cfg.fov,
        range: e.cfg.range,
        color: e.cfg.meta.radarColor,
        alerted: e.alerted,
      })),
    };
  }

  private handleResize = () => {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.radar.resize();
  };

  dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
  }
}

function turnToward(current: number, target: number, maxStep: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}
