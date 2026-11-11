extends SceneTree
## models3d の採用モデルのアニメーションを、2Dゲーム用のスプライトシート（横向き・右向き）に書き出す。
##
## 04_GAME_ASSETS/models3d/ から実行する（Godotのウィンドウが一瞬開く。--headless では描画されない）:
##   godot --path tools/render_sprites --script render_sheets.gd
## 出力: sprites/sheets/<名前>.png と <名前>.txt
##   png: 1行が1アニメーション、1マスが1コマ（cell × cell）。右向きで描くので、左向きは左右反転して使う
##   txt: 「cell <幅> <高さ>」「pivot <x> <y>」（足元の位置）、続いて「anim <名前> <コマ数> <長さ秒> <loop|once>」を行の順に
##
## 敵（警備員・警察官など）は CC0 のマネキン素体に、そば屋無双（12_SOBAYA_MUSOU_GODOT）と同じ方法で制服の色・帽子・警棒を付ける。

const CELL := 288
const SUPERSAMPLE := 2
## 足元をマスの上から何割の位置に置くか
const FOOT := 0.88
## 縦に写す範囲（キャラの身長に対する倍率）
const VIEW := 1.45
const PITCH_DEG := 10.0

const SOBAYA_ANIMS := [
	# [名前, クリップ, コマ数, ループ]
	["idle", "Hybrid_MugHold", 6, true],
	["run", "Hybrid_MugRun", 8, true],
	["punch", "Hybrid_MugPunch", 8, false],
	["hook", "Hybrid_MugHook", 8, false],
	["smash", "Hybrid_MugSmash", 10, false],
	["charge", "MugAttack", 10, false],
	["dodge", "Procedural_RollForward", 8, false],
	["hurt", "Library_Hit_Chest", 5, false],
	["down", "Library_Kneeling_Tired", 5, false],
	["win", "DanceVictory", 10, true],
]

const ENEMY_ANIMS := [
	["idle", "addon/Fighting Idle", 6, true],
	["walk", "Jog", 8, true],
	["attack", "", 8, false],      # 種類ごとの攻撃クリップ
	["hit", "Hit_Chest", 5, false],
	["fly", "Hit_Knockback", 8, false],
	["dizzy", "addon/Dizzy", 6, true],
]

const GLOVE_SKIN := Color(0.93, 0.8, 0.66)

## そば屋無双の ENEMY_TYPES と同じ配色
const ENEMIES := {
	"guard": {"attack": "Punch_Jab", "shirt": Color(0.55, 0.7, 0.88), "pants": Color(0.22, 0.24, 0.28), "glove": GLOVE_SKIN, "cap": Color(0.3, 0.33, 0.4), "badge": Color(0.8, 0.82, 0.86)},
	"police": {"attack": "Sword_Regular_A", "baton": true, "tie": true, "shirt": Color(0.13, 0.19, 0.38), "pants": Color(0.1, 0.13, 0.26), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.1, 0.14, 0.3), "badge": Color(1.0, 0.8, 0.25)},
	"captain": {"attack": "Melee_Hook", "shirt": Color(0.3, 0.42, 0.65), "pants": Color(0.15, 0.17, 0.22), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.15, 0.2, 0.35), "badge": Color(1.0, 0.8, 0.25)},
	"sergeant": {"attack": "Sword_Regular_A", "baton": true, "tie": true, "shirt": Color(0.1, 0.15, 0.32), "pants": Color(0.08, 0.1, 0.22), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.08, 0.11, 0.25), "badge": Color(1.0, 0.8, 0.25)},
	"boss": {"attack": "Punch_Cross", "special": "addon/Attack_Ground_Pound", "tie": true, "shirt": Color(0.18, 0.16, 0.2), "pants": Color(0.12, 0.11, 0.14), "glove": Color(0.95, 0.95, 0.95), "cap": Color(0.1, 0.1, 0.12), "badge": Color(1.0, 0.85, 0.3)},
}

