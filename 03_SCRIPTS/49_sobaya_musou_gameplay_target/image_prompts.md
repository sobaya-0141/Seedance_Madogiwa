# そば屋無双 理想のゲームプレイ映像 — 参照画像の生成プロンプト

画像生成AI（Nano Banana / GPT Image / Midjourney など）にそのまま貼れるように英語で書いてある。

- 推奨のアスペクト比は **16:9（横長）**。解像度はできるだけ高く（2K以上）
- どの画像も**画風をそろえる**ため、先頭の画風の一文は全プロンプト共通にしてある。1枚目ができたら、2枚目以降はその1枚目を「画風の参考」として添付すると、そろいやすい
- 文字・ラベル・ロゴが入った画像は動画に文字が漏れるので使えない。もし入ってしまったら作り直すか、文字のない部分だけにしてほしい
- できた画像はこのフォルダに入れるか、チャットに貼ってほしい（ファイル名はこちらで付け直す）

---

## 0. そば屋（ゲームCG版・任意だが推奨）→ `Sobaya_gamecg_sheet.png`

**必ず `02_CHARACTERS/Sobaya_sheet.png` を参照画像として添付して生成する。**

```
Character turnaround model sheet of the SAME character as the attached reference image, re-rendered as a high-end real-time 3D character from a modern AAA console action game (Unreal Engine 5 quality, physically based materials, soft studio lighting, subtle ambient occlusion, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the head and mask. Plain neutral mid-gray studio background. PRESERVE exactly from the reference: a hard glossy white full-face mask covering the whole face, with TWO large perfectly round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, FOUR vertical red markings arranged symmetrically (one on the inner side and one on the outer side of each eye hole), and ONE small black dot centered on the forehead; short spiky black hair sticking out above the mask, clearly visible from the front, the side AND the back of the head; neutral-gray skin on the neck, arms and hands; a hulking 180 cm / 100 kg thick, heavy, muscular build (broad and bulky, not a slim bodybuilder); a plain white short-sleeve crew-neck T-shirt, black-charcoal denim jeans, plain white sneakers; in his RIGHT hand a large clear glass beer mug with a handle, filled with amber beer and a white foam head. Do NOT carry over from the reference: its poses, panel layout, cream background, text labels, color palette swatches or reaction panels. The mask stays a rigid mask with no human eyes, eyelids, eyebrows, nose or lips. No text, no labels, no letters, no watermark anywhere in the image.
```

---

## モブの共通の書き出し（1〜7で使用）

各プロンプトの先頭は同じ文にしてある:
`Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body.`

最後も同じ文: `No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.`

## 1. 工場の警備員 → `Mob_factory_guard_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese factory security guard in his early 30s, average height, sturdy build, short black hair, friendly round face. He wears a light sky-blue short-sleeve uniform work shirt with two chest pockets and shoulder epaulettes, dark navy work trousers, a black leather belt with a silver buckle, black safety shoes, light gray work gloves, and a dark navy peaked security cap with a small plain silver emblem on the front. Empty hands. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 2. 警察官 → `Mob_police_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese police officer in his late 20s, tall and athletic, short neat black hair, serious but slightly comical expression. He wears a dark navy police uniform jacket and matching trousers, a white collared shirt with a navy necktie, a black duty belt, black polished shoes, white cotton gloves, and a dark navy peaked police cap with a small plain gold emblem on the front. He holds a black police baton in his right hand. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 3. 警部（ボス）→ `Mob_inspector_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D boss character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a confident wide-legged stance with arms slightly away from the body. The character is a Japanese police inspector in his 50s, very large and imposing — about 190 cm tall with a broad barrel chest and thick arms — with short gray-black hair, thick eyebrows and a neat black mustache, a stern but slightly comical frown. He wears a near-black dark navy uniform jacket and trousers, a white shirt with a dark tie, a black belt, black boots, white gloves, and a dark navy peaked cap with a large plain gold emblem and a gold band on the brim. Empty hands, fists clenched. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 4. 白バイ隊員 → `Mob_motor_police_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face with the helmet on. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese motorcycle police officer in his 30s, lean and fit, wearing a glossy white open-face motorcycle helmet with a dark smoked visor raised above the eyes and a small plain blue stripe, a light sky-blue uniform jacket with navy shoulder trim, dark navy riding breeches, tall black leather riding boots up to the knees, a white belt, and white gloves. Empty hands. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 5. 機動隊長（ボス）→ `Mob_riot_chief_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D boss character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face with the helmet on. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a firm guarding stance. The character is a Japanese riot police squad captain in his 40s, very large and powerful — about 190 cm tall and broad-shouldered — with a square jaw and a determined, slightly comical scowl. He wears a dark navy riot duty uniform with padded dark-gray shoulder, chest, forearm and shin protectors, black combat boots, black tactical gloves, and a dark navy riot helmet with a clear face visor raised up. In his left hand he holds a large clear transparent rectangular riot shield taller than his torso. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 6. 本社警備員 → `Mob_hq_guard_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing in a relaxed neutral pose with arms slightly away from the body. The character is a Japanese corporate building security guard in his 40s, medium height, stocky, short black hair with a little gray at the temples, polite but stubborn expression. He wears a medium-gray security uniform jacket and matching trousers, a white shirt with a navy necktie, a black belt, black shoes, and a medium-gray peaked cap with a small plain silver emblem. He holds a black baton in his right hand. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 7. 警備本部長（ボス）→ `Mob_security_head_sheet.png`

