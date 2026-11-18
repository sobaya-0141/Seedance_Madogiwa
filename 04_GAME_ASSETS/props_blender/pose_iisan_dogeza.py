"""いーさんの Tripo モデル（リグ付き）に土下座のポーズを付けて撮る。
blender --background --python pose_iisan_dogeza.py -- <out_prefix> [手のひねりの追加角度] [--close]
blender --background --python pose_iisan_dogeza.py -- --export-anim <out.glb>
  土下座の動き（立つ → 正座 → 土下座、アクション名 "Dogeza"・24fps で約0.5秒）を付けたモデルを GLB で書き出す
  （ゲームの隠しボス用。元の iisan.glb は変えない）
骨は Mixamo（mixamorig:*）。モデルは身長約1m、正面は -Y、上は +Z。"""
import bpy, math, sys
from mathutils import Vector, Matrix, Quaternion

ARGS = sys.argv[sys.argv.index("--") + 1:]
EXPORT_ANIM = ARGS[ARGS.index("--export-anim") + 1] if "--export-anim" in ARGS else ""
OUT = "" if EXPORT_ANIM else ARGS[0]
HAND_ROLL = float(ARGS[1]) if not EXPORT_ANIM and len(ARGS) > 1 and ARGS[1] != "--close" else 0.0
ONLY_CLOSE = "--close" in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/Users/kenji.shimoju/Documents/private/Seedance_Madogiwa/04_GAME_ASSETS/models3d/tripo/iisan.glb")
for o in list(bpy.data.objects):
    if o.type == "MESH" and o.name.startswith("Icosphere"):
        bpy.data.objects.remove(o)
arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
body = [o for o in bpy.data.objects if o.type == "MESH"][0]
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="POSE")
P = lambda n: arm.pose.bones["mixamorig:" + n]
W = arm.matrix_world


def upd():
    bpy.context.view_layer.update()


def aim(name, d, roll=0.0):
    """骨の向き（付け根→先）を、世界座標の向き d にする（最小の回転）。roll は骨の軸まわりの追加の回転（度）"""
    pb = P(name)
    m = W @ pb.matrix
    cur = (m.to_3x3() @ Vector((0, 1, 0))).normalized()
    q = cur.rotation_difference(Vector(d).normalized())
    rot = q.to_matrix()
    if roll:
        rot = Matrix.Rotation(math.radians(roll), 3, Vector(d).normalized()) @ rot
    nm = Matrix.Translation(m.translation) @ (rot @ m.to_3x3()).to_4x4()
    pb.matrix = W.inverted() @ nm
    upd()


def place(name, pos):
    pb = P(name)
    m = W @ pb.matrix
    m.translation = Vector(pos)
    pb.matrix = W.inverted() @ m
    upd()


def head_of(name):
    return W @ P(name).head


def tail_of(name):
    return W @ P(name).tail


def lowest_z(cond):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    me = ev.to_mesh()
    zs = [(ev.matrix_world @ v.co) for v in me.vertices]
    zs = [v.z for v in zs if cond(v)]
    ev.to_mesh_clear()
    return min(zs) if zs else 1.0


def pose_body(hip_z, bend):
    """腰の高さ hip_z と、背中を前へ倒す量 bend（0〜1）で、脚・背中・首・頭を決める"""
    place("Hips", (0.0, 0.17, hip_z))
    aim("Hips", (0, -0.55, 0.83))
    for s, x in (("Left", 0.065), ("Right", -0.065)):
        knee = Vector((x, 0.0, 0.035))
        aim(s + "UpLeg", knee - head_of(s + "UpLeg"))
        aim(s + "Leg", (0, 1, 0.05))
        aim(s + "Foot", (0, 1, -0.15))
        aim(s + "ToeBase", (0, 1, -0.05))
    # 背中はほぼ水平に前へ伸ばし（シートの土下座）、首を前へ出して頭を床へ下ろす
    angs = (0.42, 0.12 - bend * 0.08, -0.12 - bend * 0.15, -0.55 - bend * 0.3, -1.05 - bend * 0.35)
    for n, a in zip(("Spine", "Spine1", "Spine2", "Neck", "Head"), angs):
        aim(n, (0, -math.cos(a), math.sin(a)))


