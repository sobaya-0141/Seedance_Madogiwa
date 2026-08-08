import 'dart:ui';

import 'package:flame/components.dart';

class BackdropComponent extends PositionComponent {
  BackdropComponent() : super(priority: -100);

  @override
  void render(Canvas canvas) {
    final bounds = Offset.zero & Size(width, height);
    canvas.drawRect(
      bounds,
      Paint()
        ..shader = Gradient.linear(
          Offset.zero,
          Offset(width, height),
          const [Color(0xFF07101D), Color(0xFF101F34), Color(0xFF08101B)],
          const [0, 0.55, 1],
        ),
    );

    final glowPaint = Paint()
      ..shader = Gradient.radial(
        Offset(width * 0.5, height * 0.38),
        width * 0.58,
        const [Color(0x3357E6FF), Color(0x0008121F)],
      );
    canvas.drawRect(bounds, glowPaint);

    final windowPaint = Paint()
      ..color = const Color(0x1856C9E8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final windowTop = height * 0.1;
    final windowBottom = height * 0.74;
    for (var index = 0; index <= 8; index += 1) {
      final x = width * index / 8;
      canvas.drawLine(
        Offset(x, windowTop),
        Offset(x, windowBottom),
        windowPaint,
      );
    }
    for (var index = 0; index <= 5; index += 1) {
      final y = windowTop + (windowBottom - windowTop) * index / 5;
      canvas.drawLine(Offset(0, y), Offset(width, y), windowPaint);
    }

    final floorPaint = Paint()
      ..color = const Color(0x1879E6FF)
      ..strokeWidth = 1;
    final horizon = height * 0.73;
    for (var index = -6; index <= 6; index += 1) {
      canvas.drawLine(
        Offset(width * 0.5, horizon),
        Offset(width * (0.5 + index * 0.15), height),
        floorPaint,
      );
    }
    for (var index = 0; index < 5; index += 1) {
      final t = index / 5;
      final y = horizon + (height - horizon) * t * t;
      canvas.drawLine(
        Offset.zero.translate(0, y),
        Offset(width, y),
        floorPaint,
      );
    }

    final lanternPaint = Paint()
      ..color = const Color(0xFFFF675F)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
    canvas.drawCircle(Offset(width * 0.08, height * 0.16), 9, lanternPaint);
    canvas.drawCircle(Offset(width * 0.92, height * 0.16), 9, lanternPaint);
  }
}
