import korlibs.event.*
import korlibs.image.color.*
import korlibs.image.format.*
import korlibs.io.file.std.*
import korlibs.io.lang.*
import korlibs.korge.*
import korlibs.korge.input.*
import korlibs.korge.scene.*
import korlibs.korge.view.*
import korlibs.math.geom.*
import korlibs.time.*
import kotlin.time.Duration

const val TILE = 40
const val WIN_W = MAP_W * TILE // 960
const val MAP_PX_H = MAP_H * TILE // 560
const val WIN_H = MAP_PX_H + 160

suspend fun main() = Korge(
    windowSize = Size(WIN_W, WIN_H),
    title = "窓際ダンジョン",
    backgroundColor = Colors["#0d0f14"],
) {
    val assets = Assets.load()
    sceneContainer().changeTo { MainScene(assets) }
}

private object Pal {
    val floor = Colors["#3a4250"]
    val floorDot = Colors["#465062"]
    val box = Colors["#a07a4a"]
    val boxDark = Colors["#7c5a33"]
    val tape = Colors["#d8c08a"]
    val panel = Colors["#14171f"]
    val panelLine = Colors["#e8a33c"]
    val text = Colors["#f3efe6"]
    val dim = Colors["#9aa3b2"]
    val accent = Colors["#e8a33c"]
    val damage = Colors["#ff6b5b"]
    val heal = Colors["#7ddc8a"]
    val power = Colors["#ffd45b"]
}

/**
 * タイトル → ダンジョン → エンディングを1つのシーン内で切り替える。
 * ゲームの状態とルールは Game、ここは描画と入力だけを持つ。
 */
class MainScene(private val assets: Assets) : Scene() {
    private enum class Screen { TITLE, GAME, ENDING }

    private var screen = Screen.TITLE
    private var game = Game(seed = 20251201)
    private lateinit var ui: Container

    // ダンジョン画面のビュー
    private lateinit var tileViews: Array<Array<Container>>
    private lateinit var entityLayer: Container
    private lateinit var fxLayer: Container
    private lateinit var hudStatus: Text
    private val hudLog = mutableListOf<Text>()
    private lateinit var dialogueBox: Container
    private lateinit var dialogueName: Text
    private lateinit var dialogueText: Text
    private lateinit var dialoguePortrait: Container
    private var builtFloorKey = ""

    private val auto = Environment["MADOGIWA_AUTO"] == "1"
    private val shotsDir = Environment["MADOGIWA_SHOTS"]

    override suspend fun SContainer.sceneMain() {
        ui = container()
        showTitle()
        keys { down { onKey(it.key) } }
        addUpdater { dt -> updateFx(dt) }
                if (auto) runAutoPlay()
    }

    private fun onKey(key: Key) {
        when (screen) {
            Screen.TITLE -> if (key in CONFIRM) startGame()
            Screen.ENDING -> if (key in CONFIRM) showTitle()
            Screen.GAME -> {
                if (game.mode == Mode.DIALOGUE) {
                    if (key in CONFIRM) game.advanceDialogue()
                } else when (key) {
                    Key.LEFT, Key.A -> game.tryMove(-1, 0)
                    Key.RIGHT, Key.D -> game.tryMove(1, 0)
                    Key.UP, Key.W -> game.tryMove(0, -1)
                    Key.DOWN, Key.S -> game.tryMove(0, 1)
                    Key.PERIOD, Key.X -> game.rest()
                    else -> Unit
                }
                refresh()
            }
        }
    }

    // ---------------------------------------------------------------- タイトル

    private fun showTitle() {
        screen = Screen.TITLE
        ui.removeChildren()
        ui.solidRect(WIN_W, WIN_H, Colors["#1b1712"])
        // 段ボールの床タイル風の背景
        for (y in 0 until WIN_H / TILE + 1) for (x in 0 until WIN_W / TILE) {
            if ((x + y) % 2 == 0) ui.solidRect(TILE, TILE, Colors["#221d16"]).position(x * TILE, y * TILE)
        }
        ui.text("窓際ダンジョン", 72, Pal.accent, assets.font).position(80, 120)
        ui.text("〜 地下5階の伝説のビールサーバ 〜", 28, Pal.text, assets.font).position(86, 220)
        ui.text(
            "アクシデンチュア本社の地下には、\n段ボールで増築されすぎた「窓際倉庫」がある。\n最深部に眠る伝説のビールサーバを求めて、\nそば屋が潜る。",
            20, Pal.dim, assets.font,
        ).position(86, 300)
        ui.text("Enter / Space / Z でスタート", 26, Pal.text, assets.font).position(86, 470)
        ui.text("移動: 矢印キー / WASD　敵に体当たりで片付ける　仲間に体当たりで話す　X: 一休み", 16, Pal.dim, assets.font).position(86, 530)
        ui.image(assets.sprite("sobaya")) {
            smoothing = true
            val s = 380.0 / bitmap.height
            scale(s)
            position(WIN_W - bitmap.width * s - 70, 150)
        }
        ui.text("KorGE 試作版", 14, Pal.dim, assets.font).position(WIN_W - 130, WIN_H - 30)
    }

