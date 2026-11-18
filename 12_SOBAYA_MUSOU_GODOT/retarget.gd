extends RefCounted
## マネキン素体（CC0・Quaternius 系の骨名）の動きを、Tripo で作ったモデル（Mixamo 形式の骨名）へ毎フレーム写す。
##
## マネキンは T ポーズ、Tripo のモデルは腕を下ろした姿勢で、骨の向きも違う。そこで起動時に
##   1. Tripo の各骨を、マネキンの休止姿勢と同じ向き（骨の伸びる方向）にそろえる回転 R を求め、
## 毎フレーム
##   2. マネキンの骨が休止姿勢からどれだけ回ったか（世界向きの差分 delta）を取り、
##   3. Tripo の骨の世界向き = delta × R × 休止姿勢、として親から順にローカル回転へ直して入れる。
## 腰（Hips）だけは位置も写す（身長の比で縮める）。指は写さない（休止姿勢のまま）。

const PAIRS := [  # マネキン → Tripo（親から順）
	["pelvis", "mixamorig_Hips"],
	["spine_01", "mixamorig_Spine"], ["spine_02", "mixamorig_Spine1"], ["spine_03", "mixamorig_Spine2"],
	["neck_01", "mixamorig_Neck"], ["head", "mixamorig_Head"],
	["clavicle_l", "mixamorig_LeftShoulder"], ["upperarm_l", "mixamorig_LeftArm"], ["lowerarm_l", "mixamorig_LeftForeArm"], ["hand_l", "mixamorig_LeftHand"],
	["clavicle_r", "mixamorig_RightShoulder"], ["upperarm_r", "mixamorig_RightArm"], ["lowerarm_r", "mixamorig_RightForeArm"], ["hand_r", "mixamorig_RightHand"],
	["thigh_l", "mixamorig_LeftUpLeg"], ["calf_l", "mixamorig_LeftLeg"], ["foot_l", "mixamorig_LeftFoot"], ["ball_l", "mixamorig_LeftToeBase"],
	["thigh_r", "mixamorig_RightUpLeg"], ["calf_r", "mixamorig_RightLeg"], ["foot_r", "mixamorig_RightFoot"], ["ball_r", "mixamorig_RightToeBase"],
]
# 骨の伸びる方向を決める「先の骨」（休止姿勢の向きをそろえるのに使う）
const TIP := {
	"pelvis": "spine_01", "spine_01": "spine_02", "spine_02": "spine_03", "spine_03": "neck_01", "neck_01": "head", "head": "head_leaf",
	"clavicle_l": "upperarm_l", "upperarm_l": "lowerarm_l", "lowerarm_l": "hand_l", "hand_l": "middle_01_l",
	"clavicle_r": "upperarm_r", "upperarm_r": "lowerarm_r", "lowerarm_r": "hand_r", "hand_r": "middle_01_r",
	"thigh_l": "calf_l", "calf_l": "foot_l", "foot_l": "ball_l", "ball_l": "ball_leaf_l",
	"thigh_r": "calf_r", "calf_r": "foot_r", "foot_r": "ball_r", "ball_r": "ball_leaf_r",
	"mixamorig_Hips": "mixamorig_Spine", "mixamorig_Spine": "mixamorig_Spine1", "mixamorig_Spine1": "mixamorig_Spine2",
	"mixamorig_Spine2": "mixamorig_Neck", "mixamorig_Neck": "mixamorig_Head", "mixamorig_Head": "mixamorig_HeadTop_End",
	"mixamorig_LeftShoulder": "mixamorig_LeftArm", "mixamorig_LeftArm": "mixamorig_LeftForeArm", "mixamorig_LeftForeArm": "mixamorig_LeftHand", "mixamorig_LeftHand": "mixamorig_LeftHandMiddle1",
	"mixamorig_RightShoulder": "mixamorig_RightArm", "mixamorig_RightArm": "mixamorig_RightForeArm", "mixamorig_RightForeArm": "mixamorig_RightHand", "mixamorig_RightHand": "mixamorig_RightHandMiddle1",
	"mixamorig_LeftUpLeg": "mixamorig_LeftLeg", "mixamorig_LeftLeg": "mixamorig_LeftFoot", "mixamorig_LeftFoot": "mixamorig_LeftToeBase", "mixamorig_LeftToeBase": "mixamorig_LeftToe_End",
	"mixamorig_RightUpLeg": "mixamorig_RightLeg", "mixamorig_RightLeg": "mixamorig_RightFoot", "mixamorig_RightFoot": "mixamorig_RightToeBase", "mixamorig_RightToeBase": "mixamorig_RightToe_End",
}

