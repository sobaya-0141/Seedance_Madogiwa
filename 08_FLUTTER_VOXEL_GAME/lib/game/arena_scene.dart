import 'dart:math' as math;
import 'dart:ui';

import 'package:flame_3d/components.dart';
import 'package:flame_3d/core.dart';
import 'package:flame_3d/resources.dart';
import 'package:madogiwa_voxel_mobile/game/arena_rules.dart';
import 'package:madogiwa_voxel_mobile/game/floor_definition.dart';

const _mint = Color(0xFF2BD7AE);
const _cyan = Color(0xFF45C8F4);
const _amber = Color(0xFFFFA766);
const _pearl = Color(0xFFEDF9F7);

class ArenaScene extends Component3D {
  ArenaScene({required this.definition})
    : exitPortal = ExitPortal(
        position: Vector3(definition.exit.x, 0, definition.exit.z),
        lockedColor: definition.secondaryAccent,
        unlockedColor: definition.accent,
      ) {
    final floorSize = definition.mapHalfSize * 2;
    addAll([
      _cuboid(
        position: Vector3(0, -0.12, 0),
        size: Vector3(floorSize, 0.2, floorSize),
        color: _pearl,
        unlit: true,
        metallic: 0.12,
        roughness: 0.68,
      ),
      ..._buildFloorGrid(),
      ..._buildWalls(),
      ..._buildRouteMarkers(),
      for (final prop in definition.props)
        switch (prop.kind) {
          FloorPropKind.desk => _OfficeDesk(
            x: prop.obstacle.x,
            z: prop.obstacle.z,
            screenColor: prop.obstacle.x.isNegative
                ? definition.secondaryAccent
                : definition.accent,
          ),
          FloorPropKind.shelf => _ArchiveShelf(
            obstacle: prop.obstacle,
            accent: definition.accent,
            secondaryAccent: definition.secondaryAccent,
          ),
        },
      exitPortal,
      for (var i = 0; i < 6; i++)
        _FloorRunner(
          index: i,
          halfSize: definition.mapHalfSize,
          color: definition.accent,
        ),
    ]);
  }

  final GameFloorDefinition definition;
  final ExitPortal exitPortal;

  void setExitUnlocked(bool unlocked) => exitPortal.unlocked = unlocked;

  Iterable<Component3D> _buildFloorGrid() sync* {
    final halfSize = definition.mapHalfSize;
    final lineLength = halfSize * 2 - 2;
    final minorLines = <_BoxSpec>[];
    for (
      var coordinate = -halfSize.toInt() + 2;
      coordinate <= halfSize.toInt() - 2;
      coordinate += 2
    ) {
      if (coordinate == 0) {
        continue;
      }
      minorLines.addAll([
        _BoxSpec(
          position: Vector3(coordinate.toDouble(), 0.012, 0),
          size: Vector3(0.022, 0.018, lineLength),
        ),
        _BoxSpec(
          position: Vector3(0, 0.013, coordinate.toDouble()),
          size: Vector3(lineLength, 0.018, 0.022),
        ),
      ]);
    }
    yield _batchedCuboids(
      minorLines,
      material: UnlitMaterial(
        albedoColor: Color.lerp(
          definition.accent,
          const Color(0xFFFFFFFF),
          0.58,
        )!,
      ),
    );
    yield _batchedCuboids([
      _BoxSpec(
        position: Vector3(0, 0.014, 0),
        size: Vector3(0.045, 0.02, lineLength),
      ),
      _BoxSpec(
        position: Vector3(0, 0.015, 0),
        size: Vector3(lineLength, 0.02, 0.045),
      ),
    ], material: UnlitMaterial(albedoColor: definition.accent));
  }

