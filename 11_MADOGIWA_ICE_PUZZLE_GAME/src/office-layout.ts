import type { LevelDefinition } from "./types.js";

export type OfficeObstacleKind =
  | "desk"
  | "planter"
  | "cabinet"
  | "server"
  | "cubicle"
  | "printer";

const OFFICE_OBSTACLES: readonly OfficeObstacleKind[] = [
  "desk",
  "planter",
  "cabinet",
  "server",
  "cubicle",
  "printer",
];

export function isOuterWall(level: LevelDefinition, x: number, y: number): boolean {
  return x === 0
    || y === 0
    || x === level.grid[0].length - 1
    || y === level.grid.length - 1;
}

export function officeObstacleKind(
  levelNumber: number,
  x: number,
  y: number,
): OfficeObstacleKind {
  const index = Math.abs(x * 19 + y * 31 + levelNumber * 13) % OFFICE_OBSTACLES.length;
  return OFFICE_OBSTACLES[index];
}
