# そば屋無双 2D 画像素材プロンプト集（アニメ塗り版）

> **そば屋のスプライトは `regen_prompts.md`（第2版）の共通ブロックを使うこと。** この版の共通ブロックAは仮面の赤い線の指定が不十分で、第1回の生成が全コマ不合格になった。

素材仕様書（Claude Docs「そば屋無双 2D 素材仕様書（手描きアニメ版）」）にある素材を、1枚ずつ生成または作画依頼するためのプロンプト集。プロンプトは英語（生成モデル向け）、説明は日本語。

- **最初に作るのは「0. 絵柄テスト」と「1. 工場正門の背景ラフ」の2枚**。この2枚で絵柄・カメラの高さ・色調を確定してから、残りに進む
- AI生成は、コマ同士の形がそろいにくい。動きの素材は、AIで主要なポーズ（当たり・振りかぶりなど）を作り、中割りと清書は作画で行う使い方を推奨する

## 基準スクショの扱い

基準スクショ（依頼者が用意した市販ゲームの画面。リポジトリには入れない）は、次の点だけを基準にする。

- 画面構成: 横長の路地・敷地を奥行きのある床の帯で見せ、キャラは画面の高さの約4割
- カメラ: 真横より高く、約20度見下ろす
- 光: 夕暮れ〜夜の紫とオレンジの空、街灯や窓明かりの暖色、キャラの輪郭に強い逆光（リムライト）
- 密度: 背景の小物（フェンス・箱・看板・配管）の描き込みの多さ、攻撃が当たったときの炎のような大きなヒットエフェクト
- HUD: 左上に顔アイコン＋体力ゲージ＋ゲージ類、その右にヒット数の大きな数字、敵の頭上に小さな体力バー

**写さないもの**: 基準スクショのキャラクター・ロゴ・UIの形そのもの・文字。絵柄（3D描画）も写さず、アニメ塗りで描く。

## 生成のルール（全素材共通・必須）

- そば屋が写る素材は、**参照画像として `02_CHARACTERS/Sobaya_sheet.png` を必ず添付する**（CLAUDE.md の画像生成ルール）。同定句や記憶だけで生成しない
- 敵は、承認済みのデザイン画（「4. 敵のデザイン画」で作るもの）を参照画像として添付する。承認前に敵の動きの素材を作らない
- 雰囲気の参考として基準スクショを添付してよい。その場合は各プロンプトの末尾に「基準スクショ用の注意文」を付ける
- キャラの素材は**背景をマゼンタ一色（#FF00FF）**にする（ゲーム側で抜いて透過PNGにする）。キャラにマゼンタを使わない
- 同じキャラの全コマで、**キャンバス・縮尺・足元の位置**をそろえる（数値は各共通ブロック）
- キャラの素材にエフェクト（炎・火花・効果線・文字）を描かない。エフェクトは「6. エフェクト」で別に作る
- 受け取った画像は、Claude が `02_CHARACTERS/01_Sobaya.md` のシート照合チェックリスト8項目（敵は承認済みデザイン画）で1枚ずつ PASS/FAIL を判定してから組み込む。1項目でもFAILなら作り直す

### 基準スクショ用の注意文（基準スクショを添付したときだけ末尾に付ける）

```
The second attached image is a mood reference only. Take ONLY its camera height, dusk lighting, rim light, color mood and level of background detail. Do NOT copy its characters, faces, costumes, logos, UI, text or its 3D-rendered look.
```

---

## 共通ブロックA: そば屋のスプライト（全コマの先頭に付ける）

```
Use the attached character sheet as the identity reference for "Sobaya". Draw ONE full-body frame of Sobaya for a high-end 2D side-scrolling beat-'em-up game.

Art style:
- High-quality Japanese anime cel shading: bold clean outlines (thicker on the silhouette, thinner inside), 3 tones of shading (light, shadow, deep shadow) with a soft gradient only on large surfaces.
- Key light from the upper left. A strong cool-violet rim light on the right edge of the silhouette, like a dusk sky behind the character.
- The quality of a modern anime key visual; crisp, readable at small size, no painterly blur, no sketch lines.

Canvas and framing (identical for every frame):
- Square canvas 1280x1280, flat solid magenta background (#FF00FF), no floor, no cast shadow, no gradient.
- Full body visible, nothing cropped. When standing upright, the point between his feet sits at x=640, y=1180, and the top of his hair is at about y=340 (do not zoom; keep this scale in every frame).
- Camera about 20 degrees above eye level. Body faces screen-right in a three-quarter view so the mask is always visible.

PRESERVE (count and check every item):
- Face completely covered by a hard white mask. Exactly 2 large round black eye holes, pitch black inside (no eyeballs, eyelids, lashes or brows). No realistic nose or lips; the mouth is exactly 1 short horizontal black slit.
- Exactly 4 separate red markings: on each side one vertical red blade is split by the eye hole into a piece ABOVE the eye (tapering up to a point) and a piece BELOW the eye (tapering down to a point); the red never runs beside the eye hole. Mirror-symmetric. Exactly 1 small round dark-gray dot with a black rim in the center of the forehead. (See regen_prompts.md and attach the mask design image.)
- Short spiky black hair sticking out above the mask (also visible from behind).
- All exposed skin (neck, arms, hands) is neutral gray, never flesh-toned.
- Hulking 180 cm / 100 kg build with thick arms and a heavy torso (not a lean bodybuilder, no six-pack).
- Plain white short-sleeve T-shirt, black/charcoal jeans, white sneakers. No suit, no gloves, no jacket.
- A large clear glass beer mug with a handle, filled with amber beer and a white foam head, held by the handle in his RIGHT hand in every frame (never a can, bottle or tumbler; never dropped or thrown).

Do NOT carry over from the sheet: its photorealistic rendering, its poses, panel layout, panel borders, text labels (SOBAYA, AGE, FRONT/SIDE/BACK, captions), color palette swatches, close-up insets, or the beige background.
No visual effects, no motion lines, no speech bubbles, no text, no extra characters. Nothing magenta on the character.
```

