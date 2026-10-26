#!/usr/bin/env python3
"""EXAMPLE (copied from 03_SCRIPTS/37_sobaya_beer_ocean_kaiju/make_prompts.py) — copy into a new run and rewrite.

Write chN_prompt.txt for 37_sobaya_beer_ocean_kaiju (official Ref2VA six-section format).

The subject definitions are shared strings so every chapter describes a person with the same words.
<Picture N> order per chapter is the IMAGES table below; gen_all_workflows.sh attaches in the same order.
Run from this directory: python3 make_prompts.py
"""
from pathlib import Path

DESC = {
    "lifeguard": "the lifeguard in {p}, a lean Japanese man in his late twenties with short black hair, a red cap with sunglasses resting on its brim, a red long-sleeve rash guard with yellow side panels, red shorts with yellow side stripes, a black whistle on a black cord around his neck, a black strap worn diagonally across his chest holding a red rescue tube, a black belt with a red pouch, and navy sport sandals",
    "father": "the father in {p}, a Japanese man in his forties with short black hair and a round smiling face, wearing a black long-sleeve rash guard, a light-blue towel around his neck, blue floral board shorts and black sandals",
    "child": "the father's young daughter in {p}, a girl of about six with black hair in a bun, a pink floral one-piece swimsuit with frills, pink sandals, and a clear pink inflatable swim ring with a flower print",
    "woman": "the young woman in {p}, a Japanese woman in her twenties with a black chin-length bob, a lavender bikini top, frayed denim shorts and white sandals, carrying a woven straw tote bag",
    "man": "the young man in {p}, her boyfriend, a Japanese man in his twenties with curly black hair, shirtless, wearing navy board shorts with a colorful floral print and black sandals, empty-handed",
    "crowd": "the background beachgoers, whose clothing, ages and builds come from the thirty people shown in {p} and {q}: families, children with nets and buckets, couples, older people in sun hats and rash guards, swimsuits, board shorts, beach towels and swim rings; they appear only as a crowd, and none of them repeats the face and outfit of another defined subject",
    "sobaya": "the giant in {p}, a mountain-sized man several hundred meters tall with the proportions of a hulking 180 cm, 100 kg man and a thick heavy build, whose face is fully covered by a hard white mask with TWO large round black eye holes, ONE short horizontal black mouth slit, four red vertical markings with two flanking each eye, and a small black dot centered on the forehead; short spiky black hair shows above the mask, his neck, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt and dark charcoal jeans",
}

MUG = "a giant clear glass beer mug with a handle, in proportion to his hand, filled with amber beer under a white foam head"

STYLE = ("The target video is photorealistic live action that looks like a big-budget science-fiction film shot on a digital "
         "cinema camera: hard midday summer sunlight, a deep blue sky with towering white cumulus clouds, crisp specular "
         "highlights on the water, natural motion blur, fine sensor grain, rich but natural color. Key subjects are kept "
         "inside the central horizontal band of the frame for a 2.39:1 extraction.")
GIANT = ("Because he is several hundred meters tall, thin atmospheric haze softens the parts of him that are far away, the "
         "way a distant mountain looks, and his scale is always readable against people, beach umbrellas, waves and clouds.")
MASK = ("In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never "
        "human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray.")
NOTEXT = ("There is no readable text anywhere: no signs with letters, no lettering on the lifeguard tower, no logos, "
          "no subtitles or captions.")

LOC_BEACH = ("<Subject {n}> is the Japanese seaside beach of the target video at summer noon: white sand, rows of colorful "
             "beach umbrellas, a tall white wooden lifeguard tower, a green headland in the distance, and a calm sea.")

PROMPTS = {}

