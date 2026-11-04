extends Node3D
## プレイヤー: そば屋（高品質版モデル＋外付けジョッキ）。
## 移動・4段コンボ・チャージ攻撃・回避・無双乱舞を持つ。当たり判定は game（main.gd）に問い合わせる。

const ModelScene := preload("res://models/sobaya_hq.glb")
const MugScene := preload("res://models/beer_mug.glb")

const RUN_SPEED := 6.0
const RUN_ANIM_SPEED := 4.2      # Hybrid_MugRun 1倍速に相当する移動速度
const MAX_HP := 1000.0
const MUSOU_MAX := 100.0
const DODGE_TIME := 0.62
const DODGE_DISTANCE := 4.2
const DODGE_IFRAMES := 0.45
const MUSOU_TIME := 3.2

# コンボ各段: アニメ・再生速度・打点・次段受付・終了（いずれもクリップ長に対する割合）・威力・範囲
const COMBO := [
	{"anim": "Hybrid_MugPunch", "speed": 1.9, "hit": 0.46, "cancel": 0.6, "end": 0.85, "dmg": 34.0, "range": 2.5, "cone": 120.0, "push": 3.0, "launch": 0.0, "lunge": 1.2},
	{"anim": "Hybrid_MugHook", "speed": 2.1, "hit": 0.46, "cancel": 0.6, "end": 0.85, "dmg": 34.0, "range": 2.7, "cone": 170.0, "push": 3.5, "launch": 0.0, "lunge": 1.0},
	{"anim": "Hybrid_MugPunch", "speed": 2.3, "hit": 0.46, "cancel": 0.6, "end": 0.85, "dmg": 40.0, "range": 2.6, "cone": 120.0, "push": 4.0, "launch": 0.0, "lunge": 1.4},
	{"anim": "Hybrid_MugSmash", "speed": 1.7, "hit": 0.5, "cancel": 0.8, "end": 0.92, "dmg": 70.0, "range": 3.4, "cone": 360.0, "push": 7.0, "launch": 7.0, "lunge": 0.8, "wave": true},
]
const CHARGE := {"anim": "MugAttack", "speed": 1.25, "hit": 0.55, "cancel": 0.85, "end": 0.95, "dmg": 110.0, "range": 4.2, "cone": 360.0, "push": 10.0, "launch": 9.0, "lunge": 0.4, "wave": true}

enum State { MOVE, ATTACK, DODGE, HURT, MUSOU, DOWN, WIN }

var game: Node
var state := State.MOVE
var hp := MAX_HP
var musou := 0.0
var velocity := Vector3.ZERO
var facing := 0.0                 # ヨー角（+Zが0）
var move_input := Vector3.ZERO    # main が毎フレーム入れるカメラ基準の移動入力
var invuln := 0.0

var attack: Dictionary = {}
var attack_t := 0.0
var attack_hit_done := false
var combo_index := 0
var queued_attack := ""           # "combo" / "charge"
var dodge_t := 0.0
var dodge_dir := Vector3.ZERO
var hurt_t := 0.0
var musou_t := 0.0
var musou_tick := 0.0

var body: Node3D
var model: Node3D
var skeleton: Skeleton3D
var anim: AnimationPlayer
var body_mesh: MeshInstance3D
var liquid_meshes: Array[MeshInstance3D] = []
var current_anim := ""


func _ready() -> void:
	body = Node3D.new()
	add_child(body)
	model = ModelScene.instantiate()
	body.add_child(model)
	skeleton = model.find_children("*", "Skeleton3D", true, false)[0]
	anim = model.find_children("*", "AnimationPlayer", true, false)[0]
	for a: String in ["Hybrid_MugHold", "Hybrid_MugRun", "DanceVictory", "Hybrid_MugHook"]:
		anim.get_animation(a).loop_mode = Animation.LOOP_LINEAR
	body_mesh = model.find_child("SobayaV3Body", true, false) as MeshInstance3D
	_attach_mug()


