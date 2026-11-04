extends Node3D
## ゲームのひな形（godot-game スキルが作成）。シーン・UI・入力はコードで組み立てる（main.tscn はルートだけ）。
## models/sobaya_hq.glb と models/beer_mug.glb があれば、ジョッキを持ったそば屋を立たせる。

const FONT_PATH := "res://fonts/MPLUSRounded1c-ExtraBold.ttf"
const SOBAYA_PATH := "res://models/sobaya_hq.glb"
const MUG_PATH := "res://models/beer_mug.glb"

var jp_font: Font
var camera: Camera3D
var sobaya: Node3D
var t := 0.0

# 動作確認用: godot --path . -- --shot=out.png --frames=120 [--snap=30,60] [--auto]
var shot_path := ""
var shot_frame := 120
var snap_frames: Array[int] = []
var frame_count := 0
var auto_play := false


func _ready() -> void:
	# ブラウザ版では端末のフォントが使えないので、同梱の日本語フォント（OFL）を使う
	jp_font = load(FONT_PATH)
	_parse_debug_args()
	_setup_input()
	_build_environment()
	_build_floor()
	if ResourceLoader.exists(SOBAYA_PATH):
		sobaya = _spawn_sobaya()
		add_child(sobaya)
	camera = Camera3D.new()
	camera.fov = 55.0
	add_child(camera)
	camera.position = Vector3(0.0, 2.2, 4.5)
	camera.look_at(Vector3(0.0, 1.1, 0.0))
	_build_ui()


func _setup_input() -> void:
	_add_action("move_left", [_key(KEY_A), _axis(JOY_AXIS_LEFT_X, -1.0)])
	_add_action("move_right", [_key(KEY_D), _axis(JOY_AXIS_LEFT_X, 1.0)])
	_add_action("move_up", [_key(KEY_W), _axis(JOY_AXIS_LEFT_Y, -1.0)])
	_add_action("move_down", [_key(KEY_S), _axis(JOY_AXIS_LEFT_Y, 1.0)])
	_add_action("action", [_key(KEY_J), _key(KEY_SPACE), _button(JOY_BUTTON_A)])


func _add_action(action: StringName, events: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action, 0.25)
	for ev: InputEvent in events:
		InputMap.action_add_event(action, ev)


func _key(code: Key) -> InputEventKey:
	var ev := InputEventKey.new()
	ev.physical_keycode = code
	return ev


func _button(index: JoyButton) -> InputEventJoypadButton:
	var ev := InputEventJoypadButton.new()
	ev.button_index = index
	return ev


func _axis(axis: JoyAxis, value: float) -> InputEventJoypadMotion:
	var ev := InputEventJoypadMotion.new()
	ev.axis = axis
	ev.axis_value = value
	return ev


func _build_environment() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	var sky := Sky.new()
	sky.sky_material = sky_mat
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.6
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.ssao_enabled = true          # Web版（Compatibility）では無効になる
	env.glow_enabled = true
	env.glow_intensity = 0.35
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52.0, -30.0, 0.0)
	sun.shadow_enabled = true
	add_child(sun)


func _build_floor() -> void:
	var mesh := PlaneMesh.new()
	mesh.size = Vector2(30.0, 30.0)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.7, 0.68, 0.64)
	mesh.material = m
	var floor_inst := MeshInstance3D.new()
	floor_inst.mesh = mesh
	add_child(floor_inst)


## 高品質版そば屋（スケルトン＋収録アニメ）にジョッキを持たせる。ジョッキはそば屋のNG要素なので必ず付ける。
## 本体にジョッキは無く、右手の PropSocket.R に外付けする。Godot は glTF の透過に対応しないので材質を置き換える。
func _spawn_sobaya() -> Node3D:
	var model: Node3D = load(SOBAYA_PATH).instantiate()
	var skeleton: Skeleton3D = model.find_children("*", "Skeleton3D", true, false)[0]
	var anim: AnimationPlayer = model.find_children("*", "AnimationPlayer", true, false)[0]
	anim.get_animation("Hybrid_MugHold").loop_mode = Animation.LOOP_LINEAR
	anim.play("Hybrid_MugHold")
	var body := model.find_child("SobayaV3Body", true, false) as MeshInstance3D
	var grip_idx := body.find_blend_shape_by_name("MugGrip")
	if grip_idx >= 0:
		body.set_blend_shape_value(grip_idx, 1.0)   # 持ち手を握った手の形
	if ResourceLoader.exists(MUG_PATH):
		var socket := BoneAttachment3D.new()
		socket.bone_name = "PropSocket.R"
		skeleton.add_child(socket)
		var mug: Node3D = load(MUG_PATH).instantiate()
		socket.add_child(mug)
		var grip := mug.find_child("Grip", true, false) as Node3D
		mug.transform = grip.transform.affine_inverse()   # 持ち手（Grip）を手のソケットに合わせる
		var glass := StandardMaterial3D.new()
		glass.albedo_color = Color(0.92, 0.97, 1.0, 0.22)
		glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		glass.roughness = 0.05
		var beer := StandardMaterial3D.new()
		beer.albedo_color = Color(0.85, 0.56, 0.13)
		beer.roughness = 0.25
		for mi: MeshInstance3D in mug.find_children("*", "MeshInstance3D", true, false):
			match String(mi.name):
				"GlassBody", "Handle":
					mi.material_override = glass
				"BeerVolume", "LiquidSurface":
					mi.material_override = beer
				"Carbonation":
					mi.visible = false
	return model


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var label := Label.new()
	label.text = ProjectSettings.get_setting("application/config/name")
	label.add_theme_font_override("font", jp_font)
	label.add_theme_font_size_override("font_size", 40)
	label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	label.add_theme_constant_override("outline_size", 10)
	label.position = Vector2(32, 24)
	layer.add_child(label)


func _process(raw_delta: float) -> void:
	# タブ切り替えや処理落ちで1フレームが長くなっても計算が破綻しないよう上限を設ける（Web版で重要）
	var delta := minf(raw_delta, 1.0 / 20.0)
	t += delta
	if sobaya:
		var inp := Input.get_vector("move_left", "move_right", "move_up", "move_down")
		sobaya.position += Vector3(inp.x, 0.0, inp.y) * 3.0 * delta
		if inp.length() > 0.1:
			sobaya.rotation.y = atan2(inp.x, inp.y)
	_debug()


# ---------------------------------------------------------------- 動作確認用

func _parse_debug_args() -> void:
	for a in OS.get_cmdline_user_args():
		if a == "--auto":
			auto_play = true
		elif a.begins_with("--shot="):
			shot_path = a.substr(7)
		elif a.begins_with("--frames="):
			shot_frame = a.substr(9).to_int()
		elif a.begins_with("--snap="):
			for f in a.substr(7).split(","):
				snap_frames.append(f.to_int())


func _debug() -> void:
	if shot_path.is_empty():
		return
	frame_count += 1
	if frame_count in snap_frames:
		get_viewport().get_texture().get_image().save_png(shot_path.get_basename() + "_%d.png" % frame_count)
	if frame_count == shot_frame:
		get_viewport().get_texture().get_image().save_png(shot_path)
		get_tree().quit()
