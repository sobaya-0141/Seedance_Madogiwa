"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CHARACTERS, type CharacterCatalogEntry } from "./character-catalog";
import {
  loadVoxelModel,
  STANDARD_RIG,
  type VoxelActionController,
} from "./lib/voxel-character-kit";

type ActionId = "idle" | "walk" | "smash" | "power";

const ACTIONS: Array<{ id: ActionId; label: string; sub: string; key: string }> = [
  { id: "idle", label: "IDLE", sub: "待機", key: "1" },
  { id: "walk", label: "WALK", sub: "歩行ループ", key: "2" },
  { id: "smash", label: "SMASH", sub: "通常攻撃", key: "3" },
  { id: "power", label: "POWER", sub: "強化攻撃", key: "4" },
];

type ViewerRuntime = {
  actions?: VoxelActionController;
  mixer?: THREE.AnimationMixer;
  modelPivot?: THREE.Group;
  elapsed: number;
  smashElapsed: number;
};

const RIG_NODE_NAMES = [
  STANDARD_RIG.primaryArm,
  STANDARD_RIG.secondaryArm,
  STANDARD_RIG.leftLeg,
  STANDARD_RIG.rightLeg,
  STANDARD_RIG.primaryHandSocket,
];

function CharacterViewer({
  character,
  action,
  speed,
  loop,
  autoRotate,
  showRig,
  actionRequest,
  onLoaded,
  onProgress,
}: {
  character: CharacterCatalogEntry;
  action: ActionId;
  speed: number;
  loop: boolean;
  autoRotate: boolean;
  showRig: boolean;
  actionRequest: number;
  onLoaded: (ready: boolean, nodeCount: number) => void;
  onProgress: (progress: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ViewerRuntime>({ elapsed: 0, smashElapsed: 99 });
  const controlsRef = useRef({ action, speed, loop, autoRotate, showRig });

  useEffect(() => {
    controlsRef.current = { action, speed, loop, autoRotate, showRig };
    runtimeRef.current.modelPivot?.traverse((node) => {
      if (node.userData.rigHelper) node.visible = showRig;
    });
  }, [action, speed, loop, autoRotate, showRig]);

  useEffect(() => {
    if (action === "smash" || action === "power") {
      runtimeRef.current.actions?.triggerSmash(action === "power");
      runtimeRef.current.smashElapsed = 0;
    }
  }, [action, actionRequest]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07111e);
    scene.fog = new THREE.Fog(0x07111e, 7, 15);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(4.6, 3.1, 5.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.25, 0);
    controls.enableDamping = true;
    controls.minDistance = 3.2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();

    scene.add(new THREE.HemisphereLight(0xb9dcff, 0x19202d, 2.2));
    const key = new THREE.DirectionalLight(0xffdfb5, 4.3);
    key.position.set(-3.5, 6, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5b8cff, 3.2);
    rim.position.set(4, 3, -4);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.4, 72),
      new THREE.MeshStandardMaterial({ color: 0x0d1c2c, roughness: 0.82, metalness: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(8.8, 18, 0x2e83b9, 0x17344d);
    grid.position.y = 0.005;
    scene.add(grid);

    let disposed = false;
    let frame = 0;
    let uiFrame = 0;
    let last = performance.now();
    const modelPivot = new THREE.Group();
    scene.add(modelPivot);
    runtimeRef.current = { elapsed: 0, smashElapsed: 99, modelPivot };
    onLoaded(false, 0);

    if (character.modelUrl) {
      loadVoxelModel(character).then(({ model, mixer, actions }) => {
        if (disposed) return;
        modelPivot.add(model);
        runtimeRef.current.actions = actions;
        runtimeRef.current.mixer = mixer;
        let nodeCount = 0;
        RIG_NODE_NAMES.forEach((name) => {
          const node = model.getObjectByName(name);
          if (!node) return;
          nodeCount += 1;
          const axes = new THREE.AxesHelper(name === STANDARD_RIG.primaryHandSocket ? 0.22 : 0.34);
          axes.userData.rigHelper = true;
          axes.visible = controlsRef.current.showRig;
          node.add(axes);
        });
        model.traverse((node) => {
          if (!node.name.startsWith(STANDARD_RIG.locomotionPrefix)) return;
          nodeCount += 1;
          const axes = new THREE.AxesHelper(0.28);
          axes.userData.rigHelper = true;
          axes.visible = controlsRef.current.showRig;
          node.add(axes);
        });
        onLoaded(Boolean(actions), nodeCount);
      }).catch(() => onLoaded(false, 0));
    }

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const tick = (now: number) => {
      const rawDt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const current = controlsRef.current;
      const dt = rawDt * current.speed;
      const runtime = runtimeRef.current;
      runtime.elapsed += dt;
      runtime.mixer?.update(dt);
      runtime.actions?.update(dt, runtime.elapsed, current.action === "walk");

      if (current.action === "smash" || current.action === "power") {
        runtime.smashElapsed += dt;
        const duration = character.motion.smashDuration;
        if (uiFrame % 3 === 0) onProgress(Math.min(1, runtime.smashElapsed / duration));
        if (current.loop && runtime.smashElapsed > duration + 0.28) {
          runtime.actions?.triggerSmash(current.action === "power");
          runtime.smashElapsed = 0;
        }
      } else {
        if (uiFrame % 3 === 0) onProgress(current.action === "walk" ? (runtime.elapsed * 1.8) % 1 : 0);
      }

      if (current.autoRotate && runtime.modelPivot) runtime.modelPivot.rotation.y += rawDt * 0.32;
      controls.update();
      renderer.render(scene, camera);
      uiFrame += 1;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [character, onLoaded, onProgress]);

  return <div ref={hostRef} className="viewer-canvas" aria-label={`${character.name} 3Dモデルビュー`} />;
}

export default function CharacterLab() {
  const [selectedId, setSelectedId] = useState("sobaya");
  const [action, setAction] = useState<ActionId>("idle");
  const [actionRequest, setActionRequest] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showRig, setShowRig] = useState(false);
  const [ready, setReady] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [progress, setProgress] = useState(0);

  const character = useMemo(
    () => CHARACTERS.find((entry) => entry.id === selectedId) ?? CHARACTERS[0],
    [selectedId],
  );

  const handleLoaded = useCallback((isReady: boolean, count: number) => {
    setReady(isReady);
    setNodeCount(count);
  }, []);
  const handleProgress = useCallback((value: number) => setProgress(value), []);

  const playAction = useCallback((next: ActionId) => {
    if (!ready) return;
    setAction(next);
    setActionRequest((value) => value + 1);
  }, [ready]);

  useEffect(() => {
    setAction("idle");
    setReady(false);
    setProgress(0);
  }, [selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = ACTIONS.find((item) => item.key === event.key);
      if (target) playAction(target.id);
      if (event.key.toLowerCase() === "r") setShowRig((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playAction]);

  const modelReady = character.status === "ready";

  return (
    <main className="lab-shell" style={{ "--accent": character.accent } as React.CSSProperties}>
      <header className="lab-header">
        <div className="brand-lockup">
          <span className="brand-mark">M</span>
          <div>
            <p>MADOGIWA TOOLKIT / 01</p>
            <h1>VOXEL CHARACTER LAB</h1>
          </div>
        </div>
        <div className="header-status">
          <span className={ready ? "status-dot ready" : "status-dot"} />
          {ready ? "MODEL ONLINE" : modelReady ? "LOADING MODEL" : "MODEL SLOT EMPTY"}
        </div>
      </header>

      <section className="lab-grid">
        <aside className="roster-panel panel">
          <div className="panel-heading">
            <span>01</span>
            <div><p>CHARACTER ROSTER</p><h2>キャラクター</h2></div>
          </div>
          <div className="character-list">
            {CHARACTERS.map((entry, index) => (
              <button
                key={entry.id}
                className={`character-card ${entry.id === selectedId ? "selected" : ""}`}
                onClick={() => setSelectedId(entry.id)}
                style={{ "--card-accent": entry.accent } as React.CSSProperties}
              >
                <img src={entry.referenceImage} alt="" />
                <span className="character-index">0{index + 1}</span>
                <span className="character-copy">
                  <strong>{entry.name}</strong>
                  <small>{entry.englishName} / {entry.role}</small>
                </span>
                <span className={`availability ${entry.status}`}>{entry.status === "ready" ? "READY" : "NEXT"}</span>
              </button>
            ))}
          </div>
          <div className="roster-footnote">
            <span>{CHARACTERS.filter((entry) => entry.status === "ready").length} / {CHARACTERS.length}</span>
            <p>モデル登録済み</p>
          </div>
        </aside>

        <section className="stage-panel panel">
          <div className="stage-toolbar">
            <div>
              <span className="eyebrow">ACTIVE MODEL</span>
              <h2>{character.name} <small>{character.englishName}</small></h2>
            </div>
            <div className="stage-badges">
              <span>GLB</span><span>{character.bodyType}</span><span>{character.rigLabel}</span>
            </div>
          </div>
          <div className="stage-viewport">
            <CharacterViewer
              character={character}
              action={action}
              speed={speed}
              loop={loop}
              autoRotate={autoRotate}
              showRig={showRig}
              actionRequest={actionRequest}
              onLoaded={handleLoaded}
              onProgress={handleProgress}
            />
            <div className="viewport-corners" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="axis-legend"><span className="x">X</span><span className="y">Y</span><span className="z">Z</span></div>
            {!modelReady && (
              <div className="empty-model-state">
                <img src={character.referenceImage} alt={`${character.name} 参照画像`} />
                <span>MODEL SLOT EMPTY</span>
                <h3>{character.name}のGLBは未作成です</h3>
                <p>共通リグ規格へ接続すると、この画面ですぐアクションを確認できます。</p>
                <code>public/models/{character.id}.glb</code>
              </div>
            )}
            <div className="viewport-help">DRAG: ROTATE　SCROLL: ZOOM　R: RIG</div>
          </div>
          <div className="timeline">
            <div className="timeline-meta"><span>ACTION / {action.toUpperCase()}</span><b>{speed.toFixed(2)}×</b></div>
            <div className="timeline-track"><span style={{ width: `${Math.max(2, progress * 100)}%` }} /></div>
          </div>
        </section>

        <aside className="control-panel panel">
          <div className="panel-heading">
            <span>02</span>
            <div><p>ACTION CONSOLE</p><h2>基本アクション</h2></div>
          </div>
          <div className="action-grid">
            {ACTIONS.map((item) => (
              <button
                key={item.id}
                className={action === item.id ? "active" : ""}
                onClick={() => playAction(item.id)}
                disabled={!ready}
              >
                <kbd>{item.key}</kbd><strong>{item.label}</strong><small>{item.sub}</small>
              </button>
            ))}
          </div>

          <div className="control-block">
            <div className="control-label"><span>PLAYBACK SPEED</span><b>{speed.toFixed(2)}×</b></div>
            <input
              aria-label="再生速度"
              type="range"
              min="0.35"
              max="1.75"
              step="0.05"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
            <div className="range-labels"><span>SLOW</span><span>NORMAL</span><span>FAST</span></div>
          </div>

          <div className="toggle-list">
            {[
              ["LOOP ACTION", loop, setLoop],
              ["AUTO ROTATE", autoRotate, setAutoRotate],
              ["SHOW RIG AXES", showRig, setShowRig],
            ].map(([label, value, setter]) => (
              <label key={String(label)}>
                <span>{String(label)}</span>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={() => (setter as React.Dispatch<React.SetStateAction<boolean>>)((current) => !current)}
                />
                <i />
              </label>
            ))}
          </div>

          <div className="rig-report">
            <div className="control-label"><span>RIG REPORT</span><b>{nodeCount} NODES</b></div>
            <ul>
              <li><span>PRIMARY ARM</span><b className={ready ? "ok" : "wait"}>{ready ? "CONNECTED" : "WAITING"}</b></li>
              <li><span>LOCOMOTION</span><b className={ready ? "ok" : "wait"}>{ready ? character.bodyType : "WAITING"}</b></li>
              <li><span>HAND SOCKET</span><b className={ready ? "ok" : "wait"}>{ready ? "AVAILABLE" : "WAITING"}</b></li>
            </ul>
          </div>

          <div className="character-note">
            <span>DESIGN LOCK</span>
            <p>{character.note}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
