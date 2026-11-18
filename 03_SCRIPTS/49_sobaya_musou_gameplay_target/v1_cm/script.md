# そば屋無双 — ideal gameplay footage (target video for the game remake) — no-keyframe H3 run

## Production intent
- Purpose: a target video for remaking the Godot action game `12_SOBAYA_MUSOU_GODOT/` with better graphics (Tripo models). Most shots use the game's own camera: an elevated third-person chase camera behind Sobaya.
- **Style (user decision 2026-11-06): real-time 3D graphics of a modern AAA console action game**, matching the game-CG reference sheets the user made. This is an approved exception to the skill's photoreal default. No HUD/UI anywhere.
- No-keyframe production: every chapter is MiniMax H3 R2V driven by character sheets + mob sheets + location sheets + voice samples. Cinematic mode: official Ref2VA six-section prompts (`make_prompts.py`), several shots per generation, one take per chapter (seed 42). Finished as 16:9 (no 2.39:1 crop — the target is game footage).
- **Voice-sample mode**: the user chose two TTS takes of Sobaya's lines and asked to pass them as voice samples. Each speaking chapter attaches its take as `<Audio 1>: reference`; H3 performs the line written in `<d>`.
- Combat tone (WORLD_BIBLE): slapstick only — enemies fly, tumble and lie dazed with circling stars; no blood, nobody seriously hurt. Ordinary office workers and passers-by never fight and carry on calmly.
- No readable text anywhere (no exceptions in this run).
- Generation: Colab (`/colab-video`, H3 R2V), all 7 chapters in one notebook, first package = 480p preview. Total ≈ 63 s (1582 frames).

## Character references
| File | Who | PRESERVE | do NOT carry over |
|---|---|---|---|
| `Sobaya_gamecg_sheet.png` | Sobaya | hard glossy white full-face mask: TWO large round black eye holes (dark inside), ONE short horizontal mouth slit, red vertical markings above and below each eye hole as on the canon sheet, ONE small black forehead dot; short spiky black hair visible from front, side and back; neutral-gray skin on neck, ears, arms, hands; hulking 180 cm / 100 kg thick build; plain white short-sleeve T-shirt; charcoal jeans; white sneakers; large clear glass mug with handle, amber beer, white foam, in the RIGHT hand | gray studio background, four-view layout, hand-in-pocket pose |
| `Mob_factory_guard_sheet.png` | brewery guards (5 in ch1) | sky-blue short-sleeve uniform shirt with two chest pockets and navy epaulettes; navy trousers; black belt; light-gray work gloves; black shoes; navy peaked cap with plain silver shield emblem; empty hands | gray background, layout, the sheet man's face for every guard (faces vary) |
| `Mob_police_sheet.png` | police officers (4 in ch2, 3 in ch3, 2 in ch4) | dark-navy jacket with gold buttons and plain gold shield badge; white shirt, navy tie; black duty belt; white gloves; black shoes; navy peaked cap with plain round gold emblem; black baton in the right hand | gray background, layout, the comical side-eye expression on every officer |
| `Mob_inspector_sheet.png` | police inspector (boss, ch2) | huge barrel-chested man in his 50s, ~190 cm; thick black mustache; gray-black hair; near-black navy uniform with gold buttons and gold cuff bands; white shirt, dark tie; white gloves; navy cap with large round gold emblem and gold band | gray background, layout |
| `Mob_motor_police_sheet.png` | motorcycle officers (2 in ch3) | glossy white helmet with blue center stripe and smoked visor; sky-blue zip-up jacket with navy epaulettes; white belt; navy breeches with white side stripe; tall black riding boots; white gloves | gray background, layout |
| `Mob_riot_chief_sheet.png` | riot squad captain (boss, ch4) | huge broad man in his 40s, square jaw, scowl; dark-navy riot uniform; black plate armor on chest, shoulders, forearms, knees, shins; black gloves and boots; navy riot helmet with clear visor raised; tall clear riot shield | gray background, layout |
| `Mob_hq_guard_sheet.png` | building guards (4+2 in ch5, 2 in ch6) | medium-gray zip-up uniform jacket with plain silver shield patches; white shirt, navy tie; black belt; black shoes; black baton; gray peaked cap with silver shield emblem | gray background, layout |
| `Mob_security_head_sheet.png` | head of corporate security (boss, ch6) | huge heavy man in his late 50s; salt-and-pepper short hair; dark-navy suit-style uniform; gold shoulder boards; gold braided cord across the chest; gold buttons; white shirt, navy tie; white gloves; navy cap with large round gold emblem | gray background, layout, hands-behind-back pose |
| `Mob_crowd_office_sheet.png` | office workers (6 in ch5, 3 in ch7) | seven different men and women in office clothes (white/light-blue shirts with ties, blouse, beige cardigan, gray vest, navy jacket); blank white ID card on a blue neck strap | gray background, standing lineup |
| `Mob_crowd_passerby_sheet.png` | taiyaki cook + passers-by (ch3) | cook: cheerful man in his 60s, white cook's jacket, white apron, white cook's cap; elderly woman in lavender cardigan with cloth bag; high-school girl in navy sailor uniform; salaryman in dark-gray suit with briefcase; young woman in camel coat; man in green jacket with a shiba dog | gray background, standing lineup, the cook's tongs pose |

