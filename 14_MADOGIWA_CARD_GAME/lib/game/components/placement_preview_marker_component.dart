import 'dart:math' as math;
import 'dart:ui';

import 'package:flame/components.dart';

import '../madogiwa_grid_game.dart';
import '../placement_preview.dart';

class PlacementPreviewMarkerComponent extends PositionComponent
    with HasGameReference<MadogiwaGridGame> {
  PlacementPreviewMarkerComponent({
    required Vector2 position,
    required Vector2 size,
    required this.kind,
  }) : super(
         position: position,
         size: size,
         anchor: Anchor.center,
         priority: 70,
       );

  PlacementPreviewKind kind;

  void sync({
    required Vector2 position,
    required Vector2 size,
    required PlacementPreviewKind kind,
  }) {
    this.position = position;
    this.size = size;
    this.kind = kind;
  }

  @override
  void render(Canvas canvas) {
    final color = switch (kind) {
      PlacementPreviewKind.placement => const Color(0xFFFFE58A),
      PlacementPreviewKind.claim => const Color(0xFF4DE7FF),
      PlacementPreviewKind.contest => const Color(0xFFFF9D67),
      PlacementPreviewKind.ability => const Color(0xFFD990FF),
    };
    final wave = (math.sin(game.elapsedSeconds * 7) + 1) / 2;
    final bounds = Rect.fromLTWH(0, 0, width, height).deflate(4 - wave * 1.5);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = kind == PlacementPreviewKind.ability ? 3 : 2
      ..strokeCap = StrokeCap.round
      ..color = color.withValues(alpha: 0.74 + wave * 0.24);

    switch (kind) {
      case PlacementPreviewKind.placement:
        _drawCorners(canvas, bounds, paint, width * 0.18);
      case PlacementPreviewKind.claim:
        for (var index = 0; index < 4; index += 1) {
          final angle = index * math.pi / 2;
          final center = bounds.center;
          final start = Offset(
            center.dx + math.cos(angle) * width * 0.19,
            center.dy + math.sin(angle) * width * 0.19,
          );
          final end = Offset(
            center.dx + math.cos(angle) * width * 0.3,
            center.dy + math.sin(angle) * width * 0.3,
          );
          canvas.drawLine(start, end, paint);
        }
      case PlacementPreviewKind.contest:
        final clip = RRect.fromRectAndRadius(
          bounds,
          Radius.circular(width * 0.09),
        );
        canvas.save();
        canvas.clipRRect(clip);
        for (var x = -height; x < width; x += 13) {
          canvas.drawLine(
            Offset(x.toDouble(), height),
            Offset(x + height, 0),
            paint,
          );
        }
        canvas.restore();
        canvas.drawRRect(clip, paint);
      case PlacementPreviewKind.ability:
        final center = bounds.center;
        final radius = width * (0.24 + wave * 0.025);
        canvas.drawCircle(center, radius, paint);
        canvas.drawCircle(
          center,
          width * 0.04,
          Paint()..color = color.withValues(alpha: 0.9),
        );
        for (var index = 0; index < 4; index += 1) {
          final angle = index * math.pi / 2;
          canvas.drawLine(
            Offset(
              center.dx + math.cos(angle) * radius * 1.05,
              center.dy + math.sin(angle) * radius * 1.05,
            ),
            Offset(
              center.dx + math.cos(angle) * radius * 1.42,
              center.dy + math.sin(angle) * radius * 1.42,
            ),
            paint,
          );
        }
        _drawCorners(canvas, bounds, paint, width * 0.16);
    }
  }

  void _drawCorners(Canvas canvas, Rect bounds, Paint paint, double length) {
    final path = Path()
      ..moveTo(bounds.left, bounds.top + length)
      ..lineTo(bounds.left, bounds.top)
      ..lineTo(bounds.left + length, bounds.top)
      ..moveTo(bounds.right - length, bounds.top)
      ..lineTo(bounds.right, bounds.top)
      ..lineTo(bounds.right, bounds.top + length)
      ..moveTo(bounds.left, bounds.bottom - length)
      ..lineTo(bounds.left, bounds.bottom)
      ..lineTo(bounds.left + length, bounds.bottom)
      ..moveTo(bounds.right - length, bounds.bottom)
      ..lineTo(bounds.right, bounds.bottom)
      ..lineTo(bounds.right, bounds.bottom - length);
    canvas.drawPath(path, paint);
  }
}
