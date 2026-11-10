#!/bin/bash
# Copy an H3 run package to a Vast.ai instance and start generation in the background (survives SSH disconnects).
# usage: vast_send.sh <host> <port> <run_dir> <rev>
#   e.g. vast_send.sh 123.45.67.89 41234 03_SCRIPTS/49_sobaya_musou_gameplay_target v2hit
#   <host>/<port>: from the instance's "Connect" → SSH command (ssh -p <port> root@<host>)
#   <rev>: the package suffix made by build_h3_run_package.py (h3/<run>_h3_bundle_<rev>.zip / _h3_r2v_<rev>.ipynb)
# Progress:  ssh -p <port> root@<host> tail -f /root/h3_run.log
set -eu
HOST=$1; PORT=$2; RUN=${3%/}; REV=$4
NAME=$(basename "$RUN")
ZIP="$RUN/h3/${NAME}_h3_bundle_${REV}.zip"
NB=$(ls "$RUN"/h3/${NAME}_h3_*_${REV}.ipynb | head -1)
[ -f "$ZIP" ] || { echo "missing $ZIP"; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"
SSH="ssh -p $PORT -o StrictHostKeyChecking=accept-new root@$HOST"
$SSH "mkdir -p /content/drive/MyDrive/h3_inputs /content/drive/MyDrive/h3_outputs && nvidia-smi --query-gpu=name,memory.total --format=csv,noheader && df -h / | tail -1"
scp -P "$PORT" "$ZIP" "root@$HOST:/content/drive/MyDrive/h3_inputs/"
scp -P "$PORT" "$NB" "$HERE/vast_h3_run.py" "root@$HOST:/root/"
# Vast.ai PyTorch images keep torch in /venv/main (not the system python); put it first on PATH so the
# notebook's %%bash "pip install" goes into the same environment
$SSH "cd /root && export PATH=/venv/main/bin:\$PATH && nohup python vast_h3_run.py '$(basename "$NB")' > /root/h3_run.log 2>&1 &"
echo "started. progress: $SSH tail -f /root/h3_run.log"
