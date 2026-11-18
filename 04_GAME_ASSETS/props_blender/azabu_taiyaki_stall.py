"""麻布十番: たい焼きの屋台（参考: 03_SCRIPTS/49_sobaya_musou_gameplay_target/props/azabu/taiyaki_stall.png）

幅2.5m・奥行き1.3m・高さ約2.6m。正面は -Y、上は +Z。
blender --background --python azabu_taiyaki_stall.py -- --out <dir>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import propkit as k  # noqa: E402

k.reset()
OUT = k.out_dir()

wood = k.tex_mat("wood", "wood_floor", tint=(0.55, 0.36, 0.24))
wood_dark = k.mat("wood_dark", (0.20, 0.11, 0.06), 0.65)
post = k.mat("post", (0.16, 0.10, 0.06), 0.6)
red = k.mat("canvas_red", (0.42, 0.03, 0.025), 0.85)
red_dark = k.mat("canvas_red_dark", (0.26, 0.02, 0.02), 0.85)
gold = k.mat("gold_trim", (0.72, 0.50, 0.18), 0.35, 0.8)
cream = k.mat("noren", (0.86, 0.82, 0.72), 0.9)
glass = k.mat("glass", (0.85, 0.92, 0.95), 0.05, 0.0, alpha=0.25)
metal = k.mat("steel", (0.62, 0.63, 0.65), 0.3, 1.0)
iron = k.mat("iron", (0.07, 0.07, 0.08), 0.5, 0.8)
taiyaki = k.mat("taiyaki", (0.80, 0.50, 0.16), 0.55)
bulb = k.mat("bulb", (1.0, 0.92, 0.75), 0.3, emit=(1.0, 0.82, 0.55), emit_strength=6.0)
shelf_item = k.mat("bag", (0.86, 0.80, 0.68), 0.8)

W, D = 2.5, 1.3
# 台（カウンター）: 前面は縦板張り、天板は張り出す
k.box("counter", (W, 1.0, 0.98), (0, -0.05, 0.49), wood, bevel=0.015, tex_scale=1.2)
for i in range(9):
    x = -W / 2 + 0.14 + i * (W - 0.28) / 8
    k.box(f"plank_{i}", (0.02, 0.012, 0.86), (x, -0.556, 0.47), wood_dark, bevel=0.004)
k.box("plinth", (W + 0.04, 1.04, 0.07), (0, -0.05, 0.035), wood_dark, bevel=0.01)
k.box("top", (W + 0.12, 1.12, 0.06), (0, -0.07, 1.01), wood, bevel=0.012, tex_scale=1.2)

# 柱（4本）と、奥の格子の壁・棚
for x in (-W / 2 + 0.05, W / 2 - 0.05):
    for y in (-0.6, 0.55):
        k.box(f"post_{x}_{y}", (0.08, 0.08, 2.3), (x, y, 1.15), post, bevel=0.01)
k.box("back_wall", (W - 0.1, 0.04, 1.25), (0, 0.6, 1.66), wood_dark, bevel=0.006)
for i in range(13):
    x = -W / 2 + 0.2 + i * (W - 0.4) / 12
    k.box(f"lattice_v{i}", (0.025, 0.02, 1.2), (x, 0.575, 1.66), wood, bevel=0.003, tex_scale=1.0)
for z in (1.4, 1.8):
    k.box(f"shelf_{z}", (0.9, 0.22, 0.03), (0.15, 0.48, z), wood, bevel=0.004, tex_scale=1.0)
for i in range(4):
    k.box(f"bag_{i}", (0.14, 0.12, 0.1), (-0.15 + i * 0.2, 0.48, 1.47), shelf_item, bevel=0.01)

# 屋根: 前後に流れる切妻（棟は左右方向）。前の縁に波形のフリル
ridge_z, eave_z = 2.62, 2.22
for sgn, nm in ((-1, "front"), (1, "back")):
    run = 0.78
    ang = math.atan2(ridge_z - eave_z, run)
    length = math.hypot(run, ridge_z - eave_z)
    k.box(f"roof_{nm}", (W + 0.34, length, 0.03), (0, sgn * run / 2, (ridge_z + eave_z) / 2),
          red, bevel=0.008, rot=(-sgn * ang, 0, 0))
k.cyl("ridge", 0.035, W + 0.36, (0, 0, ridge_z + 0.01), red_dark, rot=(0, math.pi / 2, 0))
k.scallop_cloth("valance_front", W + 0.34, 0.16, (0, -0.79, eave_z - 0.01), red, n=9)
k.scallop_cloth("valance_back", W + 0.34, 0.12, (0, 0.79, eave_z - 0.01), red, n=9)
for x in (-W / 2 - 0.17, W / 2 + 0.17):
    k.box(f"gable_{x}", (0.03, 1.56, 0.06), (x, 0, eave_z + 0.02), red_dark, bevel=0.005)
for x in (-0.8, 0.0, 0.8):
    k.cyl(f"tassel_{x}", 0.012, 0.09, (x, -0.80, eave_z - 0.2), gold)

# ショーケース（ガラス）と、中のたい焼き
cx = -0.25
k.box("case_base", (1.05, 0.52, 0.06), (cx, -0.25, 1.07), metal, bevel=0.008)
k.box("case_glass", (1.03, 0.5, 0.4), (cx, -0.25, 1.3), glass, bevel=0.01)
for x in (cx - 0.52, cx + 0.52):
    k.box(f"case_frame_{x}", (0.02, 0.52, 0.42), (x, -0.25, 1.3), metal, bevel=0.004)
k.box("case_top", (1.07, 0.54, 0.02), (cx, -0.25, 1.51), metal, bevel=0.004)
k.box("case_shelf", (1.0, 0.46, 0.012), (cx, -0.25, 1.27), metal)
for row, z in ((0, 1.12), (1, 1.3)):
    for i in range(4):
        x = cx - 0.36 + i * 0.24
        k.sphere(f"fish_{row}_{i}", 0.08, (x, -0.27 + row * 0.04, z), taiyaki, scale=(1.35, 0.35, 0.8),
                 rot=(0, math.radians(8 * (i - 1.5)), 0))
        k.cyl(f"tail_{row}_{i}", 0.04, 0.04, (x + 0.12, -0.27 + row * 0.04, z), taiyaki, verts=3,
              rot=(0, math.pi / 2, 0))

# たい焼きの焼き型（鉄板）
gx = 0.78
k.box("griddle", (0.6, 0.42, 0.14), (gx, -0.2, 1.11), iron, bevel=0.012)
for i in range(3):
    for j in range(2):
        k.sphere(f"mold_{i}_{j}", 0.07, (gx - 0.18 + i * 0.18, -0.29 + j * 0.18, 1.185), wood_dark, scale=(1.3, 0.75, 0.25))
k.box("griddle_handle", (0.5, 0.03, 0.03), (gx, -0.44, 1.2), metal, bevel=0.006)

# 白い暖簾（左・2枚）と、赤いのぼり（右の竿）
for i, x in enumerate((-1.02, -0.78)):
    k.box(f"noren_{i}", (0.22, 0.012, 0.55), (x, -0.63, 1.9), cream, bevel=0.003)
k.cyl("noren_rod", 0.012, 0.55, (-0.9, -0.63, 2.18), post, rot=(0, math.pi / 2, 0))
k.cyl("banner_pole", 0.018, 2.2, (W / 2 + 0.12, -0.65, 1.1), post)
k.box("banner", (0.012, 0.32, 0.95), (W / 2 + 0.13, -0.45, 1.55), red, bevel=0.003)
k.cyl("banner_rod", 0.01, 0.36, (W / 2 + 0.13, -0.47, 2.03), post, rot=(math.pi / 2, 0, 0))

# 吊り電球（2個）
for x in (-0.45, 0.45):
    k.cyl(f"cord_{x}", 0.004, 0.35, (x, -0.1, 2.25), iron)
    k.sphere(f"bulb_{x}", 0.055, (x, -0.1, 2.04), bulb)
    k.cyl(f"socket_{x}", 0.025, 0.05, (x, -0.1, 2.1), metal)

ob = k.join_all("taiyaki_stall")
print("TRIS", k.tri_count(ob))
k.export_glb(os.path.join(OUT, "taiyaki_stall.gltf"))
k.render_preview(os.path.join(OUT, "taiyaki_stall_preview.png"), target_h=2.6)
