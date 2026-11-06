import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * 採用3Dモデル（04_GAME_ASSETS/models3d、骨格＋アニメーション付き）をゲームで動かす共通部品。
 * 待機・移動はクリップをループ再生し、スマッシュは攻撃クリップの「振りかぶり後半〜着弾」を
 * ゲームの着弾タイミングに合わせて早回しで再生する。
 */

export type SmashClip = {
  name: string;
  /** 再生を始める位置（秒）。振りかぶりの前半を飛ばす */
  startAt: number;
  /** クリップ内で打撃が当たる時刻（秒） */
  impactAt: number;
};

export type PropAttachment = {
  assetUrl: string;
  /** 小道具を持たせる骨（ソケット） */
  socket: string;
  /** 小道具の持ち手ノード。これを socket の原点に合わせる */
  grip: string;
  /** 本体側で値を入れるモーフ（手の握りなど） */
  morphs?: Record<string, number>;
};

export type SkinnedCharacterDefinition = {
  id: string;
  assetUrl: string;
  modelName: string;
  /** 足元から頭頂までの高さ（ゲーム内の単位） */
  height: number;
  rotationY: number;
  clips: {
    idle: string;
    move: string;
    /** 移動クリップの再生速度 */
    moveTimeScale: number;
    smash: SmashClip;
  };
  prop?: PropAttachment;
};

export type CharacterActionController = {
  /** impactDelay 秒後に着弾するようにスマッシュを再生する */
  triggerSmash: (powered: boolean, impactDelay: number) => void;
  update: (dt: number, elapsed: number, moving: boolean) => void;
};

export type LoadedCharacter = {
  model: THREE.Object3D;
  actions: CharacterActionController;
};

const FADE = 0.12;

export function createActionController(
  mixer: THREE.AnimationMixer,
  clips: THREE.AnimationClip[],
  definition: SkinnedCharacterDefinition,
): CharacterActionController {
  const action = (name: string) => {
    const clip = THREE.AnimationClip.findByName(clips, name);
    if (!clip) throw new Error(`${definition.id}: clip ${name} not found`);
    return mixer.clipAction(clip);
  };
  const idle = action(definition.clips.idle);
  const move = action(definition.clips.move);
  move.timeScale = definition.clips.moveTimeScale;
  const smash = action(definition.clips.smash.name);
  smash.setLoop(THREE.LoopOnce, 1);
  smash.clampWhenFinished = true;

  let current = idle;
  current.play();
  let smashRemaining = 0;

  const fadeTo = (next: THREE.AnimationAction, duration = FADE) => {
    if (next === current) return;
    next.reset().setEffectiveWeight(1).play();
    current.crossFadeTo(next, duration, false);
    current = next;
  };

  return {
    triggerSmash: (powered, impactDelay) => {
      const { startAt, impactAt } = definition.clips.smash;
      // 振りかぶりの後半から再生し、impactDelay 秒後にクリップの着弾フレームが来る速さにする
      const scale = (impactAt - startAt) / impactDelay;
      smash.reset();
      smash.time = startAt;
      smash.timeScale = scale * (powered ? 0.92 : 1);
      smash.setEffectiveWeight(1).play();
      if (current !== smash) current.crossFadeTo(smash, 0.06, false);
      current = smash;
      // 着弾後すこし姿勢を残してから戻す
      smashRemaining = impactDelay + 0.22;
    },
    update: (dt, _elapsed, moving) => {
      if (smashRemaining > 0) {
        smashRemaining -= dt;
        if (smashRemaining <= 0) fadeTo(moving ? move : idle, 0.18);
      } else {
        fadeTo(moving ? move : idle);
      }
      mixer.update(dt);
    },
  };
}

type LoadOptions = {
  definition: SkinnedCharacterDefinition;
  parent: THREE.Object3D;
  onReady?: (character: LoadedCharacter) => void;
  onError?: (error: unknown) => void;
};

export function loadSkinnedCharacter({ definition, parent, onReady, onError }: LoadOptions) {
  const loader = new GLTFLoader();
  const body = loader.loadAsync(definition.assetUrl);
  const prop = definition.prop ? loader.loadAsync(definition.prop.assetUrl) : Promise.resolve(undefined);

  Promise.all([body, prop])
    .then(([gltf, propGltf]) => {
      const model = gltf.scene;
      model.name = definition.modelName;
      model.rotation.y = definition.rotationY;

      // 高さをそろえる（足元を原点に）
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model, true);
      const scale = definition.height / Math.max(box.max.y - box.min.y, 1e-6);
      model.scale.setScalar(scale);
      model.position.y = -box.min.y * scale;

      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          // スキンメッシュはバインド姿勢の範囲で判定されるので、動作中に消えないよう外す
          object.frustumCulled = false;
        }
      });

      if (definition.prop && propGltf) attachProp(model, propGltf.scene, definition.prop);

      parent.add(model);
      const mixer = new THREE.AnimationMixer(model);
      onReady?.({ model, actions: createActionController(mixer, gltf.animations, definition) });
    })
    .catch((error) => onError?.(error));
}

function attachProp(model: THREE.Object3D, propScene: THREE.Object3D, prop: PropAttachment) {
  // GLTFLoader はノード名の「.」などを取り除く（PropSocket.R → PropSocketR）ので同じ規則で引く
  const socket = model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(prop.socket));
  if (!socket) throw new Error(`socket ${prop.socket} not found`);
  const item = propScene;
  const grip = item.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(prop.grip));
  item.updateMatrixWorld(true);
  if (grip) {
    // 持ち手（grip）がソケットの原点に来るよう、小道具全体を grip の逆変換で置く
    const inverse = grip.matrixWorld.clone().invert();
    inverse.decompose(item.position, item.quaternion, item.scale);
  }
  item.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.frustumCulled = false;
      if (object.name === "Carbonation") object.visible = false;
    }
  });
  socket.add(item);

  if (prop.morphs) {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.morphTargetDictionary || !object.morphTargetInfluences) return;
      for (const [name, value] of Object.entries(prop.morphs!)) {
        const index = object.morphTargetDictionary[name];
        if (index !== undefined) object.morphTargetInfluences[index] = value;
      }
    });
  }
}
