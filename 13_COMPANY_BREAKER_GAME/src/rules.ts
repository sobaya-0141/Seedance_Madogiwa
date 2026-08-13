import type {
  BlockSpec,
  MaterialKind,
  MaterialSpec,
  SavedProgress,
  StageDefinition,
  StageId,
} from "./types.js";

export const SAVE_KEY = "sobaya-company-breaker-3d-progress-v1";

export const MATERIALS: Record<MaterialKind, MaterialSpec> = {
  drywall: {
    color: 0xe9e3d2,
    edgeColor: 0x8d8372,
    density: 0.48,
    health: 24,
    score: 90,
    friction: 0.72,
    restitution: 0.08,
    roughness: 0.94,
    metalness: 0,
  },
  glass: {
    color: 0x55bfd4,
    edgeColor: 0xd5fbff,
    density: 0.68,
    health: 18,
    score: 130,
    friction: 0.38,
    restitution: 0.16,
    roughness: 0.18,
    metalness: 0.08,
    transparent: true,
  },
  wood: {
    color: 0xaa5e2f,
    edgeColor: 0x502612,
    density: 0.82,
    health: 38,
    score: 150,
    friction: 0.86,
    restitution: 0.1,
    roughness: 0.82,
    metalness: 0,
  },
  concrete: {
    color: 0x737b82,
    edgeColor: 0x343b41,
    density: 2.2,
    health: 68,
    score: 230,
    friction: 0.94,
    restitution: 0.04,
    roughness: 0.96,
    metalness: 0,
  },
  steel: {
    color: 0x263a4b,
    edgeColor: 0x9eb3c2,
    density: 4.1,
    health: 112,
    score: 380,
    friction: 0.64,
    restitution: 0.08,
    roughness: 0.38,
    metalness: 0.82,
  },
};

function makeBlock(
  id: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  material: MaterialKind,
  structural = true,
  label?: string,
): BlockSpec {
  return {
    id,
    position: [x, y, z],
    size: [width, height, depth],
    material,
    structural,
    label,
  };
}

interface WallOptions {
  prefix: string;
  columns: number;
  rows: number;
  centerX?: number;
  frontZ?: number;
  backZ?: number;
  blockWidth?: number;
  blockHeight?: number;
  blockDepth?: number;
  materialAt(column: number, row: number, layer: number): MaterialKind;
  skip?: (column: number, row: number, layer: number) => boolean;
}

function addBrickWall(blocks: BlockSpec[], options: WallOptions): void {
  const width = options.blockWidth ?? 1.08;
  const height = options.blockHeight ?? 0.66;
  const depth = options.blockDepth ?? 0.82;
  const gapX = 0.025;
  const gapY = 0.018;
  const centerX = options.centerX ?? 0;
  const zLayers = [options.frontZ ?? 0.64, options.backZ ?? -0.64];
  const totalWidth = options.columns * width + (options.columns - 1) * gapX;

  for (let layer = 0; layer < zLayers.length; layer += 1) {
    for (let row = 0; row < options.rows; row += 1) {
      for (let column = 0; column < options.columns; column += 1) {
        if (options.skip?.(column, row, layer)) continue;
        const stagger = row % 2 === 0 ? 0 : width * 0.17;
        const x = centerX - totalWidth / 2 + width / 2 + column * (width + gapX) + stagger;
        const y = height / 2 + row * (height + gapY) + 0.04;
        blocks.push(
          makeBlock(
            `${options.prefix}-${layer}-${row}-${column}`,
            x,
            y,
            zLayers[layer],
            width,
            height,
            depth,
            options.materialAt(column, row, layer),
          ),
        );
      }
    }
  }
}

function addRoof(
  blocks: BlockSpec[],
  prefix: string,
  width: number,
  y: number,
  material: MaterialKind,
): void {
  const segments = Math.ceil(width / 1.3);
  const segmentWidth = width / segments;
  for (let index = 0; index < segments; index += 1) {
    const x = -width / 2 + segmentWidth / 2 + index * segmentWidth;
    blocks.push(makeBlock(`${prefix}-${index}`, x, y, 0, segmentWidth - 0.025, 0.28, 2.35, material));
  }
}

