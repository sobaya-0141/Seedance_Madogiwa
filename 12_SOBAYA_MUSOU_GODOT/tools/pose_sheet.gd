extends SceneTree
## 動作確認用: そば屋の攻撃モーションを、横・斜め前から何コマか撮って並べる（ゲームには使わない）。
## godot --path . -s tools/pose_sheet.gd -- --anims=Hybrid_MugPunch,Hybrid_MugHook --out=<dir> [--attacks]
##   --attacks: player.gd の COMBO / CHARGE を、ゲームと同じ姿勢補正（Player.apply_attack_pose）付きで撮る

const PlayerScript := preload("res://player.gd")

var out_dir := ""
var items: Array = []   # [name, anim, speed, attack(Dictionary or null)]
var player: Node3D
var cam: Camera3D
var frame := 0
var item_i := 0
var phase_i := 0
const PHASES := [0.0, 0.2, 0.35, 0.5, 0.65, 0.85]


func _initialize() -> void:
	var anims: Array = []
	var attacks := false
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--anims="):
			anims = a.substr(8).split(",")
		elif a.begins_with("--out="):
			out_dir = a.substr(6)
		elif a == "--attacks":
			attacks = true
	if attacks:
		for i in PlayerScript.COMBO.size():
			items.append(["combo%d" % (i + 1), PlayerScript.COMBO[i].anim, PlayerScript.COMBO[i].speed, PlayerScript.COMBO[i]])
		items.append(["charge", PlayerScript.CHARGE.anim, PlayerScript.CHARGE.speed, PlayerScript.CHARGE])
	for n in anims:
		items.append([n, n, 1.0, null])
	var root := Node3D.new()
	get_root().add_child(root)
	var env := WorldEnvironment.new()
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR
	env.environment.background_color = Color(0.55, 0.56, 0.6)
	env.environment.ambient_light_color = Color(1, 1, 1)
	env.environment.ambient_light_energy = 0.6
	root.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-40, 30, 0)
	root.add_child(sun)
	var floor_mesh := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(10, 10)
	floor_mesh.mesh = pm
	root.add_child(floor_mesh)
	player = PlayerScript.new()
	root.add_child(player)
	player.set_process(false)
	cam = Camera3D.new()
	cam.fov = 40.0
	root.add_child(cam)
	cam.look_at_from_position(Vector3(4.2, 1.4, 1.8), Vector3(0, 0.95, 0.4), Vector3.UP)
	get_root().size = Vector2i(480, 540)


func _process(_delta: float) -> bool:
	frame += 1
	if frame < 5:
		return false
	if item_i >= items.size():
		return true
	var it: Array = items[item_i]
	var anim: AnimationPlayer = player.anim
	var length: float = anim.get_animation(it[1]).length
	if phase_i == 0 and frame % 3 == 0:
		anim.play(it[1], 0.0, 1.0)
	var p: float = PHASES[phase_i]
	anim.seek(length * p, true)
	player.facing = 0.0
	player.body.rotation = Vector3.ZERO
	player.body.position = Vector3.ZERO
	if it[3] != null and player.has_method("apply_attack_pose") and not OS.get_cmdline_user_args().has("--no-pose"):
		player.apply_attack_pose(it[3], p)
		player.attack_pose.weight = 1.0
	if frame % 3 == 2:
		var img := get_root().get_texture().get_image()
		img.save_png("%s/%s_%d.png" % [out_dir, it[0], phase_i])
		phase_i += 1
		if phase_i >= PHASES.size():
			phase_i = 0
			item_i += 1
	return false
