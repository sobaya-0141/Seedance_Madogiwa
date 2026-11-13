# 背景のプロンプト（コピペ用）

いま図形で描いている背景を、ステージ1・エリア1（正門ヤード）の背景ラフと同じ品質の1枚絵にする。**エリアごとに1枚**、全部で8枚。ゲームではエリアが変わるたびに背景を切り替える。

| ステージ | エリア | ファイル | 時間帯 | 右端（ゴールのあるエリアのみ） |
| --- | --- | --- | --- | --- |
| 1 ゴールデン麦酒 第一工場 | 1 正門ヤード | `s1_a1_rough.webp`（**作成済み・合格**。作り直さない） | 夕暮れ | — |
| | 2 倉庫 | `s1_a2.png` | 夕暮れ | — |
| | 3 製造ライン | `s1_a3.png` | 夕暮れ（屋内） | できたてビールのタンク |
| 2 麻布十番駅 → 本社ビル | 1 駅前 | `s2_a1.png` | 夜のはじめ | — |
| | 2 商店街 | `s2_a2.png` | 夜 | — |
| | 3 本社ビル前 | `s2_a3.png` | 夜 | 本社ビルの入口 |
| 3 あくしでんちゅあ本社ビル | 1 ロビー | `s3_a1.png` | 夜（屋内） | — |
| | 2 オフィスフロア | `s3_a2.png` | 夜（屋内） | — |
| | 3 窓際エリア | `s3_a3.png` | 夜（屋内） | 窓際の立ち飲み処 |

時間は ステージ1の夕暮れ → ステージ2の夜 → ステージ3の夜 と進む（昼に戻らない）。

## 使い方

1. 参照画像を添付する
   - R: `04_GAME_ASSETS/musou2d/backgrounds/s1_a1_rough.webp`（合格した正門ヤード）。**毎回**付ける。絵柄・カメラの高さ・床の位置をそろえるため
   - Q: そのステージの1枚目（`s2_a1.png` など）。**a2・a3 を作るときだけ**付ける。同じステージで明かりと色がつながるように
2. 「共通ブロック」の後ろに、各背景の指示をつなげて生成する
3. 保存先: `17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated_bg/`。ファイル名は上の表のとおり
4. 順番: まず **s1_a2・s2_a1・s3_a1 の3枚**を作って見せてもらう（ステージごとの1枚目）。合格したら残りの5枚に進む

---

## 共通ブロック（全部の先頭に付ける）

```
Attached images:
- Image R is the approved background of the first area of this game. Match its art style, level of detail, camera height and angle, horizon height, and the position and size of the walkable floor EXACTLY. Do NOT copy its contents (the brewery gate, guard booth, tanks, truck, barrels, Tokyo Tower placement).
- Image Q (only when attached) is the approved first background of this same stage. Match its lighting, color palette and time of day so the areas connect.

Draw ONE wide background for a high-end 2D side-scrolling beat-'em-up stage, in Japanese anime background-art style: clean line art, cel shading with painted gradients in the sky and lights, rich but readable detail.

Canvas: wide 16:9 (the same aspect ratio as Image R).
Layout (identical to Image R):
- The back wall / buildings / scenery occupy the upper half of the image. Their base meets the floor at about 52% of the image height.
- The walkable floor fills the lower half of the image (from about 52% of the height to the bottom), seen in gentle perspective. Keep the floor OPEN and walkable: only flat details on it (lines, tiles, grates, puddles, reflections, stains). NO objects standing on the floor area, nothing blocking the middle.
- Foreground: at most one or two small objects in a bottom corner only.
Camera: horizontal side view, camera about 20 degrees above eye level, the same as Image R.
Any signboards, posters, screens and plates are blank with no text, no letters, no numbers and no logos. No real brands.
No characters, no people, no animals, no UI, no effects.
```

---

## ステージ1 ゴールデン麦酒 第一工場（夕暮れ）

**s1_a2.png**（倉庫。R を添付）
```
Scene: the inside of the beer brewery's big warehouse at dusk, area 2 of the brewery stage.
- Back: a long, high warehouse interior wall of corrugated steel with tall steel shelving racks stacked with cardboard cases of beer and wooden pallets, a few rolled-up loading-dock shutters showing the dusk sky (purple to orange) outside, a parked forklift and a pallet jack against the back wall, hanging industrial lamps giving warm pools of light, high windows with orange dusk light streaming in.
- Floor: a smooth gray concrete warehouse floor with yellow painted lane lines and a few oil stains, reflecting the lamps.
- Foreground: a stack of beer crates in the bottom-left corner only.
Lighting: warm orange dusk light from the high windows and lamps, cool violet shadows, consistent with Image R.
```

**s1_a3.png**（製造ライン。R と Q=`s1_a2.png` を添付）
```
Scene: the beer production line inside the brewery at dusk, area 3 and the final area of the brewery stage.
- Back: rows of tall shining copper brewing kettles and stainless steel tanks with catwalks, pipes, valves and gauges (gauges without numbers), a bottling conveyor line with rows of empty glass bottles along the back wall, big windows showing the dusk sky.
- Right end (the goal of this stage): one especially large, gleaming stainless "fresh beer" storage tank with a golden tap and a warm spotlight on it, standing against the back wall at the right edge of the image. It must be against the back wall, not on the walkable floor.
- Floor: a clean tiled brewery floor with drain grates and a little spilled foam, reflecting the copper.
- Foreground: a coiled hose in the bottom-right corner only.
Lighting: warm copper and gold highlights, dusk light from the windows, cool violet shadows, connecting with Image Q.
```

