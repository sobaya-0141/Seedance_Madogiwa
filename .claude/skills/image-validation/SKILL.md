---
name: image-validation
description: 動画制作スキル（/seedance・/local-video）で生成されたキーフレーム・参考画像を台本（script.md）と突き合わせて検証するワークフロー。プロンプトどおりの内容になっているか、小道具の状態（ビールの残量等）や機構小物の位置（ドアノブ・蝶番）が物理的に正しいか、場面の時間帯・天気が急変していないか（昼→夜ジャンプ等）をQwen3-VL（Ollama）とClaudeの目視の二重チェックで検証する。ユーザーから「画像を検証して」「キーフレームをチェックして」と指示されたとき、キーフレーム生成後の検証工程を実行するときに必ず使用する。
---

# 画像検証ワークフロー（キーフレームQA）

動画制作スキルが生成したキーフレーム・参考画像を、動画生成に投入する**前に**検証するスキル。キーフレームの誤りは動画側で忠実に補間・増幅されるため（間違った状態間の補間、夜で描かれた昼の場面、瞬間移動するドアノブ等）、このスキルで欠陥を動画生成前に潰す。

**実行主体はClaude Code・Cursor・Codexのいずれでもよい**（symlinkは`.cursor/skills/`と`.agents/skills/`の両方に張ってある）。ただしステップ3のVLM一括検証にはローカルのOllamaが必要。Ollamaを導入できない環境で実行する場合はステップ3をスキップし、その代わりに**ステップ4の目視検証を全フレーム・全チェックリスト項目について行い**、レポートに「VLM検証は未実施」と明記する（実施していない検証を実施済みとして報告しない）。以降の「Claude」は実行エージェント自身（Claude Code / Cursor / Codex）と読み替える。

## 検証対象と原則

対象は次のいずれか:

- **`/seedance`のラン**: `03_SCRIPTS/<NN>_<slug>/` の `clipN_start.png` / `clipN_end.png`
- **`/local-video`のラン**: `03_SCRIPTS/<NN>_<slug>/` の `chN_start.png` / `chN_end.png`
- **任意の画像＋期待内容**: ユーザーが画像と「こう写っているはず」の情報を渡してきた場合

原則（このスキルの要）:

1. **期待値の正は台帳**。`script.md`のProp state ledger / Scene ledger / Fixture layoutと各クリップ（チャプター）の記述から、フレームごとの期待状態を機械的に写し取る。思い込み・記憶でチェックリストを書かない。
2. **VLMとClaudeの二重チェック**。Qwen3-VLの判定は見落とし・誤検出の両方があり得るため、FAILだけでなくPASSも指摘内容を読み、ClaudeもReadで画像を開いて突き合わせる。**最終判断は常にClaudeが行う**。
3. **単画像チェックと時系列チェックは別工程**。昼夜ジャンプ・状態ジャンプ・金具の瞬間移動は隣接フレーム間の差分にしか現れないため、VLMの単画像検証だけで完了扱いにしない。
4. **このスキルは1枚も再生成しない**。出力は検証レポートと修正リスト（`fix_list.md`）まで。再生成は生成元スキルのルールに従う（`/local-video`ステップ6-3、`/seedance`ステップ3）。修正リストが完全確定する前に部分的な作り直しを始めることを禁止する（チェーン崩壊と手戻りの温床）。

## 0. セットアップ確認

VLM検証にはOllama + Qwen3-VLを使う:

- 導入: `brew install ollama`（または https://ollama.com/download ）→ `ollama pull qwen3-vl:8b`（または`:32b`）
- **32Bは64GB以上のマシン向け**（検証精度優先）。32GB機では`qwen3-vl:8b`を使う。モデルは`OLLAMA_VLM`環境変数または`--model`で差し替え可能。
- Ollamaサーバは同梱スクリプトが未起動なら自動起動する。

## 1. 検証対象と期待値（台帳）の特定