    private fun startGame() {
        game = Game(seed = 20251201)
        screen = Screen.GAME
        buildGameScreen()
        refresh()
    }

    // ---------------------------------------------------------------- ダンジョン画面

    private fun buildGameScreen() {
        ui.removeChildren()
        ui.solidRect(WIN_W, MAP_PX_H, Colors["#0d0f14"])
        val mapLayer = ui.container()
        tileViews = Array(MAP_H) { y -> Array(MAP_W) { x -> mapLayer.container { position(x * TILE, y * TILE) } } }
        entityLayer = ui.container()
        fxLayer = ui.container()

        // HUD
        ui.solidRect(WIN_W, WIN_H - MAP_PX_H, Pal.panel).position(0, MAP_PX_H)
        ui.solidRect(WIN_W, 3, Pal.panelLine).position(0, MAP_PX_H)
        hudStatus = ui.text("", 22, Pal.text, assets.font).position(20, MAP_PX_H + 14)
        hudLog.clear()
        repeat(4) { i -> hudLog += ui.text("", 17, Pal.dim, assets.font).position(20, MAP_PX_H + 52 + i * 25) }

        // 会話ウィンドウ
        dialogueBox = ui.container {
            solidRect(WIN_W - 40, 150, Colors["#101318ee"]).position(20, MAP_PX_H - 170)
            solidRect(WIN_W - 40, 3, Pal.panelLine).position(20, MAP_PX_H - 170)
        }
        dialoguePortrait = dialogueBox.container().position(40, MAP_PX_H - 160)
        dialogueName = dialogueBox.text("", 22, Pal.accent, assets.font).position(170, MAP_PX_H - 156)
        dialogueText = dialogueBox.text("", 22, Pal.text, assets.font).position(170, MAP_PX_H - 120)
        dialogueBox.text("▼ Enter", 16, Pal.dim, assets.font).position(WIN_W - 110, MAP_PX_H - 44)
        builtFloorKey = ""
    }

    /** フロアが変わったときだけタイルを作り直す */
    private fun rebuildTiles() {
        val map = game.map
        for (y in 0 until MAP_H) for (x in 0 until MAP_W) {
            val c = tileViews[y][x]
            c.removeChildren()
            when {
                map.walkable(x, y) -> {
                    c.solidRect(TILE, TILE, Pal.floor)
                    if ((x * 7 + y * 3) % 5 == 0) c.solidRect(4, 4, Pal.floorDot).position(18, 18)
                    if (map[x, y] == Tile.STAIRS) drawStairs(c)
                }
                map.isVisibleWall(x, y) -> {
                    // 積まれた段ボール箱
                    c.solidRect(TILE, TILE, Pal.boxDark)
                    c.solidRect(TILE - 4, TILE - 6, Pal.box).position(2, 2)
                    c.solidRect(TILE - 4, 5, Pal.tape).position(2, 15)
                }
            }
        }
    }

    private fun drawStairs(c: Container) {
        for (i in 0 until 4) c.solidRect(TILE - 8 - i * 6, 6, Colors["#c9a46a"]).position(4 + i * 3, 6 + i * 8)
        c.text("↓", 16, Pal.text, assets.font).position(26, 18)
    }

