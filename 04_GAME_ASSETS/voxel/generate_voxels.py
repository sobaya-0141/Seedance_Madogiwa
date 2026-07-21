#!/usr/bin/env python3
"""窓際族物語 全キャラクターのボクセルモデル生成スクリプト。

MagicaVoxel形式（.vox）を models/ に、確認用レンダリング（PNG）を previews/ に出力する。
キャラデザインは 02_CHARACTERS/*.md のNG変更要素を厳守すること。

usage: python3 generate_voxels.py
"""
import os
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(HERE, "models")
PREVIEWS_DIR = os.path.join(HERE, "previews")

# ---------------------------------------------------------------------------
# パレット（全キャラ共通。indexはVOXのカラーインデックス1..255に対応）
# ---------------------------------------------------------------------------
PALETTE = []  # list of (r, g, b)
_PALETTE_LOOKUP = {}


def C(r, g, b):
    """色を登録してVOXカラーインデックス(1..255)を返す。"""
    key = (r, g, b)
    if key in _PALETTE_LOOKUP:
        return _PALETTE_LOOKUP[key]
    PALETTE.append(key)
    idx = len(PALETTE)
    if idx > 255:
        raise ValueError("palette overflow")
    _PALETTE_LOOKUP[key] = idx
    return idx


# 共通色
SKIN = C(0xF2, 0xC7, 0x9A)
SKIN_SHADE = C(0xE0, 0xAE, 0x80)
BLACK = C(0x1A, 0x1A, 0x1A)
HAIR_BLACK = C(0x22, 0x1E, 0x1C)
WHITE = C(0xF2, 0xF2, 0xF2)
DARK_GRAY = C(0x3A, 0x3A, 0x3A)
MID_GRAY = C(0x6A, 0x6A, 0x6A)
RED = C(0xC9, 0x2A, 0x2A)
PINK_CHEEK = C(0xF0, 0x6A, 0x8A)

# そば屋
SOBAYA_SKIN = C(0x9A, 0xA4, 0xA8)   # 灰色の肌
MASK_WHITE = C(0xFA, 0xFA, 0xF5)
BEER_AMBER = C(0xD9, 0x8A, 0x1F)
BEER_FOAM = C(0xFF, 0xF4, 0xD6)
MUG_GLASS = C(0xC9, 0xB8, 0x7A)

# たこさん
ROBE_BLACK = C(0x26, 0x26, 0x2A)
ROBE_SWIRL = C(0x3E, 0x3E, 0x46)
TAKO_FACE = C(0xD4, 0xD6, 0xD8)
TENTACLE = C(0x4A, 0x4A, 0x52)
SUCKER = C(0x9A, 0x9A, 0xA4)

# とーくん
ALOHA_MINT = C(0x8F, 0xE0, 0xC0)
ALOHA_ORANGE = C(0xE8, 0x83, 0x3A)
ALOHA_WHITE = C(0xF5, 0xFF, 0xF8)
ALOHA_GREEN = C(0x3F, 0xA8, 0x62)
NAVY = C(0x1C, 0x23, 0x40)
STRAW = C(0xD9, 0xB3, 0x6C)
STRAW_BAND = C(0x3A, 0x2F, 0x1F)
LEI_PINK = C(0xF0, 0x6A, 0xA8)
LEI_LIGHT = C(0xFF, 0xD0, 0xE4)
SUNGLASS = C(0x2A, 0x2E, 0x4A)
WOOD_LIGHT = C(0xC8, 0x9A, 0x5B)
WOOD_DARK = C(0x8A, 0x5A, 0x2A)

# よーたん
BLOND = C(0xE8, 0xC8, 0x5E)
LEATHER = C(0x20, 0x20, 0x22)
ZIPPER = C(0xC0, 0xC0, 0xC8)
GUITAR_BODY = C(0x8A, 0x3A, 0x24)
GUITAR_HOLE = C(0x2E, 0x1A, 0x10)

# 福ちゃん
COAT_NAVY = C(0x23, 0x28, 0x33)
SNEAKER_WHITE = C(0xFA, 0xFA, 0xFA)
TAG_RED = C(0xD9, 0x3A, 0x3A)
STRAP_BLUE = C(0x3A, 0x5A, 0xC9)

# やめたろう
PURPLE_SHIRT = C(0x7D, 0x63, 0xC4)
PURPLE_DARK = C(0x5A, 0x46, 0x94)
YAME_SKIN = C(0xF5, 0xCF, 0xA0)

# おかやまん
BEZEL = C(0x22, 0x22, 0x24)
SCREEN_BG = C(0xD8, 0xEC, 0xFF)
OKA_HAIR = C(0x2E, 0x26, 0x20)
BEARD = C(0x4A, 0x3C, 0x30)
HOODIE = C(0x18, 0x18, 0x1A)
LIVE_RED = C(0xE8, 0x2A, 0x2A)
STAND_GRAY = C(0x55, 0x58, 0x5E)

# ゆめみん
YUME_BLUE = C(0x62, 0xAE, 0xDE)
YUME_BLUE_DARK = C(0x3E, 0x86, 0xB8)
YUME_WHITE = C(0xF5, 0xF7, 0xFA)


