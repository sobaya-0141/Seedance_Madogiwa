---
name: local-video
description: 窓際族物語の動画をクラウドを使わずフルローカルで生成するワークフロー（MiniMax H3 + ComfyUI）。ユーザーから「ローカルで動画作成して」「ローカルLLMで動画を作って」と指示されたとき、MiniMax H3での動画生成・修正を頼まれたときに必ず使用する。台本→Irodori-TTS/VOICEVOX音声→draw-things-cliキーフレーム一括生成→Qwen3-VL（Ollama）による画像検証→チャプター毎のH3動画生成→ffmpeg結合まで全工程をローカルで完結させる。
---

# ローカル動画制作ワークフロー（MiniMax H3）

**実行主体はClaude Code・Cursor・Codexのいずれでもよい**（Codex CLI向けの`.agents/skills/`とCursor向けの`.cursor/skills/`の両方にsymlinkしてある）。

ユーザーから「**ローカルで動画作成して**」と指示されたら、`/seedance`（CapCut/クラウド生成）ではなくこのスキルを使う。台本・音声・キーフレームの考え方は`/seedance`と同じ構造で、動画生成だけをクラウドのSeedance（CapCut）から**ローカルのMiniMax H3（ComfyUI）**に置き換えたものである。

ワークフロー全体（順に実行する）:

1. セットアップ確認（未導入コンポーネントは公式ドキュメントに従って導入する）
2. ラン専用出力ディレクトリの作成と参照画像の同梱
3. 台本＋チャプター分割＋H3プロンプト（英語）の作成
4. Irodori-TTS/VOICEVOXによる全セリフの音声生成
5. draw-things-cliによる**全チャプターのキーフレーム一括生成**
6. Qwen3-VL（Ollama）による**全キーフレームの検証→修正リスト完全確定→必要な画像のみ再生成**
7. ComfyUI（MiniMax H3）で**チャプター毎に**動画生成（パイロット→残り）
8. ffmpegでの結合・最終音声トラックの構築・クレジット焼き込み
9. 同梱物の機械検証

## `/seedance`スキルとの関係（共通ルールの参照元）

本スキルは`/seedance`のワークフロー構造を継承する。**次のルール群は`.claude/skills/seedance/SKILL.md`に書かれているものをそのまま適用する**（本ファイルには差分だけを書く。作業前に該当セクションを必ず読むこと）:

- **ステップ0（出力ディレクトリ・参照同梱）**: ラン専用ディレクトリ`03_SCRIPTS/<NN>_<slug>/`の命名、キャラクターシート等を物理ファイルとして同梱、basename参照、正典非改変 — すべて同一。
- **ステップ1（台本作成）**: Story Formula・禁止事項、Prop state ledger、物理整合性ルール、Scene ledger（場所・時間帯の通し台帳）と場面転換の整合性ルール（昼夜ジャンプ防止）、カメラワーク設計ルール（`## Camera plan`＝全チャプターのショットリスト・単調防止・クリップ内ムーブのキーフレーム焼き込みと振幅上限・CUTの作法）、Fixture layout（機構小物）、画風固定ルール（`## Style block`・全プロンプトへの逐語埋め込み）、キャラクター人数の固定（増殖防止）、話者分離（1生成単位1話者）、リップシンク精度（尺≒発話長＋約1秒）、言語ルール（script.mdは英語、セリフのみ日本語）、話者バインディング — すべて同一。「クリップ」を本スキルでは「チャプター」と読み替える。
- **ステップ2（セリフ音声）**: 配役の正典は`02_CHARACTERS/VOICE_CAST.md`。Irodori-TTSボイスクローン（そば屋・福ちゃん・やめたろう・おかやまん・よーたん）とVOICEVOX、そば屋のモンスターボイス加工、無音トリム、Dialogue audio表、VOICEVOXクレジット義務 — すべて同一。**スクリプトもseedance同梱のものをそのまま使う**（`irodori_speak.sh` / `voicevox_speak.sh` / `sobaya_monsterize.sh`）。

キーフレーム生成の技法（draw-things-cli固有）は本ファイルのステップ5に完結して書いてある（seedance側がCodex生成のままのバージョンでも本スキル単独で動くようにするため）。

以下、本スキル固有の内容（H3の制約・チャプター分割・一括生成＋VLM検証・ComfyUI実行・ffmpeg組み立て）を記す。

## 1. セットアップ確認（作業開始前に必ず実行）

```
.claude/skills/local-video/h3_check_setup.sh
```

このスクリプトは必要コンポーネントの導入状態を確認し、**未導入のものについて公式ドキュメントに基づく導入手順を表示する**。未導入があれば、表示された手順（および下記の公式ドキュメント）に従って導入してから先へ進む。モデルのダウンロードは数十GB規模なので、開始前にユーザーへ所要サイズを伝えて確認する。

### 動作環境の前提（重要・実測で確定）

**MiniMax H3の動画生成にはNVIDIA CUDA GPUが必要。Apple Silicon（MPS）では実行できない。** 2026年8月にM1 Pro / 32GBで4バリアントすべてを実際に走らせて確認した結果:

| バリアント | サイズ | MPSでの結果 |
|---|---|---|
| `*_pruned_int8_convrot` | 21GB | ❌ `NotImplementedError: aten::_int_mm` — MPSにカーネルが無い。ComfyUIの`comfy_kitchen/backends/eager/quantization.py`の`int8_linear`→`fast_int8_mm`が`torch._int_mm`を直接呼び、**フォールバック経路が無い** |
| `*_pruned_fp8_scaled` | 21GB | ❌ `RuntimeError: Undefined type Float8_e4m3fn` — MPSにfloat8型自体が無い（dequantizeがbf16を返す設計でも、入力のfp8テンソルを扱えない） |
| `qwen3vl_32b_..._nvfp4_awq` | 16GB | ❌ NVIDIA専用量子化 |
| `*_pruned_bf16` | 40GB | ❌ MPSネイティブ型なので実行は始まるが `MPS backend out of memory (allocated 41.80 GiB, max allowed 42.43 GiB)`。**最小設定（90フレーム・640x384・2ステップ）でも超過**。PyTorchのMPS上限は物理RAMの約1.33倍で、40GBのDiT単体でほぼ使い切る |

- モデルのロード自体は毎回成功する（エンコーダ25.9GB・DiT 20〜40GB）。**容量の問題ではなく、PyTorch MPSバックエンドの型/オペレータ非対応**なので、ComfyUIの起動オプションでは回避できない。
- `PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0`で上限を外す案はPyTorch自身が「システム障害の可能性」と警告しており、かつ最小設定で既に超過しているため実チャプター（4.2倍のピクセル・最大3.6倍のフレーム）では無意味。**ユーザーの明示的な依頼が無い限り試さない。**
- **Macで作業する場合は工程を分割する**（下記「Macで動く工程 / CUDAが必要な工程」）。131GBの重みを落としてから気づくのを避けるため、**H3の重みダウンロードを始める前にGPUを確認する**こと。

