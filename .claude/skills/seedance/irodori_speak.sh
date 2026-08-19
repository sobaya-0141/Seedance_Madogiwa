#!/bin/bash
# Irodori-TTS（ゼロショットボイスクローン）でセリフ音声(wav)を1つ生成する
# 使い方: irodori_speak.sh "セリフテキスト" 出力ファイル.wav 参照音声.wav [シード値] [話速倍率] [尺秒数]
# 参照音声はキャラごとに 02_CHARACTERS/VOICE_CAST.md（正典）で指定された <キャラ>_voice.wav を使う。
# 事前学習は不要（毎回の合成時に参照音声を渡すゼロショット方式）。
# 話速倍率は 1.0=等速、1.2=1.2倍速（内部で infer.py の --duration-scale=1/倍率 に変換。
# モデル自体が早口で生成するためピッチは変わらない。省略時はモデルの予測尺のまま）。
# 尺秒数を指定すると生成尺（キャンバス長）をその秒数に固定する（--seconds。話速倍率より優先）。
# 短いセリフはモデルの尺予測が長すぎて話速倍率が効かないことがあるため、その場合は
# 「等速テイクの実測長 ÷ 倍率」をここで直接指定する（話速倍率の位置は "" で飛ばす）。
# Irodori-TTS本体の設置場所は IRODORI_TTS_DIR（既定: ~/irodori_tts）。
# 実行時に上流（GitHub origin/main）を確認し、新バージョンが公開されていれば自動更新する
# （チェックは24時間に1回。IRODORI_TTS_NO_UPDATE=1 で無効化できる）。
# 使用チェックポイントは上流リポジトリの推奨最新を自動選択する。過去テイクをシードで
# 再現したいときは IRODORI_TTS_CHECKPOINT=Aratako/Irodori-TTS-500M-v3 のように当時のモデルを指定する。
set -eu

TEXT="${1:?セリフテキストを指定してください}"
OUT="${2:?出力wavパスを指定してください}"
REF="${3:?参照音声wavを指定してください（02_CHARACTERS/VOICE_CAST.md参照）}"
SEED="${4:-}"
SPEED="${5:-}"
FIXSEC="${6:-}"
TTS_DIR="${IRODORI_TTS_DIR:-$HOME/irodori_tts}"

[ -f "$REF" ] || { echo "ERROR: 参照音声が見つかりません: $REF" >&2; exit 1; }
if [ ! -f "$TTS_DIR/infer.py" ]; then
  echo "ERROR: Irodori-TTSが見つかりません: $TTS_DIR" >&2
  echo "セットアップ（最新版が入る）: git clone https://github.com/Aratako/Irodori-TTS.git ~/irodori_tts && cd ~/irodori_tts && uv sync --extra cpu" >&2
  exit 1
fi

