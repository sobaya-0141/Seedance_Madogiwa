import 'dart:ui';

import 'package:madogiwa_voxel_mobile/game/arena_rules.dart';

enum GameFloorId { officeAtrium, windowLounge }

enum FloorObjectiveType { smash, collect }

enum FloorPropKind { desk, shelf }

class FloorPoint {
  const FloorPoint(this.x, this.z);

  final double x;
  final double z;
}

class FloorTargetSpec extends FloorPoint {
  const FloorTargetSpec(super.x, super.z, this.color);

  final Color color;
}

class FloorPropSpec {
  const FloorPropSpec({required this.kind, required this.obstacle});

  final FloorPropKind kind;
  final ArenaObstacle obstacle;
}

class GameFloorDefinition {
  const GameFloorDefinition({
    required this.id,
    required this.index,
    required this.code,
    required this.title,
    required this.objectiveType,
    required this.objectiveLabel,
    required this.actionLabel,
    required this.playMessage,
    required this.unlockedMessage,
    required this.bounds,
    required this.mapHalfSize,
    required this.start,
    required this.exit,
    required this.accent,
    required this.secondaryAccent,
    required this.props,
    required this.targets,
  });

  final GameFloorId id;
  final int index;
  final String code;
  final String title;
  final FloorObjectiveType objectiveType;
  final String objectiveLabel;
  final String actionLabel;
  final String playMessage;
  final String unlockedMessage;
  final ArenaBounds bounds;
  final double mapHalfSize;
  final FloorPoint start;
  final FloorPoint exit;
  final Color accent;
  final Color secondaryAccent;
  final List<FloorPropSpec> props;
  final List<FloorTargetSpec> targets;

  Iterable<ArenaObstacle> get obstacles => props.map((prop) => prop.obstacle);
}

const officeAtriumFloor = GameFloorDefinition(
  id: GameFloorId.officeAtrium,
  index: 1,
  code: '1F',
  title: 'OFFICE ATRIUM',
  objectiveType: FloorObjectiveType.smash,
  objectiveLabel: 'CLEAR THE ROUTE',
  actionLabel: 'SMASH',
  playMessage: '荷物を片付けてエレベーターを開こう',
  unlockedMessage: 'エレベーターの光へ向かおう',
  bounds: ArenaBounds(minX: -13, maxX: 13, minZ: -13, maxZ: 13),
  mapHalfSize: 14,
  start: FloorPoint(0, 11.2),
  exit: FloorPoint(0, -12.65),
  accent: Color(0xFF35C3B4),
  secondaryAccent: Color(0xFF45C8F4),
  props: [
    FloorPropSpec(
      kind: FloorPropKind.desk,
      obstacle: ArenaObstacle(x: -5.2, z: 3.2, width: 4.4, depth: 2),
    ),
    FloorPropSpec(
      kind: FloorPropKind.desk,
      obstacle: ArenaObstacle(x: 5.2, z: -1.0, width: 4.4, depth: 2),
    ),
    FloorPropSpec(
      kind: FloorPropKind.desk,
      obstacle: ArenaObstacle(x: -5.2, z: -6.2, width: 4.4, depth: 2),
    ),
  ],
  targets: [
    FloorTargetSpec(-2.8, 7.6, Color(0xFFE98568)),
    FloorTargetSpec(2.4, 2.6, Color(0xFFF2A765)),
    FloorTargetSpec(1.4, -6.8, Color(0xFFD97C8B)),
  ],
);

const windowLoungeFloor = GameFloorDefinition(
  id: GameFloorId.windowLounge,
  index: 2,
  code: '2F',
  title: 'WINDOW-SIDE LOUNGE',
  objectiveType: FloorObjectiveType.collect,
  objectiveLabel: 'COLLECT DIY PARTS',
  actionLabel: 'DASH',
  playMessage: 'DIYパーツを集めて立ち飲み処を開こう',
  unlockedMessage: '窓際ゲートへ向かおう',
  bounds: ArenaBounds(minX: -13, maxX: 13, minZ: -13, maxZ: 13),
  mapHalfSize: 14,
  start: FloorPoint(0, 11.2),
  exit: FloorPoint(0, -12.65),
  accent: Color(0xFF7B6FE8),
  secondaryAccent: Color(0xFFFF8065),
  props: [
    FloorPropSpec(
      kind: FloorPropKind.shelf,
      obstacle: ArenaObstacle(x: -6.2, z: 3.8, width: 2.2, depth: 5.4),
    ),
    FloorPropSpec(
      kind: FloorPropKind.shelf,
      obstacle: ArenaObstacle(x: 6.2, z: -1.2, width: 2.2, depth: 5.4),
    ),
    FloorPropSpec(
      kind: FloorPropKind.desk,
      obstacle: ArenaObstacle(x: -5.0, z: -7.2, width: 4.4, depth: 2),
    ),
  ],
  targets: [
    FloorTargetSpec(-8.4, 8.0, Color(0xFFB8A5FF)),
    FloorTargetSpec(8.2, 4.0, Color(0xFF55D9FF)),
    FloorTargetSpec(-8.0, -8.5, Color(0xFFFF8065)),
  ],
);

GameFloorDefinition floorDefinitionFor(GameFloorId id) => switch (id) {
  GameFloorId.officeAtrium => officeAtriumFloor,
  GameFloorId.windowLounge => windowLoungeFloor,
};
