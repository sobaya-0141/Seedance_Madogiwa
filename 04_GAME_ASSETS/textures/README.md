# ゲーム用テクスチャ（CC0）

ゲームの床・壁などに使う PBR テクスチャ。すべて **CC0 1.0（パブリックドメイン）**。商用利用・改変・再配布が自由で、クレジット表記も不要（記録のためここに書いておく）。

ゲームからはコピーせず、ゲームのフォルダからこのディレクトリへの相対symlinkで参照する（例: `12_SOBAYA_MUSOU_GODOT/textures -> ../04_GAME_ASSETS/textures`）。

取得日: 2026-11-06（すべて 2K）

## ファイルの形式

各フォルダに3枚ずつある。

| ファイル | 中身 |
|---|---|
| `*_diff_2k.jpg` | 色（ベースカラー） |
| `*_nor_gl_2k.jpg` | 法線マップ（OpenGL 形式。Godot はこちら） |
| `*_arm_2k.jpg` | R=AO（物陰の暗さ）、G=粗さ、B=金属度 |

## 一覧

| フォルダ | 取得元 | 使っている場所 |
|---|---|---|
| `clean_asphalt` | Poly Haven https://polyhaven.com/a/clean_asphalt | そば屋無双: 麻布十番の車道 |
| `rectangular_paving` | Poly Haven https://polyhaven.com/a/rectangular_paving | そば屋無双: 麻布十番の歩道・本社前広場 |
| `concrete_floor_painted` | Poly Haven https://polyhaven.com/a/concrete_floor_painted | そば屋無双: 工場の床 |
| `marble_tiles` | Poly Haven https://polyhaven.com/a/marble_tiles | そば屋無双: 本社ロビーの床 |
| `wood_floor` | Poly Haven https://polyhaven.com/a/wood_floor | そば屋無双: 窓際族エリアの床 |
| `blue_metal_plate` | Poly Haven https://polyhaven.com/a/blue_metal_plate | そば屋無双: 金属の面（棚・機械など） |
| `red_brick` | Poly Haven https://polyhaven.com/a/red_brick | そば屋無双: 商店街の建物 |
| `painted_plaster_wall` | Poly Haven https://polyhaven.com/a/painted_plaster_wall | そば屋無双: 工場の外壁・オフィスの壁・商店街の建物 |
| `carpet006` | ambientCG https://ambientcg.com/view?id=Carpet006 | そば屋無双: 12F オフィスのタイルカーペット |

- Poly Haven のライセンス: https://polyhaven.com/license （全アセット CC0）。取得URLの形: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/<id>/<id>_{diff,nor_gl,arm}_2k.jpg`
- ambientCG のライセンス: https://docs.ambientcg.com/license/ （全アセット CC0 1.0）。取得元: `https://ambientcg.com/get?file=Carpet006_2K-JPG.zip`。
  - zip から `Color`（→ `diff`）と `NormalGL`（→ `nor_gl`）を使った。
  - `arm` は、AmbientOcclusion を R、Roughness を G に入れ、B を 0 にしてまとめ直したもの（Poly Haven と同じ形にするため）。

## 自作（Blender のスクリプトで描いたもの）

`04_GAME_ASSETS/props_blender/azabu_shops.py` の `tile_texture()` が、ランダムな色むら・目地・法線を計算して描いた外壁タイル。外部の素材は使っていないので、権利の扱いはこのリポジトリの他の自作物と同じ。形式は上の3枚組と同じ（2048px）。作り直すときは `--retex` を付けて実行する。

| フォルダ | 中身 |
|---|---|
| `facade_tile_cream/` | クリーム色の小口タイル（10.8×6cm・馬目地）。和菓子屋 |
| `facade_tile_brown/` | 茶色の二丁掛けタイル（22.7×6cm）。喫茶店 |
| `facade_tile_grey/` | 灰色の二丁掛けタイル。居酒屋 |
| `facade_tile_white/` | 白い小口タイル。薬局 |