1. ランディレクトリを特定し、`script.md`を**全文読む**。特に次を抽出する:
   - **Prop state ledger**（小道具の通し状態台帳）: 行＝小道具、列＝キーフレーム境界
   - **Scene ledger**（場所・時間帯・天気の通し台帳）
   - **Camera plan**（全クリップのショットリスト: ショットサイズ・アングル、カメラムーブ、つなぎ方＝SHARED FRAME/CUT）
   - **Fixture layout**（建具・機構小物の蝶番側/ノブ側/開き方向。全編不変）
   - 各クリップ/チャプターのFirst frame・Last frame・Prop states・Motion prompt（キーフレーム生成プロンプトがあればそれも）
   - Dialogue audio表（セリフのあるクリップの話者 → 口の開閉チェックに使う）
2. 検証する画像の一覧を作る: `clipN_start/end.png`（または`chN_start/end.png`）を番号順に列挙し、**つなぎ目の共有関係**（クリップNのend＝クリップN+1のstartが同一ファイル/コピーのはず）をメモする。
3. 登場キャラごとに`02_CHARACTERS/0N_*.md`の**NG変更**（デザイン上変えてはいけない要素）を確認する。ランに同梱された`*_sheet.png`をReadで開き、正しい姿を頭に入れてから検証に入る。
4. **台帳が無い旧ラン・任意画像の場合**: キーフレーム生成プロンプト（あれば）とユーザーの説明から期待状態を組み立てる。その場合も後述の「汎用物理整合チェック」は全項目適用する。

## 2. フレーム固有チェックリストの組み立て（英語）

各画像について、`script.md`の該当箇所から**そのフレーム固有のチェックリスト**を英語で組み立て、`<run_dir>/validation/checklists/<画像名（拡張子なし）>.txt` として保存する（例: `validation/checklists/clip3_start.txt`）。

必ず含める観点（該当するもの全て。番号付き箇条書きで、1項目1検証にする）:

1. **プロンプト一致**: そのフレームのFirst/Last frame記述どおりの構図・キャラの位置・ポーズ・表情・動作か。構図はCamera planの該当行（ショットサイズ・アングル。例: WIDE establishing / CLOSE-UP, low angle）と一致しているか。
2. **1枚絵として成立**: 複数パネル・シート化・文字/ラベル/ウォーターマーク混入がない（キャラクターシートの文字ラベルが漏れ込んでいない）。
3. **キャラのNG要素**: 登場キャラ全員について、NG変更対象（仮面・触手・ウクレレ・丸メガネ等）が**正しい形で存在する**か。「形が崩れる」と「丸ごと消える」の両方を見る。頭身・スケール（チビキャラと人間キャラの身長差）も含む。
4. **Prop state ledgerとの一致（物理整合）**: 該当セルの状態そのまま（グラスの中身の量、開栓/未開栓、手に持つ/置いてある、器の**個数**）。台帳に無い2つ目の器・瓶が勝手に足されていないか。
5. **Scene ledgerとの一致（時間帯・天気）**: 場所・時間帯・光・天気が該当セルどおりか。空・窓外・照明器具の点灯状態まで見る（昼の場面なのに夜空・点灯した提灯・暗い窓外になっていないか、晴れの場面なのに雨・曇天になっていないか）。
6. **Fixture layoutとの一致（機構整合）**: ドア・引き戸・引き出し等の蝶番側とノブ/取っ手側が台帳どおりか。**ノブは必ず蝶番の反対側の端**にあるか、消えたり複製されたりしていないか。
7. **話者の口の開閉**: セリフのあるクリップのキーフレームでは話者の口が開き、非話者全員の口が閉じているか。
8. **画風の一致**: そのランの画風固定文と合っているか（このIPは「実写調の空間に、実写系キャラとマットな3Dチビ人形が同居する絵」が基本。勝手にフラットなアニメ絵になっていないか）。

### 汎用物理整合チェック（台帳が無い場合も必ず適用）

- 液体の量は直前の描写と矛盾しないか（注がれていないのに増える、飲んでいないのに減る、こぼれていないのに空になる、が無いか）。
- ノブ・取っ手・蝶番・スイッチ類が実物の構造として成立しているか（蝶番側にノブが付いていないか）。
- 影・照明の方向が画面内の光源と矛盾していないか。屋内照明と窓外の明るさが同じ時間帯を指しているか。
- 手・指の本数、持ち方（グラスを貫通していない等）。
- 鏡・窓・画面内モニタの映り込みが場面と矛盾していないか。

