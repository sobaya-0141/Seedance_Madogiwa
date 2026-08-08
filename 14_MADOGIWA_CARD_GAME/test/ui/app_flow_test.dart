import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_grid/app.dart';
import 'package:madogiwa_grid/harness/harness_screen.dart';
import 'package:madogiwa_grid/ui/game_screen.dart';

void main() {
  testWidgets('title opens a playable Flame game', (tester) async {
    await tester.pumpWidget(const MadogiwaGridApp());

    expect(find.text('MADOGIWA'), findsOneWidget);
    expect(find.byKey(const ValueKey('start_normal')), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('start_normal')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 900));

    expect(
      find.byWidgetPredicate((widget) => widget is GameWidget),
      findsOneWidget,
    );
    expect(find.textContaining('YOUR TURN'), findsOneWidget);
  });

  testWidgets('harness exposes deterministic visual scenarios', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: HarnessScreen()));

    expect(find.text('Opening Hand'), findsOneWidget);
    expect(find.text('Yametaro Escape'), findsOneWidget);
    expect(find.text('Yumemin BONK'), findsOneWidget);
    expect(find.text('All 8 Cards'), findsOneWidget);
  });

  testWidgets('a game route can replace another game route', (tester) async {
    final navigatorKey = GlobalKey<NavigatorState>();
    await tester.pumpWidget(
      MaterialApp(
        navigatorKey: navigatorKey,
        home: const GameScreen(title: 'FIRST'),
      ),
    );
    await tester.pump();

    navigatorKey.currentState!.pushAndRemoveUntil<void>(
      MaterialPageRoute<void>(
        builder: (_) => const GameScreen(title: 'SECOND'),
      ),
      (_) => false,
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('SECOND'), findsOneWidget);
  });
}
