import 'package:flame_3d/core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_voxel_mobile/game/floor_definition.dart';

void main() {
  test('campaign exposes two ordered floors with different objectives', () {
    expect(officeAtriumFloor.index, 1);
    expect(windowLoungeFloor.index, 2);
    expect(officeAtriumFloor.objectiveType, FloorObjectiveType.smash);
    expect(windowLoungeFloor.objectiveType, FloorObjectiveType.collect);
    expect(
      floorDefinitionFor(GameFloorId.windowLounge),
      same(windowLoungeFloor),
    );
  });

  test('floor targets remain reachable and outside static props', () {
    for (final floor in [officeAtriumFloor, windowLoungeFloor]) {
      expect(floor.targets, isNotEmpty);
      for (final target in floor.targets) {
        final point = Vector2(target.x, target.z);
        expect(
          target.x,
          inInclusiveRange(floor.bounds.minX, floor.bounds.maxX),
        );
        expect(
          target.z,
          inInclusiveRange(floor.bounds.minZ, floor.bounds.maxZ),
        );
        expect(
          floor.obstacles.any(
            (obstacle) => obstacle.overlapsCircle(point, 0.72),
          ),
          isFalse,
          reason: '${floor.code} target at ${target.x}, ${target.z} is blocked',
        );
      }
    }
  });
}
