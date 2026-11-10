#!/bin/bash
# Download finished chapters (and logs) from a Vast.ai instance into the run directory.
# usage: vast_fetch.sh <host> <port> <run_dir> <rev>
#   → <run_dir>/out_<rev>/  (chN.mp4, bench_log.csv, the run log)
# Safe to run while generation is still going (fetches what is done so far). After the final fetch,
# DESTROY the instance in the Vast.ai console — a stopped instance still bills for its disk.
set -eu
HOST=$1; PORT=$2; RUN=${3%/}; REV=$4
NAME=$(basename "$RUN")
OUT="$RUN/out_$REV"
mkdir -p "$OUT"
scp -P "$PORT" "root@$HOST:/content/drive/MyDrive/h3_outputs/${NAME}_${REV}/*" "$OUT/" || true
scp -P "$PORT" "root@$HOST:/root/h3_run.log" "$OUT/vast_h3_run.log" || true
ls -la "$OUT"
