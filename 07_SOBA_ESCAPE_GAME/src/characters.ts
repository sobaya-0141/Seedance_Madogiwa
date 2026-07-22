import {
  STANDARD_BIPED_MOTION,
  STANDARD_VOXEL_RIG_NODES,
  type VoxelCharacterDefinition,
  type VoxelMotionProfile,
} from "./voxel-character-kit";

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
  faceOffset = 0,
): CharacterMeta {
  return {
    label,
    radarColor,
    faceOffset,
    def: {
      id,
      assetUrl: `models/${id}.glb`,
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
export const FUKUCHAN = make("fukuchan", "福ちゃん", "#ff5a5a", 1.28);
export const YOTAN = make("yotan", "よーたん", "#ffd24a", 1.28);
export const TOKUN = make("tokun", "とーくん", "#ff8a3d", 1.24);
export const YAMETARO = make("yametaro", "やめたろう", "#c77dff", 1.24);
export const YUMEMIN = make("yumemin", "ゆめみん", "#4ad6ff", 1.02);
export const OKAYAMAN = make("okayaman", "おかやまん", "#7dff9b", 1.3);
