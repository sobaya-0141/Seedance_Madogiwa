import korlibs.image.color.*
import korlibs.image.font.*
import korlibs.korge.input.*
import korlibs.korge.view.*
import korlibs.math.geom.*
import kotlin.math.hypot

/**
 * スマホ・タブレット用のタッチ操作（Android・iOS・スマホのブラウザ）。
 * - 画面の左半分: 指を置いた場所に出るスティック（移動）
 * - 右下: 攻撃（大）・チャージ・回避・無双、ゴールにいる間だけ「ゴール」（長押し）
 * - 右上: 一時停止
 * 一度でも画面に触れると表示される（キーボードやゲームパッドだけで遊ぶ PC では出ない）。
 * 座標はゲームの座標（1280×720）。
 */
class TouchControls(private val layer: Container, private val font: TtfFont) {
    enum class Btn(val label: String, val x: Double, val y: Double, val r: Double) {
        ATTACK("攻撃", 1150.0, 610.0, 74.0),
        CHARGE("チャージ", 1010.0, 640.0, 54.0),
        DODGE("回避", 1170.0, 470.0, 50.0),
        MUSOU("必殺", 1030.0, 505.0, 54.0),
        GOAL("ゴール\n長押し", 880.0, 600.0, 58.0),
        PAUSE("Ⅱ", 1235.0, 128.0, 30.0),
    }

    /** タッチ操作を使ったことがあるか（あれば表示する） */
    var active = false
        private set
    var moveX = 0.0
        private set
    var moveY = 0.0
        private set
    val held = mutableSetOf<Btn>()
    val pressed = mutableSetOf<Btn>()
    /** ゲーム中でない画面（タイトル・リザルト）でのタップ。x の位置で左右を判定する */
    var tappedAt: Point? = null

    private var stickId = -1
    private var stickBase = Point(0, 0)
    private val buttonTouches = mutableMapOf<Int, Btn>()

    private val root = layer.container { visible = false }
    private val stickRing = root.circle(80, Colors["#ffffff22"], Colors["#ffffffaa"], 4.0) { anchor(0.5, 0.5); visible = false }
    private val stickKnob = root.circle(38, Colors["#ffffff99"]) { anchor(0.5, 0.5); visible = false }
    private val stickHint = root.text("ここで移動", 20, Colors["#ffffff88"], font) { position(120, 620) }
    private val buttonViews = Btn.entries.associateWith { b ->
        root.container {
            position(b.x, b.y)
            circle(b.r, Colors["#14161c88"], Colors["#ffffffcc"], 4.0) { anchor(0.5, 0.5) }
            val lines = b.label.split("\n")
            lines.forEachIndexed { i, s ->
                val size = if (b == Btn.ATTACK) 30.0 else if (b == Btn.PAUSE) 26.0 else 20.0
                text(s, size, Colors.WHITE, font) {
                    position(-s.length * size / 2, -size * lines.size / 2 + i * size * 1.05 - 2)
                }
            }
        }
    }

    /** View のタッチに登録する。inPlay が false の画面（タイトル・リザルト・一時停止）では tappedAt にタップ位置を入れる */
    fun attach(view: View, inPlay: () -> Boolean) {
        view.touch {
            start { t ->
                active = true
                val p = t.local
                if (!inPlay()) { tappedAt = p; return@start }
                val btn = Btn.entries.firstOrNull { b -> buttonVisible(b) && hypot(p.x - b.x, p.y - b.y) < b.r * 1.25 }
                when {
                    btn != null -> { buttonTouches[t.id] = btn; held += btn; pressed += btn }
                    p.x < SCREEN_W * 0.55 && stickId < 0 -> { stickId = t.id; stickBase = p; updateStick(p) }
                }
            }
            move { t -> if (t.id == stickId) updateStick(t.local) }
            end { t ->
                if (t.id == stickId) { stickId = -1; moveX = 0.0; moveY = 0.0 }
                buttonTouches.remove(t.id)?.let { b -> if (buttonTouches.values.none { it == b }) held -= b }
            }
        }
    }

    private fun updateStick(p: Point) {
        val dx = p.x - stickBase.x
        val dy = p.y - stickBase.y
        val len = hypot(dx, dy)
        val k = if (len > 70) 70 / len else 1.0
        moveX = (dx * k / 70).let { if (kotlin.math.abs(it) < 0.2) 0.0 else it }
        moveY = (dy * k / 70).let { if (kotlin.math.abs(it) < 0.2) 0.0 else it }
    }

    private var goalVisible = false
    private fun buttonVisible(b: Btn) = b != Btn.GOAL || goalVisible

    /** 毎フレーム呼ぶ。musouReady で無双ボタンを光らせ、nearGoal でゴールボタンを出す */
    fun update(inPlay: Boolean, musouReady: Boolean, nearGoal: Boolean, clock: Double) {
        root.visible = active && inPlay
        goalVisible = nearGoal
        if (!root.visible) return
        stickRing.visible = stickId >= 0
        stickKnob.visible = stickId >= 0
        stickHint.visible = stickId < 0
        if (stickId >= 0) {
            stickRing.position(stickBase.x, stickBase.y)
            stickKnob.position(stickBase.x + moveX * 70, stickBase.y + moveY * 70)
        }
        for ((b, v) in buttonViews) {
            v.visible = buttonVisible(b)
            v.alpha = if (b in held) 1.0 else 0.75
            v.scale(if (b in held) 0.92 else 1.0)
        }
        buttonViews.getValue(Btn.MUSOU).alpha = if (musouReady) 0.75 + 0.25 * kotlin.math.sin(clock * 10) else 0.35
    }

    fun clearPressed() = pressed.clear()

}
