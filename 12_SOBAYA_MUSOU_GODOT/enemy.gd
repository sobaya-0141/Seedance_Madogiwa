extends Node3D
## 敵: 警備員・警察官・警備隊長・警部。CC0 のマネキン素体に制服の色（頂点カラー）と帽子・警棒を付ける。
## 倒されると吹っ飛んで目を回し、床に沈んで退場する（流血・死亡表現はしない）。

const BaseScene := preload("res://models/mannequin_base.glb")
const GRAVITY := 22.0

enum State { CHASE, ATTACK, HURT, AIR, GETUP, DIZZY, GONE }

var game: Node
var cfg: Dictionary
var state := State.CHASE
var hp := 1.0
var velocity := Vector3.ZERO
var facing := 0.0
var ring_angle := 0.0        # プレイヤーを囲むときの自分の持ち場（角度）
var ring_dist := 3.0
var attack_cd := 1.0
var has_token := false
var state_t := 0.0
var attack_hit_done := false
var special_cd := 6.0
var far_t := 0.0

var body: Node3D
var model: Node3D
var anim: AnimationPlayer
var skeleton: Skeleton3D
var stars: Node3D
var name_label: Label3D
var current_anim := ""


func setup(p_game: Node, p_cfg: Dictionary, pos: Vector3) -> void:
	game = p_game
	cfg = p_cfg
	position = pos
	hp = cfg.hp
	ring_angle = randf() * TAU
	ring_dist = randf_range(2.6, 3.8)
	attack_cd = randf_range(0.6, 2.0)


func _ready() -> void:
	body = Node3D.new()
	add_child(body)
	model = BaseScene.instantiate()
	body.add_child(model)
	body.scale = Vector3.ONE * cfg.get("scale", 1.0)
	anim = model.find_children("*", "AnimationPlayer", true, false)[0]
	skeleton = model.find_children("*", "Skeleton3D", true, false)[0]
	anim.add_animation_library("addon", game.addon_library)
	var mi: MeshInstance3D = model.find_children("*", "MeshInstance3D", true, false)[0]
	mi.mesh = game.uniform_mesh(cfg)
	mi.material_override = game.uniform_material
	_add_props()

	stars = Node3D.new()
	stars.position = Vector3(0.0, 2.05, 0.0) * cfg.get("scale", 1.0)
	stars.visible = false
	add_child(stars)
	for i in 3:
		var s := Label3D.new()
		s.text = "★"
		s.font = game.jp_font
		s.font_size = 64
		s.pixel_size = 0.004
		s.modulate = Color(1.0, 0.9, 0.2)
		s.outline_size = 10
		s.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		s.position = Vector3(cos(i * TAU / 3.0), 0.0, sin(i * TAU / 3.0)) * 0.28
		stars.add_child(s)

	if cfg.has("title"):
		name_label = Label3D.new()
		name_label.text = cfg.title
		name_label.font = game.jp_font
		name_label.font_size = 56
		name_label.pixel_size = 0.005
		name_label.modulate = Color(1.0, 0.85, 0.4)
		name_label.outline_size = 14
		name_label.outline_modulate = Color(0.2, 0.05, 0.0)
		name_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		name_label.no_depth_test = true
		name_label.position = Vector3(0.0, 2.45, 0.0) * cfg.get("scale", 1.0)
		add_child(name_label)
	_play("Walk", 0.0, 1.0)


func _add_props() -> void:
	# 帽子（クラウン＋つば＋帽章）を頭の骨へ。骨の向きに関係なくまっすぐ載るよう、休止姿勢の逆行列で打ち消す
	var cap := Node3D.new()
	var crown := _part(CylinderMesh.new(), cfg.cap)
	(crown.mesh as CylinderMesh).top_radius = 0.135
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
	_attach(cap, "head", Vector3(0.0, 1.8, 0.0))

	if cfg.get("baton", false):
		var baton := _part(CylinderMesh.new(), Color(0.08, 0.08, 0.09))
		(baton.mesh as CylinderMesh).top_radius = 0.022
		(baton.mesh as CylinderMesh).bottom_radius = 0.026
		(baton.mesh as CylinderMesh).height = 0.6
		baton.rotation.x = PI * 0.5
		var holder := Node3D.new()
		holder.add_child(baton)
		baton.position = Vector3(0.0, 0.0, 0.22)
		# 休止姿勢（Tポーズ）の右手の位置
		var hand := skeleton.get_bone_global_rest(skeleton.find_bone("hand_r")).origin
		_attach(holder, "hand_r", hand + Vector3(-0.08, 0.0, 0.0))


