import 'game_state.dart';

sealed class GameEvent {
  const GameEvent();
}

class CardPlayedEvent extends GameEvent {
  const CardPlayedEvent({
    required this.side,
    required this.cardId,
    required this.position,
  });

  final PlayerSide side;
  final String cardId;
  final BoardPosition position;
}

class CellClaimedEvent extends GameEvent {
  const CellClaimedEvent({
    required this.position,
    required this.side,
    this.previousOwner,
  });

  final BoardPosition position;
  final PlayerSide side;
  final PlayerSide? previousOwner;
}

class PowerChangedEvent extends GameEvent {
  const PowerChangedEvent({
    required this.position,
    required this.delta,
    required this.reason,
  });

  final BoardPosition position;
  final int delta;
  final String reason;
}

class CardEscapedEvent extends GameEvent {
  const CardEscapedEvent({
    required this.side,
    required this.from,
    required this.to,
  });

  final PlayerSide side;
  final BoardPosition from;
  final BoardPosition to;
}

class CardBonkedEvent extends GameEvent {
  const CardBonkedEvent({required this.position, required this.cardId});

  final BoardPosition position;
  final String cardId;
}

class RegulationAppliedEvent extends GameEvent {
  const RegulationAppliedEvent(this.position);

  final BoardPosition position;
}

class RowLeadReversedEvent extends GameEvent {
  const RowLeadReversedEvent({
    required this.row,
    required this.previousLeader,
    required this.newLeader,
    required this.playerScore,
    required this.rivalScore,
  });

  final int row;
  final PlayerSide previousLeader;
  final PlayerSide newLeader;
  final int playerScore;
  final int rivalScore;
}

class TurnChangedEvent extends GameEvent {
  const TurnChangedEvent(this.side);

  final PlayerSide side;
}

class MatchEndedEvent extends GameEvent {
  const MatchEndedEvent(this.winner);

  final MatchWinner winner;
}

class TurnOutcome {
  const TurnOutcome({required this.state, required this.events});

  final GameState state;
  final List<GameEvent> events;
}
