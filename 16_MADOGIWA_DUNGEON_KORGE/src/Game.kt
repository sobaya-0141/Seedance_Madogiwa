import kotlin.math.abs
import kotlin.math.max
import kotlin.random.Random

const val LAST_FLOOR = 5

enum class Facing { DOWN, UP, LEFT, RIGHT }

/**
 * 敵はすべて「オフィスの物・現象」。人を攻撃する話にはしない（WORLD_BIBLEの禁止事項）。
 * 倒す＝そば屋が黙々と「片付ける」。
 */
enum class EnemyKind(
    val label: String, val hp: Int, val atk: Int, val def: Int, val exp: Int, val minFloor: Int,
    val attackText: String,
) {
    PAPERS("書類の山", 6, 3, 0, 3, 1, "書類の山が崩れてきた！"),
    ROOMBA("暴走ルンバ", 5, 3, 0, 3, 1, "暴走ルンバに足を轢かれた！"),
    CABLE("からまるLANケーブル", 10, 4, 1, 5, 2, "LANケーブルが足に絡まった！"),
    PHONE("鳴りやまない内線電話", 9, 5, 1, 6, 3, "内線電話がけたたましく鳴った！"),
    SHREDDER("自走シュレッダー", 15, 6, 2, 9, 4, "シュレッダーにTシャツの裾をかまれた！"),
    BOSS("巨大アーロンチュア", 48, 7, 2, 30, 99, "巨大アーロンチュアが段ボールを降らせてきた！"),
}

class Enemy(val kind: EnemyKind, var x: Int, var y: Int) {
    var hp = kind.hp
    val maxHp = kind.hp
}

enum class ItemKind(val label: String) {
    EDAMAME("枝豆"),
    YAKITORI("焼き鳥"),
    JOCKEY("ビールジョッキ"),
    SERVER("伝説のビールサーバ"),
}

class Item(val kind: ItemKind, val x: Int, val y: Int)

/** 会話に出る人物。spriteId は resources/chars/<id>/ のボクセル立ち絵 */
enum class Speaker(val displayName: String, val spriteId: String?) {
    SOBAYA("そば屋", "sobaya"),
    TOKUN("とーくん", "tokun"),
    YOTAN("よーたん", "yotan"),
    FUKUGYUN("福ギュン", "fukuchan"),
    YAMETARO("やめたろう", "yametaro"),
    OKAYAMAN("おかやまん", "okayaman"),
    NARRATION("", null),
}

class Line(val speaker: Speaker, val text: String)

class Npc(val speaker: Speaker, val x: Int, val y: Int) {
    var talked = false
}

class Player {
    var x = 0
    var y = 0
    var facing = Facing.DOWN
    var level = 1
    var exp = 0
    var maxHp = 30
    var hp = 30
    var atk = 5
    var def = 1
    val nextExp get() = level * 10
}

/** 画面に浮かせる演出（ダメージ数字など）。シーン側が受け取って消費する */
class Fx(val x: Int, val y: Int, val text: String, val kind: FxKind)
enum class FxKind { DAMAGE_TO_ENEMY, DAMAGE_TO_PLAYER, HEAL, POWER }

enum class Mode { PLAY, DIALOGUE, CLEAR }

class Game(seed: Int) {
    val rng = Random(seed)
    var floor = 1
    var attempt = 1
    var turn = 0
    var map = DungeonMap()
    val player = Player()
    val enemies = mutableListOf<Enemy>()
    val items = mutableListOf<Item>()
    val npcs = mutableListOf<Npc>()
    val seen = Array(MAP_H) { BooleanArray(MAP_W) }
    val visible = Array(MAP_H) { BooleanArray(MAP_W) }
    val log = ArrayDeque<String>()
    val fx = mutableListOf<Fx>()
    var mode = Mode.PLAY
    val dialogue = ArrayDeque<Line>()
    var bossDefeated = false
    /** ボス階の段ボール奥にあるサーバの位置（ボスを片付けると出現） */
    private var serverPos: Pair<Int, Int>? = null
    private var afterDialogue: (() -> Unit)? = null

