import assert from "node:assert/strict";
import { lstat, readFile, readlink } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps character-specific setup outside the Office Crash game", async () => {
  const [game, sobaya] = await Promise.all([
    read("../app/OfficeCrashGame.tsx"),
    read("../app/characters/sobaya.ts"),
  ]);

  assert.match(game, /loadVoxelCharacter/);
  assert.match(game, /SOBAYA_CHARACTER/);
  assert.doesNotMatch(game, /SobayaVoxel_MugArmPivot/);
  assert.match(sobaya, /SobayaVoxel_MugArmPivot/);
});

test("shares a stable optional-channel rig contract between Blender and Three.js", async () => {
  const [runtime, blender] = await Promise.all([
    read("../app/characters/voxel-character-kit.ts"),
    read("../../04_GAME_ASSETS/voxel/tools/voxel_character_kit.py"),
  ]);

  for (const node of [
    "VoxelRig_ArmPrimary",
    "VoxelRig_ArmSecondary",
    "VoxelRig_LegLeft",
    "VoxelRig_LegRight",
    "VoxelRig_Locomotion_",
  ]) {
    assert.match(runtime, new RegExp(node));
    assert.match(blender, new RegExp(node));
  }
  assert.match(runtime, /triggerSmash/);
  assert.match(runtime, /smashDuration: 0\.44/);
  assert.match(runtime, /impactHoldEnd: 0\.52/);
  assert.match(runtime, /impactAngle: -1\.55/);
  assert.match(runtime, /rootLeanAngle/);
  assert.match(blender, /build_voxel_rig/);
});

test("uses canonical symlinked GLBs while Yumemin opts into the v3 procedural model", async () => {
  const glbBosses = [
    "yotan",
    "tokun",
    "fukuchan",
    "takosan",
    "yametaro",
    "okayaman",
  ];
  const bossDefinitions = await read("../app/characters/window-bosses.ts");
  assert.match(bossDefinitions, /assetUrl: `\/models\/\$\{id\}\.glb/);
  assert.match(bossDefinitions, /makeYumeminV3Model/);
  assert.match(bossDefinitions, /assetVersion = "yumemin-v3"/);
  assert.match(bossDefinitions, /outlines: false/);
  assert.match(bossDefinitions, /model\.position\.y = 1\.38/);

  for (const boss of glbBosses) {
    assert.match(bossDefinitions, new RegExp(`makeModel\\("${boss}"`));
    const modelUrl = new URL(`../public/models/${boss}.glb`, import.meta.url);
    assert.equal((await lstat(modelUrl)).isSymbolicLink(), true);
    assert.equal(
      await readlink(modelUrl),
      `../../../04_GAME_ASSETS/voxel/models/${boss}.glb`,
    );
  }

  const yumeminFactory = await read(
    "../../04_GAME_ASSETS/threejs/yumemin-img2threejs/src/createYumeminModel.ts",
  );
  assert.match(yumeminFactory, /perfectly spherical blue body/);
  assert.match(yumeminFactory, /no drawn outline geometry/);
  assert.match(yumeminFactory, /white conforming wrap cloth/);
});

test("keeps character boss defeats peaceful and attacks readable", async () => {
  const [game, bosses] = await Promise.all([
    read("../app/OfficeCrashRPG.tsx"),
    read("../app/characters/window-bosses.ts"),
  ]);

  assert.match(game, /makeDizzyBoss/);
  assert.match(game, /peacefulBoss/);
  assert.match(game, /addBeamHazard/);
  assert.match(bosses, /フィードバック・リフ/);
  assert.match(bosses, /レギュレーション・ビーム/);
});