  Iterable<Component3D> _buildWalls() sync* {
    final halfSize = definition.mapHalfSize;
    final wallSize = halfSize * 2 + 0.5;
    final wallCoordinate = halfSize;
    final rimCoordinate = halfSize - 0.32;
    final rimLength = halfSize * 2 - 0.8;
    yield _batchedCuboids([
      _BoxSpec(
        position: Vector3(0, 1.3, -wallCoordinate),
        size: Vector3(wallSize, 2.6, 0.5),
      ),
      _BoxSpec(
        position: Vector3(0, 1.3, wallCoordinate),
        size: Vector3(wallSize, 2.6, 0.5),
      ),
      _BoxSpec(
        position: Vector3(-wallCoordinate, 1.3, 0),
        size: Vector3(0.5, 2.6, wallSize),
      ),
      _BoxSpec(
        position: Vector3(wallCoordinate, 1.3, 0),
        size: Vector3(0.5, 2.6, wallSize),
      ),
    ], material: UnlitMaterial(albedoColor: const Color(0xFFD3E6E8)));
    yield _batchedCuboids([
      _BoxSpec(
        position: Vector3(0, 2.08, -rimCoordinate),
        size: Vector3(rimLength, 0.055, 0.06),
      ),
      _BoxSpec(
        position: Vector3(0, 2.08, rimCoordinate),
        size: Vector3(rimLength, 0.055, 0.06),
      ),
      _BoxSpec(
        position: Vector3(-rimCoordinate, 2.08, 0),
        size: Vector3(0.06, 0.055, rimLength),
      ),
      _BoxSpec(
        position: Vector3(rimCoordinate, 2.08, 0),
        size: Vector3(0.06, 0.055, rimLength),
      ),
    ], material: UnlitMaterial(albedoColor: definition.secondaryAccent));
  }

  Iterable<Component3D> _buildRouteMarkers() sync* {
    final markers = <_BoxSpec>[];
    for (var i = 0; i < 11; i++) {
      final z = definition.mapHalfSize - 3 - i * 2.15;
      for (final side in [-1.0, 1.0]) {
        markers.add(
          _BoxSpec(
            position: Vector3(side * 0.43, 0.035, z),
            size: Vector3(0.72, 0.025, 0.09),
            yaw: side * 0.72,
          ),
        );
      }
    }
    yield _batchedCuboids(
      markers,
      material: UnlitMaterial(
        albedoColor: Color.lerp(
          definition.accent,
          const Color(0xFFFFFFFF),
          0.22,
        )!,
      ),
    );
  }
}

class _OfficeDesk extends Component3D {
  _OfficeDesk({
    required double x,
    required double z,
    required Color screenColor,
  }) : super(position: Vector3(x, 0, z)) {
    addAll([
      _cuboid(
        position: Vector3(0, 0.72, 0),
        size: Vector3(4.4, 0.22, 2.0),
        color: const Color(0xFFF3FAF8),
        unlit: true,
        metallic: 0.28,
        roughness: 0.34,
      ),
      _batchedCuboids([
        for (final dx in [-1.82, 1.82])
          for (final dz in [-0.7, 0.7])
            _BoxSpec(
              position: Vector3(dx, 0.32, dz),
              size: Vector3(0.14, 0.72, 0.14),
            ),
        _BoxSpec(
          position: Vector3(0, 1.32, -0.2),
          size: Vector3(1.55, 0.86, 0.12),
        ),
        _BoxSpec(
          position: Vector3(0, 0.91, -0.2),
          size: Vector3(0.12, 0.32, 0.12),
        ),
        _BoxSpec(
          position: Vector3(0, 0.78, -0.2),
          size: Vector3(0.7, 0.06, 0.46),
        ),
      ], material: UnlitMaterial(albedoColor: const Color(0xFF78939C))),
      _cuboid(
        position: Vector3(0, 1.32, -0.265),
        size: Vector3(1.3, 0.62, 0.018),
        color: screenColor,
        unlit: true,
      ),
    ]);
  }
}

