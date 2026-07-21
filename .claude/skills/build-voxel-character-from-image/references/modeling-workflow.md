# Likeness-first voxel modeling workflow

## Contents

- Identity locks
- Geometry versus texture
- Concept and texture generation
- Blockout and proportions
- Blender material and UV rules
- Visual and technical QA
- When to use 2D or 2.5D

## Identity locks

Inspect source images at original resolution. Separate observations from guesses. Record a short,
testable list before modeling:

- head silhouette and dominant hair, hat, hood, ears, horns, or mask;
- exact eye treatment, including whether pupils exist;
- glasses frame and lens behavior;
- cheek, nose, and mouth geometry or marks;
- clothing color, collar, buttons, emblems, and repeating motifs;
- limb type, count, proportions, and signature prop.

Translate negative requirements literally. “White lenses” is not equivalent to white eyes: if the
reference requires empty lenses, explicitly prohibit pupils, irises, eye dots, glare, and shading in
the texture prompt, then inspect the texture itself before packing it into a model.

Rank features by recognition value. Spend geometry and texture resolution on the first three to five
identity cues. Small decorative details cannot rescue the wrong silhouette or face.

## Geometry versus texture

| Feature | Prefer geometry when | Prefer texture when |
|---|---|---|
| Hair/hood/hat | It changes the outline or must read from side/back | It is a flat hairline under a fixed camera |
| Glasses | Side arms or profile are important | Front view dominates and frame accuracy matters most |
| Eyes/cheeks/mouth | They protrude or animate independently | They are graphic marks or precise illustration features |
| Collar/button | They affect silhouette or gameplay | They are shallow clothing design details |
| Fabric pattern | Never for every painted stroke | Almost always |
| Tentacles/tails | They move or define body type | Only distant background characters |

Under a strict block constraint, use one cuboid torso and put the complete shirt front—collar,
button, motifs—on one front texture. Do not add collar or button meshes merely because the source
illustration has shading around them.

Use geometry for:

- true cube head;
- cuboid torso, arms, hands, legs, shoes;
- stepped hair blocks and ears;
- tentacles built from unrotated stepped boxes when a Minecraft-like silhouette is required;
- a hand socket and animation pivots.

## Concept and texture generation

Generate concept variants only when the 3D direction is uncertain. Keep the same neutral three-
quarter camera and full-body framing. Ask for a physically buildable arrangement of cuboids rather
than a voxel-styled painting with impossible curves.

Use this pattern for a face albedo prompt:

```text
Create one square orthographic front-face albedo texture for a blocky voxel character.
Use the supplied character reference as identity authority. Preserve: <face locks>.
The image must be flat and evenly lit, with no perspective, cast shadows, background,
text, hair, ears, neck, clothing, or accessories that will remain 3D geometry.
Hard constraints: <negative identity locks>. Center the face with safe edge margin.
```

Use this pattern for clothing:

```text
Create one square orthographic front clothing albedo for a single rectangular voxel torso.
Preserve: <base color, collar, fastener, emblem, motifs>. Render every listed clothing
detail in this one texture. No arms, hands, head, body outline, depth, folds, perspective,
lighting, background, or text. Use crisp block-compatible shapes and a safe edge margin.
```

Crop generated borders through UV bounds only when the source image has a consistent safe margin.
Regenerate if the content is perspectival, unevenly lit, or contains accidental identity marks.

## Blockout and proportions

Use a consistent meter-like Blender unit system. A practical chibi biped baseline is:

- head cube: `1.12 × 1.12 × 1.12`;
- torso: `0.78 × 0.48 × 0.58`;
- sleeve: `0.24 × 0.42 × 0.36`;
- hand: `0.23 × 0.26 × 0.22`;
- leg: `0.31 × 0.36 × 0.52`;
- shoe: `0.31 × 0.42 × 0.22`.

Treat these as a scaffold, not a style mandate. Change proportions to match the character, but keep
shared rig node names and local pivot behavior. Apply object scale after assigning box dimensions.
Keep block faces flat shaded. Avoid bevels and arbitrary rotations when the requested language is
strictly Minecraft-like; use stepped boxes to suggest diagonals.

Create front texture panels as thin boxes just in front of the head/torso face. Map the camera-facing
polygon across the texture, keep the edge material on the other sides, set image interpolation to
Closest, mark albedo as sRGB, and pack the image before saving/exporting.

Low emission (`0.05–0.30`) can keep graphic whites readable, but do not let it flatten all lighting.
Use the smallest value that preserves a required white lens or mask.

## Visual and technical QA

Review in this order:

1. silhouette at 128–256 px;
2. face locks at full preview size;
3. side/back continuity of 3D attachments;
4. clothing texture alignment and margins;
5. arm/leg/appendage pivots through walk and smash extremes;
6. held prop alignment through the primary hand socket;
7. GLB contents and embedded textures;
8. Three.js scale, facing direction, shadows, and cache busting.

Use a neutral three-quarter preview with visible ground contact, warm key light, cool fill/rim light,
and a camera far enough away to avoid wide-angle distortion. Compare against the source after every
meaningful silhouette or texture revision.

The build is complete only when the editable master, GLB, textures, preview, builder, and validation
logs agree. Never accept a successful export as proof of likeness.

## When to use 2D or 2.5D

Choose a billboard, sprite, or textured 2.5D face when all are true:

- recognition is dominated by thin line art or facial drawing;
- the camera does not need convincing side/back views;
- repeated 3D iterations add geometry without improving recognition;
- gameplay animation can be expressed through sprite states or rigid body movement.

Prefer a hybrid before abandoning 3D: retain the block body and animated limbs, then use a larger
front face texture or shallow head panel for the identity-critical art.
