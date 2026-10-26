---
name: wan3-video
description: 窓際族物語の動画をAlibaba Cloud Model StudioのWan 3.0 API（参照生成モード）で生成するワークフロー。ユーザーから「Wanで動画を作って」「Wan 3.0で作って」「最高画質で作って」「Alibabaで生成して」と指示されたとき、または/no-image-videoのランを同じプロンプト・シート・音声でWan 3.0でも生成するときに必ず使用する。最初にwan3_setup.pyでAPIキーとホストを確認し、未設定の端末ではユーザーに設定手順を案内して止まる。台本・ゲート・プロンプトは/no-image-videoの映画品質モードをそのまま使い、生成だけをWan 3.0（1080P・21:9・最大30秒/本）に置き換える。課金が発生するため、送信前に必ず費用見積りを提示してユーザーの了承を取る。
---

# Wan 3.0 動画制作ワークフロー（Alibaba Cloud Model Studio API）

**実行主体はClaude Code・Cursor・Codexのいずれでもよい**（`.agents/skills/`と`.cursor/skills/`の両方にsymlinkしてある）。

## 位置づけ

| | `/no-image-video`＋`/colab-video`（H3） | **本スキル（Wan 3.0）** |
|---|---|---|
| 生成場所 | Colab（L4/A100）で自前GPU | Alibaba Cloud Model Studio API（従量課金） |
| 解像度・比率 | 1344x768（16:9）→仕上げで2.39:1に切り出し | **2208x948（21:9）を直接生成**、30fps。切り出し・拡大なし |
| 1本の尺 | 4〜15秒（17k+5フレームのグリッド） | **2〜30秒（整数秒）** |
| 参照 | 画像9・音声3・合計12 | 画像10・音声5（合計15秒）・動画5 |
| セリフ音声 | wavをファイルで添付 | **公開URLでしか渡せない**（`drive_audio_url.py`） |
| 品質（2026-10・37で同一プロンプト比較） | 3つのLoRA版とも同等 | **ユーザー評価で明確に高画質**。添付wavの再現度0.98〜0.99 |
| 費用 | 90秒で¥300〜500（A100） | 90秒で約$18（1080P・$0.20/秒の想定） |

**台本・ゲート・プロンプトは`/no-image-video`の「映画品質モード」と完全に共通**（チャプター分割→動き→シート→音声→`APPROVED`→6セクション形式のプロンプト）。本スキルは生成工程だけを置き換える。同じランをH3とWanの両方で生成して比べることもできる（`37_sobaya_beer_ocean_kaiju`が実例）。CLAUDE.mdの共通ルール（シート照合・福ギュン表記・禁止事項）はそのまま適用する。

## 0. セットアップ確認（作業の最初に必ず実行）

```
python3 .claude/skills/wan3-video/wan3_setup.py
```

- **exit 0（OK）**: APIキーとホストがあり、無料の認証確認（存在しないタスクの照会。生成も課金もされない）が通った。先へ進む。
- **exit 1（未設定）**: スクリプトが設定手順を表示する。**その手順をユーザーにそのまま伝えて止まる**（下記）。ユーザーが「設定した」と言ったら、もう一度このスクリプトを実行して確認する。
- **exit 2 / HTTPエラー**: キーとホストのリージョン違い（例: キーはシンガポール、ホストは東京）や、キーの失効。エラー文をユーザーに見せる。

ユーザーに伝える設定手順（`wan3_common.py`の`SETUP_HELP`と同じ内容）:

1. Model Studioのコンソール（https://modelstudio.console.alibabacloud.com/ ）のAPI Keyページで「Create API Key」。同じページの**「Pay-as-you-go Base URL」のホスト名**（例 `ws-xxxxxxxx.ap-southeast-1.maas.aliyuncs.com`）を控える。キー・ホスト・モデルは同じリージョンにそろえる。
2. ターミナルで次を実行する（キーは画面にも履歴にも残らない）。

```bash
read -s "KEY?DASHSCOPE_API_KEY: " && echo "export DASHSCOPE_API_KEY='$KEY'" >> ~/.zshrc && unset KEY && echo && echo saved
```

```bash
echo "export DASHSCOPE_API_HOST='<控えたホスト名>'" >> ~/.zshrc
```

