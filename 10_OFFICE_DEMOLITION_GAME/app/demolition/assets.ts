import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type BoxOptions = {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: number;
  emissiveIntensity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  rounded?: boolean;
};

const PALETTE = {
  ink: 0x17222d,
  black: 0x080b0f,
  white: 0xf8faf7,
  warmWhite: 0xf1eee7,
  paleWood: 0xdba66a,
  woodEdge: 0xa96d38,
  officeBlue: 0x2566b5,
  blueDark: 0x153d73,
  cyanGlass: 0x78d9ed,
  mint: 0x50e1c2,
  coral: 0xff6a4d,
  amber: 0xd98212,
  amberLight: 0xffc642,
  leaf: 0x62a656,
  leafDark: 0x357640,
  metal: 0x9aa8b2,
  metalDark: 0x4b5b68,
  plaster: 0xe8e5df,
  concrete: 0x9b9d9b,
  concreteDark: 0x6f7475,
  steel: 0x313b43,
  steelEdge: 0x18232c,
  carpet: 0x3e5871,
} as const;

export class VoxelAssetFactory {
  readonly unitBox = new THREE.BoxGeometry(1, 1, 1);
  readonly roundedBox = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();

  material(color: number, options: BoxOptions = {}) {
    const key = [
      color,
      options.roughness ?? 0.78,
      options.metalness ?? 0,
      options.transparent ? 1 : 0,
      options.opacity ?? 1,
      options.emissive ?? 0,
      options.emissiveIntensity ?? 0,
    ].join(":");
    const existing = this.materials.get(key);
    if (existing) return existing;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.78,
      metalness: options.metalness ?? 0,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      depthWrite: !(options.transparent && (options.opacity ?? 1) < 0.98),
    });
    this.materials.set(key, material);
    return material;
  }

  box(
    size: readonly [number, number, number],
    color: number,
    position: readonly [number, number, number] = [0, 0, 0],
    options: BoxOptions = {},
  ) {
    const mesh = new THREE.Mesh(
      options.rounded === false ? this.unitBox : this.roundedBox,
      this.material(color, options),
    );
    mesh.scale.set(size[0], size[1], size[2]);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = options.castShadow ?? false;
    mesh.receiveShadow = options.receiveShadow ?? true;
    return mesh;
  }

  cylinder(
    radius: number,
    height: number,
    color: number,
    position: readonly [number, number, number] = [0, 0, 0],
    radialSegments = 10,
    options: BoxOptions = {},
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, radialSegments),
      this.material(color, options),
    );
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = options.castShadow ?? false;
    mesh.receiveShadow = options.receiveShadow ?? true;
    return mesh;
  }

  makeDesk(variant = 0) {
    const group = new THREE.Group();
    const topColor = variant % 3 === 0 ? PALETTE.paleWood : variant % 3 === 1 ? 0xc98e52 : 0xe2b77f;
    group.add(this.box([2.35, 0.16, 1.05], topColor, [0, 1.08, 0], { castShadow: true }));
    for (const x of [-0.95, 0.95]) {
      for (const z of [-0.37, 0.37]) {
        group.add(this.box([0.1, 1.02, 0.1], PALETTE.metalDark, [x, 0.53, z], {
          metalness: 0.55,
          roughness: 0.38,
        }));
      }
    }
    const monitor = this.box([0.72, 0.48, 0.08], PALETTE.ink, [0, 1.48, -0.1], {
      castShadow: true,
      roughness: 0.5,
    });
    monitor.rotation.x = -0.04;
    group.add(monitor);
    group.add(this.box([0.09, 0.28, 0.08], PALETTE.metalDark, [0, 1.22, -0.1]));
    group.add(this.box([0.58, 0.05, 0.18], PALETTE.metalDark, [0, 1.09, -0.1]));
    group.add(this.box([0.75, 0.045, 0.28], 0x222a33, [0.18, 1.18, 0.25]));
    group.add(this.box([0.14, 0.07, 0.2], 0x232b31, [-0.64, 1.18, 0.25]));
    return group;
  }

  makeChair(variant = 0) {
    const group = new THREE.Group();
    const color = variant % 2 === 0 ? PALETTE.officeBlue : 0x2f80c9;
    group.add(this.box([0.78, 0.17, 0.73], color, [0, 0.75, 0], { castShadow: true }));
    const back = this.box([0.78, 0.9, 0.14], color, [0, 1.25, 0.3], { castShadow: true });
    back.rotation.x = -0.08;
    group.add(back);
    group.add(this.box([0.12, 0.65, 0.12], PALETTE.metalDark, [0, 0.36, 0], {
      metalness: 0.5,
      roughness: 0.34,
    }));
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      const leg = this.box([0.08, 0.07, 0.54], PALETTE.ink, [Math.sin(angle) * 0.19, 0.12, Math.cos(angle) * 0.19], {
        rounded: false,
      });
      leg.rotation.y = angle;
      group.add(leg);
      group.add(this.cylinder(0.07, 0.08, PALETTE.black, [Math.sin(angle) * 0.45, 0.08, Math.cos(angle) * 0.45], 8));
    }
    return group;
  }

  makePlant(variant = 0) {
    const group = new THREE.Group();
    group.add(this.box([0.62, 0.54, 0.62], variant % 2 === 0 ? 0xe7e7e2 : 0x55727b, [0, 0.27, 0], {
      castShadow: true,
    }));
    group.add(this.box([0.5, 0.1, 0.5], 0x49382a, [0, 0.52, 0]));
    const leafMaterial = this.material(PALETTE.leaf, { roughness: 0.78 });
    for (let index = 0; index < 8; index += 1) {
      const leaf = new THREE.Mesh(this.roundedBox, index % 3 === 0
        ? this.material(PALETTE.leafDark)
        : leafMaterial);
      const angle = (index / 8) * Math.PI * 2;
      leaf.scale.set(0.18, 0.75 + (index % 2) * 0.18, 0.16);
      leaf.position.set(Math.sin(angle) * 0.25, 0.92 + (index % 2) * 0.13, Math.cos(angle) * 0.25);
      leaf.rotation.z = Math.sin(angle) * 0.35;
      leaf.rotation.x = Math.cos(angle) * 0.35;
      group.add(leaf);
    }
    return group;
  }

  makeCartons(variant = 0) {
    const group = new THREE.Group();
    const count = 2 + (variant % 3);
    for (let index = 0; index < count; index += 1) {
      const size = 0.66 + (index % 2) * 0.17;
      const box = this.box(
        [size, 0.52 + (index % 2) * 0.18, size * 0.82],
        index % 2 === 0 ? 0xc98e50 : 0xe1ae6d,
        [
          (index % 2) * 0.48 - 0.22,
          0.29 + Math.floor(index / 2) * 0.58,
          Math.floor(index / 2) * 0.18 - 0.08,
        ],
        { castShadow: true },
      );
      box.rotation.y = (index % 2 ? -1 : 1) * 0.08;
      group.add(box);
      group.add(this.box([size * 0.12, 0.53, size * 0.84], 0xa96f38, [
        (index % 2) * 0.48 - 0.22,
        0.3 + Math.floor(index / 2) * 0.58,
        Math.floor(index / 2) * 0.18 - 0.08,
      ], { rounded: false }));
    }
    return group;
  }

  makeLocker(variant = 0) {
    const group = new THREE.Group();
    const color = variant % 2 === 0 ? 0x718391 : 0x526878;
    group.add(this.box([1.12, 2.2, 0.62], color, [0, 1.1, 0], {
      metalness: 0.42,
      roughness: 0.45,
      castShadow: true,
    }));
    for (const x of [-0.29, 0.29]) {
      group.add(this.box([0.03, 1.95, 0.035], PALETTE.metalDark, [x, 1.12, 0.315], {
        rounded: false,
      }));
      for (let row = 0; row < 4; row += 1) {
        group.add(this.box([0.28, 0.025, 0.025], PALETTE.ink, [x, 1.65 - row * 0.12, 0.35], {
          rounded: false,
        }));
      }
      group.add(this.box([0.055, 0.17, 0.035], PALETTE.ink, [x + 0.18, 1.0, 0.35]));
    }
    return group;
  }

  makeCopier(variant = 0) {
    const group = new THREE.Group();
    group.add(this.box([1.18, 1.26, 0.88], variant % 2 === 0 ? 0xe8eceb : 0xb9c5ca, [0, 0.64, 0], {
      castShadow: true,
    }));
    group.add(this.box([1.08, 0.34, 0.9], PALETTE.ink, [0, 1.34, 0.03], {
      roughness: 0.46,
    }));
    group.add(this.box([0.72, 0.08, 0.58], 0x6b7f88, [0, 1.51, -0.05], {
      metalness: 0.2,
      roughness: 0.45,
    }));
    group.add(this.box([0.3, 0.05, 0.18], PALETTE.cyanGlass, [0.31, 1.55, 0.08], {
      emissive: PALETTE.cyanGlass,
      emissiveIntensity: 0.5,
    }));
    for (const y of [0.38, 0.68, 0.98]) {
      group.add(this.box([0.82, 0.07, 0.035], 0x788890, [0, y, 0.455], { rounded: false }));
    }
    return group;
  }

  makeSofa(variant = 0) {
    const group = new THREE.Group();
    const color = variant % 2 === 0 ? 0x2f7488 : 0x5077a8;
    group.add(this.box([2.65, 0.55, 1.0], color, [0, 0.46, 0], { castShadow: true }));
    group.add(this.box([2.7, 1.02, 0.32], color, [0, 0.98, 0.43], { castShadow: true }));
    for (const x of [-1.23, 1.23]) {
      group.add(this.box([0.26, 0.72, 1.05], color, [x, 0.58, 0], { castShadow: true }));
    }
    group.add(this.box([0.82, 0.28, 0.82], 0xffc052, [-0.58, 0.83, 0.05], { castShadow: true }));
    group.add(this.box([0.82, 0.28, 0.82], 0xb1e0d0, [0.45, 0.83, 0.08], { castShadow: true }));
    return group;
  }

  makePartition(width = 2.4, color = 0x5d7f93) {
    const group = new THREE.Group();
    group.add(this.box([width, 1.65, 0.16], color, [0, 0.96, 0], { castShadow: true }));
    group.add(this.box([width + 0.08, 0.08, 0.23], PALETTE.metalDark, [0, 0.1, 0], {
      metalness: 0.45,
    }));
    return group;
  }

  makeGlassPanel(width = 2.5, height = 2.8) {
    const group = new THREE.Group();
    group.add(this.box([width, height, 0.09], PALETTE.cyanGlass, [0, height / 2, 0], {
      transparent: true,
      opacity: 0.36,
      roughness: 0.12,
      metalness: 0.08,
      castShadow: false,
      rounded: false,
    }));
    for (const x of [-width / 2, width / 2]) {
      group.add(this.box([0.1, height + 0.14, 0.16], PALETTE.metalDark, [x, height / 2, 0], {
        metalness: 0.55,
        roughness: 0.33,
      }));
    }
    group.add(this.box([width + 0.1, 0.1, 0.16], PALETTE.metalDark, [0, height, 0], {
      metalness: 0.55,
      roughness: 0.33,
    }));
    return group;
  }

  makeWall(width = 2.6, height = 3.2) {
    const group = new THREE.Group();
    group.add(this.box([width, height, 0.25], PALETTE.plaster, [0, height / 2, 0], {
      castShadow: true,
      rounded: false,
    }));
    group.add(this.box([width, 0.15, 0.3], 0xc5c2bb, [0, 0.08, 0]));
    return group;
  }

  makeDoor(width = 1.35) {
    const group = new THREE.Group();
    group.add(this.box([width, 2.65, 0.16], 0xa56c3c, [0, 1.33, 0], {
      castShadow: true,
    }));
    group.add(this.box([0.08, 0.08, 0.16], 0xe0b74c, [width * 0.32, 1.22, 0.11], {
      metalness: 0.6,
      roughness: 0.3,
    }));
    return group;
  }

  makeCeilingPanel(width = 2.8, depth = 2.8) {
    const group = new THREE.Group();
    group.add(this.box([width, 0.15, depth], 0xe9ece8, [0, 0, 0], {
      castShadow: true,
      rounded: false,
    }));
    group.add(this.box([width * 0.58, 0.05, 0.5], 0xf8fff2, [0, -0.1, 0], {
      emissive: 0xf1ffe6,
      emissiveIntensity: 0.45,
      rounded: false,
    }));
    return group;
  }

  makeConcreteColumn(height = 4.4) {
    const group = new THREE.Group();
    group.add(this.box([0.92, height, 0.92], PALETTE.concrete, [0, height / 2, 0], {
      castShadow: true,
      rounded: false,
    }));
    for (const y of [0.65, 1.9, 3.2]) {
      group.add(this.box([0.96, 0.08, 0.96], PALETTE.concreteDark, [0, y, 0], {
        rounded: false,
      }));
    }
    return group;
  }

  makeSteelColumn(height = 4.7) {
    const group = new THREE.Group();
    group.add(this.box([0.28, height, 0.62], PALETTE.steel, [0, height / 2, 0], {
      metalness: 0.72,
      roughness: 0.3,
      castShadow: true,
      rounded: false,
    }));
    group.add(this.box([0.72, height, 0.15], PALETTE.steel, [0, height / 2, 0], {
      metalness: 0.72,
      roughness: 0.3,
      castShadow: true,
      rounded: false,
    }));
    group.add(this.box([0.82, 0.22, 0.82], PALETTE.steelEdge, [0, 0.11, 0], {
      metalness: 0.8,
      roughness: 0.26,
      rounded: false,
    }));
    return group;
  }

  makeSteelBeam(length = 6) {
    const group = new THREE.Group();
    group.add(this.box([length, 0.22, 0.62], PALETTE.steel, [0, 0, 0], {
      metalness: 0.75,
      roughness: 0.29,
      castShadow: true,
      rounded: false,
    }));
    group.add(this.box([length, 0.62, 0.15], PALETTE.steel, [0, 0, 0], {
      metalness: 0.75,
      roughness: 0.29,
      castShadow: true,
      rounded: false,
    }));
    for (const x of [-length * 0.35, 0, length * 0.35]) {
      group.add(this.box([0.28, 0.74, 0.72], 0x9c4d32, [x, 0, 0], {
        metalness: 0.58,
        roughness: 0.38,
        rounded: false,
      }));
    }
    return group;
  }

  makeFloorSlab(width = 5.8, depth = 5.8) {
    const group = new THREE.Group();
    group.add(this.box([width, 0.22, depth], 0x8997a0, [0, 0, 0], {
      castShadow: false,
      receiveShadow: true,
      rounded: false,
    }));
    group.add(this.box([width - 0.08, 0.035, depth - 0.08], PALETTE.carpet, [0, 0.13, 0], {
      roughness: 0.96,
      rounded: false,
    }));
    return group;
  }

  makeServerRack(variant = 0) {
    const group = new THREE.Group();
    group.add(this.box([1.12, 2.45, 0.92], variant % 2 === 0 ? 0x27323b : 0x344450, [0, 1.23, 0], {
      metalness: 0.58,
      roughness: 0.4,
      castShadow: true,
    }));
    for (let row = 0; row < 8; row += 1) {
      const y = 0.38 + row * 0.25;
      group.add(this.box([0.82, 0.12, 0.04], 0x111820, [0, y, 0.47], { rounded: false }));
      group.add(this.box([0.06, 0.05, 0.035], row % 2 === 0 ? PALETTE.mint : 0x4fa8ff, [0.29, y, 0.5], {
        emissive: row % 2 === 0 ? PALETTE.mint : 0x4fa8ff,
        emissiveIntensity: 1.1,
        rounded: false,
      }));
    }
    return group;
  }

  makeBeerServer() {
    const group = new THREE.Group();
    group.add(this.box([1.6, 1.4, 0.9], 0x2d3c46, [0, 0.72, 0], {
      metalness: 0.62,
      roughness: 0.34,
      castShadow: true,
    }));
    group.add(this.box([1.34, 0.13, 0.65], 0xadb9bd, [0, 1.37, 0.02], {
      metalness: 0.74,
      roughness: 0.24,
    }));
    for (const x of [-0.42, 0.42]) {
      group.add(this.cylinder(0.07, 0.58, 0xbfc9cd, [x, 1.68, 0], 10, {
        metalness: 0.78,
        roughness: 0.22,
      }));
      group.add(this.box([0.25, 0.08, 0.08], PALETTE.black, [x, 1.98, 0.05]));
    }
    group.add(this.box([1.05, 0.32, 0.05], 0x17242c, [0, 0.92, 0.47]));
    group.add(this.box([0.82, 0.08, 0.04], PALETTE.mint, [0, 0.92, 0.51], {
      emissive: PALETTE.mint,
      emissiveIntensity: 0.9,
    }));
    return group;
  }

  makeCityFloor(
    width: number,
    depth: number,
    height: number,
    floor: number,
    variant: number,
  ) {
    const group = new THREE.Group();
    const wallColors = [0xd9d4c9, 0xb7c7ca, 0xd5bfa8, 0xabb8c7, 0xc7c0b7];
    const wallColor = wallColors[variant % wallColors.length] ?? 0xc8c5bd;
    const trimColor = variant % 2 === 0 ? 0x596b76 : 0x806b5a;
    group.add(this.box([width, height, depth], wallColor, [0, height / 2, 0], {
      castShadow: floor < 2,
      roughness: 0.82,
      rounded: false,
    }));
    group.add(this.box([width + 0.08, 0.16, depth + 0.08], trimColor, [0, 0.12, 0], {
      metalness: 0.18,
      roughness: 0.58,
      rounded: false,
    }));
    const windowColor = variant % 3 === 0 ? 0x63c8df : 0x8fd4df;
    for (const x of [-width * 0.27, width * 0.27]) {
      for (const z of [-depth / 2 - 0.045, depth / 2 + 0.045]) {
        group.add(this.box(
          [Math.max(1.25, width * 0.34), height * 0.42, 0.08],
          windowColor,
          [x, height * 0.58, z],
          {
            metalness: 0.1,
            roughness: 0.22,
            emissive: 0x3a8aa0,
            emissiveIntensity: 0.12,
            rounded: false,
          },
        ));
      }
    }
    for (const x of [-width / 2 - 0.045, width / 2 + 0.045]) {
      group.add(this.box(
        [0.08, height * 0.38, Math.max(1.3, depth * 0.36)],
        windowColor,
        [x, height * 0.58, 0],
        {
          metalness: 0.1,
          roughness: 0.22,
          emissive: 0x3a8aa0,
          emissiveIntensity: 0.1,
          rounded: false,
        },
      ));
    }
    return group;
  }

  makeCityStorefront(width: number, variant: number) {
    const group = new THREE.Group();
    const accentColors = [0xf06b52, 0x44b9a7, 0xf0ae3e, 0x4f86cf, 0xd95f9b];
    const accent = accentColors[variant % accentColors.length] ?? PALETTE.coral;
    group.add(this.box([width * 0.82, 2.35, 0.24], 0x75dcec, [0, 1.18, 0], {
      transparent: true,
      opacity: 0.72,
      roughness: 0.12,
      metalness: 0.08,
      castShadow: true,
      rounded: false,
    }));
    group.add(this.box([width * 0.9, 0.46, 0.42], accent, [0, 2.52, -0.04], {
      emissive: accent,
      emissiveIntensity: 0.13,
      castShadow: true,
      rounded: false,
    }));
    for (const x of [-width * 0.4, 0, width * 0.4]) {
      group.add(this.box([0.11, 2.45, 0.31], 0x354b58, [x, 1.23, 0], {
        metalness: 0.48,
        roughness: 0.38,
        rounded: false,
      }));
    }
    return group;
  }

  makeCityRoof(width: number, depth: number, variant: number) {
    const group = new THREE.Group();
    group.add(this.box([width + 0.35, 0.28, depth + 0.35], 0x394852, [0, 0.14, 0], {
      metalness: 0.5,
      roughness: 0.46,
      castShadow: true,
      rounded: false,
    }));
    const utilityColor = variant % 2 === 0 ? 0x71838d : 0x596873;
    group.add(this.box([width * 0.34, 1.25, depth * 0.3], utilityColor, [0, 0.8, 0], {
      metalness: 0.48,
      roughness: 0.48,
      castShadow: true,
      rounded: false,
    }));
    for (const x of [-width * 0.38, width * 0.38]) {
      group.add(this.cylinder(0.1, 2.8, 0x24313a, [x, 1.5, 0], 8, {
        metalness: 0.68,
        roughness: 0.34,
      }));
    }
    return group;
  }

  makeStreetProp(
    kind: "vending" | "lamp" | "sign" | "tree",
    variant: number,
  ) {
    const group = new THREE.Group();
    if (kind === "vending") {
      const color = variant % 2 === 0 ? 0xe9514d : 0x3282c5;
      group.add(this.box([1.12, 2.15, 0.82], color, [0, 1.08, 0], {
        metalness: 0.3,
        roughness: 0.42,
        castShadow: true,
      }));
      group.add(this.box([0.83, 0.88, 0.05], 0xd9f5fa, [0, 1.51, -0.43], {
        emissive: 0x85dbe8,
        emissiveIntensity: 0.35,
        rounded: false,
      }));
      for (let row = 0; row < 3; row += 1) {
        group.add(this.box([0.7, 0.05, 0.055], 0xffffff, [0, 1.25 + row * 0.24, -0.47], {
          emissive: 0xffffff,
          emissiveIntensity: 0.26,
          rounded: false,
        }));
      }
      group.add(this.box([0.45, 0.24, 0.05], 0x20313d, [0, 0.4, -0.44], {
        rounded: false,
      }));
      return group;
    }
    if (kind === "lamp") {
      group.add(this.cylinder(0.11, 3.8, 0x34454f, [0, 1.9, 0], 10, {
        metalness: 0.62,
        roughness: 0.34,
      }));
      group.add(this.box([0.8, 0.18, 0.18], 0x34454f, [0.27, 3.72, 0], {
        metalness: 0.62,
        roughness: 0.34,
      }));
      group.add(this.box([0.34, 0.24, 0.34], 0xffe5a0, [0.66, 3.56, 0], {
        emissive: 0xffc85a,
        emissiveIntensity: 0.9,
      }));
      return group;
    }
    if (kind === "tree") {
      group.add(this.cylinder(0.19, 2.55, 0x755033, [0, 1.28, 0], 9, {
        roughness: 0.92,
      }));
      for (let index = 0; index < 7; index += 1) {
        const angle = index / 7 * Math.PI * 2;
        group.add(this.box(
          [1.05, 0.85, 1.05],
          index % 2 === 0 ? PALETTE.leaf : PALETTE.leafDark,
          [Math.sin(angle) * 0.55, 2.7 + index % 3 * 0.32, Math.cos(angle) * 0.55],
          { castShadow: true },
        ));
      }
      return group;
    }
    group.add(this.cylinder(0.1, 2.6, 0x465963, [-0.65, 1.3, 0], 8, {
      metalness: 0.5,
      roughness: 0.4,
    }));
    group.add(this.cylinder(0.1, 2.6, 0x465963, [0.65, 1.3, 0], 8, {
      metalness: 0.5,
      roughness: 0.4,
    }));
    const signColor = variant % 2 === 0 ? 0x46bda9 : 0xf07b4e;
    group.add(this.box([1.75, 1.02, 0.2], signColor, [0, 2.42, 0], {
      emissive: signColor,
      emissiveIntensity: 0.16,
      castShadow: true,
    }));
    group.add(this.box([1.35, 0.13, 0.22], 0xffffff, [0, 2.58, -0.12], {
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
      rounded: false,
    }));
    return group;
  }

  makeMeteorMug(scale = 1) {
    const group = new THREE.Group();
    group.add(this.box([1.08, 1.4, 0.92], PALETTE.amberLight, [0, 0, 0], {
      transparent: true,
      opacity: 0.84,
      roughness: 0.16,
      emissive: 0xe88818,
      emissiveIntensity: 0.28,
      castShadow: true,
    }));
    group.add(this.box([1.12, 0.34, 0.96], 0xffffff, [0, 0.83, 0], {
      emissive: 0xfff0b3,
      emissiveIntensity: 0.35,
      castShadow: true,
    }));
    group.add(this.box([0.18, 1.05, 0.18], 0xf3f6ed, [-0.72, 0.05, 0]));
    group.add(this.box([0.54, 0.18, 0.18], 0xf3f6ed, [-0.52, 0.52, 0]));
    group.add(this.box([0.54, 0.18, 0.18], 0xf3f6ed, [-0.52, -0.42, 0]));
    group.scale.setScalar(scale);
    return group;
  }

  makeSobayaFallback() {
    const root = new THREE.Group();
    root.name = "sobaya-fallback";

    const torso = this.box([1.45, 1.35, 0.82], PALETTE.white, [0, 1.55, 0], {
      castShadow: true,
    });
    root.add(torso);

    const head = this.box([1.05, 1.05, 0.9], 0xd6d9d8, [0, 2.65, 0], {
      castShadow: true,
    });
    root.add(head);
    root.add(this.box([0.86, 0.92, 0.08], 0xffffff, [0, 2.65, -0.47], {
      roughness: 0.45,
      castShadow: true,
    }));
    for (const x of [-0.25, 0.25]) {
      root.add(this.cylinder(0.13, 0.05, PALETTE.black, [x, 2.76, -0.53], 16, {
        roughness: 0.35,
      }));
      const eye = root.children[root.children.length - 1];
      eye.rotation.x = Math.PI / 2;
      root.add(this.box([0.1, 0.48, 0.035], 0xd8232a, [x, 2.59, -0.53], {
        rounded: false,
      }));
    }
    root.add(this.box([0.18, 0.08, 0.04], 0x44484a, [0, 2.39, -0.53]));

    for (let index = 0; index < 6; index += 1) {
      const hair = this.box([0.22, 0.38 + (index % 2) * 0.09, 0.25], PALETTE.black, [
        -0.5 + index * 0.2,
        3.27 + (index % 2) * 0.05,
        -0.06,
      ], { castShadow: true });
      hair.rotation.z = (index - 2.5) * 0.06;
      root.add(hair);
    }

    const primaryArm = new THREE.Group();
    primaryArm.name = "VoxelRig_ArmPrimary";
    primaryArm.position.set(-0.83, 2.02, 0);
    primaryArm.add(this.box([0.42, 1.12, 0.44], 0xd3c5b7, [0, -0.48, -0.08], {
      castShadow: true,
    }));
    const mug = new THREE.Group();
    mug.position.set(-0.12, -1.02, -0.35);
    mug.add(this.box([0.62, 0.78, 0.58], PALETTE.amber, [0, 0, 0], {
      transparent: true,
      opacity: 0.82,
      roughness: 0.18,
      castShadow: true,
    }));
    mug.add(this.box([0.64, 0.19, 0.6], 0xffffff, [0, 0.42, 0], {
      roughness: 0.72,
    }));
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.07, 8, 14, Math.PI * 1.55),
      this.material(0xf1f5ee, { transparent: true, opacity: 0.8, roughness: 0.2 }),
    );
    handle.rotation.y = Math.PI / 2;
    handle.rotation.z = Math.PI * 0.24;
    handle.position.set(-0.39, 0, 0);
    mug.add(handle);
    primaryArm.add(mug);
    root.add(primaryArm);

    const secondaryArm = new THREE.Group();
    secondaryArm.name = "VoxelRig_ArmSecondary";
    secondaryArm.position.set(0.83, 2.02, 0);
    secondaryArm.add(this.box([0.44, 1.14, 0.44], 0xd3c5b7, [0, -0.48, -0.05], {
      castShadow: true,
    }));
    root.add(secondaryArm);

    for (const [name, x] of [["VoxelRig_LegLeft", -0.42], ["VoxelRig_LegRight", 0.42]] as const) {
      const leg = new THREE.Group();
      leg.name = name;
      leg.position.set(x, 0.86, 0);
      leg.add(this.box([0.52, 0.92, 0.62], PALETTE.ink, [0, -0.45, 0], {
        castShadow: true,
      }));
      leg.add(this.box([0.62, 0.26, 0.85], PALETTE.black, [0, -0.95, -0.12], {
        castShadow: true,
      }));
      root.add(leg);
    }
    return root;
  }

  dispose() {
    this.unitBox.dispose();
    this.roundedBox.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
  }
}

export { PALETTE };
