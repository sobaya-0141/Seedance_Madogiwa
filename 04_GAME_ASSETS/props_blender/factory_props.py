"""ビール工場ステージの大道具（Tripo に残っていなかったビールケースのパレット）。
参考: 03_SCRIPTS/49_sobaya_musou_gameplay_target/props/factory/crates_red.png / crates_yellow.png

- crates_red: 赤いビールケース 3×3 列・4段（1.2m 角のパレット）
- crates_yellow: 黄色いビールケース 2×2 列・3段（1.1m 角のパレット）
ケースは取っ手の穴が4面に開いた樹脂の箱。最上段だけ中の瓶（茶色・金の王冠）を作り、下の段は取っ手の穴から
茶色の瓶の色が見えるよう、中を濃い琥珀色で埋める（三角形の数を抑えるため）。正面は -Y、上は +Z、原点は足元の中心。

blender --background --python factory_props.py -- --out ../models3d/blender/factory [--only crates_red] [--no-preview]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import propkit as k  # noqa: E402

OUT = k.out_dir()
PREVIEW = "--no-preview" not in sys.argv
# --only crates_red で一部だけ作り直す
ONLY = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else []


def pallet(W, D):
    """木のパレット（高さ 0.14m）: 下板3枚・桁ブロック3×3・上板7枚"""
    wood = k.tex_mat("pallet_wood", "wood_floor", tint=(0.95, 0.72, 0.45))
    wood_end = k.mat("pallet_wood_end", (0.34, 0.2, 0.09), 0.8)
    for y in (-D / 2 + 0.05, 0.0, D / 2 - 0.05):
        k.box("bottom_board", (W, 0.1, 0.022), (0, y, 0.011), wood, bevel=0.004, tex_scale=1.0)
    for x in (-W / 2 + 0.06, 0.0, W / 2 - 0.06):
        for y in (-D / 2 + 0.06, 0.0, D / 2 - 0.06):
            k.box("block", (0.12, 0.12, 0.078), (x, y, 0.061), wood_end if abs(y) > 0.01 else wood, bevel=0.005, tex_scale=0.5)
        k.box("stringer", (0.12, D, 0.022), (x, 0, 0.111), wood, bevel=0.004, tex_scale=1.0)
    n = 7
    for i in range(n):
        x = -W / 2 + 0.05 + i * (W - 0.1) / (n - 1)
        k.box("top_board", (0.1, D, 0.02), (x, 0, 0.132), wood, bevel=0.004, tex_scale=1.0)
    return 0.142


def crate(cx, cy, z0, W, D, H, plastic, top):
    """樹脂のビールケース1個。z0 は底の高さ。top=True なら中の瓶を作る"""
    t = 0.018           # 壁の厚さ
    hole_w = W * 0.42   # 取っ手の穴（長辺の面）
    hole_h = H * 0.2
    hole_z = H * 0.72
    amber = k.mat("bottle_glass", (0.22, 0.07, 0.01), 0.15)
    dark = k.mat("bottle_inside", (0.1, 0.035, 0.008), 0.4)
    cap = k.mat("bottle_cap", (0.82, 0.6, 0.12), 0.3, 1.0)
    # 底板
    k.box("floor", (W - 0.01, D - 0.01, 0.015), (cx, cy, z0 + 0.0075), plastic, bevel=0.0)
    # 4面の壁（取っ手の穴を残して、下・上・左右の4枚で組む）
    for side, (L, nx, ny) in enumerate(((W, 0, -1), (W, 0, 1), (D, -1, 0), (D, 1, 0))):
        hw = hole_w * (L / W)
        cxw = cx + nx * (W / 2 - t / 2)
        cyw = cy + ny * (D / 2 - t / 2)
        along_x = ny != 0

        def wall(name, length, height, zc, offset=0.0):
            size = (length, t, height) if along_x else (t, length, height)
            loc = (cxw + (offset if along_x else 0.0), cyw + (0.0 if along_x else offset), z0 + zc)
            k.box(name, size, loc, plastic, bevel=0.0)

        lo = hole_z - hole_h / 2
        hi = hole_z + hole_h / 2
        wall("wall_lo", L, lo, lo / 2)
        wall("wall_hi", L, H - hi, (H + hi) / 2)
        side_w = (L - hw) / 2
        for s in (-1, 1):
            wall("wall_side", side_w, hole_h, hole_z, s * (hw / 2 + side_w / 2))
        # 外側の補強リブ（横2本・縦2本）。少しだけ外へ出す
        rib = 0.012
        for zr in (H * 0.12, H * 0.45):
            size = (L - 0.02, rib, 0.016) if along_x else (rib, L - 0.02, 0.016)
            k.box("rib_h", size, (cxw + nx * rib, cyw + ny * rib, z0 + zr), plastic, bevel=0.0)
        for s in (-1, 1):
            off = s * L * 0.33
            size = (0.016, rib, H * 0.5) if along_x else (rib, 0.016, H * 0.5)
            loc = (cxw + nx * rib + (off if along_x else 0.0), cyw + ny * rib + (0.0 if along_x else off), z0 + H * 0.27)
            k.box("rib_v", size, loc, plastic, bevel=0.0)
    # 上端のふち（外へ張り出す）
    lip = 0.012
    for (sx, sy, lx, ly) in ((0, -1, W + lip * 2, 0.03), (0, 1, W + lip * 2, 0.03), (-1, 0, 0.03, D), (1, 0, 0.03, D)):
        k.box("lip", (lx, ly, 0.02), (cx + sx * (W / 2 - 0.015 + lip), cy + sy * (D / 2 - 0.015 + lip), z0 + H - 0.01), plastic, bevel=0.004)
    if not top:
        # 下の段: 取っ手の穴から見える「瓶の色」で中を埋める
        k.box("inside", (W - t * 2 - 0.004, D - t * 2 - 0.004, H * 0.9), (cx, cy, z0 + 0.015 + H * 0.45), dark, bevel=0.0)
        return
    k.box("inside", (W - t * 2 - 0.004, D - t * 2 - 0.004, H * 0.45), (cx, cy, z0 + 0.015 + H * 0.225), dark, bevel=0.0)
    # 仕切り
    nxb, nyb = (5, 4) if W >= D else (4, 5)
    for i in range(1, nxb):
        x = cx - W / 2 + t + (W - t * 2) * i / nxb
        k.box("divider", (0.006, D - t * 2, H * 0.55), (x, cy, z0 + H * 0.5), plastic, bevel=0.0)
    for j in range(1, nyb):
        y = cy - D / 2 + t + (D - t * 2) * j / nyb
        k.box("divider", (W - t * 2, 0.006, H * 0.55), (cx, y, z0 + H * 0.5), plastic, bevel=0.0)
    # 瓶（胴・肩・首・王冠）。王冠がふちより少し上に出る
    bh = H * 0.9
    r = min((W - t * 2) / nxb, (D - t * 2) / nyb) * 0.36
    for i in range(nxb):
        for j in range(nyb):
            x = cx - W / 2 + t + (W - t * 2) * (i + 0.5) / nxb
            y = cy - D / 2 + t + (D - t * 2) * (j + 0.5) / nyb
            zb = z0 + 0.015
            k.cyl("bottle", r, bh * 0.62, (x, y, zb + bh * 0.31), amber, verts=8)
            k.cyl("shoulder", r, bh * 0.16, (x, y, zb + bh * 0.70), amber, verts=8, r2=r * 0.42)
            k.cyl("neck", r * 0.42, bh * 0.2, (x, y, zb + bh * 0.88), amber, verts=8)
            k.cyl("cap", r * 0.5, bh * 0.05, (x, y, zb + bh * 1.0), cap, verts=8)


def crates(name, color, n, layers, W, D, H, pallet_size):
    plastic = k.mat(f"{name}_plastic", color, 0.42)
    top_z = pallet(pallet_size, pallet_size)
    gap = 0.008
    for l in range(layers):
        for i in range(n):
            for j in range(n):
                cx = (i - (n - 1) / 2) * (W + gap)
                cy = (j - (n - 1) / 2) * (D + gap)
                crate(cx, cy, top_z + l * (H + 0.004), W, D, H, plastic, l == layers - 1)
    k.save(name, OUT, top_z + layers * H + 0.05, preview=PREVIEW)


def crates_red():
    crates("crates_red", (0.5, 0.018, 0.012), 3, 4, 0.39, 0.39, 0.27, 1.2)


def crates_yellow():
    crates("crates_yellow", (0.78, 0.42, 0.0), 2, 3, 0.53, 0.53, 0.33, 1.1)


for fn in (crates_red, crates_yellow):
    if ONLY and fn.__name__ not in ONLY:
        continue
    k.reset()
    fn()
