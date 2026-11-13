# エフェクト・アイテムのプロンプト（コピペ用）

いまコードの図形で描いている演出を、手描きの素材に置き換える。全部で11種41枚。

| 種類 | ファイル | 枚数 | ゲームで出る場面 | 背景 |
| --- | --- | --- | --- | --- |
| 小さい当たり | hit_small_01〜04 | 4 | 通常攻撃（1〜3段目）が当たった瞬間 | 黒 |
| 大きい当たり | hit_large_01〜05 | 5 | 4段目・チャージ・無双乱舞が当たった瞬間 | 黒 |
| 地響き | shockwave_01〜06 | 6 | 警部の地響き（床を伝う衝撃波） | 黒 |
| 無双の衝撃波 | musou_wave_01〜06 | 6 | 無双乱舞の発動と、周りをなぎ倒す衝撃波 | 黒 |
| 無双のオーラ | musou_aura_01〜06 | 6 | 無双乱舞の3.2秒間、そば屋を包む（ループ） | 黒 |
| ビールの泡しぶき | foam_01〜05 | 5 | 大技が当たったとき、ジョッキからビールが飛ぶ | マゼンタ |
| 土ぼこり | dust_01〜04 | 4 | 着地・踏み込み・吹っ飛んだ敵が床に落ちたとき | マゼンタ |
| 擬音 | sfx_doka・sfx_bashi・sfx_gogogo | 3 | 当たった瞬間（大・小）と地響き | マゼンタ |
| アイテム | item_beer・item_edamame | 2 | 倒した敵が落とす缶ビール（無双ゲージ）と枝豆（体力） | マゼンタ |

- **背景が黒のもの**は光の演出で、ゲームでは加算合成（黒が透明になり、明るい部分が光る）で重ねる。黒以外の暗い色（影・黒い縁取り）を使わない
- **背景がマゼンタのもの**は普通の絵として重ねる。キャラと同じく、マゼンタを抜いて使う
- 保存先: `17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated_fx/`（git には入れない）。ファイル名は表のとおり

## 作り方（連番の絵がばらばらにならないように）

1. 各エフェクトの **01 を新しく生成**する（参照画像 S を添付）
2. **02 以降は、ひとつ前のコマを添付して編集**で作る（「編集の共通ブロック」＋各コマの指示）。形・色・線の太さ・中心の位置が前のコマとそろう
3. 01 が届いた時点で一度見せてもらえれば、こちらで確認してから残りに進める（やり直しが少なくなる）

参照画像:
- S: `17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated/combo4_06.png`（そば屋のコマ）。**絵柄をそろえるためだけ**に使う。そば屋は描かせない

---

## 共通ブロック FX-L（光の演出・黒背景）

```
Image S is a frame from this game, attached ONLY as a reference for the art style (Japanese anime cel shading, bold clean shapes). Do NOT draw the character or anything from Image S.

Draw ONE frame of a 2D game visual effect for a high-end 2D side-scrolling beat-'em-up game.
Style: Japanese anime effect art (sakuga style) — sharp cel-shaded shapes with crisp edges, 2 to 3 flat tones per color, bright saturated colors, a white-hot core where the light is strongest. No photographic smoke, no blur, no lens flare, no realistic fire.
Canvas: square, flat solid pure black background (#000000) everywhere outside the effect — this image will be used with additive blending, so black becomes transparent.
Colors: only light, glowing colors (white, yellow, gold, orange, amber, light red). Do NOT use black outlines, dark shading or any dark colors inside the effect.
Framing: the effect is centered in the canvas at the exact position described, with empty black space all around; nothing touches the edges of the canvas.
No characters, no people, no text, no floor, no background objects.
```

## 共通ブロック FX-N（普通の絵・マゼンタ背景）

