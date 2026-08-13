export type Direction = "up" | "down" | "left" | "right";
export type CollectibleKind = "document" | "beer";
export type CharacterId =
  | "sobaya"
  | "fukuchan"
  | "takosan"
  | "yumemin"
  | "okayaman";

export interface Point {
  x: number;
  y: number;
}

export interface CollectibleDefinition {
  id: string;
  kind: CollectibleKind;
  at: Point;
  label: string;
}

export interface HelperDefinition {
  characterId: CharacterId;
  at: Point;
  quote: string;
}

export interface LevelDefinition {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  intro: string;
  clearText: string;
  grid: string[];
  start: Point;
  exit: Point;
  collectibles: CollectibleDefinition[];
  helpers: HelperDefinition[];
  parMoves: number;
}

export interface PuzzleState {
  position: Point;
  collected: readonly string[];
  moves: number;
}

export interface SlideResult {
  moved: boolean;
  path: Point[];
  destination: Point;
  collectedIds: string[];
  reachedExit: boolean;
  hitLockedExit: boolean;
  hitHelper?: CharacterId;
}

export interface SaveData {
  unlockedLevel: number;
  bestMoves: Record<string, number>;
}