var src: Skeleton3D
var dst: Skeleton3D
var si: PackedInt32Array = []
var di: PackedInt32Array = []
var dparent: PackedInt32Array = []      # dst の親が PAIRS の何番目か（-1 = 対応なし）
var src_rest_inv: Array[Quaternion] = []
var dst_aligned: Array[Quaternion] = []
var hip_ratio := 1.0
var src_hip_rest := Vector3.ZERO
var dst_hip_rest := Vector3.ZERO


func _init(p_src: Skeleton3D, p_dst: Skeleton3D) -> void:
	src = p_src
	dst = p_dst
	var dmap := {}
	for k in PAIRS.size():
		var s := src.find_bone(PAIRS[k][0])
		var d := dst.find_bone(PAIRS[k][1])
		assert(s >= 0 and d >= 0, "retarget: bone not found %s / %s" % PAIRS[k])
		si.append(s)
		di.append(d)
		dmap[d] = k
		var sr := src.get_bone_global_rest(s)
		var dr := dst.get_bone_global_rest(d)
		src_rest_inv.append(sr.basis.orthonormalized().get_rotation_quaternion().inverse())
		var ds := _dir(src, PAIRS[k][0])
		var dd := _dir(dst, PAIRS[k][1])
		var align := Quaternion(dd, ds) if dd.dot(ds) > -0.999 else Quaternion(Vector3.UP, PI)
		dst_aligned.append(align * dr.basis.orthonormalized().get_rotation_quaternion())
	for k in PAIRS.size():
		var p := dst.get_bone_parent(di[k])
		dparent.append(dmap.get(p, -1))
	src_hip_rest = src.get_bone_global_rest(si[0]).origin
	dst_hip_rest = dst.get_bone_global_rest(di[0]).origin
	hip_ratio = dst_hip_rest.y / maxf(src_hip_rest.y, 0.01)


func _dir(sk: Skeleton3D, bone: String) -> Vector3:
	var a := sk.get_bone_global_rest(sk.find_bone(bone)).origin
	var t := sk.find_bone(TIP.get(bone, ""))
	if t < 0:
		return Vector3.UP
	var v := sk.get_bone_global_rest(t).origin - a
	return v.normalized() if v.length() > 1e-5 else Vector3.UP


## 毎フレーム呼ぶ
func apply() -> void:
	var g: Array[Quaternion] = []
	g.resize(PAIRS.size())
	for k in PAIRS.size():
		var sp := src.get_bone_global_pose(si[k]).basis.orthonormalized().get_rotation_quaternion()
		var target := (sp * src_rest_inv[k]) * dst_aligned[k]
		g[k] = target
		var parent_g: Quaternion
		var pk := dparent[k]
		if pk >= 0:
			parent_g = g[pk]
		else:
			var p := dst.get_bone_parent(di[k])
			parent_g = dst.get_bone_global_pose(p).basis.get_rotation_quaternion() if p >= 0 else Quaternion.IDENTITY
		dst.set_bone_pose_rotation(di[k], (parent_g.inverse() * target).normalized())
	# 腰の位置（ジャンプ・吹っ飛び・倒れ込み）
	var sh := src.get_bone_global_pose(si[0]).origin
	var p0 := dst.get_bone_parent(di[0])
	var off := (sh - src_hip_rest) * hip_ratio
	var local := dst_hip_rest + off
	if p0 >= 0:
		local = dst.get_bone_global_pose(p0).affine_inverse() * local
	dst.set_bone_pose_position(di[0], local)
