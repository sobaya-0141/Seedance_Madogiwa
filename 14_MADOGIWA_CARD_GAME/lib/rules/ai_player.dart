import 'dart:math';

import 'game_engine.dart';
import 'game_state.dart';

enum AiDifficulty { easy, normal, hard }

class AiPlayer {
  AiPlayer({
    this.difficulty = AiDifficulty.normal,
    int seed = 0xC0FFEE,
    this._engine = const GameEngine(),
  }) : _random = Random(seed);

  final AiDifficulty difficulty;
  final Random _random;
  final GameEngine _engine;

  GameMove? chooseMove(GameState state) {
    final moves = _engine.legalMoves(state);
    if (moves.isEmpty) {
      return null;
    }
    return switch (difficulty) {
      AiDifficulty.easy => moves[_random.nextInt(moves.length)],
      AiDifficulty.normal => _bestOnePly(state, moves),
      AiDifficulty.hard => _bestMinimax(state, moves, depth: 3),
    };
  }

  GameMove _bestOnePly(GameState state, List<GameMove> moves) {
    var bestScore = -double.infinity;
    final bestMoves = <GameMove>[];
    for (final move in moves) {
      final outcome = _engine.playCard(state, move);
      final score = _evaluate(outcome.state, move.side);
      if (score > bestScore) {
        bestScore = score;
        bestMoves
          ..clear()
          ..add(move);
      } else if (score == bestScore) {
        bestMoves.add(move);
      }
    }
    return bestMoves[_random.nextInt(bestMoves.length)];
  }

  GameMove _bestMinimax(
    GameState state,
    List<GameMove> moves, {
    required int depth,
  }) {
    final maximizingSide = state.currentSide;
    var bestScore = -double.infinity;
    var bestMove = moves.first;
    for (final move in moves) {
      final outcome = _engine.playCard(state, move);
      final score = _minimax(
        outcome.state,
        depth - 1,
        maximizingSide,
        -double.infinity,
        double.infinity,
      );
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  double _minimax(
    GameState state,
    int depth,
    PlayerSide maximizingSide,
    double alpha,
    double beta,
  ) {
    if (depth <= 0 || state.phase == MatchPhase.finished) {
      return _evaluate(state, maximizingSide);
    }
    final moves = _engine.legalMoves(state);
    if (moves.isEmpty) {
      return _minimax(
        _engine.pass(state, state.currentSide).state,
        depth - 1,
        maximizingSide,
        alpha,
        beta,
      );
    }

    if (state.currentSide == maximizingSide) {
      var value = -double.infinity;
      for (final move in moves) {
        value = max(
          value,
          _minimax(
            _engine.playCard(state, move).state,
            depth - 1,
            maximizingSide,
            alpha,
            beta,
          ),
        );
        alpha = max(alpha, value);
        if (alpha >= beta) {
          break;
        }
      }
      return value;
    }

    var value = double.infinity;
    for (final move in moves) {
      value = min(
        value,
        _minimax(
          _engine.playCard(state, move).state,
          depth - 1,
          maximizingSide,
          alpha,
          beta,
        ),
      );
      beta = min(beta, value);
      if (alpha >= beta) {
        break;
      }
    }
    return value;
  }

  double _evaluate(GameState state, PlayerSide side) {
    if (state.phase == MatchPhase.finished) {
      final expectedWinner = side == PlayerSide.player
          ? MatchWinner.player
          : MatchWinner.rival;
      if (state.winner == expectedWinner) {
        return 10000;
      }
      if (state.winner == MatchWinner.draw) {
        return 0;
      }
      return -10000;
    }

    final opponent = side.opponent;
    final rowValue =
        (state.rowsWonBy(side) - state.rowsWonBy(opponent)) * 120.0;
    final powerValue =
        (state.totalPower(side) - state.totalPower(opponent)) * 7.0;
    final territoryValue = state.board.fold<double>(0, (score, cell) {
      if (!cell.isEmpty) {
        return score;
      }
      if (cell.influenceOwner == side) {
        return score + 3;
      }
      if (cell.influenceOwner == opponent) {
        return score - 3;
      }
      return score;
    });
    return rowValue + powerValue + territoryValue;
  }
}
