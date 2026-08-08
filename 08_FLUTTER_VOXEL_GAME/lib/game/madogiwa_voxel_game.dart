import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flame_3d/camera.dart';
import 'package:flame_3d/components.dart';
import 'package:flame_3d/game.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:madogiwa_voxel_mobile/game/arena_rules.dart';
import 'package:madogiwa_voxel_mobile/game/arena_scene.dart';
import 'package:madogiwa_voxel_mobile/game/floor_definition.dart';
import 'package:madogiwa_voxel_mobile/game/game_effects_controller.dart';
import 'package:madogiwa_voxel_mobile/game/game_hud_state.dart';
import 'package:madogiwa_voxel_mobile/game/voxel_character.dart';

class MadogiwaVoxelGame extends FlameGame3D<World3D, MobileGameCamera> {
  MadogiwaVoxelGame() : super(world: World3D(), camera: MobileGameCamera());

  static const hudOverlay = 'hud';
  static const _playerRadius = 0.72;
  static const _playerSpeed = 4.7;
  static const _smashRange = 2.35;
  static const _pickupRange = 1.15;
  static const _totalFloors = 2;

  final ValueNotifier<GameHudState> hudState = ValueNotifier(
    const GameHudState.initial(),
  );
  final GameEffectsController effects = GameEffectsController();
  final Vector2 _moveInput = Vector2.zero();
  final List<BreakableCrate> _crates = [];
  final List<FloorCollectible> _collectibles = [];

  late ArenaScene arena;
  late final VoxelCharacter player;
  GameFloorDefinition _floor = officeAtriumFloor;
  bool playerReady = false;
  int _objectiveProgress = 0;
  int _stylePoints = 0;
  int _flow = 0;
  int _trailIndex = 0;
  GamePhase _phase = GamePhase.playing;
  double _temporaryMessageRemaining = 0;
  double _elapsedSeconds = 0;
  double _hudRefreshRemaining = 0;
  double _flowRemaining = 0;
  double _trailRemaining = 0;
  double _idleSeconds = 0;
  double _autoActionRemaining = 0;
  double _clearHoldSeconds = 0;
  double _floorTransitionRemaining = 0;
  double _dashRemaining = 0;
  double _dashCooldownRemaining = 0;
  bool _attractMode = false;

  @override
  Color backgroundColor() => const Color(0xFFCEEFF4);

  @override
  Future<void> onLoad() async {
    _mountFloor(_floor);
    await world.addAll([
      LightComponent.ambient(color: const Color(0xFFF7FFFD), intensity: 1.08),
      LightComponent.point(
        position: Vector3(-7, 9, 7),
        color: const Color(0xFFFFF5DE),
        intensity: 40,
      ),
      LightComponent.point(
        position: Vector3(7, 6, -8),
        color: const Color(0xFF8FEBD9),
        intensity: 28,
      ),
      LightComponent.point(
        position: Vector3(0, 5, 8),
        color: const Color(0xFFFFFFFF),
        intensity: 34,
      ),
    ]);

    player = await VoxelCharacter.load(
      assetPath: 'models/sobaya.glb',
      position: _startPosition,
      scale: 1.28,
    );
    await world.add(player);
    playerReady = true;
    _publishState();
  }

  void setMoveInput(Vector2 value) {
    if (_phase != GamePhase.playing) {
      _moveInput.setZero();
      return;
    }
    if (value.length2 > 0.01) {
      if (_attractMode) {
        _leaveAttractMode();
        return;
      }
      _idleSeconds = 0;
    }
    _moveInput.setFrom(value);
    if (_moveInput.length2 > 1) {
      _moveInput.normalize();
    }
  }

  void primaryAction() {
    if (!playerReady || _phase != GamePhase.playing) {
      return;
    }
    if (_attractMode) {
      _leaveAttractMode();
      return;
    }
    _idleSeconds = 0;
    switch (_floor.objectiveType) {
      case FloorObjectiveType.smash:
        _performSmash();
      case FloorObjectiveType.collect:
        _performDash();
    }
  }

