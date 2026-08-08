import 'dart:math' as math;

import 'package:flame_3d/core.dart' show Vector2;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:madogiwa_voxel_mobile/game/game_effects_controller.dart';
import 'package:madogiwa_voxel_mobile/game/game_hud_state.dart';
import 'package:madogiwa_voxel_mobile/ui/game_effects_overlay.dart';

class MobileGameHud extends StatelessWidget {
  const MobileGameHud({
    required this.stateListenable,
    required this.effectsController,
    required this.onMove,
    required this.onAction,
    required this.onRestart,
    super.key,
  });

  final ValueListenable<GameHudState> stateListenable;
  final GameEffectsController effectsController;
  final ValueChanged<Vector2> onMove;
  final VoidCallback onAction;
  final VoidCallback onRestart;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: GameEffectsOverlay(controller: effectsController),
        ),
        SafeArea(
          minimum: const EdgeInsets.all(14),
          child: ValueListenableBuilder<GameHudState>(
            valueListenable: stateListenable,
            builder: (context, state, child) {
              return Stack(
                children: [
                  Align(
                    alignment: Alignment.topLeft,
                    child: _MissionCard(state: state),
                  ),
                  Align(
                    alignment: Alignment.topRight,
                    child: _TelemetryCard(state: state),
                  ),
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _RouteProgress(state: state),
                    ),
                  ),
                  Align(
                    alignment: Alignment.bottomLeft,
                    child: VirtualStick(onChanged: onMove),
                  ),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: _SmashButton(
                      label: state.actionLabel,
                      onPressed: onAction,
                    ),
                  ),
                  if (state.isTransitioning) _FloorTransition(state: state),
                  if (state.isCleared)
                    _ClearBanner(state: state, onRestart: onRestart),
                ],
              );
            },
          ),
        ),
        _IntroBrand(controller: effectsController),
      ],
    );
  }
}

class _MissionCard extends StatelessWidget {
  const _MissionCard({required this.state});