#### ただしComfyUI経路が駄目でも「Macで不可能」と即断しない（重要な手順）

上表の失敗は**ComfyUI + PyTorch MPS + Comfy-Org版リパック**という1経路の話であって、H3自体がApple Siliconで動かないという意味ではない。**この経路で詰まったら、必ず代替ランタイムの有無をWeb検索で確認する。** 動画生成モデルのローカル対応は数日単位で動くため、スキルに書いてある構成が最新とは限らない。

2026-08時点で確認できた代替経路:

| 経路 | 状況 | 常駐メモリ |
|---|---|---|
| **MLXポート**（`PipeNetwork/minimax-h3-mlx`、2026-08-04公開） | Apple純正MLXで動くのでMPSの型/オペレータ問題を回避。**t2vaのみend-to-end検証済み**、FL2VAは実装済み・未テスト | 4-bit **11.5GB** / 8-bit 21.5GB / bf16 40.3GB（5秒クリップのピーク活性は約9.3GB） |
| **Ref2VA専用MLXパッケージ**（`gabrielrocco/MiniMax-H3-Ref2VA-MLX-Serve-4bit`） | リップシンク用。画像9・動画3・音声3・計12の上限はH3本来の仕様と一致 | 4-bit |
| **4-bit + DiffSynth-Studio** | 最小8GB VRAMを称する | — |
| **Draw Things**（Apple Silicon最適化） | **H3は未収録**。ただしWan 2.1/2.2のT2V/I2Vが5〜6bit量子化まで揃っている（音声・リップシンクは無し） | モデル次第 |

##### Draw Things / Wan の実測（2026-08・M1 Pro 32GB）

H3の代わりにApple Siliconネイティブで回る候補としてWanを実測した。**モデル系統の選択が結果を決める**:

| モデル | 解像度・尺 | 所要 | 結果 |
|---|---|---|---|
| `wan_2.1_1.3b_v1.1_fun_inp_f16` | 512x512・49f(3.06s) | **12分8秒**（30.4秒/step×20） | 場景・プロップ状態を保持し、**指示した動作（合掌）も再現**。ただし**キャラデザインがフレーム進行で崩壊**（髪が変形、丸メガネが溶ける）。16:9指定しないとセンタークロップされる |
| `wan_v2.2_5b_ti2v_q8p` | 1024x576・49f(2.04s) | **17分11秒**（40.7秒/step×20） | **失敗**。全体がぼやけ、窓・箱・暖簾・提灯が消えて無地の壁になり、顔とメガネが溶けた |

- **`Fun InP`系を選ぶ。`TI2V`系に`--image`を渡すのはimg2img扱いで、入力画像の場景が破壊される**（上表の差はこれで説明できる）。Draw Things CLIは適用設定を出力しないため、strengthの既定値は確認できなかった。
- **1.3Bはキャラ同一性を保てない**。NG変更対象（メガネ・髪型）があるIPでは使えない。品質が要るなら`wan_2.1_14b_v1.1_fun_inp_q6p_svd`（14B・6bit SVDQuant）だが、1.3B比で1桁重くなるため所要時間の見積もりを先に出すこと。
- **`--width`/`--height`を必ず指定する**（64の倍数）。省略すると正方形にセンタークロップされ構図が失われる。
- **Wanにはリップシンク機能が無い。** セリフのあるチャプター（R2V相当）はWanでは作れない。音声入力なしのI2Vチャプターのみが対象。

- MLX版は**重みの形式がComfyUI版と違う**ため再ダウンロードが必要（オリジナルのVideo VAE 10.4GB＋Audio VAE 0.6GB＋50層truncated Qwen3-VL-32Bエンコーダ＋MLX量子化transformer）。ComfyUI版を消してから入れ直すことになるので、**どちらの経路で行くかを決めてからダウンロードを始める**。
- 速度の実測参考値: **M5 Maxで1本約45分**。世代が古いMacは数倍かかる（M1 Proなら1チャプター3〜4.5時間の見込み）。11チャプター規模だと連続数十時間になるため、**本番投入の前に必ず最短チャプター1本でパイロットを回す**。
- 音声は「プロンプトガイドを読まないと speech-like garbage になる」と報告がある。**リップシンクが要件のランでは、この1点を最優先で検証する。**

#### チャプター単位で必要なモードを見極める（H3が全チャプターに必要とは限らない）

**セリフの無いチャプターはI2V（音声入力なし）＝ナレーションはffmpegで後載せ**なので、リップシンク機能を持たないモデルでも代替できる。実例として`26_kansha_no_bug_ichimankai`は11チャプター中**9本がI2V・2本だけがR2V**だった。H3が本当に必要なのはR2Vの2本だけで、残り9本はApple Siliconでネイティブに速く回る他の動画モデル（Draw ThingsのWan等）で作れる可能性がある。**「H3が動かない＝全部作れない」ではないので、モードごとに切り分けて検討する。**

### Macで動く工程 / CUDAが必要な工程

Apple SiliconでもH3以外は全部ローカルで完結する。実測で確認済み:

| 工程 | Mac（Apple Silicon） | 備考 |
|---|---|---|
| 台本作成（ステップ3） | ✅ | 計算不要 |
| Irodori-TTS / VOICEVOX音声（ステップ4） | ✅ | 動作確認済み |
| draw-things-cliキーフレーム（ステップ5） | ✅ | M1 Pro / 1024x576 / 20stepで**約16〜17分/枚** |
| Qwen3-VL画像検証（ステップ6） | ✅ | 32GB機では`qwen3-vl:8b`（32bは載らない） |
| **H3動画生成（ステップ7）** | ❌ **CUDA必須** | 上表のとおり |
| ffmpeg結合（ステップ8） | ✅ | |

Macで進める場合は、ステップ6まで仕上げて**ポータブルな入力バンドル**（`script.md`＋音声＋検証済みキーフレーム＋チャプター別ワークフローJSON＋手順書）を作り、ステップ7以降をCUDA機で実行する。実例と手順書のテンプレートは`03_SCRIPTS/26_kansha_no_bug_ichimankai/RUNBOOK_CUDA.md`を参照。

必要コンポーネントと公式ドキュメント:

| コンポーネント | 用途 | 公式ドキュメント |
|---|---|---|
| ComfyUI（v0.30.0以上） | MiniMax H3の実行基盤 | https://docs.comfy.org/ （インストール） / https://docs.comfy.org/tutorials/video/minimax/minimax-h3 （H3チュートリアル） |
| MiniMax H3モデル一式 | 動画生成本体 | https://huggingface.co/Comfy-Org/MiniMax-H3 （ComfyUI用リパック） / https://huggingface.co/MiniMaxAI/MiniMax-H3 （オリジナル） / https://www.minimax.io/news/minimax-h3-open-source |
| Ollama + Qwen3-VL | キーフレーム画像の検証（ローカルVLM） | https://ollama.com/download / https://ollama.com/library/qwen3-vl |
| draw-things-cli + Qwen Image Edit 2511 | キーフレーム画像の生成 | https://docs.drawthings.ai/ （`dt_generate.sh`が未導入時に手順を表示する） |
| Irodori-TTS / VOICEVOXエンジン | セリフ音声 | https://github.com/Aratako/Irodori-TTS / https://voicevox.hiroshiba.jp/ （導入済み: `~/irodori_tts`, `~/voicevox_engine`） |
| ffmpeg | 音声パディング・結合・最終組み立て | https://ffmpeg.org/ |

