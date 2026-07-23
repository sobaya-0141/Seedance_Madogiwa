// DOM UI for all screens: lobby, waiting-for-opponent, character select, the
// battle HUD (overlaid on the persistent 3D arena), and the result screen.
//
// UI is intentionally framework-free: non-battle screens are rebuilt from HTML
// strings on each render (cheap), while the arena canvas is a persistent
// element (owned here, handed to the scene) so it is never torn down mid-match.

import type { Action } from "./battle";
import { CHARACTERS, getCharacter } from "./characters";
import { isFirebaseConfigured } from "./firebase";
import type { View } from "./net";
import type { TransportMode } from "./transport";

export type Handlers = {
  onCreate: (mode: TransportMode, name: string) => void;
  onJoin: (mode: TransportMode, code: string, name: string) => void;
  onSelectChar: (id: string) => void;
  onReady: (ready: boolean) => void;
  onAction: (action: Action) => void;
  onRematch: () => void;
  onExit: () => void;
};

const NAME_KEY = "madogiwa-battle:name";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export class UI {
  readonly arena: HTMLElement;
  private screenEl: HTMLElement;
  private hudEl: HTMLElement;
  private submittedTurn = -1;

  constructor(root: HTMLElement, private h: Handlers) {
    root.innerHTML = "";
    root.classList.add("app-root");
    this.arena = document.createElement("div");
    this.arena.className = "arena";
    this.screenEl = document.createElement("div");
    this.screenEl.className = "screen";
    this.hudEl = document.createElement("div");
    this.hudEl.className = "hud";
    root.append(this.arena, this.screenEl, this.hudEl);
  }

  private show(mode: "screen" | "battle"): void {
    const battle = mode === "battle";
    this.arena.style.display = battle ? "block" : "none";
    this.hudEl.style.display = battle ? "block" : "none";
    this.screenEl.style.display = battle ? "none" : "block";
  }

  // ── Lobby (pre-session) ─────────────────────────────────────────────────
  showLobby(error?: string): void {
    this.show("screen");
    this.hudEl.innerHTML = "";
    const savedName = localStorage.getItem(NAME_KEY) ?? "";
    const online = isFirebaseConfigured();
    this.screenEl.innerHTML = `
      <div class="panel lobby">
        <h1 class="title">窓際族バトル</h1>
        <p class="subtitle">〜 立ち飲み処の決闘 〜 オンライン1対1コマンドバトル</p>
        ${error ? `<p class="error">${esc(error)}</p>` : ""}
        <label class="field">
          <span>あなたの名前</span>
          <input id="name" type="text" maxlength="12" placeholder="なまえ" value="${esc(savedName)}" />
        </label>
        <fieldset class="field modes">
          <span>対戦モード</span>
          <label class="radio"><input type="radio" name="mode" value="online" ${online ? "checked" : "disabled"} /> オンライン対戦${online ? "" : "（未設定）"}</label>
          <label class="radio"><input type="radio" name="mode" value="local" ${online ? "" : "checked"} /> ローカル対戦（同じPCの2タブ）</label>
        </fieldset>
        ${online ? "" : `<p class="hint">オンライン対戦は <code>src/firebase.ts</code> に Firebase 設定を貼ると有効になります（手順は README）。今はローカル対戦で動作確認できます。</p>`}
        <div class="row">
          <button id="create" class="btn primary">部屋を作る</button>
        </div>
        <div class="row join-row">
          <input id="code" type="text" maxlength="4" placeholder="部屋コード" class="code-input" />
          <button id="join" class="btn">参加する</button>
        </div>
      </div>`;

    const nameEl = this.screenEl.querySelector<HTMLInputElement>("#name")!;
    const codeEl = this.screenEl.querySelector<HTMLInputElement>("#code")!;
    const getMode = (): TransportMode =>
      (this.screenEl.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value as TransportMode) ?? "local";
    const getName = () => {
      const name = nameEl.value.trim() || "なまえ";
      localStorage.setItem(NAME_KEY, name);
      return name;
    };
    this.screenEl.querySelector("#create")!.addEventListener("click", () => {
      this.h.onCreate(getMode(), getName());
    });
    this.screenEl.querySelector("#join")!.addEventListener("click", () => {
      this.h.onJoin(getMode(), codeEl.value.trim().toUpperCase(), getName());
    });
  }

  // ── Session screens ─────────────────────────────────────────────────────
  renderSession(view: View): void {
    switch (view.screen) {
      case "waiting":
        this.renderWaiting(view);
        break;
      case "select":
        this.renderSelect(view);
        break;
      case "battle":
        this.renderBattle(view);
        break;
      case "finished":
        this.renderFinished(view);
        break;
    }
  }

  private modeBadge(view: View): string {
    return `<span class="badge">${view.mode === "online" ? "オンライン" : "ローカル"}</span>`;
  }

  private renderWaiting(view: View): void {
    this.show("screen");
    this.screenEl.innerHTML = `
      <div class="panel">
        <h2>相手の参加を待っています…</h2>
        <p>この部屋コードを相手に伝えてください${view.mode === "local" ? "（同じPCで別タブを開いて参加）" : ""}。</p>
        <div class="code-display">
          <span class="code-value">${esc(view.code)}</span>
          <button id="copy" class="btn small">コピー</button>
        </div>
        <p class="mode-line">モード: ${this.modeBadge(view)}</p>
        <button id="exit" class="btn ghost">やめる</button>
      </div>`;
    this.screenEl.querySelector("#copy")!.addEventListener("click", (e) => {
      void navigator.clipboard?.writeText(view.code);
      (e.currentTarget as HTMLButtonElement).textContent = "コピー済";
    });
    this.screenEl.querySelector("#exit")!.addEventListener("click", () => this.h.onExit());
  }

  private statBars(charId: string | null): string {
    const c = charId ? getCharacter(charId) : null;
    if (!c) return "";
    const bar = (label: string, val: number, max: number) =>
      `<div class="stat"><span>${label}</span><i style="width:${Math.round((val / max) * 100)}%"></i></div>`;
    return `<div class="stats">
      ${bar("HP", c.stats.hp, 110)}
      ${bar("MP", c.stats.mp, 60)}
      ${bar("攻", c.stats.atk, 34)}
      ${bar("防", c.stats.def, 22)}
      ${bar("速", c.stats.spd, 24)}
    </div>`;
  }

  private renderSelect(view: View): void {
    this.show("screen");
    const cards = CHARACTERS.map((c) => {
      const selected = view.you.charId === c.id;
      const oppPick = view.opp?.charId === c.id;
      return `<button class="char-card ${selected ? "selected" : ""}" data-id="${c.id}" ${view.you.ready ? "disabled" : ""}
        style="--accent:${c.color}">
        <div class="char-name">${esc(c.name)}</div>
        <div class="char-title">${esc(c.title)}</div>
        <div class="char-blurb">${esc(c.blurb)}</div>
        ${this.statBars(c.id)}
        ${oppPick ? `<div class="opp-flag">相手の選択</div>` : ""}
      </button>`;
    }).join("");

    const oppStatus = !view.opp
      ? "待機中"
      : view.opp.ready
        ? "準備完了！"
        : view.opp.charId
          ? "選択中…"
          : "選択中…";
    const canReady = !!view.you.charId;

    this.screenEl.innerHTML = `
      <div class="panel wide">
        <div class="select-head">
          <h2>キャラクターを選ぶ</h2>
          <div>部屋 <span class="code-value small">${esc(view.code)}</span> ${this.modeBadge(view)}</div>
        </div>
        <div class="char-grid">${cards}</div>
        <div class="select-foot">
          <div class="picks">
            <span>あなた: <b>${view.you.charId ? esc(getCharacter(view.you.charId)!.name) : "未選択"}</b>${view.you.ready ? "（準備完了）" : ""}</span>
            <span>相手: <b>${esc(view.opp?.name ?? "—")}</b> / ${oppStatus}</span>
          </div>
          <div class="row">
            <button id="ready" class="btn primary" ${canReady ? "" : "disabled"}>${view.you.ready ? "準備を解除" : "準備完了"}</button>
            <button id="exit" class="btn ghost">やめる</button>
          </div>
        </div>
      </div>`;

    if (!view.you.ready) {
      this.screenEl.querySelectorAll<HTMLButtonElement>(".char-card").forEach((el) => {
        el.addEventListener("click", () => this.h.onSelectChar(el.dataset.id!));
      });
    }
    this.screenEl.querySelector("#ready")!.addEventListener("click", () => this.h.onReady(!view.you.ready));
    this.screenEl.querySelector("#exit")!.addEventListener("click", () => this.h.onExit());
  }

  private fighterPanel(view: View, which: "you" | "opp"): string {
    const battle = view.battle!;
    const role = which === "you" ? view.role : (view.role === "host" ? "guest" : "host");
    const f = battle.fighters[role];
    const c = getCharacter(f.charId);
    const hpPct = Math.max(0, Math.round((f.hp / f.maxHp) * 100));
    const mpPct = Math.max(0, Math.round((f.mp / f.maxMp) * 100));
    const mods = f.mods
      .map((m) => `<span class="mod ${m.mult >= 1 ? "up" : "down"}">${m.mult >= 1 ? "▲" : "▼"}${m.stat === "atk" ? "攻" : m.stat === "def" ? "防" : "速"}</span>`)
      .join("");
    const guarding = f.guarding ? `<span class="mod guard">🛡ガード</span>` : "";
    return `<div class="fighter-panel ${which}" style="--accent:${c?.color ?? "#fff"}">
      <div class="fp-top">
        <span class="fp-name">${esc(f.name)}</span>
        <span class="fp-char">${esc(c?.name ?? f.charId)}</span>
      </div>
      <div class="bar hp"><i style="width:${hpPct}%"></i><span>${Math.max(0, f.hp)}/${f.maxHp}</span></div>
      <div class="bar mp"><i style="width:${mpPct}%"></i><span>MP ${Math.max(0, f.mp)}/${f.maxMp}</span></div>
      <div class="mods">${mods}${guarding}</div>
    </div>`;
  }

  private renderBattle(view: View): void {
    this.show("battle");
    const battle = view.battle!;
    const youTurn = battle.active === view.role;
    const you = battle.fighters[view.role];
    const char = getCharacter(you.charId);
    const canSubmit = youTurn && this.submittedTurn !== battle.turn;

    const skillBtns = (char?.skills ?? [])
      .map((s) => {
        const affordable = you.mp >= s.mp;
        return `<button class="cmd skill" data-skill="${s.id}" ${canSubmit && affordable ? "" : "disabled"} title="${esc(s.desc)}">
          <b>${esc(s.name)}</b><small>MP ${s.mp}</small></button>`;
      })
      .join("");

    const log = battle.log
      .slice(-6)
      .map((e) => `<div class="log-line ${e.kind}">${esc(e.text)}</div>`)
      .join("");

    this.hudEl.innerHTML = `
      <div class="hud-top">${this.fighterPanel(view, "opp")}</div>
      <div class="turn-banner ${youTurn ? "yours" : "theirs"}">${youTurn ? "▶ あなたのターン" : "相手のターン…"}</div>
      <div class="hud-bottom">
        <div class="hud-log">${log}</div>
        ${this.fighterPanel(view, "you")}
        <div class="commands">
          <button class="cmd" data-cmd="attack" ${canSubmit ? "" : "disabled"}>こうげき</button>
          <button class="cmd" data-cmd="guard" ${canSubmit ? "" : "disabled"}>ぼうぎょ</button>
          <button class="cmd" data-cmd="item" ${canSubmit && you.items > 0 ? "" : "disabled"}>どうぐ ×${you.items}</button>
          ${skillBtns}
        </div>
      </div>`;

    const submit = (action: Action) => {
      this.submittedTurn = battle.turn;
      this.h.onAction(action);
      this.renderBattle(view); // immediately grey out commands
    };
    if (canSubmit) {
      this.hudEl.querySelectorAll<HTMLButtonElement>(".cmd[data-cmd]").forEach((el) => {
        el.addEventListener("click", () => {
          const cmd = el.dataset.cmd!;
          if (cmd === "attack") submit({ kind: "attack" });
          else if (cmd === "guard") submit({ kind: "guard" });
          else if (cmd === "item") submit({ kind: "item" });
        });
      });
      this.hudEl.querySelectorAll<HTMLButtonElement>(".cmd.skill").forEach((el) => {
        el.addEventListener("click", () => submit({ kind: "skill", skillId: el.dataset.skill! }));
      });
    }
  }

  private renderFinished(view: View): void {
    this.show("battle");
    const battle = view.battle!;
    const won = battle.winner === view.role;
    const waiting = view.youRematch && !view.oppRematch;
    this.hudEl.innerHTML = `
      <div class="result ${won ? "win" : "lose"}">
        <div class="result-text">${won ? "YOU WIN!" : "YOU LOSE…"}</div>
        <div class="result-sub">${esc(battle.log[battle.log.length - 1]?.text ?? "")}</div>
        <div class="row">
          <button id="rematch" class="btn primary" ${view.youRematch ? "disabled" : ""}>${waiting ? "相手を待っています…" : view.youRematch ? "リクエスト済" : "もう一度たたかう"}</button>
          <button id="exit" class="btn ghost">ロビーに戻る</button>
        </div>
        ${view.oppRematch && !view.youRematch ? `<p class="hint">相手が再戦を希望しています。</p>` : ""}
      </div>`;
    this.hudEl.querySelector("#rematch")!.addEventListener("click", () => this.h.onRematch());
    this.hudEl.querySelector("#exit")!.addEventListener("click", () => this.h.onExit());
  }

  /** Reset the per-turn submit lock (used when a new battle starts). */
  resetSubmitLock(): void {
    this.submittedTurn = -1;
  }
}
