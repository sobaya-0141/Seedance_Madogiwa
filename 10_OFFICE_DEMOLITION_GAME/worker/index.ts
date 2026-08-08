import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: {
          format: string;
          quality: number;
        }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type SavePayload = {
  version?: unknown;
  xp?: unknown;
  score?: unknown;
  destroyed?: unknown;
  maxCombo?: unknown;
  playSeconds?: unknown;
  cleared?: unknown;
  destroyedIds?: unknown;
  completedGoals?: unknown;
  updatedAt?: unknown;
};

type ClearPayload = {
  score?: unknown;
  destroyed?: unknown;
  total?: unknown;
  maxCombo?: unknown;
  playSeconds?: unknown;
};

type PlayerRow = {
  id: string;
  best_score: number;
  clears: number;
  total_destroyed: number;
};

type SaveRow = {
  xp: number;
  score: number;
  destroyed: number;
  max_combo: number;
  play_seconds: number;
  cleared: number;
  destroyed_json: string;
  completed_goals_json: string;
  updated_at: string;
};

const PLAYER_COOKIE = "sobaya_demolition_player";
const MAX_BODY_BYTES = 64_000;
const DEMOLITION_GOAL_IDS = new Set([
  "combo-8",
  "throw-3",
  "dash-wall-3",
  "cascade-6",
  "kanpai-steel-5",
]);
let schemaReady: Promise<void> | null = null;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function getCookie(request: Request, key: string) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === key) return decodeURIComponent(value.join("="));
  }
  return null;
}

function validPlayerId(value: string | null) {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function playerCookie(playerId: string, secure: boolean) {
  return `${PLAYER_COOKIE}=${encodeURIComponent(playerId)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function safeInt(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
}

function safeNumber(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
}

function safeDate(value: unknown) {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

function safeDestroyedIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.slice(0, 80))
    .filter((id) => /^[a-z0-9-]+$/i.test(id))
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, 2_000);
}

function safeCompletedGoals(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((id): id is string => (
      typeof id === "string" && DEMOLITION_GOAL_IDS.has(id)
    ))
    .filter((id, index, all) => all.indexOf(id) === index);
}

async function readJsonBody(request: Request) {
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > MAX_BODY_BYTES) throw new Error("payload_too_large");
  return request.json();
}

async function ensureSchema(db: D1Database) {
  schemaReady ??= (async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS demolition_players (
        id TEXT PRIMARY KEY NOT NULL,
        best_score INTEGER DEFAULT 0 NOT NULL,
        clears INTEGER DEFAULT 0 NOT NULL,
        total_destroyed INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS demolition_saves (
        player_id TEXT PRIMARY KEY NOT NULL,
        xp INTEGER DEFAULT 0 NOT NULL,
        score INTEGER DEFAULT 0 NOT NULL,
        destroyed INTEGER DEFAULT 0 NOT NULL,
        max_combo INTEGER DEFAULT 0 NOT NULL,
        play_seconds REAL DEFAULT 0 NOT NULL,
        cleared INTEGER DEFAULT 0 NOT NULL,
        destroyed_json TEXT DEFAULT '[]' NOT NULL,
        completed_goals_json TEXT DEFAULT '[]' NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (player_id) REFERENCES demolition_players(id)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS demolition_runs (
        id TEXT PRIMARY KEY NOT NULL,
        player_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        destroyed INTEGER NOT NULL,
        max_combo INTEGER NOT NULL,
        play_seconds REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (player_id) REFERENCES demolition_players(id)
      )`),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS demolition_runs_player_created_idx ON demolition_runs (player_id, created_at)",
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS demolition_runs_score_idx ON demolition_runs (score)",
      ),
    ]);
    const saveColumns = await db
      .prepare("PRAGMA table_info(demolition_saves)")
      .all<{ name: string }>();
    if (!saveColumns.results.some((column) => column.name === "completed_goals_json")) {
      await db.prepare(
        "ALTER TABLE demolition_saves ADD COLUMN completed_goals_json TEXT DEFAULT '[]' NOT NULL",
      ).run();
    }
  })();
  await schemaReady;
}

