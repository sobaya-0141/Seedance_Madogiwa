import korlibs.event.*
import korlibs.image.color.*
import korlibs.image.font.*
import korlibs.image.format.*
import korlibs.io.file.std.*
import korlibs.io.lang.*
import korlibs.korge.*
import korlibs.korge.input.*
import korlibs.korge.scene.*
import korlibs.korge.view.*
import korlibs.math.geom.*
import korlibs.time.*
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random
import kotlin.time.Duration

suspend fun main() = Korge(
    windowSize = Size(SCREEN_W, SCREEN_H),
    title = "そば屋無双 2D",
    backgroundColor = Colors["#101216"],
) {
    val font = resourcesVfs["fonts/MPLUSRounded1c-ExtraBold.ttf"].readTtfFont()
    val sheets = listOf("sobaya", "guard", "police", "captain", "sergeant", "boss").associateWith { Sheet.load(it) }
    sheets.getValue("sobaya").anims.values.forEach { Player.animLength[it.name] = it.length }
    for ((name, sheet) in sheets) sheet.anims.values.forEach { Enemy.animLength["$name/${it.name}"] = it.length }
    sceneContainer().changeTo { MusouScene(font, sheets) }
}

private object Pal {
    val text = Colors["#fff7e8"]
    val dim = Colors["#c9c2b4"]
    val gold = Colors["#ffc23d"]
    val beer = Colors["#f0a01e"]
    val red = Colors["#ff5a48"]
    val green = Colors["#6fdc7d"]
    val panel = Colors["#14161cdd"]
    val shadow = Colors["#00000055"]
}

/**
 * タイトル → ステージ → リザルト（→ 次のステージ / エンディング）を1つのシーンで切り替える。
 * ルールと数値は Battle / Data、ここは描画と入力だけを持つ。
 */
class MusouScene(private val font: TtfFont, private val sheets: Map<String, Sheet>) : Scene() {
    private enum class Screen { TITLE, PLAY, ENDING }

    private var screen = Screen.TITLE
    private var stageIndex = 0
    private lateinit var ui: Container
    private var battle: Battle? = null
    private val playerInput = Input()
    private val held = mutableSetOf<Key>()
    private val pressed = mutableSetOf<Key>()
    private var clock = 0.0

    // ステージ画面のビュー
    private lateinit var world: Container
    private lateinit var actors: Container
    private lateinit var fxLayer: Container
    private lateinit var playerView: ActorView
    private val enemyViews = mutableMapOf<Enemy, ActorView>()
    private val pickupViews = mutableMapOf<Pickup, View>()
    private val gateViews = mutableListOf<View>()
    private lateinit var goalGlow: View
    private lateinit var hud: Hud
    private val floating = mutableListOf<Floating>()
    private var shake = 0.0
    private var resultShown = false

    // 動作確認用
    private val auto = Environment["MADOGIWA_AUTO"] == "1"
    private val shotsDir = Environment["MADOGIWA_SHOTS"]
    private val autoSpeed = Environment["MADOGIWA_AUTO_SPEED"]?.toIntOrNull() ?: 4
    private var pendingShot: String? = null
    private val shotsTaken = mutableSetOf<String>()

    override suspend fun SContainer.sceneMain() {
        ui = container()
        showTitle()
        keys {
            down { held += it.key; pressed += it.key; onKey(it.key) }
            up { held -= it.key }
        }
        addUpdater { dt -> tick(dt) }
        if (auto) runAuto()
    }

    // ---------------------------------------------------------------- 入力

    private fun onKey(key: Key) {
        when (screen) {
            Screen.TITLE -> when (key) {
                Key.LEFT, Key.A -> { stageIndex = (stageIndex + STAGES.size - 1) % STAGES.size; showTitle() }
                Key.RIGHT, Key.D -> { stageIndex = (stageIndex + 1) % STAGES.size; showTitle() }
                Key.ENTER, Key.RETURN, Key.SPACE -> startStage(stageIndex)
                else -> Unit
            }
            Screen.PLAY -> {
                val b = battle ?: return
                when {
                    key == Key.ESCAPE -> showTitle()
                    key == Key.R -> startStage(stageIndex)
                    b.phase == Phase.WIN && resultShown && (key == Key.ENTER || key == Key.RETURN) -> nextStage()
                }
            }
            Screen.ENDING -> if (key == Key.ENTER || key == Key.RETURN) { stageIndex = 0; showTitle() }
        }
    }

