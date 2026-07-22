import { defineConfig } from "vite";
import path from "node:path";
import { sites } from "./build/sites-vite-plugin";

// The GLB models live in the shared 04_GAME_ASSETS/voxel/models directory and
// are referenced from public/models via relative symlinks (per repo convention).
// Allow Vite's dev server to read files from the repo root so those symlinked
// assets resolve during development.
const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  base: "./",
  plugins: [sites()],
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
});
