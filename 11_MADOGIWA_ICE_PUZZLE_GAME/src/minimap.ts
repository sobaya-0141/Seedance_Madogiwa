import { isOuterWall, officeObstacleKind } from "./office-layout.js";
import { remainingCollectibles } from "./rules.js";
import type { LevelDefinition, PuzzleState } from "./types.js";

const VIEW_COLUMNS = 11;
const VIEW_ROWS = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function drawFrozenTile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number,
): void {
  context.fillStyle = seed % 2 === 0 ? "#9fdce8" : "#b8e8ef";
  context.fillRect(x, y, size, size);
  context.strokeStyle = "rgba(235, 255, 255, 0.48)";
  context.lineWidth = Math.max(size * 0.045, 0.45);
  context.strokeRect(x + 0.2, y + 0.2, Math.max(size - 0.4, 0.5), Math.max(size - 0.4, 0.5));

  if (seed % 4 === 0 && size >= 6) {
    context.strokeStyle = "rgba(255, 255, 255, 0.7)";
    context.lineWidth = Math.max(size * 0.055, 0.5);
    context.beginPath();
    context.moveTo(x + size * 0.18, y + size * 0.72);
    context.lineTo(x + size * 0.46, y + size * 0.5);
    context.lineTo(x + size * 0.68, y + size * 0.6);
    context.lineTo(x + size * 0.84, y + size * 0.34);
    context.stroke();
  }
}

function drawOuterWall(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  context.fillStyle = "#415267";
  context.fillRect(x, y, size, size);
  context.fillStyle = "#cbd8dc";
  context.fillRect(
    x + size * 0.13,
    y + size * 0.13,
    size * 0.74,
    size * 0.74,
  );
  context.fillStyle = "#8fd6e5";
  context.fillRect(
    x + size * 0.2,
    y + size * 0.2,
    size * 0.6,
    Math.max(size * 0.12, 0.8),
  );
}