class _ArchiveShelf extends Component3D {
  _ArchiveShelf({
    required ArenaObstacle obstacle,
    required Color accent,
    required Color secondaryAccent,
  }) : super(position: Vector3(obstacle.x, 0, obstacle.z)) {
    addAll([
      _cuboid(
        position: Vector3(0, 1.0, 0),
        size: Vector3(obstacle.width, 2.0, obstacle.depth),
        color: const Color(0xFFE7E6F7),
        unlit: true,
      ),
      for (final y in [0.3, 0.9, 1.5])
        _cuboid(
          position: Vector3(0, y, 0),
          size: Vector3(obstacle.width + 0.08, 0.08, obstacle.depth + 0.08),
          color: y == 0.9 ? accent : secondaryAccent,
          unlit: true,
        ),
      for (var i = 0; i < 5; i++)
        _cuboid(
          position: Vector3(
            i.isEven ? -0.28 : 0.28,
            1.2,
            -obstacle.depth / 2 + 0.65 + i * (obstacle.depth - 1.3) / 4,
          ),
          size: Vector3(0.32, 0.42, 0.52),
          color: i.isEven ? secondaryAccent : accent,
          unlit: true,
        ),
    ]);
  }
}

class _FloorRunner extends MeshComponent {
  _FloorRunner({
    required this.index,
    required this.halfSize,
    required Color color,
  }) : super(
         position: Vector3(0, 0.048, halfSize - 2 - index * 4.25),
         mesh: CuboidMesh(
           size: Vector3(1.5, 0.028, 0.045),
           material: UnlitMaterial(albedoColor: color),
         ),
       );

  final int index;
  final double halfSize;

  @override
  void update(double dt) {
    z -= dt * 4.2;
    if (z < -halfSize + 1.5) {
      z += halfSize * 2 - 3;
    }
    final pulse = 0.62 + math.sin(z * 0.8 + index) * 0.28;
    scale.setValues(pulse, 1, 1);
    super.update(dt);
  }
}

class ExitPortal extends Component3D {
  ExitPortal({
    required super.position,
    required this.lockedColor,
    required this.unlockedColor,
  }) {
    _frameMaterial = UnlitMaterial(albedoColor: lockedColor);
    _frame = _batchedCuboids([
      for (final x in [-1.9, 1.9])
        _BoxSpec(position: Vector3(x, 1.5, 0), size: Vector3(0.28, 3.0, 0.28)),
      _BoxSpec(position: Vector3(0, 3.0, 0), size: Vector3(4.08, 0.28, 0.28)),
    ], material: _frameMaterial);
    _scanner = _cuboid(
      position: Vector3(0, 0.32, 0),
      size: Vector3(3.25, 0.055, 0.06),
      color: lockedColor,
      unlit: true,
    );
    addAll([
      _cuboid(
        position: Vector3(0, 0.025, 0.55),
        size: Vector3(4.8, 0.05, 2.2),
        color: const Color(0xFFB9E7DF),
        unlit: true,
      ),
      _batchedCuboids([
        for (final x in [-1.9, 1.9])
          _BoxSpec(
            position: Vector3(x, 1.5, 0.18),
            size: Vector3(0.1, 2.62, 0.52),
          ),
      ], material: UnlitMaterial(albedoColor: const Color(0xFFAFC7CC))),
      _frame,
      _scanner,
      for (var i = 0; i < 6; i++)
        _PortalShard(
          index: i,
          primaryColor: unlockedColor,
          secondaryColor: lockedColor,
        ),
      LightComponent.point(
        position: Vector3(0, 1.55, 1.0),
        color: unlockedColor,
        intensity: 22,
      ),
    ]);
  }

  late final MeshComponent _scanner;
  late final MeshComponent _frame;
  late final UnlitMaterial _frameMaterial;
  final Color lockedColor;
  final Color unlockedColor;
  bool unlocked = false;
  double _time = 0;

  @override
  void update(double dt) {
    _time += dt;
    final targetColor = unlocked ? unlockedColor : lockedColor;
    final glow = 0.7 + math.sin(_time * (unlocked ? 6.2 : 2.4)) * 0.3;
    final color = Color.lerp(const Color(0xFFFFE0BA), targetColor, glow)!;
    _frameMaterial.albedoColor = color;
    final scanProgress = (_time * (unlocked ? 1.25 : 0.42)) % 1;
    _scanner
      ..y = 0.3 + scanProgress * 2.35
      ..scale.setValues(unlocked ? 1 : 0.56, 1, 1);
    (_scanner.mesh.surfaces.first.material as UnlitMaterial).albedoColor =
        color;
    super.update(dt);
  }
}

