import korlibs.image.bitmap.*
import korlibs.korge.view.*
import kotlin.math.floor
import kotlin.math.min

/**
 * 手描きのエフェクト・擬音・アイテム（04_GAME_ASSETS/musou2d の fx_light / fx_art アトラス）を出す。
 * - light: 黒背景の光の素材（当たり・衝撃波・無双のオーラ）。加算合成で描く
 * - art: マゼンタ背景の普通の絵（ビールの泡・土ぼこり・擬音・アイテム）
 * アトラスが無いときは null で、呼び出し側が図形の演出（Particles.kt）を使う。
 * 位置は素材のキャンバスの中心からのずれで持っているので、(x, y) が素材の中心になる。
 */
class FxSprites(val light: Sheet?, val art: Sheet?) {
    private class Play(val view: Image, val anim: Anim, val x: Double, val y: Double, val scale: Double, val flip: Double, val rise: Double) {
        var t = 0.0
    }

    private val plays = mutableListOf<Play>()

    /** 1回だけ再生して消える演出。rise は消えるまでに浮き上がる距離（擬音用） */
    fun play(layer: Container, sheet: Sheet, name: String, x: Double, y: Double, scale: Double, flip: Double = 1.0, add: Boolean = false, rise: Double = 0.0, alpha: Double = 1.0) {
        val a = sheet.anims[name] ?: return
        val v = layer.image(a.frames[0].slice) { smoothing = true; this.alpha = alpha; if (add) blendMode = BlendMode.ADD }
        val p = Play(v, a, x, y, scale, flip, rise)
        place(p, a.frames[0])
        plays += p
    }

    /** 擬音など1枚の絵は、この秒数だけ出して消す */
    private fun duration(a: Anim) = if (a.frames.size == 1) 0.4 else a.length

    private fun place(p: Play, f: SpriteFrame) {
        p.view.bitmap = f.slice
        p.view.scaleX = p.scale * p.flip
        p.view.scaleY = p.scale
        p.view.x = p.x + f.offX * p.scale * p.flip
        p.view.y = p.y + f.offY * p.scale - p.rise * min(1.0, p.t / duration(p.anim))
    }

    fun update(d: Double) {
        val it = plays.iterator()
        while (it.hasNext()) {
            val p = it.next()
            p.t += d
            val len = duration(p.anim)
            if (p.t >= len) { p.view.removeFromParent(); it.remove(); continue }
            val i = min(p.anim.frames.size - 1, floor(p.t / len * p.anim.frames.size).toInt())
            place(p, p.anim.frames[i])
            // 1枚の絵（擬音）は後半で薄くして消す
            if (p.anim.frames.size == 1) p.view.alpha = (2.0 - 2.0 * p.t / len).coerceIn(0.0, 1.0)
        }
    }

    fun clear() { plays.forEach { it.view.removeFromParent() }; plays.clear() }

    /** 一番最初のコマの幅（アトラスのピクセル）。衝撃波を当たり範囲の大きさに合わせるのに使う */
    fun width(sheet: Sheet, name: String) = sheet.anims[name]?.frames?.get(0)?.slice?.width?.toDouble() ?: 1.0

    /** 一番最初のコマの下端（キャンバスの中心からの距離・アトラスのピクセル）。床に置く素材の位置合わせに使う */
    fun bottom(sheet: Sheet, name: String) = sheet.anims[name]?.frames?.get(0)?.let { it.offY + it.slice.height } ?: 0.0

    /** 無双のオーラ: 01 が立ち上がり、02〜06 をループする */
    fun auraFrame(t: Double): SpriteFrame? {
        val a = light?.anims?.get("musou_aura") ?: return null
        val step = a.length / a.frames.size
        val i = if (t < step) 0 else 1 + floor((t - step) / step).toInt().mod(a.frames.size - 1)
        return a.frames[i]
    }

    companion object {
        suspend fun load(): FxSprites = FxSprites(
            try { Sheet.loadAtlas("fx_light") } catch (_: Throwable) { null },
            try { Sheet.loadAtlas("fx_art") } catch (_: Throwable) { null },
        )
    }
}
