# MADOGIWA GRID

窓際族物語の8キャラクターで遊ぶ、3×5マスの1対1陣取りカードゲーム。
FlutterでアプリUI、Flameで盤面・カード操作・リアルタイム演出、純Dartで
ルールとAIを実装している。

## 遊び方

1. 自分色の空きマスへ、手札から1枚配置する
2. カードに定義された方向パターンへ自分の陣地が広がる
3. 3行それぞれのパワー合計を比較する
4. 2行以上を取ったプレイヤーが勝利する

配置済みカードは除去されない。マナや配置コストはなく、陣地の広げ方、
各行への戦力配分、8枚を切る順番に判断を集中させている。

## 8枚の固定デッキ

- そば屋: 高パワー。「快適です！」で隣接配置時に強化
- たこさん: 低パワーだが、触手で8方向へ展開
- とーくん: ウクレレBGMで隣接する味方を強化
- よーたん: 敵陣地を1マス復旧
- 福ちゃん: 味方2枚以上に隣接するとギュンギュン強化
- 無職やめたろう: 相手が隣へ来ると、遠い味方陣地へ逃走
- 窓際王おかやまん: 同じ行の相手陣地をレギュレーションで中立化
- ゆめみん: 隣接する最強の相手カードをBONKし、能力を停止

キャラクター画像は`02_CHARACTERS/`を正典とし、`assets/characters/`の
相対symlinkから参照する。ゲーム側へ画像をコピーしない。

## 構成

```text
lib/rules/       Flutter非依存の状態・ルール・イベント・AI
lib/game/        GameControllerとFlameゲーム／コンポーネント
lib/ui/          タイトル、HUD、リザルト
lib/harness/     決定論的なデバッグシナリオ
test/helpers/    操作と検証を時系列で書くテストDSL
bin/simulate.dart AI同士の大量対戦
```

ルール処理は`GameMove -> TurnOutcome(state, events)`の決定論的な形にしている。
Flame側は`CardPlayedEvent`、`CellClaimedEvent`、`CardEscapedEvent`、
`CardBonkedEvent`などを受けて演出するだけで、ルール状態を直接変更しない。

## アニメーション・カード表現

- そば屋の「Modern Izakaya Heritage」案を共通骨格にした紺×金のカードフレーム
- キャラクター定義から差し替わる写真、差し色、朱印パワー、能力紋、配置パターン
- 手札は肩書き・能力・台詞まで見せ、盤面は名前とパワーへ絞る2段階レンダリング
- 手札枚数に応じて扇形座標を再計算し、現在位置から新しい位置へ再ターゲット
- 選択カードを扇の最前面へ浮上させるインスペクション表示
- タップ選択とドラッグ＆ドロップの両方に対応
- 配置時の吸着、陣地パルス、パワー表示、逃走移動、BONK表示
- ドラッグ／ホバー中の配置先・獲得陣地・敵陣奪取・能力対象プレビュー
- 8キャラクターそれぞれの短い召喚シグネチャー演出
- 相手優勢の行を追い越した瞬間のROW逆転演出
- GLSLフラグメントシェーダーによる虹色フォイル
- マウス／タッチ中のカード浮上と傾き
- 375px幅からデスクトップ幅までのレスポンシブ盤面

カードの共通テーマは`lib/game/card_visual/heritage_card_theme.dart`、描画は
`lib/game/card_visual/izakaya_card_renderer.dart`へ分離している。新キャラクターは
`CardDefinition`へ画像・差し色・能力・配置パターンを追加すれば同じ意匠を再利用できる。
デザイン参照画像は`design/card_concepts/sobaya/`に保存している。

## シナリオハーネス

[`ccpocket`](https://github.com/K9i-0/ccpocket)のデバッグ用Mock Previewと
テストDSLを参考に、外部サービスなしで特定状態を再現できるハーネスを用意した。

デバッグビルドのタイトルから`HARNESS`を開くか、Web版でクエリを指定する。

```text
?harness=1        シナリオ一覧
?harness=opening  通常の初期手札
?harness=gallery  全8カード
?harness=escape   やめたろう逃走直前
?harness=bonk     ゆめみんBONK直前
?harness=score    得点が競った終盤
?harness=reversal 行の逆転演出直前
```

`test/helpers/game_test_dsl.dart`では、`play → expectCard → expectEvent`のように
操作と期待結果を一つの時系列として記述できる。

## Marionette MCP

`ccpocket`と同様に、ネイティブのデバッグビルドでは
`MarionetteBinding`を有効化している。モノレポルートの`.mcp.json`と
`.codex/config.toml`にはMarionette MCPとDart MCPを登録済み。

```bash
dart pub global activate marionette_mcp
flutter run -d <simulator-id>
```

起動ログのVM Service URIへMarionetteの`connect`で接続すると、
`get_interactive_elements`、`tap`、`take_screenshots`などを利用できる。
Flameキャンバス内は通常のWidgetツリーから見えないため、次のカスタム拡張を用意した。

- `madogiwa.openScenario`: `opening`などの決定論的シナリオを直接開く
- `madogiwa.inspectGame`: ルール上の手札とFlameカードの座標・サイズを取得
- `madogiwa.restartMatch`: 現在のシナリオを初期状態へ戻す
- `madogiwa.openTitle`: タイトルへ戻る

主要なFlutterボタンには`start_normal`、`start_hard`、`open_harness`、
`game_back`、`game_rules`、`game_pass`の`ValueKey`を付与している。

## 起動

Flutterバージョンはモノレポルートの`.mise.toml`を正典とする。

```bash
mise install
cd 14_MADOGIWA_CARD_GAME
mise exec -- flutter pub get
mise exec -- flutter run
```

Web開発サーバ:

```bash
npm run dev
```

## 検証

```bash
mise exec -- dart format --output=none --set-exit-if-changed lib test bin
mise exec -- dart analyze .
mise exec -- flutter test
mise exec -- dart run bin/simulate.dart 1000
mise exec -- flutter build web --release
```

初期バランスの1000試合では先攻44.8%、後攻53.4%、引き分け1.8%。
カード数値は今後の自動対戦と人間のプレイテスト結果を見て調整する。

## 現在のスコープ

AI対戦、全8カード、主要演出、検証ハーネスまで実装済み。
Cloudflare Durable Objectsを使うオンライン1対1は次段階とし、現時点では未実装。
