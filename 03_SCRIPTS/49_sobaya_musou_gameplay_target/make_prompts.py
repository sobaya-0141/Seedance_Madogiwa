#!/usr/bin/env python3
"""Write chN_prompt.txt for 49_sobaya_musou_gameplay_target (official Ref2VA six-section format).

Target video: ideal gameplay footage of the Godot action game "Sobaya Musou", rendered like real-time 3D graphics of a
modern AAA console game (user decision 2026-11-06; an approved exception to the skill's photoreal default).
The subject definitions are shared strings so every chapter describes a person with the same words.
<Picture N> order per chapter is the IMAGES table; gen_all_workflows.sh attaches in the same order.
Run from this directory: python3 make_prompts.py
"""
from pathlib import Path

DESC = {
    "sobaya": "the masked brawler in {p}, a hulking 180 cm, 100 kg man with a thick, heavy, muscular build, whose face is fully covered by a hard glossy white mask with TWO large round black eye holes that are completely dark inside, ONE short horizontal black mouth slit, glossy red vertical markings running above and below each eye hole exactly as in the reference, and ONE small black dot centered on the forehead; short spiky black hair sticks out above and behind the mask, his neck, ears, arms and hands are neutral gray, and he wears a plain white short-sleeve T-shirt, dark charcoal jeans and white sneakers",
    "factory_guard": "the brewery security-guard uniform in {p}: a light sky-blue short-sleeve uniform shirt with two chest pockets and dark-navy epaulettes, dark-navy trousers, a black belt, light-gray work gloves, black shoes and a dark-navy peaked cap with a plain silver shield emblem",
    "police": "the police-officer uniform in {p}: a dark-navy uniform jacket with gold buttons and a plain gold shield badge, a white shirt with a navy tie, a black duty belt, white gloves, black shoes, a dark-navy peaked cap with a plain round gold emblem, and a black baton in the right hand",
    "inspector": "the police inspector in {p}, a huge barrel-chested Japanese man in his fifties, about 190 cm tall, with a thick black mustache and gray-black hair, in a near-black navy uniform with gold buttons and gold cuff bands, a white shirt and dark tie, white gloves, and a dark-navy peaked cap with a large round gold emblem and a gold band",
    "motor_police": "the motorcycle-police uniform in {p}: a glossy white helmet with a blue center stripe and a smoked visor, a sky-blue zip-up uniform jacket with dark-navy epaulettes, a white belt, dark-navy riding breeches with a white side stripe, tall black riding boots and white gloves",
    "riot_chief": "the riot squad captain in {p}, a huge, broad Japanese man in his forties with a square jaw and a fierce scowl, in a dark-navy riot uniform with black plate armor on his chest, shoulders, forearms, knees and shins, black gloves and boots, and a dark-navy riot helmet with its clear visor raised, carrying a tall clear transparent riot shield",
    "hq_guard": "the corporate building-security uniform in {p}: a medium-gray zip-up uniform jacket with plain silver shield patches, a white shirt with a navy tie, a black belt, black shoes, a black baton, and a medium-gray peaked cap with a plain silver shield emblem",
    "security_head": "the head of corporate security in {p}, a huge, heavy Japanese man in his late fifties with short salt-and-pepper hair, in a dark-navy suit-style uniform with gold shoulder boards, a gold braided cord across his chest and gold buttons, a white shirt and navy tie, white gloves, and a dark-navy peaked cap with a large round gold emblem",
    "office": "the office workers whose faces, ages and clothes come from the seven different people in {p}: white and light-blue shirts with ties, a light-blue blouse, a beige cardigan, a gray vest, a navy jacket, each with a blank white ID card on a blue neck strap",
    "street": "the shopping-street people from {p}: the taiyaki cook, a cheerful Japanese man in his sixties in a white cook's jacket, white apron and white cook's cap, and the passers-by — an elderly woman in a lavender cardigan with a cloth shopping bag, a high-school girl in a navy sailor uniform, a salaryman in a dark-gray suit with a briefcase, a young woman in a camel coat, and a man in a green jacket walking a shiba dog",
}

