---
name: no-image-video
description: 窓際族物語の動画を、チャプター毎のキーフレーム画像を作らずに「プロンプト＋キャラクターシート＋セリフ音声」だけでMiniMax H3（R2V）に生成させるワークフロー。ユーザーから「画像なしで動画を作って」「キーフレームなしで動画を作って」「シートだけで動画を作って」と指示されたときに必ず使用する。大まかな指示→チャプター分割案→チャプター毎の動きを人間に確認→全チャプター確定→プロンプト作成の順で進め、確定前にプロンプトを書かない。画風の注意文はチャプターに映るものだけを最小限で書き、モブキャラはラン専用のキャラクターシートを作って渡す。動画生成の実行先は/colab-video（Colab）または/local-videoステップ7（ローカルCUDA）。
---

# 画像なし動画制作ワークフロー（MiniMax H3 R2V・キーフレームなし）

**実行主体はClaude Code・Cursor・Codexのいずれでもよい**（`.agents/skills/`と`.cursor/skills/`の両方にsymlinkしてある）。

ユーザーから「**画像なしで動画を作って**」「キーフレームなしで」「シートだけで」と指示されたら、`/seedance`・`/local-video`ではなくこのスキルを使う。

## 位置づけ（既存の動画スキルとの違い）

| | `/seedance` `/local-video` `/colab-video` | **本スキル** |
|---|---|---|
| チャプター（クリップ）毎の画像 | 開始/終了キーフレームをチェーン生成し、動画モデルに渡す | **作らない・渡さない** |
| 動画モデルへの入力 | キーフレーム＋シート＋音声 | **プロンプト＋キャラクターシート＋セリフ音声だけ** |
| 生成モード | セリフなし=I2V / あり=R2V | **全チャプターR2V**（シートを渡せる唯一のモード。セリフなしチャプターも音声なしR2V） |
| 画風の指定 | ラン全体で1行の`## Style block`を全プロンプトに逐語埋め込み | **チャプター毎の最小限のStyle line**（そのチャプターに映るキャラ・物だけ） |
| モブキャラ | 文章指定（シート不要） | **ラン専用シート`Mob_<slug>_sheet.png`を必ず作る**（キーフレームが無いため、シートが唯一の見た目の拘束） |
| 台本の進め方 | ストーリーから一気に`script.md`を書く | **チャプター分割案→各チャプターの動きを人間に確認→確定→プロンプト**の段階ゲート |
| つなぎ目 | フレーム共有で消す | 共有フレームが無いので**既定はCUT（別ショット）** |

画像工程が無いぶん、**チャプター毎の動作をプロンプトに具体的に書き切ること**と**人間による事前確認**が品質の要になる。過去にこの方式で「画風の注意文が登場しないキャラや物（パトカー・別キャラ）まで列挙し、肝心の動作（誰がどこから出てきて誰と歩くか）が書かれていない」プロンプトが生成された。本スキルはその再発防止のために、(a) 確定済みチャプター計画からしか本文を書かない、(b) Style lineは映るものだけ、(c) 機械検証で不在キャラへの言及を弾く、の3点を強制する。

### 既存スキルから引き継ぐ共通ルール（本ファイルには差分だけを書く）

作業前に該当セクションを必ず読むこと:

- `.claude/skills/seedance/SKILL.md` **ステップ0**（ラン専用ディレクトリ・シートの物理同梱・basename参照・全シートをReadで開く）、**ステップ1**のうち Story Formula・禁止事項 / Prop state ledger・物理整合性 / Scene ledger・昼夜ジャンプ防止 / Camera plan・単調防止 / Fixture layout / 話者分離（1チャプター1話者）/ リップシンク精度 / 言語ルール（`script.md`は英語・セリフのみ日本語）/ 画面内テキスト禁止 / 音響設計（`Soundscape:`・`Music:`）/ キャラ正典（`PRESERVE:`）/ 人数固定 / 話者バインディング、**ステップ2**（音声2テイク→ユーザー確認→確定、Dialogue audio表、VOICEVOXクレジット）。
- `.claude/skills/local-video/SKILL.md` **ステップ3**のうち「チャプターの定義（H3の入力制限）」「Motion promptの内部構造（公式h3-prompt-writing準拠）」、**ステップ4**の2.0秒パディング、**ステップ7〜8**（ComfyUI実行・結合）。
- `.claude/skills/colab-video/SKILL.md`（Colabで生成する場合の`build_h3_run_package.py`・ノートブック運用）。

**引き継がないもの**: `## Style block`の全プロンプト逐語埋め込み（本スキルはチャプター毎のStyle lineに置き換える）、キーフレーム生成・キーフレーム検証（ステップ5〜6）、I2Vモード、「クリップNの終了フレーム＝クリップN+1の開始フレーム」の共有規則。

