import 'package:flutter/foundation.dart';

enum GamePhase { playing, transitioning, cleared }

@immutable
class GameHudState {
  const GameHudState({
    required this.phase,
    required this.floorCode,
    required this.floorTitle,
    required this.floorIndex,
    required this.totalFloors,
    required this.objectiveProgress,
    required this.objectiveTotal,
    required this.objectiveLabel,
    required this.actionLabel,
    required this.message,
    required this.clearTitle,
    required this.transitionTitle,
    required this.elapsedSeconds,
    required this.stylePoints,
    required this.flow,
    required this.rank,
    required this.attractMode,
  });

  const GameHudState.initial()
    : phase = GamePhase.playing,
      floorCode = '1F',
      floorTitle = 'OFFICE ATRIUM',
      floorIndex = 1,
      totalFloors = 2,
      objectiveProgress = 0,
      objectiveTotal = 3,
      objectiveLabel = 'CLEAR THE ROUTE',
      actionLabel = 'SMASH',
      message = '荷物を片付けてエレベーターを開こう',
      clearTitle = '立ち飲み処オープン！',
      transitionTitle = '',
      elapsedSeconds = 0,
      stylePoints = 0,
      flow = 0,
      rank = '—',
      attractMode = false;

  final GamePhase phase;
  final String floorCode;
  final String floorTitle;
  final int floorIndex;
  final int totalFloors;
  final int objectiveProgress;
  final int objectiveTotal;
  final String objectiveLabel;
  final String actionLabel;
  final String message;
  final String clearTitle;
  final String transitionTitle;
  final double elapsedSeconds;
  final int stylePoints;
  final int flow;
  final String rank;
  final bool attractMode;

  bool get isCleared => phase == GamePhase.cleared;
  bool get isTransitioning => phase == GamePhase.transitioning;
  bool get exitUnlocked => objectiveProgress >= objectiveTotal;
}
