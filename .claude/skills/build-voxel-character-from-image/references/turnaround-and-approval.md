# Voxel turnaround and approval gate

## Purpose

Insert a reviewed design step between the original character image and 3D modeling:

```text
original reference → imagegen voxel turnaround → user feedback/approval → voxel model
```

Use this gate whenever front, left, back, or right information is missing or ambiguous. A plausible
back is not enough; the user must see and approve the inference before it becomes geometry.

## Build the reference pack

1. Inspect the original at full resolution and read the character's design locks.
2. List details visible in the source separately from details that require inference.
3. Read and follow the installed `imagegen` skill.
4. Provide the original reference and any previously approved voxel concept to imagegen.
5. Generate one orthographic turnaround sheet containing four separate full-body views in this
   order: front, left profile, back, right profile.
6. Generate a separate rear/side head close-up when hair, a hood, mask straps, ears, horns, or a hat
   cannot be judged clearly at full-body scale.
7. If the sheet is inconsistent, regenerate it before showing it to the user. Do not fix major view
   contradictions silently while modeling.

Use a single four-view sheet first because one canvas encourages consistent proportions. If detail
resolution is insufficient, derive separate side/back images from that sheet while supplying both the
original and sheet as references. Never generate each angle independently from the original alone.

## Turnaround prompt pattern

```text
Create one production-ready orthographic turnaround reference sheet for a physically buildable
Minecraft-like voxel character. Show exactly four separate full-body views of the same character:
front, left profile, back, and right profile, in one horizontal row. Use identical scale, cube
dimensions, proportions, neutral stance, clothing, colors, and accessories in every view. The
supplied original character image is the identity authority for all visible features. Preserve:
<identity locks>. Apply these voxel constraints: <head/body/block constraints>.

Complete unseen side and back regions conservatively. Hair, hood, headwear, mask straps, collars,
clothing, and patterns must wrap continuously and logically across adjacent views. If the source
implies a full hairstyle, cover the back and sides of the skull naturally; do not create a bald or
blank rear surface. Do not invent logos, accessories, anatomy, pupils, or decorative motifs.

Orthographic cameras, flat neutral lighting, plain background, no perspective, no action pose, no
cropping, no overlapping views, no labels, no text, no scenery, and no extra characters. Every
shape must be representable with unrotated cuboids or clearly stepped voxel blocks.
```

For a head close-up, request front, left, back, and right head views at identical scale. Repeat all
negative identity locks, especially absent pupils, mask openings, hair coverage, and strap behavior.

## Pre-review checks

Inspect the generated pack before asking the user:

- the same head and body dimensions appear in all four views;
- the left and right profiles agree with the front and back widths;
- hair or a hood occupies the back when the design implies it;
- ears, straps, tentacles, tails, sleeves, collars, and props connect across adjacent views;
- no view invents or drops glasses, pupils, cheeks, emblems, or signature items;
- the back design is simple enough to build from blocks;
- all four views show the same handedness and accessory placement.

Regenerate obvious failures. Do not use image editing code to fake missing visual content.

## User approval checkpoint

Show the full-resolution reference pack before any voxel construction or final albedo work. State:

- which details came directly from the original;
- which side/back details were inferred by imagegen;
- any remaining ambiguity that will affect geometry;
- the exact files proposed as modeling authority.

Ask specifically for feedback on rear hair/hood coverage, side profile, clothing back, appendage
placement, and accessories. End the turn and wait. Approval must be explicit, such as “この案で進めて”.

When feedback arrives, regenerate only the affected reference pack while supplying the approved pack
as a reference so accepted details stay fixed. Preserve old candidates; mark the selected version as
approved near the model sources and record the user's accepted corrections.

Proceed to textures and voxel construction only after approval. If Blender is used, restrict it to
procedural cuboid assembly and export; do not revive a smooth/organic base model. If the user
explicitly waives review, record the waiver and inferred decisions in the model-source notes before
building.
