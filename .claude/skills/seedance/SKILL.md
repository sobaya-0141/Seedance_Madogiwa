---
name: seedance
description: 窓際族物語のストーリー（あらすじ）からSeedance用の台本・動画生成プロンプト・セリフ音声（VOICEVOX/Irodori-TTSボイスクローン）・参考画像（draw-things-cliでローカル生成するキーフレーム）を作成するワークフロー。ユーザーからストーリーを渡されたとき、台本やSeedanceプロンプトの作成・修正を頼まれたとき、キャラのセリフ音声の生成を頼まれたとき、クリップの参考画像（キーフレーム）生成を頼まれたときに必ず使用する。
---

# Seedance 動画制作ワークフロー

ユーザーからストーリー（あらすじ）を渡されたら、以下の7ステップを一連の流れとして実行する。

1. このラン専用の出力ディレクトリを作成する
2. **使用する全キャラクターシート・スケール参照画像をラン専用ディレクトリへ実ファイルとしてコピーする**
3. 台本＋Seedanceプロンプト（英語）の作成（各クリップに開始状態と終了状態を明記する）
4. VOICEVOX/Irodori-TTSによる全セリフの音声生成
5. draw-things-cli（ローカル画像生成）による各クリップのキーフレーム生成（**開始フレーム＋終了フレームの2枚**を作る）
6. Seedanceへの入力対応表と、各Motion prompt内の添付宣言を`script.md`に明記する
7. 生成実行プロトコルを明記し、同梱物の機械検証を通す

### 精度の要（この方式にする理由）

動画生成は**CapCutに統合されたSeedance 2.0**を使う。CapCutは**開始フレームだけでなく「開始＋終了フレーム（Frame A / Frame B）」入力に対応**しており、両端を固定して間を補間させることで、単一フレーム/text-to-videoで起きる**キャラのブレ（identity drift）・ちらつき・構図ズレを減らせる**。さらに**参照画像を多数**渡してキャラの同一性を固定できる。本スキルはこの両方を最大限使う設計にする。中間キーフレーム入力は存在しないため、**細かい動きの制御はクリップを短く割る**ことで代替する。

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
4. `script.md`冒頭の`Character references`には同梱後のbasenameだけを書く。
5. 以降のキーフレーム生成とCapCut入力には、ラン専用ディレクトリ内のコピーを使う。これにより同梱漏れを制作途中で発見する。

## 1. 台本作成（deliverableはすべて英語）

`WORLD_BIBLE.md`のStory Formula（変なことを始める→巻き込まれる→少し騒ぎになる→最後は笑顔）と各キャラのNG変更を守りつつ、尺に応じてクリップ分割した台本＋Seedanceプロンプトを `03_SCRIPTS/<NN>_<slug>/script.md` に作成する。

