#!/usr/bin/env python3
"""Check an official-format (six-section Ref2VA) H3 run before packaging.

usage: python3 .claude/skills/no-image-video/check_ref2va_bundle.py 03_SCRIPTS/<NN>_<slug>

Used by the cinematic mode of /no-image-video (prompts in the official six-section Ref2VA format, embedded verbatim
in script.md inside ```text blocks) instead of validate_no_image_run_bundle.py, which checks the legacy one-line format.

For every chN*_workflow.json:
- the workflow prompt is byte-identical to chN*_prompt.txt, and that prompt is embedded verbatim in script.md
- the prompt has the six Ref2VA sections in the official order
- every <Picture N> / <Audio N> label used in the prompt is wired (N <= attached count) and every attachment is used
- attached files exist as physical files in the run; <=9 images, <=3 audio, <=12 total; wavs 2.0-15.0 s
- frames sit on H3's 17k+5 grid (90..362) and every '[Shot N] At MM:SS.mmm' cut is increasing and inside the duration
"""
from __future__ import annotations

import glob
import json
import os
import re
import sys
import wave

SECTIONS = ["subject_definitions:", "summary:", "retention_analysis:", "detailed_description:",
            "overall_soundscape:", "non_diegetic_music:"]


def main() -> None:
    run = sys.argv[1].rstrip("/")
    script = open(os.path.join(run, "script.md"), encoding="utf-8").read()
    errors: list[str] = []
    wfs = sorted(glob.glob(os.path.join(run, "ch*_workflow.json")))
    if not wfs:
        raise SystemExit(f"{run}: no ch*_workflow.json")
    for wf in wfs:
        ch = os.path.basename(wf)[: -len("_workflow.json")]
        g = json.load(open(wf))
        node = next(v for v in g.values() if v["class_type"].startswith("MiniMaxH3"))
        ins = node["inputs"]
        prompt = ins["prompt"]
        pf = os.path.join(run, f"{ch}_prompt.txt")
        if not os.path.isfile(pf) or open(pf, encoding="utf-8").read().strip() != prompt:
            errors.append(f"{ch}: workflow prompt differs from {ch}_prompt.txt")
        if prompt.strip() not in script:
            errors.append(f"{ch}: prompt is not embedded verbatim in script.md")
        pos = [prompt.find(s) for s in SECTIONS]
        if min(pos) < 0 or pos != sorted(pos):
            errors.append(f"{ch}: six Ref2VA sections missing or out of order")
        frames = int(ins["length"])
        if frames % 17 != 5 or not 90 <= frames <= 362:
            errors.append(f"{ch}: frames {frames} not on the 17k+5 grid")
        dur = frames / 24
        cuts = [int(m) * 60 + float(s) for m, s in re.findall(r"\[Shot \d+\] At (\d\d):(\d\d\.\d{3})", prompt)]
        if cuts != sorted(cuts) or (cuts and cuts[-1] >= dur):
            errors.append(f"{ch}: shot cut times {cuts} not increasing within {dur:.2f}s")
        imgs = [g[ins[k][0]]["inputs"]["image"] for k in sorted(ins) if k.startswith("ref_images.")]
        auds = [g[ins[k][0]]["inputs"]["audio"] for k in sorted(ins) if k.startswith("ref_audios.")]
        if len(imgs) > 9 or len(auds) > 3 or len(imgs) + len(auds) > 12:
            errors.append(f"{ch}: input limits exceeded ({len(imgs)} images, {len(auds)} audio)")
        for tag, files in (("Picture", imgs), ("Audio", auds)):
            used = {int(n) for n in re.findall(rf"<{tag} (\d+)>", prompt)}
            if used != set(range(1, len(files) + 1)):
                errors.append(f"{ch}: <{tag} N> labels used {sorted(used)} but {len(files)} attached")
        for f in imgs + auds:
            p = os.path.join(run, f)
            if not os.path.isfile(p) or os.path.islink(p):
                errors.append(f"{ch}: missing physical file {f}")
        for f in auds:
            p = os.path.join(run, f)
            if os.path.isfile(p):
                with wave.open(p) as w:
                    s = w.getnframes() / w.getframerate()
                if not 2.0 - 1e-3 <= s <= 15.0 + 1e-3:
                    errors.append(f"{ch}: {f} is {s:.2f}s (needs 2.0-15.0s)")
        words = len(prompt.split("detailed_description:")[1].split("overall_soundscape:")[0].split())
        print(f"{ch}: {frames}f ({dur:.2f}s) seed={next(v for v in g.values() if v['class_type']=='RandomNoise')['inputs']['noise_seed']}"
              f" images={imgs} audio={auds} cuts={cuts} detailed_description={words} words")
    if errors:
        for e in errors:
            print("ERROR:", e, file=sys.stderr)
        raise SystemExit(1)
    print(f"OK: {len(wfs)} workflows checked: {run}")


if __name__ == "__main__":
    main()
