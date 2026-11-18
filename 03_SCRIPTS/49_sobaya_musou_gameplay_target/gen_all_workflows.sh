#!/bin/bash
# Build every H3 R2V workflow: one take per chapter (chN, seed 42).
# Image order = <Picture N> in each prompt (make_prompts.py / make_script.py CHAPTERS).
set -eu
cd "$(dirname "$0")"
B=../../.claude/skills/local-video/build_h3_workflow.py
S="--image Sobaya_gamecg_sheet.png"
build() {  # chapter frames args...
  ch=$1; frames=$2; shift 2
  python3 $B --mode r2v --out ${ch}_workflow.json --prompt-file ${ch}_prompt.txt --frames $frames --seed 42 "$@"
}
build ch1 362 $S --image Mob_factory_guard_sheet.png --image Loc_factory_sheet.png --audio ch1_line1_sobaya.wav
build ch2 362 $S --image Mob_police_sheet.png --image Mob_inspector_sheet.png --image Loc_factory_sheet.png
build ch3 362 $S --image Mob_police_sheet.png --image Mob_motor_police_sheet.png --image Mob_crowd_passerby_sheet.png --image Loc_azabu_shotengai_sheet.png
build ch4 362 $S --image Mob_riot_chief_sheet.png --image Mob_police_sheet.png --image Loc_hq_plaza_sheet.png
build ch5 362 $S --image Mob_hq_guard_sheet.png --image Loc_hq_office_sheet.png
build ch6 362 $S --image Mob_security_head_sheet.png --image Mob_hq_guard_sheet.png --image Loc_madogiwa_sheet.png --audio ch6_line1_sobaya.wav
