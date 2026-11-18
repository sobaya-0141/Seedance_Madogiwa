# 麻布十番ステージの車 — 画像生成プロンプト（Tripo の元の絵用）

商店街のタクシーとパトカーを、Tripo で作り直すための元の絵。1台につき1枚作ってほしい（工場の配送トラック `props/factory/truck.png` と同じ作り方）。

## 作り方の共通ルール
- **アスペクト比 1:1（正方形）**、できるだけ高解像度（2K以上）
- 工場のトラックの絵 `props/factory/truck.png` を**画風の参考として添付する**と、ゲーム内の他の車と色味・質感がそろいやすい
- 車は**1台だけ**、画面の中央に**全体が切れずに**入るように（地面・道路・人は入れない）
- 斜め前（左前から約30度、少し上から）の見た目で、**背景は明るい灰色の無地**
- **文字・ロゴ・ナンバーの数字は入れない**（屋根の行灯・車体の横・ナンバープレートも無地）。実在の車種やメーカーのエンブレムにも似せない
- できた画像はこのフォルダの `props/azabu_cars/` に、下のファイル名で置いてほしい（名前が違っても、こちらで付け直す）

---

### 1. タクシー → `taxi.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference image. Three-quarter view from the front-left, slightly above. The whole vehicle is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no numbers, no logos, no emblems, no labels anywhere. The object is a generic Japanese city taxi: a classic four-door compact sedan with a long hood and trunk, glossy bright yellow body with a thin orange stripe along the side, chrome front grille and chrome bumpers, rectangular headlights, side door mirrors mounted on the front fenders, tinted windows, silver five-spoke wheels with black tires, and a small plain white rooftop taxi lamp box on the roof. Clean, new, and slightly stylized with smooth rounded body panels.
```

### 2. パトカー → `police_car.png`
```
A single isolated 3D game asset for a modern AAA console action game, rendered in high-end real-time 3D (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail), matching the bright, clean, slightly stylized look of the attached reference image. Three-quarter view from the front-left, slightly above. The whole vehicle is fully visible and centered, on a plain light-gray studio background with only a soft contact shadow. No people, no text, no letters, no numbers, no logos, no emblems, no labels anywhere. The object is a generic Japanese police patrol car: a four-door mid-size sedan painted in the classic two-tone scheme, glossy black lower body and doors with a glossy white roof, pillars and upper body, a long red emergency light bar across the roof, a black front push bumper, black side mirrors, tinted windows, and black wheels with silver hubcaps. Plain body sides with no markings. Clean, new, and slightly stylized with smooth rounded body panels.
```

---

## Tripo での作り方（こちらで行う）
- 画像1枚 → HD モデル H3.1 → リトポロジー（三角形・1万）→ GLB 書き出し（テクスチャ 2K）
- 1台あたり 90 クレジット（生成55＋リトポ35）。2台で約180
- ゲーム側では今のタクシー（駅前）・パトカー（規制線の左右）と差し替える。屋根の行灯・警光灯は光らせる
