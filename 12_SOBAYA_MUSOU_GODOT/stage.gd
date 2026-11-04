extends Node3D
## ステージ: ゴールデン麦酒 第一工場（架空）。+Z が入口、-Z へ進む。
## 正門ヤード → シャッター1 → 倉庫 → シャッター2 → 製造ライン（奥にできたてビールの出荷口）。

const HALF_WIDTH := 14.0
const START_Z := 8.0
const SHUTTER_Z := [-30.0, -62.0]
const END_Z := -98.0
const GOAL_POS := Vector3(0.0, 0.0, -93.0)

const FLOOR_SHADER := """
shader_type spatial;
uniform vec3 base_color : source_color = vec3(0.56, 0.57, 0.58);
varying vec3 world_pos;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void vertex() { world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec2 cell = floor(world_pos.xz / 2.0);
	float n = hash(cell) * 0.06;
	vec2 f = fract(world_pos.xz / 2.0);
	float seam = step(0.985, max(f.x, f.y));
	// 通路の黄色い安全ライン
	float lane = step(abs(abs(world_pos.x) - 3.8), 0.08);
	vec3 col = base_color + n - seam * 0.12;
	col = mix(col, vec3(0.95, 0.78, 0.12), lane);
	ALBEDO = col;
	ROUGHNESS = 0.8;
}
"""

const SHUTTER_SHADER := """
shader_type spatial;
varying vec3 local_pos;
void vertex() { local_pos = VERTEX; }
void fragment() {
	float slat = step(0.5, fract(local_pos.y * 3.0));
	vec3 col = mix(vec3(0.62, 0.64, 0.66), vec3(0.52, 0.54, 0.56), slat);
	// 下端の黄黒ストライプ
	float stripe = step(0.5, fract((local_pos.x + local_pos.y) * 1.2));
	if (local_pos.y < -2.4) col = mix(vec3(0.95, 0.75, 0.1), vec3(0.1), stripe);
	ALBEDO = col;
	METALLIC = 0.6;
	ROUGHNESS = 0.45;
}
"""

var jp_font: Font
var obstacles: Array[Rect2] = []          # 当たり判定（床の上の矩形）。ナビメッシュもここから作る
var obstacle_heights: Array[float] = []   # 同じ順番で高さ。カメラの遮蔽判定に使う
var shutters: Array[Node3D] = []
var bottles: MultiMeshInstance3D
var bottle_t := 0.0
var goal_glow: OmniLight3D


func build(font: Font) -> void:
	jp_font = font
	_build_lighting()
	_build_shell()
	_build_yard()
	_build_warehouse()
	_build_line()


func _build_lighting() -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.35, 0.55, 0.85)
	sky_mat.sky_horizon_color = Color(0.85, 0.82, 0.76)
	sky_mat.ground_horizon_color = Color(0.85, 0.82, 0.76)
	var sky := Sky.new()
	sky.sky_material = sky_mat
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.adjustment_enabled = true
	env.adjustment_contrast = 1.1
	env.adjustment_saturation = 1.15
	env.ssao_enabled = true
	env.glow_enabled = true
	env.glow_intensity = 0.4
	env.glow_hdr_threshold = 1.1
	env.fog_enabled = true
	env.fog_light_color = Color(0.82, 0.78, 0.7)
	env.fog_density = 0.006
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-58.0, 28.0, 0.0)
	sun.light_color = Color(1.0, 0.94, 0.84)
	sun.light_energy = 1.3
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 45.0
	add_child(sun)