`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。

### クリップ分割とキーフレーム設計（重要）

各クリップは**開始状態（first frame）と終了状態（last frame）を明確に区別して書く**。台本の各クリップに、次の2つを必ず記述する:

- **First frame**: そのクリップ冒頭の静止画で写っている内容（構図・キャラの位置・表情）。
- **Last frame**: そのクリップ終端の静止画。ここまでにどう動いた結果になるか。
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

Seedance 2.0は**複数人が映るクリップでのリップシンクの話者割り当てが弱い**（公式にも未解決の課題とされ、実際に「福ちゃんの音声でやめ太郎の口が動く」取り違えが起きた）。これを防ぐため:

- **1クリップにつき話者は1人を原則とする。** 会話の掛け合いは、話者が交代するタイミングでクリップを分割する（分割はつなぎ目共有フレームで滑らかに繋がるので尺・演出上の不利益はない）。
- 掛け合いのテンポ上どうしても1クリップに複数話者を入れる場合は、(1) 音声ファイルを発話順に分けて添付し、(2) Motion promptに話者の順番・誰がどの音声かを@メンションと見た目で明示し、(3) "the two lines do NOT overlap" を入れる。それでも取り違えが出たら迷わずクリップを割る。
- 台本上は、各セリフに**話者のキャラ名＋見た目の同定句**を添える（後述「話者バインディング」参照）。

### リップシンク精度ルール（クリップ尺≒発話長・重要）

Seedanceは「話す」と指示されたキャラの口を**クリップ全体にわたって動かしがち**で、クリップ尺が実発話より大幅に長いと口パクが音声からずれる（過去に4〜5秒のクリップへ実発話1.2〜1.7秒のwavを添付し、口の動きが約1.5秒遅れて始まり、音声終了後も1.5秒以上口が動き続ける動画になった）。これを防ぐため:

- **セリフのあるクリップの尺は「添付する音声wavの合計長＋約1秒」を目安にする**（実発話がクリップ尺の6割を下回る設計にしない）。無言のリアクション・ため・間はセリフ入りクリップに詰め込まず、**セリフなしの別クリップに分割**する（つなぎ目共有フレームで滑らかに繋がるので演出上の不利益はない）。
- **Motion promptに発話タイミングの拘束を必ず入れる**（話者バインディングの指示に加えて）: 話者について "begins the line almost immediately" と "the speaker's mouth moves ONLY while @Audio1 is playing — once the line ends the mouth stays CLOSED for the rest of the clip" を明記する。
- **添付するwavは前後の無音をトリムしたものにする**（ステップ2の同梱スクリプトが自動でトリムする。ユーザー提供など別途用意したwavも添付前に無音をトリムする）。wav内の長い無音はSeedanceの口パク開始位置を狂わせる。

### 言語ルール（重要）

**`script.md` は全文を英語で書く。** Seedanceに渡すプロンプト（コードブロック）だけでなく、見出し・尺やアスペクト比の説明・「画面内容」「カメラ」「音」「生成メモ」などの人間向け解説も含めて、すべて英語で記述する。

例外として英語以外を使ってよいのは次のみ:

- **キャラクターのセリフ（発話内容）**: 実際に日本語で発話される台詞は日本語のまま `"..."` で引用して埋め込む（例: `shouting "島流し一択やろ！"`）。ナレーションや画面内の指定文字（温度計の「43℃」など）も同様に、実際に表示・発話される言語のまま引用する。
- **発音・読みを指定したい場合など、非英語でしか正確に表現できない理由があるとき**: その語のみ元言語で書き、必要なら英語で補足する。

理由: 日本語の説明文はSeedanceでの再現精度が落ちること、および成果物を言語横断で扱いやすくするため。

### セリフ音声の扱い（Seedanceの発声禁止・音声添付必須・重要）

**キャラクターのセリフ・ナレーションの音声は、すべてステップ2で生成した音声ファイル（キャラごとにVOICEVOXまたはIrodori-TTS。配役は`VOICE_CAST.md`が正）が正**であり、Seedanceに声を生成させない（生成音声と重なると二重音声になるため）。セリフのあるクリップで音声生成を省略してSeedance任せにすることは禁止。ユーザーから別途音声ファイルが渡された場合は、そのクリップに限りユーザー提供の音声を優先する。

生成した音声は**Seedance（CapCut）生成時に添付ファイルとして渡し、動画にはその音声をそのまま使わせる**（キャラの口の動きは添付音声にリップシンクさせる）。

- 台本の各クリップでは、セリフは**口の動き（リップシンク）の指定としてのみ**書く。引用の後に `(lip-sync to the attached audio file — voice comes from the attached pre-generated audio, NOT generated)` を付ける。
- セリフのあるクリップのMotion promptに**指示を必ず入れる**: "use the attached audio file as the dialogue audio AS-IS and lip-sync the characters to it; do NOT generate any voice — no synthesized speech, no narration"。環境音・効果音まで不要な場合は "no audio other than the attached file" とする。

### 話者バインディング（音声→キャラの紐付け・重要）

モデルはキャラ名を知らないため、名前だけ書くと**別のキャラの口が動く取り違え**が起きる。セリフのあるクリップでは以下を必ず行う:

- **@メンションで役割を固定する**: Seedance 2.0（Omni Reference）は添付ファイルを`@Image1`/`@Audio1`のようにプロンプト内で参照し役割を指定できる。Motion promptで音声と参照画像を明示的に結びつける: "ONLY Fukuchan (@Image3, the stylish man in the ...) speaks, lip-syncing to @Audio1"。
- **話者は名前＋見た目の同定句で指定する**: キャラ名単独ではなく "Fukuchan — the slim stylish black-haired man in a black long coat" のように、参照画像から一意に分かる外見描写を毎回添える。同定句は各キャラ設定md（`02_CHARACTERS/0N_*.md`）の「プロンプト用同定句（英語）：」を正典として使い、クリップごとに言い換えない（表記ゆれ自体が取り違えの原因になる）。
- **話さないキャラは否定形で口を閉じさせる**: 画面内の非話者全員について "Yametaro (@Image4) does NOT speak — his mouth stays CLOSED, he only listens/reacts" を明記する。話者の指定だけでは足りず、非話者の禁止まで書くのが取り違え防止の肝。
- `script.md` のCapCut inputs表に `Audio` 行を追加し、添付する音声ファイル名と「Seedance生成の入力として添付し、そのまま使わせる」ことを明記する（記載例は後述）。
- **添付音声は「生成時の参照」で終わらせない。** 生成時に添付してもSeedanceが参照音声として扱い、最終動画に元音声が乗らない事故が起きた。**最終的な音声の正は、CapCutタイムライン上に明示的に並べ直したローカルwav**とする（生成クリップに埋め込まれた音声はミュートして差し替える）。手順はステップ5「生成実行プロトコル」で必ず`script.md`に記載する。

## 2. セリフ音声の生成（全セリフ必須）

台本が完成したら、**台本中のすべてのセリフ・ナレーションの音声をローカルで生成し、ラン専用ディレクトリに保存する**。このwavはSeedance（CapCut）生成時に添付ファイルとして渡し、動画にそのまま使わせる（Seedanceの生成音声は使わない）。

### 配役（正典）

- キャラごとの使用エンジンと指定（Irodori-TTSの参照音声 / VOICEVOXの話者・スタイルID）は **`02_CHARACTERS/VOICE_CAST.md` が唯一の正**。この表にない声を勝手に割り当てない。
- **本人の声サンプルがあるキャラ（そば屋・福ちゃん・やめたろう・おかやまん・よーたん）はIrodori-TTSのボイスクローン**で生成する。参照音声は`02_CHARACTERS/<キャラ>_voice.wav`（各キャラ設定ファイルの「声ファイル：」に記載）。事前学習は不要で、**合成のたびに参照音声を渡す**ゼロショット方式。
- それ以外のキャラはVOICEVOXで生成する。感情差分スタイルはシーンに合わせてVOICE_CAST.mdの範囲で選んでよい。
- **ゆめみんは言葉を話さない**設定のため、台本にセリフ（言葉）を書かない。鳴き声（「きゅー！」「ぼんっ！」等）が必要な場合はVOICE_CAST.mdの指定voice（ずんだもん）で鳴き声テキストを生成する。

### 生成手順

1クリップ内のセリフ1つ（1人の連続した発話）につき1ファイル生成する。エンジンに応じて同梱スクリプトを使い分ける:

```
# Irodori-TTSのキャラ（そば屋・福ちゃん・やめたろう・おかやまん・よーたん）
.claude/skills/seedance/irodori_speak.sh "セリフテキスト" 03_SCRIPTS/<NN>_<slug>/clipN_lineM_<char>.wav 02_CHARACTERS/<キャラ>_voice.wav

# そば屋のみ: クローン生成後にモンスターボイス加工を必ずかける（in-place。VOICE_CAST.md参照）
.claude/skills/seedance/sobaya_monsterize.sh 03_SCRIPTS/<NN>_<slug>/clipN_lineM_sobaya.wav

# VOICEVOXのキャラ
.claude/skills/seedance/voicevox_speak.sh "セリフテキスト" 03_SCRIPTS/<NN>_<slug>/clipN_lineM_<char>.wav <スタイルID> [話速]
```

- VOICEVOXはエンジン未起動なら自動起動する（設置場所は`~/voicevox_engine/`）。Irodori-TTSは`~/irodori_tts`に設置済みであること（無いマシンではスクリプトのエラーメッセージに従う。1文あたり数十秒〜数分かかる）。
- 両スクリプトは合成後に**前後の無音を自動トリム**する（先頭約0.1秒・末尾約0.2秒だけ残す。長い無音はSeedanceの口パク開始位置を狂わせるため）。Dialogue audio表に記録する再生時間はトリム後の値を使う。
- **ファイル名**: `clipN_lineM_<char>.wav`（N=クリップ番号、M=クリップ内の発話順、char=キャラ名小文字。例: `clip1_line2_sobaya.wav`）。台本ファイル・画像と同じ階層に置く。
- 生成テキストは**実際に発話される日本語のセリフそのまま**を渡す（英訳やローマ字にしない）。イントネーションがおかしい場合は読み仮名に直したテキストで再生成してよい（台本上の表記は変えない）。
- Irodori-TTSは生成ごとに揺らぎがある。**再生成して選び直したいときはシード値（第4引数）を変えて数候補作る**。良い結果のシードは`script.md`のDialogue audio表に記録しておくと再現できる。
- スクリプトが出力する**再生時間（秒）を`script.md`のDialogue audio表に記録する**。クリップ尺はセリフの合計時間より長くしつつ、**「音声wavの合計長＋約1秒」を目安に詰める**（ステップ1「リップシンク精度ルール」参照）。尺に収まらない場合はクリップを延ばすか、VOICEVOXは話速を上げる。
- 生成後、各wavを再生確認できない環境でも、少なくとも全ファイルの存在と再生時間の妥当性（0.5秒未満や異常に長いものがないか）を確認する。

### script.mdへの記載（Dialogue audio表・必須）

`script.md`の冒頭（Prop state ledgerの近く）に、全セリフの通し表を書く（英語。セリフ本文のみ日本語のまま）:

```
## Dialogue audio (all voices pre-generated locally — Seedance must NOT generate any voice)

