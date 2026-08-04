#!/usr/bin/env python3
"""複数の参照画像を1枚のキャンバスに連結する（Seedanceキーフレーム生成用）。

draw-things-cli generate の画像入力（--image）は1枚しか受け取れないため、
キャラクターシート等の複数参照が必要な生成では、このスクリプトで
1枚の参照キャンバスに連結してから --image に渡す。

出力キャンバスは生成用の中間ファイルであり、CapCut入力ではない。

usage:
  stitch_refs.py <output.png> <input1.png> [input2.png ...] [--size WxH] [--layout row|column|auto]

--size のデフォルトは 2048x1152（16:9）。draw-things-cli はアスペクト維持＋
センタークロップで出力サイズに合わせるため、キャンバスは生成する
キーフレームと同じアスペクト比で作ること（縦動画なら --size 1152x2048 等）。

--layout のデフォルトは row（左から右へ横一列）。プロンプトで「LEFT panel は…」と
位置を指定して参照するため、既定を固定して曖昧さを消してある。auto は面積が
最大になる格子を自動選択する（3枚以上を詰めたいときだけ使う。ただしプロンプト側で
位置を指定できなくなるので、パネルの位置に言及しない書き方にすること）。
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def parse_args(argv: list[str]) -> tuple[Path, list[Path], int, int, str]:
    width, height = 2048, 1152
    layout = "row"
    positional: list[str] = []
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--size":
            if i + 1 >= len(argv):
                fail("--size requires WxH (e.g. 2048x1152)")
            try:
                w, h = argv[i + 1].lower().split("x")
                width, height = int(w), int(h)
            except ValueError:
                fail(f"invalid --size: {argv[i + 1]}")
            i += 2
        elif arg == "--layout":
            if i + 1 >= len(argv):
                fail("--layout requires row, column or auto")
            layout = argv[i + 1]
            if layout not in ("row", "column", "auto"):
                fail(f"invalid --layout: {layout} (expected row, column or auto)")
            i += 2
        else:
            positional.append(arg)
            i += 1
    if len(positional) < 2:
        fail("usage: stitch_refs.py <output.png> <input1.png> [input2.png ...] "
             "[--size WxH] [--layout row|column|auto]")
    output = Path(positional[0])
    inputs = [Path(p) for p in positional[1:]]
    for path in inputs:
        if not path.is_file():
            fail(f"input image not found: {path}")
    return output, inputs, width, height, layout


def best_grid(n: int, canvas_w: int, canvas_h: int, aspects: list[float]) -> tuple[int, int]:
    """セル内にアスペクト維持で収めたときの合計面積が最大になる列数を選ぶ。"""
    best = (1, n)
    best_score = -1.0
    for cols in range(1, n + 1):
        rows = -(-n // cols)
        cell_w = canvas_w / cols
        cell_h = canvas_h / rows
        score = 0.0
        for aspect in aspects:
            scale = min(cell_w / aspect, cell_h)
            score += (scale * aspect) * scale
        if score > best_score:
            best_score = score
            best = (cols, rows)
    return best


def main() -> None:
    output, inputs, canvas_w, canvas_h, layout = parse_args(sys.argv[1:])
    images = [Image.open(p).convert("RGB") for p in inputs]
    aspects = [img.width / img.height for img in images]

    if layout == "row":
        cols, rows = len(images), 1
    elif layout == "column":
        cols, rows = 1, len(images)
    else:
        cols, rows = best_grid(len(images), canvas_w, canvas_h, aspects)
    cell_w = canvas_w // cols
    cell_h = canvas_h // rows

    canvas = Image.new("RGB", (canvas_w, canvas_h), "white")
    for index, img in enumerate(images):
        col = index % cols
        row = index // cols
        scale = min(cell_w / img.width, cell_h / img.height)
        new_size = (max(1, round(img.width * scale)), max(1, round(img.height * scale)))
        resized = img.resize(new_size, Image.LANCZOS)
        x = col * cell_w + (cell_w - new_size[0]) // 2
        y = row * cell_h + (cell_h - new_size[1]) // 2
        canvas.paste(resized, (x, y))

    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output)
    order = ", ".join(f"panel {i + 1} = {p.name}" for i, p in enumerate(inputs))
    print(f"stitched {len(images)} image(s) -> {output} ({canvas_w}x{canvas_h}, "
          f"layout {layout}, grid {cols}x{rows}; {order})")


if __name__ == "__main__":
    main()
