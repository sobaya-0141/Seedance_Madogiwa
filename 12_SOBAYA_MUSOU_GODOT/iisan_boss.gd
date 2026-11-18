extends "res://enemy.gd"
## 隠しボス: 土下座王 いーさん（ステージ3クリア後の屋上ヘリポート）。競謝（土下座の速さを競う競技）の不動の王者。
## 歩き・パンチは他の敵と同じリターゲット（マネキン→Tripo）で動かし、土下座だけは Tripo のモデル自身のアニメーション
## "Dogeza"（iisan_dogeza.glb。立つ 0 → 正座 0.5 → 土下座 1.0）を、進み具合を直接指定して見せる。
##
## とてつもない土下座の技（どれも地面に赤い予告が出るので、回避か距離で避けられる）:
##   土下座ダイブ　: 高く跳んで宙返りし、狙った場所へ土下座で着地。広い地響き。怒ると2連続
##   土下座スライド: その場で土下座し、そのまま床を滑って一直線に突っ込む。怒ると途中で1回向きを変える
##   連続土下座　　: その場で何度も素早く土下座し、外へ広がる輪の衝撃波を出す（輪の線に触れると痛い）。怒ると5連
## 土下座のあとは少しのあいだ頭を上げられず、受けるダメージが増える（反撃のチャンス）。
## 体力が半分を切ると「本気の土下座」になり、技の間隔が短く、範囲が広くなる。

enum Move { NONE, DIVE, SLIDE, BARRAGE }

const DIVE_DMG := 140.0
const SLIDE_DMG := 110.0
const RING_DMG := 80.0
const WEAK_MULT := 1.6      # 土下座のあと（頭を上げる前）に受けるダメージの倍率

var move := Move.NONE
var stage_i := 0            # 技の中の段階
var mt := 0.0               # 段階の経過時間
var move_cd := 2.5
var dives_left := 0
var bows_left := 0
var turned := false
var slid := 0.0
var from_pos := Vector3.ZERO
var to_pos := Vector3.ZERO
var slide_dir := Vector3.FORWARD
var slide_hit := false
var vulnerable := false
var marker: MeshInstance3D
var marker_mat: ShaderMaterial
var aura: OmniLight3D

const MARKER_SHADER := """
shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled;
uniform float t = 0.0;        // 0 → 1（技が出るまで）
uniform int shape = 0;        // 0 = 円、1 = 長方形（スライドの通り道）
void fragment() {
	vec2 p = (UV - 0.5) * 2.0;
	float edge;
	float fill;
	if (shape == 0) {
		float r = length(p);
		edge = smoothstep(0.08, 0.0, abs(r - 0.96));
		fill = step(r, t) * step(r, 1.0) * 0.35;
	} else {
		vec2 a = abs(p);
		edge = smoothstep(0.1, 0.0, abs(a.x - 0.9)) * step(a.y, 1.0) + smoothstep(0.03, 0.0, abs(a.y - 0.98)) * step(a.x, 0.9);
		fill = step(1.0 - t * 2.0, -p.y) * step(a.x, 0.9) * 0.35;
	}
	float pulse = 0.65 + 0.35 * sin(TIME * 22.0);
	ALBEDO = vec3(1.0, 0.08, 0.04) * (edge * 1.6 + fill) * pulse;
}
"""


func _ready() -> void:
	super._ready()
	aura = OmniLight3D.new()
	aura.light_color = Color(1.0, 0.2, 0.08)
	aura.light_energy = 0.0
	aura.omni_range = 7.0
	aura.position = Vector3(0, 1.2, 0)
	add_child(aura)
	if name_label:
		name_label.modulate = Color(1.0, 0.35, 0.25)


# ---------------------------------------------------------------- 更新

func update(delta: float, player: Node3D) -> void:
	if not enraged and hp > 0.0 and hp < cfg.hp * 0.5:
		enraged = true
		body.scale *= 1.08
		aura.light_energy = 2.5
		move_cd = 0.3
		game.boss_enraged(self)
	if enraged:
		aura.light_energy = 2.0 + sin(Time.get_ticks_msec() * 0.008) * 0.8
	if move != Move.NONE:
		if hp <= 0.0 or state in [State.AIR, State.DIZZY, State.GONE]:
			_end_move()
		else:
			_update_move(delta, player)
			body.rotation.y = lerp_angle(body.rotation.y, facing, 1.0 - exp(-delta * 14.0))
			return
	if state == State.CHASE and hp > 0.0:
		move_cd -= delta
		if move_cd <= 0.0:
			_choose_move(player)
			return
	super.update(delta, player)


