# たこさん
黒いフード付きローブ、白い顔、黒い丸目、タコの触手、人間の腕2本。
宇宙人のような謎の存在。無表情。
NG変更: ローブ、触手。

シート照合チェックリスト（画像を生成したら、`Takosan_sheet.png`をReadで開いた状態で1項目ずつ照合する。1項目でもズレていたら再生成する）：
1. 身長は約100cm。人間キャラ（180cm）の**腰ほどの高さ**。
2. 常に**黒いフード付きローブ**を着てフードを被っている（渦巻きのエンボス柄）。素顔・フードなしは不合格。
3. 顔は**平たいオフホワイトの卵型**で、**黒い丸い点目が2つだけ**。口・鼻・眉・表情は無い。
4. 脚は無く、ローブの裾から**吸盤付きの黒いタコの触手が6本**出ている（脚・靴が生えていたら不合格。触手の消失も不合格）。
5. 短い**白い腕と丸い手が2本**（触手とは別に必ず存在する）。
6. 目が渦巻きになるのは混乱時の一時表現のみ。通常は黒い点目。

画像ファイル：Takosan.png
キャラクターシート：Takosan_sheet.png（多面図モデルシート: 三面図＋NG要素クローズアップ＋表情/アクション差分＋身長比較＋カラーパレット。Seedance/CapCutの参照画像とキーフレーム生成の第一参照に使う）
プロンプト用同定句（英語）：Takosan — the small expressionless alien-like creature in a black hooded robe, with a flat white face, two black dot eyes, two human arms and six octopus tentacles instead of legs
ボクセルモデル：`04_GAME_ASSETS/voxel/models/takosan.glb`（両腕＋触手6本リグ。再生成は`04_GAME_ASSETS/voxel/tools/build_takosan_voxel_model.py`）
