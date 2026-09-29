#!/bin/bash
# Assemble run 33 (ゆめみ村 応募方法) into final.mp4.
#
# Written for macOS's stock bash 3.2: NO associative arrays (`declare -A`), only `case`.
#
# DEFAULT: every chapter keeps H3's embedded audio (see script.md, "Generation & assembly
# protocol", Step 3). H3 is given the Irodori-TTS wavs and reproduces them faithfully.
# ONLY IF you hear degradation, doubling or a changed voice on a chapter, add that chapter
# number to OVERRIDE_CHAPTERS below and set its speech onset in onset_ms(). Those chapters
# then discard the generated audio and use the local wav alone.
#
# The onset values are NOT correct by default: you must watch the chapter and find the frame
# where the speaker's mouth starts moving before you trust an overridden chapter.
set -uo pipefail
RUN="$(cd "$(dirname "$0")" && pwd)"
FF=$(command -v ffmpeg || echo /opt/homebrew/bin/ffmpeg)
FP=$(command -v ffprobe || echo /opt/homebrew/bin/ffprobe)
cd "$RUN" || exit 1

CHAPTERS="1 2 3 4 5 6 7 8 9 10 11 12 13 14"
# Space-separated chapter numbers whose embedded audio is NOT trusted. Empty = trust them all.
OVERRIDE_CHAPTERS=""

# Declared frame counts from script.md (17k+5 grid).
frames_for() {
  case "$1" in
    1) echo 124;; 2) echo 158;; 3) echo 158;; 4) echo 243;;
    5) echo 90;;  6) echo 90;;  7) echo 90;;  8) echo 90;;
    9) echo 107;; 10) echo 107;; 11) echo 107;; 12) echo 107;;
    13) echo 90;; 14) echo 124;;
    *) echo 0;;
  esac
}

# Primary dialogue wav per chapter (chapter 2 has a second line, handled separately).
wav_for() {
  case "$1" in
    1) echo ch1_line1_student.wav;;
    2) echo ch2_line1_yametaro.wav;;
    3) echo ch3_line1_yametaro.wav;;
    4) echo ch4_line1_yametaro.wav;;
    6) echo ch6_line1_student.wav;;
    7) echo ch7_line1_clerk.wav;;
    8) echo ch8_line1_student.wav;;
    9) echo ch9_line1_clerk.wav;;
    12) echo ch12_line1_sobaya.wav;;
    13) echo ch13_line1_student.wav;;
    14) echo ch14_line1_sobaya.wav;;
    *) echo "";;            # 5, 10 and 11 are silent chapters
  esac
}

# Speech onset in ms, measured by watching the generated chapter. Placeholders only.
onset_ms() {
  case "$1" in
    1) echo 2000;; 2) echo 900;;  3) echo 700;;  4) echo 600;;
    6) echo 500;;  7) echo 400;;  8) echo 800;;  9) echo 1400;;
    12) echo 1800;; 13) echo 800;; 14) echo 800;;
    *) echo 0;;
  esac
}

echo "=== frame-count check (must match script.md before concatenating) ==="
bad=0
for n in $CHAPTERS; do
  vid="ch$n.mp4"
  if [ ! -f "$vid" ]; then echo "MISSING $vid — generate it first"; bad=1; continue; fi
  want=$(frames_for "$n")
  got=$("$FP" -v error -count_packets -select_streams v:0 \
        -show_entries stream=nb_read_packets -of csv=p=0 "$vid" 2>/dev/null | tr -d '\r')
  if [ "$got" != "$want" ]; then
    echo "ch$n: FRAME MISMATCH — got ${got:-none}, script.md declares $want. Regenerate this chapter."
    bad=1
  else
    echo "ch$n: $got frames OK"
  fi
done
[ "$bad" -ne 0 ] && { echo "Fix the problems above before assembling."; exit 1; }

echo "=== per-chapter audio ==="
for n in $CHAPTERS; do
  vid="ch$n.mp4"; out="ch${n}_final.mp4"
  override=no
  for o in $OVERRIDE_CHAPTERS; do [ "$o" = "$n" ] && override=yes; done

  if [ "$override" = no ]; then
    cp "$vid" "$out" && echo "ch$n: embedded H3 audio kept -> $out"
    continue
  fi

  wav=$(wav_for "$n"); off=$(onset_ms "$n")
  if [ -z "$wav" ]; then
    echo "ch$n: silent chapter, nothing to override — keeping as is"
    cp "$vid" "$out"; continue
  fi
  [ -f "$wav" ] || { echo "ch$n: MISSING $wav"; exit 1; }

  if [ "$n" = "2" ]; then
    # chapter 2 carries two Yametaro lines: line 2 starts at 2.6s per script.md
    "$FF" -y -v error -i "$vid" -i ch2_line1_yametaro.wav -i ch2_line2_yametaro.wav \
      -filter_complex "[1:a]adelay=${off}|${off}[a1];[2:a]adelay=2600|2600[a2];[a1][a2]amix=inputs=2:duration=longest:dropout_transition=0,apad[a]" \
      -map 0:v -map "[a]" -c:v copy -shortest "$out" \
      && echo "ch$n: local wavs only (line1 +${off}ms, line2 +2600ms) -> $out"
  else
    "$FF" -y -v error -i "$vid" -i "$wav" \
      -filter_complex "[1:a]adelay=${off}|${off},apad[a]" \
      -map 0:v -map "[a]" -c:v copy -shortest "$out" \
      && echo "ch$n: local wav only (+${off}ms) -> $out"
  fi
done

echo "=== concat ==="
: > concat.txt
count=0
for n in $CHAPTERS; do
  if [ -f "ch${n}_final.mp4" ]; then echo "file 'ch${n}_final.mp4'" >> concat.txt; count=$((count+1)); fi
done
[ "$count" -ne 14 ] && { echo "only $count/14 chapters present — aborting"; exit 1; }

"$FF" -y -v error -f concat -safe 0 -i concat.txt -c copy final.mp4 && echo "-> final.mp4"

# No VOICEVOX speaker is used in this run, so no on-screen credit is burned in.
"$FP" -v error -show_entries format=duration,size \
  -show_entries stream=width,height,codec_name -of default=noprint_wrappers=1 final.mp4

cat <<'NOTE'

NEXT (do not skip):
  1. Watch final.mp4 end to end. Expect about 70.2s, 14 cuts, every line in the local voice,
     no doubled dialogue, and no on-screen text anywhere.
  2. Build a contact sheet of mid-chapter frames and inspect it at FULL SIZE, not as thumbnails:
       for n in 1 2 3 4 5 6 7 8 9 10 11 12 13 14; do
         ffmpeg -y -v error -i ch$n.mp4 -vf "select=eq(n\,30)" -vframes 1 qc_ch$n.png
       done
       ffmpeg -y -v error -pattern_type glob -i 'qc_ch*.png' -filter_complex tile=4x4 qc_contact.png
     Check each chapter for: the declared head count, objects that were never written into the
     prompt, and any on-screen text. Crop and zoom anything that looks off before judging it.
  3. Chapter 11 specifically: confirm Sobaya is an unlit silhouette in every sampled frame.
  4. Chapters 12 and 14: confirm the white mask never deforms into a human mouth.
NOTE
