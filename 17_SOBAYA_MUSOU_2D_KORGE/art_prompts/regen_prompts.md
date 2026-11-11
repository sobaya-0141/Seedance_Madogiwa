# そば屋スプライト 作り直しプロンプト（第2版）

`generated/` の61枚（idle・run・combo1〜4・charge）を検証した結果、全コマを作り直す。精度を最優先にするため、1枚目を「基準コマ」として固め、残りはすべてその基準コマに合わせて作る。

## 前回の不合格理由と、この版での対策

| 不合格の理由 | 対象 | この版での対策 |
| --- | --- | --- |
| 仮面の赤い線が2本（目の横を途切れずに通る1本×左右） | 全61枚 | 正しい形（目の穴で上下に分かれる、計4本）を言葉で細かく指定し、仮面デザインの元画像を参照画像Bとして添付する |
| 待機のコマで体の大きさが1割前後縮む | idle_05〜07 | 待機の2〜8コマ目は、基準コマを編集元にして肩・胸だけを動かす |
| 真正面を向いたコマが混ざる | idle_02〜08、combo1_06、combo2_06、combo4_02・04・08・10、charge_10・11 | 「真正面を向かない、右向き斜め」を全コマで指定する |
| ポーズが指示と違う | combo4_02・04 | 姿勢の指示を書き直し、旧画像は参考にしない |
| 余白がなく、振り上げたジョッキが上端に触れる | 全体（特に combo4_03） | 基準コマを参照画像Cとして毎回添付し、大きさと足元の位置を合わせる |

## 添付する参照画像（毎回、この順番で添付する）

| 記号 | ファイル | 何のために使うか |
| --- | --- | --- |
| A | `02_CHARACTERS/Sobaya_sheet.png` | キャラクターの同定（体型・服・髪・ジョッキ） |
| B | `04_GAME_ASSETS/voxel/model_source/textures/sobaya_mask_design_source.png` | 仮面の正しいデザイン（赤い線4本・額の点・鼻・口の形と位置） |
| C | `art_prompts/anchor/anchor_idle_01.png`（手順2でこちらが作る） | 基準コマ。絵柄・線の太さ・大きさ・足元の位置・カメラの角度を合わせる |
| D | `art_prompts/generated/<旧ファイル>.png`（表で「旧画像を参考」が ○ のコマだけ） | 体のポーズとジョッキの位置だけを写す |

手順1では A・B だけを添付する（C はまだ無い）。

## 共通ブロック（第2版。全コマの先頭に付ける）

