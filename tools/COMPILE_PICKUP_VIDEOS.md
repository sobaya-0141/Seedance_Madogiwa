# ピックアップ動画のローカル結合

Python 3・curl・FFmpegを使い、公式サイトの最新のピックアップ一覧を取得してMP4を作る。
macOSでPython・FFmpegがない場合は `brew install python ffmpeg`（Homebrew導入済みの場合）。
`python3 --version`、`curl --version`、`ffmpeg -version`、`ffprobe -version` で確認できる。
公開APIを読むだけなので、Studioの管理者ログイン・MCP設定・APIキーは不要。
リポジトリのルートで実行する。

```bash
# 対象と順番だけ確認（動画はダウンロードしない）
python3 tools/compile_pickup_videos.py --dry-run --seed 42

# 全ピックアップをシャッフルし、単純結合版とタイトル挿入版を同時生成
python3 tools/compile_pickup_videos.py

# 最新10作品を選んでシャッフル。同じ対象・seedなら同じ順番
python3 tools/compile_pickup_videos.py --limit 10 --seed 42

# タイトル表示を3秒に変更
python3 tools/compile_pickup_videos.py --title-seconds 3

# 単純結合版だけ生成
python3 tools/compile_pickup_videos.py --versions plain

# 新着順で結合し、出力先を指定
python3 tools/compile_pickup_videos.py --order newest --output .local/pickup-newest.mp4
```

## 対象の定義

- 公開API `/api/episodes?featured=true` を毎回取得する。認証は不要。
- **公式サイトのピックアップ対象作品について、サイトのカードで再生される代表動画（primary_video_id）を1本ずつ使用する。** 同一作品の全バージョンを集める機能ではない。
- 代表動画と動画単位のイチオシ指定は別。作品内で別バージョンを代表に指定している場合も、サイトと同じ代表動画を使う。
- 最新N作品は `featured_video_created_at`（イチオシ動画の登録日時）の降順で選び、その後シャッフルする。イチオシボタンを押した日時や作品の並べ替え順ではない。
- 同じ動画IDは重複させず、各動画を冒頭から末尾まで収録する。サイトのキャッシュが更新されるまで直前の変更が反映されない場合がある。

## 出力

- 既定: `.local/pickup-compilations/pickup_<日時>_plain.mp4` と `pickup_<日時>_titles.mp4`
- 両版は同じ素材・同じ順番。変換素材は共用する。タイトル版は最初の動画を含む各動画の直前に、その作品名を黒背景・白文字で2秒表示する。末尾にはタイトル画面を付けない。タイトル画面は無音。
- `--versions both`（既定）/ `plain` / `titles` で出力版を選ぶ。
- `--output name.mp4` は `name_plain.mp4` と `name_titles.mp4` の基準名。
- 隣のJSONに対象ID・順番・seed・設定・各版の時間割・処理結果を保存。
- 元動画キャッシュ: `.local/pickup-compilations/cache/`。次回は再利用する。削除すると再取得する。
- `.local/` はGit管理外。既存の出力MP4/JSONは上書きしない。
- 横1920×1080、30fps、H.264/AAC。`--portrait` で1080×1920、`--size 640x360` 等で変更可能。
- 縦横比を維持し黒い余白を付ける。元音声を保持し、無音素材には無音トラックを補う。音量の自動均一化、動画への字幕、BGM、フェードは加えない。
- 全素材を再エンコードするため画質の再圧縮が発生する。元動画・変換途中の動画・完成動画分の空き容量が必要。
- 完成前に全編デコードで破損を確認する。失敗時はJSONに記録し、出力先の `.<出力名>-work/` を調査用に残す。再実行は新しい出力名を使用する。

一覧確認に表示されたseedを指定すると、対象が変わらない限り順番を再現できる。
サイト側で対象が変わると同じseedでも結果は変わるため、完成JSONがその回の記録となる。

## 日本語タイトル

FFmpegのdrawtextを使用。macOS標準のヒラギノ角ゴシック W6で描画する。
別環境では `--font /path/to/JapaneseFont.ttf` を指定する。日本語グリフを含むフォントが必要。
長いタイトルは自動改行し、高さに応じて文字サイズを調整する。
生成AIやRemotionの追加依存は不要。FFmpegにはdrawtextフィルターが必要。

## 検証

```bash
python3 -m unittest discover -s tools -p test_compile_pickup_videos.py
```

選別・重複除外・順番の再現と、横長／縦長／無音の合成素材を使った2種類の出力を検証する。
結合テストはFFmpegとmacOS標準の日本語フォントがない環境ではスキップする。