func _build_shell() -> void:
	var length := START_Z - END_Z + 6.0
	var floor_mesh := PlaneMesh.new()
	floor_mesh.size = Vector2(HALF_WIDTH * 2.0 + 4.0, length + 20.0)
	var fm := ShaderMaterial.new()
	fm.shader = _shader(FLOOR_SHADER)
	floor_mesh.material = fm
	var floor_inst := MeshInstance3D.new()
	floor_inst.mesh = floor_mesh
	floor_inst.position = Vector3(0.0, 0.0, (START_Z + END_Z) * 0.5)
	add_child(floor_inst)
	# 側壁（工場の外壁）と柱
	for side: float in [-1.0, 1.0]:
		_box(Vector3(1.0, 8.0, length), Vector3(side * (HALF_WIDTH + 0.5), 4.0, (START_Z + END_Z) * 0.5 - 1.0), Color(0.78, 0.74, 0.66))
		var z := START_Z - 4.0
		while z > END_Z:
			_box(Vector3(0.6, 8.2, 0.6), Vector3(side * HALF_WIDTH, 4.1, z), Color(0.35, 0.38, 0.42))
			z -= 8.0
	_box(Vector3(HALF_WIDTH * 2.0 + 2.0, 8.0, 1.0), Vector3(0.0, 4.0, END_Z - 0.5), Color(0.72, 0.68, 0.6))
	# 正門（後ろ）
	for side: float in [-1.0, 1.0]:
		_box(Vector3(1.2, 4.0, 1.2), Vector3(side * 6.0, 2.0, START_Z + 1.5), Color(0.55, 0.52, 0.48))
	_box(Vector3(13.2, 1.2, 0.6), Vector3(0.0, 4.4, START_Z + 1.5), Color(0.15, 0.2, 0.35))
	_sign("ゴールデン麦酒 第一工場", Vector3(0.0, 4.4, START_Z + 1.18), 110, Color(1.0, 0.85, 0.35), PI)
	# シャッター
	for i in SHUTTER_Z.size():
		var sz: float = SHUTTER_Z[i]
		var shutter := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(HALF_WIDTH * 2.0, 5.6, 0.3)
		var sm := ShaderMaterial.new()
		sm.shader = _shader(SHUTTER_SHADER)
		mesh.material = sm
		shutter.mesh = mesh
		shutter.position = Vector3(0.0, 2.8, sz)
		add_child(shutter)
		shutters.append(shutter)
		_box(Vector3(HALF_WIDTH * 2.0 + 1.0, 1.6, 0.8), Vector3(0.0, 6.4, sz), Color(0.3, 0.32, 0.36))
		_sign(["倉庫 → 関係者以外立入禁止", "製造ライン → 関係者以外立入禁止"][i], Vector3(0.0, 6.4, sz + 0.42), 80, Color(1, 1, 1), 0.0)


func _build_yard() -> void:
	# トラック2台
	for tx: float in [-8.5, 8.5]:
		var z := -14.0 if tx < 0.0 else -20.0
		_box(Vector3(2.6, 3.0, 7.0), Vector3(tx, 1.9, z), Color(0.92, 0.92, 0.9))
		_box(Vector3(2.6, 2.4, 2.0), Vector3(tx, 1.5, z + 4.6), Color(0.85, 0.65, 0.15))
		_box(Vector3(2.2, 0.9, 0.05), Vector3(tx, 2.1, z + 5.62), Color(0.2, 0.3, 0.4), Color(0.3, 0.45, 0.6), 0.4)
		_sign("ゴールデン麦酒", Vector3(tx + (1.32 if tx > 0.0 else -1.32), 2.2, z), 90, Color(0.75, 0.5, 0.05), PI * 0.5 * (1.0 if tx > 0.0 else -1.0))
		for wz: float in [z - 2.2, z + 2.0, z + 4.6]:
			for wx: float in [-1.35, 1.35]:
				var wheel := _cyl(0.45, 0.4, Vector3(tx + wx, 0.45, wz), Color(0.08, 0.08, 0.08))
				wheel.rotation.z = PI * 0.5
		_obstacle(Rect2(tx - 1.4, z - 3.6, 2.8, 9.4), 3.4)
	# ビールケースのパレット
	for p: Vector3 in [Vector3(-4.0, 0, -6.0), Vector3(5.0, 0, -4.0), Vector3(-2.5, 0, -24.0), Vector3(3.5, 0, -26.0)]:
		_pallet(p, 2 + randi() % 2)


