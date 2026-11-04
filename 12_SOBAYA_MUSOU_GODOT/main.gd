extends Node3D
## そば屋無双 〜ビール工場強奪作戦〜
## そば屋がビール工場に乗り込み、警備員・警察官をジョッキでなぎ倒しながら3エリアを突破して、
## 製造ラインのできたてビールを奪う。攻撃はドタバタ表現（吹っ飛んで目を回し、床に沈んで退場）。

const PlayerScript := preload("res://player.gd")
const EnemyScript := preload("res://enemy.gd")
const StageScript := preload("res://stage.gd")
const AddonScene := preload("res://models/mannequin_addon.glb")
const BaseScene := preload("res://models/mannequin_base.glb")

const MAX_ACTIVE := 32
const SPAWN_INTERVAL := 0.28
const MAX_TOKENS := 3
const GRAB_TIME := 1.6
const CAMERA_DISTANCE := 8.0
const CAMERA_HEIGHT := 4.6

# 敵の種類。色は制服（頂点カラー）、cap/badge は帽子
const ENEMY_TYPES := {
	"guard": {"key": "guard", "hp": 40.0, "speed": 3.3, "dmg": 28.0, "attack_anim": "Punch_Jab", "attack_speed": 1.4, "attack_hit": 0.42, "range": 1.5,
		"shirt": Color(0.55, 0.7, 0.88), "pants": Color(0.22, 0.24, 0.28), "glove": Color(0.93, 0.8, 0.66), "cap": Color(0.3, 0.33, 0.4), "badge": Color(0.8, 0.82, 0.86)},
	"police": {"key": "police", "hp": 70.0, "speed": 3.7, "dmg": 38.0, "attack_anim": "Sword_Regular_A", "attack_speed": 0.85, "attack_hit": 0.5, "range": 1.8, "baton": true, "tie": true,
		"shirt": Color(0.13, 0.19, 0.38), "pants": Color(0.1, 0.13, 0.26), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.1, 0.14, 0.3), "badge": Color(1.0, 0.8, 0.25)},
	"captain": {"key": "captain", "title": "警備隊長", "hp": 650.0, "speed": 3.2, "dmg": 70.0, "attack_anim": "Melee_Hook", "attack_speed": 0.6, "attack_hit": 0.5, "range": 2.0, "scale": 1.25, "armor": true,
		"shirt": Color(0.3, 0.42, 0.65), "pants": Color(0.15, 0.17, 0.22), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.15, 0.2, 0.35), "badge": Color(1.0, 0.8, 0.25)},
	"sergeant": {"key": "sergeant", "title": "巡査部長", "hp": 900.0, "speed": 3.5, "dmg": 75.0, "attack_anim": "Sword_Regular_A", "attack_speed": 0.6, "attack_hit": 0.5, "range": 2.2, "scale": 1.25, "armor": true, "baton": true, "tie": true,
		"shirt": Color(0.1, 0.15, 0.32), "pants": Color(0.08, 0.1, 0.22), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.08, 0.11, 0.25), "badge": Color(1.0, 0.8, 0.25)},
	"boss": {"key": "boss", "title": "警部", "hp": 2000.0, "speed": 3.4, "dmg": 85.0, "attack_anim": "Punch_Cross", "attack_speed": 0.9, "attack_hit": 0.45, "range": 2.4, "scale": 1.4, "armor": true, "tie": true,
		"special": true, "special_cd": 6.0, "special_dmg": 90.0,
		"shirt": Color(0.18, 0.16, 0.2), "pants": Color(0.12, 0.11, 0.14), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.1, 0.1, 0.12), "badge": Color(1.0, 0.85, 0.3)},
}

const ZONES := [
	{"name": "正門ヤード", "z_far": -30.0, "z_near": 8.0, "quota": 30, "mix": {"guard": 1.0}, "captain": "captain", "captain_at": 14},
	{"name": "倉庫", "z_far": -62.0, "z_near": -30.0, "quota": 45, "mix": {"guard": 0.45, "police": 0.55}, "captain": "sergeant", "captain_at": 22},
	{"name": "製造ライン", "z_far": -98.0, "z_near": -62.0, "quota": 55, "mix": {"guard": 0.15, "police": 0.85}, "captain": "boss", "captain_at": 0},
]

const KO_LINES := {50: "快適です！", 100: "メリットでもあります！", 150: "ビールが呼んでいます！", 200: "まだまだいけます！"}

enum Phase { TITLE, PLAY, WIN, LOSE }

var phase := Phase.TITLE
var stage: Node3D
var player: Node3D
var enemies: Array[Node3D] = []
var tokens: Array[Node3D] = []
var pickups: Array[Dictionary] = []
var camera: Camera3D
var cam_yaw := 0.0
var shake := 0.0
var t := 0.0
var play_time := 0.0

var zone := 0
var zone_active := false      # プレイヤーがエリアに入り、敵が出始めたか
var zone_spawned := 0
var zone_ko := 0
var captain_spawned := false
var captain: Node3D
var spawn_timer := 0.0
var goal_open := false
var grab_t := 0.0
var ko_total := 0
var combo := 0
var combo_timer := 0.0
var max_combo := 0

var addon_library: AnimationLibrary
var uniform_material: StandardMaterial3D
var uniform_meshes := {}
var base_mesh: Mesh
var jp_font: Font

# FX
var burst_pool: Array[CPUParticles3D] = []
var burst_index := 0
var musou_aura: CPUParticles3D

# UI
var hp_bar: ProgressBar
var musou_bar: ProgressBar
var musou_fill: StyleBoxFlat
var musou_label: Label
var ko_label: Label
var time_label: Label
var objective_label: Label
var combo_label: Label
var banner_label: Label
var boss_box: VBoxContainer
var boss_name: Label
var boss_bar: ProgressBar
var grab_bar: ProgressBar
var damage_flash: ColorRect
var title_panel: Control
var result_label: Label
var speech: Label3D
var speech_timer := 0.0
var banner_timer := 0.0

