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
    add_textured_back_panel,
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
    parser.add_argument("--shirt-texture", required=True)
    parser.add_argument("--shirt-back-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    parser.add_argument("--turnaround-dir", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(
    face_texture: str,
    shirt_texture: str,
    shirt_back_texture: str,
) -> bpy.types.Object:
    skin = make_material("YametaroVoxel_Skin", (1.0, 0.68, 0.43, 1.0), roughness=0.9)
    skin_shadow = make_material("YametaroVoxel_SkinShadow", (0.84, 0.47, 0.28, 1.0), roughness=0.9)
    hair = make_material("YametaroVoxel_Hair", (0.012, 0.027, 0.034, 1.0), roughness=0.7)
    purple = make_material("YametaroVoxel_Shirt", (0.35, 0.27, 0.80, 1.0), roughness=0.88)
    pants = make_material("YametaroVoxel_Pants", (0.075, 0.09, 0.13, 1.0), roughness=0.86)
    shoes = make_material("YametaroVoxel_Shoes", (0.025, 0.035, 0.052, 1.0), roughness=0.78)
    face_surface = make_texture_material(
        "YametaroVoxel_FaceSurface",
        face_texture,
        image_name="YametaroVoxel_FaceAlbedo",
        roughness=0.72,
        emission_strength=0.30,
    )
    shirt_surface = make_texture_material(
        "YametaroVoxel_ShirtSurface",
        shirt_texture,
        image_name="YametaroVoxel_ShirtFrontAlbedo",
        roughness=0.86,
    )
    shirt_back_surface = make_texture_material(
        "YametaroVoxel_ShirtBackSurface",
        shirt_back_texture,
        image_name="YametaroVoxel_ShirtBackAlbedo",
        roughness=0.86,
    )

    root = add_empty("YametaroVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Mushoku Yametaro"
    root["style"] = "selected square-head Minecraft-like voxel caricature"
    root["design_locks"] = "purple shirt,round glasses,black side-parted hair,chibi proportions"
    root["face_workflow"] = "replaceable front-panel albedo texture; pupil-free white lenses"
    root["clothing_workflow"] = "single cuboid torso with replaceable front/back shirt albedos"
    root["turnaround_approval"] = "approved 2026-07-21; full rear hair, glasses arms, wrapped collar, rear botanical motifs"

    # Short biped body below an intentionally oversized perfect cube head.
    for side in (-1, 1):
        x = side * 0.19
        add_box(f"YametaroVoxel_Shoe_{side}", (x, -0.08, 0.11), (0.31, 0.42, 0.22), shoes, parent=root)
        add_box(f"YametaroVoxel_PantsLeg_{side}", (x, 0.0, 0.43), (0.31, 0.36, 0.52), pants, parent=root)
    add_box("YametaroVoxel_Waist", (0.0, 0.0, 0.73), (0.70, 0.42, 0.16), pants, parent=root)
    add_box("YametaroVoxel_Torso", (0.0, 0.0, 1.02), (0.78, 0.48, 0.58), purple, parent=root)
    add_textured_front_panel(
        "YametaroVoxel_ShirtFrontPanel",
        (0.0, -0.258, 1.02),
        (0.72, 0.035, 0.52),
        purple,
        shirt_surface,
        parent=root,
        uv_name="YametaroVoxelShirtUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_textured_back_panel(
        "YametaroVoxel_ShirtBackPanel",
        (0.0, 0.258, 1.02),
        (0.72, 0.035, 0.52),
        purple,
        shirt_back_surface,
        parent=root,
        uv_name="YametaroVoxelShirtBackUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_box("YametaroVoxel_Neck", (0.0, 0.0, 1.35), (0.20, 0.30, 0.16), skin, parent=root)

    # Arms are deliberately simple so the shared smash reads cleanly.
    add_box("YametaroVoxel_PrimarySleeve", (0.50, 0.0, 1.06), (0.24, 0.42, 0.36), purple, parent=root)
    add_box("YametaroVoxel_PrimaryHand", (0.50, -0.02, 0.78), (0.23, 0.26, 0.22), skin, parent=root)
    add_box("YametaroVoxel_SecondarySleeve", (-0.50, 0.0, 1.06), (0.24, 0.42, 0.36), purple, parent=root)
    add_box("YametaroVoxel_SecondaryHand", (-0.50, -0.02, 0.78), (0.23, 0.26, 0.22), skin, parent=root)

    # The selected design uses a perfect cube head with block hair overlays.
    add_box("YametaroVoxel_HeadCube", (0.0, 0.0, 1.92), (1.12, 1.12, 1.12), skin, parent=root)
    for side in (-1, 1):
        add_box(f"YametaroVoxel_Ear_{side}", (side * 0.63, 0.0, 1.88), (0.14, 0.30, 0.24), skin_shadow, parent=root)
        add_box(f"YametaroVoxel_SideHair_{side}", (side * 0.53, 0.04, 2.22), (0.14, 1.04, 0.40), hair, parent=root)
        add_box(f"YametaroVoxel_SideHairRear_{side}", (side * 0.53, 0.34, 1.92), (0.14, 0.42, 0.28), hair, parent=root)
        add_box(f"YametaroVoxel_GlassesArm_{side}", (side * 0.585, -0.30, 2.02), (0.045, 0.56, 0.055), hair, parent=root)
    add_box("YametaroVoxel_HairCap", (0.0, 0.0, 2.47), (1.16, 1.16, 0.18), hair, parent=root)
    add_box("YametaroVoxel_HairTop", (0.0, 0.0, 2.58), (0.72, 0.92, 0.12), hair, parent=root)
    add_box("YametaroVoxel_BangLeftTop", (-0.31, -0.585, 2.32), (0.54, 0.08, 0.22), hair, parent=root)
    add_box("YametaroVoxel_BangLeftLow", (-0.43, -0.585, 2.13), (0.30, 0.08, 0.28), hair, parent=root)
    add_box("YametaroVoxel_BangRightTop", (0.31, -0.585, 2.32), (0.54, 0.08, 0.22), hair, parent=root)
    add_box("YametaroVoxel_BangRightLow", (0.43, -0.585, 2.13), (0.30, 0.08, 0.28), hair, parent=root)
    # Approved rear silhouette: one dense hair mass with a stepped, uneven
    # lower edge. No skin-colored bald panel remains on the rear of the cube.
    add_box("YametaroVoxel_HairRearMain", (0.0, 0.585, 2.16), (1.10, 0.08, 0.64), hair, parent=root)
    for index, (x, z, width, height) in enumerate(
        (
            (-0.43, 1.81, 0.22, 0.18),
            (-0.20, 1.77, 0.26, 0.26),
            (0.05, 1.80, 0.26, 0.20),
            (0.30, 1.75, 0.26, 0.30),
            (0.49, 1.82, 0.16, 0.16),
        )
    ):
        add_box(
            f"YametaroVoxel_HairRearNape_{index}",
            (x, 0.585, z),
            (width, 0.08, height),
            hair,
            parent=root,
        )
    add_textured_front_panel(
        "YametaroVoxel_FacePanel",
        (0.0, -0.578, 1.90),
        (1.02, 0.035, 1.02),
        skin,
        face_surface,
        parent=root,
        uv_name="YametaroVoxelFaceUV",
    )

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.43, 0.0, 1.23), ("YametaroVoxel_Primary",)),
            secondary_arm=RigGroup((-0.43, 0.0, 1.23), ("YametaroVoxel_Secondary",)),
            left_leg=RigGroup((-0.19, 0.0, 0.76), ("YametaroVoxel_PantsLeg_-1", "YametaroVoxel_Shoe_-1")),
            right_leg=RigGroup((0.19, 0.0, 0.76), ("YametaroVoxel_PantsLeg_1", "YametaroVoxel_Shoe_1")),
            primary_hand_socket_local=(0.08, -0.02, -0.45),
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
    build_character(args.face_texture, args.shirt_texture, args.shirt_back_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.28),
        camera_location=(2.75, -5.1, 2.80),
        preview_accent=(1.0, 0.30, 0.62),
        turnaround_dir=args.turnaround_dir,
        turnaround_distance=5.0,
        turnaround_scale=3.15,
    )
    print("YAMETARO_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
