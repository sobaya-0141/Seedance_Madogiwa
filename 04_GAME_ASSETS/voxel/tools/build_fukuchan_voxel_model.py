"""Build Fukuchan (stylish sponsor regular) as a reusable chibi biped voxel character."""

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
    parser.add_argument("--outfit-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    parser.add_argument("--turnaround-dir", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(face_texture: str, outfit_texture: str) -> bpy.types.Object:
    skin = make_material("FukuchanVoxel_Skin", (1.0, 0.68, 0.43, 1.0), roughness=0.9)
    hair = make_material("FukuchanVoxel_Hair", (0.014, 0.011, 0.010, 1.0), roughness=0.7)
    coat = make_material("FukuchanVoxel_Coat", (0.017, 0.022, 0.038, 1.0), roughness=0.82)
    pants = make_material("FukuchanVoxel_Pants", (0.012, 0.012, 0.014, 1.0), roughness=0.84)
    sneakers = make_material("FukuchanVoxel_Sneakers", (0.96, 0.96, 0.96, 1.0), roughness=0.60)
    face_surface = make_texture_material(
        "FukuchanVoxel_FaceSurface",
        face_texture,
        image_name="FukuchanVoxel_FaceAlbedo",
        roughness=0.72,
        emission_strength=0.18,
    )
    outfit_surface = make_texture_material(
        "FukuchanVoxel_OutfitSurface",
        outfit_texture,
        image_name="FukuchanVoxel_OutfitFrontAlbedo",
        roughness=0.80,
    )

    root = add_empty("FukuchanVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Fukuchan"
    root["style"] = "square-head Minecraft-like voxel caricature"
    root["design_locks"] = "stylish navy long coat,white graphic tee,sponsor strap,name tag,black medium hair,smile"
    root["face_workflow"] = "replaceable front-panel albedo texture; smile eyes and pink cheeks in texture"
    root["clothing_workflow"] = "single cuboid torso; tee/strap/tag on one replaceable front albedo"
    root["turnaround_approval"] = (
        "2026-07-22 imagegen unavailable in build environment; side/back inferred from "
        "02_CHARACTERS/05_Fukuchan.md and legacy canon voxel; review via rendered turnaround in PR"
    )

    # Slim biped with white sneakers and a long coat skirt over the hips.
    for side in (-1, 1):
        x = side * 0.18
        add_box(f"FukuchanVoxel_Sneaker_{side}", (x, -0.06, 0.10), (0.31, 0.46, 0.20), sneakers, parent=root)
        add_box(f"FukuchanVoxel_PantsLeg_{side}", (x, 0.0, 0.44), (0.30, 0.36, 0.48), pants, parent=root)
    add_box("FukuchanVoxel_CoatSkirt", (0.0, 0.0, 0.82), (0.84, 0.52, 0.30), coat, parent=root)
    add_box("FukuchanVoxel_Torso", (0.0, 0.0, 1.16), (0.78, 0.48, 0.60), coat, parent=root)
    add_textured_front_panel(
        "FukuchanVoxel_OutfitFrontPanel",
        (0.0, -0.258, 1.16),
        (0.72, 0.035, 0.54),
        coat,
        outfit_surface,
        parent=root,
        uv_name="FukuchanVoxelOutfitUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_box("FukuchanVoxel_Neck", (0.0, 0.0, 1.50), (0.20, 0.30, 0.14), skin, parent=root)

    # Coat sleeves with bare hands.
    for side, prefix in ((1, "Primary"), (-1, "Secondary")):
        x = side * 0.51
        add_box(f"FukuchanVoxel_{prefix}Sleeve", (x, 0.0, 1.18), (0.26, 0.42, 0.42), coat, parent=root)
        add_box(f"FukuchanVoxel_{prefix}Hand", (x, -0.02, 0.86), (0.22, 0.24, 0.20), skin, parent=root)

    # Cube head with center-parted black medium hair, continuous over the rear.
    add_box("FukuchanVoxel_HeadCube", (0.0, 0.0, 2.04), (1.12, 1.12, 1.12), skin, parent=root)
    add_box("FukuchanVoxel_HairCap", (0.0, 0.0, 2.59), (1.16, 1.16, 0.18), hair, parent=root)
    add_box("FukuchanVoxel_HairTop", (0.0, 0.0, 2.70), (0.80, 0.94, 0.12), hair, parent=root)
    for side in (-1, 1):
        add_box(f"FukuchanVoxel_SideHair_{side}", (side * 0.585, 0.05, 2.28), (0.12, 1.02, 0.52), hair, parent=root)
        # Center part: two bangs sweeping outward with a gap in the middle.
        add_box(
            f"FukuchanVoxel_Bang_{side}",
            (side * 0.33, -0.575, 2.44),
            (0.44, 0.06, 0.18),
            hair,
            parent=root,
        )
        add_box(
            f"FukuchanVoxel_BangLow_{side}",
            (side * 0.47, -0.575, 2.28),
            (0.16, 0.06, 0.20),
            hair,
            parent=root,
        )
    add_box("FukuchanVoxel_RearHairMain", (0.0, 0.585, 2.22), (1.10, 0.10, 0.68), hair, parent=root)
    for index, (x, z, width, height) in enumerate(
        (
            (-0.40, 1.84, 0.20, 0.16),
            (-0.16, 1.80, 0.24, 0.22),
            (0.10, 1.83, 0.24, 0.18),
            (0.36, 1.79, 0.22, 0.24),
        )
    ):
        add_box(f"FukuchanVoxel_RearHairTip_{index}", (x, 0.585, z), (width, 0.10, height), hair, parent=root)
    add_textured_front_panel(
        "FukuchanVoxel_FacePanel",
        (0.0, -0.578, 2.02),
        (1.02, 0.035, 1.02),
        skin,
        face_surface,
        parent=root,
        uv_name="FukuchanVoxelFaceUV",
    )

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.45, 0.0, 1.34), ("FukuchanVoxel_Primary",)),
            secondary_arm=RigGroup((-0.45, 0.0, 1.34), ("FukuchanVoxel_Secondary",)),
            left_leg=RigGroup((-0.18, 0.0, 0.68), ("FukuchanVoxel_PantsLeg_-1", "FukuchanVoxel_Sneaker_-1")),
            right_leg=RigGroup((0.18, 0.0, 0.68), ("FukuchanVoxel_PantsLeg_1", "FukuchanVoxel_Sneaker_1")),
            primary_hand_socket_local=(0.06, -0.02, -0.48),
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
    build_character(args.face_texture, args.outfit_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.36),
        camera_location=(2.80, -5.1, 2.85),
        preview_accent=(0.42, 0.70, 1.0),
        turnaround_dir=args.turnaround_dir,
        turnaround_distance=5.1,
        turnaround_scale=3.25,
    )
    print("FUKUCHAN_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
