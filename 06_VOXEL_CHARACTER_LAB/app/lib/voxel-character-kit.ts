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
  impactHoldEnd: number;
  windupAngle: number;
  impactAngle: number;
  poweredMultiplier: number;
  secondaryArmRecoil: number;
  rootLeanAngle: number;
  rootDrop: number;
};

export type VoxelCharacterDefinition = {
  id: string;
  modelUrl?: string;
  scale: number;
  rotationY: number;
  rig: VoxelRigNodeMap;
  motion: VoxelMotionProfile;
};

export type VoxelActionController = {
  triggerSmash: (powered: boolean) => void;
  update: (dt: number, elapsed: number, moving: boolean) => void;
};

export const STANDARD_RIG = {
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
  smashDuration: 0.44,
  windupEnd: 0.2,
  impactEnd: 0.39,
  impactHoldEnd: 0.52,
  windupAngle: 0.55,
  impactAngle: -1.55,
  poweredMultiplier: 1.08,
  secondaryArmRecoil: 0.34,
  rootLeanAngle: 0.12,
  rootDrop: 0.06,
};

const findFirst = (model: THREE.Object3D, names?: readonly string[]) => {
  if (!names) return undefined;
  for (const name of names) {
    const node = model.getObjectByName(name);
    if (node) return node;
  }
  return undefined;
};

const findAll = (model: THREE.Object3D, names?: readonly string[]) => {
  if (!names) return [];
  const matches: THREE.Object3D[] = [];
  for (const name of names) {
    const exact = model.getObjectByName(name);
    if (exact) matches.push(exact);
    if (!exact) {
      model.traverse((node) => {
        if (node.name.startsWith(name)) matches.push(node);
      });
    }
  }
  return matches.filter((node, index, all) => all.indexOf(node) === index);
};

export function resolveRigNodes(model: THREE.Object3D, rig: VoxelRigNodeMap) {
  return {
    primaryArm: findFirst(model, rig.primaryArm),
    secondaryArm: findFirst(model, rig.secondaryArm),
    leftLeg: findFirst(model, rig.leftLeg),
    rightLeg: findFirst(model, rig.rightLeg),
    locomotionExtras: findAll(model, rig.locomotionExtras),
  };
}

export function createVoxelActionController(
  model: THREE.Object3D,
  rig: VoxelRigNodeMap,
  profile: VoxelMotionProfile,
): VoxelActionController | undefined {
  const nodes = resolveRigNodes(model, rig);
  if (!nodes.primaryArm) return undefined;

  const animatedNodes = [
    nodes.primaryArm,
    nodes.secondaryArm,
    nodes.leftLeg,
    nodes.rightLeg,
    ...nodes.locomotionExtras,
  ].filter((node): node is THREE.Object3D => Boolean(node));
  const baseRotations = new Map(
    animatedNodes.map((node) => [node, node.rotation.clone()]),
  );
  const baseModelRotationX = model.rotation.x;
  const baseModelPositionY = model.position.y;
  let smashElapsed = profile.smashDuration + 1;
  let smashStrength = 1;

  const setRotationX = (node: THREE.Object3D | undefined, offset: number, response: number) => {
    if (!node) return;
    const base = baseRotations.get(node)?.x ?? 0;
    node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, base + offset, response);
  };

  return {
    triggerSmash(powered) {
      smashElapsed = 0;
      smashStrength = powered ? profile.poweredMultiplier : 1;
    },
    update(dt, elapsed, moving) {
      const response = 1 - Math.exp(-dt * profile.responseSpeed);
      const stride = moving
        ? Math.sin(elapsed * profile.walkFrequency) * profile.strideAngle
        : 0;
      setRotationX(nodes.leftLeg, stride, response);
      setRotationX(nodes.rightLeg, -stride, response);

      nodes.locomotionExtras.forEach((node, index) => {
        const base = baseRotations.get(node)?.z ?? 0;
        const offset = moving
          ? Math.sin(elapsed * profile.walkFrequency + index * 0.9) * profile.extraLocomotionAngle
          : 0;
        node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, base + offset, response);
      });

      let primaryTarget = moving ? stride * profile.primaryArmWalk : 0;
      let secondaryTarget = moving ? -stride * profile.secondaryArmWalk : 0;
      let rootLeanTarget = 0;
      let rootDropTarget = 0;
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
        } else if (phase < profile.impactHoldEnd) {
          primaryTarget = profile.impactAngle * smashStrength;
        } else {
          const t = THREE.MathUtils.smoothstep(
            (phase - profile.impactHoldEnd) / (1 - profile.impactHoldEnd),
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
        const leanProgress = phase < profile.impactEnd
          ? THREE.MathUtils.smoothstep(phase / profile.impactEnd, 0, 1)
          : phase < profile.impactHoldEnd
            ? 1
            : 1 - THREE.MathUtils.smoothstep(
              (phase - profile.impactHoldEnd) / (1 - profile.impactHoldEnd),
              0,
              1,
            );
        rootLeanTarget = profile.rootLeanAngle * leanProgress;
        rootDropTarget = -profile.rootDrop * leanProgress;
      }

      setRotationX(nodes.primaryArm, primaryTarget, response);
      setRotationX(nodes.secondaryArm, secondaryTarget, response);
      model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, baseModelRotationX + rootLeanTarget, response);
      model.position.y = THREE.MathUtils.lerp(model.position.y, baseModelPositionY + rootDropTarget, response);
    },
  };
}

export async function loadVoxelModel(definition: VoxelCharacterDefinition) {
  if (!definition.modelUrl) throw new Error("This character has no model yet.");
  const gltf = await new GLTFLoader().loadAsync(definition.modelUrl);
  const model = gltf.scene;
  model.scale.setScalar(definition.scale);
  model.rotation.y = definition.rotationY;
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  const mixer = gltf.animations.length > 0 ? new THREE.AnimationMixer(model) : undefined;
  if (mixer) mixer.clipAction(gltf.animations[0]).play();
  return {
    model,
    mixer,
    actions: createVoxelActionController(model, definition.rig, definition.motion),
    nodes: resolveRigNodes(model, definition.rig),
  };
}