func _attach_mug() -> void:
	# 持ち手（Grip）を右手の PropSocket.R に合わせる（共同開発リポジトリの character-mug.ts と同じ）
	var socket := BoneAttachment3D.new()
	socket.bone_name = "PropSocket.R"
	skeleton.add_child(socket)
	var mug: Node3D = MugScene.instantiate()
	socket.add_child(mug)
	var grip := mug.find_child("Grip", true, false) as Node3D
	mug.transform = grip.transform.affine_inverse()
	# Godot は glTF の透過に対応しないので、薄いガラス＋琥珀色のビールへ置き換える
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color(0.92, 0.97, 1.0, 0.22)
	glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass.roughness = 0.05
	var beer_mat := StandardMaterial3D.new()
	beer_mat.albedo_color = Color(0.85, 0.56, 0.13)
	beer_mat.roughness = 0.25
	beer_mat.emission_enabled = true
	beer_mat.emission = Color(0.6, 0.32, 0.05)
	beer_mat.emission_energy_multiplier = 0.3
	for mi: MeshInstance3D in mug.find_children("*", "MeshInstance3D", true, false):
		match String(mi.name):
			"GlassBody", "Handle":
				mi.material_override = glass
			"BeerVolume", "LiquidSurface":
				mi.material_override = beer_mat
				liquid_meshes.append(mi)
			"Foam":
				liquid_meshes.append(mi)
			"Carbonation":
				mi.visible = false


func reset(pos: Vector3) -> void:
	position = pos
	state = State.MOVE
	hp = MAX_HP
	musou = 0.0
	velocity = Vector3.ZERO
	facing = PI   # 奥（-Z）を向く
	invuln = 0.0
	combo_index = 0
	queued_attack = ""
	current_anim = ""


# ---------------------------------------------------------------- 入力（main から呼ぶ）

func press_attack() -> void:
	if state == State.MOVE:
		_start_attack(COMBO[0])
		combo_index = 0
	elif state == State.ATTACK:
		queued_attack = "combo"


func press_charge() -> void:
	if state == State.MOVE:
		_start_attack(CHARGE)
		combo_index = -1
	elif state == State.ATTACK:
		queued_attack = "charge"


func press_dodge() -> void:
	if state in [State.MOVE, State.ATTACK, State.HURT]:
		state = State.DODGE
		dodge_t = 0.0
		var dir := move_input if move_input.length() > 0.1 else Vector3(sin(facing), 0.0, cos(facing))
		dodge_dir = dir.normalized()
		facing = atan2(dodge_dir.x, dodge_dir.z)
		invuln = DODGE_IFRAMES
		_play("Procedural_RollForward", 0.05, 1.4 / DODGE_TIME)


func press_musou() -> bool:
	if musou < MUSOU_MAX or state in [State.MUSOU, State.DOWN, State.WIN]:
		return false
	state = State.MUSOU
	musou_t = 0.0
	musou_tick = 0.0
	invuln = MUSOU_TIME + 0.6
	_play("Hybrid_MugHook", 0.1, 1.8)
	return true


func is_musou_ready() -> bool:
	return musou >= MUSOU_MAX


# ---------------------------------------------------------------- 更新

func update(delta: float) -> void:
	invuln = maxf(invuln - delta, 0.0)
	match state:
		State.MOVE:
			_update_move(delta)
		State.ATTACK:
			_update_attack(delta)
		State.DODGE:
			dodge_t += delta
			var k := clampf(dodge_t / (DODGE_TIME * 0.8), 0.0, 1.0)
			velocity = dodge_dir * DODGE_DISTANCE / (DODGE_TIME * 0.8) * (1.0 - k * k)
			if dodge_t >= DODGE_TIME:
				state = State.MOVE
		State.HURT:
			hurt_t -= delta
			velocity = velocity.lerp(Vector3.ZERO, 1.0 - exp(-delta * 8.0))
			if hurt_t <= 0.0:
				state = State.MOVE
		State.MUSOU:
			_update_musou(delta)
		State.DOWN, State.WIN:
			velocity = Vector3.ZERO
	position += velocity * delta
	body.rotation.y = lerp_angle(body.rotation.y, facing, 1.0 - exp(-delta * 18.0)) if state != State.MUSOU else facing

	# 手の形とジョッキの中身（ビールの量＝無双ゲージ）
	var grip_idx := body_mesh.find_blend_shape_by_name("MugGrip")
	if grip_idx >= 0:
		body_mesh.set_blend_shape_value(grip_idx, 1.0)
	var level := musou / MUSOU_MAX
	for mi in liquid_meshes:
		var idx := mi.find_blend_shape_by_name("Fill")
		if idx >= 0:
			mi.set_blend_shape_value(idx, 1.0 - level)
		mi.visible = level > (0.15 if mi.name == "Foam" else 0.03)


