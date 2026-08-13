import assert from "node:assert/strict";
import { lstat, readFile, readlink } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the standalone total-demolition game shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(
    html,
    /<title>そば屋のオフィス更地クラッシュ ～全部壊して快適です！～<\/title>/,
  );
  assert.match(html, /aria-label="そば屋のオフィス更地クラッシュ 全破壊3Dゲーム画面"/);
  assert.match(html, /SOFT OFFICE/);
  assert.match(html, /CURRENT AREA/);
  assert.match(html, /ULTIMATE GAUGE/);
  assert.match(html, /麻布十番/);
  assert.match(html, /全社リノベーション準備中/);
  assert.match(html, /STRUCTURAL CHECK/);
  assert.match(html, /property="og:image" content="http:\/\/localhost\/og\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("ships a correctly sized bespoke social card", async () => {
  const card = await readFile(new URL("../public/og.png", import.meta.url));
  assert.equal(card.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(card.readUInt32BE(16), 1536);
  assert.equal(card.readUInt32BE(20), 1024);
});

test("implements office-to-city escalation and expressive demolition actions", async () => {
  const [world, rules, component, css, city, orientation] = await Promise.all([
    read("../app/demolition/world.ts"),
    read("../app/demolition/rules.ts"),
    read("../app/OfficeDemolition.tsx"),
    read("../app/globals.css"),
    read("../app/demolition/city.ts"),
    read("../app/demolition/orientation.ts"),
  ]);

  for (const stage of [
    "buildOpenOffice",
    "buildMeetingSuite",
    "buildArchiveAndServer",
    "buildWindowLounge",
    "buildStructure",
    "buildSlabs",
  ]) {
    assert.match(world, new RegExp(stage));
  }
  for (const material of [
    '"wood"',
    '"glass"',
    '"metal"',
    '"plaster"',
    '"concrete"',
    '"slab"',
    '"steel"',
  ]) {
    assert.match(world, new RegExp(material));
  }
  for (const action of [
    "beginSmash",
    "grabOrThrow",
    "beginDash",
    "beginStomp",
    "beginKanpai",
    "evaluateSupports",
    "propagateChain",
    "buildAzabuDistrict",
    "fireBeerBeamAndMeteors",
    "updateUltimateEffects",
  ]) {
    assert.match(world, new RegExp(action));
  }
  assert.match(world, /MAX_DEBRIS = 230/);
  assert.match(world, /InstancedMesh/);
  assert.match(world, /destroyedIds/);
  assert.match(world, /foundation-beam-/);
  assert.match(world, /trackGoalProgress/);
  assert.match(world, /完全更地達成/);
  assert.match(world, /districtUnlocked/);
  assert.match(world, /giantScale/);
  assert.match(world, /radarActive/);
  assert.match(world, /makeMeteorMug/);

  assert.match(rules, /threshold: 700/);
  assert.match(rules, /threshold: 2_600/);
  assert.match(rules, /threshold: 6_200/);
  assert.match(rules, /threshold: 12_500/);
  assert.match(rules, /STEEL & FOUNDATION/);
  assert.match(rules, /DEMOLITION_GOALS/);
  assert.match(rules, /麻布十番/);

  assert.match(component, /START DEMOLITION/);
  assert.match(component, /続きから再開/);
  assert.match(component, /\/api\/demolition\/save/);
  assert.match(component, /navigator\.share/);
  assert.match(component, /mobile-joystick/);
  assert.match(component, /BEER BEAM/);
  assert.match(component, /× JOKKI METEOR/);
  assert.match(component, /REMAINING ASSET RADAR/);
  assert.match(component, /AZABU-JUBAN RAMPAGE/);
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /ultimate-banner/);
  assert.match(css, /district-status/);

  assert.match(city, /AZABU_CITY_BREAKABLE_COUNT/);
  assert.match(city, /getGiantScale/);
  assert.match(city, /CITY_HALF_X = 96/);
  assert.match(orientation, /getRadarArrow/);
});

test("keeps the canonical Sobaya GLB symlinked and the older game intact", async () => {
  const model = new URL("../public/models/sobaya.glb", import.meta.url);
  assert.equal((await lstat(model)).isSymbolicLink(), true);
  assert.equal(
    await readlink(model),
    "../../../04_GAME_ASSETS/voxel/models/sobaya.glb",
  );
  const oldPage = await read("../../05_OFFICE_CRASH_GAME/app/page.tsx");
  const oldPackage = await read("../../05_OFFICE_CRASH_GAME/package.json");
  assert.match(oldPage, /OfficeCrashRPG/);
  assert.match(oldPackage, /sobaya-office-crash/);
});

test("persists in-progress destruction and clear records in dedicated D1 tables", async () => {
  const [worker, schema, hosting, migration] = await Promise.all([
    read("../worker/index.ts"),
    read("../db/schema.ts"),
    read("../.openai/hosting.json"),
    read("../drizzle/0000_modern_omega_sentinel.sql"),
  ]);
  assert.match(hosting, /"d1": "DB"/);
  for (const table of [
    "demolition_players",
    "demolition_saves",
    "demolition_runs",
  ]) {
    assert.match(worker, new RegExp(table));
    assert.match(schema, new RegExp(table.replace(/_([a-z])/g, (_, c) => c.toUpperCase())));
    assert.match(migration, new RegExp(table));
  }
  assert.match(worker, /\/api\/demolition\/profile/);
  assert.match(worker, /\/api\/demolition\/save/);
  assert.match(worker, /\/api\/demolition\/clear/);
  assert.match(worker, /destroyed_json/);
  assert.match(worker, /completed_goals_json/);
  assert.match(worker, /incomplete_demolition/);
});
