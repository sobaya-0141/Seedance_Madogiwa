# Rigid-part rig and Three.js contract

## Contents

- Required metadata
- Stable node names
- Pivot construction
- Runtime actions
- Loading and integration

## Required metadata

Put these custom properties on the exported root:

```text
voxel_rig_schema = voxel-character-rig/v1
voxel_rig_type = biped | tentacled | custom
voxel_actions = walk,smash
```

Add character-specific `identity_locks`, `face_workflow`, and `clothing_workflow` metadata when useful.

## Stable node names

Use exact names so multiple games can share one animation controller:

| Purpose | Node name |
|---|---|
| Primary attack/prop arm | `VoxelRig_ArmPrimary` |
| Secondary arm | `VoxelRig_ArmSecondary` |
| Left leg | `VoxelRig_LegLeft` |
| Right leg | `VoxelRig_LegRight` |
| Appendage locomotion | `VoxelRig_Locomotion_00`, `01`, ... |
| Held item attachment | `VoxelRig_PrimaryHandSocket` |

A biped requires both arms and both legs. A tentacled character requires the primary arm and at
least one locomotion node. Put the socket under the primary arm pivot with coordinates local to it.

## Pivot construction

Create an empty at the physical joint. Reparent all matching rigid meshes while preserving their
world matrices. Apply mesh dimensions before grouping. Never animate the child pieces independently
for a basic shared action.

Keep neutral pose rotations and root position in the GLB. Include a subtle root `Idle` clip if useful;
walk and smash can remain runtime actions so every character shares timing while preserving its own
pivots.

## Runtime actions

Resolve pivots once after GLTF loading:

```js
const rig = {
  primaryArm: scene.getObjectByName("VoxelRig_ArmPrimary"),
  secondaryArm: scene.getObjectByName("VoxelRig_ArmSecondary"),
  leftLeg: scene.getObjectByName("VoxelRig_LegLeft"),
  rightLeg: scene.getObjectByName("VoxelRig_LegRight"),
  handSocket: scene.getObjectByName("VoxelRig_PrimaryHandSocket"),
};
```

For walk, drive opposing limbs with a sine phase. Tentacled characters can alternate locomotion
nodes with phase offsets. For smash, use a short anticipation, fast downward swing, impact hold, and
recovery on `primaryArm.rotation.x`; add a smaller counter-motion to the secondary arm and root.

Store neutral rotations and restore them when changing character or action. Clamp or blend action
weights so walk does not overwrite smash. Attach a mug or tool to the hand socket, not to world space.

## Loading and integration

- Serve one self-contained `.glb`; embedded textures avoid path breakage.
- Increment a query string or asset hash when replacing a model.
- Set scale and front-facing rotation in character catalog data, not inside shared animation code.
- Enable cast/receive shadow by traversing meshes after load.
- Dispose old geometry, materials, and textures when swapping characters repeatedly.
- Handle optional nodes without failing; enforce only the nodes required by the declared rig type.

Validate the exported file with both Blender import and the pure-Python GLB inspector before testing
in a browser. Blender validation catches hierarchy/metadata problems; GLB inspection catches missing
embedded images and malformed container data.
