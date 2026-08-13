"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SOBAYA_CHARACTER } from "./characters/sobaya";
import {
  MID_BOSS_ROTATION,
  WINDOW_BOSSES,
  type CharacterBossId,
} from "./characters/window-bosses";
import {
  loadVoxelCharacter,
  type VoxelActionController,
} from "./characters/voxel-character-kit";
import {
  EMPTY_PROFILE,
  FIXTURES,
  FLOORS,
  OVERTIME_RANKS,
  UPGRADES,
  fixtureCost,
  getOvertimeDefinition,
  makeRewardChoices,
  type FixtureKey,
  type GameProfile,
  type GameStatus,
  type OvertimeRank,
  type RewardChoice,
  type SiteGameData,
  type UpgradeId,
} from "./game-content";
import type {
  OfficePhysicsRuntime,
  OfficePhysicsStats,
} from "./game-physics";

type HudState = {
  floor: number;
  floorName: string;
  kicker: string;
  objective: string;
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  multiplier: number;
  enemies: number;
  totalEnemies: number;
  mega: number;
  megaMax: number;
  megaGauge: number;
  megaTargets: number;
  caps: number;
  timer: number | null;
  dashReady: number;
  bossName: string;
  pressure: number;
  rushRemaining: number;
  overtimeLabel: string;
  scoreMultiplier: number;
  offscreenEnemies: number;
  incomingAttack: boolean;
  physicsOnline: boolean;
  physicsBodies: number;
  physicsMoving: number;
  kineticChain: number;
};

type RunSummary = {
  victory: boolean;
  floorReached: number;
  score: number;
  destroyed: number;
  maxCombo: number;
  capsEarned: number;
  upgrades: string[];
  overtimeRank: OvertimeRank;
  buildName: string;
};

type HubPanel = "play" | "bar" | "records";

type GameApi = {
  start: (profile: GameProfile, overtimeRank: OvertimeRank) => void;
  smash: () => void;
  megaSmash: () => void;
  dash: () => void;
  pause: () => void;
  unlockAudio: () => void;
  testSound: () => void;
  toggleSound: (forceStart?: boolean) => boolean;
  pickUpgrade: (choice: RewardChoice) => void;
  rerollReward: () => void;
  returnHub: () => void;
};

type EquipmentEnemyKind = "chair" | "stapler" | "cabinet" | "desk" | "copier" | "gate" | "core";
type EnemyKind = EquipmentEnemyKind | "character";
type EliteAffix = "rapid" | "barrier" | "volatile" | "regenerator";
type EnemyAttackKind = "melee" | "pulse";

type Enemy = {
  group: THREE.Group;
  kind: EnemyKind;
  label: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  points: number;
  color: number;
  alive: boolean;
  boss: boolean;
  characterBoss: CharacterBossId | null;
  elite: boolean;
  affix: EliteAffix | null;
  barrier: number;
  lastRegen: number;
  frozenUntil: number;
  nextAttack: number;
  pulseAt: number;
  attackKind: EnemyAttackKind | null;
  attackStartedAt: number;
  attackAt: number;
  attackOrigin: THREE.Vector3;
  attackRadius: number;
  attackWarning: THREE.Group | null;
  vulnerableFrom: number;
  vulnerableUntil: number;
  phase: 1 | 2;
  offscreenSince: number | null;
  healthFill?: THREE.Mesh;
};

type OfficePropKind = "monitor" | "paper" | "cooler";

type OfficeProp = {
  group: THREE.Group;
  kind: OfficePropKind;
  radius: number;
  points: number;
  color: number;
  destroyed: boolean;
};

type PickupKind = "beer" | "clock" | "cap" | "yakitori";

type Pickup = {
  group: THREE.Group;
  kind: PickupKind;
  baseY: number;
  active: boolean;
};

type Debris = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
};

type Effect = {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
};

type Hazard = {
  shape: "circle" | "beam";
  warning: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  direction: THREE.Vector3;
  length: number;
  width: number;
  damage: number;
  startedAt: number;
  triggerAt: number;
  color: number;
  sourceBoss: CharacterBossId | null;
};

type DizzyBoss = {
  group: THREE.Group;
  stars: THREE.Group;
  startedAt: number;
  removeAt: number | null;
};

type MegaProjectile = {
  group: THREE.Group;
  lane: THREE.Group;
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  distance: number;
  width: number;
  damage: number;
  startedAt: number;
  duration: number;
  previousDistance: number;
  lastTrailAt: number;
  hitEnemies: Set<Enemy>;
  hitProps: Set<OfficeProp>;
};

type TimedVisual = {
  object: THREE.Object3D;
  life: number;
  maxLife: number;
  spin: number;
};

type DamageNumberStyle = "normal" | "mega" | "splash" | "kinetic";

const EMPTY_HUD: HudState = {
  floor: 1,
  floorName: FLOORS[0].name,
  kicker: FLOORS[0].kicker,
  objective: FLOORS[0].objective,
  hp: 100,
  maxHp: 100,
  score: 0,
  combo: 0,
  multiplier: 1,
  enemies: 0,
  totalEnemies: 0,
  mega: 0,
  megaMax: 2,
  megaGauge: 0,
  megaTargets: 0,
  caps: 0,
  timer: null,
  dashReady: 1,
  bossName: "",
  pressure: 0,
  rushRemaining: 0,
  overtimeLabel: OVERTIME_RANKS[0].label,
  scoreMultiplier: 1,
  offscreenEnemies: 0,
  incomingAttack: false,
  physicsOnline: false,
  physicsBodies: 0,
  physicsMoving: 0,
  kineticChain: 0,
};

const MAX_FLOOR = FLOORS.length;
const UP = new THREE.Vector3(0, 1, 0);
const MAX_CONCURRENT_MOB_ATTACKS = 4;
const BASE_SMASH_DAMAGE = 2;
const DAMAGE_DISPLAY_MULTIPLIER = 5;
const KINETIC_SWEEP_INTERVAL = 1 / 30;
const MAX_KINETIC_HITS_PER_SWEEP = 3;
const BOSS_WARNING_COLOR = 0xff2038;
const BOSS_DIFFICULTY_BY_RANK = [
  { areaMultiplier: 1, cadenceMultiplier: 1, windupMultiplier: 1, openingDuration: 1.9 },
  { areaMultiplier: 1.14, cadenceMultiplier: 0.78, windupMultiplier: 0.94, openingDuration: 1.7 },
  { areaMultiplier: 1.28, cadenceMultiplier: 0.6, windupMultiplier: 0.9, openingDuration: 1.55 },
] as const;

function getComboMultiplier(combo: number) {
  if (combo >= 30) return 4;
  if (combo >= 20) return 3;
  if (combo >= 12) return 2.25;
  if (combo >= 6) return 1.5;
  return 1;
}

function getRank(summary: RunSummary) {
  if (summary.victory && summary.score >= 70000) return "窓際伝説の店主";
  if (summary.victory) return "備品循環棟・完全制覇";
  if (summary.floorReached >= 7) return "レギュレーションブレイカー";
  if (summary.floorReached >= 4) return "窓際セッションの名手";
  return "片付けの途中です！";
}

function getDailyFeaturedRank(date = new Date()): OvertimeRank {
  const japanDay = Math.floor((date.getTime() + 9 * 60 * 60 * 1000) / 86_400_000);
  return (japanDay % OVERTIME_RANKS.length) as OvertimeRank;
}

function formatNumber(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString("ja-JP");
}

function roundedBox(width: number, height: number, depth: number, color: number) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.74 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeHealthBar(width: number, color = 0x56e07a) {
  const holder = new THREE.Group();
  const back = roundedBox(width, 0.13, 0.09, 0x182632);
  const fill = roundedBox(width * 0.92, 0.075, 0.12, color);
  fill.position.z = -0.07;
  holder.add(back, fill);
  holder.userData.fill = fill;
  return holder;
}

function makeSobayaFallback() {
  const root = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: 0xf5f6f2, roughness: 0.86 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xa7b0b5, roughness: 0.78 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58 });
  const amber = new THREE.MeshStandardMaterial({
    color: 0xf39b08,
    roughness: 0.25,
    emissive: 0x4b2200,
    emissiveIntensity: 0.2,
  });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 0.82, 6, 14), shirt);
  torso.scale.set(1.28, 1, 0.9);
  torso.position.y = 1.45;
  torso.castShadow = true;
  root.add(torso);

  for (const x of [-0.42, 0.42]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.38, 5, 12), skin);
    leg.position.set(x, 0.38, 0);
    leg.castShadow = true;
    root.add(leg);
    const shoe = roundedBox(0.46, 0.2, 0.62, 0x11161b);
    shoe.position.set(x, 0.08, -0.16);
    root.add(shoe);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 22, 16), skin);
  head.position.y = 2.65;
  head.castShadow = true;
  root.add(head);
  const mask = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 18), white);
  mask.scale.set(0.92, 1.03, 0.22);
  mask.position.set(0, 2.65, -0.57);
  root.add(mask);
  for (const x of [-0.22, 0.22]) {
    const eye = new THREE.Mesh(
      new THREE.CircleGeometry(0.095, 16),
      new THREE.MeshBasicMaterial({ color: 0x080a0b }),
    );
    eye.position.set(x, 2.75, -0.705);
    root.add(eye);
    const mark = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.3, 4),
      new THREE.MeshStandardMaterial({ color: 0xe12b2b }),
    );
    mark.position.set(x, 2.43, -0.69);
    root.add(mark);
  }

  const mug = new THREE.Group();
  const beer = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.23, 0.72, 18), amber);
  mug.add(beer);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.26, 0.78, 18, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.38,
      roughness: 0.08,
      transmission: 0.3,
    }),
  );
  mug.add(glass);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.045, 8, 18, Math.PI * 1.6),
    white,
  );
  handle.position.x = 0.28;
  handle.rotation.z = -0.8;
  mug.add(handle);
  mug.position.set(0.95, 1.2, -0.48);
  root.add(mug);

  root.scale.setScalar(0.92);
  return root;
}

function makeSobaya() {
  const player = new THREE.Group();
  player.name = "sobaya";
  const fallback = makeSobayaFallback();
  player.add(fallback);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.88, 1.03, 42),
    new THREE.MeshBasicMaterial({
      color: 0xffc21d,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.025;
  player.add(marker);

  loadVoxelCharacter({
    definition: SOBAYA_CHARACTER,
    parent: player,
    onReady: ({ mixer, actions }) => {
      fallback.visible = false;
      if (mixer) player.userData.mixer = mixer;
      if (actions) player.userData.animator = actions;
    },
    onError: (error) => {
      console.warn("Sobaya GLB could not be loaded; using fallback.", error);
    },
  });
  return player;
}

function makeChairEnemy() {
  const group = new THREE.Group();
  const seat = roundedBox(0.78, 0.18, 0.74, 0x237bc1);
  seat.position.y = 0.72;
  const back = roundedBox(0.78, 0.8, 0.16, 0x2c92da);
  back.position.set(0, 1.18, 0.28);
  const stem = roundedBox(0.12, 0.55, 0.12, 0x33414a);
  stem.position.y = 0.38;
  group.add(seat, back, stem);
  for (let i = 0; i < 5; i += 1) {
    const angle = i / 5 * Math.PI * 2;
    const foot = roundedBox(0.52, 0.09, 0.1, 0x26333d);
    foot.position.set(Math.sin(angle) * 0.26, 0.12, Math.cos(angle) * 0.26);
    foot.rotation.y = angle;
    group.add(foot);
  }
  return group;
}

function makeStaplerEnemy() {
  const group = new THREE.Group();
  const base = roundedBox(0.95, 0.2, 0.48, 0x495b67);
  base.position.y = 0.28;
  const arm = roundedBox(0.9, 0.23, 0.43, 0xf06a31);
  arm.position.set(0, 0.55, -0.05);
  arm.rotation.x = -0.14;
  group.add(base, arm);
  for (const x of [-0.32, 0.32]) {
    const claw = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.42, 4),
      new THREE.MeshStandardMaterial({ color: 0xd9e2e7, metalness: 0.65, roughness: 0.35 }),
    );
    claw.position.set(x, 0.25, -0.42);
    claw.rotation.x = Math.PI / 2;
    group.add(claw);
  }
  return group;
}

function makeCabinetEnemy(armored = false) {
  const group = new THREE.Group();
  const body = roundedBox(1.05, 1.55, 0.76, armored ? 0x3f5260 : 0x7b8b95);
  body.position.y = 0.8;
  group.add(body);
  for (const y of [0.36, 0.77, 1.18]) {
    const drawer = roundedBox(0.78, 0.09, 0.06, armored ? 0xff793f : 0x33414a);
    drawer.position.set(0, y, -0.4);
    group.add(drawer);
  }
  for (const x of [-0.38, 0.38]) {
    const foot = roundedBox(0.22, 0.25, 0.34, 0x25323b);
    foot.position.set(x, 0.1, 0);
    group.add(foot);
  }
  return group;
}

function makeDeskEnemy() {
  const group = new THREE.Group();
  const top = roundedBox(1.8, 0.2, 0.85, 0xb97943);
  top.position.y = 0.83;
  group.add(top);
  for (const x of [-0.68, 0.68]) {
    const leg = roundedBox(0.18, 0.8, 0.18, 0x475761);
    leg.position.set(x, 0.4, 0);
    group.add(leg);
  }
  const screen = roundedBox(0.72, 0.54, 0.1, 0x172730);
  screen.position.set(0, 1.24, 0);
  group.add(screen);
  return group;
}

function makeCopierEnemy(gold = false) {
  const group = new THREE.Group();
  const body = roundedBox(1.35, 1.62, 1.0, gold ? 0xf6b80c : 0xd9e1e5);
  body.position.y = 0.82;
  const lid = roundedBox(1.25, 0.2, 0.88, gold ? 0xffdf4e : 0x687882);
  lid.position.set(0, 1.72, -0.04);
  lid.rotation.x = -0.12;
  const slot = roundedBox(0.82, 0.16, 0.12, gold ? 0xa86500 : 0x25343d);
  slot.position.set(0, 1.16, -0.54);
  group.add(body, lid, slot);
  for (const x of [-0.43, 0.43]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.16, 14),
      new THREE.MeshStandardMaterial({ color: 0x222d34 }),
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.14, 0);
    group.add(wheel);
  }
  return group;
}

function makeGateEnemy() {
  const group = new THREE.Group();
  const body = roundedBox(2.1, 1.8, 0.45, 0x425864);
  body.position.y = 0.92;
  group.add(body);
  for (const y of [0.32, 0.74, 1.16, 1.58]) {
    const brace = roundedBox(2.3, 0.13, 0.55, y % 0.8 < 0.4 ? 0xff793f : 0x22333d);
    brace.position.set(0, y, -0.02);
    group.add(brace);
  }
  const core = roundedBox(0.5, 0.5, 0.18, 0xff9f19);
  core.position.set(0, 0.82, -0.35);
  group.add(core);
  return group;
}

function makeCoreEnemy() {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({
    color: 0x18242e,
    metalness: 0.72,
    roughness: 0.34,
  });
  const red = new THREE.MeshStandardMaterial({
    color: 0xff4437,
    emissive: 0xff291d,
    emissiveIntensity: 1.5,
    roughness: 0.3,
  });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), red);
  core.position.y = 1.25;
  core.castShadow = true;
  group.add(core);
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35 + i * 0.32, 0.09, 10, 42), dark);
    ring.position.y = 1.25;
    ring.rotation.set(i * 0.72, i * 0.56, i * 0.38);
    group.add(ring);
  }
  for (let i = 0; i < 6; i += 1) {
    const angle = i / 6 * Math.PI * 2;
    const pylon = roundedBox(0.28, 1.3, 0.28, i % 2 ? 0x445866 : 0xff704c);
    pylon.position.set(Math.sin(angle) * 1.7, 0.66, Math.cos(angle) * 1.7);
    group.add(pylon);
  }
  return group;
}

function makeEnemyModel(kind: EnemyKind, elite: boolean) {
  if (kind === "chair") return makeChairEnemy();
  if (kind === "stapler") return makeStaplerEnemy();
  if (kind === "cabinet") return makeCabinetEnemy(elite);
  if (kind === "desk") return makeDeskEnemy();
  if (kind === "copier") return makeCopierEnemy(elite);
  if (kind === "gate") return makeGateEnemy();
  return makeCoreEnemy();
}

function makeOfficeProp(kind: OfficePropKind) {
  const group = new THREE.Group();
  if (kind === "monitor") {
    const screen = roundedBox(1.18, 0.76, 0.13, 0x203440);
    screen.position.y = 0.94;
    const glow = roundedBox(0.92, 0.52, 0.04, 0x4edcff);
    glow.position.set(0, 0.94, 0.09);
    const stem = roundedBox(0.12, 0.42, 0.12, 0x778994);
    stem.position.y = 0.38;
    const base = roundedBox(0.72, 0.09, 0.42, 0x536671);
    base.position.y = 0.11;
    group.add(screen, glow, stem, base);
  } else if (kind === "paper") {
    for (let index = 0; index < 5; index += 1) {
      const bundle = roundedBox(0.9 - index * 0.05, 0.16, 0.68, index % 2 ? 0xe4edf1 : 0xffffff);
      bundle.position.set((index % 2 ? 1 : -1) * 0.07, 0.1 + index * 0.16, 0);
      bundle.rotation.y = (index - 2) * 0.08;
      group.add(bundle);
    }
  } else {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.46, 1.02, 16),
      new THREE.MeshStandardMaterial({
        color: 0x88ddff,
        transparent: true,
        opacity: 0.74,
        roughness: 0.18,
      }),
    );
    tank.position.y = 1.12;
    const stand = roundedBox(0.86, 0.72, 0.72, 0xf2f7f8);
    stand.position.y = 0.4;
    const tap = roundedBox(0.24, 0.18, 0.28, 0x2f89b4);
    tap.position.set(0, 0.68, 0.46);
    group.add(tank, stand, tap);
  }
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

function makePickup(kind: PickupKind) {
  const group = new THREE.Group();
  if (kind === "beer") {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.24, 0.72, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffaa10,
        emissive: 0x8b3a00,
        emissiveIntensity: 0.42,
      }),
    );
    group.add(glass);
    for (let i = 0; i < 5; i += 1) {
      const foam = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xfff9dc }),
      );
      foam.position.set((i - 2) * 0.1, 0.38 + (i % 2) * 0.04, 0);
      group.add(foam);
    }
  } else if (kind === "clock") {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38),
      new THREE.MeshStandardMaterial({
        color: 0x58dbff,
        emissive: 0x149dd1,
        emissiveIntensity: 0.7,
      }),
    );
    group.add(crystal);
  } else if (kind === "cap") {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.12, 18),
      new THREE.MeshStandardMaterial({
        color: 0xffca22,
        metalness: 0.52,
        roughness: 0.35,
        emissive: 0x7a4100,
        emissiveIntensity: 0.25,
      }),
    );
    cap.rotation.x = Math.PI / 2;
    group.add(cap);
  } else {
    const skewer = roundedBox(0.08, 0.82, 0.08, 0x8a4f29);
    skewer.rotation.z = -0.6;
    group.add(skewer);
    for (let i = 0; i < 3; i += 1) {
      const bite = roundedBox(0.26, 0.2, 0.22, 0xe77f38);
      bite.position.set((i - 1) * 0.18, (i - 1) * 0.26, 0);
      group.add(bite);
    }
  }
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.62, 28),
    new THREE.MeshBasicMaterial({
      color: kind === "clock" ? 0x65ddff : kind === "cap" ? 0xffcd2b : 0xffffff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.4;
  group.add(halo);
  return group;
}

function makeFloorSign(title: string, kicker: string, accent: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Group();
  context.fillStyle = "#172631";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = `#${accent.toString(16).padStart(6, "0")}`;
  context.fillRect(0, 0, 28, canvas.height);
  context.fillStyle = "#91a4af";
  context.font = "700 40px sans-serif";
  context.fillText(kicker, 70, 72);
  context.fillStyle = "#ffffff";
  context.font = "900 82px sans-serif";
  context.fillText(title, 68, 174);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 2.2),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  sign.position.set(0, 3.05, -14.78);
  return sign;
}

function healthColor(ratio: number) {
  if (ratio > 0.55) return 0x56e07a;
  if (ratio > 0.25) return 0xffc426;
  return 0xff4d3a;
}