```
Character turnaround model sheet for a modern AAA console action game, rendered as a high-end real-time 3D boss character (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Four views side by side on one wide sheet: full-body front view, full-body three-quarter view, full-body back view, and a large close-up of the face. Plain neutral mid-gray studio background. ONE single person shown in all four views, standing upright with hands behind his back. The character is the head of corporate security, a Japanese man in his late 50s, very large — about 190 cm tall with a heavy, broad build — with short salt-and-pepper hair, a strong chin and a strict but slightly comical expression. He wears a dark navy suit-style security uniform with gold shoulder boards, gold buttons and a gold cord across the chest, a white shirt with a dark navy tie, black polished shoes, white gloves, and a dark navy peaked cap with a large plain gold emblem. No text, no labels, no letters, no numbers, no watermark anywhere in the image; badges and emblems are plain shapes without lettering.
```

## 8. 一般社員（群衆）→ `Mob_crowd_office_sheet.png`

```
Group character lineup for a modern AAA console game, rendered as high-end real-time 3D characters (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Seven different Japanese office workers standing side by side in one row, full body, facing the viewer, plain neutral mid-gray studio background, each clearly a different person: a young man in his 20s in a white shirt and navy tie; a woman in her 30s in a light-blue blouse and gray skirt; a man in his 40s with glasses in a light-blue shirt and striped tie; a woman in her 20s in a beige cardigan over a white blouse and navy trousers; a heavyset man in his 50s in a white shirt, gray vest and red tie; a woman in her 40s in a navy jacket over a white blouse; a slim young man in a pale-gray shirt with sleeves rolled up. Every one of them wears a simple employee ID card on a blue neck strap with a blank card face. Calm, friendly expressions. No text, no labels, no letters, no numbers, no watermark anywhere in the image.
```

## 9. 通行人とたい焼き屋の店主（群衆）→ `Mob_crowd_passerby_sheet.png`

```
Group character lineup for a modern AAA console game, rendered as high-end real-time 3D characters (Unreal Engine 5 quality, physically based materials, soft studio lighting, crisp detail). Six different Japanese people standing side by side in one row, full body, facing the viewer, plain neutral mid-gray studio background, each clearly a different person: a taiyaki street-stall cook, a cheerful man in his 60s with a white cook's jacket, white apron and a white cook's cap, holding long metal tongs; an elderly woman in a lavender cardigan carrying a cloth shopping bag; a high-school girl in a navy sailor-style school uniform with a school bag; a salaryman in his 30s in a dark gray suit carrying a briefcase; a young woman in a camel coat holding a smartphone; a middle-aged man in a casual green jacket and cap walking a small shiba dog on a leash. Relaxed, everyday expressions. No text, no labels, no letters, no numbers, no watermark anywhere in the image.
```

---

## 場所の共通の書き出し（10〜14で使用）

`Environment concept sheet for a modern AAA console action game level, rendered as high-end real-time 3D graphics (Unreal Engine 5 quality, physically based materials, global illumination, crisp detail). Four panels arranged in a 2x2 grid on one wide sheet, each panel a different camera angle of the SAME location, including one panel from an elevated third-person game camera looking down the main path. No people or characters in any panel.`

最後も同じ文: `No readable text, no letters, no logos, no signage lettering, no labels, no UI, no watermark anywhere in the image; any signs are blank or abstract shapes.`

## 10. 工場 → `Loc_factory_sheet.png`

```
Environment concept sheet for a modern AAA console action game level, rendered as high-end real-time 3D graphics (Unreal Engine 5 quality, physically based materials, global illumination, crisp detail). Four panels arranged in a 2x2 grid on one wide sheet, each panel a different camera angle of the SAME location, including one panel from an elevated third-person game camera looking down the main path. No people or characters in any panel. The location is a bright, clean Japanese craft-beer factory called a golden beer brewery, on a sunny summer midday. Top-left and top-right panels: the outdoor front yard — gray concrete ground with yellow painted safety lines, cream-colored factory walls with dark steel pillars and large pipes running along the top, two white delivery trucks with yellow cabs parked at the sides, wooden pallets stacked with red and yellow plastic beer crates, and a large closed gray roll-up shutter at the far end. Bottom-left and bottom-right panels: the indoor production line — tall polished stainless-steel brewing tanks on both sides, two long conveyor belts carrying rows of brown glass beer bottles along a central walkway, skylights in the roof casting soft beams of sunlight through faint haze, and at the far end a glowing shipping dock with three golden wooden beer barrels with brass taps. Warm, cheerful, slightly stylized color palette. No readable text, no letters, no logos, no signage lettering, no labels, no UI, no watermark anywhere in the image; any signs are blank or abstract shapes.
```

## 11. 麻布十番商店街 → `Loc_azabu_shotengai_sheet.png`

