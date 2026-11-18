# ビール工場ステージの大道具 — 画像生成プロンプト（Tripo の元の絵用）

ステージ1（ゴールデン麦酒 第一工場）を目標映像・`Loc_factory_sheet.png` の見た目にするための大道具14点。1点につき1枚作ってほしい。

## 作り方の共通ルール
- **アスペクト比 1:1（正方形）**、できるだけ高解像度（2K以上）
- **`Loc_factory_sheet.png` を画風の参考として添付する**と、色味・質感がそろいやすい
- 物は**1つだけ**、画面の中央に**全体が切れずに**入るように（Tripo は写っているものを全部3Dにするので、余計な物・床・影の強い地面は入れない）
- 斜め前（左前から約30度、少し上から）の見た目で、**背景は明るい灰色の無地**
- **文字・ロゴは入れない**（看板・旗・トラックの荷台も無地）
- できた画像はこのフォルダの `props/factory/` に、表のファイル名で置いてほしい（名前が違っても、こちらで付け直す）

各プロンプトの先頭は同じ文にしてある:
`A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere.`

---

## 正門ヤード

### 1. 配送トラック → `truck.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a Japanese medium-size delivery box truck: a bright yellow cab-over cab with a large windshield, black bumper, round headlights and side mirrors, and a long plain white rectangular cargo box behind it with a rear roll-up door, six black tires, clean and new.
```

### 2. 赤いビールケースのパレット → `crates_red.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a square wooden shipping pallet stacked four layers high with bright red plastic beer crates, four crates per layer, each crate with side hand-hole openings and a grid of bottle slots, neatly aligned.
```

### 3. 黄色いビールケースのパレット → `crates_yellow.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a square wooden shipping pallet stacked three layers high with bright yellow plastic beer crates, four crates per layer, each crate with side hand-hole openings and brown glass beer bottles visible in the top layer.
```

### 4. 工場の外壁（横の壁の1区画）→ `wall_section.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Seen straight from the front, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is one modular wall section of a factory building, about 8 meters wide and 8 meters tall: cream-colored corrugated metal cladding, two dark-navy steel pillars at the left and right edges, a long horizontal row of dark-framed windows across the middle, a thick silver steel pipe running horizontally along the top on brackets, and one black industrial wall lamp. The wall is flat and thin, like a game wall piece.
```

### 5. 奥の工場の建屋（シャッター付き）→ `building_shutter.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is the front of a small factory building with a gabled roof: cream-colored walls with dark-navy trim and pillars, a large closed gray metal roll-up shutter door in the center, a row of dark-framed windows above it, two plain mustard-yellow hanging banners on the front wall, and a dark-gray metal roof.
```

### 6. サイロ（3本並び）→ `silos.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a group of three tall polished stainless-steel grain silos standing side by side on short legs, each with a domed top, a small railing around the top, a vertical ladder on the side, and horizontal ring seams, connected by pipes at the top.
```

### 7. 植え込みのプランター → `planter.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a long rectangular gray concrete planter box, about 2 meters long and knee high, filled with lush green leafy shrubs and small bushes.
```

### 8. 黄黒の車止めポール → `bollard.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a single round steel safety bollard about one meter tall, painted with bold diagonal yellow and black hazard stripes, with a rounded top and a small round base plate.
```

## 倉庫

### 9. ビールケースを満載した倉庫ラック → `rack.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a tall industrial warehouse pallet rack, about 8 meters long and 4.5 meters tall, with blue steel upright frames and orange horizontal beams, three shelf levels loaded with wooden pallets of red and yellow plastic beer crates and brown cardboard boxes, with a few empty gaps.
```

### 10. 銀色のビール樽の山 → `kegs.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a neat group of six shiny stainless-steel beer kegs, four standing upright in a row and two more stacked on top, each keg with the typical rolling rings, handle cutouts on the top rim and a coupler valve in the center.
```

### 11. フォークリフト → `forklift.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a compact warehouse forklift with an orange body, a black overhead safety cage, an empty driver seat, a tall black mast with two steel forks lowered near the ground, and black solid tires, with nobody in it.
```

## 製造ライン

### 12. 仕込みタンク（足場付き）→ `brew_tank.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a large polished stainless-steel beer brewing tank about 7 meters tall: a tall cylinder with a domed top and a cone-shaped bottom on four legs, a round porthole hatch on the front, gauges and valves, silver pipes coming out of the top, and a yellow steel service platform with yellow safety railings and a ladder wrapped around its upper half.
```

### 13. 瓶の流れるベルトコンベア（1区間）→ `conveyor.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is one straight section of a stainless-steel bottling conveyor, about 6 meters long and waist high, on steel legs, with low side guide rails and a single long row of brown glass beer bottles standing close together on the belt, and a small control box with buttons on one leg.
```

### 14. 金色の樽（できたてビールの出荷口）→ `golden_barrels.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference sheet. Three-quarter view from the front-left, slightly above. The whole object is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no logos, no labels anywhere. The object is a row of three large glossy golden wooden beer barrels lying on their sides on a low wooden stand, each barrel with shiny brass hoops and a brass tap on the front, glowing with a warm golden sheen.
```

---

## 作らないもの（こちらで作る）
床（塗装コンクリート＋黄色い線）、天窓のある屋根と梁、光の筋、遠景の山と空は、コードとテクスチャで作る。
