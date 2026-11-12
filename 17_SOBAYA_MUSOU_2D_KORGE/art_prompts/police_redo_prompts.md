# 警察官 残り33コマの作り直しプロンプト（コピペ用）

基準コマ `generated_enemies/police/idle_01.png`（2026-11-12 13:46、6つ星で合格）に合わせて、残り33コマを作り直す。前の版は帽章が5つ星なので全部置き換える。

## 使い方

1. 参照画像を毎回この順で3枚添付する
   - A: `04_GAME_ASSETS/musou2d/designs/police_sheet.png`（デザイン画）
   - S: `17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated/idle_01.png`（そば屋の基準コマ）
   - C: `17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated_enemies/police/idle_01.png`（警察官の基準コマ）
2. 「共通ブロック」の後ろに、各コマの指示（```で囲んだ部分）をつなげて1回の生成に使う。idle_02〜06 と dizzy は「編集」の指示なので、共通ブロックの後ろに編集の指示をつなげる
3. `generated_enemies/police/` に上書き保存する。ファイル名は各見出しのとおり
4. 保存できたか、ファイルの更新時刻で確かめる（今日の14時以降になっていればOK）

---

## 共通ブロック（全コマの先頭に付ける）

```
Attached images:
- Image A is the approved design sheet of the city patrol officer (identity: face, cap, badge, uniform, pockets, necktie, belt, gloves, baton, colors). Follow it exactly.
- Image S is a frame of "Sobaya", the hero of this game, used ONLY as a reference for art style and for scale and framing. Do NOT draw Sobaya.
- Image C is the approved anchor frame of the city patrol officer. Match its art style, size, foot position, camera angle and canvas framing exactly.

Draw ONE full-body animation frame of the city patrol officer for a high-end 2D side-scrolling beat-'em-up game.

Art style: identical to Image S — high-quality Japanese anime cel shading, bold clean outlines, 3 tones of shading, key light from the upper left, a cool-violet rim light on the right edge of the silhouette (bluish violet, clearly different from the magenta background).