# 額が床（z ≒ 0.01）に触れるまで、腰を下げながら背中を前へ倒していく
hz = 1.0
for step in range(16):
    hip_z = 0.22 - step * 0.005
    bend = step / 15
    pose_body(hip_z, bend)
    hz = lowest_z(lambda v: v.y < -0.05 and abs(v.x) < 0.08 and v.z < 0.3)
    if hz < 0.012:
        break
print("BODY step", step, "lowest head", round(hz, 4))


def front_y():
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    me = ev.to_mesh()
    ys = [(ev.matrix_world @ v.co) for v in me.vertices]
    ys = [v.y for v in ys if abs(v.x) < 0.07 and v.z < 0.04]
    ev.to_mesh_clear()
    return min(ys)


HEAD_FRONT_Y = front_y()   # 額のいちばん前（手はこの少し前に置く）
print("HEAD_FRONT_Y", round(HEAD_FRONT_Y, 3))
# 腕: ひじを外へ張って床近くに下ろし、前腕と手のひらを床につける（指先をそろえて前へ）
for s, sx in (("Left", 1.0), ("Right", -1.0)):
    # 2本の骨の IK: 手首を頭の前の床に置き、ひじは外・上へ逃がす
    sh = head_of(s + "Arm")
    a_len = (tail_of(s + "Arm") - sh).length
    b_len = (tail_of(s + "ForeArm") - head_of(s + "ForeArm")).length
    # 手は顔の下: 額が手の甲のすぐ手前に来るよう、手首を額の少し後ろ・左右に置き、指先を前へ
    wrist = Vector((sx * 0.07, HEAD_FRONT_Y + 0.07, 0.006))
    to_t = wrist - sh
    dist = min(to_t.length, (a_len + b_len) * 0.999)
    dvec = to_t.normalized()
    pole = Vector((sx * 1.0, 0.0, 0.35))
    pole = (pole - dvec * pole.dot(dvec)).normalized()
    cos_h = max(-1.0, min(1.0, (a_len * a_len + dist * dist - b_len * b_len) / (2 * a_len * dist)))
    elbow = sh + dvec * a_len * cos_h + pole * a_len * math.sqrt(max(0.0, 1 - cos_h * cos_h))
    aim(s + "Arm", elbow - sh)
    aim(s + "ForeArm", (sh + dvec * dist) - head_of(s + "ForeArm"))
    aim(s + "Hand", (-sx * 0.25, -1, -0.02))
    # 手のひらを下へ: 人差し指→小指の付け根の並びを、水平で外向き（親指が体の内側）にそろえる
    pb = P(s + "Hand")
    m = W @ pb.matrix
    axis = (m.to_3x3() @ Vector((0, 1, 0))).normalized()
    across = (head_of(s + "HandPinky1") - head_of(s + "HandIndex1"))
    want = Vector((-sx, 0, 0))
    def flat(v):
        return (v - axis * v.dot(axis)).normalized()
    ang = flat(across).angle(flat(want))
    sign = 1.0 if axis.dot(flat(across).cross(flat(want))) > 0 else -1.0
    rot = Matrix.Rotation(sign * ang + math.radians(HAND_ROLL + (180.0 if s == "Right" else 0.0)), 3, axis)
    pb.matrix = W.inverted() @ (Matrix.Translation(m.translation) @ (rot @ m.to_3x3()).to_4x4())
    upd()
    # 指をそろえてまっすぐ前へ伸ばす（手のひらを床につける）
    for f in ("Index", "Middle", "Ring", "Pinky"):
        for i in (1, 2, 3):
            aim(f"{s}Hand{f}{i}", (-sx * 0.2, -1, -0.03))
    for i in (1, 2, 3):
        aim(f"{s}HandThumb{i}", (-sx * 0.8, -0.6, -0.03))

