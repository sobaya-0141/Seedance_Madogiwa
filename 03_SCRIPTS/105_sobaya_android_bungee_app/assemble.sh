#!/bin/bash
# 105_sobaya_android_bungee_app — final assembly.
#
# This run burns dialogue subtitles in with Remotion (the user asked for them), so it does NOT use
# ffmpeg concat. Run this from the run directory AFTER the five chapter mp4s have come back from
# Colab and been placed here as ch1.mp4 ... ch5.mp4.
#
#   bash assemble.sh
#
# Steps: verify each chapter's frame count against script.md -> copy chapters + wavs into
# remotion/public/ -> render the subtitled final cut -> build a contact sheet for the eyeball pass.
#
# Written for macOS's stock bash 3.2: no associative arrays (`declare -A` fails there).

set -eu
cd "$(dirname "$0")"

RUN_NAME=105_sobaya_android_bungee_app
OUT="${RUN_NAME}_final.mp4"
CONTACT="${RUN_NAME}_contact_sheet.png"

expected_frames() {
  case "$1" in
    ch1) echo 141 ;;
    ch2) echo 124 ;;
    ch3) echo 124 ;;
    ch4) echo 158 ;;
    ch5) echo 124 ;;
    *) echo "unknown chapter: $1" >&2; exit 1 ;;
  esac
}

CHAPTERS="ch1 ch2 ch3 ch4 ch5"

echo "== 1. frame-count check against script.md =="
fail=0
for ch in $CHAPTERS; do
  if [ ! -f "$ch.mp4" ]; then
    echo "MISSING: $ch.mp4 (collect it from Drive: h3_outputs/${RUN_NAME}/)" >&2
    fail=1
    continue
  fi
  want=$(expected_frames "$ch")
  got=$(ffprobe -v error -count_packets -select_streams v:0 \
        -show_entries stream=nb_read_packets -of csv=p=0 "$ch.mp4")
  if [ "$got" != "$want" ]; then
    echo "FRAME MISMATCH: $ch.mp4 has $got frames, script.md declares $want — regenerate this chapter" >&2
    fail=1
  else
    echo "  OK $ch.mp4  $got frames"
  fi
done
[ "$fail" -eq 0 ] || { echo "aborting: fix the chapters above first" >&2; exit 1; }

echo "== 2. stage files for Remotion =="
cp ch1.mp4 ch2.mp4 ch3.mp4 ch4.mp4 ch5.mp4 remotion/public/
cp ch1_line1_sobaya.wav ch2_line1_yametaro.wav ch3_line1_yametaro.wav \
   ch4_line1_sobaya.wav ch5_line1_yametaro.wav remotion/public/

echo "== 3. render the subtitled final cut =="
( cd remotion && [ -d node_modules ] || npm install --no-audit --no-fund )
( cd remotion && npm run render )

echo "== 4. contact sheet (mid frame of every chapter) =="
rm -rf .contact && mkdir -p .contact
for ch in $CHAPTERS; do
  want=$(expected_frames "$ch")
  mid=$(( want / 2 ))
  ffmpeg -v error -y -i "$ch.mp4" -vf "select=eq(n\,$mid)" -vframes 1 ".contact/$ch.png"
done
ffmpeg -v error -y -pattern_type glob -i '.contact/ch*.png' \
  -filter_complex "scale=672:384,tile=3x2:margin=8:padding=8:color=0x101010" -frames:v 1 "$CONTACT"
rm -rf .contact

echo
echo "DONE"
echo "  final cut    : $OUT"
echo "  contact sheet: $CONTACT"
echo
echo "Now do the eyeball pass (no-image runs invent props that are not in the script):"
echo "  - open $CONTACT and check each chapter for the declared cast count, extra people,"
echo "    extra phones/mugs, and any on-screen text. CROP AND ZOOM anything suspicious —"
echo "    thumbnail-size judgements are unreliable."
echo "  - play $OUT and confirm every line sounds like the local Irodori take."
