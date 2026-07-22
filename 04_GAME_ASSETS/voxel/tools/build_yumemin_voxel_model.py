"""Build Yumemin (flying tapir mascot) as a voxel character with a mallet.

NG変更（青い体・点目・自由に動く鼻・デザイン全般）を守る。二足リグは持たず、
木槌の腕をVoxelRig_ArmPrimary、バクの鼻をVoxelRig_Locomotion_00として揺らす。
"""

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
    parser.add_argument("--turnaround-dir", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(face_texture: str) -> bpy.types.Object:
    blue = make_material("YumeminVoxel_Blue", (0.117, 0.42, 0.71, 1.0), roughness=0.85)
    blue_dark = make_material("YumeminVoxel_BlueDark", (0.048, 0.24, 0.47, 1.0), roughness=0.85)
    white = make_material("YumeminVoxel_White", (0.91, 0.93, 0.96, 1.0), roughness=0.88)
    wood_light = make_material("YumeminVoxel_WoodLight", (0.57, 0.32, 0.10, 1.0), roughness=0.72)
    wood_dark = make_material("YumeminVoxel_WoodDark", (0.24, 0.10, 0.024, 1.0), roughness=0.72)
    face_surface = make_texture_material(
        "YumeminVoxel_FaceSurface",
        face_texture,
        image_name="YumeminVoxel_FaceAlbedo",
        roughness=0.80,
        emission_strength=0.10,
    )

    root = add_empty("YumeminVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Yumemin"
    root["style"] = "square Minecraft-like voxel mascot"
    root["design_locks"] = "blue round body,black dot eyes,free-moving tapir trunk,white rear,small ears,mallet"
    root["face_workflow"] = "dot eyes on one replaceable front albedo; trunk stays 3D geometry"
    root["clothing_workflow"] = "no clothing; body colors are material blocks"
    root["turnaround_approval"] = (
        "2026-07-22 imagegen unavailable in build environment; side/back inferred from "
        "02_CHARACTERS/08_Yumemin.md and legacy canon voxel; review via rendered turnaround in PR"
    )

    # Rounded body approximated with stepped unrotated boxes. The rear third is white.
    add_box("YumeminVoxel_Body", (0.0, 0.0, 0.92), (1.30, 1.24, 1.00), blue, parent=root)
    add_box("YumeminVoxel_BodyTop", (0.0, 0.0, 1.50), (1.06, 1.02, 0.16), blue, parent=root)
    add_box("YumeminVoxel_BodyBottom", (0.0, 0.0, 0.34), (1.06, 1.02, 0.16), blue, parent=root)
    add_box("YumeminVoxel_RearWhite", (0.0, 0.64, 0.86), (1.14, 0.18, 0.78), white, parent=root)
    add_box("YumeminVoxel_RearWhiteLow", (0.0, 0.56, 0.42), (0.92, 0.22, 0.22), white, parent=root)

    # Small ears with darker tips.
    for side in (-1, 1):
        add_box(f"YumeminVoxel_Ear_{side}", (side * 0.40, 0.0, 1.66), (0.20, 0.20, 0.20), blue, parent=root)
        add_box(f"YumeminVoxel_EarTip_{side}", (side * 0.40, 0.0, 1.80), (0.13, 0.13, 0.10), blue_dark, parent=root)

    # Dot eyes live on the face albedo.
    add_textured_front_panel(
        "YumeminVoxel_FacePanel",
        (0.0, -0.638, 1.02),
        (1.14, 0.035, 0.76),
        blue,
        face_surface,
        parent=root,
        uv_name="YumeminVoxelFaceUV",
    )

    # Free-moving tapir trunk (NG-locked) on the left side of the face,
    # built from stepped boxes and grouped as a swayable locomotion channel.
    add_box("YumeminVoxel_TrunkBase", (-0.35, -0.72, 0.78), (0.26, 0.28, 0.26), blue, parent=root)
    add_box("YumeminVoxel_TrunkMid", (-0.35, -0.94, 0.66), (0.22, 0.24, 0.22), blue, parent=root)
    add_box("YumeminVoxel_TrunkTip", (-0.35, -1.10, 0.58), (0.20, 0.18, 0.18), blue_dark, parent=root)

    # Tiny feet under the body.
    for side in (-1, 1):
        add_box(f"YumeminVoxel_Foot_{side}", (side * 0.30, -0.06, 0.14), (0.26, 0.34, 0.16), blue, parent=root)

    # Mallet arm (NG episode prop): tiny hand, handle, and a big wooden head.
    add_box("YumeminVoxel_PrimaryHand", (0.70, -0.20, 0.92), (0.20, 0.20, 0.20), blue, parent=root)
    add_box("YumeminVoxel_PrimaryHandle", (0.70, -0.52, 0.92), (0.09, 0.48, 0.09), wood_dark, parent=root)
    add_box("YumeminVoxel_PrimaryMalletHead", (0.70, -0.82, 0.92), (0.34, 0.28, 0.34), wood_light, parent=root)
    add_box("YumeminVoxel_PrimaryMalletCapFront", (0.70, -0.97, 0.92), (0.36, 0.04, 0.36), wood_dark, parent=root)
    add_box("YumeminVoxel_PrimaryMalletCapBack", (0.70, -0.67, 0.92), (0.36, 0.04, 0.36), wood_dark, parent=root)

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.62, 0.0, 1.02), ("YumeminVoxel_Primary",)),
            locomotion=(RigGroup((-0.35, -0.60, 0.84), ("YumeminVoxel_Trunk",)),),
            primary_hand_socket_local=(0.08, -0.20, -0.10),
            rig_type="custom",
        ),
    )
    add_idle_animation(root, amplitude=0.030)
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
        preview_target=(0.0, 0.0, 0.95),
        camera_location=(2.3, -4.3, 2.3),
        preview_accent=(0.42, 0.70, 1.0),
        turnaround_dir=args.turnaround_dir,
        turnaround_distance=4.6,
        turnaround_scale=2.70,
    )
    print("YUMEMIN_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
