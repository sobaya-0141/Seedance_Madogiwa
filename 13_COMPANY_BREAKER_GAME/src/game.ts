import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GameAudio } from "./audio.js";
import { playCutscene } from "./cutscene.js";
import { BuildingPhysics } from "./physics.js";
import {
  STAGES,
  loadProgress,
  saveProgress,
  stageById,
} from "./rules.js";
import type {
  AmmoKind,
  ImpactReport,
  Phase,
  PhysicsStats,
  ResultData,
  SavedProgress,
  StageDefinition,
  StageId,
} from "./types.js";

const GRAVITY = 12.8;
const THROW_ORIGIN = new THREE.Vector3(-5.45, 2.55, 5.25);
const CAMERA_TARGET = new THREE.Vector3(0, 3, 0);
const CAMERA_ANGLES = [
  new THREE.Vector3(12.8, 7.2, 16.5),
  new THREE.Vector3(-11.8, 6.6, 15.2),
  new THREE.Vector3(0, 10.2, 19.5),
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export class CompanyBreakerGame {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.08, 130);
  private readonly controls: OrbitControls;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly cameraLook = CAMERA_TARGET.clone();
  private readonly cameraDesired = CAMERA_ANGLES[0].clone();
  private readonly audio = new GameAudio();
  private readonly characterRoot = new THREE.Group();
  private readonly characterFallback = new THREE.Group();
  private readonly worldDecor = new THREE.Group();
  private readonly reticle = new THREE.Group();
  private readonly trajectory = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({
      color: 0xffdc78,
      transparent: true,
      opacity: 0.9,
      dashSize: 0.18,
      gapSize: 0.12,
    }),
  );

  private readonly loadingOverlay: HTMLElement;
  private readonly loadingText: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly titleOverlay: HTMLElement;
  private readonly stageOverlay: HTMLElement;
  private readonly resultOverlay: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly liveRegion: HTMLElement;
  private readonly integrityFill: HTMLElement;
  private readonly integrityText: HTMLElement;
  private readonly turnsText: HTMLElement;
  private readonly scoreText: HTMLElement;
  private readonly movingText: HTMLElement;
  private readonly powerFill: HTMLElement;
  private readonly powerText: HTMLElement;
  private readonly instruction: HTMLElement;
  private readonly stageName: HTMLElement;
  private readonly ammoStandard: HTMLButtonElement;
  private readonly ammoKanpai: HTMLButtonElement;
  private readonly reaimButton: HTMLButtonElement;
  private readonly cameraButton: HTMLButtonElement;
  private readonly soundButton: HTMLButtonElement;

  private physics!: BuildingPhysics;
  private phase: Phase = "loading";
  private progress: SavedProgress = loadProgress();
  private currentStage: StageDefinition = STAGES[0];
  private ammo: AmmoKind = "standard";
  private kanpaiUsed = false;
  private aimLocked = false;
  private aimTarget = new THREE.Vector3(0, 2.4, 0.6);
  private hoverTarget = this.aimTarget.clone();
  private power = 0.55;
  private powerClock = 0;
  private turnsUsed = 0;
  private comboBonus = 0;
  private score = 0;
  private settlingElapsed = 0;
  private stableElapsed = 0;
  private statsBeforeShot: PhysicsStats | null = null;
  private lastStats: PhysicsStats = {
    integrity: 1,
    fractured: 0,
    collapsed: 0,
    total: 0,
    moving: 0,
  };
  private cameraMode = 0;
  private cameraShake = 0;
  private impactFocus = new THREE.Vector3();
  private throwAnimation = 0;
  private modelMixer: THREE.AnimationMixer | null = null;
  private throwingArm: THREE.Object3D | null = null;
  private throwingArmBase = 0;
  private resizeObserver: ResizeObserver;
  private downPoint = new THREE.Vector2();
  private pointerDragged = false;
  private toastTimer = 0;
  private destroyed = false;
  private accentLight = new THREE.PointLight(0xf5bd55, 3.2, 18);

  private constructor(private readonly root: HTMLElement) {
    this.root.innerHTML = this.interfaceMarkup();
    this.canvas = this.require<HTMLCanvasElement>(".game-canvas");
    this.loadingOverlay = this.require("[data-loading-overlay]");
    this.loadingText = this.require("[data-loading-text]");
    this.hud = this.require("[data-hud]");
    this.titleOverlay = this.require("[data-title-overlay]");
    this.stageOverlay = this.require("[data-stage-overlay]");
    this.resultOverlay = this.require("[data-result-overlay]");
    this.toast = this.require("[data-toast]");
    this.liveRegion = this.require("[data-live-region]");
    this.integrityFill = this.require("[data-integrity-fill]");
    this.integrityText = this.require("[data-integrity-text]");
    this.turnsText = this.require("[data-turns]");
    this.scoreText = this.require("[data-score]");
    this.movingText = this.require("[data-moving]");
    this.powerFill = this.require("[data-power-fill]");
    this.powerText = this.require("[data-power]");
    this.instruction = this.require("[data-instruction]");
    this.stageName = this.require("[data-stage-name]");
    this.ammoStandard = this.require('[data-ammo="standard"]');
    this.ammoKanpai = this.require('[data-ammo="kanpai"]');
    this.reaimButton = this.require("[data-reaim]");
    this.cameraButton = this.require("[data-camera]");
    this.soundButton = this.require("[data-sound]");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera.position.copy(CAMERA_ANGLES[0]);
    this.camera.lookAt(CAMERA_TARGET);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.copy(CAMERA_TARGET);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 28;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.42;

    this.scene.add(this.worldDecor, this.characterRoot, this.reticle, this.trajectory);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.resize();
    this.createReticle();
    this.createLighting();
    this.createWorldDecor();
    this.createCharacterFallback();
    this.bindEvents();
  }

  static async create(root: HTMLElement): Promise<CompanyBreakerGame> {
    const game = new CompanyBreakerGame(root);
    await game.initialize();
    return game;
  }

  private async initialize(): Promise<void> {
    this.loadingText.textContent = "剛体演算エンジンを起動中…";
    this.physics = await BuildingPhysics.create({
      scene: this.scene,
      onImpact: (report) => this.onImpact(report),
    });
    this.loadingText.textContent = "正典そば屋モデルを搬入中…";
    await this.loadSobaya();
    this.physics.spawnStage(this.currentStage);
    this.applyStageLook(this.currentStage);
    this.loadingOverlay.hidden = true;
    this.showTitle();
    this.clock.start();
    this.animate();
  }

  private interfaceMarkup(): string {
    return `
      <main class="game-shell">
        <section class="game-viewport" aria-label="そば屋の会社ブレイカー 3D">
          <canvas class="game-canvas" aria-label="3D物理演算で無人のモックオフィスを破壊するゲーム"></canvas>
          <div class="vignette" aria-hidden="true"></div>

          <section class="loading-overlay" data-loading-overlay>
            <div class="loading-core">
              <span class="loading-spinner"></span>
              <p>REAL RIGID BODY PHYSICS</p>
              <strong data-loading-text>3D解体演習場を準備中…</strong>
            </div>
          </section>

          <section class="title-overlay" data-title-overlay hidden>
            <div class="title-copy">
              <p class="overline">MADOGIWA DEMOLITION DIVISION</p>
              <span class="physics-badge">3D PHYSICS REBUILT</span>
              <h1><small>そば屋の</small>会社<br />ブレイカー</h1>
              <p class="title-en">RIGID-BODY MUG DEMOLITION</p>
              <div class="title-description">
                <strong>一個一個の壁・梁・ガラスが、重さを持つ。</strong>
                <span>支持を抜き、自重と衝突で会社を連鎖崩壊させろ。</span>
              </div>
              <button class="primary-button" type="button" data-action="start">
                <span>解体演習を始める</span><b>START</b>
              </button>
              <div class="feature-row">
                <span>RIGID BODIES</span><span>FRACTURE</span><span>GRAVITY</span><span>DEBRIS</span>
              </div>
            </div>
            <aside class="safety-card">
              <span>会社公認</span>
              <strong>EMPTY MOCK OFFICE</strong>
              <p>人のいないDIY解体棟です。もちろん全員無傷！</p>
            </aside>
          </section>

          <section class="stage-overlay" data-stage-overlay hidden></section>
          <section class="result-overlay" data-result-overlay hidden></section>

          <section class="hud" data-hud hidden>
            <div class="hud-top">
              <div class="target-card">
                <span>TARGET</span>
                <strong data-stage-name>MEETING MOCKUP</strong>
                <small>EMPTY DEMOLITION SET</small>
              </div>
              <div class="integrity-card">
                <div><span>STRUCTURAL INTEGRITY</span><strong data-integrity-text>100%</strong></div>
                <div class="integrity-track">
                  <i class="clear-zone"></i>
                  <b data-integrity-fill></b>
                </div>
              </div>
              <div class="hud-actions">
                <button type="button" data-camera aria-label="視点を切り替える">視点</button>
                <button type="button" data-sound aria-label="効果音を切り替える">♪</button>
              </div>
            </div>

            <div class="telemetry">
              <div><span>THROWS</span><strong data-turns>10</strong></div>
              <div><span>SCORE</span><strong data-score>0</strong></div>
              <div><span>MOVING</span><strong data-moving>0</strong></div>
            </div>

            <div class="instruction-pill">
              <i></i><strong data-instruction>壊したい部材をタップ</strong>
            </div>

            <div class="control-panel">
              <div class="ammo-selector">
                <button class="ammo-button is-selected" type="button" data-action="ammo" data-ammo="standard">
                  <span class="mug-glyph">▱</span>
                  <span><small>STANDARD / ∞</small><b>重量ジョッキ</b></span>
                </button>
                <button class="ammo-button super-ammo" type="button" data-action="ammo" data-ammo="kanpai">
                  <span class="mug-glyph">✦</span>
                  <span><small>ULTIMATE / 1</small><b>超乾杯ジョッキ</b></span>
                </button>
              </div>
              <div class="power-control">
                <div><span>THROW POWER</span><strong data-power>55</strong></div>
                <div class="power-track"><i></i><b data-power-fill></b></div>
              </div>
              <button class="reaim-button" type="button" data-action="reaim" data-reaim disabled>狙い直す</button>
            </div>
          </section>

          <div class="game-toast" data-toast></div>
          <p class="sr-only" data-live-region aria-live="assertive"></p>
        </section>
      </main>
    `;
  }

  private require<T extends Element = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing element: ${selector}`);
    return element;
  }

  private createLighting(): void {
    const hemisphere = new THREE.HemisphereLight(0xb9e4ff, 0x241811, 2.1);
    this.scene.add(hemisphere);

    const key = new THREE.DirectionalLight(0xffe0aa, 4.2);
    key.position.set(9, 16, 11);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -13;
    key.shadow.camera.right = 13;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 45;
    key.shadow.bias = -0.0007;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x5fbfff, 2.2);
    rim.position.set(-12, 8, -8);
    this.scene.add(rim);

    this.accentLight.position.set(0, 5.2, 4);
    this.scene.add(this.accentLight);
  }

  private createWorldDecor(): void {
    const cityMaterial = new THREE.MeshStandardMaterial({
      color: 0x18232d,
      roughness: 0.92,
      metalness: 0.12,
    });
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x75b6cb,
      emissive: 0x173b4a,
      emissiveIntensity: 0.65,
      roughness: 0.38,
    });
    const buildingData = [
      [-13, 2.3, -10, 4.2, 4.6, 3.2],
      [-8.8, 3.4, -12.5, 3.2, 6.8, 3.2],
      [-4.7, 2.5, -14, 3.5, 5, 3.5],
      [4.2, 3.1, -14, 4.4, 6.2, 3.8],
      [9, 4.1, -13, 3.6, 8.2, 3.4],
      [13.4, 2.6, -10, 4.6, 5.2, 3.2],
    ];
    for (const [x, y, z, width, height, depth] of buildingData) {
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        cityMaterial,
      );
      building.position.set(x, y, z);
      building.receiveShadow = true;
      this.worldDecor.add(building);
      const windows = Math.max(2, Math.floor(height / 1.15));
      for (let row = 0; row < windows; row += 1) {
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.72, 0.16, 0.04),
          windowMaterial,
        );
        strip.position.set(x, 0.8 + row * 1.05, z + depth / 2 + 0.025);
        this.worldDecor.add(strip);
      }
    }

    const tower = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({
      color: 0xd84b3c,
      emissive: 0x4a0903,
      emissiveIntensity: 0.32,
      roughness: 0.58,
      metalness: 0.28,
    });
    const white = new THREE.MeshStandardMaterial({ color: 0xf0e9da, roughness: 0.68 });
    const legs = [
      new THREE.Vector3(-0.48, 0, -0.35),
      new THREE.Vector3(0.48, 0, -0.35),
      new THREE.Vector3(-0.48, 0, 0.35),
      new THREE.Vector3(0.48, 0, 0.35),
    ];
    for (const leg of legs) {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.17, 5.6, 6), red);
      beam.position.set(leg.x, 2.8, leg.z);
      beam.rotation.z = leg.x * -0.09;
      tower.add(beam);
    }
    const observation = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.26, 12), white);
    observation.position.y = 3.9;
    tower.add(observation);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.12, 2.8, 8), red);
    spire.position.y = 6.25;
    tower.add(spire);
    tower.position.set(-11, 0, -8.5);
    this.worldDecor.add(tower);

    const grid = new THREE.GridHelper(38, 38, 0x6f8c89, 0x374443);
    grid.position.y = 0.012;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.22;
    this.worldDecor.add(grid);

    const safetyLine = new THREE.Mesh(
      new THREE.RingGeometry(8.6, 8.85, 64),
      new THREE.MeshBasicMaterial({
        color: 0xf0c65f,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
      }),
    );
    safetyLine.rotation.x = -Math.PI / 2;
    safetyLine.position.y = 0.018;
    this.worldDecor.add(safetyLine);
  }

  private createReticle(): void {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.035, 8, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffdf78,
        transparent: true,
        opacity: 0.92,
        depthTest: false,
      }),
    );
    const crossMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdf78,
      transparent: true,
      opacity: 0.92,
      depthTest: false,
    });
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.025, 0.025), crossMaterial);
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.92, 0.025), crossMaterial);
    const glow = new THREE.PointLight(0xffd45c, 2.2, 3);
    this.reticle.add(ring, horizontal, vertical, glow);
    this.reticle.visible = false;
    this.reticle.renderOrder = 20;
    this.trajectory.visible = false;
  }

  private createCharacterFallback(): void {
    // そば屋のNG変更要素: 白い仮面（黒い丸目・赤い縦模様）と大型ビールジョッキを必ず維持する。
    const white = new THREE.MeshStandardMaterial({ color: 0xfffdf2, roughness: 0.75 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc08d6f, roughness: 0.76 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x14191e, roughness: 0.7 });
    const red = new THREE.MeshStandardMaterial({ color: 0xd64438, roughness: 0.62 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.65, 0.9), white);
    body.position.y = 1.65;
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.98, 0.86), skin);
    head.position.y = 2.98;
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.82, 0.08), white);
    mask.position.set(0, 2.98, 0.48);
    const eyeA = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), dark);
    eyeA.rotation.x = Math.PI / 2;
    eyeA.position.set(-0.22, 3.05, 0.56);
    const eyeB = eyeA.clone();
    eyeB.position.x = 0.22;
    const stripeA = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.7, 0.04), red);
    stripeA.position.set(-0.36, 2.98, 0.55);
    const stripeB = stripeA.clone();
    stripeB.position.x = 0.36;
    const legA = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.5, 0.56), dark);
    legA.position.set(-0.43, 0.75, 0);
    const legB = legA.clone();
    legB.position.x = 0.43;
    this.characterFallback.add(body, head, mask, eyeA, eyeB, stripeA, stripeB, legA, legB);
    this.characterFallback.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = true;
    });
    this.characterRoot.add(this.characterFallback);
    this.characterRoot.position.set(-6.6, 0, 5.9);
    this.characterRoot.rotation.y = -0.72;
  }

  private loadSobaya(): Promise<void> {
    return new Promise((resolve) => {
      new GLTFLoader().load(
        "models/sobaya.glb",
        (gltf) => {
          const model = gltf.scene;
          model.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(model);
          const height = Math.max(0.1, bounds.max.y - bounds.min.y);
          const scale = 3.65 / height;
          model.scale.setScalar(scale);
          model.updateMatrixWorld(true);
          const scaledBounds = new THREE.Box3().setFromObject(model);
          model.position.y = -scaledBounds.min.y;
          model.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            object.castShadow = true;
            object.receiveShadow = true;
          });
          this.characterRoot.add(model);
          this.characterFallback.visible = false;
          this.throwingArm = model.getObjectByName("VoxelRig_ArmPrimary") ?? null;
          this.throwingArmBase = this.throwingArm?.rotation.x ?? 0;
          if (gltf.animations.length > 0) {
            this.modelMixer = new THREE.AnimationMixer(model);
            this.modelMixer.clipAction(gltf.animations[0]).play();
          }
          resolve();
        },
        undefined,
        () => {
          this.loadingText.textContent = "正典モデルの予備表示で続行します";
          resolve();
        },
      );
    });
  }

  private bindEvents(): void {
    this.root.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action]");
      if (!button) return;
      event.stopPropagation();
      this.audio.ensure();
      this.audio.click();
      const action = button.dataset.action;
      if (action === "start") void this.openStageSelect(true);
      if (action === "title") this.showTitle();
      if (action === "stage-select") void this.openStageSelect(false);
      if (action === "play-stage") {
        const stageId = Number(button.dataset.stage) as StageId;
        if (stageId <= this.progress.unlockedStage) void this.startStage(stageId);
      }
      if (action === "retry") void this.startStage(this.currentStage.id);
      if (action === "next-stage") {
        void this.startStage(Math.min(4, this.currentStage.id + 1) as StageId);
      }
      if (action === "ammo") this.selectAmmo(button.dataset.ammo as AmmoKind);
      if (action === "reaim") this.cancelAim();
    });

    this.cameraButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.cycleCamera();
    });
    this.soundButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const enabled = this.audio.toggle();
      this.soundButton.textContent = enabled ? "♪" : "×";
      this.announce(enabled ? "効果音オン" : "効果音オフ");
    });

    this.canvas.addEventListener("pointerdown", (event) => {
      this.downPoint.set(event.clientX, event.clientY);
      this.pointerDragged = false;
    });
    this.canvas.addEventListener("pointermove", (event) => {
      const distance = this.downPoint.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
      if (distance > 8) this.pointerDragged = true;
      if (
        this.phase !== "playing"
        || this.aimLocked
        || this.physics.hasProjectile()
      ) {
        return;
      }
      const target = this.pickTarget(event);
      if (target) this.hoverTarget.copy(target);
    });
    this.canvas.addEventListener("pointerup", (event) => {
      if (this.pointerDragged || this.phase !== "playing" || this.physics.hasProjectile()) return;
      const target = this.pickTarget(event);
      if (!this.aimLocked) {
        if (target) this.aimTarget.copy(target);
        else this.aimTarget.copy(this.hoverTarget);
        this.lockAim();
      } else {
        this.fire();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (this.phase !== "playing") return;
      if (event.code === "Digit1") this.selectAmmo("standard");
      if (event.code === "Digit2") this.selectAmmo("kanpai");
      if (event.code === "KeyC") this.cycleCamera();
      if (event.code === "Escape") this.cancelAim();
      if (event.code === "Space") {
        event.preventDefault();
        if (this.physics.hasProjectile()) return;
        if (this.aimLocked) this.fire();
        else this.lockAim();
      }
      const step = event.shiftKey ? 0.55 : 0.22;
      if (event.code === "ArrowLeft") this.aimTarget.x -= step;
      if (event.code === "ArrowRight") this.aimTarget.x += step;
      if (event.code === "ArrowUp") this.aimTarget.y += step;
      if (event.code === "ArrowDown") this.aimTarget.y -= step;
      this.aimTarget.x = clamp(this.aimTarget.x, -7, 7);
      this.aimTarget.y = clamp(this.aimTarget.y, 0.1, 8);
    });
  }

  private pickTarget(event: PointerEvent): THREE.Vector3 | null {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = [...this.physics.getPickMeshes(), this.physics.groundMesh];
    const intersections = this.raycaster.intersectObjects(targets, false);
    const intersection = intersections.find((candidate) => (
      candidate.object === this.physics.groundMesh || this.physics.isTargetMesh(candidate.object)
    ));
    if (!intersection) return null;
    return new THREE.Vector3(
      clamp(intersection.point.x, -7.2, 7.2),
      clamp(intersection.point.y, 0.1, 8),
      clamp(intersection.point.z, -2.1, 2.1),
    );
  }

  private showTitle(): void {
    this.phase = "title";
    this.titleOverlay.hidden = false;
    this.stageOverlay.hidden = true;
    this.resultOverlay.hidden = true;
    this.hud.hidden = true;
    this.controls.enabled = true;
    this.controls.autoRotate = true;
    this.reticle.visible = false;
    this.trajectory.visible = false;
  }

  private async openStageSelect(playOpening: boolean): Promise<void> {
    if (playOpening) await playCutscene(this.root, { src: "videos/opening.mp4" });
    this.phase = "stage-select";
    this.titleOverlay.hidden = true;
    this.resultOverlay.hidden = true;
    this.hud.hidden = true;
    this.stageOverlay.hidden = false;
    this.controls.enabled = true;
    this.controls.autoRotate = true;
    this.stageOverlay.innerHTML = `
      <div class="stage-select-shell">
        <header>
          <p class="overline">SELECT 3D DEMOLITION SET</p>
          <h2>壊す会社を選ぶ</h2>
          <p>すべての部材に重量があります。難しい棟ほど鉄骨とコンクリートが増加。</p>
        </header>
        <div class="stage-grid">
          ${STAGES.map((stage) => {
            const locked = stage.id > this.progress.unlockedStage;
            const best = this.progress.bestScores[stage.id];
            return `
              <button
                class="stage-card ${locked ? "is-locked" : ""}"
                type="button"
                data-action="play-stage"
                data-stage="${stage.id}"
                ${locked ? "disabled" : ""}
                style="--accent:${stage.accentCss}"
              >
                <span class="stage-index">0${stage.id}</span>
                <i>${locked ? "LOCKED" : "READY"}</i>
                <strong>${stage.name}</strong>
                <small>${stage.englishName}</small>
                <p>${stage.description}</p>
                <b>${"◆".repeat(stage.difficulty)}${"◇".repeat(4 - stage.difficulty)}</b>
                <em>${best ? `BEST ${best.toLocaleString("ja-JP")}` : "BEST ---"}</em>
              </button>
            `;
          }).join("")}
        </div>
        <button class="text-button" type="button" data-action="title">← タイトルへ</button>
      </div>
    `;
  }

  private async startStage(id: StageId): Promise<void> {
    if (id === 4) await playCutscene(this.root, { src: "videos/event_regulation.mp4" });
    this.currentStage = stageById(id);
    this.physics.spawnStage(this.currentStage);
    this.applyStageLook(this.currentStage);
    this.ammo = "standard";
    this.kanpaiUsed = false;
    this.aimLocked = false;
    this.aimTarget.set(0, 2.5, 0.7);
    this.hoverTarget.copy(this.aimTarget);
    this.power = 0.55;
    this.powerClock = 0;
    this.turnsUsed = 0;
    this.comboBonus = 0;
    this.score = 0;
    this.settlingElapsed = 0;
    this.stableElapsed = 0;
    this.statsBeforeShot = null;
    this.lastStats = this.physics.getStats();
    this.phase = "playing";
    this.titleOverlay.hidden = true;
    this.stageOverlay.hidden = true;
    this.resultOverlay.hidden = true;
    this.hud.hidden = false;
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.cameraMode = 0;
    this.cameraDesired.copy(CAMERA_ANGLES[0]);
    this.cameraLook.copy(CAMERA_TARGET);
    this.reticle.visible = true;
    this.trajectory.visible = false;
    this.announce(this.currentStage.objective);
    this.updateHud();
  }

  private applyStageLook(stage: StageDefinition): void {
    const gradient = document.createElement("canvas");
    gradient.width = 16;
    gradient.height = 512;
    const context = gradient.getContext("2d");
    if (context) {
      const fill = context.createLinearGradient(0, 0, 0, 512);
      fill.addColorStop(0, hexColor(stage.skyTop));
      fill.addColorStop(0.66, hexColor(stage.skyBottom));
      fill.addColorStop(1, "#11191d");
      context.fillStyle = fill;
      context.fillRect(0, 0, 16, 512);
      const texture = new THREE.CanvasTexture(gradient);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.scene.background = texture;
    }
    this.scene.fog = new THREE.Fog(stage.skyTop, 28, 74);
    this.accentLight.color.setHex(stage.accent);
    const trajectoryMaterial = this.trajectory.material as THREE.LineDashedMaterial;
    trajectoryMaterial.color.setHex(stage.accent);
  }

  private selectAmmo(ammo: AmmoKind): void {
    if (this.phase !== "playing" || this.physics.hasProjectile()) return;
    if (ammo === "kanpai" && this.kanpaiUsed) {
      this.announce("超乾杯ジョッキは各棟1回です！");
      return;
    }
    this.ammo = ammo;
    this.announce(ammo === "kanpai" ? "超乾杯ジョッキ装填。鉄骨の支点を狙え！" : "重量ジョッキへ切り替え！");
    this.updateHud();
  }

  private lockAim(): void {
    if (this.phase !== "playing" || this.physics.hasProjectile()) return;
    this.aimLocked = true;
    this.audio.lock();
    this.announce("照準固定。ゲージを見てもう一度タップ！");
    this.updateHud();
  }

  private cancelAim(): void {
    if (this.phase !== "playing" || this.physics.hasProjectile()) return;
    this.aimLocked = false;
    this.announce("狙い直し。壊したい部材をタップ！");
    this.updateHud();
  }

  private fire(): void {
    if (
      this.phase !== "playing"
      || !this.aimLocked
      || this.physics.hasProjectile()
    ) {
      return;
    }
    if (this.ammo === "kanpai" && this.kanpaiUsed) this.ammo = "standard";
    const special = this.ammo === "kanpai";
    this.turnsUsed += 1;
    if (special) this.kanpaiUsed = true;
    this.statsBeforeShot = this.physics.getStats();
    this.physics.launchMug({
      origin: THROW_ORIGIN,
      target: this.aimTarget,
      power: this.power,
      ammo: this.ammo,
    });
    this.throwAnimation = 0.68;
    this.aimLocked = false;
    this.trajectory.visible = false;
    this.audio.throwMug(this.power, special);
    this.instruction.textContent = special ? "超乾杯ジョッキ飛翔中" : "重量ジョッキ飛翔中";
    this.updateHud();
  }

  private onImpact(report: ImpactReport): void {
    this.phase = "settling";
    this.settlingElapsed = 0;
    this.stableElapsed = 0;
    this.impactFocus.set(...report.position);
    this.cameraShake = report.special ? 0.52 : 0.25;
    this.audio.impact(report.fractured, report.special);
    if (report.fractured >= 4) {
      this.comboBonus += report.fractured * report.fractured * (report.special ? 80 : 42);
      this.announce(`${report.fractured}部材破砕！ 剛体連鎖中…`);
    } else if (report.fractured > 0) {
      this.announce(`${report.fractured}部材破砕。上層の自重を待て！`);
    } else {
      this.announce("衝撃伝播中。支持が崩れるか判定！");
    }
  }

  private evaluateTurn(): void {
    this.lastStats = this.physics.getStats();
    const prior = this.statsBeforeShot;
    const collapsedThisShot = prior
      ? Math.max(
          0,
          this.lastStats.fractured
          + this.lastStats.collapsed
          - prior.fractured
          - prior.collapsed,
        )
      : 0;
    if (collapsedThisShot >= 5) {
      const bonus = collapsedThisShot * collapsedThisShot * 34;
      this.comboBonus += bonus;
      this.announce(`${collapsedThisShot}連鎖崩壊！ +${bonus.toLocaleString("ja-JP")}`);
    }
    this.score = this.physics.scoreValue() + this.comboBonus;

    if (this.lastStats.integrity <= this.currentStage.clearRatio) {
      this.finishStage(true);
      return;
    }
    if (this.turnsUsed >= this.currentStage.turns) {
      this.finishStage(false);
      return;
    }
    this.phase = "playing";
    if (this.kanpaiUsed && this.ammo === "kanpai") this.ammo = "standard";
    this.announce(`残り${this.currentStage.turns - this.turnsUsed}投。動いた部材は${collapsedThisShot}個！`);
    this.updateHud();
  }

  private finishStage(cleared: boolean): void {
    this.lastStats = this.physics.getStats();
    this.score = this.physics.scoreValue() + this.comboBonus;
    const previousBest = this.progress.bestScores[this.currentStage.id] ?? 0;
    const newBest = this.score > previousBest;
    if (newBest) this.progress.bestScores[this.currentStage.id] = this.score;
    if (cleared && this.currentStage.id < 4) {
      this.progress.unlockedStage = Math.max(
        this.progress.unlockedStage,
        (this.currentStage.id + 1) as StageId,
      ) as StageId;
    }
    saveProgress(this.progress);
    this.phase = "result";
    this.hud.hidden = true;
    this.resultOverlay.hidden = false;
    this.controls.enabled = true;
    this.controls.autoRotate = true;
    this.audio.result(cleared);
    this.renderResult({
      cleared,
      score: this.score,
      fractured: this.lastStats.fractured,
      collapsed: this.lastStats.collapsed,
      total: this.lastStats.total,
      integrity: this.lastStats.integrity,
      throwsUsed: this.turnsUsed,
      newBest,
    });
  }

  private renderResult(result: ResultData): void {
    const final = result.cleared && this.currentStage.id === 4;
    this.resultOverlay.innerHTML = `
      <div class="result-card ${result.cleared ? "is-clear" : "is-fail"}">
        <p>${result.cleared ? "STRUCTURAL COLLAPSE COMPLETE" : "STRUCTURE REMAINS"}</p>
        <span class="result-seal">${result.cleared ? "快適！" : "再施工"}</span>
        <h2>${result.cleared ? "物理解体、完了です！" : "まだ立っています！"}</h2>
        <p class="result-copy">${
          final
            ? "全4棟の剛体解体を達成。跡地へ立ち飲み処を建設します！"
            : result.cleared
              ? "重力・衝突・連鎖崩壊で、無人モックオフィスを更地にしました！"
              : "支持柱へ高POWERを当て、超乾杯ジョッキで荷重を崩そう。"
        }</p>
        <div class="result-score"><span>SCORE</span><strong>${result.score.toLocaleString("ja-JP")}</strong>${result.newBest ? "<b>NEW BEST</b>" : ""}</div>
        <dl>
          <div><dt>破砕</dt><dd>${result.fractured}</dd></div>
          <div><dt>倒壊</dt><dd>${result.collapsed}</dd></div>
          <div><dt>残存耐久</dt><dd>${Math.round(result.integrity * 100)}%</dd></div>
          <div><dt>投擲</dt><dd>${result.throwsUsed} / ${this.currentStage.turns}</dd></div>
        </dl>
        <div class="result-actions">
          <button class="secondary-button" type="button" data-action="retry">同じ棟を壊す</button>
          ${
            result.cleared && this.currentStage.id < 4
              ? '<button class="primary-button compact" type="button" data-action="next-stage">次の棟へ</button>'
              : '<button class="primary-button compact" type="button" data-action="stage-select">棟を選ぶ</button>'
          }
        </div>
      </div>
    `;
  }

  private cycleCamera(): void {
    this.cameraMode = (this.cameraMode + 1) % CAMERA_ANGLES.length;
    this.cameraDesired.copy(CAMERA_ANGLES[this.cameraMode]);
    this.announce(`カメラ ${this.cameraMode + 1} / ${CAMERA_ANGLES.length}`);
  }

  private update(delta: number): void {
    this.physics.step(delta);
    this.modelMixer?.update(delta);

    if (this.throwAnimation > 0) {
      this.throwAnimation -= delta;
      if (this.throwingArm) {
        const progress = 1 - clamp(this.throwAnimation / 0.68, 0, 1);
        this.throwingArm.rotation.x =
          this.throwingArmBase
          - Math.sin(progress * Math.PI) * 1.55;
      }
    } else if (this.throwingArm) {
      this.throwingArm.rotation.x = THREE.MathUtils.lerp(
        this.throwingArm.rotation.x,
        this.throwingArmBase,
        1 - Math.exp(-delta * 9),
      );
    }

    if (this.phase === "playing" && this.aimLocked && !this.physics.hasProjectile()) {
      this.powerClock += delta * 3.15;
      this.power = 0.53 + Math.sin(this.powerClock) * 0.46;
    }

    this.lastStats = this.physics.getStats();
    this.score = this.physics.scoreValue() + this.comboBonus;

    if (this.phase === "settling") {
      this.settlingElapsed += delta;
      if (this.lastStats.moving <= 2) this.stableElapsed += delta;
      else this.stableElapsed = 0;
      if (this.stableElapsed > 0.82 || this.settlingElapsed > 5.2) {
        this.evaluateTurn();
      }
    }

    this.updateAimVisuals();
    this.updateCamera(delta);
    if (this.phase === "playing" || this.phase === "settling") this.updateHud();
  }

  private updateAimVisuals(): void {
    const canAim =
      this.phase === "playing"
      && !this.physics.hasProjectile();
    if (!canAim) {
      this.reticle.visible = false;
      this.trajectory.visible = false;
      return;
    }
    const target = this.aimLocked ? this.aimTarget : this.hoverTarget;
    this.reticle.visible = true;
    this.reticle.position.copy(target);
    this.reticle.lookAt(this.camera.position);
    const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.08;
    this.reticle.scale.setScalar(this.aimLocked ? pulse * 1.12 : pulse * 0.82);

    const color = this.ammo === "kanpai" ? 0xffd43d : this.currentStage.accent;
    this.reticle.traverse((object) => {
      if (
        object instanceof THREE.Mesh
        && object.material instanceof THREE.MeshBasicMaterial
      ) {
        object.material.color.setHex(color);
      }
      if (object instanceof THREE.PointLight) object.color.setHex(color);
    });
    this.trajectory.visible = this.aimLocked;
    if (this.aimLocked) this.updateTrajectory(target, color);
  }

  private updateTrajectory(target: THREE.Vector3, color: number): void {
    const distance = THROW_ORIGIN.distanceTo(target);
    const duration = THREE.MathUtils.clamp(distance / (8.5 + this.power * 2.8), 0.8, 1.5);
    const velocity = target.clone().sub(THROW_ORIGIN);
    velocity.x /= duration;
    velocity.z /= duration;
    velocity.y = (target.y - THROW_ORIGIN.y + 0.5 * GRAVITY * duration * duration) / duration;
    const points: THREE.Vector3[] = [];
    for (let index = 0; index <= 34; index += 1) {
      const time = (index / 34) * duration;
      points.push(new THREE.Vector3(
        THROW_ORIGIN.x + velocity.x * time,
        THROW_ORIGIN.y + velocity.y * time - 0.5 * GRAVITY * time * time,
        THROW_ORIGIN.z + velocity.z * time,
      ));
    }
    this.trajectory.geometry.setFromPoints(points);
    this.trajectory.computeLineDistances();
    (this.trajectory.material as THREE.LineDashedMaterial).color.setHex(color);
  }

  private updateCamera(delta: number): void {
    const projectilePosition = this.physics.getProjectilePosition();
    if (projectilePosition && !this.physics.projectileHasImpacted()) {
      const travelDirection = projectilePosition.clone().sub(THROW_ORIGIN).normalize();
      const side = new THREE.Vector3(-travelDirection.z, 0, travelDirection.x);
      const desired = projectilePosition.clone()
        .add(side.multiplyScalar(4.4))
        .add(new THREE.Vector3(0, 2.3, 5.6));
      this.camera.position.lerp(desired, 1 - Math.exp(-delta * 4.5));
      this.cameraLook.lerp(projectilePosition, 1 - Math.exp(-delta * 7));
    } else if (this.phase === "settling") {
      const desired = this.impactFocus.clone().add(new THREE.Vector3(7.4, 4.2, 10.2));
      this.camera.position.lerp(desired, 1 - Math.exp(-delta * 3.6));
      this.cameraLook.lerp(this.impactFocus, 1 - Math.exp(-delta * 6.5));
    } else if (this.phase === "playing") {
      this.camera.position.lerp(this.cameraDesired, 1 - Math.exp(-delta * 3.2));
      this.cameraLook.lerp(CAMERA_TARGET, 1 - Math.exp(-delta * 4));
    } else {
      this.controls.update();
      return;
    }

    const shake = this.cameraShake;
    if (shake > 0.001) {
      this.camera.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake * 0.65,
        (Math.random() - 0.5) * shake,
      ));
      this.cameraShake *= 0.88;
    }
    this.camera.lookAt(this.cameraLook);
  }

  private updateHud(): void {
    const integrity = Math.round(this.lastStats.integrity * 100);
    this.integrityFill.style.width = `${integrity}%`;
    this.integrityFill.classList.toggle(
      "is-clear",
      this.lastStats.integrity <= this.currentStage.clearRatio,
    );
    this.integrityText.textContent = `${integrity}%`;
    this.turnsText.textContent = `${this.currentStage.turns - this.turnsUsed}`;
    this.scoreText.textContent = this.score.toLocaleString("ja-JP");
    this.movingText.textContent = `${this.lastStats.moving}`;
    this.powerFill.style.width = `${Math.round(this.power * 100)}%`;
    this.powerText.textContent = `${Math.round(this.power * 100)}`;
    this.stageName.textContent = this.currentStage.englishName;
    this.ammoStandard.classList.toggle("is-selected", this.ammo === "standard");
    this.ammoKanpai.classList.toggle("is-selected", this.ammo === "kanpai");
    this.ammoKanpai.disabled = this.kanpaiUsed;
    const superLabel = this.ammoKanpai.querySelector("small");
    if (superLabel) superLabel.textContent = this.kanpaiUsed ? "ULTIMATE / USED" : "ULTIMATE / 1";
    this.reaimButton.disabled = !this.aimLocked || this.physics.hasProjectile();

    if (this.physics.hasProjectile() && this.phase === "playing") {
      this.instruction.textContent = "ジョッキ飛翔中 — カメラ追跡";
    } else if (this.phase === "settling") {
      this.instruction.textContent = `剛体演算中 — ${this.lastStats.moving}部材が移動`;
    } else if (this.aimLocked) {
      this.instruction.textContent = "POWERを見て、もう一度タップで投擲";
    } else {
      this.instruction.textContent = "壊したい部材をタップ";
    }
  }

  private announce(message: string): void {
    this.liveRegion.textContent = message;
    this.toast.textContent = message;
    this.toast.classList.add("is-visible");
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove("is-visible");
    }, 1900);
  }

  private resize(): void {
    const bounds = this.canvas.getBoundingClientRect();
    const density = Math.min(2, window.devicePixelRatio || 1);
    this.renderer.setPixelRatio(density);
    this.renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
    this.camera.aspect = Math.max(1, bounds.width) / Math.max(1, bounds.height);
    this.camera.updateProjectionMatrix();
  }

  private readonly animate = (): void => {
    if (this.destroyed) return;
    const delta = Math.min(0.033, this.clock.getDelta());
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };

  destroy(): void {
    this.destroyed = true;
    this.resizeObserver.disconnect();
    this.physics.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