  final GameHudState state;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 330),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(13, 11, 16, 11),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFD9FFF5), Color(0xFF8FE6DE)],
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xAA32CDB2)),
                  boxShadow: const [
                    BoxShadow(color: Color(0x4432CDB2), blurRadius: 12),
                  ],
                ),
                child: const Icon(
                  Icons.directions_run_rounded,
                  color: Color(0xFF176E83),
                  size: 21,
                ),
              ),
              const SizedBox(width: 11),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            state.attractMode
                                ? 'ATTRACT // ${state.floorCode} ${state.floorTitle}'
                                : '${state.floorCode} // ${state.floorTitle}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: state.attractMode
                                  ? const Color(0xFF1687B7)
                                  : const Color(0xFF158F7B),
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.6,
                            ),
                          ),
                        ),
                        if (state.flow > 1) ...[
                          const SizedBox(width: 8),
                          Text(
                            'FLOW ×${state.flow}',
                            style: const TextStyle(
                              color: Color(0xFFE7694C),
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      state.message,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF173A55),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TelemetryCard extends StatelessWidget {
  const _TelemetryCard({required this.state});

  final GameHudState state;

  @override
  Widget build(BuildContext context) {
    final minutes = (state.elapsedSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (state.elapsedSeconds % 60)
        .toStringAsFixed(1)
        .padLeft(4, '0');
    return _GlassPanel(
      accent: const Color(0xFF55D9FF),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _LiveDot(),
                    SizedBox(width: 5),
                    Text(
                      'FLUTTER GPU',
                      style: TextStyle(
                        color: Color(0xFF1687B7),
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '$minutes:$seconds',
                  style: const TextStyle(
                    color: Color(0xFF153B57),
                    fontSize: 18,
                    height: 1,
                    fontFeatures: [FontFeature.tabularFigures()],
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 13),
            Container(width: 1, height: 29, color: const Color(0x6655BFD9)),
            const SizedBox(width: 13),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'STYLE',
                  style: TextStyle(
                    color: Color(0xFF668091),
                    fontSize: 8,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                Text(
                  state.stylePoints.toString().padLeft(4, '0'),
                  style: const TextStyle(
                    color: Color(0xFFE9684D),
                    fontSize: 15,
                    height: 1.05,
                    fontFeatures: [FontFeature.tabularFigures()],
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LiveDot extends StatefulWidget {
  const _LiveDot();

  @override
  State<_LiveDot> createState() => _LiveDotState();
}

class _LiveDotState extends State<_LiveDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween(begin: 0.35, end: 1.0).animate(_controller),
      child: Container(
        width: 6,
        height: 6,
        decoration: const BoxDecoration(
          color: Color(0xFF62FFB0),
          shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: Color(0xAA62FFB0), blurRadius: 7)],
        ),
      ),
    );
  }
}

class _RouteProgress extends StatelessWidget {
  const _RouteProgress({required this.state});

  final GameHudState state;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  state.attractMode
                      ? 'TOUCH TO PLAY'
                      : state.exitUnlocked
                      ? 'EXIT ROUTE OPEN'
                      : state.objectiveLabel,
                  style: TextStyle(
                    color: state.exitUnlocked
                        ? const Color(0xFF128B77)
                        : const Color(0xFF58798B),
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.7,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '${state.objectiveProgress} / ${state.objectiveTotal}',
                  style: const TextStyle(
                    color: Color(0xFF153B57),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var i = 0; i < state.objectiveTotal; i++) ...[
                  AnimatedSize(
                    duration: const Duration(milliseconds: 420),
                    curve: Curves.easeOutBack,
                    child: Container(
                      width: i < state.objectiveProgress ? 42 : 30,
                      height: 3,
                      decoration: BoxDecoration(
                        color: i < state.objectiveProgress
                            ? const Color(0xFF2BCDB1)
                            : const Color(0xFFC7DDE3),
                        borderRadius: BorderRadius.circular(99),
                        boxShadow: i < state.objectiveProgress
                            ? const [
                                BoxShadow(
                                  color: Color(0x8862FFB0),
                                  blurRadius: 8,
                                ),
                              ]
                            : null,
                      ),
                    ),
                  ),
                  if (i != state.objectiveTotal - 1) const SizedBox(width: 5),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class VirtualStick extends StatefulWidget {
  const VirtualStick({required this.onChanged, super.key});

  final ValueChanged<Vector2> onChanged;

  @override
  State<VirtualStick> createState() => _VirtualStickState();
}

class _VirtualStickState extends State<VirtualStick> {
  static const double _size = 118;
  static const double _travelRadius = 39;
  Offset _knobOffset = Offset.zero;

  void _update(Offset localPosition) {
    final center = const Offset(_size / 2, _size / 2);
    var delta = localPosition - center;
    final distance = delta.distance;
    if (distance > _travelRadius) {
      delta = Offset(
        delta.dx / distance * _travelRadius,
        delta.dy / distance * _travelRadius,
      );
    }
    setState(() => _knobOffset = delta);
    widget.onChanged(
      Vector2(delta.dx / _travelRadius, delta.dy / _travelRadius),
    );
  }

  void _release() {
    setState(() => _knobOffset = Offset.zero);
    widget.onChanged(Vector2.zero());
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '移動スティック',
      child: GestureDetector(
        key: const Key('virtual-stick'),
        behavior: HitTestBehavior.opaque,
        onPanDown: (details) => _update(details.localPosition),
        onPanUpdate: (details) => _update(details.localPosition),
        onPanEnd: (_) => _release(),
        onPanCancel: _release,
        child: SizedBox.square(
          dimension: _size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: _size,
                height: _size,
                decoration: BoxDecoration(
                  gradient: const RadialGradient(
                    colors: [Color(0xD9F5FFFD), Color(0xB8BCEFE8)],
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xAA42CDBA)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x334A7180),
                      blurRadius: 18,
                      offset: Offset(0, 7),
                    ),
                  ],
                ),
              ),
              Container(
                width: 82,
                height: 82,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0x7742CDBA)),
                ),
              ),
              for (final angle in const [
                0.0,
                math.pi / 2,
                math.pi,
                math.pi * 1.5,
              ])
                Transform.translate(
                  offset: Offset(math.cos(angle) * 47, math.sin(angle) * 47),
                  child: Transform.rotate(
                    angle: angle,
                    child: const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 8,
                      color: Color(0xAA218F8A),
                    ),
                  ),
                ),
              AnimatedContainer(
                duration: const Duration(milliseconds: 80),
                transform: Matrix4.translationValues(
                  _knobOffset.dx,
                  _knobOffset.dy,
                  0,
                ),
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFD8FFF8), Color(0xFF34CDB5)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Color(0x7743D8C1), blurRadius: 14),
                    BoxShadow(
                      color: Color(0x334A7180),
                      blurRadius: 8,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.open_with_rounded,
                  color: Color(0xFF176E83),
                  size: 21,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SmashButton extends StatefulWidget {
  const _SmashButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  State<_SmashButton> createState() => _SmashButtonState();
}

class _SmashButtonState extends State<_SmashButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1150),
  )..repeat();
  bool _pressed = false;

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: widget.label,
      child: GestureDetector(
        key: const Key('primary-action-button'),
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => setState(() => _pressed = true),
        onTapCancel: () => setState(() => _pressed = false),
        onTapUp: (_) {
          setState(() => _pressed = false);
          widget.onPressed();
        },
        child: AnimatedScale(
          scale: _pressed ? 0.9 : 1,
          curve: Curves.easeOutBack,
          duration: const Duration(milliseconds: 120),
          child: SizedBox.square(
            dimension: 110,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedBuilder(
                  animation: _pulse,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: 0.86 + _pulse.value * 0.3,
                      child: Opacity(
                        opacity: 1 - _pulse.value,
                        child: Container(
                          width: 98,
                          height: 98,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFFFFB657),
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFF9373), Color(0xFFFF6048)],
                    ),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFFFF6EC),
                      width: 1.5,
                    ),
                    boxShadow: const [
                      BoxShadow(color: Color(0x88FF7357), blurRadius: 22),
                      BoxShadow(
                        color: Color(0x334F5960),
                        blurRadius: 12,
                        offset: Offset(0, 7),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.bolt_rounded,
                        color: Colors.white,
                        size: 30,
                      ),
                      Text(
                        widget.label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FloorTransition extends StatelessWidget {
  const _FloorTransition({required this.state});

  final GameHudState state;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: const Color(0xEDEAF8F7),
        child: Center(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.86, end: 1),
            duration: const Duration(milliseconds: 650),
            curve: Curves.easeOutBack,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: Opacity(opacity: value.clamp(0.0, 1.0), child: child),
            ),
            child: _GlassPanel(
              accent: const Color(0xFF7B6FE8),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(30, 20, 30, 18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.elevator_rounded,
                      color: Color(0xFF7B6FE8),
                      size: 34,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'FLOOR TRANSFER',
                      style: TextStyle(
                        color: Color(0xFF1687B7),
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.2,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      state.transitionTitle,
                      style: const TextStyle(
                        color: Color(0xFF153B57),
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 13),
                    const SizedBox(
                      width: 220,
                      child: LinearProgressIndicator(
                        minHeight: 4,
                        color: Color(0xFF7B6FE8),
                        backgroundColor: Color(0xFFD8E6EA),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ClearBanner extends StatelessWidget {
  const _ClearBanner({required this.state, required this.onRestart});

  final GameHudState state;
  final VoidCallback onRestart;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: const Color(0x99E7F7F5),
        child: Center(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.72, end: 1),
            duration: const Duration(milliseconds: 700),
            curve: Curves.easeOutBack,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: Opacity(opacity: value.clamp(0.0, 1.0), child: child),
            ),
            child: _GlassPanel(
              accent: const Color(0xFFFFC96B),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(30, 22, 30, 20),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFE1FFF6), Color(0xFF9BE8DB)],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: Color(0x8862FFB0), blurRadius: 24),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          state.rank,
                          style: const TextStyle(
                            color: Color(0xFFE9684D),
                            fontSize: 52,
                            height: 1,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 24),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'MISSION COMPLETE',
                          style: TextStyle(
                            color: Color(0xFF158F7B),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          state.clearTitle,
                          style: const TextStyle(
                            color: Color(0xFF153B57),
                            fontSize: 28,
                            height: 1.1,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 7),
                        Text(
                          '${state.elapsedSeconds.toStringAsFixed(1)} SEC  •  ${state.stylePoints} STYLE',
                          style: const TextStyle(
                            color: Color(0xFF668091),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.6,
                          ),
                        ),
                        const SizedBox(height: 14),
                        FilledButton.icon(
                          key: const Key('restart-button'),
                          onPressed: onRestart,
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF62FFB0),
                            foregroundColor: const Color(0xFF062016),
                          ),
                          icon: const Icon(Icons.replay_rounded, size: 17),
                          label: const Text(
                            'RETRY',
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _IntroBrand extends StatelessWidget {
  const _IntroBrand({required this.controller});

  final GameEffectsController controller;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: AnimatedBuilder(
          animation: controller,
          builder: (context, child) {
            final progress = controller.introProgress;
            if (progress >= 1) {
              return const SizedBox.shrink();
            }
            final fadeIn = (progress / 0.16).clamp(0.0, 1.0);
            final fadeOut = ((1 - progress) / 0.28).clamp(0.0, 1.0);
            final opacity = math.min(fadeIn, fadeOut);
            return Opacity(
              opacity: opacity,
              child: Transform.translate(
                offset: Offset(0, (1 - fadeIn) * 16),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'M A D O G I W A  / /  L A B S',
                        style: TextStyle(
                          color: Color(0xFF158F7B),
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 3.2,
                        ),
                      ),
                      const SizedBox(height: 7),
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Color(0xFF153B57), Color(0xFF1687B7)],
                        ).createShader(bounds),
                        child: const Text(
                          'VOXEL // SHIFT',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 34,
                            height: 1,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 2.4,
                            shadows: [
                              Shadow(color: Color(0x5555D9FF), blurRadius: 18),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 9),
                      const Text(
                        'REAL-TIME GLB  •  FLAME 3D  •  FLUTTER GPU',
                        style: TextStyle(
                          color: Color(0xFF668091),
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.7,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _GlassPanel extends StatelessWidget {
  const _GlassPanel({
    required this.child,
    this.accent = const Color(0xFF62FFB0),
  });

  final Widget child;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xF7FFFFFF), Color(0xEEF1FBFA)],
        ),
        border: Border.all(color: accent.withValues(alpha: 0.48)),
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          const BoxShadow(
            color: Color(0x334A7180),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
          BoxShadow(color: accent.withValues(alpha: 0.08), blurRadius: 15),
        ],
      ),
      child: child,
    );
  }
}
