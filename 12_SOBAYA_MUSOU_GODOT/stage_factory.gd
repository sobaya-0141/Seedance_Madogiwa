extends "res://stage_base.gd"
## ステージ1: ゴールデン麦酒 第一工場（架空）。
## 正門ヤード → シャッター1 → 倉庫 → シャッター2 → 製造ライン（奥にできたてビールの出荷口）。

const FLOOR_SHADER := """
shader_type spatial;
//FLOOR_SAMPLERS
uniform vec3 base_color : source_color = vec3(0.6, 0.61, 0.62);
varying vec3 world_pos;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void vertex() { world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	// 塗装したコンクリートの床（テクスチャの明暗・凹凸・粗さを借りて、色は灰色に揃える）
	vec2 uv = world_pos.xz / 3.5;
	vec3 d = texture(a_diff, uv).rgb;
	vec3 arm = texture(a_arm, uv).rgb;
	float lum = dot(d, vec3(0.299, 0.587, 0.114));
	vec2 cell = floor(world_pos.xz / 4.0);
	vec3 col = base_color * (0.55 + lum * 1.3) + (hash(cell) - 0.5) * 0.04;
	vec2 f = fract(world_pos.xz / 4.0);
	float seam = step(0.992, max(f.x, f.y));
	col -= seam * 0.15;
	// 通路の黄色い安全ライン（少しかすれている）
	float lane = step(abs(abs(world_pos.x) - 3.8), 0.08) * step(0.25, lum);
	col = mix(col, vec3(0.95, 0.76, 0.1) * (0.75 + lum * 0.6), lane);
	ALBEDO = col;
	ROUGHNESS = mix(0.75, arm.g, 0.7) - lane * 0.2;
	AO = arm.r;
	NORMAL_MAP = texture(a_nor, uv).rgb;
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

const SHUTTER_Z := [-30.0, -62.0]
## コンベアのベルト面の高さ（m）。Tripo のコンベアは高さの 62% がベルト面（その上に瓶が載っている）
const BELT_H := 0.9

var bottles: MultiMeshInstance3D
var bottle_t := 0.0


func _init() -> void:
	stage_title = "ゴールデン麦酒 第一工場"
	stage_tagline = "ビールが足りない。ならば工場から直接いただくまで。\n警備員と警察官をジョッキでなぎ倒し、製造ラインのできたてビールを奪え！"
	half_width = 14.0
	camera_wall_margin = 1.8   # 正門ヤードの外壁（奥行き1m）の中へカメラが入らないようにする
	start_z = 8.0
	end_z = -98.0
	goal_pos = Vector3(0.0, 0.0, -93.0)
	zones = [
		{"name": "正門ヤード", "z_far": -30.0, "z_near": 8.0, "mix": {"guard": 1.0}, "captain": "captain", "captain_at": 14},
		{"name": "倉庫", "z_far": -62.0, "z_near": -30.0, "mix": {"guard": 0.45, "police": 0.55}, "captain": "sergeant", "captain_at": 22},
		{"name": "製造ライン", "z_far": -98.0, "z_near": -62.0, "mix": {"guard": 0.15, "police": 0.85}, "captain": "boss", "captain_at": 0},
	]
	start_line = "ビールが…足りない…！"
	goal_objective = "製造ラインのできたてビールを奪え！（出荷口で F 長押し）"
	goal_banner = "警部 撃破！"
	goal_line = "ビールは目の前です！"
	win_banner = "できたてビール、確保！"
	win_result = "ビール工場 制圧完了"
	views = [[Vector3(3.0, 4.5, 6.0), Vector3(0.0, 1.0, -14.0)], [Vector3(3.0, 4.0, -33.0), Vector3(0.0, 1.0, -50.0)], [Vector3(0.0, 5.0, -63.0), Vector3(0.0, 1.5, -88.0)], [Vector3(-1.0, 2.2, -1.6), Vector3(3.0, 0.6, -6.0)]]


func _build_stage() -> void:
	# 昼: 夏の青空と雲。工場のほこりっぽいかすみ
	_build_environment({"top": Color(0.22, 0.46, 0.88), "horizon": Color(0.7, 0.8, 0.9), "clouds": 0.35,
		"sun_rot": Vector3(-52.0, 30.0, 0.0), "sun_color": Color(1.0, 0.94, 0.84), "sun_energy": 1.6, "ambient": 0.5,
		"fog": 0.003, "vol_fog": 0.0015, "vol_fog_color": Color(1.0, 0.95, 0.85)})
	_build_floor(FLOOR_SHADER, 13.0, {"a": "concrete_floor_painted"})
	_build_shell()
	_build_yard()
	_build_warehouse()
	_build_line()


func spawn_point(zone_index: int, z: Dictionary) -> Vector3:
	if zone_index == 2:
		# 製造ラインはタンクの裏に入り込まないよう、奥の中央通路から出てくる
		var side := -1.0 if randf() < 0.5 else 1.0
		return Vector3(side * randf_range(1.0, 3.0), 0.0, randf_range(z.z_far + 6.0, z.z_far + 12.0))
	return super.spawn_point(zone_index, z)


func _build_shell() -> void:
	var length := start_z - end_z + 6.0
	# 側壁（工場の外壁）と柱
	for side: float in [-1.0, 1.0]:
		surface = "plaster"
		_box(Vector3(1.0, 8.0, length), Vector3(side * (half_width + 0.5), 4.0, (start_z + end_z) * 0.5 - 1.0), Color(0.78, 0.74, 0.66))
		surface = "metal"
		var z := start_z - 4.0
		while z > end_z:
			_box(Vector3(0.6, 8.2, 0.6), Vector3(side * half_width, 4.1, z), Color(0.35, 0.38, 0.42), Color.BLACK, 0.0, null, 0.5)
			z -= 8.0
	surface = "plaster"
	_box(Vector3(half_width * 2.0 + 2.0, 8.0, 1.0), Vector3(0.0, 4.0, end_z - 0.5), Color(0.72, 0.68, 0.6))
	surface = ""
	# 壁の上を這う配管
	for side: float in [-1.0, 1.0]:
		var pz := start_z - 1.0
		while pz > end_z + 1.0:
			_prop("factory-kit/pipe-large-long", Vector3(side * (half_width - 0.2), 6.2, pz), PI * 0.5, 2.0, false)
			pz -= 2.0
	# 塀の外の工場群（遠景）: 給水塔・煙突・タンク・建屋
	var far := [["city-kit-industrial/chimney-large", Vector3(28.0, 0, -45.0), 26.0],
		["city-kit-industrial/detail-tank-large", Vector3(-30.0, 0, -60.0), 14.0],
		["city-kit-industrial/building-f", Vector3(-30.0, 0, -95.0), 18.0], ["city-kit-industrial/chimney-large", Vector3(-24.0, 0, -125.0), 30.0],
		["city-kit-industrial/water-tower", Vector3(26.0, 0, -110.0), 24.0], ["city-kit-industrial/building-b", Vector3(10.0, 0, -125.0), 14.0]]
	for f: Array in far:
		_prop(f[0], f[1], randf() * TAU, 0.0, false, f[2])
	# 塀の向こうのサイロと、シャッター付きの建屋（Tripo）
	_prop("tripo/factory/silos", Vector3(-27.0, 0.0, -22.0), PI * 0.5, 22.0, false)
	_prop("tripo/factory/building_shutter", Vector3(29.0, 0.0, -12.0), -PI * 0.5, 16.0, false)
	# 正門ヤードの外壁（Tripo の壁の1区画を、柱の間に並べる）
	for side: float in [-1.0, 1.0]:
		for wz: float in [0.0, -8.0, -16.0, -24.0]:
			_prop_sized("tripo/factory/wall_section", Vector3(side * (half_width - 0.45), 0.0, wz), -side * PI * 0.5, Vector3(7.4, 7.2, 1.0), false)
	# 正門（後ろ）
	for side: float in [-1.0, 1.0]:
		_box(Vector3(1.2, 4.0, 1.2), Vector3(side * 6.0, 2.0, start_z + 1.5), Color(0.55, 0.52, 0.48))
	_box(Vector3(13.2, 1.2, 0.6), Vector3(0.0, 4.4, start_z + 1.5), Color(0.15, 0.2, 0.35))
	_sign("ゴールデン麦酒 第一工場", Vector3(0.0, 4.4, start_z + 1.18), 110, Color(1.0, 0.85, 0.35), PI)
	# シャッター
	for i in SHUTTER_Z.size():
		var sz: float = SHUTTER_Z[i]
		var shutter := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(half_width * 2.0, 5.6, 0.3)
		var sm := ShaderMaterial.new()
		sm.shader = _shader(SHUTTER_SHADER)
		mesh.material = sm
		shutter.mesh = mesh
		shutter.position = Vector3(0.0, 2.8, sz)
		_add_gate(shutter, "up")
		_box(Vector3(half_width * 2.0 + 1.0, 1.6, 0.8), Vector3(0.0, 6.4, sz), Color(0.3, 0.32, 0.36))
		_sign(["倉庫 → 関係者以外立入禁止", "製造ライン → 関係者以外立入禁止"][i], Vector3(0.0, 6.4, sz + 0.42), 80, Color(1, 1, 1), 0.0)


func _build_yard() -> void:
	# トラック2台
	for tx: float in [-8.5, 8.5]:
		# 配送トラック（Kenney Car Kit）に社名を書く
		var z := -14.0 if tx < 0.0 else -20.0
		_prop("tripo/factory/truck", Vector3(tx, 0.0, z), 0.0, 8.0)
		_sign("ゴールデン麦酒", Vector3(tx + (1.66 if tx > 0.0 else -1.66), 2.4, z - 1.2), 90, Color(0.75, 0.5, 0.05), PI * 0.5 * (1.0 if tx > 0.0 else -1.0))
	# ビールケースのパレット
	# ビールケースのパレット（Blender 製。赤は1.2m 角・4段、黄色は1.1m 角・3段）
	var pallets := [[Vector3(-4.0, 0, -6.0), "crates_red"], [Vector3(5.0, 0, -4.0), "crates_yellow"],
		[Vector3(-2.5, 0, -24.0), "crates_yellow"], [Vector3(3.5, 0, -26.0), "crates_red"]]
	for pl: Array in pallets:
		_prop("blender/factory/" + pl[1], pl[0], randf_range(-0.25, 0.25), 0.0)
	# 植え込みと黄黒の車止め（Tripo）
	for px: float in [-9.6, 9.6]:
		_prop("tripo/factory/planter", Vector3(px, 0.0, 5.2), 0.0, 2.4)
	for bx: float in [-5.0, -4.0, 4.0, 5.0]:
		_prop("tripo/factory/bollard", Vector3(bx, 0.0, -27.6), 0.0, 0.0, true, 1.0)


func _build_warehouse() -> void:
	# 背の高い棚の列（間を通路にする）
	for sx: float in [-10.5, -6.0, 6.0, 10.5]:
		for sz: float in [-38.0, -50.0]:
			# 倉庫のラック（Tripo）。棚の正面を中央の通路へ向ける
			_prop("tripo/factory/rack", Vector3(sx, 0.0, sz), -signf(sx) * PI * 0.5, 8.0, false)
			_obstacle(Rect2(sx - 0.9, sz - 4.05, 1.8, 8.1), 5.1)
	# 段ボールの山（Kenney Factory Kit）と、天井から吊った案内モニター
	for p: Vector3 in [Vector3(-12.4, 0, -34.0), Vector3(12.4, 0, -45.0), Vector3(-12.4, 0, -55.0), Vector3(12.4, 0, -58.5)]:
		_prop("factory-kit/box-large", p, randf_range(-0.2, 0.2), 1.6)
		_prop("factory-kit/box-small", p + Vector3(0, 0.8, 0), randf() * TAU, 0.9, false)
	# 樽の山
	for k: Vector3 in [Vector3(-1.5, 0, -44.0), Vector3(1.8, 0, -56.0)]:
		_prop("tripo/factory/kegs", k, 0.0 if k.x < 0.0 else PI, 2.8)
	# フォークリフト（Tripo）
	_prop("tripo/factory/forklift", Vector3(3.4, 0.0, -40.5), -PI * 0.5 + 0.35, 3.2)


func _build_line() -> void:
	# 仕込みタンク
	for tx: float in [-11.6, 11.6]:
		for tz: float in [-70.0, -80.0, -90.0]:
			# 仕込みタンク（Tripo・黄色い足場付き）。足場を中央の通路へ向ける
			_prop("tripo/factory/brew_tank", Vector3(tx, 0.0, tz), -signf(tx) * PI * 0.5, 0.0, true, 7.2)
	# ラインの名前はタンクの間の壁に書く
	_sign("第1醸造ライン", Vector3(-13.9, 3.4, -75.0), 100, Color(0.1, 0.15, 0.3), PI * 0.5)
	_sign("第2醸造ライン", Vector3(13.9, 3.4, -75.0), 100, Color(0.1, 0.15, 0.3), -PI * 0.5)
	# 充填ベルトコンベア（左右2本。中央は通路）
	for cx: float in [-4.8, 4.8]:
		# 手前と奥を空けて、中央の通路と外側の通路を行き来できるようにする
		# 瓶の流れるコンベア（Tripo の1区間 6m を3つつなぐ）
		for k in 3:
			_prop_sized("tripo/factory/conveyor", Vector3(cx, 0.0, -71.0 - k * 6.0), PI * 0.5, Vector3(6.0, BELT_H / 0.62, 1.3), false)
		_obstacle(Rect2(cx - 0.75, -86.0, 1.5, 18.0), 0.9)
		# コンベアの手前の機械
		_prop("factory-kit/machine-window", Vector3(cx, 0.0, -66.6), PI, 2.2)
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
	_prop("tripo/factory/golden_barrels", goal_pos, 0.0, 3.8, false)
	_sign("できたてビール 出荷口", goal_pos + Vector3(0, 3.2, -1.2), 110, Color(1.0, 0.9, 0.5), 0.0)
	_add_goal_glow(Color(1.0, 0.8, 0.35))
	_obstacle(Rect2(goal_pos.x - 1.9, goal_pos.z - 1.3, 3.8, 2.6), 1.3)
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


func update(delta: float) -> void:
	bottle_t += delta
	var mm := bottles.multimesh
	for i in mm.instance_count:
		var side := -4.8 if i % 2 == 0 else 4.8
		var u := fmod(bottle_t * 1.2 + i * 0.6, 18.0)
		mm.set_instance_transform(i, Transform3D(Basis(), Vector3(side, BELT_H + 0.18, -68.0 - u)))
