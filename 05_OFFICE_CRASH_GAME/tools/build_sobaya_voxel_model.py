"""Build the intentionally blocky Sobaya character used by the web game.

Run with Blender:
  blender --background --python tools/build_sobaya_voxel_model.py -- \
    --mask-texture model_source/textures/sobaya_mask_albedo_voxel.png \
    --output-glb public/models/sobaya.glb \
    --output-blend model_source/sobaya_voxel_master.blend \
    --preview model_source/sobaya_voxel_preview.png
"""

from __future__ import annotations

import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from voxel_character_kit import (  # noqa: E402
    RigGroup,
    VoxelRigDefinition,
    add_box,
    add_empty,
    build_voxel_rig,
    ensure_parent,
    make_material,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mask-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def make_texture_material(name: str, path: str) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.48
    image = bpy.data.images.load(os.path.abspath(path), check_existing=True)
    image.name = "SobayaVoxelMask_Albedo"
    image.colorspace_settings.name = "sRGB"
    image.pack()
    texture = mat.node_tree.nodes.new("ShaderNodeTexImage")
    texture.name = "SobayaVoxelMask_Texture"
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    mat.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def add_mask_panel(
    root: bpy.types.Object,
    edge_mat: bpy.types.Material,
    surface_mat: bpy.types.Material,
) -> bpy.types.Object:
    width, depth, height = 0.56, 0.07, 0.64
    panel = add_box(
        "SobayaVoxel_Mask",
        (0.0, -0.326, 1.85),
        (width, depth, height),
        edge_mat,
        parent=root,
    )
    panel.data.materials.append(surface_mat)
    uv_layer = panel.data.uv_layers.active or panel.data.uv_layers.new(name="SobayaVoxelMaskUV")
    for polygon in panel.data.polygons:
        if polygon.normal.y < -0.9:
            polygon.material_index = 1
            for loop_index in polygon.loop_indices:
                vertex = panel.data.vertices[panel.data.loops[loop_index].vertex_index].co
                uv_layer.data[loop_index].uv = (
                    0.5 + vertex.x / width,
                    0.5 + vertex.z / height,
                )
    return panel


def add_hair(root: bpy.types.Object, dark: bpy.types.Material) -> None:
    # A deliberately chunky cap with an uneven pixel-art fringe.
    add_box("SobayaVoxel_HairCap", (0.0, 0.01, 2.13), (0.66, 0.55, 0.18), dark, parent=root)
    for index, x in enumerate((-0.27, -0.135, 0.0, 0.135, 0.27)):
        height = 0.13 + (index % 3) * 0.035
        add_box(
            f"SobayaVoxel_HairTop_{index}",
            (x, -0.01 + (index % 2) * 0.035, 2.25 + height * 0.3),
            (0.12, 0.15, height),
            dark,
            parent=root,
        )
    for index, (x, height) in enumerate(((-0.24, 0.16), (-0.08, 0.20), (0.08, 0.17), (0.24, 0.14))):
        add_box(
            f"SobayaVoxel_Fringe_{index}",
            (x, -0.302, 2.08 - height * 0.25),
            (0.14, 0.08, height),
            dark,
            parent=root,
        )


def add_mug(
    root: bpy.types.Object,
    amber: bpy.types.Material,
    foam: bpy.types.Material,
    glass: bpy.types.Material,
    edge: bpy.types.Material,
) -> None:
    center = Vector((0.82, -0.16, 0.86))
    add_box("SobayaVoxel_MugBeer", tuple(center), (0.27, 0.24, 0.36), amber, parent=root)
    add_box(
        "SobayaVoxel_MugBeerFront",
        tuple(center + Vector((0.0, -0.137, -0.015))),
        (0.25, 0.022, 0.31),
        amber,
        parent=root,
    )
    # Glass is expressed as corner rails so the amber beer stays readable.
    for x in (-0.155, 0.155):
        add_box("SobayaVoxel_MugRail", tuple(center + Vector((x, 0.0, 0.0))), (0.035, 0.28, 0.42), glass, parent=root)
    for y in (-0.14, 0.14):
        add_box("SobayaVoxel_MugRail", tuple(center + Vector((0.0, y, 0.0))), (0.31, 0.035, 0.42), glass, parent=root)
    add_box("SobayaVoxel_MugBase", tuple(center + Vector((0.0, 0.0, -0.205))), (0.34, 0.28, 0.045), edge, parent=root)
    for index, (x, y, z) in enumerate(((-0.09, -0.06, 0.205), (0.0, -0.05, 0.22), (0.09, -0.04, 0.20), (-0.045, 0.055, 0.215), (0.055, 0.06, 0.225))):
        add_box(
            f"SobayaVoxel_Foam_{index}",
            tuple(center + Vector((x, y, z))),
            (0.095, 0.095, 0.08 + (index % 2) * 0.025),
            foam,
            parent=root,
            bevel=0.012,
        )
    # Square C-shaped handle.
    add_box("SobayaVoxel_MugHandleTop", tuple(center + Vector((0.215, 0.0, 0.10))), (0.16, 0.07, 0.06), glass, parent=root)
    add_box("SobayaVoxel_MugHandleSide", tuple(center + Vector((0.28, 0.0, 0.0))), (0.06, 0.07, 0.25), glass, parent=root)
    add_box("SobayaVoxel_MugHandleBottom", tuple(center + Vector((0.215, 0.0, -0.10))), (0.16, 0.07, 0.06), glass, parent=root)


def build_character(mask_texture: str) -> bpy.types.Object:
    white = make_material("SobayaVoxel_Shirt", (0.94, 0.95, 0.93, 1.0), roughness=0.9)
    shirt_shadow = make_material("SobayaVoxel_ShirtShadow", (0.68, 0.72, 0.73, 1.0), roughness=0.9)
    skin = make_material("SobayaVoxel_Skin", (0.32, 0.37, 0.39, 1.0), roughness=0.82)
    skin_light = make_material("SobayaVoxel_SkinLight", (0.43, 0.48, 0.50, 1.0), roughness=0.82)
    pants = make_material("SobayaVoxel_LongPants", (0.045, 0.055, 0.065, 1.0), roughness=0.86)
    shoes = make_material("SobayaVoxel_Shoes", (0.012, 0.018, 0.023, 1.0), roughness=0.75)
    hair = make_material("SobayaVoxel_Hair", (0.008, 0.012, 0.018, 1.0), roughness=0.62)
    mask_edge = make_material("SobayaVoxel_MaskEdge", (0.53, 0.57, 0.58, 1.0), roughness=0.64)
    mask_surface = make_texture_material("SobayaVoxel_MaskSurface", mask_texture)
    amber = make_material(
        "SobayaVoxel_Beer",
        (0.96, 0.25, 0.006, 1.0),
        roughness=0.25,
        emission=(0.72, 0.075, 0.001, 1.0),
        emission_strength=0.45,
    )
    foam = make_material("SobayaVoxel_Foam", (1.0, 0.97, 0.83, 1.0), roughness=0.92)
    glass = make_material("SobayaVoxel_Glass", (0.68, 0.86, 0.92, 0.28), roughness=0.2, metallic=0.05)

    root = add_empty("SobayaVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Sobaya"
    root["style"] = "intentional blocky voxel caricature"
    root["mask_workflow"] = "single mesh with replaceable albedo texture"

    # Shoes and full-length pants. The trouser blocks run cleanly from the
    # waistband to the shoe tops so no sock or bare-leg band remains visible.
    for side in (-1, 1):
        x = side * 0.235
        add_box(f"SobayaVoxel_Shoe_{side}", (x, -0.09, 0.105), (0.34, 0.48, 0.21), shoes, parent=root, bevel=0.018)
        add_box(f"SobayaVoxel_PantsLeg_{side}", (x, 0.0, 0.56), (0.38, 0.43, 0.70), pants, parent=root)
    add_box("SobayaVoxel_Waist", (0.0, 0.0, 0.91), (0.82, 0.45, 0.22), pants, parent=root)

    # An exaggerated barrel torso reads clearly from the game's fixed camera.
    add_box("SobayaVoxel_Torso", (0.0, 0.0, 1.29), (0.94, 0.50, 0.70), white, parent=root, bevel=0.035)
    add_box("SobayaVoxel_Collar", (0.0, -0.235, 1.58), (0.42, 0.055, 0.10), shirt_shadow, parent=root)

    # Mug arm on +X: straight and heavy.
    add_box("SobayaVoxel_Sleeve_Mug", (0.56, 0.0, 1.48), (0.30, 0.43, 0.34), white, parent=root, bevel=0.018)
    add_box("SobayaVoxel_UpperArm_Mug", (0.62, 0.0, 1.25), (0.24, 0.30, 0.36), skin_light, parent=root)
    add_box("SobayaVoxel_Forearm_Mug", (0.68, -0.05, 1.01), (0.24, 0.28, 0.31), skin, parent=root)
    add_box("SobayaVoxel_Hand_Mug", (0.71, -0.11, 0.84), (0.27, 0.28, 0.22), skin_light, parent=root, bevel=0.02)

    # Free arm on -X: forearm extends toward the viewer like a poised smash.
    add_box("SobayaVoxel_Sleeve_Free", (-0.56, 0.0, 1.48), (0.30, 0.43, 0.34), white, parent=root, bevel=0.018)
    add_box("SobayaVoxel_UpperArm_Free", (-0.63, 0.0, 1.25), (0.24, 0.30, 0.36), skin_light, parent=root)
    add_box("SobayaVoxel_Forearm_Free", (-0.66, -0.21, 1.11), (0.24, 0.48, 0.22), skin, parent=root)
    add_box("SobayaVoxel_Fist_Free", (-0.66, -0.48, 1.11), (0.30, 0.29, 0.28), skin_light, parent=root, bevel=0.025)
    for index, x in enumerate((-0.74, -0.66, -0.58)):
        add_box(f"SobayaVoxel_Knuckle_{index}", (x, -0.64, 1.13), (0.065, 0.075, 0.075), skin, parent=root)

    # Oversized cube head and interchangeable mask panel.
    add_box("SobayaVoxel_Neck", (0.0, 0.0, 1.64), (0.34, 0.34, 0.28), skin, parent=root)
    add_box("SobayaVoxel_Head", (0.0, 0.0, 1.86), (0.65, 0.58, 0.66), skin, parent=root, bevel=0.025)
    for side in (-1, 1):
        add_box(f"SobayaVoxel_Ear_{side}", (side * 0.35, -0.02, 1.87), (0.09, 0.19, 0.20), skin_light, parent=root)
    add_mask_panel(root, mask_edge, mask_surface)
    add_hair(root, hair)
    add_mug(root, amber, foam, glass, mask_edge)

    # The standard rigid-part contract is shared by all game characters.
    # Character-specific mesh names stay here; Three.js only sees VoxelRig_*.
    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup(
                (0.56, 0.0, 1.55),
                (
                    "SobayaVoxel_Sleeve_Mug",
                    "SobayaVoxel_UpperArm_Mug",
                    "SobayaVoxel_Forearm_Mug",
                    "SobayaVoxel_Hand_Mug",
                    "SobayaVoxel_Mug",
                    "SobayaVoxel_Foam",
                ),
            ),
            secondary_arm=RigGroup(
                (-0.56, 0.0, 1.55),
                (
                    "SobayaVoxel_Sleeve_Free",
                    "SobayaVoxel_UpperArm_Free",
                    "SobayaVoxel_Forearm_Free",
                    "SobayaVoxel_Fist_Free",
                    "SobayaVoxel_Knuckle",
                ),
            ),
            left_leg=RigGroup(
                (-0.235, 0.0, 0.94),
                ("SobayaVoxel_PantsLeg_-1", "SobayaVoxel_Shoe_-1"),
            ),
            right_leg=RigGroup(
                (0.235, 0.0, 0.94),
                ("SobayaVoxel_PantsLeg_1", "SobayaVoxel_Shoe_1"),
            ),
            primary_hand_socket_local=(0.15, -0.11, -0.71),
        ),
    )

    # A tiny whole-character idle bob keeps the asset animation-ready without
    # depending on a complex deformation rig.
    root.animation_data_create()
    action = bpy.data.actions.new("Idle")
    root.animation_data.action = action
    for frame, height in ((1, 0.0), (15, 0.018), (30, 0.0)):
        root.location.z = height
        root.keyframe_insert(data_path="location", frame=frame)
    action.frame_start = 1
    action.frame_end = 30
    action.use_fake_user = True
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 30
    bpy.context.scene.frame_set(1)
    return root


