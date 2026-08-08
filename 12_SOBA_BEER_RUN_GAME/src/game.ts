import * as THREE from "three";
import { RunnerAudio } from "./audio.js";
import { playCutscene } from "./cutscene.js";
import {
  BEERS_PER_SPEED_UP,
  COLLISION_DURATION,
  FINAL_RUSH_START,
  FINISH_DISTANCE,
  LANE_X,
  MAX_BEER_SPEED_MULTIPLIER,
  STAGE_DEFINITIONS,
  WANTED_ZONE_START,
  baseSpeedForStage,
  beerSpeedMultiplier,
  buildCourse,
  formatTime,
  hasFinished,
  isRouteGate,
  rankFor,
  rankLabel,
  runSpeed,
  stageDefinition,
} from "./rules.js";
import type {
  CourseCell,
  CourseRole,
  Lane,
  Phase,
  RunResult,
  StageId,
  SupportKind,
} from "./types.js";
import {
  loadVoxelCharacter,
  runnerDefinition,
  type LoadedVoxelCharacter,
} from "./voxel-character-kit.js";

interface TrackEntity {
  kind: Exclude<CourseCell, null>;
  object: THREE.Object3D;
  distance: number;
  lane: Lane;
  baseY: number;
  consumed: boolean;
  nearMissChecked: boolean;
  routeId?: number;
  role?: CourseRole;
  motionPhase: number;
}

interface SupportEvent {
  kind: SupportKind;
  distance: number;
  triggered: boolean;
}

interface Burst {
  mesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  age: number;
}

interface RecordBook {
  bestTime: number | null;
  bestServed: number;
  bestNoHitTime: number | null;
}

const RECORDS_KEY = "sobaya-beer-run.records.v3";
const LEGACY_RECORDS_KEY = "sobaya-beer-run.records.v2";
const LEGACY_BEST_SCORE_KEY = "sobaya-beer-run.best.v1";
const CAMERA_TARGET = new THREE.Vector3();
const TEMP_COLOR = new THREE.Color();

function isObstacleKind(kind: TrackEntity["kind"]): boolean {
  return kind === "crate" || kind === "barrel" || kind === "movingBarrel";
}

export class BeerRunnerGame {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(56, 1, 0.1, 650);
  private readonly audio = new RunnerAudio();
  private readonly world = new THREE.Group();
  private readonly courseGroup = new THREE.Group();
  private readonly player = new THREE.Group();
  private readonly playerPlaceholder = new THREE.Group();
  private readonly cameos: LoadedVoxelCharacter[] = [];
  private readonly bursts: Burst[] = [];
  private readonly beerTemplate = this.createBeerMug();
  private readonly goldBeerTemplate = this.createBeerMug(true);
  private readonly crateTemplate = this.createCrate();
  private readonly barrelTemplate = this.createBarrel();
  private readonly supportEvents: SupportEvent[] = [
    { kind: "tokun", distance: 66, triggered: false },
    { kind: "yotan", distance: 132, triggered: false },
    { kind: "fukuchan", distance: 198, triggered: false },
    { kind: "okayaman", distance: 242, triggered: false },
    { kind: "yumemin", distance: 276, triggered: false },
    { kind: "yametaro", distance: WANTED_ZONE_START - 4, triggered: false },
    { kind: "takosan", distance: 397, triggered: false },
  ];

  private playerCharacter?: LoadedVoxelCharacter;
  private entities: TrackEntity[] = [];
  private phase: Phase = "title";
  private stageId: StageId = 1;
  private elapsed = 0;
  private distance = 0;
  private targetLaneIndex = 1;
  private served = 0;
  private collectedBeers = 0;
  private chain = 0;
  private bestChain = 0;
  private perfectRoutes = 0;
  private routeStreak = 0;
  private bestRouteStreak = 0;
  private hits = 0;
  private nearMisses = 0;
  private supportCount = 0;
  private topSpeed = 0;
  private hitTime = 0;
  private supportBoostTime = 0;
  private nearMissBoostTime = 0;
  private magnetTime = 0;
  private shieldReady = false;
  private lastSpeedTier = 0;
  private finalRushAnnounced = false;
  private pointerStart?: { x: number; y: number };
  private lastFrameTime = performance.now();
  private baseCameraFov = 56;
  private broadcastTimer?: number;

  private readonly hud: HTMLElement;
  private readonly titleOverlay: HTMLElement;
  private readonly pauseOverlay: HTMLElement;
  private readonly resultOverlay: HTMLElement;
  private readonly timerText: HTMLElement;
  private readonly servedText: HTMLElement;
  private readonly routeText: HTMLElement;
  private readonly chainText: HTMLElement;
  private readonly speedText: HTMLElement;
  private readonly stageHudText: HTMLElement;
  private readonly progressBar: HTMLElement;
  private readonly announcer: HTMLElement;
  private readonly floatText: HTMLElement;
  private readonly okayamanBroadcast: HTMLElement;
  private readonly resultRank: HTMLElement;
  private readonly resultLabel: HTMLElement;
  private readonly resultTime: HTMLElement;
  private readonly resultServed: HTMLElement;
  private readonly resultStats: HTMLElement;
  private readonly resultBest: HTMLElement;
  private readonly resultStageText: HTMLElement;
  private readonly okayamanQuote: HTMLElement;
  private readonly loadingText: HTMLElement;
  private readonly startLabel: HTMLElement;
  private readonly retryLabel: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.innerHTML = this.createInterface();

    const canvas = this.root.querySelector<HTMLCanvasElement>("canvas");
    if (!canvas) throw new Error("ゲームCanvasが見つかりません");
    this.canvas = canvas;

