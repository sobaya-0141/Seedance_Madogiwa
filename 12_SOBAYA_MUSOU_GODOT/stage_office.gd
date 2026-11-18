extends "res://stage_base.gd"
## ステージ3: あくしでんちゅあ本社ビル。
## 1F エントランスロビー → セキュリティゲート → 12F 一般オフィス → ガラス扉 → 窓際族エリア
## （奥の窓から東京タワー。窓際の立ち飲み処にビールを納品してゴール）。
## 一般社員は戦いに加わらず、騒ぎに動じず業務を続ける（WORLD_BIBLE: 一般社員と窓際族の関係は良好）。

const FLOOR_SHADER := """
shader_type spatial;
//FLOOR_SAMPLERS
varying vec3 world_pos;
void vertex() { world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec2 w = world_pos.xz;
	vec3 col;
	vec3 arm;
	vec3 nm;
	float rough;
	if (w.y > -30.0) {
		// ロビー: 石の床（a）を大判の市松に。磨いてあるので映り込む
		vec2 uv = w / 3.0;
		vec3 d = texture(a_diff, uv).rgb;
		arm = texture(a_arm, uv).rgb;
		nm = mix(texture(a_nor, uv).rgb, vec3(0.5, 0.5, 1.0), 0.5);
		float lum = dot(d, vec3(0.299, 0.587, 0.114));
		vec2 c = floor(w / 3.0);
		float checker = mod(c.x + c.y, 2.0);
		col = mix(vec3(0.82, 0.79, 0.74), vec3(0.6, 0.56, 0.5), checker) * (0.75 + lum * 0.5);
		vec2 f = fract(w / 3.0);
		col -= step(0.995, max(f.x, f.y)) * 0.12;
		rough = 0.12 + arm.g * 0.15;
	} else if (w.y > -66.0) {
		// 一般オフィス: タイルカーペット（b）
		vec2 uv = w / 3.0;
		col = texture(b_diff, uv).rgb * vec3(1.05, 1.1, 1.15);
		arm = texture(b_arm, uv).rgb;
		nm = texture(b_nor, uv).rgb;
		rough = 0.95;
	} else {
		// 窓際族エリア: 木の床（c）
		vec2 uv = w / 3.0;
		col = texture(c_diff, uv).rgb;
		arm = texture(c_arm, uv).rgb;
		nm = texture(c_nor, uv).rgb;
		rough = arm.g * 0.8;
	}
	ALBEDO = col;
	ROUGHNESS = rough;
	AO = arm.r;
	NORMAL_MAP = nm;
}
"""

const GATE_Z := [-30.0, -66.0]
const CEILING := 6.6
const GLASS_H := 5.0

var worker_cfgs := ["office_a", "office_b", "office_c"]


func _init() -> void:
	stage_title = "あくしでんちゅあ本社ビル"
	stage_tagline = "「業務中の酒は禁止！」本社警備隊がビールの持ち込みを止めに来た。\n一般社員の業務を邪魔せず、窓際の立ち飲み処までビールを届けて開店せよ！"
	half_width = 13.0
	start_z = 8.0
	end_z = -100.0
	goal_pos = Vector3(0.0, 0.0, -94.0)
	zones = [
		{"name": "1F エントランスロビー", "z_far": -30.0, "z_near": 8.0, "mix": {"bldg_guard": 1.0}, "captain": "lobby_chief", "captain_at": 15},
		{"name": "12F 一般オフィス", "z_far": -66.0, "z_near": -30.0, "mix": {"bldg_guard": 0.5, "bldg_baton": 0.5}, "captain": "floor_chief", "captain_at": 22},
		{"name": "窓際族エリア", "z_far": -100.0, "z_near": -66.0, "mix": {"bldg_guard": 0.3, "bldg_baton": 0.7}, "captain": "security_head", "captain_at": 0},
	]
	start_line = "おはようございます！ 出社です！"
	goal_objective = "立ち飲み処にビールを納品せよ！（カウンターで F 長押し）"
	goal_banner = "警備本部長 撃破！"
	goal_line = "開店準備です！"
	win_banner = "立ち飲み処、開店！"
	win_result = "本社ビル 窓際まで到達"
	views = [[Vector3(2.0, 4.0, 6.0), Vector3(0.0, 1.0, -20.0)], [Vector3(0.0, 4.5, -36.0), Vector3(0.0, 1.0, -56.0)], [Vector3(-2.0, 3.6, -68.0), Vector3(1.0, 2.0, -100.0)], [Vector3(5.0, 2.6, -79.0), Vector3(-1.0, 1.2, -93.0)]]


