---
name: seedance
description: 窓際族物語のストーリー（あらすじ）からSeedance用の台本・動画生成プロンプト・Codex参考画像を作成するワークフロー。ユーザーからストーリーを渡されたとき、台本やSeedanceプロンプトの作成・修正を頼まれたとき、クリップの参考画像（キーフレーム）生成を頼まれたときに必ず使用する。
---

# Seedance 動画制作ワークフロー

ユーザーからストーリー（あらすじ）を渡されたら、以下の3ステップを一連の流れとして実行する。

1. このラン専用の出力ディレクトリを作成する
2. 台本＋Seedanceプロンプト（英語）の作成
3. Codexによる各クリップの参考画像生成

## 前提となる参照ファイル

- 世界観: `01_WORLD/WORLD_BIBLE.md`
- キャラクター設定: `02_CHARACTERS/*.md`（各キャラのNG変更＝デザイン上変えてはいけない要素に注意）
- 過去の制作物: `03_SCRIPTS/`

## 0. 出力ディレクトリ（毎回、新しい同一ディレクトリにまとめる）

**プロンプト（台本ファイル）と参考画像は、毎回そのラン専用の新しい1つのディレクトリにまとめて出力する。** 従来のように台本を`03_SCRIPTS/`直下、画像を共有の`ref_images/`に分散させない。

- ディレクトリ: `03_SCRIPTS/<NN>_<slug>/`
  - `<NN>` は既存の連番の次の番号（`03_SCRIPTS/`直下・サブディレクトリの最大番号 + 1、ゼロ埋め2桁）。
  - `<slug>` は内容が分かる英語の短い識別子（小文字・アンダースコア区切り。例: `yametaro_43degrees`）。
- そのディレクトリの中に、台本兼プロンプトファイル `script.md` と、全クリップの参考画像 `*.png` を **すべて同じ階層に** 置く。画像用のサブディレクトリは作らない。
- 台本内から画像を参照するときは、同じディレクトリ内の相対パス（例: `clip1_01_ref.png`）で書く。
- 既存の`03_SCRIPTS/`直下の古い成果物は移動・改変しない。この新ルールは新規ランから適用する。

## 1. 台本作成（deliverableはすべて英語）

`WORLD_BIBLE.md`のStory Formula（変なことを始める→巻き込まれる→少し騒ぎになる→最後は笑顔）と各キャラのNG変更を守りつつ、尺に応じてクリップ分割した台本＋Seedanceプロンプトを `03_SCRIPTS/<NN>_<slug>/script.md` に作成する。

`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。

### 言語ルール（重要）

**`script.md` は全文を英語で書く。** Seedanceに渡すプロンプト（コードブロック）だけでなく、見出し・尺やアスペクト比の説明・「画面内容」「カメラ」「音」「生成メモ」などの人間向け解説も含めて、すべて英語で記述する。

例外として英語以外を使ってよいのは次のみ:

- **キャラクターのセリフ（発話内容）**: 実際に日本語で発話される台詞は日本語のまま `"..."` で引用して埋め込む（例: `shouting "島流し一択やろ！"`）。ナレーションや画面内の指定文字（温度計の「43℃」など）も同様に、実際に表示・発話される言語のまま引用する。
- **発音・読みを指定したい場合など、非英語でしか正確に表現できない理由があるとき**: その語のみ元言語で書き、必要なら英語で補足する。

理由: 日本語の説明文はSeedanceでの再現精度が落ちること、および成果物を言語横断で扱いやすくするため。

## 2. Codexによる参考画像生成

Seedance用プロンプトを作成したら、`codex` CLIの画像生成ツールを使って各クリップの参考画像（キーフレーム）を生成し、**ステップ0で作成したラン専用ディレクトリに保存する**。

- 枚数: **1チャプター（クリップ）につき常に3枚**生成する（省略・減枚しない）。
- **そのクリップに登場するキャラクター全員の参照画像を`-i`オプションで渡す**こと。各キャラの画像ファイルは`02_CHARACTERS/<キャラ名>.md`内の「画像ファイル：」に記載されたファイル名（`02_CHARACTERS/`配下に実体あり）。
- 保存先は必ずラン専用ディレクトリ `03_SCRIPTS/<NN>_<slug>/` 内。ファイル名例: `clip1_01_ref.png` … `clip1_03_ref.png`。
- コマンドはプロジェクトルート（`03_SCRIPTS`の親）で実行する。以下はそば屋・とーくん・よーたん・福ちゃん・無職やめたろうが登場するクリップの例:
  ```
  codex exec -s workspace-write --enable image_generation \
    -i 02_CHARACTERS/Sobaya.jpg -i 02_CHARACTERS/Tokun.jpg -i 02_CHARACTERS/Yotan.jpg -i 02_CHARACTERS/Fukuchan.jpg -i 02_CHARACTERS/Yametaro.jpg \
    "Use your image generation tool to create a single key-frame reference illustration for a video shot. Input images: Image 1: Sobaya reference (keep face/mask/build consistent); Image 2: Tokun reference (keep face/outfit consistent); Image 3: Yotan reference; Image 4: Fukuchan reference; Image 5: Yametaro reference. Prompt: <same English scene description as the Seedance prompt, excluding dialogue and camera-work notation>. Comedic slice-of-life anime-illustration style, single still frame, no text overlay. Save the final image as 03_SCRIPTS/<NN>_<slug>/clip1_01_ref.png."
  ```
- ポイント:
  - `--enable image_generation` と、プロンプト内で明示的に "Use your image generation tool" と指示しないと、実際の画像生成モデルではなくPythonでの簡易描画にフォールバックすることがあるため必ず両方指定する。
  - `-i`で渡した参照画像は、プロンプト文中で「Image N: <キャラ名> reference」のように役割を明記し、顔・デザイン・NG変更対象（仮面/触手/ウクレレ等）を維持するよう指示する。
  - 保存先パスは必ず `03_SCRIPTS/<NN>_<slug>/` 配下を指定し、台本ファイルと同じディレクトリに揃える。
  - ユーザーからストーリーを渡された際は、台本・Seedanceプロンプト作成に続けて、このルール（1クリップ3枚、キャラ参照画像を必ず添付、ラン専用ディレクトリに保存）に沿って参考画像も生成する。
