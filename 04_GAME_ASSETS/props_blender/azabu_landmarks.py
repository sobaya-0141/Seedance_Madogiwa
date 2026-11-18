"""麻布十番ステージの大道具（その3）: 街路樹（ケヤキ）と東京タワー。

- zelkova_tree: 枝分かれする幹と、でこぼこの葉の塊（細分化した球を雲模様で押し出す）。高さ約6m
- hydrangea_blue / hydrangea_pink: 石の鉢に植えた紫陽花（小花の絵と葉の絵を貼った板）
- tokyo_tower: 鉄骨の格子（4本の脚・水平材・X字の筋かい）で組んだ東京タワー。高さ100m（ゲーム側で縮める）。
  紅白の帯（インターナショナルオレンジと白）、大展望台・トップデッキ、アンテナ。夕方なので鉄骨がうっすら灯る
正面は -Y、上は +Z、足元の中心が原点。
blender --background --python azabu_landmarks.py -- --out <dir> [--only tokyo_tower] [--no-preview]
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


def rod(name, p1, p2, r, mat, verts=6):
    a, b = Vector(p1), Vector(p2)
    d = b - a
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_euler()
    return k.cyl(name, r, d.length, tuple((a + b) / 2), mat, verts=verts, rot=tuple(rot))


# ---------------------------------------------------------------- 街路樹

def _clump(name, r, loc, mat, rng):
    """葉の塊: 細分化した球を雲模様で押し出して、でこぼこにする"""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (1.0, 1.0, rng.uniform(0.7, 0.9))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    tex = bpy.data.textures.get("leaf_noise") or bpy.data.textures.new("leaf_noise", "CLOUDS")
    tex.noise_scale = 0.35
    md = ob.modifiers.new("lumpy", "DISPLACE")
    md.texture = tex
    md.strength = r * 0.4
    md.mid_level = 0.5
    md.texture_coords = "GLOBAL"
    ob.data.materials.append(mat)
    for f in ob.data.polygons:
        f.use_smooth = True
    return ob



def leaf_texture(path, size=512, seed=3):
    """ケヤキの葉の絵（透過 PNG）を描く: 細長いギザギザの葉を、緑の濃淡を変えて重ねる"""
    import numpy as np
    rng = np.random.default_rng(seed)
    img = np.zeros((size, size, 4), dtype=np.float32)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    for _ in range(170):
        cx, cy = rng.uniform(40, size - 40, 2)
        L = rng.uniform(26, 44)
        Wd = L * rng.uniform(0.34, 0.42)
        a = rng.uniform(0, math.pi)
        x0, x1 = int(max(0, cx - L)), int(min(size, cx + L))
        y0, y1 = int(max(0, cy - L)), int(min(size, cy + L))
        X = xx[y0:y1, x0:x1] - cx
        Y = yy[y0:y1, x0:x1] - cy
        u = (X * math.cos(a) + Y * math.sin(a)) / L          # 葉の長さ方向（-1〜1）
        v = (-X * math.sin(a) + Y * math.cos(a)) / Wd
        width = np.clip(1.0 - u * u, 0, 1) ** 0.8 * (1.0 + 0.08 * np.sin(u * 22.0))   # 縁のギザギザ
        inside = (np.abs(v) < width) & (np.abs(u) < 1.0)
        g = rng.uniform(0.0, 1.0)
        base = np.array([0.10 + 0.12 * g, 0.24 + 0.2 * g, 0.05 + 0.05 * g], dtype=np.float32)
        shade = (0.75 + 0.35 * (1.0 - np.abs(v) / np.maximum(width, 1e-3)))[..., None]
        vein = (np.abs(v) < 0.06)[..., None] * 0.15
        col = np.clip(base * shade + vein * base, 0, 1)
        region = img[y0:y1, x0:x1]
        region[inside, :3] = col[inside]
        region[inside, 3] = 1.0
    im = bpy.data.images.new("zelkova_leaves", size, size, alpha=True)
    im.pixels.foreach_set(img[::-1].ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    return im


def leaf_card_mat(im, name="zelkova_leaf_card"):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = im
    nt.links.new(tex.outputs["Color"], p.inputs["Base Color"])
    rnd = nt.nodes.new("ShaderNodeMath")
    rnd.operation = "ROUND"   # glTF ではアルファの切り抜き（MASK）として書き出される
    nt.links.new(tex.outputs["Alpha"], rnd.inputs[0])
    nt.links.new(rnd.outputs[0], p.inputs["Alpha"])
    p.inputs["Roughness"].default_value = 0.7
    m.use_backface_culling = False
    if hasattr(m, "surface_render_method"):
        m.surface_render_method = "DITHERED"
    return m


def leaf_cards(center, r, mat, rng, n=6):
    """葉の絵を貼った板を、向きを変えて何枚も重ねる（葉の塊を外から見たときの細かさ）"""
    for _ in range(n):
        loc = (center[0] + rng.uniform(-r, r) * 0.6, center[1] + rng.uniform(-r, r) * 0.6, center[2] + rng.uniform(-r, r) * 0.5)
        bpy.ops.mesh.primitive_plane_add(size=r * 2.2, location=loc,
                                         rotation=(rng.uniform(0.3, 1.3), rng.uniform(-0.5, 0.5), rng.uniform(0, math.tau)))
        ob = bpy.context.active_object
        ob.name = "leaf_card"
        ob.data.materials.append(mat)


def zelkova_tree():
    rng = random.Random(5)
    bark = k.mat("zelkova_bark", (0.24, 0.19, 0.15), 0.85)
    leaves = [k.mat("zelkova_leaf_a", (0.16, 0.34, 0.08), 0.75), k.mat("zelkova_leaf_b", (0.24, 0.44, 0.1), 0.75),
              k.mat("zelkova_leaf_c", (0.07, 0.18, 0.04), 0.95)]
    grate = k.mat("tree_grate", (0.12, 0.1, 0.08), 0.55, 0.8)
    k.box("grate", (1.1, 1.1, 0.04), (0, 0, 0.02), grate, bevel=0.0)
    for i in range(5):
        k.box("grate_bar", (1.0, 0.03, 0.045), (0, -0.4 + i * 0.2, 0.022), grate, bevel=0.0)
    # 幹: 2m まで1本、そこから扇形に3〜4本へ分かれ、さらに枝分かれする（ケヤキの樹形）
    trunk_top = Vector((0, 0, 2.0))
    rod("trunk", (0, 0, 0), tuple(trunk_top), 0.13, bark, 10)
    tips = []

    def branch(p, d, length, r, depth):
        q = p + d * length
        rod("branch", tuple(p), tuple(q), r, bark, 8 if depth == 0 else 6)
        if depth >= 3:
            tips.append(q)
            return
        for _ in range(2 if depth else 1):
            nd = (d + Vector((rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(0.1, 0.5)))).normalized()
            branch(q, nd, length * rng.uniform(0.55, 0.7), r * 0.62, depth + 1)
        if depth == 0:
            tips.append(q)

    n = 5
    for i in range(n):
        a = i / n * math.tau + rng.uniform(-0.3, 0.3)
        d = Vector((math.cos(a) * 0.85, math.sin(a) * 0.85, 1.0)).normalized()
        branch(trunk_top, d, 1.3, 0.085, 0)
    # 葉の塊: 樹冠（横に広い丸い傘。半径2.2m・高さ方向1.4m、中心は4.3m）の表面に並べ、枝先にも1つずつ置く
    os.makedirs(os.path.join(OUT, "textures"), exist_ok=True)
    card = leaf_card_mat(leaf_texture(os.path.join(OUT, "textures", "zelkova_leaves.png")))
    cz, rx, rz = 4.3, 2.2, 1.4
    golden = math.pi * (3.0 - math.sqrt(5.0))
    count = 46
    for i in range(count):
        y = 1.0 - (i / (count - 1)) * 1.35          # 上（1）から、赤道より少し下（-0.35）まで
        rr = math.sqrt(max(0.0, 1.0 - y * y))
        a = i * golden
        loc = (math.cos(a) * rr * rx * rng.uniform(0.85, 1.05), math.sin(a) * rr * rx * rng.uniform(0.85, 1.05), cz + y * rz)
        r = rng.uniform(0.42, 0.62)
        _clump("leaf", r * 0.45, loc, leaves[2], rng)   # 中身（小さめの濃い緑の塊。板のすき間を埋める）
        leaf_cards(loc, r * 1.05, card, rng, 5)
    for i, t in enumerate(tips):
        leaf_cards(tuple(t), rng.uniform(0.4, 0.55), card, rng, 4)
    # 樹冠の芯（すき間から空が透けすぎないように）
    _clump("leaf_core", 1.6, (0, 0, cz - 0.1), leaves[2], rng)
    k.save("zelkova_tree", OUT, 6.5, preview=PREVIEW)


# ---------------------------------------------------------------- 東京タワー

# 高さの割合 t（0 = 足元、1 = アンテナの先）ごとの、鉄骨の四角の半幅（高さに対する割合）
PROFILE = [(0.0, 0.125), (0.04, 0.1), (0.08, 0.082), (0.12, 0.068), (0.17, 0.057), (0.23, 0.047), (0.3, 0.039),
           (0.37, 0.033), (0.44, 0.028), (0.5, 0.024), (0.57, 0.019), (0.64, 0.0145), (0.7, 0.012), (0.75, 0.0105),
           (0.8, 0.0085)]


def half_width(t):
    for (t0, w0), (t1, w1) in zip(PROFILE, PROFILE[1:]):
        if t0 <= t <= t1:
            return w0 + (w1 - w0) * (t - t0) / (t1 - t0)
    return PROFILE[-1][1]


def tokyo_tower():
    H = 100.0
    orange = k.mat("tower_orange", (0.85, 0.22, 0.04), 0.5, 0.3, emit=(1.0, 0.35, 0.08), emit_strength=0.6)
    white = k.mat("tower_white", (0.85, 0.84, 0.8), 0.5, 0.2, emit=(1.0, 0.85, 0.65), emit_strength=0.25)
    deck = k.mat("tower_deck", (0.82, 0.83, 0.84), 0.4, 0.4)
    glow = k.mat("tower_windows", (1.0, 0.85, 0.6), 0.3, emit=(1.0, 0.78, 0.45), emit_strength=2.5)

    def band(t):
        # 紅白の帯（下から オレンジ・白 を交互に 11 本）
        return orange if int(t / 0.8 * 11) % 2 == 0 else white

    # 鉄骨の段（下ほど間隔を広く）
    levels = [0.0]
    while levels[-1] < 0.8:
        levels.append(min(0.8, levels[-1] + 0.012 + 0.018 * (1.0 - levels[-1])))
    corners = [(1, 1), (-1, 1), (-1, -1), (1, -1)]
    for li in range(len(levels) - 1):
        t0, t1 = levels[li], levels[li + 1]
        w0, w1 = half_width(t0) * H, half_width(t1) * H
        z0, z1 = t0 * H, t1 * H
        m = band((t0 + t1) / 2)
        leg_r = max(0.18, 0.6 * (1.0 - t0))
        for cx, cy in corners:
            rod("leg", (cx * w0, cy * w0, z0), (cx * w1, cy * w1, z1), leg_r, m, 6)
        if t0 < 0.05:
            continue   # 足元は4本の脚の間を空けて、アーチで見せる
        for i in range(4):
            ax, ay = corners[i]
            bx, by = corners[(i + 1) % 4]
            rod("girder", (ax * w1, ay * w1, z1), (bx * w1, by * w1, z1), leg_r * 0.45, m, 4)
            rod("brace", (ax * w0, ay * w0, z0), (bx * w1, by * w1, z1), leg_r * 0.3, m, 4)
            rod("brace", (bx * w0, by * w0, z0), (ax * w1, ay * w1, z1), leg_r * 0.3, m, 4)
    # 足元のアーチ（各面）
    t_top = 0.07
    w_top = half_width(t_top) * H
    for i in range(4):
        ax, ay = corners[i]
        bx, by = corners[(i + 1) % 4]
        pts = []
        for s in range(9):
            u = s / 8
            t = 0.02 + (t_top - 0.02) * math.sin(math.pi * u)
            w = half_width(t) * H
            x = (ax + (bx - ax) * u) * w
            y = (ay + (by - ay) * u) * w
            pts.append((x, y, t * H))
        for p, q in zip(pts, pts[1:]):
            rod("arch", p, q, 0.35, orange, 6)
        rod("girder", (ax * w_top, ay * w_top, t_top * H), (bx * w_top, by * w_top, t_top * H), 0.25, orange, 4)
    # 大展望台（2階建て）とトップデッキ
    t_main = 0.45
    wm = half_width(t_main) * H + 1.2
    k.box("main_deck", (wm * 2, wm * 2, 2.4), (0, 0, t_main * H), deck, bevel=0.0)
    k.box("main_deck_win", (wm * 2 + 0.1, wm * 2 + 0.1, 1.0), (0, 0, t_main * H + 0.2), glow, bevel=0.0)
    k.box("main_deck_roof", (wm * 2 + 0.6, wm * 2 + 0.6, 0.4), (0, 0, t_main * H + 1.4), deck, bevel=0.0)
    k.box("main_deck_2f", (wm * 1.6, wm * 1.6, 1.6), (0, 0, t_main * H + 2.4), deck, bevel=0.0)
    k.box("main_deck_2f_win", (wm * 1.6 + 0.1, wm * 1.6 + 0.1, 0.7), (0, 0, t_main * H + 2.5), glow, bevel=0.0)
    t_top_deck = 0.75
    wt = half_width(t_top_deck) * H + 0.8
    k.cyl("top_deck", wt, 1.6, (0, 0, t_top_deck * H), deck, verts=8)
    k.cyl("top_deck_win", wt + 0.05, 0.6, (0, 0, t_top_deck * H + 0.1), glow, verts=8)
    # アンテナ（白と赤の段）
    for i in range(8):
        z0 = 0.8 * H + i * 2.5
        r = 0.6 * (1.0 - i / 9)
        k.cyl("antenna", r, 2.5, (0, 0, z0 + 1.25), orange if i % 2 == 0 else white, verts=8)
    k.cyl("antenna_tip", 0.12, 1.0, (0, 0, H - 0.5), white, verts=6)
    # 足元のビル（フットタウン）
    k.box("foot_town", (H * 0.32, H * 0.2, H * 0.045), (0, -H * 0.02, H * 0.0225), k.mat("foot_town", (0.78, 0.77, 0.74), 0.6), bevel=0.0)
    k.box("foot_town_win", (H * 0.32 + 0.1, H * 0.2 + 0.1, H * 0.01), (0, -H * 0.02, H * 0.025), glow, bevel=0.0)
    k.save("tokyo_tower", OUT, H, elev=6.0, preview=PREVIEW)


# ---------------------------------------------------------------- 紫陽花の鉢

def _save_png(img, path, name):
    im = bpy.data.images.new(name, img.shape[1], img.shape[0], alpha=True)
    im.pixels.foreach_set(img[::-1].ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    return im


def floret_texture(path, palette, size=512, seed=9):
    """紫陽花の小花（4枚の花びら）をすき間なく散らした絵。palette は花びらの色の候補"""
    import numpy as np
    rng = np.random.default_rng(seed)
    img = np.zeros((size, size, 4), dtype=np.float32)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    for _ in range(150):
        cx, cy = rng.uniform(30, size - 30, 2)
        R = rng.uniform(20, 30)
        rot = rng.uniform(0, math.pi / 2)
        base = np.array(palette[rng.integers(len(palette))], dtype=np.float32) * rng.uniform(0.85, 1.1)
        x0, x1 = int(max(0, cx - R * 1.2)), int(min(size, cx + R * 1.2))
        y0, y1 = int(max(0, cy - R * 1.2)), int(min(size, cy + R * 1.2))
        X = xx[y0:y1, x0:x1] - cx
        Y = yy[y0:y1, x0:x1] - cy
        region = img[y0:y1, x0:x1]
        for k_ in range(4):
            a = rot + k_ * math.pi / 2
            px, py = math.cos(a) * R * 0.5, math.sin(a) * R * 0.5
            u = ((X - px) * math.cos(a) + (Y - py) * math.sin(a)) / (R * 0.52)
            v = (-(X - px) * math.sin(a) + (Y - py) * math.cos(a)) / (R * 0.42)
            d = u * u + v * v
            inside = d < 1.0
            shade = (0.7 + 0.45 * (1.0 - d))[..., None]
            col = np.clip(base * shade, 0, 1)
            region[inside, :3] = col[inside]
            region[inside, 3] = 1.0
        c = (X * X + Y * Y) < (R * 0.13) ** 2
        region[c, :3] = np.array([0.95, 0.92, 0.8], dtype=np.float32)
        region[c, 3] = 1.0
    return _save_png(img, path, os.path.basename(path))


def hydrangea_leaf_texture(path, size=512, seed=21):
    """紫陽花の葉: 幅の広い卵形で先がとがり、縁にギザギザ、葉脈が見える"""
    import numpy as np
    rng = np.random.default_rng(seed)
    img = np.zeros((size, size, 4), dtype=np.float32)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    for _ in range(9):
        cx, cy = rng.uniform(110, size - 110, 2)
        L = rng.uniform(85, 110)
        a = rng.uniform(0, math.tau)
        X = xx - cx
        Y = yy - cy
        u = (X * math.cos(a) + Y * math.sin(a)) / L
        v = (-X * math.sin(a) + Y * math.cos(a)) / (L * 0.62)
        t = np.clip((u + 1.0) / 2.0, 0, 1)                      # 0 = 付け根、1 = 先
        width = np.sin(np.pi * t ** 0.8) * (1.0 + 0.06 * np.sin(t * 60.0))
        inside = (np.abs(v) < width) & (np.abs(u) < 1.0)
        g = rng.uniform(0, 1)
        base = np.array([0.13 + 0.06 * g, 0.34 + 0.12 * g, 0.07 + 0.04 * g], dtype=np.float32)
        vein = (np.abs(v) < 0.035) | ((np.abs(np.abs(v) - (t * 3.0 % 1.0) * 0.9) < 0.03) & (np.abs(v) < width * 0.8))
        shade = (0.8 + 0.3 * (1.0 - np.abs(v) / np.maximum(width, 1e-3)))[..., None]
        col = np.clip(base * shade + vein[..., None] * 0.06, 0, 1)
        img[inside, :3] = col[inside]
        img[inside, 3] = 1.0
    return _save_png(img, path, os.path.basename(path))


def _card(center, normal, size, mat, spin):
    n = Vector(normal).normalized()
    rot = n.to_track_quat("Z", "Y").to_euler()
    bpy.ops.mesh.primitive_plane_add(size=size, location=tuple(center), rotation=tuple(rot))
    ob = bpy.context.active_object
    ob.rotation_euler.rotate_axis("Z", spin)
    ob.data.materials.append(mat)
    return ob


def hydrangea_pot(name, palette, core_color, seed):
    """石の鉢に植えた紫陽花（鉢は0.62m 角・高さ0.45m、全体の高さ約1.0m）。
    花は手まり状の塊（芯の球の表面に小花の絵を貼った板を並べる）、葉は葉の絵の板を外向きに広げる"""
    rng = random.Random(seed)
    os.makedirs(os.path.join(OUT, "textures"), exist_ok=True)
    flower = leaf_card_mat(floret_texture(os.path.join(OUT, "textures", f"{name}_florets.png"), palette, seed=seed), f"{name}_florets")
    leaf = leaf_card_mat(hydrangea_leaf_texture(os.path.join(OUT, "textures", "hydrangea_leaves.png")), "hydrangea_leaves")
    stone = k.tex_mat("planter_stone", "painted_plaster_wall", tint=(0.8, 0.76, 0.7))
    soil = k.mat("soil", (0.12, 0.08, 0.05), 0.95)
    core = k.mat(f"{name}_core", core_color, 0.85)
    bush = k.mat("hydrangea_bush", (0.03, 0.08, 0.02), 0.95)
    # 鉢: 少しすぼまった石の箱に、張り出した縁と台座
    pot = k.box("pot", (0.6, 0.6, 0.4), (0, 0, 0.24), stone, bevel=0.02, tex_scale=0.8)
    from_mid = 0.0
    for v in pot.data.vertices:
        if v.co.z < from_mid:
            v.co.x *= 0.88
            v.co.y *= 0.88
    k.box("rim", (0.66, 0.66, 0.06), (0, 0, 0.44), stone, bevel=0.015, tex_scale=0.8)
    k.box("foot", (0.5, 0.5, 0.05), (0, 0, 0.025), stone, bevel=0.01, tex_scale=0.8)
    k.box("soil", (0.56, 0.56, 0.02), (0, 0, 0.465), soil, bevel=0.0)
    # 葉の茂み（濃い緑の芯＋外向きの葉の板）
    k.sphere("bush", 0.26, (0, 0, 0.6), bush, scale=(1.0, 1.0, 0.55), segs=12, rings=8)
    for i in range(28):
        a = i / 28 * math.tau * 2 + rng.uniform(-0.15, 0.15)
        r = rng.uniform(0.18, 0.32)
        c = Vector((math.cos(a) * r, math.sin(a) * r, rng.uniform(0.55, 0.75)))
        nrm = Vector((math.cos(a), math.sin(a), rng.uniform(0.6, 1.4)))
        _card(c, nrm, rng.uniform(0.26, 0.34), leaf, rng.uniform(0, math.tau))
    # 手まり状の花（6〜7個）
    heads = [(0, 0, 0.92, 0.16)]
    for i in range(6):
        a = i / 6 * math.tau + rng.uniform(-0.25, 0.25)
        heads.append((math.cos(a) * 0.22, math.sin(a) * 0.22, rng.uniform(0.76, 0.86), rng.uniform(0.12, 0.15)))
    golden = math.pi * (3.0 - math.sqrt(5.0))
    for hx, hy, hz, hr in heads:
        cen = Vector((hx, hy, hz))
        k.sphere("bloom_core", hr * 0.88, tuple(cen), core, segs=12, rings=8)
        n = 24
        for j in range(n):
            y = 1.0 - (j / (n - 1)) * 1.6       # 上から、下の少し手前まで
            rr = math.sqrt(max(0.0, 1.0 - y * y))
            a = j * golden
            d = Vector((math.cos(a) * rr, math.sin(a) * rr, y))
            _card(cen + d * hr * 0.97, d, hr * 0.95, flower, rng.uniform(0, math.tau))
    k.save(name, OUT, 1.1, preview=PREVIEW)


def hydrangea_blue():
    hydrangea_pot("hydrangea_blue", [(0.35, 0.48, 0.95), (0.45, 0.42, 0.92), (0.58, 0.45, 0.9), (0.4, 0.62, 0.95)], (0.12, 0.15, 0.4), 31)


def hydrangea_pink():
    hydrangea_pot("hydrangea_pink", [(0.95, 0.55, 0.75), (0.9, 0.45, 0.7), (0.85, 0.55, 0.9), (1.0, 0.7, 0.8)], (0.4, 0.15, 0.28), 47)


for fn in (zelkova_tree, tokyo_tower, hydrangea_blue, hydrangea_pink):
    if ONLY and fn.__name__ not in ONLY:
        continue
    k.reset()
    fn()