# 動作確認用
var shot_path := ""
var shot_frame := 300
var frame_count := 0
var auto_play := false
var bot_interact := false
var nav_cache := {}
var snap_frames: Array[int] = []
var musou_test_frame := 0
var quit_after_end := -1.0     # 勝敗が決まってから終了するまでの秒数（動画撮影用）


func _ready() -> void:
	randomize()
	# ブラウザ版では端末のフォントが使えないので、同梱の日本語フォント（OFL）を使う
	jp_font = load("res://fonts/MPLUSRounded1c-ExtraBold.ttf")
	_setup_input()
	_load_enemy_resources()
	stage = StageScript.new()
	add_child(stage)
	stage.build(jp_font)
	_build_navigation()
	player = PlayerScript.new()
	player.game = self
	add_child(player)
	camera = Camera3D.new()
	camera.fov = 60.0
	add_child(camera)
	_build_fx()
	_build_ui()
	_parse_debug_args()
	_reset()
	if auto_play:
		_start_game()


# ---------------------------------------------------------------- 準備

func _setup_input() -> void:
	_add_action("move_left", [_key(KEY_A), _axis(JOY_AXIS_LEFT_X, -1.0)])
	_add_action("move_right", [_key(KEY_D), _axis(JOY_AXIS_LEFT_X, 1.0)])
	_add_action("move_up", [_key(KEY_W), _axis(JOY_AXIS_LEFT_Y, -1.0)])
	_add_action("move_down", [_key(KEY_S), _axis(JOY_AXIS_LEFT_Y, 1.0)])
	_add_action("cam_left", [_key(KEY_Q), _axis(JOY_AXIS_RIGHT_X, -1.0)])
	_add_action("cam_right", [_key(KEY_E), _axis(JOY_AXIS_RIGHT_X, 1.0)])
	_add_action("attack", [_key(KEY_J), _mouse(MOUSE_BUTTON_LEFT), _button(JOY_BUTTON_X)])
	_add_action("charge", [_key(KEY_K), _mouse(MOUSE_BUTTON_RIGHT), _button(JOY_BUTTON_Y)])
	_add_action("musou", [_key(KEY_L), _button(JOY_BUTTON_B)])
	_add_action("dodge", [_key(KEY_SPACE), _button(JOY_BUTTON_A)])
	_add_action("grab", [_key(KEY_F), _button(JOY_BUTTON_RIGHT_SHOULDER)])
	_add_action("start", [_key(KEY_ENTER), _button(JOY_BUTTON_START)])
	_add_action("restart", [_key(KEY_R), _button(JOY_BUTTON_BACK)])


func _add_action(action: StringName, events: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action, 0.25)
	for ev: InputEvent in events:
		InputMap.action_add_event(action, ev)


func _key(code: Key) -> InputEventKey:
	var ev := InputEventKey.new()
	ev.physical_keycode = code
	return ev


func _mouse(index: MouseButton) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = index
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


func _load_enemy_resources() -> void:
	var addon: Node = AddonScene.instantiate()
	var addon_ap: AnimationPlayer = addon.find_children("*", "AnimationPlayer", true, false)[0]
	addon_library = addon_ap.get_animation_library("")
	addon.free()
	for a: String in ["addon/Dizzy", "addon/Fighting Idle"]:
		addon_library.get_animation(a.trim_prefix("addon/")).loop_mode = Animation.LOOP_LINEAR
	var base: Node = BaseScene.instantiate()
	var base_ap: AnimationPlayer = base.find_children("*", "AnimationPlayer", true, false)[0]
	for a: String in ["Walk", "Jog", "Idle_A"]:
		base_ap.get_animation(a).loop_mode = Animation.LOOP_LINEAR
	base_mesh = (base.find_children("*", "MeshInstance3D", true, false)[0] as MeshInstance3D).mesh
	base.free()
	uniform_material = StandardMaterial3D.new()
	uniform_material.vertex_color_use_as_albedo = true
	uniform_material.roughness = 0.7


## 制服の色を休止姿勢（Tポーズ）の頂点位置から決めて、頂点カラー入りのメッシュを作る（種類ごとに1回）
func uniform_mesh(cfg: Dictionary) -> ArrayMesh:
	if uniform_meshes.has(cfg.key):
		return uniform_meshes[cfg.key]
	var out := ArrayMesh.new()
	for s in base_mesh.get_surface_count():
		var arrays := base_mesh.surface_get_arrays(s)
		var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		var colors := PackedColorArray()
		colors.resize(verts.size())
		for i in verts.size():
			colors[i] = _uniform_color(verts[i], cfg)
		arrays[Mesh.ARRAY_COLOR] = colors
		var flags: int = base_mesh.surface_get_format(s) & Mesh.ARRAY_FLAG_USE_8_BONE_WEIGHTS
		out.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays, [], {}, flags)
	uniform_meshes[cfg.key] = out
	return out


func _uniform_color(v: Vector3, cfg: Dictionary) -> Color:
	var ax := absf(v.x)
	var skin := Color(0.93, 0.8, 0.66)
	if v.y < 0.09:
		return Color(0.06, 0.06, 0.07)                  # 靴
	if ax > 0.68 and v.y > 1.2:
		return cfg.glove                                 # 手（手袋）
	if v.y > 1.53 and ax < 0.2:
		return skin                                      # 頭
	if v.y > 1.45 and ax < 0.1:
		return skin                                      # 首
	if v.y < 0.92:
		return cfg.pants
	if v.y < 0.99 and ax < 0.3:
		return Color(0.08, 0.07, 0.06)                  # ベルト
	if cfg.get("tie", false) and ax < 0.035 and v.z > 0.05 and v.y > 1.1 and v.y < 1.47:
		return Color(0.12, 0.1, 0.12)                    # ネクタイ
	return cfg.shirt


