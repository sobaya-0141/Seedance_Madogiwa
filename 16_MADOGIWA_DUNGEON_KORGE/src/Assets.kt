import korlibs.image.bitmap.*
import korlibs.image.color.*
import korlibs.image.font.*
import korlibs.image.format.*
import korlibs.io.file.std.*
import kotlin.math.abs

/**
 * キャラの立ち絵は resources/chars/<id> からsymlinkで参照している（コピーしない）。
 * - 採用3Dモデル（04_GAME_ASSETS/models3d/sprites/）のレンダー: 透過PNGなのでそのまま縮小する
 * - とーくん・よーたんは採用3Dモデルが無いので、ボクセルの4方向レンダー（背景が単色グレー）を
 *   外周から塗りつぶして透過し、余白を切り詰めて使う
 * 仮面・ジョッキ・ウクレレなどNG変更要素は元画像のまま使うので崩れない。
 */
class Assets(val font: TtfFont, private val sprites: Map<String, Bitmap32>) {
    fun sprite(id: String, facing: Facing = Facing.DOWN): Bitmap32 =
        sprites["$id/${facing.fileName}"] ?: sprites["$id/front"] ?: error("sprite $id がありません")

    companion object {
        /** 方向別の立ち絵を持つのは主人公だけ。仲間は正面のみ */
        private val requests = listOf("sobaya" to Facing.entries) +
            listOf("tokun", "yotan", "fukuchan", "yametaro", "okayaman", "yumemin").map { it to listOf(Facing.DOWN) }

        suspend fun load(): Assets {
            val font = resourcesVfs["fonts/MPLUSRounded1c-ExtraBold.ttf"].readTtfFont()
            val sprites = mutableMapOf<String, Bitmap32>()
            for ((id, facings) in requests) for (f in facings) {
                val src = resourcesVfs["chars/$id/${f.fileName}.png"].readBitmap().toBMP32()
                sprites["$id/${f.fileName}"] = downscale(cutOut(src), 160).premultipliedIfRequired().mipmaps(true)
            }
            return Assets(font, sprites)
        }

        /** 外周とつながった背景色ピクセルを透明にし、キャラの外接矩形で切り抜く（もともと透過なら何もしない） */
        private fun cutOut(src: Bitmap32): Bitmap32 {
            val w = src.width
            val h = src.height
            val bg = src[0, 0]
            if (bg.a < 255) return src
            fun isBg(c: RGBA) = abs(c.r - bg.r) <= 6 && abs(c.g - bg.g) <= 6 && abs(c.b - bg.b) <= 6
            val clear = BooleanArray(w * h)
            val queue = ArrayDeque<Int>()
            fun seed(x: Int, y: Int) {
                val i = y * w + x
                if (!clear[i] && isBg(src[x, y])) { clear[i] = true; queue.add(i) }
            }
            for (x in 0 until w) { seed(x, 0); seed(x, h - 1) }
            for (y in 0 until h) { seed(0, y); seed(w - 1, y) }
            while (queue.isNotEmpty()) {
                val i = queue.removeFirst()
                val x = i % w
                val y = i / w
                if (x > 0) seed(x - 1, y)
                if (x < w - 1) seed(x + 1, y)
                if (y > 0) seed(x, y - 1)
                if (y < h - 1) seed(x, y + 1)
            }
            var minX = w; var minY = h; var maxX = 0; var maxY = 0
            for (y in 0 until h) for (x in 0 until w) if (!clear[y * w + x]) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
            val out = Bitmap32(maxX - minX + 1, maxY - minY + 1, premultiplied = false)
            for (y in minY..maxY) for (x in minX..maxX) {
                out[x - minX, y - minY] = if (clear[y * w + x]) Colors.TRANSPARENT else src[x, y]
            }
            return out
        }

        /** 面積平均で高さ maxH 以下へ縮小（GPUの縮小だとボクセルの輪郭がチラつくため） */
        private fun downscale(src: Bitmap32, maxH: Int): Bitmap32 {
            val f = (src.height + maxH - 1) / maxH
            if (f <= 1) return src
            val w = src.width / f
            val h = src.height / f
            val out = Bitmap32(w, h, premultiplied = false)
            for (y in 0 until h) for (x in 0 until w) {
                var r = 0; var g = 0; var b = 0; var a = 0
                for (yy in 0 until f) for (xx in 0 until f) {
                    val c = src[x * f + xx, y * f + yy]
                    r += c.r * c.a; g += c.g * c.a; b += c.b * c.a; a += c.a
                }
                out[x, y] = if (a == 0) Colors.TRANSPARENT else RGBA(r / a, g / a, b / a, a / (f * f))
            }
            return out
        }
    }
}

val Facing.fileName
    get() = when (this) {
        Facing.DOWN -> "front"
        Facing.UP -> "back"
        // models3d/sprites の left / right は「画面の左 / 右を向いた絵」
        Facing.LEFT -> "left"
        Facing.RIGHT -> "right"
    }
