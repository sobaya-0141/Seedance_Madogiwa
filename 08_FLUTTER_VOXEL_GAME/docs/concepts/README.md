# Flutter voxel game screen concepts

Generated with the built-in `imagegen` tool in reference-image mode, using the
current Flutter showcase screenshot (`/tmp/madogiwa-showcase-final-landscape.png`)
as the composition and subject reference.

All three variants preserve the same core screen grammar: a 16:9, slightly
top-down arena; the voxel soba-shop character and tray; an objective gate;
the smash shockwave; joystick and smash controls; mission, telemetry, and
progress HUD regions.

## Selected direction: A — Prismatic Daylight

Use A as the visual target. It solves the dark-screen issue most completely
while retaining the current mint/cyan technology color, coral smash action,
and prismatic impact effect. It also gives the character, arena, and controls
the clearest hierarchy on a mobile display.

Implementation cues:

- Pearl-white to pale-aqua floor instead of a near-black field
- White/silver atrium frame and daylight backdrop instead of a dark void
- Mint/cyan grid and gate, with pastel prismatic impact particles
- Frosted white HUD cards with navy text
- Coral-orange reserved for the primary `SMASH` action
- Soft contact shadows for depth; no dark vignette or green cast

## Comparison

| Concept | Strength | Trade-off |
| --- | --- | --- |
| [A — Prismatic Daylight](./concept-a-prismatic-daylight.png) | Best balance of brightness, character readability, and the existing mint/coral identity | Very white; the real build should retain a little more floor contrast |
| [B — Flutter Blue Exhibition](./concept-b-flutter-blue-exhibition.png) | Clearest Flutter association and strong cool-color consistency | Feels closer to a product demo booth than the story world |
| [C — Golden Hour Pop](./concept-c-golden-hour-pop.png) | Warmest, friendliest, and most narrative environment | Orange sunlight competes with the smash button and shifts furthest from the current palette |

## Prompt set

### A — Prismatic Daylight

Create a high-fidelity 16:9 landscape mobile action-game gameplay screen
concept using the reference image's composition and subject. Preserve the
slightly top-down camera, centered recognizable cube-headed voxel soba-shop
character with outfit and tray, open arena, objective gate, smash shockwave,
bottom-left joystick, bottom-right `SMASH` button, compact mission and telemetry
cards, and bottom-center progress. Transform the dark cyber arena into a bright,
airy prismatic daylight atrium: luminous pearl-white and pale-aqua floor,
silver glass rails, skylight daylight, mint/cyan grid lines, and pastel ice-blue,
mint, lavender, and coral refractions. Use a mint-white gate and translucent
rainbow/cyan shockwave. Use frosted white HUD cards with navy text and keep coral
orange as the primary action. High-key exposure with soft contact shadows; no
black void, dark vignette, muddy green cast, extra characters, logos, watermarks,
or dense copy.

### B — Flutter Blue Exhibition

Create a high-fidelity 16:9 landscape mobile action-game gameplay screen
concept using the reference image's composition and subject. Preserve the
camera, voxel soba-shop character and tray, arena, objective gate, shockwave,
controls, and HUD regions. Reimagine the scene as a bright Flutter design
exhibition stage made of white, sky blue, Flutter blue, cyan, and mint: a
luminous pale-blue glass platform in a sunlit pavilion, white structural frames,
sky beyond, crisp cyan lane lighting, a white-blue gate, and an electric-blue
shockwave with mint voxel particles. Use bright white/light-blue glass cards,
navy labels, a pale-cyan joystick, and a coral-orange `SMASH` action. Keep it a
playful premium mobile game, without logos, a black void, night lighting, muddy
teal, extra characters, watermarks, or dense text.

### C — Golden Hour Pop

Create a high-fidelity 16:9 landscape mobile action-game gameplay screen
concept using the reference image's composition and subject. Preserve the
camera, voxel soba-shop character and tray, arena, objective gate, shockwave,
controls, and HUD regions. Turn the dark arena into a cheerful sunlit rooftop
office lounge at golden hour, using cream, peach, apricot, pale wood, clear sky
blue, mint, and cyan. Keep a bright ivory playfield with a subtle cyan grid,
glass walls, tidy voxel office props, a mint-white gate, and a golden-peach
shockwave with cyan sparks. Use warm-white glass cards, navy text, a mint
joystick, and a coral-orange `SMASH` button. Keep the scene high-key and readable;
avoid black backgrounds, muddy brown/orange casts, night lighting, clutter,
extra characters, logos, watermarks, and dense text.