### MiniMax H3のモデルファイル（ComfyUI公式チュートリアルより）

ComfyUIを最新（v0.30.0+）に更新した上で、`Comfy-Org/MiniMax-H3`から以下を取得して配置する:

| ファイル | 配置先 |
|---|---|
| `minimax_h3_fl2va_pruned_int8_convrot.safetensors`（I2V/T2V用） | `ComfyUI/models/diffusion_models/` |
| `minimax_h3_ref2va_pruned_int8_convrot.safetensors`（R2V用） | `ComfyUI/models/diffusion_models/` |
| テキストエンコーダ Qwen3-VL-32B（下記注意） | `ComfyUI/models/text_encoders/` |
| `minimax_h3_video_vae_fp16.safetensors` | `ComfyUI/models/vae/` |
| `minimax_h3_audio_vae_fp32.safetensors` | `ComfyUI/models/vae/` |

- ライセンスはMiniMax H3 Community License。商用利用条件はライセンス本文を確認する。

### GPUごとの重み選択（CUDA）

`Comfy-Org/MiniMax-H3`には同じモデルの量子化バリアントが複数ある。**GPUの世代に合うものを選ぶ**（合わないものを選ぶと起動すらしない）:

| GPU | 拡散モデル | テキストエンコーダ | 備考 |
|---|---|---|---|
| Blackwell（RTX 50xx / B200） | `*_pruned_fp8_scaled`（各21GB） | `qwen3vl_32b_minimax_h3_nvfp4_awq`（16GB） | 最速・最小。NVFP4のネイティブ対応があるのはこの世代 |
| Ada / Hopper（RTX 40xx / L40S / H100） | `*_pruned_fp8_scaled`（各21GB） | `qwen3vl_32b_minimax_h3_int8_convrot`（27GB） | fp8がネイティブ |
| Ampere（RTX 30xx / A100） | `*_pruned_int8_convrot`（各21GB） | `qwen3vl_32b_minimax_h3_int8_convrot`（27GB） | INT8 Tensor Coreを使う |
| VRAM 80GB以上 | `*_pruned_bf16`（各40GB） | `qwen3vl_32b_minimax_h3_bf16`（51.5GB） | 量子化なし＝最高画質 |

- **VRAMの目安**: エンコーダとDiTはComfyUIが順次ロード・オフロードするので同時常駐はしない。24GBカードでもシステムRAMが十分あれば動くが、スワップが出る。48GB以上が快適。
- **`--disable-smart-memory`はテキストエンコーダの退避には効かない**（エンコーダはCPU側に載るため、ComfyUIが「計算デバイスから退避すべき対象」と見なさない）。メモリ圧の解決策として当て込まないこと。
- I2Vチャプターは`fl2va`、R2Vチャプターは`ref2va`を使う。**両方必要**。

### APIワークフローJSONの準備

チャプター生成はComfyUIのAPI（`h3_run.py`）で回す。JSONの用意には2つの方法があり、**通常は方法Aを使う**。

#### 方法A（推奨・ブラウザ不要）: `build_h3_workflow.py`でチャプター毎に生成する

同梱の`build_h3_workflow.py`が、公式テンプレートと同じ結線のAPI形式JSONを直接組み立てる。ヘッドレス環境でも動き、H3の入力上限とフレームグリッドをスクリプト側で強制するので取り違えが起きない。

```
# セリフなしチャプター（I2V・開始/終了フレームを厳密固定）
python3 .claude/skills/local-video/build_h3_workflow.py --mode i2v \
  --out 03_SCRIPTS/<NN>_<slug>/ch1_workflow.json \
  --prompt-file 03_SCRIPTS/<NN>_<slug>/ch1_prompt.txt \
  --frames 294 --first ch1_start.png --last ch1_end.png

# セリフありチャプター（R2V・参照画像＋音声）。--imageの順序が<Picture N>タグの順序になる
python3 .claude/skills/local-video/build_h3_workflow.py --mode r2v \
  --out 03_SCRIPTS/<NN>_<slug>/ch8_workflow.json \
  --prompt-file 03_SCRIPTS/<NN>_<slug>/ch8_prompt.txt --frames 124 \
  --image ch8_start.png --image ch8_end.png --image Fukuchan_sheet.png \
  --image Yametaro_sheet.png --image height_lineup.png \
  --audio ch8_line1_fukuchan.wav
```

- 重みはGPUに合わせて`--encoder` / `--unet-i2v` / `--unet-r2v`で差し替える（既定はINT8ペア＝Ampere向け）。
- Motion promptは`extract_prompts.py`で`script.md`から**逐語抽出**して渡す（要約禁止のルールを機械的に守るため。プロンプトを別ファイルに手で書き写さない）:
  ```
  python3 .claude/skills/local-video/extract_prompts.py 03_SCRIPTS/<NN>_<slug>
  ```
- `--frames`は17k+5グリッド（24fps）以外を渡すとエラーになる。R2Vで画像9枚・音声3本・合計12を超えてもエラーになる。

#### 方法B（フォールバック）: ComfyUIのUIから`Export (API)`

1. ComfyUIを起動し、テンプレートブラウザから公式テンプレート **MiniMax H3 I2V** / **MiniMax H3 R2V** を開く。
2. **Export (API)** して`workflows/h3_i2v_api.json` / `h3_r2v_api.json`として保存する。
3. ラン専用ディレクトリへコピーし、入力を書き換えて`h3_run.py`に渡す。

**方法Bの注意（実測）**:

- **ブラウザセッションが必要**なので、ヘッドレス/CLIのみの環境では使えない。その場合は方法A、または同梱の`ui2api.py`で公式テンプレート（UI形式JSON）を実行中のComfyUIの`/object_info`を使ってAPI形式へ変換する。テンプレート本体は`ComfyUI/venv/lib/python*/site-packages/comfyui_workflow_templates_json/templates/video_minimax_h3_{i2v,r2v}.json`にある（`api_`で始まる方はクラウドAPIノード版なので**使わない**）。
- **I2Vテンプレートはサブグラフ（UUID型ノード）で包まれている**ため単純な変換では展開できない。R2Vテンプレートはフラットなので変換しやすい。方法Aはこの問題を回避する。
- **公式テンプレートはテキストエンコーダに`qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`（NVIDIA専用）をハードコードしている。** そのまま使うとBlackwell以外では動かない。GPUに合うものへ必ず差し替える。
- テンプレートは解像度を`ResolutionSelector`（既定0.4MP）から取るため、`script.md`のフレーム数・解像度と食い違う。方法Aは`width`/`height`/`length`を直値で入れるので`script.md`と一致する。

