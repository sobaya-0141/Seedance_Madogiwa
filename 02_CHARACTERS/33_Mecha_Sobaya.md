# メカそば屋

人類がそば屋への対抗兵器として開発した、そば屋そっくりの人型ロボット（初出: `03_SCRIPTS/58_sobaya_vs_mecha_sobaya`「そば屋 VS メカそば屋」）。
そば屋の行動データを全部学習させた結果、そば屋と同じようにビールを飲み、飲み終えるとタンクを戻して同じ角度で一礼する。
話し方: カタカナ発音の平坦なロボット口調（例: 「メカソバヤ、キドウ」「ゴチソウサマデス」）。声は仮面の奥のスピーカーから出て、口のスリットは動かない。
大きさ: 作品により変わる（58では約80mの巨大ロボット）。体格はそば屋と同じ厚みのある巨漢で、そば屋より少し背が高い。
目の光: 通常は青。戦闘・暴走時は赤。
NG変更: そば屋と同じ仮面デザインのフェイスプレート、目穴の奥の光、銀色の金属フィンの髪、Tシャツ・ジーンズ・スニーカー形の装甲、右前腕の注ぎ口。

シート照合チェックリスト（画像・動画を生成したら、`Mecha_Sobaya_sheet.png`をReadで開いた状態で1項目ずつ照合する。1項目でもズレていたら作り直す）：
1. 顔は硬質で光沢のある白いフェイスプレート。**大きな黒い円形の目穴が2つ**で、奥に小さな丸い光（通常は青）が灯る。人間の目・まぶたは無い。
2. 口は**横長の黒いスリット1本**だけ（開かない・形が変わらない）。鼻は小さな出っ張り程度で、唇は無い。
3. 赤い縦のマーキングは**左右対称に計4本**。片目につき目の上に1本（上へ細く尖る）・目の下に1本（下へ細く尖る）で、**目穴で上下に分かれる**。額の中央に**小さな黒い丸いセンサー**が1つ。
4. 髪は**短い銀色（クローム）の金属の刃状フィン**の集まりで、前・横・**後ろ**から見える（後頭部が白いドームになっていたら不合格。そば屋と見分けるため黒にしない）。
5. 首・腕・手・関節は**グレーの金属**で、パネルの継ぎ目とリベットが見える。手は5本指。
6. 胴は**白い半袖Tシャツ形の装甲**、脚は**チャコールのジーンズ形**（膝にプレート）、足は**白いスニーカー形のブーツ**。
7. **右前腕の外側にクロームのビールの注ぎ口**（黒い短いレバー付き）。
8. 背中に**クロームのラック**と、その下に**丸いジェットノズル2基**。
9. 体型はそば屋と同じ厚みのある巨漢（細身のロボットは不合格）。

キャラクターシート：Mecha_Sobaya_sheet.png（実写のスタジオ写真風・正面／斜め／背面／顔アップの4面・文字なし。2026-11-19ユーザー作成・承認。v2＝髪のフィンを銀色にした版が正典）
プロンプト用同定句（英語）：Mecha Sobaya — a hulking gray-metal humanoid robot copy of Sobaya, with a glossy white face plate in Sobaya's mask design (two round black eye holes with a small glowing light deep inside, one mouth slit, four red vertical markings split by the eye holes, a black forehead sensor dot), short spiky silver chrome metal fins for hair, a white T-shirt-shaped chest armor, charcoal jeans-shaped leg armor, white sneaker-shaped boots, a chrome beer tap on the right forearm and a chrome rack with two jet nozzles on the back
声ファイル：Mecha_Sobaya_voice.wav（Irodori-TTSの声質指定＋ロボット加工。作り方は`VOICE_CAST.md`）