## Location references
| File | Place | PRESERVE | do NOT carry over |
|---|---|---|---|
| `Loc_factory_sheet.png` | brewery yard (ch1) + production hall (ch2) | yard: concrete with yellow lines, cream buildings, dark pillars, silver pipes, white box trucks with yellow cabs, red/yellow beer crates on pallets, silos, gray roll-up shutter. hall: steel brewing tanks with yellow railings, two bottle conveyors, central walkway, skylight beams, three golden barrels with brass taps in a glowing alcove | 2x2 panel layout, the blank yellow banners, the mountains behind the yard |
| `Loc_azabu_shotengai_sheet.png` | shopping street at sunset (ch3) | pink-orange sky, wet asphalt with puddles, brick sidewalks, colored awnings, taiyaki stall with red canopy and glass case, fruit stand, red paper lanterns, red welcome arch, utility poles, lit street lamps | 2x2 panel layout, the rooftop aerial angle |
| `Loc_hq_plaza_sheet.png` | headquarters plaza at dusk (ch4) | dark-blue glass tower with warm lit windows, white steel canopy over a glass entrance, gray stone paving, lit planters with trees, bollard lights, red-and-white Tokyo Tower in the right distance, orange-to-blue sky | 2x2 panel layout, the front steps |
| `Loc_hq_office_sheet.png` | lobby + 12F office (ch5) | lobby: white/beige checkerboard marble, round white columns, white reception counter with wood top, dark wood wall, gray sofas, plants, silver elevators, glass turnstile partition. office: navy checkered carpet, white island desks with monitors, black mesh chairs, glass meeting room, wooden bookshelves, white ceiling panels | 2x2 panel layout, window views of the city in the office panels |
| `Loc_madogiwa_sheet.png` | window-side hangout corner + standing bar (ch6, ch7) | floor-to-ceiling glass windows, Tokyo cityscape with Tokyo Tower, wooden plank floor, wooden stall with shingled roof, chrome beer server, glass mugs, three navy noren panels, two red paper lanterns, wooden barrels, cardboard-box chair, green dome tent, black kettle grill, red-brown sofa with speakers, floor lamp, cardboard boxes | 2x2 panel layout, the blank cardboard signboard |

## Scene ledger
| | C1 | C2 | C3 | C4 | C5 | C6 | C7 |
|---|---|---|---|---|---|---|---|
| Place | brewery yard (outdoor) | brewery production hall | Azabu-Juban street | HQ plaza | HQ lobby → 12F office | 12F window-side corner | same corner, at the stall |
| Time / light | summer midday, clear sky | midday through skylights, light haze | sunset, pink-orange sky, wet street | just after sunset, orange→deep blue | morning, bright | early morning, low golden sun through windows | same as C6 |

## Prop state ledger
| Prop | C1 | C2 | C3 | C4 | C5 | C6 | C7 |
|---|---|---|---|---|---|---|---|
| Sobaya's beer mug (right hand) | full | half → full (filled at the golden barrel) | full | full | full | full | full, raised for the toast |
| Stall's red lanterns | - | - | - | - | - | unlit | light up after the line |

## Camera plan
| Ch | Shots | Camera | Join |
|---|---|---|---|
| 1 | 3 | game chase cam (static → tracking forward) → low-angle static | CUT (new shot) |
| 2 | 3 | game chase cam static → wider chase cam pulling back slowly → medium side static | CUT (new shot) |
| 3 | 3 | game chase cam tracking forward → static → low angle behind the taiyaki stall, static | CUT (new shot) |
| 4 | 2 | game chase cam static → low angle, slow small tilt up | CUT (new shot) |
| 5 | 2 | game chase cam, slow small push forward → higher game cam static | CUT (new shot) |
| 6 | 2 | game chase cam static → wider game cam pulling back slowly | CUT (new shot) |
| 7 | 1 | medium eye-level at the counter, slow small push-in | end |

## Dialogue audio
| Ch | Speaker | Line | File | Duration | Engine (user-selected) |
|---|---|---|---|---|---|
| 1 | Sobaya | ビールが…足りない…！ | `ch1_line1_sobaya.wav` | 2.30 s | VoxCPM2 (seed 42) + `sobaya_monsterize.sh` — voice-timbre reference |
| 7 | Sobaya | 快適です！ | `ch7_line1_sobaya.wav` | 2.0 s (padded from 1.03 s) | Irodori-TTS v4-Large (seed 42, 1.2x) + `sobaya_monsterize.sh` — voice-timbre reference |


## Chapter 1 — Stage 1 — storming the brewery yard

Approved plan: `chapter_plan.md` Chapter 1. Line: Sobaya: ビールが…足りない…！

### H3 inputs (Chapter 1)
- Mode: R2V
- Cast: Sobaya, Mob:factory_guard
- Locations: factory
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_factory_guard_sheet.png` — brewery security-guard uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Loc_factory_sheet.png` — brewery yard + production hall (location sheet), identity/design reference only, NOT a composition reference
- Audio (voice-timbre reference):
  - <Audio 1> = `ch1_line1_sobaya.wav` — Sobaya's voice sample (VoxCPM2 + monsterize, user-selected)