### 画像検証用VLM（Ollama + Qwen3-VL）

- 導入: `brew install ollama`（または https://ollama.com/download ）→ `ollama pull qwen3-vl:8b`（または`:32b`）
- **32Bは64GB以上のマシン向け**（検証精度優先）。32GB機では`qwen3-vl:8b`を使う（`OLLAMA_VLM`環境変数で`verify_frame.py`のモデルを差し替え可能）。
- モデルタグが取得できない場合はOllamaのライブラリページ（上記URL）で最新のタグ名を確認する。

## 2. 出力ディレクトリと参照同梱

seedance SKILL.mdステップ0と同一規則。`03_SCRIPTS/<NN>_<slug>/`を作成し、使用する全キャラクターシート・スケール参照を物理ファイルとしてコピーする。**コピーした`*_sheet.png`は全枚Readで開き、各キャラ設定mdの「シート照合チェックリスト」と突き合わせて正典の姿を確認してから台本・プロンプトを書く**（seedanceステップ0の同梱手順4と同一。同定句や記憶だけで書かない）。

## 3. 台本＋チャプター分割（deliverableは英語の`script.md`）

seedance SKILL.mdステップ1の全ルール（Prop state ledger / Scene ledger（場所・時間帯）と場面転換の整合性 / Fixture layout / 話者分離 / リップシンク精度 / 言語ルール / 話者バインディング）を適用した上で、クリップの代わりに**チャプター**へ分割する。

### チャプターの定義（H3の入力制限が分割の根拠）

**1チャプター＝1回のH3生成**。MiniMax H3には1回の生成あたり入力ファイル数の上限があるため、ストーリーを次の制約を満たすチャプターに分割する:

- **尺: 4〜15秒**（24fps。指定尺は17k+5フレームのグリッドに丸められる）
- **入力ファイル合計: 最大12**（R2Vモード時。画像・音声・動画の合計）
- **画像: 最大9枚**（キーフレーム＋キャラクターシート等の参照）
- **音声: 最大3ファイル**（各2〜15秒、合計15秒以内）
- 1チャプター1話者の原則はseedanceと同じ。**同一話者の連続セリフでも1チャプターに入れられるwavは3つまで**。超える場合はチャプターを割る。
- 登場キャラが多くて 2（キーフレーム）＋シート枚数 が9を超える場合もチャプターを割る（画面に映るキャラを減らす）か、そのチャプターで口が動く・大きく動くキャラのシートを優先して残す。

チャプターのつなぎ目はseedanceのクリップと同様、**チャプターNの終了フレーム＝チャプターN+1の開始フレーム（同一ファイル共有）**で消す。ただしCamera planのJoin列が`CUT`のチャプター（視点切り替え）は共有せず、同じ瞬間を新アングルで描いた開始フレームを別途生成する（ステップ5参照）。

### 生成モードの使い分け（I2V / R2V）

H3には2つのチェックポイントがあり、チャプターごとにどちらを使うかを`script.md`に明記する:

- **I2V（FL2VA）— セリフのないチャプター**: 開始フレーム＋終了フレームを`first_frame`/`last_frame`として厳密に固定できる（seedanceのFrame A/Frame B相当）。音声入力は持てない。キャラ同一性はキーフレーム自体で担保する。
- **R2V（Ref2VA）— セリフのあるチャプター**: 参照画像（最大9）＋音声（最大3）を渡せる唯一のモード。**開始・終了キーフレームは<Picture 1>/<Picture 2>として渡し、プロンプトで「動画はこの絵で始まりこの絵で終わる」と明示的に拘束する**（I2Vほど厳密なアンカーではないため、パイロット検証で乖離を確認する）。残りの画像スロットにキャラクターシートを入れて同一性を固定する。
- 添付ファイルはプロンプト内で**接続順のタグ**で参照する: `<Picture 1>`, `<Audio 1>`（seedanceの`@Image1`/`@Audio1`に相当。話者バインディングもこのタグで行う）。

### Motion promptの内部構造（公式h3-prompt-writing準拠）

H3はモデル提供元の公式プロンプトガイド（ https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing ）の記法で学習されているため、Motion prompt本文はその構造に合わせる。冒頭の`Required attached input files:`（機械検証対象）は従来どおり必須で、その後の本文を次の順・記法で書く:

1. **本文（統合記述）**: 構図→被写体→環境→動作→カメラ→画面内の音の順で、**見える・聞こえるものを具体的に**書く（あらすじ要約にしない）。seedance由来のルール（状態遷移記法・時間帯の句・NG要素・画面内テキスト禁止）はこの本文に入れる。
2. **カメラは「種類＋振幅＋速度」の標準記法で書き、`## Camera plan`の該当行と一致させる**: 例 "the camera pushes in with small amplitude at slow speed"。動かさないなら "locked-off static camera" と明示する（無指定はモデルが勝手に動かす）。**全チャプターをlocked-off staticにしない**（単調防止原則はseedanceステップ1「カメラワーク設計ルール」参照）。ムーブはキーフレーム両端の構図差に焼き込まれていること（ステップ5参照）。**セリフのあるR2Vチャプターはstatic〜slow small push-inに留める**（R2VはキーフレームのアンカーがI2Vより緩く、速いムーブは口元の描画とリップシンクを壊す。ダイナミックなムーブはセリフなしI2Vチャプターに置く）。`validate_local_run_bundle.py`が各Motion prompt内のカメラ記述を機械検証する。
3. **セリフの記法（R2Vのみ）**: 話者に発話順で安定ID `(S1)`/`(S2)` を振り、セリフ本文を `<d>[Japanese] セリフ原文</d>` タグで逐語埋め込みする（翻訳・言い換え禁止。添付wavを使う場合もセリフ本文を`<d>`タグで書く）。例: "ONLY Fukuchan (<Picture 3>, the slim stylish black-haired man) (S1) speaks — he says <d>[Japanese] 快適です！</d>, lip-syncing to <Audio 1>"。画面外ナレーションは "says in an off-screen voiceover" と書き、映っているキャラ全員に "lips remain completely closed" を添える。
4. **`Soundscape:`（末尾に必須）**: 環境音・動作音を1〜4文の英語で書く。セリフはここに再掲しない。
5. **`Music:`（末尾に必須）**: 劇伴の有無を必ず明示する。既定は "Music: no background music"（BGMはffmpeg結合時に後載せできる）。生成させる場合は**楽器・テンポ・リズム・強弱で具体的に**書き、抽象的なムード語だけで書かない。
6. **分量**: 本文全体で**350〜500語**を目安にする（公式ガイドの推奨値）。セリフの多いチャプターは語数より発話タイムラインの完全性を優先する。長すぎるなら要約せずチャプターを割る。

`validate_local_run_bundle.py`が各Motion prompt内の`Soundscape:`と`Music:`の記載を機械検証する。

### H3 inputs表（`script.md`の各チャプターに必須）

