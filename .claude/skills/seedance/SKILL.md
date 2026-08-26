---
name: seedance
description: 窓際族物語のストーリー（あらすじ）からSeedance用の台本・動画生成プロンプト・セリフ音声（VOICEVOX/Irodori-TTSボイスクローン）・Codex参考画像を作成するワークフロー。ユーザーからストーリーを渡されたとき、台本やSeedanceプロンプトの作成・修正を頼まれたとき、キャラのセリフ音声の生成を頼まれたとき、クリップの参考画像（キーフレーム）生成を頼まれたときに必ず使用する。
---

# Seedance 動画制作ワークフロー

ユーザーからストーリー（あらすじ）を渡されたら、以下の7ステップを一連の流れとして実行する。

1. このラン専用の出力ディレクトリを作成する
2. **使用する全キャラクターシート・スケール参照画像をラン専用ディレクトリへ実ファイルとしてコピーする**
3. 台本＋Seedanceプロンプト（英語）の作成（各クリップに開始状態と終了状態を明記する）
4. VOICEVOX/Irodori-TTSによる全セリフの音声候補生成（等速＋1.5倍速の2テイク）→ユーザーが聴いて採用テイクを確定→最終ファイル作成（確認が取れるまで次の工程へ進まない）。この音声は**Seedanceに渡すボイスサンプル**であり、実際のセリフ音声はSeedanceが動画と一緒に生成する
5. Codexによる各クリップのキーフレーム生成（**開始フレーム＋終了フレームの2枚**を作る）
6. **生成した全キーフレームのキャラ同一性検証（必須ゲート）**: キャラクターシートと1項目ずつ照合し、identity FAILが1件でも残っている間はCapCutへ進まない
7. Seedanceへの入力対応表と、各Motion prompt内の添付宣言を`script.md`に明記する
8. 生成実行プロトコルを明記し、同梱物の機械検証を通す

### 精度の要（この方式にする理由）

動画生成は**CapCutに統合されたSeedance**を使う。**使用するSeedanceのバージョンはユーザーの指定が正**（指定がなければ現行既定の**Seedance 2.5**を使う。使用バージョンは`script.md`のProduction intentに明記する。本スキル内の技法・制約は2.0時代の実測に基づくが、2.5でも同じ前提で運用する）。CapCutは**開始フレームだけでなく「開始＋終了フレーム（Frame A / Frame B）」入力に対応**しており、両端を固定して間を補間させることで、単一フレーム/text-to-videoで起きる**キャラのブレ（identity drift）・ちらつき・構図ズレを減らせる**。さらに**参照画像を多数**渡してキャラの同一性を固定できる。本スキルはこの両方を最大限使う設計にする。中間キーフレーム入力は存在しないため、**細かい動きの制御はクリップを短く割る**ことで代替する。

## 前提となる参照ファイル

- 世界観: `01_WORLD/WORLD_BIBLE.md`
- キャラクター設定: `02_CHARACTERS/*.md`（各キャラのNG変更＝デザイン上変えてはいけない要素に注意）
- ボイスキャスト表: `02_CHARACTERS/VOICE_CAST.md`（キャラ→VOICEVOX話者・スタイルIDの正典）
- 過去の制作物: `03_SCRIPTS/`

## 0. 出力ディレクトリ（毎回、新しい同一ディレクトリにまとめる）

**プロンプト（台本ファイル）と参考画像は、毎回そのラン専用の新しい1つのディレクトリにまとめて出力する。** 従来のように台本を`03_SCRIPTS/`直下、画像を共有の`ref_images/`に分散させない。

- ディレクトリ: `03_SCRIPTS/<NN>_<slug>/`
  - `<NN>` は既存の連番の次の番号（`03_SCRIPTS/`直下・サブディレクトリの最大番号 + 1、ゼロ埋め2桁）。
  - `<slug>` は内容が分かる英語の短い識別子（小文字・アンダースコア区切り。例: `yametaro_43degrees`）。
- そのディレクトリの中に、台本兼プロンプトファイル `script.md` と、全クリップの参考画像 `*.png` を **すべて同じ階層に** 置く。画像用のサブディレクトリは作らない。
- 台本内から画像を参照するときは、同じディレクトリ内の相対パス（例: `clip1_01_ref.png`）で書く。
- **「参考画像」には生成キーフレームだけでなく、CapCutへ添付するキャラクターシート、`height_lineup.png`、小道具・環境参照もすべて含む。** 使用する参照画像を`02_CHARACTERS/`等からラン専用ディレクトリ直下へコピーし、ファイル名を維持する。正典ファイルは変更しない。
- 参照画像はsymlinkではなく**通常ファイルとして物理的に同梱する**。成果物フォルダだけを渡してもCapCut入力が完結する状態にする。
- `script.md`では同梱ファイルをbasenameだけで参照する（例: `Sobaya_sheet.png`）。`../../02_CHARACTERS/Sobaya_sheet.png`のようなラン外への相対パスは禁止する。
- キャラクターシートをラン外から参照できることを、同梱の代用にしてはいけない。1枚でも欠けていればそのランは未完成とする。
- 既存の`03_SCRIPTS/`直下の古い成果物は移動・改変しない。この新ルールは新規ランから適用する。

### 参照画像の同梱手順（必須・台本作成前に実行）

1. 全クリップの登場キャラを列挙する（画面外の声だけのキャラも、Motion promptで`@ImageN`参照するなら対象）。
2. 各キャラ設定mdの「キャラクターシート」に記載された`*_sheet.png`をラン専用ディレクトリ直下へコピーする。
3. `height_lineup.png`等をCapCut入力で使う場合も同じ場所へコピーする。
4. **同梱した`*_sheet.png`を全枚Readで開き、各キャラ設定md（`02_CHARACTERS/0N_*.md`）の「シート照合チェックリスト」と突き合わせて正典の姿を目に入れる（必須・省略禁止）。** 同定句や記憶だけで台本・プロンプト・検証を書かない。シートを開かずに進めたランは未完成とする。
5. `script.md`冒頭の`Character references`には同梱後のbasenameだけを書く。
6. 以降のキーフレーム生成とCapCut入力には、ラン専用ディレクトリ内のコピーを使う。これにより同梱漏れを制作途中で発見する。

## 1. 台本作成（deliverableはすべて英語）

`WORLD_BIBLE.md`のStory Formula（変なことを始める→巻き込まれる→少し騒ぎになる→最後は笑顔）と各キャラのNG変更を守りつつ、尺に応じてクリップ分割した台本＋Seedanceプロンプトを `03_SCRIPTS/<NN>_<slug>/script.md` に作成する。

`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。

### クリップ分割とキーフレーム設計（重要）

各クリップは**開始状態（first frame）と終了状態（last frame）を明確に区別して書く**。台本の各クリップに、次の2つを必ず記述する:

- **First frame**: そのクリップ冒頭の静止画で写っている内容（構図・キャラの位置・表情）。構図＝ショットサイズ・アングルはCamera plan（後述）の該当行に従う。
- **Last frame**: そのクリップ終端の静止画。ここまでにどう動いた結果になるか。カメラムーブのあるクリップは**ムーブ終了時の構図**で書く（push-inなら開始より寄った構図）。
- **Prop states**: そのクリップで状態が変わる小道具（グラス・瓶・食器・箱など）ごとに、First frame時点とLast frame時点の状態（中身の量、開栓/未開栓、手に持つ/置いてある、蓋の有無 等）を1行ずつ明記する。

さらに**つなぎ目を消すため、クリップNの Last frame と クリップN+1の First frame は同一の絵にする**（後述のとおり同じ画像ファイルを共有する）。小道具の状態も同様に引き継ぐ（クリップNのLast frameの状態 ＝ クリップN+1のFirst frameの状態。クリップをまたいで勝手に満杯に戻る/空になる等を起こさない）。

### Prop state ledger（全クリップ通しの状態台帳・必須）

`script.md` の冒頭（クリップ一覧の前）に、状態を持つ小道具すべての**通し状態台帳**を表で書く。行＝小道具、列＝キーフレーム境界。クリップNのLastとクリップN+1のFirstは**1つの列（セル）を共有**させる（2箇所に別々の値を書ける構造にしない。これが食い違いの物理的な防止になる）。

```
| Prop     | C1 start | C1 end = C2 start | C2 end = C3 start | C3 end = C4 start | C4 end |
|----------|----------|-------------------|-------------------|-------------------|--------|
| Beer mug | EMPTY    | EMPTY             | FULL (foam head)  | ONE SIP LOWER     | ONE SIP LOWER |
```

- 各クリップのProp states・キーフレーム生成プロンプト・Motion promptは、すべてこの台帳の該当セルと一致させる（台帳が唯一の正）。
- 台帳の**隣り合うセルで状態が変わるときは、その変化を起こす動作が画面内で見えること**。該当クリップのMotion promptにその動作（前状態→動作→後状態）が書かれていなければ、状態変化を書いてはいけない。

### 物理整合性ルール（小道具の状態遷移・重要）

状態の指定がないと、生成モデルは典型絵に寄る（例:「beer glass」→満杯のグラス、「holding a beer bottle」→ラッパ飲み）。その結果「満杯のグラスにさらに注ぐ」「ラッパ飲みした瓶からグラスに注ぐ」のような非常識な動画になる。これを防ぐため:

- **動作は必ず「前状態→動作→後状態」の形で書く。** 裸の動作だけ（"pours beer into a glass"）を書かない。両端の状態を英語で明示する: "lifts the bottle and pours beer into the EMPTY glass; by the end the glass is full with a foam head and the bottle is visibly emptier"。
- **デフォルトで典型絵になりやすい状態は、望む状態を大文字で強調して指定する**: "an EMPTY glass", "a FULL unopened bottle", "holds the bottle upright by the neck, NOT drinking from it"。
- **起きてほしくない動作は否定形でプロンプトに明記する**: "no one drinks directly from the bottle", "does not pour into an already-full glass"。開始/終了フレームの画像生成プロンプトとSeedanceのMotion promptの両方に入れる。
- **カット・場面転換・爆発/煙/変身などの演出は、小道具の状態を変える理由にならない。** 「煙に隠れている間に空になる」「場所が変わったので中身をリセット」のような**演出を口実にした状態ジャンプを台本に書くこと自体を禁止**する（過去に「ほぼ満杯のジョッキが爆発転換の後に空になる」台本を書いてしまい、ビールが突然消える動画になった）。転換後に別の状態が必要なら、(a) 転換**前に**状態を変える動作を画面内で見せる（例: 飲み干してから爆発する）、(b) 転換後も同じ状態を維持する、のどちらかにする。画面外での状態変化がどうしても必要なら、視聴者が補完できる理由をセリフ・描写で明示する。
- **論理チェック**: 台本を書き終えたらProp state ledgerを左から右へ通しで読み、(1) 状態遷移が物理的・社会常識的に成立しているか（満杯のグラスに注がない、口をつけた容器から他人のグラスに注がない、空の容器から注がない等）、(2) すべての状態変化に画面内の対応する動作があるか、の2点を確認する。

Seedanceの1クリップは4〜15秒。**動きが複雑・カメラワークが多いクリップは短く割る**（中間キーフレーム入力が無いため、割ること自体が中間制御になる）。1本のプロンプトに詰め込みすぎない。

### Scene ledger（場所・時間帯の通し台帳・必須）と場面転換の整合性ルール（昼夜ジャンプ防止・重要）

時間帯・光の指定がないと、生成モデルは**場所の典型絵の時間帯**に寄る（「izakaya」→夜の赤提灯、「office」→昼の白い光、「bar」→夜）。その結果、場所が変わった瞬間に時間帯まで勝手に変わる（過去に実際に発生: 昼の明るいオフィスでビールを飲むクリップの直後、場面転換先の居酒屋が夜景で生成され、4秒で昼→夜にジャンプする動画になった）。これを防ぐため:

- **`script.md`の冒頭（Prop state ledgerの近く）に、場面の通し台帳（Scene ledger）を表で書く。** 列＝キーフレーム境界（Prop state ledgerと同じ列構造。クリップNのLastとクリップN+1のFirstは1つの列を共有）、行＝Location / Time of day & light（必要ならWeatherも）。この台帳が場面情報の唯一の正となる。

```
## Scene ledger (location & time of day across ALL clips)