    private fun readInput() {
        fun h(vararg k: Key) = k.any { it in held }
        fun p(vararg k: Key) = k.any { it in pressed }
        playerInput.moveX = (if (h(Key.D, Key.RIGHT)) 1.0 else 0.0) - (if (h(Key.A, Key.LEFT)) 1.0 else 0.0)
        playerInput.moveY = (if (h(Key.S, Key.DOWN)) 1.0 else 0.0) - (if (h(Key.W, Key.UP)) 1.0 else 0.0)
        playerInput.attack = p(Key.J, Key.Z)
        playerInput.charge = p(Key.K, Key.X)
        playerInput.musou = p(Key.L, Key.C)
        playerInput.dodge = p(Key.SPACE)
        playerInput.interact = h(Key.F)
    }

    private fun nextStage() {
        if (stageIndex >= STAGES.size - 1) showEnding() else startStage(stageIndex + 1)
    }

    // ---------------------------------------------------------------- 毎フレーム

    private fun tick(dt: Duration) {
        val d = min(dt.seconds, 1.0 / 30)
        clock += d
        updateFloating(d)
        if (screen == Screen.TITLE) animateTitle()
        val b = battle
        if (screen != Screen.PLAY || b == null) { pressed.clear(); return }
        val steps = if (auto) autoSpeed else 1
        repeat(steps) {
            if (auto) b.autoInput(playerInput) else readInput()
            b.update(d, playerInput)
            pressed.clear()
            consumeFx(b)
        }
        render(b)
        if (b.phase != Phase.PLAY && !resultShown && b.phaseT > (if (b.phase == Phase.WIN) 2.5 else 0.6)) showResult(b)
    }

    // ---------------------------------------------------------------- タイトル

    private var titleSobaya: Image? = null

    private fun showTitle() {
        screen = Screen.TITLE
        battle = null
        ui.removeChildren()
        floating.clear()
        drawScenery(ui, STAGES[stageIndex].scenery, SCREEN_W.toDouble(), title = true)
        ui.solidRect(SCREEN_W, SCREEN_H, Colors["#0c0d12aa"])
        ui.text("そば屋無双", 92, Pal.gold, font) { position(70, 60) }
        ui.text("2D", 46, Pal.text, font) { position(560, 98) }
        ui.text("〜 ビール工場強奪作戦 〜", 30, Pal.text, font) { position(76, 176) }
        val st = STAGES[stageIndex]
        ui.solidRect(560, 150, Pal.panel) { position(70, 250) }
        ui.text("◀  STAGE ${st.number}  ▶", 30, Pal.gold, font) { position(92, 264) }
        ui.text(st.title, 24, Pal.text, font) { position(92, 312) }
        ui.text(st.subtitle, 18, Pal.dim, font) { position(92, 352) }
        ui.text("Enter でスタート（← → でステージを選ぶ）", 22, Pal.text, font) { position(76, 430) }
        val help = listOf(
            "移動  WASD / 矢印キー",
            "通常攻撃（4段コンボ）  J / Z",
            "チャージ攻撃（周りを吹っ飛ばす）  K / X",
            "無双乱舞（ゲージ満タン）  L / C",
            "回避  Space　　ゴールで長押し  F",
            "やり直し  R　　タイトルへ  Esc",
        )
        help.forEachIndexed { i, s -> ui.text(s, 17, Pal.dim, font) { position(80, 478 + i * 30) } }
        val sheet = sheets.getValue("sobaya")
        titleSobaya = ui.image(sheet.frameAt("idle", 0.0)) {
            scale(2.2)
            position(1000 - sheet.pivotX * 2.2, 690 - sheet.pivotY * 2.2)
        }
        ui.text("KorGE 版・PC", 14, Pal.dim, font) { position(SCREEN_W - 120, SCREEN_H - 28) }
    }

    private fun animateTitle() {
        titleSobaya?.bitmap = sheets.getValue("sobaya").frameAt("idle", clock)
    }

    // ---------------------------------------------------------------- ステージ