| File | Clip | Character | Voice (engine) | Line (ja) | Duration |
|------|------|-----------|----------------|-----------|----------|
| clip1_line1_sobaya.wav | 1 | Sobaya | Irodori-TTS (ref: Sobaya_voice.wav, seed 42) + monsterize | 快適です！ | 1.8s |
| clip1_line2_yotan.wav  | 1 | Yotan  | VOICEVOX (style 100) | ロックだぜ。 | 1.5s |
```

### VOICEVOXクレジット表記（動画内表示・必須）

VOICEVOXの利用規約により、**VOICEVOXの声を1つでも使った動画には、動画内（画面内）に使用キャラクターのクレジット表記を必ず入れる**（概要欄だけで済ませない）。

- `script.md`末尾に `## Credits` セクションを必ず書き、使用したVOICEVOX話者の一覧を記載する（例: `VOICEVOX:白上虎太郎 / VOICEVOX:ずんだもん`。話者名の対応は`VOICE_CAST.md`参照。Irodori-TTSのキャラはクレジット不要）。
- 同セクションに、**CapCut編集時に動画内へクレジットを表示する指示**を明記する: 動画末尾のエンドカード、または最終クリップへのテキストオーバーレイとして、上記のクレジット文字列をそのまま表示する（例: `On-screen credit (add in CapCut as end-card/overlay text): VOICEVOX:白上虎太郎 / VOICEVOX:ずんだもん`）。
- クレジットはSeedanceに画像・プロンプト経由で描画させない（文字が崩れるため）。**必ずCapCutのテキスト機能で載せる**。

## 3. キーフレーム生成（開始＋終了の2枚・draw-things-cliでローカル生成）

Seedance用プロンプトを作成したら、**実行エージェント自身が**`draw-things-cli`（Draw Thingsのローカル画像生成CLI）で各クリップの**開始フレームと終了フレームの2枚**を生成し、**ステップ0で作成したラン専用ディレクトリに保存する**。これがSeedanceの First-Last-Frame 入力にそのまま渡る本番アセットになる。**画像生成を外部エージェント（Codex等）に委譲しない。**

### セットアップ（未導入マシン向けの導入サポート）

同梱の`dt_generate.sh`は実行時に導入チェックを行い、未導入ならインストール手順をエラー表示する。手動で整える場合:

1. CLI導入: `brew install drawthingsai/draw-things/draw-things-cli`（macOS 13+/Linux。Homebrew自体が無ければ https://brew.sh から先に導入）
2. モデル取得（初回のみ・十数GBのダウンロード）: `draw-things-cli models ensure --model qwen_image_edit_2511_q6p.ckpt`
3. 確認: `draw-things-cli models list --downloaded-only`

- 使用モデルの正典は **Qwen Image Edit 2511（6-bit）`qwen_image_edit_2511_q6p.ckpt`**（初回ダウンロード17.6GB／展開後25GB）。参照画像の内容を保ったまま指示どおりに編集する能力が高く、本ワークフローの「キャラ同一性の固定」と「前フレームを種にしたチェーン生成」の両方に合う。別モデルは環境変数`DT_MODEL`で差し替えられるが、**1つのランの途中でモデルを変えない**（画風が揺れてSeedanceの補間が崩れる）。
- Draw Thingsアプリ本体は不要（CLI単体でローカル生成できる）。

### 所要時間の見積もりとステップ数（実測・重要）

**このモデルは1枚あたり数分〜十数分かかる。作業を始める前に必ず総時間を見積もること。** M4 Max / 1024x576 での実測は **約23秒/step**（推奨設定の30stepで約11.5分/枚）。所要時間はステップ数にほぼ比例する。

- キーフレーム枚数は「クリップ数＋1」が下限（つなぎ目共有のため）。17クリップのランなら18枚 ≒ 30stepで3.4時間、20stepで2.3時間。
- **クリップ数の多いランでは`DT_STEPS=20`に落とす**（`dt_generate.sh`が`--steps`に渡す）。20stepでも本ワークフローの用途（Seedanceに渡すキーフレーム）には十分な品質が出る。
- 生成は前フレームを種にするチェーンなので**並列化できない**。全フレームを1本のシェルスクリプトにまとめてバックグラウンド実行し、`saved:`行をモニタしながら他の作業を進めるとよい。スクリプトには「出力が既にあればスキップ」を入れておくと、中断・再開や個別の作り直しが楽になる。
- 1枚の生成をフォアグラウンドで待つとツールのタイムアウト（10分）に掛かる。**必ずバックグラウンドで実行する。**

### 枚数とファイル名

- **1クリップにつき開始フレーム1枚＋終了フレーム1枚の計2枚**を生成する（従来の「loose3枚」は廃止）。
- ファイル名は役割が分かる形にする: `clipN_start.png` / `clipN_end.png`（Nはクリップ番号）。
- 保存先は必ずラン専用ディレクトリ `03_SCRIPTS/<NN>_<slug>/` 内。台本ファイルと同じ階層に置く。
- 複数参照を連結した**参照キャンバス**（後述）は`ref_canvas_*.png`と命名する。これは**生成用の中間ファイルでありCapCut入力ではない**ため、CapCut inputs表・Reference images表には載せない（CapCutにはシート原本を渡す）。

### 参照画像の渡し方（`--image`は1枚だけ・連結キャンバスで代替）

`draw-things-cli generate`の画像入力（`--image`）は**1枚のみ**。複数の参照画像が必要な生成では、同梱の`stitch_refs.py`で参照画像を**1枚の参照キャンバスに連結してから**渡す:

```
python3 .claude/skills/seedance/stitch_refs.py 03_SCRIPTS/<NN>_<slug>/ref_canvas_clip1_start.png \
  03_SCRIPTS/<NN>_<slug>/Sobaya_sheet.png \
  03_SCRIPTS/<NN>_<slug>/Yotan_sheet.png
```

- 参照キャンバスは生成するキーフレームと**同じアスペクト比**で作る（デフォルト`2048x1152`=16:9。縦動画のランでは`--size 1152x2048`等で合わせる。draw-things-cliは入力画像をアスペクト維持＋センタークロップで出力サイズに合わせるため、比が違うと参照が切れる）。
- `stitch_refs.py`にも同梱コピー（`03_SCRIPTS/<NN>_<slug>/<Name>_sheet.png`）を渡す。正典`02_CHARACTERS/`のパスを直接使って同梱確認を迂回しない。
- **連結順＝画面上の位置。** 既定レイアウトは`row`（引数の順に左から右）なので、プロンプトでは "The LEFT panel is ... The RIGHT panel is ..." と**位置で役割を指定する**。縦積みにしたいときだけ`--layout column`（上から下）を使う。`stitch_refs.py`は実行時に`layout row, grid 2x1; panel 1 = ..., panel 2 = ...`と出力するので、**プロンプトの位置指定と一致しているか必ず確認する**（LEFT/RIGHTと書いたのに縦積みになっていると、モデルはどちらがシートか分からず参照が効かない）。

