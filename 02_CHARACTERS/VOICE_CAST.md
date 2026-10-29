# ボイスキャスト表（配役・正典）

キャラクターのセリフ音声はすべてローカルで生成する。**この表が唯一の正**。動画・ゲームなど媒体を問わず、キャラの声はここで指定したエンジン・設定を使う（勝手に別の声に変えない）。

エンジンは2種類を併用する:

- **Irodori-TTS**（ゼロショットボイスクローン）: 本人の声サンプルがあるキャラ。`02_CHARACTERS/<キャラ>_voice.wav` を参照音声として渡し、本人に似た声で合成する。事前学習は不要（合成のたびに参照音声を渡す）。生成方法は `.claude/skills/seedance/irodori_speak.sh` を参照。
- **VOICEVOX**: それ以外のキャラ。生成方法は `.claude/skills/seedance/voicevox_speak.sh` を参照。

## 配役

| キャラクター | エンジン | 指定 | 備考 |
|---|---|---|---|
| そば屋 | Irodori-TTS＋モンスター加工 | 参照音声: `Sobaya_voice.wav` / 既定シード: `42` / 加工: `sobaya_monsterize.sh`（必須） | 本人の声サンプル8秒（X @sobaya15 status 2045045283705504143 の動画 0〜8秒、単独発話）。クローン出力にピッチ5半音下げ＋70Hzトレモロのモンスターボイス加工をかけたものが正典の声 |
| 福ギュン | Irodori-TTS | 参照音声: `Fukuchan_voice.wav` / 既定シード: `42` | 本人の声サンプル9秒（YouTube pXtc-nwr-sc 2:21〜2:30、単独発話・通常トーン）。旧名「福ちゃん」。**字幕・話者名の表示は「福ギュン」**、参照音声のファイル名は`Fukuchan_*`のまま |
| 無職やめたろう | Irodori-TTS | 参照音声: `Yametaro_voice.wav` / 既定シード: `7` | 本人の声サンプル7秒（YouTube pXtc-nwr-sc 3:46〜3:53、単独発話） |
| たこさん | VOICEVOX | 中国うさぎ / スタイル61（ノーマル） / 話速1.1 / 音高0 | 聞き取りやすさを優先し、2026-10-13採用。詳細は下記「たこさんのVOICEVOX設定」 |
| とーくん | VOICEVOX | 白上虎太郎 / スタイル12（ふつう）。差分: 32=わーい, 35=びえーん | 明るく軽い男声 |
| よーたん | Irodori-TTS | 参照音声: `Yotan_voice.wav` / 既定シード: `100` | 声サンプル3.6秒（Madogiwa Studio「窓際スーパーつらい — 地下労働篇」v4完成版動画 15.30〜18.90秒、単独発話「やめたろうくん。今日の働き、見てたよ。ほら」）。**本人の生声ではなくWan 3.0が生成したよーたん声のテイク**（元の本人声サンプル＝X @sobaya15 status 2045045283705504143 の動画27〜32秒はgit履歴に残る）。旧サンプルより声が低く安定（中央値F0 約120Hz / 旧 約170Hz） |
| 窓際王おかやまん | Irodori-TTS | 参照音声: `Okayaman_voice.wav` / 既定シード: `42` | 本人の声サンプル3.5秒（X @sobaya15 status 2045045283705504143 の動画 44.8〜48.3秒、単独発話） |
| ゆめみん | Irodori-TTS | 参照音声: `Yumemin_voice.wav` / 既定シード: `7` | 2026-10-14に「話さない」設定から変更し、普通に話すようになった（話すときは口が動く）。参照音声は本人の声ではなく、Irodori-TTS `v4.1-Small` のキャプション指定・参照音声なし（`--caption "ふわふわした可愛らしい高い声の、小動物のようなマスコット。にこにこと人懐っこく、柔らかく弾むような話し方。" --no-ref --seed 7`）で作成した声（4.8秒「やめ太郎君も、僕と契約して、魔法少女になろうよ！」、中央値F0 約445Hz）。旧配役はVOICEVOX ずんだもん（鳴き声のみ） |
| いーさん | Irodori-TTS | 参照音声: `Iisan_voice.wav` / 既定シード: `7` | 2026-10-29採用。本人の声ではなく、Irodori-TTS `v4.1-Small` のキャプション指定・参照音声なし（`--caption "四十代の日本人男性。腰が低く、いつも申し訳なさそうな、人の良い営業マン。少し情けなさのある柔らかい中低音で、丁寧に、やや早口で話す。" --no-ref --seed 7`）で作成した声（6.1秒「本当に申し訳ございません。どうか、私にお仕事をいただけないでしょうか。」、中央値F0 約135Hz）。H3では声サンプルとしてそのまま渡す |
| ナレーション（窓際メンバー以外の発話全般） | Irodori-TTS | 参照音声: `Narrator_voice.wav` / 既定シード: `100` | 声サンプル5秒（X @sobaya15 status 2077985819013578773 の動画 0〜5秒）。ナレーション・モブ等、窓際メンバー以外の発話に使う |