    val currentLine get() = dialogue.firstOrNull()

    init {
        enterFloor(1)
    }

    fun message(text: String) {
        log.addLast(text)
        while (log.size > 4) log.removeFirst()
    }

    private fun say(vararg lines: Line, then: (() -> Unit)? = null) {
        dialogue.addAll(lines)
        afterDialogue = then
        mode = Mode.DIALOGUE
    }

    fun advanceDialogue() {
        if (mode != Mode.DIALOGUE) return
        dialogue.removeFirstOrNull()
        if (dialogue.isEmpty()) {
            mode = Mode.PLAY
            val next = afterDialogue
            afterDialogue = null
            next?.invoke()
        }
    }

    // ---------------------------------------------------------------- フロア生成

    private fun enterFloor(n: Int) {
        floor = n
        val boss = n == LAST_FLOOR
        map = generateDungeon(rng, boss)
        enemies.clear(); items.clear(); npcs.clear()
        for (row in seen) row.fill(false)
        val rooms = map.rooms
        val start = rooms.first()
        player.x = start.cx; player.y = start.cy; player.facing = Facing.DOWN

        val far = rooms.last()
        if (boss) {
            enemies += Enemy(EnemyKind.BOSS, far.cx, far.cy)
            serverPos = far.cx to far.cy
        } else {
            map[far.cx, far.cy] = Tile.STAIRS
        }

        // 仲間は各階に1人。スタート部屋と最奥の部屋以外に置く
        npcForFloor(n)?.let { sp ->
            val room = rooms.getOrNull(1 + rng.nextInt(max(1, rooms.size - 2))) ?: rooms[1]
            freeTileIn(room)?.let { (x, y) -> npcs += Npc(sp, x, y) }
        }

        val kinds = EnemyKind.entries.filter { it.minFloor <= n }
        repeat(if (boss) 3 else 3 + n) {
            val room = rooms[1 + rng.nextInt(rooms.size - 1)]
            freeTileIn(room)?.let { (x, y) -> enemies += Enemy(kinds.random(rng), x, y) }
        }
        repeat(if (boss) 2 else 3) {
            val room = rooms[rng.nextInt(rooms.size)]
            val roll = rng.nextInt(10)
            val kind = when {
                roll < 5 -> ItemKind.EDAMAME
                roll < 8 -> ItemKind.YAKITORI
                else -> ItemKind.JOCKEY
            }
            freeTileIn(room)?.let { (x, y) -> items += Item(kind, x, y) }
        }

        updateVisibility()
        message("地下${n}階に着いた。")
        if (boss) {
            say(
                Line(Speaker.OKAYAMAN, "おかやまん。地下5階まで来られるとは、大変驚いております。"),
                Line(Speaker.OKAYAMAN, "伝説のビールサーバは、あの巨大アーロンチュアの奥にございます。"),
                Line(Speaker.SOBAYA, "窓際王さま、画面越しの応援ありがとうございます！ 行ってきます！"),
            )
        }
    }

    private fun npcForFloor(n: Int) = when (n) {
        1 -> Speaker.TOKUN
        2 -> Speaker.YOTAN
        3 -> Speaker.FUKUGYUN
        4 -> Speaker.YAMETARO
        else -> null
    }

    private fun occupied(x: Int, y: Int) =
        (player.x == x && player.y == y) || enemies.any { it.x == x && it.y == y } ||
            npcs.any { it.x == x && it.y == y } || items.any { it.x == x && it.y == y } || map[x, y] == Tile.STAIRS

    private fun freeTileIn(room: Room): Pair<Int, Int>? {
        repeat(30) {
            val x = room.x + rng.nextInt(room.w)
            val y = room.y + rng.nextInt(room.h)
            if (map.walkable(x, y) && !occupied(x, y)) return x to y
        }
        return null
    }

    // ---------------------------------------------------------------- 視界