## ワークフロー全体（順に実行する・ゲートを飛ばさない）

0. ラン専用ディレクトリの作成、正典シートの同梱、全シートをReadで開く
1. **チャプター分割案**（`chapter_plan.md`・日本語）→ **ユーザー確認（ゲート1）**
2. **チャプター毎の動きの詳細化**（開始配置・ビート・終了状態・カメラ・セリフ・モブの外見）→ **ユーザー確認 → `Status: APPROVED`（ゲート2）**。全チャプターAPPROVEDまでプロンプトを1本も書かない
3. **モブキャラクターシートの作成**（生成→仕様との照合→**ユーザー確認 → `Sheet: APPROVED`（ゲート3）**）
4. セリフ音声の生成（2テイク→ユーザー確認→確定→2.0秒パディング）
5. `script.md`（英語）: 台帳＋各チャプターのH3 inputs表＋Motion prompt
6. 機械検証（`validate_no_image_run_bundle.py`）
7. 動画生成（パイロット→残り）: Colab（`/colab-video`）またはローカルCUDA（`/local-video`ステップ7）
8. ffmpeg結合・クレジット（`/local-video`ステップ8）

## 0. 準備

- `03_SCRIPTS/<NN>_<slug>/`を作る（seedanceステップ0と同じ命名）。
- 登場する**正典キャラ全員**の`02_CHARACTERS/<Name>_sheet.png`を物理コピーし、2人以上が同時に映るランは`height_lineup.png`もコピーする。
- **同梱した全シートをReadで開き**、各キャラ設定md（`02_CHARACTERS/0N_*.md`）の「シート照合チェックリスト」と突き合わせる（CLAUDE.md共通ルール。省略禁止）。本スキルはキーフレームが無いため、シートの正しい理解がそのまま`PRESERVE:`とStyle lineの精度になる。
- `01_WORLD/WORLD_BIBLE.md`の禁止事項（ブラック企業描写・いじめ・パワハラ・鬱展開）は本スキルでも厳守。刑務所・タコ部屋等の題材はコミカルなパロディとして描く。

## 1. チャプター分割案（ゲート1）

ユーザーの大まかな指示（あらすじ）から、**まずチャプター分割と各チャプターのざっくりした内容だけ**を決め、`03_SCRIPTS/<NN>_<slug>/chapter_plan.md`（テンプレート: `templates/chapter_plan.md`。**日本語で書く** — 人間確認用の文書なので言語ルールの例外）に書き、チャットでも同じ内容を提示してユーザーの確認を待つ。**確認前に次のステップへ進まない。**

分割の根拠（H3の制約と本スキルの性質）:

- 1チャプター＝1回のH3生成。**尺4〜15秒**、フレーム数は17k+5グリッド（90=3.75s, 107, 124=5.2s, 141=5.9s, 158=6.6s, 175, 192=8.0s, 209, 226, 243=10.1s, 260, 277, 294=12.25s, 311, 328, 345, 362=15.1s）。
- **1チャプター1話者**（話者交代で割る）。同一話者でも音声は3ファイルまで。セリフのあるチャプターの尺は「wav合計長＋約1秒」。
- **画像は9枚まで**＝そのチャプターに映るキャラのシート枚数（＋`height_lineup.png`）。映るキャラが多すぎて入らないなら、画面に映るキャラを減らすか、チャプターを割る。
- **1チャプター＝1ショット**。キーフレーム共有が無いので、チャプター境界は原則**CUT（別アングル・別場所）**にする。動作の途中で境界を跨ぐ設計（歩いている最中で次章へ続く等）は避け、境界の直前で動作を一度止める・区切る。
- **動きの少ないチャプターは90f（3.75s）以下**にする（低イベントの長尺はモデルが台本に無い動作を発明する。local-video「I2Vの弱点」と同じ性質がR2Vにもある）。
- Story Formula（変なことを始める→巻き込まれる→少し騒ぎになる→最後は笑顔）を満たす分割にする。

各チャプターに書く項目（この段階はざっくりでよい）: 仮題・尺の目安・場所と時間帯・登場（画面内）・ざっくり内容・セリフ（話者つき）。**登場キャラのうち`02_CHARACTERS/`に無い人物はすべてモブ**として`Mob:<slug>`の名前を与え、文末の「モブキャラクター」欄に列挙する。

チャットでの提示は「チャプター番号・仮題・尺・登場・ざっくり内容・セリフ」の1チャプター数行の一覧にし、「この分割でよいか、増減・順番・尺の希望があるか」を聞く。

## 2. チャプター毎の動きの確定（ゲート2・本スキルの要）

ゲート1で分割が固まったら、**全チャプターについて**次を`chapter_plan.md`に追記し、チャットにも同じ内容を提示してユーザーに確認してもらう:

