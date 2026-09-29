#!/usr/bin/env python3
"""Cross-check every chN_workflow.json against script.md's H3 inputs table.

validate_no_image_run_bundle.py checks script.md against itself and the bundled files.
This script checks the OTHER direction: that the workflow JSONs actually handed to
ComfyUI carry what the script says. The workflow build step is usually a hand-written
shell script (gen_all_workflows.sh), so a swapped sheet or a mistyped frame count
silently produces a wrong video — and with no keyframes, a swapped sheet is invisible
until the chapter comes back with the wrong face in it.

For each chapter it compares:
- the <Picture N> filenames AND their connection order (the order defines the tags used
  in the Motion prompt, so a reordering silently rebinds every tag)
- the <Audio N> filenames and order
- the declared frame count
- the prompt text, byte for byte, against chN_prompt.txt (the verbatim extract)

usage: check_workflows_match_script.py 03_SCRIPTS/<NN>_<slug>
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: check_workflows_match_script.py 03_SCRIPTS/<NN>_<slug>")
    run = Path(sys.argv[1])
    script = run / "script.md"
    if not script.is_file():
        raise SystemExit(f"missing script.md: {script}")
    text = script.read_text(encoding="utf-8")

    sections = list(re.finditer(r"^### H3 inputs \(Chapter (\d+)\)\s*$", text, re.MULTILINE))
    if not sections:
        raise SystemExit("no '### H3 inputs (Chapter N)' sections found")

    errors: list[str] = []
    for index, match in enumerate(sections):
        chapter = match.group(1)
        end = sections[index + 1].start() if index + 1 < len(sections) else len(text)
        section = text[match.start():end]
        prompt_line = re.search(r"^- Motion prompt:", section, re.MULTILINE)
        table = section[:prompt_line.start()] if prompt_line else section

        want_images = [f for _, f in re.findall(r"<Picture (\d+)>\s*=\s*`([^`]+\.png)`", table)]
        want_audio = [f for _, f in re.findall(r"<Audio (\d+)>\s*=\s*`([^`]+\.wav)`", table)]
        frames_match = re.search(r"Frames:\s*(\d+)", table)
        if frames_match is None:
            errors.append(f"Chapter {chapter}: no 'Frames: N' in the Duration line")
            continue
        want_frames = int(frames_match.group(1))

        workflow_path = run / f"ch{chapter}_workflow.json"
        if not workflow_path.is_file():
            errors.append(f"Chapter {chapter}: missing {workflow_path.name} (run the workflow build step)")
            continue
        graph = json.load(open(workflow_path, encoding="utf-8"))
        nodes = [v for v in graph.values() if v.get("class_type") == "MiniMaxH3ReferenceToVideo"]
        if len(nodes) != 1:
            errors.append(
                f"Chapter {chapter}: expected exactly one MiniMaxH3ReferenceToVideo node, found {len(nodes)} "
                "(every chapter in this skill is R2V)"
            )
            continue
        inputs = nodes[0]["inputs"]

        got_images: list[tuple[int, str]] = []
        got_audio: list[tuple[int, str]] = []
        for key, value in inputs.items():
            if key.startswith("ref_images.ref_image_"):
                got_images.append((int(key.rsplit("_", 1)[1]), graph[value[0]]["inputs"]["image"]))
            elif key.startswith("ref_audios.ref_audio_"):
                got_audio.append((int(key.rsplit("_", 1)[1]), graph[value[0]]["inputs"]["audio"]))
        got_images_ordered = [f for _, f in sorted(got_images)]
        got_audio_ordered = [f for _, f in sorted(got_audio)]

        if got_images_ordered != want_images:
            errors.append(
                f"Chapter {chapter}: <Picture N> mismatch — script says {want_images}, "
                f"workflow wires {got_images_ordered} (order matters: it defines the tags in the prompt)"
            )
        if got_audio_ordered != want_audio:
            errors.append(
                f"Chapter {chapter}: <Audio N> mismatch — script says {want_audio}, "
                f"workflow wires {got_audio_ordered}"
            )
        if inputs.get("length") != want_frames:
            errors.append(
                f"Chapter {chapter}: frame count mismatch — script says {want_frames}, "
                f"workflow has {inputs.get('length')}"
            )

        extract_path = run / f"ch{chapter}_prompt.txt"
        if not extract_path.is_file():
            errors.append(f"Chapter {chapter}: missing {extract_path.name} (run extract_prompts.py)")
        elif inputs.get("prompt", "").strip() != extract_path.read_text(encoding="utf-8").strip():
            errors.append(
                f"Chapter {chapter}: the prompt inside {workflow_path.name} differs from {extract_path.name} "
                "(prompts must be verbatim — rebuild the workflow instead of editing it)"
            )

    if errors:
        for message in errors:
            print(f"ERROR: {message}", file=sys.stderr)
        raise SystemExit(1)
    print(f"OK: {len(sections)} workflows match script.md (pictures, audio, frames, verbatim prompts)")


if __name__ == "__main__":
    main()