    fun updateVisibility() {
        for (row in visible) row.fill(false)
        val r = 6
        for (y in player.y - r..player.y + r) for (x in player.x - r..player.x + r) {
            if (!map.inBounds(x, y)) continue
            if ((x - player.x) * (x - player.x) + (y - player.y) * (y - player.y) > r * r + 1) continue
            if (lineOfSight(player.x, player.y, x, y)) { visible[y][x] = true; seen[y][x] = true }
        }
    }

    /** ブレゼンハムで壁に遮られないか。終点の壁自体は見える */
    private fun lineOfSight(x0: Int, y0: Int, x1: Int, y1: Int): Boolean {
        var x = x0; var y = y0
        val dx = abs(x1 - x0); val dy = -abs(y1 - y0)
        val sx = if (x0 < x1) 1 else -1; val sy = if (y0 < y1) 1 else -1
        var err = dx + dy
        while (!(x == x1 && y == y1)) {
            if (!(x == x0 && y == y0) && !map.walkable(x, y)) return false
            val e2 = 2 * err
            if (e2 >= dy) { err += dy; x += sx }
            if (e2 <= dx) { err += dx; y += sy }
        }
        return true
    }

    fun revealFloor() {
        for (y in 0 until MAP_H) for (x in 0 until MAP_W) if (map.isVisibleWall(x, y) || map.walkable(x, y)) seen[y][x] = true
    }

    // ---------------------------------------------------------------- プレイヤーの行動

    fun tryMove(dx: Int, dy: Int) {
        if (mode != Mode.PLAY) return
        player.facing = when {
            dx < 0 -> Facing.LEFT
            dx > 0 -> Facing.RIGHT
            dy < 0 -> Facing.UP
            else -> Facing.DOWN
        }
        val nx = player.x + dx
        val ny = player.y + dy
        enemies.firstOrNull { it.x == nx && it.y == ny }?.let { attack(it); endTurn(); return }
        npcs.firstOrNull { it.x == nx && it.y == ny }?.let { talk(it); return }
        if (!map.walkable(nx, ny)) return
        player.x = nx; player.y = ny
        items.firstOrNull { it.x == nx && it.y == ny }?.let { pickUp(it) }
        if (mode == Mode.CLEAR) return
        if (map[nx, ny] == Tile.STAIRS) {
            message("段ボールの階段を降りた。")
            enterFloor(floor + 1)
            return
        }
        endTurn()
    }

    /** その場で一息つく（1ターン経過） */
    fun rest() {
        if (mode != Mode.PLAY) return
        if (turn % 2 == 0) heal(1, quiet = true)
        endTurn()
    }

    private fun attack(e: Enemy) {
        val dmg = max(1, player.atk - e.kind.def + rng.nextInt(-1, 2))
        e.hp -= dmg
        fx += Fx(e.x, e.y, "$dmg", FxKind.DAMAGE_TO_ENEMY)
        if (e.hp > 0) {
            message("そば屋の怪力！ ${e.kind.label}に${dmg}のダメージ。")
            return
        }
        enemies.remove(e)
        if (e.kind == EnemyKind.BOSS) {
            bossDefeated = true
            message("巨大アーロンチュアは崩れて、ただの段ボールに戻った！")
            val (sx, sy) = serverPos ?: (e.x to e.y)
            items += Item(ItemKind.SERVER, sx, sy)
            say(
                Line(Speaker.NARRATION, "ガラガラガラ……巨大アーロンチュアは崩れて、ただの段ボールの山になった。"),
                Line(Speaker.SOBAYA, "崩れた段ボールは、あとで椅子に組み直しますね。"),
                Line(Speaker.NARRATION, "段ボールの奥で、伝説のビールサーバが光っている！"),
            )
        } else {
            message("${e.kind.label}を片付けた！（経験値+${e.kind.exp}）")
        }
        gainExp(e.kind.exp)
    }

    private fun gainExp(n: Int) {
        player.exp += n
        while (player.exp >= player.nextExp) {
            player.exp -= player.nextExp
            player.level++
            player.maxHp += 6
            player.atk += 1
            if (player.level % 2 == 0) player.def += 1
            player.hp = player.maxHp
            fx += Fx(player.x, player.y, "LEVEL UP", FxKind.POWER)
            message("レベル${player.level}に上がった！「快適です！」")
        }
    }

