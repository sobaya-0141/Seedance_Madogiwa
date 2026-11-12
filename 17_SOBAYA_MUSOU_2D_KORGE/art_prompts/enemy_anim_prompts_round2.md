# 敵のアニメ プロンプト（警察官・警部）

警察官34コマ・警部55コマ。巡査部長は、デザイン画が承認されたあとに警察官と同じ組み立てで作る（このファイルの警察官の指示で `<NAME>` を差し替えるだけ）。

## 使い方（警備員・警備隊長と同じ）

- 共通ブロックは `enemy_anim_prompts.md` の「共通ブロック」をそのまま使い、`<NAME>` と `<HEIGHT>` を下の表で置き換える
- 参照画像は毎回 A（その敵のデザイン画）・S（そば屋の基準コマ）、手順2以降は C（その敵の基準コマ）も添付する
- 手順も同じ: ①基準コマ idle_01 を作る → ②idle の残りを編集で作る → ③動きのコマ
- 保存先: `art_prompts/generated_enemies/police/`・`art_prompts/generated_enemies/boss/`

| 敵 | A | `<NAME>` | `<HEIGHT>` |
| --- | --- | --- | --- |
| 警察官 | `04_GAME_ASSETS/musou2d/designs/police_sheet.png` | `the city patrol officer` | `0.97` |
| 警部 | `04_GAME_ASSETS/musou2d/designs/boss_sheet.png` | `the police inspector` | `1.03` |
| （巡査部長・後日） | `sergeant_sheet.png` | `the patrol sergeant` | `1.0` |

## 警棒と右手（警察官・巡査部長）

デザイン画どおり、**警棒は必ず右手**。右向きの斜め（通常の向き）では、右手は体の手前（カメラ側）に来る。警棒を左手に持ち替えているコマは不合格。各コマの指示の末尾に次の1文を付ける。

```
The black baton is always in his RIGHT white-gloved hand (on the camera side of his body in this three-quarter view facing screen-right).
```

（吹っ飛び・目を回すコマでは警棒を手放してよい。そのときは上の1文の代わりに `He has dropped his baton; it is not in the picture.` を付ける）

---

## 警察官（34コマ）

### 手順1: idle_01（A・S）
```
Frame: guarded idle, frame 1 of 6. Three-quarter view facing screen-right. Ready stance: feet a little wider than shoulder-width, knees slightly bent, the baton raised in the right hand in front of the chest, the left gloved hand open in front as a guard, an earnest determined face watching the opponent on the screen-right side.
```

### 手順2: idle_02〜06（C を編集元）
`enemy_anim_prompts.md` の手順2と同じ表（上下に1%・2%・1%弾み、重心を前へ、元に戻る）。

### 手順3: 動き（A・S・C）

**walk（8コマ・ループ）**: `enemy_anim_prompts.md` の walk と同じ8行。各行の後ろに `The baton is held in the right hand, swinging with the arm.` を足す。

**attack（7コマ・当たり4。07は基準コマ流用）**: 警棒の振り下ろし
```
Frame: attack, frame 1 of 7. Wind-up: the baton raised high above and behind his head in the right hand, the left hand forward for balance.
Frame: attack, frame 2 of 7. Stepping in with the front foot, the baton starting to come down.
Frame: attack, frame 3 of 7. The baton swinging down in front of him at head height.
Frame: attack, frame 4 of 7. HIT: the baton swung down in front of him toward screen-right at chest height, arm extended, weight on the front foot.
Frame: attack, frame 5 of 7. Follow-through: the baton continuing down to waist height.
Frame: attack, frame 6 of 7. Pulling the baton back up toward the ready stance.
```

**hit（3コマ）・fly（6コマ）・dizzy（4コマ）**: `enemy_anim_prompts.md` の hit・fly・dizzy と同じ行。fly_01 で警棒を手放し（`the baton flies out of his hand`）、fly_02 以降と dizzy は警棒なし。

---

## 警部（55コマ）

武器を持たない。全ステージのボスで、怒ると顔が真っ赤になる（体力が半分を切ったとき）。

### 手順1: idle_01（A・S）
```
Frame: guarded idle, frame 1 of 6. Three-quarter view facing screen-right. A heavy, confident boxer's stance: feet planted wide, knees slightly bent, both white-gloved fists raised, a smug grin.
```

### 手順2: idle_02〜06（C を編集元）
`enemy_anim_prompts.md` の手順2と同じ表。

