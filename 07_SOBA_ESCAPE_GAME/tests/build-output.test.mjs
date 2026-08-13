import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

test("production build contains the worker and required game assets", async () => {
  const required = [
    "dist/client/index.html",
    "dist/server/index.js",
    "dist/client/assets/models/sobaya.glb",
    "dist/client/assets/models/okayaman.glb",
    "dist/client/assets/og.png",
  ];
  await Promise.all(required.map((path) => access(path)));
  const sobaya = await stat("dist/client/assets/models/sobaya.glb");
  const index = await readFile("dist/client/index.html", "utf8");
  const worker = await readFile("dist/server/index.js", "utf8");
  assert.ok(sobaya.size > 100_000);
  assert.match(index, /name="twitter:card" content="summary_large_image"/);
  assert.match(
    index,
    /https:\/\/sobaya-teiji-dash-dx\.geukfyger\.chatgpt\.site\/assets\/og\.png/,
  );
  assert.match(worker, /env\?\.ASSETS/);
});
