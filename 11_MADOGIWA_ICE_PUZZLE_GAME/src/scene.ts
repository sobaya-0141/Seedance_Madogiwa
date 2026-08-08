import * as THREE from "three";
import { makeCharacterDefinition } from "./characters.js";
import { FrozenOfficeAssetKit } from "./frozen-office-assets.js";
import { isOuterWall, officeObstacleKind } from "./office-layout.js";
import type {
  CharacterId,
  CollectibleDefinition,
  Direction,
  LevelDefinition,
  Point,
  PuzzleState,
} from "./types.js";
import {
  loadVoxelCharacter,
  type VoxelActionController,
} from "./voxel-character-kit.js";

const CELL = 1.35;
const FLOOR_Y = 0.12;
const MAX_VISIBLE_COLUMNS = 11.2;
const MAX_VISIBLE_ROWS = 10.2;
const CAMERA_PLANE_PROJECTION = 0.87;

type ActiveSlide = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  duration: number;
  elapsed: number;
  resolve: () => void;
};

function worldPosition(level: LevelDefinition, point: Point): THREE.Vector3 {
  const width = level.grid[0].length;
  const height = level.grid.length;
  return new THREE.Vector3(
    (point.x - (width - 1) / 2) * CELL,
    FLOOR_Y,
    (point.y - (height - 1) / 2) * CELL,
  );
}

function directionYaw(direction: Direction): number {
  switch (direction) {
    case "up": return Math.PI;
    case "down": return 0;
    case "left": return -Math.PI / 2;
    case "right": return Math.PI / 2;
  }
}