# ---------------------------------------------------------------- ch1
PROMPTS["ch1"] = f"""subject_definitions:
<Subject 1> is {DESC['lifeguard'].format(p='<Picture 1>')}.
<Subject 2> is {DESC['father'].format(p='<Picture 2>')}.
<Subject 3> is {DESC['child'].format(p='<Picture 3>')}.
<Subject 4> is {DESC['woman'].format(p='<Picture 4>')}.
<Subject 5> is {DESC['man'].format(p='<Picture 5>')}.
<Subject 6> is {DESC['crowd'].format(p='<Picture 6>', q='<Picture 7>')}.
{LOC_BEACH.format(n=7)}

summary:
[reference generation] A peaceful summer day at <Subject 7>: an aerial establishing shot of the crowded beach with <Subject 6>, then <Subject 4> and <Subject 5> playing with a beach ball while <Subject 2> pushes <Subject 3> on her swim ring in the shallows, then <Subject 1> watching the sea from the lifeguard tower.

retention_analysis:
<Subject 1> (appears in [Shot 3]): fully_preserved - his face, red cap, red and yellow rash guard, shorts, whistle, strap, rescue tube, belt pouch and sandals are retained.
<Subject 2> (appears in [Shot 2]): fully_preserved - his face, black rash guard, light-blue towel and blue floral board shorts are retained.
<Subject 3> (appears in [Shot 2]): fully_preserved - her hair bun, pink floral swimsuit and pink swim ring are retained.
<Subject 4> (appears in [Shot 2]): fully_preserved - her bob, lavender bikini top and denim shorts are retained.
<Subject 5> (appears in [Shot 2]): fully_preserved - his curly hair and navy floral board shorts are retained.
<Subject 6> (appears in [Shot 1], [Shot 2]): weak_reference - only the variety of clothing, ages and builds is taken from the two crowd sheets.
<Subject 7> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - the white sand, umbrellas, lifeguard tower, headland and turquoise sea stay the same.
Only identity and clothing come from the pictures, never their poses, gray studio backgrounds, panel layouts or grids.

detailed_description:
{STYLE} Each defined person appears EXACTLY ONCE in the whole video; the crowd never contains a second copy of any of them.
[Shot 1] An aerial drone shot high above <Subject 7> at noon. Rows of colorful umbrellas line the white sand on the left of frame and the calm turquoise sea fills the right, small waves breaking in white lines. <Subject 6> is scattered across the sand and the shallows as tiny figures swimming, sunbathing and splashing. The camera pushes in with small amplitude at slow speed while pedestaling down toward the shoreline.
[Shot 2] At 00:03.500, the shot cuts to a medium shot in knee-deep clear water. On the left of frame, <Subject 4> and <Subject 5> laugh as they tap a striped red, white, blue and yellow beach ball back and forth; on the right of frame, <Subject 2> laughs as he pushes <Subject 3>, who holds onto her pink swim ring and kicks her feet. Sunlight glitters on the water. Out-of-focus beachgoers from <Subject 6> swim in the background. The camera holds a static shot.
[Shot 3] At 00:07.000, the shot cuts to a low-angle medium shot of the white lifeguard tower against the blue sky. <Subject 1> sits on top, the red rescue tube at his side and a white handheld megaphone resting on his knee, and slowly scans the sea with calm eyes. The camera pushes in with small amplitude at slow speed.
Nobody speaks. The sea stays clear turquoise in every shot. {NOTEXT}

overall_soundscape:
Gentle waves break and hiss on the sand while children laugh and shriek happily in the distance and water splashes around the swimmers. The beach ball pats softly between hands, seagulls cry overhead, and a light sea breeze flutters the umbrellas.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch2
PROMPTS["ch2"] = f"""subject_definitions:
<Subject 1> is {DESC['father'].format(p='<Picture 1>')}.
<Subject 2> is {DESC['child'].format(p='<Picture 2>')}.
<Subject 3> is the sea of the target video: knee-deep, sunlit water in the shallows of a Japanese beach at summer noon, clear turquoise at first.

summary:
[reference generation] In the shallows, the clear water around <Subject 2>'s kicking feet slowly turns amber and starts to fizz with tiny bubbles; <Subject 1> scoops up some water, sniffs it and tilts his head while <Subject 2> pokes at the foam.

