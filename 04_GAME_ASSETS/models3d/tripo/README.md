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

- アニメーションは入っていない（ボーンは `mixamorig:Hips` などの Mixamo 名）。動きは Mixamo 形式のアニメーションか、ゲーム側でリターゲットして付ける
- ゲームからはコピーせず、相対symlinkで参照する