func _choose_move(player: Node3D) -> void:
	var d := player.global_position - global_position
	d.y = 0.0
	var dist := d.length()
	var r := randf()
	if dist > 7.0:
		_start_move(Move.DIVE if r < 0.55 else Move.SLIDE, player)
	else:
		_start_move(Move.BARRAGE if r < 0.45 else (Move.DIVE if r < 0.75 else Move.SLIDE), player)


func _start_move(m: Move, player: Node3D) -> void:
	_release_token()
	move = m
	stage_i = 0
	mt = 0.0
	velocity = Vector3.ZERO
	retarget_paused = true
	match m:
		Move.DIVE:
			dives_left = 2 if enraged else 1
			_aim_dive(player)
		Move.SLIDE:
			turned = false
			_aim_slide(player)
		Move.BARRAGE:
			bows_left = 5 if enraged else 3
			_set_pose(0.5)


func _end_move() -> void:
	move = Move.NONE
	vulnerable = false
	retarget_paused = false
	body.rotation.x = 0.0
	position.y = 0.0
	if look_anim:
		look_anim.stop()
	_clear_marker()
	move_cd = (1.3 if enraged else 2.3) + randf() * 0.6
	state = State.CHASE
	state_t = 0.0


## 土下座の進み具合（0 = 立つ、0.5 = 正座、1 = 額が床）
func _set_pose(p: float) -> void:
	if not look_anim:
		return
	if look_anim.current_animation != "Dogeza":
		look_anim.play("Dogeza")
	look_anim.speed_scale = 0.0
	look_anim.seek(look_anim.current_animation_length * clampf(p, 0.0, 1.0), true)


func _face(p: Vector3) -> void:
	var d := p - global_position
	d.y = 0.0
	if d.length() > 0.05:
		facing = atan2(d.x, d.z)


func _clamp_arena(p: Vector3) -> Vector3:
	var st: Node3D = game.stage
	p.x = clampf(p.x, -st.half_width + 1.2, st.half_width - 1.2)
	p.z = clampf(p.z, st.end_z + 1.2, st.start_z - 1.2)
	return p


# ---------------------------------------------------------------- 技

func _aim_dive(player: Node3D) -> void:
	from_pos = global_position
	to_pos = _clamp_arena(player.global_position + Vector3(player.velocity.x, 0, player.velocity.z) * 0.35)
	_face(to_pos)
	_make_marker(0, Vector2(_dive_radius() * 2.0, _dive_radius() * 2.0), to_pos, 0.0)
	stage_i = 0
	mt = 0.0


func _dive_radius() -> float:
	return 7.0 if enraged else 5.5


func _aim_slide(player: Node3D) -> void:
	_face(player.global_position)
	slide_dir = Vector3(sin(facing), 0.0, cos(facing))
	var length := 16.0
	_make_marker(1, Vector2(2.8, length), global_position + slide_dir * length * 0.5, facing)
	slid = 0.0
	slide_hit = false
	stage_i = 0
	mt = 0.0


func _update_move(delta: float, player: Node3D) -> void:
	mt += delta
	match move:
		Move.DIVE:
			_update_dive(delta, player)
		Move.SLIDE:
			_update_slide(delta, player)
		Move.BARRAGE:
			_update_barrage(delta, player)


func _update_dive(_delta: float, player: Node3D) -> void:
	var tele := 0.55 if enraged else 0.7
	var fly := 0.7
	match stage_i:
		0:   # 予告: 赤い円が満ちていく。いーさんは正座して力をためる
			_set_pose(lerpf(0.0, 0.5, minf(mt / 0.25, 1.0)))
			if marker_mat:
				marker_mat.set_shader_parameter("t", mt / tele)
			if mt >= tele:
				stage_i = 1
				mt = 0.0
		1:   # 跳んで宙返りし、土下座の形で落ちてくる
			var u := minf(mt / fly, 1.0)
			var p := from_pos.lerp(to_pos, u)
			p.y = 7.0 * 4.0 * u * (1.0 - u)
			position = p
			body.rotation.x = u * TAU
			_set_pose(lerpf(0.5, 1.0, u))
			if u >= 1.0:
				position = to_pos
				body.rotation.x = 0.0
				_clear_marker()
				game.dogeza_impact(to_pos, _dive_radius(), DIVE_DMG * (1.15 if enraged else 1.0))
				vulnerable = true
				stage_i = 2
				mt = 0.0
		2:   # 着地のまま頭を上げられない（反撃のチャンス）
			if mt >= (0.55 if dives_left > 1 else 0.9):
				vulnerable = false
				dives_left -= 1
				if dives_left > 0:
					_aim_dive(player)
				else:
					stage_i = 3
					mt = 0.0
		3:   # 起き上がる
			_set_pose(lerpf(1.0, 0.0, minf(mt / 0.4, 1.0)))
			if mt >= 0.4:
				_end_move()


