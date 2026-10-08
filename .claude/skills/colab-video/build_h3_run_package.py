#!/usr/bin/env python3
"""H3ラン一式を <ランディレクトリ>/h3/ に生成する（colab-videoスキル同梱ツール）。

生成物（初回。<slug> はラン名 <NN>_<slug>、<rev> は修正版のみ付く）:
  <slug>_h3_bundle.zip      ポータブルバンドル（除外規則も従来どおり＋h3/自身を除外）
  <slug>_h3_i2v.ipynb       I2Vチャプター専用ノートブック（セル1設定済み）
  <slug>_h3_r2v.ipynb       R2Vチャプター専用ノートブック（セル1設定済み）

**名前はランごと・修正ごとにユニーク**にしてある。ColabのアップロードもDriveの
h3_inputs/・h3_outputs/も全ランで共有の置き場なので、同名だと取り違える:
  - ノートブック名にラン名を入れる（旧 h3_colab_i2v.ipynb は全ラン同名で、Colabの
    「最近のノートブック」でどの動画のものか見分けられなかった）
  - 修正版は --fix で `_fix` / `_fix2` … のリビジョン接尾辞が付き、zip・ノートブック・
    Drive出力先（h3_outputs/<slug>_fix）の3つすべてが初回と別物になる。
    **とくに出力先を分けるのが重要** — セル7は OUT_DRIVE_DIR に同名mp4があると
    「生成済み」とみなしてスキップするので、初回と同じ出力先を使うと修正版が1本も生成されない。

ノートブックのセル1には以下が書き込まれる:
  CHAPTERS              = そのモードのチャプターだけ（workflowのunet_nameから自動分類。
                          --chapters 指定時はさらにその範囲だけ＝修正チャプターだけを回せる）
  BUNDLE_ZIP_FROM_DRIVE = /content/drive/MyDrive/h3_inputs/<slug>_h3_bundle<rev>.zip
  OUT_DRIVE_DIR         = /content/drive/MyDrive/h3_outputs/<slug><rev>

2本を別々のColabセッション（L4×2推奨）で同時に★一括実行すれば、I2V/R2Vが並列に回る
（モード毎にユニットが分かれているためユニット入れ替えも発生しない）。
片モードしか無いランは、そのモードのノートブック1本だけを生成する。

ビルドのたびに h3/REVISIONS.md へ1行追記するので、どのzip・ノートブックが何版かを後から辿れる。

usage:
  python3 build_h3_run_package.py 03_SCRIPTS/<NN>_<slug>                      # 初回
  python3 build_h3_run_package.py 03_SCRIPTS/<NN>_<slug> --fix --chapters ch3,ch7   # 修正版
  python3 build_h3_run_package.py 03_SCRIPTS/<NN>_<slug> --rev retake2        # 任意のラベル
"""
import argparse
import datetime
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
# リビジョン名はzip名・ノートブック名・Driveディレクトリ名になるので、安全な文字だけに縛る。
REV_RE = re.compile(r"[a-z0-9][a-z0-9_-]*\Z")


def existing_revs(h3_dir, slug):
    """h3/ に既にあるバンドルzipから、使用済みリビジョン（初回は ""）を集める。"""
    revs = set()
    for z in glob.glob(os.path.join(h3_dir, f"{slug}_h3_bundle*.zip")):
        tail = os.path.basename(z)[len(f"{slug}_h3_bundle"): -len(".zip")]
        revs.add(tail[1:] if tail.startswith("_") else tail)
    return revs


def next_fix_rev(used):
    """未使用の fix / fix2 / fix3 … を返す（fix を fix1 とみなして連番）。"""
    n = 1
    while ("fix" if n == 1 else f"fix{n}") in used:
        n += 1
    return "fix" if n == 1 else f"fix{n}"


def names_for(slug, rev):
    """リビジョンから、ユニークな成果物名とDriveパスをまとめて作る。"""
    sfx = f"_{rev}" if rev else ""
    return {
        "zip": f"{slug}_h3_bundle{sfx}.zip",
        "nb": lambda mode: f"{slug}_h3_{mode}{sfx}.ipynb",
        "zip_drive": f"{DRIVE_IN}/{slug}_h3_bundle{sfx}.zip",
        # 出力先も分ける: セル7は OUT_DRIVE_DIR にmp4があると「生成済み」としてスキップするため、
        # 修正版を初回と同じディレクトリへ向けると1本も生成されずに終わる。
        "out_drive": f"{DRIVE_OUT}/{slug}{sfx}",
    }


