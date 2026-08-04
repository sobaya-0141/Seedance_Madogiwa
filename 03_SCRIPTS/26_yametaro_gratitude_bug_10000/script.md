# Seedance: Ten Thousand Gratitude Bugs (感謝のバグ仕込み一万回)

Total duration: about 112 seconds (17 clips; 91.1s of narration and dialogue audio)

Status: script, all 17 audio takes and Clips 1-9's keyframes are complete. Clips 10-17 still need their end frames — see 「Keyframe generation notes」at the end of this file.
Aspect ratio: 16:9
Genre: deadpan martial-arts-legend narration over cheerful office slice-of-life comedy
Setting: the window-side (窓際族) zone on a high floor of Accidenchua Inc. in Akasaka, Tokyo. DIY cardboard furniture, a desk built from stacked cardboard boxes, and a floor-to-ceiling window on the RIGHT of frame showing the Tokyo skyline with Tokyo Tower. The whole story happens at this one desk, so every keyframe chains from the previous one.

Tone note: Yametaro is doing this entirely by his own cheerful choice. He is never miserable, never scolded, and nobody is angry with him. Every character smiles. This is a heroic-legend parody, not a story about a hard workplace.

## Character references

- Yametaro: `Yametaro_sheet.png` (bundled physical file; required CapCut attachment)
- Fukuchan: `Fukuchan_sheet.png` (bundled physical file; required CapCut attachment, Clips 11-17)
- Relative scale: `height_lineup.png` (bundled physical file; required for the two-shot Clips 11-17 — Yametaro is far shorter than Fukuchan)

## Dialogue audio (all voices pre-generated locally — Seedance must NOT generate any voice)

All narration is delivered by the Narrator voice; only Clip 12 (Fukuchan) and Clip 14 (Yametaro) are spoken by an on-screen character. In every narration clip NO on-screen character speaks and every mouth stays CLOSED.

| File | Clip | Character | Voice (engine) | Line (ja) | Duration |
|---|---:|---|---|---|---:|
| `clip1_line1_narrator.wav` | 1 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「やめ太郎、43歳。己のエンジニア人生に限界を感じ、悩みに悩み抜いた結果、」 | 7.84s |
| `clip2_line1_narrator.wav` | 2 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「やめ太郎がたどり着いたのは――感謝であった。」 | 3.40s |
| `clip3_line1_narrator.wav` | 3 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「一日一万回。感謝のバグ仕込み。」 | 4.19s |
| `clip4_line1_narrator.wav` | 4 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「祈る。仕様書を閉じる。実装する。壊す。謝る。」 | 6.79s |
| `clip5_line1_narrator.wav` | 5 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「この一連の動作を一回として、完了までに当初は十八時間を要した。」 | 5.58s |
| `clip6_line1_narrator.wav` | 6 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「バグを仕込み終えれば、その場で力尽きるように眠る。目覚めれば、また仕込む。」 | 6.81s |
| `clip7_line1_narrator.wav` | 7 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「二年が過ぎたころ、異変が起きた。一万回のバグ仕込みを終えても、日が暮れていない。」 | 6.51s |
| `clip8_line1_narrator.wav` | 8 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「代わりに増えていたのは、エラーログと問い合わせ、そして誰にも再現できない不具合だけだった。」 | 6.80s |
| `clip9_line1_narrator.wav` | 9 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「やめ太郎は気づく。バグを作る速度が、レビューを置き去りにした。」 | 5.52s |
| `clip10_line1_narrator.wav` | 10 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「タイピングの音は消えた。コミット履歴すら残らない。ただ祈りを終えた瞬間、本番環境のどこかが静かに壊れている。」 | 10.44s |
| `clip11_line1_narrator.wav` | 11 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「同僚が尋ねた。」 | 1.64s |
| `clip12_line1_fukuchan.wav` | 12 | Fukuchan (on-screen) | Irodori-TTS (`Fukuchan_voice.wav`, seed 42) | 「やめ太郎さん……今、何をしていたんですか？」 | 3.68s |
| `clip13_line1_narrator.wav` | 13 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「やめ太郎は、穏やかな表情で手を合わせた。」 | 3.52s |
| `clip14_line1_yametaro.wav` | 14 | Yametaro (on-screen) | Irodori-TTS (`Yametaro_voice.wav`, seed 7) | 「何もしてへんで」 | 1.22s |
| `clip15_line1_narrator.wav` | 15 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「その直後、Slackに障害通知が百件流れた。」 | 4.32s |
| `clip16_line1_narrator.wav` | 16 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「後にこの技は、畏怖を込めてこう呼ばれる。究極奥義『何もしてないのに壊れた』」 | 7.76s |
| `clip17_line1_narrator.wav` | 17 | Narrator (off-screen) | Irodori-TTS (`Narrator_voice.wav`, seed 100) | 「なお、やめ太郎は現在も原因究明のため祈り続けている。」 | 5.08s |

## Prop state ledger

This ledger is TRANSPOSED relative to the usual orientation: each ROW is one keyframe boundary and each COLUMN is one prop. The shared-cell rule is unchanged — a row labelled `C4 end = C5 start` is the single source of truth for both sides of that seam, so no state can be written twice with different values.

