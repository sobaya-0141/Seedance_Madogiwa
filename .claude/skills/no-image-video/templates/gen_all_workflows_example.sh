#!/bin/bash
# Build every H3 R2V workflow: one take per chapter (chN, seed 42) — the default since 2026-10-26.
# Set TAKES="a b" only when the user explicitly asks for a second take (chNb, seed 1234, same prompt).
# Image order = <Picture N> in each prompt (make_prompts.py). chNb_prompt.txt is a byte copy of chN_prompt.txt.
set -eu
cd "$(dirname "$0")"
B=build_h3_workflow.py
[ -f $B ] || B=../../.claude/skills/local-video/build_h3_workflow.py
PEOPLE="--image Mob_lifeguard_sheet.png --image Mob_father_sheet.png --image Mob_child_sheet.png --image Mob_woman_sheet.png --image Mob_man_sheet.png"
CROWD="--image Mob_crowd_a_sheet.png --image Mob_crowd_b_sheet.png"
TAKES="${TAKES:-a}"
case " $TAKES " in *" b "*) for n in 1 2 3 4 5 6 7 8 9; do cp ch${n}_prompt.txt ch${n}b_prompt.txt; done;; esac
build() {  # chapter seed frames args...
  ch=$1; seed=$2; frames=$3; shift 3
  python3 $B --mode r2v --out ${ch}_workflow.json --prompt-file ${ch}_prompt.txt --frames $frames --seed $seed "$@"
}
for take in $TAKES; do
  case "$take" in a) t=""; s=42;; b) t=b; s=1234;; esac
  build ch1$t $s 243 $PEOPLE $CROWD
  build ch2$t $s 243 --image Mob_father_sheet.png --image Mob_child_sheet.png
  build ch3$t $s 141 --image Mob_lifeguard_sheet.png --audio ch3_line1_mob_lifeguard.wav
  build ch4$t $s 243 $PEOPLE $CROWD
  build ch5$t $s 362 --image Sobaya_sheet.png
  build ch6$t $s 243 --image Sobaya_sheet.png
  build ch7$t $s 192 --image Sobaya_sheet.png $PEOPLE $CROWD
  build ch8$t $s 294 --image Sobaya_sheet.png
  build ch9$t $s 192 --image Sobaya_sheet.png --audio ch9_line1_sobaya.wav
done