    private fun startStage(index: Int) {
        stageIndex = index
        screen = Screen.PLAY
        resultShown = false
        val b = Battle(STAGES[index], seed = 20251201 + index)
        b.autoHeal = auto
        battle = b
        ui.removeChildren()
        enemyViews.clear(); pickupViews.clear(); gateViews.clear(); floating.clear()

        world = ui.container()
        drawScenery(world, b.stage.scenery, b.stageLength, title = false)
        for (i in 0 until b.stage.zones.size - 1) gateViews += drawGate(world, (i + 1) * ZONE_W)
        goalGlow = drawGoal(world, b)
        actors = world.container()
        fxLayer = world.container()
        playerView = ActorView(actors, sheets.getValue("sobaya"), PLAYER_SCALE, null)
        hud = Hud(ui)
        fx(Fx.Banner("STAGE ${b.stage.number}  ${b.stage.title}", b.stage.subtitle))
    }

    private fun render(b: Battle) {
        shake *= 0.86
        val sx = if (shake > 0.5) (Random.nextDouble() - 0.5) * shake else 0.0
        val sy = if (shake > 0.5) (Random.nextDouble() - 0.5) * shake else 0.0
        world.x = -b.camX + sx
        world.y = sy

        val p = b.player
        val sobaya = sheets.getValue("sobaya")
        val frame = when (p.state) {
            PState.MOVE -> if (p.running) sobaya.frameAt("run", clock, 1.1) else sobaya.frameAt("idle", clock)
            PState.ATTACK -> sobaya.frameAtProgress(p.move.anim, p.t / p.moveDuration)
            PState.DODGE -> sobaya.frameAtProgress("dodge", p.t / DODGE_TIME)
            PState.HURT -> sobaya.frameAtProgress("hurt", p.t / 0.35)
            PState.MUSOU -> sobaya.frameAtProgress("charge", (p.t * 2.4 / sobaya.anim("charge").length) % 1.0)
            PState.DOWN -> sobaya.frameAtProgress("down", min(1.0, p.t / 0.8))
            PState.WIN -> sobaya.frameAt("win", p.t)
        }
        playerView.update(p, frame, if (p.invuln > 0 && p.state == PState.HURT && (clock * 20).toInt() % 2 == 0) 0.5 else 1.0)
        playerView.aura(p.state == PState.MUSOU, clock)

        for (e in b.enemies) {
            val v = enemyViews.getOrPut(e) { ActorView(actors, sheets.getValue(e.kind.sheet), e.kind.scale, e.title ?: e.kind.title, font) }
            val sh = v.sheet
            val moving = abs(e.x - v.lastX) + abs(e.y - v.lastY) > 0.6
            v.lastX = e.x; v.lastY = e.y
            val f = when (e.state) {
                EState.CHASE -> if (moving) sh.frameAt("walk", clock + e.ringX) else sh.frameAt("idle", clock + e.ringY)
                EState.ATTACK -> sh.frameAtProgress("attack", e.t / (e.len("attack") / (e.kind.attackSpeed * if (e.enraged) 1.3 else 1.0)))
                EState.SPECIAL -> sh.frameAtProgress("special", e.t / e.len("special"))
                EState.HIT -> sh.frameAtProgress("hit", e.t / 0.4)
                EState.FLY -> sh.frameAtProgress("fly", min(0.45, e.t / 0.9))
                EState.LYING -> sh.frameAtProgress("fly", 0.5)
            }
            v.update(e, f, e.alpha)
            v.stars(e.state == EState.LYING, clock)
            v.rage(e.enraged)
        }
        for ((e, v) in enemyViews.entries.toList()) if (e !in b.enemies) { v.remove(); enemyViews.remove(e) }

        for (pk in b.pickups) pickupViews.getOrPut(pk) { drawPickup(actors, pk) }.also { it.zIndex = pk.y; it.y = FLOOR_TOP + pk.y - 6 * abs(sin(clock * 4)) }
        for ((pk, v) in pickupViews.entries.toList()) if (pk !in b.pickups) { v.removeFromParent(); pickupViews.remove(pk) }

        gateViews.forEachIndexed { i, g -> g.visible = !b.gateOpen[i] }
        goalGlow.visible = b.goalOpen
        goalGlow.alpha = 0.5 + 0.4 * sin(clock * 5)
        hud.update(b, clock)
    }

    private fun consumeFx(b: Battle) {
        for (f in b.fx) fx(f)
        b.fx.clear()
    }