### チェックリストの書き方のコツ

- 各項目は**画像だけを見て真偽判定できる文**にする（"matches the script" ではなく "the beer mug is EMPTY — no liquid visible"）。
- 望む状態は大文字で強調し（EMPTY / FULL / CLOSED / LEFT edge）、崩れやすい要素は否定形も添える（"SMALL ROUND white-rimmed glasses — NOT rectangular, NOT missing"）。
- 数え物は台帳の表現そのまま使う（台帳が「潰れた缶2本＋直立1本」なら、その configuration で書く。台帳と違う理想形で書くと欠陥でないものがFAILし続ける）。

例:

```
This image should be the first frame of a video shot. Verify ALL of the following and answer PASS or FAIL per item:
1. Exactly one coherent scene (not a multi-panel sheet, no contact-sheet layout, no text/labels/watermarks).
2. Fukuchan — a slim stylish black-haired man in a black long coat — is standing on the LEFT, mouth OPEN mid-speech.
3. Yametaro — a chibi 3D figure with an oversized head — wears SMALL ROUND white-rimmed glasses (NOT rectangular, NOT missing), mouth CLOSED, and is MUCH shorter than Fukuchan (reaches only his hip).
4. There is exactly ONE drinking vessel in the frame: a single EMPTY clear glass mug on the table — no liquid visible, and NO second glass, tumbler, cup or bottle anywhere.
5. The entrance door is hinged on its LEFT edge with a silver lever handle on the RIGHT edge (the edge opposite the hinges) at mid-height — the handle is present, not duplicated, not on the hinge side.
6. Time of day: BRIGHT MIDDAY DAYLIGHT — the sky/window view is bright blue daytime, NOT night, no lit lanterns, no dark sky; weather is clear, NOT raining.
7. Style: photorealistic live-action-style scene (NOT flat 2D anime), with Yametaro alone rendered as a soft matte 3D chibi figure.
```

## 3. VLM一括検証（verify_run.py）

チェックリストが全フレーム分そろってから、同梱のバッチドライバで一括検証する:

```
python3 .claude/skills/image-validation/verify_run.py 03_SCRIPTS/<NN>_<slug>
```

- `validation/checklists/*.txt`を名前順に処理し、同名の画像（`.png`/`.jpg`/`.jpeg`）を`verify_frame.py`（Ollama + Qwen3-VL）で検証する。
- 結果は`validation/results/<画像名>.txt`（項目ごとのPASS/FAIL＋根拠）と`validation/summary.md`（一覧表）に書かれる。
- **フレーム数×数十秒〜数分かかるため、必ずバックグラウンドで実行**してポーリングする（フォアグラウンドだとツールタイムアウトに掛かる）。
- 1枚だけ検証したい場合（再生成後の再検証等）は`verify_frame.py`を直接使う:

```
python3 .claude/skills/image-validation/verify_frame.py 03_SCRIPTS/<NN>_<slug>/clip3_start.png \
  < 03_SCRIPTS/<NN>_<slug>/validation/checklists/clip3_start.txt
```

## 4. Claudeによる目視突き合わせ（VLMの答え合わせ）

`validation/results/`の全結果について:

- **FAIL項目**: ClaudeがReadで当該画像を開き、指摘が本当か確認する（VLMの誤検出があり得る。特に「チビキャラの頭身」「様式化された小道具」は誤FAILしやすい）。
- **PASS項目も読む**: 根拠文が画像と合っているか、項目を読み違えていないかを確認する。怪しい場合はClaude自身がReadで画像を開いて判定し直す。
- VLMとClaudeの判定が食い違ったら**Claudeの目視を正とする**。ただし自信が持てない細部（小さな金具の側、遠景の空）は「要再確認」として修正リストに残し、握りつぶさない。

## 5. 時系列クロスチェック（単画像では見えない検証）

台帳の**1行ごとに、全フレームを時系列（番号順）で見比べる**。VLMは使わず、ClaudeがReadで隣接フレームを並べて確認する:

