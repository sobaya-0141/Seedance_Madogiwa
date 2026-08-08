import 'package:flutter/material.dart';

import 'automation/automation_state.dart';
import 'harness/harness_scenarios.dart';
import 'harness/harness_screen.dart';
import 'ui/game_screen.dart';
import 'ui/title_screen.dart';

class MadogiwaGridApp extends StatelessWidget {
  const MadogiwaGridApp({super.key});

  @override
  Widget build(BuildContext context) {
    final harnessId = Uri.base.queryParameters['harness'];
    final scenario = harnessId == null
        ? null
        : HarnessScenarios.byId(harnessId);
    final home = switch ((harnessId, scenario)) {
      ('1', _) => const HarnessScreen(),
      (_, HarnessScenario scenario) => GameScreen(
        initialState: scenario.buildState(),
        aiEnabled: scenario.aiEnabled,
        title: 'HARNESS · ${scenario.title}',
      ),
      _ => const TitleScreen(),
    };

    return MaterialApp(
      navigatorKey: MadogiwaAutomationState.navigatorKey,
      title: 'MADOGIWA GRID',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF46DDF5),
          brightness: Brightness.dark,
          primary: const Color(0xFF56E5FF),
          secondary: const Color(0xFFFFD875),
          surface: const Color(0xFF101D2D),
        ),
        scaffoldBackgroundColor: const Color(0xFF07101D),
        useMaterial3: true,
      ),
      home: home,
    );
  }
}