func _pallet(p: Vector3, layers: int) -> void:
	_box(Vector3(1.6, 0.15, 1.6), p + Vector3(0, 0.08, 0), Color(0.6, 0.45, 0.28))
	for l in layers:
		for cx in 2:
			for cz in 2:
				_box(Vector3(0.75, 0.38, 0.75), p + Vector3(-0.39 + cx * 0.78, 0.36 + l * 0.4, -0.39 + cz * 0.78), Color(0.95, 0.72, 0.1) if (l + cx + cz) % 2 == 0 else Color(0.85, 0.2, 0.15))
	_obstacle(Rect2(p.x - 0.85, p.z - 0.85, 1.7, 1.7), 0.4 + layers * 0.4)


func _build_warehouse() -> void:
	# 背の高い棚の列（間を通路にする）
	for sx: float in [-10.5, -6.0, 6.0, 10.5]:
		for sz: float in [-38.0, -50.0]:
			_box(Vector3(1.4, 4.5, 8.0), Vector3(sx, 2.25, sz), Color(0.25, 0.4, 0.65))
			for l in 3:
				for k in 5:
					_box(Vector3(1.2, 0.8, 1.3), Vector3(sx, 0.6 + l * 1.4, sz - 3.2 + k * 1.6), Color(0.95, 0.72, 0.1) if (k + l) % 2 == 0 else Color(0.6, 0.45, 0.28))
			_obstacle(Rect2(sx - 0.75, sz - 4.05, 1.5, 8.1), 4.5)
	# 樽の山
	for k: Vector3 in [Vector3(-1.5, 0, -44.0), Vector3(1.8, 0, -56.0)]:
		for i in 3:
			_cyl(0.42, 0.95, k + Vector3((i - 1) * 0.9, 0.48, 0.0), Color(0.75, 0.77, 0.8), 0.8)
		_obstacle(Rect2(k.x - 1.4, k.z - 0.5, 2.8, 1.0), 1.0)


func _build_line() -> void:
	# 仕込みタンク
	for tx: float in [-11.6, 11.6]:
		for tz: float in [-70.0, -80.0, -90.0]:
			_cyl(1.8, 7.0, Vector3(tx, 3.5, tz), Color(0.8, 0.82, 0.85), 0.85)
			_cyl(0.25, 1.2, Vector3(tx, 7.6, tz), Color(0.6, 0.62, 0.65), 0.8)
			_obstacle(Rect2(tx - 1.85, tz - 1.85, 3.7, 3.7), 7.0)
	_sign("第1醸造ライン", Vector3(-9.75, 4.5, -70.0), 100, Color(0.1, 0.15, 0.3), PI * 0.5)
	_sign("第2醸造ライン", Vector3(9.75, 4.5, -70.0), 100, Color(0.1, 0.15, 0.3), -PI * 0.5)
	# 充填ベルトコンベア（左右2本。中央は通路）
	for cx: float in [-4.8, 4.8]:
		# 手前と奥を空けて、中央の通路と外側の通路を行き来できるようにする
		_box(Vector3(1.4, 0.9, 18.0), Vector3(cx, 0.45, -77.0), Color(0.3, 0.32, 0.36))
		_box(Vector3(1.2, 0.06, 18.0), Vector3(cx, 0.93, -77.0), Color(0.12, 0.12, 0.13))
		_obstacle(Rect2(cx - 0.75, -86.0, 1.5, 18.0), 0.9)
	# コンベアの上を流れる瓶
	var bottle := CylinderMesh.new()
	bottle.top_radius = 0.05
	bottle.bottom_radius = 0.08
	bottle.height = 0.36
	var bm := StandardMaterial3D.new()
	bm.albedo_color = Color(0.45, 0.25, 0.05)
	bm.roughness = 0.2
	bm.metallic_specular = 0.9
	bottle.material = bm
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = bottle
	mm.instance_count = 60
	bottles = MultiMeshInstance3D.new()
	bottles.multimesh = mm
	add_child(bottles)
	# 出荷口（ゴール）: 金色に光る「できたて」の樽
	_box(Vector3(3.6, 0.2, 2.4), GOAL_POS + Vector3(0, 0.1, 0), Color(0.6, 0.45, 0.28))
	for i in 3:
		_cyl(0.5, 1.1, GOAL_POS + Vector3((i - 1) * 1.1, 0.75, 0.0), Color(1.0, 0.78, 0.25), 0.9, 0.6)
	_sign("できたてビール 出荷口", GOAL_POS + Vector3(0, 3.2, -1.2), 110, Color(1.0, 0.9, 0.5), 0.0)
	goal_glow = OmniLight3D.new()
	goal_glow.light_color = Color(1.0, 0.8, 0.35)
	goal_glow.light_energy = 0.0
	goal_glow.omni_range = 7.0
	goal_glow.position = GOAL_POS + Vector3(0, 2.0, 0.5)
	add_child(goal_glow)
	_obstacle(Rect2(GOAL_POS.x - 1.9, GOAL_POS.z - 1.3, 3.8, 2.6), 1.3)
	# 工場の照明
	var z := -66.0
	while z > -96.0:
		var lamp := OmniLight3D.new()
		lamp.light_color = Color(1.0, 0.85, 0.6)
		lamp.light_energy = 1.2
		lamp.omni_range = 10.0
		lamp.position = Vector3(0.0, 6.0, z)
		add_child(lamp)
		z -= 9.0


