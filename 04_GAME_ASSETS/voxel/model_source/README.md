# Character model sources

共用ボクセルモデルの編集用Blenderマスター・テクスチャ・承認済みターンアラウンド・確認用レンダーを保存します。

| キャラクター | Blenderマスター | Web用GLB | テクスチャ | リグ |
|---|---|---|---|---|
| そば屋 | `sobaya_voxel_master.blend` | `../models/sobaya.glb` | 仮面: `textures/sobaya_mask_albedo_voxel.png` | 両腕＋両脚＋ハンドソケット |
| たこさん | `takosan_voxel_master.blend` | `../models/takosan.glb` | 顔: `textures/takosan_face_albedo_v2.png` / ローブ: `textures/takosan_robe_front_albedo.png` | 両腕＋触手6本 |
| 無職やめ太郎 | `yametaro_voxel_master.blend` | `../models/yametaro.glb` | 顔: `textures/yametaro_face_albedo_v2.png` / シャツ前: `textures/yametaro_shirt_front_albedo_v2.png` / シャツ後: `textures/yametaro_shirt_back_albedo_v1.png` | 両腕＋両脚 |

いずれも第三者の3D素体を使わず、`02_CHARACTERS/` のキャラクター参照画像を基に
Blender Pythonで生成したオリジナル形状です。

## 顔テクスチャ方式

顔の模様は目・メガネ・頬などを別メッシュにせず、立方体頭部前面の薄い共通
UVパネルへ1枚のアルベドとして貼っています。服も同じ方式で、前面・背面の
浅い四角パネルにテクスチャを貼り、胴体そのものは単一の直方体を維持しています。
テクスチャはBlenderにパックされ、GLBにも埋め込まれます。

- 承認済みの4方向お手本: `concepts/<キャラ>-turnaround-<日付>/`
- モデルから再生成した正面・左・背面・右の確認レンダー: `previews/<キャラ>-<日付>/`
- テクスチャ生成条件: `textures/IMAGEGEN_PROMPT.md`（そば屋）, `textures/IMAGEGEN_FACE_PROMPTS.md`（たこさん・やめ太郎）

## デザイン固定事項

各キャラのNG変更（変えてはいけないデザイン要素）は `02_CHARACTERS/*.md` が正典です。
モデル再生成時も必ず順守してください。