    private fun heal(n: Int, quiet: Boolean = false) {
        val before = player.hp
        player.hp = (player.hp + n).coerceAtMost(player.maxHp)
        if (!quiet && player.hp > before) fx += Fx(player.x, player.y, "+${player.hp - before}", FxKind.HEAL)
    }

    private fun pickUp(item: Item) {
        items.remove(item)
        when (item.kind) {
            ItemKind.EDAMAME -> { heal(8); message("枝豆をつまんだ。元気が回復した。") }
            ItemKind.YAKITORI -> { heal(14); message("焼き鳥をほおばった。元気がかなり回復した。") }
            ItemKind.JOCKEY -> {
                player.atk += 1; heal(5)
                fx += Fx(player.x, player.y, "攻撃+1", FxKind.POWER)
                message("ビールジョッキで乾杯！ ほろ酔いパワーで攻撃力+1。")
            }
            ItemKind.SERVER -> {
                message("伝説のビールサーバを手に入れた！")
                mode = Mode.CLEAR
            }
        }
    }

    private fun talk(npc: Npc) {
        if (npc.talked) {
            say(repeatLine(npc.speaker))
            return
        }
        npc.talked = true
        when (npc.speaker) {
            Speaker.TOKUN -> say(
                Line(Speaker.TOKUN, "おっ、そば屋さん！ 地下でもウクレレは絶好調だよ〜♪"),
                Line(Speaker.TOKUN, "伝説のビールサーバ？ 地下5階にあるってウワサだね。景気づけに一曲どうぞ！"),
                Line(Speaker.NARRATION, "ウクレレの音色で、そば屋の元気が全回復した！"),
                Line(Speaker.SOBAYA, "地下なのにBGM付き。快適です！"),
            ) { heal(player.maxHp) }
            Speaker.YOTAN -> say(
                Line(Speaker.YOTAN, "CTO権限で、このフロアの図面を出しておいた。"),
                Line(Speaker.YOTAN, "あと差し入れ。焼き鳥、持ってけ。"),
                Line(Speaker.NARRATION, "フロアの地図が見えるようになった！ 焼き鳥で元気も回復した。"),
            ) { revealFloor(); heal(14) }
            Speaker.FUKUGYUN -> say(
                Line(Speaker.FUKUGYUN, "あっ、そば屋さん！ ちょうど段ボールの前で自撮りしてたところです〜"),
                Line(Speaker.FUKUGYUN, "元気が出るポーズ、教えますね。せーの……ギュンギュン！"),
                Line(Speaker.NARRATION, "ギュンギュンパワーで攻撃力が2上がった！"),
                Line(Speaker.SOBAYA, "ギュンギュン！ メリットしかありません！"),
            ) { player.atk += 2; fx += Fx(player.x, player.y, "攻撃+2", FxKind.POWER) }
            Speaker.YAMETARO -> say(
                Line(Speaker.YAMETARO, "ひっ、そば屋さん！？ ……どうせワイなんて、こんな地下に隠れるしかないんや。"),
                Line(Speaker.SOBAYA, "やめさん！ ここ、隠れ家として快適ですね！"),
                Line(Speaker.YAMETARO, "この下にでっかいアーロンチュアがおるで。これ、段ボールの盾や。持ってき。"),
                Line(Speaker.NARRATION, "段ボールの盾で防御力が2上がった！"),
            ) { player.def += 2; fx += Fx(player.x, player.y, "防御+2", FxKind.POWER) }
            else -> Unit
        }
    }

    private fun repeatLine(sp: Speaker) = when (sp) {
        Speaker.TOKUN -> Line(sp, "♪〜（ウクレレを弾き続けている）")
        Speaker.YOTAN -> Line(sp, "階段は地図のいちばん奥だ。気をつけてな。")
        Speaker.FUKUGYUN -> Line(sp, "ギュンギュン！ 自撮り、あとでみんなに送りますね〜")
        Speaker.YAMETARO -> Line(sp, "ワイがここにおること、手配書の人らには内緒やで。")
        else -> Line(sp, "……")
    }

