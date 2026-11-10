#!/usr/bin/env python3
"""Run a build_h3_run_package.py notebook (made for Colab) unchanged on a Vast.ai GPU instance.

The notebook's own "★ 一括実行" cell is executed inside a real IPython shell (so %%bash cells and
get_ipython() work), with a small stand-in for the google.colab module:
  - drive.mount / flush_and_unmount: "Google Drive" is just the local directory /content/drive/MyDrive
  - _message.blocking_request("get_ipynb"): returns the notebook read from disk (with the overrides below)
  - runtime.unassign: does nothing (the instance is NOT destroyed — destroy it from the Vast.ai console)
  - files / output: no-ops (no browser here)

Overrides applied to cell 1 of the notebook:
  - WORKERS = 1            (A100 40GB with WORKERS=2 can crash at VAE decode on >=243-frame chapters)
  - AUTO_SHUTDOWN = False  (nothing to shut down; we keep the instance until results are fetched)
  - QUEUE_DIR = ""         (no queue folder on this machine)

usage (on the instance, after vast_send.sh copied the files):
  python3 vast_h3_run.py <notebook.ipynb> [--workers N]
Results land in /content/drive/MyDrive/h3_outputs/<run>/ (the notebook's OUT_DRIVE_DIR); vast_fetch.sh downloads them.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import types


def patch_cell1(nb: dict, workers: str) -> None:
    for c in nb["cells"]:
        src = c["source"] if isinstance(c["source"], str) else "".join(c["source"])
        if src.lstrip().startswith("#@title 1."):
            src = re.sub(r'^WORKERS = .*$', f"WORKERS = {workers}  # vast_h3_run.py override", src, count=1, flags=re.M)
            src = re.sub(r'^AUTO_SHUTDOWN = .*$', "AUTO_SHUTDOWN = False  # vast_h3_run.py override", src, count=1, flags=re.M)
            src = re.sub(r'^QUEUE_DIR = .*$', 'QUEUE_DIR = ""  # vast_h3_run.py override', src, count=1, flags=re.M)
            c["source"] = src
            return
    raise SystemExit("cell '#@title 1.' not found — is this a build_h3_run_package.py notebook?")


def install_colab_stub(nb: dict) -> None:
    colab = types.ModuleType("google.colab")
    drive = types.ModuleType("google.colab.drive")
    drive.mount = lambda path, force_remount=False, **kw: os.makedirs(os.path.join(path, "MyDrive"), exist_ok=True)
    drive.flush_and_unmount = lambda *a, **kw: subprocess.run(["sync"])
    files = types.ModuleType("google.colab.files")

    def _upload():
        raise RuntimeError("no browser upload on Vast.ai — put the bundle zip in /content/drive/MyDrive/h3_inputs/")
    files.upload = _upload
    files.download = lambda p: print(f"(download skipped on Vast.ai: {p} — use vast_fetch.sh)")
    runtime = types.ModuleType("google.colab.runtime")
    runtime.unassign = lambda: print("★ (Vast.ai) runtime.unassign skipped — fetch the results, then DESTROY the instance "
                                     "in the Vast.ai console to stop billing", flush=True)
    output = types.ModuleType("google.colab.output")
    output.serve_kernel_port_as_iframe = lambda *a, **kw: None
    message = types.ModuleType("google.colab._message")
    message.blocking_request = lambda kind, **kw: {"ipynb": nb}
    for name, mod in (("drive", drive), ("files", files), ("runtime", runtime), ("output", output), ("_message", message)):
        setattr(colab, name, mod)
        sys.modules[f"google.colab.{name}"] = mod
    google = sys.modules.get("google") or types.ModuleType("google")
    google.colab = colab
    sys.modules["google"] = google
    sys.modules["google.colab"] = colab


def main() -> None:
    args = sys.argv[1:]
    workers = "1"
    if "--workers" in args:
        i = args.index("--workers")
        workers = args[i + 1]
        del args[i:i + 2]
    if len(args) != 1:
        raise SystemExit(__doc__)
    nb = json.load(open(args[0], encoding="utf-8"))
    patch_cell1(nb, workers)
    # Colab has these preinstalled; a fresh Vast.ai image may not (and apt has no package lists yet)
    if subprocess.run(["sh", "-c", "command -v aria2c && command -v git"], capture_output=True).returncode:
        subprocess.run(["sh", "-c", "apt-get update -q && apt-get install -yq aria2 git"], check=True)
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "ipython", "psutil"], check=True)
    import torch
    assert torch.cuda.is_available(), "no CUDA GPU visible — pick a PyTorch template on a GPU instance"
    print(f"★ Vast.ai: {torch.cuda.get_device_name(0)} / torch {torch.__version__}", flush=True)
    for d in ("/content/drive/MyDrive/h3_inputs", "/content/drive/MyDrive/h3_outputs"):
        os.makedirs(d, exist_ok=True)
    install_colab_stub(nb)
    try:
        from IPython.core.interactiveshell import InteractiveShell
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "ipython"], check=True)
        from IPython.core.interactiveshell import InteractiveShell
    os.chdir("/content")
    shell = InteractiveShell.instance()
    runner = next(("".join(c["source"]) if not isinstance(c["source"], str) else c["source"])
                  for c in nb["cells"] if "RUN_ALL_CELL_MARKER" in "".join(c["source"]))
    print(f"★ Vast.ai: running the notebook's batch cell (WORKERS={workers})", flush=True)
    res = shell.run_cell(runner)
    if not res.success or shell.user_ns.get("_ra_err") is not None:
        raise SystemExit(f"FAILED: {shell.user_ns.get('_ra_err') or res.error_in_exec}")
    print("★ Vast.ai: done. Results:", shell.user_ns.get("OUT_DRIVE_DIR"), flush=True)


if __name__ == "__main__":
    main()
