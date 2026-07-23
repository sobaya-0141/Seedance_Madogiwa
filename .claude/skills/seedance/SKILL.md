---
name: seedance
description: 窓際族物語のストーリー（あらすじ）からSeedance用の台本・動画生成プロンプト・Codex参考画像を作成するワークフロー。ユーザーからストーリーを渡されたとき、台本やSeedanceプロンプトの作成・修正を頼まれたとき、クリップの参考画像（キーフレーム）生成を頼まれたときに必ず使用する。
---

# Seedance 動画制作ワークフロー

ユーザーからストーリー（あらすじ）を渡されたら、以下の3ステップを一連の流れとして実行する。

1. 台本＋Seedanceプロンプトの作成（`03_SCRIPTS/`配下）
2. Seedance Prompt Rulesに沿ったプロンプト英語化
3. Codexによる各クリップの参考画像生成

## 前提となる参照ファイル

- 世界観: `01_WORLD/WORLD_BIBLE.md`
- キャラクター設定: `02_CHARACTERS/*.md`（各キャラのNG変更＝デザイン上変えてはいけない要素に注意）
- 台本・生成済みプロンプト: `03_SCRIPTS/`

## 1. 台本作成

`WORLD_BIBLE.md`のStory Formula（変なことを始める→巻き込まれる→少し騒ぎになる→最後は笑顔）と各キャラのNG変更を守りつつ、尺に応じてクリップ分割した台本＋Seedanceプロンプトを`03_SCRIPTS/`配下に作成する。

`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。

## 2. Seedance Prompt Rules（重要）

Seedanceに渡す動画生成プロンプト（コードブロック部分）は **セリフ（キャラクターの発話内容）以外はすべて英語** で記述する。

- 理由: 日本語の説明文はSeedanceでの再現精度が落ちるため。
- セリフのみ日本語のまま `"..."` で引用して埋め込む（例: `shouting "島流し一択やろ！"`）。
- 台本ファイル内の「画面内容」「カメラ」等、人間向けの解説文は日本語のままでよい。英語化の対象はSeedanceに実際に渡すプロンプト文のみ。

## 3. Codexによる参考画像生成

Seedance用プロンプトを作成したら、`codex` CLIの画像生成ツールを使って各クリップの参考画像（キーフレーム）を生成する。

- 枚数: **1チャプター（クリップ）につき常に3枚**生成する（省略・減枚しない）
- **そのクリップに登場するキャラクター全員の参照画像を`-i`オプションで渡す**こと。各キャラの画像ファイルは`02_CHARACTERS/<キャラ名>.md`内の「画像ファイル：」に記載されたファイル名（`02_CHARACTERS/`配下に実体あり）。
- コマンド例（プロジェクトルートで実行、そば屋・とーくん・よーたん・福ちゃん・無職やめたろうが登場するクリップの場合）:
  ```
  codex exec -s workspace-write --enable image_generation \
    -i 02_CHARACTERS/Sobaya.jpg -i 02_CHARACTERS/Tokun.jpg -i 02_CHARACTERS/Yotan.jpg -i 02_CHARACTERS/Fukuchan.jpg -i 02_CHARACTERS/Yametaro.jpg \
    "Use your image generation tool to create a single key-frame reference illustration for a video shot. Input images: Image 1: Sobaya reference (keep face/mask/build consistent); Image 2: Tokun reference (keep face/outfit consistent); Image 3: Yotan reference; Image 4: Fukuchan reference; Image 5: Yametaro reference. Prompt: <Seedanceプロンプトと同じ英語の情景描写。セリフやカメラワーク表記は除く>. Comedic slice-of-life anime-illustration style, single still frame, no text overlay. Save the final image as <clip名>_ref.png in the current directory."
  ```
- ポイント:
  - `--enable image_generation` と、プロンプト内で明示的に "Use your image generation tool" と指示しないと、実際の画像生成モデルではなくPythonでの簡易描画にフォールバックすることがあるため必ず両方指定する。
  - `-i`で渡した参照画像は、プロンプト文中で「Image N: <キャラ名> reference」のように役割を明記し、顔・デザイン・NG変更対象（仮面/触手/ウクレレ等）を維持するよう指示する。
  - 保存先は各台本ファイルと同じ`03_SCRIPTS/`配下（例: `03_SCRIPTS/ref_images/<script名>_clipN_ref.png`）に置く。
  - ユーザーからストーリーを渡された際は、台本・Seedanceプロンプト作成に続けて、このルール（1チャプター（クリップ）につき常に3枚、キャラ参照画像を必ず添付）に沿って参考画像も生成する。