各コマは、共通ブロックAの後ろに `Frame: …` の1行を足して使う。ファイル名は `<動作>_<2桁の番号>.png`（例: `combo1_04.png`）。

---

## 0. 絵柄テスト（そば屋の待機1コマ）★最初に作る

共通ブロックA ＋ 次の1行。これ1枚で、線の太さ・影の段数・色・縮尺を確認する。

**idle_01.png**
```
Frame: idle stance, frame 1 of 8. Feet a little wider than shoulder-width, knees slightly bent, weight centered. Left fist raised loosely in front of his chest. Right hand holds the beer mug at chest height, foam level and not spilling. Calm, confident, slightly comical heavyweight presence.
```

---

## 1. 工場正門の背景ラフ ★最初に作る

ステージ1・エリア1「正門ヤード」。ラフは層に分けなくてよい（1枚絵）。承認後に4層（遠景・中景・床・手前）で清書する。基準スクショを雰囲気の参考として添付する場合は注意文を末尾に付ける。

**s1_a1_rough.png**（1920×1080）
```
A wide background for a high-end 2D side-scrolling beat-'em-up stage, drawn in Japanese anime background-art style (clean line art, cel-shaded with painted gradients in the sky and lights, rich but readable detail).

Scene: the front gate yard of a fictional beer brewery, "Golden Bakushu No.1 Brewery", at dusk.
- Far: a purple-to-orange dusk sky, distant city buildings with lit windows, a faint silhouette of Tokyo Tower on the far left.
- Mid: the brewery's front gate with a sliding steel gate (open), a guard booth, a long brick-and-steel brewery wall, two tall stainless fermentation tanks behind the wall, warm sodium street lamps, a chain-link fence section, stacked wooden beer barrels and aluminum kegs, a parked delivery truck.
- Floor: the yard's concrete ground fills the lower half of the image (from y=560 to y=1080). Keep this floor area open and walkable: only flat details such as painted parking lines, a drain grate, puddles reflecting the lamps and a few tire marks. No objects standing in the floor area.
- Foreground: a short section of fence post and a traffic cone at the very bottom-left corner only.

Camera: horizontal side view, camera about 20 degrees above eye level, the floor seen in gentle perspective, horizon line at about y=430.
Lighting: dusk. Warm lamp pools on the ground, cool violet ambient light, strong backlight from the sky on building edges.
Any signboards are blank plates with no text, no logos. No characters, no people, no UI, no effects.
```

---

## 2. そば屋の全動作（縦切り試作・108コマ）

共通ブロックA ＋ 各行の `Frame:`。当たり（★）のコマは、攻撃が一番伸びた瞬間として描く。動作の始めと終わりのコマは待機の構えにつながる姿勢にする。

### idle（待機・8コマ・ループ）
- `idle_01.png` → 「0. 絵柄テスト」と同じ
```
Frame: idle stance, frame 2 of 8. Same stance as frame 1, breathing in: shoulders 1 cm higher, chest slightly expanded.
Frame: idle stance, frame 3 of 8. Breathing in fully: shoulders at their highest, mug rising 1 cm with the chest.
Frame: idle stance, frame 4 of 8. Holding the breath at the top, a tiny bob of the head.
Frame: idle stance, frame 5 of 8. Breathing out: shoulders lowering, same as frame 3 in height.
Frame: idle stance, frame 6 of 8. Breathing out: same as frame 2 in height.
Frame: idle stance, frame 7 of 8. Shoulders at their lowest, knees bending a little more.
Frame: idle stance, frame 8 of 8. Returning to frame 1, knees straightening slightly.
```

