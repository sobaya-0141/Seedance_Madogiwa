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
  assert.match(html, /<title>そば屋のオフィスクラッシュ<\/title>/);
  assert.match(html, /aria-label="そば屋のオフィスクラッシュ ゲーム画面"/);
  assert.match(html, /オフィスに突入！/);
  assert.match(html, /MADOGIWA 45 SECOND CHALLENGE/);
  assert.match(html, /POWER 6秒/);
  assert.match(html, /TIME \+5/);
  assert.match(html, /強化ゲート/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("uses Three.js with a fixed camera and keyboard plus touch controls", async () => {
  const source = await readFile(new URL("../app/OfficeCrashGame.tsx", import.meta.url), "utf8");
  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /new THREE\.OrthographicCamera/);
  assert.match(source, /baseCameraPosition = new THREE\.Vector3\(17, 21, 21\)/);
  assert.match(source, /keydown/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /runtime\.powerUntil/);
  assert.match(source, /const INITIAL_TIME = 45/);
  assert.match(source, /const TIME_BONUS = 5/);
  assert.match(source, /makeReinforcedGate/);
  assert.match(source, /maxRespawns/);
  assert.match(source, /new window\.AudioContext/);
  assert.match(source, /playSound\("metal"\)/);
});