    private fun fx(f: Fx) {
        when (f) {
            is Fx.Hit -> {
                val c = fxLayer.container { position(f.x, FLOOR_TOP + f.y - 110) }
                c.circle(if (f.heavy) 30 else 20, Colors["#fff3b0"]) { anchor(0.5, 0.5) }
                c.text(if (f.heavy) "ドカッ！" else "バシッ", if (f.heavy) 30 else 22, Pal.gold, font) { position(-30, -50) }
                floating += Floating(c, 0.35, rise = 40.0, grow = 1.6)
            }
            is Fx.Text -> {
                val t = fxLayer.text(f.text, if (f.big) 24 else 26, if (f.big) Pal.green else Pal.red, font) { position(f.x - 20, FLOOR_TOP + f.y - 230) }
                floating += Floating(t, 0.9, rise = 60.0)
            }
            is Fx.Wave -> {
                val e = fxLayer.ellipse(Size(f.radius, f.radius * 0.42), Colors.TRANSPARENT, if (f.enemy) Pal.red else Pal.gold, 6.0) {
                    position(f.x - f.radius, FLOOR_TOP + f.y - f.radius * 0.42)
                }
                floating += Floating(e, 0.45)
            }
            is Fx.Banner -> hud.banner(f.text, f.sub)
            is Fx.Speech -> hud.speech(f.text)
            is Fx.Shake -> shake = max(shake, f.amount)
        }
    }

    // ---------------------------------------------------------------- リザルト・エンディング

    private fun showResult(b: Battle) {
        resultShown = true
        val c = ui.container()
        c.solidRect(SCREEN_W, SCREEN_H, Colors["#000000aa"])
        if (b.phase == Phase.WIN) {
            c.text("STAGE ${b.stage.number} CLEAR", 64, Pal.gold, font) { position(330, 170) }
            c.text(b.stage.clearText, 32, Pal.text, font) { position(340, 260) }
            c.text("倒した人数 ${b.koTotal}　　最大コンボ ${b.maxCombo}　　タイム ${formatTime(b.time)}", 24, Pal.text, font) { position(250, 340) }
            val next = if (stageIndex >= STAGES.size - 1) "Enter でエンディングへ" else "Enter で次のステージへ"
            c.text(next, 24, Pal.dim, font) { position(470, 420) }
        } else {
            c.text("そば屋、ひと休み……", 56, Pal.text, font) { position(330, 220) }
            c.text("ビールを飲んで出直そう。R でこのステージをやり直す / Esc でタイトルへ", 22, Pal.dim, font) { position(250, 320) }
        }
        requestShot("s${b.stage.number}_result")
    }

    private fun showEnding() {
        screen = Screen.ENDING
        battle = null
        ui.removeChildren()
        floating.clear()
        drawScenery(ui, Scenery.OFFICE, SCREEN_W.toDouble(), title = true)
        drawStandingBar(ui, 760.0)
        val feet = 600.0
        val sobaya = sheets.getValue("sobaya")
        ui.image(sobaya.frameAt("win", 1.2)) { scale(1.4); position(600 - sobaya.pivotX * 1.4, feet - sobaya.pivotY * 1.4) }
        // 警備員と警察官も、今日はお客さんとして店へ向かう
        val police = sheets.getValue("police")
        ui.image(police.frameAt("walk", 0.3)) { scale(1.2); position(200 - police.pivotX * 1.2, feet - police.pivotY * 1.2) }
        val guard = sheets.getValue("guard")
        ui.image(guard.frameAt("walk", 0.0)) { scale(1.2); position(360 - guard.pivotX * 1.2, feet + 10 - guard.pivotY * 1.2) }
        ui.solidRect(SCREEN_W, 112, Colors["#0c0d12dd"]) { y = SCREEN_H - 112.0 }
        ui.text("立ち飲み処、開店！", 44, Pal.gold, font) { position(60, SCREEN_H - 104) }
        ui.text("奪ったビールは窓際の立ち飲み処へ。警備員も警察官も、今日はお客さん。", 20, Pal.text, font) { position(470, SCREEN_H - 92) }
        ui.text("そば屋無双 2D　完　　　Enter でタイトルへ", 18, Pal.dim, font) { position(470, SCREEN_H - 52) }
        requestShot("ending")
    }

    private fun formatTime(s: Double) = "${(s / 60).toInt()}:${(s % 60).toInt().toString().padStart(2, '0')}"

    // ---------------------------------------------------------------- 背景（図形で描く）

