# Voxel Character Lab

オフィスクラッシュから独立した、ボクセルキャラクターのモデル・リグ・
基本アクション確認用Three.jsプロジェクトです。

## 確認できる項目

- Idle、Walk、Smash、Power Smash
- 再生速度とループ
- マウス／タッチでの回転・ズーム
- 共通リグの回転軸表示
- キャラクターごとの体型、リグ方式、デザイン固定事項

現在はそば屋のGLBを実モデルとして登録しています。たこさんと無職やめ太郎は
参照画像、アクション調整値、モデル配置先まで登録済みです。

```bash
npm run dev
npm test
```

新しいキャラクターは `app/character-catalog.ts` に定義を追加し、GLBを
`public/models/` に置きます。共通ノードは `VoxelRig_ArmPrimary`、
`VoxelRig_ArmSecondary`、`VoxelRig_LegLeft`、`VoxelRig_LegRight`、
`VoxelRig_Locomotion_*` です。
