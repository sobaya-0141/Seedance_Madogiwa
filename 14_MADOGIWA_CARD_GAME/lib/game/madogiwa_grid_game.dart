import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flame/game.dart';
import 'package:flutter/material.dart';

import '../rules/card_definition.dart';
import '../rules/game_event.dart';
import '../rules/game_state.dart';
import 'components/backdrop_component.dart';
import 'components/battle_effect_component.dart';
import 'components/board_cell_component.dart';
import 'components/card_component.dart';
import 'components/placement_preview_marker_component.dart';
import 'components/row_reversal_effect_component.dart';
import 'components/summon_effect_component.dart';
import 'game_controller.dart';
import 'placement_preview.dart';

class MadogiwaGridGame extends FlameGame {
  MadogiwaGridGame({required this.controller});

  final GameController controller;

  final Map<BoardPosition, BoardCellComponent> _cells = {};
  final Map<String, CardComponent> _handCards = {};
  final Map<String, CardComponent> _boardCards = {};
  final Map<BoardPosition, PlacementPreviewMarkerComponent> _previewMarkers =
      {};
  final Map<String, ui.Image> _cardImages = {};
  final BackdropComponent _backdrop = BackdropComponent();

  ui.FragmentProgram? _hologramProgram;
  PlacementPreview? _placementPreview;
  int _seenRevision = 0;
  double elapsedSeconds = 0;

  double _cellWidth = 72;
  double _cellHeight = 100;
  double _gap = 7;
  double _boardTop = 130;
  double _boardLeft = 0;
  double _handCardWidth = 92;
  double _handCardHeight = 136;

  @override
  Color backgroundColor() => const Color(0xFF07101D);

  @override
  Future<void> onLoad() async {
    images.prefix = 'assets/';
    final loadedImages = await images.loadAll(
      CardCatalog.all.map((card) => card.artAsset).toList(),
    );
    for (var index = 0; index < CardCatalog.all.length; index += 1) {
      _cardImages[CardCatalog.all[index].id] = loadedImages[index];
    }
    try {
      _hologramProgram = await ui.FragmentProgram.fromAsset(
        'assets/shaders/hologram.frag',
      );
    } on Object catch (error) {
      debugPrint(
        'Hologram shader unavailable; using gradient fallback: $error',
      );
    }

    add(_backdrop);
    for (var row = 0; row < GameState.rows; row += 1) {
      for (var column = 0; column < GameState.columns; column += 1) {
        final position = BoardPosition(row, column);
        final cell = BoardCellComponent(boardPosition: position);
        _cells[position] = cell;
        add(cell);
      }
    }
    controller.addListener(_onControllerChanged);
    _seenRevision = controller.revision;
    _layout();
    _syncState(playEvents: false);
  }

  @override
  void onGameResize(Vector2 size) {
    super.onGameResize(size);
    _layout();
    if (_cells.isNotEmpty) {
      _syncState(playEvents: false);
    }
  }

  @override
  void update(double dt) {
    elapsedSeconds += dt;
    super.update(dt);
  }

  void dropCard(String cardId, Vector2 canvasPosition) {
    final target = boardPositionAt(canvasPosition);
    clearPlacementPreview();
    if (target != null && controller.canPlayAt(cardId, target)) {
      unawaited(controller.playPlayerCard(cardId, target));
    }
  }

  void playSelectedAt(BoardPosition position) {
    unawaited(controller.playSelectedAt(position));
  }

  BoardPosition? boardPositionAt(Vector2 canvasPosition) {
    for (final entry in _cells.entries) {
      final cell = entry.value;
      final delta = canvasPosition - cell.position;
      if (delta.x.abs() <= cell.width / 2 && delta.y.abs() <= cell.height / 2) {
        return entry.key;
      }
    }
    return null;
  }

  void previewCardAt(String cardId, Vector2 canvasPosition) {
    final target = boardPositionAt(canvasPosition);
    _setPlacementPreview(
      target == null ? null : controller.previewPlayerMove(cardId, target),
    );
  }

  void previewSelectedAt(BoardPosition position) {
    final cardId = controller.selectedCardId;
    if (cardId == null) {
      return;
    }
    _setPlacementPreview(controller.previewPlayerMove(cardId, position));
  }

  void clearPlacementPreview([BoardPosition? onlyIfPosition]) {
    if (onlyIfPosition != null &&
        _placementPreview?.position != onlyIfPosition) {
      return;
    }
    _setPlacementPreview(null);
  }

  void _setPlacementPreview(PlacementPreview? preview) {
    if (_placementPreview?.cardId == preview?.cardId &&
        _placementPreview?.position == preview?.position) {
      return;
    }
    _placementPreview = preview;
    _syncCellVisuals();
  }

  void _onControllerChanged() {
    final shouldPlayEvents = _seenRevision != controller.revision;
    if (shouldPlayEvents ||
        _placementPreview?.cardId != controller.selectedCardId) {
      _placementPreview = null;
    }
    _seenRevision = controller.revision;
    _syncState(playEvents: shouldPlayEvents);
  }

