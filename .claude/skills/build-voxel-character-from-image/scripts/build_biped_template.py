"""Build a texture-driven cube-head biped. Copy and customize silhouette parts."""

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
    parser.add_argument("--character-name", required=True)
    parser.add_argument("--face-texture", required=True)
    parser.add_argument("--clothing-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(name: str, face_path: str, clothing_path: str) -> bpy.types.Object:
    skin = make_material("Voxel_Skin", (1.0, 0.68, 0.43, 1.0), roughness=0.90)
    clothing = make_material("Voxel_Clothing", (0.35, 0.27, 0.80, 1.0), roughness=0.88)
    pants = make_material("Voxel_Pants", (0.075, 0.09, 0.13, 1.0), roughness=0.86)
    shoes = make_material("Voxel_Shoes", (0.025, 0.035, 0.052, 1.0), roughness=0.78)
    face = make_texture_material(
        "Voxel_FaceSurface",
        face_path,
        image_name="Voxel_FaceAlbedo",
        emission_strength=0.10,
    )
    shirt = make_texture_material(
        "Voxel_ClothingSurface",
        clothing_path,
        image_name="Voxel_ClothingAlbedo",
    )

    root = add_empty("VoxelCharacter_Root", (0.0, 0.0, 0.0))
    root["character"] = name
    root["identity_locks"] = "replace with character-specific immutable traits"
    root["face_workflow"] = "replaceable front-panel albedo texture"
    root["clothing_workflow"] = "single cuboid torso with replaceable front albedo"

    for side in (-1, 1):
        x = side * 0.19
        add_box(f"Voxel_Shoe_{side}", (x, -0.08, 0.11), (0.31, 0.42, 0.22), shoes, parent=root)
        add_box(f"Voxel_Leg_{side}", (x, 0.0, 0.43), (0.31, 0.36, 0.52), pants, parent=root)
    add_box("Voxel_Waist", (0.0, 0.0, 0.73), (0.70, 0.42, 0.16), pants, parent=root)
    add_box("Voxel_Torso", (0.0, 0.0, 1.02), (0.78, 0.48, 0.58), clothing, parent=root)
    add_textured_front_panel(
        "Voxel_ClothingFrontPanel",
        (0.0, -0.258, 1.02),
        (0.72, 0.035, 0.52),
        clothing,
        shirt,
        parent=root,
        uv_name="VoxelClothingUV",
        uv_bounds=(0.025, 0.025, 0.975, 0.975),
    )
    add_box("Voxel_Neck", (0.0, 0.0, 1.35), (0.20, 0.30, 0.16), skin, parent=root)
    add_box("Voxel_PrimarySleeve", (0.50, 0.0, 1.06), (0.24, 0.42, 0.36), clothing, parent=root)
    add_box("Voxel_PrimaryHand", (0.50, -0.02, 0.78), (0.23, 0.26, 0.22), skin, parent=root)
    add_box("Voxel_SecondarySleeve", (-0.50, 0.0, 1.06), (0.24, 0.42, 0.36), clothing, parent=root)
    add_box("Voxel_SecondaryHand", (-0.50, -0.02, 0.78), (0.23, 0.26, 0.22), skin, parent=root)
    add_box("Voxel_HeadCube", (0.0, 0.0, 1.92), (1.12, 1.12, 1.12), skin, parent=root)
    add_textured_front_panel(
        "Voxel_FacePanel",
        (0.0, -0.578, 1.92),
        (1.02, 0.035, 1.02),
        skin,
        face,
        parent=root,
        uv_name="VoxelFaceUV",
    )

    # Add character-specific block hair, ears, hat, hood, or other silhouette parts here.

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.43, 0.0, 1.23), ("Voxel_Primary",)),
            secondary_arm=RigGroup((-0.43, 0.0, 1.23), ("Voxel_Secondary",)),
            left_leg=RigGroup((-0.19, 0.0, 0.76), ("Voxel_Leg_-1", "Voxel_Shoe_-1")),
            right_leg=RigGroup((0.19, 0.0, 0.76), ("Voxel_Leg_1", "Voxel_Shoe_1")),
            primary_hand_socket_local=(0.08, -0.02, -0.45),
            rig_type="biped",
        ),
    )
    add_idle_animation(root)
    return root


def main() -> None:
    args = parse_args()
    for path in (args.output_glb, args.output_blend, args.preview):
        ensure_parent(path)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_character(args.character_name, args.face_texture, args.clothing_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.28),
        camera_location=(2.75, -5.1, 2.80),
    )
    print("VOXEL_CHARACTER_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
