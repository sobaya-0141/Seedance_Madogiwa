import * as THREE from "three";
import { SOBAYA_CHARACTER } from "../characters/sobaya";
import {
  loadVoxelCharacter,
  type VoxelActionController,
} from "../characters/voxel-character-kit";
import { DemolitionAudio } from "./audio";
import { VoxelAssetFactory } from "./assets";
import {
  AZABU_CITY_BREAKABLE_COUNT,
  AZABU_CITY_LOTS,
  AZABU_STREET_PROPS,
  CITY_HALF_X,
  CITY_HALF_Z,
  getGiantScale,
  getGiantStage,
  isOfficeExteriorWall,
  OFFICE_HALF_X,
  OFFICE_HALF_Z,
} from "./city";
import {
  getPlayerFacingYaw,
  getPlayerForward,
  getRadarArrow,
} from "./orientation";
import {
  canBreakMaterial,
  getActiveGoal,
  getBreakScore,
  getBreakXp,
  getLevelForXp,
  getLevelProgress,
  MATERIAL_LABEL,
  MATERIAL_TIER,
  normalizeDemolitionSave,
} from "./rules";
import type {
  DemolitionAction,
  DemolitionGoalId,
  DemolitionControls,
  DemolitionHud,
  DemolitionMaterial,
  DemolitionResult,
  DemolitionSave,
  DestructionTier,
  GamePhase,
} from "./types";

type Breakable = {
  id: string;
  name: string;
  group: THREE.Group;
  material: DemolitionMaterial;
  tier: DestructionTier;
  hp: number;
  maxHp: number;
  mass: number;
  score: number;
  radius: number;
  alive: boolean;
  carried: boolean;
  grabbable: boolean;
  solid: boolean;
  baseSolid: boolean;
  zone: string;
  supportGroup?: string;
  supportWeight: number;
  chainPower: number;
  district: "office" | "city";
};

type BreakableOptions = {
  id: string;
  name: string;
  group: THREE.Group;
  material: DemolitionMaterial;
  position: readonly [number, number, number];
  rotation?: number;
  hp: number;
  mass: number;
  score: number;
  radius: number;
  grabbable?: boolean;
  solid?: boolean;
  supportGroup?: string;
  supportWeight?: number;
  chainPower?: number;
  district?: "office" | "city";
};

type DebrisPiece = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  age: number;
  lifetime: number;
  active: boolean;
};

type FlyingObject = {
  item: Breakable;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  age: number;
};

type TimedCollapse = {
  item: Breakable;
  at: number;
  chainDepth: number;
};

type Effect = {
  mesh: THREE.Mesh;
  age: number;
  lifetime: number;
  grow: number;
};

type BeerBeamEffect = {
  group: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
  age: number;
  lifetime: number;
};

type MugMeteor = {
  group: THREE.Group;
  start: THREE.Vector3;
  target: THREE.Vector3;
  age: number;
  duration: number;
};

type PendingImpact = {
  at: number;
  kind: "smash" | "stomp" | "kanpai";
  center: THREE.Vector3;
};

export type DemolitionWorldCallbacks = {
  onReady: (total: number) => void;
  onHud: (hud: DemolitionHud) => void;
  onSave: (save: DemolitionSave) => void;
  onClear: (result: DemolitionResult) => void;
};

const PLAYER_RADIUS = 0.72;
const MAX_DEBRIS = 230;
const SAVE_INTERVAL = 7;
const COMBO_WINDOW = 2.35;
const PLAYER_SPEED = 6.2;
const DASH_SPEED = 13.8;

const MATERIAL_COLOR: Record<DemolitionMaterial, number> = {
  paper: 0xd6a160,
  wood: 0xc4874d,
  fabric: 0x286cb7,
  glass: 0x75dcec,
  metal: 0x7c8e99,
  plaster: 0xe5e0d8,
  concrete: 0x8f9494,
  slab: 0x657b8c,
  steel: 0x303b44,
};

const EMPTY_CONTROLS: DemolitionControls = {
  moveX: 0,
  moveZ: 0,
  smash: false,
  grab: false,
  dash: false,
  stomp: false,
  kanpai: false,
};

export class OfficeDemolitionWorld {
  private readonly container: HTMLElement;
  private readonly callbacks: DemolitionWorldCallbacks;
  private readonly factory = new VoxelAssetFactory();
  private readonly audio = new DemolitionAudio();
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(47, 1, 0.1, 260);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly playerAnchor = new THREE.Group();
  private readonly fallbackPlayer: THREE.Group;
  private readonly cameraLook = new THREE.Vector3();
  private readonly moveVector = new THREE.Vector3();
  private readonly desiredCamera = new THREE.Vector3();
  private readonly breakables: Breakable[] = [];
  private readonly breakableById = new Map<string, Breakable>();
  private readonly destroyedIds = new Set<string>();
  private readonly completedGoals = new Set<DemolitionGoalId>();
  private readonly debris: DebrisPiece[] = [];
  private readonly flying: FlyingObject[] = [];
  private readonly collapses: TimedCollapse[] = [];
  private readonly effects: Effect[] = [];
  private readonly beerBeams: BeerBeamEffect[] = [];
  private readonly mugMeteors: MugMeteor[] = [];
  private readonly keys = new Set<string>();
  private readonly controls: DemolitionControls = { ...EMPTY_CONTROLS };
  private readonly rubbleMeshes = new Map<DemolitionMaterial, THREE.InstancedMesh>();
  private readonly rubbleCounts = new Map<DemolitionMaterial, number>();
  private readonly targetRing: THREE.Mesh;
  private readonly targetBeacon: THREE.Mesh;
  private readonly dustPoints: THREE.Points;
  private readonly resizeObserver: ResizeObserver;
  private animationFrame = 0;
  private disposed = false;
  private actions?: VoxelActionController;
  private phase: GamePhase = "loading";
  private xp = 0;
  private score = 0;
  private destroyed = 0;
  private combo = 0;
  private maxCombo = 0;
  private chain = 0;
  private comboTimer = 0;
  private beer = 0;
  private playSeconds = 0;
  private elapsed = 0;
  private lastHud = -1;
  private lastSave = 0;
  private lastStep = 0;
  private lastAttack = -10;
  private lastLocked = -10;
  private lastZone = "";
  private notice = "全社リノベーション業務、準備完了です！";
  private noticeTone: DemolitionHud["noticeTone"] = "normal";
  private noticeUntil = 5;
  private saveStatus: DemolitionHud["saveStatus"] = "idle";
  private soundEnabled = true;
  private shakeEnabled = true;
  private shake = 0;
  private levelUpTimer = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private pendingImpact: PendingImpact | null = null;
  private carried: Breakable | null = null;
  private target: Breakable | null = null;
  private clearing = false;
  private clearTimer = 0;
  private throwBreaks = 0;
  private dashWallBreaks = 0;
  private cascadeBreaks = 0;
  private kanpaiSteelBreaks = 0;
  private officeBreakableTotal = 0;
  private cityBreakableTotal = 0;
  private cityDestroyed = 0;
  private districtUnlocked = false;
  private giantScale = 1;
  private giantScaleTarget = 1;
  private giantStage = 0;
  private radarActive = false;
  private radarArrow = "↑";
  private radarDistance = 0;
  private ultimateTimer = 0;
  private lastBreakAt = 0;
  private initialSave: DemolitionSave;

  constructor(
    container: HTMLElement,
    callbacks: DemolitionWorldCallbacks,
    saveValue: unknown,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.initialSave = normalizeDemolitionSave(saveValue);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = "demolition-canvas";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0xa8dcfa);
    this.scene.fog = new THREE.Fog(0xb8ddec, 72, 210);

    this.fallbackPlayer = this.factory.makeSobayaFallback();
    this.fallbackPlayer.scale.setScalar(0.84);
    this.playerAnchor.add(this.fallbackPlayer);
    this.playerAnchor.position.set(0, 0, 15);
    this.scene.add(this.playerAnchor);

    const ringGeometry = new THREE.RingGeometry(0.72, 0.88, 40);
    this.targetRing = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x50e1c2,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.targetRing.rotation.x = -Math.PI / 2;
    this.targetRing.visible = false;
    this.scene.add(this.targetRing);

    this.targetBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.28, 1.15, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x50e1c2,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.targetBeacon.visible = false;
    this.scene.add(this.targetBeacon);

    this.dustPoints = this.makeDustPoints();
    this.scene.add(this.dustPoints);

