#!/usr/bin/env python3
"""Write script.md for 49_sobaya_musou_gameplay_target: ledgers + per-chapter H3 inputs + verbatim prompts.
Reads chN_prompt.txt (make_prompts.py) and the CHAPTERS table below, which gen_all_workflows.sh mirrors.
Run from this directory: python3 make_prompts.py && python3 make_script.py"""
from pathlib import Path

HERE = Path(__file__).parent

# chapter: (title, frames, cast, locations, images in <Picture N> order, audio, line)
CHAPTERS = {
    "ch1": ("Stage 1 — brewery yard, horde fight", 362, "Sobaya, Mob:factory_guard", "factory",
            ["Sobaya_gamecg_sheet.png", "Mob_factory_guard_sheet.png", "Loc_factory_sheet.png"], ["ch1_line1_sobaya.wav"],
            "Sobaya: ビールが…足りない…！"),
    "ch2": ("Stage 1 — production line, boss fight", 362, "Sobaya, Mob:police, Mob:inspector", "factory",
            ["Sobaya_gamecg_sheet.png", "Mob_police_sheet.png", "Mob_inspector_sheet.png", "Loc_factory_sheet.png"], [], "(no dialogue)"),
    "ch3": ("Stage 2 — Azabu-Juban shopping street, horde fight", 362, "Sobaya, Mob:police, Mob:motor_police, Mob:crowd_passerby", "azabu_shotengai",
            ["Sobaya_gamecg_sheet.png", "Mob_police_sheet.png", "Mob_motor_police_sheet.png", "Mob_crowd_passerby_sheet.png",
             "Loc_azabu_shotengai_sheet.png"], [], "(no dialogue)"),
    "ch4": ("Stage 2 — headquarters plaza, boss fight", 362, "Sobaya, Mob:riot_chief, Mob:police", "hq_plaza",
            ["Sobaya_gamecg_sheet.png", "Mob_riot_chief_sheet.png", "Mob_police_sheet.png", "Loc_hq_plaza_sheet.png"], [], "(no dialogue)"),
    "ch5": ("Stage 3 — headquarters lobby, horde fight", 362, "Sobaya, Mob:hq_guard", "hq_office",
            ["Sobaya_gamecg_sheet.png", "Mob_hq_guard_sheet.png", "Loc_hq_office_sheet.png"], [], "(no dialogue)"),
    "ch6": ("Stage 3 — window-side corner, final boss fight", 362, "Sobaya, Mob:security_head, Mob:hq_guard", "madogiwa",
            ["Sobaya_gamecg_sheet.png", "Mob_security_head_sheet.png", "Mob_hq_guard_sheet.png", "Loc_madogiwa_sheet.png"], ["ch6_line1_sobaya.wav"],
            "Sobaya: 快適です！"),
}

ROLE = {
    "Sobaya_gamecg_sheet.png": "Sobaya's game-CG character sheet",
    "Mob_factory_guard_sheet.png": "brewery security-guard uniform (mob sheet)",
    "Mob_police_sheet.png": "police-officer uniform (mob sheet)",
    "Mob_inspector_sheet.png": "police inspector, boss of stage 1 (mob sheet)",
    "Mob_motor_police_sheet.png": "motorcycle-police uniform (mob sheet)",
    "Mob_riot_chief_sheet.png": "riot squad captain, boss of stage 2 (mob sheet)",
    "Mob_hq_guard_sheet.png": "corporate building-security uniform (mob sheet)",
    "Mob_security_head_sheet.png": "head of corporate security, boss of stage 3 (mob sheet)",
    "Mob_crowd_office_sheet.png": "office-worker lineup (crowd sheet, weak reference)",
    "Mob_crowd_passerby_sheet.png": "shopping-street people lineup (crowd sheet)",
    "Loc_factory_sheet.png": "brewery yard + production hall (location sheet)",
    "Loc_azabu_shotengai_sheet.png": "Azabu-Juban shopping street at sunset (location sheet)",
    "Loc_hq_plaza_sheet.png": "headquarters plaza at dusk (location sheet)",
    "Loc_hq_office_sheet.png": "headquarters lobby + 12F office (location sheet)",
    "Loc_madogiwa_sheet.png": "window-side hangout corner + standing bar (location sheet)",
    "ch1_line1_sobaya.wav": "Sobaya's voice sample (VoxCPM2 + monsterize, user-selected)",
    "ch6_line1_sobaya.wav": "Sobaya's voice sample (Irodori-TTS 1.2x + monsterize, user-selected, padded to 2.0 s)",
}

HEAD = """# そば屋無双 — gameplay footage v2 (target video for the game remake) — no-keyframe H3 run

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

"""

TAIL = """
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
"""


def main() -> None:
    out = [HEAD]
    for ch, (title, frames, cast, locs, imgs, auds, line) in CHAPTERS.items():
        n = ch[2:]
        out.append(f"## Chapter {n} — {title}\n")
        out.append(f"Approved plan: `chapter_plan.md` Chapter {n}. Line: {line}\n")
        out.append(f"### H3 inputs (Chapter {n})")
        out.append("- Mode: R2V")
        out.append(f"- Cast: {cast}")
        out.append(f"- Locations: {locs}")
        out.append("- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):")
        for i, f in enumerate(imgs, 1):
            out.append(f"  - <Picture {i}> = `{f}` — {ROLE[f]}, identity/design reference only, NOT a composition reference")
        if auds:
            out.append("- Audio (voice-timbre reference):")
            for i, f in enumerate(auds, 1):
                out.append(f"  - <Audio {i}> = `{f}` — {ROLE[f]}")
        else:
            out.append("- Audio: none (no speech)")
        out.append(f"- Total input files: {len(imgs) + len(auds)}")
        out.append(f"- Frames: {frames} ({frames / 24:.3f}s at 24fps) / Aspect: 16:9 / Seed: 42 (one take)")
        out.append("- Prompt (official Ref2VA six-section format, verbatim):\n")
        out.append("```text\n" + (HERE / f"{ch}_prompt.txt").read_text(encoding="utf-8").strip() + "\n```\n")
    out.append(TAIL)
    (HERE / "script.md").write_text("\n".join(out), encoding="utf-8")
    print("wrote script.md")


if __name__ == "__main__":
    main()
