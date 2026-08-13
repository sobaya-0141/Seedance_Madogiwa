import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../rules/card_definition.dart';
import '../../rules/game_state.dart';
import 'heritage_card_theme.dart';

class IzakayaCardRenderer {
  const IzakayaCardRenderer();

  void render(
    ui.Canvas canvas, {
    required double width,
    required double height,
    required CardDefinition definition,
    required PlayerSide owner,
    required ui.Image image,
    required ui.FragmentShader? hologramShader,
    required double time,
    required ui.Offset pointer,
    required double hologramIntensity,
    required int power,
    required bool showDetails,
    required bool silenced,
  }) {
    final theme = HeritageCardTheme.from(definition: definition, owner: owner);
    final compact = !showDetails || height < 118;
    final bounds = ui.Rect.fromLTWH(0, 0, width, height);
    final corner = math.max(5.0, width * 0.075);
    final frame = ui.RRect.fromRectAndRadius(
      bounds,
      ui.Radius.circular(corner),
    );
    final artRect = ui.Rect.fromLTWH(
      width * 0.065,
      height * 0.04,
      width * 0.87,
      height * (compact ? 0.66 : 0.54),
    );
    final artFrame = ui.RRect.fromRectAndRadius(
      artRect,
      ui.Radius.circular(width * 0.035),
    );
    final nameTop = height * (compact ? 0.655 : 0.555);
    final nameBottom = height * (compact ? 0.965 : 0.70);
    final nameRect = ui.Rect.fromLTRB(
      width * 0.045,
      nameTop,
      width * 0.955,
      nameBottom,
    );

    _drawShadow(canvas, frame, width);
    canvas.save();
    canvas.clipRRect(frame);
    _drawBase(canvas, bounds, theme);
    _drawGoldLeaf(canvas, bounds, theme, compact);
    _drawPortrait(canvas, artFrame, image, definition.artFocusY);
    if (!compact) {
      _drawEnsoAndLantern(canvas, artRect, theme);
    }
    _drawPortraitShade(canvas, artRect);
    _drawHologram(
      canvas,
      artFrame,
      cardSize: ui.Size(width, height),
      shader: hologramShader,
      time: time,
      pointer: pointer,
      intensity: hologramIntensity,
      accent: theme.accent,
    );
    _drawWashiNamePlate(canvas, nameRect, theme);
    if (!compact) {
      _drawEpithetRibbon(canvas, width, height, definition, theme);
      _drawInformationPanel(canvas, width, height, definition, theme);
      _drawQuoteBand(canvas, width, height, definition, theme);
    }
    canvas.restore();

    _drawFrame(canvas, bounds, corner, theme, owner);
    _drawPowerSeal(canvas, width, power, theme, compact);
    _drawName(canvas, nameRect, width, definition.name, compact);

    if (silenced) {
      _drawSilenced(canvas, width, height);
    }
  }

  void _drawShadow(ui.Canvas canvas, ui.RRect frame, double width) {
    canvas.drawRRect(
      frame.shift(ui.Offset(width * 0.025, width * 0.045)),
      Paint()
        ..color = const Color(0xCC000000)
        ..maskFilter = ui.MaskFilter.blur(
          ui.BlurStyle.normal,
          math.max(3, width * 0.075),
        ),
    );
  }

  void _drawBase(ui.Canvas canvas, ui.Rect bounds, HeritageCardTheme theme) {
    canvas.drawRect(
      bounds,
      Paint()
        ..shader = ui.Gradient.linear(
          bounds.topLeft,
          bounds.bottomRight,
          [
            HeritageCardTheme.fabric,
            Color.lerp(HeritageCardTheme.indigo, theme.accent, 0.09)!,
            HeritageCardTheme.deepIndigo,
          ],
          const [0, 0.48, 1],
        ),
    );
    final weave = Paint()
      ..color = const Color(0x0DFFFFFF)
      ..strokeWidth = 0.55;
    for (var index = 0; index < 9; index += 1) {
      final y = bounds.top + bounds.height * index / 8;
      canvas.drawLine(
        ui.Offset(bounds.left, y),
        ui.Offset(bounds.right, y + bounds.width * 0.05),
        weave,
      );
    }
  }

