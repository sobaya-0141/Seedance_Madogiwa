import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const serverDir = fileURLToPath(new URL("../dist/server/", import.meta.url));
const workerSource = fileURLToPath(new URL("../sites/worker.js", import.meta.url));
const workerDestination = fileURLToPath(new URL("../dist/server/index.js", import.meta.url));

await mkdir(serverDir, { recursive: true });
await copyFile(workerSource, workerDestination);

console.log(`Sites worker prepared from ${projectRoot}`);
