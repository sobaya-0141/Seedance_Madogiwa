// Three.js battle arena: two voxel fighters facing off.
//
// The local player is always shown on the LEFT ("you"), the opponent on the
// RIGHT ("opp"), regardless of host/guest role, so each side sees themselves in
// the familiar spot. The scene only handles presentation (idle posture, attack
// lunge, hurt shake); HP/MP numbers live in the DOM HUD.

import * as THREE from "three";
import {
  STANDARD_BIPED_MOTION,
  STANDARD_VOXEL_RIG_NODES,
  loadVoxelCharacter,
  type VoxelActionController,
  type VoxelCharacterDefinition,
} from "./voxel-character-kit";
import { getCharacter } from "./characters";

export type Side = "you" | "opp";

const SHARED_RIG = {
  primaryArm: [STANDARD_VOXEL_RIG_NODES.primaryArm],
  secondaryArm: [STANDARD_VOXEL_RIG_NODES.secondaryArm],
  leftLeg: [STANDARD_VOXEL_RIG_NODES.leftLeg],
  rightLeg: [STANDARD_VOXEL_RIG_NODES.rightLeg],
  locomotionExtras: [STANDARD_VOXEL_RIG_NODES.locomotionPrefix],
} as const;

const SIDE_X = 2.3;
const LUNGE_DURATION = 0.5;
const HURT_DURATION = 0.35;

type FighterRuntime = {
  side: Side;
  wrapper: THREE.Group;
  baseX: number;
  dir: number; // +1 lunges toward +x, -1 toward -x
  actions?: VoxelActionController;
  lungeT: number; // >= LUNGE_DURATION means idle
  hurtT: number;
};

function makeDef(charId: string, rotationY: number): VoxelCharacterDefinition {
  const char = getCharacter(charId);
  const scale = char?.scale ?? 1.24;
  return {
    id: charId,
    assetUrl: `models/${charId}.glb`,
    modelName: `${charId}-voxel`,
    scale,
    rotationY,
    rig: SHARED_RIG,
    motion: STANDARD_BIPED_MOTION,
  };
}

export class BattleScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private fighters = new Map<Side, FighterRuntime>();
  private container: HTMLElement;
  private raf = 0;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";

    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 2.7, 7.2);
    this.camera.lookAt(0, 1.2, 0);

    this.buildEnvironment();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.update();
    };
    this.raf = requestAnimationFrame(loop);
  }

  private buildEnvironment(): void {
    const hemi = new THREE.HemisphereLight(0xfff2d8, 0x2a2340, 1.05);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(3.5, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    this.scene.add(key);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(6.5, 48),
      new THREE.MeshStandardMaterial({ color: 0x3a3358, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(6.2, 6.5, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd24a, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);
  }

  /** Load (or reload) both fighters. Safe to call again for a rematch. */
  setFighters(youCharId: string, oppCharId: string): void {
    for (const f of this.fighters.values()) this.scene.remove(f.wrapper);
    this.fighters.clear();
    this.spawn("you", youCharId, -SIDE_X, +1, Math.PI * 0.16);
    this.spawn("opp", oppCharId, +SIDE_X, -1, -Math.PI * 0.16);
  }

  private spawn(side: Side, charId: string, baseX: number, dir: number, rotationY: number): void {
    const wrapper = new THREE.Group();
    wrapper.position.set(baseX, 0, 0);
    this.scene.add(wrapper);
    const runtime: FighterRuntime = {
      side,
      wrapper,
      baseX,
      dir,
      lungeT: LUNGE_DURATION + 1,
      hurtT: HURT_DURATION + 1,
    };
    this.fighters.set(side, runtime);
    loadVoxelCharacter({
      definition: makeDef(charId, rotationY),
      parent: wrapper,
      onReady: (character) => {
        runtime.actions = character.actions;
      },
      onError: (err) => console.error(`failed to load ${charId}`, err),
    });
  }

  playAttack(attacker: Side): void {
    const f = this.fighters.get(attacker);
    if (!f) return;
    f.lungeT = 0;
    f.actions?.triggerSmash(true);
  }

  playHurt(target: Side): void {
    const f = this.fighters.get(target);
    if (!f) return;
    f.hurtT = 0;
  }

  private update(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    for (const f of this.fighters.values()) {
      f.actions?.update(dt, elapsed, false);

      let x = f.baseX;
      let y = 0;
      if (f.lungeT < LUNGE_DURATION) {
        f.lungeT += dt;
        const t = Math.min(f.lungeT / LUNGE_DURATION, 1);
        const curve = Math.sin(Math.PI * t);
        x += curve * 1.4 * f.dir;
        y += curve * 0.28;
      }
      if (f.hurtT < HURT_DURATION) {
        f.hurtT += dt;
        const t = f.hurtT / HURT_DURATION;
        const decay = 1 - t;
        x += Math.sin(t * Math.PI * 8) * 0.18 * decay;
      }
      f.wrapper.position.x = x;
      f.wrapper.position.y = y;
    }
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