seedanceの「CapCut inputs」に代わり、各チャプターに以下を書く（英語）:

```
### H3 inputs (Chapter 3)
- Mode: R2V
- Images (connection order = <Picture N> tags; max 9):
  - <Picture 1> = `ch3_start.png` — start keyframe; the video's FIRST frame
  - <Picture 2> = `ch3_end.png` — end keyframe; the video's LAST frame
  - <Picture 3> = `Fukuchan_sheet.png` — Fukuchan's character model sheet, identity/design reference only, NOT a composition reference
- Audio (max 3 files, each 2-15s, 15s total; attach in speaking order):
  - <Audio 1> = `ch3_line1_fukuchan.wav` (2.0s; padded from 1.6s) — spoken by Fukuchan, use AS-IS as the dialogue audio
- Total input files: 4 / 12
- Motion prompt: Required attached input files: <Picture 1> = ch3_start.png — start keyframe; <Picture 2> = ch3_end.png — end keyframe; <Picture 3> = Fukuchan_sheet.png — identity reference (PRESERVE: face, hairstyle, outfit and all NG-change elements; do NOT carry over: pose, camera angle, sheet background or panel layout); <Audio 1> = ch3_line1_fukuchan.wav — Fukuchan's line. These attachments are REQUIRED inputs. The video starts EXACTLY on <Picture 1> and ends EXACTLY on <Picture 2>. <motion described as explicit state transitions, same rules as seedance; camera as type + amplitude + speed, e.g. "locked-off static camera">. ONLY Fukuchan (<Picture 3>, the slim stylish black-haired man) (S1) speaks — he says <d>[Japanese] セリフ原文</d>, lip-syncing to <Audio 1>; he begins the line almost immediately and his mouth moves ONLY while <Audio 1> is playing; once the line ends his mouth stays CLOSED. Use <Audio 1> AS-IS as the dialogue audio and do NOT generate any voice. The reference sheets' text labels must NOT appear in the video. Soundscape: <ambient and action sounds in 1-4 sentences, dialogue not repeated>. Music: no background music.
- Duration: 5s / Aspect: 16:9 (native 768p — output rounds to 1344x768)
```

セリフのないチャプターは:

```
### H3 inputs (Chapter 2)
- Mode: I2V
- First frame: `ch2_start.png`
- Last frame: `ch2_end.png`
- Motion prompt: <explicit state transitions; camera as type + amplitude + speed; no dialogue; "no speech, no narration"> Soundscape: <ambient and action sounds in 1-4 sentences>. Music: no background music.
- Duration: 4s / Aspect: 16:9 (native 768p)
```

- Motion promptは**そのまま使える完成形**で書き、実行時の要約・短縮を禁止する（seedanceと同じ。長すぎるならチャプターを割る）。
- `- Total input files:`行を必ず書き、12以下であることをここで確認する。
- Durationは必ず明示する。セリフのあるチャプターは「音声wav合計長＋約1秒」を目安にする。

## 4. セリフ音声の生成

seedance SKILL.mdステップ2と同一（同スキルの`irodori_speak.sh`/`voicevox_speak.sh`/`sobaya_monsterize.sh`をそのまま使い、Dialogue audio表を書く）。本スキル固有の追加ルール:

- **H3の音声入力は1ファイル2秒以上が条件。** トリム後2.0秒未満のwavは末尾に無音を足して2.0秒にする（先頭に足すとリップシンク開始がずれるので必ず末尾）:

```
ffmpeg -y -i ch3_line1_fukuchan.wav -af "apad=whole_dur=2.0" ch3_line1_fukuchan_padded.wav && mv ch3_line1_fukuchan_padded.wav ch3_line1_fukuchan.wav
```

- Dialogue audio表のDurationにはパディング後の値を書き、元の実発話長も併記する（例: `2.0s (padded from 1.6s)`）。チャプター尺の見積もりは実発話長ベースでよい。
- ファイル名は`chN_lineM_<char>.wav`（seedanceの`clipN_...`のNをチャプター番号に読み替え）。

## 5. キーフレーム一括生成（draw-things-cli）

**実行エージェント自身が**本スキル同梱の`dt_generate.sh`（生成）と`stitch_refs.py`（複数参照の連結）でローカル生成する。画像生成を他の外部エージェントに委譲しない。1チャプターにつき`chN_start.png`＋`chN_end.png`の2枚。使用モデルの正典は**Qwen Image Edit 2511（6-bit）`qwen_image_edit_2511_q6p.ckpt`**で、1つのランの途中でモデルを変えない。

### 所要時間と実行方法

- M4 Max / 1024x576 で**約23秒/step**（推奨30stepで約11.5分/枚）。チャプター数が多いランは`DT_STEPS=20`に落とす。
- キーフレーム枚数の下限は「チャプター数＋1」（つなぎ目共有のため。Camera planのJoin列が`CUT`のチャプターは共有しないため1枚ずつ増える。push-in終了フレームのクロップ作成分は生成不要なので差し引ける）。作業前に総時間を見積もる。
- チェーン生成なので並列化不可。フォアグラウンドで1枚を待つとツールタイムアウト（10分）に掛かるため、**全フレームを1本のシェルスクリプトにまとめて必ずバックグラウンドで実行**する。スクリプトには「出力が既にあればスキップ」を入れる（中断・再開とステップ6の部分再生成で同じスクリプトを再利用するため）。
- 使用シードは`script.md`に記録する（部分再生成の再現性のため）。
- **ノートPCでは`caffeinate`で必ずスリープを禁止する（実測で必要）。** 長時間チェーンを放置するとmacOSがidle sleepに入り、生成が止まる。実例: 1枚16分のフレームが夜間放置で**壁時計9時間24分**かかった（`pmset -g log`に"Wake from Deep Idle"が並ぶ）。生成が異常に遅いときは性能劣化を疑う前に`pmset -g log | grep -E "Sleep|Wake"`でスリープ履歴を見る。
  ```
  nohup caffeinate -dimsu > /dev/null 2>&1 &   # 実行中のプロセスを止めずに後から掛けてもよい
  ```
  作業が終わったら忘れずに停止する（`pkill caffeinate`）。

### 一括生成→一括検証（本スキルの要）

**全チャプターのキーフレームを最後まで生成し切ってから検証フェーズ（ステップ6）に入る。** 生成の途中で個別の作り直しを始めない（作り直しは修正リストが完全確定してから）。

### 画風の決定（プロンプトを書く前に必ずやる）

画風は思い込みで決めず、**そのランに登場する全キャラの`*_sheet.png`と、`03_SCRIPTS/`の直近ランの`clip1_start.png`（またはch1_start.png）をReadで開いて確認してから**、画風固定文を書き起こす。このIPの画風は「アニメ絵」ではない: 窓際メンバーの多くは実写写真のシート、無職やめたろうだけがマットな3Dチビ人形で、**実写調の空間に両者が同居する絵**が確立した画風。`anime style`/`cartoon style`と書いてはいけない。確定した画風固定文は**`script.md`の`## Style block`セクションに1行で書き、全キーフレーム生成プロンプトと全Motion promptに毎回一字一句同じ文で**入れる（seedanceステップ1「画風固定ルール」と同一。`validate_local_run_bundle.py`が逐語埋め込みを機械検証する）。

