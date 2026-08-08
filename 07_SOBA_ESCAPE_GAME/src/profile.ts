import type { RunSummary } from "./game.js";
import type { DifficultyId, Rank } from "./rules.js";

export type BestRun = {
  score: number;
  rank: Rank;
  time: number;
  collected: number;
  totalItems: number;
  perfect: boolean;
  perfectTime: number | null;
};

export type DifficultyRecords = Partial<Record<DifficultyId, BestRun>>;

export type GameProfile = {
  unlockedLevel: number;
  totalStamps: number;
  clears: number;
  selectedDifficulty: DifficultyId;
  bestRuns: Record<string, DifficultyRecords>;
};

const STORAGE_KEY = "sobaya-teiji-dash-profile-v2";
const DIFFICULTY_IDS: DifficultyId[] = ["overtime", "ontime", "flying"];

export const DEFAULT_PROFILE: GameProfile = {
  unlockedLevel: 1,
  totalStamps: 0,
  clears: 0,
  selectedDifficulty: "ontime",
  bestRuns: {},
};

export function loadProfile(): GameProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_PROFILE);
    const parsed = JSON.parse(raw) as Partial<GameProfile>;
    return {
      unlockedLevel: Math.max(1, Math.floor(parsed.unlockedLevel ?? 1)),
      totalStamps: Math.max(0, Math.floor(parsed.totalStamps ?? 0)),
      clears: Math.max(0, Math.floor(parsed.clears ?? 0)),
      selectedDifficulty: isDifficultyId(parsed.selectedDifficulty)
        ? parsed.selectedDifficulty
        : "ontime",
      bestRuns: normalizeBestRuns(parsed.bestRuns),
    };
  } catch {
    return structuredClone(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile: GameProfile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function recordClear(
  profile: GameProfile,
  summary: RunSummary,
  levelNumber: number,
  totalLevels: number,
): GameProfile {
  const levelRecords = { ...(profile.bestRuns[summary.levelId] ?? {}) };
  const previous = levelRecords[summary.difficultyId];
  const collected = summary.objectives + summary.loot;
  const totalItems = summary.totalObjectives + summary.totalLoot;
  const perfectTime = summary.perfect
    ? Math.min(previous?.perfectTime ?? Number.POSITIVE_INFINITY, summary.elapsed)
    : previous?.perfectTime ?? null;

  if (!previous || summary.score > previous.score) {
    levelRecords[summary.difficultyId] = {
      score: summary.score,
      rank: summary.rank,
      time: summary.elapsed,
      collected,
      totalItems,
      perfect: Boolean(previous?.perfect || summary.perfect),
      perfectTime: Number.isFinite(perfectTime) ? perfectTime : null,
    };
  } else {
    levelRecords[summary.difficultyId] = {
      ...previous,
      perfect: Boolean(previous.perfect || summary.perfect),
      perfectTime: Number.isFinite(perfectTime) ? perfectTime : null,
    };
  }

  return {
    ...profile,
    unlockedLevel: Math.min(totalLevels, Math.max(profile.unlockedLevel, levelNumber + 1)),
    totalStamps: profile.totalStamps + summary.stamps,
    clears: profile.clears + 1,
    bestRuns: {
      ...profile.bestRuns,
      [summary.levelId]: levelRecords,
    },
  };
}

export function getBestRun(
  profile: GameProfile,
  levelId: string,
  difficultyId: DifficultyId,
): BestRun | undefined {
  return profile.bestRuns[levelId]?.[difficultyId];
}

export function getPerfectCount(
  profile: GameProfile,
  difficultyId: DifficultyId,
): number {
  return Object.values(profile.bestRuns)
    .filter((records) => records[difficultyId]?.perfect)
    .length;
}

export function getTotalBestScore(
  profile: GameProfile,
  difficultyId: DifficultyId,
): number {
  return Object.values(profile.bestRuns)
    .reduce((total, records) => total + (records[difficultyId]?.score ?? 0), 0);
}

export function getDifficultyClearCount(
  profile: GameProfile,
  difficultyId: DifficultyId,
): number {
  return Object.values(profile.bestRuns)
    .filter((records) => Boolean(records[difficultyId]))
    .length;
}

function normalizeBestRuns(value: unknown): Record<string, DifficultyRecords> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, DifficultyRecords> = {};
  for (const [levelId, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== "object") continue;

    // v2 stored one flat best run per level. Preserve it as the new 残業 record,
    // whose item collection rule matches the former optional rule.
    if (isBestRunLike(raw)) {
      result[levelId] = { overtime: normalizeBestRun(raw) };
      continue;
    }

    const records: DifficultyRecords = {};
    for (const difficultyId of DIFFICULTY_IDS) {
      const candidate = (raw as Record<string, unknown>)[difficultyId];
      if (isBestRunLike(candidate)) records[difficultyId] = normalizeBestRun(candidate);
    }
    if (Object.keys(records).length > 0) result[levelId] = records;
  }
  return result;
}

function isBestRunLike(value: unknown): value is Partial<BestRun> & { score: number; time: number } {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<BestRun>;
  return Number.isFinite(run.score) && Number.isFinite(run.time);
}

function normalizeBestRun(run: Partial<BestRun> & { score: number; time: number }): BestRun {
  const rank = run.rank === "S" || run.rank === "A" || run.rank === "B" || run.rank === "C"
    ? run.rank
    : "C";
  return {
    score: Math.max(0, Math.floor(run.score)),
    rank,
    time: Math.max(0, run.time),
    collected: Math.max(0, Math.floor(run.collected ?? 0)),
    totalItems: Math.max(0, Math.floor(run.totalItems ?? 0)),
    perfect: Boolean(run.perfect),
    perfectTime: Number.isFinite(run.perfectTime) ? Math.max(0, run.perfectTime ?? 0) : null,
  };
}

function isDifficultyId(value: unknown): value is DifficultyId {
  return value === "overtime" || value === "ontime" || value === "flying";
}
