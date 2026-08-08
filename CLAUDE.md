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
- **ローカル動画制作** (`/local-video`): ユーザーから「**ローカルで動画作成して**」と指示されたら、`/seedance`ではなくこのスキルを使う。動画生成をクラウド（CapCut/Seedance）ではなくローカルのMiniMax H3（ComfyUI）で行い、キーフレームはdraw-things-cli、画像検証はQwen3-VL（Ollama）、音声はIrodori-TTS/VOICEVOX、結合はffmpegと全工程をローカルで完結させる。**実行できるのはClaude CodeとCursorのみ（Codexは対象外）。** Codexはこのスキルを使わず、「ローカルで動画作成して」と指示された場合はClaude CodeまたはCursorでの実行をユーザーに案内する（Codex自身は従来どおり`/seedance`のみ担当）。詳細: `.claude/skills/local-video/SKILL.md`
- **画像検証** (`/image-validation`): 動画制作スキル（`/seedance`・`/local-video`）で生成されたキーフレーム・参考画像を、動画生成に投入する前に検証するときに使用する。台本の台帳（Prop state ledger / Scene ledger / Fixture layout）と突き合わせ、プロンプト一致・物理整合（ドアノブ位置・ビール残量等）・時間帯/天気の連続性（昼夜ジャンプ防止）をQwen3-VL（Ollama）＋Claude目視の二重チェックで検証し、修正リスト（`fix_list.md`）を確定させる（再生成自体は生成元スキルのルールに従う）。Claude Code・Cursor・Codexのいずれからも実行できる（VLM検証にはOllamaが必要。無い環境ではスキル記載のフォールバックに従う）。詳細: `.claude/skills/image-validation/SKILL.md`
- **ボクセルモデル制作** (`build-voxel-character-from-image`): キャラクターの参照画像からリグ付きボクセルGLBを作成・修正するときに使用する。成果物は`04_GAME_ASSETS/voxel/`に配置する。詳細: `.claude/skills/build-voxel-character-from-image/SKILL.md`
- **2Dゲーム制作** (`/2d-game`): 2Dゲームを新規作成するとき、およびSeedanceで制作した完成動画（添付mp4）をオープニング/イベントのカットシーンとしてゲームに組み込むときに使用する。完成動画の正典置き場は`04_GAME_ASSETS/videos/`（ゲームからは`public/videos/`の相対symlinkで参照）。詳細: `.claude/skills/2d-game/SKILL.md`

スキルの実体は`.claude/skills/`に置き、他エージェントへは各ツールのスキルディレクトリからsymlinkで同じSKILL.mdを参照させる: Codex CLI向けは`.agents/skills/`、Cursor向けは`.cursor/skills/`。スキルを追加したら、そのスキルを使わせたいエージェントのディレクトリにsymlinkを張ること。**例外として`local-video`はClaude Code・Cursor専用**（`.cursor/skills/`にのみsymlinkし、`.agents/skills/`には張らない。Codexには公開しない）。

## 全制作物に共通の禁止事項
`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。各キャラのNG変更（仮面/触手/ウクレレ等のデザイン要素）はどの媒体でも変更しない。

## FlutterゲームのUI検証

`14_MADOGIWA_CARD_GAME/`は`ccpocket`と同じくDart MCPでデバッグアプリを起動し、
Marionette MCPでUI操作・スクリーンショット・カスタムハーネス検証を行う。
プロジェクト設定は`.mcp.json`と`.codex/config.toml`、専用拡張は
`14_MADOGIWA_CARD_GAME/lib/automation/`を参照する。Flameキャンバス内の状態確認には
`madogiwa.inspectGame`、決定論的シナリオへの遷移には`madogiwa.openScenario`を使う。
