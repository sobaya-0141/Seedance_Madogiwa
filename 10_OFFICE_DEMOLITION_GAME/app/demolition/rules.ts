import type {
  DemolitionMaterial,
  DemolitionGoalId,
  DemolitionSave,
  DestructionTier,
} from "./types";

export type DemolitionLevelDefinition = {
  level: DestructionTier;
  title: string;
  permit: string;
  description: string;
  unlock: string;
  threshold: number;
  accent: string;
};

export const DEMOLITION_LEVELS: readonly DemolitionLevelDefinition[] = [
  {
    level: 1,
    title: "備品整理",
    permit: "SOFT OFFICE",
    description: "机・椅子・PC・観葉植物を資材へ戻せます。",
    unlock: "ジョッキスマッシュ",
    threshold: 0,
    accent: "#50e1c2",
  },
  {
    level: 2,
    title: "設備解体",
    permit: "HEAVY FIXTURES",
    description: "ロッカー・複合機・ガラス・間仕切りを解体できます。",
    unlock: "つかむ・投げる",
    threshold: 700,
    accent: "#47bfff",
  },
  {
    level: 3,
    title: "内装撤去",
    permit: "WALL BREAKER",
    description: "外周壁を突き抜けると、麻布十番の街区へ進出できます。",
    unlock: "ショルダーダッシュ＋街区解禁",
    threshold: 2_600,
    accent: "#ffbf48",
  },
  {
    level: 4,
    title: "躯体解体",
    permit: "CONCRETE CRUSH",
    description: "床・柱・市街地ビルを崩し、破壊するほど巨大化します。",
    unlock: "快適ストンプ＋巨大化",
    threshold: 6_200,
    accent: "#ff8468",
  },
  {
    level: 5,
    title: "完全更地",
    permit: "STEEL & FOUNDATION",
    description: "鉄骨・基礎・麻布十番一帯を、超乾杯奥義で更地にできます。",
    unlock: "ビールビーム＋ジョッキメテオ",
    threshold: 12_500,
    accent: "#ff5b9e",
  },
] as const;

export const MATERIAL_TIER: Record<DemolitionMaterial, DestructionTier> = {
  paper: 1,
  wood: 1,
  fabric: 1,
  glass: 2,
  metal: 2,
  plaster: 3,
  concrete: 4,
  slab: 4,
  steel: 5,
};

export const MATERIAL_LABEL: Record<DemolitionMaterial, string> = {
  paper: "紙・段ボール",
  wood: "木材",
  fabric: "布・クッション",
  glass: "強化ガラス",
  metal: "金属設備",
  plaster: "石膏・内装壁",
  concrete: "コンクリート",
  slab: "床スラブ",
  steel: "構造鉄骨",
};

export type DemolitionGoalDefinition = {
  id: DemolitionGoalId;
  level: DestructionTier;
  title: string;
  description: string;
  target: number;
  bonusXp: number;
  bonusScore: number;
};

export const DEMOLITION_GOALS: readonly DemolitionGoalDefinition[] = [
  {
    id: "combo-8",
    level: 1,
    title: "机上整理ラッシュ",
    description: "8コンボをつなぐ",
    target: 8,
    bonusXp: 240,
    bonusScore: 1_000,
  },
  {
    id: "throw-3",
    level: 2,
    title: "備品リサイクル便",
    description: "投げた家具で3件壊す",
    target: 3,
    bonusXp: 520,
    bonusScore: 2_500,
  },
  {
    id: "dash-wall-3",
    level: 3,
    title: "会議室ショートカット",
    description: "ダッシュで壁を3枚貫通",
    target: 3,
    bonusXp: 820,
    bonusScore: 4_000,
  },
  {
    id: "cascade-6",
    level: 4,
    title: "支持構造見直し",
    description: "連鎖崩壊で6部材を壊す",
    target: 6,
    bonusXp: 1_250,
    bonusScore: 7_000,
  },
  {
    id: "kanpai-steel-5",
    level: 5,
    title: "麻布十番・最後の乾杯",
    description: "超乾杯奥義で鉄骨を5本壊す",
    target: 5,
    bonusXp: 2_000,
    bonusScore: 12_000,
  },
] as const;

export function getActiveGoal(
  level: DestructionTier,
  completedGoals: ReadonlySet<DemolitionGoalId>,
) {
  return DEMOLITION_GOALS.find(
    (goal) => goal.level <= level && !completedGoals.has(goal.id),
  ) ?? DEMOLITION_GOALS[Math.min(DEMOLITION_GOALS.length - 1, level - 1)];
}

