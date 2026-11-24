# そば屋無双 ステージ4〜10 — Tripo の元の絵の生成プロンプト

ステージ4〜10の新しい敵6体（シート）と、ステージ5の屋形船（大道具1枚）の元の絵。書き方は `image_prompts.md`（敵）・`prop_prompts_azabu_cars.md`（大道具）と同じ。

- 敵のシートは **16:9（横長）**、大道具は **1:1（正方形）**。どちらも2K以上
- 画風をそろえるため、敵は既存の `Mob_police_sheet.png` を、屋形船は `props/factory/truck.png` を**画風の参考として添付する**
- 文字・ラベル・ロゴ・数字が入った画像は使えない（入ってしまったら作り直す）
- できた画像はこのフォルダに、下のファイル名で置いてほしい（名前が違ってもこちらで付け直す）
- メカそば屋（ステージ7のボス）は既存の `02_CHARACTERS/Mecha_Sobaya_sheet.png` を使うので、新しく作らなくてよい

敵の各プロンプトの先頭と最後は、既存のモブと同じ共通の文にしてある。

---

## 1. 賞金稼ぎ（ステージ4 赤坂 大逃走）→ `Mob_bounty_hunter_sheet.png`

やめ太郎の賞金2億を狙う賞金稼ぎ。雑魚にも、大きくした版を「賞金稼ぎの親分」ボスにも使う。

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a comical Japanese bounty hunter in his 30s, lean and wiry, with a sharp jaw, a thin black mustache, short slicked-back black hair and a smug grin. He wears a worn tan suede jacket with fringe on the sleeves over a dark red shirt, a black bandana tied loosely around the neck, faded dark blue jeans, a brown leather belt with a large plain oval brass buckle, brown cowboy boots, brown fingerless leather gloves, and a brown wide-brimmed cowboy hat. A coiled light-brown rope lasso hangs from his belt on the left hip. A rolled-up paper wanted poster sticks out of his back jeans pocket (the paper is blank, with no printing). Empty hands. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 2. 水上警察の船長（ステージ5 隅田川 屋形船・ボス）→ `Mob_river_captain_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D boss character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a confident wide-legged stance with arms slightly away from the body. The character is a Japanese river police boat captain in his 50s, very large and imposing — about 190 cm tall with a broad barrel chest and thick arms — with a weathered tanned face, a full short gray beard, bushy gray eyebrows and a stern but slightly comical frown. He wears a dark navy police uniform jacket with gold buttons, matching dark navy trousers, a bright orange inflatable life vest worn over the jacket, black rubber deck boots, white gloves, and a white peaked captain's cap with a black brim and a plain gold band. A silver whistle on a white cord hangs around his neck. Empty hands, fists clenched. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 3. 公園管理員（ステージ6 河川敷BBQ）→ `Mob_park_ranger_sheet.png`

「直火禁止です！」と止めに来る河川敷の管理員。雑魚にも、大きくした版を「管理所長」ボスにも使う。

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese riverside park ranger in his 40s, average height with a slightly round belly, a friendly round face with rosy cheeks, short black hair and a fussy, slightly comical expression. He wears a khaki green work jacket with two chest pockets over a white polo shirt, a bright yellow-green high-visibility safety vest with silver reflective stripes, khaki cargo trousers, brown rubber boots, white cotton work gloves, and a khaki bucket hat. A silver whistle on a green cord hangs around his neck, and he holds a long black litter grabber stick in his right hand. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 4. 番組AD（ステージ8 テレビ局 生放送）→ `Mob_tv_ad_sheet.png`

生放送に乱入したそば屋を止めに来るアシスタントディレクター。雑魚にも、大きくした版を「フロアディレクター」ボスにも使う。

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese TV studio assistant director in his mid 20s, slim, with messy medium-length brown hair, tired eyes with dark circles and a frantic, slightly comical expression. He wears a black headset with a boom microphone over the ears, a plain black crew-neck T-shirt under an open dark gray hooded sweatshirt, black cargo trousers with many pockets, a black canvas waist pouch holding rolls of colored gaffer tape, white sneakers, and a staff lanyard with a blank white card around his neck. In his right hand he holds a large blank white sketchbook (cue card) with nothing written on it. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 5. 鉄道警察隊員（ステージ9 東京駅 社員旅行）→ `Mob_railway_police_sheet.png`

駅で騒ぐそば屋を止めに来る鉄道警察隊。雑魚にも、大きくした版を「鉄道警察隊長」ボスにも使う。

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese railway police officer in his 30s, tall and sturdy, with a square jaw, short black hair and a serious but slightly comical expression. He wears a dark navy uniform jacket with a bright red armband on the left upper arm, a light blue collared shirt with a dark navy necktie, dark navy trousers, a black duty belt, black polished shoes, white gloves, and a dark navy peaked cap with a thin red band and a small plain gold emblem. A silver whistle on a chain is clipped to the chest pocket. He holds a short red-and-white striped signal baton in his right hand. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 6. 黒服のSP（ステージ10 窓際王の会議室）→ `Mob_black_suit_sp_sheet.png`

某社の要人警護の黒服。雑魚にも、大きくした版を「SP隊長」ボスにも使う。

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese corporate bodyguard in his 30s, tall and broad-shouldered, with a buzz-cut black hair, a square jaw and a stern but slightly comical poker face. He wears dark black sunglasses, a coiled clear earpiece wire running from his right ear into the collar, a sharp black two-piece suit, a white dress shirt, a slim black necktie, a small plain round silver lapel pin, black leather gloves and polished black shoes. Empty hands. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

---

## 7. 屋形船（ステージ5 の大道具）→ `props/yakatabune/yakatabune.png`

```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference image. Three-quarter view from the front-left, slightly above. The whole boat is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No water, no people, no text, no letters, no numbers, no logos, no labels anywhere. The object is a traditional Japanese yakatabune river pleasure boat: a long, low, flat wooden hull painted dark brown with a white waterline stripe, a long rectangular cabin on the deck with a gently curved dark gray tiled roof, many sliding paper shoji windows with thin wooden frames along both sides glowing warm white, a row of round red paper lanterns hanging along the edge of the roof, a small open wooden deck at the bow and stern, and a flat walkable roof deck with a low wooden railing. Clean, new, and slightly stylized with smooth surfaces.
```

---

## Tripo での作り方（こちらで行う）
- 敵: マルチビュー（シートの正面＋背面を切り出し）→ HD モデル H3.1 → リトポロジー（三角形・1万）→ 自動リギング（人型・Mixamo）→ GLB（テクスチャ 2K・スケルトン込み）。1体110クレジット
- 屋形船: 画像1枚 → HD モデル H3.1 → リトポロジー（三角形・1万）→ GLB。90クレジット
- 7体（メカそば屋を含む）＋屋形船で 770＋90＝860（残高ちょうど）