retention_analysis:
<Subject 1> (appears in [Shot 3]): fully_preserved - his face, black rash guard and light-blue towel are retained.
<Subject 2> (appears in [Shot 1], [Shot 3]): fully_preserved - her hair bun, pink floral swimsuit and pink swim ring are retained.
<Subject 3> (appears in [Shot 1], [Shot 2], [Shot 3]): partially_preserved - the shallow sunlit water is kept while its color gradually changes from turquoise to pale amber.
Only identity and clothing come from the pictures, never their poses, gray studio backgrounds or panel layouts.

detailed_description:
{STYLE} Exactly two people are featured, <Subject 1> and <Subject 2>, each EXACTLY ONCE; only blurred swimmers far in the background.
[Shot 1] A close-up just above the water line. The legs of <Subject 2> dangle below her pink swim ring and kick slowly in clear turquoise water, sunlight dancing in rippling patterns on the sandy bottom. A faint amber tint seeps into the water around her feet like ink spreading, slowly widening. The camera holds a static shot.
[Shot 2] At 00:04.000, the shot cuts to a macro shot of the water surface. Countless tiny bubbles begin to rise and pop, the water turns a clear golden amber, and a thin ring of fine white foam gathers around the edge of the pink swim ring, sparkling in the sun. The camera pushes in with small amplitude at slow speed.
[Shot 3] At 00:07.000, the shot cuts to a medium close-up of <Subject 1> and <Subject 2> in the pale amber shallows. <Subject 1> stops laughing, scoops a little of the fizzing water into his cupped palm, lifts it to his nose, sniffs it and tilts his head in confusion, eyebrows raised. Beside him, <Subject 2> curiously pokes the white foam with one finger. The camera holds a static shot.
Nobody speaks; their mouths stay closed except for small surprised expressions. The water is pale amber and only lightly foamy, not yet a sea of beer. {NOTEXT}

overall_soundscape:
Small waves lap gently against the swim ring and legs, and a soft, growing fizz of popping bubbles rises from the water. Distant beach chatter and seagulls continue underneath, and water trickles from the father's palm.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch3
PROMPTS["ch3"] = f"""subject_definitions:
<Subject 1> is {DESC['lifeguard'].format(p='<Picture 1>')}.
<Audio 1> is the shouted line of <Subject 1> (S1).

summary:
[reference generation + audio reuse] On top of the lifeguard tower, <Subject 1> stands up, blows his whistle, shouts the evacuation call from <Audio 1> through a megaphone and points everyone toward the shore.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - his face, red cap with sunglasses, red and yellow rash guard, shorts, black whistle, strap, rescue tube and belt pouch are retained; only identity and clothing come from <Picture 1>, never its pose, gray background or detail panels.
<Audio 1>: partially_copy - his shout is copied 1:1 as his voice, starting almost immediately after the whistle, while beach sounds are added around it.

detailed_description:
{STYLE} Exactly one person is featured, <Subject 1>, EXACTLY ONCE.
[Shot 1] A slightly low-angle medium shot of <Subject 1> from the waist up on top of the white lifeguard tower, the blue sky and the pale amber, foaming sea behind him. He rises to his feet, grabs the black whistle and blows two sharp blasts. He lifts a white handheld megaphone to his mouth and <Subject 1> (S1) shouts with urgency, using <Audio 1> as-is with no other voice, <d>[Japanese] 海から上がってください！</d> His mouth moves only while <Audio 1> plays. He lowers the megaphone and sweeps his free arm toward the shore, pointing firmly to direct swimmers out of the water, and holds that pose. The camera holds a static shot.
The rescue tube stays on its strap at his side throughout. {NOTEXT}

overall_soundscape:
Two piercing whistle blasts cut through the sound of waves and fizzing foam, and the megaphone adds a slight electronic edge to his voice. Startled murmurs rise from the beach below.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch4
PROMPTS["ch4"] = f"""subject_definitions:
<Subject 1> is {DESC['lifeguard'].format(p='<Picture 1>')}.
<Subject 2> is {DESC['father'].format(p='<Picture 2>')}.
<Subject 3> is {DESC['child'].format(p='<Picture 3>')}.
<Subject 4> is {DESC['woman'].format(p='<Picture 4>')}.
<Subject 5> is {DESC['man'].format(p='<Picture 5>')}.
<Subject 6> is {DESC['crowd'].format(p='<Picture 6>', q='<Picture 7>')}.
<Subject 7> is the same Japanese beach at summer noon, where the sea has turned deep yellow and is churning with white foam.

