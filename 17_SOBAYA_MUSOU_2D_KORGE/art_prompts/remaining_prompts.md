# そば屋スプライト 残り6動作のプロンプト（第2版）

無双乱舞・回避・被ダメージ・ひと休み・ゴール長押し・勝利の計48コマ。そのうち**生成は37枚、編集は9枚、基準コマの流用は2枚**（こちらで行う）。

## 使い方（第2版と同じ）

- 各コマの先頭に、`regen_prompts.md` の**共通ブロック（第2版）**をそのまま付ける
- 参照画像は毎回 **A**（キャラクターシート）・**B**（仮面デザイン）・**C**（基準コマ `art_prompts/generated/idle_01.png`）の順に添付する。旧画像Dは今回は無い
- 「編集」と書いたコマは、表に書いた画像を編集元にして、`regen_prompts.md` の手順3と同じ考え方で指示した部分だけを変える
- 「流用」と書いたコマは作らない（こちらで基準コマをそのまま使う）

## ジョッキを持つ右手が画面のどちら側に来るか（向きの例外があるコマで必ず確認）

前回の charge_06 は、後ろ姿でジョッキが左手に移って不合格になった。向きごとの右手の位置は次のとおり。各コマの指示にも書いてある。

| 体の向き | 右手（ジョッキ）が見える位置 |
| --- | --- |
| 右向きの斜め（通常） | 体の手前（カメラ側） |
| 正面（カメラを向く） | 画面の左側 |
| 左向き | 体の向こう側（体に隠れ気味） |
| 後ろ姿（背中をカメラに向ける） | 画面の右側 |

---

## musou（無双乱舞・10コマ・ループ・生成10）

その場で1回転し続ける。1コマで36度ずつ、「右向き → カメラ側 → 左向き → 背中側」の順に回る。右腕を伸ばしてジョッキを体の外側へ振り回すので、ジョッキは毎コマ違う位置に来る。全コマ同じ大きさ・同じ足元の位置で、回転の中心は体の中心。

| ファイル | 作り方 | Frame |
| --- | --- | --- |
| musou_01.png | 生成 | `Frame: musou spin loop, frame 1 of 10. Spinning fast on the spot, knees bent, fierce and joyful energy. Body yaw 0 degrees: three-quarter view facing screen-right. His right arm is extended outward at arm's length at waist height, holding the beer mug, which is on the camera side, in front of his body.` |
| musou_02.png | 生成 | `Frame: musou spin loop, frame 2 of 10. Same spin, body yaw 36 degrees: turning from screen-right toward the camera. The extended right arm and the mug swing toward the screen-left, still in front of his body.` |
| musou_03.png | 生成 | `Frame: musou spin loop, frame 3 of 10. Body yaw 72 degrees: almost facing the camera (facing exception allowed). The extended right arm holds the mug out to the screen-left side at arm's length.` |
| musou_04.png | 生成 | `Frame: musou spin loop, frame 4 of 10. Body yaw 108 degrees: past facing the camera, turning toward screen-left (facing exception allowed). The extended right arm holds the mug far out to the screen-left side, starting to swing behind him.` |
| musou_05.png | 生成 | `Frame: musou spin loop, frame 5 of 10. Body yaw 144 degrees: three-quarter view facing screen-left (facing exception allowed). The extended right arm is swinging behind his body; the mug is partly hidden behind his back on the far side.` |
| musou_06.png | 生成 | `Frame: musou spin loop, frame 6 of 10. Body yaw 180 degrees: profile facing screen-left (facing exception allowed). The extended right arm and the mug are on the far side, behind his body, mostly hidden; only the mug's rim peeks out.` |
| musou_07.png | 生成 | `Frame: musou spin loop, frame 7 of 10. Body yaw 216 degrees: three-quarter back view turning away from the camera (facing exception allowed; the mask is mostly hidden, the spiky hair on the back of his head visible). The extended right arm comes out on the screen-right side behind him, holding the mug.` |
| musou_08.png | 生成 | `Frame: musou spin loop, frame 8 of 10. Body yaw 252 degrees: almost directly from behind (facing exception allowed; mask hidden, hair visible). Because we see him from behind, his right arm is on the SCREEN-RIGHT side, extended at arm's length holding the mug. The mug is NOT on the screen-left side.` |
| musou_09.png | 生成 | `Frame: musou spin loop, frame 9 of 10. Body yaw 288 degrees: three-quarter back view turning toward screen-right (facing exception allowed). The extended right arm and the mug on the screen-right side, starting to swing toward the camera.` |
| musou_10.png | 生成 | `Frame: musou spin loop, frame 10 of 10. Body yaw 324 degrees: almost back to three-quarter facing screen-right. The extended right arm and the mug swinging around to the camera side, in front of the body on the right.` |

