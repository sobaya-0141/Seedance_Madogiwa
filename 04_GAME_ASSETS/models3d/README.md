# 共用3Dキャラクターモデル（非ボクセル・スケルタルリグ付き）

共同開発者のリポジトリ [K9i-0/madogiwa-multimedia-universe](https://github.com/K9i-0/madogiwa-multimedia-universe) で「採用GLB」に指定されているモデルを取り込んだもの。ボクセル版（`04_GAME_ASSETS/voxel/`）とは別系統で、Tripoで生成しBlenderで仕上げた、なめらかな形状のモデル。スケルトンとアニメーションが入っている。

- 取得元コミット: `5d110d73c0c641947d0a322524d4a1aa69a03cb6`（2026-11-04 取得。Git blob ハッシュが元のファイルと一致することを確認済み）
- 取得元の説明: [assets/3d/CHARACTER_MODELS.md](https://github.com/K9i-0/madogiwa-multimedia-universe/blob/5d110d73c0c641947d0a322524d4a1aa69a03cb6/assets/3d/CHARACTER_MODELS.md)

## モデル一覧

| キャラ | ファイル | 取得元パス | 身長 | ボーン | アニメーション | 元リポジトリでの評価 |
|---|---|---|---|---|---|---|
| そば屋 | `sobaya.glb` | `assets/3d/hazard_adopted/v3_20260917/sobaya.glb` | 1.8 | 24 | 104本（Idle / Walk / Run / Greeting / `Hybrid_MugHold`・`MugPunch`・`MugSmash` などジョッキ系 / Dance / Sitting など） | 改善の余地あり |
| 福ギュン | `fukuchan.glb` | `assets/3d/hazard_adopted/v2_20260913/fukuchan.glb` | 1.7 | 54 | 99本（Idle / Walk / Run / Greeting / Dance / Sitting など） | 課題が多い |
| たこさん | `takosan.glb` | `assets/3d/characters/takosan/rig_radial_v4_hands/takosan.glb` | 1.43 | 27 | 3本（Idle / Talk / Wave） | かなり高い |
| やめ太郎 | `yametaro.glb` | `assets/3d/characters/yametaro/rig_nose_v3/yametaro.glb` | 1.3 | 23 | 4本（Idle / Talk / Walk / Wave） | かなり高い |
| おかやまん | `okayaman.glb` | `assets/3d/characters/okayaman/monitor_v1/okayaman_monitor.glb` | 2.09 | なし | なし（静止モデル） | 元リポジトリのゲームで採用（2026-11-03） |
| ゆめみん | `yumemin.glb` | `assets/3d/characters/yumemin/eye_seams_20260919/yumemin_clean_v2.glb` | — | なし | なし（動きは使う側で付ける） | 現行g2。同じ版の軽量LODが `game_lod_20261106/yumemin_game.glb` にある |

### スマホ・Web向けの軽量版（mobile/）

| キャラ | ファイル | 取得元パス | 内容 |
|---|---|---|---|
| そば屋 | `mobile/sobaya.glb` | `assets/3d/hazard_adopted/mobile_20260919/sobaya.glb` | 上のそば屋を三角形50%減・衣服テクスチャ半分にした軽量版（約11.4 MiB）。骨・ソケット・アニメーションは同じ。取得元コミット `2234ee9ae2f968dd02185c88294367b4b63249f1`（Git blob ハッシュ一致を確認済み）。Webゲーム（`05_OFFICE_CRASH_GAME`）が参照 |

身長は glTF の単位（m）。Godot 4.7 で読み込み、スケルトンとアニメーションが認識されることを確認済み。

- おかやまん・ゆめみんは取得元コミット `2234ee9ae2f968dd02185c88294367b4b63249f1`（2026-11-06 取得。Git blob ハッシュが元のファイルと一致することを確認済み）。
- おかやまんは自立式の大型モニター（画面越しのリモート出演＝NG変更要素）で、画面に正典写真 `02_CHARACTERS/Okayaman.jpg` を内蔵している。**この写真はCMYKのJPEGなので、Godotでは読み込めず画面が黒くなる**。Godotで使うときは写真をsRGBに変換して `Okayaman canonical photograph` ノードの材質を差し替える（`tools/render_sprites/render_sprites.gd` の `_fix_okayaman_photo` を参照）。

## 2D用の立ち絵（sprites/）

`sprites/<キャラ>/{front,back,left,right}.png` は上のモデルをGodotでレンダリングした透過PNG。2Dゲームの立ち絵・アイコンに使う（`16_MADOGIWA_DUNGEON_KORGE` が参照）。`left` / `right` は「画面の左 / 右を向いている絵」。余白は切り詰めてある。

- そば屋は `Hybrid_MugHold` の最初のフレームで、右手にジョッキ（`props/beer_mug.glb`）を持たせて描く。他の骨付きモデルは `Idle` の最初のフレーム
- モデルを更新したら作り直す（Godotのウィンドウが一瞬開く。`--headless` では描画されない）:

```bash
cd 04_GAME_ASSETS/models3d
godot --path tools/render_sprites --script render_sprites.gd
```

### アニメーションのスプライトシート（sprites/sheets/）

`sprites/sheets/<名前>.png` と `<名前>.txt` は、アニメーションを横向き（右向き）に描いた2D用のスプライトシート（`17_SOBAYA_MUSOU_2D_KORGE` が参照）。1行が1アニメーション、1マスが1コマ（288×288）。`.txt` にマスの大きさ・足元の位置・各行のアニメーション名とコマ数・クリップの長さ・ループするかを書いてある。左向きは左右反転して使う。

- `sobaya`: そば屋（右手にジョッキ）。idle / run / punch / hook / smash / charge / dodge / hurt / down / win
- `guard` / `police` / `captain` / `sergeant` / `boss`: マネキン素体（`mobs/`）に、12_SOBAYA_MUSOU_GODOT と同じ規則で制服の色（頂点カラー）・帽子・警棒を付けたもの。idle / walk / attack / hit / fly / dizzy（boss は special＝地響き も）
- 作り直す（Godotのウィンドウが一瞬開く）:

```bash
cd 04_GAME_ASSETS/models3d
godot --path tools/render_sprites --script render_sheets.gd
```

とーくん・よーたんには採用3Dモデルが無いので、立ち絵はボクセル版の4方向レンダー（`../voxel/model_source/previews/`）を使う。

## プロップ・モブ

| 用途 | ファイル | 取得元パス | 内容 |
|---|---|---|---|
| ジョッキ | `props/beer_mug.glb` | `assets/3d/props/beer_mug_v2/beer_mug.glb` | そば屋（高品質版）の右手 `PropSocket.R` に持たせる外付けジョッキ。原点は底中央、持ち手は `Grip` ノード。液体に `TiltX` / `TiltZ` / `Fill` モーフ。ガラスとビールは glTF の透過（transmission）を使うので、未対応のエンジンでは材質を置き換える |
| モブ素体 | `mobs/mannequin_base.glb` | `assets/3d/motion_library/source/human-base-animations.glb` | 顔なしマネキン（身長1.83m・66ボーン）＋87アニメーション（Walk / Jog / Punch_Jab / Hit_Chest / Hit_Knockback など）。警備員などのモブ敵の素体に使う |
| モブ素体（追加動作） | `mobs/mannequin_addon.glb` | `assets/3d/motion_library/source/human-addon-animations.glb` | 同じ骨格の追加75アニメーション（Dizzy / Fighting Idle / Victory など）。素体の AnimationPlayer にライブラリとして足して使う |

モブ素体は [Mesh2Motion](https://github.com/Mesh2Motion/mesh2motion-assets) / [Quaternius](https://quaternius.com/) 由来の **CC0 1.0**（`mobs/CC0-1.0.txt` を同梱）。キャラクターではないので、制服などの見た目は使う側で付ける。

## 敵キャラ（Tripo・有料プラン）

`tripo/` に、そば屋無双の作り直し用に Tripo Studio（有料プラン）で作った敵7体（工場の警備員・警察官・警部・白バイ隊員・機動隊長・本社警備員・警備本部長）を置いている。Mixamo 形式のリグ付き（65ボーン）・約1万三角形・テクスチャ2K・アニメーションなし。作り方と一覧は [tripo/README.md](tripo/README.md)、元の絵は `04_GAME_ASSETS/tripo_inputs/`。

## 使い方

- ゲームからはコピーせず、`models/` や `public/models/` からここへの相対symlinkで参照する（ボクセル版と同じ方針）
- Godot: そのまま `res://` 配下（symlink）に置けば読み込める。アニメーションは `AnimationPlayer` で名前を指定して再生する
- Three.js: `GLTFLoader` で読み込み、`AnimationMixer` で `gltf.animations` を再生する
- モデルを修正したいときは、元リポジトリ側の制作記録と Blender ファイルを参照する（ここのファイルは手で編集しない）。更新版を取り込むときは、取得元コミットとこの README を書き換える
