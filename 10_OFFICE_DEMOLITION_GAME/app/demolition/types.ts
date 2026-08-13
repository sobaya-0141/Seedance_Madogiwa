export type DestructionTier = 1 | 2 | 3 | 4 | 5;

export type DemolitionMaterial =
  | "paper"
  | "wood"
  | "fabric"
  | "glass"
  | "metal"
  | "plaster"
  | "concrete"
  | "steel"
  | "slab";

export type DemolitionAction =
  | "smash"
  | "grab"
  | "throw"
  | "dash"
  | "stomp"
  | "kanpai";

export type DemolitionGoalId =
  | "combo-8"
  | "throw-3"
  | "dash-wall-3"
  | "cascade-6"
  | "kanpai-steel-5";

export type GamePhase =
  | "loading"
  | "briefing"
  | "playing"
  | "paused"
  | "levelup"
  | "cleared";

export type DemolitionSave = {
  version: 1;
  xp: number;
  score: number;
  destroyed: number;
  maxCombo: number;
  playSeconds: number;
  cleared: boolean;
  destroyedIds: string[];
  completedGoals: DemolitionGoalId[];
  updatedAt: string;
};

export type DemolitionHud = {
  phase: GamePhase;
  level: DestructionTier;
  xp: number;
  xpFloor: number;
  xpCeiling: number;
  score: number;
  combo: number;
  maxCombo: number;
  chain: number;
  destroyed: number;
  total: number;
  remaining: number;
  zone: string;
  material: DemolitionMaterial | null;
  targetName: string;
  targetTier: DestructionTier | null;
  beer: number;
  carriedName: string | null;
  goalTitle: string;
  goalProgress: number;
  goalTarget: number;
  goalComplete: boolean;
  districtUnlocked: boolean;
  cityDestroyed: number;
  cityTotal: number;
  giantScale: number;
  radarActive: boolean;
  radarArrow: string;
  radarDistance: number;
  ultimateActive: boolean;
  notice: string;
  noticeTone: "normal" | "good" | "locked" | "level";
  saveStatus: "idle" | "saving" | "saved" | "offline";
  soundEnabled: boolean;
  shakeEnabled: boolean;
};

export type DemolitionResult = {
  score: number;
  destroyed: number;
  total: number;
  maxCombo: number;
  playSeconds: number;
};

export type DemolitionControls = {
  moveX: number;
  moveZ: number;
  smash: boolean;
  grab: boolean;
  dash: boolean;
  stomp: boolean;
  kanpai: boolean;
};

export type DemolitionGameApi = {
  start: () => void;
  resume: () => void;
  restart: () => void;
  togglePause: () => void;
  trigger: (action: DemolitionAction) => void;
  setMove: (x: number, z: number) => void;
  setSound: (enabled: boolean) => void;
  setShake: (enabled: boolean) => void;
};
