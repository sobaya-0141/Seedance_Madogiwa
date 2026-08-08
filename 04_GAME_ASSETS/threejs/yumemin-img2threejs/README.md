# Yumemin — img2threejs procedural model

`02_CHARACTERS/Yumemin_3D_turnaround_v3.png` と `02_CHARACTERS/08_Yumemin.md` を基に、img2threejs の仕様化・コード生成・多方向確認フローで作成した手続き型 Three.js モデルです。

v3では、正球の胴体、顔の中心から前へ伸びるバク状の鼻、後半球に沿う白い「お包み」、物理形状としての目と耳を採用しています。元の2Dイラストにある黒い輪郭線は3D形状にしていません。

この成果物は GLB ではなく、`THREE.Group` を返す TypeScript ファクトリです。既存の正典ボクセルモデル `04_GAME_ASSETS/voxel/models/yumemin.glb` は変更していません。

## 主なファイル

- `src/createYumeminModel.ts` — 調整済みのモデルファクトリ
- `src/createYumeminModel.generated.ts` — img2threejs が生成した初期ブロックアウト
- `object-sculpt-spec-v3.json` — 最新設定画に対応する造形仕様
- `object-sculpt-spec.json` — 旧2Dアイコン版の造形仕様（履歴）
- `preview/` — Vite製の回転確認ビューア
- `review-v3/qa-contact-sheet.png` — 正面・斜め・左右・背面の最終確認
- `review-v3/front-comparison.png` — v3設定画と正面レンダーの比較
- `review-v3/QA.md` — 検証結果と残る近似
- `review-v3/part-coverage.json` — 名前付き部品の対応検査
- `review-v3/multi-angle-diagnostic.json` — 平面化していないことの多方向検査

## 実行

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

本番ビルド:

```bash
npm run typecheck
npm run build
```

## 利用例

```ts
import {
  createYumeminLights,
  createYumeminModel,
  type YumeminRuntime,
} from './src/createYumeminModel';

const yumemin = createYumeminModel({
  includeMallet: false,
});

scene.add(yumemin);
scene.add(createYumeminLights());

const runtime = yumemin.userData.sculptRuntime as YumeminRuntime;

// elapsedSeconds と 0〜1 の叩き進行度
runtime.tick(elapsedSeconds, bonkProgress);

runtime.setMalletVisible(true);
runtime.setExploded(0);
```

## ランタイム構造

- 安定した名前付きノード: body、rear wrap、tail、ears、eyes、trunk、mallet arm/handle/head
- ソケット: `trunk-tip`、`mallet-impact`
- コライダー情報: body、trunk、tail、mallet
- 分離グループ: `yumemin-body`、`mallet`
- クリック対象から親パーツを求める `resolvePart()`
- ホバー、鼻揺れ、木槌スイングに対応する `tick()`

デザインロックとして、正球の青い胴体、瞳孔のない黒い点目、小さな耳、中心線上のバク状の鼻、白い布のお包み、黒い描画輪郭線なし、小さな青い尻尾、脚のない飛行シルエットを `userData.designLocks` に記録しています。木槌はアクション時だけ表示する任意プロップです。