  void _performSmash({bool automatic = false}) {
    player.triggerSmash();
    camera.triggerImpact(0.32);

    BreakableCrate? nearest;
    var nearestDistance = double.infinity;
    for (final crate in _crates.where((crate) => !crate.isBroken)) {
      final dx = player.position.x - crate.position.x;
      final dz = player.position.z - crate.position.z;
      final distance = math.sqrt(dx * dx + dz * dz);
      if (distance < nearestDistance) {
        nearest = crate;
        nearestDistance = distance;
      }
    }

    if (nearest == null || nearestDistance > _smashRange) {
      effects.triggerImpact(destroyed: false);
      if (!automatic) {
        HapticFeedback.selectionClick();
      }
      _showTemporaryMessage('荷物にもう少し近づこう');
      return;
    }

    nearest.smash();
    _objectiveProgress += 1;
    _awardStyle(100);
    effects.triggerImpact(destroyed: true);
    camera.triggerImpact(1);
    if (!automatic) {
      HapticFeedback.heavyImpact();
    }
    _checkObjectiveComplete();
    _publishState();
  }

  void _performDash({bool automatic = false}) {
    if (_dashCooldownRemaining > 0) {
      if (!automatic) {
        _showTemporaryMessage('DASH CHARGING');
      }
      return;
    }
    _dashRemaining = 0.42;
    _dashCooldownRemaining = 1.05;
    effects.triggerImpact(destroyed: false);
    camera.triggerImpact(0.3);
    if (!automatic) {
      HapticFeedback.lightImpact();
    }
  }

  void resetLevel() => _resetLevel();

  void _resetLevel({bool preserveAttractMode = false}) {
    if (!playerReady) {
      return;
    }
    _unmountFloor();
    _floor = officeAtriumFloor;
    _objectiveProgress = 0;
    _stylePoints = 0;
    _flow = 0;
    _flowRemaining = 0;
    _elapsedSeconds = 0;
    _temporaryMessageRemaining = 0;
    _clearHoldSeconds = 0;
    _autoActionRemaining = 0;
    _idleSeconds = 0;
    _floorTransitionRemaining = 0;
    _dashRemaining = 0;
    _dashCooldownRemaining = 0;
    _phase = GamePhase.playing;
    _attractMode = preserveAttractMode;
    _moveInput.setZero();
    _mountFloor(_floor);
    effects.reset();
    camera.resetEffects();
    player
      ..position.setFrom(_startPosition)
      ..face(0)
      ..resetMotion();
    _publishState();
  }

  @override
  void update(double dt) {
    if (playerReady && _phase == GamePhase.playing) {
      _elapsedSeconds += dt;
      _dashRemaining = math.max(0, _dashRemaining - dt);
      _dashCooldownRemaining = math.max(0, _dashCooldownRemaining - dt);
      if (_attractMode) {
        _updateAttractMode(dt);
      } else {
        _idleSeconds += dt;
        if (_idleSeconds >= 10) {
          _enterAttractMode();
        }
        _updatePlayer(dt);
      }
      _updateCollectibles();
      _updateExit();
      _updateHudTimers(dt);
    } else if (playerReady && _phase == GamePhase.transitioning) {
      _floorTransitionRemaining -= dt;
      if (_floorTransitionRemaining <= 0) {
        _completeFloorTransition();
      }
    } else if (playerReady && _phase == GamePhase.cleared && _attractMode) {
      _clearHoldSeconds += dt;
      if (_clearHoldSeconds >= 3.6) {
        _resetLevel(preserveAttractMode: true);
      }
    }
    if (playerReady) {
      effects.advance(
        dt,
        movementAmount: player.moving
            ? (_moveInput.length + (_dashRemaining > 0 ? 0.35 : 0)).clamp(
                0.0,
                1.0,
              )
            : 0,
        projectedPlayer: _projectPlayer(),
      );
    }
    super.update(dt);
  }

  void _updateHudTimers(double dt) {
    if (_flowRemaining > 0) {
      _flowRemaining -= dt;
      if (_flowRemaining <= 0 && _flow != 0) {
        _flow = 0;
        _publishState();
      }
    }
    if (_temporaryMessageRemaining > 0) {
      _temporaryMessageRemaining -= dt;
      if (_temporaryMessageRemaining <= 0) {
        _publishState();
      }
    }
    _hudRefreshRemaining -= dt;
    if (_hudRefreshRemaining <= 0) {
      _hudRefreshRemaining = 0.1;
      _publishState();
    }
  }

