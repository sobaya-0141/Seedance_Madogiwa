---
name: godot-web-publish
description: Godot 4で作った窓際族物語のゲームをブラウザ向けに書き出し、ゲームサイト（GitHub Pages の窓際族 GAME ARCADE）で公開するワークフロー。Web用書き出しテンプレートが無い端末では公式配布物を検証してから導入する。ユーザーから「Web版にして」「ブラウザで遊べるようにして」「ゲームサイトに載せて」「体験版として公開して」と頼まれたとき、Godot製ゲームのWeb版を更新・再公開するときに必ず使用する。ゲーム本体の制作・修正は godot-game スキルを使う。
---

# Godot ゲームの Web 版公開ワークフロー

Godot 製ゲームをブラウザ向けに書き出し、`GAMES_PORTAL/`（GitHub Pages のゲームサイト）に載せる。公開例は `12_SOBAYA_MUSOU_GODOT`（`games.json` の `sobaya-musou`）。

サイトの仕組み（`GAMES_PORTAL/README.md`）:
- `games.json` の各ゲームを `GAMES_PORTAL/scripts/build-pages.mjs` が組み立てて `dist-pages/` に出す。`"engine": "godot"` の項目は `godot --headless --import` → `--export-release <プリセット>` で書き出し、`extraDir`（カード画像など）を足す
- `main` に push されると `.github/workflows/deploy-games-pages.yml` が動く。Godot 本体と Web 用テンプレートを公式リリースから取得し、`SHA512-SUMS.txt` で照合してキャッシュする（版を上げるときはこのワークフローの `4.7.2-stable` とキャッシュキーも更新する）

## 1. Web 用書き出しテンプレートを入れる（無い端末のみ）

```bash
bash .claude/skills/godot-game/scripts/godot_setup.sh check
```

「Web 用テンプレート: なし」なら、**取得元とサイズをユーザーに伝えて了承を得てから**入れる。公式の `Godot_v<版>_export_templates.tpz` は全プラットフォーム分で約1.3GBあり、そのうち Web 用（スレッドなし版・各約10MB）だけを取り出す:

```bash
bash .claude/skills/godot-game/scripts/godot_setup.sh web-templates --yes
```

- 取得元は Godot 公式の GitHub Releases（検証済み組織 `godotengine`）だけ。公式 `SHA512-SUMS.txt` で照合し、アーカイブに `templates/` 以外のパスが無いことも確かめる
- テンプレートの版は、入っているエディタの版（`godot --version`）と同じものになる
- 入れ先: macOS `~/Library/Application Support/Godot/export_templates/<版>/`、Linux `~/.local/share/godot/export_templates/<版>/`

## 2. Web 版に必要な対応（ゲーム側）

`godot-game` スキルのひな形で作ったゲームは対応済み。古いゲームは次を確認する:

- [ ] **日本語フォントを同梱**: ブラウザでは端末のフォント（`SystemFont`）が使えず文字化けする。`fonts/MPLUSRounded1c-ExtraBold.ttf`（`04_GAME_ASSETS/fonts/` への相対symlink）を `load()` して、Theme・Label・Label3D（★などの記号も）に設定する
- [ ] **`export_presets.cfg` の Web プリセット**: `variant/thread_support=false`（GitHub Pages はスレッドに必要なヘッダー COOP/COEP を付けられない）。`exclude_filter="README.md"`
- [ ] **1フレームの時間に上限**: `minf(raw_delta, 1.0 / 20.0)`。タブを切り替えて戻ると長いフレームが来て、計算が破綻して画面が空だけになる
- [ ] **描画は Compatibility（WebGL2）になる**: SSAO・スクリーンスペースAA などは効かない。`--rendering-method gl_compatibility --rendering-driver opengl3` で Mac 上でも同じ描画を確認できる
- [ ] **`build/` と `web_assets/` に `.gdignore`**: 書き出し物やカード画像を Godot に取り込ませない（取り込まれると `.import` が混ざる）
- [ ] タッチ操作が無いなら、サイトのカードの `controls` に「PC（キーボード・ゲームパッド）」と書く

