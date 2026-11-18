extends "res://stage_base.gd"
## ステージ2: 麻布十番駅 → あくしでんちゅあ本社ビル。
## 駅前 → 規制線1 → 麻布十番商店街 → 規制線2 → 本社前広場（奥に本社ビルのエントランス、遠くに東京タワー）。
## 店名はすべて一般名詞（実在の店・ブランドは出さない）。

const FLOOR_SHADER := """
shader_type spatial;
//FLOOR_SAMPLERS
varying vec3 world_pos;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void vertex() { world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec2 w = world_pos.xz;
	float ax = abs(w.x);
	vec3 col;
	vec3 arm;
	vec3 nm;
	float rough_add = 0.0;
	if (w.y < -70.0 || ax >= 5.5) {
		// 歩道・本社前広場: 敷石（a）。広場は大きめに貼る
		vec2 uv = w / (w.y < -70.0 ? 4.0 : 2.5);
		col = mix(texture(a_diff, uv).rgb, vec3(dot(texture(a_diff, uv).rgb, vec3(0.333))), 0.45) * 1.25;
		arm = texture(a_arm, uv).rgb;
		nm = texture(a_nor, uv).rgb;
		if (w.y >= -70.0 && ax < 5.85) col = vec3(0.6, 0.6, 0.58) * (0.8 + arm.r * 0.3);   // 縁石
		if (w.y >= -70.0 && abs(ax - 6.6) < 0.18) col = vec3(0.95, 0.78, 0.15) * (0.7 + arm.r * 0.4);   // 点字ブロック
	} else {
		// 車道: アスファルト（b）。白線と横断歩道、ところどころ水たまり
		vec2 uv = w / 4.0;
		col = texture(b_diff, uv).rgb * 1.15;
		arm = texture(b_arm, uv).rgb;
		nm = texture(b_nor, uv).rgb;
		float paint = 0.0;
		paint = max(paint, step(ax, 0.09) * step(0.5, fract(w.y / 4.0)));
		bool cross = (w.y < -23.0 && w.y > -27.0) || (w.y < -59.0 && w.y > -63.0);
		if (cross) paint = max(paint, step(0.5, fract(w.x / 1.1)));
		paint = max(paint, step(abs(ax - 5.3), 0.07));
		col = mix(col, vec3(0.88) * (0.85 + arm.r * 0.15), paint);
		float puddle = smoothstep(0.78, 0.8, noise(w * 0.5 + vec2(4.0, 9.0))) * (1.0 - paint);
		col *= 1.0 - puddle * 0.1;
		rough_add = -puddle * 0.85;
		nm = mix(nm, vec3(0.5, 0.5, 1.0), puddle);
	}
	ALBEDO = col;
	ROUGHNESS = clamp(arm.g + rough_add, 0.04, 1.0);
	AO = arm.r;
	NORMAL_MAP = nm;
}
"""

const GLASS_SHADER := """
shader_type spatial;
uniform vec3 tint : source_color = vec3(0.35, 0.5, 0.66);
varying vec3 world_pos;
void vertex() { world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	// ガラスのカーテンウォール: 窓の格子と、ところどころ明かりのついた窓
	vec2 g = vec2(world_pos.x / 1.6, world_pos.y / 3.4);
	vec2 f = fract(g);
	float mullion = max(step(0.94, f.x), step(0.88, f.y));
	float r = fract(sin(dot(floor(g), vec2(12.9, 78.2))) * 43758.5);
	float lit = step(0.9, r);
	// 窓ガラスは空を映す（金属的で滑らか）。ところどころ残業の明かり
	vec3 col = mix(tint * 0.55, tint * 0.9, smoothstep(0.0, 1.0, world_pos.y / 60.0)) * (0.9 + r * 0.2);
	col = mix(col, vec3(0.72, 0.74, 0.78), mullion);
	ALBEDO = col;
	METALLIC = mix(0.85, 0.3, mullion);
	ROUGHNESS = mix(0.06, 0.5, mullion);
	EMISSION = vec3(1.0, 0.85, 0.6) * lit * (1.0 - mullion) * 0.6;
}
"""

## 店の名前を看板（1階の台座と、縦の袖看板）に書くか（false = どちらも無地）
const SHOP_PLATE_TEXT := false
## 店の種類ごとのテーマ色（袖看板の板の色・ネオンの色）。azabu_shops.py の THEMES と同じ色
const SHOP_THEME := {
	"shop_wagashi": [Color(0.1, 0.05, 0.12), Color(1.0, 0.35, 0.75)], "shop_yaoya": [Color(0.04, 0.09, 0.05), Color(0.55, 1.0, 0.25)],
	"shop_kissa": [Color(0.12, 0.07, 0.04), Color(1.0, 0.7, 0.25)], "shop_soba": [Color(0.03, 0.04, 0.08), Color(0.35, 0.85, 1.0)],
	"shop_izakaya": [Color(0.08, 0.02, 0.02), Color(1.0, 0.22, 0.15)], "shop_kusuri": [Color(0.03, 0.06, 0.12), Color(0.25, 1.0, 0.55)],
}
## 店の名前ごとの建物（Blender 製の6種類）
const SHOP_BUILDING := {"たい焼き": "shop_wagashi", "豆菓子": "shop_wagashi", "手打ちそば": "shop_soba", "酒": "shop_izakaya", "焼き鳥": "shop_izakaya",
	"喫茶": "shop_kissa", "くすり": "shop_kusuri", "八百屋": "shop_yaoya", "煎餅": "shop_wagashi", "うなぎ": "shop_soba", "定食": "shop_soba",
	"花": "shop_yaoya", "和菓子": "shop_wagashi", "古本": "shop_kissa"}
