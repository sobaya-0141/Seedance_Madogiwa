import assert from "node:assert/strict";
import test from "node:test";
import { segmentIntersectsBox } from "../src/geom.js";
import { LEVELS, getLootCount, getObjectiveCount } from "../src/level.js";
import {
  DEFAULT_PROFILE,
  getBestRun,
  getPerfectCount,
  getTotalBestScore,
  recordClear,
} from "../src/profile.js";
import { evaluateRun, getDailyMutator, getDifficulty } from "../src/rules.js";

test("campaign levels have sequential numbers and complete objectives", () => {
  assert.equal(LEVELS.length, 5);
  LEVELS.forEach((level, index) => {
    assert.equal(level.number, index + 1);
    assert.ok(getObjectiveCount(level) >= 2);
    assert.ok(getLootCount(level) >= 2);
    assert.ok(level.pickups.every((pickup) => pickup.icon.trim().length > 0));
    assert.ok(level.exits.some((exit) => !exit.secret));
    assert.ok(level.exits.some((exit) => exit.secret && exit.requiresAllItems));
  });
});

test("critical spawn points are within bounds and outside obstacles", () => {
  for (const level of LEVELS) {
    const points = [
      level.playerStart,
      ...level.pickups.map((pickup) => pickup.at),
      ...level.exits.map((exit) => exit.at),
      ...level.enemies.flatMap((enemy) => (
        enemy.kind === "camera" ? [enemy.at] : enemy.points
      )),
    ];
    for (const point of points) {
      assert.ok(point.x > level.bounds.xMin && point.x < level.bounds.xMax);
      assert.ok(point.z > level.bounds.zMin && point.z < level.bounds.zMax);
      const insideObstacle = level.obstacles.some((box) => (
        Math.abs(point.x - box.x) < box.w / 2
        && Math.abs(point.z - box.z) < box.d / 2
      ));
      assert.equal(insideObstacle, false, `${level.id}: blocked point at ${point.x},${point.z}`);
    }
  }
});

test("patrol route segments do not cross solid furniture", () => {
  for (const level of LEVELS) {
    for (const enemy of level.enemies) {
      if (enemy.kind !== "patrol") continue;
      for (let index = 0; index < enemy.points.length - 1; index += 1) {
        const from = enemy.points[index];
        const to = enemy.points[index + 1];
        const blocked = level.obstacles.some((box) => (
          segmentIntersectsBox(from.x, from.z, to.x, to.z, box)
        ));
        assert.equal(
          blocked,
          false,
          `${level.id}: ${enemy.meta.label} route ${index} crosses furniture`,
        );
      }
    }
  }
});

test("every spotting character has canonical alert and interruption text", () => {
  const characters = new Map(
    LEVELS.flatMap((level) => level.enemies)
      .map((enemy) => [enemy.meta.def.id, enemy.meta] as const),
  );
  for (const character of characters.values()) {
    assert.ok(character.spotText.length > 0, `${character.label}: missing spot text`);
    assert.ok(character.caughtText.length > 0, `${character.label}: missing caught text`);
  }
  assert.match(characters.get("okayaman")?.spotText ?? "", /^おかやまん「おかやまん、/);
  assert.match(characters.get("yumemin")?.caughtText ?? "", /BONK/);
});

test("perfect run earns S rank and full bonuses", () => {
  const result = evaluateRun({
    elapsed: 50,
    parTime: 75,
    objectives: 2,
    totalObjectives: 2,
    loot: 3,
    totalLoot: 3,
    sightings: 0,
    maxDetection: 0,
    secretExit: true,
    mutatorMultiplier: 1.15,
    difficultyMultiplier: 1,
  });
  assert.equal(result.rank, "S");
  assert.equal(result.stamps, 4);
  assert.equal(result.perfect, true);
  assert.deepEqual(
    result.bonuses,
    ["全アイテム回収", "完全未発見", "定時最速", "秘密ルート", "フロアPERFECT"],
  );
});

