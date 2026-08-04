#!/bin/bash
# このランのキーフレームを「正典画風（実写調の空間＋3Dチビのやめ太郎）」で生成する。
#
# 使い方（リポジトリルートから実行する）:
#   bash 03_SCRIPTS/26_yametaro_gratitude_bug_10000/gen_keyframes.sh
#
# 前提: draw-things-cli と Qwen Image Edit 2511 (6-bit) が導入済みであること。
#   brew install drawthingsai/draw-things/draw-things-cli
#   draw-things-cli models ensure --model qwen_image_edit_2511_q6p.ckpt
#
# 1枚あたり約8.5分（M4 Max / 1024x576 / 20step）かかり、前フレームを種にするチェーンなので
# 並列化できない。必ずバックグラウンドで回し、既存の出力はスキップされるので中断・再開できる。
#
# 設計方針（.claude/skills/seedance/SKILL.md の「ポイント」に対応）:
#   - DT_STRENGTH は下げない（下げると指示を無視した上に細部も失う）。既定の1.0で回す。
#   - 1フレームで変える点は1〜2個に絞り、"Change EXACTLY ONE/TWO things" と番号付きで列挙する。
#   - 維持する要素は $SET / $LID / $NG / $STYLE として具体的に言い直す。
#   - 口の形を含意する感情語（smile / surprise）は使わず、感情は目と眉で指定する（$SHUT）。
#   - カメラが寄るだけのフレーム（clip3_end）は生成せず前フレームのクロップで作る。
set -u
RUN=03_SCRIPTS/26_yametaro_gratitude_bug_10000
GEN=.claude/skills/seedance/dt_generate.sh
export DT_STEPS=20
SIZE=1024x576

STYLE="PHOTOREALISTIC live-action-style scene with cinematic lighting, real-world textures and natural depth of field — a real high-floor Tokyo office interior. Yametaro is a soft matte 3D-rendered chibi figure — rounded plastic-like surfaces, an oversized head, black bowl-cut hair, no visible nose, simple dot eyes behind small round white-rimmed glasses, pink blush cheeks, a LAVENDER LEAF-PATTERNED collared shirt and dark trousers — composited naturally into the photoreal environment with matching lighting and contact shadows. NOT flat 2D anime, NOT cel-shaded cartoon, NOT a drawing, NOT an illustration."
SET="Keep the input image's camera distance, camera angle, crop and composition EXACTLY the same, and keep every set element identical: the same stacked brown corrugated cardboard box desk, the same laptop in EXACTLY the same place, the same window and the same room."
LID="The laptop does NOT rotate, does NOT swivel and does NOT slide; it stays OPEN at about 110 degrees hinged along its FAR edge away from camera with its screen FACING THE CAMERA — we see the FRONT of the screen, never the back or side of the lid. The screen is always switched ON with visible content, never blank and never grey."
SHUT="Draw his mouth as a single small thin closed curved line with lips sealed — no open mouth, no teeth, no toothy grin, no round open surprised mouth. Every emotion is expressed ONLY through his eyes and eyebrows, never by opening his mouth. He is NOT talking and NOT mid-speech."
NG="His design does not change: oversized head, black bowl-cut hair, pink blush cheeks, LAVENDER LEAF-PATTERNED collared shirt, dark trousers, soft matte 3D chibi body. He is ALWAYS WEARING his small ROUND thin-rimmed glasses with perfectly circular lenses, clearly visible on his face in every frame — the glasses do NOT disappear, are NOT removed, do NOT become rectangular and do NOT become thick dark frames. Even when his eyes are closed, the round glasses stay drawn on his face over his closed eyes."
NOTEXT="Single still frame, one coherent scene, no text, no letters, no logos, no signage anywhere in frame."

gen() { # gen <out> <in> <seed> <prompt>
  local out="$RUN/$1" inp="$2" seed="$3" prompt="$4"
  if [ -f "$out" ]; then echo "SKIP(exists): $1"; return; fi
  local t0=$(date +%s)
  echo "=== $1 (seed $seed)"
  printf '%s' "$prompt" | $GEN "$out" "$inp" "$seed" "$SIZE" 2>/dev/null | grep -E "^(seed|saved)"
  echo "    took $(( $(date +%s) - t0 ))s"
}