class _PortalShard extends MeshComponent {
  _PortalShard({
    required this.index,
    required Color primaryColor,
    required Color secondaryColor,
  }) : super(
         mesh: CuboidMesh(
           size: Vector3(0.11, 0.34, 0.11),
           material: UnlitMaterial(
             albedoColor: index.isEven ? primaryColor : secondaryColor,
           ),
         ),
       );

  final int index;
  double _time = 0;

  @override
  void update(double dt) {
    _time += dt;
    final phase = index / 6 * math.pi * 2 + _time * 0.72;
    position.setValues(
      math.cos(phase) * 2.25,
      1.55 + math.sin(phase * 1.7) * 1.15,
      math.sin(phase) * 0.46,
    );
    rotation.setEuler(phase * 1.4, phase * 0.8, phase);
    super.update(dt);
  }
}

class BreakableCrate extends Component3D {
  BreakableCrate({required double x, required double z, required this.color})
    : obstacle = ArenaObstacle(x: x, z: z, width: 1.5, depth: 1.5),
      super(position: Vector3(x, 0, z)) {
    _core = _cuboid(
      position: Vector3(0, 0.7, 0),
      size: Vector3(1.5, 1.4, 1.5),
      color: color,
      unlit: true,
      metallic: 0.34,
      roughness: 0.55,
    );
    addAll([
      _core,
      _batchedCuboids([
        for (final x in [-0.67, 0.67])
          for (final z in [-0.67, 0.67])
            _BoxSpec(
              position: Vector3(x, 0.73, z),
              size: Vector3(0.075, 1.28, 0.075),
            ),
        _BoxSpec(
          position: Vector3(0, 1.415, 0),
          size: Vector3(1.16, 0.035, 1.16),
        ),
      ], material: UnlitMaterial(albedoColor: _amber)),
    ]);
  }

  final ArenaObstacle obstacle;
  final Color color;
  late final MeshComponent _core;
  bool isBroken = false;
  double _time = 0;

  void smash() {
    if (isBroken) {
      return;
    }
    isBroken = true;
    world.add(CrateBurst(position: position.clone(), color: color));
    removeFromParent();
  }

  @override
  void update(double dt) {
    _time += dt;
    final hover = math.sin(_time * 2.3 + x) * 0.035;
    _core.y = 0.7 + hover;
    final breathe = 1 + math.sin(_time * 3.1 + z) * 0.018;
    scale.setValues(breathe, breathe, breathe);
    super.update(dt);
  }
}

class FloorCollectible extends Component3D {
  FloorCollectible({required double x, required double z, required this.color})
    : super(position: Vector3(x, 0, z)) {
    _core = _cuboid(
      position: Vector3(0, 0.92, 0),
      size: Vector3(0.7, 0.7, 0.7),
      color: color,
      unlit: true,
    );
    addAll([
      _core,
      _cuboid(
        position: Vector3(0, 0.92, 0),
        size: Vector3(1.2, 0.08, 1.2),
        color: Color.lerp(color, const Color(0xFFFFFFFF), 0.38)!,
        unlit: true,
      ),
      for (var i = 0; i < 4; i++) _CollectibleSatellite(index: i, color: color),
      LightComponent.point(
        position: Vector3(0, 1.1, 0),
        color: color,
        intensity: 8,
      ),
    ]);
  }

  final Color color;
  late final MeshComponent _core;
  bool isCollected = false;
  double _time = 0;

  void collect() {
    if (isCollected) {
      return;
    }
    isCollected = true;
    world.add(PickupBurst(position: position.clone(), color: color));
    removeFromParent();
  }

  @override
  void update(double dt) {
    _time += dt;
    y = 0.05 + math.sin(_time * 2.7 + x) * 0.1;
    rotation.setEuler(0, _time * 0.9, 0);
    final breathe = 1 + math.sin(_time * 4.1) * 0.06;
    _core.scale.setValues(breathe, breathe, breathe);
    super.update(dt);
  }
}

