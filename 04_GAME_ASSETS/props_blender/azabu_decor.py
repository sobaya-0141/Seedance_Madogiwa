"""麻布十番ステージの店先の飾りと明かり（Blender 製）。店の前（歩道側）に置く小物。

- deco_olive: 素焼きの大鉢に植えたオリーブの木（高さ1.7m）
- deco_flowers: 大小3つの鉢の寄せ植え（ピンク・白・黄の花）
- deco_chalk: 木枠の黒板の立て看板（A型。文字はなし）
- deco_terrace: カフェのテラス席（丸テーブル・椅子2脚・生成りのパラソル）
- deco_andon: 行灯の品書き（木の脚に、和紙の光る箱。居酒屋・そば屋の前）
- deco_beer_display: ビールケースを積んだ陳列と、ケースの上の一升瓶・ビール瓶（居酒屋の前）
- deco_wall_lamp: 壁付けのランプ（真鍮の腕とガラスのほや、電球が光る）。原点は壁に付く面の中心
- deco_bulb: ガーランドの電球1個（ゲーム側で通りの上に並べる）
正面は -Y、上は +Z、足元の中心が原点。葉・花の絵は azabu_landmarks.py が描いた PNG（textures/）を使う。
blender --background --python azabu_decor.py -- --out ../models3d/blender/azabu [--only deco_olive] [--no-preview]
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
TEX_DIR = os.path.join(os.path.dirname(__file__), "..", "models3d", "blender", "azabu", "textures")
REGISTRY = []


def reg(fn):
    REGISTRY.append(fn)
    return fn


def card_mat(png, name):
    """透過 PNG（葉・花の絵）を両面・切り抜きで貼る材質"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(os.path.join(TEX_DIR, png), check_existing=True)
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    rnd = nt.nodes.new("ShaderNodeMath")
    rnd.operation = "ROUND"
    nt.links.new(t.outputs["Alpha"], rnd.inputs[0])
    nt.links.new(rnd.outputs[0], p.inputs["Alpha"])
    p.inputs["Roughness"].default_value = 0.7
    m.use_backface_culling = False
    if hasattr(m, "surface_render_method"):
        m.surface_render_method = "DITHERED"
    return m


def card(center, normal, size, mat, spin):
    n = Vector(normal).normalized()
    rot = n.to_track_quat("Z", "Y").to_euler()
    bpy.ops.mesh.primitive_plane_add(size=size, location=tuple(center), rotation=tuple(rot))
    ob = bpy.context.active_object
    ob.rotation_euler.rotate_axis("Z", spin)
    ob.data.materials.append(mat)
    return ob


def foliage_ball(center, r, mat, core_mat, rng, n=24):
    """葉の塊: 濃い緑の芯の表面に、葉の絵の板を外向きに並べる"""
    k.sphere("foliage_core", r * 0.5, tuple(center), core_mat, segs=10, rings=7)
    golden = math.pi * (3.0 - math.sqrt(5.0))
    for i in range(n):
        y = 1.0 - (i / (n - 1)) * 1.7
        rr = math.sqrt(max(0.0, 1.0 - y * y))
        a = i * golden
        d = Vector((math.cos(a) * rr, math.sin(a) * rr, y))
        card(Vector(center) + d * r * 0.8, d, r * 0.95, mat, rng.uniform(0, math.tau))


def rod(name, p1, p2, r, mat, verts=8):
    a, b = Vector(p1), Vector(p2)
    d = b - a
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_euler()
    return k.cyl(name, r, d.length, tuple((a + b) / 2), mat, verts=verts, rot=tuple(rot))


