import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flutter/painting.dart';

import '../../rules/card_definition.dart';
import '../../rules/game_state.dart';

class SummonEffectComponent extends PositionComponent {
  SummonEffectComponent({
    required Vector2 position,
    required this.definition,
    required this.side,
  }) : super(position: position, anchor: Anchor.center, priority: 820);

  final CardDefinition definition;
  final PlayerSide side;
  double _age = 0;

  static const _duration = 1.08;

  Color get _accent => Color(definition.accentArgb);
  Color get _sideColor => side == PlayerSide.player
      ? const Color(0xFF46E5FF)
      : const Color(0xFFFF7187);

  @override
  void update(double dt) {
    super.update(dt);
    _age += dt;
    if (_age >= _duration) {
      removeFromParent();
    }
  }

  @override
  void render(Canvas canvas) {
    final progress = (_age / _duration).clamp(0.0, 1.0);
    final appear = math.min(1.0, progress * 5);
    final fade = math.pow(1 - progress, 1.25).toDouble();
    final color = Color.lerp(_accent, _sideColor, 0.34)!;

    _drawCommonArrival(canvas, progress, appear * fade, color);
    switch (definition.id) {
      case 'sobaya':
        _drawSobaya(canvas, progress, fade);
      case 'takosan':
        _drawTakosan(canvas, progress, fade);
      case 'tokun':
        _drawTokun(canvas, progress, fade);
      case 'yotan':
        _drawYotan(canvas, progress, fade);
      case 'fukuchan':
        _drawFukuchan(canvas, progress, fade);
      case 'yametaro':
        _drawYametaro(canvas, progress, fade);
      case 'okayaman':
        _drawOkayaman(canvas, progress, fade);
      case 'yumemin':
        _drawYumemin(canvas, progress, fade);
    }
    _drawLabel(canvas, progress, fade, color);
  }