| Keyframe boundary | Spec binder (paper) | Laptop lid | Laptop screen | Yametaro's hands | Printout pile on desk | Window light |
|---|---|---|---|---|---|---|
| C1 start | OPEN flat on the desk | OPEN about 110°, hinged at the far edge | plain blue code editor, calm | both small hands propping up his chin, elbows on the desk | NONE | late-afternoon golden |
| C1 end = C2 start | OPEN flat on the desk | OPEN about 110° | plain blue code editor, calm | both fists pressed against his temples, eyes squeezed shut | NONE | late-afternoon golden |
| C2 end = C3 start | OPEN flat on the desk | OPEN about 110° | plain blue code editor, calm | palms pressed together in a prayer pose at his chest | NONE | late-afternoon golden, warm sparkle |
| C3 end = C4 start | OPEN flat on the desk (frame edge) | OPEN about 110° | plain blue code editor, calm | palms pressed together in a prayer pose at his chest | NONE | late-afternoon golden |
| C4 end = C5 start | CLOSED, squared up on the desk | OPEN about 110° | one glowing red crack across the calm blue editor | both palms flat on the desk in a deep apologetic bow | NONE | late-afternoon golden |
| C5 end = C6 start | CLOSED, squared up on the desk | OPEN about 110° | one glowing red crack | folded under his cheek — asleep face-down on the desk | NONE | deep evening blue, city lights on |
| C6 end = C7 start | CLOSED, squared up on the desk | OPEN about 110° | one glowing red crack | sat UPRIGHT with palms pressed together in a prayer pose | NONE | deep evening blue, city lights on (unchanged from C5 end) |
| C7 end = C8 start | CLOSED, squared up on the desk | OPEN about 110° | one glowing red crack | palms pressed together in a prayer pose, facing forward, expression unchanged | NONE | BRIGHT MIDDAY |
| C8 end = C9 start | CLOSED, squared up on the desk | OPEN about 110° | dense red error-log lines filling the screen | palms pressed together in a prayer pose | TALL leaning tower, taller than Yametaro | BRIGHT MIDDAY |
| C9 end = C10 start | CLOSED, squared up on the desk | OPEN about 110° | dense red error-log lines filling the screen | palms pressed together in a prayer pose, facing forward, eyes wide in dawning realization with a sweat-drop | TALL leaning tower | BRIGHT MIDDAY |
| C10 end = C11 start | CLOSED, squared up on the desk | OPEN about 110° | one single quiet red dot on a black screen | palms pressed together in a prayer pose, held perfectly still | TALL leaning tower | BRIGHT MIDDAY |
| C11 end = C12 start | CLOSED, squared up on the desk | OPEN about 110° | one single quiet red dot on a black screen | palms pressed together in a prayer pose | TALL leaning tower | BRIGHT MIDDAY |
| C12 end = C13 start | CLOSED, squared up on the desk | OPEN about 110° | one single quiet red dot on a black screen | palms pressed together in a prayer pose | TALL leaning tower | BRIGHT MIDDAY |
| C13 end = C14 start | CLOSED, squared up on the desk | OPEN about 110° | one single quiet red dot on a black screen | palms pressed together in a prayer pose, now turned to face Fukuchan | TALL leaning tower | BRIGHT MIDDAY |
| C14 end = C15 start | CLOSED, squared up on the desk | OPEN about 110° | one single quiet red dot on a black screen | palms pressed together in a prayer pose | TALL leaning tower | BRIGHT MIDDAY |
| C15 end = C16 start | CLOSED, squared up on the desk | OPEN about 110° | a dense cascade of stacked notification banners | palms pressed together in a prayer pose | TALL leaning tower | BRIGHT MIDDAY |
| C16 end = C17 start | CLOSED, squared up on the desk | OPEN about 110° | a dense cascade of stacked notification banners | palms pressed together in a prayer pose | TALL leaning tower | BRIGHT MIDDAY |
| C17 end | CLOSED, squared up on the desk | OPEN about 110° | a dense cascade of stacked notification banners | palms pressed together in a prayer pose | TALL leaning tower | late-afternoon golden again (visible time-lapse inside Clip 17) |

Logical check (read left to right, boundary by boundary):

- The binder goes OPEN → CLOSED exactly once, at the C4 seam, and Clip 4's Motion prompt shows him closing it on screen. It is never re-opened, so it can never "reset".
- The laptop screen changes four times, and each change has a visible cause inside the clip that owns it: Clip 4 (he types, the red crack appears), Clip 8 (the crack spreads into a full error log as the paper tower grows), Clip 10 (the log quietly collapses into one red dot as he settles into the prayer pose), Clip 15 (the notification cascade floods in). It never changes across a cut.
- The printout pile appears and grows to its full height inside Clip 8, whose narration is exactly about the error logs and enquiries piling up. After that it is constant. It never shrinks.
- The window light advances forward in time only, and every jump happens inside a clip as a visible time-lapse: Clip 5 golden → evening, Clip 7 evening → bright midday, Clip 17 midday → golden. There are no light changes across a cut. Clip 6 deliberately keeps the night lighting — he wakes and resumes at night, and the narration 「目覚めれば、また仕込む」 does not name a time of day. Concentrating the daylight reveal in Clip 7 is also what makes the 「日が暮れていない」 joke land in one shot.
- Yametaro's hands leave the prayer pose for the Clip 4 bow and the Clip 5 nap, and return to it inside Clip 6; both transitions happen on screen. Every keyframe pair in this run changes at most two things, which is what the local image model follows reliably.
- Nobody eats, drinks, pours, or handles a container anywhere in this run, so there are no liquid-level states to keep consistent.
- The laptop lid is OPEN at every single boundary and is never closed, moved, or re-hinged.

## Fixture layout (constant across ALL clips — hinges and handles never move)

| Fixture | Hinge side (from camera) | Handle | Opens |
|---|---|---|---|
| Yametaro's laptop | hinged along its FAR edge (the edge away from camera, nearest the window) | no latch and no handle — a plain lid edge; the front lip nearest the camera is the free edge | the lid tilts away from camera toward the window and stays at about 110° in every frame; it is NEVER closed and the hinge NEVER moves to the front lip |

There are no doors, drawers, or windows that open in this run — Fukuchan simply walks in from off-screen frame-left. Every keyframe prompt and Motion prompt that shows the laptop repeats this hinge description so the lid cannot flip its hinge side between frames.

## Clip 1 — Forty-three years old, at his limit

Duration: 9 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip1_line1_narrator.wav`

### First frame

A medium shot of the window-side zone from slightly front-left. Yametaro — the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses, pink blush cheeks and a purple shirt — sits at a desk built from stacked cardboard boxes. He is slumped forward with both small hands propping up his chin, elbows on the desk, staring at an open laptop with a comically defeated pout. His mouth is CLOSED. The spec binder lies OPEN flat on the desk beside the laptop. The laptop is hinged along its FAR edge away from camera and stands OPEN at about 110°, showing a calm plain blue code editor. No printout pile yet. Through the floor-to-ceiling window on the RIGHT of frame, late-afternoon golden light and the Tokyo skyline with Tokyo Tower. Comedic slice-of-life anime-illustration style. No text, no letters, no logos, no signage anywhere in the frame.

### Last frame

The same room, the same framing, the same golden light. Yametaro has sat up straight and now presses both tiny fists against his temples with his eyes squeezed shut, brow furrowed in enormous comedic concentration. His mouth stays CLOSED. The binder is still OPEN flat, the laptop is still OPEN at about 110° hinged along its FAR edge with the same calm blue editor, and there is still no printout pile.

### Prop states

- Spec binder: OPEN flat → OPEN flat (unchanged).
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged; the lid is never closed and the hinge never moves to the front lip.
- Laptop screen: calm plain blue code editor → unchanged.
- Yametaro's hands: propping up his chin → fists pressed to his temples.
- Printout pile: NONE → NONE.
- Window light: late-afternoon golden → unchanged.

### CapCut inputs (Clip 1)

- Start frame (Frame A): `clip1_start.png`
- End frame (Frame B): `clip1_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip1_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) sits at his cardboard-box desk in the window-side zone, late-afternoon golden light through the window on the right. He starts slumped forward with both hands propping up his chin, staring at the OPEN laptop with a defeated pout; over the clip he slowly sits up straight and presses both tiny fists against his temples with his eyes squeezed shut in enormous comedic concentration. The spec binder stays OPEN flat on the desk the whole time and is NOT closed in this clip. The laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle — the lid is never closed and the hinge never moves to the front lip — and its screen stays a calm plain blue code editor with no red on it. There is no pile of printouts on the desk. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 9s / Aspect: 16:9

## Clip 2 — What he arrived at was gratitude

