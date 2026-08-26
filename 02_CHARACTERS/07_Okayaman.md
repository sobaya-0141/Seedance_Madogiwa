# 窓際王おかやまん
窓際族の頂点に立つ「窓際王」。
黒髪ミディアムヘアの男性。口ひげとあごひげ。黒いフード付きジャケット。常に穏やかな笑顔。
窓際会議室の大型スクリーンにリモート出演する（実体の所在は不明）。
話し方の癖: 会話を始める時に必ず「おかやまん」と言ってから話し始める。
口癖: 『大変驚いております』（どんな事態でも丁寧語＋笑顔のまま驚く）。
会社の謎の「レギュレーション」を司る。
NG変更: 穏やかな笑顔、スクリーン越しのリモート出演スタイル。

シート照合チェックリスト（画像を生成したら、`Okayaman_sheet.png`をReadで開いた状態で1項目ずつ照合する。1項目でもズレていたら再生成する）：
1. 実写写真ベースの日本人男性。**黒のマッシュ〜ミディアムヘア**（前髪が眉にかかる）。
2. **口ひげとあごひげ**が繋がった形で生えている（無精ひげ・つるつるは不合格）。
3. 表情は常に**穏やかな微笑み**（怒り・驚愕の顔は不合格）。
4. **黒いフード付きジャケット**（ジップ、フード内側はグレーのボア）。
5. **必ず大型ディスプレイの画面越しに映る**（黒いベゼル＋スタンドのモニタ）。実体が室内に立って登場していたら不合格。

画像ファイル：Okayaman.jpg
キャラクターシート：Okayaman_sheet.png（多面図モデルシート: 三面図＋NG要素クローズアップ＋表情/アクション差分＋身長比較＋カラーパレット。Seedance/CapCutの参照画像とキーフレーム生成の第一参照に使う）
プロンプト用同定句（英語）：Okayaman — the calm, gently smiling man with black medium-length hair, a thin mustache and goatee, in a black hooded jacket, usually appearing on a large remote screen
声ファイル：Okayaman_voice.wav（Irodori-TTSのボイスクローン用参照音声。配役は`VOICE_CAST.md`が正）
ボクセルモデル：`04_GAME_ASSETS/voxel/models/okayaman.glb`（スタンド＋大型スクリーンのリモート出演スタイル。スクリーンがVoxelRig_ArmPrimary。再生成は`04_GAME_ASSETS/voxel/tools/build_okayaman_voxel_model.py`）