const SHOPS := ["たい焼き", "豆菓子", "手打ちそば", "酒", "焼き鳥", "喫茶", "くすり", "八百屋", "煎餅", "うなぎ", "定食", "花", "和菓子", "古本"]
const GATE_Z := [-30.0, -66.0]


func _init() -> void:
	stage_title = "麻布十番 〜本社への道〜"
	stage_tagline = "確保したビールを窓際の立ち飲み処へ届けたい。\n麻布十番駅から本社ビルまで、追ってくる警察官を蹴散らして進め！"
	half_width = 12.0
	camera_wall_margin = 3.6   # 店の日よけ（建物の幅に合わせて拡大すると最大約2.6m 張り出す）の外にカメラを置く
	start_z = 8.0
	end_z = -104.0
	goal_pos = Vector3(0.0, 0.0, -100.0)
	zones = [
		{"name": "麻布十番駅前", "z_far": -30.0, "z_near": 8.0, "mix": {"police": 0.6, "guard": 0.4}, "captain": "koban", "captain_at": 15},
		{"name": "麻布十番商店街", "z_far": -66.0, "z_near": -30.0, "mix": {"police": 0.6, "motor": 0.4}, "captain": "motor_chief", "captain_at": 22},
		{"name": "本社前広場", "z_far": -104.0, "z_near": -66.0, "mix": {"police": 0.5, "motor": 0.5}, "captain": "riot_chief", "captain_at": 0},
	]
	start_line = "このビールを、窓際へ…！"
	goal_objective = "本社ビルに入館せよ！（エントランスで F 長押し）"
	goal_banner = "機動隊長 撃破！"
	goal_line = "出社です！"
	win_banner = "本社ビル、入館！"
	win_result = "麻布十番 突破"
	views = [[Vector3(2.0, 4.5, 11.0), Vector3(0.0, 1.5, -15.0)], [Vector3(1.0, 4.5, -37.0), Vector3(0.0, 2.0, -50.0)], [Vector3(-2.0, 3.0, -67.0), Vector3(4.0, 8.0, -104.0)], [Vector3(-3.5, 2.4, -36.5), Vector3(-9.0, 1.4, -45.0)], [Vector3(-3.0, 1.8, -72.0), Vector3(-7.5, 3.2, -78.0)], [Vector3(-2.0, 2.0, -66.0), Vector3(30.0, 30.0, -118.0)], [Vector3(-2.0, 2.2, -44.0), Vector3(-11.0, 3.5, -50.0)], [Vector3(3.0, 1.7, -10.0), Vector3(11.5, 3.0, -16.0)], [Vector3(-3.5, 2.6, -6.0), Vector3(-7.6, 3.0, 1.0)], [Vector3(6.5, 1.8, -7.0), Vector3(3.2, 0.7, -11.0)], [Vector3(-1.5, 2.2, -50.0), Vector3(-3.2, 1.2, -53.0)], [Vector3(4.0, 2.0, -64.0), Vector3(0.0, 0.8, -68.0)], [Vector3(3.5, 2.4, -61.5), Vector3(6.8, 1.2, -68.0)]]


## 地下鉄の出入口（ガラス張り）。カメラが近づいたら隠して、そば屋が見えなくならないようにする
var station_parts: Array[Node3D] = []
var beacons: Array = []     # [材質, 位相]（パトカーの警光灯）
var beacon_t := 0.0
var station_rect := Rect2()


func update(delta: float) -> void:
	# パトカーの警光灯の点滅（左右が交互に強くなる）
	beacon_t += delta
	for b: Array in beacons:
		var m: StandardMaterial3D = b[0]
		var k := 0.04 + 0.96 * pow(maxf(0.0, sin(beacon_t * 9.0 + float(b[1]))), 3.0)
		m.emission_energy_multiplier = 6.0 * k
		var light: OmniLight3D = m.get_meta("light")
		light.light_energy = float(light.get_meta("base_energy")) * k
	var cam := get_viewport().get_camera_3d()
	if cam == null:
		return
	# カメラが出入口の近くにいるか、カメラとそば屋の間に出入口がはさまったら隠す
	var near := station_rect.grow(2.5).has_point(Vector2(cam.position.x, cam.position.z))
	var player := get_parent().get("player") as Node3D
	if player and not near:
		var a := Vector2(cam.position.x, cam.position.z)
		var b := Vector2(player.position.x, player.position.z)
		var r := station_rect.grow(0.5)
		for i in 9:
			if r.has_point(a.lerp(b, i / 8.0)):
				near = true
				break
	for n in station_parts:
		n.visible = not near


