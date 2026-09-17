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
- **2Dゲーム制作** (`/2d-game`): 2Dゲームの新規作成と、Seedanceで制作した完成動画（添付mp4）をオープニング/イベントのカットシーンとしてゲームに組み込む作業に使用する。完成動画の正典置き場は [04_GAME_ASSETS/videos/](04_GAME_ASSETS/videos/)。詳細: [.claude/skills/2d-game/SKILL.md](.claude/skills/2d-game/SKILL.md)

## ゲーム
手っ取り早く遊びたい方はこちら
https://sobaya-0141.github.io/Seedance_Madogiwa/

- **[そば屋のオフィスクラッシュ](05_OFFICE_CRASH_GAME/README.md)** (`05_OFFICE_CRASH_GAME/`): そば屋を操作してオフィス備品を壊し、得点を競う45秒スコアアタックゲーム。Three.js + React + vinext製。
- **[Voxel Character Lab](06_VOXEL_CHARACTER_LAB/README.md)** (`06_VOXEL_CHARACTER_LAB/`): 全8キャラのボクセルモデル・リグ・基本アクション（Idle／Walk／Smash／Power Smash）を確認するThree.jsプロジェクト。
- **[そば屋の定時ダッシュ 〜バレずに脱出〜](07_SOBA_ESCAPE_GAME/README.md)** (`07_SOBA_ESCAPE_GAME/`): 定時のオフィスを、巡回する仲間（福ちゃん・よーたん・とーくん・やめたろう）や監視スクリーン（おかやまん）に見つからず脱出するトップダウン型ステルス。右上の監視レーダーで各キャラの視界を読みながら出口を目指す。Vite + TypeScript + Three.js製。
- **[そば屋は心のヤバイやつ 〜ドキドキ好感度ADV〜](08_ROMANCE_NOVEL_GAME/README.md)** (`08_ROMANCE_NOVEL_GAME/`): 一般社員の「あなた」が、白い仮面のそば屋さんを攻略する恋愛ノベルゲーム。全7回の選択で好感度ゲージが変化し、ゲージの量でエンディングが分岐する（MAXで両想いTRUE END）。Vite + TypeScript製。
- **[窓際族バトル 〜立ち飲み処の決闘〜](09_VOXEL_BATTLE_GAME/README.md)** (`09_VOXEL_BATTLE_GAME/`): 部屋コードを交換して離れた相手と対戦する、オンライン1対1のターン制コマンドバトル。8体から1体を選び、固有スキルで決闘。ゲーム本体はGitHub Pages配信のまま、対戦同期にFirebase Realtime Databaseを利用する（同じPCの2タブで遊べるローカル対戦モードも搭載）。Vite + TypeScript + Three.js製。セットアップは[ゲームのREADME](09_VOXEL_BATTLE_GAME/README.md)を参照。
- **[ギュンギュン・クエスト 〜魔王そば屋と最高の一杯〜](10_GYUN_GYUN_QUEST_GAME/README.md)** (`10_GYUN_GYUN_QUEST_GAME/`): 福ちゃん王にもらった500円で最高の一杯を選び、城下町・平原・洞窟を旅して魔王そば屋へ届けるファミコンRPG風2Dアドベンチャー。オープニングムービーと3種類のエンディングを収録。Vite + TypeScript製。

## ピックアップ動画の結合

公式サイトのピックアップ動画を取得し、同じシャッフル順で「単純結合版」と「各動画の前にタイトルを2秒表示する版」をローカル生成できます。横1920×1080に統一し、縦長動画の左右は黒い余白にします。

Python 3・curl・FFmpegが必要です。管理者ログインやAPIキーは不要です。

```bash
# 対象だけ確認
python3 tools/compile_pickup_videos.py --dry-run

# 2種類のMP4を生成
python3 tools/compile_pickup_videos.py
```

出力先は `.local/pickup-compilations/`。初回セットアップ、フォント指定、最新N作品への絞り込みは [使い方](tools/COMPILE_PICKUP_VIDEOS.md) を参照してください。

## IPの原典
- 世界観: [01_WORLD/WORLD_BIBLE.md](01_WORLD/WORLD_BIBLE.md)
- 正史エピソード年表: [01_WORLD/STORY_TIMELINE.md](01_WORLD/STORY_TIMELINE.md)
- キャラクター設定: [02_CHARACTERS/](02_CHARACTERS/)
- 台本・生成済みプロンプト: [03_SCRIPTS/](03_SCRIPTS/)
- ゲーム用アセット（共用ボクセル）: [04_GAME_ASSETS/voxel/](04_GAME_ASSETS/voxel/)

## For Claude Code
プロジェクトのワークフローやSeedanceプロンプト作成ルールは [CLAUDE.md](CLAUDE.md) を参照。
