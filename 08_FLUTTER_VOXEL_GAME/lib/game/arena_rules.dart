import 'package:flame_3d/core.dart';

class ArenaBounds {
  const ArenaBounds({
    required this.minX,
    required this.maxX,
    required this.minZ,
    required this.maxZ,
  });

  final double minX;
  final double maxX;
  final double minZ;
  final double maxZ;
}

class ArenaObstacle {
  const ArenaObstacle({
    required this.x,
    required this.z,
    required this.width,
    required this.depth,
  });

  final double x;
  final double z;
  final double width;
  final double depth;

  bool overlapsCircle(Vector2 point, double radius) {
    final closestX = point.x.clamp(x - width / 2, x + width / 2);
    final closestZ = point.y.clamp(z - depth / 2, z + depth / 2);
    final dx = point.x - closestX;
    final dz = point.y - closestZ;
    return dx * dx + dz * dz < radius * radius;
  }
}

Vector2 resolveArenaMovement({
  required Vector2 current,
  required Vector2 delta,
  required double radius,
  required ArenaBounds bounds,
  required Iterable<ArenaObstacle> obstacles,
}) {
  final result = current.clone();
  final nextX = (result.x + delta.x).clamp(
    bounds.minX + radius,
    bounds.maxX - radius,
  );
  final xCandidate = Vector2(nextX, result.y);
  if (!obstacles.any(
    (obstacle) => obstacle.overlapsCircle(xCandidate, radius),
  )) {
    result.x = nextX;
  }

  final nextZ = (result.y + delta.y).clamp(
    bounds.minZ + radius,
    bounds.maxZ - radius,
  );
  final zCandidate = Vector2(result.x, nextZ);
  if (!obstacles.any(
    (obstacle) => obstacle.overlapsCircle(zCandidate, radius),
  )) {
    result.y = nextZ;
  }
  return result;
}