- **開始配置**: 誰がどこに立っているか（画面の左/中/右、向き、姿勢、手に持っている物）、建具の状態（ドアの開閉・蝶番側/ハンドル側）、まだ映っていない人物は「映っていない」と書く。キーフレームが無いので、これが「開始フレームの言葉版」になる。
- **動き（ビート）**: 番号付きで、**おおよその秒数**を添えて順に書く。「誰が・どこから・どこへ・どう」を1ビート1動作で。例（ユーザー提示例をそのまま採用）: 「そば屋が刑務官2人に連れられ刑務所のドアから出てくる。そば屋の両脇に刑務官がついており、3人で歩く」→ ビート化: ①ドアが内側へ開く ②刑務官A→そば屋→刑務官Bの順に出て、そば屋を真ん中に横並びで止まる ③刑務官Aがセリフ ④3人でカメラ側へ一歩踏み出す。
- **終了状態**: ショットの最後の絵（位置・姿勢・建具・小道具）。
- **カメラ**: ショットサイズ・アングル＋ムーブ（種類＋振幅＋速度、または固定）。セリフのあるチャプターは固定〜slow small push-inまで。
- **セリフ**: 話者と日本語原文。画面外の声は`(OFF)`。
- **小道具・建具**: 状態を持つ物（ジョッキの中身等）と可動建具（ドア等）の状態。「そば屋のジョッキ」は**映るなら中身の量まで、映らないなら「なし」と明記**する（NG変更要素でも、シーンに無い物を書かない）。
- **前後のつなぎ**: 次章とのつなぎ（CUT / 連続。連続なら終了状態＝次章の開始配置を同じ言葉で書く）。
- **モブの外見**（そのチャプターに映るモブがいれば末尾のモブ欄に）: 年齢感・体格・髪・顔立ち・制服/衣装（色まで）・帽子・小物。2人以上の同型モブは**見分けがつく差**（年齢・体格・髪）を必ず付ける。

提示は全チャプターまとめて1回でよい（往復を減らす）。ユーザーの修正を反映し、**ユーザーが「OK」と言ったチャプターだけ`- Status: APPROVED`にする**。全チャプターがAPPROVEDになるまでステップ3以降のプロンプト作成へ進まない（モブシート生成・音声生成は、該当チャプターと外見・セリフが確定していれば先行してよい）。確定後にユーザーが内容を変えたら、そのチャプターを`DRAFT`に戻し、再確認後に該当プロンプトを書き直す。

## 3. モブキャラクターシート（必須・ゲート3）

**画面に映るモブ全員**（セリフの有無を問わず。通行人・店員・刑務官・記者等）について、ラン専用のモデルシート`Mob_<slug>_sheet.png`をラン直下に作る。キーフレームが無い本スキルでは、モブの見た目を固定できる入力はシートだけ。文章指定だけで済ませることを禁止する。

- **命名**: `Mob_<slug>_sheet.png`（slugは小文字・数字・`_`。例: `Mob_guard_a_sheet.png`）。同型モブの組（刑務官2人・記者2人等）は**1枚の組シート**にまとめてよい（例: `Mob_guards_sheet.png`。2人が横に並んで写った1枚の写真にし、左の人物＝A・右の人物＝Bとして位置で呼び分ける。**文字ラベルは入れない** — 崩れた文字が動画へ漏れるため。画像9枚の枠も節約できる）。組シートにした場合、`- Cast:`には`Mob:guards`と書く。
- **仕様**: `chapter_plan.md`のモブ欄（ゲート2で承認済み）を英語に落とし、`script.md`の`## Character references`にモブの`PRESERVE:`列として書く（年齢感・体格・髪・顔立ち・制服/衣装の色と部位・帽子・小物を数えて書く）。正典メンバーに似せない（白い仮面・金髪ロッカー等の正典要素を持たせない）。
- **入手（既定はユーザー提供・重要）**: **モブシートはユーザーに作ってもらうのが既定**。ゲート2で承認された外見仕様を英語で渡し、次の形式で用意してもらう:
  - 実写のスタジオ写真で、**正面・斜め・後ろ・顔クローズアップの4面**を横に並べた1枚（無地のグレー背景、**文字ラベルなし**）。正典シート（`02_CHARACTERS/*_sheet.png`）と同じ register にする。
  - 1人1枚。同型の組を1枚にまとめる必要はない（H3の画像9枚枠に収まる範囲で、1人1枚のほうがプロンプト側から位置ではなく名前で指定でき、群衆の作り分けもできる）。
  - 受け取ったら`Mob_<slug>_sheet.png`へ改名してラン直下にコピーし、**全枚Readで開いて**`PRESERVE:`列を書き起こす（記憶や仕様書だけで書かない）。
