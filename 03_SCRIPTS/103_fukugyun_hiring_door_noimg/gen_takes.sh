#!/bin/bash
# 103_fukugyun_hiring_door_noimg — セリフ音声の候補生成（等速 → 1.5倍速）
# フェーズ1: 候補を takes/ に作る。ユーザーが選んだあと finalize する。
set -eu

ROOT="/Users/kenji.shimoju/Documents/private/Seedance_Madogiwa/.claude/worktrees/h3-bundle-creation-ceb3be"
RUN="$ROOT/03_SCRIPTS/103_fukugyun_hiring_door_noimg"
CH="$ROOT/02_CHARACTERS"
SPEAK="$ROOT/.claude/skills/seedance/irodori_speak.sh"
OUT="$RUN/takes"
mkdir -p "$OUT"

# id|text|ref_voice|seed
LINES=(
"ch2_line1_yametaro|ノックもしないのかい？無礼な子だね。|Yametaro_voice.wav|7"
"ch4_line1_yametaro|まあいい、入んな|Yametaro_voice.wav|7"
"ch7_line1_okayaman|おかやまん。なんだい？人間かい？|Okayaman_voice.wav|42"
"ch8_line1_fukuchan|ここで働かせてください！|Fukuchan_voice.wav|42"
"ch9_line1_okayaman|窓際に仕事なんてないんだよ|Okayaman_voice.wav|42"
"ch10_line1_fukuchan|ここで働かせてください|Fukuchan_voice.wav|42"
"ch11_line1_okayaman|黙れ小僧！お前に窓の何が分かる！|Okayaman_voice.wav|42"
"ch12_line1_fukuchan|ここで働かせてください|Fukuchan_voice.wav|42"
"ch13_line1_okayaman|はぁ・・・仕方ないね|Okayaman_voice.wav|42"
"ch13_line2_okayaman|名前を書きな雇用契約書だ|Okayaman_voice.wav|42"
"ch16_line1_okayaman|福ちゃん？贅沢な名だね|Okayaman_voice.wav|42"
"ch18_line1_okayaman|今日からお前は福ギュンだ！いいね福ギュン！|Okayaman_voice.wav|42"
"ch19_line1_fukuchan|はい！わたしは今日から福ギュンです|Fukuchan_voice.wav|42"
)

dur() { python3 -c "
import wave,sys
w=wave.open(sys.argv[1]); print(f'{w.getnframes()/w.getframerate():.2f}')" "$1"; }

for entry in "${LINES[@]}"; do
  IFS='|' read -r ID TEXT REF SEED <<< "$entry"
  F1="$OUT/${ID}_1.0x.wav"
  if [ ! -f "$F1" ]; then
    echo "=== $ID (1.0x) ==="
    "$SPEAK" "$TEXT" "$F1" "$CH/$REF" "$SEED"
  fi
  D=$(dur "$F1")
  # 1.5倍速候補の尺 = (等速実測長 - 0.3) / 1.5 + 0.3
  SEC=$(python3 -c "print(f'{(float('$D')-0.3)/1.5+0.3:.2f}')")
  F15="$OUT/${ID}_1.5x.wav"
  if [ ! -f "$F15" ]; then
    echo "=== $ID (1.5x, seconds=$SEC) ==="
    "$SPEAK" "$TEXT" "$F15" "$CH/$REF" "$SEED" "" "$SEC"
  fi
  echo "DONE $ID : 1.0x=$(dur "$F1")s  1.5x=$(dur "$F15")s (seconds=$SEC)"
done

echo "ALL TAKES DONE"