    private fun drawScenery(c: Container, s: Scenery, width: Double, title: Boolean) {
        val wall = when (s) { Scenery.FACTORY -> Colors["#4b5563"]; Scenery.STREET -> Colors["#7fb2e5"]; Scenery.OFFICE -> Colors["#dfe6ee"] }
        val floor = when (s) { Scenery.FACTORY -> Colors["#5a5f66"]; Scenery.STREET -> Colors["#6f6a66"]; Scenery.OFFICE -> Colors["#8a93a0"] }
        c.solidRect(width, FLOOR_TOP, wall)
        c.solidRect(width, SCREEN_H - FLOOR_TOP, floor) { y = FLOOR_TOP }
        // 床の目地
        var yy = FLOOR_TOP
        var gap = 18.0
        while (yy < SCREEN_H) { c.solidRect(width, 2.0, Colors["#00000022"]) { y = yy }; yy += gap; gap *= 1.25 }
        var x = 0.0
        while (x < width) { c.solidRect(3.0, SCREEN_H - FLOOR_TOP, Colors["#00000018"]) { position(x, FLOOR_TOP) }; x += 160 }

        var i = 0
        x = 80.0
        while (x < width) {
            when (s) {
                Scenery.FACTORY -> {
                    // ビールの仕込みタンクと配管
                    c.solidRect(170, 300, Colors["#c3c9d1"]) { position(x, 110) }
                    c.circle(85, Colors["#d4d9df"]) { position(x, 60) }
                    c.solidRect(170, 14, Colors["#8b939e"]) { position(x, 250) }
                    c.text("No.${i + 1}", 22, Colors["#5b6470"], font) { position(x + 52, 180) }
                    c.solidRect(260, 18, Colors["#9aa3ae"]) { position(x + 170, 160) }
                    if (i % 3 == 1) c.text("ゴールデン麦酒", 28, Pal.gold, font) { position(x + 190, 110) }
                }
                Scenery.STREET -> {
                    val h = 220.0 + (i * 53 % 4) * 40
                    c.solidRect(230.0, h, Colors[listOf("#9aa6b4", "#b8a99a", "#a3b3a1", "#c2b3c4")[i % 4]]) { position(x, FLOOR_TOP - h) }
                    for (wx in 0 until 3) for (wy in 0 until (h / 70).toInt()) c.solidRect(46, 34, Colors["#e8f1fa"]) { position(x + 22 + wx * 70, FLOOR_TOP - h + 24 + wy * 70) }
                    if (i == 0) {
                        c.solidRect(260, 60, Colors["#2f5d9e"]) { position(x + 260, 120) }
                        c.text("麻布十番駅", 30, Pal.text, font) { position(x + 290, 130) }
                    }
                    if (i % 3 == 2) c.solidRect(200, 120, Colors["#8c8378"]) { position(x + 240, FLOOR_TOP - 120) }
                }
                Scenery.OFFICE -> {
                    // 窓（遠くに東京タワー）と机
                    c.solidRect(260, 250, Colors["#9fc8ef"]) { position(x, 70) }
                    c.solidRect(260, 8, Colors["#c5cdd6"]) { position(x, 190) }
                    if (i % 4 == 1) {
                        c.solidRect(10, 120, Colors["#e0533d"]) { position(x + 125, 200) }
                        c.solidRect(60, 8, Colors["#e0533d"]) { position(x + 100, 260) }
                    }
                    c.solidRect(220, 26, Colors["#c79a6a"]) { position(x + 20, FLOOR_TOP - 70) }
                    c.solidRect(70, 50, Colors["#2d3440"]) { position(x + 60, FLOOR_TOP - 120) }
                }
            }
            x += 430
            i++
        }
        if (!title && s == Scenery.OFFICE) {
            c.solidRect(220, 90, Colors["#fff8e6"]) { position(width - 1300, 120) }
            c.text("窓際族", 44, Colors["#222222"], font) { position(width - 1265, 135) }
        }
    }

    private fun drawGate(c: Container, x: Double): View = c.container {
        position(x - 30, 0)
        solidRect(60, SCREEN_H, Colors["#3a3f47"])
        var yy = 0.0
        while (yy < SCREEN_H) { solidRect(60, 14, Colors["#ffd23d"]) { y = yy }; yy += 56 }
        text("GATE", 18, Pal.text, font) { position(6, FLOOR_TOP - 40) }
    }