# C1 start: シート単体を種にして最初の1枚を起こす（以降は全部これのチェーン）
if [ ! -f "$RUN/clip1_start.png" ]; then
  python3 .claude/skills/seedance/stitch_refs.py "$RUN/ref_canvas_clip1_start.png" "$RUN/Yametaro_sheet.png"
  gen clip1_start.png "$RUN/ref_canvas_clip1_start.png" 2001 \
"The input image is a character model sheet of ONE character — identity/design reference only, NOT a composition reference. Using exactly this character, create the FIRST-FRAME still of a video shot: one single coherent scene. $STYLE He is tiny, only about 60 cm tall. Scene: a medium shot from slightly front-left of the window-side corner of the office. Yametaro sits behind a desk built from stacked brown corrugated cardboard boxes, slumped forward with both small hands propping up his chin, staring at an open laptop with a comically defeated look. $SHUT A thick white paper spec binder lies OPEN flat on the desk beside the laptop. $LID Its screen shows a calm plain blue code editor with pale code lines. There is NO pile of printouts on the desk. Through the floor-to-ceiling window on the RIGHT of frame, warm late-afternoon golden light and the real Tokyo skyline with Tokyo Tower. $NOTEXT no sheet-style panels or labels."
else
  echo "SKIP(exists): clip1_start.png"
fi

# C1 end: 変更1つ（こぶしをこめかみに、目をぎゅっと閉じる）
gen clip1_end.png "$RUN/clip1_start.png" 2002 \
"Edit the input image, which is this clip's start frame. $SET Change EXACTLY ONE thing and nothing else: Yametaro sits up straight and presses both tiny fists against his temples with his eyes squeezed shut, brow furrowed in enormous comedic concentration. $SHUT $NG Everything else is unchanged: the white paper spec binder still lies OPEN flat on the desk, there is still NO pile of printouts, and the warm late-afternoon golden light still comes through the window. $LID Its screen still shows the SAME calm blue code editor with pale code lines. $STYLE $NOTEXT"

# C2 end: 変更1つ（合掌して目を見開く。金色のきらめきを添える）
gen clip2_end.png "$RUN/clip1_end.png" 2003 \
"Edit the input image, which is this clip's start frame. $SET Change EXACTLY ONE thing and nothing else: Yametaro's eyes pop wide open behind his round white glasses and he lifts both hands off his temples to press his palms together in a vertical prayer pose in front of his chest, elbows tucked in, looking delighted and enlightened, with a few soft warm golden light sparkles floating in the air around him. $SHUT $NG Everything else is unchanged: the white paper spec binder still lies OPEN flat on the desk, there is still NO pile of printouts, and the warm late-afternoon golden light still comes through the window. $LID Its screen still shows the SAME calm blue code editor with pale code lines. $STYLE $NOTEXT"

# C3 end: カメラが寄るだけでポーズも小道具も変わらないので、生成せずクリップ2終了フレームのクロップで作る。
if [ ! -f "$RUN/clip3_end.png" ]; then
  python3 - <<'PYCROP'
from PIL import Image
run = "03_SCRIPTS/26_yametaro_gratitude_bug_10000"
box = (220, 20, 1020, 470)   # 800x450 = 16:9。次クリップの「机に手をつくお辞儀」のため机面まで含める
Image.open(f"{run}/clip2_end.png").crop(box).resize((1024, 576), Image.LANCZOS).save(f"{run}/clip3_end.png")
print(f"saved: {run}/clip3_end.png (crop of clip2_end, box {box})")
PYCROP
else
  echo "SKIP(exists): clip3_end.png"
fi

# C4 end: 変更2つ（仕様書を閉じる＋深いお辞儀）＋画面に赤いひび
gen clip4_end.png "$RUN/clip3_end.png" 2005 \
"Edit the input image, which is this clip's start frame. $SET Change EXACTLY TWO things and nothing else. FIRST CHANGE: the white paper spec binder on the desk is now CLOSED and squared up neatly — it is no longer lying open. SECOND CHANGE: Yametaro has lowered both hands flat onto the desk and bows deeply in apology, the top of his oversized head tilted toward camera, his eyes closed. $SHUT $NG Everything else is unchanged: there is still NO pile of printouts and the warm late-afternoon golden light still comes through the window. $LID Its screen now shows exactly ONE glowing red crack across the same calm blue code editor — the screen does NOT fill with error text. $STYLE $NOTEXT"

