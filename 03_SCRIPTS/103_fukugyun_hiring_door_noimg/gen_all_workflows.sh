#!/bin/bash
# 103_fukugyun_hiring_door_noimg — 全19チャプターのComfyUIワークフローJSONを生成する（全てR2V）
# 先に: python3 .claude/skills/local-video/extract_prompts.py 03_SCRIPTS/103_fukugyun_hiring_door_noimg
# 後に: python3 .claude/skills/no-image-video/check_workflows_match_script.py 03_SCRIPTS/103_fukugyun_hiring_door_noimg
set -eu

ROOT="/Users/kenji.shimoju/Documents/private/Seedance_Madogiwa/.claude/worktrees/h3-bundle-creation-ceb3be"
RUN="$ROOT/03_SCRIPTS/103_fukugyun_hiring_door_noimg"
BUILD="$ROOT/.claude/skills/local-video/build_h3_workflow.py"

b() { # b <chapter> <frames> [args...]
  CH="$1"; FRAMES="$2"; shift 2
  python3 "$BUILD" --mode r2v \
    --out "$RUN/ch${CH}_workflow.json" \
    --prompt-file "$RUN/ch${CH}_prompt.txt" \
    --frames "$FRAMES" "$@"
  echo "built ch${CH}_workflow.json (${FRAMES}f)"
}

b 1  107 --image Fukuchan_sheet.png --image Mob_grand_door_sheet.png
b 2  107 --image Yametaro_sheet.png --image Fukuchan_sheet.png --image Mob_grand_door_sheet.png \
         --audio ch2_line1_yametaro.wav
b 3   90 --image Fukuchan_sheet.png --image Mob_grand_door_sheet.png
b 4   90 --image Yametaro_sheet.png --image Fukuchan_sheet.png --image Mob_grand_door_sheet.png \
         --audio ch4_line1_yametaro.wav
b 5  124 --image Fukuchan_sheet.png --image Mob_grand_door_sheet.png
b 6  192 --image Fukuchan_sheet.png
b 7  107 --image Fukuchan_sheet.png --image Okayaman_sheet.png --audio ch7_line1_okayaman.wav
b 8  107 --image Fukuchan_sheet.png --audio ch8_line1_fukuchan.wav
b 9   90 --image Okayaman_sheet.png --audio ch9_line1_okayaman.wav
b 10 107 --image Fukuchan_sheet.png --audio ch10_line1_fukuchan.wav
b 11 107 --image Okayaman_sheet.png --audio ch11_line1_okayaman.wav
b 12 107 --image Fukuchan_sheet.png --audio ch12_line1_fukuchan.wav
b 13 192 --image Fukuchan_sheet.png --image Okayaman_sheet.png \
         --audio ch13_line1_okayaman.wav --audio ch13_line2_okayaman.wav
b 14 107 --image Fukuchan_sheet.png
b 15  90 --image Fukuchan_sheet.png
b 16 107 --image Fukuchan_sheet.png --image Okayaman_sheet.png --audio ch16_line1_okayaman.wav
b 17 124 --image Fukuchan_sheet.png
b 18 107 --image Fukuchan_sheet.png --image Okayaman_sheet.png --audio ch18_line1_okayaman.wav
b 19 107 --image Fukuchan_sheet.png --audio ch19_line1_fukuchan.wav

echo "ALL WORKFLOWS BUILT"
