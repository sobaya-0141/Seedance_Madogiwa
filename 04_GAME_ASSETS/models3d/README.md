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

身長は glTF の単位（m）。Godot 4.7 で読み込み、スケルトンとアニメーションが認識されることを確認済み。

## プロップ・モブ

| 用途 | ファイル | 取得元パス | 内容 |
|---|---|---|---|
| ジョッキ | `props/beer_mug.glb` | `assets/3d/props/beer_mug_v2/beer_mug.glb` | そば屋（高品質版）の右手 `PropSocket.R` に持たせる外付けジョッキ。原点は底中央、持ち手は `Grip` ノード。液体に `TiltX` / `TiltZ` / `Fill` モーフ。ガラスとビールは glTF の透過（transmission）を使うので、未対応のエンジンでは材質を置き換える |
| モブ素体 | `mobs/mannequin_base.glb` | `assets/3d/motion_library/source/human-base-animations.glb` | 顔なしマネキン（身長1.83m・66ボーン）＋87アニメーション（Walk / Jog / Punch_Jab / Hit_Chest / Hit_Knockback など）。警備員などのモブ敵の素体に使う |
| モブ素体（追加動作） | `mobs/mannequin_addon.glb` | `assets/3d/motion_library/source/human-addon-animations.glb` | 同じ骨格の追加75アニメーション（Dizzy / Fighting Idle / Victory など）。素体の AnimationPlayer にライブラリとして足して使う |

モブ素体は [Mesh2Motion](https://github.com/Mesh2Motion/mesh2motion-assets) / [Quaternius](https://quaternius.com/) 由来の **CC0 1.0**（`mobs/CC0-1.0.txt` を同梱）。キャラクターではないので、制服などの見た目は使う側で付ける。

## 使い方

- ゲームからはコピーせず、`models/` や `public/models/` からここへの相対symlinkで参照する（ボクセル版と同じ方針）
- Godot: そのまま `res://` 配下（symlink）に置けば読み込める。アニメーションは `AnimationPlayer` で名前を指定して再生する
- Three.js: `GLTFLoader` で読み込み、`AnimationMixer` で `gltf.animations` を再生する
- モデルを修正したいときは、元リポジトリ側の制作記録と Blender ファイルを参照する（ここのファイルは手で編集しない）。更新版を取り込むときは、取得元コミットとこの README を書き換える
