# 窓際族 GAME ARCADE

GitHub Pagesで公開するゲーム選択ポータルです。

## ゲームを追加する

1. ゲーム側の `package.json` に静的ビルド用スクリプトを用意する。
2. `games.json` の `games` 配列へタイトル、説明、ソースディレクトリ、ビルドスクリプト、出力先を追加する。
3. `node GAMES_PORTAL/scripts/build-pages.mjs` を実行し、`dist-pages/` を確認する。
4. `main` へpushするとGitHub Actionsが自動でPagesへ公開する。

カード表示とCIのビルド対象は同じ `games.json` を参照するため、一覧と公開対象がずれません。
