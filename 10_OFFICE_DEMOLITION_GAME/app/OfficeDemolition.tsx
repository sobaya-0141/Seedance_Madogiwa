"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  createEmptyDemolitionSave,
  DEMOLITION_LEVELS,
  formatPlayTime,
  getLevelProgress,
  MATERIAL_LABEL,
  normalizeDemolitionSave,
} from "./demolition/rules";
import type {
  DemolitionAction,
  DemolitionHud,
  DemolitionResult,
  DemolitionSave,
} from "./demolition/types";
import type {
  DemolitionWorldCallbacks,
  OfficeDemolitionWorld,
} from "./demolition/world";

type DemolitionProfile = {
  bestScore: number;
  clears: number;
  totalDestroyed: number;
};

type ProfilePayload = {
  save?: unknown;
  profile?: Partial<DemolitionProfile>;
};

const CACHE_KEY = "sobaya-office-demolition-cache-v1";

const INITIAL_HUD: DemolitionHud = {
  phase: "loading",
  level: 1,
  xp: 0,
  xpFloor: 0,
  xpCeiling: 700,
  score: 0,
  combo: 0,
  maxCombo: 0,
  chain: 0,
  destroyed: 0,
  total: 0,
  remaining: 0,
  zone: "中央執務フロア",
  material: null,
  targetName: "",
  targetTier: null,
  beer: 0,
  carriedName: null,
  goalTitle: "机上整理ラッシュ",
  goalProgress: 0,
  goalTarget: 8,
  goalComplete: false,
  districtUnlocked: false,
  cityDestroyed: 0,
  cityTotal: 187,
  giantScale: 1,
  radarActive: false,
  radarArrow: "↑",
  radarDistance: 0,
  ultimateActive: false,
  notice: "全社リノベーション業務、準備中です！",
  noticeTone: "normal",
  saveStatus: "idle",
  soundEnabled: true,
  shakeEnabled: true,
};

const EMPTY_PROFILE: DemolitionProfile = {
  bestScore: 0,
  clears: 0,
  totalDestroyed: 0,
};

function readLocalSave() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? normalizeDemolitionSave(JSON.parse(raw)) : createEmptyDemolitionSave();
  } catch {
    return createEmptyDemolitionSave();
  }
}

function cacheSave(save: DemolitionSave) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(save));
  } catch {
    // The server remains authoritative when browser storage is unavailable.
  }
}

