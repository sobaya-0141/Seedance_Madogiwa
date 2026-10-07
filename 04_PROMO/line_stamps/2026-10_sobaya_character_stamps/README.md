# 窓際族物語 LINEスタンプ（40個）

添付 `sobaya_stamps.zip` のそば屋スタンプの構図アイデアを参照し、キャラクターシートを正典として高画質に描き直した最大枚数の40個セットです。既存の指定8個を含み、日常会話で使いやすい追加32個を収録しています。

## 収録内容

| 番号 | ファイル | キャラクター | 表示テキスト |
| ---: | --- | --- | --- |
| 01 | `sticker_01_sobaya_kanpai.png` | そば屋 | 乾杯 |
| 02 | `sticker_02_sobaya_nomi_ni_ikou.png` | そば屋 | 飲みに行こう |
| 03 | `sticker_03_fukugyun_gyungyun.png` | 福ギュン | ギュンギュン |
| 04 | `sticker_04_yametaro_today_bug.png` | やめ太郎 | 今日もバグ生み出した |
| 05 | `sticker_05_okayaman.png` | おかやまん | おかやまん！ |
| 06 | `sticker_06_okayaman_miteruzo.png` | おかやまん | 見てるぞ |
| 07 | `sticker_07_yotan_rock.png` | よーたん | Rockですね！ |
| 08 | `sticker_08_tokun_hawaii.png` | とーくん | ハワイ最高〜 |
| 09 | `sticker_09_sobaya_otsukaresama.png` | そば屋 | おつかれさま |
| 10 | `sticker_10_sobaya_arigatou.png` | そば屋 | ありがとう |
| 11 | `sticker_11_sobaya_ryoukai.png` | そば屋 | 了解です！ |
| 12 | `sticker_12_sobaya_makasete.png` | そば屋 | まかせて！ |
| 13 | `sticker_13_sobaya_kaiteki.png` | そば屋 | 快適です！ |
| 14 | `sticker_14_sobaya_meritto.png` | そば屋 | メリットでもあります！ |
| 15 | `sticker_15_fukugyun_arigatou.png` | 福ギュン | ありがとうございます |
| 16 | `sticker_16_fukugyun_saikou.png` | 福ギュン | 最高です！ |
| 17 | `sticker_17_fukugyun_e_mashidesuka.png` | 福ギュン | えっ、マジですか？ |
| 18 | `sticker_18_fukugyun_torimasuyo.png` | 福ギュン | 撮りますよ〜 |
| 19 | `sticker_19_fukugyun_gyungyun.png` | 福ギュン | それ、ギュンギュンです |
| 20 | `sticker_20_yametaro_ohayou.png` | やめ太郎 | おはようございます |
| 21 | `sticker_21_yametaro_ryoukai.png` | やめ太郎 | 了解です |
| 22 | `sticker_22_yametaro_sumimasen.png` | やめ太郎 | すみません！ |
| 23 | `sticker_23_yametaro_nantokashimasu.png` | やめ太郎 | なんとかします |
| 24 | `sticker_24_yametaro_naorimashita.png` | やめ太郎 | 直りました！ |
| 25 | `sticker_25_okayaman_taihen_odoroite.png` | おかやまん | 大変驚いております |
| 26 | `sticker_26_okayaman_ryoukai.png` | おかやまん | 了解しました |
| 27 | `sticker_27_okayaman_yoroshiku.png` | おかやまん | よろしくお願いします |
| 28 | `sticker_28_okayaman_mondai_nashi.png` | おかやまん | 問題ありません |
| 29 | `sticker_29_yotan_otsukaresama.png` | よーたん | おつかれさま！ |
| 30 | `sticker_30_yotan_ii_oto.png` | よーたん | いい音ですね！ |
| 31 | `sticker_31_yotan_ikemasu.png` | よーたん | いけます！ |
| 32 | `sticker_32_yotan_sorewa_rock.png` | よーたん | それはロック！ |
| 33 | `sticker_33_yotan_arigatou.png` | よーたん | ありがとう！ |
| 34 | `sticker_34_yotan_osaki.png` | よーたん | お先に失礼します |
| 35 | `sticker_35_tokun_aloha.png` | とーくん | アロハ〜 |
| 36 | `sticker_36_tokun_mata_asobou.png` | とーくん | また遊びましょう |
| 37 | `sticker_37_tokun_tanoshii.png` | とーくん | 楽しいですね！ |
| 38 | `sticker_38_tokun_saikou.png` | とーくん | 最高です！ |
| 39 | `sticker_39_tokun_ongaku.png` | とーくん | 音楽いきます |
| 40 | `sticker_40_tokun_kanpai.png` | とーくん | 乾杯しよう |

## 仕様

- 370×320px、透過PNG、RGBA、各1MB未満の40枚
- `main.png`: 240×240px、`tab.png`: 96×74px
- 文字は生成画像に直接任せず、固定フォントで後合成して表記を保証
- 画像の外周にはLINE用の余白を確保
- 生成時は各キャラクターの `02_CHARACTERS/*_sheet.png` を参照し、シートのポーズ・ラベル・背景は持ち込まない指定で生成
- 合成用スクリプト: `tools/render_line_stamp.swift`

## LINE申請時の補足

LINE Creators Marketの通常スタンプは8/16/24/32/40個から選べるため、本セットは最大の40個です。申請時は公式の[制作ガイドライン](https://creator.line.me/ja/guideline/sticker/)と最新の審査基準を確認してください。
