import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

async function loadRules() {
  const source = await readFile(
    new URL("../app/demolition/rules.ts", import.meta.url),
    "utf8",
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const cjsModule = { exports: {} };
  vm.runInNewContext(transpiled, {
    module: cjsModule,
    exports: cjsModule.exports,
    require(specifier) {
      if (specifier === "./types") return {};
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
    Date,
    Math,
    Number,
    String,
    Array,
    Object,
  });
  return cjsModule.exports;
}

test("unlocks every demolition tier at its declared threshold", async () => {
  const rules = await loadRules();
  assert.equal(rules.getLevelForXp(0).level, 1);
  assert.equal(rules.getLevelForXp(699).level, 1);
  assert.equal(rules.getLevelForXp(700).level, 2);
  assert.equal(rules.getLevelForXp(2_600).level, 3);
  assert.equal(rules.getLevelForXp(6_200).level, 4);
  assert.equal(rules.getLevelForXp(12_500).level, 5);
  assert.equal(rules.getLevelProgress(13_000).ratio, 1);
});

test("keeps architecture gated while allowing the expected progression", async () => {
  const rules = await loadRules();
  assert.equal(rules.canBreakMaterial(1, "wood"), true);
  assert.equal(rules.canBreakMaterial(1, "glass"), false);
  assert.equal(rules.canBreakMaterial(2, "metal"), true);
  assert.equal(rules.canBreakMaterial(2, "plaster"), false);
  assert.equal(rules.canBreakMaterial(4, "concrete"), true);
  assert.equal(rules.canBreakMaterial(4, "steel"), false);
  assert.equal(rules.canBreakMaterial(5, "steel"), true);
});

test("rewards varied combo chains without producing invalid values", async () => {
  const rules = await loadRules();
  assert.ok(rules.getBreakScore(100, 40, 6) > rules.getBreakScore(100, 1, 0));
  assert.ok(rules.getBreakXp("steel", 100, 3) > rules.getBreakXp("wood", 5, 0));
  assert.equal(rules.getBreakScore(-100, -2, -1), 0);
});

test("normalizes persistent destruction snapshots defensively", async () => {
  const rules = await loadRules();
  const snapshot = rules.normalizeDemolitionSave({
    version: 99,
    xp: 800,
    score: 2_000,
    destroyed: 1,
    maxCombo: 12,
    playSeconds: 42.5,
    cleared: true,
    destroyedIds: ["desk-1", "desk-1", "", 42, "wall-2"],
    completedGoals: ["combo-8", "combo-8", "unknown", 42, "throw-3"],
    updatedAt: "2026-07-28T00:00:00.000Z",
  });
  assert.equal(snapshot.version, 1);
  assert.deepEqual(Array.from(snapshot.destroyedIds), ["desk-1", "wall-2"]);
  assert.equal(snapshot.destroyed, 2);
  assert.deepEqual(Array.from(snapshot.completedGoals), ["combo-8", "throw-3"]);
  assert.equal(snapshot.cleared, true);
});

test("offers one distinct demolition work order per level", async () => {
  const rules = await loadRules();
  assert.equal(rules.DEMOLITION_GOALS.length, 5);
  assert.deepEqual(
    Array.from(rules.DEMOLITION_GOALS, (goal) => goal.level),
    [1, 2, 3, 4, 5],
  );
  const active = rules.getActiveGoal(3, new Set(["combo-8", "throw-3"]));
  assert.equal(active.id, "dash-wall-3");
  assert.ok(active.bonusXp > 0);
  assert.ok(active.bonusScore > 0);
});