export default function OfficeDemolition() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<OfficeDemolitionWorld | null>(null);
  const latestSaveRef = useRef<DemolitionSave>(createEmptyDemolitionSave());
  const saveRequestRef = useRef<Promise<void> | null>(null);
  const serverAvailableRef = useRef(true);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickPointerRef = useRef<number | null>(null);
  const [initialSave, setInitialSave] = useState<DemolitionSave | null>(null);
  const [profile, setProfile] = useState<DemolitionProfile>(EMPTY_PROFILE);
  const [hud, setHud] = useState<DemolitionHud>(INITIAL_HUD);
  const [worldReady, setWorldReady] = useState(false);
  const [result, setResult] = useState<DemolitionResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [shareLabel, setShareLabel] = useState("結果を共有");
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const local = readLocalSave();
      try {
        const response = await fetch("/api/demolition/profile", {
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("profile_unavailable");
        const payload = await response.json() as ProfilePayload;
        const serverSave = normalizeDemolitionSave(payload.save);
        const selected = Date.parse(serverSave.updatedAt) >= Date.parse(local.updatedAt)
          ? serverSave
          : local;
        const serverProfile: DemolitionProfile = {
          bestScore: Math.max(0, Number(payload.profile?.bestScore ?? 0)),
          clears: Math.max(0, Number(payload.profile?.clears ?? 0)),
          totalDestroyed: Math.max(0, Number(payload.profile?.totalDestroyed ?? 0)),
        };
        if (!cancelled) {
          serverAvailableRef.current = true;
          latestSaveRef.current = selected;
          setProfile(serverProfile);
          setInitialSave(selected);
        }
      } catch {
        if (!cancelled) {
          serverAvailableRef.current = false;
          latestSaveRef.current = local;
          setInitialSave(local);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSave = useCallback((save: DemolitionSave) => {
    latestSaveRef.current = save;
    cacheSave(save);
    if (saveRequestRef.current) return;
    const flush = async () => {
      let snapshot = latestSaveRef.current;
      try {
        const response = await fetch("/api/demolition/save", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (!response.ok) throw new Error("save_unavailable");
        serverAvailableRef.current = true;
        worldRef.current?.setSaveStatus("saved");
        const next = latestSaveRef.current;
        if (next.updatedAt !== snapshot.updatedAt) {
          snapshot = next;
          const followup = await fetch("/api/demolition/save", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(snapshot),
          });
          if (!followup.ok) throw new Error("save_unavailable");
        }
      } catch {
        serverAvailableRef.current = false;
        worldRef.current?.setSaveStatus("offline");
      } finally {
        saveRequestRef.current = null;
      }
    };
    saveRequestRef.current = flush();
  }, []);

  const submitClear = useCallback(async (clearResult: DemolitionResult) => {
    setResult(clearResult);
    setProfile((current) => ({
      bestScore: Math.max(current.bestScore, clearResult.score),
      clears: current.clears + 1,
      totalDestroyed: current.totalDestroyed + clearResult.destroyed,
    }));
    try {
      const response = await fetch("/api/demolition/clear", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(clearResult),
      });
      if (!response.ok) throw new Error("clear_unavailable");
      serverAvailableRef.current = true;
    } catch {
      serverAvailableRef.current = false;
      worldRef.current?.setSaveStatus("offline");
    }
  }, []);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container || !initialSave || worldRef.current) return;
    let cancelled = false;
    void import("./demolition/world").then(({ OfficeDemolitionWorld: World }) => {
      if (cancelled || worldRef.current) return;
      const callbacks: DemolitionWorldCallbacks = {
        onReady: () => setWorldReady(true),
        onHud: setHud,
        onSave: persistSave,
        onClear: (clearResult) => {
          void submitClear(clearResult);
        },
      };
      const world = new World(container, callbacks, initialSave);
      worldRef.current = world;
      if (!serverAvailableRef.current) world.setSaveStatus("offline");
    });
    return () => {
      cancelled = true;
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, [initialSave, persistSave, submitClear]);

  useEffect(() => {
    const beforeUnload = () => {
      const snapshot = worldRef.current?.getSnapshot();
      if (snapshot) cacheSave(snapshot);
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  const levelProgress = useMemo(() => getLevelProgress(hud.xp), [hud.xp]);
  const levelDefinition = DEMOLITION_LEVELS[hud.level - 1];
  const savedDestroyed = initialSave?.destroyedIds.length ?? 0;
  const hasProgress = savedDestroyed > 0 && (hud.total === 0 || savedDestroyed < hud.total);
  const canGrab = hud.level >= 2;
  const canDash = hud.level >= 3;
  const canStomp = hud.level >= 4;
  const canKanpai = hud.level >= 5 && hud.beer >= 99.5;

  const trigger = (action: DemolitionAction) => {
    worldRef.current?.trigger(action);
  };

  const startGame = () => {
    setResult(null);
    worldRef.current?.start();
  };

  const restartGame = () => {
    if (hasProgress && !window.confirm("現在の解体状況を消して、最初から始めますか？")) return;
    setResult(null);
    worldRef.current?.restart();
  };

  const toggleSound = () => {
    worldRef.current?.setSound(!hud.soundEnabled);
  };

  const toggleShake = () => {
    worldRef.current?.setShake(!hud.shakeEnabled);
  };

  const updateJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = joystickRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.32;
    const length = Math.hypot(x, y);
    if (length > max) {
      x = x / length * max;
      y = y / length * max;
    }
    setJoystick({ x, y });
    worldRef.current?.setMove(x / max, y / max);
  };

  const onJoystickDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    joystickPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateJoystick(event);
  };

  const onJoystickMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current !== event.pointerId) return;
    updateJoystick(event);
  };

  const releaseJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current !== event.pointerId) return;
    joystickPointerRef.current = null;
    setJoystick({ x: 0, y: 0 });
    worldRef.current?.setMove(0, 0);
  };

  const shareResult = async () => {
    const completed = result ?? {
      score: hud.score,
      destroyed: hud.destroyed,
      total: hud.total,
      maxCombo: hud.maxCombo,
      playSeconds: latestSaveRef.current.playSeconds,
    };
    const text = `そば屋のオフィス更地クラッシュで麻布十番まで完全更地！\nSCORE ${completed.score.toLocaleString()} / MAX COMBO ${completed.maxCombo}\n「街ごと風通しがよくなりました！快適です！」`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "そば屋のオフィス更地クラッシュ",
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setShareLabel("コピーしました！");
        window.setTimeout(() => setShareLabel("結果を共有"), 1800);
      }
    } catch {
      // Cancelling the share sheet is not an error the player needs to see.
    }
  };

  const saveLabel = hud.saveStatus === "saving"
    ? "保存中"
    : hud.saveStatus === "saved"
      ? "保存済み"
      : hud.saveStatus === "offline"
        ? "端末保存"
        : "自動保存";

  return (
    <main
      className="demolition-shell"
      aria-label="そば屋のオフィス更地クラッシュ 全破壊3Dゲーム画面"
    >
      <div ref={viewportRef} className="demolition-viewport" />

      <div className="demolition-vignette" aria-hidden="true" />
      <div className="demolition-top-glow" aria-hidden="true" />

      <header className="demolition-hud">
        <section className="permit-card" aria-label={`解体レベル ${hud.level}`}>
          <div className="permit-level">
            <span>LEVEL</span>
            <strong>{hud.level}</strong>
          </div>
          <div className="permit-copy">
            <span>{levelDefinition?.permit ?? "SOFT OFFICE"}</span>
            <strong>{levelDefinition?.title ?? "備品整理"}</strong>
            <div className="xp-track" aria-label={`経験値 ${hud.xp}`}>
              <i style={{ width: `${levelProgress.ratio * 100}%` }} />
            </div>
            <small>
              {levelProgress.next
                ? `${hud.xp.toLocaleString()} / ${hud.xpCeiling.toLocaleString()} XP`
                : "全解体許可 解放済み"}
            </small>
          </div>
        </section>

        <section className="mission-card">
          <span className="mission-kicker">CURRENT AREA</span>
          <strong>{hud.zone}</strong>
          <div className="mission-progress">
            <span>BREAK</span>
            <b>{hud.destroyed}</b>
            <i>/ {hud.total}</i>
          </div>
          <div className="overall-track">
            <i style={{ width: `${hud.total ? hud.destroyed / hud.total * 100 : 0}%` }} />
          </div>
          <small className={hud.goalComplete ? "goal-order complete" : "goal-order"}>
            <b>業務目標</b>
            {hud.goalTitle} {Math.min(hud.goalProgress, hud.goalTarget)}/{hud.goalTarget}
          </small>
          <small className={`district-order ${hud.districtUnlocked ? "unlocked" : ""}`}>
            <b>{hud.districtUnlocked ? "AZABU-JUBAN OPEN" : "NEXT SCOPE"}</b>
            {hud.districtUnlocked
              ? `街区 ${hud.cityDestroyed}/${hud.cityTotal}・巨大化 ${hud.giantScale.toFixed(1)}倍`
              : "LEVEL 3で外周壁を破壊"}
          </small>
        </section>

        <section className="score-card">
          <span>SCORE</span>
          <strong>{hud.score.toLocaleString()}</strong>
          <div>
            <small>{saveLabel}</small>
            <button type="button" onClick={toggleSound} aria-label={hud.soundEnabled ? "音を消す" : "音を出す"}>
              {hud.soundEnabled ? "SOUND ON" : "SOUND OFF"}
            </button>
            <button type="button" onClick={() => worldRef.current?.togglePause()} aria-label="一時停止">
              PAUSE
            </button>
          </div>
        </section>
      </header>

      <aside className="permit-rail" aria-label="解体許可一覧">
        {DEMOLITION_LEVELS.map((definition) => (
          <div
            key={definition.level}
            className={`permit-step ${hud.level >= definition.level ? "unlocked" : ""} ${hud.level === definition.level ? "current" : ""}`}
            style={{ "--permit-accent": definition.accent } as React.CSSProperties}
          >
            <b>{definition.level}</b>
            <span>{definition.title}</span>
          </div>
        ))}
      </aside>

      {hud.combo >= 2 && (
        <div className="combo-burst" aria-label={`${hud.combo}コンボ`}>
          <span>{hud.chain >= 3 ? `CHAIN ${hud.chain}` : "快適コンボ"}</span>
          <strong>{hud.combo}</strong>
          <i>COMBO</i>
        </div>
      )}

      {hud.ultimateActive && (
        <div className="ultimate-banner" aria-live="assertive">
          <span>超乾杯奥義</span>
          <strong>BEER BEAM</strong>
          <b>× JOKKI METEOR</b>
        </div>
      )}

      <div className={`notice-banner ${hud.noticeTone}`} aria-live="polite">
        {hud.notice && <span>{hud.notice}</span>}
      </div>

      <section className={[
        "target-card",
        hud.targetTier && hud.targetTier > hud.level ? "locked" : "",
        hud.radarActive ? "radar" : "",
      ].filter(Boolean).join(" ")}>
        {hud.targetName ? (
          <>
            <span>
              {hud.radarActive
                ? "REMAINING ASSET RADAR"
                : hud.material
                  ? MATERIAL_LABEL[hud.material]
                  : "TARGET"}
            </span>
            <strong>
              {hud.radarActive ? `${hud.radarArrow} ` : ""}
              {hud.targetName}
            </strong>
            <small>
              {hud.radarActive
                ? `最寄りの残存物まで ${Math.max(1, Math.round(hud.radarDistance))}m`
                : hud.targetTier && hud.targetTier > hud.level
                ? `LEVEL ${hud.targetTier} で解禁`
                : hud.carriedName
                  ? `${hud.carriedName}を運搬中`
                  : "破壊可能"}
            </small>
          </>
        ) : (
          <>
            <span>{hud.districtUnlocked ? "FREE DEMOLITION" : "OFFICE PHASE"}</span>
            <strong>
              {hud.districtUnlocked ? "壊せる物へ近づく" : "外周壁を破って街へ"}
            </strong>
            <small>
              {hud.districtUnlocked
                ? "終盤は残存物レーダーが自動追跡します"
                : "LEVEL 3の石膏外周壁が街への出口です"}
            </small>
          </>
        )}
      </section>

      <section className="beer-gauge" aria-label={`超乾杯ゲージ ${Math.floor(hud.beer)}パーセント`}>
        <div className="beer-glass" aria-hidden="true">
          <i style={{ height: `${hud.beer}%` }} />
          <em />
        </div>
        <div>
          <span>ULTIMATE GAUGE</span>
          <strong>{Math.floor(hud.beer)}%</strong>
          <small>
            {hud.level < 5
              ? "LEVEL 5で使用"
              : hud.beer >= 99.5
                ? "ビーム＋メテオ READY"
                : "破壊で泡を補充"}
          </small>
        </div>
      </section>

      <section className={`district-status ${hud.districtUnlocked ? "unlocked" : ""}`}>
        <span>{hud.districtUnlocked ? "AZABU-JUBAN RAMPAGE" : "OFFICE BREAKOUT"}</span>
        <strong>
          {hud.districtUnlocked
            ? `そば屋 ${hud.giantScale.toFixed(1)}×`
            : "外周壁を突破せよ"}
        </strong>
        <div>
          <i style={{
            width: `${hud.cityTotal ? hud.cityDestroyed / hud.cityTotal * 100 : 0}%`,
          }} />
        </div>
        <small>
          {hud.districtUnlocked
            ? `街区破壊 ${hud.cityDestroyed} / ${hud.cityTotal}`
            : "街へ出ると破壊するほど巨大化"}
        </small>
      </section>

      <section className="desktop-controls" aria-label="キーボード操作">
        <span><kbd>WASD</kbd> 移動</span>
        <span><kbd>SPACE</kbd> スマッシュ</span>
        <span className={canGrab ? "" : "locked"}><kbd>E</kbd> つかむ／投げる</span>
        <span className={canDash ? "" : "locked"}><kbd>SHIFT</kbd> ダッシュ</span>
        <span className={canStomp ? "" : "locked"}><kbd>Q</kbd> ストンプ</span>
        <span className={hud.level >= 5 ? "" : "locked"}><kbd>R</kbd> 超乾杯</span>
      </section>

      <section className="mobile-controls" aria-label="タッチ操作">
        <div
          ref={joystickRef}
          className="mobile-joystick"
          onPointerDown={onJoystickDown}
          onPointerMove={onJoystickMove}
          onPointerUp={releaseJoystick}
          onPointerCancel={releaseJoystick}
        >
          <i style={{ transform: `translate(${joystick.x}px, ${joystick.y}px)` }} />
          <span>MOVE</span>
        </div>
        <div className="mobile-actions">
          <button type="button" className="action-smash" onPointerDown={() => trigger("smash")}>
            <b>SMASH</b>
            <span>壊す</span>
          </button>
          <button type="button" className={!canGrab ? "locked" : ""} onPointerDown={() => trigger("grab")}>
            <b>THROW</b>
            <span>{canGrab ? "持つ／投げる" : "LV.2"}</span>
          </button>
          <button type="button" className={!canDash ? "locked" : ""} onPointerDown={() => trigger("dash")}>
            <b>DASH</b>
            <span>{canDash ? "突進" : "LV.3"}</span>
          </button>
          <button type="button" className={!canStomp ? "locked" : ""} onPointerDown={() => trigger("stomp")}>
            <b>STOMP</b>
            <span>{canStomp ? "地響き" : "LV.4"}</span>
          </button>
          <button type="button" className={`action-kanpai ${canKanpai ? "ready" : ""}`} onPointerDown={() => trigger("kanpai")}>
            <b>ULTIMATE</b>
            <span>{hud.level < 5 ? "LV.5" : `${Math.floor(hud.beer)}%`}</span>
          </button>
        </div>
      </section>

      {(!initialSave || !worldReady || hud.phase === "loading") && (
        <div className="game-overlay loading-overlay">
          <div className="loading-mark">
            <i />
            <strong>全社リノベーション準備中</strong>
            <span>STRUCTURAL CHECK</span>
          </div>
        </div>
      )}

      {worldReady && hud.phase === "briefing" && (
        <div className="game-overlay briefing-overlay">
          <section className="briefing-panel">
            <div className="briefing-kicker">MADOGIWA DEMOLITION PROJECT</div>
            <h1>
              そば屋の
              <strong>オフィス更地クラッシュ</strong>
            </h1>
            <p>
              机から外周壁を突き破り、麻布十番の街へ。壊すほど巨大化するそば屋で、
              オフィスも市街地も<b>本当に何もない更地</b>へ戻す全破壊3Dアクション。
            </p>
            <div className="briefing-stats">
              <div><span>BREAKABLE</span><strong>{hud.total || "491"}</strong><small>オフィス＋街区</small></div>
              <div><span>PERMITS</span><strong>5</strong><small>解体レベル</small></div>
              <div><span>BEST</span><strong>{profile.bestScore.toLocaleString()}</strong><small>自己ベスト</small></div>
            </div>
            <div className="briefing-actions">
              <button type="button" className="primary-cta" onClick={startGame}>
                <span>{hasProgress ? "CONTINUE" : "START DEMOLITION"}</span>
                <strong>{hasProgress ? `続きから再開（${initialSave?.destroyed ?? 0}件解体済み）` : "解体業務を開始"}</strong>
              </button>
              {hasProgress && (
                <button type="button" className="secondary-cta" onClick={restartGame}>
                  最初から
                </button>
              )}
              <button type="button" className="secondary-cta" onClick={() => setShowGuide(true)}>
                操作とルール
              </button>
            </div>
            <footer>
              一般社員は安全な隣棟から応援中。誰も怪我をしない会社公認の解体業務です。
            </footer>
          </section>
        </div>
      )}

      {hud.phase === "levelup" && (
        <div className="levelup-overlay" aria-live="assertive">
          <span>DEMOLITION PERMIT UPDATED</span>
          <strong>LEVEL {hud.level}</strong>
          <h2>{levelDefinition?.title}</h2>
          <p>{levelDefinition?.description}</p>
          <b>{levelDefinition?.unlock} 解禁</b>
        </div>
      )}

      {hud.phase === "paused" && (
        <div className="game-overlay pause-overlay">
          <section className="pause-panel">
            <span>業務をいったん休憩</span>
            <h2>PAUSED</h2>
            <p>休憩も業務のうちです！進行状況は保存されています。</p>
            <button type="button" className="primary-cta" onClick={() => worldRef.current?.resume()}>
              解体へ戻る
            </button>
            <div className="pause-settings">
              <button type="button" onClick={toggleSound}>{hud.soundEnabled ? "効果音 ON" : "効果音 OFF"}</button>
              <button type="button" onClick={toggleShake}>{hud.shakeEnabled ? "画面揺れ ON" : "画面揺れ OFF"}</button>
              <button type="button" onClick={() => setShowGuide(true)}>操作ガイド</button>
            </div>
          </section>
        </div>
      )}

      {hud.phase === "cleared" && (
        <div className="game-overlay clear-overlay">
          <section className="clear-panel">
            <span>100% AZABU-JUBAN DEMOLITION</span>
            <h2>街ごと更地</h2>
            <blockquote>「麻布十番、風通しがよくなりました！快適です！」</blockquote>
            <div className="clear-stats">
              <div><span>SCORE</span><strong>{hud.score.toLocaleString()}</strong></div>
              <div><span>MAX COMBO</span><strong>{hud.maxCombo}</strong></div>
              <div><span>TIME</span><strong>{formatPlayTime(result?.playSeconds ?? initialSave?.playSeconds ?? 0)}</strong></div>
            </div>
            <div className="clear-actions">
              <button type="button" className="primary-cta" onClick={() => void shareResult()}>{shareLabel}</button>
              <button type="button" className="secondary-cta" onClick={restartGame}>もう一度更地にする</button>
            </div>
          </section>
        </div>
      )}

      {showGuide && (
        <div className="game-overlay guide-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) setShowGuide(false);
        }}>
          <section className="guide-panel">
            <button type="button" className="guide-close" onClick={() => setShowGuide(false)} aria-label="閉じる">×</button>
            <span>HOW TO DEMOLISH</span>
            <h2>壊し方は、順番次第。</h2>
            <div className="guide-grid">
              {DEMOLITION_LEVELS.map((definition) => (
                <article key={definition.level}>
                  <b style={{ background: definition.accent }}>{definition.level}</b>
                  <div>
                    <strong>{definition.title}</strong>
                    <p>{definition.description}</p>
                    <small>{definition.unlock}</small>
                  </div>
                </article>
              ))}
            </div>
            <p className="guide-tip">
              家具を投げて別の家具へ当て、柱を抜いて壁や天井を連鎖崩壊させると、
              コンボ・経験値・スコアが大きく伸びます。各レベルの業務目標は任意ですが、
              達成すると次の解体許可へ早く進めます。LEVEL 3で外周壁を破ると麻布十番へ進出。
              街を壊して巨大化し、LEVEL 5の超乾杯でビールビームとジョッキメテオを放てます。
              終盤は残存物レーダーが最後の対象を自動追跡します。
            </p>
          </section>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {hud.notice}。解体済み{hud.destroyed}件、残り{hud.remaining}件。
      </div>
    </main>
  );
}