  void _layout() {
    if (size.x <= 0 || size.y <= 0) {
      return;
    }
    _backdrop
      ..position = Vector2.zero()
      ..size = size.clone();

    _gap = size.x < 480 ? 5 : 8;
    final widthLimited =
        (size.x - 26 - _gap * (GameState.columns - 1)) / GameState.columns;
    final heightBudget = math.max(230.0, size.y * 0.48);
    final heightLimited =
        (heightBudget - _gap * (GameState.rows - 1)) / GameState.rows * 0.72;
    _cellWidth = math.min(102, math.min(widthLimited, heightLimited));
    _cellHeight = _cellWidth / 0.72;
    final boardWidth =
        _cellWidth * GameState.columns + _gap * (GameState.columns - 1);
    final boardHeight =
        _cellHeight * GameState.rows + _gap * (GameState.rows - 1);
    _boardLeft = (size.x - boardWidth) / 2;
    final availableTop = size.y < 620 ? 88.0 : 112.0;
    final handReserve = math.min(190.0, size.y * 0.24);
    _boardTop = math.max(
      availableTop,
      availableTop +
          math.max(0, size.y - availableTop - handReserve - boardHeight) * 0.42,
    );

    for (final entry in _cells.entries) {
      final position = entry.key;
      entry.value
        ..position = cellCenter(position)
        ..size = Vector2(_cellWidth, _cellHeight);
    }

    // The hand is the showcase zone. CardComponent renders a fixed 136x201
    // layout and treats these dimensions only as its target display scale.
    _handCardWidth = math.min(136, math.max(88, size.x / 3.55));
    _handCardHeight = _handCardWidth * 1.48;
  }

  Vector2 cellCenter(BoardPosition position) {
    return Vector2(
      _boardLeft + position.column * (_cellWidth + _gap) + _cellWidth / 2,
      _boardTop + position.row * (_cellHeight + _gap) + _cellHeight / 2,
    );
  }

  Map<String, Object?> get debugSnapshot => {
    'canvas': {'width': size.x, 'height': size.y},
    'board': {
      'left': _boardLeft,
      'top': _boardTop,
      'cellWidth': _cellWidth,
      'cellHeight': _cellHeight,
      'gap': _gap,
    },
    'handCardSize': {'width': _handCardWidth, 'height': _handCardHeight},
    'trackedHandCards': [
      for (final card in _handCards.values) card.debugSnapshot,
    ],
    'trackedBoardCards': [
      for (final card in _boardCards.values) card.debugSnapshot,
    ],
  };

  void _syncState({required bool playEvents}) {
    if (_cells.isEmpty) {
      return;
    }
    final state = controller.state;
    final selected = controller.selectedCardId;

    _syncCellVisuals();

    final desiredBoardKeys = <String>{};
    for (var row = 0; row < GameState.rows; row += 1) {
      for (var column = 0; column < GameState.columns; column += 1) {
        final position = BoardPosition(row, column);
        final placed = state.cellAt(position).card;
        if (placed == null) {
          continue;
        }
        final key = _cardKey(placed.owner, placed.definitionId);
        desiredBoardKeys.add(key);
        var component = _boardCards[key];
        component ??= _handCards.remove(key);
        if (component == null) {
          component = _createCard(
            cardId: placed.definitionId,
            owner: placed.owner,
            zone: CardZone.board,
            position: placed.owner == PlayerSide.player
                ? Vector2(size.x * 0.5, size.y - 48)
                : Vector2(size.x * 0.5, 46),
            visualSize: Vector2(_cellWidth * 0.82, _cellHeight * 0.82),
            placedCard: placed,
          );
          add(component);
        }
        _boardCards[key] = component;
        component
          ..syncPlacedCard(placed)
          ..setSelected(false)
          ..setTarget(
            position: cellCenter(position),
            size: Vector2(_cellWidth * 0.86, _cellHeight * 0.86),
            angle: 0,
            targetZone: CardZone.board,
          );
      }
    }

    final removedBoardKeys = _boardCards.keys
        .where((key) => !desiredBoardKeys.contains(key))
        .toList();
    for (final key in removedBoardKeys) {
      _boardCards.remove(key)?.removeFromParent();
    }

    final desiredHandKeys = <String>{};
    final hand = state.playerHand;
    final fanSpan = math.min(0.62, math.max(0.0, (hand.length - 1) * 0.16));
    final fanRadius = math.min(360.0, math.max(250.0, size.x * 0.88));
    final baseY = size.y - _handCardHeight * 0.58 - 18;
    for (var index = 0; index < hand.length; index += 1) {
      final cardId = hand[index];
      final key = _cardKey(PlayerSide.player, cardId);
      desiredHandKeys.add(key);
      final fanAngle = hand.length <= 1
          ? 0.0
          : -fanSpan / 2 + fanSpan * index / (hand.length - 1);
      final target = Vector2(
        size.x / 2 + math.sin(fanAngle) * fanRadius,
        baseY + (1 - math.cos(fanAngle)) * fanRadius * 0.34,
      );
      var component = _handCards[key];
      if (component == null) {
        component = _createCard(
          cardId: cardId,
          owner: PlayerSide.player,
          zone: CardZone.hand,
          position: Vector2(size.x - 34, size.y - 42),
          visualSize: Vector2(_handCardWidth * 0.7, _handCardHeight * 0.7),
        );
        _handCards[key] = component;
        add(component);
      }
      component
        ..syncPlacedCard(null)
        ..setSelected(selected == cardId)
        ..setTarget(
          position: target,
          size: Vector2(_handCardWidth, _handCardHeight),
          angle: fanAngle * 0.76,
          targetZone: CardZone.hand,
        )
        // A selected card must clear the fan so its full heritage layout can
        // be inspected before it is placed.
        ..priority = selected == cardId ? 1000 : 100 + index;
    }

    final removedHandKeys = _handCards.keys
        .where((key) => !desiredHandKeys.contains(key))
        .toList();
    for (final key in removedHandKeys) {
      _handCards.remove(key)?.removeFromParent();
    }

    if (playEvents) {
      _playEvents(controller.lastEvents);
    }
  }

