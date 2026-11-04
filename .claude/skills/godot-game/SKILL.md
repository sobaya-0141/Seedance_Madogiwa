---
name: godot-game
description: 窓際族物語のキャラクターを使った3D/2DゲームをGodot 4で作るワークフロー。Godotが入っていない端末では公式配布物を検証してから環境構築する。ユーザーから「Godotでゲームを作って」「3Dゲームを作って」「Steam向けのゲームを作って」と頼まれたとき、既存のGodotゲーム（12_SOBAYA_MUSOU_GODOTなど）の修正・機能追加・動作確認・プレイ動画の撮影を頼まれたとき、共用3Dモデル（04_GAME_ASSETS/models3d・voxel）をGodotで動かすときに必ず使用する。Web版の公開は godot-web-publish スキルを使う。
---

# Godot ゲーム制作ワークフロー

窓際族物語のキャラクター（共用3Dモデル）を使って、Godot 4 でゲームを作る。シーンは**コードで組み立てる**方式（`main.tscn` はルートだけ）にして、エージェントがテキストで書いて直せるようにする。

完成例（実装の参考にする）:

- `12_SOBAYA_MUSOU_GODOT/` … 無双系3Dアクション。プレイヤー（高品質版そば屋）・敵（CC0マネキンに制服）・ステージ・ナビメッシュ・自動プレイ・Web版
- `.claude/skills/godot-game/templates/main.gd` … ひな形。高品質版そば屋にジョッキを持たせる最小の例

## 0. 前提（必ず守る）

- 世界観 `01_WORLD/WORLD_BIBLE.md` の禁止事項（ブラック企業描写・いじめ・パワハラ・鬱展開）。戦闘はドタバタ表現にし、流血・死亡表現は使わない（倒れた敵は吹っ飛んで目を回し、床に沈んで退場、など）
- 各キャラの**NG変更**（`02_CHARACTERS/*.md`）はゲームでも変えない。特にそば屋の**仮面とジョッキ**。高品質版そば屋の本体にはジョッキが無いので、必ず外付けする（後述）
- 表示名は「福ギュン」（内部の識別子は `fukuchan` のまま）
- 共用モデル・フォントは**コピーせず、ゲームのフォルダから相対symlinkで参照**する
- コミット・push・PR はユーザーに頼まれたときだけ

## 1. 環境構築（Godot が無い端末）

まず状況を確認する（何も変更しない）:

```bash
bash .claude/skills/godot-game/scripts/godot_setup.sh check
```

エディタが無ければ、**取得元・サイズをユーザーに伝えて了承を得てから**入れる:

```bash
bash .claude/skills/godot-game/scripts/godot_setup.sh editor --yes
```

- brew があり、取得元が公式（`https://github.com/Homebrew/brew`）なら、brew の公式 cask `godot` で入れる
- brew が無い場合、**brew 自体は入れない**（偽サイトが出回っているため）。スクリプトは Godot 公式の GitHub Releases（検証済み組織 `godotengine`）から macOS 版 zip（約170MB）を取得し、公式 `SHA512-SUMS.txt` で照合して `~/Applications/Godot.app` に入れる
- どちらの場合も、Apple の公証（Notarized Developer ID）と Godot 開発元の署名（TeamIdentifier `6K46PWY5DM`）を確認する。NG なら使わずにユーザーへ報告する
- 公式サイト godotengine.org のダウンロードボタンは `downloads.godotengine.org` の中継を通り、Godot 財団のファイル置き場へ転送される。GitHub Releases と同じファイル（同じサイズ・同じハッシュ）

Web 用の書き出しテンプレートは godot-web-publish スキルの手順で入れる。

## 2. ひな形を作る

```bash
python3 .claude/skills/godot-game/scripts/new_godot_game.py 13_FOO_GODOT "ゲームのタイトル" \
    --models sobaya_hq beer_mug mannequin_base mannequin_addon
```

