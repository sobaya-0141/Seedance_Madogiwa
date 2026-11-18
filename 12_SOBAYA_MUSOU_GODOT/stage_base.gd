extends Node3D
## ステージの共通部分。+Z が入口、-Z へ進む一本道を、ゲート（シャッターなど）で3つのエリアに区切る。
## 各ステージ（stage_factory.gd / stage_street.gd / stage_office.gd）はこれを継承し、
## _init() で寸法・エリア・文言を決め、_build_stage() で建物・障害物を組み立てる。

# ---- 各ステージが _init() で決める値
var stage_title := ""            # 「ゴールデン麦酒 第一工場」など
var stage_tagline := ""          # タイトル画面の説明文
var half_width := 14.0
## カメラが左右の壁へ寄れる限界（壁から何 m 手前まで）。張り出した日よけ・バルコニーの中へカメラが入らないようにする
var camera_wall_margin := 0.5
var start_z := 8.0
var end_z := -98.0
var goal_pos := Vector3(0.0, 0.0, -93.0)
# エリア: name / z_far / z_near / mix（敵の割合）/ captain（隊長の種類）/ captain_at（何人倒したら出るか）。雑魚は隊長を倒すまで出続け、倒すと次のエリアへ進める
var zones: Array[Dictionary] = []
var start_line := ""             # 開始時のそば屋のひとこと
var goal_objective := ""         # ボスを倒した後の目標表示
var goal_banner := ""            # ボスを倒したときのバナー
var goal_line := ""              # そのときのそば屋のひとこと
var win_banner := ""
var win_result := ""
# 見た目の確認用の定点カメラ: [カメラの位置, 注視点]（main.gd の --views-at で順に撮る）
var views: Array = []

# ---- 組み立ての結果
var jp_font: Font
var obstacles: Array[Rect2] = []          # 当たり判定（床の上の矩形）。ナビメッシュもここから作る
var obstacle_heights: Array[float] = []   # 同じ順番で高さ。カメラの遮蔽判定に使う
var gates: Array[Node3D] = []             # エリアの境目。open_gate() で開く
# 戦いに加わらない人（通行人・一般社員）: {"pos", "yaw", "anim", "cfg"}。main.gd がマネキンを置く
var bystanders: Array[Dictionary] = []
var goal_glow: OmniLight3D


func build(font: Font) -> void:
	jp_font = font
	_build_stage()


func _build_stage() -> void:
	pass


## 毎フレームの動き（コンベアの瓶など）
func update(_delta: float) -> void:
	pass


## 雑魚敵の出現位置。既定は左右の壁際（搬入口・路地）から走り込んでくる
func spawn_point(_zone_index: int, z: Dictionary) -> Vector3:
	var side := -1.0 if randf() < 0.5 else 1.0
	return free_point(Vector3(side * (half_width - 1.4), 0.0, randf_range(z.z_far + 2.0, z.z_near - 2.0)))


## 迷子になった敵の入り直し位置（プレイヤーの近くの壁際）
func respawn_point(player_pos: Vector3, z: Dictionary) -> Vector3:
	var side := -1.0 if player_pos.x > 0.0 else 1.0
	return free_point(Vector3(side * (half_width - 1.4), 0.0, clampf(player_pos.z - 4.0, z.z_far + 2.0, z.z_near - 2.0)))


## p が障害物に重なっていたら、近くの空いている場所へずらす
func free_point(p: Vector3) -> Vector3:
	if not _inside_obstacle(p, 0.6):
		return p
	for i in 24:
		var q := p + Vector3(randf_range(-1.0, 1.0), 0.0, randf_range(-1.0, 1.0)) * (1.0 + i * 0.35)
		q.x = clampf(q.x, -half_width + 1.0, half_width - 1.0)
		if not _inside_obstacle(q, 0.6):
			return q
	return Vector3(0.0, 0.0, p.z)


func _inside_obstacle(p: Vector3, margin: float) -> bool:
	for r: Rect2 in obstacles:
		if r.grow(margin).has_point(Vector2(p.x, p.z)):
			return true
	return false


func _obstacle(r: Rect2, height: float) -> void:
	obstacles.append(r)
	obstacle_heights.append(height)