### チェーン中のデザイン劣化とシートの再投入（重要）

**前フレームだけを種に繋いでいくと、数フレームでキャラのデザインが劣化する。** 実測では5枚目で**やめ太郎の丸メガネが四角い黒縁メガネに変わった**（`02_CHARACTERS/06_Yametaro.md`のNG変更違反）。前フレームは「直前の絵」の情報しか持たず、正典デザインの情報を持たないため、誤差が累積する。

- **NG要素（仮面・触手・ウクレレ・丸メガネ等）が崩れたフレームを見つけたら、そのフレームは前フレーム＋キャラクターシートの連結キャンバスを種にして作り直す。** 前フレーム単体で作り直しても、種が同じなので同じ崩れ方をする。
- 崩れる前でも、**同一キャラが5枚以上続くチェーンでは数フレームおきにシートを再投入する**のが安全。
- あわせて**NG要素を明文で毎フレーム固定する**: "he keeps SMALL ROUND white-rimmed glasses (perfectly circular lenses, thin light rims) — NOT rectangular glasses, NOT thick dark-rimmed glasses" のように、正しい形と否定形をセットで書く。各キャラのNG変更項目は`02_CHARACTERS/0N_*.md`が正典。
- **NG要素は「形が変わる」だけでなく「丸ごと消える」ドリフトも起きる**（実測: 目を閉じたポーズを指示したフレームで**メガネが消滅した**）。形の指定だけでは足りないので、**存在そのものを否定形で守る**: "he is ALWAYS WEARING his round glasses, clearly visible on his face in every frame — the glasses do NOT disappear and are NOT removed. Even when his eyes are closed, the round glasses stay drawn on his face over his closed eyes."（仮面・触手・ウクレレ・名札など、他のNG要素も同様に「消えない」ことを書く）

### 生成順序（整合性を壊さないため必須）

キーフレーム同士が食い違うとSeedanceの補間がモーフィング崩壊を起こすため、**必ず前の絵を種にして次の絵を作る**（ゼロから独立生成しない）。

1. **クリップ1の開始フレーム**: 登場キャラ全員のシートを`stitch_refs.py`で連結した参照キャンバスを入力画像に渡し、「入力画像はキャラクターシートの寄せ集め。これらのキャラで新しいシーンを描く」形のプロンプトで生成する。
2. **クリップ1の終了フレーム**: たった今作った**開始フレーム単体**を入力画像に渡し、「同じ絵のまま、動きが変える部分だけ終了状態に変える」編集プロンプトで生成する（開始フレーム自体がキャラ同一性の種になるため、シートの連結は不要）。
3. **クリップ2の開始フレーム = クリップ1の終了フレーム**。原則ここは**新規生成せず同じ画像ファイルをコピー/参照して共有する**（つなぎ目消し）。カメラや場所が切り替わって共有できない場合のみ、クリップ1終了フレームを種に新規生成する。
4. 以降のクリップも 開始→終了 の順で、前フレームを種にチェーンしていく。

**ラン途中での新キャラ登場は、シートを連結するよりも文章指定のほうが良い場合が多い（重要）。**
キャラクターシートは写真調のため、フラットなアニメ絵のチェーンに連結すると**その新キャラだけ写実的な顔になる画風混在**が起きる（実測: 福ちゃんだけリアルな顔になった）。加えて2パネル絵が返る確率も上がる。したがって:

- **すでに絵柄が確立しているランでは、前フレーム単体を種にし、新キャラは各キャラ設定mdの「プロンプト用同定句（英語）」で文章指定する。** そのうえで "Draw <name> in EXACTLY the same rendering style as the rest of the input image — the same lighting, the same level of realism, the same surface treatment" を必ず添える（そのランの画風に合わせる。実写調のランで「cartoon style」と書いてはいけない）。
- **キーフレーム上の新キャラの似姿が多少甘くても構わない。** 動画側のキャラ同一性は**CapCutに添付するキャラクターシート**で担保される（対応表の`@ImageN`）。キーフレームで優先すべきは**画風の統一と構図**であって、似顔の作り込みではない。
- シート連結が有効なのは、**既存キャラのNG要素が崩れたとき（デザインの引き戻し）**のほう。新キャラ追加とは目的が違うので混同しない。

### 画風の決定（プロンプトを書く前に必ずやる・最重要）

**画風は思い込みで決めず、必ず正典の画像を実際に開いて確認してから決める。** このプロジェクトの画風は「アニメ絵」ではない:

- **窓際メンバーの多くは実在メンバーの実写写真**がキャラクターシート（例: `Fukuchan_sheet.png`、`Yotan_sheet.png`）。
- **無職やめたろうだけがデフォルメキャラ**で、シートは**柔らかいマットな3Dレンダリングのチビ人形**（丸みのある樹脂的な質感、巨大な頭、鼻なし、丸メガネの奥に点目、ピンクのチーク、**葉柄の入った薄紫シャツ**）。
- 過去ランの完成キーフレーム（`03_SCRIPTS/<既存ラン>/clip1_start.png`）を見ると、**実写調の空間に上記のキャラが立っている絵**が本作の確立した画風。

したがって**キーフレーム生成の前に、次の2つをReadで開くことを必須手順とする**:

1. そのランに登場する全キャラの `*_sheet.png`（実写か3Dチビかを目で確認する）
2. `03_SCRIPTS/` の直近ランの `clip1_start.png`（確立した画風・ライティングを確認する）

そのうえで**確認した画風をプロンプトの末尾に毎フレーム同じ文で書く**。実写調キャラと3Dチビが同居する点も明記する（両者の混在はこのIPでは正しい姿であり、直すべきドリフトではない）:

```
Photorealistic live-action-style scene with cinematic lighting, real-world textures and natural depth of field. The human characters are photoreal real people. Yametaro alone is a soft matte 3D-rendered chibi figure — rounded plastic-like surfaces, an oversized head, no visible nose, simple dot eyes behind small round white-rimmed glasses, pink blush cheeks, a lavender leaf-patterned shirt and dark trousers — composited naturally into the photoreal environment with matching lighting and shadows. NOT flat 2D anime, NOT cel-shaded cartoon, NOT a drawing.
```

**「anime style」「cartoon style」と書くと、実写調のシートを渡していてもフラットな2Dアニメ絵が出てIPの画風から外れる。** 過去にこのスキルのコマンド例が`Comedic slice-of-life anime-illustration style`を固定文で持っていたため、ラン全体（17クリップ）を誤った画風で作ってしまった。**画風の固定文はランごとにシートを見て書き起こすものであり、スキルに固定値として持たない。**

### キャラクター参照画像（同一性の固定）

