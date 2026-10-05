#!/usr/bin/env python3
"""YouTube Studioへ手で投稿するための素材一式を書き出す。

catalog.jsonの全エピソードについて、

- 動画mp4（公開日の古い順に連番を振り、ドラッグ&ドロップしやすい名前にする）
- ポスターjpg（サムネイルに使う）
- 貼り付け用のタイトル・説明文をまとめたシート

を1つのフォルダに出す。OAuthもAPIキーも要らない。

    python3 tools/youtube/export_manual.py --out ~/Documents/madogiwa_youtube
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

HERE = Path(__file__).parent
SITE = "https://madogiwa.work"
TAGS = "窓際族物語, AI動画, 生成AI, ショートアニメ, コメディ"

import sys
sys.path.insert(0, str(HERE))
from upload import build_description, download  # noqa: E402


def render_sheet(rows: list[dict]) -> str:
    lines = [
        "# YouTube手動アップロード用シート",
        "",
        f"全{len(rows)}本。公開日の古い順に連番を振ってある。",
        "YouTube Studioの「作成」→「動画をアップロード」にmp4をドラッグし、",
        "下のタイトル・説明をコピーして貼る。",
        "",
        "共通で入れるタグ:",
        "",
        "```",
        TAGS,
        "```",
        "",
        "カテゴリは「コメディ」、「子ども向け」は「いいえ」を選ぶ。",
        "サムネイルは同名の `.jpg` を指定する（854x480なので、こだわる場合は作り直す）。",
        "",
        "---",
        "",
    ]
    for row in rows:
        lines += [
            f"## {row['no']:02d}. {row['title']}",
            "",
            f"- 動画: `{row['video_file']}`",
            f"- サムネイル: `{row['poster_file']}`",
            f"- 制作ノート: {row['episode_url']}",
            "",
            "**タイトル**",
            "",
            "```",
            row["title"],
            "```",
            "",
            "**説明**",
            "",
            "```",
            row["description"],
            "```",
            "",
            "---",
            "",
        ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--catalog", type=Path, default=HERE / "catalog.json")
    parser.add_argument("--template", type=Path, default=HERE / "description_template.txt")
    parser.add_argument("--out", type=Path, default=Path.home() / "Documents/madogiwa_youtube")
    parser.add_argument("--skip", nargs="*",
                        default=["mcp-video-registration-validation-20260816"])
    parser.add_argument("--no-posters", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    template = args.template.read_text(encoding="utf-8")
    out = args.out.expanduser()
    out.mkdir(parents=True, exist_ok=True)

    rows = []
    no = 0
    for entry in catalog["episodes"]:
        if entry["slug"] in args.skip:
            continue
        no += 1
        stem = f"{no:02d}_{entry['slug']}"
        video = download(entry["video_url"], out / f"{stem}.mp4")
        poster_name = ""
        if not args.no_posters and entry.get("poster_url"):
            poster_name = download(entry["poster_url"], out / f"{stem}.jpg").name
        size_mb = video.stat().st_size / 1024 / 1024
        rows.append({
            "no": no,
            "slug": entry["slug"],
            "title": entry["title"],
            "description": build_description(entry, template),
            "video_file": video.name,
            "poster_file": poster_name,
            "episode_url": entry["episode_url"],
            "size_mb": round(size_mb, 1),
        })
        print(f"  {no:02d} {entry['title']}  ({size_mb:.1f}MB)")

    (out / "UPLOAD_SHEET.md").write_text(render_sheet(rows), encoding="utf-8")
    (out / "sheet.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    total = sum(r["size_mb"] for r in rows)
    print(f"\n{len(rows)}本 / 合計 {total:.0f}MB -> {out}")
    print(f"説明文シート: {out / 'UPLOAD_SHEET.md'}")


if __name__ == "__main__":
    main()