```
Attached images:
- Image A is the character sheet of "Sobaya" (identity: body, clothes, hair, beer mug).
- Image B is the exact design of his mask (red markings, forehead dot, nose, mouth). Follow Image B exactly for the mask.
- Image C (when attached) is the approved anchor frame. Match its art style, line weight, shading, colors, character size, foot position, camera angle and canvas framing exactly.
- Image D (when attached) is a pose reference. Copy ONLY the body pose and the mug position from it. Ignore its mask markings, its size and its framing.

Draw ONE full-body frame of Sobaya for a high-end 2D side-scrolling beat-'em-up game.

Art style: high-quality Japanese anime cel shading, bold clean outlines (thicker on the silhouette, thinner inside), 3 tones of shading (light, shadow, deep shadow). Key light from the upper left. A cool-violet rim light on the right edge of the silhouette (bluish violet, clearly different from the magenta background).

Canvas and framing (identical for every frame, same as Image C):
- Square canvas, flat solid magenta background (#FF00FF), no floor, no cast shadow, no gradient.
- The character is drawn SMALLER than the canvas: when standing upright the top of his hair is at 26% of the canvas height and the point between his feet is at 92% of the canvas height, horizontally centered. Keep this exact size in every frame, even in crouching, leaning or arm-raised poses (do not enlarge a crouching pose to fill the canvas; do not shrink an arm-raised pose to fit).
- Leave empty magenta space all around him. Nothing touches or crosses any edge of the canvas.
- Camera about 20 degrees above eye level.
- Facing: his body faces screen-right in a three-quarter view (we see his front and his right side). NEVER a straight frontal view, NEVER facing screen-left, unless the frame text explicitly says so.

PRESERVE — mask (follow Image B, count every item):
- A hard white mask covers the whole face.
- Exactly 2 large round eye holes, pitch black inside (no eyeballs, eyelids, lashes or brows).
- Exactly 4 separate red markings. On EACH side, one long vertical red blade is split by the eye hole into two pieces: one piece directly ABOVE the eye hole (from just above the eye up toward the hairline, tapering to a sharp point at the top) and one piece directly BELOW the eye hole (from just below the eye down toward the jaw, tapering to a sharp point at the bottom). The red never runs beside the eye hole; the eye hole interrupts it, with a thin white gap between each red piece and the hole. Left and right are mirror-symmetric. (In a three-quarter view the far-side pieces may be partly hidden by the curve of the mask, but they are never merged or moved.)
- Exactly 1 small round dark-gray dot with a thin black rim in the center of the forehead, between the two upper red pieces.
- A small, simple dark-gray nose shape below the eyes (no realistic nose, no nostrils, no lips).
- Exactly 1 short horizontal black mouth slit with rounded ends, below the nose.

PRESERVE — body (follow Image A, count every item):
- Short spiky black hair sticking out above the mask (also visible from behind).
- All exposed skin (neck, ears, arms, hands) is neutral gray, never flesh-toned.
- Hulking 180 cm / 100 kg build with thick arms and a heavy torso (not a lean bodybuilder, no six-pack).
- Plain white short-sleeve T-shirt, black/charcoal jeans, white sneakers. No suit, no gloves, no jacket.
- A large clear glass beer mug with a handle, filled with amber beer and a white foam head, held by the handle in his RIGHT hand in every frame (never a can, bottle or tumbler; never dropped or thrown).

Do NOT carry over from Image A: its photorealistic rendering, its poses, panel layout, panel borders, text labels, color swatches, close-up insets or the beige background. Do NOT carry over from Image B: its flat graphic style or its white background.
No visual effects, no motion lines, no speech bubbles, no text, no extra characters. Nothing magenta on the character.
```

各コマは、共通ブロックの後ろに表の `Frame:` を足して使う。

---

## 手順1: 基準コマを作る（A・Bを添付）

**idle_01.png**
```
Frame: idle stance, frame 1 of 8. Three-quarter view facing screen-right. Feet a little wider than shoulder-width, knees slightly bent, weight centered. Left fist raised loosely in front of his chest. Right hand holds the beer mug at chest height, foam level and not spilling. Calm, confident, slightly comical heavyweight presence.
```

満足する1枚ができるまで作り直してよい（複数案を出して選ぶのがおすすめ）。

## 手順2: 基準コマの確定（こちらで行う）

届いた idle_01 を、Claude がキャラクターシートと仮面デザイン（A・B）で1項目ずつ照合する。合格したら、大きさと足元の位置を正確な数値（キャンバス1280×1280、足元 640,1180、髪の上端 y=340）に合わせて `art_prompts/anchor/anchor_idle_01.png` を作る。以降はすべてこれを参照画像Cとして添付する。

## 手順3: 待機の2〜8コマ目（基準コマCを編集元にする）

画像生成の「編集」で、Cを編集元として渡す。体の輪郭・大きさ・足の位置・仮面は変えず、指示した部分だけを動かす。

編集用の共通文（各コマの指示の前に付ける）:
```
Edit the attached anchor frame (Image C). Keep everything identical — the same size, the same foot position, the same feet, legs, hips, mask, hair, colors, line style and canvas — and change ONLY what is described below. The change is tiny (a few pixels); this is one frame of a breathing loop.
```

