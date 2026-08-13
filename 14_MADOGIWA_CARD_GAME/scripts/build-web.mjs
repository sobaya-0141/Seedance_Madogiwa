import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");

const result = spawnSync(
  "flutter",
  ["build", "web", "--release", "--base-href", "/"],
  { cwd: projectDir, stdio: "inherit", env: process.env },
);

if (result.status !== 0) {
  throw new Error("flutter build web failed");
}

// The arcade copies this build below /games/madogiwa-grid/. A relative base
// keeps the same artifact runnable both there and from a standalone server.
const indexPath = path.join(projectDir, "build", "web", "index.html");
const index = await readFile(indexPath, "utf8");
await writeFile(
  indexPath,
  index.replace('<base href="/">', '<base href="./">'),
  "utf8",
);
