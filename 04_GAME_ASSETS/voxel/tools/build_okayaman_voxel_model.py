"""Build Okayaman (the Madogiwa King) as a remote-screen voxel character.

NG変更（穏やかな笑顔・スクリーン越しのリモート出演スタイル）を守るため、
実体の人型は作らず「スタンド＋大型スクリーン」をキャラクターとして構築する。
スクリーン全体がVoxelRig_ArmPrimaryとして前傾おじぎ＝スマッシュを再生する。
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
    parser.add_argument("--screen-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    parser.add_argument("--turnaround-dir", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def build_character(screen_texture: str) -> bpy.types.Object:
    bezel = make_material("OkayamanVoxel_Bezel", (0.014, 0.014, 0.016, 1.0), roughness=0.45)
    stand = make_material("OkayamanVoxel_Stand", (0.090, 0.096, 0.11, 1.0), roughness=0.60)
    back_panel = make_material("OkayamanVoxel_BackPanel", (0.030, 0.030, 0.034, 1.0), roughness=0.70)
    screen_surface = make_texture_material(
        "OkayamanVoxel_ScreenSurface",
        screen_texture,
        image_name="OkayamanVoxel_ScreenAlbedo",
        roughness=0.30,
        emission_strength=0.55,
    )

    root = add_empty("OkayamanVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Madogiwa King Okayaman"
    root["style"] = "remote screen appearance; square voxel monitor on a stand"
    root["design_locks"] = "gentle smile,remote screen-only appearance,black hooded jacket,mustache and beard"
    root["face_workflow"] = "entire bust lives on one replaceable emissive screen albedo"
    root["clothing_workflow"] = "no physical body; clothing exists only inside the screen albedo"
    root["turnaround_approval"] = (
        "2026-07-22 imagegen unavailable in build environment; screen-only style follows "
        "02_CHARACTERS/07_Okayaman.md NG locks and legacy canon voxel; review via rendered turnaround in PR"
    )

    # Stand: heavy base and a short pillar. These stay static below the pivot.
    add_box("OkayamanVoxel_StandBase", (0.0, 0.0, 0.06), (1.00, 0.66, 0.12), stand, parent=root)
    add_box("OkayamanVoxel_StandPillar", (0.0, 0.04, 0.42), (0.16, 0.16, 0.62), stand, parent=root)

    # Screen: bezel slab + emissive front albedo. Grouped as the primary arm so the
    # shared smash action reads as a polite forward bow of the whole monitor.
    add_box("OkayamanVoxel_ScreenBezel", (0.0, 0.04, 1.52), (2.10, 0.12, 1.50), bezel, parent=root)
    add_box("OkayamanVoxel_ScreenBack", (0.0, 0.115, 1.52), (1.70, 0.05, 1.10), back_panel, parent=root)
    add_textured_front_panel(
        "OkayamanVoxel_ScreenFace",
        (0.0, -0.033, 1.52),
        (1.94, 0.035, 1.34),
        bezel,
        screen_surface,
        parent=root,
        uv_name="OkayamanVoxelScreenUV",
    )

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup((0.0, 0.04, 0.74), ("OkayamanVoxel_Screen",)),
            rig_type="custom",
        ),
    )
    add_idle_animation(root, amplitude=0.012)
    return root


def main() -> None:
    args = parse_args()
    for path in (args.output_glb, args.output_blend, args.preview):
        ensure_parent(path)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_character(args.screen_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.30),
        camera_location=(2.9, -5.3, 2.7),
        preview_accent=(0.55, 0.85, 1.0),
        turnaround_dir=args.turnaround_dir,
        turnaround_distance=5.4,
        turnaround_scale=3.30,
    )
    print("OKAYAMAN_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
