import { GameAudio } from "./audio.js";
import { playCutscene } from "./cutscene.js";
import { LEVELS, getLevel } from "./levels.js";
import {
  applySlide,
  createInitialState,
  remainingCollectibles,
  simulateSlide,
} from "./rules.js";
import { renderFloorMap } from "./minimap.js";
import { PuzzleScene } from "./scene.js";
import type {
  Direction,
  LevelDefinition,
  PuzzleState,
  SaveData,
} from "./types.js";

type Phase = "title" | "select" | "playing" | "complete" | "ending";

const STORAGE_KEY = "madogiwa-ice-regulation-v1";
const DIRECTION_KEYS: Readonly<Record<string, Direction | undefined>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

function defaultSave(): SaveData {
  return {
    unlockedLevel: 1,
    bestMoves: {},
  };
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      unlockedLevel: Math.max(1, Math.min(LEVELS.length, parsed.unlockedLevel ?? 1)),
      bestMoves: parsed.bestMoves ?? {},
    };
  } catch {
    return defaultSave();
  }
}

function cloneState(state: PuzzleState): PuzzleState {
  return {
    position: { ...state.position },
    collected: [...state.collected],
    moves: state.moves,
  };
}

export class IceRegulationGame {
  private phase: Phase = "title";
  private save = loadSave();
  private levelIndex = 0;
  private level: LevelDefinition = getLevel(0);
  private state: PuzzleState = createInitialState(this.level);
  private history: PuzzleState[] = [];
  private scene?: PuzzleScene;
  private busy = false;
  private toastTimer?: number;
  private pointerStart?: { x: number; y: number };
  private readonly audio = new GameAudio();

  constructor(private readonly root: HTMLElement) {
    window.addEventListener("keydown", this.handleKeyDown, { passive: false });
    this.renderTitle();
  }

  private renderTitle(): void {
    this.phase = "title";
    this.disposeScene();
    this.root.innerHTML = `
      <main class="title-screen">
        <div class="title-aurora" aria-hidden="true"></div>
        <section class="title-panel">
          <p class="eyebrow">窓際族物語 2.5D ICE PUZZLE</p>
          <h1>窓際族０</h1>
          <p class="title-copy">
            やめたろうの冷却最適化プログラムがまさかの暴走。
            氷漬けのオフィスを一直線に滑り、重要資料とビールを全部回収して脱出しよう。
          </p>
          <div class="rule-chips" aria-label="ゲームの基本ルール">
            <span>↕ 4方向だけ</span>
            <span>⛸ 障害物まで止まれない</span>
            <span>📁＋🍺 全回収で出口解放</span>
            <span>🗺 約10マスの追従視点</span>
          </div>
          <div class="title-actions">
            <button class="primary-button" id="start-game" type="button">レギュレーション開始</button>
            <button class="secondary-button" id="open-levels" type="button">ステージを選ぶ</button>
          </div>
          <p class="title-note">PC: 矢印 / WASD ・ スマホ: 十字ボタン / スワイプ</p>
        </section>
        <aside class="incident-card">
          <div class="incident-code" aria-hidden="true">
            <span>COOLING_LOOP</span>
            <strong>∞</strong>
            <i>FROZEN</i>
          </div>
          <blockquote>
            「どうせワイのプログラムなんてー！」
            <cite>— 無職やめたろう</cite>
          </blockquote>
          <p>誰も怒らない。みんなで回収して、最後はキンキンのビールで乾杯。</p>
        </aside>
      </main>
    `;
    this.root.querySelector("#start-game")?.addEventListener("click", () => {
      void this.startCampaign();
    });
    this.root.querySelector("#open-levels")?.addEventListener("click", () => {
      this.renderLevelSelect();
    });
  }

  private async startCampaign(): Promise<void> {
    const button = this.root.querySelector<HTMLButtonElement>("#start-game");
    if (button) {
      button.disabled = true;
      button.textContent = "読み込み中…";
    }
    await playCutscene(this.root, { src: "videos/opening.mp4" });
    this.startLevel(0);
  }

