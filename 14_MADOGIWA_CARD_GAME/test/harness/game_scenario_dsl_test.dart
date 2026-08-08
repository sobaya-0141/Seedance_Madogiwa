import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_grid/game/game_controller.dart';
import 'package:madogiwa_grid/harness/harness_scenarios.dart';
import 'package:madogiwa_grid/rules/game_event.dart';
import 'package:madogiwa_grid/rules/game_state.dart';

import '../helpers/game_test_dsl.dart';

void main() {
  group('GameTestScenario', () {
    test('escape fixture plays as a readable scenario timeline', () async {
      final scenario = HarnessScenarios.byId('escape')!;
      final controller = GameController(
        initialState: scenario.buildState(),
        aiEnabled: false,
        aiDelay: Duration.zero,
      );
      addTearDown(controller.dispose);

      await GameTestScenario(controller)
          .play('sobaya', 1, 1)
          .expectCard('sobaya', 1, 1)
          .expectEvent<CardEscapedEvent>()
          .expectCurrentSide(PlayerSide.rival)
          .run();
    });

    test('BONK fixture silences the adjacent Sobaya', () async {
      final scenario = HarnessScenarios.byId('bonk')!;
      final controller = GameController(
        initialState: scenario.buildState(),
        aiEnabled: false,
        aiDelay: Duration.zero,
      );
      addTearDown(controller.dispose);

      await GameTestScenario(controller)
          .play('yumemin', 1, 1)
          .expectCard('yumemin', 1, 1)
          .expectSilenced(1, 2)
          .expectEvent<CardBonkedEvent>()
          .run();
    });

    test('row reversal fixture emits the takeover event', () async {
      final scenario = HarnessScenarios.byId('reversal')!;
      final controller = GameController(
        initialState: scenario.buildState(),
        aiEnabled: false,
        aiDelay: Duration.zero,
      );
      addTearDown(controller.dispose);

      await GameTestScenario(
        controller,
      ).play('sobaya', 0, 0).expectEvent<RowLeadReversedEvent>().run();
    });
  });
}