func _obstacle(r: Rect2, height: float) -> void:
	obstacles.append(r)
	obstacle_heights.append(height)


## 点 p が障害物の中（高さ以下）にあるか
func blocks_view(p: Vector3) -> bool:
	for i in obstacles.size():
		if p.y < obstacle_heights[i] and obstacles[i].has_point(Vector2(p.x, p.z)):
			return true
	return false


func update(delta: float) -> void:
	bottle_t += delta
	var mm := bottles.multimesh
	for i in mm.instance_count:
		var side := -4.8 if i % 2 == 0 else 4.8
		var u := fmod(bottle_t * 1.2 + i * 0.6, 18.0)
		mm.set_instance_transform(i, Transform3D(Basis(), Vector3(side, 1.14, -68.0 - u)))


func open_shutter(i: int) -> void:
	var tw := create_tween()
	tw.tween_property(shutters[i], "position:y", 8.6, 1.6).set_trans(Tween.TRANS_SINE)


func close_all() -> void:
	for s in shutters:
		s.position.y = 2.8


func light_goal(on: bool) -> void:
	goal_glow.light_energy = 3.0 if on else 0.0


func _box(size: Vector3, pos: Vector3, color: Color, emission := Color.BLACK, emission_energy := 0.0) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var inst := MeshInstance3D.new()
	inst.mesh = mesh
	inst.material_override = _mat(color, 0.0, emission, emission_energy)
	inst.position = pos
	add_child(inst)
	return inst


func _cyl(radius: float, height: float, pos: Vector3, color: Color, metallic := 0.0, emission := 0.0) -> MeshInstance3D:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	var inst := MeshInstance3D.new()
	inst.mesh = mesh
	inst.material_override = _mat(color, metallic, color, emission)
	inst.position = pos
	add_child(inst)
	return inst


func _mat(color: Color, metallic := 0.0, emission := Color.BLACK, emission_energy := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.metallic = metallic
	m.roughness = 0.35 if metallic > 0.0 else 0.75
	if emission_energy > 0.0:
		m.emission_enabled = true
		m.emission = emission
		m.emission_energy_multiplier = emission_energy
	return m


func _sign(text: String, pos: Vector3, size: int, color: Color, yaw: float) -> void:
	var l := Label3D.new()
	l.text = text
	l.font = jp_font
	l.font_size = size
	l.pixel_size = 0.006
	l.modulate = color
	l.outline_size = 12
	l.outline_modulate = Color(0, 0, 0, 0.6)
	l.position = pos
	l.rotation.y = yaw
	add_child(l)


func _shader(code: String) -> Shader:
	var s := Shader.new()
	s.code = code
	return s
