"""Build Takosan as a reusable tentacled voxel character."""

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
    parser.add_argument("--robe-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def add_tentacle(
    root: bpy.types.Object,
    index: int,
    points: tuple[tuple[float, float, float, float], ...],
    robe: bpy.types.Material,
    underside: bpy.types.Material,
) -> RigGroup:
    prefix = f"TakosanVoxel_Tentacle_{index}_"
    for segment, (x, y, z, size) in enumerate(points):
        add_box(
            f"{prefix}Segment_{segment}",
            (x, y, z),
            (size, 0.30, 0.20),
            robe,
            parent=root,
        )
        if segment % 2 == 1:
            add_box(
                f"{prefix}Sucker_{segment}",
                (x, y - 0.17, z - 0.045),
                (size * 0.42, 0.035, 0.075),
                underside,
                parent=root,
            )
    x, y, _, _ = points[0]
    return RigGroup((x, y, 0.58), (prefix,))


def build_character(face_texture: str, robe_texture: str) -> bpy.types.Object:
    robe = make_material("TakosanVoxel_Robe", (0.025, 0.029, 0.038, 1.0), roughness=0.88)
    robe_mid = make_material("TakosanVoxel_RobeMid", (0.075, 0.08, 0.095, 1.0), roughness=0.88)
    robe_edge = make_material("TakosanVoxel_RobeEdge", (0.19, 0.19, 0.21, 1.0), roughness=0.84)
    hand = make_material("TakosanVoxel_Hands", (0.78, 0.81, 0.82, 1.0), roughness=0.9)
    underside = make_material("TakosanVoxel_TentacleUnderside", (0.30, 0.31, 0.33, 1.0), roughness=0.92)
    face_surface = make_texture_material(
        "TakosanVoxel_FaceSurface",
        face_texture,
        image_name="TakosanVoxel_FaceAlbedo",
        roughness=0.72,
        emission_strength=0.10,
    )
    robe_surface = make_texture_material(
        "TakosanVoxel_RobeSurface",
        robe_texture,
        image_name="TakosanVoxel_RobeFrontAlbedo",
        roughness=0.86,
    )

    root = add_empty("TakosanVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Takosan"
    root["style"] = "selected square-head Minecraft-like voxel caricature"
    root["design_locks"] = "black hooded robe,tentacles,human arms,white face,round black eyes"
    root["face_workflow"] = "replaceable front-panel albedo texture; square head"
    root["clothing_workflow"] = "replaceable robe-front albedo texture"

    # Six tentacles form a readable base from the fixed game camera.
    tentacle_specs = (
        ((-0.38, -0.01, 0.52, 0.28), (-0.58, -0.04, 0.36, 0.28), (-0.78, -0.05, 0.25, 0.27), (-0.92, -0.05, 0.40, 0.25), (-0.92, -0.05, 0.58, 0.22)),
        ((-0.16, -0.12, 0.48, 0.25), (-0.24, -0.14, 0.30, 0.24), (-0.34, -0.15, 0.16, 0.22)),
        ((0.16, -0.12, 0.48, 0.25), (0.24, -0.14, 0.30, 0.24), (0.34, -0.15, 0.16, 0.22)),
        ((0.38, -0.01, 0.52, 0.28), (0.58, -0.04, 0.36, 0.28), (0.78, -0.05, 0.25, 0.27), (0.92, -0.05, 0.40, 0.25), (0.92, -0.05, 0.58, 0.22)),
        ((-0.42, 0.21, 0.47, 0.27), (-0.62, 0.23, 0.29, 0.25), (-0.76, 0.23, 0.18, 0.22)),
        ((0.42, 0.21, 0.47, 0.27), (0.62, 0.23, 0.29, 0.25), (0.76, 0.23, 0.18, 0.22)),
    )
    locomotion = tuple(
        add_tentacle(root, index, points, robe, underside)
        for index, points in enumerate(tentacle_specs)
    )

    # The selected concept uses a strict robe block and a perfect cube head.
    add_box("TakosanVoxel_Robe", (0.0, 0.0, 1.05), (1.02, 0.58, 0.94), robe, parent=root)
    add_textured_front_panel(
        "TakosanVoxel_RobeFrontPanel",
        (0.0, -0.312, 1.05),
        (0.90, 0.035, 0.82),
        robe,
        robe_surface,
        parent=root,
        uv_name="TakosanVoxelRobeUV",
    )
    add_box("TakosanVoxel_Neck", (0.0, 0.0, 1.57), (0.52, 0.48, 0.18), robe_mid, parent=root)
    add_box("TakosanVoxel_HoodCube", (0.0, 0.0, 2.08), (1.10, 1.10, 1.10), robe, parent=root)
    add_textured_front_panel(
        "TakosanVoxel_FacePanel",
        (0.0, -0.568, 2.08),
        (0.98, 0.035, 0.98),
        robe,
        face_surface,
        parent=root,
        uv_name="TakosanVoxelFaceUV",
    )

    # Human arms remain visually separate from the tentacle locomotion rig.
    add_box("TakosanVoxel_PrimarySleeve", (0.64, 0.0, 1.27), (0.30, 0.48, 0.48), robe_mid, parent=root)
    add_box("TakosanVoxel_PrimarySleeveMark", (0.64, -0.258, 1.31), (0.15, 0.035, 0.18), robe_edge, parent=root)
    add_box("TakosanVoxel_PrimaryHand", (0.64, -0.02, 0.91), (0.25, 0.28, 0.24), hand, parent=root)
    add_box("TakosanVoxel_SecondarySleeve", (-0.64, 0.0, 1.27), (0.30, 0.48, 0.48), robe_mid, parent=root)
    add_box("TakosanVoxel_SecondarySleeveMark", (-0.64, -0.258, 1.31), (0.15, 0.035, 0.18), robe_edge, parent=root)
    add_box("TakosanVoxel_SecondaryHand", (-0.64, -0.02, 0.91), (0.25, 0.28, 0.24), hand, parent=root)

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup(
                (0.54, 0.0, 1.48),
                ("TakosanVoxel_Primary",),
            ),
            secondary_arm=RigGroup(
                (-0.54, 0.0, 1.48),
                ("TakosanVoxel_Secondary",),
            ),
            locomotion=locomotion,
            primary_hand_socket_local=(0.10, -0.02, -0.58),
            rig_type="tentacled",
        ),
    )
    add_idle_animation(root, amplitude=0.026)
    return root


def main() -> None:
    args = parse_args()
    for path in (args.output_glb, args.output_blend, args.preview):
        ensure_parent(path)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_character(args.face_texture, args.robe_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.28),
        camera_location=(2.8, -5.2, 2.9),
        preview_accent=(0.48, 0.38, 1.0),
    )
    print("TAKOSAN_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
