import * as THREE from "three";
import { SOBAYA, YUMEMIN, type CharacterMeta } from "./characters.js";
import { collideBoxes, hasLineOfSight } from "./geom.js";
import {
  getColliders,
  getLootCount,
  getObjectiveCount,
  type EnemyConfig,
  type ExitDefinition,
  type LevelDefinition,
  type PickupDefinition,
  type Point,
} from "./level.js";
import { Radar, type RadarSnapshot } from "./radar.js";
import {
  GADGETS,
  evaluateRun,
  type DailyMutator,
  type DifficultyDefinition,
  type DifficultyId,
  type GadgetId,
  type Rank,
} from "./rules.js";
import { loadVoxelCharacter, type VoxelActionController } from "./voxel-character-kit.js";

export type GameState = "ready" | "playing" | "paused" | "caught" | "won";
export type SoundKind = "step" | "pickup" | "alert" | "gadget" | "locked" | "win" | "caught";
export type AiState = "patrol" | "investigate" | "search" | "return";

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
  sawLastFrame: boolean;
  aiState: AiState;
  stateTimer: number;
  target: Point;
  cone: THREE.Mesh;
  indicator: THREE.Mesh;
  alertGauge: AlertGauge;
  returnStartDistance: number;
};

type AlertGauge = {
  group: THREE.Group;
  fill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
};

type PickupRuntime = {
  definition: PickupDefinition;
  collected: boolean;
  group: THREE.Group;
  texture: THREE.CanvasTexture;
};

type ExitRuntime = {
  definition: ExitDefinition;
  unlocked: boolean;
  group: THREE.Group;
  padMaterial: THREE.MeshBasicMaterial;
  frameMaterial: THREE.MeshStandardMaterial;
  light: THREE.PointLight;
};

type NoiseRuntime = {
  x: number;
  z: number;
  radius: number;
  life: number;
  maxLife: number;
  ring: THREE.Mesh;
};

export type GadgetHud = {
  id: GadgetId;
  name: string;
  shortName: string;
  key: string;
  charges: number;
  unlimited: boolean;
  color: string;
  active: boolean;
};

export type HudSnapshot = {
  elapsed: number;
  objectiveDone: number;
  objectiveTotal: number;
  loot: number;
  totalLoot: number;
  noise: "無音" | "小" | "中" | "大";
  hidden: boolean;
  safeToReveal: boolean;
  aiState: string;
  gadgets: GadgetHud[];
};

export type RunSummary = {
  levelId: string;
  difficultyId: DifficultyId;
  elapsed: number;
  objectives: number;
  totalObjectives: number;
  loot: number;
  totalLoot: number;
  sightings: number;
  maxDetection: number;
  secretExit: boolean;
  score: number;
  rank: Rank;
  stamps: number;
  bonuses: string[];
  perfect: boolean;
};

export type GameCallbacks = {
  onState: (state: GameState, summary?: RunSummary) => void;
  onDetection: (
    level: number,
    seer: CharacterMeta | null,
    activelySeen: boolean,
  ) => void;
  onHud: (snapshot: HudSnapshot) => void;
  onToast: (message: string, tone?: "info" | "warning" | "success") => void;
  onSound: (kind: SoundKind) => void;
  onLoaded: () => void;
};

const PLAYER_RADIUS = 0.82;
const PLAYER_SPEED = 6.1;
const PLAYER_SNEAK_SPEED = 3;
const PICKUP_RADIUS = 1.35;
const DETECT_BASE_RATE = 0.46;
const DETECT_NEAR_BONUS = 0.78;
const DETECT_DECAY = 0.54;

export class Game {
  private scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private radar: Radar;
  private colliders: ReturnType<typeof getColliders>;

  private player: Actor;
  private enemies: Enemy[] = [];
  private pickups: PickupRuntime[] = [];
  private exits: ExitRuntime[] = [];
  private noises: NoiseRuntime[] = [];
  private cardboardBox: THREE.Group;

  private input = new THREE.Vector2();
  private sneaking = false;
  private detection = 0;
  private state: GameState = "ready";
  private elapsed = 0;
  private maxDetection = 0;
  private sightings = 0;
  private lastFootstep = -10;
  private lastLockedToast = -10;
  private hiddenUntil = -1;
  private gadgetCooldownUntil = -1;
  private cardboardUsesRemaining = Number.POSITIVE_INFINITY;
  private lingeringSeer: CharacterMeta | null = null;
  private modelsToLoad = 0;
  private modelsLoaded = 0;
  private rafId = 0;
  private disposed = false;

