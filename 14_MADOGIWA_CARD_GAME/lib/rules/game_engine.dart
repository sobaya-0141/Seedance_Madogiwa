import 'card_definition.dart';
import 'game_event.dart';
import 'game_state.dart';

class GameRuleException implements Exception {
  const GameRuleException(this.message);

  final String message;

  @override
  String toString() => 'GameRuleException: $message';
}

class GameEngine {
  const GameEngine();

  List<GameMove> legalMoves(GameState state, [PlayerSide? side]) {
    final targetSide = side ?? state.currentSide;
    if (state.phase != MatchPhase.playing ||
        state.handFor(targetSide).isEmpty) {
      return const [];
    }

    final positions = <BoardPosition>[];
    for (var row = 0; row < GameState.rows; row += 1) {
      for (var column = 0; column < GameState.columns; column += 1) {
        final position = BoardPosition(row, column);
        final cell = state.cellAt(position);
        if (cell.isEmpty && cell.influenceOwner == targetSide) {
          positions.add(position);
        }
      }
    }

    return [
      for (final cardId in state.handFor(targetSide))
        for (final position in positions)
          GameMove(side: targetSide, cardId: cardId, position: position),
    ];
  }

  bool isLegalMove(GameState state, GameMove move) {
    return state.phase == MatchPhase.playing &&
        state.currentSide == move.side &&
        state.handFor(move.side).contains(move.cardId) &&
        state.contains(move.position) &&
        state.cellAt(move.position).isEmpty &&
        state.cellAt(move.position).influenceOwner == move.side;
  }

  TurnOutcome playCard(GameState state, GameMove move) {
    if (!isLegalMove(state, move)) {
      throw GameRuleException('Illegal move: $move');
    }

    final board = List<GridCell>.of(state.board);
    final events = <GameEvent>[];
    final previousRowScores = state.rowScores;
    final definition = CardCatalog.byId(move.cardId);
    final placedCard = PlacedCard(
      definitionId: definition.id,
      owner: move.side,
    );
    _setCell(
      board,
      move.position,
      state
          .cellAt(move.position)
          .copyWith(influenceOwner: move.side, card: placedCard),
    );
    events.add(
      CardPlayedEvent(
        side: move.side,
        cardId: definition.id,
        position: move.position,
      ),
    );

    for (final offset in definition.pattern) {
      final target = BoardPosition(
        move.position.row + offset.row,
        move.position.column + offset.column * move.side.forward,
      );
      if (!_contains(target)) {
        continue;
      }
      final current = _cellAt(board, target);
      if (!current.isEmpty || current.influenceOwner == move.side) {
        continue;
      }
      _setCell(board, target, current.copyWith(influenceOwner: move.side));
      events.add(
        CellClaimedEvent(
          position: target,
          side: move.side,
          previousOwner: current.influenceOwner,
        ),
      );
    }

    _applyAbility(board, move, definition, events);
    _triggerEscapes(board, move, events);
    _emitRowLeadReversals(previousRowScores, board, events);

    final hand = List<String>.of(state.handFor(move.side))..remove(move.cardId);
    final deck = List<String>.of(state.deckFor(move.side));
    if (deck.isNotEmpty) {
      hand.add(deck.removeAt(0));
    }

    var next = state.copyWith(
      board: board,
      playerHand: move.side == PlayerSide.player ? hand : null,
      rivalHand: move.side == PlayerSide.rival ? hand : null,
      playerDeck: move.side == PlayerSide.player ? deck : null,
      rivalDeck: move.side == PlayerSide.rival ? deck : null,
      currentSide: move.side.opponent,
      consecutivePasses: 0,
      turn: state.turn + 1,
    );
    next = _finishIfNeeded(next, events);
    if (next.phase == MatchPhase.playing) {
      events.add(TurnChangedEvent(next.currentSide));
    }
    return TurnOutcome(state: next, events: List.unmodifiable(events));
  }

  TurnOutcome pass(GameState state, PlayerSide side) {
    if (state.phase != MatchPhase.playing || state.currentSide != side) {
      throw const GameRuleException('Only the current player can pass.');
    }

    final events = <GameEvent>[];
    var next = state.copyWith(
      currentSide: side.opponent,
      consecutivePasses: state.consecutivePasses + 1,
      turn: state.turn + 1,
    );
    next = _finishIfNeeded(next, events);
    if (next.phase == MatchPhase.playing) {
      events.add(TurnChangedEvent(next.currentSide));
    }
    return TurnOutcome(state: next, events: List.unmodifiable(events));
  }