```
Image S is a frame from this game, attached ONLY as a reference for the art style (Japanese anime cel shading, bold clean outlines, key light from the upper left). Do NOT draw the character or anything from Image S.

Draw ONE frame of a 2D game sprite for a high-end 2D side-scrolling beat-'em-up game, in exactly the art style of Image S: high-quality Japanese anime cel shading, bold clean dark outlines, 2 to 3 tones of shading, key light from the upper left.
Canvas: square, flat solid magenta background (#FF00FF), no gradient, no floor, no cast shadow. Nothing magenta or pink in the drawing itself.
Framing: centered in the canvas at the exact position described, with empty magenta space all around; nothing touches the edges of the canvas.
No characters, no people, no text unless stated, no background objects.
```

## 編集の共通ブロック（02 以降のコマ）

共通ブロック（FX-L か FX-N、01 と同じもの）の後ろに、これと各コマの指示をつなげる。添付はひとつ前のコマ（Image P）と S。

```
Image P is the previous frame of this same effect. Edit Image P into the next frame: keep the same canvas, the same background, the same center point, the same colors, the same line and shape style, and change ONLY what is described below.
```

---

## 1. hit_small（小さい当たり・4コマ・黒）

**hit_small_01.png**（新しく生成）
```
Frame 1 of 4 of a small, sharp impact spark (a fast punch connecting). At the exact center of the canvas: a small white-hot star-shaped flash with 6 sharp spikes of different lengths, yellow toward the tips, the whole effect about one quarter of the canvas width. A few short straight spark streaks shoot outward from it.
```
**hit_small_02.png**（編集）
```
Change: the flash is at its biggest, about one third of the canvas width; the spikes are longer and thinner; more spark streaks flying outward.
```
**hit_small_03.png**（編集）
```
Change: the core has shrunk and turned from white to yellow-orange; the spikes are breaking into separate shards flying outward; the sparks are farther from the center.
```
**hit_small_04.png**（編集）
```
Change: only a few small fading orange shards and sparks remain near the outer edge of where the burst was; the center is empty black.
```

## 2. hit_large（大きい当たり・5コマ・黒）

**hit_large_01.png**（新しく生成）
```
Frame 1 of 5 of a heavy, powerful impact burst (a big finishing blow connecting). At the exact center of the canvas: a bright white-hot round core with a ring of thick sharp orange spikes around it, the whole effect about 40% of the canvas width.
```
**hit_large_02.png**（編集）
```
Change: the burst explodes to its biggest, about 70% of the canvas width: a white core, long jagged orange and gold flame-like spikes radiating in all directions, a thin bright shock ring around it, many sparks flying out.
```
**hit_large_03.png**（編集）
```
Change: the core is fading from white to gold; the spikes are breaking up into separate jagged shards; the shock ring has expanded wider and is thinner; sparks are farther out.
```
**hit_large_04.png**（編集）
```
Change: the center is mostly empty; orange and amber shards and sparks scattered in a wide ring; the shock ring is very thin and faint.
```
**hit_large_05.png**（編集）
```
Change: only a few small, dim orange sparks remain at the outer edge; almost everything is black.
```

## 3. shockwave（警部の地響き・6コマ・黒・**赤**）

床に沿って広がる平たい楕円。広がる大きさはゲーム側で拡大して出すので、**絵は全コマ同じ大きさ**のまま、輪の状態（勢い→細く→消える）だけを変える。無双の衝撃波（金色）と見分けられるよう、**赤〜赤橙**にする。

**shockwave_01.png**（新しく生成。1回目は金色だったので作り直し）
```
Frame 1 of 6 of a dangerous ground shockwave from a villain's heavy stomp, seen from a camera about 20 degrees above the floor, so the wave is a FLAT horizontal ellipse lying on the floor (about 3 times wider than tall), about 70% of the canvas width, centered. Colors: hot RED and red-orange (#FF3B1F to #FF7A1A) with a white-hot inner edge — clearly red, NOT gold or yellow. A thick bright ring, jagged spikes of red-orange light bursting upward from the center, short cracks of light along the floor.
```
**shockwave_02.png 〜 shockwave_06.png**（編集。Change の1行だけコマごとに変える）