| Scene state | C1 start | C1 end = C2 start | C2 end = C3 start | C3 end |
|---|---|---|---|---|
| Location | Office desk by the window | Office desk by the window | Izakaya entrance (exterior street) | Izakaya counter (interior) |
| Time of day & light | Bright midday daylight | Bright midday daylight | Bright midday daylight, sunlit street | Midday; daylight coming through the entrance |
```

- **時間帯（昼/夕/夜）は全編を通して原則1つに固定する。** 短い動画で時間帯が変わると視聴者には転換ミスに見える。ストーリー上どうしても時間経過が必要な場合は、**時間が経ったことを画面内で視聴者に見せる**（空が夕焼けに変わっていく描写の専用クリップ、時計、経過を示すセリフ・ナレーション等）。それをせずに隣接クリップ間・クリップ内で時間帯を変えることを禁止する。
- **カット・whip-pan・爆発・場所移動などの演出は、時間帯を変える理由にならない**（小道具の「演出を口実にした状態ジャンプ禁止」と同じ原則）。場所転換クリップでは、転換先の終了フレームもScene ledgerの同じ時間帯セルに従う。
- **全キーフレーム生成プロンプトと全Motion promptに、その場面の時間帯・光の句を毎回明記する**（例: "bright midday daylight"、"warm golden sunset light"）。場所名だけを書いてはいけない。特に典型絵が夜の場所（居酒屋・バー・繁華街等）を昼に出す場合は、望む時間帯を大文字で強調し否定形も添える: "the street outside the izakaya in BRIGHT MIDDAY DAYLIGHT — it is DAYTIME, NOT night; no night sky, no darkness, the red lantern is unlit"。
- **キーフレームの目視確認に時間帯・照明を含める**: 生成した各フレームで空・窓外・照明がScene ledgerの該当セルと一致しているか、隣り合うフレーム間で昼夜・光の色が急変していないかを確認し、ズレていたら再生成する。キーフレームが夜で生成されるとSeedanceはその夜を忠実に補間してしまう。
- **論理チェック**: 台本を書き終えたらScene ledgerを左から右へ通しで読み、(1) 時間帯の変化がないか（あるなら画面内で時間経過を見せるクリップ・描写が対応しているか）、(2) 場所の変化がすべて画面内の移動・転換として描かれているか、を確認する。

### カメラワーク設計ルール（Camera plan・全クリップのショットリスト・重要）

カメラを設計しないと動画は退屈になる: 全クリップを "locked-off static camera" にすると監視カメラ的な定点映像の連続になり、かといって無指定はモデルが勝手にカメラを動かしてブレる。カメラワークは**2層で設計**する: (a) **クリップ内のカメラムーブ**（push-in等。キーフレーム両端に焼き込む）、(b) **クリップ間のショット切り替え＝カット**（つなぎ目のフレーム共有をやめ、同じ瞬間を別アングルから描いた新しい開始フレームを作る）。

- **`script.md`の冒頭（Scene ledgerの近く）に`## Camera plan`セクションを表で書く（必須）。** 行＝クリップ。この表がカメラ情報の唯一の正であり、各クリップのFirst/Last frame記述・キーフレーム生成プロンプト・Motion promptのカメラ文はすべて該当行と一致させる。

```
## Camera plan (shot list across ALL clips)

| Clip | Shot size & angle | Camera move (type + amplitude + speed) | Join from previous clip |
|------|-------------------|----------------------------------------|-------------------------|
| 1 | WIDE establishing shot, eye level | slow push-in, small amplitude | — (first clip) |
| 2 | MEDIUM two-shot, eye level | locked-off static camera | SHARED FRAME (continuous) |
| 3 | CLOSE-UP on Fukuchan, slight low angle | locked-off static camera | CUT (new angle, same moment) |
| 4 | WIDE shot, high angle | slow pull-back, medium amplitude | CUT (new angle, same moment) |
```

- **単調防止の原則**: 同じショットサイズ・同じアングル・静止カメラの組を**3クリップ以上連続させない**（寄り引きの交替、リアクションのCLOSE-UP、オチのpush-in等を入れて設計し直す）。逆に全クリップにムーブを入れるのも観づらい — 静と動を交互に置く。目安: シーンの導入はWIDE establishing、会話は寄り（MEDIUM〜CLOSE-UP）の切り返し、感情の高まり・オチはpush-in、状況の種明かし・引きのギャグはpull-back。
- **クリップ内ムーブはキーフレーム両端に焼き込む**: push-in / pull-back / pan / tilt / tracking等のムーブは、**開始フレーム＝ムーブ開始時の構図、終了フレーム＝ムーブ終了時の構図**として2枚のキーフレーム自体を違う構図で描く（生成手順はステップ3）。キーフレームが同一構図のままMotion promptだけでカメラを動かす指示をしても、両端の絵に引き戻されて中途半端な揺れにしかならない。逆に、両端の構図が違うのにMotion promptが "locked-off static camera" だと補間が破綻する — 表・キーフレーム・プロンプトの三者を必ず一致させる。
- **クリップ内ムーブの振幅上限（補間安全性）**: Frame A/B補間はカメラ位置が離れすぎるとモーフィング崩壊する。1クリップ内のムーブはsmall〜medium振幅に留める。目安: **被写体の画面内サイズ変化は約2倍まで**、pan/trackingは開始フレームの主被写体が終了フレームにも残る範囲、orbit/arcは背景の入れ替わりが起きない小角度まで。これを超える視点変更（正面→背後、寄り→俯瞰全景等）はクリップ内でやらず、**クリップ境界のCUTにする**。
- **セリフのあるクリップのカメラは控えめにする**: "locked-off static camera" または "slow push-in, small amplitude" まで。速いパン・大振幅ムーブは口元の描画を不安定にしリップシンクを壊す。ダイナミックなムーブはセリフなしクリップに置く（1クリップ1話者の分割と相性が良い: セリフクリップは寄りで静かに、間のリアクション・移動クリップで動かす）。
- **CUT（ショット切り替え）の作法**: CUTは**時間経過ゼロの視点切り替え**であり、Prop state ledger・Scene ledger・Fixture layoutの状態はCUT前後で**同一列を共有し続ける**（カットを状態変化の口実にしない — 「演出を口実にした状態ジャンプ禁止」と同じ原則）。CUT境界ではつなぎ目のフレーム共有をやめ、新しい構図の開始フレームを**前クリップの終了フレームを種に**生成する（ステップ3参照）。
- **Motion promptとの対応**: 各クリップのMotion promptのカメラ文はCamera planの該当行を「種類＋振幅＋速度」の標準記法でそのまま反映する。静止させるクリップも "locked-off static camera" と明示する（無指定はモデルが勝手に動かす）。
- `validate_run_bundle.py`が`## Camera plan`セクションの存在と、各Motion prompt内のカメラ記述を機械検証する。

### 機構小物の配置整合性ルール（ドアノブ・蝶番・スイッチ等・重要）

位置の指定がないと、生成モデルはドアノブ・蝶番・取っ手などの**動く建具・機構部品の位置を毎フレーム適当に描く**。その結果「蝶番側にノブが付く」「ドアを閉めている最中はノブがあるのに、閉まった途端に消える」等の破綻が起きる（過去に実際に発生した）。これを防ぐため:

- **開閉・可動する建具/機構小物（ドア・引き戸・窓・引き出し・冷蔵庫・ノートPC等）が映るランでは、`script.md`冒頭（Prop state ledgerの近く）に機構レイアウト台帳（Fixture layout）を書く。** 建具ごとに1行: カメラから見た蝶番側（LEFT/RIGHT）、ノブ/取っ手の位置（**必ず蝶番と反対側の端**・高さ）、開き方向（内開き/外開き・どちらへスイングするか）。この台帳は**全クリップを通して不変**であり、唯一の正とする。

```
## Fixture layout (constant across ALL clips — hinges and handles never move)

| Fixture | Hinge side (from camera) | Handle | Opens |
|---------|--------------------------|--------|-------|
| Entrance door | LEFT edge | silver lever handle on the RIGHT edge (opposite the hinges), mid-height | inward, swinging toward camera-left |
```

