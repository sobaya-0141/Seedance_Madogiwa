#!/usr/bin/env python3
"""Sample the paper's colour, frame by frame, so the Remotion mask matches it.

H3 wrote a stray mark on the signature line of ch15 and ch17 even though the prompt asked for a
blank sheet, so the Remotion overlay has to paint over it before writing the name. A single fixed
colour does not work: the golden light in ch17 brightens the paper by a long way through the middle
of the shot, and a fixed patch then reads as a grey blob.

The paper is static in both shots (measured), so this samples a FIXED clean rectangle of paper next
to the signature line on every frame and writes the median colour out for the overlay to use.

usage: sample_paper_colour.py <chapter-mp4> <x0> <y0> <x1> <y1> <out.json> [first-frame]
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image


def main() -> None:
    if len(sys.argv) not in (7, 8):
        raise SystemExit(__doc__)
    video = Path(sys.argv[1])
    x0, y0, x1, y1 = (int(v) for v in sys.argv[2:6])
    out = Path(sys.argv[6])
    first = int(sys.argv[7]) if len(sys.argv) == 8 else 0

    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
         "-show_entries", "stream=width,height,nb_read_packets", "-of", "csv=p=0", str(video)],
        capture_output=True, text=True, check=True).stdout.strip().split(",")
    w, h, n = int(probe[0]), int(probe[1]), int(probe[2])
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(video), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True).stdout
    stride = w * h * 3

    colours = []
    for i in range(first, n):
        im = Image.frombytes("RGB", (w, h), raw[i * stride:(i + 1) * stride]).crop((x0, y0, x1, y1))
        chans = []
        for c in range(3):
            vals = sorted(im.getchannel(c).tobytes())
            chans.append(vals[len(vals) // 2])
        colours.append(chans)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"firstFrame": first, "sampleBox": [x0, y0, x1, y1],
                               "colours": colours}), encoding="utf-8")
    lo = min(sum(c) for c in colours) // 3
    hi = max(sum(c) for c in colours) // 3
    print(f"{video.name}: {len(colours)} frames from {first}, paper brightness {lo}..{hi} -> {out}")


if __name__ == "__main__":
    main()