## dodge（回避・前転・8コマ・生成7、流用1）

画面右へ前転する。ジョッキは右手で頭の上に掲げて、中身をこぼさない。丸まった姿勢でも体の大きさは基準コマCと同じ（画面いっぱいに大きくしない）。

| ファイル | 作り方 | Frame |
| --- | --- | --- |
| dodge_01.png | 生成 | `Frame: forward roll, frame 1 of 8. Three-quarter view facing screen-right. Ducking: knees bent, head lowered, the beer mug raised above his head in the right hand to protect it, foam level.` |
| dodge_02.png | 生成 | `Frame: forward roll, frame 2 of 8. Diving forward toward screen-right, the left hand reaching for the floor, the mug held up high and level in the right hand.` |
| dodge_03.png | 生成 | `Frame: forward roll, frame 3 of 8. His left shoulder touching the floor, body curled into a ball, legs up, the mug held up high and level in the right hand. Same body size as Image C.` |
| dodge_04.png | 生成 | `Frame: forward roll, frame 4 of 8. Upside down in the middle of the roll, curled into a tight ball, the right arm stretched up keeping the mug level above the floor. Same body size as Image C.` |
| dodge_05.png | 生成 | `Frame: forward roll, frame 5 of 8. Back rolling across the floor, legs coming down toward screen-right, the mug still level in the raised right hand.` |
| dodge_06.png | 生成 | `Frame: forward roll, frame 6 of 8. Three-quarter view facing screen-right. Feet landing, crouched low, the mug coming down to chest height in the right hand.` |
| dodge_07.png | 生成 | `Frame: forward roll, frame 7 of 8. Three-quarter view facing screen-right. Rising from the crouch, knees still bent, the mug at chest height.` |
| dodge_08.png | 流用 | 基準コマ（idle_01）をそのまま使う |

## hurt（被ダメージ・4コマ・生成3、流用1）

正面（画面右）から殴られてのけぞる。仮面なので表情は無く、体の動きで表す。痛がる表現にしない（コミカルに）。

| ファイル | 作り方 | Frame |
| --- | --- | --- |
| hurt_01.png | 生成 | `Frame: hit reaction, frame 1 of 4. Three-quarter view facing screen-right. Jolted by a hit from screen-right: upper body knocked back toward screen-left, head tilted back, the left arm flung out to the side. The mug held safely in the right hand, tilted but not spilling. Comical, not painful.` |
| hurt_02.png | 生成 | `Frame: hit reaction, frame 2 of 4. Three-quarter view facing screen-right. Stumbling back one step toward screen-left, knees buckling slightly, the mug held close to the chest.` |
| hurt_03.png | 生成 | `Frame: hit reaction, frame 3 of 4. Three-quarter view facing screen-right. Recovering balance, leaning forward again, feet returning under the body.` |
| hurt_04.png | 流用 | 基準コマ（idle_01）をそのまま使う |

## down（ひと休み・8コマ・最後で止める・生成4、編集4）

体力が尽きて座り込み、ジョッキをひと口飲んで満足そうに落ち着く。暗くしない、苦しそうにしない。座っても頭や体の大きさは基準コマCと同じ（座ったぶん背が低くなるだけ）。

down_04 ができたら、down_05〜08 は down_04 を編集元にして腕と頭だけを動かす（座り方・脚・体の大きさ・位置を変えない）。