- **ローカル生成は実測で不可（2026-09-29）**: 同梱の`make_mob_sheet.sh`（draw-things-cli + Qwen Image Edit 2511のtext-to-image）では**実写の人物シートを作れない**。3枚試した結果は、刑務官が3D/ゲームキャラ調、警察官と客が平面的な2Dイラスト調だった。次の対策はいずれも効かなかった:
  - シート用語（`character model sheet` / `turnaround` / `panel` / `FRONT / SIDE / BACK labels`）を排除して「無地の背景の前に立つ全身のスタジオ写真」として記述する — **イラスト度は下がるが実写にはならない**（最初の版ではさらに悪く、線画調になった上に指定した制帽が片方から丸ごと消え、ラベル文字も`BACE`等に崩れた）。
  - カメラ機種・レンズ・ISO・`visible skin pores`・`NOT a 3D render, NOT CGI`まで書く — 変化なし。
  正典シートは実写ベースなので、イラスト調のモブシートを渡すと動画の画風がそちらへ引っ張られる。**時間の無駄なので、実写向けのモデルがローカルに入っていない限り`make_mob_sheet.sh`に頼らない**（スクリプトは残してあるが、実写でなくてよい企画向け）。
  - **否定形で書いた物体はかえって描かれる**: 客のシートに`neither holds a musical instrument`と書いたら2人ともエレキギターを持って出てきた（`no lanyard`と書いた青いストラップも付いた）。画像生成では、その場に無い物は**否定形で書かずに一切言及しない**。否定形が効くのは「崩れやすい既存要素の形を守る」用途（`NOT rectangular glasses`）に限る。
  - **Codex CLIへのフォールバックも当てにしない**（2026-09-29の実測: 本リポジトリの`.codex/config.toml`にある`default_tools_approval_mode = "writes"`をローカルの`codex` 0.139.0が受け付けず即時終了し、リポジトリ外で実行してもアカウントの既定モデルにCLIが未対応で失敗した）。使うなら先に`codex exec`が1回通ることを確認する。
- **照合（必須）**: 受け取った（または生成した）シートを**Readで開き**、モブの`PRESERVE:`列を1項目ずつPASS/FAIL判定する（4面で同一人物か、制服の色・帽子・小物が仕様どおりか、文字が写り込んでいないか、正典メンバーの要素が混ざっていないか、**実写になっているか**）。1項目でもFAILなら作り直してもらう。Ollamaがあれば`/image-validation`の`verify_frame.py`でVLM二重チェックしてよい。
- **ユーザー確認**: 合格したシートをユーザーに見せ、承認されたら`chapter_plan.md`のモブ欄の該当行を`Sheet: APPROVED`にする（検証スクリプトがこの行を見る）。
- **モブの声**: `02_CHARACTERS/VOICE_CAST.md`の「ナレーション（窓際メンバー以外の発話全般）」行＝Irodori-TTS `Narrator_voice.wav`が既定。複数モブが話すときはシードを変えて声を分ける。VOICEVOX話者を使う場合はユーザーに確認し、クレジット義務（seedanceステップ2）に従う。H3は添付wavをそのまま使う設計のため、**モブのセリフも必ずローカルで生成して添付する**（seedanceの「モブはサンプルなし可」の例外は本スキルでは使えない）。

## 4. セリフ音声

seedanceステップ2と同一（等速＋1.5倍速の2テイク→ユーザーが選ぶ→正式ファイル。Dialogue audio表に採用パラメータと実測長を記録）。本スキル固有:

- ファイル名は`chN_lineM_<char>.wav`（モブは`chN_lineM_mob_<slug>.wav`、ナレーションは`chN_nar1.wav`）。
- **H3は1ファイル2.0秒以上**。短いwavは末尾に無音を足して2.0秒にする（local-videoステップ4のコマンド。先頭には足さない）。Dialogue audio表には`2.0s (padded from 1.4s)`のように併記する。
- **ナレーションもR2Vに添付する**（I2Vが無いため）。プロンプトでは "says in an off-screen voiceover" と書き、映っている全員に "lips remain completely closed" を添える（公式H3ガイドの記法）。ffmpegで後載せする場合はDialogue audio表に`laid over at assembly`と明記し、そのチャプターの音声添付なし・`no speech`扱いで書く。

## 5. `script.md`とプロンプト作成（全チャプターAPPROVED後）

`script.md`は英語（セリフ原文のみ日本語）。構成:

