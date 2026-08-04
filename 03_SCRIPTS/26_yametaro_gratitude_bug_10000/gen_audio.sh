#!/bin/bash
# このランの全セリフ・ナレーション音声を再生成する。
#
# 使い方（リポジトリルートから実行する）:
#   bash 03_SCRIPTS/26_yametaro_gratitude_bug_10000/gen_audio.sh
#
# 既に出力があるファイルはスキップするので、作り直したいものだけ先に削除すればよい。
# 配役の正典は 02_CHARACTERS/VOICE_CAST.md。この作品は全編Irodori-TTSのボイスクローンで、
# 福ちゃん・やめ太郎は本人の声サンプル、それ以外のナレーションはNarrator_voice.wavを使う。
# 生成される再生時間は script.md の Dialogue audio 表に記録済み。
set -u

RUN=03_SCRIPTS/26_yametaro_gratitude_bug_10000
SP=.claude/skills/seedance/irodori_speak.sh
NAR=02_CHARACTERS/Narrator_voice.wav
FUK=02_CHARACTERS/Fukuchan_voice.wav
YAM=02_CHARACTERS/Yametaro_voice.wav

if [ ! -f "$SP" ]; then
  echo "ERROR: リポジトリルートから実行してください（$SP が見つかりません）" >&2
  exit 1
fi

gen() { # gen <出力ファイル名> <参照音声> <シード> <セリフテキスト>
  local out="$RUN/$1" ref="$2" seed="$3" text="$4"
  if [ -f "$out" ]; then echo "SKIP(exists): $1"; return; fi
  echo "=== $1"
  $SP "$text" "$out" "$ref" "$seed" || echo "FAILED: $1"
}

gen clip1_line1_narrator.wav  "$NAR" 100 "やめ太郎、43歳。己のエンジニア人生に限界を感じ、悩みに悩み抜いた結果、"
gen clip2_line1_narrator.wav  "$NAR" 100 "やめ太郎がたどり着いたのは、感謝であった。"
gen clip3_line1_narrator.wav  "$NAR" 100 "一日一万回。感謝のバグ仕込み。"
gen clip4_line1_narrator.wav  "$NAR" 100 "祈る。仕様書を閉じる。実装する。壊す。謝る。"
gen clip5_line1_narrator.wav  "$NAR" 100 "この一連の動作を一回として、完了までに当初は十八時間を要した。"
gen clip6_line1_narrator.wav  "$NAR" 100 "バグを仕込み終えれば、その場で力尽きるように眠る。目覚めれば、また仕込む。"
gen clip7_line1_narrator.wav  "$NAR" 100 "二年が過ぎたころ、異変が起きた。一万回のバグ仕込みを終えても、日が暮れていない。"
gen clip8_line1_narrator.wav  "$NAR" 100 "代わりに増えていたのは、エラーログと問い合わせ、そして誰にも再現できない不具合だけだった。"
gen clip9_line1_narrator.wav  "$NAR" 100 "やめ太郎は気づく。バグを作る速度が、レビューを置き去りにした。"
gen clip10_line1_narrator.wav "$NAR" 100 "タイピングの音は消えた。コミット履歴すら残らない。ただ祈りを終えた瞬間、本番環境のどこかが静かに壊れている。"
gen clip11_line1_narrator.wav "$NAR" 100 "同僚が尋ねた。"
gen clip12_line1_fukuchan.wav "$FUK" 42  "やめ太郎さん、今、何をしていたんですか？"
gen clip13_line1_narrator.wav "$NAR" 100 "やめ太郎は、穏やかな表情で手を合わせた。"
gen clip14_line1_yametaro.wav "$YAM" 7   "何もしてへんで"
gen clip15_line1_narrator.wav "$NAR" 100 "その直後、スラックに障害通知が百件流れた。"
gen clip16_line1_narrator.wav "$NAR" 100 "後にこの技は、畏怖を込めてこう呼ばれる。究極奥義、何もしてないのに壊れた。"
gen clip17_line1_narrator.wav "$NAR" 100 "なお、やめ太郎は現在も原因究明のため祈り続けている。"

echo "=== ALL AUDIO DONE ==="