    private fun drawGoal(c: Container, b: Battle): View {
        val gx = b.goalX
        when (b.stage.scenery) {
            Scenery.FACTORY -> {
                c.solidRect(230, 330, Colors["#e6c35c"]) { position(gx - 115, FLOOR_TOP - 290) }
                c.text("できたて", 30, Colors["#5a3a0a"], font) { position(gx - 60, FLOOR_TOP - 230) }
                c.text("ビール", 30, Colors["#5a3a0a"], font) { position(gx - 45, FLOOR_TOP - 190) }
                c.solidRect(26, 40, Colors["#7a7f86"]) { position(gx - 13, FLOOR_TOP - 30) }
            }
            Scenery.STREET -> {
                c.solidRect(420.0, FLOOR_TOP, Colors["#2c3442"]) { position(gx - 210, 0) }
                c.text("あくしでんちゅあ", 30, Pal.text, font) { position(gx - 130, 60) }
                c.solidRect(200, 210, Colors["#8fd0ff"]) { position(gx - 100, FLOOR_TOP - 210) }
            }
            Scenery.OFFICE -> drawStandingBar(c, gx)
        }
        return c.ellipse(Size(150, 50), Colors["#ffd23d66"], Colors["#ffd23d"], 4.0) { position(gx - 150, FLOOR_TOP + DEPTH * 0.5 - 50) }
    }

    /** 窓際の立ち飲み処（紺の暖簾・赤提灯・ビールサーバ。WORLD_BIBLE の窓際族エリア） */
    private fun drawStandingBar(c: Container, cx: Double) {
        c.solidRect(420, 70, Colors["#1f2f5a"]) { position(cx - 210, 120) }
        for (k in 0 until 4) c.solidRect(4, 70, Colors["#16223f"]) { position(cx - 210 + 105 * k + 52, 120) }
        c.text("立ち飲み処", 32, Pal.text, font) { position(cx - 80, 136) }
        c.circle(26, Colors["#d8452f"]) { position(cx - 270, 200) }
        c.circle(26, Colors["#d8452f"]) { position(cx + 218, 200) }
        c.solidRect(420, 150, Colors["#8a5a33"]) { position(cx - 210, FLOOR_TOP - 150) }
        c.solidRect(60, 90, Colors["#c9ced6"]) { position(cx - 30, FLOOR_TOP - 240) }
        c.solidRect(22, 34, Pal.beer) { position(cx - 11, FLOOR_TOP - 180) }
    }

    private fun drawPickup(c: Container, pk: Pickup): View = c.container {
        position(pk.x, FLOOR_TOP + pk.y)
        ellipse(Size(22, 8), Pal.shadow) { position(-22, -6) }
        if (pk.beer) {
            solidRect(24, 34, Pal.beer) { position(-12, -44) }
            solidRect(24, 8, Colors["#fff6e0"]) { position(-12, -50) }
        } else {
            solidRect(34, 14, Colors["#5f9e3c"]) { position(-17, -22) }
            for (k in 0 until 3) circle(5, Colors["#9bd36a"]) { position(-15 + k * 10, -24) }
        }
    }

    // ---------------------------------------------------------------- 浮かぶ演出

    private class Floating(val view: View, val ttl: Double, val rise: Double = 0.0, val grow: Double = 1.0) {
        var t = 0.0
    }

    private fun updateFloating(d: Double) {
        val it = floating.iterator()
        while (it.hasNext()) {
            val f = it.next()
            f.t += d
            val k = f.t / f.ttl
            f.view.y -= f.rise * d / f.ttl
            f.view.alpha = (1.0 - k).coerceIn(0.0, 1.0)
            if (f.grow != 1.0) f.view.scale(1.0 + (f.grow - 1.0) * k)
            if (k >= 1.0) { f.view.removeFromParent(); it.remove() }
        }
    }

    // ---------------------------------------------------------------- 自動プレイと撮影（動作確認用）

    private fun requestShot(name: String) {
        if (name in shotsTaken) return
        if (shotsDir == null) shotsTaken += name else if (pendingShot == null) pendingShot = name
    }