func _attach(node: Node3D, bone: String, rest_pos: Vector3) -> void:
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


func is_alive() -> bool:
	return hp > 0.0


func is_boss() -> bool:
	return cfg.get("armor", false)


# ---------------------------------------------------------------- 更新

func update(delta: float, player: Node3D) -> void:
	state_t += delta
	attack_cd -= delta
	special_cd -= delta
	var to_player := player.global_position - global_position
	to_player.y = 0.0
	var dist := to_player.length()
	var sc: float = cfg.get("scale", 1.0)

	match state:
		State.CHASE:
			_update_chase(delta, player, to_player, dist)
		State.ATTACK:
			velocity = velocity.lerp(Vector3.ZERO, 1.0 - exp(-delta * 10.0))
			var length: float = anim.get_animation(cfg.attack_anim).length / cfg.attack_speed
			if not attack_hit_done and state_t >= length * cfg.attack_hit:
				attack_hit_done = true
				var fwd := Vector3(sin(facing), 0.0, cos(facing))
				if dist < cfg.range * sc + 0.4 and fwd.dot(to_player.normalized()) > 0.3:
					game.damage_player(cfg.dmg, global_position)
			if state_t >= length:
				_end_attack()
		State.HURT:
			velocity = velocity.lerp(Vector3.ZERO, 1.0 - exp(-delta * 6.0))
			if state_t >= 0.38:
				state = State.CHASE
		State.AIR:
			velocity.y -= GRAVITY * delta
			body.rotation.x = clampf(body.rotation.x - delta * 5.0, -1.2, 0.0)
			if position.y <= 0.0 and velocity.y < 0.0:
				position.y = 0.0
				velocity = Vector3(velocity.x, 0.0, velocity.z) * 0.3
				body.rotation.x = 0.0
				game.landing_dust(global_position)
				if hp <= 0.0:
					_set_state(State.DIZZY)
					stars.visible = true
					_play("addon/Dizzy", 0.1, 1.4)
				else:
					_set_state(State.GETUP)
					_play("Idle_A", 0.2, 1.0)
		State.GETUP:
			velocity = velocity.lerp(Vector3.ZERO, 1.0 - exp(-delta * 8.0))
			if state_t >= 0.45:
				state = State.CHASE
		State.DIZZY:
			velocity = velocity.lerp(Vector3.ZERO, 1.0 - exp(-delta * 8.0))
			stars.rotation.y += delta * 6.0
			if state_t >= 1.3:
				_set_state(State.GONE)
				stars.visible = false
				_play("Death_D", 0.2, 1.3)
		State.GONE:
			velocity = Vector3.ZERO
			if state_t > 1.4:
				position.y -= delta * 1.2    # 床に沈んで退場
			if state_t > 2.4:
				game.remove_enemy(self)
				return
	position += velocity * delta
	body.rotation.y = lerp_angle(body.rotation.y, facing, 1.0 - exp(-delta * 10.0))


