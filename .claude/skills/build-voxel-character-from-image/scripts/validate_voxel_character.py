"""Validate an imported GLB against the shared voxel-character rig contract."""

from __future__ import annotations

import argparse
import os
import sys

import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from voxel_character_kit import RIG_NODES, RIG_SCHEMA  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--rig-type", choices=("biped", "tentacled", "custom"), default="custom")
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def main() -> None:
    args = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(args.input))
    names = {obj.name for obj in bpy.context.scene.objects}
    required = [RIG_NODES["primary_arm"]]
    if args.rig_type == "biped":
        required.extend(
            (
                RIG_NODES["secondary_arm"],
                RIG_NODES["left_leg"],
                RIG_NODES["right_leg"],
            )
        )
    missing = [name for name in required if name not in names]
    if missing:
        raise RuntimeError(f"Missing voxel rig nodes: {', '.join(missing)}")
    if args.rig_type == "tentacled" and not any(
        name.startswith(RIG_NODES["locomotion_prefix"]) for name in names
    ):
        raise RuntimeError("Tentacled rigs need at least one VoxelRig_Locomotion_* node")
    schemas = [obj.get("voxel_rig_schema") for obj in bpy.context.scene.objects]
    if RIG_SCHEMA not in schemas:
        raise RuntimeError(f"Missing rig schema metadata: {RIG_SCHEMA}")
    print("VOXEL_CHARACTER_VALID", os.path.abspath(args.input))
    print("VOXEL_RIG_TYPE", args.rig_type)
    print("VOXEL_RIG_NODES", ",".join(sorted(name for name in names if name.startswith("VoxelRig_"))))


if __name__ == "__main__":
    main()
