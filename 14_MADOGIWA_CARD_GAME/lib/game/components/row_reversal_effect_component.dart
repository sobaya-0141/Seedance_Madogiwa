import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flutter/painting.dart';

import '../../rules/game_event.dart';
import '../../rules/game_state.dart';

class RowReversalEffectComponent extends PositionComponent {
  RowReversalEffectComponent({
    required Vector2 position,
    required Vector2 size,
    required this.event,
    this.delay = 0.28,
  }) : super(
         position: position,
         size: size,
         anchor: Anchor.center,
         priority: 760,
       );

  final RowLeadReversedEvent event;
  final double delay;
  double _age = 0;

  static const _duration = 1.18;

  Color get _color => event.newLeader == PlayerSide.player
      ? const Color(0xFF45E5FF)
      : const Color(0xFFFF6C83);

  @override
  void update(double dt) {
    super.update(dt);
    _age += dt;
    if (_age >= delay + _duration) {
      removeFromParent();
    }
  }

  @override
  void render(Canvas canvas) {
    if (_age < delay) {
      return;
    }
    final progress = ((_age - delay) / _duration).clamp(0.0, 1.0);
    final appear = math.min(1.0, progress * 6);
    final fade = math.pow(1 - progress, 1.35).toDouble();
    final sweep = (progress * 1.65).clamp(0.0, 1.0);
    final bounds = Rect.fromLTWH(0, 0, width, height);
    final color = _color;

    canvas.save();
    canvas.clipRRect(
      RRect.fromRectAndRadius(bounds, Radius.circular(height * 0.15)),
    );
    canvas.drawRect(
      bounds,
      Paint()
        ..shader = LinearGradient(
          begin: event.newLeader == PlayerSide.player
              ? Alignment.centerLeft
              : Alignment.centerRight,
          end: event.newLeader == PlayerSide.player
              ? Alignment.centerRight
              : Alignment.centerLeft,
          stops: const [0, 0.42, 1],
          colors: [
            color.withValues(alpha: 0),
            color.withValues(alpha: 0.22 * appear * fade),
            color.withValues(alpha: 0),
          ],
        ).createShader(bounds),
    );
    final sweepX = event.newLeader == PlayerSide.player
        ? -width * 0.2 + width * 1.4 * sweep
        : width * 1.2 - width * 1.4 * sweep;
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(sweepX, height / 2),
        width: width * 0.12,
        height: height * 1.5,
      ),
      Paint()
        ..color = color.withValues(alpha: 0.55 * fade)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14),
    );
    canvas.restore();

    final border = RRect.fromRectAndRadius(
      bounds.deflate(3),
      Radius.circular(height * 0.13),
    );
    canvas.drawRRect(
      border,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.6
        ..color = color.withValues(alpha: appear * fade * 0.84),
    );

    for (var index = 0; index < 3; index += 1) {
      final y = height * (0.25 + index * 0.25);
      final direction = event.newLeader == PlayerSide.player ? 1.0 : -1.0;
      final startX = width / 2 - direction * (26 + progress * 48);
      final path = Path()
        ..moveTo(startX, y)
        ..lineTo(startX + direction * 18, y - 7)
        ..lineTo(startX + direction * 18, y + 7)
        ..close();
      canvas.drawPath(
        path,
        Paint()..color = color.withValues(alpha: fade * 0.75),
      );
    }

    final title = TextPainter(
      text: TextSpan(
        text: 'ROW ${event.row + 1}  逆転!',
        style: TextStyle(
          color: Color.lerp(
            color,
            const Color(0xFFFFFFFF),
            0.62,
          )?.withValues(alpha: appear * fade),
          fontSize: math.min(20, height * 0.18),
          fontWeight: FontWeight.w900,
          letterSpacing: 2.2,
          shadows: const [Shadow(color: Color(0xFF000000), blurRadius: 9)],
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    title.paint(canvas, Offset((width - title.width) / 2, height * 0.2));

    final score = TextPainter(
      text: TextSpan(
        text: '${event.playerScore}  —  ${event.rivalScore}',
        style: TextStyle(
          color: const Color(0xFFFFFFFF).withValues(alpha: appear * fade),
          fontSize: math.min(18, height * 0.17),
          fontWeight: FontWeight.w800,
          letterSpacing: 1.3,
          shadows: const [Shadow(color: Color(0xFF000000), blurRadius: 8)],
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    score.paint(canvas, Offset((width - score.width) / 2, height * 0.53));
  }
}