  constructor(
    private host: HTMLElement,
    radarCanvas: HTMLCanvasElement,
    private level: LevelDefinition,
    private mutator: DailyMutator,
    private difficulty: DifficultyDefinition,
    private cb: GameCallbacks,
  ) {
    this.colliders = getColliders(level);
    this.resetCardboardUses();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      host.clientWidth / Math.max(host.clientHeight, 1),
      0.1,
      500,
    );
    this.radar = new Radar(radarCanvas, level);
    this.player = {
      x: level.playerStart.x,
      z: level.playerStart.z,
      facing: 0,
      faceOffset: SOBAYA.faceOffset,
      moving: false,
    };
    this.cardboardBox = this.makeCardboardBox();
    this.buildScene();
    this.loadCharacters();
    window.addEventListener("resize", this.handleResize);
    this.loop();
  }

  private buildScene() {
    this.scene.background = new THREE.Color(this.level.palette.background);
    this.scene.fog = new THREE.Fog(this.level.palette.fog, 42, 86);

    const hemi = new THREE.HemisphereLight("#d8edff", this.level.palette.background, 1.15);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight("#fff4d8", 2.3);
    key.position.set(18, 34, 14);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -40;
    key.shadow.camera.right = 40;
    key.shadow.camera.top = 40;
    key.shadow.camera.bottom = -40;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 120;
    key.shadow.bias = -0.00045;
    this.scene.add(key);

    const floorW = this.level.bounds.xMax - this.level.bounds.xMin;
    const floorD = this.level.bounds.zMax - this.level.bounds.zMin;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorW, floorD),
      new THREE.MeshStandardMaterial({
        color: this.level.palette.floor,
        roughness: 0.94,
        metalness: this.level.id === "server-floor" ? 0.18 : 0,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(
      Math.max(floorW, floorD),
      22,
      this.level.palette.accent,
      this.level.palette.grid,
    );
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    for (const material of gridMaterials) {
      material.transparent = true;
      material.opacity = 0.2;
    }
    grid.position.y = 0.018;
    this.scene.add(grid);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: this.level.palette.wall,
      roughness: 0.82,
    });
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: this.level.palette.obstacle,
      roughness: 0.75,
    });
    for (const box of this.level.outerWalls) this.addBox(box, 4, wallMaterial, true);
    for (const box of this.level.obstacles) this.addBox(box, 1.9, obstacleMaterial, false);

    this.buildCeilingLights();
    this.buildPickups();
    this.buildExits();
    this.scene.add(this.cardboardBox);
  }

  private addBox(
    box: { x: number; z: number; w: number; d: number },
    height: number,
    material: THREE.Material,
    wall: boolean,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(box.w, height, box.d), material);
    mesh.position.set(box.x, height / 2, box.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    if (!wall && box.w > 5) {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(0.2, box.w - 0.45), 0.08, Math.max(0.2, box.d - 0.25)),
        new THREE.MeshBasicMaterial({
          color: this.level.palette.accent,
          transparent: true,
          opacity: 0.34,
        }),
      );
      trim.position.set(box.x, height + 0.045, box.z);
      this.scene.add(trim);
    }
  }

  private buildCeilingLights() {
    for (const x of [-14, 0, 14]) {
      for (const z of [-12, 0, 12]) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(5.2, 0.08, 0.38),
          new THREE.MeshBasicMaterial({
            color: this.level.palette.accent,
            transparent: true,
            opacity: this.level.id === "server-floor" ? 0.35 : 0.55,
          }),
        );
        panel.position.set(x, 5.5, z);
        this.scene.add(panel);
      }
    }
  }

  private buildPickups() {
    for (const definition of this.level.pickups) {
      const group = new THREE.Group();
      const texture = makePickupTexture(definition);
      const cardMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: false,
        toneMapped: false,
      });
      const cardGeometry = new THREE.PlaneGeometry(2.15, 2.15);
      const front = new THREE.Mesh(cardGeometry, cardMaterial);
      front.position.set(0, 1.48, 0.035);
      const back = new THREE.Mesh(cardGeometry, cardMaterial);
      back.position.set(0, 1.48, -0.035);
      back.rotation.y = Math.PI;
      group.add(front, back);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.065, 8, 32),
        new THREE.MeshBasicMaterial({
          color: definition.color,
          transparent: true,
          opacity: 0.78,
        }),
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.18;
      group.add(halo);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.42, 2.8, 12, 1, true),
        new THREE.MeshBasicMaterial({
          color: definition.color,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      beam.position.y = 1.4;
      group.add(beam);
      const glow = new THREE.PointLight(definition.color, 8, 5, 2);
      glow.position.y = 1.3;
      group.add(glow);
      group.position.set(definition.at.x, 0, definition.at.z);
      this.scene.add(group);
      this.pickups.push({ definition, collected: false, group, texture });
    }
  }

  private buildExits() {
    for (const definition of this.level.exits) {
      const group = new THREE.Group();
      const color = definition.secret ? "#ffc05c" : "#5effa6";
      const padMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.26,
      });
      const pad = new THREE.Mesh(
        new THREE.PlaneGeometry(definition.size.w, definition.size.d),
        padMaterial,
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.055;
      group.add(pad);

      const frameMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.1,
        roughness: 0.38,
      });
      const postGeometry = new THREE.BoxGeometry(0.38, 3.9, 0.38);
      const left = new THREE.Mesh(postGeometry, frameMaterial);
      left.position.set(-definition.size.w / 2, 1.95, 0);
      const right = new THREE.Mesh(postGeometry, frameMaterial);
      right.position.set(definition.size.w / 2, 1.95, 0);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(definition.size.w + 0.35, 0.38, 0.38),
        frameMaterial,
      );
      top.position.set(0, 3.9, 0);
      group.add(left, right, top);
      const light = new THREE.PointLight(color, 26, 18, 2);
      light.position.set(0, 2.2, 1);
      group.add(light);
      group.position.set(definition.at.x, 0, definition.at.z);
      this.scene.add(group);
      this.exits.push({
        definition,
        unlocked: false,
        group,
        padMaterial,
        frameMaterial,
        light,
      });
    }
    this.updateExitState();
  }

  private makeCardboardBox() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: "#b87b3f", roughness: 0.95 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.2, 1.7), material);
    box.position.y = 1.08;
    box.castShadow = true;
    group.add(box);
    const tape = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 2.24, 1.74),
      new THREE.MeshStandardMaterial({ color: "#e0bc7a", roughness: 0.9 }),
    );
    tape.position.y = 1.08;
    group.add(tape);
    group.visible = false;
    return group;
  }

  private loadCharacters() {
    this.modelsToLoad = 1 + this.level.enemies.length;
    loadVoxelCharacter({
      definition: SOBAYA.def,
      parent: this.scene,
      onReady: (loaded) => {
        if (this.disposed) return;
        this.player.model = loaded.model;
        this.player.actions = loaded.actions;
        loaded.model.position.set(this.player.x, 0, this.player.z);
        this.markLoaded();
      },
      onError: (error) => {
        console.error("failed to load sobaya", error);
        this.markLoaded();
      },
    });

    for (const config of this.level.enemies) {
      const x = config.kind === "camera" ? config.at.x : config.points[0].x;
      const z = config.kind === "camera" ? config.at.z : config.points[0].z;
      const cone = makeVisionCone(
        config.range * this.mutator.rangeMultiplier,
        config.fov,
        "#5effa6",
      );
      const indicator = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28),
        new THREE.MeshBasicMaterial({ color: "#5effa6" }),
      );
      indicator.position.set(x, 4.4, z);
      const alertGauge = makeAlertGauge();
      this.scene.add(cone, indicator, alertGauge.group);
      const enemy: Enemy = {
        cfg: config,
        x,
        z,
        facing: config.kind === "camera" ? config.baseFacing : 0,
        faceOffset: config.meta.faceOffset,
        moving: false,
        segIndex: config.kind === "patrol" ? 1 % config.points.length : 0,
        dir: 1,
        sweepPhase: 0,
        alerted: false,
        sawLastFrame: false,
        aiState: "patrol",
        stateTimer: 0,
        target: { x, z },
        cone,
        indicator,
        alertGauge,
        returnStartDistance: 1,
      };
      this.enemies.push(enemy);
      loadVoxelCharacter({
        definition: config.meta.def,
        parent: this.scene,
        onReady: (loaded) => {
          if (this.disposed) return;
          enemy.model = loaded.model;
          enemy.actions = loaded.actions;
          loaded.model.position.set(enemy.x, 0, enemy.z);
          this.markLoaded();
        },
        onError: (error) => {
          console.error(`failed to load ${config.meta.def.id}`, error);
          this.markLoaded();
        },
      });
    }
  }

  private markLoaded() {
    this.modelsLoaded += 1;
    if (this.modelsLoaded >= this.modelsToLoad && !this.disposed) this.cb.onLoaded();
  }

  start() {
    this.reset();
    this.state = "playing";
    this.cb.onState(this.state);
    this.clock.start();
    this.emitHud();
  }

  reset() {
    this.player.x = this.level.playerStart.x;
    this.player.z = this.level.playerStart.z;
    this.player.facing = 0;
    this.player.moving = false;
    this.detection = 0;
    this.elapsed = 0;
    this.maxDetection = 0;
    this.sightings = 0;
    this.lastFootstep = -10;
    this.lastLockedToast = -10;
    this.hiddenUntil = -1;
    this.gadgetCooldownUntil = -1;
    this.cardboardBox.visible = false;
    this.lingeringSeer = null;
    this.resetCardboardUses();
    for (const pickup of this.pickups) {
      pickup.collected = false;
      pickup.group.visible = true;
    }
    for (const noise of this.noises) this.scene.remove(noise.ring);
    this.noises = [];
    for (const enemy of this.enemies) {
      const config = enemy.cfg;
      if (config.kind === "patrol") {
        enemy.x = config.points[0].x;
        enemy.z = config.points[0].z;
        enemy.segIndex = 1 % config.points.length;
      } else {
        enemy.x = config.at.x;
        enemy.z = config.at.z;
        enemy.facing = config.baseFacing;
      }
      enemy.dir = 1;
      enemy.sweepPhase = 0;
      enemy.alerted = false;
      enemy.sawLastFrame = false;
      enemy.aiState = "patrol";
      enemy.stateTimer = 0;
      enemy.target = { x: enemy.x, z: enemy.z };
      enemy.returnStartDistance = 1;
      enemy.alertGauge.group.visible = false;
    }
    this.updateExitState();
    this.cb.onDetection(0, null, false);
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.cb.onState(this.state);
    } else if (this.state === "paused") {
      this.state = "playing";
      this.clock.getDelta();
      this.cb.onState(this.state);
    }
  }

  setInput(x: number, z: number) {
    this.input.set(x, z);
  }

  setSneaking(value: boolean) {
    this.sneaking = value;
  }

  useGadget() {
    if (this.state !== "playing" || this.elapsed < this.gadgetCooldownUntil) return;
    const hidden = this.elapsed < this.hiddenUntil;
    this.gadgetCooldownUntil = this.elapsed + 0.25;

    if (hidden) {
      const safeToReveal = this.isSafeToReveal();
      this.cb.onSound("gadget");
      this.hiddenUntil = -1;
      this.cardboardBox.visible = false;
      this.cb.onToast(
        safeToReveal
          ? "警戒解除を確認 — 段ボールを解除した"
          : "まだ警戒中！ 周囲の視界に注意",
        safeToReveal ? "success" : "warning",
      );
      this.emitHud();
      return;
    }

    if (this.cardboardUsesRemaining <= 0) {
      this.cb.onToast("フライング退社の段ボールは3回まで", "warning");
      return;
    }

    this.cb.onSound("gadget");
    if (Number.isFinite(this.cardboardUsesRemaining)) this.cardboardUsesRemaining -= 1;
    this.hiddenUntil = Number.POSITIVE_INFINITY;
    this.cardboardBox.visible = true;
    this.input.set(0, 0);
    this.cb.onToast("頭上の警戒ゲージが全て消えたら解除チャンス", "success");
    this.emitHud();
  }

  private resetCardboardUses() {
    this.cardboardUsesRemaining = this.difficulty.cardboardUses
      ?? Number.POSITIVE_INFINITY;
  }

  private loop = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number) {
    if (this.state === "playing") {
      this.elapsed += dt;
      this.updatePlayer(dt);
      this.updateEnemies(dt);
      this.updateDetection(dt);
      this.updatePickups();
      this.updateExits();
      this.updateNoises(dt);
      this.emitHud();
    }
    this.syncModels(dt);
    this.updateSceneEffects(dt);
    this.updateCamera(dt);
    this.radar.draw(this.snapshot());
  }

  private updatePlayer(dt: number) {
    const hidden = this.elapsed < this.hiddenUntil;
    this.cardboardBox.visible = hidden;
    this.cardboardBox.position.set(this.player.x, 0, this.player.z);
    if (hidden) {
      this.player.moving = false;
      return;
    }

    const len = this.input.length();
    this.player.moving = len > 0.05;
    if (!this.player.moving) return;

    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    const nx = this.player.x + (this.input.x / Math.max(len, 1)) * speed * dt;
    const nz = this.player.z + (this.input.y / Math.max(len, 1)) * speed * dt;
    const resolved = collideBoxes(nx, nz, PLAYER_RADIUS, this.colliders);
    this.player.x = THREE.MathUtils.clamp(
      resolved.x,
      this.level.bounds.xMin + 1,
      this.level.bounds.xMax - 1,
    );
    this.player.z = THREE.MathUtils.clamp(
      resolved.z,
      this.level.bounds.zMin + 1,
      this.level.bounds.zMax - 1,
    );
    this.player.facing = Math.atan2(this.input.x, this.input.y);

    const stepInterval = this.sneaking ? 0.72 : 0.48;
    if (this.elapsed - this.lastFootstep >= stepInterval) {
      this.lastFootstep = this.elapsed;
      const baseRadius = this.sneaking ? 1.15 : 4.6;
      this.emitNoise(
        this.player.x,
        this.player.z,
        baseRadius * this.mutator.noiseMultiplier,
        0.48,
        false,
      );
      this.cb.onSound("step");
    }
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.cfg.kind === "camera") {
        enemy.sweepPhase += enemy.cfg.sweepSpeed * dt;
        enemy.facing = enemy.cfg.baseFacing
          + Math.sin(enemy.sweepPhase) * enemy.cfg.sweepAmp;
        enemy.moving = false;
        continue;
      }

      if (enemy.aiState === "patrol") {
        const points = enemy.cfg.points;
        const target = points[enemy.segIndex];
        if (this.moveEnemyToward(enemy, target, enemy.cfg.speed, dt)) {
          let next = enemy.segIndex + enemy.dir;
          if (next >= points.length || next < 0) {
            enemy.dir *= -1;
            next = enemy.segIndex + enemy.dir;
          }
          enemy.segIndex = next;
          enemy.moving = false;
        }
      } else if (enemy.aiState === "investigate") {
        const arrived = this.moveEnemyToward(enemy, enemy.target, enemy.cfg.speed * 1.08, dt);
        if (arrived) {
          enemy.aiState = "search";
          enemy.stateTimer = 3.1;
          enemy.moving = false;
        }
      } else if (enemy.aiState === "search") {
        enemy.stateTimer -= dt;
        enemy.facing += dt * (enemy.cfg.meta === YUMEMIN ? 2.2 : 1.5);
        enemy.moving = false;
        if (enemy.stateTimer <= 0) {
          enemy.aiState = "return";
          const patrolTarget = enemy.cfg.points[enemy.segIndex];
          enemy.returnStartDistance = Math.max(
            Math.hypot(patrolTarget.x - enemy.x, patrolTarget.z - enemy.z),
            0.001,
          );
        }
      } else {
        const patrolTarget = enemy.cfg.points[enemy.segIndex];
        if (this.moveEnemyToward(enemy, patrolTarget, enemy.cfg.speed, dt)) {
          enemy.aiState = "patrol";
          enemy.moving = false;
        }
      }
    }
  }

  private moveEnemyToward(enemy: Enemy, target: Point, speed: number, dt: number) {
    const dx = target.x - enemy.x;
    const dz = target.z - enemy.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.18) return true;
    const step = Math.min(speed * this.mutator.speedMultiplier * dt, distance);
    const proposed = collideBoxes(
      enemy.x + (dx / distance) * step,
      enemy.z + (dz / distance) * step,
      0.66,
      this.colliders,
    );
    enemy.x = proposed.x;
    enemy.z = proposed.z;
    enemy.moving = true;
    enemy.facing = turnToward(enemy.facing, Math.atan2(dx, dz), 7.5 * dt);
    return distance <= step + 0.18;
  }

  private seesPlayer(enemy: Enemy, ignoreHidden = false): number {
    if (!ignoreHidden && this.elapsed < this.hiddenUntil) return 0;
    const range = enemy.cfg.range * this.mutator.rangeMultiplier;
    const dx = this.player.x - enemy.x;
    const dz = this.player.z - enemy.z;
    const distance = Math.hypot(dx, dz);
    if (distance > range || distance < 0.001) return 0;
    const forwardX = Math.sin(enemy.facing);
    const forwardZ = Math.cos(enemy.facing);
    const dot = (dx * forwardX + dz * forwardZ) / distance;
    if (dot < Math.cos(enemy.cfg.fov / 2)) return 0;
    if (!hasLineOfSight(
      enemy.x,
      enemy.z,
      this.player.x,
      this.player.z,
      this.colliders,
    )) return 0;
    return 1 - distance / range;
  }

  private updateDetection(dt: number) {
    let bestStrength = 0;
    let seer: CharacterMeta | null = null;
    for (const enemy of this.enemies) {
      const strength = this.seesPlayer(enemy);
      enemy.alerted = strength > 0;
      if (strength > 0) {
        enemy.target = { x: this.player.x, z: this.player.z };
        if (enemy.cfg.kind === "patrol") {
          enemy.aiState = "investigate";
          enemy.stateTimer = 0;
        }
        if (!enemy.sawLastFrame) {
          this.sightings += 1;
          this.cb.onSound("alert");
        }
        if (strength > bestStrength) {
          bestStrength = strength;
          seer = enemy.cfg.meta;
        }
      } else if (enemy.sawLastFrame && enemy.cfg.kind === "patrol") {
        enemy.aiState = "search";
        enemy.stateTimer = 3.5;
      }
      enemy.sawLastFrame = strength > 0;
    }

    if (bestStrength > 0) {
      const investigationPressure = this.enemies.some(
        (enemy) => enemy.aiState === "investigate",
      ) ? 1.08 : 1;
      this.detection += (
        DETECT_BASE_RATE + DETECT_NEAR_BONUS * bestStrength
      ) * investigationPressure * this.mutator.detectionMultiplier * dt;
    } else {
      this.detection -= DETECT_DECAY * dt;
    }
    this.detection = THREE.MathUtils.clamp(this.detection, 0, 1);
    this.maxDetection = Math.max(this.maxDetection, this.detection);
    if (seer) this.lingeringSeer = seer;
    const hidden = this.elapsed < this.hiddenUntil;
    const enemiesOnAlert = this.enemies.some((enemy) => (
      enemy.alerted
      || enemy.aiState !== "patrol"
      || (hidden && this.seesPlayer(enemy, true) > 0)
    ));
    if (!enemiesOnAlert) this.lingeringSeer = null;
    this.cb.onDetection(
      this.detection,
      seer ?? (enemiesOnAlert ? this.lingeringSeer : null),
      bestStrength > 0,
    );
    if (this.detection >= 1) {
      this.state = "caught";
      this.player.moving = false;
      this.cb.onSound("caught");
      this.cb.onState(this.state);
    }
  }

  private emitNoise(
    x: number,
    z: number,
    radius: number,
    life = 0.8,
    visible = true,
  ) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1, 40),
      new THREE.MeshBasicMaterial({
        color: "#ffc857",
        transparent: true,
        opacity: visible ? 0.46 : 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.08, z);
    this.scene.add(ring);
    this.noises.push({ x, z, radius, life, maxLife: life, ring });

    for (const enemy of this.enemies) {
      if (enemy.cfg.kind === "camera" || enemy.alerted) continue;
      const distance = Math.hypot(enemy.x - x, enemy.z - z);
      if (distance <= radius * enemy.cfg.hearing) {
        enemy.aiState = "investigate";
        enemy.target = { x, z };
        enemy.stateTimer = 0;
      }
    }
  }

  private updateNoises(dt: number) {
    for (let index = this.noises.length - 1; index >= 0; index -= 1) {
      const noise = this.noises[index];
      noise.life -= dt;
      const progress = 1 - noise.life / noise.maxLife;
      const scale = THREE.MathUtils.lerp(0.2, noise.radius, progress);
      noise.ring.scale.setScalar(scale);
      const material = noise.ring.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, (1 - progress) * 0.42);
      if (noise.life <= 0) {
        this.scene.remove(noise.ring);
        noise.ring.geometry.dispose();
        material.dispose();
        this.noises.splice(index, 1);
      }
    }
  }

  private updatePickups() {
    let changed = false;
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;
      const distance = Math.hypot(
        this.player.x - pickup.definition.at.x,
        this.player.z - pickup.definition.at.z,
      );
      if (distance <= PICKUP_RADIUS) {
        pickup.collected = true;
        pickup.group.visible = false;
        changed = true;
        this.cb.onSound("pickup");
        const tone = pickup.definition.kind === "objective" ? "success" : "info";
        this.cb.onToast(
          `${pickup.definition.label}を回収 — ${pickup.definition.detail}`,
          tone,
        );
      }
    }
    if (changed) this.updateExitState();
  }

  private updateExitState() {
    const objectivesDone = this.countCollected("objective");
    const loot = this.countCollected("loot");
    const objectiveTotal = getObjectiveCount(this.level);
    const totalLoot = getLootCount(this.level);
    const allItems = objectivesDone >= objectiveTotal && loot >= totalLoot;
    for (const exit of this.exits) {
      const requiresAllItems = this.difficulty.requiresAllItems
        || Boolean(exit.definition.requiresAllItems);
      const unlocked = !requiresAllItems || allItems;
      exit.unlocked = unlocked;
      const color = exit.definition.secret ? "#ffc05c" : "#5effa6";
      exit.padMaterial.color.set(unlocked ? color : "#46515b");
      exit.padMaterial.opacity = unlocked ? 0.34 : 0.13;
      exit.frameMaterial.color.set(unlocked ? color : "#46515b");
      exit.frameMaterial.emissive.set(unlocked ? color : "#111820");
      exit.frameMaterial.emissiveIntensity = unlocked ? 1.15 : 0.15;
      exit.light.color.set(unlocked ? color : "#46515b");
      exit.light.intensity = unlocked ? 26 : 4;
    }
  }

  private updateExits() {
    for (const exit of this.exits) {
      const dx = Math.abs(this.player.x - exit.definition.at.x);
      const dz = Math.abs(this.player.z - exit.definition.at.z);
      if (dx > exit.definition.size.w / 2 || dz > exit.definition.size.d / 2) continue;
      if (!exit.unlocked) {
        if (this.elapsed - this.lastLockedToast > 1.8) {
          this.lastLockedToast = this.elapsed;
          const remaining = (
            getObjectiveCount(this.level)
            + getLootCount(this.level)
            - this.countCollected("objective")
            - this.countCollected("loot")
          );
          this.cb.onSound("locked");
          const requirementLabel = this.difficulty.requiresAllItems
            ? this.difficulty.name
            : "秘密出口";
          this.cb.onToast(
            `${requirementLabel}は全アイテム回収が必要 — あと${remaining}個`,
            "warning",
          );
        }
        return;
      }
      this.finishRun(Boolean(exit.definition.secret));
      return;
    }
  }

  private finishRun(secretExit: boolean) {
    if (this.state !== "playing") return;
    this.state = "won";
    this.player.moving = false;
    const loot = this.countCollected("loot");
    const totalLoot = getLootCount(this.level);
    const objectives = this.countCollected("objective");
    const totalObjectives = getObjectiveCount(this.level);
    const evaluation = evaluateRun({
      elapsed: this.elapsed,
      parTime: this.level.parTime,
      objectives,
      totalObjectives,
      loot,
      totalLoot,
      sightings: this.sightings,
      maxDetection: this.maxDetection,
      secretExit,
      mutatorMultiplier: this.mutator.scoreMultiplier,
      difficultyMultiplier: this.difficulty.scoreMultiplier,
    });
    const summary: RunSummary = {
      levelId: this.level.id,
      difficultyId: this.difficulty.id,
      elapsed: this.elapsed,
      objectives,
      totalObjectives,
      loot,
      totalLoot,
      sightings: this.sightings,
      maxDetection: this.maxDetection,
      secretExit,
      score: evaluation.score,
      rank: evaluation.rank,
      stamps: evaluation.stamps,
      bonuses: evaluation.bonuses,
      perfect: evaluation.perfect,
    };
    this.cb.onSound("win");
    this.cb.onState(this.state, summary);
  }

  private countCollected(kind: PickupDefinition["kind"]) {
    return this.pickups.filter(
      (pickup) => pickup.definition.kind === kind && pickup.collected,
    ).length;
  }

  private isSafeToReveal() {
    return !this.enemies.some((enemy) => (
      enemy.alerted
      || enemy.aiState !== "patrol"
      || this.seesPlayer(enemy, true) > 0
    ));
  }

  private updateAlertGauge(enemy: Enemy) {
    const hidden = this.elapsed < this.hiddenUntil;
    const exposedOnReveal = hidden && this.seesPlayer(enemy, true) > 0;
    const active = enemy.alerted || enemy.aiState !== "patrol" || exposedOnReveal;
    const { group, fill } = enemy.alertGauge;
    group.visible = active;
    if (!active) return;

    group.position.set(
      enemy.x,
      enemy.cfg.kind === "camera" ? 6.05 : 5.05,
      enemy.z,
    );
    group.quaternion.copy(this.camera.quaternion);

    let progress = 1;
    let color = "#ffc857";
    if (enemy.alerted || exposedOnReveal) {
      color = "#ff5c64";
    } else if (enemy.aiState === "search") {
      progress = THREE.MathUtils.clamp(enemy.stateTimer / 3.5, 0.12, 1);
    } else if (enemy.aiState === "return" && enemy.cfg.kind === "patrol") {
      const patrolTarget = enemy.cfg.points[enemy.segIndex];
      const distance = Math.hypot(patrolTarget.x - enemy.x, patrolTarget.z - enemy.z);
      progress = 0.28 * THREE.MathUtils.clamp(
        distance / enemy.returnStartDistance,
        0.12,
        1,
      );
      color = "#55d6ff";
    }

    const maxWidth = 1.86;
    const width = maxWidth * progress;
    fill.scale.set(width, 0.12, 1);
    fill.position.x = (width - maxWidth) / 2;
    fill.material.color.set(color);
  }

  private syncModels(dt: number) {
    const sync = (actor: Actor) => {
      if (!actor.model) return;
      actor.model.position.x = actor.x;
      actor.model.position.z = actor.z;
      actor.model.rotation.y = actor.facing + actor.faceOffset;
      actor.actions?.update(dt, this.elapsed, actor.moving && this.state === "playing");
    };
    sync(this.player);
    if (this.player.model) this.player.model.visible = this.elapsed >= this.hiddenUntil;
    for (const enemy of this.enemies) {
      sync(enemy);
      enemy.cone.position.set(enemy.x, 0.045, enemy.z);
      enemy.cone.rotation.y = enemy.facing;
      enemy.indicator.position.set(enemy.x, enemy.cfg.kind === "camera" ? 5.2 : 4.25, enemy.z);
      const material = enemy.cone.material as THREE.MeshBasicMaterial;
      const indicatorMaterial = enemy.indicator.material as THREE.MeshBasicMaterial;
      const color = enemy.alerted
        ? "#ff4e4e"
        : enemy.aiState === "patrol" ? "#5effa6" : "#ffc857";
      material.color.set(color);
      material.opacity = enemy.alerted ? 0.24 : enemy.aiState === "patrol" ? 0.12 : 0.18;
      indicatorMaterial.color.set(color);
      enemy.indicator.scale.setScalar(enemy.alerted ? 1.45 : 1);
      this.updateAlertGauge(enemy);
    }
  }

  private updateSceneEffects(_dt: number) {
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;
      pickup.group.position.y = Math.sin(this.elapsed * 2.7 + pickup.definition.at.x) * 0.1;
    }
    for (const exit of this.exits) {
      const pulse = 1 + Math.sin(this.elapsed * 3.1) * 0.025;
      exit.group.scale.setScalar(pulse);
    }
    this.cardboardBox.position.set(this.player.x, 0, this.player.z);
  }

  private updateCamera(dt: number) {
    const target = new THREE.Vector3(this.player.x, 1.25, this.player.z);
    const desired = new THREE.Vector3(this.player.x, 25.5, this.player.z + 16.5);
    const t = 1 - Math.exp(-dt * 6);
    this.camera.position.lerp(desired, t);
    this.camera.lookAt(target);
  }

  private emitHud() {
    const activeAi = this.enemies.find((enemy) => enemy.alerted)
      ?? this.enemies.find((enemy) => enemy.aiState !== "patrol");
    const hidden = this.elapsed < this.hiddenUntil;
    const safeToReveal = hidden && this.isSafeToReveal();
    const noise: HudSnapshot["noise"] = hidden || !this.player.moving
      ? "無音"
      : this.sneaking ? "小" : "中";
    const stateLabel = activeAi
      ? activeAi.alerted
        ? `${activeAi.cfg.meta.label}：発見`
        : `${activeAi.cfg.meta.label}：${aiLabel(activeAi.aiState)}`
      : "全員：巡回中";
    this.cb.onHud({
      elapsed: this.elapsed,
      objectiveDone: this.countCollected("objective"),
      objectiveTotal: getObjectiveCount(this.level),
      loot: this.countCollected("loot"),
      totalLoot: getLootCount(this.level),
      noise,
      hidden,
      safeToReveal,
      aiState: stateLabel,
      gadgets: [{
        id: "cardboard",
        name: GADGETS.cardboard.name,
        shortName: GADGETS.cardboard.shortName,
        key: GADGETS.cardboard.key,
        charges: this.cardboardUsesRemaining,
        unlimited: this.difficulty.cardboardUses === null,
        color: GADGETS.cardboard.color,
        active: hidden,
      }],
    });
  }

  private snapshot(): RadarSnapshot {
    return {
      player: {
        x: this.player.x,
        z: this.player.z,
        facing: this.player.facing,
        hidden: this.elapsed < this.hiddenUntil,
      },
      enemies: this.enemies.map((enemy) => ({
        x: enemy.x,
        z: enemy.z,
        facing: enemy.facing,
        fov: enemy.cfg.fov,
        range: enemy.cfg.range * this.mutator.rangeMultiplier,
        color: enemy.cfg.meta.radarColor,
        alerted: enemy.alerted,
        investigating: enemy.aiState !== "patrol",
      })),
      pickups: this.pickups.map((pickup) => ({
        x: pickup.definition.at.x,
        z: pickup.definition.at.z,
        kind: pickup.definition.kind,
        collected: pickup.collected,
      })),
      exits: this.exits.map((exit) => ({
        box: {
          x: exit.definition.at.x,
          z: exit.definition.at.z,
          w: exit.definition.size.w,
          d: exit.definition.size.d,
        },
        secret: Boolean(exit.definition.secret),
        unlocked: exit.unlocked,
      })),
      noises: this.noises.map((noise) => ({
        x: noise.x,
        z: noise.z,
        radius: noise.radius,
        alpha: Math.max(0, noise.life / noise.maxLife),
      })),
    };
  }

  private handleResize = () => {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.radar.resize();
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    for (const pickup of this.pickups) pickup.texture.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function makePickupTexture(definition: PickupDefinition): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas texture context unavailable");

  context.clearRect(0, 0, canvas.width, canvas.height);
  roundedRect(context, 24, 24, 464, 464, 48);
  context.fillStyle = "rgba(4, 14, 11, 0.96)";
  context.fill();
  context.lineWidth = 12;
  context.strokeStyle = definition.color;
  context.stroke();

  const glow = context.createRadialGradient(256, 245, 20, 256, 245, 220);
  glow.addColorStop(0, `${definition.color}55`);
  glow.addColorStop(1, `${definition.color}00`);
  context.fillStyle = glow;
  context.fillRect(38, 72, 436, 338);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = definition.color;
  context.font = '800 24px "Avenir Next", "Hiragino Kaku Gothic ProN", sans-serif';
  context.fillText(
    definition.kind === "objective" ? "OPTIONAL CHECK" : "BONUS ITEM",
    256,
    68,
  );

  context.fillStyle = "#ffffff";
  context.font = '190px "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';
  context.fillText(definition.icon, 256, 247);

  let labelSize = 42;
  context.font = `800 ${labelSize}px "Avenir Next", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
  while (context.measureText(definition.label).width > 420 && labelSize > 26) {
    labelSize -= 2;
    context.font = `800 ${labelSize}px "Avenir Next", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
  }
  context.fillStyle = "#effff6";
  context.fillText(definition.label, 256, 426);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const right = x + width;
  const bottom = y + height;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(right - radius, y);
  context.quadraticCurveTo(right, y, right, y + radius);
  context.lineTo(right, bottom - radius);
  context.quadraticCurveTo(right, bottom, right - radius, bottom);
  context.lineTo(x + radius, bottom);
  context.quadraticCurveTo(x, bottom, x, bottom - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function makeAlertGauge(): AlertGauge {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.PlaneGeometry(2.14, 0.34),
    new THREE.MeshBasicMaterial({
      color: "#effff6",
      transparent: true,
      opacity: 0.92,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  outer.renderOrder = 40;
  const track = new THREE.Mesh(
    new THREE.PlaneGeometry(1.96, 0.18),
    new THREE.MeshBasicMaterial({
      color: "#07110d",
      transparent: true,
      opacity: 0.94,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  track.position.z = 0.01;
  track.renderOrder = 41;
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: "#ffc857",
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  fill.position.z = 0.02;
  fill.scale.set(1.86, 0.12, 1);
  fill.renderOrder = 42;
  group.add(outer, track, fill);
  group.visible = false;
  return { group, fill };
}

function makeVisionCone(range: number, fov: number, color: string) {
  const segments = 28;
  const positions: number[] = [0, 0, 0];
  for (let index = 0; index <= segments; index += 1) {
    const angle = -fov / 2 + (fov * index) / segments;
    positions.push(Math.sin(angle) * range, 0, Math.cos(angle) * range);
  }
  const indices: number[] = [];
  for (let index = 0; index < segments; index += 1) {
    indices.push(0, index + 1, index + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
}

function turnToward(current: number, target: number, maxStep: number): number {
  let difference = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (difference < -Math.PI) difference += Math.PI * 2;
  if (Math.abs(difference) <= maxStep) return target;
  return current + Math.sign(difference) * maxStep;
}

function aiLabel(state: AiState) {
  if (state === "investigate") return "物音を調査";
  if (state === "search") return "周辺を捜索";
  if (state === "return") return "巡回へ復帰";
  return "巡回中";
}
