"""Build the reusable Sobaya character from Quaternius' CC0 superhero base.

Run with Blender:
  blender --background --python tools/build_sobaya_model.py -- \
    --input /path/to/Superhero_Male_FullBody.gltf \
    --mask-texture model_source/textures/sobaya_mask_albedo.png \
    --output-glb public/models/sobaya.glb \
    --output-blend model_source/sobaya_master.blend \
    --preview model_source/sobaya_preview.png
"""

from __future__ import annotations

import argparse
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--mask-texture", required=True)
    parser.add_argument("--output-glb", required=True)
    parser.add_argument("--output-blend", required=True)
    parser.add_argument("--preview", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def ensure_parent(path: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)


def material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float = 0.7,
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
        # Blender 5 uses surface_render_method; older versions use blend_method.
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "DITHERED"
        elif hasattr(mat, "blend_method"):
            mat.blend_method = "BLEND"
    return mat


def texture_material(
    name: str,
    texture_path: str,
    *,
    roughness: float = 0.38,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (1.0, 1.0, 1.0, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness

    image = bpy.data.images.load(os.path.abspath(texture_path), check_existing=True)
    image.name = "SobayaMask_Albedo"
    image.colorspace_settings.name = "sRGB"
    image.pack()
    texture = mat.node_tree.nodes.new("ShaderNodeTexImage")
    texture.name = "SobayaMask_AlbedoTexture"
    texture.image = image
    texture.interpolation = "Linear"
    texture.extension = "EXTEND"
    mat.node_tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def smooth(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def parent_to_bone(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    # Primitive helpers set scale immediately before parenting. Force a depsgraph
    # update so matrix_world contains that scale instead of Blender's stale unit
    # matrix; otherwise every decorative sphere becomes two metres wide.
    bpy.context.view_layer.update()
    world_matrix = obj.matrix_world.copy()
    obj.parent = armature
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world_matrix


def add_uv_sphere(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    segments: int = 32,
    rings: int = 20,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        location=location,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    smooth(obj)
    return obj


def add_cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    *,
    vertices: int = 32,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    smooth(obj)
    return obj


def add_torus(
    name: str,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    mat: bpy.types.Material,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=32,
        minor_segments=10,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    smooth(obj)
    return obj


def polygon_center(mesh: bpy.types.Mesh, polygon: bpy.types.MeshPolygon) -> Vector:
    center = Vector((0.0, 0.0, 0.0))
    for vertex_index in polygon.vertices:
        center += mesh.vertices[vertex_index].co
    return center / max(len(polygon.vertices), 1)


def front_project_uv(obj: bpy.types.Object) -> None:
    """Project the mask's X/Z silhouette over the complete square texture."""
    mesh = obj.data
    uv_layer = mesh.uv_layers.active or mesh.uv_layers.new(name="SobayaMaskUV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            vertex = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            uv_layer.data[loop_index].uv = (
                max(0.0, min(1.0, 0.5 + vertex.x * 0.5)),
                max(0.0, min(1.0, 0.5 + vertex.z * 0.5)),
            )


def recolor_body(
    body: bpy.types.Object,
    skin: bpy.types.Material,
    shirt: bpy.types.Material,
    shorts: bpy.types.Material,
    sock: bpy.types.Material,
    shoe: bpy.types.Material,
) -> None:
    body.data.materials.clear()
    for mat in [skin, shirt, shorts, sock, shoe]:
        body.data.materials.append(mat)

    for polygon in body.data.polygons:
        center = polygon_center(body.data, polygon)
        x, _y, z = center
        abs_x = abs(x)
        material_index = 0

        if z < 0.105:
            material_index = 4
        elif z < 0.23:
            material_index = 3
        elif 0.69 < z < 1.06 and abs_x < 0.39:
            material_index = 2
        elif 1.00 < z < 1.53 and abs_x < 0.39:
            material_index = 1
        elif z > 1.31 and abs_x < 0.46:
            material_index = 1

        polygon.material_index = material_index


def rotate_pose_bone_global(
    armature: bpy.types.Object,
    bone_name: str,
    axis: str,
    radians: float,
) -> None:
    bpy.context.view_layer.update()
    pose_bone = armature.pose.bones.get(bone_name)
    if pose_bone is None:
        raise RuntimeError(f"Missing pose bone: {bone_name}")
    pivot = pose_bone.head.copy()
    rotation = Matrix.Rotation(radians, 4, axis)
    pose_bone.matrix = (
        Matrix.Translation(pivot)
        @ rotation
        @ Matrix.Translation(-pivot)
        @ pose_bone.matrix
    )
    bpy.context.view_layer.update()


def pose_character(armature: bpy.types.Object) -> list[str]:
    rotate_pose_bone_global(armature, "upperarm_l", "Y", math.radians(62))
    rotate_pose_bone_global(armature, "lowerarm_l", "X", math.radians(-42))
    rotate_pose_bone_global(armature, "upperarm_r", "Y", math.radians(-58))
    rotate_pose_bone_global(armature, "lowerarm_r", "X", math.radians(-68))
    rotate_pose_bone_global(armature, "hand_l", "X", math.radians(12))
    rotate_pose_bone_global(armature, "hand_r", "X", math.radians(-18))
    return [
        "upperarm_l",
        "lowerarm_l",
        "upperarm_r",
        "lowerarm_r",
        "hand_l",
        "hand_r",
    ]


def create_idle_action(armature: bpy.types.Object, posed_bones: list[str]) -> None:
    armature.animation_data_create()
    action = bpy.data.actions.new("Idle")
    armature.animation_data.action = action
    for frame in (1, 30):
        for bone_name in posed_bones:
            pose_bone = armature.pose.bones[bone_name]
            pose_bone.rotation_mode = "QUATERNION"
            pose_bone.keyframe_insert(
                data_path="rotation_quaternion",
                frame=frame,
                group=bone_name,
            )
    pelvis = armature.pose.bones.get("pelvis")
    if pelvis:
        pelvis.location.z = 0.0
        pelvis.keyframe_insert(data_path="location", frame=1, group="pelvis")
        pelvis.location.z = 0.008
        pelvis.keyframe_insert(data_path="location", frame=15, group="pelvis")
        pelvis.location.z = 0.0
        pelvis.keyframe_insert(data_path="location", frame=30, group="pelvis")
    action.frame_start = 1
    action.frame_end = 30
    action.use_fake_user = True
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 30
    bpy.context.scene.frame_set(1)


def create_mask(
    armature: bpy.types.Object,
    mask_edge: bpy.types.Material,
    mask_surface: bpy.types.Material,
) -> None:
    edge = add_uv_sphere(
        "SobayaMask_Rim",
        (0.0, -0.137, 1.698),
        (0.122, 0.046, 0.166),
        mask_edge,
        segments=40,
        rings=28,
    )
    parent_to_bone(edge, armature, "Head")

    mask = add_uv_sphere(
        "SobayaMask",
        (0.0, -0.151, 1.699),
        (0.116, 0.041, 0.159),
        mask_surface,
        segments=48,
        rings=32,
    )
    front_project_uv(mask)
    parent_to_bone(mask, armature, "Head")


def create_hair(armature: bpy.types.Object, hair_material: bpy.types.Material) -> None:
    cap = add_uv_sphere(
        "SobayaHair_Cap",
        (0.0, 0.002, 1.793),
        (0.128, 0.105, 0.082),
        hair_material,
        segments=32,
        rings=20,
    )
    parent_to_bone(cap, armature, "Head")

    spike_specs: list[tuple[float, float, float, float, float, float]] = []
    for row, z in enumerate((1.803, 1.833, 1.858)):
        count = (9, 7, 4)[row]
        radius_x = (0.106, 0.082, 0.045)[row]
        radius_y = (0.075, 0.055, 0.025)[row]
        for index in range(count):
            angle = (index / count) * math.tau + row * 0.29
            spike_specs.append(
                (
                    math.cos(angle) * radius_x,
                    math.sin(angle) * radius_y - 0.004,
                    z + (index % 2) * 0.006,
                    math.sin(angle) * 0.28,
                    -math.cos(angle) * 0.30,
                    0.075 + (index % 3) * 0.012,
                )
            )

    for index, (x, y, z, rx, ry, depth) in enumerate(spike_specs):
        bpy.ops.mesh.primitive_cone_add(
            vertices=7,
            radius1=0.026,
            radius2=0.006,
            depth=depth,
            location=(x, y, z),
            rotation=(rx, ry, (index % 3 - 1) * 0.15),
        )
        spike = bpy.context.active_object
        spike.name = f"SobayaHair_Spike_{index:02d}"
        spike.data.materials.append(hair_material)
        parent_to_bone(spike, armature, "Head")

    for index, x in enumerate((-0.085, -0.045, 0.0, 0.045, 0.085)):
        bpy.ops.mesh.primitive_cone_add(
            vertices=7,
            radius1=0.023,
            radius2=0.004,
            depth=0.085 + (index % 2) * 0.012,
            location=(x, -0.084, 1.803 - abs(x) * 0.12),
            rotation=(math.radians(58), x * -1.8, x * -1.4),
        )
        fringe = bpy.context.active_object
        fringe.name = f"SobayaHair_Fringe_{index:02d}"
        fringe.data.materials.append(hair_material)
        parent_to_bone(fringe, armature, "Head")


def create_clothing_details(
    armature: bpy.types.Object,
    shirt: bpy.types.Material,
    shirt_shadow: bpy.types.Material,
) -> None:
    collar = add_torus(
        "SobayaShirt_Collar",
        (0.0, 0.018, 1.505),
        0.118,
        0.016,
        shirt_shadow,
    )
    collar.scale.y = 0.78
    parent_to_bone(collar, armature, "spine_03")

    for side, bone_name in ((1, "upperarm_l"), (-1, "upperarm_r")):
        sleeve = add_uv_sphere(
            f"SobayaShirt_Sleeve_{side}",
            (side * 0.275, 0.056, 1.456),
            (0.155, 0.115, 0.135),
            shirt,
            segments=24,
            rings=16,
        )
        parent_to_bone(sleeve, armature, bone_name)


def create_mug(
    armature: bpy.types.Object,
    amber: bpy.types.Material,
    foam_material: bpy.types.Material,
    glass_material: bpy.types.Material,
) -> None:
    hand_bone = armature.pose.bones["hand_l"]
    bpy.context.view_layer.update()
    hand_world = armature.matrix_world @ hand_bone.head
    mug_center = hand_world + Vector((0.015, -0.055, -0.09))

    beer = add_cylinder(
        "SobayaMug_Beer",
        tuple(mug_center),
        0.068,
        0.17,
        amber,
        vertices=32,
    )
    parent_to_bone(beer, armature, "hand_l")

    glass = add_cylinder(
        "SobayaMug_Glass",
        tuple(mug_center),
        0.075,
        0.185,
        glass_material,
        vertices=32,
    )
    glass.scale.x = 1.02
    glass.scale.y = 1.02
    parent_to_bone(glass, armature, "hand_l")

    rim = add_torus(
        "SobayaMug_Rim",
        tuple(mug_center + Vector((0.0, 0.0, 0.094))),
        0.073,
        0.008,
        glass_material,
    )
    parent_to_bone(rim, armature, "hand_l")

    handle = add_torus(
        "SobayaMug_Handle",
        tuple(mug_center + Vector((0.078, 0.0, 0.0))),
        0.052,
        0.010,
        glass_material,
        rotation=(math.radians(90), 0.0, 0.0),
    )
    handle.scale.z = 1.25
    parent_to_bone(handle, armature, "hand_l")

    foam_positions = [
        (-0.038, -0.020, 0.097),
        (0.0, -0.025, 0.102),
        (0.038, -0.018, 0.096),
        (-0.022, 0.018, 0.102),
        (0.022, 0.020, 0.105),
    ]
    for index, offset in enumerate(foam_positions):
        foam = add_uv_sphere(
            f"SobayaMug_Foam_{index}",
            tuple(mug_center + Vector(offset)),
            (0.029, 0.026, 0.023),
            foam_material,
            segments=16,
            rings=10,
        )
        parent_to_bone(foam, armature, "hand_l")


def setup_preview(preview_path: str) -> None:
    ground_material = material("PreviewGround", (0.07, 0.085, 0.10, 1.0), roughness=0.94)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0.0, 0.0, -0.012))
    ground = bpy.context.active_object
    ground.name = "Preview_Ground"
    ground.data.materials.append(ground_material)

    bpy.ops.object.light_add(type="AREA", location=(-2.4, -3.2, 4.3))
    key = bpy.context.active_object
    key.name = "Preview_Key"
    key.data.energy = 900
    key.data.shape = "DISK"
    key.data.size = 3.0
    key.data.color = (1.0, 0.82, 0.65)

    bpy.ops.object.light_add(type="AREA", location=(2.8, -1.8, 2.5))
    fill = bpy.context.active_object
    fill.name = "Preview_Fill"
    fill.data.energy = 700
    fill.data.size = 2.5
    fill.data.color = (0.48, 0.72, 1.0)

    bpy.ops.object.light_add(type="AREA", location=(0.0, 2.2, 3.8))
    rim = bpy.context.active_object
    rim.name = "Preview_Rim"
    rim.data.energy = 850
    rim.data.size = 2.0
    rim.data.color = (0.72, 0.88, 1.0)

    bpy.ops.object.camera_add(location=(1.7, -3.25, 1.85))
    camera = bpy.context.active_object
    camera.name = "Preview_Camera"
    target = Vector((0.0, 0.0, 0.98))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 60
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    # Blender 4.x exposed Eevee as BLENDER_EEVEE_NEXT, while the bundled
    # Blender 5 build uses BLENDER_EEVEE again. Pick the available identifier.
    engine_ids = {item.identifier for item in scene.bl_rna.properties["render"].fixed_type.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engine_ids else "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = preview_path
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Sobaya_PreviewWorld")
    scene.world.color = (0.018, 0.025, 0.04)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def remove_preview_objects() -> None:
    preview_objects = [obj for obj in bpy.context.scene.objects if obj.name.startswith("Preview_")]
    for obj in preview_objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    preview_ground = bpy.data.objects.get("Preview_Ground")
    if preview_ground:
        bpy.data.objects.remove(preview_ground, do_unlink=True)


def main() -> None:
    args = parse_args()
    for path in (args.output_glb, args.output_blend, args.preview):
        ensure_parent(path)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(args.input))

    body = bpy.data.objects.get("SuperHero_Male")
    armature = next((obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"), None)
    if body is None or armature is None:
        raise RuntimeError("Expected Quaternius superhero body and armature were not found")

    for disposable_name in ("Eyebrows", "Eyes", "Icosphere"):
        disposable = bpy.data.objects.get(disposable_name)
        if disposable:
            bpy.data.objects.remove(disposable, do_unlink=True)

    skin = material("Sobaya_Skin", (0.30, 0.34, 0.36, 1.0), roughness=0.70)
    shirt = material("Sobaya_Shirt", (0.95, 0.96, 0.94, 1.0), roughness=0.82)
    shirt_shadow = material("Sobaya_ShirtShadow", (0.70, 0.74, 0.75, 1.0), roughness=0.84)
    shorts = material("Sobaya_Shorts", (0.035, 0.045, 0.055, 1.0), roughness=0.82)
    sock = material("Sobaya_Socks", (0.82, 0.84, 0.83, 1.0), roughness=0.88)
    shoe = material("Sobaya_Shoes", (0.018, 0.022, 0.026, 1.0), roughness=0.72)
    mask_edge = material("Sobaya_MaskEdge", (0.66, 0.69, 0.70, 1.0), roughness=0.58)
    mask_surface = texture_material("Sobaya_MaskSurface", args.mask_texture, roughness=0.38)
    hair_material = material("Sobaya_Hair", (0.012, 0.016, 0.022, 1.0), roughness=0.58)
    amber = material(
        "Sobaya_Beer",
        (0.92, 0.38, 0.018, 1.0),
        roughness=0.22,
        emission=(0.28, 0.075, 0.002, 1.0),
        emission_strength=0.18,
    )
    foam_material = material("Sobaya_Foam", (1.0, 0.97, 0.83, 1.0), roughness=0.90)
    glass_material = material("Sobaya_Glass", (0.72, 0.88, 0.94, 0.22), roughness=0.14, metallic=0.08)

    body.name = "Sobaya_Body"
    body["source"] = "Quaternius Universal Base Characters (CC0 1.0)"
    body["source_url"] = "https://quaternius.com/packs/universalbasecharacters.html"
    recolor_body(body, skin, shirt, shorts, sock, shoe)
    smooth(body)

    create_mask(armature, mask_edge, mask_surface)
    create_hair(armature, hair_material)
    create_clothing_details(armature, shirt, shirt_shadow)
    posed_bones = pose_character(armature)
    create_mug(armature, amber, foam_material, glass_material)
    create_idle_action(armature, posed_bones)

    armature.name = "Sobaya_Rig"
    armature["character"] = "Sobaya"
    armature["license"] = "CC0 base; original Sobaya additions"

    setup_preview(os.path.abspath(args.preview))
    remove_preview_objects()

    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.output_blend))

    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(args.output_glb),
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )

    print("SOBAYA_BUILD_COMPLETE", os.path.abspath(args.output_glb))
    print("SOBAYA_MASTER", os.path.abspath(args.output_blend))
    print("SOBAYA_PREVIEW", os.path.abspath(args.preview))


if __name__ == "__main__":
    main()