- **ノブ/取っ手は必ず蝶番の反対側の端に置く**（実物の建具の構造）。プロンプトでは片方だけ書かず、"hinged on its LEFT edge, with a silver lever handle on the RIGHT edge (the edge opposite the hinges) at mid-height" のように**蝶番側とノブ側を常にセットで**明示する。
- **建具が映る全キーフレーム生成プロンプトと全Motion promptに、台帳のレイアウトを毎回そのまま繰り返す。** 開いた状態の絵にも閉まった状態の絵にも書く。特に閉まる/閉まった状態では否定形まで入れる: "the lever handle stays visible on the RIGHT edge even when the door is fully closed — the handle does NOT disappear, does NOT move to the hinge side, and is NOT duplicated"。ドアが動くクリップのMotion promptには "the hinges and handle stay fixed to the same edges of the door throughout the swing" を入れる。
- **キーフレームの目視確認に金具を含める**: 生成した各フレームで (1) ノブ・取っ手が台帳どおりの側・高さにあるか、(2) 隣り合うフレーム間で蝶番・ノブの位置が動いたり消えたりしていないか、を確認し、ズレていたら再生成する。キーフレーム同士で金具位置が食い違うと、Seedanceは補間中にノブを消す・瞬間移動させる形で「辻褄合わせ」をしてしまう。

### 話者分離ルール（1クリップ1話者・重要）

Seedanceは**複数人が映るクリップでのリップシンクの話者割り当てが弱い**（2.0時代に公式にも未解決の課題とされ、実際に「福ちゃんの音声でやめ太郎の口が動く」取り違えが起きた。2.5でも同じ前提で運用する）。これを防ぐため:

- **1クリップにつき話者は1人を原則とする。** 会話の掛け合いは、話者が交代するタイミングでクリップを分割する（分割はつなぎ目共有フレームで滑らかに繋がるので尺・演出上の不利益はない）。
- 掛け合いのテンポ上どうしても1クリップに複数話者を入れる場合は、(1) 音声ファイルを発話順に分けて添付し、(2) Motion promptに話者の順番・誰がどの音声かを@メンションと見た目で明示し、(3) "the two lines do NOT overlap" を入れ、(4) **発話順に安定した話者ID（`(S1)`/`(S2)`）を各話者に振り、Motion prompt内でその話者に言及するたびに同じIDを添える**（公式H3ガイドの話者ID記法。@メンション＋同定句への追加の保険。クリップ内でIDを振り直さない。例: "Fukuchan (@Image3, the slim stylish black-haired man) (S1) speaks first; Yametaro (@Image4, the chibi man with round glasses) (S2) replies"）。それでも取り違えが出たら迷わずクリップを割る。
- 台本上は、各セリフに**話者のキャラ名＋見た目の同定句**を添える（後述「話者バインディング」参照）。

### リップシンク精度ルール（クリップ尺≒発話長・重要）

Seedanceは「話す」と指示されたキャラの口を**クリップ全体にわたって動かしがち**で、クリップ尺が発話の長さより大幅に長いと、発話の前後で無意味な口パクが空回りする。これを防ぐため:

- **セリフのあるクリップの尺は「サンプル音声wavの合計長＋約1秒」を目安にする**（実発話がクリップ尺の6割を下回る設計にしない）。無言のリアクション・ため・間はセリフ入りクリップに詰め込まず、**セリフなしの別クリップに分割**する（つなぎ目共有フレームで滑らかに繋がるので演出上の不利益はない）。
- **尺差は動画が正**: サンプルwavの実測長はあくまでクリップ尺を決める目安。Seedanceが生成した実際の発話がサンプルより長くても短くても、**生成された動画（とその音声）を正として採用する**。サンプルに合わせて動画を再生成したり尺を調整し直したりしない。
- **Motion promptに発話タイミングの拘束を必ず入れる**（話者バインディングの指示に加えて）: 話者について "begins the line almost immediately" と "the speaker's mouth moves ONLY while delivering the line — once the line ends the mouth stays CLOSED for the rest of the clip" を明記する。
- **添付するサンプルwavは前後の無音をトリムしたものにする**（ステップ2の同梱スクリプトが自動でトリムする。ユーザー提供など別途用意したwavも添付前に無音をトリムする）。長い無音は声質・話し方の参照としてのサンプル品質を下げる。

### 言語ルール（重要）

**`script.md` は全文を英語で書く。** Seedanceに渡すプロンプト（コードブロック）だけでなく、見出し・尺やアスペクト比の説明・「画面内容」「カメラ」「音」「生成メモ」などの人間向け解説も含めて、すべて英語で記述する。

例外として英語以外を使ってよいのは次のみ:

- **キャラクターのセリフ（発話内容）**: 実際に日本語で発話される台詞は日本語のまま `"..."` で引用して埋め込む（例: `shouting "島流し一択やろ！"`）。ナレーションや画面内の指定文字（温度計の「43℃」など）も同様に、実際に表示・発話される言語のまま引用する。
- **発音・読みを指定したい場合など、非英語でしか正確に表現できない理由があるとき**: その語のみ元言語で書き、必要なら英語で補足する。

理由: 日本語の説明文はSeedanceでの再現精度が落ちること、および成果物を言語横断で扱いやすくするため。

### 画面内テキスト禁止ルール（勝手な字幕・日本語表示の防止・重要）

Seedanceはプロンプト内の日本語セリフ引用や添付音声につられて、**指示していない字幕・キャプション・日本語（風）の文字を勝手に画面へ描画する**ことがある。これを防ぐため:

- **画面内に表示してよい文字は、台本が明示的に指定したものだけ**（例: 温度計の「43℃」）。それ以外の文字（字幕・テロップ・キャプション・カラオケ風歌詞・崩れた擬似日本語）は一切描画させない。
- **全クリップのMotion promptに、次の否定指示を必ず入れる**: "do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the video must contain no text at all"。画面内文字を台本が指定するクリップだけ、その文字を唯一の例外として明記する（例: "the ONLY text allowed on screen is 43℃ on the thermometer — render no other text, no subtitles, no captions"）。
- キーフレーム生成プロンプトの "no text overlay"（ステップ3）と、参照シートの文字ラベルを漏らさない指示（ステップ4）もこの方針の一部であり省略しない。
- 字幕・クレジットなど意図的なテキストが必要な場合はSeedanceに描かせず、**CapCutのテキスト機能で後載せする**（VOICEVOXクレジットと同じ扱い）。

### 音響設計ルール（環境音と劇伴の分離・重要）

音の指定がないと、生成モデルが環境音・BGMを勝手に選ぶ（場違いな音楽、不自然な無音、セリフに被る劇伴等）。公式MiniMax H3プロンプトガイド（h3-prompt-writing）の「音を2系統に分けて書く」形式を採用し、**全クリップのMotion promptの末尾に次の2つを必ず入れる**:

- **`Soundscape:`（画面内の音）**: 環境音・動作音を1〜2文の英語で具体的に書く（例: "Soundscape: quiet office room tone, distant keyboard clatter, the soft clink of the glass mug being set down"）。セリフはここに再掲しない（セリフは本文の話者バインディングで指定済み）。
- **`Music:`（劇伴＝画面外の音楽）**: 有無を必ず明示する。BGMは原則Seedanceに生成させず、必要ならCapCutで後載せするため、**既定は "Music: no background music"**。生成音に劇伴を含めたいクリップだけ、**楽器・テンポ・リズム・強弱で具体的に**書く（例: "Music: light ukulele and acoustic guitar, medium tempo, playful staccato rhythm, quiet under the dialogue"）。"happy vibes"のような抽象的なムード語だけの指定は禁止。

`validate_run_bundle.py`が各Motion prompt内の`Soundscape:`と`Music:`の記載を機械検証する。

### 画風固定ルール（Style block・全プロンプト共通・重要）

画風は思い込みで決めず、**そのランに登場する全キャラの`*_sheet.png`と直近ランのキーフレームをReadで開いて確認してから**、そのラン全体の画風固定文（Style block）を英語1行で確定する。このIPの確立した画風は「アニメ絵」ではない: 窓際メンバーの多くは実写写真ベースのシートで、実写調の空間にそのまま同居させ、無職やめたろうだけがマットな3Dチビ人形として描かれる。**シートが実写写真のキャラに`anime illustration`/`cartoon style`等を宣言してはいけない**（過去に実際に発生: 参照シートは実写なのに台本冒頭で`anime illustration look`と宣言し、かつ各プロンプトに画風の句を入れなかった結果、キーフレームチェーンがアニメ調で始まりシートに引かれて実写調へ18クリップかけてドリフトし、1本の動画の中で画風が変わってしまった）。

- **`script.md`の冒頭（Scene ledgerの近く）に`## Style block`セクションを置き、画風固定文を1行で書く**（箇条書きにせず地の文1行。逐語一致の機械検証対象になるため改行で分割しない）。
- **全キーフレーム生成プロンプトと全Motion promptに、この画風固定文を毎回一字一句同じ文で入れる。** Production intent（冒頭の説明文）に書くだけでは各生成プロンプトに反映されず、チェーン生成が参照シートの画風へ勝手にドリフトする。言い換え・要約も禁止（表記ゆれ自体がドリフトの原因になる）。
- **キーフレームの目視確認に画風を含める**: 新しいフレームを生成するたびにクリップ1の開始フレームと並べ、画風（実写/アニメ/3D調・質感・色乗り）が揃っているか確認する。ドリフトしていたら、画風固定文＋前フレーム＋シートを種にそのフレームを作り直してからチェーンを続ける。
- `validate_run_bundle.py`が`## Style block`セクションの存在と、各Motion promptへの画風固定文の逐語埋め込みを機械検証する。

### キャラ正典ルール（Character canon block・必須）

**キャラの見た目の正は`02_CHARACTERS/<キャラ名>_sheet.png`（キャラクターシート）であり、記憶でも同定句でもない。** 同定句（"a white mask with red markings"等）は短い要約にすぎず、これだけでプロンプトを書くとモデルが空白を勝手に埋める（実測: そば屋の仮面が「人間の顔＋白い顔ペイント＋赤いライン2本」になり、目穴・口のスリット・マーキング本数が全部変わった）。

