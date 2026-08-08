import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../game/card_visual/heritage_card_theme.dart';
import '../harness/harness_screen.dart';
import '../rules/ai_player.dart';
import '../rules/card_definition.dart';
import '../rules/game_state.dart';
import 'game_screen.dart';

class TitleScreen extends StatelessWidget {
  const TitleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final showHarness =
        kDebugMode || Uri.base.queryParameters.containsKey('harness');
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const _TitleBackdrop(),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxHeight < 700;
                return Column(
                  children: [
                    SizedBox(height: compact ? 18 : 34),
                    const Text(
                      'MADOGIWA',
                      style: TextStyle(
                        color: Color(0xFFFFE19A),
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 7,
                      ),
                    ),
                    Text(
                      'GRID',
                      style: TextStyle(
                        color: const Color(0xFFF4FAFF),
                        fontSize: compact ? 52 : 66,
                        height: 0.95,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 8,
                        shadows: const [
                          Shadow(color: Color(0xAA42DFF8), blurRadius: 26),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      '窓際を制する、3 × 5 タクティカルカードバトル',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFFB9CAD8),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                    Expanded(child: _HeroCards(compact: compact)),
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        22,
                        8,
                        22,
                        compact ? 16 : 28,
                      ),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 420),
                        child: Column(
                          children: [
                            SizedBox(
                              width: double.infinity,
                              height: 54,
                              child: FilledButton.icon(
                                key: const ValueKey('start_normal'),
                                onPressed: () =>
                                    _start(context, AiDifficulty.normal),
                                style: FilledButton.styleFrom(
                                  backgroundColor: const Color(0xFF56DDF5),
                                  foregroundColor: const Color(0xFF06111D),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                ),
                                icon: const Icon(Icons.auto_awesome_rounded),
                                label: const Text(
                                  'AI対戦をはじめる',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 9),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    key: const ValueKey('start_hard'),
                                    onPressed: () =>
                                        _start(context, AiDifficulty.hard),
                                    icon: const Icon(
                                      Icons.psychology_alt_outlined,
                                      size: 18,
                                    ),
                                    label: const Text('HARD AI'),
                                  ),
                                ),
                                if (showHarness) ...[
                                  const SizedBox(width: 9),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      key: const ValueKey('open_harness'),
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute<void>(
                                            builder: (_) =>
                                                const HarnessScreen(),
                                          ),
                                        );
                                      },
                                      icon: const Icon(
                                        Icons.science_outlined,
                                        size: 18,
                                      ),
                                      label: const Text('HARNESS'),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _start(BuildContext context, AiDifficulty difficulty) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => GameScreen(aiDifficulty: difficulty),
      ),
    );
  }
}

class _HeroCards extends StatefulWidget {
  const _HeroCards({required this.compact});

  final bool compact;

  @override
  State<_HeroCards> createState() => _HeroCardsState();
}

