#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["google-api-python-client>=2.100", "google-auth-oauthlib>=1.2", "google-auth-httplib2>=0.2"]
# ///
"""公式YouTubeチャンネルへの投稿・メタデータ更新ツール（YouTube Data API v3）。

OAuthクライアントとトークンはリポジトリ外の非公開領域に置く（Git・チャットに出さない）:
  ~/.config/madogiwa-youtube/client_secret.json   Cloud Console のデスクトップアプリ用クライアント
  ~/.config/madogiwa-youtube/token.json           auth で作成（パーミッション600）
  ~/.config/madogiwa-youtube/sessions/            再開可能アップロードのセッション（非公開）

usage:
  uv run tools/youtube_upload.py auth                       # 初回のみ。ブラウザで公式チャンネルを選んで許可
  uv run tools/youtube_upload.py whoami                     # 認可したチャンネルを確認
  uv run tools/youtube_upload.py status VIDEO_ID
  uv run tools/youtube_upload.py update VIDEO_ID --meta youtube_meta.json [--privacy public]
  uv run tools/youtube_upload.py upload VIDEO.mp4 --meta youtube_meta.json --record RUN_DIR/youtube_upload.json

meta JSON: {"title": ..., "description": ..., "categoryId": "24", "tags": [...],
            "defaultLanguage": "ja", "defaultAudioLanguage": "ja",
            "privacyStatus": "private", "containsSyntheticMedia": true, "selfDeclaredMadeForKids": false}
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

OFFICIAL_CHANNEL = "UCyQtPu94OaiGxFdd2A6bXdw"
CONF = Path(os.environ.get("MADOGIWA_YOUTUBE_DIR", Path.home() / ".config" / "madogiwa-youtube"))
CLIENT = CONF / "client_secret.json"
TOKEN = CONF / "token.json"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]


def credentials(interactive: bool = False):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES) if TOKEN.exists() else None
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception as e:  # テスト中アプリはrefresh tokenが7日で失効する
            if not interactive:
                sys.exit(f"トークンの更新に失敗しました（{type(e).__name__}）。`auth` をやり直してください")
            creds = None
    if not creds or not creds.valid:
        if not interactive:
            sys.exit("未認可です。先に `uv run tools/youtube_upload.py auth` を実行してください")
        if not CLIENT.exists():
            sys.exit(f"OAuthクライアントがありません: {CLIENT}")
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT), SCOPES)
        creds = flow.run_local_server(port=0, prompt="consent", open_browser=True)
    CONF.mkdir(mode=0o700, parents=True, exist_ok=True)
    old = os.umask(0o077)
    try:
        TOKEN.write_text(creds.to_json())
    finally:
        os.umask(old)
    TOKEN.chmod(0o600)
    return creds


def service(interactive: bool = False):
    from googleapiclient.discovery import build

    return build("youtube", "v3", credentials=credentials(interactive), cache_discovery=False)


def my_channel(yt) -> dict:
    items = yt.channels().list(part="id,snippet", mine=True).execute().get("items", [])
    if not items:
        sys.exit("認可したアカウントにチャンネルがありません")
    return items[0]


def require_official(yt) -> None:
    ch = my_channel(yt)
    if ch["id"] != OFFICIAL_CHANNEL:
        sys.exit(f"認可済みチャンネルが公式ではありません: {ch['id']}（{ch['snippet']['title']}）。`auth` で公式チャンネルを選び直してください")


def load_meta(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def body_from_meta(meta: dict, video_id: str | None = None, privacy: str | None = None) -> dict:
    snippet = {k: meta[k] for k in ("title", "description", "categoryId", "tags", "defaultLanguage", "defaultAudioLanguage") if k in meta}
    snippet.setdefault("categoryId", "24")
    status = {
        "privacyStatus": privacy or meta.get("privacyStatus", "private"),
        "selfDeclaredMadeForKids": meta.get("selfDeclaredMadeForKids", False),
        "embeddable": meta.get("embeddable", True),
        "containsSyntheticMedia": meta.get("containsSyntheticMedia", True),
    }
    body = {"snippet": snippet, "status": status}
    if video_id:
        body["id"] = video_id
    return body


def cmd_auth(_):
    yt = service(interactive=True)
    ch = my_channel(yt)
    mark = "OK（公式チャンネル）" if ch["id"] == OFFICIAL_CHANNEL else "※公式チャンネルではありません。auth をやり直して公式チャンネルを選択してください"
    print(f"認可済み: {ch['snippet']['title']} ({ch['id']}) {mark}")


def cmd_whoami(_):
    ch = my_channel(service())
    print(f"{ch['snippet']['title']} ({ch['id']}){' 公式' if ch['id'] == OFFICIAL_CHANNEL else ''}")


def cmd_status(a):
    yt = service()
    items = yt.videos().list(part="snippet,status,processingDetails", id=a.video_id).execute().get("items", [])
    if not items:
        sys.exit("動画が見つかりません（権限外か削除済み）")
    v = items[0]
    print(json.dumps({
        "id": v["id"], "channelId": v["snippet"]["channelId"], "title": v["snippet"]["title"],
        "privacyStatus": v["status"]["privacyStatus"], "uploadStatus": v["status"].get("uploadStatus"),
        "embeddable": v["status"].get("embeddable"), "containsSyntheticMedia": v["status"].get("containsSyntheticMedia"),
        "processing": v.get("processingDetails", {}).get("processingStatus"),
    }, ensure_ascii=False, indent=2))


def cmd_update(a):
    yt = service()
    require_official(yt)
    meta = load_meta(a.meta)
    body = body_from_meta(meta, a.video_id, a.privacy)
    res = yt.videos().update(part="snippet,status", body=body).execute()
    print(f"更新しました: {res['id']} title={res['snippet']['title']!r} privacy={res['status']['privacyStatus']}")


def cmd_upload(a):
    from googleapiclient.http import MediaFileUpload

    rec = Path(a.record) if a.record else None
    if rec and rec.exists():
        prev = json.loads(rec.read_text())
        if prev.get("youtubeId"):
            sys.exit(f"既にアップロード済みです: {prev['youtubeId']}（{rec}）。再投稿しません")
    yt = service()
    require_official(yt)
    meta = load_meta(a.meta)
    body = body_from_meta(meta, privacy=a.privacy or "private")
    media = MediaFileUpload(a.video, chunksize=16 * 1024 * 1024, resumable=True, mimetype="video/mp4")
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    resp = None
    while resp is None:
        status, resp = req.next_chunk(num_retries=5)
        if status:
            print(f"  {int(status.progress() * 100)}%", flush=True)
    vid = resp["id"]
    sha = hashlib.sha256(Path(a.video).read_bytes()).hexdigest()
    out = {"youtubeId": vid, "url": f"https://www.youtube.com/watch?v={vid}", "channelId": OFFICIAL_CHANNEL,
           "file": Path(a.video).name, "sha256": sha, "privacyStatus": resp["status"]["privacyStatus"]}
    if rec:
        rec.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(out, ensure_ascii=False, indent=2))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("auth").set_defaults(fn=cmd_auth)
    sub.add_parser("whoami").set_defaults(fn=cmd_whoami)
    p = sub.add_parser("status"); p.add_argument("video_id"); p.set_defaults(fn=cmd_status)
    p = sub.add_parser("update"); p.add_argument("video_id"); p.add_argument("--meta", required=True)
    p.add_argument("--privacy", choices=["private", "unlisted", "public"]); p.set_defaults(fn=cmd_update)
    p = sub.add_parser("upload"); p.add_argument("video"); p.add_argument("--meta", required=True)
    p.add_argument("--record"); p.add_argument("--privacy", choices=["private", "unlisted", "public"]); p.set_defaults(fn=cmd_upload)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
