# 敵のデザイン画プロンプト（残り3種: 警察官・巡査部長・警部）

`enemy_design_prompts.md` の3〜5を、警備員・警備隊長の結果を踏まえて直したもの。

## 前回からの変更点

- 承認済みの警備員シートを**レイアウトと仕上げの見本（L）**として添付し、5枚のシートの見た目（パネルの配置・下段の内容・背景・線の太さ）をそろえる。制服や顔は写さない
- ボタンなどの数は、前回どおり指定はするが、**承認したシートに描かれた数が正**になる（前回、警備員4つ・隊長6つで承認した）
- 身長は、承認済みの2人との比で指定する（警察官は警備員と同じくらい、巡査部長は隊長と同じくらい、警部は一番大きい）

## 添付する参照画像

| 記号 | ファイル | 何のために使うか | 使う敵 |
| --- | --- | --- | --- |
| S | `art_prompts/generated/idle_01.png`（そば屋の基準コマ） | 絵柄（線・塗り・逆光）をそば屋とそろえる | 3種すべて |
| L | `04_GAME_ASSETS/musou2d/designs/guard_sheet.png` | シートのレイアウトと仕上げをそろえる | 3種すべて |
| P | 承認済みの `police_sheet.png` | 同じ警察の制服の作りをそろえる | 巡査部長だけ（警察官の承認後に作る） |

**作る順番**: 警察官 → 巡査部長（P が要る）。警部はいつでもよい。
**保存先**: `art_prompts/generated_enemies/police_sheet.png` / `sergeant_sheet.png` / `boss_sheet.png`

## 共通ブロック（全種の先頭に付ける）

```
Image S is a style reference only: a frame of "Sobaya", the hero of this game. Match its art style exactly — high-quality Japanese anime cel shading, bold clean outlines (thicker on the silhouette, thinner inside), 3 tones of shading (light, shadow, deep shadow), key light from the upper left, a cool-violet rim light on the right edge of the silhouette. Do NOT draw Sobaya, his mask, his beer mug or his clothes.

Image L is an approved design sheet of a DIFFERENT character (a security guard) from the same game. Copy ONLY its sheet layout, panel arrangement, background color, line weight and level of finish. Do NOT copy its character, face, uniform, cap, badge or colors.

Create a CHARACTER DESIGN SHEET for ONE new enemy character of a comedic Japanese 2D side-scrolling beat-'em-up game.

Layout (landscape canvas, 16:9, same arrangement as Image L):
- Top row, left to right: full-body FRONT view, full-body RIGHT-SIDE view (facing screen-right), full-body BACK view. Same character, same neutral standing pose (arms relaxed at the sides, feet shoulder-width), same scale, all three on one shared invisible floor line, the tops of their heads level.
- Bottom row, left to right: a close-up of the head and cap from the front, a close-up of the cap badge, a third close-up as described below, and a row of 6 flat color swatches of the main colors.
- Plain flat light-gray background (#D9D9D9). Thin dark-gray panel borders. No text, no labels, no numbers, no logos anywhere.

Character rules:
- A fictional police role for a light-hearted game. No real-world police emblem, insignia, logo, flag, rank mark or text anywhere (no Japanese police "旭日章" sun badge, no "POLICE" or "警察" text). Badges are simple fictional shapes described below.
- Tone: earnest but slightly goofy and likeable. Never scary, brutal or menacing. No guns, no knives, no handcuffs, no holsters.
- Japanese adult man, realistic adult proportions (not chibi), neutral standing pose.
- Everything described in PRESERVE must be clearly visible and identical in all three views.
```

各種は、共通ブロックの後ろに `Character:` と `PRESERVE:` を付けて使う。

---

## 3. 警察官（police）

添付: S、L

```
Character: a fictional city patrol officer, a common enemy from stage 1 area 2 onward. About 174 cm tall (about the same height as the security guard of Image L), an average athletic build, an eager, earnest face, short black hair under the cap.

PRESERVE (count every item, identical in all three views):
- A dark navy (#1F2A50) peaked cap with a black visor and exactly 1 small gold fictional badge on the front (a plain 6-point star, no letters).
- A dark navy (#212F61) LONG-sleeve uniform shirt with a collar, navy buttons down the front, exactly 2 chest pockets with flaps.
- A dark navy-black necktie.
- A black duty belt with a silver buckle, exactly 2 small black pouches on the belt and a baton loop.
- White gloves on both hands.
- Dark navy straight trousers, black shoes.
- A short black baton (about 50 cm, round, plain, with a small grip handle) held in his RIGHT hand in all three views (in the back view it is in the hand on the screen-right side).

Third close-up in the bottom row: the black baton in his white-gloved right hand.
```

## 4. 巡査部長（sergeant）

添付: S、L、P（警察官が承認されてから作る）

```
Image P is the approved design sheet of the patrol officer. The sergeant belongs to the SAME police force: keep the same uniform construction (collar, button style, pocket shape, necktie, duty belt with pouches, baton) and the same color family as Image P, but darker, more senior and heavier.

Character: a fictional patrol sergeant, a mini-boss. About 178 cm tall and broad (about 1.15 times the officer's width), a confident smirk, a short neat black beard along the jaw, short black hair under the cap, chest out.

PRESERVE (count every item, identical in all three views):
- A darker navy (#141E40) peaked cap with a black visor, a gold braid cord across the front above the visor, and exactly 1 larger gold fictional badge (a plain 6-point star inside a circle, no letters).
- A darker navy (#1A2652) long-sleeve uniform shirt, navy buttons, exactly 2 chest pockets with flaps, exactly 2 gold stripes on each upper sleeve.
- A dark navy-black necktie with a small gold tie clip.
- The same black duty belt as Image P (2 pouches, baton loop), a gold buckle.
- White gloves on both hands.
- Darker navy trousers, black boots.
- The same short black baton as Image P, held in his RIGHT hand in all three views.

Third close-up in the bottom row: the sleeve with its 2 gold stripes.
```

## 5. 警部（boss）

添付: S、L

```
Character: a fictional police inspector, the final boss of every stage. About 185 cm tall with a big, heavy build (clearly larger and taller than the bulky security captain, who is about 178 cm), a square jaw, bushy black eyebrows, short slicked-back black hair under the cap, a dramatic but comical presence (theatrical, a little vain, never cruel).

PRESERVE (count every item, identical in all three views):
- A black peaked cap with a black visor, a gold braid cord, and exactly 1 gold fictional badge (a plain 8-point star inside a circle, no letters).
- A near-black (#2E2933) three-piece suit: a single-breasted jacket with exactly 2 buttons, a matching waistcoat with buttons, matching trousers.
- A white dress shirt and a dark navy-black necktie.
- White gloves on both hands.
- Black polished leather shoes.
- No weapon, no baton.

Third close-up in the bottom row: his ANGRY face for his rage phase — the face turned bright red, eyebrows sharply angled, teeth clenched, comic white steam puffing from both ears. Comical, not frightening.
```

---

## 受け取ったあと（こちらで行う）

1. PRESERVE を1項目ずつ照合する（帽章の形と星の数、袖の線、ネクタイ、ベルト、手袋、警棒が右手か）
2. 絵柄とレイアウトが、そば屋の基準コマ（S）と承認済みの2枚にそろっているかを並べて確認する
3. 承認したシートを `04_GAME_ASSETS/musou2d/designs/` に置き、README.md にチェックリストを足す（ボタンなどの数は描かれた数を正とする）
4. 3種のアニメのプロンプトを、警備員・警備隊長と同じ形式で出す（警察官・巡査部長は警棒の振り下ろし、警部はストレートと地響き）