- **そのクリップに新規登場するキャラクター全員のシートを参照キャンバスに含める**。各キャラの**第一参照はキャラクターシート**`02_CHARACTERS/<キャラ名>_sheet.png`（多面図モデルシート: 三面図＋NG要素クローズアップ＋表情/アクション差分＋身長比較＋カラーパレット。各キャラ設定mdの「キャラクターシート：」に記載）。三面図は横顔・後ろ姿・振り向きのカットで、クローズアップはNG要素（仮面・触手・ウクレレ等）の維持に、表情差分は演技時の顔崩れ防止に効く。単体参照画像（「画像ファイル：」記載）は、シートで再現が甘い場合に追加で連結する。
- プロンプト文中で「The input image is a contact sheet of character model sheets — identity/design references only, NOT a composition reference」のように役割を明記し、NG変更対象（そば屋の仮面/たこさんの触手/とーくんのウクレレ等）を維持させる。

### コマンド例（クリップ1・そば屋/よーたん登場）

開始フレーム（シート連結キャンバス→新シーン起こし。プロンプトはヒアドキュメントで渡すため引用符のエスケープ不要）:
```
python3 .claude/skills/seedance/stitch_refs.py 03_SCRIPTS/<NN>_<slug>/ref_canvas_clip1_start.png \
  03_SCRIPTS/<NN>_<slug>/Sobaya_sheet.png 03_SCRIPTS/<NN>_<slug>/Yotan_sheet.png

.claude/skills/seedance/dt_generate.sh 03_SCRIPTS/<NN>_<slug>/clip1_start.png \
  03_SCRIPTS/<NN>_<slug>/ref_canvas_clip1_start.png 42 1024x576 <<'EOF'
The input image is a contact sheet of character model sheets (front/side/back turnarounds; Sobaya: keep face/mask/build; Yotan: keep blond hair/guitar/rock outfit) — identity/design references only, NOT a composition reference. Using exactly these characters, create the FIRST-FRAME still of a video shot: <English scene description of the clip's START state, including Prop states and Fixture layout, excluding dialogue and camera-work notation>. <the run's style block, written from the sheets — see 「画風の決定」above>. Single still frame, one coherent scene, no text overlay, no sheet-style panels or labels.
EOF
```

終了フレーム（開始フレームを種にする）:
```
.claude/skills/seedance/dt_generate.sh 03_SCRIPTS/<NN>_<slug>/clip1_end.png \
  03_SCRIPTS/<NN>_<slug>/clip1_start.png 42 1024x576 <<'EOF'
Edit the input image, which is this clip's start frame. Keep the same characters, art style, framing, lighting and location; change ONLY what the motion changes: <English scene description of the clip's END state, including Prop states>. <the run's style block — the SAME wording as the start frame>. Single still frame, no text overlay.
EOF
```

### ポイント

- **このパイプラインで生成するのは静止画のキーフレームPNGのみ。** 参考動画（モーション参照用のwebm/mp4など、動画ファイル全般）は画像生成では作らない。
- **参照キャンバス由来の事故に注意**: 出力が**シート風の分割コマ・文字ラベル・白背景の並び絵**になっていないか必ず確認する。連結キャンバスを種にすると、モデルが**入力の2パネル構造をそのまま真似て2パネルの絵を返す**ことがある（"Do NOT output a split-panel image" と書いても起きる）。
  - **ただし多くの場合、片方のパネルには正しいシーンが描かれている。** その場合は**再生成せず、正しいパネルを切り出して使う**（8分の再生成が数秒で済む）。パネルの外接矩形はPILで白地を判定して求め、16:9になるよう切り出して`resize`で規定サイズへ戻す。切り出す前の生出力は`_clipN_raw_twopanel.png`のような名前で残しておくと、後から判断を検証できる（`_`始まりにしておけばCapCut入力表とも混ざらない）。
  - 両パネルとも使えない場合だけ、"NOT a composition reference / one coherent scene / no sheet-style panels or labels" を強調して再生成する。
- 終了フレーム生成では**開始フレーム単体を入力画像に渡し**、「framing/lighting/locationは維持、動きが変える部分だけ変更」と指示する。これが崩壊防止の肝。
- **img2img編集で起きる典型ドリフトを、毎フレームのプロンプトで先に潰しておく**（以下はすべて実測で発生した。「変えない」と書いた要素ほど退行する）:
  - **画面・表示物が「無地」に退行する**: 「変化なし」と書いた小道具はモデルの関心から外れ、ノートPCやモニタの画面が**点いていない灰色の板**になりやすい（青いコードエディタ→無地グレーになった）。表示物は「変わらない」と書くだけでは足りず、**毎フレーム内容を具体的に書き、否定形を添える**: "its screen still shows the SAME calm blue code editor with pale code lines, NOT blank, NOT grey, NOT switched off"。画面が黒くなる演出をする場合も "still switched ON but deep black with ONE glowing red dot" のように**点灯していることを明示**する。
  - **カメラが勝手に寄る**: 「framing維持」だけでは寄り引きが変わる。**"Keep the input image's camera distance, camera angle, crop and composition EXACTLY the same — do not zoom in, do not zoom out, keep every character the same size in frame as in the input" まで書く**。意図してカメラを動かすフレームだけ、この文を外して寄り引きを指示する。
  - **表情が不安顔・困り顔に反転する**: 「笑顔」と一語書いただけでは、寄りの絵などで**眉が下がった困り顔・無表情**に転ぶ（歓喜の合掌が不安顔になった）。これは`WORLD_BIBLE.md`の「本人たちは常に楽しそう」に直接反するので、**キャラが楽しい場面の全フレームに肯定形＋否定形をセットで入れる**: "bright happy wide-open eyes and upward-curving eyebrows; NEVER worried, NEVER anxious, NEVER sad, NEVER frowning; eyebrows do NOT droop"。驚き顔・決め顔など意図的に笑顔でないフレームだけ、この文を外して狙いの表情を書く。
  - **DIYの段ボール備品が普通のオフィス家具に戻る**: 寄りの絵ほど起きやすい。段ボール机・アーロンチュアが映るフレームには "the desk is built from stacked brown corrugated cardboard boxes, NOT a normal wooden or white office desk" を毎回入れる。
- **上記のような「毎フレーム繰り返す拘束文」はシェル変数にまとめてプロンプトへ差し込むと漏れがなくなる**（生成用スクリプト側で`$KEEP`/`$HAPPY`のように持つ）。フレームごとに手書きすると必ずどこかで抜ける。
- **`DT_STRENGTH`を下げてドリフトを抑えようとしてはいけない（実測で失敗）。** 「入力を保持する強さ」のダイヤルとして期待したくなるが、このモデルでは**下げると指示自体を無視した上に、保持してほしかった細部まで失う**:

  | 試したDT_STRENGTH | 結果 |
  |---|---|
  | 0.7 | セットは完全に保たれたが「起き上がる」「朝になる」の指示が両方とも無視され、ほぼ入力のコピーが出た |
  | 0.9 | 姿勢変更・照明変更が無視された。別フレームでは「画面を赤いログで埋める」「紙の塔を足す」が両方無視され、**さらに元々あった赤いひびまで消えた** |
  | 1.0（既定） | 指示どおり変化し、後述のプロンプト構造を守れば維持点も保たれた |

  **結論: 強度は既定（1.0）のままにし、ドリフト制御は次のプロンプト構造だけで行う。**

