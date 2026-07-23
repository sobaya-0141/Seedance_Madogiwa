// Battle data for the eight 窓際族物語 characters.
//
// This module is intentionally free of any three.js / DOM imports so the battle
// engine (and any future unit test) can import the raw numbers without pulling
// in the renderer. Stats and signature skills are flavoured after each
// character's setup file in 02_CHARACTERS/*.md — tuned to be broadly balanced,
// and easy to rebalance later by editing the tables below.

export type StatKind = "atk" | "def" | "spd";

export type SkillEffect =
  | { type: "damage"; power: number; hits?: number }
  | { type: "heal"; amount: number }
  | { type: "buffSelf"; stat: StatKind; mult: number; turns: number }
  | { type: "debuffFoe"; stat: StatKind; mult: number; turns: number }
  | { type: "drainMp"; amount: number };

export type Skill = {
  id: string;
  name: string;
  mp: number;
  desc: string;
  effects: SkillEffect[];
};

export type BaseStats = {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
};

export type BattleCharacter = {
  /** Matches the GLB filename in public/models (e.g. "sobaya" -> sobaya.glb). */
  id: string;
  name: string;
  /** Short archetype tag shown on the select card. */
  title: string;
  /** One-line flavour blurb for the character-select screen. */
  blurb: string;
  /** Theme accent colour (HP bar / card border). */
  color: string;
  /** Model scale when placed in the battle arena. */
  scale: number;
  /** Extra yaw (radians) so the model faces its opponent. */
  faceOffset: number;
  stats: BaseStats;
  skills: Skill[];
};

