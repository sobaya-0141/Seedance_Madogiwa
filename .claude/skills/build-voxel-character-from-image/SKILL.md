---
name: build-voxel-character-from-image
description: Turn character reference images into reusable, rigged voxel 3D assets for Blender and Three.js. Use when Codex needs to preserve a character's likeness while creating or revising Minecraft-like cube-headed models, split features between block geometry and face/clothing textures, generate GLB and editable .blend files, add walk/smash-compatible rigid-part pivots, or diagnose why a voxel conversion is not recognizable.
---

# Build Voxel Character From Image

Convert references into a likeness-first voxel character, not a literal 3D reconstruction.
Preserve identity through silhouette, a few block attachments, and replaceable front-panel textures.

## Workflow

1. Inspect every reference with an image-viewing tool before modeling. Read existing character
   specifications and list design locks: features that must not change.
2. If the voxel direction is unsettled, use the installed `imagegen` skill to make 2–4 full-body
   voxel concepts. Hold camera, square-head constraint, and identity locks constant across variants.
3. Write an identity budget before editing geometry:
   - silhouette: head ratio, hair/hood, limbs, appendages;
   - face: eye treatment, glasses, cheeks, mouth, mask opening;
   - clothing: base color, collar, buttons, emblem or pattern;
   - props: only permanently attached signature items.
4. Split features deliberately:
   - use geometry for silhouette, depth, animation, and side/back readability;
   - use texture for flat face marks, glasses/lenses, blush, collar, buttons, and fabric motifs;
   - do not model the same feature in both systems unless the overlap is intentional.
   - when the user explicitly assigns a feature to texture, do not recreate it as geometry.
5. Make the coarse block model and rig before polishing textures. For a Minecraft-like result,
   keep the head a true cube and the torso/limbs unrotated cuboids with flat shading.
6. Generate square, orthographic albedo textures from the references. For bitmap generation or
   editing, read and follow the installed `imagegen` skill. Exclude lighting, perspective, text,
   background scenery, and any feature that remains 3D geometry.
7. Build in Blender with one root, rigid-part pivots, packed images, an idle clip, and GLB extras.
   Start from `scripts/build_biped_template.py` and `scripts/voxel_character_kit.py`; customize
   silhouette-specific parts rather than forcing every character into the same body.
8. Render a three-quarter preview and inspect it visually. Fix likeness at normal viewing size,
   then validate the rig and GLB structure.
9. Integrate the GLB into Three.js with a cache-busted model URL. Animate named pivots at runtime
   instead of depending on Blender armatures for basic walk and smash actions.

Read [references/modeling-workflow.md](references/modeling-workflow.md) for the geometry/texture
decision rules, image-generation prompt pattern, dimensions, and quality gates. Read
[references/rig-and-threejs.md](references/rig-and-threejs.md) when adding actions or loading the
model in a game.

## Reusable commands

Copy the scripts into the target project's model tools directory before customizing them.

```bash
blender --background --python build_biped_template.py -- \
  --character-name Example \
  --face-texture textures/example_face.png \
  --clothing-texture textures/example_clothing.png \
  --output-glb public/models/example.glb \
  --output-blend model_source/example_master.blend \
  --preview model_source/example_preview.png

blender --background --python validate_voxel_character.py -- \
  --input public/models/example.glb --rig-type biped

python3 inspect_glb.py public/models/example.glb --rig-type biped \
  --min-embedded-images 2
```

Use `--rig-type tentacled` for a custom builder with `VoxelRig_Locomotion_00` or later nodes.
Run these bundled validators first; add project-specific validators only as extra checks.

## Required outputs

Produce all of the following unless the user narrows the request:

- editable `.blend` master;
- self-contained `.glb` with packed/embedded textures;
- face and clothing source textures;
- square preview PNG from a useful three-quarter view;
- repeatable Blender builder script;
- recorded identity locks and texture prompts near the model sources.

## Quality gates

- Recognizable at thumbnail size without relying on the filename.
- No prohibited or accidental face marks; inspect generated textures before building.
- Square-head or other stated voxel constraints remain true in geometry, not only in render style.
- Flat-shaded block parts use intentional pivots; walk does not detach feet and smash does not
  detach the held prop.
- GLB passes `validate_voxel_character.py` and `inspect_glb.py`.
- Preview is reviewed after the final build, not only after concept generation.
- Existing user assets and unrelated worktree changes remain untouched.

If the character still reads poorly after two focused 3D iterations, compare a billboard/sprite or
2.5D face panel. Recommend 2D only when the identity depends mainly on line art that does not survive
the intended camera distance.
