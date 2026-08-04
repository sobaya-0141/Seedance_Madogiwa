#!/bin/bash
# draw-things-cli（Draw Thingsのローカル画像生成CLI）でキーフレーム静止画を1枚生成する。
# プロンプトはstdin（ヒアドキュメント）で渡す。引用符を含む長文でもエスケープ不要。
#
# usage:
#   .claude/skills/seedance/dt_generate.sh <output.png> <input_image.png|none> [seed] [WxH] <<'EOF'
#   <English prompt>
#   EOF
#
# - input_image: img2img/編集の種になる画像1枚（参照キャンバス or 前フレーム）。
#   純粋なtext-to-imageにしたい場合のみ `none` を渡す。
# - seed省略時はランダム。使用シードを標準出力に出すので script.md に記録できる。
# - WxHは64の倍数（デフォルト 1024x576 = 16:9）。
# - モデルは環境変数 DT_MODEL で差し替え可（デフォルト: Qwen Image Edit 2511 6-bit）。
# - DT_STEPS でサンプリングステップ数を上書きできる（既定はモデルの推奨値=30）。
#   1枚あたりの所要時間はステップ数にほぼ比例する（M4 Max / 1024x576 で約23秒/step）。
#   クリップ数の多いランは DT_STEPS=20 程度に落とすと現実的な時間に収まる。
# - DT_STRENGTH でimg2imgの変化量（0〜1）を上書きできる。
set -euo pipefail

MODEL="${DT_MODEL:-qwen_image_edit_2511_q6p.ckpt}"

if ! command -v draw-things-cli >/dev/null 2>&1; then
  cat >&2 <<MSG
ERROR: draw-things-cli が見つかりません。以下でインストールしてください（macOS 13+ / Linux）:

  brew install drawthingsai/draw-things/draw-things-cli

（Homebrew自体が無い場合は https://brew.sh の手順で先に導入する）

インストール後、使用モデルを取得します（初回のみ・十数GBのダウンロード）:

  draw-things-cli models ensure --model ${MODEL}
MSG
  exit 1
fi

if [ $# -lt 2 ]; then
  echo "usage: dt_generate.sh <output.png> <input_image.png|none> [seed] [WxH] <<'EOF' ... EOF" >&2
  exit 1
fi

OUT="$1"
IMG="$2"
SEED="${3:-$((RANDOM * 32768 + RANDOM))}"
SIZE="${4:-1024x576}"
WIDTH="${SIZE%x*}"
HEIGHT="${SIZE#*x}"

if [ $((WIDTH % 64)) -ne 0 ] || [ $((HEIGHT % 64)) -ne 0 ]; then
  echo "ERROR: width/height must be multiples of 64: ${SIZE}" >&2
  exit 1
fi

ARGS=(generate --model "$MODEL" --prompt-file - --output "$OUT"
      --width "$WIDTH" --height "$HEIGHT" --seed "$SEED" --disable-preview)

if [ "$IMG" != "none" ]; then
  if [ ! -f "$IMG" ]; then
    echo "ERROR: input image not found: $IMG" >&2
    exit 1
  fi
  ARGS+=(--image "$IMG")
fi

if [ -n "${DT_STRENGTH:-}" ]; then
  ARGS+=(--strength "$DT_STRENGTH")
fi

if [ -n "${DT_STEPS:-}" ]; then
  ARGS+=(--steps "$DT_STEPS")
fi

draw-things-cli "${ARGS[@]}"

echo "model: $MODEL"
echo "seed:  $SEED"
echo "saved: $OUT"
