# そば屋無双 — gameplay footage v2 (target video for the game remake) — no-keyframe H3 run

## Production intent
- Purpose: a target video for remaking the Godot action game `12_SOBAYA_MUSOU_GODOT/` with better graphics (Tripo models).
- **v2 (2026-11-09, user: "a CM is fine, but I want gameplay footage")**: every chapter is ONE continuous 15 s take from the game's chase camera (no cuts, no close-ups, no cutscene shots), with a musou-style horde of 15–20 enemies on screen. The game HUD (health/musou gauges, KO count, combo) is composited at assembly, never generated. v1 (cinematic) is kept in `v1_cm/`.
- **HQ (768p) revision (2026-11-09)**: each chapter adds one moment where Sobaya takes an enemy hit (comical hit reaction, instant recovery; the HUD health bar drops there at assembly); ch2 camera locked behind him, ch6 no jumping and no camera push for the victory pose.
- **Style (user decision 2026-11-06): real-time 3D graphics of a modern AAA console action game**, matching the game-CG reference sheets the user made. This is an approved exception to the skill's photoreal default. No HUD/UI anywhere.
- No-keyframe production: every chapter is MiniMax H3 R2V driven by character sheets + mob sheets + location sheets + voice samples. Cinematic mode: official Ref2VA six-section prompts (`make_prompts.py`), one continuous shot per generation, one take per chapter (seed 42). Finished as 16:9 (no 2.39:1 crop — the target is game footage).
- **Voice-sample mode**: the user chose two TTS takes of Sobaya's lines and asked to pass them as voice samples. Each speaking chapter attaches its take as `<Audio 1>: reference`; H3 performs the line written in `<d>`.
- Combat tone (WORLD_BIBLE): slapstick only — enemies fly, tumble and lie dazed with circling stars; no blood, nobody seriously hurt. Ordinary office workers and passers-by never fight and carry on calmly.
- No readable text anywhere (no exceptions in this run).
- Generation: Colab (`/colab-video`, H3 R2V), all 6 chapters in one notebook, first package = 480p preview. Total ≈ 90 s (6 × 362 frames).

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
| `Mob_crowd_office_sheet.png` | office workers (not used in v2) | seven different men and women in office clothes (white/light-blue shirts with ties, blouse, beige cardigan, gray vest, navy jacket); blank white ID card on a blue neck strap | gray background, standing lineup |
| `Mob_crowd_passerby_sheet.png` | taiyaki cook + passers-by (ch3) | cook: cheerful man in his 60s, white cook's jacket, white apron, white cook's cap; elderly woman in lavender cardigan with cloth bag; high-school girl in navy sailor uniform; salaryman in dark-gray suit with briefcase; young woman in camel coat; man in green jacket with a shiba dog | gray background, standing lineup, the cook's tongs pose |

## Location references
| File | Place | PRESERVE | do NOT carry over |
|---|---|---|---|
| `Loc_factory_sheet.png` | brewery yard (ch1) + production hall (ch2) | yard: concrete with yellow lines, cream buildings, dark pillars, silver pipes, white box trucks with yellow cabs, red/yellow beer crates on pallets, silos, gray roll-up shutter. hall: steel brewing tanks with yellow railings, two bottle conveyors, central walkway, skylight beams, three golden barrels with brass taps in a glowing alcove | 2x2 panel layout, the blank yellow banners, the mountains behind the yard |
| `Loc_azabu_shotengai_sheet.png` | shopping street at sunset (ch3) | pink-orange sky, wet asphalt with puddles, brick sidewalks, colored awnings, taiyaki stall with red canopy and glass case, fruit stand, red paper lanterns, red welcome arch, utility poles, lit street lamps | 2x2 panel layout, the rooftop aerial angle |
| `Loc_hq_plaza_sheet.png` | headquarters plaza at dusk (ch4) | dark-blue glass tower with warm lit windows, white steel canopy over a glass entrance, gray stone paving, lit planters with trees, bollard lights, red-and-white Tokyo Tower in the right distance, orange-to-blue sky | 2x2 panel layout, the front steps |
| `Loc_hq_office_sheet.png` | lobby + 12F office (ch5) | lobby: white/beige checkerboard marble, round white columns, white reception counter with wood top, dark wood wall, gray sofas, plants, silver elevators, glass turnstile partition. office: navy checkered carpet, white island desks with monitors, black mesh chairs, glass meeting room, wooden bookshelves, white ceiling panels | 2x2 panel layout, window views of the city in the office panels |
| `Loc_madogiwa_sheet.png` | window-side hangout corner + standing bar (ch6) | floor-to-ceiling glass windows, Tokyo cityscape with Tokyo Tower, wooden plank floor, wooden stall with shingled roof, chrome beer server, glass mugs, three navy noren panels, two red paper lanterns, wooden barrels, cardboard-box chair, green dome tent, black kettle grill, red-brown sofa with speakers, floor lamp, cardboard boxes | 2x2 panel layout, the blank cardboard signboard |

