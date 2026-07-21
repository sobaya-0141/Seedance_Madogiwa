# 福ちゃん turnaround status

Status: **pending user review — imagegen unavailable in the build environment (2026-07-22)**

事前のimagegenターンアラウンドは存在しない。モデルから再生成した
`../../previews/fukuchan-2026-07-22/{front,left,back,right}.png` をレビュー対象とし、
PRレビューでの承認をもって approved に更新すること。

## Source-authoritative details（参照画像 `02_CHARACTERS/Fukuchan.jpg` より）

- 黒髪センターパートのミディアムヘア、にこにこの笑顔
- 紺のロングコート＋白いモノクログラフィックTシャツ＋黒パンツ＋白スニーカー
- 首から青いSPONSORストラップと「福ちゃん」名札
  （テクスチャ内の文字は禁止のため、名札は白地＋赤枠＋赤バーの形状のみで表現）

## Inferred side/back details（承認待ちの推定）

- 後頭部は黒髪マス＋段差の毛先で連続カバー
- コートは腰まわりのスカートブロックで丈を表現、背面はプレーン紺
- ピンクの頬（ギュンギュン準備）を顔アルベドに常設

## NG locks

おしゃれ服・ギュンギュンポーズは削除・変更禁止（`02_CHARACTERS/05_Fukuchan.md`）。
ギュンギュンポーズ自体はゲーム側アクション（両拳を頬へ）として実装すること。

Texture generation mode: deterministic pixel-art
(`tools/generate_pixelart_textures.py`).