- **キーをチャットに貼ってもらわない・Claudeがキーをファイルに書かない・表示しない**（`wan3_setup.py`は長さだけを出す）。ユーザーが誤ってチャットに貼ったら、そのキーを使わずに「Reset」で作り直すよう勧める。
- ツールは環境変数のほか`~/.zshrc`等の`export`行も読む（エージェントのシェルは`~/.zshrc`を読み込まないことが多いため。2026-10-23に実測）。ホストは秘密情報ではないので、ユーザーがチャットで教えてくれた値をこちらで設定してもよい。
- 「ワークスペースIDが無い」と言われたら、上記の「Pay-as-you-go Base URL」の`ws-…`部分がワークスペースIDだと案内する（2026-10の画面ではワークスペース管理画面ではなくAPI Keyページに出ていた）。

## 1. 素材（`/no-image-video`と共通）

- `chapter_plan.md`（全章`APPROVED`）、シート（正典・モブ・群衆）、セリフwav（2テイク→ユーザーが選ぶ）、`chN_prompt.txt`（6セクション形式・`<Picture N>`/`<Audio N>`表記のまま書く）。
- **入力の定義**:
  - H3のワークフロー（`chN_workflow.json`）があるランは、それを読んで同じ画像・音声を同じ順序で渡す（尺はH3の長さを整数秒に丸める）。
  - **Wanだけで作るラン**は、ラン直下に`wan3_inputs.json`を書く（`<Picture N>`の順＝`images`の順）:

```json
{"ch1": {"images": ["Mob_lifeguard_sheet.png", "Mob_father_sheet.png"], "audio": [], "seconds": 10},
 "ch3": {"images": ["Mob_lifeguard_sheet.png"], "audio": ["ch3_line1_mob_lifeguard.wav"], "seconds": 6}}
```

- **Wanだけで作るときの書き方**: 尺は最大30秒まで延ばせる（H3の15秒の制約が無い）。ただし`[Shot N] At MM:SS.mmm`のカット時刻は尺の中に収める。2.39:1で切り出す前提の一文は書かなくてよい（あっても`wan3_run.py`が取り除く）。
- `wan3_run.py`の変換（自動）: `<Picture N>`→`Image N`、`<Audio N>`→`Audio N`、2.39:1の一文を削除、`prompt_extend=false`（Wan側でプロンプトを書き換えさせない）、`watermark=false`、`audio=true`、`ratio=21:9`、`resolution=1080P`。
- **画面に残したい状態は必ず映像の説明に書く**（37の9章で、ビールの海を`overall_soundscape`にしか書かなかったら青い海に戻った）。

## 2. セリフ音声（公開URL）

APIは音声をbase64で受け取らないので、wavを公開URLに置く。**Google Driveでよい**（2026-10-23実測）。

1. ユーザーに、各章の正式wav（2秒に整えた`chN_lineM_*.wav`。`audio_takes/`ではない）をDriveへ上げ、「リンクを知っている全員（閲覧者）」で共有してリンクを貼ってもらう。
2. 変換と照合（Driveから取れる中身が手元のwavと同一かSHA-256で確認し、`--audio-url`引数を出力する）:

```
python3 .claude/skills/wan3-video/drive_audio_url.py 03_SCRIPTS/<run> 'ch3=<共有リンク>' 'ch9=<共有リンク>'
```

3. 生成が終わったら、共有を「制限付き」に戻すか削除するようユーザーに伝える。

## 3. 費用の確認（必須ゲート）

送信は課金される。**毎回、送信前に見積りを出してユーザーの了承を取る**（了承は送る範囲ごと。前回の了承を次の範囲に流用しない）。

```
python3 .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch1,ch2,...,ch9 --estimate
```

- 単価は第三者の記事の数字（1080P $0.20/秒）。正式な額はコンソールの「View Cost」で確認するよう添える。
- **新しい端末・アカウントで初めて回すときは1章だけ先に送る**（API・画質・請求を確かめる）。それ以降はユーザーの了承があれば全章をまとめて送ってよい。

## 4. 生成

```
python3 -u .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch1,ch2,ch4 --yes > 03_SCRIPTS/<run>/out_wan3_run.log 2>&1
python3 -u .claude/skills/wan3-video/wan3_run.py 03_SCRIPTS/<run> --chapters ch3,ch9 --yes --audio-url "ch3=…" --audio-url "ch9=…"
```