### 手順3: 動き（A・S・C）

**walk（8コマ・ループ）**: `enemy_anim_prompts.md` の walk と同じ8行。ただし `jogging` を `a heavy stomping march` に置き換える（ボスらしく、どっしり歩く）。

**attack（8コマ・当たり5。08は基準コマ流用）**: 踏み込んでの右ストレート
```
Frame: attack, frame 1 of 8. Wind-up: the right fist pulled far back beside the hip, shoulders twisted away from screen-right, weight on the back foot.
Frame: attack, frame 2 of 8. A big step forward with the left foot.
Frame: attack, frame 3 of 8. Hips turning toward screen-right, the right fist starting forward.
Frame: attack, frame 4 of 8. The right arm halfway extended.
Frame: attack, frame 5 of 8. HIT: a heavy straight right punch at full extension toward screen-right at chest height, the whole body behind it.
Frame: attack, frame 6 of 8. Follow-through, leaning forward.
Frame: attack, frame 7 of 8. Pulling the fist back, straightening up.
```

**hit（3コマ）・fly（6コマ）・dizzy（4コマ）**: `enemy_anim_prompts.md` と同じ行。

**intro（8コマ）**: 登場と、怒りへの切り替え（07・08 は体力が半分を切ったときにも使う）
```
Frame: entrance, frame 1 of 8. Striding in from screen-left with a heavy step, chest out, tugging his jacket lapels.
Frame: entrance, frame 2 of 8. Stopping with a firm stomp, feet planted wide.
Frame: entrance, frame 3 of 8. Straightening his cap with the right gloved hand, smug.
Frame: entrance, frame 4 of 8. Pointing dramatically toward screen-right with the right index finger, shouting (mouth wide open).
Frame: entrance, frame 5 of 8. Holding the point, a smug grin.
Frame: entrance, frame 6 of 8. Settling into the guarded idle stance of Image C.
Frame: rage, frame 7 of 8. Three-quarter view facing screen-right. Clenching both fists at his sides, shoulders shaking, his face turning bright red, eyebrows sharply angled, teeth clenched — exactly like the angry close-up on Image A. Comical, not frightening.
Frame: rage, frame 8 of 8. Same as frame 7, with comic white steam puffing from both ears, both fists raised, a stomp of anger.
```

**special（地響き・12コマ・当たり6）**: `asset_prompts.md` の「special（地響き）」の12行をそのまま使う。足を踏み鳴らし、6コマ目で床を踏みつける。

## コマ数のまとめ

| 動作 | 警察官 | 警部 |
| --- | --- | --- |
| idle | 6 | 6 |
| walk | 8 | 8 |
| attack | 7（07は流用） | 8（08は流用） |
| hit | 3 | 3 |
| fly | 6 | 6 |
| dizzy | 4 | 4 |
| intro | — | 8 |
| special | — | 12 |
| **合計** | **34** | **55** |

## 受け取ったあと（こちらで行う）

1. 全コマを designs/README.md のチェックリストで照合する（警察官は警棒が右手か、警部は帽章の8つ星・白手袋・怒りの顔）
2. そば屋の基準コマと並べて、身長の比・足元・絵柄を確認する
3. 合格したらアトラスにまとめてゲームの警察官・警部を差し替え、録画で確認してもらう

---

## 基準コマの確認結果（2026-11-12）

| コマ | 結果 | 直し方 |
| --- | --- | --- |
| police/idle_01.png | **不合格**: 帽章が5つ星（デザイン画は6つ星）。ほかは合格 | 作り直し。指示の末尾に `The cap badge is a plain gold star with exactly SIX points, exactly as on Image A (not five).` を足す |
| boss/idle_01.png | 合格。ただし身長がそば屋の1.0倍で、警備隊長（1.02倍）より低い | 作り直し不要。ゲーム側で警部だけ5%大きく描く（`Data.kt` の `HAND_DRAWN_SIZE`） |
| sergeant_sheet.png | 合格（`04_GAME_ASSETS/musou2d/designs/` に登録） | — |
| sergeant/idle・walk・attack_01〜04 | walk_08 だけ**不合格**: ほかのコマより約1割大きく、足元が浮いている（人物の高さ 1074px、ほかは 960〜990px） | walk_08 を作り直す。指示の末尾に `Keep exactly the same character size and foot line as Image C (the figure must not be larger or higher than Image C).` を足す |
