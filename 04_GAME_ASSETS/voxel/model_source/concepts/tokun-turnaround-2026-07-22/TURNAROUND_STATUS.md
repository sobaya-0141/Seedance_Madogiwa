# とーくん turnaround status

Status: **pending user review — imagegen unavailable in the build environment (2026-07-22)**

imagegenスキルが使えない環境でビルドしたため、事前のimagegenターンアラウンドシートは
存在しない。代わりにモデルから再生成した4方向レンダー
`../../previews/tokun-2026-07-22/{front,left,back,right}.png` をレビュー対象とする。
PRレビューでの承認をもって approved に更新すること。

## Source-authoritative details（参照画像 `02_CHARACTERS/Tokun.jpg` より）

- ミント地のアロハシャツ（白い波・オレンジの花・緑の葉柄）、開襟
- 麦わら帽子（広いつば＋黒バンド）、帽子の下に黒髪
- サングラス（角レンズ）、開いた大きな笑顔、少しふくよかな体型
- ピンクのレイ、ウクレレ（ナチュラルウッド＋ダークネック）、紺パンツ、裸足

## Inferred side/back details（承認待ちの推定）

- 後頭部は帽子の下まで黒髪の段差ブロックで連続カバー（露出なし）
- アロハの柄は背面アルベドにも連続、背面に襟ライン
- レイは首を一周するブロックリング（前後ピンク・左右ライト）
- ウクレレはプライマリアーム（右腕）に恒久固定でスマッシュ時に振り下ろす

## NG locks

アロハ・帽子・ウクレレは形状ごと削除・変更禁止（`02_CHARACTERS/03_Tokun.md`）。

Texture generation mode: deterministic pixel-art
(`tools/generate_pixelart_textures.py`) — imagegen再生成時は
`references/modeling-workflow.md` のプロンプトパターンを使用すること。