function addInteriorProps(blocks: BlockSpec[], prefix: string, y = 0.32): void {
  const props: Array<[number, number, MaterialKind, string]> = [
    [-2.2, 0, "wood", "desk-left"],
    [0, -0.05, "wood", "meeting"],
    [2.2, 0.1, "wood", "desk-right"],
  ];
  for (const [x, z, material, label] of props) {
    blocks.push(makeBlock(`${prefix}-${label}-top`, x, y + 0.48, z, 1.55, 0.18, 0.86, material, false));
    blocks.push(makeBlock(`${prefix}-${label}-leg-a`, x - 0.54, y, z, 0.16, 0.8, 0.16, "steel", false));
    blocks.push(makeBlock(`${prefix}-${label}-leg-b`, x + 0.54, y, z, 0.16, 0.8, 0.16, "steel", false));
  }
}

function buildMeetingMockup(): BlockSpec[] {
  const blocks: BlockSpec[] = [];
  addBrickWall(blocks, {
    prefix: "meeting",
    columns: 9,
    rows: 6,
    materialAt: (column, row) => {
      if (row === 0) return column === 0 || column === 8 ? "concrete" : "wood";
      if (column === 0 || column === 8) return "concrete";
      return (column + row) % 2 === 0 ? "glass" : "drywall";
    },
  });
  addRoof(blocks, "meeting-roof", 10.2, 4.28, "wood");
  blocks.push(makeBlock("meeting-sign", 0, 4.84, 0.08, 3.25, 0.68, 0.42, "drywall", false, "MEETING"));
  addInteriorProps(blocks, "meeting-prop");
  return blocks;
}

function buildAeronTower(): BlockSpec[] {
  const blocks: BlockSpec[] = [];
  addBrickWall(blocks, {
    prefix: "aeron",
    columns: 10,
    rows: 8,
    blockHeight: 0.63,
    materialAt: (column, row, layer) => {
      if (row === 0 && column % 3 === 0) return "steel";
      if (column === 0 || column === 9) return row < 3 ? "steel" : "concrete";
      if ((column === 3 || column === 6) && row % 2 === 0) return "wood";
      return (column + row + layer) % 3 === 0 ? "glass" : "drywall";
    },
  });
  addRoof(blocks, "aeron-roof", 11.2, 5.26, "steel");
  blocks.push(makeBlock("aeron-chair-seat", 0, 5.75, 0, 1.5, 0.26, 1.2, "wood", false));
  blocks.push(makeBlock("aeron-chair-back", 0, 6.35, -0.46, 1.5, 1, 0.24, "wood", false, "CHUA"));
  addInteriorProps(blocks, "aeron-prop");
  return blocks;
}

function buildWindowFort(): BlockSpec[] {
  const blocks: BlockSpec[] = [];
  for (const centerX of [-3.45, 3.45]) {
    addBrickWall(blocks, {
      prefix: centerX < 0 ? "fort-left" : "fort-right",
      columns: 5,
      rows: 9,
      centerX,
      blockWidth: 1.02,
      blockHeight: 0.61,
      materialAt: (column, row, layer) => {
        if (row === 0 || column === (centerX < 0 ? 0 : 4)) return "concrete";
        if (row % 4 === 0 && column === 2) return "steel";
        return (column + row + layer) % 2 === 0 ? "glass" : "drywall";
      },
    });
  }
  const bridgeY = 3.75;
  for (let index = 0; index < 5; index += 1) {
    blocks.push(makeBlock(`fort-bridge-${index}`, -1.8 + index * 0.9, bridgeY, 0, 0.86, 0.34, 2.2, index === 2 ? "wood" : "steel"));
  }
  addRoof(blocks, "fort-roof-left", 5.45, 5.67, "steel");
  for (const block of blocks.filter((candidate) => candidate.id.startsWith("fort-roof-left"))) {
    block.position = [block.position[0] - 3.45, block.position[1], block.position[2]];
  }
  const rightRoof: BlockSpec[] = [];
  addRoof(rightRoof, "fort-roof-right", 5.45, 5.67, "steel");
  for (const block of rightRoof) {
    block.position = [block.position[0] + 3.45, block.position[1], block.position[2]];
  }
  blocks.push(...rightRoof);
  blocks.push(makeBlock("fort-lantern", 0, 4.42, 0, 0.72, 0.82, 0.72, "drywall", false, "乾杯"));
  return blocks;
}

