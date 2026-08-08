import 'package:flame_3d/core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_voxel_mobile/game/arena_rules.dart';

void main() {
  const bounds = ArenaBounds(minX: -5, maxX: 5, minZ: -5, maxZ: 5);

  test('movement is clamped inside the arena', () {
    final result = resolveArenaMovement(
      current: Vector2(4, 0),
      delta: Vector2(4, 0),
      radius: 0.5,
      bounds: bounds,
      obstacles: const [],
    );

    expect(result.x, 4.5);
    expect(result.y, 0);
  });

  test('movement slides along an obstacle one axis at a time', () {
    const obstacle = ArenaObstacle(x: 1, z: 0, width: 1, depth: 1);
    final result = resolveArenaMovement(
      current: Vector2(0, 0),
      delta: Vector2(0.7, 0.7),
      radius: 0.4,
      bounds: bounds,
      obstacles: const [obstacle],
    );

    expect(result.x, 0);
    expect(result.y, closeTo(0.7, 0.0001));
  });
}