Duration: 4.5 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip2_line1_narrator.wav`

### First frame

Identical to Clip 1's last frame (the same image file is reused): Yametaro pressing both fists to his temples, eyes squeezed shut, mouth CLOSED, binder OPEN flat, laptop OPEN at about 110° hinged along its FAR edge with a calm blue editor, no printout pile, late-afternoon golden light.

### Last frame

The same room, framing and light, now with a warm sparkle in the air. Yametaro's eyes have popped wide open behind his round glasses and he beams with pure delight. He has brought both palms together in a prayer pose in front of his chest. His mouth stays CLOSED — it is a radiant closed-mouth smile. The binder is still OPEN flat and the laptop is still OPEN at about 110° with the calm blue editor. No printout pile.

### Prop states

- Spec binder: OPEN flat → OPEN flat (unchanged).
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: calm plain blue code editor → unchanged.
- Yametaro's hands: fists at his temples → palms pressed together in a prayer pose at his chest.
- Printout pile: NONE → NONE.
- Window light: late-afternoon golden → late-afternoon golden with a warm sparkle.

### CapCut inputs (Clip 2)

- Start frame (Frame A): `clip1_end.png`
- End frame (Frame B): `clip2_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip2_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) starts with both fists pressed to his temples and his eyes squeezed shut; his eyes then pop wide open behind his round glasses, warm golden sparkles bloom around him, and he brings both palms together into a prayer pose in front of his chest, beaming with delight. His mouth stays CLOSED throughout — it is a radiant closed-mouth smile, not speech. The spec binder stays OPEN flat on the desk and is NOT closed in this clip. The laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle, and its screen stays a calm plain blue code editor with no red on it. There is no pile of printouts on the desk. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 4.5s / Aspect: 16:9

## Clip 3 — Ten thousand a day

Duration: 5 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip3_line1_narrator.wav`

### First frame

Identical to Clip 2's last frame (the same image file is reused): Yametaro in the prayer pose, beaming, mouth CLOSED, binder OPEN flat, laptop OPEN at about 110° hinged along its FAR edge with the calm blue editor, no printout pile, golden light with a warm sparkle.

### Last frame

The camera has pushed in to a medium close-up of Yametaro from the same front-left angle. His pressed-together palms fill the lower third of frame and his beaming face is above them, mouth CLOSED. The OPEN spec binder is still visible at the bottom edge of frame and the OPEN laptop at about 110° is visible at frame-right with its calm blue editor. Same golden light. No printout pile.

### Prop states

- Spec binder: OPEN flat → OPEN flat, now at the frame edge (unchanged state, only framing changed).
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: calm plain blue code editor → unchanged.
- Yametaro's hands: prayer pose → prayer pose (unchanged).
- Printout pile: NONE → NONE.
- Window light: late-afternoon golden → unchanged.

### CapCut inputs (Clip 3)

- Start frame (Frame A): `clip2_end.png`
- End frame (Frame B): `clip3_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip3_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame. The camera pushes slowly in from a medium shot to a medium close-up of Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) at his cardboard-box desk. He holds his palms pressed together in a prayer pose in front of his chest for the whole clip and does not change the pose; he only beams brighter as the camera closes in. His mouth stays CLOSED throughout. The spec binder stays OPEN flat on the desk and is NOT closed in this clip. The laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle, and its screen stays a calm plain blue code editor with no red on it. There is no pile of printouts on the desk. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 5s / Aspect: 16:9

## Clip 4 — The five-beat ritual

Duration: 8 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip4_line1_narrator.wav`

This is the densest clip in the run — five beats in one shot (pray, close the binder, implement, break it, apologize). Check it especially carefully in the pilot pass; if the five beats blur together, split it into two clips rather than shortening the prompt.

### First frame

Identical to Clip 3's last frame (the same image file is reused): the medium close-up of Yametaro with his palms pressed together, beaming, mouth CLOSED, the OPEN binder at the bottom frame edge, the OPEN laptop at about 110° at frame-right with the calm blue editor, golden light, no printout pile.

### Last frame

The same medium close-up and the same golden light. Yametaro is now bowing deeply with both palms flat on the desk in a full apologetic bow, the top of his oversized head toward camera, eyes closed and still faintly smiling. His mouth is CLOSED. The spec binder is now CLOSED and squared up on the desk. The laptop is still OPEN at about 110° hinged along its FAR edge, and a single glowing red crack now runs across the otherwise calm blue editor. No printout pile.

### Prop states

- Spec binder: OPEN flat → CLOSED and squared up on the desk. He closes it on screen with both hands during beat two; it is never re-opened after this.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged; the lid is never closed.
- Laptop screen: calm plain blue code editor → the same calm blue editor with ONE glowing red crack across it, caused on screen by his typing in beat three.
- Yametaro's hands: prayer pose → both palms flat on the desk in a deep apologetic bow.
- Printout pile: NONE → NONE.
- Window light: late-afternoon golden → unchanged.

### CapCut inputs (Clip 4)

- Start frame (Frame A): `clip3_end.png`
- End frame (Frame B): `clip4_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip4_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous medium close-up, no text or letters anywhere in frame. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) performs a brisk five-beat ritual at his cardboard-box desk, in this exact order and with a clear beat between each: (1) he holds his palms pressed together in a prayer pose and bows his head once; (2) he takes the OPEN spec binder in both hands and closes it, squaring it neatly on the desk so it is CLOSED for the rest of the clip; (3) he taps rapidly on the OPEN laptop keyboard with both tiny hands, cheerful and fast; (4) a single glowing red crack snaps across the calm blue editor on the laptop screen with a small comic spark, and he freezes with his eyebrows up; (5) he plants both palms flat on the desk and bows deeply in apology, the top of his oversized head toward camera, still faintly smiling. He is delighted throughout — never distressed, never scolded, nobody else is in frame. The laptop stays OPEN at about 110° for all five beats, hinged along its FAR edge away from camera with no latch and no handle — the lid is never closed and the hinge never moves to the front lip. The screen starts as a calm plain blue editor with no red on it and ends with exactly ONE red crack; it does not fill with error text in this clip. There is no pile of printouts on the desk. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 8s / Aspect: 16:9

## Clip 5 — Eighteen hours per repetition

Duration: 7 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip5_line1_narrator.wav`

### First frame

Identical to Clip 4's last frame (the same image file is reused): Yametaro bowing with both palms flat on the desk, mouth CLOSED, the binder CLOSED and squared up, the laptop OPEN at about 110° with one red crack on the blue editor, golden light, no printout pile.

### Last frame

The same medium close-up framing as the previous frame. Yametaro is now asleep face-down on the desk with his hands folded under his cheek and a contented little smile, glasses slightly askew. His mouth is CLOSED. The binder is still CLOSED and squared up, and the laptop is still OPEN at about 110° with the one red crack. Through the window it is now deep evening blue with the city lights on. No printout pile.

### Prop states

- Spec binder: CLOSED and squared up → unchanged. It is never re-opened.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: one glowing red crack on the blue editor → unchanged.
- Yametaro's hands: both palms flat on the desk in a bow → folded under his cheek as he sleeps.
- Printout pile: NONE → NONE.
- Window light: late-afternoon golden → deep evening blue with city lights on, shown as a visible time-lapse inside this clip.

### CapCut inputs (Clip 5)

- Start frame (Frame A): `clip4_end.png`
- End frame (Frame B): `clip5_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip5_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame. The camera does not move in this clip. The light outside the window runs forward in a smooth visible time-lapse from late-afternoon golden to deep evening blue with the city lights coming on. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) starts bowing with both palms flat on the desk, then slumps gently sideways and settles asleep face-down on the desk with his hands folded under his cheek, glasses slightly askew, wearing a contented little smile — a happy satisfied nap, not collapse or distress. His mouth stays CLOSED throughout. The spec binder stays CLOSED and squared up on the desk and is NOT re-opened. The laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle, and its screen keeps exactly ONE red crack across the blue editor — the crack does not spread or multiply in this clip. There is no pile of printouts on the desk. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 7s / Aspect: 16:9

