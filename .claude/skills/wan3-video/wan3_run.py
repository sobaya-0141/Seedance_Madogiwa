#!/usr/bin/env python3
"""Generate a run's chapters with Wan 3.0 (Alibaba Cloud Model Studio, reference mode).

  python3 .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch1,ch2 --estimate   # cost only, sends nothing
  python3 .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch1 --dry-run        # show the request
  python3 .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch1 --yes            # create, poll, download
  python3 .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch3 --yes \\
      --audio-url "ch3=https://drive.google.com/uc?export=download&id=<file id>"
  python3 .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch1 --task-id <id>    # resume polling (no new charge)

Inputs per chapter, in this order of precedence:
  1. <run>/wan3_inputs.json  {"ch1": {"images": ["A_sheet.png", ...], "audio": ["ch1_line1_x.wav"], "seconds": 10}, ...}
     (a Wan-only run — no H3 workflows exist)
  2. <run>/chN_workflow.json  (an H3 run: the same sheets and wavs in the same connection order, seconds = H3 length rounded)
The prompt is always <run>/chN_prompt.txt — the six-section Ref2VA prompt shared with H3:
  * <Picture N> / <Audio N> are rewritten to Wan's "Image N" / "Audio N" (media array order = same numbering)
  * the H3-only "…for a 2.39:1 extraction." sentence is dropped (Wan renders 21:9 natively)
  * prompt_extend=false (Wan must not rewrite the prompt), watermark=false, audio=true

Images go as base64 data URIs. Audio must be a public URL (the API takes no base64 audio) — see drive_audio_url.py.
Sending costs money (about $0.20 per output second at 1080P, 2026-10 third-party figure — check "View Cost"), so a real
send requires --yes; get the user's OK on the --estimate output first. Result URLs expire after 24 h; this script
downloads at once to <run>/out_wan3/<name>.mp4 and writes <name>_task.json next to it.
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wan3_common import SETUP_HELP, api_base, call, env  # noqa: E402

USD_PER_SECOND = {"1080P": 0.20, "720P": 0.10, "480P": 0.05}   # rough; 720P/480P are guesses — confirm in the console
DROP = re.compile(r"\s*Key subjects are kept inside the central horizontal band of the frame for a 2\.39:1 extraction\.")


def chapter_inputs(run: Path, ch: str) -> tuple[str, list[str], list[str], int]:
    prompt = (run / f"{ch}_prompt.txt").read_text(encoding="utf-8").strip()
    manifest = run / "wan3_inputs.json"
    if manifest.is_file():
        spec = json.load(open(manifest)).get(ch)
        if spec is None:
            raise SystemExit(f"{ch}: not in wan3_inputs.json")
        return prompt, spec.get("images", []), spec.get("audio", []), int(spec["seconds"])
    wf = run / f"{ch}_workflow.json"
    if not wf.is_file():
        raise SystemExit(f"{ch}: neither wan3_inputs.json nor {ch}_workflow.json exists")
    g = json.load(open(wf))
    ins = next(v for v in g.values() if v["class_type"].startswith("MiniMaxH3"))["inputs"]
    key = lambda k: int(re.sub(r"\D", "", k) or 0)  # noqa: E731  ref_image_10 after ref_image_9
    imgs = [g[ins[k][0]]["inputs"]["image"] for k in sorted((k for k in ins if k.startswith("ref_images.")), key=key)]
    auds = [g[ins[k][0]]["inputs"]["audio"] for k in sorted((k for k in ins if k.startswith("ref_audios.")), key=key)]
    if prompt != ins["prompt"]:
        raise SystemExit(f"{ch}: {ch}_prompt.txt differs from {ch}_workflow.json — rebuild the H3 workflows first")
    return prompt, imgs, auds, max(2, min(30, round(int(ins["length"]) / 24)))


def convert(prompt: str) -> str:
    p = DROP.sub("", prompt)
    p = re.sub(r"<Picture (\d+)>", r"Image \1", p)
    return re.sub(r"<Audio (\d+)>", r"Audio \1", p)


def data_uri(path: Path) -> str:
    mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
            ".bmp": "image/bmp"}[path.suffix.lower()]
    if path.stat().st_size > 20 * 2**20:
        raise SystemExit(f"{path.name}: over 20 MB (Wan limit per reference image)")
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("run_dir")
    ap.add_argument("--chapters", required=True, help="comma separated, e.g. ch1,ch2")
    ap.add_argument("--model", default="wan3.0-video", choices=["wan3.0-video", "wan3.0-video-prime"])
    ap.add_argument("--resolution", default="1080P", choices=["1080P", "720P", "480P"])
    ap.add_argument("--ratio", default="21:9", choices=["21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "adaptive"])
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--label", default="", help="output suffix, e.g. s1234 -> ch1__s1234.mp4 (second take)")
    ap.add_argument("--audio-url", action="append", default=[], help="chN=https://... public URL of that chapter's wav")
    ap.add_argument("--estimate", action="store_true", help="print the cost estimate and exit")
    ap.add_argument("--dry-run", action="store_true", help="show what would be sent and exit")
    ap.add_argument("--yes", action="store_true", help="really send (this is billed)")
    ap.add_argument("--task-id", default="", help="resume polling an existing task (one chapter) — no new charge")
    ap.add_argument("--poll", type=int, default=15)
    a = ap.parse_args()

    run = Path(a.run_dir)
    chapters = [c.strip() for c in a.chapters.split(",") if c.strip()]
    audio_urls = dict(s.split("=", 1) for s in a.audio_url)
    plans = []
    for ch in chapters:
        prompt, imgs, auds, secs = chapter_inputs(run, ch)
        if len(imgs) > 10 or len(auds) > 5:
            raise SystemExit(f"{ch}: Wan takes at most 10 reference images and 5 audio clips")
        for f in imgs + auds:
            if not (run / f).is_file():
                raise SystemExit(f"{ch}: missing {f}")
        plans.append((ch, prompt, imgs, auds, secs))
    total = sum(p[4] for p in plans)
    usd = total * USD_PER_SECOND[a.resolution]
    for ch, _p, imgs, auds, secs in plans:
        print(f"{ch}: {secs}s  images={len(imgs)}  audio={auds or '-'}")
    print(f"total {total}s at {a.resolution} ≈ ${usd:.2f} (estimate — confirm in Model Studio > View Cost)")
    if a.estimate:
        return

    key, base = env("DASHSCOPE_API_KEY"), api_base()
    if not a.dry_run and (not key or not base):
        print(SETUP_HELP)
        sys.exit(1)
    if not (a.dry_run or a.yes or a.task_id):
        raise SystemExit("this sends billed requests — show the estimate to the user, then rerun with --yes")
    if a.task_id and len(plans) != 1:
        raise SystemExit("--task-id resumes exactly one chapter")

    out_dir = run / "out_wan3"
    out_dir.mkdir(exist_ok=True)
    for ch, prompt, imgs, auds, secs in plans:
        media = [{"type": "reference_image", "url": data_uri(run / f)} for f in imgs]
        if auds:
            if ch not in audio_urls:
                raise SystemExit(f"{ch}: needs --audio-url {ch}=<public URL of {auds[0]}> (no base64 audio in the API)")
            media.append({"type": "reference_audio", "url": audio_urls[ch]})
        text = convert(prompt)
        body = {"model": a.model, "input": {"prompt": text, "media": media},
                "parameters": {"resolution": a.resolution, "ratio": a.ratio, "duration": secs, "audio": True,
                               "seed": a.seed, "prompt_extend": False, "watermark": False}}
        name = f"{ch}__{a.label}" if a.label else ch
        print(f"{name}: {a.model} {a.resolution} {a.ratio} {secs}s seed={a.seed} images={imgs} audio={auds}", flush=True)
        if a.dry_run:
            print("  (dry run) prompt head:", text[:200].replace("\n", " "), "…")
            continue
        if a.task_id:
            task = a.task_id
        else:
            res = call("POST", f"{base}/services/aigc/video-generation/video-synthesis", key, body)
            task = res.get("output", {}).get("task_id")
            if not task:
                raise SystemExit(f"{ch}: no task_id: {json.dumps(res)[:800]}")
        print(f"  task {task} {'resumed' if a.task_id else 'created'} — resume with --task-id {task} if this stops", flush=True)
        t0 = time.time()
        while True:
            time.sleep(a.poll)
            st = call("GET", f"{base}/tasks/{task}", key)
            status = st.get("output", {}).get("task_status")
            if status in ("SUCCEEDED", "FAILED", "CANCELED", "UNKNOWN"):
                break
        (out_dir / f"{name}_task.json").write_text(json.dumps(st, ensure_ascii=False, indent=1), encoding="utf-8")
        if status != "SUCCEEDED":
            raise SystemExit(f"{ch}: task {status} after {int(time.time() - t0)}s: "
                             f"{json.dumps(st.get('output', {}), ensure_ascii=False)[:800]}")
        urllib.request.urlretrieve(st["output"]["video_url"], out_dir / f"{name}.mp4")   # URL expires in 24 h
        print(f"  SUCCEEDED in {int(time.time() - t0)}s -> out_wan3/{name}.mp4  usage={st.get('usage')}", flush=True)


if __name__ == "__main__":
    main()
