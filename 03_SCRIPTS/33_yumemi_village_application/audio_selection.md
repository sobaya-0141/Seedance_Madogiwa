# 採用テイクの記録（ゆめみ村 応募方法）

全セリフをIrodori-TTS（`Aratako/Irodori-TTS-v4-Large`）で等速・1.5倍速の2テイク生成し、ユーザーへ提示した（2026-09-30）。

**現状の採用は暫定で、全て等速（1.0x）テイク**。ユーザーが別テイクを選んだ場合は、退避してある候補から差し替えて
`assemble.sh`の尺表・`script.md`の`Frames:`とDialogue audio表を更新し、`build_h3_workflow.py`と
`build_h3_run_package.py`を再実行すること。

| ファイル | Ch | キャラ | 採用テイク | 実測長 | 備考 |
|---|---|---|---|---|---|
| `ch1_line1_student.wav` | 1 | 学生 | 等速 seed 100 | 2.91s | |
| `ch2_line1_yametaro.wav` | 2 | やめ太郎 | **尺固定 1.2秒** seed 7 | 2.0s（1.20sをパディング） | 等速テイクは「了解やで」6モーラに対し3.44秒と不自然に長く、無音も検出されなかった（モデルが尺を埋めた）。`--seconds 1.2`で作り直した。1.6秒版も候補として提示済み |
| `ch2_line2_yametaro.wav` | 2 | やめ太郎 | 等速 seed 7 | 3.44s | |
| `ch3_line1_yametaro.wav` | 3 | やめ太郎 | 等速 seed 7 | 5.24s | 読み仮名テキスト「エーアイティーいっかい」で合成 |
| `ch4_line1_yametaro.wav` | 4 | やめ太郎 | 等速 seed 7 | 7.72s | 鉤括弧を外したテキストで合成 |
| `ch6_line1_student.wav` | 6 | 学生 | 等速 seed 100 | 2.12s | |
| `ch7_line1_clerk.wav` | 7 | 店員 | 等速 seed 202 | 2.60s | 学生と同じ`Narrator_voice.wav`をシードで作り分け |
| `ch8_line1_student.wav` | 8 | 学生 | 等速 seed 100 | 2.00s | |
| `ch9_line1_clerk.wav` | 9 | 店員 | 等速 seed 202 | 2.0s（1.56sをパディング） | |
| `ch12_line1_sobaya.wav` | 12 | そば屋 | 等速 seed 42＋monsterize | 2.0s（1.46sをパディング） | |
| `ch13_line1_student.wav` | 13 | 学生 | 等速 seed 100 | 2.04s | |
| `ch14_line1_sobaya.wav` | 14 | そば屋 | 等速 seed 42＋monsterize | 2.0s（1.24sをパディング） | |

2.0秒未満のwavは**末尾のみ**に無音を足して2.0秒にした（H3は1ファイル2.0秒以上が条件。先頭に足すと口パク開始がずれる）。

VOICEVOX話者は使っていないため、動画内クレジットは不要。
