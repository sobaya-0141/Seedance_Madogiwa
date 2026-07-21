"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type GameStatus = "ready" | "playing" | "gameover";
type GameApi = {
  start: () => void;
  smash: () => void;
  pause: () => void;
  toggleSound: () => boolean;
};

type SobayaAnimator = {
  triggerSmash: (powered: boolean) => void;
  update: (dt: number, elapsed: number, moving: boolean) => void;
};

type Breakable = {
  group: THREE.Group;
  radius: number;
  points: number;
  color: number;
  special?: boolean;
  hp: number;
  maxHp: number;
  solid: boolean;
  label: string;
  bounds?: THREE.Box3;
  healthFill?: THREE.Mesh;
  alive: boolean;
};

type Pickup = {
  group: THREE.Group;
  kind: "beer" | "time";
  baseY: number;
  active: boolean;
  respawnAt: number;
  maxRespawns: number;
  remainingRespawns: number;
};

type Debris = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
};

const INITIAL_TIME = 45;
const POWER_DURATION = 6;
const TIME_BONUS = 5;

function roundedBox(
  width: number,
  height: number,
  depth: number,
  color: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.76 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeSobayaFallback() {
  const player = new THREE.Group();
  player.name = "sobaya";

  const shirt = new THREE.MeshStandardMaterial({ color: 0xf7f8f6, roughness: 0.88 });
  const shirtShadow = new THREE.MeshStandardMaterial({ color: 0xdfe4e4, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9da7ad, roughness: 0.74 });
  const skinLight = new THREE.MeshStandardMaterial({ color: 0xb9c1c5, roughness: 0.72 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x13191e, roughness: 0.86 });
  const maskEdge = new THREE.MeshStandardMaterial({ color: 0xd6dbdc, roughness: 0.72 });
  const maskWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58 });
  const maskRed = new THREE.MeshStandardMaterial({ color: 0xe12727, roughness: 0.62 });
  const black = new THREE.MeshStandardMaterial({ color: 0x050708, roughness: 0.38 });

  const addShadowMesh = (mesh: THREE.Mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    player.add(mesh);
    return mesh;
  };

  const torso = addShadowMesh(new THREE.Mesh(new THREE.CapsuleGeometry(0.82, 0.72, 8, 24), shirt));
  torso.scale.set(1.34, 1.04, 0.88);
  torso.position.y = 1.52;

  const chest = addShadowMesh(new THREE.Mesh(new THREE.SphereGeometry(0.91, 30, 20), shirt));
  chest.scale.set(1.34, 0.82, 0.88);
  chest.position.set(0, 1.88, -0.03);

  const belly = addShadowMesh(new THREE.Mesh(new THREE.SphereGeometry(0.82, 28, 18), shirtShadow));
  belly.scale.set(1.28, 0.72, 0.84);
  belly.position.set(0, 1.15, 0.02);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.075, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0xcbd2d3, roughness: 0.86 }),
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 2.34, -0.01);
  collar.scale.z = 0.72;
  player.add(collar);

  const shorts = roundedBox(1.55, 0.5, 0.92, 0x252a31);
  shorts.position.y = 0.63;
  player.add(shorts);
  const waistband = roundedBox(1.62, 0.12, 0.94, 0x11161b);
  waistband.position.y = 0.88;
  player.add(waistband);

  for (const x of [-0.46, 0.46]) {
    const thigh = addShadowMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.58, 16), skin));
    thigh.position.set(x, 0.3, 0.02);
    const sock = addShadowMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.26, 14), shirtShadow));
    sock.position.set(x, 0.08, -0.05);
    const shoe = roundedBox(0.5, 0.22, 0.7, 0x101418);
    shoe.position.set(x, 0.04, -0.23);
    shoe.rotation.x = -0.05;
    player.add(shoe);
  }

  const makeArm = (side: -1 | 1) => {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.SphereGeometry(0.48, 22, 16), shirt);
    sleeve.scale.set(0.9, 1.02, 0.86);
    sleeve.position.set(side * 1.0, 1.9, -0.02);
    sleeve.castShadow = true;
    arm.add(sleeve);

    const bicep = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.42, 7, 18), skinLight);
    bicep.position.set(side * 1.18, 1.47, side > 0 ? -0.24 : 0.08);
    bicep.rotation.z = side > 0 ? -0.5 : 0.42;
    bicep.castShadow = true;
    arm.add(bicep);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.38, 7, 18), skin);
    forearm.position.set(side * 1.34, 1.12, side > 0 ? -0.43 : -0.08);
    forearm.rotation.z = side > 0 ? -0.9 : 0.78;
    forearm.rotation.x = side > 0 ? -0.18 : 0.1;
    forearm.castShadow = true;
    arm.add(forearm);

    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.31, 18, 14), skinLight);
    fist.scale.set(1.05, 0.86, 0.95);
    fist.position.set(side * 1.52, 0.97, side > 0 ? -0.57 : -0.22);
    fist.castShadow = true;
    arm.add(fist);
    for (let i = 0; i < 3; i += 1) {
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skin);
      knuckle.position.set(side * (1.67 + i * 0.015), 1.02 + i * 0.075, (side > 0 ? -0.62 : -0.27) + i * 0.02);
      arm.add(knuckle);
    }
    player.add(arm);
  };
  makeArm(-1);
  makeArm(1);

  const neck = addShadowMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.39, 0.45, 18), skin));
  neck.position.y = 2.42;

  const head = addShadowMesh(new THREE.Mesh(new THREE.SphereGeometry(0.68, 32, 24), skin));
  head.scale.set(0.97, 1.08, 0.94);
  head.position.set(0, 2.91, 0.01);

  for (const side of [-1, 1]) {
    const ear = addShadowMesh(new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), skinLight));
    ear.scale.set(0.55, 0.95, 0.42);
    ear.position.set(side * 0.66, 2.92, -0.04);
    const innerEar = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI * 1.45), skin);
    innerEar.position.set(side * 0.67, 2.92, -0.15);
    innerEar.rotation.z = side > 0 ? 0.65 : -0.65;
    player.add(innerEar);
  }

  const maskRim = addShadowMesh(new THREE.Mesh(new THREE.SphereGeometry(0.66, 32, 24), maskEdge));
  maskRim.scale.set(0.91, 1.06, 0.26);
  maskRim.position.set(0, 2.89, -0.625);

  const mask = addShadowMesh(new THREE.Mesh(new THREE.SphereGeometry(0.63, 36, 28), maskWhite));
  mask.scale.set(0.9, 1.04, 0.235);
  mask.position.set(0, 2.9, -0.67);

  for (const x of [-0.25, 0.25]) {
    const socketRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 20), black);
    socketRim.position.set(x, 3.02, -0.832);
    player.add(socketRim);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.112, 24), black);
    eye.position.set(x, 3.02, -0.837);
    player.add(eye);

    const upperMark = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.38, 4), maskRed);
    upperMark.position.set(x, 3.34, -0.824);
    upperMark.rotation.z = Math.PI / 4 + (x < 0 ? -0.07 : 0.07);
    player.add(upperMark);

    const tearShape = new THREE.Shape();
    tearShape.moveTo(-0.07, 0.22);
    tearShape.lineTo(0.07, 0.22);
    tearShape.lineTo(0.045, -0.22);
    tearShape.lineTo(-0.035, -0.29);
    tearShape.closePath();
    const tear = new THREE.Mesh(new THREE.ShapeGeometry(tearShape), maskRed);
    tear.position.set(x, 2.68, -0.84);
    tear.rotation.z = x < 0 ? -0.04 : 0.04;
    player.add(tear);
  }

  const studRim = new THREE.Mesh(new THREE.SphereGeometry(0.078, 16, 12), maskEdge);
  studRim.position.set(0, 3.31, -0.836);
  player.add(studRim);
  const stud = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), black);
  stud.position.set(0, 3.31, -0.868);
  player.add(stud);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.18, 5), maskEdge);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 2.86, -0.87);
  player.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 7, 18, Math.PI), black);
  mouth.position.set(0, 2.52, -0.84);
  mouth.rotation.z = Math.PI;
  player.add(mouth);

  const hairGroup = new THREE.Group();
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.135 + (i % 3) * 0.018, 0.38 + (i % 2) * 0.08, 7), dark);
    hair.position.set(Math.sin(angle) * 0.47, 3.54 + (i % 3) * 0.04, Math.cos(angle) * 0.34 + 0.02);
    hair.rotation.z = Math.sin(angle) * 0.42;
    hair.rotation.x = Math.cos(angle) * 0.42;
    hair.rotation.y = angle;
    hair.castShadow = true;
    hairGroup.add(hair);
  }
  for (const x of [-0.34, -0.12, 0.12, 0.34]) {
    const fringe = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 7), dark);
    fringe.position.set(x, 3.49 + Math.abs(x) * 0.1, -0.31);
    fringe.rotation.x = 0.52;
    fringe.rotation.z = -x * 0.8;
    fringe.castShadow = true;
    hairGroup.add(fringe);
  }
  player.add(hairGroup);

  const mug = new THREE.Group();
  mug.position.set(1.52, 1.0, -0.66);
  mug.rotation.z = -0.08;
  const amber = new THREE.MeshStandardMaterial({ color: 0xe88b05, roughness: 0.22, metalness: 0.04, emissive: 0x4b2400, emissiveIntensity: 0.22 });
  const beer = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.225, 0.72, 24), amber);
  beer.castShadow = true;
  mug.add(beer);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.285, 0.25, 0.79, 24, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, roughness: 0.08, transmission: 0.35, thickness: 0.08 }),
  );
  glass.castShadow = true;
  mug.add(glass);
  const glassBase = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.07, 24), maskWhite);
  glassBase.position.y = -0.39;
  mug.add(glassBase);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.278, 0.035, 10, 24), maskWhite);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.4;
  mug.add(rim);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.225, 0.052, 10, 22, Math.PI * 1.65),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.62, roughness: 0.12 }),
  );
  handle.position.set(0.31, 0.03, 0);
  handle.rotation.z = -0.82;
  mug.add(handle);
  for (let i = 0; i < 8; i += 1) {
    const foam = new THREE.Mesh(
      new THREE.SphereGeometry(0.095 + (i % 3) * 0.018, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xfffdf1, roughness: 0.92 }),
    );
    foam.position.set((i % 4 - 1.5) * 0.115, 0.43 + (i % 2) * 0.045, (Math.floor(i / 4) - 0.5) * 0.13);
    foam.castShadow = true;
    mug.add(foam);
  }
  const shine = roundedBox(0.035, 0.52, 0.02, 0xffffff);
  shine.position.set(-0.16, 0.02, -0.27);
  mug.add(shine);
  player.add(mug);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.08, 1.16, 56),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.44, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.018;
  player.add(ring);
  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.78, 48),
    new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.02;
  player.add(innerRing);

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.66, 3),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 }),
  );
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(0, 0.045, -1.22);
  player.add(arrow);

  player.scale.setScalar(0.83);
  return player;
}

