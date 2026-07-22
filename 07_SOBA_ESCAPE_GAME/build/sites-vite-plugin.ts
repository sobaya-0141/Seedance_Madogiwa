import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

// Add the metadata and Worker entrypoint required by Codex Sites after Vite
// has produced the browser bundle.
export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const distDirectory = resolve(root, "dist");
      const metadataDirectory = resolve(distDirectory, ".openai");
      const serverDirectory = resolve(distDirectory, "server");

      await rm(metadataDirectory, { recursive: true, force: true });
      await rm(serverDirectory, { recursive: true, force: true });
      await mkdir(metadataDirectory, { recursive: true });
      await mkdir(serverDirectory, { recursive: true });
      await cp(resolve(root, ".openai", "hosting.json"), resolve(metadataDirectory, "hosting.json"));
      await cp(resolve(root, "worker", "index.js"), resolve(serverDirectory, "index.js"));
    },
  };
}