    private fun refresh() {
        if (screen != Screen.GAME) return
        if (game.mode == Mode.CLEAR) { showEnding(); return }
        val key = "${game.attempt}-${game.floor}"
        if (key != builtFloorKey) {
            rebuildTiles()
            builtFloorKey = key
            // 前のフロアの数字を持ち越さない
            fxLayer.removeChildren(); floating.clear()
        }

        for (y in 0 until MAP_H) for (x in 0 until MAP_W) {
            tileViews[y][x].alpha = when {
                game.visible[y][x] -> 1.0
                game.seen[y][x] -> 0.35
                else -> 0.0
            }
        }

        entityLayer.removeChildren()
        for (it in game.items) if (game.visible[it.y][it.x]) drawItem(it)
        for (n in game.npcs) if (game.visible[n.y][n.x]) {
            val id = n.speaker.spriteId!!
            drawCharacter(assets.sprite(id), n.x, n.y, mapHeight(id))
        }
        for (e in game.enemies) if (game.visible[e.y][e.x]) drawEnemy(e)
        drawCharacter(assets.sprite("sobaya", game.player.facing), game.player.x, game.player.y)

        val p = game.player
        hudStatus.text = "地下${game.floor}階　Lv ${p.level}　元気 ${p.hp.coerceAtLeast(0)}/${p.maxHp}　攻撃 ${p.atk}　防御 ${p.def}　経験 ${p.exp}/${p.nextExp}"
        hudStatus.color = if (p.hp * 4 <= p.maxHp) Pal.damage else Pal.text
        val lines = game.log.toList()
        hudLog.forEachIndexed { i, t ->
            t.text = lines.getOrNull(i) ?: ""
            t.color = if (i == lines.size - 1) Pal.text else Pal.dim
        }

        val line = game.currentLine
        dialogueBox.visible = game.mode == Mode.DIALOGUE && line != null
        if (line != null) {
            dialogueName.text = line.speaker.displayName
            dialogueText.text = wrap(line.text, 32)
            dialoguePortrait.removeChildren()
            line.speaker.spriteId?.let { id ->
                dialoguePortrait.image(assets.sprite(id)) {
                    val s = 130.0 / bitmap.height
                    scale(s)
                    x = (110 - bitmap.width * s) / 2
                }
            }
        }
        spawnFx()
    }

    private fun wrap(s: String, n: Int) = s.chunked(n).joinToString("\n")

    private fun drawCharacter(bmp: korlibs.image.bitmap.Bitmap32, tx: Int, ty: Int, height: Double = 56.0) {
        entityLayer.image(bmp) {
            // 横長の絵（ゆめみんの側面など）はマスからはみ出しすぎないよう幅も抑える
            val s = minOf(height / bitmap.height, 48.0 / bitmap.width)
            scale(s)
            position(tx * TILE + (TILE - bitmap.width * s) / 2, ty * TILE + TILE - bitmap.height * s - 2)
        }
    }

    /** マップ上の背丈。やめたろうは人間キャラの腰ほど（02_CHARACTERS/06_Yametaro.md） */
    private fun mapHeight(id: String) = when (id) {
        "yametaro" -> 36.0
        else -> 56.0
    }

    private fun drawItem(item: Item) {
        val c = entityLayer.container { position(item.x * TILE, item.y * TILE) }
        when (item.kind) {
            ItemKind.EDAMAME -> {
                c.solidRect(26, 10, Colors["#5f9e3c"]).position(7, 18)
                for (i in 0 until 3) c.circle(4, Colors["#9bd36a"]).position(9 + i * 8, 18)
            }
            ItemKind.YAKITORI -> {
                c.solidRect(30, 3, Colors["#e8d3a8"]).position(5, 21)
                for (i in 0 until 3) c.circle(6, Colors["#8a4b24"]).position(8 + i * 9, 15)
            }
            ItemKind.JOCKEY -> drawJockey(c, 11, 8)
            ItemKind.SERVER -> {
                c.solidRect(30, 34, Colors["#c9ced6"]).position(5, 4)
                c.solidRect(30, 6, Colors["#8f96a3"]).position(5, 4)
                c.solidRect(6, 10, Colors["#30343c"]).position(17, 14)
                c.solidRect(14, 6, Pal.accent).position(13, 28)
                c.text("★", 14, Pal.power, assets.font).position(26, -6)
            }
        }
    }

    private fun drawJockey(c: Container, x: Int, y: Int) {
        c.solidRect(16, 22, Colors["#e8a33c"]).position(x, y + 4)
        c.solidRect(16, 6, Colors["#fff6e0"]).position(x, y)
        c.solidRect(5, 12, Colors["#dfe7ee"]).position(x + 16, y + 8)
    }

