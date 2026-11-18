extends SkeletonModifier3D
## 攻撃中の全身の動き（そば屋）。共用モデルの攻撃モーションは腕だけが動き、脚が伸びきった「棒立ち」なので、
## アニメーションの上から次を足す:
##   - 踏み込み: 前足を前へ、後ろ足を後ろへ開き、腰を落とす（足は床に付けたまま、膝を曲げて合わせる＝2本の骨の IK）
##   - ひねり: 振りかぶりで胴を後ろへひねり、打点で前へ振り抜く（腰→胸→首の順に大きく）
##   - 前傾: 打点で胴を前へ倒す
## 動きの量は攻撃ごとの pose（player.gd の COMBO / CHARGE の "pose"）と、攻撃の進み具合 progress（0〜1）で決まる。
## 軸はすべてスケルトンの空間で、そば屋の正面（+Z）・上（+Y）・右（-X）を使う。

var progress := 0.0
var hit := 0.5             # 打点（progress に対する割合）
var pose: Dictionary = {}  # step / drop / twist / lean / wide（それぞれ最大値）
var weight := 0.0          # 0 = 補正なし（移動中）、1 = 全部かける。player.gd がなめらかに上げ下げする

var _ids := {}
var _leg_len := {}


func _ready() -> void:
	var sk := get_skeleton()
	for n in ["Hips", "Spine", "Spine1", "Spine2", "Neck", "LeftUpLeg", "LeftLeg", "LeftFoot", "RightUpLeg", "RightLeg", "RightFoot", "RightArm", "RightForeArm", "RightHand"]:
		_ids[n] = sk.find_bone(n)
	for side in ["Left", "Right"]:
		var up: Vector3 = sk.get_bone_global_rest(_ids[side + "UpLeg"]).origin
		var knee: Vector3 = sk.get_bone_global_rest(_ids[side + "Leg"]).origin
		var foot: Vector3 = sk.get_bone_global_rest(_ids[side + "Foot"]).origin
		_leg_len[side] = [up.distance_to(knee), knee.distance_to(foot)]
	var sh: Vector3 = sk.get_bone_global_rest(_ids["RightArm"]).origin
	var el: Vector3 = sk.get_bone_global_rest(_ids["RightForeArm"]).origin
	var wr: Vector3 = sk.get_bone_global_rest(_ids["RightHand"]).origin
	_leg_len["RightArm"] = [sh.distance_to(el), el.distance_to(wr)]


## 振りかぶり（打点の手前）→打点→戻りの、3つの山の形を返す
## wind: 振りかぶりで 1 になり打点で 0 / strike: 打点で 1、終わりに 0 / hold: 振りかぶりから戻りまでずっと（腰の落とし・足の開き）
func _curves() -> Dictionary:
	var p := clampf(progress, 0.0, 1.0)
	var h := clampf(hit, 0.05, 0.95)
	var wind := 0.0
	var strike := 0.0
	if p < h:
		var u := p / h
		wind = sin(u * PI) * (1.0 - u * 0.3)             # 早めに溜め、打点の直前に解く
		strike = smoothstep(0.65, 1.0, u)
	else:
		var u := (p - h) / (1.0 - h)
		strike = 1.0 - smoothstep(0.25, 1.0, u)          # 打点のあとしばらく残してから戻る
	var hold := smoothstep(0.0, h * 0.6, p) * (1.0 - smoothstep(h + (1.0 - h) * 0.35, 1.0, p))
	return {"wind": wind, "strike": strike, "hold": hold}


func _rotate_global(sk: Skeleton3D, bone: int, rot: Basis) -> void:
	# スケルトン空間の回転 rot を、骨の付け根を中心にかける
	var g := sk.get_bone_global_pose(bone)
	var ng := Transform3D(rot * g.basis, g.origin)
	_set_global(sk, bone, ng)