## 点 p が障害物の中（高さ以下）にあるか
func blocks_view(p: Vector3) -> bool:
	for i in obstacles.size():
		if p.y < obstacle_heights[i] and obstacles[i].has_point(Vector2(p.x, p.z)):
			return true
	return false


# ---------------------------------------------------------------- ゲート

## ゲートの開き方: "up"（シャッター。上へ巻き上がる）/ "slide"（子ノードが左右へ開く）/ "sink"（床へ沈む）
func _add_gate(node: Node3D, mode: String) -> void:
	node.set_meta("mode", mode)
	var rest: Array[Vector3] = []
	for c: Node3D in node.get_children():
		rest.append(c.position)
	node.set_meta("rest", rest)
	node.set_meta("rest_self", node.position)
	add_child(node)
	gates.append(node)


func open_gate(i: int) -> void:
	var g := gates[i]
	var tw := create_tween().set_parallel(true)
	match String(g.get_meta("mode")):
		"up":
			tw.tween_property(g, "position:y", g.position.y + 5.8, 1.6).set_trans(Tween.TRANS_SINE)
		"sink":
			tw.tween_property(g, "position:y", g.position.y - 3.0, 1.2).set_trans(Tween.TRANS_SINE)
		"slide":
			for c: Node3D in g.get_children():
				var dir := signf(c.position.x) if absf(c.position.x) > 0.01 else 1.0
				tw.tween_property(c, "position:x", c.position.x + dir * half_width, 1.4).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)


func close_all() -> void:
	for g in gates:
		g.position = g.get_meta("rest_self")
		var rest: Array[Vector3] = g.get_meta("rest")
		var children := g.get_children()
		for k in children.size():
			(children[k] as Node3D).position = rest[k]


func light_goal(on: bool) -> void:
	if goal_glow:
		goal_glow.light_energy = 3.0 if on else 0.0


func _add_goal_glow(color: Color) -> void:
	goal_glow = OmniLight3D.new()
	goal_glow.light_color = color
	goal_glow.light_energy = 0.0
	goal_glow.omni_range = 7.0
	goal_glow.position = goal_pos + Vector3(0, 2.0, 1.2)
	add_child(goal_glow)


# ---------------------------------------------------------------- 組み立ての道具

## 空（自作のシェーダー: 空のグラデーション・太陽・雲）
const SKY_SHADER := """
shader_type sky;
uniform vec3 top_color : source_color = vec3(0.3, 0.52, 0.86);
uniform vec3 horizon_color : source_color = vec3(0.85, 0.84, 0.8);
uniform vec3 ground_color : source_color = vec3(0.4, 0.38, 0.36);
uniform vec3 cloud_color : source_color = vec3(1.0);
uniform vec3 cloud_shade : source_color = vec3(0.72, 0.74, 0.8);
uniform float cloud_amount = 0.45;
uniform float sun_glow = 0.35;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(13.1, 7.7); a *= 0.5; }
	return v;
}
void sky() {
	vec3 d = EYEDIR;
	float h = d.y;
	vec3 col = mix(horizon_color, top_color, pow(clamp(h, 0.0, 1.0), 0.55));
	if (h < 0.0) col = mix(horizon_color, ground_color, clamp(-h * 5.0, 0.0, 1.0));
	float sd = max(dot(d, LIGHT0_DIRECTION), 0.0);
	vec3 sun = LIGHT0_COLOR * (pow(sd, 1200.0) * 40.0 + pow(sd, 12.0) * sun_glow);
	if (h > 0.0) {
		vec2 uv = d.xz / (h + 0.12) * 0.9;
		float c = fbm(uv + vec2(3.0, 1.0));
		float cover = smoothstep(1.0 - cloud_amount, 1.0 - cloud_amount + 0.16, c);
		float shade = smoothstep(0.35, 0.9, fbm(uv * 1.7 + vec2(-1.3, 2.1)));
		vec3 cc = mix(cloud_color, cloud_shade, shade * 0.8) + LIGHT0_COLOR * pow(sd, 6.0) * 0.4;
		col = mix(col, cc, cover * smoothstep(0.0, 0.12, h) * 0.92);
		sun *= 1.0 - cover * 0.85;
	}
	COLOR = col + sun;
}
"""

