"""Shared Blender helpers for rigid-part voxel characters and GLB export."""

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
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Alpha"].default_value = color[3]
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def make_texture_material(
    name: str,
    path: str,
    *,
    image_name: str,
    roughness: float = 0.70,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
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
    if emission_strength > 0.0:
        mat.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emission_strength
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
    material: bpy.types.Material,
    *,
    parent=None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dimensions
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    return obj


def add_textured_front_panel(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    edge_material: bpy.types.Material,
    surface_material: bpy.types.Material,
    *,
    parent=None,
    uv_name: str = "VoxelFrontUV",
    uv_bounds: tuple[float, float, float, float] = (0.0, 0.0, 1.0, 1.0),
) -> bpy.types.Object:
    width, _depth, height = dimensions
    panel = add_box(name, location, dimensions, edge_material, parent=parent)
    panel.data.materials.append(surface_material)
    uv_layer = panel.data.uv_layers.active or panel.data.uv_layers.new(name=uv_name)
    u_min, v_min, u_max, v_max = uv_bounds
    for polygon in panel.data.polygons:
        if polygon.normal.y < -0.9:
            polygon.material_index = 1
            for loop_index in polygon.loop_indices:
                vertex = panel.data.vertices[panel.data.loops[loop_index].vertex_index].co
                uv_layer.data[loop_index].uv = (
                    u_min + (0.5 + vertex.x / width) * (u_max - u_min),
                    v_min + (0.5 + vertex.z / height) * (v_max - v_min),
                )
    return panel


def group_parts(
    root: bpy.types.Object,
    name: str,
    pivot_location: tuple[float, float, float],
    prefixes: tuple[str, ...],
) -> bpy.types.Object:
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


def build_voxel_rig(root: bpy.types.Object, definition: VoxelRigDefinition) -> None:
    root["voxel_rig_schema"] = RIG_SCHEMA
    root["voxel_rig_type"] = definition.rig_type
    root["voxel_actions"] = "walk,smash"
    primary = group_parts(
        root,
        RIG_NODES["primary_arm"],
        definition.primary_arm.pivot,
        definition.primary_arm.prefixes,
    )
    optional = (
        (definition.secondary_arm, RIG_NODES["secondary_arm"]),
        (definition.left_leg, RIG_NODES["left_leg"]),
        (definition.right_leg, RIG_NODES["right_leg"]),
    )
    for group, name in optional:
        if group:
            group_parts(root, name, group.pivot, group.prefixes)
    for index, group in enumerate(definition.locomotion):
        group_parts(root, f"{RIG_NODES['locomotion_prefix']}{index:02d}", group.pivot, group.prefixes)
    if definition.primary_hand_socket_local:
        socket = add_empty(
            RIG_NODES["primary_hand_socket"],
            definition.primary_hand_socket_local,
            primary,
        )
        socket["voxel_socket"] = "primary_hand"


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
) -> None:
    ground_material = make_material("PreviewGround", (0.055, 0.07, 0.082, 1.0), roughness=0.95)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0.0, 0.0, -0.012))
    ground = bpy.context.active_object
    ground.name = "Preview_Ground"
    ground.data.materials.append(ground_material)
    for name, location, energy, size, color in (
        ("Preview_Key", (-2.7, -3.6, 4.4), 1050, 3.2, (1.0, 0.78, 0.60)),
        ("Preview_Fill", (2.8, -1.6, 2.8), 780, 2.5, (0.48, 0.60, 1.0)),
        ("Preview_Rim", (0.0, 2.0, 4.0), 900, 2.0, (0.75, 0.90, 1.0)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.active_object
        light.name = name
        light.data.energy = energy
        light.data.size = size
        light.data.color = color
    bpy.ops.object.camera_add(location=camera_location)
    camera = bpy.context.active_object
    camera.name = "Preview_Camera"
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 60
    bpy.context.scene.camera = camera
    scene = bpy.context.scene
    engines = {item.identifier for item in scene.bl_rna.properties["render"].fixed_type.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.abspath(preview_path)
    if scene.world is None:
        scene.world = bpy.data.worlds.new("VoxelPreviewWorld")
    scene.world.color = (0.012, 0.018, 0.027)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def save_and_export(
    *,
    output_glb: str,
    output_blend: str,
    preview: str,
    preview_target: tuple[float, float, float],
    camera_location: tuple[float, float, float],
) -> None:
    setup_preview(preview, target=preview_target, camera_location=camera_location)
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith("Preview_"):
            bpy.data.objects.remove(obj, do_unlink=True)
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
