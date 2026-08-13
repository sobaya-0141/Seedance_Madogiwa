import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

async function loadCity() {
  const source = await readFile(
    new URL("../app/demolition/city.ts", import.meta.url),
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
    Array,
    Object,
  });
  return cjsModule.exports;
}

test("lays out a large destructible Azabu-Juban district outside the office", async () => {
  const city = await loadCity();
  assert.equal(city.AZABU_CITY_LOTS.length, 26);
  assert.equal(city.AZABU_STREET_PROPS.length, 32);
  assert.equal(city.AZABU_CITY_BREAKABLE_COUNT, 187);
  assert.equal(
    new Set(city.AZABU_CITY_LOTS.map((lot) => lot.id)).size,
    city.AZABU_CITY_LOTS.length,
  );
  for (const lot of city.AZABU_CITY_LOTS) {
    assert.ok(
      Math.abs(lot.x) > city.OFFICE_HALF_X
        || Math.abs(lot.z) > city.OFFICE_HALF_Z,
    );
  }
});

test("unlocks the district only through a real exterior wall breach", async () => {
  const city = await loadCity();
  assert.equal(city.isOfficeExteriorWall("north-wall-12"), true);
  assert.equal(city.isOfficeExteriorWall("side-wall-22"), true);
  assert.equal(city.isOfficeExteriorWall("north-glass-4"), false);
  assert.equal(city.isOfficeExteriorWall("server-wall-3"), false);
});

test("grows Sobaya smoothly from office scale to kaiju scale", async () => {
  const city = await loadCity();
  const scales = [0, 25, 75, 125, 187].map((destroyed) => (
    city.getGiantScale(destroyed, 187)
  ));
  assert.equal(scales[0], 1);
  assert.ok(scales.every((scale, index) => index === 0 || scale > scales[index - 1]));
  assert.ok(Math.abs(scales.at(-1) - 5.2) < 1e-10);
  assert.equal(city.getGiantStage(1), 0);
  assert.equal(city.getGiantStage(5.2), 4);
});
