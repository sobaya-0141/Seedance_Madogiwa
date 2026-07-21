# Reusable Sobaya voxel model

`sobaya_voxel_master.blend` is the active editable master used by the game.
Its intentionally blocky proportions keep the mask, muscular silhouette, and
beer mug readable without relying on high-detail organic modeling.

`../public/models/sobaya.glb` is the optimized web export used by the game.
`sobaya_voxel_preview.png` is the active Blender preview render.

Build the voxel version without a third-party body mesh:

```bash
blender --background --python tools/build_sobaya_voxel_model.py -- \
  --mask-texture model_source/textures/sobaya_mask_albedo_voxel.png \
  --output-glb public/models/sobaya.glb \
  --output-blend model_source/sobaya_voxel_master.blend \
  --preview model_source/sobaya_voxel_preview.png \
  --turnaround-dir model_source/previews/sobaya-2026-07-21
```

承認済みの4方向お手本は `concepts/sobaya-turnaround-2026-07-21/`、モデルから
再生成した正面・左・背面・右の確認レンダーは `previews/sobaya-2026-07-21/` に置きます。
後頭部の髪は地肌が出ない段差ブロック、仮面は髪の下を通る細い背面ストラップです。

The voxel GLB exposes the Voxel Character Kit v1 rigid-body animation pivots:

- `VoxelRig_ArmPrimary`: mug arm, hand, mug, and foam
- `VoxelRig_ArmSecondary`: opposite arm and fist
- `VoxelRig_LegLeft`: left-side pants leg and shoe
- `VoxelRig_LegRight`: right-side pants leg and shoe
- `VoxelRig_PrimaryHandSocket`: attachment point for replaceable tools

Rotate these objects around local X for the smash and walk cycles. No skeletal
rig or skinning is required. See `VOXEL_CHARACTER_KIT.md` for the optional
tentacle/locomotion channels and the new-character workflow.

## Mask texture workflow

- `textures/sobaya_mask_design_source.png`: imagegen-generated flat design source
- `textures/sobaya_mask_albedo_voxel.png`: 128px nearest-filtered voxel texture
- `textures/IMAGEGEN_PROMPT.md`: reproducible generation prompt

The voxel mask uses one flat block panel. Every red and black marking stays in
the albedo texture, so a future variant can replace one image and rebuild
without remodeling.
