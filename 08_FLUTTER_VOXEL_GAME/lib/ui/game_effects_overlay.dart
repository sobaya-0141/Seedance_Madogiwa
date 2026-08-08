import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:madogiwa_voxel_mobile/game/game_effects_controller.dart';

class GameEffectsOverlay extends StatelessWidget {
  const GameEffectsOverlay({required this.controller, super.key});

  final GameEffectsController controller;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: RepaintBoundary(
        child: CustomPaint(
          painter: _GameEffectsPainter(controller),
          size: Size.infinite,
        ),
      ),
    );
  }
}

class _GameEffectsPainter extends CustomPainter {
  _GameEffectsPainter(this.controller) : super(repaint: controller);

  final GameEffectsController controller;

  static const _mint = Color(0xFF62FFB0);
  static const _cyan = Color(0xFF55D9FF);
  static const _coral = Color(0xFFFF8065);
  static const _lavender = Color(0xFFB8A5FF);

  @override
  void paint(Canvas canvas, Size size) {
    if (size.isEmpty) {
      return;
    }
    _paintAtmosphere(canvas, size);
    _paintPrismFlares(canvas, size);
    _paintDust(canvas, size);
    _paintSpeed(canvas, size);
    _paintImpact(canvas, size);
    _paintExitPulse(canvas, size);
    _paintFloorPulse(canvas, size);
    _paintDaylightFrame(canvas, size);
    _paintScan(canvas, size);
    _paintFlash(canvas, size);
    _paintIntro(canvas, size);
  }

  void _paintAtmosphere(Canvas canvas, Size size) {
    final t = controller.time;
    final leftCenter = Offset(
      size.width * (0.11 + math.sin(t * 0.21) * 0.035),
      size.height * (0.24 + math.cos(t * 0.27) * 0.07),
    );
    final rightCenter = Offset(
      size.width * (0.88 + math.cos(t * 0.17) * 0.04),
      size.height * (0.32 + math.sin(t * 0.23) * 0.06),
    );
    canvas.drawCircle(
      leftCenter,
      size.shortestSide * 0.46,
      Paint()
        ..shader = ui.Gradient.radial(leftCenter, size.shortestSide * 0.46, [
          _cyan.withValues(alpha: 0.09),
          _cyan.withValues(alpha: 0),
        ]),
    );
    canvas.drawCircle(
      rightCenter,
      size.shortestSide * 0.42,
      Paint()
        ..shader = ui.Gradient.radial(rightCenter, size.shortestSide * 0.42, [
          _mint.withValues(alpha: 0.075),
          _mint.withValues(alpha: 0),
        ]),
    );
  }

  void _paintPrismFlares(Canvas canvas, Size size) {
    final drift = math.sin(controller.time * 0.23) * size.width * 0.012;
    final flares = [
      (
        path: Path()
          ..moveTo(size.width * 0.02 + drift, size.height * 0.14)
          ..lineTo(size.width * 0.19 + drift, size.height * 0.04)
          ..lineTo(size.width * 0.13 + drift, size.height * 0.34)
          ..close(),
        color: _lavender,
      ),
      (
        path: Path()
          ..moveTo(size.width * 0.83 - drift, size.height * 0.08)
          ..lineTo(size.width * 0.98 - drift, size.height * 0.2)
          ..lineTo(size.width * 0.9 - drift, size.height * 0.35)
          ..close(),
        color: _coral,
      ),
    ];
    for (final flare in flares) {
      canvas.drawPath(
        flare.path,
        Paint()
          ..color = flare.color.withValues(alpha: 0.035)
          ..blendMode = BlendMode.screen,
      );
    }
  }

  void _paintDust(Canvas canvas, Size size) {
    final paint = Paint()..blendMode = BlendMode.screen;
    for (var i = 0; i < 24; i++) {
      final speed = 0.018 + (i % 5) * 0.006;
      final y = ((i * 0.173 + controller.time * speed) % 1) * size.height;
      final drift = math.sin(controller.time * 0.3 + i * 1.73) * 18;
      final x = ((i * 0.397) % 1) * size.width + drift;
      final shimmer = (math.sin(controller.time * 1.4 + i) + 1) / 2;
      final color = switch (i % 4) {
        0 => _mint,
        1 => _cyan,
        2 => _lavender,
        _ => _coral,
      };
      paint.color = color.withValues(alpha: 0.055 + shimmer * 0.09);
      canvas.drawCircle(Offset(x, y), 0.7 + (i % 3) * 0.42, paint);
    }
  }

  void _paintSpeed(Canvas canvas, Size size) {
    final intensity = controller.movement;
    if (intensity < 0.025) {
      return;
    }
    final origin = Offset(
      controller.playerAnchor.dx * size.width,
      controller.playerAnchor.dy * size.height,
    );
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..blendMode = BlendMode.screen;
    for (var i = 0; i < 14; i++) {
      final angle = i / 14 * math.pi * 2 + math.sin(i * 3.1) * 0.16;
      final phase = (controller.time * (1.35 + intensity) + i * 0.193) % 1;
      final radial = size.shortestSide * (0.16 + phase * 0.74);
      final length = (20 + 68 * phase) * intensity;
      final direction = Offset(math.cos(angle), math.sin(angle) * 0.62);
      final start = origin + direction * radial;
      paint
        ..strokeWidth = 0.7 + phase * 1.1
        ..color = (i.isEven ? _cyan : _mint).withValues(
          alpha: (1 - phase) * 0.22 * intensity,
        );
      canvas.drawLine(start, start + direction * length, paint);
    }
  }