### run（走り・8コマ・ループ）
```
Frame: run cycle, frame 1 of 8. Contact: left foot strikes the floor ahead toward screen-right, right leg extended behind, body leaning forward. Left arm swings back, the beer mug hugged close to his chest in the right hand so nothing spills.
Frame: run cycle, frame 2 of 8. Down: left knee bends to absorb weight, body at its lowest, right leg swinging forward.
Frame: run cycle, frame 3 of 8. Passing: right leg passes under the body with the knee high, left leg straight.
Frame: run cycle, frame 4 of 8. Up: pushing off the left foot, body at its highest, both feet briefly near the floor.
Frame: run cycle, frame 5 of 8. Contact: right foot strikes the floor ahead, left leg extended behind. Left arm swings forward. Mug still hugged to the chest.
Frame: run cycle, frame 6 of 8. Down: right knee bends, body lowest, left leg swinging forward.
Frame: run cycle, frame 7 of 8. Passing: left leg passes under the body with the knee high.
Frame: run cycle, frame 8 of 8. Up: pushing off the right foot, body highest.
```

### combo1（コンボ1段目・ジョッキで突く・7コマ・当たり4）
```
Frame: combo 1, frame 1 of 7. Anticipation: shoulders turn slightly back, the beer mug pulled back beside his right hip.
Frame: combo 1, frame 2 of 7. Stepping forward with the left foot, the mug starting to move forward at waist height.
Frame: combo 1, frame 3 of 7. Right arm halfway extended, the mug at chest height moving toward screen-right.
Frame: combo 1, frame 4 of 7. HIT: right arm fully extended straight toward screen-right, jabbing with the bottom of the beer mug at chest height, shoulder driven forward, weight on the front foot. The mug stays upright enough that the beer does not spill out.
Frame: combo 1, frame 5 of 7. Recoil: arm bends back slightly, a little foam lifting off the top of the beer.
Frame: combo 1, frame 6 of 7. Pulling the mug back toward the chest.
Frame: combo 1, frame 7 of 7. Back to a stance close to the idle stance, ready for the next hit.
```

### combo2（コンボ2段目・横に振り抜くフック・7コマ・当たり4）
```
Frame: combo 2, frame 1 of 7. Wind-up: torso twisted away from screen-right, the mug drawn back behind his right shoulder.
Frame: combo 2, frame 2 of 7. Starting the swing: hips turning toward screen-right, the mug at shoulder height behind him.
Frame: combo 2, frame 3 of 7. Mid-swing: the mug sweeping horizontally at shoulder height, passing beside his head.
Frame: combo 2, frame 4 of 7. HIT: the mug at the far point of a horizontal hook in front of him toward screen-right, arm curved, torso fully rotated, mug gripped tightly.
Frame: combo 2, frame 5 of 7. Follow-through: the arm continuing across his body, torso over-rotated.
Frame: combo 2, frame 6 of 7. Unwinding: torso turning back, the mug returning toward the chest.
Frame: combo 2, frame 7 of 7. Back to a stance close to the idle stance.
```

### combo3（コンボ3段目・踏み込んで強く突く・7コマ・当たり4）
```
Frame: combo 3, frame 1 of 7. Deep crouch: knees bent low, the mug pulled back to the right hip, body coiled.
Frame: combo 3, frame 2 of 7. Big step forward with the left foot, body springing up.
Frame: combo 3, frame 3 of 7. Lunging forward, right arm extending, the mug at chest height.
Frame: combo 3, frame 4 of 7. HIT: a long lunge, front knee deeply bent, back leg straight, right arm fully extended driving the mug forward toward screen-right at chest height. More forceful than combo 1.
Frame: combo 3, frame 5 of 7. Recoil: body still low, arm bending back.
Frame: combo 3, frame 6 of 7. Rising out of the lunge, pulling the mug back.
Frame: combo 3, frame 7 of 7. Back to a stance close to the idle stance.
```

### combo4（コンボ4段目・床へ叩きつけ・11コマ・当たり6）
```
Frame: combo 4, frame 1 of 11. Anticipation: knees bending, the mug lowered beside the right thigh.
Frame: combo 4, frame 2 of 11. Raising the mug: right arm lifting, body starting to rise.
Frame: combo 4, frame 3 of 11. Full wind-up: right arm high above and behind his head, mug upright, back arched, left arm forward for balance.
Frame: combo 4, frame 4 of 11. Hold at the top of the wind-up, up on the toes, the whole body stretched.
Frame: combo 4, frame 5 of 11. Swinging down: the mug coming down in a big arc in front of him.
Frame: combo 4, frame 6 of 11. HIT: slamming the bottom of the mug onto the floor in front of him toward screen-right, both knees bent deeply, body crouched over the mug, mug gripped and intact.
Frame: combo 4, frame 7 of 11. Impact hold: same crouch, shoulders shaking slightly, foam lifting off the beer.
Frame: combo 4, frame 8 of 11. Starting to rise, the mug lifting off the floor.
Frame: combo 4, frame 9 of 11. Half standing, the mug at knee height.
Frame: combo 4, frame 10 of 11. Almost upright, the mug at waist height.
Frame: combo 4, frame 11 of 11. Back to a stance close to the idle stance.
```

