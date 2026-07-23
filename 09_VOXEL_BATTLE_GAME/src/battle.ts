// Pure, deterministic-given-RNG battle engine.
//
// Only the HOST client ever calls resolveTurn(): it takes the current battle
// state plus the active player's chosen action and produces the next state,
// which it then writes to the shared room. The guest never resolves anything —
// it just renders the state the host publishes. This "host authority" model
// keeps both screens perfectly in sync and makes tampering pointless.
//
// The module has no three.js / DOM / network imports so it stays trivially
// testable and reusable behind either transport.

import {
  getCharacter,
  type BattleCharacter,
  type Skill,
  type StatKind,
} from "./characters";

export type Role = "host" | "guest";

export function otherRole(role: Role): Role {
  return role === "host" ? "guest" : "host";
}

export type Action =
  | { kind: "attack" }
  | { kind: "skill"; skillId: string }
  | { kind: "guard" }
  | { kind: "item" };

export type StatMod = { stat: StatKind; mult: number; turns: number };

export type Fighter = {
  charId: string;
  /** Player display name. */
  name: string;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
  mods: StatMod[];
  guarding: boolean;
  items: number;
};

export type LogKind = "info" | "damage" | "heal" | "buff" | "debuff" | "result";
export type LogEntry = { text: string; kind: LogKind };

export type BattleEvent = {
  actor: Role;
  action: Action;
  /** Role that took damage this turn, if any (for hit flash / shake). */
  damaged?: Role;
  /** Role that was healed this turn, if any. */
  healed?: Role;
  /** Log entries produced by this single turn. */
  entries: LogEntry[];
};

export type BattleState = {
  /** Increments by 1 on every resolved action. Actions are keyed by this. */
  turn: number;
  active: Role;
  fighters: Record<Role, Fighter>;
  log: LogEntry[];
  /** Most recent turn's outcome, for the renderer to animate. Null at start. */
  lastEvent: BattleEvent | null;
  winner: Role | null;
};

export type Rng = () => number;

export const START_ITEMS = 1;
export const ITEM_HEAL = 24;
const GUARD_REDUCTION = 0.5;
const GUARD_MP_REGEN = 6;
const DAMAGE_VARIANCE = 0.1; // +/- 10%

function makeFighter(char: BattleCharacter, name: string): Fighter {
  return {
    charId: char.id,
    name,
    maxHp: char.stats.hp,
    hp: char.stats.hp,
    maxMp: char.stats.mp,
    mp: char.stats.mp,
    atk: char.stats.atk,
    def: char.stats.def,
    spd: char.stats.spd,
    mods: [],
    guarding: false,
    items: START_ITEMS,
  };
}

