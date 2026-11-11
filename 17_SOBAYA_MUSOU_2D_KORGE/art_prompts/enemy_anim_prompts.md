# 敵のアニメ プロンプト（警備員・警備隊長）

縦切り試作に必要な、警備員34コマと警備隊長40コマ。そば屋と同じ進め方で、**まず基準コマを1枚作って確定し、残りはその基準コマに合わせる**。

## 添付する参照画像（毎回この順番）

| 記号 | ファイル | 何のために使うか |
| --- | --- | --- |
| A | `04_GAME_ASSETS/musou2d/designs/guard_sheet.png` または `captain_sheet.png` | 敵の同定（正典。チェックリストは同じフォルダの README.md） |
| S | `art_prompts/generated/idle_01.png`（そば屋の基準コマ） | 絵柄と、そば屋との身長の比・キャンバスの縮尺をそろえる。**そば屋は描かせない** |
| C | `art_prompts/generated_enemies/<敵>/idle_01.png`（手順1で作る基準コマ） | 大きさ・足元・絵柄をそろえる（手順2以降） |

## 共通ブロック（全コマの先頭に付ける。`<NAME>` と `<HEIGHT>` を置き換える）

| 敵 | `<NAME>` | `<HEIGHT>`（そば屋に対する身長） |
| --- | --- | --- |
| 警備員 | `the brewery security guard` | `0.95` |
| 警備隊長 | `the brewery security captain` | `1.0` |

```
Attached images:
- Image A is the approved design sheet of <NAME> (identity: face, cap, badge, uniform, buttons, pockets, gloves or bare hands, colors). Follow it exactly.
- Image S is a frame of "Sobaya", the hero of this game, used ONLY as a reference for art style and for scale and framing. Do NOT draw Sobaya.
- Image C (when attached) is the approved anchor frame of <NAME>. Match its art style, size, foot position, camera angle and canvas framing exactly.

Draw ONE full-body animation frame of <NAME> for a high-end 2D side-scrolling beat-'em-up game.

Art style: identical to Image S — high-quality Japanese anime cel shading, bold clean outlines, 3 tones of shading, key light from the upper left, a cool-violet rim light on the right edge of the silhouette (bluish violet, clearly different from the magenta background).

Canvas and framing (identical for every frame):
- Square canvas the same size as Image S, flat solid magenta background (#FF00FF), no floor, no cast shadow, no gradient.
- The character stands on the same floor line as Sobaya in Image S (the soles at the same height in the canvas, horizontally centered), and is <HEIGHT> times Sobaya's height in Image S (measured from the soles to the top of the cap). Keep this exact size in every frame, even when crouching, lying down or flying; do not enlarge or shrink to fill the canvas.
- Leave empty magenta space all around; nothing touches any edge of the canvas.
- Camera about 20 degrees above eye level.
- Facing: three-quarter view facing screen-RIGHT (we see his front and his right side), unless the frame text explicitly says otherwise.

PRESERVE: every item of Image A, counted — the cap and its badge, the badge shape and color, the shirt color and sleeve length, the exact number of front buttons and chest pockets, the epaulettes, the belt buckle, gloves or bare hands, trousers, shoes, hair and face. (The checklist is the README next to Image A.)
Tone: comedic slapstick beat-'em-up. No blood, no wounds, no pain or fear; when hit or knocked out he looks dazed and silly.
Do NOT carry over: the sheet's layout, the turnaround panels, close-ups, color swatches, panel borders or the gray background; anything of Sobaya (his mask, mug, clothes or body).
No visual effects, no motion lines, no text, no extra characters. Nothing magenta on the character.
```

各コマは、共通ブロックの後ろに `Frame:` を足す。保存先は `art_prompts/generated_enemies/guard/` と `art_prompts/generated_enemies/captain/`、ファイル名は `<動作>_<2桁>.png`。

## 手順1: 基準コマ（A・S を添付）

**idle_01.png**（警備員・警備隊長それぞれ）
```
Frame: guarded idle, frame 1 of 6. Three-quarter view facing screen-right. Fighting stance: feet a little wider than shoulder-width, knees slightly bent, both fists raised loosely in front of the chest, watching the opponent on the screen-right side. (Guard: a bit nervous. Captain: chest out, confident.)
```

届いたらこちらで照合して確定する。以降は A・S・C を添付する。

## 手順2: idle の2〜6コマ目（C を編集元にする）

```
Edit the attached anchor frame (Image C). Keep everything identical — the same size, the same foot position, feet, legs, uniform, face, colors, line style and canvas — and change ONLY what is described below. The change is tiny; this is one frame of a looping guarded idle.
```

| ファイル | 変える部分 |
| --- | --- |
| idle_02.png | `The whole upper body bobs down by 1% of the canvas height, knees bending slightly.` |
| idle_03.png | `The whole upper body bobs down by 2% of the canvas height (the lowest point), knees bent a little more.` |
| idle_04.png | `The whole upper body bobs down by 1% of the canvas height, rising.` |
| idle_05.png | `The upper body at its original height, the weight shifted slightly onto the front foot, fists a little higher.` |
| idle_06.png | `Almost the original pose, fists returning to their original height.` |

## 手順3: 動きのコマ（A・S・C を添付）

### walk（小走りで近づく・8コマ・ループ）

