"""本社ビルステージ（ロビー・12Fオフィス・窓際族エリア）の大道具。
参考: 03_SCRIPTS/49_sobaya_musou_gameplay_target/Loc_hq_office_sheet.png・Loc_madogiwa_sheet.png

正面は -Y、上は +Z、足元の中心が原点。1回の実行で全部を書き出す。
blender --background --python office_props.py -- --out <dir> [--no-preview]
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
import propkit as k  # noqa: E402

OUT = k.out_dir()
PREVIEW = "--no-preview" not in sys.argv
# --only dome_tent,barrel で一部だけ作り直す（lambda で包んだソファは対象外）
ONLY = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else []
random.seed(12)


def M():
    return dict(
        wood=k.tex_mat("wood", "wood_floor", tint=(0.62, 0.42, 0.28)),
        wood_light=k.tex_mat("wood_light", "wood_floor", tint=(0.85, 0.66, 0.48)),
        marble=k.mat("marble", (0.86, 0.84, 0.8), 0.22),
        white=k.mat("white_laminate", (0.9, 0.9, 0.88), 0.45),
        black=k.mat("black_plastic", (0.05, 0.05, 0.06), 0.45),
        steel=k.mat("steel", (0.65, 0.66, 0.68), 0.3, 1.0),
        chrome=k.mat("chrome", (0.85, 0.86, 0.88), 0.12, 1.0),
        fabric_gray=k.mat("fabric_gray", (0.24, 0.24, 0.26), 0.9),
        fabric_red=k.mat("fabric_red", (0.36, 0.08, 0.06), 0.9),
        leaf=k.mat("leaf", (0.12, 0.36, 0.12), 0.6),
        pot=k.mat("pot_white", (0.86, 0.85, 0.82), 0.6),
        cardboard=k.mat("cardboard", (0.66, 0.5, 0.32), 0.9),
        tape=k.mat("tape", (0.82, 0.72, 0.5), 0.5),
        screen=k.mat("screen", (0.25, 0.4, 0.9), 0.2, emit=(0.4, 0.55, 1.0), emit_strength=1.5),
        glow=k.mat("lamp_glow", (1.0, 0.92, 0.75), 0.4, emit=(1.0, 0.82, 0.55), emit_strength=3.0),
        navy=k.mat("noren_navy", (0.05, 0.06, 0.12), 0.9),
        lantern=k.mat("lantern_red", (0.6, 0.05, 0.03), 0.8, emit=(1.0, 0.25, 0.08), emit_strength=0.6),
    )


# ---------------------------------------------------------------- ロビー

def reception_counter():
    m = M()
    k.box("counter", (4.6, 0.9, 1.05), (0, 0, 0.525), m["marble"], bevel=0.03, tex_scale=1.5)
    k.box("top", (4.8, 1.05, 0.06), (0, 0.02, 1.08), m["wood"], bevel=0.015, tex_scale=1.2)
    k.box("led", (4.5, 0.02, 0.03), (0, -0.46, 0.06), m["glow"], bevel=0.0)
    for x in (-1.1, 1.1):
        k.box("monitor", (0.5, 0.04, 0.32), (x, 0.2, 1.38), m["black"], bevel=0.01)
        k.box("monitor_scr", (0.46, 0.01, 0.28), (x, 0.175, 1.38), m["screen"], bevel=0.0)
        k.box("monitor_stand", (0.06, 0.06, 0.2), (x, 0.22, 1.18), m["steel"], bevel=0.005)
    k.cyl("lamp", 0.11, 0.32, (-2.1, 0.1, 1.27), m["glow"], verts=20)
    k.save("reception_counter", OUT, 1.6, preview=PREVIEW)


def column():
    m = M()
    k.cyl("shaft", 0.55, 6.6, (0, 0, 3.3), m["marble"], verts=40, tex_scale=2.0)
    k.cyl("base", 0.62, 0.12, (0, 0, 0.06), m["steel"], verts=40)
    k.save("column", OUT, 6.6, preview=PREVIEW)


def sofa(name, fabric, w=2.2, legs="steel"):
    m = M()
    f = m[fabric]
    k.box("seat", (w, 0.85, 0.22), (0, 0, 0.36), f, bevel=0.06, tex_scale=0)
    for i in range(2 if w > 1.5 else 1):
        n = 2 if w > 1.5 else 1
        cw = (w - 0.3) / n
        k.box("cushion", (cw - 0.04, 0.72, 0.16), (-w / 2 + 0.15 + cw * (i + 0.5), -0.04, 0.55), f, bevel=0.06)
        k.box("back_cushion", (cw - 0.04, 0.2, 0.42), (-w / 2 + 0.15 + cw * (i + 0.5), 0.3, 0.78), f, bevel=0.07)
    k.box("back", (w, 0.18, 0.72), (0, 0.36, 0.62), f, bevel=0.05)
    for sx in (-w / 2 + 0.08, w / 2 - 0.08):
        k.box("arm", (0.18, 0.86, 0.62), (sx, 0, 0.55), f, bevel=0.06)
    for sx in (-w / 2 + 0.12, w / 2 - 0.12):
        for sy in (-0.32, 0.32):
            k.box("leg", (0.05, 0.05, 0.24), (sx, sy, 0.12), m[legs], bevel=0.008)
    k.save(name, OUT, 1.0, preview=PREVIEW)


def coffee_table():
    m = M()
    k.box("top", (1.3, 0.7, 0.05), (0, 0, 0.42), m["wood"], bevel=0.012, tex_scale=1.0)
    for sx in (-0.6, 0.6):
        k.box("leg", (0.05, 0.6, 0.4), (sx, 0, 0.2), m["steel"], bevel=0.008)
    k.cyl("plant_pot", 0.08, 0.12, (0.2, 0, 0.51), m["pot"], verts=16)
    for i in range(6):
        a = i / 6 * math.tau
        k.sphere("leaf", 0.07, (0.2 + math.cos(a) * 0.06, math.sin(a) * 0.06, 0.62), m["leaf"], scale=(1.4, 0.6, 0.4), segs=8, rings=6, rot=(0, 0.6, a))
    k.save("coffee_table", OUT, 0.7, preview=PREVIEW)


def potted_palm():
    m = M()
    k.cyl("pot", 0.3, 0.6, (0, 0, 0.3), k.tex_mat("pot_stone", "painted_plaster_wall", tint=(0.8, 0.78, 0.74)), verts=24, r2=0.36, tex_scale=0.8)
    k.cyl("soil", 0.33, 0.03, (0, 0, 0.6), k.mat("soil", (0.15, 0.1, 0.07), 0.95), verts=24)
    for i in range(5):
        a = i / 5 * math.tau
        k.cyl("stem", 0.025, 1.3, (math.cos(a) * 0.06, math.sin(a) * 0.06, 1.2), k.mat("stem", (0.35, 0.3, 0.15), 0.7), verts=8,
              rot=(math.sin(a) * 0.15, math.cos(a) * -0.15, 0))
    for i in range(14):
        a = i / 14 * math.tau + random.uniform(-0.2, 0.2)
        z = 1.5 + random.uniform(0, 0.6)
        r = random.uniform(0.25, 0.45)
        k.sphere("frond", 0.3, (math.cos(a) * r, math.sin(a) * r, z), m["leaf"], scale=(1.6, 0.25, 0.08), segs=10, rings=6,
                 rot=(0, random.uniform(0.3, 0.8), a))
    k.save("potted_palm", OUT, 2.3, preview=PREVIEW)


def turnstile():
    m = M()
    k.box("cabinet", (0.25, 1.2, 1.0), (0, 0, 0.5), m["steel"], bevel=0.02)
    k.box("top_glass", (0.27, 1.2, 0.03), (0, 0, 1.015), k.mat("tgl", (0.1, 0.1, 0.12), 0.1, 0.5), bevel=0.005)
    k.box("reader", (0.2, 0.2, 0.02), (0, -0.4, 1.035), k.mat("reader_glow", (0.2, 0.8, 1.0), 0.2, emit=(0.2, 0.8, 1.0), emit_strength=4.0), bevel=0.005)
    k.box("led_strip", (0.02, 1.1, 0.04), (-0.13, 0, 0.9), k.mat("reader_glow", (0.2, 0.8, 1.0), 0.2), bevel=0.0)
    k.box("flap", (0.5, 0.02, 0.6), (0.38, 0, 0.7), k.mat("flap_glass", (0.8, 0.9, 0.95), 0.05, alpha=0.3), bevel=0.01)
    k.save("turnstile", OUT, 1.2, preview=PREVIEW)


# ---------------------------------------------------------------- 12F オフィス

def office_chair():
    m = M()
    k.cyl("hub", 0.05, 0.08, (0, 0, 0.1), m["black"], verts=12)
    for i in range(5):
        a = i / 5 * math.tau
        k.box("star", (0.3, 0.05, 0.04), (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.08), m["black"], bevel=0.01, rot=(0, 0, a))
        k.sphere("caster", 0.03, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.03), m["black"], segs=8, rings=6)
    k.cyl("gas", 0.025, 0.3, (0, 0, 0.28), m["steel"], verts=12)
    k.box("seat", (0.5, 0.48, 0.08), (0, 0, 0.47), m["fabric_gray"], bevel=0.03)
    k.box("back", (0.46, 0.05, 0.55), (0, 0.24, 0.85), k.mat("mesh_back", (0.08, 0.08, 0.09), 0.7), bevel=0.04)
    k.box("back_frame", (0.04, 0.04, 0.35), (0, 0.26, 0.6), m["black"], bevel=0.005)
    for sx in (-0.26, 0.26):
        k.box("armrest", (0.05, 0.28, 0.04), (sx, 0.02, 0.66), m["black"], bevel=0.01)
        k.box("arm_post", (0.04, 0.04, 0.18), (sx, 0.08, 0.57), m["black"], bevel=0.005)
    k.save("office_chair", OUT, 1.2, preview=PREVIEW)


def desk_island():
    """向かい合わせの4席（2×2）。中央に低い仕切り、各席にモニター・キーボード・マウス。幅3.2m・奥行き1.6m"""
    m = M()
    W, D = 3.2, 1.6
    k.box("top", (W, D, 0.04), (0, 0, 0.74), m["white"], bevel=0.008)
    k.box("divider", (W, 0.04, 0.3), (0, 0, 0.91), k.mat("divider", (0.55, 0.58, 0.6), 0.6), bevel=0.01)
    for sx in (-W / 2 + 0.25, W / 2 - 0.25):
        for sy in (-D / 4, D / 4):
            k.box("pedestal", (0.42, 0.65, 0.7), (sx if abs(sx) > 1 else sx, sy, 0.36), m["white"], bevel=0.01)
            for dz in (0.2, 0.42, 0.62):
                k.box("drawer_line", (0.4, 0.66, 0.008), (sx, sy, dz), k.mat("drawer_gap", (0.6, 0.6, 0.58), 0.6), bevel=0.0)
    for sx in (-W / 4, W / 4):
        for side in (-1, 1):
            y = side * 0.25
            k.box("monitor", (0.62, 0.04, 0.38), (sx, y, 1.04), m["black"], bevel=0.01)
            k.box("monitor_scr", (0.58, 0.01, 0.34), (sx, y - side * 0.025, 1.04), m["screen"], bevel=0.0)
            k.box("stand", (0.05, 0.05, 0.22), (sx, y + side * 0.04, 0.86), m["steel"], bevel=0.005)
            k.box("stand_base", (0.22, 0.16, 0.015), (sx, y + side * 0.03, 0.765), m["steel"], bevel=0.003)
            k.box("keyboard", (0.44, 0.14, 0.02), (sx, side * 0.55, 0.77), m["black"], bevel=0.005)
            k.box("mouse", (0.06, 0.1, 0.03), (sx + 0.32, side * 0.55, 0.775), m["black"], bevel=0.012)
    for sx in (-W / 2 + 0.35, W / 2 - 0.35):
        k.box("binder", (0.06, 0.25, 0.3), (sx, 0.12, 0.91), k.mat("binder", (0.3, 0.32, 0.36), 0.7), bevel=0.005)
        k.cyl("plant_pot", 0.07, 0.1, (sx + 0.15, -0.12, 0.81), m["pot"], verts=12)
        for i in range(5):
            a = i / 5 * math.tau
            k.sphere("leaf", 0.06, (sx + 0.15 + math.cos(a) * 0.05, -0.12 + math.sin(a) * 0.05, 0.92), m["leaf"], scale=(1.4, 0.6, 0.5), segs=8, rings=6, rot=(0, 0.5, a))
    k.save("desk_island", OUT, 1.3, preview=PREVIEW)


def bookshelf():
    m = M()
    W, H = 2.4, 2.4
    k.box("back", (W, 0.04, H), (0, 0.18, H / 2), m["wood"], bevel=0.005, tex_scale=1.2)
    for x in (-W / 2, -W / 6, W / 6, W / 2):
        k.box("side", (0.04, 0.4, H), (x, 0, H / 2), m["wood"], bevel=0.005, tex_scale=1.2)
    colors = [(0.9, 0.9, 0.88), (0.75, 0.76, 0.78), (0.55, 0.42, 0.3), (0.88, 0.86, 0.8)]
    for i in range(6):
        z = 0.04 + i * 0.47
        k.box("shelf", (W, 0.4, 0.03), (0, 0, z), m["wood"], bevel=0.004, tex_scale=1.2)
        if i < 5:
            for c in range(3):
                x0 = -W / 2 + 0.05 + c * W / 3
                n = random.randint(3, 8)
                for b in range(n):
                    h = random.uniform(0.22, 0.34)
                    k.box("book", (0.05, 0.25, h), (x0 + 0.04 + b * 0.07, -0.02, z + 0.015 + h / 2),
                          k.mat(f"book_{b % 4}", colors[b % 4], 0.7), bevel=0.004)
                if random.random() < 0.4:
                    k.cyl("vase", 0.06, 0.18, (x0 + W / 3 - 0.18, 0, z + 0.1), m["pot"], verts=12)
    k.save("bookshelf", OUT, 2.4, preview=PREVIEW)


# ---------------------------------------------------------------- 窓際族エリア

def standing_bar():
    """木の立ち飲み屋台。板葺きの小屋根、紺の暖簾3枚、赤提灯2つ、ビールサーバとジョッキ。幅3.0m"""
    m = M()
    W = 3.0
    k.box("counter", (W, 0.8, 1.0), (0, 0, 0.5), m["wood"], bevel=0.015, tex_scale=1.2)
    for i in range(12):
        k.box("plank", (0.015, 0.01, 0.9), (-W / 2 + 0.12 + i * (W - 0.24) / 11, -0.405, 0.48), k.mat("plank_gap", (0.18, 0.1, 0.05), 0.7), bevel=0.0)
    k.box("top", (W + 0.15, 0.95, 0.07), (0, -0.05, 1.03), m["wood_light"], bevel=0.012, tex_scale=1.2)
    for sx in (-W / 2 + 0.06, W / 2 - 0.06):
        for sy in (-0.35, 0.35):
            k.box("post", (0.12, 0.12, 2.4), (sx, sy, 1.2), m["wood"], bevel=0.012, tex_scale=1.2)
    k.box("beam_front", (W + 0.3, 0.14, 0.18), (0, -0.4, 2.3), m["wood"], bevel=0.012, tex_scale=1.2)
    k.box("beam_back", (W + 0.3, 0.14, 0.18), (0, 0.4, 2.45), m["wood"], bevel=0.012, tex_scale=1.2)
    ang = math.radians(14)
    for i in range(10):
        z = 2.48 + i * 0.0 + 0.0
        y = -0.65 + i * 0.15
        k.box("shingle", (W + 0.5, 0.2, 0.025), (0, y, 2.4 + (i * 0.15) * math.tan(ang)), k.tex_mat("shingle", "wood_floor", tint=(0.48, 0.34, 0.24)),
              bevel=0.004, rot=(-ang, 0, 0), tex_scale=0.8)
    for i in range(3):
        k.box("noren", (0.85, 0.015, 0.62), (-0.95 + i * 0.95, -0.42, 1.92), m["navy"], bevel=0.003)
    k.cyl("noren_rod", 0.015, W, (0, -0.42, 2.24), m["wood"], rot=(0, math.pi / 2, 0))
    for sx in (-W / 2 - 0.05, W / 2 + 0.05):
        k.sphere("lantern", 0.18, (sx, -0.5, 1.85), m["lantern"], scale=(1, 1, 1.3), segs=20, rings=12)
        for dz in (-0.25, 0.25):
            k.cyl("lantern_cap", 0.09, 0.05, (sx, -0.5, 1.85 + dz), m["black"], verts=16)
    k.box("server_tray", (0.4, 0.25, 0.03), (-0.6, -0.15, 1.08), m["chrome"], bevel=0.005)
    k.cyl("server_col", 0.06, 0.4, (-0.6, -0.1, 1.28), m["chrome"], verts=16)
    for dx in (-0.08, 0.08):
        k.cyl("tap", 0.015, 0.14, (-0.6 + dx, -0.18, 1.42), m["black"], verts=8)
    glass = k.mat("mug_glass", (0.9, 0.95, 1.0), 0.05, alpha=0.3)
    for i in range(4):
        k.cyl("mug", 0.05, 0.14, (0.2 + i * 0.16, -0.15, 1.14), glass, verts=16)
    k.save("standing_bar", OUT, 2.8, preview=PREVIEW)


def barrel():
    m = M()
    w = k.tex_mat("barrel_wood", "wood_floor", tint=(0.6, 0.4, 0.26))
    iron = k.mat("barrel_iron", (0.12, 0.12, 0.13), 0.45, 0.8)
    n = 10
    for i in range(n):
        z0, z1 = i / n, (i + 1) / n
        r0 = 0.3 + 0.06 * math.sin(math.pi * z0)
        r1 = 0.3 + 0.06 * math.sin(math.pi * z1)
        k.cyl("stave", r0, 0.9 / n + 0.002, (0, 0, 0.9 * (z0 + z1) / 2), w, verts=24, r2=r1, tex_scale=0.6)
    for z in (0.12, 0.3, 0.6, 0.78):
        r = 0.3 + 0.06 * math.sin(math.pi * z / 0.9) + 0.008
        k.torus("hoop", r, 0.012, (0, 0, z), iron, major=32, minor=6)
    k.cyl("lid", 0.29, 0.02, (0, 0, 0.9), w, verts=24)
    k.save("barrel", OUT, 1.0, preview=PREVIEW)


def cardboard_chair():
    m = M()
    for z in (0.22, 0.66):
        k.box("box", (0.6, 0.6, 0.44), (0, 0, z), m["cardboard"], bevel=0.015)
        k.box("tape", (0.08, 0.61, 0.005), (0, 0, z + 0.222), m["tape"], bevel=0.0)
    k.box("backrest", (0.6, 0.08, 0.6), (0, 0.27, 1.15), m["cardboard"], bevel=0.015, rot=(math.radians(-8), 0, 0))
    k.save("cardboard_chair", OUT, 1.5, preview=PREVIEW)


def cardboard_stack():
    m = M()
    for i, (x, y, z, s) in enumerate(((0, 0, 0.25, 0.5), (0.52, 0.05, 0.25, 0.5), (0.25, 0, 0.75, 0.5), (0.05, 0.02, 1.15, 0.3))):
        k.box("box", (s * 1.1, s, s), (x, y, z if i < 3 else 0.5 + 0.5 + 0.15), m["cardboard"], bevel=0.012, rot=(0, 0, random.uniform(-0.1, 0.1)))
        k.box("tape", (0.06, s + 0.01, 0.005), (x, y, (z if i < 3 else 1.15) + s / 2), m["tape"], bevel=0.0)
    k.save("cardboard_stack", OUT, 1.4, preview=PREVIEW)


def dome_tent():
    green = k.mat("tent_green", (0.42, 0.5, 0.2), 0.85)
    dark = k.mat("tent_inner", (0.12, 0.14, 0.08), 0.9)
    pole = k.mat("tent_pole", (0.2, 0.2, 0.22), 0.4, 0.8)
    glow = k.mat("tent_lamp", (1.0, 0.75, 0.4), 0.3, emit=(1.0, 0.7, 0.3), emit_strength=5.0)
    k.sphere("dome", 1.1, (0, 0, 0), green, segs=24, rings=14)
    k.sphere("door", 0.5, (0, -0.95, 0.05), dark, scale=(1.0, 0.25, 1.3), segs=16, rings=10)
    for a in (math.pi / 4, -math.pi / 4):
        k.torus("pole", 1.1, 0.012, (0, 0, 0), pole, rot=(0, math.pi / 2, a), major=40, minor=6)
    k.sphere("lamp", 0.07, (0.2, -0.75, 0.15), glow)
    # 全部をまとめてから、床（z = 0）より下の頂点を消す（骨組みの輪も下半分が消える）
    import bmesh
    tent = k.join_all("dome_tent")
    bm = bmesh.new()
    bm.from_mesh(tent.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (tent.matrix_world @ v.co).z < -0.005], context="VERTS")
    bm.to_mesh(tent.data)
    bm.free()
    k.save("dome_tent", OUT, 1.2, preview=PREVIEW)


def kettle_grill():
    black = k.mat("grill_black", (0.03, 0.03, 0.035), 0.35, 0.4)
    steel = k.mat("grill_steel", (0.7, 0.7, 0.72), 0.3, 1.0)
    k.sphere("bowl", 0.3, (0, 0, 0.62), black, scale=(1, 1, 0.75), segs=24, rings=14)
    k.cyl("handle_lid", 0.05, 0.04, (0, 0, 0.86), steel, verts=12)
    k.torus("ring", 0.3, 0.012, (0, 0, 0.62), steel)
    for i in range(3):
        a = i / 3 * math.tau
        k.cyl("leg", 0.015, 0.6, (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.3), steel, verts=8, rot=(math.sin(a) * 0.25, -math.cos(a) * 0.25, 0))
    for sx in (-0.2, 0.2):
        k.cyl("wheel", 0.08, 0.03, (sx, 0.25, 0.08), black, rot=(0, math.pi / 2, 0))
    k.save("kettle_grill", OUT, 1.0, preview=PREVIEW)


def speaker():
    wood = k.mat("speaker_body", (0.04, 0.04, 0.045), 0.5)
    cone = k.mat("speaker_cone", (0.1, 0.1, 0.11), 0.7)
    k.box("cab", (0.42, 0.4, 1.1), (0, 0, 0.55), wood, bevel=0.015)
    for z, r in ((0.95, 0.08), (0.65, 0.16), (0.27, 0.16)):
        k.cyl("cone", r, 0.03, (0, -0.2, z), cone, rot=(math.pi / 2, 0, 0))
        k.torus("surround", r, 0.012, (0, -0.21, z), k.mat("surround", (0.3, 0.3, 0.32), 0.4, 0.8), rot=(math.pi / 2, 0, 0))
    k.save("speaker", OUT, 1.2, preview=PREVIEW)


def floor_lamp():
    m = M()
    shade = k.mat("lamp_shade", (0.95, 0.88, 0.72), 0.8, emit=(1.0, 0.85, 0.6), emit_strength=2.0)
    for i in range(3):
        a = i / 3 * math.tau
        k.cyl("leg", 0.015, 1.3, (math.cos(a) * 0.15, math.sin(a) * 0.15, 0.63), m["wood"], verts=8, rot=(math.sin(a) * -0.2, math.cos(a) * 0.2, 0))
    k.cyl("shade", 0.22, 0.32, (0, 0, 1.45), shade, verts=24, r2=0.18)
    k.save("floor_lamp", OUT, 1.7, preview=PREVIEW)


def aframe_sign():
    m = M()
    for s in (-1, 1):
        k.box("panel", (0.6, 0.02, 0.9), (0, s * 0.12, 0.44), m["cardboard"], bevel=0.01, rot=(s * math.radians(14), 0, 0))
    k.save("aframe_sign", OUT, 1.0, preview=PREVIEW)


for fn in (reception_counter, column, lambda: sofa("lobby_sofa", "fabric_gray"), coffee_table, potted_palm, turnstile,
           office_chair, desk_island, bookshelf, standing_bar, barrel, cardboard_chair, cardboard_stack, dome_tent,
           kettle_grill, lambda: sofa("red_sofa", "fabric_red", legs="black"), speaker, floor_lamp, aframe_sign):
    if ONLY and getattr(fn, "__name__", "") not in ONLY:
        continue
    k.reset()
    fn()
