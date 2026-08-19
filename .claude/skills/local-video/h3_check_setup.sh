#!/bin/bash
# ローカル動画制作（MiniMax H3）ワークフローの導入状態チェック。
# 未導入コンポーネントごとに、公式ドキュメントに基づく導入手順を表示する。
#
# usage: .claude/skills/local-video/h3_check_setup.sh
#
# 環境変数:
#   COMFYUI_DIR   ComfyUIの設置場所（デフォルト: ~/ComfyUI）
#   OLLAMA_VLM    画像検証に使うVLMモデル（デフォルト: qwen3-vl:32b）
set -uo pipefail

# ---- Platform gate: H3 video generation requires NVIDIA CUDA ----------------
# Measured 2026-08 on M1 Pro/32GB: ALL four weight variants fail on Apple Silicon
#   int8_convrot -> aten::_int_mm has no MPS kernel (no fallback in comfy_kitchen)
#   fp8_scaled   -> Float8_e4m3fn dtype undefined on MPS
#   nvfp4_awq    -> NVIDIA-only quantisation
#   bf16         -> MPS OOM at 41.8/42.4 GiB even at 90 frames / 640x384 / 2 steps
# Check this BEFORE downloading ~130GB of weights.
if [ "$(uname -s)" = "Darwin" ]; then
  echo
  echo "================================================================"
  echo " WARNING: this machine is macOS / Apple Silicon."
  echo " MiniMax H3 VIDEO GENERATION (step 7) CANNOT RUN HERE."
  echo " Do NOT download the H3 weights on this machine expecting to"
  echo " generate video with them (~130GB for all variants)."
  echo
  echo " What DOES work locally on Apple Silicon:"
  echo "   step 3 script / step 4 Irodori-TTS+VOICEVOX audio /"
  echo "   step 5 draw-things-cli keyframes (~16-17 min/frame on M1 Pro) /"
  echo "   step 6 Qwen3-VL verification / step 8 ffmpeg assembly"
  echo
  echo " Recommended: finish steps 1-6 here, build the portable input"
  echo " bundle, and run step 7 on a CUDA machine."
  echo " See the 'Macで動く工程 / CUDAが必要な工程' section in SKILL.md"
  echo " and 03_SCRIPTS/26_kansha_no_bug_ichimankai/RUNBOOK_CUDA.md"
  echo "================================================================"
  echo
  IS_DARWIN=1
else
  IS_DARWIN=0
  if command -v nvidia-smi >/dev/null 2>&1; then
    echo "== GPU =="
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>/dev/null
  else
    echo "WARNING: nvidia-smi not found. MiniMax H3 needs an NVIDIA CUDA GPU for step 7."
  fi
  echo
fi
COMFYUI_DIR="${COMFYUI_DIR:-$HOME/ComfyUI}"
OLLAMA_VLM="${OLLAMA_VLM:-qwen3-vl:32b}"
MISSING=0

section() { printf '\n== %s ==\n' "$1"; }
ok()      { printf 'OK:      %s\n' "$1"; }
missing() { printf 'MISSING: %s\n' "$1"; MISSING=1; }

section "ComfyUI (MiniMax H3 実行基盤)"
if [ -f "$COMFYUI_DIR/main.py" ]; then
  ok "ComfyUI at $COMFYUI_DIR"
else
  missing "ComfyUI が $COMFYUI_DIR にありません"
  cat <<'MSG'
  導入手順（公式: https://docs.comfy.org/ を必ず確認すること）:
    git clone https://github.com/comfyanonymous/ComfyUI ~/ComfyUI
    cd ~/ComfyUI && pip3 install -r requirements.txt
  （既存インストールがある場合は v0.30.0 以上へ更新する。
   別の場所に置く場合は COMFYUI_DIR で指定する）
MSG
fi

section "MiniMax H3 モデルファイル"
for f in \
  "diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors" \
  "diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors" \
  "vae/minimax_h3_video_vae_fp16.safetensors" \
  "vae/minimax_h3_audio_vae_fp32.safetensors"; do
  if [ -f "$COMFYUI_DIR/models/$f" ]; then
    ok "$f"
  else
    missing "$COMFYUI_DIR/models/$f"
  fi
done
if ls "$COMFYUI_DIR/models/text_encoders/"qwen3vl_32b_minimax_h3_*.safetensors >/dev/null 2>&1; then
  ok "text encoder: $(ls "$COMFYUI_DIR/models/text_encoders/" | grep '^qwen3vl_32b_minimax_h3_' | tr '\n' ' ')"
else
  missing "text encoder (qwen3vl_32b_minimax_h3_*.safetensors)"
