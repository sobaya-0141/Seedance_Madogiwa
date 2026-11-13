# そば屋のオフィスクラッシュ

窓際族のそば屋を操作し、オフィス備品を壊して得点を競う45秒スコアアタックゲームです。

## 遊び方

- PC: `WASD` または矢印キーで移動、`Space` でスマッシュ
- スマホ: 左のジョイスティックで移動、右のボタンでスマッシュ
- 制限時間: 45秒固定。時計を取っても時間は増えません
- ビール: 最大2個まで保持。次のスマッシュを広範囲・2ダメージのMEGA SMASHに変更
- 時計: ゲーム時間を止めず、コンボの失効だけを4秒間止めるCOMBO FREEZE
- 強化ゲート: 6回攻撃が必要。奥の高得点エリアを封鎖
- 金の複合機: 4ダメージで破壊できる2,500点の最高得点オブジェクト
- PERFECT SMASH: 着弾中心で破壊すると、そのオブジェクトの得点が1.25倍
- MULTI BREAK: 1回のスマッシュで2個以上を同時破壊すると追加得点
- AREA CLEAR: 4エリアごとに全破壊すると800点。全破壊時は残り秒数×300点
- リザルト: 称号、最大コンボ、PERFECT数などを表示し、Xや端末の共有機能へ投稿可能
- 効果音: スマッシュ、破壊、金属ヒット、アイテム取得に対応

## 開発

```bash
npm install
npm run dev
npm test
```

Three.js、React、vinextで構成されています。

## そば屋3Dモデル

- Web用: `public/models/sobaya.glb`（共用アセット置き場 `../04_GAME_ASSETS/models3d/mobile/sobaya.glb` への相対symlink）。共同開発リポジトリ K9i-0/madogiwa-multimedia-universe の採用モデル（hazard_adopted）のスマホ軽量版で、骨格とアニメーション（104本）が入っている
- ジョッキ: `public/models/beer_mug.glb`（`../04_GAME_ASSETS/models3d/props/beer_mug.glb` への相対symlink）。NG変更要素なので、右手の骨 `PropSocket.R` に必ず持たせる。持ち手の `Grip` ノードを骨の原点に合わせ、本体の `MugGrip` モーフで手を握らせる
- 取得元とモデルの情報は `../04_GAME_ASSETS/models3d/README.md` を参照

## キャラクターの動かし方

`app/characters/skinned-character-kit.ts` が共通部品、`app/characters/sobaya.ts` がそば屋の設定です。

- 待機は `CharacterSheet_MugStand`、移動中は `Hybrid_MugRun` をループ再生する
- スマッシュは `Hybrid_MugSmash`（1.6秒）を0.42秒（肩口に振りかぶった姿勢）から再生し、ボタンを押してから0.17秒後（`SMASH_IMPACT_DELAY`）に0.9秒の振り下ろしのフレームが来るよう早回しする。破壊判定と効果音も同じ0.17秒後に起きる
- GLBの読み込み前と読み込みに失敗したときは、コードで組んだ簡易モデルを表示する

`npm test` の `tests/character-actions.test.mjs` で、着弾フレームの同期と待機・移動・スマッシュの切り替えを確かめています。
