import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_grid/rules/ai_player.dart';
import 'package:madogiwa_grid/rules/game_engine.dart';
import 'package:madogiwa_grid/rules/game_state.dart';

void main() {
  group('AiPlayer', () {
    test('all difficulty levels return legal moves', () {
      const engine = GameEngine();
      for (final difficulty in AiDifficulty.values) {
        final state = GameState.initial(seed: 12);
        final move = AiPlayer(
          difficulty: difficulty,
          seed: 12,
        ).chooseMove(state);

        expect(move, isNotNull);
        expect(engine.isLegalMove(state, move!), isTrue);
      }
    });

    test('normal AI self-play completes without an invalid state', () {
      const engine = GameEngine();
      var state = GameState.initial(seed: 88);
      final player = AiPlayer(seed: 1);
      final rival = AiPlayer(seed: 2);

      while (state.phase == MatchPhase.playing && state.turn < 100) {
        final ai = state.currentSide == PlayerSide.player ? player : rival;
        final move = ai.chooseMove(state);
        state = move == null
            ? engine.pass(state, state.currentSide).state
            : engine.playCard(state, move).state;
      }

      expect(state.phase, MatchPhase.finished);
      expect(state.winner, isNotNull);
      expect(state.turn, lessThan(100));
    });
  });
}