function effectiveStat(f: Fighter, stat: StatKind): number {
  const base = f[stat];
  const mult = f.mods
    .filter((m) => m.stat === stat)
    .reduce((acc, m) => acc * m.mult, 1);
  return base * mult;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function initBattle(
  hostCharId: string,
  guestCharId: string,
  hostName: string,
  guestName: string,
): BattleState {
  const hostChar = getCharacter(hostCharId);
  const guestChar = getCharacter(guestCharId);
  if (!hostChar || !guestChar) {
    throw new Error(`Unknown character id: ${hostCharId} / ${guestCharId}`);
  }
  const host = makeFighter(hostChar, hostName);
  const guest = makeFighter(guestChar, guestName);
  // Speed decides who moves first; host wins ties (deterministic).
  const active: Role = guest.spd > host.spd ? "guest" : "host";
  const firstName = active === "host" ? host.name : guest.name;
  return {
    turn: 1,
    active,
    fighters: { host, guest },
    log: [
      { text: `${host.name}（${hostChar.name}）と ${guest.name}（${guestChar.name}）の決闘開始！`, kind: "info" },
      { text: `すばやさが上回る ${firstName} の先攻！`, kind: "info" },
    ],
    lastEvent: null,
    winner: null,
  };
}

function computeDamage(
  attacker: Fighter,
  defender: Fighter,
  power: number,
  rng: Rng,
): number {
  const atk = effectiveStat(attacker, "atk");
  const def = effectiveStat(defender, "def");
  let raw = atk * power - def * 0.5;
  raw = Math.max(1, raw);
  const variance = 1 + (rng() * 2 - 1) * DAMAGE_VARIANCE;
  raw *= variance;
  if (defender.guarding) raw *= GUARD_REDUCTION;
  return Math.max(1, Math.round(raw));
}

const statLabel: Record<StatKind, string> = {
  atk: "こうげき",
  def: "ぼうぎょ",
  spd: "すばやさ",
};

/**
 * Resolve the active player's action and return the next battle state.
 * Pure: does not mutate the input. Host-only.
 */
export function resolveTurn(prev: BattleState, action: Action, rng: Rng): BattleState {
  if (prev.winner) return prev;
  const state: BattleState = structuredClone(prev);
  const actorRole = state.active;
  const foeRole = otherRole(actorRole);
  const actor = state.fighters[actorRole];
  const foe = state.fighters[foeRole];
  const actorChar = getCharacter(actor.charId);
  const entries: LogEntry[] = [];
  const event: BattleEvent = { actor: actorRole, action, entries };

  // The actor's guard (raised last turn) has served its purpose; clear it, then
  // expire any of the actor's own timed modifiers.
  actor.guarding = false;
  actor.mods = actor.mods
    .map((m) => ({ ...m, turns: m.turns - 1 }))
    .filter((m) => m.turns > 0);

  const dealDamage = (power: number, hits: number) => {
    let total = 0;
    for (let i = 0; i < hits; i++) {
      total += computeDamage(actor, foe, power, rng);
    }
    foe.hp = clamp(foe.hp - total, 0, foe.maxHp);
    event.damaged = foeRole;
    entries.push({
      text: `${foe.name} に ${total} ダメージ！${hits > 1 ? `（${hits}ヒット）` : ""}`,
      kind: "damage",
    });
  };

  const applySkill = (skill: Skill) => {
    actor.mp = Math.max(0, actor.mp - skill.mp);
    entries.push({ text: `${actor.name} は「${skill.name}」を使った！`, kind: "info" });
    for (const eff of skill.effects) {
      switch (eff.type) {
        case "damage":
          dealDamage(eff.power, eff.hits ?? 1);
          break;
        case "heal": {
          const before = actor.hp;
          actor.hp = clamp(actor.hp + eff.amount, 0, actor.maxHp);
          event.healed = actorRole;
          entries.push({ text: `${actor.name} のHPが ${actor.hp - before} 回復した。`, kind: "heal" });
          break;
        }
        case "buffSelf":
          actor.mods.push({ stat: eff.stat, mult: eff.mult, turns: eff.turns });
          entries.push({
            text: `${actor.name} の${statLabel[eff.stat]}が${eff.mult >= 1 ? "上がった" : "下がった"}！`,
            kind: "buff",
          });
          break;
        case "debuffFoe":
          foe.mods.push({ stat: eff.stat, mult: eff.mult, turns: eff.turns });
          entries.push({
            text: `${foe.name} の${statLabel[eff.stat]}が${eff.mult < 1 ? "下がった" : "上がった"}！`,
            kind: "debuff",
          });
          break;
        case "drainMp": {
          const before = foe.mp;
          foe.mp = Math.max(0, foe.mp - eff.amount);
          entries.push({ text: `${foe.name} のMPを ${before - foe.mp} 奪った！`, kind: "debuff" });
          break;
        }
      }
    }
  };

  switch (action.kind) {
    case "attack":
      entries.push({ text: `${actor.name} のこうげき！`, kind: "info" });
      dealDamage(1.0, 1);
      break;
    case "guard":
      actor.guarding = true;
      actor.mp = clamp(actor.mp + GUARD_MP_REGEN, 0, actor.maxMp);
      entries.push({ text: `${actor.name} は身を守っている。（MP少し回復）`, kind: "info" });
      break;
    case "item":
      if (actor.items > 0) {
        actor.items -= 1;
        const before = actor.hp;
        actor.hp = clamp(actor.hp + ITEM_HEAL, 0, actor.maxHp);
        event.healed = actorRole;
        entries.push({
          text: `${actor.name} は栄養ドリンクを飲んだ！HPが ${actor.hp - before} 回復（残り${actor.items}個）。`,
          kind: "heal",
        });
      } else {
        entries.push({ text: `${actor.name} はアイテムを持っていない…`, kind: "info" });
      }
      break;
    case "skill": {
      const skill = actorChar?.skills.find((s) => s.id === action.skillId);
      if (skill && actor.mp >= skill.mp) {
        applySkill(skill);
      } else {
        entries.push({ text: `${actor.name} はMPが足りず様子を見ている…`, kind: "info" });
      }
      break;
    }
  }

  // Win check.
  if (foe.hp <= 0) {
    state.winner = actorRole;
    entries.push({ text: `${foe.name} は倒れた！ ${actor.name} の勝利！`, kind: "result" });
  } else if (actor.hp <= 0) {
    state.winner = foeRole;
    entries.push({ text: `${actor.name} は力尽きた… ${foe.name} の勝利！`, kind: "result" });
  }

  state.log = [...state.log, ...entries];
  state.lastEvent = event;
  state.turn = prev.turn + 1;
  if (!state.winner) state.active = foeRole;
  return state;
}
