# H3 / Colab conversion — 89_sobaya_panel_otarageshi

This seedance run was converted for MiniMax H3 generation on Google Colab (colab-video skill).
`script.md` stays the canonical script; this file records only the H3-specific deltas.

## Clip → chapter mapping (17k+5 frame grid at 24fps)

| Ch | Mode | Frames | Seconds | Script s | First frame | Last frame | Join from prev |
|---|---|---:|---:|---:|---|---|---|
| 1 | I2V | 124 | 5.167 | 5 | clip1_start.png | clip1_end.png | — |
| 2 | I2V | 90 | 3.750 | 4 | clip2_start.png | clip2_end.png | SHARED |
| 3 | I2V | 124 | 5.167 | 5 | clip3_start.png | clip3_end.png | SHARED |
| 4 | I2V | 90 | 3.750 | 4 | clip4_start.png | clip4_end.png | CUT |
| 5 | I2V | 90 | 3.750 | 5 → **shortened** | clip5_start.png | clip5_end.png | CUT |
| 6 | I2V | 90 | 3.750 | 5 → **shortened** | clip6_start.png | clip6_end.png | SHARED |
| 7 | I2V | 90 | 3.750 | 4 | clip7_start.png | clip7_end.png | SHARED |
| 8 | I2V | 90 | 3.750 | 4 | clip8_start.png | clip8_end.png | CUT |

Total 788 frames = **32.83s** (script total 36s; grid rounding + the two safety shortenings below).

All four shared joins are byte-identical (SHA-1 verified): clip1_end = clip2_start,
clip2_end = clip3_start, clip5_end = clip6_start, clip6_end = clip7_start.

## Mode decision — every chapter is I2V

This run has **no dialogue and no wav files at all** (`script.md` § Dialogue audio), so there is
nothing to drive R2V lip-sync with. All eight chapters are I2V (fl2va), which also keeps the exact
first/last-frame anchoring that the four shared joins depend on. **Only `h3_colab_i2v.ipynb` is
produced** — there is no R2V half to run in parallel.

### Anchor-visibility check (local-video SKILL.md "I2Vの弱点と必須ガード")

I2V cannot take reference images, so anything not visible in both keyframes is invented from text.

| Ch | Canon element at risk | In both anchors? | Action taken |
|---|---|---|---|
| 1–4, 8 | Fukuchan's face, hair, ritual costume, lanyard, badge | **Yes** — he is large and clearly lit in both frames | Guards only |
| 5 | Sobaya mask (must NOT exist yet) | Absent from both (smoke is a featureless silhouette) | **Shortened 124f → 90f** + guards |
| 6 | Sobaya mask design | **End anchor only** (start is a featureless silhouette) | **Shortened 124f → 90f** + guards |
| 7 | Sobaya mask design | **Start anchor only** (end is dispersed smoke) | Already 90f + guards |

Chapters 5–7 are close-ups with **zero people on screen**, which is the exact shape of the
2026-08 `74_yametaro` ch16 accident (a flat 2D chibi character appeared mid-clip in a people-free
close-up). Chapters 5 and 6 were therefore cut from 124f to 90f rather than padded to their script
length. R2V-with-sheet was rejected for 6 and 7 because its anchoring is looser than I2V's and both
chapters sit on SHARED joins, where a drifting boundary frame would be visible as a jump cut.

## Conversion deltas from script.md

- **Prompts**: `ch{1..8}_prompt.txt`, converted from the clips' Motion prompts.
  The `Required attached reference files: @ImageN …` declaration blocks were dropped (I2V takes no
  reference images) and the identity phrases were kept inline. "Start from Frame A and end on
  Frame B." became "The video starts EXACTLY on the attached first frame and ends EXACTLY on the
  attached last frame." Clauses that only made sense with an attached sheet ("do not carry over the
  reference sheet pose, labels, background") were removed; the no-on-screen-text rule they doubled
  as is stated separately in every prompt.