LOC = {
    "yard": "the front yard of the golden beer brewery in {p} on a sunny summer midday: gray concrete ground with yellow painted safety lines, cream-colored factory buildings with dark steel pillars and long silver pipes, white box trucks with yellow cabs, pallets stacked with red and yellow plastic beer crates, tall silver silos behind, and a large closed gray roll-up shutter at the far end",
    "line": "the production hall of the golden beer brewery in {p}: tall polished stainless-steel brewing tanks with yellow railings on both sides, two long conveyor belts carrying rows of brown glass beer bottles along a central walkway with yellow lines, skylights casting soft beams of sunlight through faint haze, and at the far end a glowing alcove with three golden wooden beer barrels with brass taps",
    "street": "the Azabu-Juban shopping street in {p} at sunset: a pink-orange sky, a two-lane asphalt street wet after rain with reflective puddles, brick-tiled sidewalks, small shops with red, green, yellow and purple fabric awnings and glowing windows, a taiyaki stall with a red canopy and a glass case of fish-shaped cakes, a fruit stand, rows of glowing red paper lanterns, a red steel welcome arch over the street, utility poles with power lines, lit curved street lamps and tall glass towers in the distance",
    "plaza": "the paved plaza in front of the corporate headquarters tower in {p} just after sunset: a sky fading from orange to deep blue, a tall dark-blue glass curtain-wall skyscraper with scattered warm lit windows, a glass entrance under a white steel canopy, large gray stone paving tiles, stone planters with trees lit from below, low bollard lights, and the red-and-white Tokyo Tower glowing in the right distance",
    "office": "the headquarters interior in {p}: the ground-floor lobby with a polished white-and-beige checkerboard marble floor, thick round white columns, a white reception counter with a wooden top before a dark wood wall, gray sofas and potted plants, silver elevators and a glass partition with security turnstiles; and the 12th-floor open-plan office with navy-blue checkered carpet tiles, long white island desks with monitors showing soft abstract colors, black mesh office chairs, a glass-walled meeting room, tall wooden bookshelves and white ceiling light panels",
    "madogiwa": "the do-it-yourself window-side hangout corner of the 12th-floor office in {p}: floor-to-ceiling glass windows with slim metal mullions, a wide Tokyo cityscape with the red-and-white Tokyo Tower beyond, a warm wooden plank floor, a wooden Japanese standing-bar stall with a shingled roof, a chrome beer server and glass mugs on its counter, three dark-navy noren curtain panels and two round red paper lanterns, plus wooden beer barrels, a chair made of stacked cardboard boxes, a green dome tent, a black kettle grill, a red-brown sofa with tall speakers, a floor lamp and stacked cardboard boxes",
}

MUG_FULL = "In his right hand he holds a large clear glass beer mug with a handle, full of amber beer under a white foam head; he swings it as his weapon, and it never breaks or spills"
STYLE = ("The target video is real-time 3D gameplay footage from a modern AAA console action game, rendered in the same "
         "high-end game-CG style as the reference sheets: physically based materials, global illumination, soft "
         "contact shadows, crisp specular highlights, subtle motion blur on fast swings, rich saturated colors. There "
         "is no HUD and no interface: no health bars, no counters, no icons.")
GAMECAM = ("an elevated third-person game camera about 8 meters behind <Subject 1> and 4.5 meters above the ground, "
           "looking down over his back at about 25 degrees, so he is seen from behind in the lower center of frame, "
           "like an action game's chase camera")
GAMECAM_CAP = GAMECAM[0].upper() + GAMECAM[1:]
KO = ("Every enemy who is hit is knocked flying in a comical, cartoon way, tumbles across the floor and ends up lying "
      "dazed with three small yellow stars circling above his head; there is no blood and nobody is seriously hurt.")
MASK = ("In every frame his mask stays a rigid white mask with two black eye holes and one unchanging mouth slit, never "
        "human eyes, eyelids, a nose or lips; his hair stays short, black and spiky and his skin stays neutral gray.")
