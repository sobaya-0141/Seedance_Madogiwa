import "./style.css";
import type { Action } from "./battle";
import { Session, type View } from "./net";
import { BattleScene } from "./scene";
import { UI, type Handlers } from "./ui";

const app = document.getElementById("app")!;

let session: Session | null = null;
let unsubView: (() => void) | null = null;
let currentView: View | null = null;

// Animation bookkeeping so we only play a hit once per resolved turn.
let animatedTurn = 0;
let fighterKey = "";

const handlers: Handlers = {
  onCreate: (mode, name) => startSession(Session.create(mode, name)),
  onJoin: (mode, code, name) => startSession(Session.join(mode, code, name)),
  onSelectChar: (id) => session?.selectChar(id),
  onReady: (ready) => session?.setReady(ready),
  onAction: (action: Action) => {
    const battle = currentView?.battle;
    if (battle) session?.submitAction(battle.turn, action);
  },
  onRematch: () => session?.requestRematch(),
  onExit: () => exitSession(),
};

const ui = new UI(app, handlers);
const scene = new BattleScene(ui.arena);
ui.showLobby();

function startSession(pending: Promise<Session>): void {
  pending
    .then((s) => {
      session = s;
      animatedTurn = 0;
      fighterKey = "";
      ui.resetSubmitLock();
      unsubView = s.onView((view) => handleView(view));
    })
    .catch((err) => {
      ui.showLobby(err instanceof Error ? err.message : String(err));
    });
}

function exitSession(): void {
  unsubView?.();
  unsubView = null;
  session?.dispose();
  session = null;
  currentView = null;
  ui.showLobby();
}

function handleView(view: View): void {
  currentView = view;
  ui.renderSession(view);

  const battle = view.battle;
  if (!battle) return;

  const oppRole = view.role === "host" ? "guest" : "host";
  const youId = battle.fighters[view.role].charId;
  const oppId = battle.fighters[oppRole].charId;
  const key = `${youId}:${oppId}`;

  // A fresh battle (initial or rematch) has no lastEvent yet.
  if (battle.lastEvent === null) {
    ui.resetSubmitLock();
    animatedTurn = battle.turn;
    scene.setFighters(youId, oppId);
    fighterKey = key;
  } else if (key !== fighterKey) {
    scene.setFighters(youId, oppId);
    fighterKey = key;
  }

  if (battle.turn > animatedTurn && battle.lastEvent) {
    const ev = battle.lastEvent;
    const attackerSide = ev.actor === view.role ? "you" : "opp";
    if (ev.damaged) {
      scene.playAttack(attackerSide);
      const hurtSide = ev.damaged === view.role ? "you" : "opp";
      scene.playHurt(hurtSide);
    }
    animatedTurn = battle.turn;
  }
}
