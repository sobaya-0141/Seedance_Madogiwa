#!/usr/bin/env python3
"""Turn a revision notebook made by build_h3_run_package.py into a Turbo-LoRA A/B notebook.

Swaps the ref2va Turbo LoRA in cell 7 (TURBO_LORA), the step count (TURBO_RECIPE steps) and sets AB_LABEL in cell 1 so
the outputs are saved as chN__<label>.mp4 — the prompts, seeds, sampler (euler/beta) and SigmaShift 12/3 stay identical
to the production package, so the LoRA is the only difference.

usage (build a separate revision first so zip / notebook / Drive output folder are unique):
  python3 .claude/skills/colab-video/build_h3_run_package.py 03_SCRIPTS/<run> --rev lora-v11 --chapters ch1,ch2,...
  python3 .claude/skills/colab-video/patch_lora_notebook.py 03_SCRIPTS/<run>/h3/<run>_h3_r2v_lora-v11.ipynb \
      --lora minimax_h3_ref2v_turbo_8step_v1.1_768p_comfyui_bf16.safetensors --steps 8 --label v11

Then append a line to h3/REVISIONS.md saying the notebook was patched. Run the A/B on the SAME GPU as the production run.
LoRA files: https://huggingface.co/lightx2v/Minimax-h3-Turbo (only ref2v_* LoRAs apply to R2V chapters; fl2v_* are I2V).
"""
import argparse
import json

DEFAULT = "minimax_h3_ref2v_turbo_8step_v1.0_768p_comfyui_bf16.safetensors"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("notebook")
    ap.add_argument("--lora", required=True)
    ap.add_argument("--steps", type=int, required=True)
    ap.add_argument("--label", required=True, help="AB_LABEL (letters, digits, - _)")
    a = ap.parse_args()
    if not a.lora.startswith("minimax_h3_ref2v_"):
        raise SystemExit("only ref2v_* LoRAs apply to R2V (ref2va) chapters")
    nb = json.load(open(a.notebook))
    done = {"lora": 0, "steps": 0, "label": 0, "note": 0}
    for c in nb["cells"]:
        s = "".join(c["source"]) if isinstance(c["source"], list) else c["source"]
        o = s
        if "TURBO_LORA = {" in s:
            s = s.replace(f'"ref2va": "{DEFAULT}"', f'"ref2va": "{a.lora}"  # LoRA A/B'); done["lora"] += s != o
            s2 = s.replace("TURBO_RECIPE = dict(steps=8,", f"TURBO_RECIPE = dict(steps={a.steps},"); done["steps"] += 1
            s = s2
        if s.startswith("#@title 1."):
            s = s.replace('AB_LABEL = ""', f'AB_LABEL = "{a.label}"', 1); done["label"] += 1
        if c["cell_type"] == "markdown" and not done["note"]:
            s = (f"**LoRA A/B（{a.lora}・{a.steps}step）**: セル7の`TURBO_LORA`（ref2va）とstepsを差し替え、成果物を"
                 f"`chN__{a.label}.mp4`として保存する。プロンプト・シード・euler/beta・SigmaShift 12/3は本番版と同一。"
                 "**本番版と同じGPUで回す**こと。\n\n") + s
            done["note"] += 1
        if s != o:
            c["source"] = s
    if not (done["lora"] and done["steps"] and done["label"]):
        raise SystemExit(f"patch incomplete {done} — the canonical h3_colab.ipynb layout changed; patch by hand")
    json.dump(nb, open(a.notebook, "w"), ensure_ascii=False, indent=1)
    print(f"patched {a.notebook}: ref2va LoRA -> {a.lora}, steps -> {a.steps}, AB_LABEL -> {a.label}")


if __name__ == "__main__":
    main()
