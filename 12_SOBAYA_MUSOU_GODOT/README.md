# そば屋無双 〜ビール工場強奪作戦〜（Godot 4・体験版）

**体験版**としてゲームサイトで公開中（効果音・BGMなし、難易度は未調整、タッチ操作は未対応）。

ビールが足りないそば屋が、架空の「ゴールデン麦酒 第一工場」に乗り込む3Dアクション。押し寄せる警備員や警察官をビールジョッキでなぎ倒しながら3つのエリアを突破し、製造ラインのできたてビールを奪う。

攻撃はドタバタ表現にしている。殴られた敵は吹っ飛んで頭の上に★を回し、床に沈んで退場する（流血・死亡表現はしない）。

## 遊び方

```bash
godot --path 12_SOBAYA_MUSOU_GODOT
```

| 操作 | キーボード / マウス | ゲームパッド |
|---|---|---|
| 移動 | WASD | 左スティック |
| 通常攻撃（4段コンボ） | J / 左クリック | □（X） |
| チャージ攻撃（周囲を吹っ飛ばす） | K / 右クリック | △（Y） |
| 無双乱舞（ゲージ満タン時） | L | ○（B） |
| 回避 | Space | ×（A） |
| ビールを奪う（出荷口で長押し） | F | R1 |
| カメラ回転 | Q / E | 右スティック |
| スタート / もう一度 | Enter | Start |
| 最初からやり直す | R | Back |

### 流れ

1. **正門ヤード**: 警備員30人。14人倒すと「警備隊長」が出る。全員倒すとシャッターが開く
2. **倉庫**: 警備員と警察官45人。22人倒すと「巡査部長」が出る
3. **製造ライン**: 警察官中心の55人と、出荷口を守る「警部」（地響きの衝撃波を使う）。警部を倒すと出荷口が光り、F 長押しでビールを確保してクリア

### システム

- **コンボ**: パンチ → フック → パンチ → 叩きつけ（衝撃波で打ち上げ）。攻撃中に次の入力を受け付ける。攻撃中はひるまない
- **チャージ攻撃**: 通常攻撃の途中からでも出せる。広い範囲を大きく吹っ飛ばす
- **無双ゲージ＝ジョッキのビールの量**: 攻撃を当てる・攻撃を受けるとたまる。満タンで無双乱舞（約3秒、回転しながら周囲をなぎ倒し、最後に大爆発。無敵）
- **回避**: 前転。転がり始めは無敵
- **回復**: 倒した敵がときどき落とす瓶ビール（体力と無双ゲージが回復）。隊長・巡査部長・警部は大ジョッキを落とす（体力50%＋無双満タン）
- 敵は同時に3人までしか殴りかかってこない（残りは周りを囲んで順番を待つ）。隊長・巡査部長・警部は大技でしかひるまない

## 構成

- `main.gd`: ゲーム進行（エリア・敵の出現・制圧判定・ゴール）、戦闘の当たり判定、ナビメッシュ、カメラ、UI、演出
- `player.gd`: そば屋。モーションは共用モデルに入っているもの（`Hybrid_MugPunch` / `Hybrid_MugHook` / `Hybrid_MugSmash` / `MugAttack` / `Hybrid_MugRun` / `Procedural_RollForward` / `DanceVictory` など）。ジョッキは右手の `PropSocket.R` に外付けし、液量（`Fill` モーフ）で無双ゲージを表す
- `enemy.gd`: 敵。CC0 のマネキン素体に、制服の色（Tポーズの頂点位置から部位を判定して頂点カラーで塗る）・帽子・警棒を付ける。追加動作（`Dizzy` など）は `mannequin_addon.glb` のアニメーションライブラリを足して使う
- `stage.gd`: 工場の建物・障害物・シャッター・コンベア
- `models/`: 共用モデルへの相対symlink（コピーしないこと）
  - `sobaya_hq.glb` → `04_GAME_ASSETS/models3d/sobaya.glb`
  - `beer_mug.glb` → `04_GAME_ASSETS/models3d/props/beer_mug.glb`
  - `mannequin_base.glb` / `mannequin_addon.glb` → `04_GAME_ASSETS/models3d/mobs/`（CC0）
  - `*.glb.import` は `gltf/embedded_image_handling=3`（テクスチャをこのフォルダへ書き出さない）

敵の強さ・出現数は `main.gd` 冒頭の `ENEMY_TYPES` / `ZONES`、そば屋の技の威力・範囲・速さは `player.gd` 冒頭の `COMBO` / `CHARGE` にまとめてある。

障害物は `stage.gd` の `obstacles`（矩形）が当たり判定の正本で、敵の経路探索用のナビメッシュも同じ矩形から起動時に作っている。障害物を足すときは見た目と一緒に `obstacles` にも追加する。

## Web版（ゲームサイトで公開）

`export_presets.cfg` の「Web」プリセットでブラウザ向けに書き出す。GitHub Pages はスレッド用のヘッダー（COOP/COEP）を付けられないので、スレッドなし版（`variant/thread_support=false`）にしている。ブラウザでは Compatibility（WebGL2）描画になり、SSAO などは効かない。

```bash
godot --headless --path . --export-release "Web" build/web/index.html
python3 -m http.server 5195 --directory build/web   # http://localhost:5195 で確認
```

- 書き出しには Godot 4.7.2 の Web 用テンプレートが必要（エディタの「エクスポートテンプレートの管理」、または公式リリースの `Godot_v4.7.2-stable_export_templates.tpz` から `web_nothreads_release.zip` を `~/Library/Application Support/Godot/export_templates/4.7.2.stable/` へ）
- ゲームサイトへは `GAMES_PORTAL/games.json` の `"engine": "godot"` の項目で載せている。main へ push すると、GitHub Actions が Godot とテンプレートを公式リリースから取得（SHA512-SUMS で照合・キャッシュ）して書き出す
- `web_assets/` はサイト用の追加ファイル（カード画像 `og.png`）。`.gdignore` で Godot の取り込み対象から外している
- 日本語はブラウザで端末のフォントが使えないので、同梱フォント `fonts/MPLUSRounded1c-ExtraBold.ttf`（`04_GAME_ASSETS/fonts/` への相対symlink、OFL）を使う
- タッチ操作は未対応（キーボード・ゲームパッドのみ）

## 動作確認用の自動プレイ

そば屋を自動操作して通しで遊ばせ、指定フレームで画面を保存して終了する。体力が減ると自動で回復するので、必ず最後まで進む。

```bash
godot --path . -- --auto --shot=/tmp/end.png --frames=12000                 # 通しプレイ（120フレームごとに状況をログ出力）
godot --path . -- --auto --shot=/tmp/run.png --frames=11000 --snap=900,4500   # 途中も撮る（/tmp/run_900.png ...）
godot --path . -- --auto --musou-at=700 --shot=/tmp/m.png --frames=900 --snap=760   # 無双乱舞を撮る
```

マネキンの読み込み時に出る `UVs are required to generate tangents.` は、UVを持たないジョッキ部品についての警告で、表示には影響しない。