summary:
[reference generation] Panicked swimmers flee the foaming yellow sea of <Subject 7>: <Subject 6> splashes toward the beach, <Subject 5> pulls <Subject 4> by the hand, and <Subject 2> runs out carrying <Subject 3> while <Subject 1> waves people ashore.

retention_analysis:
<Subject 1> (appears in [Shot 3]): fully_preserved - his face, red cap, red and yellow rash guard, whistle and rescue tube are retained.
<Subject 2> (appears in [Shot 3]): fully_preserved - his face, black rash guard, towel and floral board shorts are retained.
<Subject 3> (appears in [Shot 3]): fully_preserved - her hair bun, pink swimsuit and pink swim ring are retained.
<Subject 4> (appears in [Shot 2]): fully_preserved - her bob, lavender bikini top and denim shorts are retained.
<Subject 5> (appears in [Shot 2]): fully_preserved - his curly hair and navy floral board shorts are retained.
<Subject 6> (appears in [Shot 1], [Shot 2]): weak_reference - only the variety of clothing, ages and builds is taken from the two crowd sheets.
<Subject 7> (appears in [Shot 1], [Shot 2], [Shot 3]): partially_preserved - the beach is kept while the sea is now deep yellow and foamy.
Only identity and clothing come from the pictures, never their poses, gray studio backgrounds, panel layouts or grids.

detailed_description:
{STYLE} Each defined person appears EXACTLY ONCE; the crowd never contains a second copy of any of them.
[Shot 1] A wide shot from the dry sand looking out to sea. The water of <Subject 7> is deep yellow and churning with thick white foam, bubbles boiling up everywhere. <Subject 6> splashes out of the shallows toward the camera in a panicked rush, people stumbling through the foam, lifting their knees high and shouting. The camera holds a static shot.
[Shot 2] At 00:03.500, the shot cuts to a frontal medium shot. <Subject 5> runs through ankle-deep foam toward the camera, pulling <Subject 4> by the hand; she presses her free hand to her head as her hair blows, her straw tote swinging from her shoulder, both wide-eyed and yelling. Blurred members of <Subject 6> run past behind them. The camera pulls out at fast speed, tracking backward to keep pace.
[Shot 3] At 00:07.000, the shot cuts to a medium-wide shot at the waterline. <Subject 2> charges out of the yellow foam carrying <Subject 3> on his hip, her pink swim ring still around her waist, his towel flapping. Behind them, <Subject 1> stands knee-deep at the edge of the foam, waving one arm in big circles toward the beach. The camera shakes slightly, like a handheld camera running alongside.
No one says a clear line; the shouting is crowd noise only. {NOTEXT}