  void _updatePlayer(double dt, {double speedFactor = 1}) {
    if (_moveInput.length2 < 0.01) {
      player.moving = false;
      return;
    }

    final direction = _moveInput.normalized();
    final current = Vector2(player.position.x, player.position.z);
    final activeObstacles = [
      ..._floor.obstacles,
      ..._crates
          .where((crate) => !crate.isBroken)
          .map((crate) => crate.obstacle),
    ];
    final dashFactor = _dashRemaining > 0 ? 2.25 : 1.0;
    final next = resolveArenaMovement(
      current: current,
      delta: direction * (_playerSpeed * speedFactor * dashFactor * dt),
      radius: _playerRadius,
      bounds: _floor.bounds,
      obstacles: activeObstacles,
    );
    player
      ..position.setValues(next.x, 0, next.y)
      ..face(math.atan2(direction.x, direction.y))
      ..moving = true;
    _spawnTrail(dt, direction);
  }

  void _updateCollectibles() {
    for (final collectible in _collectibles.where(
      (collectible) => !collectible.isCollected,
    )) {
      final dx = player.position.x - collectible.position.x;
      final dz = player.position.z - collectible.position.z;
      if (dx * dx + dz * dz > _pickupRange * _pickupRange) {
        continue;
      }
      collectible.collect();
      _objectiveProgress += 1;
      _awardStyle(150);
      effects.triggerPickup();
      camera.triggerImpact(0.5);
      if (!_attractMode) {
        HapticFeedback.mediumImpact();
      }
      _checkObjectiveComplete();
      _publishState();
    }
  }

  void _updateAttractMode(double dt) {
    _autoActionRemaining -= dt;
    final targetCrate = _crates.where((crate) => !crate.isBroken).firstOrNull;
    final targetCollectible = _collectibles
        .where((collectible) => !collectible.isCollected)
        .firstOrNull;
    final targetObject = targetCrate ?? targetCollectible;
    final target = targetObject == null
        ? _exit
        : Vector2(targetObject.position.x, targetObject.position.z);
    final current = Vector2(player.position.x, player.position.z);
    final offset = target - current;
    final distance = offset.length;
    if (targetCrate != null && distance <= 1.9 && _autoActionRemaining <= 0) {
      _moveInput.setZero();
      player.moving = false;
      _autoActionRemaining = 0.72;
      _performSmash(automatic: true);
      return;
    }
    if (_floor.objectiveType == FloorObjectiveType.collect &&
        distance > 4 &&
        _dashCooldownRemaining <= 0) {
      _performDash(automatic: true);
    }
    if (distance < 0.08) {
      _moveInput.setZero();
      player.moving = false;
      return;
    }
    _moveInput.setFrom(offset.normalized());
    _updatePlayer(dt, speedFactor: 0.78);
  }

  void _enterAttractMode() {
    _attractMode = true;
    _idleSeconds = 0;
    _publishState();
  }

  void _leaveAttractMode() {
    _attractMode = false;
    _resetLevel();
    _showTemporaryMessage('MANUAL CONTROL • 窓際作戦を開始');
  }

  void _updateExit() {
    if (_objectiveProgress < _floor.targets.length) {
      return;
    }
    final dx = player.position.x - _floor.exit.x;
    final dz = player.position.z - _floor.exit.z;
    if (dx * dx + dz * dz > 1.5 * 1.5) {
      return;
    }
    if (_floor.id == GameFloorId.officeAtrium) {
      _beginFloorTransition();
    } else {
      _clearGame();
    }
  }

  void _beginFloorTransition() {
    _phase = GamePhase.transitioning;
    _floorTransitionRemaining = 1.35;
    _moveInput.setZero();
    player.moving = false;
    effects.changeFloor();
    if (!_attractMode) {
      HapticFeedback.mediumImpact();
    }
    _publishState();
  }

  void _completeFloorTransition() {
    _unmountFloor();
    _floor = windowLoungeFloor;
    _objectiveProgress = 0;
    _flow = 0;
    _flowRemaining = 0;
    _dashRemaining = 0;
    _dashCooldownRemaining = 0;
    _mountFloor(_floor);
    player
      ..position.setFrom(_startPosition)
      ..face(0)
      ..resetMotion();
    camera.resetEffects();
    effects.changeFloor();
    _phase = GamePhase.playing;
    _publishState();
  }