function makeSobaya() {
  const player = new THREE.Group();
  player.name = "sobaya";

  // Keep the original procedural character on screen until the reusable GLB
  // has loaded. It also acts as an offline-safe fallback.
  const fallback = makeSobayaFallback();
  player.add(fallback);

  const markers = new THREE.Group();
  markers.visible = false;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.08, 1.16, 56),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.44, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.018;
  markers.add(ring);
  const innerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.78, 48),
    new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.02;
  markers.add(innerRing);
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.66, 3),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 }),
  );
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(0, 0.045, -1.22);
  markers.add(arrow);
  player.add(markers);

  new GLTFLoader().load(
    "/models/sobaya.glb?v=voxel-3",
    (gltf) => {
      const model = gltf.scene;
      model.name = "sobaya-reusable-model";
      model.scale.setScalar(1.32);
      // The Blender source faces -Y, which exports toward +Z in glTF.
      model.rotation.y = Math.PI;
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      player.add(model);
      fallback.visible = false;
      markers.visible = true;

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        player.userData.mixer = mixer;
      }

      const mugArm = model.getObjectByName("SobayaVoxel_MugArmPivot");
      const freeArm = model.getObjectByName("SobayaVoxel_FreeArmPivot");
      const legNegX = model.getObjectByName("SobayaVoxel_LegPivot_NegX");
      const legPosX = model.getObjectByName("SobayaVoxel_LegPivot_PosX");
      if (mugArm && freeArm && legNegX && legPosX) {
        let smashElapsed = 1;
        let smashStrength = 1;
        const animator: SobayaAnimator = {
          triggerSmash: (powered) => {
            smashElapsed = 0;
            smashStrength = powered ? 1.16 : 1;
          },
          update: (dt, elapsed, moving) => {
            const response = 1 - Math.exp(-dt * 22);
            const stride = moving ? Math.sin(elapsed * 11.5) * 0.52 : 0;
            legNegX.rotation.x = THREE.MathUtils.lerp(legNegX.rotation.x, stride, response);
            legPosX.rotation.x = THREE.MathUtils.lerp(legPosX.rotation.x, -stride, response);

            let mugTarget = moving ? stride * 0.16 : 0;
            let freeTarget = moving ? -stride * 0.46 : 0;
            smashElapsed += dt;
            if (smashElapsed < 0.52) {
              const phase = smashElapsed / 0.52;
              if (phase < 0.28) {
                const t = THREE.MathUtils.smoothstep(phase / 0.28, 0, 1);
                mugTarget = THREE.MathUtils.lerp(0, 1.12 * smashStrength, t);
              } else if (phase < 0.55) {
                const t = THREE.MathUtils.smoothstep((phase - 0.28) / 0.27, 0, 1);
                mugTarget = THREE.MathUtils.lerp(1.12 * smashStrength, -1.02 * smashStrength, t);
              } else {
                const t = THREE.MathUtils.smoothstep((phase - 0.55) / 0.45, 0, 1);
                mugTarget = THREE.MathUtils.lerp(-1.02 * smashStrength, moving ? stride * 0.16 : 0, t);
              }
              freeTarget -= Math.sin(Math.PI * phase) * 0.22;
            }
            mugArm.rotation.x = THREE.MathUtils.lerp(mugArm.rotation.x, mugTarget, response);
            freeArm.rotation.x = THREE.MathUtils.lerp(freeArm.rotation.x, freeTarget, response);
          },
        };
        player.userData.animator = animator;
      }
    },
    undefined,
    (error) => {
      console.warn("Sobaya GLB could not be loaded; using procedural fallback.", error);
    },
  );

  return player;
}

