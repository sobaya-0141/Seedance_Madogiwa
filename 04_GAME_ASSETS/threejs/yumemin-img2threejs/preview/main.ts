import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createYumeminLights, createYumeminModel, type YumeminRuntime } from '../src/createYumeminModel';

declare global {
  interface Window {
    __ready: boolean;
    __interactive: boolean;
    __setView: (name: string) => void;
    __setExploded: (amount: number) => void;
    __modelStats: Record<string, unknown>;
    __partsManifest: Record<string, unknown>;
  }
}

const params = new URLSearchParams(location.search);
const reviewMode = params.get('review') === '1';
const container = document.querySelector<HTMLDivElement>('#app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = reviewMode ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = reviewMode ? 1 : 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.setClearColor(reviewMode ? 0xffffff : 0xf5f7fb, 1);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(reviewMode ? 0xffffff : 0xf5f7fb);
scene.add(createYumeminLights());
if (reviewMode) document.querySelector<HTMLElement>('.badge')?.remove();

const model = createYumeminModel({
  includeMallet: params.get('mallet') === '1',
  outlines: false,
});
if (reviewMode) {
  const flatBlue = new THREE.MeshBasicMaterial({ color: 0x52b9e8, toneMapped: false });
  const flatInnerEar = new THREE.MeshBasicMaterial({ color: 0x3299cb, toneMapped: false });
  const flatWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
    if (sourceMaterial?.name === 'Yumemin_BlueVinyl') object.material = flatBlue;
    if (sourceMaterial?.name === 'Yumemin_InnerEar') object.material = flatInnerEar;
    if (sourceMaterial?.name === 'Yumemin_WhiteWrap') object.material = flatWhite;
    object.castShadow = false;
    object.receiveShadow = false;
  });
}
model.position.y = 0.2;
scene.add(model);

const runtime = model.userData.sculptRuntime as YumeminRuntime;
runtime.setExploded(Number(params.get('explode') ?? 0));

const shadowMaterial = new THREE.ShadowMaterial({ color: 0x24334a, opacity: 0.16 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), shadowMaterial);
ground.name = 'review-ground';
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.27;
ground.receiveShadow = true;
ground.visible = !reviewMode;
scene.add(ground);

const camera = new THREE.PerspectiveCamera(18, innerWidth / innerHeight, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false;
window.__interactive = false;
controls.addEventListener('start', () => {
  window.__interactive = true;
  controls.enabled = true;
});

const views: Record<string, [number, number, number]> = {
  front: [0, 0.05, 8.8],
  'three-quarter': [6, 2.2, 6],
  left: [-8.8, 0.05, 0],
  right: [8.8, 0.05, 0],
  back: [0, 0.05, -8.8],
};

window.__setView = (name: string) => {
  const view = views[name] ?? views.front;
  window.__interactive = false;
  controls.enabled = false;
  camera.up.set(0, 1, 0);
  camera.position.set(...view);
  camera.lookAt(0, 0.2, 0);
  controls.target.set(0, 0.2, 0);
  camera.updateProjectionMatrix();
};
window.__setExploded = (amount: number) => runtime.setExploded(amount);
window.__setView(params.get('view') ?? 'front');

const box = new THREE.Box3().setFromObject(model);
const size = box.getSize(new THREE.Vector3());
let triangles = 0;
const partMeshes: Array<{ name: string; parentPartId?: string; triangles: number }> = [];
model.traverse((object) => {
  if (!(object instanceof THREE.Mesh)) return;
  const geometry = object.geometry;
  const count = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
  triangles += count;
  partMeshes.push({
    name: object.name,
    parentPartId: object.userData.parentPartId,
    triangles: Math.round(count),
  });
});
window.__modelStats = {
  triangles: Math.round(triangles),
  drawCalls: partMeshes.length,
  bounds: [size.x, size.y, size.z].map((value) => Number(value.toFixed(3))),
  nodes: Object.keys(runtime.nodes),
  sockets: Object.keys(runtime.sockets),
};
const runtimePartNames = new Set(Object.keys(runtime.nodes));
const runtimeParts = Object.keys(runtime.nodes).map((name) => ({
  name,
  kind: 'part',
  module: name,
  triangles: 0,
}));
window.__partsManifest = {
  model: 'yumemin-img2threejs',
  parts: [
    ...runtimeParts,
    ...partMeshes
      .filter((part) => !runtimePartNames.has(part.name))
      .map((part) => ({ ...part, kind: 'detail', module: part.parentPartId ?? part.name })),
  ],
  unnamedMeshes: partMeshes.filter((part) => !part.name).length,
  integralMeshes: partMeshes.length,
  destructionGroups: Object.fromEntries(
    Object.entries(runtime.destructionGroups).map(([id, objects]) => [id, objects.map((object) => object.name)]),
  ),
};
document.documentElement.dataset.ready = 'true';
document.documentElement.dataset.modelStats = JSON.stringify(window.__modelStats);
document.documentElement.dataset.partsManifest = JSON.stringify(window.__partsManifest);

function render(): void {
  requestAnimationFrame(render);
  const elapsed = performance.now() * 0.001;
  if (params.get('animate') === '1') runtime.tick(elapsed, 0);
  if (window.__interactive) controls.update();
  renderer.render(scene, camera);
  window.__ready = true;
}
render();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