- **strengthより効くのは「1フレームの変更点を1〜2個に絞り、変更点と維持点を両方列挙すること」。** これが本パイプラインで最も再現性の高い書き方だった:

  1. `Change EXACTLY ONE thing and nothing else:` （2つなら `EXACTLY TWO ... FIRST CHANGE: ... SECOND CHANGE: ...`）と**個数を明言して番号付きで列挙する**。
  2. **維持する要素を具体的に並べる**: "keep every set element identical: the same stacked brown corrugated cardboard box desk with its flaps open, the same office chair, the same window frame, the same laptop in the same place"。「変えるな」ではなく**何があるかを言い直す**のが効く。
  3. 動かしたくない体勢は "stays in the SAME body position as the input" と明示する。

  この形にすると**strength 1.0でも夜→真昼の照明変更が通り、机・メガネ・画面・口の状態がすべて保たれた**（同じ内容を変更2点で頼むと失敗していた）。逆に**1フレームに3点以上の変更を詰めると、どれかが無視されるか、指示していない要素が壊れる**。台本のクリップ設計側で状態遷移を配り直して、1フレームあたり2点以下に収めること。
- **画面全体の照明・時刻の変更は特に追従が悪い。** 夜→朝の変更はstrength 0.7でも0.9でも完全に無視された（1.0なら通るが、代わりにセットが崩れる）。したがって**照明変更は台本設計の段階で本数を絞る**:
  - 時刻変更を1クリップに1つまでにし、**同じフレームでポーズ変更と時刻変更を同時に要求しない**（どちらかが無視される）。
  - **時刻変更は「物語上それが必要なクリップ」だけに集約する。** 今回は当初4回（夕→夜→朝→真昼→夕）あった時刻変更のうち、朝への変更を削って夜のまま繋いだ。ナレーションが時刻を指定していない箇所は光を変えなくても成立するうえ、笑いの要（「日が暮れていない」）を担うクリップに変化を集約したほうが演出も強くなる。
  - 削る判断をしたら**Prop state ledgerの該当セルと論理チェックの記述も必ず同時に直す**（台帳が唯一の正なので、絵だけ直して台帳を放置すると次の工程で食い違う）。
- **どうしても出ない表情・演技は、キーフレームから降ろしてMotion promptに移す。** キーフレームの役目は**状態変化の両端を固定すること**であり、途中の演技はSeedanceが作る。ある表情が何度も出ない場合（実測: 驚き顔を頼むと必ず口が開き、ナレーションクリップで致命的だった）、**終了フレームは「開始フレームと同じ顔・同じポーズのまま、変わるのは状態だけ」に落とし、演技はMotion promptに「クリップ中盤で驚いて、終わりには元の表情に戻る」と書く**。こうすると生成が1点変更に単純化して確実に通り、演技はむしろ動画側で自然に出る。
  - この判断をしたら**Prop state ledgerの該当セルと終了フレームの説明も必ず直し、なぜ表情を中立にしたのかを一行残す**（後から見て「手抜き」ではなく意図的な設計だと分かるようにする）。
- **チェーンは前フレームを種にするため、ドリフトを見つけたら「その場で」直す。** 後段まで進んでから前のフレームを作り直すと、それ以降の全フレームを再生成することになる。**1枚できるたびに`Read`で開いて台帳と照合し、ズレていたらそこで止めて直す**のが最も安い。全部生成してから見比べるのは高くつく。
- **シードを`script.md`に記録する**: `dt_generate.sh`は使用したモデル名とシードを出力する。採用したキーフレームのシードを`script.md`の生成メモ（例: `## Keyframe generation notes`）に記録しておくと、再生成・微修正時に同じ絵を再現できる。
- クリップ間で同じ絵を共有できるときは**再生成せずファイルを使い回す**（生成ゆらぎを持ち込まない）。
- **「カメラが寄るだけ・ポーズと小道具は変わらない」フレームは生成せず、前フレームのクロップ＋拡大で作る。** 表情・小道具・画風が完全に保たれ、生成ゆらぎがゼロになり、8分が1秒で終わる（実際に「合掌の笑顔に寄る」フレームを2回生成して2回とも不安顔になり、クロップで解決した）。
  ```
  python3 - <<'PY'
  from PIL import Image
  box = (40, 0, 740, 394)   # 16:9になるよう left,top,right,bottom を選ぶ
  Image.open("clip2_end.png").crop(box).resize((1024, 576), Image.LANCZOS).save("clip3_end.png")
  PY
  ```
  クロップ範囲は**次のクリップで必要になる要素（机面・小道具・共演者）が切れないように**取る。逆に「引きになる」フレームは画素を足せないので生成する。クロップで作ったフレームは`script.md`の生成メモに「crop of clipN_end, not generated」と記録する。
- **セリフのあるクリップのキーフレームには話者を視覚的に示す**: 話者は口を開けて話している最中の状態（ジェスチャー含む）で描き、非話者は口を閉じた状態で描く（例: "Fukuchan is mid-speech with his mouth open; Yametaro's mouth is closed, listening"）。キーフレーム自体が「誰が話しているか」の最も強いシグナルになり、リップシンクの取り違えを防ぐ。生成後の目視確認でも話者の口の開閉をチェックする。
- **「mouth stays CLOSED」だけでは口が開く。** 笑顔を指示すると、モデルは**歯を見せた大口の笑顔**を描く（実測で発生）。ナレーションクリップの非話者にこれが出ると「このキャラが話している」信号になり、Seedanceが取り違える直接原因になる。**ナレーションだけのクリップ（画面内に話者がいないクリップ）は登場人物全員を閉口させる。** 次の2つを両方やる:
  - **口の形を機械的に記述する**: "draw his mouth as a single small thin closed curved line with his lips sealed together — do NOT draw an open mouth, do NOT draw any teeth, do NOT draw a wide toothy grin, do NOT draw a dark mouth opening"。
  - **口の形を含意する感情語をプロンプトから全部外す。** "smile" / "beaming" / "grin" は歯を見せた大口を、"surprise" / "gasp" / "shout" は丸く開いた口を引き寄せる。"closed-mouth smile" や "comic surprise" と書いても効かない（実測で smile 2回・surprise 1回 失敗）。**感情は必ず目と眉だけで指定する**: "his eyes are wide with happy curiosity" / "his eyes are calm and proud" / "very wide open round eyes and eyebrows raised high"。閉口の固定文にも "Every emotion is expressed ONLY through his eyes and eyebrows, never by opening his mouth." を含めておく。