## Clip 6 — Wake up, start again

Duration: 8 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip6_line1_narrator.wav`

### First frame

Identical to Clip 5's last frame (the same image file is reused): Yametaro asleep face-down on the desk with his hands folded under his cheek, mouth CLOSED, the binder CLOSED and squared up, the laptop OPEN at about 110° with one red crack, deep evening blue light, no printout pile.

### Last frame

The same medium shot, still lit by the same deep evening blue night light with the city lights on. Yametaro has sat back up, wide awake and alert, with his palms pressed together in the prayer pose again and a calm closed-mouth expression. His glasses are straight again. The binder is still CLOSED and squared up, and the laptop is still OPEN at about 110° with the one red crack. No printout pile.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: one glowing red crack on the blue editor → unchanged.
- Yametaro's hands: folded under his cheek asleep → palms pressed together in the prayer pose, awake.
- Printout pile: NONE → NONE.
- Window light: deep evening blue with city lights on → unchanged. He wakes and resumes at night; the daylight reveal is saved for Clip 7.

### CapCut inputs (Clip 6)

- Start frame (Frame A): `clip5_end.png`
- End frame (Frame B): `clip6_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip6_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame. The night lighting does not change in this clip — it stays deep evening blue outside with the city lights on. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) starts asleep face-down on the desk with his hands folded under his cheek, then pops upright wide awake and refreshed, straightens his round glasses with one finger, and brings both palms together into the prayer pose again with a calm closed-mouth expression. His mouth stays CLOSED throughout. The spec binder stays CLOSED and squared up on the desk and is NOT re-opened. The laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle, and its screen keeps exactly ONE red crack across the blue editor — the crack does not spread in this clip. There is no pile of printouts on the desk. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 4.5s / Aspect: 16:9

## Clip 7 — Two years later, the sun has not set

Duration: 7.5 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip7_line1_narrator.wav`

### First frame

Identical to Clip 6's last frame (the same image file is reused): Yametaro sitting up in the prayer pose, mouth CLOSED, the binder CLOSED and squared up, the laptop OPEN at about 110° with one red crack, deep evening blue night light with the city lights on, no printout pile.

### Last frame

The same medium shot, now flooded with bright midday sun from the window. Yametaro holds exactly the same prayer pose facing forward with the same expression and the same CLOSED mouth as the first frame — the daylight is the only thing that has changed. His surprised double-take happens in the MIDDLE of the clip (see the Motion prompt) and he has settled back to this neutral held pose by the last frame; keeping the keyframe expression neutral is deliberate, because asking the local image model for a surprised face reliably produced an open mouth, which would make Seedance lip-sync him during narration. The laptop screen has filled with dense red error-log lines. A short stack of printouts about ten centimetres high now sits on the desk beside him. The binder is still CLOSED and squared up and the laptop is still OPEN at about 110°.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: one glowing red crack → dense red error-log lines filling the screen. The crack visibly spreads into the full log on screen while he watches.
- Yametaro's hands: prayer pose → prayer pose (unchanged).
- Printout pile: NONE → SHORT stack about 10 cm high, set down on screen by a passing colleague's hand from off-frame.
- Window light: deep evening blue night → BRIGHT MIDDAY, shown as a visible time-lapse inside this clip. This is the clip that carries the 「日が暮れていない」 reveal, so it owns the whole night-to-daylight jump.

### CapCut inputs (Clip 7)

- Start frame (Frame A): `clip6_end.png`
- End frame (Frame B): `clip7_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip7_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame — the error log on the screen is an abstract pattern of red lines, not readable words. The light outside the window runs forward in a smooth visible time-lapse from deep evening blue night, through dawn, to bright midday sun, and the night city lights switch off as it brightens. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) holds his palms pressed together in the prayer pose for the whole clip and never breaks it; he only turns his oversized head toward the window and blinks at the bright sun with comic surprise, eyebrows high. While he does, the single red crack on the laptop screen visibly spreads and multiplies until dense red error-log lines fill the whole screen, and a colleague's hand reaches in from off-frame and quietly sets down a short stack of printouts about ten centimetres high on the desk before withdrawing. He stays cheerful and curious, never distressed. The spec binder stays CLOSED and squared up on the desk and is NOT re-opened. The laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle — the lid is never closed and the hinge never moves to the front lip. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 5s / Aspect: 16:9

## Clip 8 — What grew instead

Duration: 8 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip8_line1_narrator.wav`

### First frame

Identical to Clip 7's last frame (the same image file is reused): Yametaro in the prayer pose blinking at the window, mouth CLOSED, the binder CLOSED, the laptop OPEN at about 110° with dense red error-log lines, a short 10 cm printout stack on the desk, bright midday light.

### Last frame

The same medium shot and the same bright midday light. The printout stack has grown into a tall leaning tower of paper, taller than Yametaro himself, swaying gently beside the desk. Yametaro still holds the prayer pose and now looks up at the top of the tower with delighted wonder, mouth CLOSED. The laptop is still OPEN at about 110° with dense red error-log lines, and the binder is still CLOSED and squared up.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: dense red error-log lines → unchanged.
- Yametaro's hands: prayer pose → prayer pose (unchanged).
- Printout pile: SHORT 10 cm stack → TALL leaning tower taller than Yametaro. The stack visibly grows on screen as more sheets are added from off-frame.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 8)

- Start frame (Frame A): `clip7_end.png`
- End frame (Frame B): `clip8_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip8_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame — the printouts and the error log are abstract patterns of lines, not readable words. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) holds his palms pressed together in the prayer pose for the whole clip and never breaks it. Beside him the short ten-centimetre stack of printouts visibly grows sheet by sheet as more paper drops onto it from off-frame, rising into a tall leaning tower taller than Yametaro himself that sways gently; he tips his oversized head back and looks up at the top of it with delighted wonder, never worried. The laptop screen stays filled with dense red error-log lines the whole time. The spec binder stays CLOSED and squared up on the desk and is NOT re-opened. The laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle — the lid is never closed and the hinge never moves to the front lip. The bright midday light through the window does not change in this clip. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 8s / Aspect: 16:9

## Clip 9 — He realizes

