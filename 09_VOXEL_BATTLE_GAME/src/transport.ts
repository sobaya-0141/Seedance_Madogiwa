// Transport abstraction: a dumb key/value sync of a single "room" document.
//
// The game logic (net.ts) is written against this interface only, so the exact
// same battle works over two different backends:
//
//   • LocalTransport   — localStorage + BroadcastChannel. Lets two tabs on the
//                        same machine share a room, for development / testing
//                        with zero external services.
//   • FirebaseTransport — Firebase Realtime Database, for real online play
//                        between separate devices.
//
// To keep both backends behaving identically (so testing on Local validates
// Firebase), values are treated as opaque: net.ts serialises the battle state
// and actions to JSON strings before writing, sidestepping Realtime Database's
// quirks around empty arrays and null keys.

import type { Role } from "./battle";
import { getDb } from "./firebase";
import { ref, onValue, get, update as rtdbUpdate } from "firebase/database";

export type PlayerSlot = {
  name: string;
  charId: string | null;
  ready: boolean;
};

export type RoomDoc = {
  createdAt: number;
  host: PlayerSlot;
  guest: PlayerSlot | null;
  /** JSON-serialised BattleState, or null before the battle starts. */
  battle: string | null;
  /** inputs[turn][role] = JSON-serialised Action. */
  inputs: Record<string, Partial<Record<Role, string>>>;
  rematch: Partial<Record<Role, boolean>>;
};

export type TransportMode = "local" | "online";

export interface Transport {
  readonly code: string;
  readonly role: Role;
  read(): Promise<RoomDoc | null>;
  subscribe(cb: (room: RoomDoc | null) => void): () => void;
  /**
   * Multi-path update. Keys are "/"-separated paths relative to the room root
   * (e.g. "host/charId", "inputs/3/guest", "battle"). A null value deletes the
   * path. Matches Firebase Realtime Database's update() semantics.
   */
  update(paths: Record<string, unknown>): Promise<void>;
  dispose(): void;
}

// ── Local (BroadcastChannel + localStorage) ─────────────────────────────────

const LS_PREFIX = "madogiwa-battle:room:";
const lsKey = (code: string) => LS_PREFIX + code;

function loadRoom(code: string): RoomDoc | null {
  const raw = localStorage.getItem(lsKey(code));
  return raw ? (JSON.parse(raw) as RoomDoc) : null;
}

function saveRoom(code: string, room: RoomDoc): void {
  localStorage.setItem(lsKey(code), JSON.stringify(room));
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split("/");
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cur[key];
    if (next == null || typeof next !== "object") cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (value === null) delete cur[last];
  else cur[last] = value;
}

class LocalTransport implements Transport {
  private chan: BroadcastChannel;
  private subs = new Set<(room: RoomDoc | null) => void>();
  private scheduled = false;

  constructor(readonly code: string, readonly role: Role) {
    this.chan = new BroadcastChannel("madogiwa-battle:" + code);
    // BroadcastChannel does not deliver to the sender, so it is used purely to
    // wake up *other* tabs; the sender re-emits to itself in update().
    this.chan.onmessage = () => this.scheduleEmit();
  }

  async read(): Promise<RoomDoc | null> {
    return loadRoom(this.code);
  }

  subscribe(cb: (room: RoomDoc | null) => void): () => void {
    this.subs.add(cb);
    cb(loadRoom(this.code));
    return () => this.subs.delete(cb);
  }

  async update(paths: Record<string, unknown>): Promise<void> {
    const room = (loadRoom(this.code) ?? {}) as unknown as Record<string, unknown>;
    for (const [path, value] of Object.entries(paths)) setPath(room, path, value);
    saveRoom(this.code, room as unknown as RoomDoc);
    this.scheduleEmit();
    this.chan.postMessage(1);
  }

  // Emit asynchronously (coalesced) so notifications never fire re-entrantly in
  // the middle of a subscriber's handler. This mirrors Firebase Realtime
  // Database, whose value callbacks are always async — without it, the host's
  // hostTick() write would emit synchronously and a stale outer render would
  // clobber the fresh battle state.
  private scheduleEmit(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      this.emit();
    });
  }

  private emit(): void {
    const room = loadRoom(this.code);
    for (const cb of this.subs) cb(room);
  }

  dispose(): void {
    this.chan.close();
    this.subs.clear();
  }
}

// ── Firebase Realtime Database ──────────────────────────────────────────────

class FirebaseTransport implements Transport {
  private roomRef;
  private unsub?: () => void;

  constructor(readonly code: string, readonly role: Role) {
    this.roomRef = ref(getDb(), "rooms/" + code);
  }

  async read(): Promise<RoomDoc | null> {
    const snap = await get(this.roomRef);
    return snap.exists() ? (snap.val() as RoomDoc) : null;
  }

  subscribe(cb: (room: RoomDoc | null) => void): () => void {
    this.unsub = onValue(this.roomRef, (snap) => {
      // Firebase fires the echo of a *local* write synchronously inside the
      // update() call. If that happened re-entrantly during onRoom()->hostTick()
      // ->update(), the outer handler's stale render would clobber the fresh
      // one. Defer delivery to a microtask (matching LocalTransport) so every
      // notification lands at the top of its own call stack. The snapshot is
      // immutable, so reading it later is safe.
      const value = snap.exists() ? (snap.val() as RoomDoc) : null;
      queueMicrotask(() => cb(value));
    });
    return () => this.unsub?.();
  }

  async update(paths: Record<string, unknown>): Promise<void> {
    await rtdbUpdate(this.roomRef, paths as Record<string, unknown>);
  }

  dispose(): void {
    this.unsub?.();
  }
}

export function makeTransport(mode: TransportMode, code: string, role: Role): Transport {
  return mode === "online"
    ? new FirebaseTransport(code, role)
    : new LocalTransport(code, role);
}
