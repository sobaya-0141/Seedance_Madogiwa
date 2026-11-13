# エリアの境目のゲートのプロンプト（コピペ用）

いま図形（黄色と灰色の縞の柱）で描いている、エリアの境目のゲートを手描きにする。**ステージごとに1種類、全部で3枚**。ゲートは敵を全員倒すまで道をふさぎ、倒すと開く（開く動きはゲーム側で、上に引き上げて消す）。

| ファイル | ステージ | ゲートの中身 | 添付する背景（R） |
| --- | --- | --- | --- |
| `gate_s1.png` | 1 ビール工場 | 工場の重い鉄の引き戸ゲート | `backgrounds/s1_a2.webp`（倉庫） |
| `gate_s2.png` | 2 街 | 警察の通行止めバリケード | `backgrounds/s2_a2.webp`（商店街） |
| `gate_s3.png` | 3 本社ビル | ビルの警備用シャッター | `backgrounds/s3_a2.webp`（オフィスフロア） |

## 使い方

1. 参照画像を2枚添付する
   - R: 上の表の背景（`04_GAME_ASSETS/musou2d/backgrounds/`）。明かりと色をそろえるため
   - S: `17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated/idle_01.png`（そば屋の基準コマ）。大きさと絵柄をそろえるため。**そば屋は描かせない**
2. 「共通ブロック」の後ろに、各ゲートの指示をつなげて生成する
3. 保存先: `17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated_bg/`。ファイル名は上の表のとおり

---

## 共通ブロック

```
Attached images:
- Image R is the approved background of this stage. Match its art style, lighting, colors and time of day. Do NOT draw the background itself.
- Image S is a frame of "Sobaya", the hero of this game, used ONLY as a reference for the art style (anime cel shading, bold clean outlines) and for size. Do NOT draw Sobaya.

Draw ONE game object for a high-end 2D side-scrolling beat-'em-up: a barrier that blocks the path between two areas of a stage until all enemies are defeated.
Style: identical to Image S — high-quality Japanese anime cel shading, bold clean dark outlines, 2 to 3 tones of shading, key light from the upper left, a cool-violet rim light on the right edge. Lighting and colors matching Image R.
Canvas: tall portrait (9:16), flat solid magenta background (#FF00FF) everywhere around the object, no floor, no cast shadow, no gradient. Nothing magenta or pink on the object itself.
Shape and view: the barrier stands across the walkable floor, seen from the same camera as Image R (about 20 degrees above eye level, side view). It is a TALL, NARROW object: about 1.5 times as tall as Sobaya in Image S, and about one third as wide as it is tall. Its base sits on the bottom edge area of the canvas (the lowest point about 3% above the bottom edge); its top is about 5% below the top edge. Centered horizontally, nothing touching the left or right edges.
It must look clearly closed and impassable, and it must read clearly at a small size in the game (strong silhouette, high contrast).
Any signs or plates on it are blank: no text, no letters, no numbers, no logos.
No characters, no people, no background scenery, no effects.
```

---

**gate_s1.png**（ビール工場。R=`s1_a2.webp`）
```
Object: a heavy steel sliding gate of the beer brewery, closed. A thick steel frame with diagonal cross-bracing and vertical bars, yellow-and-black hazard stripes along the frame edges, small steel wheels at the bottom running on a short floor rail, a red rotating warning lamp (not lit, no glow effect) on top of the frame post, and one blank warning plate in the middle. Weathered gray-blue steel with warm dusk highlights.
```

**gate_s2.png**（街。R=`s2_a2.webp`）
```
Object: a police road-closure barricade blocking the street, closed. Two stacked rows of the classic Japanese police barricade: white-and-blue striped metal barrier panels on sturdy A-frame legs, with orange traffic cones and a yellow warning lamp on the top (not lit, no glow effect), and one blank rectangular plate hanging in the middle. Stacked high enough to be about 1.5 times as tall as Sobaya. Night lighting: cool blue ambient light with warm reflections from street lanterns.
```

**gate_s3.png**（本社ビル。R=`s3_a2.webp`）
```
Object: an office building's security shutter, closed. A tall pull-down steel roller shutter in a light-gray metal frame, horizontal slats, a security card reader panel on the frame (blank screen, no text), a yellow-and-black striped bottom bar, and one blank plate in the middle. Clean and modern, lit by bright white office lights with a cool blue tint from the night windows.
```

---

## 受け取ったあと（こちらで行う）

1. 大きさ（そば屋の約1.5倍の高さ）・マゼンタ背景・文字が無いことを確認する
2. 合格したらゲームに入れ、閉じている間はゲートの位置に立たせ、開くときは上に引き上げながら消す
