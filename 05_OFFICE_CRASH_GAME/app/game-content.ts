export type GameStatus = "hub" | "playing" | "reward" | "gameover" | "victory";
export type FloorKind = "combat" | "elite" | "challenge" | "boss" | "final";
export type FixtureKey = "server" | "showcase" | "exit";
export type OvertimeRank = 0 | 1 | 2;
export type UpgradeId =
  | "mug"
  | "barrel"
  | "chiller"
  | "tray"
  | "lantern"
  | "sneakers";

export type GameProfile = {
  username: string;
  caps: number;
  bestFloor: number;
  bestScore: number;
  totalRuns: number;
  totalDestroyed: number;
  clears: number;
  fixtures: Record<FixtureKey, number>;
  refundedCaps?: number;
};

export type RecentRun = {
  victory: number | boolean;
  floorReached: number;
  score: number;
  destroyed: number;
  maxCombo: number;
  capsEarned: number;
  overtimeRank: number;
  buildName: string;
  createdAt: string;
};

export type SiteGameData = {
  profile: GameProfile;
  recentRuns: RecentRun[];
  leaderboard: Array<{
    username: string;
    score: number;
    floorReached: number;
    victory: number | boolean;
    overtimeRank: number;
    buildName: string;
  }>;
  globalStats: { runs: number; destroyed: number; clears: number };
};

export type UpgradeDefinition = {
  id: UpgradeId;
  icon: string;
  name: string;
  description: string;
  color: string;
  role: string;
  image: string;
  effects: [string, string, string];
};

export type RewardChoice = UpgradeDefinition & {
  level: 1 | 2 | 3;
  evolution: "装備" | "改" | "極";
  displayName: string;
  effect: string;
};

export type FloorDefinition = {
  floor: number;
  kind: FloorKind;
  name: string;
  kicker: string;
  objective: string;
  tint: number;
  accent: number;
  enemyCount: number;
};

export type OvertimeDefinition = {
  rank: OvertimeRank;
  label: string;
  kicker: string;
  description: string;
  scoreMultiplier: number;
  capsMultiplier: number;
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  destructionMultiplier: number;
  eliteBonus: number;
};

export type FixtureDefinition = {
  id: FixtureKey;
  name: string;
  description: string;
  image: string;
  levels: [string, string, string];
};

export const EMPTY_PROFILE: GameProfile = {
  username: "匿名窓際社員",
  caps: 0,
  bestFloor: 0,
  bestScore: 0,
  totalRuns: 0,
  totalDestroyed: 0,
  clears: 0,
  fixtures: { server: 0, showcase: 0, exit: 0 },
};

export const OVERTIME_RANKS: OvertimeDefinition[] = [
  {
    rank: 0,
    label: "残業",
    kicker: "EASY SHIFT",
    description: "まだ誰にも怪しまれない肩慣らし。標準ノルマで備品を片付ける。",
    scoreMultiplier: 1,
    capsMultiplier: 1,
    hpMultiplier: 1,
    damageMultiplier: 1,
    speedMultiplier: 1,
    destructionMultiplier: 1,
    eliteBonus: 0,
  },
  {
    rank: 1,
    label: "定時退社",
    kicker: "ON-TIME EXIT",
    description: "チャイムと同時に堂々退社。破壊数2倍、ボス攻撃強化。8Fは助っ人1名が参戦。",
    scoreMultiplier: 1.5,
    capsMultiplier: 1.4,
    hpMultiplier: 1.48,
    damageMultiplier: 1.28,
    speedMultiplier: 1.12,
    destructionMultiplier: 2,
    eliteBonus: 2,
  },
  {
    rank: 2,
    label: "フライング退社",
    kicker: "EARLY ESCAPE",
    description: "最高難度。破壊数3倍、ボスは広範囲に猛攻。8Fは助っ人2名が参戦。",
    scoreMultiplier: 1.95,
    capsMultiplier: 1.8,
    hpMultiplier: 1.82,
    damageMultiplier: 1.48,
    speedMultiplier: 1.2,
    destructionMultiplier: 3,
    eliteBonus: 3,
  },
];

