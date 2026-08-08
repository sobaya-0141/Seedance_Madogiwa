import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_voxel_mobile/game/game_effects_controller.dart';

void main() {
  test('impact, unlock, and clear pulses decay deterministically', () {
    final effects = GameEffectsController();

    effects
      ..advance(0.2, movementAmount: 1, projectedPlayer: const Offset(0.4, 0.6))
      ..triggerImpact(destroyed: true)
      ..unlockExit()
      ..triggerPickup()
      ..changeFloor()
      ..clear();

    expect(effects.movement, greaterThan(0));
    expect(effects.playerAnchor, const Offset(0.4, 0.6));
    expect(effects.impacts, hasLength(2));
    expect(effects.flash, 1);
    expect(effects.exitPulse, 1);
    expect(effects.floorPulse, 1);
    expect(effects.clearPulse, 1);

    effects.advance(
      0.8,
      movementAmount: 0,
      projectedPlayer: const Offset(0.5, 0.5),
    );

    expect(effects.impacts, isEmpty);
    expect(effects.flash, 0);
    expect(effects.exitPulse, lessThan(1));
    expect(effects.floorPulse, lessThan(1));
    expect(effects.clearPulse, lessThan(1));
    effects.dispose();
  });
}