### 参照の渡し方と生成順序（チェーン）

`draw-things-cli generate`の`--image`は1枚のみ。複数参照が必要なときは`stitch_refs.py`で1枚の参照キャンバス（`ref_canvas_*.png`と命名。生成用中間ファイルでありH3入力ではない）に連結してから渡す。キャンバスは生成キーフレームと同じアスペクト比で作り、連結順＝画面上の位置（既定`row`）なのでプロンプトでは"The LEFT panel is ..."と位置で役割を指定する。

1. **チャプター1の開始フレーム**: 登場キャラ全員のシートを連結した参照キャンバスを入力に、「入力画像はキャラクターシートの寄せ集め。これらのキャラで新しいシーンを描く」形で生成する（構図はCamera planの該当行のショットサイズ・アングルをプロンプトに入れる）。
2. **チャプター1の終了フレーム**: いま作った開始フレーム単体を入力に編集プロンプトで生成する。カメラが静止のチャプターは「同じ絵のまま、動きが変える部分だけ終了状態に変える」。**カメラムーブのあるチャプターは構図もムーブ終了位置へ変える**（例: "Reframe the SAME scene from slightly closer — MEDIUM shot on Fukuchan — keeping every character, prop state, lighting and the art style unchanged; additionally change only what the motion changes"）。
3. **チャプター2の開始フレーム＝チャプター1の終了フレーム**（Camera planのJoin列が`SHARED FRAME`のとき。再生成せず同一ファイルを共有）。**Join列が`CUT`のチャプターは共有せず、前フレーム単体を種に「THE SAME scene at THE SAME moment, rendered from a NEW camera position: <新しいショットサイズ・アングル>」の編集プロンプトで新規生成する**（時間経過ゼロ: 小道具の状態・時間帯・キャラの位置関係・画風は種画像と完全に同一に保つ。場所が変わるときも同様に前フレームを種にする）。
4. 以降も 開始→終了 の順で前フレームを種にチェーンする。ゼロから独立生成しない。
5. **ズーム系（push-in / pull-back）の寄り側フレームはクロップで作るのが最も安定**: 広い方の構図のフレームから被写体中心に同アスペクト比でクロップし、元解像度へ拡大する（`ffmpeg`/`sips`等。倍率は解像感が保てる約2倍まで）。push-inの終了フレームは開始フレームのクロップで作れる（**生成不要＝約11.5分/枚の節約にもなる**ので最優先で使う）。pull-backは開始フレームが自由なとき（チャプター1またはCUT境界）に限り「広い終了フレームを先に生成→開始フレームをクロップ」が使える。開始が共有で固定済みのpull-backは引き構図への編集生成になり、種画像に無い周辺を描き足すため崩れやすい — 崩れる場合はpull-backをCUT境界へ移す。

```
python3 .claude/skills/local-video/stitch_refs.py 03_SCRIPTS/<NN>_<slug>/ref_canvas_ch1_start.png \
  03_SCRIPTS/<NN>_<slug>/Sobaya_sheet.png 03_SCRIPTS/<NN>_<slug>/Fukuchan_sheet.png

.claude/skills/local-video/dt_generate.sh 03_SCRIPTS/<NN>_<slug>/ch1_start.png \
  03_SCRIPTS/<NN>_<slug>/ref_canvas_ch1_start.png 42 1024x576 <<'EOF'
The input image is a contact sheet of character model sheets — identity/design references only, NOT a composition reference. Using exactly these characters, create the FIRST-FRAME still of a video shot: <START state incl. Prop states, Fixture layout, and the Scene ledger's time-of-day/lighting phrase (e.g. "bright midday daylight")>. <the run's style block>. Single still frame, one coherent scene, no text overlay, no sheet-style panels or labels.
EOF
```

### チェーン中のデザイン劣化とシート再投入

前フレームだけを種に繋ぐと数フレームでデザインが劣化する（実測: 5枚目でやめ太郎の丸メガネが四角い黒縁に変わった）。対策:

- NG要素が崩れたフレームは**前フレーム＋キャラクターシートの連結キャンバス**を種に作り直す（前フレーム単体で作り直しても同じ崩れ方をする）。
- 同一キャラが5枚以上続くチェーンでは、崩れる前でも数フレームおきにシートを再投入する。
- **NG要素は毎フレーム明文で固定する**（正しい形＋否定形のセット。例: "he keeps SMALL ROUND white-rimmed glasses — NOT rectangular, NOT thick dark-rimmed"）。「形が変わる」だけでなく「丸ごと消える」ドリフトも起きるため、存在自体も守る（"he is ALWAYS WEARING his round glasses ... the glasses do NOT disappear"）。
- **ラン途中の新キャラ登場は、シートを連結せず必ず「文章指定」にする（実測で失敗済み・違反禁止）。** 前フレーム単体を種に、各キャラ設定mdの「プロンプト用同定句（英語）」＋"Draw <name> in EXACTLY the same rendering style as the rest of the input image"で指定する。キーフレーム上の似姿は多少甘くてよい（動画側の同一性はH3へ渡すシートで担保する。優先すべきは画風の統一と構図）。
  - **実際の失敗例（2026-08）**: 実写写真シートの福ちゃんをチビ絵チェーンの`ch5_end`でシート連結して登場させたところ、モデルが矛盾を「福ちゃんもチビにする」ことで解消し、**やめ太郎と同じ頭身・同じ丸メガネ・同じ頬紅のチビ人形**になった上、身長差も消えて（本来はやめ太郎の全身が腰まで）、やめ太郎側に福ちゃんのネームストラップまで移った。下流9枚を作り直すことになった。
  - 人間キャラを文章指定するときは**頭身とスケールを毎フレーム明文で固定する**: "an ADULT MAN WITH NORMAL HUMAN PROPORTIONS, normal-sized head (~1/7 of his height), NOT a chibi character, NOT a toy figure" ＋ "MUCH TALLER than <chibi char>: the whole of <chibi char> only reaches his hip"。
  - **キャラ間の衣装汚染も否定形で止める**: "<chibi char> wears NO lanyard, NO name tag and NO jacket — only his <canonical outfit>"。
- セリフのあるチャプターのキーフレームは**話者の口を開け、非話者の口を閉じて**描く（リップシンク取り違え防止の最強シグナル）。
- **飲み物の器は「フレーム内に何個あるか」まで指定する（実測で失敗済み）。** 「空のジョッキ」とだけ書くと、モデルが**台帳に無い2つ目の器**（液体入りのタンブラー等）を勝手に足し、以降のチェーンで「空」の指示が別の器に当たって元のジョッキが満杯に戻る/消える、という状態崩壊が起きた。個数まで固定する: "There is exactly ONE drinking vessel in the entire frame: a single EMPTY clear glass mug … There is NO second glass, NO tumbler, NO cup and NO bottle anywhere, and NO liquid of any kind is visible anywhere in the frame"。
- **数え物は「達成できる configuration」で書く。** 「潰れた缶3本」と書いても実際には「潰れ2本＋直立1本」で安定した。台帳とプロンプトを実際に安定して出る配置へ合わせるほうが、毎フレーム再生成するより良い（チェックリストも同じ表現に合わせる。でないと欠陥でないものがFAILし続ける）。

