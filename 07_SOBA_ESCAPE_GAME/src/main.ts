import "./style.css";
import { Game, type GameState } from "./game";
import { ENEMIES } from "./level";
import { SOBAYA } from "./characters";

const app = document.getElementById("app")!;

const legendItems = [
  { label: SOBAYA.label + "（自分）", color: SOBAYA.radarColor },
  ...ENEMIES.map((e) => ({ label: e.meta.label, color: e.meta.radarColor })),
];

app.innerHTML = `
  <div id="scene"></div>

  <div class="radar-panel">
    <div class="radar-title"><span>RADAR / 監視レーダー</span><span class="blip"></span></div>
    <canvas id="radar"></canvas>
    <div class="legend">
      ${legendItems
        .map((i) => `<span><i style="background:${i.color}"></i>${i.label}</span>`)
        .join("")}
    </div>
  </div>

  <div class="hud">
    <div class="detect-label"><span>発見ゲージ</span><span id="detect-pct">0%</span></div>
    <div class="detect-bar"><div class="detect-fill" id="detect-fill"></div></div>
    <div class="banner" id="banner"></div>
  </div>

  <div class="joystick" id="joystick"><div class="nub" id="nub"></div></div>
  <div class="sneak-btn" id="sneak-btn">しのび足</div>

  <div class="overlay" id="overlay-title">
    <h1>そば屋の定時ダッシュ</h1>
    <p>
      定時だ！ そば屋は誰にも見つからずにオフィスから脱出したい。<br />
      福ちゃん・よーたん・とーくん・やめたろうが巡回し、おかやまんの監視スクリーンが出口を見張っている。<br />
      右上のレーダーで<b>緑の視界</b>を読み、死角を縫って<b>右上の脱出口</b>を目指せ。<br />
      視界に入ると発見ゲージが上昇。ゲージが満タンになる前に隠れよう。
    </p>
    <p class="keys">
      移動: <b>WASD</b> / 矢印キー ・ しのび足（低速で見つかりにくい）: <b>Shift</b> ・ スマホはジョイスティック操作
    </p>
    <button class="btn" id="start-btn" disabled>読み込み中…</button>
  </div>

  <div class="overlay win hidden" id="overlay-win">
    <h2>🍜 定時ダッシュ成功！</h2>
    <p id="win-text">誰にも見つからず脱出できた！ 今日も一日おつかれさま。</p>
    <button class="btn" id="win-btn">もう一度</button>
  </div>

  <div class="overlay lose hidden" id="overlay-lose">
    <h2>👀 見つかった…！</h2>
    <p id="lose-text"></p>
    <button class="btn" id="lose-btn">リトライ</button>
  </div>
`;

const sceneHost = document.getElementById("scene") as HTMLElement;
const radarCanvas = document.getElementById("radar") as HTMLCanvasElement;
const detectFill = document.getElementById("detect-fill") as HTMLElement;
const detectPct = document.getElementById("detect-pct") as HTMLElement;
const banner = document.getElementById("banner") as HTMLElement;
const overlayTitle = document.getElementById("overlay-title") as HTMLElement;
const overlayWin = document.getElementById("overlay-win") as HTMLElement;
const overlayLose = document.getElementById("overlay-lose") as HTMLElement;
const loseText = document.getElementById("lose-text") as HTMLElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const winBtn = document.getElementById("win-btn") as HTMLButtonElement;
const loseBtn = document.getElementById("lose-btn") as HTMLButtonElement;

let lastSeer: string | null = null;

const game = new Game(sceneHost, radarCanvas, {
  onLoaded: () => {
    startBtn.disabled = false;
    startBtn.textContent = "脱出スタート";
  },
  onState: (state: GameState) => {
    if (state === "won") {
      overlayWin.classList.remove("hidden");
    } else if (state === "caught") {
      loseText.textContent = lastSeer
        ? `${lastSeer}に見つかってしまった…！ 出直しだ。`
        : "見つかってしまった…！ 出直しだ。";
      overlayLose.classList.remove("hidden");
    }
  },
  onDetection: (level: number, seer: string | null) => {
    const pct = Math.round(level * 100);
    detectFill.style.width = `${pct}%`;
    detectPct.textContent = `${pct}%`;
    // green -> yellow -> red
    const hue = 140 - level * 140;
    detectFill.style.background = `hsl(${hue}, 90%, 55%)`;
    if (seer) {
      lastSeer = seer;
      banner.textContent = `${seer}に見られている！`;
      banner.classList.add("show");
    } else {
      banner.classList.remove("show");
    }
  },
});

function beginGame() {
  overlayTitle.classList.add("hidden");
  overlayWin.classList.add("hidden");
  overlayLose.classList.add("hidden");
  banner.classList.remove("show");
  game.start();
}

startBtn.addEventListener("click", beginGame);
winBtn.addEventListener("click", beginGame);
loseBtn.addEventListener("click", beginGame);

// ---- Keyboard input --------------------------------------------------------
const keys = new Set<string>();
function updateKeyboardInput() {
  let x = 0;
  let z = 0;
  if (keys.has("arrowup") || keys.has("w")) z -= 1;
  if (keys.has("arrowdown") || keys.has("s")) z += 1;
  if (keys.has("arrowleft") || keys.has("a")) x -= 1;
  if (keys.has("arrowright") || keys.has("d")) x += 1;
  if (!usingJoystick) game.setInput(x, z);
  game.setSneaking(keys.has("shift"));
}
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  keys.add(k);
  updateKeyboardInput();
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
  updateKeyboardInput();
});

// ---- Touch joystick --------------------------------------------------------
let usingJoystick = false;
const joystick = document.getElementById("joystick") as HTMLElement;
const nub = document.getElementById("nub") as HTMLElement;
const sneakBtn = document.getElementById("sneak-btn") as HTMLElement;

if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  document.body.classList.add("touch");
}

let joyId: number | null = null;
const JOY_RADIUS = 48;
function handleJoyMove(clientX: number, clientY: number) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const len = Math.hypot(dx, dy);
  if (len > JOY_RADIUS) {
    dx = (dx / len) * JOY_RADIUS;
    dy = (dy / len) * JOY_RADIUS;
  }
  nub.style.transform = `translate(${dx}px, ${dy}px)`;
  game.setInput(dx / JOY_RADIUS, dy / JOY_RADIUS);
}
joystick.addEventListener("pointerdown", (e) => {
  usingJoystick = true;
  joyId = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  handleJoyMove(e.clientX, e.clientY);
});
joystick.addEventListener("pointermove", (e) => {
  if (joyId === e.pointerId) handleJoyMove(e.clientX, e.clientY);
});
function endJoy() {
  usingJoystick = false;
  joyId = null;
  nub.style.transform = "translate(0,0)";
  game.setInput(0, 0);
}
joystick.addEventListener("pointerup", endJoy);
joystick.addEventListener("pointercancel", endJoy);

sneakBtn.addEventListener("pointerdown", () => {
  game.setSneaking(true);
  sneakBtn.classList.add("active");
});
const releaseSneak = () => {
  game.setSneaking(false);
  sneakBtn.classList.remove("active");
};
sneakBtn.addEventListener("pointerup", releaseSneak);
sneakBtn.addEventListener("pointercancel", releaseSneak);
