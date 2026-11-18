#!/usr/bin/env python3
"""Draw the game HUD (そば屋無双 style) as a transparent PNG sequence for the assembled gameplay video.

The layout copies the real game's UI (12_SOBAYA_MUSOU_GODOT/main.gd _build_ui): top-left panel with the name,
体力 / 無双 bars and the gauge caption; top-right 撃破 count + timer; top-center objective; right-center combo;
center banners; bottom-center boss name + bar. Font: 04_GAME_ASSETS/fonts/MPLUSRounded1c-ExtraBold.ttf (OFL).

The numbers are a plausible game timeline written by hand (EVENTS below), not counted from the video:
health drops at each chapter's approved hit moment, the musou gauge empties during the musou attack, KOs come in
bursts at combos and area attacks, and boss bars empty when the boss goes down.

usage: <python with Pillow> make_hud.py <out_dir> [--fps 24] [--w 1920 --h 1080]
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONT = str(ROOT / "04_GAME_ASSETS/fonts/MPLUSRounded1c-ExtraBold.ttf")
FPS, W, H = 24, 1920, 1080
S = H / 900.0  # the game UI is laid out for 1600x900

CH = 15.0833  # one chapter
CH6 = CH - 3.9  # ch6 is trimmed (its first 3.9 s turned the camera to the front)

# chapter: start offset, length, stage name for the banner, objective, KO events, hits taken, musou, boss
CHAPTERS = [
    dict(len=CH, stage=1, zone="正門ヤード", banner="STAGE 1　正門ヤード", quota=30,
         kos=[(2.4, 1), (2.9, 1), (3.4, 2), (4.1, 1), (4.6, 2), (5.3, 1), (7.2, 7), (11.3, 1), (11.9, 2), (12.6, 1), (13.3, 2), (14.2, 1)],
         hits=[(6.0, 0.12)], musou=None, boss=None, after="正門ヤード 制圧！"),
    dict(len=CH, stage=1, zone="製造ライン", banner="製造ライン", quota=0,
         kos=[(0.8, 1), (1.5, 1), (2.2, 2), (3.0, 1), (7.6, 3), (8.3, 4), (9.1, 4), (10.0, 2)],
         hits=[(4.0, 0.18)], musou=(7.0, 3.2), boss=("警部", 1.0, [(9.6, 0.0)]), boss_ko=10.2,
         after_obj="製造ラインのできたてビールを奪え！"),
    dict(len=CH, stage=2, zone="麻布十番商店街", banner="STAGE 2　麻布十番商店街", quota=46,
         kos=[(3.3, 1), (3.9, 1), (4.5, 2), (5.2, 1), (5.9, 1), (8.2, 7), (12.3, 1), (12.9, 2), (13.6, 1), (14.4, 1)],
         hits=[(7.0, 0.12)], musou=None, boss=None, after="麻布十番商店街 制圧！"),
    dict(len=CH, stage=2, zone="本社前広場", banner="本社前広場", quota=0,
         kos=[(0.9, 1), (1.6, 2), (2.4, 1), (3.1, 1), (8.2, 6), (13.0, 1)],
         hits=[(4.0, 0.15)], musou=None, boss=("機動隊長", 1.0, [(5.5, 0.85), (8.2, 0.0)]), boss_ko=8.6,
         after_obj="本社ビルに入館せよ！"),
    dict(len=CH, stage=3, zone="1F エントランスロビー", banner="STAGE 3　1F エントランスロビー", quota=32,
         kos=[(3.2, 1), (3.8, 1), (4.4, 2), (5.1, 1), (5.8, 1), (8.2, 7), (12.2, 1), (12.8, 2), (13.5, 1), (14.3, 1)],
         hits=[(7.0, 0.10)], musou=None, boss=None, after="1F エントランスロビー 制圧！"),
    dict(len=CH6, stage=3, zone="窓際族エリア", banner="窓際族エリア", quota=0,
         kos=[(0.3, 3), (0.8, 4), (1.3, 3), (5.0, 1)],
         hits=[(3.1, 0.20)], musou=(-1.5, 3.2), boss=("警備本部長", 0.9, [(4.0, 0.6), (4.6, 0.3), (5.3, 0.0)]), boss_ko=5.4,
         after_obj="立ち飲み処にビールを納品せよ！", win=8.4),
]


def font(px: float) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, int(px * S))


F = {k: font(v) for k, v in {"name": 26, "cap": 20, "small": 18, "ko": 40, "time": 20, "obj": 26, "combo": 64,
                              "banner": 76, "boss": 24}.items()}


def text(d: ImageDraw.ImageDraw, xy, s, f, fill, anchor="la", outline=0):
    d.text(xy, s, font=f, fill=fill, anchor=anchor, stroke_width=int(outline * S / 2),
           stroke_fill=(26, 13, 5, 230) if outline else None)


def bar(d, x, y, w, h, v, color):
    r = int(6 * S)
    d.rounded_rectangle([x, y, x + w, y + h], r, fill=(255, 255, 255, 38))
    if v > 0.005:
        d.rounded_rectangle([x, y, x + max(w * v, 2 * r), y + h], r, fill=color)


def panel(d, box):
    d.rounded_rectangle(box, int(12 * S), fill=(15, 13, 10, 178))


def build_timeline():
    """Precompute per-chapter state functions."""
    t0 = 0.0
    out = []
    stage_ko = {}
    for c in CHAPTERS:
        c = dict(c)
        c["t0"] = t0
        c["ko_base"] = stage_ko.get(c["stage"], 0)
        stage_ko[c["stage"]] = c["ko_base"] + sum(n for _, n in c["kos"])
        out.append(c)
        t0 += c["len"]
    return out, t0


def state(c, lt):
    hp = 1.0 - sum(dmg for tt, dmg in c["hits"] if lt >= tt)
    hit_flash = max((0.35 - (lt - tt)) / 0.35 for tt, _ in c["hits"]) if any(0 <= lt - tt < 0.35 for tt, _ in c["hits"]) else 0.0
    kos = sum(n for tt, n in c["kos"] if lt >= tt)
    # combo: KO-driven hit counter that resets after 2.6 s without hits or when Sobaya is hit
    combo, last = 0, -9.0
    for tt, n in c["kos"]:
        if tt > lt:
            break
        if tt - last > 2.6 or any(last < h <= tt for h, _ in c["hits"]):
            combo = 0
        combo += n * 2 + 1
        last = tt
    if lt - last > 2.6 or any(last < h <= lt for h, _ in c["hits"]):
        combo = 0
    # musou gauge: fills with KOs, empties over the musou duration
    m = min(1.0, 0.15 + kos * 0.06)
    ready = False
    if c["musou"]:
        ms, md = c["musou"]
        if lt < ms:
            m = min(1.0, 0.55 + lt / max(ms, 0.1) * 0.45)
            ready = m >= 0.999
        elif lt < ms + md:
            m = 1.0 - (lt - ms) / md
        else:
            m = min(1.0, (lt - ms - md) * 0.05 + sum(n for tt, n in c["kos"] if tt > ms + md and lt >= tt) * 0.05)
    boss = None
    if c["boss"]:
        name, start, pts = c["boss"]
        v = start
        for tt, val in pts:
            if lt >= tt:
                v = val
        if lt < c["boss_ko"] + 1.0:
            boss = (name, v)
    return hp, hit_flash, kos, combo, m, ready, boss


def draw_frame(chs, t):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = next(x for x in chs if x["t0"] <= t < x["t0"] + x["len"] + 1e-6)
    lt = t - c["t0"]
    hp, flash, kos, combo, m, ready, boss = state(c, lt)
    if flash > 0:  # red damage flash like the game's damage_flash
        img.paste(Image.new("RGBA", (W, H), (230, 26, 13, int(90 * flash))), (0, 0))
        d = ImageDraw.Draw(img)
    # top-left panel
    px, py = int(24 * S), int(20 * S)
    panel(d, [px, py, px + int(420 * S), py + int(158 * S)])
    x0 = px + int(14 * S)
    text(d, (x0, py + int(12 * S)), "そば屋", F["name"], (255, 230, 153))
    for i, (cap, v, col) in enumerate((("体力", hp, (89, 217, 89)), ("無双", m, (255, 179, 38)))):
        yy = py + int((56 + i * 32) * S)
        text(d, (x0, yy), cap, F["cap"], (255, 255, 255))
        if cap == "無双" and (ready or (c["musou"] and c["musou"][0] <= lt < sum(c["musou"]))):
            col = (255, 140 + int(60 * (1 + __import__("math").sin(t * 16)) / 2), 40)
        bar(d, x0 + int(58 * S), yy + int(4 * S), int(320 * S), int(20 * S), max(0.0, v), col)
    in_musou = c["musou"] and c["musou"][0] <= lt < sum(c["musou"])
    text(d, (x0, py + int(124 * S)), "無双乱舞 発動中！" if in_musou else "ジョッキのビール＝無双ゲージ",
         F["small"], (255, 217, 102))
    # top-right
    rx = W - int(24 * S)
    panel(d, [rx - int(236 * S), py, rx, py + int(92 * S)])
    text(d, (rx - int(14 * S), py + int(8 * S)), f"撃破 {c['ko_base'] + kos}", F["ko"], (255, 255, 255), "ra")
    total = t
    text(d, (rx - int(14 * S), py + int(62 * S)), f"{int(total) // 60}:{total % 60:04.1f}", F["time"], (217, 217, 217), "ra")
    # objective
    won = c.get("win") is not None and lt >= c["win"]
    if c.get("boss_ko") is not None and lt >= c["boss_ko"]:
        obj = c["after_obj"]
    elif c["boss"]:
        obj = f"【{c['zone']}】{c['boss'][0]}を倒せ！"
    else:
        rest = max(0, c["quota"] - (c["ko_base"] + kos))
        obj = f"【{c['zone']}】敵を蹴散らせ（残り {rest}）"
    if not won:
        text(d, (W // 2, int(36 * S)), obj, F["obj"], (255, 255, 255), "ma", outline=10)
    # combo
    if combo >= 3:
        text(d, (W - int(48 * S), H // 2), f"{combo} HIT", F["combo"], (255, 217, 77), "rm", outline=16)
    # banners
    banner = None
    if lt < 1.8:
        banner = c["banner"]
    if c["musou"] and 0 <= lt - c["musou"][0] < 1.4:
        banner = "ビール無双！"
    if c.get("boss_ko") is not None and 0 <= lt - c["boss_ko"] < 1.8:
        banner = f"{c['boss'][0]} 撃破！"
    if won:
        banner = "立ち飲み処、開店！"
    if banner:
        text(d, (W // 2, H // 2 - int(140 * S)), banner, F["banner"], (255, 235, 153), "mm", outline=20)
    # boss bar
    if boss:
        bw = int(560 * S)
        by = H - int(96 * S)
        text(d, (W // 2, by - int(32 * S)), boss[0], F["boss"], (255, 217, 102), "ma", outline=8)
        bar(d, W // 2 - bw // 2, by, bw, int(20 * S), boss[1], (230, 64, 51))
    return img


def main() -> None:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    chs, total = build_timeline()
    n = int(round(total * FPS))
    for i in range(n):
        draw_frame(chs, min(i / FPS, total - 1e-3)).save(out / f"hud_{i:05d}.png", compress_level=1)
        if i % 240 == 0:
            print(f"{i}/{n}", flush=True)
    print(f"wrote {n} frames ({total:.2f}s) to {out}")


if __name__ == "__main__":
    main()
