# YouTube一括投稿ツール

Madogiwa Studio（`https://madogiwa.work`）に公開済みのエピソードをYouTubeへ投稿する。
説明欄には「この動画の作り方」として、そのエピソードの制作ノート（使用モデル・プロンプト・入力素材）への導線を入れる。

## なぜ公式サイトを正とするか

`03_SCRIPTS/` 配下には中間生成物のmp4が500本以上あり、どれが完成版かはファイル名から機械的に決められない。
一方、公式サイトの各エピソードページにはJSON-LDの`VideoObject`が埋まっていて、

- 正式タイトル
- あらすじ（説明欄にそのまま使える）
- 採用した完成動画のmp4 URL
- ポスター画像（サムネイル用）
- 公開日
- 制作ノートのURL

が揃っている。つまり「公開すると決めた動画」はStudioに確定済みなので、そこから取ってくるのが最短で確実。

## 手順

### 1. カタログを作る（認証不要）

```bash
python3 tools/youtube/fetch_catalog.py
```

`catalog.json` に64件（動画未登録の`no-way-debug-trailer`を除く）が公開日の古い順で入る。
Studio側で動画を差し替えたら作り直す。

### 2. 投稿内容を確認する

```bash
python3 tools/youtube/upload.py --dry-run
```

説明欄の文面は `description_template.txt` を編集すれば変わる（`{description}` `{episode_url}` `{site}` を差し込む）。

### 3. Google Cloud側の準備（初回のみ）

1. Google Cloudコンソールでプロジェクトを作り、**YouTube Data API v3** を有効化する
2. OAuth同意画面を作る（外部／自分をテストユーザーに追加）
3. 認証情報 → OAuthクライアントID → **デスクトップアプリ** を作成し、JSONを `~/.config/madogiwa/client_secret.json` に置く

アプリ審査は不要（自分のチャンネルへ自分で投稿するだけなので）。
ただしOAuth同意画面を「テスト」のままにするとリフレッシュトークンが7日で失効するので、
継続運用するなら「本番」に昇格させる。

### 4. 依存パッケージ

```bash
python3 -m venv .local/youtube-venv
.local/youtube-venv/bin/pip install google-api-python-client google-auth-oauthlib
```

`.local/` はGit管理外。
macOSでpython.org版のPythonを使うとTLS証明書が無くダウンロードに失敗するので、
Homebrewの`python3`（`/opt/homebrew/bin/python3`）かvenvを使う。

### 5. 投稿する

```bash
.local/youtube-venv/bin/python tools/youtube/upload.py
```

投稿済みのslugは `upload_state.json` に記録され、再実行しても二重投稿しない。

## APIの制限（重要）

| 制限 | 内容 | 対処 |
|---|---|---|
| クォータ | 10,000 units/日、`videos.insert`が1本1,600 units | **1日6本まで**。翌日（太平洋時間0時リセット）に同じコマンドを再実行すれば続きから進む |
| 未監査プロジェクト | APIコンプライアンス監査を通していないプロジェクトから投稿した動画は`public`にできない | 既定で`private`投稿。公開はYouTube Studioで手動。64本を一気に公開したくない場合はむしろ好都合 |
| サムネイル | `thumbnails.set`はチャンネルの電話認証が必要 | 失敗しても投稿自体は成功扱い。`--no-thumbnail`で省略可 |

ポスター画像は854x480で、YouTubeの推奨（1280x720）より小さい。
サムネイルにこだわるなら別途作り直して差し替える。

## おまけ: ローカルの完成動画の棚卸し

公式サイトに未登録の完成動画を探すときに使う。mp4はGit管理外なので本体チェックアウトを指定する。

```bash
python3 tools/youtube/build_inventory.py --media-root ~/Documents/private/Seedance_Madogiwa
```

`INVENTORY.md` に、ランごとの完成版候補（長さ・解像度・音声の有無）と、
候補が複数あって人間の判断が要るランが出る。
