#!/bin/bash
# モブキャラクター用のシート（Mob_<slug>_sheet.png）をローカルで1枚生成する（no-image-videoスキル同梱）。
# local-videoスキルの dt_generate.sh（draw-things-cli + Qwen Image Edit 2511）をtext-to-image（参照なし）で呼ぶ。
#
# **「スタジオ写真」として記述する（重要・2026-09-29の実測）**
#   このモデルに "character model sheet" / "turnaround" / "panel" / "FRONT / SIDE / BACK labels" のような
#   シート用語で指示すると、出力が**イラスト調（線画・塗り絵調）に倒れる**。実測では刑務官シートが
#   線画調になり、指定した制帽が片方から消え、パネルラベルの文字も崩れた（正典シートは実写ベースなので、
#   このシートを動画に渡すと画風がイラスト側へ引っ張られる）。
#   そこで本スクリプトは**多面図を諦め、「無地の背景の前に立つ全身のスタジオ写真」**として記述する。
#   モブは背景要員であり、固定したいのは顔の角度ではなく**制服・衣装・年齢感**なので、正面全身1カットで足りる。
#
# usage:
#   .claude/skills/no-image-video/make_mob_sheet.sh 03_SCRIPTS/<NN>_<slug>/Mob_<slug>_sheet.png [seed] <<'EOF'
#   <English description of the people: how many, where each stands (LEFT/RIGHT), age, build, hair, face,
#    and the exact outfit with colors and headwear>
#   EOF
#
# - 出力ファイル名は必ず Mob_<slug>_sheet.png（slugは小文字・数字・アンダースコア）。
# - 同型モブの組（刑務官2人等）は1枚にまとめてよい。specに "The man on the LEFT is ... The man on the RIGHT is ..."
#   と書き、プロンプト側からは位置で参照する（<Picture N>のPRESERVE列も「LEFTの人物 / RIGHTの人物」で書く）。
#   MOB_PEOPLE=1 にすると1人構成の文面になる。
# - サイズは既定 1344x768（H3の出力と同じ16:9）。MOB_SIZE で上書き可。ステップ数は DT_STEPS（既定24）。
# - 1枚あたり約7分（M4 Max / 1344x768 / 24step 実測）。**必ずバックグラウンドで実行**し、使用シードを
#   script.md の「Mob sheet generation log」に記録する。
# - 生成後は必ずReadで開き、specの各項目をPASS/FAIL判定してからユーザーに提示する（SKILL.md ステップ3）。
#   特に「写真になっているか（イラスト化していないか）」「帽子・小物が消えていないか」を最初に見る。
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DT="${SKILL_DIR}/../local-video/dt_generate.sh"
[ -x "$DT" ] || { echo "ERROR: dt_generate.sh が見つかりません: $DT" >&2; exit 1; }

OUT="${1:?出力パス（.../Mob_<slug>_sheet.png）を指定してください}"
SEED="${2:-$((RANDOM * 32768 + RANDOM))}"
BASENAME="$(basename "$OUT")"
if [[ ! "$BASENAME" =~ ^Mob_[a-z0-9_]+_sheet\.png$ ]]; then
  echo "ERROR: 出力ファイル名は Mob_<slug>_sheet.png（slug=小文字・数字・_）にしてください: $BASENAME" >&2
  exit 1
fi
SIZE="${MOB_SIZE:-1344x768}"
PEOPLE="${MOB_PEOPLE:-2}"

SPEC="$(cat)"
[ -n "$SPEC" ] || { echo "ERROR: stdinにモブの外見仕様（英語）を渡してください" >&2; exit 1; }

case "$PEOPLE" in
  1) WHO='The person stands upright facing the camera in a relaxed neutral pose with their arms at their sides and their whole body including their shoes inside the frame.' ;;
  2) WHO='Both people stand upright side by side facing the camera in relaxed neutral poses with their arms at their sides and their whole bodies including their shoes inside the frame.' ;;
  *) echo "ERROR: MOB_PEOPLE は 1 または 2: $PEOPLE" >&2; exit 1 ;;
esac

PROMPT="A full-length professional studio photograph taken with a 50mm lens against a seamless plain light gray photography backdrop, with even soft box lighting, sharp focus, natural skin texture and true-to-life colour. ${WHO} This is a real photograph of real people: NOT an illustration, NOT a drawing, NOT line art, NOT anime, NOT a painting, NOT a 3D render, NOT a cartoon. There is no text, no lettering, no caption, no watermark, no logo, no border and no panel division anywhere in the picture, and no scenery or furniture behind them. ${SPEC}"

echo "people: $PEOPLE"
echo "size:   $SIZE"
printf '%s\n' "$PROMPT" | "$DT" "$OUT" none "$SEED" "$SIZE"