export class PuzzleScene {
  private readonly scene = new THREE.Scene();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  private readonly boardRoot = new THREE.Group();
  private readonly playerRoot = new THREE.Group();
  private readonly collectibleGroups = new Map<string, THREE.Group>();
  private readonly actionControllers: VoxelActionController[] = [];
  private readonly resizeObserver: ResizeObserver;
  private readonly officeAssets = new FrozenOfficeAssetKit(CELL);
  private readonly exitMaterial = new THREE.MeshStandardMaterial({
    color: "#ef6a67",
    emissive: "#651616",
    emissiveIntensity: 0.65,
    roughness: 0.52,
  });
  private readonly exitLight = new THREE.PointLight("#ff5147", 12, 7, 2);
  private activeSlide?: ActiveSlide;
  private raf = 0;
  private elapsed = 0;
  private lastFrameTime = performance.now();
  private disposed = false;
  private cameraVerticalSize = CELL * 8;
  private readonly cameraFocus = new THREE.Vector3();
  private cameraReady = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly level: LevelDefinition,
    state: PuzzleState,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.setAttribute("aria-label", "氷上パズルの3D盤面");
    this.host.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color("#06131f");
    this.scene.fog = new THREE.Fog("#06131f", 24, 54);
    this.scene.add(this.boardRoot, this.playerRoot);
    this.buildLighting();
    this.buildBoard();
    this.loadPlayer();
    this.setState(state);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.loop();
  }

  private buildLighting(): void {
    const hemi = new THREE.HemisphereLight("#ecfcff", "#10243a", 2.45);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight("#effdff", 3.8);
    key.position.set(-7, 18, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -20;
    key.shadow.camera.right = 20;
    key.shadow.camera.top = 20;
    key.shadow.camera.bottom = -20;
    this.scene.add(key);
    const iceGlow = new THREE.PointLight("#55cfff", 18, 32, 2);
    iceGlow.position.set(0, 8, 2);
    this.scene.add(iceGlow);
    const emergencyGlow = new THREE.PointLight("#f4a14b", 7, 22, 2);
    emergencyGlow.position.set(-8, 5, -6);
    this.scene.add(emergencyGlow);
  }

  private buildBoard(): void {
    const columns = this.level.grid[0].length;
    const rows = this.level.grid.length;
    this.level.grid.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const at = worldPosition(this.level, { x, y });
        if (cell === "#") {
          if (isOuterWall(this.level, x, y)) {
            const wall = this.officeAssets.createOuterWallCell(x, y, columns, rows);
            wall.position.copy(at);
            this.boardRoot.add(wall);
          } else {
            const floor = this.officeAssets.createFrozenFloorTile(x, y);
            floor.position.copy(at);
            const kind = officeObstacleKind(this.level.number, x, y);
            const obstacle = this.officeAssets.createOfficeObstacle(
              kind,
              x * 101 + y * 43 + this.level.number * 17,
            );
            obstacle.position.copy(at);
            this.boardRoot.add(floor, obstacle);
          }
          return;
        }
        const floor = this.officeAssets.createFrozenFloorTile(x, y);
        floor.position.copy(at);
        this.boardRoot.add(floor);
      });
    });

    this.buildStartMat();
    this.buildExit();
    this.level.collectibles.forEach((item) => this.buildCollectible(item));
    this.level.helpers.forEach((helper) => this.loadHelper(helper.characterId, helper.at));
    this.buildOfficeBackdrop();
  }

  private buildStartMat(): void {
    const at = worldPosition(this.level, this.level.start);
    const mat = new THREE.Mesh(
      new THREE.BoxGeometry(CELL * 0.78, 0.08, CELL * 0.78),
      new THREE.MeshStandardMaterial({
        color: "#b98345",
        roughness: 0.92,
      }),
    );
    mat.position.set(at.x, 0.25, at.z);
    mat.receiveShadow = true;
    this.boardRoot.add(mat);
  }

  private buildExit(): void {
    const at = worldPosition(this.level, this.level.exit);
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(CELL * 0.82, 0.1, CELL * 0.82),
      this.exitMaterial,
    );
    pad.position.set(at.x, 0.28, at.z);
    this.boardRoot.add(pad);

    const postMaterial = new THREE.MeshStandardMaterial({
      color: "#392d31",
      roughness: 0.78,
    });
    const postGeometry = new THREE.BoxGeometry(0.12, 1.58, 0.12);
    [-0.45, 0.45].forEach((offset) => {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(at.x + offset, 0.92, at.z);
      post.castShadow = true;
      this.boardRoot.add(post);
    });
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.12, 0.12),
      postMaterial,
    );
    lintel.position.set(at.x, 1.7, at.z);
    lintel.castShadow = true;
    this.boardRoot.add(lintel);

    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 10),
      new THREE.MeshStandardMaterial({
        color: "#ff4e42",
        emissive: "#d21e16",
        emissiveIntensity: 2.2,
        roughness: 0.4,
      }),
    );
    lantern.scale.y = 1.2;
    lantern.position.set(at.x, 1.48, at.z);
    this.exitLight.position.set(at.x, 1.55, at.z);
    this.boardRoot.add(lantern, this.exitLight);
  }

  private buildCollectible(item: CollectibleDefinition): void {
    const group = item.kind === "document"
      ? this.makeDocumentStack()
      : this.makeBeerCase();
    const at = worldPosition(this.level, item.at);
    group.position.set(at.x, 0.28, at.z);
    group.userData.baseY = group.position.y;
    this.collectibleGroups.set(item.id, group);
    this.boardRoot.add(group);
  }

  private makeDocumentStack(): THREE.Group {
    const group = new THREE.Group();
    const blue = new THREE.MeshStandardMaterial({
      color: "#347ed5",
      roughness: 0.58,
    });
    const paper = new THREE.MeshStandardMaterial({
      color: "#f6f4e8",
      roughness: 0.9,
    });
    for (let index = 0; index < 3; index += 1) {
      const folder = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.5), blue);
      folder.position.y = index * 0.1;
      folder.rotation.y = (index - 1) * 0.05;
      folder.castShadow = true;
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.63, 0.055, 0.44), paper);
      pages.position.set(0.035, index * 0.1 + 0.05, 0);
      group.add(folder, pages);
    }
    return group;
  }

  private makeBeerCase(): THREE.Group {
    const group = new THREE.Group();
    const crateMaterial = new THREE.MeshStandardMaterial({
      color: "#8a532d",
      roughness: 0.86,
    });
    const bottleMaterial = new THREE.MeshStandardMaterial({
      color: "#6d3516",
      roughness: 0.44,
      metalness: 0.04,
    });
    const capMaterial = new THREE.MeshStandardMaterial({
      color: "#e6b846",
      metalness: 0.45,
      roughness: 0.34,
    });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.61), crateMaterial);
    crate.position.y = 0.2;
    crate.castShadow = true;
    group.add(crate);
    [-0.22, 0, 0.22].forEach((x) => {
      [-0.14, 0.14].forEach((z) => {
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.068, 0.095, 0.42, 10),
          bottleMaterial,
        );
        bottle.position.set(x, 0.5, z);
        bottle.castShadow = true;
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.074, 0.074, 0.04, 10),
          capMaterial,
        );
        cap.position.set(x, 0.72, z);
        group.add(bottle, cap);
      });
    });
    return group;
  }

  private buildOfficeBackdrop(): void {
    const width = this.level.grid[0].length * CELL;
    const height = this.level.grid.length * CELL;
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(width + 9, height + 9),
      new THREE.MeshStandardMaterial({
        color: "#142238",
        roughness: 0.96,
      }),
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = 0;
    carpet.receiveShadow = true;
    this.boardRoot.add(carpet);

    const skyline = this.makeSkylineTexture();
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(width + 6, 8),
      new THREE.MeshBasicMaterial({ map: skyline }),
    );
    backWall.position.set(0, 4.3, -height / 2 - 2);
    this.boardRoot.add(backWall);
  }

  private makeSkylineTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#071329");
      gradient.addColorStop(0.55, "#153052");
      gradient.addColorStop(1, "#e6744f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < 28; index += 1) {
        const buildingWidth = 24 + (index % 4) * 10;
        const buildingHeight = 80 + ((index * 43) % 170);
        const x = index * 40 - 12;
        ctx.fillStyle = index % 2 === 0 ? "#0c1830" : "#101e38";
        ctx.fillRect(x, canvas.height - buildingHeight, buildingWidth, buildingHeight);
        ctx.fillStyle = "#ffd879";
        for (let yy = canvas.height - buildingHeight + 14; yy < canvas.height - 12; yy += 18) {
          for (let xx = x + 7; xx < x + buildingWidth - 4; xx += 12) {
            if ((xx + yy + index) % 3 !== 0) ctx.fillRect(xx, yy, 4, 5);
          }
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private loadPlayer(): void {
    this.addPlaceholder(this.playerRoot, "#a56ef4", 0.5);
    loadVoxelCharacter({
      definition: makeCharacterDefinition("yametaro"),
      parent: this.playerRoot,
      onReady: (character) => {
        this.removePlaceholders(this.playerRoot);
        if (character.actions) this.actionControllers.push(character.actions);
      },
      onError: (error) => console.error("Failed to load Yametaro", error),
    });
  }

  private loadHelper(characterId: CharacterId, at: Point): void {
    const root = new THREE.Group();
    const world = worldPosition(this.level, at);
    root.position.set(world.x, FLOOR_Y, world.z);
    root.rotation.y = Math.PI;
    this.boardRoot.add(root);
    this.addPlaceholder(root, "#6ae1ff", 0.43);
    loadVoxelCharacter({
      definition: makeCharacterDefinition(characterId),
      parent: root,
      onReady: (character) => {
        this.removePlaceholders(root);
        if (character.actions) this.actionControllers.push(character.actions);
      },
      onError: (error) => console.error(`Failed to load ${characterId}`, error),
    });
  }

  private addPlaceholder(parent: THREE.Group, color: string, size: number): void {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size * 1.35, size),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        emissive: color,
        emissiveIntensity: 0.12,
      }),
    );
    mesh.name = "loading-placeholder";
    mesh.position.y = size * 0.68;
    mesh.castShadow = true;
    parent.add(mesh);
  }

  private removePlaceholders(parent: THREE.Group): void {
    parent.children
      .filter((child) => child.name === "loading-placeholder")
      .forEach((child) => parent.remove(child));
  }

  setState(state: PuzzleState): void {
    const at = worldPosition(this.level, state.position);
    this.playerRoot.position.set(at.x, FLOOR_Y, at.z);
    const collected = new Set(state.collected);
    for (const [id, group] of this.collectibleGroups) {
      group.visible = !collected.has(id);
      group.scale.setScalar(1);
    }
    this.setExitUnlocked(collected.size === this.level.collectibles.length);
    this.updateCamera(0, true);
  }

  setExitUnlocked(unlocked: boolean): void {
    this.exitMaterial.color.set(unlocked ? "#58e58b" : "#ef6a67");
    this.exitMaterial.emissive.set(unlocked ? "#0b7136" : "#651616");
    this.exitLight.color.set(unlocked ? "#47ff8c" : "#ff5147");
    this.exitLight.intensity = unlocked ? 24 : 12;
  }

  collect(id: string): void {
    const group = this.collectibleGroups.get(id);
    if (!group) return;
    group.visible = false;
  }

  slide(path: readonly Point[], direction: Direction): Promise<void> {
    if (path.length === 0) return Promise.resolve();
    this.playerRoot.rotation.y = directionYaw(direction);
    const from = this.playerRoot.position.clone();
    const to = worldPosition(this.level, path[path.length - 1]);
    const duration = Math.min(1.25, Math.max(0.24, path.length * 0.09));
    return new Promise((resolve) => {
      this.activeSlide = { from, to, duration, elapsed: 0, resolve };
    });
  }

  bump(direction: Direction): Promise<void> {
    const delta = {
      up: new THREE.Vector3(0, 0, -0.12),
      down: new THREE.Vector3(0, 0, 0.12),
      left: new THREE.Vector3(-0.12, 0, 0),
      right: new THREE.Vector3(0.12, 0, 0),
    }[direction];
    this.playerRoot.rotation.y = directionYaw(direction);
    const from = this.playerRoot.position.clone();
    return new Promise((resolve) => {
      const to = from.clone().add(delta);
      this.activeSlide = { from, to, duration: 0.1, elapsed: 0, resolve: () => {
        this.playerRoot.position.copy(from);
        resolve();
      } };
    });
  }

  private resize(): void {
    const width = Math.max(this.host.clientWidth, 1);
    const height = Math.max(this.host.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const visibleRows = Math.min(
      MAX_VISIBLE_ROWS,
      Math.max(7.2, MAX_VISIBLE_COLUMNS / aspect),
    );
    this.cameraVerticalSize = visibleRows * CELL;
    this.camera.left = -this.cameraVerticalSize * aspect / 2;
    this.camera.right = this.cameraVerticalSize * aspect / 2;
    this.camera.top = this.cameraVerticalSize / 2;
    this.camera.bottom = -this.cameraVerticalSize / 2;
    this.camera.near = 0.1;
    this.camera.far = 200;
    this.camera.updateProjectionMatrix();
    this.updateCamera(0, true);
  }

  private loop = (timestamp = performance.now()): void => {
    if (this.disposed) return;
    const dt = Math.min(Math.max((timestamp - this.lastFrameTime) / 1000, 0), 0.05);
    this.lastFrameTime = timestamp;
    this.elapsed += dt;
    this.actionControllers.forEach((controller) => controller.update(dt, this.elapsed, false));
    this.updateSlide(dt);
    this.updateCamera(dt);
    this.updateCollectibles();
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  private updateSlide(dt: number): void {
    const slide = this.activeSlide;
    if (!slide) return;
    slide.elapsed += dt;
    const raw = Math.min(slide.elapsed / slide.duration, 1);
    const eased = raw < 0.5
      ? 2 * raw * raw
      : 1 - ((-2 * raw + 2) ** 2) / 2;
    this.playerRoot.position.lerpVectors(slide.from, slide.to, eased);
    this.playerRoot.position.y = FLOOR_Y + Math.sin(raw * Math.PI) * 0.12;
    if (raw >= 1) {
      this.playerRoot.position.copy(slide.to);
      this.activeSlide = undefined;
      slide.resolve();
    }
  }

  private updateCollectibles(): void {
    for (const [id, group] of this.collectibleGroups) {
      if (!group.visible) continue;
      const phase = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.02;
      group.position.y = Number(group.userData.baseY) + Math.sin(this.elapsed * 2.8 + phase) * 0.08;
      group.rotation.y = Math.sin(this.elapsed * 0.7 + phase) * 0.08;
    }
  }

  private updateCamera(dt: number, immediate = false): void {
    const width = this.level.grid[0].length * CELL;
    const height = this.level.grid.length * CELL;
    const aspect = Math.max(this.host.clientWidth / Math.max(this.host.clientHeight, 1), 0.1);
    const halfViewX = this.cameraVerticalSize * aspect / 2;
    const halfViewZ = this.cameraVerticalSize / (2 * CAMERA_PLANE_PROJECTION);
    const desired = this.playerRoot.position.clone();
    desired.y = 0;
    desired.x = this.clampFocus(desired.x, width, halfViewX);
    desired.z = this.clampFocus(desired.z, height, halfViewZ);

    if (immediate || !this.cameraReady) {
      this.cameraFocus.copy(desired);
      this.cameraReady = true;
    } else {
      const smoothing = 1 - Math.exp(-dt * 7.5);
      this.cameraFocus.lerp(desired, smoothing);
    }

    const cameraHeight = CELL * 12.5;
    const cameraDepth = CELL * 6.7;
    this.camera.position.set(
      this.cameraFocus.x,
      cameraHeight,
      this.cameraFocus.z + cameraDepth,
    );
    this.camera.lookAt(this.cameraFocus.x, 0.2, this.cameraFocus.z);
  }

  private clampFocus(value: number, boardSize: number, halfView: number): number {
    const halfBoard = boardSize / 2;
    if (halfView >= halfBoard) return 0;
    return THREE.MathUtils.clamp(value, -halfBoard + halfView, halfBoard - halfView);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.activeSlide?.resolve();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.officeAssets.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
