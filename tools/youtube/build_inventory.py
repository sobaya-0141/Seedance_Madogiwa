#!/usr/bin/env python3
"""03_SCRIPTS配下の完成動画候補を棚卸しし、公式サイトのエピソードslugと突き合わせる。

mp4はGit管理外なので、必ず本体チェックアウト（worktreeではない方）を --media-root に渡す。

    python3 tools/youtube/build_inventory.py \
        --media-root ~/Documents/private/Seedance_Madogiwa \
        --out tools/youtube/inventory.json \
        --md tools/youtube/INVENTORY.md

出力したJSONの各ランについて、人間が `chosen`（採用する動画の相対パス）と `slug`
（madogiwa.workのエピソードslug。導線リンクに使う）を確定させてからアップロードする。
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import subprocess
from pathlib import Path

# 完成版の候補になりうるファイル名（ランディレクトリ直下のみ対象）
FINAL_PATTERNS = (
    re.compile(r"^final.*\.mp4$", re.I),
    re.compile(r".*_final(_.*)?\.mp4$", re.I),
    re.compile(r".*_final(ized)?\.mp4$", re.I),
    re.compile(r".*_combined\.mp4$", re.I),
)
# 中間生成物・検証用として常に除外する
EXCLUDE_PATTERNS = (
    re.compile(r"^ch\d+([_.].*)?\.mp4$", re.I),   # チャプター単体
    re.compile(r"^clip\d+.*\.mp4$", re.I),
    re.compile(r".*animatic.*\.mp4$", re.I),
    re.compile(r".*preview.*\.mp4$", re.I),
    re.compile(r".*video_only.*\.mp4$", re.I),
    re.compile(r".*_source\.mp4$", re.I),
    re.compile(r".*_draft_before_fix\.mp4$", re.I),
)
# 自動マッチをそのまま採用してよい一致度。これ未満は人間が確認する。
SLUG_CONFIDENT = 0.8

# これらのサブディレクトリ配下は素材置き場なので丸ごと無視する
EXCLUDE_DIRS = {
    "fixed", "retimed", "validation", "input_clips", "assembly_inputs",
    "remotion", "public", "r2v_rejected", "node_modules",
}


def ffprobe(path: Path) -> dict:
    """長さ・解像度・コーデックを取る。失敗しても棚卸しは続ける。"""
    cmd = [
        "ffprobe", "-v", "error", "-print_format", "json",
        "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height",
        str(path),
    ]
    try:
        raw = subprocess.run(cmd, capture_output=True, text=True, timeout=60, check=True).stdout
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as exc:
        return {"error": str(exc)}
    data = json.loads(raw)
    fmt = data.get("format", {})
    video = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
    audio = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    return {
        "duration": round(float(fmt["duration"]), 2) if fmt.get("duration") else None,
        "size_mb": round(int(fmt["size"]) / 1024 / 1024, 1) if fmt.get("size") else None,
        "resolution": f"{video.get('width')}x{video.get('height')}" if video else None,
        "video_codec": video.get("codec_name"),
        "has_audio": audio is not None,
    }


def is_final_candidate(name: str) -> bool:
    if any(p.match(name) for p in EXCLUDE_PATTERNS):
        return False
    return any(p.match(name) for p in FINAL_PATTERNS)


def script_title(run_dir: Path) -> str | None:
    """script.mdの先頭H1を台本タイトルとして拾う。"""
    md = run_dir / "script.md"
    if not md.exists():
        candidates = sorted(run_dir.glob("*.md"))
        if not candidates:
            return None
        md = candidates[0]
    for line in md.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return None


def normalize(text: str) -> str:
    """`95_madogiwa_tshirt_destruction_cm` → `madogiwa-tshirt-destruction-cm`"""
    text = re.sub(r"^\d+[-_]*", "", text)
    text = re.sub(r"[_\s]+", "-", text.lower())
    return re.sub(r"-+", "-", text).strip("-")


def match_slug(run_name: str, episodes: list[dict]) -> tuple[str | None, str | None, float]:
    """ランディレクトリ名に最も近いエピソードslugを返す（トークン一致 + 文字列類似度）。"""
    key = normalize(run_name)
    key_tokens = set(key.split("-"))
    best: tuple[str | None, str | None, float] = (None, None, 0.0)
    for ep in episodes:
        slug_tokens = set(ep["slug"].split("-"))
        jaccard = len(key_tokens & slug_tokens) / len(key_tokens | slug_tokens)
        ratio = difflib.SequenceMatcher(None, key, ep["slug"]).ratio()
        score = max(jaccard, ratio)
        if score > best[2]:
            best = (ep["slug"], ep["title"], round(score, 2))
    return best


def collect(media_root: Path, episodes: list[dict]) -> list[dict]:
    scripts_dir = media_root / "03_SCRIPTS"
    runs: list[dict] = []

    for run_dir in sorted(scripts_dir.iterdir()):
        if not run_dir.is_dir() or run_dir.name in EXCLUDE_DIRS or run_dir.name == "ref_images":
            continue
        candidates = [p for p in sorted(run_dir.iterdir())
                      if p.is_file() and is_final_candidate(p.name)]
        if not candidates:
            # finalが無いランは「候補なし」として記録だけ残す（人間の判断材料）
            all_mp4 = [p for p in sorted(run_dir.iterdir())
                       if p.is_file() and p.suffix == ".mp4"]
            runs.append({
                "run": run_dir.name,
                "script_title": script_title(run_dir),
                "status": "no_final_candidate",
                "mp4_count": len(all_mp4),
                "candidates": [],
                "chosen": None,
                "slug": None,
            })
            continue

        probed = []
        for path in candidates:
            info = ffprobe(path)
            info["file"] = str(path.relative_to(media_root))
            info["mtime"] = path.stat().st_mtime
            probed.append(info)
        # 更新が最も新しいものを既定の採用候補にする
        probed.sort(key=lambda d: d["mtime"], reverse=True)

        slug, title, score = match_slug(run_dir.name, episodes)
        runs.append({
            "run": run_dir.name,
            "script_title": script_title(run_dir),
            "status": "ok" if len(probed) == 1 else "multiple_candidates",
            "candidates": probed,
            "chosen": probed[0]["file"],
            "slug": slug if score >= SLUG_CONFIDENT else None,
            "slug_guess": {"slug": slug, "title": title, "score": score},
        })

    # 03_SCRIPTS直下に置かれた単体mp4
    for path in sorted(scripts_dir.glob("*.mp4")):
        info = ffprobe(path)
        info["file"] = str(path.relative_to(media_root))
        info["mtime"] = path.stat().st_mtime
        slug, title, score = match_slug(path.stem, episodes)
        runs.append({
            "run": path.stem,
            "script_title": None,
            "status": "standalone_file",
            "candidates": [info],
            "chosen": info["file"],
            "slug": slug if score >= SLUG_CONFIDENT else None,
            "slug_guess": {"slug": slug, "title": title, "score": score},
        })

    return runs


def render_md(runs: list[dict], episodes: list[dict]) -> str:
    lines = [
        "# 完成動画の棚卸し（YouTube投稿候補）",
        "",
        "`tools/youtube/build_inventory.py` の生成物。`chosen` と `slug` を人間が確定させてから投稿する。",
        "",
        "## 採用候補が1本に決まったラン",
        "",
        "| ラン | 台本タイトル | 採用候補 | 長さ | 解像度 | 音声 | 推定slug | 一致度 |",
        "|---|---|---|---|---|---|---|---|",
    ]
    ready, ambiguous, empty = [], [], []
    for run in runs:
        if run["status"] == "no_final_candidate":
            empty.append(run)
        elif run["status"] == "multiple_candidates":
            ambiguous.append(run)
        else:
            ready.append(run)

    for run in ready:
        c = run["candidates"][0]
        g = run.get("slug_guess") or {}
        lines.append(
            f"| `{run['run']}` | {run['script_title'] or '—'} | `{Path(c['file']).name}` | "
            f"{c.get('duration') or '—'}s | {c.get('resolution') or '—'} | "
            f"{'あり' if c.get('has_audio') else 'なし'} | "
            f"{run['slug'] or '要確認'} | {g.get('score') or '—'} |"
        )

    lines += ["", "## 候補が複数あるラン（どれが完成版か要指示）", ""]
    for run in ambiguous:
        g = run.get("slug_guess") or {}
        lines.append(f"### `{run['run']}` — {run['script_title'] or '—'}")
        lines.append(f"推定slug: `{g.get('slug')}`（一致度 {g.get('score')}） / {g.get('title')}")
        lines.append("")
        lines.append("| ファイル | 長さ | 解像度 | サイズ | 音声 | 更新 |")
        lines.append("|---|---|---|---|---|---|")
        for c in run["candidates"]:
            import datetime
            mt = datetime.datetime.fromtimestamp(c["mtime"]).strftime("%Y-%m-%d %H:%M")
            lines.append(
                f"| `{Path(c['file']).name}` | {c.get('duration') or '—'}s | "
                f"{c.get('resolution') or '—'} | {c.get('size_mb') or '—'}MB | "
                f"{'あり' if c.get('has_audio') else 'なし'} | {mt} |"
            )
        lines.append("")

    lines += ["## 完成版候補が見つからなかったラン", ""]
    for run in empty:
        lines.append(f"- `{run['run']}`（mp4 {run['mp4_count']}本、final系なし）")

    used = {r.get("slug") for r in runs if r.get("slug")}
    lines += ["", "## ローカルのランに紐づかなかった公式サイトのエピソード", ""]
    for ep in episodes:
        if ep["slug"] not in used:
            lines.append(f"- `{ep['slug']}` — {ep['title']}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--media-root", required=True, type=Path,
                        help="mp4が実在するチェックアウトのルート（worktreeではない方）")
    parser.add_argument("--episodes", type=Path,
                        default=Path(__file__).parent / "studio_episodes.json")
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "inventory.json")
    parser.add_argument("--md", type=Path, default=Path(__file__).parent / "INVENTORY.md")
    args = parser.parse_args()

    media_root = args.media_root.expanduser().resolve()
    episodes = json.loads(args.episodes.read_text(encoding="utf-8"))
    runs = collect(media_root, episodes)

    args.out.write_text(json.dumps(
        {"media_root": str(media_root), "runs": runs}, ensure_ascii=False, indent=2
    ) + "\n", encoding="utf-8")
    args.md.write_text(render_md(runs, episodes), encoding="utf-8")

    ok = sum(1 for r in runs if r["status"] in ("ok", "standalone_file"))
    multi = sum(1 for r in runs if r["status"] == "multiple_candidates")
    none_ = sum(1 for r in runs if r["status"] == "no_final_candidate")
    print(f"runs={len(runs)}  確定候補={ok}  要選択={multi}  候補なし={none_}")
    print(f"-> {args.out}\n-> {args.md}")


if __name__ == "__main__":
    main()