export default function OfficeCrashRPG() {
  const hostRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const damageLayerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GameApi | null>(null);
  const joystickRef = useRef({ x: 0, z: 0 });
  const joystickPointer = useRef<number | null>(null);
  const profileRef = useRef<GameProfile>(EMPTY_PROFILE);
  const submitRunRef = useRef<(summary: RunSummary) => void>(() => {});
  const toastTimer = useRef<number | null>(null);
  const bossDialogueTimer = useRef<number | null>(null);
  const megaFlashTimer = useRef<number | null>(null);
  const tutorialTimer = useRef<number | null>(null);

  const [status, setStatus] = useState<GameStatus>("hub");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [toast, setToast] = useState("");
  const [bossDialogue, setBossDialogue] = useState("");
  const [megaFlash, setMegaFlash] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [rewardChoices, setRewardChoices] = useState<RewardChoice[]>([]);
  const [rerolls, setRerolls] = useState(1);
  const [build, setBuild] = useState<RewardChoice[]>([]);
  const [overtimeRank, setOvertimeRank] = useState<OvertimeRank>(0);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [siteData, setSiteData] = useState<SiteGameData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [fixtureBusy, setFixtureBusy] = useState<FixtureKey | null>(null);
  const [usernameDraft, setUsernameDraft] = useState(EMPTY_PROFILE.username);
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [hubPanel, setHubPanel] = useState<HubPanel>("play");
  const [tutorialVisible, setTutorialVisible] = useState(false);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1200);
  }, []);

  const showBossDialogue = useCallback((message: string, duration = 3600) => {
    setBossDialogue(message);
    if (bossDialogueTimer.current) window.clearTimeout(bossDialogueTimer.current);
    bossDialogueTimer.current = window.setTimeout(() => setBossDialogue(""), duration);
  }, []);

  const applySiteData = useCallback((data: SiteGameData) => {
    setSiteData(data);
    profileRef.current = data.profile;
    setUsernameDraft(data.profile.username || EMPTY_PROFILE.username);
    setProfileError(false);
    if ((data.profile.refundedCaps ?? 0) > 0) {
      notify(`旧強化分 ${data.profile.refundedCaps} 王冠を払い戻しました`);
    }
  }, [notify]);

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await fetch("/api/game/profile", { cache: "no-store" });
      if (!response.ok) throw new Error("profile");
      applySiteData(await response.json() as SiteGameData);
    } catch {
      setProfileError(true);
      profileRef.current = EMPTY_PROFILE;
    } finally {
      setProfileLoading(false);
    }
  }, [applySiteData]);

  useEffect(() => {
    let active = true;
    fetch("/api/game/profile", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("profile");
        return response.json() as Promise<SiteGameData>;
      })
      .then((data) => {
        if (active) applySiteData(data);
      })
      .catch(() => {
        if (active) {
          setProfileError(true);
          profileRef.current = EMPTY_PROFILE;
        }
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applySiteData]);

  const submitRun = useCallback(async (run: RunSummary) => {
    try {
      const response = await fetch("/api/game/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(run),
      });
      if (!response.ok) throw new Error("run");
      applySiteData(await response.json() as SiteGameData);
      notify("ラン記録を立ち飲み処へ保存しました");
    } catch {
      setProfileError(true);
      notify("記録は通信復旧後にもう一度挑戦してください");
    }
  }, [applySiteData, notify]);

  useEffect(() => {
    submitRunRef.current = (run) => {
      void submitRun(run);
    };
  }, [submitRun]);

  const buyFixture = async (fixture: FixtureKey) => {
    if (fixtureBusy) return;
    setFixtureBusy(fixture);
    try {
      const response = await fetch("/api/game/fixture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fixture }),
      });
      const data = await response.json() as SiteGameData & { error?: string; cost?: number };
      if (!response.ok) {
        notify(data.error === "not_enough_caps" ? `王冠キャップが足りません（必要 ${data.cost}）` : "これ以上は強化できません");
        return;
      }
      applySiteData(data);
      notify("立ち飲み処に新しい設備効果が付きました！");
    } catch {
      notify("設備の改装を保存できませんでした");
    } finally {
      setFixtureBusy(null);
    }
  };

  const saveUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (usernameBusy) return;
    setUsernameBusy(true);
    setUsernameMessage("");
    try {
      const response = await fetch("/api/game/username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: usernameDraft }),
      });
      const data = await response.json() as SiteGameData & { error?: string; maxLength?: number };
      if (!response.ok) {
        setUsernameMessage(
          data.error === "invalid_username"
            ? `ユーザーネームは${data.maxLength ?? 20}文字以内で入力してください`
            : "ユーザーネームを保存できませんでした",
        );
        return;
      }
      applySiteData(data);
      setUsernameMessage(`${data.profile.username}としてスコアボードへ参加します`);
      notify("ユーザーネームを保存しました！");
    } catch {
      setUsernameMessage("通信を確認して、もう一度保存してください");
    } finally {
      setUsernameBusy(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0xb9e7fb, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb9e7fb);
    scene.fog = new THREE.Fog(0xb9e7fb, 27, 48);

    const camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 100);
    const baseCameraPosition = new THREE.Vector3(17, 21, 21);
    camera.position.copy(baseCameraPosition);
    camera.lookAt(0, 0, -1.5);

    const hemi = new THREE.HemisphereLight(0xf3fbff, 0x705e52, 2.2);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 3.5);
    sun.position.set(-8, 18, 11);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    const accentLight = new THREE.PointLight(0x19b8ff, 2.2, 26);
    accentLight.position.set(0, 8, -8);
    scene.add(accentLight);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xe8edf0, roughness: 0.92 });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(22, 29), floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.z = -1.2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    const grid = new THREE.GridHelper(29, 29, 0x899aa3, 0xc1ccd0);
    grid.position.set(0, 0.015, -1.2);
    scene.add(grid);

    const backWall = roundedBox(22, 4.8, 0.25, 0xf4f0e9);
    backWall.position.set(0, 2.4, -15);
    scene.add(backWall);
    const rightWall = roundedBox(0.25, 4.8, 29, 0xf5f1eb);
    rightWall.position.set(11, 2.4, -1.2);
    scene.add(rightWall);
    for (let i = 0; i < 7; i += 1) {
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.7, 3.1),
        new THREE.MeshStandardMaterial({
          color: 0x91d9f8,
          emissive: 0x42b2df,
          emissiveIntensity: 0.24,
          roughness: 0.08,
        }),
      );
      pane.position.set(-10.88, 2.65, -12.8 + i * 4);
      pane.rotation.y = Math.PI / 2;
      scene.add(pane);
    }

    const player = makeSobaya();
    player.position.set(0, 0, 9.6);
    scene.add(player);

    const equipmentRack = new THREE.Group();
    equipmentRack.position.y = 3.75;
    player.add(equipmentRack);
    const textureLoader = new THREE.TextureLoader();
    const equipmentSprites = new Map<UpgradeId, THREE.Sprite>();
    for (const upgrade of UPGRADES) {
      const texture = textureLoader.load(upgrade.image);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.renderOrder = 30;
      equipmentRack.add(sprite);
      equipmentSprites.set(upgrade.id, sprite);
    }

    const enemies: Enemy[] = [];
    const pickups: Pickup[] = [];
    const debris: Debris[] = [];
    const effects: Effect[] = [];
    const hazards: Hazard[] = [];
    const dizzyBosses: DizzyBoss[] = [];
    const megaProjectiles: MegaProjectile[] = [];
    const timedVisuals: TimedVisual[] = [];
    const stageObjects: THREE.Object3D[] = [];
    const officeProps: OfficeProp[] = [];
    let physicsRuntime: OfficePhysicsRuntime | null = null;
    let physicsDisposed = false;
    let physicsTheme = {
      accent: FLOORS[0].accent,
      darkFloor: false,
    };
    const upgradeValues = Object.fromEntries(
      UPGRADES.map((upgrade) => [upgrade.id, 0]),
    ) as Record<UpgradeId, number>;
    const updateEquipmentVisuals = () => {
      const equipped = UPGRADES.filter((upgrade) => upgradeValues[upgrade.id] > 0);
      for (const sprite of equipmentSprites.values()) sprite.visible = false;
      equipped.forEach((upgrade, index) => {
        const sprite = equipmentSprites.get(upgrade.id);
        if (!sprite) return;
        const level = upgradeValues[upgrade.id];
        sprite.visible = true;
        sprite.position.set((index - (equipped.length - 1) / 2) * 0.86, Math.sin(index * 1.7) * 0.12, 0);
        sprite.scale.setScalar(0.72 + level * 0.12);
        (sprite.material as THREE.SpriteMaterial).opacity = 0.78 + level * 0.07;
      });
    };

    const showDamageNumber = (
      amount: number,
      worldPosition: THREE.Vector3,
      style: DamageNumberStyle = "normal",
      critical = false,
      vulnerabilityMultiplier = 1,
    ) => {
      const layer = damageLayerRef.current;
      if (!layer || amount <= 0) return;
      const projected = worldPosition.clone().project(camera);
      if (
        projected.z < -1.15
        || projected.z > 1.15
        || Math.abs(projected.x) > 1.18
        || Math.abs(projected.y) > 1.18
      ) return;

      while (layer.childElementCount >= 60) layer.firstElementChild?.remove();
      const damage = document.createElement("span");
      damage.className = [
        "rpg-damage-number",
        style !== "normal" ? style : "",
        critical ? "critical" : "",
      ].filter(Boolean).join(" ");
      const displayedAmount = amount * DAMAGE_DISPLAY_MULTIPLIER;
      damage.textContent = displayedAmount < 10
        ? displayedAmount.toFixed(1)
        : formatNumber(displayedAmount);
      const labels = [];
      if (style === "mega") labels.push("MEGA HIT");
      if (style === "splash") labels.push("泡連鎖");
      if (style === "kinetic") labels.push("PHYSICS HIT");
      if (critical) labels.push("CRITICAL");
      if (vulnerabilityMultiplier > 1) labels.push(`WEAK ×${vulnerabilityMultiplier.toFixed(2)}`);
      if (labels.length > 0) damage.dataset.label = labels.join(" · ");
      damage.style.left = `${(projected.x * 0.5 + 0.5) * layer.clientWidth}px`;
      damage.style.top = `${(-projected.y * 0.5 + 0.5) * layer.clientHeight}px`;
      const drift = Math.round((Math.random() - 0.5) * 52);
      damage.style.setProperty("--damage-drift-early", `${Math.round(drift * 0.18)}px`);
      damage.style.setProperty("--damage-drift-mid", `${Math.round(drift * 0.72)}px`);
      damage.style.setProperty("--damage-drift", `${drift}px`);
      damage.style.setProperty("--damage-tilt", `${(Math.random() - 0.5) * 9}deg`);
      layer.appendChild(damage);
      damage.addEventListener("animationend", () => damage.remove(), { once: true });
      window.setTimeout(() => damage.remove(), 1200);
    };

    let audioContext: AudioContext | null = null;
    let audioResume: Promise<AudioContext> | null = null;
    let detachAudioState: (() => void) | null = null;
    let audioPrimed = false;
    let soundEnabled = true;
    type SafariAudioContextState = AudioContextState | "interrupted";
    const getAudioState = (context: AudioContext) => context.state as SafariAudioContextState;
    const ensureAudioContext = () => {
      if (!audioContext) {
        const AudioContextConstructor = window.AudioContext
          ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) throw new Error("Web Audio is unavailable");
        const context = new AudioContextConstructor({ latencyHint: "interactive" });
        const onAudioStateChange = () => {
          const state = getAudioState(context);
          if (state === "running") {
            setAudioReady(true);
            setAudioError(false);
          } else {
            setAudioReady(false);
            if (state === "suspended" || state === "interrupted") audioPrimed = false;
          }
        };
        context.addEventListener("statechange", onAudioStateChange);
        detachAudioState = () => context.removeEventListener("statechange", onAudioStateChange);
        audioContext = context;
      }
      return audioContext;
    };
    const primeAudioContext = (context: AudioContext) => {
      if (audioPrimed && getAudioState(context) === "running") return;
      try {
        const buffer = context.createBuffer(1, 1, context.sampleRate);
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        source.connect(gain).connect(context.destination);
        source.start(0);
        source.stop(context.currentTime + 0.01);
        audioPrimed = true;
      } catch {
        audioPrimed = false;
      }
    };
    const resumeAudio = () => {
      let context: AudioContext;
      try {
        context = ensureAudioContext();
      } catch {
        setAudioReady(false);
        setAudioError(true);
        return Promise.reject(new Error("Web Audio is unavailable"));
      }
      if (getAudioState(context) === "running") {
        setAudioReady(true);
        setAudioError(false);
        return Promise.resolve(context);
      }
      audioResume ??= context.resume()
        .then(() => {
          if (getAudioState(context) !== "running") throw new Error("AudioContext did not start");
          setAudioReady(true);
          setAudioError(false);
          return context;
        })
        .catch((error) => {
          setAudioReady(false);
          setAudioError(true);
          throw error;
        })
        .finally(() => {
          audioResume = null;
        });
      return audioResume;
    };
    const activateAudio = () => {
      let context: AudioContext;
      try {
        context = ensureAudioContext();
        // iOS Safari requires a source to be started synchronously inside the tap.
        primeAudioContext(context);
      } catch {
        setAudioReady(false);
        setAudioError(true);
        return Promise.reject(new Error("Web Audio is unavailable"));
      }
      return resumeAudio().then((runningContext) => {
        primeAudioContext(runningContext);
        return runningContext;
      });
    };
    const withAudio = (callback: (context: AudioContext) => void) => {
      if (!soundEnabled) return;
      let context: AudioContext;
      try {
        context = ensureAudioContext();
      } catch {
        setAudioReady(false);
        setAudioError(true);
        return;
      }
      if (getAudioState(context) === "running") {
        callback(context);
        return;
      }
      void activateAudio().then(callback).catch(() => {
        // The visible sound-test button lets the player retry with a fresh gesture.
      });
    };
    const tone = (
      frequency: number,
      duration: number,
      type: OscillatorType = "sine",
      gainValue = 0.07,
      endFrequency = frequency,
      delay = 0,
    ) => {
      if (!soundEnabled) return;
      withAudio((context) => {
        const at = context.currentTime + delay;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, at);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), at + duration);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + duration + 0.03);
      });
    };
    const noise = (duration: number, gainValue: number, highpass = 120) => {
      if (!soundEnabled) return;
      withAudio((context) => {
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        filter.type = "highpass";
        filter.frequency.value = highpass;
        gain.gain.setValueAtTime(gainValue, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
        source.buffer = buffer;
        source.connect(filter).connect(gain).connect(context.destination);
        source.start();
      });
    };
    const playSound = (kind: "smash" | "break" | "metal" | "beer" | "hurt" | "clear" | "start") => {
      if (kind === "smash") {
        noise(0.11, 0.11, 180);
        tone(115, 0.15, "sawtooth", 0.075, 48);
      } else if (kind === "break") {
        noise(0.22, 0.15, 110);
        tone(86, 0.18, "square", 0.065, 42);
      } else if (kind === "metal") {
        noise(0.15, 0.08, 900);
        tone(710, 0.2, "square", 0.045, 380);
      } else if (kind === "beer") {
        tone(440, 0.12, "sine", 0.06, 660);
        tone(660, 0.15, "triangle", 0.06, 990, 0.1);
        tone(990, 0.18, "sine", 0.045, 1320, 0.2);
      } else if (kind === "hurt") {
        noise(0.16, 0.08, 160);
        tone(190, 0.2, "sawtooth", 0.055, 70);
      } else if (kind === "clear") {
        tone(440, 0.13, "square", 0.05, 660);
        tone(660, 0.14, "square", 0.055, 880, 0.12);
        tone(880, 0.28, "triangle", 0.06, 1320, 0.24);
      } else {
        tone(330, 0.12, "square", 0.05, 440);
        tone(550, 0.18, "square", 0.055, 770, 0.12);
      }
    };

    const runtime = {
      playing: false,
      paused: false,
      submitted: false,
      elapsed: 0,
      floor: 1,
      score: 0,
      hp: 100,
      maxHp: 100,
      combo: 0,
      comboWindow: 0,
      maxCombo: 0,
      destroyed: 0,
      mega: 0,
      megaGauge: 0,
      runCaps: 0,
      overtimeRank: 0 as OvertimeRank,
      pressure: 0,
      rushUntil: 0,
      rushTriggered: false,
      kineticChain: 0,
      kineticChainUntil: 0,
      lastKineticToast: -10,
      lastKineticSweep: -10,
      rerolls: 1,
      mealReady: false,
      trayRescueReady: false,
      floorKilled: 0,
      floorTotal: 0,
      floorQuota: 0,
      timer: null as number | null,
      lastSmash: -10,
      lastMega: -10,
      lastBump: -10,
      lastDash: -10,
      megaLockUntil: 0,
      invulnerableUntil: 0,
      freezeUntil: 0,
      shake: 0,
      pendingSmash: null as { at: number; center: THREE.Vector3 } | null,
      pendingMega: null as {
        at: number;
        origin: THREE.Vector3;
        direction: THREE.Vector3;
      } | null,
      profile: EMPTY_PROFILE,
      guestBoss: "yotan" as CharacterBossId,
      lastBossDefeat: "",
      pendingFloorClear: false,
      selected: [] as RewardChoice[],
    };

    if (!import.meta.env.SSR) {
      void import("./game-physics")
        .then(({ OfficePhysicsRuntime: PhysicsRuntime }) => PhysicsRuntime.create(scene))
        .then((created) => {
          if (physicsDisposed) {
            created.dispose();
            return;
          }
          physicsRuntime = created;
          if (runtime.playing) {
            created.spawnPlayground(physicsTheme.accent, physicsTheme.darkFloor);
          }
          notify("RAPIER × KOOTA ONLINE");
        })
        .catch(() => {
          notify("物理演算を軽量モードで開始");
        });
    }

    const stageAdd = (object: THREE.Object3D) => {
      scene.add(object);
      stageObjects.push(object);
    };

    const removeDisposableObject = (object: THREE.Object3D) => {
      scene.remove(object);
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
      });
    };

    const clearStage = () => {
      physicsRuntime?.clear();
      for (const enemy of enemies) {
        scene.remove(enemy.group);
        if (enemy.attackWarning) removeDisposableObject(enemy.attackWarning);
      }
      for (const pickup of pickups) scene.remove(pickup.group);
      for (const object of stageObjects) scene.remove(object);
      enemies.length = 0;
      pickups.length = 0;
      stageObjects.length = 0;
      officeProps.length = 0;
      for (const piece of debris) scene.remove(piece.mesh);
      debris.length = 0;
      for (const effect of effects) scene.remove(effect.mesh);
      effects.length = 0;
      for (const hazard of hazards) removeDisposableObject(hazard.warning);
      hazards.length = 0;
      for (const projectile of megaProjectiles) {
        removeDisposableObject(projectile.group);
        removeDisposableObject(projectile.lane);
      }
      megaProjectiles.length = 0;
      for (const visual of timedVisuals) removeDisposableObject(visual.object);
      timedVisuals.length = 0;
      dizzyBosses.length = 0;
    };

    const spawnDebris = (position: THREE.Vector3, color: number, amount: number) => {
      if (physicsRuntime) {
        physicsRuntime.spawnDebrisBurst(position, color, amount, {
          force: amount >= 30 ? 12 : amount >= 18 ? 9 : 6.5,
          mega: amount >= 30,
        });
        return;
      }
      for (let i = 0; i < amount; i += 1) {
        const size = 0.1 + Math.random() * 0.26;
        const piece = new THREE.Mesh(
          new THREE.BoxGeometry(size, size * (0.6 + Math.random()), size),
          new THREE.MeshStandardMaterial({
            color: i % 5 === 0 ? 0xfff5dc : color,
            roughness: 0.84,
            transparent: true,
          }),
        );
        piece.position.copy(position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          0.35 + Math.random() * 0.9,
          (Math.random() - 0.5) * 0.8,
        ));
        piece.castShadow = true;
        scene.add(piece);
        debris.push({
          mesh: piece,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 5.8,
            2.8 + Math.random() * 4.8,
            (Math.random() - 0.5) * 5.8,
          ),
          spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
          life: 1.1 + Math.random() * 0.9,
        });
      }
    };

    const spawnWave = (position: THREE.Vector3, color: number, size = 1) => {
      const wave = new THREE.Mesh(
        new THREE.RingGeometry(0.38, 0.57, 42),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        }),
      );
      wave.rotation.x = -Math.PI / 2;
      wave.position.copy(position);
      wave.position.y = 0.08;
      wave.scale.setScalar(size);
      scene.add(wave);
      effects.push({ mesh: wave, life: 0.46, maxLife: 0.46 });
    };

    const addTimedVisual = (object: THREE.Object3D, life: number, spin = 1.8) => {
      scene.add(object);
      timedVisuals.push({ object, life, maxLife: life, spin });
    };

    const spawnBossAttackVisual = (hazard: Hazard) => {
      if (!hazard.sourceBoss) return;
      const definition = WINDOW_BOSSES[hazard.sourceBoss];
      const group = new THREE.Group();
      group.position.copy(hazard.position).setY(0);

      if (hazard.shape === "beam") {
        group.rotation.y = Math.atan2(hazard.direction.x, hazard.direction.z);
        const glowMaterial = new THREE.MeshStandardMaterial({
          color: definition.color,
          emissive: definition.color,
          emissiveIntensity: hazard.sourceBoss === "okayaman" ? 3.2 : 2.1,
          transparent: true,
          opacity: hazard.sourceBoss === "okayaman" ? 0.42 : 0.3,
          depthWrite: false,
          roughness: 0.08,
        });
        const glow = new THREE.Mesh(
          new THREE.BoxGeometry(
            hazard.width * (hazard.sourceBoss === "okayaman" ? 1.5 : 1.18),
            hazard.sourceBoss === "okayaman" ? 0.62 : 0.38,
            hazard.length,
          ),
          glowMaterial,
        );
        glow.position.set(0, hazard.sourceBoss === "okayaman" ? 1.05 : 0.72, hazard.length / 2);
        const core = new THREE.Mesh(
          new THREE.BoxGeometry(
            Math.max(0.22, hazard.width * (hazard.sourceBoss === "okayaman" ? 0.48 : 0.34)),
            hazard.sourceBoss === "okayaman" ? 0.38 : 0.24,
            hazard.length,
          ),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.96,
            depthWrite: false,
          }),
        );
        core.position.copy(glow.position);
        group.add(glow, core);

        const muzzle = new THREE.Mesh(
          new THREE.TorusGeometry(
            hazard.width * (hazard.sourceBoss === "okayaman" ? 0.72 : 0.48),
            hazard.sourceBoss === "okayaman" ? 0.16 : 0.1,
            10,
            36,
          ),
          new THREE.MeshBasicMaterial({
            color: hazard.sourceBoss === "okayaman" ? 0xfff3a1 : definition.color,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
          }),
        );
        muzzle.position.y = glow.position.y;
        group.add(muzzle);

        if (hazard.sourceBoss === "okayaman") {
          for (const side of [-1, 1]) {
            const rail = new THREE.Mesh(
              new THREE.BoxGeometry(0.11, 0.13, hazard.length),
              new THREE.MeshBasicMaterial({
                color: 0xff6b3d,
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
              }),
            );
            rail.position.set(side * hazard.width * 0.62, 1.05, hazard.length / 2);
            group.add(rail);
          }
          tone(82, 0.38, "sawtooth", 0.07, 720);
          tone(760, 0.22, "square", 0.055, 1480, 0.08);
          runtime.shake = Math.max(runtime.shake, 0.62);
        } else {
          tone(150, 0.24, "sawtooth", 0.045, 880);
          runtime.shake = Math.max(runtime.shake, 0.36);
        }
        addTimedVisual(group, hazard.sourceBoss === "okayaman" ? 0.52 : 0.38, 0);
        spawnWave(hazard.position, definition.color, hazard.sourceBoss === "okayaman" ? 1.75 : 1.2);
        return;
      }

      const radius = Math.max(0.7, hazard.radius);
      const burstMaterial = new THREE.MeshStandardMaterial({
        color: definition.color,
        emissive: definition.color,
        emissiveIntensity: 2.2,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        roughness: 0.12,
      });
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.2, radius * 0.48, 3.4, 18, 1, true),
        burstMaterial,
      );
      column.position.y = 1.7;
      const impactRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.74, Math.max(0.08, radius * 0.07), 10, 40),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      );
      impactRing.rotation.x = Math.PI / 2;
      impactRing.position.y = 0.16;
      group.add(column, impactRing);
      for (let index = 0; index < 10; index += 1) {
        const angle = index / 10 * Math.PI * 2;
        const spark = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1 + radius * 0.16, 0.1),
          new THREE.MeshBasicMaterial({
            color: index % 2 === 0 ? 0xffffff : definition.color,
            transparent: true,
            opacity: 0.9,
          }),
        );
        spark.position.set(
          Math.cos(angle) * radius * 0.78,
          0.55 + (index % 3) * 0.28,
          Math.sin(angle) * radius * 0.78,
        );
        spark.rotation.z = angle;
        group.add(spark);
      }
      addTimedVisual(group, 0.48, 3.4);
      spawnWave(hazard.position, definition.color, radius * 0.6);
      spawnWave(hazard.position, 0xffffff, radius * 0.38);
      tone(hazard.sourceBoss === "yotan" ? 170 : 240, 0.2, "sawtooth", 0.045, 920);
      runtime.shake = Math.max(runtime.shake, 0.4);
    };

    const makeMegaMugProjectile = () => {
      const group = new THREE.Group();
      const amber = new THREE.MeshStandardMaterial({
        color: 0xffa20d,
        emissive: 0xff5a00,
        emissiveIntensity: 1.25,
        metalness: 0.2,
        roughness: 0.18,
        transparent: true,
        opacity: 0.92,
      });
      const white = new THREE.MeshBasicMaterial({ color: 0xfffbd0 });
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.76, 16), amber);
      mug.position.y = 0.42;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.075, 8, 18, Math.PI * 1.55), amber.clone());
      handle.position.set(0.38, 0.46, 0);
      handle.rotation.z = Math.PI / 2;
      for (let index = 0; index < 5; index += 1) {
        const foam = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), white.clone());
        const angle = index / 5 * Math.PI * 2;
        foam.position.set(Math.cos(angle) * 0.2, 0.82, Math.sin(angle) * 0.2);
        group.add(foam);
      }
      const aura = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.08, 10, 28),
        new THREE.MeshBasicMaterial({
          color: 0xffee65,
          transparent: true,
          opacity: 0.78,
        }),
      );
      aura.rotation.x = Math.PI / 2;
      aura.position.y = 0.42;
      aura.name = "MegaMugAura";
      group.add(mug, handle, aura);
      const light = new THREE.PointLight(0xffa51f, 5.5, 9);
      light.position.y = 0.5;
      group.add(light);
      group.scale.setScalar(1.35);
      return group;
    };

    const makeMegaLane = (
      origin: THREE.Vector3,
      direction: THREE.Vector3,
      distance: number,
      width: number,
    ) => {
      const group = new THREE.Group();
      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.035, distance),
        new THREE.MeshBasicMaterial({
          color: 0xffa30d,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        }),
      );
      glow.position.z = distance / 2;
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.055, distance),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        }),
      );
      core.position.set(0, 0.02, distance / 2);
      group.add(glow, core);
      group.position.copy(origin).setY(0.07);
      group.rotation.y = Math.atan2(direction.x, direction.z);
      scene.add(group);
      return group;
    };

    const spawnMegaTrail = (position: THREE.Vector3) => {
      const group = new THREE.Group();
      for (let index = 0; index < 5; index += 1) {
        const bubble = new THREE.Mesh(
          new THREE.SphereGeometry(0.08 + Math.random() * 0.13, 8, 6),
          new THREE.MeshBasicMaterial({
            color: index % 2 === 0 ? 0xffffff : 0xffc21d,
            transparent: true,
            opacity: 0.82,
          }),
        );
        bubble.position.copy(position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.75,
          (Math.random() - 0.5) * 0.55,
          (Math.random() - 0.5) * 0.75,
        ));
        group.add(bubble);
      }
      addTimedVisual(group, 0.38);
    };

    const makeDangerZone = (
      position: THREE.Vector3,
      radius: number,
      color: number,
      bossWarning = false,
    ) => {
      const warningColor = bossWarning ? BOSS_WARNING_COLOR : color;
      const group = new THREE.Group();
      const fill = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 48),
        new THREE.MeshBasicMaterial({
          color: warningColor,
          transparent: true,
          opacity: bossWarning ? 0.24 : 0.18,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      fill.rotation.x = -Math.PI / 2;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.86, radius, 48),
        new THREE.MeshBasicMaterial({
          color: warningColor,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.015;
      group.add(fill, ring);
      if (bossWarning) {
        const reticle = new THREE.Group();
        const reticleMaterial = new THREE.MeshBasicMaterial({
          color: 0xff3650,
          transparent: true,
          opacity: 0.96,
          depthWrite: false,
        });
        const innerRing = new THREE.Mesh(
          new THREE.RingGeometry(radius * 0.5, radius * 0.6, 32),
          reticleMaterial,
        );
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = 0.025;
        reticle.add(innerRing);
        for (let index = 0; index < 4; index += 1) {
          const angle = index / 4 * Math.PI * 2;
          const marker = new THREE.Mesh(
            new THREE.BoxGeometry(radius * 0.34, 0.035, Math.max(0.08, radius * 0.07)),
            reticleMaterial.clone(),
          );
          marker.position.set(
            Math.cos(angle) * radius * 0.73,
            0.028,
            Math.sin(angle) * radius * 0.73,
          );
          marker.rotation.y = -angle;
          reticle.add(marker);
        }
        group.add(reticle);
        group.userData.reticle = reticle;
        group.userData.bossWarning = true;
      }
      group.position.copy(position);
      group.position.y = 0.055;
      group.userData.fill = fill;
      group.userData.ring = ring;
      scene.add(group);
      return group;
    };

    const makeBeamZone = (
      position: THREE.Vector3,
      direction: THREE.Vector3,
      length: number,
      width: number,
      color: number,
      bossWarning = false,
    ) => {
      const warningColor = bossWarning ? BOSS_WARNING_COLOR : color;
      const group = new THREE.Group();
      const fill = roundedBox(width, 0.035, length, warningColor);
      const material = fill.material as THREE.MeshStandardMaterial;
      material.transparent = true;
      material.opacity = bossWarning ? 0.27 : 0.2;
      material.depthWrite = false;
      fill.position.z = length / 2;
      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: warningColor,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });
      const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, length), edgeMaterial);
      const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, length), edgeMaterial.clone());
      leftEdge.position.set(-width / 2, 0.02, length / 2);
      rightEdge.position.set(width / 2, 0.02, length / 2);
      group.add(fill, leftEdge, rightEdge);
      if (bossWarning) {
        const core = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(0.1, width * 0.08), 0.05, length),
          new THREE.MeshBasicMaterial({
            color: 0xffd8dd,
            transparent: true,
            opacity: 0.92,
            depthWrite: false,
          }),
        );
        core.position.set(0, 0.035, length / 2);
        group.add(core);
        group.userData.core = core;
        group.userData.bossWarning = true;
      }
      group.position.copy(position).setY(0.055);
      group.rotation.y = Math.atan2(direction.x, direction.z);
      group.userData.fill = fill;
      group.userData.edges = [leftEdge, rightEdge];
      group.userData.beam = true;
      scene.add(group);
      return group;
    };

    const animateDangerZone = (
      warning: THREE.Group,
      startedAt: number,
      triggerAt: number,
      elapsed: number,
    ) => {
      const progress = THREE.MathUtils.clamp(
        (elapsed - startedAt) / Math.max(0.01, triggerAt - startedAt),
        0,
        1,
      );
      const pulse = 0.72 + Math.sin(elapsed * (12 + progress * 18)) * 0.18;
      if (!warning.userData.beam) warning.scale.setScalar(0.92 + progress * 0.08);
      const fill = warning.userData.fill as THREE.Mesh | undefined;
      const ring = warning.userData.ring as THREE.Mesh | undefined;
      const edges = warning.userData.edges as THREE.Mesh[] | undefined;
      const reticle = warning.userData.reticle as THREE.Group | undefined;
      const core = warning.userData.core as THREE.Mesh | undefined;
      if (fill) {
        const material = fill.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
        material.opacity = 0.12 + progress * 0.24;
      }
      if (ring) (ring.material as THREE.MeshBasicMaterial).opacity = pulse;
      if (reticle) {
        reticle.rotation.y = elapsed * (1.8 + progress * 2.4);
        reticle.scale.setScalar(0.9 + progress * 0.12 + Math.sin(elapsed * 18) * 0.025);
      }
      if (core) {
        (core.material as THREE.MeshBasicMaterial).opacity = 0.55 + progress * 0.4;
        core.scale.x = 0.7 + progress * 0.65;
      }
      edges?.forEach((edge) => {
        (edge.material as THREE.MeshBasicMaterial).opacity = pulse;
      });
    };

    const addHazard = (
      position: THREE.Vector3,
      radius: number,
      damage: number,
      delay: number,
      color: number,
      sourceBoss: CharacterBossId | null = null,
      bossWarning = false,
    ) => {
      const warning = makeDangerZone(position, radius, color, bossWarning);
      hazards.push({
        shape: "circle",
        warning,
        position: position.clone().setY(0),
        radius,
        direction: new THREE.Vector3(),
        length: 0,
        width: 0,
        damage,
        startedAt: runtime.elapsed,
        triggerAt: runtime.elapsed + delay,
        color,
        sourceBoss,
      });
    };

    const addBeamHazard = (
      position: THREE.Vector3,
      direction: THREE.Vector3,
      length: number,
      width: number,
      damage: number,
      delay: number,
      color: number,
      sourceBoss: CharacterBossId | null = null,
      bossWarning = false,
    ) => {
      const normalized = direction.clone().setY(0).normalize();
      const warning = makeBeamZone(position, normalized, length, width, color, bossWarning);
      hazards.push({
        shape: "beam",
        warning,
        position: position.clone().setY(0),
        radius: 0,
        direction: normalized,
        length,
        width,
        damage,
        startedAt: runtime.elapsed,
        triggerAt: runtime.elapsed + delay,
        color,
        sourceBoss,
      });
    };

    const addPickup = (kind: PickupKind, position: THREE.Vector3) => {
      const group = makePickup(kind);
      group.position.copy(position);
      group.position.y = 0.75;
      scene.add(group);
      pickups.push({ group, kind, baseY: 0.75, active: true });
    };

    const spawnEnemy = (
      kind: EquipmentEnemyKind,
      x: number,
      z: number,
      options: {
        elite?: boolean;
        boss?: boolean;
        stationary?: boolean;
        scale?: number;
        hp?: number;
        label?: string;
      } = {},
    ) => {
      const floorDefinition = FLOORS[runtime.floor - 1];
      const overtime = OVERTIME_RANKS[runtime.overtimeRank];
      const elite = options.elite ?? false;
      const boss = options.boss ?? false;
      const affixes: EliteAffix[] = ["rapid", "barrier", "volatile", "regenerator"];
      const affix = elite && !boss
        ? affixes[Math.floor(Math.random() * affixes.length)]
        : null;
      const affixLabel = {
        rapid: "快速",
        barrier: "装甲",
        volatile: "余熱",
        regenerator: "再生",
      } as const;
      const affixColor = {
        rapid: 0xffa51f,
        barrier: 0x45d8ff,
        volatile: 0xff4d3a,
        regenerator: 0x56e07a,
      } as const;
      const group = makeEnemyModel(kind, elite || boss);
      const scale = options.scale ?? (elite ? 1.18 : 1);
      group.scale.setScalar(scale);
      group.position.set(x, 0, z);
      group.rotation.y = Math.random() * Math.PI * 2;
      const baseHp = options.hp ?? (1.55 + runtime.floor * 0.48) * (elite ? 2.05 : 1);
      const stats = {
        chair: { speed: 2.4, damage: 7, radius: 0.62, points: 190, color: 0x2c92da, label: "回転アーロンチュア" },
        stapler: { speed: 3.05, damage: 6, radius: 0.52, points: 170, color: 0xf06a31, label: "ホチキスガニ" },
        cabinet: { speed: 1.25, damage: 11, radius: 0.72, points: 260, color: 0x7b8b95, label: "キャビネットゴーレム" },
        desk: { speed: 1.65, damage: 9, radius: 0.95, points: 230, color: 0xb97943, label: "会議机ムカデ" },
        copier: { speed: boss ? 0.9 : 1.45, damage: boss ? 12 : 10, radius: boss ? 1.45 : 0.82, points: boss ? 6500 : 330, color: boss ? 0xf6b80c : 0xd9e1e5, label: boss ? "金の複合機・零式" : "複合機タンク" },
        gate: { speed: 1.1, damage: 14, radius: 1.15, points: 560, color: 0x425864, label: "強化ゲートΩ" },
        core: { speed: 0.92, damage: 22, radius: 1.65, points: 15000, color: 0xff4437, label: "REGULATION CORE" },
      }[kind];
      const baseFinalHp = (boss ? (kind === "core" ? 125 : 50) : baseHp) * overtime.hpMultiplier;
      const barrier = affix === "barrier" ? baseFinalHp * 0.5 : 0;
      const hp = baseFinalHp + barrier;
      const health = makeHealthBar(boss ? 3.2 : elite ? 1.65 : 1.1, boss ? floorDefinition.accent : 0x56e07a);
      health.position.y = kind === "core" ? 3.4 : boss ? 3.25 : kind === "cabinet" || kind === "gate" ? 2.25 : 1.85;
      health.rotation.x = -0.35;
      if (elite || boss) group.add(health);
      if (affix) {
        const aura = new THREE.Mesh(
          new THREE.TorusGeometry(stats.radius * 1.25, 0.075, 8, 28),
          new THREE.MeshBasicMaterial({
            color: affixColor[affix],
            transparent: true,
            opacity: 0.86,
          }),
        );
        aura.rotation.x = Math.PI / 2;
        aura.position.y = 0.12;
        group.add(aura);
      }
      scene.add(group);
      enemies.push({
        group,
        kind,
        label: `${affix ? `【${affixLabel[affix]}】` : ""}${options.label ?? stats.label}`,
        hp,
        maxHp: hp,
        speed: options.stationary
          ? 0
          : stats.speed * (1 + runtime.floor * 0.025) * overtime.speedMultiplier * (affix === "rapid" ? 1.38 : 1),
        damage: options.stationary
          ? 0
          : (stats.damage + runtime.floor * 0.72) * overtime.damageMultiplier * 0.78,
        radius: stats.radius * scale,
        points: Math.round(stats.points * (elite ? 1.6 : 1)),
        color: stats.color,
        alive: true,
        boss,
        characterBoss: null,
        elite,
        affix,
        barrier,
        lastRegen: runtime.elapsed,
        frozenUntil: 0,
        nextAttack: runtime.elapsed + 0.9 + Math.random() * 0.65,
        pulseAt: runtime.elapsed + (kind === "core" ? 3.1 : 3.8),
        attackKind: null,
        attackStartedAt: 0,
        attackAt: 0,
        attackOrigin: new THREE.Vector3(),
        attackRadius: 0,
        attackWarning: null,
        vulnerableFrom: 0,
        vulnerableUntil: 0,
        phase: 1,
        offscreenSince: null,
        healthFill: health.userData.fill as THREE.Mesh,
      });
    };

    const makeBossFallback = (color: number) => {
      const fallback = new THREE.Group();
      const body = roundedBox(1.35, 2.1, 0.9, color);
      body.position.y = 1.2;
      const head = roundedBox(1.2, 1.2, 1.05, 0xffc99e);
      head.position.y = 2.7;
      fallback.add(body, head);
      return fallback;
    };

    const spawnCharacterBoss = (
      id: CharacterBossId,
      x: number,
      z: number,
      openingDelay = 0,
    ) => {
      const definition = WINDOW_BOSSES[id];
      const overtime = OVERTIME_RANKS[runtime.overtimeRank];
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = Math.PI;

      const health = makeHealthBar(3.5, definition.color);
      health.position.y = definition.healthY;
      health.rotation.x = -0.35;
      group.add(health);

      loadVoxelCharacter({
        definition: definition.model,
        parent: group,
        onReady: ({ mixer, actions }) => {
          group.userData.mixer = mixer;
          group.userData.animator = actions;
        },
        onError: () => {
          group.add(makeBossFallback(definition.color));
        },
      });

      scene.add(group);
      const hp = definition.hp * overtime.hpMultiplier;
      enemies.push({
        group,
        kind: "character",
        label: `${definition.title}｜${definition.displayName}`,
        hp,
        maxHp: hp,
        speed: definition.speed * overtime.speedMultiplier,
        damage: definition.damage * overtime.damageMultiplier,
        radius: definition.radius,
        points: definition.points,
        color: definition.color,
        alive: true,
        boss: true,
        characterBoss: id,
        elite: true,
        affix: null,
        barrier: 0,
        lastRegen: runtime.elapsed,
        frozenUntil: 0,
        nextAttack: runtime.elapsed + 1.8 + openingDelay,
        pulseAt: runtime.elapsed + (id === "okayaman" ? 2.6 : 3.1) + openingDelay,
        attackKind: null,
        attackStartedAt: 0,
        attackAt: 0,
        attackOrigin: new THREE.Vector3(),
        attackRadius: 0,
        attackWarning: null,
        vulnerableFrom: 0,
        vulnerableUntil: 0,
        phase: 1,
        offscreenSince: null,
        healthFill: health.userData.fill as THREE.Mesh,
      });
      group.userData.healthBar = health;
    };

    const pickFinalBossGuests = (count: number) => {
      const pool = [...MID_BOSS_ROTATION];
      for (let index = pool.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
      }
      return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
    };

    const formationSpawnPoints = (
      count: number,
      formation: "ranks" | "ring" | "cross" | "lanes",
      compact = false,
    ) => {
      const points: Array<[number, number]> = [];
      if (formation === "ring") {
        let ring = 0;
        while (points.length < count) {
          const radiusX = (compact ? 3.6 : 4.6) + ring * 1.65;
          const radiusZ = (compact ? 3.1 : 3.9) + ring * 1.35;
          const members = 10 + ring * 6;
          for (let index = 0; index < members && points.length < count; index += 1) {
            const angle = index / members * Math.PI * 2 + ring * 0.22;
            points.push([
              THREE.MathUtils.clamp(Math.cos(angle) * radiusX, -8.2, 8.2),
              THREE.MathUtils.clamp(-2.1 + Math.sin(angle) * radiusZ, -11.2, 5.4),
            ]);
          }
          ring += 1;
        }
      } else if (formation === "cross") {
        let step = 0;
        while (points.length < count) {
          const distance = 1.2 + step * 1.18;
          const candidates: Array<[number, number]> = [
            [distance, -2.1],
            [-distance, -2.1],
            [0, -2.1 + distance],
            [0, -2.1 - distance],
            [distance * 0.72, -2.1 + distance * 0.72],
            [-distance * 0.72, -2.1 - distance * 0.72],
          ];
          for (const [x, z] of candidates) {
            if (points.length >= count) break;
            points.push([
              THREE.MathUtils.clamp(x, -8.2, 8.2),
              THREE.MathUtils.clamp(z, -11.2, 5.3),
            ]);
          }
          step += 1;
        }
      } else {
        const columns = formation === "lanes" ? 5 : 7;
        const spacingX = formation === "lanes" ? 2.6 : 2.25;
        const spacingZ = compact ? 1.3 : 1.7;
        for (let index = 0; index < count; index += 1) {
          const column = index % columns;
          const row = Math.floor(index / columns);
          const x = (column - (columns - 1) / 2) * spacingX;
          const z = 4.7 - row * spacingZ;
          points.push([
            THREE.MathUtils.clamp(x + (Math.random() - 0.5) * 0.22, -8.2, 8.2),
            THREE.MathUtils.clamp(z + (Math.random() - 0.5) * 0.18, -11.2, 5.3),
          ]);
        }
      }
      return points;
    };

    const addDecorations = (accent: number, darkFloor: boolean) => {
      physicsTheme = { accent, darkFloor };
      const railMaterial = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: darkFloor ? 0.65 : 0.18,
        roughness: 0.45,
      });
      for (const x of [-9.9, 9.9]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 26), railMaterial);
        rail.position.set(x, 0.08, -1.2);
        stageAdd(rail);
      }
      for (const z of [-12.8, -6.4, 0, 6.4]) {
        const marker = roundedBox(1.5, 0.035, 0.2, accent);
        marker.position.set(0, 0.04, z);
        stageAdd(marker);
      }
      for (let i = 0; i < 8; i += 1) {
        const box = roundedBox(
          0.75 + Math.random() * 0.6,
          0.55 + Math.random() * 0.7,
          0.75,
          i % 3 === 0 ? accent : 0x87949b,
        );
        box.position.set(i % 2 ? -9.6 : 9.5, box.geometry.parameters.height / 2, -11.5 + i * 3.1);
        stageAdd(box);
      }
      const propKinds: OfficePropKind[] = [
        "monitor", "paper", "cooler", "monitor", "paper", "monitor",
        "cooler", "paper", "monitor", "paper", "monitor", "cooler",
      ];
      const propPositions: Array<[number, number]> = [
        [-6.8, -10.4], [6.7, -9.5], [-5.7, -6.9], [5.6, -5.8],
        [-6.5, -2.6], [6.4, -1.6], [-5.6, 2.1], [5.8, 3.3],
        [-2.6, -8.3], [2.7, -4.1], [-2.9, 0.3], [3.1, 4.8],
      ];
      propKinds.forEach((kind, index) => {
        const group = makeOfficeProp(kind);
        const [x, z] = propPositions[index];
        group.position.set(x, 0, z);
        group.rotation.y = index % 2 ? -0.18 : 0.18;
        stageAdd(group);
        officeProps.push({
          group,
          kind,
          radius: kind === "cooler" ? 0.78 : kind === "monitor" ? 0.7 : 0.58,
          points: kind === "cooler" ? 420 : kind === "monitor" ? 330 : 250,
          color: kind === "cooler" ? 0x71dfff : kind === "monitor" ? accent : 0xffffff,
          destroyed: false,
        });
      });
      physicsRuntime?.spawnPlayground(accent, darkFloor);
    };

    const gainMegaGauge = (baseAmount: number, announce = true) => {
      const megaMaxStock = runtime.profile.fixtures.server >= 2 ? 3 : 2;
      const amount = baseAmount * (1 + upgradeValues.lantern * 0.25);
      if (runtime.mega >= megaMaxStock) {
        runtime.megaGauge = Math.min(99, runtime.megaGauge + amount * 0.35);
        return 0;
      }
      runtime.megaGauge += amount;
      let earned = 0;
      while (runtime.megaGauge >= 100 && runtime.mega < megaMaxStock) {
        runtime.megaGauge -= 100;
        runtime.mega += 1;
        earned += 1;
      }
      if (runtime.mega >= megaMaxStock) runtime.megaGauge = Math.min(99, runtime.megaGauge);
      if (earned > 0) {
        playSound("beer");
        if (announce) notify(`RAIL ×${runtime.mega} READY`);
      }
      return earned;
    };

    const syncHud = () => {
      const physicsStats: OfficePhysicsStats = physicsRuntime?.getStats() ?? {
        bodies: debris.length,
        moving: debris.length,
        sleeping: 0,
      };
      const floorDefinition = FLOORS[runtime.floor - 1];
      const alive = enemies.filter((enemy) => enemy.alive).length;
      const remainingObjective = floorDefinition.kind === "challenge"
        ? alive
        : Math.max(0, runtime.floorQuota - runtime.floorKilled);
      const aliveBosses = enemies.filter((enemy) => enemy.alive && enemy.boss);
      const boss = aliveBosses[0];
      const dashCooldown = Math.max(0.72, 2.15 / (1 + upgradeValues.sneakers * 0.18));
      const dashProgress = THREE.MathUtils.clamp((runtime.elapsed - runtime.lastDash) / dashCooldown, 0, 1);
      const overtime = OVERTIME_RANKS[runtime.overtimeRank];
      const rushRemaining = Math.max(0, runtime.rushUntil - runtime.elapsed);
      const offscreenEnemies = enemies.filter((enemy) => {
        if (!enemy.alive || enemy.boss) return false;
        const projected = enemy.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)).project(camera);
        return projected.x < -0.92 || projected.x > 0.92 || projected.y < -0.88 || projected.y > 0.88;
      }).length;
      const megaDirection = new THREE.Vector3(0, 0, -1).applyAxisAngle(UP, player.rotation.y);
      const megaOrigin = player.position.clone().addScaledVector(megaDirection, 0.72).setY(0);
      const megaSide = new THREE.Vector3(-megaDirection.z, 0, megaDirection.x);
      const megaWidth = 2.55 * (1 + upgradeValues.barrel * 0.14);
      const megaTargets = enemies.filter((enemy) => {
        if (!enemy.alive) return false;
        const delta = enemy.group.position.clone().sub(megaOrigin).setY(0);
        const along = delta.dot(megaDirection);
        return along >= -enemy.radius
          && along <= 22 + enemy.radius
          && Math.abs(delta.dot(megaSide)) <= megaWidth / 2 + enemy.radius;
      }).length + officeProps.filter((prop) => {
        if (prop.destroyed) return false;
        const delta = prop.group.position.clone().sub(megaOrigin).setY(0);
        const along = delta.dot(megaDirection);
        return along >= -prop.radius
          && along <= 22 + prop.radius
          && Math.abs(delta.dot(megaSide)) <= megaWidth / 2 + prop.radius;
      }).length;
      setHud({
        floor: runtime.floor,
        floorName: floorDefinition.name,
        kicker: floorDefinition.kicker,
        objective: floorDefinition.kind === "combat" || floorDefinition.kind === "elite"
          ? `${floorDefinition.objective}｜破壊目標 ${runtime.floorQuota}体`
          : floorDefinition.objective,
        hp: Math.ceil(runtime.hp),
        maxHp: Math.ceil(runtime.maxHp),
        score: Math.round(runtime.score),
        combo: runtime.combo,
        multiplier: getComboMultiplier(runtime.combo),
        enemies: remainingObjective,
        totalEnemies: runtime.floorQuota,
        mega: runtime.mega,
        megaMax: runtime.profile.fixtures.server >= 2 ? 3 : 2,
        megaGauge: runtime.megaGauge,
        megaTargets,
        caps: runtime.runCaps,
        timer: runtime.timer === null ? null : Math.max(0, Math.ceil(runtime.timer)),
        dashReady: dashProgress,
        bossName: boss
          ? `${boss.label}${aliveBosses.length > 1 ? `＋助っ人${aliveBosses.length - 1}名` : ""}${
            aliveBosses.some((candidate) => candidate.phase === 2) ? "｜ENCORE PHASE" : ""
          }${
            aliveBosses.some((candidate) => (
              runtime.elapsed >= candidate.vulnerableFrom
              && runtime.elapsed < candidate.vulnerableUntil
            ))
              ? "｜反動中：ジョッキレール好機"
              : ""
          }`
          : "",
        pressure: rushRemaining > 0 ? 100 : runtime.pressure,
        rushRemaining,
        overtimeLabel: overtime.label,
        scoreMultiplier: overtime.scoreMultiplier * (rushRemaining > 0 ? 1.5 : 1),
        offscreenEnemies,
        incomingAttack: hazards.length > 0 || enemies.some((enemy) => enemy.alive && enemy.attackKind !== null),
        physicsOnline: physicsRuntime !== null,
        physicsBodies: physicsStats.bodies,
        physicsMoving: physicsStats.moving,
        kineticChain: runtime.kineticChain,
      });
    };

    const setupFloor = () => {
      clearStage();
      setMegaFlash(false);
      const floorDefinition = FLOORS[runtime.floor - 1];
      const overtime = OVERTIME_RANKS[runtime.overtimeRank];
      floorMaterial.color.setHex(floorDefinition.tint);
      accentLight.color.setHex(floorDefinition.accent);
      const darkFloor = runtime.floor === 4 || runtime.floor === 6 || runtime.floor === 8;
      scene.background = new THREE.Color(darkFloor ? 0x7790a0 : 0xb9e7fb);
      scene.fog = new THREE.Fog(darkFloor ? 0x7790a0 : 0xb9e7fb, 27, 48);
      renderer.setClearColor(darkFloor ? 0x7790a0 : 0xb9e7fb, 1);
      physicsTheme = { accent: floorDefinition.accent, darkFloor };
      const sign = makeFloorSign(floorDefinition.name, floorDefinition.kicker, floorDefinition.accent);
      stageAdd(sign);
      addDecorations(floorDefinition.accent, darkFloor);

      player.position.set(0, 0, 9.7);
      player.rotation.y = 0;
      runtime.floorKilled = 0;
      runtime.timer = floorDefinition.kind === "challenge" ? 15 : null;
      runtime.combo = 0;
      runtime.comboWindow = 0;
      runtime.kineticChain = 0;
      runtime.kineticChainUntil = 0;
      runtime.lastKineticSweep = -10;
      runtime.pendingSmash = null;
      runtime.pendingMega = null;
      runtime.megaLockUntil = 0;
      runtime.lastBossDefeat = "";
      runtime.pendingFloorClear = false;
      runtime.rushTriggered = false;
      runtime.pressure = 0;
      runtime.rushUntil = 0;
      if (runtime.profile.fixtures.showcase >= 2) runtime.mealReady = true;
      gainMegaGauge(
        12
        + runtime.profile.fixtures.server * 25
        + upgradeValues.lantern * 10,
        false,
      );
      if (floorDefinition.kind === "boss" || floorDefinition.kind === "final") {
        runtime.mega = Math.max(1, runtime.mega);
        runtime.megaGauge = Math.max(35, runtime.megaGauge);
      }
      runtime.playing = true;
      runtime.paused = false;
      runtime.lastBump = -10;

      const formation = runtime.floor === 2 || runtime.floor === 7
        ? "ring"
        : runtime.floor === 3
          ? "cross"
          : runtime.floor === 5
            ? "lanes"
            : "ranks";
      const quotaBasedFloor = floorDefinition.kind === "combat" || floorDefinition.kind === "elite";
      const requiredEnemyCount = quotaBasedFloor
        ? Math.ceil(floorDefinition.enemyCount * overtime.destructionMultiplier)
        : floorDefinition.enemyCount;
      const initialEnemyCount = quotaBasedFloor
        ? Math.min(requiredEnemyCount, floorDefinition.enemyCount + runtime.overtimeRank * 8)
        : floorDefinition.enemyCount;
      const points = formationSpawnPoints(
        initialEnemyCount,
        formation,
        floorDefinition.kind === "challenge",
      );
      let finalGuests: CharacterBossId[] = [];
      if (floorDefinition.kind === "boss") {
        spawnCharacterBoss(runtime.guestBoss, 0, -7.2);
      } else if (floorDefinition.kind === "final") {
        finalGuests = pickFinalBossGuests(runtime.overtimeRank);
        spawnCharacterBoss("okayaman", 0, -8.6);
        const guestPositions = finalGuests.length === 1
          ? [[Math.random() < 0.5 ? -4.3 : 4.3, -5.4]]
          : [[-4.3, -5.4], [4.3, -5.4]];
        finalGuests.forEach((id, index) => {
          const [x, z] = guestPositions[index];
          spawnCharacterBoss(id, x, z, 0.9 + index * 0.9);
        });
      } else {
        const kinds: EquipmentEnemyKind[] = floorDefinition.kind === "challenge"
          ? ["chair", "desk", "cabinet", "copier"]
          : runtime.floor === 6
            ? ["cabinet", "gate", "cabinet", "stapler"]
            : runtime.floor >= 5
              ? ["stapler", "cabinet", "desk", "copier", "chair"]
              : ["chair", "stapler", "desk", "cabinet"];
        for (let i = 0; i < initialEnemyCount; i += 1) {
          const [x, z] = points[i % points.length];
          spawnEnemy(kinds[i % kinds.length], x, z, {
            elite: (floorDefinition.kind === "elite" && i % 5 === 0)
              || (runtime.floor >= 5 && i % 6 === 0)
              || (runtime.overtimeRank > 0 && i < overtime.eliteBonus),
            stationary: floorDefinition.kind === "challenge",
            hp: floorDefinition.kind === "challenge" ? 1 : undefined,
            scale: floorDefinition.kind === "challenge" ? 0.92 : undefined,
          });
        }
      }
      runtime.floorQuota = quotaBasedFloor ? requiredEnemyCount : enemies.length;
      runtime.floorTotal = runtime.floorQuota;
      setPaused(false);
      setStatus("playing");
      syncHud();
      playSound("start");
      if (floorDefinition.kind === "boss") {
        showBossDialogue(WINDOW_BOSSES[runtime.guestBoss].introLine, 4200);
      } else if (floorDefinition.kind === "final") {
        showBossDialogue(
          finalGuests.length > 0
            ? `おかやまん「本日は${finalGuests.map((id) => WINDOW_BOSSES[id].displayName).join("さんと")}さんにも参加いただき、大変心強く思っております」`
            : WINDOW_BOSSES.okayaman.introLine,
          4600,
        );
      } else {
        notify(`${floorDefinition.floor}F · ${floorDefinition.name}`);
      }
    };

    const makeSummary = (victory: boolean): RunSummary => ({
      victory,
      floorReached: runtime.floor,
      score: Math.round(runtime.score),
      destroyed: runtime.destroyed,
      maxCombo: runtime.maxCombo,
      capsEarned: runtime.runCaps,
      upgrades: runtime.selected.map((item) => `${item.displayName}｜${item.effect}`),
      overtimeRank: runtime.overtimeRank,
      buildName: UPGRADES
        .filter((upgrade) => upgradeValues[upgrade.id] > 0)
        .map((upgrade) => `${upgrade.name}${upgradeValues[upgrade.id] === 1 ? "" : `・${upgradeValues[upgrade.id] === 2 ? "改" : "極"}`}`)
        .join(" × ") || "手ぶら店主",
    });

    const endRun = (victory: boolean) => {
      if (runtime.submitted) return;
      runtime.playing = false;
      runtime.submitted = true;
      if (victory) {
        runtime.runCaps += Math.round(30 * OVERTIME_RANKS[runtime.overtimeRank].capsMultiplier);
      }
      const result = makeSummary(victory);
      setSummary(result);
      setStatus(victory ? "victory" : "gameover");
      setPaused(false);
      playSound(victory ? "clear" : "hurt");
      submitRunRef.current(result);
    };

    const finishFloor = () => {
      if (!runtime.playing) return;
      runtime.playing = false;
      const overtime = OVERTIME_RANKS[runtime.overtimeRank];
      const floorBonus = Math.round((800 + runtime.floor * 320) * overtime.scoreMultiplier);
      runtime.score += floorBonus;
      runtime.runCaps += Math.round((3 + Math.floor(runtime.floor / 2)) * overtime.capsMultiplier);
      if (runtime.overtimeRank === getDailyFeaturedRank()) runtime.runCaps += 1;
      if (runtime.floor >= MAX_FLOOR) {
        if (runtime.lastBossDefeat) notify(runtime.lastBossDefeat);
        endRun(true);
        return;
      }
      const choices = makeRewardChoices(upgradeValues);
      setRewardChoices(choices);
      setRerolls(runtime.rerolls);
      syncHud();
      setStatus("reward");
      playSound("clear");
      notify(runtime.lastBossDefeat || `FLOOR CLEAR +${formatNumber(floorBonus)}`);
    };

    const updateEnemyHealth = (enemy: Enemy) => {
      if (!enemy.healthFill) return;
      const ratio = THREE.MathUtils.clamp(enemy.hp / enemy.maxHp, 0, 1);
      enemy.healthFill.scale.x = ratio;
      (enemy.healthFill.material as THREE.MeshStandardMaterial).color.setHex(
        enemy.barrier > 0 ? 0x45d8ff : healthColor(ratio),
      );
    };

    const destroyOfficeProp = (prop: OfficeProp, mega = false) => {
      if (prop.destroyed) return;
      prop.destroyed = true;
      prop.group.visible = false;
      runtime.destroyed += 1;
      runtime.combo += 1;
      runtime.maxCombo = Math.max(runtime.maxCombo, runtime.combo);
      runtime.comboWindow = Math.max(runtime.comboWindow, 2.1 + upgradeValues.lantern * 0.55);
      const rushActive = runtime.elapsed < runtime.rushUntil;
      runtime.score += Math.round(
        prop.points
        * getComboMultiplier(runtime.combo)
        * OVERTIME_RANKS[runtime.overtimeRank].scoreMultiplier
        * (rushActive ? 1.5 : 1),
      );
      runtime.pressure = Math.min(100, runtime.pressure + (mega ? 4 : 2.5));
      gainMegaGauge(mega ? 3 : 1.5, false);
      const debrisOrigin = prop.group.position.clone().add(new THREE.Vector3(0, 0.55, 0));
      if (physicsRuntime) {
        physicsRuntime.spawnBrokenProp(prop.kind, prop.group.position, prop.color, mega);
        physicsRuntime.blast(prop.group.position, mega ? 4.8 : 2.8, mega ? 11 : 6.4);
      } else {
        spawnDebris(
          debrisOrigin,
          prop.color,
          prop.kind === "paper" ? 20 : mega ? 18 : 11,
        );
      }
      spawnWave(prop.group.position, prop.kind === "cooler" ? 0x77e6ff : prop.color, mega ? 1.25 : 0.78);
      if (prop.kind === "cooler") {
        tone(520, 0.18, "sine", 0.045, 980);
      } else {
        playSound("break");
      }
    };

    const destroyOfficePropsInRadius = (center: THREE.Vector3, radius: number, mega = false) => {
      let destroyed = 0;
      for (const prop of officeProps) {
        if (prop.destroyed) continue;
        if (prop.group.position.distanceTo(center) <= radius + prop.radius) {
          destroyOfficeProp(prop, mega);
          destroyed += 1;
        }
      }
      return destroyed;
    };

    const makeDizzyBoss = (enemy: Enemy) => {
      const definition = enemy.characterBoss ? WINDOW_BOSSES[enemy.characterBoss] : null;
      const stars = new THREE.Group();
      stars.position.y = Math.max(2.25, (definition?.healthY ?? 3.5) - 0.65);
      for (let index = 0; index < 5; index += 1) {
        const star = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.16, 0),
          new THREE.MeshStandardMaterial({
            color: index % 2 === 0 ? 0xffdf3d : 0xffffff,
            emissive: 0x6b4200,
            emissiveIntensity: 0.45,
            roughness: 0.38,
          }),
        );
        const angle = index / 5 * Math.PI * 2;
        star.position.set(Math.cos(angle) * 0.95, Math.sin(angle * 2) * 0.12, Math.sin(angle) * 0.95);
        stars.add(star);
      }
      enemy.group.add(stars);
      (enemy.group.userData.healthBar as THREE.Group | undefined)?.removeFromParent();
      enemy.group.rotation.z = 0.16;
      dizzyBosses.push({
        group: enemy.group,
        stars,
        startedAt: runtime.elapsed,
        removeAt: FLOORS[runtime.floor - 1].kind === "final"
          ? runtime.elapsed + 3.2
          : null,
      });
    };

    const completeEnemyWave = () => {
      runtime.pendingFloorClear = false;
      const floorDefinition = FLOORS[runtime.floor - 1];
      if (floorDefinition.kind === "challenge" && (runtime.timer ?? 0) > 0) {
        const waveSize = runtime.floor === 7 ? 28 : 22;
        const points = formationSpawnPoints(
          waveSize,
          runtime.floor === 7 ? "ring" : "cross",
          true,
        );
        const kinds: EquipmentEnemyKind[] = ["chair", "desk", "cabinet", "copier"];
        for (let index = 0; index < waveSize; index += 1) {
          const [x, z] = points[index];
          spawnEnemy(kinds[index % kinds.length], x, z, {
            stationary: true,
            hp: 1,
            scale: 0.92,
          });
        }
        runtime.floorTotal += waveSize;
        notify("BONUS WAVE");
      } else {
        finishFloor();
      }
    };

    const startOfficeRush = () => {
      if (runtime.rushTriggered) return;
      const floorDefinition = FLOORS[runtime.floor - 1];
      if (floorDefinition.kind === "boss" || floorDefinition.kind === "final") return;
      runtime.rushTriggered = true;
      runtime.rushUntil = runtime.elapsed + 12;
      runtime.pressure = 100;
      runtime.mega = Math.min(runtime.profile.fixtures.server >= 2 ? 3 : 2, runtime.mega + 1);
      const waveSize = floorDefinition.kind === "challenge"
        ? 12
        : Math.min(22, 14 + runtime.floor);
      const points = formationSpawnPoints(waveSize, runtime.floor % 2 === 0 ? "ring" : "lanes", true);
      const kinds: EquipmentEnemyKind[] = ["chair", "stapler", "desk", "cabinet", "copier"];
      points.forEach(([x, z], index) => {
        spawnEnemy(kinds[index % kinds.length], x, z, {
          stationary: floorDefinition.kind === "challenge",
          hp: floorDefinition.kind === "challenge" ? 1 : undefined,
          scale: floorDefinition.kind === "challenge" ? 0.86 : 0.9,
          elite: runtime.floor >= 5 && index === waveSize - 1,
          label: index === waveSize - 1 && runtime.floor >= 5 ? "RUSH先導備品" : undefined,
        });
        if (index % 4 === 0) spawnWave(new THREE.Vector3(x, 0, z), floorDefinition.accent, 0.65);
      });
      playSound("beer");
      tone(220, 0.18, "square", 0.055, 440);
      tone(440, 0.24, "square", 0.06, 880, 0.14);
      notify(`OFFICE RUSH ×${waveSize}`);
    };

    const spawnQuotaReinforcements = () => {
      const floorDefinition = FLOORS[runtime.floor - 1];
      if (floorDefinition.kind !== "combat" && floorDefinition.kind !== "elite") return 0;
      const alive = enemies.filter((candidate) => candidate.alive && !candidate.boss).length;
      const remainingUnspawned = runtime.floorQuota - runtime.floorKilled - alive;
      const threshold = 10 + runtime.overtimeRank * 2;
      if (remainingUnspawned <= 0 || alive > threshold) return 0;

      const overtime = OVERTIME_RANKS[runtime.overtimeRank];
      const waveSize = Math.min(remainingUnspawned, 10 + runtime.overtimeRank * 4);
      const points = formationSpawnPoints(
        waveSize,
        runtime.floor % 2 === 0 ? "ranks" : "lanes",
        true,
      );
      const kinds: EquipmentEnemyKind[] = runtime.floor === 6
        ? ["cabinet", "gate", "stapler", "cabinet"]
        : runtime.floor >= 5
          ? ["stapler", "cabinet", "desk", "copier", "chair"]
          : ["chair", "stapler", "desk", "cabinet"];
      points.forEach(([x, z], index) => {
        spawnEnemy(kinds[index % kinds.length], x, z, {
          elite: (floorDefinition.kind === "elite" && index % 5 === 0)
            || (runtime.floor >= 5 && index % 7 === 0)
            || index < Math.max(0, overtime.eliteBonus - 1),
          scale: 0.92,
          label: index === waveSize - 1 ? "追加ノルマ備品" : undefined,
        });
        if (index % 4 === 0) spawnWave(new THREE.Vector3(x, 0, z), floorDefinition.accent, 0.58);
      });
      tone(260, 0.13, "square", 0.035, 520);
      notify(`WAVE +${waveSize}`);
      return waveSize;
    };

    const destroyEnemy = (enemy: Enemy, critical: boolean, chainDepth = 0) => {
      if (!enemy.alive) return;
      enemy.alive = false;
      if (enemy.attackWarning) {
        removeDisposableObject(enemy.attackWarning);
        enemy.attackWarning = null;
      }
      const peacefulBoss = enemy.characterBoss !== null;
      if (peacefulBoss) {
        for (const hazard of hazards) removeDisposableObject(hazard.warning);
        hazards.length = 0;
        makeDizzyBoss(enemy);
        runtime.lastBossDefeat = WINDOW_BOSSES[enemy.characterBoss!].defeatLine;
        showBossDialogue(runtime.lastBossDefeat, 3400);
      } else {
        scene.remove(enemy.group);
      }
      runtime.destroyed += 1;
      runtime.floorKilled += 1;
      runtime.combo += 1;
      runtime.maxCombo = Math.max(runtime.maxCombo, runtime.combo);
      runtime.comboWindow = 2.1 + upgradeValues.lantern * 0.55;
      const multiplier = getComboMultiplier(runtime.combo);
      const overtime = OVERTIME_RANKS[runtime.overtimeRank];
      const rushActive = runtime.elapsed < runtime.rushUntil;
      runtime.score += Math.round(
        enemy.points
        * multiplier
        * (critical ? 1.25 : 1)
        * overtime.scoreMultiplier
        * (rushActive ? 1.5 : 1),
      );
      gainMegaGauge(
        (enemy.boss ? 25 : enemy.elite ? 14 : 4) * (rushActive ? 1.75 : 1),
      );
      const pressureScale = upgradeValues.lantern >= 2 ? 1.5 : 1;
      runtime.pressure = Math.min(
        100,
        runtime.pressure + (enemy.boss ? 35 : enemy.elite ? 18 : 7 + Math.min(7, runtime.combo * 0.16)) * pressureScale,
      );
      if (runtime.pressure >= 100 && !rushActive) startOfficeRush();
      runtime.shake = Math.max(runtime.shake, enemy.boss ? 0.55 : 0.22);
      if (peacefulBoss) {
        spawnWave(enemy.group.position, enemy.color, 1.8);
        tone(520, 0.16, "triangle", 0.05, 760);
        tone(760, 0.22, "sine", 0.045, 980, 0.16);
      } else {
        spawnDebris(enemy.group.position, enemy.color, enemy.boss ? 42 : 13);
        physicsRuntime?.blast(
          enemy.group.position,
          enemy.boss ? 6.2 : 3.4,
          enemy.boss ? 16 : enemy.elite ? 9 : 6.8,
        );
        playSound(enemy.boss ? "metal" : "break");
        if (runtime.floor >= 5) {
          spawnWave(enemy.group.position, enemy.elite ? 0xffd23f : enemy.color, enemy.elite ? 1.25 : 0.72);
          if (enemy.elite) {
            spawnWave(enemy.group.position, 0xffffff, 0.82);
            tone(310, 0.11, "square", 0.028, 620);
          }
        }
      }
      navigator.vibrate?.(enemy.boss ? 45 : 15);

      if (enemy.affix === "volatile") {
        addHazard(enemy.group.position, 3.2, enemy.damage * 0.62, 0.9, 0xff4d3a);
        notify("余熱注意！ 赤い範囲から離れてください");
      }

      if (upgradeValues.tray > 0) {
        runtime.hp = Math.min(runtime.maxHp, runtime.hp + upgradeValues.tray * 3);
      }
      if (!enemy.boss) {
        const roll = Math.random();
        if (roll < 0.09) addPickup("beer", enemy.group.position);
        else if (roll < 0.17) addPickup("clock", enemy.group.position);
        else if (roll < 0.33) addPickup("cap", enemy.group.position);
        else if (roll < 0.4) addPickup("yakitori", enemy.group.position);
      } else {
        addPickup("beer", enemy.group.position.clone().add(new THREE.Vector3(-1.2, 0, 0)));
        addPickup("cap", enemy.group.position.clone().add(new THREE.Vector3(1.2, 0, 0)));
      }

      if (upgradeValues.barrel > 0 && chainDepth === 0) {
        const explosiveFoam = upgradeValues.barrel >= 2;
        const splashDamage = BASE_SMASH_DAMAGE
          * (1 + upgradeValues.mug * 0.25)
          * upgradeValues.barrel * 0.48
          * (explosiveFoam ? 1.35 : 1);
        spawnWave(enemy.group.position, 0xfff0a1, explosiveFoam ? 1.15 : 0.8);
        for (const other of enemies) {
          if (!other.alive || other === enemy) continue;
          if (other.group.position.distanceTo(enemy.group.position) < (explosiveFoam ? 4.1 : 2.6)) {
            other.hp -= splashDamage;
            showDamageNumber(
              splashDamage,
              other.group.position.clone().setY(other.boss ? 2.6 : 1.35),
              "splash",
            );
            updateEnemyHealth(other);
            if (other.hp <= 0) destroyEnemy(other, false, chainDepth + 1);
          }
        }
      }

      if (upgradeValues.chiller >= 3 && runtime.elapsed < enemy.frozenUntil && chainDepth === 0) {
        const shatterDamage = BASE_SMASH_DAMAGE * 1.35;
        spawnWave(enemy.group.position, 0x7de8ff, 1.3);
        for (const other of enemies) {
          if (!other.alive || other === enemy) continue;
          if (other.group.position.distanceTo(enemy.group.position) < 3.2) {
            other.frozenUntil = Math.max(other.frozenUntil, runtime.elapsed + 1.1);
            other.hp -= shatterDamage;
            showDamageNumber(shatterDamage, other.group.position.clone().setY(1.35), "splash");
            updateEnemyHealth(other);
            if (other.hp <= 0) destroyEnemy(other, false, chainDepth + 1);
          }
        }
      }

      spawnQuotaReinforcements();
      syncHud();
      const floorDefinition = FLOORS[runtime.floor - 1];
      const objectiveComplete = floorDefinition.kind === "challenge"
        ? enemies.every((candidate) => !candidate.alive)
        : runtime.floorKilled >= runtime.floorQuota;
      if (objectiveComplete) {
        if (megaProjectiles.length > 0) {
          runtime.pendingFloorClear = true;
        } else {
          completeEnemyWave();
        }
      }
    };

    const damageEnemy = (
      enemy: Enemy,
      amount: number,
      critical: boolean,
      center: THREE.Vector3,
      style: DamageNumberStyle = "normal",
    ) => {
      if (!enemy.alive) return;
      const chilledVulnerable = runtime.elapsed < enemy.frozenUntil
        && upgradeValues.chiller >= 2;
      const bossOpening = enemy.boss
        && runtime.elapsed >= enemy.vulnerableFrom
        && runtime.elapsed < enemy.vulnerableUntil;
      const vulnerabilityMultiplier = (chilledVulnerable ? 1.65 : 1) * (bossOpening ? 1.65 : 1);
      const finalAmount = amount * vulnerabilityMultiplier;
      showDamageNumber(
        finalAmount,
        enemy.group.position.clone().setY(enemy.boss ? 2.6 : 1.35),
        style,
        critical,
        vulnerabilityMultiplier,
      );
      enemy.hp -= finalAmount;
      if (enemy.boss && enemy.hp > 0) {
        gainMegaGauge(Math.min(4.5, finalAmount * (bossOpening ? 0.82 : 0.48)), false);
      }
      enemy.barrier = Math.max(0, enemy.barrier - finalAmount);
      enemy.frozenUntil = Math.max(enemy.frozenUntil, runtime.elapsed + upgradeValues.chiller * 0.45);
      if (
        enemy.characterBoss
        && enemy.phase === 1
        && enemy.hp > 0
        && enemy.hp / enemy.maxHp <= 0.5
      ) {
        enemy.phase = 2;
        for (const hazard of hazards) removeDisposableObject(hazard.warning);
        hazards.length = 0;
        enemy.pulseAt = Math.min(
          enemy.pulseAt,
          runtime.elapsed + 1.05 * BOSS_DIFFICULTY_BY_RANK[runtime.overtimeRank].cadenceMultiplier,
        );
        const aura = new THREE.Mesh(
          new THREE.TorusGeometry(enemy.radius * 1.65, 0.12, 10, 38),
          new THREE.MeshBasicMaterial({
            color: WINDOW_BOSSES[enemy.characterBoss].color,
            transparent: true,
            opacity: 0.88,
          }),
        );
        aura.rotation.x = Math.PI / 2;
        aura.position.y = 0.18;
        aura.userData.phaseAura = true;
        enemy.group.add(aura);
        enemy.group.userData.phaseAura = aura;
        spawnWave(enemy.group.position, 0xffffff, 2.25);
        spawnWave(enemy.group.position, WINDOW_BOSSES[enemy.characterBoss].color, 1.45);
        runtime.shake = Math.max(runtime.shake, 0.48);
        tone(220, 0.22, "square", 0.05, 440);
        tone(440, 0.3, "sawtooth", 0.045, 880, 0.16);
        notify(`ENCORE PHASE！ ${WINDOW_BOSSES[enemy.characterBoss].displayName}の攻撃が強化！`);
      }
      const away = enemy.group.position.clone().sub(center).setY(0);
      if (away.lengthSq() > 0.01 && !enemy.boss) {
        away.normalize().multiplyScalar(0.38 + upgradeValues.mug * 0.42);
        enemy.group.position.add(away);
      }
      updateEnemyHealth(enemy);
      if (enemy.hp <= 0) {
        destroyEnemy(enemy, critical);
      } else if (enemy.characterBoss) {
        spawnWave(enemy.group.position, enemy.color, 0.62);
        tone(240, 0.07, "square", 0.025, 360);
      } else if (style !== "kinetic") {
        spawnDebris(enemy.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)), enemy.color, 4);
        playSound("metal");
      }
    };

    const resolveKineticImpacts = () => {
      if (!physicsRuntime) return;
      if (runtime.elapsed - runtime.lastKineticSweep < KINETIC_SWEEP_INTERVAL) return;
      runtime.lastKineticSweep = runtime.elapsed;
      let resolvedHits = 0;
      for (const impact of physicsRuntime.collectKineticImpacts(runtime.elapsed)) {
        const impactOnFloor = impact.position.clone().setY(0);
        let target: Enemy | null = null;
        let nearest = Number.POSITIVE_INFINITY;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const distance = enemy.group.position.distanceTo(impactOnFloor);
          if (
            distance <= impact.radius + enemy.radius + 0.48
            && distance < nearest
          ) {
            target = enemy;
            nearest = distance;
          }
        }
        if (!target) continue;

        impact.consume();
        const speedDamage = THREE.MathUtils.clamp((impact.speed - 2.8) * 0.34, 0.7, 4.2);
        const bossScale = target.boss ? 0.52 : 1;
        const damage = speedDamage * impact.damageScale * bossScale;
        damageEnemy(target, damage, impact.speed >= 10.5, impactOnFloor, "kinetic");
        runtime.kineticChain += 1;
        runtime.kineticChainUntil = runtime.elapsed + 1.35;
        runtime.score += Math.round(
          90
          * runtime.kineticChain
          * OVERTIME_RANKS[runtime.overtimeRank].scoreMultiplier,
        );
        runtime.pressure = Math.min(100, runtime.pressure + 2.5);
        spawnWave(impactOnFloor, impact.kind === "rolling-chair" ? 0x62f4ff : 0xffffff, 0.62);
        if (resolvedHits === 0) {
          tone(360 + Math.min(420, runtime.kineticChain * 34), 0.08, "square", 0.025, 720);
        }

        if (
          (runtime.kineticChain === 3 || runtime.kineticChain === 6 || runtime.kineticChain === 10)
          && runtime.elapsed - runtime.lastKineticToast > 0.8
        ) {
          runtime.lastKineticToast = runtime.elapsed;
          notify(`PHYSICS CHAIN ×${runtime.kineticChain}`);
        }
        resolvedHits += 1;
        if (resolvedHits >= MAX_KINETIC_HITS_PER_SWEEP) break;
      }
    };

    const getMegaTravelDistance = (origin: THREE.Vector3, direction: THREE.Vector3) => {
      const distances: number[] = [];
      if (direction.x > 0.001) distances.push((9.75 - origin.x) / direction.x);
      if (direction.x < -0.001) distances.push((-9.75 - origin.x) / direction.x);
      if (direction.z > 0.001) distances.push((11.55 - origin.z) / direction.z);
      if (direction.z < -0.001) distances.push((-13.35 - origin.z) / direction.z);
      const positive = distances.filter((distance) => distance > 0.2);
      return THREE.MathUtils.clamp(Math.min(...positive, 22), 0.8, 22);
    };

    const launchMegaMug = (
      origin: THREE.Vector3,
      direction: THREE.Vector3,
    ) => {
      const distance = getMegaTravelDistance(origin, direction);
      const rushActive = runtime.elapsed < runtime.rushUntil;
      const width = 2.55 * (1 + upgradeValues.barrel * 0.14) * (rushActive ? 1.18 : 1);
      const baseDamage = BASE_SMASH_DAMAGE * (
        1
        + upgradeValues.mug * 0.25
      );
      const group = makeMegaMugProjectile();
      group.position.copy(origin).setY(0.82);
      scene.add(group);
      const lane = makeMegaLane(origin, direction, distance, width);
      megaProjectiles.push({
        group,
        lane,
        origin: origin.clone().setY(0),
        direction: direction.clone().setY(0).normalize(),
        distance,
        width,
        damage: baseDamage * 3.15 * (rushActive ? 1.18 : 1),
        startedAt: runtime.elapsed,
        duration: 0.4 + distance / 38,
        previousDistance: 0,
        lastTrailAt: runtime.elapsed,
        hitEnemies: new Set(),
        hitProps: new Set(),
      });
      noise(0.32, 0.12, 320);
      tone(190, 0.36, "sawtooth", 0.065, 980);
      tone(760, 0.18, "square", 0.04, 1320, 0.12);
      notify("MUG RAIL!");
    };

    const spawnMegaImpact = (projectile: MegaProjectile) => {
      const impact = projectile.origin.clone().addScaledVector(projectile.direction, projectile.distance);
      const piercePower = 1 + Math.min(0.72, projectile.hitEnemies.size * 0.045);
      const blastRadius = 3.7
        * (
          1
          + upgradeValues.barrel * 0.16
          + upgradeValues.mug * 0.05
        )
        * (1 + Math.min(0.32, projectile.hitEnemies.size * 0.018));
      const burst = new THREE.Group();
      burst.position.copy(impact);
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 2.4, 7.2, 28, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xffe552,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      pillar.position.y = 3.6;
      burst.add(pillar);
      for (let index = 0; index < 12; index += 1) {
        const ray = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.09, 5.2),
          new THREE.MeshBasicMaterial({
            color: index % 2 === 0 ? 0xffffff : 0xff9d0b,
            transparent: true,
            opacity: 0.86,
          }),
        );
        ray.position.y = 0.18;
        ray.rotation.y = index / 12 * Math.PI;
        burst.add(ray);
      }
      const flashLight = new THREE.PointLight(0xffd23f, 14, 20);
      flashLight.position.y = 2.2;
      burst.add(flashLight);
      addTimedVisual(burst, 0.58);
      spawnWave(impact, 0xffffff, 3.4);
      spawnWave(impact, 0xffc21d, 2.35);
      spawnWave(impact, 0xff6b16, 1.35);
      spawnDebris(impact.clone().setY(0.55), 0xffad17, 32);
      physicsRuntime?.blast(impact, blastRadius + 2.8, 22 + projectile.hitEnemies.size * 0.35, 0.72);
      runtime.shake = Math.max(runtime.shake, 1.2);
      noise(0.5, 0.19, 75);
      tone(74, 0.46, "sawtooth", 0.095, 34);
      tone(392, 0.28, "square", 0.06, 784, 0.08);
      tone(784, 0.36, "triangle", 0.055, 1568, 0.2);
      navigator.vibrate?.([35, 35, 90]);
      setMegaFlash(true);
      if (megaFlashTimer.current) window.clearTimeout(megaFlashTimer.current);
      megaFlashTimer.current = window.setTimeout(() => setMegaFlash(false), 180);

      for (const enemy of [...enemies]) {
        if (!enemy.alive) continue;
        const distance = Math.max(0, enemy.group.position.distanceTo(impact) - enemy.radius);
        if (distance <= blastRadius) {
          projectile.hitEnemies.add(enemy);
          damageEnemy(enemy, projectile.damage * 0.82 * piercePower, distance <= 0.75, impact, "mega");
        }
      }
      const propHits = destroyOfficePropsInRadius(impact, blastRadius, true);

      const hits = projectile.hitEnemies.size + projectile.hitProps.size + propHits;
      const bonus = Math.round(
        Math.max(1, hits)
        * 680
        * getComboMultiplier(runtime.combo)
        * OVERTIME_RANKS[runtime.overtimeRank].scoreMultiplier,
      );
      runtime.score += bonus;
      if (hits >= 20) {
        gainMegaGauge(
          30
          + (runtime.profile.fixtures.server >= 3 ? 25 : 0)
          + (upgradeValues.lantern >= 3 ? 25 : 0),
          false,
        );
      }
      notify(
        hits >= 20
          ? `CHEERS ×${hits} · +${formatNumber(bonus)}`
          : `RAIL ×${hits} · +${formatNumber(bonus)}`,
      );
      playSound("beer");
      syncHud();
    };

    const updateMegaProjectiles = (dt: number) => {
      for (let index = megaProjectiles.length - 1; index >= 0; index -= 1) {
        const projectile = megaProjectiles[index];
        const progress = THREE.MathUtils.clamp(
          (runtime.elapsed - projectile.startedAt) / projectile.duration,
          0,
          1,
        );
        const eased = 1 - Math.pow(1 - progress, 2);
        const traveled = projectile.distance * eased;
        projectile.group.position
          .copy(projectile.origin)
          .addScaledVector(projectile.direction, traveled);
        projectile.group.position.y = 0.92 + Math.sin(progress * Math.PI) * 0.7;
        projectile.group.rotation.x += dt * 12;
        projectile.group.rotation.y += dt * 18;
        const aura = projectile.group.getObjectByName("MegaMugAura");
        if (aura) aura.rotation.z += dt * 9;

        if (runtime.elapsed - projectile.lastTrailAt >= 0.035) {
          projectile.lastTrailAt = runtime.elapsed;
          spawnMegaTrail(projectile.group.position);
        }

        if (runtime.playing) {
          for (const enemy of [...enemies]) {
            if (!enemy.alive || projectile.hitEnemies.has(enemy)) continue;
            const delta = enemy.group.position.clone().sub(projectile.origin).setY(0);
            const along = delta.dot(projectile.direction);
            const sideDistance = Math.abs(delta.dot(
              new THREE.Vector3(-projectile.direction.z, 0, projectile.direction.x),
            ));
            if (
              along >= projectile.previousDistance - enemy.radius
              && along <= traveled + enemy.radius
              && sideDistance <= projectile.width / 2 + enemy.radius
            ) {
              projectile.hitEnemies.add(enemy);
              const perfectLine = sideDistance <= 0.38 + upgradeValues.mug * 0.08;
              const piercePower = 1 + Math.min(0.58, projectile.hitEnemies.size * 0.04);
              enemy.frozenUntil = Math.max(enemy.frozenUntil, runtime.elapsed + 0.16);
              spawnWave(enemy.group.position, perfectLine ? 0xffffff : 0xffc21d, perfectLine ? 1.25 : 0.9);
              runtime.shake = Math.max(runtime.shake, perfectLine ? 0.52 : 0.34);
              damageEnemy(
                enemy,
                projectile.damage * piercePower * (perfectLine ? 1.48 : 1),
                perfectLine,
                projectile.origin,
                "mega",
              );
            }
          }
          for (const prop of officeProps) {
            if (prop.destroyed || projectile.hitProps.has(prop)) continue;
            const delta = prop.group.position.clone().sub(projectile.origin).setY(0);
            const along = delta.dot(projectile.direction);
            const sideDistance = Math.abs(delta.dot(
              new THREE.Vector3(-projectile.direction.z, 0, projectile.direction.x),
            ));
            if (
              along >= projectile.previousDistance - prop.radius
              && along <= traveled + prop.radius
              && sideDistance <= projectile.width / 2 + prop.radius
            ) {
              projectile.hitProps.add(prop);
              destroyOfficeProp(prop, true);
            }
          }
          const growth = 1 + Math.min(
            0.72,
            (projectile.hitEnemies.size + projectile.hitProps.size) * 0.032,
          );
          projectile.group.scale.setScalar(1.35 * growth);
        }
        projectile.previousDistance = traveled;

        if (progress >= 1) {
          megaProjectiles.splice(index, 1);
          removeDisposableObject(projectile.group);
          timedVisuals.push({
            object: projectile.lane,
            life: 0.34,
            maxLife: 0.34,
            spin: 0,
          });
          spawnMegaImpact(projectile);
          if (runtime.pendingFloorClear && megaProjectiles.length === 0) completeEnemyWave();
        }
      }
    };

    const hurtPlayer = (amount: number, source: THREE.Vector3) => {
      if (!runtime.playing || runtime.elapsed < runtime.invulnerableUntil) return;
      runtime.invulnerableUntil = runtime.elapsed + 0.78;
      const fortified = runtime.hp / runtime.maxHp >= 0.8
        && upgradeValues.tray >= 2;
      const finalAmount = amount * (fortified ? 0.65 : 1);
      runtime.hp = Math.max(0, runtime.hp - finalAmount);
      runtime.combo = 0;
      runtime.comboWindow = 0;
      runtime.shake = Math.max(runtime.shake, 0.36);
      const away = player.position.clone().sub(source).setY(0);
      if (away.lengthSq() > 0.01) {
        away.normalize().multiplyScalar(0.75);
        player.position.add(away);
      }
      playSound("hurt");
      navigator.vibrate?.(35);
      if (runtime.hp <= 0 && runtime.trayRescueReady) {
        runtime.trayRescueReady = false;
        runtime.hp = runtime.maxHp;
        runtime.invulnerableUntil = runtime.elapsed + 2.2;
        spawnWave(player.position, 0xffb13b, 2.6);
        playSound("beer");
        notify("TRAY GUARD · FULL RECOVER");
      } else if (
        runtime.hp > 0
        && runtime.hp / runtime.maxHp <= 0.3
        && runtime.mealReady
      ) {
        runtime.mealReady = false;
        runtime.hp = Math.min(runtime.maxHp, runtime.hp + Math.max(48, runtime.maxHp * 0.55));
        if (runtime.profile.fixtures.showcase >= 3) {
          runtime.invulnerableUntil = runtime.elapsed + 2;
          spawnWave(player.position, 0xffdf61, 2.8);
        }
        playSound("beer");
        notify("MEAL · RECOVER");
      } else if (fortified) {
        notify("TRAY GUARD");
      }
      syncHud();
      if (runtime.hp <= 0) endRun(false);
    };

    const launchCharacterSpecial = (enemy: Enemy) => {
      if (!enemy.characterBoss) return;
      const id = enemy.characterBoss;
      const definition = WINDOW_BOSSES[id];
      const origin = enemy.group.position.clone().setY(0);
      const target = player.position.clone().setY(0);
      const direction = target.clone().sub(origin).setY(0);
      if (direction.lengthSq() < 0.01) direction.set(0, 0, 1);
      direction.normalize();
      const side = new THREE.Vector3(-direction.z, 0, direction.x);
      const bossDamage = enemy.damage;
      const bossDifficulty = BOSS_DIFFICULTY_BY_RANK[runtime.overtimeRank];
      const addBossHazard = (
        position: THREE.Vector3,
        radius: number,
        damage: number,
        delay: number,
        color: number,
      ) => addHazard(
        position,
        radius * bossDifficulty.areaMultiplier,
        damage,
        delay * bossDifficulty.windupMultiplier,
        color,
        id,
        true,
      );
      const addBossBeamHazard = (
        position: THREE.Vector3,
        beamDirection: THREE.Vector3,
        length: number,
        width: number,
        damage: number,
        delay: number,
        color: number,
      ) => addBeamHazard(
        position,
        beamDirection,
        length,
        width * bossDifficulty.areaMultiplier,
        damage,
        delay * bossDifficulty.windupMultiplier,
        color,
        id,
        true,
      );
      const encore = enemy.phase === 2;
      let lastTriggerDelay = 1.45;

      (enemy.group.userData.animator as VoxelActionController | undefined)?.triggerSmash(true);

      if (id === "yotan") {
        [-2.9, 0, 2.9].forEach((offset, index) => {
          addBossHazard(
            target.clone().addScaledVector(side, offset),
            1.55,
            bossDamage * 0.58,
            1.2 + index * 0.16,
            definition.color,
          );
        });
        spawnWave(origin, definition.color, 1.4);
        tone(164, 0.42, "sawtooth", 0.05, 440);
        tone(246, 0.38, "square", 0.035, 659, 0.1);
        if (encore) {
          addBossHazard(target.clone().addScaledVector(direction, 3.4), 2.05, bossDamage * 0.64, 1.68, 0xffffff);
          addBossHazard(target.clone().addScaledVector(direction, -3.4), 2.05, bossDamage * 0.64, 1.68, 0xffd23f);
          lastTriggerDelay = 1.68;
        }
        if (!encore) lastTriggerDelay = 1.52;
      } else if (id === "tokun") {
        [-2.7, 0, 2.7].forEach((offset, index) => {
          addBossHazard(
            target.clone().addScaledVector(side, offset).addScaledVector(direction, (index - 1) * 1.3),
            1.45,
            bossDamage * 0.56,
            1.3 + index * 0.14,
            definition.color,
          );
        });
        spawnWave(origin, definition.color, 1.65);
        tone(392, 0.3, "triangle", 0.045, 523);
        tone(587, 0.34, "sine", 0.04, 784, 0.12);
        if (encore) {
          addBossHazard(target.clone().addScaledVector(direction, 3.5), 1.55, bossDamage * 0.58, 1.7, 0xffef83);
          addBossHazard(target.clone().addScaledVector(direction, -3.5), 1.55, bossDamage * 0.58, 1.7, 0xffef83);
          lastTriggerDelay = 1.7;
        } else {
          lastTriggerDelay = 1.58;
        }
      } else if (id === "fukuchan") {
        addBossHazard(target, 2.8, bossDamage * 0.62, 1.42, definition.color);
        addBossHazard(target.clone().addScaledVector(side, 4.2), 1.65, bossDamage * 0.46, 1.62, 0xffffff);
        addBossHazard(target.clone().addScaledVector(side, -4.2), 1.65, bossDamage * 0.46, 1.62, 0xffffff);
        tone(820, 0.12, "sine", 0.045, 1480);
        if (encore) {
          addBossHazard(target.clone().addScaledVector(direction, 4.1), 2, bossDamage * 0.58, 1.78, 0xffffff);
          addBossHazard(target.clone().addScaledVector(direction, -4.1), 2, bossDamage * 0.58, 1.78, definition.color);
          lastTriggerDelay = 1.78;
        } else {
          lastTriggerDelay = 1.62;
        }
      } else if (id === "yumemin") {
        addBossHazard(target, 2.45, bossDamage * 0.74, 1.5, definition.color);
        addBossHazard(
          target.clone().addScaledVector(direction, 3.6),
          1.65,
          bossDamage * 0.52,
          1.72,
          0xdff8ff,
        );
        tone(110, 0.18, "square", 0.04, 82);
        if (encore) {
          addBossHazard(target.clone().addScaledVector(side, 3.1), 1.75, bossDamage * 0.58, 1.88, 0xffffff);
          lastTriggerDelay = 1.88;
        } else {
          lastTriggerDelay = 1.72;
        }
      } else if (id === "takosan") {
        for (let index = 0; index < 6; index += 1) {
          if (index === 1) continue;
          const angle = index / 6 * Math.PI * 2;
          const position = target.clone().add(new THREE.Vector3(
            Math.cos(angle) * 3.25,
            0,
            Math.sin(angle) * 3.25,
          ));
          addBossHazard(position, 1.5, bossDamage * 0.54, 1.28 + index * 0.06, definition.color);
        }
        tone(145, 0.5, "triangle", 0.04, 92);
        if (encore) {
          addBossHazard(target, 1.65, bossDamage * 0.62, 1.74, 0xffffff);
          lastTriggerDelay = 1.74;
        } else {
          lastTriggerDelay = 1.58;
        }
      } else if (id === "yametaro") {
        addBossBeamHazard(origin, direction, 20, 2.3, bossDamage * 0.7, 1.35, definition.color);
        if (encore) {
          addBossBeamHazard(
            origin,
            direction.clone().applyAxisAngle(UP, -Math.PI * 0.24),
            20,
            1.7,
            bossDamage * 0.55,
            1.58,
            0xffd23f,
          );
        }
        tone(280, 0.3, "sawtooth", 0.045, 720);
        lastTriggerDelay = encore ? 1.58 : 1.35;
      } else {
        if (encore) {
          [-0.3, 0, 0.3].forEach((angle, index) => {
            addBossBeamHazard(
              origin,
              direction.clone().applyAxisAngle(UP, Math.PI * angle),
              22,
              index === 1 ? 2.35 : 1.45,
              bossDamage * (index === 1 ? 0.7 : 0.5),
              1.42 + index * 0.14,
              index === 1 ? definition.color : 0xff6b3d,
            );
          });
          lastTriggerDelay = 1.7;
        } else {
          addBossBeamHazard(origin, direction, 22, 2.15, bossDamage * 0.68, 1.45, definition.color);
          const crossingDirection = direction.clone().applyAxisAngle(UP, Math.PI * 0.34);
          addBossBeamHazard(origin, crossingDirection, 22, 1.55, bossDamage * 0.48, 1.72, 0xff6b3d);
          lastTriggerDelay = 1.72;
        }
        tone(96, 0.62, "sawtooth", 0.055, 420);
        tone(720, 0.2, "square", 0.035, 1180, 0.32);
      }

      enemy.vulnerableFrom = runtime.elapsed + lastTriggerDelay * bossDifficulty.windupMultiplier;
      enemy.vulnerableUntil = enemy.vulnerableFrom + bossDifficulty.openingDuration;
      enemy.pulseAt = enemy.vulnerableUntil
        + (id === "okayaman" ? (encore ? 0.95 : 1.55) : encore ? 1.45 : 2.1)
        * bossDifficulty.cadenceMultiplier;
      enemy.nextAttack = enemy.pulseAt + 0.35 * bossDifficulty.cadenceMultiplier;
      showBossDialogue(
        id === "yumemin" || id === "takosan"
          ? `${encore ? "ENCORE｜" : ""}${definition.displayName}｜${definition.specialName} — 赤い照準から退避`
          : `${encore ? "ENCORE｜" : ""}${definition.displayName}「${definition.specialName}」— 赤い照準から退避`,
        2600,
      );
    };

    const beginEnemyAttack = (enemy: Enemy, kind: EnemyAttackKind) => {
      if (enemy.attackKind || !enemy.alive) return;
      if (!enemy.boss && kind === "melee") {
        const projected = enemy.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)).project(camera);
        const offscreen = projected.x < -0.94 || projected.x > 0.94 || projected.y < -0.9 || projected.y > 0.9;
        const activeMobAttacks = enemies.filter((candidate) => (
          candidate.alive
          && !candidate.boss
          && candidate.attackKind !== null
        )).length;
        if (offscreen || activeMobAttacks >= MAX_CONCURRENT_MOB_ATTACKS) {
          enemy.nextAttack = runtime.elapsed + 0.18 + Math.random() * 0.28;
          return;
        }
      }
      const pulse = kind === "pulse";
      const bossDifficulty = BOSS_DIFFICULTY_BY_RANK[runtime.overtimeRank];
      const windup = (pulse ? (enemy.kind === "core" ? 1.35 : 1.2) : enemy.boss ? 0.9 : 0.78)
        * (enemy.boss ? bossDifficulty.windupMultiplier : 1);
      const radius = (pulse
        ? (enemy.kind === "core" ? 6 : 4.7)
        : enemy.radius + (enemy.boss ? 1.35 : 1.05))
        * (enemy.boss ? bossDifficulty.areaMultiplier : 1);
      enemy.attackKind = kind;
      enemy.attackStartedAt = runtime.elapsed;
      enemy.attackAt = runtime.elapsed + windup;
      enemy.attackOrigin.copy(enemy.group.position).setY(0);
      enemy.attackRadius = radius;
      enemy.attackWarning = makeDangerZone(
        enemy.attackOrigin,
        radius,
        enemy.boss
          ? BOSS_WARNING_COLOR
          : pulse
            ? (enemy.kind === "core" ? 0xff4437 : 0xffb51f)
            : 0xff4a32,
        enemy.boss,
      );
      if (pulse) {
        tone(128, windup * 0.72, "sawtooth", 0.035, 228);
      }
    };

    const resolveEnemyAttack = (enemy: Enemy) => {
      if (!enemy.attackKind) return;
      const kind = enemy.attackKind;
      const hit = player.position.distanceTo(enemy.attackOrigin) <= enemy.attackRadius;
      const dodged = !hit || runtime.elapsed < runtime.invulnerableUntil;
      const color = kind === "pulse"
        ? (enemy.kind === "core" ? 0xff4437 : 0xffc21d)
        : 0xff5b38;
      spawnWave(enemy.attackOrigin, color, Math.max(0.8, enemy.attackRadius * 0.34));
      if (hit) {
        hurtPlayer(enemy.damage * (kind === "pulse" ? 0.62 : 1), enemy.attackOrigin);
      }
      if (enemy.attackWarning) {
        removeDisposableObject(enemy.attackWarning);
        enemy.attackWarning = null;
      }
      enemy.attackKind = null;
      const bossDifficulty = BOSS_DIFFICULTY_BY_RANK[runtime.overtimeRank];
      enemy.nextAttack = runtime.elapsed
        + (enemy.boss ? 1.65 * bossDifficulty.cadenceMultiplier : 1.2);
      if (kind === "pulse") {
        enemy.pulseAt = runtime.elapsed
          + (enemy.kind === "core" ? 3.7 : 4.5)
          * (enemy.boss ? bossDifficulty.cadenceMultiplier : 1);
      }
      if (dodged) {
        gainMegaGauge(
          (enemy.boss ? 10 : 6)
          + (enemy.boss && runtime.profile.fixtures.exit >= 3 ? 15 : 0)
          + (enemy.boss && upgradeValues.sneakers >= 3 ? 20 : 0),
          false,
        );
        if (enemy.boss && runtime.profile.fixtures.exit >= 2) runtime.lastDash = -10;
      }
      if (enemy.boss) {
        enemy.vulnerableFrom = runtime.elapsed;
        enemy.vulnerableUntil = runtime.elapsed + bossDifficulty.openingDuration;
        if (dodged) {
          notify("DODGE · WEAK OPEN");
          tone(660, 0.12, "square", 0.045, 880);
        } else {
          notify("WEAK OPEN ×1.65");
        }
      }
    };

    const performSmash = (center: THREE.Vector3) => {
      playSound("smash");
      const baseDamage = BASE_SMASH_DAMAGE
        * (1 + upgradeValues.mug * 0.25);
      const damage = baseDamage;
      const radius = 1.65 * (1 + upgradeValues.barrel * 0.14);
      const criticalMultiplier = upgradeValues.mug >= 2
        ? (upgradeValues.mug >= 3 ? 2.7 : 2.35)
        : 1.75;
      spawnWave(center, upgradeValues.mug >= 3 ? 0xffd23f : 0xffffff, upgradeValues.mug >= 3 ? 1.55 : 1);
      physicsRuntime?.blast(
        center,
        radius + 2.25,
        7 + upgradeValues.mug * 1.25 + upgradeValues.barrel * 0.75,
      );
      runtime.shake = Math.max(runtime.shake, 0.24);
      let hits = 0;
      let criticals = 0;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const distance = Math.max(0, enemy.group.position.distanceTo(center) - enemy.radius);
        if (distance <= radius) {
          hits += 1;
          const critical = distance <= 0.58 + upgradeValues.mug * 0.07;
          if (critical) criticals += 1;
          damageEnemy(enemy, damage * (critical ? criticalMultiplier : 1), critical, center);
        }
      }
      hits += destroyOfficePropsInRadius(center, radius, false);
      if (hits > 1) {
        const bonus = Math.round(hits * hits * 45 * getComboMultiplier(runtime.combo));
        runtime.score += bonus;
        notify(`MULTI BREAK ×${hits} +${formatNumber(bonus)}`);
      } else if (criticals > 0) {
        notify(`PERFECT SMASH! ×${criticalMultiplier.toFixed(2)}`);
      }
      syncHud();
    };

    const smash = () => {
      if (!runtime.playing || runtime.paused) return;
      if (runtime.elapsed < runtime.megaLockUntil || runtime.pendingSmash || runtime.pendingMega) return;
      const rushActive = runtime.elapsed < runtime.rushUntil;
      const cooldown = Math.max(0.16, 0.46 * (1 - upgradeValues.chiller * 0.08) * (rushActive ? 0.7 : 1));
      if (runtime.elapsed - runtime.lastSmash < cooldown) return;
      runtime.lastSmash = runtime.elapsed;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(UP, player.rotation.y);
      const center = player.position.clone().addScaledVector(forward, 1.2);
      center.y = 0;
      (player.userData.animator as VoxelActionController | undefined)?.triggerSmash(false);
      tone(280, 0.1, "sawtooth", 0.045, 720);
      runtime.pendingSmash = { at: runtime.elapsed + 0.17, center };
      syncHud();
    };

    const megaSmash = () => {
      if (!runtime.playing || runtime.paused || runtime.mega <= 0) return;
      if (
        runtime.pendingSmash
        || runtime.pendingMega
        || megaProjectiles.length > 0
        || runtime.elapsed - runtime.lastMega < 0.9
      ) return;
      runtime.lastMega = runtime.elapsed;
      runtime.mega -= 1;
      const chargeDelay = Math.max(0.26, 0.48 * (1 - upgradeValues.chiller * 0.05));
      runtime.megaLockUntil = runtime.elapsed + chargeDelay + 0.24;
      runtime.invulnerableUntil = runtime.elapsed + 0.82;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(UP, player.rotation.y);
      const origin = player.position.clone().addScaledVector(forward, 0.72).setY(0);
      (player.userData.animator as VoxelActionController | undefined)?.triggerSmash(true);
      spawnWave(player.position, 0xffffff, 1.55);
      spawnWave(player.position, 0xffc21d, 0.9);
      const charge = new THREE.Group();
      charge.position.copy(player.position);
      for (let index = 0; index < 3; index += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.75 + index * 0.36, 0.055, 8, 30),
          new THREE.MeshBasicMaterial({
            color: index === 1 ? 0xffffff : 0xffc21d,
            transparent: true,
            opacity: 0.82,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.4 + index * 0.38;
        charge.add(ring);
      }
      const chargeLight = new THREE.PointLight(0xffc21d, 8, 12);
      chargeLight.position.y = 1.5;
      charge.add(chargeLight);
      addTimedVisual(charge, chargeDelay + 0.04);
      tone(110, 0.48, "sawtooth", 0.055, 880);
      tone(440, 0.28, "square", 0.04, 1320, 0.18);
      runtime.pendingMega = {
        at: runtime.elapsed + chargeDelay,
        origin,
        direction: forward,
      };
      notify("RAIL READY");
      syncHud();
    };

    const dash = () => {
      if (!runtime.playing || runtime.paused) return;
      if (runtime.elapsed < runtime.megaLockUntil) return;
      const cooldown = Math.max(0.72, 2.15 / (1 + upgradeValues.sneakers * 0.18));
      if (runtime.elapsed - runtime.lastDash < cooldown) return;
      runtime.lastDash = runtime.elapsed;
      runtime.invulnerableUntil = runtime.elapsed
        + 0.46
        + (runtime.profile.fixtures.exit >= 1 ? 0.15 : 0);
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(UP, player.rotation.y);
      player.position.addScaledVector(forward, 3.15);
      player.position.x = THREE.MathUtils.clamp(player.position.x, -9.4, 9.4);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -13.1, 11.3);
      spawnWave(player.position, upgradeValues.sneakers >= 2 ? 0x73ff8c : 0x5de3ff, upgradeValues.sneakers >= 2 ? 1.55 : 0.7);
      physicsRuntime?.blast(
        player.position,
        upgradeValues.sneakers >= 2 ? 3.4 : 2.2,
        upgradeValues.sneakers >= 2 ? 9.2 : 5.6,
        0.22,
      );
      if (upgradeValues.sneakers >= 2) {
        for (const enemy of enemies) {
          if (enemy.alive && enemy.group.position.distanceTo(player.position) <= 2.1 + enemy.radius) {
            damageEnemy(enemy, BASE_SMASH_DAMAGE * 0.85, false, player.position, "splash");
          }
        }
      }
      tone(480, 0.11, "sine", 0.045, 960);
      syncHud();
    };

    const start = (profile: GameProfile, selectedOvertimeRank: OvertimeRank) => {
      void activateAudio().catch(() => {
        notify("音声を開始できません。iPhoneでは音ボタンをもう一度押してください");
      });
      runtime.profile = profile;
      runtime.guestBoss = MID_BOSS_ROTATION[profile.totalRuns % MID_BOSS_ROTATION.length];
      runtime.overtimeRank = selectedOvertimeRank;
      runtime.floor = 1;
      runtime.score = 0;
      runtime.combo = 0;
      runtime.maxCombo = 0;
      runtime.destroyed = 0;
      runtime.runCaps = 0;
      runtime.pressure = 0;
      runtime.rushUntil = 0;
      runtime.rushTriggered = false;
      runtime.kineticChain = 0;
      runtime.kineticChainUntil = 0;
      runtime.lastKineticToast = -10;
      runtime.lastKineticSweep = -10;
      runtime.rerolls = 1;
      runtime.mega = 1;
      runtime.megaGauge = 0;
      runtime.mealReady = profile.fixtures.showcase > 0;
      runtime.trayRescueReady = false;
      runtime.submitted = false;
      runtime.selected = [];
      runtime.maxHp = 100;
      runtime.hp = runtime.maxHp;
      runtime.lastSmash = -10;
      runtime.lastMega = -10;
      runtime.lastDash = -10;
      runtime.megaLockUntil = 0;
      runtime.invulnerableUntil = 0;
      damageLayerRef.current?.replaceChildren();
      for (const key of Object.keys(upgradeValues) as UpgradeId[]) upgradeValues[key] = 0;
      updateEquipmentVisuals();
      setBuild([]);
      setRerolls(1);
      setSummary(null);
      setupFloor();
    };

    const pickUpgrade = (choice: RewardChoice) => {
      if (runtime.playing || runtime.floor >= MAX_FLOOR) return;
      upgradeValues[choice.id] = choice.level;
      runtime.selected.push(choice);
      if (choice.id === "tray") {
        runtime.maxHp += 25;
        runtime.hp = runtime.maxHp;
        if (choice.level >= 3) runtime.trayRescueReady = true;
      }
      if (choice.id === "lantern") gainMegaGauge(50);
      updateEquipmentVisuals();
      const currentBuild = UPGRADES.flatMap((upgrade) => {
        const selected = [...runtime.selected].reverse().find((item) => item.id === upgrade.id);
        return selected ? [selected] : [];
      });
      setBuild(currentBuild);
      playSound("beer");
      runtime.floor += 1;
      setupFloor();
    };

    const rerollReward = () => {
      if (runtime.playing || runtime.floor >= MAX_FLOOR || runtime.rerolls <= 0) return;
      runtime.rerolls -= 1;
      const choices = makeRewardChoices(upgradeValues);
      setRewardChoices(choices);
      setRerolls(runtime.rerolls);
      tone(280, 0.1, "square", 0.05, 520);
      tone(520, 0.15, "triangle", 0.055, 820, 0.08);
      notify("装備候補を入れ替えました");
    };

    const pause = () => {
      if (!runtime.playing) return;
      runtime.paused = !runtime.paused;
      setPaused(runtime.paused);
    };

    const toggleSound = (forceStart = false) => {
      const audioState = audioContext ? getAudioState(audioContext) : "suspended";
      if (!forceStart && soundEnabled && audioState === "running") {
        soundEnabled = false;
        setSoundOn(false);
        return false;
      }
      soundEnabled = true;
      setSoundOn(true);
      void activateAudio()
        .then(() => {
          tone(520, 0.1, "sine", 0.06, 760);
          tone(760, 0.14, "triangle", 0.055, 1040, 0.09);
        })
        .catch(() => notify("音声を開始できません。音ボタンをもう一度押してください"));
      return true;
    };

    const unlockAudio = () => {
      if (!soundEnabled) return;
      void activateAudio().catch(() => {
        // Keep the retry UI visible without interrupting gameplay.
      });
    };

    const testSound = () => {
      soundEnabled = true;
      setSoundOn(true);
      void activateAudio()
        .then(() => {
          tone(392, 0.12, "triangle", 0.085, 523);
          tone(523, 0.14, "triangle", 0.085, 659, 0.1);
          tone(659, 0.22, "sine", 0.075, 988, 0.2);
          notify("♪ 乾杯！この音が聞こえれば準備OKです");
        })
        .catch(() => notify("音声を開始できません。端末の消音設定も確認してください"));
    };

    const returnHub = () => {
      runtime.playing = false;
      runtime.paused = false;
      clearStage();
      setMegaFlash(false);
      player.position.set(0, 0, 9.7);
      setPaused(false);
      setStatus("hub");
      setRewardChoices([]);
      setBuild([]);
    };

    apiRef.current = {
      start,
      smash,
      megaSmash,
      dash,
      pause,
      unlockAudio,
      testSound,
      toggleSound,
      pickUpgrade,
      rerollReward,
      returnHub,
    };

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      unlockAudio();
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Shift"].includes(event.key)) {
        event.preventDefault();
      }
      keys.add(event.key.toLowerCase());
      if (event.key === " ") smash();
      if (event.key.toLowerCase() === "e") megaSmash();
      if (event.key === "Shift") dash();
      if (event.key.toLowerCase() === "p" || event.key === "Escape") pause();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && soundEnabled && audioContext) {
        audioPrimed = false;
        void resumeAudio().catch(() => {
          // iOS may require the next visible tap after returning from the background.
        });
      }
    };
    const onPageShow = () => {
      if (!soundEnabled || !audioContext) return;
      audioPrimed = false;
      void resumeAudio().catch(() => {
        // The next pointer or touch gesture will retry an interrupted context.
      });
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      const aspect = width / Math.max(1, height);
      const viewHeight = aspect < 1 ? 18 : 14.5;
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let requestId = 0;
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      if (!runtime.paused) {
        runtime.elapsed += dt;
        (player.userData.mixer as THREE.AnimationMixer | undefined)?.update(dt);
        physicsRuntime?.step(dt);
      }
      let walking = false;

      if (runtime.playing && !runtime.paused) {
        if (runtime.kineticChain > 0 && runtime.elapsed > runtime.kineticChainUntil) {
          runtime.kineticChain = 0;
        }
        if (runtime.pendingSmash && runtime.elapsed >= runtime.pendingSmash.at) {
          const pending = runtime.pendingSmash;
          runtime.pendingSmash = null;
          performSmash(pending.center);
        }
        if (runtime.pendingMega && runtime.elapsed >= runtime.pendingMega.at) {
          const pending = runtime.pendingMega;
          runtime.pendingMega = null;
          launchMegaMug(pending.origin, pending.direction);
        }

        const rushActive = runtime.elapsed < runtime.rushUntil;
        if (!rushActive && runtime.rushUntil > 0) {
          runtime.rushUntil = 0;
          runtime.pressure = 0;
        } else if (!rushActive) {
          runtime.pressure = Math.max(0, runtime.pressure - dt * 3.6);
        }

        const move = new THREE.Vector2(
          (keys.has("d") || keys.has("arrowright") ? 1 : 0)
            - (keys.has("a") || keys.has("arrowleft") ? 1 : 0)
            + joystickRef.current.x,
          (keys.has("s") || keys.has("arrowdown") ? 1 : 0)
            - (keys.has("w") || keys.has("arrowup") ? 1 : 0)
            + joystickRef.current.z,
        );
        if (move.lengthSq() > 0.02 && runtime.elapsed >= runtime.megaLockUntil) {
          walking = true;
          move.normalize();
          const speed = 5.35
            * (1 + upgradeValues.sneakers * 0.12)
            * (rushActive ? 1.16 : 1);
          player.position.x += move.x * speed * dt;
          player.position.z += move.y * speed * dt;
          player.position.x = THREE.MathUtils.clamp(player.position.x, -9.45, 9.45);
          player.position.z = THREE.MathUtils.clamp(player.position.z, -13.15, 11.35);
          const rotation = Math.atan2(-move.x, -move.y);
          player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, rotation, 0.24);
          player.position.y = Math.sin(runtime.elapsed * 14) * 0.035;
          physicsRuntime?.pushFromPlayer(
            player.position,
            new THREE.Vector3(move.x, 0, move.y),
            0.42 + speed * dt * 0.55,
          );
        } else {
          player.position.y = THREE.MathUtils.lerp(player.position.y, 0, 0.24);
        }

        const aliveMovers = enemies.filter((enemy) => enemy.alive && !enemy.boss && enemy.speed > 0).length;
        for (let i = 0; i < enemies.length; i += 1) {
          const enemy = enemies[i];
          if (!enemy.alive) continue;
          (enemy.group.userData.mixer as THREE.AnimationMixer | undefined)?.update(dt);
          if (enemy.affix === "regenerator"
            && enemy.hp < enemy.maxHp
            && runtime.elapsed - enemy.lastRegen >= 0.65) {
            enemy.lastRegen = runtime.elapsed;
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.025);
            updateEnemyHealth(enemy);
          }
          const toPlayer = player.position.clone().sub(enemy.group.position).setY(0);
          const distance = toPlayer.length();
          const frozen = runtime.elapsed < enemy.frozenUntil;
          const chilled = frozen ? Math.max(0.25, 1 - upgradeValues.chiller * 0.24) : 1;
          (enemy.group.userData.animator as VoxelActionController | undefined)?.update(
            dt,
            runtime.elapsed,
            enemy.speed > 0 && distance > enemy.radius + 0.72,
          );
          const phaseAura = enemy.group.userData.phaseAura as THREE.Mesh | undefined;
          if (phaseAura) {
            phaseAura.rotation.z += dt * 2.8;
            phaseAura.scale.setScalar(1 + Math.sin(runtime.elapsed * 7) * 0.08);
          }

          if (!enemy.boss) {
            const projected = enemy.group.position.clone().add(new THREE.Vector3(0, 0.8, 0)).project(camera);
            const offscreen = projected.x < -0.96 || projected.x > 0.96 || projected.y < -0.92 || projected.y > 0.92;
            if (offscreen) {
              enemy.offscreenSince ??= runtime.elapsed;
              if (
                enemy.attackKind === null
                && runtime.elapsed - enemy.offscreenSince > 2.6
              ) {
                const angle = i / Math.max(1, aliveMovers) * Math.PI * 2 + runtime.elapsed * 0.08;
                enemy.group.position.set(
                  THREE.MathUtils.clamp(player.position.x + Math.cos(angle) * 6.8, -7.6, 7.6),
                  0,
                  THREE.MathUtils.clamp(player.position.z + Math.sin(angle) * 5.8 - 1.2, -9.7, 6.2),
                );
                enemy.offscreenSince = null;
                spawnWave(enemy.group.position, 0x70e8ff, 0.58);
              }
            } else {
              enemy.offscreenSince = null;
            }
          }

          if (enemy.attackKind) {
            if (frozen) {
              enemy.attackStartedAt += dt;
              enemy.attackAt += dt;
            }
            if (enemy.attackWarning) {
              animateDangerZone(enemy.attackWarning, enemy.attackStartedAt, enemy.attackAt, runtime.elapsed);
            }
            if (!frozen && runtime.elapsed >= enemy.attackAt) resolveEnemyAttack(enemy);
            continue;
          }

          if (enemy.characterBoss && runtime.elapsed >= enemy.pulseAt) {
            if (frozen) {
              enemy.pulseAt += dt;
            } else {
              launchCharacterSpecial(enemy);
            }
            continue;
          }

          if (enemy.boss && !enemy.characterBoss && runtime.elapsed >= enemy.pulseAt) {
            beginEnemyAttack(enemy, "pulse");
            continue;
          }

          if (enemy.speed <= 0) continue;

          if (distance > enemy.radius + 0.72) {
            toPlayer.normalize();
            const lastCallBoost = aliveMovers <= 3 && distance > 5.8 ? 1.85 : 1;
            enemy.group.position.addScaledVector(toPlayer, enemy.speed * chilled * lastCallBoost * dt);
            enemy.group.rotation.y = THREE.MathUtils.lerp(
              enemy.group.rotation.y,
              Math.atan2(-toPlayer.x, -toPlayer.z),
              0.12,
            );
          } else if (runtime.elapsed >= enemy.nextAttack) {
            beginEnemyAttack(enemy, "melee");
          }

          for (let j = i + 1; j < enemies.length; j += 1) {
            const other = enemies[j];
            if (!other.alive) continue;
            const separation = enemy.group.position.clone().sub(other.group.position).setY(0);
            const minimum = (enemy.radius + other.radius) * 0.72;
            if (separation.lengthSq() > 0.001 && separation.length() < minimum) {
              separation.normalize().multiplyScalar(dt * 0.65);
              enemy.group.position.add(separation);
              other.group.position.sub(separation);
            }
          }

        }

        resolveKineticImpacts();

        for (let i = hazards.length - 1; i >= 0; i -= 1) {
          const hazard = hazards[i];
          animateDangerZone(hazard.warning, hazard.startedAt, hazard.triggerAt, runtime.elapsed);
          if (runtime.elapsed < hazard.triggerAt) continue;
          let hit = false;
          if (hazard.sourceBoss) spawnBossAttackVisual(hazard);
          if (hazard.shape === "beam") {
            const delta = player.position.clone().sub(hazard.position).setY(0);
            const forwardDistance = delta.dot(hazard.direction);
            const sideDistance = Math.abs(delta.dot(
              new THREE.Vector3(-hazard.direction.z, 0, hazard.direction.x),
            ));
            hit = forwardDistance >= 0
              && forwardDistance <= hazard.length
              && sideDistance <= hazard.width / 2;
            spawnWave(hazard.position, hazard.color, 1.1);
            tone(118, 0.16, "sawtooth", 0.04, 680);
          } else {
            hit = player.position.distanceTo(hazard.position) <= hazard.radius;
            spawnWave(hazard.position, hazard.color, Math.max(0.9, hazard.radius * 0.38));
          }
          if (hit) {
            hurtPlayer(hazard.damage, hazard.position);
          }
          removeDisposableObject(hazard.warning);
          hazards.splice(i, 1);
        }

        for (const pickup of pickups) {
          if (!pickup.active) continue;
          pickup.group.rotation.y += dt * 1.8;
          pickup.group.position.y = pickup.baseY + Math.sin(runtime.elapsed * 3 + pickup.baseY) * 0.13;
          if (pickup.group.position.distanceTo(player.position) < 1.1) {
            pickup.active = false;
            pickup.group.visible = false;
            if (pickup.kind === "beer") {
              const earned = gainMegaGauge(45);
              playSound("beer");
              if (earned === 0) notify("RAIL +45%");
            } else if (pickup.kind === "clock") {
              runtime.freezeUntil = runtime.elapsed + 3.5;
              for (const enemy of enemies) enemy.frozenUntil = runtime.freezeUntil;
              tone(760, 0.2, "sine", 0.06, 1280);
              notify("FREEZE 3.5s");
            } else if (pickup.kind === "cap") {
              runtime.runCaps += 2;
              tone(930, 0.16, "triangle", 0.055, 1320);
              notify("王冠 +2");
            } else {
              runtime.hp = Math.min(runtime.maxHp, runtime.hp + 18);
              tone(520, 0.18, "sine", 0.05, 880);
              notify("HP +18");
            }
            syncHud();
          }
        }

        runtime.comboWindow -= dt;
        if (runtime.comboWindow <= 0 && runtime.combo > 0) {
          runtime.combo = 0;
          syncHud();
        }

        const floorDefinition = FLOORS[runtime.floor - 1];
        if (floorDefinition.kind === "challenge" && runtime.timer !== null) {
          runtime.timer -= dt;
          if (runtime.timer <= 0) {
            runtime.timer = 0;
            finishFloor();
          }
        }
      }

      if (!runtime.paused) {
        updateMegaProjectiles(dt);
        (player.userData.animator as VoxelActionController | undefined)?.update(
          dt,
          runtime.elapsed,
          walking && runtime.playing,
        );
        for (let index = dizzyBosses.length - 1; index >= 0; index -= 1) {
          const dizzy = dizzyBosses[index];
          if (dizzy.removeAt !== null) {
            const remaining = dizzy.removeAt - runtime.elapsed;
            if (remaining <= 0) {
              spawnWave(dizzy.group.position, 0xffffff, 1.25);
              spawnWave(dizzy.group.position, 0xffd23f, 0.8);
              tone(680, 0.16, "sine", 0.04, 1120);
              scene.remove(dizzy.group);
              dizzyBosses.splice(index, 1);
              continue;
            }
            if (remaining < 0.65) {
              dizzy.group.scale.setScalar(Math.max(0.04, remaining / 0.65));
            }
          }
          const time = runtime.elapsed - dizzy.startedAt;
          dizzy.stars.rotation.y += dt * 2.8;
          dizzy.stars.position.y += Math.sin(time * 4.2) * dt * 0.12;
          dizzy.group.rotation.z = 0.16 + Math.sin(time * 2.6) * 0.035;
          dizzy.stars.children.forEach((star, index) => {
            star.rotation.x += dt * (1.4 + index * 0.15);
            star.rotation.z += dt * 1.8;
          });
        }
      }

      for (let i = debris.length - 1; i >= 0; i -= 1) {
        const piece = debris[i];
        piece.life -= dt;
        piece.velocity.y -= 9.8 * dt;
        piece.mesh.position.addScaledVector(piece.velocity, dt);
        piece.mesh.rotation.x += piece.spin.x * dt;
        piece.mesh.rotation.y += piece.spin.y * dt;
        piece.mesh.rotation.z += piece.spin.z * dt;
        if (piece.mesh.position.y < 0.08) {
          piece.mesh.position.y = 0.08;
          piece.velocity.y *= -0.22;
          piece.velocity.x *= 0.82;
          piece.velocity.z *= 0.82;
        }
        (piece.mesh.material as THREE.MeshStandardMaterial).opacity = Math.min(1, piece.life * 1.5);
        if (piece.life <= 0) {
          scene.remove(piece.mesh);
          debris.splice(i, 1);
        }
      }

      for (let i = effects.length - 1; i >= 0; i -= 1) {
        const effect = effects[i];
        effect.life -= dt;
        const progress = 1 - effect.life / effect.maxLife;
        effect.mesh.scale.multiplyScalar(1 + dt * (6 + progress * 4));
        (effect.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, effect.life / effect.maxLife);
        if (effect.life <= 0) {
          scene.remove(effect.mesh);
          effects.splice(i, 1);
        }
      }

      for (let index = timedVisuals.length - 1; index >= 0; index -= 1) {
        const visual = timedVisuals[index];
        visual.life -= dt;
        const opacity = THREE.MathUtils.clamp(visual.life / visual.maxLife, 0, 1);
        visual.object.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if ("opacity" in material) {
              material.transparent = true;
              material.opacity = Math.min(material.opacity, opacity);
            }
          });
        });
        visual.object.rotation.y += dt * visual.spin;
        if (visual.life <= 0) {
          removeDisposableObject(visual.object);
          timedVisuals.splice(index, 1);
        }
      }

      if (runtime.shake > 0.002) {
        camera.position.copy(baseCameraPosition).add(new THREE.Vector3(
          (Math.random() - 0.5) * runtime.shake,
          (Math.random() - 0.5) * runtime.shake * 0.5,
          (Math.random() - 0.5) * runtime.shake,
        ));
        runtime.shake *= Math.pow(0.03, dt);
      } else {
        camera.position.copy(baseCameraPosition);
        runtime.shake = 0;
      }
      camera.lookAt(0, 0, -1.5);

      if (frame % 6 === 0 && runtime.playing) syncHud();
      frame += 1;
      renderer.render(scene, camera);
      requestId = requestAnimationFrame(tick);
    };
    requestId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(requestId);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (bossDialogueTimer.current) window.clearTimeout(bossDialogueTimer.current);
      if (megaFlashTimer.current) window.clearTimeout(megaFlashTimer.current);
      if (tutorialTimer.current) window.clearTimeout(tutorialTimer.current);
      damageLayerRef.current?.replaceChildren();
      detachAudioState?.();
      if (audioContext && getAudioState(audioContext) !== "closed") void audioContext.close();
      physicsDisposed = true;
      physicsRuntime?.dispose();
      physicsRuntime = null;
      renderer.dispose();
      apiRef.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) material.dispose();
        }
      });
    };
  }, [notify, showBossDialogue]);

  const updateJoystick = (clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((clientX - rect.left - rect.width / 2) / (rect.width * 0.34), -1, 1);
    const y = THREE.MathUtils.clamp((clientY - rect.top - rect.height / 2) / (rect.height * 0.34), -1, 1);
    const length = Math.hypot(x, y);
    const nx = length > 1 ? x / length : x;
    const ny = length > 1 ? y / length : y;
    joystickRef.current = { x: nx, z: ny };
    setJoystick({ x: nx * 32, y: ny * 32 });
  };

  const releaseJoystick = () => {
    joystickPointer.current = null;
    joystickRef.current = { x: 0, z: 0 };
    setJoystick({ x: 0, y: 0 });
  };

  const profile = siteData?.profile ?? EMPTY_PROFILE;
  const dailyRank = getDailyFeaturedRank();
  const startFromHub = () => {
    apiRef.current?.start(profile, overtimeRank);
    setHubPanel("play");
    try {
      const tutorialKey = "office-crash-controls-v2";
      if (window.localStorage.getItem(tutorialKey)) return;
      window.localStorage.setItem(tutorialKey, "seen");
      setTutorialVisible(true);
      if (tutorialTimer.current) window.clearTimeout(tutorialTimer.current);
      tutorialTimer.current = window.setTimeout(() => setTutorialVisible(false), 4600);
    } catch {
      // Device-local onboarding is optional when storage is unavailable.
    }
  };
  const shareRun = async (run?: RunSummary | null) => {
    const url = new URL("/", window.location.href).toString();
    const username = profileRef.current.username || EMPTY_PROFILE.username;
    const text = run
      ? `${username}が「そば屋のオフィスクラッシュ」で${formatNumber(run.score)}点・${run.floorReached}F！ この記録、超えられる？`
      : profileRef.current.bestScore > 0
        ? `${username}の自己ベストは${formatNumber(profileRef.current.bestScore)}点！ 「そば屋のオフィスクラッシュ」でこの記録を超えられる？`
        : "備品を壊して、拾って、巨大ジョッキで一掃。そば屋のオフィスクラッシュで勝負しよう！";
    try {
      if (navigator.share) {
        await navigator.share({
          title: "そば屋のオフィスクラッシュ",
          text,
          url,
        });
        notify("共有しました");
        return;
      }
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(`${text}\n${url}`);
      notify("招待リンクをコピー");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        if (!navigator.clipboard) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(`${text}\n${url}`);
        notify("招待リンクをコピー");
      } catch {
        notify("共有できませんでした");
      }
    }
  };
  const hpRatio = Math.max(0, Math.min(100, hud.hp / Math.max(1, hud.maxHp) * 100));
  const dashRatio = Math.max(0, Math.min(100, hud.dashReady * 100));
  const enemyRatio = hud.totalEnemies > 0
    ? Math.max(0, Math.min(100, (hud.totalEnemies - hud.enemies) / hud.totalEnemies * 100))
    : 0;
  const pressureRatio = Math.max(0, Math.min(100, hud.pressure));
  const megaGaugeRatio = Math.max(0, Math.min(100, hud.megaGauge));
  const rushAnnouncement = hud.rushRemaining > 10.5;

  return (
    <main
      className="rpg-shell"
      ref={hostRef}
      onPointerDownCapture={() => apiRef.current?.unlockAudio()}
      onTouchEndCapture={() => apiRef.current?.unlockAudio()}
    >
      <canvas
        ref={canvasRef}
        className="rpg-canvas"
        aria-label="そば屋のオフィスクラッシュ 無限フロア大整理 ゲーム画面"
      />
      <div className="rpg-sun" aria-hidden="true" />
      <div className={`rpg-mega-flash ${megaFlash ? "show" : ""}`} aria-hidden="true" />
      {status === "playing" && (
        <div
          className={`rpg-danger-vignette ${hpRatio <= 35 ? "low-hp" : ""} ${hud.incomingAttack ? "incoming" : ""}`}
          aria-hidden="true"
        />
      )}
      <div className="rpg-damage-layer" ref={damageLayerRef} aria-hidden="true" />

      {status === "playing" && (
        <>
          <header className="rpg-hud">
            <div className="rpg-brand">
              <span>そば屋の</span>
              <strong>オフィスクラッシュ</strong>
              <small>無限フロア大整理</small>
            </div>
            <div className="rpg-floor">
              <span>{hud.kicker}</span>
              <strong>{hud.floor}F</strong>
              <b>{hud.floorName}</b>
              <em>{hud.timer !== null ? `${hud.timer}s` : hud.bossName ? "BOSS" : `残${hud.enemies}`}</em>
            </div>
            <div className="rpg-hud-actions">
              <button
                onClick={() => apiRef.current?.toggleSound(soundOn && !audioReady)}
                aria-label={soundOn && !audioReady ? "効果音を開始" : soundOn ? "効果音をオフ" : "効果音をオン"}
              >
                {soundOn && !audioReady ? "♪" : soundOn ? "🔊" : "🔇"}
              </button>
              <button onClick={() => apiRef.current?.pause()} aria-label="一時停止">Ⅱ</button>
            </div>
          </header>

          {rushAnnouncement && !bossDialogue && (
            <div className="rpg-rush-banner" aria-live="assertive">
              <span>OFFICE RUSH</span>
            </div>
          )}

          <section className="rpg-vitals" aria-label="プレイヤー情報">
            <div className="rpg-vital-row">
              <span>♥</span>
              <div className="rpg-bar"><i style={{ width: `${hpRatio}%` }} /></div>
              <strong>{hud.hp}/{hud.maxHp}</strong>
            </div>
            <div className="rpg-score-row">
              <span>SCORE</span>
              <strong>{formatNumber(hud.score)}</strong>
            </div>
            <div className={`rpg-combo ${hud.combo > 0 ? "active" : ""}`}>
              COMBO {hud.combo} <b>×{hud.multiplier.toFixed(2)}</b>
            </div>
            <div className={`rpg-pressure ${hud.rushRemaining > 0 ? "rush" : ""}`}>
              <span>{hud.rushRemaining > 0 ? `RUSH ${hud.rushRemaining.toFixed(1)}s` : "HEAT"}</span>
              <div><i style={{ width: `${pressureRatio}%` }} /></div>
            </div>
          </section>

          <section className="rpg-objective" aria-live="polite">
            <span>{hud.timer !== null ? `${hud.timer}s` : hud.bossName || `残 ${hud.enemies}`}</span>
            {hud.offscreenEnemies > 0 && <em>↥ {hud.offscreenEnemies}</em>}
            {hud.incomingAttack && <em className="attack-alert">DODGE!</em>}
            <div className="rpg-progress"><i style={{ width: `${enemyRatio}%` }} /></div>
          </section>

          <aside
            className={`rpg-physics-status ${hud.physicsOnline ? "online" : ""} ${
              hud.kineticChain > 0 ? "chaining" : ""
            }`}
            aria-live="polite"
          >
            <span>RAPIER × KOOTA</span>
            <strong>{hud.physicsOnline ? `${hud.physicsMoving} MOVING` : "WARMING UP"}</strong>
            <small>{hud.physicsBodies} BODIES</small>
            {hud.kineticChain > 0 && <em>PHYSICS CHAIN ×{hud.kineticChain}</em>}
          </aside>

          {build.length > 0 && (
            <aside className="rpg-build-rail" aria-label="現在のビルド">
              {build.map((item) => (
                <div
                  className={`rpg-build-chip level-${item.level}`}
                  key={item.id}
                  title={`${item.displayName} · ${item.effect}`}
                  aria-label={`${item.displayName} レベル${item.level}、${item.effect}`}
                >
                  <img src={item.image} alt="" />
                  <em>Lv.{item.level}</em>
                </div>
              ))}
            </aside>
          )}

          <div className={`rpg-mega ${hud.mega > 0 ? "ready" : ""}`}>
            <span>RAIL</span>
            <div className="rpg-mega-stocks">
              {Array.from({ length: hud.megaMax }, (_, slot) => (
                <i className={slot < hud.mega ? "full" : ""} key={slot}>生</i>
              ))}
            </div>
            <div className="rpg-mega-gauge"><i style={{ width: `${megaGaugeRatio}%` }} /></div>
          </div>

          {tutorialVisible && (
            <div className="rpg-tutorial" aria-live="polite">
              <span><kbd>WASD</kbd><b>MOVE</b></span>
              <span><kbd>SPACE</kbd><b>SMASH</b></span>
              <span><kbd>SHIFT</kbd><b>DASH</b></span>
              <span><kbd>E</kbd><b>RAIL</b></span>
            </div>
          )}

          <div
            className="rpg-joystick"
            role="button"
            aria-label="移動ジョイスティック"
            tabIndex={0}
            onPointerDown={(event) => {
              joystickPointer.current = event.pointerId;
              event.currentTarget.setPointerCapture(event.pointerId);
              updateJoystick(event.clientX, event.clientY, event.currentTarget);
            }}
            onPointerMove={(event) => {
              if (joystickPointer.current === event.pointerId) {
                updateJoystick(event.clientX, event.clientY, event.currentTarget);
              }
            }}
            onPointerUp={releaseJoystick}
            onPointerCancel={releaseJoystick}
          >
            <span aria-hidden="true">▲<b>◀　▶</b>▼</span>
            <i style={{ transform: `translate(${joystick.x}px, ${joystick.y}px)` }} />
          </div>

          <div className="rpg-action-stack">
            <div className="rpg-sub-actions">
              <button
                className="rpg-dash-button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  apiRef.current?.dash();
                }}
                aria-label="ダッシュ"
              >
                <i style={{ width: `${dashRatio}%` }} />
                <strong>DASH</strong>
              </button>
              <button
                className={`rpg-mega-button ${hud.mega > 0 ? "ready" : ""}`}
                disabled={hud.mega <= 0}
                onPointerDown={(event) => {
                  event.preventDefault();
                  apiRef.current?.megaSmash();
                }}
                aria-label={`必殺生ジョッキレール 残り${hud.mega}、ゲージ${Math.round(hud.megaGauge)}パーセント`}
              >
                <i
                  className="mobile-mega-fill"
                  style={{ height: `${megaGaugeRatio}%` }}
                  aria-hidden="true"
                />
                <span>必殺</span>
                <strong>RAIL</strong>
                <small>{hud.mega > 0 ? `×${hud.mega}` : `${Math.round(hud.megaGauge)}%`}</small>
              </button>
            </div>
            <button
              className="rpg-smash-button"
              onPointerDown={(event) => {
                event.preventDefault();
                apiRef.current?.smash();
              }}
              aria-label="ジョッキスマッシュ"
            >
              <span aria-hidden="true">槌</span>
              <strong>SMASH!</strong>
            </button>
          </div>
        </>
      )}

      <div
        className={`rpg-toast ${toast ? "show" : ""} ${bossDialogue || rushAnnouncement ? "suppressed" : ""}`}
        aria-live="assertive"
      >
        {toast}
      </div>
      <div
        className={`rpg-boss-dialogue ${bossDialogue ? "show" : ""}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span>BOSS VOICE</span>
        <strong>{bossDialogue}</strong>
      </div>

      {status === "hub" && (
        <section className="rpg-overlay hub-overlay" aria-labelledby="hub-title">
          <div className="hub-card">
            <div className="hub-copy">
              <p className="rpg-eyebrow">MADOGIWA HACK, SMASH & DRAFT</p>
              <h1 id="hub-title">
                <span>そば屋の</span>
                オフィスクラッシュ
                <small>無限フロア大整理</small>
              </h1>
              <p className="hub-tagline">壊して。拾って。一掃。</p>
              <div className="hub-loop" aria-hidden="true">
                <span><b>壊</b><small>BREAK</small></span>
                <i>›</i>
                <span><b>選</b><small>BUILD</small></span>
                <i>›</i>
                <span><b>生</b><small>RAIL</small></span>
              </div>
              <p className="hub-physics-note">
                <b>NEW PHYSICS</b>
                備品を吹き飛ばし、敵へぶつけて連鎖スコア
              </p>
              <blockquote>
                「弊社の備品が自律歩行を始めており、大変驚いております」
              </blockquote>
              <div className="hub-quick-stats" aria-label="自己記録">
                <span><small>BEST</small><b>{formatNumber(profile.bestScore)}</b></span>
                <span><small>TOP FLOOR</small><b>{profile.bestFloor || "—"}F</b></span>
              </div>
            </div>

            <div className="hub-data">
              <nav className="hub-tabs" role="tablist" aria-label="立ち飲み処メニュー">
                {([
                  ["play", "出撃"],
                  ["bar", "設備"],
                  ["records", "記録"],
                ] as const).map(([panel, label]) => (
                  <button
                    type="button"
                    role="tab"
                    id={`hub-tab-${panel}`}
                    aria-controls={`hub-panel-${panel}`}
                    aria-selected={hubPanel === panel}
                    className={hubPanel === panel ? "active" : ""}
                    onClick={() => setHubPanel(panel)}
                    key={panel}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {hubPanel === "play" && (
                <section
                  className="hub-panel hub-play-panel"
                  id="hub-panel-play"
                  role="tabpanel"
                  aria-labelledby="hub-tab-play"
                >
                  <div className="panel-heading">
                    <span>NEXT RUN</span>
                    <strong>退社作戦</strong>
                  </div>
                  <div className="overtime-options">
                    {OVERTIME_RANKS.map((rank) => (
                      <button
                        type="button"
                        className={`${overtimeRank === rank.rank ? "active" : ""} ${dailyRank === rank.rank ? "daily" : ""}`}
                        key={rank.rank}
                        onClick={() => setOvertimeRank(rank.rank)}
                        title={rank.description}
                        aria-label={`${rank.label}、得点${rank.scoreMultiplier.toFixed(2)}倍、破壊数${rank.destructionMultiplier.toFixed(1)}倍`}
                        aria-pressed={overtimeRank === rank.rank}
                      >
                        <span className="risk-pips" aria-hidden="true">
                          {Array.from({ length: rank.rank + 1 }, (_, index) => <i key={index} />)}
                        </span>
                        <b>{rank.label}</b>
                        <em>×{rank.scoreMultiplier.toFixed(2)}</em>
                        {dailyRank === rank.rank && <small>TODAY +1/階</small>}
                      </button>
                    ))}
                  </div>
                  <div className="active-run-brief" aria-live="polite">
                    <strong>{OVERTIME_RANKS[overtimeRank].label}</strong>
                    <span>SCORE ×{OVERTIME_RANKS[overtimeRank].scoreMultiplier.toFixed(2)}</span>
                    <span>ノルマ ×{OVERTIME_RANKS[overtimeRank].destructionMultiplier.toFixed(1)}</span>
                  </div>
                  <button
                    className="hub-start"
                    onClick={startFromHub}
                    disabled={profileLoading}
                  >
                    <span>{profileLoading ? "準備中…" : "突入！"}</span>
                  </button>
                  {profileError && (
                    <button className="profile-retry" onClick={() => void refreshProfile()}>
                      再接続
                    </button>
                  )}
                </section>
              )}

              {hubPanel === "bar" && (
                <section
                  className="hub-panel hub-bar-panel"
                  id="hub-panel-bar"
                  role="tabpanel"
                  aria-labelledby="hub-tab-bar"
                >
                  <div className="panel-heading fixture-heading">
                    <span>立ち飲み処</span>
                    <strong>王冠設備</strong>
                    <em>王冠 {formatNumber(profile.caps)}</em>
                  </div>
                  <form className="username-panel" onSubmit={(event) => void saveUsername(event)}>
                    <div className="panel-heading">
                      <span>PLAYER</span>
                      <strong>スコアボード名</strong>
                    </div>
                    <div className="username-controls">
                      <input
                        type="text"
                        value={usernameDraft}
                        maxLength={20}
                        disabled={profileLoading || usernameBusy}
                        onChange={(event) => {
                          setUsernameDraft(event.target.value);
                          setUsernameMessage("");
                        }}
                        placeholder="匿名窓際社員"
                        aria-label="スコアボードに表示するユーザーネーム"
                      />
                      <button type="submit" disabled={profileLoading || usernameBusy}>
                        {usernameBusy ? "保存中…" : "保存"}
                      </button>
                    </div>
                    {usernameMessage && <small className="has-message">{usernameMessage}</small>}
                  </form>
                  <div className="fixture-grid">
                    {FIXTURES.map((fixture) => {
                    const level = profile.fixtures[fixture.id];
                    const cost = fixtureCost(level);
                    return (
                      <div
                        className={`fixture-card level-${level}`}
                        key={fixture.id}
                        title={level > 0 ? fixture.levels[level - 1] : fixture.description}
                      >
                        <img src={fixture.image} alt="" />
                        <span>
                          <strong>{fixture.name}</strong>
                          <small>{level > 0 ? fixture.levels[level - 1] : "未設置"}</small>
                        </span>
                        <em>Lv.{level}</em>
                        <button
                          onClick={() => void buyFixture(fixture.id)}
                          disabled={profileLoading || fixtureBusy !== null || level >= 3}
                          aria-label={`${fixture.name}を${level >= 3 ? "最大強化済み" : `${cost}王冠で強化`}`}
                        >
                          {level >= 3 ? "MAX" : `${cost}`}
                        </button>
                      </div>
                    );
                    })}
                  </div>
                  <div className={`audio-check ${audioReady ? "ready" : ""} ${audioError ? "error" : ""}`}>
                    <button type="button" onClick={() => apiRef.current?.testSound()}>
                      <span aria-hidden="true">{audioReady ? "🔊" : "🔈"}</span>
                      {audioReady ? "サウンド OK" : "サウンドテスト"}
                    </button>
                    {audioError && <small>消音を解除して再試行</small>}
                  </div>
                </section>
              )}

              {hubPanel === "records" && (
                <section
                  className="hub-panel hub-records-panel"
                  id="hub-panel-records"
                  role="tabpanel"
                  aria-labelledby="hub-tab-records"
                >
                  <div className="hub-stats">
                    <div><span>BEST</span><strong>{formatNumber(profile.bestScore)}</strong></div>
                    <div><span>TOP</span><strong>{profile.bestFloor || "—"}F</strong></div>
                    <div><span>CLEAR</span><strong>{profile.clears}</strong></div>
                    <div><span>RUN</span><strong>{profile.totalRuns}</strong></div>
                  </div>
                  <section className="leaderboard-panel">
                    <div className="panel-heading"><span>TOP 5</span><strong>スコアボード</strong></div>
                    {(siteData?.leaderboard ?? []).slice(0, 5).map((run, index) => (
                      <p className="leader-row" key={`${run.username}-${run.score}-${index}`}>
                        <b>#{index + 1}</b>
                        <span>
                          <strong>{run.username || EMPTY_PROFILE.username}</strong>
                          <small>{run.floorReached}F・{getOvertimeDefinition(run.overtimeRank).label}</small>
                        </span>
                        <em>{formatNumber(run.score)}</em>
                      </p>
                    ))}
                    {!siteData?.leaderboard.length && <p className="muted">最初の伝説を作ろう</p>}
                  </section>
                  <div className="hub-global-stats">
                    <span><b>{formatNumber(Number(siteData?.globalStats.runs ?? 0))}</b> RUNS</span>
                    <span><b>{formatNumber(Number(siteData?.globalStats.destroyed ?? 0))}</b> BREAKS</span>
                  </div>
                  <button className="hub-share" type="button" onClick={() => void shareRun()}>
                    友達を招待
                  </button>
                </section>
              )}
            </div>
          </div>
        </section>
      )}

      {status === "reward" && (
        <section className="rpg-overlay reward-overlay" aria-labelledby="reward-title">
          <div className="reward-card">
            <p className="rpg-eyebrow">FLOOR {hud.floor} CLEAR — LOOT DRAFT</p>
            <h2 id="reward-title">1つ取る</h2>
            <div className="reward-grid">
              {rewardChoices.map((choice) => (
                <button
                  className={`loot-card level-${choice.level}`}
                  key={choice.id}
                  onClick={() => apiRef.current?.pickUpgrade(choice)}
                  title={`${choice.description} ${choice.effect}`}
                  aria-label={`${choice.displayName}、${choice.role}、${choice.description}、${choice.effect}`}
                >
                  <span className="loot-rarity">Lv.{choice.level}・{choice.evolution}</span>
                  <img className="loot-image" src={choice.image} alt="" />
                  <strong>{choice.displayName}</strong>
                  <em>{choice.effect}</em>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="loot-reroll"
              onClick={() => apiRef.current?.rerollReward()}
              disabled={rerolls <= 0}
            >
              引き直す <b>{rerolls}</b>
            </button>
          </div>
        </section>
      )}

      {(status === "gameover" || status === "victory") && summary && (
        <section className={`rpg-overlay result-overlay ${status}`} aria-labelledby="result-title">
          <div className="result-card">
            <span className="result-stamp">{summary.victory ? "REGULATION CLEAR!" : "BONK! 搬送完了"}</span>
            <p className="rpg-eyebrow">{summary.victory ? "ALL 8 FLOORS COMPLETE" : `REACHED FLOOR ${summary.floorReached}`}</p>
            <h2 id="result-title">{getRank(summary)}</h2>
            <div className="result-score">
              <span>FINAL SCORE</span>
              <strong>{formatNumber(summary.score)}</strong>
              <small>{OVERTIME_RANKS[summary.overtimeRank].label} ×{OVERTIME_RANKS[summary.overtimeRank].scoreMultiplier.toFixed(2)} ／ {summary.buildName}</small>
              <em>
                {summary.score >= profile.bestScore
                  ? "NEW BEST"
                  : `BESTまで ${formatNumber(profile.bestScore - summary.score)}`}
              </em>
            </div>
            <div className="result-grid">
              <div><span>到達</span><strong>{summary.floorReached}F</strong></div>
              <div><span>備品整理</span><strong>{summary.destroyed}</strong></div>
              <div><span>MAX COMBO</span><strong>{summary.maxCombo}</strong></div>
              <div><span>獲得王冠</span><strong>+{summary.capsEarned}</strong></div>
            </div>
            <div className="result-build">
              {build.map((item) => (
                <span className={`level-${item.level}`} key={item.id}>
                  <img src={item.image} alt="" /> {item.displayName}
                </span>
              ))}
            </div>
            <div className="result-actions">
              <button onClick={() => apiRef.current?.start(profileRef.current, overtimeRank)}>もう一度</button>
              <button onClick={() => void shareRun(summary)}>記録を共有</button>
              <button onClick={() => apiRef.current?.returnHub()}>立ち飲み処</button>
            </div>
          </div>
        </section>
      )}

      {paused && status === "playing" && (
        <section className="rpg-overlay pause-overlay">
          <div className="pause-card">
            <p className="rpg-eyebrow">PAUSED REGULATION</p>
            <strong>一時休憩です！</strong>
            <button onClick={() => apiRef.current?.pause()}>片付けを続ける</button>
          </div>
        </section>
      )}
    </main>
  );
}
