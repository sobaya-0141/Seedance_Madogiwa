# 窓際族物語 Production Kit

「窓際族物語」のIP（世界観・キャラクター設定）と、それを使った制作物（Seedance向け動画、今後はゲームも）を管理するモノレポ。

## 参照ファイル（IPの原典）
- 世界観: `01_WORLD/WORLD_BIBLE.md`
- キャラクター設定: `02_CHARACTERS/*.md`（各キャラのNG変更＝デザイン上変えてはいけない要素に注意）
- 台本・生成済みプロンプト: `03_SCRIPTS/`

## スキル（制作ワークフロー）
制作物ごとのワークフローはスキルに分離している。該当する作業ではスキルを呼び出して従うこと。

- **Seedance動画制作** (`/seedance`): ユーザーからストーリー（あらすじ）を渡されたら、このスキルに従って台本＋Seedanceプロンプト＋Codex参考画像を作成する。詳細: `.claude/skills/seedance/SKILL.md`
- ゲーム開発スキルは今後追加予定。

スキルの実体は`.claude/skills/`に置き、Codex CLI向けには`.agents/skills/`からsymlinkで同じスキルを参照させている（Claude Code・Codexの両方が同一のSKILL.mdを読む）。スキルを追加したら`.agents/skills/`にもsymlinkを張ること。

## 全制作物に共通の禁止事項
`WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守する。各キャラのNG変更（仮面/触手/ウクレレ等のデザイン要素）はどの媒体でも変更しない。