1. タイトル・Production intent（`No-keyframe production: every chapter is MiniMax H3 R2V driven by character sheets + audio only`、生成先、合計尺）
2. `## Character references` — 同梱シートの一覧と、キャラ（正典・モブ）ごとの`PRESERVE:` / `do NOT carry over:`（seedance「キャラ正典ルール」どおり数えて書く）
3. `## Scene ledger`（列＝チャプター境界`C1 start | C1 end / C2 start | ...`）、`## Camera plan`（Join列は`CUT (new shot)`が既定。連続なら`CONTINUOUS (matched end/start state)`）、状態を持つ小道具があれば`## Prop state ledger`、可動建具があれば`## Fixture layout`
4. `## Dialogue audio`
5. 各チャプター: `## Chapter N — <title>` に **Cast / Opening composition / Action beats / End state**（`chapter_plan.md`の承認内容を英語化したもの）を書き、その下に`### H3 inputs (Chapter N)`
6. `## Generation & assembly protocol`（下記）、VOICEVOX使用時は`## Credits`

### H3 inputs表（各チャプター必須・R2V固定）

```
### H3 inputs (Chapter 2)
- Mode: R2V
- Cast: Sobaya, Mob:guards
- Images (connection order = <Picture N> tags; identity/design references ONLY — this run has no keyframes; max 9):
  - <Picture 1> = `Sobaya_sheet.png` — Sobaya's character model sheet, identity/design reference only, NOT a composition reference
  - <Picture 2> = `Mob_guards_sheet.png` — the two prison guards' model sheet (Guard A left, Guard B right), identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, speaking order):
  - <Audio 1> = `ch2_line1_mob_guard_a.wav` (2.5s) — spoken by Guard A, use AS-IS as the dialogue audio
- Total input files: 3
- Duration: 6s requested → Frames: 141 (5.875s at 24fps) / Aspect: 16:9 (native 768p — output rounds to 1344x768)
- Motion prompt: <1行・完成形>
```

- `- Cast:`は**そのチャプターの画面内に映るキャラ**だけ（正典は`02_CHARACTERS`の英名、モブは`Mob:<slug>`）。画面外の声だけのキャラは書かない。添付するシートはCastのキャラのものだけで、Castの全員分を添付する（検証スクリプトが両方向を照合する）。
- 添付できる画像は**キャラクターシートと`height_lineup.png`のみ**。キーフレーム・雰囲気参照・ポスター等は添付しない。

### Motion promptの構造（この順で1行に書く・要約禁止）

1. **添付宣言**: `Required attached input files: <Picture 1> = ファイル名 — 役割（PRESERVE: … ; do NOT carry over: pose, camera angle, sheet background, panel layout, text labels）; … <Audio 1> = ファイル名 — 話者の line, use AS-IS. These attachments are REQUIRED inputs.` に続けて、**必ず** `None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no white sheet background, no labels or text.`（R2Vは開始絵の指定が無いとシートをそのまま第1フレームにしがち）
2. **Style line（チャプター専用・最小限）**: 下記「Style lineの書き方」
3. **Opening composition**（開始フレームの言葉版）: ショットサイズ・アングル、場所、Scene ledgerの時間帯・光の句、Castの各人の位置・向き・姿勢・持ち物、建具の状態（Fixture layoutの蝶番側/ハンドル側）、**人数**（"Exactly three people appear in this chapter — Sobaya, Guard A and Guard B — and each appears EXACTLY ONCE; nobody else enters the frame"）
4. **Action beats**: 承認済みビートを順番どおり、`Beat 1 (0–1.5s): …` の形で秒数つきに。動作は「前状態→動作→後状態」で書く（seedance物理整合性ルール）
5. **Dialogue**（あれば）: 話者に`(S1)`、`<d>[Japanese] 原文</d>`、`lip-syncing to <Audio 1>`、開始タイミングと「口は音声の間だけ」、非話者全員の口閉じ、`Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice`。セリフなしチャプターは `no speech, no dialogue, no narration` を明記
6. **Camera**: Camera planの該当行を「種類＋振幅＋速度」または `locked-off static camera` で
7. **End state**: `The shot ends with …`
8. **ガード**: Castに含まれるキャラのNG要素の再確認（正形＋否定形。例: そば屋の仮面 "NO human eyes, NO realistic nose or lips"）、複製禁止（"moves as ONE continuous person"）、新規人物の侵入禁止、画面内テキスト禁止の定型文（"do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the video must contain no text at all"）
9. `Soundscape: …` `Music: no background music`（既定）

分量は**350〜550語**。長すぎるならチャプターを割る（要約しない）。`extract_prompts.py`で逐語抽出できるよう、`- Motion prompt:`の1行に収める。

### Style lineの書き方（重要・本スキルの修正点）

**そのチャプターの画面に映るものだけ**を書く。ランに登場する全キャラ・全小道具の一覧を毎チャプターに貼ってはいけない。

```
Photorealistic live-action cinematography with natural live-action proportions, <Scene ledgerの時間帯・光の句>; <Castにいるキャラのレンダリング句だけ>. NOT flat 2D anime, NOT cartoon lineart.
```

キャラ別レンダリング句（Castにいるときだけ入れる。表現を揃える）:

