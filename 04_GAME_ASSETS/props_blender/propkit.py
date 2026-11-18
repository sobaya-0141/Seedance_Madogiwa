"""Blender で大道具を組み立てるための小さな道具箱（Claude が書く大道具スクリプトから import する）。

- 形: 箱・円柱・球をメートル単位で置き、角は Bevel で丸める（書き出し時に適用）
- 材質: 単色（色・粗さ・金属度）か、04_GAME_ASSETS/textures の CC0 PBR テクスチャ（木・漆喰・レンガ・金属）
- UV: テクスチャを使う物は、ワールド寸法に合わせた箱投影（1枚 = TEX_SCALE m）
- 書き出し: GLB（モディファイア適用・+Y up）と、確認用のレンダリング PNG

使い方: blender --background --python <大道具>.py -- --out <dir>
"""
from __future__ import annotations

import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TEX = os.path.join(ROOT, "04_GAME_ASSETS", "textures")
_mats: dict[str, bpy.types.Material] = {}


def reset() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def out_dir() -> str:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    d = argv[argv.index("--out") + 1] if "--out" in argv else os.getcwd()
    os.makedirs(d, exist_ok=True)
    return d


# ---------------------------------------------------------------- 材質

def mat(name: str, color=(0.8, 0.8, 0.8), rough=0.7, metal=0.0, emit=None, emit_strength=0.0, alpha=1.0) -> bpy.types.Material:
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1.0)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emit:
        p.inputs["Emission Color"].default_value = (*emit, 1.0)
        p.inputs["Emission Strength"].default_value = emit_strength
    if alpha < 1.0:
        p.inputs["Alpha"].default_value = alpha
        p.inputs["Transmission Weight"].default_value = 1.0
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "DITHERED"
        if hasattr(m, "blend_method"):
            m.blend_method = "BLEND"
    _mats[name] = m
    return m


