# RUNBOOK — generating this run's 14 chapters on a CUDA machine (or Colab)

This run was produced with `/no-image-video`: **there are no keyframes anywhere**. Every chapter
is a MiniMax H3 **R2V** generation driven only by character sheets plus dialogue wavs. The script,
the voices and the prompts were all made locally on a Mac; only the video generation needs CUDA.

## What is in this bundle

| Files | What they are |
|---|---|
| `script.md` | The canonical script: 14 chapters, ~70.2s, scene/camera/prop/fixture ledgers, dialogue-audio table, per-chapter H3 inputs, generation protocol |
| `chapter_plan.md` | The Japanese chapter plan the user approved (every chapter `Status: APPROVED`, every mob sheet `Sheet: APPROVED`) |
| `ch*_workflow.json` | 14 ready-to-run ComfyUI **API-format** workflows, one per chapter, all R2V |
| `ch*_prompt.txt` | Each chapter's Motion prompt, extracted verbatim from `script.md` |
| `ch*_line*.wav` | 12 Irodori-TTS voice takes, every one 2.0–15.0s as H3 requires |
| `Yametaro_sheet.png`, `Sobaya_sheet.png` | Canon identity references |
| `Mob_student_sheet.png`, `Mob_clerk_sheet.png` | Run-only mob sheets, supplied and approved by the user |
| `build_h3_workflow.py`, `extract_prompts.py`, `h3_run.py`, `assemble.sh` | Tooling to rebuild workflows and assemble the final cut |

There are **no `ch*_start.png` / `ch*_end.png` files and there must never be any**: attaching a
keyframe would make this a different skill. The only images H3 ever sees are the four sheets.

## Chapter / frame map (all counts sit on H3's 17k+5 grid at 24fps)

| Ch | Mode | Frames | Seconds | Sheets attached | Audio |
|---|---|---|---|---|---|
| 1 | R2V | 124 | 5.167 | Yametaro, student | `ch1_line1_student.wav` |
| 2 | R2V | 158 | 6.583 | Yametaro, student | `ch2_line1_yametaro.wav`, `ch2_line2_yametaro.wav` |
| 3 | R2V | 158 | 6.583 | Yametaro, student | `ch3_line1_yametaro.wav` |
| 4 | R2V | 243 | 10.125 | Yametaro, student | `ch4_line1_yametaro.wav` |
| 5 | R2V | 90 | 3.750 | student, clerk | none (silent) |
| 6 | R2V | 90 | 3.750 | student, clerk | `ch6_line1_student.wav` |
| 7 | R2V | 90 | 3.750 | clerk, student | `ch7_line1_clerk.wav` |
| 8 | R2V | 90 | 3.750 | student, clerk | `ch8_line1_student.wav` |
| 9 | R2V | 107 | 4.458 | clerk, student | `ch9_line1_clerk.wav` |
| 10 | R2V | 107 | 4.458 | clerk, student | none (silent) |
| 11 | R2V | 107 | 4.458 | clerk, student, Sobaya | none (silent) |
| 12 | R2V | 107 | 4.458 | Sobaya, student, clerk | `ch12_line1_sobaya.wav` |
| 13 | R2V | 90 | 3.750 | student, clerk | `ch13_line1_student.wav` |
| 14 | R2V | 124 | 5.167 | Sobaya, student, clerk | `ch14_line1_sobaya.wav` |

Total 1685 frames = about 70.2s. Silent chapters are still R2V, because R2V is the only H3 mode
that accepts reference sheets and the sheets are this run's only control over what people look like.

The `<Picture N>` order in each workflow is meaningful: it is what the prompt's `<Picture 1>`,
`<Picture 2>` and `<Picture 3>` tags refer to. Never reorder `--image` arguments.

## Running it

**Colab (default for this run, since the authoring Mac has no CUDA GPU):** upload
`33_yumemi_village_application_h3_bundle.zip` to `MyDrive/h3_inputs/` and open
`h3_colab_r2v.ipynb` from the `h3/` folder. Cell 1 is already pointed at this run. Outputs land in
`MyDrive/h3_outputs/33_yumemi_village_application/`. L4 or A100 for production; free T4 only for
plumbing checks. At the measured L4 rate (0.645 s per frame per step, about 5.2 s per frame at 8
distilled steps), 1685 frames is roughly 2.5 hours of GPU time for the whole run.

**Local CUDA box:** ComfyUI v0.30.0 or newer (the `MiniMaxH3*` nodes ship in
`comfy_extras/nodes_minimax_h3.py`), then drive the workflows with `h3_run.py` as in
`/local-video` step 7.

## Pilot first — batch generation is FORBIDDEN until it passes

Generate **Chapter 2 only**, then work through the pilot checklist in `script.md`
("Generation & assembly protocol", Step 1). The two failure modes this run is most exposed to are:

1. **Sheet leakage.** With no keyframe to anchor the first frame, R2V likes to open on the
   attached sheet. Every prompt already carries the "None of the attached pictures is a frame of
   this video" clause; the pilot is where you confirm it worked. Panels, a beige sheet background
   or any label in frame is a FAIL.
2. **Invented extras.** Empty booths and an empty cafe are stated in every prompt precisely
   because crowds are what the model wants to add. Sample at least three mid-chapter frames and
   count heads against the chapter's Cast.

Two chapters carry their own extra gate:

- **Chapter 11** — Sobaya must be an unlit, featureless black silhouette in *every* sampled frame
  (sample at least five, spread across the chapter). Any glimpse of the white mask, the red
  markings, the gray skin or the beer mug is a FAIL; that reveal belongs to Chapter 12.
- **Chapters 12 and 14** — Sobaya's mask must not deform while he speaks. The mouth slit stays a
  rigid horizontal black slit; any frame with human lips, teeth or a tongue is a FAIL.

## Assembly

Bring the 14 `chN.mp4` files back next to this file and run `./assemble.sh`. It first checks every
chapter's packet count against the frame count declared in `script.md` and refuses to concatenate
on a mismatch. By default it keeps H3's embedded audio, which is generated from these same wavs;
only if a chapter sounds degraded or doubled do you add it to `OVERRIDE_CHAPTERS` and set its
speech onset. No VOICEVOX speaker is used in this run, so no on-screen credit is burned in.
