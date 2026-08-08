import "./style.css";
import { Game, type GameState, type HudSnapshot, type RunSummary } from "./game.js";
import { GameAudio } from "./audio.js";
import { LEVELS, type LevelDefinition } from "./level.js";
import {
  getBestRun,
  getPerfectCount,
  getTotalBestScore,
  loadProfile,
  recordClear,
  saveProfile,
} from "./profile.js";
import {
  DIFFICULTIES,
  GADGETS,
  formatTime,
  getDailyMutator,
  getDifficulty,
  type DifficultyId,
} from "./rules.js";
import { SOBAYA, type CharacterMeta } from "./characters.js";

const app = document.getElementById("app");
if (!app) throw new Error("#app is missing");

const dateKey = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
const dailyMutator = getDailyMutator(dateKey);
const audio = new GameAudio();
let profile = loadProfile();
let selectedLevelIndex = Math.min(profile.unlockedLevel - 1, LEVELS.length - 1);
let selectedDifficultyId: DifficultyId = profile.selectedDifficulty;
let game: Game | undefined;
let gameLoaded = false;
let lastSeer: CharacterMeta | null = null;
let toastTimer: number | undefined;

app.innerHTML = `
  <div id="scene" aria-label="3Dゲーム画面"></div>

  <header class="topbar">
    <div class="brand-lockup">
      <span class="brand-mark">定</span>
      <span><b>そば屋の定時ダッシュ</b><small>バレずに脱出！DX</small></span>
    </div>
    <div class="topbar-status">
      <span id="level-chip">1F 一般オフィス</span>
      <button id="sound-btn" class="icon-btn" aria-label="サウンド切替">SOUND ON</button>
      <button id="pause-btn" class="icon-btn" aria-label="一時停止">PAUSE</button>
    </div>
  </header>

  <aside class="mission-hud" aria-live="polite">
    <div class="hud-kicker" id="level-kicker">17:59 / FIRST DASH</div>
    <div class="mission-row">
      <div>
        <small>BONUS MISSION</small>
        <strong id="mission-name">退社確認</strong>
      </div>
      <b id="timer">0:00</b>
    </div>
    <div class="progress-grid">
      <span><small id="objective-rule">任意確認</small><b id="objective-count">0 / 2</b></span>
      <span><small id="loot-rule">任意回収</small><b id="loot-count">0 / 2</b></span>
      <span><small>足音</small><b id="noise-value">無音</b></span>
    </div>
    <div class="detect-label">
      <span>発見ゲージ</span>
      <span id="detect-pct">0%</span>
    </div>
    <div class="detect-bar"><div class="detect-fill" id="detect-fill"></div></div>
    <div class="ai-state" id="ai-state">全員：巡回中</div>
  </aside>

  <aside class="radar-panel">
    <div class="radar-title">
      <span>LIVE FLOOR MAP</span>
      <span class="blip"></span>
    </div>
    <canvas id="radar"></canvas>
    <div class="legend" id="legend"></div>
    <div class="radar-key" id="radar-key"><i class="objective-dot"></i>任意確認 <i class="loot-dot"></i>任意回収</div>
  </aside>

  <div class="alert-banner" id="banner"></div>
  <div class="toast" id="toast"></div>

  <div class="game-controls">
    <div class="gadget-actions" id="gadget-actions"></div>
    <div class="keyboard-help">移動 WASD / 矢印 ・ しのび足 SHIFT ・ 一時停止 P</div>
  </div>

  <div class="joystick" id="joystick" aria-label="移動スティック">
    <div class="nub" id="nub"></div>
  </div>
  <button class="sneak-btn" id="sneak-btn">しのび足</button>

  <section class="overlay lobby" id="overlay-lobby">
    <div class="lobby-shell">
      <div class="hero-copy">
        <span class="eyebrow">MADOGIWA STEALTH ROGUELITE</span>
        <h1>定時だ。<br /><em>気配を消して帰ろう。</em></h1>
        <p>
          3つの退社難易度で、回収条件と段ボールの使用回数が変化。
          モードごとに全フロアの記録を磨き、ALL PERFECTを目指そう。
        </p>
        <div class="daily-card">
          <span>本日のレギュレーション</span>
          <b>${dailyMutator.label}</b>
          <small>${dailyMutator.description}　スコア ×${dailyMutator.scoreMultiplier.toFixed(2)}</small>
        </div>
        <div class="profile-strip">
          <span><small>PERFECT</small><b id="profile-perfects">0 / ${LEVELS.length}</b></span>
          <span><small>TOTAL BEST</small><b id="profile-score">0</b></span>
          <span><small>解放フロア</small><b id="profile-levels">1 / ${LEVELS.length}</b></span>
        </div>
      </div>

      <div class="lobby-panel">
        <div class="panel-heading">
          <div><small>SELECT FLOOR</small><h2>今夜の退社ルート</h2></div>
          <span id="selected-level-label">1F</span>
        </div>
        <div class="stage-list" id="stage-list"></div>

        <div class="panel-heading compact">
          <div><small>SELECT MODE</small><h2>退社難易度</h2></div>
          <span id="difficulty-label">残業</span>
        </div>
        <div class="difficulty-select" id="difficulty-select"></div>

        <div class="selected-brief">
          <div>
            <small id="brief-kicker"></small>
            <b id="brief-title"></b>
            <small class="brief-record" id="brief-record">NO RECORD</small>
          </div>
          <p id="brief-description"></p>
        </div>
        <button class="primary-btn" id="start-btn" disabled>
          <span>キャラクター読み込み中…</span><b>→</b>
        </button>
      </div>
    </div>
  </section>

  <section class="overlay result hidden" id="overlay-result">
    <div class="result-card">
      <span class="eyebrow" id="result-mode">ON-TIME EXIT COMPLETE</span>
      <div class="perfect-badge hidden" id="result-perfect">FLOOR PERFECT</div>
      <div class="rank" id="result-rank">S</div>
      <h2>定時ダッシュ成功！</h2>
      <p id="result-message"></p>
      <div class="result-stats" id="result-stats"></div>
      <div class="bonus-list" id="bonus-list"></div>
      <div class="overlay-actions">
        <button class="secondary-btn" id="result-lobby-btn">フロア選択</button>
        <button class="primary-btn small" id="retry-btn"><span>もう一度</span><b>↻</b></button>
        <button class="primary-btn small" id="next-btn"><span>次のフロア</span><b>→</b></button>
      </div>
    </div>
  </section>

  <section class="overlay caught hidden" id="overlay-caught">
    <div class="result-card">
      <span class="eyebrow">FRIENDLY INTERRUPTION</span>
      <div class="caught-icon">👀</div>
      <h2>声をかけられた！</h2>
      <p id="caught-message">立ち話が始まり、今夜の最速退社はおあずけです。</p>
      <div class="overlay-actions">
        <button class="secondary-btn" id="caught-lobby-btn">フロア選択</button>
        <button class="primary-btn small" id="caught-retry-btn"><span>リトライ</span><b>↻</b></button>
      </div>
    </div>
  </section>

  <section class="overlay pause hidden" id="overlay-pause">
    <div class="pause-card">
      <span class="eyebrow">PAUSED</span>
      <h2>ひと休み中</h2>
      <p>仕事ではなく、ゲームを休憩しています。</p>
      <button class="primary-btn small" id="resume-btn"><span>戻る</span><b>→</b></button>
      <button class="secondary-btn" id="pause-lobby-btn">フロア選択へ</button>
    </div>
  </section>
`;