1. **つなぎ目の同一性**: クリップNのendとクリップN+1のstartが共有のはず（Camera planのJoin列が`SHARED FRAME`）の箇所は、まず`shasum`でファイル同一性を確認する。別ファイルの場合はCamera planのJoin列が`CUT`（または場所転換）になっているか突き合わせ、CUTなら**同じ瞬間の視点切り替え**として小道具の状態・時間帯・キャラの位置関係がCUT前後で同一かを確認する（カットを口実にした状態ジャンプは修正リスト行き）。
2. **カメラムーブ両端の構図差**: Camera planでムーブのあるクリップは、startとendの構図差がムーブと一致しているか（push-inなのに両端が同一構図＝ムーブが焼き込まれていない、pan方向が逆、振幅が大きすぎて主被写体がフレームアウトし別シーンに見える等は修正リスト行き）。静止（locked-off）のクリップは両端の構図が一致しているか。
3. **Prop stateの連続性**: 隣接フレーム間で小道具の状態が変わっている箇所すべてに、そのクリップのMotion prompt内の**対応する動作**があるか。動作なしに状態が飛んでいる境界（満杯→空、空→満杯、器の個数変化、持ち替え）は修正リスト行き。
4. **時間帯・天気の連続性（昼夜ジャンプ防止）**: 隣接フレーム間で空の色・窓外・照明の点灯・影の濃さ・天気が急変していないか。変わっている場合、**画面内で時間経過・天候変化を見せる描写**（専用クリップ・時計・セリフ）が台本に対応しているか。無ければ修正リスト行き。場所転換をまたぐ境界は特に注意（転換先が「その場所の典型時間帯」で生成されがち: 居酒屋→夜、オフィス→昼）。
5. **Fixture（金具）の連続性**: ドア・取っ手・蝶番が全フレームで同じ側にあるか。フレーム間で移動・消失・複製があれば修正リスト行き（キーフレーム間で金具が食い違うと、動画側は補間中にノブを消す/瞬間移動させて辻褄合わせをする）。
6. **キャラデザインのドリフト**: チェーン生成の後半フレームほどNG要素が劣化しやすい（メガネの形が変わる、装飾が別キャラに移る、頭身が変わる）。番号順に通しで見て、徐々に崩れている系列を特定する。
7. **画風・光色のドリフト**: 全フレームを通して画風固定文どおりか、色温度が徐々にズレていないか。

## 6. 検証レポートと修正リスト

全チェック（ステップ3〜5）の結果を`<run_dir>/fix_list.md`にまとめる（英語）。**1行＝1修正**:

```
## Fix list (image validation — <date>)

| # | File | Aspect | Problem | Fix policy | Downstream impact |
|---|------|--------|---------|-----------|-------------------|
| 1 | clip3_start.png | Prop ledger | Beer mug is FULL but ledger cell says EMPTY | Regenerate with the EMPTY state + vessel-count negative prompt | clip3_end.png (chained), clip2_end.png (shared copy) |
| 2 | clip5_end.png | Scene ledger | Izakaya exterior rendered at NIGHT (lit lantern, dark sky); ledger says bright midday | Regenerate with "BRIGHT MIDDAY DAYLIGHT, NOT night, lantern unlit" | clip6_start.png (shared copy) |
```

- **Aspect**は観点名（Prompt / NG element / Prop ledger / Scene ledger / Camera plan / Fixture / Speaker mouth / Style / Continuity）。
- **Downstream impact**には、そのフレームを種・共有元にしている下流フレームを必ず列挙する（再生成時の追従範囲を確定させるため）。
- 問題ゼロの場合もレポートは書く（`validation/summary.md`のPASS一覧＋時系列チェックの実施記録があれば十分）。**検証していない観点を「問題なし」と報告しない。**
- 修正リスト確定後の再生成・追従・再検証は生成元スキルのルールに従う（`/local-video`ステップ6-3、`/seedance`ステップ3の再生成ルール）。再生成されたフレームと追従フレームは、本スキルのステップ2〜5を該当フレームだけ再実行して閉じる。