## 空・環境光・太陽・ポスト処理。o のキー（省略可）:
##   top / horizon / ground / clouds / cloud_color / cloud_shade : 空
##   sun_rot / sun_color / sun_energy / sun_size : 太陽（sun_size は影のぼけ具合）
##   ambient / fog / fog_color / vol_fog / vol_fog_color : 環境光・遠景のかすみ・光の筋（ボリュメトリックフォグ）
##   ssr / exposure / contrast / saturation / glow
## PC版（Forward+）向け。SSAO / SSIL / SSR / ボリュメトリックフォグは Web版（Compatibility）では効かない
func _build_environment(o: Dictionary) -> void:
	var sky_mat := ShaderMaterial.new()
	sky_mat.shader = _shader(SKY_SHADER)
	sky_mat.set_shader_parameter("top_color", o.get("top", Color(0.3, 0.52, 0.86)))
	sky_mat.set_shader_parameter("horizon_color", o.get("horizon", Color(0.85, 0.84, 0.8)))
	sky_mat.set_shader_parameter("ground_color", o.get("ground", Color(0.42, 0.4, 0.38)))
	sky_mat.set_shader_parameter("cloud_amount", o.get("clouds", 0.45))
	sky_mat.set_shader_parameter("cloud_color", o.get("cloud_color", Color(1.0, 1.0, 1.0)))
	sky_mat.set_shader_parameter("cloud_shade", o.get("cloud_shade", Color(0.72, 0.74, 0.8)))
	var sky := Sky.new()
	sky.sky_material = sky_mat
	sky.radiance_size = Sky.RADIANCE_SIZE_256
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = o.get("ambient", 0.6)
	if o.has("ambient_color"):
		# 影の色を空の色から少しずらす（例: 夕方は日なたが暖色、影は青み）
		env.ambient_light_color = o.ambient_color
		env.ambient_light_sky_contribution = 0.5
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.tonemap_exposure = o.get("exposure", 1.0)
	env.adjustment_enabled = true
	env.adjustment_contrast = o.get("contrast", 1.15)
	env.adjustment_saturation = o.get("saturation", 1.12)
	# 接地感（物陰の暗さ）と、色の照り返し
	env.ssao_enabled = true
	env.ssao_radius = 1.4
	env.ssao_intensity = 2.2
	env.ssao_power = 1.6
	env.ssao_detail = 0.6
	env.ssil_enabled = true
	env.ssil_radius = 4.0
	env.ssil_intensity = 0.9
	env.ssr_enabled = o.get("ssr", false)
	env.ssr_max_steps = 48
	env.ssr_fade_out = 1.6
	env.glow_enabled = true
	env.glow_intensity = o.get("glow", 0.45)
	env.glow_bloom = 0.04
	env.glow_hdr_threshold = 1.0
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT
	var fog: float = o.get("fog", 0.0)
	env.fog_enabled = fog > 0.0
	env.fog_light_color = o.get("fog_color", o.get("horizon", Color(0.85, 0.84, 0.8)))
	env.fog_density = fog
	env.fog_sun_scatter = 0.25
	env.fog_aerial_perspective = 0.4
	var vol: float = o.get("vol_fog", 0.0)
	env.volumetric_fog_enabled = vol > 0.0
	env.volumetric_fog_density = vol
	env.volumetric_fog_albedo = o.get("vol_fog_color", Color(1.0, 0.96, 0.9))
	env.volumetric_fog_anisotropy = 0.6
	env.volumetric_fog_length = 48.0
	env.volumetric_fog_ambient_inject = 0.0
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = o.get("sun_rot", Vector3(-58.0, 28.0, 0.0))
	sun.light_color = o.get("sun_color", Color(1.0, 0.95, 0.86))
	sun.light_energy = o.get("sun_energy", 1.3)
	sun.light_angular_distance = o.get("sun_size", 1.2)
	sun.shadow_enabled = true
	sun.shadow_blur = 1.2
	sun.shadow_bias = 0.03
	sun.shadow_normal_bias = 1.2
	sun.directional_shadow_max_distance = 70.0
	sun.directional_shadow_blend_splits = true
	sun.light_volumetric_fog_energy = 1.4
	add_child(sun)


