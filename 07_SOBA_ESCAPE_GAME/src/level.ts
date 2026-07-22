import {
  FUKUCHAN,
  OKAYAMAN,
  TOKUN,
  YAMETARO,
  YOTAN,
  type CharacterMeta,
} from "./characters";

/** Axis-aligned box on the floor (centre + full size on X/Z). */
export type Box = { x: number; z: number; w: number; d: number };

/** Inner floor extents. The player is clamped to a little inside this. */
export const BOUNDS = { xMin: -22, xMax: 22, zMin: -20, zMax: 20 };

/** Perimeter walls. The top wall has a gap on the right that is the exit. */
export const OUTER_WALLS: Box[] = [
  { x: -3.75, z: -20, w: 36.5, d: 1 }, // top wall (left of the exit gap)
  { x: 0, z: 20, w: 44, d: 1 }, // bottom wall
  { x: -22, z: 0, w: 1, d: 40 }, // left wall
  { x: 22, z: 0, w: 1, d: 40 }, // right wall
];

/** Interior partitions / desks: block movement *and* line of sight. */
export const OBSTACLES: Box[] = [
  { x: -13, z: -12, w: 14, d: 7 }, // 会議室 (top-left)
  { x: 7, z: -12, w: 10, d: 4 }, // デスク島 (top-mid)
  { x: 17, z: -9, w: 6, d: 8 }, // 右パーテーション (top-right, near exit)
  { x: -3, z: -1, w: 8, d: 5 }, // 中央ブロック
  { x: 13, z: 3, w: 8, d: 4 }, // 右デスク島
  { x: -18, z: 0, w: 5, d: 6 }, // 左パーテーション
  { x: 4, z: 12, w: 14, d: 7 }, // ラウンジ (bottom-mid)
  { x: -15, z: 10, w: 7, d: 4 }, // 左デスク島 (bottom)
  { x: 18, z: 12, w: 5, d: 8 }, // 右パーテーション (bottom)
];

/** Everything that blocks sight lines and movement. */
export const COLLIDERS: Box[] = [...OUTER_WALLS, ...OBSTACLES];

/** そば屋のスタート地点（左下の立ち飲み処）。 */
export const PLAYER_START = { x: -18, z: 16 };

/** 脱出口（上壁の右側の切れ目 = エレベーターホール）。 */
export const EXIT: Box = { x: 18, z: -19, w: 7, d: 2.5 };

export type PatrolEnemy = {
  meta: CharacterMeta;
  kind: "patrol";
  speed: number;
  /** Full field-of-view angle in radians. */
  fov: number;
  /** Sight range in world units. */
  range: number;
  /** Ping-pong waypoints. */
  points: { x: number; z: number }[];
};

export type CameraEnemy = {
  meta: CharacterMeta;
  kind: "camera";
  fov: number;
  range: number;
  at: { x: number; z: number };
  /** Base facing (radians); forward = (sin, cos) in world X/Z. */
  baseFacing: number;
  /** Sweep amplitude (radians) and angular speed. */
  sweepAmp: number;
  sweepSpeed: number;
};

export type EnemyConfig = PatrolEnemy | CameraEnemy;

export const ENEMIES: EnemyConfig[] = [
  {
    meta: FUKUCHAN,
    kind: "patrol",
    speed: 3.4,
    fov: 1.15,
    range: 10,
    points: [
      { x: -18, z: -17.5 },
      { x: 12, z: -17.5 },
    ],
  },
  {
    meta: YOTAN,
    kind: "patrol",
    speed: 3.2,
    fov: 1.2,
    range: 10,
    points: [
      { x: 6, z: -7 },
      { x: 6, z: 7 },
    ],
  },
  {
    meta: TOKUN,
    kind: "patrol",
    speed: 2.8,
    fov: 1.1,
    range: 9,
    points: [
      { x: -10, z: 18 },
      { x: 12, z: 18 },
    ],
  },
  {
    meta: YAMETARO,
    kind: "patrol",
    speed: 3.0,
    fov: 1.2,
    range: 9,
    points: [
      { x: 2, z: -1 },
      { x: 11, z: -1 },
    ],
  },
  {
    meta: OKAYAMAN,
    kind: "camera",
    fov: 1.0,
    range: 13,
    at: { x: 11, z: -19.2 },
    baseFacing: 0, // looks south, into the room, guarding the exit approach
    sweepAmp: 0.95,
    sweepSpeed: 0.7,
  },
];
