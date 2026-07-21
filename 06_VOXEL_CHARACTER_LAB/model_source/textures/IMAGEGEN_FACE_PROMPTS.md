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

Active output: `takosan_face_albedo_v2.png`

The selected square-head revision also uses
`takosan_robe_front_albedo.png`: a near-black front panel with gray stepped
spiral embroidery derived from the selected concept and original robe.

## Yametaro

Reference: `../../../02_CHARACTERS/Yametaro.jpg`

Prompt summary: generate a square, orthographic face albedo preserving the
oversized black round glasses, completely empty pure-white lens interiors,
vivid pink round cheeks, tiny nose, and small angled smile. Black pupils, irises,
eye dots, glare, and lens shading are explicitly prohibited. Hair and ears remain
3D block geometry.

Active output: `yametaro_face_albedo_v2.png`

`yametaro_shirt_front_albedo_v2.png` contains the complete clothing design on
one panel: lavender base, light pointed collar, black button, and blue botanical
marks. No collar or button mesh is used.

`yametaro_shirt_back_albedo_v1.png` was generated after the user approved the
2026-07-21 four-view turnaround. Built-in reference-guided imagegen used the original character,
approved turnaround, and active front shirt albedo to make a flat lavender back with a wrapped pale
collar and five sparse periwinkle botanical sprigs. It explicitly excludes the front button,
lighting, folds, perspective, body parts, text, and scenery.

These are source albedo assets. Blender packs them into each `.blend` and embeds
them in the exported `.glb`, so the web viewer does not load loose textures.
