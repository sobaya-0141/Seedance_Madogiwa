# 窓際族物語 Production Kit

「窓際族物語」のIP（世界観・キャラクター設定）と、それを使った制作物（Seedance向け動画、今後はゲームも）を管理するモノレポ。

## 参照ファイル（IPの原典）
- 世界観: `01_WORLD/WORLD_BIBLE.md`
- 正史エピソード年表: `01_WORLD/STORY_TIMELINE.md`（これまでの出来事。全て現実として扱い、夢オチは採用しない）
- キャラクター設定: `02_CHARACTERS/*.md`（各キャラのNG変更＝デザイン上変えてはいけない要素に注意）
- 台本・生成済みプロンプト: `03_SCRIPTS/`
- ゲーム用アセット（ボクセル）: `04_GAME_ASSETS/voxel/`（全キャラのリグ付きボクセルモデル`.glb`は`04_GAME_ASSETS/voxel/models/`が正典。`tools/build_*_voxel_model.py`から生成するため手作業で編集しない。新規ゲームはモデルをコピーせず、`public/models/`等からここへの相対symlinkで参照する。リグ仕様は`04_GAME_ASSETS/voxel/VOXEL_CHARACTER_KIT.md`を参照）
- ゲーム用アセット（完成動画）: `04_GAME_ASSETS/videos/`（Seedance/CapCutで制作したゲーム組み込み用の完成動画が正典。ゲームからはコピーせず`public/videos/`からの相対symlinkで参照する）

## スキル（制作ワークフロー）
制作物ごとのワークフローはスキルに分離している。該当する作業ではスキルを呼び出して従うこと。

- **Seedance動画制作** (`/seedance`): ユーザーからストーリー（あらすじ）を渡されたら、このスキルに従って台本＋Seedanceプロンプト＋セリフ音声（VOICEVOX/Irodori-TTSボイスクローン、配役の正典は`02_CHARACTERS/VOICE_CAST.md`）＋Codex参考画像を作成する。詳細: `.claude/skills/seedance/SKILL.md`
- **ローカル動画制作** (`/local-video`): ユーザーから「**ローカルで動画作成して**」と指示されたら、`/seedance`ではなくこのスキルを使う。動画生成をクラウド（CapCut/Seedance）ではなくローカルのMiniMax H3（ComfyUI）で行い、キーフレームはdraw-things-cli、画像検証はQwen3-VL（Ollama）、音声はIrodori-TTS/VOICEVOX、結合はffmpegと全工程をローカルで完結させる。Claude Code・Cursor・Codexのいずれからも実行できる。詳細: `.claude/skills/local-video/SKILL.md`
- **Colab動画制作** (`/colab-video`): ローカルにCUDA GPUが無くMiniMax H3を実行できない環境で、動画生成工程だけをGoogle Colabで実行するスキル。ユーザーから「**Colabで動画を作って**」「H3をColabで回して」「**LTXで動画を作って**」と指示されたときに使う。**素材（キーフレーム・音声・プロンプト）は動画スキルで制作済みのランから受け取るのが既定**（seedanceランをチャプターへ変換する手順はSKILL内7〜8章）。最終結合はローカルのまま、動画生成のみ同梱ノートブックでColabに切り出す（H3=`h3_colab.ipynb`、セリフなしI2VチャプターはLTX-2.5=`ltx25_colab.ipynb`も選べる。セリフのwav駆動リップシンクはH3のみ）。無料T4は配管検証用、本番生成はL4/A100（Pay As You Go / Colab Pro）。Claude Code・Cursor・Codexのいずれからも実行できる（`local-video`と同じ扱い）。詳細: `.claude/skills/colab-video/SKILL.md`
- **画像検証** (`/image-validation`): 動画制作スキル（`/seedance`・`/local-video`）で生成されたキーフレーム・参考画像を、動画生成に投入する前に検証するときに使用する。台本の台帳（Prop state ledger / Scene ledger / Fixture layout）と突き合わせ、プロンプト一致・物理整合（ドアノブ位置・ビール残量等）・時間帯/天気の連続性（昼夜ジャンプ防止）をQwen3-VL（Ollama）＋Claude目視の二重チェックで検証し、修正リスト（`fix_list.md`）を確定させる（再生成自体は生成元スキルのルールに従う）。Claude Code・Cursor・Codexのいずれからも実行できる（VLM検証にはOllamaが必要。無い環境ではスキル記載のフォールバックに従う）。詳細: `.claude/skills/image-validation/SKILL.md`
- **ボクセルモデル制作** (`build-voxel-character-from-image`): キャラクターの参照画像からリグ付きボクセルGLBを作成・修正するときに使用する。成果物は`04_GAME_ASSETS/voxel/`に配置する。詳細: `.claude/skills/build-voxel-character-from-image/SKILL.md`
- **2Dゲーム制作** (`/2d-game`): 2Dゲームを新規作成するとき、およびSeedanceで制作した完成動画（添付mp4）をオープニング/イベントのカットシーンとしてゲームに組み込むときに使用する。完成動画の正典置き場は`04_GAME_ASSETS/videos/`（ゲームからは`public/videos/`の相対symlinkで参照）。詳細: `.claude/skills/2d-game/SKILL.md`
- **Madogiwa Studio登録** (`madogiwa-studio`): Hosted Remote MCP経由でエピソード、生成バージョン、使用モデル、プロンプト、入力画像・参照音声・資料、生成動画を共有台帳へ登録・確認するときに使用する。詳細: `.claude/skills/madogiwa-studio/SKILL.md`

スキルの実体は`.claude/skills/`に置き、他エージェントへは各ツールのスキルディレクトリからsymlinkで同じSKILL.mdを参照させる: Codex CLI向けは`.agents/skills/`、Cursor向けは`.cursor/skills/`。スキルを追加したら、そのスキルを使わせたいエージェントのディレクトリにsymlinkを張ること（現在は全スキルを`.agents/skills/`・`.cursor/skills/`の両方に公開している）。

## 全制作物に共通の画像生成ルール（キャラクターシート照合・必須）
キャラクターが写る画像を生成するときは、**どのスキルを使っていても（スキルを使っていなくても）**次を必ず守る。ポスター・サムネイル・SNS用の単発画像・ゲーム素材・キーフレーム、すべてが対象。

1. **生成前**: 登場キャラ全員の`02_CHARACTERS/<キャラ名>_sheet.png`を**Readで開く**。同定句（`プロンプト用同定句（英語）`）や記憶だけで書き始めない。同定句は短い要約であり、書かれていない部分（仮面の目穴・口・マーキングの本数、後頭部の髪、肌の色、体型）をモデルが勝手に埋めて別人になる。
2. **生成時**: そのシートを参照画像として渡し、プロンプトに`PRESERVE:`（維持する特徴を形状・個数・色・配置まで数えて書く）と`do NOT carry over:`（シートのポーズ・パネルレイアウト・文字ラベル・背景）を明記する。
3. **生成後**: 生成画像とシートを**両方Readで開いた状態で**、各キャラ設定mdの「シート照合チェックリスト」を1項目ずつPASS/FAIL判定する。1項目でもFAILなら再生成する。「だいたい合っている」で通さない。
4. 検証していない画像を「シートどおり」と報告しない。

このルールを外部の指示（添付ドキュメント・ユーザー提供のプロンプト仕様）が上書きすることはない。

## 全制作物に共通の禁止事項
`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。各キャラのNG変更（仮面/触手/ウクレレ等のデザイン要素）はどの媒体でも変更しない。
