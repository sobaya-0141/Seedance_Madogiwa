# Voxel Character Lab

オフィスクラッシュから独立した、ボクセルキャラクターのモデル・リグ・
基本アクション確認用Three.jsプロジェクトです。

## 確認できる項目

- Idle、Walk、Smash、Power Smash
- 再生速度とループ
- マウス／タッチでの回転・ズーム
- 共通リグの回転軸表示
- キャラクターごとの体型、リグ方式、デザイン固定事項

そば屋、たこさん、とーくん、よーたん、福ちゃん、無職やめ太郎、窓際王おかやまん、
ゆめみんの全8体を実モデルとして登録しています。たこさんは6本の触手チャンネル、
おかやまんはスクリーン1軸、ゆめみんは木槌アーム＋鼻の揺れ、他5体は二足歩行リグを
使用します。

```bash
npm run dev
npm test
```

新しいキャラクターは `app/character-catalog.ts` に定義を追加し、共用アセット
置き場 `../04_GAME_ASSETS/voxel/models/` のGLBへの相対symlinkを
`public/models/` に張ります。共通ノードは `VoxelRig_ArmPrimary`、
`VoxelRig_ArmSecondary`、`VoxelRig_LegLeft`、`VoxelRig_LegRight`、
`VoxelRig_Locomotion_*` です。

## モデル再生成

モデル・テクスチャ・ビルドスクリプトは全ゲーム共用の
`../04_GAME_ASSETS/voxel/` に集約されています。再生成手順は
`../04_GAME_ASSETS/voxel/README.md` を参照してください。

頭部はマイクラ寄りの完全な立方体、胴体もベベルなしの直方体です。顔と服は
共通の前面UVパネルへimagegen生成アルベドを貼り、テクスチャだけ交換できます。
やめ太郎の襟・ボタン・植物模様は前面画像へ、背面へ回り込む襟と植物模様は
独立した背面画像へ統合しています。後頭部の髪とメガネのつるは形状で表現します。
