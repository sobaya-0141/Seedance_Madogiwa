---
name: 2d-game
description: 窓際族物語の2Dゲームを新規作成し、Seedance（CapCut）で制作した動画をオープニング/イベントのカットシーンとして組み込むワークフロー。ユーザーから2Dゲームの制作を頼まれたとき、添付動画（mp4）をゲームに組み込む・差し替えるよう頼まれたとき、カットシーンの追加・修正を頼まれたときに必ず使用する。
---

# 2Dゲーム制作ワークフロー（Seedance動画カットシーン対応）

「オープニング動画 → ゲーム開始 → イベント動画 → ゲームの続き」のように、Seedance製の動画クリップをカットシーンとして挟める2Dゲームを作る。動画はユーザーがCapCut（Seedance）で制作して**添付ファイルとして渡してくる**。動画が届く前でもゲーム本体は先に作れる設計にする（後述のとおり、未配置の動画は自動スキップされる）。

このスキルには2つのモードがある。依頼内容に応じて使い分ける:

- **モードA: 新規2Dゲーム作成** — ストーリー/企画を受け取ってゲーム一式を作る（動画は同時でも後日でもよい）
- **モードB: 添付動画の組み込み・差し替え** — 既存ゲームに動画を配置する（→ 手順1だけ実行すれば済むことが多い）

## 前提となる参照ファイル

- 世界観: `01_WORLD/WORLD_BIBLE.md`（禁止事項: ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）
- 正史年表: `01_WORLD/STORY_TIMELINE.md`
- キャラクター設定: `02_CHARACTERS/*.md`（各キャラのNG変更＝デザイン上変えてはいけない要素はゲーム内表現でも厳守）
- 2Dゲームのテンプレート実装: `08_ROMANCE_NOVEL_GAME/`（Vite + TypeScript、依存ゼロ、データ駆動シーン＋ステートマシン）
- 2D用アート素材:
  - キャラ参照画像: `02_CHARACTERS/*.jpg|png`
  - 採用3Dモデルの前後左右レンダー（透過PNG・スプライトに流用可）: `04_GAME_ASSETS/models3d/sprites/`（そば屋・福ギュン・たこさん・やめ太郎・おかやまん・ゆめみん。作り方は`04_GAME_ASSETS/models3d/README.md`）
  - 採用3Dモデルが無いとーくん・よーたんだけは旧ボクセルの前後左右レンダー: `04_GAME_ASSETS/voxel/model_source/previews/`（背景が単色グレー。使う側で透過する）
  - インラインSVGでキャラを描く場合の手本: `08_ROMANCE_NOVEL_GAME/src/avatar.ts`（NG変更要素をコメントで明記した上でSVG化している）

## 1. 動画アセットの受け入れ（添付mp4を受け取ったら必ずこの手順）

### 正典置き場と命名

- 完成動画の正典置き場は **`04_GAME_ASSETS/videos/<game-slug>/`**（`<game-slug>`は`games.json`の`id`と同じkebab-case）。添付ファイルはまずここへコピーする。ゲームディレクトリに直接置かない（ボクセルGLBと同じ「正典＋symlink参照」方式）。
- ファイル名は役割ベースの英語小文字: `opening.mp4` / `event_<slug>.mp4`（例: `event_boss.mp4`）/ `ending.mp4`。
- ポスター用静止画（任意）は `<name>_poster.png`。Seedanceキーフレーム（`03_SCRIPTS/<NN>_<slug>/clipN_start.png`）の流用を推奨。

### Web向けサイズ・コーデック確認（コミット前に必ず）

CapCut書き出しはサイズが大きいことがある。まず確認:

```
ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=size,duration -of default=noprint_wrappers=1 <file>.mp4
```

- 目標: **H.264 + AAC / 長辺1280px以下 / 1クリップ10MB以下**（GitHub Pages配信のため）。超えていたら再エンコードする:

```
ffmpeg -i input.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow -vf "scale='min(1280,iw)':-2" -c:a aac -b:a 128k -movflags +faststart output.mp4
```

- すでに条件を満たしていれば再エンコードしない（世代劣化を避ける）。
- ffmpegが無い環境ではそのまま使ってよいが、**25MB超のクリップはユーザーに圧縮を相談する**。
- **Git LFSは使わない**（Pages CIのcheckoutがLFSファイルを取得しないため、ビルドが壊れる）。通常コミットで管理する。

### ゲームからの参照（symlink）

ゲームの`public/videos/`から正典置き場への**相対symlink**で参照する:

```
mkdir -p <NN_GAME_DIR>/public/videos
ln -s ../../../04_GAME_ASSETS/videos/<game-slug>/opening.mp4 <NN_GAME_DIR>/public/videos/opening.mp4
```

- **symlinkは実体ファイルが存在してから張る。** 壊れたsymlinkが`public/`にあるとvite buildが失敗する。
- 動画がまだ届いていない場合はsymlinkを張らず、コード側だけ組み込んでおく。プレイヤー（`cutscene.ts`）は404時に自動スキップするので開発・デプロイは止まらない。後日動画が届いたら「正典置き場にコピー → symlink」の2手で組み込み完了（コード変更不要）。

## 2. 新規ゲームの雛形（モードA）