### charge（チャージ攻撃・一回転してなぎ払う・12コマ・当たり8）
```
Frame: charge attack, frame 1 of 12. Gathering power: feet wide, knees deep, the mug held low and back, shoulders hunched.
Frame: charge attack, frame 2 of 12. Same, coiled tighter, torso twisted away from screen-right.
Frame: charge attack, frame 3 of 12. Maximum coil, the mug behind his back, weight on the back foot.
Frame: charge attack, frame 4 of 12. Release: spinning toward screen-right, the mug swinging out at waist height.
Frame: charge attack, frame 5 of 12. Spin, body facing the camera, the mug extended to his right side at arm's length.
Frame: charge attack, frame 6 of 12. Spin, back toward the camera (hair visible above the mask), the mug extended to the left side.
Frame: charge attack, frame 7 of 12. Spin, body facing screen-right again, the mug sweeping around.
Frame: charge attack, frame 8 of 12. HIT: the end of the spin, the mug at full arm's length in front of him toward screen-right at waist height, a wide sweeping pose, both feet planted.
Frame: charge attack, frame 9 of 12. Follow-through, body still turning, foam lifting off the beer.
Frame: charge attack, frame 10 of 12. Slowing down, the mug coming in toward the chest.
Frame: charge attack, frame 11 of 12. Settling, knees straightening.
Frame: charge attack, frame 12 of 12. Back to a stance close to the idle stance.
```

### musou（無双乱舞・回転し続ける・10コマ・ループ）
```
Frame: musou spin loop, frame 1 of 10. Spinning fast on the spot, body facing screen-right, the mug extended at arm's length at waist height, knees bent, fierce and joyful energy.
Frame: musou spin loop, frame 2 of 10. Rotated 36 degrees further, the mug sweeping toward the camera.
Frame: musou spin loop, frame 3 of 10. Rotated further, body three-quarter toward the camera.
Frame: musou spin loop, frame 4 of 10. Body facing the camera, the mug at his right side at arm's length.
Frame: musou spin loop, frame 5 of 10. Rotated further, body three-quarter turned away.
Frame: musou spin loop, frame 6 of 10. Back toward the camera (hair visible above the mask), the mug at his left side.
Frame: musou spin loop, frame 7 of 10. Rotated further, body three-quarter turned away to screen-left.
Frame: musou spin loop, frame 8 of 10. Body facing screen-left, the mug at arm's length.
Frame: musou spin loop, frame 9 of 10. Rotated further, three-quarter toward the camera.
Frame: musou spin loop, frame 10 of 10. Almost back to frame 1.
```

### dodge（回避・前転・8コマ）
```
Frame: forward roll, frame 1 of 8. Ducking: knees bent, head lowered, the mug raised above his head in the right hand to protect it.
Frame: forward roll, frame 2 of 8. Diving forward toward screen-right, hands reaching for the floor, mug held up.
Frame: forward roll, frame 3 of 8. Shoulder touching the floor, body curled, legs up, mug held high and level.
Frame: forward roll, frame 4 of 8. Upside down in the roll, curled into a ball, mug still level.
Frame: forward roll, frame 5 of 8. Back on the floor, rolling over, legs coming down.
Frame: forward roll, frame 6 of 8. Feet landing, crouched, mug coming down to chest height.
Frame: forward roll, frame 7 of 8. Rising from the crouch.
Frame: forward roll, frame 8 of 8. Back to a stance close to the idle stance.
```

### hurt（被ダメージ・4コマ）
```
Frame: hit reaction, frame 1 of 4. Jolted: upper body knocked back away from screen-right, head tilted back, left arm flung out. The mug held safely, tilted but not spilling.
Frame: hit reaction, frame 2 of 4. Stumbling back one step, knees buckling slightly.
Frame: hit reaction, frame 3 of 4. Recovering balance, leaning forward again.
Frame: hit reaction, frame 4 of 4. Back to a stance close to the idle stance.
```

### down（ひと休み・8コマ・最後で止める）
```
Frame: tired sit-down, frame 1 of 8. Swaying on his feet, exhausted, shoulders drooping, mug held loosely.
Frame: tired sit-down, frame 2 of 8. Knees giving way, starting to sit.
Frame: tired sit-down, frame 3 of 8. Dropping onto the floor in a cross-legged sit.
Frame: tired sit-down, frame 4 of 8. Sitting cross-legged on the floor, slumped, mug resting on his knee.
Frame: tired sit-down, frame 5 of 8. Lifting the mug toward the mask.
Frame: tired sit-down, frame 6 of 8. Taking a calm sip from the mug through the mask's mouth slit.
Frame: tired sit-down, frame 7 of 8. Lowering the mug, a satisfied relaxed posture.
Frame: tired sit-down, frame 8 of 8 (hold). Sitting cross-legged, relaxed and content, mug resting on his knee. Light-hearted, not painful.
```

