extends "res://stage_base.gd"
## 隠しステージ: あくしでんちゅあ本社ビル 屋上ヘリポート（夜）。ステージ3をクリアすると WARNING の後にここへ来る。
## 雑魚は出ず、土下座王いーさん（iisan_boss.gd）と1対1。いーさんを倒すとそのままクリア（win_on_boss）。

const FLOOR_SHADER := """
shader_type spatial;
//FLOOR_SAMPLERS
varying vec3 world_pos;
void vertex() { world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
float ring(float r, float a, float b) { return step(a, r) * step(r, b); }
void fragment() {
	// 屋上のコンクリート（a）に、ヘリポートの円と H、縁の黄色い線
	vec2 w = world_pos.xz - vec2(0.0, -8.0);
	vec2 uv = world_pos.xz / 3.0;
	vec3 d = texture(a_diff, uv).rgb;
	vec3 arm = texture(a_arm, uv).rgb;
	float lum = dot(d, vec3(0.299, 0.587, 0.114));
	vec3 col = vec3(0.34, 0.35, 0.37) * (0.6 + lum * 0.9);
	float r = length(w);
	float paint = ring(r, 8.6, 9.2) + ring(r, 7.6, 7.85);
	// H（縦棒2本と横棒）
	vec2 h = abs(w);
	paint += step(h.x, 2.4) * step(1.6, h.x) * step(h.y, 3.4);
	paint += step(h.x, 1.6) * step(h.y, 0.4);
	col = mix(col, vec3(0.92, 0.9, 0.85) * (0.8 + lum * 0.4), clamp(paint, 0.0, 1.0));
	// 屋上の縁の黄色い線
	vec2 e = abs(world_pos.xz - vec2(0.0, -8.0));
	float edge = step(13.0, max(e.x, e.y * 0.875)) * step(max(e.x, e.y * 0.875), 13.4);
	col = mix(col, vec3(0.95, 0.75, 0.1) * (0.7 + lum * 0.5), edge);
	ALBEDO = col;
	ROUGHNESS = mix(0.85, arm.g, 0.6);
	AO = arm.r;
	NORMAL_MAP = texture(a_nor, uv).rgb;
}
"""

var win_on_boss := true    # main.gd: ボスを倒したらゴールを待たずにクリア
var lights_t := 0.0
var aviation: Array[OmniLight3D] = []


func _init() -> void:
	stage_title = "本社屋上 ― 土下座王 いーさん"
	stage_tagline = "立ち飲み処の開店を祝う夜。屋上ヘリポートに、頭を下げて数字を上げる男が待っていた。\n競謝の不動の王者・いーさんの、とてつもない土下座を打ち破れ！"
	half_width = 14.0
	start_z = 8.0
	end_z = -24.0
	goal_pos = Vector3(0.0, 0.0, -14.0)
	zones = [
		{"name": "本社屋上ヘリポート", "z_far": -24.0, "z_near": 8.0, "mix": {}, "captain": "iisan", "captain_at": 0},
	]
	start_line = "まだ…誰かいます！"
	goal_objective = ""
	goal_banner = "いーさん 撃破！"
	goal_line = "快適です！"
	win_banner = "土下座王、敗れる！"
	win_result = "隠しボス 土下座王いーさん 撃破"
	views = [[Vector3(0.0, 6.0, 12.0), Vector3(0.0, 0.5, -10.0)], [Vector3(10.0, 3.0, -2.0), Vector3(0.0, 1.0, -12.0)]]


func _build_stage() -> void:
	# 夜: 濃紺の空、街の明かりの照り返しで地平線が少し明るい。月明かりは青白く弱い
	_build_environment({"top": Color(0.02, 0.03, 0.09), "horizon": Color(0.2, 0.16, 0.3), "ground": Color(0.05, 0.05, 0.08), "clouds": 0.25,
		"cloud_color": Color(0.35, 0.32, 0.45), "cloud_shade": Color(0.1, 0.1, 0.18),
		"sun_rot": Vector3(-38.0, 150.0, 0.0), "sun_color": Color(0.6, 0.7, 1.0), "sun_energy": 0.45, "ambient": 0.35, "ambient_color": Color(0.4, 0.45, 0.8),
		"fog": 0.004, "fog_color": Color(0.15, 0.12, 0.25), "glow": 0.9, "exposure": 1.1})
	_build_floor(FLOOR_SHADER, 4.0, {"a": "concrete_floor_painted"})
	_build_roof()
	_build_city()


