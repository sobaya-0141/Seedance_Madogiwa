import * as THREE from "three";
import {
  STANDARD_BIPED_MOTION,
  STANDARD_VOXEL_RIG_NODES,
  type VoxelActionController,
  type VoxelCharacterDefinition,
} from "./voxel-character-kit";
import {
  createYumeminModel,
  type YumeminRuntime,
} from "../../../04_GAME_ASSETS/threejs/yumemin-img2threejs/src/createYumeminModel";

export type CharacterBossId =
  | "yotan"
  | "tokun"
  | "fukuchan"
  | "yumemin"
  | "takosan"
  | "yametaro"
  | "okayaman";

export type CharacterBossDefinition = {
  id: CharacterBossId;
  displayName: string;
  title: string;
  specialName: string;
  introLine: string;
  defeatLine: string;
  color: number;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  points: number;
  healthY: number;
  model: VoxelCharacterDefinition;
};

const sharedRig = {
  primaryArm: [STANDARD_VOXEL_RIG_NODES.primaryArm],
  secondaryArm: [STANDARD_VOXEL_RIG_NODES.secondaryArm],
  leftLeg: [STANDARD_VOXEL_RIG_NODES.leftLeg],
  rightLeg: [STANDARD_VOXEL_RIG_NODES.rightLeg],
  locomotionExtras: [STANDARD_VOXEL_RIG_NODES.locomotionPrefix],
};

const makeModel = (
  id: CharacterBossId,
  scale: number,
  motion: Partial<typeof STANDARD_BIPED_MOTION> = {},
): VoxelCharacterDefinition => ({
  id,
  assetUrl: `/models/${id}.glb?v=madogiwa-boss-1`,
  modelName: `${id}-boss-model`,
  scale,
  // Canonical Blender sources face -Y and export toward +Z in glTF.
  rotationY: Math.PI,
  rig: sharedRig,
  motion: {
    ...STANDARD_BIPED_MOTION,
    ...motion,
  },
});

const makeYumeminV3Model = (): VoxelCharacterDefinition => ({
  id: "yumemin-v3",
  modelName: "yumemin-v3-boss-model",
  scale: 1.12,
  // The v3 factory faces +Z. This cancels the shared boss container's PI turn.
  rotationY: Math.PI,
  rig: {
    primaryArm: ["mallet-assembly__pivot"],
    locomotionExtras: ["trunk-pivot"],
  },
  motion: {
    ...STANDARD_BIPED_MOTION,
    smashDuration: 0.52,
    windupAngle: 1.15,
    impactAngle: -1.7,
  },
  modelFactory: () => {
    const model = createYumeminModel({
      castShadow: true,
      receiveShadow: true,
      includeMallet: true,
      outlines: false,
    });
    model.position.y = 1.38;
    model.userData.assetVersion = "yumemin-v3";
    return model;
  },
  actionFactory: (model): VoxelActionController | undefined => {
    const sculptRuntime = model.userData.sculptRuntime as YumeminRuntime | undefined;
    if (!sculptRuntime) return undefined;
    const bonkDuration = 0.52;
    let bonkElapsed = bonkDuration + 1;
    sculptRuntime.setMalletVisible(false);
    return {
      triggerSmash: () => {
        bonkElapsed = 0;
        sculptRuntime.setMalletVisible(true);
      },
      update: (dt, elapsed) => {
        bonkElapsed += dt;
        const active = bonkElapsed < bonkDuration;
        sculptRuntime.tick(
          elapsed,
          active ? THREE.MathUtils.clamp(bonkElapsed / bonkDuration, 0, 1) : 1,
        );
        if (!active) sculptRuntime.setMalletVisible(false);
      },
    };
  },
});