| キャラ | 句 |
|---|---|
| Sobaya | `Sobaya is a live-action man with neutral-gray skin and a hard white mask` |
| Fukuchan / Tokun / Yotan / Okayaman / モブ | `<Name> is a real photographed person`（複数なら "Fukuchan and the two guards are real photographed people"） |
| Yametaro | `Yametaro alone is a soft matte 3D chibi toy figure standing in the same real space, lit by the same real light` |
| Takosan | `Takosan is a small matte 3D hooded creature standing in the same real space` |
| Yumemin | `Yumemin is a small matte 3D floating mascot in the same real space` |

- **悪い例（実際に生成された文・禁止）**: "…natural live-action proportions for the prison, street, patrol car, Fukuchan and the human cast, while Sobaya remains live-action…, Yametaro remains a matte 3D chibi figure, Takosan remains…, Yumemin remains…" — そば屋しか映らないチャプターで、映らないキャラ4人と出てこないパトカーを列挙している。モデルはこれらを「出すべきもの」と読んで湧かせる。
- **良い例（そば屋＋刑務官2人のチャプター）**: "Photorealistic live-action cinematography with natural live-action proportions in bright midday daylight; Sobaya is a live-action man with neutral-gray skin and a hard white mask, and the two guards are real photographed people. NOT flat 2D anime, NOT cartoon lineart."
- 場所・小道具も同じ原則: 野原で野球をするチャプターに刑務所・パトカーを書かない。前後のチャプターに出る物を「維持」目的で書かない。
- `validate_no_image_run_bundle.py`は、Motion prompt内に**Castにいない正典キャラの名前**が出た時点でエラーにする。

### Motion promptの完成例（Chapter 2: そば屋が刑務官2人に連れられて出所する）

```
Required attached input files: <Picture 1> = Sobaya_sheet.png — Sobaya's character model sheet, identity/design reference only, NOT a composition reference (PRESERVE: hard white full-face mask with TWO large black circular eye holes and ONE horizontal black mouth slit, four red vertical markings — two flanking each eye — plus a small black dot centered on the forehead, short spiky black hair above the mask visible from every angle, neutral-gray skin on neck, arms and hands, hulking 180cm/100kg thick build, plain white short-sleeve T-shirt, dark jeans, white sneakers; do NOT carry over: pose, camera angle, sheet background, panel layout, text labels); <Picture 2> = Mob_guards_sheet.png — the two prison guards' model sheet, identity/design reference only, NOT a composition reference (PRESERVE: Guard A on the LEFT half — a stocky Japanese man in his 50s with a gray crew cut and a square jaw; Guard B on the RIGHT half — a tall lean Japanese man in his 30s with short black hair; both in a navy-blue uniform jacket and trousers, white shirt, dark-navy tie, navy peaked cap with a small silver badge, black belt and black leather shoes; do NOT carry over: pose, panel layout, white background, labels); <Audio 1> = ch2_line1_mob_guard_a.wav — Guard A's spoken line, use AS-IS. These attachments are REQUIRED inputs. None of the attached pictures is a frame of this video: the video does NOT start on, end on or reproduce any sheet — no panels, no white sheet background, no labels or text. Photorealistic live-action cinematography with natural live-action proportions in bright midday daylight; Sobaya is a live-action man with neutral-gray skin and a hard white mask, and the two guards are real photographed people. NOT flat 2D anime, NOT cartoon lineart. The shot opens on a locked-off static MEDIUM-WIDE shot at eye level facing the closed gray steel front door of a small prison building: a plain concrete wall, the door hinged on its LEFT edge with a steel lever handle on the RIGHT edge at mid-height, one concrete step below it, an empty sidewalk in the foreground; nobody is visible yet. Exactly three people appear in this chapter — Sobaya, Guard A and Guard B — and each appears EXACTLY ONCE; nobody else enters the frame at any time. Beat 1 (0–1.5s): the door swings open inward, away from camera, pulled from inside; its hinges and handle stay on the same edges throughout. Beat 2 (1.5–3s): Guard A steps out first onto the step, then Sobaya, then Guard B; the three stop side by side just outside the door with Sobaya in the MIDDLE, Guard A at his left shoulder and Guard B at his right shoulder, each guard lightly holding one of Sobaya's upper arms. Sobaya's hands are empty (there is no beer mug in this chapter), his mask faces forward, his posture upright and calm. Beat 3 (3–5.5s): Guard A (S1), the stocky older guard on the LEFT, turns his head toward Sobaya and says <d>[Japanese] 出所おめでとう。もう戻ってくるなよ。</d>, lip-syncing to <Audio 1>; he begins the line almost immediately after they stop, his mouth moves ONLY while <Audio 1> is playing, and then stays CLOSED. Sobaya does NOT speak — his mask's mouth slit never changes — and Guard B does NOT speak, his mouth stays CLOSED. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. Beat 4 (5.5–6s): the three take one synchronized step forward toward camera, still side by side. The shot ends with the three mid-stride and the open door behind them. The camera stays locked-off for the whole chapter — no push, no pan, no handheld sway. Sobaya moves as ONE continuous person and is never duplicated; in every frame his mask stays a hard white mask with two black eye holes and one mouth slit — NO human eyes, NO eyelids, NO realistic nose or lips — and his exposed skin stays neutral gray. Do NOT render any on-screen text — no subtitles, no captions, no lettering, no Japanese characters; the video must contain no text at all. Soundscape: a heavy steel door creaking open, three sets of footsteps on concrete, faint city traffic in the distance, a light breeze. Music: no background music.
```

