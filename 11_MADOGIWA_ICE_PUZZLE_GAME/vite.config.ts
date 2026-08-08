import path from "node:path";
import { defineConfig } from "vite";

const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  base: "./",
  server: {
    port: 5195,
    strictPort: true,
    fs: {
      allow: [repoRoot],
    },
  },
});
