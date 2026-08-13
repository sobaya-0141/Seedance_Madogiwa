import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flutter/painting.dart';

class BattleEffectComponent extends PositionComponent {
  BattleEffectComponent({
    required Vector2 position,
    required this.label,
    required this.color,
    this.destination,
  }) : super(position: position, anchor: Anchor.center, priority: 900);

  final String label;
  final Color color;
  final Vector2? destination;
  double _age = 0;
  static const _duration = 1.05;

  @override
  void update(double dt) {
    super.update(dt);
    _age += dt;
    if (destination != null) {
      final cursor = math.min(1.0, dt * 8);
      position.setFrom(position + (destination! - position) * cursor);
    }
    if (_age >= _duration) {
      removeFromParent();
    }
  }

  @override
  void render(Canvas canvas) {
    final progress = (_age / _duration).clamp(0.0, 1.0);
    final alpha = math.pow(1 - progress, 1.6).toDouble();
    final ringRadius = 18 + progress * 48;
    canvas.drawCircle(
      Offset.zero,
      ringRadius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3 * (1 - progress) + 0.5
        ..color = color.withValues(alpha: alpha),
    );

    for (var index = 0; index < 8; index += 1) {
      final angle = index * math.pi / 4 + progress * 0.35;
      final distance = 12 + progress * 52;
      canvas.drawCircle(
        Offset(math.cos(angle) * distance, math.sin(angle) * distance),
        3.2 * (1 - progress),
        Paint()..color = color.withValues(alpha: alpha),
      );
    }

    final painter = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          color: Color.lerp(
            color,
            const Color(0xFFFFFFFF),
            0.55,
          )?.withValues(alpha: alpha),
          fontSize: 16 + (1 - progress) * 7,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.4,
          shadows: const [Shadow(color: Color(0xFF000000), blurRadius: 8)],
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, Offset(-painter.width / 2, -34 - progress * 26));
  }
}