func _build_fx() -> void:
	var foam := StandardMaterial3D.new()
	foam.albedo_color = Color(1.0, 0.96, 0.85)
	foam.emission_enabled = true
	foam.emission = Color(1.0, 0.8, 0.4)
	foam.emission_energy_multiplier = 0.6
	var drop := SphereMesh.new()
	drop.radius = 0.06
	drop.height = 0.12
	drop.material = foam
	for i in 24:
		var p := CPUParticles3D.new()
		p.mesh = drop
		p.amount = 14
		p.lifetime = 0.5
		p.one_shot = true
		p.explosiveness = 1.0
		p.emitting = false
		p.direction = Vector3.UP
		p.spread = 80.0
		p.initial_velocity_min = 3.0
		p.initial_velocity_max = 6.5
		p.gravity = Vector3(0, -14, 0)
		p.scale_amount_min = 0.6
		p.scale_amount_max = 1.4
		add_child(p)
		burst_pool.append(p)
	musou_aura = CPUParticles3D.new()
	var gold := StandardMaterial3D.new()
	gold.albedo_color = Color(1.0, 0.75, 0.2)
	gold.emission_enabled = true
	gold.emission = Color(1.0, 0.65, 0.1)
	gold.emission_energy_multiplier = 2.5
	var spark := SphereMesh.new()
	spark.radius = 0.08
	spark.height = 0.16
	spark.material = gold
	musou_aura.mesh = spark
	musou_aura.amount = 120
	musou_aura.lifetime = 0.6
	musou_aura.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	musou_aura.emission_ring_axis = Vector3.UP
	musou_aura.emission_ring_radius = 1.6
	musou_aura.emission_ring_inner_radius = 0.8
	musou_aura.emission_ring_height = 0.2
	musou_aura.direction = Vector3.UP
	musou_aura.initial_velocity_min = 2.0
	musou_aura.initial_velocity_max = 5.0
	musou_aura.gravity = Vector3(0, -3, 0)
	musou_aura.emitting = false
	player.add_child(musou_aura)
	musou_aura.position.y = 0.6


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var theme := Theme.new()
	theme.default_font = jp_font
	theme.default_font_size = 22
	root.theme = theme
	layer.add_child(root)

	damage_flash = ColorRect.new()
	damage_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	damage_flash.color = Color(0.9, 0.1, 0.05, 0.0)
	damage_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(damage_flash)

	# 左上: 体力・無双ゲージ
	var panel := _panel(root, Vector2(24, 20))
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 6)
	panel.add_child(vb)
	var name_l := _label("そば屋", 26, Color(1.0, 0.9, 0.6))
	vb.add_child(name_l)
	hp_bar = _bar(vb, "体力", Color(0.35, 0.85, 0.35), 320)
	musou_bar = _bar(vb, "無双", Color(1.0, 0.7, 0.15), 320)
	musou_fill = musou_bar.get_theme_stylebox("fill") as StyleBoxFlat
	musou_label = _label("", 18, Color(1.0, 0.85, 0.4))
	vb.add_child(musou_label)

	# 右上: 撃破数・時間
	var rp := _panel(root, Vector2.ZERO)
	rp.anchor_left = 1.0
	rp.anchor_right = 1.0
	rp.offset_left = -260.0
	rp.offset_right = -24.0
	rp.offset_top = 20.0
	rp.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	var rvb := VBoxContainer.new()
	rp.add_child(rvb)
	ko_label = _label("撃破 0", 40, Color(1, 1, 1))
	ko_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	rvb.add_child(ko_label)
	time_label = _label("", 20, Color(0.85, 0.85, 0.85))
	time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	rvb.add_child(time_label)

	objective_label = _label("", 26, Color(1, 1, 1))
	objective_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	objective_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
	objective_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	objective_label.position.y = 28
	_outline(objective_label, 10)
	root.add_child(objective_label)

	combo_label = _label("", 64, Color(1.0, 0.85, 0.3))
	combo_label.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	combo_label.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	combo_label.position.x -= 40
	combo_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_outline(combo_label, 16)
	root.add_child(combo_label)

	banner_label = _label("", 76, Color(1.0, 0.92, 0.6))
	banner_label.set_anchors_preset(Control.PRESET_CENTER)
	banner_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
	banner_label.grow_vertical = Control.GROW_DIRECTION_BOTH
	banner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner_label.position.y -= 140
	_outline(banner_label, 20)
	root.add_child(banner_label)

	# 下中央: ボスの体力
	boss_box = VBoxContainer.new()
	boss_box.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	boss_box.grow_horizontal = Control.GROW_DIRECTION_BOTH
	boss_box.grow_vertical = Control.GROW_DIRECTION_BEGIN
	boss_box.position.y -= 70
	boss_box.visible = false
	root.add_child(boss_box)
	boss_name = _label("", 24, Color(1.0, 0.85, 0.4))
	boss_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_outline(boss_name, 8)
	boss_box.add_child(boss_name)
	boss_bar = _make_bar(Color(0.9, 0.25, 0.2), 560)
	boss_box.add_child(boss_bar)

	grab_bar = _make_bar(Color(1.0, 0.8, 0.3), 300)
	grab_bar.set_anchors_preset(Control.PRESET_CENTER)
	grab_bar.grow_horizontal = Control.GROW_DIRECTION_BOTH
	grab_bar.position.y += 120
	grab_bar.visible = false
	root.add_child(grab_bar)

	var hint := _label("移動 WASD　攻撃 J/左クリック　チャージ K/右クリック　無双 L　回避 Space　奪う F　カメラ Q/E　（パッド: □攻撃 △チャージ ○無双 ×回避）", 16, Color(1, 1, 1, 0.85))
	hint.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	hint.grow_horizontal = Control.GROW_DIRECTION_BOTH
	hint.grow_vertical = Control.GROW_DIRECTION_BEGIN
	hint.position.y -= 14
	_outline(hint, 6)
	root.add_child(hint)

	# タイトル
	title_panel = ColorRect.new()
	(title_panel as ColorRect).color = Color(0.03, 0.02, 0.01, 0.72)
	title_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(title_panel)
	var tvb := VBoxContainer.new()
	tvb.set_anchors_preset(Control.PRESET_CENTER)
	tvb.grow_horizontal = Control.GROW_DIRECTION_BOTH
	tvb.grow_vertical = Control.GROW_DIRECTION_BOTH
	tvb.add_theme_constant_override("separation", 18)
	title_panel.add_child(tvb)
	var t1 := _label("そば屋無双", 110, Color(1.0, 0.8, 0.25))
	t1.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_outline(t1, 24)
	tvb.add_child(t1)
	var t2 := _label("〜ビール工場強奪作戦〜　体験版", 44, Color(1, 1, 1))
	t2.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tvb.add_child(t2)
	var t3 := _label("ビールが足りない。ならば工場から直接いただくまで。\n警備員と警察官をジョッキでなぎ倒し、製造ラインのできたてビールを奪え！", 24, Color(0.9, 0.9, 0.9))
	t3.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tvb.add_child(t3)
	result_label = _label("Enter / Start でスタート", 30, Color(1.0, 0.9, 0.5))
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tvb.add_child(result_label)

	speech = Label3D.new()
	speech.font = jp_font
	speech.font_size = 56
	speech.pixel_size = 0.005
	speech.outline_size = 16
	speech.outline_modulate = Color(0.2, 0.1, 0.05)
	speech.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	speech.no_depth_test = true
	speech.render_priority = 10
	speech.visible = false
	add_child(speech)


