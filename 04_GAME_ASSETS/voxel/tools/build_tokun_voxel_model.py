"""Build Tokun (aloha president) as a reusable chibi biped voxel character."""

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
    parser.add_argument("--aloha-texture", required=True)
    parser.add_argument("--aloha-back-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    parser.add_argument("--turnaround-dir", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(
    face_texture: str,
    aloha_texture: str,
    aloha_back_texture: str,
) -> bpy.types.Object:
    skin = make_material("TokunVoxel_Skin", (1.0, 0.68, 0.43, 1.0), roughness=0.9)
    hair = make_material("TokunVoxel_Hair", (0.014, 0.011, 0.010, 1.0), roughness=0.7)
    aloha = make_material("TokunVoxel_Aloha", (0.27, 0.73, 0.52, 1.0), roughness=0.88)
    navy = make_material("TokunVoxel_Pants", (0.010, 0.016, 0.052, 1.0), roughness=0.86)
    straw = make_material("TokunVoxel_Straw", (0.68, 0.45, 0.15, 1.0), roughness=0.92)
    straw_band = make_material("TokunVoxel_StrawBand", (0.045, 0.028, 0.013, 1.0), roughness=0.80)
    lei_pink = make_material("TokunVoxel_LeiPink", (0.88, 0.14, 0.40, 1.0), roughness=0.85)
    lei_light = make_material("TokunVoxel_LeiLight", (1.0, 0.62, 0.76, 1.0), roughness=0.85)
    wood_light = make_material("TokunVoxel_WoodLight", (0.57, 0.32, 0.10, 1.0), roughness=0.72)
    wood_dark = make_material("TokunVoxel_WoodDark", (0.24, 0.10, 0.024, 1.0), roughness=0.72)
    face_surface = make_texture_material(
        "TokunVoxel_FaceSurface",
        face_texture,
        image_name="TokunVoxel_FaceAlbedo",
        roughness=0.72,
        emission_strength=0.18,
    )
    aloha_surface = make_texture_material(
        "TokunVoxel_AlohaSurface",
        aloha_texture,
        image_name="TokunVoxel_AlohaFrontAlbedo",
        roughness=0.86,
    )
    aloha_back_surface = make_texture_material(
        "TokunVoxel_AlohaBackSurface",
        aloha_back_texture,
        image_name="TokunVoxel_AlohaBackAlbedo",
        roughness=0.86,
    )

    root = add_empty("TokunVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Tokun"
    root["style"] = "square-head Minecraft-like voxel caricature"
    root["design_locks"] = "aloha shirt,straw hat,ukulele,sunglasses,lei,slightly plump"
    root["face_workflow"] = "replaceable front-panel albedo texture; sunglasses stay in texture"
    root["clothing_workflow"] = "single cuboid torso with replaceable front/back aloha albedos"
    root["turnaround_approval"] = (
        "2026-07-22 imagegen unavailable in build environment; side/back inferred from "
        "02_CHARACTERS/03_Tokun.md and legacy canon voxel; review via rendered turnaround in PR"
    )

    # Slightly plump biped: wider torso than the chibi baseline, bare feet.
    for side in (-1, 1):
        x = side * 0.21
        add_box(f"TokunVoxel_Foot_{side}", (x, -0.04, 0.09), (0.31, 0.44, 0.18), skin, parent=root)
        add_box(f"TokunVoxel_PantsLeg_{side}", (x, 0.0, 0.42), (0.32, 0.38, 0.48), navy, parent=root)
    add_box("TokunVoxel_Waist", (0.0, 0.0, 0.72), (0.80, 0.48, 0.16), navy, parent=root)
    add_box("TokunVoxel_Torso", (0.0, 0.0, 1.06), (0.92, 0.56, 0.66), aloha, parent=root)
    add_textured_front_panel(
        "TokunVoxel_AlohaFrontPanel",
        (0.0, -0.298, 1.06),
        (0.86, 0.035, 0.60),
        aloha,
        aloha_surface,
        parent=root,
        uv_name="TokunVoxelAlohaUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_textured_back_panel(
        "TokunVoxel_AlohaBackPanel",
        (0.0, 0.298, 1.06),
        (0.86, 0.035, 0.60),
        aloha,
        aloha_back_surface,
        parent=root,
        uv_name="TokunVoxelAlohaBackUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_box("TokunVoxel_Neck", (0.0, 0.0, 1.42), (0.22, 0.32, 0.14), skin, parent=root)

    # Pink lei ring around the neck: alternating pink/light blocks on all four sides.
    add_box("TokunVoxel_LeiFront", (0.0, -0.315, 1.36), (0.66, 0.15, 0.15), lei_pink, parent=root)
    add_box("TokunVoxel_LeiFrontLight", (0.0, -0.325, 1.28), (0.46, 0.13, 0.10), lei_light, parent=root)
    add_box("TokunVoxel_LeiBack", (0.0, 0.315, 1.36), (0.66, 0.15, 0.15), lei_pink, parent=root)
    for side in (-1, 1):
        add_box(f"TokunVoxel_LeiSide_{side}", (side * 0.40, 0.0, 1.36), (0.15, 0.62, 0.15), lei_light, parent=root)

    # Arms: aloha short sleeves with bare forearms; the primary arm carries the ukulele.
    for side, prefix in ((1, "Primary"), (-1, "Secondary")):
        x = side * 0.60
        add_box(f"TokunVoxel_{prefix}Sleeve", (x, 0.0, 1.14), (0.28, 0.46, 0.34), aloha, parent=root)
        add_box(f"TokunVoxel_{prefix}Forearm", (x, -0.02, 0.88), (0.24, 0.26, 0.24), skin, parent=root)
        add_box(f"TokunVoxel_{prefix}Hand", (x, -0.04, 0.70), (0.23, 0.26, 0.20), skin, parent=root)

    # Ukulele (NG-locked prop) aligned with the primary arm for the shared smash.
    add_box("TokunVoxel_PrimaryUkuleleBody", (0.60, -0.30, 0.46), (0.36, 0.15, 0.42), wood_light, parent=root)
    add_box("TokunVoxel_PrimaryUkuleleHole", (0.60, -0.383, 0.46), (0.13, 0.02, 0.13), wood_dark, parent=root)
    add_box("TokunVoxel_PrimaryUkuleleNeck", (0.60, -0.30, 0.82), (0.09, 0.09, 0.34), wood_dark, parent=root)
    add_box("TokunVoxel_PrimaryUkuleleHead", (0.60, -0.30, 1.02), (0.14, 0.11, 0.12), wood_light, parent=root)

    # Oversized cube head with plump lower cheeks.
    add_box("TokunVoxel_HeadCube", (0.0, 0.0, 2.02), (1.12, 1.12, 1.12), skin, parent=root)
    add_box("TokunVoxel_Cheeks", (0.0, 0.0, 1.58), (1.18, 1.06, 0.22), skin, parent=root)
    # Black hair visible under the hat on the sides and back.
    for side in (-1, 1):
        add_box(f"TokunVoxel_SideHair_{side}", (side * 0.585, 0.06, 2.30), (0.10, 1.00, 0.36), hair, parent=root)
    add_box("TokunVoxel_RearHair", (0.0, 0.585, 2.10), (1.10, 0.10, 0.84), hair, parent=root)
    # Stepped nape so no bald skin shows between the hair mass and the collar.
    for index, (x, z, width, height) in enumerate(
        (
            (-0.38, 1.62, 0.22, 0.16),
            (-0.12, 1.58, 0.26, 0.24),
            (0.14, 1.61, 0.24, 0.18),
            (0.38, 1.57, 0.20, 0.26),
        )
    ):
        add_box(f"TokunVoxel_RearHairNape_{index}", (x, 0.585, z), (width, 0.10, height), hair, parent=root)
    # The plump cheek block also peeks out behind: cover its rear face too.
    add_box("TokunVoxel_RearHairCheek", (0.0, 0.545, 1.58), (1.14, 0.08, 0.22), hair, parent=root)
    add_box("TokunVoxel_BangLeft", (-0.36, -0.575, 2.44), (0.36, 0.06, 0.14), hair, parent=root)
    add_box("TokunVoxel_BangRight", (0.36, -0.575, 2.44), (0.36, 0.06, 0.14), hair, parent=root)
    add_textured_front_panel(
        "TokunVoxel_FacePanel",
        (0.0, -0.578, 2.00),
        (1.02, 0.035, 1.02),
        skin,
        face_surface,
        parent=root,
        uv_name="TokunVoxelFaceUV",
    )

    # Straw hat (NG-locked): wide brim, black band, tapered crown.
    add_box("TokunVoxel_HatBrim", (0.0, 0.0, 2.56), (1.74, 1.74, 0.10), straw, parent=root)
    add_box("TokunVoxel_HatBand", (0.0, 0.0, 2.66), (1.06, 1.06, 0.10), straw_band, parent=root)
    add_box("TokunVoxel_HatCrown", (0.0, 0.0, 2.80), (1.00, 1.00, 0.18), straw, parent=root)
    add_box("TokunVoxel_HatTop", (0.0, 0.0, 2.93), (0.72, 0.72, 0.10), straw, parent=root)

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.52, 0.0, 1.28), ("TokunVoxel_Primary",)),
            secondary_arm=RigGroup((-0.52, 0.0, 1.28), ("TokunVoxel_Secondary",)),
            left_leg=RigGroup((-0.21, 0.0, 0.64), ("TokunVoxel_PantsLeg_-1", "TokunVoxel_Foot_-1")),
            right_leg=RigGroup((0.21, 0.0, 0.64), ("TokunVoxel_PantsLeg_1", "TokunVoxel_Foot_1")),
            primary_hand_socket_local=(0.08, -0.04, -0.58),
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
    build_character(args.face_texture, args.aloha_texture, args.aloha_back_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.40),
        camera_location=(2.85, -5.2, 2.90),
        preview_accent=(1.0, 0.55, 0.30),
        turnaround_dir=args.turnaround_dir,
        turnaround_distance=5.2,
        turnaround_scale=3.45,
    )
    print("TOKUN_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
