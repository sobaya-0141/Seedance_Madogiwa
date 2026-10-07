#!/bin/bash
# 103_fukugyun_hiring_door_noimg — フェーズ2: 採用テイクを正式ファイルにし、2.0秒未満を末尾パディングする
# 使い方: ./finalize_audio.sh   （CHOICES を編集して採用テイクを決めてから実行する）
# H3は1ファイル2.0秒以上が必要。先頭には無音を足さない（リップシンク開始位置が狂うため）。
set -eu

RUN="/Users/kenji.shimoju/Documents/private/Seedance_Madogiwa/.claude/worktrees/h3-bundle-creation-ceb3be/03_SCRIPTS/103_fukugyun_hiring_door_noimg"
T="$RUN/takes"

# id|採用テイク(1.0x または 1.5x)
# ch4 は別枠（takes/ch4_retry の採用候補を CH4_SRC に指定する）
CHOICES=(
"ch2_line1_yametaro|1.5x"
"ch7_line1_okayaman|1.5x"
"ch8_line1_fukuchan|1.5x"
"ch9_line1_okayaman|1.5x"
"ch10_line1_fukuchan|1.5x"
"ch11_line1_okayaman|1.0x"
"ch12_line1_fukuchan|1.5x"
"ch13_line1_okayaman|1.5x"
"ch13_line2_okayaman|1.5x"
"ch16_line1_okayaman|1.5x"
"ch18_line1_okayaman|1.0x"
"ch19_line1_fukuchan|1.5x"
)

dur() { python3 -c "
import wave,sys
w=wave.open(sys.argv[1]); print(f'{w.getnframes()/w.getframerate():.2f}')" "$1"; }

# --- ch4 は作り直した候補から選ぶ ---
CH4_SRC="${CH4_SRC:-$T/ch4_retry/d_seed42_sec2.2.wav}"
if [ -f "$CH4_SRC" ]; then
  CH4_RAW=$(python3 -c "
import wave,sys
w=wave.open(sys.argv[1]); print(f'{w.getnframes()/w.getframerate():.2f}')" "$CH4_SRC")
  if python3 -c "import sys; sys.exit(0 if float('$CH4_RAW') < 2.0 else 1)"; then
    ffmpeg -y -v error -i "$CH4_SRC" -af "apad=whole_dur=2.0" "$RUN/ch4_line1_yametaro.wav"
    echo "ch4_line1_yametaro : $(basename "$CH4_SRC")  ${CH4_RAW}s -> 2.00s (padded from ${CH4_RAW}s)"
  else
    cp "$CH4_SRC" "$RUN/ch4_line1_yametaro.wav"
    echo "ch4_line1_yametaro : $(basename "$CH4_SRC")  ${CH4_RAW}s"
  fi
else
  echo "ERROR: ch4の採用候補がありません: $CH4_SRC" >&2; exit 1
fi

for entry in "${CHOICES[@]}"; do
  IFS='|' read -r ID TAKE <<< "$entry"
  SRC="$T/${ID}_${TAKE}.wav"
  DST="$RUN/${ID}.wav"
  [ -f "$SRC" ] || { echo "ERROR: 採用テイクがありません: $SRC" >&2; exit 1; }
  RAW=$(dur "$SRC")
  NEED=$(python3 -c "print('1' if float('$RAW') < 2.0 else '0')")
  if [ "$NEED" = "1" ]; then
    ffmpeg -y -v error -i "$SRC" -af "apad=whole_dur=2.0" "$DST"
    echo "$ID : ${TAKE}  ${RAW}s -> $(dur "$DST")s (padded from ${RAW}s)"
  else
    cp "$SRC" "$DST"
    echo "$ID : ${TAKE}  $(dur "$DST")s"
  fi
done
echo "FINALIZE DONE"