var models_dir := ""
var vp: SubViewport
var cam: Camera3D


func _initialize() -> void:
	models_dir = ProjectSettings.globalize_path("res://").path_join("../..").simplify_path()
	_run.call_deferred()


func _run() -> void:
	_setup_viewport()
	var out_dir := models_dir.path_join("sprites/sheets")
	DirAccess.make_dir_recursive_absolute(out_dir)

	var sobaya := _load("sobaya.glb")
	_attach_mug(sobaya)
	await _render_sheet(sobaya, 1.8, SOBAYA_ANIMS, out_dir.path_join("sobaya"))
	sobaya.queue_free()

	var addon_root := _load("mobs/mannequin_addon.glb")
	var addon_lib := (addon_root.find_children("*", "AnimationPlayer", true, false)[0] as AnimationPlayer).get_animation_library("")
	addon_root.visible = false   # 動作ライブラリを借りるだけ（同じワールドに写り込まないよう隠す）
	for key: String in ENEMIES:
		var cfg: Dictionary = ENEMIES[key]
		var enemy := _load("mobs/mannequin_base.glb")
		var player := enemy.find_children("*", "AnimationPlayer", true, false)[0] as AnimationPlayer
		player.add_animation_library("addon", addon_lib)
		var anims: Array = []
		for a: Array in ENEMY_ANIMS:
			anims.append([a[0], cfg.attack if a[0] == "attack" else a[1], a[2], a[3]])
		if cfg.has("special"):
			anims.append(["special", cfg.special, 10, false])
		await _dress(enemy, cfg)
		await _render_sheet(enemy, 1.83, anims, out_dir.path_join(key))
		enemy.queue_free()
	quit()


func _setup_viewport() -> void:
	vp = SubViewport.new()
	vp.size = Vector2i(CELL * SUPERSAMPLE, CELL * SUPERSAMPLE)
	vp.transparent_bg = true
	vp.msaa_3d = Viewport.MSAA_4X
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)
	var env := WorldEnvironment.new()
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_CLEAR_COLOR
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.environment.ambient_light_color = Color.WHITE
	env.environment.ambient_light_energy = 0.75
	env.environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	vp.add_child(env)
	var key := DirectionalLight3D.new()
	key.light_energy = 1.1
	key.rotation_degrees = Vector3(-35, 30, 0)
	vp.add_child(key)
	cam = Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	vp.add_child(cam)


## 身長 height のキャラの足元がマスの FOOT の位置に来るよう、少し見下ろす正射影カメラを置く
func _place_camera(height: float) -> void:
	var size := height * VIEW
	cam.size = size
	var pitch := deg_to_rad(PITCH_DEG)
	var center_y := (FOOT - 0.5) * size / cos(pitch)
	cam.rotation = Vector3(-pitch, 0, 0)
	cam.position = Vector3(0, center_y, 0) + Vector3(0, sin(pitch), cos(pitch)) * 20.0
	cam.near = 0.1
	cam.far = 60.0