- **MiniMax H3（`/no-image-video`）では、この表の声サンプル（`<キャラ>_voice.wav`）を声色の参照としてそのまま渡し、セリフはH3に喋らせるのが既定**（2026-10-29〜。そば屋は`sobaya_monsterize.sh`をかけたサンプル、VOICEVOXのキャラは表の設定で作った3〜8秒の発話をサンプルにする）。セリフごとのwavをこの表のエンジンで作るのは、互換のセリフwav方式を使うときだけ。
- VOICEVOXのスタイル差分はシーンの感情に合わせて上記の範囲で選んでよいが、**話者（キャラクターの声そのもの）は変更しない**。変更したい場合はこの表を先に更新する。
- Irodori-TTSの**既定シード**は本人らしさが確認できたテイクの値。まずこのシードで生成し、抑揚や間が合わないセリフだけ別シードを試して良いテイクを選ぶ（同じシード＋同じテキストなら毎回同じ音声が出る）。
- 参照音声を差し替える・追加するときは、`02_CHARACTERS/<キャラ>_voice.wav` を置き換え、各キャラ設定ファイル（`0N_<キャラ>.md`）の「声ファイル：」行も更新する。
- 話者一覧の確認（VOICEVOX）: `curl -s http://127.0.0.1:50021/speakers`

## 本人の声のクローンについて（重要）

Irodori-TTS対象キャラの参照音声は実在のメンバー本人の声である。**本人の同意の範囲でのみ使用する**こと。新しいメンバーの声を追加するときは必ず本人の了承を得てから配置する。公開範囲が変わる場合（社外公開等）は改めて本人に確認する。

## クレジット表記（公開時必須）

VOICEVOXの利用規約により、VOICEVOX音声を使った動画等を公開する際は使用キャラクターのクレジットを入れる。利用規約上は概要欄でも可だが、**本プロジェクトではVOICEVOX音声を使った動画には必ず動画内（画面内）にクレジットを表示する**（CapCut編集時にエンドカードまたはテキストオーバーレイで追加。手順は`.claude/skills/seedance/SKILL.md`参照）。登場したぶんだけ記載する:

```
VOICEVOX:中国うさぎ / VOICEVOX:白上虎太郎
```

各音源キャラクターには個別の利用規約がある（商用利用可否など）。新しい話者を配役に加えるときはVOICEVOX公式サイトで当該キャラの規約を確認すること。Irodori-TTSのコードはMITライセンス。使用モデルは`Aratako/Irodori-TTS-v4-Large`（2026-09-29〜。`irodori_speak.sh`の既定値）で、テキストエンコーダにT5Gemma 2を含むため**Gemma Terms of Use**（https://huggingface.co/Aratako/Irodori-TTS-v4-Large の`GEMMA_TERMS_OF_USE.md`・`GEMMA_PROHIBITED_USE_POLICY.md`。なりすまし・誤情報・ディープフェイク用途の禁止）が適用される。上記「参照音声の扱い」の本人同意ルールはこの規約への準拠でもある。旧モデル（v4.1-Small以前）で生成したテイクのシード再現は`IRODORI_TTS_CHECKPOINT`で当時のモデルを指定する。

