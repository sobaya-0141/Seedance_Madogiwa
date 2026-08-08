import 'package:flutter/material.dart';

import '../ui/game_screen.dart';
import 'harness_scenarios.dart';

class HarnessScreen extends StatelessWidget {
  const HarnessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF07101D),
      appBar: AppBar(
        title: const Text('GAME HARNESS'),
        backgroundColor: const Color(0xFF0D1928),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(18),
        itemCount: HarnessScenarios.all.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final scenario = HarnessScenarios.all[index];
          return Card(
            color: const Color(0xFF111F31),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: const BorderSide(color: Color(0x334FDFF7)),
            ),
            child: ListTile(
              key: ValueKey('harness_${scenario.id}'),
              contentPadding: const EdgeInsets.all(16),
              leading: CircleAvatar(
                backgroundColor: const Color(0x2256E5FF),
                foregroundColor: const Color(0xFF56E5FF),
                child: Text('${index + 1}'),
              ),
              title: Text(
                scenario.title,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 5),
                child: Text(scenario.description),
              ),
              trailing: const Icon(Icons.play_arrow_rounded),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => GameScreen(
                      initialState: scenario.buildState(),
                      aiEnabled: scenario.aiEnabled,
                      title: 'HARNESS · ${scenario.title}',
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
