import 'package:flutter_test/flutter_test.dart';
import 'package:madogiwa_grid/game/game_controller.dart';
import 'package:madogiwa_grid/game/placement_preview.dart';
import 'package:madogiwa_grid/rules/game_state.dart';

void main() {
  test(
    'preview classifies placement, claims, contests, and ability targets',
    () {
      final board = _homeBoard();
      board[_index(const BoardPosition(1, 1))] = const GridCell(
        influenceOwner: PlayerSide.player,
      );
      board[_index(const BoardPosition(1, 2))] = const GridCell(
        influenceOwner: PlayerSide.rival,
        card: PlacedCard(definitionId: 'sobaya', owner: PlayerSide.rival),
      );
      board[_index(const BoardPosition(1, 3))] = const GridCell(
        influenceOwner: PlayerSide.rival,
      );
      final controller = GameController(
        initialState: GameState.fixture(
          board: board,
          playerHand: const ['yumemin'],
        ),
        aiEnabled: false,
      );

      final preview = controller.previewPlayerMove(
        'yumemin',
        const BoardPosition(1, 1),
      );

      expect(preview, isNotNull);
      expect(
        preview!.kindAt(const BoardPosition(1, 1)),
        PlacementPreviewKind.placement,
      );
      expect(
        preview.kindAt(const BoardPosition(0, 2)),
        PlacementPreviewKind.claim,
      );
      expect(
        preview.kindAt(const BoardPosition(1, 3)),
        PlacementPreviewKind.contest,
      );
      expect(
        preview.kindAt(const BoardPosition(1, 2)),
        PlacementPreviewKind.ability,
      );
      expect(
        controller.state.cellAt(const BoardPosition(1, 2)).card?.silenced,
        isFalse,
        reason: 'Preview must not mutate the live game state.',
      );
    },
  );
}

List<GridCell> _homeBoard() {
  return List.generate(GameState.rows * GameState.columns, (index) {
    final column = index % GameState.columns;
    if (column == 0) {
      return const GridCell(influenceOwner: PlayerSide.player);
    }
    if (column == GameState.columns - 1) {
      return const GridCell(influenceOwner: PlayerSide.rival);
    }
    return const GridCell();
  });
}

int _index(BoardPosition position) =>
    position.row * GameState.columns + position.column;
