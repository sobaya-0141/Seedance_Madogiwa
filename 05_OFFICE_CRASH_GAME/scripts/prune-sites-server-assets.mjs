import { access, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = path.join(projectRoot, "dist", "client");
const serverRoot = path.join(projectRoot, "dist", "server");

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function removeMirroredFiles(directory, relative = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const nextRelative = path.join(relative, entry.name);
    if (nextRelative === ".vite" || nextRelative.startsWith(`.vite${path.sep}`)) continue;
    const clientPath = path.join(clientRoot, nextRelative);
    const serverPath = path.join(serverRoot, nextRelative);
    if (entry.isDirectory()) {
      await removeMirroredFiles(serverPath, nextRelative);
      const remaining = await readdir(serverPath);
      if (remaining.length === 0) await rm(serverPath, { recursive: true });
    } else if (await exists(clientPath)) {
      await rm(serverPath);
    }
  }
}

if (await exists(clientRoot) && await exists(serverRoot)) {
  await removeMirroredFiles(serverRoot);
}