- **I2V guards added to every chapter** (mandatory per local-video SKILL.md):
  - "No new person or character enters the frame at any time; nobody appears, materializes, or walks in."
  - "Photorealistic live-action only in every frame; no 2D, anime, cartoon, chibi, or illustrated character ever appears."
  - Persistence of the hidden/forming element: ch1–4/8 pin Fukuchan's identity in EVERY frame and
    keep the printed panel figure inanimate; ch5 forbids any face forming in the smoke; ch6/ch7
    restate the full mask spec (2 eye holes, 1 mouth slit, exactly 4 red markings, 1 forehead dot,
    spiky black hair) so mid-frames cannot drift off-canon between the anchors.
- **Audio**: none. No `--audio` on any workflow, no `*_h3pad.wav`, no VOICEVOX/Irodori credit card.
  H3's generated soundscape is the final audio, matching `script.md` § Step 3.
- **Not H3 inputs**: `panel_ref_*.png`, `ritual_ref_*.png`, `Fukuchan_sheet.png`,
  `Sobaya_sheet.png`, `height_lineup.png`. They stay bundled for reference and for keyframe
  regeneration, but I2V cannot attach them and feeding poster/sheet artwork risks lettering leaks.
- **Workflows**: `chN_workflow.json`, `build_h3_workflow.py --mode i2v` at 1344x768, seed 42.
  `steps=20` in the JSON is overwritten by the notebook's `TURBO_8STEP=True` (8-step distillation).

## Running on Colab

`h3/` holds the bundle zip and `h3_colab_i2v.ipynb` (produced by `build_h3_run_package.py`).
Put the zip in Drive `h3_inputs/`, open the notebook, set the runtime to **L4**, run cell 1 then
the ★ batch cell. Cell 1 already has `CHAPTERS`, `BUNDLE_ZIP_FROM_DRIVE` and `OUT_DRIVE_DIR` filled in.

Estimate (L4 + SageAttention, 8-step turbo, 0.645 s/frame/step): **~90 minutes** for all eight
chapters in one session. Single mode, so there is no second session to run in parallel.

**Pilot = ch6** (the riskiest chapter: the Sobaya mask forms from featureless smoke and exists in
only one anchor). Run it alone first with `AUTO_SHUTDOWN=False`, then check:

- [ ] The smoke face at the end matches `Sobaya_sheet.png` item by item: exactly TWO large black
      circular eye holes with no human eyes/eyelids/eyelashes/eyebrows, ONE horizontal mouth slit,
      exactly FOUR symmetrical red vertical markings, ONE black forehead dot, short spiky black hair.
- [ ] **Middle frames sampled (≥5 points, not just the boundaries)**: no second face, no solid head,
      no torso/limbs/beer mug, no 2D or chibi character, nobody walking into frame.
- [ ] One continuous smoke mass only; the fire stays inside the single stone ring.
- [ ] CLEAR LATE-AFTERNOON DAYLIGHT throughout; no night jump.
- [ ] No subtitles, captions, logos, watermarks or new lettering.
- [ ] Generated soundscape only — no voice, no narration, no music.
- [ ] Duration is 3.75s (90 frames), not a default.

Then run ch5 and ch7 (the other people-free close-ups) and check the same middle-frame items, then
ch1–ch4 and ch8 with the Fukuchan identity / prop-state / continuity checks from `script.md` Step 1.
**Middle-frame QC is required on all eight chapters, minimum 3 sample points each.**

## Assembly

Concat the eight chapters with their embedded audio as-is:

```
printf "file 'ch1.mp4'\nfile 'ch2.mp4'\nfile 'ch3.mp4'\nfile 'ch4.mp4'\nfile 'ch5.mp4'\nfile 'ch6.mp4'\nfile 'ch7.mp4'\nfile 'ch8.mp4'\n" > concat.txt
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy final_draft.mp4
```

No dialogue track, no background music and no VOICEVOX credit card are added (`script.md` § Credits).
