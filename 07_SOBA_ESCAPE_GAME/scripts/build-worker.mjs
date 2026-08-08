import { copyFile, mkdir, rename } from "node:fs/promises";

await mkdir(new URL("../dist/server/", import.meta.url), { recursive: true });
await mkdir(new URL("../dist/client/assets/", import.meta.url), { recursive: true });
await rename(
  new URL("../dist/client/models/", import.meta.url),
  new URL("../dist/client/assets/models/", import.meta.url),
);
await rename(
  new URL("../dist/client/og.png", import.meta.url),
  new URL("../dist/client/assets/og.png", import.meta.url),
);
await copyFile(
  new URL("../worker/index.js", import.meta.url),
  new URL("../dist/server/index.js", import.meta.url),
);