func _update_chase(delta: float, player: Node3D, to_player: Vector3, dist: float) -> void:
	var sc: float = cfg.get("scale", 1.0)
	if dist > 0.01:
		facing = atan2(to_player.x, to_player.z)
	# 攻撃の順番（トークン）をもらえた敵だけが踏み込む。それ以外は周りを囲んで待つ
	if not has_token and attack_cd <= 0.0 and dist < 6.0:
		has_token = game.request_attack_token(self)
		if not has_token:
			attack_cd = randf_range(0.3, 0.9)
	var want := 1.1 * sc if has_token else ring_dist
	ring_angle += delta * 0.25
	var around := player.global_position - Vector3(cos(ring_angle), 0.0, sin(ring_angle)) * want
	if has_token:
		around = player.global_position - to_player.normalized() * want
	var move := around - global_position
	move.y = 0.0
	var speed: float = cfg.speed * (1.6 if dist > 10.0 else 1.0)
	var dir: Vector3 = game.steer(self, global_position, around)
	var target_vel := dir * speed if move.length() > 0.35 else Vector3.ZERO
	# 遠くで長く迷子になったら、プレイヤーの近くの搬入口から入り直す
	far_t = far_t + delta if dist > 14.0 else 0.0
	if far_t > 6.0:
		far_t = 0.0
		game.respawn_near_player(self)
	velocity = velocity.lerp(target_vel, 1.0 - exp(-delta * 6.0))

	if has_token and dist < cfg.range * sc + 0.2:
		_start_attack()
		return
	if cfg.has("special") and special_cd <= 0.0 and dist < 5.0:
		special_cd = cfg.special_cd
		_start_special()
		return
	var spd := Vector2(velocity.x, velocity.z).length()
	if spd > 2.8:
		_play("Jog", 0.2, spd / 3.6)
	elif spd > 0.4:
		_play("Walk", 0.2, spd / 1.5)
	else:
		_play("addon/Fighting Idle", 0.25, 1.0)


func _start_attack() -> void:
	_set_state(State.ATTACK)
	attack_hit_done = false
	_play(cfg.attack_anim, 0.1, cfg.attack_speed)
	anim.seek(0.0, true)


func _start_special() -> void:
	# 警部の地響き: 少し溜めてから周囲に衝撃波
	_set_state(State.ATTACK)
	attack_hit_done = true
	_play("addon/Attack_Ground_Pound", 0.1, 1.0)
	anim.seek(0.0, true)
	var length: float = anim.get_animation("addon/Attack_Ground_Pound").length
	get_tree().create_timer(length * 0.55).timeout.connect(func() -> void:
		if state == State.ATTACK and is_inside_tree():
			game.enemy_shockwave(global_position, 4.5, cfg.special_dmg))


func _end_attack() -> void:
	state = State.CHASE
	state_t = 0.0
	attack_cd = randf_range(1.2, 2.4)
	_release_token()


func _release_token() -> void:
	if has_token:
		has_token = false
		game.release_attack_token(self)


func _set_state(s: State) -> void:
	state = s
	state_t = 0.0


## プレイヤーの攻撃が当たった。push=水平に押す速さ、launch=打ち上げる速さ
func take_hit(dmg: float, push_dir: Vector3, push: float, launch: float) -> void:
	if state in [State.DIZZY, State.GONE]:
		return
	hp -= dmg
	var armor: bool = cfg.get("armor", false)
	if hp <= 0.0:
		_release_token()
		_set_state(State.AIR)
		velocity = push_dir * maxf(push, 4.0) / (2.0 if armor else 1.0)
		velocity.y = maxf(launch, 5.0)
		position.y = maxf(position.y, 0.01)
		_play("Hit_Knockback", 0.05, 0.9)
		if name_label:
			name_label.visible = false
		return
	if armor and launch < 11.0:
		# 隊長・警部は大技以外ではひるまない
		velocity += push_dir * push * 0.15
		return
	if launch > 0.0:
		_release_token()
		_set_state(State.AIR)
		velocity = push_dir * push
		velocity.y = launch
		position.y = maxf(position.y, 0.01)
		_play("Hit_Knockback", 0.05, 0.9)
		anim.seek(0.0, true)
	elif state != State.AIR:
		_release_token()
		_set_state(State.HURT)
		velocity = push_dir * push
		_play("Hit_Chest", 0.05, 1.0)
		anim.seek(0.0, true)
	else:
		# 空中追撃: 少し浮かせ直す
		velocity.y = maxf(velocity.y, 3.0)
		velocity += push_dir * push * 0.3


func is_targetable() -> bool:
	return state not in [State.DIZZY, State.GONE] and hp > 0.0


func _play(name: String, blend: float, speed: float) -> void:
	if name != current_anim:
		anim.play(name, blend)
		current_anim = name
	anim.speed_scale = speed