## 6. 画像検証（Qwen3-VL一括検証→修正リスト確定→部分再生成）

**全キーフレームが出揃ってから**検証フェーズに入る。逐次「1枚直してはまた生成」はチェーンの再共有を繰り返して整合性を壊すため禁止。

この検証工程は共通スキル **`/image-validation`**（`.claude/skills/image-validation/SKILL.md`）として切り出されている。多数フレームの一括検証には同スキルの`verify_run.py`（チェックリストを`validation/checklists/`に置いてバッチ実行）が使える。`verify_frame.py`の実体も`.claude/skills/image-validation/`にある（本ディレクトリの同名パスはsymlinkで、以下のコマンド例はそのまま動く）。手順:

### 6-1. 全フレームをVLMで検証する

各キーフレームについて、`script.md`から**そのフレーム固有のチェックリスト**を組み立て、同梱の`verify_frame.py`（Ollama + Qwen3-VL）に渡す:

```
python3 .claude/skills/local-video/verify_frame.py 03_SCRIPTS/<NN>_<slug>/ch3_start.png <<'EOF'
This image should be the first frame of a video shot. Verify ALL of the following and answer PASS or FAIL per item:
1. Exactly one coherent scene (not a multi-panel sheet, no contact-sheet layout, no text/labels/watermarks).
2. Fukuchan — a slim stylish black-haired man in a black long coat — is standing on the LEFT, mouth OPEN mid-speech.
3. Yametaro — a chibi 3D figure with an oversized head — wears SMALL ROUND white-rimmed glasses (not rectangular, not missing), mouth CLOSED.
4. The beer mug on the table is EMPTY (per the prop ledger cell for C3 start).
5. The entrance door is hinged on its LEFT edge with a silver lever handle on the RIGHT edge at mid-height.
6. Style: photorealistic live-action-style scene (NOT flat 2D anime), with Yametaro alone rendered as a soft matte 3D chibi figure.
EOF
```

チェックリストに必ず含める観点（フレームごとに`script.md`の該当箇所から具体化する）:

1. **1枚絵として成立しているか**（複数パネル・シート化・文字混入・ウォーターマークがない）
2. **登場キャラ全員のキャラ同一性**: 各`02_CHARACTERS/0N_*.md`の**シート照合チェックリスト**を1項目1行に展開する（NG変更の形の崩れと「丸ごと消える」の両方。仮面の目穴・口のスリット・マーキング本数、後ろ姿での髪・NG小物の有無、体型・肌の色・衣装まで見る）。**チェックリストを書く前にそのキャラの`*_sheet.png`をReadで開く**（省略禁止）
3. **Prop state ledgerの該当セルとの一致**（グラスの中身・持ち方等）
4. **Scene ledgerの該当セルとの一致**（場所と時間帯・光。昼の場面なのに夜景・夜空・点灯した提灯になっていないか等）
5. **Fixture layoutとの一致**（蝶番側・ノブ側・開き方向）
6. **話者の口の開閉**（セリフのあるチャプター: 話者は口が開き、非話者は閉じている）
7. **画風の一致**（そのランの画風固定文と合っているか。チェーンの進行でアニメ調⇄実写調にドリフトしていないか）
8. **キャラクターの人数**（フレーム内の人物数が台本と一致し、同一キャラが2人以上写っていない）
9. **Camera planとの一致**（ショットサイズ・アングルが該当行どおりか。ムーブのあるチャプターの開始/終了フレームの構図差がムーブと一致しているかは隣接フレーム比較＝時系列チェック側で見る）

- `verify_frame.py`は`VERDICT: PASS`/`VERDICT: FAIL`＋指摘リストを返す。**FAILだけでなくPASSでも指摘内容を読み、ClaudeもReadで画像を開いて突き合わせる**（VLMの見落とし・誤検出の両方があり得る。最終判断はClaudeが行う）。
- 隣接フレーム間の整合（つなぎ目共有、金具位置の連続性、状態遷移に対応する動作の有無、時間帯・照明の連続性）はVLMの単画像検証では見えないため、**Prop state ledger・Scene ledgerの1行ごとに全フレームを時系列で見比べる最終チェック**をClaudeが行う（動作なしに状態が飛んでいる境界、画面内の時間経過描写なしに昼夜・光が変わる境界があれば修正リストに載せる）。

### 6-2. 修正リストを完全確定させる

全フレームの検証結果を`03_SCRIPTS/<NN>_<slug>/fix_list.md`にまとめる（英語）。1行＝1修正: 対象ファイル / 問題 / 修正方針（プロンプト修正・種の変更・シート再投入） / 影響を受ける下流フレーム（共有・チェーン先）。

**fix_list.mdが完全に確定するまで、1枚も再生成しない。** これがこのスキルの画像工程の要（検証と修正の混走はチェーン崩壊と手戻りの温床）。

### 6-3. 必要な画像だけ再生成し、再検証する

- fix_list.mdの項目を**チャプター番号の若い順（チェーンの上流から）**に処理する。
- NG要素の崩れは「前フレーム＋キャラクターシートの連結キャンバス」を種に作り直す（ステップ5のデザイン引き戻しルール）。
- 再生成したフレームを種・共有元にしていた下流フレームは追従させる（共有フレームはコピーし直し、チェーン先は必要なら再生成）。追従したフレームもfix_list.mdに再検証行を足す。
- 再検証はfix_list.mdに載ったフレームだけでよい（全数再検証は不要）。全行が解消したらステップ7へ。

## 7. H3動画生成（チャプター毎・ComfyUI）

**このステップだけはNVIDIA CUDA GPUが必要**（ステップ1「動作環境の前提」参照）。Apple Siliconで作業している場合は、ここまでの成果物をポータブルバンドルにしてCUDA機へ渡す。

### 実行方法

1. ComfyUIをバックグラウンドで起動する（起動済みならそのまま使う）: `cd ~/ComfyUI && python3 main.py --listen 127.0.0.1 --port 8188`（環境により`--lowvram`等を付与）。
   - **プロセスを止めるときは`pkill -f "main.py --listen"`でマッチさせる。** `pkill -f "venv/bin/python main.py"`は`ps`がvenvのshimをフレームワークPythonの実体パスに解決するため**何にもマッチせず黙って失敗する**（実測: 停止したつもりで旧インスタンスが動き続け、新インスタンスがポート衝突で即死した）。停止後は必ず`pgrep -f "main.py --listen" | wc -l`で0を確認する。
