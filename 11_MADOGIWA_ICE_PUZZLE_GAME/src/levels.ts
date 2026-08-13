import type {
  CharacterId,
  CollectibleDefinition,
  HelperDefinition,
  LevelDefinition,
  Point,
} from "./types.js";

interface LevelSource {
  id: string;
  name: string;
  subtitle: string;
  intro: string;
  clearText: string;
  map: string[];
  helpers?: Array<HelperDefinition>;
  parMoves: number;
}

function defineLevel(source: LevelSource, index: number): LevelDefinition {
  const grid = source.map.map((row) => row.replace(/[SDEB]/g, "."));
  let start: Point | undefined;
  let exit: Point | undefined;
  const collectibles: CollectibleDefinition[] = [];
  let documentIndex = 0;
  let beerIndex = 0;

  source.map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "S") start = { x, y };
      if (cell === "E") exit = { x, y };
      if (cell === "D") {
        documentIndex += 1;
        collectibles.push({
          id: `${source.id}-document-${documentIndex}`,
          kind: "document",
          at: { x, y },
          label: `重要資料 ${documentIndex}`,
        });
      }
      if (cell === "B") {
        beerIndex += 1;
        collectibles.push({
          id: `${source.id}-beer-${beerIndex}`,
          kind: "beer",
          at: { x, y },
          label: `ビールケース ${beerIndex}`,
        });
      }
    });
  });

  if (!start || !exit) throw new Error(`${source.id}: start or exit is missing`);

  return {
    ...source,
    number: index + 1,
    grid,
    start,
    exit,
    collectibles,
    helpers: source.helpers ?? [],
  };
}

function helper(
  characterId: CharacterId,
  x: number,
  y: number,
  quote: string,
): HelperDefinition {
  return { characterId, at: { x, y }, quote };
}

const SOURCES: LevelSource[] = [
  {
    id: "first-frost",
    name: "フリーズ発生",
    subtitle: "広いフロアで重要資料を確保",
    intro: "おかやまん「画面外にもフロアがあります。フロアマップをご覧ください」",
    clearText: "やめたろう「ワイでも回収できた！」",
    map: [
      "############",
      "#.#......#E#",
      "##..#.#....#",
      "#.....#....#",
      "#.#.#..B.#.#",
      "#.#........#",
      "#.....#.D#.#",
      "##....#....#",
      "##.#.......#",
      "#.......#..#",
      "#S.#.#.#...#",
      "############",
    ],
    helpers: [
      helper("okayaman", 8, 10, "おかやまん「ここで一度、停止できます」"),
    ],
    parMoves: 7,
  },
  {
    id: "document-lanes",
    name: "書類レーン",
    subtitle: "通過回収できるラインを読む",
    intro: "福ちゃん「資料と一緒にギュンギュンしよ！」",
    clearText: "福ちゃん「凍ってても映えるね！」",
    map: [
      "##############",
      "#......#B...E#",
      "#....#....#..#",
      "##.##....#.#.#",
      "##..##......##",
      "#............#",
      "#........##..#",
      "#............#",
      "#............#",
      "#.....#.D#.#.#",
      "#..#.#.......#",
      "#S.#..D.#....#",
      "##############",
    ],
    helpers: [
      helper("fukuchan", 9, 5, "福ちゃん「ギュン！ ここで止まれるよ！」"),
    ],
    parMoves: 10,
  },
  {
    id: "beer-stock",
    name: "冷えすぎビール",
    subtitle: "重要資料とビールを順番に",
    intro: "そば屋「キンキンなのでメリットでもあります！」",
    clearText: "そば屋「回収完了です！ 快適です！」",
    map: [
      "################",
      "##............E#",
      "#...##.........#",
      "#..........#...#",
      "##.D......##...#",
      "#.........D...##",
      "#.........##...#",
      "#..........#...#",
      "#..........##..#",
      "#.......#......#",
      "#....B#..B.....#",
      "###.....#...#..#",
      "#S..##..#.#....#",
      "################",
    ],
    helpers: [
      helper("sobaya", 12, 4, "そば屋「私をストッパーにしてください！」"),
    ],
    parMoves: 15,
  },
  {
    id: "tentacle-stop",
    name: "タコ足ストッパー",
    subtitle: "仲間も障害物として頼もしい",
    intro: "たこさん「……」触手で静かに停止位置を示している。",
    clearText: "たこさん「……！」触手で小さく拍手した。",
    map: [
      "##################",
      "#...B........#..E#",
      "#..#....#.......D#",
      "#..#.....#...#...#",
      "#........#...#...#",
      "#...............##",
      "#.....#......#...#",
      "#..#..........#..#",
      "#.....#......#...#",
      "#.......#........#",
      "##....#.........##",
      "##.....D#........#",
      "#...#....#.......#",
      "#S......B...#...##",
      "##################",
    ],
    helpers: [
      helper("takosan", 6, 7, "たこさん「……」触手がやさしく受け止めた。"),
    ],
    parMoves: 18,
  },
  {
    id: "server-core",
    name: "冷却サーバー中枢",
    subtitle: "全部回収して赤提灯へ",
    intro: "ゆめみん「BONK!」最後のレギュレーションが始まった。",
    clearText: "やめたろう「バグ直った！ どうせワイ……でも、やればできるやん！」",
    map: [
      "####################",
      "#.....#.......#...E#",
      "#.#........#.......#",
      "#..........#....##.#",
      "#......##......#.#.#",
      "#.#.......#...##..B#",
      "##..#.....#..#...###",
      "#...#..#...........#",
      "#........#...#....##",
      "#...#..........#.#.#",
      "#..###.........#...#",
      "#..........#..D.B..#",
      "#.....#......D#.#..#",
      "##........#........#",
      "#.....D....#.....#.#",
      "#S..#...#....#.....#",
      "####################",
    ],
    helpers: [
      helper("yumemin", 18, 10, "ゆめみん「BONK!」氷の進路を教えてくれた。"),
      helper("sobaya", 16, 9, "そば屋「最後まで快適です！」"),
    ],
    parMoves: 24,
  },
];

export const LEVELS: readonly LevelDefinition[] = SOURCES.map(defineLevel);

export function getLevel(index: number): LevelDefinition {
  const level = LEVELS[index];
  if (!level) throw new Error(`Unknown level index: ${index}`);
  return level;
}
