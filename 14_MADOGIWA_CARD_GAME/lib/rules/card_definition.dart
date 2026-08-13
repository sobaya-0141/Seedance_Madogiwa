enum CardAbility {
  none,
  comfort,
  tentacles,
  song,
  repair,
  gyunGyun,
  escape,
  regulation,
  bonk,
}

class GridOffset {
  const GridOffset(this.row, this.column);

  final int row;
  final int column;
}

class CardDefinition {
  const CardDefinition({
    required this.id,
    required this.name,
    required this.epithet,
    required this.quote,
    required this.power,
    required this.ability,
    required this.artAsset,
    required this.accentArgb,
    required this.pattern,
    this.artFocusY = 0.5,
  });

  final String id;
  final String name;
  final String epithet;
  final String quote;
  final int power;
  final CardAbility ability;
  final String artAsset;
  final int accentArgb;
  final List<GridOffset> pattern;
  final double artFocusY;
}

abstract final class CardCatalog {
  static const sobaya = CardDefinition(
    id: 'sobaya',
    name: 'そば屋',
    epithet: '窓際の店主',
    quote: '快適です！',
    power: 4,
    ability: CardAbility.comfort,
    artAsset: 'characters/sobaya.jpg',
    accentArgb: 0xFFFFB33F,
    pattern: [GridOffset(-1, 0), GridOffset(1, 0), GridOffset(0, 1)],
  );

  static const takosan = CardDefinition(
    id: 'takosan',
    name: 'たこさん',
    epithet: '無表情の訪問者',
    quote: '……',
    power: 1,
    ability: CardAbility.tentacles,
    artAsset: 'characters/takosan.png',
    accentArgb: 0xFFB88CFF,
    pattern: [
      GridOffset(-1, -1),
      GridOffset(-1, 0),
      GridOffset(-1, 1),
      GridOffset(0, -1),
      GridOffset(0, 1),
      GridOffset(1, -1),
      GridOffset(1, 0),
      GridOffset(1, 1),
    ],
  );

  static const tokun = CardDefinition(
    id: 'tokun',
    name: 'とーくん',
    epithet: '常夏の社長',
    quote: 'どんな時もBGM担当',
    power: 2,
    ability: CardAbility.song,
    artAsset: 'characters/tokun.jpg',
    accentArgb: 0xFF59E7C4,
    artFocusY: 0.28,
    pattern: [GridOffset(-1, 1), GridOffset(0, 1), GridOffset(1, 1)],
  );

  static const yotan = CardDefinition(
    id: 'yotan',
    name: 'よーたん',
    epithet: '復旧のCTO',
    quote: 'ロックに直すぜ',
    power: 3,
    ability: CardAbility.repair,
    artAsset: 'characters/yotan.jpg',
    accentArgb: 0xFF5FD4FF,
    artFocusY: 0.36,
    pattern: [GridOffset(0, 1), GridOffset(0, 2)],
  );

  static const fukuchan = CardDefinition(
    id: 'fukuchan',
    name: '福ちゃん',
    epithet: '常連第一号',
    quote: 'ギュンギュン！',
    power: 2,
    ability: CardAbility.gyunGyun,
    artAsset: 'characters/fukuchan.jpg',
    accentArgb: 0xFFFF6FAE,
    artFocusY: 0.30,
    pattern: [
      GridOffset(-1, 0),
      GridOffset(1, 0),
      GridOffset(-1, 1),
      GridOffset(1, 1),
    ],
  );

  static const yametaro = CardDefinition(
    id: 'yametaro',
    name: '無職やめたろう',
    epithet: '賞金2億',
    quote: 'どうせワイなんて',
    power: 1,
    ability: CardAbility.escape,
    artAsset: 'characters/yametaro.jpg',
    accentArgb: 0xFFD778FF,
    artFocusY: 0.32,
    pattern: [GridOffset(-1, 1), GridOffset(1, 1)],
  );

  static const okayaman = CardDefinition(
    id: 'okayaman',
    name: '窓際王おかやまん',
    epithet: 'レギュレーション',
    quote: '大変驚いております',
    power: 3,
    ability: CardAbility.regulation,
    artAsset: 'characters/okayaman.jpg',
    accentArgb: 0xFFFFDA67,
    pattern: [GridOffset(-1, 0), GridOffset(1, 0), GridOffset(0, 1)],
  );

  static const yumemin = CardDefinition(
    id: 'yumemin',
    name: 'ゆめみん',
    epithet: 'お目覚め係',
    quote: 'BONK!',
    power: 2,
    ability: CardAbility.bonk,
    artAsset: 'characters/yumemin.jpg',
    accentArgb: 0xFF73C8FF,
    pattern: [
      GridOffset(-1, 1),
      GridOffset(0, 1),
      GridOffset(0, 2),
      GridOffset(1, 1),
    ],
  );

  static const all = <CardDefinition>[
    sobaya,
    takosan,
    tokun,
    yotan,
    fukuchan,
    yametaro,
    okayaman,
    yumemin,
  ];

  static final Map<String, CardDefinition> _byId = {
    for (final card in all) card.id: card,
  };

  static CardDefinition byId(String id) {
    final card = _byId[id];
    if (card == null) {
      throw ArgumentError.value(id, 'id', 'Unknown card');
    }
    return card;
  }
}