func _render_sheet(model: Node3D, height: float, anims: Array, out_base: String) -> void:
	var pivot := Node3D.new()
	vp.add_child(pivot)
	if model.get_parent():
		model.get_parent().remove_child(model)
	pivot.add_child(model)
	pivot.rotation_degrees.y = 90.0   # 正面（+Z）を画面の右へ
	_place_camera(height)
	var player := model.find_children("*", "AnimationPlayer", true, false)[0] as AnimationPlayer

	var cols := 0
	for a: Array in anims:
		cols = maxi(cols, a[2])
	var sheet := Image.create(CELL * cols, CELL * anims.size(), false, Image.FORMAT_RGBA8)
	var meta := PackedStringArray(["cell %d %d" % [CELL, CELL], "pivot %d %d" % [CELL / 2, int(CELL * FOOT)]])

	for row in anims.size():
		var a: Array = anims[row]
		var clip: String = a[1]
		if not player.has_animation(clip):
			push_error("%s: クリップ %s がありません" % [out_base.get_file(), clip])
			continue
		var length := player.get_animation(clip).length
		var count: int = a[2]
		var loop: bool = a[3]
		player.play(clip)
		for i in count:
			var t := length * i / count if loop else length * i / maxf(count - 1, 1)
			player.seek(minf(t, length - 0.001), true)
			player.pause()
			await process_frame
			await process_frame
			await RenderingServer.frame_post_draw
			var img := vp.get_texture().get_image()
			img.resize(CELL, CELL, Image.INTERPOLATE_LANCZOS)
			sheet.blit_rect(img, Rect2i(0, 0, CELL, CELL), Vector2i(i * CELL, row * CELL))
		meta.append("anim %s %d %.3f %s" % [a[0], count, length, "loop" if loop else "once"])
		print("rendered ", out_base.get_file(), "/", a[0])

	sheet.save_png(out_base + ".png")
	var f := FileAccess.open(out_base + ".txt", FileAccess.WRITE)
	f.store_string("\n".join(meta) + "\n")
	f.close()
	pivot.remove_child(model)
	pivot.queue_free()


func _load(file: String) -> Node3D:
	var doc := GLTFDocument.new()
	var state := GLTFState.new()
	var path := models_dir.path_join(file)
	if doc.append_from_file(path, state) != OK:
		push_error("読み込めません: " + path)
		return null
	var scene := doc.generate_scene(state) as Node3D
	_convert_importer_meshes(scene)
	root.add_child(scene)   # 骨やメッシュを確定させるため、一度ツリーに入れる
	return scene


## GLBによっては ImporterMeshInstance3D のまま生成され、描画も色の差し替えもできないので MeshInstance3D に置き換える
func _convert_importer_meshes(scene: Node) -> void:
	for imi: ImporterMeshInstance3D in scene.find_children("*", "ImporterMeshInstance3D", true, false):
		var mi := MeshInstance3D.new()
		mi.name = imi.name
		mi.mesh = imi.mesh.get_mesh()
		mi.skin = imi.skin
		mi.transform = imi.transform
		var parent := imi.get_parent()
		parent.add_child(mi)
		parent.move_child(mi, imi.get_index())
		mi.owner = imi.owner
		mi.skeleton = imi.skeleton_path
		parent.remove_child(imi)
		imi.free()


## そば屋のジョッキ（NG変更要素）。render_sprites.gd と同じ
func _attach_mug(model: Node3D) -> void:
	var skeleton := model.find_children("*", "Skeleton3D", true, false)[0] as Skeleton3D
	var socket := BoneAttachment3D.new()
	socket.bone_name = "PropSocket.R"
	skeleton.add_child(socket)
	var mug := _load("props/beer_mug.glb")
	mug.get_parent().remove_child(mug)
	socket.add_child(mug)
	var grip := mug.find_child("Grip", true, false) as Node3D
	mug.transform = grip.transform.affine_inverse()
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color(0.92, 0.97, 1.0, 0.3)
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
	var body := model.find_child("SobayaV3Body", true, false) as MeshInstance3D
	if body:
		var idx := body.find_blend_shape_by_name("MugGrip")
		if idx >= 0:
			body.set_blend_shape_value(idx, 1.0)


# ---------------------------------------------------------------- 敵の制服（12_SOBAYA_MUSOU_GODOT と同じ規則）