func _update_move(delta: float) -> void:
	var target := move_input * RUN_SPEED
	velocity = velocity.lerp(target, 1.0 - exp(-delta * 14.0))
	var speed := Vector2(velocity.x, velocity.z).length()
	if move_input.length() > 0.1:
		facing = atan2(move_input.x, move_input.z)
	if speed > 0.6:
		_play("Hybrid_MugRun", 0.15, clampf(speed / RUN_ANIM_SPEED, 0.6, 1.6))
	else:
		_play("Hybrid_MugHold", 0.2, 1.0)


func _start_attack(a: Dictionary) -> void:
	state = State.ATTACK
	attack = a
	attack_t = 0.0
	attack_hit_done = false
	queued_attack = ""
	# 無双系の補助: 近くの敵へ向き直る。入力があればそちらを優先
	if move_input.length() > 0.1:
		facing = atan2(move_input.x, move_input.z)
	else:
		var target: Node3D = game.nearest_enemy(global_position, 5.0)
		if target:
			var d := target.global_position - global_position
			facing = atan2(d.x, d.z)
	_play(a.anim, 0.05, a.speed)
	anim.seek(0.0, true)


func _update_attack(delta: float) -> void:
	attack_t += delta
	var length: float = anim.get_animation(attack.anim).length / attack.speed
	var p := attack_t / length
	var fwd := Vector3(sin(facing), 0.0, cos(facing))
	# 振りかぶりから打点までは前へ踏み込む
	velocity = fwd * (attack.lunge / (length * attack.hit) if p < attack.hit else 0.0)
	if not attack_hit_done and p >= attack.hit:
		attack_hit_done = true
		var hits: int = game.player_attack(global_position + fwd * 0.6, fwd, attack)
		if hits > 0:
			musou = minf(musou + hits * (1.5 if attack.cone < 360.0 else 1.0), MUSOU_MAX)
	if p >= attack.cancel and queued_attack != "":
		if queued_attack == "charge":
			combo_index = -1
			_start_attack(CHARGE)
			return
		if combo_index >= 0 and combo_index < COMBO.size() - 1:
			combo_index += 1
			_start_attack(COMBO[combo_index])
			return
	if p >= attack.end:
		state = State.MOVE
		combo_index = 0


func _update_musou(delta: float) -> void:
	musou_t += delta
	musou = MUSOU_MAX * (1.0 - musou_t / MUSOU_TIME)
	facing += delta * TAU * 2.2   # 回転しながら前進する
	velocity = move_input * RUN_SPEED * 0.6
	musou_tick -= delta
	if musou_tick <= 0.0:
		musou_tick = 0.16
		game.player_attack(global_position, Vector3.FORWARD, {"dmg": 26.0, "range": 4.0, "cone": 360.0, "push": 9.0, "launch": 6.0, "musou": true})
	if musou_t >= MUSOU_TIME:
		# 締めの一撃
		musou = 0.0
		game.player_attack(global_position, Vector3.FORWARD, {"dmg": 140.0, "range": 7.0, "cone": 360.0, "push": 16.0, "launch": 12.0, "wave": true, "musou": true})
		_start_attack({"anim": "Hybrid_MugSmash", "speed": 1.6, "hit": 2.0, "cancel": 0.9, "end": 0.9, "dmg": 0.0, "range": 0.0, "cone": 0.0, "push": 0.0, "launch": 0.0, "lunge": 0.0})


func take_hit(dmg: float, from: Vector3) -> bool:
	if invuln > 0.0 or state in [State.DOWN, State.WIN, State.MUSOU, State.DODGE]:
		return false
	hp = maxf(hp - dmg, 0.0)
	musou = minf(musou + dmg * 0.08, MUSOU_MAX)
	if hp <= 0.0:
		state = State.DOWN
		_play("Library_Kneeling_Tired", 0.2, 1.0)
		return true
	# 攻撃中はひるまない（スーパーアーマー）。移動中だけのけぞる
	if state == State.MOVE:
		state = State.HURT
		hurt_t = 0.32
		var away := global_position - from
		away.y = 0.0
		velocity = away.normalized() * 3.0
		_play("Library_Hit_Chest", 0.05, 1.2)
		anim.seek(0.0, true)
	return true


func heal(amount: float) -> void:
	hp = minf(hp + amount, MAX_HP)


func add_musou(amount: float) -> void:
	musou = minf(musou + amount, MUSOU_MAX)


func win() -> void:
	state = State.WIN
	_play("DanceVictory", 0.3, 1.0)


func _play(name: String, blend: float, speed: float) -> void:
	if name != current_anim:
		anim.play(name, blend)
		current_anim = name
	anim.speed_scale = speed


func head_position() -> Vector3:
	return global_position + Vector3(0.0, 2.0, 0.0)
