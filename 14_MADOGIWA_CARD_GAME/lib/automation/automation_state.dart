import 'package:flutter/material.dart';

import '../game/game_controller.dart';
import '../game/madogiwa_grid_game.dart';

abstract final class MadogiwaAutomationState {
  static final navigatorKey = GlobalKey<NavigatorState>();

  static GameController? controller;
  static MadogiwaGridGame? game;

  static void attach({
    required GameController controller,
    required MadogiwaGridGame game,
  }) {
    MadogiwaAutomationState.controller = controller;
    MadogiwaAutomationState.game = game;
  }

  static void detach(MadogiwaGridGame game) {
    if (identical(MadogiwaAutomationState.game, game)) {
      controller = null;
      MadogiwaAutomationState.game = null;
    }
  }
}
