---
name: madogiwa-studio
description: Madogiwa StudioのRemote Web MCPを使い、窓際族物語のギャラリー、記事、エピソード、生成バージョン、使用モデル、登場メンバー、Seedanceプロンプト、入力画像・参照音声・資料、YouTube動画IDと公開状態を登録・確認する。ユーザーがMadogiwa Studioへの登録、公式サイトコンテンツ編集、動画アップロード、プロンプト同期、入力素材管理、Studio ID確認、MCP接続や同僚環境への導入を頼んだときに使用する。
---

# Madogiwa Studio

Madogiwa Studioを制作物の共有台帳として扱い、Remote MCPで制作記録とYouTube動画IDを管理する。動画本体は公式YouTubeへ直接アップロードし、Cloudflareには新規登録しない。画像・参照音声・資料はこれまで通り一回限りURLへPUTする。

## URLの使い分け

- 公式サイト・公開確認・完了報告のURL: `https://madogiwa.work`。エピソードは `/episodes/<slug>`、ギャラリーは `/gallery/<slug>`。
- 管理画面: `https://madogiwa-studio.madogiwa-studio.workers.dev/admin`。Remote MCPの接続先も同じworkers.devホストの `/mcp` を使う。既存のCloudflare Access認証を維持しているため、公開ドメインへの変更だけを理由にMCP設定を置き換えない。
- 一回限りのアップロードURLはツールが返した値をそのまま使い、ホストを書き換えない。

## 準備

1. `references/mcp-tools.md`を最後まで読む。
2. `madogiwa-studio` MCPのツールが利用可能か確認する。見つからなければ同リファレンスの接続設定を案内し、接続後にセッション再起動が必要か伝える。
3. OAuthは各利用者が自分のメールアドレスで行う。認証情報やアップロードURLを共有・表示・保存しない。
4. リポジトリの`AGENTS.md`または`CLAUDE.md`を読み、Git管理対象と採用素材の方針を守る。

## 登録依頼の承認範囲

**Studioへの動画登録依頼は、対象の採用動画を公式YouTubeで公開し、公式サイト掲載まで進める依頼として扱う。** 追加の公開確認は不要。ユーザーが非公開・限定公開・予約公開・制作記録のみ等を指定した場合は、その指定を優先する。

ユーザーの「Studioへ登録して」「Madogiwa Studioへアップロードして」「プロンプトと素材を同期して」という依頼は、登録完了に必要な採用済みファイルを設定済みのMadogiwa Studioへ外部送信することまで含む明示承認として扱う。この依頼を受けた後は、動画や素材ごとに追加確認を求めず、同じ作業内で次を送信する。

- 採用済みの最新完成動画（公式YouTubeへ直接送信。既存IDがあれば再投稿しない）
- 現行の生成プロンプト
- 実際の生成へ使用した入力画像と参照音声
- 完成編集へ使用した採用済み資料、設定、編集マニフェスト

承認は対象エピソードの現行採用物だけに限定する。候補、没素材、未採用テスト、中間生成物、無関係なファイル、認証情報、APIキー、秘密情報は送信しない。ユーザーが「動画だけ」など対象を狭めた場合はその指定を優先する。

ファイル送信に実行環境の承認が必要な場合は、承認理由へ「ユーザーのStudio登録依頼が、登録必須の採用素材送信を明示的に含む」ことと、送信先が設定済みのMadogiwa Studioであること、送信する正確なファイル一覧を記載する。承認レビューで止まった場合も別経路で回避せず、この既存承認と限定された対象を示して同じ正規アップロードを再開する。環境がなお個別の明示承認を要求した場合だけ、送信対象を列挙してユーザーへ一度まとめて確認する。

## 読み取りと対象決定

書き込み前に`list_episodes`と必要に応じて`list_members`を呼び、slugや既存エピソードとの重複を避ける。既存エピソードは`get_episode`で生成バージョン、プロンプト、入力、動画を確認してから変更する。

- エピソード番号を識別子に使わない。Studio内ではランダムな`studio_id`が正本になる。
- slugは内容を表す安定した英小文字・数字・ハイフンで作る。
- 同じエピソードの再生成は新しいエピソードではなく`create_generation`でv2、v3へ追加する。
- `create_episode`はv1を自動作成する。直後に`get_episode`でv1の`generationId`を取得し、最初の生成を登録するためだけに`create_generation`を呼ばない。
- 登場メンバーは`list_members`が返したIDだけを使う。

## 登録ワークフロー（2026-10-09 YouTube移行）

エピソードは通常 `published` とするが、登録したYouTube動画が **公式チャンネル・公開・処理完了・埋め込み可** の全条件を満たすまで公式サイトに掲載されない。取り下げはエピソードを `archived` にする。Studioの制作記録と公式サイトの掲載を区別する。

1. `list_episodes` / `get_episode` と `list_youtube_videos` で既存登録を確認する。動画ID・ローカルの `youtube_upload.json` がある場合は再アップロードしない。
2. 新規なら `create_episode`（v1は自動作成）、新しい制作版なら `create_generation`。`update_generation` の `notes` に台本・出典・クレジット・編集内容を記録できる。
   制作ノートを公開する場合は、この時点で `https://madogiwa.work/episodes/<slug>` を確定する。YouTube動画IDが未取得でもURLを組み立てられる。
3. 実際に使用した生成プロンプトがある場合だけ `upsert_prompt`。ずんだもん解説、Remotion/Three.js編集などに架空のプロンプトを作らない。採用した画像・音声・資料は `create_input_upload` → PUT → `get_episode` でreadyを確認する。
4. 最新の完成動画をYouTubeへ直接アップロードする。制作リポジトリの解像度方針に従った完成原本を使い、Studio向けの再圧縮MP4やCloudflare動画サムネイルを新規作成しない。公式チャンネルは `UCyQtPu94OaiGxFdd2A6bXdw`。
   YouTube概要欄には作品紹介・必要なクレジット・公式サイトURLを記載し、制作ノートを公開する作品には上で確定したURLも入れる。ノートなしの動画は公式サイトURLだけにする。