export function getOvertimeDefinition(rank: number): OvertimeDefinition {
  const safeRank = Number.isFinite(rank)
    ? Math.max(0, Math.min(OVERTIME_RANKS.length - 1, Math.trunc(rank)))
    : 0;
  return OVERTIME_RANKS[safeRank] ?? OVERTIME_RANKS[0];
}

export const FLOORS: FloorDefinition[] = [
  {
    floor: 1,
    kind: "combat",
    name: "中央執務フロア",
    kicker: "REGULATION 01",
    objective: "備品の大行進を崩し、目標数を資材へ戻せ",
    tint: 0xe8edf0,
    accent: 0x19b8ff,
    enemyCount: 16,
  },
  {
    floor: 2,
    kind: "combat",
    name: "会議室迷宮",
    kicker: "REGULATION 02",
    objective: "円陣をまとめ、指定数を一気に片付けろ",
    tint: 0xe7e2d8,
    accent: 0xffa51f,
    enemyCount: 22,
  },
  {
    floor: 3,
    kind: "challenge",
    name: "クラッシュタイム",
    kicker: "15 SECOND BONUS",
    objective: "画面内へ押し寄せる備品を15秒で好きなだけ片付けろ",
    tint: 0xd9f3ff,
    accent: 0xffcc22,
    enemyCount: 42,
  },
  {
    floor: 4,
    kind: "boss",
    name: "窓際フェス・第一幕",
    kicker: "MADOGIWA BOSS SESSION",
    objective: "本日の窓際族メンバーと平和な模擬戦を楽しめ",
    tint: 0x344752,
    accent: 0xff4fa6,
    enemyCount: 1,
  },
  {
    floor: 5,
    kind: "combat",
    name: "配線サーバーフロア",
    kicker: "REGULATION 05",
    objective: "暴走備品の列を生ジョッキレールで貫け",
    tint: 0xd9e9e7,
    accent: 0x54e0b4,
    enemyCount: 26,
  },
  {
    floor: 6,
    kind: "elite",
    name: "タコ部屋前室",
    kicker: "ELITE REGULATION",
    objective: "大群を率いる強化ロッカーをまとめて突破せよ",
    tint: 0x4c4b57,
    accent: 0xff704c,
    enemyCount: 22,
  },
  {
    floor: 7,
    kind: "challenge",
    name: "窓際外周デッキ",
    kicker: "15 SECOND BONUS",
    objective: "東京タワーを背に15秒の大連鎖を決めろ",
    tint: 0xd9efff,
    accent: 0xff5d45,
    enemyCount: 54,
  },
  {
    floor: 8,
    kind: "final",
    name: "窓際リモート会議室",
    kicker: "FINAL MADOGIWA SESSION",
    objective: "おかやまんと高難度で加わる助っ人の最終チェックを突破せよ",
    tint: 0x232e3b,
    accent: 0xffd23f,
    enemyCount: 1,
  },
];

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: "mug",
    icon: "杯",
    name: "金の特大ジョッキ",
    description: "一撃の重さと吹き飛ばしを伸ばす、正面突破の主役装備。",
    color: "#ffb21c",
    role: "高火力・会心",
    image: "/items/golden-mug.png",
    effects: [
      "全攻撃 +25%・吹き飛ばし強化",
      "PERFECT威力 ×2.35・会心範囲拡大",
      "PERFECT時に黄金衝撃波が追加発生",
    ],
  },
  {
    id: "barrel",
    icon: "波",
    name: "泡盛ビール樽",
    description: "泡を連鎖させ、大群をまとめて巻き込む範囲攻撃装備。",
    color: "#e98b22",
    role: "範囲・連鎖",
    image: "/items/foam-barrel.png",
    effects: [
      "通常範囲 +14%・撃破時に泡が破裂",
      "泡の連鎖範囲と威力が大幅アップ",
      "MEGAの射線と着弾爆発が超大型化",
    ],
  },
  {
    id: "chiller",
    icon: "冷",
    name: "キンキン冷却サーバー",
    description: "敵を凍らせ、砕ける隙へ高速で畳み掛ける冷却装備。",
    color: "#4fd8ff",
    role: "凍結・手数",
    image: "/items/ice-server.png",
    effects: [
      "攻撃間隔 -8%・命中した敵を冷却",
      "凍結中の敵へダメージ ×1.65",
      "凍結撃破で周囲へ氷砕きが連鎖",
    ],
  },
  {
    id: "tray",
    icon: "串",
    name: "焼き鳥お盆シールド",
    description: "お盆で受け流し、焼き鳥で立て直す粘り強い防御装備。",
    color: "#d76e2a",
    role: "防御・回復",
    image: "/items/yakitori-tray.png",
    effects: [
      "最大HP +25・撃破時 HP +3",
      "HP80%以上で被ダメージ35%軽減",
      "致命傷を一度だけ防ぎ、焼き鳥で全快",
    ],
  },
  {
    id: "lantern",
    icon: "生",
    name: "ハッピーアワー赤提灯",
    description: "連続整理を祝祭へ変え、必殺技を気軽に回す宴会装備。",
    color: "#ff4b2d",
    role: "MEGA・コンボ",
    image: "/items/red-lantern.png",
    effects: [
      "MEGAゲージ獲得 +25%・即時50%補充",
      "コンボ受付延長・清掃熱上昇 ×1.5",
      "大乾杯時のゲージ返却 +25%",
    ],
  },
  {
    id: "sneakers",
    icon: "走",
    name: "フライング退社スニーカー",
    description: "位置取りと回避を攻撃へ変える、最高速の退社装備。",
    color: "#63df8e",
    role: "移動・回避",
    image: "/items/escape-sneakers.png",
    effects: [
      "移動速度 +12%・ダッシュ再使用短縮",
      "ダッシュ跡に敵を弾く風の衝撃波",
      "ボス攻撃の完全回避でMEGA +20%",
    ],
  },
];