## 3. 書き出してローカルで確認する

```bash
mkdir -p <dir>/build/web     # 書き出し先が無いと失敗する
godot --headless --path <dir> --export-release "Web" build/web/index.html
```

- 容量の目安: エンジン（wasm）約38MB＋データ（pck）。高品質版そば屋だけで約27MB
- ローカル確認用サーバーは `.claude/launch.json` に足して `preview_start` で起動する（例: `"runtimeExecutable": "python3", "runtimeArgs": ["-m", "http.server", "5195", "--directory", "<dir>/build/web"]`）
- アプリ内ブラウザ（Browser pane）が**非表示のときはブラウザが描画を毎秒数回に間引く**ので、ゲームが極端に遅く見える。`tabs_context` で「hidden」なら性能の判断はせず、タイトル画面・日本語表示・コンソールエラーだけ確認し、プレイ感はユーザーに自分のブラウザ（`http://localhost:<port>`）で確かめてもらう

## 4. ゲームサイトに載せる

1. **カード画像**: 自動プレイの撮影（godot-game スキル）から見栄えのよい場面を選び、`<dir>/web_assets/og.png`（1200×630）にする。敵や演出がたくさん映っている場面がよい
   ```bash
   ffmpeg -i <scratchpad>/run_900.png -vf "crop=1600:840:0:30,scale=1200:630" <dir>/web_assets/og.png
   ```
2. **`GAMES_PORTAL/games.json` に追加**（id は小文字英数とハイフン）:
   ```json
   {
     "id": "foo-game",
     "title": "タイトル",
     "subtitle": "サブタイトル（体験版なら「（体験版）」を付ける）",
     "description": "カードの説明文",
     "engine": "godot",
     "sourceDir": "13_FOO_GODOT",
     "exportPreset": "Web",
     "distDir": "build/web",
     "extraDir": "web_assets",
     "outputDir": "games/foo-game",
     "image": "games/foo-game/og.png",
     "accent": "orange",
     "controls": "PC（キーボード・ゲームパッド）"
   }
   ```
3. **ワークフローの `paths` にゲームのフォルダを足す**（`.github/workflows/deploy-games-pages.yml`。変更で再公開されるように）。共用素材 `04_GAME_ASSETS/models3d/**`・`04_GAME_ASSETS/fonts/**` は登録済み
4. **手元でサイト全体を組み立てる**: `node GAMES_PORTAL/scripts/build-pages.mjs` が成功し、`dist-pages/games/<id>/` に `index.html`・`index.wasm`・`index.pck`・`og.png` が出ることを確認する（`dist-pages/` は git 管理外）
5. **体験版として出す場合**は、カードのサブタイトルとゲームのタイトル画面に「体験版」と入れ、ゲームの README に体験版の範囲（音なし・難易度未調整など）を書く

## 5. PR を出して公開する

公開（main へのマージ）は外部に出る操作なので、**ユーザーの明示的な指示があるときだけ**進める。

1. `main` から作業ブランチ（`claude/<内容>`）を切る
2. **公開に必要なファイルだけをステージする**。`CLAUDE.md` やルート `README.md` にユーザーの作業中の変更が混ざっているときは、`git add` せず、HEAD の内容に自分の行だけを足したものを `git hash-object -w --stdin` と `git update-index --cacheinfo` でステージする。`git diff --cached` で余計な差分が無いことを確かめる
3. コミット（末尾に Co-Authored-By）→ `git push -u origin <branch>` → `gh pr create`。PR 本文には、確認したこと（自動プレイ・Compatibility 描画・サイトの組み立て）と未確認のこと（GitHub Actions 上の書き出し、人のプレイでの確認）を分けて書く
4. `ccd_pr` の `get_status` で PR を確認し、無ければ `bind_pr` で紐づける
5. **マージはユーザーが行う**（auto mode ではレビュー無しのマージは止められる）。マージ後、GitHub Actions の「Deploy games to GitHub Pages」が動き、初回は Godot とテンプレート（約1.3GB）の取得で数分かかる。公開URLは `https://sobaya-0141.github.io/Seedance_Madogiwa/games/<id>/`
