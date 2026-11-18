# Kenney の3Dモデル（CC0）

背景・小物用の3Dモデル。作者は Kenney（https://kenney.nl）。すべて **CC0 1.0（パブリックドメイン）**で、各フォルダの `License.txt` にもそう書いてある。商用利用・改変・再配布が自由で、クレジット表記も不要（記録のためここに書いておく）。

- 取得日: 2026-11-06
- 取得方法: 公式サイトの各ページで「Download」→「Continue without donating」
- 置いたもの: zip の中の `Models/GLB format`（Furniture Kit は `Models/GLTF format`）の中身と、`License.txt`・`Preview.png`
- 色は、各フォルダの `Textures/colormap.png` を GLB が外部ファイルとして参照している（Furniture Kit は材質の色だけで、テクスチャは無い）

ゲームからはコピーせず、ゲームのフォルダから使うモデルだけを相対symlinkで参照する（例: `12_SOBAYA_MUSOU_GODOT/models/kenney/<パック>/<名前>.glb`）。`Textures/` も同じようにリンクする。

| フォルダ | パック（版） | 公式ページ | zip の SHA-256 |
|---|---|---|---|
| `factory-kit` | Factory Kit 3.0 | https://kenney.nl/assets/factory-kit | `7e31fb2308e90304672bd15cd18fa9d9f02c03731a8cbc57a8e3e1c181dfb0a7` |
| `city-kit-industrial` | City Kit (Industrial) 2.0 | https://kenney.nl/assets/city-kit-industrial | `5b381164e5760f3830a2dbee43b972deee38b2a695d091b56e238ab2910c96d2` |
| `car-kit` | Car Kit | https://kenney.nl/assets/car-kit | `fac7dacac5c7874348cf19729af3ef205f3d366493edaf0a827d93f4fdf3d0c4` |
| `city-kit-roads` | City Kit (Roads) 2.2 | https://kenney.nl/assets/city-kit-roads | `374a4552115cbd11b4ec5c930ee31a533562dc78a09af249a655d03f7ea3b959` |
| `city-kit-commercial` | City Kit (Commercial) 2.1 | https://kenney.nl/assets/city-kit-commercial | `f8b09b081c2bb88bcc126e2dec1cb40fd0dad7e7e591b6c26aaefe96fb35276b` |
| `city-kit-suburban` | City Kit (Suburban) 2.0 | https://kenney.nl/assets/city-kit-suburban | `5869c35cf30b1c87bdb2d197b6d325eebadd2ef08ea27f04797e8e08d77a9a39` |
| `mini-shop` | Mini Shop 2.1 | https://kenney.nl/assets/mini-shop | `51f1fafb0f5efdc7aec3af57138665a12aee5610d47bf4108cd8d4bd044a57a2` |
| `furniture-kit` | Furniture Kit 1.0 | https://kenney.nl/assets/furniture-kit | `e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0` |
| `survival-kit` | Survival Kit 2.0 | https://kenney.nl/assets/survival-kit | `c3586341b5932c87eb43d75d915434f47daed168b17ed36a03e8ca9977c7443e` |

## 大きさ

Kenney のモデルは、パックごとに単位がそろっていない（車は長さ約3、家具は1未満、道路キットはさらに小さい）。置くときは高さか横幅を指定して拡大する（`12_SOBAYA_MUSOU_GODOT/stage_base.gd` の `_prop()`）。
