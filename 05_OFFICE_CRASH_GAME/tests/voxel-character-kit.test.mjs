import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
