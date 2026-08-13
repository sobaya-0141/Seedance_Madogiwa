import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:madogiwa_voxel_mobile/game/madogiwa_voxel_game.dart';
import 'package:madogiwa_voxel_mobile/ui/mobile_game_hud.dart';

class MadogiwaVoxelApp extends StatelessWidget {
  const MadogiwaVoxelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: '窓際ボクセル・退勤作戦',
      theme: ThemeData(
        brightness: Brightness.light,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2BC9B0),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const _GameScreen(),
    );
  }
}

class _GameScreen extends StatelessWidget {
  const _GameScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFCEEFF4),
      body: ClipRect(
        child: GameWidget<MadogiwaVoxelGame>.controlled(
          gameFactory: MadogiwaVoxelGame.new,
          initialActiveOverlays: const [MadogiwaVoxelGame.hudOverlay],
          loadingBuilder: (context) => const _LoadingView(),
          errorBuilder: (context, error) => _ErrorView(error: error),
          overlayBuilderMap: {
            MadogiwaVoxelGame.hudOverlay: (context, game) => MobileGameHud(
              stateListenable: game.hudState,
              effectsController: game.effects,
              onMove: game.setMoveInput,
              onAction: game.primaryAction,
              onRestart: game.resetLevel,
            ),
          },
        ),
      ),
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFFEAF7F6),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.82, end: 1),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOutBack,
              builder: (context, value, child) =>
                  Transform.scale(scale: value, child: child),
              child: Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: SweepGradient(
                    colors: [
                      Color(0x0055D9FF),
                      Color(0xFF55D9FF),
                      Color(0xFF62FFB0),
                      Color(0xFFB5A4FF),
                      Color(0xFFFF8E75),
                      Color(0x0055D9FF),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(color: Color(0x5555D9FF), blurRadius: 24),
                  ],
                ),
                padding: const EdgeInsets.all(2),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFFF8FFFE),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.view_in_ar_rounded,
                    color: Color(0xFF176E83),
                    size: 30,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'VOXEL // SHIFT',
              style: TextStyle(
                color: Color(0xFF153B57),
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.2,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'INITIALIZING FLUTTER GPU PIPELINE',
              style: TextStyle(
                color: Color(0xFF5C7A8B),
                fontSize: 8,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.7,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFFFFF1EF),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                size: 42,
                color: Color(0xFFD94F43),
              ),
              const SizedBox(height: 12),
              const Text(
                'Flame 3Dの初期化に失敗しました',
                style: TextStyle(
                  color: Color(0xFF153B57),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF5D7180)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