5. アップロードがIDを返したら、YouTubeの処理完了を待たず `register_youtube_video` を呼ぶ。`episodeId`, `youtubeId`, 任意の `generationId`, `featured`, `contentKind`, `productionNotes` を渡す。
   - 種類は視聴者向けに `story`（物語）、`explainer`（解説）、`music`（音楽）、`other`（その他）。生成技術で分類しない。
   - 制作ノートは任意。公開する場合 `productionNotes:true` と対象 `generationId` が必要。プロンプト・モデル・入力素材は存在するセクションだけ表示。ノートなしの動画は `productionNotes:false`。
   - 再登録時も種類・ノート・イチオシを明示して、意図せず既存設定を既定値へ戻さない。
6. Studio登録ではYouTubeを `public` にする。新規アップロードのmetadataへ `status.privacyStatus: "public"` を明示する。既存IDが非公開なら、その動画を公開へ更新し、再アップロードしない。`register_youtube_video` 自体には公開機能がないため、ID登録だけで止めない。非公開等の明示指定がある場合だけ、その指定を維持する。
7. `sync_youtube_videos` を一度実行し、`list_youtube_videos` で状態確認。処理中ならその状態とIDを報告する。`waiting_public` で非公開等の指定がない場合は、YouTubeの公開設定を修正してから同期する。Cloudflare Cronは約5分ごとに状態を確認するが、非公開動画を公開へ変更する機能はない。
   新規作品の制作ノートURLは、サイト掲載条件が揃うまで404になる。YouTube公開直後に同期を実行して待ち時間を短くし、処理中なら約5分ごとの自動掲載を待つ。
8. `ready` かつ `is_active:1` なら公開ページを確認する。差し替えは新IDを同作品に登録し、条件成立まで旧版を維持。チャンネルにある未登録動画は勝手に掲載されない。旧YouTube動画は自動削除しない。

## YouTubeアップロードと再開

このリポジトリでは、利用可能なYouTube Data APIのアップロード手段を確認し、Studio登録では `status.privacyStatus: "public"` を明示してアップロードする。非公開・限定公開・予約公開・制作記録のみ等の指定がある場合は、その指定を優先する。API認可・転送用コマンドが未設定なら、設定済みの公式チャンネル用YouTube Studioで投稿し、動画IDをMCPへ登録できる。StudioのMCPログインとYouTube APIのOAuth認可は別であり、MCP接続だけで動画本体をYouTubeへ転送できるわけではない。

- アップロード前に既存ID・チャンネル内の同作品を確認し、重複投稿を避ける。
- API転送は再開可能アップロードを使い、セッションURL・OAuth tokenをログ・Git・チャットへ出さない。自分の環境の非公開領域へ保管する。所有者のOAuthキャッシュをコピーしない。
- ID取得前の転送中断はCloudflareのCronでは再開できない。使用したアップローダーの再開機能を使う。ID取得後のYouTube処理状況はCronが確認する。公開設定の変更はこの登録作業で実施する。
- セッション期限切れはチャンネルを確認して重複を防いでから再発行する。単なる失敗で新しいエピソードを作らない。
- MMU側の参考実装は [upload-youtube.py](https://github.com/K9i-0/madogiwa-multimedia-universe/blob/main/16_MADOGIWA_STUDIO/tools/upload-youtube.py)。そのまま使うには同じリポジトリのOAuth管理クライアントと認証設定が必要。このリポジトリにない `16_MADOGIWA_STUDIO/` のコマンドを実行しない。

## ギャラリー・記事ワークフロー

- 書き込み前に`list_gallery_items`または`list_articles`でslugと表示順を確認する。
- 新しいギャラリー項目は`draft`で作成し、`create_gallery_image_upload`の一回限りURLへJPEG、PNG、WebPのいずれかをPUTしてから`published`へ変更する。
- ギャラリー画像は10MB以下にし、URL発行とPUTを同じ作業内で連続して行う。アップロードURLは表示・保存しない。
- 記事は外部URL、掲載元、リンク文言まで確認してから公開する。
- 並べ替えは一覧で全対象IDを確認してから`reorder_gallery_items`または`reorder_articles`を使う。
- 物理削除は行わず、取り下げは`draft`または`archived`へ変更する。
- 更新後は一覧を再取得し、公開サイトの表示順、画像URL、公開状態を確認する。

## 入力素材のPUTと既存R2動画

- 入力素材の登録はPUT成功とready確認まで完了させる。チケット発行だけでは完了としない。
- 一回限りURLはBearer相当の秘密情報。返却値のまま使い、表示・保存しない。実ファイルのContent-Typeで送る。
- 公開する制作ノートに紐付いた入力素材のみ公開される。未採用・非公開の制作記録は管理画面に残る。
- `create_video_upload`、`/media/` 動画配信、MP4保存・ファイル共有は廃止。`set_video_status` / `set_video_featured` は旧動画行の保守用で、YouTube掲載設定には使わない。
- 既存R2動画は移行時のバックアップとして残す。新規動画をR2へPUTしない。削除は参照先・ローカル原本・切り戻し期間を確認した別作業とし、入力画像・参照音声・資料をまとめて削除しない。

## 完了報告

作品名、Studio ID、slug、YouTube ID/URL、種類、制作ノート有無、制作記録の対象版と素材、YouTube処理・掲載状態、公開ページURLを簡潔に報告する。「アップロード済み」「公開待ち」「サイト掲載済み」を区別する。