| ファイル | Change: の後ろ |
| --- | --- |
| shockwave_02.png | `The ring stays exactly the same size and position. The spikes at the center have dropped down; the ring is at its brightest and thickest.` |
| shockwave_03.png | `The ring stays exactly the same size and position. The center is empty now; the ring is a little thinner; the cracks are fading to dim red.` |
| shockwave_04.png | `The ring stays exactly the same size and position. The ring is thinner and dimmer red-orange; the cracks are gone.` |
| shockwave_05.png | `The ring stays exactly the same size and position. The ring is thin, faint red and starting to break into segments.` |
| shockwave_06.png | `The ring stays exactly the same size and position. Only a few faint, thin broken red segments of the ring remain; the rest is black.` |

## 4. musou_wave（無双の衝撃波・6コマ・黒・金）

01 は合格。地響きと同じく、**絵は全コマ同じ大きさ**のまま輪の状態だけを変える（広がる大きさはゲーム側で拡大する）。

**musou_wave_02.png 〜 musou_wave_06.png**（編集。Change の1行だけコマごとに変える）

| ファイル | Change: の後ろ |
| --- | --- |
| musou_wave_02.png | `The ring stays exactly the same size and position. The burst of light at the center has dropped down; the golden ring is at its brightest and thickest, sparkles spreading outward.` |
| musou_wave_03.png | `The ring stays exactly the same size and position. The center is empty now; the ring is a little thinner; sparkles spreading farther out.` |
| musou_wave_04.png | `The ring stays exactly the same size and position. The ring is thinner and fading from gold to amber; fewer sparkles.` |
| musou_wave_05.png | `The ring stays exactly the same size and position. The ring is thin, faint amber and starting to break into segments; only a couple of sparkles.` |
| musou_wave_06.png | `The ring stays exactly the same size and position. Only a few faint, thin broken amber segments of the ring remain; the rest is black.` |

## 5. musou_aura（無双のオーラ・6コマ・ループ・黒）

そば屋の体の周りに重ねるので、真ん中（人が入る場所）は暗く空けておく。06 の次は 01 に戻る。

**musou_aura_01.png**（新しく生成）
```
Frame 1 of 6 of a looping golden aura that surrounds a standing hero (the hero himself is NOT drawn). The aura is a tall flame-shaped outline of golden light, about 45% of the canvas width and 80% of the canvas height, standing on an invisible floor near the bottom of the canvas, horizontally centered. The inside of the aura, where the hero's body would be, is mostly empty black with only a faint glow. Gold and amber cel-shaded flame tongues rise upward along the outline, with small sparkles. The flame tongues are at position A of a looping flicker.
```
**musou_aura_02.png 〜 musou_aura_06.png**（編集。各コマ、Change の数字だけ変える）
```
Change: the flame tongues along the outline flicker upward to the next step of the loop (step N of 6): each tongue has risen by about one sixth of its own height, new small tongues appear at the bottom and the top ones thin out and detach as small sparks. The overall size, position and shape of the aura stay exactly the same, and the inside stays empty.
```
（N に 2〜6 を入れる。06 は 01 につながるように `and this frame must loop smoothly back into the first frame` を末尾に足す）

## 6. foam（ビールの泡しぶき・5コマ・マゼンタ）

**foam_01.png**（新しく生成）
```
Frame 1 of 5 of a splash of beer flying out of a mug toward screen-right. At the center of the canvas: a burst of thick white beer foam and amber beer droplets just leaving the origin point, in a tight cluster about one quarter of the canvas width, moving to the upper right.
```
**foam_02.png**（編集）
```
Change: the splash has spread into a wide arc toward the upper right, about half of the canvas width: white foam clumps of different sizes, amber droplets with white highlights, a few long amber streams.
```
**foam_03.png**（編集）
```
Change: the arc has spread wider and started to fall downward (gravity); the foam clumps are breaking into smaller blobs; droplets are separating.
```
**foam_04.png**（編集）
```
Change: the foam and droplets are falling lower and scattering, smaller and fewer.
```
**foam_05.png**（編集）
```
Change: only a few small foam blobs and droplets remain, low in the canvas, about to disappear.
```

## 7. dust（土ぼこり・4コマ・マゼンタ）