  void _drawCommonArrival(
    Canvas canvas,
    double progress,
    double alpha,
    Color color,
  ) {
    final radius = 12 + progress * 72;
    canvas.drawCircle(
      Offset.zero,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4 * (1 - progress) + 0.7
        ..color = color.withValues(alpha: alpha * 0.9),
    );
    canvas.drawCircle(
      Offset.zero,
      10 + progress * 30,
      Paint()
        ..color = color.withValues(alpha: alpha * 0.16)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16),
    );
    for (var index = 0; index < 10; index += 1) {
      final angle = index * math.pi * 2 / 10 + progress * 0.55;
      final distance = 18 + progress * (44 + index % 3 * 8);
      canvas.drawCircle(
        Offset(math.cos(angle) * distance, math.sin(angle) * distance),
        2.6 * (1 - progress),
        Paint()..color = color.withValues(alpha: alpha),
      );
    }
  }

  void _drawSobaya(Canvas canvas, double progress, double fade) {
    final red = const Color(0xFFFF5B55).withValues(alpha: fade);
    final lanternPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..color = red;
    for (final direction in const [-1.0, 1.0]) {
      final center = Offset(direction * (35 + progress * 15), -8);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(center: center, width: 17, height: 25),
          const Radius.circular(6),
        ),
        lanternPaint,
      );
      canvas.drawLine(
        center + const Offset(0, -18),
        center + const Offset(0, -12),
        lanternPaint,
      );
    }
    for (var index = 0; index < 3; index += 1) {
      final x = (index - 1) * 16.0;
      final path = Path()
        ..moveTo(x, 23)
        ..cubicTo(
          x - 12,
          8 - progress * 18,
          x + 13,
          -4 - progress * 23,
          x,
          -28 - progress * 24,
        );
      canvas.drawPath(
        path,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3
          ..strokeCap = StrokeCap.round
          ..color = const Color(0xFFF7F2DF).withValues(alpha: fade * 0.8),
      );
    }
  }

  void _drawTakosan(Canvas canvas, double progress, double fade) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4 * (1 - progress * 0.45)
      ..strokeCap = StrokeCap.round
      ..color = _accent.withValues(alpha: fade * 0.86);
    for (var index = 0; index < 8; index += 1) {
      final angle = index * math.pi / 4;
      final distance = 22 + progress * 55;
      final end = Offset(
        math.cos(angle) * distance,
        math.sin(angle) * distance,
      );
      final tangent = Offset(-math.sin(angle) * 18, math.cos(angle) * 18);
      final path = Path()
        ..moveTo(Offset.zero.dx, Offset.zero.dy)
        ..quadraticBezierTo(
          end.dx * 0.55 + tangent.dx * math.sin(progress * math.pi),
          end.dy * 0.55 + tangent.dy * math.sin(progress * math.pi),
          end.dx,
          end.dy,
        );
      canvas.drawPath(path, paint);
      canvas.drawCircle(
        end,
        3.5,
        Paint()..color = _accent.withValues(alpha: fade),
      );
    }
  }

  void _drawTokun(Canvas canvas, double progress, double fade) {
    final paint = Paint()
      ..color = const Color(0xFF63F1C9).withValues(alpha: fade)
      ..strokeWidth = 2.8
      ..strokeCap = StrokeCap.round;
    for (var index = 0; index < 5; index += 1) {
      final angle = index * math.pi * 2 / 5 - progress * 1.4;
      final distance = 28 + progress * 38;
      final note = Offset(
        math.cos(angle) * distance,
        math.sin(angle) * distance,
      );
      canvas.drawCircle(note, 5, paint);
      canvas.drawLine(
        note + const Offset(4, 0),
        note + const Offset(4, -18),
        paint,
      );
      if (index.isEven) {
        canvas.drawLine(
          note + const Offset(4, -18),
          note + const Offset(13, -14),
          paint,
        );
      }
    }
    for (var index = 0; index < 3; index += 1) {
      canvas.drawCircle(
        Offset.zero,
        18 + progress * (28 + index * 12),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5
          ..color = _accent.withValues(alpha: fade * (0.8 - index * 0.18)),
      );
    }
  }

  void _drawYotan(Canvas canvas, double progress, double fade) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.2
      ..strokeJoin = StrokeJoin.round
      ..color = const Color(0xFF8EEAFF).withValues(alpha: fade);
    for (var index = 0; index < 5; index += 1) {
      final angle = index * math.pi * 2 / 5 - math.pi / 2;
      canvas.save();
      canvas.rotate(angle);
      final reach = 35 + progress * 42;
      final path = Path()
        ..moveTo(10, 0)
        ..lineTo(reach * 0.46, -8)
        ..lineTo(reach * 0.58, 5)
        ..lineTo(reach, -3);
      canvas.drawPath(path, paint);
      canvas.restore();
    }
  }

  void _drawFukuchan(Canvas canvas, double progress, double fade) {
    for (var index = 0; index < 6; index += 1) {
      final angle = index * math.pi * 2 / 6 - math.pi / 2;
      final distance = 22 + progress * 54;
      final center = Offset(
        math.cos(angle) * distance,
        math.sin(angle) * distance,
      );
      final heart = Path()
        ..moveTo(center.dx, center.dy + 7)
        ..cubicTo(
          center.dx - 15,
          center.dy - 3,
          center.dx - 7,
          center.dy - 13,
          center.dx,
          center.dy - 5,
        )
        ..cubicTo(
          center.dx + 7,
          center.dy - 13,
          center.dx + 15,
          center.dy - 3,
          center.dx,
          center.dy + 7,
        );
      canvas.drawPath(
        heart,
        Paint()..color = const Color(0xFFFF79B5).withValues(alpha: fade * 0.9),
      );
    }
  }

  void _drawYametaro(Canvas canvas, double progress, double fade) {
    final color = const Color(0xFFD778FF);
    for (var index = 0; index < 9; index += 1) {
      final phase = math.sin(index * 8.17 + progress * 36);
      final y = -46 + index * 11.0;
      final x = phase * (18 + progress * 34);
      canvas.drawRect(
        Rect.fromLTWH(x - 24 - index % 2 * 8, y, 48 + index % 3 * 12, 3.5),
        Paint()
          ..color = color.withValues(alpha: fade * (0.42 + index % 3 * 0.18)),
      );
    }
    canvas.drawRect(
      Rect.fromCenter(center: Offset(progress * 34, 0), width: 44, height: 66),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = color.withValues(alpha: fade * 0.68),
    );
  }

  void _drawOkayaman(Canvas canvas, double progress, double fade) {
    final gold = const Color(0xFFFFDA67).withValues(alpha: fade);
    final scanY = -55 + progress * 110;
    canvas.drawRect(
      Rect.fromLTWH(-62, scanY - 5, 124, 10),
      Paint()
        ..shader = LinearGradient(
          colors: [gold.withValues(alpha: 0), gold, gold.withValues(alpha: 0)],
        ).createShader(Rect.fromLTWH(-62, scanY - 5, 124, 10)),
    );
    final bracketPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..color = gold;
    final path = Path()
      ..moveTo(-53, -30)
      ..lineTo(-53, -48)
      ..lineTo(-34, -48)
      ..moveTo(53, -30)
      ..lineTo(53, -48)
      ..lineTo(34, -48)
      ..moveTo(-53, 30)
      ..lineTo(-53, 48)
      ..lineTo(-34, 48)
      ..moveTo(53, 30)
      ..lineTo(53, 48)
      ..lineTo(34, 48);
    canvas.drawPath(path, bracketPaint);
    _paintText(
      canvas,
      '規',
      Offset.zero,
      color: gold,
      fontSize: 29,
      strokeColor: const Color(0xFF111827),
    );
  }

  void _drawYumemin(Canvas canvas, double progress, double fade) {
    final blue = const Color(0xFF73C8FF).withValues(alpha: fade);
    canvas.save();
    canvas.rotate(-0.9 + progress * 1.35);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(-8, -66, 16, 48),
        const Radius.circular(5),
      ),
      Paint()..color = blue,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(-27, -78, 54, 22),
        const Radius.circular(7),
      ),
      Paint()..color = Color.lerp(blue, const Color(0xFFFFFFFF), 0.35)!,
    );
    canvas.restore();
    final burstPaint = Paint()
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..color = blue;
    for (var index = 0; index < 12; index += 1) {
      final angle = index * math.pi / 6;
      canvas.drawLine(
        Offset(math.cos(angle) * 24, math.sin(angle) * 24),
        Offset(
          math.cos(angle) * (45 + progress * 24),
          math.sin(angle) * (45 + progress * 24),
        ),
        burstPaint,
      );
    }
  }

  void _drawLabel(Canvas canvas, double progress, double fade, Color color) {
    final label = switch (definition.id) {
      'sobaya' => '快適！',
      'takosan' => 'TENTACLES',
      'tokun' => 'BGM ♪',
      'yotan' => 'RESTORE',
      'fukuchan' => 'ギュンギュン！',
      'yametaro' => 'ESCAPE READY',
      'okayaman' => 'REGULATION',
      'yumemin' => 'BONK!',
      _ => definition.name,
    };
    _paintText(
      canvas,
      label,
      Offset(0, -72 - progress * 18),
      color: Color.lerp(
        color,
        const Color(0xFFFFFFFF),
        0.55,
      )!.withValues(alpha: fade),
      fontSize: 14 + math.min(1, progress * 6) * 5,
      strokeColor: const Color(0xFF06101D).withValues(alpha: fade),
    );
  }

  void _paintText(
    Canvas canvas,
    String text,
    Offset center, {
    required Color color,
    required double fontSize,
    Color? strokeColor,
  }) {
    if (strokeColor != null) {
      final stroke = TextPainter(
        text: TextSpan(
          text: text,
          style: TextStyle(
            foreground: Paint()
              ..style = PaintingStyle.stroke
              ..strokeWidth = 4
              ..color = strokeColor,
            fontSize: fontSize,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      stroke.paint(
        canvas,
        center - Offset(stroke.width / 2, stroke.height / 2),
      );
    }
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.2,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(
      canvas,
      center - Offset(painter.width / 2, painter.height / 2),
    );
  }
}
