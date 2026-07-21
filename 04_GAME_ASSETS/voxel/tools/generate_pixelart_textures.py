"""Deterministic pixel-art albedo textures for the 5 non-imagegen characters.

とーくん・よーたん・ふくちゃん・おかやまん・ゆめみんの顔・服・画面アルベドを
64x64のドット絵として描き、NEAREST拡大で1024pxのアルベドPNGに出力する。
imagegenが使えない環境でも再生成できるよう、全テクスチャをコードで決定論的に
生成する。識別ロックは 02_CHARACTERS/*.md と旧generate_voxels.pyの正準カラーに従う。

Run:  python tools/generate_pixelart_textures.py  (from 04_GAME_ASSETS/voxel/)
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw

GRID = 64
OUT = 1024
TEXTURES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "model_source", "textures")

# 旧generate_voxels.py由来の正準カラー
SKIN = (0xF2, 0xC7, 0x9A)
SKIN_SHADE = (0xE0, 0xAE, 0x80)
BLACK = (0x1A, 0x1A, 0x1A)
HAIR_BLACK = (0x22, 0x1E, 0x1C)
WHITE = (0xF2, 0xF2, 0xF2)
DARK_GRAY = (0x3A, 0x3A, 0x3A)
RED = (0xC9, 0x2A, 0x2A)
PINK_CHEEK = (0xF0, 0x6A, 0x8A)
SUNGLASS = (0x2A, 0x2E, 0x4A)
ALOHA_MINT = (0x8F, 0xE0, 0xC0)
ALOHA_ORANGE = (0xE8, 0x83, 0x3A)
ALOHA_WHITE = (0xF5, 0xFF, 0xF8)
ALOHA_GREEN = (0x3F, 0xA8, 0x62)
LEATHER = (0x20, 0x20, 0x22)
LEATHER_SEAM = (0x30, 0x30, 0x34)
ZIPPER = (0xC0, 0xC0, 0xC8)
COAT_NAVY = (0x23, 0x28, 0x33)
TAG_RED = (0xD9, 0x3A, 0x3A)
STRAP_BLUE = (0x3A, 0x5A, 0xC9)
SCREEN_BG = (0xD8, 0xEC, 0xFF)
OKA_HAIR = (0x2E, 0x26, 0x20)
BEARD = (0x4A, 0x3C, 0x30)
HOODIE = (0x18, 0x18, 0x1A)
LIVE_RED = (0xE8, 0x2A, 0x2A)
YUME_BLUE = (0x62, 0xAE, 0xDE)


def canvas(color):
    img = Image.new("RGB", (GRID, GRID), color)
    return img, ImageDraw.Draw(img)


def save(img: Image.Image, name: str) -> None:
    os.makedirs(TEXTURES_DIR, exist_ok=True)
    path = os.path.join(TEXTURES_DIR, name)
    img.resize((OUT, OUT), Image.NEAREST).save(path)
    print("wrote", os.path.abspath(path))


def tokun_face() -> None:
    """サングラス＋大きな笑顔。ぽっちゃり頬の陰影。帽子と髪は3D形状側。"""
    img, d = canvas(SKIN)
    # ぽっちゃり頬の陰影
    d.rectangle((8, 40, 20, 46), fill=SKIN_SHADE)
    d.rectangle((43, 40, 55, 46), fill=SKIN_SHADE)
    # サングラス（大きめの角丸レンズ＋黒フレーム＋ブリッジ）
    for x0 in (10, 36):
        d.rectangle((x0, 18, x0 + 17, 30), fill=BLACK)
        d.rectangle((x0 + 1, 19, x0 + 16, 29), fill=SUNGLASS)
    d.rectangle((27, 22, 36, 24), fill=BLACK)  # ブリッジ
    # 開いた大きな笑顔＋赤い舌
    d.rectangle((22, 40, 41, 50), fill=BLACK)
    d.rectangle((23, 41, 40, 44), fill=(0x30, 0x20, 0x20))
    d.rectangle((26, 46, 37, 50), fill=RED)
    save(img, "tokun_face_albedo.png")


def _aloha_pattern(d: ImageDraw.ImageDraw) -> None:
    # 白い波
    for y in (10, 30, 50):
        for x in range(0, GRID, 16):
            d.arc((x, y - 4, x + 16, y + 6), 200, 340, fill=ALOHA_WHITE, width=3)
    # オレンジのハイビスカス（十字ブロック花）
    for (fx, fy) in ((8, 18), (40, 8), (24, 38), (52, 42), (12, 54)):
        d.rectangle((fx - 2, fy - 5, fx + 2, fy + 5), fill=ALOHA_ORANGE)
        d.rectangle((fx - 5, fy - 2, fx + 5, fy + 2), fill=ALOHA_ORANGE)
        d.rectangle((fx - 1, fy - 1, fx + 1, fy + 1), fill=(0xFF, 0xD9, 0x86))
    # 緑の葉
    for (lx, ly) in ((20, 14), (50, 22), (34, 54), (4, 36), (58, 56)):
        d.rectangle((lx - 4, ly - 2, lx + 4, ly + 2), fill=ALOHA_GREEN)
        d.rectangle((lx - 2, ly - 4, lx + 2, ly + 4), fill=ALOHA_GREEN)


def tokun_aloha_front() -> None:
    """ミント地のアロハ前面。開襟＋レイの下に見える柄。文字なし。"""
    img, d = canvas(ALOHA_MINT)
    _aloha_pattern(d)
    # 開襟（V字の襟＋肌色の首元）
    d.polygon(((24, 0), (39, 0), (32, 14)), fill=SKIN)
    d.polygon(((20, 0), (26, 0), (33, 15), (28, 18)), fill=(0x74, 0xC4, 0xA4))
    d.polygon(((37, 0), (43, 0), (35, 18), (30, 15)), fill=(0x74, 0xC4, 0xA4))
    # ボタン
    for y in (24, 36, 48):
        d.rectangle((31, y, 32, y + 1), fill=(0x5A, 0x46, 0x2A))
    save(img, "tokun_aloha_front_albedo.png")


def tokun_aloha_back() -> None:
    img, d = canvas(ALOHA_MINT)
    _aloha_pattern(d)
    # 背面の襟
    d.rectangle((22, 0, 41, 3), fill=(0x74, 0xC4, 0xA4))
    save(img, "tokun_aloha_back_albedo.png")


def yotan_face() -> None:
    """黒縁の丸サングラス（紫レンズ）＋大笑いの口。金髪は3D形状側。"""
    img, d = canvas(SKIN)
    # 丸サングラス
    for cx in (19, 45):
        d.ellipse((cx - 9, 16, cx + 9, 34), fill=BLACK)
        d.ellipse((cx - 7, 18, cx + 7, 32), fill=(0x4A, 0x38, 0x66))
    d.rectangle((27, 23, 36, 25), fill=BLACK)  # ブリッジ
    # 大笑いの開いた口（上の歯）
    d.rectangle((22, 42, 41, 52), fill=BLACK)
    d.rectangle((24, 43, 39, 44), fill=WHITE)
    save(img, "yotan_face_albedo.png")


def yotan_jacket_front() -> None:
    """黒レザーのライダース前面。銀ジッパー・ラペル・スタッズ。文字なし。"""
    img, d = canvas(LEATHER)
    # 内側の黒Tシャツ（開いた前立ての奥）
    d.polygon(((26, 0), (37, 0), (34, 20), (29, 20)), fill=(0x0E, 0x0E, 0x10))
    # ラペル（斜めの折り返し）
    d.polygon(((14, 0), (27, 0), (30, 20), (18, 10)), fill=LEATHER_SEAM)
    d.polygon(((36, 0), (49, 0), (45, 10), (33, 20)), fill=LEATHER_SEAM)
    # 銀のネックレス
    d.arc((26, 4, 37, 18), 20, 160, fill=ZIPPER, width=1)
    # メインジッパー（点線）
    for y in range(20, 62, 3):
        d.rectangle((31, y, 32, y + 1), fill=ZIPPER)
    # 胸ポケットのジッパー
    for x in range(38, 52, 3):
        d.rectangle((x, 30, x + 1, 31), fill=ZIPPER)
    # ラペルのスタッズ
    for (sx, sy) in ((17, 4), (22, 8), (46, 4), (41, 8)):
        d.rectangle((sx, sy, sx + 1, sy + 1), fill=ZIPPER)
    # 裾のベルトバックル
    d.rectangle((0, 58, 63, 63), fill=LEATHER_SEAM)
    d.rectangle((44, 59, 50, 62), fill=ZIPPER)
    d.rectangle((46, 60, 48, 61), fill=LEATHER)
    save(img, "yotan_jacket_front_albedo.png")


def yotan_jacket_back() -> None:
    """背面はプレーンなレザーにヨーク切替とセンターシーム。"""
    img, d = canvas(LEATHER)
    d.line((0, 14, 63, 14), fill=LEATHER_SEAM, width=2)  # ヨーク
    d.line((31, 14, 31, 63), fill=LEATHER_SEAM, width=2)  # センターシーム
    d.rectangle((0, 58, 63, 63), fill=LEATHER_SEAM)      # 裾ベルト
    save(img, "yotan_jacket_back_albedo.png")


def fukuchan_face() -> None:
    """にこにこの目＋笑顔＋ピンクの頬。黒髪センターパートは3D形状側。"""
    img, d = canvas(SKIN)
    # にこにこの目（下向きアーチ）
    for cx in (20, 44):
        d.arc((cx - 6, 20, cx + 6, 30), 200, 340, fill=BLACK, width=3)
    # ピンクの頬（ギュンギュン）
    d.rectangle((8, 34, 16, 39), fill=PINK_CHEEK)
    d.rectangle((47, 34, 55, 39), fill=PINK_CHEEK)
    # 笑顔の口
    d.arc((24, 36, 39, 48), 20, 160, fill=BLACK, width=3)
    save(img, "fukuchan_face_albedo.png")


def fukuchan_outfit_front() -> None:
    """紺コートの前開き＋白Tシャツ＋モノクログラフィック＋SPONSORストラップ＋名札。

    名札とストラップは形と色のみで表現し、文字は描かない（テクスチャ内文字は禁止）。
    """
    img, d = canvas(COAT_NAVY)
    # 白Tシャツ（コートの前開き）
    d.polygon(((18, 0), (45, 0), (48, 63), (15, 63)), fill=WHITE)
    # コートのラペル
    d.polygon(((12, 0), (22, 0), (18, 63), (10, 63)), fill=(0x2B, 0x31, 0x3F))
    d.polygon(((41, 0), (51, 0), (53, 63), (45, 63)), fill=(0x2B, 0x31, 0x3F))
    # Tシャツのモノクログラフィック（抽象的なコミック調ブロック）
    d.rectangle((26, 26, 38, 34), fill=DARK_GRAY)
    d.rectangle((28, 28, 36, 32), fill=WHITE)
    d.rectangle((24, 38, 30, 44), fill=(0x6A, 0x6A, 0x6A))
    d.rectangle((34, 40, 41, 43), fill=DARK_GRAY)
    d.rectangle((27, 48, 37, 50), fill=(0x6A, 0x6A, 0x6A))
    d.rectangle((22, 20, 25, 23), fill=DARK_GRAY)
    d.rectangle((38, 18, 42, 21), fill=(0x6A, 0x6A, 0x6A))
    # SPONSORストラップ（青のV字）
    d.line((22, 0, 31, 14), fill=STRAP_BLUE, width=3)
    d.line((41, 0, 32, 14), fill=STRAP_BLUE, width=3)
    # 名札（白地＋赤枠＋赤いアクセントバー、文字なし）
    d.rectangle((26, 13, 38, 22), fill=WHITE)
    d.rectangle((26, 13, 38, 22), outline=TAG_RED, width=1)
    d.rectangle((28, 15, 36, 17), fill=TAG_RED)
    save(img, "fukuchan_outfit_front_albedo.png")


def okayaman_screen() -> None:
    """大型スクリーンのリモート出演画面。穏やかな笑顔のバストアップ＋LIVEドット。

    NG変更（穏やかな笑顔・リモート出演スタイル）をテクスチャで固定する。文字なし。
    """
    img, d = canvas(SCREEN_BG)
    # 黒いフード付きジャケットの肩
    d.polygon(((0, 63), (0, 50), (14, 42), (49, 42), (63, 50), (63, 63)), fill=HOODIE)
    # フードの襟
    d.polygon(((17, 42), (46, 42), (41, 50), (22, 50)), fill=(0x24, 0x24, 0x28))
    # 首
    d.rectangle((28, 38, 35, 44), fill=SKIN_SHADE)
    # 顔
    d.rectangle((20, 12, 43, 40), fill=SKIN)
    d.rectangle((19, 16, 44, 36), fill=SKIN)
    # 黒髪ミディアム（前髪＋サイド）
    d.rectangle((17, 6, 46, 15), fill=OKA_HAIR)
    d.rectangle((17, 12, 20, 30), fill=OKA_HAIR)
    d.rectangle((43, 12, 46, 30), fill=OKA_HAIR)
    for (bx0, bx1) in ((20, 25), (27, 31), (33, 37), (39, 43)):
        d.rectangle((bx0, 14, bx1, 17), fill=OKA_HAIR)
    # 穏やかな閉じ目の笑顔（下向きアーチ）
    for cx in (26, 38):
        d.arc((cx - 4, 21, cx + 4, 27), 200, 340, fill=BLACK, width=2)
    # 口ひげ・笑顔・あごひげ
    d.rectangle((27, 30, 36, 31), fill=BEARD)
    d.arc((27, 29, 36, 35), 20, 160, fill=BLACK, width=1)
    d.rectangle((29, 35, 34, 37), fill=BEARD)
    # LIVEインジケータ（赤ドット＋白バー、文字なし）
    d.ellipse((4, 4, 8, 8), fill=LIVE_RED)
    d.rectangle((10, 5, 18, 7), fill=WHITE)
    save(img, "okayaman_screen_albedo.png")


def yumemin_face() -> None:
    """青地に黒い点目のみ。鼻・耳・白いお尻は3D形状側。"""
    img, d = canvas(YUME_BLUE)
    d.ellipse((16, 26, 24, 34), fill=BLACK)
    d.ellipse((39, 26, 47, 34), fill=BLACK)
    save(img, "yumemin_face_albedo.png")


def main() -> None:
    tokun_face()
    tokun_aloha_front()
    tokun_aloha_back()
    yotan_face()
    yotan_jacket_front()
    yotan_jacket_back()
    fukuchan_face()
    fukuchan_outfit_front()
    okayaman_screen()
    yumemin_face()


if __name__ == "__main__":
    main()
