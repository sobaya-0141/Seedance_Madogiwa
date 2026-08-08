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
手っ取り早く遊びたい方はこちら: https://sobaya-0141.github.io/Seedance_Madogiwa/

- **[そば屋のオフィスクラッシュ ～無限フロア大整理～](05_OFFICE_CRASH_GAME/README.md)** (`05_OFFICE_CRASH_GAME/`): 大型ビールジョッキを強化し、8つの備品循環フロアを攻略する3Dアクションハクスラ＋ローグライト。ラン履歴、自己ベスト、永続強化、ランキングをSitesのD1へ保存。Three.js + React + vinext製。
- **[Voxel Character Lab](06_VOXEL_CHARACTER_LAB/README.md)** (`06_VOXEL_CHARACTER_LAB/`): 全8キャラのボクセルモデル・リグ・基本アクション（Idle／Walk／Smash／Power Smash）を確認するThree.jsプロジェクト。
- **[そば屋の定時ダッシュ 〜バレずに脱出〜](07_SOBA_ESCAPE_GAME/README.md)** (`07_SOBA_ESCAPE_GAME/`): 定時のオフィスを、巡回する仲間（福ちゃん・よーたん・とーくん・やめたろう）や監視スクリーン（おかやまん）に見つからず脱出するトップダウン型ステルス。右上の監視レーダーで各キャラの視界を読みながら出口を目指す。Vite + TypeScript + Three.js製。
- **[そば屋は心のヤバイやつ 〜ドキドキ好感度ADV〜](08_ROMANCE_NOVEL_GAME/README.md)** (`08_ROMANCE_NOVEL_GAME/`): 一般社員の「あなた」が、白い仮面のそば屋さんを攻略する恋愛ノベルゲーム。全7回の選択で好感度ゲージが変化し、ゲージの量でエンディングが分岐する（MAXで両想いTRUE END）。Vite + TypeScript製。
- **[窓際ボクセル・退勤作戦](08_FLUTTER_VOXEL_GAME/README.md)** (`08_FLUTTER_VOXEL_GAME/`): 正典のそば屋GLBをそのまま使い、発光空間・破壊FX・カメラ演出・自動デモで仕上げたAndroid／iOS向け展示ショーケース。Flutter + Flame + Flame 3D製。
- **[窓際族バトル 〜立ち飲み処の決闘〜](09_VOXEL_BATTLE_GAME/README.md)** (`09_VOXEL_BATTLE_GAME/`): 部屋コードを交換して離れた相手と対戦する、オンライン1対1のターン制コマンドバトル。8体から1体を選び、固有スキルで決闘。ゲーム本体はGitHub Pages配信のまま、対戦同期にFirebase Realtime Databaseを利用する（同じPCの2タブで遊べるローカル対戦モードも搭載）。Vite + TypeScript + Three.js製。セットアップは[ゲームのREADME](09_VOXEL_BATTLE_GAME/README.md)を参照。
- **[ギュンギュン・クエスト 〜魔王そば屋と最高の一杯〜](10_GYUN_GYUN_QUEST_GAME/README.md)** (`10_GYUN_GYUN_QUEST_GAME/`): 福ちゃん王にもらった500円で最高の一杯を選び、城下町・平原・洞窟を旅して魔王そば屋へ届けるファミコンRPG風2Dアドベンチャー。オープニングムービーと3種類のエンディングを収録。Vite + TypeScript製。
- **[そば屋のオフィス更地クラッシュ ～全部壊して快適です！～](10_OFFICE_DEMOLITION_GAME/README.md)** (`10_OFFICE_DEMOLITION_GAME/`): オフィスの外壁を破って麻布十番へ進出し、街を壊すほど最大5.2倍まで巨大化。ビールビーム、ジョッキメテオ、残存レーダーを駆使して合計491件を更地にする独立型3Dアクション。旧オフィスクラッシュとは別作品。
- **[窓際族０](11_MADOGIWA_ICE_PUZZLE_GAME/README.md)** (`11_MADOGIWA_ICE_PUZZLE_GAME/`): やめたろうの冷却プログラムのバグで氷漬けになったオフィスを、上下左右の固定4方向で一直線に滑る2.5Dパズル。重要資料とビールの回収順を考え、全5ステージから脱出する。Vite + TypeScript + Three.js製。
- **[そば屋のビールダッシュ ～ジョッキtoジョッキで本日開店！～](12_SOBA_BEER_RUN_GAME/README.md)** (`12_SOBA_BEER_RUN_GAME/`): そば屋を左右に動かして3レーンのビールを集め、6杯ごとのフィーバーで提供数を伸ばす45秒ランナー。ゴール後は実写のおかやまんが大型スクリーン越しにランク判定。Vite + TypeScript + Three.js製。
- **[そば屋の会社ブレイカー ～3D物理解体～](13_COMPANY_BREAKER_GAME/README.md)** (`13_COMPANY_BREAKER_GAME/`): 大型ビールジョッキを投げ、約120〜230個の独立剛体で組まれた無人のモックオフィスを10投以内に連鎖崩壊させる3D物理解体アクション。Vite + TypeScript + Three.js + Rapier製。
- **[MADOGIWA GRID](14_MADOGIWA_CARD_GAME/README.md)** (`14_MADOGIWA_CARD_GAME/`): 窓際族8人のカードで3×5盤面を奪い合う、短時間の1対1タクティカルカードゲーム。固有能力、3段階AI、Flame製のカード移動・ホログラム・固有エフェクト、決定的シナリオハーネスを収録。Flutter + Flame製。

## IPの原典
- 世界観: [01_WORLD/WORLD_BIBLE.md](01_WORLD/WORLD_BIBLE.md)
- 正史エピソード年表: [01_WORLD/STORY_TIMELINE.md](01_WORLD/STORY_TIMELINE.md)
- キャラクター設定: [02_CHARACTERS/](02_CHARACTERS/)
- 台本・生成済みプロンプト: [03_SCRIPTS/](03_SCRIPTS/)
- ゲーム用アセット（共用ボクセル）: [04_GAME_ASSETS/voxel/](04_GAME_ASSETS/voxel/)

## For Claude Code
プロジェクトのワークフローやSeedanceプロンプト作成ルールは [CLAUDE.md](CLAUDE.md) を参照。
