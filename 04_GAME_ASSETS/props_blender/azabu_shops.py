"""麻布十番ステージの店の建物（高品質版）。azabu_props.py の shop_wagashi / shop_yaoya / shop_kissa を作り直し、3種類を足す。

前の版との違い:
- 窓: 奥に部屋の絵（カーテン・照明・家具の影）を入れて、中がある窓にする（夕方なので部屋がところどころ灯る）
- 壁: 雑居ビルの小口タイル・二丁掛けタイル・漆喰・レンガ。タイルの絵（色・法線・粗さ）もここで描く
- 1階: ガラス戸と、奥の店内の絵（商品棚・照明）。看板の台座（文字はゲーム側）
- 細部: 雨どい・縦樋、電気メーター、ベランダの室外機と物干し竿、パラペットの笠木、屋上の給水タンク・アンテナ
- 種類: 和菓子屋・八百屋・喫茶店に、そば屋・居酒屋・薬局を足して6種類

正面は -Y、上は +Z、外壁の正面が y = 0、奥行きは +Y 方向に 4m（ゲームの stage_street.gd の _shop_building と同じ約束）。
blender --background --python azabu_shops.py -- --out ../models3d/blender/azabu [--only shop_soba] [--no-preview]
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
import numpy as np  # noqa: E402

import propkit as k  # noqa: E402

OUT = k.out_dir()
PREVIEW = "--no-preview" not in sys.argv
ONLY = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else []
TEX_OUT = os.path.join(OUT, "textures")
DEPTH = 4.0


# ---------------------------------------------------------------- 絵（テクスチャ）を描く

def _save(img, path, jpeg=False):
    h, w = img.shape[:2]
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., :img.shape[2]] = img
    im = bpy.data.images.new(os.path.basename(path), w, h, alpha=not jpeg)
    im.pixels.foreach_set(rgba[::-1].ravel())
    im.filepath_raw = path
    im.file_format = "JPEG" if jpeg else "PNG"
    im.save()
    return im


def _normal_from_height(hgt, strength):
    gy, gx = np.gradient(hgt)
    n = np.stack([-gx * strength, gy * strength, np.ones_like(hgt)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n * 0.5 + 0.5


def tile_texture(name, tile_w, tile_h, base, var, grout, size=2048, cm_per_px=0.1, seed=1):
    """外壁タイル（色・法線・ARM）を 04_GAME_ASSETS/textures/<name>/ に描く。1枚 = size * cm_per_px cm 四方。
    tile_w / tile_h はタイル1枚の大きさ（cm）。base は平均の色、var は1枚ごとの色のばらつき"""
    d = os.path.join(k.TEX, name)
    if os.path.exists(os.path.join(d, f"{name}_diff_2k.jpg")) and "--retex" not in sys.argv:
        return name
    os.makedirs(d, exist_ok=True)
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) * cm_per_px
    row = np.floor(yy / tile_h)
    xs = xx + (row % 2) * tile_w * 0.5          # 半分ずらした目地（馬目地）
    col = np.floor(xs / tile_w)
    fx = (xs % tile_w) / tile_w
    fy = (yy % tile_h) / tile_h
    g = 0.35 / tile_w * 3.0                     # 目地の太さ（タイルに対する割合）
    gy_ = 0.35 / tile_h * 3.0
    edge = np.minimum(np.minimum(fx, 1 - fx) / g, np.minimum(fy, 1 - fy) / gy_)
    in_tile = np.clip(edge, 0, 1)
    nrows, ncols = int(row.max()) + 2, int(col.max()) + 2
    tint = rng.normal(0, var, (nrows, ncols, 3)).astype(np.float32)
    lum = rng.normal(0, var * 1.6, (nrows, ncols)).astype(np.float32)
    ri, ci = row.astype(int), col.astype(int)
    color = np.array(base, dtype=np.float32) * (1 + lum[ri, ci])[..., None] + tint[ri, ci]
    noise = rng.normal(0, 0.015, (size, size, 1)).astype(np.float32)
    color = color + noise
    # タイルの縁を少し暗く（焼きむら）、汚れの縦筋
    color *= (0.9 + 0.1 * np.clip(edge / 3, 0, 1))[..., None]
    streak = (np.sin(xx * 0.37 + rng.uniform(0, 6)) * np.sin(xx * 0.11) * 0.5 + 0.5) * np.clip(yy / (size * cm_per_px), 0, 1)
    color *= (1 - 0.02 * streak)[..., None]
    diff = np.where(in_tile[..., None] > 0.5, color, np.array(grout, dtype=np.float32))
    diff = np.clip(diff, 0, 1)
    height = in_tile * (0.6 + 0.4 * np.clip(edge / 2, 0, 1))
    nor = _normal_from_height(height, 2.5)
    arm = np.stack([0.75 + 0.25 * in_tile, np.where(in_tile > 0.5, 0.32, 0.9), np.zeros_like(in_tile)], axis=-1)
    _save(diff, os.path.join(d, f"{name}_diff_2k.jpg"), jpeg=True)
    _save(nor.astype(np.float32), os.path.join(d, f"{name}_nor_gl_2k.jpg"), jpeg=True)
    _save(arm.astype(np.float32), os.path.join(d, f"{name}_arm_2k.jpg"), jpeg=True)
    return name


def room_texture(path, seed, lit=True, size=256):
    """窓の奥に見える部屋の絵: 奥の壁・床・照明・家具の影・カーテン（左右）"""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / size
    wall = np.array(rng.choice([[0.85, 0.78, 0.66], [0.75, 0.8, 0.82], [0.9, 0.86, 0.78], [0.7, 0.62, 0.55]]), dtype=np.float32)
    img = np.ones((size, size, 3), dtype=np.float32) * wall
    # 奥行き: 天井と床を暗くする（遠近の台形）
    depth = np.clip(np.abs(yy - 0.45) * 2.2, 0, 1)
    img *= (1 - 0.45 * depth ** 2)[..., None]
    floor = yy > 0.78
    img[floor] = np.array([0.35, 0.25, 0.18]) * (0.8 + 0.4 * (yy[floor] - 0.78) * 4)[..., None]
    # 家具の影（棚・ソファ・テーブル）
    for _ in range(rng.integers(2, 4)):
        x0 = rng.uniform(0.05, 0.75)
        w = rng.uniform(0.12, 0.35)
        h = rng.uniform(0.15, 0.5)
        m = (xx > x0) & (xx < x0 + w) & (yy > 0.85 - h) & (yy < 0.85)
        img[m] *= rng.uniform(0.35, 0.6)
    if lit:
        cx = rng.uniform(0.3, 0.7)
        glow = np.exp(-(((xx - cx) * 2.2) ** 2 + ((yy - 0.15) * 3.0) ** 2))
        img = img * (0.75 + 0.6 * glow[..., None]) + np.array([1.0, 0.75, 0.4]) * glow[..., None] * 0.35
    else:
        img *= 0.35
    # カーテン（左右、ひだ）
    cur = np.array(rng.choice([[0.9, 0.88, 0.8], [0.75, 0.55, 0.4], [0.55, 0.65, 0.75], [0.85, 0.75, 0.55]]), dtype=np.float32)
    cw = rng.uniform(0.12, 0.3)
    for side in (0, 1):
        m = (xx < cw) if side == 0 else (xx > 1 - cw)
        fold = 0.8 + 0.2 * np.sin(xx * size * 0.35)
        img[m] = (cur * (fold[..., None] if True else 1))[m] * (1.0 if lit else 0.45)
    # レースのカーテンをうっすら
    img = img * 0.85 + 0.15 * np.array([0.95, 0.95, 0.93]) * (0.6 if lit else 0.3)
    return _save(np.clip(img, 0, 1), path)


def store_texture(path, kind, seed, size=512):
    """1階の店内の絵: 奥の棚に並ぶ商品（色の帯）と天井の照明"""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / size
    base = {"wagashi": [0.85, 0.75, 0.6], "kissa": [0.55, 0.38, 0.25], "soba": [0.8, 0.7, 0.52],
            "izakaya": [0.6, 0.4, 0.25], "kusuri": [0.92, 0.94, 0.95], "yaoya": [0.7, 0.6, 0.45]}[kind]
    img = np.ones((size, size, 3), dtype=np.float32) * np.array(base, dtype=np.float32)
    img *= (1 - 0.35 * np.clip((yy - 0.75) * 4, 0, 1))[..., None]
    goods = {"wagashi": [[0.95, 0.75, 0.8], [0.7, 0.85, 0.55], [0.97, 0.95, 0.9], [0.6, 0.35, 0.3]],
             "kissa": [[0.3, 0.18, 0.1], [0.9, 0.85, 0.75], [0.8, 0.55, 0.2]],
             "soba": [[0.25, 0.18, 0.12], [0.9, 0.88, 0.8], [0.55, 0.3, 0.15]],
             "izakaya": [[0.15, 0.25, 0.15], [0.8, 0.55, 0.15], [0.9, 0.85, 0.8], [0.6, 0.1, 0.08]],
             "kusuri": [[0.2, 0.5, 0.85], [0.9, 0.3, 0.3], [0.95, 0.85, 0.2], [0.3, 0.75, 0.45], [0.95, 0.95, 0.95]],
             "yaoya": [[0.2, 0.55, 0.15], [0.9, 0.45, 0.05], [0.8, 0.1, 0.05]]}[kind]
    if kind in ("kissa", "soba", "izakaya"):
        # 客席: カウンターと椅子の影、壁の品書きの板（白い札）
        img[(yy > 0.6) & (yy < 0.66)] *= 0.45
        for i in range(8):
            x0 = 0.06 + i * 0.115
            m = (xx > x0) & (xx < x0 + 0.06) & (yy > 0.12) & (yy < 0.3)
            img[m] = [0.95, 0.92, 0.85]
        for i in range(5):
            x0 = 0.1 + i * 0.18
            m = ((xx - x0) ** 2 * 6 + (yy - 0.72) ** 2 * 20) < 0.004
            img[m] *= 0.35
    else:
        for r in range(4):
            y0 = 0.15 + r * 0.17
            img[(yy > y0 + 0.13) & (yy < y0 + 0.145)] = [0.85, 0.85, 0.86]
            x = 0.03
            while x < 0.97:
                w = rng.uniform(0.02, 0.06)
                h = rng.uniform(0.06, 0.12)
                c = np.array(goods[rng.integers(len(goods))], dtype=np.float32) * rng.uniform(0.8, 1.1)
                m = (xx > x) & (xx < x + w) & (yy > y0 + 0.13 - h) & (yy < y0 + 0.13)
                img[m] = c
                x += w + 0.006
    glow = np.exp(-(((yy - 0.03) * 5) ** 2)) * (0.6 + 0.4 * np.cos(xx * 25) ** 2)
    img = img * (0.8 + 0.4 * glow[..., None])
    return _save(np.clip(img, 0, 1), path)


def emit_tex_mat(name, im, strength=1.0, rough=0.2):
    """絵を貼り、少し光らせる（夕方の灯った部屋・店内）"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = im
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    nt.links.new(t.outputs["Color"], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = strength
    p.inputs["Roughness"].default_value = rough
    return m


def card(name, size, loc, mat):
    """正面（-Y）を向いた板に、絵を1枚まるごと貼る"""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=(math.pi / 2, 0, 0))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0], size[1], 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    return ob



