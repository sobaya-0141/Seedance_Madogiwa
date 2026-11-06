import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createActionController } from "../app/characters/skinned-character-kit.ts";
import { SOBAYA_CHARACTER } from "../app/characters/sobaya.ts";

// 実モデルと同じ名前・長さのクリップを持つ最小のリグで、待機・移動・スマッシュの切り替えを確かめる
function makeRig() {
  const root = new THREE.Object3D();
  const bone = new THREE.Object3D();
  bone.name = "Hips";
  root.add(bone);
  const clip = (name, duration) =>
    new THREE.AnimationClip(name, duration, [
      new THREE.NumberKeyframeTrack("Hips.position[x]", [0, duration], [0, duration]),
    ]);
  const { idle, move, smash } = SOBAYA_CHARACTER.clips;
  const clips = [clip(idle, 2), clip(move, 1.167), clip(smash.name, 1.6)];
  const mixer = new THREE.AnimationMixer(root);
  return { mixer, controller: createActionController(mixer, clips, SOBAYA_CHARACTER) };
}

const step = (controller, seconds, moving = false, dt = 1 / 60) => {
  for (let t = 0; t < seconds - 1e-9; t += dt) controller.update(dt, 0, moving);
};

const actionOf = (mixer, name) => mixer._actions.find((a) => a.getClip().name === name);

// 1フレーム（1/60秒）ぶんのずれは許す。早回しの倍率だけクリップ上の時間も進む
const { startAt, impactAt } = SOBAYA_CHARACTER.clips.smash;
const FRAME_TOLERANCE = ((impactAt - startAt) / 0.17) / 60 + 0.005;

test("smash reaches the clip's impact frame exactly when the gameplay impact happens", () => {
  const { mixer, controller } = makeRig();
  const { smash } = SOBAYA_CHARACTER.clips;
  step(controller, 0.5);
  controller.triggerSmash(false, 0.17);
  step(controller, 0.17);
  assert.ok(Math.abs(actionOf(mixer, smash.name).time - smash.impactAt) <= FRAME_TOLERANCE);
});

test("returns to idle after a smash and switches to the move clip while walking", () => {
  const { mixer, controller } = makeRig();
  const { idle, move, smash } = SOBAYA_CHARACTER.clips;
  controller.triggerSmash(true, 0.17);
  step(controller, 1.0);
  assert.equal(actionOf(mixer, smash.name).getEffectiveWeight(), 0);
  assert.equal(actionOf(mixer, idle).getEffectiveWeight(), 1);

  step(controller, 0.5, true);
  assert.equal(actionOf(mixer, move).getEffectiveWeight(), 1);
  assert.equal(actionOf(mixer, idle).getEffectiveWeight(), 0);
});

test("a second smash during the first restarts the swing", () => {
  const { mixer, controller } = makeRig();
  const { smash } = SOBAYA_CHARACTER.clips;
  controller.triggerSmash(false, 0.17);
  step(controller, 0.4);
  controller.triggerSmash(false, 0.17);
  step(controller, 0.17);
  assert.ok(Math.abs(actionOf(mixer, smash.name).time - smash.impactAt) <= FRAME_TOLERANCE);
  assert.equal(actionOf(mixer, smash.name).getEffectiveWeight(), 1);
});