| ファイル | 変える部分 |
| --- | --- |
| idle_02.png | `Shoulders and chest raised by 1% of the canvas height, as if breathing in. The mug rises the same amount.` |
| idle_03.png | `Shoulders and chest raised by 2% of the canvas height (fully breathed in). The mug rises the same amount.` |
| idle_04.png | `Same as fully breathed in (shoulders and chest raised by 2%), with the head tilted forward very slightly.` |
| idle_05.png | `Shoulders and chest raised by 1% of the canvas height, breathing out.` |
| idle_06.png | `Shoulders and chest at their original height.` |
| idle_07.png | `Shoulders lowered by 1% of the canvas height and knees bent a little more, the whole upper body 1% lower.` |
| idle_08.png | `Shoulders lowered by 0.5% of the canvas height, almost back to the original.` |

## 手順4: 動きのコマ（A・B・Cを添付し、○のコマは旧画像Dも添付）

「旧画像を参考」が ○ のコマは、前回の同じファイルをDとして添付する。✕ のコマは添付しない（ポーズか向きが間違っていたため）。

各攻撃の最後のコマ（combo1_07、combo2_07、combo3_07、combo4_11、charge_12）は**作らない**。基準コマと同じ構えに戻るコマなので、こちらで基準コマをそのまま使う。

### run（8コマ）

| ファイル | 旧画像を参考 | Frame |
| --- | --- | --- |
| run_01.png | ○ | `Frame: run cycle, frame 1 of 8. Contact: left foot strikes the floor ahead toward screen-right, right leg extended behind, body leaning forward. Left arm swings back, the beer mug hugged close to his chest in the right hand so nothing spills.` |
| run_02.png | ○ | `Frame: run cycle, frame 2 of 8. Down: left knee bends to absorb weight, body at its lowest, right leg swinging forward.` |
| run_03.png | ○ | `Frame: run cycle, frame 3 of 8. Passing: right leg passes under the body with the knee high, left leg straight.` |
| run_04.png | ○ | `Frame: run cycle, frame 4 of 8. Up: pushing off the left foot, body at its highest.` |
| run_05.png | ○ | `Frame: run cycle, frame 5 of 8. Contact: right foot strikes the floor ahead, left leg extended behind. Left arm swings forward. Mug still hugged to the chest.` |
| run_06.png | ○ | `Frame: run cycle, frame 6 of 8. Down: right knee bends, body lowest, left leg swinging forward.` |
| run_07.png | ○ | `Frame: run cycle, frame 7 of 8. Passing: left leg passes under the body with the knee high.` |
| run_08.png | ○ | `Frame: run cycle, frame 8 of 8. Up: pushing off the right foot, body highest.` |

### combo1（6コマ作る。07は基準コマ）

| ファイル | 旧画像を参考 | Frame |
| --- | --- | --- |
| combo1_01.png | ○ | `Frame: combo 1, frame 1 of 7. Anticipation: shoulders turn slightly back, the beer mug pulled back beside his right hip.` |
| combo1_02.png | ○ | `Frame: combo 1, frame 2 of 7. Stepping forward with the left foot, the mug starting to move forward at waist height.` |
| combo1_03.png | ○ | `Frame: combo 1, frame 3 of 7. Right arm halfway extended, the mug at chest height moving toward screen-right.` |
| combo1_04.png | ○ | `Frame: combo 1, frame 4 of 7. HIT: right arm fully extended straight toward screen-right, jabbing with the bottom of the beer mug at chest height, shoulder driven forward, weight on the front foot. The mug stays upright enough that the beer does not spill.` |
| combo1_05.png | ○ | `Frame: combo 1, frame 5 of 7. Recoil: arm bends back slightly, a little foam lifting off the top of the beer.` |
| combo1_06.png | ✕ | `Frame: combo 1, frame 6 of 7. Three-quarter view facing screen-right (not frontal). Pulling the mug back toward the chest, feet returning under the body, about to settle into the idle stance of Image C.` |