## 音声パラメータの目安（VOICEVOX）

`audio_query` のJSONを編集して調整できる。キャラ固有の恒久調整が決まったらこの表に追記する（たこさんは下記の固有設定を使用）。

| パラメータ | 効果 |
|---|---|
| `speedScale` | 話速（1.0基準。ギャグの畳みかけは1.1〜1.2） |
| `pitchScale` | 音高（±0.05程度まで。大きく変えると破綻） |
| `intonationScale` | 抑揚の強さ |
| `volumeScale` | 音量 |

## たこさんのVOICEVOX設定（2026-10-13採用）

Voidollでは台詞が聞き取りづらい場合があったため、中国うさぎの標準音高・話速1.1倍へ変更する。MMU側の「そば屋の奇行5選」「窓際お嬢様部」で採用した設定を共有する。今後たこさんをVOICEVOXで生成・差し替えするときの既定とし、旧Voidoll（style 89）や比較用の音高−0.04は継承しない。過去の生成音声・台本・クレジットは制作当時の記録として保持する。他エンジンの参照音声や設定へは自動適用しない。

| 項目 | 設定 |
|---|---|
| 話者・スタイル | 中国うさぎ・ノーマル |
| speaker / style ID | `61` |
| speedScale | `1.1` |
| pitchScale | `0`（標準音高） |
| intonationScale / volumeScale | `1.0` / `1.0`（生成後のミックス音量は作品で調整） |
| 出力 | 48,000 Hz・mono |
| 再現確認済み | VOICEVOX Engine 0.25.1、話者バージョン0.16.1 |
| クレジット | `VOICEVOX:中国うさぎ`（本リポジトリでは既存方針どおり動画内に表示） |

前後無音は声質の固定値とせず、会話の間に合わせる。解説の採用例は `prePhonemeLength=.15` / `postPhonemeLength=.55`、お嬢様部の短い発話枠では `.09` / `.12`。速度1.1は合成クエリで指定し、生成後の一律早送りで合わせない。字幕本文と読みを分け、「方（人）」→「かた」、「その間」→「そのあいだ」等は文脈に応じて指定する。全文クエリ・エンジン版・話者ID・音声SHAを制作記録に残す。

既存の `voicevox_speak.sh` を使う場合は、スタイルID `61` と第4引数の話速 `1.1` を明示する。同スクリプトは話速のみ変更し、前後無音のトリムも行うため、上記の全出力設定と無音長まで指定したい場合は以下のように合成クエリを保存して生成する。

```bash
# ローカルのVOICEVOX Engineを起動してから実行する。出力は制作ディレクトリへ保存。
curl --fail --silent --show-error -X POST \
  'http://127.0.0.1:50021/audio_query?speaker=61' \
  --data-urlencode 'text=やめたろうくん、おはよう。' --get > takosan_query_base.json
python3 - <<'PYQUERY'
import json
from pathlib import Path
q = json.loads(Path('takosan_query_base.json').read_text())
q.update(speedScale=1.1, pitchScale=0.0, intonationScale=1.0,
         volumeScale=1.0, outputSamplingRate=48000, outputStereo=False,
         prePhonemeLength=0.15, postPhonemeLength=0.55)
Path('takosan_query.json').write_text(json.dumps(q, ensure_ascii=False, indent=2))
PYQUERY
curl --fail --silent --show-error -X POST \
  'http://127.0.0.1:50021/synthesis?speaker=61' \
  -H 'Content-Type: application/json' --data-binary @takosan_query.json \
  -o takosan.wav
```

読みは生成クエリと試聴で確認し、ASR一致だけで聴感を合格にしない。