async function ensurePlayer(db: D1Database, playerId: string) {
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO demolition_players (id, created_at, updated_at)
    VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING`)
    .bind(playerId, now, now)
    .run();
  return db.prepare("SELECT * FROM demolition_players WHERE id = ?")
    .bind(playerId)
    .first<PlayerRow>();
}

function publicProfile(row: PlayerRow | null) {
  return {
    bestScore: row?.best_score ?? 0,
    clears: row?.clears ?? 0,
    totalDestroyed: row?.total_destroyed ?? 0,
  };
}

function publicSave(row: SaveRow | null) {
  if (!row) return null;
  let destroyedIds: string[] = [];
  let completedGoals: string[] = [];
  try {
    destroyedIds = safeDestroyedIds(JSON.parse(row.destroyed_json));
  } catch {
    destroyedIds = [];
  }
  try {
    completedGoals = safeCompletedGoals(JSON.parse(row.completed_goals_json));
  } catch {
    completedGoals = [];
  }
  return {
    version: 1,
    xp: row.xp,
    score: row.score,
    destroyed: Math.max(row.destroyed, destroyedIds.length),
    maxCombo: row.max_combo,
    playSeconds: row.play_seconds,
    cleared: row.cleared === 1,
    destroyedIds,
    completedGoals,
    updatedAt: row.updated_at,
  };
}

async function handleDemolitionApi(request: Request, env: Env) {
  if (!env.DB) return json({ error: "database_unavailable" }, { status: 503 });
  const db = env.DB;
  await ensureSchema(db);
  const url = new URL(request.url);
  const cookieId = validPlayerId(getCookie(request, PLAYER_COOKIE));
  const playerId = cookieId ?? crypto.randomUUID();
  const cookie = cookieId ? undefined : playerCookie(playerId, url.protocol === "https:");
  const player = await ensurePlayer(db, playerId);

  if (request.method === "GET" && url.pathname === "/api/demolition/profile") {
    const save = await db.prepare("SELECT * FROM demolition_saves WHERE player_id = ?")
      .bind(playerId)
      .first<SaveRow>();
    const response = json({
      profile: publicProfile(player),
      save: publicSave(save),
    });
    if (cookie) response.headers.set("set-cookie", cookie);
    return response;
  }

  if (request.method === "POST" && url.pathname === "/api/demolition/save") {
    const payload = await readJsonBody(request) as SavePayload;
    const destroyedIds = safeDestroyedIds(payload.destroyedIds);
    const completedGoals = safeCompletedGoals(payload.completedGoals);
    const xp = safeInt(payload.xp, 0, 10_000_000);
    const score = safeInt(payload.score, 0, 1_000_000_000);
    const destroyed = Math.max(
      destroyedIds.length,
      safeInt(payload.destroyed, 0, 100_000),
    );
    const maxCombo = safeInt(payload.maxCombo, 0, 100_000);
    const playSeconds = safeNumber(payload.playSeconds, 0, 10_000_000);
    const cleared = payload.cleared === true;
    const updatedAt = safeDate(payload.updatedAt);
    await db.prepare(`INSERT INTO demolition_saves (
      player_id, xp, score, destroyed, max_combo, play_seconds,
      cleared, destroyed_json, completed_goals_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      xp = excluded.xp,
      score = excluded.score,
      destroyed = excluded.destroyed,
      max_combo = excluded.max_combo,
      play_seconds = excluded.play_seconds,
      cleared = excluded.cleared,
      destroyed_json = excluded.destroyed_json,
      completed_goals_json = excluded.completed_goals_json,
      updated_at = excluded.updated_at
    WHERE excluded.updated_at >= demolition_saves.updated_at`)
      .bind(
        playerId,
        xp,
        score,
        destroyed,
        maxCombo,
        playSeconds,
        cleared ? 1 : 0,
        JSON.stringify(destroyedIds),
        JSON.stringify(completedGoals),
        updatedAt,
      )
      .run();
    const response = json({ ok: true, updatedAt });
    if (cookie) response.headers.set("set-cookie", cookie);
    return response;
  }

  if (request.method === "POST" && url.pathname === "/api/demolition/clear") {
    const payload = await readJsonBody(request) as ClearPayload;
    const score = safeInt(payload.score, 0, 1_000_000_000);
    const destroyed = safeInt(payload.destroyed, 0, 100_000);
    const total = safeInt(payload.total, 1, 100_000);
    const maxCombo = safeInt(payload.maxCombo, 0, 100_000);
    const playSeconds = safeNumber(payload.playSeconds, 0, 10_000_000);
    if (destroyed < total) {
      return json({ error: "incomplete_demolition" }, { status: 400 });
    }
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`INSERT INTO demolition_runs (
        id, player_id, score, destroyed, max_combo, play_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          crypto.randomUUID(),
          playerId,
          score,
          destroyed,
          maxCombo,
          playSeconds,
          now,
        ),
      db.prepare(`UPDATE demolition_players SET
        best_score = MAX(best_score, ?),
        clears = clears + 1,
        total_destroyed = total_destroyed + ?,
        updated_at = ?
        WHERE id = ?`)
        .bind(score, destroyed, now, playerId),
    ]);
    const updated = await db.prepare("SELECT * FROM demolition_players WHERE id = ?")
      .bind(playerId)
      .first<PlayerRow>();
    const response = json({ profile: publicProfile(updated) }, { status: 201 });
    if (cookie) response.headers.set("set-cookie", cookie);
    return response;
  }

  return json({ error: "not_found" }, { status: 404 });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/demolition/")) {
      try {
        return await handleDemolitionApi(request, env);
      } catch (error) {
        console.error("Demolition API error", error);
        return json({ error: "server_error" }, { status: 500 });
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body)
            .transform(width > 0 ? { width } : {})
            .output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
