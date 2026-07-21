# Character model sources

このディレクトリには、Voxel Character Lab用キャラクターの編集可能な
Blenderマスターと確認用プレビューを保存します。

| キャラクター | Blenderマスター | Web用GLB | リグ |
|---|---|---|---|
| たこさん | `takosan_voxel_master.blend` | `../public/models/takosan.glb` | 両腕＋触手6本 |
| 無職やめ太郎 | `yametaro_voxel_master.blend` | `../public/models/yametaro.glb` | 両腕＋両脚 |

どちらも第三者の3D素体を使わず、プロジェクトのキャラクター参照画像を基に
Blender Pythonで生成したオリジナル形状です。

## デザイン固定事項

- たこさん：黒いフード付きローブ、白い顔、黒い丸目、触手、人間の腕2本
- 無職やめ太郎：大きな頭、黒い横分け髪、丸メガネ、紫シャツ

共通形状・材質・リグ処理は `../tools/voxel_character_kit.py`、キャラクター固有の
形状は各 `build_*_voxel_model.py` に分離しています。
