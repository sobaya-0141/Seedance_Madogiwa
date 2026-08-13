import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("renders the Office Crash game shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>そば屋のオフィスクラッシュ ～無限フロア大整理～<\/title>/);
  assert.match(html, /aria-label="そば屋のオフィスクラッシュ 無限フロア大整理 ゲーム画面"/);
  assert.match(html, /MADOGIWA HACK, SMASH &amp; DRAFT/);
  assert.match(html, /壊して。拾って。一掃。/);
  assert.match(html, /BREAK/);
  assert.match(html, /BUILD/);
  assert.match(html, /RAIL/);
  assert.match(html, /立ち飲み処メニュー/);
  assert.match(html, />出撃</);
  assert.match(html, />設備</);
  assert.match(html, />記録</);
  assert.match(html, /退社作戦/);
  assert.match(html, /残業/);
  assert.match(html, /定時退社/);
  assert.match(html, /フライング退社/);
  assert.match(html, /TODAY \+1\/階/);
  assert.match(html, /SCORE ×/);
  assert.match(html, /ノルマ ×/);
  assert.match(html, /準備中…/);
  assert.match(html, /BOSS VOICE/);
  assert.doesNotMatch(html, /タコ部屋の人型の大穴/);
  assert.doesNotMatch(html, /移動 WASD/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps the static GitHub Pages entry outside the vinext route tree", async () => {
  const pagesConfig = await readFile(new URL("../vite.pages.config.ts", import.meta.url), "utf8");
  assert.match(pagesConfig, /root: path\.resolve\(__dirname, "github-pages"\)/);
  await assert.rejects(readFile(new URL("../pages/main.tsx", import.meta.url), "utf8"));
});

