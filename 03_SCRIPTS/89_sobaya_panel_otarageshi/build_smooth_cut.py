#!/usr/bin/env python3
"""final_draft.mp4 の継ぎ目（静止・ポップ・音の段差・AAC結合ノイズ）を潰した版を作る。

チャプターを別々に生成する以上、継ぎ目には必ず次の4つが出る。実測してから順に潰す:

  1. 映像が止まる    H3は終了キーフレームに吸い付いて減速するので、各チャプター末尾に
                     動きの無いフレームが溜まる（実測: 全788f中84f＝3.5秒。ch6は27f＝1.12秒）。
                     → 実測した死にフレームを落とす。ch6だけは「顔が完成した見せ場」なので
                       8フレームの静止を意図的に残す。ch8末尾は作品のラストなので残す。
  2. 絵がポップする  終了フレーム拘束が開始フレームより緩く、共有ジョインで16-19dB相当の
                     段差が出る（クリップ内の隣接フレームは42-50dB）。
                     → SHARED joinだけ5フレームのディゾルブで吸収する。
                       CUT joinは台本上の意図的なアングル切り替えなのでハードカットのまま。
  3. 音量が飛ぶ      チャプター毎に音が独立生成されるため実測で29dBの段差
                     （ch6 -15.5dBFS / ch8 -44.6dBFS）。
                     → 「静かな境内→火が育つ→顔の見せ場→鎮まる」の抑揚は残したまま、
                       段差だけを潰す目標カーブへ各チャプターをゲイン調整する。
  4. 音がプツプツ切れる  -c copyで別々にエンコードされたAACを8本繋ぐと、各継ぎ目で
                     タイムスタンプが重なる（ffmpegが7箇所で警告を出す）。
                     → 全部デコードして1本に焼き直す。SHAREDは等電力クロスフェード、
                       CUTは20msフェードでクリックだけ消す。
"""
import subprocess

FPS = 24
D = 5                      # dissolve length in frames (SHARED joins only)
FADE = 0.020               # click-killer at hard cuts
MASTER_GAIN = 8.0          # 配信レベルまで一括で持ち上げる（リミッターで-1.5dBFSに抑える）
# (chapter, head_trim, tail_trim) — trims come from the measured motion profile
SEG = [(1, 0, 0), (2, 0, 16), (3, 8, 16), (4, 0, 0),
       (5, 0, 9), (6, 0, 19), (7, 0, 0), (8, 0, 0)]
SRC_LEN = {1: 124, 2: 90, 3: 124, 4: 90, 5: 90, 6: 90, 7: 90, 8: 90}
GROUPS = [[1, 2, 3], [4], [5, 6, 7], [8]]   # split at the CUT joins
MEASURED_RMS = {1: -43.7, 2: -39.4, 3: -42.6, 4: -43.9,
                5: -27.0, 6: -15.5, 7: -38.1, 8: -44.6}   # dBFS, measured
# target curve: keep the dramatic arc, drop the 29 dB steps to ~10 dB
TARGET_RMS = {1: -34, 2: -33, 3: -32, 4: -29, 5: -26, 6: -24, 7: -28, 8: -32}

def s(f):
    return f"{f / FPS:.6f}"

trim = {c: (h, SRC_LEN[c] - t) for c, h, t in SEG}
length = {c: e - b for c, (b, e) in trim.items()}

vf, af, inputs = [], [], []
for idx, c in enumerate(sorted(trim)):
    b, e = trim[c]
    gain = TARGET_RMS[c] - MEASURED_RMS[c]
    inputs += ["-i", f"ch{c}.mp4"]
    vf.append(f"[{idx}:v]trim=start_frame={b}:end_frame={e},setpts=PTS-STARTPTS,fps={FPS}[v{c}]")
    af.append(f"[{idx}:a]atrim=start={s(b)}:end={s(e)},asetpts=N/SR/TB,"
              f"volume={gain:+.1f}dB[a{c}]")

glabels_v, glabels_a, glen = [], [], []
for g, chs in enumerate(GROUPS):
    cur_v, cur_a, cur_len = f"v{chs[0]}", f"a{chs[0]}", length[chs[0]]
    for c in chs[1:]:
        out_v, out_a = f"gv{g}_{c}", f"ga{g}_{c}"
        vf.append(f"[{cur_v}][v{c}]xfade=transition=fade:duration={s(D)}:"
                  f"offset={s(cur_len - D)}[{out_v}]")
        af.append(f"[{cur_a}][a{c}]acrossfade=d={s(D)}:c1=qsin:c2=qsin[{out_a}]")
        cur_v, cur_a, cur_len = out_v, out_a, cur_len + length[c] - D
    af.append(f"[{cur_a}]afade=t=in:st=0:d={FADE},"
              f"afade=t=out:st={cur_len / FPS - FADE:.6f}:d={FADE}[gaf{g}]")
    glabels_v.append(f"[{cur_v}]"); glabels_a.append(f"[gaf{g}]"); glen.append(cur_len)

n = len(GROUPS)
vf.append("".join(glabels_v) + f"concat=n={n}:v=1:a=0[vout]")
# loudnormは動的に効くので、意図した抑揚カーブまで均してしまう（実測: ch8が目標より7dB低くなった）。
# 素直に固定ゲイン＋リミッターにして、カーブはTARGET_RMSだけが決めるようにする。
af.append("".join(glabels_a) + f"concat=n={n}:v=0:a=1,"
          f"volume={MASTER_GAIN:+.1f}dB,alimiter=limit=0.84:level=disabled[aout]")

total = sum(glen)
print(f"groups (frames): {glen} -> {total}f = {total / FPS:.2f}s "
      f"(was {sum(SRC_LEN.values())}f = {sum(SRC_LEN.values()) / FPS:.2f}s)")
print("per-chapter gain: " + "  ".join(
    f"ch{c}{TARGET_RMS[c] - MEASURED_RMS[c]:+.1f}dB" for c in sorted(trim)))

subprocess.run(["ffmpeg", "-y", "-v", "error"] + inputs +
               ["-filter_complex", ";".join(vf + af),
                "-map", "[vout]", "-map", "[aout]",
                "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                "final_smooth.mp4"], check=True)
print("wrote final_smooth.mp4")