func _build_stage() -> void:
	# 朝: 奥の窓から朝日が差し込む（窓枠の影と光の筋）。大理石の床には映り込み（SSR）
	_build_environment({"top": Color(0.33, 0.56, 0.9), "horizon": Color(0.92, 0.88, 0.82), "clouds": 0.35,
		"sun_rot": Vector3(-28.0, 165.0, 0.0), "sun_color": Color(1.0, 0.9, 0.76), "sun_energy": 2.2, "ambient": 0.75, "ambient_color": Color(0.85, 0.9, 1.0),
		"vol_fog": 0.004, "vol_fog_color": Color(1.0, 0.95, 0.88), "ssr": true, "exposure": 1.05})
	_build_floor(FLOOR_SHADER, 1.0, {"a": "marble_tiles", "b": "carpet006", "c": "wood_floor"})
	_build_shell()
	_build_lobby()
	_build_office()
	_build_madogiwa()
	_build_gates()
	_build_view()


# ---------------------------------------------------------------- 壁・天井・照明

func _build_shell() -> void:
	var length := start_z - end_z
	var mid := (start_z + end_z) * 0.5
	surface = "plaster"
	for side: float in [-1.0, 1.0]:
		_box(Vector3(1.0, CEILING, length + 2.0), Vector3(side * (half_width + 0.5), CEILING * 0.5, mid), Color(0.9, 0.89, 0.86))
		# 幅木
		_box(Vector3(0.06, 0.15, length), Vector3(side * (half_width - 0.02), 0.08, mid), Color(0.35, 0.33, 0.3))
	surface = ""
	# 入口側（後ろ）のガラス
	_box(Vector3(half_width * 2.0, CEILING, 0.2), Vector3(0.0, CEILING * 0.5, start_z + 1.0), Color(0.6, 0.75, 0.85, 0.35))
	# 天井は影を落とす（日差しは奥の窓からだけ入り、室内は照明で明るくする）
	_box(Vector3(half_width * 2.0 + 2.0, 0.3, length + 2.0), Vector3(0.0, CEILING + 0.15, mid), Color(0.92, 0.92, 0.9))
	var z := start_z - 3.0
	while z > end_z + 2.0:
		for x: float in [-6.0, 0.0, 6.0]:
			var panel := _box(Vector3(1.2, 0.05, 2.4), Vector3(x, CEILING - 0.03, z), Color(1, 1, 1), Color(1.0, 0.98, 0.92), 1.6)
			panel.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		z -= 6.0
	# 照明（Web版の Compatibility 描画は1つの物体に当たるライトの数に上限があるので、少なく大きく）
	for lz: float in [2.0, -12.0, -24.0, -40.0, -54.0, -74.0, -88.0]:
		var lamp := OmniLight3D.new()
		lamp.light_color = Color(1.0, 0.96, 0.9)
		lamp.light_energy = 1.6
		lamp.omni_range = 16.0
		lamp.omni_attenuation = 0.7
		lamp.position = Vector3(0.0, CEILING - 0.6, lz)
		add_child(lamp)


# ---------------------------------------------------------------- エリア1: ロビー