- **台本を書く前に、そのランに登場する全キャラの`*_sheet.png`をReadで開く**（ステップ0の同梱手順4）。
- **`script.md`の`## Character references`に、キャラごとの`PRESERVE:`列を書く**。内容は各キャラ設定mdの「シート照合チェックリスト」から**シートで実際に確認した特徴**を英語へ落とす（形状・個数・色・配置まで数えて書く。「red markings」ではなく "four red vertical markings, two flanking each eye, plus a small black dot centered on the forehead"）。あわせて`do NOT carry over:`にシートのポーズ・パネルレイアウト・文字ラベル・背景を書く。
- **全キーフレーム生成プロンプトと全Motion promptに、そのクリップに映るキャラの`PRESERVE:`列を入れる。** 要約・言い換えは禁止（ステップ3・4の逐語ルールと同じ）。
- **崩れやすい要素には否定形を添える**（実測の崩れ方をそのまま書く）: 仮面キャラなら "the mask has TWO large black circular eye holes — NO human eyes, eyelids, eyelashes or eyebrows are visible, NO realistic nose or lips, the mouth is a single horizontal black slit"、後ろ姿・横顔のあるクリップなら "his short spiky black hair is visible from BEHIND as well — the back of his head is NOT a smooth white helmet"。
- **後ろ姿・横顔・遠景のクリップは特に念入りに書く**（正面以外はシートの参照が効きにくく、NG要素が丸ごと消える）。

### キャラクター人数の固定（増殖防止・重要）

人数の指定がないと、生成モデルは登場・退場・受け渡し・出入りの動作を**「もう1人生やす」ことで補間する**ことがある（過去に実際に発生: 「そば屋がボトルを受け取って土に還る」クリップで、立ったままのそば屋と土に潜るそば屋の2人が同時に生成され、瓶まで増殖した。キーフレーム両端は正しくても、間の補間で複製が起きる）。これを防ぐため:

- **全クリップのMotion promptに、画面内の総人数と「各キャラは1人だけ」を明記する**: 例 "Exactly four people are on screen: Yotan, Tokun, Sobaya and Fukuchan — each character appears EXACTLY ONCE; there is only ONE Sobaya in the frame at all times, he is NEVER duplicated"。
- **登場・退場・変身・物の受け渡しなど人数や配置が変わる動作のあるクリップでは、否定形まで必ず入れる**: 例 "Sobaya moves as ONE continuous person — he does NOT split into two; no copy of him remains standing while he descends into the hole"。
- **キーフレーム生成プロンプトと目視確認にも人数を含める**: フレーム内の人物数が台本と一致しているか、同一キャラが2人以上写っていないかを確認する。
- パイロット検証チェックリスト（ステップ5）でも、生成動画の**全フレーム**で人数・重複をチェックする（キーフレームが正しくても補間中だけ複製が現れることがある）。

### セリフ音声の扱い（ローカル音声はボイスサンプル・実音声はSeedanceが生成・重要）

ステップ2で生成する音声ファイル（キャラごとにVOICEVOXまたはIrodori-TTS。配役は`VOICE_CAST.md`が正）は、**Seedanceに渡すボイスサンプル（声質・話し方・セリフ内容の参照）**である。**最終動画のセリフ・ナレーション音声はSeedanceが動画と一緒に生成する**（口の動きは自身が生成する音声に自然に同期するため、リップシンクのずれが起きにくい）。**正典キャラ（`VOICE_CAST.md`に配役があるキャラ）のセリフで**サンプル音声の生成・添付を省略し、声の指定なしにSeedance任せにすることは禁止（クリップごとに声質がブレるため）。ユーザーから別途音声ファイルが渡された場合は、そのクリップに限りユーザー提供の音声をサンプルとして優先する。

**例外 — モブキャラの音声（サンプル添付なしを許可）**: `VOICE_CAST.md`に配役の無いモブキャラ・その場限りのキャラ（通行人・店員・群衆・アナウンス等）のセリフや鳴き声は、**ボイスサンプルなしでSeedanceに直接生成させてよい**。その場合は次を守る:

- CapCut inputs表のAudio行に、添付なしであることを明示的に宣言する（例: `No audio file attached; generate speech directly from the Japanese text in the motion prompt`。ナレーションも声も無いクリップは `No audio file attached; no voice, narration or caption readout`）。`validate_run_bundle.py`は`Seedance-generated`または`No audio file attached`で始まるAudio宣言を「添付なしで正」と扱う。
- Motion promptにそのモブの**声質の指定**（性別・年齢感・トーン。例: "a generic cheerful middle-aged male shopkeeper voice"）を書く。声の指定ゼロでSeedance任せにしない。
- 正典キャラと同じクリップで話す場合、話者バインディング（@メンション＋同定句＋非話者の口閉じ）は従来どおり必須。モブの声が正典キャラのサンプルに寄らないよう "the shopkeeper's voice is DIFFERENT from the attached sample @Audio1" のような分離指示を添える。
- **同一モブが複数クリップで話す場合はクリップ間で声質がブレる**前提でよいか判断する。ブレが問題になるモブは`VOICE_CAST.md`に配役を追加し、正典キャラと同じサンプル運用に昇格させる。

生成したサンプル音声は**Seedance（CapCut）生成時に添付ファイルとして渡し、「この声・この話し方でこのセリフを発話させる」よう指示する**。

- **動画が正**: Seedanceが生成した発話の長さ・タイミングがサンプルwavの実測長（Dialogue audio表のDuration）と差があっても、**生成された動画の音声を正として採用する**。サンプルに合わせて動画を作り直したり、タイムラインでサンプルwavに差し替えたりしない。サンプルの実測長はクリップ尺（Duration）を決める目安としてのみ使う。
- 台本の各クリップでは、セリフは発話内容と話者の指定として書く。引用の後に `(spoken in the voice of the attached sample @AudioN — Seedance generates the actual voice)` を付ける。
- セリフのあるクリップのMotion promptに**指示を必ず入れる**: "generate the character's voice speaking this line, matching the voice, tone and speaking style of the attached sample @AudioN; the attached wav is a VOICE SAMPLE (reference for the voice), not the final audio track"。ナレーション等の余計な音声が不要な場合は "no narration, no other voices" を添える。

### 話者バインディング（音声→キャラの紐付け・重要）

モデルはキャラ名を知らないため、名前だけ書くと**別のキャラの口が動く取り違え**が起きる。セリフのあるクリップでは以下を必ず行う:

- **@メンションで役割を固定する**: Seedance（Omni Reference）は添付ファイルを`@Image1`/`@Audio1`のようにプロンプト内で参照し役割を指定できる。Motion promptで音声サンプルと参照画像を明示的に結びつける: "ONLY Fukuchan (@Image3, the stylish man in the ...) speaks, in the voice of the sample @Audio1"。
- **話者は名前＋見た目の同定句で指定する**: キャラ名単独ではなく "Fukuchan — the slim stylish black-haired man in a black long coat" のように、参照画像から一意に分かる外見描写を毎回添える。同定句は各キャラ設定md（`02_CHARACTERS/0N_*.md`）の「プロンプト用同定句（英語）：」を正典として使い、クリップごとに言い換えない（表記ゆれ自体が取り違えの原因になる）。
- **話さないキャラは否定形で口を閉じさせる**: 画面内の非話者全員について "Yametaro (@Image4) does NOT speak — his mouth stays CLOSED, he only listens/reacts" を明記する。話者の指定だけでは足りず、非話者の禁止まで書くのが取り違え防止の肝。
- `script.md` のCapCut inputs表に `Audio` 行を追加し、添付する音声ファイル名と「ボイスサンプルとしてSeedance生成の入力に添付する」ことを明記する（記載例は後述）。
- **最終音声はSeedanceが生成した動画に埋め込まれた音声が正。** CapCutタイムラインでローカルwavを重ねたり差し替えたりしない（二重音声・リップシンクずれの原因になる）。ローカルwavはあくまで生成時のボイスサンプルであり、声が違う・聞き取れない場合はwavで補修せずクリップを再生成する。手順はステップ5「生成実行プロトコル」で必ず`script.md`に記載する。

## 2. セリフ音声の生成（全セリフ必須・2段階）

台本が完成したら、**台本中のすべてのセリフ・ナレーションの音声をローカルで生成し、ラン専用ディレクトリに保存する**（例外: `VOICE_CAST.md`に配役の無いモブキャラのセリフは、ステップ1「セリフ音声の扱い」のモブ例外に従いサンプルなしでSeedance直接生成にしてよい。その場合ローカル生成は不要）。このwavはSeedance（CapCut）生成時に**ボイスサンプルとして**添付し、Seedanceにその声・話し方でセリフ音声を生成させる（最終音声は生成された動画側が正。サンプルとの尺差は許容する）。

音声は**2段階**で作る: まず各セリフの候補として**等速と1.5倍速の2テイク**を生成してユーザーに聴いて選んでもらい、**採用テイクが確定してから**最終ファイル（正式名のwav）を用意する。**ユーザーの確認が取れるまで、最終ファイルの作成と以降の工程（キーフレーム生成・CapCut入力表の完成）へ進んではいけない**（クリップ尺Durationは採用音声の実測長に依存するため、先に進むと手戻りになる）。

### 配役（正典）

- キャラごとの使用エンジンと指定（Irodori-TTSの参照音声 / VOICEVOXの話者・スタイルID）は **`02_CHARACTERS/VOICE_CAST.md` が唯一の正**。この表にない声を勝手に割り当てない。
- **本人の声サンプルがあるキャラ（そば屋・福ちゃん・やめたろう・おかやまん・よーたん）はIrodori-TTSのボイスクローン**で生成する。参照音声は`02_CHARACTERS/<キャラ>_voice.wav`（各キャラ設定ファイルの「声ファイル：」に記載）。事前学習は不要で、**合成のたびに参照音声を渡す**ゼロショット方式。
- それ以外のキャラはVOICEVOXで生成する。感情差分スタイルはシーンに合わせてVOICE_CAST.mdの範囲で選んでよい。
- **ゆめみんは言葉を話さない**設定のため、台本にセリフ（言葉）を書かない。鳴き声（「きゅー！」「ぼんっ！」等）が必要な場合はVOICE_CAST.mdの指定voice（ずんだもん）で鳴き声テキストを生成する。

