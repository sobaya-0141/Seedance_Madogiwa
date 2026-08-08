# QA

## 結果

- TypeScript型検査: 合格
- Vite本番ビルド: 合格
- npm監査: 既知の脆弱性0
- img2threejs strict-quality仕様検証: 合格
- パーツカバレッジ: 仕様コンポーネント欠落0、警告0、未命名メッシュ0
- 多方向ボリューム検査: 合格（平面化・側面崩壊なし）
- 実行時規模: 23,204 triangles、20 draw calls
- 実行時境界: 3.021 × 2.159 × 1.322

## 視覚確認

- AI視覚レビュー: 0.83
- 原画と正面レンダーの輪郭アスペクト差: 3.94%
- 原画と正面レンダーの画面内スケール差: 0.93%
- deterministic silhouette IoU: 0.7815

img2threejs の厳格な Tier-1 輪郭ゲートは IoU 0.85 を要求するため、パイプライン状態は `stop` として正直に記録しています。残差は主に、単一の平面JPEG輪郭と、側面・背面も成立する立体モデルの透視投影との差です。ゲートを通すための平面カード化や原画テクスチャ貼り付けは行っていません。

視覚成果物:

- `qa-contact-sheet.png`
- `blockout-comparison.png`
- `front-match.png`
- `front.png`
- `three-quarter.png`
- `left.png`
- `right.png`
- `back.png`

機械可読結果:

- `model-stats.json`
- `parts-manifest.json`
- `part-coverage.json`
- `feature-reviews.json`