NOTEXT = ("There is no readable text anywhere: no letters on signs, banners, trucks, uniforms or screens, no logos, no "
          "subtitles or captions.")
ONLY = "Only identity, clothing and design come from the pictures, never their poses, gray studio backgrounds or panel layouts."

PROMPTS = {}

ONE_TAKE = ("The whole chapter is ONE continuous take with no cuts: the camera stays the elevated third-person game "
            "camera behind <Subject 1> from the first frame to the last, smoothly following him as he moves and turning "
            "gently with him like a player-controlled chase camera; it never cuts, never switches to a close-up, a low "
            "angle, a side view or a front view, and never shows his mask from the front for more than a moment.")
NOSHEET = ("The whole frame is always the game scene: no part of any reference picture appears — no close-up panel of "
           "the mask, no gray studio background, no character lineup, no split screen or inset.")
HORDE = ("Enemies keep pouring in for the whole chapter like a musou action game: whenever some are knocked down, new "
         "ones run in from the far end and from both sides, so there are always about fifteen to twenty enemies on screen.")
HIT = ("Every hit lands with a bright white impact spark, and area attacks send out a ring-shaped golden shockwave across "
       "the ground.")
SPIN_MASK = ("Even while he spins, swings or gets hit, his mask stays rigid and unchanged; it never opens, melts or turns into a face. When he is hit he only staggers and recovers at once, like a game hit reaction; he is never hurt.")


def chapter(defs, summary, retention, body, sound, extra=""):
    return f"""subject_definitions:
{defs}

summary:
{summary}

retention_analysis:
{retention}
{ONLY}

detailed_description:
{STYLE} {ONE_TAKE} {NOSHEET}
[Shot 1] {body}
{HORDE} {HIT} {KO} {MASK} {SPIN_MASK} {extra}{NOTEXT}

overall_soundscape:
{sound}

non_diegetic_music:
N/A
"""


SOB_RET = ("<Subject 1> (appears in [Shot 1]): fully_preserved - the white mask with its two round eye holes, single mouth "
           "slit, red markings and forehead dot, the spiky black hair, gray skin, heavy build, white T-shirt, charcoal jeans, "
           "white sneakers and the clear glass beer mug are retained; he is seen mostly from behind.")

# ---------------------------------------------------------------- ch1
PROMPTS["ch1"] = chapter(
    f"""<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. {MUG_FULL}.
<Subject 2> is {DESC['factory_guard'].format(p='<Picture 2>')}; a crowd of about fifteen to twenty guards wears it, Japanese men of different ages and builds.
<Subject 3> is {LOC['yard'].format(p='<Picture 3>')}.
<Audio 1> is the voice-timbre reference for <Subject 1> (S1).""",
    "[reference generation + audio reuse] One continuous gameplay take from the chase camera: in the brewery yard of <Subject 3>, <Subject 1> growls his line in the voice of <Audio 1> as he charges into a horde of guards of <Subject 2>, smashing through them with a four-hit combo, a ground-slam shockwave and nonstop attacks while more keep running in.",
    f"""{SOB_RET}
<Subject 2> (appears in [Shot 1]): partially_preserved - the sky-blue shirt, navy trousers, gray gloves and navy cap with silver emblem are retained on many different men.
<Subject 3> (appears in [Shot 1]): fully_preserved - the concrete yard, yellow lines, cream buildings, white-and-yellow trucks, beer crates, silos and gray shutter stay the same.
<Audio 1>: reference - only the voice timbre of <Subject 1> is taken from it; the line is newly performed in that voice.""",
    "The game camera starts behind <Subject 1> at the near end of <Subject 3> on a sunny summer midday, trucks and beer-crate pallets on both sides, the gray shutter far ahead. At 00:00.300, <Subject 1> starts running forward and (S1) growls in a deep, gravelly, monster-like voice whose timbre follows <Audio 1>, the voice coming from behind his mask, <d>[Japanese] ビールが…足りない…！</d> The mouth slit of his mask never moves. A horde of guards of <Subject 2> charges at him from in front of the shutter and from behind the trucks. From about 00:02.000 he crashes into the front of the horde with a four-hit combo — a straight punch with the beer mug, a wide hook, another punch and a downward slam — and four or five guards are blasted backward together. At about 00:06.000, a guard who has circled behind him punches him in the back: <Subject 1> lurches forward and staggers a step in a comical hit reaction, catches his balance at once, spins around and swats that guard away with a backhand swing of the mug, then swats away others circling in from the left and right. At about 00:07.000, surrounded, he raises the mug overhead and slams it into the concrete; a golden shockwave ring bursts out and seven or eight guards around him fly into the air. From about 00:11.000 he keeps advancing toward the shutter, knocking down each new wave of guards with quick combos. The take ends with him pushing forward among many dazed guards lying on the concrete. The camera follows him the whole time at the same distance and height.",
    "Summer cicadas and a distant factory hum under a constant battle roar: dozens of running footsteps, guards shouting, rapid whooshing mug swings and punchy comical impacts, bodies thumping onto concrete, and a deep booming ground slam with a rolling shockwave and fizzing beer.")