## ステージ全体の床（シェーダーで模様を描く）
## margin: 入口側・奥側にはみ出させる長さ（窓の外に床が見えないよう、ビルの中では小さくする）
func _build_floor(shader_code: String, margin := 13.0, textures := {}) -> void:
	var length := start_z - end_z
	var floor_mesh := PlaneMesh.new()
	floor_mesh.size = Vector2(half_width * 2.0 + 4.0, length + margin * 2.0)
	var fm := ShaderMaterial.new()
	fm.shader = _shader(shader_code.replace("//FLOOR_SAMPLERS", FLOOR_SAMPLERS))
	_floor_textures(fm, textures)
	floor_mesh.material = fm
	var floor_inst := MeshInstance3D.new()
	floor_inst.mesh = floor_mesh
	floor_inst.position = Vector3(0.0, 0.0, (start_z + end_z) * 0.5)
	add_child(floor_inst)


## 外部の3Dモデル（CC0 の Kenney。models/kenney/<パック>/<名前>.glb）を置く。
##   pos: 床の上の位置（モデルの足元の中心がここに来る）、yaw: 向き
##   fit: 横幅（x・z の長い方）をこの長さ(m)に合わせる。fit_h: 高さをこの長さ(m)に合わせる（両方 0 ならそのまま）
##   block: 足元の大きさで当たり判定（_obstacle）も足すか
func _prop(path: String, pos: Vector3, yaw := 0.0, fit := 0.0, block := true, fit_h := 0.0, parent: Node3D = null) -> Node3D:
	var inst: Node3D = (load(_model_path(path)) as PackedScene).instantiate()
	var box := _model_aabb(inst)
	var sc := 1.0
	if fit > 0.0:
		sc = fit / maxf(box.size.x, box.size.z)
	elif fit_h > 0.0:
		sc = fit_h / box.size.y
	inst.scale = Vector3.ONE * sc
	var center := box.get_center()
	inst.position = Vector3(-center.x, -box.position.y, -center.z) * sc
	var holder := Node3D.new()
	holder.position = pos
	holder.rotation.y = yaw
	holder.add_child(inst)
	(parent if parent else self).add_child(holder)
	if block and parent == null:
		# 回した足元の矩形を、軸に沿った矩形で囲む
		var hx := box.size.x * sc * 0.5
		var hz := box.size.z * sc * 0.5
		var ex := absf(cos(yaw)) * hx + absf(sin(yaw)) * hz
		var ez := absf(sin(yaw)) * hx + absf(cos(yaw)) * hz
		_obstacle(Rect2(pos.x - ex, pos.z - ez, ex * 2.0, ez * 2.0), box.size.y * sc)
	return holder


## "blender/<ステージ>/<名前>" は Claude が Blender で作った大道具（models/blender/ → 04_GAME_ASSETS/models3d/blender/、.gltf）、
## "tripo/<名前>" は Tripo で作ったモデル（models/tripo/ → 04_GAME_ASSETS/models3d/tripo/、.glb）、それ以外は Kenney（models/kenney/、.glb）
func _model_path(path: String) -> String:
	if path.begins_with("blender/"):
		return "res://models/%s.gltf" % path
	if path.begins_with("tripo/"):
		return "res://models/%s.glb" % path
	return "res://models/kenney/%s.glb" % path


## 大道具を幅・高さ・奥行き（m）を別々に指定して置く（Tripo のモデルは1m 四方に収まっているので、壁やコンベアは軸ごとに伸ばす）
func _prop_sized(path: String, pos: Vector3, yaw: float, size: Vector3, block := true) -> Node3D:
	var inst: Node3D = (load(_model_path(path)) as PackedScene).instantiate()
	var box := _model_aabb(inst)
	var sc := Vector3(size.x / box.size.x, size.y / box.size.y, size.z / box.size.z)
	inst.scale = sc
	var center := box.get_center()
	inst.position = Vector3(-center.x, -box.position.y, -center.z) * sc
	var holder := Node3D.new()
	holder.position = pos
	holder.rotation.y = yaw
	holder.add_child(inst)
	add_child(holder)
	if block:
		var ex := absf(cos(yaw)) * size.x * 0.5 + absf(sin(yaw)) * size.z * 0.5
		var ez := absf(sin(yaw)) * size.x * 0.5 + absf(cos(yaw)) * size.z * 0.5
		_obstacle(Rect2(pos.x - ex, pos.z - ez, ex * 2.0, ez * 2.0), size.y)
	return holder


