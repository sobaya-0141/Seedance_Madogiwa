"""麻布十番ステージの大道具（屋台・提灯は別スクリプト）。参考: 03_SCRIPTS/49_sobaya_musou_gameplay_target/props/azabu/*.png

正面は -Y、上は +Z、足元の中心が原点。1回の実行で全部を書き出す。
blender --background --python azabu_props.py -- --out <dir> [--no-preview]
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
import propkit as k  # noqa: E402

OUT = k.out_dir()
PREVIEW = "--no-preview" not in sys.argv
random.seed(7)


def common():
    return dict(
        wood=k.tex_mat("wood", "wood_floor", tint=(0.55, 0.36, 0.24)),
        wood_dark=k.mat("wood_dark", (0.16, 0.09, 0.05), 0.6),
        frame=k.mat("window_frame", (0.12, 0.12, 0.13), 0.45, 0.6),
        alu=k.mat("aluminium", (0.62, 0.63, 0.65), 0.35, 1.0),
        glass_dark=k.mat("window_glass", (0.08, 0.11, 0.14), 0.08, 0.4, emit=(1.0, 0.75, 0.45), emit_strength=0.12),
        shop_glow=k.mat("shop_glow", (0.9, 0.75, 0.5), 0.5, emit=(1.0, 0.75, 0.42), emit_strength=2.5),
        iron=k.mat("iron_rail", (0.08, 0.08, 0.09), 0.5, 0.8),
        concrete=k.tex_mat("concrete", "painted_plaster_wall", tint=(0.74, 0.73, 0.7)),
        ac=k.mat("ac_unit", (0.86, 0.86, 0.84), 0.5),
    )


def window(x, z, w, h, y, m, frame_w=0.06, cross=True):
    k.box("win_frame", (w + frame_w * 2, 0.08, h + frame_w * 2), (x, y, z), m["frame"], bevel=0.01)
    k.box("win_glass", (w, 0.06, h), (x, y - 0.02, z), m["glass_dark"], bevel=0.0)
    if cross:
        k.box("win_mullion", (0.035, 0.07, h), (x, y - 0.03, z), m["frame"], bevel=0.0)
    k.box("win_sill", (w + 0.2, 0.18, 0.05), (x, y - 0.08, z - h / 2 - frame_w), m["alu"], bevel=0.008)


def balcony(x, z, w, y, m):
    k.box("bal_slab", (w, 0.6, 0.1), (x, y - 0.3, z), m["concrete"], bevel=0.01, tex_scale=2.0)
    k.box("bal_top", (w, 0.04, 0.04), (x, y - 0.58, z + 0.95), m["iron"], bevel=0.006)
    n = int(w / 0.14)
    for i in range(n + 1):
        k.box("bal_bar", (0.02, 0.02, 0.9), (x - w / 2 + i * w / n, y - 0.58, z + 0.5), m["iron"], bevel=0.0)


def awning(x, z, w, y, color, stripe=None, scallop=True):
    cloth = k.mat(f"awning_{color}", color, 0.85)
    ang = math.radians(28)
    depth = 1.1
    k.box("awn", (w, depth, 0.03), (x, y - depth / 2 * math.cos(ang), z - depth / 2 * math.sin(ang)), cloth,
          bevel=0.006, rot=(ang, 0, 0))
    if stripe:
        sm = k.mat(f"awning_stripe_{stripe}", stripe, 0.85)
        n = int(w / 0.5)
        for i in range(n):
            if i % 2 == 0:
                sx = x - w / 2 + (i + 0.5) * w / n
                k.box("awn_stripe", (w / n, depth, 0.032), (sx, y - depth / 2 * math.cos(ang), z - depth / 2 * math.sin(ang) + 0.002),
                      sm, bevel=0.0, rot=(ang, 0, 0))
    edge_y = y - depth * math.cos(ang)
    edge_z = z - depth * math.sin(ang)
    if scallop:
        k.scallop_cloth("awn_valance", w, 0.22, (x, edge_y, edge_z), cloth, n=max(4, int(w / 0.45)))
    for sx in (x - w / 2 + 0.03, x + w / 2 - 0.03):
        k.box("awn_arm", (0.025, depth, 0.025), (sx, y - depth / 2 * math.cos(ang), z - depth / 2 * math.sin(ang) - 0.03),
              k.mat("awn_arm", (0.2, 0.2, 0.2), 0.4, 0.8), bevel=0.0, rot=(ang, 0, 0))


def shell(W, floors, wall_mat, m, depth=4.0, roof_ac=1, tank=False):
    H = floors * 3.0
    k.box("wall", (W, depth, H), (0, depth / 2, H / 2), wall_mat, bevel=0.02, tex_scale=2.5)
    # 階ごとの帯と、屋上のパラペット・手すり
    for f in range(1, floors):
        k.box("floor_band", (W + 0.06, 0.12, 0.16), (0, -0.04, f * 3.0), m["concrete"], bevel=0.01, tex_scale=2.0)
    k.box("parapet", (W + 0.1, 0.2, 0.35), (0, -0.02, H + 0.17), m["concrete"], bevel=0.015, tex_scale=2.0)
    for i in range(int(W / 0.6) + 1):
        k.box("roof_rail", (0.03, 0.03, 0.7), (-W / 2 + 0.1 + i * (W - 0.2) / int(W / 0.6), 0.1, H + 0.7), m["iron"], bevel=0.0)
    k.box("roof_rail_top", (W - 0.1, 0.04, 0.04), (0, 0.1, H + 1.05), m["iron"], bevel=0.005)
    for i in range(roof_ac):
        ax = -W / 2 + 1.0 + i * 1.1
        k.box("ac", (0.85, 0.35, 0.6), (ax, 1.0, H + 0.65), m["ac"], bevel=0.03)
        k.cyl("ac_fan", 0.22, 0.02, (ax - 0.1, 0.81, H + 0.65), m["iron"], rot=(math.pi / 2, 0, 0))
    if tank:
        k.cyl("tank", 0.45, 0.9, (W / 2 - 1.0, 1.5, H + 1.15), m["alu"], bevel=0.02)
        for a in range(4):
            k.box("tank_leg", (0.05, 0.05, 0.7), (W / 2 - 1.0 + 0.35 * math.cos(a * math.pi / 2), 1.5 + 0.35 * math.sin(a * math.pi / 2), H + 0.35), m["iron"], bevel=0.0)
    k.cyl("gutter", 0.05, H, (W / 2 - 0.12, -0.08, H / 2), k.mat("gutter", (0.3, 0.3, 0.32), 0.5), verts=12)
    return H


def shop_wagashi():
    m = common()
    W = 6.0
    wall = k.tex_mat("stucco_beige", "painted_plaster_wall", tint=(0.92, 0.82, 0.66))
    H = shell(W, 3, wall, m, roof_ac=1)
    # 1階: 濃い木の店構え、紫の日よけと暖簾、ガラスのショーケース
    k.box("shop_front", (W - 0.4, 0.12, 2.6), (0, -0.04, 1.3), m["wood_dark"], bevel=0.01)
    for i in range(7):
        k.box("slat", (0.05, 0.05, 2.3), (-1.2 + i * 0.15, -0.12, 1.2), m["wood"], bevel=0.004, tex_scale=1.0)
    k.box("door_glow", (1.2, 0.04, 2.2), (-1.9, -0.1, 1.1), m["shop_glow"], bevel=0.0)
    k.box("case", (2.4, 0.6, 0.9), (1.2, -0.4, 0.45), m["wood_dark"], bevel=0.02)
    k.box("case_glass", (2.3, 0.5, 0.42), (1.2, -0.42, 1.12), k.mat("case_glass", (0.85, 0.93, 0.96), 0.05, alpha=0.25), bevel=0.01)
    sweets = [k.mat(f"mochi_{i}", c, 0.6) for i, c in enumerate([(0.95, 0.78, 0.82), (0.75, 0.88, 0.62), (0.97, 0.95, 0.9)])]
    for row in range(2):
        for i in range(8):
            k.sphere("mochi", 0.07, (0.3 + i * 0.26, -0.42 + row * 0.18, 0.98), sweets[(i + row) % 3], scale=(1, 1, 0.7), segs=12, rings=8)
    purple = (0.33, 0.12, 0.42)
    awning(0, 2.95, W - 0.3, -0.06, purple)
    for i in range(3):
        k.box("noren", (0.7, 0.015, 0.6), (-0.9 + i * 0.75, -0.2, 2.25), k.mat("noren_purple", purple, 0.9), bevel=0.003)
    k.box("floor_lamp", (0.28, 0.28, 0.55), (-2.65, -0.5, 0.28), m["shop_glow"], bevel=0.02)
    # 2階・3階: 木枠の窓、2階はバルコニー
    for f in (1, 2):
        z = f * 3.0 + 1.5
        window(-1.4, z, 1.8, 1.3, -0.04, m)
        window(1.4, z, 1.8, 1.3, -0.04, m)
    balcony(0, 3.2, W - 1.2, -0.04, m)
    k.save("shop_wagashi", OUT, H + 1.2, preview=PREVIEW)


def shop_yaoya():
    m = common()
    W = 6.0
    brick = k.tex_mat("brick", "red_brick", tint=(0.95, 0.85, 0.8))
    H = shell(W, 2, brick, m, roof_ac=1)
    k.box("shop_opening", (W - 0.6, 0.05, 2.6), (0, 0.4, 1.3), m["shop_glow"], bevel=0.0)
    for sx in (-W / 2 + 0.2, W / 2 - 0.2):
        k.box("pillar", (0.3, 0.3, 2.8), (sx, 0.0, 1.4), m["wood_dark"], bevel=0.02)
    awning(0, 2.95, W - 0.2, -0.06, (0.08, 0.32, 0.16), stripe=(0.86, 0.9, 0.84))
    veg = [(0.13, 0.42, 0.12), (0.95, 0.5, 0.05), (0.85, 0.1, 0.06), (0.55, 0.8, 0.3), (0.2, 0.6, 0.15)]
    vm = [k.mat(f"veg_{i}", c, 0.55) for i, c in enumerate(veg)]
    # 段々の陳列台と木箱に野菜・果物
    for tier in range(3):
        k.box("stand", (W - 1.2, 0.5, 0.12), (0, -0.35 - tier * 0.45, 0.95 - tier * 0.3), m["wood"], bevel=0.01, tex_scale=1.0)
        for i in range(6):
            cx = -2.0 + i * 0.8
            cz = 0.95 - tier * 0.3
            k.box("crate", (0.7, 0.42, 0.22), (cx, -0.35 - tier * 0.45, cz + 0.17), m["wood"], bevel=0.008, tex_scale=1.0)
            mt = vm[(i + tier) % len(vm)]
            r = 0.13 if (i + tier) % 5 == 0 else 0.07
            for j in range(3 if r > 0.1 else 8):
                ox = -0.22 + (j % 4) * 0.15 if r < 0.1 else -0.2 + j * 0.2
                oy = -0.08 + (j // 4) * 0.16 if r < 0.1 else 0
                k.sphere("veg", r, (cx + ox, -0.35 - tier * 0.45 + oy, cz + 0.3 + r * 0.6), mt, segs=12, rings=8)
        k.box("stand_leg", (W - 1.2, 0.06, 0.95 - tier * 0.3), (0, -0.12 - tier * 0.45, (0.95 - tier * 0.3) / 2), m["wood_dark"], bevel=0.0)
    for x in (-1.4, 1.4):
        window(x, 4.5, 1.9, 1.3, -0.04, m, cross=True)
    k.box("ac_wall", (0.8, 0.3, 0.55), (2.3, -0.2, 3.8), m["ac"], bevel=0.03)
    k.save("shop_yaoya", OUT, H + 1.2, preview=PREVIEW)


def shop_kissa():
    m = common()
    W = 7.0
    wall = k.tex_mat("concrete_wall", "painted_plaster_wall", tint=(0.72, 0.71, 0.68))
    H = shell(W, 4, wall, m, roof_ac=2, tank=True)
    k.box("shop_front", (W - 0.4, 0.1, 2.6), (0, -0.04, 1.3), m["wood_dark"], bevel=0.01)
    window(-2.0, 1.4, 2.0, 1.7, -0.1, m)
    window(2.0, 1.4, 2.0, 1.7, -0.1, m)
    k.box("door", (1.0, 0.08, 2.2), (0, -0.12, 1.1), m["wood"], bevel=0.015, tex_scale=1.0)
    k.cyl("door_knob", 0.03, 0.06, (0.38, -0.18, 1.1), m["alu"], rot=(math.pi / 2, 0, 0))
    awning(0, 2.95, W - 0.3, -0.06, (0.85, 0.66, 0.1), stripe=(0.96, 0.94, 0.88))
    k.box("chalkboard", (0.6, 0.05, 0.85), (2.9, -1.2, 0.48), k.mat("chalk", (0.1, 0.13, 0.11), 0.9), bevel=0.02, rot=(math.radians(-10), 0, 0))
    lantern_m = k.mat("lantern_red", (0.62, 0.05, 0.03), 0.8, emit=(1.0, 0.25, 0.08), emit_strength=1.5)
    for x in (-W / 2 + 0.3, W / 2 - 0.3):
        k.sphere("lantern", 0.16, (x, -0.35, 2.7), lantern_m, scale=(1, 1, 1.3), segs=16, rings=10)
    for f in (1, 2, 3):
        z = f * 3.0 + 1.4
        for x in (-2.2, 0.0, 2.2):
            window(x, z, 1.6, 1.3, -0.04, m)
        balcony(0, f * 3.0 + 0.2, W - 0.6, -0.04, m)
    k.save("shop_kissa", OUT, H + 2.0, preview=PREVIEW)


def arch():
    red = k.mat("arch_red", (0.55, 0.05, 0.04), 0.45, 0.3)
    gold = k.mat("arch_gold", (0.72, 0.52, 0.2), 0.35, 1.0)
    glow = k.mat("arch_lamp", (1.0, 0.9, 0.7), 0.3, emit=(1.0, 0.8, 0.5), emit_strength=4.0)
    white = k.mat("medallion", (0.92, 0.9, 0.84), 0.5)
    Wd = 14.0
    for sx in (-Wd / 2, Wd / 2):
        k.box("col", (0.4, 0.4, 7.0), (sx, 0, 3.5), red, bevel=0.03)
        k.box("col_base", (0.6, 0.6, 0.35), (sx, 0, 0.18), k.mat("stone", (0.6, 0.58, 0.55), 0.8), bevel=0.03)
        k.box("lamp_box", (0.5, 0.5, 1.1), (sx, 0, 5.3), glow, bevel=0.03)
        for dz in (4.72, 5.88):
            k.box("lamp_cap", (0.62, 0.62, 0.08), (sx, 0, dz), gold, bevel=0.015)
        k.sphere("finial", 0.16, (sx, 0, 7.15), gold)
    # 上の弓なりの梁（二重の弓と、間の斜めの格子）
    segs = 28
    for layer, (base, rise) in enumerate(((6.3, 0.9), (5.6, 0.7))):
        for i in range(segs):
            t0, t1 = i / segs, (i + 1) / segs
            x0, x1 = -Wd / 2 + Wd * t0, -Wd / 2 + Wd * t1
            z0 = base + rise * math.sin(math.pi * t0)
            z1 = base + rise * math.sin(math.pi * t1)
            L = math.hypot(x1 - x0, z1 - z0)
            k.box("arc", (L + 0.02, 0.22, 0.18), ((x0 + x1) / 2, 0, (z0 + z1) / 2), red, bevel=0.01,
                  rot=(0, -math.atan2(z1 - z0, x1 - x0), 0))
    for i in range(1, 14):
        t = i / 14
        x = -Wd / 2 + Wd * t
        z_lo = 5.6 + 0.7 * math.sin(math.pi * t)
        z_hi = 6.3 + 0.9 * math.sin(math.pi * t)
        k.box("lattice", (0.06, 0.08, (z_hi - z_lo) * 1.3), (x, 0, (z_lo + z_hi) / 2), red, bevel=0.0,
              rot=(0, math.radians(35 if i % 2 else -35), 0))
    k.cyl("medallion", 0.75, 0.12, (0, -0.05, 7.2), white, verts=40, rot=(math.pi / 2, 0, 0))
    k.torus("medallion_ring", 0.78, 0.06, (0, -0.05, 7.2), gold, rot=(math.pi / 2, 0, 0), major=40)
    k.save("arch", OUT, 8.0, elev=8.0, azim=-20.0, preview=PREVIEW)


def utility_pole():
    conc = k.tex_mat("pole_concrete", "painted_plaster_wall", tint=(0.72, 0.71, 0.68))
    steel = k.mat("pole_steel", (0.45, 0.46, 0.48), 0.5, 0.9)
    ceramic = k.mat("insulator", (0.92, 0.92, 0.9), 0.3)
    trans = k.mat("transformer", (0.55, 0.57, 0.58), 0.45, 0.6)
    k.cyl("pole", 0.16, 10.0, (0, 0, 5.0), conc, verts=20, r2=0.11, tex_scale=1.5)
    for z, w in ((9.3, 1.8), (8.6, 1.4)):
        k.box("crossarm", (w, 0.1, 0.1), (0, 0, z), steel, bevel=0.01)
        for x in (-w / 2 + 0.12, 0.0, w / 2 - 0.12):
            if abs(x) > 0.05:
                k.cyl("insulator", 0.05, 0.14, (x, 0, z + 0.12), ceramic, verts=12)
    k.cyl("transformer", 0.28, 0.75, (0.42, 0, 6.6), trans, verts=20, bevel=0.02)
    k.box("trans_bracket", (0.4, 0.08, 0.08), (0.22, 0, 6.6), steel, bevel=0.0)
    for i in range(3):
        k.cyl("bushing", 0.035, 0.18, (0.32 + i * 0.1, 0, 7.05), ceramic, verts=10)
    for i in range(10):
        z = 2.4 + i * 0.5
        k.cyl("step", 0.018, 0.3, (0, -0.12 if i % 2 else 0.12, z), steel, rot=(0, math.pi / 2, 0) if False else (math.pi / 2, 0, 0), verts=8)
    k.save("utility_pole", OUT, 10.2, preview=PREVIEW)


def street_lamp():
    dark = k.mat("lamp_metal", (0.13, 0.13, 0.14), 0.4, 0.8)
    glow = k.mat("lamp_globe", (1.0, 0.95, 0.85), 0.2, emit=(1.0, 0.85, 0.6), emit_strength=8.0)
    brass = k.mat("lamp_ring", (0.6, 0.45, 0.22), 0.4, 1.0)
    k.cyl("base", 0.2, 0.35, (0, 0, 0.18), dark, bevel=0.02)
    k.cyl("post", 0.065, 4.3, (0, 0, 2.5), dark)
    for z in (0.5, 4.2):
        k.torus("ring", 0.075, 0.015, (0, 0, z), brass)
    # 上の曲がった腕（四分円）
    R = 0.55
    n = 12
    for i in range(n):
        a0, a1 = math.pi * i / (2 * n), math.pi * (i + 1) / (2 * n)
        x0, z0 = -R + R * math.cos(a0) * -1 + R, 4.65 + R * math.sin(a0)
        x0 = -(R - R * math.cos(a0))
        x1 = -(R - R * math.cos(a1))
        z1 = 4.65 + R * math.sin(a1)
        L = math.hypot(x1 - x0, z1 - z0)
        k.box("arm", (0.09, 0.09, L + 0.01), ((x0 + x1) / 2, 0, (z0 + z1) / 2), dark, bevel=0.0,
              rot=(0, math.atan2(x1 - x0, z1 - z0), 0))
    k.box("arm_top", (0.5, 0.09, 0.09), (-0.8, 0, 5.2), dark, bevel=0.01)
    k.cyl("hood", 0.28, 0.16, (-1.0, 0, 5.08), dark, verts=24, r2=0.08, bevel=0.01)
    k.sphere("globe", 0.2, (-1.0, 0, 4.88), glow, scale=(1, 1, 0.8), segs=20, rings=12)
    k.save("street_lamp", OUT, 5.4, preview=PREVIEW)


def vending_machine():
    red = k.mat("vm_red", (0.62, 0.04, 0.04), 0.25, 0.3)
    white = k.mat("vm_inner", (0.92, 0.92, 0.9), 0.4, emit=(1.0, 1.0, 0.95), emit_strength=1.2)
    dark = k.mat("vm_dark", (0.08, 0.08, 0.09), 0.4)
    glass = k.mat("vm_glass", (0.85, 0.92, 0.96), 0.05, alpha=0.2)
    k.box("body", (1.0, 0.75, 1.83), (0, 0.375, 0.915 + 0.05), red, bevel=0.03)
    k.box("display_back", (0.86, 0.04, 0.95), (0, 0.02, 1.32), white, bevel=0.005)
    colors = [(0.9, 0.5, 0.1), (0.2, 0.6, 0.3), (0.85, 0.15, 0.1), (0.15, 0.4, 0.8), (0.9, 0.8, 0.2), (0.6, 0.3, 0.6), (0.95, 0.95, 0.95)]
    for row in range(3):
        z = 1.0 + row * 0.3
        k.box("shelf", (0.84, 0.15, 0.015), (0, -0.02, z - 0.02), k.mat("vm_shelf", (0.8, 0.8, 0.8), 0.4, 0.8), bevel=0.0)
        for i in range(8):
            c = k.mat(f"can_{(i + row) % 7}", colors[(i + row) % 7], 0.35, 0.5)
            k.cyl("can", 0.035, 0.18 if row else 0.13, (-0.37 + i * 0.105, -0.03, z + (0.09 if row else 0.065)), c, verts=12)
            k.cyl("button", 0.012, 0.02, (-0.37 + i * 0.105, -0.06, z - 0.06), dark, verts=8, rot=(math.pi / 2, 0, 0))
    k.box("glass", (0.88, 0.02, 0.97), (0, -0.04, 1.32), glass, bevel=0.0)
    k.box("coin_panel", (0.22, 0.04, 0.3), (0.3, -0.02, 0.68), dark, bevel=0.01)
    k.box("pickup", (0.7, 0.06, 0.24), (0, -0.02, 0.28), dark, bevel=0.02)
    for x in (-0.42, 0.42):
        k.box("foot", (0.1, 0.5, 0.05), (x, 0.375, 0.025), dark, bevel=0.005)
    k.save("vending_machine", OUT, 2.0, preview=PREVIEW)


def planter_hydrangea():
    stone = k.tex_mat("planter_stone", "painted_plaster_wall", tint=(0.88, 0.8, 0.68))
    leaf = k.mat("hydrangea_leaf", (0.12, 0.32, 0.1), 0.6)
    blue = k.mat("hydrangea_blue", (0.22, 0.32, 0.85), 0.7)
    purple = k.mat("hydrangea_purple", (0.55, 0.28, 0.75), 0.7)
    soil = k.mat("soil", (0.18, 0.12, 0.08), 0.95)
    k.box("box", (0.62, 0.62, 0.5), (0, 0, 0.25), stone, bevel=0.03, tex_scale=0.8)
    k.box("soil", (0.54, 0.54, 0.04), (0, 0, 0.49), soil, bevel=0.0)
    for i in range(16):
        a = random.uniform(0, math.tau)
        r = random.uniform(0.05, 0.28)
        k.sphere("leaf", 0.11, (math.cos(a) * r, math.sin(a) * r, 0.58 + random.uniform(0, 0.15)), leaf,
                 scale=(1.4, 0.8, 0.35), segs=10, rings=6, rot=(random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), a))
    for i in range(7):
        a = i / 7 * math.tau + random.uniform(-0.2, 0.2)
        r = 0.18 if i else 0.0
        k.sphere("bloom", 0.13, (math.cos(a) * r, math.sin(a) * r, 0.78 + random.uniform(-0.04, 0.08)), blue if i % 2 else purple,
                 segs=14, rings=10)
    k.save("planter_hydrangea", OUT, 1.0, preview=PREVIEW)


def bollard_steel():
    steel = k.mat("bollard_steel", (0.7, 0.71, 0.72), 0.25, 1.0)
    dark = k.mat("bollard_ring", (0.15, 0.15, 0.16), 0.4, 0.8)
    k.cyl("body", 0.08, 0.72, (0, 0, 0.36), steel, verts=24)
    k.sphere("dome", 0.08, (0, 0, 0.72), steel, scale=(1, 1, 0.9), segs=24, rings=12)
    for z in (0.6, 0.64):
        k.cyl("ring", 0.083, 0.015, (0, 0, z), dark, verts=24)
    k.save("bollard_steel", OUT, 0.85, preview=PREVIEW)


def street_tree():
    bark = k.mat("bark", (0.3, 0.22, 0.15), 0.9)
    leaf = k.mat("tree_leaf", (0.28, 0.52, 0.16), 0.7)
    leaf2 = k.mat("tree_leaf2", (0.4, 0.62, 0.2), 0.7)
    grate = k.mat("grate", (0.22, 0.16, 0.1), 0.6, 0.7)
    k.box("grate", (1.0, 1.0, 0.04), (0, 0, 0.02), grate, bevel=0.01)
    k.cyl("trunk", 0.08, 2.6, (0, 0, 1.3), bark, verts=12, r2=0.05)
    for i in range(5):
        a = i / 5 * math.tau
        k.cyl("branch", 0.03, 1.2, (math.cos(a) * 0.25, math.sin(a) * 0.25, 2.8), bark, verts=8,
              rot=(math.sin(a) * -0.5, math.cos(a) * 0.5, 0), r2=0.015)
    for i in range(22):
        a = random.uniform(0, math.tau)
        r = random.uniform(0.1, 1.1)
        k.sphere("foliage", random.uniform(0.35, 0.55), (math.cos(a) * r, math.sin(a) * r, 3.4 + random.uniform(-0.4, 1.0)),
                 leaf if i % 3 else leaf2, scale=(1, 1, 0.8), segs=12, rings=8)
    k.save("street_tree", OUT, 5.0, preview=PREVIEW)


for fn in (shop_wagashi, shop_yaoya, shop_kissa, arch, utility_pole, street_lamp, vending_machine,
           planter_hydrangea, bollard_steel, street_tree):
    k.reset()
    fn()