function drawOfficeObstacle(
  context: CanvasRenderingContext2D,
  kind: ReturnType<typeof officeObstacleKind>,
  x: number,
  y: number,
  size: number,
): void {
  const left = x + size * 0.14;
  const top = y + size * 0.14;
  const inner = size * 0.72;

  context.save();
  context.lineWidth = Math.max(size * 0.07, 0.6);
  switch (kind) {
    case "desk":
      context.fillStyle = "#916b4d";
      context.fillRect(left, top + inner * 0.34, inner, inner * 0.4);
      context.fillStyle = "#243448";
      context.fillRect(left + inner * 0.48, top + inner * 0.08, inner * 0.38, inner * 0.34);
      context.fillStyle = "#51d5ef";
      context.fillRect(left + inner * 0.54, top + inner * 0.14, inner * 0.26, inner * 0.2);
      break;
    case "planter":
      context.fillStyle = "#a56b49";
      context.beginPath();
      context.arc(x + size * 0.5, y + size * 0.63, inner * 0.28, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#4d856f";
      [
        [0.38, 0.36],
        [0.58, 0.3],
        [0.5, 0.18],
      ].forEach(([px, py]) => {
        context.beginPath();
        context.arc(x + size * px, y + size * py, inner * 0.2, 0, Math.PI * 2);
        context.fill();
      });
      break;
    case "cabinet":
      context.fillStyle = "#7c8e9d";
      context.fillRect(left + inner * 0.08, top, inner * 0.84, inner);
      context.strokeStyle = "#35485a";
      [0.32, 0.62].forEach((ratio) => {
        context.beginPath();
        context.moveTo(left + inner * 0.12, top + inner * ratio);
        context.lineTo(left + inner * 0.88, top + inner * ratio);
        context.stroke();
      });
      break;
    case "server":
      context.fillStyle = "#233246";
      context.fillRect(left + inner * 0.08, top, inner * 0.84, inner);
      context.fillStyle = "#4cd8ed";
      [0.22, 0.48, 0.74].forEach((ratio, index) => {
        context.fillRect(
          left + inner * (index % 2 === 0 ? 0.24 : 0.58),
          top + inner * ratio,
          Math.max(inner * 0.12, 0.8),
          Math.max(inner * 0.08, 0.6),
        );
      });
      break;
    case "cubicle":
      context.strokeStyle = "#d2dcde";
      context.lineWidth = Math.max(inner * 0.18, 1);
      context.beginPath();
      context.moveTo(left, top + inner);
      context.lineTo(left, top);
      context.lineTo(left + inner, top);
      context.stroke();
      context.fillStyle = "#8d694d";
      context.fillRect(left + inner * 0.2, top + inner * 0.42, inner * 0.65, inner * 0.28);
      break;
    case "printer":
      context.fillStyle = "#d4dddf";
      context.fillRect(left + inner * 0.08, top + inner * 0.2, inner * 0.84, inner * 0.68);
      context.fillStyle = "#738696";
      context.fillRect(left + inner * 0.2, top, inner * 0.6, inner * 0.36);
      context.fillStyle = "#f7fbf3";
      context.fillRect(left + inner * 0.25, top + inner * 0.72, inner * 0.5, inner * 0.18);
      break;
  }
  context.restore();

  context.strokeStyle = "rgba(226, 252, 255, 0.88)";
  context.lineWidth = Math.max(size * 0.07, 0.7);
  context.strokeRect(
    x + size * 0.1,
    y + size * 0.1,
    size * 0.8,
    size * 0.8,
  );
}

export function renderFloorMap(
  canvas: HTMLCanvasElement,
  level: LevelDefinition,
  state: PuzzleState,
): void {
  const cssWidth = Math.max(canvas.clientWidth, 120);
  const cssHeight = Math.max(canvas.clientHeight, 80);
  const dpr = Math.min(window.devicePixelRatio, 2);
  const pixelWidth = Math.round(cssWidth * dpr);
  const pixelHeight = Math.round(cssHeight * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const columns = level.grid[0].length;
  const rows = level.grid.length;
  const padding = 9;
  const tile = Math.min(
    (cssWidth - padding * 2) / columns,
    (cssHeight - padding * 2) / rows,
  );
  const mapWidth = columns * tile;
  const mapHeight = rows * tile;
  const offsetX = (cssWidth - mapWidth) / 2;
  const offsetY = (cssHeight - mapHeight) / 2;

  const background = context.createLinearGradient(0, 0, 0, cssHeight);
  background.addColorStop(0, "#0a2438");
  background.addColorStop(1, "#04121f");
  context.fillStyle = background;
  context.fillRect(0, 0, cssWidth, cssHeight);

  context.fillStyle = "rgba(175, 229, 239, 0.12)";
  context.fillRect(offsetX - 4, offsetY - 4, mapWidth + 8, mapHeight + 8);

  level.grid.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const drawX = offsetX + x * tile;
      const drawY = offsetY + y * tile;
      if (cell !== "#" || !isOuterWall(level, x, y)) {
        drawFrozenTile(
          context,
          drawX,
          drawY,
          tile,
          x * 17 + y * 29 + level.number,
        );
      }
      if (cell === "#") {
        if (isOuterWall(level, x, y)) {
          drawOuterWall(context, drawX, drawY, tile);
        } else {
          drawOfficeObstacle(
            context,
            officeObstacleKind(level.number, x, y),
            drawX,
            drawY,
            tile,
          );
        }
      }
    });
  });

  context.strokeStyle = "#dcebed";
  context.lineWidth = 2;
  context.strokeRect(offsetX, offsetY, mapWidth, mapHeight);

  const collected = new Set(state.collected);
  level.collectibles
    .filter((item) => !collected.has(item.id))
    .forEach((item) => {
      const centerX = offsetX + (item.at.x + 0.5) * tile;
      const centerY = offsetY + (item.at.y + 0.5) * tile;
      context.fillStyle = item.kind === "document" ? "#347fd6" : "#f2a74b";
      context.strokeStyle = "#ffffff";
      context.lineWidth = Math.max(tile * 0.08, 0.7);
      if (item.kind === "document") {
        context.fillRect(centerX - tile * 0.26, centerY - tile * 0.2, tile * 0.52, tile * 0.4);
        context.strokeRect(centerX - tile * 0.26, centerY - tile * 0.2, tile * 0.52, tile * 0.4);
      } else {
        context.beginPath();
        context.arc(centerX, centerY, Math.max(tile * 0.28, 1.6), 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    });

  level.helpers.forEach((helper) => {
    const centerX = offsetX + (helper.at.x + 0.5) * tile;
    const centerY = offsetY + (helper.at.y + 0.5) * tile;
    context.fillStyle = "#f6d66f";
    context.strokeStyle = "#61441a";
    context.lineWidth = Math.max(tile * 0.08, 0.7);
    context.beginPath();
    context.arc(centerX, centerY, Math.max(tile * 0.3, 1.8), 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });

  context.fillStyle = remainingCollectibles(level, state) === 0 ? "#67ed9b" : "#ff7069";
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(tile * 0.08, 0.7);
  context.fillRect(
    offsetX + (level.exit.x + 0.16) * tile,
    offsetY + (level.exit.y + 0.16) * tile,
    tile * 0.68,
    tile * 0.68,
  );
  context.strokeRect(
    offsetX + (level.exit.x + 0.16) * tile,
    offsetY + (level.exit.y + 0.16) * tile,
    tile * 0.68,
    tile * 0.68,
  );

  context.strokeStyle = "rgba(255, 255, 255, 0.95)";
  context.lineWidth = 1.2;
  context.setLineDash([4, 3]);
  const viewWidth = Math.min(VIEW_COLUMNS, columns);
  const viewHeight = Math.min(VIEW_ROWS, rows);
  const viewX = clamp(state.position.x - Math.floor(viewWidth / 2), 0, columns - viewWidth);
  const viewY = clamp(state.position.y - Math.floor(viewHeight / 2), 0, rows - viewHeight);
  context.strokeRect(
    offsetX + viewX * tile + 0.6,
    offsetY + viewY * tile + 0.6,
    viewWidth * tile - 1.2,
    viewHeight * tile - 1.2,
  );
  context.setLineDash([]);

  const playerX = offsetX + (state.position.x + 0.5) * tile;
  const playerY = offsetY + (state.position.y + 0.5) * tile;
  context.fillStyle = "#b67cff";
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(tile * 0.11, 1);
  context.beginPath();
  context.arc(playerX, playerY, Math.max(tile * 0.38, 2.2), 0, Math.PI * 2);
  context.fill();
  context.stroke();

  canvas.setAttribute(
    "aria-label",
    `${columns}×${rows}マスの凍結オフィスマップ。現在地は${state.position.x + 1}列、${state.position.y + 1}行`,
  );
}
