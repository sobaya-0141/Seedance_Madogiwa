import type {
  CourseCell,
  CourseRole,
  CourseRow,
  Lane,
  Rank,
  StageId,
} from "./types.js";

export const LANE_X = [-2.35, 0, 2.35] as const;
export const BASE_SPEED = 11.8;
export const BEERS_PER_SPEED_UP = 10;
export const SPEED_STEP = 0.08;
export const MAX_BEER_SPEED_MULTIPLIER = 1.28;
export const COLLISION_SPEED_MULTIPLIER = 0.72;
export const COLLISION_DURATION = 2;
export const SUPPORT_SPEED_MULTIPLIER = 1.18;
export const NEAR_MISS_SPEED_MULTIPLIER = 1.1;
export const FINAL_RUSH_START = 408;
export const FINISH_DISTANCE = 458;
export const WANTED_ZONE_START = 318;
export const WANTED_ZONE_END = 365;
export const ROUTE_REWARD_SPACING = 2.25;
export const ROUTE_GATE_DISTANCES = [50, 88, 126, 164, 202, 240, 278, 318, 374] as const;

export interface StageDefinition {
  id: StageId;
  numberLabel: string;
  name: string;
  difficulty: string;
  description: string;
  mechanic: string;
  baseSpeedMultiplier: number;
  gateDistances: readonly number[];
  hintOffsets: readonly number[];
  bendRouteIds: readonly number[];
  movingHazardRouteIds: readonly number[];
  wantedGateDistance: number;
  finalRushMode: "all" | "pairs" | "snake";
  rankThresholds: readonly [number, number, number];
  skyColor: number;
  fogFar: number;
}

export const STAGE_DEFINITIONS: readonly StageDefinition[] = [
  {
    id: 1,
    numberLabel: "STAGE 1",
    name: "赤坂ビールロード",
    difficulty: "★☆☆",
    description: "予告列を読んで、正解レーンを直進",
    mechanic: "ストレートルート",
    baseSpeedMultiplier: 1,
    gateDistances: ROUTE_GATE_DISTANCES,
    hintOffsets: [-13, -9, -5],
    bendRouteIds: [],
    movingHazardRouteIds: [],
    wantedGateDistance: WANTED_ZONE_START,
    finalRushMode: "all",
    rankThresholds: [32, 52, 72],
    skyColor: 0x8ccde0,
    fogFar: 105,
  },
  {
    id: 2,
    numberLabel: "STAGE 2",
    name: "窓際BBQスラローム",
    difficulty: "★★☆",
    description: "正解後のビール列が途中でカーブ",
    mechanic: "二段階ルート",
    baseSpeedMultiplier: 1.035,
    gateDistances: [48, 84, 120, 156, 192, 228, 264, 300, 336, 372],
    hintOffsets: [-11, -6],
    bendRouteIds: [1, 3, 5, 7],
    movingHazardRouteIds: [],
    wantedGateDistance: 300,
    finalRushMode: "pairs",
    rankThresholds: [38, 60, 84],
    skyColor: 0xe6a275,
    fogFar: 100,
  },
  {
    id: 3,
    numberLabel: "STAGE 3",
    name: "WANTEDナイトラン",
    difficulty: "★★★",
    description: "カーブ列と横断する樽を交互に攻略",
    mechanic: "ムービングハザード",
    baseSpeedMultiplier: 1.07,
    gateDistances: [44, 80, 116, 152, 188, 224, 260, 296, 332, 368],
    hintOffsets: [-10, -5],
    bendRouteIds: [1, 3, 5, 7, 9],
    movingHazardRouteIds: [0, 2, 4, 6, 8],
    wantedGateDistance: 296,
    finalRushMode: "snake",
    rankThresholds: [44, 70, 96],
    skyColor: 0x17244a,
    fogFar: 94,
  },
] as const;

const REGULAR_REWARD_COUNT = 8;

export function stageDefinition(stageId: StageId): StageDefinition {
  return STAGE_DEFINITIONS.find((stage) => stage.id === stageId) ?? STAGE_DEFINITIONS[0];
}

