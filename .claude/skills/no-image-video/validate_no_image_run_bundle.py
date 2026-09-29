#!/usr/bin/env python3
"""Validate a no-image (keyframe-less) MiniMax H3 R2V run bundle.

This validator is specific to the /no-image-video skill. Unlike the seedance /
local-video validators it does NOT require a global verbatim Style block: every
chapter carries its own minimal style line, and the check here is that a
chapter's Motion prompt only talks about the characters that are actually in
that chapter (the "- Cast:" line).

Checks:
- chapter_plan.md exists, every '## Chapter N' section is '- Status: APPROVED', and the
  chapter numbers match the '### H3 inputs (Chapter N)' sections in script.md
- every 'Mob_<slug>_sheet.png' referenced by script.md is marked APPROVED in chapter_plan.md
- script.md references NO keyframes (chN_start.png / chN_end.png) and no paths outside the run
- '## Character references', '## Scene ledger' and '## Camera plan' sections exist
- every chapter is '- Mode: R2V' and has a '- Cast:' line
- every <Picture N> is a character sheet (*_sheet.png) or height_lineup.png, exists as a
  physical file, and belongs to a character listed in that chapter's Cast; every Cast member
  has their sheet attached
- R2V input limits: <=9 pictures, <=3 audio, <=12 files; every wav is 2.0-15.0 s
- '- Duration:' declares 'Frames: N' on H3's 17k+5 grid (90..362)
- the Motion prompt redeclares every attachment, and contains the mandatory phrases:
  'Required attached input files:', 'NOT a composition reference',
  'None of the attached pictures is a frame of this video', a camera direction,
  'EXACTLY ONCE', 'on-screen text', 'Soundscape:' and 'Music:'
- dialogue chapters (audio attached) use '(S1)', '<d>[Japanese]' and 'AS-IS';
  silent chapters say 'no speech' / 'no dialogue'
- the Motion prompt never names a canon character who is NOT in the chapter's Cast
  (this is what stops "Yametaro remains a chibi figure" leaking into a Sobaya-only chapter)
"""

from __future__ import annotations

import re
import sys
import wave
from pathlib import Path

CANON = ["Sobaya", "Takosan", "Tokun", "Yotan", "Fukuchan", "Yametaro", "Okayaman", "Yumemin"]
SCALE_REF = "height_lineup.png"
MIN_FRAMES, MAX_FRAMES = 90, 362
REQUIRED_PHRASES = [
    "Required attached input files:",
    "NOT a composition reference",
    "None of the attached pictures is a frame of this video",
    "EXACTLY ONCE",
    "on-screen text",
    "Soundscape:",
    "Music:",
]


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


def wav_seconds(path: Path) -> float | None:
    try:
        with wave.open(str(path), "rb") as w:
            return w.getnframes() / float(w.getframerate())
    except Exception:
        return None


def parse_chapter_plan(plan_path: Path, errors: list[str]) -> tuple[dict[int, str], str]:
    text = plan_path.read_text(encoding="utf-8")
    heads = list(re.finditer(r"^## Chapter (\d+)\b.*$", text, re.MULTILINE))
    statuses: dict[int, str] = {}
    if not heads:
        errors.append("chapter_plan.md has no '## Chapter N' sections")
    for i, m in enumerate(heads):
        n = int(m.group(1))
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        body = text[m.end():end]
        # stop at the next H2 that is not a chapter (e.g. '## モブキャラクター')
        h2 = re.search(r"^## ", body, re.MULTILINE)
        if h2:
            body = body[:h2.start()]
        s = re.search(r"^- Status:\s*(\S+)", body, re.MULTILINE)
        statuses[n] = s.group(1) if s else "MISSING"
        if statuses[n] != "APPROVED":
            errors.append(
                f"chapter_plan.md: Chapter {n} is '{statuses[n]}', not APPROVED — "
                "get the user's confirmation of this chapter's movement first; "
                "prompts must not be written before every chapter is APPROVED"
            )
    return statuses, text


