# そば屋スプライト 追加修正プロンプト（7枚）

2026-11-11 時点で `generated/` のこの7枚はまだ差し替わっていない（ファイルの更新時刻・中身とも前回の確認時のまま）。7枚とも作り直しが必要。

## 共通の手順

1. 各プロンプトは「共通ブロック（第2版）」＋その下の `Frame:` 行で1つ。共通ブロックは `regen_prompts.md` の「共通ブロック（第2版。全コマの先頭に付ける）」を一字一句そのまま使う
2. 参照画像は A（`02_CHARACTERS/Sobaya_sheet.png`）・B（`04_GAME_ASSETS/voxel/model_source/textures/sobaya_mask_design_source.png`）・C（`art_prompts/generated/idle_01.png`）の順に添付する。旧画像は添付しない
3. grab_05 だけは「編集」。`generated/grab_01.png` を編集元にする（共通ブロックは付けず、下の編集文だけを使う）
4. **同じファイル名で `art_prompts/generated/` に上書き保存する**（別名・別フォルダだと検証の対象から漏れる）

## 1. charge_06.png（後ろ姿でジョッキが左手に移っていた）

```
Frame: charge attack, frame 6 of 12. Spin (facing exception: seen from directly behind, back toward the camera; only the spiky black hair on the back of his head is visible, the mask hidden). Because we see him from behind, his RIGHT hand is on the SCREEN-RIGHT side: his right arm is extended to the screen-right at arm's length, holding the beer mug by the handle at waist height. His empty left arm is bent close to his body on the screen-left side. The mug must NOT be on the screen-left side.
```

## 2. down_01.png（立ってふらつくはずが、空気椅子のように腰を落としていた）

```
Frame: tired sit-down, frame 1 of 8. Three-quarter view facing screen-right. STANDING upright on both feet with straight legs (not sitting, not squatting, knees only very slightly bent), swaying with exhaustion: upper body leaning a little to one side, shoulders drooping, head hanging slightly, the mug held loosely at waist height in the right hand. Same size and foot position as Image C.
```

## 3. grab_05.png（注ぐ姿勢でなく、待機の構えに戻っていた）

編集（編集元: `generated/grab_01.png`）:
```
Edit the attached source image (grab_01). Keep the leaning-forward filling pose of the source image exactly — the same size, the same foot position, the same legs, torso, head, mask, hair, colors, line style and canvas. The left hand lets go of the unseen tap handle: it stays raised in front at head height, open, a few centimeters away from where it gripped. The mug in the right hand is full with a thick white foam head and stays held out in front at chest height exactly where it is in the source. Do NOT return to the idle stance. Do NOT bring the mug to the chest. Change nothing else.
```

## 4. musou_04.png（右向きに戻っていて、回転が逆向きに見えた）

```
Frame: musou spin loop, frame 4 of 10. Facing exception. Body yaw 108 degrees: the body is almost facing the camera, just starting to turn toward screen-LEFT (his mask looks at the camera, very slightly toward screen-left; he is NOT facing screen-right). His right arm is extended far out to the SCREEN-LEFT side at shoulder height holding the mug, starting to swing back behind him.
```

## 5. musou_05.png（回り過ぎて背中が見えていた）

```
Frame: musou spin loop, frame 5 of 10. Facing exception. Body yaw 144 degrees: a three-quarter FRONT view facing screen-left — we see his chest, his face mask and his left side; we do NOT see his back. His right arm and the mug have swung behind his body on the far side, so the mug is mostly hidden behind his back; his empty left arm is on the camera side.
```

## 6. win_02.png（ジョッキを掲げた姿勢のはずが、胸の高さに下ろしていた）

```
Frame: victory dance, frame 2 of 12. Three-quarter view facing screen-right. Exactly the pose of frame 1 — the beer mug raised high above his head in the right hand, the left fist on his hip — with a small hop: both feet 3% of the canvas height above the floor line. The mug stays raised high above his head and inside the canvas.
```

## 7. win_11.png（ジョッキを掲げたまま着地するはずが、下ろしていた）

```
Frame: victory dance, frame 11 of 12. Three-quarter view facing screen-right. Landing from the hop with a little sway, knees bent, both feet on the floor line, the beer mug still raised high above his head in the right hand, the left fist near the hip.
```

## 受け取ったあと（こちらで行う）

7枚の更新時刻と中身が変わっていることを確かめてから、仮面の8項目・ジョッキの手・向き・大きさと足元を前回と同じ手順で確認する。
