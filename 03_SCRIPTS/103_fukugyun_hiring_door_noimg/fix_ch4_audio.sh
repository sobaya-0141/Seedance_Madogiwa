#!/bin/bash
# ch4 — 冒頭に入ってしまったドアの閉まる音を消す
#
# 台本では ch4 の扉は最後まで閉じたままで、効果音にも「NO latch, NO door movement」と
# 書いてあるが、H3が勝手に0.1〜0.6秒へ重いドアの音を入れてきた。映像側では扉は静止した
# ままなので、フレームは切らずに**音だけ**を差し替える（90フレームを保てる）。
#
# やり方: 冒頭0.60秒を無音にし、0.60〜0.72秒でなだらかに元の音へ戻す。そのままだと
# そこだけ完全に無音で不自然なので、同じクリップの静かな区間（0.95〜1.35秒。セリフが
# 入っていない部屋鳴り）をループさせて敷く。
#
# 使い方: ./fix_ch4_audio.sh <入力ch4.mp4> <出力ch4.mp4>
set -eu

IN="${1:?入力のch4.mp4を指定してください}"
OUT="${2:?出力先を指定してください}"

MUTE_END=0.60     # ここまで完全に消す
RAMP_END=0.72     # ここで元の音量へ戻しきる
TONE_START=0.95   # 敷く部屋鳴りの採取位置
TONE_LEN=0.40

ffmpeg -y -v error -i "$IN" -i "$IN" -filter_complex "
  [0:a]volume='if(lt(t,${MUTE_END}),0,if(lt(t,${RAMP_END}),(t-${MUTE_END})/(${RAMP_END}-${MUTE_END}),1))':eval=frame[clean];
  [1:a]atrim=start=${TONE_START}:duration=${TONE_LEN},asetpts=PTS-STARTPTS,
       aloop=loop=3:size=$(python3 -c "print(int(48000*${TONE_LEN}))"),
       atrim=duration=${RAMP_END},asetpts=PTS-STARTPTS,
       afade=t=out:st=${MUTE_END}:d=$(python3 -c "print(${RAMP_END}-${MUTE_END})")[tone];
  [clean][tone]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]
" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k -ar 32000 -video_track_timescale 12288 "$OUT"

echo "WROTE $OUT"
ffprobe -v error -select_streams v:0 -count_packets \
  -show_entries stream=nb_read_packets,duration -of csv=p=0 "$OUT"