def M():
    return dict(
        terracotta=k.mat("terracotta", (0.48, 0.2, 0.1), 0.85),
        terracotta_dark=k.mat("terracotta_dark", (0.34, 0.14, 0.07), 0.85),
        soil=k.mat("soil", (0.12, 0.08, 0.05), 0.95),
        bark=k.mat("olive_bark", (0.33, 0.28, 0.22), 0.9),
        leaf_core=k.mat("leaf_core_dark", (0.025, 0.06, 0.02), 1.0),
        wood=k.tex_mat("wood", "wood_floor", tint=(0.55, 0.36, 0.24)),
        wood_dark=k.mat("wood_dark", (0.14, 0.08, 0.045), 0.6),
        iron=k.mat("iron_black", (0.05, 0.05, 0.055), 0.45, 0.8),
        brass=k.mat("brass", (0.72, 0.52, 0.22), 0.3, 1.0),
        cloth=k.mat("parasol_cloth", (0.92, 0.88, 0.78), 0.85),
        chalk=k.mat("chalkboard", (0.07, 0.09, 0.08), 0.92),
        washi=k.mat("andon_washi", (1.0, 0.92, 0.75), 0.7, emit=(1.0, 0.82, 0.5), emit_strength=3.0),
        bulb=k.mat("bulb_warm", (1.0, 0.9, 0.7), 0.2, emit=(1.0, 0.78, 0.45), emit_strength=8.0),
        glass=k.mat("lamp_glass", (0.95, 0.92, 0.85), 0.05, alpha=0.35),
    )


# ---------------------------------------------------------------- 植物

@reg
def deco_olive():
    m = M()
    rng = random.Random(3)
    leaves = card_mat("zelkova_leaves.png", "olive_leaves")
    # 素焼きの大鉢（口が広い）と縁
    k.cyl("pot", 0.3, 0.55, (0, 0, 0.275), m["terracotta"], verts=24, r2=0.36, bevel=0.01)
    k.torus("pot_rim", 0.36, 0.035, (0, 0, 0.55), m["terracotta_dark"], major=24, minor=8)
    k.cyl("soil", 0.33, 0.03, (0, 0, 0.53), m["soil"], verts=24)
    # 2本に分かれる細い幹
    rod("trunk", (0, 0, 0.5), (0.03, 0, 1.05), 0.035, m["bark"])
    rod("trunk_a", (0.03, 0, 1.0), (-0.18, 0.05, 1.45), 0.025, m["bark"])
    rod("trunk_b", (0.03, 0, 1.0), (0.2, -0.05, 1.4), 0.025, m["bark"])
    for c, r in (((-0.2, 0.05, 1.5), 0.26), ((0.22, -0.05, 1.45), 0.24), ((0.0, 0.0, 1.62), 0.22)):
        foliage_ball(c, r, leaves, m["leaf_core"], rng, 20)
    k.save("deco_olive", OUT, 1.8, preview=PREVIEW)


@reg
def deco_flowers():
    m = M()
    rng = random.Random(5)
    leaves = card_mat("hydrangea_leaves.png", "flower_leaves")
    pink = card_mat("hydrangea_pink_florets.png", "flower_pink")
    blue = card_mat("hydrangea_blue_florets.png", "flower_blue")
    for (x, y, r, h, fl) in ((-0.28, 0.05, 0.2, 0.32, pink), (0.22, -0.08, 0.16, 0.24, blue), (0.05, 0.22, 0.13, 0.42, pink)):
        k.cyl("pot", r * 0.8, h, (x, y, h / 2), m["terracotta"], verts=18, r2=r, bevel=0.008)
        k.torus("pot_rim", r, 0.02, (x, y, h), m["terracotta_dark"], major=18, minor=6)
        k.cyl("soil", r * 0.92, 0.02, (x, y, h - 0.01), m["soil"], verts=18)
        foliage_ball((x, y, h + r * 0.55), r * 0.95, leaves, m["leaf_core"], rng, 20)
        for i in range(9):
            a = rng.uniform(0, math.tau)
            c = Vector((x + math.cos(a) * r * 0.5, y + math.sin(a) * r * 0.5, h + r * rng.uniform(0.7, 1.1)))
            card(c, Vector((math.cos(a) * 0.4, math.sin(a) * 0.4, 1.0)), r * 0.7, fl, rng.uniform(0, math.tau))
    k.save("deco_flowers", OUT, 0.8, preview=PREVIEW)


# ---------------------------------------------------------------- 看板・席

