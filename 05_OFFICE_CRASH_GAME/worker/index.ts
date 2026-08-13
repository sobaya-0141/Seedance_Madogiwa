import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type PlayerRow = {
  id: string;
  username: string;
  caps: number;
  best_floor: number;
  best_score: number;
  total_runs: number;
  total_destroyed: number;
  clears: number;
  forge: number;
  vitality: number;
  hustle: number;
  fixture_server: number;
  fixture_showcase: number;
  fixture_exit: number;
  mastery_refunded: number;
  refunded_caps?: number;
};

type RunPayload = {
  victory?: unknown;
  floorReached?: unknown;
  score?: unknown;
  destroyed?: unknown;
  maxCombo?: unknown;
  capsEarned?: unknown;
  upgrades?: unknown;
  overtimeRank?: unknown;
  buildName?: unknown;
};

const PLAYER_COOKIE = "sobaya_player";
const DEFAULT_USERNAME = "匿名窓際社員";
const MAX_USERNAME_LENGTH = 20;
const MAX_BODY_BYTES = 12_000;
let schemaReady: Promise<void> | null = null;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function safeInt(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : min;
}

function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return DEFAULT_USERNAME;
  if (Array.from(normalized).length > MAX_USERNAME_LENGTH) return null;
  return normalized;
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

async function ensureSchema(db: D1Database) {
  schemaReady ??= (async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT DEFAULT '匿名窓際社員' NOT NULL,
        caps INTEGER DEFAULT 0 NOT NULL,
        best_floor INTEGER DEFAULT 0 NOT NULL,
        best_score INTEGER DEFAULT 0 NOT NULL,
        total_runs INTEGER DEFAULT 0 NOT NULL,
        total_destroyed INTEGER DEFAULT 0 NOT NULL,
        clears INTEGER DEFAULT 0 NOT NULL,
        forge INTEGER DEFAULT 0 NOT NULL,
        vitality INTEGER DEFAULT 0 NOT NULL,
        hustle INTEGER DEFAULT 0 NOT NULL,
        fixture_server INTEGER DEFAULT 0 NOT NULL,
        fixture_showcase INTEGER DEFAULT 0 NOT NULL,
        fixture_exit INTEGER DEFAULT 0 NOT NULL,
        mastery_refunded INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY NOT NULL,
        player_id TEXT NOT NULL,
        victory INTEGER DEFAULT 0 NOT NULL,
        floor_reached INTEGER NOT NULL,
        score INTEGER NOT NULL,
        destroyed INTEGER NOT NULL,
        max_combo INTEGER NOT NULL,
        caps_earned INTEGER NOT NULL,
        build_json TEXT NOT NULL,
        overtime_rank INTEGER DEFAULT 0 NOT NULL,
        build_name TEXT DEFAULT '単品ジョッキ' NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (player_id) REFERENCES players(id)
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS runs_player_created_idx ON runs (player_id, created_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS runs_score_idx ON runs (score)"),
    ]);
    const playerColumns = await db.prepare("PRAGMA table_info(players)").all<{ name: string }>();
    if (!playerColumns.results.some((column) => column.name === "username")) {
      await db.prepare(
        "ALTER TABLE players ADD COLUMN username TEXT DEFAULT '匿名窓際社員' NOT NULL",
      ).run();
    }
    const fixtureColumns = [
      ["fixture_server", "ALTER TABLE players ADD COLUMN fixture_server INTEGER DEFAULT 0 NOT NULL"],
      ["fixture_showcase", "ALTER TABLE players ADD COLUMN fixture_showcase INTEGER DEFAULT 0 NOT NULL"],
      ["fixture_exit", "ALTER TABLE players ADD COLUMN fixture_exit INTEGER DEFAULT 0 NOT NULL"],
      ["mastery_refunded", "ALTER TABLE players ADD COLUMN mastery_refunded INTEGER DEFAULT 0 NOT NULL"],
    ] as const;
    for (const [name, statement] of fixtureColumns) {
      if (!playerColumns.results.some((column) => column.name === name)) {
        await db.prepare(statement).run();
      }
    }
    const runColumns = await db.prepare("PRAGMA table_info(runs)").all<{ name: string }>();
    if (!runColumns.results.some((column) => column.name === "overtime_rank")) {
      await db.prepare(
        "ALTER TABLE runs ADD COLUMN overtime_rank INTEGER DEFAULT 0 NOT NULL",
      ).run();
    }
    if (!runColumns.results.some((column) => column.name === "build_name")) {
      await db.prepare(
        "ALTER TABLE runs ADD COLUMN build_name TEXT DEFAULT '単品ジョッキ' NOT NULL",
      ).run();
    }
  })();
  await schemaReady;
}

