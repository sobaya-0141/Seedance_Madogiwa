import * as THREE from 'three';

export type YumeminModelOptions = {
  castShadow?: boolean;
  receiveShadow?: boolean;
  includeMallet?: boolean;
  /** Legacy compatibility only. The v3 design never creates drawn outline geometry. */
  outlines?: boolean;
};

export type YumeminRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
  tick: (elapsedSeconds: number, bonk?: number) => void;
  setMalletVisible: (visible: boolean) => void;
  setExploded: (amount: number) => void;
  resolvePart: (object: THREE.Object3D) => string | null;
};

const BLUE = 0x5fb6e7;
const WHITE = 0xffffff;
const INK = 0x0d0507;
const WOOD_DARK = 0x8b5a2b;
const WOOD_LIGHT = 0xc9853d;

function makeMaterial(
  color: number,
  roughness: number,
  options: { basic?: boolean; side?: THREE.Side; name?: string } = {},
): THREE.Material {
  const material = options.basic
    ? new THREE.MeshBasicMaterial({ color, side: options.side ?? THREE.FrontSide })
    : new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness: 0,
        side: options.side ?? THREE.FrontSide,
      });
  material.name = options.name ?? `YumeminMaterial_${color.toString(16)}`;
  return material;
}

function namePart(
  mesh: THREE.Mesh,
  partId: string,
  meshes: Record<string, THREE.Mesh>,
  options: YumeminModelOptions,
): THREE.Mesh {
  mesh.name = partId;
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  mesh.userData.partId = partId;
  meshes[partId] = mesh;
  return mesh;
}

function markSurfaceDetail(mesh: THREE.Mesh, parentPartId: string): THREE.Mesh {
  mesh.userData.explodeWithParent = true;
  mesh.userData.parentPartId = parentPartId;
  return mesh;
}

function createSmoothTaperedTubeGeometry(
  curve: THREE.CatmullRomCurve3,
  startRadius: number,
  endRadius: number,
): THREE.BufferGeometry {
  const geometry = new THREE.TubeGeometry(curve, 64, 1, 20, false);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const uvs = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const center = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    const u = uvs.getX(index);
    curve.getPointAt(u, center);
    vertex.fromBufferAttribute(positions, index);
    const radius = THREE.MathUtils.lerp(startRadius, endRadius, u ** 0.86);
    vertex.sub(center).multiplyScalar(radius).add(center);
    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createRearWrapGeometry(
  boundaryZ = 0.25,
  radius = 1.025,
  ringSegments = 28,
  radialSegments = 64,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const alphaMax = Math.acos(boundaryZ);

  for (let i = 0; i <= ringSegments; i += 1) {
    const alpha = (i / ringSegments) * alphaMax;
    const radial = Math.sin(alpha);
    const z = -Math.cos(alpha);
    for (let j = 0; j <= radialSegments; j += 1) {
      const beta = (j / radialSegments) * Math.PI * 2;
      const x = radial * Math.cos(beta);
      const y = radial * Math.sin(beta);
      positions.push(x * radius, y * radius, z * radius);
      normals.push(x, y, z);
      uvs.push(i / ringSegments, j / radialSegments);
    }
  }

  const row = radialSegments + 1;
  for (let i = 0; i < ringSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * row + j;
      const b = (i + 1) * row + j;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function createWrapEdgeCurve(boundaryZ = 0.25, radius = 1.025): THREE.CatmullRomCurve3 {
  const ringRadius = Math.sqrt(1 - boundaryZ * boundaryZ) * radius;
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < 64; index += 1) {
    const angle = (index / 64) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        -boundaryZ * radius,
      ),
    );
  }
  return new THREE.CatmullRomCurve3(points, true, 'centripetal');
}

function createFabricBumpTexture(size = 64): THREE.DataTexture {
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const warp = Math.sin((x / size) * Math.PI * 20) * 7;
      const weft = Math.sin((y / size) * Math.PI * 24) * 6;
      const cross = Math.sin(((x + y) / size) * Math.PI * 14) * 3;
      data[y * size + x] = Math.round(128 + warp + weft + cross);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  texture.name = 'Yumemin_WrapFabricBump';
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createEarShape(width = 0.16, height = 0.3): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-width, 0);
  shape.quadraticCurveTo(-width * 0.58, height * 0.72, 0, height);
  shape.quadraticCurveTo(width * 0.58, height * 0.72, width, 0);
  shape.quadraticCurveTo(0, -0.018, -width, 0);
  return shape;
}

function createEarGeometry(): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(createEarShape(), {
    depth: 0.08,
    bevelEnabled: true,
    bevelSize: 0.014,
    bevelThickness: 0.014,
    bevelSegments: 3,
    curveSegments: 12,
  });
}

