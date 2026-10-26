# Sobaya's Bungee App — No-keyframe H3 R2V run

Production intent: No-keyframe production: every chapter is MiniMax H3 R2V driven by character sheets + audio only.
No keyframes are generated, validated or attached anywhere in this run. Generation target: Google Colab
(`/colab-video`, R2V notebook). 5 chapters, 671 frames total = 27.96 s at 24 fps, 16:9 native 768p (1344x768).

Sobaya uses this run's **ALT DESIGN** sheet (`Sobaya_alt_design_sheet_v3.png`, bundled as `Sobaya_sheet.png`),
chosen by the user for this run. It replaces the canon mask markings (four red stripes + forehead dot) with a
magenta star and a purple teardrop, gives him a large swept-back violet-highlighted mane, and adds a fan of
four playing cards in his free hand. Everything on the canon NG list (hard white mask, big handled beer mug,
white tee, gray skin, hulking build) is preserved. Both characters are 3D-rendered designs, so the whole run is
**cinematic 3D CG animation** rather than the live-action register used by earlier runs.

Subtitles are burned in at assembly with Remotion (see `## Generation & assembly protocol`), and Sobaya's two
subtitle lines end with a playing-card suit: Chapter 1 ends with ♠ and Chapter 4 ends with ♥.

## Character references

Bundled sheets (physical copies in this run directory, referenced by basename only):

| File | Who | Notes |
|---|---|---|
| `Sobaya_sheet.png` | Sobaya | This run's ALT DESIGN v3 sheet. Front full body, three-view turnaround, mask close-ups (front / three-quarter / back of hair), drinking panel, seated card-fan panel |
| `Yametaro_sheet.png` | Yametaro | Canon four-view chibi sheet + six mouth-shape panels (REST/A/I/U/E/O) |

`height_lineup.png` is deliberately NOT bundled: it shows Sobaya in the canon design (red stripes, short black
spiky hair) in a flat illustration register, which would fight this run's ALT DESIGN and 3D CG style. The size
difference is carried in words instead ("Yametaro's head only reaches Sobaya's waist").

**Sobaya — PRESERVE:** hard white full-face mask with TWO large black circular eye holes and ONE horizontal
black mouth slit, a MAGENTA five-pointed star on one cheek below an eye hole and a single PURPLE teardrop below
the other eye hole, NO red stripes and NO forehead dot, a large swept-back black mane with violet-indigo
highlights standing up and back from the top of the mask and equally voluminous seen from behind, neutral-gray
matte skin on neck, arms and hands, hulking 180cm/100kg thick muscular build, plain white short-sleeve T-shirt,
black jeans, white sneakers, a clear handled beer mug of amber beer and a fan of FOUR playing cards.
**do NOT carry over:** pose, camera angle, sheet background, panel layout, text labels.

**Yametaro — PRESERVE:** a small matte 3D chibi figure about 2.5 heads tall with an oversized head, glossy black
bowl-cut hair with ONE sharp V-notch at the centre of the fringe, small round THICK-BLACK-RIMMED glasses with
flat opaque WHITE lens discs and NO visible pupils, one tiny black dash on the forehead under the hair's
V-point, ONE round pink blush patch on each cheek, a tiny nose bump and a simple curved line mouth, small round
ears, a lavender open-collar shirt with a darker violet leaf print, black trousers, pale cream skin.
**do NOT carry over:** pose, panel layout, gray sheet background, mouth-shape panels, text labels.

No mob characters appear in this run; no `Mob_*_sheet.png` is created.

## Scene ledger

| | C1 start | C1 end | C2 start | C2 end | C3 start | C3 end | C4 start | C4 end | C5 start | C5 end |
|---|---|---|---|---|---|---|---|---|---|---|
| Location | Standing bar, window-side corner | same | same, tight on Yametaro | same | same | same | same, on Sobaya's side | same | same, wide | same |
| Time of day | Late afternoon | Late afternoon | Late afternoon | Late afternoon | Late afternoon | Late afternoon | Late afternoon | Late afternoon | Late afternoon | Late afternoon |
| Light | Soft warm low window light from the back-left | same | same, slightly backlit, background defocused | same | same | same | same, rim light on the mane | same | same | same |
| Weather outside | Clear | Clear | Clear | Clear | Clear | Clear | Clear | Clear | Clear | Clear |

No time-of-day or weather change anywhere in the run.

## Camera plan

| Chapter | Shot size / angle | Move | Join to previous |
|---|---|---|---|
| 1 | MEDIUM two-shot, eye level | Locked-off static | — (opening shot) |
| 2 | MEDIUM CLOSE-UP of Yametaro, slightly low angle | Very slow small push-in | CUT (new shot) |
| 3 | MEDIUM of Yametaro, eye level, wider than C2 | Locked-off static | CUT (new shot) |
| 4 | MEDIUM of Sobaya, low angle | Very slow small push-in | CUT (new shot) |
| 5 | WIDE two-shot, eye level | Locked-off static | CUT (new shot) |

