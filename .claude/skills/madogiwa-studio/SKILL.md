---
name: madogiwa-studio
description: Madogiwa StudioのRemote Web MCPを使い、窓際族物語のギャラリー、記事、エピソード、生成バージョン、使用モデル、登場メンバー、Seedanceプロンプト、入力画像・参照音声・資料、生成動画を登録・確認する。ユーザーがMadogiwa Studioへの登録、公式サイトコンテンツ編集、動画アップロード、プロンプト同期、入力素材管理、Studio ID確認、MCP接続や同僚環境への導入を頼んだときに使用する。
---

# Madogiwa Studio

Madogiwa Studioを制作物の共有台帳として扱い、Remote MCPでメタデータを操作し、一回限りURLへバイナリを直接アップロードする。

## 準備

1. `references/mcp-tools.md`を最後まで読む。
2. `madogiwa-studio` MCPのツールが利用可能か確認する。見つからなければ同リファレンスの接続設定を案内し、接続後にセッション再起動が必要か伝える。
3. OAuthは各利用者が自分のメールアドレスで行う。認証情報やアップロードURLを共有・表示・保存しない。
4. リポジトリの`AGENTS.md`または`CLAUDE.md`を読み、Git管理対象と採用素材の方針を守る。

## 読み取りと対象決定

書き込み前に`list_episodes`と必要に応じて`list_members`を呼び、slugや既存エピソードとの重複を避ける。既存エピソードは`get_episode`で生成バージョン、プロンプト、入力、動画を確認してから変更する。

- エピソード番号を識別子に使わない。Studio内ではランダムな`studio_id`が正本になる。
- slugは内容を表す安定した英小文字・数字・ハイフンで作る。
- 同じエピソードの再生成は新しいエピソードではなく`create_generation`でv2、v3へ追加する。
- `create_episode`はv1を自動作成する。直後に`get_episode`でv1の`generationId`を取得し、最初の生成を登録するためだけに`create_generation`を呼ばない。
- 登場メンバーは`list_members`が返したIDだけを使う。

## 登録ワークフロー

1. 対象ファイルの存在、種類、サイズを確認する。生成に採用したプロンプト・入力・動画だけを選ぶ。
2. 新規なら`create_episode`、既存の別生成なら`create_generation`を呼ぶ。
3. 使用モデル、ラベル、メモは`update_generation`で補う。モデル名は固定候補に限定しない。
4. 実際に生成へ渡した本文を`upsert_prompt`で登録する。プロンプト変更は履歴として新しいrevisionを作る。
5. 入力画像・参照音声・資料はそれぞれ`create_input_upload`でチケットを発行し、返されたURLへファイルをPUTする。
6. 生成動画から0.5秒付近のJPEGサムネイルを作る。`create_video_upload`でチケットを発行し、`posterUploadUrl`へJPEG、`uploadUrl`へ動画をPUTする。公式サイトで優先したい採用動画は`featured: true`を指定する。
7. `get_episode`を再実行し、各ファイルが`ready`、動画の`poster_r2_key`とサイズが非null、プロンプトとモデルが意図どおりか確認する。
8. 必要なら公開詳細ページ`https://madogiwa-studio.madogiwa-studio.workers.dev/episodes/<slug>`で表示・再生を確認する。

## ギャラリー・記事ワークフロー

- 書き込み前に`list_gallery_items`または`list_articles`でslugと表示順を確認する。
- 新しいギャラリー項目は`draft`で作成し、`create_gallery_image_upload`の一回限りURLへJPEG、PNG、WebPのいずれかをPUTしてから`published`へ変更する。
- ギャラリー画像は10MB以下にし、URL発行とPUTを同じ作業内で連続して行う。アップロードURLは表示・保存しない。
- 記事は外部URL、掲載元、リンク文言まで確認してから公開する。
- 並べ替えは一覧で全対象IDを確認してから`reorder_gallery_items`または`reorder_articles`を使う。
- 物理削除は行わず、取り下げは`draft`または`archived`へ変更する。
- 更新後は一覧を再取得し、公開サイトの表示順、画像URL、公開状態を確認する。

## アップロード規則

- 動画とサムネイルの各アップロードURLは1時間・一回限りのBearer相当情報として扱い、応答やログへ出さない。
- URL発行とPUTを同じ作業内で連続して行う。PUTでは実ファイルに合う`Content-Type`を指定する。
- MCPはメタデータとチケットを作り、バイナリPUTはWorkerの専用URLへ直接送る。これは正常な設計である。
- サムネイルはJPEG、PNG、WebPのいずれか、5MB以下にする。通常は`ffmpeg -ss 0.5 -i <video> -frames:v 1 -vf scale=1280:1280:force_original_aspect_ratio=decrease -q:v 3 <poster.jpg>`で生成する。
- PUT失敗時は作成済み`videoId`を`archived`にしてから新しいチケットを発行する。使用済みURLを再試行しない。
- 動画を`published`へ変更するのはユーザーが公開採用を明示した場合だけにする。通常の登録完了は`ready`のままにする。
- イチオシは公開状態とは別の優先表示フラグである。登録後の変更は`set_video_featured`を使い、依頼がなければ既存のイチオシを勝手に解除しない。

## 完了報告

エピソード名、Studio ID、slug、対象バージョン、モデル、登録した入力・動画、検証状態、公開詳細ページURLを簡潔に報告する。失敗したチケットをarchiveした場合も明記する。