# ---------------------------------------------------------------- 店ごとのテーマ色とネオン

# main = 日よけ・暖簾などの主役の色、sub = 日よけの縞・差し色、frame = サッシ・框・看板の枠、
# plate = 看板の台座（ネオンが映えるよう暗め）、neon = ネオン管の色、icon = ネオンで描く絵
THEMES = {
    "wagashi": dict(main=(0.33, 0.12, 0.42), sub=(0.93, 0.88, 0.76), frame=(0.16, 0.09, 0.05), plate=(0.1, 0.05, 0.12),
                    neon=(1.0, 0.35, 0.75), icon="fish"),
    "yaoya": dict(main=(0.08, 0.32, 0.16), sub=(0.9, 0.92, 0.84), frame=(0.1, 0.16, 0.1), plate=(0.04, 0.09, 0.05),
                  neon=(0.55, 1.0, 0.25), icon="carrot"),
    "kissa": dict(main=(0.85, 0.62, 0.08), sub=(0.96, 0.94, 0.88), frame=(0.22, 0.12, 0.06), plate=(0.12, 0.07, 0.04),
                  neon=(1.0, 0.7, 0.25), icon="cup"),
    "soba": dict(main=(0.04, 0.07, 0.2), sub=(0.92, 0.9, 0.84), frame=(0.14, 0.08, 0.045), plate=(0.03, 0.04, 0.08),
                 neon=(0.35, 0.85, 1.0), icon="bowl"),
    "izakaya": dict(main=(0.6, 0.05, 0.03), sub=(0.08, 0.06, 0.05), frame=(0.08, 0.06, 0.05), plate=(0.08, 0.02, 0.02),
                    neon=(1.0, 0.22, 0.15), icon="mug"),
    "kusuri": dict(main=(0.04, 0.22, 0.6), sub=(0.95, 0.96, 0.97), frame=(0.55, 0.57, 0.6), plate=(0.03, 0.06, 0.12),
                   neon=(0.25, 1.0, 0.55), icon="cross"),
}