test("optional items are not required, but collection raises the score", () => {
  const base = {
    elapsed: 70,
    parTime: 75,
    totalObjectives: 2,
    totalLoot: 3,
    sightings: 0,
    maxDetection: 0,
    secretExit: false,
    mutatorMultiplier: 1,
    difficultyMultiplier: 1,
  };
  const directExit = evaluateRun({ ...base, objectives: 0, loot: 0 });
  const collectedExit = evaluateRun({ ...base, objectives: 2, loot: 3 });
  assert.ok(collectedExit.score > directExit.score);
  assert.equal(directExit.perfect, false);
});

test("per-level best scores keep a lower-scoring perfect clear", () => {
  const baseProfile = structuredClone(DEFAULT_PROFILE);
  const highScore = {
    levelId: "general-office",
    difficultyId: "overtime" as const,
    elapsed: 52,
    objectives: 1,
    totalObjectives: 2,
    loot: 2,
    totalLoot: 2,
    sightings: 0,
    maxDetection: 0,
    secretExit: false,
    score: 9000,
    rank: "S" as const,
    stamps: 4,
    bonuses: [],
    perfect: false,
  };
  const withScore = recordClear(baseProfile, highScore, 1, LEVELS.length);
  const withPerfect = recordClear(withScore, {
    ...highScore,
    elapsed: 70,
    objectives: 2,
    secretExit: true,
    score: 8800,
    perfect: true,
  }, 1, LEVELS.length);
  assert.equal(getBestRun(withPerfect, "general-office", "overtime")?.score, 9000);
  assert.equal(getBestRun(withPerfect, "general-office", "overtime")?.perfect, true);
  assert.equal(getPerfectCount(withPerfect, "overtime"), 1);
  assert.equal(getTotalBestScore(withPerfect, "overtime"), 9000);
});

test("difficulty rules match collection and cardboard limits", () => {
  assert.equal(DEFAULT_PROFILE.selectedDifficulty, "ontime");
  const overtime = getDifficulty("overtime");
  const ontime = getDifficulty("ontime");
  const flying = getDifficulty("flying");
  assert.equal(overtime.requiresAllItems, false);
  assert.equal(overtime.cardboardUses, null);
  assert.equal(ontime.requiresAllItems, true);
  assert.equal(ontime.cardboardUses, null);
  assert.equal(flying.requiresAllItems, true);
  assert.equal(flying.cardboardUses, 3);
  assert.ok(overtime.scoreMultiplier < ontime.scoreMultiplier);
  assert.ok(ontime.scoreMultiplier < flying.scoreMultiplier);
});

test("best scores are stored separately for each difficulty", () => {
  const summary = {
    levelId: "general-office",
    difficultyId: "overtime" as const,
    elapsed: 72,
    objectives: 0,
    totalObjectives: 2,
    loot: 0,
    totalLoot: 2,
    sightings: 0,
    maxDetection: 0,
    secretExit: false,
    score: 6100,
    rank: "B" as const,
    stamps: 2,
    bonuses: [],
    perfect: false,
  };
  const overtimeProfile = recordClear(
    structuredClone(DEFAULT_PROFILE),
    summary,
    1,
    LEVELS.length,
  );
  const bothModes = recordClear(
    overtimeProfile,
    {
      ...summary,
      difficultyId: "ontime",
      objectives: 2,
      loot: 2,
      score: 8200,
      rank: "A",
    },
    1,
    LEVELS.length,
  );
  assert.equal(getBestRun(bothModes, "general-office", "overtime")?.score, 6100);
  assert.equal(getBestRun(bothModes, "general-office", "ontime")?.score, 8200);
  assert.equal(getTotalBestScore(bothModes, "overtime"), 6100);
  assert.equal(getTotalBestScore(bothModes, "ontime"), 8200);
});

test("daily regulation is stable for the same date", () => {
  const first = getDailyMutator("2026-07-27");
  const second = getDailyMutator("2026-07-27");
  assert.equal(first.id, second.id);
});
