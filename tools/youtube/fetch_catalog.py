#!/usr/bin/env python3
"""madogiwa.work（Madogiwa Studioの公開サイト）からYouTube投稿用カタログを作る。

各エピソードの詳細ページにはJSON-LDのVideoObjectが埋まっており、
タイトル・あらすじ・ポスター・mp4のURL・公開日がそのまま取れる。
ローカルの中間ファイルを突き合わせる必要はない。

    python3 tools/youtube/fetch_catalog.py --out tools/youtube/catalog.json

Studio側で動画を差し替えたら作り直す。認証は不要（公開情報のみ）。
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from pathlib import Path

SITE = "https://madogiwa.work"
LD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
EPISODE_RE = re.compile(r"<loc>https://madogiwa\.work/episodes/([^<]+)</loc>")


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "madogiwa-youtube-tools/1.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8")


def episode_slugs() -> list[str]:
    return EPISODE_RE.findall(get(f"{SITE}/sitemap.xml"))


def video_object(slug: str) -> dict | None:
    """エピソードページのJSON-LDからVideoObjectを取り出す。動画未登録ならNone。"""
    html = get(f"{SITE}/episodes/{slug}")
    for block in LD_RE.findall(html):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        if data.get("@type") == "VideoObject" and data.get("contentUrl"):
            thumb = data.get("thumbnailUrl")
            return {
                "slug": slug,
                "title": data["name"],
                "description": data.get("description", ""),
                "video_url": data["contentUrl"],
                "poster_url": thumb[0] if isinstance(thumb, list) and thumb else thumb,
                "published_at": data.get("uploadDate"),
                "episode_url": data.get("url", f"{SITE}/episodes/{slug}"),
            }
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "catalog.json")
    args = parser.parse_args()

    entries, skipped = [], []
    for slug in episode_slugs():
        entry = video_object(slug)
        if entry is None:
            skipped.append(slug)
            print(f"  skip {slug}（動画未登録）")
            continue
        entries.append(entry)
        print(f"  ok   {slug} — {entry['title']}")

    # 公開が新しい順ではなく古い順に並べ、チャンネルの投稿順を正史に合わせる
    entries.sort(key=lambda e: e["published_at"] or "")
    args.out.write_text(
        json.dumps({"source": SITE, "episodes": entries, "skipped": skipped},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\n{len(entries)}件 -> {args.out}（スキップ {len(skipped)}件）")


if __name__ == "__main__":
    main()
