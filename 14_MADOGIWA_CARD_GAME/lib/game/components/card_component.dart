import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flame/components.dart';
import 'package:flame/events.dart';

import '../../rules/card_definition.dart';
import '../../rules/game_state.dart';
import '../card_visual/izakaya_card_renderer.dart';
import '../madogiwa_grid_game.dart';

enum CardZone { hand, board }

const _cardLayoutWidth = 136.0;
const _cardLayoutHeight = 201.0;

double _layoutScaleFor(Vector2 visualSize) =>
    math.min(visualSize.x / _cardLayoutWidth, visualSize.y / _cardLayoutHeight);

class CardComponent extends PositionComponent
    with
        DragCallbacks,
        TapCallbacks,
        HoverCallbacks,
        HasGameReference<MadogiwaGridGame> {
  CardComponent({
    required this.definition,
    required this.owner,
    required this.image,
    required ui.FragmentProgram? hologramProgram,
    required Vector2 position,
    required Vector2 size,
    required this.zone,
    this.placedCard,
  }) : _targetPosition = position.clone(),
       _targetVisualSize = size.clone(),
       _targetLayoutScale = _layoutScaleFor(size),
       _hologramShader = hologramProgram?.fragmentShader(),
       super(
         position: position,
         size: Vector2(_cardLayoutWidth, _cardLayoutHeight),
         scale: Vector2.all(_layoutScaleFor(size)),
         anchor: Anchor.center,
         priority: zone == CardZone.hand ? 100 : 20,
       );

  static const _renderer = IzakayaCardRenderer();

  final CardDefinition definition;
  final PlayerSide owner;
  final ui.Image image;
  final ui.FragmentShader? _hologramShader;

  CardZone zone;
  PlacedCard? placedCard;
  Vector2 _targetPosition;
  Vector2 _targetVisualSize;
  double _targetLayoutScale;
  double _targetAngle = 0;
  double _gestureScale = 1;
  bool _selected = false;
  bool _hovered = false;
  bool _dragging = false;
  double _time = 0;
  Vector2 _pointer = Vector2.zero();

  Map<String, Object?> get debugSnapshot => {
    'id': definition.id,
    'zone': zone.name,
    'mounted': isMounted,
    'loaded': isLoaded,
    'position': {'x': position.x, 'y': position.y},
    'targetPosition': {'x': _targetPosition.x, 'y': _targetPosition.y},
    'size': {'width': width * scale.x, 'height': height * scale.y},
    'layoutSize': {'width': width, 'height': height},
    'targetSize': {'width': _targetVisualSize.x, 'height': _targetVisualSize.y},
    'layoutScale': scale.x,
    'targetLayoutScale': _targetLayoutScale,
    'angle': angle,
    'priority': priority,
    'selected': _selected,
  };

  bool get interactive =>
      zone == CardZone.hand &&
      owner == PlayerSide.player &&
      game.controller.state.currentSide == PlayerSide.player &&
      !game.controller.busy;

  void syncPlacedCard(PlacedCard? card) {
    placedCard = card;
  }

  void setSelected(bool value) {
    _selected = value;
    priority = zone == CardZone.hand
        ? value
              ? 1000
              : 100
        : 20;
  }

  void setTarget({
    required Vector2 position,
    required Vector2 size,
    required double angle,
    required CardZone targetZone,
  }) {
    _targetPosition = position.clone();
    _targetVisualSize = size.clone();
    _targetLayoutScale = _layoutScaleFor(size);
    _targetAngle = angle;
    zone = targetZone;
    priority = zone == CardZone.hand
        ? _selected
              ? 1000
              : 100
        : 20;
  }

  @override
  bool containsLocalPoint(Vector2 point) {
    return interactive && super.containsLocalPoint(point);
  }

  @override
  void onHoverEnter() {
    _hovered = true;
  }

  @override
  void onHoverExit() {
    _hovered = false;
  }

  @override
  void onHoverCancel() {
    _hovered = false;
  }

  @override
  void onTapUp(TapUpEvent event) {
    if (!interactive) {
      return;
    }
    game.controller.selectCard(
      game.controller.selectedCardId == definition.id ? null : definition.id,
    );
  }

  @override
  void onDragStart(DragStartEvent event) {
    super.onDragStart(event);
    if (!interactive) {
      return;
    }
    _dragging = true;
    _pointer = event.localPosition;
    _gestureScale = 1.1;
    angle = 0;
    priority = 1000;
    game.controller.selectCard(definition.id);
    game.previewCardAt(definition.id, position);
  }

  @override
  void onDragUpdate(DragUpdateEvent event) {
    if (!_dragging) {
      return;
    }
    position.add(event.canvasDelta);
    _pointer = event.localEndPosition;
    game.previewCardAt(definition.id, position);
  }

  @override
  void onDragEnd(DragEndEvent event) {
    super.onDragEnd(event);
    if (!_dragging) {
      return;
    }
    _dragging = false;
    _gestureScale = 1;
    priority = 100;
    game.dropCard(definition.id, position.clone());
  }

  @override
  void onDragCancel(DragCancelEvent event) {
    _dragging = false;
    super.onDragCancel(event);
    _gestureScale = 1;
    priority = _selected ? 1000 : 100;
    game.clearPlacementPreview();
  }

  @override
  void update(double dt) {
    super.update(dt);
    _time += dt;
    if (!_dragging) {
      final positionCursor = 1 - math.exp(-dt * 12);
      position.setFrom(
        position + (_effectiveTargetPosition - position) * positionCursor,
      );
      angle += (_targetAngle - angle) * positionCursor;
      final interactionScale = _selected
          ? 1.14
          : _hovered
          ? 1.08
          : 1.0;
      final desiredScale =
          _targetLayoutScale *
          _gestureScale *
          (interactive ? interactionScale : 1);
      final nextScale = scale.x + (desiredScale - scale.x) * positionCursor;
      scale.setValues(nextScale, nextScale);
    }
  }

  Vector2 get _effectiveTargetPosition {
    if (_selected && zone == CardZone.hand) {
      return _targetPosition - Vector2(0, 34);
    }
    if (_hovered && zone == CardZone.hand) {
      return _targetPosition - Vector2(0, 10);
    }
    return _targetPosition;
  }

  @override
  void render(ui.Canvas canvas) {
    final foilStrength = zone == CardZone.hand
        ? (_selected || _hovered ? 1.0 : 0.36)
        : (placedCard?.silenced ?? false ? 0.08 : 0.2);
    _renderer.render(
      canvas,
      width: width,
      height: height,
      definition: definition,
      owner: owner,
      image: image,
      hologramShader: _hologramShader,
      time: _time,
      pointer: ui.Offset(_pointer.x, _pointer.y),
      hologramIntensity: foilStrength,
      power: placedCard?.power ?? definition.power,
      showDetails: zone == CardZone.hand,
      silenced: placedCard?.silenced ?? false,
    );
  }

  @override
  void onRemove() {
    _hologramShader?.dispose();
    super.onRemove();
  }
}