def setup_preview(preview_path: str) -> None:
    ground_mat = make_material("PreviewGround", (0.055, 0.07, 0.082, 1.0), roughness=0.95)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0.0, 0.0, -0.012))
    ground = bpy.context.active_object
    ground.name = "Preview_Ground"
    ground.data.materials.append(ground_mat)

    bpy.ops.object.light_add(type="AREA", location=(-2.7, -3.6, 4.4))
    key = bpy.context.active_object
    key.name = "Preview_Key"
    key.data.energy = 1050
    key.data.shape = "DISK"
    key.data.size = 3.2
    key.data.color = (1.0, 0.78, 0.60)

    bpy.ops.object.light_add(type="AREA", location=(2.8, -1.6, 2.8))
    fill = bpy.context.active_object
    fill.name = "Preview_Fill"
    fill.data.energy = 780
    fill.data.size = 2.5
    fill.data.color = (0.42, 0.70, 1.0)

    bpy.ops.object.light_add(type="AREA", location=(0.0, 2.0, 4.0))
    rim = bpy.context.active_object
    rim.name = "Preview_Rim"
    rim.data.energy = 900
    rim.data.size = 2.0
    rim.data.color = (0.75, 0.90, 1.0)

    bpy.ops.object.camera_add(location=(2.6, -4.7, 2.65))
    camera = bpy.context.active_object
    camera.name = "Preview_Camera"
    target = Vector((0.0, 0.0, 1.1))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 60
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    engine_ids = {item.identifier for item in scene.bl_rna.properties["render"].fixed_type.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engine_ids else "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = preview_path
    if scene.world is None:
        scene.world = bpy.data.worlds.new("SobayaVoxel_PreviewWorld")
    scene.world.color = (0.012, 0.018, 0.027)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def remove_preview_objects() -> None:
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith("Preview_"):
            bpy.data.objects.remove(obj, do_unlink=True)


def main() -> None:
    args = parse_args()
    for path in (args.output_glb, args.output_blend, args.preview):
        ensure_parent(path)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_character(args.mask_texture)
    setup_preview(os.path.abspath(args.preview))
    remove_preview_objects()
    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.output_blend))
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(args.output_glb),
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_materials="EXPORT",
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )
    print("SOBAYA_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))
    print("SOBAYA_VOXEL_MASTER", os.path.abspath(args.output_blend))
    print("SOBAYA_VOXEL_PREVIEW", os.path.abspath(args.preview))


if __name__ == "__main__":
    main()