# ---------------------------------------------------------------- ch2
PROMPTS["ch2"] = chapter(
    f"""<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. {MUG_FULL}.
<Subject 2> is {DESC['police'].format(p='<Picture 2>')}; a crowd of about twelve to fifteen officers wears it, Japanese men of different ages and builds.
<Subject 3> is {DESC['inspector'].format(p='<Picture 3>')}.
<Subject 4> is {LOC['line'].format(p='<Picture 4>')}.""",
    "[reference generation] One continuous gameplay take from the chase camera: in the brewery production hall of <Subject 4>, <Subject 1> fights through a horde of officers of <Subject 2>, rolls under the boss <Subject 3>'s floor shockwave, then unleashes a glowing golden spinning musou attack that blasts the officers and <Subject 3> away.",
    f"""{SOB_RET}
<Subject 2> (appears in [Shot 1]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and black baton are retained on many different men.
<Subject 3> (appears in [Shot 1]): fully_preserved - his huge build, black mustache, near-black navy uniform with gold trim, white gloves and gold-banded cap are retained; he appears EXACTLY ONCE.
<Subject 4> (appears in [Shot 1]): fully_preserved - the steel tanks, bottle conveyors, skylight beams and golden barrels stay the same.""",
    "The game camera looks down the central walkway of <Subject 4> over the back of <Subject 1>, bottle conveyors running on both sides and skylight beams slanting through faint haze. At the far end stands the boss <Subject 3>; a horde of officers of <Subject 2> rushes down the walkway with batons raised. From the start <Subject 1> meets them with punches, hooks and slams of the beer mug, pushing the horde back as officers fly over the conveyors. At about 00:04.000, <Subject 3> drops to one knee and pounds the floor; an orange shockwave ring races toward <Subject 1>, who dives into a forward roll to the side but is clipped by the edge of the ring: he is knocked back a couple of meters, drops to one knee in a comical hit reaction, and immediately springs back to his feet. At about 00:07.000, his beer mug glows bright gold and golden sparks rise around him; he spins like a top with the mug held out and advances through the horde, officers flying away in every direction, until he reaches <Subject 3> and blasts him off his feet too; a large golden ring of light bursts outward. From about 00:11.000, <Subject 3> lies flat on his back with stars circling over his head, and <Subject 1> walks on toward the glowing golden barrels at the far end. The camera follows him the whole time at the same distance and height, always behind his back; it never swings around in front of him, even while he spins.",
    "Clinking bottles on moving conveyors and a steady machine hum under a battle roar: shouting officers, baton clatter, whooshing swings and comical impacts, a heavy floor-pounding boom with a crackling shockwave, a quick roll, a rising golden whoosh, a whirlwind of spinning air with rapid impacts and yelps, and a bright booming burst.")