### 生成手順 — フェーズ1: 候補生成（等速＋1.5倍速）

1クリップ内のセリフ1つ（1人の連続した発話）につき、まず**等速と1.5倍速の2候補**を生成する。候補ファイル名は`clipN_lineM_<char>_1.0x.wav` / `clipN_lineM_<char>_1.5x.wav`。エンジンに応じて同梱スクリプトを使い分ける:

```
# Irodori-TTSのキャラ（そば屋・福ちゃん・やめたろう・おかやまん・よーたん）
.claude/skills/seedance/irodori_speak.sh "セリフテキスト" 03_SCRIPTS/<NN>_<slug>/clipN_lineM_<char>.wav 02_CHARACTERS/<キャラ>_voice.wav [シード値] [話速倍率]

# そば屋のみ: クローン生成後にモンスターボイス加工を必ずかける（in-place。VOICE_CAST.md参照）
.claude/skills/seedance/sobaya_monsterize.sh 03_SCRIPTS/<NN>_<slug>/clipN_lineM_sobaya.wav

# VOICEVOXのキャラ
.claude/skills/seedance/voicevox_speak.sh "セリフテキスト" 03_SCRIPTS/<NN>_<slug>/clipN_lineM_<char>.wav <スタイルID> [話速]
```

- **等速候補**: 既定シードで生成し、出力される実測長（トリム後）を控える。
- **1.5倍速候補**: Irodori-TTSは話速倍率（duration-scale）ではなく**第6引数の尺直指定**で作る（短文では尺予測の余りが大きく、倍率だと等速より長い間延びテイクになることがあるため）。指定値は **`(等速実測長 − 0.3) ÷ 1.5 ＋ 0.3` 秒**（トリムが残す前後の無音約0.3秒は速度に関係なく一定なので、発話部分だけを1.5倍速換算する。例: 等速1.22秒 → 0.91秒）。VOICEVOXは第4引数の話速`1.5`で作る。
- **語尾切れチェック**: 1.5倍速候補は末尾が自然に減衰して終わっているか確認する（波形末尾の音量がおおむね-40dBまで落ちて終わっているか。大きい音のまま終わっていたら語尾が切れているので、尺を+0.05〜0.1秒して再生成する）。
- そば屋は両候補ともmonsterize加工まで済ませてから提示する（正典の声は加工後のため）。
- VOICEVOXはエンジン未起動なら自動起動する（設置場所は`~/voicevox_engine/`）。Irodori-TTSは`~/irodori_tts`に設置済みであること（無いマシンではスクリプトのエラーメッセージに従い**最新版を**セットアップする。1文あたり数十秒〜数分かかる）。
- **Irodori-TTSのバージョン**: `irodori_speak.sh`が実行時に上流（GitHub）を確認し、新バージョンが公開されていれば自動で更新する（チェックは24時間に1回）。使用モデルも上流の推奨最新チェックポイントを自動選択する。**モデルが変わるとシードによる過去テイクの再現はできなくなる**ため、過去ランのテイクを再現したいときは`IRODORI_TTS_CHECKPOINT=<当時のモデル>`（Dialogue audio表のmodel記録参照）を指定して実行する。自動更新を止めたいときは`IRODORI_TTS_NO_UPDATE=1`。
- 両スクリプトは合成後に**前後の無音を自動トリム**する（先頭約0.1秒・末尾約0.2秒だけ残す。長い無音はSeedanceの口パク開始位置を狂わせるため）。Dialogue audio表に記録する再生時間はトリム後の値を使う。
- **ファイル名**: 候補は`clipN_lineM_<char>_1.0x.wav` / `clipN_lineM_<char>_1.5x.wav`、確定後の最終ファイルは`clipN_lineM_<char>.wav`（N=クリップ番号、M=クリップ内の発話順、char=キャラ名小文字。例: `clip1_line2_sobaya.wav`）。台本ファイル・画像と同じ階層に置く。
- 生成テキストは**実際に発話される日本語のセリフそのまま**を渡す（英訳やローマ字にしない）。イントネーションがおかしい場合は読み仮名に直したテキストで再生成してよい（台本上の表記は変えない）。
- Irodori-TTSは生成ごとに揺らぎがある。**再生成して選び直したいときはシード値（第4引数）を変えて数候補作る**。良い結果のシードは`script.md`のDialogue audio表に記録しておくと再現できる。
- **Irodori-TTSの話速は第5引数の倍率で調整できる**（1.0=等速、1.2=1.2倍速。内部で`infer.py`の`--duration-scale=1/倍率`に変換され、モデル自体が早口で生成するためピッチは変わらない）。テンポの良い掛け合いは1.2前後が目安。1.5以上は不自然になりやすいので、聴いて確認してから採用する。使った倍率はシードと同様にDialogue audio表へ記録する（例: `seed 42, speed 1.2x`）。
- **短いセリフは話速倍率が効かない（等速より長くなる）ことがある**。倍率はモデルが予測した生成尺に掛かるため、短文で尺予測が実発話より大幅に長いと、縮めた後の尺でもまだ余白があり、モデルが間延びした別テイクで埋めてしまう。その場合（および1.5倍速候補を作るとき）は**第6引数で尺（秒）を直接指定する**（`--seconds`に渡り、話速倍率より優先。第5引数は`""`で飛ばす）。指定値は **`(等速実測長 − 0.3) ÷ 欲しい倍率 ＋ 0.3` 秒**。例: 等速1.22秒を1.5倍速にする → `irodori_speak.sh "セリフ" out.wav ref.wav 7 "" 0.91`。使った尺はDialogue audio表へ記録する（例: `seed 7, seconds 0.91`）。
- スクリプトが出力する**再生時間（秒）を`script.md`のDialogue audio表に記録する**。クリップ尺はセリフの合計時間より長くしつつ、**「音声wavの合計長＋約1秒」を目安に詰める**（ステップ1「リップシンク精度ルール」参照）。尺に収まらない場合はクリップを延ばすか、話速を上げる（VOICEVOXは第4引数、Irodori-TTSは第5引数）。
- 生成後、各wavを再生確認できない環境でも、少なくとも全ファイルの存在と再生時間の妥当性（0.5秒未満や異常に長いものがないか）を確認する。

### 生成手順 — フェーズ2: ユーザー確認（必須ゲート）

- 全セリフの候補（等速＋1.5倍速）が揃ったら、候補wavを**ユーザーが聴ける形で提示し**（ファイル送付等）、セリフごとにどちらを採用するか確認する。提示時はセリフ・キャラ・速度・実測長の一覧を添える。
- 別の速度（1.2倍等）・別シードの要望が出たら、追加候補を生成して再提示する。
- **採用テイクの確認が取れるまで、正式名の最終ファイル作成・キーフレーム生成（ステップ3）・CapCut入力表の完成（ステップ4）へ進んではいけない。**

### 生成手順 — フェーズ3: 確定（最終ファイルの用意）

- 採用テイクを正式名 `clipN_lineM_<char>.wav` にコピーして最終ファイルとする。
- Dialogue audio表には**採用テイクのパラメータ（model、seed、speedまたはseconds）と実測長**を記録する（例: `Irodori-TTS (Irodori-TTS-v4.1-Small, ref: Yametaro_voice.wav, seed 7, seconds 0.91)`。modelは`irodori_speak.sh`のOK行に出力される。モデルが変わるとシード再現ができないため必ず残す）。
- 不採用の候補ファイル（`_1.0x.wav` / `_1.5x.wav`）はラン専用ディレクトリから削除する（CapCut入力表が参照しないファイルを成果物に残さない）。

### script.mdへの記載（Dialogue audio表・必須）

`script.md`の冒頭（Prop state ledgerの近く）に、全セリフの通し表を書く（英語。セリフ本文のみ日本語のまま）:

```
## Dialogue audio (voice SAMPLES pre-generated locally — attach to Seedance, which generates the actual dialogue voice; the video's audio is final)

| File | Clip | Character | Voice (engine) | Line (ja) | Duration |
|------|------|-----------|----------------|-----------|----------|
| clip1_line1_sobaya.wav | 1 | Sobaya | Irodori-TTS (Irodori-TTS-v4.1-Small, ref: Sobaya_voice.wav, seed 42) + monsterize | 快適です！ | 1.8s |
| clip1_line2_yotan.wav  | 1 | Yotan  | VOICEVOX (style 100) | ロックだぜ。 | 1.5s |
```

### VOICEVOXクレジット表記（動画内表示・必須）

VOICEVOXの利用規約により、**VOICEVOXの声を1つでも使った動画には、動画内（画面内）に使用キャラクターのクレジット表記を必ず入れる**（概要欄だけで済ませない）。**ボイスサンプルとして使った場合も対象とする**（最終音声がSeedance生成でも、その声はVOICEVOX話者由来のため）。

- `script.md`末尾に `## Credits` セクションを必ず書き、使用したVOICEVOX話者の一覧を記載する（例: `VOICEVOX:白上虎太郎 / VOICEVOX:ずんだもん`。話者名の対応は`VOICE_CAST.md`参照。Irodori-TTSのキャラはクレジット不要）。
- 同セクションに、**CapCut編集時に動画内へクレジットを表示する指示**を明記する: 動画末尾のエンドカード、または最終クリップへのテキストオーバーレイとして、上記のクレジット文字列をそのまま表示する（例: `On-screen credit (add in CapCut as end-card/overlay text): VOICEVOX:白上虎太郎 / VOICEVOX:ずんだもん`）。
- クレジットはSeedanceに画像・プロンプト経由で描画させない（文字が崩れるため）。**必ずCapCutのテキスト機能で載せる**。

## 3. Codexによるキーフレーム生成（開始＋終了の2枚）

Seedance用プロンプトを作成したら、`codex` CLIの画像生成ツールで各クリップの**開始フレームと終了フレームの2枚**を生成し、**ステップ0で作成したラン専用ディレクトリに保存する**。これがSeedanceの First-Last-Frame 入力にそのまま渡る本番アセットになる。

### 枚数とファイル名

