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
    for segment, (x, y, z, rotation_z) in enumerate(points):
        size = 0.29 - segment * 0.035
        add_box(
            f"{prefix}Segment_{segment}",
            (x, y, z),
            (size, 0.34, 0.25),
            robe,
            rotation=(0.0, 0.0, rotation_z),
            parent=root,
            bevel=0.025,
        )
        if segment > 0:
            add_box(
                f"{prefix}Sucker_{segment}",
                (x, y - 0.19, z - 0.025),
                (size * 0.48, 0.035, 0.09),
                underside,
                rotation=(0.0, 0.0, rotation_z),
                parent=root,
                bevel=0.012,
            )
    x, y, _, _ = points[0]
    return RigGroup((x, y, 0.66), (prefix,))


def build_character(face_texture: str) -> bpy.types.Object:
    robe = make_material("TakosanVoxel_Robe", (0.035, 0.052, 0.067, 1.0), roughness=0.8)
    robe_mid = make_material("TakosanVoxel_RobeMid", (0.075, 0.095, 0.11, 1.0), roughness=0.84)
    robe_edge = make_material("TakosanVoxel_RobeEdge", (0.14, 0.17, 0.18, 1.0), roughness=0.75)
    hand = make_material("TakosanVoxel_Hands", (0.64, 0.72, 0.73, 1.0), roughness=0.86)
    underside = make_material("TakosanVoxel_TentacleUnderside", (0.33, 0.39, 0.40, 1.0), roughness=0.9)
    face_surface = make_texture_material(
        "TakosanVoxel_FaceSurface",
        face_texture,
        image_name="TakosanVoxel_FaceAlbedo",
        roughness=0.72,
    )

    root = add_empty("TakosanVoxel_Root", (0.0, 0.0, 0.0))
    root["character"] = "Takosan"
    root["style"] = "hooded tentacled voxel caricature"
    root["design_locks"] = "black hooded robe,tentacles,human arms,white face,round black eyes"
    root["face_workflow"] = "replaceable front-panel albedo texture"

    # Six tentacles form a readable base from the fixed game camera.
    tentacle_specs = (
        ((-0.38, -0.03, 0.50, -0.12), (-0.62, -0.10, 0.31, -0.50), (-0.78, -0.12, 0.22, -0.82)),
        ((-0.16, -0.10, 0.47, -0.03), (-0.21, -0.15, 0.25, -0.14), (-0.30, -0.17, 0.14, -0.30)),
        ((0.16, -0.10, 0.47, 0.03), (0.21, -0.15, 0.25, 0.14), (0.30, -0.17, 0.14, 0.30)),
        ((0.38, -0.03, 0.50, 0.12), (0.62, -0.10, 0.31, 0.50), (0.78, -0.12, 0.22, 0.82)),
        ((-0.50, 0.18, 0.48, -0.15), (-0.72, 0.22, 0.29, -0.55), (-0.86, 0.22, 0.21, -0.88)),
        ((0.50, 0.18, 0.48, 0.15), (0.72, 0.22, 0.29, 0.55), (0.86, 0.22, 0.21, 0.88)),
    )
    locomotion = tuple(
        add_tentacle(root, index, points, robe, underside)
        for index, points in enumerate(tentacle_specs)
    )

    # Layered robe and hood retain the simple black silhouette.
    add_box("TakosanVoxel_RobeLower", (0.0, 0.0, 0.78), (1.22, 0.68, 0.54), robe, parent=root, bevel=0.05)
    add_box("TakosanVoxel_RobeUpper", (0.0, 0.0, 1.20), (1.02, 0.60, 0.62), robe_mid, parent=root, bevel=0.04)
    add_box("TakosanVoxel_HoodBack", (0.0, 0.02, 1.72), (0.94, 0.62, 0.85), robe, parent=root, bevel=0.08)
    add_box("TakosanVoxel_HoodTop", (0.0, 0.02, 2.15), (0.62, 0.52, 0.20), robe, parent=root, bevel=0.05)
    add_box("TakosanVoxel_HoodLeft", (-0.40, -0.26, 1.72), (0.18, 0.16, 0.72), robe_edge, parent=root, bevel=0.03)
    add_box("TakosanVoxel_HoodRight", (0.40, -0.26, 1.72), (0.18, 0.16, 0.72), robe_edge, parent=root, bevel=0.03)
    add_box("TakosanVoxel_HoodBrow", (0.0, -0.28, 2.03), (0.68, 0.15, 0.16), robe_edge, parent=root, bevel=0.03)
    add_textured_front_panel(
        "TakosanVoxel_FacePanel",
        (0.0, -0.355, 1.74),
        (0.72, 0.045, 0.60),
        robe_edge,
        face_surface,
        parent=root,
        uv_name="TakosanVoxelFaceUV",
    )

    # Stepped robe glyphs echo the curled decoration in the reference image.
    for side in (-1, 1):
        for index in range(3):
            add_box(
                f"TakosanVoxel_RobeGlyph_{side}_{index}",
                (side * (0.26 + index * 0.055), -0.326, 1.20 - index * 0.11),
                (0.20 - index * 0.03, 0.035, 0.065),
                robe_edge,
                rotation=(0.0, 0.0, side * (0.35 + index * 0.22)),
                parent=root,
                bevel=0.008,
            )

    # Human arms remain visually separate from the tentacle locomotion rig.
    add_box("TakosanVoxel_PrimarySleeve", (0.62, 0.0, 1.38), (0.30, 0.48, 0.40), robe_mid, parent=root, bevel=0.035)
    add_box("TakosanVoxel_PrimaryForearm", (0.69, -0.04, 1.10), (0.23, 0.28, 0.34), hand, parent=root, bevel=0.028)
    add_box("TakosanVoxel_PrimaryHand", (0.72, -0.09, 0.89), (0.27, 0.27, 0.24), hand, parent=root, bevel=0.04)
    add_box("TakosanVoxel_SecondarySleeve", (-0.62, 0.0, 1.38), (0.30, 0.48, 0.40), robe_mid, parent=root, bevel=0.035)
    add_box("TakosanVoxel_SecondaryForearm", (-0.69, -0.04, 1.10), (0.23, 0.28, 0.34), hand, parent=root, bevel=0.028)
    add_box("TakosanVoxel_SecondaryHand", (-0.72, -0.09, 0.89), (0.27, 0.27, 0.24), hand, parent=root, bevel=0.04)

    build_voxel_rig(
        root,
        VoxelRigDefinition(
            primary_arm=RigGroup(
                (0.54, 0.0, 1.56),
                ("TakosanVoxel_Primary",),
            ),
            secondary_arm=RigGroup(
                (-0.54, 0.0, 1.56),
                ("TakosanVoxel_Secondary",),
            ),
            locomotion=locomotion,
            primary_hand_socket_local=(0.18, -0.09, -0.67),
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
    build_character(args.face_texture)
    save_and_export(
        output_glb=args.output_glb,
        output_blend=args.output_blend,
        preview=args.preview,
        preview_target=(0.0, 0.0, 1.12),
        camera_location=(2.65, -4.8, 2.65),
        preview_accent=(0.48, 0.38, 1.0),
    )
    print("TAKOSAN_VOXEL_BUILD_COMPLETE", os.path.abspath(args.output_glb))


if __name__ == "__main__":
    main()
