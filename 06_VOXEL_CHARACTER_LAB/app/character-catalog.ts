import {
  STANDARD_BIPED_MOTION,
  STANDARD_RIG,
  type VoxelCharacterDefinition,
} from "./lib/voxel-character-kit";

export type CharacterStatus = "ready" | "planned";

export type CharacterCatalogEntry = VoxelCharacterDefinition & {
  name: string;
  englishName: string;
  role: string;
  referenceImage: string;
  accent: string;
  status: CharacterStatus;
  bodyType: string;
  rigLabel: string;
  note: string;
};

const standardBipedRig = {
  primaryArm: [STANDARD_RIG.primaryArm],
  secondaryArm: [STANDARD_RIG.secondaryArm],
  leftLeg: [STANDARD_RIG.leftLeg],
  rightLeg: [STANDARD_RIG.rightLeg],
  locomotionExtras: [STANDARD_RIG.locomotionPrefix],
};

export const CHARACTERS: CharacterCatalogEntry[] = [
  {
    id: "sobaya",
    name: "そば屋",
    englishName: "SOBAYA",
    role: "POWER TYPE",
    referenceImage: "/characters/sobaya.jpg",
    accent: "#ffb21a",
    status: "ready",
    bodyType: "大型・二足",
    rigLabel: "BIPED / 4 PIVOTS",
    note: "仮面とビールジョッキを維持。歩行とスマッシュを実機確認できます。",
    modelUrl: "/models/sobaya.glb?v=character-lab-1",
    scale: 1.52,
    rotationY: Math.PI,
    rig: standardBipedRig,
    motion: { ...STANDARD_BIPED_MOTION },
  },
  {
    id: "takosan",
    name: "たこさん",
    englishName: "TAKOSAN",
    role: "TENTACLE TYPE",
    referenceImage: "/characters/takosan.png",
    accent: "#8c7bff",
    status: "ready",
    bodyType: "触手・浮遊",
    rigLabel: "TENTACLED / 8 PIVOTS",
    note: "正方形頭、装飾ローブのテクスチャ、人間の腕2本、6本の段状触手を維持。",
    modelUrl: "/models/takosan.glb?v=square-head-3",
    scale: 1.3,
    rotationY: Math.PI,
    rig: {
      primaryArm: [STANDARD_RIG.primaryArm],
      secondaryArm: [STANDARD_RIG.secondaryArm],
      locomotionExtras: [STANDARD_RIG.locomotionPrefix],
    },
    motion: {
      ...STANDARD_BIPED_MOTION,
      strideAngle: 0,
      extraLocomotionAngle: 0.34,
      walkFrequency: 8.2,
    },
  },
  {
    id: "yametaro",
    name: "無職やめ太郎",
    englishName: "YAMETARO",
    role: "COMEDY TYPE",
    referenceImage: "/characters/yametaro.jpg",
    accent: "#ff68aa",
    status: "ready",
    bodyType: "小型・二足",
    rigLabel: "BIPED / 4 PIVOTS",
    note: "正方形頭と横分け髪。黒目なしの純白レンズ、ピンク頬、襟込みシャツをテクスチャ化。",
    modelUrl: "/models/yametaro.glb?v=square-head-3",
    scale: 1.2,
    rotationY: Math.PI,
    rig: standardBipedRig,
    motion: {
      ...STANDARD_BIPED_MOTION,
      strideAngle: 0.4,
      walkFrequency: 13.5,
      windupAngle: 0.92,
      secondaryArmRecoil: 0.34,
    },
  },
];