- **バックグラウンドで実行し、完了の通知を待つ**（1章ずつ順番に処理し、1章あたり3〜7分。ログはタスク作成と完了だけを出す）。進捗のポーリング用モニターは通知が多すぎるので立てない。
- 成果物は`out_wan3/chN.mp4`と`chN_task.json`（`usage`に請求対象の秒数）。結果のURLは24時間で消えるので、スクリプトが即ダウンロードする。
- **ポーリングの途中で止まったら、`--task-id <ID>`で同じタスクを照会し直す**（新しいタスクを作ると二重に課金される）。タスクIDはログの`task … created`行にある。タスクIDは24時間有効。
- 既定は各章1テイク（seed 42）。ユーザーが明示的に頼んだときだけ2テイク目を`--seed 1234 --label s1234`で作る（成果物は`chN__s1234.mp4`）。

## 5. 確認と結合

1. 章ごとに9枚の中間フレームのグリッドを作って確認する（シート照合・人数・ショット割り・画面内文字・状態の連続性）。文字や小物はクロップして拡大する。
2. セリフ章は声の再現度を測る（0.9以上なら添付wavがそのまま使われている）:

```
python3 .claude/skills/no-image-video/check_voice.py 03_SCRIPTS/<run>/out_wan3/ch3.mp4 03_SCRIPTS/<run>/ch3_line1_x.wav
```

3. 結合と仕上げ（生成したままの解像度で、切り出しなし。軽いグレード・グレイン・通しの劇伴・2パスloudnorm・末尾の暗転）:

```
python3 .claude/skills/no-image-video/finish_cinematic.py 03_SCRIPTS/<run> --mode wan --chapters 9 --src out_wan3 \
    --hits 5,8,9 --out finals/<slug>_wan3.mp4        # [--music score.wav] [--smash-last]
```

書き出しは90秒で約1GBになる。共有用には別途圧縮を提案する。

## 実測（2026-10-23〜26・`37_sobaya_beer_ocean_kaiju`・9章90秒）

- 出力: 2206〜2208 x 946〜948、30fps、H.264＋音声。生成時間は1章あたり2.5〜7分（15秒の章で約7分）。
- 声: 添付wavとの包絡一致 0.99（3章）/ 0.98（9章）。メガホン越しの叫び、仮面のキャラ（口が動かない）でも添付どおりに鳴った。
- シート再現: 正典（そば屋の仮面・髪・肌・体型）、主役のモブ4人、ライフセーバーの装備までよく再現された。群衆シートの服装も反映された。
- ズレた点（プロンプトで潰す）: 小物の時期（5章でジョッキを早く持った）、数（戦闘機4機→3機）、ショット頭の空白（8章の最初の約1秒が空だけ）、監視台の看板の崩れた小さな文字、状態の連続性（9章でビールの海が青に戻った）。
- API: 作成はPOSTに`X-DashScope-Async: enable`が必須。**照会のGETにこのヘッダーを付けると403**（"current user api does not support asynchronous calls"）。

## 同梱ファイル

| ファイル | 役割 |
|---|---|
| `wan3_setup.py` | キー・ホストの有無と無料の認証確認。未設定なら設定手順を表示（exit 1） |
| `wan3_run.py` | 見積り（`--estimate`）・ドライラン・送信（`--yes`）・再開（`--task-id`）・ダウンロード |
| `wan3_common.py` | 認証情報の読み込み（環境変数＋シェルのrcファイル）、APIホスト、HTTP、設定手順の文面 |
| `drive_audio_url.py` | Driveの共有リンク→直接ダウンロードURL、中身の同一性確認、`--audio-url`の出力 |

結合は`/no-image-video`の`finish_cinematic.py`、声の確認は同じく`check_voice.py`を使う。

## 完了条件

- [ ] `wan3_setup.py`がOK（未設定の端末ではユーザーに設定してもらってから）
- [ ] `/no-image-video`のゲート（全章・全シート`APPROVED`、採用テイクの音声）を満たしている
- [ ] 送信した範囲ごとに、見積りを提示してユーザーの了承を取った
- [ ] 全章をダウンロードし、フレームのグリッドとセリフ章の`check_voice.py`で確認した（ズレは報告した）
- [ ] `finish_cinematic.py --mode wan`で結合し、Driveの共有を戻すようユーザーに伝えた