func _build_lobby() -> void:
	# 柱
	for p: Vector3 in [Vector3(-6.5, 0, -3.0), Vector3(6.5, 0, -3.0), Vector3(-6.5, 0, -17.0), Vector3(6.5, 0, -17.0)]:
		_prop("blender/office/column", p, 0.0, 0.0, true, CEILING)
	# 受付カウンターと受付の人
	var rc := Vector3(-8.0, 0.0, -9.0)
	_prop("blender/office/reception_counter", rc, PI, 0.0, false)
	_box(Vector3(5.0, 2.6, 0.2), rc + Vector3(0, 1.9, -2.6), Color(0.35, 0.25, 0.18))
	_sign("窓際退散", rc + Vector3(0, 2.8, -2.48), 50, Color(1.0, 0.85, 0.4), 0.0)
	_sign("あくしでんちゅあ", rc + Vector3(0, 2.2, -2.48), 80, Color(1, 1, 1), 0.0)
	_sign("受付　RECEPTION", rc + Vector3(0, 1.5, -2.48), 55, Color(1.0, 0.95, 0.8), 0.0)
	_obstacle(Rect2(rc.x - 2.5, rc.z - 2.8, 5.0, 3.4), 2.6)
	for x: float in [-1.2, 1.2]:
		bystanders.append({"pos": rc + Vector3(x, 0, -1.2), "yaw": 0.0, "anim": "addon/Idle_Subtle", "cfg": "office_c"})
	# 来客用のソファ
	for sz: float in [-9.0, -22.0]:
		var sp := Vector3(8.6, 0.0, sz)
		_prop("blender/office/lobby_sofa", sp + Vector3(1.4, 0, 0), -PI * 0.5, 0.0, false)
		_prop("blender/office/coffee_table", sp, PI * 0.5, 0.0, false)
		_obstacle(Rect2(sp.x - 0.6, sp.z - 1.3, 3.0, 2.6), 0.9)
	bystanders.append({"pos": Vector3(10.0, 0.0, -22.0), "yaw": -PI * 0.5, "anim": "Sitting_Idle", "cfg": "office_b"})
	# 観葉植物
	for p: Vector3 in [Vector3(-11.8, 0, 3.0), Vector3(11.8, 0, 3.0), Vector3(-11.8, 0, -27.0), Vector3(11.8, 0, -27.0)]:
		_plant(p)
	# エレベーター（壁の扉。警備員はここから出てくる）
	for side: float in [-1.0, 1.0]:
		for ez: float in [-5.0, -13.0, -24.0]:
			_box(Vector3(0.1, 2.6, 1.8), Vector3(side * (half_width - 0.05), 1.3, ez), Color(0.72, 0.74, 0.76), Color.BLACK, 0.0, null, 0.8)
			_box(Vector3(0.12, 0.3, 0.6), Vector3(side * (half_width - 0.05), 2.9, ez), Color(0.1, 0.1, 0.12), Color(1.0, 0.6, 0.2), 0.8)


func _plant(p: Vector3) -> void:
	_prop("blender/office/potted_palm", p, randf() * TAU, 0.0, false)
	_obstacle(Rect2(p.x - 0.4, p.z - 0.4, 0.8, 0.8), 2.0)


# ---------------------------------------------------------------- エリア2: 一般オフィス