- Total input files: 4
- Frames: 243 (10.125s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the brewery security-guard uniform in <Picture 2>: a light sky-blue short-sleeve uniform shirt with two chest pockets and dark-navy epaulettes, dark-navy trousers, a black belt, light-gray work gloves, black shoes and a dark-navy peaked cap with a plain silver shield emblem; exactly five guards wear it, Japanese men of different ages and builds.
<Subject 3> is the front yard of the golden beer brewery in <Picture 3> on a sunny summer midday: gray concrete ground with yellow painted safety lines, cream-colored factory buildings with dark steel pillars and long silver pipes, white box trucks with yellow cabs, pallets stacked with red and yellow plastic beer crates, tall silver silos behind, and a large closed gray roll-up shutter at the far end.
<Audio 1> is the voice-timbre reference for <Subject 1> (S1).

summary:
[reference generation + audio reuse] In the brewery yard of <Subject 3>, <Subject 1> peers into his beer mug and growls his line in the voice of <Audio 1>; five guards of <Subject 2> charge at him, and he knocks them flying with a punch, a hook and a ground-smashing slam that sends out a golden shockwave.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained.
<Subject 2> (appears in [Shot 1], [Shot 2], [Shot 3]): partially_preserved - the sky-blue shirt, navy trousers, gray gloves and navy cap with silver emblem are retained on five different men.
<Subject 3> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - the concrete yard, yellow lines, cream buildings, white-and-yellow trucks, beer crates, silos and gray shutter stay the same.
<Audio 1>: reference - only the voice timbre of <Subject 1> is taken from it; the line is newly performed in that voice.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. <Subject 1> appears EXACTLY ONCE; exactly five guards of <Subject 2> appear and nobody else.
[Shot 1] An elevated third-person game camera about 8 meters behind <Subject 1> and 4.5 meters above the ground, looking down over his back at about 25 degrees, so he is seen from behind in the lower center of frame, like an action game's chase camera. <Subject 1> stands at the near end of <Subject 3> on a sunny summer midday, white trucks and beer-crate pallets on both sides. At 00:00.300, he lifts his beer mug, tilts his masked head to peer into it, and <Subject 1> (S1) growls in a deep, gravelly, monster-like voice whose timbre follows <Audio 1>, the voice coming from behind his mask, <d>[Japanese] ビールが…足りない…！</d> The mouth slit of his mask never moves. Far ahead, in front of the gray shutter, five guards of <Subject 2> start running toward him. The camera holds steady behind him.
[Shot 2] At 00:02.500, the shot cuts back to the elevated chase camera following <Subject 1> as he runs forward. He swings his beer mug in a straight punch into the first guard, then a wide hook into the second; both are blasted backward and tumble across the concrete. The third and fourth guards close in from the left and right. The camera tracks forward with him at medium speed.
[Shot 3] At 00:07.000, the shot cuts to a low-angle medium shot in front of <Subject 1>, looking up at him. He raises the beer mug high overhead and slams it down onto the concrete; a ring-shaped golden shockwave bursts outward across the ground and the three remaining guards are thrown into the air together, while beer foam sprays in glittering droplets. The shot ends with him crouched over the mug on the ground and the three guards hanging in mid-air. The camera holds a static shot.
Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
Bright summer cicadas and a distant factory hum, then heavy running footsteps on concrete, the whoosh of the mug, two meaty punch impacts with comical boing sounds, guards yelping, and a deep booming ground slam with a rolling shockwave and a fizzing splash of beer.

non_diegetic_music:
N/A
```

## Chapter 2 — Stage 1 — boss fight on the production line

Approved plan: `chapter_plan.md` Chapter 2. Line: (no dialogue)

### H3 inputs (Chapter 2)
- Mode: R2V
- Cast: Sobaya, Mob:police, Mob:inspector
- Locations: factory
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_police_sheet.png` — police-officer uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Mob_inspector_sheet.png` — police inspector, boss of stage 1 (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 4> = `Loc_factory_sheet.png` — brewery yard + production hall (location sheet), identity/design reference only, NOT a composition reference
- Audio: none (no speech)
- Total input files: 4
- Frames: 294 (12.250s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, half full of amber beer under a little white foam at first; he swings it as his weapon, and it never breaks.
<Subject 2> is the police-officer uniform in <Picture 2>: a dark-navy uniform jacket with gold buttons and a plain gold shield badge, a white shirt with a navy tie, a black duty belt, white gloves, black shoes, a dark-navy peaked cap with a plain round gold emblem, and a black baton in the right hand; exactly four officers wear it, Japanese men of different ages and builds.
<Subject 3> is the police inspector in <Picture 3>, a huge barrel-chested Japanese man in his fifties, about 190 cm tall, with a thick black mustache and gray-black hair, in a near-black navy uniform with gold buttons and gold cuff bands, a white shirt and dark tie, white gloves, and a dark-navy peaked cap with a large round gold emblem and a gold band.
<Subject 4> is the production hall of the golden beer brewery in <Picture 4>: tall polished stainless-steel brewing tanks with yellow railings on both sides, two long conveyor belts carrying rows of brown glass beer bottles along a central walkway with yellow lines, skylights casting soft beams of sunlight through faint haze, and at the far end a glowing alcove with three golden wooden beer barrels with brass taps.

summary:
[reference generation] In the brewery production hall of <Subject 4>, the boss <Subject 3> pounds the floor to send a shockwave at <Subject 1>, who rolls aside, then unleashes a glowing golden spinning attack that blasts <Subject 3> and four officers of <Subject 2> away, and finally fills his beer mug from a golden barrel.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained.
<Subject 2> (appears in [Shot 1], [Shot 2]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and black baton are retained on four different men.
<Subject 3> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - his huge build, black mustache, near-black navy uniform with gold trim, white gloves and gold-banded cap are retained.
<Subject 4> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - the steel tanks, bottle conveyors, skylight beams and golden barrels stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. <Subject 1> and <Subject 3> each appear EXACTLY ONCE; exactly four officers of <Subject 2> appear and nobody else.
[Shot 1] An elevated third-person game camera about 8 meters behind <Subject 1> and 4.5 meters above the ground, looking down over his back at about 25 degrees, so he is seen from behind in the lower center of frame, like an action game's chase camera, looking down the central walkway of <Subject 4> between the moving bottle conveyors, skylight beams slanting through faint haze. At the far end, <Subject 3> drops to one knee and pounds the floor with his fist; an orange shockwave ring races across the floor toward <Subject 1>, who dives into a forward roll to the side and comes up on his feet as the ring passes. Two officers of <Subject 2> close in from the left and two from the right, batons raised. The camera holds steady behind him.
[Shot 2] At 00:04.000, the shot cuts to a slightly wider, higher chase camera. The beer mug of <Subject 1> begins to glow bright gold and golden sparks rise all around his body. He spins like a top three full turns with the mug held out at arm's length, and the four officers and <Subject 3> are blasted away in all directions, bouncing off the floor. A large golden ring of light bursts outward at the end of the spin. The camera pulls back with small amplitude at slow speed.
[Shot 3] At 00:08.500, the shot cuts to a medium side shot at the golden barrels. <Subject 1> holds his beer mug under the brass tap of a glowing golden barrel; fresh amber beer pours in and a thick white foam head rises to the rim. Far behind him, slightly out of focus, <Subject 3> lies flat on the floor with stars circling over his head. The camera holds a static shot.
Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Nobody speaks. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
The clinking of bottles on moving conveyors and a steady machine hum, a heavy floor-pounding boom and the crackling rumble of the shockwave, a quick roll, then a rising golden whoosh, a whirlwind of spinning air with rapid impacts and comical yelps, a bright booming burst, and finally the gurgle of beer pouring into a glass mug with fizzing foam.

non_diegetic_music:
N/A
```

## Chapter 3 — Stage 2 — Azabu-Juban shopping street

Approved plan: `chapter_plan.md` Chapter 3. Line: (no dialogue)

### H3 inputs (Chapter 3)
- Mode: R2V
- Cast: Sobaya, Mob:police, Mob:motor_police, Mob:crowd_passerby
- Locations: azabu_shotengai
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_police_sheet.png` — police-officer uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Mob_motor_police_sheet.png` — motorcycle-police uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 4> = `Mob_crowd_passerby_sheet.png` — shopping-street people lineup (crowd sheet), identity/design reference only, NOT a composition reference
  - <Picture 5> = `Loc_azabu_shotengai_sheet.png` — Azabu-Juban shopping street at sunset (location sheet), identity/design reference only, NOT a composition reference
- Audio: none (no speech)
- Total input files: 5
- Frames: 243 (10.125s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the police-officer uniform in <Picture 2>: a dark-navy uniform jacket with gold buttons and a plain gold shield badge, a white shirt with a navy tie, a black duty belt, white gloves, black shoes, a dark-navy peaked cap with a plain round gold emblem, and a black baton in the right hand; exactly three officers wear it, Japanese men of different ages and builds.
<Subject 3> is the motorcycle-police uniform in <Picture 3>: a glossy white helmet with a blue center stripe and a smoked visor, a sky-blue zip-up uniform jacket with dark-navy epaulettes, a white belt, dark-navy riding breeches with a white side stripe, tall black riding boots and white gloves; exactly two officers wear it.
<Subject 4> is the shopping-street people from <Picture 4>: the taiyaki cook, a cheerful Japanese man in his sixties in a white cook's jacket, white apron and white cook's cap, and the passers-by — an elderly woman in a lavender cardigan with a cloth shopping bag, a high-school girl in a navy sailor uniform, a salaryman in a dark-gray suit with a briefcase, a young woman in a camel coat, and a man in a green jacket walking a shiba dog; each of them appears once, and none of them fights.
<Subject 5> is the Azabu-Juban shopping street in <Picture 5> at sunset: a pink-orange sky, a two-lane asphalt street wet after rain with reflective puddles, brick-tiled sidewalks, small shops with red, green, yellow and purple fabric awnings and glowing windows, a taiyaki stall with a red canopy and a glass case of fish-shaped cakes, a fruit stand, rows of glowing red paper lanterns, a red steel welcome arch over the street, utility poles with power lines, lit curved street lamps and tall glass towers in the distance.

summary:
[reference generation] At sunset in the shopping street of <Subject 5>, <Subject 1> runs with his beer mug, spins to sweep away three officers of <Subject 2> and two motorcycle officers of <Subject 3>, and runs on, while the taiyaki cook and passers-by of <Subject 4> calmly carry on with their day.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained.
<Subject 2> (appears in [Shot 1], [Shot 2]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and baton are retained on three different men.
<Subject 3> (appears in [Shot 1], [Shot 2]): partially_preserved - the white striped helmet, sky-blue jacket, navy breeches and tall black boots are retained on two men.
<Subject 4> (appears in [Shot 1], [Shot 3]): partially_preserved - the cook's white outfit and the passers-by's clothes are retained.
<Subject 5> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - the sunset sky, wet street, awnings, red lanterns, welcome arch, taiyaki stall and street lamps stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. <Subject 1> appears EXACTLY ONCE; exactly three officers of <Subject 2>, two officers of <Subject 3> and the people of <Subject 4> appear, each once, and nobody else.
[Shot 1] An elevated third-person game camera about 8 meters behind <Subject 1> and 4.5 meters above the ground, looking down over his back at about 25 degrees, so he is seen from behind in the lower center of frame, like an action game's chase camera, running down the middle of the wet street of <Subject 5> at sunset under the glowing red lanterns, the welcome arch ahead. <Subject 1> runs forward with his full beer mug. From the far end, the three officers of <Subject 2> and the two motorcycle officers of <Subject 3> run toward him. On the right sidewalk, the taiyaki cook of <Subject 4> keeps turning cakes at his red-canopied stall, and the passers-by of <Subject 4> stroll and chat on the sidewalks without looking up. The camera tracks forward with him at medium speed.
[Shot 2] At 00:04.000, the shot cuts to the elevated chase camera, now holding still. As the five officers reach him, <Subject 1> spins one full turn with the beer mug held out, and all five are swept off their feet and fly backward under the lanterns, splashing down into the puddles with bright sprays of water. The camera holds a static shot.
[Shot 3] At 00:07.500, the shot cuts to a low-angle shot from behind the glass case of the taiyaki stall. In the foreground the cook's hands calmly flip a golden fish-shaped cake in its iron mold; beyond the stall, slightly out of focus, <Subject 1> runs away down the wet street toward the arch. The cook never looks up. The camera holds a static shot.
Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Nobody speaks. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
Evening street ambience with distant chatter, a bicycle bell and the sizzle of taiyaki batter on hot iron, then heavy running footsteps splashing through puddles, police whistles, a whooshing spin with a chain of comical impacts and big water splashes, and the gentle clack of the taiyaki mold.

non_diegetic_music:
N/A
```

## Chapter 4 — Stage 2 — headquarters plaza

Approved plan: `chapter_plan.md` Chapter 4. Line: (no dialogue)

### H3 inputs (Chapter 4)
- Mode: R2V
- Cast: Sobaya, Mob:riot_chief, Mob:police
- Locations: hq_plaza
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_riot_chief_sheet.png` — riot squad captain, boss of stage 2 (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Mob_police_sheet.png` — police-officer uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 4> = `Loc_hq_plaza_sheet.png` — headquarters plaza at dusk (location sheet), identity/design reference only, NOT a composition reference
- Audio: none (no speech)
- Total input files: 4
- Frames: 192 (8.000s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the riot squad captain in <Picture 2>, a huge, broad Japanese man in his forties with a square jaw and a fierce scowl, in a dark-navy riot uniform with black plate armor on his chest, shoulders, forearms, knees and shins, black gloves and boots, and a dark-navy riot helmet with its clear visor raised, carrying a tall clear transparent riot shield.
<Subject 3> is the police-officer uniform in <Picture 3>: a dark-navy uniform jacket with gold buttons and a plain gold shield badge, a white shirt with a navy tie, a black duty belt, white gloves, black shoes, a dark-navy peaked cap with a plain round gold emblem, and a black baton in the right hand; exactly two officers wear it.
<Subject 4> is the paved plaza in front of the corporate headquarters tower in <Picture 4> just after sunset: a sky fading from orange to deep blue, a tall dark-blue glass curtain-wall skyscraper with scattered warm lit windows, a glass entrance under a white steel canopy, large gray stone paving tiles, stone planters with trees lit from below, low bollard lights, and the red-and-white Tokyo Tower glowing in the right distance.

summary:
[reference generation] At dusk on the headquarters plaza of <Subject 4>, the boss <Subject 2> blocks the entrance with his riot shield beside two officers of <Subject 3>; <Subject 1> slams his beer mug into the ground, launching all three high into the air, and walks toward the glass entrance with Tokyo Tower glowing beyond.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained.
<Subject 2> (appears in [Shot 1], [Shot 2]): fully_preserved - his huge build, square jaw, navy riot uniform with black armor, raised-visor helmet and clear riot shield are retained.
<Subject 3> (appears in [Shot 1], [Shot 2]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and baton are retained on two men.
<Subject 4> (appears in [Shot 1], [Shot 2]): fully_preserved - the dusk sky, dark-blue glass tower, canopy entrance, stone paving, lit planters and Tokyo Tower stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. <Subject 1> and <Subject 2> each appear EXACTLY ONCE; exactly two officers of <Subject 3> appear and nobody else. Tokyo Tower appears once, in the distance only.
[Shot 1] An elevated third-person game camera about 8 meters behind <Subject 1> and 4.5 meters above the ground, looking down over his back at about 25 degrees, so he is seen from behind in the lower center of frame, like an action game's chase camera, looking across the stone plaza of <Subject 4> toward the glass entrance just after sunset. In front of the entrance, <Subject 2> stands planted with his clear riot shield raised, one officer of <Subject 3> on each side of him with batons ready. <Subject 1> walks toward them with his beer mug. The camera holds steady behind him.
[Shot 2] At 00:03.500, the shot cuts to a low-angle shot from just behind and beside <Subject 1>, the glowing glass tower above and Tokyo Tower in the right distance against the orange-to-blue sky. He swings the beer mug high and slams it into the paving; a golden shockwave ring explodes outward and <Subject 2>, still clutching his shield, and both officers are launched high into the dusk sky, spinning. <Subject 1> rises and walks toward the glass entrance. The shot ends with the three tumbling in mid-air and him walking away from camera. The camera tilts up with small amplitude at slow speed.
Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Nobody speaks. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
A calm evening breeze, distant city traffic and a faint train, then steady footsteps on stone, a tense thud of the shield, the whoosh of the mug and a huge booming ground slam with a rolling shockwave, a clatter of the shield and comical fading yells as they fly away.

non_diegetic_music:
N/A
```

## Chapter 5 — Stage 3 — lobby and 12F office

Approved plan: `chapter_plan.md` Chapter 5. Line: (no dialogue)

### H3 inputs (Chapter 5)
- Mode: R2V
- Cast: Sobaya, Mob:hq_guard, Mob:crowd_office
- Locations: hq_office
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_hq_guard_sheet.png` — corporate building-security uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Mob_crowd_office_sheet.png` — office-worker lineup (crowd sheet, weak reference), identity/design reference only, NOT a composition reference
  - <Picture 4> = `Loc_hq_office_sheet.png` — headquarters lobby + 12F office (location sheet), identity/design reference only, NOT a composition reference
- Audio: none (no speech)
- Total input files: 4
- Frames: 243 (10.125s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the corporate building-security uniform in <Picture 2>: a medium-gray zip-up uniform jacket with plain silver shield patches, a white shirt with a navy tie, a black belt, black shoes, a black baton, and a medium-gray peaked cap with a plain silver shield emblem; exactly four guards wear it in [Shot 1] and exactly two in [Shot 2], Japanese men of different ages and builds.
<Subject 3> is the office workers whose faces, ages and clothes come from the seven different people in <Picture 3>: white and light-blue shirts with ties, a light-blue blouse, a beige cardigan, a gray vest, a navy jacket, each with a blank white ID card on a blue neck strap; exactly six of them sit at the desks in [Shot 2], and none of them fights.
<Subject 4> is the headquarters interior in <Picture 4>: the ground-floor lobby with a polished white-and-beige checkerboard marble floor, thick round white columns, a white reception counter with a wooden top before a dark wood wall, gray sofas and potted plants, silver elevators and a glass partition with security turnstiles; and the 12th-floor open-plan office with navy-blue checkered carpet tiles, long white island desks with monitors showing soft abstract colors, black mesh office chairs, a glass-walled meeting room, tall wooden bookshelves and white ceiling light panels.

summary:
[reference generation] In the morning, inside the headquarters of <Subject 4>, <Subject 1> knocks four guards of <Subject 2> across the polished marble lobby, then in the 12th-floor office sends two more flying down the aisle while six office workers of <Subject 3> keep typing without looking up.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained.
<Subject 2> (appears in [Shot 1], [Shot 2]): partially_preserved - the gray uniform, navy tie, gray cap with silver emblem and black baton are retained on different men.
<Subject 3> (appears in [Shot 2]): weak_reference - only the variety of faces, ages and office clothes with blank ID cards is taken from the lineup.
<Subject 4> (appears in [Shot 1], [Shot 2]): fully_preserved - the checkerboard marble lobby, white columns, reception counter and turnstiles, and the blue-carpet office with white island desks stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. <Subject 1> appears EXACTLY ONCE; the guards and office workers appear only in the numbers stated, and nobody else.
[Shot 1] An elevated third-person game camera about 8 meters behind <Subject 1> and 4.5 meters above the ground, looking down over his back at about 25 degrees, so he is seen from behind in the lower center of frame, like an action game's chase camera, in the ground-floor lobby of <Subject 4> in bright morning light, the checkerboard marble floor polished like a mirror and reflecting everyone. From the glass turnstiles at the far end, four guards of <Subject 2> rush toward <Subject 1>. He meets them with a straight punch, a hook and a downward slam of his beer mug; a golden shockwave ring skims across the marble and all four slide and tumble away between the white columns. The camera moves forward with small amplitude at slow speed.
[Shot 2] At 00:04.500, the shot cuts to a higher elevated game camera in the 12th-floor office, looking down a long carpeted aisle between white island desks. <Subject 1> runs down the aisle; at its far end two guards of <Subject 2> block his way, and he sends both flying with one wide hook of the beer mug, sheets of paper fluttering into the air. On both sides, six office workers of <Subject 3> sit at their monitors and keep typing calmly, never looking up. The shot ends with the two guards lying dazed at the end of the aisle and the workers still typing. The camera holds a static shot.
Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Nobody speaks. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
The airy hush of a marble lobby with the soft beep of turnstiles, squeaking shoes and running footsteps, the whoosh of the mug, comical punch impacts, a booming slam that echoes off the columns, then the steady clatter of keyboards and a quiet air conditioner in the office under one more impact and fluttering paper.

non_diegetic_music:
N/A
```

## Chapter 6 — Stage 3 — boss fight at the window-side corner

Approved plan: `chapter_plan.md` Chapter 6. Line: (no dialogue)

### H3 inputs (Chapter 6)
- Mode: R2V
- Cast: Sobaya, Mob:security_head, Mob:hq_guard
- Locations: madogiwa
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_security_head_sheet.png` — head of corporate security, boss of stage 3 (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Mob_hq_guard_sheet.png` — corporate building-security uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 4> = `Loc_madogiwa_sheet.png` — window-side hangout corner + standing bar (location sheet), identity/design reference only, NOT a composition reference
- Audio: none (no speech)
- Total input files: 4
- Frames: 243 (10.125s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the head of corporate security in <Picture 2>, a huge, heavy Japanese man in his late fifties with short salt-and-pepper hair, in a dark-navy suit-style uniform with gold shoulder boards, a gold braided cord across his chest and gold buttons, a white shirt and navy tie, white gloves, and a dark-navy peaked cap with a large round gold emblem.
<Subject 3> is the corporate building-security uniform in <Picture 3>: a medium-gray zip-up uniform jacket with plain silver shield patches, a white shirt with a navy tie, a black belt, black shoes, a black baton, and a medium-gray peaked cap with a plain silver shield emblem; exactly two guards wear it.
<Subject 4> is the do-it-yourself window-side hangout corner of the 12th-floor office in <Picture 4>: floor-to-ceiling glass windows with slim metal mullions, a wide Tokyo cityscape with the red-and-white Tokyo Tower beyond, a warm wooden plank floor, a wooden Japanese standing-bar stall with a shingled roof, a chrome beer server and glass mugs on its counter, three dark-navy noren curtain panels and two round red paper lanterns, plus wooden beer barrels, a chair made of stacked cardboard boxes, a green dome tent, a black kettle grill, a red-brown sofa with tall speakers, a floor lamp and stacked cardboard boxes.

summary:
[reference generation] In the window-side hangout corner of <Subject 4>, lit by low morning sun, the boss <Subject 2> and two guards of <Subject 3> block the little standing-bar stall; <Subject 2> pounds the floor, and <Subject 1> answers with a glowing golden spinning attack that blasts all three away through the sunbeams.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained.
<Subject 2> (appears in [Shot 1], [Shot 2]): fully_preserved - his huge build, salt-and-pepper hair, navy suit-style uniform with gold shoulder boards and braided cord, white gloves and gold-emblem cap are retained.
<Subject 3> (appears in [Shot 1], [Shot 2]): partially_preserved - the gray uniform, navy tie, gray cap and baton are retained on two men.
<Subject 4> (appears in [Shot 1], [Shot 2]): fully_preserved - the glass window wall with Tokyo Tower, wooden floor, standing-bar stall with navy noren and red lanterns, barrels, cardboard chair, tent, grill and sofa stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. <Subject 1> and <Subject 2> each appear EXACTLY ONCE; exactly two guards of <Subject 3> appear and nobody else. Tokyo Tower appears once, outside the windows.
[Shot 1] An elevated third-person game camera about 8 meters behind <Subject 1> and 4.5 meters above the ground, looking down over his back at about 25 degrees, so he is seen from behind in the lower center of frame, like an action game's chase camera, looking toward the glass window wall of <Subject 4> in early morning, low golden sunlight streaming in and laying long window-frame shadows across the wooden floor. In front of the standing-bar stall, <Subject 2> stands with a guard of <Subject 3> on each side. <Subject 2> stamps down and pounds the floor with his fist, and an orange shockwave ring races across the planks; <Subject 1> hops over it. The two red lanterns of the stall are unlit. The camera holds steady behind him.
[Shot 2] At 00:04.000, the shot cuts to a slightly wider, higher game camera. The beer mug of <Subject 1> glows bright gold and golden sparks rise around him; he spins three full turns, and <Subject 2> and both guards are blasted away through the slanted sunbeams, bouncing across the floor past the cardboard boxes and the tent. A large golden ring of light bursts outward. The shot ends with the three lying dazed and <Subject 1> standing alone in front of the stall. The camera pulls back with small amplitude at slow speed.
Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. The stall, barrels, tent and grill are never damaged. Nobody speaks. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
A quiet morning office with a soft air conditioner and distant city noise beyond the glass, then a heavy stomp and a crackling floor shockwave, a light landing, a rising golden whoosh, a whirlwind of spinning air with comical impacts and yelps, and a bright booming burst that rattles the glass mugs on the counter.

non_diegetic_music:
N/A
```

## Chapter 7 — Ending — the standing bar opens

Approved plan: `chapter_plan.md` Chapter 7. Line: Sobaya: 快適です！

### H3 inputs (Chapter 7)
- Mode: R2V
- Cast: Sobaya, Mob:crowd_office
- Locations: madogiwa
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_crowd_office_sheet.png` — office-worker lineup (crowd sheet, weak reference), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Loc_madogiwa_sheet.png` — window-side hangout corner + standing bar (location sheet), identity/design reference only, NOT a composition reference
- Audio (voice-timbre reference):
  - <Audio 1> = `ch7_line1_sobaya.wav` — Sobaya's voice sample (Irodori-TTS 1.2x + monsterize, user-selected, padded to 2.0 s)
- Total input files: 4
- Frames: 124 (5.167s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head.
<Subject 2> is the office workers whose faces, ages and clothes come from the seven different people in <Picture 2>: white and light-blue shirts with ties, a light-blue blouse, a beige cardigan, a gray vest, a navy jacket, each with a blank white ID card on a blue neck strap; exactly three of them stand at the counter as customers, each holding the same kind of clear glass beer mug full of beer.
<Subject 3> is the do-it-yourself window-side hangout corner of the 12th-floor office in <Picture 3>: floor-to-ceiling glass windows with slim metal mullions, a wide Tokyo cityscape with the red-and-white Tokyo Tower beyond, a warm wooden plank floor, a wooden Japanese standing-bar stall with a shingled roof, a chrome beer server and glass mugs on its counter, three dark-navy noren curtain panels and two round red paper lanterns, plus wooden beer barrels, a chair made of stacked cardboard boxes, a green dome tent, a black kettle grill, a red-brown sofa with tall speakers, a floor lamp and stacked cardboard boxes.
<Audio 1> is the voice-timbre reference for <Subject 1> (S1).

summary:
[reference generation + audio reuse] At the little standing-bar stall of <Subject 3>, <Subject 1> raises his beer mug behind the counter and declares his line in the voice of <Audio 1>; the red lanterns light up and three office workers of <Subject 2> raise their mugs in a toast.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt and the clear glass beer mug are retained.
<Subject 2> (appears in [Shot 1]): weak_reference - only the faces and office clothes of three of the people, with blank ID cards, are taken from the lineup.
<Subject 3> (appears in [Shot 1]): fully_preserved - the stall with its navy noren and red lanterns, the beer server, the window wall and Tokyo Tower stay the same.
<Audio 1>: reference - only the voice timbre of <Subject 1> is taken from it; the line is newly performed in that voice.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. <Subject 1> appears EXACTLY ONCE and exactly three office workers of <Subject 2> appear; nobody else.
[Shot 1] A medium shot at eye level facing the counter of the standing-bar stall of <Subject 3> in low golden morning light, Tokyo Tower beyond the window behind it. <Subject 1> stands behind the counter under the three navy noren panels. At 00:00.300, he raises his full beer mug high and <Subject 1> (S1) declares cheerfully in a deep, gravelly, monster-like voice whose timbre follows <Audio 1>, the voice coming from behind his mask, <d>[Japanese] 快適です！</d> The mouth slit of his mask never moves. Right after the line, the two round red paper lanterns light up with a warm glow and the noren sway gently. In front of the counter, the three office workers of <Subject 2>, seen from behind and the side, lift their mugs, and all four clink their mugs together in a toast, foam splashing. The shot ends on the raised mugs. The camera pushes in with small amplitude at slow speed.
In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
A soft morning hush by the windows and the hum of the beer server, his booming cheerful voice, a gentle whoosh as the lanterns glow, the rustle of the noren, then the bright clink of four glass mugs, laughter and fizzing foam.

non_diegetic_music:
N/A
```


## Generation & assembly protocol (REQUIRED — read before generating any chapter)

### Step 1 — Generate ALL chapters in one run, then verify EVERY chapter
Generate every chapter in one batch (one notebook run, 480p preview first). After collecting the mp4s, verify ALL of the following on EACH chapter:
- [ ] No attached sheet is reproduced as a frame: no panels, no gray sheet background, no lineup, no labels or text anywhere
- [ ] Each shot matches its written camera (game chase camera behind Sobaya where written), place and action order, and ends in the written end state
- [ ] Sobaya matches `Sobaya_gamecg_sheet.png` item by item (mask holes/slit/markings/dot, spiky hair from behind, gray skin, build, outfit, mug in the right hand); every mob matches its sheet. A near-miss is a FAIL
- [ ] Enemy counts per shot are exactly as written; Sobaya and each boss appear EXACTLY ONCE in every sampled frame (sample at least 3 mid-chapter frames)
- [ ] Knocked-out enemies are comical (stars, tumbling) with no blood; office workers / passers-by never fight
- [ ] The style is consistent AAA game CG in every shot; place, time of day and light match the Scene ledger
- [ ] In ch1/ch7 the line is spoken in Sobaya's voice (timbre from the attached sample) and his mask's mouth slit never moves
- [ ] NO on-screen text and NO HUD; duration equals the declared frame count (17k+5 grid)
If any check fails on a chapter, fix that chapter's prompt and regenerate ONLY the failed chapters (a `--fix` package limited with `--chapters`).

### Step 2 — Prompts are verbatim
Each workflow JSON carries the chapter's prompt exactly as embedded below (`make_prompts.py` → `chN_prompt.txt` → `gen_all_workflows.sh`). Do NOT summarize or shorten.

### Step 3 — Assembly
Keep H3's embedded audio. Concatenate ch1–ch7 at 16:9 (no 2.39:1 crop), loudness-normalize, no background music unless the user supplies one.
