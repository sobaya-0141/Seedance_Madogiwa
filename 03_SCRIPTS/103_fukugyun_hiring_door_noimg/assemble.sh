#!/bin/bash
# 103_fukugyun_hiring_door_noimg — 回収したch1..ch19のmp4を結合する
# macOS標準のbash 3.2で動く書き方にしてある（連想配列は使わない）。
# 使い方: ./assemble.sh [チャプターmp4のあるディレクトリ]   既定はこのスクリプトと同じ場所
set -eu

DIR="${1:-$(cd "$(dirname "$0")" && pwd)}"
OUT="$DIR/103_fukugyun_hiring_door.mp4"
LIST="$DIR/_concat_list.txt"

CHAPTERS="1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19"

# script.md の宣言フレーム数（17k+5グリッド）。ch1だけはノック音を切るため76フレームへトリム済み（生成は107f）。
frames_of() {
  case "$1" in
    1)  echo 76  ;; 2)  echo 107 ;; 3)  echo 90  ;; 4)  echo 90  ;; 5)  echo 124 ;;
    6)  echo 192 ;; 7)  echo 107 ;; 8)  echo 107 ;; 9)  echo 90  ;; 10) echo 107 ;;
    11) echo 107 ;; 12) echo 107 ;; 13) echo 192 ;; 14) echo 107 ;; 15) echo 68  ;;
    16) echo 107 ;; 17) echo 124 ;; 18) echo 107 ;; 19) echo 107 ;;
    *) echo 0 ;;
  esac
}

# チャプター→添付wav（結合時に音声を差し替える必要が出た場合の対応表。既定は埋め込み音声を使う）
wavs_of() {
  case "$1" in
    2)  echo "ch2_line1_yametaro.wav" ;;
    4)  echo "ch4_line1_yametaro.wav" ;;
    7)  echo "ch7_line1_okayaman.wav" ;;
    8)  echo "ch8_line1_fukuchan.wav" ;;
    9)  echo "ch9_line1_okayaman.wav" ;;
    10) echo "ch10_line1_fukuchan.wav" ;;
    11) echo "ch11_line1_okayaman.wav" ;;
    12) echo "ch12_line1_fukuchan.wav" ;;
    13) echo "ch13_line1_okayaman.wav ch13_line2_okayaman.wav" ;;
    16) echo "ch16_line1_okayaman.wav" ;;
    18) echo "ch18_line1_okayaman.wav" ;;
    19) echo "ch19_line1_fukuchan.wav" ;;
    *)  echo "" ;;
  esac
}

# --- 1. 存在とフレーム数の照合 ---
FAIL=0
for c in $CHAPTERS; do
  F="$DIR/ch${c}.mp4"
  if [ ! -f "$F" ]; then
    echo "ERROR: 見つかりません: ch${c}.mp4" >&2; FAIL=1; continue
  fi
  WANT=$(frames_of "$c")
  GOT=$(ffprobe -v error -select_streams v:0 -count_packets \
        -show_entries stream=nb_read_packets -of csv=p=0 "$F" | tr -d '\r,')
  if [ "$GOT" != "$WANT" ]; then
    echo "ERROR: ch${c}.mp4 のフレーム数が ${GOT}（script.mdの宣言は ${WANT}）。このチャプターは生成し直す" >&2
    FAIL=1
  else
    echo "ok  ch${c}.mp4  ${GOT}f"
  fi
done
[ "$FAIL" = "0" ] || { echo "フレーム数の照合に失敗したため結合しません" >&2; exit 1; }

# --- 2. 結合 ---
: > "$LIST"
for c in $CHAPTERS; do
  echo "file 'ch${c}.mp4'" >> "$LIST"
done
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -c copy "$OUT"
echo "WROTE $OUT"

# --- 3. 全チャプターの中間フレームのコンタクトシート（目視確認用） ---
SHEETDIR="$DIR/_contact"
rm -rf "$SHEETDIR"; mkdir -p "$SHEETDIR"
for c in $CHAPTERS; do
  WANT=$(frames_of "$c")
  MID=$((WANT / 2))
  ffmpeg -y -v error -i "$DIR/ch${c}.mp4" -vf "select=eq(n\,${MID})" -vframes 1 \
    "$SHEETDIR/$(printf '%02d' "$c").png"
done
ffmpeg -y -v error -pattern_type glob -i "$SHEETDIR/*.png" -filter_complex "tile=4x5" \
  "$DIR/_contact_sheet.png"
echo "WROTE $DIR/_contact_sheet.png — 章ごとに人数・扉の枚数・画面内テキストを拡大して確認すること"
