import kotlin.random.Random

const val MAP_W = 24
const val MAP_H = 14

enum class Tile { WALL, FLOOR, STAIRS }

class Room(val x: Int, val y: Int, val w: Int, val h: Int) {
    val cx get() = x + w / 2
    val cy get() = y + h / 2

    /** 1マスの壁を挟んで重ならないか */
    fun intersects(o: Room) = x - 1 < o.x + o.w && x + w + 1 > o.x && y - 1 < o.y + o.h && y + h + 1 > o.y
    fun contains(px: Int, py: Int) = px in x until x + w && py in y until y + h
}

class DungeonMap {
    val tiles = Array(MAP_H) { Array(MAP_W) { Tile.WALL } }
    val rooms = mutableListOf<Room>()

    fun inBounds(x: Int, y: Int) = x in 0 until MAP_W && y in 0 until MAP_H
    operator fun get(x: Int, y: Int): Tile = if (inBounds(x, y)) tiles[y][x] else Tile.WALL
    operator fun set(x: Int, y: Int, t: Tile) { if (inBounds(x, y)) tiles[y][x] = t }
    fun walkable(x: Int, y: Int) = this[x, y] != Tile.WALL

    /** 床に面した壁だけを段ボール箱として描く（地中の壁は描かない） */
    fun isVisibleWall(x: Int, y: Int): Boolean {
        if (this[x, y] != Tile.WALL) return false
        for (dy in -1..1) for (dx in -1..1) if (walkable(x + dx, y + dy)) return true
        return false
    }
}

/**
 * 段ボールで増築されすぎた「窓際倉庫」の1フロアを作る。
 * 部屋を置いてL字の通路でつなぐ、古典的なローグライクの生成。
 */
fun generateDungeon(rng: Random, bossFloor: Boolean): DungeonMap {
    val map = DungeonMap()
    val maxRooms = if (bossFloor) 4 else 7
    var tries = 0
    while (map.rooms.size < maxRooms && tries < 200) {
        tries++
        // ボス階の最後の部屋は広めに取る
        val big = bossFloor && map.rooms.size == maxRooms - 1
        val w = if (big) rng.nextInt(7, 10) else rng.nextInt(4, 8)
        val h = if (big) rng.nextInt(5, 7) else rng.nextInt(3, 6)
        val room = Room(rng.nextInt(1, MAP_W - w - 1), rng.nextInt(1, MAP_H - h - 1), w, h)
        if (map.rooms.any { it.intersects(room) }) continue
        for (yy in room.y until room.y + room.h) for (xx in room.x until room.x + room.w) map[xx, yy] = Tile.FLOOR
        map.rooms.lastOrNull()?.let { carveCorridor(map, rng, it.cx, it.cy, room.cx, room.cy) }
        map.rooms += room
    }
    return map
}

private fun carveCorridor(map: DungeonMap, rng: Random, x1: Int, y1: Int, x2: Int, y2: Int) {
    fun h(y: Int, a: Int, b: Int) { for (x in minOf(a, b)..maxOf(a, b)) if (map[x, y] == Tile.WALL) map[x, y] = Tile.FLOOR }
    fun v(x: Int, a: Int, b: Int) { for (y in minOf(a, b)..maxOf(a, b)) if (map[x, y] == Tile.WALL) map[x, y] = Tile.FLOOR }
    if (rng.nextBoolean()) { h(y1, x1, x2); v(x2, y1, y2) } else { v(x1, y1, y2); h(y2, x1, x2) }
}

/** 通れるマスだけを辿った最短経路の「最初の一歩」。自動プレイ用 */
fun firstStepToward(
    map: DungeonMap, sx: Int, sy: Int, tx: Int, ty: Int,
    avoid: (Int, Int) -> Boolean = { _, _ -> false },
): Pair<Int, Int>? {
    if (sx == tx && sy == ty) return null
    val prev = IntArray(MAP_W * MAP_H) { -1 }
    val start = sy * MAP_W + sx
    prev[start] = start
    val queue = ArrayDeque<Int>().apply { add(start) }
    while (queue.isNotEmpty()) {
        val cur = queue.removeFirst()
        val cx = cur % MAP_W
        val cy = cur / MAP_W
        if (cx == tx && cy == ty) {
            var node = cur
            while (prev[node] != start) node = prev[node]
            return (node % MAP_W - sx) to (node / MAP_W - sy)
        }
        for ((dx, dy) in DIRS) {
            val nx = cx + dx
            val ny = cy + dy
            if (!map.walkable(nx, ny)) continue
            if (!(nx == tx && ny == ty) && avoid(nx, ny)) continue
            val n = ny * MAP_W + nx
            if (prev[n] != -1) continue
            prev[n] = cur
            queue.add(n)
        }
    }
    return null
}

val DIRS = listOf(0 to 1, 0 to -1, -1 to 0, 1 to 0)
