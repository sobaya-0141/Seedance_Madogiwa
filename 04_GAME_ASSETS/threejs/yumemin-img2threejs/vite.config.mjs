export default {
  root: new URL('./preview', import.meta.url).pathname,
  resolve: {
    alias: [],
  },
  server: {
    host: '127.0.0.1',
    port: 4178,
    strictPort: true,
    fs: {
      allow: [
        '/Users/kotahayashi/Workspace/Seedance_Madogiwa-voxel-game/04_GAME_ASSETS/threejs/yumemin-img2threejs',
        '/Users/kotahayashi/Workspace/Seedance_Madogiwa-voxel-game/04_GAME_ASSETS/threejs/yumemin-img2threejs/node_modules',
      ],
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
};