# ネオンの絵（線の集まり）。座標は -1〜1（横 x・縦 z）で、看板の高さに合わせて縮める
def _arc(cx, cz, r, a0, a1, n=12, sx=1.0):
    return [(cx + math.cos(a0 + (a1 - a0) * i / n) * r * sx, cz + math.sin(a0 + (a1 - a0) * i / n) * r) for i in range(n + 1)]


ICONS = {
    # たい焼き: 魚の胴（楕円）としっぽ、目
    "fish": [_arc(-0.15, 0.0, 0.62, 0.0, math.tau, 24, sx=1.45),
             [(0.75, 0.0), (1.35, 0.55), (1.35, -0.55), (0.75, 0.0)],
             _arc(-0.8, 0.15, 0.09, 0.0, math.tau, 8)],
    # にんじんと葉
    "carrot": [[(-0.45, 0.45), (0.45, 0.45), (0.0, -0.95), (-0.45, 0.45)],
               [(0.0, 0.45), (-0.35, 0.95)], [(0.0, 0.45), (0.0, 1.0)], [(0.0, 0.45), (0.35, 0.95)]],
    # 湯気の立つコーヒーカップ
    "cup": [[(-0.75, 0.3), (-0.6, -0.65), (0.45, -0.65), (0.6, 0.3), (-0.75, 0.3)],
            _arc(0.68, -0.15, 0.28, -math.pi / 2, math.pi / 2, 10),
            [(-0.95, -0.85), (0.8, -0.85)],
            [(-0.3, 0.5), (-0.4, 0.7), (-0.25, 0.85), (-0.35, 1.0)], [(0.15, 0.5), (0.05, 0.7), (0.2, 0.85), (0.1, 1.0)]],
    # 湯気の立つどんぶりと箸
    "bowl": [_arc(0.0, 0.1, 0.85, math.pi, math.tau, 16), [(-0.85, 0.1), (0.85, 0.1)],
             [(-0.3, -0.75), (0.3, -0.75)],
             [(0.3, 0.3), (1.1, 1.0)], [(0.5, 0.25), (1.25, 0.85)],
             [(-0.35, 0.35), (-0.45, 0.6), (-0.3, 0.8)], [(0.0, 0.35), (-0.1, 0.6), (0.05, 0.8)]],
    # 泡のあふれるジョッキ
    "mug": [[(-0.55, 0.6), (-0.55, -0.85), (0.4, -0.85), (0.4, 0.6)],
            _arc(0.4, -0.1, 0.32, -math.pi / 2, math.pi / 2, 10, sx=1.2),
            _arc(-0.35, 0.65, 0.22, 0.0, math.pi, 8) + _arc(0.05, 0.72, 0.24, 0.0, math.pi, 8) + _arc(0.3, 0.62, 0.15, 0.0, math.pi, 6)],
    # 薬局の十字
    "cross": [[(-0.3, 0.95), (0.3, 0.95), (0.3, 0.3), (0.95, 0.3), (0.95, -0.3), (0.3, -0.3), (0.3, -0.95),
               (-0.3, -0.95), (-0.3, -0.3), (-0.95, -0.3), (-0.95, 0.3), (-0.3, 0.3), (-0.3, 0.95)]],
}


def neon_line(pts, y, mat, r=0.014):
    """ネオン管: 点を結ぶ細い管（つなぎ目に球を入れて、折れ目を丸くする）"""
    from mathutils import Vector
    for a, b in zip(pts, pts[1:]):
        pa, pb = Vector((a[0], y, a[1])), Vector((b[0], y, b[1]))
        d = pb - pa
        if d.length < 1e-4:
            continue
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_euler()
        k.cyl("neon", r, d.length, tuple((pa + pb) / 2), mat, verts=6, rot=tuple(rot))
    for p in pts:
        k.sphere("neon_joint", r, (p[0], y, p[1]), mat, segs=6, rings=4)


# ---------------------------------------------------------------- 部品