Every join is a CUT: this run has no shared frames between chapters, so no chapter continues a movement across
its boundary.

## Prop state ledger

| Prop | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| Beer mug (clear, handled, amber) | In Sobaya's right hand → set down on the counter, four-fifths full | off screen | off screen | Standing on the counter, four-fifths full, not held | Standing on the counter, four-fifths full |
| Playing-card fan (4 cards) | In Sobaya's left hand, held low at his side | off screen | off screen | Raised from chest height to beside the mask, then tilted face-on to camera | Held beside the mask the whole chapter |
| Smartphone (plain black slab, no logo) | Lying screen-up mid-counter → slid in front of Yametaro | Lifted in both hands, screen showing soft abstract colour blocks | Colour blocks warp to sickly yellow-green and violet → screen goes FLAT BLACK | off screen | In Yametaro's right hand, screen still FLAT BLACK |
| Cardboard box under Yametaro | One plain box, uncrushed | same | same | off screen | same, uncrushed even when he bounces |

The phone screen never shows letters, numbers, icons or logos in any chapter.

## Fixture layout

- The standing bar occupies the window-side corner of a high-rise office floor. A plain wooden counter runs
  left-to-right across the lower third of the frame; Sobaya always works on the FAR side (screen right),
  customers stand on the NEAR side (screen left).
- Behind the counter, on Sobaya's side: a stainless beer server tower. Above the counter: a plain navy fabric
  curtain and a plain red paper lantern, both completely BLANK (no writing).
- Behind everything, a floor-to-ceiling office window fills the background.
- Yametaro always stands on ONE plain cardboard box on the near side so his head clears the counter top. The
  box never collapses.
- There are no doors, hinges or other movable fixtures in this run.

## Dialogue audio

All lines generated locally with Irodori-TTS v4-Large. Take selection: the user chose the **1.0x (normal speed)**
take for every line. Sobaya's takes additionally ran through `sobaya_monsterize.sh` (−5 semitones + 70 Hz
tremolo), which is mandatory for his canon voice. No VOICEVOX speaker is used in this run, so no VOICEVOX
credit is required.

| File | Chapter | Speaker | Engine / reference / seed / speed | Japanese line | Measured length |
|---|---|---|---|---|---|
| `ch1_line1_sobaya.wav` | 1 | Sobaya | Irodori-TTS + monsterize / `Sobaya_voice.wav` / 42 / 1.0x | 新しいAndroidアプリをリリースしたから使ってみてよ | 3.55 s |
| `ch2_line1_yametaro.wav` | 2 | Yametaro | Irodori-TTS / `Yametaro_voice.wav` / 7 / 1.0x | お！さすがAndroidテックリードや！ | 3.64 s |
| `ch3_line1_yametaro.wav` | 3 | Yametaro | Irodori-TTS / `Yametaro_voice.wav` / 7 / 1.0x | ってUIキモ！しかもクラッシュした | 3.24 s |
| `ch4_line1_sobaya.wav` | 4 | Sobaya | Irodori-TTS + monsterize / `Sobaya_voice.wav` / 42 / 1.0x | ボクのアプリはクソUXとバグ両方の性質を併せ持つ | 5.22 s |
| `ch5_line1_yametaro.wav` | 5 | Yametaro | Irodori-TTS / `Yametaro_voice.wav` / 7 / 1.0x | バンジーバグやんけ！ええから早く直さんかい | 3.68 s |

Every file is already longer than H3's 2.0 s minimum, so no tail padding was needed. The TTS input text was
written phonetically (アンドロイド / ユーアイ / ユーエックス) so the engine reads the Latin abbreviations
correctly; the Japanese above is the line as written and as it will appear in the burned-in subtitles.

---

## Chapter 1 — "Try it out"

- **Cast on screen:** Sobaya, Yametaro
- **Opening composition:** Locked-off MEDIUM two-shot at eye level. Sobaya stands behind the counter on the
  RIGHT, facing camera, beer mug in his right hand and the card fan in his left. Yametaro stands on the LEFT on
  his cardboard box, on the near side of the counter, hands empty, looking up at Sobaya. One black smartphone
  lies screen-up in the middle of the counter.
- **Action beats:** (1) Sobaya sets the mug down on the counter. (2) He slides the phone across to Yametaro
  with his free right hand. (3) He delivers his line, mask turned slightly toward Yametaro. (4) Yametaro
  reaches both hands toward the phone without lifting it.
- **End state:** The phone sits on the counter in front of Yametaro, his hands just short of it; Sobaya's right
  hand is withdrawn; the mug stands on the counter; the card fan is still in his left hand.