func _build_roof() -> void:
	# 屋上の縁: 低い立ち上がりと手すり（四方）。そば屋は half_width と start_z / end_z の内側から出られない
	var cz := (start_z + end_z) * 0.5
	var len_z := start_z - end_z
	for side: float in [-1.0, 1.0]:
		_box(Vector3(0.5, 0.9, len_z + 1.0), Vector3(side * (half_width + 0.25), 0.45, cz), Color(0.5, 0.5, 0.52))
		_box(Vector3(0.08, 0.08, len_z + 1.0), Vector3(side * (half_width + 0.25), 1.35, cz), Color(0.75, 0.76, 0.78), Color.BLACK, 0.0, null, 0.8)
	for z: float in [start_z + 0.25, end_z - 0.25]:
		_box(Vector3(half_width * 2.0 + 1.0, 0.9, 0.5), Vector3(0.0, 0.45, z), Color(0.5, 0.5, 0.52))
		_box(Vector3(half_width * 2.0 + 1.0, 0.08, 0.08), Vector3(0.0, 1.35, z), Color(0.75, 0.76, 0.78), Color.BLACK, 0.0, null, 0.8)
	for i in 15:
		var x := -half_width + i * half_width * 2.0 / 14.0
		for z: float in [start_z + 0.25, end_z - 0.25]:
			_box(Vector3(0.05, 0.5, 0.05), Vector3(x, 1.1, z), Color(0.75, 0.76, 0.78), Color.BLACK, 0.0, null, 0.8)
	# ヘリポートの縁の灯（緑）と、四隅の航空障害灯（赤く点滅）
	for i in 16:
		var a := i * TAU / 16.0
		var p := Vector3(cos(a) * 9.6, 0.06, -8.0 + sin(a) * 9.6)
		_cyl(0.12, 0.1, p, Color(0.3, 1.0, 0.45), 0.0, 3.0)
	for c: Vector2 in [Vector2(-1, -1), Vector2(1, -1), Vector2(-1, 1), Vector2(1, 1)]:
		var p := Vector3(c.x * (half_width - 0.2), 0.0, -8.0 + c.y * 15.5)
		_cyl(0.08, 2.4, p + Vector3(0, 1.2, 0), Color(0.6, 0.6, 0.62), 0.6)
		_cyl(0.16, 0.2, p + Vector3(0, 2.5, 0), Color(1.0, 0.1, 0.05), 0.0, 4.0)
		var l := OmniLight3D.new()
		l.light_color = Color(1.0, 0.15, 0.08)
		l.light_energy = 1.5
		l.omni_range = 6.0
		l.position = p + Vector3(0, 2.5, 0)
		add_child(l)
		aviation.append(l)
		_obstacle(Rect2(p.x - 0.2, p.z - 0.2, 0.4, 0.4), 2.6)
	# 投光器: ヘリポートを斜め上から照らす（夜でも戦いが見えるように）
	for s: Vector3 in [Vector3(-12.0, 7.0, 6.0), Vector3(12.0, 7.0, 6.0), Vector3(0.0, 8.0, -23.0)]:
		var spot := SpotLight3D.new()
		spot.light_color = Color(1.0, 0.92, 0.8)
		spot.light_energy = 5.0
		spot.spot_range = 30.0
		spot.spot_angle = 50.0
		spot.shadow_enabled = true
		spot.position = s
		add_child(spot)
		spot.look_at(Vector3(0.0, 0.0, -8.0), Vector3.UP)
	# 給水タンクと空調の室外機（入口側の左右。障害物）
	_cyl(1.4, 3.0, Vector3(-11.0, 1.5, 5.0), Color(0.82, 0.83, 0.85), 0.3)
	_obstacle(Rect2(-12.4, 3.6, 2.8, 2.8), 3.0)
	for i in 3:
		_box(Vector3(1.2, 1.0, 0.8), Vector3(11.0, 0.5, 5.6 - i * 1.1), Color(0.86, 0.86, 0.84))
	_obstacle(Rect2(10.4, 2.9, 1.2, 3.1), 1.0)


func _build_city() -> void:
	# 屋上から見下ろす夜景: 周りのビル（窓が灯る）を屋上より低く並べ、遠くに東京タワー
	var rng := RandomNumberGenerator.new()
	rng.seed = 77
	var names := ["tower_glass", "tower_office", "tower_mansion"]
	for k in 26:
		var a := rng.randf() * TAU
		var r := rng.randf_range(38.0, 90.0)
		var p := Vector3(cos(a) * r, -rng.randf_range(20.0, 55.0), -8.0 + sin(a) * r)
		_prop("blender/azabu/" + names[k % names.size()], p, rng.randf() * TAU, 0.0, false, rng.randf_range(40.0, 70.0))
	_tokyo_tower(Vector3(55.0, -60.0, -120.0), 130.0)
	# 下の街の明かり（地面の代わりに、点々と光る広い板）
	var city := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(500, 500)
	var m := ShaderMaterial.new()
	m.shader = _shader("""
shader_type spatial;
render_mode unshaded;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void fragment() {
	vec2 g = UV * 220.0;
	vec2 c = floor(g);
	float on = step(0.86, hash(c)) * smoothstep(0.5, 0.1, length(fract(g) - 0.5));
	vec3 warm = mix(vec3(1.0, 0.75, 0.4), vec3(0.8, 0.9, 1.0), hash(c + 7.0));
	ALBEDO = vec3(0.02, 0.02, 0.04) + warm * on * 2.5;
}
""")
	pm.material = m
	city.mesh = pm
	city.position = Vector3(0.0, -60.0, -8.0)
	add_child(city)


func update(delta: float) -> void:
	lights_t += delta
	var on := fmod(lights_t, 1.6) < 0.5
	for l in aviation:
		l.light_energy = 2.0 if on else 0.15