- **機構小物は「向き」と「位置・角度」の両方を固定する。** ノートPCが裏返って**蓋の背面がカメラを向く**ドリフトと、**机上で勝手に回転する**ドリフトの両方が起きた。回転は「理由のない動き」なのでSeedanceが補間でPCを回してしまう。Fixture layoutの蝶番指定に加えて、毎フレーム次を入れる: "the laptop stays in EXACTLY the same place on the desk at EXACTLY the same angle as in the input image — it does NOT rotate, does NOT swivel, does NOT slide. Its screen FACES THE CAMERA so the full screen rectangle is squarely visible — we see the FRONT of the screen and never the back or side of the lid"。
- 画像生成プロンプトには台本のProp states（グラスの中身の量、瓶の持ち方等）とFixture layout（蝶番側・ノブ側・開き方向）をそのまま含める。**生成後は各画像をReadで開き、小道具の状態がProp state ledgerの該当セルと一致しているか、建具の蝶番・ノブがFixture layoutどおりの側にあるか目視確認する**（例: 開始フレームのグラスが空であるべきなのに満杯で描かれていないか、瓶に口をつけていないか、閉まったドアのノブが蝶番側に付いたり消えたりしていないか）。ズレていたら再生成する。キーフレームが間違っているとSeedanceは間違った状態間を忠実に補間してしまう。
- 全キーフレーム生成後、**台帳の1行ごとに全フレームを時系列で見比べる最終チェック**を行う: 隣り合うフレーム間で小道具の状態が変わっている箇所すべてに、そのクリップのMotion prompt内の対応する動作があるか確認する。動作なしに状態が飛んでいる境界が1つでもあれば、該当フレームを再生成するか台本を直してから次の工程に進む。
- 保存先は必ず `03_SCRIPTS/<NN>_<slug>/` 配下。
- ユーザーからストーリーを渡された際は、台本・Seedanceプロンプト作成に続けて、このルール（クリップごとに開始＋終了の2枚、前フレームを種にチェーン、キャラ参照を必ず添付、つなぎ目は共有）に沿ってキーフレームも生成する。

## 4. CapCut（Seedance 2.0）への入力対応表

動画生成は**CapCutに統合されたSeedance 2.0**で行う。CapCutは**開始フレーム（Frame A）と終了フレーム（Frame B）のデュアル参照**に対応し、参照画像も多数渡せる。`script.md`の各クリップに、**CapCutの各スロットへ何を渡すか**の対応表を必ず書く（ユーザーがそのまま設定できるようにするため）。

各クリップの記載例（英語で書く）:

```
### CapCut inputs (Clip 1)
- Start frame (Frame A): `clip1_start.png`
- End frame (Frame B): `clip1_end.png`
- Reference images (identity lock — one line per file so CapCut slot numbers map to characters):
  - @Image1 = `Sobaya_sheet.png` → Sobaya (the hulking 180cm/100kg masked man)
  - @Image2 = `Tokun_sheet.png` → Tokun (the chubby 165cm man in straw hat and aloha shirt)
  - @Image3 = `Yotan_sheet.png` → Yotan (the slim 170cm blond rocker)
  - @Image4 = `Fukuchan_sheet.png` → Fukuchan (the slim stylish 170cm man in a black long coat)
  - @Image5 = `Yametaro_sheet.png` → Yametaro (the chibi cartoon man with round glasses)
- Audio: `clip1_line1_sobaya.wav` (@Audio1 — spoken by Sobaya) — attach to Seedance and use AS-IS
- Motion prompt: <the clip's Seedance prompt — describe the motion BETWEEN the two frames as explicit state transitions (e.g. "pours beer into the EMPTY glass until it is full; no one drinks from the bottle"); dialogue kept in original language>
- Duration: 5s / Aspect: 16:9
```

**表記は`validate_run_bundle.py`が機械検証する。** 次を厳守する（崩すと検証で落ちる）:

- `- Start frame (Frame A):` / `- End frame (Frame B):` / `- Audio:` は**この見出し文字列そのまま**で始め、ファイル名をバッククォートで囲む。ラベルに`（attach to ...）`のような補足を挟まない（補足はファイル名の後ろに書く）。
- Reference images表の各行は `  - @ImageN = \`ファイル名.png\` → キャラ名（同定句）` の形にする（ファイル名はバッククォート必須）。
- 一方、**Motion prompt内の`Required attached reference files:`ではバッククォートを付けない**（`@Image1 = Sobaya_sheet.png` のようにプレーンテキストで書く）。

- **開始/終了フレームは必ず両方セット**する。片方だけだと単一フレームからの外挿になりブレやすい。
- **Motion promptは「そのまま貼れる完成形」で書き、実行時の要約・短縮を禁止する。** `script.md`のMotion promptがCapCutに入力される最終文字列そのものであり、生成実行者（人間・エージェント問わず）が独自に圧縮・言い換えしてはならない（過去に要約で開始/終了状態・プロップ・NG変更の制約が欠落し、整合性が崩れた）。プロンプトが長すぎて入らない・守られない場合は、要約するのではなく**台本に戻ってクリップを分割**し、1本あたりの情報量を減らす。
- **Durationは必ず明示設定する。** CapCut側のデフォルト尺（約8秒）のまま生成しない。対応表のDuration値を毎クリップ設定し、生成後に実尺が一致しているか確認する（全クリップが同じ約8秒になっていたらデフォルト尺のまま生成された兆候）。セリフのあるクリップのDurationは**「添付音声の合計長＋約1秒」**を目安にする（ステップ1「リップシンク精度ルール」参照）。
- 参照画像は**必要な枚数だけ渡してよい**（CapCut/Seedance 2.0は多数の参照画像を受け付ける）。登場キャラ全員分＋必要なら小道具・環境の参照を足して同一性を固める。プロンプト側で「これらは identity/design reference であって構図ではない」と役割を明記する。
- **Reference images表に書いた全ファイルはラン専用ディレクトリ直下に実在しなければならない。** 表だけ書いて実ファイルを同梱しない状態は禁止する。
- **キャラの参照はキャラクターシート`02_CHARACTERS/<キャラ名>_sheet.png`を第一に使う**（多面図モデルシート。複数アングル＋NG要素クローズアップ＋表情差分を1枚で渡せるため、横顔・後ろ姿・演技でのidentity driftに強い）。プロンプトには "Image N: <name>'s character model sheet — turnaround, detail close-ups and expressions of the SAME character, identity/design reference only, NOT a composition reference" のように役割を明記する。参照は画風の揃ったものだけを混ぜる（実写写真とアニメ調シートを同時に渡すと折衷して顔が変わるため、原則シート側に統一する）。
- **シート上の文字ラベルの扱い**: シートには「SOBAYA」「MASK」等の短い英語ラベルが入っており、これは部位とキャラ名の紐付けを強めるため意図的なもの（実運用で精度向上が確認されている）。ただし**補間対象になるキーフレーム（clipN_start/end.png）には文字を入れない**方針は変わらない。Motion promptに "the reference sheets' text labels must NOT appear in the video" を入れておくと安全。
- **シートとキャラの紐付けを対応表とプロンプトの両方で明示する**: 対応表のReference imagesは「@ImageN = ファイル名 → キャラ名（短い同定句）」の形で1行ずつ書く。Motion prompt内でキャラに言及するときは、毎回「キャラ名＋同定句＋@ImageN」で書く（例: "Sobaya (@Image1, the hulking masked man) lifts the mug"）。同定句は各キャラ設定md（`02_CHARACTERS/0N_*.md`）の「プロンプト用同定句（英語）：」が正典。年齢・身長・体格などの設定はシート画像に文字で書き込まず、この同定句としてプロンプト側で渡す（画像内の文字は動画に漏れて崩れるリスクがあり、モデルも文章仕様を確実には読まないため）。
- **各Motion promptの冒頭に、添付必須ファイルをファイル名付きで再宣言する。** 対応表の外に書いただけでは不十分。次の形式で、該当クリップの全`@ImageN`を列挙する:

