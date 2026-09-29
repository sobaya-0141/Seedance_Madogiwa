#!/usr/bin/env python3
"""H3ラン一式を <ランディレクトリ>/h3/ に生成する（colab-videoスキル同梱ツール）。

生成物（3ファイル）:
  <slug>_h3_bundle.zip   従来のポータブルバンドル（除外規則も従来どおり＋h3/自身を除外）
  h3_colab_i2v.ipynb     I2Vチャプター専用ノートブック（セル1設定済み）
  h3_colab_r2v.ipynb     R2Vチャプター専用ノートブック（セル1設定済み）

ノートブックのセル1には以下が書き込まれる:
  CHAPTERS              = そのモードのチャプターだけ（workflowのunet_nameから自動分類）
  BUNDLE_ZIP_FROM_DRIVE = /content/drive/MyDrive/h3_inputs/<slug>_h3_bundle.zip
  OUT_DRIVE_DIR         = /content/drive/MyDrive/h3_outputs/<slug>

2本を別々のColabセッション（L4×2推奨）で同時に★一括実行すれば、I2V/R2Vが並列に回る
（モード毎にユニットが分かれているためユニット入れ替えも発生しない）。
片モードしか無いランは、そのモードのノートブック1本だけを生成する。

usage: python3 build_h3_run_package.py 03_SCRIPTS/<NN>_<slug>
"""
import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile

DRIVE_IN = "/content/drive/MyDrive/h3_inputs"
DRIVE_OUT = "/content/drive/MyDrive/h3_outputs"
ZIP_EXCLUDES = ["*/ref_canvas_*", "*/validation/*", "*/.DS_Store", "*/h3/*"]
# ノートブックが実行時に呼ぶファイル。1つでも欠けるとColabで初めて失敗する
# （2026-09-29の実測: h3_run.py が無いバンドルで全チャプターが即失敗し、
#  49GBの重みをDL済みのセッションを捨てることになった）。
REQUIRED_TOOLS = ["h3_run.py", "build_h3_workflow.py"]
SKILL_SOURCES = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "local-video"),
]
# 所要時間の目安（サンプリングはフレーム数×stepに線形）。
# 2026-09実測（L4+sage・83ラン ch3 158f）: 101.9 s/step ÷ (158f × 20step) = 0.645 s/frame/step。
# 既定は蒸留8step（正典ノートブックの TURBO_8STEP=True）なので8を掛ける。
L4_SEC_PER_FRAME_STEP = 0.645
STEPS = 8
L4_SAGE_SEC_PER_FRAME = L4_SEC_PER_FRAME_STEP * STEPS
OVERHEAD_MIN = 3                     # チャプターあたりのロード/VAE等


def classify_chapters(run_dir):
    """ch*_workflow.json を読み、{ch: (mode, frames)} を返す。modeは 'i2v'/'r2v'。"""
    out = {}
    for wf in sorted(glob.glob(os.path.join(run_dir, "ch*_workflow.json")),
                     key=lambda p: int(re.sub(r"\D", "", os.path.basename(p)) or 0)):
        ch = os.path.basename(wf)[: -len("_workflow.json")]
        g = json.load(open(wf))
        units = {str(v) for node in g.values()
                 for k, v in node.get("inputs", {}).items() if k == "unet_name"}
        frames = None
        for node in g.values():
            if str(node.get("class_type", "")).startswith("MiniMaxH3") and "length" in node.get("inputs", {}):
                frames = int(node["inputs"]["length"])
                break
        if any("ref2va" in u for u in units):
            mode = "r2v"
        elif any("fl2va" in u for u in units):
            mode = "i2v"
        else:
            raise SystemExit(f"{wf}: unet_nameからモードを判定できない（fl2va/ref2vaのどちらも無い）")
        out[ch] = (mode, frames)
    if not out:
        raise SystemExit(f"{run_dir} に ch*_workflow.json が無い — 先にworkflowを生成する（7章）")
    return out


def ensure_tools(run_dir):
    """ノートブックが呼ぶツールがラン直下に実体であることを保証する（無ければスキルからコピー）。"""
    copied = []
    for name in REQUIRED_TOOLS:
        dst = os.path.join(run_dir, name)
        if os.path.isfile(dst) and not os.path.islink(dst):
            continue
        src = next((os.path.join(d, name) for d in SKILL_SOURCES
                    if os.path.isfile(os.path.join(d, name))), None)
        if src is None:
            raise SystemExit(
                f"{run_dir}/{name} が無く、スキル側にも見つからない。"
                " ノートブックのセル7がこれを実行するので、欠けたままzipするとColabで全チャプターが失敗する")
        shutil.copy(src, dst)
        copied.append(name)
    if copied:
        print(f"★ 不足していたツールをコピーした: {', '.join(copied)}")


def verify_zip(zip_path, slug):
    """zipに必要物が実際に入っているか確認する（除外規則の取りこぼし検出）。"""
    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
    missing = [n for n in REQUIRED_TOOLS + ["script.md"]
               if f"{slug}/{n}" not in names]
    if missing:
        raise SystemExit(f"{os.path.basename(zip_path)} に必要物が入っていない: {', '.join(missing)}")
    workflows = [n for n in names if n.startswith(f"{slug}/ch") and n.endswith("_workflow.json")]
    prompts = [n for n in names if n.startswith(f"{slug}/ch") and n.endswith("_prompt.txt")]
    if not workflows:
        raise SystemExit(f"{os.path.basename(zip_path)} に ch*_workflow.json が入っていない")
    if len(prompts) < len(workflows):
        raise SystemExit(
            f"{os.path.basename(zip_path)}: workflow {len(workflows)}本に対し prompt {len(prompts)}本しか無い"
            " — extract_prompts.py を流し直す")
    print(f"★ zip検証OK: workflow {len(workflows)}本 / prompt {len(prompts)}本 / ツール {len(REQUIRED_TOOLS)}本")


