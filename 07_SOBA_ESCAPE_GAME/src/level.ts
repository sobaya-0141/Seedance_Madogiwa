import {
  FUKUCHAN,
  OKAYAMAN,
  TAKOSAN,
  TOKUN,
  YAMETARO,
  YOTAN,
  YUMEMIN,
  type CharacterMeta,
} from "./characters.js";

export type Point = { x: number; z: number };
export type Box = Point & { w: number; d: number };

export type PatrolEnemy = {
  meta: CharacterMeta;
  kind: "patrol";
  speed: number;
  fov: number;
  range: number;
  hearing: number;
  points: Point[];
};

export type CameraEnemy = {
  meta: CharacterMeta;
  kind: "camera";
  fov: number;
  range: number;
  hearing: number;
  at: Point;
  baseFacing: number;
  sweepAmp: number;
  sweepSpeed: number;
};

export type EnemyConfig = PatrolEnemy | CameraEnemy;
export type PickupKind = "objective" | "loot";

export type PickupDefinition = {
  id: string;
  label: string;
  detail: string;
  kind: PickupKind;
  at: Point;
  color: string;
  icon: string;
};

export type ExitDefinition = {
  id: string;
  label: string;
  at: Point;
  size: { w: number; d: number };
  secret?: boolean;
  requiresAllItems?: boolean;
};

export type LevelPalette = {
  background: string;
  fog: string;
  floor: string;
  grid: string;
  wall: string;
  obstacle: string;
  accent: string;
};

export type LevelDefinition = {
  id: string;
  number: number;
  title: string;
  kicker: string;
  description: string;
  objectiveText: string;
  parTime: number;
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
  outerWalls: Box[];
  obstacles: Box[];
  playerStart: Point;
  enemies: EnemyConfig[];
  pickups: PickupDefinition[];
  exits: ExitDefinition[];
  palette: LevelPalette;
};

const BOUNDS = { xMin: -22, xMax: 22, zMin: -20, zMax: 20 };
const OUTER_WALLS: Box[] = [
  { x: 0, z: -20, w: 44, d: 1 },
  { x: 0, z: 20, w: 44, d: 1 },
  { x: -22, z: 0, w: 1, d: 40 },
  { x: 22, z: 0, w: 1, d: 40 },
];

const mainExit = (label = "エレベーターホール"): ExitDefinition => ({
  id: "main",
  label,
  at: { x: 18, z: -18.4 },
  size: { w: 6, d: 2.3 },
});

const secretExit = (): ExitDefinition => ({
  id: "secret",
  label: "人型の壁穴",
  at: { x: -18, z: -18.4 },
  size: { w: 5, d: 2.3 },
  secret: true,
  requiresAllItems: true,
});

const palette = (
  background: string,
  floor: string,
  wall: string,
  obstacle: string,
  accent: string,
): LevelPalette => ({
  background,
  fog: background,
  floor,
  grid: accent,
  wall,
  obstacle,
  accent,
});

