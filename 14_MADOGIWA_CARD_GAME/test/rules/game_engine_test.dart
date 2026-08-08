import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_grid/rules/game_engine.dart';
import 'package:madogiwa_grid/rules/game_event.dart';
import 'package:madogiwa_grid/rules/game_state.dart';

void main() {
  const engine = GameEngine();

  group('GameEngine', () {
    test('initial state exposes legal placements on the player home edge', () {
      final state = GameState.initial(seed: 42);
      final moves = engine.legalMoves(state);

      expect(moves, hasLength(12));
      expect(moves.every((move) => move.position.column == 0), isTrue);
    });

    test('playing a card occupies a cell, claims pattern, and draws', () {
      final state = GameState.initial(seed: 42);
      final move = engine.legalMoves(state).first;
      final outcome = engine.playCard(state, move);

      expect(
        outcome.state.cellAt(move.position).card?.definitionId,
        move.cardId,
      );
      expect(outcome.state.playerHand, hasLength(4));
      expect(outcome.state.playerDeck, hasLength(3));
      expect(outcome.state.currentSide, PlayerSide.rival);
      expect(outcome.events.whereType<CardPlayedEvent>(), hasLength(1));
      expect(outcome.events.whereType<CellClaimedEvent>(), isNotEmpty);
    });

    test('Yametaro escapes to the farthest friendly empty influence cell', () {
      final board = _homeBoard();
      board[_index(const BoardPosition(1, 1))] = const GridCell(
        influenceOwner: PlayerSide.player,
        card: PlacedCard(definitionId: 'yametaro', owner: PlayerSide.player),
      );
      board[_index(const BoardPosition(1, 2))] = const GridCell(
        influenceOwner: PlayerSide.rival,
      );
      final state = GameState.fixture(
        board: board,
        rivalHand: const ['sobaya'],
        currentSide: PlayerSide.rival,
      );

      final outcome = engine.playCard(
        state,
        const GameMove(
          side: PlayerSide.rival,
          cardId: 'sobaya',
          position: BoardPosition(1, 2),
        ),
      );
      final escape = outcome.events.whereType<CardEscapedEvent>().single;

      expect(escape.from, const BoardPosition(1, 1));
      expect(outcome.state.cellAt(escape.from).card, isNull);
      expect(outcome.state.cellAt(escape.to).card?.definitionId, 'yametaro');
    });

    test('Yumemin BONK silences the strongest adjacent opponent', () {
      final board = _homeBoard();
      board[_index(const BoardPosition(1, 1))] = const GridCell(
        influenceOwner: PlayerSide.player,
      );
      board[_index(const BoardPosition(1, 2))] = const GridCell(
        influenceOwner: PlayerSide.rival,
        card: PlacedCard(definitionId: 'sobaya', owner: PlayerSide.rival),
      );
      final state = GameState.fixture(
        board: board,
        playerHand: const ['yumemin'],
      );

      final outcome = engine.playCard(
        state,
        const GameMove(
          side: PlayerSide.player,
          cardId: 'yumemin',
          position: BoardPosition(1, 1),
        ),
      );

      expect(
        outcome.state.cellAt(const BoardPosition(1, 2)).card?.silenced,
        isTrue,
      );
      expect(outcome.events.whereType<CardBonkedEvent>(), hasLength(1));
    });

    test('emits a row reversal only when the opposing lead is overtaken', () {
      final board = _homeBoard();
      board[_index(const BoardPosition(0, 3))] = const GridCell(
        influenceOwner: PlayerSide.rival,
        card: PlacedCard(definitionId: 'yotan', owner: PlayerSide.rival),
      );
      final state = GameState.fixture(
        board: board,
        playerHand: const ['sobaya'],
      );

      final outcome = engine.playCard(
        state,
        const GameMove(
          side: PlayerSide.player,
          cardId: 'sobaya',
          position: BoardPosition(0, 0),
        ),
      );
      final reversal = outcome.events.whereType<RowLeadReversedEvent>().single;

      expect(reversal.row, 0);
      expect(reversal.previousLeader, PlayerSide.rival);
      expect(reversal.newLeader, PlayerSide.player);
      expect(reversal.playerScore, 4);
      expect(reversal.rivalScore, 3);
    });

    test('two passes finish and resolve row majority', () {
      final board = _homeBoard();
      board[_index(const BoardPosition(0, 0))] = const GridCell(
        influenceOwner: PlayerSide.player,
        card: PlacedCard(definitionId: 'sobaya', owner: PlayerSide.player),
      );
      final state = GameState.fixture(
        board: board,
        playerHand: const ['takosan'],
        rivalHand: const ['tokun'],
      );

      final afterPlayer = engine.pass(state, PlayerSide.player).state;
      final afterRival = engine.pass(afterPlayer, PlayerSide.rival).state;

      expect(afterRival.phase, MatchPhase.finished);
      expect(afterRival.winner, MatchWinner.player);
    });
  });
}

List<GridCell> _homeBoard() {
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

int _index(BoardPosition position) =>
    position.row * GameState.columns + position.column;
