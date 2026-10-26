#!/usr/bin/env python3
"""Assemble and finish a cinematic-mode run (H3 or Wan 3.0 chapters) into one film.

The finishing that made 36_fukugyun_midnight_scare_cinematic / 37_sobaya_beer_ocean_kaiju look like a film:

  * picture: H3 (16:9, 1344x768, 24 fps) is center-cropped to 2.39:1 and lanczos-scaled to 1920x804 inside a
    1920x1080 letterbox; Wan 3.0 (already 21:9, ~2208x948, 30 fps) is kept at native resolution (no crop, no upscale).
    Both get a light grade (cooler shadows, warmer highlights), a vignette and temporal film grain.
  * score: H3/Wan write no music (non_diegetic_music: N/A), so ONE continuous score is laid here and never changes at
    chapter seams — either a licensed file (--music path) or a synthesized low drone that swells from --drone-from
    plus a sub-bass hit at each --hits chapter (a placeholder, not a real SF score).
  * ending: optional frame-accurate smash cut on the last chapter at the end of its loudest sound (--smash-last),
    then --tail-black seconds of black and silence.
  * loudness: two-pass loudnorm to -14 LUFS / -1.5 dBTP.

usage (from the repo root):
  python3 .claude/skills/no-image-video/finish_cinematic.py 03_SCRIPTS/<run> --mode h3 --chapters 9 --takes "a b a a a a a a a" \
      --hits 5,8,9 --out finals/film_h3.mp4
  python3 .claude/skills/no-image-video/finish_cinematic.py 03_SCRIPTS/<run> --mode h3 --chapters 9 --src out_v11 --suf __v11 ...
  python3 .claude/skills/no-image-video/finish_cinematic.py 03_SCRIPTS/<run> --mode wan --chapters 9 --src out_wan3 --hits 5,8,9 \
      --out finals/film_wan3.mp4

Take letters: a = chN<suf>.mp4 (default, one take per chapter), b = chNb<suf>.mp4 (only when a second seed was asked for).
For H3 the frame count of every clip is checked against its chN_workflow.json (a short clip means a failed generation).
"""
from __future__ import annotations

import argparse
import array
import json
import math
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit(f"command failed: {' '.join(cmd[:6])} …\n{p.stderr[-1500:]}")
    return p.stdout + p.stderr


def probe(path: Path, entries: str, stream: str = "v:0") -> str:
    return run(["ffprobe", "-v", "error", "-select_streams", stream, "-count_packets", "-show_entries", entries,
                "-of", "csv=p=0", str(path)]).strip().splitlines()[0]


def h3_frames(run_dir: Path, ch: str) -> int | None:
    wf = run_dir / f"{ch}_workflow.json"
    if not wf.is_file():
        return None
    g = json.load(open(wf))
    return next((int(v["inputs"]["length"]) for v in g.values()
                 if str(v.get("class_type", "")).startswith("MiniMaxH3") and "length" in v.get("inputs", {})), None)