# ---------------------------------------------------------------- ch3
PROMPTS["ch3"] = chapter(
    f"""<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. {MUG_FULL}.
<Subject 2> is {DESC['police'].format(p='<Picture 2>')}; about ten to twelve officers wear it, Japanese men of different ages and builds.
<Subject 3> is {DESC['motor_police'].format(p='<Picture 3>')}; about five to eight officers wear it.
<Subject 4> is {DESC['street'].format(p='<Picture 4>')}; each of them appears once on the sidewalks or at the stall, and none of them fights.
<Subject 5> is {LOC['street'].format(p='<Picture 5>')}.""",
    "[reference generation] One continuous gameplay take from the chase camera: at sunset in the shopping street of <Subject 5>, <Subject 1> battles a horde of officers of <Subject 2> and motorcycle officers of <Subject 3> with combos and a spinning sweep, splashing them into puddles, while the cook and passers-by of <Subject 4> calmly carry on.",
    f"""{SOB_RET}
<Subject 2> (appears in [Shot 1]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and baton are retained on many different men.
<Subject 3> (appears in [Shot 1]): partially_preserved - the white striped helmet, sky-blue jacket, navy breeches and tall black boots are retained on several men.
<Subject 4> (appears in [Shot 1]): partially_preserved - the cook's white outfit and the passers-by's clothes are retained.
<Subject 5> (appears in [Shot 1]): fully_preserved - the sunset sky, wet street, awnings, red lanterns, welcome arch, taiyaki stall and street lamps stay the same.""",
    "The game camera follows <Subject 1> running down the middle of the wet street of <Subject 5> at sunset under the glowing red lanterns, the red welcome arch ahead. A horde of officers of <Subject 2> and motorcycle officers of <Subject 3> pours in from beyond the arch and from the side alleys. On the sidewalks, the taiyaki cook of <Subject 4> keeps turning cakes at his red-canopied stall and the passers-by of <Subject 4> keep strolling and chatting, never joining the fight and never looking alarmed; no enemy ever lands on them. From about 00:03.000, <Subject 1> crashes into the horde with a four-hit combo, and the officers he hits fly backward and splash down into the puddles. At about 00:07.000, two officers strike him with their batons at the same moment from both sides: he reels and staggers in a comical hit reaction, then plants his feet. At about 00:08.000, still surrounded, he answers with a spin of one full turn with the beer mug held out and six to eight officers around him are swept off their feet and fly under the lanterns. From about 00:12.000, he keeps advancing toward the arch, knocking down each new wave. The take ends with him pushing on among many dazed officers lying on the wet street. The camera follows him the whole time at the same distance and height.",
    "Evening street ambience with distant chatter, a bicycle bell and the sizzle of taiyaki batter under a battle roar: police whistles, running boots splashing through puddles, shouting, whooshing swings, comical impacts and big water splashes.")

