#!/usr/bin/env python3
"""Inspect a binary GLB without Blender and enforce portable asset gates."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import struct


RIG_REQUIREMENTS = {
    "biped": {
        "VoxelRig_ArmPrimary",
        "VoxelRig_ArmSecondary",
        "VoxelRig_LegLeft",
        "VoxelRig_LegRight",
    },
    "tentacled": {"VoxelRig_ArmPrimary"},
    "custom": set(),
}


def read_glb(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError("File is too small to be a GLB")
    magic, version, declared_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2:
        raise ValueError("Expected a glTF 2.0 binary GLB")
    if declared_length != len(data):
        raise ValueError(f"Declared length {declared_length} differs from file size {len(data)}")
    offset = 12
    document = None
    while offset < len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == 0x4E4F534A:
            document = json.loads(chunk.rstrip(b"\x00 \t\r\n").decode("utf-8"))
    if document is None:
        raise ValueError("GLB has no JSON chunk")
    return document


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--rig-type", choices=tuple(RIG_REQUIREMENTS), default="custom")
    parser.add_argument("--min-embedded-images", type=int, default=0)
    args = parser.parse_args()
    document = read_glb(args.input)
    node_names = {node.get("name") for node in document.get("nodes", []) if node.get("name")}
    missing = sorted(RIG_REQUIREMENTS[args.rig_type] - node_names)
    if missing:
        raise SystemExit(f"Missing rig nodes: {', '.join(missing)}")
    if args.rig_type == "tentacled" and not any(
        name.startswith("VoxelRig_Locomotion_") for name in node_names
    ):
        raise SystemExit("Tentacled rig has no VoxelRig_Locomotion_* node")
    images = document.get("images", [])
    embedded_images = sum("bufferView" in image for image in images)
    if embedded_images < args.min_embedded_images:
        raise SystemExit(
            f"Expected at least {args.min_embedded_images} embedded images, found {embedded_images}"
        )
    report = {
        "file": str(args.input.resolve()),
        "nodes": len(document.get("nodes", [])),
        "meshes": len(document.get("meshes", [])),
        "materials": len(document.get("materials", [])),
        "images": len(images),
        "embedded_images": embedded_images,
        "animations": [animation.get("name", "") for animation in document.get("animations", [])],
        "rig_nodes": sorted(name for name in node_names if name.startswith("VoxelRig_")),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
