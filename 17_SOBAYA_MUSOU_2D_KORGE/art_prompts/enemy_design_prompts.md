# 敵のデザイン画プロンプト（5種）

敵5種の「デザイン画（キャラクターシート）」を作るためのプロンプト。ここで承認したシートが、そば屋のキャラクターシートと同じ「正典」になり、以降の敵のアニメはすべてこのシートを参照画像Aとして作る。

- **縦切り試作に必要なのは「1. 警備員」と「2. 警備隊長」の2枚**。残り3枚は本制作の前でよい
- 1種につき1枚。何案か出して一番良いものを選んでよい
- 保存先: `art_prompts/generated_enemies/<名前>_sheet.png`（例: `guard_sheet.png`）。承認後、こちらで `04_GAME_ASSETS/musou2d/designs/` に正典として置く

## 添付する参照画像

| 記号 | ファイル | 何のために使うか |
| --- | --- | --- |
| S | `art_prompts/generated/idle_01.png`（そば屋の基準コマ） | 絵柄・線の太さ・塗り・光の当たり方をそば屋とそろえる。**そば屋そのものは描かせない** |
| G | 承認済みの `guard_sheet.png` | 警備隊長を作るとき（2. の手順）。同じ組織の制服の作り・色の系統をそろえる |
| P | 承認済みの `police_sheet.png` | 巡査部長を作るとき。同じ組織の制服をそろえる |

## 共通ブロック（全種の先頭に付ける）

```
Image S is a style reference only: a frame of "Sobaya", the hero of this game. Match its art style exactly — high-quality Japanese anime cel shading, bold clean outlines (thicker on the silhouette, thinner inside), 3 tones of shading (light, shadow, deep shadow), key light from the upper left, a cool-violet rim light on the right edge of the silhouette. Do NOT draw Sobaya, his mask, his beer mug or his clothes; do NOT copy his body shape.

Create a CHARACTER DESIGN SHEET for ONE new enemy character of a comedic Japanese 2D side-scrolling beat-'em-up game.

Layout (landscape canvas, 16:9):
- Top row, left to right: full-body FRONT view, full-body RIGHT-SIDE view (facing screen-right), full-body BACK view. Same character, same neutral standing pose (arms relaxed at the sides, feet shoulder-width), same scale, all three standing on one shared invisible floor line, the tops of their heads level with each other.
- Bottom row, left to right: a close-up of the head and cap from the front, a close-up of the cap badge, (when the character carries an item) a close-up of the item, and a row of 6 flat color swatches of the main colors.
- Plain flat light-gray background (#D9D9D9) for the whole sheet. Thin dark-gray panel borders. No text, no labels, no numbers, no logos anywhere.

Character rules:
- A fictional security or police role for a light-hearted game. No real-world organization's emblem, insignia, logo, flag, rank mark or text anywhere. Badges are simple fictional shapes described below.
- Tone: earnest but slightly goofy and likeable. Never scary, brutal or menacing. No weapons other than what is described (no guns, no knives).
- Japanese adult man, realistic adult proportions (not chibi), neutral standing pose.
- Everything described in PRESERVE must be clearly visible and identical in all three views.
```

各種は、共通ブロックの後ろに `Character:` と `PRESERVE:` を付けて使う。

---

## 1. 警備員（guard）★縦切り試作に必要

添付: S

```
Character: a young brewery security guard, the most common enemy of the game. About 172 cm tall, average build (clearly slimmer and smaller than a 180 cm / 100 kg heavyweight), a slightly nervous, honest face, short neat black hair under the cap.

PRESERVE (count every item, identical in all three views):
- A peaked security cap in gray-blue (#4D5566) with a black visor, and exactly 1 small round silver badge on the front of the cap (a plain circle with a simple 5-point star embossed in it).
- A light sky-blue (#8CB3E0) short-sleeve uniform shirt with a collar, exactly 5 white buttons down the front, exactly 2 chest pockets with flaps, and epaulettes on both shoulders.
- A black belt with a plain silver buckle.
- Dark gray (#383D47) straight uniform trousers.
- Black lace-up work shoes.
- Bare hands (no gloves). No weapon, no baton, no radio.
- Skin is a natural light skin tone.
```

## 2. 警備隊長（captain）★縦切り試作に必要

添付: S、G（警備員が承認されてから作る）

