import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS } from "../src/levels.js";
import {
  applySlide,
  createInitialState,
  isWall,
  pointKey,
  samePoint,
  simulateSlide,
} from "../src/rules.js";
import type { Direction, PuzzleState } from "../src/types.js";

const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

function stateKey(state: PuzzleState): string {
  return `${pointKey(state.position)}|${[...state.collected].sort().join(",")}`;
}

function solve(levelIndex: number): number | null {
  const level = LEVELS[levelIndex];
  const initial = createInitialState(level);
  const queue: PuzzleState[] = [initial];
  const seen = new Set([stateKey(initial)]);

  while (queue.length > 0) {
    const state = queue.shift();
    if (!state) break;
    for (const direction of DIRECTIONS) {
      const result = simulateSlide(level, state, direction);
      if (result.reachedExit) return state.moves + 1;
      const next = applySlide(state, result);
      const key = stateKey(next);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return null;
}

test("every level is rectangular, bounded, and has collectibles", () => {
  LEVELS.forEach((level, index) => {
    const width = level.grid[0].length;
    assert.ok(width >= 12, `${level.id}: field is too narrow`);
    assert.ok(level.grid.length >= 12, `${level.id}: field is too short`);
    if (index > 0) {
      assert.ok(width > LEVELS[index - 1].grid[0].length, `${level.id}: width must grow`);
      assert.ok(level.grid.length > LEVELS[index - 1].grid.length, `${level.id}: height must grow`);
    }
    assert.ok(level.grid.every((row) => row.length === width));
    assert.ok(level.grid[0].split("").every((cell) => cell === "#"));
    assert.ok(level.grid.at(-1)?.split("").every((cell) => cell === "#"));
    assert.ok(level.collectibles.length > 0);
    const collectibleCells = new Set(level.collectibles.map((item) => pointKey(item.at)));
    for (const item of level.collectibles) {
      assert.equal(isWall(level, item.at), false, `${level.id}: collectible in a wall`);
    }
    for (const helper of level.helpers) {
      assert.equal(isWall(level, helper.at), false, `${level.id}: helper in a wall`);
      assert.equal(samePoint(helper.at, level.start), false, `${level.id}: helper on start`);
      assert.equal(samePoint(helper.at, level.exit), false, `${level.id}: helper on exit`);
      assert.equal(
        collectibleCells.has(pointKey(helper.at)),
        false,
        `${level.id}: helper on collectible`,
      );
    }
  });
});

test("slide movement is cardinal-only and stops at a wall", () => {
  const level = LEVELS[0];
  const state = createInitialState(level);
  const result = simulateSlide(level, state, "right");
  assert.deepEqual(result.destination, { x: 2, y: 10 });
  assert.equal(result.path.every((point) => point.y === state.position.y), true);
});

test("a collectible is collected without stopping the slide", () => {
  const level = LEVELS[0];
  const first = applySlide(
    createInitialState(level),
    simulateSlide(level, createInitialState(level), "up"),
  );
  const second = applySlide(first, simulateSlide(level, first, "right"));
  const result = simulateSlide(level, second, "up");
  const next = applySlide(second, result);
  assert.equal(result.collectedIds.length, 1);
  assert.notDeepEqual(result.destination, { x: 7, y: 4 });
  assert.ok(result.path.some((point) => point.x === 7 && point.y === 4));
  assert.deepEqual(next.collected, result.collectedIds);
});

test("locked exit does not clear until all items are collected", () => {
  const level = LEVELS[0];
  const result = simulateSlide(level, {
    position: { x: 10, y: 8 },
    collected: [],
    moves: 0,
  }, "up");
  assert.equal(result.hitLockedExit, true);
  assert.equal(result.reachedExit, false);
});

test("all campaign levels have a finite solution", () => {
  LEVELS.forEach((level, index) => {
    const shortest = solve(index);
    assert.notEqual(shortest, null, `${level.id} is unsolvable`);
    assert.equal(shortest, level.parMoves, `${level.id} PAR must be the optimal route`);
  });
});
