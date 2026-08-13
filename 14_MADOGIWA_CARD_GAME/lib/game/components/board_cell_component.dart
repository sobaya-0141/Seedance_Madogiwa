import 'dart:math' as math;
import 'dart:ui';

import 'package:flame/components.dart';
import 'package:flame/events.dart';

import '../placement_preview.dart';
import '../../rules/game_state.dart';
import '../madogiwa_grid_game.dart';

class BoardCellComponent extends PositionComponent
    with TapCallbacks, HoverCallbacks, HasGameReference<MadogiwaGridGame> {
  BoardCellComponent({required this.boardPosition})
    : super(anchor: Anchor.center, priority: -10);

  final BoardPosition boardPosition;
  PlayerSide? influenceOwner;
  bool legalTarget = false;
  PlacementPreviewKind? previewKind;
  double _pulse = 0;

  void sync({
    required PlayerSide? owner,
    required bool legal,
    required PlacementPreviewKind? preview,
  }) {
    if (influenceOwner != owner) {
      _pulse = 1;
    }
    influenceOwner = owner;
    legalTarget = legal;
    previewKind = preview;
  }

  void triggerPulse() {
    _pulse = 1;
  }

  @override
  void update(double dt) {
    super.update(dt);
    _pulse = math.max(0, _pulse - dt * 2.8);
  }

  @override
  void onTapUp(TapUpEvent event) {
    if (legalTarget) {
      game.playSelectedAt(boardPosition);
    }
  }

  @override
  void onHoverEnter() {
    if (legalTarget) {
      game.previewSelectedAt(boardPosition);
    }
  }

  @override
  void onHoverExit() {
    game.clearPlacementPreview(boardPosition);
  }

  @override
  void onHoverCancel() {
    game.clearPlacementPreview(boardPosition);
  }

  @override
  void render(Canvas canvas) {
    final bounds = Rect.fromLTWH(0, 0, width, height);
    final radius = Radius.circular(width * 0.12);
    final rrect = RRect.fromRectAndRadius(bounds, radius);
    final baseColor = switch (influenceOwner) {
      PlayerSide.player => const Color(0xFF33D5F4),
      PlayerSide.rival => const Color(0xFFFF6579),
      null => const Color(0xFF415065),
    };

    canvas.drawRRect(
      rrect,
      Paint()
        ..shader = Gradient.linear(Offset.zero, Offset(width, height), [
          Color.lerp(const Color(0xFF101A29), baseColor, 0.18)!,
          const Color(0xFF0A111D),
        ]),
    );
    canvas.drawRRect(
      rrect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = legalTarget ? 2.8 : 1.2
        ..color = legalTarget
            ? const Color(0xFFFFE99A)
            : baseColor.withValues(alpha: influenceOwner == null ? 0.25 : 0.62),
    );

    if (influenceOwner != null) {
      final center = Offset(width / 2, height / 2);
      canvas.drawCircle(
        center,
        width * (0.09 + _pulse * 0.08),
        Paint()
          ..color = baseColor.withValues(alpha: 0.65 + _pulse * 0.25)
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, 4 + _pulse * 8),
      );
    }

    if (legalTarget) {
      final phase = (game.elapsedSeconds * 2.4) % 1;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          bounds.deflate(3 + phase * 2),
          Radius.circular(width * 0.09),
        ),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2
          ..color = const Color(0xFFFFF1B8).withValues(alpha: 1 - phase),
      );
    }

    final preview = previewKind;
    if (preview != null) {
      _drawPreview(canvas, bounds, preview);
    }
  }

  void _drawPreview(Canvas canvas, Rect bounds, PlacementPreviewKind preview) {
    final color = switch (preview) {
      PlacementPreviewKind.placement => const Color(0xFFFFE58A),
      PlacementPreviewKind.claim => const Color(0xFF4DE7FF),
      PlacementPreviewKind.contest => const Color(0xFFFF9D67),
      PlacementPreviewKind.ability => const Color(0xFFD990FF),
    };
    final wave = (math.sin(game.elapsedSeconds * 7) + 1) / 2;
    final previewBounds = bounds.deflate(4 - wave * 1.5);
    final previewRRect = RRect.fromRectAndRadius(
      previewBounds,
      Radius.circular(width * 0.09),
    );

    canvas.drawRRect(
      previewRRect,
      Paint()
        ..color = color.withValues(alpha: 0.12 + wave * 0.08)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5),
    );
    canvas.drawRRect(
      previewRRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = preview == PlacementPreviewKind.placement ? 3.2 : 2
        ..color = color.withValues(alpha: 0.76 + wave * 0.22),
    );

    switch (preview) {
      case PlacementPreviewKind.placement:
        final ghost = RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: bounds.center,
            width: width * 0.58,
            height: height * 0.67,
          ),
          Radius.circular(width * 0.07),
        );
        canvas.drawRRect(
          ghost,
          Paint()..color = color.withValues(alpha: 0.16 + wave * 0.08),
        );
        canvas.drawRRect(
          ghost,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.4
            ..color = color.withValues(alpha: 0.9),
        );
      case PlacementPreviewKind.claim:
        final center = bounds.center;
        canvas.drawCircle(
          center,
          width * (0.1 + wave * 0.025),
          Paint()..color = color.withValues(alpha: 0.86),
        );
        for (var index = 0; index < 4; index += 1) {
          final angle = math.pi / 4 + index * math.pi / 2;
          final start = Offset(
            center.dx + math.cos(angle) * width * 0.15,
            center.dy + math.sin(angle) * width * 0.15,
          );
          final end = Offset(
            center.dx + math.cos(angle) * width * 0.27,
            center.dy + math.sin(angle) * width * 0.27,
          );
          canvas.drawLine(
            start,
            end,
            Paint()
              ..strokeWidth = 2.2
              ..strokeCap = StrokeCap.round
              ..color = color.withValues(alpha: 0.8),
          );
        }
      case PlacementPreviewKind.contest:
        final stripePaint = Paint()
          ..strokeWidth = 2
          ..color = color.withValues(alpha: 0.7);
        for (var x = -height; x < width; x += 12) {
          canvas.drawLine(
            Offset(x.toDouble(), height),
            Offset(x + height, 0),
            stripePaint,
          );
        }
      case PlacementPreviewKind.ability:
        final center = bounds.center;
        final radius = width * (0.17 + wave * 0.025);
        canvas.drawCircle(
          center,
          radius,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2.4
            ..color = color,
        );
        canvas.drawCircle(center, width * 0.035, Paint()..color = color);
        for (var index = 0; index < 4; index += 1) {
          final angle = index * math.pi / 2;
          canvas.drawLine(
            Offset(
              center.dx + math.cos(angle) * radius * 1.15,
              center.dy + math.sin(angle) * radius * 1.15,
            ),
            Offset(
              center.dx + math.cos(angle) * radius * 1.55,
              center.dy + math.sin(angle) * radius * 1.55,
            ),
            Paint()
              ..strokeWidth = 2
              ..strokeCap = StrokeCap.round
              ..color = color,
          );
        }
    }
  }
}