- **1クリップにつき開始フレーム1枚＋終了フレーム1枚の計2枚**を生成する（従来の「loose3枚」は廃止）。
- ファイル名は役割が分かる形にする: `clipN_start.png` / `clipN_end.png`（Nはクリップ番号）。
- 保存先は必ずラン専用ディレクトリ `03_SCRIPTS/<NN>_<slug>/` 内。台本ファイルと同じ階層に置く。

### 生成順序（整合性を壊さないため必須）

キーフレーム同士が食い違うとSeedanceの補間がモーフィング崩壊を起こすため、**必ず前の絵を種にして次の絵を作る**（ゼロから独立生成しない）。

1. **クリップ1の開始フレーム**を、登場キャラ全員の参照画像を`-i`で渡して生成する（構図はCamera planの該当行のショットサイズ・アングルで指定する）。
2. **クリップ1の終了フレーム**は、たった今作った**クリップ1の開始フレームを`-i`に加えて**img2img生成する（キャラ参照画像も引き続き渡す）。カメラが静止のクリップは「同じ絵のまま、状態だけ終了状態に変える」。**カメラムーブのあるクリップは、構図もムーブ終了位置へ変える**（例: push-inなら「同じシーンを一歩寄ったMEDIUM shotで」）— 変えるのは Camera plan が指示する構図差＋動きが変える部分だけで、それ以外（キャラ・画風・光・場所・小道具の状態）は維持する。
3. **クリップ2の開始フレーム = クリップ1の終了フレーム**（Camera planのJoin列が`SHARED FRAME`のとき）。ここは**新規生成せず同じ画像ファイルをコピー/参照して共有する**（つなぎ目消し）。Join列が`CUT`のクリップは共有せず、**前クリップの終了フレームを種に**「THE SAME scene at THE SAME moment, rendered from a NEW camera position: <新しいショットサイズ・アングル>」で新規生成する（時間経過ゼロ: 小道具の状態・時間帯・キャラの位置関係は種画像と完全に同一に保つ）。
4. 以降のクリップも 開始→終了 の順で、前フレームを種にチェーンしていく。
5. **ズーム系（push-in / pull-back）の寄り側フレームはクロップで作るのが最も安定**: 広い方の構図のフレームから、被写体中心に同アスペクト比でクロップして元解像度へ拡大する（ImageMagick/ffmpeg等。クロップ倍率は解像感が保てる約2倍まで）。2枚が画素レベルで同一シーンになるため補間が崩れない。**push-in**は開始（広）→終了（寄り）なので、終了フレームを開始フレームのクロップで作れる（生成不要・最優先で使う）。**pull-back**は終了側が広くなるため、開始フレームがまだ自由なとき（クリップ1、またはJoin列が`CUT`のクリップ）に限り「広い終了フレームを先に生成→開始フレームをクロップで切り出す」が使える。開始フレームが前クリップとの共有で固定済みのpull-backは、広い終了フレームを開始フレーム種のimg2img（引きの構図へ変える編集）で生成する — 種画像に無い周辺を描き足す編集は崩れやすいので、崩れる場合はpull-backをCUT境界に移すか設計を見直す。

### キャラクター参照画像（同一性の固定）

- **そのクリップに登場するキャラクター全員の参照画像を`-i`で渡す**。各キャラの**第一参照はキャラクターシート**`02_CHARACTERS/<キャラ名>_sheet.png`（多面図モデルシート: 三面図＋NG要素クローズアップ＋表情/アクション差分＋身長比較＋カラーパレット。各キャラ設定mdの「キャラクターシート：」に記載）。三面図は横顔・後ろ姿・振り向きのカットで、クローズアップはNG要素（仮面・触手・ウクレレ等）の維持に、表情差分は演技時の顔崩れ防止に効く。単体参照画像（「画像ファイル：」記載）は、シートで再現が甘い場合に追加で渡す。
- 正典のシートをラン専用ディレクトリへコピーした後は、`codex exec -i`にも同梱コピー（`03_SCRIPTS/<NN>_<slug>/<Name>_sheet.png`）を渡す。正典パスを直接使って同梱確認を迂回しない。
- プロンプト文中で「Image N: <キャラ名> reference — keep face/design and NG-change elements consistent」のように役割を明記し、NG変更対象（そば屋の仮面/たこさんの触手/とーくんのウクレレ等）を維持させる。

### コマンド例（クリップ1・そば屋/とーくん/よーたん/福ちゃん/無職やめたろう登場）

開始フレーム:
```
codex exec -s workspace-write --enable image_generation \
  -i 03_SCRIPTS/<NN>_<slug>/Sobaya_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Tokun_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Yotan_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Fukuchan_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Yametaro_sheet.png \
  "Use your image generation tool to create the FIRST-FRAME still of a video shot. Input images Image 1..5 are character sheets (front/side/back turnarounds of each character; Sobaya: keep face/mask/build; Tokun: keep aloha/hat/ukulele; Yotan: keep blond/guitar/rock outfit; Fukuchan: keep stylish outfit; Yametaro: keep design) — identity/design references only, keep every face/design and NG-change element consistent. Prompt: <English scene description of the clip's START state, excluding dialogue and camera-work notation>. <the run's Style block line, verbatim from ## Style block>. Single still frame, no text overlay. Save as 03_SCRIPTS/<NN>_<slug>/clip1_start.png."
```

終了フレーム（開始フレームを種にする）:
```
codex exec -s workspace-write --enable image_generation \
  -i 03_SCRIPTS/<NN>_<slug>/clip1_start.png \
  -i 03_SCRIPTS/<NN>_<slug>/Sobaya_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Tokun_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Yotan_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Fukuchan_sheet.png -i 03_SCRIPTS/<NN>_<slug>/Yametaro_sheet.png \
  "Use your image generation tool to create the LAST-FRAME still of the same shot. Image 1 is this clip's start frame — keep the same characters, art style, lighting and location. <if the Camera plan row is static: 'Keep the framing identical; change ONLY what the motion changes.' / if the camera moves: 'Reframe to the camera's END position per the Camera plan — e.g. the same scene from slightly closer, MEDIUM shot on Sobaya — and change ONLY that framing plus what the motion changes.'> Images 2..6 are character sheets (front/side/back turnarounds) — identity/design references only, keep every face/design and NG-change element consistent. Prompt: <English scene description of the clip's END state>. <the run's Style block line, verbatim from ## Style block>. Single still frame, no text overlay. Save as 03_SCRIPTS/<NN>_<slug>/clip1_end.png."
```

### ポイント

- **Codexで生成するのは静止画のキーフレームPNGのみ。** 参考動画（モーション参照用のwebm/mp4など、動画ファイル全般）はCodexでは作らない。
- `--enable image_generation` と、プロンプト内での明示的な "Use your image generation tool" を必ず両方指定する（省くとPythonの簡易描画にフォールバックすることがある）。
- 終了フレーム生成では**開始フレームを必ず`-i`の先頭に入れ**、「framing/lighting/locationは維持、動きが変える部分だけ変更」と指示する。これが崩壊防止の肝。
- クリップ間で同じ絵を共有できるときは**再生成せずファイルを使い回す**（生成ゆらぎを持ち込まない）。
- **セリフのあるクリップのキーフレームには話者を視覚的に示す**: 話者は口を開けて話している最中の状態（ジェスチャー含む）で描き、非話者は口を閉じた状態で描く（例: "Fukuchan is mid-speech with his mouth open; Yametaro's mouth is closed, listening"）。キーフレーム自体が「誰が話しているか」の最も強いシグナルになり、リップシンクの取り違えを防ぐ。生成後の目視確認でも話者の口の開閉をチェックする。
- **生成した1枚ごとに、そのクリップに映る全キャラの`*_sheet.png`をReadで開いた状態でキャラ同一性を照合する（必須・最優先）。** 照合項目は各キャラ設定md（`02_CHARACTERS/0N_*.md`）の「シート照合チェックリスト」の**全項目**。生成画像を眺めて「だいたい合っている」で通さず、項目を1つずつ読み上げてPASS/FAILを付ける。**1項目でもFAILなら、その場でチェーンを止めて再生成する**（崩れたフレームを種にすると下流が全部崩れる）。実測の崩れ方（この順で疑う）:
  - **仮面が人間の顔になる**: 目穴に人間の目・まぶた・まつげが描かれる、鼻・唇が写実的に出る、口のスリットが消える、赤いマーキングの本数・左右対称性が変わる。
  - **後ろ姿・横顔でNG要素が消える**: 後頭部の髪が消えてつるつるの白いヘルメット状になる、触手・ウクレレ・ギターがフレーム外の言い訳で消える。
  - **体型が別人になる**: 100kgの巨漢が細身のボディビルダーになる、実写等身のキャラがチビ化する、チビキャラが等身大になる。
  - **色が正典から外れる**: グレーの肌が肌色に戻る、金髪が黒髪になる、衣装の色が変わる。
  - **衣装が丸ごと入れ替わる**: 白Tシャツがスーツになる、他キャラのストラップ・名札が移る、参照画像のロゴ・文字が顔や衣服へ焼き込まれる。
