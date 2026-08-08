import 'package:flame/game.dart';
import 'package:flutter/material.dart';

import '../automation/automation_state.dart';
import '../game/game_controller.dart';
import '../game/madogiwa_grid_game.dart';
import '../rules/ai_player.dart';
import '../rules/game_state.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({
    super.key,
    this.initialState,
    this.aiEnabled = true,
    this.aiDifficulty = AiDifficulty.normal,
    this.title = 'MADOGIWA GRID',
  });

  final GameState? initialState;
  final bool aiEnabled;
  final AiDifficulty aiDifficulty;
  final String title;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late final GameController _controller;
  late final MadogiwaGridGame _game;

  @override
  void initState() {
    super.initState();
    _controller = GameController(
      initialState: widget.initialState,
      aiEnabled: widget.aiEnabled,
      aiDifficulty: widget.aiDifficulty,
    );
    _game = MadogiwaGridGame(controller: _controller);
    MadogiwaAutomationState.attach(controller: _controller, game: _game);
  }

  @override
  void dispose() {
    MadogiwaAutomationState.detach(_game);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF07101D),
      body: SafeArea(
        child: Stack(
          fit: StackFit.expand,
          children: [
            GameWidget(game: _game),
            _GameHud(
              controller: _controller,
              title: widget.title,
              onExit: () => Navigator.of(context).maybePop(),
              onShowRules: () => _showRules(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _GameHud extends StatelessWidget {
  const _GameHud({
    required this.controller,
    required this.title,
    required this.onExit,
    required this.onShowRules,
  });

  final GameController controller;
  final String title;
  final VoidCallback onExit;
  final VoidCallback onShowRules;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        final state = controller.state;
        return Stack(
          fit: StackFit.expand,
          children: [
            Positioned(
              left: 10,
              right: 10,
              top: 8,
              child: Row(
                children: [
                  _GlassIconButton(
                    key: const ValueKey('game_back'),
                    icon: Icons.arrow_back_rounded,
                    tooltip: '戻る',
                    onPressed: onExit,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: IgnorePointer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFFF7FBFF),
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.3,
                            ),
                          ),
                          Text(
                            state.currentSide == PlayerSide.player
                                ? 'YOUR TURN · TURN ${state.turn}'
                                : 'RIVAL THINKING · TURN ${state.turn}',
                            style: TextStyle(
                              color: state.currentSide == PlayerSide.player
                                  ? const Color(0xFF56E5FF)
                                  : const Color(0xFFFF788E),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  _GlassIconButton(
                    key: const ValueKey('game_rules'),
                    icon: Icons.help_outline_rounded,
                    tooltip: 'ルール',
                    onPressed: onShowRules,
                  ),
                  const SizedBox(width: 6),
                  _GlassIconButton(
                    key: const ValueKey('game_pass'),
                    icon: Icons.flag_outlined,
                    tooltip: 'パス',
                    onPressed:
                        state.currentSide == PlayerSide.player &&
                            state.phase == MatchPhase.playing &&
                            !controller.busy
                        ? controller.passPlayer
                        : null,
                  ),
                ],
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              top: 58,
              child: IgnorePointer(child: _ScoreStrip(state: state)),
            ),
            if (state.phase == MatchPhase.playing)
              Positioned(
                left: 0,
                right: 0,
                bottom: 5,
                child: IgnorePointer(
                  child: Center(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: const Color(0xC90A1421),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0x3359E5FF)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 5,
                        ),
                        child: Text(
                          controller.selectedCardId == null
                              ? 'カードをドラッグ、または選択してマスをタップ'
                              : 'ドラッグ予測  水色:獲得  橙:奪取  紫:能力',
                          style: const TextStyle(
                            color: Color(0xFFD8E8F5),
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            if (state.phase == MatchPhase.finished)
              Positioned.fill(
                child: _ResultOverlay(
                  state: state,
                  onReplay: controller.restart,
                  onExit: onExit,
                ),
              ),
          ],
        );
      },
    );
  }
}

class _ScoreStrip extends StatelessWidget {
  const _ScoreStrip({required this.state});

  final GameState state;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var row = 0; row < state.rowScores.length; row += 1)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xB30A1421),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0x334DDAF7)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${state.rowScores[row].player}',
                    style: const TextStyle(
                      color: Color(0xFF56E5FF),
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    child: Text(
                      'R${row + 1}',
                      style: const TextStyle(
                        color: Color(0xFF8194A8),
                        fontSize: 8,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    '${state.rowScores[row].rival}',
                    style: const TextStyle(
                      color: Color(0xFFFF788E),
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  const _GlassIconButton({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onPressed,
      tooltip: tooltip,
      visualDensity: VisualDensity.compact,
      style: IconButton.styleFrom(
        backgroundColor: const Color(0xB30A1421),
        foregroundColor: const Color(0xFFE8F7FF),
        disabledForegroundColor: const Color(0xFF506070),
        side: const BorderSide(color: Color(0x334DDAF7)),
      ),
      icon: Icon(icon, size: 19),
    );
  }
}

class _ResultOverlay extends StatelessWidget {
  const _ResultOverlay({
    required this.state,
    required this.onReplay,
    required this.onExit,
  });

  final GameState state;
  final VoidCallback onReplay;
  final VoidCallback onExit;

  @override
  Widget build(BuildContext context) {
    final (title, color) = switch (state.winner) {
      MatchWinner.player => ('VICTORY', const Color(0xFF56E5FF)),
      MatchWinner.rival => ('RIVAL WINS', const Color(0xFFFF788E)),
      MatchWinner.draw || null => ('DRAW', const Color(0xFFFFDA67)),
    };
    return ColoredBox(
      color: const Color(0xC907101D),
      child: Center(
        child: Container(
          width: 310,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xF20D1928),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: color.withValues(alpha: 0.65), width: 2),
            boxShadow: [
              BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 36),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontSize: 31,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${state.rowsWonBy(PlayerSide.player)} ROWS  —  '
                '${state.rowsWonBy(PlayerSide.rival)} ROWS',
                style: const TextStyle(
                  color: Color(0xFFC4D4E2),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 22),
              FilledButton(onPressed: onReplay, child: const Text('もう一度')),
              TextButton(onPressed: onExit, child: const Text('タイトルへ')),
            ],
          ),
        ),
      ),
    );
  }
}

void _showRules(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: const Color(0xFF101D2D),
    showDragHandle: true,
    builder: (context) {
      return const SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(24, 4, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'HOW TO PLAY',
                style: TextStyle(
                  color: Color(0xFFFFE08A),
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              SizedBox(height: 12),
              Text('① 自分色に光る空きマスへ、手札を1枚配置'),
              Text('② カードの方向パターンに沿って陣地が広がる'),
              Text('③ 3行それぞれのパワーを比較'),
              Text('④ 2行以上を制したプレイヤーの勝利'),
              SizedBox(height: 10),
              Text(
                '配置済みカードは除去されません。陣地、行への戦力配分、'
                'カードを切る順番が勝負です。',
                style: TextStyle(color: Color(0xFF9DB0C3)),
              ),
            ],
          ),
        ),
      );
    },
  );
}