  void _drawGoldLeaf(
    ui.Canvas canvas,
    ui.Rect bounds,
    HeritageCardTheme theme,
    bool compact,
  ) {
    final paint = Paint()
      ..color = HeritageCardTheme.gold.withValues(alpha: compact ? 0.17 : 0.34);
    final seed = theme.accent.toARGB32();
    for (var index = 0; index < (compact ? 7 : 15); index += 1) {
      final xNoise = math.sin(seed * 0.0001 + index * 8.91);
      final yNoise = math.cos(seed * 0.00013 + index * 5.37);
      final x = index.isEven
          ? bounds.right - bounds.width * (0.02 + xNoise.abs() * 0.16)
          : bounds.left + bounds.width * (0.02 + xNoise.abs() * 0.11);
      final y = bounds.top + bounds.height * (0.02 + yNoise.abs() * 0.94);
      canvas.drawCircle(
        ui.Offset(x, y),
        bounds.width * (0.007 + (index % 3) * 0.006),
        paint,
      );
    }
  }

  void _drawPortrait(
    ui.Canvas canvas,
    ui.RRect destination,
    ui.Image image,
    double focusY,
  ) {
    final destinationRect = destination.outerRect;
    final sourceAspect = image.width / image.height;
    final targetAspect = destinationRect.width / destinationRect.height;
    late ui.Rect source;
    if (sourceAspect > targetAspect) {
      final sourceWidth = image.height * targetAspect;
      source = ui.Rect.fromLTWH(
        (image.width - sourceWidth) / 2,
        0,
        sourceWidth,
        image.height.toDouble(),
      );
    } else {
      final sourceHeight = image.width / targetAspect;
      final centerY = image.height * focusY;
      final top = (centerY - sourceHeight / 2).clamp(
        0.0,
        image.height - sourceHeight,
      );
      source = ui.Rect.fromLTWH(0, top, image.width.toDouble(), sourceHeight);
    }
    canvas.save();
    canvas.clipRRect(destination);
    canvas.drawImageRect(
      image,
      source,
      destinationRect,
      Paint()..filterQuality = FilterQuality.medium,
    );
    canvas.restore();
    canvas.drawRRect(
      destination,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.2, destinationRect.width * 0.018)
        ..color = HeritageCardTheme.gold,
    );
  }

  void _drawEnsoAndLantern(
    ui.Canvas canvas,
    ui.Rect art,
    HeritageCardTheme theme,
  ) {
    final ensoCenter = ui.Offset(
      art.left + art.width * 0.16,
      art.top + art.height * 0.22,
    );
    final ensoRect = ui.Rect.fromCircle(
      center: ensoCenter,
      radius: art.width * 0.1,
    );
    canvas.drawArc(
      ensoRect,
      -math.pi * 0.15,
      math.pi * 1.72,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = art.width * 0.035
        ..strokeCap = StrokeCap.round
        ..color = HeritageCardTheme.gold.withValues(alpha: 0.34),
    );

    final lantern = ui.Rect.fromCenter(
      center: ui.Offset(
        art.right - art.width * 0.105,
        art.top + art.height * 0.19,
      ),
      width: art.width * 0.105,
      height: art.height * 0.22,
    );
    canvas.drawRRect(
      ui.RRect.fromRectAndRadius(
        lantern,
        ui.Radius.circular(lantern.width * 0.45),
      ),
      Paint()
        ..shader = ui.Gradient.linear(
          lantern.topCenter,
          lantern.bottomCenter,
          [
            const Color(0xBFFF8060),
            theme.seal.withValues(alpha: 0.82),
            const Color(0xCC4C140F),
          ],
          const [0, 0.52, 1],
        ),
    );
    final rib = Paint()
      ..color = const Color(0x55310C08)
      ..strokeWidth = 0.8;
    for (var index = 1; index < 5; index += 1) {
      final y = lantern.top + lantern.height * index / 5;
      canvas.drawLine(
        ui.Offset(lantern.left, y),
        ui.Offset(lantern.right, y),
        rib,
      );
    }
  }

  void _drawPortraitShade(ui.Canvas canvas, ui.Rect art) {
    canvas.drawRect(
      art,
      Paint()
        ..shader = ui.Gradient.linear(
          art.topCenter,
          art.bottomCenter,
          const [
            Color(0x21051320),
            Color(0x00000000),
            Color(0x16000000),
            Color(0xBA06101B),
          ],
          const [0, 0.36, 0.7, 1],
        ),
    );
  }

  void _drawHologram(
    ui.Canvas canvas,
    ui.RRect bounds, {
    required ui.Size cardSize,
    required ui.FragmentShader? shader,
    required double time,
    required ui.Offset pointer,
    required double intensity,
    required Color accent,
  }) {
    canvas.save();
    canvas.clipRRect(bounds);
    if (shader == null) {
      canvas.drawRRect(
        bounds,
        Paint()
          ..blendMode = BlendMode.plus
          ..shader = ui.Gradient.linear(
            ui.Offset(
              bounds.left + math.sin(time) * cardSize.width,
              bounds.top,
            ),
            bounds.outerRect.bottomRight,
            [
              const Color(0x003BE3FF),
              accent.withValues(alpha: intensity * 0.18),
              const Color(0x00FFE58C),
            ],
            const [0, 0.5, 1],
          ),
      );
    } else {
      shader
        ..setFloat(0, cardSize.width)
        ..setFloat(1, cardSize.height)
        ..setFloat(2, time)
        ..setFloat(3, pointer.dx)
        ..setFloat(4, pointer.dy)
        ..setFloat(5, intensity * 0.72);
      canvas.drawRRect(
        bounds,
        Paint()
          ..shader = shader
          ..blendMode = BlendMode.plus,
      );
    }
    canvas.restore();
  }

  void _drawWashiNamePlate(
    ui.Canvas canvas,
    ui.Rect rect,
    HeritageCardTheme theme,
  ) {
    final path = ui.Path()
      ..moveTo(rect.left, rect.top + rect.height * 0.1)
      ..lineTo(rect.left + rect.width * 0.12, rect.top)
      ..lineTo(rect.left + rect.width * 0.28, rect.top + rect.height * 0.05)
      ..lineTo(rect.left + rect.width * 0.46, rect.top)
      ..lineTo(rect.right, rect.top + rect.height * 0.08)
      ..lineTo(rect.right - rect.width * 0.04, rect.bottom)
      ..lineTo(rect.left + rect.width * 0.7, rect.bottom - rect.height * 0.04)
      ..lineTo(rect.left + rect.width * 0.42, rect.bottom)
      ..lineTo(rect.left, rect.bottom - rect.height * 0.07)
      ..close();
    canvas.drawPath(
      path.shift(ui.Offset(0, rect.height * 0.06)),
      Paint()..color = const Color(0x88000000),
    );
    canvas.drawPath(
      path,
      Paint()
        ..shader = ui.Gradient.linear(
          rect.topLeft,
          rect.bottomRight,
          const [HeritageCardTheme.washi, Color(0xFFFFF0CB), Color(0xFFD7BE8C)],
          const [0, 0.55, 1],
        ),
    );
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.2, rect.width * 0.012)
        ..color = theme.seal.withValues(alpha: 0.86),
    );
    final fiber = Paint()
      ..color = const Color(0x16130D08)
      ..strokeWidth = 0.6;
    for (var index = 0; index < 7; index += 1) {
      final y = rect.top + rect.height * (0.13 + index * 0.12);
      canvas.drawLine(
        ui.Offset(rect.left + rect.width * 0.04, y),
        ui.Offset(rect.right - rect.width * 0.05, y + (index.isEven ? 1 : -1)),
        fiber,
      );
    }
  }

  void _drawEpithetRibbon(
    ui.Canvas canvas,
    double width,
    double height,
    CardDefinition definition,
    HeritageCardTheme theme,
  ) {
    final rect = ui.Rect.fromLTWH(
      width * 0.08,
      height * 0.705,
      width * 0.84,
      height * 0.085,
    );
    final path = ui.Path()
      ..moveTo(rect.left + rect.width * 0.06, rect.top)
      ..lineTo(rect.right - rect.width * 0.06, rect.top)
      ..lineTo(rect.right, rect.center.dy)
      ..lineTo(rect.right - rect.width * 0.06, rect.bottom)
      ..lineTo(rect.left + rect.width * 0.06, rect.bottom)
      ..lineTo(rect.left, rect.center.dy)
      ..close();
    canvas.drawPath(path, Paint()..color = HeritageCardTheme.fabric);
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1, width * 0.012)
        ..color = HeritageCardTheme.gold,
    );
    _drawSmallFlorets(canvas, rect, theme);
    _drawText(
      canvas,
      definition.epithet,
      ui.Rect.fromLTWH(
        rect.left + rect.width * 0.21,
        rect.top,
        rect.width * 0.58,
        rect.height,
      ),
      fontSize: math.max(5.2, width * 0.074),
      weight: FontWeight.w800,
      color: const Color(0xFFF7ECD0),
      align: TextAlign.center,
      centerVertically: true,
    );
  }

  void _drawSmallFlorets(
    ui.Canvas canvas,
    ui.Rect rect,
    HeritageCardTheme theme,
  ) {
    final paint = Paint()
      ..color = Color.lerp(HeritageCardTheme.gold, theme.accent, 0.22)!;
    for (final x in [
      rect.left + rect.width * 0.13,
      rect.right - rect.width * 0.13,
    ]) {
      for (var petal = 0; petal < 5; petal += 1) {
        final angle = petal * math.pi * 2 / 5;
        canvas.drawCircle(
          ui.Offset(
            x + math.cos(angle) * rect.height * 0.13,
            rect.center.dy + math.sin(angle) * rect.height * 0.13,
          ),
          rect.height * 0.055,
          paint,
        );
      }
    }
  }

  void _drawInformationPanel(
    ui.Canvas canvas,
    double width,
    double height,
    CardDefinition definition,
    HeritageCardTheme theme,
  ) {
    final panel = ui.Rect.fromLTWH(
      width * 0.055,
      height * 0.795,
      width * 0.89,
      height * 0.135,
    );
    canvas.drawRect(
      panel,
      Paint()
        ..shader = ui.Gradient.linear(
          panel.topLeft,
          panel.bottomRight,
          const [Color(0xFFEAD7AB), Color(0xFFF5E7C7), Color(0xFFCBA86D)],
          const [0, 0.52, 1],
        ),
    );
    canvas.drawRect(
      panel,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1, width * 0.01)
        ..color = HeritageCardTheme.gold,
    );
    _drawAbilityCrest(
      canvas,
      center: ui.Offset(panel.left + panel.width * 0.13, panel.center.dy),
      radius: math.min(panel.height * 0.38, width * 0.095),
      ability: definition.ability,
      theme: theme,
    );
    _drawPattern(
      canvas,
      definition,
      theme,
      ui.Rect.fromLTWH(
        panel.left + panel.width * 0.27,
        panel.top + panel.height * 0.15,
        panel.width * 0.66,
        panel.height * 0.7,
      ),
    );
  }

  void _drawAbilityCrest(
    ui.Canvas canvas, {
    required ui.Offset center,
    required double radius,
    required CardAbility ability,
    required HeritageCardTheme theme,
  }) {
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..shader = ui.Gradient.radial(
          center,
          radius,
          [
            Color.lerp(theme.seal, const Color(0xFFFFFFFF), 0.18)!,
            theme.seal,
            HeritageCardTheme.deepIndigo,
          ],
          const [0, 0.7, 1],
        ),
    );
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1.2, radius * 0.15)
        ..color = HeritageCardTheme.gold,
    );
    final iconPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(1.2, radius * 0.16)
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = const Color(0xFFF7E7C3);
    switch (ability) {
      case CardAbility.comfort:
        for (var index = -1; index <= 1; index += 1) {
          final x = center.dx + index * radius * 0.35;
          canvas.drawArc(
            ui.Rect.fromCenter(
              center: ui.Offset(x, center.dy),
              width: radius * 0.35,
              height: radius * 1.05,
            ),
            math.pi * 0.58,
            math.pi * 0.86,
            false,
            iconPaint,
          );
        }
      case CardAbility.tentacles:
        for (var index = 0; index < 5; index += 1) {
          final angle = index * math.pi * 2 / 5;
          final end = center + ui.Offset.fromDirection(angle, radius * 0.62);
          canvas.drawLine(center, end, iconPaint);
        }
      case CardAbility.song:
        canvas.drawCircle(
          center + ui.Offset(-radius * 0.2, radius * 0.28),
          radius * 0.18,
          iconPaint,
        );
        canvas.drawLine(
          center + ui.Offset(-radius * 0.02, radius * 0.25),
          center + ui.Offset(-radius * 0.02, -radius * 0.48),
          iconPaint,
        );
        canvas.drawLine(
          center + ui.Offset(-radius * 0.02, -radius * 0.48),
          center + ui.Offset(radius * 0.45, -radius * 0.28),
          iconPaint,
        );
      case CardAbility.repair:
        final path = ui.Path()
          ..moveTo(center.dx + radius * 0.14, center.dy - radius * 0.58)
          ..lineTo(center.dx - radius * 0.24, center.dy)
          ..lineTo(center.dx + radius * 0.05, center.dy)
          ..lineTo(center.dx - radius * 0.16, center.dy + radius * 0.58)
          ..lineTo(center.dx + radius * 0.4, center.dy - radius * 0.12)
          ..lineTo(center.dx + radius * 0.08, center.dy - radius * 0.12);
        canvas.drawPath(path, iconPaint);
      case CardAbility.gyunGyun:
        final heart = ui.Path()
          ..moveTo(center.dx, center.dy + radius * 0.48)
          ..cubicTo(
            center.dx - radius,
            center.dy - radius * 0.05,
            center.dx - radius * 0.42,
            center.dy - radius * 0.68,
            center.dx,
            center.dy - radius * 0.24,
          )
          ..cubicTo(
            center.dx + radius * 0.42,
            center.dy - radius * 0.68,
            center.dx + radius,
            center.dy - radius * 0.05,
            center.dx,
            center.dy + radius * 0.48,
          );
        canvas.drawPath(heart, iconPaint);
      case CardAbility.escape:
        for (var index = -1; index <= 1; index += 1) {
          final x = center.dx + index * radius * 0.28;
          canvas.drawLine(
            ui.Offset(x - radius * 0.2, center.dy - radius * 0.28),
            ui.Offset(x + radius * 0.1, center.dy),
            iconPaint,
          );
          canvas.drawLine(
            ui.Offset(x + radius * 0.1, center.dy),
            ui.Offset(x - radius * 0.2, center.dy + radius * 0.28),
            iconPaint,
          );
        }
      case CardAbility.regulation:
        for (var index = -1; index <= 1; index += 1) {
          canvas.drawLine(
            ui.Offset(
              center.dx - radius * 0.5,
              center.dy + index * radius * 0.35,
            ),
            ui.Offset(
              center.dx + radius * 0.5,
              center.dy + index * radius * 0.35,
            ),
            iconPaint,
          );
          canvas.drawLine(
            ui.Offset(
              center.dx + index * radius * 0.35,
              center.dy - radius * 0.5,
            ),
            ui.Offset(
              center.dx + index * radius * 0.35,
              center.dy + radius * 0.5,
            ),
            iconPaint,
          );
        }
      case CardAbility.bonk:
        final star = ui.Path();
        for (var index = 0; index < 10; index += 1) {
          final angle = -math.pi / 2 + index * math.pi / 5;
          final pointRadius = index.isEven ? radius * 0.62 : radius * 0.28;
          final point = center + ui.Offset.fromDirection(angle, pointRadius);
          if (index == 0) {
            star.moveTo(point.dx, point.dy);
          } else {
            star.lineTo(point.dx, point.dy);
          }
        }
        star.close();
        canvas.drawPath(star, iconPaint);
      case CardAbility.none:
        canvas.drawCircle(center, radius * 0.22, iconPaint);
    }
  }

  void _drawPattern(
    ui.Canvas canvas,
    CardDefinition definition,
    HeritageCardTheme theme,
    ui.Rect bounds,
  ) {
    const rows = 3;
    const columns = 5;
    final gap = math.max(0.8, bounds.height * 0.06);
    final tile = math.min(
      (bounds.width - gap * (columns - 1)) / columns,
      (bounds.height - gap * (rows - 1)) / rows,
    );
    final gridWidth = tile * columns + gap * (columns - 1);
    final gridHeight = tile * rows + gap * (rows - 1);
    final origin = ui.Offset(
      bounds.left + (bounds.width - gridWidth) / 2,
      bounds.top + (bounds.height - gridHeight) / 2,
    );
    final active = <(int, int)>{
      (1, 2),
      for (final offset in definition.pattern)
        (
          (1 + offset.row).clamp(0, rows - 1).toInt(),
          (2 + offset.column).clamp(0, columns - 1).toInt(),
        ),
    };
    for (var row = 0; row < rows; row += 1) {
      for (var column = 0; column < columns; column += 1) {
        final rect = ui.Rect.fromLTWH(
          origin.dx + column * (tile + gap),
          origin.dy + row * (tile + gap),
          tile,
          tile,
        );
        final isCenter = row == 1 && column == 2;
        final isActive = active.contains((row, column));
        canvas.drawRRect(
          ui.RRect.fromRectAndRadius(
            rect,
            ui.Radius.circular(math.max(0.7, tile * 0.08)),
          ),
          Paint()
            ..color = isCenter
                ? HeritageCardTheme.gold
                : isActive
                ? theme.seal
                : const Color(0x1A0B1A29),
        );
        canvas.drawRRect(
          ui.RRect.fromRectAndRadius(
            rect,
            ui.Radius.circular(math.max(0.7, tile * 0.08)),
          ),
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = math.max(0.6, tile * 0.08)
            ..color = isActive
                ? HeritageCardTheme.indigo
                : const Color(0x55304455),
        );
      }
    }
  }

  void _drawQuoteBand(
    ui.Canvas canvas,
    double width,
    double height,
    CardDefinition definition,
    HeritageCardTheme theme,
  ) {
    final rect = ui.Rect.fromLTWH(
      width * 0.05,
      height * 0.932,
      width * 0.9,
      height * 0.055,
    );
    _drawWaves(canvas, rect, theme);
    _drawText(
      canvas,
      definition.quote,
      ui.Rect.fromLTWH(
        rect.left + rect.width * 0.12,
        rect.top,
        rect.width * 0.76,
        rect.height,
      ),
      fontSize: math.max(5.3, width * 0.065),
      weight: FontWeight.w800,
      color: const Color(0xFFF7ECD0),
      align: TextAlign.center,
      centerVertically: true,
    );
  }

  void _drawWaves(ui.Canvas canvas, ui.Rect rect, HeritageCardTheme theme) {
    final wavePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(0.8, rect.height * 0.07)
      ..color = HeritageCardTheme.gold.withValues(alpha: 0.65);
    final radius = rect.height * 0.28;
    for (final side in [-1.0, 1.0]) {
      final anchor = side < 0 ? rect.left : rect.right;
      for (var index = 0; index < 4; index += 1) {
        final center = ui.Offset(
          anchor + side * -radius * (0.5 + index * 0.72),
          rect.bottom,
        );
        canvas.drawArc(
          ui.Rect.fromCircle(center: center, radius: radius),
          math.pi,
          math.pi,
          false,
          wavePaint,
        );
      }
    }
  }

  void _drawFrame(
    ui.Canvas canvas,
    ui.Rect bounds,
    double corner,
    HeritageCardTheme theme,
    PlayerSide owner,
  ) {
    final outer = ui.RRect.fromRectAndRadius(
      bounds.deflate(widthFor(bounds, 0.014)),
      ui.Radius.circular(corner),
    );
    canvas.drawRRect(
      outer,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(2, bounds.width * 0.034)
        ..shader = ui.Gradient.linear(
          bounds.topLeft,
          bounds.bottomRight,
          const [
            Color(0xFFFFEDB0),
            HeritageCardTheme.gold,
            Color(0xFF8B652A),
            HeritageCardTheme.brightGold,
          ],
          const [0, 0.34, 0.7, 1],
        ),
    );
    final inner = ui.RRect.fromRectAndRadius(
      bounds.deflate(bounds.width * 0.052),
      ui.Radius.circular(corner * 0.55),
    );
    canvas.drawRRect(
      inner,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(0.8, bounds.width * 0.012)
        ..color = HeritageCardTheme.brightGold.withValues(alpha: 0.85),
    );
    final sideX = owner == PlayerSide.player
        ? bounds.left + bounds.width * 0.018
        : bounds.right - bounds.width * 0.018;
    canvas.drawLine(
      ui.Offset(sideX, bounds.top + corner),
      ui.Offset(sideX, bounds.bottom - corner),
      Paint()
        ..strokeWidth = math.max(1.5, bounds.width * 0.018)
        ..color = theme.side.withValues(alpha: 0.78),
    );
  }

  double widthFor(ui.Rect bounds, double factor) => bounds.width * factor;

  void _drawPowerSeal(
    ui.Canvas canvas,
    double width,
    int power,
    HeritageCardTheme theme,
    bool compact,
  ) {
    // Keep the actual score medallion close to the proportions of the
    // Izakaya Heritage concept. The previous 32–37% outer diameter crowded
    // the nameplate and could spill beyond the card frame on narrow cards.
    final radius = width * (compact ? 0.115 : 0.125);
    final center = ui.Offset(
      width * (compact ? 0.16 : 0.165),
      width * (compact ? 0.16 : 0.165),
    );
    canvas.drawCircle(
      center + ui.Offset(width * 0.012, width * 0.02),
      radius * 1.08,
      Paint()
        ..color = const Color(0x88000000)
        ..maskFilter = ui.MaskFilter.blur(
          ui.BlurStyle.normal,
          math.max(1.5, width * 0.018),
        ),
    );
    canvas.drawCircle(
      center,
      radius * 1.13,
      Paint()
        ..shader = ui.Gradient.radial(
          center,
          radius * 1.13,
          const [Color(0xFFFFE7A4), HeritageCardTheme.gold, Color(0xFF634018)],
          const [0, 0.72, 1],
        ),
    );
    canvas.drawCircle(center, radius, Paint()..color = theme.seal);
    canvas.drawCircle(
      center,
      radius * 0.82,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(1, width * 0.014)
        ..color = const Color(0x55FFF1C5),
    );
    _drawText(
      canvas,
      '$power',
      ui.Rect.fromCircle(center: center, radius: radius),
      fontSize: radius * 1.22,
      weight: FontWeight.w900,
      color: const Color(0xFFFFF5D5),
      align: TextAlign.center,
      centerVertically: true,
    );
  }

  void _drawName(
    ui.Canvas canvas,
    ui.Rect nameRect,
    double width,
    String name,
    bool compact,
  ) {
    final fontScale = switch (name.length) {
      >= 7 => compact ? 0.075 : 0.082,
      >= 5 => compact ? 0.088 : 0.098,
      >= 4 => compact ? 0.105 : 0.118,
      _ => compact ? 0.125 : 0.145,
    };
    _drawText(
      canvas,
      name,
      ui.Rect.fromLTWH(
        nameRect.left + nameRect.width * 0.08,
        nameRect.top,
        nameRect.width * 0.84,
        nameRect.height,
      ),
      fontSize: math.max(6.2, width * fontScale),
      weight: FontWeight.w900,
      color: HeritageCardTheme.ink,
      centerVertically: true,
      letterSpacing: -0.35,
    );
  }

  void _drawSilenced(ui.Canvas canvas, double width, double height) {
    final center = ui.Offset(width / 2, height * 0.38);
    canvas.drawCircle(
      center,
      width * 0.28,
      Paint()..color = const Color(0xBB07101C),
    );
    canvas.drawCircle(
      center,
      width * 0.22,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = math.max(2, width * 0.04)
        ..color = const Color(0xFF73C8FF),
    );
    canvas.drawLine(
      center - ui.Offset(width * 0.15, width * 0.15),
      center + ui.Offset(width * 0.15, width * 0.15),
      Paint()
        ..strokeWidth = math.max(2, width * 0.04)
        ..strokeCap = StrokeCap.round
        ..color = const Color(0xFF73C8FF),
    );
    _drawText(
      canvas,
      'BONK',
      ui.Rect.fromLTWH(width * 0.16, height * 0.5, width * 0.68, height * 0.12),
      fontSize: math.max(7, width * 0.12),
      weight: FontWeight.w900,
      align: TextAlign.center,
      color: const Color(0xFFFFFFFF),
    );
  }

  void _drawText(
    ui.Canvas canvas,
    String text,
    ui.Rect bounds, {
    required double fontSize,
    required FontWeight weight,
    required Color color,
    TextAlign align = TextAlign.left,
    int maxLines = 1,
    bool centerVertically = false,
    double? letterSpacing,
  }) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: weight,
          height: 1,
          letterSpacing: letterSpacing,
          shadows: color == HeritageCardTheme.ink
              ? null
              : const [Shadow(color: Color(0xC0000000), blurRadius: 3)],
        ),
      ),
      textAlign: align,
      textDirection: TextDirection.ltr,
      maxLines: maxLines,
      ellipsis: '…',
    )..layout(maxWidth: bounds.width);
    final y = centerVertically
        ? bounds.top + (bounds.height - painter.height) / 2
        : bounds.top;
    painter.paint(canvas, ui.Offset(bounds.left, y));
  }
}