function makeDesk(color = 0xc98b52) {
  const g = new THREE.Group();
  const top = roundedBox(2.15, 0.18, 1.05, color);
  top.position.y = 0.86;
  g.add(top);
  for (const x of [-0.85, 0.85]) {
    for (const z of [-0.35, 0.35]) {
      const leg = roundedBox(0.12, 0.82, 0.12, 0x53616b);
      leg.position.set(x, 0.42, z);
      g.add(leg);
    }
  }
  const screen = roundedBox(0.8, 0.58, 0.08, 0x26323b);
  screen.position.set(0.24, 1.25, 0.08);
  g.add(screen);
  const base = roundedBox(0.12, 0.32, 0.1, 0x394550);
  base.position.set(0.24, 1.01, 0.08);
  g.add(base);
  return g;
}

function makeChair(color = 0x2d68a8) {
  const g = new THREE.Group();
  const seat = roundedBox(0.72, 0.16, 0.72, color);
  seat.position.y = 0.58;
  g.add(seat);
  const back = roundedBox(0.72, 0.85, 0.16, color);
  back.position.set(0, 0.98, 0.3);
  g.add(back);
  const stem = roundedBox(0.1, 0.45, 0.1, 0x3d4850);
  stem.position.y = 0.31;
  g.add(stem);
  return g;
}

function makeCopier(gold = false) {
  const g = new THREE.Group();
  const mainColor = gold ? 0xf5b70a : 0xd8dee3;
  const body = roundedBox(1.15, 1.42, 0.88, mainColor);
  body.position.y = 0.71;
  g.add(body);
  const lid = roundedBox(1.08, 0.18, 0.78, gold ? 0xffd84d : 0x7d8992);
  lid.position.set(0, 1.51, -0.02);
  lid.rotation.x = -0.12;
  g.add(lid);
  const panel = roundedBox(0.65, 0.12, 0.18, gold ? 0xffec8a : 0x26323b);
  panel.position.set(0, 1.25, -0.49);
  g.add(panel);
  for (const y of [0.35, 0.68]) {
    const tray = roundedBox(0.72, 0.09, 0.06, gold ? 0xe99500 : 0x6f7b84);
    tray.position.set(0, y, -0.47);
    g.add(tray);
  }
  return g;
}

function makeCabinet(color = 0x7c8b93) {
  const g = new THREE.Group();
  const body = roundedBox(1.0, 1.65, 0.65, color);
  body.position.y = 0.82;
  g.add(body);
  for (const y of [0.38, 0.78, 1.18]) {
    const line = roundedBox(0.72, 0.055, 0.04, 0x34414a);
    line.position.set(0, y, -0.35);
    g.add(line);
  }
  return g;
}

function makeReinforcedGate(width = 6.7) {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x4d616c, roughness: 0.48, metalness: 0.72 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0x20313a, roughness: 0.52, metalness: 0.65 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xff8a16, roughness: 0.62, emissive: 0x6a2100, emissiveIntensity: 0.2 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, 1.85, 0.46), steel);
  body.position.y = 0.93;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  for (const x of [-width / 2 + 0.17, width / 2 - 0.17]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.34, 2.3, 0.72), steelDark);
    post.position.set(x, 1.1, 0);
    post.castShadow = true;
    g.add(post);
  }
  for (const y of [0.35, 0.78, 1.2, 1.63]) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.55, 0.13, 0.56), steelDark);
    slat.position.set(0, y, -0.015);
    slat.castShadow = true;
    g.add(slat);
  }
  for (let i = 0; i < 7; i += 1) {
    const stripe = roundedBox(0.48, 0.18, 0.07, i % 2 ? 0x1c272d : 0xff9d13);
    stripe.position.set(-1.46 + i * 0.48, 1.13, -0.29);
    stripe.rotation.z = -0.48;
    g.add(stripe);
  }
  const lock = roundedBox(0.7, 0.62, 0.22, 0xff9418);
  lock.position.set(0, 0.72, -0.38);
  lock.material = orange;
  g.add(lock);
  const keyhole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), steelDark);
  keyhole.position.set(0, 0.74, -0.51);
  g.add(keyhole);

  const hpBack = roundedBox(2.5, 0.24, 0.12, 0x15242c);
  hpBack.position.set(0, 2.24, 0);
  g.add(hpBack);
  const hpFill = roundedBox(2.32, 0.12, 0.15, 0x54dc72);
  hpFill.position.set(0, 2.24, -0.08);
  g.add(hpFill);
  g.userData.healthFill = hpFill;

  for (const x of [-width * 0.32, width * 0.32]) {
    for (const y of [0.32, 1.55]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12), steelDark);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(x, y, -0.28);
      g.add(bolt);
    }
  }
  return g;
}