- ディレクトリ名: リポジトリ直下の既存`NN_`連番の最大+1で `NN_UPPER_SNAKE`（例: `10_XXX_GAME`）。
- スタックは`08_ROMANCE_NOVEL_GAME`と同じ **Vite + TypeScript（依存ゼロ）** を基本とする。アクション性が高くCanvas描画が大量に必要な場合のみ、エンジン追加（PixiJS等）を検討してよいが、まず依存ゼロで検討する。
- 必須ファイル構成:
  - `package.json` — `08_ROMANCE_NOVEL_GAME/package.json`を踏襲。**`"build": "tsc --noEmit && vite build"` は必須契約**（Pages CIが実行する）。
  - `vite.config.ts` — **`base: "./"` 必須**（Pagesのサブパス配信のため）。`server.port`は`.claude/launch.json`の既存最大ポート+5、`strictPort: true`。
  - `tsconfig.json`, `.gitignore`（`node_modules` / `dist` / `.vite` / `*.log` / `.DS_Store`）— 08からコピー。
  - `index.html` — `lang="ja"`、モバイル用viewport（`user-scalable=no`）、OG/Twitterメタ、`public/og.png`または`og.svg`。
  - `src/main.ts`, `src/game.ts`（ステートマシン）, `src/types.ts`, `src/style.css` ほか。
  - `src/cutscene.ts` と `style.css` へのカットシーン用CSS — **このスキルの`templates/cutscene.ts`と`templates/cutscene.css`をコピーする**（voxel-character-kitと同じ「各ゲームにコピー」方式。symlinkにしない）。
  - `README.md`（日本語。遊び方・エンディング条件・技術メモ。08のREADMEが手本）。

## 3. カットシーンの組み込みパターン

ステートマシンの状態遷移に `await playCutscene(...)` を挟むだけでよい。典型形:

```ts
import { playCutscene } from "./cutscene";

// タイトル画面の「はじめる」タップハンドラから呼ぶ
private async start(): Promise<void> {
  // ユーザー操作の直後なので音声付き自動再生が通る
  await playCutscene(this.root, {
    src: "videos/opening.mp4",
    poster: "videos/opening_poster.png",
  });
  this.phase = "play";
  this.render();
}

// ゲーム中のイベント発火時（ボス出現・章の切り替わり等）
private async onChapterEvent(): Promise<void> {
  await playCutscene(this.root, { src: "videos/event_boss.mp4" });
  this.phase = "play2"; // ゲームの続きへ
  this.render();
}
```

守るべきポイント:

- **オープニング動画は必ずタイトル画面のタップ後に再生する。** ページ読み込み直後の自動再生はブラウザにブロックされ、音声も出ない。タップ起点なら音声付きで再生できる。
- ゲーム中のイベント動画も、直前にユーザー操作（選択肢タップ等）がある遷移に置くのが安全。操作なしで発火する場合でも`cutscene.ts`が「タップで再生」にフォールバックするので破綻はしない。
- スキップは常時有効（`skippable: false`は演出上どうしても必要な場合のみ）。
- 動画は16:9想定。縦画面ではレターボックス表示になる（`cutscene.css`の`object-fit: contain`）。
- `src`は`"videos/opening.mp4"`のように**先頭スラッシュなし**で書く（`base: "./"`のため）。

## 4. 登録チェックリスト（新規ゲーム時に全部やる）

1. **`GAMES_PORTAL/games.json`** にエントリ追加（`id`はkebab-case、`buildScript: "build"`、`distDir: "dist"`、`outputDir: "games/<id>"`、`image`は`games/<id>/og.png`等、`accent`、`controls`）。
2. **`.github/workflows/deploy-games-pages.yml`**:
   - `on.push.paths` に `"<NN_GAME_DIR>/**"` を追加。
   - 動画を組み込むゲームが初めての場合は `"04_GAME_ASSETS/videos/**"` も追加（動画差し替えで再デプロイさせるため）。
   - `cache-dependency-path` に `<NN_GAME_DIR>/package-lock.json` を追加。
3. **`.claude/launch.json`** にdevサーバ設定を追加（`npm run dev --prefix <NN_GAME_DIR>`、vite.config.tsと同じポート）。
4. **ルート`README.md`** の「ゲーム」一覧に1行追加。
5. `npm install` を実行して `package-lock.json` を生成・コミットする（CIは`npm ci`を使うため必須）。

## 5. IPルール（全制作物共通）

- `WORLD_BIBLE.md`の禁止事項（ブラック企業描写、いじめ、パワハラ、鬱展開、グロ描写）を厳守。Story Formula（変なことを始める→巻き込まれる→少し騒ぎになる→最後は笑顔）に沿ったトーンにする。
- 各キャラのNG変更（そば屋の白い仮面/たこさんの触手/とーくんのアロハ・帽子・ウクレレ等）は2D表現でも維持する。キャラを描くコードには、08の`avatar.ts`のようにNG変更要素をコメントで明記する。

## 6. 動作確認（完了条件）

1. `npm run build` が通る（`tsc --noEmit`含む）。
2. `.claude/launch.json`のdevサーバで起動し、以下を確認する:
   - タイトル→オープニング動画→ゲーム→イベント動画→ゲーム続き、の一連フローが動く。
   - 動画のスキップ（タップ）が効く。
   - 動画を未配置にした状態でも自動スキップでゲームが進む（動画が後日届く運用の保証）。
   - モバイル幅（375px）でレイアウトが崩れない。
3. 動画をコミットする場合はファイルサイズを再確認（1クリップ10MB目安、25MB超は要相談）。
