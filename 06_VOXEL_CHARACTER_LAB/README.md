# Voxel Character Lab

オフィスクラッシュから独立した、ボクセルキャラクターのモデル・リグ・
基本アクション確認用Three.jsプロジェクトです。

## 確認できる項目

- Idle、Walk、Smash、Power Smash
- 再生速度とループ
- マウス／タッチでの回転・ズーム
- 共通リグの回転軸表示
- キャラクターごとの体型、リグ方式、デザイン固定事項

そば屋、たこさん、無職やめ太郎の3体を実モデルとして登録しています。
たこさんは6本の触手チャンネル、他2体は二足歩行リグを使用します。

```bash
npm run dev
npm test
```

新しいキャラクターは `app/character-catalog.ts` に定義を追加し、GLBを
`public/models/` に置きます。共通ノードは `VoxelRig_ArmPrimary`、
`VoxelRig_ArmSecondary`、`VoxelRig_LegLeft`、`VoxelRig_LegRight`、
`VoxelRig_Locomotion_*` です。

## モデル再生成

```bash
blender --background --python tools/build_takosan_voxel_model.py -- \
  --face-texture model_source/textures/takosan_face_albedo_v2.png \
  --robe-texture model_source/textures/takosan_robe_front_albedo.png \
  --output-glb public/models/takosan.glb \
  --output-blend model_source/takosan_voxel_master.blend \
  --preview model_source/takosan_voxel_preview.png

blender --background --python tools/build_yametaro_voxel_model.py -- \
  --face-texture model_source/textures/yametaro_face_albedo_v2.png \
  --shirt-texture model_source/textures/yametaro_shirt_front_albedo_v2.png \
  --output-glb public/models/yametaro.glb \
  --output-blend model_source/yametaro_voxel_master.blend \
  --preview model_source/yametaro_voxel_preview.png
```

頭部はマイクラ寄りの完全な立方体、胴体もベベルなしの直方体です。顔と服は
共通の前面UVパネルへimagegen生成アルベドを貼り、テクスチャだけ交換できます。
やめ太郎の襟・ボタン・植物模様は1枚のシャツ画像へ統合しています。
