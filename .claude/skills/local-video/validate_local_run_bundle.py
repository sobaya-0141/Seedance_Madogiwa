#!/usr/bin/env python3
"""Validate that a local (MiniMax H3) run is a portable, self-contained input bundle.

Checks every '### H3 inputs (Chapter N)' section in script.md:
- all declared PNG/WAV files exist in the run directory as physical files (basenames only)
- R2V chapters stay within H3's input limits (<=9 pictures, <=3 audio, <=12 files total)
- every Motion prompt redeclares its attachments via 'Required attached input files:'
- every Motion prompt ends with sound-design lines ('Soundscape:' and 'Music:')
- a '## Style block' section exists and every Motion prompt contains its one-line style lock verbatim
- a '## Camera plan' section exists and every Motion prompt contains a camera direction
- I2V chapters declare First/Last frame files
- script.md does not reference paths outside the run directory
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


def fail(messages: list[str]) -> None:
    for message in messages:
        print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def check_bundled(run_dir: Path, chapter: str, label: str, filename: str, errors: list[str]) -> None:
    if Path(filename).name != filename:
        errors.append(f"Chapter {chapter}: {label} must use a bundled basename, not a path: {filename}")
        return
    bundled = run_dir / filename
    if not bundled.is_file():
        errors.append(f"Chapter {chapter}: missing bundled file: {filename}")
    elif bundled.is_symlink():
        errors.append(f"Chapter {chapter}: must be a physical file, not a symlink: {filename}")


def main() -> None:
    if len(sys.argv) != 2:
        fail(["usage: validate_local_run_bundle.py 03_SCRIPTS/<NN>_<slug>"])

    run_dir = Path(sys.argv[1])
    script_path = run_dir / "script.md"
    errors: list[str] = []

    if not run_dir.is_dir():
        fail([f"run directory does not exist: {run_dir}"])
    if not script_path.is_file():
        fail([f"missing script.md: {script_path}"])

    text = script_path.read_text(encoding="utf-8")
    if re.search(r"(?:\.\./)+(?:02_CHARACTERS|03_SCRIPTS)/", text):
        errors.append("script.md references files outside the run; copy them into the run and use basenames")

    if re.search(r"^##.*\bCamera plan\b", text, re.MULTILINE | re.IGNORECASE) is None:
        errors.append(
            "script.md lacks a '## Camera plan' section "
            "(shot list across all chapters: shot size & angle, camera move as type + amplitude + speed, "
            "and join type per chapter; prevents a whole run of identical locked-off shots)"
        )

    style_block = ""
    style_header = re.search(r"^##.*\bStyle block\b.*$", text, re.MULTILINE | re.IGNORECASE)
    if style_header is None:
        errors.append(
            "script.md lacks a '## Style block' section "
            "(one-line art-style lock, repeated verbatim in every keyframe prompt and Motion prompt; "
            "prevents the art style drifting between anime and photoreal across the run)"
        )
    else:
        for line in text[style_header.end():].splitlines():
            stripped = line.strip().lstrip("-").strip()
            if stripped.startswith("#"):
                break
            if stripped:
                style_block = stripped
                break
        if not style_block:
            errors.append("'## Style block' section is empty; write the one-line style lock under the header")

    sections = list(re.finditer(r"^### H3 inputs \(Chapter (\d+)\)\s*$", text, re.MULTILINE))
    if not sections:
        errors.append("no '### H3 inputs (Chapter N)' sections found")

    for index, match in enumerate(sections):
        chapter = match.group(1)
        end = sections[index + 1].start() if index + 1 < len(sections) else len(text)
        section = text[match.start():end]

        mode_match = re.search(r"^- Mode:\s*(R2V|I2V)\s*$", section, re.MULTILINE)
        if mode_match is None:
            errors.append(f"Chapter {chapter}: missing '- Mode: R2V|I2V'")
            continue
        mode = mode_match.group(1)

        prompt_marker = section.find("- Motion prompt:")
        if prompt_marker < 0:
            errors.append(f"Chapter {chapter}: missing Motion prompt")
            prompt = ""
            input_table = section
        else:
            prompt = section[prompt_marker:]
            input_table = section[:prompt_marker]

        if re.search(r"^- Duration:", section, re.MULTILINE) is None:
            errors.append(f"Chapter {chapter}: missing Duration line")

        if prompt and re.search(r"\bcamera\b", prompt, re.IGNORECASE) is None:
            errors.append(
                f"Chapter {chapter}: Motion prompt lacks a camera direction "
                '(write this chapter\'s Camera plan row as type + amplitude + speed, e.g. "the camera '
                'pushes in with small amplitude at slow speed", or "locked-off static camera" for an '
                "intentionally static shot — with no camera direction the model moves the camera at random)"
            )

        for field in ("Soundscape:", "Music:"):
            if prompt and field not in prompt:
                errors.append(
                    f"Chapter {chapter}: Motion prompt lacks '{field}' "
                    "(sound design rule: end every Motion prompt with a Soundscape line for ambient/action "
                    'sounds and a Music line — default "Music: no background music")'
                )

        if prompt and style_block and style_block not in prompt:
            errors.append(
                f"Chapter {chapter}: Motion prompt lacks the verbatim Style block line "
                "(copy the one-line style lock from '## Style block' into every Motion prompt; "
                "paraphrasing it re-enables style drift)"
            )

        if mode == "I2V":
            for label in ("First frame", "Last frame"):
                declaration = re.search(rf"^- {label}:\s*`([^`\n]+)`", input_table, re.MULTILINE)
                if declaration is None:
                    errors.append(f"Chapter {chapter}: I2V chapter missing {label} declaration")
                else:
                    check_bundled(run_dir, chapter, label, declaration.group(1), errors)
            continue

        pictures = re.findall(r"<Picture (\d+)>\s*=\s*`([^`]+\.png)`", input_table)
        audios = re.findall(r"<Audio (\d+)>\s*=\s*`([^`]+\.wav)`", input_table)
        videos = re.findall(r"<Video (\d+)>\s*=\s*`([^`]+)`", input_table)

        if not pictures:
            errors.append(f"Chapter {chapter}: R2V chapter declares no <Picture N> images")
        if len(pictures) > 9:
            errors.append(f"Chapter {chapter}: {len(pictures)} pictures exceeds H3's limit of 9")
        if len(audios) > 3:
            errors.append(f"Chapter {chapter}: {len(audios)} audio files exceeds H3's limit of 3")
        total = len(pictures) + len(audios) + len(videos)
        if total > 12:
            errors.append(f"Chapter {chapter}: {total} input files exceeds H3's limit of 12")

        for tag, mappings in (("Picture", pictures), ("Audio", audios), ("Video", videos)):
            for slot, filename in mappings:
                check_bundled(run_dir, chapter, f"<{tag} {slot}>", filename, errors)
                if f"<{tag} {slot}> = {filename}" not in prompt:
                    errors.append(
                        f"Chapter {chapter}: Motion prompt does not redeclare '<{tag} {slot}> = {filename}'"
                    )
        if (pictures or audios) and "Required attached input files:" not in prompt:
            errors.append(f"Chapter {chapter}: Motion prompt lacks 'Required attached input files:'")

    if errors:
        fail(errors)
    print(f"OK: portable local-video (MiniMax H3) bundle validated: {run_dir}")


if __name__ == "__main__":
    main()