overall_soundscape:
A roar of hissing, fizzing foam and crashing waves mixes with panicked crowd shouts, screams and heavy splashing footsteps through water. Feet thud on wet sand and the lifeguard's whistle shrills in the distance.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch5
PROMPTS["ch5"] = f"""subject_definitions:
<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}.
<Subject 2> is the sea off a Japanese beach at summer noon, which becomes an endless ocean of golden beer with a thick white foam head reaching the horizon.

summary:
[reference generation] Far offshore, the sea of <Subject 2> swells into a mound of foam, the white mask of <Subject 1> breaches the surface, and the colossal <Subject 1> rises to his waist with his head among the clouds while tiny beachgoers watch.

retention_analysis:
<Subject 1> (appears in [Shot 2], [Shot 3]): fully_preserved - the white mask with its two round eye holes, single mouth slit, four red markings and forehead dot, the spiky black hair, gray skin, heavy build and white T-shirt are retained at a gigantic scale; only identity and design come from <Picture 1>, never its poses, cream background, panel layout, labels or color swatches.
<Subject 2> (appears in [Shot 1], [Shot 2], [Shot 3]): partially_preserved - the sea is kept while it becomes golden beer topped with foam.

detailed_description:
{STYLE} {GIANT} Exactly one giant appears, <Subject 1>, EXACTLY ONCE; the only people are tiny distant beachgoers.
[Shot 1] A wide shot from the beach looking out to sea. In the foreground, small silhouettes of beachgoers seen from behind have stopped running and turn to look, next to abandoned beach umbrellas. Far offshore, the golden-yellow surface of <Subject 2> bulges upward into a vast dome, foam boiling over its top, waves rushing outward. The camera holds a static shot.
[Shot 2] At 00:04.000, the shot cuts to a telephoto shot of the foaming dome. The top of a hard white mask breaks through the surface, then the whole mask of <Subject 1> rises slowly, its two round black eye holes, single mouth slit, red markings and forehead dot streaming with beer, cascades of amber liquid and foam pouring from his spiky black hair. The camera tilts up with small amplitude at slow speed.
[Shot 3] At 00:08.000, the shot cuts to an extreme wide low-angle shot from the beach. <Subject 1> rises out of the sea to his waist, so tall that his head reaches the cumulus clouds, beer and foam sheeting off his gray shoulders and white T-shirt. As far as the eye can see, the sea is now golden beer with a thick white foam head stretching to the horizon. The beachgoers and umbrellas in the foreground are as small as grains of rice. His right hand stays submerged in the beer sea. The camera pulls out with large amplitude at slow speed.
{MASK} Nobody speaks. {NOTEXT}

overall_soundscape:
A deep rumble swells from under the sea, then a thunderous roar of displaced liquid and cascading torrents as the giant rises, with fizzing foam crackling across the whole ocean. Distant gasps and screams rise from the beach, and gulls scatter.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch6
PROMPTS["ch6"] = f"""subject_definitions:
<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. He holds {MUG}.
<Subject 2> is the ocean of golden beer with a thick white foam head off a Japanese beach at summer noon.

summary:
[reference generation] Standing waist-deep in <Subject 2>, <Subject 1> lifts his giant beer mug out of the sea, filled to overflowing, raises it to his mask and drinks with deep satisfaction.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2]): fully_preserved - the white mask with its two round eye holes, single mouth slit, four red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt and the clear glass beer mug are retained at a gigantic scale; only identity and design come from <Picture 1>, never its poses, cream background, panel layout, labels or color swatches.
<Subject 2> (appears in [Shot 1], [Shot 2]): fully_preserved - the golden beer ocean and its foam head are retained.

detailed_description:
{STYLE} {GIANT} Exactly one giant appears, <Subject 1>, EXACTLY ONCE.
[Shot 1] A medium-wide shot from the beach of <Subject 1> from the waist up, towering over the golden beer ocean of <Subject 2> with clouds around his shoulders; a strip of beach umbrellas sits tiny at the bottom of frame. His right hand rises out of the sea gripping the handle of the giant clear glass beer mug, filled to the brim; amber beer and white foam overflow and pour down its sides in waterfalls that crash back into the sea. He holds the full mug at chest height. The camera holds a static shot.
[Shot 2] At 00:05.000, the shot cuts to a low-angle medium shot looking up at <Subject 1>. He brings the mug to the mouth slit of his mask and tilts it back; beer flows into the slit in a steady golden stream while his throat works with each huge gulp. He lowers the mug, now one-third full, and lets his broad shoulders drop in a contented sigh. Drops of beer fall from the rim like a rain shower onto the foam below. The camera pushes in with small amplitude at slow speed.
{MASK} He never speaks. {NOTEXT}