@reg
def deco_chalk():
    m = M()
    for s in (-1, 1):
        ang = math.radians(13)
        k.box("frame", (0.62, 0.035, 1.0), (0, s * 0.11, 0.49), m["wood"], bevel=0.01, rot=(s * ang, 0, 0), tex_scale=1.0)
        k.box("board", (0.52, 0.04, 0.78), (0, s * 0.112 - s * 0.006, 0.53), m["chalk"], bevel=0.004, rot=(s * ang, 0, 0))
        # チョークで描いた枠と、ビールジョッキの絵（文字の代わりに線だけ）
        white = k.mat("chalk_line", (0.92, 0.92, 0.88), 0.9)
        y = s * 0.112 - s * 0.03
        for z in (0.24, 0.84):
            k.box("chalk_rule", (0.44, 0.005, 0.012), (0, y, z), white, bevel=0.0, rot=(s * ang, 0, 0))
        k.box("chalk_mug", (0.12, 0.005, 0.16), (0, y, 0.55), k.mat("chalk_yellow", (0.95, 0.8, 0.3), 0.9), bevel=0.0, rot=(s * ang, 0, 0))
    k.cyl("hinge", 0.012, 0.6, (0, 0, 0.99), m["brass"], verts=8, rot=(0, math.pi / 2, 0))
    k.save("deco_chalk", OUT, 1.05, preview=PREVIEW)


@reg
def deco_terrace():
    m = M()
    # 丸テーブル（鉄の脚と木の天板）
    k.cyl("table_top", 0.36, 0.035, (0, 0, 0.74), m["wood"], verts=28, bevel=0.006, tex_scale=1.0)
    k.cyl("table_leg", 0.025, 0.72, (0, 0, 0.36), m["iron"], verts=10)
    k.cyl("table_foot", 0.22, 0.025, (0, 0, 0.012), m["iron"], verts=20)
    # 椅子2脚（鉄の枠に木の座面。左右からテーブルを向く）
    for s in (-1, 1):
        cx = s * 0.6
        k.box("seat", (0.4, 0.4, 0.03), (cx, 0, 0.46), m["wood"], bevel=0.006, tex_scale=1.0)
        for dx in (-0.17, 0.17):
            for dy in (-0.17, 0.17):
                rod("chair_leg", (cx + dx * 1.1, dy * 1.1, 0.0), (cx + dx, dy, 0.45), 0.012, m["iron"], 6)
        bx = cx + s * 0.19
        for dy in (-0.17, 0.17):
            rod("chair_back", (bx, dy, 0.46), (bx + s * 0.05, dy, 0.88), 0.012, m["iron"], 6)
        for z in (0.68, 0.86):
            rod("chair_rail", (bx + s * 0.04, -0.17, z), (bx + s * 0.04, 0.17, z), 0.01, m["iron"], 6)
    # パラソル（生成りの布。8本の骨）
    k.cyl("pole", 0.02, 2.3, (0, 0, 1.15), m["wood_dark"], verts=8)
    R, apex = 1.15, 2.4
    k.cyl("canopy", R, 0.35, (0, 0, apex - 0.175), m["cloth"], verts=16, r2=0.04)
    for i in range(8):
        a = i / 8 * math.tau
        rod("rib", (0, 0, apex), (math.cos(a) * R, math.sin(a) * R, apex - 0.36), 0.008, m["wood_dark"], 4)
    k.cyl("finial", 0.03, 0.08, (0, 0, apex + 0.04), m["wood_dark"], verts=8)
    k.save("deco_terrace", OUT, 2.5, preview=PREVIEW)


