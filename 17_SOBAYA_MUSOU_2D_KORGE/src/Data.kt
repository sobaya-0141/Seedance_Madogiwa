/**
 * ゲームの数値の正本。12_SOBAYA_MUSOU_GODOT（3D版）の ENEMY_TYPES / ZONES / COMBO / CHARGE を
 * 横スクロールの2Dに置き換えたもの。距離はメートルで書き、画面では M ピクセル/メートルで換算する。
 */

/** 1メートルの画面上の長さ（そば屋の身長1.8mがおよそ190px） */
const val M = 105.0

const val SCREEN_W = 1280
const val SCREEN_H = 720
/** 床（奥行き）の帯。depth=0 が奥、depth=DEPTH が手前 */
const val FLOOR_TOP = 430.0
const val DEPTH = 270.0
/** 1エリアの横幅 */
const val ZONE_W = 1700.0
/** そば屋の表示倍率。アトラスは立ち姿の身長が約438px、画面では約270px（主役なので敵より大きく） */
const val PLAYER_SCALE = 0.62
/** 背景の一枚絵を画面より横に何割広く敷くか（カメラに合わせてずらす分） */
const val BACKDROP_OVERSCAN = 0.12

const val PLAYER_MAX_HP = 1000.0
const val MUSOU_MAX = 100.0
const val MAX_ACTIVE = 14
const val MAX_TOKENS = 3
const val GRAB_TIME = 1.6

enum class EnemyKind(
    val sheet: String,
    val title: String?,
    val hp: Double,
    val speed: Double,
    val dmg: Double,
    val attackSpeed: Double,
    /** 攻撃クリップのうち、当たる瞬間の位置（割合） */
    val attackHit: Double,
    val range: Double,
    val scale: Double,
    /** 隊長格。大技（4段目・チャージ・無双）でしかひるまない */
    val armor: Boolean = false,
) {
    GUARD("guard", null, 40.0, 3.3, 28.0, 1.4, 0.42, 1.5, 0.95),
    POLICE("police", null, 70.0, 3.7, 38.0, 0.85, 0.5, 1.8, 0.95),
    CAPTAIN("captain", "警備隊長", 650.0, 3.2, 70.0, 0.6, 0.5, 2.0, 1.15, armor = true),
    SERGEANT("sergeant", "巡査部長", 900.0, 3.5, 75.0, 0.6, 0.5, 2.2, 1.15, armor = true),
    BOSS("boss", "警部", 2000.0, 3.4, 85.0, 0.9, 0.45, 2.4, 1.3, armor = true),
}

/** ボスの地響き（衝撃波） */
const val SPECIAL_COOLDOWN = 6.0
const val SPECIAL_DMG = 90.0
const val SPECIAL_RANGE = 3.4
const val SPECIAL_HIT = 0.45

class Move(
    val anim: String,
    val speed: Double,
    val hit: Double,
    val cancel: Double,
    val end: Double,
    val dmg: Double,
    val range: Double,
    /** true なら前方だけでなく周囲すべてに当たる */
    val around: Boolean,
    val push: Double,
    val launch: Double,
    val lunge: Double,
    /** 隊長格もひるむ大技か */
    val heavy: Boolean = false,
)

/**
 * 4段コンボ。威力・範囲・吹っ飛ばしは3D版の COMBO と同じ値。
 * アニメは手描きのコマ（04_GAME_ASSETS/musou2d/sobaya_anims.txt）。長さはコマ数÷12、
 * hit は当たりのコマの始まり（combo1〜3 は7コマ中4コマ目、combo4 は11コマ中6コマ目）に少し足した割合
 */
val COMBO = listOf(
    Move("combo1", 1.0, 0.46, 0.6, 0.85, 34.0, 2.5, false, 3.0, 0.0, 1.2),
    Move("combo2", 1.0, 0.46, 0.6, 0.85, 34.0, 2.7, false, 3.5, 0.0, 1.0),
    Move("combo3", 1.2, 0.46, 0.6, 0.85, 40.0, 2.6, false, 4.0, 0.0, 1.4),
    Move("combo4", 1.0, 0.48, 0.8, 0.92, 70.0, 3.4, true, 7.0, 7.0, 0.8, heavy = true),
)
/** チャージ攻撃。12コマ中8コマ目が当たり */
val CHARGE = Move("charge", 1.0, 0.6, 0.85, 0.95, 110.0, 4.2, true, 10.0, 9.0, 0.4, heavy = true)

