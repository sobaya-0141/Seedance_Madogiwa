# 窓際王おかやまん turnaround status

Status: **pending user review — imagegen unavailable in the build environment (2026-07-22)**

事前のimagegenターンアラウンドは存在しない。モデルから再生成した
`../../previews/okayaman-2026-07-22/{front,left,back,right}.png` をレビュー対象とし、
PRレビューでの承認をもって approved に更新すること。

## Source-authoritative details（参照画像 `02_CHARACTERS/Okayaman.jpg` より）

- 黒髪ミディアムヘア、口ひげとあごひげ、常に穏やかな笑顔（閉じ目のアーチ）
- 黒いフード付きジャケット
- **実体は作らない**: NG変更「スクリーン越しのリモート出演スタイル」を守り、
  スタンド＋大型スクリーンのモニターそのものをキャラクターとして構築
- 画面左上に赤いLIVEドット＋白バー（文字は描かない）

## Inferred details（承認待ちの推定）

- スクリーン背面はプレーンな黒背面パネル（ロゴなし）
- スマッシュ動作はスクリーン全体（VoxelRig_ArmPrimary）の前傾おじぎとして表現
- 画面は弱い発光（emission 0.55）で「点いている」状態を表現

## NG locks

穏やかな笑顔・リモート出演スタイルは削除・変更禁止（`02_CHARACTERS/07_Okayaman.md`）。

Texture generation mode: deterministic pixel-art
(`tools/generate_pixelart_textures.py`).
