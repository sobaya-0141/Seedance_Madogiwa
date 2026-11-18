# 麻布十番ステージの大道具 — 画像生成プロンプト（Claude が Blender で作る大道具の参考画像）

ステージ2（麻布十番駅 → 本社前）を目標映像・`Loc_azabu_shotengai_sheet.png` の見た目にするための大道具12点。Claude がこの画像を見ながら、Blender で寸法・配色・細部を合わせて3Dモデルにする（Tripo には送らない）。

## 作り方の共通ルール
- **アスペクト比 1:1（正方形）**、できるだけ高解像度（2K以上）
- **`Loc_azabu_shotengai_sheet.png` を画風の参考として添付する**と、色味・質感がそろいやすい
- 物は**1つだけ**、画面の中央に**全体が切れずに**入るように。背景は**明るい灰色の無地**
- 形と寸法が分かるように、**昼間の均一な光**で（夕焼けの色は付けない。夕方の光はゲーム側で当てる）。ただし看板・窓・ランプは**点灯していない状態**でよい
- **文字・ロゴは入れない**（看板・暖簾・のぼりは無地）
- 建物（1〜3）は**正面から真っすぐ**、それ以外は**斜め前（左前から約30度、少し上から）**
- できた画像は `props/azabu/` に、表のファイル名で置いてほしい

各プロンプトの先頭は同じ文にしてある:
`A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere.`

---

## 店の建物（正面から）

### 1. 和菓子屋（紫の日よけ）→ `shop_wagashi.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. Straight front view. The object is the front of a narrow three-story Japanese shopping-street building, about 6 meters wide: a ground-floor Japanese sweets shop with a dark wooden storefront, a wide glass display case of round pastel mochi sweets, a purple fabric awning and three short purple noren curtain panels, a small floor lantern box; above it two floors of beige stucco wall with wooden-framed windows, a small iron balcony on the second floor, and a flat roof with an air-conditioner unit.
```

### 2. 八百屋（緑の日よけ・店先の野菜）→ `shop_yaoya.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. Straight front view. The object is the front of a two-story Japanese shopping-street building, about 6 meters wide: a ground-floor greengrocer with a wide open shopfront, a dark-green striped fabric awning, tiered wooden display stands and wooden crates full of colorful vegetables and fruit (watermelons, oranges, tomatoes, cabbages, green peppers) at the front, warm pendant lamps inside; above it a second floor of red-brown brick with two aluminum-framed windows and a small air-conditioner unit.
```

### 3. 喫茶店（黄色の日よけ）→ `shop_kissa.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. Straight front view. The object is the front of a four-story Japanese shopping-street building, about 7 meters wide: a ground-floor retro coffee shop with a wooden door, large wood-framed windows and a yellow-and-white striped fabric awning, a blank standing chalkboard sign; above it three floors of gray concrete with horizontal rows of windows, small balconies with metal railings, and a flat roof with two air-conditioner units and a water tank.
```

## 屋台・飾り

### 4. たい焼きの屋台 → `taiyaki_stall.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a small Japanese taiyaki street stall about 2.5 meters wide: a dark wooden counter, a red scalloped fabric canopy on thin poles, a glass display case on the counter filled with golden fish-shaped taiyaki cakes, an iron taiyaki griddle with fish-shaped molds behind it, a short plain white noren hanging at one side, a plain red vertical banner on a pole, and two small warm pendant bulbs under the canopy.
```

### 5. 赤い提灯 → `lantern.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view, slightly from below. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a single traditional round red Japanese paper lantern (chochin) about 40 cm tall, with horizontal bamboo ribs visible through the paper, a black lacquered ring cap on top and bottom, and a short hanging cord with a small hook on top. Plain red paper with no writing.
```

### 6. 商店街のアーチ看板 → `arch.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Straight front view. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a Japanese shopping-street welcome arch spanning a two-lane street, about 14 meters wide and 7 meters tall: two square red-painted steel columns with tall vertical lamp boxes near the top, an arched red steel lattice beam with decorative curved bracing between them, and a round blank white medallion sign at the top center.
```

## 街の設備

### 7. 電柱（変圧器付き）→ `utility_pole.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a single Japanese concrete utility pole about 10 meters tall: a light-gray tapered concrete pole, two horizontal steel crossarms near the top with white ceramic insulators, a gray cylindrical pole-mounted transformer, short cut-off cable ends, and small step bolts on the side. Only the pole, with no wires running off to other poles.
```

### 8. 街灯（カーブ型）→ `street_lamp.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a single dark charcoal-gray metal street lamp about 5 meters tall, with a round post on a small base, a gracefully curved arm at the top, and a round dome lamp head with a frosted glass globe underneath.
```

### 9. 自動販売機 → `vending_machine.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a Japanese drink vending machine about 1.8 meters tall, with a glossy red body, a large glass front panel showing three rows of colorful plain drink cans and bottles without labels, small round selection buttons under each row, a coin slot and a pickup slot at the bottom.
```

### 10. 鉢植えのアジサイ（四角いプランター）→ `planter_hydrangea.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a square beige stone planter about 60 cm wide and 50 cm tall, filled with a lush hydrangea bush with big round clusters of blue and purple flowers and green leaves.
```

### 11. 車止めポール（ステンレス）→ `bollard_steel.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a single round brushed-stainless-steel sidewalk bollard about 80 cm tall, with a domed top and two thin dark rings near the top.
```

### 12. 歩道の木（植え込み付き）→ `street_tree.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, even neutral daylight studio lighting, crisp detail), matching the warm, cozy, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a single young sidewalk street tree about 5 meters tall, with a slim trunk, a rounded open canopy of fresh green leaves, and a square cast-iron tree grate at its base.
```

---

- 10（アジサイ）と12（木）は形が有機的なので、Blender ではなく **Tripo** で3Dにする予定（クレジット 90×2）
- 床（濡れた路面・敷石）、遠景の高層ビル、夕焼けの空、電線、提灯の列のつなぎ方はゲーム側で作る