function makeReinforcedLocker() {
  const g = makeCabinet(0x465c68);
  const armor = roundedBox(1.18, 1.38, 0.12, 0x2a3c46);
  armor.position.set(0, 0.84, -0.39);
  g.add(armor);
  for (const y of [0.38, 0.78, 1.18]) {
    const brace = roundedBox(1.28, 0.12, 0.12, 0xff8a16);
    brace.position.set(0, y, -0.49);
    g.add(brace);
  }
  const hpBack = roundedBox(1.2, 0.17, 0.09, 0x15242c);
  hpBack.position.set(0, 1.95, 0);
  g.add(hpBack);
  const hpFill = roundedBox(1.08, 0.09, 0.12, 0x54dc72);
  hpFill.position.set(0, 1.95, -0.07);
  g.add(hpFill);
  g.userData.healthFill = hpFill;
  return g;
}

function makePlant() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.3, 0.62, 12),
    new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.9 }),
  );
  pot.position.y = 0.3;
  pot.castShadow = true;
  g.add(pot);
  const green = new THREE.MeshStandardMaterial({ color: 0x5d9f54, roughness: 0.9 });
  for (let i = 0; i < 6; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), green);
    const a = (i / 6) * Math.PI * 2;
    leaf.scale.set(0.55, 1.25, 0.45);
    leaf.position.set(Math.cos(a) * 0.25, 0.9 + (i % 2) * 0.2, Math.sin(a) * 0.25);
    leaf.rotation.z = Math.cos(a) * 0.5;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

function makePickup(kind: "beer" | "time") {
  const g = new THREE.Group();
  const color = kind === "beer" ? 0xffb000 : 0x19b8ff;
  const aura = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.08, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24 }),
  );
  aura.position.y = 0.05;
  g.add(aura);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.06, 8, 28),
    new THREE.MeshBasicMaterial({ color }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.22;
  g.add(ring);

  if (kind === "beer") {
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.24, 0.66, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x6d3c00, emissiveIntensity: 0.65 }),
    );
    mug.position.y = 0.72;
    g.add(mug);
    const foam = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 14, 8),
      new THREE.MeshStandardMaterial({ color: 0xfffbeb, emissive: 0xffffff, emissiveIntensity: 0.25 }),
    );
    foam.scale.y = 0.32;
    foam.position.y = 1.05;
    g.add(foam);
  } else {
    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.13, 24),
      new THREE.MeshStandardMaterial({ color: 0xeaf8ff, emissive: 0x1679aa, emissiveIntensity: 0.3 }),
    );
    face.rotation.x = Math.PI / 2;
    face.position.y = 0.72;
    g.add(face);
    for (const [w, h, x, y, rot] of [
      [0.07, 0.28, 0, 0.08, 0],
      [0.07, 0.22, 0.08, -0.03, -0.8],
    ] as number[][]) {
      const hand = roundedBox(w, h, 0.04, 0x164e73);
      hand.position.set(x, 0.72 + y, -0.08);
      hand.rotation.z = rot;
      g.add(hand);
    }
  }
  return g;
}

