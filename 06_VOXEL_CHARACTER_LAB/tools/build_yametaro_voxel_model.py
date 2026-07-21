"""Build Yametaro as a reusable chibi biped voxel character."""

from __future__ import annotations

import argparse
import os
import sys

import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from voxel_character_kit import (  # noqa: E402
    RigGroup,
    VoxelRigDefinition,
    add_box,
    add_empty,
    add_idle_animation,
    add_textured_front_panel,
    build_voxel_rig,
    ensure_parent,
    make_material,
    make_texture_material,
    save_and_export,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--face-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(face_texture: str) -> bpy.types.Object:
    skin = make_material("YametaroVoxel_Skin", (1.0, 0.71, 0.47, 1.0), roughness=0.9)
    skin_shadow = make_material("YametaroVoxel_SkinShadow", (0.88, 0.55, 0.36, 1.0), roughness=0.9)
    hair = make_material("YametaroVoxel_Hair", (0.012, 0.027, 0.034, 1.0), roughness=0.7)
    black = make_material("YametaroVoxel_Black", (0.005, 0.012, 0.016, 1.0), roughness=0.62)
    purple = make_material("YametaroVoxel_Shirt", (0.35, 0.27, 0.80, 1.0), roughness=0.88)
    purple_light = make_material("YametaroVoxel_Collar", (0.65, 0.61, 1.0, 1.0), roughness=0.9)
    pants = make_material("YametaroVoxel_Pants", (0.075, 0.09, 0.13, 1.0), roughness=0.86)
    shoes = make_material("YametaroVoxel_Shoes", (0.025, 0.035, 0.052, 1.0), roughness=0.78)
    face_surface = make_texture_material(
        "YametaroVoxel_FaceSurface",
        face_texture,
        image_name="YametaroVoxel_FaceAlbedo",
        roughness=0.72,
    )

    root = add_empty("YametaroVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Mushoku Yametaro"
    root["style"] = "large-head chibi voxel caricature"
    root["design_locks"] = "purple shirt,round glasses,black side-parted hair,chibi proportions"
    root["face_workflow"] = "replaceable front-panel albedo texture"

    # Short biped body below an intentionally oversized head.
    for side in (-1, 1):
        x = side * 0.19
        add_box(f"YametaroVoxel_Shoe_{side}", (x, -0.08, 0.10), (0.29, 0.40, 0.20), shoes, parent=root, bevel=0.025)
        add_box(f"YametaroVoxel_PantsLeg_{side}", (x, 0.0, 0.38), (0.30, 0.35, 0.42), pants, parent=root, bevel=0.015)
    add_box("YametaroVoxel_Waist", (0.0, 0.0, 0.64), (0.68, 0.39, 0.20), pants, parent=root, bevel=0.018)
    add_box("YametaroVoxel_Torso", (0.0, 0.0, 0.95), (0.76, 0.44, 0.54), purple, parent=root, bevel=0.055)
    add_box("YametaroVoxel_CollarLeft", (-0.13, -0.235, 1.15), (0.26, 0.04, 0.11), purple_light, rotation=(0.0, 0.0, -0.48), parent=root, bevel=0.012)
    add_box("YametaroVoxel_CollarRight", (0.13, -0.235, 1.15), (0.26, 0.04, 0.11), purple_light, rotation=(0.0, 0.0, 0.48), parent=root, bevel=0.012)
    add_box("YametaroVoxel_ShirtButton", (0.0, -0.245, 1.02), (0.065, 0.035, 0.065), black, parent=root, bevel=0.008)

    # Arms are deliberately simple so the shared smash reads cleanly.
    add_box("YametaroVoxel_PrimarySleeve", (0.48, 0.0, 1.02), (0.28, 0.38, 0.35), purple, parent=root, bevel=0.035)
    add_box("YametaroVoxel_PrimaryForearm", (0.54, -0.03, 0.78), (0.22, 0.27, 0.28), skin, parent=root, bevel=0.03)
    add_box("YametaroVoxel_PrimaryHand", (0.57, -0.08, 0.61), (0.25, 0.25, 0.22), skin_shadow, parent=root, bevel=0.05)
    add_box("YametaroVoxel_SecondarySleeve", (-0.48, 0.0, 1.02), (0.28, 0.38, 0.35), purple, parent=root, bevel=0.035)
    add_box("YametaroVoxel_SecondaryForearm", (-0.54, -0.03, 0.78), (0.22, 0.27, 0.28), skin, parent=root, bevel=0.03)
    add_box("YametaroVoxel_SecondaryHand", (-0.57, -0.08, 0.61), (0.25, 0.25, 0.22), skin_shadow, parent=root, bevel=0.05)

    # Large square head and side-parted hair frame replaceable 2D face artwork.
    add_box("YametaroVoxel_Head", (0.0, 0.0, 1.62), (1.00, 0.62, 0.84), skin, parent=root, bevel=0.115)
    for side in (-1, 1):
        add_box(f"YametaroVoxel_Ear_{side}", (side * 0.53, -0.01, 1.58), (0.13, 0.22, 0.24), skin_shadow, parent=root, bevel=0.045)
    add_box("YametaroVoxel_HairCap", (0.0, 0.01, 2.03), (1.02, 0.60, 0.23), hair, parent=root, bevel=0.055)
    add_box("YametaroVoxel_HairLeft", (-0.42, -0.01, 1.83), (0.19, 0.59, 0.45), hair, parent=root, bevel=0.035)
    add_box("YametaroVoxel_HairRight", (0.37, 0.02, 1.91), (0.27, 0.57, 0.31), hair, parent=root, bevel=0.035)
    add_box("YametaroVoxel_BangCenter", (-0.16, -0.325, 1.93), (0.32, 0.10, 0.32), hair, rotation=(0.0, 0.0, -0.26), parent=root, bevel=0.025)
    add_textured_front_panel(
        "YametaroVoxel_FacePanel",
        (0.0, -0.338, 1.56),
        (0.88, 0.045, 0.66),
        skin,
        face_surface,
        parent=root,
        uv_name="YametaroVoxelFaceUV",
    )

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.41, 0.0, 1.18), ("YametaroVoxel_Primary",)),
            secondary_arm=RigGroup((-0.41, 0.0, 1.18), ("YametaroVoxel_Secondary",)),
            left_leg=RigGroup((-0.19, 0.0, 0.68), ("YametaroVoxel_PantsLeg_-1", "YametaroVoxel_Shoe_-1")),
            right_leg=RigGroup((0.19, 0.0, 0.68), ("YametaroVoxel_PantsLeg_1", "YametaroVoxel_Shoe_1")),
            primary_hand_socket_local=(0.16, -0.08, -0.57),
            rig_type="biped",
        ),
    )
    add_idle_animation(root, amplitude=0.016)
    return root


def main() -> None:
    args = parse_args()
    for path in (args.output_glb, args.output_blend, args.preview):
        ensure_parent(path)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_character(args.face_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.08),
        camera_location=(2.55, -4.7, 2.55),
        preview_accent=(1.0, 0.30, 0.62),
    )
    print("YAMETARO_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