async function readJsonBody(request: Request) {
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > MAX_BODY_BYTES) throw new Error("payload_too_large");
  return request.json();
}

async function getPlayer(db: D1Database, playerId: string) {
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO players (id, created_at, updated_at)
    VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING`).bind(playerId, now, now).run();
  let player = await db.prepare("SELECT * FROM players WHERE id = ?").bind(playerId).first<PlayerRow>();
  if (player && player.mastery_refunded === 0) {
    const refundedCaps = [player.forge, player.vitality, player.hustle]
      .reduce((total, level) => total + 10 * level * (level + 1), 0);
    await db.prepare(`UPDATE players SET
      caps = caps + ?, mastery_refunded = 1, updated_at = ?
      WHERE id = ? AND mastery_refunded = 0`)
      .bind(refundedCaps, now, playerId).run();
    player = await db.prepare("SELECT * FROM players WHERE id = ?").bind(playerId).first<PlayerRow>();
    if (player) player.refunded_caps = refundedCaps;
  }
  return player;
}

function publicProfile(row: PlayerRow) {
  return {
    username: row.username || DEFAULT_USERNAME,
    caps: row.caps,
    bestFloor: row.best_floor,
    bestScore: row.best_score,
    totalRuns: row.total_runs,
    totalDestroyed: row.total_destroyed,
    clears: row.clears,
    fixtures: {
      server: row.fixture_server,
      showcase: row.fixture_showcase,
      exit: row.fixture_exit,
    },
    refundedCaps: row.refunded_caps ?? 0,
  };
}

async function profilePayload(db: D1Database, playerId: string) {
  const player = await getPlayer(db, playerId);
  if (!player) throw new Error("profile_unavailable");
  const [recent, leaders, global] = await Promise.all([
    db.prepare(`SELECT victory, floor_reached AS floorReached, score, destroyed,
      max_combo AS maxCombo, caps_earned AS capsEarned,
      overtime_rank AS overtimeRank, build_name AS buildName, created_at AS createdAt
      FROM runs WHERE player_id = ? ORDER BY created_at DESC LIMIT 5`)
      .bind(playerId).all(),
    db.prepare(`SELECT COALESCE(NULLIF(TRIM(players.username), ''), '匿名窓際社員') AS username,
      runs.score, runs.floor_reached AS floorReached, runs.victory,
      runs.overtime_rank AS overtimeRank, runs.build_name AS buildName
      FROM runs INNER JOIN players ON players.id = runs.player_id
      WHERE runs.id = (
        SELECT best.id FROM runs AS best
        WHERE best.player_id = runs.player_id
        ORDER BY best.score DESC, best.floor_reached DESC, best.created_at ASC
        LIMIT 1
      )
      ORDER BY runs.score DESC, runs.floor_reached DESC, runs.created_at ASC LIMIT 5`).all(),
    db.prepare(`SELECT COUNT(*) AS runs, COALESCE(SUM(destroyed), 0) AS destroyed,
      COALESCE(SUM(victory), 0) AS clears FROM runs`).first(),
  ]);
  return {
    profile: publicProfile(player),
    recentRuns: recent.results,
    leaderboard: leaders.results,
    globalStats: global ?? { runs: 0, destroyed: 0, clears: 0 },
  };
}

async function handleGameApi(request: Request, env: Env) {
  if (!env.DB) return json({ error: "database_unavailable" }, { status: 503 });
  const db = env.DB;
  await ensureSchema(db);
  const requestUrl = new URL(request.url);
  const cookieId = validPlayerId(getCookie(request, PLAYER_COOKIE));
  const playerId = cookieId ?? crypto.randomUUID();
  const cookieHeader = cookieId ? undefined : playerCookie(playerId, requestUrl.protocol === "https:");

  if (request.method === "GET" && requestUrl.pathname === "/api/game/profile") {
    const response = json(await profilePayload(db, playerId));
    if (cookieHeader) response.headers.set("set-cookie", cookieHeader);
    return response;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/game/username") {
    const body = await readJsonBody(request) as { username?: unknown };
    const username = normalizeUsername(body.username);
    if (!username) {
      return json(
        { error: "invalid_username", maxLength: MAX_USERNAME_LENGTH },
        { status: 400 },
      );
    }
    await getPlayer(db, playerId);
    await db.prepare("UPDATE players SET username = ?, updated_at = ? WHERE id = ?")
      .bind(username, new Date().toISOString(), playerId).run();
    const response = json(await profilePayload(db, playerId));
    if (cookieHeader) response.headers.set("set-cookie", cookieHeader);
    return response;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/game/run") {
    const payload = await readJsonBody(request) as RunPayload;
    await getPlayer(db, playerId);
    const floorReached = safeInt(payload.floorReached, 1, 8);
    const score = safeInt(payload.score, 0, 10_000_000);
    const destroyed = safeInt(payload.destroyed, 0, 10_000);
    const maxCombo = safeInt(payload.maxCombo, 0, 10_000);
    const capsEarned = safeInt(payload.capsEarned, 0, 5_000);
    const overtimeRank = safeInt(payload.overtimeRank, 0, 2);
    const buildName = typeof payload.buildName === "string"
      ? payload.buildName.slice(0, 120)
      : "単品ジョッキ";
    const victory = payload.victory === true;
    const upgrades = Array.isArray(payload.upgrades)
      ? payload.upgrades.slice(0, 30).map((value) => String(value).slice(0, 80))
      : [];
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`INSERT INTO runs (
        id, player_id, victory, floor_reached, score, destroyed,
        max_combo, caps_earned, build_json, overtime_rank, build_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        crypto.randomUUID(), playerId, victory ? 1 : 0, floorReached, score,
        destroyed, maxCombo, capsEarned, JSON.stringify(upgrades),
        overtimeRank, buildName, now,
      ),
      db.prepare(`UPDATE players SET
        caps = caps + ?,
        best_floor = MAX(best_floor, ?),
        best_score = MAX(best_score, ?),
        total_runs = total_runs + 1,
        total_destroyed = total_destroyed + ?,
        clears = clears + ?,
        updated_at = ?
        WHERE id = ?`).bind(
        capsEarned, floorReached, score, destroyed, victory ? 1 : 0, now, playerId,
      ),
    ]);
    const response = json(await profilePayload(db, playerId), { status: 201 });
    if (cookieHeader) response.headers.set("set-cookie", cookieHeader);
    return response;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/game/fixture") {
    const body = await readJsonBody(request) as { fixture?: unknown };
    const fixture = body.fixture;
    const columns = {
      server: { column: "fixture_server", row: "fixture_server" },
      showcase: { column: "fixture_showcase", row: "fixture_showcase" },
      exit: { column: "fixture_exit", row: "fixture_exit" },
    } as const;
    if (typeof fixture !== "string" || !(fixture in columns)) {
      return json({ error: "invalid_fixture" }, { status: 400 });
    }
    const player = await getPlayer(db, playerId);
    if (!player) return json({ error: "profile_unavailable" }, { status: 503 });
    const key = fixture as keyof typeof columns;
    const level = player[columns[key].row];
    const cost = [60, 140, 300][level] ?? 300;
    if (level >= 3) return json({ error: "fixture_maxed" }, { status: 409 });
    if (player.caps < cost) return json({ error: "not_enough_caps", cost }, { status: 409 });
    const column = columns[key].column;
    await db.prepare(`UPDATE players SET ${column} = ${column} + 1,
      caps = caps - ?, updated_at = ? WHERE id = ? AND caps >= ?`)
      .bind(cost, new Date().toISOString(), playerId, cost).run();
    const response = json(await profilePayload(db, playerId));
    if (cookieHeader) response.headers.set("set-cookie", cookieHeader);
    return response;
  }

  return json({ error: "not_found" }, { status: 404 });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/game/")) {
      try {
        return await handleGameApi(request, env);
      } catch (error) {
        console.error("Game API error", error);
        return json({ error: "server_error" }, { status: 500 });
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