func _build_office() -> void:
	_box(Vector3(5.0, 0.8, 0.08), Vector3(0.0, 5.4, -34.0), Color(0.2, 0.25, 0.35))
	_sign("12F 一般オフィス", Vector3(0.0, 5.4, -33.94), 80, Color(1, 1, 1), 0.0)
	var rng := RandomNumberGenerator.new()
	rng.seed = 1212
	for ix: float in [-6.5, 6.5]:
		for iz: float in [-38.0, -50.0]:
			# 島型のデスク（向かい合わせ2列×4席）。席の一般社員は動じず業務を続ける
			# 4人掛けの島（Blender の desk_island、幅3.2m×奥行き1.6m）を90度回して、縦に2つ並べる
			for dz: float in [-1.8, 1.8]:
				_prop("blender/office/desk_island", Vector3(ix, 0.0, iz + dz), PI * 0.5, 0.0, false)
			for k in 4:
				var sz := iz - 2.6 + k * 1.6 + (0.2 if k >= 2 else -0.2)
				for side: float in [-1.0, 1.0]:
					var cx := ix + side * 1.25
					_prop("blender/office/office_chair", Vector3(cx, 0.0, sz), side * PI * 0.5, 0.0, false)
					if rng.randf() < 0.7:
						bystanders.append({"pos": Vector3(cx, 0.0, sz), "yaw": -side * PI * 0.5, "anim": "Sitting_Idle", "cfg": worker_cfgs[rng.randi() % worker_cfgs.size()]})
			_obstacle(Rect2(ix - 1.7, iz - 3.7, 3.4, 7.4), 1.3)
	# 会議室（ガラス張り）
	var mr := Vector3(9.5, 0.0, -60.5)
	for gx: float in [-3.4, 3.4]:
		_box(Vector3(0.08, 3.0, 6.0), mr + Vector3(gx, 1.5, 0), Color(0.6, 0.75, 0.85, 0.3))
	for gz: float in [-3.0, 3.0]:
		_box(Vector3(6.8, 3.0, 0.08), mr + Vector3(0, 1.5, gz), Color(0.6, 0.75, 0.85, 0.3))
	_box(Vector3(2.4, 0.06, 3.6), mr + Vector3(0, 0.74, 0), Color(0.95, 0.95, 0.93))
	_box(Vector3(0.6, 0.7, 0.6), mr + Vector3(0, 0.37, 0), Color(0.6, 0.6, 0.62))
	_box(Vector3(2.6, 0.5, 0.06), mr + Vector3(0, 2.6, 3.05), Color(0.2, 0.25, 0.35))
	_sign("会議中", mr + Vector3(0, 2.6, 3.1), 60, Color(1, 1, 1), 0.0)
	for p: Vector3 in [Vector3(-1.6, 0, -0.9), Vector3(-1.6, 0, 0.9), Vector3(1.6, 0, 0.0)]:
		_box(Vector3(0.55, 0.08, 0.55), mr + p + Vector3(0, 0.46, 0), Color(0.15, 0.15, 0.17))
		bystanders.append({"pos": mr + p, "yaw": -signf(p.x) * PI * 0.5, "anim": "Sitting_Talking", "cfg": worker_cfgs[int(p.z + 2.0) % 3]})
	_obstacle(Rect2(mr.x - 3.5, mr.z - 3.1, 7.0, 6.2), 3.0)
	# 壁際の本棚とゴミ箱
	for bz: float in [-36.0, -38.5, -50.0]:
		_prop("blender/office/bookshelf", Vector3(-12.75, 0.0, bz), PI * 0.5, 0.0)
	_prop("furniture-kit/trashcan", Vector3(12.4, 0.0, -44.0), 0.0, 0.0, true, 0.6)
	_prop("furniture-kit/coatRackStanding", Vector3(12.3, 0.0, -36.0), 0.0, 0.0, true, 1.8)
	# コピー機とホワイトボード
	_box(Vector3(1.0, 1.1, 0.8), Vector3(-11.8, 0.55, -58.0), Color(0.88, 0.88, 0.86))
	_box(Vector3(0.9, 0.05, 0.6), Vector3(-11.8, 1.13, -58.0), Color(0.2, 0.2, 0.22))
	_obstacle(Rect2(-12.4, -58.5, 1.2, 1.0), 1.2)
	_box(Vector3(0.06, 1.2, 2.4), Vector3(-12.9, 1.6, -45.0), Color(0.97, 0.97, 0.97))
	_sign("今週の目標：\n真面目に業務", Vector3(-12.85, 1.6, -45.0), 40, Color(0.15, 0.3, 0.7), PI * 0.5).outline_size = 0
	bystanders.append({"pos": Vector3(-11.6, 0, -61.0), "yaw": PI * 0.75, "anim": "Idle_TalkingPhone", "cfg": "office_a"})
	_obstacle(Rect2(-12.1, -61.5, 1.0, 1.0), 1.8)


# ---------------------------------------------------------------- エリア3: 窓際族エリア