- **Subtitle (burned in at assembly):** 新しいAndroidアプリをリリースしたから使ってみてよ♠

### H3 inputs (Chapter 1)
- Mode: R2V
- Cast: Sobaya, Yametaro
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_sheet.png` — Sobaya's ALT DESIGN character model sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Yametaro_sheet.png` — Yametaro's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch1_line1_sobaya.wav` (3.55s) — spoken by Sobaya, use AS-IS as the dialogue audio
- Total input files: 3
- Duration: 5.9s requested → Frames: 141 (5.875s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: hard white full-face mask with TWO large black circular eye holes and ONE horizontal black mouth slit, a MAGENTA five-pointed star on one cheek below an eye hole and a single PURPLE teardrop below the other eye hole, NO red stripes and NO forehead dot, a large swept-back black mane with violet-indigo highlights standing up and back from the top of the mask, neutral-gray matte skin on neck, arms and hands, hulking 180cm/100kg thick muscular build, plain white short-sleeve T-shirt, black jeans, white sneakers; do NOT carry over: pose, camera angle, sheet background, panel layout, text labels); <Picture 2> = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a small matte 3D chibi figure about 2.5 heads tall with an oversized head, glossy black bowl-cut hair with ONE sharp V-notch at the centre of the fringe, small round thick-black-rimmed glasses with flat opaque WHITE lens discs and NO visible pupils, ONE round pink blush patch on each cheek, a simple curved line mouth, small round ears, a lavender open-collar shirt with a darker violet leaf print, black trousers; do NOT carry over: pose, panel layout, gray sheet background, mouth-shape panels, text labels); <Audio 1> = ch1_line1_sobaya.wav — Sobaya's spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no cream or gray sheet background, no labels or text. Cinematic 3D CG animation with matte shaded surfaces and soft warm late-afternoon window light; Sobaya is a large 3D-rendered man with neutral-gray matte skin and a hard white mask, and Yametaro is a small matte 3D chibi toy figure standing in the same 3D space under the same light. NOT flat 2D anime, NOT cartoon lineart, NOT live-action photography. The shot opens on a locked-off static MEDIUM two-shot at eye level inside a tiny standing bar built into the window-side corner of a high-rise office floor: a plain wooden counter runs across the lower third of frame, a stainless beer server tower and a completely blank navy fabric curtain and a completely blank red paper lantern sit behind it, and a floor-to-ceiling office window fills the background with soft warm low light. Sobaya stands behind the counter on the RIGHT side of frame facing camera, holding a clear handled beer mug four-fifths full of amber beer in his right hand and a fan of FOUR playing cards low in his left hand. Yametaro stands on the LEFT side of frame on the near side of the counter, up on a single plain cardboard box so that his oversized head clears the counter top, turned to his right and looking up at Sobaya with both small hands empty at his sides; his head only reaches Sobaya's waist height. One plain black slab smartphone with no logo lies screen-up in the middle of the counter. Exactly two characters appear in this chapter — Sobaya and Yametaro — and each appears EXACTLY ONCE; nobody else enters the frame at any time. Beat 1 (0–1.2s): Sobaya lowers the beer mug and sets it down quietly on the counter beside him; the beer stays four-fifths full and nothing spills; the card fan stays in his left hand. Beat 2 (1.2–2.0s): with his now free right hand he pushes the smartphone with his fingertips and slides it across the counter top toward Yametaro, where it comes to rest directly in front of the little figure. Beat 3 (2.0–5.5s): Sobaya (S1) turns his mask slightly toward Yametaro on his left and says <d>[Japanese] 新しいAndroidアプリをリリースしたから使ってみてよ</d>, lip-syncing to <Audio 1>; because his face is a rigid mask the black mouth slit NEVER changes shape and NO human lips ever appear — the sync is carried only by small nods of his head and tilts of his chin while <Audio 1> is playing, and his head stills the moment the audio ends. Yametaro does NOT speak; his small curved line mouth stays CLOSED for the whole chapter while he looks down at the phone. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. Beat 4 (5.5–5.9s): Yametaro reaches both small hands forward toward the phone without lifting it yet. The shot ends with the smartphone resting on the counter in front of Yametaro, his two hands just short of it, Sobaya's right hand withdrawn and the beer mug standing on the counter. The camera stays locked-off and static for the whole chapter — no push, no pan, no tilt, no handheld sway. Sobaya moves as ONE continuous person and is never duplicated; in every frame his face stays a hard white mask with two black eye holes and one horizontal mouth slit — NO human eyes, NO eyelids, NO realistic nose or lips — his exposed skin stays neutral gray, the magenta star stays on one cheek and the single purple teardrop below the other eye, and his swept-back violet-highlighted mane keeps its full volume. Yametaro moves as ONE continuous chibi figure and is never duplicated; his glasses keep thick black round rims with flat opaque white lenses and NO visible pupils. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the hanging curtain, the paper lantern and the phone screen carry NO writing at all, and the phone screen shows only soft abstract blocks of colour. Soundscape: a quiet office hum, a glass mug settling on wood, a phone sliding across a counter top, faint distant keyboard clatter. Music: no background music.

