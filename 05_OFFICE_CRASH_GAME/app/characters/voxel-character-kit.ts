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
  smashDuration: number;
  windupEnd: number;
  impactEnd: number;
  windupAngle: number;
  impactAngle: number;
  poweredMultiplier: number;
  secondaryArmRecoil: number;
};

export type VoxelCharacterDefinition = {
  id: string;
  assetUrl: string;
  modelName: string;
  scale: number;
  rotationY: number;
  rig: VoxelRigNodeMap;
  motion: VoxelMotionProfile;
};

export type VoxelActionController = {
  triggerSmash: (powered: boolean) => void;
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
  primaryHandSocket: "VoxelRig_PrimaryHandSocket",
} as const;

export const STANDARD_BIPED_MOTION: VoxelMotionProfile = {
  walkFrequency: 11.5,
  strideAngle: 0.52,
  primaryArmWalk: 0.16,
  secondaryArmWalk: 0.46,
  extraLocomotionAngle: 0.18,
  responseSpeed: 22,
  smashDuration: 0.52,
  windupEnd: 0.28,
  impactEnd: 0.55,
  windupAngle: 1.12,
  impactAngle: -1.02,
  poweredMultiplier: 1.16,
  secondaryArmRecoil: 0.22,
};

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

export function createVoxelActionController(
  model: THREE.Object3D,
  nodes: VoxelRigNodeMap,
  profile: VoxelMotionProfile,
): VoxelActionController | undefined {
  const primaryArm = findFirst(model, nodes.primaryArm);
  if (!primaryArm) return undefined;

  const secondaryArm = findFirst(model, nodes.secondaryArm);
  const leftLeg = findFirst(model, nodes.leftLeg);
  const rightLeg = findFirst(model, nodes.rightLeg);
  const locomotionExtras = findAll(model, nodes.locomotionExtras);
  const baseRotations = new Map<THREE.Object3D, THREE.Euler>();
  [primaryArm, secondaryArm, leftLeg, rightLeg, ...locomotionExtras].forEach((node) => {
    if (node) baseRotations.set(node, node.rotation.clone());
  });

  let smashElapsed = profile.smashDuration + 1;
  let smashStrength = 1;

  return {
    triggerSmash: (powered) => {
      smashElapsed = 0;
      smashStrength = powered ? profile.poweredMultiplier : 1;
    },
    update: (dt, elapsed, moving) => {
      const response = 1 - Math.exp(-dt * profile.responseSpeed);
      const stride = moving
        ? Math.sin(elapsed * profile.walkFrequency) * profile.strideAngle
        : 0;

      const setRotationX = (node: THREE.Object3D | undefined, offset: number) => {
        if (!node) return;
        const base = baseRotations.get(node)?.x ?? 0;
        node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, base + offset, response);
      };

      setRotationX(leftLeg, stride);
      setRotationX(rightLeg, -stride);

      locomotionExtras.forEach((node, index) => {
        const base = baseRotations.get(node)?.z ?? 0;
        const wave = moving
          ? Math.sin(elapsed * profile.walkFrequency + index * 0.9) * profile.extraLocomotionAngle
          : 0;
        node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, base + wave, response);
      });

      let primaryTarget = moving ? stride * profile.primaryArmWalk : 0;
      let secondaryTarget = moving ? -stride * profile.secondaryArmWalk : 0;
      smashElapsed += dt;
      if (smashElapsed < profile.smashDuration) {
        const phase = smashElapsed / profile.smashDuration;
        if (phase < profile.windupEnd) {
          const t = THREE.MathUtils.smoothstep(phase / profile.windupEnd, 0, 1);
          primaryTarget = THREE.MathUtils.lerp(0, profile.windupAngle * smashStrength, t);
        } else if (phase < profile.impactEnd) {
          const t = THREE.MathUtils.smoothstep(
            (phase - profile.windupEnd) / (profile.impactEnd - profile.windupEnd),
            0,
            1,
          );
          primaryTarget = THREE.MathUtils.lerp(
            profile.windupAngle * smashStrength,
            profile.impactAngle * smashStrength,
            t,
          );
        } else {
          const t = THREE.MathUtils.smoothstep(
            (phase - profile.impactEnd) / (1 - profile.impactEnd),
            0,
            1,
          );
          primaryTarget = THREE.MathUtils.lerp(
            profile.impactAngle * smashStrength,
            moving ? stride * profile.primaryArmWalk : 0,
            t,
          );
        }
        secondaryTarget -= Math.sin(Math.PI * phase) * profile.secondaryArmRecoil;
      }

      setRotationX(primaryArm, primaryTarget);
      setRotationX(secondaryArm, secondaryTarget);
    },
  };
}

type LoadVoxelCharacterOptions = {
  definition: VoxelCharacterDefinition;
  parent: THREE.Object3D;
  onReady?: (character: LoadedVoxelCharacter) => void;
  onError?: (error: unknown) => void;
};

export function loadVoxelCharacter({
  definition,
  parent,
  onReady,
  onError,
}: LoadVoxelCharacterOptions) {
  new GLTFLoader().load(
    definition.assetUrl,
    (gltf) => {
      const model = gltf.scene;
      model.name = definition.modelName;
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
        actions: createVoxelActionController(model, definition.rig, definition.motion),
      });
    },
    undefined,
    onError,
  );
}
