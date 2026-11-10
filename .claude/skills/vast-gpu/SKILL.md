---
name: vast-gpu
description: ColabでA100が割り当てられないとき、build_h3_run_package.pyで作ったColab用のH3パッケージ（バンドルzip＋ノートブック）を、Vast.aiで時間貸しのGPU（A100など）を借りてそのまま回すワークフロー。ユーザーから「Vast.aiで回して」「Vast.aiのA100で作って」「ColabのA100が取れない」「外部のGPUを借りて生成して」と頼まれたとき、768p・15秒など L4 では落ちるチャプターを確実に回したいときに必ず使用する。インスタンスの選び方・借りる前の課金設定の確認・SSH鍵の登録・送信と開始・進捗確認・回収・インスタンスの削除までを扱う。課金が発生するため、借りる前に見積りを出してユーザーの了承を取り、回収後は必ずインスタンスを削除する。
---

# Vast.ai で H3 を回す（Colab の A100 が取れないとき）

`/colab-video` の `build_h3_run_package.py` が作った **Colab 用のバンドル zip とノートブックを、中身を変えずに** Vast.ai の GPU インスタンスで回す。台本・素材・パッケージ作りは `/colab-video`（と `/no-image-video` などの動画スキル）のまま、**生成する場所だけを Vast.ai に替える**。

- `vast_h3_run.py` がインスタンスの中で google.colab の代わりを用意し、ノートブックの「★一括実行」セルを IPython で実行する（「Google Drive」はインスタンス内の `/content/drive/MyDrive/` になる）
- 既定で `WORKERS=1`（A100 40GB の2並列は243フレーム以上で VAE デコードが落ちることがあるため）・`AUTO_SHUTDOWN=False`・キューなしに書き換える

## 実績（2026-11-09・`49_sobaya_musou_gameplay_target` の v2hit 版）

| 項目 | 値 |
|---|---|
| インスタンス | A100 PCIE 40GB ×1（チェコのデータセンター・Verified・下り約14.6 Gbps）・$0.775/時・ディスク150GB |
| テンプレート | PyTorch (Vast)（`vastai/pytorch`、CUDA 13.2、torch 2.14） |
| 準備 | 重み約54GB の DL＋ComfyUI 起動で**約6分**（回線が速いと Colab より早い） |
| 生成 | 768p・362フレーム（15秒）・蒸留8step・R2V で **1章 22.8〜24.5分**（1step 約153〜166秒） |
| 合計 | 6章で約2時間24分、**費用 $2.60**（通信料込み） |

## 0. 前提（必ず守る）

- **借りる・課金設定を変える・削除するのは、ユーザーの了承を取ってから**。アカウント作成・クレジット購入・カード登録はユーザーが行う（Claude はしない）
- 借りる前に**見積り**（時給 × 見込み時間）を出す。見込み時間は上の実績（A100 40GB で 768p・15秒 1章 約24分、準備 5〜30分）から立てる
- **回収したら必ずインスタンスを Destroy（削除）する**。Stop だけではディスク代がかかり続ける
- プロンプト・画像・音声は他人のマシンに上がる。公開前提の素材でないものを送るときはユーザーに伝える

## 1. 借りる前の確認（Billing）

`https://cloud.vast.ai/billing/` を開いて、ユーザーに次を伝える。

- **クレジット残高**（$5〜10 あれば A100 で数時間回せる）
- **自動チャージ（Auto Top-Up）**: 「Enabled」だと残高が $0 を下回ったとき登録カードに自動で課金される（画面の説明文に明記されている）。Vast.ai の画面には無効化のスイッチが無く、確実に止めるにはカードの削除しかない（2026-11 時点）。**カードの削除はユーザーの判断**。削除しない場合も、回収後すぐ Destroy すれば課金は見込みの範囲で止まる
- **残高 $0 で止まるのはインスタンスの稼働だけ**で、削除はされずディスク代は続く（画面の「What Happens When Credit Runs Out?」）

## 2. SSH 鍵の登録（初回だけ）

`https://cloud.vast.ai/manage-keys/` の SSH Keys に、Mac の公開鍵（`~/.ssh/id_ed25519.pub` など）を登録する（「+ New」→ 貼り付け → Save）。公開鍵は渡してよい情報。秘密鍵は絶対に貼らない。

## 3. インスタンスを選んで借りる

`https://cloud.vast.ai/create/` で次の条件にする（URL に直接入れると速い: `https://cloud.vast.ai/create/?machinePortsOpenMin=8&versionCudaMin=12.4&instanceDiskSizeMin=150&gpuModelNames=a100Pcie%2Ca100Sxm4%2Ca100Sxm&offerGpuNumIn=1`）。

