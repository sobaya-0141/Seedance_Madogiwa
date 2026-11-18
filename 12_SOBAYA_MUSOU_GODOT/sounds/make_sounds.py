"""隠しボス戦の効果音を作る（外部素材なし。正弦波・矩形波・ノイズを足し合わせて描く）。
python3 make_sounds.py → warning.wav（WARNING の警告音・約3.6秒）, boom.wav（土下座の地響き・約1.2秒）"""
import math, random, struct, wave

RATE = 44100


def write(name, samples):
    peak = max(1e-6, max(abs(s) for s in samples))
    with wave.open(name, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s / peak * 0.9 * 32767)) for s in samples))


def warning():
    # 「ビーッ、ビーッ」: 2つの音程を交互に鳴らす警報（0.42秒鳴って0.18秒休む × 6回）
    out = []
    for k in range(6):
        f0 = 880.0 if k % 2 == 0 else 660.0
        n = int(RATE * 0.42)
        for i in range(n):
            t = i / RATE
            env = min(1.0, t / 0.01) * min(1.0, (0.42 - t) / 0.03)
            ph = 2 * math.pi * f0 * t
            sq = (1 if math.sin(ph) > 0 else -1) * 0.35 + math.sin(ph) * 0.5 + math.sin(ph * 2.0) * 0.15
            wob = 1.0 + 0.04 * math.sin(2 * math.pi * 7 * t)
            out.append(sq * env * wob)
        out += [0.0] * int(RATE * 0.18)
    return out


def boom():
    # 低い「ドーン」: 下がっていく低音と、ノイズの砕ける音
    random.seed(3)
    out = []
    n = int(RATE * 1.2)
    lp = 0.0
    for i in range(n):
        t = i / RATE
        f = 55.0 + 70.0 * math.exp(-t * 9.0)
        body = math.sin(2 * math.pi * f * t) * math.exp(-t * 3.2)
        lp += (random.uniform(-1, 1) - lp) * 0.08
        crack = lp * math.exp(-t * 7.0) * 1.6
        out.append(body + crack)
    return out


write("warning.wav", warning())
write("boom.wav", boom())
print("ok")
