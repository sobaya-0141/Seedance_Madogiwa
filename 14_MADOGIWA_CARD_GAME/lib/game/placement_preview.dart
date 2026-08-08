import '../rules/game_state.dart';

enum PlacementPreviewKind {
  placement,
  claim,
  contest,
  ability;

  int get priority => switch (this) {
    PlacementPreviewKind.placement => 0,
    PlacementPreviewKind.claim => 1,
    PlacementPreviewKind.contest => 2,
    PlacementPreviewKind.ability => 3,
  };
}

class PlacementPreview {
  PlacementPreview({
    required this.cardId,
    required this.position,
    required Map<BoardPosition, PlacementPreviewKind> cells,
    required List<RowScore> projectedRowScores,
  }) : cells = Map.unmodifiable(cells),
       projectedRowScores = List.unmodifiable(projectedRowScores);

  final String cardId;
  final BoardPosition position;
  final Map<BoardPosition, PlacementPreviewKind> cells;
  final List<RowScore> projectedRowScores;

  PlacementPreviewKind? kindAt(BoardPosition position) => cells[position];
}