# C5 end: 変更2つ（机に伏せて眠る＋夕方→夜）
gen clip5_end.png "$RUN/clip4_end.png" 2006 \
"Edit the input image, which is this clip's start frame. $SET Change EXACTLY TWO things and nothing else. FIRST CHANGE: Yametaro is now asleep face-down on the desk with his head resting sideways on his folded hands, his round glasses slightly askew, looking peaceful and content — a happy satisfied nap, not collapse or distress. SECOND CHANGE: the time of day outside the window advances from late-afternoon golden to DEEP EVENING BLUE NIGHT, with the night city lights switched ON and the room lit by cool blue night light. $SHUT $NG Everything else is unchanged: the spec binder stays CLOSED and squared up, there is still NO pile of printouts. $LID Its screen still shows exactly ONE glowing red crack across a calm blue code editor. $STYLE $NOTEXT"

# C6 end: 変更1つ（起き上がって合掌）。夜のまま。
gen clip6_end.png "$RUN/clip5_end.png" 2007 \
"Edit the input image, which is this clip's start frame. $SET Keep the SAME deep evening blue night lighting with the night city lights still on. Change EXACTLY ONE thing and nothing else: Yametaro is no longer asleep — he has sat back fully UPRIGHT with his back straight and his head lifted, and has raised both hands off the desk to press his palms together in a vertical prayer pose in front of his chest, elbows tucked in, eyes open and alert, his glasses straight again. $SHUT $NG Everything else is unchanged: it is still night outside, the spec binder stays CLOSED and squared up, and there is still NO pile of printouts. $LID Its screen still shows exactly ONE glowing red crack across a calm blue code editor. $STYLE $NOTEXT"

# C7 end: 変更1つ（夜→真昼）
gen clip7_end.png "$RUN/clip6_end.png" 2038 \
"Edit the input image, which is this clip's start frame. $SET Change EXACTLY ONE thing and nothing else: the time of day outside the window jumps from deep night to BRIGHT MIDDAY — a bright blue daylight sky with sunlit buildings, the night city lights switched OFF, and bright daylight flooding the room. Yametaro himself is COMPLETELY UNCHANGED: identical pose, identical head angle facing forward, identical face and identical expression to the input image, palms still pressed together in exactly the same prayer pose. Copy his face from the input image exactly — same eyes, same eyebrows, and the same small thin CLOSED mouth line with lips sealed. Do NOT change his expression, do NOT open his mouth, do NOT turn his head. $NG Everything else is unchanged: the spec binder stays CLOSED and squared up and there is still NO pile of printouts. $LID Its screen still shows exactly ONE glowing red crack across a calm blue code editor — it does NOT fill with error text in this clip. $STYLE $NOTEXT"

# C8 end: 変更2つ（画面が赤いログで埋まる＋紙の塔）
gen clip8_end.png "$RUN/clip7_end.png" 2009 \
"Edit the input image, which is this clip's start frame. $SET Keep the same bright midday daylight. Change EXACTLY TWO things and nothing else. FIRST CHANGE: the laptop screen fills completely with dense red error-log lines — many rows of red text-like marks covering the whole screen, replacing the single red crack (an abstract pattern of red lines, not readable words). SECOND CHANGE: a TALL leaning tower of white printout paper has stacked up on the floor beside the cardboard-box desk, taller than Yametaro himself and leaning slightly. Yametaro keeps his palms pressed together in exactly the same prayer pose and only tips his oversized head back to look up toward the top of the paper tower, eyes wide with happy curiosity. $SHUT $NG The spec binder stays CLOSED and squared up. $LID $STYLE $NOTEXT"

# C9 end: 変更1つ（画面を見て気づく顔）
gen clip9_end.png "$RUN/clip8_end.png" 2010 \
"Edit the input image, which is this clip's start frame. $SET Keep the same bright midday daylight, the same TALL leaning tower of white printout paper at exactly the same height, and the same laptop screen filled with dense red error-log lines. Change EXACTLY ONE thing and nothing else: Yametaro snaps his oversized head round to stare straight at the laptop screen, his eyes going enormous behind his round glasses in a dawning comic realization, with a single sweat-drop popping at his temple. It is a funny lightbulb moment, not fear or distress. He keeps his palms pressed together in exactly the same prayer pose. $SHUT $NG The spec binder stays CLOSED and squared up. $LID $STYLE $NOTEXT"

