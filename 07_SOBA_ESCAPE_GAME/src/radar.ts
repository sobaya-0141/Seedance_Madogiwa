import { BOUNDS, EXIT, OBSTACLES, OUTER_WALLS, type Box } from "./level";

export type RadarActor = {
  x: number;
  z: number;
  facing: number;
  fov: number;
  range: number;
  color: string;
  /** Cone glows red when this enemy currently has eyes on the player. */
  alerted: boolean;
};

export type RadarSnapshot = {
  player: { x: number; z: number; facing: number };
  enemies: RadarActor[];
};

const worldCx = (BOUNDS.xMin + BOUNDS.xMax) / 2;
const worldCz = (BOUNDS.zMin + BOUNDS.zMax) / 2;
const worldW = BOUNDS.xMax - BOUNDS.xMin;
const worldH = BOUNDS.zMax - BOUNDS.zMin;

export class Radar {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private scale = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable for radar");
    this.ctx = ctx;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 10;
    this.scale = Math.min((this.w - pad * 2) / worldW, (this.h - pad * 2) / worldH);
  }

  private toX(x: number) {
    return this.w / 2 + (x - worldCx) * this.scale;
  }
  private toY(z: number) {
    return this.h / 2 + (z - worldCz) * this.scale;
  }

  private strokeBox(box: Box, color: string, lineWidth: number, fill?: string) {
    const x = this.toX(box.x - box.w / 2);
    const y = this.toY(box.z - box.d / 2);
    const w = box.w * this.scale;
    const h = box.d * this.scale;
    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(x, y, w, h);
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, w, h);
  }

  private drawCone(a: RadarActor) {
    const ctx = this.ctx;
    const cx = this.toX(a.x);
    const cy = this.toY(a.z);
    const radius = a.range * this.scale;
    const half = a.fov / 2;
    // World facing -> canvas angle is (PI/2 - facing) because +Z maps downward.
    const mid = Math.PI / 2 - a.facing;
    const a0 = mid + half;
    const a1 = mid - half;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    if (a.alerted) {
      grad.addColorStop(0, "rgba(255,70,70,0.55)");
      grad.addColorStop(1, "rgba(255,70,70,0)");
    } else {
      grad.addColorStop(0, "rgba(120,255,150,0.5)");
      grad.addColorStop(0.75, "rgba(90,230,120,0.18)");
      grad.addColorStop(1, "rgba(90,230,120,0)");
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a1, a0, false);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private dot(x: number, z: number, color: string, r: number, ring?: string) {
    const ctx = this.ctx;
    const cx = this.toX(x);
    const cy = this.toY(z);
    if (ring) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = ring;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  draw(snap: RadarSnapshot) {
    const ctx = this.ctx;
    // Background.
    ctx.fillStyle = "#05130d";
    ctx.fillRect(0, 0, this.w, this.h);

    // Floor plate.
    this.strokeBox(
      { x: 0, z: 0, w: worldW, d: worldH },
      "rgba(70,200,120,0.35)",
      1,
      "rgba(20,70,45,0.35)",
    );

    // Walls + furniture outlines.
    for (const box of OUTER_WALLS) this.strokeBox(box, "rgba(120,255,160,0.85)", 1.5);
    for (const box of OBSTACLES)
      this.strokeBox(box, "rgba(110,240,150,0.7)", 1.2, "rgba(30,90,55,0.4)");

    // Exit.
    this.strokeBox(EXIT, "rgba(160,255,190,1)", 2, "rgba(120,255,170,0.28)");

    // Vision cones (under the dots).
    for (const e of snap.enemies) this.drawCone(e);

    // Enemy dots.
    for (const e of snap.enemies) this.dot(e.x, e.z, e.alerted ? "#ff4646" : e.color, 3.2);

    // Player.
    this.dot(snap.player.x, snap.player.z, "#ffffff", 3.4, "rgba(255,255,255,0.7)");
  }
}