func _build_stage() -> void:
	# 夕方: 西日と茜色の空。商店街の明かりと提灯が灯り、路面の水たまりに映り込む（SSR）
	_build_environment({"top": Color(0.2, 0.28, 0.55), "horizon": Color(1.0, 0.6, 0.38), "ground": Color(0.35, 0.28, 0.26), "clouds": 0.5,
		"cloud_color": Color(1.0, 0.74, 0.56), "cloud_shade": Color(0.5, 0.42, 0.55),
		"sun_rot": Vector3(-24.0, -35.0, 0.0), "sun_color": Color(1.0, 0.72, 0.48), "sun_energy": 1.8, "ambient": 0.6, "ambient_color": Color(0.45, 0.55, 0.85),
		"fog": 0.0018, "fog_color": Color(0.9, 0.7, 0.6), "vol_fog": 0.0015, "vol_fog_color": Color(1.0, 0.85, 0.7), "ssr": true, "glow": 0.6})
	_build_floor(FLOOR_SHADER, 13.0, {"a": "rectangular_paving", "b": "clean_asphalt"})
	_build_buildings()
	_build_station_front()
	_build_shotengai()
	_build_garlands()
	_build_plaza()
	_build_gates()
	_tokyo_tower(Vector3(62.0, 0.0, -124.0), 80.0)
	_build_street_lamps()
	_build_poles()
	_build_skyline()


## 電柱と電線（日本の商店街らしさ。自作）
func _build_poles() -> void:
	for side: float in [-1.0, 1.0]:
		var prev := Vector3.ZERO
		var z := start_z - 2.0
		while z > -66.0:
			var p := Vector3(side * 10.3, 0.0, z)
			if not _inside_obstacle(p, 0.3):
				# 電柱（Blender 製・高さ10m、腕木の碍子は x = ±0.78）。変圧器は車道の反対側
				_prop("blender/azabu/utility_pole", p, 0.0 if side > 0.0 else PI, 0.0, false)
				_obstacle(Rect2(p.x - 0.2, p.z - 0.2, 0.4, 0.4), 10.0)
				if prev != Vector3.ZERO:
					for dx: float in [-0.78, 0.78]:
						var a := prev + Vector3(dx, 9.45, 0)
						var b := p + Vector3(dx, 9.45, 0)
						var wire := _box(Vector3(0.025, 0.025, a.distance_to(b)), (a + b) * 0.5 + Vector3(0, -0.25, 0), Color(0.1, 0.1, 0.1))
						wire.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
				prev = p
			z -= 13.0


## 街並みの奥の高層ビル（Kenney City Kit Commercial）
func _build_skyline() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 2525
	# Blender 製の高層ビル（ガラス張り・石張りのオフィス・マンション）。夕方なので窓がところどころ灯っている
	var names := ["tower_glass", "tower_office", "tower_mansion", "tower_office", "tower_glass"]
	for side: float in [-1.0, 1.0]:
		var z := start_z
		while z > -150.0:
			if side > 0.0 and z < -90.0:
				break   # 東京タワーの見える方向は空けておく
			_prop("blender/azabu/" + names[rng.randi() % names.size()], Vector3(side * rng.randf_range(30.0, 40.0), 0.0, z), -side * PI * 0.5 if rng.randf() < 0.7 else 0.0, 0.0, false, rng.randf_range(26.0, 48.0))
			z -= rng.randf_range(16.0, 24.0)
	for k in 6:
		_prop("blender/azabu/" + names[k % names.size()], Vector3(rng.randf_range(-55.0, 12.0), 0.0, end_z - rng.randf_range(30.0, 80.0)), 0.0, 0.0, false, rng.randf_range(40.0, 70.0))


## 街灯（車道の両側）。夕方なので灯っている
func _build_street_lamps() -> void:
	var z := start_z - 6.0
	var k := 0
	while z > -68.0:
		var side := -1.0 if k % 2 == 0 else 1.0
		var x := side * 6.0
		if not _inside_obstacle(Vector3(x, 0.0, z), 0.3):
			# 街灯（Blender 製。腕は -X 向き・支柱から0.535m ずれて中心が来る）。腕を車道の側へ向ける
			_prop("blender/azabu/street_lamp", Vector3(x - side * 0.535, 0.0, z), 0.0 if side > 0.0 else PI, 0.0, false)
			var lamp := OmniLight3D.new()
			lamp.light_color = Color(1.0, 0.86, 0.65)
			lamp.light_energy = 1.8
			lamp.omni_range = 10.0
			lamp.position = Vector3(x - side * 1.0, 4.7, z)
			add_child(lamp)
			_obstacle(Rect2(x - 0.15, z - 0.15, 0.3, 0.3), 5.6)
		z -= 9.0
		k += 1


# ---------------------------------------------------------------- 両側の街並み

const SHOP_MODELS := ["blender/azabu/shop_wagashi", "blender/azabu/shop_yaoya", "blender/azabu/shop_kissa",
	"blender/azabu/shop_soba", "blender/azabu/shop_izakaya", "blender/azabu/shop_kusuri"]


