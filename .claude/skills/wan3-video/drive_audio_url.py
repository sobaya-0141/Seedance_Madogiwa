#!/usr/bin/env python3
"""Turn Google Drive share links into direct-download URLs for Wan 3.0 and verify they serve the exact local file.

The Wan API only takes reference audio as a public URL. Drive works (measured 2026-10-23): the user shares the wav as
"Anyone with the link (viewer)" and pastes the link; this script converts
  https://drive.google.com/file/d/<id>/view?usp=sharing  ->  https://drive.google.com/uc?export=download&id=<id>
downloads it and compares SHA-256 with the local wav, then prints the --audio-url argument for wan3_run.py.

usage: python3 .claude/skills/wan3-video/drive_audio_url.py <run_dir> ch3=<share link> ch9=<share link>
       (the local wav of each chapter is taken from wan3_inputs.json / chN_workflow.json)
Tell the user to switch the files back to "Restricted" (or delete them) after generation.
"""
import hashlib
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wan3_run import chapter_inputs  # noqa: E402


def direct(link: str) -> str:
    m = re.search(r"/d/([A-Za-z0-9_-]{20,})", link) or re.search(r"[?&]id=([A-Za-z0-9_-]{20,})", link)
    if not m:
        raise SystemExit(f"not a Google Drive file link: {link}")
    return f"https://drive.google.com/uc?export=download&id={m.group(1)}"


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    run = Path(sys.argv[1])
    args = []
    for spec in sys.argv[2:]:
        ch, link = spec.split("=", 1)
        _p, _i, auds, _s = chapter_inputs(run, ch)
        if len(auds) != 1:
            raise SystemExit(f"{ch}: expects exactly one wav, found {auds}")
        url = direct(link)
        remote = urllib.request.urlopen(url, timeout=60).read()
        local = (run / auds[0]).read_bytes()
        same = hashlib.sha256(remote).digest() == hashlib.sha256(local).digest()
        print(f"{ch}: {auds[0]} {'OK — Drive serves the identical file' if same else 'MISMATCH (not shared publicly, or a different file)'}")
        if not same:
            sys.exit(1)
        args.append(f'--audio-url "{ch}={url}"')
    print("\n" + " ".join(args))


if __name__ == "__main__":
    main()
