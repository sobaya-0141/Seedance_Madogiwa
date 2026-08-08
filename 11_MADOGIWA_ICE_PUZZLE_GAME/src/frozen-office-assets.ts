import * as THREE from "three";
import type { OfficeObstacleKind } from "./office-layout.js";

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function markShadow(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export class FrozenOfficeAssetKit {
  private readonly frostTexture = this.makeFrostTexture();
  private readonly frozenFloor = new THREE.MeshPhysicalMaterial({
    color: "#b8eff7",
    map: this.frostTexture,
    roughness: 0.2,
    metalness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  private readonly ice = new THREE.MeshPhysicalMaterial({
    color: "#b9f4ff",
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.82,
    transmission: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  private readonly frost = new THREE.MeshStandardMaterial({
    color: "#e9fbff",
    roughness: 0.82,
    emissive: "#8adff2",
    emissiveIntensity: 0.12,
  });
  private readonly wall = new THREE.MeshStandardMaterial({
    color: "#d6e0e2",
    roughness: 0.78,
    metalness: 0.04,
  });
  private readonly wallBase = new THREE.MeshStandardMaterial({
    color: "#405266",
    roughness: 0.62,
    metalness: 0.18,
  });
  private readonly glass = new THREE.MeshPhysicalMaterial({
    color: "#5595ad",
    roughness: 0.22,
    metalness: 0.08,
    transparent: true,
    opacity: 0.72,
    transmission: 0.18,
    emissive: "#17445b",
    emissiveIntensity: 0.18,
  });
  private readonly wood = new THREE.MeshStandardMaterial({
    color: "#8c6547",
    roughness: 0.68,
  });
  private readonly metal = new THREE.MeshStandardMaterial({
    color: "#81919e",
    roughness: 0.45,
    metalness: 0.3,
  });
  private readonly darkMetal = new THREE.MeshStandardMaterial({
    color: "#253344",
    roughness: 0.42,
    metalness: 0.44,
  });
  private readonly screen = new THREE.MeshStandardMaterial({
    color: "#3cccf0",
    emissive: "#087697",
    emissiveIntensity: 1.2,
    roughness: 0.24,
  });
  private readonly pot = new THREE.MeshStandardMaterial({
    color: "#a66d4b",
    roughness: 0.8,
  });
  private readonly leaf = new THREE.MeshStandardMaterial({
    color: "#497d6a",
    roughness: 0.68,
  });
  private readonly paper = new THREE.MeshStandardMaterial({
    color: "#f4f7ee",
    roughness: 0.9,
  });

  constructor(private readonly cell: number) {}

  createFrozenFloorTile(x: number, y: number): THREE.Group {
    const group = new THREE.Group();
    group.name = "frozen-floor-tile";
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(this.cell * 0.95, 0.14, this.cell * 0.95),
      this.frozenFloor,
    );
    base.position.y = -0.01;
    const glaze = new THREE.Mesh(
      new THREE.BoxGeometry(this.cell * 0.89, 0.035, this.cell * 0.89),
      this.ice,
    );
    glaze.position.y = 0.085;
    glaze.rotation.y = ((x * 3 + y) % 4) * Math.PI / 2;
    group.add(base, glaze);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(base.geometry),
      new THREE.LineBasicMaterial({
        color: (x + y) % 2 === 0 ? "#efffff" : "#8bdcec",
        transparent: true,
        opacity: 0.56,
      }),
    );
    edge.position.copy(base.position);
    group.add(edge);

    if ((x * 7 + y * 11) % 5 === 0) {
      const frostBloom = new THREE.Mesh(
        new THREE.CircleGeometry(this.cell * 0.16, 16),
        new THREE.MeshBasicMaterial({
          color: "#f4ffff",
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        }),
      );
      frostBloom.rotation.x = -Math.PI / 2;
      frostBloom.position.set(this.cell * 0.22, 0.109, -this.cell * 0.18);
      group.add(frostBloom);
    }

    markShadow(group);
    return group;
  }

  createOuterWallCell(
    x: number,
    y: number,
    columns: number,
    rows: number,
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = "frozen-office-outer-wall";
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(this.cell * 0.98, 1.55, this.cell * 0.98),
      this.wall,
    );
    body.position.y = 0.72;
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(this.cell, 0.24, this.cell),
      this.wallBase,
    );
    base.position.y = 0.02;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(this.cell * 1.01, 0.14, this.cell * 1.01),
      this.ice,
    );
    cap.position.y = 1.52;
    group.add(body, base, cap);

    const inward = this.inwardNormal(x, y, columns, rows);
    const panel = new THREE.Mesh(
      inward.z !== 0
        ? new THREE.BoxGeometry(this.cell * 0.7, 0.55, 0.035)
        : new THREE.BoxGeometry(0.035, 0.55, this.cell * 0.7),
      this.glass,
    );
    panel.position.set(
      inward.x * this.cell * 0.495,
      0.78,
      inward.z * this.cell * 0.495,
    );
    group.add(panel);

    const rail = new THREE.Mesh(
      inward.z !== 0
        ? new THREE.BoxGeometry(this.cell * 0.78, 0.055, 0.055)
        : new THREE.BoxGeometry(0.055, 0.055, this.cell * 0.78),
      this.wallBase,
    );
    rail.position.set(
      inward.x * this.cell * 0.515,
      1.12,
      inward.z * this.cell * 0.515,
    );
    group.add(rail);

    [-0.26, 0.21].forEach((offset, index) => {
      const icicle = new THREE.Mesh(
        new THREE.ConeGeometry(0.055 + index * 0.012, 0.28 + index * 0.07, 7),
        this.ice,
      );
      if (inward.z !== 0) {
        icicle.position.set(offset, 1.35, inward.z * this.cell * 0.52);
      } else {
        icicle.position.set(inward.x * this.cell * 0.52, 1.35, offset);
      }
      group.add(icicle);
    });

    markShadow(group);
    return group;
  }

  createOfficeObstacle(kind: OfficeObstacleKind, seed: number): THREE.Group {
    const group = new THREE.Group();
    group.name = `frozen-office-${kind}`;
    const iceBase = new THREE.Mesh(
      new THREE.CylinderGeometry(this.cell * 0.43, this.cell * 0.48, 0.12, 8),
      this.ice,
    );
    iceBase.position.y = 0.02;
    iceBase.rotation.y = (seed % 4) * Math.PI / 4;
    group.add(iceBase);

    switch (kind) {
      case "desk":
        this.addDesk(group);
        break;
      case "planter":
        this.addPlanter(group);
        break;
      case "cabinet":
        this.addCabinet(group);
        break;
      case "server":
        this.addServerRack(group);
        break;
      case "cubicle":
        this.addCubicle(group);
        break;
      case "printer":
        this.addPrinter(group);
        break;
    }

    this.addIceShards(group, seed);
    group.rotation.y = (seed % 4) * Math.PI / 2;
    markShadow(group);
    return group;
  }

  private addDesk(group: THREE.Group): void {
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.11, 0.68), this.wood);
    top.position.y = 0.72;
    group.add(top);
    [-0.43, 0.43].forEach((x) => {
      [-0.23, 0.23].forEach((z) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.66, 0.07), this.metal);
        leg.position.set(x, 0.37, z);
        group.add(leg);
      });
    });
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.08), this.darkMetal);
    monitor.position.set(0.12, 1.02, -0.08);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.26), this.screen);
    display.position.set(0.12, 1.02, -0.121);
    display.rotation.y = Math.PI;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.07), this.metal);
    stand.position.set(0.12, 0.83, -0.08);
    group.add(monitor, display, stand);
    this.addFrostCap(group, 1.08, 0.7, 0.79);
  }

  private addPlanter(group: THREE.Group): void {
    const planter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 0.56, 12),
      this.pot,
    );
    planter.position.y = 0.34;
    group.add(planter);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.72, 8), this.wood);
    trunk.position.y = 0.91;
    group.add(trunk);
    [
      [-0.18, 1.12, 0.03],
      [0.17, 1.18, 0.02],
      [0, 1.35, -0.04],
      [-0.07, 1.28, 0.17],
      [0.1, 1.05, -0.16],
    ].forEach(([x, y, z], index) => {
      const leaves = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.21 + (index % 2) * 0.035, 0),
        index === 2 ? this.frost : this.leaf,
      );
      leaves.position.set(x, y, z);
      group.add(leaves);
    });
    const frozenSoil = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.05, 12), this.ice);
    frozenSoil.position.y = 0.63;
    group.add(frozenSoil);
  }

  private addCabinet(group: THREE.Group): void {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.18, 0.74), this.metal);
    body.position.y = 0.64;
    group.add(body);
    [-0.24, 0.08, 0.4].forEach((y) => {
      const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.035), this.wallBase);
      drawer.position.set(0, y + 0.56, 0.39);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.04), this.darkMetal);
      handle.position.set(0, y + 0.58, 0.425);
      group.add(drawer, handle);
    });
    this.addFrostCap(group, 0.82, 0.78, 1.25);
  }

  private addServerRack(group: THREE.Group): void {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.28, 0.76), this.darkMetal);
    body.position.y = 0.69;
    group.add(body);
    [-0.34, -0.08, 0.18, 0.44].forEach((y, row) => {
      const bay = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.035), this.wallBase);
      bay.position.set(0, y + 0.67, 0.4);
      group.add(bay);
      [-0.2, 0.18].forEach((x, light) => {
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.025, 6, 5),
          light === row % 2 ? this.screen : this.frost,
        );
        led.position.set(x, y + 0.67, 0.425);
        group.add(led);
      });
    });
    this.addFrostCap(group, 0.84, 0.8, 1.37);
  }

  private addCubicle(group: THREE.Group): void {
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.8, 0.08), this.wall);
    back.position.set(0, 0.64, -0.46);
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.9), this.wall);
    side.position.set(-0.5, 0.64, 0);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.09, 0.48), this.wood);
    desk.position.set(0.02, 0.66, -0.14);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.27, 0.06), this.darkMetal);
    screen.position.set(0.14, 0.88, -0.26);
    group.add(back, side, desk, screen);
    this.addFrostCap(group, 1.1, 0.11, 1.06, -0.46);
  }

  private addPrinter(group: THREE.Group): void {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.65, 0.72), this.wall);
    base.position.y = 0.43;
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.58), this.metal);
    top.position.set(0, 0.88, -0.03);
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.42), this.darkMetal);
    tray.position.set(0, 0.68, 0.38);
    const page = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.34), this.paper);
    page.position.set(0, 0.72, 0.44);
    page.rotation.x = -0.18;
    const status = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.03), this.screen);
    status.position.set(0.19, 0.98, 0.27);
    group.add(base, top, tray, page, status);
    this.addFrostCap(group, 0.72, 0.6, 1.07, -0.03);
  }

  private addFrostCap(
    group: THREE.Group,
    width: number,
    depth: number,
    y: number,
    z = 0,
  ): void {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, depth), this.ice);
    cap.position.set(0, y, z);
    group.add(cap);
  }

  private addIceShards(group: THREE.Group, seed: number): void {
    const random = seededRandom(seed * 97 + 11);
    for (let index = 0; index < 4; index += 1) {
      const shard = new THREE.Mesh(
        new THREE.ConeGeometry(0.045 + random() * 0.035, 0.18 + random() * 0.22, 5),
        index % 2 === 0 ? this.ice : this.frost,
      );
      const angle = random() * Math.PI * 2;
      const radius = this.cell * (0.3 + random() * 0.08);
      shard.position.set(Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius);
      shard.rotation.z = (random() - 0.5) * 0.35;
      group.add(shard);
    }
  }

  private inwardNormal(
    x: number,
    y: number,
    columns: number,
    rows: number,
  ): { x: number; z: number } {
    if (y === 0) return { x: 0, z: 1 };
    if (y === rows - 1) return { x: 0, z: -1 };
    if (x === 0) return { x: 1, z: 0 };
    if (x === columns - 1) return { x: -1, z: 0 };
    return { x: 0, z: 1 };
  }

  private makeFrostTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, "#bfeef5");
      gradient.addColorStop(0.48, "#8fd4e5");
      gradient.addColorStop(1, "#d8f8fa");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 512);

      const random = seededRandom(2_026_07_28);
      for (let bloom = 0; bloom < 22; bloom += 1) {
        const x = random() * 512;
        const y = random() * 512;
        const radius = 20 + random() * 62;
        const frost = context.createRadialGradient(x, y, 0, x, y, radius);
        frost.addColorStop(0, "rgba(255,255,255,0.38)");
        frost.addColorStop(1, "rgba(220,250,255,0)");
        context.fillStyle = frost;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }

      context.strokeStyle = "rgba(235, 255, 255, 0.62)";
      context.lineWidth = 3;
      context.lineCap = "round";
      for (let crack = 0; crack < 13; crack += 1) {
        let x = random() * 512;
        let y = random() * 512;
        context.beginPath();
        context.moveTo(x, y);
        for (let segment = 0; segment < 4; segment += 1) {
          x += (random() - 0.5) * 90;
          y += (random() - 0.5) * 90;
          context.lineTo(x, y);
        }
        context.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  dispose(): void {
    this.frostTexture.dispose();
  }
}
