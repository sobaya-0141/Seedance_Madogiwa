#!/usr/bin/env python3
"""Check that a generated chapter really uses the attached dialogue wav (no re-synthesized voice).

Compares the 10 ms RMS envelope of the attached wav's speech with every position in the clip's audio and reports the
best Pearson correlation and where it sits. It is a SCREENING proxy — sound effects written into the same moment
(whistle, gasp, megaphone) also lower it, so a low value means "listen to it", not "rejected".
Measured 2026-10 with this script:
  Wan 3.0, 1.2-1.5 s lines + SFX (37 ch3/ch9) ........................ 0.98-0.99
  H3, 15 s song starting at 0 s (33 ch2) ............................... 0.98
  H3, 2 s scream (35 ch4 one-line format / 36 ch3 six-section format) .. 0.64-0.68
  H3, 1.2-1.5 s lines + SFX (37 ch3/ch9; Turbo 8step v1.0, v1.1 and 4step alike) 0.41-0.56
  -> no difference between LoRA versions; H3 drifts from short attached lines, Wan keeps them.
Rule of thumb: >= 0.9 the wav is used as-is; 0.8-0.9 check by ear; < 0.8 listen carefully (re-voiced or heavily mixed).

usage: python3 .claude/skills/no-image-video/check_voice.py <clip.mp4> <attached.wav> [<clip2.mp4> <attached2.wav> ...]
"""
from __future__ import annotations

import array
import math
import subprocess
import sys
import tempfile
import wave
from pathlib import Path


def envelope(path: Path, hop: int = 160) -> list[float]:
    with tempfile.TemporaryDirectory() as d:
        wav = Path(d) / "a.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
        w = wave.open(str(wav)); x = array.array("h", w.readframes(w.getnframes()))
    return [math.sqrt(sum(v * v for v in x[i:i + hop]) / hop) for i in range(0, len(x) - hop, hop)]


def corr(a: list[float], b: list[float]) -> float:
    n = len(a); ma = sum(a) / n; mb = sum(b) / n
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    da = math.sqrt(sum((x - ma) ** 2 for x in a)); db = math.sqrt(sum((y - mb) ** 2 for y in b))
    return num / (da * db + 1e-9)


def main() -> None:
    args = sys.argv[1:]
    if not args or len(args) % 2:
        raise SystemExit(__doc__)
    worst = 1.0
    for clip, ref in zip(args[::2], args[1::2]):
        o, r = envelope(Path(clip)), envelope(Path(ref))
        r = r[:max(i for i, v in enumerate(r) if v > 0.05 * max(r)) + 1]   # drop the padded silence tail
        if len(o) <= len(r):
            raise SystemExit(f"{clip}: audio shorter than {ref}")
        best, at = max((corr(r, o[k:k + len(r)]), k) for k in range(len(o) - len(r)))
        verdict = "OK (wav used as-is)" if best >= 0.9 else ("CHECK by ear" if best >= 0.8 else "LOW — listen (re-voiced or mixed with SFX?)")
        print(f"{Path(clip).name}: envelope corr {best:.2f} at {at * 0.01:.2f}s — {verdict}")
        worst = min(worst, best)
    sys.exit(0 if worst >= 0.8 else 1)


if __name__ == "__main__":
    main()
