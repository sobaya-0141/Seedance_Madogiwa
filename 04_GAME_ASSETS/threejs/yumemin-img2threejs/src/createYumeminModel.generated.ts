import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

// Plan 1.3 F.6 — sweep a thin 2D cross-section along a 3D spine so a curved
// form (hooked blade, handle) reads correctly from EVERY camera angle, not just
// the reference angle a flat extrude happens to match. Uses ExtrudeGeometry's
// native extrudePath; bevelEnabled: false keeps sharp tips (same rule as F.5).
function buildCurveSweepGeometry(
  sweep: { spine: [number, number, number][]; crossSection: { points: [number, number][] }; closed?: boolean },
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const cs = sweep.crossSection.points;
  if (cs.length > 0) {
    shape.moveTo(cs[0][0], cs[0][1]);
    for (let i = 1; i < cs.length; i += 1) shape.lineTo(cs[i][0], cs[i][1]);
    shape.closePath();
  }
  const spine = sweep.spine.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const path = new THREE.CatmullRomCurve3(spine, sweep.closed ?? false);
  return new THREE.ExtrudeGeometry(shape, {
    extrudePath: path,
    steps: Math.max(24, spine.length * 8),
    bevelEnabled: false,
  });
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions): THREE.MeshPhysicalMaterial {
  const textures = makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : new THREE.Color(typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F'),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clamp01(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: Math.max(1, readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: Math.max(1, readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clamp01(readLayerNumber(spec.specularIntensity, ['base'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    if (bumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = bumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    if (displacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = displacementScale;
      material.displacementBias = -displacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: Yumemin
// Sculpt build pass: blockout
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createYumeminModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "Yumemin";
  root.userData.reconstructionEvidence = {"itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": {"solved": true, "projection": "orthographic-like telephoto match", "fovDegrees": 18.0, "aspect": 1.0, "orientation": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}, "positionHint": [0.0, 0.0, 8.0], "confidence": 0.55, "note": "The source is flat icon art rather than a photographed camera view. Use a long-lens frontal camera to approximate orthographic projection and confirm framing through screenshot comparison."}, "approximationNotes": []};

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["blue-body-material"] = createSculptMaterial(
    "blue-body-material",
    {"id": "blue-body-material", "name": "Yumemin sampled sky-blue matte surface", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#5FB6E7", "color": "#5FB6E7", "albedo": {"dominant": "#5FB6E7", "secondary": ["#53A6DA", "#72C3EC"], "samplingNotes": "Dominant color sampled from the source histogram; variation is deliberately subtle because the reference is flat illustration."}, "colorVariation": {"palette": ["#5FB6E7", "#53A6DA", "#72C3EC"], "pattern": "very-low-amplitude object-space vertical gradient", "amplitude": 0.035, "heightCorrelation": 0.15}, "textureResolution": 1024, "textureProjection": {"mode": "object-space", "repeat": [1, 1], "anisotropy": 8, "texelDensityIntent": "Stable subtle roughness across the full ellipsoid; no visible tiling."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1.2, "amplitude": 0.035, "role": "soft value variation over body"}, {"id": "meso", "frequency": 8, "amplitude": 0.012, "role": "barely visible roughness breakup"}, {"id": "micro", "frequency": 48, "amplitude": 0.004, "role": "anti-plastic highlight breakup"}], "roughness": {"base": 0.78, "variation": 0.04, "map": "independent-blue-roughness-field", "localResponse": "slightly smoother on upper front, matte at body/trunk contact"}, "metalness": {"base": 0, "variation": 0}, "normal": {"pattern": "independent ultra-fine procedural grain", "strength": 0.025, "scale": 48, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0, "scale": 1}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.2, "contactShadowBias": 0.22, "notes": "Only at ear bases, trunk root, and rear seam."}, "wear": {"edgeWear": 0, "scratches": [], "chips": []}, "dirt": {"amount": 0, "cavityBias": 0, "color": "#5FB6E7"}, "localOverrides": [{"id": "trunk-root-contact", "region": "trunk root overlap", "roughness": 0.82, "evidenceRefs": ["full-object"]}], "shaderNotes": ["The source is flat icon art; preserve sampled hue and avoid glossy toy highlights.", "Use subtle independent roughness variation only; do not project JPEG lighting or compression artifacts."], "notes": "Flat stylized albedo is intentional and source-faithful."},
    options
  );
  materialMap["white-cap-material"] = createSculptMaterial(
    "white-cap-material",
    {"id": "white-cap-material", "name": "White rear cap", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#FFFFFF", "albedo": {"dominant": "#FFFFFF", "secondary": ["#EEF4F8"], "samplingNotes": "Source rear region and background are white; geometry boundary disambiguates the cap."}, "colorVariation": {"palette": ["#FFFFFF", "#EEF4F8"], "pattern": "soft vertical value", "amplitude": 0.02}, "textureResolution": 1024, "textureProjection": {"mode": "object-space", "repeat": [1, 1], "anisotropy": 8, "texelDensityIntent": "continuous around rear cap"}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1, "amplitude": 0.02, "role": "soft form value"}, {"id": "meso", "frequency": 8, "amplitude": 0.01, "role": "subtle roughness"}, {"id": "micro", "frequency": 48, "amplitude": 0.004, "role": "highlight breakup"}], "roughness": {"base": 0.82, "variation": 0.03, "map": "independent-white-roughness-field"}, "metalness": {"base": 0, "variation": 0}, "normal": {"pattern": "independent fine grain", "strength": 0.02, "scale": 48, "space": "tangent"}, "ambientOcclusion": {"cavityStrength": 0.16, "contactShadowBias": 0.18, "notes": "Concentrate at blue-white seam."}, "localOverrides": [{"id": "blue-white-seam-shadow", "region": "front rim of rear cap", "roughness": 0.86, "evidenceRefs": ["full-object"]}]},
    options
  );
  materialMap["eye-material"] = createSculptMaterial(
    "eye-material",
    {"id": "eye-material", "name": "Pupil-free near-black eye marks", "type": "standard", "shaderModel": "MeshBasicMaterial", "baseColor": "#0D0507", "qualityTier": "utility", "roughness": 1, "metalness": 0, "localOverrides": []},
    options
  );
  materialMap["outline-material"] = createSculptMaterial(
    "outline-material",
    {"id": "outline-material", "name": "Graphic silhouette outline", "type": "standard", "shaderModel": "MeshBasicMaterial back-side inverted hull", "baseColor": "#0D0507", "qualityTier": "utility", "roughness": 1, "metalness": 0, "localOverrides": [{"id": "inverted-hull", "region": "body, ears, trunk, and rear seam silhouettes", "technique": "back-side scaled hull", "evidenceRefs": ["full-object"]}]},
    options
  );
  materialMap["wood-handle-material"] = createSculptMaterial(
    "wood-handle-material",
    {"id": "wood-handle-material", "name": "Dark wooden mallet handle", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#8B5A2B", "albedo": {"dominant": "#8B5A2B", "secondary": ["#683E1F", "#A56D35"], "samplingNotes": "Conservative wood palette; mallet is defined by character canon but absent from source icon."}, "colorVariation": {"palette": ["#8B5A2B", "#683E1F", "#A56D35"], "pattern": "axial wood grain", "amplitude": 0.12}, "textureResolution": 1024, "textureProjection": {"mode": "cylindrical", "repeat": [1, 3], "anisotropy": 8, "texelDensityIntent": "grain follows handle axis"}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1, "amplitude": 0.08, "role": "axial color banding"}, {"id": "meso", "frequency": 9, "amplitude": 0.04, "role": "wood grain"}, {"id": "micro", "frequency": 48, "amplitude": 0.01, "role": "roughness breakup"}], "roughness": {"base": 0.7, "variation": 0.08, "map": "independent-wood-handle-roughness"}, "metalness": {"base": 0, "variation": 0}, "normal": {"pattern": "axial grain", "strength": 0.08, "scale": 24, "space": "tangent"}, "ambientOcclusion": {"cavityStrength": 0.2, "contactShadowBias": 0.2, "notes": "At hand and head sockets."}, "localOverrides": [{"id": "handle-grip-darkening", "region": "hand contact", "roughness": 0.62, "evidenceRefs": ["character-file"]}]},
    options
  );
  materialMap["wood-head-material"] = createSculptMaterial(
    "wood-head-material",
    {"id": "wood-head-material", "name": "Light wooden mallet head", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#C9853D", "albedo": {"dominant": "#C9853D", "secondary": ["#A96D33", "#DE9A4B"], "samplingNotes": "Conservative wood palette; darker end caps are separate shader groups."}, "colorVariation": {"palette": ["#C9853D", "#A96D33", "#DE9A4B"], "pattern": "radial end grain and axial body grain", "amplitude": 0.12}, "textureResolution": 1024, "textureProjection": {"mode": "cylindrical", "repeat": [2, 1], "anisotropy": 8, "texelDensityIntent": "stable grain around mallet head"}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1, "amplitude": 0.08, "role": "end-cap contrast"}, {"id": "meso", "frequency": 10, "amplitude": 0.04, "role": "wood grain"}, {"id": "micro", "frequency": 52, "amplitude": 0.01, "role": "highlight breakup"}], "roughness": {"base": 0.68, "variation": 0.1, "map": "independent-wood-head-roughness"}, "metalness": {"base": 0, "variation": 0}, "normal": {"pattern": "wood grain", "strength": 0.09, "scale": 24, "space": "tangent"}, "ambientOcclusion": {"cavityStrength": 0.2, "contactShadowBias": 0.22, "notes": "At handle bore and dark end caps."}, "localOverrides": [{"id": "mallet-end-caps", "region": "both striking faces", "baseColor": "#8B5A2B", "roughness": 0.74, "evidenceRefs": ["character-file"]}]},
    options
  );
  materialMap["hidden-material"] = createSculptMaterial(
    "hidden-material",
    {"id": "hidden-material", "name": "Invisible runtime container", "type": "standard", "shaderModel": "MeshBasicMaterial", "baseColor": "#000000", "qualityTier": "utility", "roughness": 1, "metalness": 0, "localOverrides": []},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const attachment_root_0 = null;
  const endpoint_root_0 = makeAttachmentEndpoint(attachment_root_0);
  const node_root_0 = new THREE.Group();
  node_root_0.name = "Yumemin runtime root__pivot";
  if (endpoint_root_0) {
    node_root_0.position.copy(endpoint_root_0.start);
    node_root_0.rotation.set(0, 0, 0);
    node_root_0.scale.set(1, 1, 1);
  } else {
    node_root_0.position.set(0.0, 0.0, 0.0);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
    node_root_0.scale.set(1.0, 1.0, 1.0);
  }
  node_root_0.userData.sculptComponent = {"id": "root", "name": "Yumemin runtime root", "level": "macro", "role": "container", "importance": 1.0, "confidence": 1.0, "primitive": "box", "topologyClass": "material-only", "topologyRationale": "This node is a non-rendering transform container for the complete mascot hierarchy.", "parent": null, "attachment": null, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 1.0}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "trunk-socket", "localPosition": [-0.78, -0.2, 0.48], "localRotation": [0, 0, 0]}, {"id": "mallet-shoulder-socket", "localPosition": [1.08, -0.14, 0.2], "localRotation": [0, 0, 0]}], "collider": {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.62], "isTrigger": false, "notes": "Broad mascot-body proxy; excludes mallet and trunk."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": [], "detachableFragments": ["mallet-assembly"], "breakImpulse": 0.0, "debrisMaterial": "blue-body-material"}}, "material": "hidden-material", "materialLayers": ["hidden-material"], "localFeatures": [], "evidenceRefs": ["full-object"], "fidelityTier": "blockout"};
  node_root_0.userData.actionProfile = {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 1.0}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "trunk-socket", "localPosition": [-0.78, -0.2, 0.48], "localRotation": [0, 0, 0]}, {"id": "mallet-shoulder-socket", "localPosition": [1.08, -0.14, 0.2], "localRotation": [0, 0, 0]}], "collider": {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.62], "isTrigger": false, "notes": "Broad mascot-body proxy; excludes mallet and trunk."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": [], "detachableFragments": ["mallet-assembly"], "breakImpulse": 0.0, "debrisMaterial": "blue-body-material"}};
  (nodes["root"] ?? root).add(node_root_0);
  nodes["root"] = node_root_0;
  const mesh_root_0Geometry = endpoint_root_0
    ? new THREE.CylinderGeometry(endpoint_root_0.endRadius, endpoint_root_0.baseRadius, endpoint_root_0.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_root_0 = new THREE.Mesh(
    mesh_root_0Geometry,
    materialMap["hidden-material"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_root_0.name = "Yumemin runtime root";
  if (endpoint_root_0) {
    mesh_root_0.position.copy(endpoint_root_0.midpoint);
    mesh_root_0.quaternion.copy(endpoint_root_0.quaternion);
  }
  mesh_root_0.castShadow = options.castShadow ?? true;
  mesh_root_0.receiveShadow = options.receiveShadow ?? true;
  mesh_root_0.userData.sculptComponent = {"id": "root", "name": "Yumemin runtime root", "level": "macro", "role": "container", "importance": 1.0, "confidence": 1.0, "primitive": "box", "topologyClass": "material-only", "topologyRationale": "This node is a non-rendering transform container for the complete mascot hierarchy.", "parent": null, "attachment": null, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 1.0}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "trunk-socket", "localPosition": [-0.78, -0.2, 0.48], "localRotation": [0, 0, 0]}, {"id": "mallet-shoulder-socket", "localPosition": [1.08, -0.14, 0.2], "localRotation": [0, 0, 0]}], "collider": {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.62], "isTrigger": false, "notes": "Broad mascot-body proxy; excludes mallet and trunk."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": [], "detachableFragments": ["mallet-assembly"], "breakImpulse": 0.0, "debrisMaterial": "blue-body-material"}}, "material": "hidden-material", "materialLayers": ["hidden-material"], "localFeatures": [], "evidenceRefs": ["full-object"], "fidelityTier": "blockout"};
  node_root_0.add(mesh_root_0);
  meshes["root"] = mesh_root_0;
  colliders["root"] = {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.62], "isTrigger": false, "notes": "Broad mascot-body proxy; excludes mallet and trunk."};
  destructionGroups["yumemin-body"] ??= [];
  destructionGroups["yumemin-body"].push(node_root_0);
  const socket_root_trunk_socket_0 = new THREE.Object3D();
  socket_root_trunk_socket_0.name = "trunk-socket";
  socket_root_trunk_socket_0.position.set(-0.78, -0.2, 0.48);
  socket_root_trunk_socket_0.rotation.set(0.0, 0.0, 0.0);
  socket_root_trunk_socket_0.userData.socket = {"id": "trunk-socket", "localPosition": [-0.78, -0.2, 0.48], "localRotation": [0, 0, 0]};
  node_root_0.add(socket_root_trunk_socket_0);
  sockets["root:trunk-socket"] = socket_root_trunk_socket_0;
  const socket_root_mallet_shoulder_socket_1 = new THREE.Object3D();
  socket_root_mallet_shoulder_socket_1.name = "mallet-shoulder-socket";
  socket_root_mallet_shoulder_socket_1.position.set(1.08, -0.14, 0.2);
  socket_root_mallet_shoulder_socket_1.rotation.set(0.0, 0.0, 0.0);
  socket_root_mallet_shoulder_socket_1.userData.socket = {"id": "mallet-shoulder-socket", "localPosition": [1.08, -0.14, 0.2], "localRotation": [0, 0, 0]};
  node_root_0.add(socket_root_mallet_shoulder_socket_1);
  sockets["root:mallet-shoulder-socket"] = socket_root_mallet_shoulder_socket_1;

  const attachment_body_shell_1 = null;
  const endpoint_body_shell_1 = makeAttachmentEndpoint(attachment_body_shell_1);
  const node_body_shell_1 = new THREE.Group();
  node_body_shell_1.name = "Blue rounded body shell__pivot";
  if (endpoint_body_shell_1) {
    node_body_shell_1.position.copy(endpoint_body_shell_1.start);
    node_body_shell_1.rotation.set(0, 0, 0);
    node_body_shell_1.scale.set(1, 1, 1);
  } else {
    node_body_shell_1.position.set(0.0, 0.0, 0.0);
    node_body_shell_1.rotation.set(0.0, 0.0, 0.0);
    node_body_shell_1.scale.set(1.45, 0.93, 0.62);
  }
  node_body_shell_1.userData.sculptComponent = {"id": "body-shell", "name": "Blue rounded body shell", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.93, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "The supplied icon shows one uninterrupted rounded body mass with no torso seam or planar faces.", "geometryDescriptor": {"topologyIntent": "smooth ellipsoid widened along X and shallow along Z", "uvStrategy": "ellipsoid spherical UV", "normalStrategy": "smooth outward vertex normals", "deformationStack": [{"type": "lower-left-notch", "amount": 0.08, "region": "trunk root"}, {"type": "rear-taper", "amount": 0.1, "axis": "+X"}]}, "parent": "root", "attachment": null, "dimensions": {"width": 2.9, "height": 1.86, "depth": 1.24, "units": "world", "confidence": 0.82}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1.45, 0.93, 0.62]}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(95, 182, 231, 1)", "secondaryAlbedo": "rgba(83, 166, 218, 1)", "materialClass": "plastic", "materialClassConfidence": 0.78}, "actionProfile": {"animationRole": "hover-body", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.58], "isTrigger": false}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": ["blue-white-seam"], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "blue-body-material"}}, "material": "blue-body-material", "materialLayers": ["blue-body-material"], "localFeatures": [{"id": "outline-shell", "kind": "contour", "description": "inverted-hull outline follows the body silhouette"}], "evidenceRefs": ["full-object"], "fidelityTier": "blockout"};
  node_body_shell_1.userData.actionProfile = {"animationRole": "hover-body", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.58], "isTrigger": false}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": ["blue-white-seam"], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "blue-body-material"}};
  (nodes["root"] ?? root).add(node_body_shell_1);
  nodes["body-shell"] = node_body_shell_1;
  const mesh_body_shell_1Geometry = endpoint_body_shell_1
    ? new THREE.CylinderGeometry(endpoint_body_shell_1.endRadius, endpoint_body_shell_1.baseRadius, endpoint_body_shell_1.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  const mesh_body_shell_1 = new THREE.Mesh(
    mesh_body_shell_1Geometry,
    materialMap["blue-body-material"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_body_shell_1.name = "Blue rounded body shell";
  if (endpoint_body_shell_1) {
    mesh_body_shell_1.position.copy(endpoint_body_shell_1.midpoint);
    mesh_body_shell_1.quaternion.copy(endpoint_body_shell_1.quaternion);
  }
  mesh_body_shell_1.castShadow = options.castShadow ?? true;
  mesh_body_shell_1.receiveShadow = options.receiveShadow ?? true;
  mesh_body_shell_1.userData.sculptComponent = {"id": "body-shell", "name": "Blue rounded body shell", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.93, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "The supplied icon shows one uninterrupted rounded body mass with no torso seam or planar faces.", "geometryDescriptor": {"topologyIntent": "smooth ellipsoid widened along X and shallow along Z", "uvStrategy": "ellipsoid spherical UV", "normalStrategy": "smooth outward vertex normals", "deformationStack": [{"type": "lower-left-notch", "amount": 0.08, "region": "trunk root"}, {"type": "rear-taper", "amount": 0.1, "axis": "+X"}]}, "parent": "root", "attachment": null, "dimensions": {"width": 2.9, "height": 1.86, "depth": 1.24, "units": "world", "confidence": 0.82}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1.45, 0.93, 0.62]}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(95, 182, 231, 1)", "secondaryAlbedo": "rgba(83, 166, 218, 1)", "materialClass": "plastic", "materialClassConfidence": 0.78}, "actionProfile": {"animationRole": "hover-body", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95}, "transformChannels": {"translate": true, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.58], "isTrigger": false}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": ["blue-white-seam"], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "blue-body-material"}}, "material": "blue-body-material", "materialLayers": ["blue-body-material"], "localFeatures": [{"id": "outline-shell", "kind": "contour", "description": "inverted-hull outline follows the body silhouette"}], "evidenceRefs": ["full-object"], "fidelityTier": "blockout"};
  node_body_shell_1.add(mesh_body_shell_1);
  meshes["body-shell"] = mesh_body_shell_1;
  colliders["body-shell"] = {"type": "ellipsoid", "offset": [0, 0, 0], "scale": [1.35, 0.86, 0.58], "isTrigger": false};
  destructionGroups["yumemin-body"] ??= [];
  destructionGroups["yumemin-body"].push(node_body_shell_1);

  const attachment_trunk_pivot_2 = {"parentId": "body-shell", "parentSocket": "trunk-socket", "localStart": [-0.72, -0.18, 0.45], "localEnd": [-1.12, -0.78, 0.58], "baseRadius": 0.28, "endRadius": 0.12, "embedDepth": 0.08, "contactType": "embedded", "gapTolerance": 0.01, "evidenceRefs": ["full-object"]};
  const endpoint_trunk_pivot_2 = makeAttachmentEndpoint(attachment_trunk_pivot_2);
  const node_trunk_pivot_2 = new THREE.Group();
  node_trunk_pivot_2.name = "Flexible tapir trunk__pivot";
  if (endpoint_trunk_pivot_2) {
    node_trunk_pivot_2.position.copy(endpoint_trunk_pivot_2.start);
    node_trunk_pivot_2.rotation.set(0, 0, 0);
    node_trunk_pivot_2.scale.set(1, 1, 1);
  } else {
    node_trunk_pivot_2.position.set(-0.72, -0.18, 0.45);
    node_trunk_pivot_2.rotation.set(0.0, 0.0, -0.2);
    node_trunk_pivot_2.scale.set(1.0, 1.0, 1.0);
  }
  node_trunk_pivot_2.userData.sculptComponent = {"id": "trunk-pivot", "name": "Flexible tapir trunk", "level": "macro", "role": "appendage", "importance": 1.0, "confidence": 0.9, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "The source shows a continuously curved, tapered organic tube leaving the lower-left face.", "geometryDescriptor": {"topologyIntent": "tapered tube swept through a four-point 3D curve", "spine": [[0, 0, 0], [-0.12, -0.14, 0.08], [-0.16, -0.42, 0.12], [-0.05, -0.64, 0.08]], "crossSection": {"points": [[-0.14, 0], [0, 0.14], [0.14, 0], [0, -0.14]]}, "closed": false, "uvStrategy": "curve length by circumference", "normalStrategy": "parallel-transport sweep normals", "deformationStack": [{"type": "tip-taper", "start": 0.38, "end": 0.11}]}, "parent": "body-shell", "attachment": {"parentId": "body-shell", "parentSocket": "trunk-socket", "localStart": [-0.72, -0.18, 0.45], "localEnd": [-1.12, -0.78, 0.58], "baseRadius": 0.28, "endRadius": 0.12, "embedDepth": 0.08, "contactType": "embedded", "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"length": 0.86, "radius": 0.28, "units": "world", "confidence": 0.84}, "transform": {"position": [-0.72, -0.18, 0.45], "rotation": [0, 0, -0.2], "scale": [1, 1, 1]}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(95, 182, 231, 1)", "secondaryAlbedo": "rgba(74, 151, 202, 1)", "materialClass": "plastic", "materialClassConfidence": 0.75}, "actionProfile": {"animationRole": "trunk-sway", "pivot": {"mode": "branch-root", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.95}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": true, "twist": true, "detach": false, "visibility": true, "materialState": false}, "sockets": [{"id": "trunk-tip", "localPosition": [-0.05, -0.64, 0.08], "localRotation": [0, 0, 0]}], "collider": {"type": "capsule", "offset": [-0.1, -0.31, 0.08], "scale": [0.22, 0.72, 0.22], "isTrigger": false}, "constraints": [{"type": "rotation-limit", "axis": "z", "min": -0.28, "max": 0.28}], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": ["trunk-root"], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "blue-body-material"}}, "material": "blue-body-material", "materialLayers": ["blue-body-material"], "localFeatures": [{"id": "tapered-curved-sweep", "kind": "contour", "description": "animated continuous tube tapers toward the tip"}], "evidenceRefs": ["full-object"], "fidelityTier": "blockout"};
  node_trunk_pivot_2.userData.actionProfile = {"animationRole": "trunk-sway", "pivot": {"mode": "branch-root", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.95}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": true, "twist": true, "detach": false, "visibility": true, "materialState": false}, "sockets": [{"id": "trunk-tip", "localPosition": [-0.05, -0.64, 0.08], "localRotation": [0, 0, 0]}], "collider": {"type": "capsule", "offset": [-0.1, -0.31, 0.08], "scale": [0.22, 0.72, 0.22], "isTrigger": false}, "constraints": [{"type": "rotation-limit", "axis": "z", "min": -0.28, "max": 0.28}], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": ["trunk-root"], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "blue-body-material"}};
  (nodes["body-shell"] ?? root).add(node_trunk_pivot_2);
  nodes["trunk-pivot"] = node_trunk_pivot_2;
  const mesh_trunk_pivot_2Geometry = endpoint_trunk_pivot_2
    ? new THREE.CylinderGeometry(endpoint_trunk_pivot_2.endRadius, endpoint_trunk_pivot_2.baseRadius, endpoint_trunk_pivot_2.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-0.5, -0.4, 0.0], [-0.1, 0.1, 0.0], [0.3, 0.2, 0.0], [0.6, -0.1, 0.0]], "crossSection": {"points": [[-0.04, -0.02], [0.04, -0.02], [0.04, 0.02], [-0.04, 0.02]]}, "closed": false});
  const mesh_trunk_pivot_2 = new THREE.Mesh(
    mesh_trunk_pivot_2Geometry,
    materialMap["blue-body-material"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_trunk_pivot_2.name = "Flexible tapir trunk";
  if (endpoint_trunk_pivot_2) {
    mesh_trunk_pivot_2.position.copy(endpoint_trunk_pivot_2.midpoint);
    mesh_trunk_pivot_2.quaternion.copy(endpoint_trunk_pivot_2.quaternion);
  }
  mesh_trunk_pivot_2.castShadow = options.castShadow ?? true;
  mesh_trunk_pivot_2.receiveShadow = options.receiveShadow ?? true;
  mesh_trunk_pivot_2.userData.sculptComponent = {"id": "trunk-pivot", "name": "Flexible tapir trunk", "level": "macro", "role": "appendage", "importance": 1.0, "confidence": 0.9, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "The source shows a continuously curved, tapered organic tube leaving the lower-left face.", "geometryDescriptor": {"topologyIntent": "tapered tube swept through a four-point 3D curve", "spine": [[0, 0, 0], [-0.12, -0.14, 0.08], [-0.16, -0.42, 0.12], [-0.05, -0.64, 0.08]], "crossSection": {"points": [[-0.14, 0], [0, 0.14], [0.14, 0], [0, -0.14]]}, "closed": false, "uvStrategy": "curve length by circumference", "normalStrategy": "parallel-transport sweep normals", "deformationStack": [{"type": "tip-taper", "start": 0.38, "end": 0.11}]}, "parent": "body-shell", "attachment": {"parentId": "body-shell", "parentSocket": "trunk-socket", "localStart": [-0.72, -0.18, 0.45], "localEnd": [-1.12, -0.78, 0.58], "baseRadius": 0.28, "endRadius": 0.12, "embedDepth": 0.08, "contactType": "embedded", "gapTolerance": 0.01, "evidenceRefs": ["full-object"]}, "dimensions": {"length": 0.86, "radius": 0.28, "units": "world", "confidence": 0.84}, "transform": {"position": [-0.72, -0.18, 0.45], "rotation": [0, 0, -0.2], "scale": [1, 1, 1]}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(95, 182, 231, 1)", "secondaryAlbedo": "rgba(74, 151, 202, 1)", "materialClass": "plastic", "materialClassConfidence": 0.75}, "actionProfile": {"animationRole": "trunk-sway", "pivot": {"mode": "branch-root", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.95}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": true, "twist": true, "detach": false, "visibility": true, "materialState": false}, "sockets": [{"id": "trunk-tip", "localPosition": [-0.05, -0.64, 0.08], "localRotation": [0, 0, 0]}], "collider": {"type": "capsule", "offset": [-0.1, -0.31, 0.08], "scale": [0.22, 0.72, 0.22], "isTrigger": false}, "constraints": [{"type": "rotation-limit", "axis": "z", "min": -0.28, "max": 0.28}], "destruction": {"breakable": false, "fractureGroup": "yumemin-body", "seamRefs": ["trunk-root"], "detachableFragments": [], "breakImpulse": 0, "debrisMaterial": "blue-body-material"}}, "material": "blue-body-material", "materialLayers": ["blue-body-material"], "localFeatures": [{"id": "tapered-curved-sweep", "kind": "contour", "description": "animated continuous tube tapers toward the tip"}], "evidenceRefs": ["full-object"], "fidelityTier": "blockout"};
  node_trunk_pivot_2.add(mesh_trunk_pivot_2);
  meshes["trunk-pivot"] = mesh_trunk_pivot_2;
  colliders["trunk-pivot"] = {"type": "capsule", "offset": [-0.1, -0.31, 0.08], "scale": [0.22, 0.72, 0.22], "isTrigger": false};
  destructionGroups["yumemin-body"] ??= [];
  destructionGroups["yumemin-body"].push(node_trunk_pivot_2);
  const socket_trunk_pivot_trunk_tip_0 = new THREE.Object3D();
  socket_trunk_pivot_trunk_tip_0.name = "trunk-tip";
  socket_trunk_pivot_trunk_tip_0.position.set(-0.05, -0.64, 0.08);
  socket_trunk_pivot_trunk_tip_0.rotation.set(0.0, 0.0, 0.0);
  socket_trunk_pivot_trunk_tip_0.userData.socket = {"id": "trunk-tip", "localPosition": [-0.05, -0.64, 0.08], "localRotation": [0, 0, 0]};
  node_trunk_pivot_2.add(socket_trunk_pivot_trunk_tip_0);
  sockets["trunk-pivot:trunk-tip"] = socket_trunk_pivot_trunk_tip_0;

  const attachment_mallet_assembly_3 = null;
  const endpoint_mallet_assembly_3 = makeAttachmentEndpoint(attachment_mallet_assembly_3);
  const node_mallet_assembly_3 = new THREE.Group();
  node_mallet_assembly_3.name = "BONK mallet assembly__pivot";
  if (endpoint_mallet_assembly_3) {
    node_mallet_assembly_3.position.copy(endpoint_mallet_assembly_3.start);
    node_mallet_assembly_3.rotation.set(0, 0, 0);
    node_mallet_assembly_3.scale.set(1, 1, 1);
  } else {
    node_mallet_assembly_3.position.set(1.08, -0.14, 0.18);
    node_mallet_assembly_3.rotation.set(0.0, 0.0, -0.28);
    node_mallet_assembly_3.scale.set(1.0, 1.0, 1.0);
  }
  node_mallet_assembly_3.userData.sculptComponent = {"id": "mallet-assembly", "name": "BONK mallet assembly", "level": "macro", "role": "assembly", "importance": 0.9, "confidence": 0.58, "primitive": "box", "topologyClass": "material-only", "topologyRationale": "This is a non-rendering pivot container for the arm, handle, head, and impact socket.", "parent": "root", "attachment": null, "transform": {"position": [1.08, -0.14, 0.18], "rotation": [0, 0, -0.28], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "mallet-swing", "pivot": {"mode": "hinge", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.78}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": false}, "sockets": [{"id": "mallet-impact", "localPosition": [0.86, -0.54, 0], "localRotation": [0, 0, 0]}], "collider": {"type": "compound", "offset": [0.4, -0.28, 0], "scale": [1, 1, 1], "isTrigger": false}, "constraints": [{"type": "rotation-limit", "axis": "z", "min": -1.1, "max": 0.35}], "destruction": {"breakable": true, "fractureGroup": "mallet", "seamRefs": ["mallet-shoulder"], "detachableFragments": ["mallet-arm", "mallet-handle", "mallet-head"], "breakImpulse": 4, "debrisMaterial": "wood-head-material"}}, "material": "hidden-material", "materialLayers": ["hidden-material"], "localFeatures": [], "evidenceRefs": ["character-file"], "fidelityTier": "blockout"};
  node_mallet_assembly_3.userData.actionProfile = {"animationRole": "mallet-swing", "pivot": {"mode": "hinge", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.78}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": false}, "sockets": [{"id": "mallet-impact", "localPosition": [0.86, -0.54, 0], "localRotation": [0, 0, 0]}], "collider": {"type": "compound", "offset": [0.4, -0.28, 0], "scale": [1, 1, 1], "isTrigger": false}, "constraints": [{"type": "rotation-limit", "axis": "z", "min": -1.1, "max": 0.35}], "destruction": {"breakable": true, "fractureGroup": "mallet", "seamRefs": ["mallet-shoulder"], "detachableFragments": ["mallet-arm", "mallet-handle", "mallet-head"], "breakImpulse": 4, "debrisMaterial": "wood-head-material"}};
  (nodes["root"] ?? root).add(node_mallet_assembly_3);
  nodes["mallet-assembly"] = node_mallet_assembly_3;
  const mesh_mallet_assembly_3Geometry = endpoint_mallet_assembly_3
    ? new THREE.CylinderGeometry(endpoint_mallet_assembly_3.endRadius, endpoint_mallet_assembly_3.baseRadius, endpoint_mallet_assembly_3.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_mallet_assembly_3 = new THREE.Mesh(
    mesh_mallet_assembly_3Geometry,
    materialMap["hidden-material"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_mallet_assembly_3.name = "BONK mallet assembly";
  if (endpoint_mallet_assembly_3) {
    mesh_mallet_assembly_3.position.copy(endpoint_mallet_assembly_3.midpoint);
    mesh_mallet_assembly_3.quaternion.copy(endpoint_mallet_assembly_3.quaternion);
  }
  mesh_mallet_assembly_3.castShadow = options.castShadow ?? true;
  mesh_mallet_assembly_3.receiveShadow = options.receiveShadow ?? true;
  mesh_mallet_assembly_3.userData.sculptComponent = {"id": "mallet-assembly", "name": "BONK mallet assembly", "level": "macro", "role": "assembly", "importance": 0.9, "confidence": 0.58, "primitive": "box", "topologyClass": "material-only", "topologyRationale": "This is a non-rendering pivot container for the arm, handle, head, and impact socket.", "parent": "root", "attachment": null, "transform": {"position": [1.08, -0.14, 0.18], "rotation": [0, 0, -0.28], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "mallet-swing", "pivot": {"mode": "hinge", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.78}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": true, "visibility": true, "materialState": false}, "sockets": [{"id": "mallet-impact", "localPosition": [0.86, -0.54, 0], "localRotation": [0, 0, 0]}], "collider": {"type": "compound", "offset": [0.4, -0.28, 0], "scale": [1, 1, 1], "isTrigger": false}, "constraints": [{"type": "rotation-limit", "axis": "z", "min": -1.1, "max": 0.35}], "destruction": {"breakable": true, "fractureGroup": "mallet", "seamRefs": ["mallet-shoulder"], "detachableFragments": ["mallet-arm", "mallet-handle", "mallet-head"], "breakImpulse": 4, "debrisMaterial": "wood-head-material"}}, "material": "hidden-material", "materialLayers": ["hidden-material"], "localFeatures": [], "evidenceRefs": ["character-file"], "fidelityTier": "blockout"};
  node_mallet_assembly_3.add(mesh_mallet_assembly_3);
  meshes["mallet-assembly"] = mesh_mallet_assembly_3;
  colliders["mallet-assembly"] = {"type": "compound", "offset": [0.4, -0.28, 0], "scale": [1, 1, 1], "isTrigger": false};
  destructionGroups["mallet"] ??= [];
  destructionGroups["mallet"].push(node_mallet_assembly_3);
  const socket_mallet_assembly_mallet_impact_0 = new THREE.Object3D();
  socket_mallet_assembly_mallet_impact_0.name = "mallet-impact";
  socket_mallet_assembly_mallet_impact_0.position.set(0.86, -0.54, 0.0);
  socket_mallet_assembly_mallet_impact_0.rotation.set(0.0, 0.0, 0.0);
  socket_mallet_assembly_mallet_impact_0.userData.socket = {"id": "mallet-impact", "localPosition": [0.86, -0.54, 0], "localRotation": [0, 0, 0]};
  node_mallet_assembly_3.add(socket_mallet_assembly_mallet_impact_0);
  sockets["mallet-assembly:mallet-impact"] = socket_mallet_assembly_mallet_impact_0;

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": false, "targetThreshold": 0.7, "stopOnLowConfidence": false, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "The source is flat JPEG icon art with no recoverable physical lighting. Exact sampled albedo plus authored matte response is more faithful than deriving PBR maps from compression artifacts."}, "mustAvoid": ["unjustified albedo gradients that change the flat icon identity", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createYumeminLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "Yumemin look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [{"id": "key-light", "type": "directional", "direction": [-3, 5, 6], "colorTemperature": 5600, "intensity": 2.4, "shadowSoftness": 0.55, "note": "Broad neutral key that explains the rounded volume without changing the sampled blue."}, {"id": "fill-light", "type": "hemisphere", "skyColor": "#DDEEFF", "groundColor": "#D4D9E2", "intensity": 1.35, "note": "Cool-soft fill preserves the flat graphic value range."}, {"id": "rim-and-exposure", "type": "directional+renderer", "direction": [4, 2, -5], "color": "#FFFFFF", "intensity": 1.2, "toneMapping": "ACESFilmic", "exposure": 1.08, "background": "#F5F7FB", "contactShadow": "soft circular ground shadow at 0.16 opacity while the model visibly hovers above it"}];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": false, "targetThreshold": 0.7, "stopOnLowConfidence": false, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "The source is flat JPEG icon art with no recoverable physical lighting. Exact sampled albedo plus authored matte response is more faithful than deriving PBR maps from compression artifacts."}, "mustAvoid": ["unjustified albedo gradients that change the flat icon identity", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createYumeminEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function frameYumeminCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createYumeminPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}

export function configureYumeminRenderer(renderer: THREE.WebGLRenderer): void {
  // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
  // the environment reflection reads flat/washed instead of a believable metal response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function createYumeminInspectControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
): OrbitControls {
  // View-dependent finishes only read correctly once the user orbits — their color
  // comes from the environment reflection, not albedo, so free rotation matters here.
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.autoRotate = false;
  return controls;
}