    // ---------------------------------------------------------------- 敵のターン

    private fun endTurn() {
        turn++
        if (turn % 8 == 0) heal(1, quiet = true)
        updateVisibility()
        for (e in enemies.toList()) enemyAct(e)
        updateVisibility()
        if (player.hp <= 0) knockedOut()
    }

    private fun enemyAct(e: Enemy) {
        if (player.hp <= 0) return
        val dist = abs(e.x - player.x) + abs(e.y - player.y)
        if (dist == 1) {
            val dmg = max(1, e.kind.atk - player.def + rng.nextInt(-1, 2))
            player.hp -= dmg
            fx += Fx(player.x, player.y, "$dmg", FxKind.DAMAGE_TO_PLAYER)
            message("${e.kind.attackText} ${dmg}のダメージ。")
            return
        }
        val chasing = visible[e.y][e.x] && dist <= 8
        val options = DIRS.map { (dx, dy) -> e.x + dx to e.y + dy }.filter { (x, y) -> map.walkable(x, y) && !blocked(x, y) }
        if (options.isEmpty()) return
        val step = if (chasing) {
            options.minBy { (x, y) -> abs(x - player.x) + abs(y - player.y) }
        } else {
            // ボスは部屋から動かない。雑魚は気ままにうろつく
            if (e.kind == EnemyKind.BOSS || rng.nextInt(2) == 0) return
            options.random(rng)
        }
        e.x = step.first; e.y = step.second
    }

    private fun blocked(x: Int, y: Int) =
        (player.x == x && player.y == y) || enemies.any { it.x == x && it.y == y } || npcs.any { it.x == x && it.y == y }

    /** 元気が尽きても暗くしない。仲間に担がれて屋台で一杯→地下1階から再挑戦 */
    private fun knockedOut() {
        player.hp = 0
        say(
            Line(Speaker.NARRATION, "そば屋の元気が尽きた……"),
            Line(Speaker.NARRATION, "仲間たちに担がれて、地上の屋台へ。ビールを一杯飲んだら元気が戻った！"),
            Line(Speaker.SOBAYA, "もう一回潜れるなんて、メリットでもあります！"),
        ) { restart() }
    }

    private fun restart() {
        attempt++
        with(player) { level = 1; exp = 0; maxHp = 30; hp = 30; atk = 5; def = 1 }
        bossDefeated = false
        log.clear()
        message("${attempt}回目の挑戦！")
        enterFloor(1)
    }

    // ---------------------------------------------------------------- 自動プレイ（動作確認用）

    /** 地図を全部知っている前提で、仲間→アイテム→ボス→階段（サーバ）の順に向かう */
    fun autoStep() {
        when (mode) {
            Mode.DIALOGUE -> { advanceDialogue(); return }
            Mode.CLEAR -> return
            Mode.PLAY -> Unit
        }
        enemies.firstOrNull { abs(it.x - player.x) + abs(it.y - player.y) == 1 }?.let {
            tryMove(it.x - player.x, it.y - player.y); return
        }
        val targets = buildList {
            npcs.filter { !it.talked }.forEach { add(it.x to it.y) }
            if (player.hp < player.maxHp * 0.6) items.filter { it.kind != ItemKind.SERVER }.forEach { add(it.x to it.y) }
            items.filter { it.kind == ItemKind.JOCKEY || it.kind == ItemKind.SERVER }.forEach { add(it.x to it.y) }
            // 体力が少ないうちはボスに近づかない
            if (player.hp > player.maxHp / 2) enemies.filter { it.kind == EnemyKind.BOSS }.forEach { add(it.x to it.y) }
            for (y in 0 until MAP_H) for (x in 0 until MAP_W) if (map[x, y] == Tile.STAIRS) add(x to y)
        }
        for ((tx, ty) in targets) {
            // 話し終えた仲間は通路をふさぐ障害物として迂回する
            val step = firstStepToward(map, player.x, player.y, tx, ty) { x, y -> npcs.any { it.x == x && it.y == y } } ?: continue
            tryMove(step.first, step.second)
            return
        }
        rest()
    }
}