fi
if [ "$MISSING" -ne 0 ]; then
  cat <<'MSG'
  モデル取得（公式チュートリアル: https://docs.comfy.org/tutorials/video/minimax/minimax-h3 、
  配布元: https://huggingface.co/Comfy-Org/MiniMax-H3 。数十GBあるので開始前にユーザーへ確認する）:
    hf download Comfy-Org/MiniMax-H3 \
      --include "diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors" \
                "diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors" \
                "vae/*" \
      --local-dir ~/ComfyUI/models
  テキストエンコーダはGPU世代で選ぶ（Blackwell=NVFP4 / Ada,Hopper,Ampere=INT8 / VRAM 80GB+=bf16）。Apple SiliconではどのバリアントもH3を実行できない
  （https://huggingface.co/Comfy-Org/MiniMax-H3/tree/main/text_encoders で最新のファイル名を確認）。
MSG
fi

section "APIワークフローJSON（初回にComfyUIからExport (API)で保存）"
for wf in h3_i2v_api.json h3_r2v_api.json; do
  if [ -f "$(dirname "$0")/workflows/$wf" ]; then
    ok "workflows/$wf"
  else
    missing "workflows/$wf — ComfyUIで公式テンプレート(MiniMax H3 I2V/R2V)を開き Export (API) で保存する"
  fi
done

section "Ollama + Qwen3-VL（キーフレーム画像の検証）"
if command -v ollama >/dev/null 2>&1; then
  ok "ollama CLI"
  if ollama list 2>/dev/null | grep -q "^${OLLAMA_VLM%%:*}"; then
    ok "model ${OLLAMA_VLM%%:*}* is pulled"
  else
    missing "VLMモデル ${OLLAMA_VLM} が未取得"
    echo "  取得: ollama pull ${OLLAMA_VLM}"
    echo "  （タグは https://ollama.com/library/qwen3-vl で確認。メモリの少ないマシンは qwen3-vl:8b）"
  fi
else
  missing "ollama が未導入"
  cat <<'MSG'
  導入手順（公式: https://ollama.com/download ）:
    brew install ollama
    ollama pull qwen3-vl:32b   # 64GB未満のマシンは qwen3-vl:8b
MSG
fi

section "draw-things-cli + Qwen Image Edit 2511（キーフレーム生成）"
if command -v draw-things-cli >/dev/null 2>&1; then
  ok "draw-things-cli"
  if draw-things-cli models list --downloaded-only 2>/dev/null | grep -q "qwen_image_edit_2511_q6p"; then
    ok "model qwen_image_edit_2511_q6p.ckpt"
  else
    missing "モデル qwen_image_edit_2511_q6p.ckpt（取得: draw-things-cli models ensure --model qwen_image_edit_2511_q6p.ckpt）"
  fi
else
  missing "draw-things-cli（導入: brew install drawthingsai/draw-things/draw-things-cli）"
fi

section "音声合成（Irodori-TTS / VOICEVOX）"
if [ -d "$HOME/irodori_tts" ]; then
  # 上流に新バージョンが公開されていないか確認する（実際の更新はirodori_speak.shが実行時に自動で行う）
  if [ -e "$HOME/irodori_tts/.git" ] && git -C "$HOME/irodori_tts" fetch --quiet origin main 2>/dev/null; then
    BEHIND=$(git -C "$HOME/irodori_tts" rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
    if [ "${BEHIND:-0}" -gt 0 ]; then
      ok "~/irodori_tts（上流に新バージョンあり: ${BEHIND}コミット差分。次のirodori_speak.sh実行時に自動更新される）"
    else
      ok "~/irodori_tts（最新）"
    fi
  else
    ok "~/irodori_tts（上流の更新確認はスキップ）"
  fi
else
  missing "~/irodori_tts（https://github.com/Aratako/Irodori-TTS の手順で最新版を導入: git clone https://github.com/Aratako/Irodori-TTS.git ~/irodori_tts && cd ~/irodori_tts && uv sync --extra cpu）"
fi
[ -d "$HOME/voicevox_engine" ] && ok "~/voicevox_engine" || missing "~/voicevox_engine（VOICEVOXヘッドレスエンジン）"

section "ffmpeg（結合・パディング・クレジット焼き込み）"
command -v ffmpeg >/dev/null 2>&1 && ok "ffmpeg" || missing "ffmpeg（導入: brew install ffmpeg）"

echo
if [ "$MISSING" -ne 0 ]; then
  echo "RESULT: 未導入のコンポーネントがあります。上記の手順と公式ドキュメントに従って導入してから作業を開始してください。"
  exit 1
fi
echo "RESULT: すべて導入済みです。"
