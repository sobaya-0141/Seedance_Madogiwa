import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sign
import kotlin.math.sqrt
import kotlin.random.Random

/** 毎フレームの入力（キーボードでも自動プレイでも同じ形） */
class Input {
    var moveX = 0.0
    var moveY = 0.0
    var attack = false
    var charge = false
    var musou = false
    var dodge = false
    var interact = false
}

enum class PState { MOVE, ATTACK, DODGE, HURT, MUSOU, DOWN, WIN }
enum class EState { CHASE, ATTACK, SPECIAL, HIT, FLY, LYING }
enum class Phase { PLAY, WIN, LOSE }

/** 画面に出す演出。シーン側が受け取って消費する */
sealed class Fx {
    class Hit(val x: Double, val y: Double, val heavy: Boolean) : Fx()
    class Text(val x: Double, val y: Double, val text: String, val big: Boolean) : Fx()
    class Wave(val x: Double, val y: Double, val radius: Double, val enemy: Boolean) : Fx()
    class Banner(val text: String, val sub: String = "") : Fx()
    class Speech(val text: String) : Fx()
    class Shake(val amount: Double) : Fx()
}

open class Actor {
    var x = 0.0
    /** 奥行き（0..DEPTH） */
    var y = 0.0
    /** 高さ（吹っ飛びの放物線） */
    var z = 0.0
    var vx = 0.0
    var vy = 0.0
    var vz = 0.0
    /** +1 右向き / -1 左向き */
    var facing = 1.0
    var t = 0.0
}

class Player : Actor() {
    var state = PState.MOVE
    var hp = PLAYER_MAX_HP
    var musou = 0.0
    var invuln = 0.0
    var move: Move = COMBO[0]
    var comboIndex = 0
    var queued: String? = null
    var hitDone = false
    var dodgeDir = 1.0 to 0.0
    var musouTick = 0.0
    val moveDuration get() = move.let { (animLength[it.anim] ?: 1.0) / it.speed }
    var running = false

    companion object {
        /** シートから読んだクリップの長さ（秒）。Battle を描画と切り離すため、シーンが起動時に入れる */
        val animLength = mutableMapOf<String, Double>()
    }
}

class Enemy(val kind: EnemyKind, val title: String?, hpScale: Double) : Actor() {
    var state = EState.CHASE
    val maxHp = kind.hp * hpScale
    var hp = maxHp
    var attackCd = 1.0
    var specialCd = SPECIAL_COOLDOWN * 0.6
    var token = false
    var hitDone = false
    var secondPound = false
    var removed = false
    var alpha = 1.0
    /** 囲むときの持ち場（プレイヤーからの相対位置） */
    var ringX = 0.0
    var ringY = 0.0
    val isLeader get() = kind.armor
    val enraged get() = kind == EnemyKind.BOSS && hp < maxHp * 0.5

    companion object {
        val animLength = mutableMapOf<String, Double>()
    }

    fun len(anim: String) = animLength["${kind.sheet}/$anim"] ?: 1.0
}

class Pickup(val beer: Boolean, val x: Double, val y: Double) {
    var taken = false
    var t = 0.0
}

class Battle(val stage: StageDef, seed: Int = 1) {
    private val rng = Random(seed)
    val player = Player().apply { x = 260.0; y = DEPTH * 0.55 }
    val enemies = mutableListOf<Enemy>()
    val pickups = mutableListOf<Pickup>()
    val fx = mutableListOf<Fx>()
    var phase = Phase.PLAY
    var phaseT = 0.0
    var time = 0.0

    var zone = 0
    var zoneActive = false
    var zoneSpawned = 0
    var zoneKo = 0
    var leaderSpawned = false
    var leader: Enemy? = null
    var gateOpen = BooleanArray(stage.zones.size)
    var goalOpen = false
    var grab = 0.0
    var koTotal = 0
    var combo = 0
    var comboTimer = 0.0
    var maxCombo = 0
    private var spawnTimer = 0.0
    var camX = 0.0

    val stageLength get() = ZONE_W * stage.zones.size
    val goalX get() = stageLength - 260.0
    val zoneStart get() = zone * ZONE_W
    val zoneEnd get() = (zone + 1) * ZONE_W
    val currentZone get() = stage.zones[min(zone, stage.zones.size - 1)]

