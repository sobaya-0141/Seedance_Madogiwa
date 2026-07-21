"""Shared Blender helpers and rig contract for reusable voxel characters.

Character builders own silhouette, materials, accessories, and proportions.
This module owns the lightweight rigid-part rig that Three.js can animate
without an armature or skinned meshes.
"""

from __future__ import annotations

from dataclasses import dataclass
import os

import bpy
from mathutils import Vector


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


def make_texture_material(
    name: str,
    path: str,
    *,
    image_name: str,
    roughness: float = 0.62,
) -> bpy.types.Material:
    """Create an embedded sRGB albedo material for replaceable face art."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness
    image = bpy.data.images.load(os.path.abspath(path), check_existing=True)
    image.name = image_name
    image.colorspace_settings.name = "sRGB"
    image.pack()
    texture = mat.node_tree.nodes.new("ShaderNodeTexImage")
    texture.name = f"{image_name}_Texture"
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "EXTEND"
    mat.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
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


def add_textured_front_panel(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    edge_mat: bpy.types.Material,
    surface_mat: bpy.types.Material,
    *,
    parent=None,
    uv_name: str = "VoxelFaceUV",
) -> bpy.types.Object:
    """Build a thin box whose camera-facing -Y side displays one full texture."""
    width, _depth, height = dimensions
    panel = add_box(name, location, dimensions, edge_mat, parent=parent)
    panel.data.materials.append(surface_mat)
    uv_layer = panel.data.uv_layers.active or panel.data.uv_layers.new(name=uv_name)
    for polygon in panel.data.polygons:
        if polygon.normal.y < -0.9:
            polygon.material_index = 1
            for loop_index in polygon.loop_indices:
                vertex = panel.data.vertices[panel.data.loops[loop_index].vertex_index].co
                uv_layer.data[loop_index].uv = (
                    0.5 + vertex.x / width,
                    0.5 + vertex.z / height,
                )
    return panel


def add_cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    vertices: int = 8,
    parent=None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    return obj


def add_torus(
    name: str,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    mat: bpy.types.Material,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    parent=None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=12,
        minor_segments=4,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
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


def add_idle_animation(root: bpy.types.Object, amplitude: float = 0.018) -> None:
    root.animation_data_create()
    action = bpy.data.actions.new("Idle")
    root.animation_data.action = action
    for frame, height in ((1, 0.0), (15, amplitude), (30, 0.0)):
        root.location.z = height
        root.keyframe_insert(data_path="location", frame=frame)
    action.frame_start = 1
    action.frame_end = 30
    action.use_fake_user = True
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 30
    bpy.context.scene.frame_set(1)


def setup_preview(
    preview_path: str,
    *,
    target: tuple[float, float, float],
    camera_location: tuple[float, float, float],
    accent: tuple[float, float, float] = (0.42, 0.70, 1.0),
) -> None:
    ground_mat = make_material("PreviewGround", (0.055, 0.07, 0.082, 1.0), roughness=0.95)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0.0, 0.0, -0.012))
    ground = bpy.context.active_object
    ground.name = "Preview_Ground"
    ground.data.materials.append(ground_mat)

    bpy.ops.object.light_add(type="AREA", location=(-2.7, -3.6, 4.4))
    key = bpy.context.active_object
    key.name = "Preview_Key"
    key.data.energy = 1050
    key.data.shape = "DISK"
    key.data.size = 3.2
    key.data.color = (1.0, 0.78, 0.60)

    bpy.ops.object.light_add(type="AREA", location=(2.8, -1.6, 2.8))
    fill = bpy.context.active_object
    fill.name = "Preview_Fill"
    fill.data.energy = 780
    fill.data.size = 2.5
    fill.data.color = accent

    bpy.ops.object.light_add(type="AREA", location=(0.0, 2.0, 4.0))
    rim = bpy.context.active_object
    rim.name = "Preview_Rim"
    rim.data.energy = 900
    rim.data.size = 2.0
    rim.data.color = (0.75, 0.90, 1.0)

    bpy.ops.object.camera_add(location=camera_location)
    camera = bpy.context.active_object
    camera.name = "Preview_Camera"
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 60
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    engine_ids = {item.identifier for item in scene.bl_rna.properties["render"].fixed_type.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engine_ids else "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.abspath(preview_path)
    if scene.world is None:
        scene.world = bpy.data.worlds.new("VoxelCharacterPreviewWorld")
    scene.world.color = (0.012, 0.018, 0.027)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def remove_preview_objects() -> None:
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith("Preview_"):
            bpy.data.objects.remove(obj, do_unlink=True)


def save_and_export(
    *,
    output_glb: str,
    output_blend: str,
    preview: str,
    preview_target: tuple[float, float, float],
    camera_location: tuple[float, float, float],
    preview_accent: tuple[float, float, float],
) -> None:
    setup_preview(
        preview,
        target=preview_target,
        camera_location=camera_location,
        accent=preview_accent,
    )
    remove_preview_objects()
    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(output_blend))
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(output_glb),
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_materials="EXPORT",
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )
