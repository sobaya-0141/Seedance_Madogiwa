import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  // Keep this entry outside Next/Vinext's reserved `pages/` directory so the
  // static GitHub Pages bundle is never mistaken for a server-rendered route.
  root: path.resolve(__dirname, "github-pages"),
  publicDir: path.resolve(__dirname, "public"),
  base: "./",
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "dist-pages"),
    emptyOutDir: true,
  },
});