  void _applyAbility(
    List<GridCell> board,
    GameMove move,
    CardDefinition definition,
    List<GameEvent> events,
  ) {
    switch (definition.ability) {
      case CardAbility.comfort:
        if (_adjacentPositions(move.position).any((position) {
          return _cellAt(board, position).card?.owner == move.side;
        })) {
          _changePower(board, move.position, 1, '快適です！', events);
        }

      case CardAbility.song:
        for (final position in _adjacentPositions(move.position)) {
          if (_cellAt(board, position).card?.owner == move.side) {
            _changePower(board, position, 1, 'ウクレレBGM', events);
          }
        }

      case CardAbility.repair:
        final repairTarget = _positionsByDistance(move.position).where((
          position,
        ) {
          final cell = _cellAt(board, position);
          return cell.isEmpty && cell.influenceOwner == move.side.opponent;
        }).firstOrNull;
        if (repairTarget != null) {
          final previous = _cellAt(board, repairTarget);
          _setCell(
            board,
            repairTarget,
            previous.copyWith(influenceOwner: move.side),
          );
          events.add(
            CellClaimedEvent(
              position: repairTarget,
              side: move.side,
              previousOwner: previous.influenceOwner,
            ),
          );
        }

      case CardAbility.gyunGyun:
        final friends = _adjacentPositions(move.position).where((position) {
          return _cellAt(board, position).card?.owner == move.side;
        }).length;
        if (friends >= 2) {
          _changePower(board, move.position, 2, 'ギュンギュン', events);
        }

      case CardAbility.regulation:
        BoardPosition? target;
        for (var distance = 1; distance < GameState.columns; distance += 1) {
          final column = move.position.column + distance * move.side.forward;
          final candidate = BoardPosition(move.position.row, column);
          if (!_contains(candidate)) {
            break;
          }
          final cell = _cellAt(board, candidate);
          if (cell.isEmpty && cell.influenceOwner == move.side.opponent) {
            target = candidate;
            break;
          }
        }
        if (target != null) {
          final cell = _cellAt(board, target);
          _setCell(board, target, cell.copyWith(clearInfluence: true));
          events.add(RegulationAppliedEvent(target));
        }

      case CardAbility.bonk:
        final opponents =
            _adjacentPositions(move.position).where((position) {
              return _cellAt(board, position).card?.owner == move.side.opponent;
            }).toList()..sort((a, b) {
              final powerCompare = _cellAt(
                board,
                b,
              ).card!.power.compareTo(_cellAt(board, a).card!.power);
              if (powerCompare != 0) {
                return powerCompare;
              }
              return _indexOf(a).compareTo(_indexOf(b));
            });
        if (opponents.isNotEmpty) {
          final target = opponents.first;
          final cell = _cellAt(board, target);
          final targetCard = cell.card!;
          _setCell(
            board,
            target,
            cell.copyWith(card: targetCard.copyWith(silenced: true)),
          );
          events.add(
            CardBonkedEvent(position: target, cardId: targetCard.definitionId),
          );
        }

      case CardAbility.none:
      case CardAbility.tentacles:
      case CardAbility.escape:
        break;
    }
  }

  void _triggerEscapes(
    List<GridCell> board,
    GameMove threat,
    List<GameEvent> events,
  ) {
    final candidates = _adjacentPositions(threat.position).where((position) {
      final card = _cellAt(board, position).card;
      return card?.owner == threat.side.opponent &&
          card?.definition.ability == CardAbility.escape &&
          !card!.silenced;
    }).toList();

    for (final from in candidates) {
      final yametaro = _cellAt(board, from).card!;
      final destinations = <BoardPosition>[];
      for (var row = 0; row < GameState.rows; row += 1) {
        for (var column = 0; column < GameState.columns; column += 1) {
          final position = BoardPosition(row, column);
          final cell = _cellAt(board, position);
          if (position != from &&
              cell.isEmpty &&
              cell.influenceOwner == yametaro.owner) {
            destinations.add(position);
          }
        }
      }
      destinations.sort((a, b) {
        final aDistance = _manhattan(a, threat.position);
        final bDistance = _manhattan(b, threat.position);
        final distanceCompare = bDistance.compareTo(aDistance);
        return distanceCompare != 0
            ? distanceCompare
            : _indexOf(a).compareTo(_indexOf(b));
      });
      if (destinations.isEmpty) {
        continue;
      }

      final destination = destinations.first;
      final fromCell = _cellAt(board, from);
      final destinationCell = _cellAt(board, destination);
      _setCell(board, from, fromCell.copyWith(clearCard: true));
      _setCell(
        board,
        destination,
        destinationCell.copyWith(
          influenceOwner: yametaro.owner,
          card: yametaro,
        ),
      );
      events.add(
        CardEscapedEvent(side: yametaro.owner, from: from, to: destination),
      );
    }
  }