  void _paintImpact(Canvas canvas, Size size) {
    for (final impact in controller.impacts) {
      final progress = Curves.easeOutCubic.transform(impact.progress);
      final origin = Offset(
        impact.origin.dx * size.width,
        impact.origin.dy * size.height,
      );
      final radius = size.shortestSide * (0.035 + progress * 0.34);
      final alpha = (1 - impact.progress) * impact.strength;
      final prismColors = [_cyan, _mint, _lavender, _coral];
      for (var ring = 0; ring < prismColors.length; ring++) {
        canvas.drawCircle(
          origin,
          radius * (0.94 + ring * 0.035),
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = ring == 0
                ? 8 * (1 - progress) + 1.4
                : 0.9 + (1 - progress) * 1.5
            ..color = Color.lerp(
              prismColors[ring],
              Colors.white,
              (1 - progress) * 0.7,
            )!.withValues(alpha: alpha * (ring == 0 ? 0.22 : 0.58)),
        );
      }
      final rayPaint = Paint()
        ..strokeWidth = 1.5
        ..strokeCap = StrokeCap.round;
      for (var i = 0; i < 8; i++) {
        final angle = i / 8 * math.pi * 2 + 0.17;
        final unit = Offset(math.cos(angle), math.sin(angle));
        rayPaint.color = prismColors[i % prismColors.length].withValues(
          alpha: alpha * 0.58,
        );
        canvas.drawLine(
          origin + unit * radius * 0.7,
          origin + unit * radius * (0.94 + impact.strength * 0.25),
          rayPaint,
        );
      }
    }
  }

  void _paintExitPulse(Canvas canvas, Size size) {
    if (controller.exitPulse <= 0 && controller.clearPulse <= 0) {
      return;
    }
    final value = math.max(controller.exitPulse, controller.clearPulse);
    final color = controller.clearPulse > 0 ? _coral : _mint;
    final center = Offset(size.width * 0.5, size.height * 0.18);
    final radius = size.longestSide * (1.05 - value * 0.56);
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2 + value * 7
        ..color = color.withValues(alpha: value * 0.19),
    );
  }

  void _paintFloorPulse(Canvas canvas, Size size) {
    if (controller.floorPulse <= 0) {
      return;
    }
    final value = Curves.easeOutCubic.transform(controller.floorPulse);
    final center = size.width / 2;
    final travel = size.width * (1 - value) * 0.5;
    final paint = Paint()
      ..color = _lavender.withValues(alpha: value * 0.16)
      ..strokeWidth = 3 + value * 5;
    canvas.drawLine(
      Offset(center - travel, 0),
      Offset(center - travel, size.height),
      paint,
    );
    paint.color = _cyan.withValues(alpha: value * 0.16);
    canvas.drawLine(
      Offset(center + travel, 0),
      Offset(center + travel, size.height),
      paint,
    );
  }

  void _paintDaylightFrame(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = Offset(size.width * 0.5, size.height * 0.46);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = ui.Gradient.radial(
          center,
          size.longestSide * 0.66,
          [
            Colors.transparent,
            const Color(0x0D78D8E4),
            const Color(0x2477CFDC),
          ],
          [0, 0.68, 1],
        ),
    );
  }

  void _paintScan(Canvas canvas, Size size) {
    final y = ((controller.time * 0.085) % 1) * size.height;
    final rect = Rect.fromLTWH(0, y - 22, size.width, 44);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = ui.Gradient.linear(
          Offset(0, rect.top),
          Offset(0, rect.bottom),
          [
            Colors.transparent,
            _cyan.withValues(alpha: 0.028),
            Colors.transparent,
          ],
          [0, 0.5, 1],
        ),
    );
    final linePaint = Paint()
      ..color = const Color(0xFF2A8FA2).withValues(alpha: 0.022)
      ..strokeWidth = 0.5;
    for (double scanY = 1; scanY < size.height; scanY += 11) {
      canvas.drawLine(Offset(0, scanY), Offset(size.width, scanY), linePaint);
    }
  }

  void _paintFlash(Canvas canvas, Size size) {
    if (controller.flash <= 0) {
      return;
    }
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..color = Color.lerp(
          _mint,
          Colors.white,
          controller.flash,
        )!.withValues(alpha: controller.flash * 0.11)
        ..blendMode = BlendMode.screen,
    );
  }

  void _paintIntro(Canvas canvas, Size size) {
    if (controller.introComplete) {
      return;
    }
    final progress = Curves.easeOutExpo.transform(controller.introProgress);
    final barHeight = size.height * 0.095 * (1 - progress);
    final paint = Paint()..color = const Color(0xFFEAF7F6);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, barHeight), paint);
    canvas.drawRect(
      Rect.fromLTWH(0, size.height - barHeight, size.width, barHeight),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _GameEffectsPainter oldDelegate) => false;
}
