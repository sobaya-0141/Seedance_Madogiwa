#!/bin/bash
# Irodori-TTS（ゼロショットボイスクローン）でセリフ音声(wav)を1つ生成する
# 使い方: irodori_speak.sh "セリフテキスト" 出力ファイル.wav 参照音声.wav [シード値] [話速倍率] [尺秒数]
# 参照音声はキャラごとに 02_CHARACTERS/VOICE_CAST.md（正典）で指定された <キャラ>_voice.wav を使う。
# 事前学習は不要（毎回の合成時に参照音声を渡すゼロショット方式）。
# 話速倍率を省略すると2026-11-23の全話者標準（02_CHARACTERS/VOICE_CAST.md）で生成する:
#   本文CFG 4.0、生成尺倍率（--duration-scale）を句読点・空白・記号を除く実発話文字数nから自動選択
#   （n>=10: 0.85 / 6〜9: 0.70 / 5以下: 0.50）。環境変数 IRODORI_DURATION_SCALE で倍率を直接指定でき、
#   IRODORI_CFG_SCALE_TEXT で本文CFGを上書きできる。
# 話速倍率は 1.0=等速、1.2=1.2倍速（内部で infer.py の --duration-scale=1/倍率 に変換。
# モデル自体が早口で生成するためピッチは変わらない。指定すると自動選択より優先）。
# 尺秒数を指定すると生成尺（キャンバス長）をその秒数に固定する（--seconds。話速倍率より優先）。
# 短いセリフはモデルの尺予測が長すぎて話速倍率が効かないことがあるため、その場合は
# 「等速テイクの実測長 ÷ 倍率」をここで直接指定する（話速倍率の位置は "" で飛ばす）。
# Irodori-TTS本体の設置場所は IRODORI_TTS_DIR（既定: ~/irodori_tts）。
# 実行時に上流（GitHub origin/main）を確認し、新バージョンが公開されていれば自動更新する
# （チェックは24時間に1回。IRODORI_TTS_NO_UPDATE=1 で無効化できる）。
# 使用チェックポイントは全キャラ統一で Aratako/Irodori-TTS-v4.1-Small（2026-11-23ユーザー指定。
# そば屋も含む）。過去テイクをシードで再現したいときは
# IRODORI_TTS_CHECKPOINT=Aratako/Irodori-TTS-v4-Large のように当時のモデルを指定する。
# v4-LargeはテキストエンコーダにT5Gemma 2を使うため Gemma Terms of Use が適用される
# （なりすまし・ディープフェイク禁止。参照音声は本人同意の範囲でのみ使う）。
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

# --- 使用チェックポイントの決定 ---
# プロジェクト正典は v4.1-Small（02_CHARACTERS/VOICE_CAST.md 参照）。IRODORI_TTS_CHECKPOINT で上書きできる。
DEFAULT_CKPT="Aratako/Irodori-TTS-v4.1-Small"
CKPT="${IRODORI_TTS_CHECKPOINT:-$DEFAULT_CKPT}"
if ! grep -q 'def default_runtime_device' "$TTS_DIR/irodori_tts/inference_runtime.py" 2>/dev/null \
   || ! grep -qi 't5gemma' "$TTS_DIR/irodori_tts/model.py" 2>/dev/null; then
  case "$CKPT" in
    *v4-Large*) echo "ERROR: 設置済みのIrodori-TTSコードが古く v4-Large に未対応です。cd $TTS_DIR && git pull --ff-only && uv sync --extra cpu で更新してください（自動更新に失敗した場合は上のWARN参照）" >&2; exit 1 ;;
  esac
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
is_positive() { python3 -c "import sys; assert float(sys.argv[1]) > 0" "$1" 2>/dev/null; }

# 本文CFG（2026-11-23標準 4.0。infer.py自体の既定は3.0）
CFG="${IRODORI_CFG_SCALE_TEXT:-4.0}"
is_positive "$CFG" || { echo "ERROR: IRODORI_CFG_SCALE_TEXTが不正です: $CFG" >&2; exit 1; }

# 生成尺: 尺秒数 > 話速倍率 > IRODORI_DURATION_SCALE > 実発話文字数からの自動選択
SPOKEN_CHARS=$(python3 -c 'import sys, unicodedata; print(sum(1 for c in sys.argv[1] if unicodedata.category(c)[0] not in "PZSC"))' "$TEXT")
DS=""
if [ -n "$FIXSEC" ]; then
  is_positive "$FIXSEC" || { echo "ERROR: 尺秒数が不正です: $FIXSEC" >&2; exit 1; }
  SPEED_ARGS=(--seconds "$FIXSEC")
else
  if [ -n "$SPEED" ]; then
    is_positive "$SPEED" || { echo "ERROR: 話速倍率が不正です: $SPEED" >&2; exit 1; }
    DS=$(python3 -c "import sys; print(f'{1/float(sys.argv[1]):.4f}')" "$SPEED")
  elif [ -n "${IRODORI_DURATION_SCALE:-}" ]; then
    is_positive "$IRODORI_DURATION_SCALE" || { echo "ERROR: IRODORI_DURATION_SCALEが不正です: $IRODORI_DURATION_SCALE" >&2; exit 1; }
    DS="$IRODORI_DURATION_SCALE"
  elif [ "$SPOKEN_CHARS" -ge 10 ]; then
    DS="0.85"
  elif [ "$SPOKEN_CHARS" -ge 6 ]; then
    DS="0.70"
  else
    DS="0.50"
  fi
  SPEED_ARGS=(--duration-scale "$DS")
fi

(cd "$TTS_DIR" && uv run --no-sync python infer.py \
  --hf-checkpoint "$CKPT" \
  --text "$TEXT" \
  --ref-wav "$REF" \
  --output-wav "$OUT" \
  --cfg-scale-text "$CFG" \
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
echo "OK: $OUT (${DUR}s, model=${CKPT#Aratako/}, ref=$(basename "$REF")${SEED:+, seed=$SEED}${SPEED:+, speed=${SPEED}x}${FIXSEC:+, seconds=$FIXSEC}${DS:+, duration_scale=$DS}, text_cfg=$CFG, spoken_chars=$SPOKEN_CHARS)"
