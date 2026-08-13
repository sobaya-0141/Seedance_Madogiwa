import 'package:flame_3d/core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_voxel_mobile/game/game_effects_controller.dart';
import 'package:madogiwa_voxel_mobile/game/game_hud_state.dart';
import 'package:madogiwa_voxel_mobile/ui/mobile_game_hud.dart';

void main() {
  testWidgets('HUD forwards smash and movement controls', (tester) async {
    final state = ValueNotifier(const GameHudState.initial());
    final effects = GameEffectsController()..introProgress = 1;
    var smashCount = 0;
    final moves = <Vector2>[];

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MobileGameHud(
            stateListenable: state,
            effectsController: effects,
            onMove: moves.add,
            onAction: () => smashCount += 1,
            onRestart: () {},
          ),
        ),
      ),
    );

    expect(find.text('1F // OFFICE ATRIUM'), findsOneWidget);
    expect(find.text('SMASH'), findsOneWidget);
    await tester.tap(find.byKey(const Key('primary-action-button')));
    expect(smashCount, 1);

    final stick = find.byKey(const Key('virtual-stick'));
    final center = tester.getCenter(stick);
    final gesture = await tester.startGesture(center);
    await gesture.moveBy(const Offset(36, -28));
    await tester.pump();
    await gesture.up();
    await tester.pump();

    expect(moves.any((value) => value.length2 > 0.1), isTrue);
    expect(moves.last, Vector2.zero());

    state.value = const GameHudState(
      phase: GamePhase.playing,
      floorCode: '2F',
      floorTitle: 'WINDOW-SIDE LOUNGE',
      floorIndex: 2,
      totalFloors: 2,
      objectiveProgress: 3,
      objectiveTotal: 3,
      objectiveLabel: 'COLLECT DIY PARTS',
      actionLabel: 'DASH',
      message: '窓際ゲートへ向かおう',
      clearTitle: '立ち飲み処オープン！',
      transitionTitle: '2F // WINDOW-SIDE LOUNGE',
      elapsedSeconds: 8.2,
      stylePoints: 600,
      flow: 3,
      rank: '—',
      attractMode: false,
    );
    await tester.pump(const Duration(milliseconds: 210));
    expect(find.text('DASH'), findsOneWidget);
    expect(find.text('2F // WINDOW-SIDE LOUNGE'), findsOneWidget);
    state.value = const GameHudState.initial();
    await tester.pump(const Duration(milliseconds: 210));
    expect(tester.takeException(), isNull);

    await tester.pumpWidget(const SizedBox.shrink());
    state.dispose();
    effects.dispose();
  });

  testWidgets('HUD shows the clear banner and restart action', (tester) async {
    final state = ValueNotifier(
      const GameHudState(
        phase: GamePhase.cleared,
        floorCode: '2F',
        floorTitle: 'WINDOW-SIDE LOUNGE',
        floorIndex: 2,
        totalFloors: 2,
        objectiveProgress: 3,
        objectiveTotal: 3,
        objectiveLabel: 'COLLECT DIY PARTS',
        actionLabel: 'DASH',
        message: '新しい立ち飲み処が開店しました',
        clearTitle: '立ち飲み処オープン！',
        transitionTitle: '2F // WINDOW-SIDE LOUNGE',
        elapsedSeconds: 16.4,
        stylePoints: 600,
        flow: 3,
        rank: 'S',
        attractMode: false,
      ),
    );
    final effects = GameEffectsController()..introProgress = 1;
    var restarted = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MobileGameHud(
            stateListenable: state,
            effectsController: effects,
            onMove: (_) {},
            onAction: () {},
            onRestart: () => restarted = true,
          ),
        ),
      ),
    );

    expect(find.text('立ち飲み処オープン！'), findsOneWidget);
    await tester.tap(find.byKey(const Key('restart-button')));
    expect(restarted, isTrue);
    await tester.pumpWidget(const SizedBox.shrink());
    state.dispose();
    effects.dispose();
  });

  testWidgets('HUD presents an elevator transition between floors', (
    tester,
  ) async {
    final state = ValueNotifier(
      const GameHudState(
        phase: GamePhase.transitioning,
        floorCode: '1F',
        floorTitle: 'OFFICE ATRIUM',
        floorIndex: 1,
        totalFloors: 2,
        objectiveProgress: 3,
        objectiveTotal: 3,
        objectiveLabel: 'CLEAR THE ROUTE',
        actionLabel: 'SMASH',
        message: 'エレベーターで2Fへ移動中',
        clearTitle: '立ち飲み処オープン！',
        transitionTitle: '2F // WINDOW-SIDE LOUNGE',
        elapsedSeconds: 18.2,
        stylePoints: 600,
        flow: 0,
        rank: '—',
        attractMode: false,
      ),
    );
    final effects = GameEffectsController()..introProgress = 1;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MobileGameHud(
            stateListenable: state,
            effectsController: effects,
            onMove: (_) {},
            onAction: () {},
            onRestart: () {},
          ),
        ),
      ),
    );

    expect(find.text('FLOOR TRANSFER'), findsOneWidget);
    expect(find.text('2F // WINDOW-SIDE LOUNGE'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    state.dispose();
    effects.dispose();
  });
}
