# 90_death_game_opening_monitors — 実行手順（Colab）

画像なし動画制作（`/no-image-video`）のラン。キーフレームは1枚も使わず、**キャラクターシート＋セリフ音声＋プロンプト**だけで全6チャプターをMiniMax H3のR2Vで生成する。

## 中身

| ファイル | 役割 |
|---|---|
| `chapter_plan.md` | 人間確認用のチャプター計画（日本語）。全6章 `APPROVED` |
| `script.md` | 生成用の台本（英語）。台帳・H3 inputs表・Motion promptの正典 |
| `chN_prompt.txt` | `script.md` から逐語抽出したMotion prompt |
| `chN_workflow.json` | ComfyUI APIワークフロー（全てR2V） |
| `*_sheet.png` | 同梱した正典キャラクターシート（おかやまん・福ちゃん・やめ太郎・そば屋） |
| `chN_lineM_*.wav` | 採用済みセリフ音声（Irodori-TTS。そば屋はモンスター加工済み） |
| `assemble.sh` | 回収後の結合スクリプト（bash 3.2対応） |
| `h3/` | Colab用パッケージ（バンドルzip＋R2Vノートブック） |

## 1. Colabで生成する

1. `h3/90_death_game_opening_monitors_h3_bundle.zip` をGoogle Driveの `MyDrive/h3_inputs/` に置く。
2. `h3/h3_colab_r2v.ipynb` をColabで開く（本番はL4またはA100。無料T4は配管検証用）。
3. セル1はチャプター一覧・入出力パスが設定済みなので、そのまま★一括実行する。
4. 成果物は `MyDrive/h3_outputs/90_death_game_opening_monitors/` に退避される。

**パイロットは Chapter 4 を1本だけ先に回す**（`script.md` の Generation & assembly protocol のチェックリストで判定する）。特に見る点:

- シートがそのまま第1フレームに出ていないか（パネル・クリーム色の背景・文字ラベルの混入）
- 開始配置が台本どおりか（そば屋は手ぶら、背景はボケたステージ）
- 仮面が正典どおりか（黒い目穴2つ・口スリット1本・赤マーキング4本・額の黒点1つ・グレーの肌）。口スリットが開いて人間の口になっていたら不合格
- 音声が添付wavそのままか（モンスターボイス、二重声なし）

合格後に残り5章を回す。Ch5・Ch6は**部屋に人間が1人も立っていないこと**と、**1つのモニターに2人写っていないこと**を拡大して確認する。

所要目安（L4+sage・直列）: 約100分。

## 2. 回収して結合する

```
# Driveから chN.mp4 をこのディレクトリへコピーしてから
./assemble.sh
```

`assemble.sh` は (1) 各 `chN.mp4` のフレーム数が `script.md` の `Frames:` と一致するか照合し、(2) 埋め込み音声のまま結合して `final.mp4` を作り、(3) 各章の中間フレームを並べた `contact_sheet.png` を出力する。

**結合後は `contact_sheet.png` を必ず拡大して目視する。** 画像なし制作の主な事故は「台本に無い物・人が湧く」こと。この作品では次を見る:

- Ch1〜4: 画面内の人物が1人だけか（観客・スタッフが湧いていないか）
- Ch5・Ch6: 部屋に立っている人物がいないか、モニターの数と向きが台本どおりか
- 全章: 画面内テキスト（字幕・崩れた日本語・モニターの文字表示）が無いか

音声が劣化・二重声になっていた章だけ、ローカルwavを載せ直す:

```
./assemble.sh relay ch4
```

そのあと `./assemble.sh` をもう一度実行すると `final.mp4` が作り直される。

## クレジット

VOICEVOXは未使用（全セリフIrodori-TTSのボイスクローン）。画面内クレジットの焼き込みは不要。
