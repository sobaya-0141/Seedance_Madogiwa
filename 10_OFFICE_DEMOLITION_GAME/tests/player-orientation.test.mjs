import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

async function loadOrientation() {
  const source = await readFile(
    new URL("../app/demolition/orientation.ts", import.meta.url),
    "utf8",
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const cjsModule = { exports: {} };
  vm.runInNewContext(transpiled, {
    module: cjsModule,
    exports: cjsModule.exports,
    Math,
  });
  return cjsModule.exports;
}

test("keeps Sobaya's local -Z front aligned with every movement direction", async () => {
  const orientation = await loadOrientation();
  const directions = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];

  for (const [moveX, moveZ] of directions) {
    const length = Math.hypot(moveX, moveZ);
    const yaw = orientation.getPlayerFacingYaw(moveX, moveZ);
    const forward = orientation.getPlayerForward(yaw);
    assert.ok(Math.abs(forward.x - moveX / length) < 1e-10);
    assert.ok(Math.abs(forward.z - moveZ / length) < 1e-10);
  }
});

test("faces toward negative Z when walking forward from spawn", async () => {
  const orientation = await loadOrientation();
  const yaw = orientation.getPlayerFacingYaw(0, -1);
  const forward = orientation.getPlayerForward(yaw);
  assert.ok(Math.abs(yaw) < 1e-10);
  assert.ok(Math.abs(forward.x) < 1e-10);
  assert.equal(forward.z, -1);
});

test("points the cleanup radar relative to Sobaya's facing", async () => {
  const orientation = await loadOrientation();
  assert.equal(orientation.getRadarArrow(0, -10, 0), "↑");
  assert.equal(orientation.getRadarArrow(10, 0, 0), "→");
  assert.equal(orientation.getRadarArrow(-10, 0, 0), "←");
  assert.equal(orientation.getRadarArrow(0, 10, 0), "↓");
});