const val RUN_SPEED = 6.0
const val DODGE_TIME = 0.62
const val DODGE_DISTANCE = 4.2
const val DODGE_IFRAMES = 0.45
const val MUSOU_TIME = 3.2
const val MUSOU_TICK = 0.3
const val MUSOU_DMG = 60.0
const val MUSOU_RANGE = 3.8

class Zone(
    val name: String,
    val quota: Int,
    val mix: Map<EnemyKind, Double>,
    /** 途中で出てくる隊長格（null なら無し） */
    val leader: EnemyKind?,
    /** leader の肩書き（同じ見た目でもステージごとに変える） */
    val leaderTitle: String?,
    /** leader が出てくるまでに倒す人数（0 ならエリアに入ってすぐ） */
    val leaderAt: Int,
    val leaderHpScale: Double = 1.0,
)

enum class Scenery { FACTORY, STREET, OFFICE }

class StageDef(
    val number: Int,
    val title: String,
    val subtitle: String,
    val scenery: Scenery,
    val zones: List<Zone>,
    val goalLabel: String,
    val goalAction: String,
    val clearText: String,
)

val STAGES = listOf(
    StageDef(
        1, "ゴールデン麦酒 第一工場", "製造ラインのできたてビールを奪え！", Scenery.FACTORY,
        listOf(
            Zone("正門ヤード", 20, mapOf(EnemyKind.GUARD to 1.0), EnemyKind.CAPTAIN, "警備隊長", 9),
            Zone("倉庫", 28, mapOf(EnemyKind.GUARD to 0.45, EnemyKind.POLICE to 0.55), EnemyKind.SERGEANT, "巡査部長", 13),
            Zone("製造ライン", 32, mapOf(EnemyKind.GUARD to 0.15, EnemyKind.POLICE to 0.85), EnemyKind.BOSS, "警部", 0),
        ),
        "できたてビールのタンク", "F 長押しでビールを奪う", "できたてビールを確保！",
    ),
    StageDef(
        2, "麻布十番駅 → あくしでんちゅあ本社ビル", "ビールを持って本社ビルへ走れ！", Scenery.STREET,
        listOf(
            Zone("駅前", 22, mapOf(EnemyKind.POLICE to 0.7, EnemyKind.GUARD to 0.3), EnemyKind.SERGEANT, "巡査部長", 10),
            Zone("商店街", 30, mapOf(EnemyKind.POLICE to 1.0), EnemyKind.CAPTAIN, "交通整理の隊長", 14),
            Zone("本社ビル前", 34, mapOf(EnemyKind.POLICE to 0.8, EnemyKind.GUARD to 0.2), EnemyKind.BOSS, "警視", 0, 1.2),
        ),
        "本社ビルの入口", "F 長押しで入館する", "本社ビルに入館！",
    ),
    StageDef(
        3, "あくしでんちゅあ本社ビル", "窓際の立ち飲み処にビールを届けろ！", Scenery.OFFICE,
        listOf(
            Zone("ロビー", 24, mapOf(EnemyKind.GUARD to 1.0), EnemyKind.CAPTAIN, "本社警備隊長", 11),
            Zone("オフィスフロア", 30, mapOf(EnemyKind.GUARD to 0.6, EnemyKind.POLICE to 0.4), EnemyKind.SERGEANT, "警備主任", 14),
            Zone("窓際エリア", 36, mapOf(EnemyKind.GUARD to 0.7, EnemyKind.POLICE to 0.3), EnemyKind.BOSS, "本社警備部長", 0, 1.35),
        ),
        "窓際の立ち飲み処", "F 長押しでビールを納品する", "立ち飲み処、開店！",
    ),
)

/** 倒した人数に応じたそば屋のひとこと（3D版の KO_LINES） */
val KO_LINES = mapOf(50 to "快適です！", 100 to "メリットでもあります！", 150 to "ビールが呼んでいます！", 200 to "まだまだいけます！")