func _panel(parent: Control, pos: Vector2) -> PanelContainer:
	var p := PanelContainer.new()
	p.position = pos
	var st := StyleBoxFlat.new()
	st.bg_color = Color(0.06, 0.05, 0.04, 0.7)
	st.set_corner_radius_all(12)
	st.set_content_margin_all(14)
	p.add_theme_stylebox_override("panel", st)
	parent.add_child(p)
	return p


func _label(text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _outline(l: Label, size: int) -> void:
	l.add_theme_color_override("font_outline_color", Color(0.1, 0.05, 0.02, 0.9))
	l.add_theme_constant_override("outline_size", size)


func _bar(parent: Control, caption: String, color: Color, width: int) -> ProgressBar:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	parent.add_child(row)
	var l := _label(caption, 20, Color(1, 1, 1))
	l.custom_minimum_size.x = 48
	row.add_child(l)
	var b := _make_bar(color, width)
	row.add_child(b)
	return b


func _make_bar(color: Color, width: int) -> ProgressBar:
	var b := ProgressBar.new()
	b.custom_minimum_size = Vector2(width, 20)
	b.max_value = 1.0
	b.show_percentage = false
	b.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(1, 1, 1, 0.15)
	bg.set_corner_radius_all(6)
	var fill := StyleBoxFlat.new()
	fill.bg_color = color
	fill.set_corner_radius_all(6)
	b.add_theme_stylebox_override("background", bg)
	b.add_theme_stylebox_override("fill", fill)
	return b


# ---------------------------------------------------------------- 進行

func _reset() -> void:
	for e in enemies:
		e.queue_free()
	enemies.clear()
	tokens.clear()
	for p in pickups:
		p.node.queue_free()
	pickups.clear()
	player.reset(Vector3(0.0, 0.0, 4.0))
	stage.close_all()
	stage.light_goal(false)
	zone = 0
	zone_active = false
	zone_spawned = 0
	zone_ko = 0
	captain_spawned = false
	captain = null
	goal_open = false
	grab_t = 0.0
	ko_total = 0
	combo = 0
	max_combo = 0
	play_time = 0.0
	cam_yaw = 0.0
	Engine.time_scale = 1.0
	boss_box.visible = false
	camera.position = player.position + Vector3(0.0, CAMERA_HEIGHT, CAMERA_DISTANCE)


func _start_game() -> void:
	_reset()
	phase = Phase.PLAY
	title_panel.visible = false
	_banner(ZONES[0].name, 2.0)
	_say("ビールが…足りない…！", 2.5)


func _process(raw_delta: float) -> void:
	# タブ切り替えや処理落ちで1フレームが長くなっても、吹っ飛び・踏み込みの計算が破綻しないよう上限を設ける
	var delta := minf(raw_delta, 1.0 / 20.0)
	t += delta
	if phase == Phase.TITLE:
		if Input.is_action_just_pressed("start") or Input.is_action_just_pressed("attack"):
			_start_game()
	elif Input.is_action_just_pressed("restart") or (phase != Phase.PLAY and Input.is_action_just_pressed("start")):
		_start_game()

	if phase == Phase.PLAY:
		play_time += delta
		_handle_player_input()
		_update_zone(delta)
	player.update(delta)
	_collide(player, 0.5)
	for e in enemies.duplicate():
		if is_instance_valid(e) and e.is_inside_tree():
			e.update(delta, player)
	_separate_enemies()
	_update_pickups(delta)
	stage.update(delta)
	_update_camera(delta)
	_update_ui(delta)
	_debug(delta)


func _handle_player_input() -> void:
	var inp := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var cam_turn := Input.get_axis("cam_left", "cam_right")
	cam_yaw -= cam_turn * get_process_delta_time() * 2.2
	var dir := Vector3(inp.x, 0.0, inp.y).rotated(Vector3.UP, cam_yaw)
	if not auto_play:
		player.move_input = dir
		if Input.is_action_just_pressed("attack"):
			player.press_attack()
		if Input.is_action_just_pressed("charge"):
			player.press_charge()
		if Input.is_action_just_pressed("dodge"):
			player.press_dodge()
		if Input.is_action_just_pressed("musou"):
			_try_musou()


func _try_musou() -> void:
	if player.press_musou():
		_banner("ビール無双！", 1.4)
		_say("快適ですっ！！", 1.6)
		musou_aura.emitting = true
		get_tree().create_timer(PlayerScript.MUSOU_TIME + 0.3).timeout.connect(func() -> void: musou_aura.emitting = false)


func _update_zone(delta: float) -> void:
	var z: Dictionary = ZONES[zone]
	if not zone_active:
		# 前のエリアのシャッターをくぐったら次の敵が出始める
		if player.position.z < z.z_near - 1.0 or zone == 0:
			zone_active = true
			zone_spawned = 0
			zone_ko = 0
			captain_spawned = false
			if zone > 0:
				_banner(z.name, 2.0)
		return
	# 出現
	spawn_timer -= delta
	var alive := _alive_count()
	if spawn_timer <= 0.0 and zone_spawned < z.quota and alive < MAX_ACTIVE and not goal_open:
		spawn_timer = SPAWN_INTERVAL
		_spawn(_pick_type(z.mix), z)
		zone_spawned += 1
	if not captain_spawned and zone_ko >= z.captain_at:
		captain_spawned = true
		captain = _spawn(z.captain, z, true)
		_banner(ENEMY_TYPES[z.captain].title + " 出現！", 1.8)
	# 制圧判定
	var captain_down: bool = captain_spawned and (captain == null or not is_instance_valid(captain) or not captain.is_alive())
	if zone < ZONES.size() - 1:
		if captain_down and zone_spawned >= z.quota and alive == 0:
			stage.open_shutter(zone)
			_banner(z.name + " 制圧！", 2.0)
			_say("次です！", 1.5)
			zone += 1
			zone_active = false
	elif captain_down and not goal_open:
		goal_open = true
		stage.light_goal(true)
		_banner("警部 撃破！", 2.0)
		_say("ビールは目の前です！", 2.0)

	if goal_open:
		var near := player.position.distance_to(StageScript.GOAL_POS) < 3.8
		var holding := Input.is_action_pressed("grab") or bot_interact
		grab_bar.visible = near
		if near and holding:
			grab_t += delta
			if grab_t >= GRAB_TIME:
				_win()
		else:
			grab_t = maxf(grab_t - delta * 2.0, 0.0)
		grab_bar.value = grab_t / GRAB_TIME


func _pick_type(mix: Dictionary) -> String:
	var r := randf()
	for k: String in mix:
		r -= mix[k]
		if r <= 0.0:
			return k
	return mix.keys()[0]


func _spawn(type: String, z: Dictionary, near_player := false) -> Node3D:
	var e := EnemyScript.new()
	var pos: Vector3
	if near_player:
		# 隊長・警部はプレイヤーの前方に現れる
		var zc: float = clampf(player.position.z - 7.0, z.z_far + 3.0, z.z_near - 3.0)
		pos = Vector3(clampf(player.position.x, -8.0, 8.0), 0.0, zc)
		if type == "boss":
			pos = StageScript.GOAL_POS + Vector3(0.0, 0.0, 4.0)
	else:
		# 左右の壁際の搬入口から走り込んでくる
		var side := -1.0 if randf() < 0.5 else 1.0
		var zz := randf_range(z.z_far + 2.0, z.z_near - 2.0)
		pos = Vector3(side * 12.6, 0.0, zz)
		if zone == 2:
			pos.x = side * randf_range(1.0, 3.0)
			pos.z = randf_range(z.z_far + 6.0, z.z_far + 12.0)
	e.setup(self, ENEMY_TYPES[type], pos)
	add_child(e)
	enemies.append(e)
	if near_player:
		boss_box.visible = true
		boss_name.text = ENEMY_TYPES[type].title
	return e


func respawn_near_player(e: Node3D) -> void:
	var side := -1.0 if player.position.x > 0.0 else 1.0
	var z: Dictionary = ZONES[zone]
	e.position = Vector3(side * 12.6, 0.0, clampf(player.position.z - 4.0, z.z_far + 2.0, z.z_near - 2.0))


func _alive_count() -> int:
	var n := 0
	for e in enemies:
		if e.is_alive():
			n += 1
	return n


func _win() -> void:
	phase = Phase.WIN
	grab_bar.visible = false
	player.win()
	_banner("できたてビール、確保！", 999.0)
	_say("快適です！", 3.0)
	for e in enemies:
		if e.is_alive():
			e.take_hit(9999.0, (e.global_position - player.global_position).normalized(), 12.0, 10.0)
	_show_result("ビール工場 制圧完了", Color(1.0, 0.85, 0.35))


func _lose() -> void:
	phase = Phase.LOSE
	_banner("ひと休み…", 999.0)
	_say("休憩もメリットでもあります！", 3.0)
	_show_result("撤退（でもまた来ます）", Color(0.8, 0.85, 1.0))


func _show_result(head: String, color: Color) -> void:
	await get_tree().create_timer(2.2).timeout
	if phase == Phase.PLAY or phase == Phase.TITLE:
		return
	title_panel.visible = true
	(title_panel as ColorRect).color.a = 0.4   # 後ろで踊るそば屋が見えるよう薄く
	(title_panel.get_child(0).get_child(0) as Label).text = head
	(title_panel.get_child(0).get_child(0) as Label).add_theme_color_override("font_color", color)
	(title_panel.get_child(0).get_child(0) as Label).add_theme_font_size_override("font_size", 72)
	(title_panel.get_child(0).get_child(1) as Label).text = "撃破数 %d　最大コンボ %d HIT　タイム %s" % [ko_total, max_combo, _fmt_time(play_time)]
	(title_panel.get_child(0).get_child(2) as Label).text = ""
	result_label.text = "Enter / Start でもう一度"
	banner_label.text = ""


# ---------------------------------------------------------------- 戦闘（player / enemy から呼ばれる）

func nearest_enemy(from: Vector3, max_dist: float) -> Node3D:
	var best: Node3D = null
	var best_d := max_dist
	for e in enemies:
		if not e.is_targetable():
			continue
		var d := from.distance_to(e.global_position)
		if d < best_d:
			best_d = d
			best = e
	return best


func player_attack(origin: Vector3, fwd: Vector3, a: Dictionary) -> int:
	var hits := 0
	var cone_cos := cos(deg_to_rad(a.cone * 0.5))
	for e in enemies.duplicate():
		if not e.is_targetable():
			continue
		var d: Vector3 = e.global_position - origin
		d.y = 0.0
		var reach: float = a.range + (0.6 if e.is_boss() else 0.0)
		if d.length() > reach:
			continue
		if a.cone < 360.0 and d.length() > 0.6 and fwd.dot(d.normalized()) < cone_cos:
			continue
		var push_dir := d.normalized() if d.length() > 0.05 else fwd
		var was_alive: bool = e.is_alive()
		e.take_hit(a.dmg, push_dir, a.push, a.launch)
		hits += 1
		_burst(e.global_position + Vector3(0.0, 1.2, 0.0))
		if was_alive and not e.is_alive():
			_on_ko(e)
	if hits > 0:
		combo += hits
		combo_timer = 2.6
		max_combo = maxi(max_combo, combo)
		shake = maxf(shake, 0.12 if a.launch == 0.0 else 0.3)
		if a.launch > 0.0 and not a.get("musou", false):
			_hitstop(0.06)
	if a.get("wave", false):
		_shockwave(Vector3(origin.x, 0.05, origin.z), a.range)
	return hits


func _on_ko(e: Node3D) -> void:
	ko_total += 1
	zone_ko += 1
	if KO_LINES.has(ko_total):
		_say(KO_LINES[ko_total], 1.8)
	if e.is_boss():
		boss_box.visible = false
		_drop(e.global_position, "jug")
	elif randf() < 0.07:
		_drop(e.global_position, "bottle")


func damage_player(dmg: float, from: Vector3) -> void:
	if phase != Phase.PLAY:
		return
	if player.take_hit(dmg, from):
		shake = maxf(shake, 0.25)
		damage_flash.color.a = 0.35
		if player.hp <= 0.0:
			_lose()


func enemy_shockwave(pos: Vector3, radius: float, dmg: float) -> void:
	_shockwave(Vector3(pos.x, 0.05, pos.z), radius, Color(1.0, 0.4, 0.2))
	shake = maxf(shake, 0.4)
	if player.global_position.distance_to(pos) < radius:
		damage_player(dmg, pos)


func request_attack_token(e: Node3D) -> bool:
	if e.is_boss():
		return true
	if tokens.size() >= MAX_TOKENS:
		return false
	tokens.append(e)
	return true


func release_attack_token(e: Node3D) -> void:
	tokens.erase(e)


func remove_enemy(e: Node3D) -> void:
	nav_cache.erase(e.get_instance_id())
	enemies.erase(e)
	tokens.erase(e)
	e.queue_free()


func landing_dust(pos: Vector3) -> void:
	var p := _next_burst()
	p.position = pos + Vector3(0, 0.1, 0)
	p.restart()


# ---------------------------------------------------------------- 物理（簡易）

func _collide(n: Node3D, radius: float) -> void:
	var p := n.position
	var z_far: float = ZONES[zone].z_far + 0.8   # 閉じているシャッター（最後のエリアは奥の壁）
	p.x = clampf(p.x, -StageScript.HALF_WIDTH + 0.8, StageScript.HALF_WIDTH - 0.8)
	p.z = clampf(p.z, z_far, StageScript.START_Z)
	for r: Rect2 in stage.obstacles:
		var g := r.grow(radius)
		if p.x > g.position.x and p.x < g.end.x and p.z > g.position.y and p.z < g.end.y:
			var pushes := [p.x - g.position.x, g.end.x - p.x, p.z - g.position.y, g.end.y - p.z]
			var m: float = pushes.min()
			if m == pushes[0]:
				p.x = g.position.x
			elif m == pushes[1]:
				p.x = g.end.x
			elif m == pushes[2]:
				p.z = g.position.y
			else:
				p.z = g.end.y
	n.position = p


## who が from から to へ向かう方向。ナビメッシュの経路を一定間隔で引き直して、次の経由点へ向かう
func steer(who: Object, from: Vector3, to: Vector3) -> Vector3:
	var id := who.get_instance_id()
	var c: Dictionary = nav_cache.get(id, {})
	if c.is_empty() or t >= c.t or c.target.distance_to(to) > 2.0:
		c = {"path": NavigationServer3D.map_get_path(get_world_3d().navigation_map, from, to, true), "i": 1, "t": t + randf_range(0.3, 0.5), "target": to}
		nav_cache[id] = c
	var path: PackedVector3Array = c.path
	var i: int = c.i
	while i < path.size() and Vector2(path[i].x - from.x, path[i].z - from.z).length() < 0.45:
		i += 1
	c.i = i
	var wp := to if i >= path.size() else path[i]
	var d := wp - from
	d.y = 0.0
	return d.normalized()


func _build_navigation() -> void:
	# 当たり判定と同じ矩形（stage.obstacles）を高さ2mの箱にして、床から歩ける範囲を焼く。
	# シャッターは含めない（通れるかどうかは _collide のエリア境界で決める）
	var nm := NavigationMesh.new()
	nm.agent_radius = 0.5
	nm.agent_height = 1.75
	nm.agent_max_climb = 0.25
	nm.cell_size = 0.25
	nm.cell_height = 0.25
	var faces := PackedVector3Array()
	var w := StageScript.HALF_WIDTH - 0.3
	var z0 := StageScript.START_Z + 0.5
	var z1 := StageScript.END_Z
	# Godot の面は時計回りが表（上から見て時計回り＝上向き）
	faces.append_array([Vector3(-w, 0, z0), Vector3(w, 0, z1), Vector3(w, 0, z0), Vector3(-w, 0, z0), Vector3(-w, 0, z1), Vector3(w, 0, z1)])
	for r: Rect2 in stage.obstacles:
		faces.append_array(_box_faces(r, 2.0))
	var src := NavigationMeshSourceGeometryData3D.new()
	src.add_faces(faces, Transform3D.IDENTITY)
	NavigationServer3D.bake_from_source_geometry_data(nm, src)
	if OS.get_cmdline_user_args().has("--auto"):
		print("navmesh polygons=", nm.get_polygon_count())
	var region := NavigationRegion3D.new()
	region.navigation_mesh = nm
	add_child(region)


func _box_faces(r: Rect2, h: float) -> PackedVector3Array:
	var x0 := r.position.x
	var x1 := r.end.x
	var z0 := r.position.y
	var z1 := r.end.y
	var c := [Vector3(x0, 0, z0), Vector3(x1, 0, z0), Vector3(x1, 0, z1), Vector3(x0, 0, z1),
		Vector3(x0, h, z0), Vector3(x1, h, z0), Vector3(x1, h, z1), Vector3(x0, h, z1)]
	var quads := [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
	var out := PackedVector3Array()
	for q: Array in quads:
		out.append_array([c[q[0]], c[q[2]], c[q[1]], c[q[0]], c[q[3]], c[q[2]]])
	return out


func _separate_enemies() -> void:
	var n := enemies.size()
	for i in n:
		var a := enemies[i]
		if not a.is_targetable():
			continue
		# プレイヤーにめり込まない
		var dp := a.position - player.position
		dp.y = 0.0
		var min_p := 0.9 * float(a.cfg.get("scale", 1.0))
		if dp.length() < min_p and dp.length() > 0.001:
			a.position += dp.normalized() * (min_p - dp.length())
		for j in range(i + 1, n):
			var b := enemies[j]
			if not b.is_targetable():
				continue
			var d := a.position - b.position
			d.y = 0.0
			var min_d := 0.75
			var l := d.length()
			if l < min_d and l > 0.001:
				var push := d / l * (min_d - l) * 0.5
				a.position += push
				b.position -= push
		_collide(a, 0.4)


func _update_pickups(delta: float) -> void:
	for p in pickups.duplicate():
		var node: Node3D = p.node
		node.rotation.y += delta * 2.0
		node.position.y = 0.5 + sin(t * 3.0 + p.seed) * 0.12
		if phase == Phase.PLAY and node.position.distance_to(player.position + Vector3(0, 0.5, 0)) < 1.4:
			if p.kind == "jug":
				player.heal(player.MAX_HP * 0.5)
				player.add_musou(100.0)
				_say("大ジョッキ！ 快適です！", 1.6)
			else:
				player.heal(150.0)
				player.add_musou(25.0)
				_say("うまい！", 1.0)
			_burst(node.position)
			node.queue_free()
			pickups.erase(p)


func _drop(pos: Vector3, kind: String) -> void:
	var node := Node3D.new()
	var mi := MeshInstance3D.new()
	var m := StandardMaterial3D.new()
	if kind == "jug":
		var c := CylinderMesh.new()
		c.top_radius = 0.28
		c.bottom_radius = 0.24
		c.height = 0.5
		mi.mesh = c
		m.albedo_color = Color(1.0, 0.75, 0.2)
	else:
		var c := CylinderMesh.new()
		c.top_radius = 0.07
		c.bottom_radius = 0.12
		c.height = 0.45
		mi.mesh = c
		m.albedo_color = Color(0.5, 0.28, 0.06)
	m.emission_enabled = true
	m.emission = m.albedo_color
	m.emission_energy_multiplier = 0.8
	mi.material_override = m
	node.add_child(mi)
	node.position = Vector3(pos.x, 0.5, pos.z)
	add_child(node)
	pickups.append({"node": node, "kind": kind, "seed": randf() * TAU})


# ---------------------------------------------------------------- 演出

func _next_burst() -> CPUParticles3D:
	var p := burst_pool[burst_index]
	burst_index = (burst_index + 1) % burst_pool.size()
	return p


func _burst(pos: Vector3) -> void:
	var p := _next_burst()
	p.position = pos
	p.restart()


func _shockwave(pos: Vector3, radius: float, color := Color(1.0, 0.85, 0.45)) -> void:
	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.85
	torus.outer_radius = 1.0
	ring.mesh = torus
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_color = color
	ring.material_override = m
	ring.position = pos
	ring.scale = Vector3(0.3, 0.2, 0.3)
	add_child(ring)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(ring, "scale", Vector3(radius, 0.4, radius), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(m, "albedo_color:a", 0.0, 0.4)
	tw.chain().tween_callback(ring.queue_free)


func _hitstop(duration: float) -> void:
	Engine.time_scale = 0.08
	get_tree().create_timer(duration, true, false, true).timeout.connect(func() -> void: Engine.time_scale = 1.0)


func _banner(text: String, duration: float) -> void:
	banner_label.text = text
	banner_timer = duration
	banner_label.scale = Vector2.ONE * 1.3
	banner_label.pivot_offset = banner_label.size * 0.5
	create_tween().tween_property(banner_label, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK)


func _say(text: String, duration: float) -> void:
	speech.text = text
	speech.visible = true
	speech_timer = duration


func _update_camera(delta: float) -> void:
	var dist := CAMERA_DISTANCE * (1.2 if player.state == PlayerScript.State.MUSOU else 1.0)
	var back := Vector3(0.0, 0.0, dist).rotated(Vector3.UP, cam_yaw)
	var target := player.position + back + Vector3(0.0, CAMERA_HEIGHT, 0.0)
	if phase == Phase.WIN:
		target = player.position + Vector3(0.0, 2.2, 4.5).rotated(Vector3.UP, cam_yaw)
	# 棚やタンクがそば屋との間に入ったら、遮られない位置までカメラを寄せる
	var focus := player.position + Vector3(0.0, 1.2, 0.0)
	var steps := 24
	for i in range(1, steps + 1):
		var p := focus.lerp(target, float(i) / steps)
		if stage.blocks_view(p):
			target = focus.lerp(target, maxf(float(i - 2) / steps, 0.25))
			break
	camera.position = camera.position.lerp(target, 1.0 - exp(-delta * 6.0))
	camera.look_at(player.position + Vector3(0.0, 1.2, 0.0), Vector3.UP)
	if shake > 0.0:
		camera.position += Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)) * shake * 0.35
		shake = maxf(shake - delta * 1.6, 0.0)


func _update_ui(delta: float) -> void:
	hp_bar.value = player.hp / player.MAX_HP
	musou_bar.value = player.musou / player.MUSOU_MAX
	var ready: bool = player.is_musou_ready()
	musou_fill.bg_color = Color(1.0, 0.85, 0.3).lerp(Color(1.0, 0.45, 0.1), 0.5 + 0.5 * sin(t * 8.0)) if ready else Color(1.0, 0.7, 0.15)
	musou_label.text = "無双乱舞 準備OK！（L / ○）" if ready else "ジョッキのビール＝無双ゲージ"
	ko_label.text = "撃破 %d" % ko_total
	time_label.text = _fmt_time(play_time)
	combo_timer -= delta
	if combo_timer <= 0.0:
		combo = 0
	combo_label.text = ("%d HIT" % combo) if combo >= 3 else ""
	if phase == Phase.PLAY:
		var z: Dictionary = ZONES[zone]
		if goal_open:
			objective_label.text = "製造ラインのできたてビールを奪え！（出荷口で F 長押し）"
		elif not zone_active:
			objective_label.text = "シャッターが開いた！ 奥へ進め"
		else:
			var rest: int = maxi(z.quota - zone_spawned, 0) + _alive_count()
			objective_label.text = "【%s】 敵を蹴散らせ（残り %d）" % [z.name, rest]
	else:
		objective_label.text = ""
	if captain and is_instance_valid(captain) and captain.is_alive():
		boss_bar.value = captain.hp / captain.cfg.hp
	damage_flash.color.a = maxf(damage_flash.color.a - delta * 1.5, 0.0)
	if banner_timer > 0.0:
		banner_timer -= delta
		if banner_timer <= 0.0:
			banner_label.text = ""
	speech.position = player.head_position() + Vector3(0.0, 0.45, 0.0)
	if speech_timer > 0.0:
		speech_timer -= delta
		if speech_timer <= 0.0:
			speech.visible = false


func _fmt_time(sec: float) -> String:
	return "%d:%04.1f" % [int(sec) / 60, fmod(sec, 60.0)]


# ---------------------------------------------------------------- 動作確認用
# godot --path . -- --auto --shot=out.png --frames=3000
#   --auto: そば屋を自動操作して通しで遊ぶ（近くの敵へ寄って攻撃・無双・ゴール）

func _parse_debug_args() -> void:
	for a in OS.get_cmdline_user_args():
		if a == "--auto":
			auto_play = true
		elif a.begins_with("--shot="):
			shot_path = a.substr(7)
		elif a.begins_with("--frames="):
			shot_frame = a.substr(9).to_int()
		elif a.begins_with("--quit-after-end="):
			quit_after_end = a.substr(17).to_float()
		elif a.begins_with("--musou-at="):
			musou_test_frame = a.substr(11).to_int()
		elif a.begins_with("--snap="):
			# 途中経過も撮る: --snap=600,1200 → <shot>_600.png ...
			for f in a.substr(7).split(","):
				snap_frames.append(f.to_int())


func _debug(delta: float) -> void:
	if quit_after_end >= 0.0 and phase in [Phase.WIN, Phase.LOSE]:
		quit_after_end -= delta
		if quit_after_end < 0.0:
			get_tree().quit()
	if auto_play and phase == Phase.PLAY:
		_bot()
		if musou_test_frame > 0 and frame_count == musou_test_frame:
			player.musou = player.MUSOU_MAX
			_try_musou()
	if shot_path.is_empty():
		return
	frame_count += 1
	if frame_count % 120 == 0:
		for e in enemies:
			if e.is_alive() and _alive_count() <= 2:
				print("   alive enemy: %s state=%s hp=%d pos=%s targetable=%s tokens=%d" % [e.cfg.key, e.State.keys()[e.state], e.hp, e.position.snapped(Vector3.ONE * 0.1), e.is_targetable(), tokens.size()])
		print("frame=%d phase=%s zone=%d goal=%s ko=%d hp=%d musou=%d alive=%d combo=%d pos=%s" % [frame_count, Phase.keys()[phase], zone, goal_open, ko_total, player.hp, player.musou, _alive_count(), combo, player.position.snapped(Vector3.ONE * 0.1)])
	if frame_count in snap_frames:
		get_viewport().get_texture().get_image().save_png(shot_path.get_basename() + "_%d.png" % frame_count)
	if frame_count == shot_frame:
		get_viewport().get_texture().get_image().save_png(shot_path)
		get_tree().quit()


func _bot() -> void:
	bot_interact = false
	var target_pos: Vector3
	var e := nearest_enemy(player.position, 60.0)
	if goal_open:
		target_pos = StageScript.GOAL_POS + Vector3(0, 0, 2.2)
		bot_interact = player.position.distance_to(StageScript.GOAL_POS) < 3.6
	elif e:
		target_pos = e.position
	else:
		target_pos = Vector3(0.0, 0.0, ZONES[zone].z_far + 4.0)
	var d := target_pos - player.position
	d.y = 0.0
	var stop := 0.4 if goal_open else 1.8
	player.move_input = steer(player, player.position, target_pos) if d.length() > stop else Vector3.ZERO
	if e and d.length() < 2.4 and not goal_open:
		if player.is_musou_ready() and _alive_count() >= 6:
			_try_musou()
		elif frame_count % 9 == 0:
			if randf() < 0.15:
				player.press_charge()
			else:
				player.press_attack()
	if player.hp < 250.0:
		player.heal(400.0)   # 通し確認用（倒れずに最後まで進める）