## ステージ2 麻布十番駅 → あくしでんちゅあ本社ビル（夜）

**s2_a1.png**（駅前。R を添付）
```
Scene: the plaza in front of a subway station entrance in a Tokyo city district at early night (just after dusk), area 1 of the city stage.
- Back: a fictional subway station entrance with stairs going down and a blank station sign plate, a row of small shops and an izakaya with red paper lanterns (lanterns without text), vending machines with glowing blank panels, a bus stop shelter, street trees, mid-rise buildings with lit windows, a deep blue sky with the last violet glow on the horizon and Tokyo Tower lit orange in the distance.
- Floor: wide paved sidewalk tiles and a pedestrian crossing in gentle perspective, wet and reflecting the shop lights.
- Foreground: a bicycle-parking rack in the bottom-left corner only.
Lighting: early night. Warm shop and lantern light, cool blue ambient light. The sky is darker than Image R (time has passed since the dusk of the brewery).
```

**s2_a2.png**（商店街。R と Q=`s2_a1.png` を添付）
```
Scene: a lively old Tokyo shopping street (shotengai) at night, area 2 of the city stage.
- Back: a covered arcade street with a row of small shops — a soba shop with a navy noren curtain, a liquor shop with beer crates stacked outside against the shop front, a fishmonger, a sweets shop — red and white paper lanterns and hanging decorations along the arcade roof, shop signs as blank plates, shutters half open, warm light spilling out.
- Floor: the arcade's brick-patterned paving in gentle perspective, reflecting the lanterns.
- Foreground: a small potted plant in the bottom-right corner only.
Lighting: night, warm lantern light under the arcade, cool blue night outside at the edges, connecting with Image Q.
```

**s2_a3.png**（本社ビル前。R と Q=`s2_a1.png` を添付）
```
Scene: the front plaza of the headquarters of a fictional giant IT company at night, area 3 and the final area of the city stage. The skyscraper towers up out of the top of the frame.
- Back: the base of a huge modern glass-and-steel skyscraper with many lit office windows, a landscaped plaza with low planters and a blank monument plate, flagpoles without flags, other skyscrapers and Tokyo Tower lit orange in the night sky on the left.
- Right end (the goal of this stage): the building's grand main entrance — tall revolving glass doors and an entrance canopy with warm light inside, at the right edge of the image, against the back, not on the walkable floor.
- Floor: the polished stone plaza paving in gentle perspective, reflecting the windows.
- Foreground: a low hedge corner in the bottom-left corner only.
Lighting: night, cool blue ambient light, warm light from the entrance and windows, connecting with Image Q.
```

## ステージ3 あくしでんちゅあ本社ビル（夜・屋内）

**s3_a1.png**（ロビー。R を添付）
```
Scene: the grand lobby of the headquarters skyscraper of a fictional giant IT company at night, area 1 of the office stage.
- Back: a double-height lobby with a white marble wall, a long reception counter (no people), security gates with glowing blank panels, a big blank digital wall screen glowing soft blue, potted plants, a wall of tall windows showing the night city and Tokyo Tower lit orange outside, elevators with brass doors.
- Floor: polished white and gray marble floor in gentle perspective, reflecting the lights.
- Foreground: a large potted plant in the bottom-right corner only.
Lighting: clean cool white lobby lights mixed with the warm orange glow of the night city through the windows. Night outside.
```

**s3_a2.png**（オフィスフロア。R と Q=`s3_a1.png` を添付）
```
Scene: an ordinary open-plan office floor of the same headquarters at night, area 2 of the office stage. Clean, bright and normal: a good company where people work seriously (no messy or dark atmosphere).
- Back: rows of tidy white desks with monitors (screens showing simple blank colored panels), office chairs, a glass-walled meeting room, whiteboards (blank), bookshelves, a water server, tall windows along the back showing the night city skyline.
- Floor: gray carpet tiles in gentle perspective with a light pattern.
- Foreground: an office chair in the bottom-left corner only.
Lighting: bright white ceiling lights, the night city glowing through the windows, connecting with Image Q.
```

**s3_a3.png**（窓際エリア。R と Q=`s3_a1.png` を添付）
```
Scene: the "window-side area" at the far end of the same office floor at night, area 3 and the final area of the whole game. A free, cheerful, homemade corner of the office, not sad at all.
- Back: a long wall of floor-to-ceiling windows with a spectacular night view of Tokyo and Tokyo Tower lit orange, a few desks and shelves made of cardboard (DIY cardboard furniture), paper lanterns, a cozy sofa, plants, string lights, a cardboard sign plate with no text.
- Right end (the goal of the whole game): a small homemade standing bar (tachinomi) built in the window-side corner — a wooden counter with a navy noren curtain, red paper lanterns, a beer server, a small plate of edamame and skewers on the counter, warm golden light — at the right edge of the image, against the back, not on the walkable floor. The noren and lanterns have no text.
- Floor: the same gray office carpet in gentle perspective, a little worn near the windows.
- Foreground: a cardboard box in the bottom-left corner only.
Lighting: night, the warm golden glow of the standing bar and the lanterns, the cool blue night view through the windows, connecting with Image Q.
```

---

## 受け取ったあと（こちらで行う）

1. 床の位置（高さの約52%から下）と、床に物が置かれていないかを Image R と並べて確認する（キャラが歩く場所なので最重要）
2. 文字・ロゴ・人が描かれていないか、時間帯が前のエリアとつながっているか（昼に戻っていないか）を確認する
3. 合格したら WebP にして `04_GAME_ASSETS/musou2d/backgrounds/` に入れ、エリアが変わるたびに背景を切り替えるようにする
