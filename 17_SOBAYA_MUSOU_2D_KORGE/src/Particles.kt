import korlibs.image.color.*
import korlibs.korge.view.*
import korlibs.math.geom.*
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * 画像を使わない手応えの演出（火花・ビールの泡しぶき・土ぼこり）。
 * エフェクトの手描き素材が届くまでの代わりで、届いたら差し替える。
 */
class Particles(private val layer: Container) {
    private class P(val view: View, var vx: Double, var vy: Double, val gravity: Double, var ttl: Double, val life: Double, val spin: Double, val shrink: Boolean)

    private val list = mutableListOf<P>()
    private val rng = Random(7)

    /** 攻撃が当たった瞬間。火花が放射状に飛ぶ。大技はビールの泡も散る */
    fun hit(x: Double, y: Double, heavy: Boolean, dir: Double) {
        val n = if (heavy) 16 else 9
        repeat(n) {
            val a = rng.nextDouble(-PI * 0.55, PI * 0.55) + (if (dir < 0) PI else 0.0)
            val sp = rng.nextDouble(380.0, if (heavy) 900.0 else 650.0)
            val len = rng.nextDouble(14.0, if (heavy) 34.0 else 24.0)
            val v = layer.solidRect(len, 4.0, if (rng.nextBoolean()) Colors["#fff6c8"] else Colors["#ffb43a"]) {
                anchor(0.5, 0.5); position(x, y); rotation = a.radians; blendMode = BlendMode.ADD
            }
            list += P(v, cos(a) * sp, sin(a) * sp - 120, 900.0, 0.0, rng.nextDouble(0.16, 0.3), 0.0, true)
        }
        // 白い閃光
        val flash = layer.circle(if (heavy) 22 else 14, Colors["#fff4c0aa"]) { anchor(0.5, 0.5); position(x, y); blendMode = BlendMode.ADD }
        list += P(flash, 0.0, 0.0, 0.0, 0.0, 0.07, 0.0, false)
        if (heavy) foam(x, y - 10, 12)
    }

    /** ビールの泡としずく */
    fun foam(x: Double, y: Double, n: Int) {
        repeat(n) {
            val a = rng.nextDouble(-PI, 0.0)
            val sp = rng.nextDouble(200.0, 520.0)
            val beer = rng.nextDouble() < 0.4
            val r = rng.nextDouble(5.0, if (beer) 8.0 else 12.0)
            val v = layer.circle(r, if (beer) Colors["#f0a01e"] else Colors["#fffaf0"]) { anchor(0.5, 0.5); position(x, y) }
            list += P(v, cos(a) * sp, sin(a) * sp, 1300.0, 0.0, rng.nextDouble(0.4, 0.7), 0.0, true)
        }
    }

    /** 着地・踏み込みの土ぼこり */
    fun dust(x: Double, y: Double, n: Int = 7) {
        repeat(n) {
            val dir = if (it % 2 == 0) 1.0 else -1.0
            val v = layer.circle(rng.nextDouble(8.0, 16.0), Colors["#c9b9a2aa"]) { anchor(0.5, 0.5); position(x + dir * rng.nextDouble(0.0, 30.0), y) }
            list += P(v, dir * rng.nextDouble(60.0, 200.0), -rng.nextDouble(20.0, 90.0), 60.0, 0.0, rng.nextDouble(0.35, 0.6), 0.0, false)
        }
    }

    fun update(d: Double) {
        val it = list.iterator()
        while (it.hasNext()) {
            val p = it.next()
            p.ttl += d
            p.vy += p.gravity * d
            p.view.x += p.vx * d
            p.view.y += p.vy * d
            val k = p.ttl / p.life
            p.view.alpha = (1.0 - k).coerceIn(0.0, 1.0)
            if (p.shrink) p.view.scaleX = (1.0 - k * 0.6).coerceAtLeast(0.1) else p.view.scale(1.0 + k * 0.8)
            if (k >= 1.0) { p.view.removeFromParent(); it.remove() }
        }
    }

    fun clear() { list.forEach { it.view.removeFromParent() }; list.clear() }
}
