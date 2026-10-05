#!/usr/bin/env python3
"""catalog.jsonの各エピソードをYouTubeへ投稿する。

説明欄には公式サイトの制作ノート（プロンプト・使用モデル・入力素材）への導線を入れる。

    # 何が投稿されるかだけ確認する（認証も通信もしない）
    python3 tools/youtube/upload.py --dry-run

    # 実際に投稿する（既定で1回6本まで。APIのクォータが1日10,000単位しかないため）
    python3 tools/youtube/upload.py --client-secret ~/.config/madogiwa/client_secret.json

投稿済みのslugは state ファイルに記録され、再実行しても二重投稿しない。
クォータ上限に当たったら翌日（太平洋時間0時リセット）同じコマンドを再実行すれば続きから進む。

公開状態は既定で private。未監査のAPIプロジェクトから投稿した動画はpublicにできないため、
公開はYouTube Studio側で行う。
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
SITE = "https://madogiwa.work"
# videos.insert=1600 / thumbnails.set=50 単位。既定クォータ10,000では1日6本が上限。
QUOTA_INSERT = 1600
DEFAULT_LIMIT = 6
DEFAULT_TAGS = ["窓際族物語", "AI動画", "生成AI", "ショートアニメ", "コメディ"]
CATEGORY_COMEDY = "23"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def log(msg: str) -> None:
    print(msg, flush=True)


def download(url: str, dest: Path) -> Path:
    """キャッシュ済みなら再利用する。Studio側で差し替えたらキャッシュを消す。"""
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "madogiwa-youtube-tools/1.0"})
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(req, timeout=120) as res, tmp.open("wb") as out:
        while chunk := res.read(1 << 20):
            out.write(chunk)
    tmp.rename(dest)
    return dest


def build_description(entry: dict, template: str) -> str:
    text = template.format(
        description=entry.get("description", "").strip(),
        episode_url=entry["episode_url"],
        site=SITE,
    )
    # YouTubeの説明欄は5000文字まで
    return text[:5000]


def load_state(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"uploaded": {}}


def save_state(path: Path, state: dict) -> None:
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_service(client_secret: Path, token_path: Path):
    """初回だけブラウザでOAuth同意し、以後はトークンを使い回す。"""
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not client_secret.exists():
                sys.exit(f"OAuthクライアントが見つからない: {client_secret}\n"
                         "Google Cloudコンソールで『デスクトップアプリ』のクライアントIDを作り、"
                         "JSONをこのパスに置く。")
            creds = InstalledAppFlow.from_client_secrets_file(
                str(client_secret), SCOPES).run_local_server(port=0)
        token_path.parent.mkdir(parents=True, exist_ok=True)
        token_path.write_text(creds.to_json(), encoding="utf-8")
        token_path.chmod(0o600)
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def upload_one(service, entry: dict, video_path: Path, description: str,
               privacy: str, tags: list[str]) -> str:
    from googleapiclient.http import MediaFileUpload

    body = {
        "snippet": {
            "title": entry["title"][:100],
            "description": description,
            "tags": tags,
            "categoryId": CATEGORY_COMEDY,
            "defaultLanguage": "ja",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }
    media = MediaFileUpload(str(video_path), chunksize=4 << 20, resumable=True,
                            mimetype="video/mp4")
    request = service.videos().insert(part="snippet,status", body=body, media_body=media)

    response, retries = None, 0
    while response is None:
        try:
            status, response = request.next_chunk()
            if status:
                log(f"      {int(status.progress() * 100):3d}%")
        except Exception as exc:  # 再開可能アップロードはチャンク単位で再試行できる
            retries += 1
            if retries > 5:
                raise
            wait = 2 ** retries
            log(f"      再試行 {retries}/5（{wait}s）: {exc}")
            time.sleep(wait)
    return response["id"]


def set_thumbnail(service, video_id: str, poster: Path) -> None:
    """チャンネルが電話認証済みでないと失敗する。失敗しても投稿自体は成功扱いにする。"""
    from googleapiclient.http import MediaFileUpload
    service.thumbnails().set(
        videoId=video_id,
        media_body=MediaFileUpload(str(poster), mimetype="image/jpeg"),
    ).execute()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--catalog", type=Path, default=HERE / "catalog.json")
    parser.add_argument("--template", type=Path, default=HERE / "description_template.txt")
    parser.add_argument("--state", type=Path, default=HERE / "upload_state.json")
    parser.add_argument("--cache", type=Path, default=Path(".local/youtube-cache"),
                        help="ダウンロードした動画・ポスターの置き場（Git管理外）")
    parser.add_argument("--client-secret", type=Path,
                        default=Path.home() / ".config/madogiwa/client_secret.json")
    parser.add_argument("--token", type=Path,
                        default=Path.home() / ".config/madogiwa/youtube_token.json")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT,
                        help=f"1回に投稿する本数（既定{DEFAULT_LIMIT}＝1日のクォータ上限）")
    parser.add_argument("--privacy", default="private",
                        choices=["private", "unlisted", "public"])
    parser.add_argument("--only", nargs="*", default=None, help="このslugだけ投稿する")
    parser.add_argument("--skip", nargs="*", default=["mcp-video-registration-validation-20260816"],
                        help="投稿しないslug")
    parser.add_argument("--no-thumbnail", action="store_true",
                        help="ポスター画像をサムネイルに設定しない")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    template = args.template.read_text(encoding="utf-8")
    state = load_state(args.state)
    done = state["uploaded"]

    queue = []
    for entry in catalog["episodes"]:
        slug = entry["slug"]
        if slug in done or slug in args.skip:
            continue
        if args.only and slug not in args.only:
            continue
        queue.append(entry)

    log(f"未投稿 {len(queue)}件 / 投稿済み {len(done)}件 / 今回 {min(len(queue), args.limit)}件")

    if args.dry_run:
        for entry in queue[: args.limit]:
            log("\n" + "=" * 60)
            log(f"[{entry['slug']}] {entry['title']}")
            log("-" * 60)
            log(build_description(entry, template))
        remaining = max(0, len(queue) - args.limit)
        log(f"\n（dry-run）残り {remaining}件は次回以降。"
            f" 1本あたり {QUOTA_INSERT} units")
        return

    service = build_service(args.client_secret, args.token)

    for entry in queue[: args.limit]:
        slug = entry["slug"]
        log(f"\n[{slug}] {entry['title']}")
        video = download(entry["video_url"], args.cache / f"{slug}.mp4")
        log(f"   動画 {video.stat().st_size / 1024 / 1024:.1f}MB")

        video_id = upload_one(service, entry, video,
                              build_description(entry, template),
                              args.privacy, DEFAULT_TAGS)
        log(f"   https://youtu.be/{video_id}")

        if not args.no_thumbnail and entry.get("poster_url"):
            try:
                poster = download(entry["poster_url"], args.cache / f"{slug}.jpg")
                set_thumbnail(service, video_id, poster)
                log("   サムネイル設定: OK")
            except Exception as exc:
                log(f"   サムネイル設定に失敗（チャンネルの電話認証が必要かも）: {exc}")

        done[slug] = {
            "video_id": video_id,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "privacy": args.privacy,
        }
        save_state(args.state, state)

    log(f"\n完了。投稿済み {len(done)}件 / 未投稿 {len(queue) - min(len(queue), args.limit)}件")
    if args.privacy == "private":
        log("公開はYouTube Studioで行う（未監査APIプロジェクトからはpublicにできない）。")


if __name__ == "__main__":
    main()
