import {
  STANDARD_BIPED_MOTION,
  STANDARD_VOXEL_RIG_NODES,
  type VoxelCharacterDefinition,
  type VoxelMotionProfile,
} from "./voxel-character-kit.js";
import type { CharacterId } from "./types.js";

const SHARED_RIG = {
  primaryArm: [STANDARD_VOXEL_RIG_NODES.primaryArm],
  secondaryArm: [STANDARD_VOXEL_RIG_NODES.secondaryArm],
  leftLeg: [STANDARD_VOXEL_RIG_NODES.leftLeg],
  rightLeg: [STANDARD_VOXEL_RIG_NODES.rightLeg],
  locomotionExtras: [STANDARD_VOXEL_RIG_NODES.locomotionPrefix],
} as const;

const ICE_MOTION: VoxelMotionProfile = {
  ...STANDARD_BIPED_MOTION,
  walkFrequency: 7,
  strideAngle: 0.18,
  extraLocomotionAngle: 0.12,
};

const SCALES: Record<CharacterId | "yametaro", number> = {
  yametaro: 0.8,
  sobaya: 0.79,
  fukuchan: 0.78,
  takosan: 0.72,
  yumemin: 0.66,
  okayaman: 0.76,
};

/**
 * All definitions point at canonical shared GLBs.
 *
 * Design locks preserved by those models:
 * - Yametaro: original caricature, purple shirt, round glasses.
 * - Sobaya: white mask and oversized beer mug.
 * - Takosan: black hooded robe and tentacles.
 * - Fukuchan: stylish outfit and gyun-gyun silhouette.
 * - Yumemin: blue body, point eyes, flexible nose, wooden mallet.
 * - Okayaman: calm smile and remote-screen-only presentation.
 */
export function makeCharacterDefinition(
  id: CharacterId | "yametaro",
): VoxelCharacterDefinition {
  return {
    id,
    assetUrl: `models/${id}.glb`,
    modelName: `${id}-voxel`,
    scale: SCALES[id],
    rotationY: 0,
    rig: SHARED_RIG,
    motion: ICE_MOTION,
  };
}