@reg
def deco_andon():
    m = M()
    # 木の4本脚と、光る和紙の箱（品書き。文字はなし、墨の縦線だけ）
    for sx in (-1, 1):
        for sy in (-1, 1):
            k.box("leg", (0.04, 0.04, 1.2), (sx * 0.17, sy * 0.12, 0.6), m["wood_dark"], bevel=0.004)
    k.box("paper", (0.32, 0.22, 0.6), (0, 0, 0.82), m["washi"], bevel=0.004)
    sumi = k.mat("sumi", (0.05, 0.04, 0.03), 0.9)
    for i in range(3):
        k.box("sumi_line", (0.02, 0.005, 0.42), (-0.08 + i * 0.08, -0.113, 0.83), sumi, bevel=0.0)
    for z in (0.5, 1.13):
        k.box("frame", (0.38, 0.28, 0.035), (0, 0, z), m["wood_dark"], bevel=0.005)
    k.box("roof", (0.44, 0.34, 0.04), (0, 0, 1.2), m["wood_dark"], bevel=0.008)
    k.save("deco_andon", OUT, 1.25, preview=PREVIEW)


@reg
def deco_beer_display():
    m = M()
    yellow = k.mat("crate_yellow", (0.85, 0.58, 0.02), 0.45)
    red = k.mat("crate_red", (0.55, 0.03, 0.02), 0.45)
    amber = k.mat("bottle_amber", (0.25, 0.08, 0.01), 0.15)
    green = k.mat("bottle_green", (0.05, 0.18, 0.08), 0.15)
    cap = k.mat("bottle_cap", (0.82, 0.6, 0.12), 0.3, 1.0)
    label = k.mat("bottle_label", (0.92, 0.88, 0.75), 0.6)
    for i, (x, y, z, mt) in enumerate(((-0.25, 0, 0, yellow), (0.25, 0, 0, red), (0, 0, 0.32, yellow))):
        k.box("crate", (0.48, 0.34, 0.3), (x, y, z + 0.15), mt, bevel=0.015)
        for hx in (-0.25, 0.25):
            k.box("crate_hole", (0.12, 0.01, 0.06), (x + hx * 0.6, y - 0.172, z + 0.22), k.mat("crate_shadow", (0.05, 0.03, 0.01), 0.8), bevel=0.0)
    for j, (x, mt, h) in enumerate(((-0.12, green, 0.42), (0.02, amber, 0.3), (0.13, amber, 0.3))):
        z0 = 0.62
        k.cyl("bottle", 0.045 if h > 0.35 else 0.035, h * 0.65, (x, 0, z0 + h * 0.325), mt, verts=10)
        k.cyl("bottle_neck", 0.016, h * 0.3, (x, 0, z0 + h * 0.8), mt, verts=8)
        k.cyl("bottle_cap", 0.018, 0.02, (x, 0, z0 + h * 0.96), cap, verts=8)
        k.cyl("bottle_label", 0.047 if h > 0.35 else 0.037, h * 0.22, (x, 0, z0 + h * 0.3), label, verts=10)
    k.save("deco_beer_display", OUT, 1.1, preview=PREVIEW)


# ---------------------------------------------------------------- 明かり

@reg
def deco_wall_lamp():
    m = M()
    k.box("plate", (0.12, 0.03, 0.18), (0, 0.0, 0.0), m["brass"], bevel=0.006)
    rod("arm", (0, -0.01, 0.02), (0, -0.28, 0.1), 0.012, m["brass"], 8)
    k.cyl("cap", 0.07, 0.04, (0, -0.3, 0.14), m["iron"], verts=12)
    k.cyl("shade", 0.08, 0.16, (0, -0.3, 0.04), m["glass"], verts=14, r2=0.06)
    k.sphere("bulb", 0.035, (0, -0.3, 0.04), m["bulb"], segs=12, rings=8)
    k.save("deco_wall_lamp", OUT, 0.4, preview=PREVIEW)


@reg
def deco_bulb():
    m = M()
    k.cyl("socket", 0.018, 0.04, (0, 0, -0.02), m["iron"], verts=8)
    k.sphere("bulb", 0.04, (0, 0, -0.075), m["bulb"], scale=(1, 1, 1.25), segs=12, rings=8)
    k.save("deco_bulb", OUT, 0.15, preview=PREVIEW)


for fn in REGISTRY:
    if ONLY and fn.__name__ not in ONLY:
        continue
    k.reset()
    fn()