if EXPORT_ANIM:
    # 土下座のポーズ（いま付いているもの）を覚え、正座のポーズを作ってから、立ち → 正座 → 土下座のキーを打つ
    bones = list(arm.pose.bones)
    dogeza = {pb.name: pb.matrix_basis.copy() for pb in bones}

    def clear():
        for pb in bones:
            pb.matrix_basis = Matrix.Identity(4)
        upd()

    clear()
    # 正座: 膝をつき、腰をかかとの上に下ろして背すじを伸ばす。頭は少し下げる（土下座の直前）
    place("Hips", (0.0, 0.15, 0.3))
    aim("Hips", (0, -0.05, 1))
    for s, x in (("Left", 0.065), ("Right", -0.065)):
        knee = Vector((x, -0.05, 0.035))
        aim(s + "UpLeg", knee - head_of(s + "UpLeg"))
        aim(s + "Leg", (0, 1, 0.05))
        aim(s + "Foot", (0, 1, -0.15))
        aim(s + "ToeBase", (0, 1, -0.05))
    for n, d in (("Spine", (0, -0.1, 1)), ("Spine1", (0, -0.15, 1)), ("Spine2", (0, -0.2, 1)), ("Neck", (0, -0.35, 1)), ("Head", (0, -0.5, 0.86))):
        aim(n, d)
    kneel = {pb.name: pb.matrix_basis.copy() for pb in bones}
    clear()
    act = bpy.data.actions.new("Dogeza")
    arm.animation_data_create()
    arm.animation_data.action = act
    for frame, pose in ((1, None), (7, kneel), (13, dogeza)):
        for pb in bones:
            pb.rotation_mode = "QUATERNION"
            pb.matrix_basis = pose[pb.name] if pose else Matrix.Identity(4)
        upd()
        for pb in bones:
            pb.keyframe_insert("location", frame=frame)
            pb.keyframe_insert("rotation_quaternion", frame=frame)
    bpy.context.scene.frame_start, bpy.context.scene.frame_end = 1, 13
    bpy.context.scene.render.fps = 24
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.export_scene.gltf(filepath=EXPORT_ANIM, export_format="GLB", export_animations=True,
                              export_animation_mode="ACTIONS", export_force_sampling=True, export_yup=True)
    print("EXPORTED", EXPORT_ANIM)
    sys.exit(0)

bpy.ops.object.mode_set(mode="OBJECT")

# 測定: 変形後のメッシュで、全体・手・頭・膝の一番低い点
dg = bpy.context.evaluated_depsgraph_get()
ev = body.evaluated_get(dg)
me = ev.to_mesh()
vs = [ev.matrix_world @ v.co for v in me.vertices]
def lowest(cond):
    zs = [v.z for v in vs if cond(v)]
    return round(min(zs), 4) if zs else None
print("MEASURE all", lowest(lambda v: True))
print("MEASURE hands", lowest(lambda v: v.y < -0.19 and abs(v.x) > 0.03))
print("MEASURE head", lowest(lambda v: v.y < -0.1 and abs(v.x) < 0.06 and v.y > -0.25))
print("MEASURE knees", lowest(lambda v: abs(v.y) < 0.04))
print("MEASURE headfront", round(min(v.y for v in vs if abs(v.x) < 0.06 and v.z < 0.08), 4))
print("MEASURE handsback", round(max(v.y for v in vs if abs(v.x) > 0.03 and v.z < 0.05 and v.y < -0.1), 4) if any(abs(v.x) > 0.03 and v.z < 0.05 and v.y < -0.1 for v in vs) else None)
ev.to_mesh_clear()

# 撮影: 明るい灰色の床と背景。真横（左が頭）と、斜め前の2枚
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = 2000, 1250
w = bpy.data.worlds.new("w"); w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.93, 0.93, 0.94, 1)
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
sc.world = w
bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
fl = bpy.context.active_object
fm = bpy.data.materials.new("floor"); fm.use_nodes = True
fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1)
fl.data.materials.append(fm)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(40), math.radians(10), math.radians(30))
sc.collection.objects.link(sun)
area = bpy.data.objects.new("fill", bpy.data.lights.new("fill", "AREA"))
area.data.energy = 120; area.data.size = 3
area.location = (-1.5, -1.5, 1.6); area.rotation_euler = (math.radians(55), 0, math.radians(-45))
sc.collection.objects.link(area)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50
target = Vector((0, -0.05, 0.13))
shots = (("side", (1.55, -0.08, 0.3)), ("front", (-0.95, -1.15, 0.55)), ("close", (0.75, -0.55, 0.12)))
if ONLY_CLOSE:
    shots = (("top", (0.0, -0.6, 0.9)),)
    sc.render.resolution_x, sc.render.resolution_y = 600, 400
for tag, loc in shots:
    cam.location = loc
    cam.rotation_euler = (target - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = f"{OUT}_{tag}.png"
    bpy.ops.render.render(write_still=True)
