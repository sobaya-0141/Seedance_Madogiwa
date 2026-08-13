// ignore_for_file: avoid_print

import 'package:madogiwa_grid/rules/ai_player.dart';
import 'package:madogiwa_grid/rules/game_engine.dart';
import 'package:madogiwa_grid/rules/game_state.dart';

void main(List<String> arguments) {
  final matchCount = arguments.isEmpty
      ? 200
      : int.tryParse(arguments.first) ?? 200;
  const engine = GameEngine();
  var playerWins = 0;
  var rivalWins = 0;
  var draws = 0;
  var totalTurns = 0;

  for (var seed = 0; seed < matchCount; seed += 1) {
    var state = GameState.initial(seed: 1000 + seed);
    final playerAi = AiPlayer(
      difficulty: AiDifficulty.normal,
      seed: 7000 + seed,
    );
    final rivalAi = AiPlayer(
      difficulty: AiDifficulty.normal,
      seed: 9000 + seed,
    );

    while (state.phase == MatchPhase.playing && state.turn < 100) {
      final ai = state.currentSide == PlayerSide.player ? playerAi : rivalAi;
      final move = ai.chooseMove(state);
      state = move == null
          ? engine.pass(state, state.currentSide).state
          : engine.playCard(state, move).state;
    }

    totalTurns += state.turn;
    switch (state.winner) {
      case MatchWinner.player:
        playerWins += 1;
      case MatchWinner.rival:
        rivalWins += 1;
      case MatchWinner.draw:
      case null:
        draws += 1;
    }
  }

  final averageTurns = totalTurns / matchCount;
  final firstRate = playerWins / matchCount * 100;
  final secondRate = rivalWins / matchCount * 100;
  print('MADOGIWA GRID AI simulation');
  print('matches: $matchCount');
  print('player: $playerWins (${firstRate.toStringAsFixed(1)}%)');
  print('rival:  $rivalWins (${secondRate.toStringAsFixed(1)}%)');
  print('draws:  $draws');
  print('average turns: ${averageTurns.toStringAsFixed(2)}');
}