## 店の建物を置く。モデルの外壁の正面は手前向き（+Z）で z = 0、奥行きは -4m、日よけが手前へ張り出す
func _shop_building(path: String, side: float, zc: float, width: float) -> float:
	var inst: Node3D = (load(_model_path(path)) as PackedScene).instantiate()
	var box := _model_aabb(inst)
	inst.free()
	var sc := width / box.size.x
	var cz := box.get_center().z * sc   # AABB の中心から外壁の正面までのずれ（負）
	var front := side * (half_width - 0.4)
	_prop(path, Vector3(front - side * cz, 0.0, zc), -side * PI * 0.5, width, false)
	return sc


## 店の種類ごとの店先の飾り: [モデル, 店の幅に対する左右の位置（-0.5〜0.5）, 壁からの距離（m）, 当たり判定を付けるか]
const SHOP_DECOR := {
	"shop_kissa": [["deco_terrace", -0.22, 1.9, true], ["deco_chalk", 0.3, 1.3, false], ["deco_olive", 0.45, 0.5, true]],
	"shop_soba": [["deco_andon", -0.38, 0.7, false], ["deco_flowers", 0.4, 0.5, false]],
	"shop_izakaya": [["deco_beer_display", -0.36, 0.5, true], ["deco_andon", 0.36, 0.8, false]],
	"shop_wagashi": [["deco_flowers", -0.4, 0.5, false], ["deco_chalk", -0.12, 1.4, false]],
	"shop_kusuri": [["deco_olive", -0.45, 0.5, true], ["deco_olive", 0.45, 0.5, true]],
	"shop_yaoya": [["deco_flowers", -0.47, 0.45, false]],
}
## 壁付けのランプを付ける店（喫茶店・居酒屋・そば屋は建物に自前の明かりがある）
const WALL_LAMP_SHOPS := ["shop_wagashi", "shop_kusuri", "shop_yaoya"]


## 店の前（歩道側）の位置。o = 店の幅に沿った位置（m）、d = 壁からの距離（m）
func _shop_front_point(side: float, zc: float, o: float, d: float) -> Vector3:
	return Vector3(side * (half_width - 0.4 - d), 0.0, zc + side * o)


func _shop_decor(kind: String, side: float, zc: float, w: float) -> void:
	for it: Array in SHOP_DECOR.get(kind, []):
		var p := _shop_front_point(side, zc, float(it[1]) * w, float(it[2]))
		_prop("blender/azabu/" + it[0], p, -side * PI * 0.5 + randf_range(-0.12, 0.12), 0.0, it[3])
	if kind in WALL_LAMP_SHOPS:
		for o: float in [-0.5, 0.5]:
			var p := _shop_front_point(side, zc, o * (w - 0.9), 0.18)
			p.y = 2.15
			_prop("blender/azabu/deco_wall_lamp", p, -side * PI * 0.5, 0.0, false)


func _shop_lights(side: float, zc: float, w: float) -> void:
	# 軒下のスポットライト（店先の床と飾りを照らす）
	var spot := SpotLight3D.new()
	spot.light_color = Color(1.0, 0.76, 0.48)
	spot.light_energy = 3.0
	spot.spot_range = 6.0
	spot.spot_angle = 55.0
	spot.spot_attenuation = 0.8
	spot.position = _shop_front_point(side, zc, 0.0, 0.6) + Vector3(0, 2.6, 0)
	add_child(spot)
	spot.look_at(_shop_front_point(side, zc, 0.0, 1.8), Vector3.UP)
	# 店の中からこぼれる光（ガラス戸の前）
	var glow := OmniLight3D.new()
	glow.light_color = Color(1.0, 0.8, 0.55)
	glow.light_energy = 1.0
	glow.omni_range = 4.0
	glow.position = _shop_front_point(side, zc, 0.0, 0.3) + Vector3(0, 1.2, 0)
	add_child(glow)


## 通りの上を渡す電球のガーランド（左右の建物の間。ゆるく垂れた線に電球を並べる）
func _build_garlands() -> void:
	var bulb := _prop_mesh("blender/azabu/deco_bulb")
	var zs: Array[float] = []
	var z := -36.0
	while z > -64.0:
		zs.append(z)
		z -= 5.5
	var xs := half_width - 0.6
	var per := 36
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = bulb
	mm.instance_count = zs.size() * per
	var i := 0
	for gz: float in zs:
		var prev := Vector3.ZERO
		for k in per + 1:
			var u := float(k) / per
			var x := lerpf(-xs, xs, u)
			var y := 6.2 - sin(u * PI) * 0.9
			var zz := gz + sin(u * PI) * 0.6   # 少し斜めに渡す
			var pt := Vector3(x, y, zz)
			if k > 0:
				var wire := _box(Vector3(pt.distance_to(prev), 0.015, 0.015), (pt + prev) * 0.5, Color(0.08, 0.08, 0.08))
				wire.look_at(pt, Vector3.UP)
				wire.rotate_object_local(Vector3.UP, PI * 0.5)
				wire.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			if k < per:
				mm.set_instance_transform(i, Transform3D(Basis(), pt))
				i += 1
			prev = pt
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)