```
Frame: jogging approach, frame 1 of 8. Contact: left foot strikes the floor ahead toward screen-right, right leg behind, arms swinging, fists loosely closed.
Frame: jogging approach, frame 2 of 8. Down: left knee bends, body lowest.
Frame: jogging approach, frame 3 of 8. Passing: right leg passes under the body.
Frame: jogging approach, frame 4 of 8. Up: pushing off the left foot, body highest.
Frame: jogging approach, frame 5 of 8. Contact: right foot strikes the floor ahead, left leg behind.
Frame: jogging approach, frame 6 of 8. Down: right knee bends, body lowest.
Frame: jogging approach, frame 7 of 8. Passing: left leg passes under the body.
Frame: jogging approach, frame 8 of 8. Up: pushing off the right foot, body highest.
```

### attack（攻撃・7コマ・当たりは4コマ目）

警備員はジャブ、警備隊長は大きなフック。各行の後ろに攻撃の中身を付ける。
- 警備員: `Attack type: a quick straight jab with the left fist toward screen-right at chest height.`
- 警備隊長: `Attack type: a big looping right hook punch, swinging from far back around to the front toward screen-right at face height.`

```
Frame: attack, frame 1 of 7. Wind-up: the striking fist drawn back, shoulders turned away from screen-right.
Frame: attack, frame 2 of 7. Stepping in with the front foot, the fist starting forward.
Frame: attack, frame 3 of 7. Mid-motion, the arm halfway to full extension.
Frame: attack, frame 4 of 7. HIT: the attack at full extension toward screen-right, weight on the front foot.
Frame: attack, frame 5 of 7. Follow-through, the arm continuing slightly past.
Frame: attack, frame 6 of 7. Pulling the arm back.
```
7コマ目は作らない（基準コマ idle_01 を使う）。

### hit（のけぞり・3コマ）

```
Frame: flinch, frame 1 of 3. Knocked back by a hit from screen-right: head snapped back, body bent backward toward screen-left, arms flung out, a comical shocked face (eyes wide, mouth open). Cap still on.
Frame: flinch, frame 2 of 3. Stumbling one step back toward screen-left, knees bending.
Frame: flinch, frame 3 of 3. Recovering, leaning forward again toward the guarded stance.
```

### fly（吹っ飛び・6コマ）

吹っ飛びの高さはゲーム側で動かすので、絵は**その場で**体の傾きだけを描く（足元の位置はC と同じ床の線を基準に、体の一番下が床の線に来る）。

```
Frame: knocked flying, frame 1 of 6. Launched backward (away from screen-right), body arched backward, arms and legs flailing, cap tilting off the head, a silly dazed face. The lowest point of his body is on the floor line.
Frame: knocked flying, frame 2 of 6. Body tilting further back, almost diagonal, limbs flailing. Lowest point on the floor line.
Frame: knocked flying, frame 3 of 6. Body horizontal in the air, lying flat on his back, limbs spread like a starfish, cap held on by luck. Lowest point on the floor line.
Frame: knocked flying, frame 4 of 6. Falling back first, body horizontal, limbs flopping. Lowest point on the floor line.
Frame: knocked flying, frame 5 of 6. Hitting the floor flat on the back with a small bounce, limbs up.
Frame: knocked flying, frame 6 of 6. Lying flat on his back on the floor, head toward screen-left, arms and legs spread, dazed (this is the KO pose).
```

### dizzy（目を回す・4コマ・ループ）

fly_06 を編集元にする（姿勢・位置・大きさを変えない）。

| ファイル | 変える部分 |
| --- | --- |
| dizzy_01.png | `Swirly cartoon spiral eyes, the tongue slightly out, harmless and funny. Change nothing else.` |
| dizzy_02.png | `Swirly eyes; the head wobbles slightly toward the camera. Change nothing else.` |
| dizzy_03.png | `Swirly eyes; one hand twitches up a little. Change nothing else.` |
| dizzy_04.png | `Swirly eyes; the head wobbles slightly away from the camera. Change nothing else.` |

### intro（登場・6コマ）※警備隊長のみ

```
Frame: entrance, frame 1 of 6. Striding in from screen-left confidently, chest out, arms swinging.
Frame: entrance, frame 2 of 6. Stopping with a firm stomp, feet planted wide.
Frame: entrance, frame 3 of 6. Adjusting the cap brim with the right gloved hand, smug.
Frame: entrance, frame 4 of 6. Pointing dramatically toward screen-right with the right index finger, the left fist on the hip, shouting (mouth open, mustache bristling).
Frame: entrance, frame 5 of 6. Holding the point, a smug grin under the mustache.
Frame: entrance, frame 6 of 6. Settling into the guarded idle stance of Image C.
```

## コマ数のまとめ

| 動作 | 警備員 | 警備隊長 | 作り方 |
| --- | --- | --- | --- |
| idle | 6 | 6 | 01は生成、02〜06は編集 |
| walk | 8 | 8 | 生成 |
| attack | 7 | 7 | 01〜06は生成、07は基準コマ流用 |
| hit | 3 | 3 | 生成 |
| fly | 6 | 6 | 生成 |
| dizzy | 4 | 4 | fly_06 を編集 |
| intro | — | 6 | 生成 |
| **合計** | **34** | **40** | |

## 受け取ったあと（こちらで行う）

1. 全コマを A のチェックリスト（designs/README.md）で1項目ずつ照合する（帽章・ボタン数・ポケット・手袋・バックル）
2. そば屋の基準コマと並べて、身長の比（警備員0.95、隊長1.0）・足元・絵柄を確認する
3. 合格したら PackSprites.java でアトラスにまとめ、ゲームの敵（今のマネキン）を差し替えて、動く画面と動画を確認してもらう
