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
手っ取り早く遊びたい方はこちら
https://sobaya-0141.github.io/Seedance_Madogiwa/

- **[そば屋のオフィスクラッシュ](05_OFFICE_CRASH_GAME/README.md)** (`05_OFFICE_CRASH_GAME/`): そば屋を操作してオフィス備品を壊し、得点を競う45秒スコアアタックゲーム。Three.js + React + vinext製。
- **[Voxel Character Lab](06_VOXEL_CHARACTER_LAB/README.md)** (`06_VOXEL_CHARACTER_LAB/`): 全8キャラのボクセルモデル・リグ・基本アクション（Idle／Walk／Smash／Power Smash）を確認するThree.jsプロジェクト。
- **[そば屋の定時ダッシュ 〜バレずに脱出〜](07_SOBA_ESCAPE_GAME/README.md)** (`07_SOBA_ESCAPE_GAME/`): 定時のオフィスを、巡回する仲間（福ちゃん・よーたん・とーくん・やめたろう）や監視スクリーン（おかやまん）に見つからず脱出するトップダウン型ステルス。右上の監視レーダーで各キャラの視界を読みながら出口を目指す。Vite + TypeScript + Three.js製。
- **[そば屋は心のヤバイやつ 〜ドキドキ好感度ADV〜](08_ROMANCE_NOVEL_GAME/README.md)** (`08_ROMANCE_NOVEL_GAME/`): 一般社員の「あなた」が、白い仮面のそば屋さんを攻略する恋愛ノベルゲーム。全7回の選択で好感度ゲージが変化し、ゲージの量でエンディングが分岐する（MAXで両想いTRUE END）。Vite + TypeScript製。

## IPの原典
- 世界観: [01_WORLD/WORLD_BIBLE.md](01_WORLD/WORLD_BIBLE.md)
- 正史エピソード年表: [01_WORLD/STORY_TIMELINE.md](01_WORLD/STORY_TIMELINE.md)
- キャラクター設定: [02_CHARACTERS/](02_CHARACTERS/)
- 台本・生成済みプロンプト: [03_SCRIPTS/](03_SCRIPTS/)
- ゲーム用アセット（共用ボクセル）: [04_GAME_ASSETS/voxel/](04_GAME_ASSETS/voxel/)

## For Claude Code
プロジェクトのワークフローやSeedanceプロンプト作成ルールは [CLAUDE.md](CLAUDE.md) を参照。