func _build_buildings() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 1010
	var shop_i := 0
	for side: float in [-1.0, 1.0]:
		var z := start_z + 4.0
		while z > -70.0:
			var w := rng.randf_range(6.0, 9.5)
			rng.randf_range(7.0, 15.0)   # 以前の高さの乱数（並びを変えないため残す）
			var zc := z - w * 0.5
			# 建物の正面は x = ±(half_width - 0.4)。そば屋はそこまで行けない（main.gd の _collide で止まる）
			# 店の建物（Blender 製の和菓子屋・八百屋・喫茶店・そば屋・居酒屋・薬局）。幅を区画に合わせて拡縮し、外壁の正面を x = ±(half_width - 0.4) に揃える
			rng.randi()   # 以前の「建物の種類の乱数」（並びを変えないため残す）
			var shop: String = SHOPS[shop_i % SHOPS.size()]
			shop_i += 1
			# 店の名前に合った建物を選び、1階の看板の台座に店の名前を書く
			var sc := _shop_building("blender/azabu/" + SHOP_BUILDING[shop], side, zc, w - 0.3)
			var plate := Vector3(side * (half_width - 0.4 - 0.37 * sc), 3.3 * sc, zc)
			if SHOP_PLATE_TEXT:
				_sign(shop, plate, 150, Color(0.45, 0.08, 0.05) if shop != "くすり" else Color(0.05, 0.2, 0.55), -side * PI * 0.5).outline_size = 0
			# 店先の明かり（夕方なので灯っている）: 軒下から店先を照らすスポットライトと、店の中からこぼれる光
			_shop_lights(side, zc, w)
			# 店先の飾り（Blender 製）。店の種類ごとに決めた物を置く
			if zc < start_z - 3.0:
				_shop_decor(SHOP_BUILDING[shop], side, zc, w)
			# 縦の袖看板: 店のテーマ色の暗い板に、同じ色のネオン管の縁取り
			var th: Array = SHOP_THEME[SHOP_BUILDING[shop]]
			var bh := 0.3 + shop.length() * 0.62
			var board := _box(Vector3(0.9, bh, 0.12), Vector3(side * (half_width - 1.0), 5.2, z - 0.6), th[0])
			for e: Array in [[Vector3(0.9, 0.05, 0.05), Vector3(0, bh * 0.5 - 0.06, 0)], [Vector3(0.9, 0.05, 0.05), Vector3(0, -bh * 0.5 + 0.06, 0)],
					[Vector3(0.05, bh, 0.05), Vector3(0.4, 0, 0)], [Vector3(0.05, bh, 0.05), Vector3(-0.4, 0, 0)]]:
				for fz: float in [0.07, -0.07]:
					var tube := _box(e[0], board.position + e[1] + Vector3(0, 0, fz), th[1], th[1], 4.0)
					tube.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			if SHOP_PLATE_TEXT:
				_sign("\n".join(shop.split("")), board.position + Vector3(0, 0, 0.08), 96, Color(0.55, 0.1, 0.08), 0.0)
			z -= w
	# 本社前は背の低い植え込み付きの建物にして、東京タワーが見えるようにする
	# （右側は2階建ての八百屋だけにして、東京タワーの見える方向を低く保つ）
	for side: float in [-1.0, 1.0]:
		for k in 4:
			var path: String = "blender/azabu/shop_yaoya" if side > 0.0 else SHOP_MODELS[(k * 2 + 1) % SHOP_MODELS.size()]
			_shop_building(path, side, -74.25 - k * 8.5, 8.2)


# ---------------------------------------------------------------- エリア1: 駅前