class _CollectibleSatellite extends MeshComponent {
  _CollectibleSatellite({required this.index, required Color color})
    : super(
        mesh: CuboidMesh(
          size: Vector3.all(0.16),
          material: UnlitMaterial(
            albedoColor: Color.lerp(color, const Color(0xFFFFFFFF), 0.5)!,
          ),
        ),
      );

  final int index;
  double _time = 0;

  @override
  void update(double dt) {
    _time += dt;
    final angle = index / 4 * math.pi * 2 + _time * 1.35;
    position.setValues(
      math.cos(angle) * 0.82,
      0.92 + math.sin(angle * 1.7) * 0.22,
      math.sin(angle) * 0.82,
    );
    rotation.setEuler(angle, angle * 0.7, angle * 1.2);
    super.update(dt);
  }
}

class PickupBurst extends Component3D {
  PickupBurst({required super.position, required Color color}) {
    final random = math.Random((position.x * 71 + position.z * 31).round());
    addAll([
      _ImpactWave3D(color: color),
      for (var i = 0; i < 10; i++)
        _BurstFragment(
          index: i,
          color: i.isEven
              ? color
              : Color.lerp(color, const Color(0xFFFFFFFF), 0.5)!,
          velocity: Vector3(
            (random.nextDouble() - 0.5) * 4.8,
            2.2 + random.nextDouble() * 3.2,
            (random.nextDouble() - 0.5) * 4.8,
          ),
          spin: Vector3(
            random.nextDouble() * 7,
            random.nextDouble() * 7,
            random.nextDouble() * 7,
          ),
          size: 0.08 + random.nextDouble() * 0.18,
        ),
    ]);
  }

  double _time = 0;

  @override
  void update(double dt) {
    _time += dt;
    if (_time > 1.1) {
      removeFromParent();
    }
    super.update(dt);
  }
}

class CrateBurst extends Component3D {
  CrateBurst({required super.position, required Color color}) {
    final random = math.Random((position.x * 100 + position.z * 17).round());
    addAll([
      _ImpactWave3D(),
      for (var i = 0; i < 14; i++)
        _BurstFragment(
          index: i,
          color: i % 3 == 0 ? _amber : color,
          velocity: Vector3(
            (random.nextDouble() - 0.5) * 6.8,
            2.8 + random.nextDouble() * 4.2,
            (random.nextDouble() - 0.5) * 6.8,
          ),
          spin: Vector3(
            random.nextDouble() * 8,
            random.nextDouble() * 8,
            random.nextDouble() * 8,
          ),
          size: 0.1 + random.nextDouble() * 0.26,
        ),
    ]);
  }

  double _time = 0;

  @override
  void update(double dt) {
    _time += dt;
    if (_time > 1.25) {
      removeFromParent();
    }
    super.update(dt);
  }
}

class _BurstFragment extends MeshComponent {
  _BurstFragment({
    required this.index,
    required Color color,
    required this.velocity,
    required this.spin,
    required double size,
  }) : super(
         position: Vector3(0, 0.76, 0),
         mesh: CuboidMesh(
           size: Vector3(size, size * 0.74, size * 1.22),
           material: index % 3 == 0
               ? UnlitMaterial(albedoColor: color)
               : SpatialMaterial(
                   albedoColor: color,
                   metallic: 0.42,
                   roughness: 0.38,
                 ),
         ),
       );

  final int index;
  final Vector3 velocity;
  final Vector3 spin;
  double _time = 0;

  @override
  void update(double dt) {
    _time += dt;
    velocity.y -= 10.5 * dt;
    position.addScaled(velocity, dt);
    rotation.setEuler(spin.x * _time, spin.y * _time, spin.z * _time);
    final shrink = (1 - math.max(0, _time - 0.62) / 0.62).clamp(0.0, 1.0);
    scale.setValues(shrink, shrink, shrink);
    super.update(dt);
  }
}