test("uses Three.js with a fixed camera, combat floors, and keyboard plus touch controls", async () => {
  const source = await readFile(new URL("../app/OfficeCrashRPG.tsx", import.meta.url), "utf8");
  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /new THREE\.OrthographicCamera/);
  assert.match(source, /baseCameraPosition = new THREE\.Vector3\(17, 21, 21\)/);
  assert.match(source, /keydown/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /makeRewardChoices/);
  assert.match(source, /updateEquipmentVisuals/);
  assert.match(source, /type EliteAffix/);
  assert.match(source, /runtime\.pressure/);
  assert.match(source, /rerollReward/);
  assert.match(source, /OVERTIME_RANKS/);
  assert.match(source, /runtime\.timer = floorDefinition\.kind === "challenge" \? 15 : null/);
  assert.match(source, /makeCoreEnemy/);
  assert.match(source, /pickUpgrade/);
  assert.match(source, /upgradeValues\.mug/);
  assert.match(source, /upgradeValues\.barrel/);
  assert.match(source, /upgradeValues\.chiller/);
  assert.match(source, /upgradeValues\.tray/);
  assert.match(source, /upgradeValues\.lantern/);
  assert.match(source, /upgradeValues\.sneakers/);
  assert.match(source, /webkitAudioContext/);
  assert.match(source, /context\.resume\(\)/);
  assert.match(source, /primeAudioContext/);
  assert.match(source, /createBufferSource/);
  assert.match(source, /"interrupted"/);
  assert.match(source, /statechange/);
  assert.match(source, /onPointerDownCapture/);
  assert.match(source, /onTouchEndCapture/);
  assert.match(source, /testSound/);
  assert.match(source, /megaSmash/);
  assert.match(source, /launchMegaMug/);
  assert.match(source, /spawnMegaImpact/);
  assert.match(source, /生ジョッキレール/);
  assert.match(source, /ENCORE PHASE/);
  assert.match(source, /type EnemyAttackKind = "melee" \| "pulse"/);
  assert.match(source, /makeDangerZone/);
  assert.match(source, /DODGE!/);
  assert.match(source, /lastCallBoost/);
  assert.match(source, /formationSpawnPoints/);
  assert.match(source, /MAX_CONCURRENT_MOB_ATTACKS = 4/);
  assert.match(source, /runtime\.floorKilled >= runtime\.floorQuota/);
  assert.match(source, /gainMegaGauge/);
  assert.match(source, /startOfficeRush/);
  assert.match(source, /rushAnnouncement = hud\.rushRemaining > 10\.5/);
  assert.match(source, /mobile-mega-fill/);
  assert.match(source, /bossDialogue \|\| rushAnnouncement/);
  assert.match(source, /spawnQuotaReinforcements/);
  assert.match(source, /overtime\.destructionMultiplier/);
  assert.match(source, /destroyOfficeProp/);
  assert.match(source, /showDamageNumber/);
  assert.match(source, /BASE_SMASH_DAMAGE = 2/);
  assert.match(source, /DAMAGE_DISPLAY_MULTIPLIER = 5/);
  assert.match(source, /amount \* DAMAGE_DISPLAY_MULTIPLIER/);
  assert.match(source, /BOSS_DIFFICULTY_BY_RANK/);
  assert.match(source, /BOSS_WARNING_COLOR = 0xff2038/);
  assert.match(source, /showBossDialogue/);
  assert.match(source, /spawnBossAttackVisual/);
  assert.match(source, /hazard\.sourceBoss === "okayaman"/);
  assert.match(source, /addBossBeamHazard/);
  assert.match(source, /bossWarning/);
  assert.match(source, /runtime\.elapsed \+ 3\.2/);
  assert.match(source, /scene\.remove\(dizzy\.group\)/);
  assert.match(source, /bossDifficulty\.areaMultiplier/);
  assert.match(source, /bossDifficulty\.cadenceMultiplier/);
  assert.match(source, /bossDifficulty\.openingDuration/);
  assert.match(source, /pickFinalBossGuests\(runtime\.overtimeRank\)/);
  assert.match(source, /spawnCharacterBoss\("okayaman", 0, -8\.6\)/);
  assert.match(source, /finalGuests\.forEach/);
  assert.match(source, /MEGA HIT/);
  assert.match(source, /WEAK ×/);
  assert.match(source, /rpg-damage-layer/);
  assert.match(source, /office-crash-controls-v2/);
  assert.match(source, /navigator\.share/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /getDailyFeaturedRank/);
  assert.match(source, /runtime\.runCaps \+= 1/);
  assert.match(source, /友達を招待/);
  assert.match(source, /記録を共有/);
  assert.match(source, /hubPanel === "bar"/);
  assert.match(source, /hubPanel === "records"/);
  assert.doesNotMatch(source, /撃破・回避・生ジョッキで補充/);
  assert.match(source, /kind === "core" \? 125 : 50/);
  assert.match(source, /fetch\("\/api\/game\/run"/);
  assert.match(source, /fetch\("\/api\/game\/fixture"/);
});

test("combines Rapier rigid bodies with Koota lifecycle systems and kinetic combat", async () => {
  const game = await readFile(new URL("../app/OfficeCrashRPG.tsx", import.meta.url), "utf8");
  const physics = await readFile(new URL("../app/game-physics.ts", import.meta.url), "utf8");
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.equal(typeof manifest.dependencies["@dimforge/rapier3d"], "string");
  assert.equal(typeof manifest.dependencies.koota, "string");
  assert.equal(typeof manifest.devDependencies["vite-plugin-wasm"], "string");
  assert.equal(manifest.scripts.postbuild, "node scripts/prune-sites-server-assets.mjs");
  assert.match(physics, /new RAPIER\.World/);
  assert.match(physics, /const FIXED_STEP = 1 \/ 60/);
  assert.match(physics, /createWorld\(\)/);
  assert.match(physics, /const PhysicsNode = trait/);
  assert.match(physics, /spawnPlayground/);
  assert.match(physics, /collectKineticImpacts/);
  assert.match(physics, /MAX_DYNAMIC_BODIES = 150/);
  assert.match(game, /physicsRuntime\?\.blast/);
  assert.match(game, /!import\.meta\.env\.SSR/);
  assert.match(game, /import\("\.\/game-physics"\)/);
  assert.match(game, /resolveKineticImpacts/);
  assert.match(game, /MAX_KINETIC_HITS_PER_SWEEP = 3/);
  assert.match(game, /KINETIC_SWEEP_INTERVAL = 1 \/ 30/);
  assert.match(game, /style !== "kinetic"/);
  assert.match(game, /PHYSICS CHAIN/);
  assert.match(game, /RAPIER × KOOTA/);
});

test("keeps the portrait mobile HUD in dedicated status, notice, and control lanes", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /height: 100dvh/);
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /\.rpg-floor em/);
  assert.match(css, /\.rpg-mega \{\s*display: none;/);
  assert.match(css, /\.mobile-mega-fill/);
  assert.match(css, /\.rpg-toast\.suppressed/);
  assert.match(css, /min-width: 145px/);
  assert.match(css, /bottom: calc\(env\(safe-area-inset-bottom, 0px\) \+ 12px\)/);
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /minmax\(118px, 1\.35fr\)/);
  assert.match(css, /\.rpg-score-row strong \{\s*min-width: 0;\s*max-width: 100%;\s*overflow: hidden;/);
});

test("stores profiles, run history, fixtures, and leaderboard data in D1", async () => {
  const source = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  const hosting = await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8");
  assert.match(hosting, /"d1": "DB"/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS players/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS runs/);
  assert.match(source, /overtime_rank/);
  assert.match(source, /build_name/);
  assert.match(source, /\/api\/game\/profile/);
  assert.match(source, /\/api\/game\/run/);
  assert.match(source, /\/api\/game\/fixture/);
  assert.match(source, /mastery_refunded/);
  assert.match(source, /fixture_server/);
  assert.match(source, /fixture_showcase/);
  assert.match(source, /fixture_exit/);
  assert.match(source, /\/api\/game\/username/);
  assert.match(source, /匿名窓際社員/);
  assert.match(source, /INNER JOIN players/);
  assert.match(source, /best\.player_id = runs\.player_id/);
  assert.match(source, /ORDER BY runs\.score DESC/);
});
