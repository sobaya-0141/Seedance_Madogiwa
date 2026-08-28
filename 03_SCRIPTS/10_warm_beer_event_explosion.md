# Seedance用：常温ビール大爆発

尺：15秒（5秒×3クリップを個別生成し、順番に結合）  
画角：16:9  
ジャンル：イベント会場のドタバタコメディ。爆発は漫画的な怒りの噴火。

## 共通参照画像

- そば屋：`02_CHARACTERS/Sobaya.jpg`
- たこさん：`02_CHARACTERS/Takosan.png`
- とーくん：`02_CHARACTERS/Tokun.jpg`
- よーたん：`02_CHARACTERS/Yotan.jpg`
- 福ちゃん：`02_CHARACTERS/Fukuchan.jpg`
- 無職やめたろう：`02_CHARACTERS/Yametaro.jpg`
- 爆発後の煤・アフロ表現参考：`03_SCRIPTS/ref_images/10_explosion_afro_mood_reference.png`（キャラクター本人の外見には使わず、煤汚れと爆発ヘアの質感だけを参照）

## 共通の音声・演出ルール

- 日本語音声。指定された発話者を入れ替えない。
- 指定台詞は一字一句変えず、字幕・テロップ・ロゴ・透かし・追加台詞を生成しない。
- 全編テンポの速いコミカルなブラス＋パーカッション。台詞中はBGMを下げる。
- 怒りの爆発はオレンジ色の煙、紙吹雪、漫画的な衝撃波で表現する。
- そば屋は白い仮面、半袖Tシャツ、筋肉質な巨体、大型ビールジョッキを維持する。怒りの間だけ仮面全体が赤くなり、機嫌が直ると白へ戻る。
- たこさんは黒いフード付きローブ、白い顔、黒い丸目、触手、人間の腕2本を維持する。
- とーくんはアロハシャツ、麦わら帽子、ウクレレを維持する。
- よーたんは金髪、黒いロック服、ギターを維持する。
- 福ちゃんはおしゃれ服、首から下げた名札とSPONSORストラップ、両手を頬に当てるギュンギュンポーズを維持する。
- やめたろうは紫色ワイシャツ、丸メガネ、デフォルメ体型を維持する。

---

## Clip 1 — ビール到着！（0:00–0:05）

参照画像（5秒内の時系列）：

1. 0:00頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip1_01_ref.png`（ビール未着、赤仮面を3人が抑える）
2. 0:03頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip1_02_ref.png`（よーたんがビール台車で到着）
3. 0:05頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip1_03_ref.png`（仮面が白に戻りご機嫌）

**画面内容**  
イベント開始前の明るい屋内会場。早くビールを飲みたくて前乗りしたそば屋だが、ビールはまだ届かない。そば屋の白い仮面が真っ赤になり、暴れ出しそうな巨体を、たこさんの触手、とーくん、やめたろうが必死に抑える。そこへニコニコ笑顔のよーたんが、大量の缶ビールを積んだ台車を押して到着。そば屋の仮面は即座に白へ戻り、仲間を振りほどかずにご機嫌でジョッキを構える。

**カメラ**：会場時計と空のジョッキの接写→赤い仮面のそば屋を抑えるワイド→台車で入るよーたんへ高速パン→白い仮面に戻る接写  
**音**：時計の秒針、そば屋の低いうなり、台車の車輪、ビール到着の明るいチャイム

### Seedanceプロンプト（Clip 1）

```text
Use the supplied character references and three chronological key frames to create a five-second fast-paced comedy scene inside a bright indoor event venue before opening time. Follow key frame 1 near the start, key frame 2 around the middle, and key frame 3 at the end. Preserve every character identity exactly. Sobaya is a huge muscular 41-year-old man in a short-sleeve T-shirt with his mandatory full white mask and mandatory giant glass beer mug. He arrived early to drink beer, but no beer has arrived. His entire white mask turns vivid red from cartoon anger while the rest of his design remains unchanged. Takosan, preserving the black hooded robe, smooth white face, two round black eyes, visible octopus tentacles, and exactly two human-like arms, wraps several tentacles safely around Sobaya's torso to restrain him. Tokun, preserving his aloha shirt, straw hat, and ukulele, and Yametaro, preserving his stylized round face, black bowl-cut hair, round glasses, rosy cheeks, and purple shirt, also hold Sobaya back without violence or injury. Then smiling Yotan rushes in pushing a handcart stacked with a huge quantity of unopened beer cans. Preserve Yotan's blond hair, black leather rock outfit, sunglasses, and guitar. The instant Sobaya sees the beer, his mask returns completely white and he cheerfully raises the empty giant mug. Start on a close-up of an empty mug and venue clock, reveal the red-mask restraint in a wide shot, whip-pan to Yotan and the beer cart, then snap to Sobaya's white mask and happy pose. Polished high-end anime comedy, energetic timing, 16:9, no subtitles, no text overlay, no logos, no watermark, no blood, no gore, no injury, no dialogue.
```

---

## Clip 2 — 常温だった（0:05–0:10）

参照画像（5秒内の時系列）：

1. 0:05頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip2_01_ref.png`（期待いっぱいで注ぐ）
2. 0:07頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip2_02_ref.png`（常温に気づき仮面が赤へ）
3. 0:10頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip2_03_ref.png`（会場ビルの漫画的爆発）

