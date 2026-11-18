extends Node3D
## ビール無双の演出。そば屋の子ノードに置き、start() / stop() / finale() で動かす。
## - ビールの渦（2重の筒。琥珀色の流れと、上のほうが泡の白）
## - 足元の金色の光の輪（外へ広がる波紋）
## - 琥珀色のしぶき（速さの向きに伸びる）・白い泡・光の粒
## - そば屋を照らす琥珀色の明かり
## 最後の一撃（finale）で、泡としぶきが一気にはじける。

const VORTEX_SHADER := """
shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, depth_draw_never;
uniform float intensity = 0.0;
uniform float speed = 7.0;
uniform float bands = 7.0;
void fragment() {
	float h = UV.y;   // 0 = 上、1 = 下
	// 斜めに巻き上がる流れの筋（2本の周波数を重ねて、むらを出す）
	float a = sin((UV.x * bands + h * 2.5) * 6.2832 - TIME * speed);
	float b = sin((UV.x * bands * 1.7 - h * 1.5) * 6.2832 - TIME * speed * 1.3 + 1.7);
	float streak = smoothstep(0.35, 1.0, a) * 0.8 + smoothstep(0.6, 1.0, b) * 0.5;
	vec3 beer = vec3(1.0, 0.55, 0.08);
	vec3 foam = vec3(1.0, 0.95, 0.82);
	vec3 col = mix(foam * 0.8, beer, smoothstep(0.0, 0.3, h));
	float fade = smoothstep(0.0, 0.25, h) * smoothstep(1.0, 0.7, h);
	ALBEDO = col * streak * fade * intensity * 0.6;
}
"""

const RING_SHADER := """
shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, depth_draw_never;
uniform float intensity = 0.0;
void fragment() {
	float r = length(UV - vec2(0.5)) * 2.0;   // 0 = 中心、1 = 縁
	float waves = pow(0.5 + 0.5 * sin((r * 5.0 - TIME * 2.2) * 6.2832), 6.0);
	float glow = smoothstep(1.0, 0.0, r);
	float edge = smoothstep(1.0, 0.85, r) * smoothstep(0.7, 0.85, r);
	vec3 col = vec3(1.0, 0.62, 0.12) * (waves * 0.6 * glow + glow * glow * 0.35 + edge * 0.6);
	ALBEDO = col * intensity * 0.6;
}
"""

const DOT_SHADER := """
shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never;
void vertex() {
	// 常にカメラを向く板（パーティクルの大きさはそのまま使う）
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
	MODELVIEW_MATRIX = MODELVIEW_MATRIX * mat4(vec4(length(MODEL_MATRIX[0].xyz), 0.0, 0.0, 0.0), vec4(0.0, length(MODEL_MATRIX[1].xyz), 0.0, 0.0), vec4(0.0, 0.0, length(MODEL_MATRIX[2].xyz), 0.0), vec4(0.0, 0.0, 0.0, 1.0));
}
void fragment() {
	float r = length(UV - vec2(0.5)) * 2.0;
	float core = smoothstep(1.0, 0.0, r);
	ALBEDO = COLOR.rgb * (core * core * 0.8 + smoothstep(0.25, 0.0, r) * 1.2) * COLOR.a;
}
"""

var intensity := 0.0
var target := 0.0
var vortex_mats: Array[ShaderMaterial] = []
var vortices: Array[MeshInstance3D] = []
var ring_mat: ShaderMaterial
var light: OmniLight3D
var splash: CPUParticles3D
var foam: CPUParticles3D
var sparks: CPUParticles3D
var burst_foam: CPUParticles3D
var burst_splash: CPUParticles3D