func _build_station_front() -> void:
	# 地下鉄の出入口（そば屋はここから出てくる）
	var ex := Vector3(-7.6, 0.0, 2.2)
	var first_child := get_child_count()
	# Blender 製（ガラスの壁・下り階段・路線図）。+Z の端が壁、-Z の端が入口。看板（紺）は z = ±1.9・高さ3.25m
	_prop("blender/azabu/subway_entrance", ex, 0.0, 0.0, false)
	_sign("麻布十番", ex + Vector3(0, 3.25, -1.97), 90, Color(1, 1, 1), PI)
	_sign("麻布十番", ex + Vector3(0, 3.25, 1.97), 90, Color(1, 1, 1), 0.0)
	_obstacle(Rect2(ex.x - 1.6, ex.z - 2.4, 3.2, 4.8), 3.8)   # 高さは看板の上端まで（カメラが屋根越しにならないように）
	for i in range(first_child, get_child_count()):
		station_parts.append(get_child(i) as Node3D)
	station_rect = Rect2(ex.x - 1.6, ex.z - 2.4, 3.2, 4.8)
	# 自動販売機
	for i in 2:
		var vz := -5.5 - i * 1.15
		_prop("blender/azabu/vending_machine", Vector3(10.6, 0.0, vz), -PI * 0.5, 0.0, false)
	_obstacle(Rect2(10.1, -7.8, 1.0, 2.9), 1.9)
	# 停車中のタクシー
	var taxi := _prop("tripo/azabu/taxi", Vector3(3.2, 0.0, -11.0), 0.0, 4.7)   # Tripo 製（全長4.7m）
	# 屋根の行灯を灯す（モデルの座標で測った行灯の範囲）
	_glow_part(taxi, Vector3(-0.09, 0.372, -0.17), Vector3(0.09, 0.42, -0.055), Color(1.0, 0.9, 0.7), 2.2, 3.0)
	# バス停と、バスを待つ人（騒ぎに動じない）
	var bs := Vector3(-9.6, 0.0, -18.0)
	# 上屋と標識（Blender 製）。上屋の開いた側を車道（+X）へ向ける
	_prop("blender/azabu/bus_stop", bs, PI * 0.5, 0.0, false)
	_prop("blender/azabu/bus_pole", bs + Vector3(0.9, 0.0, 2.4), 0.0, 0.0, false)
	_sign("バス", bs + Vector3(0.9, 2.45, 2.43), 44, Color(0.1, 0.3, 0.6), 0.0).outline_size = 0
	_obstacle(Rect2(bs.x - 0.9, bs.z - 2.2, 1.9, 4.8), 2.5)
	bystanders.append({"pos": bs + Vector3(0.1, 0, -1.0), "yaw": PI * 0.5, "anim": "Idle_TalkingPhone", "cfg": "commuter_a"})
	bystanders.append({"pos": bs + Vector3(0.1, 0, 0.6), "yaw": PI * 0.5, "anim": "addon/Idle_Subtle", "cfg": "commuter_b"})
	# 信号機
	for p: Vector3 in [Vector3(-5.9, 0, -22.4), Vector3(5.9, 0, -27.6), Vector3(-5.9, 0, -58.4), Vector3(5.9, 0, -63.6)]:
		_prop("city-kit-roads/traffic-light", p, 0.0 if p.x < 0.0 else PI, 0.0, true, 4.4)
	# 植え込みと駐輪場
	for p: Vector3 in [Vector3(-6.4, 0, -25.0), Vector3(6.4, 0, -25.0)]:
		_planter(p, Vector3(1.0, 0.6, 2.4))
	for i in 6:
		# 駐輪場の自転車（Blender 製のママチャリ。赤と銀を交互に）
		_prop("blender/azabu/bicycle_red" if i % 3 == 0 else "blender/azabu/bicycle_silver", Vector3(10.2, 0.0, -14.0 - i * 0.7), PI * 0.5 + randf_range(-0.08, 0.08), 0.0, false)
	_obstacle(Rect2(9.5, -18.0, 1.6, 4.4), 1.0)


# ---------------------------------------------------------------- エリア2: 商店街

func _build_shotengai() -> void:
	# アーチ看板
	# アーチ（Blender 製・柱の間隔14m）を、柱が x = ±10.2 に来るよう拡大する
	_prop("blender/azabu/arch", Vector3(0, 0, -33.0), 0.0, 14.62 * 10.2 / 7.0, false)
	for sx: float in [-1.0, 1.0]:
		_obstacle(Rect2(sx * 10.2 - 0.45, -33.45, 0.9, 0.9), 10.0)
	_sign("麻布十番商店街", Vector3(0, 8.75, -32.75), 140, Color(1.0, 0.9, 0.5), 0.0)
	# 提灯の列（歩道の上）
	var lantern := _prop_mesh("blender/azabu/lantern")
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = lantern
	mm.instance_count = 48
	for i in 48:
		var side := -1.0 if i % 2 == 0 else 1.0
		var z := -35.0 - (i / 2) * 1.3
		# モデルの原点は提灯の下端。吊り紐の上端（0.63m）が電線の高さに来る
		mm.set_instance_transform(i, Transform3D(Basis(Vector3.UP, i * 0.7), Vector3(side * 8.6, 3.22 + sin(i * 0.9) * 0.05, z)))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	add_child(mmi)
	for side: float in [-1.0, 1.0]:
		_box(Vector3(0.03, 0.03, 31.0), Vector3(side * 8.6, 3.85, -50.0), Color(0.15, 0.12, 0.1))
	# たい焼きの屋台と店主
	var st := Vector3(-8.4, 0.0, -42.0)
	# Blender 製の屋台（幅2.9m・奥行き1.6m）。正面を車道（+X）へ向ける
	_prop("blender/azabu/taiyaki_stall", st, PI * 0.5, 0.0, false)
	var tb := _box(Vector3(1.4, 0.4, 0.06), st + Vector3(0.95, 2.05, 0), Color(0.97, 0.95, 0.9))
	tb.rotation.y = PI * 0.5
	_sign("たい焼き", st + Vector3(0.99, 2.05, 0), 56, Color(0.7, 0.1, 0.05), PI * 0.5).outline_size = 0
	_obstacle(Rect2(st.x - 0.85, st.z - 1.5, 1.7, 3.0), 1.0)
	bystanders.append({"pos": st + Vector3(-1.1, 0, 0), "yaw": PI * 0.5, "anim": "addon/Idle_Subtle", "cfg": "vendor"})
	_obstacle(Rect2(st.x - 1.6, st.z - 0.5, 0.6, 1.0), 1.8)
	# ベンチで電話する人
	_bench(Vector3(8.6, 0.0, -49.0))
	bystanders.append({"pos": Vector3(9.6, 0, -49.0), "yaw": -PI * 0.5, "anim": "Idle_TalkingPhone", "cfg": "commuter_b"})
	_obstacle(Rect2(9.2, -49.5, 0.8, 1.0), 1.8)
	# 立ち話をする2人
	bystanders.append({"pos": Vector3(-10.2, 0, -57.0), "yaw": 0.6, "anim": "Idle_Talking", "cfg": "commuter_a"})
	bystanders.append({"pos": Vector3(-9.5, 0, -58.2), "yaw": PI + 0.6, "anim": "addon/Idle Listening", "cfg": "commuter_c"})
	_obstacle(Rect2(-10.8, -58.8, 1.8, 2.4), 1.8)
	# 路上の配送トラック（ゴールデン麦酒）
	var tr := Vector3(-3.2, 0.0, -53.0)
	_prop("tripo/factory/truck", tr, 0.0, 6.8)   # 工場ステージと同じゴールデン麦酒のトラック（Tripo）
	_sign("ゴールデン麦酒", tr + Vector3(1.4, 2.1, -1.0), 80, Color(0.75, 0.5, 0.05), PI * 0.5)
	_sign("ゴールデン麦酒", tr + Vector3(-1.4, 2.1, -1.0), 80, Color(0.75, 0.5, 0.05), -PI * 0.5)
	# のぼり旗と植え込み
	for p: Vector3 in [Vector3(7.2, 0, -38.0), Vector3(7.2, 0, -60.0), Vector3(-7.2, 0, -64.0)]:
		_nobori(p)
	_planter(Vector3(4.0, 0, -44.0), Vector3(1.0, 0.6, 2.0))


