"""Build Yotan (rock CTO) as a reusable chibi biped voxel character."""

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
    parser.add_argument("--jacket-texture", required=True)
    parser.add_argument("--jacket-back-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    parser.add_argument("--turnaround-dir", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(
    face_texture: str,
    jacket_texture: str,
    jacket_back_texture: str,
) -> bpy.types.Object:
    skin = make_material("YotanVoxel_Skin", (1.0, 0.68, 0.43, 1.0), roughness=0.9)
    blond = make_material("YotanVoxel_Hair", (0.82, 0.57, 0.11, 1.0), roughness=0.62)
    leather = make_material("YotanVoxel_Leather", (0.014, 0.014, 0.016, 1.0), roughness=0.42)
    pants = make_material("YotanVoxel_Pants", (0.020, 0.020, 0.024, 1.0), roughness=0.80)
    boots = make_material("YotanVoxel_Boots", (0.010, 0.010, 0.012, 1.0), roughness=0.35)
    frame_black = make_material("YotanVoxel_GlassFrame", (0.012, 0.012, 0.014, 1.0), roughness=0.55)
    guitar_body = make_material("YotanVoxel_GuitarBody", (0.26, 0.045, 0.018, 1.0), roughness=0.45)
    guitar_neck = make_material("YotanVoxel_GuitarNeck", (0.24, 0.10, 0.024, 1.0), roughness=0.72)
    guitar_head = make_material("YotanVoxel_GuitarHead", (0.014, 0.014, 0.016, 1.0), roughness=0.55)
    face_surface = make_texture_material(
        "YotanVoxel_FaceSurface",
        face_texture,
        image_name="YotanVoxel_FaceAlbedo",
        roughness=0.72,
        emission_strength=0.18,
    )
    jacket_surface = make_texture_material(
        "YotanVoxel_JacketSurface",
        jacket_texture,
        image_name="YotanVoxel_JacketFrontAlbedo",
        roughness=0.50,
    )
    jacket_back_surface = make_texture_material(
        "YotanVoxel_JacketBackSurface",
        jacket_back_texture,
        image_name="YotanVoxel_JacketBackAlbedo",
        roughness=0.50,
    )

    root = add_empty("YotanVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Yotan"
    root["style"] = "square-head Minecraft-like voxel caricature"
    root["design_locks"] = "blond long hair,black leather jacket,guitar,round sunglasses,slim"
    root["face_workflow"] = "replaceable front-panel albedo texture; round sunglasses stay in texture"
    root["clothing_workflow"] = "single cuboid torso with replaceable front/back jacket albedos"
    root["turnaround_approval"] = (
        "2026-07-22 imagegen unavailable in build environment; side/back inferred from "
        "02_CHARACTERS/04_Yotan.md and legacy canon voxel; review via rendered turnaround in PR"
    )

    # Slim biped with black boots.
    for side in (-1, 1):
        x = side * 0.18
        add_box(f"YotanVoxel_Boot_{side}", (x, -0.06, 0.11), (0.30, 0.44, 0.22), boots, parent=root)
        add_box(f"YotanVoxel_PantsLeg_{side}", (x, 0.0, 0.46), (0.28, 0.34, 0.50), pants, parent=root)
    add_box("YotanVoxel_Waist", (0.0, 0.0, 0.77), (0.64, 0.40, 0.14), pants, parent=root)
    add_box("YotanVoxel_Torso", (0.0, 0.0, 1.10), (0.72, 0.46, 0.60), leather, parent=root)
    add_textured_front_panel(
        "YotanVoxel_JacketFrontPanel",
        (0.0, -0.248, 1.10),
        (0.66, 0.035, 0.54),
        leather,
        jacket_surface,
        parent=root,
        uv_name="YotanVoxelJacketUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_textured_back_panel(
        "YotanVoxel_JacketBackPanel",
        (0.0, 0.248, 1.10),
        (0.66, 0.035, 0.54),
        leather,
        jacket_back_surface,
        parent=root,
        uv_name="YotanVoxelJacketBackUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_box("YotanVoxel_Neck", (0.0, 0.0, 1.44), (0.20, 0.30, 0.14), skin, parent=root)

    # Leather sleeves with bare hands; the primary arm swings the guitar.
    for side, prefix in ((1, "Primary"), (-1, "Secondary")):
        x = side * 0.48
        add_box(f"YotanVoxel_{prefix}Sleeve", (x, 0.0, 1.12), (0.24, 0.40, 0.40), leather, parent=root)
        add_box(f"YotanVoxel_{prefix}Hand", (x, -0.02, 0.82), (0.22, 0.24, 0.20), skin, parent=root)

    # Guitar (NG-locked prop) aligned with the primary arm for the shared smash.
    add_box("YotanVoxel_PrimaryGuitarBody", (0.48, -0.28, 0.52), (0.40, 0.15, 0.38), guitar_body, parent=root)
    add_box("YotanVoxel_PrimaryGuitarHole", (0.48, -0.363, 0.52), (0.13, 0.02, 0.13), guitar_head, parent=root)
    add_box("YotanVoxel_PrimaryGuitarNeck", (0.48, -0.28, 0.90), (0.09, 0.09, 0.40), guitar_neck, parent=root)
    add_box("YotanVoxel_PrimaryGuitarHead", (0.48, -0.28, 1.14), (0.14, 0.11, 0.14), guitar_head, parent=root)

    # Cube head with long blond hair wrapping the sides and back down to the shoulders.
    add_box("YotanVoxel_HeadCube", (0.0, 0.0, 1.98), (1.12, 1.12, 1.12), skin, parent=root)
    add_box("YotanVoxel_HairCap", (0.0, 0.0, 2.53), (1.16, 1.16, 0.18), blond, parent=root)
    add_box("YotanVoxel_HairTop", (0.0, 0.0, 2.64), (0.82, 0.94, 0.12), blond, parent=root)
    for side in (-1, 1):
        add_box(f"YotanVoxel_SideHair_{side}", (side * 0.585, 0.05, 2.16), (0.12, 1.02, 0.86), blond, parent=root)
        add_box(f"YotanVoxel_SideHairLong_{side}", (side * 0.56, 0.30, 1.52), (0.16, 0.46, 0.46), blond, parent=root)
        add_box(f"YotanVoxel_GlassesArm_{side}", (side * 0.585, -0.28, 2.10), (0.045, 0.60, 0.055), frame_black, parent=root)
    add_box("YotanVoxel_RearHairMain", (0.0, 0.585, 2.10), (1.10, 0.10, 1.00), blond, parent=root)
    add_box("YotanVoxel_RearHairLow", (0.0, 0.60, 1.50), (0.94, 0.12, 0.24), blond, parent=root)
    for index, (x, z, width, height) in enumerate(
        (
            (-0.36, 1.32, 0.22, 0.18),
            (-0.10, 1.28, 0.24, 0.24),
            (0.16, 1.33, 0.22, 0.16),
            (0.38, 1.28, 0.18, 0.24),
        )
    ):
        add_box(f"YotanVoxel_RearHairTip_{index}", (x, 0.60, z), (width, 0.12, height), blond, parent=root)
    add_box("YotanVoxel_BangLeft", (-0.33, -0.575, 2.40), (0.48, 0.06, 0.20), blond, parent=root)
    add_box("YotanVoxel_BangRight", (0.38, -0.575, 2.44), (0.38, 0.06, 0.14), blond, parent=root)
    add_box("YotanVoxel_BangSide", (-0.50, -0.575, 2.24), (0.14, 0.06, 0.30), blond, parent=root)
    add_textured_front_panel(
        "YotanVoxel_FacePanel",
        (0.0, -0.578, 1.96),
        (1.02, 0.035, 1.02),
        skin,
        face_surface,
        parent=root,
        uv_name="YotanVoxelFaceUV",
    )

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.42, 0.0, 1.28), ("YotanVoxel_Primary",)),
            secondary_arm=RigGroup((-0.42, 0.0, 1.28), ("YotanVoxel_Secondary",)),
            left_leg=RigGroup((-0.18, 0.0, 0.70), ("YotanVoxel_PantsLeg_-1", "YotanVoxel_Boot_-1")),
            right_leg=RigGroup((0.18, 0.0, 0.70), ("YotanVoxel_PantsLeg_1", "YotanVoxel_Boot_1")),
            primary_hand_socket_local=(0.06, -0.02, -0.46),
            rig_type="biped",
        ),
    )
    add_idle_animation(root, amplitude=0.018)
    return root


def main() -> None:
    args = parse_args()
    for path in (args.output_glb, args.output_blend, args.preview):
        ensure_parent(path)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_character(args.face_texture, args.jacket_texture, args.jacket_back_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.34),
        camera_location=(2.80, -5.1, 2.85),
        preview_accent=(0.55, 0.65, 1.0),
        turnaround_dir=args.turnaround_dir,
        turnaround_distance=5.1,
        turnaround_scale=3.25,
    )
    print("YOTAN_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
