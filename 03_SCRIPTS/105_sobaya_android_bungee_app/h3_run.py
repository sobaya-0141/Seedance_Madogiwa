#!/usr/bin/env python3
"""API形式のワークフローJSONをComfyUIに投入し、完了を待って出力動画を回収する。

前提:
- ComfyUIが起動済みであること（cd ~/ComfyUI && python3 main.py --listen 127.0.0.1 --port 8188）
- ワークフローJSONは ComfyUI の「Export (API)」形式で、入力ファイル名・プロンプト・尺などを
  そのチャプターのH3 inputs表どおりに書き換え済みであること
- JSONが参照する入力ファイル（PNG/WAV）は ComfyUI/input/ にコピー済みであること

usage:
  h3_run.py <workflow_api.json> --out <output.mp4> [--server 127.0.0.1:8188]

- 生成は長時間かかるので、この呼び出し自体をバックグラウンドで実行すること。
- 進捗はキュー状態のポーリングで標準出力に出す。
"""

from __future__ import annotations

import json
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def api(server: str, path: str, payload: dict | None = None) -> dict:
    url = f"http://{server}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"} if data else {}
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
    return json.loads(raw) if raw else {}


def main() -> None:
    args = sys.argv[1:]
    server = "127.0.0.1:8188"
    out_path = None
    if "--server" in args:
        i = args.index("--server")
        server = args[i + 1]
        del args[i : i + 2]
    if "--out" in args:
        i = args.index("--out")
        out_path = args[i + 1]
        del args[i : i + 2]
    if len(args) != 1 or out_path is None:
        fail("usage: h3_run.py <workflow_api.json> --out <output.mp4> [--server host:port]")

    workflow_path = args[0]
    try:
        with open(workflow_path, encoding="utf-8") as fh:
            graph = json.load(fh)
    except (OSError, json.JSONDecodeError) as error:
        fail(f"cannot read workflow JSON: {error}")

    try:
        api(server, "/system_stats")
    except (urllib.error.URLError, OSError):
        fail(
            f"ComfyUI is not reachable at {server} — start it first:\n"
            "  cd ~/ComfyUI && python3 main.py --listen 127.0.0.1 --port 8188"
        )

    client_id = uuid.uuid4().hex
    try:
        queued = api(server, "/prompt", {"prompt": graph, "client_id": client_id})
    except urllib.error.HTTPError as error:
        fail(f"ComfyUI rejected the workflow: {error.read().decode('utf-8', 'replace')}")
    if "error" in queued:
        fail(f"ComfyUI rejected the workflow: {json.dumps(queued, ensure_ascii=False)}")
    prompt_id = queued.get("prompt_id")
    if not prompt_id:
        fail(f"no prompt_id in response: {queued}")
    print(f"queued: prompt_id={prompt_id}")

    started = time.time()
    while True:
        time.sleep(15)
        history = api(server, f"/history/{prompt_id}")
        entry = history.get(prompt_id)
        if entry:
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                messages = json.dumps(status.get("messages", []), ensure_ascii=False)
                fail(f"generation failed: {messages}")
            if status.get("completed") or entry.get("outputs"):
                break
        elapsed = int(time.time() - started)
        print(f"waiting... {elapsed // 60}m{elapsed % 60:02d}s")

    outputs = entry.get("outputs", {})
    files = []
    for node_output in outputs.values():
        for key in ("videos", "gifs", "images", "audio"):
            for item in node_output.get(key, []):
                filename = item.get("filename", "")
                if filename.lower().endswith((".mp4", ".webm", ".mov")):
                    files.append(item)
    if not files:
        fail(f"no video file in outputs: {json.dumps(outputs, ensure_ascii=False)[:2000]}")

    item = files[0]
    query = urllib.parse.urlencode(
        {
            "filename": item["filename"],
            "subfolder": item.get("subfolder", ""),
            "type": item.get("type", "output"),
        }
    )
    with urllib.request.urlopen(f"http://{server}/view?{query}", timeout=600) as response, open(
        out_path, "wb"
    ) as out_file:
        shutil.copyfileobj(response, out_file)

    elapsed = int(time.time() - started)
    print(f"done in {elapsed // 60}m{elapsed % 60:02d}s")
    print(f"saved: {out_path}")


if __name__ == "__main__":
    main()
