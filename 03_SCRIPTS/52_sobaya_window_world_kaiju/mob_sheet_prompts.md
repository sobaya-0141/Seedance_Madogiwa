# モブキャラクターシート作成プロンプト（52 窓の世界）

今のモブシートは `Shocchi_*_sheet.png` の正面1コマを切り出して2倍にしたもので、顔が約70ピクセルしかない。
480p版では服はシートどおりに出たが、顔が「しょっち」に似ず一般的な顔になった。
1人1枚の高解像度シート（正面・斜め・後ろ・顔のアップの4面）にして、顔と後ろ姿を拘束する。

## 共通の作り方

- 1人1枚。出力は横長（3:2 か 16:9）、なるべく高解像度（長辺2000px以上）。
- 添付する参照画像: そのキャラの元シート（下の各項目に記載）。可能なら、しょっちの元の人物写真も添付する（顔の正本）。
- 保存先とファイル名: `03_SCRIPTS/52_sobaya_window_world_kaiju/` に各項目のファイル名で置く（今のシートを上書きしてよい。元の切り出しは `Shocchi_*_sheet.png` からいつでも作り直せる）。
- 受け取ったら Claude が Read で開き、`27_Shocchi.md` のシート照合チェックリストと各項目の PRESERVE を1項目ずつ PASS/FAIL 判定してから使う。
- **顔の固定（必須）**: 全モブは「しょっち本人」の顔を使う。添付された元の人物写真（Image 1〜3）を顔の正本とし、`Shocchi_*_sheet.png` は髪型・服装・体格・持ち物の参照に使う。一般的な別人の顔へ置き換えない。

---

## 1. 住民の大人 → `Mob_resident_adult_sheet.png`

添付: `02_CHARACTERS/Shocchi_parent_sheet.png`（PARENT 01 = 左上のコマ）

```text
A photorealistic studio character reference sheet of ONE real Japanese man in his thirties, shown four times side by side in a single horizontal image on a plain seamless mid-gray backdrop with soft even studio lighting: (1) full body from the front, (2) full body in three-quarter view turned to his left, (3) full body from directly behind, (4) a large head-and-shoulders close-up of his face from the front. It is the same person in all four views, photographed like a casting photo, natural skin texture, sharp focus.
PRESERVE (from the man in the top-left panel "PARENT 01" of the attached sheet): his exact face - the same face shape, eyes, eyebrows, nose, mouth, skin tone and his big warm open smile; short black hair parted in the center, also visible from behind as a neat short black back of the head; slim build; a plain black crew-neck short-sleeve T-shirt with a small chest pocket; black slim-fit jeans; white low-top sneakers; in his RIGHT hand, in every view, one clear plastic cup of milk tea with amber-brown marbled tea, a white foam top, a clear dome lid, a red straw, black tapioca pearls at the bottom and a plain red vertical label with no lettering.
do NOT carry over: the other nine people, the waving pose, the beige background, the panel borders, the "PARENT" text labels or any other text. No text, numbers, logos or watermarks anywhere in the image.
```

## 2. 住民の子ども → `Mob_resident_child_sheet.png`

添付: `02_CHARACTERS/Shocchi_child_sheet.png`（CHILD 01 = 左上のコマ）

```text
A photorealistic studio character reference sheet of ONE real Japanese boy of about eight years old with natural child proportions, shown four times side by side in a single horizontal image on a plain seamless mid-gray backdrop with soft even studio lighting: (1) full body from the front, (2) full body in three-quarter view turned to his left, (3) full body from directly behind, (4) a large head-and-shoulders close-up of his face from the front. It is the same child in all four views, photographed like a casting photo, natural skin texture, sharp focus.
PRESERVE (from the boy in the top-left panel "CHILD 01" of the attached sheet): his exact face - the same face shape, eyes, eyebrows, nose, mouth, skin tone and his big open smile; a straight glossy black bowl cut with full bangs, round and full at the back of the head; a mustard-yellow pullover hoodie with a front pocket; khaki cargo shorts; white crew socks with two navy stripes; navy low-top sneakers; a navy backpack with both straps on his shoulders, clearly visible in the back view; in his RIGHT hand, in every view, one clear plastic cup of milk tea with amber-brown marbled tea, a white foam top, a clear dome lid, a red straw, black tapioca pearls at the bottom and a plain red vertical label with no lettering.
do NOT carry over: the other nine children, the waving pose, the beige background, the panel borders, the "CHILD" text labels or any other text. No text, numbers, logos or watermarks anywhere in the image.
```

## 3. 住民のおじいさん → `Mob_resident_grandpa_sheet.png`

