import {
  STANDARD_BIPED_MOTION,
  STANDARD_VOXEL_RIG_NODES,
  type VoxelCharacterDefinition,
} from "./voxel-character-kit";

export const SOBAYA_CHARACTER: VoxelCharacterDefinition = {
  id: "sobaya",
  assetUrl: "/models/sobaya.glb?v=voxel-kit-1",
  modelName: "sobaya-reusable-model",
  scale: 1.32,
  // The Blender source faces -Y, which exports toward +Z in glTF.
  rotationY: Math.PI,
  rig: {
    primaryArm: [STANDARD_VOXEL_RIG_NODES.primaryArm, "SobayaVoxel_MugArmPivot"],
    secondaryArm: [STANDARD_VOXEL_RIG_NODES.secondaryArm, "SobayaVoxel_FreeArmPivot"],
    leftLeg: [STANDARD_VOXEL_RIG_NODES.leftLeg, "SobayaVoxel_LegPivot_NegX"],
    rightLeg: [STANDARD_VOXEL_RIG_NODES.rightLeg, "SobayaVoxel_LegPivot_PosX"],
    locomotionExtras: [STANDARD_VOXEL_RIG_NODES.locomotionPrefix],
  },
  motion: {
    ...STANDARD_BIPED_MOTION,
  },
};