# ---------------------------------------------------------------- ch4
PROMPTS["ch4"] = chapter(
    f"""<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. {MUG_FULL}.
<Subject 2> is {DESC['riot_chief'].format(p='<Picture 2>')}.
<Subject 3> is {DESC['police'].format(p='<Picture 3>')}; a crowd of about twelve to fifteen officers wears it, Japanese men of different ages and builds.
<Subject 4> is {LOC['plaza'].format(p='<Picture 4>')}.""",
    "[reference generation] One continuous gameplay take from the chase camera: at dusk on the headquarters plaza of <Subject 4>, <Subject 1> mows down a horde of officers of <Subject 3>, catches the shield charge of the boss <Subject 2> with his beer mug and shoves him back, then slams the ground and launches <Subject 2> and the officers high into the air.",
    f"""{SOB_RET}
<Subject 2> (appears in [Shot 1]): fully_preserved - his huge build, square jaw, navy riot uniform with black armor, raised-visor helmet and clear riot shield are retained; he appears EXACTLY ONCE.
<Subject 3> (appears in [Shot 1]): partially_preserved - the navy uniform, gold badge, white gloves, navy cap and baton are retained on many different men.
<Subject 4> (appears in [Shot 1]): fully_preserved - the dusk sky, dark-blue glass tower, canopy entrance, stone paving, lit planters and Tokyo Tower stay the same.""",
    "The game camera follows <Subject 1> across the stone plaza of <Subject 4> just after sunset, the glowing glass tower and its entrance ahead and Tokyo Tower small in the right distance. In front of the entrance stands the boss <Subject 2> with his clear riot shield, and a horde of officers of <Subject 3> rushes at <Subject 1>, who mows them down with punches, hooks and slams of the beer mug. At about 00:04.000, <Subject 2> charges shield-first; <Subject 1> catches the shield with his mug but the impact shoves him two or three meters backward, his sneakers skidding on the paving in a comical hit reaction; he digs in, holds, and then shoves <Subject 2> back. At about 00:08.000, <Subject 1> raises the mug and slams it into the paving; a golden shockwave ring explodes outward and <Subject 2>, still clutching his shield, and the officers around him are launched high into the dusk sky and come tumbling down. From about 00:12.000, <Subject 2> lies dazed with stars circling over his head, and <Subject 1> walks on toward the glass entrance. The camera follows him the whole time at the same distance and height.",
    "A calm evening breeze and distant city traffic under a battle roar: shouting officers, running footsteps on stone, whooshing swings and comical impacts, a heavy shield clash and scraping slide, a huge booming ground slam with a rolling shockwave, and the clatter of the falling shield.")

# ---------------------------------------------------------------- ch5
PROMPTS["ch5"] = chapter(
    f"""<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. {MUG_FULL}.
<Subject 2> is {DESC['hq_guard'].format(p='<Picture 2>')}; a crowd of about fifteen to twenty guards wears it, Japanese men of different ages and builds.
<Subject 3> is the ground-floor entrance lobby of the headquarters in <Picture 3>: a polished white-and-beige checkerboard marble floor that reflects everyone, thick round white columns, a white reception counter with a wooden top before a dark wood wall, gray sofas and potted plants, silver elevators in the side walls, and a glass partition with security turnstiles at the far end.""",
    "[reference generation] One continuous gameplay take from the chase camera: in the marble lobby of <Subject 3> on a bright morning, <Subject 1> fights through a horde of building guards of <Subject 2> pouring out of the turnstiles and elevators, with combos that send them sliding across the polished floor and a ground slam that scatters them between the columns.",
    f"""{SOB_RET}
<Subject 2> (appears in [Shot 1]): partially_preserved - the gray uniform, navy tie, gray cap with silver emblem and black baton are retained on many different men.
<Subject 3> (appears in [Shot 1]): fully_preserved - the checkerboard marble floor, white columns, reception counter, sofas, elevators and turnstiles stay the same; the office floor of the sheet is not used.""",
    "The game camera follows <Subject 1> running across the lobby of <Subject 3> in bright morning light, the marble floor polished like a mirror and reflecting everyone. A horde of guards of <Subject 2> pours through the glass turnstiles at the far end and out of the silver elevators on both sides. From about 00:03.000, <Subject 1> crashes into them with a four-hit combo, and the guards he hits slide and spin across the polished marble. At about 00:07.000, a guard lands a baton blow on his shoulder and he rocks back in a comical hit reaction, then recovers at once. At about 00:08.000, still surrounded, he slams the beer mug into the floor; a golden shockwave ring skims across the marble and seven or eight guards fly up and scatter between the white columns. From about 00:12.000, he keeps advancing toward the turnstiles, knocking down each new wave. The take ends with him pushing toward the turnstiles among many dazed guards on the marble. The reception counter, sofas and plants are never destroyed. The camera follows him the whole time at the same distance and height.",
    "The airy echo of a marble lobby with soft turnstile beeps and elevator chimes under a battle roar: squeaking shoes, shouting guards, whooshing swings and comical impacts, bodies sliding on polished stone, and a booming slam that echoes off the columns.")