    this.buildLighting();
    this.buildBackdrop();
    this.buildRubblePools();
    this.buildOffice();
    this.officeBreakableTotal = this.breakables.length;
    this.buildAzabuDistrict();
    this.cityBreakableTotal = this.breakables.length - this.officeBreakableTotal;
    if (this.cityBreakableTotal !== AZABU_CITY_BREAKABLE_COUNT) {
      throw new Error(
        `Azabu district asset count mismatch: ${this.cityBreakableTotal}`,
      );
    }
    this.buildDebrisPool();
    this.applySave(this.initialSave);
    this.loadCharacter();
    this.attachInput();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.phase = this.initialSave.cleared ? "cleared" : "briefing";
    this.callbacks.onReady(this.breakables.length);
    this.emitHud(true);
    this.clock.start();
    this.loop();
  }

  start() {
    if (this.phase === "cleared") return;
    this.phase = "playing";
    this.notice = this.districtUnlocked
      ? `麻布十番の解体を再開。残り ${this.breakables.length - this.destroyed} 件です！`
      : this.destroyed > 0
        ? `続きから再開。残り ${this.breakables.length - this.destroyed} 件です！`
      : "解体業務、開始です！まずは机と椅子から！";
    this.noticeTone = "good";
    this.noticeUntil = this.elapsed + 3.2;
    void this.audio.prime();
    this.emitHud(true);
  }

  resume() {
    if (this.phase === "paused" || this.phase === "levelup") {
      this.phase = "playing";
      this.levelUpTimer = 0;
      void this.audio.prime();
      this.emitHud(true);
    }
  }

  togglePause() {
    if (this.phase === "playing") {
      this.phase = "paused";
      this.requestSave();
    } else if (this.phase === "paused") {
      this.resume();
    }
    this.emitHud(true);
  }

  restart() {
    this.xp = 0;
    this.score = 0;
    this.destroyed = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.chain = 0;
    this.comboTimer = 0;
    this.beer = 0;
    this.playSeconds = 0;
    this.destroyedIds.clear();
    this.completedGoals.clear();
    this.carried = null;
    this.flying.length = 0;
    this.collapses.length = 0;
    this.clearing = false;
    this.clearTimer = 0;
    this.throwBreaks = 0;
    this.dashWallBreaks = 0;
    this.cascadeBreaks = 0;
    this.kanpaiSteelBreaks = 0;
    this.cityDestroyed = 0;
    this.districtUnlocked = false;
    this.giantScale = 1;
    this.giantScaleTarget = 1;
    this.giantStage = 0;
    this.radarActive = false;
    this.radarArrow = "↑";
    this.radarDistance = 0;
    this.ultimateTimer = 0;
    this.lastBreakAt = this.elapsed;
    this.playerAnchor.position.set(0, 0, 15);
    this.playerAnchor.rotation.y = 0;
    this.playerAnchor.scale.setScalar(1);
    for (const item of this.breakables) {
      item.alive = true;
      item.carried = false;
      item.hp = item.maxHp;
      item.solid = item.baseSolid;
      item.group.visible = true;
      item.group.position.copy(item.group.userData.homePosition as THREE.Vector3);
      item.group.rotation.copy(item.group.userData.homeRotation as THREE.Euler);
    }
    for (const [material, mesh] of this.rubbleMeshes) {
      mesh.count = 0;
      mesh.instanceMatrix.needsUpdate = true;
      this.rubbleCounts.set(material, 0);
    }
    for (const piece of this.debris) {
      piece.active = false;
      piece.mesh.visible = false;
    }
    for (const beam of [...this.beerBeams]) this.removeBeerBeam(beam);
    this.beerBeams.length = 0;
    for (const meteor of this.mugMeteors) this.scene.remove(meteor.group);
    this.mugMeteors.length = 0;
    this.phase = "playing";
    this.notice = "新しい解体計画で、最初から開始です！";
    this.noticeTone = "good";
    this.noticeUntil = this.elapsed + 3;
    this.requestSave();
    this.emitHud(true);
  }

  trigger(action: DemolitionAction) {
    if (this.phase !== "playing") return;
    if (action === "smash") this.beginSmash();
    if (action === "grab") this.grabOrThrow();
    if (action === "dash") this.beginDash();
    if (action === "stomp") this.beginStomp();
    if (action === "kanpai") this.beginKanpai();
  }

  setMove(x: number, z: number) {
    const length = Math.hypot(x, z);
    this.controls.moveX = length > 1 ? x / length : x;
    this.controls.moveZ = length > 1 ? z / length : z;
  }

  setSound(enabled: boolean) {
    this.soundEnabled = enabled;
    this.audio.setEnabled(enabled);
    if (enabled) void this.audio.prime();
    this.emitHud(true);
  }

  setShake(enabled: boolean) {
    this.shakeEnabled = enabled;
    if (!enabled) this.shake = 0;
    this.emitHud(true);
  }

  setSaveStatus(status: DemolitionHud["saveStatus"]) {
    this.saveStatus = status;
    this.emitHud(true);
  }

  getSnapshot() {
    return this.makeSave();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.detachInput();
    this.audio.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.targetRing.geometry.dispose();
    (this.targetRing.material as THREE.Material).dispose();
    this.targetBeacon.geometry.dispose();
    (this.targetBeacon.material as THREE.Material).dispose();
    this.dustPoints.geometry.dispose();
    (this.dustPoints.material as THREE.Material).dispose();
    for (const mesh of this.rubbleMeshes.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    for (const piece of this.debris) {
      piece.mesh.geometry.dispose();
      (piece.mesh.material as THREE.Material).dispose();
    }
    for (const effect of this.effects) {
      effect.mesh.geometry.dispose();
      (effect.mesh.material as THREE.Material).dispose();
    }
    for (const beam of [...this.beerBeams]) this.removeBeerBeam(beam);
    for (const meteor of this.mugMeteors) this.scene.remove(meteor.group);
    this.factory.dispose();
  }

  private buildLighting() {
    const hemisphere = new THREE.HemisphereLight(0xe9f8ff, 0x6d5a45, 2.25);
    this.scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xfff5da, 3.3);
    sun.position.set(-18, 34, 24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -105;
    sun.shadow.camera.right = 105;
    sun.shadow.camera.top = 90;
    sun.shadow.camera.bottom = -90;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 180;
    sun.shadow.bias = -0.00015;
    this.scene.add(sun);

    const windowFill = new THREE.DirectionalLight(0x78d9ff, 1.15);
    windowFill.position.set(0, 10, -30);
    this.scene.add(windowFill);
  }

  private buildBackdrop() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 180),
      this.factory.material(0x4b5961, { roughness: 0.94 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.23;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const officePad = new THREE.Mesh(
      new THREE.PlaneGeometry(62, 46),
      this.factory.material(0xc8b88e, { roughness: 0.96 }),
    );
    officePad.rotation.x = -Math.PI / 2;
    officePad.position.y = -0.215;
    officePad.receiveShadow = true;
    this.scene.add(officePad);

    const sidewalkMaterial = this.factory.material(0xb9b6ad, { roughness: 0.9 });
    for (const x of [-84, -60, -36, 36, 60, 84]) {
      const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.18, 150),
        sidewalkMaterial,
      );
      sidewalk.position.set(x, -0.18, 0);
      sidewalk.receiveShadow = true;
      this.scene.add(sidewalk);
    }
    for (const z of [-66, -44, -24, 24, 44, 66]) {
      const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(190, 0.19, 12),
        sidewalkMaterial,
      );
      sidewalk.position.set(0, -0.17, z);
      sidewalk.receiveShadow = true;
      this.scene.add(sidewalk);
    }
    const laneMaterial = this.factory.material(0xf4e5a4, {
      roughness: 0.8,
      emissive: 0x8c772f,
      emissiveIntensity: 0.08,
    });
    for (let z = -72; z <= 72; z += 8) {
      this.scene.add(this.factory.box(
        [0.16, 0.025, 3.2],
        0xf4e5a4,
        [0, -0.105, z],
        { rounded: false, roughness: 0.8 },
      ));
    }
    for (let x = -88; x <= 88; x += 8) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.025, 0.16), laneMaterial);
      marker.position.set(x, -0.105, 0);
      this.scene.add(marker);
    }

    const skyline = new THREE.Group();
    skyline.position.z = -112;
    for (let index = 0; index < 26; index += 1) {
      const x = -55 + index * 4.5;
      const height = 7 + ((index * 13) % 17);
      const width = 2.8 + (index % 3) * 0.65;
      const building = this.factory.box(
        [width, height, 3.2],
        index % 4 === 0 ? 0x739cb4 : index % 4 === 1 ? 0x92afbc : 0x688b9e,
        [x, height / 2 - 1.5, 0],
        { roughness: 0.48, metalness: 0.08, rounded: false },
      );
      skyline.add(building);
      for (let row = 0; row < Math.floor(height / 2.4); row += 1) {
        const windowBand = this.factory.box(
          [width + 0.02, 0.18, 0.06],
          0xc7eff7,
          [x, row * 2.1 + 1.3, 1.63],
          {
            emissive: 0x79c6d9,
            emissiveIntensity: 0.22,
            rounded: false,
          },
        );
        skyline.add(windowBand);
      }
    }
    this.scene.add(skyline);

    const tower = new THREE.Group();
    tower.position.set(-34, -0.2, -98);
    const towerMaterial = this.factory.material(0xe94e43, {
      metalness: 0.35,
      roughness: 0.44,
    });
    for (let level = 0; level < 7; level += 1) {
      const y = level * 2.5;
      const width = THREE.MathUtils.lerp(4.2, 0.55, level / 7);
      for (const x of [-width / 2, width / 2]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.9, 0.18), towerMaterial);
        leg.position.set(x, y + 1.45, 0);
        leg.rotation.z = x < 0 ? -0.12 : 0.12;
        tower.add(leg);
      }
      const cross = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, 0.18), towerMaterial);
      cross.position.y = y;
      tower.add(cross);
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.26, 5, 8), towerMaterial);
    mast.position.y = 19.2;
    tower.add(mast);
    this.scene.add(tower);

    const skyGlow = new THREE.Mesh(
      new THREE.CircleGeometry(8, 48),
      new THREE.MeshBasicMaterial({
        color: 0xfff1b4,
        transparent: true,
        opacity: 0.23,
        depthWrite: false,
      }),
    );
    skyGlow.position.set(45, 40, -125);
    this.scene.add(skyGlow);
  }

  private buildRubblePools() {
    for (const material of Object.keys(MATERIAL_COLOR) as DemolitionMaterial[]) {
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color: MATERIAL_COLOR[material],
          roughness: material === "steel" || material === "metal" ? 0.44 : 0.88,
          metalness: material === "steel" ? 0.62 : material === "metal" ? 0.35 : 0,
        }),
        1_200,
      );
      mesh.count = 0;
      mesh.receiveShadow = true;
      this.rubbleMeshes.set(material, mesh);
      this.rubbleCounts.set(material, 0);
      this.scene.add(mesh);
    }
  }

  private buildOffice() {
    this.buildSlabs();
    this.buildStructure();
    this.buildOpenOffice();
    this.buildMeetingSuite();
    this.buildArchiveAndServer();
    this.buildWindowLounge();
  }

  private buildAzabuDistrict() {
    const floorHeight = 3.25;
    for (const lot of AZABU_CITY_LOTS) {
      const supportGroup = `azabu-lot-${lot.id}`;
      for (let floor = 0; floor < lot.floors; floor += 1) {
        this.addBreakable({
          id: `city-${lot.id}-floor-${floor}`,
          name: `${lot.name} ${floor + 1}階`,
          group: this.factory.makeCityFloor(
            lot.width,
            lot.depth,
            floorHeight,
            floor,
            lot.variant,
          ),
          material: "concrete",
          position: [lot.x, floor * floorHeight, lot.z],
          hp: 4 + Math.floor(floor / 2),
          mass: 720 + floor * 95,
          score: 980 + floor * 130,
          radius: Math.max(lot.width, lot.depth) * 0.48,
          grabbable: false,
          solid: floor === 0,
          supportGroup,
          supportWeight: floor === 0 ? 1 : 0,
          chainPower: 2.15 + floor * 0.08,
          district: "city",
        });
      }

      const sideFacing = lot.id.startsWith("side-");
      const storefront = this.factory.makeCityStorefront(
        sideFacing ? lot.depth : lot.width,
        lot.variant,
      );
      let storefrontX = lot.x;
      let storefrontZ = lot.z;
      if (sideFacing) {
        storefront.rotation.y = Math.PI / 2;
        storefrontX += lot.x < 0
          ? lot.width / 2 + 0.15
          : -lot.width / 2 - 0.15;
      } else {
        storefrontZ += lot.z < 0
          ? lot.depth / 2 + 0.15
          : -lot.depth / 2 - 0.15;
      }
      this.addBreakable({
        id: `city-${lot.id}-storefront`,
        name: `${lot.name} 店舗ファサード`,
        group: storefront,
        material: lot.variant % 3 === 0 ? "metal" : "glass",
        position: [storefrontX, 0, storefrontZ],
        hp: 2,
        mass: 110,
        score: 260,
        radius: Math.max(2.2, (sideFacing ? lot.depth : lot.width) * 0.42),
        grabbable: false,
        solid: false,
        supportGroup,
        supportWeight: 0,
        chainPower: 1.15,
        district: "city",
      });

      this.addBreakable({
        id: `city-${lot.id}-roof`,
        name: `${lot.name} 屋上鉄骨`,
        group: this.factory.makeCityRoof(lot.width, lot.depth, lot.variant),
        material: "steel",
        position: [lot.x, lot.floors * floorHeight, lot.z],
        hp: 5,
        mass: 880,
        score: 1_420,
        radius: Math.max(lot.width, lot.depth) * 0.5,
        grabbable: false,
        solid: false,
        supportGroup,
        supportWeight: 0,
        chainPower: 2.5,
        district: "city",
      });
    }

    for (const prop of AZABU_STREET_PROPS) {
      this.addBreakable({
        id: `city-prop-${prop.id}`,
        name: prop.name,
        group: this.factory.makeStreetProp(prop.kind, prop.variant),
        material: prop.kind === "tree" ? "wood" : "metal",
        position: [prop.x, 0, prop.z],
        rotation: prop.variant % 2 ? Math.PI / 2 : 0,
        hp: prop.kind === "lamp" ? 2 : 1,
        mass: prop.kind === "tree" ? 78 : prop.kind === "vending" ? 180 : 95,
        score: prop.kind === "vending" ? 260 : 150,
        radius: prop.kind === "tree" ? 1.45 : 0.85,
        grabbable: prop.kind === "vending" || prop.kind === "sign",
        solid: prop.kind === "vending" || prop.kind === "tree",
        chainPower: prop.kind === "tree" ? 0.85 : 0.72,
        district: "city",
      });
    }
  }

  private buildSlabs() {
    let index = 0;
    for (let x = -22.5; x <= 22.5; x += 5) {
      for (let z = -15; z <= 15; z += 5) {
        this.addBreakable({
          id: `slab-${String(index).padStart(2, "0")}`,
          name: "床スラブ",
          group: this.factory.makeFloorSlab(4.92, 4.92),
          material: "slab",
          position: [x, -0.07, z],
          hp: 3,
          mass: 360,
          score: 420,
          radius: 2.45,
          solid: false,
          supportGroup: `slab-row-${Math.round((z + 15) / 5)}`,
          supportWeight: 0,
          chainPower: 1.1,
        });
        index += 1;
      }
    }
  }

  private buildStructure() {
    let foundationIndex = 0;
    for (const z of [-16.5, 0, 16.5]) {
      for (const x of [-18, -6, 6, 18]) {
        this.addBreakable({
          id: `foundation-beam-${foundationIndex}`,
          name: "基礎鉄骨",
          group: this.factory.makeSteelBeam(11.4),
          material: "steel",
          position: [x, -0.4, z],
          hp: 5,
          mass: 760,
          score: 1_250,
          radius: 5.6,
          grabbable: false,
          solid: false,
          supportWeight: 0,
          chainPower: 2.2,
        });
        foundationIndex += 1;
      }
    }

    let columnIndex = 0;
    for (const x of [-24, -12, 0, 12, 24]) {
      for (const z of [-16.5, 0, 16.5]) {
        const steel = z === 0 || x === 0;
        this.addBreakable({
          id: `${steel ? "steel" : "concrete"}-column-${columnIndex}`,
          name: steel ? "構造鉄骨" : "コンクリート柱",
          group: steel
            ? this.factory.makeSteelColumn(4.8)
            : this.factory.makeConcreteColumn(4.6),
          material: steel ? "steel" : "concrete",
          position: [x, 0, z],
          hp: steel ? 5 : 4,
          mass: steel ? 680 : 520,
          score: steel ? 1_100 : 620,
          radius: 0.78,
          grabbable: false,
          solid: true,
          supportGroup: `frame-${x}`,
          supportWeight: 1,
          chainPower: steel ? 2.1 : 1.55,
        });
        columnIndex += 1;
      }
    }

    let beamIndex = 0;
    for (const z of [-16.5, 0, 16.5]) {
      for (const x of [-18, -6, 6, 18]) {
        this.addBreakable({
          id: `steel-beam-x-${beamIndex}`,
          name: "天井鉄骨",
          group: this.factory.makeSteelBeam(11.4),
          material: "steel",
          position: [x, 4.55, z],
          hp: 4,
          mass: 430,
          score: 880,
          radius: 5.6,
          grabbable: false,
          solid: false,
          supportGroup: `frame-${x < 0 ? Math.ceil(x / 12) * 12 : Math.floor(x / 12) * 12}`,
          supportWeight: 0,
          chainPower: 1.8,
        });
        beamIndex += 1;
      }
    }
    for (const x of [-24, -12, 0, 12, 24]) {
      for (const z of [-8.25, 8.25]) {
        const group = this.factory.makeSteelBeam(15.8);
        group.rotation.y = Math.PI / 2;
        this.addBreakable({
          id: `steel-beam-z-${beamIndex}`,
          name: "梁鉄骨",
          group,
          material: "steel",
          position: [x, 4.58, z],
          hp: 4,
          mass: 520,
          score: 940,
          radius: 7.7,
          grabbable: false,
          solid: false,
          supportGroup: `frame-${x}`,
          supportWeight: 0,
          chainPower: 1.9,
        });
        beamIndex += 1;
      }
    }

    let wallIndex = 0;
    for (let x = -22.5; x <= 22.5; x += 3) {
      const northWindow = wallIndex % 3 !== 0;
      this.addBreakable({
        id: `north-${northWindow ? "glass" : "wall"}-${wallIndex}`,
        name: northWindow ? "外周ガラス" : "外周壁",
        group: northWindow
          ? this.factory.makeGlassPanel(2.86, 3.35)
          : this.factory.makeWall(2.86, 3.35),
        material: northWindow ? "glass" : "plaster",
        position: [x, 0, -17.7],
        hp: northWindow ? 2 : 3,
        mass: northWindow ? 82 : 170,
        score: northWindow ? 190 : 280,
        radius: 1.45,
        grabbable: false,
        solid: true,
        supportGroup: `frame-${Math.round(x / 12) * 12}`,
        supportWeight: 0,
        chainPower: northWindow ? 0.85 : 1.05,
      });
      wallIndex += 1;
    }
    for (let z = -15; z <= 15; z += 3) {
      for (const x of [-25.5, 25.5]) {
        const group = wallIndex % 4 === 0
          ? this.factory.makeGlassPanel(2.86, 3.35)
          : this.factory.makeWall(2.86, 3.35);
        group.rotation.y = Math.PI / 2;
        this.addBreakable({
          id: `side-wall-${wallIndex}`,
          name: wallIndex % 4 === 0 ? "外周ガラス" : "外周壁",
          group,
          material: wallIndex % 4 === 0 ? "glass" : "plaster",
          position: [x, 0, z],
          hp: wallIndex % 4 === 0 ? 2 : 3,
          mass: wallIndex % 4 === 0 ? 82 : 170,
          score: wallIndex % 4 === 0 ? 190 : 280,
          radius: 1.45,
          grabbable: false,
          solid: true,
          supportGroup: `frame-${x > 0 ? 24 : -24}`,
          supportWeight: 0,
          chainPower: 1,
        });
        wallIndex += 1;
      }
    }

    const ceilingPositions: Array<readonly [number, number]> = [
      [-21, -14], [-14, -14], [-7, -14], [0, -14], [7, -14], [14, -14], [21, -14],
      [-21, -7], [-21, 0], [-21, 7], [-21, 14],
      [-7, -6.5], [7, -6.5],
    ];
    ceilingPositions.forEach(([x, z], ceilingIndex) => {
      this.addBreakable({
        id: `ceiling-${ceilingIndex}`,
        name: "天井パネル",
        group: this.factory.makeCeilingPanel(5.6, 4.8),
        material: "plaster",
        position: [x, 4.24, z],
        hp: 2,
        mass: 74,
        score: 220,
        radius: 2.55,
        grabbable: false,
        solid: false,
        supportGroup: `frame-${Math.round(x / 12) * 12}`,
        supportWeight: 0,
        chainPower: 0.8,
      });
    });
  }

  private buildOpenOffice() {
    let index = 0;
    for (const z of [12.5, 8.5, 4.5]) {
      for (const x of [-19.5, -14.5, -9.5, -4.5, 4.5, 9.5, 14.5, 19.5]) {
        const rotation = x < 0 ? 0.04 : -0.04;
        this.addBreakable({
          id: `desk-${index}`,
          name: "ワークデスク",
          group: this.factory.makeDesk(index),
          material: "wood",
          position: [x, 0, z],
          rotation,
          hp: 1,
          mass: 48,
          score: 75,
          radius: 1.28,
          grabbable: true,
          solid: true,
          chainPower: 0.72,
        });
        this.addBreakable({
          id: `chair-${index}`,
          name: "オフィスチェア",
          group: this.factory.makeChair(index),
          material: "fabric",
          position: [x + (index % 2 ? 0.45 : -0.4), 0, z + 1.35],
          rotation: Math.PI + rotation,
          hp: 1,
          mass: 18,
          score: 48,
          radius: 0.68,
          grabbable: true,
          solid: false,
          chainPower: 0.55,
        });
        index += 1;
      }
    }
    for (let plant = 0; plant < 10; plant += 1) {
      this.addBreakable({
        id: `plant-${plant}`,
        name: "観葉植物",
        group: this.factory.makePlant(plant),
        material: "wood",
        position: [-22 + (plant % 5) * 11, 0, plant < 5 ? 15.3 : 2.1],
        hp: 1,
        mass: 11,
        score: 36,
        radius: 0.52,
        grabbable: true,
        solid: false,
        chainPower: 0.4,
      });
    }
    for (let carton = 0; carton < 12; carton += 1) {
      this.addBreakable({
        id: `carton-${carton}`,
        name: "アーロンチュア資材",
        group: this.factory.makeCartons(carton),
        material: "paper",
        position: [-21 + (carton % 6) * 7.6, 0, carton < 6 ? 0.9 : 16],
        rotation: (carton % 3 - 1) * 0.12,
        hp: 1,
        mass: 8,
        score: 32,
        radius: 0.72,
        grabbable: true,
        solid: false,
        chainPower: 0.38,
      });
    }
  }

  private buildMeetingSuite() {
    let index = 0;
    for (const x of [-20.5, -15.5, -10.5]) {
      for (const z of [-3.2, -7.2]) {
        this.addBreakable({
          id: `meeting-desk-${index}`,
          name: "会議テーブル",
          group: this.factory.makeDesk(index + 30),
          material: "wood",
          position: [x, 0, z],
          rotation: Math.PI / 2,
          hp: 1,
          mass: 62,
          score: 82,
          radius: 1.35,
          grabbable: true,
          solid: true,
          chainPower: 0.8,
        });
        for (const offset of [-1, 1]) {
          this.addBreakable({
            id: `meeting-chair-${index}-${offset}`,
            name: "会議チェア",
            group: this.factory.makeChair(index),
            material: "fabric",
            position: [x + offset * 1.45, 0, z],
            rotation: offset > 0 ? -Math.PI / 2 : Math.PI / 2,
            hp: 1,
            mass: 17,
            score: 44,
            radius: 0.62,
            grabbable: true,
            solid: false,
            chainPower: 0.52,
          });
        }
        index += 1;
      }
    }
    for (let panel = 0; panel < 7; panel += 1) {
      this.addBreakable({
        id: `meeting-glass-${panel}`,
        name: "会議室ガラス",
        group: this.factory.makeGlassPanel(2.65, 2.85),
        material: "glass",
        position: [-23.1 + panel * 2.7, 0, -10.1],
        hp: 2,
        mass: 88,
        score: 180,
        radius: 1.35,
        grabbable: false,
        solid: true,
        chainPower: 0.9,
      });
    }
    for (let panel = 0; panel < 5; panel += 1) {
      const group = this.factory.makePartition(2.45, panel % 2 ? 0x5b7388 : 0x3f6882);
      group.rotation.y = Math.PI / 2;
      this.addBreakable({
        id: `meeting-partition-${panel}`,
        name: "吸音パーティション",
        group,
        material: "metal",
        position: [-8.2, 0, -8.2 + panel * 2.5],
        hp: 2,
        mass: 64,
        score: 140,
        radius: 1.24,
        grabbable: true,
        solid: true,
        chainPower: 0.75,
      });
    }
  }

  private buildArchiveAndServer() {
    let index = 0;
    for (const x of [10, 13.2, 16.4, 19.6, 22.8]) {
      for (const z of [-3.2, -6.2]) {
        this.addBreakable({
          id: `locker-${index}`,
          name: "書庫ロッカー",
          group: this.factory.makeLocker(index),
          material: "metal",
          position: [x, 0, z],
          rotation: z < -5 ? Math.PI : 0,
          hp: 2,
          mass: 110,
          score: 160,
          radius: 0.78,
          grabbable: true,
          solid: true,
          chainPower: 0.92,
        });
        index += 1;
      }
    }
    for (const [copier, x, z] of [
      [0, 10.8, 1.2],
      [1, 15.4, 1.3],
      [2, 20.2, 1.1],
    ] as const) {
      this.addBreakable({
        id: `copier-${copier}`,
        name: "大型複合機",
        group: this.factory.makeCopier(copier),
        material: "metal",
        position: [x, 0, z],
        hp: 3,
        mass: 146,
        score: 220,
        radius: 0.88,
        grabbable: true,
        solid: true,
        chainPower: 1.15,
      });
    }
    for (const [rack, x, z] of [
      [0, 10.2, -13.7],
      [1, 13.2, -13.7],
      [2, 16.2, -13.7],
      [3, 19.2, -13.7],
      [4, 22.2, -13.7],
    ] as const) {
      this.addBreakable({
        id: `server-rack-${rack}`,
        name: "サーバーラック",
        group: this.factory.makeServerRack(rack),
        material: "metal",
        position: [x, 0, z],
        hp: 3,
        mass: 210,
        score: 250,
        radius: 0.82,
        grabbable: false,
        solid: true,
        chainPower: 1.25,
      });
    }
    for (let wall = 0; wall < 6; wall += 1) {
      const group = this.factory.makeWall(2.72, 3.2);
      group.rotation.y = Math.PI / 2;
      this.addBreakable({
        id: `server-wall-${wall}`,
        name: "サーバー室防火壁",
        group,
        material: "plaster",
        position: [8.3, 0, -15 + wall * 2.8],
        hp: 3,
        mass: 190,
        score: 310,
        radius: 1.42,
        grabbable: false,
        solid: true,
        chainPower: 1.08,
        supportGroup: "frame-12",
        supportWeight: 0,
      });
    }
  }

  private buildWindowLounge() {
    for (const [sofa, x, z, rotation] of [
      [0, -20.5, -14.1, 0],
      [1, -14.5, -14.1, 0],
    ] as const) {
      this.addBreakable({
        id: `sofa-${sofa}`,
        name: "窓際ソファ",
        group: this.factory.makeSofa(sofa),
        material: "fabric",
        position: [x, 0, z],
        rotation,
        hp: 1,
        mass: 94,
        score: 110,
        radius: 1.48,
        grabbable: true,
        solid: true,
        chainPower: 0.86,
      });
    }
    this.addBreakable({
      id: "beer-server",
      name: "立ち飲み処ビールサーバー",
      group: this.factory.makeBeerServer(),
      material: "metal",
      position: [-10.4, 0, -14.1],
      hp: 4,
      mass: 260,
      score: 420,
      radius: 1.1,
      grabbable: false,
      solid: true,
      chainPower: 1.45,
    });
    for (let wall = 0; wall < 7; wall += 1) {
      this.addBreakable({
        id: `lounge-wall-${wall}`,
        name: wall === 3 ? "立ち飲み処の入口" : "ラウンジ内装壁",
        group: wall === 3 ? this.factory.makeDoor() : this.factory.makeWall(2.65, 3.2),
        material: "plaster",
        position: [-23.1 + wall * 2.75, 0, -10.35],
        hp: wall === 3 ? 2 : 3,
        mass: wall === 3 ? 96 : 175,
        score: wall === 3 ? 220 : 295,
        radius: 1.38,
        grabbable: false,
        solid: true,
        chainPower: 1.05,
        supportGroup: "frame--12",
        supportWeight: 0,
      });
    }
  }

  private addBreakable(options: BreakableOptions) {
    const tier = MATERIAL_TIER[options.material];
    const item: Breakable = {
      id: options.id,
      name: options.name,
      group: options.group,
      material: options.material,
      tier,
      hp: options.hp,
      maxHp: options.hp,
      mass: options.mass,
      score: options.score,
      radius: options.radius,
      alive: true,
      carried: false,
      grabbable: options.grabbable ?? tier <= 2,
      solid: options.solid ?? false,
      baseSolid: options.solid ?? false,
      zone: this.getZone(options.position[0], options.position[2]),
      supportGroup: options.supportGroup,
      supportWeight: options.supportWeight ?? 0,
      chainPower: options.chainPower ?? 0.6,
      district: options.district ?? "office",
    };
    item.group.position.set(...options.position);
    item.group.rotation.y += options.rotation ?? 0;
    item.group.userData.homePosition = item.group.position.clone();
    item.group.userData.homeRotation = item.group.rotation.clone();
    item.group.userData.breakableId = item.id;
    this.scene.add(item.group);
    this.breakables.push(item);
    this.breakableById.set(item.id, item);
  }

  private loadCharacter() {
    loadVoxelCharacter({
      definition: SOBAYA_CHARACTER,
      parent: this.playerAnchor,
      onReady: (loaded) => {
        if (this.disposed) return;
        this.playerAnchor.remove(this.fallbackPlayer);
        loaded.model.scale.multiplyScalar(0.78);
        this.actions = loaded.actions;
      },
      onError: () => {
        if (this.disposed) return;
        this.actions = undefined;
        this.notice = "正典モデルを読み込めなかったため、予備モデルで続行します。";
        this.noticeTone = "normal";
        this.noticeUntil = this.elapsed + 4;
      },
    });
  }

  private buildDebrisPool() {
    for (let index = 0; index < MAX_DEBRIS; index += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.82,
        metalness: 0,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
      mesh.visible = false;
      mesh.castShadow = index < 60;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.debris.push({
        mesh,
        velocity: new THREE.Vector3(),
        spin: new THREE.Vector3(),
        age: 0,
        lifetime: 2,
        active: false,
      });
    }
  }

  private makeDustPoints() {
    const count = 620;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 198;
      positions[index * 3 + 1] = Math.random() * 18 + 0.2;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 164;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xf7f2d7,
        size: 0.055,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat && ["Space", "KeyE", "KeyQ", "KeyR"].includes(event.code)) return;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
    }
    this.keys.add(event.code);
    if (event.code === "Space") this.trigger("smash");
    if (event.code === "KeyE") this.trigger("grab");
    if (event.code === "KeyQ") this.trigger("stomp");
    if (event.code === "KeyR") this.trigger("kanpai");
    if (event.code === "Escape" || event.code === "KeyP") this.togglePause();
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") this.trigger("dash");
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private readonly onVisibilityChange = () => {
    if (document.visibilityState === "hidden" && this.phase === "playing") {
      this.phase = "paused";
      this.requestSave();
      this.emitHud(true);
    }
  };

  private attachInput() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  private detachInput() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  private resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = width < 700 ? 54 : 47;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    if (this.disposed) return;
    this.animationFrame = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.elapsed += dt;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number) {
    this.updateDebris(dt);
    this.updateEffects(dt);
    this.updateDust(dt);
    this.updateGiantScale(dt);
    this.updateCamera(dt);

    if (this.phase === "levelup") {
      this.levelUpTimer -= dt;
      if (this.levelUpTimer <= 0) this.phase = "playing";
      this.emitHud();
      return;
    }
    if (this.phase !== "playing") {
      this.actions?.update(dt, this.elapsed, false);
      this.emitHud();
      return;
    }

    this.playSeconds += dt;
    this.lastSave += dt;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.ultimateTimer = Math.max(0, this.ultimateTimer - dt);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.chain = 0;
      }
    }

    this.readMovementInput();
    const moving = this.moveVector.lengthSq() > 0.0001 || this.dashTimer > 0;
    this.updatePlayer(dt);
    this.updateCarried(dt);
    this.updateFlying(dt);
    this.updatePendingImpact();
    this.updateUltimateEffects(dt);
    this.updateCollapses();
    this.updateTarget();
    this.actions?.update(dt, this.elapsed, moving);

    if (moving && this.elapsed - this.lastStep > (this.dashTimer > 0 ? 0.19 : 0.34)) {
      this.lastStep = this.elapsed;
      this.audio.footstep();
    }

    this.audio.update(dt, Math.min(1, this.combo / 25));
    if (this.lastSave >= SAVE_INTERVAL) this.requestSave();

    if (this.clearing) {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) this.finishClear();
    }
    this.emitHud();
  }

  private readMovementInput() {
    let x = this.controls.moveX;
    let z = this.controls.moveZ;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z += 1;

    const gamepad = navigator.getGamepads?.()[0];
    if (gamepad) {
      const padX = Math.abs(gamepad.axes[0] ?? 0) > 0.14 ? gamepad.axes[0] ?? 0 : 0;
      const padZ = Math.abs(gamepad.axes[1] ?? 0) > 0.14 ? gamepad.axes[1] ?? 0 : 0;
      x += padX;
      z += padZ;
      if (gamepad.buttons[0]?.pressed && !this.controls.smash) {
        this.controls.smash = true;
        this.beginSmash();
      } else if (!gamepad.buttons[0]?.pressed) {
        this.controls.smash = false;
      }
      if (gamepad.buttons[2]?.pressed && !this.controls.grab) {
        this.controls.grab = true;
        this.grabOrThrow();
      } else if (!gamepad.buttons[2]?.pressed) {
        this.controls.grab = false;
      }
      if (gamepad.buttons[1]?.pressed && !this.controls.dash) {
        this.controls.dash = true;
        this.beginDash();
      } else if (!gamepad.buttons[1]?.pressed) {
        this.controls.dash = false;
      }
      if (gamepad.buttons[3]?.pressed && !this.controls.stomp) {
        this.controls.stomp = true;
        this.beginStomp();
      } else if (!gamepad.buttons[3]?.pressed) {
        this.controls.stomp = false;
      }
      if (gamepad.buttons[5]?.pressed && !this.controls.kanpai) {
        this.controls.kanpai = true;
        this.beginKanpai();
      } else if (!gamepad.buttons[5]?.pressed) {
        this.controls.kanpai = false;
      }
    }

    this.moveVector.set(x, 0, z);
    if (this.moveVector.lengthSq() > 1) this.moveVector.normalize();
  }

  private updatePlayer(dt: number) {
    const level = getLevelForXp(this.xp).level;
    const speedScale = 1 + Math.max(0, this.giantScale - 1) * 0.12;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      const forward = this.forward();
      this.moveVector.copy(forward);
      this.movePlayer(
        forward.x * DASH_SPEED * speedScale * dt,
        forward.z * DASH_SPEED * speedScale * dt,
      );
      this.damageAlongDash(level);
      this.shake = Math.max(this.shake, 0.08);
      return;
    }

    if (this.moveVector.lengthSq() < 0.0001) return;
    const speed = (this.carried ? PLAYER_SPEED * 0.78 : PLAYER_SPEED) * speedScale;
    this.movePlayer(this.moveVector.x * speed * dt, this.moveVector.z * speed * dt);
    const desiredRotation = getPlayerFacingYaw(
      this.moveVector.x,
      this.moveVector.z,
    );
    this.playerAnchor.rotation.y = this.lerpAngle(
      this.playerAnchor.rotation.y,
      desiredRotation,
      1 - Math.exp(-dt * 16),
    );
  }

  private movePlayer(dx: number, dz: number) {
    const current = this.playerAnchor.position;
    const halfX = this.districtUnlocked ? CITY_HALF_X : OFFICE_HALF_X;
    const halfZ = this.districtUnlocked ? CITY_HALF_Z : OFFICE_HALF_Z;
    const boundaryPadding = Math.min(3.4, 0.8 * this.giantScale);
    const next = new THREE.Vector3(
      THREE.MathUtils.clamp(
        current.x + dx,
        -halfX + boundaryPadding,
        halfX - boundaryPadding,
      ),
      0,
      THREE.MathUtils.clamp(
        current.z + dz,
        -halfZ + boundaryPadding,
        halfZ - boundaryPadding,
      ),
    );
    for (const item of this.breakables) {
      if (!item.alive || item.carried || !item.solid || item.material === "slab") continue;
      if (!this.isItemAccessible(item)) continue;
      if (item.group.position.y > 1.2) continue;
      const distance = Math.hypot(
        next.x - item.group.position.x,
        next.z - item.group.position.z,
      );
      const minDistance = PLAYER_RADIUS * Math.min(this.giantScale, 3.2)
        + Math.min(item.radius, 2.3);
      if (distance >= minDistance || distance < 0.0001) continue;
      const normalX = (next.x - item.group.position.x) / distance;
      const normalZ = (next.z - item.group.position.z) / distance;
      next.x = item.group.position.x + normalX * minDistance;
      next.z = item.group.position.z + normalZ * minDistance;
    }
    current.copy(next);
  }

  private updateCamera(dt: number) {
    const portrait = this.container.clientHeight > this.container.clientWidth * 1.1;
    const cameraScale = 0.78 + this.giantScale * 0.34;
    const offset = portrait
      ? new THREE.Vector3(11.5, 18.5, 19.5).multiplyScalar(cameraScale)
      : new THREE.Vector3(12.5, 15.3, 18.5).multiplyScalar(cameraScale);
    this.desiredCamera.copy(this.playerAnchor.position).add(offset);
    const response = 1 - Math.exp(-dt * 4.8);
    this.camera.position.lerp(this.desiredCamera, response);
    this.cameraLook.lerp(
      this.playerAnchor.position.clone().add(new THREE.Vector3(
        0,
        1.25 * this.giantScale,
        -2.5 * Math.min(2.4, this.giantScale),
      )),
      response,
    );
    const shakeStrength = this.shakeEnabled ? this.shake : 0;
    if (shakeStrength > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * shakeStrength;
      this.camera.position.y += (Math.random() - 0.5) * shakeStrength * 0.7;
      this.camera.position.z += (Math.random() - 0.5) * shakeStrength;
      this.shake *= Math.exp(-dt * 9);
    }
    this.camera.lookAt(this.cameraLook);
  }

  private updateDust(dt: number) {
    this.dustPoints.rotation.y += dt * 0.008;
    const positions = this.dustPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index = 0; index < positions.count; index += 1) {
      let y = positions.getY(index) + dt * (0.015 + (index % 5) * 0.004);
      if (y > 19) y = 0.1;
      positions.setY(index, y);
    }
    positions.needsUpdate = true;
  }

  private updateTarget() {
    const forward = this.forward();
    const origin = this.playerAnchor.position;
    const level = getLevelForXp(this.xp).level;
    const reach = 5.5 * Math.min(2.8, this.giantScale);
    const reachHeight = 5.2 * Math.min(3.5, this.giantScale);
    let best: Breakable | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const item of this.breakables) {
      if (!item.alive || item.carried || !this.isItemAccessible(item)) continue;
      if (item.group.position.y > reachHeight) continue;
      if (item.group.position.y < -0.25 && level < 5) continue;
      const dx = item.group.position.x - origin.x;
      const dz = item.group.position.z - origin.z;
      const distance = Math.hypot(dx, dz) - Math.min(item.radius, 2);
      if (distance > reach) continue;
      const dot = (dx * forward.x + dz * forward.z) / Math.max(0.001, Math.hypot(dx, dz));
      if (dot < 0.25) continue;
      const score = distance - dot * 1.8;
      if (score < bestScore) {
        bestScore = score;
        best = item;
      }
    }

    this.radarActive = false;
    this.radarDistance = 0;
    this.radarArrow = "↑";
    if (!best) {
      const radarCandidates = this.breakables
        .filter((item) => (
          item.alive
          && !item.carried
          && this.isItemAccessible(item)
          && canBreakMaterial(level, item.material)
          && !(item.group.position.y < -0.25 && level < 5)
        ))
        .map((item) => ({
          item,
          distance: Math.hypot(
            item.group.position.x - origin.x,
            item.group.position.z - origin.z,
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      const shouldScan = radarCandidates.length > 0
        && (radarCandidates.length <= 28 || this.elapsed - this.lastBreakAt >= 10);
      const nearest = shouldScan ? radarCandidates[0] : undefined;
      if (nearest) {
        best = nearest.item;
        this.radarActive = true;
        this.radarDistance = nearest.distance;
        this.radarArrow = getRadarArrow(
          best.group.position.x - origin.x,
          best.group.position.z - origin.z,
          this.playerAnchor.rotation.y,
        );
      }
    }

    this.target = best;
    if (!best) {
      this.targetRing.visible = false;
      this.targetBeacon.visible = false;
      return;
    }
    const unlocked = canBreakMaterial(level, best.material);
    const color = unlocked ? 0x50e1c2 : 0xff6a4d;
    (this.targetRing.material as THREE.MeshBasicMaterial).color.setHex(color);
    (this.targetBeacon.material as THREE.MeshBasicMaterial).color.setHex(color);
    this.targetRing.position.set(best.group.position.x, 0.16, best.group.position.z);
    this.targetRing.scale.setScalar(
      (this.radarActive ? 2.15 : 1) + Math.sin(this.elapsed * 4.5) * 0.08,
    );
    this.targetRing.visible = true;
    this.targetBeacon.position.set(
      best.group.position.x,
      this.radarActive
        ? Math.max(4, best.group.position.y + 4.8 + Math.sin(this.elapsed * 3) * 0.5)
        : Math.max(0.8, best.group.position.y + 0.8),
      best.group.position.z,
    );
    this.targetBeacon.scale.set(
      this.radarActive ? 2.2 : 1,
      this.radarActive ? 8 : 1,
      this.radarActive ? 2.2 : 1,
    );
    this.targetBeacon.visible = true;
  }

  private beginSmash() {
    if (this.elapsed - this.lastAttack < 0.42 || this.pendingImpact) return;
    this.lastAttack = this.elapsed;
    const forward = this.forward();
    const center = this.playerAnchor.position.clone().addScaledVector(
      forward,
      1.42 * Math.min(3.6, this.giantScale),
    );
    center.y = 0.5 * this.giantScale;
    this.pendingImpact = {
      at: this.elapsed + 0.17,
      kind: "smash",
      center,
    };
    this.actions?.triggerSmash(false);
    this.audio.swing(false);
  }

  private beginDash() {
    const level = getLevelForXp(this.xp).level;
    if (level < 3) {
      this.lockedNotice(3, "ショルダーダッシュ");
      return;
    }
    if (this.dashCooldown > 0 || this.dashTimer > 0) return;
    this.dashTimer = 0.52 + Math.min(0.22, (this.giantScale - 1) * 0.05);
    this.dashCooldown = 1.05;
    this.audio.swing(true);
    this.notice = "ショルダーダッシュ！壁まで一直線です！";
    this.noticeTone = "good";
    this.noticeUntil = this.elapsed + 1.35;
  }

  private beginStomp() {
    const level = getLevelForXp(this.xp).level;
    if (level < 4) {
      this.lockedNotice(4, "快適ストンプ");
      return;
    }
    if (this.elapsed - this.lastAttack < 0.8 || this.pendingImpact) return;
    this.lastAttack = this.elapsed;
    const center = this.playerAnchor.position.clone();
    center.y = 0;
    this.pendingImpact = {
      at: this.elapsed + 0.34,
      kind: "stomp",
      center,
    };
    this.actions?.triggerSmash(true);
    this.audio.swing(true);
    this.notice = "快適ストンプ、いきます！";
    this.noticeTone = "good";
    this.noticeUntil = this.elapsed + 1.1;
  }

  private beginKanpai() {
    const level = getLevelForXp(this.xp).level;
    if (level < 5) {
      this.lockedNotice(5, "乾杯クラッシュ");
      return;
    }
    if (this.beer < 99.5) {
      this.notice = `乾杯ゲージ ${Math.floor(this.beer)}%。壊して泡を満タンに！`;
      this.noticeTone = "normal";
      this.noticeUntil = this.elapsed + 2;
      this.audio.locked();
      return;
    }
    if (this.elapsed - this.lastAttack < 1 || this.pendingImpact) return;
    this.beer = 0;
    this.lastAttack = this.elapsed;
    this.ultimateTimer = 4.6;
    const center = this.playerAnchor.position.clone();
    center.y = 0;
    this.pendingImpact = {
      at: this.elapsed + 0.52,
      kind: "kanpai",
      center,
    };
    this.actions?.triggerSmash(true);
    this.audio.beer();
    this.notice = "超乾杯奥義！ビールビーム、ジョッキメテオ発射！";
    this.noticeTone = "level";
    this.noticeUntil = this.elapsed + 2;
  }

  private grabOrThrow() {
    const level = getLevelForXp(this.xp).level;
    if (level < 2) {
      this.lockedNotice(2, "つかむ・投げる");
      return;
    }
    if (this.carried) {
      this.throwCarried();
      return;
    }
    const origin = this.playerAnchor.position;
    let best: Breakable | null = null;
    let distance = Number.POSITIVE_INFINITY;
    for (const item of this.breakables) {
      if (!item.alive || item.carried || !item.grabbable || item.tier > level) continue;
      if (!this.isItemAccessible(item)) continue;
      const itemDistance = Math.hypot(
        item.group.position.x - origin.x,
        item.group.position.z - origin.z,
      ) - item.radius;
      if (
        itemDistance < distance
        && itemDistance <= 2.2 * Math.min(2.6, this.giantScale)
      ) {
        distance = itemDistance;
        best = item;
      }
    }
    if (!best) {
      this.notice = "近くの家具へ向いて、もう一度つかみます！";
      this.noticeTone = "normal";
      this.noticeUntil = this.elapsed + 1.6;
      return;
    }
    best.carried = true;
    best.solid = false;
    this.carried = best;
    this.audio.pickup();
    this.notice = `${best.name}を持ち上げました。Eで投げます！`;
    this.noticeTone = "good";
    this.noticeUntil = this.elapsed + 2;
  }

  private throwCarried() {
    const item = this.carried;
    if (!item) return;
    item.carried = false;
    this.carried = null;
    const forward = this.forward();
    item.group.position.copy(this.playerAnchor.position)
      .addScaledVector(forward, 1.35 * Math.min(2.8, this.giantScale))
      .add(new THREE.Vector3(0, 1.35 * this.giantScale, 0));
    this.flying.push({
      item,
      velocity: forward.multiplyScalar(
        12 + Math.min(5, item.mass / 45) + this.giantScale * 1.6,
      ).add(new THREE.Vector3(0, 4.2 + this.giantScale * 0.8, 0)),
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 7,
      ),
      age: 0,
    });
    this.audio.throw();
    this.notice = `${item.name}、ついでにいってらっしゃい！`;
    this.noticeTone = "good";
    this.noticeUntil = this.elapsed + 1.35;
  }

  private updateCarried(dt: number) {
    if (!this.carried) return;
    const forward = this.forward();
    const targetPosition = this.playerAnchor.position.clone()
      .addScaledVector(forward, 1.15 * Math.min(2.8, this.giantScale))
      .add(new THREE.Vector3(0, 1.15 * this.giantScale, 0));
    this.carried.group.position.lerp(targetPosition, 1 - Math.exp(-dt * 22));
    this.carried.group.rotation.y += dt * 0.7;
  }

  private updateFlying(dt: number) {
    for (let index = this.flying.length - 1; index >= 0; index -= 1) {
      const flying = this.flying[index];
      if (!flying || !flying.item.alive) {
        this.flying.splice(index, 1);
        continue;
      }
      flying.age += dt;
      flying.velocity.y -= 13.5 * dt;
      flying.item.group.position.addScaledVector(flying.velocity, dt);
      flying.item.group.rotation.x += flying.spin.x * dt;
      flying.item.group.rotation.y += flying.spin.y * dt;
      flying.item.group.rotation.z += flying.spin.z * dt;

      let collided: Breakable | null = null;
      for (const target of this.breakables) {
        if (!target.alive || target === flying.item || target.carried) continue;
        if (!this.isItemAccessible(target)) continue;
        if (target.group.position.y > 5.2 * Math.min(3.5, this.giantScale)) continue;
        const distance = target.group.position.distanceTo(flying.item.group.position)
          - Math.min(target.radius, 2.5)
          - Math.min(flying.item.radius, 1.2);
        if (distance <= 0.25) {
          collided = target;
          break;
        }
      }

      if (collided) {
        const throwPower = 2.2 + Math.min(4.2, flying.item.mass / 55);
        this.damageItem(collided, throwPower, "throw", 1);
        this.destroyItem(flying.item, "throw", 1, true);
        this.spawnShockwave(flying.item.group.position, 0xffbf48, 1.8, 0.34);
        this.flying.splice(index, 1);
        continue;
      }

      if (flying.item.group.position.y <= 0.1) {
        flying.item.group.position.y = 0;
        if (flying.age > 0.45) {
          this.destroyItem(flying.item, "throw", 1, true);
          this.spawnShockwave(flying.item.group.position, 0xffbf48, 1.35, 0.25);
          this.flying.splice(index, 1);
        } else {
          flying.velocity.y = Math.abs(flying.velocity.y) * 0.38;
          flying.velocity.x *= 0.72;
          flying.velocity.z *= 0.72;
        }
      }
      if (flying.age > 4) {
        this.destroyItem(flying.item, "throw", 1, true);
        this.flying.splice(index, 1);
      }
    }
  }

  private updatePendingImpact() {
    if (!this.pendingImpact || this.elapsed < this.pendingImpact.at) return;
    const impact = this.pendingImpact;
    this.pendingImpact = null;
    if (impact.kind === "smash") {
      const radius = 2.25 * Math.min(3.4, this.giantScale);
      this.applyAreaDamage(
        impact.center,
        radius,
        2.15 + this.giantScale * 0.72,
        "smash",
        0,
      );
      this.spawnShockwave(impact.center, 0xffffff, radius * 1.05, 0.34);
      this.shake = Math.max(this.shake, 0.34 + this.giantScale * 0.05);
      navigator.vibrate?.(20);
    } else if (impact.kind === "stomp") {
      const radius = 4.4 * Math.min(3.8, this.giantScale);
      this.applyAreaDamage(
        impact.center,
        radius,
        3.15 + this.giantScale * 1.1,
        "stomp",
        0,
      );
      this.spawnShockwave(impact.center, 0xff8468, radius * 1.05, 0.68);
      this.spawnShockwave(impact.center, 0xffffff, radius * 0.72, 0.48);
      this.shake = Math.max(this.shake, 0.72 + this.giantScale * 0.12);
      navigator.vibrate?.([35, 28, 45]);
    } else {
      this.fireBeerBeamAndMeteors();
      this.spawnShockwave(
        impact.center,
        0xffc642,
        11 * Math.min(2.5, this.giantScale),
        1.1,
      );
      this.spawnShockwave(
        impact.center,
        0x50e1c2,
        7.5 * Math.min(2.5, this.giantScale),
        0.82,
      );
      this.shake = Math.max(this.shake, 1.45 + this.giantScale * 0.12);
      navigator.vibrate?.([50, 35, 80]);
    }
  }

  private fireBeerBeamAndMeteors() {
    const direction = this.forward();
    const origin = this.playerAnchor.position.clone();
    origin.y = 1.35 * this.giantScale;
    const beamLength = 58 + this.giantScale * 10;
    const beamWidth = 2.4 + this.giantScale * 1.25;
    const beamGroup = new THREE.Group();
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9f18,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff4b0,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(beamWidth, beamWidth * 0.72, beamLength, 18, 1, true),
      outerMaterial,
    );
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(beamWidth * 0.36, beamWidth * 0.28, beamLength, 14),
      coreMaterial,
    );
    beamGroup.add(outer, core);
    beamGroup.position.copy(origin).addScaledVector(direction, beamLength / 2);
    beamGroup.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(direction.x, 0, direction.z).normalize(),
    );
    beamGroup.scale.set(0.2, 1, 0.2);
    this.scene.add(beamGroup);
    this.beerBeams.push({
      group: beamGroup,
      materials: [outerMaterial, coreMaterial],
      age: 0,
      lifetime: 1.25,
    });

    const beamTargets = this.breakables
      .filter((item) => (
        item.alive
        && !item.carried
        && this.isItemAccessible(item)
        && canBreakMaterial(5, item.material)
      ))
      .map((item) => {
        const dx = item.group.position.x - origin.x;
        const dz = item.group.position.z - origin.z;
        const projection = dx * direction.x + dz * direction.z;
        const perpendicular = Math.abs(dx * direction.z - dz * direction.x);
        return { item, projection, perpendicular };
      })
      .filter(({ item, projection, perpendicular }) => (
        projection >= -2
        && projection <= beamLength
        && perpendicular <= beamWidth + Math.min(4, item.radius * 0.45)
      ))
      .sort((a, b) => a.projection - b.projection);

    for (const [index, entry] of beamTargets.entries()) {
      this.damageItem(
        entry.item,
        22 + this.giantScale * 5,
        "kanpai",
        2 + Math.min(4, Math.floor(index / 5)),
      );
    }

    const remaining = this.breakables
      .filter((item) => (
        item.alive
        && !item.carried
        && this.isItemAccessible(item)
        && canBreakMaterial(5, item.material)
      ))
      .sort((a, b) => {
        const distanceA = a.group.position.distanceToSquared(origin);
        const distanceB = b.group.position.distanceToSquared(origin);
        return distanceB - distanceA;
      });
    const meteorCount = Math.min(
      remaining.length,
      remaining.length <= 32 ? remaining.length : 12 + Math.floor(this.giantScale * 4),
    );
    const chosen: Breakable[] = [];
    for (let index = 0; index < meteorCount; index += 1) {
      const sourceIndex = meteorCount === remaining.length
        ? index
        : Math.floor(index * remaining.length / meteorCount);
      const item = remaining[sourceIndex];
      if (item && !chosen.includes(item)) chosen.push(item);
    }
    chosen.forEach((item, index) => {
      const target = item.group.position.clone();
      const start = target.clone().add(new THREE.Vector3(
        (index % 3 - 1) * 2.2,
        28 + (index % 6) * 3.2 + this.giantScale * 2,
        ((index + 1) % 3 - 1) * 2,
      ));
      const mug = this.factory.makeMeteorMug(0.9 + this.giantScale * 0.12);
      mug.position.copy(start);
      mug.rotation.set(index * 0.31, index * 0.57, -0.45);
      this.scene.add(mug);
      this.mugMeteors.push({
        group: mug,
        start,
        target,
        age: -index * 0.065,
        duration: 0.72 + index % 4 * 0.08,
      });
    });

    this.audio.ultimate();
    this.notice = `ビールビーム ${beamTargets.length}件直撃！ ジョッキメテオ ${chosen.length}発！`;
    this.noticeTone = "level";
    this.noticeUntil = this.elapsed + 3.8;
  }

  private updateUltimateEffects(dt: number) {
    for (let index = this.beerBeams.length - 1; index >= 0; index -= 1) {
      const beam = this.beerBeams[index];
      if (!beam) continue;
      beam.age += dt;
      const ratio = Math.min(1, beam.age / beam.lifetime);
      const pulse = 0.84 + Math.sin(ratio * Math.PI * 9) * 0.16;
      beam.group.scale.set(
        (0.2 + Math.sin(Math.min(1, ratio * 5) * Math.PI / 2) * 0.8) * pulse,
        1,
        (0.2 + Math.sin(Math.min(1, ratio * 5) * Math.PI / 2) * 0.8) * pulse,
      );
      beam.materials[0]!.opacity = (1 - ratio) * 0.62;
      beam.materials[1]!.opacity = (1 - ratio) * 0.92;
      if (ratio >= 1) {
        this.removeBeerBeam(beam);
        this.beerBeams.splice(index, 1);
      }
    }

    for (let index = this.mugMeteors.length - 1; index >= 0; index -= 1) {
      const meteor = this.mugMeteors[index];
      if (!meteor) continue;
      meteor.age += dt;
      if (meteor.age < 0) continue;
      const ratio = Math.min(1, meteor.age / meteor.duration);
      const fall = ratio * ratio * (3 - 2 * ratio);
      meteor.group.position.lerpVectors(meteor.start, meteor.target, fall);
      meteor.group.rotation.x += dt * 6.5;
      meteor.group.rotation.y += dt * 8.2;
      meteor.group.rotation.z += dt * 4.5;
      if (ratio < 1) continue;
      this.scene.remove(meteor.group);
      this.mugMeteors.splice(index, 1);
      const radius = 3.2 + this.giantScale * 1.05;
      this.applyAreaDamage(
        meteor.target,
        radius,
        18 + this.giantScale * 4,
        "kanpai",
        3,
      );
      this.spawnShockwave(meteor.target, 0xffb326, radius * 1.2, 0.62);
      this.spawnShockwave(meteor.target, 0xffffff, radius * 0.72, 0.4);
      this.spawnDebris(meteor.target, "concrete", 12, 5.5 + this.giantScale);
      this.audio.meteor();
      this.shake = Math.max(this.shake, 0.65 + this.giantScale * 0.08);
    }
  }

  private removeBeerBeam(beam: BeerBeamEffect) {
    this.scene.remove(beam.group);
    beam.group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    for (const material of beam.materials) material.dispose();
  }

  private damageAlongDash(level: DestructionTier) {
    const center = this.playerAnchor.position;
    for (const item of this.breakables) {
      if (!item.alive || item.carried) continue;
      if (!this.isItemAccessible(item)) continue;
      const distance = Math.hypot(
        item.group.position.x - center.x,
        item.group.position.z - center.z,
      ) - Math.min(item.radius, 1.5);
      if (distance > 1.05 * Math.min(3.5, this.giantScale)) continue;
      const lastDash = Number(item.group.userData.lastDashAt ?? -10);
      if (this.elapsed - lastDash < 0.5) continue;
      item.group.userData.lastDashAt = this.elapsed;
      if (item.tier <= level) {
        this.damageItem(item, 2.8 + this.giantScale * 0.9, "dash", 0);
        this.spawnShockwave(
          center,
          0x47bfff,
          1.4 * Math.min(3, this.giantScale),
          0.22,
        );
      } else {
        this.lockedItem(item);
        this.dashTimer = Math.min(this.dashTimer, 0.08);
      }
    }
  }

  private applyAreaDamage(
    center: THREE.Vector3,
    radius: number,
    power: number,
    source: DemolitionAction,
    chainDepth: number,
  ) {
    let hits = 0;
    let locked: Breakable | null = null;
    const targets = this.breakables
      .filter((item) => (
        item.alive
        && !item.carried
        && this.isItemAccessible(item)
      ))
      .map((item) => ({
        item,
        distance: Math.hypot(
          item.group.position.x - center.x,
          item.group.position.z - center.z,
        ) - Math.min(item.radius, 2.8),
      }))
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    for (const { item, distance } of targets) {
      if (
        item.group.position.y > 5.2 * Math.min(3.5, this.giantScale)
        && source !== "kanpai"
      ) continue;
      if (!canBreakMaterial(getLevelForXp(this.xp).level, item.material)) {
        locked ??= item;
        continue;
      }
      const falloff = 1 - Math.max(0, distance) / Math.max(0.1, radius) * 0.38;
      this.damageItem(item, power * falloff, source, chainDepth);
      hits += 1;
    }
    if (hits === 0 && locked) this.lockedItem(locked);
    if (hits === 0 && !locked && source === "smash") {
      this.notice = "空振りも準備運動です！壊せる物へ近づきます！";
      this.noticeTone = "normal";
      this.noticeUntil = this.elapsed + 1.5;
    }
  }

  private damageItem(
    item: Breakable,
    power: number,
    source: DemolitionAction,
    chainDepth: number,
  ) {
    if (!item.alive) return false;
    if (!this.isItemAccessible(item)) return false;
    const level = getLevelForXp(this.xp).level;
    if (!canBreakMaterial(level, item.material)) {
      this.lockedItem(item);
      return false;
    }
    const tierResistance = 0.55 + item.tier * 0.18;
    const damage = Math.max(1, Math.floor(power / tierResistance));
    item.hp = Math.max(0, item.hp - damage);
    this.audio.impact(item.material, Math.min(2.5, power / 2), chainDepth);
    this.spawnDebris(item.group.position, item.material, Math.min(7, 2 + damage), power * 0.65);
    if (item.hp > 0) {
      const scale = 1 + Math.min(0.08, power * 0.012);
      item.group.scale.set(scale, 1 - (scale - 1) * 0.45, scale);
      window.setTimeout(() => {
        if (item.alive) item.group.scale.setScalar(1);
      }, 90);
      this.notice = `${item.name}、あと${item.hp}回です！`;
      this.noticeTone = "normal";
      this.noticeUntil = this.elapsed + 1.1;
      return false;
    }
    this.destroyItem(item, source, chainDepth, false);
    return true;
  }

  private destroyItem(
    item: Breakable,
    source: DemolitionAction,
    chainDepth: number,
    forced: boolean,
  ) {
    if (!item.alive) return;
    if (!this.isItemAccessible(item)) return;
    const levelBefore = getLevelForXp(this.xp).level;
    if (!forced && !canBreakMaterial(levelBefore, item.material)) return;
    const position = item.group.position.clone();
    item.alive = false;
    item.carried = false;
    item.group.visible = false;
    item.hp = 0;
    this.destroyedIds.add(item.id);
    this.destroyed += 1;
    this.lastBreakAt = this.elapsed;
    let districtJustUnlocked = false;
    if (
      !this.districtUnlocked
      && item.district === "office"
      && item.material === "plaster"
      && isOfficeExteriorWall(item.id)
    ) {
      this.districtUnlocked = true;
      districtJustUnlocked = true;
    }
    let giantStageIncreased = false;
    if (item.district === "city") {
      this.cityDestroyed += 1;
      this.giantScaleTarget = getGiantScale(
        this.cityDestroyed,
        this.cityBreakableTotal,
      );
      const nextStage = getGiantStage(this.giantScaleTarget);
      giantStageIncreased = nextStage > this.giantStage;
      this.giantStage = Math.max(this.giantStage, nextStage);
    }
    this.combo += 1;
    this.chain = chainDepth > 0 ? Math.max(this.chain, chainDepth + 1) : 1;
    this.comboTimer = COMBO_WINDOW;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const gainedXp = getBreakXp(item.material, item.mass, chainDepth);
    const gainedScore = getBreakScore(item.score, this.combo, chainDepth);
    this.xp += gainedXp;
    this.score += gainedScore;
    this.beer = Math.min(100, this.beer + 3.5 + item.tier * 1.4 + chainDepth * 0.7);

    this.audio.impact(item.material, 1.2 + item.tier * 0.28, chainDepth);
    this.spawnDebris(position, item.material, 6 + item.tier * 3, 2.5 + item.tier * 0.7);
    this.addRubble(position, item.material, 2 + Math.min(4, item.tier));
    this.spawnShockwave(
      position,
      item.tier >= 4 ? 0xff8468 : item.tier >= 2 ? 0x47bfff : 0xffffff,
      1.25 + item.tier * 0.3,
      0.25 + item.tier * 0.04,
    );
    this.shake = Math.max(this.shake, 0.12 + item.tier * 0.09);
    navigator.vibrate?.(item.tier >= 4 ? 34 : 12);

    const sourceLabel = source === "throw"
      ? "投げ壊し"
      : source === "dash"
        ? "貫通"
        : source === "stomp"
          ? "地響き"
          : source === "kanpai"
            ? "乾杯"
            : "整理";
    this.notice = `${sourceLabel}！ ${item.name} +${gainedScore.toLocaleString()} / XP +${gainedXp}`;
    this.noticeTone = chainDepth > 0 ? "level" : "good";
    this.noticeUntil = this.elapsed + 1.45;

    this.trackGoalProgress(item, source, chainDepth);
    if (item.supportWeight > 0 && item.supportGroup) {
      this.evaluateSupports(item.supportGroup, chainDepth + 1);
    }
    this.propagateChain(item, position, chainDepth);

    const levelAfter = getLevelForXp(this.xp).level;
    if (levelAfter > levelBefore) this.handleLevelUp(levelAfter);
    if (districtJustUnlocked) {
      this.notice = "外周壁突破！麻布十番・全街区の解体ルートが開きました！";
      this.noticeTone = "level";
      this.noticeUntil = this.elapsed + 4.5;
      this.audio.levelUp(5);
      this.spawnShockwave(position, 0x47bfff, 13, 1.1);
      this.spawnShockwave(position, 0xffbf48, 8, 0.82);
      this.shake = Math.max(this.shake, 1.1);
      this.requestSave();
    } else if (giantStageIncreased) {
      this.notice = `巨大化！そば屋 ${this.giantScaleTarget.toFixed(1)}倍。街が小さく見えてきました！`;
      this.noticeTone = "level";
      this.noticeUntil = this.elapsed + 3.6;
      this.audio.levelUp(5);
      this.spawnShockwave(this.playerAnchor.position, 0xff5b9e, 8 + this.giantStage * 3, 0.9);
    }
    if (this.destroyed >= this.breakables.length && !this.clearing) this.beginClear();
  }

  private propagateChain(item: Breakable, position: THREE.Vector3, chainDepth: number) {
    if (chainDepth >= 8 || item.chainPower < 0.55) return;
    const radius = 0.9 + item.chainPower * 1.15;
    const nearby = this.breakables
      .filter((other) => (
        other.alive
        && other !== item
        && !other.carried
        && this.isItemAccessible(other)
      ))
      .map((other) => ({
        item: other,
        distance: Math.hypot(
          other.group.position.x - position.x,
          other.group.position.z - position.z,
        ) - Math.min(other.radius, 1.4),
      }))
      .filter(({ item: other, distance }) => (
        distance <= radius
        && other.tier <= item.tier
        && canBreakMaterial(getLevelForXp(this.xp).level, other.material)
      ))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);

    for (const [index, entry] of nearby.entries()) {
      this.collapses.push({
        item: entry.item,
        at: this.elapsed + 0.06 + index * 0.055,
        chainDepth: chainDepth + 1,
      });
    }
  }

  private evaluateSupports(groupName: string, chainDepth: number) {
    const supports = this.breakables.filter(
      (item) => (
        item.supportGroup === groupName
        && item.supportWeight > 0
        && this.isItemAccessible(item)
      ),
    );
    const aliveWeight = supports.reduce(
      (total, item) => total + (item.alive ? item.supportWeight : 0),
      0,
    );
    if (aliveWeight > 1) return;
    const dependents = this.breakables
      .filter((item) => (
        item.alive
        && item.supportGroup === groupName
        && item.supportWeight === 0
        && this.isItemAccessible(item)
        && canBreakMaterial(getLevelForXp(this.xp).level, item.material)
      ))
      .sort((a, b) => b.group.position.y - a.group.position.y);
    dependents.forEach((item, index) => {
      this.collapses.push({
        item,
        at: this.elapsed + 0.18 + index * 0.055,
        chainDepth,
      });
    });
    if (dependents.length > 0) {
      this.notice = `支持力低下！ ${dependents.length}部材が連鎖崩壊します！`;
      this.noticeTone = "level";
      this.noticeUntil = this.elapsed + 2.4;
    }
  }

  private updateCollapses() {
    for (let index = this.collapses.length - 1; index >= 0; index -= 1) {
      const collapse = this.collapses[index];
      if (!collapse || collapse.at > this.elapsed) continue;
      this.collapses.splice(index, 1);
      if (!collapse.item.alive) continue;
      const resistance = 0.55 + collapse.item.tier * 0.18;
      const power = Math.max(
        1.2,
        (collapse.item.maxHp + 0.5) * resistance,
      );
      this.damageItem(collapse.item, power, "stomp", collapse.chainDepth);
    }
  }

  private handleLevelUp(level: DestructionTier) {
    const definition = getLevelForXp(this.xp);
    this.phase = "levelup";
    this.levelUpTimer = 2.6;
    this.notice = `LEVEL ${level}「${definition.title}」解禁！ ${definition.unlock}`;
    this.noticeTone = "level";
    this.noticeUntil = this.elapsed + 4;
    this.audio.levelUp(level);
    this.spawnShockwave(
      this.playerAnchor.position,
      Number.parseInt(definition.accent.slice(1), 16),
      5.2,
      0.76,
    );
    this.applyAreaDamage(
      this.playerAnchor.position,
      3.1,
      2.2 + level * 0.3,
      "smash",
      1,
    );
    this.shake = Math.max(this.shake, 0.6);
    this.requestSave();
  }

  private lockedItem(item: Breakable) {
    if (this.elapsed - this.lastLocked < 0.65) return;
    this.lastLocked = this.elapsed;
    this.audio.locked();
    this.notice = `${item.name}は LEVEL ${item.tier} から。今は${MATERIAL_LABEL[item.material]}を壊せません！`;
    this.noticeTone = "locked";
    this.noticeUntil = this.elapsed + 2.2;
    this.spawnShockwave(item.group.position, 0xff6a4d, 1.15, 0.22);
  }

  private lockedNotice(level: DestructionTier, action: string) {
    this.audio.locked();
    this.notice = `${action}は LEVEL ${level} で解禁です！`;
    this.noticeTone = "locked";
    this.noticeUntil = this.elapsed + 1.8;
  }

  private trackGoalProgress(
    item: Breakable,
    source: DemolitionAction,
    chainDepth: number,
  ) {
    const level = getLevelForXp(this.xp).level;
    if (source === "throw" && level >= 2) this.throwBreaks += 1;
    if (source === "dash" && item.material === "plaster" && level >= 3) {
      this.dashWallBreaks += 1;
    }
    if (chainDepth > 0 && level >= 4) this.cascadeBreaks += 1;
    if (source === "kanpai" && item.material === "steel" && level >= 5) {
      this.kanpaiSteelBreaks += 1;
    }

    for (let guard = 0; guard < 5; guard += 1) {
      const currentLevel = getLevelForXp(this.xp).level;
      const goal = getActiveGoal(currentLevel, this.completedGoals);
      if (!goal || this.completedGoals.has(goal.id)) break;
      const progress = this.getGoalProgress(goal.id);
      if (progress < goal.target) break;
      this.completedGoals.add(goal.id);
      this.xp += goal.bonusXp;
      this.score += goal.bonusScore;
      this.beer = Math.min(100, this.beer + 18);
      this.notice = `業務目標「${goal.title}」達成！ +${goal.bonusScore.toLocaleString()} / XP +${goal.bonusXp}`;
      this.noticeTone = "level";
      this.noticeUntil = this.elapsed + 3;
      this.audio.beer();
      this.spawnShockwave(this.playerAnchor.position, 0xffbd3d, 3.7, 0.55);
    }
  }

  private getGoalProgress(id: DemolitionGoalId) {
    if (id === "combo-8") return this.maxCombo;
    if (id === "throw-3") return this.throwBreaks;
    if (id === "dash-wall-3") return this.dashWallBreaks;
    if (id === "cascade-6") return this.cascadeBreaks;
    return this.kanpaiSteelBreaks;
  }

  private spawnDebris(
    position: THREE.Vector3,
    material: DemolitionMaterial,
    count: number,
    force: number,
  ) {
    let spawned = 0;
    for (const piece of this.debris) {
      if (piece.active) continue;
      const size = 0.12 + Math.random() * (material === "slab" || material === "concrete" ? 0.42 : 0.28);
      piece.active = true;
      piece.age = 0;
      piece.lifetime = 1.3 + Math.random() * 1.25;
      piece.mesh.visible = true;
      piece.mesh.position.copy(position).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        0.2 + Math.random() * 0.9,
        (Math.random() - 0.5) * 0.8,
      ));
      piece.mesh.scale.set(
        size * (0.7 + Math.random() * 1.1),
        size * (0.45 + Math.random() * 1.4),
        size * (0.7 + Math.random() * 1.1),
      );
      const pieceMaterial = piece.mesh.material as THREE.MeshStandardMaterial;
      pieceMaterial.color.setHex(
        spawned % 5 === 0 && material !== "steel"
          ? 0xf3eee5
          : MATERIAL_COLOR[material],
      );
      pieceMaterial.metalness = material === "steel" ? 0.62 : material === "metal" ? 0.34 : 0;
      pieceMaterial.roughness = material === "glass" ? 0.18 : material === "steel" ? 0.42 : 0.84;
      pieceMaterial.opacity = 1;
      piece.velocity.set(
        (Math.random() - 0.5) * force * 2.1,
        1.8 + Math.random() * force * 1.3,
        (Math.random() - 0.5) * force * 2.1,
      );
      piece.spin.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 8,
      );
      spawned += 1;
      if (spawned >= count) break;
    }
  }

  private updateDebris(dt: number) {
    for (const piece of this.debris) {
      if (!piece.active) continue;
      piece.age += dt;
      piece.velocity.y -= 12.5 * dt;
      piece.mesh.position.addScaledVector(piece.velocity, dt);
      piece.mesh.rotation.x += piece.spin.x * dt;
      piece.mesh.rotation.y += piece.spin.y * dt;
      piece.mesh.rotation.z += piece.spin.z * dt;
      if (piece.mesh.position.y < 0.03) {
        piece.mesh.position.y = 0.03;
        if (Math.abs(piece.velocity.y) > 1.1) piece.velocity.y *= -0.32;
        else piece.velocity.y = 0;
        piece.velocity.x *= Math.exp(-dt * 5.5);
        piece.velocity.z *= Math.exp(-dt * 5.5);
        piece.spin.multiplyScalar(Math.exp(-dt * 4.5));
      }
      if (piece.age > piece.lifetime - 0.45) {
        const ratio = Math.max(0, (piece.lifetime - piece.age) / 0.45);
        (piece.mesh.material as THREE.MeshStandardMaterial).opacity = ratio;
      }
      if (piece.age >= piece.lifetime) {
        piece.active = false;
        piece.mesh.visible = false;
      }
    }
  }

  private addRubble(
    position: THREE.Vector3,
    material: DemolitionMaterial,
    count: number,
  ) {
    const mesh = this.rubbleMeshes.get(material);
    if (!mesh) return;
    let current = this.rubbleCounts.get(material) ?? 0;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const translation = new THREE.Vector3();
    for (let index = 0; index < count && current < 1_200; index += 1) {
      translation.set(
        position.x + (Math.random() - 0.5) * 1.25,
        0.01 + Math.random() * 0.09,
        position.z + (Math.random() - 0.5) * 1.25,
      );
      quaternion.setFromEuler(new THREE.Euler(
        Math.random() * 0.25,
        Math.random() * Math.PI,
        Math.random() * 0.25,
      ));
      const base = 0.12 + Math.random() * 0.28;
      scale.set(
        base * (0.7 + Math.random()),
        base * (0.35 + Math.random() * 0.75),
        base * (0.7 + Math.random()),
      );
      matrix.compose(translation, quaternion, scale);
      mesh.setMatrixAt(current, matrix);
      current += 1;
    }
    mesh.count = current;
    mesh.instanceMatrix.needsUpdate = true;
    this.rubbleCounts.set(material, current);
  }

  private spawnShockwave(
    position: THREE.Vector3,
    color: number,
    size: number,
    lifetime: number,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.48, 48),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y = Math.max(0.08, position.y + 0.08);
    mesh.scale.setScalar(0.25);
    this.scene.add(mesh);
    this.effects.push({
      mesh,
      age: 0,
      lifetime,
      grow: size,
    });
  }

  private updateEffects(dt: number) {
    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index];
      if (!effect) continue;
      effect.age += dt;
      const ratio = Math.min(1, effect.age / effect.lifetime);
      const eased = 1 - Math.pow(1 - ratio, 3);
      effect.mesh.scale.setScalar(0.25 + effect.grow * eased);
      (effect.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - ratio) * 0.82;
      effect.mesh.rotation.z += dt * 0.7;
      if (ratio >= 1) {
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        (effect.mesh.material as THREE.Material).dispose();
        this.effects.splice(index, 1);
      }
    }
  }

  private beginClear() {
    this.clearing = true;
    this.clearTimer = 3.25;
    this.comboTimer = 999;
    this.notice = "麻布十番・完全更地達成！街ごと風通しがよくなりました！快適です！";
    this.noticeTone = "level";
    this.noticeUntil = this.elapsed + 10;
    this.audio.clear();
    this.spawnShockwave(this.playerAnchor.position, 0xffc642, 12, 1.5);
    this.spawnShockwave(this.playerAnchor.position, 0x50e1c2, 8.5, 1.2);
    this.spawnShockwave(this.playerAnchor.position, 0xffffff, 5, 0.9);
    this.shake = 1.3;
    this.requestSave();
  }

  private finishClear() {
    if (!this.clearing) return;
    this.clearing = false;
    this.phase = "cleared";
    const result: DemolitionResult = {
      score: this.score,
      destroyed: this.destroyed,
      total: this.breakables.length,
      maxCombo: this.maxCombo,
      playSeconds: this.playSeconds,
    };
    this.requestSave();
    this.callbacks.onClear(result);
    this.emitHud(true);
  }

  private applySave(value: unknown) {
    const save = normalizeDemolitionSave(value);
    this.xp = save.xp;
    this.score = save.score;
    this.maxCombo = save.maxCombo;
    this.playSeconds = save.playSeconds;
    this.destroyed = 0;
    this.cityDestroyed = 0;
    this.districtUnlocked = false;
    this.destroyedIds.clear();
    this.completedGoals.clear();
    for (const goal of save.completedGoals) this.completedGoals.add(goal);
    for (const id of save.destroyedIds) {
      const item = this.breakableById.get(id);
      if (!item || !item.alive) continue;
      item.alive = false;
      item.hp = 0;
      item.group.visible = false;
      this.destroyedIds.add(id);
      this.destroyed += 1;
      if (item.district === "city") this.cityDestroyed += 1;
      if (
        item.district === "office"
        && item.material === "plaster"
        && isOfficeExteriorWall(item.id)
      ) {
        this.districtUnlocked = true;
      }
      this.addRubble(item.group.position, item.material, 2 + Math.min(4, item.tier));
    }
    if (this.cityDestroyed > 0) this.districtUnlocked = true;
    this.giantScaleTarget = getGiantScale(
      this.cityDestroyed,
      this.cityBreakableTotal,
    );
    this.giantScale = this.giantScaleTarget;
    this.giantStage = getGiantStage(this.giantScaleTarget);
    this.playerAnchor.scale.setScalar(this.giantScale);
    this.initialSave = {
      ...save,
      cleared: save.cleared && this.destroyed === this.breakables.length,
      destroyed: this.destroyed,
      destroyedIds: [...this.destroyedIds],
      completedGoals: [...this.completedGoals],
    };
  }

  private makeSave(): DemolitionSave {
    return {
      version: 1,
      xp: Math.round(this.xp),
      score: Math.round(this.score),
      destroyed: this.destroyed,
      maxCombo: this.maxCombo,
      playSeconds: Number(this.playSeconds.toFixed(2)),
      cleared: this.phase === "cleared"
        || (this.destroyed === this.breakables.length && this.breakables.length > 0),
      destroyedIds: [...this.destroyedIds].sort(),
      completedGoals: [...this.completedGoals],
      updatedAt: new Date().toISOString(),
    };
  }

  private requestSave() {
    this.lastSave = 0;
    this.saveStatus = "saving";
    this.callbacks.onSave(this.makeSave());
    this.emitHud(true);
  }

  private emitHud(force = false) {
    if (!force && this.elapsed - this.lastHud < 0.08) return;
    this.lastHud = this.elapsed;
    const progress = getLevelProgress(this.xp);
    const zone = this.getZone(this.playerAnchor.position.x, this.playerAnchor.position.z);
    if (zone !== this.lastZone) {
      this.lastZone = zone;
      if (this.phase === "playing" && this.elapsed > 1) {
        this.notice = `${zone}へ到着。壊せる物から、ついでに整理します！`;
        this.noticeTone = "normal";
        this.noticeUntil = this.elapsed + 2;
      }
    }
    const notice = this.elapsed <= this.noticeUntil ? this.notice : "";
    const activeGoal = getActiveGoal(progress.current.level, this.completedGoals);
    const goalProgress = activeGoal ? this.getGoalProgress(activeGoal.id) : 0;
    this.callbacks.onHud({
      phase: this.phase,
      level: progress.current.level,
      xp: Math.round(this.xp),
      xpFloor: progress.floor,
      xpCeiling: progress.ceiling,
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      chain: this.chain,
      destroyed: this.destroyed,
      total: this.breakables.length,
      remaining: Math.max(0, this.breakables.length - this.destroyed),
      zone,
      material: this.target?.material ?? null,
      targetName: this.target?.name ?? "",
      targetTier: this.target?.tier ?? null,
      beer: this.beer,
      carriedName: this.carried?.name ?? null,
      goalTitle: activeGoal?.title ?? "全業務目標達成",
      goalProgress,
      goalTarget: activeGoal?.target ?? 1,
      goalComplete: activeGoal ? this.completedGoals.has(activeGoal.id) : true,
      districtUnlocked: this.districtUnlocked,
      cityDestroyed: this.cityDestroyed,
      cityTotal: this.cityBreakableTotal,
      giantScale: this.giantScale,
      radarActive: this.radarActive,
      radarArrow: this.radarArrow,
      radarDistance: this.radarDistance,
      ultimateActive: this.ultimateTimer > 0,
      notice,
      noticeTone: this.noticeTone,
      saveStatus: this.saveStatus,
      soundEnabled: this.soundEnabled,
      shakeEnabled: this.shakeEnabled,
    });
  }

  private updateGiantScale(dt: number) {
    const response = 1 - Math.exp(-dt * 3.2);
    this.giantScale = THREE.MathUtils.lerp(
      this.giantScale,
      this.giantScaleTarget,
      response,
    );
    if (Math.abs(this.giantScale - this.giantScaleTarget) < 0.001) {
      this.giantScale = this.giantScaleTarget;
    }
    this.playerAnchor.scale.setScalar(this.giantScale);
  }

  private isItemAccessible(item: Breakable) {
    return item.district === "office" || this.districtUnlocked;
  }

  private getZone(x: number, z: number) {
    if (Math.abs(x) > OFFICE_HALF_X || Math.abs(z) > OFFICE_HALF_Z) {
      if (z < -24) return "麻布十番・北街区";
      if (z > 24) return "麻布十番商店街";
      if (x < 0) return "麻布十番・西街区";
      return "麻布十番・東街区";
    }
    if (z > 2.4) return "中央執務フロア";
    if (x < -7.8 && z > -10.5) return "会議室スイート";
    if (x > 7.8 && z > -10.5) return "書庫・複合機エリア";
    if (x > 7.8) return "サーバー設備区画";
    if (x < -7.8) return "窓際ラウンジ";
    return "建物コア";
  }

  private forward() {
    const forward = getPlayerForward(this.playerAnchor.rotation.y);
    return new THREE.Vector3(
      forward.x,
      0,
      forward.z,
    ).normalize();
  }

  private lerpAngle(from: number, to: number, amount: number) {
    let delta = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return from + delta * amount;
  }
}
