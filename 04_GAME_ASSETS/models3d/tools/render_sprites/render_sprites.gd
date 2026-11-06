extends SceneTree
## models3d の採用GLBを、2Dゲーム用の立ち絵（透過PNG・4方向）へレンダリングする。
##
## 04_GAME_ASSETS/models3d/ から実行する（Godotのウィンドウが一瞬開く。--headless では描画されない）:
##   godot --path tools/render_sprites --script render_sprites.gd
## 出力: sprites/<キャラ>/{front,back,left,right}.png
##   left / right は「画面の左 / 右を向いている絵」。余白は切り詰めてある。
##
## モデルは res:// の外にあるので、インポートせず GLTFDocument で直接読む。

const SIZE := 1024

## [キャラ, GLB, 再生するアニメーション（無ければ静止）, 秒]
const CHARACTERS := [
	["sobaya", "sobaya.glb", "Hybrid_MugHold", 0.0],
	["fukuchan", "fukuchan.glb", "Idle", 0.0],
	["yametaro", "yametaro.glb", "Idle", 0.0],
	["takosan", "takosan.glb", "Idle", 0.0],
	["okayaman", "okayaman.glb", "", 0.0],
	["yumemin", "yumemin.glb", "", 0.0],
]

## 正面（カメラ向き）からのY回転。glTFの正面は +Z
const DIRECTIONS := {"front": 0.0, "right": 90.0, "back": 180.0, "left": -90.0}

var models_dir := ""


func _initialize() -> void:
	models_dir = ProjectSettings.globalize_path("res://").path_join("../..").simplify_path()
	_run.call_deferred()


func _run() -> void:
	var vp := SubViewport.new()
	vp.size = Vector2i(SIZE, SIZE)
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

	var cam := Camera3D.new()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	vp.add_child(cam)

	for c: Array in CHARACTERS:
		var model := _load(c[1])
		if model == null:
			continue
		var pivot := Node3D.new()
		vp.add_child(pivot)
		pivot.add_child(model)
		_pose(model, c[0], c[2], c[3])
		await process_frame
		await process_frame

		# 4方向すべてが収まるよう、モデルの外接球からカメラを決める
		var box := _aabb(model)
		var center := box.get_center()
		var radius := box.size.length() / 2.0
		cam.size = radius * 2.1
		cam.position = center + Vector3(0, 0, radius * 4.0)
		cam.near = 0.01
		cam.far = radius * 10.0

		var out_dir := models_dir.path_join("sprites").path_join(c[0])
		DirAccess.make_dir_recursive_absolute(out_dir)
		for dir: String in DIRECTIONS:
			pivot.rotation_degrees.y = DIRECTIONS[dir]
			pivot.position = Vector3.ZERO
			# 回転の中心を体の中心にそろえる
			pivot.position = center - (Basis.from_euler(Vector3(0, deg_to_rad(DIRECTIONS[dir]), 0)) * center)
			await process_frame
			await process_frame
			await RenderingServer.frame_post_draw
			var img := vp.get_texture().get_image()
			var used := img.get_used_rect()
			img = img.get_region(used.grow(4).intersection(Rect2i(Vector2i.ZERO, img.get_size())))
			img.save_png(out_dir.path_join(dir + ".png"))
			print("rendered ", c[0], "/", dir, " ", img.get_size())
		pivot.queue_free()
		await process_frame
	quit()


func _load(file: String) -> Node3D:
	var doc := GLTFDocument.new()
	var state := GLTFState.new()
	var path := models_dir.path_join(file)
	if doc.append_from_file(path, state) != OK:
		push_error("読み込めません: " + path)
		return null
	return doc.generate_scene(state) as Node3D


func _pose(model: Node3D, id: String, anim_name: String, time: float) -> void:
	var players := model.find_children("*", "AnimationPlayer", true, false)
	if anim_name != "" and not players.is_empty():
		var anim := players[0] as AnimationPlayer
		if anim.has_animation(anim_name):
			anim.play(anim_name)
			anim.seek(time, true)
			anim.pause()
		else:
			push_warning("%s: アニメーション %s がありません" % [id, anim_name])
	if id == "sobaya":
		_attach_mug(model)
	if id == "okayaman":
		_fix_okayaman_photo(model)


## おかやまんの画面に内蔵された正典写真はCMYKのJPEGで、GodotのJPEG読み込みが対応していない（画面が真っ黒になる）。
## 同じ正典写真 02_CHARACTERS/Okayaman.jpg を macOS の sips でsRGBに変換して貼り直す
func _fix_okayaman_photo(model: Node3D) -> void:
	var src := models_dir.path_join("../../02_CHARACTERS/Okayaman.jpg").simplify_path()
	var dst := ProjectSettings.globalize_path("user://okayaman_srgb.png")
	var code := OS.execute("sips", ["-s", "format", "png", "-m", "/System/Library/ColorSync/Profiles/sRGB Profile.icc", src, "--out", dst])
	var img := Image.load_from_file(dst) if code == 0 else null
	if img == null:
		push_warning("おかやまんの写真をsRGBに変換できません（macOSのsipsが必要）。画面は黒のままになります")
		return
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_texture = ImageTexture.create_from_image(img)
	var photo := model.find_child("Okayaman canonical photograph", true, false) as MeshInstance3D
	photo.material_override = mat


## そば屋のジョッキ（NG変更要素）。12_SOBAYA_MUSOU_GODOT/player.gd と同じく右手の PropSocket.R に持たせる
func _attach_mug(model: Node3D) -> void:
	var skeleton := model.find_children("*", "Skeleton3D", true, false)[0] as Skeleton3D
	var socket := BoneAttachment3D.new()
	socket.bone_name = "PropSocket.R"
	skeleton.add_child(socket)
	var mug := _load("props/beer_mug.glb")
	socket.add_child(mug)
	var grip := mug.find_child("Grip", true, false) as Node3D
	mug.transform = grip.transform.affine_inverse()
	# Godot は glTF の透過（transmission）に対応しないので、薄いガラス＋琥珀色のビールへ置き換える
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


func _aabb(node: Node3D) -> AABB:
	var box := AABB()
	var first := true
	for mi: MeshInstance3D in node.find_children("*", "MeshInstance3D", true, false):
		if not mi.visible:
			continue
		var b := mi.global_transform * mi.get_aabb()
		box = b if first else box.merge(b)
		first = false
	return box