| ファイル | 作り方 | Frame |
| --- | --- | --- |
| down_01.png | 生成 | `Frame: tired sit-down, frame 1 of 8. Three-quarter view facing screen-right. Swaying on his feet, exhausted, shoulders drooping, the mug held loosely at waist height in the right hand.` |
| down_02.png | 生成 | `Frame: tired sit-down, frame 2 of 8. Three-quarter view facing screen-right. Knees giving way, starting to sit down, the mug held level.` |
| down_03.png | 生成 | `Frame: tired sit-down, frame 3 of 8. Three-quarter view facing screen-right. Plopping down onto the floor into a cross-legged sit, the mug held up safely.` |
| down_04.png | 生成 | `Frame: tired sit-down, frame 4 of 8. Three-quarter view facing screen-right. Sitting cross-legged on the floor, slumped forward, the mug resting on his right knee in the right hand. Same head and body size as Image C; he is only shorter because he is sitting.` |
| down_05.png | 編集（down_04） | `Raise the right hand so the mug is in front of his chest, on its way up to the mask. Change nothing else.` |
| down_06.png | 編集（down_04） | `Raise the right hand so the rim of the mug touches the mask's mouth slit, as if taking a calm sip; tilt the head back very slightly. Change nothing else.` |
| down_07.png | 編集（down_04） | `Lower the right hand so the mug is in front of his chest again; straighten the back a little into a relaxed posture. Change nothing else.` |
| down_08.png | 編集（down_04） | `Final held pose: back upright and relaxed, shoulders loose, the mug resting on his right knee, a content and cheerful posture. Change nothing else.` |

## grab（ゴールで長押し・6コマ・ループ・生成1、編集5）

ゴール（ビールのタンク・本社の入口・立ち飲み処）で F を長押ししている間の動き。蛇口やタンクはゲーム側で描くので、絵には描かない。grab_02〜06 は grab_01 を編集元にして、指示した部分だけを動かす。

| ファイル | 作り方 | Frame |
| --- | --- | --- |
| grab_01.png | 生成 | `Frame: filling the mug, frame 1 of 6. Three-quarter view facing screen-right. Standing, leaning slightly forward, holding the beer mug out in the right hand at chest height in front of him (under an unseen tap), the left hand raised in front at head height gripping an unseen tap handle. No tap, tank or machine is drawn. The mug is half full.` |
| grab_02.png | 編集（grab_01） | `The left hand pulls the unseen tap handle down by 3% of the canvas height. Change nothing else.` |
| grab_03.png | 編集（grab_01） | `Same as the handle pulled down; the head tilts down slightly to watch the mug, the beer in the mug is three-quarters full. Change nothing else.` |
| grab_04.png | 編集（grab_01） | `Same as the handle pulled down and the head tilted; the mug is almost full with a rising white foam head. Change nothing else.` |
| grab_05.png | 編集（grab_01） | `The left hand releases the handle back to its original height; the mug is full with a thick foam head. Change nothing else.` |
| grab_06.png | 編集（grab_01） | `The mug, full with a foam head, is pulled back toward the chest by 2% of the canvas width; the head is upright again. Change nothing else.` |

## win（勝利・乾杯と小躍り・12コマ・ループ・生成12）

ジョッキを掲げて喜び、小さく跳ねて揺れ、カメラに向かって乾杯する。正面を向くコマ（06〜08）は向きの例外を認める。そのとき右手（ジョッキ）は画面の左側。

| ファイル | 作り方 | Frame |
| --- | --- | --- |
| win_01.png | 生成 | `Frame: victory dance, frame 1 of 12. Three-quarter view facing screen-right. Raising the beer mug high above his head in the right hand in celebration, foam intact, the left fist on his hip, proud posture. The mug stays inside the canvas with space above it.` |
| win_02.png | 生成 | `Frame: victory dance, frame 2 of 12. Same pose as frame 1 with a small hop: both feet 3% of the canvas height off the floor line.` |
| win_03.png | 生成 | `Frame: victory dance, frame 3 of 12. Landing from the hop, knees bent, the mug still raised high in the right hand.` |
| win_04.png | 生成 | `Frame: victory dance, frame 4 of 12. Three-quarter view facing screen-right. A sway step toward screen-left, hips swinging, the mug raised at head height in the right hand.` |
| win_05.png | 生成 | `Frame: victory dance, frame 5 of 12. Three-quarter view facing screen-right. A sway step back toward screen-right, hips swinging the other way, the mug at head height.` |
| win_06.png | 生成 | `Frame: victory dance, frame 6 of 12. Facing exception: turned toward the camera. Toasting toward the viewer with the mug held out at head height. Because he faces the camera, his right hand and the mug are on the SCREEN-LEFT side.` |
| win_07.png | 生成 | `Frame: victory dance, frame 7 of 12. Facing exception: facing the camera. Bringing the mug to the mask's mouth slit as if to drink; the right hand and mug on the screen-left side of his face.` |
| win_08.png | 生成 | `Frame: victory dance, frame 8 of 12. Facing exception: facing the camera. Lowering the mug to chest height with a satisfied nod; the right hand and mug on the screen-left side.` |
| win_09.png | 生成 | `Frame: victory dance, frame 9 of 12. Three-quarter view facing screen-right again. Raising the mug high above his head in the right hand.` |
| win_10.png | 生成 | `Frame: victory dance, frame 10 of 12. Same as frame 9 with a small hop: both feet 3% of the canvas height off the floor line.` |
| win_11.png | 生成 | `Frame: victory dance, frame 11 of 12. Landing with a little sway, knees bent, the mug raised.` |
| win_12.png | 生成 | `Frame: victory dance, frame 12 of 12. Three-quarter view facing screen-right. Almost back to frame 1: the mug raised high, the left fist moving back to the hip.` |