    /**
     * MADOGIWA_AUTO=1 で起動すると、ボットが全3ステージを通しで遊び、
     * MADOGIWA_SHOTS に指定したディレクトリへ要所のスクリーンショットを書き出して終了する。
     */
    private suspend fun SContainer.runAuto() {
        delay(0.4.seconds)
        shot("title")
        startStage(0)
        var lastLog = 0.0
        while (true) {
            delay(50.milliseconds)
            pendingShot?.let { shot(it); pendingShot = null }
            val b = battle
            if (screen == Screen.ENDING && "ending" in shotsTaken) break
            if (b == null) continue
            val n = b.stage.number
            when {
                b.time > 1.5 && b.koTotal == 0 -> requestShot("s${n}_start")
                b.enemies.size >= 9 -> requestShot("s${n}_crowd")
                b.player.state == PState.MUSOU && b.player.t > 0.6 -> requestShot("s${n}_musou")
                b.enemies.any { it.state == EState.SPECIAL && it.hitDone } -> requestShot("s${n}_boss_pound")
                b.goalOpen && b.grab > 0.5 -> requestShot("s${n}_goal")
            }
            if (b.time - lastLog > 30) {
                lastLog = b.time
                println("AUTO: stage=$n zone=${b.zone} ko=${b.koTotal} hp=${b.player.hp.toInt()} enemies=${b.enemies.size} t=${b.time.toInt()}")
            }
            if (b.phase == Phase.WIN && resultShown && "s${n}_result" in shotsTaken) {
                println("AUTO: stage $n clear ko=${b.koTotal} maxCombo=${b.maxCombo} time=${b.time.toInt()}s")
                nextStage()
            }
            if (b.phase == Phase.LOSE && resultShown) { println("AUTO: stage $n lost"); break }
            if (b.time > 900) { println("AUTO: timeout stage=$n zone=${b.zone}"); break }
        }
        views.gameWindow.close(0)
    }

    private suspend fun SContainer.shot(name: String) {
        shotsTaken += name
        val dir = shotsDir ?: return
        stage!!.renderToBitmap(views).writeTo(localVfs("$dir/$name.png"), PNG)
        println("AUTO: shot $name")
    }

    // ---------------------------------------------------------------- 部品

    /** そば屋・敵1人ぶんの表示（影・スプライト・名札・目を回す★） */
    private inner class ActorView(parent: Container, val sheet: Sheet, val scaleK: Double, name: String?, labelFont: TtfFont? = null) {
        val root = parent.container()
        val shadow = root.ellipse(Size(46 * scaleK, 14 * scaleK), Pal.shadow) { position(-46 * scaleK, -14 * scaleK) }
        val auraView = root.ellipse(Size(130.0, 40.0), Colors["#ffc23d55"], Pal.gold, 4.0) { position(-130, -40); visible = false }
        val image = root.image(sheet.frameAt(sheet.anims.keys.first(), 0.0)) { smoothing = true }
        val label = if (name != null && labelFont != null) root.text(name, 18, Pal.gold, labelFont) { position(-36, -sheet.pivotY * scaleK * 0.72 - 30) } else null
        val starText = root.text("★ ★", 22, Pal.gold, font) { visible = false }
        var lastX = 0.0
        var lastY = 0.0

        fun update(a: Actor, frame: korlibs.image.bitmap.BmpSlice, alpha: Double) {
            root.x = a.x
            root.y = FLOOR_TOP + a.y
            root.zIndex = a.y
            image.bitmap = frame
            image.scaleX = scaleK * a.facing
            image.scaleY = scaleK
            image.x = -sheet.pivotX * scaleK * a.facing
            image.y = -sheet.pivotY * scaleK - a.z
            root.alpha = alpha
            shadow.scaleX = (1.0 - min(0.5, a.z / 600))
        }

        fun stars(on: Boolean, t: Double) {
            starText.visible = on
            if (on) starText.position(-30 + 8 * sin(t * 8), -70.0)
        }

        fun aura(on: Boolean, t: Double) {
            auraView.visible = on
            if (on) auraView.alpha = 0.6 + 0.4 * sin(t * 18)
        }

        fun rage(on: Boolean) { image.colorMul = if (on) Colors["#ffb4a8"] else Colors.WHITE }

        fun remove() = root.removeFromParent()
    }