この例の骨格（添付宣言→Style line→開始配置→ビート→セリフ→カメラ→終了状態→ガード→音）を全チャプターで守る。

### 生成実行プロトコル（`script.md`末尾に英語で必ず記載）

```
## Generation & assembly protocol (REQUIRED — read before generating any chapter)

### Step 1 — Pilot chapter first (batch generation is FORBIDDEN until the pilot passes)
Generate ONLY the first dialogue chapter, then verify ALL of the following:
- [ ] No attached sheet is reproduced as a frame: no panels, no white sheet background, no labels or text anywhere
- [ ] The opening composition matches this chapter's "Opening composition" (shot size/angle, location, who stands where, held props, door/fixture state)
- [ ] The action beats happen in the written order and the shot ends in the written end state
- [ ] The dialogue is driven by the attached wav (correct voice, no synthesized or doubled voice); the CORRECT character lip-syncs and every non-speaker's mouth stays closed
- [ ] Every canon character matches their `*_sheet.png` item by item (canon checklist); every mob matches their `Mob_*_sheet.png` item by item (the run's mob PRESERVE list). A near-miss is a FAIL
- [ ] Exactly the listed Cast appears, each EXACTLY ONCE, in EVERY sampled frame (sample at least 3 mid-chapter frames); nobody else enters
- [ ] Style is photorealistic live-action in every sampled frame, with only the exceptions the chapter's style line states
- [ ] Camera matches the Camera plan row; location, time of day and light match the Scene ledger; fixtures stay per the Fixture layout
- [ ] NO on-screen text; Soundscape/Music as written; duration equals the declared frame count (17k+5 grid)
If any check fails, fix the prompt (or split the chapter) and regenerate the pilot until all pass.
Only then generate the remaining chapters, and re-run at least the sheet-leak + composition + cast + audio + duration checks on each.

### Step 2 — Prompts are verbatim
Copy each chapter's Motion prompt into the workflow JSON EXACTLY as written here (extract_prompts.py). Do NOT
summarize or shorten. If it seems too long, go back to the chapter plan and split the chapter.

### Step 3 — Final audio track (assembly)
DEFAULT: keep H3's embedded audio for every chapter (verified faithful to the attached wavs, 2026-08).
ONLY IF the pilot hears degradation, doubling or a changed voice: strip the embedded audio on that chapter
and lay the original wav over the video, aligned to the frame where the speaker's mouth starts moving.
Play back the assembled video before delivery and confirm every line sounds like the local take.
```

## 6. 機械検証（必須・生成前と完了報告前）

```
python3 .claude/skills/no-image-video/validate_no_image_run_bundle.py 03_SCRIPTS/<NN>_<slug>
```

検証内容: `chapter_plan.md`の全チャプターが`APPROVED`で番号が`script.md`と一致 / 使用する全`Mob_*_sheet.png`が`Sheet: APPROVED` / `script.md`がキーフレーム（`chN_start/end.png`）やラン外パスを参照していない / `## Character references`・`## Scene ledger`・`## Camera plan`がある / 全チャプターが`R2V`で`- Cast:`がある / 添付画像が全て`*_sheet.png`か`height_lineup.png`で物理ファイルとして存在し、Castと双方向に一致する / 画像9・音声3・合計12以内、wavが2.0〜15.0秒 / `Frames:`が17k+5グリッド / Motion promptが全添付を再宣言し、必須句（`Required attached input files:`・`NOT a composition reference`・`None of the attached pictures is a frame of this video`・カメラ・`EXACTLY ONCE`・`on-screen text`・`Soundscape:`・`Music:`、セリフ章は`(S1)`/`<d>[Japanese]`/`AS-IS`、無音章は`no speech`）を含む / **Castにいない正典キャラの名前がMotion promptに出ていない**。

さらに、ワークフローJSONを作ったあと（ステップ7の2の直後）に**台本との突き合わせ**を必ず通す:

```
python3 .claude/skills/no-image-video/check_workflows_match_script.py 03_SCRIPTS/<NN>_<slug>
```

