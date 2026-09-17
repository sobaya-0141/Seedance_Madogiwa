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

## Generation result (2026-09-17, L4 + sage + 8-step turbo)

All eight chapters generated in one session. `bench_log.csv` is bundled.

| Ch | Frames | Wall | s/step |
|---|---:|---:|---:|
| 1 | 124 | 12.0 min | 64.2 |
| 2 | 90 | 7.8 min | 42.4 |
| 3 | 124 | 10.8 min | 64.8 |
| 4 | 90 | 7.8 min | 42.4 |
| 5 | 90 | 7.8 min | 42.2 |
| 6 | 90 | 7.8 min | 42.2 |
| 7 | 90 | 7.8 min | 42.2 |
| 8 | 90 | 7.8 min | 42.3 |

Total 69 min (estimate was 92 min). Every mp4 is 1344x768 / 24fps / h264 + AAC with the exact
frame count its workflow asked for.

`final_draft.mp4` = the eight chapters concatenated with `-c copy` (no re-encode):
**788 frames / 32.87s**.

## QC result

**Guards all held.** Middle frames were sampled at 6 points per chapter (0/20/40/60/80/100%):

- No extra person, no duplicate Fukuchan, nobody walking into frame, in any chapter.
- No 2D / anime / chibi / illustrated character anywhere — the failure mode that hit
  `74_yametaro` ch16 did not recur in the people-free close-ups ch5–ch7.
- ch5: the smoke stays a featureless head-and-shoulders silhouette for the whole chapter — no
  eyes, no mouth, no markings. The "no face forms yet" guard worked.
- ch6/ch7: the Sobaya mask holds canon through every readable stage — two black circular eye
  holes, one horizontal mouth slit, exactly four red markings, one forehead dot, spiky black hair.
  No second face, no solid head, no torso, no beer mug.
- Fukuchan's identity and ritual costume are stable across ch1–ch4.
- No subtitles, captions, logos or watermarks anywhere.

### Open issue 1 — the panel's printed figure is duplicated from ch2 on

When the panel splits down the middle, the left and right pieces each carry a **complete** printed
Sobaya figure (full mask, full torso) instead of two halves of one figure. It propagates through
ch3–ch7 as the pieces are subdivided and burned.

**This is inherited from `clip2_end.png`**, which already has it and was signed off PASS in
`validation/summary.md` — that checklist asked for "exactly four large clean pieces" and never
asked whether the artwork was duplicated. H3 reproduced the approved keyframe faithfully.

Fixing it means regenerating `clip2_end.png` and, because the keyframes are a serial chain, every
keyframe downstream of it, then re-running ch2–ch7.

### Open issue 2 — katakana on Fukuchan's robe in ch8

In ch8 the ritual robe is covered in repeated katakana reading ギュンギュン, which breaks the
"no new Japanese lettering" rule in the final shot of the video.

**Also inherited**: both `clip8_start.png` and `clip8_end.png` carry the lettering, and both were
signed off PASS. ch1/ch3/ch4 show the same robe with plain gold geometric motifs, so the drift
entered when the ch8 keyframes were generated as a fresh CUT composition, not during generation.

Contained fix: regenerate only `clip8_start.png` / `clip8_end.png` (ch8 is a CUT on both sides, so
nothing downstream depends on them) and re-run ch8 alone — about 8 minutes of L4 time.

### Shared joins are not seamless

Measured frame-to-frame PSNR across the four shared joins against the within-clip adjacent-frame
baseline:

| Join | Within-clip adjacent | Across the join |
|---|---:|---:|
| ch1 → ch2 | 42.3 dB | **16.7 dB** |
| ch2 → ch3 | 45.7 dB | **16.8 dB** |
| ch5 → ch6 | 43.4 dB | **18.2 dB** |
| ch6 → ch7 | 49.8 dB | **18.6 dB** |

Cause: H3's **last-frame anchor is much looser than its first-frame anchor**. Each chapter's first
frame matches its keyframe at 25–28 dB, but the last frame only reaches 17–19 dB. On ch1→ch2 and
ch2→ch3 the mismatch includes a **~1.5% scale pop** (correcting for the zoom recovers only
16.7 → 19.2 dB); the rest, and all of ch5→ch6 and ch6→ch7, is a full-frame texture re-render.