**画面内容**  
そば屋が我先に缶ビールをジョッキへ注ぎ、期待いっぱいにジョッキへ触れる。泡は立つが、缶にもジョッキにも水滴がなく、湯気のような生ぬるい揺らぎ。そば屋が「あれ？冷えてないぞ…」と低く言う。よーたんが注文票を見せ、常温設定だったと判明。そば屋の仮面が白→赤→灼熱の赤へ変化し、怒りの衝撃波と巨大なオレンジ色の煙雲が会場ビルを漫画的に吹き飛ばす。

**カメラ**：注がれるビール接写→結露ゼロの缶とジョッキ→仮面の超接写→屋外のビル全景で漫画的爆発  
**音**：注ぐ音→BGM停止→台詞→温度計の間抜けな警告音→巨大な「ボン！」

### Seedanceプロンプト（Clip 2）

```text
Continue directly from the previous clip and use the supplied character references and three chronological key frames. Follow key frame 1 near the start, key frame 2 around the middle, and key frame 3 at the end. Create a five-second escalating cartoon-comedy shot in the same bright event venue. Preserve Sobaya's huge muscular body, short-sleeve T-shirt, mandatory full mask, and mandatory giant glass beer mug. Eager Sobaya grabs the first unopened beer can, pours golden beer into his giant mug, and touches the glass with anticipation. The can and glass have absolutely no condensation, no frost, and no cold mist; a subtle warm-air shimmer makes it obvious the beer is room temperature. Sobaya says in a low shocked voice, "あれ？冷えてないぞ…" Smiling Yotan, preserving blond hair, black leather rock outfit, sunglasses, and guitar, glances at a generic order slip and silently confirms the room-temperature setting with an embarrassed look. Sobaya's mask changes from white to vivid red and then glows hot red at the peak of cartoon anger while his body and outfit remain unchanged. A harmless circular shock wave, orange smoke, streamers, and paper confetti burst outward. Cut instantly to an exterior wide shot as the event-venue building pops apart in an exaggerated clean cartoon explosion cloud, with no fire spreading, no falling victims, and no realistic destruction detail. Macro beer-pour close-up, insert of the dry room-temperature can and mug, extreme close-up of the mask turning red, then smash cut to the exterior comedy explosion. Polished high-end anime comedy, very fast readable timing, 16:9. Dialogue must be clear and louder than music. No subtitles, no readable order text, no logos, no watermark, no blood, no gore, no injury, no visible death.
```

---

## Clip 3 — ギュンジョイ犯、到着（0:10–0:15）

参照画像（5秒内の時系列）：

1. 0:10頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip3_01_ref.png`（煤・爆発アフロの5人）
2. 0:12頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip3_02_ref.png`（福ちゃんがギュンギュン到着）
3. 0:15頃：`03_SCRIPTS/ref_images/10_warm_beer_event_explosion_clip3_03_ref.png`（全員が福ちゃんを指さして怒る）