```
Required attached reference files: @Image1 = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference; @Image2 = Yotan_sheet.png — Yotan's character model sheet, identity/design reference only, NOT a composition reference. These reference attachments are REQUIRED inputs and must remain attached for this generation.
```

- Motion prompt中で`@ImageN`を使う場合、その同じプロンプト内の`Required attached reference files:`行に、`@ImageN = 実ファイル名`と役割が必ず存在しなければならない。名前＋外見同定句だけでは添付宣言の代用にならない。
- **複数キャラが同時に映るクリップ**では、相対的な体格差を固定するため、身長比較画像`02_CHARACTERS/height_lineup.png`（全キャラ横並び・文字なし）をスケール参照として追加で渡してよい。プロンプトに "@ImageN is the height/scale reference for relative body sizes — NOT a composition reference" と役割を明記する。
- クリップをまたぐつなぎ目は、**前クリップの Frame B と次クリップの Frame A を同一画像**にすることで消す（ステップ3のチェーンで担保）。
- **（上級）動きの誘導を強めたいクリップ**では、`04_GAME_ASSETS/voxel`の該当キャラGLBをThree.jsで動かして書き出した短い動画（webm/mp4、合計15秒以内）を**モーション参照として追加で渡す**（Seedance 2.0は動画参照に対応）。構図とキャラはキーフレームで固定したまま、動きだけ正確になぞらせられる。**この参考動画を画像生成パイプライン（draw-things-cli等）に作らせることは禁止**（画像生成の担当は静止画キーフレームのみ）。ユーザーから明示的に依頼されたときに限り、Three.jsレンダリング等の手段で作成する。
- **セリフのあるクリップすべて**で、対応表に `Audio` 行を追加し（ステップ2で生成した音声ファイルをクリップ内の発話順に列挙）、**Seedance生成の入力として添付してそのまま使わせる**。Motion promptに音声添付の指示と発声禁止の否定指示を含める:

```
- Audio: `clip1_line1_fukuchan.wav` (@Audio1 — spoken by Fukuchan) — attach to Seedance and use AS-IS as the dialogue audio track
- Motion prompt: <... ONLY Fukuchan (@Image3, the stylish man in the green jacket) speaks, lip-syncing to @Audio1 — he begins the line almost immediately, and his mouth moves ONLY while @Audio1 is playing; once the line ends his mouth stays CLOSED for the rest of the clip; Yametaro (@Image4) does NOT speak — his mouth stays CLOSED, he only listens; use the attached audio AS-IS and do NOT generate any voice — no synthesized speech, no narration>
```

- 話者バインディング（@メンション＋見た目の同定句＋非話者の口閉じ指示）はステップ1「話者バインディング」のルールに従い、**セリフのある全クリップのMotion promptに必ず入れる**。1クリップ1話者の原則（話者交代でクリップを割る）もここで守られていること。

- **VOICEVOXの声を使ったランでは、対応表の末尾（全クリップの後）に動画内クレジットの指示を必ず書く**（ステップ2の「VOICEVOXクレジット表記」参照）。CapCutでの最終組み立て時に、エンドカードまたはテキストオーバーレイで `VOICEVOX:話者名` を動画内に表示させる:

```
### Credits (REQUIRED — add in CapCut before export)
- On-screen credit text (end-card or overlay on the final clip): VOICEVOX:白上虎太郎 / VOICEVOX:ずんだもん
- Add this with CapCut's text tool — do NOT render it via Seedance/keyframe images.
```

## 5. 生成実行プロトコル（script.mdに必ず含める・実行者への指示）

過去のランで「音声が生成時の参照扱いで終わり最終動画に元音声が乗らない」「12本を一括生成して尺・音声の検証を挟めない」「プロンプトの要約で制約が欠落する」「クリップ尺が発話より大幅に長く、口パクが音声から1秒以上ずれる」失敗が起きた。再発防止のため、**`script.md`の末尾（Creditsの前）に以下のプロトコルをそのまま（英語で）記載する**。CapCutで生成・編集する実行者（ユーザー・エージェント問わず）はこれに従う。

```
## Generation & assembly protocol (REQUIRED — read before generating anything in CapCut)

### Step 1 — Pilot clip first (batch generation is FORBIDDEN until the pilot passes)
Generate ONLY Clip 1, then verify ALL of the following before touching any other clip:
- [ ] The dialogue audio in the output is the attached wav AS-IS (no synthesized voice, no doubled voices)
- [ ] The CORRECT character lip-syncs to each line (the speaker named in the prompt moves their mouth; every non-speaker's mouth stays closed)
- [ ] Mouth motion starts and ends WITH the audio: the speaker's mouth starts moving when the line starts and stays CLOSED after the line ends (no lip-flap during silence)
- [ ] Motion, poses and prop states match the Motion prompt and the Prop state ledger
- [ ] Hinges, handles and other fixture hardware stay on the edges given in the Fixture layout table in EVERY frame (handles never disappear, jump to the hinge side, or duplicate — especially when a door finishes closing)
- [ ] The clip duration equals the Duration specified in the CapCut inputs table (NOT the ~8s default)
If any check fails, fix the inputs/prompt and regenerate Clip 1 until all pass.
Only then generate the remaining clips, and re-run at least the audio + duration checks on every clip.

### Step 2 — Prompts are verbatim
Paste each clip's Motion prompt into CapCut EXACTLY as written in this file.
Do NOT summarize, shorten, or paraphrase it. If it seems too long, do not compress it —
go back to the script and split the clip instead.

### Step 3 — Final audio track (assembly)
The audio embedded in the generated clips is NOT the final audio, even when the wav was
attached at generation time. When assembling the final video on the CapCut timeline:
1. Mute (or delete) the audio embedded in every generated clip.
2. Lay the original wav files from the Dialogue audio table onto the timeline as the
   final dialogue track. Align each wav to the VIDEO's mouth movement, NOT to the clip
   boundary: nudge the wav until the speech onset lands on the frame where the speaker's
   mouth starts moving.
3. Play back the full timeline before export and confirm every line sounds exactly like
   the local VOICEVOX / Irodori-TTS takes (the source wavs are the single source of truth).
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

検証失敗時は不足ファイルをコピーするかプロンプトを修正し、再実行する。**失敗したままユーザーへ完了報告してはいけない。**