class Kit:
    """材質と、部屋の絵（数枚を使い回す）"""

    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.frame = k.mat("sash_alu", (0.55, 0.56, 0.58), 0.35, 0.9)
        self.frame_dark = k.mat("sash_dark", (0.12, 0.12, 0.13), 0.45, 0.6)
        self.glass = k.mat("window_glass_hq", (0.05, 0.07, 0.09), 0.04, 0.6, alpha=0.35)
        self.iron = k.mat("iron_rail", (0.08, 0.08, 0.09), 0.5, 0.8)
        self.concrete = k.tex_mat("concrete_trim", "painted_plaster_wall", tint=(0.8, 0.79, 0.76))
        self.wood = k.tex_mat("wood", "wood_floor", tint=(0.55, 0.36, 0.24))
        self.wood_dark = k.mat("wood_dark", (0.14, 0.08, 0.045), 0.6)
        self.ac = k.mat("ac_unit", (0.86, 0.86, 0.84), 0.5)
        self.pipe = k.mat("pipe_grey", (0.55, 0.55, 0.53), 0.5, 0.2)
        self.meter = k.mat("meter_grey", (0.7, 0.72, 0.72), 0.4, 0.3)
        self.holes = []   # 外壁にあける穴（x, z, 幅, 高さ, 深さ）。save の前に finish() でくり抜く
        os.makedirs(TEX_OUT, exist_ok=True)
        self.rooms = []
        for i in range(6):
            p = os.path.join(TEX_OUT, f"room_{i}.png")
            im = room_texture(p, 100 + i, lit=i < 4)
            self.rooms.append(emit_tex_mat(f"room_{i}", im, 0.9 if i < 4 else 0.15, 0.6))

    def window(self, x, z, w, h, sash=2, rail=False, lit=None):
        """アルミサッシの窓: 枠・引き違いの框・ガラス・奥の部屋の絵（窓から 0.35m 奥）"""
        room = self.rooms[self.rng.randrange(len(self.rooms))] if lit is None else self.rooms[0 if lit else 4]
        self.holes.append((x, z, w + 0.04, h + 0.04, 0.45))
        card("win_room", (w, h), (x, 0.4, z), room)
        k.box("win_glass", (w, 0.01, h), (x, 0.06, z), self.glass, bevel=0.0)
        k.box("win_frame_t", (w + 0.08, 0.06, 0.05), (x, 0.03, z + h / 2), self.frame, bevel=0.005)
        k.box("win_frame_b", (w + 0.08, 0.06, 0.05), (x, 0.03, z - h / 2), self.frame, bevel=0.005)
        for sx in (-1, 1):
            k.box("win_frame_s", (0.05, 0.06, h), (x + sx * w / 2, 0.03, z), self.frame, bevel=0.005)
        for i in range(1, sash):
            k.box("win_mullion", (0.04, 0.07, h), (x - w / 2 + i * w / sash, 0.02, z), self.frame, bevel=0.0)
        k.box("win_sill", (w + 0.16, 0.14, 0.04), (x, -0.04, z - h / 2 - 0.04), self.frame, bevel=0.006)
        if rail:
            # 窓の手すり（面格子）
            k.box("win_rail_t", (w, 0.03, 0.03), (x, -0.12, z - h / 2 + 0.75), self.iron, bevel=0.0)
            for i in range(int(w / 0.12) + 1):
                k.box("win_rail_v", (0.015, 0.015, 0.7), (x - w / 2 + i * w / int(w / 0.12), -0.12, z - h / 2 + 0.4), self.iron, bevel=0.0)

    def balcony(self, x, z, w, depth=0.9, ac=True, pole=True):
        """ベランダ: 床スラブ・鉄の手すり・室外機・物干し竿"""
        k.box("bal_slab", (w, depth, 0.14), (x, -depth / 2, z), self.concrete, bevel=0.01, tex_scale=2.0)
        k.box("bal_top", (w, 0.05, 0.05), (x, -depth + 0.03, z + 1.0), self.iron, bevel=0.006)
        k.box("bal_mid", (w, 0.03, 0.03), (x, -depth + 0.03, z + 0.15), self.iron, bevel=0.0)
        n = int(w / 0.11)
        for i in range(n + 1):
            k.box("bal_bar", (0.018, 0.018, 0.85), (x - w / 2 + i * w / n, -depth + 0.03, z + 0.57), self.iron, bevel=0.0)
        for sx in (-1, 1):
            k.box("bal_side", (0.03, depth, 0.05), (x + sx * w / 2, -depth / 2, z + 1.0), self.iron, bevel=0.0)
        if ac:
            ax = x + self.rng.uniform(-w / 2 + 0.6, w / 2 - 0.6)
            k.box("bal_ac", (0.8, 0.3, 0.6), (ax, -depth + 0.3, z + 0.38), self.ac, bevel=0.025)
            k.cyl("bal_ac_fan", 0.2, 0.02, (ax - 0.12, -depth + 0.14, z + 0.38), self.iron, rot=(math.pi / 2, 0, 0), verts=20)
        if pole:
            k.cyl("bal_pole", 0.015, w - 0.2, (x, -depth + 0.25, z + 1.7), self.frame, verts=8, rot=(0, math.pi / 2, 0))
            for sx in (-1, 1):
                k.box("bal_pole_arm", (0.02, 0.3, 0.02), (x + sx * (w / 2 - 0.15), -depth + 0.35, z + 1.7), self.frame, bevel=0.0)

    def shell(self, W, floors, wall_mat, floor_h=3.0, roof_ac=1, tank=False, antenna=True, band_mat=None):
        """建物の箱: 外壁（タイル等）・階の帯・笠木付きのパラペット・屋上の設備・縦樋・電気メーター"""
        H = floors * floor_h
        self.wall = k.box("wall", (W, DEPTH, H - 0.05), (0, DEPTH / 2, H / 2 + 0.025), wall_mat, bevel=0.0, tex_scale=1.6)
        band = band_mat or self.concrete
        for f in range(1, floors):
            k.box("floor_band", (W + 0.04, 0.1, 0.18), (0, -0.04, f * floor_h - 0.05), band, bevel=0.008, tex_scale=2.0)
        k.box("parapet", (W + 0.06, 0.25, 0.5), (0, 0.08, H + 0.2), band, bevel=0.01, tex_scale=2.0)
        k.box("coping", (W + 0.12, 0.32, 0.05), (0, 0.08, H + 0.47), self.frame, bevel=0.005)
        # 隣の建物との境の柱（壁の端を少し出す）
        for sx in (-1, 1):
            k.box("end_pier", (0.18, 0.12, H), (sx * (W / 2 - 0.09), -0.03, H / 2), band, bevel=0.01, tex_scale=2.0)
        for i in range(roof_ac):
            ax = -W / 2 + 1.0 + i * 1.2
            k.box("roof_ac", (0.85, 0.35, 0.6), (ax, 1.6, H + 0.32), self.ac, bevel=0.03)
        if tank:
            k.cyl("roof_tank", 0.55, 1.1, (W / 2 - 1.2, 2.2, H + 1.45), self.ac, bevel=0.03, verts=24)
            for a in range(4):
                k.box("tank_leg", (0.06, 0.06, 0.9), (W / 2 - 1.2 + 0.4 * math.cos(a * math.pi / 2 + 0.8), 2.2 + 0.4 * math.sin(a * math.pi / 2 + 0.8), H + 0.45), self.iron, bevel=0.0)
        if antenna:
            ax = -W / 2 + 1.5
            k.cyl("antenna_pole", 0.02, 1.6, (ax, 2.5, H + 0.8), self.frame, verts=6)
            for i in range(5):
                k.cyl("antenna_el", 0.008, 0.5 - i * 0.06, (ax, 2.5 + 0.12 * i - 0.24, H + 1.5), self.frame, verts=4, rot=(0, math.pi / 2, 0))
        # 縦樋（建物の右端）と、1階の電気メーター・ガスメーター
        k.cyl("downpipe", 0.045, H + 0.3, (W / 2 - 0.3, -0.07, H / 2), self.pipe, verts=10)
        for f in range(1, floors + 1):
            k.box("pipe_bracket", (0.1, 0.1, 0.03), (W / 2 - 0.3, -0.04, f * floor_h - 0.5), self.iron, bevel=0.0)
        k.box("meter_box", (0.32, 0.12, 0.42), (W / 2 - 0.7, -0.06, 1.7), self.meter, bevel=0.01)
        k.cyl("meter_dial", 0.07, 0.02, (W / 2 - 0.7, -0.13, 1.75), k.mat("meter_glass", (0.8, 0.85, 0.85), 0.1), rot=(math.pi / 2, 0, 0), verts=16)
        return H

    def finish(self):
        """窓・店先の穴を外壁にくり抜き、タイルの貼り方（UV）を付け直す"""
        wall = self.wall
        for x, z, w, h, d in self.holes:
            cut = k.box("hole", (w, d * 2, h), (x, 0.0, z), None, bevel=0.0)
            md = wall.modifiers.new("hole", "BOOLEAN")
            md.object = cut
            md.operation = "DIFFERENCE"
            md.solver = "EXACT"
            bpy.ops.object.select_all(action="DESELECT")
            bpy.context.view_layer.objects.active = wall
            bpy.ops.object.modifier_apply(modifier=md.name)
            bpy.data.objects.remove(cut)
        k.box_uv(wall, 1.6)

    def storefront(self, W, kind, door_x=0.0, door_w=1.6, glass_w=None, frame=None, seed=1):
        """1階の店先: 奥の店内の絵・ガラスの引き戸・框・敷居・ネオンの看板（色は THEMES[kind]）"""
        th = THEMES[kind]
        frame = k.mat(f"frame_{kind}", th["frame"], 0.4, 0.5)
        gw = glass_w or (W - 0.8)
        im = store_texture(os.path.join(TEX_OUT, f"store_{kind}.png"), kind, seed)
        self.holes.append((0.0, 1.22, gw + 0.04, 2.34, 0.7))
        card("store_inside", (gw, 2.3), (0, 0.62, 1.22), emit_tex_mat(f"store_{kind}", im, 1.3, 0.5))
        k.box("store_glass", (gw, 0.01, 2.3), (0, 0.05, 1.22), self.glass, bevel=0.0)
        n = max(2, int(gw / 1.0))
        for i in range(n + 1):
            k.box("store_stile", (0.06, 0.07, 2.3), (-gw / 2 + i * gw / n, 0.03, 1.22), frame, bevel=0.005)
        for z in (0.07, 2.37):
            k.box("store_rail", (gw + 0.06, 0.08, 0.07), (0, 0.03, z), frame, bevel=0.005)
        k.box("store_cross", (gw, 0.05, 0.04), (0, 0.02, 0.95), frame, bevel=0.0)
        k.box("threshold", (gw + 0.3, 0.3, 0.06), (0, -0.12, 0.03), self.concrete, bevel=0.005)
        k.box("shutter_box", (W - 0.2, 0.3, 0.35), (0, -0.12, 2.72), self.frame, bevel=0.01)
        # 看板: 暗い台座に、テーマ色のネオン管で縁取りと絵（文字はなし）
        k.box("sign_plate", (W - 0.6, 0.08, 0.55), (0, -0.32, 3.3), k.mat(f"plate_{kind}", th["plate"], 0.5), bevel=0.02)
        k.box("sign_frame", (W - 0.5, 0.06, 0.62), (0, -0.28, 3.3), frame, bevel=0.01)
        neon = k.mat(f"neon_{kind}", th["neon"], 0.2, emit=th["neon"], emit_strength=9.0)
        hw, hz, y = (W - 0.6) / 2 - 0.08, 0.2, -0.375
        neon_line([(-hw, 3.3 - hz), (hw, 3.3 - hz), (hw, 3.3 + hz), (-hw, 3.3 + hz), (-hw, 3.3 - hz)], y, neon, 0.011)
        for cx in ((-hw * 0.55, hw * 0.55) if W >= 6.4 else (0.0,)):
            for line in ICONS[th["icon"]]:
                neon_line([(cx + px * 0.2, 3.3 + pz * 0.165) for px, pz in line], y, neon, 0.016)
        # 縁取りの内側に、点線の小さな灯り（両端）
        for sx in (-1, 1):
            for i in range(3):
                k.sphere("neon_dot", 0.018, (sx * (hw - 0.12 - i * 0.12), y, 3.3), neon, segs=6, rings=4)
        # 明かり: 看板を下から照らす間接照明の帯と、シャッターボックスの下のダウンライト（夕方なので灯っている）
        glow = k.mat("led_warm", (1.0, 0.88, 0.65), 0.3, emit=(1.0, 0.78, 0.45), emit_strength=6.0)
        k.box("sign_light_bar", (W - 0.8, 0.06, 0.03), (0, -0.42, 3.0), glow, bevel=0.0)
        k.box("sign_light_arm", (W - 0.8, 0.12, 0.02), (0, -0.37, 3.0), self.frame, bevel=0.0)
        n = max(2, int((W - 1.0) / 1.2))
        for i in range(n):
            x = -(W - 1.4) / 2 + i * (W - 1.4) / (n - 1)
            k.cyl("downlight", 0.07, 0.015, (x, -0.12, 2.54), glow, verts=14)
            k.cyl("downlight_rim", 0.085, 0.01, (x, -0.12, 2.545), self.frame, verts=14)

    def themed_awning(self, W, kind, stripe=True, **kw):
        th = THEMES[kind]
        self.awning(W, th["main"], stripe=th["sub"] if stripe else None, **kw)

    def awning(self, W, color, stripe=None, z=2.95, y=-0.3, depth=1.1, scallop=True):
        cloth = k.mat(f"awning_{color}", color, 0.85)
        ang = math.radians(26)
        cy, cz = y - depth / 2 * math.cos(ang), z - depth / 2 * math.sin(ang)
        k.box("awn", (W, depth, 0.025), (0, cy, cz), cloth, bevel=0.005, rot=(ang, 0, 0))
        if stripe:
            sm = k.mat(f"awning_stripe_{stripe}", stripe, 0.85)
            n = int(W / 0.45)
            for i in range(0, n, 2):
                sx = -W / 2 + (i + 0.5) * W / n
                k.box("awn_stripe", (W / n, depth, 0.027), (sx, cy, cz + 0.002), sm, bevel=0.0, rot=(ang, 0, 0))
        ey, ez = y - depth * math.cos(ang), z - depth * math.sin(ang)
        if scallop:
            k.scallop_cloth("awn_valance", W, 0.22, (0, ey, ez), cloth, n=max(4, int(W / 0.42)))
        for sx in (-W / 2 + 0.03, W / 2 - 0.03):
            k.box("awn_arm", (0.025, depth, 0.025), (sx, cy, cz - 0.03), self.iron, bevel=0.0, rot=(ang, 0, 0))