func _ready() -> void:
	# ビールの渦（外側は速く、内側は逆回りでゆっくり）
	for i in 2:
		var cyl := CylinderMesh.new()
		cyl.top_radius = 1.9 if i == 0 else 1.25
		cyl.bottom_radius = 1.25 if i == 0 else 0.95
		cyl.height = 2.8 if i == 0 else 2.2
		cyl.cap_top = false
		cyl.cap_bottom = false
		cyl.radial_segments = 48
		var m := ShaderMaterial.new()
		m.shader = _shader(VORTEX_SHADER)
		m.set_shader_parameter("speed", 7.0 if i == 0 else -5.0)
		m.set_shader_parameter("bands", 7.0 if i == 0 else 5.0)
		cyl.material = m
		var v := MeshInstance3D.new()
		v.mesh = cyl
		v.position.y = cyl.height * 0.5 + 0.05
		v.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		v.visible = false
		add_child(v)
		vortices.append(v)
		vortex_mats.append(m)
	# 足元の光の輪
	var plane := PlaneMesh.new()
	plane.size = Vector2(8.0, 8.0)
	ring_mat = ShaderMaterial.new()
	ring_mat.shader = _shader(RING_SHADER)
	plane.material = ring_mat
	var ring := MeshInstance3D.new()
	ring.mesh = plane
	ring.position.y = 0.04
	ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	ring.name = "Ring"
	ring.visible = false
	add_child(ring)
	vortices.append(ring)
	# 明かり
	light = OmniLight3D.new()
	light.light_color = Color(1.0, 0.62, 0.2)
	light.omni_range = 9.0
	light.light_energy = 0.0
	light.position.y = 1.4
	light.shadow_enabled = false
	add_child(light)
	# しぶき: 琥珀色の小さな滴。速さの向きに伸ばし、渦に沿って回りながら飛び散る
	var drop_mat := StandardMaterial3D.new()
	drop_mat.albedo_color = Color(1.0, 0.6, 0.12, 0.85)
	drop_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	drop_mat.emission_enabled = true
	drop_mat.emission = Color(1.0, 0.5, 0.08)
	drop_mat.emission_energy_multiplier = 0.5
	drop_mat.roughness = 0.1
	var drop := CapsuleMesh.new()
	drop.radius = 0.018
	drop.height = 0.11
	drop.radial_segments = 6
	drop.rings = 2
	drop.material = drop_mat
	splash = _particles(drop, 130, 0.75)
	splash.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	splash.emission_ring_axis = Vector3.UP
	splash.emission_ring_radius = 1.5
	splash.emission_ring_inner_radius = 0.9
	splash.emission_ring_height = 0.3
	splash.direction = Vector3(0, 1, 0)
	splash.spread = 35.0
	splash.initial_velocity_min = 3.5
	splash.initial_velocity_max = 7.0
	splash.gravity = Vector3(0, -13, 0)
	splash.tangential_accel_min = 8.0
	splash.tangential_accel_max = 14.0
	splash.radial_accel_min = 1.0
	splash.radial_accel_max = 3.0
	splash.particle_flag_align_y = true
	splash.scale_amount_min = 0.7
	splash.scale_amount_max = 1.4
	splash.position.y = 0.4
	# 泡: 白くて柔らかい玉が、ゆっくり舞い上がって消える
	var foam_mat := StandardMaterial3D.new()
	foam_mat.albedo_color = Color(1.0, 0.97, 0.9, 0.9)
	foam_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	foam_mat.emission_enabled = true
	foam_mat.emission = Color(1.0, 0.92, 0.75)
	foam_mat.emission_energy_multiplier = 0.35
	foam_mat.roughness = 0.6
	var bubble := SphereMesh.new()
	bubble.radius = 0.06
	bubble.height = 0.12
	bubble.radial_segments = 10
	bubble.rings = 5
	bubble.material = foam_mat
	foam = _particles(bubble, 70, 1.2)
	foam.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	foam.emission_ring_axis = Vector3.UP
	foam.emission_ring_radius = 1.6
	foam.emission_ring_inner_radius = 0.6
	foam.emission_ring_height = 1.6
	foam.direction = Vector3.UP
	foam.spread = 20.0
	foam.initial_velocity_min = 0.8
	foam.initial_velocity_max = 2.0
	foam.gravity = Vector3(0, 0.6, 0)
	foam.tangential_accel_min = 2.0
	foam.tangential_accel_max = 4.0
	foam.damping_min = 0.5
	foam.damping_max = 1.2
	foam.scale_amount_min = 0.4
	foam.scale_amount_max = 1.1
	foam.scale_amount_curve = _fade_curve()
	foam.position.y = 0.6
	# 光の粒: 小さく光る点（玉ではなく、柔らかい光の板）
	var dot_mat := ShaderMaterial.new()
	dot_mat.shader = _shader(DOT_SHADER)
	var quad := QuadMesh.new()
	quad.size = Vector2(0.18, 0.18)
	quad.material = dot_mat
	sparks = _particles(quad, 90, 0.9)
	sparks.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	sparks.emission_ring_axis = Vector3.UP
	sparks.emission_ring_radius = 2.0
	sparks.emission_ring_inner_radius = 0.5
	sparks.emission_ring_height = 0.4
	sparks.direction = Vector3.UP
	sparks.spread = 25.0
	sparks.initial_velocity_min = 2.0
	sparks.initial_velocity_max = 4.5
	sparks.gravity = Vector3(0, -1.0, 0)
	sparks.tangential_accel_min = 4.0
	sparks.tangential_accel_max = 8.0
	sparks.scale_amount_min = 0.5
	sparks.scale_amount_max = 1.4
	sparks.scale_amount_curve = _fade_curve()
	sparks.color = Color(1.0, 0.78, 0.35)
	sparks.position.y = 0.3
	# 最後の一撃: 泡としぶきが一気にはじける
	burst_foam = _particles(bubble, 140, 1.1)
	burst_foam.one_shot = true
	burst_foam.explosiveness = 0.95
	burst_foam.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	burst_foam.emission_sphere_radius = 0.8
	burst_foam.direction = Vector3.UP
	burst_foam.spread = 85.0
	burst_foam.initial_velocity_min = 4.0
	burst_foam.initial_velocity_max = 10.0
	burst_foam.gravity = Vector3(0, -9, 0)
	burst_foam.damping_min = 1.0
	burst_foam.damping_max = 2.5
	burst_foam.scale_amount_min = 0.6
	burst_foam.scale_amount_max = 1.6
	burst_foam.scale_amount_curve = _fade_curve()
	burst_foam.position.y = 1.0
	burst_splash = _particles(drop, 200, 0.9)
	burst_splash.one_shot = true
	burst_splash.explosiveness = 1.0
	burst_splash.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	burst_splash.emission_sphere_radius = 0.6
	burst_splash.direction = Vector3.UP
	burst_splash.spread = 75.0
	burst_splash.initial_velocity_min = 6.0
	burst_splash.initial_velocity_max = 13.0
	burst_splash.gravity = Vector3(0, -16, 0)
	burst_splash.particle_flag_align_y = true
	burst_splash.scale_amount_min = 0.8
	burst_splash.scale_amount_max = 1.5
	burst_splash.position.y = 0.8


