import type { SkinnedCharacterDefinition } from "./skinned-character-kit";

/**
 * そば屋の採用3Dモデル（共同開発リポジトリ K9i-0/madogiwa-multimedia-universe の hazard_adopted、スマホ軽量版）。
 * NG変更要素のジョッキは別モデルで、右手の PropSocket.R に持たせる。
 */
export const SOBAYA_CHARACTER: SkinnedCharacterDefinition = {
  id: "sobaya",
  assetUrl: "./models/sobaya.glb?v=models3d-mobile-20260919",
  modelName: "sobaya-adopted-model",
  // 等身大より大きめ（俯瞰でも仮面とジョッキが読める大きさ）
  height: 2.6,
  // glTF の正面は +Z。ゲームは -Z を前とするので反転する
  rotationY: Math.PI,
  clips: {
    idle: "CharacterSheet_MugStand",
    move: "Hybrid_MugRun",
    moveTimeScale: 1.15,
    // 叩きつけ（1.6秒）。0.42秒で肩口に振りかぶり、0.9秒あたりでジョッキが前下方へ振り下ろされる
    smash: { name: "Hybrid_MugSmash", startAt: 0.42, impactAt: 0.9 },
  },
  prop: {
    assetUrl: "./models/beer_mug.glb?v=models3d-20261104",
    socket: "PropSocket.R",
    grip: "Grip",
    morphs: { MugGrip: 1 },
  },
};