### grab（ゴールで長押し・6コマ・ループ）
```
Frame: filling the mug, frame 1 of 6. Standing facing screen-right, leaning forward, holding the mug out at chest height under an (unseen) tap, left hand reaching forward to an (unseen) handle.
Frame: filling the mug, frame 2 of 6. Left hand pulling down the unseen handle.
Frame: filling the mug, frame 3 of 6. Watching the mug fill, head tilted, the beer level rising.
Frame: filling the mug, frame 4 of 6. Same, the mug almost full.
Frame: filling the mug, frame 5 of 6. Left hand releasing the handle.
Frame: filling the mug, frame 6 of 6. Pulling the full mug back slightly, ready to repeat.
```

### win（勝利・乾杯と小躍り・12コマ・ループ）
```
Frame: victory dance, frame 1 of 12. Raising the beer mug high above his head in celebration, left fist on his hip, proud posture.
Frame: victory dance, frame 2 of 12. Same, a small hop, feet slightly off the floor.
Frame: victory dance, frame 3 of 12. Landing, knees bent, mug still raised.
Frame: victory dance, frame 4 of 12. Stepping to the left, hips swaying, mug raised.
Frame: victory dance, frame 5 of 12. Stepping back, hips swaying the other way.
Frame: victory dance, frame 6 of 12. Turning toward the camera, toasting with the mug at head height.
Frame: victory dance, frame 7 of 12. Bringing the mug to the mask as if to drink.
Frame: victory dance, frame 8 of 12. Lowering the mug with a satisfied nod.
Frame: victory dance, frame 9 of 12. Raising the mug high again.
Frame: victory dance, frame 10 of 12. A small hop.
Frame: victory dance, frame 11 of 12. Landing with a little sway.
Frame: victory dance, frame 12 of 12. Almost back to frame 1.
```

---

## 3. 敵の共通ブロック（デザイン承認後に使う）

### 共通ブロックB: 敵のスプライト

`<NAME>` に敵の名前、`<SIZE>` `<FOOT>` `<HAIR_Y>` に仕様書の数値を入れる（警備員・警察官: 1152×1152 / 576,1072 / y=330、警備隊長・巡査部長: 1280×1280 / 640,1180 / y=300、警部: 1536×1536 / 768,1436 / y=330）。

```
Use the attached approved design sheet as the identity reference for "<NAME>". Draw ONE full-body frame of <NAME> for a high-end 2D side-scrolling beat-'em-up game.

Art style: identical to the Sobaya sprites — high-quality Japanese anime cel shading, bold clean outlines, 3 tones of shading, key light from the upper left, a strong cool-violet rim light on the right edge of the silhouette.

Canvas and framing (identical for every frame):
- Square canvas <SIZE>, flat solid magenta background (#FF00FF), no floor, no cast shadow.
- Full body visible. When standing, the point between the feet sits at <FOOT>, the top of the cap at about <HAIR_Y>.
- Camera about 20 degrees above eye level. Body faces screen-right in a three-quarter view.

PRESERVE: every costume part, color, badge shape and accessory exactly as on the design sheet, counted part by part.
Tone: comedic slapstick beat-'em-up. No blood, no wounds, no pain or fear on the face; when knocked out they look dazed and silly.
Do NOT carry over: the sheet's layout, turnaround panels, labels, color swatches or background.
No visual effects, no motion lines, no text, no extra characters. Nothing magenta on the character.
```

### 敵の動作（各行を共通ブロックBの後ろに足す）

警備員・警察官は34コマ、隊長格は intro を足して40コマ、警部は intro と special を足して55コマ。攻撃の中身は敵ごとに差し替える（下の「攻撃の中身」）。

**idle（6コマ・ループ）**
```
Frame: guarded idle, frame 1 of 6. Fighting stance facing screen-right, fists up (or baton raised for armed types), knees slightly bent, watching the opponent.
Frame: guarded idle, frame 2 of 6. Same stance, a slight bounce down.
Frame: guarded idle, frame 3 of 6. Lowest point of the bounce.
Frame: guarded idle, frame 4 of 6. Rising.
Frame: guarded idle, frame 5 of 6. Highest point, shifting weight to the front foot.
Frame: guarded idle, frame 6 of 6. Almost back to frame 1.
```
**walk（8コマ・ループ）**
```
Frame: jogging approach, frame 1 of 8. Left foot contact toward screen-right, arms in a jogging swing.
Frame: jogging approach, frame 2 of 8. Down position.
Frame: jogging approach, frame 3 of 8. Passing position.
Frame: jogging approach, frame 4 of 8. Up position.
Frame: jogging approach, frame 5 of 8. Right foot contact.
Frame: jogging approach, frame 6 of 8. Down position.
Frame: jogging approach, frame 7 of 8. Passing position.
Frame: jogging approach, frame 8 of 8. Up position.
```
**attack（7コマ・当たり4。警部は8コマ・当たり5）**
```
Frame: attack, frame 1 of 7. Wind-up of the attack (see attack type).
Frame: attack, frame 2 of 7. Starting the motion.
Frame: attack, frame 3 of 7. Mid-motion.
Frame: attack, frame 4 of 7. HIT: the attack at full extension toward screen-right at chest height.
Frame: attack, frame 5 of 7. Follow-through.
Frame: attack, frame 6 of 7. Recovering.
Frame: attack, frame 7 of 7. Back to the guarded idle stance.
```
攻撃の中身（attack の各行の後ろに付ける）:
- 警備員: `Attack type: a quick straight jab with the left fist.`
- 警察官・巡査部長: `Attack type: an overhead swing with the black baton in the right hand, striking downward in front.`
- 警備隊長: `Attack type: a big looping right hook punch.`
- 警部: `Attack type: a heavy straight right punch with a big step forward.`（8コマ目は構えに戻る）