Duration: 6.5 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip9_line1_narrator.wav`

### First frame

Identical to Clip 8's last frame (the same image file is reused): Yametaro in the prayer pose looking up at the tall leaning paper tower, mouth CLOSED, the binder CLOSED, the laptop OPEN at about 110° with dense red error-log lines, bright midday light.

### Last frame

The same medium shot and the same bright midday light. Yametaro faces forward with his eyes gone enormous behind his round glasses in a dawning comic realization and a single sweat-drop at his temple. As with Clip 7, the head-turn toward the screen is a MID-clip beat in the Motion prompt rather than a keyframe pose, because pinning both the head angle and the closed mouth in one generation was unreliable. His palms are still pressed together in the prayer pose and his mouth is CLOSED. The tall leaning paper tower, the CLOSED binder and the OPEN laptop with its dense red error-log lines are all unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: dense red error-log lines → unchanged.
- Yametaro's hands: prayer pose → prayer pose (unchanged).
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 9)

- Start frame (Frame A): `clip8_end.png`
- End frame (Frame B): `clip9_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip9_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame — the error log is an abstract pattern of red lines, not readable words. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) starts looking up at the tall leaning paper tower, then snaps his oversized head around to stare straight at the laptop screen, his eyes going enormous behind his round glasses in a dawning comic realization with a single sweat-drop popping at his temple. It is a funny lightbulb moment, not fear. He keeps his palms pressed together in the prayer pose the entire time and never breaks it, and his mouth stays CLOSED throughout. Nothing else moves: the tall leaning paper tower stays exactly the same height and does not grow or fall, the laptop screen stays filled with the same dense red error-log lines, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. The bright midday light through the window does not change in this clip. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 7.5s / Aspect: 16:9

## Clip 10 — No typing, no commits, just a quiet break

Duration: 11.5 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip10_line1_narrator.wav`

### First frame

Identical to Clip 9's last frame (the same image file is reused): Yametaro in the prayer pose staring at the laptop with enormous eyes, mouth CLOSED, the binder CLOSED, the laptop OPEN at about 110° with dense red error-log lines, the tall leaning paper tower, bright midday light.

### Last frame

The same medium shot and the same bright midday light. Yametaro has closed his eyes and settled into a perfectly still, serene prayer pose facing forward again, mouth CLOSED, a faint smile. The laptop screen has gone black except for one small quiet red dot glowing in its centre. The binder is still CLOSED, the laptop is still OPEN at about 110°, and the tall leaning paper tower is unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: dense red error-log lines → ONE small quiet red dot on a black screen. The log visibly fades out and collapses into the single dot on screen at the moment he finishes his prayer.
- Yametaro's hands: prayer pose → prayer pose, now perfectly still (unchanged pose).
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 10)

- Start frame (Frame A): `clip9_end.png`
- End frame (Frame B): `clip10_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
- Audio: `clip10_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheet's text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) turns his oversized head back to face forward, closes his eyes, and settles into a perfectly still serene prayer pose with a faint smile; his hands never leave the prayer pose and he never touches the keyboard in this clip — there is no typing at all. At the exact moment he settles, the dense red error-log lines on the laptop screen fade out and collapse quietly into ONE small red dot glowing in the centre of an otherwise black screen. The tall leaning paper tower stays exactly the same height and does not grow or fall, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle — the lid is never closed and the hinge never moves to the front lip. The bright midday light through the window does not change in this clip. His mouth stays CLOSED throughout. @Audio1 is off-screen narration: NOBODY on screen speaks and Yametaro's mouth stays CLOSED for the entire clip — no lip movement at all. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 8s / Aspect: 16:9

## Clip 11 — A colleague asks

Duration: 4 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip11_line1_narrator.wav`

From here to the end the shot is a two-shot and Fukuchan is in frame, so `Fukuchan_sheet.png` and `height_lineup.png` are attached from this clip onward. Yametaro is far shorter than Fukuchan — the scale reference exists to stop the model from evening out their heights.

### First frame

Identical to Clip 10's last frame (the same image file is reused): Yametaro alone in the serene prayer pose, mouth CLOSED, the binder CLOSED, the laptop OPEN at about 110° with one quiet red dot on a black screen, the tall leaning paper tower, bright midday light.

### Last frame

The camera has widened to a two-shot of the desk. Fukuchan — the slim, stylish 170cm 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt, with a lanyard name tag — has walked in from frame-left and now stands beside the desk, leaning in slightly toward the tiny Yametaro with a warm curious smile. Fukuchan's mouth is CLOSED. Yametaro, far shorter than Fukuchan, is still in his serene prayer pose with his mouth CLOSED. The binder is CLOSED, the laptop is OPEN at about 110° with the one quiet red dot, the tall leaning paper tower is unchanged, bright midday light.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: ONE small quiet red dot on black → unchanged.
- Yametaro's hands: serene prayer pose → unchanged.
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 11)

- Start frame (Frame A): `clip10_end.png`
- End frame (Frame B): `clip11_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
  - @Image2 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image3 = `height_lineup.png` → height/scale reference for relative body sizes
- Audio: `clip11_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference; @Image3 = height_lineup.png — the height/scale reference for relative body sizes, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheets' text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame. The camera widens from a medium shot to a two-shot of the cardboard-box desk. Fukuchan (@Image2, the slim stylish 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt with a lanyard name tag, always smiling warmly) walks in from off-screen frame-left and stops beside the desk, leaning in slightly toward Yametaro with a warm curious smile. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) stays in his perfectly still serene prayer pose and does not react yet. Per @Image3, Yametaro is dramatically shorter than Fukuchan — barely up to Fukuchan's waist — and that size difference must be obvious. NOBODY speaks in this clip: Fukuchan's mouth stays CLOSED and Yametaro's mouth stays CLOSED for the entire clip, with no lip movement from either of them. The laptop screen keeps exactly ONE small quiet red dot on a black screen, the tall leaning paper tower stays the same height, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. The bright midday light through the window does not change. @Audio1 is off-screen narration. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 6.5s / Aspect: 16:9

## Clip 12 — "What were you just doing?"

Duration: 4.5 seconds
Speaker: Fukuchan only (on screen)
Audio: `clip12_line1_fukuchan.wav`

### First frame

Identical to Clip 11's last frame (the same image file is reused): the two-shot with Fukuchan standing beside the desk leaning in with a warm smile, mouth CLOSED, and the tiny Yametaro in his serene prayer pose, mouth CLOSED. Binder CLOSED, laptop OPEN at about 110° with one quiet red dot, tall paper tower, bright midday light.

### Last frame

The same two-shot, framing and light. Fukuchan is mid-speech with his mouth OPEN, one hand raised in a friendly open-palmed gesture toward Yametaro, still smiling. Yametaro's mouth is CLOSED and he is still in the prayer pose, eyes now open and glancing up at Fukuchan. All props unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: ONE small quiet red dot on black → unchanged.
- Yametaro's hands: serene prayer pose → unchanged.
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 12)

