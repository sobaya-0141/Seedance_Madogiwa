import 'dart:math' as math;

import 'package:flame_3d/components.dart';
import 'package:flame_3d/core.dart';
import 'package:flame_3d/model.dart';
import 'package:flame_3d/parser.dart';

class VoxelCharacter extends Component3D {
  VoxelCharacter._({required ModelComponent visual, required super.position})
    : visual = visual,
      super(children: [visual]) {
    for (final node in visual.model.nodes.values) {
      final name = node.name;
      if (name == null || !name.startsWith('VoxelRig_')) {
        continue;
      }
      _baseTransforms[node] = node.transform.clone();
      switch (name) {
        case 'VoxelRig_ArmPrimary':
          _primaryArm = node;
        case 'VoxelRig_ArmSecondary':
          _secondaryArm = node;
        case 'VoxelRig_LegLeft':
          _leftLeg = node;
        case 'VoxelRig_LegRight':
          _rightLeg = node;
        default:
          if (name.startsWith('VoxelRig_Locomotion_')) {
            _locomotionNodes.add(node);
          }
      }
    }
    _locomotionNodes.sort((a, b) => (a.name ?? '').compareTo(b.name ?? ''));
  }

  static Future<VoxelCharacter> load({
    required String assetPath,
    required Vector3 position,
    double scale = 1,
  }) async {
    final model = await ModelParser.parse(assetPath);
    final visual = ModelComponent(model: model, scale: Vector3.all(scale));
    if (visual.animationNames.contains('Idle')) {
      visual.playAnimationByName('Idle');
    }
    return VoxelCharacter._(visual: visual, position: position);
  }

  final ModelComponent visual;
  final Map<ModelNode, Matrix4> _baseTransforms = {};
  final List<ModelNode> _locomotionNodes = [];
  ModelNode? _primaryArm;
  ModelNode? _secondaryArm;
  ModelNode? _leftLeg;
  ModelNode? _rightLeg;

  bool moving = false;
  double _elapsed = 0;
  double _smashElapsed = _smashDuration + 1;

  void face(double radians) {
    rotation.setAxisAngle(_up, radians);
  }

  void triggerSmash() {
    _smashElapsed = 0;
  }

  void resetMotion() {
    moving = false;
    _elapsed = 0;
    _smashElapsed = _smashDuration + 1;
    visual.position.y = 0;
    visual.rotation.setFrom(Quaternion.identity());
    for (final entry in _baseTransforms.entries) {
      entry.key.transform.setFrom(entry.value);
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    _elapsed += dt;
    _smashElapsed += dt;

    final stride = moving ? math.sin(_elapsed * 8.5) * 0.42 : 0.0;
    var primaryAngle = moving ? stride * 0.16 : 0.0;
    var secondaryAngle = moving ? -stride * 0.46 : 0.0;
    var rootLean = 0.0;
    var rootDrop = 0.0;

    if (_smashElapsed < _smashDuration) {
      final phase = _smashElapsed / _smashDuration;
      if (phase < 0.2) {
        primaryAngle = _lerp(0, 0.55, _smooth(phase / 0.2));
      } else if (phase < 0.39) {
        primaryAngle = _lerp(0.55, -1.55, _smooth((phase - 0.2) / 0.19));
      } else if (phase < 0.52) {
        primaryAngle = -1.55;
      } else {
        primaryAngle = _lerp(
          -1.55,
          moving ? stride * 0.16 : 0,
          _smooth((phase - 0.52) / 0.48),
        );
      }
      secondaryAngle -= math.sin(math.pi * phase) * 0.34;
      final impact = phase < 0.39
          ? _smooth(phase / 0.39)
          : phase < 0.52
          ? 1.0
          : 1 - _smooth((phase - 0.52) / 0.48);
      rootLean = 0.12 * impact;
      rootDrop = -0.06 * impact;
    }

    _rotateX(_leftLeg, stride);
    _rotateX(_rightLeg, -stride);
    _rotateX(_primaryArm, primaryAngle);
    _rotateX(_secondaryArm, secondaryAngle);
    for (final (index, node) in _locomotionNodes.indexed) {
      final wave = moving ? math.sin(_elapsed * 8.5 + index * 0.9) * 0.18 : 0.0;
      _rotateZ(node, wave);
    }
    visual.position.y = rootDrop;
    visual.rotation.setAxisAngle(_right, rootLean);
  }

  void _rotateX(ModelNode? node, double radians) {
    if (node == null) {
      return;
    }
    node.transform
      ..setFrom(_baseTransforms[node]!)
      ..rotateX(radians);
  }

  void _rotateZ(ModelNode node, double radians) {
    node.transform
      ..setFrom(_baseTransforms[node]!)
      ..rotateZ(radians);
  }

  static double _lerp(double a, double b, double t) => a + (b - a) * t;

  static double _smooth(double t) {
    final value = t.clamp(0.0, 1.0);
    return value * value * (3 - 2 * value);
  }

  static const double _smashDuration = 0.44;
  static final Vector3 _up = Vector3(0, 1, 0);
  static final Vector3 _right = Vector3(1, 0, 0);
}
