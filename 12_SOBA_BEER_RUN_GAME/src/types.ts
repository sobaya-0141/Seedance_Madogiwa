export type Lane = -1 | 0 | 1;
export type StageId = 1 | 2 | 3;
export type CourseCell =
  | "beer"
  | "goldBeer"
  | "crate"
  | "barrel"
  | "movingBarrel"
  | null;
export type CourseRole =
  | "tutorial"
  | "hint"
  | "gate"
  | "stream"
  | "bendStream"
  | "movingHazard"
  | "wantedGate"
  | "wantedStream"
  | "rush";
export type Phase = "title" | "playing" | "paused" | "result";
export type Rank = "C" | "B" | "A" | "S";
export type SupportKind =
  | "tokun"
  | "yotan"
  | "fukuchan"
  | "okayaman"
  | "yumemin"
  | "yametaro"
  | "takosan";

export interface CourseRow {
  distance: number;
  cells: readonly [CourseCell, CourseCell, CourseCell];
  routeId?: number;
  safeLane?: Lane;
  role?: CourseRole;
}

export interface RunResult {
  stageId: StageId;
  served: number;
  finishTime: number;
  bestChain: number;
  perfectRoutes: number;
  bestRouteStreak: number;
  hits: number;
  nearMisses: number;
  topSpeed: number;
  supportCount: number;
  rank: Rank;
  newBestTime: boolean;
  newBestServed: boolean;
  newNoHitTime: boolean;
}