- フォルダ名はリポジトリの連番 `NN_名前_GODOT`（既存の最大番号＋1）
- 作られるもの: `project.godot` / `main.tscn` / `main.gd`（環境・床・カメラ・日本語フォント・入力・撮影オプション入り）/ `export_presets.cfg`（Web）/ `models/`・`fonts/` の相対symlink / `web_assets/`・`build/`（`.gdignore` 入り）/ README
- `--models` に使える名前: `sobaya_hq` `fukuchan_hq` `takosan_hq` `yametaro_hq` `beer_mug` `mannequin_base` `mannequin_addon` `voxel_<キャラ>`（例 `voxel_sobaya`）
- 最後に `godot --headless --import` を走らせ、`*.glb.import` を `gltf/embedded_image_handling=3` に直す。**既定（=1）のままだとテクスチャ画像がゲームのフォルダへ書き出され、共用モデルの中身がコピーされてしまう**。後からモデルを足したときも同じ設定にして、書き出された画像を消す
- 動作確認: `godot --path 13_FOO_GODOT -- --shot=<scratchpad>/a.png --frames=60` で撮って Read で見る

## 3. 使える素材

| 素材 | 場所 | 中身・使い方 |
|---|---|---|
| 高品質版キャラ | `04_GAME_ASSETS/models3d/{sobaya,fukuchan,takosan,yametaro}.glb` | スケルトン＋収録アニメ。そば屋104本（`Hybrid_MugHold` 構え / `Hybrid_MugRun` / `Hybrid_MugPunch`・`Hook`・`Smash`・`MugAttack` 攻撃（打点はクリップの約48%）/ `Procedural_RollForward` / `Library_Hit_Chest` / `Library_Kneeling_Tired` / `DanceVictory` / `Procedural_Breathing` / `Library_Zombie_Walk` など）、福ギュン99本、たこさん・やめ太郎は Idle/Talk/(Walk)/Wave。どれも**その場で動く（ルートモーション無し）**ので移動はコードで行う。収録アニメは `loop_mode` が0なので、ループさせるものは `Animation.LOOP_LINEAR` にする |
| ジョッキ | `04_GAME_ASSETS/models3d/props/beer_mug.glb` | そば屋の右手 `PropSocket.R` に `BoneAttachment3D` で付け、`mug.transform = grip.transform.affine_inverse()`（`Grip` ノードを手に合わせる）。手の形は本体の `MugGrip` ブレンドシェイプを1に。液量は `BeerVolume`/`LiquidSurface`/`Foam` の `Fill` モーフ（1で液面が0.13m下がる）。Godot は glTF の透過（transmission）に対応しないので、ガラスは半透明・ビールは琥珀色の材質に置き換える（`templates/main.gd` の `_spawn_sobaya()`） |
| ボクセル版キャラ | `04_GAME_ASSETS/voxel/models/*.glb` | `VoxelRig_ArmPrimary` などのノードを直接回すリグ（スケルトン無し）。仕様は `04_GAME_ASSETS/voxel/VOXEL_CHARACTER_KIT.md`。ドット絵テクスチャは `TEXTURE_FILTER_NEAREST_WITH_MIPMAPS` に |
| モブ素体 | `04_GAME_ASSETS/models3d/mobs/mannequin_{base,addon}.glb` | CC0 の顔なしマネキン（1.83m・66ボーン）。base に Walk/Jog/Punch_Jab/Hit_Chest/Hit_Knockback/Death_D など、addon に Dizzy/Fighting Idle/Victory/Attack_Ground_Pound など。addon は `anim.add_animation_library("addon", lib)` で足して `"addon/Dizzy"` で再生。**制服は Tポーズの頂点位置から部位を判定して頂点カラーで塗る**（`12_SOBAYA_MUSOU_GODOT/main.gd` の `uniform_mesh()`）。帽子などは `BoneAttachment3D` に付け、骨の休止姿勢の逆行列で打ち消すとまっすぐ載る（`enemy.gd` の `_attach()`） |
| 日本語フォント | `04_GAME_ASSETS/fonts/MPLUSRounded1c-ExtraBold.ttf` | OFL。UI・Label3D すべてに使う（Web版では端末フォントが使えない）。★□△○× も入っている |

新しいモデルを取り込むとき（共同開発リポジトリ K9i-0/madogiwa-multimedia-universe など）は、取得元コミットを固定してダウンロードし、Git blob ハッシュの一致を確かめて `04_GAME_ASSETS/models3d/README.md` に記録する。ボクセル版を作る・直すときは `build-voxel-character-from-image` スキル。

## 4. 実装の約束事