| 項目 | 設定 |
|---|---|
| テンプレート | **PyTorch (Vast)**（「Select Template」→ 再生ボタン） |
| GPU | **A100（PCIE / SXM4 / SXM）、VRAM 40GB 以上**、1枚（L4 相当の 24GB は 768p・15秒で落ちる） |
| ディスク | **150GB 以上**（重み約54GB＋ComfyUI＋出力） |
| 種類 | **On-demand**（Interruptible は安いが途中で止められる） |
| ホスト | **Verified**・Reliability 98% 以上・**下り回線が速いもの**（数 Gbps あれば準備が数分で終わる）・データセンター（`datacenter:` 表示）だとなお良い |
| 避ける | **中国のホスト**（HuggingFace から重みを取れない可能性が高い）、下り 1 Gbps 未満（準備が長引く） |

候補を2〜3台、場所・GPU・時給・下り速度・Reliability の表にしてユーザーに提示し、了承を得てから「Rent」を押す。起動後、Instances の「SSH connection」に出る **Direct SSH Connect** の `ssh -p <PORT> root@<HOST>` から HOST と PORT を控える（Proxy の方は使わない）。

最速を狙うなら H100 SXM の複数枚機で章を並列に回す手もあるが、`vast_h3_run.py` は1GPU前提でまだ並列に対応していない（未実装・未計測）。

## 4. 送って開始（Mac で）

```bash
bash .claude/skills/vast-gpu/vast_send.sh <HOST> <PORT> 03_SCRIPTS/<run> <rev>
```

- `<rev>` は `build_h3_run_package.py` の版名（zip が `h3/<run>_h3_bundle_<rev>.zip` ならその `<rev>`。版名なしで作ったパッケージなら `p480` など zip 名の末尾）
- zip・ノートブック・`vast_h3_run.py` を送り、`nohup` で生成を開始する（SSH を切っても止まらない）
- **Vast.ai の PyTorch テンプレートは torch が `/venv/main` に入っている**（システムの python3 には無い）。`vast_send.sh` は `/venv/main/bin` を PATH の先頭にして起動する
- 開始の前に GPU 名・ディスクの空きを表示する

## 5. 進捗の確認と完了待ち

```bash
ssh -p <PORT> root@<HOST> 'grep -E "生成開始|⏱|失敗|Vast.ai" /root/h3_run.log | tail; tail -1 /root/h3_run.log'
```

- 終わりの合図は `★ Vast.ai: done.`、失敗は `FAILED` / `一括実行を中断`。完了を待つときは、この文字列が出るまで数分おきに確認するループをバックグラウンドで回す
- 章ごとの時間は `/content/drive/MyDrive/h3_outputs/<run>_<rev>/bench_log.csv` にも残る

## 6. 回収して、インスタンスを削除

```bash
bash .claude/skills/vast-gpu/vast_fetch.sh <HOST> <PORT> 03_SCRIPTS/<run> <rev>
```

- `03_SCRIPTS/<run>/out_<rev>/` に `chN.mp4`・`bench_log.csv`・実行ログが入る（生成途中でも、終わった章だけ取れる）
- フレーム数を照合する（`ffprobe -count_packets`）。全部そろったら、Instances の画面でゴミ箱（Destroy instance）→ 確認ダイアログの「Destroy」で**削除**し、「Instance destroyed successfully」と残高を確認してユーザーに伝える
- ノートブックの自動切断（`runtime.unassign`）は Vast.ai では何もしない。**削除は必ず手で行う**

## 失敗したとき

- `/root/h3_run.log` の末尾と `/content/comfyui_0.log` の末尾を見る
- 生成済みの章はスキップされるので、直したあとに同じ `vast_send.sh` を流し直せば続きから回る（重みもインスタンスに残っている）

## ファイル

| ファイル | 役割 |
|---|---|
| `vast_h3_run.py` | インスタンス上で動く。google.colab の代わりを用意し、ノートブックの一括実行セルを実行する（Colab 用ノートブックは書き換えない） |
| `vast_send.sh` | Mac から zip・ノートブックを送り、生成を `nohup` で開始する |
| `vast_fetch.sh` | Mac へ成果物とログを回収する |

## 完了条件

- [ ] 借りる前に、見積りと課金設定（自動チャージ）をユーザーに伝えて了承を得た
- [ ] 全章を回収し、フレーム数を照合した
- [ ] インスタンスを削除し、使った金額（残高の差）をユーザーに伝えた
