#!/bin/bash
# モブキャラクター用のモデルシート（Mob_<slug>_sheet.png）をローカルで1枚生成する（no-image-videoスキル同梱）。
# local-videoスキルの dt_generate.sh（draw-things-cli + Qwen Image Edit 2511）をtext-to-image（参照なし）で呼び、
# 正典シートと同じ「白背景・ターンアラウンド＋顔クローズアップ＋衣装ディテール＋短い英語ラベル」のレイアウト文を
# 自動で前後に付ける。stdinにはモブの外見仕様（英語・PRESERVE相当）だけを書けばよい。
#
# usage:
#   .claude/skills/no-image-video/make_mob_sheet.sh 03_SCRIPTS/<NN>_<slug>/Mob_<slug>_sheet.png [seed] <<'EOF'
#   <English design spec of the mob — age, build, hair, face, uniform/outfit with colors, cap, props>
#   EOF
#
# - 出力ファイル名は必ず Mob_<slug>_sheet.png（slugは小文字・数字・アンダースコア）。ラベル名はslugから自動生成
#   （guard_a → "GUARD A"）。MOB_LABEL で上書き可。
# - 同型モブの組（刑務官2人等）は1枚の組シートにまとめてよい: MOB_LAYOUT=pair にすると
#   「LEFT half = first person / RIGHT half = second person」の2人構成で描く（specに2人分を書く。ラベルは "GUARD A" / "GUARD B" 等を
#   MOB_LABEL="GUARD A / GUARD B" で渡す）。
# - サイズは正典シートと同じ16:9系（既定 1600x896・64の倍数）。MOB_SIZE で上書き可。ステップ数は DT_STEPS（dt_generate.shに渡る）。
# - 生成後は必ずReadで開き、specの各項目をPASS/FAIL判定してからユーザーに提示する（SKILL.md ステップ3）。
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DT="${SKILL_DIR}/../local-video/dt_generate.sh"
[ -x "$DT" ] || { echo "ERROR: dt_generate.sh が見つかりません: $DT" >&2; exit 1; }

OUT="${1:?出力パス（.../Mob_<slug>_sheet.png）を指定してください}"
SEED="${2:-$((RANDOM * 32768 + RANDOM))}"   # dt_generate.shは位置引数なので常にシードを渡す（省略時はランダム。出力に表示される）
BASENAME="$(basename "$OUT")"
if [[ ! "$BASENAME" =~ ^Mob_[a-z0-9_]+_sheet\.png$ ]]; then
  echo "ERROR: 出力ファイル名は Mob_<slug>_sheet.png（slug=小文字・数字・_）にしてください: $BASENAME" >&2
  exit 1
fi
SLUG="${BASENAME#Mob_}"; SLUG="${SLUG%_sheet.png}"
LABEL="${MOB_LABEL:-$(echo "$SLUG" | tr '_' ' ' | tr '[:lower:]' '[:upper:]')}"
SIZE="${MOB_SIZE:-1600x896}"
LAYOUT="${MOB_LAYOUT:-single}"

SPEC="$(cat)"
[ -n "$SPEC" ] || { echo "ERROR: stdinにモブの外見仕様（英語）を渡してください" >&2; exit 1; }

case "$LAYOUT" in
  single)
    WHO="ONE person only, the SAME person in every panel with an identical face, hair, build and outfit"
    PANELS="At the far left a full-body FRONT view standing relaxed; then a TURNAROUND row of three full-body views labeled FRONT, SIDE and BACK; a large FACE CLOSE-UP; and an OUTFIT DETAILS close-up of the uniform/clothing and any props"
    ;;
  pair)
    WHO="exactly TWO different people, the first person on the LEFT half and the second person on the RIGHT half; each half shows only that one person, with an identical face, hair, build and outfit across that half's panels; the two must be clearly distinguishable from each other"
    PANELS="Each half contains: a full-body FRONT view, a smaller SIDE view and BACK view, and a FACE CLOSE-UP, with small labels FRONT / SIDE / BACK / FACE CLOSE-UP"
    ;;
  *) echo "ERROR: MOB_LAYOUT は single または pair: $LAYOUT" >&2; exit 1 ;;
esac

PROMPT="A character model sheet on a plain flat white background (16:9), in the style of a professional live-action casting/costume reference sheet: real photographed people, natural human proportions, even studio lighting, sharp focus. The sheet shows ${WHO}. ${PANELS}. Clean small black sans-serif labels only: the name label \"${LABEL}\" at the top-left, and the panel labels; no other text, no watermark, no logo. No background scenery, no props other than those listed, no other characters. Character design: ${SPEC} NOT anime, NOT cartoon, NOT illustration, NOT a 3D render — a photographic reference sheet."

echo "label:  $LABEL"
echo "layout: $LAYOUT"
printf '%s\n' "$PROMPT" | "$DT" "$OUT" none "$SEED" "$SIZE"