# C10 end: 変更1つ（画面が黒＋赤い点1つに）
gen clip10_end.png "$RUN/clip9_end.png" 2031 \
"Edit the input image, which is this clip's start frame. $SET Keep the same bright midday daylight and the same TALL leaning tower of white printout paper at exactly the same height. Change EXACTLY ONE thing and nothing else: the laptop screen, still switched ON, goes deep BLACK except for ONE small red dot glowing brightly in its centre — the dense red error log is gone, and the screen is not off and not grey. Yametaro turns his oversized head back to face forward, closes his eyes and settles into a perfectly still serene prayer pose with his palms still pressed together. $SHUT $NG The spec binder stays CLOSED and squared up. $LID $STYLE $NOTEXT"

# C11 end: 変更2つ（福ちゃん登場＋少し引く）。写真調シートは連結せず同定句で文章指定する。
gen clip11_end.png "$RUN/clip10_end.png" 2012 \
"Edit the input image. Keep the input image's photoreal rendering style, the same room, the same bright midday daylight, the same stacked brown corrugated cardboard box desk, the same TALL leaning tower of white paper at the same height, and the same laptop in the same place with its screen switched ON, deep black with ONE small red dot glowing in its centre. Yametaro stays seated exactly as he is with his palms pressed together in his prayer pose. Change EXACTLY TWO things and nothing else. FIRST CHANGE: frame the shot slightly WIDER so there is room at frame-left, keeping the same camera height and angle. SECOND CHANGE: a second character has walked in and now stands on the floor at frame-LEFT beside the desk, leaning in slightly toward Yametaro — Fukuchan, a slim stylish 48-year-old Japanese man, 170 cm, with short black hair, wearing a loose black long coat over a white graphic T-shirt, with a black lanyard and a white name badge around his neck, smiling warmly with his mouth closed. Draw Fukuchan as a PHOTOREAL REAL PERSON with the same photographic realism and the same lighting as the room — he is a real human being, not a cartoon and not a 3D toy. Fukuchan is a full-height adult standing on the floor and Yametaro is a tiny chibi figure only about 60 cm tall seated at the desk, so Yametaro reaches barely above the waist of Fukuchan — that dramatic size difference must be obvious. The mouths of BOTH characters are closed with lips sealed — no open mouths and no teeth on either character, neither of them is talking. $NG $LID $NOTEXT Output ONE single coherent scene — do NOT output a split-panel image, do NOT output side-by-side panels, do NOT output a turnaround or a grid of poses."

# C12 end: 変更1つ（福ちゃんが話し始める）
gen clip12_end.png "$RUN/clip11_end.png" 2013 \
"Edit the input image, which is this clip's start frame. Keep the input image's camera distance, camera angle, crop and composition EXACTLY the same, keep both characters in the same places at the same sizes, and keep every set element identical. Change EXACTLY ONE thing and nothing else: Fukuchan, the photoreal real man in the loose black long coat standing at frame-left, is now mid-speech with his MOUTH OPEN as if talking, and raises one hand in a friendly open-palmed gesture toward Yametaro. Yametaro does NOT speak — his mouth stays a small thin closed curved line with lips sealed, no open mouth and no teeth — and he keeps his palms pressed together in the prayer pose, only opening his eyes to glance up at Fukuchan. $NG Everything else is unchanged: the same bright midday daylight, the same TALL leaning tower of white paper, the spec binder CLOSED and squared up, and the laptop screen switched ON, deep black with ONE small red dot glowing in its centre. $LID $NOTEXT"

# C13 end: 変更2つ（福ちゃんが手を下ろして口を閉じる＋やめ太郎が向き直る）
gen clip13_end.png "$RUN/clip12_end.png" 2014 \
"Edit the input image, which is this clip's start frame. Keep the input image's camera distance, camera angle, crop and composition EXACTLY the same, keep both characters in the same places at the same sizes, and keep every set element identical. Change EXACTLY TWO things and nothing else. FIRST CHANGE: Fukuchan lowers his raised hand back down and CLOSES his mouth, waiting patiently. SECOND CHANGE: Yametaro turns his whole tiny body to face Fukuchan and gently shuts his eyes, keeping his palms pressed together in the prayer pose, looking supremely serene. The mouths of BOTH characters are now closed with lips sealed — no open mouths and no teeth on either character, neither of them is talking. $NG Everything else is unchanged: the same bright midday daylight, the same TALL leaning tower of white paper, the spec binder CLOSED and squared up, and the laptop screen switched ON, deep black with ONE small red dot glowing in its centre. $LID $NOTEXT"