    /** 画面上部・下部の表示 */
    private inner class Hud(parent: Container) {
        val c = parent.container()
        init { c.solidRect(SCREEN_W, 86, Colors["#0c0d12bb"]) }
        val hpLabel = c.text("体力", 18, Pal.text, font) { position(20, 12) }
        val hpBack = c.solidRect(360, 18, Colors["#3a2a2a"]) { position(80, 16) }
        val hpBar = c.solidRect(360, 18, Pal.green) { position(80, 16) }
        val musouLabel = c.text("無双", 18, Pal.gold, font) { position(20, 46) }
        val musouBack = c.solidRect(360, 18, Colors["#3a3020"]) { position(80, 50) }
        val musouBar = c.solidRect(0, 18, Pal.beer) { position(80, 50) }
        val musouHint = c.text("", 16, Pal.gold, font) { position(452, 48) }
        val objective = c.text("", 20, Pal.text, font) { position(470, 12) }
        val ko = c.text("", 30, Pal.gold, font) { position(SCREEN_W - 230, 10) }
        val timeText = c.text("", 18, Pal.dim, font) { position(SCREEN_W - 230, 52) }
        val comboText = c.text("", 34, Pal.gold, font) { position(SCREEN_W - 260, 120) }
        val bossBox = c.container { visible = false }
        val bossName = bossBox.text("", 20, Pal.text, font) { position(340, 640) }
        val bossBack = bossBox.solidRect(600, 16, Colors["#3a2a2a"]) { position(340, 672) }
        val bossBar = bossBox.solidRect(600, 16, Pal.red) { position(340, 672) }
        val grabBox = c.container { visible = false }
        val grabBack = grabBox.solidRect(300, 16, Colors["#30303a"]) { position(490, 560) }
        val grabBar = grabBox.solidRect(0, 16, Pal.gold) { position(490, 560) }
        val grabText = grabBox.text("", 20, Pal.text, font) { position(490, 528) }
        val bannerText = c.text("", 46, Pal.gold, font) { position(0, 150) }
        val bannerSub = c.text("", 22, Pal.text, font) { position(0, 214) }
        val speechBox = c.container { visible = false }
        val speechBg = speechBox.solidRect(10, 40, Colors["#fffdf6"])
        val speechText = speechBox.text("", 22, Colors["#222222"], font) { position(12, 6) }
        var bannerT = 0.0
        var speechT = 0.0
        var lastClock = 0.0

        fun banner(text: String, sub: String) {
            bannerText.text = text
            bannerSub.text = sub
            bannerText.x = (SCREEN_W - text.length * 46.0) / 2
            bannerSub.x = (SCREEN_W - sub.length * 22.0) / 2
            bannerT = 2.6
        }

        fun speech(text: String) {
            speechText.text = text
            speechBg.width = text.length * 22.0 + 24
            speechT = 2.0
        }

        fun update(b: Battle, clock: Double) {
            val d = clock - lastClock
            lastClock = clock
            val p = b.player
            hpBar.width = 360 * (p.hp / PLAYER_MAX_HP)
            hpBar.color = if (p.hp < PLAYER_MAX_HP * 0.3) Pal.red else Pal.green
            musouBar.width = 360 * (p.musou / MUSOU_MAX)
            val full = p.musou >= MUSOU_MAX && p.state != PState.MUSOU
            musouHint.text = if (full) "L で無双乱舞！" else ""
            musouBar.color = if (full && (clock * 6).toInt() % 2 == 0) Colors["#ffe27a"] else Pal.beer
            objective.text = when {
                b.phase == Phase.WIN -> b.stage.clearText
                b.goalOpen -> "${b.stage.goalLabel}へ（${b.stage.goalAction}）"
                b.zoneActive -> "エリア${b.zone + 1} ${b.currentZone.name}　残り ${max(0, b.currentZone.quota - b.zoneKo)} 人"
                else -> "→ 先へ進め"
            }
            ko.text = "${b.koTotal} KO"
            timeText.text = "STAGE ${b.stage.number}　${formatTime(b.time)}"
            comboText.text = if (b.combo >= 3) "${b.combo} HIT!" else ""
            val boss = b.leader?.takeIf { it.hp > 0 && it in b.enemies }
            bossBox.visible = boss != null
            if (boss != null) {
                bossName.text = (boss.title ?: boss.kind.title ?: "") + if (boss.enraged) "（怒り）" else ""
                bossBar.width = 600 * (boss.hp / boss.maxHp).coerceAtLeast(0.0)
            }
            grabBox.visible = b.goalOpen && b.phase == Phase.PLAY && abs(b.player.x - b.goalX) < 200
            grabBar.width = 300 * (b.grab / GRAB_TIME)
            grabText.text = b.stage.goalAction
            bannerT -= d
            bannerText.alpha = (bannerT / 0.5).coerceIn(0.0, 1.0)
            bannerSub.alpha = bannerText.alpha
            speechT -= d
            speechBox.visible = speechT > 0
            speechBox.position(p.x - b.camX - 40, FLOOR_TOP + p.y - 280)
        }
    }
}
