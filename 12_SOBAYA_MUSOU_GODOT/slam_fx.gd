extends Node3D
## 強攻撃（ジョッキの叩きつけ）が地面に当たった瞬間の演出。main.gd の slam_impact() が1回ごとに作り、終わったら自分で消える。
## - 閃光: 一瞬だけ強い琥珀色の明かり
## - ひび割れ: 地面に放射状のひびが光って走り、約0.5秒で消える
## - 衝撃波: 地面を広がる光の輪（1本）
## - ビールの王冠しぶき: 輪の形に琥珀色の滴が外・上へ飛び散る
## - ビールの柱と泡: 中心から琥珀色の滴が高く噴き上がり、細かい泡が舞う
## - 破片: 跳ねる床のかけら（低く広がる土煙 _dust() は、地面に灰色の玉が残って見えたので使わない）

const LIFE := 1.8
const WALL := false
const CRACK_LIFE := 0.55   # ひびは一瞬光ってすぐ消える（残り続けないように短く）

const CRACK_SHADER := """
shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled;
uniform float age = 0.0;      // 0 → 1（寿命に対する割合）
uniform float seed = 0.0;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void fragment() {
	vec2 p = (UV - 0.5) * 2.0;
	float r = length(p);
	float a = atan(p.y, p.x);
	// 放射状のひび（12本。本数ごとに角度と長さを少しずらし、途中で折れ曲がる）
	float n = 12.0;
	float idx = floor((a / 6.2832 + 0.5) * n);
	float center = (idx + 0.5) / n * 6.2832 - 3.1416 + (hash(idx + seed) - 0.5) * 0.35;
	float bend = sin(r * 9.0 + hash(idx * 3.1 + seed) * 6.0) * 0.06 * r;
	float d = abs(sin(a - center - bend)) * r;
	float len = 0.55 + 0.45 * hash(idx * 7.7 + seed);
	float grow = smoothstep(0.0, 0.22, age);                 // ひびが外へ走る
	float line = smoothstep(0.03, 0.0, d) * step(r, len * grow);
	// 細い枝わかれ
	float branch_a = center + (hash(idx + 11.0 + seed) - 0.5) * 0.9;
	float bd = abs(sin(a - branch_a)) * r;
	float branch = smoothstep(0.018, 0.0, bd) * step(len * 0.35, r) * step(r, len * 0.75 * grow);
	float crack = max(line, branch * 0.8) * smoothstep(1.0, 0.85, r);
	// 中心のくぼみの光
	float core = smoothstep(0.28, 0.0, r) * 0.9;
	float heat = 1.0 - smoothstep(0.3, 1.0, age);             // 走りきったらすぐ消える
	vec3 hot = mix(vec3(1.0, 0.8, 0.4), vec3(1.0, 0.35, 0.03), smoothstep(0.0, 0.5, age));
	ALBEDO = hot * (crack * 2.2 + core * (1.0 - smoothstep(0.0, 0.35, age)) * 1.5) * heat;
}
"""

const RING_SHADER := """
shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled;
uniform float t = 0.0;        // 0 → 1（輪が広がりきるまで）
uniform float width = 0.08;
uniform vec3 color : source_color = vec3(1.0, 0.7, 0.25);
void fragment() {
	float r = length(UV - 0.5) * 2.0;
	float front = mix(0.05, 1.0, 1.0 - pow(1.0 - t, 3.0));
	float band = smoothstep(width, 0.0, abs(r - front)) ;
	float inner = smoothstep(front, 0.0, r) * 0.25;           // 輪の内側もうっすら光る
	float fade = 1.0 - smoothstep(0.4, 1.0, t);
	ALBEDO = color * (band * 2.0 + inner) * fade;
}
"""

const WALL_SHADER := """
shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled;
uniform float t = 0.0;
void fragment() {
	float h = 1.0 - UV.y;   // 0 = 下、1 = 上
	float fade = (1.0 - smoothstep(0.0, 1.0, t)) * smoothstep(1.0, 0.0, h) * smoothstep(0.0, 0.08, h);
	float streak = 0.6 + 0.4 * sin(UV.x * 80.0 + h * 6.0);
	ALBEDO = vec3(1.0, 0.75, 0.35) * fade * streak * 1.3;
}
"""

var t := 0.0
var crack_mat: ShaderMaterial
var rings: Array[Array] = []   # [ShaderMaterial, 開始時刻, 長さ]
var wall: MeshInstance3D
var wall_mat: ShaderMaterial
var flash: OmniLight3D