export const WINDOW_BOSSES: Record<CharacterBossId, CharacterBossDefinition> = {
  yotan: {
    id: "yotan",
    displayName: "よーたん",
    title: "爆音CTO",
    specialName: "フィードバック・リフ",
    introLine: "よーたん「音、出します。赤い床をよく見てください」",
    defeatLine: "よーたんは目を回しながらも、ギターの音を調整している。",
    color: 0xff3d9a,
    hp: 50,
    speed: 1.08,
    damage: 12,
    radius: 1.08,
    points: 6500,
    healthY: 4.15,
    model: makeModel("yotan", 1.45, {
      smashDuration: 0.58,
      windupAngle: 0.82,
      impactAngle: -1.2,
    }),
  },
  tokun: {
    id: "tokun",
    displayName: "とっくん",
    title: "アロハ社長",
    specialName: "アロハ・ウクレレウェーブ",
    introLine: "とっくん「まあ一曲。波の間に入れば快適ですよ」",
    defeatLine: "とっくんは目を回しつつ、すぐにウクレレを弾き直した。",
    color: 0x44df9b,
    hp: 54,
    speed: 0.92,
    damage: 11,
    radius: 1.12,
    points: 6500,
    healthY: 4.35,
    model: makeModel("tokun", 1.38, {
      smashDuration: 0.66,
      windupAngle: 0.7,
      impactAngle: -0.9,
    }),
  },
  fukuchan: {
    id: "fukuchan",
    displayName: "ふくちゃん",
    title: "ギュンギュン営業",
    specialName: "セルフィー・フラッシュ",
    introLine: "ふくちゃん「ギュンギュン！ 光る前にフレームアウトしてね！」",
    defeatLine: "ふくちゃんは目を回しながら、記念セルフィーの構図を決めた。",
    color: 0xff79c8,
    hp: 48,
    speed: 1.24,
    damage: 10,
    radius: 1.02,
    points: 6500,
    healthY: 4.05,
    model: makeModel("fukuchan", 1.43, {
      smashDuration: 0.5,
      windupAngle: 0.95,
      impactAngle: -1.05,
    }),
  },
  yumemin: {
    id: "yumemin",
    displayName: "ゆめみん",
    title: "無言の木槌",
    specialName: "予告BONK",
    introLine: "ゆめみんは無言で木槌を構えた。丸い予告から離れよう。",
    defeatLine: "ゆめみんは目を回して、ふわふわとその場で休憩している。",
    color: 0x42bfff,
    hp: 46,
    speed: 1.42,
    damage: 13,
    radius: 0.96,
    points: 6500,
    healthY: 3.35,
    model: makeYumeminV3Model(),
  },
  takosan: {
    id: "takosan",
    displayName: "たこさん",
    title: "深淵の窓際族",
    specialName: "たこ足セーフティチェック",
    introLine: "たこさんは無言で触手を広げた。空いている床を探そう。",
    defeatLine: "たこさんは表情を変えず、触手だけがくるくる目を回している。",
    color: 0x9d72ff,
    hp: 58,
    speed: 0.82,
    damage: 12,
    radius: 1.25,
    points: 6500,
    healthY: 3.9,
    model: makeModel("takosan", 1.43, {
      extraLocomotionAngle: 0.34,
      smashDuration: 0.68,
      impactAngle: -1.3,
    }),
  },
  yametaro: {
    id: "yametaro",
    displayName: "やめ太郎",
    title: "WANTED逃走王",
    specialName: "どうせワイなんてダッシュ",
    introLine: "やめ太郎「どうせワイなんて、一直線に逃げるだけや！」",
    defeatLine: "やめ太郎は目を回し、「どうせワイなんて」と言いつつ笑っている。",
    color: 0xa963ff,
    hp: 45,
    speed: 1.58,
    damage: 10,
    radius: 0.98,
    points: 6500,
    healthY: 4.05,
    model: makeModel("yametaro", 1.4, {
      walkFrequency: 15,
      strideAngle: 0.7,
      smashDuration: 0.42,
    }),
  },
  okayaman: {
    id: "okayaman",
    displayName: "おかやまん",
    title: "大型画面の窓際キング",
    specialName: "おかやまん。レギュレーション・ビーム",
    introLine: "おかやまん「画面からビームが出ることに、大変驚いております」",
    defeatLine: "画面のおかやまんは目を回し、「おかやまん。大変驚いております」と微笑んだ。",
    color: 0xffd23f,
    hp: 100,
    speed: 0,
    damage: 14,
    radius: 1.45,
    points: 15000,
    healthY: 4.1,
    model: makeModel("okayaman", 1.62, {
      smashDuration: 0.72,
      windupAngle: 0.28,
      impactAngle: -0.4,
      rootLeanAngle: 0.04,
      rootDrop: 0.01,
    }),
  },
};

// A run number gives every player a predictable tour of the whole roster.
// New profiles meet Yotan first, then rotate on later runs.
export const MID_BOSS_ROTATION: CharacterBossId[] = [
  "yotan",
  "tokun",
  "fukuchan",
  "yumemin",
  "takosan",
  "yametaro",
];