2. チャプターの入力ファイル（キーフレームPNG・シートPNG・wav）を`ComfyUI/input/`へコピーする。
3. セットアップ時に保存したAPIワークフローJSON（`h3_i2v_api.json`/`h3_r2v_api.json`）をラン専用ディレクトリへ`chN_workflow.json`としてコピーし、そのチャプターのH3 inputs表どおりに書き換える（画像/音声ファイル名、Motion prompt原文、尺、解像度、モードに応じたチェックポイント）。
4. 同梱の`h3_run.py`で投入し、完了を待って出力を回収する:

```
python3 .claude/skills/local-video/h3_run.py 03_SCRIPTS/<NN>_<slug>/ch3_workflow.json \
  --out 03_SCRIPTS/<NN>_<slug>/ch3.mp4
```

- 生成は1本あたり長時間かかる（Apple Silicon実測値はセットアップ後に必ず1本目で計測して見積もる）。**必ずバックグラウンドで実行**し、`h3_run.py`のポーリング出力をモニタする。
- Motion promptはH3 inputs表の**原文をそのまま**JSONに入れる（要約・短縮禁止）。

### 生成実行プロトコル（`script.md`末尾に英語で必ず記載）

seedance SKILL.mdステップ5のプロトコルを本スキル用に置き換えて記載する:

```
## Generation & assembly protocol (REQUIRED — read before generating any chapter)

### Step 1 — Pilot chapter first (batch generation is FORBIDDEN until the pilot passes)
Generate ONLY the first dialogue chapter, then verify ALL of the following:
- [ ] The dialogue in the output is driven by the attached wav (correct voice, no synthesized/doubled voice)
- [ ] The CORRECT character lip-syncs (speaker's mouth moves only while the audio plays; non-speakers stay closed)
- [ ] The video starts/ends on (or acceptably close to) the start/end keyframes — check R2V frame anchoring
- [ ] Motion, poses, prop states and fixture hardware match the Motion prompt / ledgers
- [ ] Camera work matches the chapter's Camera plan row: a static chapter stays locked-off (no drift, no spontaneous camera motion), a moving chapter actually performs the specified move at the specified amplitude and speed, and the final framing lands on the end keyframe
- [ ] Character identity survives H3 generation — open each `*_sheet.png` alongside the clip and check that character's canon checklist item by item (mask construction and marking count, hair visible from the back, skin tone, body build and height ratio, exact outfit, signature prop). A near-miss is a FAIL
- [ ] Every named character appears EXACTLY ONCE in EVERY frame — no duplicated characters or props, especially during appear/disappear/handoff actions
- [ ] The art style matches the run's Style block and the keyframes, and stays consistent through the whole chapter
- [ ] Ambient sound and music match the prompt's Soundscape/Music lines (no unrequested background music)
- [ ] Duration matches the H3 inputs table (remember the 17k+5-frame grid rounding)
If any check fails, fix the workflow inputs/prompt and regenerate the pilot until all pass.
Only then generate the remaining chapters, and re-run at least the audio + duration checks on each.

### Step 2 — Prompts are verbatim
Copy each chapter's Motion prompt into the workflow JSON EXACTLY as written here. Do NOT
summarize or shorten. If it seems too long, go back to the script and split the chapter.

### Step 3 — Final audio track (assembly)
H3's embedded audio has been verified faithful to the attached wavs (2026-08 pilot: envelope
match + listening check). During assembly:
1. DEFAULT: keep the embedded audio for ALL chapters (dialogue and ambient alike) — no re-laying,
   no offset work.
2. ONLY IF the pilot audio check for THIS run hears degradation, doubling or a changed voice:
   strip the embedded audio on dialogue chapters and lay the original wavs from the Dialogue
   audio table over the video, aligned to the frame where the speaker's mouth starts moving.
3. Play back the assembled video before delivery and confirm every line sounds like the local
   Irodori-TTS / VOICEVOX take (the source wavs remain the reference for this check).
```

## 8. 結合と最終音声（ffmpeg）

1. **チャプター単位で音声を確定させる**。**既定は埋め込み音声をそのまま使う**: 2026-08の実測（Colab L4・adhoc1）で、H3の埋め込み音声は入力wavと同等（エンベロープ一致・聴感で劣化なし）と確認済みのため、セリフ入りチャプターも`cp chN.mp4 chN_final.mp4`でよい。**パイロットの音声チェックで劣化・二重声・別人化を検出したランに限り**、埋め込み音声を捨ててローカルwavを口の動きに合わせたオフセットで載せ直す（フォールバック手順）:

```
# offset: 話者の口が動き始めるフレームの時刻（ms）。動画を確認して決める
ffmpeg -y -i ch3.mp4 -i ch3_line1_fukuchan.wav \
  -filter_complex "[1:a]adelay=800|800,apad[a]" \
  -map 0:v -map "[a]" -c:v copy -shortest ch3_final.mp4
```

セリフのないチャプターは`cp chN.mp4 chN_final.mp4`（生成環境音を残す）。環境音とセリフを混ぜたい場合のみ`amix`を使い、セリフが二重になっていないことを確認する。

2. **全チャプターを結合する**:

```
printf "file 'ch1_final.mp4'\nfile 'ch2_final.mp4'\n" > concat.txt   # 全チャプター分
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy final_draft.mp4
```

3. **VOICEVOXクレジットの焼き込み（VOICEVOXの声を使ったランでは必須）**: CapCutが無いので、ffmpegの`drawtext`で動画末尾にクレジットを表示する（`script.md`の`## Credits`にこのコマンドを記載する）:

```
ffmpeg -y -i final_draft.mp4 -vf "drawtext=fontfile='/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc':text='VOICEVOX\:白上虎太郎 / VOICEVOX\:ずんだもん':fontsize=28:fontcolor=white:borderw=2:bordercolor=black:x=w-tw-24:y=h-th-24:enable='gte(t,<末尾クリップ開始秒>)'" -c:a copy final.mp4
```

4. 結合後の`final.mp4`を通しで確認する（つなぎ目の絵飛び、音声のズレ・二重、尺）。成果物はラン専用ディレクトリに置く。

## 9. 同梱物の最終検証（必須・完了報告の直前）

```
python3 .claude/skills/local-video/validate_local_run_bundle.py 03_SCRIPTS/<NN>_<slug>
```

検証内容: H3 inputs表の全ファイルがラン直下に物理ファイルとして存在する / R2Vチャプターの入力が「画像9・音声3・合計12」以内 / 各Motion promptが`Required attached input files:`で全`<Picture N>`/`<Audio N>`をファイル名ごと再宣言している / 各Motion promptに音響指定（`Soundscape:`と`Music:`）がある / `## Style block`セクションが存在し各Motion promptに画風固定文が逐語で含まれている / `## Camera plan`セクションが存在し各Motion promptにカメラ記述がある / I2VチャプターにFirst/Last frameがある / `script.md`がラン外パスを参照していない。

**検証が失敗したままユーザーへ完了報告してはいけない。**
