# ゆめみん turnaround status

Status: **pending user review — imagegen unavailable in the build environment (2026-07-22)**

事前のimagegenターンアラウンドは存在しない。モデルから再生成した
`../../previews/yumemin-2026-07-22/{front,left,back,right}.png` をレビュー対象とし、
PRレビューでの承認をもって approved に更新すること。

## Source-authoritative details（参照画像 `02_CHARACTERS/Yumemin.jpg` より）

- 青い丸い体（段差ブロックで丸みを近似）、頭頂の小さな耳（先端は濃い青）
- 黒い点目（顔アルベド）、顔の左側から伸びるバクの鼻（形状・先端は濃い青）
- 体の後部（お尻側）は白

## Inferred side/back details（承認待ちの推定）

- 白いお尻は背面の白ブロック（上下2段）で表現
- 木槌（エピソード定番プロップ）は小さな青い手＋木の柄＋大きな木のヘッドで
  プライマリアームに恒久固定（BONK用）
- 鼻はVoxelRig_Locomotion_00として移動時に揺れる（「自由に動く鼻」）
- 小さな足2つは接地用の飾りブロック（飛行キャラのため脚リグなし）

## NG locks

青い体・点目・自由に動く鼻・デザイン全般は変更禁止（`02_CHARACTERS/08_Yumemin.md`）。

Texture generation mode: deterministic pixel-art
(`tools/generate_pixelart_textures.py`).