def smash_point(wav_path: Path) -> float:
    """End of the last 10 ms window whose RMS is >= 50% of the clip's peak RMS."""
    w = wave.open(str(wav_path)); sr = w.getframerate()
    x = array.array("h", w.readframes(w.getnframes()))
    win = sr // 100
    rms = [math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, len(x) - win, win)]
    peak = max(rms) or 1
    last = max(i for i, r in enumerate(rms) if r >= 0.5 * peak)
    return min((last + 1) * 0.01, len(x) / sr)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("--mode", choices=["h3", "wan"], required=True)
    ap.add_argument("--chapters", type=int, required=True, help="number of chapters (ch1..chN)")
    ap.add_argument("--takes", default="", help='one letter per chapter, e.g. "a b a"; default all a')
    ap.add_argument("--src", default="", help="folder under the run holding the clips (default: out for h3, out_wan3 for wan)")
    ap.add_argument("--suf", default="", help="AB_LABEL suffix of LoRA A/B outputs, e.g. __v11")
    ap.add_argument("--music", default="synth", help="synth | none | path to a licensed score")
    ap.add_argument("--hits", default="", help="chapters that start with a sub-bass hit, e.g. 5,8,9 (synth score)")
    ap.add_argument("--drone-from", type=int, default=0, help="chapter where the synth drone starts (default: first hit, else 1)")
    ap.add_argument("--smash-last", action="store_true", help="smash-cut the last chapter at the end of its loudest sound")
    ap.add_argument("--tail-black", type=float, default=1.0)
    ap.add_argument("--out", required=True, help="output path, relative to the run")
    a = ap.parse_args()

    run_dir = Path(a.run_dir)
    src = run_dir / (a.src or ("out" if a.mode == "h3" else "out_wan3"))
    takes = a.takes.split() if a.takes else ["a"] * a.chapters
    if len(takes) != a.chapters or any(t not in ("a", "b") for t in takes):
        raise SystemExit(f"--takes needs {a.chapters} letters a|b")
    out = run_dir / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="finish_", dir=run_dir))
    try:
        if a.mode == "h3":
            fps, size = 24, "1344:768"
            grade = ("crop=1344:562:0:103,scale=1920:804:flags=lanczos,colorbalance=bs=0.03:rh=0.03:rm=0.01,"
                     "eq=contrast=1.06:saturation=1.03,vignette=angle=PI/6,noise=alls=6:allf=t,"
                     "pad=1920:1080:0:138:black,setsar=1")
            black_size = "1920x1080"
        else:
            first = src / f"ch1{'b' if takes[0] == 'b' else ''}{a.suf}.mp4"
            w, h = probe(first, "stream=width,height").split(",")[:2]
            w, h = int(w) // 2 * 2, int(h) // 2 * 2
            fps, size = 30, f"{w}:{h}"
            grade = "colorbalance=bs=0.02:rh=0.02,eq=contrast=1.03,vignette=angle=PI/7,noise=alls=4:allf=t,setsar=1"
            black_size = f"{w}x{h}"

        starts, t = [], 0.0
        parts = []
        for n, tk in enumerate(takes, 1):
            ch = f"ch{n}"
            clip = src / f"{ch}{'b' if tk == 'b' else ''}{a.suf}.mp4"
            if not clip.is_file():
                raise SystemExit(f"missing {clip}")
            if a.mode == "h3":
                want = h3_frames(run_dir, ch)
                got = int(probe(clip, "stream=nb_read_packets"))
                if want and got != want:
                    raise SystemExit(f"{clip.name}: {got} frames, workflow says {want} — regenerate this take")
            norm = tmp / f"{ch}.mov"
            run(["ffmpeg", "-v", "error", "-y", "-i", str(clip), "-vf", f"scale={size},setsar=1,fps={fps}",
                 "-af", "aresample=48000,aformat=channel_layouts=stereo", "-c:v", "libx264", "-crf", "12",
                 "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", str(norm)])
            if a.smash_last and n == a.chapters:
                wav = tmp / "last.wav"
                run(["ffmpeg", "-v", "error", "-y", "-i", str(norm), "-vn", "-ac", "1", "-ar", "48000", str(wav)])
                cut_t = smash_point(wav)
                frames = max(1, math.ceil(cut_t * fps))
                cut = tmp / f"{ch}_cut.mov"
                run(["ffmpeg", "-v", "error", "-y", "-i", str(norm), "-frames:v", str(frames),
                     "-af", f"atrim=0:{frames / fps},afade=t=out:st={max(0, frames / fps - 0.02)}:d=0.02",
                     "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p",
                     "-c:a", "pcm_s16le", str(cut)])
                print(f"  smash cut: {ch} at {cut_t:.2f}s ({frames} frames)")
                norm = cut
            starts.append(t)
            t += float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                            str(norm)]).strip())
            parts.append(norm)
            print(f"  {ch}: take {tk} ({clip.relative_to(run_dir)})")

        lst = tmp / "list.txt"
        lst.write_text("".join(f"file '{p.name}'\n" for p in parts))
        story = tmp / "story.mov"
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(story)])
        dur = t

        score = None
        if a.music == "synth":
            hits = [int(s) for s in a.hits.split(",") if s.strip()]
            d0 = starts[(a.drone_from or (hits[0] if hits else 1)) - 1]
            d1 = starts[hits[-2] - 1] if len(hits) >= 2 else dur
            drone = tmp / "drone.wav"
            run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                 f"aevalsrc='0.45*sin(2*PI*41.2*t)+0.3*sin(2*PI*61.7*t)+0.18*sin(2*PI*82.4*t+0.5*sin(2*PI*0.2*t))':s=48000:d={dur}",
                 "-f", "lavfi", "-i", f"anoisesrc=color=brown:amplitude=0.2:r=48000:d={dur}", "-filter_complex",
                 f"[0][1]amix=inputs=2:weights=1 0.5,lowpass=f=500,"
                 f"volume='if(lt(t,{d0}),0,min(0.22,0.04+0.18*(t-{d0})/{max(1.0, d1 - d0)}))':eval=frame,"
                 "aformat=channel_layouts=stereo[d]", "-map", "[d]", "-c:a", "pcm_s16le", str(drone)])
            inputs = [str(drone)]
            for h in hits:
                hw = tmp / f"hit{h}.wav"
                ms = int(starts[h - 1] * 1000)
                run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                     "aevalsrc='0.9*sin(2*PI*(38+40*exp(-6*t))*t)*exp(-1.6*t)':s=48000:d=3",
                     "-af", f"aformat=channel_layouts=stereo,adelay={ms}|{ms}", "-c:a", "pcm_s16le", str(hw)])
                inputs.append(str(hw))
            score = tmp / "score.wav"
            cmd = ["ffmpeg", "-v", "error", "-y"]
            for i in inputs:
                cmd += ["-i", i]
            cmd += ["-filter_complex", f"{''.join(f'[{i}]' for i in range(len(inputs)))}amix=inputs={len(inputs)}:duration=first:normalize=0",
                    "-c:a", "pcm_s16le", str(score)]
            run(cmd)
        elif a.music != "none":
            if not Path(a.music).is_file():
                raise SystemExit(f"--music file not found: {a.music}")
            score = tmp / "score.wav"
            run(["ffmpeg", "-v", "error", "-y", "-i", a.music, "-t", str(dur), "-af",
                 "aresample=48000,aformat=channel_layouts=stereo,volume=0.35", "-c:a", "pcm_s16le", str(score)])

        graded = tmp / "graded.mov"
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(story)]
        if score:
            cmd += ["-i", str(score), "-filter_complex",
                    f"[0:v]{grade}[v];[0:a][1:a]amix=inputs=2:duration=first:normalize=0[a]", "-map", "[v]", "-map", "[a]"]
        else:
            cmd += ["-vf", grade]
        run(cmd + ["-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", str(graded)])

        black = tmp / "black.mov"
        run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=black:s={black_size}:r={fps}:d={a.tail_black}",
             "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", str(a.tail_black), "-c:v", "libx264", "-crf", "14",
             "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", str(black)])
        (tmp / "list2.txt").write_text("file 'graded.mov'\nfile 'black.mov'\n")
        film = tmp / "film.mov"
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(tmp / "list2.txt"), "-c", "copy", str(film)])

        meas = run(["ffmpeg", "-hide_banner", "-i", str(film), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                    "-f", "null", "-"])
        m = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(film), "-c:v", "copy", "-af",
             f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
             f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
             "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", str(out)])
        sheet = out.with_suffix(".contact.png")
        run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-vf", "fps=1/3,scale=384:-1,tile=6x5", "-frames:v", "1", str(sheet)])
        total = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)]).strip()
        print(f"OK: {out.relative_to(run_dir)} ({float(total):.1f}s, mode={a.mode}, takes={' '.join(takes)}, music={a.music})")
        print(f"    contact sheet: {sheet.relative_to(run_dir)}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