**画面内容**  
爆発直後の会場跡。全員無傷。たこさん、やめたろう、とーくん、よーたんは、顔と服が煤で真っ黒、頭の周囲にギャグ漫画風の爆発アフロ。たこさんのフードと触手、とーくんの帽子とウクレレ、よーたんの金髪とギター、やめたろうの丸メガネと紫シャツは煤の下でも見える。そこへ無傷で遅れてきた福ちゃんが、満面の笑顔でギュンギュンポーズをしながら到着し、「やっほーお疲れ！今日もギュンジョイしよう！」。煤まみれの4人と赤い仮面のそば屋が無言で振り向き、全員で福ちゃんを指さして怒る。福ちゃんだけ笑顔のまま固まり、明るいコミカルな決め音で終了。

**カメラ**：煤まみれの4人を横移動で見せる→福ちゃんが画面中央へ飛び込む→台詞中ギュンギュンポーズ→全員が振り向くワイド→福ちゃんの笑顔フリーズ  
**音**：瓦礫が転がる小音、福ちゃんの明るい台詞、全員が息を吸う音、コミカルな決め音

### Seedanceプロンプト（Clip 3）

```text
Continue directly after the harmless cartoon explosion and use all supplied character references, three chronological key frames, and the supplied soot-and-afro mood reference. Follow key frame 1 near the start, key frame 2 around the middle, and key frame 3 at the end. Create a five-second aftermath gag at the opened-up event venue. Everyone is completely unharmed. Takosan, Yametaro, Tokun, and Yotan stand together covered in soft black cartoon soot on their faces and clothes, with oversized fluffy explosion-afro puffs around their heads like a classic gag manga. Preserve all mandatory identity features visibly beneath the soot: Takosan keeps the black hooded robe, smooth white face shape, two round black eyes, visible octopus tentacles, and exactly two human-like arms; Tokun keeps his aloha shirt, straw hat, and ukulele; Yotan keeps visible blond hair, black leather rock outfit, sunglasses, and guitar; Yametaro keeps his stylized round face, black bowl-cut hair, round glasses, rosy cheeks, and purple shirt. The soot is powder only, not burned skin, and the afro puffs are temporary cartoon explosion effects, not character redesigns. Sobaya stands beside them, completely unharmed, preserving his huge muscular body, short-sleeve T-shirt, mandatory giant beer mug, and full mask, which is vivid red with anger. Clean, smiling Fukuchan arrives late without soot, wearing fashionable clothes, his neck badge and SPONSOR strap, and performs his mandatory Gyun-Gyun pose with both hands against his cheeks while cheerfully saying, "やっほーお疲れ！今日もギュンジョイしよう！" The four soot-covered friends and Sobaya slowly turn toward Fukuchan, point at him together, and scold him with exaggerated silent angry faces. Fukuchan freezes with the same innocent smile. Start with a quick lateral reveal of the soot-covered group, pan to Fukuchan entering, hold his pose during the complete line, then end on a wide group turn and a freeze-frame close-up of Fukuchan's smile. Polished high-end anime gag-comedy, bright optimistic finish, 16:9. No extra dialogue, no subtitles, no text overlay, no logos, no watermark, no fire, no burns, no blood, no gore, no injury, no bullying, no physical attack.
```

---

## 結合・生成メモ

- 3クリップはトランジションなしのストレートカット。Clip 1→2は同じ会場・同じ立ち位置を維持する。
- Clip 2の爆発フレームだけ白飛びを許容し、Clip 3はすぐ明るい色調に戻す。
- 台詞尺を守るため、Clip 2のそば屋の台詞は約1.1秒、Clip 3の福ちゃんの台詞は約2.4秒で発話する。
- 爆発後の黒さは煤の粉。皮膚の火傷や衣服の焦げ穴は作らない。
- たこさんの「アフロ」はフードの周囲に付いた煤の爆発パフとして表現し、顔・フード・触手の形は変更しない。
- Seedanceが福ちゃんの台詞を省略する場合は、Clip 3の横移動を短縮し、台詞開始を0.35秒以内に前倒しする。

## 参考画像（各クリップ3枚、合計9枚）

- Clip 1：`ref_images/10_warm_beer_event_explosion_clip1_01_ref.png` / `clip1_02_ref.png` / `clip1_03_ref.png`
- Clip 2：`ref_images/10_warm_beer_event_explosion_clip2_01_ref.png` / `clip2_02_ref.png` / `clip2_03_ref.png`
- Clip 3：`ref_images/10_warm_beer_event_explosion_clip3_01_ref.png` / `clip3_02_ref.png` / `clip3_03_ref.png`