# --- 実行時の最新版チェック＆自動更新 ---
# fetch（ネットワークアクセス）は24時間に1回に抑えるが、取得済みのorigin/mainより
# 遅れていれば毎回検出して更新する（fetchを省略した回でも取りこぼさない）。
if [ -z "${IRODORI_TTS_NO_UPDATE:-}" ] && [ -e "$TTS_DIR/.git" ]; then
  FETCH_HEAD="$TTS_DIR/.git/FETCH_HEAD"
  if [ ! -f "$FETCH_HEAD" ] || [ -z "$(find "$FETCH_HEAD" -mmin -1440 2>/dev/null)" ]; then
    git -C "$TTS_DIR" fetch --quiet origin main 2>/dev/null \
      || echo "WARN: Irodori-TTS上流の更新確認に失敗しました（オフライン？）。現行バージョンのまま続行します" >&2
  fi
  BEHIND=$(git -C "$TTS_DIR" rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
  if [ "${BEHIND:-0}" -gt 0 ]; then
    if [ -z "$(git -C "$TTS_DIR" status --porcelain 2>/dev/null)" ]; then
      echo "INFO: Irodori-TTSの新バージョンが公開されています（${BEHIND}コミット差分）。更新します…" >&2
      if git -C "$TTS_DIR" merge --ff-only --quiet origin/main >&2 \
         && (cd "$TTS_DIR" && uv sync --extra "${IRODORI_TTS_SYNC_EXTRA:-cpu}" >&2); then
        echo "INFO: Irodori-TTSを最新版に更新しました（$(git -C "$TTS_DIR" log -1 --format='%h %s')）" >&2
      else
        echo "WARN: 自動更新に失敗したため現行バージョンのまま続行します" >&2
      fi
    else
      echo "WARN: $TTS_DIR に未コミットの変更があるため自動更新をスキップしました" >&2
    fi
  fi
fi

# --- 使用チェックポイントの決定（上流の推奨最新をgradio_app.pyの既定値から導出） ---
CKPT="${IRODORI_TTS_CHECKPOINT:-}"
if [ -z "$CKPT" ]; then
  CKPT=$(grep -o 'Aratako/Irodori-TTS-[A-Za-z0-9.-]*' "$TTS_DIR/gradio_app.py" 2>/dev/null | head -1 || true)
fi
if [ -z "$CKPT" ]; then
  CKPT="Aratako/Irodori-TTS-v4.1-Small"
  echo "WARN: 上流の推奨チェックポイントを導出できなかったため $CKPT を使います" >&2
fi

# 出力先を絶対パスにする（infer.pyはTTS_DIRで実行するため）
case "$OUT" in
  /*) : ;;
  *) OUT="$PWD/$OUT" ;;
esac
case "$REF" in
  /*) : ;;
  *) REF="$PWD/$REF" ;;
esac

SEED_ARGS=()
[ -n "$SEED" ] && SEED_ARGS=(--seed "$SEED")

SPEED_ARGS=()
if [ -n "$FIXSEC" ]; then
  python3 -c "s=float('$FIXSEC'); assert s>0" \
    || { echo "ERROR: 尺秒数が不正です: $FIXSEC" >&2; exit 1; }
  SPEED_ARGS=(--seconds "$FIXSEC")
elif [ -n "$SPEED" ]; then
  DS=$(python3 -c "s=float('$SPEED'); assert s>0; print(f'{1/s:.4f}')") \
    || { echo "ERROR: 話速倍率が不正です: $SPEED" >&2; exit 1; }
  SPEED_ARGS=(--duration-scale "$DS")
fi

(cd "$TTS_DIR" && uv run --no-sync python infer.py \
  --hf-checkpoint "$CKPT" \
  --text "$TEXT" \
  --ref-wav "$REF" \
  --output-wav "$OUT" \
  ${SEED_ARGS[@]+"${SEED_ARGS[@]}"} ${SPEED_ARGS[@]+"${SPEED_ARGS[@]}"} >&2)

head -c 4 "$OUT" | grep -q RIFF || { echo "ERROR: 合成に失敗しました（上のログ参照）" >&2; rm -f "$OUT"; exit 1; }

# 前後の無音をトリムする（先頭~0.1s・末尾~0.2sだけ残す）。
# 長い無音はSeedance添付時に口パクの開始位置を狂わせる（リップシンクずれの原因）。
if command -v ffmpeg >/dev/null 2>&1; then
  TMP="${OUT%.wav}.trim.wav"
  ffmpeg -y -v error -i "$OUT" -af "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.1,areverse,silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.2,areverse" "$TMP" \
    && mv "$TMP" "$OUT" || { rm -f "$TMP"; echo "WARN: 無音トリムに失敗したため未トリムのまま出力します" >&2; }
else
  echo "WARN: ffmpegが無いため無音トリムをスキップしました（Seedanceでリップシンクがずれやすくなります）" >&2
fi

DUR=$(python3 -c "
import wave
w = wave.open('$OUT')
print(f'{w.getnframes()/w.getframerate():.2f}')
")
echo "OK: $OUT (${DUR}s, model=${CKPT#Aratako/}, ref=$(basename "$REF")${SEED:+, seed=$SEED}${SPEED:+, speed=${SPEED}x}${FIXSEC:+, seconds=$FIXSEC})"