func _build_madogiwa() -> void:
	# 立ち飲み処（ゴール）: 紺の暖簾・赤提灯・ビールサーバ
	var g := goal_pos
	_prop("blender/office/standing_bar", g, 0.0, 4.6, false)
	var noren := ["窓", "際", "族"]
	for k in 3:
		# 暖簾の文字（暖簾そのものは standing_bar のモデル）
		var p := g + Vector3(-1.45 + k * 1.45, 2.95, 0.66)
		_sign(noren[k], p, 80, Color(1, 1, 1), 0.0).outline_size = 0
	_box(Vector3(2.8, 0.6, 0.1), g + Vector3(0, 4.25, 0.3), Color(0.92, 0.85, 0.7))
	_sign("立ち飲み処", g + Vector3(0, 4.25, 0.37), 72, Color(0.15, 0.1, 0.08), 0.0).outline_size = 0
	_obstacle(Rect2(g.x - 3.6, g.z - 2.7, 7.2, 3.3), 2.4)
	_add_goal_glow(Color(1.0, 0.78, 0.4))
	# 開店を待つ一般社員（窓際族の店の常連客）
	bystanders.append({"pos": g + Vector3(-3.1, 0, 0.1), "yaw": PI * 0.75, "anim": "Idle_Talking", "cfg": "office_a"})
	bystanders.append({"pos": g + Vector3(3.1, 0, 0.1), "yaw": -PI * 0.75, "anim": "addon/Idle Listening", "cfg": "office_c"})
	# アーロンチュア（段ボールを積んだ椅子。箱には手書きで「アーロンチェア」）
	for p: Vector3 in [Vector3(-9.6, 0, -73.0), Vector3(-10.8, 0, -80.0)]:
		_prop("blender/office/cardboard_chair", p, 0.0, 0.0, false)
		_sign("アーロンチェア", p + Vector3(0, 0.66, 0.31), 34, Color(0.15, 0.12, 0.1), 0.0).outline_size = 0
		_obstacle(Rect2(p.x - 0.45, p.z - 0.45, 0.9, 0.9), 1.6)
	# 窓際の机と手書きの貼り紙「窓際族」
	_box(Vector3(1.6, 0.06, 0.8), Vector3(-9.6, 0.74, -74.0), Color(0.75, 0.58, 0.38))
	_box(Vector3(1.4, 0.7, 0.7), Vector3(-9.6, 0.36, -74.0), Color(0.68, 0.52, 0.33))
	_obstacle(Rect2(-10.4, -74.4, 1.6, 0.8), 0.8)
	var paper := _box(Vector3(1.4, 0.8, 0.04), Vector3(-8.5, 5.6, -65.82), Color(0.97, 0.96, 0.92))
	paper.rotation.z = 0.05
	_sign("窓際族", Vector3(-8.5, 5.6, -65.78), 90, Color(0.1, 0.1, 0.1), 0.0).outline_size = 0
	# ソファ・キャンプ用品・BBQ
	_prop("blender/office/red_sofa", Vector3(10.6, 0, -75.0), -PI * 0.5, 0.0, false)
	_prop("blender/office/floor_lamp", Vector3(11.6, 0, -72.4), 0.0, 0.0, true)
	for sz2: float in [-78.4, -71.6]:
		_prop("blender/office/speaker", Vector3(12.2, 0, sz2), -PI * 0.5, 0.0, true)
	_obstacle(Rect2(10.0, -76.4, 1.4, 2.8), 0.9)
	_prop("blender/office/dome_tent", Vector3(10.4, 0.0, -86.0), -PI * 0.75, 0.0)
	# 酒屋の在庫: 樽と段ボール
	for k in 3:
		_prop("blender/office/barrel", Vector3(-4.6 + (k % 2) * 0.8, 0.0, -96.0 + k * 0.9), randf() * TAU, 0.0, true)
	_prop("blender/office/cardboard_stack", Vector3(-11.4, 0.0, -84.0), 0.3, 0.0)
	_prop("blender/office/aframe_sign", Vector3(-7.8, 0.0, -78.0), 0.4, 0.0)
	_prop("survival-kit/bedroll", Vector3(8.2, 0.0, -88.6), 0.4, 1.9)
	_prop("survival-kit/bucket", Vector3(8.6, 0.0, -84.2), 0.0, 0.0, true, 0.45)
	var bbq := Vector3(-6.5, 0.0, -87.0)
	_prop("blender/office/kettle_grill", bbq, 0.6, 0.0)
	# やめ太郎の手配書（ワンピース風の手配書。段ボールの立て看板に貼ってある）
	var wp := Vector3(-11.2, 0.0, -90.0)
	_box(Vector3(1.5, 2.2, 0.1), wp + Vector3(0, 1.4, 0), Color(0.72, 0.55, 0.35)).rotation.y = 0.5
	var poster := _box(Vector3(1.2, 1.7, 0.02), wp + Vector3(0.03, 1.45, 0.06), Color(0.93, 0.86, 0.68))
	poster.rotation.y = 0.5
	_sign("WANTED\nやめ太郎\n\n賞金 2億", wp + Vector3(0.05, 1.5, 0.09), 48, Color(0.3, 0.15, 0.05), 0.5).outline_size = 0
	_obstacle(Rect2(wp.x - 0.8, wp.z - 0.5, 1.6, 1.0), 2.4)
	# 空き缶
	var rng := RandomNumberGenerator.new()
	rng.seed = 66
	for k in 14:
		var can := _cyl(0.035, 0.12, Vector3(rng.randf_range(-11.0, 11.0), 0.06, rng.randf_range(-98.0, -68.0)), [Color(0.85, 0.75, 0.3), Color(0.8, 0.8, 0.82), Color(0.2, 0.4, 0.7)][k % 3], 0.6)
		if k % 2 == 0:
			can.rotation.z = PI * 0.5


# ---------------------------------------------------------------- ゲート（ガラスの仕切り）