func _particles(mesh: Mesh, amount: int, lifetime: float) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.mesh = mesh
	p.amount = amount
	p.lifetime = lifetime
	p.emitting = false
	p.local_coords = false
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(p)
	return p


func _fade_curve() -> Curve:
	var c := Curve.new()
	c.add_point(Vector2(0.0, 0.3))
	c.add_point(Vector2(0.2, 1.0))
	c.add_point(Vector2(1.0, 0.0))
	return c


func _shader(code: String) -> Shader:
	var s := Shader.new()
	s.code = code
	return s


func start() -> void:
	target = 1.0
	for v in vortices:
		v.visible = true
	for p: CPUParticles3D in [splash, foam, sparks]:
		p.emitting = true


func stop() -> void:
	target = 0.0
	for p: CPUParticles3D in [splash, foam, sparks]:
		p.emitting = false


func finale() -> void:
	for p: CPUParticles3D in [burst_foam, burst_splash]:
		p.restart()
		p.emitting = true
	intensity = 1.4   # 一瞬だけ強く光らせてから消える
	stop()


func _process(delta: float) -> void:
	intensity = move_toward(intensity, target, delta * (3.0 if target > intensity else 1.6))
	var pulse := 1.0 + sin(Time.get_ticks_msec() * 0.012) * 0.12
	for m in vortex_mats:
		m.set_shader_parameter("intensity", intensity * pulse)
	ring_mat.set_shader_parameter("intensity", intensity)
	light.light_energy = intensity * 1.8 * pulse
	vortices[0].rotation.y += delta * 2.6
	vortices[1].rotation.y -= delta * 1.8
	if intensity <= 0.001 and target == 0.0:
		for v in vortices:
			v.visible = false
