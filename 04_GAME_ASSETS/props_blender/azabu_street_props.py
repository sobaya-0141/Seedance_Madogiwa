"""麻布十番ステージの大道具（その2）: 駅前の設備・車・遠景のビル。

箱や Kenney の素材のまま残っていた物を作り直す。正面は -Y、上は +Z、足元の中心が原点（車は前が -Y）。
blender --background --python azabu_street_props.py -- --out ../models3d/blender/azabu [--only taxi,police_car] [--no-preview]
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import propkit as k  # noqa: E402

OUT = k.out_dir()
PREVIEW = "--no-preview" not in sys.argv
ONLY = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else []


def M():
    return dict(
        alu=k.mat("aluminium", (0.62, 0.63, 0.65), 0.35, 1.0),
        steel_dark=k.mat("steel_dark", (0.12, 0.12, 0.13), 0.45, 0.8),
        glass=k.mat("glass_clear", (0.55, 0.65, 0.7), 0.05, 0.0, alpha=0.3),
        rubber=k.mat("tire", (0.03, 0.03, 0.03), 0.85),
        black=k.mat("black_plastic", (0.025, 0.025, 0.028), 0.5),
        white=k.mat("white_paint", (0.85, 0.85, 0.84), 0.35),
        navy=k.mat("navy_panel", (0.02, 0.05, 0.18), 0.4),
        wood=k.tex_mat("wood", "wood_floor", tint=(0.55, 0.36, 0.24)),
        head=k.mat("headlight", (1.0, 0.97, 0.9), 0.2, emit=(1.0, 0.95, 0.85), emit_strength=3.0),
        tail=k.mat("taillight", (0.5, 0.02, 0.02), 0.3, emit=(1.0, 0.05, 0.03), emit_strength=2.0),
        concrete=k.tex_mat("concrete", "painted_plaster_wall", tint=(0.74, 0.73, 0.7)),
    )


def rod(name, p1, p2, r, mat, verts=8):
    """2点を結ぶ丸棒"""
    a, b = Vector(p1), Vector(p2)
    d = b - a
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_euler()
    return k.cyl(name, r, d.length, tuple((a + b) / 2), mat, verts=verts, rot=tuple(rot))


def taper(ob, fx, fy, dy=0.0):
    """箱の上面だけを縮める（車の窓まわり・屋根を台形にする）"""
    zs = [v.co.z for v in ob.data.vertices]
    mid = (max(zs) + min(zs)) / 2
    for v in ob.data.vertices:
        if v.co.z > mid:
            v.co.x *= fx
            v.co.y = v.co.y * fy + dy
    return ob


# ---------------------------------------------------------------- 車

def sedan(name, lower, upper, roof_item):
    """日本のセダン（タクシー・パトカー）。全長4.7m・幅1.72m。lower / upper は車体の下半分・上半分の色"""
    m = M()
    L, W = 4.7, 1.72
    lo = k.mat(f"{name}_lower", lower, 0.3, 0.3)
    up = k.mat(f"{name}_upper", upper, 0.3, 0.3)
    glass = k.mat("car_glass", (0.03, 0.04, 0.05), 0.05, 0.3)
    # 車体: 下（バンパーの高さまで）と上（窓の下まで）
    k.box("body_lo", (W, L, 0.36), (0, 0, 0.38), lo, bevel=0.07)
    k.box("body_up", (W - 0.02, L - 0.12, 0.3), (0, 0.02, 0.7), up, bevel=0.08)
    # 窓（台形のガラスの箱）と屋根
    cab = k.box("cabin", (W - 0.12, 2.35, 0.5), (0, 0.25, 1.1), glass, bevel=0.04)
    taper(cab, 0.86, 0.66, 0.05)
    roof = k.box("roof", (W - 0.3, 1.5, 0.06), (0, 0.3, 1.36), up, bevel=0.02)
    # 柱（前・中・後）
    # 柱（前・中・後）。窓の台形の角に沿わせる（下端は窓の下の角、上端は屋根の角）
    hw0, hw1 = (W - 0.12) / 2 + 0.01, (W - 0.12) / 2 * 0.86 + 0.01
    for y0, y1 in ((-0.92, -0.55), (0.25, 0.22), (1.42, 0.98)):
        for sx in (-1, 1):
            rod("pillar", (sx * hw0, y0, 0.86), (sx * hw1, y1, 1.34), 0.035, up, verts=6)
    # タイヤとホイール
    for y in (-1.45, 1.42):
        for sx in (-1, 1):
            x = sx * (W / 2 - 0.12)
            k.cyl("tire", 0.32, 0.22, (x, y, 0.32), m["rubber"], verts=20, rot=(0, math.pi / 2, 0))
            k.cyl("wheel", 0.19, 0.235, (x, y, 0.32), m["alu"], verts=16, rot=(0, math.pi / 2, 0))
            k.box("arch", (0.06, 0.8, 0.22), (sx * (W / 2 + 0.005), y, 0.58), m["black"], bevel=0.02)
    # 前: グリル・ライト・バンパー / 後: テールランプ
    k.box("grille", (0.9, 0.04, 0.16), (0, -L / 2 - 0.01, 0.6), m["black"], bevel=0.01)
    for sx in (-1, 1):
        k.box("headlight", (0.32, 0.05, 0.12), (sx * 0.6, -L / 2 + 0.01, 0.62), m["head"], bevel=0.02)
        k.box("taillight", (0.34, 0.05, 0.12), (sx * 0.6, L / 2 - 0.01, 0.66), m["tail"], bevel=0.02)
        k.box("mirror", (0.16, 0.08, 0.1), (sx * (W / 2 + 0.06), -0.75, 0.95), up, bevel=0.02)
    for y in (-L / 2 - 0.02, L / 2 + 0.02):
        k.box("bumper", (W - 0.06, 0.1, 0.14), (0, y, 0.32), m["alu"] if name == "taxi" else m["black"], bevel=0.03)
        k.box("plate", (0.34, 0.02, 0.17), (0, y + (-0.04 if y < 0 else 0.04), 0.46), k.mat("plate", (0.92, 0.92, 0.88), 0.4), bevel=0.0)
    roof_item(m)
    k.save(name, OUT, 1.6, preview=PREVIEW)


def taxi():
    def andon(m):
        # 屋根の行灯（白とオレンジ）
        k.box("andon", (0.5, 0.18, 0.2), (0, 0.15, 1.5), k.mat("andon", (1.0, 0.9, 0.7), 0.3, emit=(1.0, 0.85, 0.55), emit_strength=2.0), bevel=0.05)
        k.box("andon_base", (0.56, 0.22, 0.04), (0, 0.15, 1.4), k.mat("andon_base", (0.85, 0.35, 0.05), 0.4), bevel=0.01)
    sedan("taxi", (0.85, 0.55, 0.02), (0.85, 0.55, 0.02), andon)


def police_car():
    def lightbar(m):
        k.box("lightbar_base", (1.2, 0.28, 0.06), (0, 0.3, 1.42), m["black"], bevel=0.01)
        red = k.mat("police_red", (0.6, 0.02, 0.02), 0.2, emit=(1.0, 0.05, 0.03), emit_strength=3.0)
        k.box("lightbar", (1.16, 0.24, 0.13), (0, 0.3, 1.52), red, bevel=0.04)
    sedan("police_car", (0.02, 0.02, 0.025), (0.88, 0.88, 0.87), lightbar)


# ---------------------------------------------------------------- 駅前

def subway_entrance():
    """地下鉄の出入口（幅3.0m・長さ4.6m）。-Y の端は壁（路線図）、+Y の端が入口。看板の文字はゲーム側で載せる"""
    m = M()
    W, L, H = 3.0, 4.6, 2.65
    k.box("canopy", (W + 0.3, L + 0.3, 0.2), (0, 0, H + 0.1), m["white"], bevel=0.04)
    k.box("canopy_edge", (W + 0.34, L + 0.34, 0.06), (0, 0, H + 0.22), m["alu"], bevel=0.01)
    # 両側のガラスの壁と、アルミの枠
    for sx in (-1, 1):
        x = sx * (W / 2 - 0.05)
        k.box("side_glass", (0.03, L - 0.2, H - 0.25), (x, 0, H / 2 + 0.05), m["glass"], bevel=0.0)
        for z in (0.12, H - 0.05):
            k.box("side_rail", (0.08, L - 0.1, 0.08), (x, 0, z), m["alu"], bevel=0.01)
        for i in range(5):
            y = -L / 2 + 0.05 + i * (L - 0.1) / 4
            k.box("side_post", (0.08, 0.08, H), (x, y, H / 2), m["alu"], bevel=0.01)
        # 手すり（下り階段に沿って下がっていく）
        rod("handrail", (sx * (W / 2 - 0.25), L / 2 - 0.1, 0.9), (sx * (W / 2 - 0.25), -L / 2 + 0.6, 0.1), 0.03, m["alu"])
    # 奥の壁と、光る路線図
    k.box("back_wall", (W - 0.1, 0.12, H), (0, -L / 2 + 0.06, H / 2), k.mat("entrance_wall", (0.22, 0.23, 0.25), 0.5), bevel=0.01)
    k.box("route_map", (1.6, 0.04, 0.9), (0, -L / 2 + 0.14, 1.6), k.mat("route_map", (0.85, 0.88, 0.9), 0.4, emit=(0.9, 0.95, 1.0), emit_strength=0.8), bevel=0.0)
    # 下り階段（地面より下は作れないので、暗い穴と段の縁で見せる）
    k.box("stair_hole", (W - 0.5, L - 0.6, 0.02), (0, 0.15, 0.01), k.mat("stair_dark", (0.02, 0.02, 0.025), 0.9), bevel=0.0)
    for i in range(6):
        y = L / 2 - 0.45 - i * 0.5
        k.box("step_nose", (W - 0.55, 0.06, 0.022), (0, y, 0.022), k.mat("step_nose", (0.75, 0.6, 0.1), 0.5), bevel=0.0)
    # 両端の看板（紺）
    for y in (-L / 2 + 0.4, L / 2 - 0.4):
        k.box("sign_panel", (2.6, 0.1, 0.7), (0, y * 1.0, H + 0.6), m["navy"], bevel=0.02)
        k.box("sign_post", (0.08, 0.08, 0.5), (0, y, H + 0.22), m["alu"], bevel=0.0)
    k.save("subway_entrance", OUT, 3.6, preview=PREVIEW)


def bus_stop():
    """バス停の上屋（幅4.2m・奥行き1.6m）。背面（+Y）がガラス、片側に光る広告板、中にベンチ"""
    m = M()
    W, D, H = 4.2, 1.6, 2.5
    roof = k.box("roof", (W, D, 0.1), (0, 0, H), m["alu"], bevel=0.02)
    k.box("roof_edge", (W + 0.04, 0.06, 0.18), (0, -D / 2, H - 0.02), m["white"], bevel=0.01)
    for x in (-W / 2 + 0.1, W / 2 - 0.1):
        k.box("post", (0.1, 0.1, H), (x, D / 2 - 0.1, H / 2), m["alu"], bevel=0.01)
    k.box("back_glass", (W - 0.3, 0.03, 2.0), (0, D / 2 - 0.1, 1.2), m["glass"], bevel=0.0)
    k.box("back_rail", (W - 0.2, 0.06, 0.06), (0, D / 2 - 0.1, 0.2), m["alu"], bevel=0.0)
    ad = k.mat("bus_ad", (0.9, 0.85, 0.7), 0.4, emit=(1.0, 0.9, 0.7), emit_strength=1.2)
    k.box("ad_frame", (0.12, 1.3, 2.1), (W / 2 - 0.1, 0.1, 1.15), m["alu"], bevel=0.01)
    k.box("ad", (0.13, 1.15, 1.9), (W / 2 - 0.1, 0.1, 1.15), ad, bevel=0.0)
    for i in range(6):
        k.box("seat_slat", (2.4, 0.07, 0.03), (-0.3, D / 2 - 0.55 + i * 0.075, 0.45), m["wood"], bevel=0.005, tex_scale=1.0)
    for x in (-1.4, 0.8):
        k.box("seat_leg", (0.06, 0.4, 0.45), (x, D / 2 - 0.35, 0.225), m["steel_dark"], bevel=0.0)
    k.save("bus_stop", OUT, 2.6, preview=PREVIEW)


def bus_pole():
    """バス停の標識（丸い看板。文字はゲーム側）"""
    m = M()
    k.cyl("base", 0.25, 0.12, (0, 0, 0.06), m["concrete"], verts=20)
    k.cyl("pole", 0.04, 2.6, (0, 0, 1.3), m["alu"], verts=12)
    k.cyl("sign", 0.3, 0.05, (0, 0, 2.45), m["white"], verts=28, rot=(math.pi / 2, 0, 0))
    k.torus("sign_ring", 0.3, 0.02, (0, 0, 2.45), k.mat("bus_blue", (0.05, 0.2, 0.6), 0.4), rot=(math.pi / 2, 0, 0), major=28, minor=6)
    k.box("timetable", (0.4, 0.03, 0.5), (0, 0, 1.5), m["white"], bevel=0.01)
    k.save("bus_pole", OUT, 2.8, preview=PREVIEW)


def bench():
    """公園・歩道のベンチ（長さ2.0m）。座面と背もたれは木の板、脚は鋳物。背もたれは +Y"""
    m = M()
    for i in range(4):
        k.box("seat", (2.0, 0.1, 0.035), (0, -0.2 + i * 0.12, 0.45), m["wood"], bevel=0.008, tex_scale=1.0)
    for i in range(3):
        k.box("back", (2.0, 0.035, 0.1), (0, 0.28, 0.62 + i * 0.13), m["wood"], bevel=0.008, tex_scale=1.0)
    for x in (-0.85, 0.85):
        rod("leg_f", (x, -0.25, 0.0), (x, -0.2, 0.44), 0.025, m["steel_dark"], 8)
        rod("leg_b", (x, 0.25, 0.0), (x, 0.22, 0.44), 0.025, m["steel_dark"], 8)
        rod("leg_back", (x, 0.22, 0.44), (x, 0.3, 0.92), 0.022, m["steel_dark"], 8)
        rod("arm", (x, -0.25, 0.64), (x, 0.25, 0.66), 0.022, m["steel_dark"], 8)
        rod("arm_post", (x, -0.22, 0.44), (x, -0.24, 0.64), 0.02, m["steel_dark"], 8)
    k.save("bench", OUT, 1.0, preview=PREVIEW)


def bicycle(name, color):
    """ママチャリ（全長1.8m）。長さは X 方向、前は -X。前かご付き"""
    m = M()
    frame = k.mat(f"{name}_frame", color, 0.3, 0.4)
    for x in (-0.55, 0.55):
        k.torus("tire", 0.33, 0.022, (x, 0, 0.35), m["rubber"], rot=(math.pi / 2, 0, 0), major=28, minor=6)
        k.torus("rim", 0.31, 0.01, (x, 0, 0.35), m["alu"], rot=(math.pi / 2, 0, 0), major=28, minor=4)
        k.cyl("hub", 0.04, 0.1, (x, 0, 0.35), m["alu"], verts=10, rot=(math.pi / 2, 0, 0))
        for a in range(8):
            ang = a * math.pi / 8
            rod("spoke", (x + math.cos(ang) * 0.3, 0, 0.35 + math.sin(ang) * 0.3), (x - math.cos(ang) * 0.3, 0, 0.35 - math.sin(ang) * 0.3), 0.004, m["alu"], 4)
    # フレーム（下がったトップチューブのママチャリ型）
    bb = (0.0, 0, 0.32)
    rod("down", (-0.4, 0, 0.85), bb, 0.022, frame)
    rod("seat_tube", bb, (0.12, 0, 0.8), 0.022, frame)
    rod("chain_stay", bb, (0.55, 0, 0.35), 0.016, frame)
    rod("seat_stay", (0.12, 0, 0.75), (0.55, 0, 0.35), 0.015, frame)
    rod("fork", (-0.42, 0, 0.88), (-0.55, 0, 0.35), 0.017, frame)
    rod("stem", (-0.42, 0, 0.88), (-0.45, 0, 1.0), 0.016, m["alu"])
    rod("bar", (-0.47, -0.28, 1.02), (-0.47, 0.28, 1.02), 0.013, m["alu"])
    for s in (-1, 1):
        k.cyl("grip", 0.02, 0.11, (-0.47, s * 0.27, 1.02), m["black"], verts=8, rot=(math.pi / 2, 0, 0))
    k.box("saddle", (0.26, 0.15, 0.06), (0.14, 0, 0.86), m["black"], bevel=0.025)
    k.box("basket", (0.32, 0.38, 0.24), (-0.66, 0, 0.92), k.mat("basket", (0.15, 0.15, 0.16), 0.5, 0.6), bevel=0.01)
    k.box("carrier", (0.4, 0.16, 0.02), (0.5, 0, 0.72), m["alu"], bevel=0.0)
    for s in (-1, 1):
        k.box("fender", (0.6, 0.04, 0.02), (0.55, s * 0.0, 0.69), frame, bevel=0.0) if s > 0 else None
    k.cyl("lamp", 0.04, 0.07, (-0.5, 0, 0.78), m["head"], verts=10, rot=(0, math.pi / 2, 0))
    k.box("stand", (0.02, 0.3, 0.3), (0.45, 0, 0.15), m["alu"], bevel=0.0)
    k.save(name, OUT, 1.1, preview=PREVIEW)


def nobori():
    """のぼり旗（竿の高さ3.0m）。竿は原点、旗は +X 側に垂れる。文字はゲーム側"""
    m = M()
    k.cyl("base", 0.2, 0.25, (0, 0, 0.125), k.mat("water_base", (0.35, 0.36, 0.38), 0.6), verts=16)
    k.cyl("pole", 0.018, 3.0, (0, 0, 1.6), m["white"], verts=8)
    k.cyl("top_bar", 0.012, 0.66, (0.33, 0, 2.95), m["white"], verts=6, rot=(0, math.pi / 2, 0))
    red = k.mat("nobori_red", (0.75, 0.08, 0.03), 0.9)
    k.box("flag", (0.6, 0.012, 2.1), (0.34, 0, 1.88), red, bevel=0.0)
    k.box("flag_edge", (0.05, 0.014, 2.1), (0.07, 0, 1.88), m["white"], bevel=0.0)
    for z in (1.0, 1.7, 2.4):
        k.torus("ring", 0.025, 0.006, (0.0, 0, z), m["white"], major=10, minor=4)
    k.save("nobori", OUT, 3.1, preview=PREVIEW)


def barricade():
    """A 型バリケード（幅2.7m）。黄黒の板2枚を、白い脚で挟む"""
    m = M()
    yellow = k.mat("barricade_yellow", (0.9, 0.62, 0.02), 0.45)
    black = k.mat("barricade_black", (0.03, 0.03, 0.03), 0.45)
    for z in (0.55, 0.95):
        for i in range(10):
            x = -1.215 + i * 0.27
            k.box("stripe", (0.27, 0.04, 0.22), (x, 0, z), yellow if i % 2 == 0 else black, bevel=0.0)
        k.box("board_edge", (2.72, 0.05, 0.02), (0, 0, z + 0.115), m["white"], bevel=0.0)
    for x in (-1.36, 1.36):
        for s in (-1, 1):
            rod("leg", (x, 0, 1.12), (x, s * 0.3, 0.0), 0.03, m["white"], 8)
        k.box("leg_top", (0.08, 0.1, 0.06), (x, 0, 1.13), m["white"], bevel=0.01)
        for s in (-1, 1):
            k.box("foot", (0.1, 0.12, 0.03), (x, s * 0.3, 0.015), m["black"], bevel=0.0)
    k.save("barricade", OUT, 1.2, preview=PREVIEW)


# ---------------------------------------------------------------- 遠景のビル

def _lit_windows(W, D, H, floor_h, rng, n, warm=True):
    lit = k.mat("lit_window" + ("_warm" if warm else "_cool"), (1.0, 0.85, 0.6) if warm else (0.85, 0.92, 1.0), 0.3,
                emit=(1.0, 0.8, 0.5) if warm else (0.8, 0.9, 1.0), emit_strength=2.5)
    for _ in range(n):
        f = rng.randint(1, int(H / floor_h) - 2)
        z = f * floor_h + floor_h * 0.5
        side = rng.randint(0, 3)
        if side < 2:
            x = rng.uniform(-W / 2 + 1.0, W / 2 - 1.0)
            y = (-D / 2 - 0.02) if side == 0 else (D / 2 + 0.02)
            k.box("lit", (rng.uniform(1.2, 3.0), 0.03, floor_h * 0.55), (x, y, z), lit, bevel=0.0)
        else:
            y = rng.uniform(-D / 2 + 1.0, D / 2 - 1.0)
            x = (-W / 2 - 0.02) if side == 2 else (W / 2 + 0.02)
            k.box("lit", (0.03, rng.uniform(1.2, 3.0), floor_h * 0.55), (x, y, z), lit, bevel=0.0)


def tower_glass(name="tower_glass", W=18.0, D=18.0, H=60.0, lit_n=26):
    """ガラス張りの高層ビル（既定は18×18m・高さ60m）。縦のフィンと階の帯"""
    rng = random.Random(11)
    fh = 4.0
    glass = k.mat("curtain_glass", (0.12, 0.17, 0.24), 0.08, 0.7)
    fin = k.mat("curtain_fin", (0.55, 0.57, 0.6), 0.35, 0.9)
    k.box("core", (W, D, H), (0, 0, H / 2), glass, bevel=0.0)
    for side in range(4):
        L = W if side < 2 else D
        n = int(L / 1.8)
        for i in range(n + 1):
            t = -L / 2 + i * L / n
            if side < 2:
                k.box("fin", (0.12, 0.35, H), (t, (-1 if side == 0 else 1) * (D / 2 + 0.15), H / 2), fin, bevel=0.0)
            else:
                k.box("fin", (0.35, 0.12, H), ((-1 if side == 2 else 1) * (W / 2 + 0.15), t, H / 2), fin, bevel=0.0)
    for f in range(1, int(H / fh)):
        k.box("band", (W + 0.4, D + 0.4, 0.25), (0, 0, f * fh), fin, bevel=0.0)
    k.box("crown", (W - 2, D - 2, 3.0), (0, 0, H + 1.5), fin, bevel=0.0)
    k.box("roof_box", (6, 6, 2.5), (2, -1, H + 4.2), k.mat("roof_grey", (0.4, 0.41, 0.43), 0.6), bevel=0.0)
    k.cyl("antenna", 0.15, 8.0, (-3, 3, H + 7.0), fin, verts=6)
    _lit_windows(W, D, H, fh, rng, lit_n, warm=False)
    k.save(name, OUT, H + 10, preview=PREVIEW)


def tower_hq():
    """アクシデンチュア本社ビル（34×14m・高さ60m）。ゲーム側で引き伸ばさずに使う"""
    tower_glass("tower_hq", 34.0, 14.0, 60.0, 40)


def tower_office():
    """石張りのオフィスビル（20×16m・高さ45m）。階ごとの横長の窓"""
    rng = random.Random(23)
    W, D, H, fh = 20.0, 16.0, 45.0, 3.75
    stone = k.mat("office_stone", (0.66, 0.62, 0.56), 0.7)
    glass = k.mat("office_glass", (0.08, 0.1, 0.13), 0.1, 0.5)
    k.box("core", (W - 0.6, D - 0.6, H), (0, 0, H / 2), glass, bevel=0.0)
    for f in range(int(H / fh) + 1):
        k.box("spandrel", (W, D, fh * 0.42), (0, 0, f * fh + fh * 0.21), stone, bevel=0.0)
    for side in range(4):
        L = W if side < 2 else D
        n = int(L / 4.0)
        for i in range(n + 1):
            t = -L / 2 + i * L / n
            if side < 2:
                k.box("pier", (0.5, 0.5, H), (t, (-1 if side == 0 else 1) * (D / 2), H / 2), stone, bevel=0.0)
            else:
                k.box("pier", (0.5, 0.5, H), ((-1 if side == 2 else 1) * (W / 2), t, H / 2), stone, bevel=0.0)
    k.box("parapet", (W + 0.3, D + 0.3, 1.2), (0, 0, H + 0.6), stone, bevel=0.0)
    for i in range(3):
        k.box("roof_unit", (2.5, 1.8, 1.6), (-5 + i * 4, 2, H + 0.8), k.mat("roof_grey", (0.4, 0.41, 0.43), 0.6), bevel=0.0)
    _lit_windows(W, D, H, fh, rng, 30, warm=True)
    k.save("tower_office", OUT, H + 4, preview=PREVIEW)


def tower_mansion():
    """マンション（22×12m・高さ40m）。正面にバルコニーとガラスの手すり"""
    rng = random.Random(37)
    W, D, H, fh = 22.0, 12.0, 40.0, 3.0
    wall = k.mat("mansion_wall", (0.82, 0.78, 0.72), 0.7)
    glass = k.mat("mansion_glass", (0.1, 0.12, 0.15), 0.1, 0.5)
    rail = k.mat("mansion_rail", (0.45, 0.55, 0.6), 0.1, 0.3)
    k.box("core", (W, D, H), (0, 0, H / 2), wall, bevel=0.0)
    k.box("front_glass", (W - 1.0, 0.05, H - 3.0), (0, -D / 2 - 0.03, H / 2 + 0.5), glass, bevel=0.0)
    for f in range(1, int(H / fh)):
        z = f * fh
        k.box("balcony", (W - 0.6, 1.4, 0.2), (0, -D / 2 - 0.7, z), wall, bevel=0.0)
        k.box("rail", (W - 0.6, 0.05, 1.0), (0, -D / 2 - 1.38, z + 0.6), rail, bevel=0.0)
        for i in range(1, 6):
            k.box("divider", (0.15, 1.4, fh - 0.2), (-W / 2 + i * W / 6, -D / 2 - 0.7, z + fh / 2), wall, bevel=0.0)
    for side in (-1, 1):
        for f in range(1, int(H / fh)):
            k.box("side_win", (0.05, 2.0, 1.2), (side * (W / 2 + 0.03), 1.5, f * fh + 1.5), glass, bevel=0.0)
    k.box("roof", (W + 0.2, D + 0.2, 0.8), (0, 0, H + 0.4), wall, bevel=0.0)
    _lit_windows(W, D + 2.8, H, fh, rng, 24, warm=True)
    k.save("tower_mansion", OUT, H + 2, preview=PREVIEW)


for fn in (taxi, police_car, subway_entrance, bus_stop, bus_pole, bench, lambda: bicycle("bicycle_silver", (0.7, 0.71, 0.73)),
           lambda: bicycle("bicycle_red", (0.6, 0.04, 0.03)), nobori, barricade, tower_glass, tower_hq, tower_office, tower_mansion):
    nm = getattr(fn, "__name__", "")
    if ONLY and nm not in ONLY and not (nm == "<lambda>" and "bicycle" in ONLY):
        continue
    k.reset()
    fn()