## Tripo のモデルの一部（屋根の行灯・警光灯など）を光らせる: モデルの座標（書き出したままの1m 四方の座標）で
## 範囲 lo〜hi を少し大きめに包む、加算合成で光る箱を重ね、近くを照らす明かりも置く。光の強さを変えられるよう材質を返す
func _glow_part(holder: Node3D, lo: Vector3, hi: Vector3, color: Color, energy: float, light_range := 4.0) -> StandardMaterial3D:
	var inst := holder.get_child(0) as Node3D
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0, 0, 0)
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = energy
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.no_depth_test = false
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var bm := BoxMesh.new()
	bm.size = (hi - lo) * 1.06
	bm.material = m
	var mi := MeshInstance3D.new()
	mi.mesh = bm
	mi.position = (lo + hi) * 0.5
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	inst.add_child(mi)
	var light := OmniLight3D.new()
	light.light_color = color
	light.light_energy = energy * 0.35
	light.omni_range = light_range
	light.position = (lo + hi) * 0.5 + Vector3(0, 0.02, 0)
	inst.add_child(light)
	light.set_meta("base_energy", light.light_energy)
	m.set_meta("light", light)
	return m


## 大道具のメッシュを1つ取り出す（同じ物を MultiMesh で大量に並べるとき用。提灯など）
func _prop_mesh(path: String) -> Mesh:
	var inst: Node3D = (load(_model_path(path)) as PackedScene).instantiate()
	var mi: MeshInstance3D = inst.find_children("*", "MeshInstance3D", true, false)[0]
	var mesh := mi.mesh
	inst.free()
	return mesh


func _model_aabb(root: Node3D) -> AABB:
	var box := AABB()
	var first := true
	for mi: MeshInstance3D in root.find_children("*", "MeshInstance3D", true, false):
		var t := Transform3D.IDENTITY
		var p: Node = mi
		while p != root:
			t = (p as Node3D).transform * t
			p = p.get_parent()
		var b := t * mi.get_aabb()
		box = b if first else box.merge(b)
		first = false
	return box


## 東京タワー（遠景）。Blender 製の鉄骨の格子のモデル（紅白の帯・大展望台・トップデッキ・アンテナ）を高さ h に縮めて置く
func _tokyo_tower(base: Vector3, h: float) -> void:
	_prop("blender/azabu/tokyo_tower", base, PI * 0.25, 0.0, false, h)


func _box(size: Vector3, pos: Vector3, color: Color, emission := Color.BLACK, emission_energy := 0.0, parent: Node3D = null, metallic := 0.0) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = size
	var inst := MeshInstance3D.new()
	inst.mesh = mesh
	inst.material_override = _mat(color, metallic, emission, emission_energy)
	if color.a >= 1.0:
		# 箱の角を丸く見せる（SURFACE_SHADER の面取り）。Web版（Compatibility）は面ごとの値の数に上限（4096）があるので付けない
		if not _compat:
			inst.set_instance_shader_parameter("box_half", size * 0.5)
	else:
		inst.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF   # ガラスは影を落とさない
	inst.position = pos
	(parent if parent else self).add_child(inst)
	return inst


func _cyl(radius: float, height: float, pos: Vector3, color: Color, metallic := 0.0, emission := 0.0, parent: Node3D = null) -> MeshInstance3D:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = 32
	var inst := MeshInstance3D.new()
	inst.mesh = mesh
	inst.material_override = _mat(color, metallic, color, emission)
	inst.position = pos
	(parent if parent else self).add_child(inst)
	return inst