  void _syncCellVisuals() {
    if (_cells.isEmpty) {
      return;
    }
    final state = controller.state;
    final selected = controller.selectedCardId;
    for (final entry in _cells.entries) {
      final boardCell = state.cellAt(entry.key);
      entry.value.sync(
        owner: boardCell.influenceOwner,
        legal: selected != null && controller.canPlayAt(selected, entry.key),
        preview: _placementPreview?.kindAt(entry.key),
      );
    }
    _syncPreviewMarkers();
  }

  void _syncPreviewMarkers() {
    final previewCells =
        _placementPreview?.cells ??
        const <BoardPosition, PlacementPreviewKind>{};
    for (final entry in previewCells.entries) {
      final marker = _previewMarkers[entry.key];
      if (marker == null) {
        final next = PlacementPreviewMarkerComponent(
          position: cellCenter(entry.key),
          size: Vector2(_cellWidth, _cellHeight),
          kind: entry.value,
        );
        _previewMarkers[entry.key] = next;
        add(next);
      } else {
        marker.sync(
          position: cellCenter(entry.key),
          size: Vector2(_cellWidth, _cellHeight),
          kind: entry.value,
        );
      }
    }
    final removed = _previewMarkers.keys
        .where((position) => !previewCells.containsKey(position))
        .toList();
    for (final position in removed) {
      _previewMarkers.remove(position)?.removeFromParent();
    }
  }

  CardComponent _createCard({
    required String cardId,
    required PlayerSide owner,
    required CardZone zone,
    required Vector2 position,
    required Vector2 visualSize,
    PlacedCard? placedCard,
  }) {
    return CardComponent(
      definition: CardCatalog.byId(cardId),
      owner: owner,
      image: _cardImages[cardId]!,
      hologramProgram: _hologramProgram,
      position: position,
      size: visualSize,
      zone: zone,
      placedCard: placedCard,
    );
  }

  void _playEvents(List<GameEvent> events) {
    for (final event in events) {
      switch (event) {
        case CellClaimedEvent():
          _cells[event.position]?.triggerPulse();
        case CardEscapedEvent():
          add(
            BattleEffectComponent(
              position: cellCenter(event.from),
              destination: cellCenter(event.to),
              label: 'ESCAPE!',
              color: const Color(0xFFD778FF),
            ),
          );
        case CardBonkedEvent():
          add(
            BattleEffectComponent(
              position: cellCenter(event.position),
              label: 'BONK!',
              color: const Color(0xFF73C8FF),
            ),
          );
        case PowerChangedEvent():
          add(
            BattleEffectComponent(
              position: cellCenter(event.position),
              label: '${event.reason} +${event.delta}',
              color: const Color(0xFFFFE08A),
            ),
          );
        case RegulationAppliedEvent():
          add(
            BattleEffectComponent(
              position: cellCenter(event.position),
              label: 'REGULATION',
              color: const Color(0xFFFFDA67),
            ),
          );
        case CardPlayedEvent():
          add(
            SummonEffectComponent(
              position: cellCenter(event.position),
              definition: CardCatalog.byId(event.cardId),
              side: event.side,
            ),
          );
        case RowLeadReversedEvent():
          final first = cellCenter(BoardPosition(event.row, 0));
          final last = cellCenter(
            BoardPosition(event.row, GameState.columns - 1),
          );
          add(
            RowReversalEffectComponent(
              position: Vector2((first.x + last.x) / 2, first.y),
              size: Vector2(last.x - first.x + _cellWidth + 10, _cellHeight),
              event: event,
            ),
          );
        case MatchEndedEvent():
        case TurnChangedEvent():
          break;
      }
    }
  }

  static String _cardKey(PlayerSide owner, String cardId) =>
      '${owner.name}:$cardId';

  @override
  void onRemove() {
    controller.removeListener(_onControllerChanged);
    super.onRemove();
  }
}
