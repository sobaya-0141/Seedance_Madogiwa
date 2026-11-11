import korlibs.image.bitmap.*
import korlibs.image.format.*
import korlibs.io.file.std.*
import korlibs.math.geom.*
import kotlin.math.floor
import kotlin.math.min

/**
 * キャラのコマの集まり。2種類の置き場から読む（どちらも右向きで、左向きは左右反転して使う）。
 * - `Sheet.load`: 04_GAME_ASSETS/models3d/sprites/sheets/（resources/sheets）。採用3Dモデルを描いた、マス目のそろったシート。敵が使う
 * - `Sheet.loadAtlas`: 04_GAME_ASSETS/musou2d/sprites/（resources/musou2d）。手描きアニメのコマを PackSprites.java で
 *   1枚に詰めたアトラス。コマごとに大きさと足元からの位置が違う。そば屋が使う
 */
class SpriteFrame(val slice: BmpSlice, val offX: Double, val offY: Double)

/** hitFrame は当たりのコマ（0始まり。無ければ -1） */
class Anim(val name: String, val frames: List<SpriteFrame>, val length: Double, val loop: Boolean, val hitFrame: Int = -1)

class Sheet(val name: String, val anims: Map<String, Anim>) {
    fun anim(name: String) = anims[name] ?: error("$this: アニメーション $name がありません")

    /** 経過秒でコマを選ぶ（ループしないアニメは最後のコマで止まる） */
    fun frameAt(name: String, seconds: Double, speed: Double = 1.0): SpriteFrame {
        val a = anim(name)
        val p = seconds * speed / a.length
        val i = if (a.loop) floor(p * a.frames.size).toInt().mod(a.frames.size) else min(a.frames.size - 1, floor(p * a.frames.size).toInt().coerceAtLeast(0))
        return a.frames[i]
    }

    /** 進み具合（0..1）でコマを選ぶ */
    fun frameAtProgress(name: String, progress: Double): SpriteFrame {
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
                        val frames = (0 until count).map { i -> SpriteFrame(bmp.slice(RectangleInt(i * cellW, row * cellH, cellW, cellH)), -px, -py) }
                        anims[f[1]] = Anim(f[1], frames, f[3].toDouble(), f[4] == "loop")
                        row++
                    }
                }
            }
            return Sheet(name, anims)
        }

        /** PackSprites.java が書き出した <名前>.txt と <名前>_<ページ>.png を読む */
        suspend fun loadAtlas(name: String): Sheet {
            val lines = resourcesVfs["musou2d/$name.txt"].readString().lines().map { it.trim().split(" ") }.filter { it.isNotEmpty() && it[0].isNotEmpty() && !it[0].startsWith("#") }
            val pages = mutableMapOf<Int, Bitmap>()
            for (f in lines) if (f[0] == "page") pages[f[1].toInt()] = resourcesVfs["musou2d/${f[2]}"].readBitmap().mipmaps(true)
            class Info(val count: Int, val fps: Int, val mode: String, val hit: Int)
            val infos = linkedMapOf<String, Info>()
            for (f in lines) if (f[0] == "anim") infos[f[1]] = Info(f[2].toInt(), f[3].toInt(), f[4], f[5].toInt())
            val frames = mutableMapOf<String, Array<SpriteFrame?>>()
            for (f in lines) if (f[0] == "frame") {
                val (x, y, w, h) = listOf(f[4], f[5], f[6], f[7]).map { it.toInt() }
                val arr = frames.getOrPut(f[1]) { arrayOfNulls(infos.getValue(f[1]).count) }
                arr[f[2].toInt()] = SpriteFrame(pages.getValue(f[3].toInt()).slice(RectangleInt(x, y, w, h)), f[8].toDouble(), f[9].toDouble())
            }
            val anims = linkedMapOf<String, Anim>()
            for ((n, info) in infos) {
                val list = frames.getValue(n).map { it ?: error("$name/$n: コマが足りません") }
                anims[n] = Anim(n, list, info.count.toDouble() / info.fps, info.mode == "loop", info.hit - 1)
            }
            return Sheet(name, anims)
        }
    }
}