**hit（のけぞり・3コマ）**
```
Frame: flinch, frame 1 of 3. Knocked back by a hit from screen-right: head snapped back, body bent backward, arms flung out, a comical shocked expression.
Frame: flinch, frame 2 of 3. Stumbling back, knees bending.
Frame: flinch, frame 3 of 3. Recovering toward the guarded stance.
```
**fly（吹っ飛び・6コマ）**
```
Frame: knocked flying, frame 1 of 6. Launched backward (away from screen-right) off the floor, body arched, arms and legs flailing, cap almost flying off, a silly dazed face.
Frame: knocked flying, frame 2 of 6. Higher in the air, body tilting horizontal.
Frame: knocked flying, frame 3 of 6. Peak of the flight, lying flat in the air, limbs spread like a starfish.
Frame: knocked flying, frame 4 of 6. Falling, back first.
Frame: knocked flying, frame 5 of 6. Hitting the floor flat on the back, a small bounce.
Frame: knocked flying, frame 6 of 6. Lying flat on the back on the floor, arms and legs spread, dazed (the KO pose).
```
**dizzy（目を回す・4コマ・ループ）**
```
Frame: dazed on the floor, frame 1 of 4. Lying flat on the back exactly like the KO pose, swirly cartoon eyes, tongue slightly out, harmless and funny.
Frame: dazed on the floor, frame 2 of 4. Same, head wobbling slightly to one side.
Frame: dazed on the floor, frame 3 of 4. Same, one hand twitching.
Frame: dazed on the floor, frame 4 of 4. Same, head wobbling to the other side.
```
**intro（登場・6コマ。警部は8コマ）**: 隊長格・警部のみ
```
Frame: entrance, frame 1 of 6. Striding in confidently, chest out.
Frame: entrance, frame 2 of 6. Stopping with a firm stomp.
Frame: entrance, frame 3 of 6. Adjusting the cap with one hand.
Frame: entrance, frame 4 of 6. Pointing dramatically toward screen-right at the opponent.
Frame: entrance, frame 5 of 6. Holding the point, a smug grin.
Frame: entrance, frame 6 of 6. Settling into the guarded stance.
```
警部は7〜8コマ目に `Frame: rage, the face turning red with comical anger, steam puffing from the ears, fists clenched.` を足す（体力が半分を切ったときの切り替えにも使う）。

**special（地響き・12コマ・当たり6）**: 警部のみ
```
Frame: ground stomp, frame 1 of 12. Lifting the right knee high, both arms raised.
Frame: ground stomp, frame 2 of 12. Knee at its highest, leaning back, about to stomp.
Frame: ground stomp, frame 3 of 12. Hold at the top, body tensed.
Frame: ground stomp, frame 4 of 12. Stomping down, the foot coming toward the floor.
Frame: ground stomp, frame 5 of 12. The foot just above the floor, whole body driving down.
Frame: ground stomp, frame 6 of 12. HIT: the foot slammed onto the floor, knees bent, both fists pumped down, cheeks puffed with effort.
Frame: ground stomp, frame 7 of 12. Impact hold, the body shaking.
Frame: ground stomp, frame 8 of 12. Rising slowly.
Frame: ground stomp, frame 9 of 12. Standing, shaking out the foot.
Frame: ground stomp, frame 10 of 12. Rolling the shoulders.
Frame: ground stomp, frame 11 of 12. Returning to the stance.
Frame: ground stomp, frame 12 of 12. Back to the guarded idle stance.
```

---

## 4. 敵のデザイン画（動きの素材より先に作って承認を取る）

共通ブロックC ＋ 各敵の説明。縦切り試作に必要なのは **警備員と警備隊長** の2枚。残り3枚は本制作の前でよい。

### 共通ブロックC: デザイン画

```
A character design sheet for a comedic Japanese 2D beat-'em-up game, drawn in high-quality Japanese anime cel shading (bold clean outlines, 3 tones of shading).
Layout: full-body front view, right-side view and back view of the same character standing in a neutral pose, side by side on a plain light-gray background, the same scale and height in all three views, plus a row of flat color swatches underneath.
The character is a generic, fictional security or police role for a light-hearted game: no real-world organization's emblem, insignia, logo or text anywhere; badges are simple fictional shapes.
Personality reads as earnest but slightly goofy, never scary or brutal.
No text labels, no extra characters, no background scenery.
```