```
Environment concept sheet for a modern AAA console action game level, rendered as high-end real-time 3D graphics (Unreal Engine 5 quality, physically based materials, global illumination, crisp detail). Four panels arranged in a 2x2 grid on one wide sheet, each panel a different camera angle of the SAME location, including one panel from an elevated third-person game camera looking down the main street. No people or characters in any panel. The location is a nostalgic Tokyo shopping street in the Azabu-Juban neighborhood at sunset: warm orange evening sunlight and a pink-orange sky, a two-lane asphalt street wet after rain with small reflective puddles, brick-tiled sidewalks on both sides, a row of small two- to four-story shops with colorful fabric awnings and glowing shop windows (a taiyaki street stall with a red canopy, a fruit and vegetable shop with crates of produce, a Japanese sweets shop), a long string of glowing red paper lanterns hanging above the sidewalks, a red steel welcome arch spanning the street, gray concrete utility poles with power lines, curved street lamps that are switched on, and tall glass office towers rising in the distance. Cozy, lively, slightly stylized. No readable text, no letters, no logos, no signage lettering, no labels, no UI, no watermark anywhere in the image; any signs, lanterns and banners are blank or abstract shapes.
```

## 12. 本社前広場 → `Loc_hq_plaza_sheet.png`

```
Environment concept sheet for a modern AAA console action game level, rendered as high-end real-time 3D graphics (Unreal Engine 5 quality, physically based materials, global illumination, crisp detail). Four panels arranged in a 2x2 grid on one wide sheet, each panel a different camera angle of the SAME location, including one panel from an elevated third-person game camera looking toward the building entrance. No people or characters in any panel. The location is the paved plaza in front of a huge modern corporate headquarters tower in Tokyo, just after sunset: the sky fades from orange at the horizon to deep blue above, the tower is a tall dark-blue glass curtain-wall skyscraper with scattered warm lit windows, a wide glass entrance with automatic sliding doors under a white steel canopy, large stone paving tiles, square stone planters with neatly trimmed trees, low bollard lights, and in the far right distance the red-and-white Tokyo Tower softly illuminated against the dusk sky. Clean, grand, slightly stylized. No readable text, no letters, no logos, no signage lettering, no labels, no UI, no watermark anywhere in the image; the building facade has no company name.
```

## 13. 本社ロビーと12Fオフィス → `Loc_hq_office_sheet.png`

```
Environment concept sheet for a modern AAA console action game level, rendered as high-end real-time 3D graphics (Unreal Engine 5 quality, physically based materials, global illumination, crisp detail). Four panels arranged in a 2x2 grid on one wide sheet, each panel a different camera angle of the SAME office building interior, including one panel from an elevated third-person game camera looking down the main aisle. No people or characters in any panel. Morning light. Top-left and top-right panels: the ground-floor entrance lobby — a polished marble floor in a large white-and-beige checkerboard pattern that reflects the room, thick round white columns, a long white reception counter with a warm wooden top in front of a dark wood wall panel, gray lounge sofas with small coffee tables, potted plants, silver elevator doors in the side walls, and at the far end a row of glass security turnstile gates set in a tall glass partition. Bottom-left and bottom-right panels: a 12th-floor open-plan office — navy-blue checkered carpet tiles, long white island desks with pairs of computer monitors and keyboards, black office chairs, a glass-walled meeting room, tall bookshelves along the wall, and rows of white rectangular ceiling light panels. Clean, bright, orderly, slightly stylized. No readable text, no letters, no logos, no signage lettering, no labels, no UI, no watermark anywhere in the image; monitor screens show only soft abstract colors.
```

## 14. 窓際族エリアと立ち飲み処 → `Loc_madogiwa_sheet.png`

```
Environment concept sheet for a modern AAA console action game level, rendered as high-end real-time 3D graphics (Unreal Engine 5 quality, physically based materials, global illumination, crisp detail). Four panels arranged in a 2x2 grid on one wide sheet, each panel a different camera angle of the SAME location, including one panel from an elevated third-person game camera looking toward the windows. No people or characters in any panel. The location is a quirky, cozy do-it-yourself hangout corner at the window side of a 12th-floor Tokyo office, in early morning: a full-height wall of floor-to-ceiling glass windows with slim metal mullions, low golden morning sunlight streaming in and casting long window-frame shadows across a warm wooden plank floor, and through the windows a wide Tokyo cityscape with the red-and-white Tokyo Tower in the distance. In front of the windows stands a small wooden Japanese standing bar stall: a wooden counter with a chrome beer server and glass beer mugs, a short dark-navy fabric noren curtain split into three panels hanging from the front beam, and two round red paper lanterns hanging at the corners. Around it: a chair made of two stacked cardboard boxes with a cardboard backrest, a small green camping tent, a portable charcoal barbecue grill on legs, a red-brown fabric sofa with two tall speakers and a floor lamp, a few wooden beer barrels, stacked cardboard boxes, and a homemade cardboard standing signboard. Playful, warm, slightly stylized. No readable text, no letters, no logos, no signage lettering, no labels, no UI, no watermark anywhere in the image; the noren, lanterns and signboard are blank.
```
