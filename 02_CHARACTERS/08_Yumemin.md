# ゆめみん
空を飛ぶマスコットのようなキャラクター。バクのような生き物。
青い丸い体、頭に小さな耳、黒い点目。体の後部（お尻側）は白い。
顔の左側に伸びているのは鼻で、バクのように自由に動かせる。
言葉は話さない（鳴き声・効果音のみ）。
木槌を持ち、居眠りしている社員を「BONK!」と叩いて起こす。
NG変更: 青い体、点目、自由に動く鼻、デザイン全般。

シート照合チェックリスト（画像を生成したら、`Yumemin_sheet.png`をReadで開いた状態で1項目ずつ照合する。1項目でもズレていたら再生成する）：
1. **脚の無い、宙に浮く小さな球体のマスコット**（人間の膝ほどの高さ）。脚・腕が生えていたら不合格。
2. 体は**明るいスカイブルー**で、**お尻側（後部）だけ白**（後ろ姿は白が主）。
3. **黒い点目が2つだけ**。眉・口は無い（口を開けて喋っていたら不合格）。
4. 顔の**左寄りから伸びる短いバクのような鼻**（自由に曲がるので長さ・向きは変わってよいが、必ず存在する）。
5. 頭頂に**小さな三角の耳が2つ**、後部に**小さな青い丸い尻尾**。
6. 木槌を持つ場面では**ナチュラルウッドの木槌**（他の武器・道具への置き換えは不合格）。

画像ファイル：Yumemin.jpg
キャラクターシート：Yumemin_sheet.png（多面図モデルシート: 三面図＋NG要素クローズアップ＋表情/アクション差分＋身長比較＋カラーパレット。Seedance/CapCutの参照画像とキーフレーム生成の第一参照に使う）
プロンプト用同定句（英語）：Yumemin — the small knee-height floating blue tapir-like mascot with black dot eyes, a flexible trunk-like nose and a white rear, never speaking, sometimes holding a small wooden mallet
ボクセルモデル：`04_GAME_ASSETS/voxel/models/yumemin.glb`（木槌アーム＋鼻のLocomotionリグ、脚なし。再生成は`04_GAME_ASSETS/voxel/tools/build_yumemin_voxel_model.py`）