def log_revision(h3_dir, slug, rev, chapters, names, made):
    """h3/REVISIONS.md に1行追記する（どのzip・ノートブックが何版かを後から辿るため）。"""
    path = os.path.join(h3_dir, "REVISIONS.md")
    if not os.path.exists(path):
        with open(path, "w") as f:
            f.write(f"# {slug} — H3ランパッケージのリビジョン\n\n"
                    "`build_h3_run_package.py`がビルド毎に追記する。zip・ノートブック・Drive出力先は版ごとに別名。\n\n"
                    "| 日付 | 版 | チャプター | バンドルzip | ノートブック | Drive出力先 |\n"
                    "|---|---|---|---|---|---|\n")
    nbs = " / ".join(os.path.basename(p) for _m, _c, p in made)
    with open(path, "a") as f:
        f.write(f"| {datetime.date.today()} | {rev or '初回'} | {' '.join(chapters)} | "
                f"{names['zip']} | {nbs} | `{names['out_drive']}` |\n")


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
         f'OUT_DRIVE_DIR = "{out_drive_dir}"  # 自動設定 — ラン名（修正版は版名付き）のディレクトリへ退避'),
    ]
    for pat, rep in subs:
        assert re.search(pat, src), f"セル1に置換対象が見つからない: {pat}"
        src = re.sub(pat, rep, src, count=1)
    return src