- **警備員（guard）**
```
Character: a young brewery security guard. Light sky-blue short-sleeve uniform shirt (#8CB3E0), dark gray trousers, black shoes, a gray-blue peaked cap with a small silver round badge, a black belt. Average build, a slightly nervous honest face, short black hair under the cap. Bare hands.
```
- **警備隊長（captain）**
```
Character: the brewery's security captain. Deeper blue long-sleeve uniform shirt (#4D6BA6), dark trousers, a navy peaked cap with a gold star-shaped badge, white gloves, a padded vest over the shirt, broad shoulders, taller and bulkier than the guard (about 1.15 times), a thick mustache, stern but comical eyebrows.
```
- **警察官（police）**
```
Character: a fictional city patrol officer. Dark navy uniform shirt and trousers (#212F61), a navy peaked cap with a small gold fictional badge, a dark necktie, white gloves, a short black baton held in the right hand, average build, eager expression.
```
- **巡査部長（sergeant）**
```
Character: a fictional patrol sergeant. Same navy uniform family as the patrol officer but darker (#1A2652), a peaked cap with a larger gold fictional badge, a dark necktie, white gloves, a black baton, broader build (about 1.15 times the officer), a confident smirk.
```
- **警部（boss）**
```
Character: a fictional police inspector boss. A near-black three-piece suit (#2E2933), a dark necktie, white gloves, a black flat cap with a gold fictional badge, a big heavy build (about 1.3 times the officer), a square jaw, bushy eyebrows, dramatic but comical presence. Also draw one small inset of the "angry" face: red face, steam from the ears.
```

---

## 5. 背景（縦切り試作: 正門ヤードの4層とゲート）

背景ラフが承認されたら、ラフを参照画像として添付し、層ごとに清書する。描く範囲・サイズは仕様書の「背景」の表。各プロンプトの先頭に次の共通ブロックDを付ける。

### 共通ブロックD: 背景の清書

```
Use the attached approved rough as the composition and color reference. Redraw ONE layer of it as clean final background art for a high-end 2D side-scrolling beat-'em-up: Japanese anime background-art style, clean line art, cel shading with painted gradients in the sky and lights, dusk lighting with warm lamp pools and cool violet ambient light, camera about 20 degrees above eye level. Any signboards are blank plates with no text and no logos. No characters, no UI, no effects.
```

- **s1_a1/far.png**（2880×1080・透過なし）
```
Layer: FAR. Only the dusk sky (purple to orange), distant city buildings with lit windows and a faint Tokyo Tower silhouette on the left. Nothing else. Seamless on the left and right edges so it can repeat.
```
- **s1_a1/mid.png**（5760×1080・背景はマゼンタ #FF00FF、ゲーム側で抜く）
```
Layer: MID. Only the brewery wall, the two fermentation tanks behind it, the guard booth, street lamps, the chain-link fence, stacked barrels and kegs, and the parked delivery truck, spread across the whole width. Everything sits on a ground line at y=560. Fill the empty sky area and below y=560 with flat magenta (#FF00FF).
```
- **s1_a1/floor.png**（5760×1080・背景はマゼンタ）
```
Layer: FLOOR. Only the concrete yard ground from y=560 to y=1080 in gentle perspective: painted parking lines, drain grates, puddles reflecting the lamps, tire marks, and the bottom edge of the wall where it meets the ground. No standing objects. Fill everything above y=560 with flat magenta (#FF00FF).
```
- **s1_a1/front.png**（5760×1080・背景はマゼンタ）
```
Layer: FRONT. Only a few foreground objects along the very bottom of the image, below y=900: fence posts, traffic cones and a stack of crates, placed at the left end, the middle and the right end, slightly blurred and darker as if very close to the camera. Everything else flat magenta (#FF00FF).
```
- **s1_a1/gate_closed.png / gate_open.png**（1024×1080・背景はマゼンタ）
```
Object: a heavy sliding steel gate of the brewery that blocks the yard, seen from the side at the same camera angle, standing on the ground line at y=1080, yellow-and-black hazard stripes on its frame. Version A: closed. Version B: slid fully open into its post. Flat magenta (#FF00FF) everywhere else.
```

ステージ1の残り（倉庫・製造ライン）と、ステージ2・3の背景は、正門ヤードの合格後に同じ共通ブロックDで作る（描く内容は仕様書の背景の表）。

---

## 6. エフェクト（縦切り試作）

各プロンプトの先頭に次の共通ブロックEを付ける。連番は1枚ずつ生成し、ファイル名は `<名前>_<2桁>.png`。

### 共通ブロックE: エフェクト

```
A single frame of a 2D game visual effect in Japanese anime effect style (sharp cel-shaded shapes, bold color, crisp edges, no photographic smoke), on a flat solid black background (#000000) so it can be used with additive blending. Centered in the canvas, nothing cropped. No characters, no text unless stated.
```

