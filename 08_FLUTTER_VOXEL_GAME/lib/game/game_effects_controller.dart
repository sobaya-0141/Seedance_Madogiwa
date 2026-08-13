import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/foundation.dart';

class ImpactPulse {
  ImpactPulse({required this.origin, required this.strength});

  final Offset origin;
  final double strength;
  double age = 0;

  double get progress => (age / 0.72).clamp(0.0, 1.0);
  bool get expired => age >= 0.72;
}

class GameEffectsController extends ChangeNotifier {
  final List<ImpactPulse> impacts = [];

  double time = 0;
  double movement = 0;
  double flash = 0;
  double exitPulse = 0;
  double clearPulse = 0;
  double floorPulse = 0;
  double introProgress = 0;
  Offset playerAnchor = const Offset(0.5, 0.56);
  double _repaintAccumulator = 0;

  bool get introComplete => introProgress >= 1;

  void advance(
    double dt, {
    required double movementAmount,
    required Offset projectedPlayer,
  }) {
    time += dt;
    movement += (movementAmount - movement) * (1 - math.exp(-dt * 9));
    playerAnchor = projectedPlayer;
    introProgress = (introProgress + dt / 2.35).clamp(0.0, 1.0);
    flash = math.max(0, flash - dt * 3.4);
    exitPulse = math.max(0, exitPulse - dt * 0.72);
    clearPulse = math.max(0, clearPulse - dt * 0.36);
    floorPulse = math.max(0, floorPulse - dt * 0.72);
    for (final impact in impacts) {
      impact.age += dt;
    }
    impacts.removeWhere((impact) => impact.expired);
    _repaintAccumulator += dt;
    if (_repaintAccumulator >= _effectFrameInterval) {
      _repaintAccumulator %= _effectFrameInterval;
      notifyListeners();
    }
  }

  void triggerImpact({required bool destroyed}) {
    impacts.add(
      ImpactPulse(origin: playerAnchor, strength: destroyed ? 1 : 0.58),
    );
    flash = math.max(flash, destroyed ? 0.82 : 0.34);
    notifyListeners();
  }

  void unlockExit() {
    exitPulse = 1;
    flash = math.max(flash, 0.46);
    notifyListeners();
  }

  void triggerPickup() {
    impacts.add(ImpactPulse(origin: playerAnchor, strength: 0.76));
    flash = math.max(flash, 0.48);
    notifyListeners();
  }

  void changeFloor() {
    floorPulse = 1;
    flash = math.max(flash, 0.38);
    notifyListeners();
  }

  void clear() {
    clearPulse = 1;
    flash = 1;
    notifyListeners();
  }

  void reset() {
    impacts.clear();
    movement = 0;
    flash = 0;
    exitPulse = 0;
    clearPulse = 0;
    floorPulse = 0;
    introProgress = 1;
    _repaintAccumulator = 0;
    notifyListeners();
  }

  static const _effectFrameInterval = 1 / 30;
}
