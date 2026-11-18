# Tripo で作った敵キャラの3Dモデル（有料プラン）

そば屋無双の作り直し用に、Tripo Studio（有料 Professional プラン・2026-11-10）で作った敵7体。目標映像は `03_SCRIPTS/49_sobaya_musou_gameplay_target/`、元の絵はそのランのモブシートから切り出した `04_GAME_ASSETS/tripo_inputs/<名前>/front.png`・`back.png`。

- 有料プランで生成したので商用利用できる（Free で作った試作は `tripo_free/` 側で、使わない）
- 作り方: マルチビュー（正面＋背面）→ HD モデル H3.1 → リトポロジー（三角形・1万ポリゴン、スマートメッシュ P1.0）→ 自動リギング（人型・Mixamo）→ GLB 書き出し（テクスチャ 2K・スケルトン込み）
- 1体あたり 110 クレジット（生成55＋リトポ35＋リグ20）。7体で 770
- 各モデルの Tripo の ID は `04_GAME_ASSETS/tripo_inputs/tripo_tasks.md`

| ファイル | 敵 | 三角形 | ボーン |
|---|---|---|---|
| `factory_guard.glb` | 工場の警備員 | 9,303 | Mixamo 65本 |
| `police.glb` | 警察官 | 9,444 | 同上 |
| `inspector.glb` | 警部（ステージ1のボス） | 9,804 | 同上 |
| `motor_police.glb` | 白バイ隊員 | 9,609 | 同上 |
| `riot_chief.glb` | 機動隊長（ステージ2のボス・盾付き） | 9,932 | 同上 |
| `hq_guard.glb` | 本社警備員 | 9,628 | 同上 |
| `security_head.glb` | 警備本部長（ステージ3のボス） | 9,503 | 同上 |
| `iisan.glb` | いーさん（窓際メンバー。2026-11-17） | 9,872 | 同上 |
| `iisan_dogeza.glb` | いーさんに土下座のアニメーション `Dogeza`（立つ→正座→土下座・0.5秒）を付けたもの。`iisan.glb` から `04_GAME_ASSETS/props_blender/pose_iisan_dogeza.py -- --export-anim` で作る（手で編集しない）。そば屋無双の隠しボス用 | 9,872 | 同上 |

- アニメーションは入っていない（ボーンは `mixamorig:Hips` などの Mixamo 名）。動きは Mixamo 形式のアニメーションか、ゲーム側でリターゲットして付ける
- ゲームからはコピーせず、相対symlinkで参照する

## ビール工場の大道具（`factory/`・2026-11-10）

そば屋無双のステージ1用。元の絵は `03_SCRIPTS/49_sobaya_musou_gameplay_target/props/factory/<名前>.png`、Tripo の ID は `04_GAME_ASSETS/tripo_inputs/tripo_tasks.md`。

- 作り方: 画像1枚 → HD モデル H3.1 → リトポロジー（三角形・1万。`rack`・`building_shutter` は2万）→ GLB 書き出し（テクスチャ 2K）
- モデルは1m 四方に収まる大きさで書き出されるので、ゲーム側で大きさを決める（`stage_base.gd` の `_prop()` / `_prop_sized()`）。正面は +Z
- `crates_red`・`crates_yellow`（ビールケースのパレット）は Tripo のアセットに残っていなかったため未収録。代わりに Blender で作った `04_GAME_ASSETS/models3d/blender/factory/crates_*.gltf` を使う

| ファイル | 中身 | 三角形 |
|---|---|---|
| `factory/truck.glb` | 配送トラック | 9,390 |
| `factory/wall_section.glb` | 工場の外壁（1区画・窓と配管） | 9,444 |
| `factory/building_shutter.glb` | シャッター付きの建屋 | 21,194 |
| `factory/silos.glb` | サイロ3本 | 9,938 |
| `factory/planter.glb` | 植え込み | 9,107 |
| `factory/bollard.glb` | 黄黒の車止め | 9,660 |
| `factory/rack.glb` | ビールケース満載のラック | 24,325 |
| `factory/kegs.glb` | 銀色のビール樽の山 | 9,327 |
| `factory/forklift.glb` | フォークリフト | 10,079 |
| `factory/brew_tank.glb` | 仕込みタンク（黄色い足場付き） | 9,061 |
| `factory/conveyor.glb` | 瓶の流れるコンベア（1区間） | 9,973 |
| `factory/golden_barrels.glb` | 金色の樽（出荷口） | 10,342 |

## 麻布十番ステージの車（`azabu/`・2026-11-12）

画像1枚 → HD モデル H3.1 → リトポロジー（三角形・1万）→ GLB 書き出し（テクスチャ 2K）。1台 90 クレジット。正面は +Z、1m 四方に収まる大きさで書き出されるので、ゲーム側で全長を指定する。

| ファイル | 中身 | 三角形 |
|---|---|---|
| `azabu/taxi.glb` | タクシー（黄色・オレンジの線・屋根の行灯） | 9,881 |
| `azabu/police_car.glb` | パトカー（白黒・赤い警光灯・プッシュバンパー） | 9,540 |