検証内容: 各`chN_workflow.json`の`<Picture N>`のファイル名**と接続順**、`<Audio N>`、フレーム数、プロンプト本文が`script.md`の入力表と`chN_prompt.txt`に一致している。workflowの生成は手書きのシェルスクリプトになりがちで、シートの取り違えや順序ズレは**キーフレームが無い本スキルでは生成物が返ってくるまで気づけない**（`<Picture N>`の順序がプロンプト内のタグの意味を決めるため、入れ替わると全タグが別人を指す）。

**検証が失敗したまま生成に進んだり完了報告したりしてはいけない。**

## 7. 動画生成（パイロット→残り）

1. `python3 .claude/skills/local-video/extract_prompts.py 03_SCRIPTS/<NN>_<slug>` でMotion promptを逐語抽出（`chN_prompt.txt`）。
2. 各チャプターのworkflowを生成（全てR2V。`--image`の順序＝`<Picture N>`）:

```
python3 .claude/skills/local-video/build_h3_workflow.py --mode r2v \
  --out 03_SCRIPTS/<NN>_<slug>/ch2_workflow.json \
  --prompt-file 03_SCRIPTS/<NN>_<slug>/ch2_prompt.txt --frames 141 \
  --image Sobaya_sheet.png --image Mob_guards_sheet.png \
  --audio ch2_line1_mob_guard_a.wav
```

3. **Colabで生成する場合（Macでは既定）**: `/colab-video`の2章に従い`build_h3_run_package.py`でバンドルzip＋R2V用ノートブックを作ってユーザーに渡す（本スキルのランはR2Vのみなので`<NN>_<slug>_h3_r2v.ipynb`1本になる。直しが出たら`--fix`で修正版パッケージを作り直す＝zip・ノートブック・Drive出力先が別名になる。`validate_local_run_bundle.py`ではなく本スキルの検証スクリプトを使う）。**ローカルCUDA機**なら`/local-video`ステップ7の`h3_run.py`で回す。
4. **パイロットはセリフのあるチャプター1本**。上記プロトコルのチェックリストで判定し、特に「シートがそのまま第1フレームに出ていないか」「開始配置とビートが承認内容どおりか」「モブがシートどおりか」を見る。開始配置がずれる場合は、Opening compositionの記述を具体化する（人物の位置を画面の左/中/右と距離で指定、"nobody is visible yet"等）か、チャプターを割る。
5. 合格後に残りを生成し、各チャプターで最低3点の中間フレームを確認する。

## 8. 結合

`/local-video`ステップ8と同一（既定は埋め込み音声をそのまま使い、ffmpeg concat。VOICEVOX使用時はdrawtextでクレジット焼き込み）。つなぎ目はCUTなので絵飛びのチェックは「場所・時間帯・キャラの衣装が章間で変わっていないか」に絞る。

- **ランに置く`assemble.sh`はbash 3.2で書く**（macOS標準のbashは3.2で、`declare -A`＝連想配列が使えず`invalid option`で落ちる。実測済み）。チャプター→wavの対応は`case`文にする。
- **回収したら結合前にフレーム数を照合する**: 各`chN.mp4`のパケット数が`script.md`の`Frames:`と一致しているか確認する（`ffprobe -count_packets -show_entries stream=nb_read_packets`）。ズレていればそのチャプターは生成し直し。
- **結合後は全チャプターの中間フレームを1枚のコンタクトシートにして目視する**（`ffmpeg`で各章の中間を抜き、`tile=4x4`で並べる）。画像なし制作では**台本に無い物が湧く**のが主な事故なので、章ごとに「指定した人数・車両数・画面内テキストの有無」を見る。実測（2026-09-29）では、1台だけと明示した章に2台目の車が出て読めるナンバープレートまで付き、別の章では指定していないのぼりに崩れた日本語が出た。**サムネイルサイズでの判定は誤りやすい**（モニター内のキャラを別人と誤認した）。怪しい箇所は必ずクロップして拡大してから判定する。

## 完了条件（すべて満たすまで完了報告しない）

- [ ] `chapter_plan.md`の全チャプターと全モブシートがユーザー承認済み（`APPROVED`）
- [ ] 正典シートを全枚Readで開いて確認した。モブシートは仕様と照合してPASSし、ユーザーが承認した
- [ ] `check_workflows_match_script.py`がOK（ワークフローJSONと台本の突き合わせ）
- [ ] セリフ音声はユーザーが採用テイクを選び、2.0秒以上に整えた
- [ ] 全Motion promptが「添付宣言→Style line（映るものだけ）→開始配置→ビート→セリフ→カメラ→終了状態→ガード→音」の構造で、承認済みビートを漏れなく含む
- [ ] `validate_no_image_run_bundle.py`がOK
- [ ] パイロット合格後に残りを生成し、結合後の通し確認を行った
