# 窓際族物語 Production Kit

「窓際族物語」のIP（世界観・キャラクター設定）と、それを使った制作物（Seedance向け動画・ゲーム）を管理するモノレポ。

## Characters
- そば屋
- たこさん
- とーくん
- よーたん
- 福ちゃん
- 無職やめたろう
- 窓際王おかやまん
- ゆめみん

## Theme
窓際族の日常コメディ

## スキル（制作ワークフロー）
制作物ごとのワークフローはスキルに分離している。該当する作業ではスキルを呼び出して従うこと。実体は `.claude/skills/` にあり、Codex CLI向けに `.agents/skills/` からsymlinkで共有している。

- **Seedance動画制作** (`/seedance`): ユーザーからストーリー（あらすじ）を渡されたら、台本＋Seedanceプロンプト＋Codex参考画像（キーフレーム）を作成する。詳細: [.claude/skills/seedance/SKILL.md](.claude/skills/seedance/SKILL.md)
- **ボクセルモデル制作** (`build-voxel-character-from-image`): キャラクターの参照画像から、Blender／Three.jsで使えるリグ付きボクセルGLBを作成・修正する。成果物は `04_GAME_ASSETS/voxel/` に配置。詳細: [.claude/skills/build-voxel-character-from-image/SKILL.md](.claude/skills/build-voxel-character-from-image/SKILL.md)
- ゲーム開発スキルは今後追加予定。

## ゲーム
- **[そば屋のオフィスクラッシュ](05_OFFICE_CRASH_GAME/README.md)** (`05_OFFICE_CRASH_GAME/`): そば屋を操作してオフィス備品を壊し、得点を競う45秒スコアアタックゲーム。Three.js + React + vinext製。
- **[Voxel Character Lab](06_VOXEL_CHARACTER_LAB/README.md)** (`06_VOXEL_CHARACTER_LAB/`): 全8キャラのボクセルモデル・リグ・基本アクション（Idle／Walk／Smash／Power Smash）を確認するThree.jsプロジェクト。

## IPの原典
- 世界観: [01_WORLD/WORLD_BIBLE.md](01_WORLD/WORLD_BIBLE.md)
- 正史エピソード年表: [01_WORLD/STORY_TIMELINE.md](01_WORLD/STORY_TIMELINE.md)
- キャラクター設定: [02_CHARACTERS/](02_CHARACTERS/)
- 台本・生成済みプロンプト: [03_SCRIPTS/](03_SCRIPTS/)
- ゲーム用アセット（共用ボクセル）: [04_GAME_ASSETS/voxel/](04_GAME_ASSETS/voxel/)

## For Claude Code
プロジェクトのワークフローやSeedanceプロンプト作成ルールは [CLAUDE.md](CLAUDE.md) を参照。
