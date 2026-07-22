import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const portalDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(portalDir, "..");
const outputRoot = path.join(repoRoot, "dist-pages");
const manifest = JSON.parse(await readFile(path.join(portalDir, "games.json"), "utf8"));
const portalFiles = ["index.html", "styles.css", "app.js", "games.json", "og.png"];

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed in ${cwd}`);
  }
}

const ids = new Set();
for (const game of manifest.games) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id) || ids.has(game.id)) {
    throw new Error(`Invalid or duplicate game id: ${game.id}`);
  }
  ids.add(game.id);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const file of portalFiles) {
  await cp(path.join(portalDir, file), path.join(outputRoot, file));
}

for (const game of manifest.games) {
  const sourceDir = path.resolve(repoRoot, game.sourceDir);
  const distDir = path.resolve(sourceDir, game.distDir);
  const destination = path.resolve(outputRoot, game.outputDir);

  run("npm", ["ci"], sourceDir);
  run("npm", ["run", game.buildScript], sourceDir);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(distDir, destination, { recursive: true });
  await rm(path.join(destination, ".openai"), { recursive: true, force: true });
  await rm(path.join(destination, "server"), { recursive: true, force: true });
}

console.log(`GitHub Pages artifact ready: ${outputRoot}`);