# ---------------------------------------------------------------------------
# ボクセルモデル
# ---------------------------------------------------------------------------
class Model:
    def __init__(self, name):
        self.name = name
        self.v = {}

    def set(self, x, y, z, c):
        self.v[(x, y, z)] = c

    def box(self, x0, x1, y0, y1, z0, z1, c):
        x0, x1 = min(x0, x1), max(x0, x1)
        y0, y1 = min(y0, y1), max(y0, y1)
        z0, z1 = min(z0, z1), max(z0, z1)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                for z in range(z0, z1 + 1):
                    self.v[(x, y, z)] = c

    def remove_box(self, x0, x1, y0, y1, z0, z1):
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                for z in range(z0, z1 + 1):
                    self.v.pop((x, y, z), None)

    def ellipsoid(self, cx, cy, cz, rx, ry, rz, c):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            for y in range(int(cy - ry), int(cy + ry) + 1):
                for z in range(int(cz - rz), int(cz + rz) + 1):
                    dx = (x - cx) / (rx + 0.5)
                    dy = (y - cy) / (ry + 0.5)
                    dz = (z - cz) / (rz + 0.5)
                    if dx * dx + dy * dy + dz * dz <= 1.0:
                        self.v[(x, y, z)] = c

    def trim_corners(self, x0, x1, y0, y1, z0, z1):
        """箱の縦四隅を1ボクセル削って角を丸める。"""
        for z in range(z0, z1 + 1):
            for (x, y) in [(x0, y0), (x0, y1), (x1, y0), (x1, y1)]:
                self.v.pop((x, y, z), None)

    def paint(self, x, y, z, c):
        """既存ボクセルの色を塗り替える（存在しない場合は何もしない）。"""
        if (x, y, z) in self.v:
            self.v[(x, y, z)] = c

    def paint_front(self, x, z, c):
        """(x, z) 列の最前面（y最小）ボクセルを塗る。曲面への顔描画用。"""
        best = None
        for (vx, vy, vz) in self.v:
            if vx == x and vz == z and (best is None or vy < best):
                best = vy
        if best is not None:
            self.v[(x, best, z)] = c

    def bounds(self):
        xs = [p[0] for p in self.v]
        ys = [p[1] for p in self.v]
        zs = [p[2] for p in self.v]
        return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))


# ---------------------------------------------------------------------------
# VOXファイル書き出し（MagicaVoxel .vox format, version 150）
# ---------------------------------------------------------------------------
def write_vox(model, path):
    x0, x1, y0, y1, z0, z1 = model.bounds()
    sx, sy, sz = x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1
    if max(sx, sy, sz) > 256:
        raise ValueError("model too large for vox: %s" % model.name)

    voxels = []
    for (x, y, z), c in sorted(model.v.items()):
        # 前面(y小)がMagicaVoxelの-Y側になるようそのままシフトのみ
        voxels.append(struct.pack("<4B", x - x0, y - y0, z - z0, c))

    def chunk(cid, content, children=b""):
        return cid + struct.pack("<ii", len(content), len(children)) + content + children

    size_c = chunk(b"SIZE", struct.pack("<iii", sx, sy, sz))
    xyzi_c = chunk(b"XYZI", struct.pack("<i", len(voxels)) + b"".join(voxels))
    rgba = b""
    for i in range(256):
        if i < len(PALETTE):
            r, g, b = PALETTE[i]
            rgba += struct.pack("<4B", r, g, b, 255)
        else:
            rgba += struct.pack("<4B", 0, 0, 0, 255)
    rgba_c = chunk(b"RGBA", rgba)

    children = size_c + xyzi_c + rgba_c
    data = b"VOX " + struct.pack("<i", 150) + chunk(b"MAIN", b"", children)
    with open(path, "wb") as f:
        f.write(data)


