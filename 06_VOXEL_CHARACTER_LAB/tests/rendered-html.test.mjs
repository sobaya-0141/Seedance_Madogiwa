import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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

test("renders the character action lab", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Voxel Character Lab \| Madogiwa Toolkit<\/title>/);
  assert.match(html, /VOXEL CHARACTER LAB/);
  assert.match(html, /そば屋/);
  assert.match(html, /たこさん/);
  assert.match(html, /無職やめ太郎/);
  assert.match(html, /基本アクション/);
  assert.match(html, /POWER/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("uses Three.js and the shared voxel rig contract", async () => {
  const [viewer, kit, catalog, takosanBuilder, yametaroBuilder] = await Promise.all([
    readFile(new URL("../app/CharacterLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/voxel-character-kit.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/character-catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../../04_GAME_ASSETS/voxel/tools/build_takosan_voxel_model.py", import.meta.url), "utf8"),
    readFile(new URL("../../04_GAME_ASSETS/voxel/tools/build_yametaro_voxel_model.py", import.meta.url), "utf8"),
  ]);
  assert.match(viewer, /new THREE\.WebGLRenderer/);
  assert.match(viewer, /new OrbitControls/);
  assert.match(viewer, /triggerSmash/);
  assert.match(kit, /VoxelRig_ArmPrimary/);
  assert.match(kit, /VoxelRig_Locomotion_/);
  assert.match(kit, /smashDuration: 0\.44/);
  assert.match(kit, /impactHoldEnd: 0\.52/);
  assert.match(kit, /impactAngle: -1\.55/);
  assert.match(kit, /rootLeanAngle/);
  assert.match(catalog, /TENTACLED \/ 8 PIVOTS/);
  assert.match(takosanBuilder, /--face-texture/);
  assert.match(takosanBuilder, /--robe-texture/);
  assert.match(takosanBuilder, /add_textured_front_panel/);
  assert.match(yametaroBuilder, /--face-texture/);
  assert.match(yametaroBuilder, /--shirt-texture/);
  assert.match(yametaroBuilder, /--shirt-back-texture/);
  assert.match(yametaroBuilder, /add_textured_front_panel/);
  assert.match(yametaroBuilder, /add_textured_back_panel/);
  await access(new URL("../public/models/sobaya.glb", import.meta.url));
  await access(new URL("../public/models/takosan.glb", import.meta.url));
  await access(new URL("../public/models/yametaro.glb", import.meta.url));
  const textures = new URL("../../04_GAME_ASSETS/voxel/model_source/textures/", import.meta.url);
  await access(new URL("takosan_face_albedo_v2.png", textures));
  await access(new URL("takosan_robe_front_albedo.png", textures));
  await access(new URL("yametaro_face_albedo_v2.png", textures));
  await access(new URL("yametaro_shirt_front_albedo_v2.png", textures));
  await access(new URL("yametaro_shirt_back_albedo_v1.png", textures));
});
