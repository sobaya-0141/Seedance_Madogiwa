# Madogiwa Studio 登録プラン（サイト未登録の完成動画）

ローカルの完成動画と公開済みエピソードを**フレームの知覚ハッシュ**で突き合わせた結果、
25ランが未登録だった（一致は距離0、未登録は最近傍でも距離49以上で、中間は無い）。
完成版の選定はユーザー確定済み。パスはすべて本体チェックアウトの `03_SCRIPTS/` 起点。

登録手順は `.claude/skills/madogiwa-studio/SKILL.md` に従う。
`create_episode` がv1を自動で作るので、直後に `get_episode` でv1の`generationId`を取り、
最初の生成に対して `create_generation` を呼ばない。

## A. 新規エピソードとして登録（17件）

| # | ラン | 採用ファイル | 長さ | 提案slug | 提案タイトル |
|---|---|---|---|---|---|
| 1 | `45_fukuchan_yametaro_estimates` | `final.mp4` | 57.7s | `fukuchan-yametaro-estimates` | 福ちゃんとやめ太郎：膨らむ見積もり |
| 2 | `52-54_sobayahazard_combined` | `52-54_sobayahazard_combined.mp4` | 45.3s | `sobayahazard-underground-continuation` | そば屋ハザード — 地下からの脱出 |
| 3 | `55_okayaman_watching_movie_cm` | `final.mp4` | 39.4s | `okayaman-watching-movie-cm` | 映画「見てるぞ！」CM |
| 4 | `58_sobaya_ai_pull_request` | `final_draft.mp4` | 39.0s | `sobaya-ai-pull-request` | そば屋、AIにプルリクを任せる |
| 5 | `72_beer_only_engine_press_conference_mechanism_geometry_repair` | `final_draft.mp4` | 59.8s | `beer-only-engine-press-conference` | ビール専用エンジン発表会 |
| 6 | `74_yametaro_ultra_dry_home_shopping` | `final.mp4` | 91.3s | `yametaro-ultra-dry-home-shopping` | やめ太郎のウルトラドライ通販 |
| 7 | `76_sobaya_desert_mega_beer` | `final_remotion_title.mp4` | 24.2s | `sobaya-desert-mega-beer` | 砂漠のそば屋 — メガ生百拳 |
| 8 | `77_sobaya_yametaro_dismissal_notice` | `final.mp4` | 34.7s | `sobaya-yametaro-dismissal-notice` | そば屋 vs やめ太郎 — 解雇通知 |
| 9 | `78_fukuchan_rejection_officer` | `final.mp4` | 49.0s | `fukuchan-rejection-officer` | 福ちゃん、お祈り担当になる |
| 10 | `84_droidkaigi_iosdc_after_talks_night_2026` | `final_draft.mp4` | 52.8s | `droidkaigi-iosdc-after-talks-night` | DroidKaigi & iOSDC アフタートークナイト |
| 11 | `85_droidkaigi_iosdc_after_death_game` | `final_draft.mp4` | 34.5s | `droidkaigi-iosdc-after-monitor-game` | アフターイベント — モニターゲーム |
| 12 | `86_op_theme_anime_opening` | `86_op_theme_anime_opening_final_titled.mp4` | 65.8s | `madogiwa-anime-opening` | 窓際族物語 — アニメOP |
| 13 | `87_yametaro_yumemi_application` | `final_draft.mp4` | 52.8s | `yametaro-yumemi-application` | やめ太郎と、ゆめみ村の応募方法 |
| 14 | `89_sobaya_panel_otarageshi` | `final_smooth.mp4` | 29.2s | `sobaya-panel-otarageshi` | 窓際パネルのお焚き上げ |
| 15 | `96_sobaya_mug_mystery` | `final_draft.mp4` | 44.8s | `sobaya-mug-mystery` | 探偵よーたん：消えたジョッキ |
| 16 | `97_yametaro_sword_master_final` | `final.mp4` | 46.8s | `yametaro-sword-master-final` | 剣聖やめ太郎 — 最終話 |
| 17 | `100_sobaya_prison_release_party` | `final.mp4` | 70.5s | `sobaya-prison-release-party` | そば屋の出所祝い |

### あらすじ案（`description`）