- 画像生成プロンプトには台本のProp states（グラスの中身の量、瓶の持ち方等）・Fixture layout（蝶番側・ノブ側・開き方向）・**Scene ledgerの時間帯・光の句**（例: "bright midday daylight"）・**Camera planのショットサイズ・アングル句**（例: "WIDE establishing shot, eye level"）・**画風固定文（`## Style block`の1行・逐語）**・**画面内の人数指定**をそのまま含める。**生成後は各画像をReadで開き、小道具の状態がProp state ledgerの該当セルと一致しているか、建具の蝶番・ノブがFixture layoutどおりの側にあるか、時間帯・照明がScene ledgerの該当セルと一致しているか、構図（ショットサイズ・アングル）がCamera planの該当行と一致し、ムーブのあるクリップは開始/終了フレームの構図差がムーブどおりか（push-inなのに同一構図になっていないか、逆に振幅が大きすぎて別シーンに見えないか）、人物数が台本と一致し同一キャラが重複していないか、画風がクリップ1の開始フレームと揃っているか目視確認する**（例: 開始フレームのグラスが空であるべきなのに満杯で描かれていないか、瓶に口をつけていないか、閉まったドアのノブが蝶番側に付いたり消えたりしていないか、昼の場面なのに夜景・夜空で描かれていないか、アニメ調で始まったチェーンが実写調に変わっていないか）。ズレていたら再生成する。キーフレームが間違っているとSeedanceは間違った状態間を忠実に補間してしまう。
- 全キーフレーム生成後、**台帳（Prop state ledger・Scene ledger）の1行ごとに全フレームを時系列で見比べる最終チェック**を行う: 隣り合うフレーム間で小道具の状態が変わっている箇所すべてに、そのクリップのMotion prompt内の対応する動作があるか、時間帯・場所が変わっている箇所すべてに画面内の移動・時間経過の描写が対応しているかを確認する。動作なしに状態が飛んでいる境界が1つでもあれば、該当フレームを再生成するか台本を直してから次の工程に進む。
- 保存先は必ず `03_SCRIPTS/<NN>_<slug>/` 配下。
- ユーザーからストーリーを渡された際は、台本・Seedanceプロンプト作成に続けて、このルール（クリップごとに開始＋終了の2枚、前フレームを種にチェーン、キャラ参照を必ず添付、つなぎ目は共有）に沿ってキーフレームも生成する。

## 3.5 キーフレーム検証（必須ゲート・CapCutへ進む前に必ず通す）

全クリップのキーフレームが出揃ったら、**CapCutで1本も動画を生成する前に**共通スキル **`/image-validation`**（`.claude/skills/image-validation/SKILL.md`）を実行する。キーフレームの誤りはSeedanceが忠実に補間・増幅するため、ここで潰さないと動画側では直せない。

- 対象は`03_SCRIPTS/<NN>_<slug>/`の全`clipN_start.png`／`clipN_end.png`。
- フレームごとのチェックリストには、`/image-validation`のステップ2の全観点に加えて、**そのフレームに映る全キャラの「シート照合チェックリスト」（各キャラ設定md）を1項目1行で必ず展開する**。「NG要素があるか」という粗い1行にまとめない。
- **キャラ同一性のFAILはブロッキング**: 1件でも残っている間はCapCutでの動画生成に進まない（`fix_list.md`確定 → 上流から再生成 → 該当フレームだけ再検証、で閉じる）。
- Ollamaが無い環境ではVLM検証をスキップしてよいが、その場合は**全フレーム・全項目をReadでの目視照合で行い**、レポートに「VLM検証は未実施」と明記する（`/image-validation`冒頭の規定と同じ）。
- 検証を実施せずに「問題なし」と報告してはいけない。

## 4. CapCut（Seedance）への入力対応表

動画生成は**CapCutに統合されたSeedance（ユーザー指定のバージョン。指定がなければ現行既定の2.5）**で行う。CapCutは**開始フレーム（Frame A）と終了フレーム（Frame B）のデュアル参照**に対応し、参照画像も多数渡せる。`script.md`の各クリップに、**CapCutの各スロットへ何を渡すか**の対応表を必ず書く（ユーザーがそのまま設定できるようにするため）。

各クリップの記載例（英語で書く）:

```
### CapCut inputs (Clip 1)
- Start frame (Frame A): clip1_start.png
- End frame (Frame B):   clip1_end.png
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = Sobaya_sheet.png → Sobaya (the hulking 180cm/100kg masked man)
  - @Image2 = Tokun_sheet.png → Tokun (the chubby 165cm man in straw hat and aloha shirt)
  - @Image3 = Yotan_sheet.png → Yotan (the slim 170cm blond rocker)
  - @Image4 = Fukuchan_sheet.png → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image5 = Yametaro_sheet.png → Yametaro (the chibi cartoon man with round glasses)
- Motion prompt: <the clip's Seedance prompt — describe the motion BETWEEN the two frames as explicit state transitions (e.g. "pours beer into the EMPTY glass until it is full; no one drinks from the bottle"); camera written as type + amplitude + speed (or "locked-off static camera"), matching this clip's Camera plan row; dialogue kept in original language; end with the sound design lines "Soundscape: <ambient/action sounds>" and "Music: no background music">
- Duration: 5s / Aspect: 16:9
```

- **開始/終了フレームは必ず両方セット**する。片方だけだと単一フレームからの外挿になりブレやすい。
- **Motion promptは「そのまま貼れる完成形」で書き、実行時の要約・短縮を禁止する。** `script.md`のMotion promptがCapCutに入力される最終文字列そのものであり、生成実行者（人間・エージェント問わず）が独自に圧縮・言い換えしてはならない（過去に要約で開始/終了状態・プロップ・NG変更の制約が欠落し、整合性が崩れた）。プロンプトが長すぎて入らない・守られない場合は、要約するのではなく**台本に戻ってクリップを分割**し、1本あたりの情報量を減らす。
- **全クリップのMotion promptに画面内テキスト禁止の否定指示を必ず入れる**（ステップ1「画面内テキスト禁止ルール」参照）: "do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the video must contain no text at all"。台本が画面内文字を指定するクリップは、その文字だけを唯一の例外として明記する。`validate_run_bundle.py`がこの記載（"on-screen text"への言及）を機械検証する。
- **全クリップのMotion promptに、Scene ledgerの時間帯・光の句を必ず入れる**（ステップ1「Scene ledger」参照）: 例 "bright midday daylight"。場所転換のあるクリップは転換先の時間帯まで明示し、典型絵が別の時間帯の場所には否定形を添える（"it is DAYTIME, NOT night"）。`validate_run_bundle.py`が`## Scene ledger`セクションの存在と、各Motion prompt内の時間帯語（daylight/daytime/midday/night等）を機械検証する。
- **全クリップのMotion promptに、音響指定（`Soundscape:`と`Music:`）を必ず入れる**（ステップ1「音響設計ルール」参照）。既定は "Music: no background music"。`validate_run_bundle.py`が両方の記載を機械検証する。
- **全クリップのMotion promptに、画風固定文（`## Style block`の1行）を一字一句同じ文で入れる**（ステップ1「画風固定ルール」参照）。`validate_run_bundle.py`が逐語一致を機械検証する。
- **全クリップのMotion promptに、画面内の総人数と「各キャラは1人だけ」を入れる**（ステップ1「キャラクター人数の固定」参照）。登場・退場・受け渡しのあるクリップは複製禁止の否定形まで入れる。
- **カメラワークは「種類＋振幅＋速度」の標準記法で書き、`## Camera plan`の該当行と一致させる**（記法は公式H3プロンプトガイド由来）: 例 "the camera pushes in with small amplitude at slow speed"、"slow lateral tracking shot, small amplitude"。使える種類の語彙: push in / pull back / pan left・right / tilt up・down / lateral tracking / orbit (arc) / crane up・down / subtle handheld sway。"dynamic camera"のような曖昧語だけの指定はしない。カメラを動かさないクリップは "locked-off static camera" と明示する（無指定だとモデルが勝手にカメラを動かす）。**全クリップをlocked-off staticにしない**（ステップ1「カメラワーク設計ルール」の単調防止原則）。カメラ文はキーフレーム両端の構図差と必ず一致させる（両端が同一構図なのにpush-inを書かない、構図が違うのにstaticを書かない）。`validate_run_bundle.py`が各Motion prompt内のカメラ記述を機械検証する。
- **Durationは必ず明示設定する。** CapCut側のデフォルト尺（約8秒）のまま生成しない。対応表のDuration値を毎クリップ設定し、生成後に実尺が一致しているか確認する（全クリップが同じ約8秒になっていたらデフォルト尺のまま生成された兆候）。セリフのあるクリップのDurationは**「サンプル音声の合計長＋約1秒」**を目安にする（ステップ1「リップシンク精度ルール」参照。Seedanceが生成した実発話がこの目安とずれても動画を正とする）。
- 参照画像は**必要な枚数だけ渡してよい**（CapCut/Seedanceは多数の参照画像を受け付ける）。登場キャラ全員分＋必要なら小道具・環境の参照を足して同一性を固める。プロンプト側で「これらは identity/design reference であって構図ではない」と役割を明記する。
- **Reference images表に書いた全ファイルはラン専用ディレクトリ直下に実在しなければならない。** 表だけ書いて実ファイルを同梱しない状態は禁止する。
- **キャラの参照はキャラクターシート`02_CHARACTERS/<キャラ名>_sheet.png`を第一に使う**（多面図モデルシート。複数アングル＋NG要素クローズアップ＋表情差分を1枚で渡せるため、横顔・後ろ姿・演技でのidentity driftに強い）。プロンプトには "Image N: <name>'s character model sheet — turnaround, detail close-ups and expressions of the SAME character, identity/design reference only, NOT a composition reference" のように役割を明記する。参照は画風の揃ったものだけを混ぜる（実写写真とアニメ調シートを同時に渡すと折衷して顔が変わるため、原則シート側に統一する）。
- **参照ごとに「保持する属性 / 引き継がない属性」を列挙する**（公式Ref2VAガイドのretention分析由来）: 役割宣言（identity/design reference only）に加えて、何を維持し何を持ち込まないかを明示すると、シートのポーズ・背景・パネルレイアウトが動画に漏れるのを防げる。例: "@Image1 = Sobaya_sheet.png — PRESERVE: face, mask, body build, outfit and its colors (all NG-change elements); do NOT carry over: pose, camera angle, sheet background or panel layout"。**PRESERVE側にはそのキャラのNG変更要素を必ず含める。**
- **シート上の文字ラベルの扱い**: シートには「SOBAYA」「MASK」等の短い英語ラベルが入っており、これは部位とキャラ名の紐付けを強めるため意図的なもの（実運用で精度向上が確認されている）。ただし**補間対象になるキーフレーム（clipN_start/end.png）には文字を入れない**方針は変わらない。Motion promptに "the reference sheets' text labels must NOT appear in the video" を入れておくと安全。
- **シートとキャラの紐付けを対応表とプロンプトの両方で明示する**: 対応表のReference imagesは「@ImageN = ファイル名 → キャラ名（短い同定句）」の形で1行ずつ書く。Motion prompt内でキャラに言及するときは、毎回「キャラ名＋同定句＋@ImageN」で書く（例: "Sobaya (@Image1, the hulking masked man) lifts the mug"）。同定句は各キャラ設定md（`02_CHARACTERS/0N_*.md`）の「プロンプト用同定句（英語）：」が正典。年齢・身長・体格などの設定はシート画像に文字で書き込まず、この同定句としてプロンプト側で渡す（画像内の文字は動画に漏れて崩れるリスクがあり、モデルも文章仕様を確実には読まないため）。
- **各Motion promptの冒頭に、添付必須ファイルをファイル名付きで再宣言する。** 対応表の外に書いただけでは不十分。次の形式で、該当クリップの全`@ImageN`を列挙する:

