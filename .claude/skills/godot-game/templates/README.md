# {{TITLE}}（Godot 4）

（ゲームの説明をここに書く）

## 遊び方

```bash
godot --path {{DIR}}
```

| 操作 | キーボード | ゲームパッド |
|---|---|---|
| 移動 | WASD | 左スティック |

## 構成

- `main.gd`: シーン・UI・入力をコードで組み立てる（`main.tscn` はルートだけ）
- `models/`: 共用モデルへの相対symlink（コピーしないこと）。`*.glb.import` は `gltf/embedded_image_handling=3`
- `fonts/`: 同梱日本語フォント（`04_GAME_ASSETS/fonts/`、OFL）への相対symlink
- `export_presets.cfg`: Web 書き出し（スレッドなし）
- `web_assets/`: ゲームサイト用の追加ファイル（カード画像 `og.png` など）。`.gdignore` で取り込み対象外

## 動作確認用の撮影

```bash
godot --path . -- --shot=/tmp/out.png --frames=120 --snap=30,60
```