1. **膨らむ見積もり** — 明るいオフィスで、福ちゃんとやめ太郎がエンジニアの見積もりについて掛け合う。話すたびに工数が膨らんでいく約58秒の漫才コメディ。
2. **地下からの脱出** — 福ちゃんが居酒屋の扉を開けて地下の長い階段を降り、無人の大食堂で犬の体にそば屋の仮面を持つ怪物に襲われる。階段を駆け上がって外へ出ると、夜の街はビールを持たないそば屋の群れで埋まっていた約45秒の続編CM。
3. **映画「見てるぞ！」CM** — 終業後のオフィス。仕事をせずビールを飲むそば屋の前で、電源の落ちたディスプレイが勝手に点きリモートのおかやまんが映る。そば屋は画面に引き込まれ、やがてジョッキを持ったまま黒い画面から這い出てくる約39秒のホラー調CM。
4. **AIにプルリクを任せる** — 在宅勤務のそば屋がビール片手にAIへ実装を丸投げし、プルリクエストまで作らせる。本文に残った一文を福ちゃんとやめ太郎に見つかり、二人は「平常運転や〜」と締める約39秒のコメディ。
5. **ビール専用エンジン発表会** — 白衣の福ちゃんが透明な単気筒エンジンを公開する。シリンダーの中ではそば屋がピストンとクランクシャフトに挟まれて立ち、チューブで届くビールだけで動力を生む約60秒の発表会コメディ。
6. **ウルトラドライ通販** — リビングのテレビから始まる通販番組。やめ太郎が架空のビール「ウルトラドライ」を紹介し、畑で収穫される缶までを売り込む約91秒のCM。
7. **メガ生百拳** — 真昼の砂漠。白い布をかぶったそば屋がジョッキを狙う野盗の群れに囲まれ、仮面を見せて技を名乗り、ジョッキによる高速の体術で蹴散らす約24秒のアクションコメディ。
8. **解雇通知** — 岩場の闘技場でそば屋とやめ太郎が対峙する。そば屋が口から解雇通知を撃ち出し、煙の中からファンタジー戦士姿のやめ太郎が現れてジョッキを斬る約35秒のアクションコメディ。
9. **お祈り担当になる** — お祈り担当に任命されて喜ぶ福ちゃんが応募書類を郵送すると、課長が過剰な手順で封筒を処分していく約49秒のオフィスコメディ。
10. **アフタートークナイト** — カンファレンスのステージで、福ちゃんとやめ太郎がリモート登壇の窓際王おかやまんにモバイル採用について尋ね、最後によーたんが訂正を入れる約53秒のコメディ。
11. **モニターゲーム** — DroidKaigiとiOSDCのアフターイベント会場。大きなモニター越しにおかやまんが現れ、最後は無人の空間に並ぶ大量のモニターが同じそば屋を映す約35秒のコメディ。
12. **アニメOP** — 窓際族の8人が走り、踊り、ビールを飲み、楽器を鳴らし、無害なバグを生みながら最後に笑顔で揃う約66秒のオープニング映像。主題歌入り。
13. **ゆめみ村の応募方法** — イベント会場でやめ太郎が、学生に「ゆめみ村」への不条理な応募手順を伝える。指示どおりに動いた学生が通された面接室には、仮面のそば屋が座っていた約53秒のコメディ。
14. **窓際パネルのお焚き上げ** — 神社に立てられた窓際族のパネルが少しずつ切り分けられ、火にくべられる。立ちのぼる煙がそば屋の顔を結び、やがてほどけて散っていく約29秒の無言の短編。
15. **消えたジョッキ** — 赤坂オフィスの窓際立ち飲みスペースで起きたジョッキの紛失事件。疑い、言い訳、転がるジョッキ、英雄的な勘違いを経て、たこさんが体を張って落とす約45秒のコメディ。
16. **剣聖やめ太郎 最終話** — 漫画2ページを映像化したアクションコメディ。やめ太郎がとーくんの挑発を受け、よーたんのランキング宣告を経て最後の一太刀に至る約47秒。
17. **出所祝い** — 刑務所を出たそば屋を福ちゃんが迎え、出所祝いの席へ連れていく。クラフトビールのサプライズはスーパードライしか飲まないそば屋に空振りし、煙のギャグを挟んで最後は5人の警官がパトカーへ連れ戻す約70秒のコメディ。

## B. 既存エピソードへ生成バージョンを追加（5件）

同じ話の別バージョンなので、新規エピソードではなく `create_generation` でv2以降として足す。
**この紐づけはユーザー未確認。登録前に確認すること。**

| ラン | 採用ファイル | 紐づけ先エピソード | 備考 |
|---|---|---|---|
| `95_madogiwa_tshirt_destruction_cm` | `final.mp4`（53.5s） | `madogiwa-tshirt-destruction-cm` | 登録済みは`98_targeted_fixes`。これは修正前の版 |
| `99_madogiwa_tshirt_clip9_clip10_audio_fix` | `final_madogiwa_tshirt_destruction_audio_fixed.mp4`（38.9s） | `madogiwa-tshirt-destruction-cm` | clip9/10の音声修正版 |
| `101_sobaya_prison_release_party_h3_r2v_ab` | `final.mp4`（81.1s） | A-17と同じ話 | 全チャプターH3 R2V・キーフレーム無しのA/B版 |
| `91_sobaya_madogiwa_tanker_fixed_side` | `final_draft.mp4`（39.5s） | `madogiwa-super-try-tanker` | 破口位置を固定し直した版 |
| `94_sobaya_last_hope_beer_tshirt_cm` | `final_draft.mp4`（50.7s） | `madogiwa-tshirt-beer-complete` | 登録済みは`93_revised` |

## C. 登録しない（3件）

`52_sobayahazard_underground_staircase_h3` / `53_sobayahazard_dog_sobaya_attack_h3` /
`54_sobayahazard_return_street_horde_h3` は、A-2の結合版に含まれる素材。
ユーザーが結合版を完成品と確定したため、単体では登録しない。

## 使用モデル

A・Bのすべてのランに `H3_COLAB.md` があり、MiniMax H3（Colab）での生成を経ている。
`script.md` の Production intent には「Seedance 2.5 in CapCut」と書かれたままのランが多いので、
`update_generation` のモデル名は各ランの `H3_COLAB.md` と `bench_log.csv` を見て確定する。

## 登録時の素材

- プロンプト: 各ランの `ch*_prompt.txt`（無い場合は `script.md` の Motion prompt 節）を `upsert_prompt` へ
- 入力画像: 各ランの `*_sheet.png` とキーフレーム `clip*_start.png` / `clip*_end.png`
- 参照音声: 各ランの `*.wav`
- サムネイル: `ffmpeg -ss 0.5 -i <video> -frames:v 1 -vf scale=1280:1280:force_original_aspect_ratio=decrease -q:v 3 poster.jpg`
