"""Shared Blender helpers and rig contract for reusable voxel characters.

Character builders own silhouette, materials, accessories, and proportions.
This module owns the lightweight rigid-part rig that Three.js can animate
without an armature or skinned meshes.
"""

from __future__ import annotations

from dataclasses import dataclass

import bpy


RIG_SCHEMA = "voxel-character-rig/v1"
RIG_NODES = {
    "primary_arm": "VoxelRig_ArmPrimary",
    "secondary_arm": "VoxelRig_ArmSecondary",
    "left_leg": "VoxelRig_LegLeft",
    "right_leg": "VoxelRig_LegRight",
    "locomotion_prefix": "VoxelRig_Locomotion_",
    "primary_hand_socket": "VoxelRig_PrimaryHandSocket",
}


@dataclass(frozen=True)
class RigGroup:
    pivot: tuple[float, float, float]
    prefixes: tuple[str, ...]


@dataclass(frozen=True)
class VoxelRigDefinition:
    primary_arm: RigGroup
    secondary_arm: RigGroup | None = None
    left_leg: RigGroup | None = None
    right_leg: RigGroup | None = None
    locomotion: tuple[RigGroup, ...] = ()
    primary_hand_socket_local: tuple[float, float, float] | None = None
    rig_type: str = "biped"


def ensure_parent(path: str) -> None:
    import os

    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float = 0.78,
    metallic: float = 0.0,
    emission: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Alpha"].default_value = color[3]
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if color[3] < 1.0:
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "DITHERED"
        elif hasattr(mat, "blend_method"):
            mat.blend_method = "BLEND"
    return mat


def add_empty(name: str, location: tuple[float, float, float], parent=None) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def add_box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    parent=None,
    bevel: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dimensions
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel > 0.0:
        modifier = obj.modifiers.new("VoxelEdge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        modifier.affect = "EDGES"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    if parent:
        obj.parent = parent
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    return obj


def group_parts(
    root: bpy.types.Object,
    name: str,
    pivot_location: tuple[float, float, float],
    prefixes: tuple[str, ...],
) -> bpy.types.Object:
    """Place rigid voxel parts under a rotation pivot without moving them."""
    pivot = add_empty(name, pivot_location, root)
    bpy.context.view_layer.update()
    for obj in list(root.children):
        if obj is pivot or not obj.name.startswith(prefixes):
            continue
        world_matrix = obj.matrix_world.copy()
        obj.parent = pivot
        obj.matrix_world = world_matrix
    bpy.context.view_layer.update()
    return pivot


def build_voxel_rig(
    root: bpy.types.Object,
    definition: VoxelRigDefinition,
) -> dict[str, bpy.types.Object]:
    """Attach the standard optional-channel rig to character parts."""
    root["voxel_rig_schema"] = RIG_SCHEMA
    root["voxel_rig_type"] = definition.rig_type
    root["voxel_actions"] = "walk,smash"

    rig = {
        "primary_arm": group_parts(
            root,
            RIG_NODES["primary_arm"],
            definition.primary_arm.pivot,
            definition.primary_arm.prefixes,
        ),
    }
    if definition.secondary_arm:
        rig["secondary_arm"] = group_parts(
            root,
            RIG_NODES["secondary_arm"],
            definition.secondary_arm.pivot,
            definition.secondary_arm.prefixes,
        )
    if definition.left_leg:
        rig["left_leg"] = group_parts(
            root,
            RIG_NODES["left_leg"],
            definition.left_leg.pivot,
            definition.left_leg.prefixes,
        )
    if definition.right_leg:
        rig["right_leg"] = group_parts(
            root,
            RIG_NODES["right_leg"],
            definition.right_leg.pivot,
            definition.right_leg.prefixes,
        )
    for index, locomotion_group in enumerate(definition.locomotion):
        rig[f"locomotion_{index}"] = group_parts(
            root,
            f"{RIG_NODES['locomotion_prefix']}{index:02d}",
            locomotion_group.pivot,
            locomotion_group.prefixes,
        )
    if definition.primary_hand_socket_local:
        socket = add_empty(
            RIG_NODES["primary_hand_socket"],
            definition.primary_hand_socket_local,
            rig["primary_arm"],
        )
        socket["voxel_socket"] = "primary_hand"
        rig["primary_hand_socket"] = socket
    return rig
