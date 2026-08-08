import 'dart:ui' as ui;

import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_grid/game/card_visual/izakaya_card_renderer.dart';
import 'package:madogiwa_grid/rules/card_definition.dart';
import 'package:madogiwa_grid/rules/game_state.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('all full-size cards render on the native Canvas backend', () async {
    final imageRecorder = ui.PictureRecorder();
    final imageCanvas = ui.Canvas(imageRecorder);
    imageCanvas.drawRect(
      const ui.Rect.fromLTWH(0, 0, 64, 64),
      ui.Paint()..color = const ui.Color(0xFFF1E5C8),
    );
    final image = await imageRecorder.endRecording().toImage(64, 64);
    addTearDown(image.dispose);

    const renderer = IzakayaCardRenderer();
    for (final definition in CardCatalog.all) {
      final cardRecorder = ui.PictureRecorder();
      final cardCanvas = ui.Canvas(cardRecorder);

      expect(
        () => renderer.render(
          cardCanvas,
          width: 136,
          height: 201,
          definition: definition,
          owner: PlayerSide.player,
          image: image,
          hologramShader: null,
          time: 0.5,
          pointer: const ui.Offset(68, 90),
          hologramIntensity: 0.4,
          power: definition.power,
          showDetails: true,
          silenced: false,
        ),
        returnsNormally,
        reason: '${definition.id} must render without a dart:ui exception',
      );
      cardRecorder.endRecording().dispose();
    }
  });
}