def main() -> None:
    if len(sys.argv) != 2:
        fail(["usage: validate_no_image_run_bundle.py 03_SCRIPTS/<NN>_<slug>"])

    run_dir = Path(sys.argv[1])
    script_path = run_dir / "script.md"
    plan_path = run_dir / "chapter_plan.md"
    errors: list[str] = []

    if not run_dir.is_dir():
        fail([f"run directory does not exist: {run_dir}"])
    if not script_path.is_file():
        fail([f"missing script.md: {script_path}"])
    if not plan_path.is_file():
        fail([f"missing chapter_plan.md: {plan_path} (the human-approved chapter plan is required)"])

    plan_statuses, plan_text = parse_chapter_plan(plan_path, errors)
    text = script_path.read_text(encoding="utf-8")

    if re.search(r"(?:\.\./)+(?:02_CHARACTERS|03_SCRIPTS)/", text):
        errors.append("script.md references files outside the run; copy them into the run and use basenames")
    if re.search(r"\bch\d+_(?:start|end)\.png\b", text):
        errors.append(
            "script.md references keyframes (chN_start.png / chN_end.png). This is the no-image skill: "
            "no keyframes are generated or attached — only character sheets and audio"
        )
    for section in ("Character references", "Scene ledger", "Camera plan"):
        if re.search(rf"^##.*\b{section}\b", text, re.MULTILINE | re.IGNORECASE) is None:
            errors.append(f"script.md lacks a '## {section}' section")

    # every mob sheet used anywhere in script.md must be user-approved in chapter_plan.md
    for mob_sheet in sorted(set(re.findall(r"\bMob_[a-z0-9_]+_sheet\.png\b", text))):
        approved = any(
            mob_sheet in line and "APPROVED" in line for line in plan_text.splitlines()
        )
        if not approved:
            errors.append(
                f"{mob_sheet} is not marked APPROVED in chapter_plan.md "
                "(write '- Mob_<slug>_sheet.png — ... — Sheet: APPROVED' after the user approved the sheet)"
            )

    sections = list(re.finditer(r"^### H3 inputs \(Chapter (\d+)\)\s*$", text, re.MULTILINE))
    if not sections:
        errors.append("no '### H3 inputs (Chapter N)' sections found")
    script_numbers = sorted(int(m.group(1)) for m in sections)
    if plan_statuses and script_numbers and sorted(plan_statuses) != script_numbers:
        errors.append(
            f"chapter numbers differ: chapter_plan.md has {sorted(plan_statuses)}, "
            f"script.md has {script_numbers}"
        )

    for index, match in enumerate(sections):
        chapter = match.group(1)
        end = sections[index + 1].start() if index + 1 < len(sections) else len(text)
        section = text[match.start():end]

        mode_match = re.search(r"^- Mode:\s*(\S+)\s*$", section, re.MULTILINE)
        if mode_match is None or mode_match.group(1) != "R2V":
            errors.append(f"Chapter {chapter}: mode must be '- Mode: R2V' (every no-image chapter is R2V)")

        cast_match = re.search(r"^- Cast:\s*(.+)$", section, re.MULTILINE)
        cast: list[str] = []
        if cast_match is None:
            errors.append(f"Chapter {chapter}: missing '- Cast:' line (on-screen characters of this chapter)")
        else:
            cast = [c.strip() for c in cast_match.group(1).split(",") if c.strip()]
            for c in cast:
                if not (c in CANON or re.fullmatch(r"Mob:[a-z0-9_]+", c)):
                    errors.append(
                        f"Chapter {chapter}: Cast entry '{c}' is neither a canon name {CANON} nor 'Mob:<slug>'"
                    )

        # The Motion prompt is exactly the one line extract_prompts.py feeds to H3 — not the rest
        # of the section. Reading to the end of the section would swallow the next chapter's prose
        # and make the "no absent character" check below fire on text H3 never sees.
        prompt_match = re.search(r"^- Motion prompt:[ ]?(.*)$", section, re.MULTILINE)
        if prompt_match is None:
            errors.append(f"Chapter {chapter}: missing Motion prompt")
            prompt = ""
            input_table = section
        else:
            prompt = prompt_match.group(1).strip()
            input_table = section[:prompt_match.start()]

        dur = re.search(r"^- Duration:.*?Frames:\s*(\d+)", input_table, re.MULTILINE)
        if dur is None:
            errors.append(f"Chapter {chapter}: '- Duration:' line must declare 'Frames: N'")
        else:
            frames = int(dur.group(1))
            if frames % 17 != 5 or not (MIN_FRAMES <= frames <= MAX_FRAMES):
                errors.append(
                    f"Chapter {chapter}: Frames {frames} is not on H3's 17k+5 grid within "
                    f"{MIN_FRAMES}..{MAX_FRAMES} (90, 107, 124, 141, 158, ...)"
                )

        pictures = re.findall(r"<Picture (\d+)>\s*=\s*`([^`]+\.png)`", input_table)
        audios = re.findall(r"<Audio (\d+)>\s*=\s*`([^`]+\.wav)`", input_table)

        if not pictures:
            errors.append(f"Chapter {chapter}: declares no <Picture N> sheets")
        if len(pictures) > 9:
            errors.append(f"Chapter {chapter}: {len(pictures)} pictures exceeds H3's limit of 9")
        if len(audios) > 3:
            errors.append(f"Chapter {chapter}: {len(audios)} audio files exceeds H3's limit of 3")
        if len(pictures) + len(audios) > 12:
            errors.append(f"Chapter {chapter}: {len(pictures) + len(audios)} input files exceeds H3's limit of 12")

        total = re.search(r"^- Total input files:\s*(\d+)", input_table, re.MULTILINE)
        if total is None:
            errors.append(f"Chapter {chapter}: missing '- Total input files:' line")
        elif int(total.group(1)) != len(pictures) + len(audios):
            errors.append(
                f"Chapter {chapter}: Total input files says {total.group(1)} but "
                f"{len(pictures)} pictures + {len(audios)} audio are declared"
            )

        attached_sheets: set[str] = set()
        for slot, filename in pictures:
            check_bundled(run_dir, chapter, f"<Picture {slot}>", filename, errors)
            if filename == SCALE_REF:
                continue
            m = re.fullmatch(r"([A-Za-z]+)_sheet\.png", filename) or re.fullmatch(r"(Mob_[a-z0-9_]+)_sheet\.png", filename)
            if m is None:
                errors.append(
                    f"Chapter {chapter}: <Picture {slot}> = {filename} is not a character sheet "
                    "(*_sheet.png / Mob_<slug>_sheet.png) or height_lineup.png — no other images are attached in this skill"
                )
                continue
            name = m.group(1)
            owner = f"Mob:{name[len('Mob_'):]}" if name.startswith("Mob_") else name
            attached_sheets.add(owner)
            if cast and owner not in cast:
                errors.append(
                    f"Chapter {chapter}: <Picture {slot}> = {filename} belongs to '{owner}', who is not in this "
                    f"chapter's Cast {cast} — only attach sheets of characters on screen in this chapter"
                )
        for c in cast:
            if c not in attached_sheets:
                expected = f"Mob_{c[4:]}_sheet.png" if c.startswith("Mob:") else f"{c}_sheet.png"
                errors.append(f"Chapter {chapter}: Cast member '{c}' has no sheet attached (expected {expected})")

        for slot, filename in audios:
            check_bundled(run_dir, chapter, f"<Audio {slot}>", filename, errors)
            p = run_dir / filename
            if p.is_file():
                secs = wav_seconds(p)
                if secs is None:
                    print(f"WARN: Chapter {chapter}: could not read wav duration of {filename}", file=sys.stderr)
                elif secs < 2.0 - 1e-3 or secs > 15.0 + 1e-3:
                    errors.append(
                        f"Chapter {chapter}: {filename} is {secs:.2f}s; H3 needs 2.0-15.0s per file "
                        "(pad the TAIL with ffmpeg apad=whole_dur=2.0)"
                    )

        if not prompt:
            continue
        if len(prompt) < 400:
            errors.append(f"Chapter {chapter}: Motion prompt is suspiciously short ({len(prompt)} chars)")

        for tag, mappings in (("Picture", pictures), ("Audio", audios)):
            for slot, filename in mappings:
                if f"<{tag} {slot}> = {filename}" not in prompt:
                    errors.append(f"Chapter {chapter}: Motion prompt does not redeclare '<{tag} {slot}> = {filename}'")

        for phrase in REQUIRED_PHRASES:
            if phrase not in prompt:
                errors.append(f"Chapter {chapter}: Motion prompt lacks the mandatory phrase '{phrase}'")
        if re.search(r"\bcamera\b", prompt, re.IGNORECASE) is None:
            errors.append(f"Chapter {chapter}: Motion prompt lacks a camera direction (type + amplitude + speed, or 'locked-off static camera')")

        if audios:
            for phrase in ("(S1)", "<d>[Japanese]", "AS-IS"):
                if phrase not in prompt:
                    errors.append(f"Chapter {chapter}: dialogue chapter's Motion prompt lacks '{phrase}'")
        elif re.search(r"no (speech|dialogue)", prompt, re.IGNORECASE) is None:
            errors.append(f"Chapter {chapter}: silent chapter's Motion prompt must state 'no speech' / 'no dialogue'")

        # The style-line / cast rule: a chapter's prompt may only talk about who is in it.
        for name in CANON:
            if name in cast:
                continue
            if re.search(rf"\b{name}\b", prompt):
                errors.append(
                    f"Chapter {chapter}: Motion prompt mentions '{name}', who is NOT in this chapter's Cast {cast}. "
                    "Remove every reference to absent characters (including style notes such as "
                    f"'{name} remains a ...'); the style line must only cover what is on screen"
                )

    if errors:
        fail(errors)
    print(f"OK: no-image (MiniMax H3 R2V, sheets + audio only) bundle validated: {run_dir}")


if __name__ == "__main__":
    main()
