import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:marionette_flutter/marionette_flutter.dart';

import '../harness/harness_scenarios.dart';
import '../ui/game_screen.dart';
import '../ui/title_screen.dart';
import 'automation_state.dart';

void registerMadogiwaMarionetteExtensions() {
  if (!kDebugMode || kIsWeb) {
    return;
  }

  registerMarionetteExtension(
    name: 'madogiwa.openScenario',
    description:
        'Open a deterministic card-game harness scenario by id. '
        'Available ids: opening, gallery, escape, bonk, score, reversal.',
    callback: (params) async {
      final id = params['id'];
      if (id == null || id.isEmpty) {
        return MarionetteExtensionResult.invalidParams(
          'Missing required parameter: id',
        );
      }
      final scenario = HarnessScenarios.byId(id);
      if (scenario == null) {
        return MarionetteExtensionResult.error(1, 'Unknown scenario: $id');
      }
      final navigator = MadogiwaAutomationState.navigatorKey.currentState;
      if (navigator == null) {
        return MarionetteExtensionResult.error(2, 'Navigator not available.');
      }
      unawaited(
        navigator.pushAndRemoveUntil<void>(
          MaterialPageRoute<void>(
            builder: (_) => GameScreen(
              initialState: scenario.buildState(),
              aiEnabled: scenario.aiEnabled,
              title: 'HARNESS · ${scenario.title}',
            ),
          ),
          (_) => false,
        ),
      );
      return MarionetteExtensionResult.success({
        'id': id,
        'title': scenario.title,
        'status': 'navigated',
      });
    },
  );

  registerMarionetteExtension(
    name: 'madogiwa.openTitle',
    description: 'Return to the MADOGIWA GRID title screen.',
    callback: (_) async {
      final navigator = MadogiwaAutomationState.navigatorKey.currentState;
      if (navigator == null) {
        return MarionetteExtensionResult.error(1, 'Navigator not available.');
      }
      unawaited(
        navigator.pushAndRemoveUntil<void>(
          MaterialPageRoute<void>(builder: (_) => const TitleScreen()),
          (_) => false,
        ),
      );
      return MarionetteExtensionResult.success({'status': 'navigated'});
    },
  );

  registerMarionetteExtension(
    name: 'madogiwa.inspectGame',
    description:
        'Inspect rule state and Flame card component positions for the active '
        'match. Useful when cards are clipped or stacked.',
    callback: (_) async {
      final controller = MadogiwaAutomationState.controller;
      final game = MadogiwaAutomationState.game;
      if (controller == null || game == null) {
        return MarionetteExtensionResult.error(1, 'No active match.');
      }
      final state = controller.state;
      return MarionetteExtensionResult.success({
        'turn': state.turn,
        'phase': state.phase.name,
        'currentSide': state.currentSide.name,
        'selectedCardId': controller.selectedCardId,
        'playerHand': state.playerHand,
        'rivalHandCount': state.rivalHand.length,
        'playerDeckCount': state.playerDeck.length,
        'boardCardCount': state.board.where((cell) => cell.card != null).length,
        'rowScores': [
          for (final score in state.rowScores)
            {'player': score.player, 'rival': score.rival},
        ],
        'flame': game.debugSnapshot,
      });
    },
  );

  registerMarionetteExtension(
    name: 'madogiwa.restartMatch',
    description:
        'Restart the active match from its deterministic initial state.',
    callback: (_) async {
      final controller = MadogiwaAutomationState.controller;
      if (controller == null) {
        return MarionetteExtensionResult.error(1, 'No active match.');
      }
      controller.restart();
      return MarionetteExtensionResult.success({
        'status': 'restarted',
        'playerHand': controller.state.playerHand,
      });
    },
  );
}