func _build_gates() -> void:
	for i in GATE_Z.size():
		var gz: float = GATE_Z[i]
		var gate := Node3D.new()
		gate.position = Vector3(0.0, 0.0, gz)
		for side: float in [-1.0, 1.0]:
			var half := Node3D.new()
			half.position = Vector3(side * half_width * 0.5, 0.0, 0.0)
			gate.add_child(half)
			_box(Vector3(half_width, GLASS_H, 0.08), Vector3(0, GLASS_H * 0.5, 0), Color(0.6, 0.78, 0.88, 0.3), Color.BLACK, 0.0, half)
			_box(Vector3(half_width, 0.08, 0.12), Vector3(0, GLASS_H, 0), Color(0.6, 0.62, 0.65), Color.BLACK, 0.0, half)
			_box(Vector3(half_width, 0.08, 0.12), Vector3(0, 0.04, 0), Color(0.6, 0.62, 0.65), Color.BLACK, 0.0, half)
			if i == 0:
				# 入館ゲート（フラップ式）の列
				for k in 5:
					var px := -half_width * 0.5 + 1.0 + k * 2.4
					_box(Vector3(0.25, 1.0, 1.2), Vector3(px, 0.5, 0.9), Color(0.75, 0.77, 0.8), Color.BLACK, 0.0, half)
					_box(Vector3(0.2, 0.04, 0.2), Vector3(px, 1.02, 0.6), Color(0.2, 0.8, 0.4), Color(0.2, 1.0, 0.4), 1.0, half)
			else:
				# 手書きの段ボール看板
				var board := _box(Vector3(1.8, 0.9, 0.04), Vector3(-side * 1.2, 1.6, 0.06), Color(0.75, 0.58, 0.38), Color.BLACK, 0.0, half)
				board.rotation.z = side * 0.06
				_sign("この先\n窓際族エリア", Vector3(-side * 1.2, 1.6, 0.1), 44, Color(0.1, 0.1, 0.1), 0.0, half).outline_size = 0
		_add_gate(gate, "slide")
		# 仕切りの上の壁（カメラの高さより上だけにして、くぐるときに視界を遮らない）
		_box(Vector3(half_width * 2.0, CEILING - GLASS_H, 0.3), Vector3(0.0, GLASS_H + (CEILING - GLASS_H) * 0.5, gz), Color(0.88, 0.87, 0.84))
		_sign(["セキュリティゲート ― 社員証をかざしてください", "窓際族エリア（一般社員の皆さまもお気軽にどうぞ）"][i], Vector3(0.0, 5.8, gz + 0.17), 80, Color(0.2, 0.25, 0.35), 0.0).outline_size = 0


# ---------------------------------------------------------------- 窓の外（12F からの眺め）

func _build_view() -> void:
	# 奥の壁は全面ガラス
	_box(Vector3(half_width * 2.0, CEILING, 0.06), Vector3(0.0, CEILING * 0.5, end_z - 0.2), Color(0.75, 0.88, 0.95, 0.12))
	for k in 9:
		_box(Vector3(0.15, CEILING, 0.2), Vector3(-half_width + k * half_width * 2.0 / 8.0, CEILING * 0.5, end_z - 0.2), Color(0.5, 0.52, 0.55))
	_box(Vector3(half_width * 2.0, 0.5, 0.4), Vector3(0.0, 0.25, end_z - 0.1), Color(0.5, 0.52, 0.55))
	# 眼下の街並み（ビルの屋上が窓より下に並ぶ）
	var bm := BoxMesh.new()
	bm.size = Vector3.ONE
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.roughness = 0.8
	bm.material = mat
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = bm
	mm.instance_count = 90
	var rng := RandomNumberGenerator.new()
	rng.seed = 333
	for k in 90:
		var w := rng.randf_range(8.0, 20.0)
		var top := rng.randf_range(-40.0, -6.0)
		var p := Vector3(rng.randf_range(-160.0, 160.0), (top - 60.0) * 0.5, rng.randf_range(end_z - 20.0, end_z - 320.0))
		mm.set_instance_transform(k, Transform3D(Basis().scaled(Vector3(w, top + 60.0, rng.randf_range(8.0, 20.0))), p))
		mm.set_instance_color(k, Color(0.7, 0.72, 0.76).lerp(Color(0.85, 0.8, 0.72), rng.randf()))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	add_child(mmi)
	_tokyo_tower(Vector3(12.0, -60.0, end_z - 80.0), 115.0)