# C14 end: 変更1つ（やめ太郎が話し始める）
gen clip14_end.png "$RUN/clip13_end.png" 2015 \
"Edit the input image, which is this clip's start frame. Keep the input image's camera distance, camera angle, crop and composition EXACTLY the same, keep both characters in the same places at the same sizes, and keep every set element identical. Change EXACTLY ONE thing and nothing else: Yametaro, the tiny soft matte 3D chibi figure, is now mid-speech with his MOUTH OPEN as if talking and his eyes open, still keeping his palms pressed together in the prayer pose, looking utterly serene and innocent. Fukuchan does NOT speak — his mouth stays closed with lips sealed, no open mouth and no teeth — he simply listens. $NG Everything else is unchanged: the same bright midday daylight, the same TALL leaning tower of white paper, the spec binder CLOSED and squared up, and the laptop screen switched ON, deep black with ONE small red dot glowing in its centre. $LID $NOTEXT"

# C15 end: 変更2つ（画面が通知の滝＋福ちゃんがスマホを出す）
gen clip15_end.png "$RUN/clip14_end.png" 2016 \
"Edit the input image, which is this clip's start frame. Keep the input image's camera distance, camera angle, crop and composition EXACTLY the same, keep both characters in the same places at the same sizes, and keep every set element identical. Change EXACTLY TWO things and nothing else. FIRST CHANGE: the laptop screen erupts into a dense cascade of stacked notification banners pouring down it — many small coloured horizontal bars filling the screen, replacing the single red dot (abstract coloured bars with no readable words). SECOND CHANGE: Fukuchan pulls a phone out of his coat pocket and looks down at it showing the same cascade of coloured notification bars, looking delighted rather than alarmed. Yametaro closes his mouth and settles back into his perfectly serene prayer pose, completely unbothered. The mouths of BOTH characters are closed with lips sealed — no open mouths and no teeth on either character, neither of them is talking. $NG Everything else is unchanged: the same bright midday daylight, the same TALL leaning tower of white paper, and the spec binder CLOSED and squared up. $LID $NOTEXT"

# C16 end: ローアングルへの構図変更＋立ち上がり＋ギュンギュンポーズ
gen clip16_end.png "$RUN/clip15_end.png" 2017 \
"Edit the input image, which is this clip's start frame. Keep the same two characters, the same photoreal rendering style, the same room and the same bright midday daylight, but change the camera to a LOW HEROIC ANGLE looking slightly upward, framed a little wider. Yametaro, the tiny soft matte 3D chibi figure, now stands up on his cardboard-box chair without breaking his prayer pose, palms still pressed together, backlit by the window in a dramatic golden rim light like a legendary martial-arts master, his eyes calm and proud. Fukuchan, the photoreal real man in the loose black long coat, presses both hands to his own cheeks in a delighted pose. Yametaro is still dramatically shorter than Fukuchan even standing on the chair. The mouths of BOTH characters are closed with lips sealed — no open mouths and no teeth on either character, neither of them is talking. $NG The laptop screen keeps the same dense cascade of coloured notification banners, the TALL leaning tower of white paper is the same height, the spec binder is CLOSED and squared up, and the desk is still the stacked brown corrugated cardboard box desk. $LID $NOTEXT"

# C17 end: 変更1つ（真昼→夕方の金色）
gen clip17_end.png "$RUN/clip16_end.png" 2018 \
"Edit the input image, which is this clip's start frame. Keep the input image's camera angle, camera distance, crop and composition EXACTLY the same, keep both characters in exactly the same poses in the same places, and keep every set element identical. Change EXACTLY ONE thing and nothing else: the light through the window advances from bright midday to warm LATE-AFTERNOON GOLDEN light — a golden-orange sky, warm amber light across the room, and long warm shadows stretching across the floor. Nobody moves: Yametaro still stands on his cardboard-box chair with his palms pressed together in the prayer pose looking calm and proud, and Fukuchan still presses both hands to his own cheeks. The mouths of BOTH characters stay closed with lips sealed — no open mouths and no teeth on either character, neither of them is talking. $NG The laptop screen keeps the same dense cascade of coloured notification banners, the TALL leaning tower of white paper is the same height, the spec binder is CLOSED and squared up, and the desk is still the stacked brown corrugated cardboard box desk. $LID $NOTEXT"

echo "=== ALL FRAMES DONE ==="
ls "$RUN"/clip*_end.png | wc -l