export const CHARACTERS: readonly BattleCharacter[] = [
  {
    id: "sobaya",
    name: "そば屋",
    title: "怪力タンク",
    blurb: "壁をぶち破る怪力。打たれ強く、ビールで笑顔に回復する。",
    color: "#f4f4f4",
    scale: 1.28,
    faceOffset: 0,
    stats: { hp: 108, mp: 30, atk: 30, def: 18, spd: 8 },
    skills: [
      {
        id: "wall-smash",
        name: "壁ドン粉砕",
        mp: 14,
        desc: "怪力で壁ごと相手を粉砕する大ダメージ攻撃。",
        effects: [{ type: "damage", power: 1.6 }],
      },
      {
        id: "beer-smile",
        name: "ビールで笑顔",
        mp: 10,
        desc: "ジョッキを一気飲み。HPを回復し、しばらく攻撃力アップ。",
        effects: [
          { type: "heal", amount: 26 },
          { type: "buffSelf", stat: "atk", mult: 1.2, turns: 3 },
        ],
      },
    ],
  },
  {
    id: "takosan",
    name: "たこさん",
    title: "謎の魔導士",
    blurb: "無表情の宇宙人。多段の触手と、相手を弱らせる無の視線。",
    color: "#8b7bd8",
    scale: 1.24,
    faceOffset: 0,
    stats: { hp: 84, mp: 55, atk: 26, def: 12, spd: 16 },
    skills: [
      {
        id: "tentacle-flurry",
        name: "触手の乱舞",
        mp: 16,
        desc: "6本の触手が3連続でヒットする多段攻撃。",
        effects: [{ type: "damage", power: 0.65, hits: 3 }],
      },
      {
        id: "void-gaze",
        name: "無の視線",
        mp: 12,
        desc: "無表情の視線で相手を萎縮させ、攻撃力を大きく下げる。",
        effects: [{ type: "debuffFoe", stat: "atk", mult: 0.7, turns: 3 }],
      },
    ],
  },
  {
    id: "tokun",
    name: "とーくん",
    title: "陽気なサポーター",
    blurb: "ハワイ好きの社長。BGMでHPを大きく回復するサポート型。",
    color: "#ff8a3d",
    scale: 1.24,
    faceOffset: 0,
    stats: { hp: 96, mp: 45, atk: 25, def: 15, spd: 12 },
    skills: [
      {
        id: "aloha-bgm",
        name: "ハワイアンBGM",
        mp: 12,
        desc: "ウクレレの癒やしの音色でHPを回復する。",
        effects: [{ type: "heal", amount: 32 }],
      },
      {
        id: "aloha-barrage",
        name: "アロハ乱れ撃ち",
        mp: 14,
        desc: "陽気なリズムに乗せて連打する中ダメージ攻撃。",
        effects: [{ type: "damage", power: 1.35 }],
      },
    ],
  },
  {
    id: "yotan",
    name: "よーたん",
    title: "ロックアタッカー",
    blurb: "ロックが人生のCTO。ギターソロと燃えるロック魂で押す。",
    color: "#ffd24a",
    scale: 1.28,
    faceOffset: 0,
    stats: { hp: 90, mp: 40, atk: 32, def: 13, spd: 18 },
    skills: [
      {
        id: "guitar-solo",
        name: "ギターソロ",
        mp: 16,
        desc: "魂を込めたギターソロを叩き込む高ダメージ攻撃。",
        effects: [{ type: "damage", power: 1.6 }],
      },
      {
        id: "rock-spirit",
        name: "ロック魂",
        mp: 10,
        desc: "ロック魂に火がつき、しばらく攻撃力が大きく上がる。",
        effects: [{ type: "buffSelf", stat: "atk", mult: 1.35, turns: 3 }],
      },
    ],
  },
  {
    id: "fukuchan",
    name: "福ちゃん",
    title: "天然デバッファー",
    blurb: "天然のギュンギュンで相手を惑わせ、重いノートPCで殴る。",
    color: "#ff5a8a",
    scale: 1.28,
    faceOffset: 0,
    stats: { hp: 94, mp: 42, atk: 28, def: 15, spd: 13 },
    skills: [
      {
        id: "gyun-gyun",
        name: "ギュンギュン",
        mp: 12,
        desc: "頬に手を当てた天然ポーズで相手を惑わせ、攻撃力を下げる。",
        effects: [{ type: "debuffFoe", stat: "atk", mult: 0.72, turns: 3 }],
      },
      {
        id: "heavy-laptop",
        name: "重いノートPC",
        mp: 14,
        desc: "とても重いノートPCを振り下ろす物理攻撃。",
        effects: [{ type: "damage", power: 1.5 }],
      },
    ],
  },
  {
    id: "yametaro",
    name: "やめたろう",
    title: "自虐ディフェンダー",
    blurb: "『どうせワイなんて』で固く守り、逃げ足の速さで反撃する。",
    color: "#c77dff",
    scale: 1.24,
    faceOffset: 0,
    stats: { hp: 100, mp: 35, atk: 24, def: 20, spd: 14 },
    skills: [
      {
        id: "doose-wai",
        name: "どうせワイなんて",
        mp: 8,
        desc: "自虐で心を無にして防御を固め、少しHPも回復する。",
        effects: [
          { type: "buffSelf", stat: "def", mult: 1.6, turns: 3 },
          { type: "heal", amount: 12 },
        ],
      },
      {
        id: "escape-dash",
        name: "起死回生の逃げ足",
        mp: 14,
        desc: "全力の逃げ足で撹乱しつつ一撃。素早さがしばらく上がる。",
        effects: [
          { type: "damage", power: 1.3 },
          { type: "buffSelf", stat: "spd", mult: 1.3, turns: 2 },
        ],
      },
    ],
  },
  {
    id: "okayaman",
    name: "おかやまん",
    title: "窓際王コントロール",
    blurb: "窓際王の威厳。レギュレーションで相手のMPと攻撃を削る。",
    color: "#7dff9b",
    scale: 1.3,
    faceOffset: 0,
    stats: { hp: 96, mp: 55, atk: 29, def: 16, spd: 11 },
    skills: [
      {
        id: "regulation",
        name: "レギュレーション発動",
        mp: 16,
        desc: "謎のレギュレーションで相手のMPを奪い、攻撃力も下げる。",
        effects: [
          { type: "drainMp", amount: 20 },
          { type: "debuffFoe", stat: "atk", mult: 0.85, turns: 2 },
        ],
      },
      {
        id: "great-surprise",
        name: "大変驚いております",
        mp: 18,
        desc: "笑顔のまま放つ丁寧な威圧の一撃。高ダメージ。",
        effects: [{ type: "damage", power: 1.6 }],
      },
    ],
  },
  {
    id: "yumemin",
    name: "ゆめみん",
    title: "スピードBONK",
    blurb: "空飛ぶマスコット。素早さ抜群で、木槌のBONK!を連発。",
    color: "#4ad6ff",
    scale: 1.02,
    faceOffset: 0,
    stats: { hp: 80, mp: 40, atk: 26, def: 13, spd: 22 },
    skills: [
      {
        id: "bonk",
        name: "BONK!",
        mp: 10,
        desc: "木槌で勢いよく叩く素早い一撃。",
        effects: [{ type: "damage", power: 1.45 }],
      },
      {
        id: "nap",
        name: "おひるね",
        mp: 12,
        desc: "ふわりと居眠りしてHPを回復する。",
        effects: [{ type: "heal", amount: 28 }],
      },
    ],
  },
];

export function getCharacter(id: string): BattleCharacter | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
