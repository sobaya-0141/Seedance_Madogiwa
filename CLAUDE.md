# 窓際族物語 Production Kit

「窓際族物語」のIP（世界観・キャラクター設定）と、それを使った制作物（Seedance向け動画、今後はゲームも）を管理するモノレポ。

## 参照ファイル（IPの原典）
- 世界観: `01_WORLD/WORLD_BIBLE.md`
- 正史エピソード年表: `01_WORLD/STORY_TIMELINE.md`（これまでの出来事。全て現実として扱い、夢オチは採用しない）
- キャラクター設定: `02_CHARACTERS/*.md`（各キャラのNG変更＝デザイン上変えてはいけない要素に注意）
- 台本・生成済みプロンプト: `03_SCRIPTS/`
- ゲーム用アセット: `04_GAME_ASSETS/voxel/`（全キャラのリグ付きボクセルモデル`.glb`は`04_GAME_ASSETS/voxel/models/`が正典。`tools/build_*_voxel_model.py`から生成するため手作業で編集しない。新規ゲームはモデルをコピーせず、`public/models/`等からここへの相対symlinkで参照する。リグ仕様は`04_GAME_ASSETS/voxel/VOXEL_CHARACTER_KIT.md`を参照）

## スキル（制作ワークフロー）
制作物ごとのワークフローはスキルに分離している。該当する作業ではスキルを呼び出して従うこと。

- **Seedance動画制作** (`/seedance`): ユーザーからストーリー（あらすじ）を渡されたら、このスキルに従って台本＋Seedanceプロンプト＋Codex参考画像を作成する。詳細: `.claude/skills/seedance/SKILL.md`
- **ボクセルモデル制作** (`build-voxel-character-from-image`): キャラクターの参照画像からリグ付きボクセルGLBを作成・修正するときに使用する。成果物は`04_GAME_ASSETS/voxel/`に配置する。詳細: `.claude/skills/build-voxel-character-from-image/SKILL.md`
- ゲーム開発スキルは今後追加予定。

スキルの実体は`.claude/skills/`に置き、Codex CLI向けには`.agents/skills/`からsymlinkで同じスキルを参照させている（Claude Code・Codexの両方が同一のSKILL.mdを読む）。スキルを追加したら`.agents/skills/`にもsymlinkを張ること。

## 全制作物に共通の禁止事項
`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。各キャラのNG変更（仮面/触手/ウクレレ等のデザイン要素）はどの媒体でも変更しない。
