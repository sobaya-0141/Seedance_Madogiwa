import 'dart:math';

import 'card_definition.dart';

enum PlayerSide {
  player,
  rival;

  PlayerSide get opponent =>
      this == PlayerSide.player ? PlayerSide.rival : PlayerSide.player;

  int get forward => this == PlayerSide.player ? 1 : -1;
}

enum MatchPhase { playing, finished }

enum MatchWinner { player, rival, draw }

class BoardPosition {
  const BoardPosition(this.row, this.column);

  final int row;
  final int column;

  @override
  bool operator ==(Object other) =>
      other is BoardPosition && row == other.row && column == other.column;

  @override
  int get hashCode => Object.hash(row, column);

  @override
  String toString() => '($row,$column)';
}

class PlacedCard {
  const PlacedCard({
    required this.definitionId,
    required this.owner,
    this.bonusPower = 0,
    this.silenced = false,
  });

  final String definitionId;
  final PlayerSide owner;
  final int bonusPower;
  final bool silenced;

  CardDefinition get definition => CardCatalog.byId(definitionId);
  int get power => max(0, definition.power + bonusPower);

  PlacedCard copyWith({int? bonusPower, bool? silenced}) {
    return PlacedCard(
      definitionId: definitionId,
      owner: owner,
      bonusPower: bonusPower ?? this.bonusPower,
      silenced: silenced ?? this.silenced,
    );
  }
}

class GridCell {
  const GridCell({this.influenceOwner, this.card});

  final PlayerSide? influenceOwner;
  final PlacedCard? card;

  bool get isEmpty => card == null;

  GridCell copyWith({
    PlayerSide? influenceOwner,
    bool clearInfluence = false,
    PlacedCard? card,
    bool clearCard = false,
  }) {
    return GridCell(
      influenceOwner: clearInfluence
          ? null
          : influenceOwner ?? this.influenceOwner,
      card: clearCard ? null : card ?? this.card,
    );
  }
}

class RowScore {
  const RowScore({required this.player, required this.rival});

  final int player;
  final int rival;
}

class GameState {
  GameState({
    required List<GridCell> board,
    required List<String> playerHand,
    required List<String> rivalHand,
    required List<String> playerDeck,
    required List<String> rivalDeck,
    required this.currentSide,
    required this.phase,
    required this.consecutivePasses,
    required this.turn,
    this.winner,
  }) : board = List.unmodifiable(board),
       playerHand = List.unmodifiable(playerHand),
       rivalHand = List.unmodifiable(rivalHand),
       playerDeck = List.unmodifiable(playerDeck),
       rivalDeck = List.unmodifiable(rivalDeck);

  static const rows = 3;
  static const columns = 5;

  final List<GridCell> board;
  final List<String> playerHand;
  final List<String> rivalHand;
  final List<String> playerDeck;
  final List<String> rivalDeck;
  final PlayerSide currentSide;
  final MatchPhase phase;
  final int consecutivePasses;
  final int turn;
  final MatchWinner? winner;

  factory GameState.initial({int seed = 20260730}) {
    final playerCards = CardCatalog.all.map((card) => card.id).toList();
    final rivalCards = CardCatalog.all.map((card) => card.id).toList();
    playerCards.shuffle(Random(seed));
    rivalCards.shuffle(Random(seed ^ 0x5F3759DF));

    final board = List.generate(rows * columns, (index) {
      final column = index % columns;
      if (column == 0) {
        return const GridCell(influenceOwner: PlayerSide.player);
      }
      if (column == columns - 1) {
        return const GridCell(influenceOwner: PlayerSide.rival);
      }
      return const GridCell();
    });

    return GameState(
      board: board,
      playerHand: playerCards.take(4).toList(),
      rivalHand: rivalCards.take(4).toList(),
      playerDeck: playerCards.skip(4).toList(),
      rivalDeck: rivalCards.skip(4).toList(),
      currentSide: PlayerSide.player,
      phase: MatchPhase.playing,
      consecutivePasses: 0,
      turn: 1,
    );
  }

  factory GameState.fixture({
    required List<GridCell> board,
    List<String> playerHand = const [],
    List<String> rivalHand = const [],
    List<String> playerDeck = const [],
    List<String> rivalDeck = const [],
    PlayerSide currentSide = PlayerSide.player,
    MatchPhase phase = MatchPhase.playing,
    int consecutivePasses = 0,
    int turn = 1,
    MatchWinner? winner,
  }) {
    if (board.length != rows * columns) {
      throw ArgumentError('A fixture board must contain exactly 15 cells.');
    }
    return GameState(
      board: board,
      playerHand: playerHand,
      rivalHand: rivalHand,
      playerDeck: playerDeck,
      rivalDeck: rivalDeck,
      currentSide: currentSide,
      phase: phase,
      consecutivePasses: consecutivePasses,
      turn: turn,
      winner: winner,
    );
  }

  int indexOf(BoardPosition position) =>
      position.row * columns + position.column;

  bool contains(BoardPosition position) =>
      position.row >= 0 &&
      position.row < rows &&
      position.column >= 0 &&
      position.column < columns;

  GridCell cellAt(BoardPosition position) => board[indexOf(position)];

  List<String> handFor(PlayerSide side) =>
      side == PlayerSide.player ? playerHand : rivalHand;

  List<String> deckFor(PlayerSide side) =>
      side == PlayerSide.player ? playerDeck : rivalDeck;

  List<RowScore> get rowScores {
    return List.generate(rows, (row) {
      var player = 0;
      var rival = 0;
      for (var column = 0; column < columns; column += 1) {
        final card = cellAt(BoardPosition(row, column)).card;
        if (card == null) {
          continue;
        }
        if (card.owner == PlayerSide.player) {
          player += card.power;
        } else {
          rival += card.power;
        }
      }
      return RowScore(player: player, rival: rival);
    });
  }

  int rowsWonBy(PlayerSide side) {
    return rowScores.where((score) {
      return side == PlayerSide.player
          ? score.player > score.rival
          : score.rival > score.player;
    }).length;
  }

  int totalPower(PlayerSide side) {
    return board.fold(0, (total, cell) {
      final card = cell.card;
      return total + (card != null && card.owner == side ? card.power : 0);
    });
  }

  GameState copyWith({
    List<GridCell>? board,
    List<String>? playerHand,
    List<String>? rivalHand,
    List<String>? playerDeck,
    List<String>? rivalDeck,
    PlayerSide? currentSide,
    MatchPhase? phase,
    int? consecutivePasses,
    int? turn,
    MatchWinner? winner,
    bool clearWinner = false,
  }) {
    return GameState(
      board: board ?? this.board,
      playerHand: playerHand ?? this.playerHand,
      rivalHand: rivalHand ?? this.rivalHand,
      playerDeck: playerDeck ?? this.playerDeck,
      rivalDeck: rivalDeck ?? this.rivalDeck,
      currentSide: currentSide ?? this.currentSide,
      phase: phase ?? this.phase,
      consecutivePasses: consecutivePasses ?? this.consecutivePasses,
      turn: turn ?? this.turn,
      winner: clearWinner ? null : winner ?? this.winner,
    );
  }
}

class GameMove {
  const GameMove({
    required this.side,
    required this.cardId,
    required this.position,
  });

  final PlayerSide side;
  final String cardId;
  final BoardPosition position;

  @override
  String toString() => '${side.name}:$cardId@$position';
}
