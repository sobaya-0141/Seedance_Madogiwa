import '../rules/card_definition.dart';
import '../rules/game_state.dart';

class HarnessScenario {
  const HarnessScenario({
    required this.id,
    required this.title,
    required this.description,
    required this.buildState,
    this.aiEnabled = false,
  });

  final String id;
  final String title;
  final String description;
  final GameState Function() buildState;
  final bool aiEnabled;
}

abstract final class HarnessScenarios {
  static final all = <HarnessScenario>[
    HarnessScenario(
      id: 'opening',
      title: 'Opening Hand',
      description: '固定シードの通常対戦。扇形手札と合法マスを確認。',
      buildState: () => GameState.initial(seed: 20260730),
      aiEnabled: true,
    ),
    HarnessScenario(
      id: 'gallery',
      title: 'All 8 Cards',
      description: '正典画像を使った全カードの盤面表示。',
      buildState: _galleryState,
    ),
    HarnessScenario(
      id: 'escape',
      title: 'Yametaro Escape',
      description: 'そば屋を中央左へ置くと、やめたろうが逃走。',
      buildState: _escapeState,
    ),
    HarnessScenario(
      id: 'bonk',
      title: 'Yumemin BONK',
      description: 'ゆめみんを中央左へ置いて、そば屋をBONK。',
      buildState: _bonkState,
    ),
    HarnessScenario(
      id: 'score',
      title: 'Row Scoring',
      description: '3行の得点が競っている終盤状態。',
      buildState: _scoreState,
    ),
    HarnessScenario(
      id: 'reversal',
      title: 'Row Reversal',
      description: '上段左へそば屋を配置して、行の主導権を逆転。',
      buildState: _reversalState,
    ),
  ];

  static HarnessScenario? byId(String id) {
    for (final scenario in all) {
      if (scenario.id == id) {
        return scenario;
      }
    }
    return null;
  }

  static GameState _galleryState() {
    final board = _neutralBoard();
    for (var index = 0; index < CardCatalog.all.length; index += 1) {
      final position = BoardPosition(
        index ~/ GameState.columns,
        index % GameState.columns,
      );
      final owner = index.isEven ? PlayerSide.player : PlayerSide.rival;
      board[_index(position)] = GridCell(
        influenceOwner: owner,
        card: PlacedCard(definitionId: CardCatalog.all[index].id, owner: owner),
      );
    }
    return GameState.fixture(
      board: board,
      playerHand: const ['sobaya', 'yumemin'],
      rivalHand: const ['yametaro'],
    );
  }

  static GameState _escapeState() {
    final board = _homeBoard();
    board[_index(const BoardPosition(1, 1))] = const GridCell(
      influenceOwner: PlayerSide.player,
    );
    board[_index(const BoardPosition(1, 2))] = const GridCell(
      influenceOwner: PlayerSide.rival,
      card: PlacedCard(definitionId: 'yametaro', owner: PlayerSide.rival),
    );
    return GameState.fixture(
      board: board,
      playerHand: const ['sobaya', 'takosan'],
      rivalHand: const ['tokun'],
    );
  }

  static GameState _bonkState() {
    final board = _homeBoard();
    board[_index(const BoardPosition(1, 1))] = const GridCell(
      influenceOwner: PlayerSide.player,
    );
    board[_index(const BoardPosition(1, 2))] = const GridCell(
      influenceOwner: PlayerSide.rival,
      card: PlacedCard(definitionId: 'sobaya', owner: PlayerSide.rival),
    );
    return GameState.fixture(
      board: board,
      playerHand: const ['yumemin', 'fukuchan'],
      rivalHand: const ['yotan'],
    );
  }

  static GameState _scoreState() {
    final board = _homeBoard();
    const placements = [
      (BoardPosition(0, 0), 'sobaya', PlayerSide.player),
      (BoardPosition(0, 4), 'yotan', PlayerSide.rival),
      (BoardPosition(1, 1), 'tokun', PlayerSide.player),
      (BoardPosition(1, 3), 'okayaman', PlayerSide.rival),
      (BoardPosition(2, 1), 'fukuchan', PlayerSide.player),
      (BoardPosition(2, 4), 'takosan', PlayerSide.rival),
    ];
    for (final (position, cardId, owner) in placements) {
      board[_index(position)] = GridCell(
        influenceOwner: owner,
        card: PlacedCard(definitionId: cardId, owner: owner),
      );
    }
    board[_index(const BoardPosition(2, 2))] = const GridCell(
      influenceOwner: PlayerSide.player,
    );
    return GameState.fixture(
      board: board,
      playerHand: const ['yumemin', 'yametaro'],
      rivalHand: const ['sobaya'],
      turn: 11,
    );
  }

  static GameState _reversalState() {
    final board = _homeBoard();
    board[_index(const BoardPosition(0, 3))] = const GridCell(
      influenceOwner: PlayerSide.rival,
      card: PlacedCard(definitionId: 'yotan', owner: PlayerSide.rival),
    );
    return GameState.fixture(
      board: board,
      playerHand: const ['sobaya', 'takosan'],
      rivalHand: const ['yumemin'],
      playerDeck: const ['tokun'],
      rivalDeck: const ['fukuchan'],
      turn: 7,
    );
  }

  static List<GridCell> _neutralBoard() =>
      List.filled(GameState.rows * GameState.columns, const GridCell());

  static List<GridCell> _homeBoard() {
    return List.generate(GameState.rows * GameState.columns, (index) {
      final column = index % GameState.columns;
      if (column == 0) {
        return const GridCell(influenceOwner: PlayerSide.player);
      }
      if (column == GameState.columns - 1) {
        return const GridCell(influenceOwner: PlayerSide.rival);
      }
      return const GridCell();
    });
  }

  static int _index(BoardPosition position) =>
      position.row * GameState.columns + position.column;
}