  void _changePower(
    List<GridCell> board,
    BoardPosition position,
    int delta,
    String reason,
    List<GameEvent> events,
  ) {
    final cell = _cellAt(board, position);
    final card = cell.card;
    if (card == null) {
      return;
    }
    _setCell(
      board,
      position,
      cell.copyWith(card: card.copyWith(bonusPower: card.bonusPower + delta)),
    );
    events.add(
      PowerChangedEvent(position: position, delta: delta, reason: reason),
    );
  }

  void _emitRowLeadReversals(
    List<RowScore> previousScores,
    List<GridCell> board,
    List<GameEvent> events,
  ) {
    for (var row = 0; row < GameState.rows; row += 1) {
      final previousLeader = _leaderFor(previousScores[row]);
      final nextScore = _scoreRow(board, row);
      final nextLeader = _leaderFor(nextScore);
      if (previousLeader == null ||
          nextLeader == null ||
          nextLeader == previousLeader) {
        continue;
      }
      events.add(
        RowLeadReversedEvent(
          row: row,
          previousLeader: previousLeader,
          newLeader: nextLeader,
          playerScore: nextScore.player,
          rivalScore: nextScore.rival,
        ),
      );
    }
  }

  static RowScore _scoreRow(List<GridCell> board, int row) {
    var player = 0;
    var rival = 0;
    for (var column = 0; column < GameState.columns; column += 1) {
      final card = _cellAt(board, BoardPosition(row, column)).card;
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
  }

  static PlayerSide? _leaderFor(RowScore score) {
    if (score.player == score.rival) {
      return null;
    }
    return score.player > score.rival ? PlayerSide.player : PlayerSide.rival;
  }

  GameState _finishIfNeeded(GameState state, List<GameEvent> events) {
    final boardFull = state.board.every((cell) => !cell.isEmpty);
    final noCardsLeft =
        state.playerHand.isEmpty &&
        state.rivalHand.isEmpty &&
        state.playerDeck.isEmpty &&
        state.rivalDeck.isEmpty;
    if (!boardFull && !noCardsLeft && state.consecutivePasses < 2) {
      return state;
    }

    final playerRows = state.rowsWonBy(PlayerSide.player);
    final rivalRows = state.rowsWonBy(PlayerSide.rival);
    final winner = switch (playerRows.compareTo(rivalRows)) {
      1 => MatchWinner.player,
      -1 => MatchWinner.rival,
      _ => switch (state
          .totalPower(PlayerSide.player)
          .compareTo(state.totalPower(PlayerSide.rival))) {
        1 => MatchWinner.player,
        -1 => MatchWinner.rival,
        _ => MatchWinner.draw,
      },
    };
    events.add(MatchEndedEvent(winner));
    return state.copyWith(phase: MatchPhase.finished, winner: winner);
  }

  static int _indexOf(BoardPosition position) =>
      position.row * GameState.columns + position.column;

  static bool _contains(BoardPosition position) =>
      position.row >= 0 &&
      position.row < GameState.rows &&
      position.column >= 0 &&
      position.column < GameState.columns;

  static GridCell _cellAt(List<GridCell> board, BoardPosition position) =>
      board[_indexOf(position)];

  static void _setCell(
    List<GridCell> board,
    BoardPosition position,
    GridCell cell,
  ) {
    board[_indexOf(position)] = cell;
  }

  static List<BoardPosition> _adjacentPositions(BoardPosition center) {
    return const [
          BoardPosition(-1, 0),
          BoardPosition(1, 0),
          BoardPosition(0, -1),
          BoardPosition(0, 1),
        ]
        .map(
          (offset) => BoardPosition(
            center.row + offset.row,
            center.column + offset.column,
          ),
        )
        .where(_contains)
        .toList();
  }

  static Iterable<BoardPosition> _positionsByDistance(BoardPosition center) {
    final positions = <BoardPosition>[
      for (var row = 0; row < GameState.rows; row += 1)
        for (var column = 0; column < GameState.columns; column += 1)
          BoardPosition(row, column),
    ];
    positions.sort((a, b) {
      final distanceCompare = _manhattan(
        a,
        center,
      ).compareTo(_manhattan(b, center));
      return distanceCompare != 0
          ? distanceCompare
          : _indexOf(a).compareTo(_indexOf(b));
    });
    return positions;
  }

  static int _manhattan(BoardPosition a, BoardPosition b) =>
      (a.row - b.row).abs() + (a.column - b.column).abs();
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    return iterator.moveNext() ? iterator.current : null;
  }
}