**dust_01.png**（新しく生成）
```
Frame 1 of 4 of a puff of floor dust kicked up by a heavy landing, seen from a camera about 20 degrees above the floor. Low and wide: a small cluster of round cel-shaded dust clouds in pale gray-beige (#C9B9A2) with darker beige shading, sitting on an invisible floor line at the center of the canvas, about one third of the canvas width, spreading to both left and right.
```
**dust_02.png**（編集）
```
Change: the dust clouds have spread wider to both sides (about half of the canvas width) and puffed up a little higher, with a few small pebbles flying.
```
**dust_03.png**（編集）
```
Change: the dust clouds are wider, lighter in color and starting to break into separate small puffs.
```
**dust_04.png**（編集）
```
Change: only a few small, faint puffs remain at the left and right ends; the middle is empty.
```

## 8. 擬音（3枚・マゼンタ）

文字が崩れやすいので、文字の形を必ず確認する。崩れたら作り直すか、ゲーム側のフォントのままにする。

**sfx_doka.png**
```
Bold hand-lettered Japanese manga sound-effect lettering that reads EXACTLY "ドカッ！" (the katakana ド, カ, small ッ, and an exclamation mark — four characters, nothing else). Thick, heavy, slightly slanted brush lettering, a yellow-to-orange fill, a thick dark brown outline (#2A1606) and a thin white outer rim. The lettering fills about 70% of the canvas width, centered. No other text, no symbols, no speed lines.
```
**sfx_bashi.png**
```
Bold hand-lettered Japanese manga sound-effect lettering that reads EXACTLY "バシッ" (the katakana バ, シ and a small ッ — three characters, nothing else). Sharp, quick, slightly slanted brush lettering, a white-to-pale-yellow fill, a thick dark brown outline (#2A1606). The lettering fills about 60% of the canvas width, centered. No other text, no symbols, no speed lines.
```
**sfx_gogogo.png**
```
Bold hand-lettered Japanese manga sound-effect lettering that reads EXACTLY "ゴゴゴ" (the katakana ゴ three times — three characters, nothing else). Heavy, rough, rumbling brush lettering stacked slightly diagonally, a red-to-orange fill, a thick dark brown outline (#2A1606). The lettering fills about 70% of the canvas width, centered. No other text, no symbols.
```

## 9. アイテム（2枚・マゼンタ）

**item_beer.png**
```
A single game pickup item: one cold aluminum beer can standing upright, a gold and white can with a plain label (no text, no logo), water droplets and frost on it to show it is ice-cold, a bright highlight on the left side. The can is about one third of the canvas height, standing on an invisible floor near the bottom center of the canvas.
```
**item_edamame.png**
```
A single game pickup item: a small round white dish holding a heap of bright green edamame (boiled soybean pods), a few pods with visible plump beans, a little salt sparkle. The dish is about 40% of the canvas width, sitting on an invisible floor near the bottom center of the canvas, seen from a camera about 20 degrees above.
```

---

## 受け取ったあと（こちらで行う）

1. 連番のコマがそろっているか（中心の位置・大きさ・色がつながるか）を並べて確認する
2. 黒背景のものは黒以外の暗い色が入っていないか、マゼンタ背景のものは絵の中にピンクが入っていないかを確認する
3. 擬音は文字が正しく読めるか（余計な文字・崩れがないか）を確認する
4. 合格したらアトラスにまとめ、`src/Particles.kt` の図形の演出と置き換えて、録画で見てもらう

---

## 01の確認結果（2026-11-13）

| ファイル | 結果 |
| --- | --- |
| hit_small_01・hit_large_01・musou_wave_01・musou_aura_01・foam_01・dust_01 | 合格。02 以降を編集で作ってよい |
| sfx_doka・sfx_bashi・sfx_gogogo | 合格（文字が正しく読める）。完成 |
| item_beer・item_edamame | 合格。完成 |
| shockwave_01 | **作り直し**: 金色で、無双の衝撃波と区別がつかない。3章の新しいプロンプト（赤）で作る |