class _ImpactWave3D extends Component3D {
  _ImpactWave3D({Color color = _amber}) : super(position: Vector3(0, 0.08, 0)) {
    final segments = <_BoxSpec>[];
    for (var i = 0; i < 16; i++) {
      final angle = i / 16 * math.pi * 2;
      segments.add(
        _BoxSpec(
          position: Vector3(math.cos(angle), 0, math.sin(angle)),
          size: Vector3(0.42, 0.055, 0.1),
          yaw: -angle,
        ),
      );
    }
    add(_batchedCuboids(segments, material: UnlitMaterial(albedoColor: color)));
  }

  double _time = 0;

  @override
  void update(double dt) {
    _time += dt;
    final expand = 0.5 + _time * 4.5;
    final flatten = (1 - _time / 0.52).clamp(0.0, 1.0);
    scale.setValues(expand, flatten, expand);
    if (_time > 0.52) {
      removeFromParent();
    }
    super.update(dt);
  }
}

class PlayerEnergyTrail extends MeshComponent {
  PlayerEnergyTrail({required super.position, required this.index})
    : super(
        mesh: CuboidMesh(
          size: Vector3(0.12, 0.12, 0.12),
          material: UnlitMaterial(albedoColor: index.isEven ? _mint : _cyan),
        ),
      );

  final int index;
  double _life = 0;

  @override
  void update(double dt) {
    _life += dt;
    y += dt * (0.32 + index * 0.03);
    final value = (1 - _life / 0.5).clamp(0.0, 1.0);
    scale.setValues(value, value, value);
    rotation.setEuler(_life * 4, _life * 5, _life * 3);
    if (_life >= 0.5) {
      removeFromParent();
    }
    super.update(dt);
  }
}

MeshComponent _cuboid({
  required Vector3 position,
  required Vector3 size,
  required Color color,
  bool unlit = false,
  double metallic = 0.6,
  double roughness = 0.35,
}) {
  return MeshComponent(
    position: position,
    mesh: CuboidMesh(
      size: size,
      material: unlit
          ? UnlitMaterial(albedoColor: color)
          : SpatialMaterial(
              albedoColor: color,
              metallic: metallic,
              roughness: roughness,
            ),
    ),
  );
}

class _BoxSpec {
  const _BoxSpec({required this.position, required this.size, this.yaw = 0});

  final Vector3 position;
  final Vector3 size;
  final double yaw;
}

MeshComponent _batchedCuboids(
  List<_BoxSpec> boxes, {
  required Material material,
}) {
  final vertices = <Vertex>[];
  final indices = <int>[];
  const localIndices = [
    0,
    2,
    1,
    0,
    3,
    2,
    4,
    5,
    6,
    4,
    6,
    7,
    0,
    4,
    7,
    0,
    7,
    3,
    1,
    2,
    6,
    1,
    6,
    5,
    0,
    1,
    5,
    0,
    5,
    4,
    3,
    7,
    6,
    3,
    6,
    2,
  ];
  for (final box in boxes) {
    final base = vertices.length;
    final half = box.size / 2;
    final cosine = math.cos(box.yaw);
    final sine = math.sin(box.yaw);
    for (final signs in const [
      (-1.0, -1.0, -1.0),
      (1.0, -1.0, -1.0),
      (1.0, 1.0, -1.0),
      (-1.0, 1.0, -1.0),
      (-1.0, -1.0, 1.0),
      (1.0, -1.0, 1.0),
      (1.0, 1.0, 1.0),
      (-1.0, 1.0, 1.0),
    ]) {
      final x = half.x * signs.$1;
      final y = half.y * signs.$2;
      final z = half.z * signs.$3;
      vertices.add(
        Vertex(
          position: Vector3(
            box.position.x + x * cosine - z * sine,
            box.position.y + y,
            box.position.z + x * sine + z * cosine,
          ),
          texCoord: Vector2.zero(),
        ),
      );
    }
    indices.addAll(localIndices.map((index) => base + index));
  }
  final mesh = Mesh()
    ..addSurface(
      Surface(vertices: vertices, indices: indices, material: material),
    );
  return MeshComponent(mesh: mesh);
}