```
Required attached reference files: @Image1 = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Yotan_sheet.png — Yotan's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation.
```

- Motion prompt中で`@ImageN`を使う場合、その同じプロンプト内の`Required attached reference files:`行に、`@ImageN = 実ファイル名`と役割が必ず存在しなければならない。名前＋外見同定句だけでは添付宣言の代用にならない。
- **複数キャラが同時に映るクリップ**では、相対的な体格差を固定するため、身長比較画像`02_CHARACTERS/height_lineup.png`（全キャラ横並び・文字なし）をスケール参照として追加で渡してよい。プロンプトに "@ImageN is the height/scale reference for relative body sizes — NOT a composition reference" と役割を明記する。
- クリップをまたぐつなぎ目は、**前クリップの Frame B と次クリップの Frame A を同一画像**にすることで消す（ステップ3のチェーンで担保）。
- **（上級）動きの誘導を強めたいクリップ**では、`04_GAME_ASSETS/voxel`の該当キャラGLBをThree.jsで動かして書き出した短い動画（webm/mp4、合計15秒以内）を**モーション参照として追加で渡す**（Seedanceは動画参照に対応）。構図とキャラはキーフレームで固定したまま、動きだけ正確になぞらせられる。**この参考動画をCodexに作らせることは禁止**（Codexの担当は静止画キーフレームのみ）。ユーザーから明示的に依頼されたときに限り、Codex以外の手段（Three.jsレンダリング等）で作成する。
- **セリフのあるクリップすべて**で、対応表に `Audio` 行を追加し（ステップ2で生成したサンプル音声ファイルをクリップ内の発話順に列挙）、**ボイスサンプルとしてSeedance生成の入力に添付する**。Motion promptにサンプル参照の指示（声・話し方をサンプルに合わせて生成させる）を含める:

```
- Audio: `clip1_line1_fukuchan.wav` (@Audio1 — Fukuchan's voice sample) — attach to Seedance as a VOICE SAMPLE; Seedance generates the dialogue voice to match this sample
- Motion prompt: <... ONLY Fukuchan (@Image3, the stylish man in the green jacket) speaks the line, in the voice of the attached sample @Audio1 — match its voice, tone and speaking style; he begins the line almost immediately, and his mouth moves ONLY while delivering the line; once the line ends his mouth stays CLOSED for the rest of the clip; Yametaro (@Image4) does NOT speak — his mouth stays CLOSED, he only listens; @Audio1 is a VOICE SAMPLE (reference for the voice), not the final audio track — no narration, no other voices>
```

- 話者バインディング（@メンション＋見た目の同定句＋非話者の口閉じ指示）はステップ1「話者バインディング」のルールに従い、**セリフのある全クリップのMotion promptに必ず入れる**。1クリップ1話者の原則（話者交代でクリップを割る）もここで守られていること。

- **VOICEVOXの声を使ったランでは、対応表の末尾（全クリップの後）に動画内クレジットの指示を必ず書く**（ステップ2の「VOICEVOXクレジット表記」参照）。CapCutでの最終組み立て時に、エンドカードまたはテキストオーバーレイで `VOICEVOX:話者名` を動画内に表示させる:

```
### Credits (REQUIRED — add in CapCut before export)
- On-screen credit text (end-card or overlay on the final clip): VOICEVOX:白上虎太郎 / VOICEVOX:ずんだもん
- Add this with CapCut's text tool — do NOT render it via Seedance/keyframe images.
```

## 5. 生成実行プロトコル（script.mdに必ず含める・実行者への指示）

過去のランで「12本を一括生成して尺・音声の検証を挟めない」「プロンプトの要約で制約が欠落する」「クリップ尺が発話より大幅に長く、発話の前後で口パクが空回りする」失敗が起きた。再発防止のため、**`script.md`の末尾（Creditsの前）に以下のプロトコルをそのまま（英語で）記載する**。CapCutで生成・編集する実行者（ユーザー・エージェント問わず）はこれに従う。

```
## Generation & assembly protocol (REQUIRED — read before generating anything in CapCut)

### Step 1 — Pilot clip first (batch generation is FORBIDDEN until the pilot passes)
Generate ONLY Clip 1, then verify ALL of the following before touching any other clip:
- [ ] The dialogue voice is generated by Seedance and matches the attached voice sample (same character voice and speaking style; no doubled voices, no second voice track)
- [ ] The CORRECT character speaks each line (the speaker named in the prompt moves their mouth; every non-speaker's mouth stays closed)
- [ ] Mouth motion starts and ends WITH the generated speech: no lip-flap before the line starts or after it ends
- [ ] EVERY character matches their character model sheet in EVERY frame — open the `*_sheet.png` files alongside the clip and check the `PRESERVE:` list item by item (mask construction and marking count, hair present from every angle including the back of the head, skin tone, body build and height ratio, exact outfit, signature prop). A near-miss is a FAIL: masks must not turn into painted human faces, and NG-change elements must not vanish in profile, rear or wide shots
- [ ] Motion, poses and prop states match the Motion prompt and the Prop state ledger
- [ ] Camera work matches the clip's Camera plan row: a static clip stays locked-off (no drift, no spontaneous camera motion), a moving clip actually performs the specified move at the specified amplitude and speed, and the final framing lands on the end keyframe
- [ ] Location, time of day and lighting match the Scene ledger in EVERY frame — no unexplained day-to-night (or night-to-day) jump anywhere in the clip, including during location transitions
- [ ] NO on-screen text appears that the script did not explicitly call for — no spontaneous subtitles, captions, or Japanese lettering anywhere in the clip
- [ ] Ambient sound and music match the prompt's Soundscape/Music lines — no unrequested background music, no out-of-place ambience
- [ ] Hinges, handles and other fixture hardware stay on the edges given in the Fixture layout table in EVERY frame (handles never disappear, jump to the hinge side, or duplicate — especially when a door finishes closing)
- [ ] Every named character appears EXACTLY ONCE in EVERY frame — no duplicated characters and no extra copies of props, especially during appear/disappear/handoff actions (correct keyframes do NOT guarantee this; duplicates can appear mid-interpolation)
- [ ] The art style matches the run's Style block and both keyframes, and stays consistent through the whole clip (no drift between anime-illustration and photoreal/live-action)
- [ ] The clip duration equals the Duration specified in the CapCut inputs table (NOT the ~8s default). The generated speech may run shorter or longer than the sample wav's duration — that is acceptable; the VIDEO is the source of truth for audio timing.
If any check fails, fix the inputs/prompt and regenerate Clip 1 until all pass.
Only then generate the remaining clips, and re-run at least the voice + duration checks on every clip.

### Step 2 — Prompts are verbatim
Paste each clip's Motion prompt into CapCut EXACTLY as written in this file.
Do NOT summarize, shorten, or paraphrase it. If it seems too long, do not compress it —
go back to the script and split the clip instead.

### Step 3 — Final audio track (assembly)
The audio embedded in the generated clips IS the final dialogue audio. The local wav
files in the Dialogue audio table are VOICE SAMPLES used at generation time — reference
only, NOT the final track. When assembling the final video on the CapCut timeline:
1. Keep each generated clip's embedded audio as-is — do NOT mute it, and do NOT lay the
   sample wavs over or in place of it (that would double the voices or desync the lips).
2. If a generated line runs shorter or longer than the sample wav's duration, accept the
   video as-is — the VIDEO is the source of truth; never re-time or regenerate a clip
   just to match the sample's length.
3. Play back the full timeline before export and confirm every line is intelligible,
   each character's voice stays consistent with their voice sample across clips, and no
   line is doubled. If a voice is wrong or unintelligible, regenerate that clip — do NOT
   patch it with the sample wav.
```

- このプロトコルは**全クリップ生成前に読まれる位置**に置くこと（対応表の直後・Creditsの前）。
- クリップ数が多いランほどStep 1の効果が大きい。パイロット検証を省略して一括生成することを本スキルでは禁止する。

## 6. 同梱物の最終検証（必須・完了報告の直前）

次を実行し、成功するまで成果物を完了扱いにしない:

```
python3 .claude/skills/seedance/validate_run_bundle.py 03_SCRIPTS/<NN>_<slug>
```

検証は次を強制する:

- CapCut入力表にある全PNG/WAVがラン専用ディレクトリ直下に存在する
- キャラクターシートとスケール参照がsymlinkではなく通常ファイルとして同梱されている
- `script.md`が`../../02_CHARACTERS/`等の外部パスを参照していない
- 各Motion promptに`Required attached reference files:`があり、対応表の全`@ImageN = filename`がファイル名ごと再宣言されている
- 各クリップのFrame A、Frame B、Audioが存在する

あわせて、次を人手（実行エージェント）で確認する。1つでも欠けていたら完了報告してはいけない:

- [ ] ステップ0で全キャラの`*_sheet.png`をReadで開き、正典の姿を確認した
- [ ] ステップ3.5の`/image-validation`を実行し、キャラ同一性のFAILが残っていない（実施していない検証を「問題なし」と報告しない）
- `## Scene ledger`セクションが存在し、各Motion promptに時間帯・光の語（daylight/daytime/midday/evening/night等）が含まれている
- `## Camera plan`セクションが存在し、各Motion promptにカメラ記述（"camera"への言及）が含まれている
- 各Motion promptに音響指定（`Soundscape:`と`Music:`）が含まれている
- `## Style block`セクションが存在し、各Motion promptに画風固定文（Style blockの1行）が一字一句そのまま含まれている

検証失敗時は不足ファイルをコピーするかプロンプトを修正し、再実行する。**失敗したままユーザーへ完了報告してはいけない。**
