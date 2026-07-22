import { sobayaAvatar } from "./avatar";
import { ENDINGS, MAX_AFFECTION, SCENES } from "./scenes";
import type { Choice, Ending, Mood, Scene } from "./types";

type Phase = "title" | "lines" | "choices" | "response" | "ending";

/** 好感度ノベルゲームの状態と描画をまとめて管理する。 */
export class Game {
  private root: HTMLElement;
  private affection = 0;
  private sceneIndex = 0;
  private lineIndex = 0;
  private phase: Phase = "title";
  private currentMood: Mood = "neutral";
  private lastResponse = "";
  private lastGain = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.render();
  }

  private get scene(): Scene {
    return SCENES[this.sceneIndex];
  }

  private reset(): void {
    this.affection = 0;
    this.sceneIndex = 0;
    this.lineIndex = 0;
    this.currentMood = "neutral";
    this.lastResponse = "";
    this.lastGain = 0;
    this.phase = "lines";
    this.currentMood = this.scene.mood;
    this.render();
  }

  private advanceLine(): void {
    if (this.lineIndex < this.scene.lines.length - 1) {
      this.lineIndex += 1;
    } else {
      this.phase = "choices";
      this.currentMood = this.scene.mood;
    }
    this.render();
  }

  private pick(choice: Choice): void {
    this.affection = Math.min(MAX_AFFECTION, this.affection + choice.points);
    this.lastGain = choice.points;
    this.lastResponse = choice.response;
    this.currentMood = choice.mood;
    this.phase = "response";
    this.render();
  }

  private afterResponse(): void {
    if (this.sceneIndex < SCENES.length - 1) {
      this.sceneIndex += 1;
      this.lineIndex = 0;
      this.phase = "lines";
      this.currentMood = this.scene.mood;
    } else {
      this.phase = "ending";
    }
    this.render();
  }

  private resolveEnding(): Ending {
    return ENDINGS.find((e) => this.affection >= e.min) ?? ENDINGS[ENDINGS.length - 1];
  }

  private gaugePercent(): number {
    return Math.round((this.affection / MAX_AFFECTION) * 100);
  }

  private hud(): string {
    const pct = this.gaugePercent();
    const isMax = this.affection >= MAX_AFFECTION;
    const step = Math.min(this.sceneIndex + 1, SCENES.length);
    return `
      <div class="hud">
        <div class="hud-top">
          <span class="hud-scene">${this.phase === "ending" ? "エンディング" : `選択 ${step} / ${SCENES.length}`}</span>
          <span class="hud-love">好感度 ${pct}%${isMax ? " 💗MAX" : ""}</span>
        </div>
        <div class="gauge ${isMax ? "gauge--max" : ""}">
          <div class="gauge-fill" style="width:${pct}%"></div>
          <div class="gauge-heart" style="left:calc(${pct}% - 12px)">${isMax ? "💗" : "❤"}</div>
        </div>
      </div>`;
  }

  private render(): void {
    if (this.phase === "title") {
      this.root.innerHTML = this.titleView();
      this.bindTitle();
      return;
    }
    if (this.phase === "ending") {
      this.root.innerHTML = this.endingView();
      this.bindEnding();
      return;
    }

    const scene = this.scene;
    let body = "";

    if (this.phase === "lines") {
      const line = scene.lines[this.lineIndex];
      body = `
        <div class="dialogue" data-action="next">
          <p class="line">${line}</p>
          <span class="tap-hint">▶ タップして進む</span>
        </div>`;
    } else if (this.phase === "choices") {
      const buttons = scene.choices
        .map((c, i) => `<button class="choice" data-choice="${i}">${c.text}</button>`)
        .join("");
      body = `
        <div class="prompt">どうする？</div>
        <div class="choices">${buttons}</div>`;
    } else if (this.phase === "response") {
      body = `
        <div class="dialogue response" data-action="afterResponse">
          <p class="line">${this.lastResponse}</p>
          <p class="gain">好感度 +${this.lastGain}</p>
          <span class="tap-hint">▶ タップして進む</span>
        </div>`;
    }

    this.root.innerHTML = `
      <div class="scene scene--${scene.bg}">
        <div class="place">${scene.place}</div>
        ${this.hud()}
        <div class="stage">
          <div class="avatar mood-${this.currentMood}">${sobayaAvatar(this.currentMood)}</div>
        </div>
        <div class="panel">${body}</div>
      </div>`;
    this.bindScene();
  }

  private bindScene(): void {
    const dialogue = this.root.querySelector<HTMLElement>(".dialogue");
    if (dialogue) {
      const action = dialogue.dataset.action;
      dialogue.addEventListener("click", () => {
        if (action === "next") this.advanceLine();
        else if (action === "afterResponse") this.afterResponse();
      });
    }
    this.root.querySelectorAll<HTMLButtonElement>(".choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.choice);
        this.pick(this.scene.choices[idx]);
      });
    });
  }

  private titleView(): string {
    return `
      <div class="scene scene--morning title-screen">
        <div class="stage">
          <div class="avatar mood-happy">${sobayaAvatar("happy")}</div>
        </div>
        <div class="title-card">
          <p class="title-badge">YABA♡YABA COMICS ADV</p>
          <h1>そば屋は<span>心のヤバイ</span>やつ</h1>
          <p class="title-sub">〜ドキドキ好感度アドベンチャー〜</p>
          <p class="title-lead">不器用で無口なそば屋さんのギャップに恋してしまいました。<br>7つの選択で好感度ゲージを満タンにして、両想いを目指そう。</p>
          <button class="start-btn" data-start>▶ はじめる</button>
        </div>
      </div>`;
  }

  private bindTitle(): void {
    this.root.querySelector<HTMLButtonElement>("[data-start]")?.addEventListener("click", () => this.reset());
  }

  private endingView(): string {
    const ending = this.resolveEnding();
    const pct = this.gaugePercent();
    const lines = ending.lines.map((l) => `<p class="line">${l}</p>`).join("");
    return `
      <div class="scene scene--confession ending-screen ${ending.clear ? "ending--clear" : ""}">
        ${ending.clear ? '<div class="confetti">🎉🍺💗🎉🍺💗🎉🍺💗</div>' : ""}
        <div class="stage">
          <div class="avatar mood-happy">${sobayaAvatar("happy")}</div>
        </div>
        <div class="ending-card">
          <p class="ending-love">最終好感度 ${pct}%</p>
          <h2>${ending.title}</h2>
          <div class="ending-lines">${lines}</div>
          <button class="start-btn" data-restart>もう一度あそぶ</button>
        </div>
      </div>`;
  }

  private bindEnding(): void {
    this.root.querySelector<HTMLButtonElement>("[data-restart]")?.addEventListener("click", () => {
      this.phase = "title";
      this.render();
    });
  }
}
