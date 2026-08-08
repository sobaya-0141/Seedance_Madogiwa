import assert from "node:assert/strict";
import test from "node:test";
import {
  BASE_SPEED,
  COLLISION_SPEED_MULTIPLIER,
  FINAL_RUSH_START,
  MAX_BEER_SPEED_MULTIPLIER,
  ROUTE_GATE_DISTANCES,
  ROUTE_REWARD_SPACING,
  STAGE_DEFINITIONS,
  WANTED_ZONE_START,
  baseSpeedForStage,
  beerSpeedMultiplier,
  buildCourse,
  formatTime,
  hasFinished,
  isRouteGate,
  rankFor,
  runSpeed,
  stageDefinition,
} from "../src/rules.js";
import type { StageId } from "../src/types.js";

test("all three stages are deterministic and always leave a safe lane", () => {
  for (const stage of STAGE_DEFINITIONS) {
    const first = buildCourse(141, stage.id);
    const second = buildCourse(141, stage.id);
    assert.deepEqual(first, second);

    for (const row of first) {
      const blockers = row.cells.filter(
        (cell) => cell === "crate" || cell === "barrel" || cell === "movingBarrel",
      );
      assert.ok(blockers.length < 3, `all lanes blocked in stage ${stage.id} at ${row.distance}`);
    }

    const occupiedAtDistance = new Map<number, Array<Set<string>>>();
    for (const row of first) {
      const lanes = occupiedAtDistance.get(row.distance)
        ?? [new Set<string>(), new Set<string>(), new Set<string>()];
      row.cells.forEach((cell, laneIndex) => {
        if (cell) lanes[laneIndex].add(cell);
      });
      occupiedAtDistance.set(row.distance, lanes);
    }
    for (const [distance, lanes] of occupiedAtDistance) {
      const blockedLanes = lanes.filter((lane) =>
        [...lane].some((cell) => cell === "crate" || cell === "barrel" || cell === "movingBarrel")
      );
      assert.ok(blockedLanes.length < 3, `combined rows block stage ${stage.id} at ${distance}`);
      for (const lane of lanes) {
        const hasReward = lane.has("beer") || lane.has("goldBeer");
        const hasBlocker = lane.has("crate") || lane.has("barrel") || lane.has("movingBarrel");
        assert.equal(hasReward && hasBlocker, false, `reward overlaps blocker at ${distance}`);
      }
    }
  }
});

test("stage 1 retains the generous straight-route rhythm", () => {
  const course = buildCourse(42, 1);
  const gates = course.filter((row) => isRouteGate(row.role));
  assert.equal(gates.length, ROUTE_GATE_DISTANCES.length);
  assert.equal(course.filter((row) => row.role === "bendStream").length, 0);
  assert.equal(course.filter((row) => row.role === "movingHazard").length, 0);

  gates.forEach((gate, index) => {
    assert.equal(gate.distance, ROUTE_GATE_DISTANCES[index]);
    assert.equal(gate.cells.filter((cell) => cell === "crate" || cell === "barrel").length, 2);
    const streams = course.filter(
      (row) => row.routeId === gate.routeId && (row.role === "stream" || row.role === "wantedStream"),
    );
    assert.ok(streams.length >= 8);
    assert.ok(streams.every((row) => row.safeLane === gate.safeLane));
  });
});

test("stage 2 adds readable mid-stream lane bends", () => {
  const course = buildCourse(42, 2);
  const bends = course.filter((row) => row.role === "bendStream");
  assert.ok(bends.length >= 20);
  for (const routeId of stageDefinition(2).bendRouteIds) {
    const gate = course.find((row) => row.routeId === routeId && isRouteGate(row.role));
    const routeBends = bends.filter((row) => row.routeId === routeId);
    assert.equal(routeBends.length, 5);
    assert.ok(routeBends.every((row) => row.safeLane !== gate?.safeLane));
    assert.ok(routeBends[0].distance - (gate?.distance ?? 0) >= 13);
  }
});