func _dress(enemy: Node3D, cfg: Dictionary) -> void:
	await process_frame
	var mi := enemy.find_children("*", "MeshInstance3D", true, false)[0] as MeshInstance3D
	var base := mi.mesh
	var out := ArrayMesh.new()
	for s in base.get_surface_count():
		var arrays := base.surface_get_arrays(s)
		var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		var colors := PackedColorArray()
		colors.resize(verts.size())
		for i in verts.size():
			colors[i] = _uniform_color(verts[i], cfg)
		arrays[Mesh.ARRAY_COLOR] = colors
		var flags: int = base.surface_get_format(s) & Mesh.ARRAY_FLAG_USE_8_BONE_WEIGHTS
		out.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays, [], {}, flags)
	mi.mesh = out
	var mat := StandardMaterial3D.new()
	mat.vertex_color_use_as_albedo = true
	mat.vertex_color_is_srgb = true   # 色は sRGB で指定している（そのままだと白っぽく浮く）
	mat.roughness = 0.7
	mi.material_override = mat

	var skeleton := enemy.find_children("*", "Skeleton3D", true, false)[0] as Skeleton3D
	var cap := Node3D.new()
	var crown := _part(CylinderMesh.new(), cfg.cap)
	(crown.mesh as CylinderMesh).top_radius = 0.13
	(crown.mesh as CylinderMesh).bottom_radius = 0.125
	(crown.mesh as CylinderMesh).height = 0.11
	cap.add_child(crown)
	var brim := _part(BoxMesh.new(), cfg.cap.darkened(0.35))
	(brim.mesh as BoxMesh).size = Vector3(0.22, 0.02, 0.1)
	brim.position = Vector3(0.0, -0.045, 0.14)
	cap.add_child(brim)
	var badge := _part(BoxMesh.new(), cfg.badge, 0.6)
	(badge.mesh as BoxMesh).size = Vector3(0.05, 0.05, 0.01)
	badge.position = Vector3(0.0, 0.0, 0.132)
	cap.add_child(badge)
	_attach(skeleton, cap, "head", Vector3(0.0, 1.8, 0.0))
	if cfg.get("baton", false):
		var baton := _part(CylinderMesh.new(), Color(0.08, 0.08, 0.09))
		(baton.mesh as CylinderMesh).top_radius = 0.022
		(baton.mesh as CylinderMesh).bottom_radius = 0.026
		(baton.mesh as CylinderMesh).height = 0.6
		baton.rotation.x = PI * 0.5
		var holder := Node3D.new()
		holder.add_child(baton)
		baton.position = Vector3(0.0, 0.0, 0.22)
		var hand := skeleton.get_bone_global_rest(skeleton.find_bone("hand_r")).origin
		_attach(skeleton, holder, "hand_r", hand + Vector3(-0.08, 0.0, 0.0))


func _uniform_color(v: Vector3, cfg: Dictionary) -> Color:
	var ax := absf(v.x)
	if v.y < 0.09:
		return Color(0.06, 0.06, 0.07)                  # 靴
	if ax > 0.68 and v.y > 1.2:
		return cfg.glove                                 # 手（手袋）
	if v.y > 1.53 and ax < 0.2:
		return GLOVE_SKIN                                # 頭
	if v.y > 1.45 and ax < 0.1:
		return GLOVE_SKIN                                # 首
	if v.y < 0.92:
		return cfg.pants
	if v.y < 0.99 and ax < 0.3:
		return Color(0.08, 0.07, 0.06)                  # ベルト
	if cfg.get("tie", false) and ax < 0.035 and v.z > 0.05 and v.y > 1.1 and v.y < 1.47:
		return Color(0.12, 0.1, 0.12)                    # ネクタイ
	return cfg.shirt


func _attach(skeleton: Skeleton3D, node: Node3D, bone: String, rest_pos: Vector3) -> void:
	var att := BoneAttachment3D.new()
	att.bone_name = bone
	skeleton.add_child(att)
	att.add_child(node)
	var rest := skeleton.get_bone_global_rest(skeleton.find_bone(bone))
	node.transform = rest.affine_inverse() * Transform3D(Basis(), rest_pos)


func _part(mesh: PrimitiveMesh, color: Color, emission := 0.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.6
	if emission > 0.0:
		m.metallic = 0.8
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = emission
	mi.material_override = m
	return mi
