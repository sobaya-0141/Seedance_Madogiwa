// Session orchestration on top of a Transport.
//
// A Session wraps one room and exposes a simple, screen-oriented view plus the
// handful of actions the UI needs (pick character, ready up, submit a battle
// action, request a rematch). All host-authority logic lives in hostTick():
// only the host resolves turns and advances the battle, keeping both clients
// in lockstep.

import {
  initBattle,
  resolveTurn,
  type Action,
  type BattleState,
  type Role,
} from "./battle";
import {
  makeTransport,
  type PlayerSlot,
  type RoomDoc,
  type Transport,
  type TransportMode,
} from "./transport";

export type Screen = "waiting" | "select" | "battle" | "finished";

export type View = {
  screen: Screen;
  code: string;
  role: Role;
  mode: TransportMode;
  you: PlayerSlot;
  opp: PlayerSlot | null;
  battle: BattleState | null;
  /** True once the opponent has joined the room. */
  connected: boolean;
  youRematch: boolean;
  oppRematch: boolean;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const CODE_LENGTH = 4;

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

function normSlot(slot: PlayerSlot | null | undefined): PlayerSlot | null {
  if (!slot || !slot.name) return null;
  return { name: slot.name, charId: slot.charId ?? null, ready: !!slot.ready };
}

export class Session {
  private subs = new Set<(view: View) => void>();
  private unsub: () => void;
  private lastView: View | null = null;
  private lastResolvedTurn = 0;
  private initPending = false;
  private resetPending = false;

  private constructor(
    private transport: Transport,
    private mode: TransportMode,
  ) {
    this.unsub = transport.subscribe((room) => this.onRoom(room));
  }

  get code(): string {
    return this.transport.code;
  }

  get role(): Role {
    return this.transport.role;
  }

  static async create(mode: TransportMode, name: string): Promise<Session> {
    const code = randomCode();
    const transport = makeTransport(mode, code, "host");
    await transport.update({
      createdAt: Date.now(),
      host: { name, charId: null, ready: false },
      inputs: {},
      rematch: {},
    });
    return new Session(transport, mode);
  }

  static async join(mode: TransportMode, rawCode: string, name: string): Promise<Session> {
    const code = rawCode.trim().toUpperCase();
    if (!code) throw new Error("部屋コードを入力してください。");
    const transport = makeTransport(mode, code, "guest");
    const room = await transport.read();
    if (!room) {
      transport.dispose();
      throw new Error("その部屋コードは見つかりませんでした。");
    }
    if (normSlot(room.guest)) {
      transport.dispose();
      throw new Error("その部屋はすでに満員です。");
    }
    await transport.update({ guest: { name, charId: null, ready: false } });
    return new Session(transport, mode);
  }

  onView(cb: (view: View) => void): () => void {
    this.subs.add(cb);
    // Replay the most recent view: the transport's initial snapshot fires during
    // construction, before any onView listener is attached, so without this the
    // first screen (e.g. "waiting") would never reach the UI.
    if (this.lastView) cb(this.lastView);
    return () => this.subs.delete(cb);
  }

  // ── UI actions ────────────────────────────────────────────────────────────

  selectChar(charId: string): void {
    void this.transport.update({ [`${this.role}/charId`]: charId });
  }

  setReady(ready: boolean): void {
    void this.transport.update({ [`${this.role}/ready`]: ready });
  }

  submitAction(turn: number, action: Action): void {
    void this.transport.update({
      [`inputs/${turn}/${this.role}`]: JSON.stringify(action),
    });
  }

  requestRematch(): void {
    void this.transport.update({ [`rematch/${this.role}`]: true });
  }

  dispose(): void {
    this.unsub();
    this.transport.dispose();
    this.subs.clear();
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private onRoom(room: RoomDoc | null): void {
    if (!room) return;
    const battle: BattleState | null = room.battle
      ? (JSON.parse(room.battle) as BattleState)
      : null;
    this.hostTick(room, battle);
    const view = this.deriveView(room, battle);
    this.lastView = view;
    for (const cb of this.subs) cb(view);
  }

  /** Host-only authority: start the battle, resolve turns, handle rematch. */
  private hostTick(room: RoomDoc, battle: BattleState | null): void {
    if (this.role !== "host") return;
    const host = normSlot(room.host);
    const guest = normSlot(room.guest);

    if (!battle) {
      this.lastResolvedTurn = 0;
      this.resetPending = false;
      const bothReady =
        host?.ready && guest?.ready && host.charId && guest.charId;
      if (bothReady && !this.initPending) {
        this.initPending = true;
        const state = initBattle(host.charId!, guest!.charId!, host.name, guest!.name);
        void this.transport.update({
          battle: JSON.stringify(state),
          inputs: {},
          rematch: {},
        });
      }
      return;
    }

    this.initPending = false;

    if (battle.winner) {
      const rm = room.rematch ?? {};
      if (rm.host && rm.guest && !this.resetPending) {
        this.resetPending = true;
        void this.transport.update({
          battle: null,
          inputs: {},
          rematch: {},
          "host/ready": false,
          "guest/ready": false,
          "host/charId": null,
          "guest/charId": null,
        });
      }
      return;
    }

    this.resetPending = false;

    // Resolve the active player's action for the current turn, exactly once.
    const raw = room.inputs?.[String(battle.turn)]?.[battle.active];
    if (raw && battle.turn > this.lastResolvedTurn) {
      this.lastResolvedTurn = battle.turn;
      const action = JSON.parse(raw) as Action;
      const next = resolveTurn(battle, action, Math.random);
      void this.transport.update({ battle: JSON.stringify(next) });
    }
  }

  private deriveView(room: RoomDoc, battle: BattleState | null): View {
    const host = normSlot(room.host);
    const guest = normSlot(room.guest);
    const fallback: PlayerSlot = { name: "あなた", charId: null, ready: false };
    const you = (this.role === "host" ? host : guest) ?? fallback;
    const opp = this.role === "host" ? guest : host;
    const rm = room.rematch ?? {};

    let screen: Screen;
    if (!battle) {
      screen = opp ? "select" : "waiting";
    } else if (battle.winner) {
      screen = "finished";
    } else {
      screen = "battle";
    }

    return {
      screen,
      code: this.code,
      role: this.role,
      mode: this.mode,
      you,
      opp,
      battle,
      connected: opp != null,
      youRematch: !!rm[this.role],
      oppRematch: !!rm[this.role === "host" ? "guest" : "host"],
    };
  }
}