test("stage 3 alternates curved routes with single moving hazards", () => {
  const course = buildCourse(42, 3);
  const hazards = course.filter((row) => row.role === "movingHazard");
  assert.equal(hazards.length, stageDefinition(3).movingHazardRouteIds.length);
  assert.ok(course.filter((row) => row.role === "bendStream").length >= 25);
  for (const row of hazards) {
    assert.equal(row.cells.filter((cell) => cell === "movingBarrel").length, 1);
    assert.equal(row.cells.filter((cell) => cell !== null).length, 1);
  }
});

test("decision density rises by stage without becoming frame-perfect", () => {
  const stage1 = stageDefinition(1);
  const minGap = (stage: typeof stage1) =>
    Math.min(...stage.gateDistances.slice(1).map((distance, index) => distance - stage.gateDistances[index]));
  const fastestInterval = (stageId: StageId) =>
    minGap(stageDefinition(stageId))
      / (baseSpeedForStage(stageId) * MAX_BEER_SPEED_MULTIPLIER);

  assert.ok(fastestInterval(1) >= 2.5);
  assert.ok(fastestInterval(2) >= 2.28);
  assert.ok(fastestInterval(3) >= 2.2);
  assert.ok(fastestInterval(1) > fastestInterval(2));
  assert.ok(fastestInterval(2) > fastestInterval(3));

  const fastestPickupInterval = ROUTE_REWARD_SPACING
    / (baseSpeedForStage(3) * MAX_BEER_SPEED_MULTIPLIER);
  assert.ok(fastestPickupInterval >= 0.13 && fastestPickupInterval <= 0.2);
});

test("wanted route and each final rush retain their intended reward pattern", () => {
  const stage1 = buildCourse(7, 1);
  const wantedGate = stage1.find((row) => row.distance === WANTED_ZONE_START);
  assert.equal(wantedGate?.role, "wantedGate");
  assert.ok(stage1.filter((row) => row.role === "wantedStream").length >= 12);

  const rush1 = stage1.filter((row) => row.distance >= FINAL_RUSH_START);
  assert.ok(rush1.every((row) => row.cells.every((cell) => cell === "beer")));
  const rush2 = buildCourse(7, 2).filter((row) => row.distance >= FINAL_RUSH_START);
  assert.ok(rush2.every((row) => row.cells.filter(Boolean).length === 2));
  const rush3 = buildCourse(7, 3).filter((row) => row.distance >= FINAL_RUSH_START);
  assert.ok(rush3.every((row) => row.cells.filter(Boolean).length === 1));
  assert.ok(rush3.some((row) => row.cells.includes("goldBeer")));
});

test("later stages start faster and collisions still slow every stage", () => {
  assert.equal(BASE_SPEED, 11.8);
  assert.equal(beerSpeedMultiplier(0), 1);
  assert.equal(beerSpeedMultiplier(10), 1.08);
  assert.equal(beerSpeedMultiplier(40), 1.28);
  assert.ok(baseSpeedForStage(1) < baseSpeedForStage(2));
  assert.ok(baseSpeedForStage(2) < baseSpeedForStage(3));
  for (const stageId of [1, 2, 3] as const) {
    assert.equal(runSpeed(0, false, false, false, stageId), baseSpeedForStage(stageId));
    assert.equal(
      runSpeed(0, true, false, false, stageId),
      baseSpeedForStage(stageId) * COLLISION_SPEED_MULTIPLIER,
    );
  }
});

test("goal, time, and stage-specific rank rules remain stable", () => {
  assert.equal(hasFinished(457.99), false);
  assert.equal(hasFinished(458), true);
  assert.equal(formatTime(39.456), "00:39.46");
  assert.equal(rankFor(72, 1), "S");
  assert.equal(rankFor(83, 2), "A");
  assert.equal(rankFor(84, 2), "S");
  assert.equal(rankFor(95, 3), "A");
  assert.equal(rankFor(96, 3), "S");
});