| ファイル | サイズ | コマ | プロンプト（各コマで `frame N of M` を入れる） |
| --- | --- | --- | --- |
| hit_small | 256×256 | 5 | `A small impact spark burst: a white-hot core with 6 sharp yellow-orange spikes, frame N of 5 from appearing to fading.` |
| hit_large | 512×512 | 6 | `A large fiery impact explosion like a heavy beat-'em-up hit: a white core, orange and red flame tongues, sparks flying outward, frame N of 6 from burst to fade.` |
| foam | 512×512 | 6 | `A splash of white beer foam and amber beer droplets flying outward in an arc, frame N of 6.` |
| slash_combo1〜4, slash_charge | 768×512 | 各4 | `A curved motion trail of a swing, a pale gold arc with a white leading edge, matching a <straight jab / horizontal hook / strong lunge / overhead slam / full spin>, frame N of 4.` |
| shockwave | 1536×512 | 8 | `A ground shockwave ring expanding flat across the floor as a wide ellipse, orange dust and cracks, frame N of 8 from small to large and fading.` |
| musou_aura | 1024×1024 | 8 | `A golden aura of light surrounding an (unseen) spinning figure, swirling bands of gold and amber with sparkles, looping animation frame N of 8.` |
| stars | 256×128 | 6 | `Three cartoon yellow stars circling in an ellipse, looping animation frame N of 6.` |
| dust | 512×256 | 5 | `A small puff of floor dust kicked up by a foot, frame N of 5.` |
| sfx_doka / sfx_bashi / sfx_gogogo | 512×256 | 各1 | `Bold hand-lettered Japanese manga sound-effect text "ドカッ！" (/ "バシッ" / "ゴゴゴ"), thick black outline, orange-to-yellow fill, slightly slanted, on flat black.` |

**アイテム**（共通ブロックEではなく、キャラと同じ絵柄・マゼンタ背景）
```
A single game pickup item drawn in high-quality anime cel shading, centered on a flat magenta background (#FF00FF), 256x256: <a cold aluminum beer can with a blank label and water droplets / a small dish of green edamame pods>. No text.
```

---

## 7. UI・一枚絵

| ファイル | サイズ | プロンプト |
| --- | --- | --- |
| ui/gauge_frame.png | 1200×160 | `A game HUD frame for two horizontal gauges stacked (health on top, special below), dark metallic panel with a gold rim, anime game UI style, the gauge areas left empty and flat magenta (#FF00FF), a round slot on the left end for a face icon. No text.` |
| ui/musou_mug.png | 320×320 | `A large clear glass beer mug icon in anime cel style, empty, on flat magenta, for a HUD gauge that fills with beer. No text.` |
| ui/face_normal / face_pinch / face_musou.png | 320×320 | そば屋。共通ブロックAの「Do NOT carry over」と「PRESERVE」を付けて: `A bust portrait of Sobaya for a HUD face icon, anime cel style, in a circle, on flat magenta. Expression through body language and lighting: <confident / sweating and tired / glowing with golden energy>.` |
| ui/boss_bar.png | 1600×160 | `A boss health bar frame, dark red and black with gold trim, an empty slot for the bar and a name plate area on the left, flat magenta inside the slots. No text.` |
| ui/logo.png | 2400×800 | `A game title logo reading exactly "そば屋無双" in heavy brush-style Japanese lettering, white with a red and gold outline and a beer-foam splash accent, and a smaller subtitle reading exactly "ビール工場強奪作戦" underneath, on flat black.` |
| ui/banner_stage / banner_clear / banner_musou.png | 1600×400 | `A wide dramatic banner plate for on-screen announcements, anime game UI style, slanted, red and gold, with the exact text "<STAGE 1 / STAGE CLEAR / 無双乱舞！>", on flat black.` |
| title/title.png | 3840×2160 | そば屋。共通ブロックAの PRESERVE と Do NOT carry over を付けて: `Key visual for the title screen: Sobaya in the center-right raising his beer mug triumphantly, a crowd of fictional security guards and police officers comically flying through the air around him, the brewery yard at dusk behind, dramatic rim light, leave the left third calm and dark for the logo. Anime key-visual quality. No text.` |
| title/ending.png | 3840×2160 | そば屋。同上: `The window-side standing bar at the office opening night: a navy noren curtain, red paper lanterns, a beer server, Sobaya behind the counter toasting with his mug, and the fictional guards and police officers from the game happily drinking as customers. Warm, cheerful anime key-visual quality. No text.` |

文字を入れる素材（ロゴ・バナー・擬音）は生成で文字が崩れやすい。崩れたら文字なしで作り、文字はゲーム側（同梱フォント）か作画で入れる。

---

## 受け取ったあとにゲームへ入れる手順（こちらで行う）

1. そば屋の絵はシート照合チェックリスト8項目、敵の絵は承認済みデザイン画と1枚ずつ照合する（FAILは作り直しを依頼）
2. マゼンタ背景を抜いて透過PNGにし、キャンバス・足元の位置・縮尺がそろっているか確認する
3. `04_GAME_ASSETS/musou2d/` に正典として置き、ゲームから相対symlinkで参照する
4. ゲームに組み込んだ画面と動画を書き出して確認してもらう