## Scene ledger
| | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| Place | brewery yard (outdoor) | brewery production hall | Azabu-Juban street | HQ plaza | HQ ground-floor lobby | 12F window-side corner |
| Time / light | summer midday, clear sky | midday through skylights, light haze | sunset, pink-orange sky, wet street | just after sunset, orange→deep blue | morning, bright | early morning, low golden sun through windows |

## Prop state ledger
| Prop | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| Sobaya's beer mug (right hand) | full | full | full | full | full | full, raised in the victory pose at the end |

## Camera plan
Every chapter: ONE continuous take, the game's elevated third-person chase camera ~8 m behind and ~4.5 m above Sobaya, looking down ~25°, smoothly following and turning with him. No cuts, no close-ups, no other angles. Joins between chapters: CUT (new stage area).

## Dialogue audio
| Ch | Speaker | Line | File | Duration | Engine (user-selected) |
|---|---|---|---|---|---|
| 1 | Sobaya | ビールが…足りない…！ | `ch1_line1_sobaya.wav` | 2.30 s | VoxCPM2 (seed 42) + `sobaya_monsterize.sh` — voice-timbre reference |
| 6 | Sobaya | 快適です！ (musou battle cry) | `ch6_line1_sobaya.wav` | 2.0 s (padded from 1.03 s) | Irodori-TTS v4-Large (seed 42, 1.2x) + `sobaya_monsterize.sh` — voice-timbre reference |


