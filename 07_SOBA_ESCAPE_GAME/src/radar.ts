import type { Box, LevelDefinition, PickupKind } from "./level.js";

export type RadarActor = {
  x: number;
  z: number;
  facing: number;
  fov: number;
  range: number;
  color: string;
  alerted: boolean;
  investigating: boolean;
};

export type RadarSnapshot = {
  player: { x: number; z: number; facing: number; hidden: boolean };
  enemies: RadarActor[];
  pickups: Array<{ x: number; z: number; kind: PickupKind; collected: boolean }>;
  exits: Array<{ box: Box; secret: boolean; unlocked: boolean }>;
  noises: Array<{ x: number; z: number; radius: number; alpha: number }>;
};

export class Radar {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private scale = 1;
  private worldCx = 0;
  private worldCz = 0;
  private worldW = 1;
  private worldH = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    private level: LevelDefinition,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable for radar");
    this.ctx = ctx;
    this.configureLevel(level);
    this.resize();
  }

  configureLevel(level: LevelDefinition) {
    this.level = level;
    this.worldCx = (level.bounds.xMin + level.bounds.xMax) / 2;
    this.worldCz = (level.bounds.zMin + level.bounds.zMax) / 2;
    this.worldW = level.bounds.xMax - level.bounds.xMin;
    this.worldH = level.bounds.zMax - level.bounds.zMin;
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
    this.scale = Math.min(
      (this.w - pad * 2) / this.worldW,
      (this.h - pad * 2) / this.worldH,
    );
  }

  private toX(x: number) {
    return this.w / 2 + (x - this.worldCx) * this.scale;
  }

  private toY(z: number) {
    return this.h / 2 + (z - this.worldCz) * this.scale;
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

  private drawCone(actor: RadarActor) {
    const ctx = this.ctx;
    const cx = this.toX(actor.x);
    const cy = this.toY(actor.z);
    const radius = actor.range * this.scale;
    const half = actor.fov / 2;
    const mid = Math.PI / 2 - actor.facing;
    const start = mid - half;
    const end = mid + half;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    if (actor.alerted) {
      grad.addColorStop(0, "rgba(255,70,70,0.6)");
      grad.addColorStop(1, "rgba(255,70,70,0)");
    } else if (actor.investigating) {
      grad.addColorStop(0, "rgba(255,194,70,0.52)");
      grad.addColorStop(1, "rgba(255,194,70,0)");
    } else {
      grad.addColorStop(0, "rgba(120,255,150,0.45)");
      grad.addColorStop(0.75, "rgba(90,230,120,0.16)");
      grad.addColorStop(1, "rgba(90,230,120,0)");
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private dot(x: number, z: number, color: string, radius: number, ring?: string) {
    const ctx = this.ctx;
    const cx = this.toX(x);
    const cy = this.toY(z);
    if (ring) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = ring;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  draw(snapshot: RadarSnapshot) {
    const ctx = this.ctx;
    ctx.fillStyle = "#050b10";
    ctx.fillRect(0, 0, this.w, this.h);

    this.strokeBox(
      {
        x: this.worldCx,
        z: this.worldCz,
        w: this.worldW,
        d: this.worldH,
      },
      "rgba(94,255,166,0.3)",
      1,
      "rgba(20,50,45,0.42)",
    );

    for (const box of this.level.outerWalls) {
      this.strokeBox(box, "rgba(125,245,170,0.78)", 1.4);
    }
    for (const box of this.level.obstacles) {
      this.strokeBox(box, "rgba(110,220,165,0.58)", 1, "rgba(32,82,66,0.46)");
    }

    for (const exit of snapshot.exits) {
      const color = exit.secret ? "rgba(255,190,90,0.95)" : "rgba(94,255,166,0.95)";
      const fill = exit.unlocked
        ? exit.secret ? "rgba(255,190,90,0.24)" : "rgba(94,255,166,0.24)"
        : "rgba(120,130,140,0.18)";
      this.strokeBox(exit.box, color, exit.unlocked ? 2 : 1, fill);
    }

    for (const noise of snapshot.noises) {
      ctx.beginPath();
      ctx.arc(
        this.toX(noise.x),
        this.toY(noise.z),
        noise.radius * this.scale,
        0,
        Math.PI * 2,
      );
      ctx.strokeStyle = `rgba(255,204,87,${noise.alpha * 0.8})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    for (const enemy of snapshot.enemies) this.drawCone(enemy);

    for (const pickup of snapshot.pickups) {
      if (pickup.collected) continue;
      this.dot(
        pickup.x,
        pickup.z,
        pickup.kind === "objective" ? "#55d6ff" : "#ffc857",
        pickup.kind === "objective" ? 3.1 : 2.5,
        "rgba(255,255,255,0.45)",
      );
    }

    for (const enemy of snapshot.enemies) {
      this.dot(
        enemy.x,
        enemy.z,
        enemy.alerted ? "#ff4646" : enemy.investigating ? "#ffc247" : enemy.color,
        3.2,
      );
    }

    this.dot(
      snapshot.player.x,
      snapshot.player.z,
      snapshot.player.hidden ? "#d9a066" : "#ffffff",
      3.5,
      "rgba(255,255,255,0.7)",
    );
  }
}