---

## 受け取ったあと（こちらで行う）

1. 全コマを A・B と照合する（仮面の8項目。赤い線は等倍で拡大して確認）
2. 向きの例外があるコマは、上の表どおりにジョッキが右手にあるかを1枚ずつ確認する
3. 大きさ・足元の位置を測る。基準コマとのずれが2%を超えるコマは作り直しを依頼する（座る・転がる・跳ねるコマは、頭の大きさで比べる）
4. 動作ごとにつないだ動画を書き出して、ガタつき・向きの跳ねがないか確認してもらう

---

## 第1回の結果と作り直し（2026-11-11）

48枚中42枚が合格。仮面（赤い線4本・額の点・鼻・口）は全コマ合格。足元が床の線（y=1238）より浮いているコマ（回避・ひと休み・被ダメージ・勝利の着地など）は、床に触れている点をこちらで床の線に合わせて直すので作り直し不要。ジョッキの空いた部分からマゼンタが透けて紫に見える箇所（grab_01・02 など）も、こちらで色を抜いて直す。

作り直すのは次の6枚（いずれも A・B・C を添付、旧画像は添付しない）。charge_06 は `regen_prompts.md` の直した指示で別途作る。

| ファイル | 不合格の理由 | Frame（共通ブロック第2版の後ろに付ける） |
| --- | --- | --- |
| down_01.png | 立ってふらつくはずが、空気椅子のように腰を落としている | `Frame: tired sit-down, frame 1 of 8. Three-quarter view facing screen-right. STANDING upright on both feet with straight legs (not sitting, not squatting, knees only very slightly bent), swaying with exhaustion: upper body leaning a little to one side, shoulders drooping, head hanging slightly, the mug held loosely at waist height in the right hand. Same size and foot position as Image C.` |
| grab_05.png | 注ぐ姿勢でなく、待機の構えになっている | 編集（grab_01 を編集元）: `Keep the leaning-forward filling pose of the source image exactly. The left hand lets go of the unseen tap handle and moves back up to its original height in the air, still raised in front at head height and open. The mug in the right hand is full with a thick white foam head and stays held out in front at chest height. Do NOT return to the idle stance. Change nothing else.` |
| musou_04.png | 右向きに戻っていて、回転が逆向きに見える | `Frame: musou spin loop, frame 4 of 10. Facing exception. Body yaw 108 degrees: the body is almost facing the camera, just starting to turn toward screen-LEFT (his mask looks at the camera, very slightly toward screen-left; he is NOT facing screen-right). His right arm is extended far out to the SCREEN-LEFT side at shoulder height holding the mug, starting to swing back behind him.` |
| musou_05.png | 回り過ぎて背中が見えている（musou_06 より先まで回っている） | `Frame: musou spin loop, frame 5 of 10. Facing exception. Body yaw 144 degrees: a three-quarter FRONT view facing screen-left — we see his chest, his face mask and his left side; we do NOT see his back. His right arm and the mug have swung behind his body on the far side, so the mug is mostly hidden behind his back; his empty left arm is on the camera side.` |
| win_02.png | 1コマ目と同じ姿勢のはずが、ジョッキを胸の高さに下ろしている | `Frame: victory dance, frame 2 of 12. Three-quarter view facing screen-right. Exactly the pose of frame 1 — the beer mug raised high above his head in the right hand, the left fist on his hip — with a small hop: both feet 3% of the canvas height above the floor line. The mug stays raised high above his head and inside the canvas.` |
| win_11.png | ジョッキを掲げたまま着地するはずが、胸の高さに下ろしている | `Frame: victory dance, frame 11 of 12. Three-quarter view facing screen-right. Landing from the hop with a little sway, knees bent, both feet on the floor line, the beer mug still raised high above his head in the right hand, the left fist near the hip.` |
