# Voxel Character Kit v1

このゲームのキャラクターは、形状を無理に共通化せず、GLB内の回転軸と
Three.jsのアクションAPIを共通化します。太い人型のそば屋、頭身の低い
やめ太郎、触手で移動するたこさんを同じゲームコードから操作できます。

## 構成

- `tools/voxel_character_kit.py`: Blender用のボックス生成・材質・共通リグ
- `tools/build_sobaya_voxel_model.py`: そば屋固有の形状・色・仮面・ジョッキ
- `app/characters/voxel-character-kit.ts`: GLB読込と歩行・スマッシュ
- `app/characters/sobaya.ts`: そば屋固有のサイズ・向き・モーション調整値

## GLBの共通ノード

| ノード | 用途 | 必須 |
|---|---|---|
| `VoxelRig_ArmPrimary` | 武器や素手で攻撃する腕 | ○ |
| `VoxelRig_ArmSecondary` | 反対腕・カウンタースイング | 任意 |
| `VoxelRig_LegLeft` | 左脚の歩行 | 二足キャラ |
| `VoxelRig_LegRight` | 右脚の歩行 | 二足キャラ |
| `VoxelRig_Locomotion_00...` | 触手・裾・車輪などの移動部品 | 任意 |
| `VoxelRig_PrimaryHandSocket` | 武器差し替え用の接続点 | 任意 |

脚と触手は任意です。`VoxelRig_ArmPrimary`だけあればスマッシュを再利用でき、
脚があれば二足歩行、`VoxelRig_Locomotion_*`があれば位相をずらした揺れが
自動で加わります。

## やめ太郎を追加する場合

1. 新しいBlender生成スクリプトで頭・紫シャツ・丸メガネなど固有形状を作る。
2. `VoxelRigDefinition`へ両腕・両脚の部品プレフィックスと肩・腰位置を渡す。
3. GLBを出力し、`app/characters/yametaro.ts`へURL・縮尺・モーション値を書く。
4. ゲーム側はキャラクター定義を差し替える。歩行とスマッシュの再実装は不要。

## たこさんを追加する場合

1. フード、ローブ、人間の腕2本、各触手を固有形状として作る。
2. 攻撃腕を`primary_arm`、反対腕を`secondary_arm`へ割り当てる。
3. 脚は省略し、各触手を`locomotion`へ登録する。出力名は
   `VoxelRig_Locomotion_00`、`01`...になる。
4. `app/characters/takosan.ts`では歩行角度を小さく、触手揺れの角度を大きくする。

## 検証

```bash
blender --background --python tools/validate_voxel_character.py -- \
  --input models/sobaya.glb --rig-type biped
```

ボクセルモデルを別ゲームで使う場合は、GLBをコピーせず`04_GAME_ASSETS/voxel/models/`への
相対symlinkを`public/models/`に張り、キャラクター定義と`voxel-character-kit.ts`を
ゲーム側へ用意します。