    this.hud = this.required(".hud");
    this.titleOverlay = this.required(".title-screen");
    this.pauseOverlay = this.required(".pause-screen");
    this.resultOverlay = this.required(".result-screen");
    this.timerText = this.required("[data-timer]");
    this.servedText = this.required("[data-served]");
    this.routeText = this.required("[data-routes]");
    this.chainText = this.required("[data-chain]");
    this.speedText = this.required("[data-speed]");
    this.stageHudText = this.required("[data-stage-hud]");
    this.progressBar = this.required("[data-progress-bar]");
    this.announcer = this.required(".announcer");
    this.floatText = this.required(".pickup-float");
    this.okayamanBroadcast = this.required(".okayaman-broadcast");
    this.resultRank = this.required("[data-result-rank]");
    this.resultLabel = this.required("[data-result-label]");
    this.resultTime = this.required("[data-result-time]");
    this.resultServed = this.required("[data-result-served]");
    this.resultStats = this.required("[data-result-stats]");
    this.resultBest = this.required("[data-result-best]");
    this.resultStageText = this.required("[data-result-stage]");
    this.okayamanQuote = this.required("[data-okayaman-quote]");
    this.loadingText = this.required("[data-loading]");
    this.startLabel = this.required("[data-start-label]");
    this.retryLabel = this.required("[data-retry-label]");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x8ccde0);

    this.scene.background = new THREE.Color(0x8ccde0);
    this.scene.fog = new THREE.Fog(0x8ccde0, 32, 105);
    this.scene.add(this.world);
    this.world.add(this.courseGroup, this.player);

    this.createLighting();
    this.createCity();
    this.createPlayerPlaceholder();
    this.loadCharacters();
    this.bindEvents();
    this.selectStage(1);
    this.resize();
    this.updateHud();
    this.animate();
  }

  private required<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`${selector} が見つかりません`);
    return element;
  }

  private createInterface(): string {
    const stageCards = STAGE_DEFINITIONS.map((stage) => `
      <button
        class="stage-card${stage.id === 1 ? " is-selected" : ""}"
        type="button"
        data-stage-select="${stage.id}"
        aria-pressed="${stage.id === 1 ? "true" : "false"}"
      >
        <span class="stage-number">${stage.numberLabel}</span>
        <b>${stage.name}</b>
        <span class="stage-difficulty">${stage.difficulty}</span>
        <small>${stage.description}</small>
        <i data-stage-best="${stage.id}">BEST --:--.--</i>
      </button>
    `).join("");

    return `
      <main class="game-shell">
        <section class="game-viewport" aria-label="そば屋のビールダッシュ">
          <canvas aria-label="3レーンのビール回収ゲーム"></canvas>

          <div class="hud" aria-live="polite">
            <div class="hud-card hud-timer">
              <span class="hud-kicker">GOAL TIME</span>
              <strong data-timer>00:00.00</strong>
            </div>
            <div class="hud-card hud-served">
              <span class="hud-kicker">本日の提供</span>
              <strong data-served>0</strong><span>杯</span>
            </div>
            <div class="hud-card hud-routes">
              <span class="hud-kicker">正解ルート</span>
              <strong data-routes>0</strong><span>本</span>
            </div>
            <button class="pause-button" type="button" aria-label="一時停止">Ⅱ</button>
            <div class="run-progress" aria-hidden="true"><i data-progress-bar></i></div>
            <div class="speed-pill" data-speed>速度 ×1.00</div>
            <div class="stage-pill" data-stage-hud>STAGE 1</div>
            <div class="chain-pill" data-chain>BEER STREAK 0</div>
          </div>

          <div class="announcer" role="status"></div>
          <div class="pickup-float" aria-hidden="true">+1</div>
          <aside class="okayaman-broadcast" aria-live="polite">
            <div class="broadcast-photo">
              <img src="images/okayaman.jpg" alt="実写のおかやまん" />
              <span>LIVE</span>
            </div>
            <p>おかやまん。タイムアタックのレギュレーションに大変驚いております。</p>
          </aside>

          <div class="lane-controls" aria-label="移動ボタン">
            <button type="button" data-move="-1" aria-label="左のレーンへ">‹</button>
            <button type="button" data-move="1" aria-label="右のレーンへ">›</button>
          </div>

          <section class="screen title-screen is-visible">
            <div class="title-vignette"></div>
            <div class="title-copy">
              <p class="eyebrow">MADOGIWA 3-LANE RUNNER</p>
              <h1><span>そば屋の</span>ビールダッシュ</h1>
              <p class="title-sub">正解レーンを見抜いて、一気に乾杯！</p>
              <div class="title-rule">
                <span>操作は ← → だけ</span>
                <span>ビールの予告列を読む</span>
                <span>正解レーンで連続GET</span>
                <span>458mタイムアタック</span>
              </div>
              <div class="stage-select" aria-label="ステージ選択">
                ${stageCards}
              </div>
              <button class="primary-button" type="button" data-start>
                <span data-start-label>STAGE 1を走る</span>
                <b>RUN!</b>
              </button>
              <p class="loading-note" data-loading>正典ボクセルを搬入中…</p>
            </div>
            <div class="live-action-tease">
              <span>ゴール判定</span>
              <b>実写</b>
            </div>
          </section>

          <section class="screen pause-screen">
            <div class="compact-panel">
              <p class="eyebrow">BREAK TIME</p>
              <h2>ちょっと休憩です！</h2>
              <button class="primary-button" type="button" data-resume>走りつづける</button>
              <button class="text-button" type="button" data-quit>タイトルへ</button>
            </div>
          </section>

          <section class="screen result-screen">
            <div class="result-layout">
              <div class="okayaman-monitor" aria-label="窓際会議室の大型スクリーン">
                <div class="monitor-header">
                  <span class="live-dot"></span> MADOGIWA LIVE
                </div>
                <div class="live-photo">
                  <img src="images/okayaman.jpg" alt="実写のおかやまん" />
                  <div class="scanlines"></div>
                  <span class="photo-label">窓際王 おかやまん</span>
                </div>
                <p data-okayaman-quote>おかやまん。大変驚いております。</p>
              </div>

              <div class="result-panel">
                <p class="eyebrow" data-result-stage>STAGE 1・本日の営業結果</p>
                <div class="rank-lockup">
                  <strong data-result-rank>S</strong>
                  <div>
                    <span>RANK</span>
                    <b data-result-label>大変驚いております</b>
                  </div>
                </div>
                <div class="result-time">
                  <span>GOAL TIME</span>
                  <strong data-result-time>00:00.00</strong>
                </div>
                <div class="result-score"><strong data-result-served>0</strong><span>杯 提供！</span></div>
                <p class="result-stats" data-result-stats></p>
                <p class="new-best" data-result-best></p>
                <div class="result-actions">
                  <button class="primary-button" type="button" data-retry>
                    <span data-retry-label>STAGE 1をもう一杯！</span>
                  </button>
                  <button class="text-button" type="button" data-result-home>タイトルへ</button>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    `;
  }

  private createLighting(): void {
    const hemisphere = new THREE.HemisphereLight(0xe9f8ff, 0x6c7b58, 2.2);
    this.scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xfff0cf, 3.2);
    sun.position.set(-12, 24, 11);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -8;
    this.scene.add(sun);
  }

  private createCity(): void {
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x263542, roughness: 0.9 });
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(8.6, FINISH_DISTANCE + 80),
      roadMaterial,
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.035, -(FINISH_DISTANCE + 40) / 2);
    road.receiveShadow = true;
    this.world.add(road);

    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xc7c9c3, roughness: 1 });
    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(5.8, 0.22, FINISH_DISTANCE + 80),
        sidewalkMaterial,
      );
      sidewalk.position.set(side * 7.2, -0.02, -(FINISH_DISTANCE + 40) / 2);
      sidewalk.receiveShadow = true;
      this.world.add(sidewalk);
    }

    const tapeMaterial = new THREE.MeshBasicMaterial({ color: 0xf9f1cf });
    for (let z = 4; z > -FINISH_DISTANCE - 20; z -= 5.5) {
      for (const x of [-1.18, 1.18]) {
        const tape = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 2.7), tapeMaterial);
        tape.position.set(x, 0.01, z);
        this.world.add(tape);
      }
    }

    const curbMaterial = new THREE.MeshStandardMaterial({ color: 0x596773, roughness: 0.85 });
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.34, FINISH_DISTANCE + 80),
        curbMaterial,
      );
      curb.position.set(side * 4.45, 0.08, -(FINISH_DISTANCE + 40) / 2);
      this.world.add(curb);
    }

    for (let index = 0; index < 30; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const width = 5.5 + (index % 4) * 1.2;
      const height = 10 + (index * 7) % 18;
      const depth = 7 + (index % 3) * 2.3;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
          color: TEMP_COLOR.setHSL(0.56 + (index % 5) * 0.015, 0.16, 0.42 + (index % 3) * 0.07),
          roughness: 0.82,
        }),
      );
      building.position.set(
        side * (9 + (index % 3) * 2.1),
        height / 2,
        -12 - index * 16,
      );
      building.castShadow = true;
      building.receiveShadow = true;
      this.world.add(building);

      const windowMaterial = new THREE.MeshBasicMaterial({
        color: index % 4 === 0 ? 0xffd67d : 0x9ed7e8,
      });
      for (let floor = 0; floor < 3; floor += 1) {
        const strip = new THREE.Mesh(
          new THREE.PlaneGeometry(width * 0.72, 0.45),
          windowMaterial,
        );
        strip.position.set(
          building.position.x - side * (width / 2 + 0.012),
          3 + floor * 2.5,
          building.position.z,
        );
        strip.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.world.add(strip);
      }
    }

    this.createTokyoTower();
    this.createDistrictMarkers();
    this.createOkayamanRoadMonitor();
    this.createFinishArea();
  }

  private createDistrictMarkers(): void {
    const districts = [
      { distance: 32, label: "赤坂オフィス街", color: "#bdeeff", side: -1 },
      { distance: 142, label: "窓際BBQ通り", color: "#fff0a6", side: 1 },
      { distance: 252, label: "レギュレーション区", color: "#a8f4dc", side: -1 },
      { distance: WANTED_ZONE_START, label: "WANTED BONUS ROUTE", color: "#ffcf55", side: 1 },
      { distance: FINAL_RUSH_START, label: "立ち飲み処前", color: "#ffb098", side: -1 },
    ] as const;

    for (const district of districts) {
      const marker = new THREE.Group();
      marker.position.set(district.side * 6.15, 0, -district.distance);
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 3.4, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x566979, roughness: 0.8 }),
      );
      post.position.y = 1.7;
      marker.add(post);
      const label = this.createTextSprite(district.label, district.color, "rgba(8,26,42,.9)");
      label.position.set(0, 3.35, 0);
      label.scale.set(3.2, 0.8, 1);
      marker.add(label);
      this.world.add(marker);
    }
  }

  private createOkayamanRoadMonitor(): void {
    // おかやまんのNG変更要素: 穏やかな笑顔とスクリーン越しの実写出演を維持する。
    const monitor = new THREE.Group();
    monitor.position.set(-6.2, 2.5, -242);
    monitor.rotation.y = Math.PI / 2;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(4.7, 3.5, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x162b3d, metalness: 0.45, roughness: 0.35 }),
    );
    monitor.add(frame);
    const texture = new THREE.TextureLoader().load("images/okayaman.jpg");
    texture.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.15, 2.95),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    screen.position.z = 0.15;
    monitor.add(screen);
    this.world.add(monitor);
  }

  private createTokyoTower(): void {
    const tower = new THREE.Group();
    tower.position.set(-14, 0, -FINISH_DISTANCE - 18);
    const red = new THREE.MeshStandardMaterial({ color: 0xf05036, emissive: 0x3d0d07 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf7eee0 });

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3.5, 16, 4, 1, true), red);
    lower.position.y = 8;
    lower.rotation.y = Math.PI / 4;
    tower.add(lower);
    const middle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.25, 10, 4, 1, true), white);
    middle.position.y = 20;
    middle.rotation.y = Math.PI / 4;
    tower.add(middle);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.42, 10, 8), red);
    spire.position.y = 30;
    tower.add(spire);
    this.world.add(tower);
  }

  private createFinishArea(): void {
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b4d29, roughness: 0.92 });
    const navy = new THREE.MeshStandardMaterial({ color: 0x102a4a, roughness: 0.78 });
    const lantern = new THREE.MeshStandardMaterial({
      color: 0xee3c27,
      emissive: 0x8a1007,
      emissiveIntensity: 0.8,
    });

    const gate = new THREE.Group();
    gate.position.z = -FINISH_DISTANCE;
    for (const x of [-4.05, 4.05]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.8, 0.35), wood);
      post.position.set(x, 2.4, 0);
      gate.add(post);
    }
    const banner = new THREE.Mesh(new THREE.BoxGeometry(8.4, 1.18, 0.24), navy);
    banner.position.y = 4.45;
    gate.add(banner);
    const sign = this.createTextSprite("本 日 開 店", "#fff4cf", "rgba(0,0,0,0)");
    sign.position.set(0, 4.45, 0.16);
    sign.scale.set(4.1, 1, 1);
    gate.add(sign);
    for (const x of [-3.25, 3.25]) {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), lantern);
      light.scale.y = 1.25;
      light.position.set(x, 3.4, 0);
      gate.add(light);
    }
    this.world.add(gate);

    const stall = new THREE.Group();
    stall.position.set(7.2, 0, -FINISH_DISTANCE - 2);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.7, 2.7), wood);
    counter.position.y = 0.85;
    stall.add(counter);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.34, 3.6), navy);
    roof.position.y = 4.3;
    stall.add(roof);
    for (const x of [-2.35, 2.35]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 0.25), wood);
      post.position.set(x, 2.1, 0);
      stall.add(post);
    }
    const noren = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.15), navy);
    noren.position.set(0, 3.48, 1.4);
    stall.add(noren);
    this.world.add(stall);
  }

  private createPlayerPlaceholder(): void {
    // そば屋のNG変更要素: 白い仮面と大型ビールジョッキを必ず維持する。
    const red = new THREE.MeshStandardMaterial({ color: 0xd83d31 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xb88164 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x15191d });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.45, 0.78), red);
    body.position.y = 1.55;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.9, 0.78), skin);
    head.position.y = 2.58;
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.66, 0.08), white);
    mask.position.set(0, 2.58, -0.43);
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), dark);
    leftEye.position.set(-0.2, 2.66, -0.49);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.2;
    this.playerPlaceholder.add(body, head, mask, leftEye, rightEye);
    this.player.add(this.playerPlaceholder);
  }

  private loadCharacters(): void {
    loadVoxelCharacter({
      definition: runnerDefinition("models/sobaya.glb", 1.18, Math.PI),
      parent: this.player,
      onReady: (character) => {
        this.playerCharacter = character;
        this.playerPlaceholder.visible = false;
        this.loadingText.textContent = "正典ボクセル搬入完了！";
        this.loadingText.classList.add("is-ready");
      },
      onError: () => {
        this.loadingText.textContent = "予備のそば屋で出走できます！";
      },
    });

    // とーくん: アロハ・帽子・ウクレレ、よーたん: ギター・金髪・ロック服を維持。
    this.loadCameo("models/tokun.glb", 1.05, -5.5, -66, Math.PI / 2, "ALOHA BOOST!");
    this.loadCameo("models/yotan.glb", 1.05, 5.7, -132, -Math.PI / 2, "ROCK CLEAR!");
    // 福ちゃん: おしゃれ服・ギュンギュンポーズを維持。
    this.loadCameo("models/fukuchan.glb", 1.05, -5.7, -198, Math.PI / 2, "ギュンギュン GUARD!");
    // ゆめみん: 青い体・点目・自由に動く鼻・木槌を維持。
    this.loadCameo("models/yumemin.glb", 1.08, 5.5, -276, -Math.PI / 2, "BONK!");
    // やめたろう: 紫色ワイシャツ・丸メガネを含む正典デザインを維持。
    this.loadCameo("models/yametaro.glb", 1.02, -5.7, -314, Math.PI / 2, "WANTED 2億!");
    // たこさん: 黒ローブ・白い顔・触手・人間の腕2本を維持。
    this.loadCameo("models/takosan.glb", 0.96, 5.7, -397, -Math.PI / 2, "全レーン乾杯");
  }

  private loadCameo(
    url: string,
    scale: number,
    x: number,
    z: number,
    rotationY: number,
    label: string,
  ): void {
    const holder = new THREE.Group();
    holder.position.set(x, 0, z);
    this.world.add(holder);
    loadVoxelCharacter({
      definition: runnerDefinition(url, scale, rotationY),
      parent: holder,
      onReady: (character) => {
        this.cameos.push(character);
        const sprite = this.createTextSprite(label, "#fff7d0", "rgba(9,30,48,.82)");
        sprite.position.y = 4.1;
        sprite.scale.set(2.4, 0.72, 1);
        holder.add(sprite);
      },
    });
  }

  private bindEvents(): void {
    this.required<HTMLButtonElement>("[data-start]").addEventListener("click", () => {
      void this.startFromTitle();
    });
    this.required<HTMLButtonElement>("[data-retry]").addEventListener("click", () => this.startRun());
    this.required<HTMLButtonElement>("[data-resume]").addEventListener("click", () => this.resume());
    this.required<HTMLButtonElement>("[data-quit]").addEventListener("click", () => this.showTitle());
    this.required<HTMLButtonElement>("[data-result-home]").addEventListener("click", () => this.showTitle());
    this.required<HTMLButtonElement>(".pause-button").addEventListener("click", () => this.pause());

    this.root.querySelectorAll<HTMLButtonElement>("[data-stage-select]").forEach((button) => {
      button.addEventListener("click", () => {
        const stageId = Number(button.dataset.stageSelect) as StageId;
        if (stageId === 1 || stageId === 2 || stageId === 3) this.selectStage(stageId);
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.moveLane(Number(button.dataset.move) < 0 ? -1 : 1);
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        this.moveLane(-1);
      } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        this.moveLane(1);
      } else if (event.key.toLowerCase() === "p" || event.key === "Escape") {
        event.preventDefault();
        if (this.phase === "playing") this.pause();
        else if (this.phase === "paused") this.resume();
      }
    });

    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointerStart = { x: event.clientX, y: event.clientY };
    });
    this.canvas.addEventListener("pointerup", (event) => {
      if (!this.pointerStart || this.phase !== "playing") return;
      const deltaX = event.clientX - this.pointerStart.x;
      const deltaY = event.clientY - this.pointerStart.y;
      const bounds = this.canvas.getBoundingClientRect();
      if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY)) {
        this.moveLane(deltaX < 0 ? -1 : 1);
      } else {
        this.moveLane(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
      }
      this.pointerStart = undefined;
    });

    window.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.phase === "playing") this.pause();
    });
  }

  private selectStage(stageId: StageId): void {
    this.stageId = stageId;
    const stage = stageDefinition(stageId);
    this.root.dataset.stage = String(stageId);
    this.stageHudText.textContent = `${stage.numberLabel} ${stage.name}`;
    this.startLabel.textContent = `${stage.numberLabel}を走る`;
    this.retryLabel.textContent = `${stage.numberLabel}をもう一杯！`;
    this.root.querySelectorAll<HTMLButtonElement>("[data-stage-select]").forEach((button) => {
      const selected = Number(button.dataset.stageSelect) === stageId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    this.renderer.setClearColor(stage.skyColor);
    this.scene.background = new THREE.Color(stage.skyColor);
    this.scene.fog = new THREE.Fog(stage.skyColor, 32, stage.fogFar);
    this.refreshStageRecords();
  }

  private async startFromTitle(): Promise<void> {
    this.audio.unlock();
    const startButton = this.required<HTMLButtonElement>("[data-start]");
    startButton.disabled = true;
    await playCutscene(this.root, { src: "videos/opening.mp4" });
    startButton.disabled = false;
    this.startRun();
  }

  private startRun(): void {
    this.audio.unlock();
    this.phase = "playing";
    this.elapsed = 0;
    this.distance = 0;
    this.targetLaneIndex = 1;
    this.served = 0;
    this.collectedBeers = 0;
    this.chain = 0;
    this.bestChain = 0;
    this.perfectRoutes = 0;
    this.routeStreak = 0;
    this.bestRouteStreak = 0;
    this.hits = 0;
    this.nearMisses = 0;
    this.supportCount = 0;
    this.topSpeed = 0;
    this.hitTime = 0;
    this.supportBoostTime = 0;
    this.nearMissBoostTime = 0;
    this.magnetTime = 0;
    this.shieldReady = false;
    this.lastSpeedTier = 0;
    this.finalRushAnnounced = false;
    this.supportEvents.forEach((event) => {
      event.triggered = false;
    });
    this.okayamanBroadcast.classList.remove("is-visible");
    if (this.broadcastTimer !== undefined) window.clearTimeout(this.broadcastTimer);
    this.root.classList.remove("is-final-rush", "is-slowed", "has-shield");
    this.player.position.set(0, 0, 0);
    this.player.rotation.set(0, 0, 0);
    this.camera.position.set(0, 4.8, 8.8);
    this.createCourse(Date.now() & 0xfffffff);
    this.updateHud();
    this.titleOverlay.classList.remove("is-visible");
    this.pauseOverlay.classList.remove("is-visible");
    this.resultOverlay.classList.remove("is-visible");
    this.hud.classList.add("is-visible");
    this.audio.setPlaying(true);
    const stage = stageDefinition(this.stageId);
    this.showAnnouncement(`${stage.numberLabel} ${stage.mechanic}`, "gold");
  }

  private createCourse(seed: number): void {
    this.courseGroup.clear();
    this.entities = [];
    const rows = buildCourse(seed, this.stageId);
    for (const row of rows) {
      row.cells.forEach((cell, laneIndex) => {
        if (!cell) return;
        const lane = (laneIndex - 1) as Lane;
        const template = cell === "beer"
          ? this.beerTemplate
          : cell === "goldBeer"
            ? this.goldBeerTemplate
            : cell === "crate"
              ? this.crateTemplate
              : this.barrelTemplate;
        const object = template.clone(true);
        const baseY = cell === "beer" || cell === "goldBeer"
          ? 1.05
          : cell === "crate"
            ? 0.66
            : 0.62;
        object.position.set(LANE_X[laneIndex], baseY, -row.distance);
        object.visible = true;
        this.courseGroup.add(object);
        this.entities.push({
          kind: cell,
          object,
          distance: row.distance,
          lane,
          baseY,
          consumed: false,
          nearMissChecked: false,
          routeId: row.routeId,
          role: row.role,
          motionPhase: row.distance * 0.173 + laneIndex * 1.7,
        });
      });
    }
  }

  private moveLane(direction: -1 | 1): void {
    if (this.phase !== "playing") return;
    this.targetLaneIndex = THREE.MathUtils.clamp(this.targetLaneIndex + direction, 0, 2);
  }

  private pause(): void {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.audio.setPlaying(false);
    this.pauseOverlay.classList.add("is-visible");
  }

  private resume(): void {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.audio.unlock();
    this.audio.setPlaying(true);
    this.pauseOverlay.classList.remove("is-visible");
    this.lastFrameTime = performance.now();
  }

  private showTitle(): void {
    this.phase = "title";
    this.audio.setPlaying(false);
    this.hud.classList.remove("is-visible");
    this.pauseOverlay.classList.remove("is-visible");
    this.resultOverlay.classList.remove("is-visible");
    this.titleOverlay.classList.add("is-visible");
    this.okayamanBroadcast.classList.remove("is-visible");
    this.root.classList.remove("is-final-rush", "is-slowed", "has-shield");
    this.distance = 0;
    this.player.position.set(0, 0, 0);
    this.player.rotation.set(0, 0, 0);
    this.refreshStageRecords();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const frameTime = performance.now();
    const dt = Math.min((frameTime - this.lastFrameTime) / 1000, 0.05);
    const visualTime = frameTime / 1000;
    this.lastFrameTime = frameTime;

    if (this.phase === "playing") this.updateRun(dt);
    else this.updateIdle(dt, visualTime);

    this.updateEffects(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateRun(dt: number): void {
    const previousDistance = this.distance;
    this.elapsed += dt;
    this.audio.update(dt);
    this.hitTime = Math.max(0, this.hitTime - dt);
    this.supportBoostTime = Math.max(0, this.supportBoostTime - dt);
    this.nearMissBoostTime = Math.max(0, this.nearMissBoostTime - dt);
    this.magnetTime = Math.max(0, this.magnetTime - dt);
    this.root.classList.toggle("is-slowed", this.hitTime > 0);

    const speed = runSpeed(
      this.collectedBeers,
      this.hitTime > 0,
      this.supportBoostTime > 0,
      this.nearMissBoostTime > 0,
      this.stageId,
    );
    this.topSpeed = Math.max(this.topSpeed, speed);
    this.distance = Math.min(FINISH_DISTANCE, this.distance + speed * dt);
    if (this.distance >= FINISH_DISTANCE && speed > 0) {
      const finishSlice = (FINISH_DISTANCE - previousDistance) / speed;
      this.elapsed -= Math.max(0, dt - finishSlice);
    }
    this.player.position.z = -this.distance;
    this.player.position.x = THREE.MathUtils.damp(
      this.player.position.x,
      LANE_X[this.targetLaneIndex],
      18,
      dt,
    );
    this.player.position.y = Math.abs(Math.sin(this.elapsed * 10.5)) * 0.055;
    const stageBaseSpeed = baseSpeedForStage(this.stageId);
    const speedProgress = THREE.MathUtils.clamp(
      (speed / stageBaseSpeed - 1) / (MAX_BEER_SPEED_MULTIPLIER - 1),
      0,
      1,
    );
    this.player.rotation.x = THREE.MathUtils.damp(
      this.player.rotation.x,
      -0.07 - speedProgress * 0.06,
      8,
      dt,
    );
    this.player.rotation.z = this.hitTime > 0
      ? Math.sin(this.hitTime * 38) * this.hitTime * 0.46
      : THREE.MathUtils.damp(this.player.rotation.z, 0, 14, dt);

    this.playerCharacter?.mixer?.update(dt);
    this.playerCharacter?.actions?.update(dt, this.elapsed, true);
    this.cameos.forEach((cameo) => {
      cameo.mixer?.update(dt);
      cameo.actions?.update(dt, this.elapsed, false);
    });

    this.updateEntities(dt);
    this.updateSupportEvents();

    if (!this.finalRushAnnounced && this.distance >= FINAL_RUSH_START) {
      this.finalRushAnnounced = true;
      this.showAnnouncement("乾杯ラッシュ！", "red");
      this.root.classList.add("is-final-rush");
    }

    this.updateHud();
    if (hasFinished(this.distance)) this.finishRun();
  }

  private updateIdle(dt: number, visualTime: number): void {
    this.playerCharacter?.mixer?.update(dt);
    this.playerCharacter?.actions?.update(dt, visualTime, false);
    this.cameos.forEach((cameo) => {
      cameo.mixer?.update(dt);
      cameo.actions?.update(dt, visualTime, false);
    });
    this.player.position.y = Math.sin(visualTime * 2.1) * 0.025;
    this.player.rotation.x = THREE.MathUtils.damp(this.player.rotation.x, 0, 6, dt);
  }

  private updateEntities(dt: number): void {
    for (const entity of this.entities) {
      if (entity.consumed) continue;
      const delta = entity.distance - this.distance;
      if (delta < -3.5) continue;

      const isBeer = entity.kind === "beer" || entity.kind === "goldBeer";
      if (isBeer) {
        entity.object.rotation.y += dt * 2.8;
        entity.object.position.y = entity.baseY + Math.sin(this.elapsed * 5 + entity.distance) * 0.13;
        if (this.magnetTime > 0 && delta > -0.8 && delta < 13) {
          entity.object.position.x = THREE.MathUtils.damp(
            entity.object.position.x,
            this.player.position.x,
            10,
            dt,
          );
        }
      } else if (entity.kind === "movingBarrel") {
        entity.object.position.x = Math.sin(this.elapsed * 1.7 + entity.motionPhase) * 2.28;
        entity.object.rotation.x += dt * 2.6;
        entity.object.rotation.z += dt * 0.8;
      } else if (entity.kind === "barrel") {
        entity.object.rotation.x += dt * 1.4;
      }

      const laneDistance = Math.abs(entity.object.position.x - this.player.position.x);
      if (Math.abs(delta) <= 0.82 && laneDistance <= (isBeer ? 0.88 : 0.82)) {
        entity.consumed = true;
        entity.object.visible = false;
        if (isBeer) this.collectBeer(entity);
        else this.hitObstacle();
        continue;
      }

      if (
        !isBeer
        && !entity.nearMissChecked
        && delta < -0.9
      ) {
        entity.nearMissChecked = true;
        if (laneDistance > 0.82 && laneDistance < 1.68) this.registerNearMiss();
      }
    }
  }

  private collectBeer(entity: TrackEntity): void {
    const beerValue = entity.kind === "goldBeer" ? 3 : 1;
    const previousTier = Math.floor(this.collectedBeers / BEERS_PER_SPEED_UP);
    this.served += beerValue;
    this.collectedBeers += beerValue;
    this.chain += beerValue;
    this.bestChain = Math.max(this.bestChain, this.chain);
    this.audio.collect(this.chain);
    this.showPickup(beerValue, entity.kind === "goldBeer");

    const clearedRoute = isRouteGate(entity.role);
    if (clearedRoute) {
      this.perfectRoutes += 1;
      this.routeStreak += 1;
      this.bestRouteStreak = Math.max(this.bestRouteStreak, this.routeStreak);
      this.audio.routeClear();
      this.createGoldBurst();
    }

    const currentTier = Math.floor(this.collectedBeers / BEERS_PER_SPEED_UP);
    if (clearedRoute) {
      this.showAnnouncement(`正解ルート！ ${this.routeStreak}連続`, "gold");
    } else if (currentTier > previousTier && currentTier > this.lastSpeedTier) {
      this.lastSpeedTier = currentTier;
      this.showAnnouncement(
        `SPEED UP！ ×${beerSpeedMultiplier(this.collectedBeers).toFixed(2)}`,
        "gold",
      );
    }
  }

  private hitObstacle(): void {
    this.chain = 0;
    this.routeStreak = 0;
    if (this.hitTime > 0) return;
    if (this.shieldReady) {
      this.shieldReady = false;
      this.root.classList.remove("has-shield");
      this.createGoldBurst();
      this.showAnnouncement("福ちゃんGUARD！ ギュンギュン！", "blue");
      return;
    }
    this.hitTime = COLLISION_DURATION;
    this.hits += 1;
    this.audio.hit();
    this.showAnnouncement("接触！ 2秒スピードダウン", "blue");
  }

  private registerNearMiss(): void {
    this.nearMisses += 1;
    this.nearMissBoostTime = Math.max(this.nearMissBoostTime, 1.25);
    this.showAnnouncement("ギリギリ快適！ ニアミス加速", "blue");
  }

  private updateSupportEvents(): void {
    for (const event of this.supportEvents) {
      if (event.triggered || this.distance < event.distance) continue;
      event.triggered = true;
      this.supportCount += 1;
      this.triggerSupport(event.kind);
    }
  }

  private triggerSupport(kind: SupportKind): void {
    switch (kind) {
      case "tokun":
        this.supportBoostTime = Math.max(this.supportBoostTime, 3);
        this.showAnnouncement("とーくんのALOHA BOOST！", "gold");
        break;
      case "yotan":
        this.clearNextObstacleRow();
        this.showAnnouncement("よーたんROCK！ 障害物を破壊", "red");
        break;
      case "fukuchan":
        this.shieldReady = true;
        this.root.classList.add("has-shield");
        this.showAnnouncement("福ちゃんのギュンギュンGUARD！", "blue");
        break;
      case "okayaman":
        this.showOkayamanBroadcast();
        break;
      case "yumemin":
        this.hitTime = 0;
        this.nearMissBoostTime = Math.max(this.nearMissBoostTime, 2.5);
        this.root.classList.remove("is-slowed");
        this.showAnnouncement("ゆめみんBONK！ 減速解除", "blue");
        break;
      case "yametaro":
        this.showAnnouncement("やめたろうWANTED！ 金ビールは3杯分", "red");
        break;
      case "takosan":
        this.magnetTime = this.stageId === 1 ? 5 : this.stageId === 2 ? 3 : 1.5;
        this.showAnnouncement("たこさん！ 全レーンのビールを回収", "gold");
        break;
    }
  }

  private clearNextObstacleRow(): void {
    const obstacles = this.entities.filter(
      (entity) =>
        !entity.consumed
        && isObstacleKind(entity.kind)
        && entity.distance > this.distance + 3
        && entity.distance < this.distance + 34,
    );
    if (obstacles.length === 0) return;
    const targetDistance = Math.min(...obstacles.map((entity) => entity.distance));
    obstacles
      .filter((entity) => Math.abs(entity.distance - targetDistance) < 0.25)
      .forEach((entity) => {
        entity.consumed = true;
        entity.object.visible = false;
      });
  }

  private showOkayamanBroadcast(): void {
    this.okayamanBroadcast.classList.add("is-visible");
    this.showAnnouncement("窓際王からレギュレーション通信！", "blue");
    if (this.broadcastTimer !== undefined) window.clearTimeout(this.broadcastTimer);
    this.broadcastTimer = window.setTimeout(() => {
      this.okayamanBroadcast.classList.remove("is-visible");
    }, 3300);
  }

  private finishRun(): void {
    if (this.phase !== "playing") return;
    this.phase = "result";
    this.audio.setPlaying(false);
    this.audio.finish();
    this.root.classList.remove("is-final-rush");
    this.hud.classList.remove("is-visible");

    const rank = rankFor(this.served, this.stageId);
    const records = this.readRecords(this.stageId);
    const newBestTime = records.bestTime === null || this.elapsed < records.bestTime;
    const newBestServed = this.served > records.bestServed;
    const newNoHitTime = this.hits === 0
      && (records.bestNoHitTime === null || this.elapsed < records.bestNoHitTime);
    const nextRecords: RecordBook = {
      bestTime: newBestTime ? this.elapsed : records.bestTime,
      bestServed: newBestServed ? this.served : records.bestServed,
      bestNoHitTime: newNoHitTime ? this.elapsed : records.bestNoHitTime,
    };
    if (newBestTime || newBestServed || newNoHitTime) {
      this.writeRecords(this.stageId, nextRecords);
    }
    const result: RunResult = {
      stageId: this.stageId,
      served: this.served,
      finishTime: this.elapsed,
      bestChain: this.bestChain,
      perfectRoutes: this.perfectRoutes,
      bestRouteStreak: this.bestRouteStreak,
      hits: this.hits,
      nearMisses: this.nearMisses,
      topSpeed: this.topSpeed,
      supportCount: this.supportCount,
      rank,
      newBestTime,
      newBestServed,
      newNoHitTime,
    };
    this.showResult(result);
  }

  private showResult(result: RunResult): void {
    const stage = stageDefinition(result.stageId);
    this.resultStageText.textContent = `${stage.numberLabel} ${stage.name}・本日の営業結果`;
    this.resultRank.textContent = result.rank;
    this.resultLabel.textContent = rankLabel(result.rank);
    this.resultTime.textContent = formatTime(result.finishTime);
    this.resultServed.textContent = String(result.served);
    this.resultStats.textContent =
      `最高速度 ${(result.topSpeed * 3.6).toFixed(1)}km/h ／ ビール連続 ${result.bestChain}杯\n`
      + `正解ルート ${result.perfectRoutes}本（最大${result.bestRouteStreak}連続）`
      + ` ／ ニアミス ${result.nearMisses}回 ／ 接触 ${result.hits}回`;
    const newRecords = [
      result.newBestTime ? "最速タイム" : "",
      result.newBestServed ? "最多ビール" : "",
      result.newNoHitTime ? "ノーヒット" : "",
    ].filter(Boolean);
    this.resultBest.textContent = newRecords.length > 0
      ? `NEW RECORD! ${newRecords.join("・")}を更新！`
      : "";

    const detail = result.rank === "S"
      ? `${formatTime(result.finishTime)}で提供${result.served}杯。レギュレーションを超える大繁盛です。`
      : result.rank === "A"
        ? `${formatTime(result.finishTime)}で提供${result.served}杯。立ち飲み処が大繁盛です。`
        : result.rank === "B"
          ? `${formatTime(result.finishTime)}で提供${result.served}杯。常連のみなさんが笑顔です。`
          : `${formatTime(result.finishTime)}で提供${result.served}杯。もう一杯いけそうです。`;
    this.okayamanQuote.textContent = `おかやまん。${detail} 大変驚いております。`;
    this.resultOverlay.classList.add("is-visible");
  }

  private updateHud(): void {
    const currentSpeed = runSpeed(
      this.collectedBeers,
      this.hitTime > 0,
      this.supportBoostTime > 0,
      this.nearMissBoostTime > 0,
      this.stageId,
    );
    this.timerText.textContent = formatTime(this.elapsed);
    this.servedText.textContent = String(this.served);
    this.routeText.textContent = String(this.perfectRoutes);
    this.chainText.textContent = `BEER STREAK ${this.chain}`;
    this.chainText.classList.toggle("is-hot", this.chain >= 8);
    this.speedText.textContent =
      `速度 ×${(currentSpeed / baseSpeedForStage(this.stageId)).toFixed(2)}`;
    this.speedText.classList.toggle("is-penalty", this.hitTime > 0);
    this.progressBar.style.transform = `scaleX(${this.distance / FINISH_DISTANCE})`;
  }

  private showPickup(value: number, isGold = false): void {
    this.floatText.textContent = isGold ? `金ビール +${value}` : `+${value}`;
    this.floatText.classList.toggle("is-gold", isGold);
    this.floatText.classList.remove("is-showing");
    void this.floatText.offsetWidth;
    this.floatText.classList.add("is-showing");
  }

  private showAnnouncement(message: string, tone: "gold" | "blue" | "red"): void {
    this.announcer.textContent = message;
    this.announcer.dataset.tone = tone;
    this.announcer.classList.remove("is-showing");
    void this.announcer.offsetWidth;
    this.announcer.classList.add("is-showing");
  }

  private createGoldBurst(): void {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd447,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.12, 10, 36), material);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(this.player.position.x, 1.3, this.player.position.z - 0.5);
    this.world.add(ring);
    this.bursts.push({ mesh: ring, age: 0 });
  }

  private updateEffects(dt: number): void {
    for (let index = this.bursts.length - 1; index >= 0; index -= 1) {
      const burst = this.bursts[index];
      burst.age += dt;
      const scale = 1 + burst.age * 5;
      burst.mesh.scale.setScalar(scale);
      burst.mesh.material.opacity = Math.max(0, 1 - burst.age * 1.8);
      if (burst.age > 0.58) {
        this.world.remove(burst.mesh);
        burst.mesh.geometry.dispose();
        burst.mesh.material.dispose();
        this.bursts.splice(index, 1);
      }
    }
  }

  private updateCamera(dt: number): void {
    const playerZ = this.phase === "title" ? 0 : this.player.position.z;
    const desiredX = this.player.position.x * 0.23;
    const currentSpeed = this.phase === "playing"
      ? runSpeed(
        this.collectedBeers,
        this.hitTime > 0,
        this.supportBoostTime > 0,
        this.nearMissBoostTime > 0,
        this.stageId,
      )
      : baseSpeedForStage(this.stageId);
    const stageBaseSpeed = baseSpeedForStage(this.stageId);
    const speedProgress = this.phase === "playing"
      ? THREE.MathUtils.clamp(
        (currentSpeed / stageBaseSpeed - 1) / (MAX_BEER_SPEED_MULTIPLIER - 1),
        0,
        1,
      )
      : 0;
    const runningLift = this.phase === "playing" ? Math.sin(this.elapsed * 21) * 0.018 : 0;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desiredX, 5, dt);
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      this.phase === "title" ? 4.45 : 4.8 + runningLift,
      5,
      dt,
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      playerZ + (this.phase === "title" ? 9.8 : 8.8 + speedProgress * 0.35),
      10,
      dt,
    );
    CAMERA_TARGET.set(
      this.player.position.x * 0.38,
      1.45,
      playerZ - 10.5 - speedProgress * 1.4,
    );
    this.camera.lookAt(CAMERA_TARGET);
    const targetFov = this.baseCameraFov
      + (this.phase === "playing" ? 2.2 + speedProgress * 4.8 : 0);
    const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5, dt);
    if (Math.abs(nextFov - this.camera.fov) > 0.001) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
  }

  private resize(): void {
    const bounds = this.canvas.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(bounds.width, bounds.height, false);
    this.camera.aspect = bounds.width / bounds.height;
    this.baseCameraFov = bounds.width < 600 ? 66 : 56;
    this.camera.fov = this.baseCameraFov;
    this.camera.updateProjectionMatrix();
  }

  private createBeerMug(isGold = false): THREE.Group {
    const group = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({
      color: isGold ? 0xffd52f : 0xf7ae22,
      emissive: isGold ? 0xe45f00 : 0x8c4300,
      emissiveIntensity: isGold ? 0.7 : 0.34,
      roughness: 0.28,
      metalness: isGold ? 0.24 : 0.05,
    });
    const foam = new THREE.MeshStandardMaterial({
      color: 0xfff9de,
      emissive: 0x6a5932,
      emissiveIntensity: 0.08,
      roughness: 0.85,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.29, 0.82, 14), glass);
    body.castShadow = true;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.16, 14), foam);
    top.position.y = 0.46;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 8, 16), glass);
    handle.position.set(0.34, 0.02, 0);
    handle.rotation.y = Math.PI / 2;
    group.add(body, top, handle);
    if (isGold) {
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.58, 0.055, 8, 22),
        new THREE.MeshBasicMaterial({ color: 0xffef75 }),
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.08;
      group.add(halo);
      group.scale.setScalar(1.08);
    }
    return group;
  }

  private createCrate(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0xc57a38, roughness: 0.92 });
    const tape = new THREE.MeshStandardMaterial({ color: 0xf4e4bd, roughness: 0.78 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 1.15), material);
    box.castShadow = true;
    box.receiveShadow = true;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.33, 1.18), tape);
    stripe.position.x = 0.2;
    group.add(box, stripe);
    return group;
  }

  private createBarrel(): THREE.Group {
    const group = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
      color: 0x9ca9ae,
      metalness: 0.58,
      roughness: 0.38,
    });
    const band = new THREE.MeshStandardMaterial({ color: 0x344653, metalness: 0.4 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.25, 16), metal);
    barrel.rotation.z = Math.PI / 2;
    barrel.castShadow = true;
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.07, 8, 18), band);
    ringA.rotation.y = Math.PI / 2;
    ringA.position.x = -0.42;
    const ringB = ringA.clone();
    ringB.position.x = 0.42;
    group.add(barrel, ringA, ringB);
    return group;
  }

  private createTextSprite(
    text: string,
    color: string,
    background: string,
  ): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) return new THREE.Sprite();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = background;
    this.roundRect(context, 4, 4, 504, 120, 28);
    context.fill();
    context.font = "900 58px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.fillText(text, 256, 67);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    return new THREE.Sprite(material);
  }

  private roundRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  }

  private normalizeRecord(value: Partial<RecordBook> | undefined): RecordBook {
    return {
      bestTime: typeof value?.bestTime === "number" ? value.bestTime : null,
      bestServed: typeof value?.bestServed === "number" ? value.bestServed : 0,
      bestNoHitTime: typeof value?.bestNoHitTime === "number" ? value.bestNoHitTime : null,
    };
  }

  private readRecords(stageId: StageId): RecordBook {
    try {
      const stored = localStorage.getItem(RECORDS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, Partial<RecordBook>>;
        const stageRecord = parsed[String(stageId)];
        if (stageRecord) return this.normalizeRecord(stageRecord);
      }
      if (stageId === 1) {
        const legacyRecords = localStorage.getItem(LEGACY_RECORDS_KEY);
        if (legacyRecords) {
          return this.normalizeRecord(JSON.parse(legacyRecords) as Partial<RecordBook>);
        }
        const legacyScore = Number(localStorage.getItem(LEGACY_BEST_SCORE_KEY) ?? 0);
        return {
          bestTime: null,
          bestServed: Number.isFinite(legacyScore) ? legacyScore : 0,
          bestNoHitTime: null,
        };
      }
      return this.normalizeRecord(undefined);
    } catch {
      return this.normalizeRecord(undefined);
    }
  }

  private writeRecords(stageId: StageId, records: RecordBook): void {
    try {
      const stored = localStorage.getItem(RECORDS_KEY);
      const collection = stored
        ? JSON.parse(stored) as Record<string, Partial<RecordBook>>
        : {};
      collection[String(stageId)] = records;
      localStorage.setItem(RECORDS_KEY, JSON.stringify(collection));
      this.refreshStageRecords();
    } catch {
      // Private browsing may reject storage; the current run still completes normally.
    }
  }

  private refreshStageRecords(): void {
    this.root.querySelectorAll<HTMLElement>("[data-stage-best]").forEach((element) => {
      const stageId = Number(element.dataset.stageBest) as StageId;
      if (stageId !== 1 && stageId !== 2 && stageId !== 3) return;
      const records = this.readRecords(stageId);
      element.textContent = records.bestTime === null
        ? "BEST --:--.--"
        : `BEST ${formatTime(records.bestTime)}`;
    });
  }
}