## 箱・円柱の表面（自作のシェーダー）。単色の面に、ムラ・足元の汚れ・面取りのハイライトを足して、のっぺり見えないようにする
const SURFACE_SHADER := """
shader_type spatial;
uniform vec3 albedo : source_color = vec3(0.8);
uniform float metallic = 0.0;
uniform float roughness = 0.75;
uniform vec3 emission_color : source_color = vec3(0.0);
uniform float emission_energy = 0.0;
instance uniform vec3 box_half = vec3(0.0);   // 箱の半分の大きさ。0 のとき（円柱など）は面取りしない
// 表面の質感テクスチャ（CC0 の PBR。04_GAME_ASSETS/textures）。ワールド座標で3方向から貼る
uniform bool use_detail = false;
uniform bool detail_raw = false;             // true: テクスチャの色をそのまま使う（レンガなど） / false: 明暗だけ借りて albedo の色にする
uniform float detail_scale = 2.0;            // テクスチャ1枚が何mか
uniform sampler2D detail_diff : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D detail_nor : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D detail_arm : filter_linear_mipmap_anisotropic, repeat_enable;
varying vec3 world_pos;
varying vec3 local_pos;
varying vec3 local_n;
float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
	vec3 i = floor(p);
	vec3 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
		mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	local_pos = VERTEX;
	local_n = NORMAL;
}
void fragment() {
	float n = noise(world_pos * 0.6) * 0.45 + noise(world_pos * 3.1) * 0.35 + noise(world_pos * 13.0) * 0.2;
	vec3 col = albedo * (0.9 + 0.2 * n);
	float ao = 1.0;
	vec3 nmap = vec3(0.5, 0.5, 1.0);
	float drough = -1.0;
	if (use_detail) {
		vec3 wn = abs(normalize((MODEL_MATRIX * vec4(local_n, 0.0)).xyz));
		vec2 uv = wn.x > max(wn.y, wn.z) ? world_pos.zy : (wn.y > wn.z ? world_pos.xz : world_pos.xy);
		uv /= detail_scale;
		vec3 d = texture(detail_diff, uv).rgb;
		vec3 arm = texture(detail_arm, uv).rgb;
		nmap = texture(detail_nor, uv).rgb;
		ao = arm.r;
		drough = arm.g;
		if (detail_raw) {
			col = d * albedo * (0.95 + 0.1 * n);
		} else {
			// 明暗だけ借りる（平均的な明るさのところで albedo の色になる）
			float lum = dot(d, vec3(0.299, 0.587, 0.114));
			col = albedo * clamp(0.45 + lum * 1.1, 0.4, 1.4) * (0.95 + 0.1 * n);
		}
	}
	// 足元ほど少し暗く（接地の汚れ）
	col *= 1.0 - (1.0 - smoothstep(0.0, 0.5, world_pos.y)) * 0.18;
	float rough = clamp(roughness + (n - 0.5) * 0.18, 0.04, 1.0);
	if (box_half.x > 0.0) {
		float r = clamp(min(min(box_half.x, box_half.y), box_half.z) * 0.3, 0.004, 0.04);
		vec3 e = smoothstep(box_half - r, box_half, abs(local_pos));
		vec3 nl = normalize(local_n + sign(local_pos) * e * 0.85);
		NORMAL = normalize((VIEW_MATRIX * MODEL_MATRIX * vec4(nl, 0.0)).xyz);
		float edge = max(max(e.x * e.y, e.y * e.z), e.x * e.z);
		col = mix(col, col * 1.1 + 0.025, edge);
		rough = mix(rough, rough * 0.7, edge);
	}
	if (drough >= 0.0) rough = mix(rough, drough, 0.6);
	ALBEDO = col;
	METALLIC = metallic;
	ROUGHNESS = rough;
	AO = ao;
	AO_LIGHT_AFFECT = 0.3;
	if (use_detail) {
		NORMAL_MAP = nmap;
		NORMAL_MAP_DEPTH = 0.8;
	}
	EMISSION = emission_color * emission_energy;
}
"""

## 箱・円柱の表面の質感。surface に名前を入れてから _box / _cyl を呼ぶと、その質感になる（"" で単色に戻る）
##   tex: textures/ のフォルダ名、scale: 1枚を何mで貼るか、raw: テクスチャの色をそのまま使うか
const SURFACES := {
	"plaster": {"tex": "painted_plaster_wall", "scale": 3.0, "raw": false},
	"brick": {"tex": "red_brick", "scale": 2.0, "raw": true},
	"metal": {"tex": "blue_metal_plate", "scale": 2.5, "raw": false},
	"concrete": {"tex": "concrete_floor_painted", "scale": 3.0, "raw": false},
	"wood": {"tex": "wood_floor", "scale": 2.0, "raw": false},
}
var surface := ""
var _compat := RenderingServer.get_current_rendering_method() == "gl_compatibility"
var _tex_cache := {}

