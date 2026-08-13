import 'package:flutter/material.dart';

import '../../rules/card_definition.dart';
import '../../rules/game_state.dart';

class HeritageCardTheme {
  const HeritageCardTheme({
    required this.accent,
    required this.side,
    required this.seal,
  });

  factory HeritageCardTheme.from({
    required CardDefinition definition,
    required PlayerSide owner,
  }) {
    final accent = Color(definition.accentArgb);
    final side = owner == PlayerSide.player
        ? const Color(0xFF45DDF4)
        : const Color(0xFFFF697F);
    return HeritageCardTheme(
      accent: accent,
      side: side,
      seal: Color.lerp(const Color(0xFF9B2E22), accent, 0.22)!,
    );
  }

  final Color accent;
  final Color side;
  final Color seal;

  static const indigo = Color(0xFF091827);
  static const deepIndigo = Color(0xFF06101B);
  static const fabric = Color(0xFF0D2235);
  static const gold = Color(0xFFD7AF5A);
  static const brightGold = Color(0xFFF1D98A);
  static const washi = Color(0xFFF0DFB7);
  static const washiShadow = Color(0xFFB99258);
  static const ink = Color(0xFF12161A);
}