func _ready() -> void:
	# 閃光
	flash = OmniLight3D.new()
	flash.light_color = Color(1.0, 0.7, 0.3)
	flash.light_energy = 9.0
	flash.omni_range = 11.0
	flash.position.y = 0.8
	add_child(flash)
	# ひび割れ（地面のすぐ上の板）
	crack_mat = ShaderMaterial.new()
	crack_mat.shader = _shader(CRACK_SHADER)
	crack_mat.set_shader_parameter("seed", randf() * 100.0)
	var crack := _plane(5.5, crack_mat)
	crack.position.y = 0.03
	crack.rotation.y = randf() * TAU
	# 衝撃波の輪（1本だけ。速く広がる細い輪）
	for spec: Array in [[0.0, 0.45, 9.0, 0.06, Color(1.0, 0.85, 0.5)]]:
		var m := ShaderMaterial.new()
		m.shader = _shader(RING_SHADER)
		m.set_shader_parameter("width", spec[3])
		m.set_shader_parameter("color", spec[4])
		var ring := _plane(spec[2], m)
		ring.position.y = 0.05
		rings.append([m, spec[0], spec[1]])
	# 立ち上がる光の壁（筒）。輪を1本にしたので使わない（WALL を true にすると戻る）
	var cyl := CylinderMesh.new()
	cyl.top_radius = 1.0
	cyl.bottom_radius = 1.0
	cyl.height = 1.0
	cyl.cap_top = false
	cyl.cap_bottom = false
	cyl.radial_segments = 48
	wall_mat = ShaderMaterial.new()
	wall_mat.shader = _shader(WALL_SHADER)
	cyl.material = wall_mat
	wall = MeshInstance3D.new()
	wall.mesh = cyl
	wall.visible = WALL
	wall.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(wall)
	_crown_splash()
	_beer_column()
	_foam_geyser()
	_debris()


func _process(delta: float) -> void:
	t += delta
	flash.light_energy = 9.0 * exp(-t * 9.0)
	crack_mat.set_shader_parameter("age", clampf(t / CRACK_LIFE, 0.0, 1.0))
	for r in rings:
		var m: ShaderMaterial = r[0]
		m.set_shader_parameter("t", clampf((t - r[1]) / r[2], 0.0, 1.0))
	var wt := clampf(t / 0.45, 0.0, 1.0)
	var radius := lerpf(0.4, 3.6, 1.0 - pow(1.0 - wt, 3.0))
	wall.scale = Vector3(radius, lerpf(0.4, 1.6, wt), radius)
	wall.position.y = wall.scale.y * 0.5
	wall_mat.set_shader_parameter("t", wt)
	if t > LIFE + 0.2:
		queue_free()


func _plane(size: float, m: Material) -> MeshInstance3D:
	var pm := PlaneMesh.new()
	pm.size = Vector2(size, size)
	pm.material = m
	var mi := MeshInstance3D.new()
	mi.mesh = pm
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	return mi


func _shader(code: String) -> Shader:
	var s := Shader.new()
	s.code = code
	return s


func _burst_particles(mesh: Mesh, amount: int, lifetime: float) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.mesh = mesh
	p.amount = amount
	p.lifetime = lifetime
	p.one_shot = true
	p.explosiveness = 1.0
	p.local_coords = false
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(p)
	p.emitting = true
	return p


func _fade_curve(peak := 0.15) -> Curve:
	var c := Curve.new()
	c.add_point(Vector2(0.0, 0.4))
	c.add_point(Vector2(peak, 1.0))
	c.add_point(Vector2(1.0, 0.0))
	return c


func _crown_splash() -> void:
	# 王冠しぶき: 輪から外・上へ。速さの向きに伸びた琥珀色の滴
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1.0, 0.58, 0.1, 0.9)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.emission_enabled = true
	m.emission = Color(1.0, 0.5, 0.08)
	m.emission_energy_multiplier = 1.2
	m.roughness = 0.08
	var drop := CapsuleMesh.new()
	drop.radius = 0.035
	drop.height = 0.22
	drop.radial_segments = 6
	drop.rings = 2
	drop.material = m
	var p := _burst_particles(drop, 160, 1.0)
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	p.emission_ring_axis = Vector3.UP
	p.emission_ring_radius = 0.6
	p.emission_ring_inner_radius = 0.3
	p.emission_ring_height = 0.05
	p.direction = Vector3.UP
	p.spread = 30.0
	p.initial_velocity_min = 5.0
	p.initial_velocity_max = 9.5
	p.radial_accel_min = 6.0
	p.radial_accel_max = 12.0
	p.gravity = Vector3(0, -18, 0)
	p.particle_flag_align_y = true
	p.scale_amount_min = 0.7
	p.scale_amount_max = 1.6
	p.position.y = 0.1