- **進行の計算は1フレームの時間に上限を付ける**: `var delta := minf(raw_delta, 1.0 / 20.0)`。上限が無いと、Web版でタブを切り替えたときなどに吹っ飛び・踏み込みの計算が破綻する
- **当たり判定は床の上の矩形（`Rect2`）の一覧を正本にする**。敵の経路は、同じ矩形から起動時にナビメッシュを焼いて `NavigationServer3D.map_get_path()` で引く（`12_SOBAYA_MUSOU_GODOT/main.gd` の `_build_navigation()`・`steer()`）。手で面を作るときは**上から見て時計回りが表**（逆だとポリゴン0枚になる）。`agent_radius` などは `cell_size` の倍数にする。「角を経由する」程度の簡易経路では、棚やトラックの裏で敵が詰まる
- **カメラの遮蔽**: 高い障害物（矩形＋高さ）がプレイヤーとの間に入ったら、カメラを手前に寄せる（`stage.gd` の `blocks_view()`）
- **腕を目標へ伸ばす（飲む・掴むなど）**は `TwoBoneIK3D`（`setting_count=1`、`set_root_bone_name(0, "RightArm")` / `RightForeArm` / `RightHand`、`set_target_node`・`set_pole_node`）を Skeleton3D の子に置き、`influence` を0〜1で動かす。手の目標位置は撮影しながら数パターン試して決める
- **GDScript の型推論**: `var x := 何か` の右辺が Variant（型の無い変数や Dictionary の値、`Node3D` 型の変数の独自プロパティ）だとパースエラーになる。`var x: float = ...` と型を書く。`for r: Rect2 in ...` のようにループ変数にも型を付ける
- **ヒットストップ**は `Engine.time_scale` を下げ、`get_tree().create_timer(秒, true, false, true)`（time_scale を無視）で戻す
- **敵の殴りかかり**は同時に数人までの「順番（トークン）」制にすると、囲まれても理不尽にならない
- ゲームパッドは `InputMap` にキー・ボタン・スティックを並べて登録する（`templates/main.gd` の `_setup_input()`）。Steam を見据えるなら最初から対応しておく

## 5. 動作確認

ゲームを変更したら、必ず自分で動かして確かめる（ユーザーに確認を頼まない）。

1. **撮影**: `godot --path <dir> -- --shot=<scratchpad>/x.png --frames=300 --snap=60,120` で画面を保存し、Read で見る。見た目の確認では、毎回キャラの NG 要素（ジョッキ・仮面）が正しく出ているかも見る
2. **自動プレイ**: アクションゲームでは `--auto` でプレイヤーを自動操作する「ボット」を入れ（`12_SOBAYA_MUSOU_GODOT/main.gd` の `_bot()`）、最初からクリアまで**複数回**通す。乱数で結果が変わるので、1回通っただけで直ったと判断しない。120フレームごとに状況をログ出力し、詰まったら残っている敵の状態・位置を出して原因を特定する
3. **Web版と同じ描画**: `godot --path <dir> --rendering-method gl_compatibility --rendering-driver opengl3 -- --shot=...` で、Compatibility 描画でも表示が崩れないか確認する
4. 撮影はスクラッチパッドに保存する（`/tmp` やリポジトリには置かない）

## 6. プレイ動画を撮る

Godot のムービー撮影モードは1フレームずつ書き出すので、コマ落ちのない動画になる。自動プレイと組み合わせる:

```bash
godot --path <dir> --write-movie <scratchpad>/movie/out.avi --fixed-fps 60 -- --auto --quit-after-end=6
ffmpeg -i <scratchpad>/movie/out.avi -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -an out.mp4
```

- `--quit-after-end=秒` は勝敗が決まってから終了するまでの秒数（ゲーム側に実装しておく）
- 1600×900・60fps・90秒で AVI 約500MB → mp4 約55MB
- 撮れたら数か所のフレームを書き出して Read で確認し、`SendUserFile` で送る

## 7. 仕上げ

- ゲームの README（遊び方・操作表・構成・調整値の場所・撮影コマンド）を書き、ルート `README.md` のゲーム一覧に追記する
- `.claude/launch.json` に Web 確認用サーバーを足す場合は godot-web-publish スキルを参照
- 報告では、自動プレイで確認できた範囲と、人が遊んで確かめていないこと（難易度・手触り・音）を分けて伝える