## Chapter 1 — Stage 1 — brewery yard, horde fight

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
- Frames: 362 (15.083s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the brewery security-guard uniform in <Picture 2>: a light sky-blue short-sleeve uniform shirt with two chest pockets and dark-navy epaulettes, dark-navy trousers, a black belt, light-gray work gloves, black shoes and a dark-navy peaked cap with a plain silver shield emblem; a crowd of about fifteen to twenty guards wears it, Japanese men of different ages and builds.
<Subject 3> is the front yard of the golden beer brewery in <Picture 3> on a sunny summer midday: gray concrete ground with yellow painted safety lines, cream-colored factory buildings with dark steel pillars and long silver pipes, white box trucks with yellow cabs, pallets stacked with red and yellow plastic beer crates, tall silver silos behind, and a large closed gray roll-up shutter at the far end.
<Audio 1> is the voice-timbre reference for <Subject 1> (S1).

summary:
[reference generation + audio reuse] One continuous gameplay take from the chase camera: in the brewery yard of <Subject 3>, <Subject 1> growls his line in the voice of <Audio 1> as he charges into a horde of guards of <Subject 2>, smashing through them with a four-hit combo, a ground-slam shockwave and nonstop attacks while more keep running in.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained; he is seen mostly from behind.
<Subject 2> (appears in [Shot 1]): partially_preserved - the sky-blue shirt, navy trousers, gray gloves and navy cap with silver emblem are retained on many different men.
<Subject 3> (appears in [Shot 1]): fully_preserved - the concrete yard, yellow lines, cream buildings, white-and-yellow trucks, beer crates, silos and gray shutter stay the same.
<Audio 1>: reference - only the voice timbre of <Subject 1> is taken from it; the line is newly performed in that voice.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. The whole chapter is ONE continuous take with no cuts: the camera stays the elevated third-person game camera behind <Subject 1> from the first frame to the last, smoothly following him as he moves and turning gently with him like a player-controlled chase camera; it never cuts, never switches to a close-up, a low angle, a side view or a front view, and never shows his mask from the front for more than a moment. The whole frame is always the game scene: no part of any reference picture appears — no close-up panel of the mask, no gray studio background, no character lineup, no split screen or inset.
[Shot 1] The game camera starts behind <Subject 1> at the near end of <Subject 3> on a sunny summer midday, trucks and beer-crate pallets on both sides, the gray shutter far ahead. At 00:00.300, <Subject 1> starts running forward and (S1) growls in a deep, gravelly, monster-like voice whose timbre follows <Audio 1>, the voice coming from behind his mask, <d>[Japanese] ビールが…足りない…！</d> The mouth slit of his mask never moves. A horde of guards of <Subject 2> charges at him from in front of the shutter and from behind the trucks. From about 00:02.000 he crashes into the front of the horde with a four-hit combo — a straight punch with the beer mug, a wide hook, another punch and a downward slam — and four or five guards are blasted backward together. At about 00:06.000, a guard who has circled behind him punches him in the back: <Subject 1> lurches forward and staggers a step in a comical hit reaction, catches his balance at once, spins around and swats that guard away with a backhand swing of the mug, then swats away others circling in from the left and right. At about 00:07.000, surrounded, he raises the mug overhead and slams it into the concrete; a golden shockwave ring bursts out and seven or eight guards around him fly into the air. From about 00:11.000 he keeps advancing toward the shutter, knocking down each new wave of guards with quick combos. The take ends with him pushing forward among many dazed guards lying on the concrete. The camera follows him the whole time at the same distance and height.
Enemies keep pouring in for the whole chapter like a musou action game: whenever some are knocked down, new ones run in from the far end and from both sides, so there are always about fifteen to twenty enemies on screen. Every hit lands with a bright white impact spark, and area attacks send out a ring-shaped golden shockwave across the ground. Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Even while he spins, swings or gets hit, his mask stays rigid and unchanged; it never opens, melts or turns into a face. When he is hit he only staggers and recovers at once, like a game hit reaction; he is never hurt. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
Summer cicadas and a distant factory hum under a constant battle roar: dozens of running footsteps, guards shouting, rapid whooshing mug swings and punchy comical impacts, bodies thumping onto concrete, and a deep booming ground slam with a rolling shockwave and fizzing beer.

non_diegetic_music:
N/A
```

## Chapter 2 — Stage 1 — production line, boss fight

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
- Frames: 362 (15.083s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the police-officer uniform in <Picture 2>: a dark-navy uniform jacket with gold buttons and a plain gold shield badge, a white shirt with a navy tie, a black duty belt, white gloves, black shoes, a dark-navy peaked cap with a plain round gold emblem, and a black baton in the right hand; a crowd of about twelve to fifteen officers wears it, Japanese men of different ages and builds.
<Subject 3> is the police inspector in <Picture 3>, a huge barrel-chested Japanese man in his fifties, about 190 cm tall, with a thick black mustache and gray-black hair, in a near-black navy uniform with gold buttons and gold cuff bands, a white shirt and dark tie, white gloves, and a dark-navy peaked cap with a large round gold emblem and a gold band.
<Subject 4> is the production hall of the golden beer brewery in <Picture 4>: tall polished stainless-steel brewing tanks with yellow railings on both sides, two long conveyor belts carrying rows of brown glass beer bottles along a central walkway with yellow lines, skylights casting soft beams of sunlight through faint haze, and at the far end a glowing alcove with three golden wooden beer barrels with brass taps.

summary:
[reference generation] One continuous gameplay take from the chase camera: in the brewery production hall of <Subject 4>, <Subject 1> fights through a horde of officers of <Subject 2>, rolls under the boss <Subject 3>'s floor shockwave, then unleashes a glowing golden spinning musou attack that blasts the officers and <Subject 3> away.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained; he is seen mostly from behind.
<Subject 2> (appears in [Shot 1]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and black baton are retained on many different men.
<Subject 3> (appears in [Shot 1]): fully_preserved - his huge build, black mustache, near-black navy uniform with gold trim, white gloves and gold-banded cap are retained; he appears EXACTLY ONCE.
<Subject 4> (appears in [Shot 1]): fully_preserved - the steel tanks, bottle conveyors, skylight beams and golden barrels stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. The whole chapter is ONE continuous take with no cuts: the camera stays the elevated third-person game camera behind <Subject 1> from the first frame to the last, smoothly following him as he moves and turning gently with him like a player-controlled chase camera; it never cuts, never switches to a close-up, a low angle, a side view or a front view, and never shows his mask from the front for more than a moment. The whole frame is always the game scene: no part of any reference picture appears — no close-up panel of the mask, no gray studio background, no character lineup, no split screen or inset.
[Shot 1] The game camera looks down the central walkway of <Subject 4> over the back of <Subject 1>, bottle conveyors running on both sides and skylight beams slanting through faint haze. At the far end stands the boss <Subject 3>; a horde of officers of <Subject 2> rushes down the walkway with batons raised. From the start <Subject 1> meets them with punches, hooks and slams of the beer mug, pushing the horde back as officers fly over the conveyors. At about 00:04.000, <Subject 3> drops to one knee and pounds the floor; an orange shockwave ring races toward <Subject 1>, who dives into a forward roll to the side but is clipped by the edge of the ring: he is knocked back a couple of meters, drops to one knee in a comical hit reaction, and immediately springs back to his feet. At about 00:07.000, his beer mug glows bright gold and golden sparks rise around him; he spins like a top with the mug held out and advances through the horde, officers flying away in every direction, until he reaches <Subject 3> and blasts him off his feet too; a large golden ring of light bursts outward. From about 00:11.000, <Subject 3> lies flat on his back with stars circling over his head, and <Subject 1> walks on toward the glowing golden barrels at the far end. The camera follows him the whole time at the same distance and height, always behind his back; it never swings around in front of him, even while he spins.
Enemies keep pouring in for the whole chapter like a musou action game: whenever some are knocked down, new ones run in from the far end and from both sides, so there are always about fifteen to twenty enemies on screen. Every hit lands with a bright white impact spark, and area attacks send out a ring-shaped golden shockwave across the ground. Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Even while he spins, swings or gets hit, his mask stays rigid and unchanged; it never opens, melts or turns into a face. When he is hit he only staggers and recovers at once, like a game hit reaction; he is never hurt. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
Clinking bottles on moving conveyors and a steady machine hum under a battle roar: shouting officers, baton clatter, whooshing swings and comical impacts, a heavy floor-pounding boom with a crackling shockwave, a quick roll, a rising golden whoosh, a whirlwind of spinning air with rapid impacts and yelps, and a bright booming burst.

non_diegetic_music:
N/A
```

## Chapter 3 — Stage 2 — Azabu-Juban shopping street, horde fight

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
- Frames: 362 (15.083s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the police-officer uniform in <Picture 2>: a dark-navy uniform jacket with gold buttons and a plain gold shield badge, a white shirt with a navy tie, a black duty belt, white gloves, black shoes, a dark-navy peaked cap with a plain round gold emblem, and a black baton in the right hand; about ten to twelve officers wear it, Japanese men of different ages and builds.
<Subject 3> is the motorcycle-police uniform in <Picture 3>: a glossy white helmet with a blue center stripe and a smoked visor, a sky-blue zip-up uniform jacket with dark-navy epaulettes, a white belt, dark-navy riding breeches with a white side stripe, tall black riding boots and white gloves; about five to eight officers wear it.
<Subject 4> is the shopping-street people from <Picture 4>: the taiyaki cook, a cheerful Japanese man in his sixties in a white cook's jacket, white apron and white cook's cap, and the passers-by — an elderly woman in a lavender cardigan with a cloth shopping bag, a high-school girl in a navy sailor uniform, a salaryman in a dark-gray suit with a briefcase, a young woman in a camel coat, and a man in a green jacket walking a shiba dog; each of them appears once on the sidewalks or at the stall, and none of them fights.
<Subject 5> is the Azabu-Juban shopping street in <Picture 5> at sunset: a pink-orange sky, a two-lane asphalt street wet after rain with reflective puddles, brick-tiled sidewalks, small shops with red, green, yellow and purple fabric awnings and glowing windows, a taiyaki stall with a red canopy and a glass case of fish-shaped cakes, a fruit stand, rows of glowing red paper lanterns, a red steel welcome arch over the street, utility poles with power lines, lit curved street lamps and tall glass towers in the distance.

summary:
[reference generation] One continuous gameplay take from the chase camera: at sunset in the shopping street of <Subject 5>, <Subject 1> battles a horde of officers of <Subject 2> and motorcycle officers of <Subject 3> with combos and a spinning sweep, splashing them into puddles, while the cook and passers-by of <Subject 4> calmly carry on.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained; he is seen mostly from behind.
<Subject 2> (appears in [Shot 1]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and baton are retained on many different men.
<Subject 3> (appears in [Shot 1]): partially_preserved - the white striped helmet, sky-blue jacket, navy breeches and tall black boots are retained on several men.
<Subject 4> (appears in [Shot 1]): partially_preserved - the cook's white outfit and the passers-by's clothes are retained.
<Subject 5> (appears in [Shot 1]): fully_preserved - the sunset sky, wet street, awnings, red lanterns, welcome arch, taiyaki stall and street lamps stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. The whole chapter is ONE continuous take with no cuts: the camera stays the elevated third-person game camera behind <Subject 1> from the first frame to the last, smoothly following him as he moves and turning gently with him like a player-controlled chase camera; it never cuts, never switches to a close-up, a low angle, a side view or a front view, and never shows his mask from the front for more than a moment. The whole frame is always the game scene: no part of any reference picture appears — no close-up panel of the mask, no gray studio background, no character lineup, no split screen or inset.
[Shot 1] The game camera follows <Subject 1> running down the middle of the wet street of <Subject 5> at sunset under the glowing red lanterns, the red welcome arch ahead. A horde of officers of <Subject 2> and motorcycle officers of <Subject 3> pours in from beyond the arch and from the side alleys. On the sidewalks, the taiyaki cook of <Subject 4> keeps turning cakes at his red-canopied stall and the passers-by of <Subject 4> keep strolling and chatting, never joining the fight and never looking alarmed; no enemy ever lands on them. From about 00:03.000, <Subject 1> crashes into the horde with a four-hit combo, and the officers he hits fly backward and splash down into the puddles. At about 00:07.000, two officers strike him with their batons at the same moment from both sides: he reels and staggers in a comical hit reaction, then plants his feet. At about 00:08.000, still surrounded, he answers with a spin of one full turn with the beer mug held out and six to eight officers around him are swept off their feet and fly under the lanterns. From about 00:12.000, he keeps advancing toward the arch, knocking down each new wave. The take ends with him pushing on among many dazed officers lying on the wet street. The camera follows him the whole time at the same distance and height.
Enemies keep pouring in for the whole chapter like a musou action game: whenever some are knocked down, new ones run in from the far end and from both sides, so there are always about fifteen to twenty enemies on screen. Every hit lands with a bright white impact spark, and area attacks send out a ring-shaped golden shockwave across the ground. Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Even while he spins, swings or gets hit, his mask stays rigid and unchanged; it never opens, melts or turns into a face. When he is hit he only staggers and recovers at once, like a game hit reaction; he is never hurt. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
Evening street ambience with distant chatter, a bicycle bell and the sizzle of taiyaki batter under a battle roar: police whistles, running boots splashing through puddles, shouting, whooshing swings, comical impacts and big water splashes.

non_diegetic_music:
N/A
```

## Chapter 4 — Stage 2 — headquarters plaza, boss fight

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
- Frames: 362 (15.083s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the riot squad captain in <Picture 2>, a huge, broad Japanese man in his forties with a square jaw and a fierce scowl, in a dark-navy riot uniform with black plate armor on his chest, shoulders, forearms, knees and shins, black gloves and boots, and a dark-navy riot helmet with its clear visor raised, carrying a tall clear transparent riot shield.
<Subject 3> is the police-officer uniform in <Picture 3>: a dark-navy uniform jacket with gold buttons and a plain gold shield badge, a white shirt with a navy tie, a black duty belt, white gloves, black shoes, a dark-navy peaked cap with a plain round gold emblem, and a black baton in the right hand; a crowd of about twelve to fifteen officers wears it, Japanese men of different ages and builds.
<Subject 4> is the paved plaza in front of the corporate headquarters tower in <Picture 4> just after sunset: a sky fading from orange to deep blue, a tall dark-blue glass curtain-wall skyscraper with scattered warm lit windows, a glass entrance under a white steel canopy, large gray stone paving tiles, stone planters with trees lit from below, low bollard lights, and the red-and-white Tokyo Tower glowing in the right distance.

summary:
[reference generation] One continuous gameplay take from the chase camera: at dusk on the headquarters plaza of <Subject 4>, <Subject 1> mows down a horde of officers of <Subject 3>, catches the shield charge of the boss <Subject 2> with his beer mug and shoves him back, then slams the ground and launches <Subject 2> and the officers high into the air.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained; he is seen mostly from behind.
<Subject 2> (appears in [Shot 1]): fully_preserved - his huge build, square jaw, navy riot uniform with black armor, raised-visor helmet and clear riot shield are retained; he appears EXACTLY ONCE.
<Subject 3> (appears in [Shot 1]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and baton are retained on many different men.
<Subject 4> (appears in [Shot 1]): fully_preserved - the dusk sky, dark-blue glass tower, canopy entrance, stone paving, lit planters and Tokyo Tower stay the same.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. The whole chapter is ONE continuous take with no cuts: the camera stays the elevated third-person game camera behind <Subject 1> from the first frame to the last, smoothly following him as he moves and turning gently with him like a player-controlled chase camera; it never cuts, never switches to a close-up, a low angle, a side view or a front view, and never shows his mask from the front for more than a moment. The whole frame is always the game scene: no part of any reference picture appears — no close-up panel of the mask, no gray studio background, no character lineup, no split screen or inset.
[Shot 1] The game camera follows <Subject 1> across the stone plaza of <Subject 4> just after sunset, the glowing glass tower and its entrance ahead and Tokyo Tower small in the right distance. In front of the entrance stands the boss <Subject 2> with his clear riot shield, and a horde of officers of <Subject 3> rushes at <Subject 1>, who mows them down with punches, hooks and slams of the beer mug. At about 00:04.000, <Subject 2> charges shield-first; <Subject 1> catches the shield with his mug but the impact shoves him two or three meters backward, his sneakers skidding on the paving in a comical hit reaction; he digs in, holds, and then shoves <Subject 2> back. At about 00:08.000, <Subject 1> raises the mug and slams it into the paving; a golden shockwave ring explodes outward and <Subject 2>, still clutching his shield, and the officers around him are launched high into the dusk sky and come tumbling down. From about 00:12.000, <Subject 2> lies dazed with stars circling over his head, and <Subject 1> walks on toward the glass entrance. The camera follows him the whole time at the same distance and height.
Enemies keep pouring in for the whole chapter like a musou action game: whenever some are knocked down, new ones run in from the far end and from both sides, so there are always about fifteen to twenty enemies on screen. Every hit lands with a bright white impact spark, and area attacks send out a ring-shaped golden shockwave across the ground. Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Even while he spins, swings or gets hit, his mask stays rigid and unchanged; it never opens, melts or turns into a face. When he is hit he only staggers and recovers at once, like a game hit reaction; he is never hurt. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
A calm evening breeze and distant city traffic under a battle roar: shouting officers, running footsteps on stone, whooshing swings and comical impacts, a heavy shield clash and scraping slide, a huge booming ground slam with a rolling shockwave, and the clatter of the falling shield.

non_diegetic_music:
N/A
```

## Chapter 5 — Stage 3 — headquarters lobby, horde fight

Approved plan: `chapter_plan.md` Chapter 5. Line: (no dialogue)

### H3 inputs (Chapter 5)
- Mode: R2V
- Cast: Sobaya, Mob:hq_guard
- Locations: hq_office
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_hq_guard_sheet.png` — corporate building-security uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Loc_hq_office_sheet.png` — headquarters lobby + 12F office (location sheet), identity/design reference only, NOT a composition reference
- Audio: none (no speech)
- Total input files: 3
- Frames: 362 (15.083s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the corporate building-security uniform in <Picture 2>: a medium-gray zip-up uniform jacket with plain silver shield patches, a white shirt with a navy tie, a black belt, black shoes, a black baton, and a medium-gray peaked cap with a plain silver shield emblem; a crowd of about fifteen to twenty guards wears it, Japanese men of different ages and builds.
<Subject 3> is the ground-floor entrance lobby of the headquarters in <Picture 3>: a polished white-and-beige checkerboard marble floor that reflects everyone, thick round white columns, a white reception counter with a wooden top before a dark wood wall, gray sofas and potted plants, silver elevators in the side walls, and a glass partition with security turnstiles at the far end.

summary:
[reference generation] One continuous gameplay take from the chase camera: in the marble lobby of <Subject 3> on a bright morning, <Subject 1> fights through a horde of building guards of <Subject 2> pouring out of the turnstiles and elevators, with combos that send them sliding across the polished floor and a ground slam that scatters them between the columns.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained; he is seen mostly from behind.
<Subject 2> (appears in [Shot 1]): partially_preserved - the gray uniform, navy tie, gray cap with silver emblem and black baton are retained on many different men.
<Subject 3> (appears in [Shot 1]): fully_preserved - the checkerboard marble floor, white columns, reception counter, sofas, elevators and turnstiles stay the same; the office floor of the sheet is not used.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. The whole chapter is ONE continuous take with no cuts: the camera stays the elevated third-person game camera behind <Subject 1> from the first frame to the last, smoothly following him as he moves and turning gently with him like a player-controlled chase camera; it never cuts, never switches to a close-up, a low angle, a side view or a front view, and never shows his mask from the front for more than a moment. The whole frame is always the game scene: no part of any reference picture appears — no close-up panel of the mask, no gray studio background, no character lineup, no split screen or inset.
[Shot 1] The game camera follows <Subject 1> running across the lobby of <Subject 3> in bright morning light, the marble floor polished like a mirror and reflecting everyone. A horde of guards of <Subject 2> pours through the glass turnstiles at the far end and out of the silver elevators on both sides. From about 00:03.000, <Subject 1> crashes into them with a four-hit combo, and the guards he hits slide and spin across the polished marble. At about 00:07.000, a guard lands a baton blow on his shoulder and he rocks back in a comical hit reaction, then recovers at once. At about 00:08.000, still surrounded, he slams the beer mug into the floor; a golden shockwave ring skims across the marble and seven or eight guards fly up and scatter between the white columns. From about 00:12.000, he keeps advancing toward the turnstiles, knocking down each new wave. The take ends with him pushing toward the turnstiles among many dazed guards on the marble. The reception counter, sofas and plants are never destroyed. The camera follows him the whole time at the same distance and height.
Enemies keep pouring in for the whole chapter like a musou action game: whenever some are knocked down, new ones run in from the far end and from both sides, so there are always about fifteen to twenty enemies on screen. Every hit lands with a bright white impact spark, and area attacks send out a ring-shaped golden shockwave across the ground. Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Even while he spins, swings or gets hit, his mask stays rigid and unchanged; it never opens, melts or turns into a face. When he is hit he only staggers and recovers at once, like a game hit reaction; he is never hurt. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
The airy echo of a marble lobby with soft turnstile beeps and elevator chimes under a battle roar: squeaking shoes, shouting guards, whooshing swings and comical impacts, bodies sliding on polished stone, and a booming slam that echoes off the columns.

non_diegetic_music:
N/A
```

## Chapter 6 — Stage 3 — window-side corner, final boss fight

Approved plan: `chapter_plan.md` Chapter 6. Line: Sobaya: 快適です！

### H3 inputs (Chapter 6)
- Mode: R2V
- Cast: Sobaya, Mob:security_head, Mob:hq_guard
- Locations: madogiwa
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_gamecg_sheet.png` — Sobaya's game-CG character sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_security_head_sheet.png` — head of corporate security, boss of stage 3 (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 3> = `Mob_hq_guard_sheet.png` — corporate building-security uniform (mob sheet), identity/design reference only, NOT a composition reference
  - <Picture 4> = `Loc_madogiwa_sheet.png` — window-side hangout corner + standing bar (location sheet), identity/design reference only, NOT a composition reference
- Audio (voice-timbre reference):
  - <Audio 1> = `ch6_line1_sobaya.wav` — Sobaya's voice sample (Irodori-TTS 1.2x + monsterize, user-selected, padded to 2.0 s)
- Total input files: 5
- Frames: 362 (15.083s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)
- Prompt (official Ref2VA six-section format, verbatim):

```text
subject_definitions:
<Subject 1> is the masked brawler in <Picture 1>, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers. In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills.
<Subject 2> is the head of corporate security in <Picture 2>, a huge, heavy Japanese man in his late fifties with short salt-and-pepper hair, in a dark-navy suit-style uniform with gold shoulder boards, a gold braided cord across his chest and gold buttons, a white shirt and navy tie, white gloves, and a dark-navy peaked cap with a large round gold emblem.
<Subject 3> is the corporate building-security uniform in <Picture 3>: a medium-gray zip-up uniform jacket with plain silver shield patches, a white shirt with a navy tie, a black belt, black shoes, a black baton, and a medium-gray peaked cap with a plain silver shield emblem; a crowd of about twelve to fifteen guards wears it, Japanese men of different ages and builds.
<Subject 4> is the do-it-yourself window-side hangout corner of the 12th-floor office in <Picture 4>: floor-to-ceiling glass windows with slim metal mullions, a wide Tokyo cityscape with the red-and-white Tokyo Tower beyond, a warm wooden plank floor, a wooden Japanese standing-bar stall with a shingled roof, a chrome beer server and glass mugs on its counter, three dark-navy noren curtain panels and two round red paper lanterns, plus wooden beer barrels, a chair made of stacked cardboard boxes, a green dome tent, a black kettle grill, a red-brown sofa with tall speakers, a floor lamp and stacked cardboard boxes.
<Audio 1> is the voice-timbre reference for <Subject 1> (S1).

summary:
[reference generation + audio reuse] One continuous gameplay take from the chase camera: in the window-side hangout corner of <Subject 4>, <Subject 1> shouts his line in the voice of <Audio 1> as his beer mug glows gold, spins through a horde of guards of <Subject 3>, beats the boss <Subject 2> with a combo and a final slam, and raises his mug in a victory pose in front of the standing-bar stall.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, white sneakers and the clear glass beer mug are retained; he is seen mostly from behind.
<Subject 2> (appears in [Shot 1]): fully_preserved - his huge build, salt-and-pepper hair, navy suit-style uniform with gold shoulder boards and braided cord, white gloves and gold-emblem cap are retained; he appears EXACTLY ONCE.
<Subject 3> (appears in [Shot 1]): partially_preserved - the gray uniform, navy tie, gray cap and baton are retained on many different men.
<Subject 4> (appears in [Shot 1]): fully_preserved - the glass window wall with Tokyo Tower, wooden floor, standing-bar stall with navy noren and red lanterns, barrels, cardboard chair, tent, grill and sofa stay the same.
<Audio 1>: reference - only the voice timbre of <Subject 1> is taken from it; the line is newly performed in that voice.
Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same high-end game-CG style as the reference sheets: physically based materials, global illumination, soft contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There is no HUD and no interface: no health bars, no counters, no icons. The whole chapter is ONE continuous take with no cuts: the camera stays the elevated third-person game camera behind <Subject 1> from the first frame to the last, smoothly following him as he moves and turning gently with him like a player-controlled chase camera; it never cuts, never switches to a close-up, a low angle, a side view or a front view, and never shows his mask from the front for more than a moment. The whole frame is always the game scene: no part of any reference picture appears — no close-up panel of the mask, no gray studio background, no character lineup, no split screen or inset.
[Shot 1] The game camera looks over the back of <Subject 1> toward the glass window wall of <Subject 4> in early morning, low golden sunlight laying long window-frame shadows across the wooden floor and Tokyo Tower beyond the glass. In front of the standing-bar stall stands the boss <Subject 2>, surrounded by a horde of guards of <Subject 3>. At 00:00.300, the beer mug of <Subject 1> glows bright gold, golden sparks rise around him, and <Subject 1> (S1) shouts as a battle cry in a deep, gravelly, monster-like voice whose timbre follows <Audio 1>, the voice coming from behind his mask, <d>[Japanese] 快適です！</d> The mouth slit of his mask never moves. From about 00:02.000 he spins like a top with the mug held out and drives through the horde; guards fly away through the slanted sunbeams and bounce across the floor, and a large golden ring of light bursts outward. At about 00:07.000, <Subject 2> pounds the floor and sends an orange shockwave; the shockwave hits <Subject 1> head-on and knocks him back a few meters in a comical hit reaction, his sneakers sliding on the planks; he steadies himself, walks straight back in, and on the floor, without jumping, hits <Subject 2> with a punch, a hook and a downward slam, and <Subject 2> is blasted backward. From about 00:11.000, <Subject 2> lies dazed with stars circling over his head, and <Subject 1>, still seen from behind, raises his full beer mug high in front of the stall in a victory pose. The stall, barrels, tent and grill are never damaged. The camera follows him the whole time at the same distance and height and does not move closer for the victory pose.
Enemies keep pouring in for the whole chapter like a musou action game: whenever some are knocked down, new ones run in from the far end and from both sides, so there are always about fifteen to twenty enemies on screen. Every hit lands with a bright white impact spark, and area attacks send out a ring-shaped golden shockwave across the ground. Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt. In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray. Even while he spins, swings or gets hit, his mask stays rigid and unchanged; it never opens, melts or turns into a face. When he is hit he only staggers and recovers at once, like a game hit reaction; he is never hurt. There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no subtitles or captions.

overall_soundscape:
A quiet morning office with distant city noise beyond the glass under a battle roar: a rising golden whoosh, his booming battle cry, a whirlwind of spinning air with comical impacts and yelps, a bright booming burst that rattles the glass mugs on the counter, a heavy stomp and crackling shockwave, three punchy hits, and a triumphant clink as he raises the mug.

non_diegetic_music:
N/A
```


## Generation & assembly protocol (REQUIRED — read before generating any chapter)

### Step 1 — Generate ALL chapters in one run, then verify EVERY chapter
Generate every chapter in one batch (one notebook run, 480p preview first). After collecting the mp4s, verify ALL of the following on EACH chapter:
- [ ] No attached sheet is reproduced anywhere in the frame (v1 ch6 showed the mask close-up panel as an inset): no panels, no gray sheet background, no lineup, no labels or text anywhere
- [ ] The chapter is ONE continuous take from the game chase camera behind Sobaya: no cuts, no close-ups, no front/side/low angles; the action happens in the written order and ends in the written end state
- [ ] Sobaya matches `Sobaya_gamecg_sheet.png` item by item (mask holes/slit/markings/dot, spiky hair from behind, gray skin, build, outfit, mug in the right hand); every mob matches its sheet. A near-miss is a FAIL
- [ ] A horde of roughly 15–20 enemies stays on screen (new ones keep running in); Sobaya and each boss appear EXACTLY ONCE in every sampled frame (sample at least 3 mid-chapter frames)
- [ ] Sobaya takes the one written enemy hit per chapter as a comical game hit reaction (stagger/knock-back, recovers at once)
- [ ] Knocked-out enemies are comical (stars, tumbling) with no blood; office workers / passers-by never fight
- [ ] The style is consistent AAA game CG in every shot; place, time of day and light match the Scene ledger
- [ ] In ch1/ch6 the line is spoken in Sobaya's voice (timbre from the attached sample) and his mask's mouth slit never moves
- [ ] NO on-screen text and NO HUD; duration equals the declared frame count (17k+5 grid)
If any check fails on a chapter, fix that chapter's prompt and regenerate ONLY the failed chapters (a `--fix` package limited with `--chapters`).

### Step 2 — Prompts are verbatim
Each workflow JSON carries the chapter's prompt exactly as embedded below (`make_prompts.py` → `chN_prompt.txt` → `gen_all_workflows.sh`). Do NOT summarize or shorten.

### Step 3 — Assembly
Keep H3's embedded audio. Concatenate ch1–ch6 at 16:9, then composite the game HUD (health/musou gauges, KO count, combo) (no 2.39:1 crop), loudness-normalize, no background music unless the user supplies one.