- Start frame (Frame A): `clip11_end.png`
- End frame (Frame B): `clip12_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
  - @Image2 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image3 = `height_lineup.png` → height/scale reference for relative body sizes
- Audio: `clip12_line1_fukuchan.wav` (@Audio1 — spoken by Fukuchan) — use AS-IS as the dialogue audio track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference; @Image3 = height_lineup.png — the height/scale reference for relative body sizes, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheets' text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous two-shot, no text or letters anywhere in frame. ONLY Fukuchan (@Image2, the slim stylish 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt with a lanyard name tag, always smiling warmly) speaks, lip-syncing to @Audio1 the Japanese line 「やめ太郎さん……今、何をしていたんですか？」 — he begins the line almost immediately, and his mouth moves ONLY while @Audio1 is playing; once the line ends his mouth stays CLOSED for the rest of the clip. As he speaks he raises one hand in a friendly open-palmed gesture toward Yametaro, warm and curious, never annoyed. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) does NOT speak — his mouth stays CLOSED for the entire clip, he only holds his serene prayer pose and opens his eyes to glance up at Fukuchan. Per @Image3, Yametaro is dramatically shorter than Fukuchan and that size difference must stay obvious. The laptop screen keeps exactly ONE small quiet red dot on a black screen, the tall leaning paper tower stays the same height, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. The bright midday light through the window does not change. Use the attached audio AS-IS as the dialogue audio and lip-sync Fukuchan to it; do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 11.5s / Aspect: 16:9

## Clip 13 — He puts his palms together

Duration: 4.5 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip13_line1_narrator.wav`

### First frame

Identical to Clip 12's last frame (the same image file is reused): the two-shot with Fukuchan mid-speech, mouth OPEN, one hand raised, and Yametaro in the prayer pose with his mouth CLOSED glancing up. All props as before.

### Last frame

The same two-shot, framing and light. Fukuchan has lowered his hand and closed his mouth, waiting with a patient warm smile. Yametaro has turned his whole tiny body to face Fukuchan, palms still pressed together, wearing a supremely serene closed-mouth smile with his eyes gently shut. All props unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: ONE small quiet red dot on black → unchanged.
- Yametaro's hands: prayer pose glancing up → prayer pose, now turned to face Fukuchan.
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 13)

- Start frame (Frame A): `clip12_end.png`
- End frame (Frame B): `clip13_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
  - @Image2 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image3 = `height_lineup.png` → height/scale reference for relative body sizes
- Audio: `clip13_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference; @Image3 = height_lineup.png — the height/scale reference for relative body sizes, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheets' text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous two-shot, no text or letters anywhere in frame. Fukuchan (@Image2, the slim stylish 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt with a lanyard name tag, always smiling warmly) lowers his raised hand and waits with a patient warm smile. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) turns his whole tiny body to face Fukuchan, keeps his palms pressed together in the prayer pose, gently shuts his eyes and settles into a supremely serene expression. NOBODY speaks in this clip: Fukuchan's mouth stays CLOSED and Yametaro's mouth stays CLOSED for the entire clip, with no lip movement from either of them. Per @Image3, Yametaro is dramatically shorter than Fukuchan and that size difference must stay obvious. The laptop screen keeps exactly ONE small quiet red dot on a black screen, the tall leaning paper tower stays the same height, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. The bright midday light through the window does not change. @Audio1 is off-screen narration. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 4s / Aspect: 16:9

## Clip 14 — "I haven't done anything"

Duration: 4 seconds
Speaker: Yametaro only (on screen)
Audio: `clip14_line1_yametaro.wav`

Lip-sync warning: this line is only 1.22s long but Seedance's minimum clip length is 4s, so the usual "speech fills at least 60% of the clip" guideline cannot be met here. The Motion prompt therefore states explicitly that Yametaro's mouth moves only during the first ~1.2s and stays CLOSED for the remaining ~2.8s. Check this clip specifically for lip-flap during the silent tail; if the mouth keeps moving, trim the tail of the generated clip in CapCut rather than stretching the audio.

### First frame

Identical to Clip 13's last frame (the same image file is reused): the two-shot with Fukuchan waiting with a patient smile, mouth CLOSED, and Yametaro turned toward him in the serene prayer pose with his eyes shut and mouth CLOSED. All props as before.

### Last frame

The same two-shot, framing and light. Yametaro is mid-speech with his mouth OPEN and his eyes now open, palms still pressed together, utterly serene and innocent. Fukuchan's mouth is CLOSED and he listens with a warm delighted smile. All props unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: ONE small quiet red dot on black → unchanged.
- Yametaro's hands: prayer pose → prayer pose (unchanged).
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 14)

- Start frame (Frame A): `clip13_end.png`
- End frame (Frame B): `clip14_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
  - @Image2 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image3 = `height_lineup.png` → height/scale reference for relative body sizes
- Audio: `clip14_line1_yametaro.wav` (@Audio1 — spoken by Yametaro) — use AS-IS as the dialogue audio track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference; @Image3 = height_lineup.png — the height/scale reference for relative body sizes, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheets' text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous two-shot, no text or letters anywhere in frame. ONLY Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) speaks, lip-syncing to @Audio1 the Japanese line 「何もしてへんで」 — he begins the line almost immediately, his mouth moves ONLY during the first 1.2 seconds while @Audio1 is playing, and for the remaining 2.8 seconds of the clip his mouth stays completely CLOSED with no lip movement at all. He opens his eyes as he says it, keeps his palms pressed together in the prayer pose, and stays utterly serene and innocent. Fukuchan (@Image2, the slim stylish 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt with a lanyard name tag, always smiling warmly) does NOT speak — his mouth stays CLOSED for the entire clip, he only listens with a warm delighted smile. Per @Image3, Yametaro is dramatically shorter than Fukuchan and that size difference must stay obvious. The laptop screen keeps exactly ONE small quiet red dot on a black screen, the tall leaning paper tower stays the same height, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. The bright midday light through the window does not change. Use the attached audio AS-IS as the dialogue audio and lip-sync Yametaro to it; do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 4.5s / Aspect: 16:9

## Clip 15 — One hundred alerts

Duration: 5.5 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip15_line1_narrator.wav`

### First frame

Identical to Clip 14's last frame (the same image file is reused): the two-shot with Yametaro mid-speech, mouth OPEN, palms together, and Fukuchan listening with a warm smile, mouth CLOSED. All props as before.

### Last frame

The same two-shot, framing and light. The laptop screen has erupted into a dense cascade of stacked notification banners pouring down it, and Fukuchan has whipped out a phone that is doing the same, looking at it with utter delight. Yametaro's mouth is now CLOSED and he is back in his perfectly serene prayer pose, entirely unbothered. The binder is still CLOSED, the laptop is still OPEN at about 110°, and the tall leaning paper tower is unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: ONE small quiet red dot on black → a dense cascade of stacked notification banners. The banners visibly flood in on screen, one after another, during this clip.
- Yametaro's hands: prayer pose → prayer pose (unchanged).
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged.

### CapCut inputs (Clip 15)

- Start frame (Frame A): `clip14_end.png`
- End frame (Frame B): `clip15_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
  - @Image2 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image3 = `height_lineup.png` → height/scale reference for relative body sizes
- Audio: `clip15_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference; @Image3 = height_lineup.png — the height/scale reference for relative body sizes, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheets' text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous two-shot, no text or letters anywhere in frame — the notification banners are abstract coloured bars with no readable words. Immediately after Yametaro finishes speaking, the single quiet red dot on the laptop screen bursts into a dense cascade of stacked notification banners pouring down the screen one after another, and Fukuchan (@Image2, the slim stylish 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt with a lanyard name tag, always smiling warmly) whips a phone out of his coat pocket and looks at it doing exactly the same thing, delighted rather than alarmed. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) closes his mouth, settles back into his perfectly serene prayer pose and stays completely unbothered. NOBODY speaks in this clip: Fukuchan's mouth stays CLOSED and Yametaro's mouth stays CLOSED for the entire clip, with no lip movement from either of them. Per @Image3, Yametaro is dramatically shorter than Fukuchan and that size difference must stay obvious. The tall leaning paper tower stays the same height, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. The bright midday light through the window does not change. @Audio1 is off-screen narration. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 4.5s / Aspect: 16:9

