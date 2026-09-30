#!/bin/bash
# 90_death_game_opening_monitors — Colabから回収した ch1..ch6.mp4 を結合する
# macOS標準のbash 3.2で動くよう、連想配列は使わずcase文で対応を書く。
#
# 使い方:
#   1. Driveの h3_outputs/90_death_game_opening_monitors/ から chN.mp4 をこのディレクトリへ回収する
#   2. ./assemble.sh            既定（H3の埋め込み音声をそのまま使う）
#      ./assemble.sh relay ch4  そのチャプターだけローカルwavを載せ直す（音声が劣化したときのみ）
#
# VOICEVOXは未使用のランなので、画面内クレジットの焼き込みは不要。
set -eu
cd "$(dirname "$0")"

CHAPTERS="ch1 ch2 ch3 ch4 ch5 ch6"

# script.md の Frames: と一致しているか照合する（ズレていたらそのチャプターは生成し直し）
frames_for() {
  case "$1" in
    ch1) echo 209 ;;
    ch2) echo 209 ;;
    ch3) echo 141 ;;
    ch4) echo 158 ;;
    ch5) echo 90 ;;
    ch6) echo 141 ;;
    *) echo 0 ;;
  esac
}

# チャプター→ローカルwav（フォールバックで載せ直すときだけ使う）
wavs_for() {
  case "$1" in
    ch1) echo "ch1_line1_okayaman.wav ch1_line2_okayaman.wav" ;;
    ch2) echo "ch2_line1_fukuchan.wav ch2_line2_fukuchan.wav" ;;
    ch3) echo "ch3_line1_yametaro.wav ch3_line2_yametaro.wav" ;;
    ch4) echo "ch4_line1_sobaya.wav ch4_line2_sobaya.wav" ;;
    ch5) echo "" ;;
    ch6) echo "ch6_line1_sobaya.wav" ;;
    *) echo "" ;;
  esac
}

if [ "${1:-}" = "relay" ]; then
  CH="${2:?チャプター名を指定してください（例: ch4）}"
  WAVS=$(wavs_for "$CH")
  [ -n "$WAVS" ] || { echo "ERROR: $CH にローカルwavはありません" >&2; exit 1; }
  set -- $WAVS
  echo "INFO: $CH の埋め込み音声を捨て、$* を連結して載せ直します"
  if [ "$#" -eq 1 ]; then
    ffmpeg -y -v error -i "$CH.mp4" -i "$1" \
      -map 0:v -map 1:a -c:v copy -shortest "${CH}_final.mp4"
  else
    ffmpeg -y -v error -i "$CH.mp4" -i "$1" -i "$2" \
      -filter_complex "[1:a][2:a]concat=n=2:v=0:a=1,apad[a]" \
      -map 0:v -map "[a]" -c:v copy -shortest "${CH}_final.mp4"
  fi
  echo "OK: ${CH}_final.mp4 を作り直しました。もう一度 ./assemble.sh を実行してください"
  exit 0
fi

# --- 1. フレーム数の照合と chN_final.mp4 の用意（既定は埋め込み音声をそのまま使う） ---
for CH in $CHAPTERS; do
  [ -f "$CH.mp4" ] || { echo "ERROR: $CH.mp4 がありません（Driveから回収してください）" >&2; exit 1; }
  WANT=$(frames_for "$CH")
  GOT=$(ffprobe -v error -select_streams v:0 -count_packets \
        -show_entries stream=nb_read_packets -of csv=p=0 "$CH.mp4")
  if [ "$GOT" != "$WANT" ]; then
    echo "ERROR: $CH.mp4 は ${GOT}フレームで、script.mdの ${WANT} と違います。そのチャプターは生成し直してください" >&2
    exit 1
  fi
  if [ ! -f "${CH}_final.mp4" ]; then
    cp "$CH.mp4" "${CH}_final.mp4"
  fi
  echo "OK: $CH ($GOT frames) → ${CH}_final.mp4"
done

# --- 2. 結合 ---
: > concat.txt
for CH in $CHAPTERS; do printf "file '%s_final.mp4'\n" "$CH" >> concat.txt; done
ffmpeg -y -v error -f concat -safe 0 -i concat.txt -c copy final.mp4
echo "OK: final.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 final.mp4)s)"

# --- 3. 目視用コンタクトシート（各章の中間フレームを1枚に並べる） ---
rm -f _mid_*.png
for CH in $CHAPTERS; do
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CH.mp4")
  MID=$(python3 -c "print(round($DUR/2,2))")
  ffmpeg -y -v error -ss "$MID" -i "$CH.mp4" -frames:v 1 "_mid_$CH.png"
done
ffmpeg -y -v error -pattern_type glob -i '_mid_ch*.png' -filter_complex "scale=640:-1,tile=3x2" contact_sheet.png
rm -f _mid_*.png
echo "OK: contact_sheet.png（各章の中間フレーム。拡大して人数・画面内テキスト・モニター内の人物を確認する）"
