import RAPIER from "@dimforge/rapier3d-compat";
import assert from "node:assert/strict";
import test from "node:test";
import { MATERIALS, STAGES } from "../src/rules.js";

test("4棟すべてが奥行き2層以上の独立剛体で構成される", () => {
  const counts = STAGES.map((stage) => stage.build().length);
  assert.deepEqual(counts.map((count) => count > 75), [true, true, true, true]);
  assert.ok(counts[3] > counts[0], "最終棟は入門棟より多くの剛体を持つ");

  for (const stage of STAGES) {
    const blocks = stage.build();
    const ids = new Set(blocks.map((block) => block.id));
    const zLayers = new Set(blocks.map((block) => block.position[2].toFixed(2)));
    assert.equal(ids.size, blocks.length, `${stage.name}の剛体IDは重複しない`);
    assert.ok(zLayers.size >= 2, `${stage.name}は前後方向の厚みを持つ`);
    assert.ok(blocks.some((block) => block.material === "steel"), `${stage.name}に重量級部材がある`);
    assert.ok(blocks.every((block) => block.size.every((value) => value > 0)));
  }
});

test("Rapierの実衝突で会議室モックアップの部材が移動・回転する", async () => {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -12.8, z: 0 });
  world.integrationParameters.dt = 1 / 60;

  const ground = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.12, 0),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(19, 0.12, 13).setFriction(0.9),
    ground,
  );

  const stage = STAGES[0];
  const bodies = stage.build().map((block) => {
    const material = MATERIALS[block.material];
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(...block.position)
        .setCanSleep(true),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        block.size[0] / 2,
        block.size[1] / 2,
        block.size[2] / 2,
      )
        .setDensity(material.density)
        .setFriction(material.friction)
        .setRestitution(material.restitution),
      body,
    );
    body.sleep();
    return { block, body };
  });

  const origin = { x: -5.45, y: 2.55, z: 5.25 };
  const target = { x: -3.5, y: 0.65, z: 0.64 };
  const duration = 1.08;
  const projectile = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(origin.x, origin.y, origin.z)
      .setCcdEnabled(true),
  );
  world.createCollider(
    RAPIER.ColliderDesc.ball(0.31)
      .setDensity(6.4)
      .setRestitution(0.2),
    projectile,
  );
  projectile.setLinvel(
    {
      x: (target.x - origin.x) / duration,
      y: (target.y - origin.y + 0.5 * 12.8 * duration * duration) / duration,
      z: (target.z - origin.z) / duration,
    },
    true,
  );

  let minimumProjectileZ = origin.z;
  for (let frame = 0; frame < 240; frame += 1) {
    world.step();
    minimumProjectileZ = Math.min(minimumProjectileZ, projectile.translation().z);
  }

  const moved = bodies.filter(({ block, body }) => {
    const position = body.translation();
    const dx = position.x - block.position[0];
    const dy = position.y - block.position[1];
    const dz = position.z - block.position[2];
    return Math.hypot(dx, dy, dz) > 0.2;
  });
  assert.ok(moved.length >= 1, "ジョッキの剛体衝突で少なくとも1部材が移動する");
  assert.ok(minimumProjectileZ < origin.z - 2, "ジョッキが建物方向へ飛翔する");
  world.free();
});