# ---------------------------------------------------------------------------
# プレビューレンダリング（正面ビュー + アイソメビュー）
# ---------------------------------------------------------------------------
def render_previews(model, path):
    from PIL import Image, ImageDraw

    rgb = {i + 1: PALETTE[i] for i in range(len(PALETTE))}
    x0, x1, y0, y1, z0, z1 = model.bounds()

    # --- 正面ビュー（-y方向から） ---
    scale = 12
    fw, fh = (x1 - x0 + 3) * scale, (z1 - z0 + 3) * scale
    front = Image.new("RGB", (fw, fh), (245, 245, 248))
    fd = ImageDraw.Draw(front)
    front_cols = {}
    for (x, y, z), c in model.v.items():
        key = (x, z)
        if key not in front_cols or y < front_cols[key][0]:
            front_cols[key] = (y, c)
    for (x, z), (y, c) in front_cols.items():
        r, g, b = rgb[c]
        f = max(0.62, 1.0 - 0.035 * (y - y0))
        col = (int(r * f), int(g * f), int(b * f))
        px = (x - x0 + 1) * scale
        py = (z1 - z + 1) * scale
        fd.rectangle([px, py, px + scale - 1, py + scale - 1], fill=col)

    # --- アイソメビュー（正面左上から） ---
    S, T = 7, 4  # 横・縦の投影係数
    def proj(x, y, z):
        sx = (x + y) * S
        sy = (x - y - 2 * z) * T
        return sx, sy

    pts = []
    for (x, y, z) in model.v:
        for dx in (0, 1):
            for dy in (0, 1):
                for dz in (0, 1):
                    pts.append(proj(x - x0 + dx, y - y0 + dy, z - z0 + dz))
    minx = min(p[0] for p in pts)
    maxx = max(p[0] for p in pts)
    miny = min(p[1] for p in pts)
    maxy = max(p[1] for p in pts)
    iw, ih = maxx - minx + 20, maxy - miny + 20
    iso = Image.new("RGB", (iw, ih), (245, 245, 248))
    idr = ImageDraw.Draw(iso)

    def pp(x, y, z):
        sx, sy = proj(x, y, z)
        return (sx - minx + 10, sy - miny + 10)

    def shade(c, f):
        r, g, b = rgb[c]
        return (int(r * f), int(g * f), int(b * f))

    # 奥→手前の順に描画（カメラは -y, +x, +z 側）
    order = sorted(model.v.items(), key=lambda it: it[0][0] - it[0][1] + it[0][2])
    for (x, y, z), c in order:
        gx, gy, gz = x - x0, y - y0, z - z0
        # 上面 (+z)
        if (x, y, z + 1) not in model.v:
            idr.polygon([pp(gx, gy, gz + 1), pp(gx + 1, gy, gz + 1),
                         pp(gx + 1, gy + 1, gz + 1), pp(gx, gy + 1, gz + 1)],
                        fill=shade(c, 1.0))
        # 前面 (-y)
        if (x, y - 1, z) not in model.v:
            idr.polygon([pp(gx, gy, gz), pp(gx + 1, gy, gz),
                         pp(gx + 1, gy, gz + 1), pp(gx, gy, gz + 1)],
                        fill=shade(c, 0.82))
        # 右面 (+x)
        if (x + 1, y, z) not in model.v:
            idr.polygon([pp(gx + 1, gy, gz), pp(gx + 1, gy + 1, gz),
                         pp(gx + 1, gy + 1, gz + 1), pp(gx + 1, gy, gz + 1)],
                        fill=shade(c, 0.62))

    # 横に並べて1枚に
    h = max(front.size[1], iso.size[1])
    combined = Image.new("RGB", (front.size[0] + iso.size[0] + 20, h), (245, 245, 248))
    combined.paste(front, (0, (h - front.size[1]) // 2))
    combined.paste(iso, (front.size[0] + 20, (h - iso.size[1]) // 2))
    combined.save(path)
    return combined


# ---------------------------------------------------------------------------
# 汎用パーツ
# ---------------------------------------------------------------------------
def chibi_head(m, cx, half_w, yf, yb, z0, z1, skin):
    """角を丸めた頭部の箱。yfが前面。"""
    m.box(cx - half_w, cx + half_w, yf, yb, z0, z1, skin)
    m.trim_corners(cx - half_w, cx + half_w, yf, yb, z0, z1)
    # 上下の縁も少し丸める
    for (x, y) in [(cx - half_w, yf), (cx - half_w, yb), (cx + half_w, yf), (cx + half_w, yb)]:
        pass
    for z in (z0, z1):
        for x in (cx - half_w, cx + half_w):
            for y in range(yf, yb + 1):
                m.v.pop((x, y, z), None)
        for y in (yf, yb):
            for x in range(cx - half_w, cx + half_w + 1):
                m.v.pop((x, y, z), None)


def simple_hair(m, cx, half_w, yf, yb, z_top, hair, back_len=4, side_len=3, bang=True):
    """トップ＋後頭部＋サイドの単純な髪。"""
    # トップ
    m.box(cx - half_w, cx + half_w, yf, yb, z_top - 1, z_top + 1, hair)
    m.trim_corners(cx - half_w, cx + half_w, yf, yb, z_top - 1, z_top + 1)
    for x in (cx - half_w, cx + half_w):
        for y in (yf, yb):
            m.v.pop((x, y, z_top + 1), None)
    # 後頭部
    m.box(cx - half_w, cx + half_w, yb - 1, yb, z_top - back_len, z_top, hair)
    # サイド
    m.box(cx - half_w, cx - half_w, yf + 1, yb, z_top - side_len, z_top, hair)
    m.box(cx + half_w, cx + half_w, yf + 1, yb, z_top - side_len, z_top, hair)
    # 前髪
    if bang:
        for x in range(cx - half_w, cx + half_w + 1):
            m.paint(x, yf, z_top - 1, hair)
            m.paint(x, yf, z_top, hair)


# ===========================================================================
# 各キャラクター
# ===========================================================================
def build_sobaya():
    """そば屋: 白い仮面・灰色の肌・筋肉質・白Tシャツ・ビールジョッキ(NG: 仮面, ジョッキ)"""
    m = Model("sobaya")
    cx = 15
    # 脚（ダークパンツ・黒靴）
    for lx in (cx - 4, cx + 2):
        m.box(lx, lx + 2, 13, 16, 2, 6, DARK_GRAY)
        m.box(lx, lx + 2, 12, 16, 0, 1, BLACK)
    # 胴体（筋肉質・幅広）: 白Tシャツ
    m.box(cx - 7, cx + 7, 12, 18, 7, 14, WHITE)
    m.trim_corners(cx - 7, cx + 7, 12, 18, 7, 14)
    m.box(cx - 6, cx + 6, 12, 17, 7, 8, DARK_GRAY)  # ベルト帯
    m.box(cx - 6, cx + 6, 12, 17, 9, 14, WHITE)
    # 大胸筋の段差
    m.box(cx - 5, cx + 5, 11, 12, 11, 13, WHITE)
    # 左腕（下ろし・灰色肌、肩は白い半袖）
    m.box(cx - 10, cx - 8, 13, 16, 12, 14, WHITE)     # 袖
    m.box(cx - 10, cx - 8, 13, 16, 7, 11, SOBAYA_SKIN)  # 剥き出しの太い腕
    m.box(cx - 10, cx - 8, 13, 16, 5, 6, SOBAYA_SKIN)   # 拳
    # 右腕（曲げてジョッキを持ち上げる）
    m.box(cx + 8, cx + 10, 13, 16, 12, 14, WHITE)     # 袖
    m.box(cx + 8, cx + 10, 13, 16, 9, 11, SOBAYA_SKIN)
    m.box(cx + 9, cx + 12, 11, 14, 9, 11, SOBAYA_SKIN)  # 前腕を前へ
    m.box(cx + 10, cx + 12, 10, 13, 11, 12, SOBAYA_SKIN)  # 拳
    # ビールジョッキ（NG必須）: 拳の上
    m.box(cx + 9, cx + 13, 9, 13, 13, 16, BEER_AMBER)
    m.box(cx + 9, cx + 13, 9, 13, 17, 18, BEER_FOAM)
    m.box(cx + 9, cx + 13, 9, 13, 13, 13, MUG_GLASS)   # 底
    m.box(cx + 14, cx + 14, 10, 12, 14, 16, MUG_GLASS)  # 取っ手
    # 頭（灰色肌 + 白い仮面）
    chibi_head(m, cx, 6, 11, 19, 15, 27, SOBAYA_SKIN)
    # 黒髪（短髪）
    m.box(cx - 6, cx + 6, 11, 19, 26, 28, HAIR_BLACK)
    m.trim_corners(cx - 6, cx + 6, 11, 19, 26, 28)
    m.box(cx - 6, cx + 6, 17, 19, 21, 26, HAIR_BLACK)
    # 白い仮面（前面レイヤー全体）
    for x in range(cx - 5, cx + 6):
        for z in range(16, 26):
            m.paint_front(x, z, MASK_WHITE)
    # 赤い縦筋（両目を貫く涙状の模様）
    for x in (cx - 3, cx + 3):
        for z in range(17, 24):
            m.paint_front(x, z, RED)
    # 黒い丸目
    for x in (cx - 3, cx + 3):
        for z in (20, 21):
            m.paint_front(x, z, BLACK)
    # 額の黒点
    m.paint_front(cx, 24, BLACK)
    # 口のスリット
    for x in range(cx - 1, cx + 2):
        m.paint_front(x, 17, DARK_GRAY)
    return m


def build_takosan():
    """たこさん: 黒フード付きローブ・白い顔・黒丸目・触手・人間の腕2本(NG: ローブ, 触手)"""
    m = Model("takosan")
    cx = 15
    # 触手6本（下部・カール付き）
    tent = [(cx - 6, 12, -2, 0), (cx - 2, 11, 0, -1), (cx + 2, 11, 0, 1),
            (cx + 6, 12, 2, 0), (cx - 4, 16, -1, 1), (cx + 4, 16, 1, -1)]
    for (tx, ty, dx, dy) in tent:
        m.box(tx - 1, tx, ty, ty + 1, 2, 5, TENTACLE)
        # 先端が外へカール
        m.box(tx - 1 + dx, tx + dx, ty + dy, ty + 1 + dy, 1, 2, TENTACLE)
        m.box(tx - 1 + 2 * dx, tx + 2 * dx, ty + 2 * dy, ty + 1 + 2 * dy, 0, 1, SUCKER)
    # ローブ（裾広がり）
    m.box(cx - 7, cx + 7, 11, 18, 4, 6, ROBE_BLACK)
    m.box(cx - 6, cx + 6, 11, 18, 7, 10, ROBE_BLACK)
    m.box(cx - 5, cx + 5, 12, 18, 11, 14, ROBE_BLACK)
    # ローブの渦模様（前面にアクセント）
    for (sx, sz) in [(cx - 4, 6), (cx + 3, 8), (cx - 2, 10), (cx + 4, 5), (cx, 7)]:
        m.paint_front(sx, sz, ROBE_SWIRL)
        m.paint_front(sx + 1, sz, ROBE_SWIRL)
        m.paint_front(sx, sz + 1, ROBE_SWIRL)
    # 人間の腕2本（黒い袖 + 白い手）
    for (ax, hx) in [(cx - 8, cx - 8), (cx + 7, cx + 7)]:
        m.box(ax, ax + 1, 13, 15, 8, 12, ROBE_BLACK)
        m.box(hx, hx + 1, 13, 15, 6, 7, TAKO_FACE)
    # 頭（フードに包まれた丸頭）
    chibi_head(m, cx, 6, 10, 19, 15, 26, ROBE_BLACK)
    # フードのてっぺんを尖らせる
    m.box(cx - 2, cx + 2, 13, 16, 27, 27, ROBE_BLACK)
    m.box(cx, cx, 14, 15, 28, 28, ROBE_BLACK)
    # 顔の開口部（白い顔）
    for x in range(cx - 4, cx + 5):
        for z in range(17, 24):
            m.paint_front(x, z, TAKO_FACE)
    # 黒い丸目（大きめ・2x2）
    for ex in (cx - 3, cx + 2):
        for dx in (0, 1):
            for dz in (0, 1):
                m.paint_front(ex + dx, 19 + dz, BLACK)
    return m


def build_tokun():
    """とーくん: アロハ・麦わら帽子・ウクレレ・サングラス・レイ(NG: アロハ, 帽子, ウクレレ)"""
    m = Model("tokun")
    cx = 15
    # 脚（紺パンツ・裸足）
    for lx in (cx - 4, cx + 2):
        m.box(lx, lx + 2, 13, 16, 2, 6, NAVY)
        m.box(lx, lx + 2, 12, 16, 0, 1, SKIN)
    # 胴体（少しふくよか）: アロハシャツ
    m.box(cx - 6, cx + 6, 11, 18, 7, 14, ALOHA_MINT)
    m.trim_corners(cx - 6, cx + 6, 11, 18, 7, 14)
    # アロハの柄（前面に白い波・オレンジの花・緑の葉）
    pattern = [(cx - 4, 8, ALOHA_WHITE), (cx - 2, 12, ALOHA_ORANGE), (cx + 1, 9, ALOHA_GREEN),
               (cx + 4, 12, ALOHA_WHITE), (cx - 5, 11, ALOHA_GREEN), (cx + 3, 7, ALOHA_ORANGE),
               (cx, 14, ALOHA_WHITE), (cx + 5, 9, ALOHA_GREEN), (cx - 3, 14, ALOHA_ORANGE)]
    for (px, pz, pc) in pattern:
        m.paint_front(px, pz, pc)
    # レイ（首回りのピンクの花輪・NGではないが定番装備）
    ring = []
    for x in range(cx - 5, cx + 6):
        ring.append((x, 11))
    for (i, (rx, ry)) in enumerate(ring):
        c = LEI_PINK if i % 2 == 0 else LEI_LIGHT
        m.set(rx, ry, 14, c)
        m.set(rx, ry, 13, c if i % 2 else LEI_LIGHT)
    m.box(cx - 5, cx + 5, 11, 12, 13, 14, LEI_PINK)
    for x in range(cx - 5, cx + 6, 2):
        m.paint(x, 11, 13, LEI_LIGHT)
        m.paint(x, 11, 14, LEI_LIGHT)
    # 腕（アロハ袖 + 素肌、ウクレレを抱える形で前に）
    m.box(cx - 9, cx - 7, 12, 15, 11, 14, ALOHA_MINT)
    m.box(cx - 9, cx - 7, 12, 15, 9, 10, SKIN)
    m.box(cx - 8, cx - 5, 9, 12, 8, 9, SKIN)   # 左前腕を前へ
    m.box(cx + 7, cx + 9, 12, 15, 11, 14, ALOHA_MINT)
    m.box(cx + 7, cx + 9, 12, 15, 9, 10, SKIN)
    m.box(cx + 4, cx + 8, 9, 12, 9, 10, SKIN)  # 右前腕を前へ
    # ウクレレ（NG必須）: 胴 + ネック（斜め上へ）
    m.box(cx - 4, cx - 1, 8, 9, 6, 10, WOOD_LIGHT)
    m.paint_front(cx - 3, 8, GUITAR_HOLE)
    m.paint_front(cx - 2, 8, GUITAR_HOLE)
    m.box(cx, cx + 2, 8, 9, 9, 10, WOOD_DARK)
    m.box(cx + 3, cx + 5, 8, 9, 10, 11, WOOD_DARK)
    m.box(cx + 6, cx + 8, 8, 9, 11, 12, WOOD_DARK)
    m.box(cx + 8, cx + 9, 8, 9, 12, 13, WOOD_LIGHT)  # ヘッド
    # 頭
    chibi_head(m, cx, 5, 11, 19, 15, 25, SKIN)
    # ぽっちゃりした頬
    m.box(cx - 5, cx + 5, 11, 12, 15, 17, SKIN)
    # 黒髪（帽子から少し見える）
    m.box(cx - 5, cx + 5, 11, 19, 22, 23, HAIR_BLACK)
    m.box(cx - 5, cx + 5, 17, 19, 19, 22, HAIR_BLACK)
    # サングラス
    for x in list(range(cx - 4, cx - 1)) + list(range(cx + 2, cx + 5)):
        for z in (20, 21):
            m.paint_front(x, z, SUNGLASS)
    for x in range(cx - 1, cx + 2):
        m.paint_front(x, 21, BLACK)  # ブリッジ
    # 笑顔（開いた口）
    for x in range(cx - 1, cx + 2):
        m.paint_front(x, 17, BLACK)
    m.paint_front(cx, 16, RED)
    # 麦わら帽子（NG必須）: つば + クラウン + 黒バンド
    m.box(cx - 8, cx + 8, 8, 22, 24, 24, STRAW)
    m.trim_corners(cx - 8, cx + 8, 8, 22, 24, 24)
    m.box(cx - 5, cx + 5, 11, 19, 25, 25, STRAW_BAND)
    m.box(cx - 5, cx + 5, 11, 19, 26, 27, STRAW)
    m.trim_corners(cx - 5, cx + 5, 11, 19, 26, 27)
    m.box(cx - 3, cx + 3, 13, 17, 28, 28, STRAW)
    return m


def build_yotan():
    """よーたん: 金髪・黒レザージャケット・ギター・サングラス(NG: ギター, 金髪, ロック服)"""
    m = Model("yotan")
    cx = 15
    # 脚（黒パンツ・黒ブーツ、細身）
    for lx in (cx - 3, cx + 1):
        m.box(lx, lx + 2, 13, 16, 2, 6, LEATHER)
        m.box(lx, lx + 2, 12, 16, 0, 1, BLACK)
    # 胴体（細身）: 黒レザージャケット
    m.box(cx - 5, cx + 5, 12, 17, 7, 14, LEATHER)
    m.trim_corners(cx - 5, cx + 5, 12, 17, 7, 14)
    # ジッパーライン（銀）
    for z in range(8, 14):
        m.paint_front(cx, z, ZIPPER)
    # 襟（開いた黒Tシャツ部分）
    m.paint_front(cx - 1, 13, BLACK)
    m.paint_front(cx + 1, 13, BLACK)
    # 腕（レザー袖 + 素肌の手）
    m.box(cx - 8, cx - 6, 12, 15, 8, 14, LEATHER)
    m.box(cx - 8, cx - 6, 12, 15, 6, 7, SKIN)
    m.box(cx + 6, cx + 8, 12, 15, 8, 14, LEATHER)
    m.box(cx + 6, cx + 8, 12, 15, 6, 7, SKIN)
    # ギター（NG必須）: 腰前に斜め掛け
    m.box(cx + 1, cx + 5, 9, 10, 4, 8, GUITAR_BODY)
    m.box(cx + 2, cx + 4, 9, 9, 5, 7, GUITAR_BODY)
    m.paint_front(cx + 3, 6, GUITAR_HOLE)
    m.paint_front(cx + 3, 7, GUITAR_HOLE)
    m.box(cx - 2, cx, 9, 10, 8, 9, WOOD_DARK)     # ネック（斜め上左へ）
    m.box(cx - 5, cx - 3, 9, 10, 9, 10, WOOD_DARK)
    m.box(cx - 8, cx - 6, 9, 10, 10, 11, WOOD_DARK)
    m.box(cx - 9, cx - 8, 9, 10, 11, 12, BLACK)   # ヘッド
    # ストラップ
    for i, x in enumerate(range(cx - 4, cx + 5)):
        m.paint_front(x, 14 - (i > 4), DARK_GRAY)
    # 頭
    chibi_head(m, cx, 5, 11, 19, 15, 25, SKIN)
    # 金髪（肩までのロングヘア・NG必須）
    m.box(cx - 5, cx + 5, 11, 19, 24, 26, BLOND)
    m.trim_corners(cx - 5, cx + 5, 11, 19, 24, 26)
    m.box(cx - 5, cx + 5, 17, 19, 13, 24, BLOND)          # 後ろ髪（肩まで）
    m.box(cx - 5, cx - 5, 12, 19, 15, 24, BLOND)          # サイド左
    m.box(cx + 5, cx + 5, 12, 19, 15, 24, BLOND)          # サイド右
    m.box(cx - 6, cx - 6, 14, 18, 13, 22, BLOND)
    m.box(cx + 6, cx + 6, 14, 18, 13, 22, BLOND)
    # 前髪
    for x in range(cx - 4, cx + 5):
        m.paint_front(x, 23, BLOND)
        if x % 2 == 0:
            m.paint_front(x, 22, BLOND)
    # 丸サングラス
    for gx0 in (cx - 4, cx + 2):
        for x in range(gx0, gx0 + 3):
            for z in (19, 20):
                m.paint_front(x, z, SUNGLASS)
    m.paint_front(cx, 20, BLACK)  # ブリッジ
    # 笑った口
    for x in range(cx - 1, cx + 2):
        m.paint_front(x, 16, BLACK)
    return m


def build_fukuchan():
    """福ちゃん: おしゃれ服・ギュンギュンポーズ・名札とSPONSORストラップ(NG: おしゃれ服, ポーズ)"""
    m = Model("fukuchan")
    cx = 15
    # 脚（黒パンツ・白スニーカー）
    for lx in (cx - 3, cx + 1):
        m.box(lx, lx + 2, 13, 16, 2, 6, BLACK)
        m.box(lx, lx + 2, 12, 16, 0, 1, SNEAKER_WHITE)
    # 胴体: 白Tシャツ + 紺ロングコート（サイドと背面）
    m.box(cx - 5, cx + 5, 12, 17, 5, 14, COAT_NAVY)
    m.trim_corners(cx - 5, cx + 5, 12, 17, 5, 14)
    m.box(cx - 2, cx + 2, 12, 12, 6, 13, WHITE)  # 前面の白Tシャツ
    for x in range(cx - 2, cx + 3):
        for z in range(6, 14):
            m.paint_front(x, z, WHITE)
    # Tシャツのモノクログラフィック柄
    for (px, pz) in [(cx - 1, 8), (cx, 10), (cx + 1, 7), (cx - 2, 11), (cx + 2, 9)]:
        m.paint_front(px, pz, DARK_GRAY)
    # SPONSORストラップ（青） + 名札（白 + 赤アクセント）
    m.paint_front(cx - 2, 13, STRAP_BLUE)
    m.paint_front(cx + 2, 13, STRAP_BLUE)
    m.paint_front(cx - 1, 12, STRAP_BLUE)
    m.paint_front(cx + 1, 12, STRAP_BLUE)
    for z in (10, 11):
        m.paint_front(cx, z, WHITE)
    m.paint_front(cx, 11, TAG_RED)
    m.paint_front(cx, 10, WHITE)
    m.paint_front(cx - 0, 9, TAG_RED)
    # ギュンギュンポーズ（NG必須）: 両腕を曲げて拳を頬へ
    for side in (-1, 1):
        sx = cx + side * 6
        m.box(sx - 1, sx + 1, 12, 15, 11, 14, COAT_NAVY)       # 肩袖
        m.box(sx + side, sx + side + side, 12, 15, 13, 17, COAT_NAVY)  # 上へ曲げた袖
        hx = sx + side
        m.box(hx, hx + side, 12, 14, 18, 19, SKIN)             # 頬横の拳
    # 頭
    chibi_head(m, cx, 5, 11, 19, 15, 25, SKIN)
    # 黒髪（センターパートのミディアム）
    simple_hair(m, cx, 5, 11, 19, 24, HAIR_BLACK, back_len=5, side_len=4, bang=False)
    for x in range(cx - 4, cx + 5):
        if x != cx:  # センターパート
            m.paint_front(x, 23, HAIR_BLACK)
        if abs(x - cx) >= 3:
            m.paint_front(x, 22, HAIR_BLACK)
            m.paint_front(x, 21, HAIR_BLACK)
    # にこにこ笑顔
    for (ex, ez) in [(cx - 2, 20), (cx + 2, 20)]:
        m.paint_front(ex, ez, BLACK)
    # 頬の赤み（ギュンギュン）
    m.paint_front(cx - 3, 18, PINK_CHEEK)
    m.paint_front(cx + 3, 18, PINK_CHEEK)
    for x in range(cx - 1, cx + 2):
        m.paint_front(x, 17, BLACK)
    m.paint_front(cx - 2, 18, BLACK)
    m.paint_front(cx + 2, 18, BLACK)
    return m


def build_yametaro():
    """無職やめたろう: 紫ワイシャツ・丸メガネ・デフォルメ(NG: キャラクターデザイン全般)"""
    m = Model("yametaro")
    cx = 15
    # 脚（短い・ダークパンツ・黒靴）
    for lx in (cx - 3, cx + 1):
        m.box(lx, lx + 2, 13, 16, 1, 3, PURPLE_DARK)
        m.box(lx, lx + 2, 12, 16, 0, 0, BLACK)
    # 胴体（小さめ）: 紫ワイシャツ
    m.box(cx - 5, cx + 5, 12, 17, 4, 10, PURPLE_SHIRT)
    m.trim_corners(cx - 5, cx + 5, 12, 17, 4, 10)
    # 襟
    m.paint_front(cx - 1, 10, WHITE)
    m.paint_front(cx + 1, 10, WHITE)
    # ボタン
    for z in (5, 7, 9):
        m.paint_front(cx, z, PURPLE_DARK)
    # 腕（紫袖 + 手）
    for side in (-1, 1):
        ax = cx + side * 6
        m.box(ax - (side < 0), ax + (side > 0), 12, 15, 6, 10, PURPLE_SHIRT)
        m.box(ax - (side < 0), ax + (side > 0), 12, 15, 4, 5, YAME_SKIN)
    # 頭（特大デフォルメ）
    chibi_head(m, cx, 7, 10, 20, 11, 26, YAME_SKIN)
    # 黒髪ボウルカット + 中央の富士額（肌の三角形が上に食い込む）
    m.box(cx - 7, cx + 7, 10, 20, 24, 27, HAIR_BLACK)
    m.trim_corners(cx - 7, cx + 7, 10, 20, 24, 27)
    m.box(cx - 7, cx + 7, 17, 20, 15, 24, HAIR_BLACK)  # 後頭部
    m.box(cx - 7, cx - 7, 11, 20, 14, 24, HAIR_BLACK)  # サイド
    m.box(cx + 7, cx + 7, 11, 20, 14, 24, HAIR_BLACK)
    # 前髪: サイドは眉まで、中央は肌がV字に高く残る
    for x in range(cx - 6, cx + 7):
        d = abs(x - cx)
        if d >= 4:
            top = 19
        elif d == 3:
            top = 21
        elif d == 2:
            top = 22
        else:
            top = 23
        for z in range(top, 24):
            m.paint_front(x, z, HAIR_BLACK)
    # 耳
    m.box(cx - 8, cx - 8, 13, 15, 17, 19, YAME_SKIN)
    m.box(cx + 8, cx + 8, 13, 15, 17, 19, YAME_SKIN)
    # 丸メガネ（NGデザイン: 白レンズ + 黒フレーム）
    for side in (-1, 1):
        gx = cx + side * 3
        for dx in range(-1, 2):
            for dz in range(-1, 2):
                if abs(dx) == 1 and abs(dz) == 1:
                    continue
                m.paint_front(gx + dx, 17 + dz, BLACK)
        m.paint_front(gx, 17, WHITE)
    m.paint_front(cx, 17, BLACK)  # ブリッジ
    # ピンクの頬
    for side in (-1, 1):
        m.paint_front(cx + side * 6, 15, PINK_CHEEK)
        m.paint_front(cx + side * 5, 15, PINK_CHEEK)
        m.paint_front(cx + side * 6, 14, PINK_CHEEK)
    # 口（ほんのり笑い）
    m.paint_front(cx, 13, BLACK)
    m.paint_front(cx + 1, 13, BLACK)
    return m


def build_okayaman():
    """窓際王おかやまん: 大型スクリーンにリモート出演(NG: 穏やかな笑顔, リモート出演スタイル)"""
    m = Model("okayaman")
    cx = 15
    # スタンド
    m.box(cx - 5, cx + 5, 12, 18, 0, 1, STAND_GRAY)
    m.box(cx - 1, cx + 1, 14, 16, 2, 5, STAND_GRAY)
    # スクリーン本体（薄い板）
    m.box(cx - 12, cx + 12, 14, 15, 6, 28, BEZEL)
    # 画面領域（前面 y=14 をドット絵として塗る）
    def px(x, z, c):
        m.paint(cx + x, 14, z, c)
    for x in range(-10, 11):
        for z in range(8, 27):
            px(x, z, SCREEN_BG)
    # --- 画面内のおかやまん（バストアップ） ---
    # 黒いフード付きジャケット（肩まわり）
    for x in range(-10, 11):
        for z in range(8, 12):
            px(x, z, HOODIE)
    for x in range(-8, 9):
        px(x, 12, HOODIE)
    # フードの襟
    for x in range(-6, 7):
        px(x, 13, HOODIE)
    for x in (-6, -5, 5, 6):
        px(x, 14, HOODIE)
    # 顔
    for x in range(-4, 5):
        for z in range(13, 22):
            px(x, z, SKIN)
    # 黒髪ミディアム
    for x in range(-5, 6):
        for z in range(21, 25):
            px(x, z, OKA_HAIR)
    for z in range(17, 22):
        px(-5, z, OKA_HAIR)
        px(5, z, OKA_HAIR)
    for x in (-4, -3, 3, 4):
        px(x, 21, OKA_HAIR)
    px(-1, 21, OKA_HAIR)
    px(0, 21, OKA_HAIR)
    # 穏やかな笑顔の目（にっこり閉じ目）
    for x in (-3, -2, 2, 3):
        px(x, 18, HAIR_BLACK)
    # 口ひげ + 笑顔の口 + あごひげ
    for x in (-2, -1, 1, 2):
        px(x, 16, BEARD)
    for x in (-1, 0, 1):
        px(x, 15, RED)
    for x in (-2, -1, 0, 1, 2):
        px(x, 14, BEARD)
    px(0, 13, BEARD)
    # LIVEインジケータ（画面左上）
    px(-9, 25, LIVE_RED)
    for x in (-8, -7):
        px(x, 25, WHITE)
    return m


def build_yumemin():
    """ゆめみん: 青い丸い体・点目・自由に動く鼻・木槌・お尻は白(NG: デザイン全般)"""
    m = Model("yumemin")
    cx, cy, cz = 15, 15, 12
    # 丸い体
    m.ellipsoid(cx, cy, cz, 8, 8, 7, YUME_BLUE)
    # お尻側（後部）は白
    for (x, y, z), c in list(m.v.items()):
        if y >= cy + 4 and z <= cz + 3:
            m.v[(x, y, z)] = YUME_WHITE
    # 耳（頭頂の小さな三角）
    for side in (-1, 1):
        ex = cx + side * 4
        m.box(ex - 1, ex + 1, cy - 2, cy, cz + 7, cz + 7, YUME_BLUE)
        m.box(ex, ex, cy - 2, cy - 1, cz + 8, cz + 8, YUME_BLUE_DARK)
    # 鼻（顔の左側から前へ伸びるバクの鼻・NG必須）
    nx = cx - 4
    front_y = cy - 8
    m.box(nx - 1, nx + 1, front_y - 2, front_y, cz - 1, cz + 1, YUME_BLUE)
    m.box(nx - 1, nx + 1, front_y - 4, front_y - 3, cz, cz + 2, YUME_BLUE)
    m.box(nx - 1, nx + 1, front_y - 5, front_y - 5, cz + 2, cz + 3, YUME_BLUE)
    m.box(nx - 1, nx + 1, front_y - 5, front_y - 5, cz + 4, cz + 4, YUME_BLUE_DARK)  # 鼻先
    # 点目（鼻と被らない高さに・鼻より後に塗る）
    m.paint_front(cx - 2, cz + 3, BLACK)
    m.paint_front(cx + 2, cz + 3, BLACK)
    # 小さな足
    for side in (-1, 1):
        fx = cx + side * 3
        m.box(fx - 1, fx + 1, cy - 3, cy, 3, 4, YUME_BLUE)
    # 木槌（右手側）: 柄 + 頭
    m.box(cx + 7, cx + 8, cy - 5, cy - 4, cz - 2, cz, YUME_BLUE)  # 柄を握る小さな手
    for i in range(5):
        m.set(cx + 8 + i, cy - 5, cz + i, WOOD_DARK)
        m.set(cx + 8 + i, cy - 4, cz + i, WOOD_DARK)
    m.box(cx + 11, cx + 14, cy - 7, cy - 3, cz + 4, cz + 8, WOOD_LIGHT)
    m.box(cx + 11, cx + 14, cy - 7, cy - 3, cz + 4, cz + 4, WOOD_DARK)
    m.box(cx + 11, cx + 14, cy - 7, cy - 3, cz + 8, cz + 8, WOOD_LIGHT)
    return m


# ---------------------------------------------------------------------------
BUILDERS = [
    ("01_sobaya", build_sobaya),
    ("02_takosan", build_takosan),
    ("03_tokun", build_tokun),
    ("04_yotan", build_yotan),
    ("05_fukuchan", build_fukuchan),
    ("06_yametaro", build_yametaro),
    ("07_okayaman", build_okayaman),
    ("08_yumemin", build_yumemin),
]


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(PREVIEWS_DIR, exist_ok=True)
    previews = []
    for name, fn in BUILDERS:
        model = fn()
        vox_path = os.path.join(MODELS_DIR, name + ".vox")
        write_vox(model, vox_path)
        png_path = os.path.join(PREVIEWS_DIR, name + ".png")
        img = render_previews(model, png_path)
        previews.append((name, img))
        print("wrote %s (%d voxels)" % (vox_path, len(model.v)))

    # 全キャラ一覧のコンタクトシート
    from PIL import Image, ImageDraw
    cols = 2
    rows = (len(previews) + cols - 1) // cols
    cw = max(img.size[0] for _, img in previews) + 20
    ch = max(img.size[1] for _, img in previews) + 40
    sheet = Image.new("RGB", (cw * cols, ch * rows), (235, 235, 240))
    sd = ImageDraw.Draw(sheet)
    for i, (name, img) in enumerate(previews):
        gx, gy = (i % cols) * cw, (i // cols) * ch
        sheet.paste(img, (gx + 10, gy + 30))
        sd.text((gx + 12, gy + 8), name, fill=(30, 30, 30))
    sheet_path = os.path.join(PREVIEWS_DIR, "all_characters.png")
    sheet.save(sheet_path)
    print("wrote", sheet_path)


if __name__ == "__main__":
    main()