# ---------------------------------------------------------------- エリア3: 本社前広場

func _build_plaza() -> void:
	# あくしでんちゅあ本社ビル（正面のガラスのタワー）
	# Blender 製のガラス張りの本社ビル（幅34m・高さ60m・奥行き14m）
	_prop("blender/azabu/tower_hq", Vector3(0.0, 0.0, end_z - 7.0), 0.0, 0.0, false)
	# 社名（壁面とエントランスの上）。縦のフィンより手前に出す
	_sign("窓際退散", Vector3(0.0, 18.6, end_z + 0.4), 200, Color(1.0, 0.85, 0.4), 0.0)
	_sign("あくしでんちゅあ", Vector3(0.0, 14.0, end_z + 0.4), 300, Color(1.0, 1.0, 1.0), 0.0)
	_box(Vector3(14.0, 0.4, 3.0), Vector3(0.0, 4.2, end_z + 1.4), Color(0.85, 0.86, 0.88))
	_box(Vector3(10.0, 1.0, 0.2), Vector3(0.0, 5.0, end_z + 0.2), Color(0.12, 0.14, 0.2))
	_sign("あくしでんちゅあ株式会社 本社ビル", Vector3(0.0, 5.0, end_z + 0.32), 80, Color(1.0, 0.95, 0.8), 0.0)
	# エントランスの自動ドアと、社員証をかざすリーダー（ゴール）
	_box(Vector3(6.0, 3.6, 0.15), Vector3(0.0, 1.8, end_z + 0.1), Color(0.55, 0.75, 0.9, 0.5), Color(1.0, 0.9, 0.7), 0.3)
	_box(Vector3(0.08, 3.6, 0.2), Vector3(0.0, 1.8, end_z + 0.15), Color(0.6, 0.62, 0.65))
	_box(Vector3(0.5, 1.2, 0.5), goal_pos + Vector3(0, 0.6, 0), Color(0.7, 0.72, 0.75))
	_box(Vector3(0.36, 0.06, 0.36), goal_pos + Vector3(0, 1.23, 0), Color(0.2, 0.8, 0.4), Color(0.2, 1.0, 0.4), 1.5)
	_sign("社員証をタッチ", goal_pos + Vector3(0, 1.6, 0.0), 40, Color(1, 1, 1), 0.0)
	_obstacle(Rect2(goal_pos.x - 0.35, goal_pos.z - 0.35, 0.7, 0.7), 1.2)
	_add_goal_glow(Color(1.0, 0.85, 0.5))
	# 広場の植え込み・木・ベンチ（通り道を空けて配置）
	for p: Vector3 in [Vector3(-7.5, 0, -76.0), Vector3(7.5, 0, -76.0), Vector3(-7.5, 0, -90.0), Vector3(7.5, 0, -90.0)]:
		_prop("blender/azabu/zelkova_tree", p, randf() * TAU, 0.0, false, 6.5)   # ケヤキ（葉の絵を貼った板＋濃い緑の塊）
		for k in 4:
			var a := k * TAU / 4.0 + PI * 0.25
			_prop("blender/azabu/hydrangea_blue" if k % 2 == 0 else "blender/azabu/hydrangea_pink", p + Vector3(cos(a), 0.0, sin(a)) * 1.25, a, 0.0, false)
		_obstacle(Rect2(p.x - 1.3, p.z - 1.3, 2.6, 2.6), 1.0)
	# 足元のライト付きの車止め
	for x: float in [-4.0, -2.0, 2.0, 4.0]:
		_prop("blender/azabu/bollard_steel", Vector3(x, 0.0, -70.5), 0.0, 0.0, false)
		_obstacle(Rect2(x - 0.2, -70.7, 0.4, 0.4), 0.8)
	# 出社する人（動じない）
	bystanders.append({"pos": Vector3(-10.6, 0, -95.0), "yaw": PI * 0.3, "anim": "Idle_TalkingPhone", "cfg": "office_a"})
	bystanders.append({"pos": Vector3(10.6, 0, -84.0), "yaw": -PI * 0.5, "anim": "Idle_FoldArms", "cfg": "office_b"})
	_obstacle(Rect2(-11.1, -95.5, 1.0, 1.0), 1.8)
	_obstacle(Rect2(10.1, -84.5, 1.0, 1.0), 1.8)