def fit(fn):
    """建物の関数を登録する（--only の対象）"""
    REGISTRY.append(fn)
    return fn


REGISTRY = []


# ---------------------------------------------------------------- 建物

@fit
def shop_wagashi():
    """和菓子屋（3階建て・幅6m）: クリーム色の小口タイル、紫の日よけと暖簾、木の格子"""
    kit = Kit(11)
    tile = tile_texture("facade_tile_cream", 10.8, 6.0, (0.86, 0.78, 0.62), 0.025, (0.72, 0.7, 0.66), seed=3)
    W = 6.0
    H = kit.shell(W, 3, k.tex_mat("wall_tile_cream", tile), roof_ac=1)
    kit.storefront(W, "wagashi", seed=5)
    # 木の格子（左側の窓の外）
    for i in range(12):
        k.box("koushi", (0.04, 0.05, 2.0), (-2.6 + i * 0.1, -0.1, 1.2), kit.wood, bevel=0.003, tex_scale=1.0)
    purple = THEMES["wagashi"]["main"]
    kit.themed_awning(W - 0.3, "wagashi", stripe=False)
    noren = k.mat("noren_purple", purple, 0.9)
    k.cyl("noren_rod", 0.015, 1.9, (0.8, -0.18, 2.4), kit.wood_dark, rot=(0, math.pi / 2, 0))
    for i in range(3):
        k.box("noren", (0.6, 0.012, 0.65), (0.2 + i * 0.62, -0.18, 2.05), noren, bevel=0.002)
    # ショーケース（ガラス）と和菓子
    k.box("case", (2.0, 0.55, 0.85), (1.6, -0.45, 0.43), kit.wood_dark, bevel=0.02)
    k.box("case_glass", (1.95, 0.5, 0.36), (1.6, -0.45, 1.05), kit.glass, bevel=0.01)
    sweets = [k.mat(f"mochi_{i}", c, 0.55) for i, c in enumerate([(0.95, 0.75, 0.8), (0.72, 0.86, 0.6), (0.97, 0.95, 0.9), (0.55, 0.32, 0.25)])]
    for row in range(2):
        for i in range(7):
            k.sphere("mochi", 0.065, (0.85 + i * 0.25, -0.52 + row * 0.16, 0.93), sweets[(i + row) % 4], scale=(1, 1, 0.7), segs=10, rings=6)
    for f in (1, 2):
        z = f * 3.0 + 1.5
        kit.window(-1.45, z, 1.7, 1.25)
        kit.window(1.45, z, 1.7, 1.25)
    kit.balcony(0, 6.05, W - 1.0)   # 3階のベランダ（2階に付けると1階の看板が隠れる）
    kit.finish()
    k.save("shop_wagashi", OUT, H + 1.2, preview=PREVIEW)