func _set_global(sk: Skeleton3D, bone: int, ng: Transform3D) -> void:
	var parent := sk.get_bone_parent(bone)
	var pg := sk.get_bone_global_pose(parent) if parent >= 0 else Transform3D.IDENTITY
	var local := pg.affine_inverse() * ng
	sk.set_bone_pose_rotation(bone, local.basis.get_rotation_quaternion())
	sk.set_bone_pose_position(bone, local.origin)


func _aim(sk: Skeleton3D, bone: int, child_pos: Vector3, target: Vector3) -> void:
	# 骨を、子の骨（膝・足首）が target に来るよう、付け根を中心に回す
	var g := sk.get_bone_global_pose(bone)
	var a := (child_pos - g.origin).normalized()
	var b := (target - g.origin).normalized()
	if a.dot(b) > 0.99999:
		return
	var axis := a.cross(b).normalized()
	_rotate_global(sk, bone, Basis(axis, a.angle_to(b)))


func _process_modification() -> void:
	if weight <= 0.001 or pose.is_empty():
		return
	var sk := get_skeleton()
	var cv := _curves()
	var c_wind: float = cv.wind
	var c_strike: float = cv.strike
	var c_hold: float = cv.hold
	var w := weight
	var fwd := Vector3(0, 0, 1)
	var up := Vector3(0, 1, 0)
	var right := Vector3(-1, 0, 0)
	var step: float = pose.get("step", 0.3) * w
	var drop: float = pose.get("drop", 0.12) * w
	var twist: float = pose.get("twist", 0.5) * w
	var lean: float = pose.get("lean", 0.25) * w
	var wide: float = pose.get("wide", 0.12) * w

	# 足の今の位置と向き（アニメーションのまま）を覚えておき、腰を動かしたあとにこの位置へ戻す
	var feet := {}
	for side in ["Left", "Right"]:
		feet[side] = sk.get_bone_global_pose(_ids[side + "Foot"])

	# 腰: 落とす・少し前へ・ひねる（振りかぶりで右へ、打点で左へ）
	var hips: int = _ids["Hips"]
	var hg := sk.get_bone_global_pose(hips)
	var yaw: float = -twist * c_wind * 0.3 + twist * c_strike * 0.45
	hg.origin += -up * drop * maxf(c_hold, c_strike) + fwd * step * 0.35 * c_strike
	hg.basis = Basis(up, yaw) * hg.basis
	_set_global(sk, hips, hg)
	# 胴: ひねりを背骨3本に分けて足し、前へ倒す（振りかぶりでは少し反る）
	var spine_yaw: float = -twist * c_wind * 0.45 + twist * c_strike * 0.9
	var spine_pitch: float = lean * 1.3 * c_strike - lean * 0.25 * c_wind
	for n in ["Spine", "Spine1", "Spine2"]:
		# 前へ倒す回転は +X 軸まわり（+Y が +Z＝正面へ倒れる向き）
		_rotate_global(sk, _ids[n], Basis(up, spine_yaw / 3.0) * Basis(-right, spine_pitch / 3.0))
	# 頭は前を向いたままに近づける（ひねりの半分を戻す）
	_rotate_global(sk, _ids["Neck"], Basis(up, -spine_yaw * 0.45) * Basis(-right, -spine_pitch * 0.35))   # 顔は前（敵）を見たまま

	# 足: 左足（前）を前へ・外へ、右足（後ろ）を後ろへ・外へ。足の裏は床に付けたまま
	for side in ["Left", "Right"]:
		var sgn := 1.0 if side == "Left" else -1.0
		var ft: Transform3D = feet[side]
		var target := ft.origin
		var k: float = maxf(c_hold, c_strike)
		target += fwd * step * sgn * (0.6 + 0.4 * c_strike) * k
		target += -right * wide * sgn * k     # 左足は左（+X）へ、右足は右へ
		target.y = ft.origin.y
		var pole := (fwd + -right * sgn * 0.25).normalized()
		_two_bone(sk, _ids[side + "UpLeg"], _ids[side + "Leg"], _ids[side + "Foot"], _leg_len[side], target, pole)
		var foot_id: int = _ids[side + "Foot"]
		# 足首はアニメーションの向きのまま（床に平ら）
		var fg := sk.get_bone_global_pose(foot_id)
		_set_global(sk, foot_id, Transform3D(Basis(up, yaw * 0.5) * ft.basis, fg.origin))

	if pose.get("slam", false):
		_slam_arm(sk, w, fwd, up, right)


