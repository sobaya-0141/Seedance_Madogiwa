#!/usr/bin/env python3
"""Build a MiniMax H3 API-format workflow JSON for one chapter.

Wiring is taken from ComfyUI's official local templates (video_minimax_h3_r2v.json /
video_minimax_h3_i2v.json), converted to API format and then parameterized. Two
corrections vs. the shipped template, both required here:
  * CLIPLoader uses a GPU-appropriate text encoder instead of the template's hardcoded
    nvfp4_awq (which only runs natively on Blackwell). Override with --encoder.
  * width/height/length are set literally instead of via ResolutionSelector +
    ComfyMathExpression, so the frame count matches script.md exactly.

usage:
  build_h3_workflow.py --mode i2v --out ch1_workflow.json --prompt-file p.txt \
      --frames 294 --first ch1_start.png --last ch1_end.png [--width 1344 --height 768]
  build_h3_workflow.py --mode r2v --out ch8_workflow.json --prompt-file p.txt \
      --frames 124 --image ch8_start.png --image ch8_end.png --image Fukuchan_sheet.png \
      --audio ch8_line1_fukuchan.wav
"""
from __future__ import annotations

import argparse
import json

ENCODER = "qwen3vl_32b_minimax_h3_int8_convrot.safetensors"
UNET_I2V = "minimax_h3_fl2va_pruned_int8_convrot.safetensors"
UNET_R2V = "minimax_h3_ref2va_pruned_int8_convrot.safetensors"
VIDEO_VAE = "minimax_h3_video_vae_fp16.safetensors"
AUDIO_VAE = "minimax_h3_audio_vae_fp32.safetensors"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["i2v", "r2v"], required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--prompt-file", required=True)
    ap.add_argument("--frames", type=int, required=True)
    ap.add_argument("--width", type=int, default=1344)
    ap.add_argument("--height", type=int, default=768)
    ap.add_argument("--steps", type=int, default=20)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--prefix", default="video/MiniMax_H3")
    ap.add_argument("--first")
    ap.add_argument("--last")
    ap.add_argument("--image", action="append", default=[])
    ap.add_argument("--audio", action="append", default=[])
    ap.add_argument("--ref-image-size", default="match", choices=["match", "max"])
    # Weights differ by GPU architecture — see RUNBOOK.md. Defaults are the INT8
    # pair, which works on any CUDA card with INT8 tensor cores (Ampere and newer).
    ap.add_argument("--encoder", default=ENCODER)
    ap.add_argument("--unet-i2v", default=UNET_I2V)
    ap.add_argument("--unet-r2v", default=UNET_R2V)
    a = ap.parse_args()

    if a.frames % 17 != 5:
        raise SystemExit(f"--frames {a.frames} is not on H3's 17k+5 grid (e.g. 90, 124, 294)")
    if a.mode == "r2v":
        if not a.image:
            raise SystemExit("r2v needs at least one --image")
        if len(a.image) > 9:
            raise SystemExit(f"{len(a.image)} images exceeds H3's limit of 9")
        if len(a.audio) > 3:
            raise SystemExit(f"{len(a.audio)} audio files exceeds H3's limit of 3")
        if len(a.image) + len(a.audio) > 12:
            raise SystemExit("more than 12 total input files")
    else:
        if not (a.first and a.last):
            raise SystemExit("i2v needs --first and --last")

    prompt = open(a.prompt_file, encoding="utf-8").read().strip()

    g: dict[str, dict] = {
        "119": {"class_type": "VAELoader", "inputs": {"vae_name": VIDEO_VAE}},
        "120": {"class_type": "VAELoader", "inputs": {"vae_name": AUDIO_VAE}},
        "127": {"class_type": "UNETLoader", "inputs": {
            "unet_name": a.unet_i2v if a.mode == "i2v" else a.unet_r2v,
            "weight_dtype": "default"}},
        "128": {"class_type": "CLIPLoader", "inputs": {
            "clip_name": a.encoder, "type": "minimax", "device": "default"}},
        "129": {"class_type": "RandomNoise", "inputs": {"noise_seed": a.seed}},
        "123": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "res_multistep"}},
        "124": {"class_type": "BasicScheduler", "inputs": {
            "model": ["127", 0], "scheduler": "simple", "steps": a.steps, "denoise": 1}},
        "126": {"class_type": "BasicGuider", "inputs": {
            "model": ["127", 0], "conditioning": ["136", 0]}},
        "125": {"class_type": "SamplerCustomAdvanced", "inputs": {
            "noise": ["129", 0], "guider": ["126", 0], "sampler": ["123", 0],
            "sigmas": ["124", 0], "latent_image": ["136", 1]}},
        "122": {"class_type": "VAEDecode", "inputs": {"samples": ["125", 0], "vae": ["119", 0]}},
        "121": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["125", 0], "vae": ["120", 0]}},
        "130": {"class_type": "CreateVideo", "inputs": {
            "images": ["122", 0], "audio": ["121", 0], "fps": 24, "bit_depth": 8}},
        "92": {"class_type": "SaveVideo", "inputs": {
            # codecはComfyUI新版(2026-08頃〜)で必須。旧版(v0.30)は未知の入力を無視するので常に付けてよい
            "video": ["130", 0], "filename_prefix": a.prefix, "format": "auto", "codec": "auto"}},
    }

    cond: dict = {
        "clip": ["128", 0],
        "vae": ["119", 0],
        "prompt": prompt,
        "width": a.width,
        "height": a.height,
        "length": a.frames,
    }

    nid = 200
    if a.mode == "i2v":
        g[str(nid)] = {"class_type": "LoadImage", "inputs": {"image": a.first}}
        cond["first_frame"] = [str(nid), 0]
        nid += 1
        g[str(nid)] = {"class_type": "LoadImage", "inputs": {"image": a.last}}
        cond["last_frame"] = [str(nid), 0]
        nid += 1
        g["136"] = {"class_type": "MiniMaxH3ImageToVideo", "inputs": cond}
    else:
        cond["audio_vae"] = ["120", 0]
        cond["ref_image_size"] = a.ref_image_size
        # Autogrow inputs are addressed by their dotted slot names, 0-indexed.
        # Connection order defines the <Picture i> / <Audio j> tags in the prompt.
        for i, img in enumerate(a.image):
            g[str(nid)] = {"class_type": "LoadImage", "inputs": {"image": img}}
            cond[f"ref_images.ref_image_{i}"] = [str(nid), 0]
            nid += 1
        for j, aud in enumerate(a.audio):
            g[str(nid)] = {"class_type": "LoadAudio", "inputs": {"audio": aud}}
            cond[f"ref_audios.ref_audio_{j}"] = [str(nid), 0]
            nid += 1
        g["136"] = {"class_type": "MiniMaxH3ReferenceToVideo", "inputs": cond}

    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(g, fh, ensure_ascii=False, indent=2)

    secs = a.frames / 24
    print(f"wrote {a.out}: mode={a.mode} {a.width}x{a.height} "
          f"{a.frames}f ({secs:.3f}s @24fps) steps={a.steps} seed={a.seed}")
    if a.mode == "r2v":
        for i, img in enumerate(a.image):
            print(f"  <Picture {i+1}> = {img}")
        for j, aud in enumerate(a.audio):
            print(f"  <Audio {j+1}> = {aud}")
    else:
        print(f"  first_frame = {a.first}\n  last_frame  = {a.last}")


if __name__ == "__main__":
    main()