func _foam_geyser() -> void:
	# 泡の柱: 中心から白い泡が噴き上がり、ふくらみながら落ちる
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1.0, 0.93, 0.75, 0.85)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.emission_enabled = true
	m.emission = Color(1.0, 0.9, 0.7)
	m.emission_energy_multiplier = 0.4
	m.roughness = 0.5
	var bubble := SphereMesh.new()
	bubble.radius = 0.05
	bubble.height = 0.1
	bubble.radial_segments = 10
	bubble.rings = 5
	bubble.material = m
	var p := _burst_particles(bubble, 45, 1.1)
	p.explosiveness = 0.85
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.3
	p.direction = Vector3.UP
	p.spread = 14.0
	p.initial_velocity_min = 5.0
	p.initial_velocity_max = 8.5
	p.gravity = Vector3(0, -14, 0)
	p.damping_min = 1.0
	p.damping_max = 2.0
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.5
	p.scale_amount_curve = _fade_curve(0.3)
	p.position.y = 0.2


func _beer_column() -> void:
	# ビールの柱: 中心から琥珀色の滴が真上へ高く噴き上がる
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1.0, 0.6, 0.12, 0.9)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.emission_enabled = true
	m.emission = Color(1.0, 0.5, 0.08)
	m.emission_energy_multiplier = 1.4
	var drop := CapsuleMesh.new()
	drop.radius = 0.04
	drop.height = 0.35
	drop.radial_segments = 6
	drop.rings = 2
	drop.material = m
	var p := _burst_particles(drop, 70, 1.0)
	p.explosiveness = 0.9
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.2
	p.direction = Vector3.UP
	p.spread = 10.0
	p.initial_velocity_min = 8.0
	p.initial_velocity_max = 13.0
	p.gravity = Vector3(0, -20, 0)
	p.particle_flag_align_y = true
	p.scale_amount_min = 0.7
	p.scale_amount_max = 1.4
	p.position.y = 0.2


func _dust() -> void:
	# 土煙: 低く外へ広がる、灰色の柔らかい煙
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.75, 0.68, 0.58, 0.35)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.vertex_color_use_as_albedo = false
	var tex := GradientTexture2D.new()
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(0.5, 0.0)
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1))
	g.set_color(1, Color(1, 1, 1, 0))
	tex.gradient = g
	m.albedo_texture = tex
	var quad := QuadMesh.new()
	quad.size = Vector2(1.2, 1.2)
	quad.material = m
	var p := _burst_particles(quad, 40, 1.6)
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	p.emission_ring_axis = Vector3.UP
	p.emission_ring_radius = 0.8
	p.emission_ring_inner_radius = 0.2
	p.emission_ring_height = 0.1
	p.direction = Vector3(1, 0.15, 0)
	p.spread = 180.0
	p.flatness = 0.85
	p.initial_velocity_min = 3.0
	p.initial_velocity_max = 6.5
	p.damping_min = 3.0
	p.damping_max = 5.0
	p.gravity = Vector3(0, 0.3, 0)
	p.scale_amount_min = 0.8
	p.scale_amount_max = 2.2
	p.scale_amount_curve = _fade_curve(0.25)
	p.position.y = 0.25


func _debris() -> void:
	# 床のかけら: 小さな角ばった塊が跳ねて落ちる
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.45, 0.43, 0.4)
	m.roughness = 0.9
	var chunk := BoxMesh.new()
	chunk.size = Vector3(0.09, 0.06, 0.08)
	chunk.material = m
	var p := _burst_particles(chunk, 28, 1.1)
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.4
	p.direction = Vector3.UP
	p.spread = 60.0
	p.initial_velocity_min = 4.0
	p.initial_velocity_max = 8.0
	p.gravity = Vector3(0, -22, 0)
	p.angular_velocity_min = -720.0
	p.angular_velocity_max = 720.0
	p.particle_flag_rotate_y = true
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.8
	p.position.y = 0.1