  void _clearGame() {
    _phase = GamePhase.cleared;
    _moveInput.setZero();
    player.moving = false;
    effects.clear();
    camera.celebrate();
    if (!_attractMode) {
      HapticFeedback.heavyImpact();
    }
    _publishState();
  }

  void _checkObjectiveComplete() {
    if (_objectiveProgress != _floor.targets.length) {
      return;
    }
    arena.setExitUnlocked(true);
    effects.unlockExit();
    camera.revealExit();
  }

  void _awardStyle(int basePoints) {
    _flow = _flowRemaining > 0 ? _flow + 1 : 1;
    _flowRemaining = 3.1;
    _stylePoints += basePoints * _flow;
  }

  void _spawnTrail(double dt, Vector2 direction) {
    _trailRemaining -= dt;
    if (_trailRemaining > 0) {
      return;
    }
    _trailRemaining = _dashRemaining > 0 ? 0.035 : 0.075;
    final side = _trailIndex.isEven ? -0.22 : 0.22;
    final perpendicular = Vector2(-direction.y, direction.x);
    world.add(
      PlayerEnergyTrail(
        position: Vector3(
          player.position.x - direction.x * 0.56 + perpendicular.x * side,
          0.16,
          player.position.z - direction.y * 0.56 + perpendicular.y * side,
        ),
        index: _trailIndex++,
      ),
    );
  }

  Offset _projectPlayer() {
    final projected = Vector3(
      player.position.x,
      player.position.y + 1.25,
      player.position.z,
    )..applyProjection(camera.viewProjectionMatrix);
    return Offset(
      ((projected.x + 1) / 2).clamp(0.0, 1.0),
      ((1 - projected.y) / 2).clamp(0.0, 1.0),
    );
  }

  void _mountFloor(GameFloorDefinition definition) {
    arena = ArenaScene(definition: definition);
    world.add(arena);
    switch (definition.objectiveType) {
      case FloorObjectiveType.smash:
        _crates.addAll(
          definition.targets.map(
            (target) =>
                BreakableCrate(x: target.x, z: target.z, color: target.color),
          ),
        );
        world.addAll(_crates);
      case FloorObjectiveType.collect:
        _collectibles.addAll(
          definition.targets.map(
            (target) =>
                FloorCollectible(x: target.x, z: target.z, color: target.color),
          ),
        );
        world.addAll(_collectibles);
    }
  }

  void _unmountFloor() {
    for (final component in <Component3D>[
      ..._crates,
      ..._collectibles,
      arena,
    ]) {
      if (!component.isRemoved && !component.isRemoving) {
        component.removeFromParent();
      }
    }
    _crates.clear();
    _collectibles.clear();
  }

  void _showTemporaryMessage(String message) {
    _temporaryMessageRemaining = 1.25;
    hudState.value = _buildHudState(message);
  }

  void _publishState() {
    final message = switch ((_phase, _attractMode, _objectiveComplete)) {
      (GamePhase.transitioning, _, _) => 'エレベーターで2Fへ移動中',
      (GamePhase.cleared, _, _) => '新しい立ち飲み処が開店しました',
      (GamePhase.playing, true, _) => '自動デモ再生中 • 触れてプレイ',
      (GamePhase.playing, false, true) => _floor.unlockedMessage,
      (GamePhase.playing, false, false) => _floor.playMessage,
    };
    hudState.value = _buildHudState(message);
  }

  GameHudState _buildHudState(String message) => GameHudState(
    phase: _phase,
    floorCode: _floor.code,
    floorTitle: _floor.title,
    floorIndex: _floor.index,
    totalFloors: _totalFloors,
    objectiveProgress: _objectiveProgress,
    objectiveTotal: _floor.targets.length,
    objectiveLabel: _floor.objectiveLabel,
    actionLabel: _floor.actionLabel,
    message: message,
    clearTitle: '立ち飲み処オープン！',
    transitionTitle: '2F // ${windowLoungeFloor.title}',
    elapsedSeconds: _elapsedSeconds,
    stylePoints: _stylePoints,
    flow: _flow,
    rank: _rank,
    attractMode: _attractMode,
  );