overall_soundscape:
A rushing roar of overflowing beer pours back into the sea, followed by enormous, slow gulping sounds that echo across the water and a deep, satisfied exhale like a gust of wind. Foam fizzes and crackles everywhere, and beer droplets patter onto the surface.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch7
PROMPTS["ch7"] = f"""subject_definitions:
<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. He holds {MUG}.
<Subject 2> is {DESC['lifeguard'].format(p='<Picture 2>')}.
<Subject 3> is {DESC['father'].format(p='<Picture 3>')}.
<Subject 4> is {DESC['child'].format(p='<Picture 4>')}.
<Subject 5> is {DESC['woman'].format(p='<Picture 5>')}.
<Subject 6> is {DESC['man'].format(p='<Picture 6>')}.
<Subject 7> is {DESC['crowd'].format(p='<Picture 7>', q='<Picture 8>')}.

summary:
[reference generation] <Subject 5>, <Subject 6>, <Subject 3> carrying <Subject 4>, and <Subject 2> sprint screaming across the sand toward the camera, then <Subject 7> streams off the emptied beach while the colossal <Subject 1> keeps drinking far offshore.

retention_analysis:
<Subject 1> (appears in [Shot 1], [Shot 2]): fully_preserved - the white mask, spiky black hair, gray skin, white T-shirt and beer mug are retained, seen far away; only identity and design come from <Picture 1>, never its poses, background, panels, labels or swatches.
<Subject 2> (appears in [Shot 1]): fully_preserved - his face, red cap, red and yellow rash guard and rescue tube are retained.
<Subject 3> (appears in [Shot 1]): fully_preserved - his face, black rash guard, towel and floral board shorts are retained.
<Subject 4> (appears in [Shot 1]): fully_preserved - her hair bun, pink swimsuit and pink swim ring are retained.
<Subject 5> (appears in [Shot 1]): fully_preserved - her bob, lavender bikini top and denim shorts are retained.
<Subject 6> (appears in [Shot 1]): fully_preserved - his curly hair and navy floral board shorts are retained.
<Subject 7> (appears in [Shot 2]): weak_reference - only the variety of clothing, ages and builds is taken from the two crowd sheets.
Only identity and clothing come from the pictures, never their poses, gray studio backgrounds, panel layouts or grids.

detailed_description:
{STYLE} {GIANT} Each defined person appears EXACTLY ONCE; the crowd never contains a second copy of any of them.
[Shot 1] A frontal medium-wide shot on the sand. <Subject 6> and <Subject 5> run hand in hand straight toward the camera, screaming, her straw tote bouncing; just behind them, <Subject 3> runs carrying <Subject 4> on his hip, her pink swim ring around her waist; <Subject 2> runs at the rear, waving everyone on. A striped beach ball rolls across the sand. Far behind them, out of focus, the colossal <Subject 1> stands waist-deep in the golden beer sea under the clouds. The camera pulls out at fast speed, tracking backward with them.
[Shot 2] At 00:04.000, the shot cuts to a high wide shot from a seaside promenade. <Subject 7> streams off the beach toward the town in a single panicked wave, leaving toppled beach umbrellas and scattered towels on the empty sand. Beyond the shoreline, <Subject 1> calmly tilts his giant beer mug to his mask and drinks, unbothered. The camera holds a static shot.
In every frame the mask of <Subject 1> stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, a nose or lips. No one says a clear line; the screaming is crowd noise only. {NOTEXT}

overall_soundscape:
Screams and panicked shouting surge from the crowd over pounding footsteps on sand, heavy breathing and the distant fizz of the beer sea. Far away, enormous slow gulps echo across the water.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch8
PROMPTS["ch8"] = f"""subject_definitions:
<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. He holds {MUG}.
<Subject 2> is a formation of four gray fighter jets with swept wings and twin tails, painted plain matte gray with no markings, roundels, numbers or lettering anywhere.

summary:
[reference generation] Four <Subject 2> jets roar in low over the beach, circle the head of the colossal <Subject 1> like flies while he keeps drinking, then fire a salvo of missiles that hit his chest and mask in huge fireballs.

retention_analysis:
<Subject 1> (appears in [Shot 2], [Shot 3]): fully_preserved - the white mask with its two round eye holes, single mouth slit, four red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt and beer mug are retained at a gigantic scale; only identity and design come from <Picture 1>, never its poses, cream background, panel layout, labels or color swatches.
<Subject 2> (appears in [Shot 1], [Shot 2], [Shot 3]): fully_preserved - four plain gray unmarked jets.

