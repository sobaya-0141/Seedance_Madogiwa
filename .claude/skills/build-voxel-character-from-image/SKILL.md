---
name: build-voxel-character-from-image
description: Turn character reference images into reusable, rigged voxel 3D assets for Blender and Three.js through an imagegen turnaround and user-approval workflow. Use when Codex needs to preserve a character's likeness across front, side, and back views; create or revise Minecraft-like cube-headed models; prevent missing rear hair or clothing; split features between block geometry and face/clothing textures; generate GLB and editable .blend files; add walk/smash-compatible rigid-part pivots; or diagnose why a voxel conversion is not recognizable.
---

# Build Voxel Character From Image

Convert references into a likeness-first voxel character, not a literal 3D reconstruction.
Preserve identity through silhouette, a few block attachments, and replaceable front-panel textures.

## Workflow

1. Inspect every reference with an image-viewing tool. Read existing character specifications and
   list design locks, separating visible facts from side/back details that must be inferred.
2. Before any texture or voxel-construction work, read
   [references/turnaround-and-approval.md](references/turnaround-and-approval.md). If the source does
   not clearly show front, both sides, and back, use the installed `imagegen` skill to create a
   consistent voxel turnaround with front, left profile, back, and right profile views. Generate a
   rear-head close-up too when hair, a hood, mask straps, or headwear is identity-critical.
3. Present the generated reference pack and the inferred side/back decisions to the user. **Stop and
   wait for explicit approval or feedback. Do not generate final albedos, construct the model, or
   export a GLB before approval.** Regenerate affected views after feedback while preserving
   approved views.
   Bypass this gate only when the user explicitly asks to proceed without reviewing the references.
4. Write an identity budget from the approved turnaround before editing geometry:
   - silhouette: head ratio, hair/hood, limbs, appendages;
   - face: eye treatment, glasses, cheeks, mouth, mask opening;
   - clothing: base color, collar, buttons, emblem or pattern;
   - props: only permanently attached signature items.
5. Split features deliberately:
   - use geometry for silhouette, depth, animation, and side/back readability;
   - use texture for flat face marks, glasses/lenses, blush, collar, buttons, and fabric motifs;
   - do not model the same feature in both systems unless the overlap is intentional.
   - when the user explicitly assigns a feature to texture, do not recreate it as geometry.
6. Make the coarse block model and rig before polishing textures. For a Minecraft-like result,
   keep the head a true cube and the torso/limbs unrotated cuboids with flat shading.
   Build hair, hoods, and clothing around the full head/body using all four approved views; never
   leave the rear bare merely because the original image shows only the front.
7. Generate square, orthographic albedo textures from the approved reference pack. For bitmap
   generation or editing, read and follow the installed `imagegen` skill. Exclude lighting,
   perspective, text, background scenery, and any feature that remains 3D geometry.
8. Build with one root, rigid-part pivots, packed images, an idle clip, and GLB extras. When the
   project uses Blender, use it only as a deterministic cuboid assembler and exporter. Never use a
   smooth organic base mesh, third-party body model, or AI-reconstructed 3D mesh for the voxel body.
   Start from `scripts/build_biped_template.py` and `scripts/voxel_character_kit.py`; customize
   silhouette-specific parts rather than forcing every character into the same body.
9. Render front, left, back, right, and three-quarter previews. Compare every angle to the approved
   turnaround, fix likeness at normal viewing size, then validate the rig and GLB structure.
10. Integrate the GLB into Three.js with a cache-busted model URL. Animate named pivots at runtime
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
  --clothing-back-texture textures/example_clothing_back.png \
  --output-glb public/models/example.glb \
  --output-blend model_source/example_master.blend \
  --preview model_source/example_preview.png \
  --turnaround-dir model_source/previews/example

blender --background --python validate_voxel_character.py -- \
  --input public/models/example.glb --rig-type biped

python3 inspect_glb.py public/models/example.glb --rig-type biped \
  --min-embedded-images 2
```

Use `--rig-type tentacled` for a custom builder with `VoxelRig_Locomotion_00` or later nodes.
Run these bundled validators first; add project-specific validators only as extra checks.

## Required outputs

Produce all of the following unless the user narrows the request:

- editable procedural source (`.blend`, `.vox` generator, or the project's canonical equivalent);
- self-contained `.glb` with packed/embedded textures;
- approved front/left/back/right voxel turnaround and any rear-head close-up;
- a short record of the user's approval and any accepted inferred details;
- face and clothing source textures;
- front/left/back/right previews plus a useful three-quarter preview;
- repeatable Blender builder script;
- recorded identity locks and texture prompts near the model sources.

## Quality gates

- Recognizable at thumbnail size without relying on the filename.
- Turnaround approval is recorded before the first model build unless the user explicitly waived it.
- No prohibited or accidental face marks; inspect generated textures before building.
- Square-head or other stated voxel constraints remain true in geometry, not only in render style.
- Hair, hoods, straps, and clothing continue naturally across the approved side and back views; no
  unapproved bald or blank rear surfaces remain.
- Flat-shaded block parts use intentional pivots; walk does not detach feet and smash does not
  detach the held prop.
- GLB passes `validate_voxel_character.py` and `inspect_glb.py`.
- Preview is reviewed after the final build, not only after concept generation.
- Existing user assets and unrelated worktree changes remain untouched.

If the character still reads poorly after two focused 3D iterations, compare a billboard/sprite or
2.5D face panel. Recommend 2D only when the identity depends mainly on line art that does not survive
the intended camera distance.