### combo2（6コマ作る。07は基準コマ）

| ファイル | 旧画像を参考 | Frame |
| --- | --- | --- |
| combo2_01.png | ○ | `Frame: combo 2, frame 1 of 7. Wind-up: torso twisted away from screen-right, the mug drawn back behind his right shoulder.` |
| combo2_02.png | ○ | `Frame: combo 2, frame 2 of 7. Starting the swing: hips turning toward screen-right, the mug at shoulder height behind him.` |
| combo2_03.png | ○ | `Frame: combo 2, frame 3 of 7. Mid-swing: the mug sweeping horizontally at shoulder height, passing beside his head.` |
| combo2_04.png | ○ | `Frame: combo 2, frame 4 of 7. HIT: the mug at the far point of a horizontal hook in front of him toward screen-right, arm curved, torso fully rotated, mug gripped tightly.` |
| combo2_05.png | ○ | `Frame: combo 2, frame 5 of 7. Follow-through: the arm continuing across his body, torso over-rotated.` |
| combo2_06.png | ✕ | `Frame: combo 2, frame 6 of 7. Three-quarter view facing screen-right (not frontal). Unwinding: torso turning back toward screen-right, the mug returning toward the chest, about to settle into the idle stance of Image C.` |

### combo3（6コマ作る。07は基準コマ）

| ファイル | 旧画像を参考 | Frame |
| --- | --- | --- |
| combo3_01.png | ○ | `Frame: combo 3, frame 1 of 7. Deep crouch: knees bent low, the mug pulled back to the right hip, body coiled.` |
| combo3_02.png | ○ | `Frame: combo 3, frame 2 of 7. Big step forward with the left foot, body springing up.` |
| combo3_03.png | ○ | `Frame: combo 3, frame 3 of 7. Lunging forward, right arm extending, the mug at chest height.` |
| combo3_04.png | ○ | `Frame: combo 3, frame 4 of 7. HIT: a long lunge, front knee deeply bent, back leg straight, right arm fully extended driving the mug forward toward screen-right at chest height. More forceful than combo 1. The extended mug stays well inside the canvas.` |
| combo3_05.png | ○ | `Frame: combo 3, frame 5 of 7. Recoil: body still low, arm bending back.` |
| combo3_06.png | ○ | `Frame: combo 3, frame 6 of 7. Rising out of the lunge, pulling the mug back.` |

### combo4（10コマ作る。11は基準コマ）

| ファイル | 旧画像を参考 | Frame |
| --- | --- | --- |
| combo4_01.png | ○ | `Frame: combo 4, frame 1 of 11. Anticipation: knees bending, the mug lowered beside the right thigh.` |
| combo4_02.png | ✕ | `Frame: combo 4, frame 2 of 11. Three-quarter view facing screen-right. Raising the mug: the right arm swinging up in front of his body, the mug at face height and rising, knees straightening, body starting to rise onto the balls of the feet.` |
| combo4_03.png | ○ | `Frame: combo 4, frame 3 of 11. Full wind-up: right arm high above and behind his head, mug upright, back arched, left arm forward for balance. The raised mug stays well inside the canvas with empty space above it (keep the character's size the same as Image C; do not let the mug touch the top edge).` |
| combo4_04.png | ✕ | `Frame: combo 4, frame 4 of 11. Three-quarter view facing screen-right. The very top of the wind-up, held for a beat: up on his toes, the whole body stretched tall, right arm fully raised above and behind his head with the mug upright at its highest point, left arm reaching forward. Same size as Image C; the mug stays inside the canvas.` |
| combo4_05.png | ○ | `Frame: combo 4, frame 5 of 11. Swinging down: the mug coming down in a big arc in front of him.` |
| combo4_06.png | ○ | `Frame: combo 4, frame 6 of 11. HIT: slamming the bottom of the mug onto the floor in front of him toward screen-right, both knees bent deeply, body crouched over the mug, mug gripped and intact. The crouching body is drawn at the same size as Image C (not enlarged).` |
| combo4_07.png | ○ | `Frame: combo 4, frame 7 of 11. Impact hold: same crouch, shoulders shaking slightly, foam lifting off the beer.` |
| combo4_08.png | ✕ | `Frame: combo 4, frame 8 of 11. Three-quarter view facing screen-right. Starting to rise out of the crouch: knees still deeply bent, the mug lifting off the floor in front of him at shin height.` |
| combo4_09.png | ○ | `Frame: combo 4, frame 9 of 11. Half standing, the mug at knee height.` |
| combo4_10.png | ✕ | `Frame: combo 4, frame 10 of 11. Three-quarter view facing screen-right. Almost upright, knees slightly bent, the mug coming up to waist height, about to settle into the idle stance of Image C.` |

