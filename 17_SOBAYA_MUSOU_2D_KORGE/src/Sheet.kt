import korlibs.image.bitmap.*
import korlibs.image.format.*
import korlibs.io.file.std.*
import korlibs.math.geom.*
import kotlin.math.floor
import kotlin.math.min

/**
 * 04_GAME_ASSETS/models3d/sprites/sheets/ のスプライトシート（resources/sheets からsymlink）。
 * 採用3Dモデルのアニメーションを横向き（右向き）に描いたもの。作り方は 04_GAME_ASSETS/models3d/README.md。
 */
class Anim(val name: String, val frames: List<BmpSlice>, val length: Double, val loop: Boolean)

class Sheet(val name: String, val anims: Map<String, Anim>, val pivotX: Double, val pivotY: Double) {
    fun anim(name: String) = anims[name] ?: error("$this: アニメーション $name がありません")

    /** ループするアニメは経過秒、1回きりのアニメは進み具合（0..1）でコマを選ぶ */
    fun frameAt(name: String, seconds: Double, speed: Double = 1.0): BmpSlice {
        val a = anim(name)
        val p = seconds * speed / a.length
        val i = if (a.loop) floor(p * a.frames.size).toInt().mod(a.frames.size) else min(a.frames.size - 1, floor(p * a.frames.size).toInt().coerceAtLeast(0))
        return a.frames[i]
    }

    fun frameAtProgress(name: String, progress: Double): BmpSlice {
        val a = anim(name)
        return a.frames[min(a.frames.size - 1, floor(progress * a.frames.size).toInt().coerceAtLeast(0))]
    }

    override fun toString() = "Sheet($name)"

    companion object {
        suspend fun load(name: String): Sheet {
            val bmp = resourcesVfs["sheets/$name.png"].readBitmap().mipmaps(true)
            var cellW = 0; var cellH = 0; var px = 0.0; var py = 0.0
            val anims = linkedMapOf<String, Anim>()
            var row = 0
            for (line in resourcesVfs["sheets/$name.txt"].readString().lines()) {
                val f = line.trim().split(" ")
                when (f[0]) {
                    "cell" -> { cellW = f[1].toInt(); cellH = f[2].toInt() }
                    "pivot" -> { px = f[1].toDouble(); py = f[2].toDouble() }
                    "anim" -> {
                        val count = f[2].toInt()
                        val frames = (0 until count).map { i -> bmp.slice(RectangleInt(i * cellW, row * cellH, cellW, cellH)) }
                        anims[f[1]] = Anim(f[1], frames, f[3].toDouble(), f[4] == "loop")
                        row++
                    }
                }
            }
            return Sheet(name, anims, px, py)
        }
    }
}
