# Face texture generation

Both textures were created with Codex `imagegen` in reference-guided generation
mode, using the corresponding image in `../../../02_CHARACTERS/` as the
authoritative character design.

## Takosan

Reference: `../../../02_CHARACTERS/Takosan.png`

Prompt summary: generate a square, orthographic face albedo preserving the pale
cool-gray mask, exactly two small black round eyes, blank expression, and the
near-black hood opening; exclude the body, tentacles, text, and extra features.
A second targeted pass reduced the eye diameter and flattened the presentation
to better match the reference.

Output: `takosan_face_albedo.png`

## Yametaro

Reference: `../../../02_CHARACTERS/Yametaro.jpg`

Prompt summary: generate a square, orthographic face albedo preserving the
oversized black round glasses, white lens interiors with small black eyes, vivid
pink round cheeks, tiny nose, and small curved smile; exclude hair because it
remains 3D geometry, plus ears, shirt, text, and extra features.

Output: `yametaro_face_albedo.png`

These are source albedo assets. Blender packs them into each `.blend` and embeds
them in the exported `.glb`, so the web viewer does not load loose textures.