## Chapter 2 — "As expected of an Android tech lead"

- **Cast on screen:** Yametaro
- **Opening composition:** MEDIUM CLOSE-UP of Yametaro from slightly below, at his own eye level. The counter
  top crosses the very bottom edge of frame; the background is a softly defocused office window. Both his hands
  reach toward the phone on the counter. Nobody else is in frame.
- **Action beats:** (1) He lifts the phone in both hands to chest height. (2) A highlight sweeps across his
  glasses and his blush deepens. (3) He looks up to the upper right of frame and delivers his line, delighted.
  (4) He drops his gaze back to the screen, mouth closed.
- **End state:** Yametaro holds the phone in both hands in front of his chest, looking down at its screen,
  mouth closed.
- **Subtitle (burned in at assembly):** お！さすがAndroidテックリードや！

### H3 inputs (Chapter 2)
- Mode: R2V
- Cast: Yametaro
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Yametaro_sheet.png` — Yametaro's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch2_line1_yametaro.wav` (3.64s) — spoken by Yametaro, use AS-IS as the dialogue audio
- Total input files: 2
- Duration: 5.2s requested → Frames: 124 (5.167s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a small matte 3D chibi figure about 2.5 heads tall with an oversized head, glossy black bowl-cut hair with ONE sharp V-notch at the centre of the fringe, small round thick-black-rimmed glasses with flat opaque WHITE lens discs and NO visible pupils, one tiny black dash on the forehead under the hair's V-point, ONE round pink blush patch on each cheek, a tiny nose bump and a simple curved line mouth, small round ears, a lavender open-collar shirt with a darker violet leaf print, black trousers, pale cream skin; do NOT carry over: pose, panel layout, gray sheet background, mouth-shape panels, text labels); <Audio 1> = ch2_line1_yametaro.wav — Yametaro's spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no gray sheet background, no labels or text, and no grid of mouth shapes. Cinematic 3D CG animation with matte shaded surfaces and soft warm late-afternoon window light; Yametaro is a small matte 3D chibi toy figure standing in a real 3D space, lit by that same window light. NOT flat 2D anime, NOT cartoon lineart, NOT live-action photography. The shot opens on a MEDIUM CLOSE-UP of Yametaro seen from slightly below, at the little figure's own eye level, inside a tiny standing bar in the window-side corner of a high-rise office floor: a plain wooden counter top crosses the very bottom edge of frame, and the background is a softly defocused floor-to-ceiling office window filled with warm low light, with a stainless beer server tower blurred at the right edge. Yametaro stands centre frame up on a single plain cardboard box, both small hands reaching toward a plain black slab smartphone with no logo lying on the counter in front of him. Exactly one character appears in this chapter — Yametaro — and he appears EXACTLY ONCE; nobody else enters the frame at any time, and no other person, hand or arm is ever visible. Beat 1 (0–0.8s): he picks the smartphone up with both hands and raises it in front of his chest, screen tilted up toward his face. Beat 2 (0.8–1.3s): a bright highlight sweeps across the flat white discs of his round glasses and the pink blush patches on his cheeks deepen slightly. Beat 3 (1.3–4.9s): Yametaro (S1) lifts his face from the screen, looks up toward the upper RIGHT of frame at someone standing off-screen, and says delightedly <d>[Japanese] お！さすがAndroidテックリードや！</d>, lip-syncing to <Audio 1>; his small line mouth opens and closes ONLY while <Audio 1> is playing and stays CLOSED before and after it. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. Beat 4 (4.9–5.2s): he drops his gaze back down to the phone screen with his mouth closed. The shot ends with Yametaro holding the phone in both hands in front of his chest, looking down at its screen, mouth closed. The camera performs one very slow, very small push-in of a few percent across the whole chapter — no pan, no tilt, no handheld sway. Yametaro moves as ONE continuous chibi figure and is never duplicated; his glasses keep thick black round rims with flat opaque white lens discs and NO visible pupils or human eyes behind them, his bowl-cut hair keeps its single sharp V-notch at the centre of the fringe, and ONE round pink blush patch stays on each cheek. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the phone screen shows only soft abstract blocks of colour with NO letters, numbers, icons or logos, and the video must contain no text at all. Soundscape: a quiet office hum, a small plastic phone being lifted off wood, faint distant keyboard clatter. Music: no background music.

## Chapter 3 — "The UI is gross — and it crashed"

- **Cast on screen:** Yametaro
- **Opening composition:** MEDIUM of Yametaro at eye level, wider than Chapter 2 and placed slightly left of
  centre. He holds the phone in both hands in front of his chest, looking down at it. Nobody else in frame.
- **Action beats:** (1) The colour blocks on the screen warp into sickly yellow-green and violet; his smile
  collapses and he recoils slightly. (2) He pushes the phone away from his body, grimacing, and delivers the
  line. (3) Partway through the line the screen flickers and goes flat black and his shoulders jump. (4) He
  angles the dead black screen toward camera. (5) His shoulders drop and he lowers the phone to chest height.
- **End state:** Yametaro stands with slumped shoulders, holding the dead black-screened phone at chest height
  in both hands.
- **Subtitle (burned in at assembly):** ってUIキモ！しかもクラッシュした

### H3 inputs (Chapter 3)
- Mode: R2V
- Cast: Yametaro
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Yametaro_sheet.png` — Yametaro's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch3_line1_yametaro.wav` (3.24s) — spoken by Yametaro, use AS-IS as the dialogue audio
- Total input files: 2
- Duration: 5.2s requested → Frames: 124 (5.167s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a small matte 3D chibi figure about 2.5 heads tall with an oversized head, glossy black bowl-cut hair with ONE sharp V-notch at the centre of the fringe, small round thick-black-rimmed glasses with flat opaque WHITE lens discs and NO visible pupils, one tiny black dash on the forehead under the hair's V-point, ONE round pink blush patch on each cheek, a tiny nose bump and a simple curved line mouth, small round ears, a lavender open-collar shirt with a darker violet leaf print, black trousers, pale cream skin; do NOT carry over: pose, panel layout, gray sheet background, mouth-shape panels, text labels); <Audio 1> = ch3_line1_yametaro.wav — Yametaro's spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no gray sheet background, no labels or text, and no grid of mouth shapes. Cinematic 3D CG animation with matte shaded surfaces and soft warm late-afternoon window light; Yametaro is a small matte 3D chibi toy figure standing in a real 3D space, lit by that same window light. NOT flat 2D anime, NOT cartoon lineart, NOT live-action photography. The shot opens on a locked-off static MEDIUM shot at eye level, slightly wider than a close-up, inside a tiny standing bar in the window-side corner of a high-rise office floor: a plain wooden counter top crosses the lower edge of frame and a floor-to-ceiling office window fills the softly defocused background with warm low light. Yametaro stands slightly LEFT of centre, up on a single plain cardboard box, holding a plain black slab smartphone with no logo in both hands in front of his chest and looking down at its screen. Exactly one character appears in this chapter — Yametaro — and he appears EXACTLY ONCE; nobody else enters the frame at any time, and no other person, hand or arm is ever visible. Beat 1 (0–0.8s): the soft blocks of colour on the phone screen warp and smear into a sickly yellow-green and violet mess; Yametaro's curved smile flattens, his head pulls back slightly and his whole body leans away from the device. Beat 2 (0.8–2.3s): he pushes the phone a little further from his body at arm's length and, grimacing, Yametaro (S1) says <d>[Japanese] ってUIキモ！しかもクラッシュした</d>, lip-syncing to <Audio 1>; his small line mouth opens and closes ONLY while <Audio 1> is playing and stays CLOSED before and after it. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. Beat 3 (2.3–3.0s): still mid-line, the phone screen flickers once and snaps to FLAT BLACK, and his small shoulders jump with the shock. Beat 4 (3.0–4.1s): he finishes the line and angles the dead black screen toward camera so it is clearly visible. Beat 5 (4.1–5.2s): his shoulders slump, he lowers the phone back to chest height and his mouth closes. The shot ends with Yametaro standing with slumped shoulders, holding the dead flat-black-screened phone at chest height in both hands, mouth closed. The camera stays locked-off and static for the whole chapter — no push, no pan, no tilt, no handheld sway. Yametaro moves as ONE continuous chibi figure and is never duplicated; his glasses keep thick black round rims with flat opaque white lens discs and NO visible pupils or human eyes behind them, his bowl-cut hair keeps its single sharp V-notch at the centre of the fringe, and ONE round pink blush patch stays on each cheek. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the phone screen shows only abstract colour and then pure black, with NO letters, numbers, icons, error dialogs or logos, and the video must contain no text at all. Soundscape: a quiet office hum, a short electronic glitch buzz as the screen dies, a small startled intake of breath, faint distant keyboard clatter. Music: no background music.

## Chapter 4 — "Both properties at once"

- **Cast on screen:** Sobaya
- **Opening composition:** MEDIUM of Sobaya from a low angle, looking up at him. He stands behind the counter
  slightly right of centre, facing camera, the card fan held at chest height in his left hand, right hand empty
  at his side, the beer mug standing on the counter. The window backlights his mane.
- **Action beats:** (1) He slowly raises the card fan until it is beside his mask. (2) He delivers the line,
  body almost still, head carrying the rhythm. (3) He tilts the fan so the card faces turn toward camera.
- **End state:** Sobaya holds the card fan beside his mask with the card faces turned to camera.
- **Subtitle (burned in at assembly):** ボクのアプリはクソUXとバグ両方の性質を併せ持つ♥

### H3 inputs (Chapter 4)
- Mode: R2V
- Cast: Sobaya
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_sheet.png` — Sobaya's ALT DESIGN character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch4_line1_sobaya.wav` (5.22s) — spoken by Sobaya, use AS-IS as the dialogue audio
- Total input files: 2
- Duration: 6.6s requested → Frames: 158 (6.583s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: hard white full-face mask with TWO large black circular eye holes and ONE horizontal black mouth slit, a MAGENTA five-pointed star on one cheek below an eye hole and a single PURPLE teardrop below the other eye hole, NO red stripes and NO forehead dot, a large swept-back black mane with violet-indigo highlights standing up and back from the top of the mask and equally voluminous seen from behind, neutral-gray matte skin on neck, arms and hands, hulking 180cm/100kg thick muscular build, plain white short-sleeve T-shirt, black jeans, white sneakers, a fan of FOUR white playing cards with red and black pips; do NOT carry over: pose, camera angle, sheet background, panel layout, text labels); <Audio 1> = ch4_line1_sobaya.wav — Sobaya's spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no cream sheet background, no labels or text. Cinematic 3D CG animation with matte shaded surfaces and soft warm late-afternoon window light; Sobaya is a large 3D-rendered man with neutral-gray matte skin and a hard white mask, standing in a real 3D space lit by that same window light. NOT flat 2D anime, NOT cartoon lineart, NOT live-action photography. The shot opens on a MEDIUM shot from a LOW ANGLE looking up at Sobaya inside a tiny standing bar in the window-side corner of a high-rise office floor: he stands behind a plain wooden counter slightly RIGHT of centre, facing camera, with a stainless beer server tower and a completely blank navy fabric curtain behind him and a floor-to-ceiling office window filling the background, its warm low light rimming the edge of his mane. He holds a fan of FOUR playing cards at chest height in his left hand; his right hand hangs empty at his side; a clear handled beer mug four-fifths full of amber beer stands on the counter and he does NOT pick it up at any point. Exactly one character appears in this chapter — Sobaya — and he appears EXACTLY ONCE; nobody else enters the frame at any time, and no other person, hand or arm is ever visible. Beat 1 (0–1.0s): he slowly raises the card fan from chest height until it is held up beside his mask, level with the eye holes, the backs of the cards toward camera. Beat 2 (1.0–6.2s): Sobaya (S1) says, calm and declarative, <d>[Japanese] ボクのアプリはクソUXとバグ両方の性質を併せ持つ</d>, lip-syncing to <Audio 1>; because his face is a rigid mask the black mouth slit NEVER changes shape and NO human lips ever appear — the sync is carried only by small dips of his chin and slow nods of his head while <Audio 1> is playing, and his head stills the moment the audio ends. His shoulders and torso stay almost motionless and his stance stays wide and confident. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. Beat 3 (6.2–6.6s): he slowly rotates his wrist so the printed faces of the four cards turn toward camera. The shot ends with the card fan held beside the mask, card faces turned to camera, Sobaya otherwise still. The camera performs one very slow, very small push-in of a few percent across the whole chapter — no pan, no tilt, no handheld sway. Sobaya moves as ONE continuous person and is never duplicated; in every frame his face stays a hard white mask with two large black circular eye holes and one horizontal black mouth slit — NO human eyes, NO eyelids, NO eyebrows, NO realistic nose or lips — his exposed skin stays neutral gray, the magenta star stays on one cheek and the single purple teardrop below the other eye, and his swept-back violet-highlighted mane keeps its full volume from every angle. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the hanging curtain is BLANK and the playing cards show only plain suit pips and NO letters or numerals; the video must contain no text at all. Soundscape: a quiet office hum, the soft riffle of stiff playing cards, faint distant keyboard clatter. Music: no background music.

## Chapter 5 — "That's a bungee bug!"

- **Cast on screen:** Sobaya, Yametaro
- **Opening composition:** Locked-off WIDE two-shot at eye level, same geography as Chapter 1 — Sobaya behind
  the counter on the RIGHT with the card fan still raised beside his mask, Yametaro on the LEFT up on his
  cardboard box holding the dead black-screened phone in his right hand and looking up at Sobaya. The mug
  stands on the counter.
- **Action beats:** (1) Yametaro jabs his left index finger up at Sobaya. (2) He delivers the line, bouncing
  twice on the box; Sobaya does not move and does not speak. (3) Sobaya slowly tilts his head. (4) Yametaro
  lowers his arm and gives a resigned closed-mouth smile.
- **End state:** Yametaro stands with his arm down, smiling with his mouth closed; Sobaya holds the card fan
  beside his tilted mask. **This is the final cut of the run** (Story Formula: end on a smile).
- **Subtitle (burned in at assembly):** バンジーバグやんけ！ええから早く直さんかい

### H3 inputs (Chapter 5)
- Mode: R2V
- Cast: Sobaya, Yametaro
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_sheet.png` — Sobaya's ALT DESIGN character model sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Yametaro_sheet.png` — Yametaro's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch5_line1_yametaro.wav` (3.68s) — spoken by Yametaro, use AS-IS as the dialogue audio
- Total input files: 3
- Duration: 5.2s requested → Frames: 124 (5.167s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: hard white full-face mask with TWO large black circular eye holes and ONE horizontal black mouth slit, a MAGENTA five-pointed star on one cheek below an eye hole and a single PURPLE teardrop below the other eye hole, NO red stripes and NO forehead dot, a large swept-back black mane with violet-indigo highlights standing up and back from the top of the mask, neutral-gray matte skin on neck, arms and hands, hulking 180cm/100kg thick muscular build, plain white short-sleeve T-shirt, black jeans, white sneakers, a fan of FOUR playing cards; do NOT carry over: pose, camera angle, sheet background, panel layout, text labels); <Picture 2> = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a small matte 3D chibi figure about 2.5 heads tall with an oversized head, glossy black bowl-cut hair with ONE sharp V-notch at the centre of the fringe, small round thick-black-rimmed glasses with flat opaque WHITE lens discs and NO visible pupils, ONE round pink blush patch on each cheek, a simple curved line mouth, small round ears, a lavender open-collar shirt with a darker violet leaf print, black trousers; do NOT carry over: pose, panel layout, gray sheet background, mouth-shape panels, text labels); <Audio 1> = ch5_line1_yametaro.wav — Yametaro's spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no cream or gray sheet background, no labels or text. Cinematic 3D CG animation with matte shaded surfaces and soft warm late-afternoon window light; Sobaya is a large 3D-rendered man with neutral-gray matte skin and a hard white mask, and Yametaro is a small matte 3D chibi toy figure standing in the same 3D space under the same light. NOT flat 2D anime, NOT cartoon lineart, NOT live-action photography. The shot opens on a locked-off static WIDE two-shot at eye level inside a tiny standing bar built into the window-side corner of a high-rise office floor: a plain wooden counter runs across the lower third of frame, a stainless beer server tower and a completely blank navy fabric curtain and a completely blank red paper lantern sit behind it, and a floor-to-ceiling office window fills the background with soft warm low light. Sobaya stands behind the counter on the RIGHT side of frame facing camera with the fan of FOUR playing cards already held up beside his mask in his left hand and his right hand empty at his side; a clear handled beer mug four-fifths full of amber beer stands on the counter. Yametaro stands on the LEFT side of frame on the near side of the counter, up on a single plain cardboard box, his head only reaching Sobaya's waist height, holding a plain black slab smartphone with a FLAT BLACK dead screen in his right hand and looking up at Sobaya. Exactly two characters appear in this chapter — Sobaya and Yametaro — and each appears EXACTLY ONCE; nobody else enters the frame at any time. Beat 1 (0–0.7s): Yametaro snaps his left index finger up and points it at Sobaya. Beat 2 (0.7–4.4s): Yametaro (S1) says, exasperated, <d>[Japanese] バンジーバグやんけ！ええから早く直さんかい</d>, lip-syncing to <Audio 1>, bouncing twice on the cardboard box as he says it while keeping his finger pointed; the box does not crush or collapse. His small line mouth opens and closes ONLY while <Audio 1> is playing and stays CLOSED before and after it. Sobaya does NOT speak and does NOT move during the line — his rigid mask's black mouth slit never changes shape and NO human lips appear on it. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. Beat 3 (4.4–4.8s): Sobaya slowly tilts his masked head to one side, card fan still raised, while Yametaro freezes mid-point. Beat 4 (4.8–5.2s): Yametaro lowers his arm and his cheeks flush a deeper pink as he gives a resigned, warm smile with his mouth CLOSED. The shot ends with Yametaro standing arm-down and smiling with a closed mouth, and Sobaya holding the card fan beside his tilted mask. The camera stays locked-off and static for the whole chapter — no push, no pan, no tilt, no handheld sway. Sobaya moves as ONE continuous person and is never duplicated; in every frame his face stays a hard white mask with two black eye holes and one horizontal mouth slit — NO human eyes, NO eyelids, NO realistic nose or lips — his exposed skin stays neutral gray, the magenta star stays on one cheek and the single purple teardrop below the other eye, and his swept-back violet-highlighted mane keeps its full volume. Yametaro moves as ONE continuous chibi figure and is never duplicated; his glasses keep thick black round rims with flat opaque white lenses and NO visible pupils. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the hanging curtain, the paper lantern, the playing cards and the dead phone screen carry NO writing at all; the video must contain no text at all. Soundscape: a quiet office hum, a light double thump of a small figure bouncing on cardboard, faint distant keyboard clatter. Music: no background music.

---

## Generation & assembly protocol (REQUIRED — read before generating any chapter)

### Step 1 — Pilot chapter first (batch generation is FORBIDDEN until the pilot passes)
Generate ONLY Chapter 1, then verify ALL of the following:
- [ ] No attached sheet is reproduced as a frame: no panels, no cream/gray sheet background, no labels or text anywhere
- [ ] The opening composition matches Chapter 1's "Opening composition" (locked-off medium two-shot, Sobaya right behind the counter, Yametaro left on the cardboard box, phone mid-counter)
- [ ] The action beats happen in the written order and the shot ends in the written end state
- [ ] The dialogue is driven by the attached wav (Sobaya's monsterized voice, no synthesized or doubled voice); Sobaya carries the line and Yametaro's mouth stays closed
- [ ] Sobaya matches `Sobaya_sheet.png` item by item — hard white mask, TWO black circular eye holes, ONE horizontal mouth slit, magenta star on one cheek, ONE purple teardrop on the other, NO red stripes, NO forehead dot, swept-back violet-highlighted mane, neutral-gray skin, white tee, black jeans, white sneakers. A near-miss is a FAIL
- [ ] Yametaro matches `Yametaro_sheet.png` item by item — chibi proportions, bowl cut with a single V-notch, round black-rimmed glasses with flat white lenses and no pupils, one pink blush patch per cheek, lavender leaf-print shirt, black trousers. A near-miss is a FAIL
- [ ] Exactly the listed Cast appears, each EXACTLY ONCE, in EVERY sampled frame (sample at least 3 mid-chapter frames); nobody else enters
- [ ] Style is cinematic 3D CG in every sampled frame — no drift to flat 2D anime, cartoon lineart or live-action photography
- [ ] Camera matches the Camera plan row; location, time of day and light match the Scene ledger; the counter, beer server, curtain, lantern and cardboard box stay per the Fixture layout
- [ ] NO on-screen text anywhere, including the phone screen, the curtain, the lantern and the playing cards; Soundscape/Music as written; duration equals 141 frames
If any check fails, fix the prompt (or split the chapter) and regenerate the pilot until all pass.
Only then generate Chapters 2-5, and re-run at least the sheet-leak + composition + cast + audio + duration checks on each.

### Step 2 — Prompts are verbatim
Copy each chapter's Motion prompt into the workflow JSON EXACTLY as written here (extract_prompts.py). Do NOT
summarize or shorten. If it seems too long, go back to the chapter plan and split the chapter.

### Step 3 — Final audio track (assembly)
DEFAULT: keep H3's embedded audio for every chapter (verified faithful to the attached wavs, 2026-08).
ONLY IF the pilot hears degradation, doubling or a changed voice: strip the embedded audio on that chapter
and lay the original wav over the video, aligned to the frame where the speaker's mouth starts moving.
Play back the assembled video before delivery and confirm every line sounds like the local take.

### Step 4 — Subtitles with Remotion (REQUIRED for this run)
The user asked for burned-in dialogue subtitles, so this run does NOT concatenate with plain ffmpeg. Build the
final cut in `remotion/` (see `remotion/README.md`): each chapter mp4 becomes one `Sequence`, and each chapter
carries its own subtitle card with the speaker's name and the Japanese line. **Sobaya's two lines end with a
playing-card suit — Chapter 1 with ♠ and Chapter 4 with ♥** (a nod to the card fan on his ALT DESIGN sheet);
Yametaro's lines carry no suit. Subtitle text per chapter:

| Chapter | Speaker label | Subtitle |
|---|---|---|
| 1 | そば屋 | 新しいAndroidアプリをリリースしたから使ってみてよ♠ |
| 2 | やめ太郎 | お！さすがAndroidテックリードや！ |
| 3 | やめ太郎 | ってUIキモ！しかもクラッシュした |
| 4 | そば屋 | ボクのアプリはクソUXとバグ両方の性質を併せ持つ♥ |
| 5 | やめ太郎 | バンジーバグやんけ！ええから早く直さんかい |

Each subtitle fades in as the chapter's dialogue starts and fades out as it ends (per-chapter frame ranges are
in `remotion/src/chapters.ts`). Nothing is burned into the H3 output itself — the chapters must stay text-free.