function buildRegulationHq(): BlockSpec[] {
  const blocks: BlockSpec[] = [];
  addBrickWall(blocks, {
    prefix: "regulation",
    columns: 12,
    rows: 9,
    blockWidth: 0.96,
    blockHeight: 0.59,
    materialAt: (column, row, layer) => {
      if (row === 0 || column === 0 || column === 11) return "steel";
      if ((column === 3 || column === 8) && row < 7) return "steel";
      if (row === 5) return "concrete";
      if ((column + row + layer) % 4 === 0) return "glass";
      return row < 2 ? "concrete" : "drywall";
    },
  });
  addRoof(blocks, "regulation-roof", 12.2, 5.58, "steel");
  blocks.push(makeBlock("regulation-screen", 0, 6.28, 0, 3.8, 1.04, 0.44, "glass", false, "OKAYAMAN"));
  blocks.push(makeBlock("regulation-antenna", 0, 7.1, -0.1, 0.28, 0.86, 0.28, "steel", false));
  addInteriorProps(blocks, "regulation-prop");
  return blocks;
}

export const STAGES: readonly StageDefinition[] = [
  {
    id: 1,
    name: "会議室モックアップ",
    englishName: "MEETING MOCKUP",
    description: "乾式壁とガラスの入門棟。低い柱を抜いて自重崩壊を起こす。",
    objective: "基礎の木材か、左右のコンクリート柱を狙え",
    turns: 10,
    clearRatio: 0.34,
    difficulty: 1,
    accent: 0xf5bd55,
    accentCss: "#f5bd55",
    skyTop: 0x17293a,
    skyBottom: 0xd99b63,
    build: buildMeetingMockup,
  },
  {
    id: 2,
    name: "アーロンチュア棟",
    englishName: "AERON CHUA TOWER",
    description: "軽い壁の内部を鉄骨が支える高層棟。荷重の流れを見極める。",
    objective: "鉄骨の間にある木製ジョイントを連続で破壊",
    turns: 10,
    clearRatio: 0.31,
    difficulty: 2,
    accent: 0xff8754,
    accentCss: "#ff8754",
    skyTop: 0x162b43,
    skyBottom: 0xc96753,
    build: buildAeronTower,
  },
  {
    id: 3,
    name: "窓際フォート",
    englishName: "WINDOW FORT",
    description: "2棟が重量級の空中橋で連結。片側の倒壊がもう片側へ伝わる。",
    objective: "橋の中央と塔の内側支柱で連鎖を作れ",
    turns: 10,
    clearRatio: 0.28,
    difficulty: 3,
    accent: 0xe87bd0,
    accentCss: "#e87bd0",
    skyTop: 0x211a37,
    skyBottom: 0xa45877,
    build: buildWindowFort,
  },
  {
    id: 4,
    name: "レギュレーション本部",
    englishName: "REGULATION HQ",
    description: "高密度コンクリートと鉄骨の最終棟。超乾杯ジョッキが突破口。",
    objective: "中央鉄骨へ超乾杯ジョッキを直撃させろ",
    turns: 10,
    clearRatio: 0.25,
    difficulty: 4,
    accent: 0x63ddff,
    accentCss: "#63ddff",
    skyTop: 0x080f22,
    skyBottom: 0x423c6b,
    build: buildRegulationHq,
  },
] as const;

export function stageById(id: StageId): StageDefinition {
  const stage = STAGES.find((candidate) => candidate.id === id);
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

export function defaultProgress(): SavedProgress {
  return { unlockedStage: 1, bestScores: {} };
}

export function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      unlockedStage: Math.max(1, Math.min(4, Number(parsed.unlockedStage) || 1)) as StageId,
      bestScores: parsed.bestScores ?? {},
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: SavedProgress): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
}