添付: `02_CHARACTERS/Shocchi_grandfather_sheet.png`（GRANDFATHER 01 = 左上のコマ）

```text
A photorealistic studio character reference sheet of ONE real Japanese man in his seventies, shown four times side by side in a single horizontal image on a plain seamless mid-gray backdrop with soft even studio lighting: (1) full body from the front, (2) full body in three-quarter view turned to his left, (3) full body from directly behind, (4) a large head-and-shoulders close-up of his face from the front. It is the same person in all four views, photographed like a casting photo, natural skin texture with age lines, sharp focus.
PRESERVE (from the man in the top-left panel "GRANDFATHER 01" of the attached sheet): his exact face - the same face shape, eyes, eyebrows, nose, mouth, skin tone and his big warm open smile, with the wrinkles of a man in his seventies; wavy silver-gray hair of medium length, also gray at the back of the head; slim build; a cream cable-knit cardigan with brown buttons and two pockets over a red-and-navy plaid collared shirt; brown corduroy trousers; brown leather lace-up shoes; in his LEFT hand, in every view, one clear plastic cup of milk tea with amber-brown marbled tea, a white foam top, a clear dome lid, a red straw, black tapioca pearls at the bottom and a plain red vertical label with no lettering.
do NOT carry over: the other nine people, the waving pose, the beige background, the panel borders, the "GRANDFATHER" text labels or any other text. No text, numbers, logos or watermarks anywhere in the image.
```

## 4. 住民のおばあさん → `Mob_resident_grandma_sheet.png`

添付: `02_CHARACTERS/Shocchi_grandmother_sheet.png`（GRANDMOTHER 01 = 左上のコマ）

```text
A photorealistic studio character reference sheet of ONE real Japanese woman in her seventies, shown four times side by side in a single horizontal image on a plain seamless mid-gray backdrop with soft even studio lighting: (1) full body from the front, (2) full body in three-quarter view turned to her left, (3) full body from directly behind, (4) a large head-and-shoulders close-up of her face from the front. It is the same person in all four views, photographed like a casting photo, natural skin texture with age lines, sharp focus.
PRESERVE (from the woman in the top-left panel "GRANDMOTHER 01" of the attached sheet): her exact face - the same face shape, eyes, eyebrows, nose, mouth, skin tone and her big warm open smile, with the wrinkles of a woman in her seventies; short silver-gray hair, also short and gray at the back of the head; slim build; a cream chunky-knit long cardigan over a cream blouse with a small red-and-brown floral print; beige straight trousers; brown leather loafers; in her LEFT hand, in every view, one clear plastic cup of milk tea with amber-brown marbled tea, a white foam top, a clear dome lid, a red straw, black tapioca pearls at the bottom and a plain red vertical label with no lettering.
do NOT carry over: the other nine people, the waving pose, the beige background, the panel borders, the "GRANDMOTHER" text labels or any other text. No text, numbers, logos or watermarks anywhere in the image.
```

## 5. 警察官 → `Mob_police_sheet.png`

添付: `02_CHARACTERS/Shocchi_police_sheet.png`（POLICE 01 = 左のコマ）

```text
A photorealistic studio character reference sheet of ONE real Japanese police officer in his thirties, shown four times side by side in a single horizontal image on a plain seamless mid-gray backdrop with soft even studio lighting: (1) full body from the front, (2) full body in three-quarter view turned to his left, (3) full body from directly behind, (4) a large head-and-shoulders close-up of his face from the front, wearing his cap. It is the same person in all four views, photographed like a casting photo, natural skin texture, sharp focus.
PRESERVE (from the man in the left panel "POLICE 01" of the attached sheet): his exact face - the same face shape, eyes, eyebrows, nose, mouth, skin tone and his big open smile; short black hair under the cap; a navy peaked police cap with a black visor and a plain gold badge with no lettering or emblem; a navy long-sleeve uniform shirt with two buttoned chest pockets and shoulder epaulettes; a navy tie; a black radio microphone with a coiled cord clipped to his LEFT shoulder; a black duty belt with a silver buckle and a black pouch on his RIGHT hip; navy uniform trousers; black leather shoes; in his RIGHT hand, in every view, one clear plastic cup of milk tea with amber-brown marbled tea, a white foam top, a clear dome lid, a red straw, black tapioca pearls at the bottom and a plain red vertical label with no lettering.
do NOT carry over: the other two officers, the hand-on-hip pose, the beige background, the panel borders, the "POLICE" text labels or any other text. No real police insignia, no lettering on the badge, no text, numbers, logos or watermarks anywhere in the image.
```
