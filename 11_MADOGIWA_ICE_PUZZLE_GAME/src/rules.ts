import type {
  Direction,
  LevelDefinition,
  Point,
  PuzzleState,
  SlideResult,
} from "./types.js";

export const DIRECTION_DELTAS: Readonly<Record<Direction, Point>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function pointKey(point: Point): string {
  return `${point.x},${point.y}`;
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isInside(level: LevelDefinition, point: Point): boolean {
  return point.y >= 0
    && point.y < level.grid.length
    && point.x >= 0
    && point.x < level.grid[point.y].length;
}

export function isWall(level: LevelDefinition, point: Point): boolean {
  return !isInside(level, point) || level.grid[point.y][point.x] === "#";
}

export function remainingCollectibles(
  level: LevelDefinition,
  state: PuzzleState,
): number {
  return level.collectibles.length - state.collected.length;
}

export function simulateSlide(
  level: LevelDefinition,
  state: PuzzleState,
  direction: Direction,
): SlideResult {
  const delta = DIRECTION_DELTAS[direction];
  const collected = new Set(state.collected);
  const helperByCell = new Map(
    level.helpers.map((helper) => [pointKey(helper.at), helper.characterId] as const),
  );
  const collectibleByCell = new Map(
    level.collectibles
      .filter((item) => !collected.has(item.id))
      .map((item) => [pointKey(item.at), item] as const),
  );
  const path: Point[] = [];
  const collectedIds: string[] = [];
  let cursor = { ...state.position };
  let hitHelper: SlideResult["hitHelper"];

  while (true) {
    const next = {
      x: cursor.x + delta.x,
      y: cursor.y + delta.y,
    };
    const helper = helperByCell.get(pointKey(next));

    if (isWall(level, next) || helper) {
      hitHelper = helper;
      break;
    }

    cursor = next;
    path.push({ ...cursor });

    const collectible = collectibleByCell.get(pointKey(cursor));
    if (collectible) {
      collected.add(collectible.id);
      collectedIds.push(collectible.id);
      collectibleByCell.delete(pointKey(cursor));
    }

    if (samePoint(cursor, level.exit)) {
      const reachedExit = collected.size === level.collectibles.length;
      return {
        moved: true,
        path,
        destination: cursor,
        collectedIds,
        reachedExit,
        hitLockedExit: !reachedExit,
      };
    }
  }

  return {
    moved: path.length > 0,
    path,
    destination: cursor,
    collectedIds,
    reachedExit: false,
    hitLockedExit: false,
    hitHelper,
  };
}

export function applySlide(state: PuzzleState, result: SlideResult): PuzzleState {
  if (!result.moved) return state;
  const collected = [...new Set([...state.collected, ...result.collectedIds])];
  return {
    position: { ...result.destination },
    collected,
    moves: state.moves + 1,
  };
}

export function createInitialState(level: LevelDefinition): PuzzleState {
  return {
    position: { ...level.start },
    collected: [],
    moves: 0,
  };
}
