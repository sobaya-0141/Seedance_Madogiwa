#!/usr/bin/env python3
"""窓際族物語の Godot 4 ゲームのひな形を作る。

使い方（リポジトリのルートで）:
  python3 .claude/skills/godot-game/scripts/new_godot_game.py 13_TAKOSAN_GAME_GODOT "たこさんのゲーム" \
      --models sobaya_hq beer_mug mannequin_base mannequin_addon

作るもの:
  project.godot / main.tscn / main.gd（共通の土台）/ export_presets.cfg（Web）/ .gitignore / README.md
  models/   … 共用モデルへの相対symlink（コピーしない）
  fonts/    … 同梱日本語フォントへの相対symlink（ブラウザ版で必須）
  web_assets/.gdignore, build/.gdignore … Godot の取り込み対象から外すフォルダ
その後 godot --headless --import を1回走らせ、*.glb.import を
gltf/embedded_image_handling=3（テクスチャをゲーム側へ書き出さない）に直して再インポートする。
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SKILL = Path(__file__).resolve().parents[1]

# 名前 → リポジトリ内の正典パス
MODELS = {
    "sobaya_hq": "04_GAME_ASSETS/models3d/sobaya.glb",
    "fukuchan_hq": "04_GAME_ASSETS/models3d/fukuchan.glb",
    "takosan_hq": "04_GAME_ASSETS/models3d/takosan.glb",
    "yametaro_hq": "04_GAME_ASSETS/models3d/yametaro.glb",
    "beer_mug": "04_GAME_ASSETS/models3d/props/beer_mug.glb",
    "mannequin_base": "04_GAME_ASSETS/models3d/mobs/mannequin_base.glb",
    "mannequin_addon": "04_GAME_ASSETS/models3d/mobs/mannequin_addon.glb",
}
for voxel in sorted((REPO / "04_GAME_ASSETS/voxel/models").glob("*.glb")):
    MODELS[f"voxel_{voxel.stem}"] = f"04_GAME_ASSETS/voxel/models/{voxel.name}"

FONT = "04_GAME_ASSETS/fonts/MPLUSRounded1c-ExtraBold.ttf"


def link(dst: Path, target_in_repo: str) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    rel = os.path.relpath(REPO / target_in_repo, dst.parent)
    if dst.is_symlink() or dst.exists():
        dst.unlink()
    dst.symlink_to(rel)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("dir", help="リポジトリ直下に作るフォルダ名（例: 13_FOO_GODOT）")
    ap.add_argument("title", help="ゲームのタイトル（ウィンドウ名・Web版のタイトル）")
    ap.add_argument("--models", nargs="*", default=[], help="symlink する共用モデル: " + ", ".join(MODELS))
    ap.add_argument("--no-import", action="store_true", help="godot --import を走らせない")
    args = ap.parse_args()

    root = REPO / args.dir
    if root.exists():
        print(f"既にあります: {root}", file=sys.stderr)
        return 1
    unknown = [m for m in args.models if m not in MODELS]
    if unknown:
        print(f"不明なモデル: {unknown}\n使える名前: {', '.join(MODELS)}", file=sys.stderr)
        return 1

    tpl = SKILL / "templates"
    root.mkdir()
    for name in ["main.gd", "main.tscn", "export_presets.cfg"]:
        shutil.copy(tpl / name, root / name)
    (root / "project.godot").write_text((tpl / "project.godot").read_text().replace("{{TITLE}}", args.title))
    (root / "README.md").write_text((tpl / "README.md").read_text().replace("{{TITLE}}", args.title).replace("{{DIR}}", args.dir))
    (root / ".gitignore").write_text(".godot/\n/build/\n")
    for d in ["web_assets", "build"]:
        (root / d).mkdir()
        (root / d / ".gdignore").write_text("")
    link(root / "fonts" / Path(FONT).name, FONT)
    for m in args.models:
        link(root / "models" / f"{m}.glb", MODELS[m])
    print(f"作りました: {root}")

    if args.no_import:
        return 0
    godot = shutil.which("godot")
    if not godot:
        print("godot が見つからないので取り込みは省略しました（scripts/godot_setup.sh check で確認）")
        return 0
    subprocess.run([godot, "--headless", "--path", str(root), "--import"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    changed = False
    for imp in (root / "models").glob("*.glb.import"):
        text = imp.read_text()
        new = re.sub(r"^gltf/embedded_image_handling=\d+$", "gltf/embedded_image_handling=3", text, flags=re.M)
        if new != text:
            imp.write_text(new)
            changed = True
    if changed:
        # 既定の設定で書き出されたテクスチャ画像を消して取り込み直す
        for f in (root / "models").iterdir():
            if f.suffix in (".png", ".jpg", ".jpeg", ".webp") or f.name.endswith((".png.import", ".jpg.import", ".jpeg.import", ".webp.import")):
                f.unlink()
        subprocess.run([godot, "--headless", "--path", str(root), "--import"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("取り込み完了（*.glb.import は embedded_image_handling=3）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
