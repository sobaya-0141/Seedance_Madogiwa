# Death Game Opening — Sobaya on the Monitor Wall (MiniMax H3, no-keyframe R2V run)

## Production intent

A 6-chapter comedy cold-open for the **DroidKaigi & iOSDC After Talks Night** event. Okayaman welcomes the audience from the large remote display he always appears on, Fukuchan corrects him and calls for GyunGyun, Yametaro says just drink beer, Sobaya hears the word "beer" and roars into the lens, and the film cuts to a dark concrete room where a rusted scaffold of mismatched monitors — all facing different directions, all showing the same Sobaya — announces the death game.

- **No-keyframe production: every chapter is MiniMax H3 R2V driven by character sheets + audio only.** No keyframe image is generated, attached or referenced anywhere in this run. The only attached pictures are canonical character model sheets, used as identity references and never as composition references.
- Generation target: **Google Colab** via `/colab-video` (R2V notebook). Assembly is local ffmpeg per `/local-video` step 8.
- Aspect 16:9, native 768p (output rounds to 1344x768), 24 fps.
- Total assembled length: **39.50 s** across 6 chapters (8.708 + 8.708 + 5.875 + 6.583 + 3.750 + 5.875).
- Story formula (WORLD_BIBLE): someone starts something odd (a welcome to the "window-side holy land") → the others are dragged in → a small commotion (Sobaya's beer roar) → everyone ends smiling, with the death game played as a cheerful, comedic announcement. No black-company, bullying, harassment or depressing content anywhere. The "death game" is a party game framing, never a threat.
- Every spoken line is pre-generated locally with Irodori-TTS and attached as the actual dialogue audio, used AS-IS. No VOICEVOX voice is used in this run, so no on-screen VOICEVOX credit is required.
- The chapter plan approved by the user is `chapter_plan.md` (Japanese, human-facing). Every Opening composition and Action beat below is the English rendering of that approved plan.

## Character references

All files below are physical files in this run folder. No symlinks, no paths outside the run, no keyframes.

- `Okayaman_sheet.png` — Okayaman's character model sheet. **PRESERVE:** a real photographed Japanese man who exists ONLY as a live picture inside a large flat-panel display with a black bezel on a black stand; black mash/medium hair with the fringe touching his eyebrows; a moustache and a chin beard joined into one connected beard; a permanently calm, gentle closed-lip smile; a black hooded jacket with a metal zip and a grey fleece hood lining. **do NOT carry over:** the sheet's pose, its three-quarter/profile panel layout, its pixel-grid and bezel detail crops, the plain studio background, and every text label printed on the sheet. He is NEVER a physical body standing in the room — remote screen only.
- `Fukuchan_sheet.png` — Fukuchan's character model sheet. **PRESERVE:** a real photographed 48-year-old Japanese man, 170 cm, slim adult proportions, never chibi-fied; black medium mash/layered hair with the fringe touching his eyebrows; a warm soft smile; an oversized black tailored long coat; a white graphic T-shirt with a black line-art print underneath; BOTH neck accessories at once — a black "SPONSOR" lanyard strap AND a horizontal white name badge hanging from it; the GyunGyun pose is BOTH palms pressed flat to his own cheeks. **do NOT carry over:** the sheet's pose, camera angle, plain studio background, panel layout, and every text label printed on the sheet.
- `Yametaro_sheet.png` — Yametaro's character model sheet. **PRESERVE:** a soft matte 3D chibi toy figure whose head is bigger than his body, about 2 to 2.5 heads tall; black bowl-cut hair with ONE sharp V-shaped notch in the centre of the fringe; small round WHITE-rimmed glasses; ONE pink blush circle on each cheek; tiny dot eyes; small round ears sticking out at the sides of the head; a lavender patterned open-collar shirt; black trousers. **do NOT carry over:** the sheet's pose, the grey sheet backdrop, the panel layout, the circular face-crop vignette, and any other character's lanyard, badge or coat.
- `Sobaya_sheet.png` — Sobaya's character model sheet. **PRESERVE:** a hard white full-face mask with TWO large black circular eye holes that are pure dark inside and ONE horizontal black mouth slit; FOUR red vertical markings, two flanking each eye, plus ONE small black dot centred on the forehead; short spiky black hair above the mask, visible from every angle including from behind; neutral-GRAY skin on the neck, arms and hands; a hulking 180 cm / 100 kg thick build; a plain white short-sleeve T-shirt; dark charcoal jeans; white sneakers. **do NOT carry over:** the sheet's pose, camera angle, cream studio background, panel layout, the mask/marking detail crops, and every text label printed on the sheet.

No mob characters appear in this run. The worried onlookers visible in the user's reference image are deliberately omitted: the monitor room is empty of people.

## Scene ledger (location, time of day and light across ALL chapters)

The whole film happens indoors with no windows anywhere, so no daylight exists and no day/night jump is possible. There is exactly one location change, the hard cut from the event hall into the concrete monitor room between Chapter 4 and Chapter 5.

| Scene state | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| Location | Main stage of the after-party hall | Main stage, same hall | Main stage, same hall | Main stage, same hall | Dark concrete basement room, rusted monitor scaffold | Same basement room, tighter angle |
| Time of day & light | Indoor evening event, windowless; warm stage key light, cool blue-violet wash on the dark backdrop, plus the display's own screen glow | Same warm key light, same blue-violet backdrop wash | Same | Same | No daylight; cold dim ambience, four hanging work lamps above the scaffold, cold blue-white glow from the monitor screens | Same |
| Weather / outside | Not visible — no windows | Same | Same | Same | Not visible — no windows | Same |

## Camera plan (shot list across ALL chapters)

| Chapter | Shot size & angle | Move | Join to next |
|---|---|---|---|
| 1 | CLOSE-UP of the display, eye level, square to its face | Push-in, small amplitude, slow speed | CUT (new shot) |
| 2 | CLOSE-UP, chest up, eye level | Locked-off static camera | CUT (new shot) |
| 3 | CLOSE-UP, chest up, LOW angle at the figure's own eye height | Locked-off static camera | CUT (new shot) |
| 4 | MEDIUM CLOSE-UP becoming an EXTREME CLOSE-UP as the subject advances into the lens | Locked-off static camera (the subject moves, not the camera) | CUT (new shot, new location) |
| 5 | WIDE of the monitor scaffold, slight low angle | Push-in, small amplitude, slow speed | CUT (new shot, same room) |
| 6 | MEDIUM on the central monitor with its neighbours in frame, eye level | Locked-off static camera | End of film |

Every join is a CUT: this run shares no frame between chapters, so no chapter continues a movement started in the previous one. Each chapter begins and ends on a settled pose.

## Prop state ledger

| Prop | C1 | C2 | C3 | C4 | C5 | C6 |
|---|---|---|---|---|---|---|
| Sobaya's beer mug | not in shot | not in shot | not in shot | NONE — both hands are EMPTY, that is why he demands beer | FULL, thick foam head, held at chest height inside the monitor picture | FULL, thick foam head; raised to face height in the last beat, never spilling |
| The large stage display (Okayaman's) | on, showing Okayaman, black bezel on a black stand | not in shot | not in shot | not in shot | not in shot | not in shot |
| The monitor scaffold | not in shot | not in shot | not in shot | not in shot | all screens on, showing the identical Sobaya picture | all screens on, identical picture |

The mug in Chapters 5 and 6 is not a continuation of Chapter 4: it is inside a recorded picture playing on the monitors, in a different room, so no off-screen state jump occurs.

## Fixture layout

No hinged door, drawer, switch or other movable fixture appears anywhere in this run, so there is no hinge/handle state to keep constant. The monitors are bolted to the scaffold and never change their angles within a chapter.

## Dialogue audio (generated locally with Irodori-TTS; attached to H3 and used AS-IS as the final dialogue audio)

| File | Chapter | Character | Voice (engine) | Line (ja) | Duration |
|------|---------|-----------|----------------|-----------|----------|
| `ch1_line1_okayaman.wav` | 1 | Okayaman | Irodori-TTS (Irodori-TTS-v4-Large, ref: Okayaman_voice.wav, seed 42, 1.0x take) | おかやまん！今日はお越しいただきありがとうございます！ | 3.28s |
| `ch1_line2_okayaman.wav` | 1 | Okayaman | Irodori-TTS (Irodori-TTS-v4-Large, ref: Okayaman_voice.wav, seed 42, 1.0x take) | おかやまん！ここは窓際族の聖地！君も窓際を目指そう！ | 4.52s |
| `ch2_line1_fukuchan.wav` | 2 | Fukuchan | Irodori-TTS (Irodori-TTS-v4-Large, ref: Fukuchan_voice.wav, seed 42, seconds 4.50) | 違うわよ！今日はDroidKaigiとiOSDCのアフターイベントよ！ | 4.50s |
| `ch2_line2_fukuchan.wav` | 2 | Fukuchan | Irodori-TTS (Irodori-TTS-v4-Large, ref: Fukuchan_voice.wav, seed 42, seconds 3.01) | みんなでギュンギュンしちゃおう | 3.01s |
| `ch3_line1_yametaro.wav` | 3 | Yametaro | Irodori-TTS (Irodori-TTS-v4-Large, ref: Yametaro_voice.wav, seed 7, seconds 2.37) | ギュンギュンするってなんやねん | 2.37s |
| `ch3_line2_yametaro.wav` | 3 | Yametaro | Irodori-TTS (Irodori-TTS-v4-Large, ref: Yametaro_voice.wav, seed 7, seconds 2.39) | みんなでビール飲んで楽しめばいいんや | 2.39s |
| `ch4_line1_sobaya.wav` | 4 | Sobaya | Irodori-TTS (Irodori-TTS-v4-Large, ref: Sobaya_voice.wav, seed 42, 1.0x take) + monsterize | ビール！？ | 2.0s (padded from 1.07s) |
| `ch4_line2_sobaya.wav` | 4 | Sobaya | Irodori-TTS (Irodori-TTS-v4-Large, ref: Sobaya_voice.wav, seed 42, seconds 4.20) + monsterize | ビールをよこせぇぇぇぇぇぇぇええ！！！ | 3.98s |
| `ch6_line1_sobaya.wav` | 6 | Sobaya | Irodori-TTS (Irodori-TTS-v4-Large, ref: Sobaya_voice.wav, seed 42, 1.0x take) + monsterize | 今日はみなさんにデスゲームをしてもらいます。楽しんで帰ってください | 4.76s |

Readings sent to Irodori-TTS differ from the script wording only where pronunciation required it: `DroidKaigi` and `iOSDC` in Chapter 2 were synthesised as `ドロイドカイギ` and `アイオーエスディーシー`. The on-screen script wording is unchanged. Every wav is silence-trimmed at both ends; `ch4_line1_sobaya.wav` alone carries trailing silence to reach H3's 2.0 s minimum. Sobaya's takes carry the canonical monsterize processing (pitch down 5 semitones, 70 Hz tremolo) per `VOICE_CAST.md`. The user confirmed these takes on 2026-09-30.

---

## Chapter 1 — Okayaman welcomes the room

- **Cast:** Okayaman, inside the large display only. No physical body of his exists in the room.
- **Opening composition:** a close-up, eye level and square to the screen, of a large flat-panel display with a black bezel standing on a black stand on the stage. The screen fills most of the frame and shows Okayaman from the chest up. Around the bezel there is only the dark stage backdrop with its cool blue-violet wash and a sliver of black floor. Nobody else is in frame.
- **Action beats:**
  1. (0–0.4s) Inside the screen, Okayaman gives a small bow towards the lens.
  2. (0.4–3.7s) He lifts his head and delivers line 1, still smiling; his mouth moves only while that audio plays.
  3. (3.7–4.2s) One beat of silence with his mouth closed and the smile unchanged.
  4. (4.2–8.7s) He opens his right hand at chest height in a small welcoming gesture and delivers line 2, then closes his mouth and lowers the hand.
- **End state:** Okayaman is settled inside the screen, facing front, smiling, hand back down. The display has not moved.

### H3 inputs (Chapter 1)
- Mode: R2V
- Cast: Okayaman
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Okayaman_sheet.png` — Okayaman's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch1_line1_okayaman.wav` (3.28s) — Okayaman's first line, use AS-IS as the dialogue audio
  - <Audio 2> = `ch1_line2_okayaman.wav` (4.52s) — Okayaman's second line, use AS-IS as the dialogue audio
- Total input files: 3
- Duration: 8.7s requested → Frames: 209 (8.708s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Okayaman_sheet.png — Okayaman's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a real photographed Japanese man who exists only as a live picture inside a large black-bezel flat-panel display on a black stand, black mash hair with the fringe touching his eyebrows, a moustache and chin beard joined into one connected beard, a permanently calm gentle closed-lip smile, a black hooded jacket with a metal zip and a grey fleece hood lining; do NOT carry over: pose, camera angle, sheet background, panel layout, the pixel-grid and bezel detail crops, text labels); <Audio 1> = ch1_line1_okayaman.wav — his first spoken line, use AS-IS; <Audio 2> = ch1_line2_okayaman.wav — his second spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no white sheet background, no labels or text. Photorealistic live-action cinematography with natural live-action proportions inside a windowless indoor evening event hall, warm stage key light with a cool blue-violet wash on the dark backdrop and the display's own screen glow; Okayaman is a real photographed person seen only as a live picture on the screen. NOT flat 2D anime, NOT cartoon lineart. The shot opens on a CLOSE-UP at eye level, square to a large flat-panel display with a black bezel standing on a black stand on a stage: the glowing screen fills most of the frame and shows Okayaman from the chest up, centred, facing the lens; around the bezel there is only the dark backdrop and a sliver of black floor. Exactly one person appears in this chapter — Okayaman, inside the screen — and he appears EXACTLY ONCE; no physical body of his stands in the room, and nobody else enters the frame at any time. Beat 1 (0–0.4s): inside the screen he gives a small bow towards the lens, shoulders dipping once. Beat 2 (0.4–3.7s): he lifts his head and, smiling, says <d>[Japanese] おかやまん！今日はお越しいただきありがとうございます！</d>, lip-syncing to <Audio 1>; he begins almost immediately and his mouth moves ONLY while <Audio 1> plays, then stays CLOSED. Beat 3 (3.7–4.2s): one still beat, mouth closed, smile unchanged. Beat 4 (4.2–8.7s): he opens his right hand at chest height in a small welcoming gesture and says <d>[Japanese] おかやまん！ここは窓際族の聖地！君も窓際を目指そう！</d>, lip-syncing to <Audio 2>; his mouth moves ONLY while <Audio 2> plays, then stays CLOSED as he lowers the hand. Okayaman (S1) is the only speaker and there is no other voice. Use <Audio 1> and <Audio 2> AS-IS as the dialogue audio and do NOT generate any voice. The camera pushes in with small amplitude at slow speed for the whole chapter — no pan, no tilt, no handheld sway. The shot ends with him settled inside the screen, facing front, smiling, his hand back down and the display unmoved. Throughout, his beard stays one connected moustache-and-chin beard, his expression stays a calm gentle smile and never becomes anger or shock, and he is NEVER shown as a body physically present in the room. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters, no logos on the screen; the video must contain no text at all. Soundscape: a quiet indoor hall room tone, the faint electrical hum of a large display, distant muffled chatter far behind the camera. Music: no background music.

---

## Chapter 2 — Fukuchan corrects him and calls for GyunGyun

- **Cast:** Fukuchan, physically present on the stage.
- **Opening composition:** a locked-off close-up, chest up, eye level, of Fukuchan centred in frame wearing his oversized black long coat over the white graphic T-shirt, the black SPONSOR lanyard and the white name badge on his chest, smiling softly. Behind him is the out-of-focus dark stage backdrop with its blue-violet wash. Both hands are down at his sides. Nobody else is in frame.
- **Action beats:**
  1. (0–0.5s) He raises his eyebrows and waves his right hand once in front of his face in a small "no, no" gesture.
  2. (0.5–5.0s) Still lowering that hand, he delivers line 1; his mouth moves only while that audio plays.
  3. (5.0–5.5s) One beat of silence with both hands down and his mouth closed.
  4. (5.5–8.7s) He presses BOTH palms flat to his own cheeks in the GyunGyun pose and delivers line 2 from inside that pose, then closes his mouth and holds the pose.
- **End state:** Fukuchan holds both palms on his cheeks, beaming at the lens, motionless.

### H3 inputs (Chapter 2)
- Mode: R2V
- Cast: Fukuchan
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Fukuchan_sheet.png` — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch2_line1_fukuchan.wav` (4.50s) — Fukuchan's first line, use AS-IS as the dialogue audio
  - <Audio 2> = `ch2_line2_fukuchan.wav` (3.01s) — Fukuchan's second line, use AS-IS as the dialogue audio
- Total input files: 3
- Duration: 8.7s requested → Frames: 209 (8.708s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a real photographed 48-year-old Japanese man, 170 cm, slim adult proportions and never chibi-fied, black medium mash hair with the fringe touching his eyebrows, a warm soft smile, an oversized black tailored long coat over a white graphic T-shirt with a black line-art print, and BOTH neck accessories at once — a black SPONSOR lanyard strap AND a horizontal white name badge hanging from it; do NOT carry over: pose, camera angle, sheet background, panel layout, text labels); <Audio 1> = ch2_line1_fukuchan.wav — his first spoken line, use AS-IS; <Audio 2> = ch2_line2_fukuchan.wav — his second spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no white sheet background, no labels or text. Photorealistic live-action cinematography with natural live-action proportions inside a windowless indoor evening event hall, warm stage key light with a cool blue-violet wash on the dark backdrop behind him; Fukuchan is a real photographed person. NOT flat 2D anime, NOT cartoon lineart. The shot opens on a locked-off CLOSE-UP framed from the chest up at eye level: Fukuchan stands centred, facing the lens, in his oversized black long coat over the white graphic T-shirt, with the black lanyard and the white name badge hanging on his chest, smiling softly, both hands down at his sides; the dark stage backdrop behind him is thrown out of focus. Exactly one person appears in this chapter — Fukuchan — and he appears EXACTLY ONCE; he is never duplicated and nobody else enters the frame at any time. Beat 1 (0–0.5s): his eyebrows go up and his right hand waves once in front of his face in a small "no, no" gesture. Beat 2 (0.5–5.0s): while that hand comes back down he says <d>[Japanese] 違うわよ！今日はDroidKaigiとiOSDCのアフターイベントよ！</d>, lip-syncing to <Audio 1>; he begins almost immediately and his mouth moves ONLY while <Audio 1> plays, then stays CLOSED. Beat 3 (5.0–5.5s): one still beat, both hands down, mouth closed. Beat 4 (5.5–8.7s): he presses BOTH palms flat against his own cheeks in his signature pose — both hands, both cheeks, fingers spread, elbows tucked in — and from inside that pose says <d>[Japanese] みんなでギュンギュンしちゃおう</d>, lip-syncing to <Audio 2>; his mouth moves ONLY while <Audio 2> plays, then stays CLOSED while he holds the pose. Fukuchan (S1) is the only speaker and there is no other voice. Use <Audio 1> and <Audio 2> AS-IS as the dialogue audio and do NOT generate any voice. The camera is a locked-off static camera for the whole chapter — no push, no pan, no handheld sway. The shot ends with him holding both palms on his cheeks, beaming at the lens, motionless. Throughout, the lanyard and the name badge both stay on his chest and never vanish, his coat stays an oversized black long coat, his proportions stay those of a real adult man, and his hands never form a peace sign or a salute instead of the cheek pose. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters, no writing on the badge; the video must contain no text at all. Soundscape: a quiet indoor hall room tone, the soft rustle of a heavy coat as his arms move, distant muffled chatter far behind the camera. Music: no background music.

---

## Chapter 3 — Yametaro asks what GyunGyun even is

- **Cast:** Yametaro, physically present on the stage.
- **Opening composition:** a locked-off close-up, chest up, shot from a LOW angle at the small figure's own eye height, roughly 60 cm off the floor. Yametaro is centred, facing the lens, with both hands down. Behind him is the out-of-focus dark stage backdrop with its blue-violet wash and a strip of black floor. Nobody else is in frame.
- **Action beats:**
  1. (0–0.4s) He tilts his oversized head to his right.
  2. (0.4–2.8s) Still tilted, he delivers line 1; his mouth moves only while that audio plays.
  3. (2.8–3.3s) He straightens his head; one beat of silence with his mouth closed.
  4. (3.3–5.9s) He raises his right hand to shoulder height, palm out in a casual "it's fine" shrug, and delivers line 2, then closes his mouth and lowers the hand.
- **End state:** Yametaro faces front with both hands down and a small smile, motionless.

### H3 inputs (Chapter 3)
- Mode: R2V
- Cast: Yametaro
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Yametaro_sheet.png` — Yametaro's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch3_line1_yametaro.wav` (2.37s) — Yametaro's first line, use AS-IS as the dialogue audio
  - <Audio 2> = `ch3_line2_yametaro.wav` (2.39s) — Yametaro's second line, use AS-IS as the dialogue audio
- Total input files: 3
- Duration: 5.9s requested → Frames: 141 (5.875s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a soft matte 3D chibi toy figure whose head is bigger than his body at about 2 to 2.5 heads tall, black bowl-cut hair with ONE sharp V-shaped notch in the centre of the fringe, small round WHITE-rimmed glasses, ONE pink blush circle on each cheek, tiny dot eyes, small round ears sticking out at the sides of his head, a lavender patterned open-collar shirt and black trousers; do NOT carry over: pose, the grey sheet backdrop, panel layout, the circular face-crop vignette, text labels); <Audio 1> = ch3_line1_yametaro.wav — his first spoken line, use AS-IS; <Audio 2> = ch3_line2_yametaro.wav — his second spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no grey sheet background, no labels or text. Photorealistic live-action cinematography of a windowless indoor evening event hall with warm stage key light and a cool blue-violet wash on the dark backdrop; Yametaro alone is a soft matte 3D chibi toy figure standing in that same real space, lit by the same real light, with smooth matte vinyl surfaces. NOT flat 2D anime, NOT cartoon lineart. The shot opens on a locked-off CLOSE-UP framed from the chest up, shot from a LOW angle level with the small figure's own eyes, roughly 60 cm above the floor: Yametaro stands centred, facing the lens, both hands down at his sides, the dark stage backdrop and a strip of black floor thrown out of focus behind him. Exactly one character appears in this chapter — Yametaro — and he appears EXACTLY ONCE; he is never duplicated and nobody else enters the frame at any time. Beat 1 (0–0.4s): he tilts his oversized head to his right. Beat 2 (0.4–2.8s): still tilted, he says <d>[Japanese] ギュンギュンするってなんやねん</d>, lip-syncing to <Audio 1>; he begins almost immediately and his mouth moves ONLY while <Audio 1> plays, then stays CLOSED. Beat 3 (2.8–3.3s): he straightens his head; one still beat with his mouth closed. Beat 4 (3.3–5.9s): he raises his right hand to shoulder height, palm turned out in a casual shrug, and says <d>[Japanese] みんなでビール飲んで楽しめばいいんや</d>, lip-syncing to <Audio 2>; his mouth moves ONLY while <Audio 2> plays, then stays CLOSED as the hand comes down. Yametaro (S1) is the only speaker and there is no other voice. Use <Audio 1> and <Audio 2> AS-IS as the dialogue audio and do NOT generate any voice. The camera is a locked-off static camera for the whole chapter — no push, no pan, no handheld sway. The shot ends with him facing front, both hands down, wearing a small smile, motionless. Throughout, his glasses stay small round WHITE-rimmed glasses and never become black-rimmed, rectangular or sunglasses, his head stays clearly bigger than his body, the V-notch stays in the centre of his fringe, and he never becomes a full-size live-action human. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the video must contain no text at all. Soundscape: a quiet indoor hall room tone, the tiny squeak of matte vinyl as he moves, distant muffled chatter far behind the camera. Music: no background music.

---

## Chapter 4 — Sobaya roars into the lens

- **Cast:** Sobaya, physically present on the stage.
- **Opening composition:** a locked-off medium close-up, chest up, eye level. Sobaya stands centred but angled slightly to frame right as if he has been listening. BOTH his hands are EMPTY — he is holding no mug and no can. Behind him is the out-of-focus dark stage backdrop with its blue-violet wash. Nobody else is in frame.
- **Action beats:**
  1. (0–0.3s) He snaps his masked face round to the lens.
  2. (0.3–2.3s) He delivers line 1. He is a masked character, so his mouth slit never changes shape: the delivery reads as a sharp forward jut of his head and a lift of his shoulders.
  3. (2.3–2.7s) He hauls both shoulders up in a held breath.
  4. (2.7–6.6s) He delivers line 2 as a roar, throwing both arms forward and driving his whole upper body into the lens until the white mask fills the frame — about half the frame height by 4.5s, edge to edge by 6.6s.
- **End state:** the white mask nearly fills the frame with the two black eye holes and the mouth slit centred, and the grey fingers of both outstretched hands showing at the left and right edges.

### H3 inputs (Chapter 4)
- Mode: R2V
- Cast: Sobaya
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_sheet.png` — Sobaya's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch4_line1_sobaya.wav` (2.0s, padded from 1.07s) — Sobaya's first line, use AS-IS as the dialogue audio
  - <Audio 2> = `ch4_line2_sobaya.wav` (3.98s) — Sobaya's roared line, use AS-IS as the dialogue audio
- Total input files: 3
- Duration: 6.6s requested → Frames: 158 (6.583s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a hard white full-face mask with TWO large black circular eye holes that are dark inside and ONE horizontal black mouth slit, FOUR red vertical markings — two flanking each eye — plus ONE small black dot centred on the forehead, short spiky black hair above the mask visible from every angle, neutral-GRAY skin on neck, arms and hands, a hulking 180cm/100kg thick build, a plain white short-sleeve T-shirt and dark charcoal jeans; do NOT carry over: pose, camera angle, sheet background, panel layout, the mask detail crops, the beer mug shown on the sheet, text labels); <Audio 1> = ch4_line1_sobaya.wav — his first spoken line, use AS-IS; <Audio 2> = ch4_line2_sobaya.wav — his roared line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no cream sheet background, no labels or text. Photorealistic live-action cinematography with natural live-action proportions inside a windowless indoor evening event hall, warm stage key light with a cool blue-violet wash on the dark backdrop; Sobaya is a live-action man with neutral-gray skin and a hard white mask. NOT flat 2D anime, NOT cartoon lineart. The shot opens on a locked-off MEDIUM CLOSE-UP framed from the chest up at eye level: Sobaya stands centred but angled slightly towards frame right as if listening to someone off-screen, BOTH hands EMPTY and open at his sides — there is NO beer mug, NO can and NO bottle anywhere in this chapter — with the dark stage backdrop thrown out of focus behind him. Exactly one person appears in this chapter — Sobaya — and he appears EXACTLY ONCE; he moves as ONE continuous person, is never duplicated, and nobody else enters the frame at any time. Beat 1 (0–0.3s): he snaps his masked face round to the lens. Beat 2 (0.3–2.3s): he says <d>[Japanese] ビール！？</d>, driven by <Audio 1>; because he is masked his mouth slit does NOT open or change shape — the delivery reads as a sharp forward jut of the head and a lift of the shoulders, timed to <Audio 1> and stopping when it stops. Beat 3 (2.3–2.7s): both shoulders haul upward in a held breath, the mask still square to the lens. Beat 4 (2.7–6.6s): he roars <d>[Japanese] ビールをよこせぇぇぇぇぇぇぇええ！！！</d>, driven by <Audio 2>, throwing both arms forward and driving his upper body into the lens; the mask grows to about half the frame height by 4.5s and fills the frame edge to edge by 6.6s, and the motion stops when <Audio 2> stops. Sobaya (S1) is the only speaker and there is no other voice. Use <Audio 1> and <Audio 2> AS-IS as the dialogue audio and do NOT generate any voice. The camera is a locked-off static camera for the whole chapter — the subject advances into the lens, the camera itself never pushes, pans or sways. The shot ends with the white mask nearly filling the frame, the two eye holes and the single mouth slit centred, and the grey fingers of both outstretched hands at the left and right edges. In EVERY frame the mask stays a hard white mask with exactly two black circular eye holes and one horizontal mouth slit — NO human eyes, NO eyelids, NO eyelashes, NO eyebrows, NO realistic nose or lips, and the slit never opens into a shouting mouth — the four red markings stay two per eye, the black forehead dot stays single and centred, the spiky black hair stays visible above the mask, and his exposed skin stays neutral gray. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the video must contain no text at all. Soundscape: a quiet indoor hall room tone swallowed by a huge guttural roar, a sharp intake of breath before it, the rush of heavy arms swinging past the microphone. Music: no background music.

---

## Chapter 5 — The monitor scaffold (silent wide)

- **Cast:** Sobaya, inside the monitor pictures only. No person is physically present in this room.
- **Opening composition:** a wide, slightly low-angle shot of a dark bare-concrete basement room. A rusted steel scaffold fills the frame in two tiers, thick chains hanging from the ceiling beside it and four caged work lamps slung above. Three large boxy monitors sit on the upper tier — the left and right ones angled inward, the centre one square to camera — and six smaller monitors are bolted at scattered heights on the lower tier, each turned a different way: one down-left, one right, one tipped slightly up, one down. Every screen shows the identical picture of Sobaya from the chest up, mask to camera, a FULL beer mug with a thick foam head held at his chest. The concrete floor in the foreground is empty.
- **Action beats:**
  1. (0–2.0s) Nothing in the room moves except the work lamps, which flicker faintly; on every screen the Sobaya picture holds still, the mask square to camera, the mouth slit unchanged, the mug motionless at chest height.
  2. (2.0–3.75s) The flicker settles, one hanging chain sways a few centimetres, and the camera continues its slow creep forward. No person walks in.
- **End state:** the same arrangement, framed a little tighter by the camera move. Every monitor is still on and the picture on them is unchanged.

### H3 inputs (Chapter 5)
- Mode: R2V
- Cast: Sobaya
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_sheet.png` — Sobaya's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - No audio file is attached; this chapter is silent.
- Total input files: 1
- Duration: 3.75s requested → Frames: 90 (3.750s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a hard white full-face mask with TWO large black circular eye holes that are dark inside and ONE horizontal black mouth slit, FOUR red vertical markings — two flanking each eye — plus ONE small black dot centred on the forehead, short spiky black hair above the mask, neutral-GRAY skin on neck, arms and hands, a hulking 180cm/100kg thick build, a plain white short-sleeve T-shirt, and a clear glass beer mug with a handle FULL of amber beer under a thick foam head; do NOT carry over: pose, camera angle, sheet background, panel layout, the mask detail crops, text labels). These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no cream sheet background, no labels or text. Photorealistic live-action cinematography with natural live-action proportions in a windowless dark concrete basement, no daylight, cold dim ambience from four caged work lamps above a rusted scaffold plus the cold blue-white glow of the screens themselves; Sobaya is a live-action man with neutral-gray skin and a hard white mask, seen only as a recorded picture playing on the monitors. NOT flat 2D anime, NOT cartoon lineart. The shot opens on a WIDE, slightly LOW-angle view of the room: a rusted steel scaffold in two tiers fills the frame, thick chains hang from the ceiling beside it, four caged work lamps are slung above, three large boxy monitors stand on the upper tier with the left and right ones angled inward and the centre one square to camera, and six smaller monitors are bolted at scattered heights on the lower tier, each turned a different way — one down-left, one to the right, one tipped slightly up, one down. Every single screen shows the IDENTICAL picture of Sobaya from the chest up, his mask square to his own camera, holding a FULL beer mug with a thick foam head at chest height. The bare concrete floor in the foreground is completely empty. Sobaya appears EXACTLY ONCE inside each screen — one single figure per monitor, never two in one picture — and NO person is physically present in the room: nobody stands, walks in, enters or appears in front of the monitors at any time, and there is no audience, no crowd and no onlooker anywhere in the frame. Beat 1 (0–2.0s): nothing in the room moves except the work lamps, which flicker faintly; on every screen the picture holds still, the mask square to camera, the mouth slit unchanged, the mug motionless and still full. Beat 2 (2.0–3.75s): the flicker settles, one hanging chain sways a few centimetres, and nothing else changes. There is no speech, no dialogue and no narration anywhere in this chapter, and the figure on the screens does not move his mouth slit at all. The camera pushes in with small amplitude at slow speed for the whole chapter — no pan, no tilt, no handheld sway. The shot ends on the same arrangement framed slightly tighter, every monitor still on and the picture on them unchanged. In every frame each on-screen mask stays a hard white mask with exactly two black circular eye holes and one horizontal mouth slit — NO human eyes, NO eyelids, NO realistic nose or lips — the four red markings stay two per eye, the exposed skin stays neutral gray, and the mug stays full with its foam head. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters, no labels or readouts on the monitors; the video must contain no text at all. Soundscape: the low electrical hum of many old monitors, the buzz and tick of caged work lamps, a faint chain creak, deep concrete room tone. Music: no background music.

---

## Chapter 6 — "Today you will all play a death game"

- **Cast:** Sobaya, inside the monitor pictures only. No person is physically present in this room.
- **Opening composition:** a locked-off medium shot at eye level in the same room. The large centre monitor of the upper tier now dominates the frame square to camera, one mid-size monitor on each side of it angled outward, and two small monitors below turned down and to the right. Every screen shows the identical picture of Sobaya from the chest up with his FULL foam-topped mug held at his chest. The floor is empty.
- **Action beats:**
  1. (0–0.3s) On every screen at once the masked figure juts his head slightly forward, the cue that he is about to speak.
  2. (0.3–5.1s) He delivers the line. His mouth slit does not change shape; the delivery reads as small rhythmic movements of his head and shoulders. The mug stays motionless at his chest.
  3. (5.1–5.9s) He finishes, then raises the mug to face height like a toast and holds it there. The beer does not spill and the foam head stays intact.
- **End state:** on every screen the masked figure holds the full mug at face height, motionless. The monitors have not changed angle.

### H3 inputs (Chapter 6)
- Mode: R2V
- Cast: Sobaya
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_sheet.png` — Sobaya's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch6_line1_sobaya.wav` (4.76s) — Sobaya's line, use AS-IS as the dialogue audio
- Total input files: 2
- Duration: 5.9s requested → Frames: 141 (5.875s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: Required attached input files: <Picture 1> = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: a hard white full-face mask with TWO large black circular eye holes that are dark inside and ONE horizontal black mouth slit, FOUR red vertical markings — two flanking each eye — plus ONE small black dot centred on the forehead, short spiky black hair above the mask, neutral-GRAY skin on neck, arms and hands, a hulking 180cm/100kg thick build, a plain white short-sleeve T-shirt, and a clear glass beer mug with a handle FULL of amber beer under a thick foam head; do NOT carry over: pose, camera angle, sheet background, panel layout, the mask detail crops, text labels); <Audio 1> = ch6_line1_sobaya.wav — his spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no cream sheet background, no labels or text. Photorealistic live-action cinematography with natural live-action proportions in the same windowless dark concrete basement, no daylight, cold dim ambience from caged work lamps above a rusted scaffold plus the cold blue-white glow of the screens; Sobaya is a live-action man with neutral-gray skin and a hard white mask, seen only as a recorded picture playing on the monitors. NOT flat 2D anime, NOT cartoon lineart. The shot opens on a locked-off MEDIUM shot at eye level: the large boxy centre monitor of the rusted scaffold dominates the middle of the frame square to camera, one mid-size monitor on each side of it angled outward, and two small monitors below turned down and to the right, rust, cables and hanging chains around them. Every single screen shows the IDENTICAL picture of Sobaya from the chest up, mask square to his own camera, holding a FULL beer mug with a thick foam head at chest height. The bare concrete floor is completely empty. Sobaya appears EXACTLY ONCE inside each screen — one single figure per monitor, never two in one picture — and NO person is physically present in the room: nobody stands, walks in or appears in front of the monitors at any time, and there is no audience and no onlooker anywhere in the frame. Beat 1 (0–0.3s): on every screen at once the masked figure juts his head slightly forward as the cue that he is about to speak. Beat 2 (0.3–5.1s): he says <d>[Japanese] 今日はみなさんにデスゲームをしてもらいます。楽しんで帰ってください</d>, driven by <Audio 1>; because he is masked his mouth slit does NOT open or change shape — the delivery reads as small rhythmic movements of his head and shoulders, starting almost immediately, moving ONLY while <Audio 1> plays and settling into stillness when it stops — and the mug stays motionless at his chest throughout. Beat 3 (5.1–5.9s): he raises the mug to face height like a cheerful toast and holds it there; the beer does not spill and the foam head stays intact. Sobaya (S1) is the only speaker and there is no other voice, no narration and no crowd noise. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. The camera is a locked-off static camera for the whole chapter — no push, no pan, no handheld sway. The shot ends with the masked figure on every screen holding the full mug at face height, motionless, the monitors unmoved at their original angles. In every frame each on-screen mask stays a hard white mask with exactly two black circular eye holes and one horizontal mouth slit — NO human eyes, NO eyelids, NO realistic nose or lips — the four red markings stay two per eye, the black forehead dot stays single and centred, the exposed skin stays neutral gray, and the mug stays full with its foam head. The mood is playful and inviting, never menacing or violent. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters, no labels or readouts on the monitors; the video must contain no text at all. Soundscape: the low electrical hum of many old monitors, the buzz of caged work lamps, a faint chain creak, deep concrete room tone under the voice. Music: no background music.

---

## Generation & assembly protocol (REQUIRED — read before generating any chapter)

### Step 1 — Pilot chapter first (batch generation is FORBIDDEN until the pilot passes)
Generate ONLY Chapter 4 (the first chapter where the masked lead speaks, and the hardest composition in the run), then verify ALL of the following:
- [ ] No attached sheet is reproduced as a frame: no panels, no cream sheet background, no labels or text anywhere
- [ ] The opening composition matches this chapter's "Opening composition" (shot size/angle, location, who stands where, empty hands)
- [ ] The action beats happen in the written order and the shot ends in the written end state
- [ ] The dialogue is driven by the attached wavs (correct monsterized voice, no synthesized or doubled voice); the mask slit never opens into a mouth
- [ ] Sobaya matches `Sobaya_sheet.png` item by item against the canon checklist in `02_CHARACTERS/01_Sobaya.md`. A near-miss is a FAIL
- [ ] Exactly the listed Cast appears, each EXACTLY ONCE, in EVERY sampled frame (sample at least 3 mid-chapter frames); nobody else enters
- [ ] Style is photorealistic live-action in every sampled frame, with only the exceptions the chapter's style line states
- [ ] Camera matches the Camera plan row; location, light and darkness match the Scene ledger
- [ ] NO on-screen text; Soundscape/Music as written; duration equals the declared frame count (17k+5 grid)
If any check fails, fix the prompt (or split the chapter) and regenerate the pilot until all pass.
Only then generate the remaining chapters, and re-run at least the sheet-leak + composition + cast + audio + duration checks on each. Chapters 5 and 6 additionally need a zoomed check that NO person stands in the room and that no monitor shows two figures.

### Step 2 — Prompts are verbatim
Copy each chapter's Motion prompt into the workflow JSON EXACTLY as written here (`extract_prompts.py`). Do NOT
summarize or shorten. If it seems too long, go back to the chapter plan and split the chapter.

### Step 3 — Final audio track (assembly)
DEFAULT: keep H3's embedded audio for every chapter (verified faithful to the attached wavs, 2026-08).
ONLY IF the pilot hears degradation, doubling or a changed voice: strip the embedded audio on that chapter
and lay the original wav over the video, aligned to the frame where the speaker starts moving.
Play back the assembled video before delivery and confirm every line sounds like the local take.
