import argparse
import sys

import bpy
from mathutils import Vector


def world_bounds(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    mins = tuple(min(corner[i] for corner in corners) for i in range(3))
    maxs = tuple(max(corner[i] for corner in corners) for i in range(3))
    return mins, maxs


parser = argparse.ArgumentParser()
parser.add_argument("--input", required=True)
script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
args = parser.parse_args(script_args)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args.input)

for obj in bpy.context.scene.objects:
    if obj.type in {"MESH", "ARMATURE"}:
        print(
            "INSPECT_OBJECT",
            obj.name,
            obj.type,
            "location=",
            tuple(round(value, 4) for value in obj.location),
            "scale=",
            tuple(round(value, 4) for value in obj.scale),
            "bounds=",
            tuple(tuple(round(value, 4) for value in point) for point in world_bounds(obj)),
        )

for armature in [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]:
    for bone_name in [
        "Head",
        "neck_01",
        "clavicle_l",
        "upperarm_l",
        "lowerarm_l",
        "hand_l",
        "clavicle_r",
        "upperarm_r",
        "lowerarm_r",
        "hand_r",
        "spine_03",
        "pelvis",
    ]:
        bone = armature.data.bones.get(bone_name)
        if bone:
            head = armature.matrix_world @ bone.head_local
            tail = armature.matrix_world @ bone.tail_local
            print(
                "INSPECT_BONE",
                bone_name,
                "head=",
                tuple(round(value, 4) for value in head),
                "tail=",
                tuple(round(value, 4) for value in tail),
                "rest_euler=",
                tuple(round(value, 4) for value in bone.matrix_local.to_euler()),
            )