## 叩きつけ: 右腕でジョッキを頭の上まで振り上げ、打点で体の前の地面へ振り下ろす（腕は2本の骨の IK）
func _slam_arm(sk: Skeleton3D, w: float, fwd: Vector3, up: Vector3, right: Vector3) -> void:
	var p := clampf(progress, 0.0, 1.0)
	var h := clampf(hit, 0.05, 0.95)
	var arm_id: int = _ids["RightArm"]
	var fore_id: int = _ids["RightForeArm"]
	var hand_id: int = _ids["RightHand"]
	var shoulder := sk.get_bone_global_pose(arm_id).origin
	var anim_hand := sk.get_bone_global_pose(hand_id).origin
	var hips := sk.get_bone_global_pose(_ids["Hips"]).origin
	var floor_y := minf(sk.get_bone_global_pose(_ids["LeftFoot"]).origin.y, sk.get_bone_global_pose(_ids["RightFoot"]).origin.y)
	# 振り上げ（頭の上、少し後ろ）と、叩きつける地面（体の正面・右寄り）
	var overhead := shoulder + up * 0.62 - fwd * 0.12 - right * 0.12
	var ground := Vector3(hips.x, floor_y + float(pose.get("hand_h", 0.2)), hips.z) + fwd * 0.75 + right * 0.1
	var raise := smoothstep(0.0, h * 0.7, p)
	var slam := smoothstep(h * 0.72, h, p)
	var target := anim_hand.lerp(overhead, raise).lerp(ground, slam)
	var arm_w := w * (1.0 - smoothstep(h + (1.0 - h) * 0.5, 1.0, p))
	target = anim_hand.lerp(target, arm_w)
	# 肘: 振り上げでは外・前へ、叩きつけでは外・上へ
	var pole := (right * 1.0 + fwd * 0.4 * (1.0 - slam) + up * 0.6 * slam - fwd * 0.3 * slam).normalized()
	_two_bone(sk, arm_id, fore_id, hand_id, _leg_len["RightArm"], target, pole)
	# 手首: 打点でジョッキの底を地面へ向ける
	var pitch: float = float(pose.get("hand_pitch", 0.9)) * slam * arm_w - 0.6 * raise * (1.0 - slam) * arm_w
	_rotate_global(sk, hand_id, Basis(-right, pitch))


## 2本の骨（太もも＋すね／上腕＋前腕）を、先端が target に来るよう曲げる。pole は膝・肘を出す向き
func _two_bone(sk: Skeleton3D, upper: int, lower: int, tip: int, lens: Array, target: Vector3, pole_dir: Vector3) -> void:
	var base := sk.get_bone_global_pose(upper).origin
	var to_t := target - base
	var a: float = lens[0]
	var b: float = lens[1]
	var dist := clampf(to_t.length(), 0.05, (a + b) * 0.999)
	var dir := to_t.normalized()
	var pole := (pole_dir - dir * pole_dir.dot(dir)).normalized()
	var cos_h := clampf((a * a + dist * dist - b * b) / (2.0 * a * dist), -1.0, 1.0)
	var mid_target := base + dir * a * cos_h + pole * a * sqrt(maxf(0.0, 1.0 - cos_h * cos_h))
	_aim(sk, upper, sk.get_bone_global_pose(lower).origin, mid_target)
	_aim(sk, lower, sk.get_bone_global_pose(tip).origin, base + dir * dist)