export default function OfficeCrashGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<GameApi | null>(null);
  const joystickRef = useRef({ x: 0, z: 0 });
  const joystickPointer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [combo, setCombo] = useState(0);
  const [powerLeft, setPowerLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [toast, setToast] = useState("");
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 950);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0xccecff, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xccecff);
    scene.fog = new THREE.Fog(0xccecff, 26, 48);

    const camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 100);
    const baseCameraPosition = new THREE.Vector3(17, 21, 21);
    camera.position.copy(baseCameraPosition);
    camera.lookAt(0, 0, -1.5);

    let audioContext: AudioContext | null = null;
    let soundEnabled = true;
    const ensureAudio = () => {
      if (!audioContext) audioContext = new window.AudioContext();
      if (audioContext.state === "suspended") void audioContext.resume();
      return audioContext;
    };
    const tone = (
      frequency: number,
      duration: number,
      type: OscillatorType = "sine",
      gainValue = 0.08,
      endFrequency = frequency,
      delay = 0,
    ) => {
      if (!soundEnabled) return;
      const context = ensureAudio();
      const startAt = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startAt + duration);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.02);
    };
    const noise = (duration: number, gainValue: number, highpass = 90) => {
      if (!soundEnabled) return;
      const context = ensureAudio();
      const length = Math.ceil(context.sampleRate * duration);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = "highpass";
      filter.frequency.value = highpass;
      gain.gain.setValueAtTime(gainValue, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      source.buffer = buffer;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
    };
    const playSound = (kind: "smash" | "break" | "metal" | "beer" | "time" | "special" | "start" | "timeup") => {
      if (!soundEnabled) return;
      if (kind === "smash") {
        noise(0.11, 0.12, 180);
        tone(105, 0.15, "sawtooth", 0.09, 48);
      } else if (kind === "break") {
        noise(0.26, 0.18, 110);
        tone(82, 0.19, "square", 0.08, 38);
      } else if (kind === "metal") {
        noise(0.16, 0.1, 900);
        tone(680, 0.25, "square", 0.06, 360);
        tone(1120, 0.16, "sine", 0.035, 760, 0.02);
      } else if (kind === "beer") {
        tone(440, 0.12, "sine", 0.07, 660);
        tone(660, 0.16, "triangle", 0.07, 990, 0.1);
        tone(990, 0.2, "sine", 0.055, 1320, 0.2);
      } else if (kind === "time") {
        tone(740, 0.12, "square", 0.055, 880);
        tone(990, 0.2, "sine", 0.07, 1320, 0.12);
      } else if (kind === "special") {
        noise(0.32, 0.16, 150);
        tone(180, 0.24, "sawtooth", 0.1, 70);
        tone(640, 0.24, "square", 0.055, 1280, 0.1);
      } else if (kind === "start") {
        tone(330, 0.12, "square", 0.05, 440);
        tone(550, 0.16, "square", 0.06, 770, 0.12);
      } else {
        tone(220, 0.32, "sawtooth", 0.07, 75);
        tone(160, 0.4, "square", 0.045, 55, 0.2);
      }
    };

    scene.add(new THREE.HemisphereLight(0xf2fbff, 0x8a7563, 2.3));
    const sun = new THREE.DirectionalLight(0xffffff, 3.4);
    sun.position.set(-8, 18, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(21, 28),
      new THREE.MeshStandardMaterial({ color: 0xdde3e5, roughness: 0.94 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(28, 28, 0xaab4b8, 0xc8d0d2);
    grid.position.set(0, 0.015, -1);
    scene.add(grid);

    const backWall = roundedBox(21, 4.6, 0.25, 0xf2eee7);
    backWall.position.set(0, 2.3, -15);
    scene.add(backWall);
    const rightWall = roundedBox(0.25, 4.6, 28, 0xf5f1eb);
    rightWall.position.set(10.5, 2.3, -1);
    scene.add(rightWall);

    const archiveFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 7.2),
      new THREE.MeshStandardMaterial({ color: 0x607883, roughness: 0.82, metalness: 0.12 }),
    );
    archiveFloor.rotation.x = -Math.PI / 2;
    archiveFloor.position.set(0, 0.025, -11.15);
    archiveFloor.receiveShadow = true;
    scene.add(archiveFloor);
    for (const x of [-3.55, 3.55]) {
      const archiveWall = roundedBox(0.28, 2.65, 7.5, 0x344b57);
      archiveWall.position.set(x, 1.32, -11.15);
      scene.add(archiveWall);
      for (const z of [-13.8, -11.3, -8.8]) {
        const warning = roundedBox(0.34, 0.2, 0.72, 0xff8a16);
        warning.position.set(x + (x < 0 ? 0.18 : -0.18), 1.45, z);
        scene.add(warning);
      }
    }
    const archiveHeader = roundedBox(7.35, 0.55, 0.58, 0x203640);
    archiveHeader.position.set(0, 2.35, -7.4);
    scene.add(archiveHeader);

    for (let i = 0; i < 7; i += 1) {
      const windowPane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 3.1),
        new THREE.MeshStandardMaterial({ color: 0x9fddfa, emissive: 0x55b9e6, emissiveIntensity: 0.22, roughness: 0.1 }),
      );
      windowPane.position.set(-10.38, 2.65, -12.7 + i * 3.8);
      windowPane.rotation.y = Math.PI / 2;
      scene.add(windowPane);
      const frame = roundedBox(0.16, 3.5, 0.12, 0x52646d);
      frame.position.set(-10.22, 2.5, -14.4 + i * 3.8);
      scene.add(frame);
    }

    const breakables: Breakable[] = [];
    const pickups: Pickup[] = [];
    const debris: Debris[] = [];
    const effects: { mesh: THREE.Mesh; life: number }[] = [];

    const player = makeSobaya();
    player.position.set(0, 0, 8.8);
    scene.add(player);

    const runtime = {
      playing: false,
      paused: false,
      score: 0,
      time: INITIAL_TIME,
      combo: 0,
      comboWindow: 0,
      powerUntil: 0,
      lastSmash: -10,
      lastBreakSound: -10,
      lastBump: -10,
      elapsed: 0,
      shake: 0,
      pendingSmash: null as { impactAt: number; powered: boolean } | null,
    };

    const addBreakable = (
      group: THREE.Group,
      x: number,
      z: number,
      radius: number,
      points: number,
      color: number,
      special = false,
      rotation = 0,
      hp = 1,
      solid = false,
      label = "オフィス備品",
    ) => {
      group.position.set(x, 0, z);
      group.rotation.y = rotation;
      scene.add(group);
      group.updateMatrixWorld(true);
      breakables.push({
        group,
        radius,
        points,
        color,
        special,
        hp,
        maxHp: hp,
        solid,
        label,
        bounds: solid ? new THREE.Box3().setFromObject(group) : undefined,
        healthFill: group.userData.healthFill as THREE.Mesh | undefined,
        alive: true,
      });
    };

    const addOfficeProps = () => {
      for (const item of breakables) scene.remove(item.group);
      breakables.length = 0;
      const desks = [
        [-6.7, 5.6, 0.1], [-3.4, 5.2, -0.15], [4.1, 5.5, 0.08], [7.2, 4.4, -0.2],
        [-6.2, 1.6, 0.12], [-2.4, 1.4, -0.1], [3.5, 1.6, 0.1], [7.0, 0.9, -0.08],
        [-6.4, -3.1, 0.08], [-2.7, -3.7, -0.15], [3.2, -3.1, 0.12], [6.7, -3.9, -0.12],
        [-7.0, -8.5, 0.05], [7.0, -8.7, -0.08], [-1.7, -9.6, 0.08], [1.65, -11.3, -0.08],
      ];
      desks.forEach(([x, z, r], i) => {
        addBreakable(makeDesk(i % 3 === 0 ? 0xd69b5e : 0xc88950), x, z, 1.25, 150, 0xc98b52, false, r);
        if (i % 2 === 0) addBreakable(makeChair(), x + 0.2, z + 1.2, 0.62, 80, 0x2d68a8, false, r + Math.PI);
      });
      [
        [-8.6, 3.2], [8.7, 2.7], [-8.5, -5.8], [8.6, -6.5], [-5.5, -11.8], [5.7, -12.0],
      ].forEach(([x, z], i) => addBreakable(makeCabinet(i % 2 ? 0x7c8b93 : 0x8e9b9f), x, z, 0.78, 120, 0x7c8b93));
      [
        [-8.7, 7.4], [8.6, 7.0], [-8.5, -1.0], [8.4, -1.8], [-8.7, -10.2], [8.5, -11.2],
      ].forEach(([x, z]) => addBreakable(makePlant(), x, z, 0.62, 90, 0x5d9f54));
      [
        [1.2, 4.0], [-4.3, -0.8], [5.7, -5.9], [-0.2, -11.3],
      ].slice(0, 3).forEach(([x, z]) => addBreakable(makeCopier(false), x, z, 0.82, 220, 0xd8dee3));

      addBreakable(makeReinforcedGate(), 0, -7.35, 3.45, 900, 0x4d616c, false, 0, 5, true, "強化ゲート");
      addBreakable(makeReinforcedLocker(), -5.2, -5.35, 0.82, 520, 0x465c68, false, 0.08, 3, true, "強化ロッカー");
      addBreakable(makeReinforcedLocker(), 5.25, -4.8, 0.82, 520, 0x465c68, false, -0.08, 3, true, "強化ロッカー");
      addBreakable(makeCopier(true), 0, -12.25, 0.95, 1800, 0xf5b70a, true, 0, 2, false, "金の複合機");

      const sofa = new THREE.Group();
      const sofaSeat = roundedBox(3.0, 0.68, 1.15, 0x3c6e7f);
      sofaSeat.position.y = 0.45;
      sofa.add(sofaSeat);
      const sofaBack = roundedBox(3.0, 1.1, 0.35, 0x447f91);
      sofaBack.position.set(0, 1.05, 0.48);
      sofa.add(sofaBack);
      addBreakable(sofa, -6.3, -12.3, 1.7, 300, 0x3c6e7f);
    };

    const addPickup = (kind: "beer" | "time", x: number, z: number, maxRespawns = kind === "beer" ? 1 : 0) => {
      const group = makePickup(kind);
      group.position.set(x, 0.12, z);
      scene.add(group);
      pickups.push({ group, kind, baseY: 0.12, active: true, respawnAt: 0, maxRespawns, remainingRespawns: maxRespawns });
    };
    addPickup("beer", -1.3, 3.4);
    addPickup("time", 7.4, -6.2);
    addPickup("beer", -6.3, -6.0);
    addPickup("time", 0, -13.25);

    const spawnDebris = (position: THREE.Vector3, color: number, amount: number) => {
      for (let i = 0; i < amount; i += 1) {
        const size = 0.12 + Math.random() * 0.25;
        const piece = new THREE.Mesh(
          new THREE.BoxGeometry(size, size * (0.5 + Math.random()), size),
          new THREE.MeshStandardMaterial({ color: i % 4 === 0 ? 0xf7f2e8 : color, roughness: 0.86 }),
        );
        piece.position.copy(position).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.35 + Math.random(), (Math.random() - 0.5) * 0.8));
        piece.castShadow = true;
        scene.add(piece);
        debris.push({
          mesh: piece,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 5.5, 3 + Math.random() * 4.5, (Math.random() - 0.5) * 5.5),
          spin: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
          life: 1.2 + Math.random() * 0.8,
        });
      }
    };

    const addScore = (points: number) => {
      runtime.combo += 1;
      runtime.comboWindow = 2.25;
      const multiplier = Math.min(1 + Math.floor(runtime.combo / 4), 5);
      runtime.score += points * multiplier;
      setScore(runtime.score);
      setCombo(runtime.combo);
    };

    const destroyObject = (item: Breakable) => {
      if (!item.alive) return;
      item.alive = false;
      scene.remove(item.group);
      spawnDebris(item.group.position, item.color, item.special || item.maxHp > 1 ? 24 : 12);
      addScore(item.points);
      runtime.shake = Math.max(runtime.shake, item.special || item.maxHp > 1 ? 0.34 : 0.17);
      if (item.special || item.maxHp > 1) {
        playSound("special");
      } else if (runtime.elapsed - runtime.lastBreakSound > 0.07) {
        playSound("break");
        runtime.lastBreakSound = runtime.elapsed;
      }
      navigator.vibrate?.(item.special || item.maxHp > 1 ? 35 : 14);
      if (item.special) {
        runtime.powerUntil = Math.max(runtime.powerUntil, runtime.elapsed + POWER_DURATION);
        notify("金の複合機！  +1,800 / POWER UP");
      }
    };

    const damageObject = (item: Breakable, damage: number) => {
      if (!item.alive) return;
      item.hp = Math.max(0, item.hp - damage);
      if (item.hp <= 0) {
        destroyObject(item);
        return;
      }
      const ratio = item.hp / item.maxHp;
      if (item.healthFill) {
        item.healthFill.scale.x = ratio;
        const material = item.healthFill.material as THREE.MeshStandardMaterial;
        material.color.setHex(ratio > 0.6 ? 0x54dc72 : ratio > 0.3 ? 0xffc21a : 0xff4d32);
      }
      spawnDebris(item.group.position.clone().add(new THREE.Vector3(0, 0.9, -0.2)), item.color, 5);
      runtime.shake = Math.max(runtime.shake, 0.13);
      playSound("metal");
      navigator.vibrate?.(20);
      notify(`${item.label}  残り${item.hp}/${item.maxHp}`);
    };

    const distanceToBreakable = (item: Breakable, position: THREE.Vector3) => {
      if (!item.bounds) return Math.max(0, item.group.position.distanceTo(position) - item.radius);
      const dx = Math.max(item.bounds.min.x - position.x, 0, position.x - item.bounds.max.x);
      const dz = Math.max(item.bounds.min.z - position.z, 0, position.z - item.bounds.max.z);
      return Math.hypot(dx, dz);
    };

    const performSmashImpact = (powered: boolean) => {
      const radius = powered ? 2.85 : 1.95;
      playSound("smash");
      const wave = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.54, 40),
        new THREE.MeshBasicMaterial({ color: powered ? 0xffbe19 : 0xffffff, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
      );
      wave.rotation.x = -Math.PI / 2;
      wave.position.copy(player.position);
      wave.position.y = 0.08;
      scene.add(wave);
      effects.push({ mesh: wave, life: 0.42 });
      let hit = false;
      for (const item of breakables) {
        if (!item.alive) continue;
        if (distanceToBreakable(item, player.position) < radius) {
          damageObject(item, powered ? 2 : 1);
          hit = true;
        }
      }
      if (!hit) notify(powered ? "POWER SMASH!" : "SMASH!");
    };

    const smash = () => {
      if (!runtime.playing || runtime.paused || runtime.elapsed - runtime.lastSmash < 0.43) return;
      runtime.lastSmash = runtime.elapsed;
      const powered = runtime.powerUntil > runtime.elapsed;
      (player.userData.animator as SobayaAnimator | undefined)?.triggerSmash(powered);
      tone(210, 0.08, "sawtooth", 0.032, 410);
      runtime.pendingSmash = { impactAt: runtime.elapsed + 0.2, powered };
    };

    const start = () => {
      addOfficeProps();
      for (const piece of debris) scene.remove(piece.mesh);
      debris.length = 0;
      player.position.set(0, 0, 8.8);
      player.rotation.y = 0;
      runtime.playing = true;
      runtime.paused = false;
      runtime.score = 0;
      runtime.time = INITIAL_TIME;
      runtime.combo = 0;
      runtime.comboWindow = 0;
      runtime.powerUntil = 0;
      runtime.lastSmash = -10;
      runtime.lastBreakSound = -10;
      runtime.lastBump = -10;
      runtime.shake = 0;
      runtime.pendingSmash = null;
      for (const pickup of pickups) {
        pickup.active = true;
        pickup.group.visible = true;
        pickup.respawnAt = 0;
        pickup.remainingRespawns = pickup.maxRespawns;
      }
      setScore(0);
      setTimeLeft(INITIAL_TIME);
      setCombo(0);
      setPowerLeft(0);
      setPaused(false);
      setStatus("playing");
      playSound("start");
      notify("45秒！ルートを選んで壊せ！");
    };

    const pause = () => {
      if (!runtime.playing) return;
      runtime.paused = !runtime.paused;
      setPaused(runtime.paused);
    };

    const toggleSound = () => {
      soundEnabled = !soundEnabled;
      setSoundOn(soundEnabled);
      if (soundEnabled) tone(520, 0.1, "sine", 0.055, 760);
      return soundEnabled;
    };

    apiRef.current = { start, smash, pause, toggleSound };
    addOfficeProps();

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
      keys.add(event.key.toLowerCase());
      if (event.key === " ") smash();
      if (event.key.toLowerCase() === "p" || event.key === "Escape") pause();
      if (event.key === "Enter" && !runtime.playing) start();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      const aspect = width / Math.max(height, 1);
      const viewHeight = aspect < 1 ? 17 : 14;
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      if (!runtime.paused) {
        runtime.elapsed += dt;
        (player.userData.mixer as THREE.AnimationMixer | undefined)?.update(dt);
      }
      let isWalking = false;

      if (runtime.playing && !runtime.paused) {
        runtime.time -= dt;
        if (runtime.pendingSmash && runtime.elapsed >= runtime.pendingSmash.impactAt) {
          const pendingSmash = runtime.pendingSmash;
          runtime.pendingSmash = null;
          performSmashImpact(pendingSmash.powered);
        }
        const move = new THREE.Vector2(
          (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0) + joystickRef.current.x,
          (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0) + joystickRef.current.z,
        );
        if (move.lengthSq() > 0.02) {
          isWalking = true;
          move.normalize();
          const speed = runtime.powerUntil > runtime.elapsed ? 6.8 : 5.6;
          const next = player.position.clone().add(new THREE.Vector3(move.x * speed * dt, 0, move.y * speed * dt));
          next.x = THREE.MathUtils.clamp(next.x, -9.25, 9.25);
          next.z = THREE.MathUtils.clamp(next.z, -13.5, 11.7);
          const blockingItem = breakables.find((item) => {
            if (!item.alive || !item.solid || !item.bounds) return false;
            return next.x > item.bounds.min.x - 0.48 && next.x < item.bounds.max.x + 0.48
              && next.z > item.bounds.min.z - 0.48 && next.z < item.bounds.max.z + 0.48;
          });
          if (!blockingItem) {
            player.position.copy(next);
          } else if (runtime.elapsed - runtime.lastBump > 0.65) {
            runtime.lastBump = runtime.elapsed;
            tone(170, 0.09, "square", 0.035, 110);
            notify(`${blockingItem.label}をスマッシュで壊せ！`);
          }
          const targetRotation = Math.atan2(-move.x, -move.y);
          player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetRotation, 0.22);
          const bob = Math.sin(runtime.elapsed * 14) * 0.035;
          player.position.y = bob;

          if (runtime.powerUntil > runtime.elapsed) {
            for (const item of breakables) {
              if (item.alive && !item.solid && item.maxHp === 1 && distanceToBreakable(item, player.position) < 0.9) {
                destroyObject(item);
              }
            }
          }
        } else {
          player.position.y = THREE.MathUtils.lerp(player.position.y, 0, 0.22);
        }

        for (const pickup of pickups) {
          if (!pickup.active) {
            if (pickup.remainingRespawns > 0 && runtime.elapsed > pickup.respawnAt) {
              pickup.remainingRespawns -= 1;
              pickup.active = true;
              pickup.group.visible = true;
            }
            continue;
          }
          pickup.group.rotation.y += dt * 1.6;
          pickup.group.position.y = pickup.baseY + Math.sin(runtime.elapsed * 2.8 + pickup.group.position.x) * 0.11;
          if (pickup.group.position.distanceTo(player.position) < 1.15) {
            pickup.active = false;
            pickup.group.visible = false;
            pickup.respawnAt = runtime.elapsed + 18;
            if (pickup.kind === "beer") {
              runtime.powerUntil = Math.max(runtime.powerUntil, runtime.elapsed + POWER_DURATION);
              addScore(250);
              playSound("beer");
              notify(`BEER GET!  POWER UP ${POWER_DURATION}秒`);
            } else {
              runtime.time += TIME_BONUS;
              addScore(220);
              playSound("time");
              setTimeLeft(Math.ceil(runtime.time));
              notify(`TIME +${TIME_BONUS}秒（再出現なし）`);
            }
          }
        }

        runtime.comboWindow -= dt;
        if (runtime.comboWindow <= 0 && runtime.combo > 0) {
          runtime.combo = 0;
          setCombo(0);
        }

        if (runtime.time <= 0) {
          runtime.time = 0;
          runtime.playing = false;
          setTimeLeft(0);
          setStatus("gameover");
          playSound("timeup");
          notify("TIME UP!");
        }
      }

      if (!runtime.paused) {
        (player.userData.animator as SobayaAnimator | undefined)?.update(
          dt,
          runtime.elapsed,
          isWalking && runtime.playing,
        );
      }

      for (let i = debris.length - 1; i >= 0; i -= 1) {
        const piece = debris[i];
        piece.life -= dt;
        piece.velocity.y -= 9.8 * dt;
        piece.mesh.position.addScaledVector(piece.velocity, dt);
        piece.mesh.rotation.x += piece.spin.x * dt;
        piece.mesh.rotation.y += piece.spin.y * dt;
        piece.mesh.rotation.z += piece.spin.z * dt;
        if (piece.mesh.position.y < 0.08) {
          piece.mesh.position.y = 0.08;
          piece.velocity.y *= -0.24;
          piece.velocity.x *= 0.84;
          piece.velocity.z *= 0.84;
        }
        const mat = piece.mesh.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = Math.min(1, piece.life * 1.4);
        if (piece.life <= 0) {
          scene.remove(piece.mesh);
          debris.splice(i, 1);
        }
      }

      for (let i = effects.length - 1; i >= 0; i -= 1) {
        const effect = effects[i];
        effect.life -= dt;
        const scale = 1 + (0.42 - effect.life) * 9;
        effect.mesh.scale.setScalar(scale);
        (effect.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, effect.life * 2);
        if (effect.life <= 0) {
          scene.remove(effect.mesh);
          effects.splice(i, 1);
        }
      }

      if (runtime.shake > 0.002) {
        camera.position.copy(baseCameraPosition).add(new THREE.Vector3(
          (Math.random() - 0.5) * runtime.shake,
          (Math.random() - 0.5) * runtime.shake * 0.6,
          (Math.random() - 0.5) * runtime.shake,
        ));
        runtime.shake *= Math.pow(0.025, dt);
      } else {
        camera.position.copy(baseCameraPosition);
        runtime.shake = 0;
      }
      camera.lookAt(0, 0, -1.5);

      if (frame % 6 === 0) {
        setTimeLeft(Math.max(0, Math.ceil(runtime.time)));
        setPowerLeft(Math.max(0, runtime.powerUntil - runtime.elapsed));
      }
      frame += 1;
      renderer.render(scene, camera);
      requestId = requestAnimationFrame(tick);
    };

    let requestId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(requestId);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (audioContext && audioContext.state !== "closed") void audioContext.close();
      renderer.dispose();
      apiRef.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [notify]);

  const updateJoystick = (clientX: number, clientY: number, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((clientX - (rect.left + rect.width / 2)) / (rect.width * 0.34), -1, 1);
    const y = THREE.MathUtils.clamp((clientY - (rect.top + rect.height / 2)) / (rect.height * 0.34), -1, 1);
    const length = Math.hypot(x, y);
    const nx = length > 1 ? x / length : x;
    const ny = length > 1 ? y / length : y;
    joystickRef.current = { x: nx, z: ny };
    setJoystick({ x: nx * 34, y: ny * 34 });
  };

  const releaseJoystick = () => {
    joystickPointer.current = null;
    joystickRef.current = { x: 0, z: 0 };
    setJoystick({ x: 0, y: 0 });
  };

  const formatScore = (value: number) => value.toLocaleString("ja-JP");
  const formatTime = (value: number) => `00:${Math.max(0, value).toString().padStart(2, "0")}`;

  return (
    <main className="game-shell" ref={hostRef}>
      <canvas ref={canvasRef} className="game-canvas" aria-label="そば屋のオフィスクラッシュ ゲーム画面" />

      <div className="sun-glow" aria-hidden="true" />
      <header className="hud-top">
        <div className="game-logo" aria-label="そば屋のオフィスクラッシュ">
          <span className="logo-small">そば屋の</span>
          <span>オフィスクラッシュ</span>
        </div>
        <div className="score-card" aria-live="polite">
          <span className="score-label">SCORE</span>
          <strong>{formatScore(score)}</strong>
          <span className={`combo ${combo > 0 ? "combo-active" : ""}`}>COMBO ×{combo}</span>
        </div>
        <div className="top-actions">
          <div className={`timer ${timeLeft <= 10 && status === "playing" ? "timer-danger" : ""}`}>
            <span aria-hidden="true">◷</span> {formatTime(timeLeft)}
          </div>
          <button
            className="sound-button"
            onClick={() => apiRef.current?.toggleSound()}
            aria-label={soundOn ? "効果音をオフ" : "効果音をオン"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button className="pause-button" onClick={() => apiRef.current?.pause()} aria-label={paused ? "再開" : "一時停止"}>
            {paused ? "▶" : "Ⅱ"}
          </button>
        </div>
      </header>

      <aside className={`power-meter ${powerLeft > 0 ? "is-powered" : ""}`} aria-label={`破壊力アップ 残り${Math.ceil(powerLeft)}秒`}>
        <div className="foam"><i /><i /><i /></div>
        <div className="power-glass">
          <div className="power-fill" style={{ height: `${powerLeft > 0 ? Math.max(14, (powerLeft / POWER_DURATION) * 100) : 7}%` }} />
          <div className="beer-bubbles"><i /><i /><i /><i /></div>
        </div>
        <strong>POWER</strong>
        <span>{powerLeft > 0 ? `${Math.ceil(powerLeft)}s` : "BEER!"}</span>
      </aside>

      <div className={`game-toast ${toast ? "show" : ""}`} aria-live="assertive">{toast}</div>

      <div
        className="joystick"
        role="button"
        aria-label="移動ジョイスティック"
        tabIndex={0}
        onPointerDown={(event) => {
          joystickPointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateJoystick(event.clientX, event.clientY, event.currentTarget);
        }}
        onPointerMove={(event) => {
          if (joystickPointer.current === event.pointerId) updateJoystick(event.clientX, event.clientY, event.currentTarget);
        }}
        onPointerUp={releaseJoystick}
        onPointerCancel={releaseJoystick}
      >
        <div className="joystick-arrows" aria-hidden="true">▲<span>◀　▶</span>▼</div>
        <div className="joystick-knob" style={{ transform: `translate(${joystick.x}px, ${joystick.y}px)` }} />
      </div>

      <button
        className={`smash-button ${powerLeft > 0 ? "powered" : ""}`}
        onPointerDown={(event) => {
          event.preventDefault();
          apiRef.current?.smash();
        }}
        aria-label="スマッシュ"
      >
        <span className="fist" aria-hidden="true">✊</span>
        <strong>SMASH!</strong>
      </button>

      {status !== "playing" && (
        <section className="start-overlay" aria-labelledby="start-title">
          <div className="start-card">
            {status === "gameover" && <span className="round-over">TIME UP!</span>}
            <p className="eyebrow">MADOGIWA 45 SECOND CHALLENGE</p>
            <h1 id="start-title"><small>そば屋の</small>オフィスクラッシュ</h1>
            {status === "gameover" ? (
              <div className="final-score">
                <span>FINAL SCORE</span>
                <strong>{formatScore(score)}</strong>
              </div>
            ) : (
              <p className="lead">45秒のルート勝負。強化ゲートの奥にある金の複合機を狙え！</p>
            )}
            <div className="rules">
              <div><span className="rule-icon beer-icon">🍺</span><strong>POWER 6秒</strong><small>体当たり破壊＋強化物へ2ダメージ</small></div>
              <div><span className="rule-icon clock-icon">◷</span><strong>TIME +5</strong><small>時計は各1回だけ・再出現なし</small></div>
              <div><span className="rule-icon copier-icon">▥</span><strong>強化ゲート</strong><small>5回攻撃。奥には高得点エリア</small></div>
            </div>
            <button className="start-button" onClick={() => apiRef.current?.start()}>
              {status === "gameover" ? "もう一度クラッシュ！" : "オフィスに突入！"}
            </button>
            <p className="controls-note">PC：WASD / 矢印で移動・SPACEでスマッシュ　　スマホ：画面のパッドとボタン</p>
          </div>
        </section>
      )}

      {paused && status === "playing" && (
        <section className="pause-overlay">
          <div><strong>PAUSE</strong><button onClick={() => apiRef.current?.pause()}>つづける</button></div>
        </section>
      )}
    </main>
  );
}
