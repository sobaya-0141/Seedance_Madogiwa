import {
  STANDARD_BIPED_MOTION,
  STANDARD_VOXEL_RIG_NODES,
  type VoxelCharacterDefinition,
  type VoxelMotionProfile,
} from "./voxel-character-kit.js";

// Every voxel model in 04_GAME_ASSETS/voxel/models shares the standardized rig
// node names, so a single rig map drives walking for all of them. Missing nodes
// (e.g. the tentacle characters have no legs) are simply ignored by the kit.
const SHARED_RIG = {
  primaryArm: [STANDARD_VOXEL_RIG_NODES.primaryArm],
  secondaryArm: [STANDARD_VOXEL_RIG_NODES.secondaryArm],
  leftLeg: [STANDARD_VOXEL_RIG_NODES.leftLeg],
  rightLeg: [STANDARD_VOXEL_RIG_NODES.rightLeg],
  locomotionExtras: [STANDARD_VOXEL_RIG_NODES.locomotionPrefix],
} as const;

// A calmer stride than the office-crash smash game — these characters are just
// patrolling, not swinging beer mugs.
const PATROL_MOTION: VoxelMotionProfile = {
  ...STANDARD_BIPED_MOTION,
  walkFrequency: 8.5,
  strideAngle: 0.42,
};

export type CharacterMeta = {
  def: VoxelCharacterDefinition;
  /** Short label shown on the radar / detection banner. */
  label: string;
  /** Dot colour on the radar. */
  radarColor: string;
  /** Character-specific warning shown while this character sees the player. */
  spotText: string;
  /** Friendly interruption shown when this character fills the detection gauge. */
  caughtText: string;
  /**
   * Extra yaw (radians) added when orienting the model toward its travel
   * direction, to account for which way the art faces at rotationY 0.
   */
  faceOffset: number;
};

function make(
  id: string,
  label: string,
  radarColor: string,
  scale: number,
  options: {
    faceOffset?: number;
    spotText?: string;
    caughtText?: string;
  } = {},
): CharacterMeta {
  return {
    label,
    radarColor,
    faceOffset: options.faceOffset ?? 0,
    spotText: options.spotText ?? "",
    caughtText: options.caughtText ?? "",
    def: {
      id,
      assetUrl: `assets/models/${id}.glb`,
      modelName: `${id}-voxel`,
      scale,
      rotationY: 0,
      rig: SHARED_RIG,
      motion: PATROL_MOTION,
    },
  };
}

export const SOBAYA = make("sobaya", "そば屋", "#ffffff", 1.28);

// Enemies who might spot the escaping soba shop owner.
export const FUKUCHAN = make("fukuchan", "福ちゃん", "#ff5a5a", 1.28, {
  spotText: "福ちゃん「ギュン！ そば屋さん、もう帰るの？」",
  caughtText: "福ちゃん「せっかくだから一枚撮ろう！」— 笑顔の自撮りタイムが始まった。",
});
export const YOTAN = make("yotan", "よーたん", "#ffd24a", 1.28, {
  spotText: "よーたん「その退社ルート、見逃さないぜ！」",
  caughtText: "よーたん「ロックな帰り方だな！」— 帰宅前のギター談義が始まった。",
});
export const TOKUN = make("tokun", "とーくん", "#ff8a3d", 1.24, {
  spotText: "とーくん「アロハ〜、もう帰るの？」",
  caughtText: "とーくん「一曲だけ聴いていって！」— 陽気なウクレレ演奏が始まった。",
});
export const YAMETARO = make("yametaro", "やめたろう", "#c77dff", 1.24, {
  spotText: "やめたろう「やめさんを置いて帰るんかい！」",
  caughtText: "やめたろう「どうせワイなんて……って、待って！」— しばし立ち話になった。",
});
export const TAKOSAN = make("takosan", "たこさん", "#9d8cff", 1.16, {
  spotText: "たこさん「……」— 無表情のまま触手がこちらを指した。",
  caughtText: "たこさん「……」— 触手の静かなジェスチャーで呼び止められた。",
});
export const YUMEMIN = make("yumemin", "ゆめみん", "#4ad6ff", 1.02, {
  spotText: "ゆめみん「BONK!?」— 木槌を構えてこちらを見ている。",
  caughtText: "ゆめみん「BONK! BONK!」— 木槌のリズムにつかまった。",
});
export const OKAYAMAN = make("okayaman", "おかやまん", "#7dff9b", 1.3, {
  spotText: "おかやまん「おかやまん、大変驚いております。定時退社ですね？」",
  caughtText: "おかやまん「おかやまん、大変驚いております。レギュレーション確認を始めます」",
});