detailed_description:
{STYLE} {GIANT} Exactly one giant appears, <Subject 1>, EXACTLY ONCE, and exactly four jets.
[Shot 1] A low-angle shot from the beach straight up into the blue sky. The four jets of <Subject 2> scream overhead in a tight diamond formation at low altitude, afterburners glowing orange, heat shimmer trailing behind them, shaking the umbrellas below. The camera holds a static shot.
[Shot 2] At 00:03.000, the shot cuts to a wide shot of <Subject 1> standing waist-deep in the golden beer ocean, clouds around his shoulders. The tiny jets of <Subject 2> bank in a wide circle around his enormous masked head, drawing curving white contrails like flies buzzing around him, while he calmly keeps sipping from his giant beer mug and does not even look at them. The camera arcs around him with large amplitude at slow speed.
[Shot 3] At 00:07.000, the shot cuts to a medium-wide shot. All four jets fire at once: missiles streak from under their wings on white smoke trails and slam into the chest and mask of <Subject 1>, erupting in huge orange fireballs and billowing black smoke that engulfs his whole upper body. The explosions stay on him and never reach the beach or the town. The camera shakes slightly with each shockwave.
Until the smoke hides him, his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never human eyes, a nose or lips. Nobody speaks. The jets carry no markings, and there is no readable text anywhere: no numbers, no logos, no subtitles or captions.

overall_soundscape:
Jet engines thunder overhead with a ripping roar that fades and returns as they circle, joined by the distant fizz of the beer ocean and the giant's calm slurping. The missile launch whooshes, then a chain of massive booming explosions with rolling shockwaves and crackling flames.

non_diegetic_music:
N/A
"""

# ---------------------------------------------------------------- ch9
PROMPTS["ch9"] = f"""subject_definitions:
<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. He holds {MUG}.
<Audio 1> is the voice of <Subject 1> (S1).

summary:
[reference generation + audio reuse] As the black smoke blows away, <Subject 1> is revealed completely unharmed, raises his giant beer mug to the sky and declares his line from <Audio 1>, then takes another sip as tiny jets fly off.

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth slit, four red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt and beer mug are retained at a gigantic scale, all completely undamaged; only identity and design come from <Picture 1>, never its poses, cream background, panel layout, labels or color swatches.
<Audio 1>: partially_copy - his line is copied 1:1 as his voice while wind and foam sounds are added around it.

detailed_description:
{STYLE} {GIANT} Exactly one giant appears, <Subject 1>, EXACTLY ONCE.
[Shot 1] A low-angle medium shot of <Subject 1> from the chest up, his upper body hidden in thick black smoke against the blue sky. A sea wind carries the smoke away in drifting curtains, revealing him completely unharmed: his white mask is spotless with no scorch marks or cracks, his white T-shirt is clean, and the giant beer mug is still full of amber beer and foam in his right hand. He raises the mug high toward the sky in a triumphant toast and <Subject 1> (S1) declares in a deep, booming, joyful voice, using <Audio 1> as-is with no other voice, <d>[Japanese] ビール最高！</d> His mask does not move as he speaks; the mouth slit stays unchanged. He then brings the mug to the mouth slit and takes another long, happy sip. Far behind him, the four tiny gray jets fly away into the distance. The camera pushes in with small amplitude at slow speed.
{MASK} The jets carry no markings. {NOTEXT}

overall_soundscape:
A strong sea wind rushes as the smoke clears, with the crackle of dying flames and the fizz of the beer ocean below. His voice booms and echoes across the water, followed by a long, satisfied gulp and the fading roar of jets in the distance.

non_diegetic_music:
N/A
"""


def main() -> None:
    here = Path(__file__).parent
    for ch, text in PROMPTS.items():
        (here / f"{ch}_prompt.txt").write_text(text.strip() + "\n", encoding="utf-8")
        d = text.split("detailed_description:")[1].split("overall_soundscape:")[0]
        print(f"{ch}: detailed_description {len(d.split())} words, total {len(text.split())}")


if __name__ == "__main__":
    main()