# ---------------------------------------------------------------- 規制線（エリアの境目）

func _build_gates() -> void:
	for i in GATE_Z.size():
		var gz: float = GATE_Z[i]
		var gate := Node3D.new()
		gate.position = Vector3(0.0, 0.0, gz)
		for side: float in [-1.0, 1.0]:
			# 左右に分かれて開く。半分ずつが子ノード
			var half := Node3D.new()
			half.position = Vector3(side * half_width * 0.5, 0.0, 0.0)
			gate.add_child(half)
			for k in 4:
				var bx := (k - 1.5) * 2.9
				_barricade(half, Vector3(bx, 0.0, 0.0))
			if i == 1:
				var pc := _prop("tripo/azabu/police_car", Vector3(side * 0.8, 0.0, -2.0), PI * 0.5, 4.8, false, 0.0, half)   # Tripo 製（全長4.8m）
				# 赤い警光灯（左右に分けて、交互に点滅させる）
				for h: float in [-1.0, 1.0]:
					var lo := Vector3(0.0 if h > 0.0 else -0.145, 0.372, -0.07)
					var hi := Vector3(0.145 if h > 0.0 else 0.0, 0.402, -0.003)
					beacons.append([_glow_part(pc, lo, hi, Color(1.0, 0.02, 0.01), 6.0, 7.0), 0.0 if h > 0.0 else PI + side])
			var tape := _box(Vector3(half_width - 0.6, 0.12, 0.02), Vector3(0.0, 1.5, 0.3), Color(1.0, 0.85, 0.1), Color.BLACK, 0.0, half)
			tape.rotation.z = side * 0.04
			_sign("POLICE LINE 立入禁止", Vector3(0.0, 1.5, 0.33), 40, Color(0.05, 0.05, 0.05), 0.0, half).outline_size = 0
		_add_gate(gate, "slide")
		_sign(["商店街 → 一時通行止め", "本社前 → 一時通行止め"][i], Vector3(0.0, 2.6, gz + 0.4), 70, Color(1, 1, 1), 0.0)


## A 型バリケード（Blender 製・幅2.8m）
func _barricade(parent: Node3D, pos: Vector3) -> void:
	_prop("blender/azabu/barricade", pos, 0.0, 0.0, false, 0.0, parent)


## 紫陽花の鉢（Blender 製・0.66m 角）を、植え込みの大きさに敷き詰める
func _planter(p: Vector3, size: Vector3) -> void:
	var nx := maxi(1, roundi(size.x / 0.75))
	var nz := maxi(1, roundi(size.z / 0.75))
	for ix in nx:
		for iz in nz:
			var q := p + Vector3((ix - (nx - 1) * 0.5) * size.x / nx, 0.0, (iz - (nz - 1) * 0.5) * size.z / nz)
			# 紫陽花の鉢（Blender 製・青紫とピンクを交互に）
			_prop("blender/azabu/hydrangea_blue" if (ix + iz) % 2 == 0 else "blender/azabu/hydrangea_pink", q, (ix * 3 + iz) * 1.3, 0.0, false)
	_obstacle(Rect2(p.x - size.x * 0.5, p.z - size.z * 0.5, size.x, size.z), size.y + 0.3)


## ベンチ（Blender 製・長さ2.0m）。背もたれを +X（店の側）にする
func _bench(p: Vector3) -> void:
	_prop("blender/azabu/bench", p, -PI * 0.5, 0.0, false)
	_obstacle(Rect2(p.x - 0.35, p.z - 1.0, 0.7, 2.0), 1.0)


## のぼり旗（Blender 製）。モデルの中心は竿から +0.23m、旗の中心は中心から +0.11m（x）・高さ1.88m
func _nobori(p: Vector3) -> void:
	_prop("blender/azabu/nobori", p, 0.0, 0.0, false)
	_sign("生\nビ\nー\nル", p + Vector3(0.11, 1.88, 0.02), 64, Color(1, 1, 1), 0.0)
	_obstacle(Rect2(p.x - 0.45, p.z - 0.2, 0.9, 0.4), 3.0)
