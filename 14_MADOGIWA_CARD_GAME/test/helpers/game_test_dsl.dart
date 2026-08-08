import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_grid/game/game_controller.dart';
import 'package:madogiwa_grid/rules/game_event.dart';
import 'package:madogiwa_grid/rules/game_state.dart';

sealed class _GameStep {
  const _GameStep();
}

class _PlayStep extends _GameStep {
  const _PlayStep(this.cardId, this.position);

  final String cardId;
  final BoardPosition position;
}

class _ExpectCardStep extends _GameStep {
  const _ExpectCardStep(this.cardId, this.position);

  final String cardId;
  final BoardPosition position;
}

class _ExpectSilencedStep extends _GameStep {
  const _ExpectSilencedStep(this.position);

  final BoardPosition position;
}

class _ExpectEventStep<T extends GameEvent> extends _GameStep {
  const _ExpectEventStep();
}

class _ExpectSideStep extends _GameStep {
  const _ExpectSideStep(this.side);

  final PlayerSide side;
}

/// Fluent scenario runner inspired by ccpocket's chat test DSL.
///
/// It keeps setup, player actions, and assertions readable as one timeline.
class GameTestScenario {
  GameTestScenario(this.controller);

  final GameController controller;
  final List<_GameStep> _steps = [];

  GameTestScenario play(String cardId, int row, int column) {
    _steps.add(_PlayStep(cardId, BoardPosition(row, column)));
    return this;
  }

  GameTestScenario expectCard(String cardId, int row, int column) {
    _steps.add(_ExpectCardStep(cardId, BoardPosition(row, column)));
    return this;
  }

  GameTestScenario expectSilenced(int row, int column) {
    _steps.add(_ExpectSilencedStep(BoardPosition(row, column)));
    return this;
  }

  GameTestScenario expectEvent<T extends GameEvent>() {
    _steps.add(_ExpectEventStep<T>());
    return this;
  }

  GameTestScenario expectCurrentSide(PlayerSide side) {
    _steps.add(_ExpectSideStep(side));
    return this;
  }

  Future<void> run() async {
    for (final step in _steps) {
      switch (step) {
        case _PlayStep():
          final accepted = await controller.playPlayerCard(
            step.cardId,
            step.position,
          );
          expect(
            accepted,
            isTrue,
            reason: 'Expected ${step.cardId} at ${step.position} to be legal.',
          );
        case _ExpectCardStep():
          expect(
            controller.state.cellAt(step.position).card?.definitionId,
            step.cardId,
          );
        case _ExpectSilencedStep():
          expect(controller.state.cellAt(step.position).card?.silenced, isTrue);
        case _ExpectEventStep<GameEvent>():
          final expectedType = step.runtimeType
              .toString()
              .replaceFirst('_ExpectEventStep<', '')
              .replaceFirst('>', '');
          expect(
            controller.eventHistory.any(
              (event) => event.runtimeType.toString() == expectedType,
            ),
            isTrue,
            reason: 'Expected event $expectedType in the event history.',
          );
        case _ExpectSideStep():
          expect(controller.state.currentSide, step.side);
      }
    }
  }
}