### charge（11コマ作る。12は基準コマ）

回転する技なので、05・06・07だけは向きの例外を認める（各行に書いてある）。

| ファイル | 旧画像を参考 | Frame |
| --- | --- | --- |
| charge_01.png | ○ | `Frame: charge attack, frame 1 of 12. Gathering power: feet wide, knees deep, the mug held low and back, shoulders hunched.` |
| charge_02.png | ○ | `Frame: charge attack, frame 2 of 12. Same, coiled tighter, torso twisted away from screen-right.` |
| charge_03.png | ○ | `Frame: charge attack, frame 3 of 12. Maximum coil, the mug behind his back, weight on the back foot.` |
| charge_04.png | ○ | `Frame: charge attack, frame 4 of 12. Release: spinning toward screen-right, the mug swinging out at waist height.` |
| charge_05.png | ○ | `Frame: charge attack, frame 5 of 12. Spin (facing exception: body facing the camera is allowed in this frame), the mug extended to his right side at arm's length.` |
| charge_06.png | ✕ | `Frame: charge attack, frame 6 of 12. Spin (facing exception: seen from directly behind, back toward the camera; only the spiky black hair on the back of his head is visible, the mask hidden). Because we see him from behind, his RIGHT hand is on the SCREEN-RIGHT side: his right arm is extended to the screen-right at arm's length, holding the beer mug by the handle at waist height. His empty left arm is bent close to his body on the screen-left side. The mug must NOT be on the screen-left side.` |
| charge_07.png | ○ | `Frame: charge attack, frame 7 of 12. Spin (facing exception: three-quarter back view turning toward screen-right), the mug sweeping around.` |
| charge_08.png | ○ | `Frame: charge attack, frame 8 of 12. HIT: the end of the spin, three-quarter view facing screen-right, the mug at full arm's length in front of him toward screen-right at waist height, a wide sweeping pose, both feet planted.` |
| charge_09.png | ○ | `Frame: charge attack, frame 9 of 12. Follow-through, body still turning, foam lifting off the beer.` |
| charge_10.png | ✕ | `Frame: charge attack, frame 10 of 12. Three-quarter view facing screen-right (not frontal). Slowing down, knees still wide, the mug coming in toward the chest.` |
| charge_11.png | ✕ | `Frame: charge attack, frame 11 of 12. Three-quarter view facing screen-right (not frontal). Settling, knees straightening, the mug at chest height, about to return to the idle stance of Image C.` |

---

## 受け取ったあと（こちらで行う）

1. 全コマを A・B と照合する（仮面の8項目を1枚ずつ。赤い線は「上下に分かれた4本」かを拡大して確認）
2. 大きさ・足元の位置を測り、基準コマとのずれが2%を超えるコマは作り直しを依頼する
3. 待機ループと各攻撃をつないだ動画を書き出して、ガタつき・向きの跳ねがないか確認してもらう

まだ作っていない動作（musou・dodge・hurt・down・grab・win）も、この第2版の共通ブロックとA・B・Cの添付で作る（各コマの `Frame:` は `asset_prompts.md` のものを使う）。