# ---------------------------------------------------------------- ch6
PROMPTS["ch6"] = chapter(
    f"""<Subject 1> is {DESC['sobaya'].format(p='<Picture 1>')}. {MUG_FULL}.
<Subject 2> is {DESC['security_head'].format(p='<Picture 2>')}.
<Subject 3> is {DESC['hq_guard'].format(p='<Picture 3>')}; a crowd of about twelve to fifteen guards wears it, Japanese men of different ages and builds.
<Subject 4> is {LOC['madogiwa'].format(p='<Picture 4>')}.
<Audio 1> is the voice-timbre reference for <Subject 1> (S1).""",
    "[reference generation + audio reuse] One continuous gameplay take from the chase camera: in the window-side hangout corner of <Subject 4>, <Subject 1> shouts his line in the voice of <Audio 1> as his beer mug glows gold, spins through a horde of guards of <Subject 3>, beats the boss <Subject 2> with a combo and a final slam, and raises his mug in a victory pose in front of the standing-bar stall.",
    f"""{SOB_RET}
<Subject 2> (appears in [Shot 1]): fully_preserved - his huge build, salt-and-pepper hair, navy suit-style uniform with gold shoulder boards and braided cord, white gloves and gold-emblem cap are retained; he appears EXACTLY ONCE.
<Subject 3> (appears in [Shot 1]): partially_preserved - the gray uniform, navy tie, gray cap and baton are retained on many different men.
<Subject 4> (appears in [Shot 1]): fully_preserved - the glass window wall with Tokyo Tower, wooden floor, standing-bar stall with navy noren and red lanterns, barrels, cardboard chair, tent, grill and sofa stay the same.
<Audio 1>: reference - only the voice timbre of <Subject 1> is taken from it; the line is newly performed in that voice.""",
    "The game camera looks over the back of <Subject 1> toward the glass window wall of <Subject 4> in early morning, low golden sunlight laying long window-frame shadows across the wooden floor and Tokyo Tower beyond the glass. In front of the standing-bar stall stands the boss <Subject 2>, surrounded by a horde of guards of <Subject 3>. At 00:00.300, the beer mug of <Subject 1> glows bright gold, golden sparks rise around him, and <Subject 1> (S1) shouts as a battle cry in a deep, gravelly, monster-like voice whose timbre follows <Audio 1>, the voice coming from behind his mask, <d>[Japanese] 快適です！</d> The mouth slit of his mask never moves. From about 00:02.000 he spins like a top with the mug held out and drives through the horde; guards fly away through the slanted sunbeams and bounce across the floor, and a large golden ring of light bursts outward. At about 00:07.000, <Subject 2> pounds the floor and sends an orange shockwave; the shockwave hits <Subject 1> head-on and knocks him back a few meters in a comical hit reaction, his sneakers sliding on the planks; he steadies himself, walks straight back in, and on the floor, without jumping, hits <Subject 2> with a punch, a hook and a downward slam, and <Subject 2> is blasted backward. From about 00:11.000, <Subject 2> lies dazed with stars circling over his head, and <Subject 1>, still seen from behind, raises his full beer mug high in front of the stall in a victory pose. The stall, barrels, tent and grill are never damaged. The camera follows him the whole time at the same distance and height and does not move closer for the victory pose.",
    "A quiet morning office with distant city noise beyond the glass under a battle roar: a rising golden whoosh, his booming battle cry, a whirlwind of spinning air with comical impacts and yelps, a bright booming burst that rattles the glass mugs on the counter, a heavy stomp and crackling shockwave, three punchy hits, and a triumphant clink as he raises the mug.",
    "")


def main() -> None:
    here = Path(__file__).parent
    for ch, text in PROMPTS.items():
        (here / f"{ch}_prompt.txt").write_text(text.strip() + "\n", encoding="utf-8")
        d = text.split("detailed_description:")[1].split("overall_soundscape:")[0]
        print(f"{ch}: detailed_description {len(d.split())} words, total {len(text.split())}")


if __name__ == "__main__":
    main()
