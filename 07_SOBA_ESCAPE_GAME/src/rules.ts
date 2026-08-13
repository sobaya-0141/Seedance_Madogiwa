export type GadgetId = "cardboard";

export type GadgetDefinition = {
  id: GadgetId;
  name: string;
  shortName: string;
  description: string;
  key: string;
  color: string;
};

export const GADGETS: Record<GadgetId, GadgetDefinition> = {
  cardboard: {
    id: "cardboard",
    name: "アーロンチュア",
    shortName: "段ボール",
    description: "その場で段ボールに隠れる。もう一度押すまで解除されない。",
    key: "E",
    color: "#d9a066",
  },
};

export type DifficultyId = "overtime" | "ontime" | "flying";

export type DifficultyDefinition = {
  id: DifficultyId;
  name: string;
  englishName: string;
  description: string;
  requiresAllItems: boolean;
  cardboardUses: number | null;
  scoreMultiplier: number;
  color: string;
};

export const DIFFICULTIES: DifficultyDefinition[] = [
  {
    id: "overtime",
    name: "残業",
    englishName: "OVERTIME",
    description: "回収は任意。段ボールは何度でも使える入門モード。",
    requiresAllItems: false,
    cardboardUses: null,
    scoreMultiplier: 1,
    color: "#8ea49a",
  },
  {
    id: "ontime",
    name: "定時退社",
    englishName: "ON-TIME",
    description: "全アイテム回収が必須。段ボールは何度でも使える標準モード。",
    requiresAllItems: true,
    cardboardUses: null,
    scoreMultiplier: 1.2,
    color: "#5effa6",
  },
  {
    id: "flying",
    name: "フライング退社",
    englishName: "EARLY ESCAPE",
    description: "全アイテム回収が必須。段ボールは3回までの上級モード。",
    requiresAllItems: true,
    cardboardUses: 3,
    scoreMultiplier: 1.45,
    color: "#ffc857",
  },
];

export function getDifficulty(id: DifficultyId): DifficultyDefinition {
  return DIFFICULTIES.find((difficulty) => difficulty.id === id) ?? DIFFICULTIES[0];
}

export type DailyMutator = {
  id: string;
  label: string;
  description: string;
  rangeMultiplier: number;
  speedMultiplier: number;
  detectionMultiplier: number;
  noiseMultiplier: number;
  scoreMultiplier: number;
};

export const DAILY_MUTATORS: DailyMutator[] = [
  {
    id: "quiet-floor",
    label: "静かなフロア",
    description: "足音が1.25倍届く。しのび足の使い分けが重要。",
    rangeMultiplier: 1,
    speedMultiplier: 1,
    detectionMultiplier: 1,
    noiseMultiplier: 1.25,
    scoreMultiplier: 1.12,
  },
  {
    id: "sharp-eyes",
    label: "視界良好",
    description: "全員の視界が15%拡大。完全未発見の評価も高い。",
    rangeMultiplier: 1.15,
    speedMultiplier: 1,
    detectionMultiplier: 1,
    noiseMultiplier: 1,
    scoreMultiplier: 1.15,
  },
  {
    id: "rush-hour",
    label: "退勤ラッシュ",
    description: "巡回速度が12%上昇。空いた通路を素早く見抜こう。",
    rangeMultiplier: 1,
    speedMultiplier: 1.12,
    detectionMultiplier: 1,
    noiseMultiplier: 1,
    scoreMultiplier: 1.12,
  },
  {
    id: "strict-regulation",
    label: "本日のレギュレーション",
    description: "発見ゲージが20%速く上昇する高評価チャレンジ。",
    rangeMultiplier: 1,
    speedMultiplier: 1,
    detectionMultiplier: 1.2,
    noiseMultiplier: 1,
    scoreMultiplier: 1.18,
  },
  {
    id: "casual-friday",
    label: "カジュアルフライデー",
    description: "通常条件。好きな退社ルートを試せる。",
    rangeMultiplier: 1,
    speedMultiplier: 1,
    detectionMultiplier: 1,
    noiseMultiplier: 1,
    scoreMultiplier: 1,
  },
];

export function getDailyMutator(dateKey: string): DailyMutator {
  let hash = 0;
  for (const char of dateKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return DAILY_MUTATORS[hash % DAILY_MUTATORS.length] ?? DAILY_MUTATORS[0];
}

export type RunResultInput = {
  elapsed: number;
  parTime: number;
  objectives: number;
  totalObjectives: number;
  loot: number;
  totalLoot: number;
  sightings: number;
  maxDetection: number;
  secretExit: boolean;
  mutatorMultiplier: number;
  difficultyMultiplier: number;
};

export type Rank = "S" | "A" | "B" | "C";

export type RunEvaluation = {
  score: number;
  rank: Rank;
  stamps: number;
  bonuses: string[];
  perfect: boolean;
};

export function evaluateRun(input: RunResultInput): RunEvaluation {
  const timeRatio = input.parTime / Math.max(input.elapsed, 1);
  const timeScore = Math.round(3000 * Math.min(1.2, timeRatio));
  const collectedItems = input.objectives + input.loot;
  const totalItems = input.totalObjectives + input.totalLoot;
  const collectionScore = totalItems > 0
    ? Math.round(3500 * (collectedItems / totalItems))
    : 3500;
  const stealthScore = Math.round(
    2700
      * Math.max(0, 1 - input.maxDetection * 0.62)
      * Math.max(0.25, 1 - input.sightings * 0.16),
  );
  const secretScore = input.secretExit ? 800 : 0;
  const rawScore = timeScore + collectionScore + stealthScore + secretScore;
  const score = Math.max(
    0,
    Math.round(rawScore * input.mutatorMultiplier * input.difficultyMultiplier),
  );
  const allItems = totalItems === 0 || collectedItems === totalItems;
  const perfect = allItems
    && input.sightings === 0
    && input.elapsed <= input.parTime
    && input.secretExit;
  const rank: Rank = score >= 9000 ? "S" : score >= 7200 ? "A" : score >= 5200 ? "B" : "C";
  const stamps = rank === "S" ? 4 : rank === "A" ? 3 : rank === "B" ? 2 : 1;
  const bonuses: string[] = [];
  if (allItems && totalItems > 0) bonuses.push("全アイテム回収");
  if (input.sightings === 0) bonuses.push("完全未発見");
  if (input.elapsed <= input.parTime) bonuses.push("定時最速");
  if (input.secretExit) bonuses.push("秘密ルート");
  if (perfect) bonuses.push("フロアPERFECT");
  return { score, rank, stamps, bonuses, perfect };
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