def make_zip(run_dir, zip_path):
    parent, slug = os.path.dirname(os.path.abspath(run_dir)), os.path.basename(os.path.abspath(run_dir))
    if os.path.exists(zip_path):
        os.remove(zip_path)  # zipは追記アーカイブなので、古い内容が残らないよう作り直す
    cmd = ["zip", "-r", "-q", os.path.abspath(zip_path), slug]
    for pat in ZIP_EXCLUDES:
        cmd += ["-x", pat]
    subprocess.run(cmd, cwd=parent, check=True)
    return os.path.getsize(zip_path)


def patch_cell1(src, chapters, zip_drive_path, out_drive_dir):
    """セル1のCHAPTERS・Driveパス2つを書き換える（他の設定は正典の既定のまま）。"""
    subs = [
        (r"(?m)^CHAPTERS = .*$",
         f"CHAPTERS = {json.dumps(chapters)}  # 自動設定（build_h3_run_package.py）— このノートブックが担当するチャプター"),
        (r"(?m)^BUNDLE_ZIP_FROM_DRIVE = .*$",
         f'BUNDLE_ZIP_FROM_DRIVE = "{zip_drive_path}"  # 自動設定 — このzipをDriveのh3_inputs/へ置いてから実行する'),
        (r"(?m)^OUT_DRIVE_DIR = .*$",
         f'OUT_DRIVE_DIR = "{out_drive_dir}"  # 自動設定 — ラン名と同名のディレクトリへ退避'),
    ]
    for pat, rep in subs:
        assert re.search(pat, src), f"セル1に置換対象が見つからない: {pat}"
        src = re.sub(pat, rep, src, count=1)
    return src


def build_notebook(canonical, mode, chapters, slug, out_path):
    nb = json.load(open(canonical))
    zip_drive_path = f"{DRIVE_IN}/{slug}_h3_bundle.zip"
    out_drive_dir = f"{DRIVE_OUT}/{slug}"
    patched = False
    for c in nb["cells"]:
        src = c["source"] if isinstance(c["source"], str) else "".join(c["source"])
        if c["cell_type"] == "markdown" and not patched:
            c["source"] = (f"**{slug} の {mode.upper()} チャプター専用（build_h3_run_package.pyで自動生成）** — "
                           f"もう一方のモードのノートブックと別セッションで同時に回してよい\n\n") + src
            continue
        if c["cell_type"] == "code" and src.startswith("#@title 1."):
            c["source"] = patch_cell1(src, chapters, zip_drive_path, out_drive_dir)
            patched = True
    assert patched, "セル1（#@title 1.）が見つからない — 正典h3_colab.ipynbの構成を確認"
    json.dump(nb, open(out_path, "w"), ensure_ascii=False, indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir", help="ラン専用ディレクトリ（例 03_SCRIPTS/55_okayaman_watching_movie_cm）")
    ap.add_argument("--notebook", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "h3_colab.ipynb"),
                    help="正典ノートブック（既定: スキル同梱のh3_colab.ipynb）")
    a = ap.parse_args()
    run_dir = a.run_dir.rstrip("/")
    slug = os.path.basename(os.path.abspath(run_dir))
    assert os.path.exists(os.path.join(run_dir, "script.md")), f"{run_dir}/script.md が無い — ラン専用ディレクトリを指定する"

    chapters = classify_chapters(run_dir)
    h3_dir = os.path.join(run_dir, "h3")
    os.makedirs(h3_dir, exist_ok=True)

    ensure_tools(run_dir)
    zip_path = os.path.join(h3_dir, f"{slug}_h3_bundle.zip")
    size = make_zip(run_dir, zip_path)
    verify_zip(zip_path, slug)

    made = []
    for mode in ("i2v", "r2v"):
        chs = [ch for ch, (m, _f) in chapters.items() if m == mode]
        if not chs:
            continue
        out_path = os.path.join(h3_dir, f"h3_colab_{mode}.ipynb")
        build_notebook(a.notebook, mode, chs, slug, out_path)
        made.append((mode, chs, out_path))

    print(f"★ {slug}: チャプター分類（I2V/R2Vの2セッション並列用）")
    for ch, (mode, frames) in chapters.items():
        est = f"（{frames}f≒{frames / 24:.1f}s・L4+sage目安 {frames * L4_SAGE_SEC_PER_FRAME / 60 + OVERHEAD_MIN:.0f}分）" if frames else ""
        print(f"  {ch}: {mode.upper()} {est}")
    print(f"\n★ 生成物 → {h3_dir}/")
    print(f"  {os.path.basename(zip_path)}（{size / 2**20:.1f} MB）→ Driveの {DRIVE_IN}/ へ置く")
    for mode, chs, p in made:
        total = sum(f for ch in chs for m, f in [chapters[ch]] if f) or 0
        est_min = total * L4_SAGE_SEC_PER_FRAME / 60 + OVERHEAD_MIN * len(chs)
        print(f"  {os.path.basename(p)}: {' '.join(chs)}（L4+sage直列の目安 約{est_min:.0f}分）")
    print(f"  成果物は {DRIVE_OUT}/{slug}/ に退避される（設定済み）")
    if len(made) == 2:
        print("\n★ 並列運用: 2本を別々のColabセッション（L4×2推奨）で同時に★一括実行してよい"
              "（モード毎にユニットが分かれているため干渉しない。NEEDフラグはCHAPTERSから自動判定）")


if __name__ == "__main__":
    main()