```
Image G is the approved design sheet of the regular brewery security guard. The captain belongs to the SAME security company: keep the same uniform construction (collar, button count, pocket shape, belt) and the same color family, but more senior and heavier.

Character: the brewery's security captain, a mini-boss. About 178 cm tall and broad, bulkier than the guard (about 1.15 times his width), a thick black mustache, stern but comical thick eyebrows, short black hair under the cap, a proud chest-out posture.

PRESERVE (count every item, identical in all three views):
- A navy (#26334F) peaked cap with a black visor, a gold braid cord across the front of the cap, and exactly 1 gold badge on the front of the cap (a simple 5-point star inside a circle).
- A deeper blue (#4D6BA6) LONG-sleeve uniform shirt with a collar, exactly 5 white buttons, exactly 2 chest pockets with flaps, epaulettes with exactly 2 gold stripes on each shoulder.
- A navy padded tactical vest over the shirt, with exactly 2 front pouches.
- White gloves on both hands.
- A black belt with a gold buckle.
- Dark navy (#262B38) uniform trousers, black boots.
- No weapon, no baton.
```

## 3. 警察官（police）

添付: S

```
Character: a fictional city patrol officer, a common enemy from stage 1 area 2 onward. About 174 cm tall, average athletic build, an eager, earnest face, short black hair under the cap.

PRESERVE (count every item, identical in all three views):
- A dark navy (#1F2A50) peaked cap with a black visor and exactly 1 small gold fictional badge on the front (a plain 6-point star, no letters).
- A dark navy (#212F61) long-sleeve uniform shirt with a collar, exactly 5 navy buttons, exactly 2 chest pockets with flaps.
- A dark navy-black necktie.
- A black duty belt with exactly 2 small pouches and a baton loop.
- White gloves on both hands.
- Dark navy straight trousers, black shoes.
- A short black baton (about 50 cm, round, plain, with a small grip handle) held in the RIGHT hand in all three views (in the back view it is in the hand on the screen-right side).
- No gun, no holster, no handcuffs.
```

## 4. 巡査部長（sergeant）

添付: S、P（警察官が承認されてから作る）

```
Image P is the approved design sheet of the patrol officer. The sergeant belongs to the SAME police force: keep the same uniform construction (collar, button count, pocket shape, necktie, duty belt, baton) and the same color family, but more senior and heavier.

Character: a fictional patrol sergeant, a mini-boss. About 178 cm tall and broad, bulkier than the officer (about 1.15 times his width), a confident smirk, a short neat beard along the jaw, short black hair under the cap.

PRESERVE (count every item, identical in all three views):
- A darker navy (#141E40) peaked cap with a black visor, a gold braid cord across the front, and exactly 1 larger gold fictional badge (a plain 6-point star inside a circle, no letters).
- A darker navy (#1A2652) long-sleeve uniform shirt, exactly 5 navy buttons, exactly 2 chest pockets, exactly 2 gold stripes on each upper sleeve.
- A dark navy-black necktie with a small gold tie clip.
- A black duty belt with exactly 2 pouches and a baton loop.
- White gloves on both hands.
- Darker navy trousers, black boots.
- The same short black baton as the officer, held in the RIGHT hand in all three views.
- No gun, no holster.
```

## 5. 警部（boss）

添付: S

```
Character: a fictional police inspector, the final boss of every stage. About 185 cm tall with a big, heavy build (clearly larger than the 180 cm / 100 kg hero), a square jaw, bushy black eyebrows, short slicked-back black hair under the cap, a dramatic but comical presence (theatrical, a little vain, never cruel).

PRESERVE (count every item, identical in all three views):
- A black flat-topped peaked cap with a black visor, a gold braid cord, and exactly 1 gold fictional badge (a plain 8-point star inside a circle, no letters).
- A near-black (#2E2933) three-piece suit: a single-breasted jacket with exactly 2 buttons, a matching waistcoat with exactly 5 buttons, matching trousers.
- A white dress shirt and a dark navy-black necktie.
- White gloves on both hands.
- Black polished leather shoes.
- No weapon, no baton.

Also add, in the bottom row instead of an item close-up, a head close-up of his ANGRY face for his rage phase: his face turned bright red, eyebrows sharply angled, teeth clenched, comic white steam puffing from both ears. Comical, not frightening.
```

---

## 受け取ったあと（こちらで行う）

1. PRESERVE の項目を1つずつ数えて照合する（ボタン・ポケット・袖の線・バッジの形、三面で同じか）
2. 絵柄がそば屋の基準コマ（S）とそろっているかを、並べて確認する（線の太さ・影の段数・逆光）
3. そば屋の基準コマと同じ縮尺で並べ、身長と体格の比（警備員は小さく、警部は大きく）を確認する
4. 合格したシートを `04_GAME_ASSETS/musou2d/designs/` に置き、敵ごとの「シート照合チェックリスト」を作る。その後、敵のアニメ（`asset_prompts.md` の「3. 敵の共通ブロック」）のプロンプトを、このシートを参照画像Aにして書き直す