  private renderLevelSelect(): void {
    this.phase = "select";
    this.disposeScene();
    const cards = LEVELS.map((level, index) => {
      const unlocked = index < this.save.unlockedLevel;
      const best = this.save.bestMoves[level.id];
      return `
        <button
          class="level-card ${unlocked ? "" : "locked"}"
          type="button"
          data-level="${index}"
          ${unlocked ? "" : "disabled"}
        >
          <span class="level-number">REG ${String(level.number).padStart(2, "0")}</span>
          <strong>${unlocked ? level.name : "未解放"}</strong>
          <small>${unlocked
            ? `${level.subtitle} ・ ${level.grid[0].length}×${level.grid.length}`
            : "前のレギュレーションをクリア"}</small>
          <em>${best ? `BEST ${best}手` : `PAR ${level.parMoves}手`}</em>
        </button>
      `;
    }).join("");
    this.root.innerHTML = `
      <main class="select-screen">
        <header class="select-header">
          <div>
            <p class="eyebrow">SELECT REGULATION</p>
            <h1>ステージ選択</h1>
          </div>
          <button class="icon-button" id="back-title" type="button">タイトルへ</button>
        </header>
        <section class="level-grid">${cards}</section>
      </main>
    `;
    this.root.querySelector("#back-title")?.addEventListener("click", () => this.renderTitle());
    this.root.querySelectorAll<HTMLButtonElement>("[data-level]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.level);
        if (Number.isInteger(index)) this.startLevel(index);
      });
    });
  }

  private startLevel(index: number): void {
    if (index < 0 || index >= this.save.unlockedLevel || index >= LEVELS.length) return;
    this.disposeScene();
    this.phase = "playing";
    this.levelIndex = index;
    this.level = getLevel(index);
    this.state = createInitialState(this.level);
    this.history = [];
    this.busy = false;
    this.renderGameShell();
    const sceneHost = this.root.querySelector<HTMLElement>("#scene-host");
    if (!sceneHost) throw new Error("#scene-host is missing");
    this.scene = new PuzzleScene(sceneHost, this.level, this.state);
    this.bindGameControls(sceneHost);
    this.updateHud();
    this.showToast(this.level.intro, 3200);
  }

  private renderGameShell(): void {
    this.root.innerHTML = `
      <main class="game-screen">
        <header class="game-header">
          <button class="brand-button" id="to-levels" type="button" aria-label="ステージ選択へ">
            <span>窓際族</span>
            <strong>ICE REG.</strong>
          </button>
          <div class="stage-heading">
            <small>REG ${String(this.level.number).padStart(2, "0")}</small>
            <h1>${this.level.name}</h1>
          </div>
          <div class="move-counter">
            <small>MOVE / PAR</small>
            <strong><span id="move-count">0</span> / ${this.level.parMoves}</strong>
          </div>
        </header>

        <div class="game-layout">
          <section class="board-card" aria-label="ゲーム盤面">
            <div id="scene-host" class="scene-host"></div>
            <div class="objective-pill" id="objective-pill"></div>
            <div class="toast" id="toast" role="status" aria-live="polite"></div>
            <div class="axis-guide" aria-hidden="true">
              <span>↑</span><span>画面の上下左右＝盤面の4方向</span>
            </div>
          </section>

          <aside class="control-card">
            <section class="mission-box">
              <p class="eyebrow">MISSION · ${this.level.grid[0].length}×${this.level.grid.length}</p>
              <h2>${this.level.subtitle}</h2>
              <div class="cargo-list">
                <div><span>📁 重要資料</span><strong id="document-count">0 / 0</strong></div>
                <div><span>🍺 ビール</span><strong id="beer-count">0 / 0</strong></div>
                <div><span>🏮 出口</span><strong id="exit-state">LOCKED</strong></div>
              </div>
              <div class="mission-map">
                <div class="mission-map-header">
                  <strong>FROZEN OFFICE MAP</strong><span>白枠＝視界</span>
                </div>
                <canvas id="floor-map" role="img"></canvas>
                <div class="map-legend" aria-hidden="true">
                  <span><i class="legend-player"></i>現在地</span>
                  <span><i class="legend-item"></i>回収物</span>
                  <span><i class="legend-exit"></i>出口</span>
                </div>
              </div>
            </section>

            <section class="dpad-section" aria-label="4方向操作">
              <p>一度押すと、ぶつかるまで止まれない</p>
              <div class="dpad">
                <button type="button" data-dir="up" aria-label="上へ滑る">▲</button>
                <button type="button" data-dir="left" aria-label="左へ滑る">◀</button>
                <div class="dpad-core" aria-hidden="true">ICE</div>
                <button type="button" data-dir="right" aria-label="右へ滑る">▶</button>
                <button type="button" data-dir="down" aria-label="下へ滑る">▼</button>
              </div>
            </section>

            <div class="utility-actions">
              <button type="button" id="undo-move">↶ 1手戻す</button>
              <button type="button" id="restart-level">↻ やり直す</button>
            </div>
            <p class="keyboard-note">矢印 / WASD ・ Zで戻す ・ Rで再開</p>
          </aside>
        </div>
      </main>
    `;
  }

  private bindGameControls(sceneHost: HTMLElement): void {
    this.root.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        const direction = button.dataset.dir as Direction;
        void this.move(direction);
      });
    });
    this.root.querySelector("#undo-move")?.addEventListener("click", () => this.undo());
    this.root.querySelector("#restart-level")?.addEventListener("click", () => this.restart());
    this.root.querySelector("#to-levels")?.addEventListener("click", () => this.renderLevelSelect());

    sceneHost.addEventListener("pointerdown", (event) => {
      this.pointerStart = { x: event.clientX, y: event.clientY };
    });
    sceneHost.addEventListener("pointerup", (event) => {
      if (!this.pointerStart) return;
      const dx = event.clientX - this.pointerStart.x;
      const dy = event.clientY - this.pointerStart.y;
      this.pointerStart = undefined;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 32) return;
      const direction: Direction = Math.abs(dx) > Math.abs(dy)
        ? dx > 0 ? "right" : "left"
        : dy > 0 ? "down" : "up";
      void this.move(direction);
    });
    sceneHost.addEventListener("pointercancel", () => {
      this.pointerStart = undefined;
    });
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.phase !== "playing" || event.repeat) return;
    const direction = DIRECTION_KEYS[event.code];
    if (direction) {
      event.preventDefault();
      void this.move(direction);
      return;
    }
    if (event.code === "KeyZ" || event.code === "Backspace") {
      event.preventDefault();
      this.undo();
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      this.restart();
    }
  };

  private async move(direction: Direction): Promise<void> {
    if (this.phase !== "playing" || this.busy || !this.scene) return;
    const result = simulateSlide(this.level, this.state, direction);

    if (!result.moved) {
      this.busy = true;
      this.audio.bump();
      await this.scene.bump(direction);
      const helper = result.hitHelper
        ? this.level.helpers.find((item) => item.characterId === result.hitHelper)
        : undefined;
      this.showToast(helper?.quote ?? "そこでは止まれない。別の方向を試そう！", 1900);
      this.busy = false;
      return;
    }

    this.busy = true;
    this.history.push(cloneState(this.state));
    this.audio.slide();
    await this.scene.slide(result.path, direction);
    this.state = applySlide(this.state, result);

    if (result.collectedIds.length > 0) {
      const items = result.collectedIds
        .map((id) => this.level.collectibles.find((entry) => entry.id === id))
        .filter((item) => item !== undefined);
      result.collectedIds.forEach((id) => this.scene?.collect(id));
      items.forEach((item) => this.audio.collect(item.kind));
      const message = items.length === 1
        ? `${items[0].label}を通過回収！ そのまま滑走。`
        : `${items.length}個まとめて通過回収！ そのまま滑走。`;
      this.showToast(message, 2100);
    } else if (result.hitLockedExit) {
      this.audio.bump();
      this.showToast("出口はまだLOCKED。資料とビールを全部回収しよう。", 2300);
    }

    this.scene.setExitUnlocked(remainingCollectibles(this.level, this.state) === 0);
    this.updateHud();

    if (result.reachedExit) {
      this.completeLevel();
      return;
    }
    this.busy = false;
  }

  private undo(): void {
    if (this.phase !== "playing" || this.busy || !this.scene) return;
    const previous = this.history.pop();
    if (!previous) {
      this.showToast("まだ戻せる手がありません。", 1500);
      return;
    }
    this.state = previous;
    this.scene.setState(this.state);
    this.audio.undo();
    this.updateHud();
    this.showToast("1手戻しました。", 1200);
  }

  private restart(): void {
    if (this.phase !== "playing" || this.busy || !this.scene) return;
    this.state = createInitialState(this.level);
    this.history = [];
    this.scene.setState(this.state);
    this.audio.undo();
    this.updateHud();
    this.showToast("レギュレーションを最初から再開！", 1500);
  }

  private completeLevel(): void {
    this.phase = "complete";
    this.busy = true;
    this.audio.clear();
    const previousBest = this.save.bestMoves[this.level.id];
    if (!previousBest || this.state.moves < previousBest) {
      this.save.bestMoves[this.level.id] = this.state.moves;
    }
    this.save.unlockedLevel = Math.max(
      this.save.unlockedLevel,
      Math.min(LEVELS.length, this.levelIndex + 2),
    );
    this.persistSave();
    window.setTimeout(() => this.showClearModal(), 420);
  }

  private showClearModal(): void {
    const isFinal = this.levelIndex === LEVELS.length - 1;
    const parClear = this.state.moves <= this.level.parMoves;
    const modal = document.createElement("div");
    modal.className = "result-backdrop";
    modal.innerHTML = `
      <section class="result-modal">
        <p class="result-kicker">${parClear ? "REGULATION PERFECT" : "REGULATION CLEAR"}</p>
        <h2>${this.level.clearText}</h2>
        <div class="result-score">
          <span>今回</span><strong>${this.state.moves}手</strong>
          <span>PAR</span><strong>${this.level.parMoves}手</strong>
        </div>
        <p>
          ${parClear
            ? "氷上ルートを完全把握。おかやまんも大変驚いております。"
            : "回収完了！ 次はもっと短いルートにも挑戦できます。"}
        </p>
        <div class="result-actions">
          <button class="primary-button" id="result-next" type="button">
            ${isFinal ? "エンディングへ" : "次のレギュレーション"}
          </button>
          <button class="secondary-button" id="result-select" type="button">ステージ選択</button>
        </div>
      </section>
    `;
    this.root.appendChild(modal);
    modal.querySelector("#result-next")?.addEventListener("click", () => {
      if (isFinal) {
        void this.playEnding();
      } else {
        this.startLevel(this.levelIndex + 1);
      }
    });
    modal.querySelector("#result-select")?.addEventListener("click", () => {
      this.renderLevelSelect();
    });
  }

  private async playEnding(): Promise<void> {
    await playCutscene(this.root, { src: "videos/ending.mp4" });
    this.renderEnding();
  }

  private renderEnding(): void {
    this.phase = "ending";
    this.disposeScene();
    this.root.innerHTML = `
      <main class="ending-screen">
        <section class="ending-panel">
          <p class="eyebrow">ALL REGULATIONS COMPLETE</p>
          <div class="ending-lantern" aria-hidden="true">🏮</div>
          <h1>オフィス復旧！<br>ビールはキンキン！</h1>
          <p>
            やめたろうは冷却ループのバグを修正。重要資料は全部無事、
            ビールはちょうど飲み頃。誰も怒らず、立ち飲み処で笑顔の乾杯となりました。
          </p>
          <blockquote>
            そば屋「冷えたままなので、メリットでもあります！」
          </blockquote>
          <div class="title-actions">
            <button class="primary-button" id="ending-levels" type="button">ステージ選択</button>
            <button class="secondary-button" id="ending-title" type="button">タイトルへ</button>
          </div>
        </section>
      </main>
    `;
    this.root.querySelector("#ending-levels")?.addEventListener("click", () => {
      this.renderLevelSelect();
    });
    this.root.querySelector("#ending-title")?.addEventListener("click", () => {
      this.renderTitle();
    });
  }

  private updateHud(): void {
    const documents = this.level.collectibles.filter((item) => item.kind === "document");
    const beers = this.level.collectibles.filter((item) => item.kind === "beer");
    const collected = new Set(this.state.collected);
    const collectedDocuments = documents.filter((item) => collected.has(item.id)).length;
    const collectedBeers = beers.filter((item) => collected.has(item.id)).length;
    const remaining = remainingCollectibles(this.level, this.state);
    const moveCount = this.root.querySelector("#move-count");
    const documentCount = this.root.querySelector("#document-count");
    const beerCount = this.root.querySelector("#beer-count");
    const exitState = this.root.querySelector("#exit-state");
    const objective = this.root.querySelector("#objective-pill");
    const undo = this.root.querySelector<HTMLButtonElement>("#undo-move");
    const floorMap = this.root.querySelector<HTMLCanvasElement>("#floor-map");

    if (moveCount) moveCount.textContent = String(this.state.moves);
    if (documentCount) documentCount.textContent = `${collectedDocuments} / ${documents.length}`;
    if (beerCount) beerCount.textContent = `${collectedBeers} / ${beers.length}`;
    if (exitState) {
      exitState.textContent = remaining === 0 ? "OPEN" : "LOCKED";
      exitState.classList.toggle("open", remaining === 0);
    }
    if (objective) {
      objective.textContent = remaining === 0
        ? "🏮 出口解放！ 赤提灯へ向かおう"
        : `回収対象 あと ${remaining}個`;
      objective.classList.toggle("ready", remaining === 0);
    }
    if (undo) undo.disabled = this.history.length === 0;
    if (floorMap) renderFloorMap(floorMap, this.level, this.state);
  }

  private showToast(message: string, duration: number): void {
    const toast = this.root.querySelector<HTMLElement>("#toast");
    if (!toast) return;
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    this.toastTimer = window.setTimeout(() => {
      toast.classList.remove("visible");
    }, duration);
  }

  private persistSave(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.save));
    } catch {
      // The game remains fully playable when storage is unavailable.
    }
  }

  private disposeScene(): void {
    this.scene?.dispose();
    this.scene = undefined;
    this.busy = false;
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
  }
}
