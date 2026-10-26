"""Shared helpers for the /wan3-video tools: credentials, API host, HTTP calls.

Credentials are read from the environment first, then from `export NAME=...` lines in the usual shell rc files
(Claude Code's / Codex's shells are often non-interactive and never source ~/.zshrc). The API key is never printed.
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path

RC_FILES = [".zshrc", ".zprofile", ".zshenv", ".bashrc", ".bash_profile", ".profile"]
DEFAULT_REGION = "ap-southeast-1"   # the user's key and workspace are in Singapore (2026-10)


def env(name: str, default: str | None = None) -> str | None:
    if os.environ.get(name):
        return os.environ[name]
    for rc in RC_FILES:
        p = Path.home() / rc
        if not p.is_file():
            continue
        for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
            m = re.match(rf"""\s*export\s+{name}=['"]?([^'"\s]+)['"]?\s*$""", line)
            if m:
                return m.group(1)
    return default


def api_base() -> str | None:
    """https://<host>/api/v1 from DASHSCOPE_API_HOST (the host part of Model Studio's "Pay-as-you-go Base URL",
    e.g. ws-xxxxxxxx.ap-southeast-1.maas.aliyuncs.com), or DASHSCOPE_WORKSPACE_ID + DASHSCOPE_REGION."""
    host = env("DASHSCOPE_API_HOST")
    if host:
        host = re.sub(r"^https?://", "", host).split("/")[0]
    else:
        ws = env("DASHSCOPE_WORKSPACE_ID")
        if not ws:
            return None
        host = f"{ws}.{env('DASHSCOPE_REGION', DEFAULT_REGION)}.maas.aliyuncs.com"
    return f"https://{host}/api/v1"


def call(method: str, url: str, key: str, body: dict | None = None) -> dict:
    # X-DashScope-Async only on task creation: a GET carrying it is rejected with
    # 403 "current user api does not support asynchronous calls" (measured 2026-10-23).
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if method == "POST":
        headers["X-DashScope-Async"] = "enable"
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code} {method} {url.split('?')[0]}: {e.read().decode(errors='replace')[:800]}")


SETUP_HELP = """\
Wan 3.0 (Alibaba Cloud Model Studio) の認証情報がこの端末に設定されていません。次の手順で設定してください。

1. Model Studio のコンソール（https://modelstudio.console.alibabacloud.com/）で API Key ページを開く。
   「Create API Key」でキーを作り、同じページの「Pay-as-you-go Base URL」のホスト名
   （例: ws-xxxxxxxx.ap-southeast-1.maas.aliyuncs.com）を控える。キー・ホスト・モデルは同じリージョンにそろえる。
2. ターミナルで次を実行する（キーは画面に表示されず、履歴にも残らない。チャットには貼らない）:

   read -s "KEY?DASHSCOPE_API_KEY: " && echo "export DASHSCOPE_API_KEY='$KEY'" >> ~/.zshrc && unset KEY && echo && echo saved

   echo "export DASHSCOPE_API_HOST='<控えたホスト名>'" >> ~/.zshrc

   （bash の端末なら ~/.zshrc を ~/.bashrc に、read -s "KEY?..." を read -s -p "DASHSCOPE_API_KEY: " KEY に読み替える）
3. もう一度 python3 .claude/skills/wan3-video/wan3_setup.py を実行して「OK」になることを確認する。
"""
