import 'dart:async';

import 'package:flutter/foundation.dart';

import '../rules/ai_player.dart';
import '../rules/game_engine.dart';
import '../rules/game_event.dart';
import '../rules/game_state.dart';
import 'placement_preview.dart';

class GameController extends ChangeNotifier {
  GameController({
    GameState? initialState,
    this.aiEnabled = true,
    this.aiDelay = const Duration(milliseconds: 620),
    AiDifficulty aiDifficulty = AiDifficulty.normal,
    this.engine = const GameEngine(),
  }) : _initialState = initialState ?? GameState.initial(),
       _state = initialState ?? GameState.initial(),
       _ai = AiPlayer(difficulty: aiDifficulty);

  final GameEngine engine;
  final AiPlayer _ai;
  final GameState _initialState;
  final bool aiEnabled;
  final Duration aiDelay;

  GameState _state;
  GameState get state => _state;

  List<GameEvent> _lastEvents = const [];
  List<GameEvent> get lastEvents => _lastEvents;

  final List<GameEvent> _eventHistory = [];
  List<GameEvent> get eventHistory => List.unmodifiable(_eventHistory);

  String? _selectedCardId;
  String? get selectedCardId => _selectedCardId;

  bool _busy = false;
  bool get busy => _busy;

  int _revision = 0;
  int get revision => _revision;

  List<GameMove> get legalPlayerMoves =>
      engine.legalMoves(_state, PlayerSide.player);

  bool canPlayAt(String cardId, BoardPosition position) {
    return engine.isLegalMove(
      _state,
      GameMove(side: PlayerSide.player, cardId: cardId, position: position),
    );
  }

  PlacementPreview? previewPlayerMove(String cardId, BoardPosition position) {
    final move = GameMove(
      side: PlayerSide.player,
      cardId: cardId,
      position: position,
    );
    if (!engine.isLegalMove(_state, move)) {
      return null;
    }

    final outcome = engine.playCard(_state, move);
    final cells = <BoardPosition, PlacementPreviewKind>{
      position: PlacementPreviewKind.placement,
    };

    void mark(BoardPosition target, PlacementPreviewKind kind) {
      final current = cells[target];
      if (current == null || kind.priority > current.priority) {
        cells[target] = kind;
      }
    }

    for (final event in outcome.events) {
      switch (event) {
        case CellClaimedEvent():
          mark(
            event.position,
            event.previousOwner == PlayerSide.rival
                ? PlacementPreviewKind.contest
                : PlacementPreviewKind.claim,
          );
        case PowerChangedEvent():
          mark(event.position, PlacementPreviewKind.ability);
        case CardEscapedEvent():
          mark(event.from, PlacementPreviewKind.ability);
          mark(event.to, PlacementPreviewKind.ability);
        case CardBonkedEvent():
          mark(event.position, PlacementPreviewKind.ability);
        case RegulationAppliedEvent():
          mark(event.position, PlacementPreviewKind.ability);
        case CardPlayedEvent():
        case RowLeadReversedEvent():
        case TurnChangedEvent():
        case MatchEndedEvent():
          break;
      }
    }

    return PlacementPreview(
      cardId: cardId,
      position: position,
      cells: cells,
      projectedRowScores: outcome.state.rowScores,
    );
  }

  void selectCard(String? cardId) {
    if (_state.currentSide != PlayerSide.player || _busy) {
      return;
    }
    _selectedCardId = cardId;
    notifyListeners();
  }

  Future<bool> playPlayerCard(String cardId, BoardPosition position) async {
    if (_busy || _state.currentSide != PlayerSide.player) {
      return false;
    }
    final move = GameMove(
      side: PlayerSide.player,
      cardId: cardId,
      position: position,
    );
    if (!engine.isLegalMove(_state, move)) {
      return false;
    }

    _busy = true;
    _selectedCardId = null;
    _commit(engine.playCard(_state, move));
    await _runAutomatedTurns();
    _busy = false;
    notifyListeners();
    return true;
  }

  Future<bool> playSelectedAt(BoardPosition position) async {
    final cardId = _selectedCardId;
    if (cardId == null) {
      return false;
    }
    return playPlayerCard(cardId, position);
  }

  Future<void> passPlayer() async {
    if (_busy ||
        _state.phase != MatchPhase.playing ||
        _state.currentSide != PlayerSide.player) {
      return;
    }
    _busy = true;
    _selectedCardId = null;
    _commit(engine.pass(_state, PlayerSide.player));
    await _runAutomatedTurns();
    _busy = false;
    notifyListeners();
  }

  void restart() {
    _state = _initialState;
    _lastEvents = const [];
    _eventHistory.clear();
    _selectedCardId = null;
    _busy = false;
    _revision += 1;
    notifyListeners();
  }

  Future<void> _runAutomatedTurns() async {
    if (!aiEnabled) {
      return;
    }

    var safety = 0;
    while (_state.phase == MatchPhase.playing &&
        _state.currentSide == PlayerSide.rival &&
        safety < 4) {
      safety += 1;
      if (aiDelay > Duration.zero) {
        await Future<void>.delayed(aiDelay);
      }
      final move = _ai.chooseMove(_state);
      _commit(
        move == null
            ? engine.pass(_state, PlayerSide.rival)
            : engine.playCard(_state, move),
      );

      if (_state.phase == MatchPhase.playing &&
          _state.currentSide == PlayerSide.player &&
          engine.legalMoves(_state).isEmpty) {
        if (aiDelay > Duration.zero) {
          await Future<void>.delayed(aiDelay ~/ 2);
        }
        _commit(engine.pass(_state, PlayerSide.player));
      }
    }
  }

  void _commit(TurnOutcome outcome) {
    _state = outcome.state;
    _lastEvents = outcome.events;
    _eventHistory.addAll(outcome.events);
    _revision += 1;
    notifyListeners();
  }
}
