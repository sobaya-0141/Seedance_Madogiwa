# Character model sources

このディレクトリには、Voxel Character Lab用キャラクターの編集可能な
Blenderマスターと確認用プレビューを保存します。

| キャラクター | Blenderマスター | Web用GLB | 顔 | 服 | リグ |
|---|---|---|---|---|---|
| たこさん | `takosan_voxel_master.blend` | `../public/models/takosan.glb` | `textures/takosan_face_albedo_v2.png` | `textures/takosan_robe_front_albedo.png` | 両腕＋触手6本 |
| 無職やめ太郎 | `yametaro_voxel_master.blend` | `../public/models/yametaro.glb` | `textures/yametaro_face_albedo_v2.png` | `textures/yametaro_shirt_front_albedo_v2.png` | 両腕＋両脚 |

どちらも第三者の3D素体を使わず、プロジェクトのキャラクター参照画像を基に
Blender Pythonで生成したオリジナル形状です。

## デザイン固定事項

- たこさん：立方体頭、黒いフード付きローブ、白い顔、黒い丸目、触手、人間の腕2本
- 無職やめ太郎：立方体頭、黒い横分け髪、黒い丸メガネ、黒目のない純白レンズ、
  ピンク頬、紫シャツ

共通形状・材質・リグ処理は `../tools/voxel_character_kit.py`、キャラクター固有の
形状は各 `build_*_voxel_model.py` に分離しています。

## 顔テクスチャ方式

顔の模様は目・メガネ・頬などを別メッシュにせず、立方体頭部前面の薄い共通
UVパネルへ1枚のアルベドとして貼っています。服も同じ方式で、やめ太郎の
襟・ボタン・植物模様は単一の四角い胴体パネルです。テクスチャはBlenderに
パックされ、GLBにも埋め込まれます。

生成条件と参照元は `textures/IMAGEGEN_FACE_PROMPTS.md` を参照してください。
