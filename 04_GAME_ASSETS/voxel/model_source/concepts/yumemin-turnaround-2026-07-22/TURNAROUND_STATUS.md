# ゆめみん turnaround status

Status: **v3 approved for game integration by user (2026-07-27)**

ゲーム表示の最新モデリング authority は
`02_CHARACTERS/Yumemin_3D_turnaround_v3.png`。ユーザーの「ゆめみんのモデルを最新のv3にしたい」
という明示指定をv3採用の承認記録とする。実装と多方向QAは
`04_GAME_ASSETS/threejs/yumemin-img2threejs/` に保存されている。

従来のボクセルGLBとBlender生成元は、ボクセル用途の正典・フォールバックとして保持する。
オフィスクラッシュではv3手続き型Three.jsモデルを優先して読み込む。

## Source-authoritative details（参照画像 `02_CHARACTERS/Yumemin.jpg` より）

- 青い丸い体（段差ブロックで丸みを近似）、頭頂の小さな耳（先端は濃い青）
- 黒い点目（顔アルベド）、顔の左側から伸びるバクの鼻（形状・先端は濃い青）
- 体の後部（お尻側）は白

## Approved v3 side/back details

- 正球の青い胴体と、輪郭線を形状化しない滑らかなシルエット
- 顔の中心線から前へ伸び、下へ曲がるバク状の鼻
- 後半球に沿う白い布のお包みと、中央の青い尻尾
- 小さな耳、瞳孔のない黒い点目、脚なしの飛行シルエット
- 木槌は攻撃時のみ表示する任意プロップ

## Legacy voxel details

- 白いお尻は背面の白ブロック（上下2段）で表現
- 木槌（エピソード定番プロップ）は小さな青い手＋木の柄＋大きな木のヘッドで
  プライマリアームに恒久固定（BONK用）
- 鼻はVoxelRig_Locomotion_00として移動時に揺れる（「自由に動く鼻」）
- 小さな足2つは接地用の飾りブロック（飛行キャラのため脚リグなし）

## NG locks

青い体・点目・自由に動く鼻・デザイン全般は変更禁止（`02_CHARACTERS/08_Yumemin.md`）。

Legacy texture generation mode: deterministic pixel-art
(`tools/generate_pixelart_textures.py`)。v3は物理形状とマテリアルのみで構成し、
顔テクスチャや黒い輪郭メッシュを使用しない。