    private fun drawEnemy(e: Enemy) {
        val c = entityLayer.container { position(e.x * TILE, e.y * TILE) }
        when (e.kind) {
            EnemyKind.PAPERS -> for (i in 0 until 4) {
                c.solidRect(28, 6, Colors["#f4f1ea"]).position(6 + (i % 2) * 3, 30 - i * 7)
                c.solidRect(28, 1, Colors["#b9b4aa"]).position(6 + (i % 2) * 3, 35 - i * 7)
            }
            EnemyKind.ROOMBA -> {
                c.circle(15, Colors["#2c2f36"]).position(5, 8)
                c.circle(4, Colors["#57d17a"]).position(16, 12)
                c.solidRect(6, 3, Colors["#ff6b5b"]).position(17, 26)
            }
            EnemyKind.CABLE -> for (i in 0 until 6) {
                c.solidRect(10, 4, Colors["#3c7fd8"]).position(5 + i * 5, 12 + (if (i % 2 == 0) 0 else 10))
                c.solidRect(4, 12, Colors["#3c7fd8"]).position(8 + i * 5, 14)
            }
            EnemyKind.PHONE -> {
                c.solidRect(28, 18, Colors["#e9dfc8"]).position(6, 16)
                c.solidRect(32, 7, Colors["#2c2f36"]).position(4, 9)
                c.text("!", 18, Pal.damage, assets.font).position(17, -8)
            }
            EnemyKind.SHREDDER -> {
                c.solidRect(28, 26, Colors["#8f96a3"]).position(6, 10)
                c.solidRect(24, 3, Colors["#1c1f25"]).position(8, 14)
                for (i in 0 until 4) c.solidRect(3, 10, Colors["#f4f1ea"]).position(10 + i * 6, 2)
            }
            EnemyKind.BOSS -> {
                // 段ボールを積んで作った巨大な椅子。箱に手書きで「アーロンチェア」
                c.solidRect(56, 14, Pal.boxDark).position(-8, 28)
                c.solidRect(52, 12, Pal.box).position(-6, 18)
                c.solidRect(44, 40, Pal.box).position(-2, -24)
                c.solidRect(44, 5, Pal.tape).position(-2, -8)
                c.text("アーロンチェア", 9, Colors["#3b2a14"], assets.font).position(0, -20)
                c.solidRect(6, 14, Pal.boxDark).position(-6, 40)
                c.solidRect(6, 14, Pal.boxDark).position(36, 40)
            }
        }
        if (e.hp < e.maxHp) {
            c.solidRect(32, 4, Colors["#00000099"]).position(4, -4)
            c.solidRect(32.0 * e.hp / e.maxHp, 4.0, Pal.damage).position(4, -4)
        }
    }

    // ---------------------------------------------------------------- 浮かぶ数字

    private class Floating(val view: View, var ttl: Double)
    private val floating = mutableListOf<Floating>()

    private fun spawnFx() {
        for (f in game.fx) {
            val color = when (f.kind) {
                FxKind.DAMAGE_TO_ENEMY -> Pal.text
                FxKind.DAMAGE_TO_PLAYER -> Pal.damage
                FxKind.HEAL -> Pal.heal
                FxKind.POWER -> Pal.power
            }
            val t = fxLayer.text(f.text, 22, color, assets.font).position(f.x * TILE + 8, f.y * TILE - 16)
            floating += Floating(t, 0.8)
        }
        game.fx.clear()
    }

    private fun updateFx(dt: Duration) {
        val s = dt.seconds
        val it = floating.iterator()
        while (it.hasNext()) {
            val f = it.next()
            f.ttl -= s
            f.view.y -= 30 * s
            f.view.alpha = (f.ttl / 0.8).coerceIn(0.0, 1.0)
            if (f.ttl <= 0) { f.view.removeFromParent(); it.remove() }
        }
    }

    // ---------------------------------------------------------------- エンディング

