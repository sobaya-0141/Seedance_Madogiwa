import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type VoxelRigNodeMap = {
  primaryArm: readonly string[];
  secondaryArm?: readonly string[];
  leftLeg?: readonly string[];
  rightLeg?: readonly string[];
  locomotionExtras?: readonly string[];
};

export type VoxelMotionProfile = {
  walkFrequency: number;
  strideAngle: number;
  primaryArmWalk: number;
  secondaryArmWalk: number;
  extraLocomotionAngle: number;
  responseSpeed: number;
};

export type VoxelCharacterDefinition = {
  assetUrl: string;
  scale: number;
  rotationY: number;
  rig: VoxelRigNodeMap;
  motion: VoxelMotionProfile;
};

export type VoxelActionController = {
  update: (dt: number, elapsed: number, moving: boolean) => void;
};

export type LoadedVoxelCharacter = {
  model: THREE.Group;
  mixer?: THREE.AnimationMixer;
  actions?: VoxelActionController;
};

export const STANDARD_VOXEL_RIG_NODES = {
  primaryArm: "VoxelRig_ArmPrimary",
  secondaryArm: "VoxelRig_ArmSecondary",
  leftLeg: "VoxelRig_LegLeft",
  rightLeg: "VoxelRig_LegRight",
  locomotionPrefix: "VoxelRig_Locomotion_",
} as const;

const SHARED_RIG = {
  primaryArm: [STANDARD_VOXEL_RIG_NODES.primaryArm],
  secondaryArm: [STANDARD_VOXEL_RIG_NODES.secondaryArm],
  leftLeg: [STANDARD_VOXEL_RIG_NODES.leftLeg],
  rightLeg: [STANDARD_VOXEL_RIG_NODES.rightLeg],
  locomotionExtras: [STANDARD_VOXEL_RIG_NODES.locomotionPrefix],
} as const;

export const RUNNER_MOTION: VoxelMotionProfile = {
  walkFrequency: 10.5,
  strideAngle: 0.5,
  primaryArmWalk: 0.18,
  secondaryArmWalk: 0.48,
  extraLocomotionAngle: 0.2,
  responseSpeed: 20,
};

export function runnerDefinition(assetUrl: string, scale = 1, rotationY = Math.PI) {
  return {
    assetUrl,
    scale,
    rotationY,
    rig: SHARED_RIG,
    motion: RUNNER_MOTION,
  } satisfies VoxelCharacterDefinition;
}

function findFirst(model: THREE.Object3D, names?: readonly string[]) {
  if (!names) return undefined;
  for (const name of names) {
    const node = model.getObjectByName(name);
    if (node) return node;
  }
  return undefined;
}

function findAll(model: THREE.Object3D, names?: readonly string[]) {
  if (!names) return [];
  return names.flatMap((name) => {
    const exact = model.getObjectByName(name);
    if (exact) return [exact];
    const matches: THREE.Object3D[] = [];
    model.traverse((node) => {
      if (node.name.startsWith(name)) matches.push(node);
    });
    return matches;
  }).filter((node, index, all) => all.indexOf(node) === index);
}

function createActionController(
  model: THREE.Object3D,
  nodes: VoxelRigNodeMap,
  profile: VoxelMotionProfile,
): VoxelActionController | undefined {
  const primaryArm = findFirst(model, nodes.primaryArm);
  if (!primaryArm) return undefined;

  const secondaryArm = findFirst(model, nodes.secondaryArm);
  const leftLeg = findFirst(model, nodes.leftLeg);
  const rightLeg = findFirst(model, nodes.rightLeg);
  const extras = findAll(model, nodes.locomotionExtras);
  const baseRotations = new Map<THREE.Object3D, THREE.Euler>();
  [primaryArm, secondaryArm, leftLeg, rightLeg, ...extras].forEach((node) => {
    if (node) baseRotations.set(node, node.rotation.clone());
  });

  return {
    update: (dt, elapsed, moving) => {
      const response = 1 - Math.exp(-dt * profile.responseSpeed);
      const stride = moving
        ? Math.sin(elapsed * profile.walkFrequency) * profile.strideAngle
        : Math.sin(elapsed * 2.2) * 0.025;

      const setRotationX = (node: THREE.Object3D | undefined, offset: number) => {
        if (!node) return;
        const base = baseRotations.get(node)?.x ?? 0;
        node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, base + offset, response);
      };

      setRotationX(leftLeg, stride);
      setRotationX(rightLeg, -stride);
      setRotationX(primaryArm, stride * profile.primaryArmWalk);
      setRotationX(secondaryArm, -stride * profile.secondaryArmWalk);

      extras.forEach((node, index) => {
        const base = baseRotations.get(node)?.z ?? 0;
        const wave = moving
          ? Math.sin(elapsed * profile.walkFrequency + index * 0.9) * profile.extraLocomotionAngle
          : 0;
        node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, base + wave, response);
      });
    },
  };
}

interface LoadOptions {
  definition: VoxelCharacterDefinition;
  parent: THREE.Object3D;
  onReady?: (character: LoadedVoxelCharacter) => void;
  onError?: (error: unknown) => void;
}

export function loadVoxelCharacter({
  definition,
  parent,
  onReady,
  onError,
}: LoadOptions): void {
  new GLTFLoader().load(
    definition.assetUrl,
    (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(definition.scale);
      model.rotation.y = definition.rotationY;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      parent.add(model);

      let mixer: THREE.AnimationMixer | undefined;
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
      }

      onReady?.({
        model,
        mixer,
        actions: createActionController(model, definition.rig, definition.motion),
      });
    },
    undefined,
    onError,
  );
}
