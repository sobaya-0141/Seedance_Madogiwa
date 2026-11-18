"""麻布十番: 赤い提灯（参考: 03_SCRIPTS/49_sobaya_musou_gameplay_target/props/azabu/lantern.png）

高さ約0.45m（吊り金具込み0.6m）。紙は少し発光させて、夕方に灯って見えるようにする。
blender --background --python azabu_lantern.py -- --out <dir>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import propkit as k  # noqa: E402

k.reset()
OUT = k.out_dir()

paper = k.mat("lantern_paper", (0.62, 0.05, 0.03), 0.8, emit=(1.0, 0.25, 0.08), emit_strength=0.6)
rib = k.mat("lantern_rib", (0.40, 0.03, 0.02), 0.7)
lacquer = k.mat("lacquer", (0.03, 0.03, 0.03), 0.25)
brass = k.mat("brass", (0.70, 0.52, 0.22), 0.35, 1.0)
cord = k.mat("cord", (0.35, 0.05, 0.04), 0.8)

R, H = 0.17, 0.34          # 胴の半径・高さ
z0 = 0.06                   # 下の輪の上端
cz = z0 + H / 2
k.sphere("body", R, (0, 0, cz), paper, scale=(1, 1, H / (2 * R) * 1.05), segs=40, rings=24)
# 竹ひご（横の筋）: 楕円体の表面に沿って細い輪を並べる
n = 13
for i in range(1, n):
    t = -1 + 2 * i / n
    z = cz + t * H / 2 * 1.02
    r = R * math.sqrt(max(0.0, 1 - t * t)) * 1.005
    if r > 0.03:
        k.torus(f"rib_{i}", r, 0.0035, (0, 0, z), rib, major=40, minor=6)
# 上下の黒い輪（漆）と金具
for z, nm in ((z0 - 0.015, "bottom"), (z0 + H + 0.015, "top")):
    k.cyl(f"ring_{nm}", 0.085, 0.05, (0, 0, z), lacquer, verts=32, bevel=0.006)
    k.torus(f"ring_{nm}_edge", 0.085, 0.006, (0, 0, z + (0.025 if nm == "top" else -0.025)), brass, major=32, minor=6)
k.cyl("cap_top", 0.03, 0.03, (0, 0, z0 + H + 0.055), brass, verts=16, bevel=0.005)
k.torus("hook_ring", 0.022, 0.004, (0, 0, z0 + H + 0.09), brass, rot=(math.pi / 2, 0, 0), major=20, minor=6)
k.cyl("cord", 0.004, 0.12, (0, 0, z0 + H + 0.17), cord, verts=8)

ob = k.join_all("lantern")
print("TRIS", k.tri_count(ob))
k.export_glb(os.path.join(OUT, "lantern.gltf"))
k.render_preview(os.path.join(OUT, "lantern_preview.png"), target_h=0.62, elev=-8.0, azim=-25.0)
