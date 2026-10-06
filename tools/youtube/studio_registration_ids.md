# Studio登録の進捗とID（再開用）

2026-10-05 に登録した21件のgenerationId。残っている作業（入力素材のアップロード、
`upsert_prompt` によるプロンプト本文の登録）はこのIDを使って再開できる。

状態の凡例: ✅=完了 / 🔸=途中 / ⬜=未

| ラン | slug（またはバージョン追加先） | generationId | 動画 | 入力素材 | プロンプト本文 |
|---|---|---|---|---|---|
| 45_fukuchan_yametaro_estimates | `fukuchan-yametaro-estimates` | `b5698a78-5fda-45c1-9936-ac5db3124e2e` | ✅ | ✅ 41件 | ⬜ |
| 52-54_sobayahazard_combined | `sobayahazard-underground-continuation` | `9510c870-e346-4e52-be17-6a871a1e79f3` | ✅ | ✅ 34件 |✅ |
| 55_okayaman_watching_movie_cm | `okayaman-watching-movie-cm` | `653730ea-856b-4467-b98b-59a5d78be9a7` | ✅ | ✅ 63件 |✅ |
| 58_sobaya_ai_pull_request | `sobaya-ai-pull-request` | `6b6ce7cd-9df2-4a3d-a528-b6d4847f7291` | ✅ | ✅ 40件 |✅ |
| 72_beer_only_engine_press_conference | `beer-only-engine-press-conference` | `e3e62cce-7dbd-43d0-b40a-a1b937fcd5f7` | ✅ | ✅ 49件 | ⬜ |
| 74_yametaro_ultra_dry_home_shopping | `yametaro-ultra-dry-home-shopping` | `66a2f0df-d697-408d-969c-1c9ed7f4e64d` | ✅ | ✅ 69件 | ⬜ |
| 76_sobaya_desert_mega_beer | `sobaya-desert-mega-beer` | `c0592de7-8df0-4be9-9034-cc229b0bcfbb` | ✅ | ✅ 22件 |✅ |
| 77_sobaya_yametaro_dismissal_notice | `sobaya-yametaro-dismissal-notice` | `a2dcfaf3-6abb-4ac4-ba1b-79c55684db66` | ✅ | ✅ 39件 |✅ |
| 78_fukuchan_rejection_officer | `fukuchan-rejection-officer` | `600e95ef-8b71-4597-9d49-f7e4d490d448` | ✅ | ✅ 29件 |✅ |
| 84_droidkaigi_iosdc_after_talks_night_2026 | `droidkaigi-iosdc-after-talks-night` | `71c81d24-7c45-4f4c-9d05-48c5aa90879f` | ✅ | ✅ 43件 |✅ |
| 85_droidkaigi_iosdc_after_death_game | `droidkaigi-iosdc-after-monitor-game` | `5319a1fa-289d-4dc8-af16-c2d508977a71` | ✅ | ✅ 32件 |✅ |
| 87_yametaro_yumemi_application | `yametaro-yumemi-application` | `538c5dfa-bb60-49d4-9937-fc47d68fe16f` | ✅ | ✅ 43件 |✅ |
| 89_sobaya_panel_otarageshi | `sobaya-panel-otarageshi` | `aa693b81-d969-4153-a4b3-f5fa5680f4da` | ✅ | ✅ 27件 |✅ |
| 96_sobaya_mug_mystery | `sobaya-mug-mystery` | `cc143eb6-1bc2-40b5-bf60-feb88a31b6c2` | ✅ | ✅ 46件 |✅ |
| 97_yametaro_sword_master_final | `yametaro-sword-master-final` | `2e1cc059-2a4b-41c5-904e-4c4eb5ec94e3` | ✅ | ✅ 40件 |✅ |
| 100_sobaya_prison_release_party | `sobaya-prison-release-party` v1 | `8f5b30fc-ed0f-4614-9bba-8511ba3fc931` | ✅ | ✅ 50件 | ⬜ |
| 101_sobaya_prison_release_party_h3_r2v_ab | `sobaya-prison-release-party` v2 | `6167fba6-7b86-4e97-a028-cddf9e81417e` | ✅ | ✅ 34件 | ⬜ |
| 91_sobaya_madogiwa_tanker_fixed_side | `madogiwa-super-try-tanker` v3 | `b66f6494-26c5-4d8f-974c-7e18bbcfb10c` | ✅ | ✅ 35件 | ⬜ |
| 94_sobaya_last_hope_beer_tshirt_cm | `madogiwa-tshirt-beer-complete` v4 | `dea7dec1-255c-42e4-95e9-687e90134864` | ✅ | ✅ 34件 | ⬜ |
| 95_madogiwa_tshirt_destruction_cm | `madogiwa-tshirt-destruction-cm` v3 | `38f5bc4d-253c-4c55-92a7-b508ea3d2e83` | ✅ | ✅ 43件 | ⬜ |
| 99_madogiwa_tshirt_clip9_clip10_audio_fix | `madogiwa-tshirt-destruction-cm` v4 | `3911a138-e061-4287-b114-89c6319d703a` | ✅ | ✅ 5件 | — |

## 既知の不整合（2026-10-06）

85番（`droidkaigi-iosdc-after-monitor-game`）の入力素材に、`upload_pending` のまま残った
**17行のゴミ**がある。アップロードURLの1時間期限が切れた状態で再発行したため、
同じファイル名の行が二重に作られた。実体のある32件は別途 `ready` で登録済みで、
公開ページの表示には影響しない。

入力素材にはMCPの削除・アーカイブ用ツールが無いため、この17行は管理画面から手で消すか、
Studio側に削除APIを足す必要がある。残骸の `assetId` は `get_episode` で
`status: "upload_pending"` を拾えば特定できる。

**再発防止**: チケット発行とPUTは必ず同じ作業内で連続させ、1回の発行数は8件程度に抑える。

### 99番だけ素材構成が違う理由

99番は動画生成を伴わないポストプロダクションのランで、clip9/clip10の音声だけを差し替えて
ffmpegで再結合している。キャラクターシートもキーフレームも章プロンプトも存在しないため、
入力素材は再収録した「わーい」2本、組み上げた音声トラック2本、concatリスト1本の計5件。
プロンプトが無いので `upsert_prompt` の対象外とする。

## 残作業の手順

入力素材は `create_input_upload` でファイル1件ずつチケットを発行し、返るURLへcurlでPUTする
（1回のメッセージで10件ほど並列に発行し、まとめてPUTすると速い）。対象は各ランの
`*_sheet.png` / `height_lineup.png` / `clip*_start.png` / `clip*_end.png` / `*.wav` と、
章ごとの `ch*_prompt.txt` を結合したプロンプト原本。

プロンプト本文は `upsert_prompt` に全文を渡す。登録後に `get_episode` で読み戻し、
ローカルの結合ファイルと差分照合してから次へ進む。

## 動画の公開状態

21本すべてユーザーの指示により `published` へ変更済み（2026-10-05）。公式サイトの
サイトマップとエピソード詳細ページで16件の掲載を確認した。