export const LEVELS: LevelDefinition[] = [
  {
    id: "general-office",
    number: 1,
    title: "一般オフィス",
    kicker: "17:59 / FIRST DASH",
    description: "机とパーテーションの死角を読み、退社チェックを済ませて出口へ向かう。",
    objectiveText: "PC電源とジョッキを確認する",
    parTime: 75,
    bounds: BOUNDS,
    outerWalls: OUTER_WALLS,
    obstacles: [
      { x: -14, z: -10, w: 12, d: 5 },
      { x: 2, z: -12, w: 9, d: 4 },
      { x: 15, z: -8, w: 7, d: 6 },
      { x: -4, z: 0, w: 8, d: 5 },
      { x: 12, z: 3, w: 8, d: 4 },
      { x: -17, z: 2, w: 5, d: 7 },
      { x: 3, z: 12, w: 13, d: 6 },
      { x: -14, z: 11, w: 7, d: 4 },
    ],
    playerStart: { x: -18, z: 16 },
    enemies: [
      {
        meta: FUKUCHAN,
        kind: "patrol",
        speed: 3.2,
        fov: 1.1,
        range: 10,
        hearing: 1,
        points: [{ x: -18, z: -16 }, { x: 10, z: -16 }],
      },
      {
        meta: YOTAN,
        kind: "patrol",
        speed: 3,
        fov: 1.18,
        range: 10,
        hearing: 1.05,
        points: [{ x: 6, z: -6 }, { x: 6, z: 8 }],
      },
      {
        meta: OKAYAMAN,
        kind: "camera",
        fov: 0.96,
        range: 12.5,
        hearing: 0,
        at: { x: 13, z: -18.3 },
        baseFacing: 0,
        sweepAmp: 0.9,
        sweepSpeed: 0.65,
      },
    ],
    pickups: [
      {
        id: "power",
        label: "PC電源OFF",
        detail: "本日の業務終了を確認",
        kind: "objective",
        at: { x: -12, z: 4 },
        color: "#55d6ff",
        icon: "🖥️",
      },
      {
        id: "mug",
        label: "愛用ジョッキ",
        detail: "明日も使う大事な一杯",
        kind: "objective",
        at: { x: 16, z: 13 },
        color: "#ffc857",
        icon: "🍺",
      },
      {
        id: "lantern",
        label: "赤提灯",
        detail: "立ち飲み処の予備",
        kind: "loot",
        at: { x: -19, z: -7 },
        color: "#ff5c5c",
        icon: "🏮",
      },
      {
        id: "yakitori",
        label: "焼き鳥セット",
        detail: "帰宅前のまかない",
        kind: "loot",
        at: { x: 15, z: 7 },
        color: "#ff9b42",
        icon: "🍢",
      },
    ],
    exits: [mainExit(), secretExit()],
    palette: palette("#081813", "#172a22", "#354d42", "#2b5948", "#5effa6"),
  },
  {
    id: "meeting-maze",
    number: 2,
    title: "会議室迷宮",
    kicker: "18:00 / GLASS ROUTE",
    description: "長い会議机とガラス会議室が視線を分断する。巡回の切れ目を見つけよう。",
    objectiveText: "退社スタンプを2つ集める",
    parTime: 92,
    bounds: BOUNDS,
    outerWalls: OUTER_WALLS,
    obstacles: [
      { x: -15, z: -12, w: 10, d: 6 },
      { x: -2, z: -12, w: 10, d: 2.2 },
      { x: 12, z: -12, w: 8, d: 6 },
      { x: -12, z: -2, w: 2.4, d: 10 },
      { x: 0, z: -1, w: 12, d: 2.4 },
      { x: 14, z: 0, w: 2.4, d: 11 },
      { x: -15, z: 10, w: 10, d: 6 },
      { x: 1, z: 11, w: 10, d: 2.4 },
      { x: 15, z: 12, w: 7, d: 5 },
    ],
    playerStart: { x: -18, z: 17 },
    enemies: [
      {
        meta: TOKUN,
        kind: "patrol",
        speed: 2.7,
        fov: 1.08,
        range: 9.5,
        hearing: 0.8,
        points: [{ x: -18, z: 4 }, { x: -8, z: 4 }, { x: -8, z: -16 }],
      },
      {
        meta: YAMETARO,
        kind: "patrol",
        speed: 3.35,
        fov: 1.2,
        range: 9,
        hearing: 1.2,
        points: [
          { x: 6, z: 17 },
          { x: 10, z: 17 },
          { x: 10, z: 7 },
          { x: 18, z: 7 },
        ],
      },
      {
        meta: YOTAN,
        kind: "patrol",
        speed: 3,
        fov: 1.15,
        range: 10.5,
        hearing: 1,
        points: [{ x: -7, z: -7 }, { x: 8, z: -7 }],
      },
      {
        meta: OKAYAMAN,
        kind: "camera",
        fov: 1.02,
        range: 13,
        hearing: 0,
        at: { x: 17, z: -18.2 },
        baseFacing: 0,
        sweepAmp: 1,
        sweepSpeed: 0.78,
      },
    ],
    pickups: [
      {
        id: "stamp-a",
        label: "退社スタンプA",
        detail: "会議室の確認印",
        kind: "objective",
        at: { x: -17, z: -15 },
        color: "#65d6ff",
        icon: "✅",
      },
      {
        id: "stamp-b",
        label: "退社スタンプB",
        detail: "ラウンジの確認印",
        kind: "objective",
        at: { x: 16, z: 5 },
        color: "#65d6ff",
        icon: "✅",
      },
      {
        id: "wanted",
        label: "WANTEDポスター",
        detail: "やめさんの予備手配書",
        kind: "loot",
        at: { x: -7, z: 15 },
        color: "#d9a066",
        icon: "📜",
      },
      {
        id: "agenda",
        label: "窓際会議メモ",
        detail: "レギュレーション外の議題",
        kind: "loot",
        at: { x: 7, z: -16 },
        color: "#ff7fd1",
        icon: "📝",
      },
      {
        id: "lei",
        label: "予備のレイ",
        detail: "とーくんの南国セット",
        kind: "loot",
        at: { x: 18, z: 16 },
        color: "#ffd45f",
        icon: "🌺",
      },
    ],
    exits: [mainExit("正面エレベーター"), secretExit()],
    palette: palette("#111323", "#242842", "#454a6a", "#394267", "#8ba8ff"),
  },
  {
    id: "server-floor",
    number: 3,
    title: "サーバーフロア",
    kicker: "18:01 / LOW LIGHT",
    description: "機械音に足音を紛らわせ、細いサーバー列を縫って脱出する。",
    objectiveText: "冷却確認と消灯確認を済ませる",
    parTime: 100,
    bounds: BOUNDS,
    outerWalls: OUTER_WALLS,
    obstacles: [
      { x: -17, z: -10, w: 4, d: 15 },
      { x: -9, z: -6, w: 4, d: 20 },
      { x: -1, z: -10, w: 4, d: 15 },
      { x: 7, z: -5, w: 4, d: 21 },
      { x: 15, z: -10, w: 4, d: 15 },
      { x: -13, z: 13, w: 6, d: 4 },
      { x: 0, z: 12, w: 10, d: 4 },
      { x: 15, z: 13, w: 5, d: 5 },
    ],
    playerStart: { x: -19, z: 17 },
    enemies: [
      {
        meta: FUKUCHAN,
        kind: "patrol",
        speed: 3,
        fov: 1.02,
        range: 9.5,
        hearing: 0.85,
        points: [{ x: -13, z: 4 }, { x: -13, z: -17 }],
      },
      {
        meta: YUMEMIN,
        kind: "patrol",
        speed: 3.5,
        fov: 1.35,
        range: 8.5,
        hearing: 1.25,
        points: [{ x: 3, z: 6 }, { x: 3, z: -17 }, { x: 11, z: -17 }],
      },
      {
        meta: YOTAN,
        kind: "patrol",
        speed: 3.1,
        fov: 1.08,
        range: 10,
        hearing: 1,
        points: [{ x: 11, z: 6 }, { x: 19, z: 5 }],
      },
      {
        meta: OKAYAMAN,
        kind: "camera",
        fov: 0.92,
        range: 14,
        hearing: 0,
        at: { x: 18, z: -18.1 },
        baseFacing: 0,
        sweepAmp: 0.88,
        sweepSpeed: 0.58,
      },
    ],
    pickups: [
      {
        id: "cooling",
        label: "冷却確認",
        detail: "サーバーはキンキンです！",
        kind: "objective",
        at: { x: -5, z: -16 },
        color: "#5ce1ff",
        icon: "❄️",
      },
      {
        id: "lights",
        label: "消灯確認",
        detail: "最終チェック完了",
        kind: "objective",
        at: { x: 18, z: 8 },
        color: "#5ce1ff",
        icon: "💡",
      },
      {
        id: "chiller",
        label: "冷却サーバー部品",
        detail: "立ち飲み処へ転用可能",
        kind: "loot",
        at: { x: -19, z: -17 },
        color: "#5ce1ff",
        icon: "🧊",
      },
      {
        id: "cable",
        label: "虹色LANケーブル",
        detail: "用途は不明だが綺麗",
        kind: "loot",
        at: { x: 11, z: 16 },
        color: "#bb87ff",
        icon: "🌈",
      },
      {
        id: "fan",
        label: "強力扇風機",
        detail: "タコ部屋より高性能",
        kind: "loot",
        at: { x: 19, z: -4 },
        color: "#8ef5c5",
        icon: "🌀",
      },
    ],
    exits: [mainExit("保守用エレベーター"), secretExit()],
    palette: palette("#07131f", "#10263a", "#213c55", "#19344f", "#54d9ff"),
  },
  {
    id: "window-lounge",
    number: 4,
    title: "窓際ラウンジ",
    kicker: "18:02 / FESTIVAL FLOOR",
    description: "ソファ、楽器、キャンプ用品で賑わう自由空間。仲間の視線も自由に動く。",
    objectiveText: "暖簾とビールサーバーを片付ける",
    parTime: 108,
    bounds: BOUNDS,
    outerWalls: OUTER_WALLS,
    obstacles: [
      { x: -16, z: -12, w: 9, d: 5 },
      { x: -3, z: -14, w: 8, d: 3 },
      { x: 12, z: -12, w: 12, d: 4 },
      { x: -15, z: -2, w: 5, d: 8 },
      { x: -3, z: 0, w: 10, d: 5 },
      { x: 12, z: 1, w: 8, d: 7 },
      { x: -15, z: 11, w: 10, d: 5 },
      { x: 1, z: 12, w: 9, d: 5 },
      { x: 16, z: 12, w: 6, d: 6 },
    ],
    playerStart: { x: -19, z: 17 },
    enemies: [
      {
        meta: TOKUN,
        kind: "patrol",
        speed: 2.8,
        fov: 1.08,
        range: 9,
        hearing: 0.72,
        points: [{ x: -19, z: 5 }, { x: -7, z: 5 }, { x: -7, z: 16 }],
      },
      {
        meta: YOTAN,
        kind: "patrol",
        speed: 3.25,
        fov: 1.22,
        range: 10.5,
        hearing: 1.1,
        points: [{ x: -9, z: -8 }, { x: 7, z: -8 }],
      },
      {
        meta: FUKUCHAN,
        kind: "patrol",
        speed: 3,
        fov: 1.1,
        range: 10,
        hearing: 1,
        points: [{ x: 7, z: 7 }, { x: 20, z: 7 }, { x: 20, z: 17 }],
      },
      {
        meta: YAMETARO,
        kind: "patrol",
        speed: 3.55,
        fov: 1.16,
        range: 8.8,
        hearing: 1.25,
        points: [{ x: 5, z: -3 }, { x: 20, z: -5 }, { x: 20, z: -17 }],
      },
    ],
    pickups: [
      {
        id: "curtain",
        label: "紺の暖簾",
        detail: "営業終了につき回収",
        kind: "objective",
        at: { x: -11, z: -17 },
        color: "#6f8cff",
        icon: "暖",
      },
      {
        id: "beer-server",
        label: "ビールサーバー",
        detail: "蛇口を閉めて退社準備",
        kind: "objective",
        at: { x: 17, z: 16 },
        color: "#ffc857",
        icon: "🍻",
      },
      {
        id: "ukulele-case",
        label: "ウクレレケース",
        detail: "演奏は続いている",
        kind: "loot",
        at: { x: -18, z: -6 },
        color: "#f2a65a",
        icon: "🎸",
      },
      {
        id: "heavy-laptop",
        label: "非常に重いPC",
        detail: "福ちゃんの忘れ物",
        kind: "loot",
        at: { x: 6, z: 16 },
        color: "#b0bec5",
        icon: "💻",
      },
      {
        id: "camp-kit",
        label: "キャンプ用品",
        detail: "明日の窓際活動用",
        kind: "loot",
        at: { x: 17, z: -16 },
        color: "#76d275",
        icon: "⛺",
      },
    ],
    exits: [mainExit("窓際エレベーター"), secretExit()],
    palette: palette("#1b1011", "#35201d", "#604034", "#5b392e", "#ffb448"),
  },
  {
    id: "regulation-room",
    number: 5,
    title: "窓際リモート会議室",
    kicker: "18:03 / FINAL REGULATION",
    description: "おかやまんの監視網を読み切り、最後の退社承認を獲得する最終フロア。",
    objectiveText: "3つの退社承認を集める",
    parTime: 125,
    bounds: BOUNDS,
    outerWalls: OUTER_WALLS,
    obstacles: [
      { x: -16, z: -13, w: 8, d: 5 },
      { x: -4, z: -13, w: 8, d: 5 },
      { x: 9, z: -13, w: 9, d: 5 },
      { x: 18, z: -8, w: 4, d: 9 },
      { x: -17, z: -2, w: 5, d: 8 },
      { x: -5, z: -2, w: 9, d: 4 },
      { x: 9, z: 0, w: 9, d: 4 },
      { x: -16, z: 10, w: 8, d: 6 },
      { x: -3, z: 12, w: 8, d: 5 },
      { x: 11, z: 11, w: 10, d: 6 },
    ],
    playerStart: { x: -19, z: 17 },
    enemies: [
      {
        meta: TAKOSAN,
        kind: "patrol",
        speed: 2.9,
        fov: 1.45,
        range: 10.5,
        hearing: 1.25,
        points: [{ x: -18, z: 4 }, { x: -11, z: 4 }, { x: -11, z: -17 }],
      },
      {
        meta: FUKUCHAN,
        kind: "patrol",
        speed: 3.15,
        fov: 1.12,
        range: 10.5,
        hearing: 1,
        points: [{ x: -10, z: 17 }, { x: 2, z: 17 }, { x: 2, z: 5 }],
      },
      {
        meta: YOTAN,
        kind: "patrol",
        speed: 3.35,
        fov: 1.2,
        range: 11,
        hearing: 1.1,
        points: [{ x: 4, z: -7 }, { x: 14, z: -7 }],
      },
      {
        meta: YUMEMIN,
        kind: "patrol",
        speed: 3.65,
        fov: 1.35,
        range: 9.5,
        hearing: 1.25,
        points: [
          { x: 6, z: 6 },
          { x: 20, z: 6 },
          { x: 20, z: 17 },
          { x: 20, z: 3 },
        ],
      },
      {
        meta: OKAYAMAN,
        kind: "camera",
        fov: 1.05,
        range: 14.5,
        hearing: 0,
        at: { x: 17, z: -18.2 },
        baseFacing: 0,
        sweepAmp: 1.08,
        sweepSpeed: 0.82,
      },
    ],
    pickups: [
      {
        id: "approval-a",
        label: "退社承認・緑",
        detail: "レギュレーション照合済み",
        kind: "objective",
        at: { x: -18, z: -16 },
        color: "#5effa6",
        icon: "🟢",
      },
      {
        id: "approval-b",
        label: "退社承認・青",
        detail: "リモート確認済み",
        kind: "objective",
        at: { x: 3, z: -16 },
        color: "#55d6ff",
        icon: "🔵",
      },
      {
        id: "approval-c",
        label: "退社承認・金",
        detail: "大変驚きつつ承認済み",
        kind: "objective",
        at: { x: 18, z: 16 },
        color: "#ffd55f",
        icon: "🟡",
      },
      {
        id: "gold-mug",
        label: "金の特大ジョッキ",
        detail: "完全退社の記念品",
        kind: "loot",
        at: { x: -18, z: 16 },
        color: "#ffd55f",
        icon: "🏆",
      },
      {
        id: "regulation",
        label: "謎のレギュレーション",
        detail: "読んでも内容は不明",
        kind: "loot",
        at: { x: 7, z: 6 },
        color: "#ff70c8",
        icon: "📋",
      },
      {
        id: "remote",
        label: "予備リモート画面",
        detail: "所在地は映っていない",
        kind: "loot",
        at: { x: 19, z: -3 },
        color: "#8da2ff",
        icon: "📺",
      },
    ],
    exits: [mainExit("最終エレベーター"), secretExit()],
    palette: palette("#080b16", "#171c2c", "#303956", "#28334f", "#ff5fc8"),
  },
];

export function getLevel(levelId: string): LevelDefinition {
  return LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];
}

export function getColliders(level: LevelDefinition): Box[] {
  return [...level.outerWalls, ...level.obstacles];
}

export function getObjectiveCount(level: LevelDefinition): number {
  return level.pickups.filter((pickup) => pickup.kind === "objective").length;
}

export function getLootCount(level: LevelDefinition): number {
  return level.pickups.filter((pickup) => pickup.kind === "loot").length;
}
