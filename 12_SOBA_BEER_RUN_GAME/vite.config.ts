import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 5200,
    strictPort: true,
  },
});
