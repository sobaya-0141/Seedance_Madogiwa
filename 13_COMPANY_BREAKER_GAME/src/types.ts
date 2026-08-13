export type Phase = "loading" | "title" | "stage-select" | "playing" | "settling" | "result";
export type StageId = 1 | 2 | 3 | 4;
export type AmmoKind = "standard" | "kanpai";
export type MaterialKind = "drywall" | "glass" | "wood" | "concrete" | "steel";

export type Vec3Tuple = readonly [number, number, number];

export interface MaterialSpec {
  color: number;
  edgeColor: number;
  density: number;
  health: number;
  score: number;
  friction: number;
  restitution: number;
  roughness: number;
  metalness: number;
  transparent?: boolean;
}

export interface BlockSpec {
  id: string;
  position: Vec3Tuple;
  size: Vec3Tuple;
  material: MaterialKind;
  structural: boolean;
  label?: string;
}

export interface StageDefinition {
  id: StageId;
  name: string;
  englishName: string;
  description: string;
  objective: string;
  turns: number;
  clearRatio: number;
  difficulty: 1 | 2 | 3 | 4;
  accent: number;
  accentCss: string;
  skyTop: number;
  skyBottom: number;
  build(): BlockSpec[];
}

export interface SavedProgress {
  unlockedStage: StageId;
  bestScores: Partial<Record<StageId, number>>;
}

export interface ResultData {
  cleared: boolean;
  score: number;
  fractured: number;
  collapsed: number;
  total: number;
  integrity: number;
  throwsUsed: number;
  newBest: boolean;
}

export interface PhysicsStats {
  integrity: number;
  fractured: number;
  collapsed: number;
  total: number;
  moving: number;
}

export interface ImpactReport {
  position: Vec3Tuple;
  fractured: number;
  newlyCollapsed: number;
  force: number;
  special: boolean;
}