def tex_mat(name: str, tex: str, rough_scale=1.0, tint=None) -> bpy.types.Material:
    """CC0 PBR テクスチャ（diff / nor_gl / arm）の材質。glTF にそのまま書き出せる配線にする"""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    base = os.path.join(TEX, tex, tex)
    diff = nt.nodes.new("ShaderNodeTexImage")
    diff.image = bpy.data.images.load(base + "_diff_2k.jpg", check_existing=True)
    if tint:
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        nt.links.new(diff.outputs["Color"], mix.inputs["A"])
        mix.inputs["B"].default_value = (*tint, 1.0)
        nt.links.new(mix.outputs["Result"], p.inputs["Base Color"])
    else:
        nt.links.new(diff.outputs["Color"], p.inputs["Base Color"])
    arm = nt.nodes.new("ShaderNodeTexImage")
    arm.image = bpy.data.images.load(base + "_arm_2k.jpg", check_existing=True)
    arm.image.colorspace_settings.name = "Non-Color"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(arm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], p.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], p.inputs["Metallic"])
    nor = nt.nodes.new("ShaderNodeTexImage")
    nor.image = bpy.data.images.load(base + "_nor_gl_2k.jpg", check_existing=True)
    nor.image.colorspace_settings.name = "Non-Color"
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(nor.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    _mats[name] = m
    return m


# ---------------------------------------------------------------- 形

def _finish(ob, material, bevel=0.0, segments=2, tex_scale=0.0):
    if material is not None:
        ob.data.materials.append(material)
    if bevel > 0:
        md = ob.modifiers.new("bevel", "BEVEL")
        md.width = bevel
        md.segments = segments
        md.limit_method = "ANGLE"
        md.harden_normals = False
    if tex_scale > 0:
        box_uv(ob, tex_scale)
    for f in ob.data.polygons:
        f.use_smooth = True
    ob.data.shade_smooth() if hasattr(ob.data, "shade_smooth") else None
    if hasattr(ob.data, "set_sharp_from_angle"):
        ob.data.set_sharp_from_angle(angle=math.radians(35))
    return ob


def box(name, size, loc, material=None, bevel=0.01, rot=(0, 0, 0), tex_scale=0.0, parent=None):
    """size = (x 幅, y 奥行き, z 高さ) [m]、loc = 中心"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if parent:
        ob.parent = parent
    return _finish(ob, material, bevel, 2, tex_scale)


def cyl(name, r, h, loc, material=None, verts=24, bevel=0.0, rot=(0, 0, 0), r2=None, tex_scale=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    return _finish(ob, material, bevel, 2, tex_scale)


def sphere(name, r, loc, material=None, scale=(1, 1, 1), segs=32, rings=16, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, radius=r, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(ob, material)


def torus(name, R, r, loc, material=None, rot=(0, 0, 0), major=32, minor=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=major, minor_segments=minor)
    ob = bpy.context.active_object
    ob.name = name
    return _finish(ob, material)


def scallop_cloth(name, width, drop, loc, material, n=8, depth=0.02, rot_z=0.0):
    """布の縁（波形のフリル）。width 方向に n 個の半円の垂れを持つ薄い板"""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    pts_top = []
    pts_bot = []
    steps = n * 8
    for i in range(steps + 1):
        x = -width / 2 + width * i / steps
        ph = (i % 8) / 8.0
        sag = drop * (0.55 + 0.45 * math.sin(math.pi * ph))
        pts_top.append(bm.verts.new((x, 0, 0)))
        pts_bot.append(bm.verts.new((x, 0, -sag)))
    for i in range(steps):
        bm.faces.new((pts_top[i], pts_top[i + 1], pts_bot[i + 1], pts_bot[i]))
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (0, 0, rot_z)
    sol = ob.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = depth
    return _finish(ob, material)


def box_uv(ob, scale):
    """ワールド寸法の箱投影 UV（1枚 = scale m）"""
    me = ob.data
    if not me.uv_layers:
        me.uv_layers.new()
    uv = me.uv_layers.active.data
    mw = ob.matrix_world
    for poly in me.polygons:
        n = poly.normal
        ax = max(range(3), key=lambda k: abs(n[k]))
        for li in poly.loop_indices:
            co = mw @ me.vertices[me.loops[li].vertex_index].co
            a, b = [(1, 2), (0, 2), (0, 1)][ax]
            uv[li].uv = (co[a] / scale, co[b] / scale)


# ---------------------------------------------------------------- 書き出し・確認

def join_all(name: str) -> bpy.types.Object:
    obs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for o in obs:
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    ob.name = name
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    return ob


def tri_count(ob) -> int:
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def export_glb(path: str) -> None:
    """glTF（.gltf＋.bin）で書き出す。テクスチャは同じフォルダの textures/ に元のファイル名で置き、
    大道具どうしで共有する（GLB に埋め込むと1点ごとに 2K テクスチャが複製されて重くなるため）"""
    path = os.path.splitext(path)[0] + ".gltf"
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLTF_SEPARATE", export_apply=True, export_yup=True,
                              export_texture_dir="textures", export_image_format="AUTO", export_keep_originals=False)


def render_preview(path: str, target_h: float, dist=1.0, elev=22.0, azim=-35.0, size=900) -> None:
    """斜め前・少し上から、明るい灰色の背景で撮る（参考画像と見比べる用）"""
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x = size
    sc.render.resolution_y = size
    sc.render.film_transparent = False
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.62, 0.62, 0.64, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55
    sc.world = w
    ob_center = Vector((0, 0, target_h * 0.5))
    r = target_h * 2.2 * dist
    a, e = math.radians(azim), math.radians(elev)
    cam_loc = ob_center + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * r
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    cam.location = cam_loc
    d = ob_center - cam_loc
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 50
    sc.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 2.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
    sc.collection.objects.link(sun)
    fill = bpy.data.objects.new("fill", bpy.data.lights.new("fill", "AREA"))
    fill.data.energy = 150
    fill.data.size = 4
    fill.location = cam_loc + Vector((0, 0, target_h))
    fill.rotation_euler = cam.rotation_euler
    sc.collection.objects.link(fill)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def save(name: str, out: str, height: float, elev=18.0, azim=-35.0, preview=True) -> None:
    """いま組み立てた物を1つにまとめて GLB（と確認用 PNG）に書き出し、場面を空にする"""
    ob = join_all(name)
    print("TRIS", name, tri_count(ob))
    export_glb(os.path.join(out, name + ".gltf"))
    if preview:
        render_preview(os.path.join(out, name + "_preview.png"), target_h=height, elev=elev, azim=azim, size=600)
    reset()


def plane_rows(name, items, material):
    """(size, loc) の箱を並べる小物（窓の桟など）"""
    for i, (s, l) in enumerate(items):
        box(f"{name}_{i}", s, l, material, bevel=0.0)