export const FIXTURES: FixtureDefinition[] = [
  {
    id: "server",
    name: "黄金ビールサーバー",
    description: "ジョッキレールを開幕から回す必殺設備。",
    image: "/items/fixture-golden-server.png",
    levels: ["各階開始時 MEGAゲージ +25%", "MEGAストック上限が3杯", "20体以上一掃でゲージ +25%追加返却"],
  },
  {
    id: "showcase",
    name: "まかないショーケース",
    description: "ピンチを乾杯の好機へ変える回復設備。",
    image: "/items/fixture-meal-showcase.png",
    levels: ["ラン中1回、HP30%以下でまかない回復", "各階1回まで再装填", "発動時に2秒無敵＋衝撃波"],
  },
  {
    id: "exit",
    name: "秘密の非常口",
    description: "回避成功を次の必殺へ直結させる退社設備。",
    image: "/items/fixture-secret-exit.png",
    levels: ["ダッシュ無敵時間 +0.15秒", "ボス攻撃の完全回避でダッシュ即再使用", "完全回避でMEGAゲージ +15%"],
  },
];

export function makeRewardChoices(
  values: Partial<Record<UpgradeId, number>>,
): RewardChoice[] {
  const owned = UPGRADES.filter((upgrade) => (values[upgrade.id] ?? 0) > 0);
  const pool = (owned.length >= 3
    ? owned
    : UPGRADES
  ).filter((upgrade) => (values[upgrade.id] ?? 0) < 3);
  const choices: RewardChoice[] = [];
  while (choices.length < 3 && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const definition = pool.splice(index, 1)[0];
    const level = Math.min(3, (values[definition.id] ?? 0) + 1) as 1 | 2 | 3;
    const evolution = (["装備", "改", "極"] as const)[level - 1];
    choices.push({
      ...definition,
      level,
      evolution,
      displayName: level === 1 ? definition.name : `${definition.name}・${evolution}`,
      effect: definition.effects[level - 1],
    });
  }
  return choices;
}

export function fixtureCost(level: number) {
  return [60, 140, 300][Math.max(0, Math.min(2, level))] ?? 300;
}