  bool get _objectiveComplete => _objectiveProgress >= _floor.targets.length;

  Vector2 get _exit => Vector2(_floor.exit.x, _floor.exit.z);

  Vector3 get _startPosition => Vector3(_floor.start.x, 0, _floor.start.z);

  String get _rank {
    if (_phase != GamePhase.cleared) {
      return '—';
    }
    if (_elapsedSeconds < 36) {
      return 'S';
    }
    if (_elapsedSeconds < 54) {
      return 'A';
    }
    return 'B';
  }

  @override
  void onRemove() {
    hudState.dispose();
    effects.dispose();
    super.onRemove();
  }
}

class MobileGameCamera extends CameraComponent3D
    with HasGameReference<MadogiwaVoxelGame> {
  MobileGameCamera()
    : super(
        position: Vector3(0, 13, 20),
        target: Vector3(0, 0.8, 4),
        fovY: 52,
        projection: CameraProjection.perspective,
      );

  double _shake = 0;
  double _fovKick = 0;
  double _reveal = 0;
  double _celebration = 0;
  double _time = 0;

  void triggerImpact(double strength) {
    _shake = math.max(_shake, strength);
    _fovKick = math.max(_fovKick, strength);
  }

  void revealExit() {
    _reveal = 1;
    _fovKick = 1;
  }

  void celebrate() {
    _celebration = 0.001;
    _shake = 0.45;
  }

  void resetEffects() {
    _shake = 0;
    _fovKick = 0;
    _reveal = 0;
    _celebration = 0;
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (!game.playerReady) {
      return;
    }
    _time += dt;
    _shake = math.max(0, _shake - dt * 3.3);
    _fovKick = math.max(0, _fovKick - dt * 2.7);
    _reveal = math.max(0, _reveal - dt * 0.54);
    if (_celebration > 0) {
      _celebration += dt;
    }

    var desiredTarget = game.player.position + _targetOffset;
    var desiredPosition = desiredTarget + _cameraOffset;
    desiredPosition.x += game._moveInput.x * 1.35;

    final intro = game.effects.introProgress;
    if (intro < 1) {
      final eased = _easeInOutCubic(intro);
      final introPosition = desiredTarget + Vector3(-12, 19, 27);
      desiredPosition =
          introPosition + (desiredPosition - introPosition) * eased;
      desiredTarget =
          Vector3(0, 0.8, 0) + (desiredTarget - Vector3(0, 0.8, 0)) * eased;
    }

    if (_reveal > 0) {
      final amount = math.sin(_reveal * math.pi) * 0.58;
      final exitTarget = Vector3(game._floor.exit.x, 1.2, game._floor.exit.z);
      desiredTarget += (exitTarget - desiredTarget) * amount;
      desiredPosition += Vector3(0, 2.4, -2.1) * amount;
    }

    if (_celebration > 0) {
      final orbit = math.min(_celebration, 2.8);
      desiredTarget = game.player.position + Vector3(0, 1.25, 0);
      desiredPosition =
          desiredTarget +
          Vector3(
            math.sin(orbit * 0.62) * 4.8,
            9.2 + math.cos(orbit * 0.9) * 0.7,
            11.4 + math.cos(orbit * 0.62) * 1.4,
          );
    }

    final shakeOffset = Vector3(
      math.sin(_time * 73) * _shake * 0.19,
      math.sin(_time * 91 + 1.2) * _shake * 0.13,
      math.cos(_time * 67) * _shake * 0.12,
    );
    desiredPosition += shakeOffset;
    final positionResponse = 1 - math.exp(-dt * 5.5);
    final targetResponse = 1 - math.exp(-dt * 8.0);
    position += (desiredPosition - position) * positionResponse;
    target += (desiredTarget - target) * targetResponse;
    fovY = 52 + _fovKick * 4.5 + game.effects.movement * 1.8;
  }

  static double _easeInOutCubic(double value) => value < 0.5
      ? 4 * value * value * value
      : 1 - math.pow(-2 * value + 2, 3) / 2;

  static final Vector3 _targetOffset = Vector3(0, 1.0, -1.6);
  static final Vector3 _cameraOffset = Vector3(0, 13, 15.5);
}
