import path from "node:path";
import { defineConfig } from "vite";

const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 5205,
    strictPort: true,
    fs: {
      allow: [repoRoot],
    },
  },
});