function createInnerEarGeometry(): THREE.ShapeGeometry {
  return new THREE.ShapeGeometry(createEarShape(0.09, 0.18), 12);
}

function createCylinderBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 20, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function addSocket(
  parent: THREE.Object3D,
  id: string,
  position: THREE.Vector3,
  sockets: Record<string, THREE.Object3D>,
): THREE.Object3D {
  const socket = new THREE.Object3D();
  socket.name = id;
  socket.position.copy(position);
  socket.userData.socketId = id;
  parent.add(socket);
  sockets[id] = socket;
  return socket;
}

export function createYumeminModel(options: YumeminModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Yumemin_Root';

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {
    body: { type: 'sphere', radius: 0.96 },
    trunk: { type: 'capsule-chain', radii: [0.19, 0.1] },
    tail: { type: 'sphere', offset: [0, -0.43, -0.96], radius: 0.13 },
    mallet: { type: 'compound', parts: ['mallet-handle', 'mallet-head'] },
  };
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const blueMaterial = new THREE.MeshStandardMaterial({
    name: 'Yumemin_BlueVinyl',
    color: BLUE,
    roughness: 0.72,
    metalness: 0,
  });
  const innerEarMaterial = new THREE.MeshStandardMaterial({
    name: 'Yumemin_InnerEar',
    color: 0x319bd4,
    roughness: 0.8,
    metalness: 0,
  });
  const fabricBump = createFabricBumpTexture();
  const wrapMaterial = new THREE.MeshPhysicalMaterial({
    name: 'Yumemin_WhiteWrap',
    color: WHITE,
    roughness: 0.94,
    metalness: 0,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.92,
    bumpMap: fabricBump,
    bumpScale: 0.007,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    name: 'Yumemin_BlackEyes',
    color: INK,
    roughness: 0.52,
    metalness: 0,
  });
  const woodDarkMaterial = makeMaterial(WOOD_DARK, 0.72, { name: 'Yumemin_WoodDark' });
  const woodLightMaterial = makeMaterial(WOOD_LIGHT, 0.67, { name: 'Yumemin_WoodLight' });

  const hoverPivot = new THREE.Group();
  hoverPivot.name = 'Yumemin_HoverPivot';
  root.add(hoverPivot);
  nodes['hover-body'] = hoverPivot;

  const bodyNode = new THREE.Group();
  bodyNode.name = 'body-shell__pivot';
  hoverPivot.add(bodyNode);
  nodes['body-shell'] = bodyNode;

  const bodyGeometry = new THREE.SphereGeometry(1, 72, 48);
  const body = namePart(new THREE.Mesh(bodyGeometry, blueMaterial), 'body-shell', meshes, options);
  bodyNode.add(body);

  const wrapNode = new THREE.Group();
  wrapNode.name = 'rear-wrap__pivot';
  bodyNode.add(wrapNode);
  nodes['rear-wrap'] = wrapNode;
  const rearWrap = namePart(
    new THREE.Mesh(createRearWrapGeometry(0.25, 1.025), wrapMaterial),
    'rear-wrap',
    meshes,
    options,
  );
  wrapNode.add(rearWrap);

  const wrapEdge = namePart(
    new THREE.Mesh(new THREE.TubeGeometry(createWrapEdgeCurve(0.25, 1.025), 96, 0.018, 10, true), wrapMaterial),
    'rear-wrap-edge',
    meshes,
    options,
  );
  markSurfaceDetail(wrapEdge, 'rear-wrap');
  wrapNode.add(wrapEdge);

  const tailNode = new THREE.Group();
  tailNode.name = 'tail-nub__pivot';
  tailNode.position.set(0, -0.43, -0.96);
  bodyNode.add(tailNode);
  nodes['tail-nub'] = tailNode;
  const tailGeometry = new THREE.SphereGeometry(1, 28, 18);
  const tailNub = namePart(new THREE.Mesh(tailGeometry, blueMaterial), 'tail-nub', meshes, options);
  tailNub.scale.set(0.13, 0.15, 0.12);
  tailNode.add(tailNub);

  const tailOpening = namePart(
    new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 10, 40), wrapMaterial),
    'tail-opening-rim',
    meshes,
    options,
  );
  tailOpening.position.set(0, -0.43, -1.018);
  markSurfaceDetail(tailOpening, 'rear-wrap');
  bodyNode.add(tailOpening);

  const earSystem = new THREE.Group();
  earSystem.name = 'ear-system__pivot';
  bodyNode.add(earSystem);
  nodes['ear-system'] = earSystem;
  const earGeometry = createEarGeometry();
  const innerEarGeometry = createInnerEarGeometry();
  for (const [sideName, x, rotationZ, rotationY] of [
    ['left', -0.54, 0.12, -0.6],
    ['right', 0.54, -0.12, 0.6],
  ] as const) {
    const earPivot = new THREE.Group();
    earPivot.name = `${sideName}-ear__pivot`;
    earPivot.position.set(x, 0.79, -0.04);
    earPivot.rotation.z = rotationZ;
    earPivot.rotation.y = rotationY;
    earSystem.add(earPivot);
    const ear = namePart(new THREE.Mesh(earGeometry, blueMaterial), `${sideName}-ear`, meshes, options);
    earPivot.add(ear);
    const innerEar = namePart(
      new THREE.Mesh(innerEarGeometry, innerEarMaterial),
      `${sideName}-inner-ear`,
      meshes,
      { ...options, castShadow: false },
    );
    innerEar.position.set(0, 0.035, 0.098);
    markSurfaceDetail(innerEar, `${sideName}-ear`);
    earPivot.add(innerEar);
  }

  const eyeSystem = new THREE.Group();
  eyeSystem.name = 'eye-system__pivot';
  bodyNode.add(eyeSystem);
  nodes['eye-system'] = eyeSystem;
  const eyeGeometry = new THREE.SphereGeometry(1, 32, 20);
  for (const [sideName, x] of [
    ['left', -0.3],
    ['right', 0.3],
  ] as const) {
    const eye = namePart(new THREE.Mesh(eyeGeometry, eyeMaterial), `${sideName}-eye`, meshes, {
      ...options,
      castShadow: false,
      receiveShadow: false,
    });
    eye.position.set(x, 0.18, 0.95);
    eye.scale.set(0.085, 0.085, 0.045);
    eyeSystem.add(eye);
  }

  const trunkPivot = new THREE.Group();
  trunkPivot.name = 'trunk-pivot';
  trunkPivot.position.set(0, -0.08, 0.88);
  bodyNode.add(trunkPivot);
  nodes['trunk-pivot'] = trunkPivot;
  const trunkRoot = namePart(
    new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), blueMaterial),
    'trunk-root',
    meshes,
    options,
  );
  trunkRoot.position.z = 0.035;
  trunkRoot.scale.set(0.21, 0.2, 0.15);
  markSurfaceDetail(trunkRoot, 'trunk-pivot');
  trunkPivot.add(trunkRoot);
  const trunkCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 0.03),
      new THREE.Vector3(0, -0.015, 0.15),
      new THREE.Vector3(0, -0.075, 0.29),
      new THREE.Vector3(0, -0.2, 0.42),
      new THREE.Vector3(0, -0.25, 0.48),
    ],
    false,
    'centripetal',
  );
  const trunkGeometry = createSmoothTaperedTubeGeometry(trunkCurve, 0.19, 0.1);
  const trunk = namePart(new THREE.Mesh(trunkGeometry, blueMaterial), 'trunk', meshes, options);
  trunkPivot.add(trunk);
  const trunkTip = namePart(
    new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), blueMaterial),
    'trunk-tip-form',
    meshes,
    options,
  );
  trunkTip.position.set(0, -0.25, 0.48);
  trunkTip.scale.set(0.115, 0.105, 0.12);
  markSurfaceDetail(trunkTip, 'trunk-pivot');
  trunkPivot.add(trunkTip);
  addSocket(trunkPivot, 'trunk-tip', new THREE.Vector3(0, -0.25, 0.48), sockets);

  const malletAssembly = new THREE.Group();
  malletAssembly.name = 'mallet-assembly__pivot';
  malletAssembly.position.set(0.92, -0.18, 0.26);
  malletAssembly.rotation.z = -0.28;
  malletAssembly.visible = options.includeMallet ?? false;
  hoverPivot.add(malletAssembly);
  nodes['mallet-assembly'] = malletAssembly;
  addSocket(malletAssembly, 'mallet-impact', new THREE.Vector3(0.94, -0.58, 0), sockets);

  const armNode = new THREE.Group();
  armNode.name = 'mallet-arm__pivot';
  malletAssembly.add(armNode);
  nodes['mallet-arm'] = armNode;
  const armGeometry = new THREE.CapsuleGeometry(0.13, 0.19, 8, 18);
  const arm = namePart(new THREE.Mesh(armGeometry, blueMaterial), 'mallet-arm', meshes, options);
  arm.position.set(0.13, -0.09, 0);
  arm.rotation.z = -0.58;
  armNode.add(arm);

  const hand = namePart(
    new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 16), blueMaterial),
    'mallet-hand',
    meshes,
    options,
  );
  hand.position.set(0.27, -0.19, 0);
  armNode.add(hand);

  const handleNode = new THREE.Group();
  handleNode.name = 'mallet-handle__pivot';
  malletAssembly.add(handleNode);
  nodes['mallet-handle'] = handleNode;
  const handle = namePart(
    createCylinderBetween(
      new THREE.Vector3(0.24, -0.16, 0),
      new THREE.Vector3(0.75, -0.49, 0),
      0.06,
      woodDarkMaterial,
    ),
    'mallet-handle',
    meshes,
    options,
  );
  handleNode.add(handle);

  const headNode = new THREE.Group();
  headNode.name = 'mallet-head__pivot';
  malletAssembly.add(headNode);
  nodes['mallet-head'] = headNode;
  const head = namePart(
    new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.54, 32, 2), woodLightMaterial),
    'mallet-head',
    meshes,
    options,
  );
  head.position.set(0.79, -0.52, 0);
  head.rotation.x = Math.PI / 2;
  headNode.add(head);
  for (const [id, z] of [
    ['mallet-cap-front', 0.275],
    ['mallet-cap-back', -0.275],
  ] as const) {
    const cap = namePart(
      new THREE.Mesh(new THREE.CylinderGeometry(0.263, 0.263, 0.018, 32), woodDarkMaterial),
      id,
      meshes,
      options,
    );
    cap.position.set(0.79, -0.52, z);
    cap.rotation.x = Math.PI / 2;
    markSurfaceDetail(cap, 'mallet-head');
    headNode.add(cap);
  }

  destructionGroups['yumemin-body'] = [bodyNode, wrapNode, tailNode, earSystem, eyeSystem, trunkPivot];
  destructionGroups.mallet = [malletAssembly];

  const partHome = new Map<THREE.Object3D, THREE.Vector3>();
  [bodyNode, wrapNode, tailNode, earSystem, eyeSystem, trunkPivot, malletAssembly].forEach((part) => {
    partHome.set(part, part.position.clone());
  });

  const runtime: YumeminRuntime = {
    nodes,
    meshes,
    sockets,
    colliders,
    destructionGroups,
    tick(elapsedSeconds: number, bonk = 0) {
      hoverPivot.position.y = Math.sin(elapsedSeconds * 2.1) * 0.045;
      hoverPivot.rotation.z = Math.sin(elapsedSeconds * 1.35) * 0.012;
      trunkPivot.rotation.y = Math.sin(elapsedSeconds * 2.65) * 0.055;
      trunkPivot.rotation.x = Math.sin(elapsedSeconds * 1.7 + 0.6) * 0.03;
      trunkPivot.rotation.z = 0;
      const easedBonk = Math.sin(THREE.MathUtils.clamp(bonk, 0, 1) * Math.PI);
      malletAssembly.rotation.z = -0.28 - easedBonk * 0.92;
    },
    setMalletVisible(visible: boolean) {
      malletAssembly.visible = visible;
    },
    setExploded(amount: number) {
      const t = THREE.MathUtils.clamp(amount, 0, 1);
      for (const [part, home] of partHome) part.position.copy(home);
      wrapNode.position.z -= 0.38 * t;
      tailNode.position.add(new THREE.Vector3(0, -0.18, -0.32).multiplyScalar(t));
      earSystem.position.y += 0.3 * t;
      eyeSystem.position.z += 0.28 * t;
      trunkPivot.position.add(new THREE.Vector3(0, -0.18, 0.35).multiplyScalar(t));
      malletAssembly.position.add(new THREE.Vector3(0.62, -0.25, 0.16).multiplyScalar(t));
    },
    resolvePart(object: THREE.Object3D) {
      let current: THREE.Object3D | null = object;
      while (current) {
        if (typeof current.userData.parentPartId === 'string') return current.userData.parentPartId;
        if (typeof current.userData.partId === 'string') return current.userData.partId;
        current = current.parent;
      }
      return null;
    },
  };

  root.userData.character = 'Yumemin';
  root.userData.designLocks = [
    'perfectly spherical blue body',
    'two pupil-free dot eyes',
    'two small ears',
    'centerline tapir proboscis',
    'white conforming wrap cloth',
    'no drawn outline geometry',
    'small blue rear tail nub',
    'legless flying silhouette',
    'wooden mallet is an optional action prop',
  ];
  root.userData.sculptRuntime = runtime;
  root.userData.tick = runtime.tick;
  return root;
}

export function createYumeminLights(): THREE.Group {
  const lights = new THREE.Group();
  lights.name = 'Yumemin_LookDevLights';

  const hemisphere = new THREE.HemisphereLight(0xddeeff, 0xd4d9e2, 1.35);
  lights.add(hemisphere);

  const key = new THREE.DirectionalLight(0xfff7ed, 2.4);
  key.position.set(-3, 5, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  key.shadow.blurSamples = 20;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  lights.add(key);

  const rim = new THREE.DirectionalLight(0xc8ddff, 1.2);
  rim.position.set(4, 2, -5);
  lights.add(rim);
  return lights;
}