func _update_slide(delta: float, player: Node3D) -> void:
	var tele := 0.5 if enraged else 0.65
	var length := 16.0
	var speed := 21.0 if enraged else 17.0
	match stage_i:
		0:   # 予告: 通り道が赤く光る。その場で土下座の姿勢に入る
			_set_pose(minf(mt / tele, 1.0))
			if marker_mat:
				marker_mat.set_shader_parameter("t", mt / tele)
			if mt >= tele:
				stage_i = 1
				mt = 0.0
				_clear_marker()
		1:   # 土下座のまま床を滑って突っ込む
			_set_pose(1.0)
			var step := slide_dir * speed * delta
			var np := _clamp_arena(position + step)
			var moved := (np - position).length()
			position = np
			slid += moved
			if fmod(slid, 2.0) < moved:
				game.landing_dust(global_position)
			var to_p := player.global_position - global_position
			to_p.y = 0.0
			if not slide_hit and to_p.length() < 1.7:
				slide_hit = true
				game.damage_player(SLIDE_DMG, global_position - slide_dir * 2.0)
			# 怒っているときは、半分滑ったところで一度だけそば屋の方へ向き直る
			if enraged and not turned and slid > length * 0.5:
				turned = true
				_face(player.global_position)
				slide_dir = Vector3(sin(facing), 0.0, cos(facing))
				slid = length * 0.45
			if slid >= length or moved < speed * delta * 0.3:
				game.dogeza_impact(global_position + slide_dir * 0.8, 3.0, SLIDE_DMG * 0.5)
				vulnerable = true
				stage_i = 2
				mt = 0.0
		2:
			if mt >= 0.7:
				vulnerable = false
				stage_i = 3
				mt = 0.0
		3:
			_set_pose(lerpf(1.0, 0.0, minf(mt / 0.4, 1.0)))
			if mt >= 0.4:
				_end_move()


func _update_barrage(_delta: float, player: Node3D) -> void:
	# 正座 → 額を床へ（0.16秒）→ 輪の衝撃波 → 正座へ戻る（0.3秒）を繰り返す。輪は回を重ねるほど大きい
	var down := 0.16
	var up := 0.3 if not enraged else 0.22
	_face(player.global_position)
	match stage_i:
		0:
			_set_pose(lerpf(0.5, 1.0, minf(mt / down, 1.0)))
			if mt >= down:
				var k := (5 if enraged else 3) - bows_left
				game.dogeza_ring(global_position, 3.2 + k * 2.1, RING_DMG)
				stage_i = 1
				mt = 0.0
		1:
			_set_pose(lerpf(1.0, 0.5, minf(mt / up, 1.0)))
			if mt >= up:
				bows_left -= 1
				stage_i = 0 if bows_left > 0 else 2
				mt = 0.0
		2:
			vulnerable = true
			_set_pose(lerpf(0.5, 0.0, minf(mt / 0.35, 1.0)))
			if mt >= 0.35:
				_end_move()


# ---------------------------------------------------------------- 予告の表示

func _make_marker(shape: int, size: Vector2, pos: Vector3, yaw: float) -> void:
	_clear_marker()
	var pm := PlaneMesh.new()
	pm.size = size
	marker_mat = ShaderMaterial.new()
	var sh := Shader.new()
	sh.code = MARKER_SHADER
	marker_mat.shader = sh
	marker_mat.set_shader_parameter("shape", shape)
	pm.material = marker_mat
	marker = MeshInstance3D.new()
	marker.mesh = pm
	marker.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	game.add_child(marker)
	marker.global_position = Vector3(pos.x, 0.06, pos.z)
	marker.rotation.y = yaw


func _clear_marker() -> void:
	if marker and is_instance_valid(marker):
		marker.queue_free()
	marker = null
	marker_mat = null


# ---------------------------------------------------------------- 被弾

func take_hit(dmg: float, push_dir: Vector3, push: float, launch: float) -> void:
	if vulnerable:
		dmg *= WEAK_MULT
	if move != Move.NONE and hp - dmg > 0.0:
		# 技の最中は、ひるまずに受けるだけ（スーパーアーマー）
		hp -= dmg
		return
	if move != Move.NONE:
		_end_move()
	super.take_hit(dmg, push_dir, push, launch)


func _exit_tree() -> void:
	_clear_marker()