## Clip 16 — The ultimate secret technique

Duration: 9 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip16_line1_narrator.wav`

### First frame

Identical to Clip 15's last frame (the same image file is reused): the two-shot with the laptop cascading notification banners, Fukuchan delighted at his phone, and Yametaro serene in the prayer pose, both mouths CLOSED. All props as before.

### Last frame

The same location, pushed slightly wider and shot from a low heroic angle. Yametaro stands on his chair in the prayer pose, backlit by the window in a dramatic golden rim light like a legendary martial-arts master, beaming with a closed mouth. Fukuchan has both hands pressed to his own cheeks in his signature delighted "gyun-gyun" pose, mouth CLOSED. The laptop still cascades notification banners, the binder is still CLOSED, the laptop is still OPEN at about 110°, and the tall leaning paper tower is unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: dense cascade of stacked notification banners → unchanged.
- Yametaro's hands: prayer pose → prayer pose (unchanged); he climbs onto his chair on screen.
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → unchanged (the golden rim light is a dramatic backlight effect, not a time change).

### CapCut inputs (Clip 16)

- Start frame (Frame A): `clip15_end.png`
- End frame (Frame B): `clip16_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
  - @Image2 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image3 = `height_lineup.png` → height/scale reference for relative body sizes
- Audio: `clip16_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference; @Image3 = height_lineup.png — the height/scale reference for relative body sizes, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheets' text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous shot, no text or letters anywhere in frame — the notification banners are abstract coloured bars with no readable words. The camera drops to a low heroic angle and widens slightly. Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) climbs up to stand on his cardboard-box chair without ever breaking his prayer pose, and a dramatic golden rim light flares behind him from the window so he is backlit like a legendary martial-arts master, beaming proudly with his mouth CLOSED. Fukuchan (@Image2, the slim stylish 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt with a lanyard name tag, always smiling warmly) presses both hands to his own cheeks in his signature delighted gyun-gyun pose. NOBODY speaks in this clip: Fukuchan's mouth stays CLOSED and Yametaro's mouth stays CLOSED for the entire clip, with no lip movement from either of them. Per @Image3, Yametaro is dramatically shorter than Fukuchan and that size difference must stay obvious even while he stands on the chair. The laptop screen keeps cascading the same dense notification banners, the tall leaning paper tower stays the same height, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. The daylight outside the window does not change in this clip — the golden flare is a backlight effect only. @Audio1 is off-screen narration. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 4s / Aspect: 16:9

## Clip 17 — Still praying, to this day

Duration: 6 seconds
Speaker: none on screen (Narrator, off-screen)
Audio: `clip17_line1_narrator.wav`

### First frame

Identical to Clip 16's last frame (the same image file is reused): the low-angle wide two-shot with Yametaro backlit on his chair in the prayer pose and Fukuchan in the gyun-gyun pose, both mouths CLOSED, laptop cascading banners, tall paper tower, bright midday light outside.

### Last frame

The same low-angle wide shot and the same poses — Yametaro still standing on his chair in the prayer pose beaming, Fukuchan still in the gyun-gyun pose, both mouths CLOSED — but the light through the window has run forward to late-afternoon golden again, and long warm shadows stretch across the floor. The laptop still cascades notification banners, the binder is still CLOSED, the laptop is still OPEN at about 110°, and the tall leaning paper tower is unchanged.

### Prop states

- Spec binder: CLOSED and squared up → unchanged.
- Laptop lid: OPEN about 110°, hinged along the FAR edge → unchanged.
- Laptop screen: dense cascade of stacked notification banners → unchanged.
- Yametaro's hands: prayer pose → prayer pose (unchanged).
- Printout pile: TALL leaning tower → unchanged.
- Window light: BRIGHT MIDDAY → late-afternoon golden, shown as a visible time-lapse inside this clip to sell "he is still praying to this day".

### CapCut inputs (Clip 17)

- Start frame (Frame A): `clip16_end.png`
- End frame (Frame B): `clip17_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Yametaro_sheet.png` → Yametaro (the tiny chibi cartoon man with round glasses and a purple shirt)
  - @Image2 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image3 = `height_lineup.png` → height/scale reference for relative body sizes
- Audio: `clip17_line1_narrator.wav` (@Audio1 — off-screen narrator, NOT any on-screen character) — use AS-IS as the narration track
- Motion prompt: Required attached reference files: @Image1 = Yametaro_sheet.png — Yametaro's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Fukuchan_sheet.png — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference; @Image3 = height_lineup.png — the height/scale reference for relative body sizes, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation. The reference sheets' text labels must NOT appear in the video. Comedic slice-of-life anime-illustration style, one continuous locked-off low-angle shot, no text or letters anywhere in frame — the notification banners are abstract coloured bars with no readable words. Nobody changes pose: Yametaro (@Image1, the tiny chibi cartoon middle-aged man with an oversized head, black bowl-cut hair, small round white glasses and a purple shirt) stays standing on his cardboard-box chair in his prayer pose, beaming, and Fukuchan (@Image2, the slim stylish 48-year-old black-haired man in a loose black long coat over a white graphic T-shirt with a lanyard name tag, always smiling warmly) stays in his gyun-gyun pose with both hands on his own cheeks. The only thing that moves is time: the light through the window runs forward in a smooth visible time-lapse from bright midday to late-afternoon golden, and long warm shadows stretch across the floor. NOBODY speaks in this clip: Fukuchan's mouth stays CLOSED and Yametaro's mouth stays CLOSED for the entire clip, with no lip movement from either of them. Per @Image3, Yametaro is dramatically shorter than Fukuchan and that size difference must stay obvious. The laptop screen keeps cascading the same dense notification banners, the tall leaning paper tower stays the same height, the spec binder stays CLOSED and squared up, and the laptop stays OPEN at about 110°, hinged along its FAR edge away from camera with no latch and no handle. @Audio1 is off-screen narration. Use the attached audio AS-IS as the narration and do NOT generate any voice — no synthesized speech, no narration, no singing.
- Duration: 5.5s / Aspect: 16:9

## Generation & assembly protocol (REQUIRED — read before generating anything in CapCut)

### Step 1 — Pilot clip first (batch generation is FORBIDDEN until the pilot passes)
Generate ONLY Clip 1, then verify ALL of the following before touching any other clip:
- [ ] The dialogue audio in the output is the attached wav AS-IS (no synthesized voice, no doubled voices)
- [ ] The CORRECT character lip-syncs to each line (the speaker named in the prompt moves their mouth; every non-speaker's mouth stays closed). Clip 1 is a narration clip, so the correct result is that NO mouth moves at all — if Yametaro lip-syncs to the narrator, fix the prompt before continuing, because 15 of the 17 clips in this run are narration clips with the same requirement.
- [ ] Mouth motion starts and ends WITH the audio: the speaker's mouth starts moving when the line starts and stays CLOSED after the line ends (no lip-flap during silence)
- [ ] Motion, poses and prop states match the Motion prompt and the Prop state ledger
- [ ] Hinges, handles and other fixture hardware stay on the edges given in the Fixture layout table in EVERY frame (handles never disappear, jump to the hinge side, or duplicate — especially when a door finishes closing). In this run that means the laptop lid stays open at about 110° and stays hinged along its FAR edge in every frame.
- [ ] The clip duration equals the Duration specified in the CapCut inputs table (NOT the ~8s default)
If any check fails, fix the inputs/prompt and regenerate Clip 1 until all pass.
Only then generate the remaining clips, and re-run at least the audio + duration checks on every clip.

Clip 4 packs five distinct beats into one shot. Treat it as a second pilot: if the five beats blur into one vague motion, split it into two clips rather than shortening its prompt.

### Step 2 — Prompts are verbatim
Paste each clip's Motion prompt into CapCut EXACTLY as written in this file.
Do NOT summarize, shorten, or paraphrase it. If it seems too long, do not compress it —
go back to the script and split the clip instead.

### Step 3 — Final audio track (assembly)
The audio embedded in the generated clips is NOT the final audio, even when the wav was
attached at generation time. When assembling the final video on the CapCut timeline:
1. Mute (or delete) the audio embedded in every generated clip.
2. Lay the original wav files from the Dialogue audio table onto the timeline as the
   final dialogue track. Align each wav to the VIDEO's mouth movement, NOT to the clip
   boundary: nudge the wav until the speech onset lands on the frame where the speaker's
   mouth starts moving. For the narration clips there is no mouth to match, so align the
   narration wav to the start of its own clip.
3. Play back the full timeline before export and confirm every line sounds exactly like
   the local VOICEVOX / Irodori-TTS takes (the source wavs are the single source of truth).

## Keyframe generation notes

All keyframes were generated locally with `draw-things-cli` (model `qwen_image_edit_2511_q6p.ckpt`, 1024x576, 20 sampling steps, default strength) via `.claude/skills/seedance/dt_generate.sh`, chained start -> end with each clip's start frame reused as the previous clip's end frame. The whole chain is reproducible with the bundled `gen_keyframes.sh` (run it from the repository root; it skips frames that already exist, so it doubles as the resume script). The dialogue and narration audio is reproducible the same way with `gen_audio.sh`.

**Status: this run is INCOMPLETE.** Clips 1-9 have both keyframes; Clips 10-17 still need their end frames. Running `gen_keyframes.sh` resumes at `clip10_end.png`.

`python3 .claude/skills/seedance/validate_run_bundle.py 03_SCRIPTS/26_yametaro_gratitude_bug_10000` currently reports 16 errors, and every one of them is a missing `clip10_end.png` .. `clip17_end.png`. Everything else the validator enforces already passes: all 17 wav files are bundled, the character sheets and the scale reference are physical files rather than symlinks, no `../../02_CHARACTERS/` paths are referenced, and every Motion prompt redeclares its `@ImageN = filename` attachments. The validator must pass cleanly before this run is treated as finished.

### Style

This IP is NOT flat 2D anime. The window-side members' character sheets are photographs of real people, and Yametaro alone is a soft matte 3D-rendered chibi figure. Every prompt therefore ends with the same photoreal style block (see `$STYLE` in `gen_keyframes.sh`). An earlier attempt at this run was generated in flat 2D anime style and had to be thrown away — see `.claude/skills/seedance/SKILL.md` 「画風の決定」.

### Frames

| Frame | Seed | Input image | Note |
|---|---|---|---|
| `clip1_start.png` | 2001 | `ref_canvas_clip1_start.png` (stitched from `Yametaro_sheet.png`) | opening plate; the only frame seeded from a character sheet |
| `clip1_end.png` | 2002 | `clip1_start.png` | 1 change: fists to temples, eyes squeezed shut |
| `clip2_end.png` | 2003 | `clip1_end.png` | 1 change: palms together in the prayer pose, golden sparkles |
| `clip3_end.png` | — | `clip2_end.png` | **crop of `clip2_end`, not generated** (box 220,20,1020,470 -> 1024x576). The clip is a pure camera push-in, so cropping keeps the expression and props identical. Generating it twice produced a worried face both times. |
| `clip4_end.png` | 2005 | `clip3_end.png` | 2 changes: binder closed, deep apologetic bow (+ one red crack on screen) |
| `clip5_end.png` | 2006 | `clip4_end.png` | 2 changes: asleep on the desk, golden -> night |
| `clip6_end.png` | 2007 | `clip5_end.png` | 1 change: sits upright into the prayer pose (night kept) |
| `clip7_end.png` | 2038 | `clip6_end.png` | 1 change: night -> bright midday. Face explicitly copied from the input; the surprised double-take is a Motion-prompt beat, not a keyframe pose |
| `clip8_end.png` | 2009 | `clip7_end.png` | 2 changes: screen fills with red error log, tall paper tower appears |
| `clip9_end.png` | 2010 | `clip8_end.png` | 1 change: wide-eyed realization with a sweat-drop (head-turn left to the Motion prompt) |
| `clip10_end.png` | 2031 | `clip9_end.png` | NOT YET GENERATED — 1 change: screen goes black with one red dot |
| `clip11_end.png` | 2012 | `clip10_end.png` | NOT YET GENERATED — 2 changes: Fukuchan walks in, frame widens |
| `clip12_end.png` | 2013 | `clip11_end.png` | NOT YET GENERATED — 1 change: Fukuchan's mouth opens (he speaks) |
| `clip13_end.png` | 2014 | `clip12_end.png` | NOT YET GENERATED — 2 changes: Fukuchan lowers his hand and closes his mouth, Yametaro turns to face him |
| `clip14_end.png` | 2015 | `clip13_end.png` | NOT YET GENERATED — 1 change: Yametaro's mouth opens (he speaks) |
| `clip15_end.png` | 2016 | `clip14_end.png` | NOT YET GENERATED — 2 changes: notification cascade on screen, Fukuchan pulls out his phone |
| `clip16_end.png` | 2017 | `clip15_end.png` | NOT YET GENERATED — low heroic angle, Yametaro stands on the chair, Fukuchan does the gyun-gyun pose |
| `clip17_end.png` | 2018 | `clip16_end.png` | NOT YET GENERATED — 1 change: midday -> late-afternoon golden |

Seeds for the ungenerated frames are the values `gen_keyframes.sh` will use, recorded here so a successful take can be reproduced later.

## Credits

No VOICEVOX voices are used in this run — every line is Irodori-TTS voice cloning (Narrator, Fukuchan, Yametaro), so no VOICEVOX on-screen credit is required. If a VOICEVOX character is ever added to this run, add the `VOICEVOX:<話者名>` credit as CapCut end-card or overlay text before export.