const sceneHost = requiredElement<HTMLElement>("scene");
const radarCanvas = requiredElement<HTMLCanvasElement>("radar");
const startButton = requiredElement<HTMLButtonElement>("start-btn");
const detectFill = requiredElement<HTMLElement>("detect-fill");
const detectPct = requiredElement<HTMLElement>("detect-pct");
const banner = requiredElement<HTMLElement>("banner");
const toast = requiredElement<HTMLElement>("toast");
const lobbyOverlay = requiredElement<HTMLElement>("overlay-lobby");
const resultOverlay = requiredElement<HTMLElement>("overlay-result");
const caughtOverlay = requiredElement<HTMLElement>("overlay-caught");
const pauseOverlay = requiredElement<HTMLElement>("overlay-pause");
const gadgetActions = requiredElement<HTMLElement>("gadget-actions");
const joystick = requiredElement<HTMLElement>("joystick");
const nub = requiredElement<HTMLElement>("nub");
const sneakButton = requiredElement<HTMLButtonElement>("sneak-btn");

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing`);
  return element as T;
}

function renderLobby() {
  const difficulty = getDifficulty(selectedDifficultyId);
  const perfectCount = getPerfectCount(profile, selectedDifficultyId);
  requiredElement<HTMLElement>("profile-perfects").textContent = `${perfectCount} / ${LEVELS.length}`;
  requiredElement<HTMLElement>("profile-score").textContent =
    getTotalBestScore(profile, selectedDifficultyId).toLocaleString();
  requiredElement<HTMLElement>("profile-levels").textContent = `${profile.unlockedLevel} / ${LEVELS.length}`;
  requiredElement<HTMLElement>("difficulty-label").textContent = difficulty.name;
  const selectedLevel = LEVELS[selectedLevelIndex];
  requiredElement<HTMLElement>("selected-level-label").textContent =
    perfectCount === LEVELS.length
      ? `${difficulty.name} ALL PERFECT ✓`
      : `${selectedLevel.number}F · ${perfectCount}/${LEVELS.length} PERFECT`;
  requiredElement<HTMLElement>("brief-kicker").textContent = selectedLevel.kicker;
  requiredElement<HTMLElement>("brief-title").textContent = selectedLevel.title;
  requiredElement<HTMLElement>("brief-description").textContent = selectedLevel.description;
  const selectedBest = getBestRun(profile, selectedLevel.id, selectedDifficultyId);
  requiredElement<HTMLElement>("brief-record").textContent = selectedBest
    ? `${selectedBest.perfect ? "PERFECT · " : ""}BEST ${selectedBest.rank} ${selectedBest.score.toLocaleString()} · ${formatTime(selectedBest.time)}`
    : `NO RECORD · ${difficulty.requiresAllItems ? "全回収で出口を解放" : "回収数でスコアUP"}`;

  const stageList = requiredElement<HTMLElement>("stage-list");
  stageList.innerHTML = LEVELS.map((level, index) => {
    const unlocked = level.number <= profile.unlockedLevel;
    const best = getBestRun(profile, level.id, selectedDifficultyId);
    return `
      <button
        class="stage-card ${index === selectedLevelIndex ? "selected" : ""} ${unlocked ? "" : "locked"} ${best?.perfect ? "perfect" : ""}"
        data-stage="${index}"
        ${unlocked ? "" : "disabled"}
      >
        <span>${unlocked ? `${level.number}F${best?.perfect ? " ✓" : ""}` : "LOCK"}</span>
        <div><b>${level.title}</b><small>${best ? `BEST ${best.rank} / ${best.score.toLocaleString()}` : level.kicker}</small></div>
        <i>${best?.perfect ? "PERFECT" : index === selectedLevelIndex ? "●" : "○"}</i>
      </button>
    `;
  }).join("");

  stageList.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = Number(button.dataset.stage);
      if (!Number.isFinite(nextIndex) || nextIndex === selectedLevelIndex) return;
      selectedLevelIndex = nextIndex;
      renderLobby();
      prepareGame();
    });
  });

  const difficultySelect = requiredElement<HTMLElement>("difficulty-select");
  difficultySelect.innerHTML = DIFFICULTIES.map((option) => {
    const selected = option.id === selectedDifficultyId;
    const cardboardLabel = option.cardboardUses === null
      ? "段ボール無制限"
      : `段ボール${option.cardboardUses}回`;
    return `
      <button
        class="difficulty-card ${selected ? "selected" : ""}"
        data-difficulty="${option.id}"
        style="--difficulty:${option.color}"
      >
        <span>${option.englishName}</span>
        <div><b>${option.name}</b><small>${option.description}</small></div>
        <i>${option.requiresAllItems ? "全回収必須" : "回収任意"} · ${cardboardLabel} · SCORE ×${option.scoreMultiplier.toFixed(2)}</i>
      </button>
    `;
  }).join("");

  difficultySelect.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.difficulty as DifficultyId;
      if (id === selectedDifficultyId) return;
      selectedDifficultyId = id;
      profile = { ...profile, selectedDifficulty: id };
      saveProfile(profile);
      renderLobby();
      prepareGame();
    });
  });
}

function prepareGame() {
  game?.dispose();
  gameLoaded = false;
  startButton.disabled = true;
  startButton.innerHTML = "<span>キャラクター読み込み中…</span><b>…</b>";
  const level = LEVELS[selectedLevelIndex];
  const difficulty = getDifficulty(selectedDifficultyId);
  updateStaticHud(level);
  renderLegend(level);
  game = new Game(
    sceneHost,
    radarCanvas,
    level,
    dailyMutator,
    difficulty,
    {
      onLoaded: () => {
        gameLoaded = true;
        startButton.disabled = false;
        startButton.innerHTML = `<span>${level.number}F / ${difficulty.name}で退社</span><b>→</b>`;
      },
      onState: handleGameState,
      onDetection: updateDetection,
      onHud: updateHud,
      onToast: showToast,
      onSound: (kind) => audio.play(kind),
    },
  );
}

function updateStaticHud(level: LevelDefinition) {
  const difficulty = getDifficulty(selectedDifficultyId);
  const requirement = difficulty.requiresAllItems ? "必須" : "任意";
  requiredElement<HTMLElement>("level-chip").textContent =
    `${level.number}F ${level.title} · ${difficulty.name}`;
  requiredElement<HTMLElement>("level-kicker").textContent = level.kicker;
  requiredElement<HTMLElement>("mission-name").textContent =
    `${requirement}：${level.objectiveText}`;
  requiredElement<HTMLElement>("objective-rule").textContent = `${requirement}確認`;
  requiredElement<HTMLElement>("loot-rule").textContent = `${requirement}回収`;
  requiredElement<HTMLElement>("radar-key").innerHTML =
    `<i class="objective-dot"></i>${requirement}確認 <i class="loot-dot"></i>${requirement}回収`;
}

function renderLegend(level: LevelDefinition) {
  const unique = new Map<string, { label: string; color: string }>();
  unique.set(SOBAYA.label, { label: `${SOBAYA.label}（自分）`, color: SOBAYA.radarColor });
  for (const enemy of level.enemies) {
    unique.set(enemy.meta.label, {
      label: enemy.meta.label,
      color: enemy.meta.radarColor,
    });
  }
  requiredElement<HTMLElement>("legend").innerHTML = [...unique.values()]
    .map((item) => `<span><i style="background:${item.color}"></i>${item.label}</span>`)
    .join("");
}

function handleGameState(state: GameState, summary?: RunSummary) {
  if (state === "playing") {
    pauseOverlay.classList.add("hidden");
  } else if (state === "paused") {
    pauseOverlay.classList.remove("hidden");
  } else if (state === "caught") {
    document.body.classList.remove("in-game");
    requiredElement<HTMLElement>("caught-message").textContent = lastSeer
      ? lastSeer.caughtText
      : "仲間との立ち話が始まった！ 少し休んで、もう一度気持ちよく帰ろう。";
    caughtOverlay.classList.remove("hidden");
  } else if (state === "won" && summary) {
    document.body.classList.remove("in-game");
    profile = recordClear(
      profile,
      summary,
      LEVELS[selectedLevelIndex].number,
      LEVELS.length,
    );
    saveProfile(profile);
    renderLobby();
    showResult(summary);
  }
}

function showResult(summary: RunSummary) {
  const difficulty = getDifficulty(summary.difficultyId);
  requiredElement<HTMLElement>("result-mode").textContent =
    `${difficulty.englishName} EXIT COMPLETE · SCORE ×${difficulty.scoreMultiplier.toFixed(2)}`;
  requiredElement<HTMLElement>("result-perfect").classList.toggle("hidden", !summary.perfect);
  const rank = requiredElement<HTMLElement>("result-rank");
  rank.textContent = summary.rank;
  rank.dataset.rank = summary.rank;
  requiredElement<HTMLElement>("result-message").textContent = summary.perfect
    ? "全アイテム・定時最速・完全未発見を達成。フロアPERFECTです！"
    : summary.secretExit
      ? "全アイテムを回収し、人型の壁穴から鮮やかに退社しました！"
      : difficulty.requiresAllItems
        ? `${difficulty.name}で全アイテムを回収し、エレベーターから退社成功！`
        : "残業モードで退社成功。アイテム回収を増やすと、さらに高いスコアを狙えます。";
  const collected = summary.objectives + summary.loot;
  const totalItems = summary.totalObjectives + summary.totalLoot;
  requiredElement<HTMLElement>("result-stats").innerHTML = `
    <span><small>TIME</small><b>${formatTime(summary.elapsed)}</b></span>
    <span><small>SCORE</small><b>${summary.score.toLocaleString()}</b></span>
    <span><small>ITEMS</small><b>${collected} / ${totalItems}</b></span>
    <span><small>SEEN</small><b>${summary.sightings}</b></span>
  `;
  requiredElement<HTMLElement>("bonus-list").innerHTML = summary.bonuses.length > 0
    ? `<span>+ ${difficulty.name} ×${difficulty.scoreMultiplier.toFixed(2)}</span>${summary.bonuses.map((bonus) => `<span>+ ${bonus}</span>`).join("")}`
    : `<span>+ ${difficulty.name} ×${difficulty.scoreMultiplier.toFixed(2)}</span>`;
  const nextButton = requiredElement<HTMLButtonElement>("next-btn");
  const hasNext = selectedLevelIndex < LEVELS.length - 1;
  nextButton.style.display = hasNext ? "" : "none";
  resultOverlay.classList.remove("hidden");
}

function updateDetection(
  level: number,
  seer: CharacterMeta | null,
  activelySeen: boolean,
) {
  const percentage = Math.round(level * 100);
  detectFill.style.width = `${percentage}%`;
  detectPct.textContent = `${percentage}%`;
  const hue = 142 - level * 142;
  detectFill.style.background = `hsl(${hue}, 92%, 58%)`;
  if (seer) {
    lastSeer = seer;
    banner.textContent = seer.spotText;
    banner.classList.add("show");
    banner.classList.toggle("lingering", !activelySeen);
  } else {
    banner.classList.remove("show", "lingering");
  }
}

function updateHud(snapshot: HudSnapshot) {
  requiredElement<HTMLElement>("timer").textContent = formatTime(snapshot.elapsed);
  requiredElement<HTMLElement>("objective-count").textContent =
    `${snapshot.objectiveDone} / ${snapshot.objectiveTotal}`;
  requiredElement<HTMLElement>("loot-count").textContent =
    `${snapshot.loot} / ${snapshot.totalLoot}`;
  const noiseValue = requiredElement<HTMLElement>("noise-value");
  noiseValue.textContent = snapshot.noise;
  noiseValue.dataset.noise = snapshot.noise;
  requiredElement<HTMLElement>("ai-state").textContent = snapshot.hidden
    ? snapshot.safeToReveal
      ? "解除チャンス：全員の警戒なし"
      : "待機：頭上ゲージが消えるまで"
    : snapshot.aiState;
  gadgetActions.innerHTML = snapshot.gadgets.map((gadget, index) => `
    <button
      class="gadget-action ${gadget.active ? "active" : ""} ${gadget.active && snapshot.safeToReveal ? "reveal-ready" : ""}"
      data-slot="${index}"
      style="--gadget:${gadget.color}"
      ${gadget.charges <= 0 && !gadget.active ? "disabled" : ""}
      aria-label="${gadget.name}"
    >
      <kbd>${gadget.key}</kbd>
      <span>
        <b>${gadget.active ? "段ボール解除" : gadget.shortName}</b>
        <small>${
          gadget.active
            ? snapshot.safeToReveal ? "解除チャンス" : "警戒ゲージ待ち"
            : gadget.unlimited ? "使用 無制限" : `残り ${gadget.charges}回`
        }</small>
      </span>
    </button>
  `).join("");
  gadgetActions.querySelectorAll<HTMLButtonElement>("[data-slot]").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      game?.useGadget();
    });
  });
}

function showToast(message: string, tone: "info" | "warning" | "success" = "info") {
  if (toastTimer) window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function beginGame() {
  if (!game || !gameLoaded) return;
  audio.unlock();
  lastSeer = null;
  lobbyOverlay.classList.add("hidden");
  resultOverlay.classList.add("hidden");
  caughtOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  banner.classList.remove("show");
  document.body.classList.add("in-game");
  game.start();
}

function returnToLobby(selectNext = false) {
  if (selectNext && selectedLevelIndex < LEVELS.length - 1) selectedLevelIndex += 1;
  document.body.classList.remove("in-game");
  resultOverlay.classList.add("hidden");
  caughtOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  lobbyOverlay.classList.remove("hidden");
  renderLobby();
  prepareGame();
}

startButton.addEventListener("click", beginGame);
requiredElement<HTMLButtonElement>("retry-btn").addEventListener("click", beginGame);
requiredElement<HTMLButtonElement>("caught-retry-btn").addEventListener("click", beginGame);
requiredElement<HTMLButtonElement>("result-lobby-btn").addEventListener("click", () => returnToLobby());
requiredElement<HTMLButtonElement>("caught-lobby-btn").addEventListener("click", () => returnToLobby());
requiredElement<HTMLButtonElement>("pause-lobby-btn").addEventListener("click", () => returnToLobby());
requiredElement<HTMLButtonElement>("next-btn").addEventListener("click", () => returnToLobby(true));
requiredElement<HTMLButtonElement>("resume-btn").addEventListener("click", () => game?.togglePause());
requiredElement<HTMLButtonElement>("pause-btn").addEventListener("click", () => game?.togglePause());
requiredElement<HTMLButtonElement>("sound-btn").addEventListener("click", (event) => {
  audio.setEnabled(!audio.isEnabled);
  (event.currentTarget as HTMLButtonElement).textContent = audio.isEnabled ? "SOUND ON" : "SOUND OFF";
  if (audio.isEnabled) audio.unlock();
});

const keys = new Set<string>();
function updateKeyboardInput() {
  let x = 0;
  let z = 0;
  if (keys.has("arrowup") || keys.has("w")) z -= 1;
  if (keys.has("arrowdown") || keys.has("s")) z += 1;
  if (keys.has("arrowleft") || keys.has("a")) x -= 1;
  if (keys.has("arrowright") || keys.has("d")) x += 1;
  if (!usingJoystick) game?.setInput(x, z);
  game?.setSneaking(keys.has("shift"));
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
  if (!event.repeat && (key === "p" || key === "escape")) game?.togglePause();
  if (!event.repeat && key === GADGETS.cardboard.key.toLowerCase()) game?.useGadget();
  keys.add(key);
  updateKeyboardInput();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
  updateKeyboardInput();
});

let usingJoystick = false;
let joystickPointer: number | null = null;
const JOYSTICK_RADIUS = 48;

if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  document.body.classList.add("touch");
}

function moveJoystick(clientX: number, clientY: number) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let deltaX = clientX - centerX;
  let deltaY = clientY - centerY;
  const length = Math.hypot(deltaX, deltaY);
  if (length > JOYSTICK_RADIUS) {
    deltaX = (deltaX / length) * JOYSTICK_RADIUS;
    deltaY = (deltaY / length) * JOYSTICK_RADIUS;
  }
  nub.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  game?.setInput(deltaX / JOYSTICK_RADIUS, deltaY / JOYSTICK_RADIUS);
}

joystick.addEventListener("pointerdown", (event) => {
  usingJoystick = true;
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  moveJoystick(event.clientX, event.clientY);
});
joystick.addEventListener("pointermove", (event) => {
  if (joystickPointer === event.pointerId) moveJoystick(event.clientX, event.clientY);
});

function endJoystick() {
  usingJoystick = false;
  joystickPointer = null;
  nub.style.transform = "translate(0,0)";
  game?.setInput(0, 0);
}

joystick.addEventListener("pointerup", endJoystick);
joystick.addEventListener("pointercancel", endJoystick);
sneakButton.addEventListener("pointerdown", () => {
  game?.setSneaking(true);
  sneakButton.classList.add("active");
});

function releaseSneak() {
  game?.setSneaking(false);
  sneakButton.classList.remove("active");
}

sneakButton.addEventListener("pointerup", releaseSneak);
sneakButton.addEventListener("pointercancel", releaseSneak);

renderLobby();
prepareGame();
