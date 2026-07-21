# Reusable Sobaya model

`sobaya_voxel_master.blend` is the active editable master used by the game.
Its intentionally blocky proportions keep the mask, muscular silhouette, and
beer mug readable without relying on high-detail organic modeling.

`sobaya_master.blend` is the retained smooth-body version for comparison.

`../public/models/sobaya.glb` is the optimized web export used by the game.
`sobaya_voxel_preview.png` is the active Blender preview render.

Rebuild from the licensed base model with Blender:

```bash
blender --background --python tools/build_sobaya_model.py -- \
  --input /path/to/Superhero_Male_FullBody.gltf \
  --mask-texture model_source/textures/sobaya_mask_albedo.png \
  --output-glb public/models/sobaya.glb \
  --output-blend model_source/sobaya_master.blend \
  --preview model_source/sobaya_preview.png
```

Build the active voxel version without a third-party body mesh:

```bash
blender --background --python tools/build_sobaya_voxel_model.py -- \
  --mask-texture model_source/textures/sobaya_mask_albedo_voxel.png \
  --output-glb public/models/sobaya.glb \
  --output-blend model_source/sobaya_voxel_master.blend \
  --preview model_source/sobaya_voxel_preview.png
```

The voxel GLB exposes rigid-body animation pivots for reuse in Three.js:

- `SobayaVoxel_MugArmPivot`: mug arm, hand, mug, and foam
- `SobayaVoxel_FreeArmPivot`: opposite arm and fist
- `SobayaVoxel_LegPivot_NegX`: left-side pants leg and shoe
- `SobayaVoxel_LegPivot_PosX`: right-side pants leg and shoe

Rotate these objects around local X for the smash and walk cycles. No skeletal
rig or skinning is required.

## Third-party base model

- Asset: Universal Base Characters — Standard Edition / Superhero Male
- Creator: Quaternius
- Source: https://quaternius.com/packs/universalbasecharacters.html
- License: Creative Commons Zero v1.0 Universal (CC0 1.0)
  https://creativecommons.org/publicdomain/zero/1.0/

The source license permits copying, modification, and commercial use without
attribution. The credit above is retained as a courtesy and for provenance.

## Mask texture workflow

- `textures/sobaya_mask_design_source.png`: imagegen-generated flat design source
- `textures/sobaya_mask_albedo.png`: 1024px game-ready texture
- `textures/sobaya_mask_albedo_voxel.png`: 128px nearest-filtered voxel texture
- `textures/IMAGEGEN_PROMPT.md`: reproducible generation prompt

The smooth version uses one curved mask mesh with front-projected UVs; the
voxel version uses one flat block panel. Both keep every red and black marking
in the albedo texture, so a future variant can replace one image and rebuild
without remodeling.