var _surface_shader: Shader
var _mat_cache := {}


func _mat(color: Color, metallic := 0.0, emission := Color.BLACK, emission_energy := 0.0) -> Material:
	if color.a < 1.0:
		# ガラス・透ける板
		var g := StandardMaterial3D.new()
		g.albedo_color = color
		g.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		g.roughness = 0.04
		g.metallic = 0.2
		g.metallic_specular = 0.9
		if emission_energy > 0.0:
			g.emission_enabled = true
			g.emission = emission
			g.emission_energy_multiplier = emission_energy
		return g
	# 同じ色・質感の箱は材質を使い回す
	var key := "%s|%.2f|%s|%.2f|%s" % [color.to_html(), metallic, emission.to_html(), emission_energy, surface]
	if _mat_cache.has(key):
		return _mat_cache[key]
	if _surface_shader == null:
		var code := SURFACE_SHADER
		if _compat:
			# Web版: インスタンスごとの値を使わない（面取りなし）
			code = code.replace("instance uniform vec3 box_half", "const vec3 box_half")
		_surface_shader = _shader(code)
	var m := ShaderMaterial.new()
	m.shader = _surface_shader
	m.set_shader_parameter("albedo", color)
	m.set_shader_parameter("metallic", metallic)
	m.set_shader_parameter("roughness", 0.32 if metallic > 0.0 else 0.72)
	if emission_energy > 0.0:
		m.set_shader_parameter("emission_color", emission)
		m.set_shader_parameter("emission_energy", emission_energy)
	if surface != "":
		var sf: Dictionary = SURFACES[surface]
		var t := tex_set(sf.tex)
		m.set_shader_parameter("use_detail", true)
		m.set_shader_parameter("detail_raw", sf.raw)
		m.set_shader_parameter("detail_scale", sf.scale)
		m.set_shader_parameter("detail_diff", t.diff)
		m.set_shader_parameter("detail_nor", t.nor)
		m.set_shader_parameter("detail_arm", t.arm)
	_mat_cache[key] = m
	return m


## CC0 の PBR テクスチャ（textures/<名前>/ の diff・nor_gl・arm の3枚）
func tex_set(tex_name: String) -> Dictionary:
	if not _tex_cache.has(tex_name):
		var base := "res://textures/%s/%s_" % [tex_name, tex_name]
		_tex_cache[tex_name] = {"diff": load(base + "diff_2k.jpg"), "nor": load(base + "nor_gl_2k.jpg"), "arm": load(base + "arm_2k.jpg")}
	return _tex_cache[tex_name]


## 床のシェーダーにテクスチャを渡す。sets: {"a": "clean_asphalt", ...} → a_diff / a_nor / a_arm
func _floor_textures(mat: ShaderMaterial, sets: Dictionary) -> void:
	for k: String in sets:
		var t := tex_set(sets[k])
		mat.set_shader_parameter(k + "_diff", t.diff)
		mat.set_shader_parameter(k + "_nor", t.nor)
		mat.set_shader_parameter(k + "_arm", t.arm)


## 床のシェーダーで使うテクスチャの宣言（a・b・c の3組）。床のシェーダーの "//FLOOR_SAMPLERS" の行に差し込む
const FLOOR_SAMPLERS := """
uniform sampler2D a_diff : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D a_nor : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D a_arm : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D b_diff : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D b_nor : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D b_arm : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D c_diff : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D c_nor : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D c_arm : filter_linear_mipmap_anisotropic, repeat_enable;
"""


func _sign(text: String, pos: Vector3, size: int, color: Color, yaw: float, parent: Node3D = null) -> Label3D:
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
	(parent if parent else self).add_child(l)
	return l


func _shader(code: String) -> Shader:
	var s := Shader.new()
	s.code = code
	return s