    private fun showEnding() {
        screen = Screen.ENDING
        ui.removeChildren()
        floating.clear()
        ui.solidRect(WIN_W, WIN_H, Colors["#1b1712"])
        // 立ち飲み処の紺の暖簾と赤提灯
        ui.solidRect(WIN_W, 70, Colors["#1f2f5a"]).position(0, 0)
        for (i in 0 until 6) ui.solidRect(4, 70, Colors["#16223f"]).position(160 * i + 80, 0)
        ui.text("立ち飲み処　地下5階店", 30, Pal.text, assets.font).position(330, 16)
        for (x in listOf(60, WIN_W - 100)) {
            ui.circle(22, Colors["#d8452f"]).position(x, 84)
            ui.text("酒", 20, Pal.text, assets.font).position(x + 12, 92)
        }
        ui.text("伝説のビールサーバを手に入れた！", 36, Pal.accent, assets.font).position(190, 150)
        ui.text("そのまま地下5階に立ち飲み処が開店。みんなで乾杯！", 22, Pal.text, assets.font).position(190, 205)

        // やめたろう・ゆめみんは小柄、おかやまんはスクリーン越しの出演
        val cast = listOf("tokun" to 230.0, "fukuchan" to 235.0, "sobaya" to 260.0, "yotan" to 235.0, "yametaro" to 130.0, "yumemin" to 90.0, "okayaman" to 210.0)
        val baseY = 560.0
        val gap = 14.0
        val natural = cast.map { (id, h) -> assets.sprite(id).let { it.width * h / it.height } }
        // 横幅に収まらなければ全員を同じ比率で縮める（身長差は保つ）
        val fit = minOf(1.0, (WIN_W - 60 - gap * (cast.size - 1)) / natural.sum())
        var x = (WIN_W - natural.sum() * fit - gap * (cast.size - 1)) / 2
        cast.forEachIndexed { i, (id, h) ->
            ui.image(assets.sprite(id)) {
                scale(h * fit / bitmap.height)
                // ゆめみんは脚の無い、宙に浮くマスコット
                val lift = if (id == "yumemin") 60.0 else 0.0
                position(x, baseY - h * fit - lift)
            }
            x += natural[i] * fit + gap
        }
        ui.solidRect(WIN_W, 8, Pal.boxDark).position(0, baseY)
        ui.text("おかやまん。大変驚いております。", 20, Pal.dim, assets.font).position(600, 600)
        ui.text("挑戦回数 ${game.attempt}回　最終レベル ${game.player.level}　経過ターン ${game.turn}", 20, Pal.text, assets.font).position(70, 600)
        ui.text("Enter でタイトルへ", 18, Pal.dim, assets.font).position(70, 650)
    }

    // ---------------------------------------------------------------- 自動プレイと撮影（動作確認用）

    /**
     * MADOGIWA_AUTO=1 で起動すると、ボットがタイトルからエンディングまで遊び、
     * MADOGIWA_SHOTS に指定したディレクトリへ要所のスクリーンショットを書き出して終了する。
     */
    private suspend fun SContainer.runAutoPlay() {
        delay(0.5.seconds)
        shot("01_title")
        startGame()
        val taken = mutableSetOf<String>()
        var steps = 0
        while (screen == Screen.GAME && steps < 6000) {
            val line = game.currentLine
            val name = when {
                game.floor == 1 && game.turn == 3 && game.mode == Mode.PLAY -> "02_floor1"
                line?.speaker == Speaker.TOKUN -> "03_dialogue_tokun"
                line?.speaker == Speaker.FUKUGYUN -> "04_dialogue_fukugyun"
                game.enemies.any { it.hp < it.maxHp } && game.mode == Mode.PLAY -> "05_battle"
                line?.speaker == Speaker.YAMETARO -> "06_dialogue_yametaro"
                line?.speaker == Speaker.OKAYAMAN -> "07_boss_floor"
                game.enemies.any { it.kind == EnemyKind.BOSS && it.hp < it.maxHp } -> "08_boss_battle"
                line?.text?.startsWith("そば屋の元気が尽きた") == true -> "09_knocked_out"
                else -> null
            }
            if (name != null && taken.add(name)) shot(name)
            game.autoStep()
            refresh()
            steps++
            delay(16.milliseconds)
        }
        println("AUTO: screen=$screen floor=${game.floor} attempt=${game.attempt} turn=${game.turn} level=${game.player.level} steps=$steps")
        delay(0.3.seconds)
        shot("10_ending")
        views.gameWindow.close(0)
    }

    private suspend fun SContainer.shot(name: String) {
        val dir = shotsDir ?: return
        delay(0.1.seconds)
        stage!!.renderToBitmap(views).writeTo(localVfs("$dir/$name.png"), PNG)
        println("AUTO: shot $name")
    }

    companion object {
        private val CONFIRM = setOf(Key.ENTER, Key.SPACE, Key.Z, Key.RETURN)
    }
}