Canvas and framing (identical for every frame):
- Square canvas the same size as Image S, flat solid magenta background (#FF00FF), no floor, no cast shadow, no gradient.
- The character stands on the same floor line as Image C (the soles at the same height in the canvas, horizontally centered), and is exactly the same size as Image C. Keep this exact size in every frame, even when crouching, lying down or flying; do not enlarge or shrink to fill the canvas.
- Leave empty magenta space all around; nothing touches any edge of the canvas.
- Camera about 20 degrees above eye level.
- Facing: three-quarter view facing screen-RIGHT (we see his front and his right side), unless the frame text explicitly says otherwise.

PRESERVE: every item of Image A, counted — the navy peaked cap with a black visor; ONE cap badge that is a plain gold star with exactly SIX points and no circle around it, exactly as on Image A and Image C (not five points); the navy long-sleeved collared shirt with exactly 2 flapped chest pockets; the near-black navy necktie; the black belt with a silver square buckle and exactly 2 black pouches; white gloves on both hands; navy trousers; black shoes; short black hair and an earnest friendly face.
Tone: comedic slapstick beat-'em-up. No blood, no wounds, no pain or fear; when hit or knocked out he looks dazed and silly.
Do NOT carry over: the sheet's layout, the turnaround panels, close-ups, color swatches, panel borders or the gray background; anything of Sobaya (his mask, mug, clothes or body).
No visual effects, no motion lines, no text, no extra characters. Nothing magenta on the character.
```

---

## idle（5コマ）：C を編集元にする

各コマ、共通ブロックの後ろにこれをつなげ、最後の1行だけ下の表のものに差し替える。

```
Edit the attached anchor frame (Image C). Keep everything identical — the same size, the same foot position, feet, legs, uniform, the six-point cap badge, face, colors, line style and canvas — and change ONLY what is described below. The change is tiny; this is one frame of a looping guarded idle. The black baton stays in his RIGHT white-gloved hand exactly as in Image C.
Change: <下の表の1行>
```

| ファイル | Change: の後ろ |
| --- | --- |
| idle_02.png | `The whole upper body bobs down by 1% of the canvas height, knees bending slightly.` |
| idle_03.png | `The whole upper body bobs down by 2% of the canvas height (the lowest point), knees bent a little more.` |
| idle_04.png | `The whole upper body bobs down by 1% of the canvas height, rising.` |
| idle_05.png | `The upper body at its original height, the weight shifted slightly onto the front foot, the guarding left hand a little higher.` |
| idle_06.png | `Almost the original pose, the left hand returning to its original height.` |

---

## walk（8コマ・ループ）

**walk_01.png**
```
Frame: jogging approach, frame 1 of 8. Contact: left foot strikes the floor ahead toward screen-right, right leg behind, arms swinging. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**walk_02.png**
```
Frame: jogging approach, frame 2 of 8. Down: left knee bends, body lowest. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**walk_03.png**
```
Frame: jogging approach, frame 3 of 8. Passing: right leg passes under the body. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**walk_04.png**
```
Frame: jogging approach, frame 4 of 8. Up: pushing off the left foot, body highest. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**walk_05.png**
```
Frame: jogging approach, frame 5 of 8. Contact: right foot strikes the floor ahead, left leg behind. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**walk_06.png**
```
Frame: jogging approach, frame 6 of 8. Down: right knee bends, body lowest. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**walk_07.png**
```
Frame: jogging approach, frame 7 of 8. Passing: left leg passes under the body. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**walk_08.png**
```
Frame: jogging approach, frame 8 of 8. Up: pushing off the right foot, body highest. The baton is held in the right hand, swinging with the arm. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```

---

## attack（警棒の振り下ろし・6コマ。attack_07 は作らない）

attack_07.png は、基準コマ idle_01.png をそのままコピーして置く。

**attack_01.png**
```
Frame: attack, frame 1 of 7. Wind-up: the baton raised high above and behind his head in the right hand, the left hand forward for balance. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**attack_02.png**
```
Frame: attack, frame 2 of 7. Stepping in with the front foot, the baton starting to come down. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**attack_03.png**
```
Frame: attack, frame 3 of 7. The baton swinging down in front of him at head height. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**attack_04.png**
```
Frame: attack, frame 4 of 7. HIT: the baton swung down in front of him toward screen-right at chest height, arm extended, weight on the front foot. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**attack_05.png**
```
Frame: attack, frame 5 of 7. Follow-through: the baton continuing down to waist height. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**attack_06.png**
```
Frame: attack, frame 6 of 7. Pulling the baton back up toward the ready stance. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```

---

## hit（のけぞり・3コマ）

**hit_01.png**
```
Frame: flinch, frame 1 of 3. Knocked back by a hit from screen-right: head snapped back, body bent backward toward screen-left, arms flung out, a comical shocked face (eyes wide, mouth open). Cap still on. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**hit_02.png**
```
Frame: flinch, frame 2 of 3. Stumbling one step back toward screen-left, knees bending. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```
**hit_03.png**
```
Frame: flinch, frame 3 of 3. Recovering, leaning forward again toward the guarded stance. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```

---

## fly（吹っ飛び・6コマ）

吹っ飛ぶ高さはゲーム側で動かすので、絵はその場で体の傾きだけを描く。

**fly_01.png**
```
Frame: knocked flying, frame 1 of 6. Launched backward (away from screen-right), body arched backward, arms and legs flailing, cap tilting off the head, a silly dazed face. The baton flies out of his right hand. The lowest point of his body is on the floor line.
```
**fly_02.png**
```
Frame: knocked flying, frame 2 of 6. Body tilting further back, almost diagonal, limbs flailing. Lowest point on the floor line. He has dropped his baton; it is not in the picture.
```
**fly_03.png**
```
Frame: knocked flying, frame 3 of 6. Body horizontal in the air, lying flat on his back, limbs spread like a starfish, cap held on by luck. Lowest point on the floor line. He has dropped his baton; it is not in the picture.
```
**fly_04.png**
```
Frame: knocked flying, frame 4 of 6. Falling back first, body horizontal, limbs flopping. Lowest point on the floor line. He has dropped his baton; it is not in the picture.
```
**fly_05.png**
```
Frame: knocked flying, frame 5 of 6. Hitting the floor flat on the back with a small bounce, limbs up. He has dropped his baton; it is not in the picture.
```
**fly_06.png**
```
Frame: knocked flying, frame 6 of 6. Lying flat on his back on the floor, head toward screen-left, arms and legs spread, dazed (this is the KO pose). He has dropped his baton; it is not in the picture.
```

---

## dizzy（目を回す・4コマ・ループ）：fly_06 を編集元にする

作り直した fly_06.png を添付して、共通ブロックの後ろにこれをつなげ、最後の1行だけ下の表のものに差し替える。

```
Edit the attached frame (the new fly_06.png). Keep everything identical — the same pose, position, size, uniform, the six-point cap badge, colors, line style and canvas — and change ONLY what is described below. He has dropped his baton; it is not in the picture.
Change: <下の表の1行>
```

| ファイル | Change: の後ろ |
| --- | --- |
| dizzy_01.png | `Swirly cartoon spiral eyes, the tongue slightly out, harmless and funny. Change nothing else.` |
| dizzy_02.png | `Swirly eyes; the head wobbles slightly toward the camera. Change nothing else.` |
| dizzy_03.png | `Swirly eyes; one hand twitches up a little. Change nothing else.` |
| dizzy_04.png | `Swirly eyes; the head wobbles slightly away from the camera. Change nothing else.` |

---

## 作るファイルの一覧（33コマ）

| 動作 | ファイル | 作り方 |
| --- | --- | --- |
| idle | idle_02〜06（5） | C を編集 |
| walk | walk_01〜08（8） | 生成 |
| attack | attack_01〜06（6）＋ attack_07 | 生成。07 は idle_01 のコピー |
| hit | hit_01〜03（3） | 生成 |
| fly | fly_01〜06（6） | 生成 |
| dizzy | dizzy_01〜04（4） | 新しい fly_06 を編集 |

---

## 照合の結果（2026-11-12）と追加の作り直し2コマ

33コマのうち31コマ合格（帽章は全コマ6つ星、警棒は全コマ右手）。次の2コマだけ作り直す。共通ブロックの後ろにつなげて使う。

**attack_03.png**（不合格: 白い振りの軌跡が描かれている。指示は「効果なし」）
```
Frame: attack, frame 3 of 7. The baton swinging down in front of him at head height. The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
Absolutely NO swoosh, NO motion trail, NO speed lines, NO white arcs anywhere: only the character on the flat magenta background.
```

**fly_05.png**（不合格: 空中に浮いている。床に落ちた瞬間のコマなので、体が床の線に着いていないといけない）
```
Frame: knocked flying, frame 5 of 6. The moment he lands: his back and hips are flat ON the floor line (the same height as the soles in Image C), a small bounce lifting only his arms and legs up, a dazed face. His body must touch the floor line; he is NOT floating in the air. He has dropped his baton; it is not in the picture.
```