def build_notebook(canonical, mode, chapters, slug, rev, names, out_path):
    nb = json.load(open(canonical))
    patched = False
    label = f"{slug}（{rev}）" if rev else slug
    for c in nb["cells"]:
        src = c["source"] if isinstance(c["source"], str) else "".join(c["source"])
        if c["cell_type"] == "markdown" and not patched:
            head = (f"**{label} の {mode.upper()} チャプター専用（build_h3_run_package.pyで自動生成）** — "
                    f"もう一方のモードのノートブックと別セッションで同時に回してよい\n\n"
                    f"- 担当チャプター: `{' '.join(chapters)}`\n"
                    f"- 入力zip: `{names['zip']}`（Driveの`h3_inputs/`へ置く）\n"
                    f"- 出力先: `{names['out_drive']}`\n\n")
            if rev:
                head += (f"> 修正版（{rev}）。zip・このノートブック・Drive出力先は初回版と別名になっている。"
                         f"初回版の出力先を流用すると、セル7が既存mp4を見て全チャプターをスキップする。\n\n")
            c["source"] = head + src
            continue
        if c["cell_type"] == "code" and src.startswith("#@title 1."):
            c["source"] = patch_cell1(src, chapters, names["zip_drive"], names["out_drive"])
            patched = True
    assert patched, "セル1（#@title 1.）が見つからない — 正典h3_colab.ipynbの構成を確認"
    json.dump(nb, open(out_path, "w"), ensure_ascii=False, indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir", help="ラン専用ディレクトリ（例 03_SCRIPTS/55_okayaman_watching_movie_cm）")
    ap.add_argument("--fix", action="store_true",
                    help="修正版として作る。未使用の fix / fix2 / fix3 … を自動で割り当てる")
    ap.add_argument("--rev", default=None,
                    help="リビジョン名を明示する（例 retake2）。小文字英数と - _ のみ。--fix と排他")
    ap.add_argument("--chapters", default="",
                    help="このパッケージで回すチャプターを絞る（例 ch3,ch7）。既定は全チャプター。"
                         "修正版で「直すチャプターだけ回す」ときに使う")
    ap.add_argument("--notebook", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "h3_colab.ipynb"),
                    help="正典ノートブック（既定: スキル同梱のh3_colab.ipynb）")
    a = ap.parse_args()
    run_dir = a.run_dir.rstrip("/")
    slug = os.path.basename(os.path.abspath(run_dir))
    assert os.path.exists(os.path.join(run_dir, "script.md")), f"{run_dir}/script.md が無い — ラン専用ディレクトリを指定する"
    if a.fix and a.rev:
        raise SystemExit("--fix と --rev は同時に使えない（どちらか一方でリビジョンを決める）")

    chapters = classify_chapters(run_dir)
    if a.chapters:
        want = [c.strip() for c in re.split(r"[,\s]+", a.chapters) if c.strip()]
        unknown = [c for c in want if c not in chapters]
        if unknown:
            raise SystemExit(f"--chapters に不明なチャプター: {', '.join(unknown)}"
                             f"（バンドル内: {' '.join(chapters)}）")
        chapters = {c: chapters[c] for c in want}

    h3_dir = os.path.join(run_dir, "h3")
    os.makedirs(h3_dir, exist_ok=True)

    used = existing_revs(h3_dir, slug)
    if a.fix:
        rev = next_fix_rev(used)
    elif a.rev:
        rev = a.rev
        if not REV_RE.match(rev):
            raise SystemExit(f"--rev「{rev}」は使えない — 小文字英数で始まり、以降は英数と - _ のみ"
                             "（zip名・ノートブック名・Driveディレクトリ名になる）")
    else:
        rev = ""
        if "" in used:
            print(f"⚠ 既に {slug}_h3_bundle.zip がある — 初回版を上書きする。"
                  " Colabで一度回した後の修正なら --fix を付けて別名の修正版にすること"
                  "（同名だとDriveのzipと出力先を取り違える）")
    if rev and rev in used:
        raise SystemExit(f"リビジョン「{rev}」は既に {slug}_h3_bundle_{rev}.zip として存在する — 別の名前にする")

    names = names_for(slug, rev)
    ensure_tools(run_dir)
    zip_path = os.path.join(h3_dir, names["zip"])
    size = make_zip(run_dir, zip_path)
    verify_zip(zip_path, slug)

    made = []
    for mode in ("i2v", "r2v"):
        chs = [ch for ch, (m, _f) in chapters.items() if m == mode]
        if not chs:
            continue
        out_path = os.path.join(h3_dir, names["nb"](mode))
        build_notebook(a.notebook, mode, chs, slug, rev, names, out_path)
        made.append((mode, chs, out_path))

    log_revision(h3_dir, slug, rev, list(chapters), names, made)

    print(f"★ {slug}: チャプター分類（I2V/R2Vの2セッション並列用）"
          + (f" — 修正版 {rev}" if rev else ""))
    for ch, (mode, frames) in chapters.items():
        est = f"（{frames}f≒{frames / 24:.1f}s・L4+sage目安 {frames * L4_SAGE_SEC_PER_FRAME / 60 + OVERHEAD_MIN:.0f}分）" if frames else ""
        print(f"  {ch}: {mode.upper()} {est}")
    print(f"\n★ 生成物 → {h3_dir}/")
    print(f"  {os.path.basename(zip_path)}（{size / 2**20:.1f} MB）→ Driveの {DRIVE_IN}/ へ置く")
    for mode, chs, pth in made:
        total = sum(f for ch in chs for m, f in [chapters[ch]] if f) or 0
        est_min = total * L4_SAGE_SEC_PER_FRAME / 60 + OVERHEAD_MIN * len(chs)
        print(f"  {os.path.basename(pth)}: {' '.join(chs)}（L4+sage直列の目安 約{est_min:.0f}分）")
    print(f"  成果物は {names['out_drive']}/ に退避される（設定済み）")
    print("  ※ zip・ノートブック・Drive出力先はこの版だけの名前。"
          "Driveの h3_inputs/・h3_outputs/ は全ラン共有なので、他の版と混ざらない")
    if rev:
        print(f"  ※ 修正版なので初回版の {DRIVE_OUT}/{slug}/ とは別の出力先。"
              "初回版を流用するとセル7が既存mp4を見て全スキップする")
    if len(made) == 2:
        print("\n★ 並列運用: 2本を別々のColabセッション（L4×2推奨）で同時に★一括実行してよい"
              "（モード毎にユニットが分かれているため干渉しない。NEEDフラグはCHAPTERSから自動判定）")


if __name__ == "__main__":
    main()