export function baseSpeedForStage(stageId: StageId): number {
  return BASE_SPEED * stageDefinition(stageId).baseSpeedMultiplier;
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function laneCells(lane: Lane, cell: Exclude<CourseCell, null>): [CourseCell, CourseCell, CourseCell] {
  const cells: [CourseCell, CourseCell, CourseCell] = [null, null, null];
  cells[lane + 1] = cell;
  return cells;
}

function gateCells(
  lane: Lane,
  reward: "beer" | "goldBeer",
  variant: number,
): [CourseCell, CourseCell, CourseCell] {
  const cells: [CourseCell, CourseCell, CourseCell] = ["crate", "barrel", "crate"];
  cells[lane + 1] = reward;
  const otherLane = (lane + 2 + (variant % 2)) % 3;
  if (otherLane !== lane + 1) cells[otherLane] = variant % 2 === 0 ? "barrel" : "crate";
  return cells;
}

function adjacentLane(lane: Lane, random: () => number): Lane {
  if (lane === -1) return 0;
  if (lane === 1) return 0;
  return random() < 0.5 ? -1 : 1;
}

function addRoute(
  rows: CourseRow[],
  routeId: number,
  gateDistance: number,
  safeLane: Lane,
  bendLane: Lane | undefined,
  role: "gate" | "wantedGate",
  hintOffsets: readonly number[],
): void {
  const hintCell = role === "wantedGate" ? "goldBeer" : "beer";
  for (const offset of hintOffsets) {
    rows.push({
      distance: gateDistance + offset,
      cells: laneCells(safeLane, hintCell),
      routeId,
      safeLane,
      role: "hint",
    });
  }

  rows.push({
    distance: gateDistance,
    cells: gateCells(safeLane, hintCell, routeId),
    routeId,
    safeLane,
    role,
  });

  if (role === "wantedGate" && bendLane === undefined) {
    for (let index = 1; index <= 12; index += 1) {
      const reward = index % 3 === 0 ? "goldBeer" : "beer";
      rows.push({
        distance: gateDistance + index * 3,
        cells: laneCells(safeLane, reward),
        routeId,
        safeLane,
        role: "wantedStream",
      });
    }
    return;
  }

  const firstSegmentCount = bendLane === undefined ? REGULAR_REWARD_COUNT : 4;
  for (let index = 1; index <= firstSegmentCount; index += 1) {
    rows.push({
      distance: gateDistance + index * ROUTE_REWARD_SPACING,
      cells: laneCells(safeLane, role === "wantedGate" && index === 3 ? "goldBeer" : "beer"),
      routeId,
      safeLane,
      role: "stream",
    });
  }

  if (bendLane === undefined) return;
  const bendStart = gateDistance + firstSegmentCount * ROUTE_REWARD_SPACING + 4;
  for (let index = 0; index < 5; index += 1) {
    const reward = role === "wantedGate" && index % 2 === 1 ? "goldBeer" : "beer";
    rows.push({
      distance: bendStart + index * ROUTE_REWARD_SPACING,
      cells: laneCells(bendLane, reward),
      routeId,
      safeLane: bendLane,
      role: "bendStream",
    });
  }
}

function addFinalRush(rows: CourseRow[], mode: StageDefinition["finalRushMode"]): void {
  let rowIndex = 0;
  for (
    let rushDistance = FINAL_RUSH_START;
    rushDistance <= FINISH_DISTANCE - 3;
    rushDistance += 2.2
  ) {
    let cells: [CourseCell, CourseCell, CourseCell];
    if (mode === "all") {
      cells = ["beer", "beer", "beer"];
    } else if (mode === "pairs") {
      const gap = rowIndex % 3;
      cells = ["beer", "beer", "beer"];
      cells[gap] = null;
    } else {
      const snakeLane = (Math.floor(rowIndex / 4) % 3 - 1) as Lane;
      cells = laneCells(snakeLane, rowIndex % 4 === 0 ? "goldBeer" : "beer");
    }
    rows.push({ distance: rushDistance, cells, role: "rush" });
    rowIndex += 1;
  }
}

export function buildCourse(seed: number, stageId: StageId = 1): CourseRow[] {
  const stage = stageDefinition(stageId);
  const rows: CourseRow[] = [
    { distance: 14, cells: [null, "beer", null], role: "tutorial" },
    { distance: 20, cells: [null, "beer", null], role: "tutorial" },
    { distance: 26, cells: ["beer", "beer", "beer"], role: "tutorial" },
  ];
  const random = mulberry32(seed + stageId * 1009);
  let previousLane: Lane = 0;

  stage.gateDistances.forEach((gateDistance, routeId) => {
    let lane = (Math.floor(random() * 3) - 1) as Lane;
    if (routeId === 0 && lane === previousLane) lane = 1;
    const isWanted = gateDistance === stage.wantedGateDistance;
    const bendLane = stage.bendRouteIds.includes(routeId)
      ? adjacentLane(lane, random)
      : undefined;
    addRoute(
      rows,
      routeId,
      gateDistance,
      lane,
      bendLane,
      isWanted ? "wantedGate" : "gate",
      stage.hintOffsets,
    );

    if (stage.movingHazardRouteIds.includes(routeId)) {
      const hazardLane = (Math.floor(random() * 3) - 1) as Lane;
      rows.push({
        distance: gateDistance + 22,
        cells: laneCells(hazardLane, "movingBarrel"),
        role: "movingHazard",
      });
    }
    previousLane = bendLane ?? lane;
  });

  addFinalRush(rows, stage.finalRushMode);
  return rows.sort((a, b) => a.distance - b.distance);
}

export function isRouteGate(role: CourseRole | undefined): boolean {
  return role === "gate" || role === "wantedGate";
}

export function beerSpeedMultiplier(collectedBeers: number): number {
  const tiers = Math.floor(Math.max(0, collectedBeers) / BEERS_PER_SPEED_UP);
  return Math.min(MAX_BEER_SPEED_MULTIPLIER, 1 + tiers * SPEED_STEP);
}

export function runSpeed(
  collectedBeers: number,
  isSlowed: boolean,
  hasSupportBoost: boolean,
  hasNearMissBoost: boolean,
  stageId: StageId = 1,
): number {
  const beerMultiplier = beerSpeedMultiplier(collectedBeers);
  const slowdown = isSlowed ? COLLISION_SPEED_MULTIPLIER : 1;
  const support = hasSupportBoost ? SUPPORT_SPEED_MULTIPLIER : 1;
  const nearMiss = hasNearMissBoost ? NEAR_MISS_SPEED_MULTIPLIER : 1;
  return baseSpeedForStage(stageId) * beerMultiplier * slowdown * support * nearMiss;
}

export function hasFinished(distance: number): boolean {
  return distance >= FINISH_DISTANCE;
}

export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(2).padStart(5, "0")}`;
}

export function rankFor(served: number, stageId: StageId = 1): Rank {
  const [bThreshold, aThreshold, sThreshold] = stageDefinition(stageId).rankThresholds;
  if (served >= sThreshold) return "S";
  if (served >= aThreshold) return "A";
  if (served >= bThreshold) return "B";
  return "C";
}

export function rankLabel(rank: Rank): string {
  switch (rank) {
    case "S":
      return "大変驚いております";
    case "A":
      return "立ち飲み処 大繁盛";
    case "B":
      return "常連で満席";
    case "C":
      return "ちょい飲み";
  }
}