@fit
def shop_yaoya():
    """八百屋（2階建て・幅6m）: レンガ、緑白の日よけ、段々の陳列台"""
    kit = Kit(12)
    W = 6.0
    H = kit.shell(W, 2, k.tex_mat("brick", "red_brick", tint=(0.95, 0.85, 0.8)), roof_ac=1)
    kit.storefront(W, "yaoya", seed=6, glass_w=W - 0.6)
    kit.themed_awning(W - 0.2, "yaoya")
    veg = [(0.13, 0.42, 0.12), (0.95, 0.5, 0.05), (0.85, 0.1, 0.06), (0.55, 0.8, 0.3), (0.2, 0.6, 0.15), (0.6, 0.15, 0.4)]
    vm = [k.mat(f"veg_{i}", c, 0.5) for i, c in enumerate(veg)]
    rng = random.Random(4)
    for tier in range(3):
        y = -0.4 - tier * 0.42
        top = 0.95 - tier * 0.3
        k.box("stand", (W - 1.0, 0.46, 0.06), (0, y, top), kit.wood, bevel=0.008, tex_scale=1.0)
        for sx in (-1, 1):
            k.box("stand_leg", (0.05, 0.05, top), (sx * (W / 2 - 0.55), y, top / 2), kit.wood_dark, bevel=0.0)
        for i in range(6):
            cx = -2.15 + i * 0.86
            k.box("crate", (0.78, 0.4, 0.18), (cx, y, top + 0.12), kit.wood, bevel=0.006, tex_scale=1.0)
            k.box("price_tag", (0.16, 0.01, 0.1), (cx + 0.2, y - 0.21, top + 0.2), k.mat("price", (0.98, 0.95, 0.4), 0.6), bevel=0.0)
            mt = vm[(i + tier * 2) % len(vm)]
            big = (i + tier) % 4 == 0
            r = 0.12 if big else 0.06
            cnt = 3 if big else 10
            for j in range(cnt):
                ox = (-0.24 + j * 0.24) if big else (-0.28 + (j % 5) * 0.14)
                oy = 0 if big else (-0.07 + (j // 5) * 0.14)
                k.sphere("veg", r * rng.uniform(0.9, 1.1), (cx + ox, y + oy, top + 0.22 + r * 0.6), mt, segs=10, rings=7)
    for x in (-1.45, 1.45):
        kit.window(x, 4.5, 1.8, 1.3, rail=True)
    k.box("ac_wall", (0.8, 0.3, 0.55), (2.3, -0.2, 3.65), kit.ac, bevel=0.03)
    kit.finish()
    k.save("shop_yaoya", OUT, H + 1.2, preview=PREVIEW)


@fit
def shop_kissa():
    """喫茶店（4階建て・幅7m）: 茶色の二丁掛けタイル、黄色白の日よけ、木の扉と出窓、上はマンション"""
    kit = Kit(13)
    tile = tile_texture("facade_tile_brown", 22.7, 6.0, (0.42, 0.28, 0.2), 0.03, (0.6, 0.57, 0.52), seed=7)
    W = 7.0
    H = kit.shell(W, 4, k.tex_mat("wall_tile_brown", tile), roof_ac=2, tank=True)
    kit.storefront(W, "kissa", seed=7)
    k.box("door", (0.95, 0.08, 2.15), (0, -0.04, 1.1), kit.wood, bevel=0.015, tex_scale=1.0)
    k.box("door_window", (0.5, 0.02, 0.7), (0, -0.09, 1.5), kit.rooms[0], bevel=0.0)
    k.cyl("door_knob", 0.03, 0.06, (0.35, -0.12, 1.05), kit.frame, rot=(math.pi / 2, 0, 0))
    kit.themed_awning(W - 0.3, "kissa")
    k.box("chalkboard", (0.6, 0.05, 0.85), (2.9, -1.2, 0.48), k.mat("chalk", (0.1, 0.13, 0.11), 0.9), bevel=0.02, rot=(math.radians(-10), 0, 0))
    lamp = k.mat("kissa_lamp", (1.0, 0.85, 0.6), 0.3, emit=(1.0, 0.8, 0.5), emit_strength=4.0)
    for x in (-W / 2 + 0.35, W / 2 - 0.35):
        k.cyl("bracket_lamp", 0.1, 0.25, (x, -0.25, 2.55), lamp, verts=12)
        k.box("bracket_arm", (0.03, 0.25, 0.03), (x, -0.12, 2.7), kit.iron, bevel=0.0)
    for f in (1, 2, 3):
        z = f * 3.0 + 1.45
        for x in (-2.25, 0.0, 2.25):
            kit.window(x, z, 1.55, 1.3)
        if f >= 2:   # 2階にベランダを付けると1階の看板が隠れる
            kit.balcony(0, f * 3.0 + 0.1, W - 0.5)
    kit.finish()
    k.save("shop_kissa", OUT, H + 2.0, preview=PREVIEW)


@fit
def shop_soba():
    """そば屋（2階建て・幅6.5m）: 漆喰と焼き杉の腰壁、瓦の小庇、紺の暖簾、木の格子戸、2階は障子の窓"""
    kit = Kit(14)
    W = 6.5
    plaster = k.tex_mat("plaster_white", "painted_plaster_wall", tint=(0.95, 0.93, 0.88))
    H = kit.shell(W, 2, plaster, roof_ac=1, antenna=False, band_mat=kit.wood_dark)
    charred = k.mat("yakisugi", (0.06, 0.05, 0.045), 0.85)
    for i in range(int(W / 0.18)):
        k.box("koshi_board", (0.17, 0.05, 1.0), (-W / 2 + 0.09 + i * 0.18, -0.03, 0.5), charred, bevel=0.004)
    kit.storefront(W, "soba", seed=8, glass_w=2.6, frame=kit.wood_dark)
    # 木の格子戸
    for i in range(18):
        k.box("koushi", (0.035, 0.05, 2.25), (-1.28 + i * 0.15, -0.06, 1.22), kit.wood, bevel=0.003, tex_scale=1.0)
    # 瓦の小庇（1階の上）
    tile = k.mat("kawara", (0.18, 0.19, 0.21), 0.45, 0.3)
    ang = math.radians(22)
    k.box("hisashi", (W + 0.2, 0.9, 0.06), (0, -0.4, 2.75), tile, bevel=0.01, rot=(ang, 0, 0))
    for i in range(int(W / 0.25) + 1):
        k.cyl("kawara_roll", 0.04, 0.95, (-W / 2 - 0.05 + i * 0.25, -0.4, 2.8), tile, verts=8, rot=(math.pi / 2 - ang, 0, 0))
    k.box("hisashi_edge", (W + 0.25, 0.08, 0.1), (0, -0.82, 2.58), tile, bevel=0.01)
    # 紺の暖簾（3枚）と、提灯（2つ）
    navy = k.mat("noren_navy", THEMES["soba"]["main"], 0.9)
    k.cyl("noren_rod", 0.015, 1.6, (0, -0.2, 2.35), kit.wood_dark, rot=(0, math.pi / 2, 0))
    for i in range(3):
        k.box("noren", (0.5, 0.012, 0.9), (-0.52 + i * 0.52, -0.2, 1.88), navy, bevel=0.002)
    lan = k.mat("chochin", (0.95, 0.9, 0.78), 0.7, emit=(1.0, 0.85, 0.55), emit_strength=2.0)
    for x in (-2.4, 2.4):
        k.sphere("chochin", 0.2, (x, -0.35, 2.0), lan, scale=(1, 1, 1.35), segs=16, rings=10)
        k.cyl("chochin_cap", 0.1, 0.06, (x, -0.35, 2.3), kit.wood_dark, verts=12)
    # 2階: 障子（明るい）の窓と、木の手すり
    for x in (-1.6, 1.6):
        kit.holes.append((x, 4.5, 1.94, 1.24, 0.3))
        card("shoji", (1.9, 1.2), (x, 0.08, 4.5), k.mat("shoji_paper", (0.95, 0.92, 0.82), 0.8, emit=(1.0, 0.85, 0.6), emit_strength=0.6))
        for i in range(1, 6):
            k.box("shoji_v", (0.02, 0.02, 1.2), (x - 0.95 + i * 0.317, 0.04, 4.5), kit.wood_dark, bevel=0.0)
        for j in range(1, 4):
            k.box("shoji_h", (1.9, 0.02, 0.02), (x, 0.04, 3.9 + j * 0.3), kit.wood_dark, bevel=0.0)
        k.box("rail_wood", (2.1, 0.08, 0.06), (x, -0.25, 4.0), kit.wood, bevel=0.005, tex_scale=1.0)
        for i in range(8):
            k.box("rail_post", (0.04, 0.04, 0.4), (x - 1.0 + i * 0.285, -0.25, 3.8), kit.wood, bevel=0.0, tex_scale=1.0)
    kit.finish()
    k.save("shop_soba", OUT, H + 1.2, preview=PREVIEW)


@fit
def shop_izakaya():
    """居酒屋（3階建て・幅6m）: 黒い板張りの1階、赤提灯の列、縄のれん、上は灰色の二丁掛けタイル"""
    kit = Kit(15)
    tile = tile_texture("facade_tile_grey", 22.7, 6.0, (0.62, 0.62, 0.6), 0.025, (0.5, 0.5, 0.48), seed=9)
    W = 6.0
    H = kit.shell(W, 3, k.tex_mat("wall_tile_grey", tile), roof_ac=1)
    black = k.mat("izakaya_board", (0.05, 0.045, 0.04), 0.7)
    for i in range(int(W / 0.2)):
        k.box("board", (0.19, 0.05, 2.75), (-W / 2 + 0.1 + i * 0.2, -0.03, 1.37), black, bevel=0.004)
    kit.storefront(W, "izakaya", seed=9, glass_w=2.4, frame=kit.wood_dark)
    # 縄のれん
    rope = k.mat("nawa", (0.6, 0.48, 0.3), 0.9)
    k.cyl("nawa_rod", 0.02, 2.5, (0, -0.12, 2.35), kit.wood_dark, rot=(0, math.pi / 2, 0))
    for i in range(24):
        k.cyl("nawa", 0.012, 1.0, (-1.2 + i * 0.104, -0.12, 1.85), rope, verts=5)
    # 赤提灯の列（軒下）と、置き看板
    red = k.mat("aka_chochin", (0.65, 0.05, 0.03), 0.75, emit=(1.0, 0.25, 0.08), emit_strength=1.6)
    for i in range(6):
        x = -2.5 + i * 1.0
        k.sphere("aka", 0.17, (x, -0.35, 2.6), red, scale=(1, 1, 1.3), segs=14, rings=9)
        k.cyl("aka_cap", 0.08, 0.05, (x, -0.35, 2.85), kit.iron, verts=10)
    k.box("eave", (W, 0.6, 0.1), (0, -0.3, 2.95), kit.wood_dark, bevel=0.01)
    k.box("oki_kanban", (0.4, 0.25, 1.0), (2.4, -0.9, 0.5), k.mat("andon_box", (0.95, 0.9, 0.75), 0.4, emit=(1.0, 0.9, 0.7), emit_strength=1.5), bevel=0.02)
    k.box("beer_crates", (0.5, 0.36, 0.6), (-2.5, -0.5, 0.3), k.mat("crate_yellow", (0.85, 0.6, 0.02), 0.45), bevel=0.02)
    for f in (1, 2):
        z = f * 3.0 + 1.5
        kit.window(-1.4, z, 1.6, 1.25, rail=True)
        kit.window(1.4, z, 1.6, 1.25, rail=True)
    kit.finish()
    k.save("shop_izakaya", OUT, H + 1.2, preview=PREVIEW)


@fit
def shop_kusuri():
    """薬局（4階建て・幅6.5m）: 白い小口タイル、青の帯、明るいガラス張りの店内、上は事務所"""
    kit = Kit(16)
    tile = tile_texture("facade_tile_white", 10.8, 6.0, (0.92, 0.92, 0.9), 0.012, (0.75, 0.75, 0.74), seed=11)
    W = 6.5
    blue = k.mat("kusuri_blue", THEMES["kusuri"]["main"], 0.4, 0.2)
    H = kit.shell(W, 4, k.tex_mat("wall_tile_white", tile), roof_ac=2, tank=True)
    kit.storefront(W, "kusuri", seed=10, glass_w=W - 0.5, frame=kit.frame)
    k.box("blue_band", (W + 0.02, 0.12, 0.7), (0, -0.06, 2.75), blue, bevel=0.01)
    # 店先のワゴン（商品の箱）
    goods = [k.mat(f"box_{i}", c, 0.5) for i, c in enumerate([(0.9, 0.3, 0.3), (0.2, 0.5, 0.85), (0.95, 0.85, 0.2), (0.3, 0.75, 0.45)])]
    for wx in (-1.8, 1.8):
        k.box("wagon", (1.2, 0.55, 0.06), (wx, -0.6, 0.75), kit.frame, bevel=0.005)
        for sx in (-1, 1):
            for sy in (-1, 1):
                k.cyl("wagon_leg", 0.015, 0.72, (wx + sx * 0.55, -0.6 + sy * 0.23, 0.36), kit.frame, verts=6)
        for i in range(8):
            k.box("goods", (0.13, 0.1, 0.18), (wx - 0.5 + (i % 4) * 0.3, -0.7 + (i // 4) * 0.2, 0.87), goods[i % 4], bevel=0.008)
    for f in (1, 2, 3):
        z = f * 3.0 + 1.5
        kit.window(-1.65, z, 2.5, 1.4, sash=3)
        kit.window(1.65, z, 2.5, 1.4, sash=3)
    kit.finish()
    k.save("shop_kusuri", OUT, H + 2.0, preview=PREVIEW)


for fn in REGISTRY:
    if ONLY and fn.__name__ not in ONLY:
        continue
    k.reset()
    fn()