class _HeroCardsState extends State<_HeroCards>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final wave = math.sin(_controller.value * math.pi * 2);
        final cardWidth = widget.compact ? 122.0 : 146.0;
        return Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            Transform.translate(
              offset: Offset(-cardWidth * 0.72, 10 + wave * 4),
              child: Transform.rotate(
                angle: -0.18,
                child: _HeroCard(
                  width: cardWidth,
                  definition: CardCatalog.yametaro,
                ),
              ),
            ),
            Transform.translate(
              offset: Offset(cardWidth * 0.72, 10 - wave * 4),
              child: Transform.rotate(
                angle: 0.18,
                child: _HeroCard(
                  width: cardWidth,
                  definition: CardCatalog.yumemin,
                ),
              ),
            ),
            Transform.translate(
              offset: Offset(0, -8 - wave.abs() * 5),
              child: _HeroCard(
                width: cardWidth * 1.08,
                definition: CardCatalog.sobaya,
                featured: true,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.width,
    required this.definition,
    this.featured = false,
  });

  final double width;
  final CardDefinition definition;
  final bool featured;

  @override
  Widget build(BuildContext context) {
    final height = width * 1.48;
    final theme = HeritageCardTheme.from(
      definition: definition,
      owner: PlayerSide.player,
    );
    return Container(
      width: width,
      height: height,
      padding: EdgeInsets.all(width * 0.04),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(width * 0.075),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFFEDB0),
            HeritageCardTheme.gold,
            Color(0xFF795221),
            HeritageCardTheme.brightGold,
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: theme.accent.withValues(alpha: featured ? 0.28 : 0.14),
            blurRadius: featured ? 34 : 18,
            spreadRadius: featured ? 3 : 0,
          ),
          const BoxShadow(
            color: Color(0xB3000000),
            blurRadius: 16,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(width * 0.052),
        child: Stack(
          children: [
            const Positioned.fill(
              child: ColoredBox(color: HeritageCardTheme.indigo),
            ),
            Positioned(
              left: width * 0.025,
              right: width * 0.025,
              top: width * 0.025,
              height: height * 0.565,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(width * 0.025),
                child: Image.asset(
                  'assets/${definition.artAsset}',
                  fit: BoxFit.cover,
                  alignment: Alignment(
                    0,
                    ((definition.artFocusY - 0.5) * 2).clamp(-1, 1),
                  ),
                ),
              ),
            ),
            Positioned(
              left: width * 0.025,
              right: width * 0.025,
              top: width * 0.025,
              height: height * 0.565,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      const Color(0x10091827),
                      Colors.transparent,
                      HeritageCardTheme.deepIndigo.withValues(alpha: 0.74),
                    ],
                    stops: const [0, 0.62, 1],
                  ),
                ),
              ),
            ),
            Positioned(
              left: width * 0.02,
              right: width * 0.02,
              top: height * 0.56,
              height: height * 0.17,
              child: ClipPath(
                clipper: const _HeroWashiClipper(),
                child: DecoratedBox(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        HeritageCardTheme.washi,
                        Color(0xFFFFF0CB),
                        Color(0xFFD7BE8C),
                      ],
                    ),
                  ),
                  child: Padding(
                    padding: EdgeInsets.only(
                      left: width * 0.075,
                      right: width * 0.3,
                    ),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        definition.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: HeritageCardTheme.ink,
                          fontSize:
                              width *
                              (definition.name.length >= 6
                                  ? 0.075
                                  : definition.name.length >= 4
                                  ? 0.095
                                  : 0.13),
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              right: width * 0.035,
              top: height * 0.575,
              child: Container(
                width: width * 0.285,
                height: width * 0.285,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.seal,
                  border: Border.all(
                    color: HeritageCardTheme.brightGold,
                    width: width * 0.025,
                  ),
                  boxShadow: const [
                    BoxShadow(color: Color(0x99000000), blurRadius: 8),
                  ],
                ),
                child: Text(
                  '${definition.power}',
                  style: TextStyle(
                    color: const Color(0xFFFFF5D5),
                    fontSize: width * 0.155,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
            Positioned(
              left: width * 0.07,
              right: width * 0.07,
              top: height * 0.735,
              height: height * 0.075,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: HeritageCardTheme.fabric,
                  border: Border.all(color: HeritageCardTheme.gold),
                ),
                child: Center(
                  child: Text(
                    definition.epithet,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: const Color(0xFFF7ECD0),
                      fontSize: width * 0.063,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              left: width * 0.055,
              right: width * 0.055,
              top: height * 0.825,
              height: height * 0.105,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: HeritageCardTheme.washi,
                  border: Border.all(color: HeritageCardTheme.gold),
                ),
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: width * 0.11,
                    vertical: width * 0.02,
                  ),
                  child: CustomPaint(
                    painter: _HeroPatternPainter(
                      definition: definition,
                      accent: theme.seal,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              left: width * 0.08,
              right: width * 0.08,
              bottom: height * 0.012,
              height: height * 0.05,
              child: Center(
                child: Text(
                  definition.quote,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: const Color(0xFFF7ECD0),
                    fontSize: width * 0.057,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: HeritageCardTheme.brightGold,
                      width: width * 0.012,
                    ),
                    borderRadius: BorderRadius.circular(width * 0.05),
                  ),
                ),
              ),
            ),
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: const Alignment(-1.4, -1),
                      end: const Alignment(1.2, 1),
                      colors: [
                        Colors.transparent,
                        const Color(0x24FFFFFF),
                        theme.accent.withValues(alpha: 0.08),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroWashiClipper extends CustomClipper<Path> {
  const _HeroWashiClipper();

  @override
  Path getClip(Size size) {
    return Path()
      ..moveTo(0, size.height * 0.1)
      ..lineTo(size.width * 0.13, 0)
      ..lineTo(size.width * 0.31, size.height * 0.05)
      ..lineTo(size.width * 0.5, 0)
      ..lineTo(size.width, size.height * 0.08)
      ..lineTo(size.width * 0.96, size.height)
      ..lineTo(size.width * 0.65, size.height * 0.96)
      ..lineTo(size.width * 0.42, size.height)
      ..lineTo(0, size.height * 0.92)
      ..close();
  }

  @override
  bool shouldReclip(_HeroWashiClipper oldClipper) => false;
}

class _HeroPatternPainter extends CustomPainter {
  const _HeroPatternPainter({required this.definition, required this.accent});

  final CardDefinition definition;
  final Color accent;

  @override
  void paint(Canvas canvas, Size size) {
    const rows = 3;
    const columns = 5;
    final gap = size.height * 0.08;
    final tile = math.min(
      (size.width - gap * (columns - 1)) / columns,
      (size.height - gap * (rows - 1)) / rows,
    );
    final gridWidth = tile * columns + gap * (columns - 1);
    final gridHeight = tile * rows + gap * (rows - 1);
    final origin = Offset(
      (size.width - gridWidth) / 2,
      (size.height - gridHeight) / 2,
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
        final rect = Rect.fromLTWH(
          origin.dx + column * (tile + gap),
          origin.dy + row * (tile + gap),
          tile,
          tile,
        );
        final rrect = RRect.fromRectAndRadius(
          rect,
          Radius.circular(tile * 0.08),
        );
        canvas.drawRRect(
          rrect,
          Paint()
            ..color = row == 1 && column == 2
                ? HeritageCardTheme.gold
                : active.contains((row, column))
                ? accent
                : const Color(0x22091827),
        );
        canvas.drawRRect(
          rrect,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 0.7
            ..color = HeritageCardTheme.indigo,
        );
      }
    }
  }

  @override
  bool shouldRepaint(_HeroPatternPainter oldDelegate) {
    return oldDelegate.definition != definition || oldDelegate.accent != accent;
  }
}

class _TitleBackdrop extends StatelessWidget {
  const _TitleBackdrop();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _TitleBackdropPainter());
  }
}

class _TitleBackdropPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF06101C), Color(0xFF13253B), Color(0xFF07101B)],
        ).createShader(Offset.zero & size),
    );
    canvas.drawCircle(
      Offset(size.width / 2, size.height * 0.38),
      size.width * 0.62,
      Paint()
        ..shader =
            const RadialGradient(
              colors: [Color(0x3348DDF7), Color(0x0007111E)],
            ).createShader(
              Rect.fromCircle(
                center: Offset(size.width / 2, size.height * 0.38),
                radius: size.width * 0.62,
              ),
            ),
    );
    final gridPaint = Paint()
      ..color = const Color(0x174BE0F8)
      ..strokeWidth = 1;
    for (var index = 0; index <= 10; index += 1) {
      final x = size.width * index / 10;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (var index = 0; index <= 14; index += 1) {
      final y = size.height * index / 14;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