    /** 自動プレイ用: 体力が減ったら回復して最後まで進める */
    var autoHeal = false

    fun update(dt: Double, input: Input) {
        time += dt
        phaseT += dt
        updateZone(dt)
        updatePlayer(dt, input)
        assignTokens()
        for (e in enemies) updateEnemy(e, dt)
        enemies.removeAll { it.removed }
        updatePickups(dt)
        if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo = 0 }
        updateCamera(dt)
        if (autoHeal && player.hp < 350 && player.state != PState.DOWN) player.hp = PLAYER_MAX_HP
    }

    // ---------------------------------------------------------------- エリア進行

    private fun updateZone(dt: Double) {
        if (phase != Phase.PLAY) return
        if (zone >= stage.zones.size) return
        val z = currentZone
        if (!zoneActive && player.x > zoneStart + 120) {
            zoneActive = true
            zoneSpawned = 0; zoneKo = 0; leaderSpawned = false; leader = null
            fx += Fx.Banner("エリア${zone + 1}  ${z.name}", "敵を全員倒してゲートを開けろ！")
        }
        if (!zoneActive) return
        if (z.leader != null && !leaderSpawned && zoneKo >= z.leaderAt) {
            leaderSpawned = true
            val e = spawn(z.leader, z.leaderTitle, z.leaderHpScale)
            leader = e
            fx += Fx.Banner("${z.leaderTitle} 登場！", if (z.leader == EnemyKind.BOSS) "地響きに注意！ Space で回避" else "大技（4段目・K・L）でしかひるまない")
        }
        spawnTimer -= dt
        val alive = enemies.count { it.state != EState.FLY && it.state != EState.LYING }
        if (zoneSpawned < z.quota && alive < MAX_ACTIVE && spawnTimer <= 0) {
            spawnTimer = 0.3
            spawn(pickKind(z), null, 1.0)
            zoneSpawned++
        }
        val leaderDone = z.leader == null || (leaderSpawned && (leader?.let { it.hp <= 0 } ?: true))
        if (zoneSpawned >= z.quota && enemies.isEmpty() && leaderDone) {
            zoneActive = false
            gateOpen[zone] = true
            if (zone == stage.zones.size - 1) {
                goalOpen = true
                fx += Fx.Banner("制圧完了！", "${stage.goalLabel}へ向かえ（${stage.goalAction}）")
            } else {
                fx += Fx.Banner("ゲート開放！", "次のエリアへ →")
            }
            zone++
        }
    }

    private fun pickKind(z: Zone): EnemyKind {
        var r = rng.nextDouble() * z.mix.values.sum()
        for ((k, w) in z.mix) { r -= w; if (r <= 0) return k }
        return z.mix.keys.first()
    }

    private fun spawn(kind: EnemyKind, title: String?, hpScale: Double): Enemy {
        val e = Enemy(kind, title, hpScale)
        val left = rng.nextBoolean() && camX - 80 > zoneStart
        e.x = if (left) camX - 90 else min(camX + SCREEN_W + 90, zoneEnd - 30)
        if (kind.armor) e.x = min(camX + SCREEN_W - 160, zoneEnd - 120)
        e.y = rng.nextDouble() * DEPTH
        e.facing = if (e.x > player.x) -1.0 else 1.0
        e.ringX = (if (rng.nextBoolean()) 1 else -1) * (2.2 + rng.nextDouble() * 1.6) * M
        e.ringY = (rng.nextDouble() - 0.5) * DEPTH * 0.9
        e.attackCd = 0.6 + rng.nextDouble()
        enemies += e
        return e
    }

    private fun updateCamera(dt: Double) {
        var target = player.x - SCREEN_W * 0.4
        val minX = 0.0
        val maxX = if (zoneActive) zoneEnd - SCREEN_W else stageLength - SCREEN_W
        val lowX = if (zoneActive) zoneStart else minX
        target = target.coerceIn(lowX, max(lowX, maxX))
        camX += (target - camX) * min(1.0, dt * 6.0)
    }

    // ---------------------------------------------------------------- プレイヤー

    private fun updatePlayer(dt: Double, input: Input) {
        val p = player
        p.t += dt
        p.invuln -= dt
        when (p.state) {
            PState.MOVE -> {
                if (phase != Phase.PLAY) return
                val mx = input.moveX; val my = input.moveY
                p.running = abs(mx) > 0.1 || abs(my) > 0.1
                val len = max(1.0, sqrt(mx * mx + my * my))
                p.x += mx / len * RUN_SPEED * M * dt
                p.y += my / len * RUN_SPEED * M * 0.6 * dt
                if (abs(mx) > 0.1) p.facing = sign(mx)
                when {
                    input.musou && p.musou >= MUSOU_MAX -> startMusou()
                    input.dodge -> startDodge(mx, my)
                    input.charge -> startMove(CHARGE)
                    input.attack -> { p.comboIndex = 0; startMove(COMBO[0]) }
                }
                if (goalOpen && abs(p.x - goalX) < 140 && input.interact) {
                    grab += dt
                    if (grab >= GRAB_TIME) win()
                } else {
                    grab = max(0.0, grab - dt * 2)
                }
            }
            PState.ATTACK -> {
                val d = p.moveDuration
                val frac = p.t / d
                if (frac < 0.4) p.x += p.facing * p.move.lunge * M * dt / (d * 0.4)
                if (input.attack) p.queued = "combo"
                if (input.charge) p.queued = "charge"
                if (input.dodge) p.queued = "dodge"
                if (!p.hitDone && frac >= p.move.hit) { p.hitDone = true; resolvePlayerHit(p.move) }
                if (frac >= p.move.cancel && p.queued != null) {
                    val q = p.queued; p.queued = null
                    when {
                        q == "dodge" -> startDodge(input.moveX, input.moveY)
                        q == "charge" && p.move !== CHARGE -> startMove(CHARGE)
                        q == "combo" && p.move !== CHARGE && p.comboIndex < COMBO.size - 1 -> {
                            p.comboIndex++
                            if (abs(input.moveX) > 0.1) p.facing = sign(input.moveX)
                            startMove(COMBO[p.comboIndex])
                        }
                    }
                }
                if (p.state == PState.ATTACK && frac >= p.move.end) { p.state = PState.MOVE; p.t = 0.0 }
            }
            PState.DODGE -> {
                val (dx, dy) = p.dodgeDir
                val v = DODGE_DISTANCE * M / DODGE_TIME
                p.x += dx * v * dt; p.y += dy * v * 0.6 * dt
                if (p.t >= DODGE_TIME) { p.state = PState.MOVE; p.t = 0.0 }
            }
            PState.HURT -> if (p.t >= 0.35) { p.state = PState.MOVE; p.t = 0.0 }
            PState.MUSOU -> {
                p.invuln = 0.2
                p.musou = MUSOU_MAX * (1 - p.t / MUSOU_TIME)
                p.musouTick -= dt
                if (p.musouTick <= 0) {
                    p.musouTick = MUSOU_TICK
                    p.facing = -p.facing
                    resolvePlayerHit(Move("charge", 1.0, 0.0, 0.0, 0.0, MUSOU_DMG, MUSOU_RANGE, true, 6.0, 6.0, 0.0, heavy = true))
                    fx += Fx.Wave(p.x, p.y, MUSOU_RANGE * M, false)
                }
                if (p.t >= MUSOU_TIME) { p.musou = 0.0; p.state = PState.MOVE; p.t = 0.0 }
            }
            PState.DOWN -> if (p.t > 2.2 && phase == Phase.PLAY) { phase = Phase.LOSE; phaseT = 0.0 }
            PState.WIN -> Unit
        }
        // 行ける範囲（未制圧のエリアから先へは出られない）
        // そば屋の絵は足元から左右に約80px広がるので、画面の端で切れないよう余白を取る
        val right = if (zone < stage.zones.size) zoneEnd - 130 else stageLength - 130
        val left = if (zoneActive) zoneStart + 110 else 110.0
        p.x = p.x.coerceIn(left, right)
        p.y = p.y.coerceIn(0.0, DEPTH)
    }

    private fun startMove(m: Move) {
        player.state = PState.ATTACK
        player.move = m
        player.t = 0.0
        player.hitDone = false
        player.queued = null
    }

    private fun startDodge(mx: Double, my: Double) {
        val p = player
        val len = sqrt(mx * mx + my * my)
        p.dodgeDir = if (len > 0.1) (mx / len) to (my / len) else p.facing to 0.0
        if (abs(mx) > 0.1) p.facing = sign(mx)
        p.state = PState.DODGE
        p.t = 0.0
        p.invuln = DODGE_IFRAMES
    }

    private fun startMusou() {
        player.state = PState.MUSOU
        player.t = 0.0
        player.musouTick = 0.0
        fx += Fx.Banner("無双乱舞！", "")
        fx += Fx.Speech("ビールのために！")
        fx += Fx.Shake(14.0)
    }

    private fun resolvePlayerHit(m: Move) {
        val p = player
        var hits = 0
        for (e in enemies) {
            if (e.state == EState.FLY || e.state == EState.LYING) continue
            val dx = e.x - p.x
            val dy = e.y - p.y
            val reach = m.range * M * (if (e.kind.armor) 1.1 else 1.0)
            val inRange = if (m.around) {
                abs(dx) < reach && abs(dy) < 80
            } else {
                dx * p.facing > -30 && dx * p.facing < reach && abs(dy) < 55
            }
            if (!inRange) continue
            hits++
            e.hp -= m.dmg
            val dir = if (dx == 0.0) p.facing else sign(dx)
            fx += Fx.Hit(e.x, e.y, m.heavy)
            if (e.hp <= 0) {
                knockOut(e, dir, max(m.launch, 6.0), max(m.push, 6.0))
            } else if (!e.kind.armor || m.heavy) {
                if (m.launch > 0 && !e.kind.armor) {
                    e.state = EState.FLY; e.t = 0.0
                    e.vx = dir * m.push * M * 0.45; e.vz = m.launch * M * 0.55
                } else {
                    e.state = EState.HIT; e.t = 0.0
                    e.vx = dir * m.push * M * (if (e.kind.armor) 0.25 else 0.6)
                }
                e.facing = -dir
            } else {
                e.x += dir * 6
            }
            p.musou = min(MUSOU_MAX, p.musou + if (p.state == PState.MUSOU) 0.0 else 1.6)
        }
        if (hits > 0) {
            combo += hits
            comboTimer = 2.5
            maxCombo = max(maxCombo, combo)
            if (m.heavy) fx += Fx.Shake(6.0)
        }
    }

    private fun knockOut(e: Enemy, dir: Double, launch: Double, push: Double) {
        e.state = EState.FLY
        e.t = 0.0
        e.vx = dir * push * M * 0.5
        e.vz = launch * M * 0.6
        e.facing = -dir
        koTotal++
        if (!e.isLeader) zoneKo++
        player.musou = min(MUSOU_MAX, player.musou + if (player.state == PState.MUSOU) 0.0 else 2.5)
        KO_LINES[koTotal]?.let { fx += Fx.Speech(it) }
        if (e.isLeader) {
            fx += Fx.Banner("${e.title ?: e.kind.title} を撃破！", "")
            fx += Fx.Shake(16.0)
        }
        if (rng.nextDouble() < 0.1) pickups += Pickup(rng.nextBoolean(), e.x, e.y)
    }

    fun damagePlayer(dmg: Double, fromX: Double) {
        val p = player
        if (p.invuln > 0 || p.state == PState.DOWN || p.state == PState.WIN || phase != Phase.PLAY) return
        p.hp -= dmg
        p.invuln = 0.5
        fx += Fx.Text(p.x, p.y, "${dmg.toInt()}", false)
        fx += Fx.Shake(5.0)
        combo = 0
        if (p.hp <= 0) {
            p.hp = 0.0
            p.state = PState.DOWN
            p.t = 0.0
            fx += Fx.Speech("ちょっと、ひと休み……")
        } else if (p.state != PState.MUSOU && p.state != PState.ATTACK) {
            p.state = PState.HURT
            p.t = 0.0
            p.facing = sign(fromX - p.x).takeIf { it != 0.0 } ?: p.facing
        }
    }

    private fun win() {
        phase = Phase.WIN
        phaseT = 0.0
        player.state = PState.WIN
        player.t = 0.0
        fx += Fx.Banner(stage.clearText, "")
        fx += Fx.Speech("快適です！")
    }

    // ---------------------------------------------------------------- 敵

    /** 殴りかかれるのは近い順に3人まで（隊長格はいつでも） */
    private fun assignTokens() {
        val active = enemies.filter { it.state == EState.CHASE || it.state == EState.ATTACK || it.state == EState.SPECIAL }
        active.forEach { it.token = it.isLeader }
        active.filter { !it.isLeader }
            .sortedBy { abs(it.x - player.x) + abs(it.y - player.y) * 1.5 }
            .take(MAX_TOKENS)
            .forEach { it.token = true }
    }

    private fun updateEnemy(e: Enemy, dt: Double) {
        e.t += dt
        e.attackCd -= dt
        e.specialCd -= dt
        val p = player
        val dx = p.x - e.x
        val dy = p.y - e.y
        val speedMul = if (e.enraged) 1.3 else 1.0
        when (e.state) {
            EState.CHASE -> {
                if (phase != Phase.PLAY || p.state == PState.DOWN) {
                    e.facing = sign(dx).takeIf { it != 0.0 } ?: e.facing
                    return
                }
                if (e.kind == EnemyKind.BOSS && e.specialCd <= 0 && abs(dx) < 4.5 * M) {
                    e.state = EState.SPECIAL; e.t = 0.0; e.hitDone = false; e.secondPound = false
                    e.specialCd = SPECIAL_COOLDOWN * (if (e.enraged) 0.75 else 1.0)
                    return
                }
                val tx: Double
                val ty: Double
                if (e.token) {
                    tx = p.x - sign(dx).let { if (it == 0.0) 1.0 else it } * e.kind.range * M * 0.75
                    ty = p.y
                } else {
                    tx = p.x + e.ringX
                    ty = (p.y + e.ringY).coerceIn(0.0, DEPTH)
                }
                val mx = tx - e.x
                val my = ty - e.y
                val d = sqrt(mx * mx + my * my)
                val speed = e.kind.speed * M * speedMul * (if (e.token) 1.0 else 0.6)
                if (d > 12) {
                    e.x += mx / d * speed * dt
                    e.y += my / d * speed * 0.7 * dt
                }
                e.facing = sign(dx).takeIf { it != 0.0 } ?: e.facing
                if (e.token && e.attackCd <= 0 && abs(dx) < e.kind.range * M && abs(dy) < 40) {
                    e.state = EState.ATTACK; e.t = 0.0; e.hitDone = false
                }
            }
            EState.ATTACK -> {
                val d = e.len("attack") / (e.kind.attackSpeed * speedMul)
                if (!e.hitDone && e.t >= d * e.kind.attackHit) {
                    e.hitDone = true
                    if (dx * e.facing > -20 && abs(dx) < e.kind.range * M * e.kind.scale + 30 && abs(dy) < 50) damagePlayer(e.kind.dmg, e.x)
                }
                if (e.t >= d) {
                    e.state = EState.CHASE; e.t = 0.0
                    e.attackCd = (if (e.isLeader) 1.0 else 1.6) + rng.nextDouble()
                }
            }
            EState.SPECIAL -> {
                // 地響き。怒ると2連発
                val d = e.len("special")
                val hitAt = d * SPECIAL_HIT
                if (!e.hitDone && e.t >= hitAt) { e.hitDone = true; pound(e) }
                if (e.enraged && !e.secondPound && e.t >= hitAt + 0.9) { e.secondPound = true; pound(e) }
                if (e.t >= d + (if (e.enraged) 0.5 else 0.0)) { e.state = EState.CHASE; e.t = 0.0; e.attackCd = 1.0 }
            }
            EState.HIT -> {
                e.x += e.vx * dt
                e.vx *= 0.86
                if (e.t >= (if (e.kind.armor) 0.25 else 0.4)) { e.state = EState.CHASE; e.t = 0.0 }
            }
            EState.FLY -> {
                e.x += e.vx * dt
                e.z += e.vz * dt
                e.vz -= 2200 * dt
                if (e.z <= 0 && e.t > 0.05) {
                    e.z = 0.0
                    e.vx *= 0.3
                    if (e.hp <= 0) { e.state = EState.LYING; e.t = 0.0 } else { e.state = EState.HIT; e.t = 0.0 }
                }
            }
            EState.LYING -> {
                e.x += e.vx * dt
                e.vx *= 0.85
                // 目を回して床に沈む（流血・死亡表現はしない）
                if (e.t > 1.0) e.alpha = max(0.0, 1.0 - (e.t - 1.0) / 0.5)
                if (e.t > 1.5) e.removed = true
            }
        }
        e.x = e.x.coerceIn(zoneStart - 150, zoneEnd + 150)
        e.y = e.y.coerceIn(0.0, DEPTH)
    }

    private fun pound(e: Enemy) {
        fx += Fx.Wave(e.x, e.y, SPECIAL_RANGE * M, true)
        fx += Fx.Shake(18.0)
        val dx = player.x - e.x
        val dy = (player.y - e.y) * 1.6
        if (sqrt(dx * dx + dy * dy) < SPECIAL_RANGE * M) damagePlayer(SPECIAL_DMG, e.x)
    }

    private fun updatePickups(dt: Double) {
        for (pk in pickups) {
            pk.t += dt
            if (!pk.taken && abs(pk.x - player.x) < 60 && abs(pk.y - player.y) < 40) {
                pk.taken = true
                if (pk.beer) {
                    player.musou = min(MUSOU_MAX, player.musou + 30)
                    fx += Fx.Text(pk.x, pk.y, "無双ゲージ+30", true)
                } else {
                    player.hp = min(PLAYER_MAX_HP, player.hp + 200)
                    fx += Fx.Text(pk.x, pk.y, "体力+200", true)
                }
            }
        }
        pickups.removeAll { it.taken || it.t > 15 }
    }

    // ---------------------------------------------------------------- 自動プレイ（動作確認用）

    /** 一番近い敵へ寄ってコンボ。ゲージが溜まれば無双、地響きの前は回避、制圧後はゴールへ */
    fun autoInput(input: Input) {
        input.moveX = 0.0; input.moveY = 0.0
        input.attack = false; input.charge = false; input.musou = false; input.dodge = false; input.interact = false
        val p = player
        if (goalOpen) {
            val dx = goalX - p.x
            if (abs(dx) > 60) input.moveX = sign(dx) else input.interact = true
            input.moveY = (DEPTH * 0.5 - p.y) / 80
            return
        }
        val boss = enemies.firstOrNull { it.state == EState.SPECIAL }
        if (boss != null && boss.t < boss.len("special") * SPECIAL_HIT && abs(boss.x - p.x) < SPECIAL_RANGE * M + 40) {
            input.moveX = -sign(boss.x - p.x)
            input.dodge = p.state == PState.MOVE
            return
        }
        val target = enemies.filter { it.state != EState.FLY && it.state != EState.LYING }
            .minByOrNull { abs(it.x - p.x) + abs(it.y - p.y) * 1.5 }
        if (p.musou >= MUSOU_MAX && enemies.size >= 4) { input.musou = true; return }
        if (target == null) {
            // 次のエリアへ進む
            input.moveX = 1.0
            return
        }
        val dx = target.x - p.x
        val dy = target.y - p.y
        if (abs(dy) > 25) input.moveY = sign(dy) * min(1.0, abs(dy) / 60)
        if (abs(dx) > 2.0 * M) input.moveX = sign(dx)
        else if (abs(dx) < 0.6 * M) input.moveX = -sign(dx) * 0.4
        if (abs(dx) < 2.4 * M && abs(dy) < 50) {
            if (p.state == PState.MOVE && abs(dx) > 1.0) p.facing = sign(dx)
            val crowd = enemies.count { abs(it.x - p.x) < 3 * M && abs(it.y - p.y) < 80 }
            if (crowd >= 4 && p.state == PState.MOVE) input.charge = true else input.attack = true
        }
    }
}