So the shared-frame design does not buy an invisible continuation here — the joins read as a small
pop. Mitigation if it bothers on playback: a 3–5 frame crossfade at the four shared joins (needs a
re-encode, so `-c copy` no longer applies). Left as-is in `final_draft.mp4`.

## Smoothing the joins — `final_smooth.mp4` (`build_smooth_cut.py`)

The straight `-c copy` concat stutters at every chapter join. Measured causes, and what the
script does about each:

### 1. The picture freezes before every join

H3 decelerates onto the pinned last keyframe, so dead frames pile up at each chapter's tail.
Measured mean per-frame pixel motion:

| Ch | mid-chapter | last 8 frames | dead tail frames |
|---|---:|---:|---:|
| 1 | 0.41 | 0.35 | 0 |
| 2 | 0.65 | 0.06 | 16 (0.67s) |
| 3 | 2.73 | 0.04 | 16 (0.67s) |
| 4 | 0.70 | 0.34 | 0 |
| 5 | 1.43 | 0.08 | 9 (0.38s) |
| 6 | **9.27** | **0.04** | **27 (1.12s)** |
| 7 | 0.84 | 0.39 | 0 |
| 8 | 0.64 | 0.04 | 16 (0.67s) |

**84 of 788 frames — 3.5s, over 10% of the film — are frozen tail.** ch6 is the worst: the
Sobaya face completes and then sits motionless for 1.12s, right on the money shot.

The script drops the measured dead frames, with two deliberate exceptions: ch6 keeps an 8-frame
hold so the reveal lands, and ch8's tail is the film's ending so it stays.

### 2. The picture pops at the join

Covered above: 16.7–18.6 dB across shared joins vs a 42–50 dB within-clip baseline.
**5-frame dissolves at the four SHARED joins only.** The three CUT joins (ch3→4, ch4→5, ch7→8)
are intentional angle changes in the camera plan and stay hard cuts. Worst single-frame jump
inside each dissolve is now 1.3–3.5 (ch5→ch6 reads 12.3, but ch5's own motion is 8–11 there, so
it is in line with its surroundings rather than a discontinuity).

### 3. The sound jumps between chapters

Each chapter's soundscape is generated independently, and the levels came out **29 dB apart**:

| Ch | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| source RMS (dBFS) | -43.7 | -39.4 | -42.6 | -43.9 | -27.0 | **-15.5** | -38.1 | **-44.6** |

ch6 peaked at -1.0 dBFS while ch8 sat at -44.6. The script gives each chapter a fixed gain onto a
target curve that keeps the intended arc — quiet shrine, fire growing, the face as the peak, then
calming to embers — and only removes the steps. Result: **spread 29.1 dB → 10.9 dB**, no join step
larger than 4.8 dB, true peak -1.8 dBFS.

A `loudnorm` master was tried first and rejected: it works dynamically and flattened the intended
arc (ch8 landed 7 dB under its target). A fixed master gain plus `alimiter` keeps the curve exactly
as `TARGET_RMS` specifies.

### 4. The sound drops out at the join

`-c copy` splices eight separately-encoded AAC streams, and ffmpeg reports non-monotonic DTS at
all seven joins — audible dropouts. The script decodes everything and re-encodes the audio **once**
as a single stream (equal-power crossfades at the shared joins, 20 ms fades at the hard cuts to
kill clicks). ffmpeg now reports no warnings on the output.

### Result

`final_smooth.mp4` — **700 frames / 29.17s** (from 788 / 32.83s; the 3.7s removed is almost
entirely frozen tail). Video is re-encoded once at CRF 16.

`final_draft.mp4` (the raw `-c copy` concat) is kept as the unprocessed reference.

Remaining option not taken: a single continuous ambience bed under the whole film would hide the
soundscape's change of character at each join completely. It is a creative addition rather than a
repair, and `script.md` forbids background music, so it is left to a decision.
