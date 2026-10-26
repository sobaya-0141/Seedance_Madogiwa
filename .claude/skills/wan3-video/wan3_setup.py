#!/usr/bin/env python3
"""Check that this machine can call the Wan 3.0 API — and tell the user how to set it up if it cannot.

  python3 .claude/skills/wan3-video/wan3_setup.py

1. DASHSCOPE_API_KEY is present (environment or shell rc) — length only is shown, never the key.
2. DASHSCOPE_API_HOST (or DASHSCOPE_WORKSPACE_ID + DASHSCOPE_REGION) is present.
3. A free authentication probe: GET /tasks/<all-zero id>. HTTP 200 with task_status UNKNOWN = key and host match.
   Nothing is generated and nothing is billed.
Exit 0 = ready, 1 = not set up (the setup instructions are printed), 2 = set but rejected.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wan3_common import SETUP_HELP, api_base, call, env  # noqa: E402


def main() -> None:
    key, base = env("DASHSCOPE_API_KEY"), api_base()
    print(f"DASHSCOPE_API_KEY: {'set (' + str(len(key)) + ' chars)' if key else 'NOT SET'}")
    print(f"API host:          {base.split('/')[2] if base else 'NOT SET'}")
    if not key or not base:
        print()
        print(SETUP_HELP)
        sys.exit(1)
    res = call("GET", f"{base}/tasks/00000000-0000-0000-0000-000000000000", key)
    status = res.get("output", {}).get("task_status")
    if status == "UNKNOWN":
        print("OK: authentication works (free probe, nothing generated)")
        sys.exit(0)
    print(f"unexpected response: {res}")
    sys.exit(2)


if __name__ == "__main__":
    main()