export function clampNumber(value: unknown, min: number, max: number, fallback = min) {
  const number = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export function getLevelForXp(xp: number): DemolitionLevelDefinition {
  const safeXp = Math.max(0, xp);
  for (let index = DEMOLITION_LEVELS.length - 1; index >= 0; index -= 1) {
    const definition = DEMOLITION_LEVELS[index];
    if (definition && safeXp >= definition.threshold) return definition;
  }
  return DEMOLITION_LEVELS[0];
}

export function getLevelProgress(xp: number) {
  const current = getLevelForXp(xp);
  const next = DEMOLITION_LEVELS[current.level];
  const floor = current.threshold;
  const ceiling = next?.threshold ?? current.threshold;
  const ratio = next
    ? clampNumber((xp - floor) / Math.max(1, ceiling - floor), 0, 1)
    : 1;
  return { current, next, floor, ceiling, ratio };
}

export function canBreakMaterial(level: DestructionTier, material: DemolitionMaterial) {
  return level >= MATERIAL_TIER[material];
}

export function getComboMultiplier(combo: number) {
  if (combo >= 40) return 4;
  if (combo >= 25) return 3;
  if (combo >= 15) return 2.25;
  if (combo >= 8) return 1.7;
  if (combo >= 4) return 1.3;
  return 1;
}

export function getBreakScore(
  baseScore: number,
  combo: number,
  chainDepth: number,
) {
  const comboMultiplier = getComboMultiplier(combo);
  const chainMultiplier = 1 + Math.min(1.5, Math.max(0, chainDepth) * 0.18);
  return Math.round(Math.max(0, baseScore) * comboMultiplier * chainMultiplier);
}

export function getBreakXp(
  material: DemolitionMaterial,
  mass: number,
  chainDepth: number,
) {
  const tier = MATERIAL_TIER[material];
  const base = [0, 14, 38, 85, 190, 420][tier] ?? 14;
  const massBonus = Math.min(base, Math.round(Math.max(0, mass) * 0.35));
  const chainBonus = Math.min(base, Math.max(0, chainDepth) * Math.ceil(base * 0.12));
  return base + massBonus + chainBonus;
}

export function createEmptyDemolitionSave(): DemolitionSave {
  return {
    version: 1,
    xp: 0,
    score: 0,
    destroyed: 0,
    maxCombo: 0,
    playSeconds: 0,
    cleared: false,
    destroyedIds: [],
    completedGoals: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export function normalizeDemolitionSave(value: unknown): DemolitionSave {
  const empty = createEmptyDemolitionSave();
  if (!value || typeof value !== "object") return empty;
  const candidate = value as Partial<DemolitionSave>;
  const ids = Array.isArray(candidate.destroyedIds)
    ? candidate.destroyedIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.slice(0, 80))
        .filter((id, index, all) => id.length > 0 && all.indexOf(id) === index)
        .slice(0, 2_000)
    : [];
  const updatedAt = typeof candidate.updatedAt === "string"
    && !Number.isNaN(Date.parse(candidate.updatedAt))
    ? candidate.updatedAt
    : empty.updatedAt;
  const validGoalIds = new Set<DemolitionGoalId>(
    DEMOLITION_GOALS.map((goal) => goal.id),
  );
  const completedGoals = Array.isArray(candidate.completedGoals)
    ? candidate.completedGoals
        .filter((id): id is DemolitionGoalId => (
          typeof id === "string" && validGoalIds.has(id as DemolitionGoalId)
        ))
        .filter((id, index, all) => all.indexOf(id) === index)
    : [];
  return {
    version: 1,
    xp: Math.round(clampNumber(candidate.xp, 0, 10_000_000)),
    score: Math.round(clampNumber(candidate.score, 0, 1_000_000_000)),
    destroyed: Math.max(
      ids.length,
      Math.round(clampNumber(candidate.destroyed, 0, 100_000)),
    ),
    maxCombo: Math.round(clampNumber(candidate.maxCombo, 0, 100_000)),
    playSeconds: clampNumber(candidate.playSeconds, 0, 10_000_000),
    cleared: candidate.cleared === true,
    destroyedIds: ids,
    completedGoals,
    updatedAt,
  };
}

export function formatPlayTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
