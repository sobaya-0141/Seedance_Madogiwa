import assert from "node:assert/strict";
import { readFile, readlink } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps character-specific setup outside the Office Crash game", async () => {
  const [game, sobaya] = await Promise.all([
    read("../app/OfficeCrashGame.tsx"),
    read("../app/characters/sobaya.ts"),
  ]);

  assert.match(game, /loadSkinnedCharacter/);
  assert.match(game, /SOBAYA_CHARACTER/);
  assert.doesNotMatch(game, /Hybrid_MugSmash|PropSocket/);
  assert.match(sobaya, /Hybrid_MugSmash/);
  // ジョッキはNG変更要素なので必ず持たせる
  assert.match(sobaya, /PropSocket\.R/);
  assert.match(sobaya, /beer_mug\.glb/);
});

test("syncs the smash animation with the gameplay impact", async () => {
  const [game, kit] = await Promise.all([
    read("../app/OfficeCrashGame.tsx"),
    read("../app/characters/skinned-character-kit.ts"),
  ]);
  assert.match(game, /triggerSmash\(mega, SMASH_IMPACT_DELAY\)/);
  assert.match(game, /impactAt: runtime\.elapsed \+ SMASH_IMPACT_DELAY/);
  assert.match(kit, /\(impactAt - startAt\) \/ impactDelay/);
});

test("references the shared adopted models instead of voxel assets", async () => {
  const models = new URL("../public/models/", import.meta.url);
  assert.equal(
    await readlink(new URL("sobaya.glb", models)),
    "../../../04_GAME_ASSETS/models3d/mobile/sobaya.glb",
  );
  assert.equal(
    await readlink(new URL("beer_mug.glb", models)),
    "../../../04_GAME_ASSETS/models3d/props/beer_mug.glb",
  );
});
