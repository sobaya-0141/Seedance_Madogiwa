# Flame採用評価

- 調査日: 2026-07-22
- 対象: `08_FLUTTER_VOXEL_GAME`
- ステータス: 技術スパイク。製品版のエンジン選定は未決定

## 結論

現時点では、既存のThree.js実装をFlameへ置き換えるだけの決定的な理由は見つかっていない。

Flameの強みは高度な3D表現ではなく、Flutterアプリの中に2D／2.5Dのゲームループを組み込み、
FlutterのUI、永続化、課金、認証、通知、テスト資産と一体化できることにある。
一方、このプロジェクトが重視する正典ボクセルGLBの直接利用、3D空間、Webでの配信については、
Three.jsのほうが成熟しており、すでにプロジェクト内で運用実績もある。

したがって、Flutter／Flame版は次を確認するための技術スパイクとして保持する。

- Flutterエンジニアがモバイルゲームを一つのDartコードベースで開発できるか
- 正典ボクセルGLBをFlutter製ゲームでも再利用できるか
- Flutter Widgetとゲームループを組み合わせたときの開発体験
- App Store／Google Play固有機能を含むモバイル展開の可能性

## 公式な位置づけ

Flutter公式はFlameを「2D Flutter Game Engine」と位置づけ、ゲームループ、衝突判定、マップを
必要とするゲーム向けとして紹介している。公式テンプレートもカードゲームではなく、Flameを使う
ものはエンドレスランナーであり、障害物、カメラ、パララックス、スポーンを中心に構成されている。

- Flutter Casual Games Toolkit: <https://flutter.dev/games>
- Flame公式サイト: <https://flame-engine.org/>
- Flameパッケージ: <https://pub.dev/packages/flame>

Flame本体が提供する主な機能は次のとおり。

- ゲームループ
- Flame Component System
- スプライトとスプライトアニメーション
- 入力とジェスチャー
- 衝突判定
- パーティクル、エフェクト、パララックス
- カメラと画面より大きいWorld
- Flutter WidgetによるHUD、ダイアログ、設定画面の合成

関連ドキュメント:

- GameWidgetとFlutterオーバーレイ: <https://docs.flame-engine.org/latest/flame/game_widget.html>
- CameraとWorld: <https://docs.flame-engine.org/latest/flame/camera.html>
- WorldRouteによるレベル切替: <https://docs.flame-engine.org/latest/flame/router.html>
- Tiledマップ: <https://docs.flame-engine.org/latest/bridge_packages/flame_tiled/flame_tiled.html>
- 衝突判定とQuadTree: <https://docs.flame-engine.org/latest/flame/collision_detection.html>

## 公開アプリから見える得意領域

Flame公式の`awesome-flame`では、App Releasesへの掲載条件を「Flame製かつGoogle Playまたは
App Storeで公開済み」としている。2026-07-22時点のREADMEを集計すると、14ジャンル・47本が
掲載され、Casual 15本とPuzzle 8本で約49%を占める。

- 公開アプリ一覧: <https://github.com/flame-engine/awesome-flame>
- 掲載条件: <https://github.com/flame-engine/awesome-flame/blob/main/CONTRIBUTING.md>

代表例:

| アプリ | 確認できた表現・規模 | Flameとの適合点 |
| --- | --- | --- |
| Brick Mania | Google Play 1,000万DL超、2,080ステージ、ユーザー投稿ステージ | 固定画面の2D物理、短い反復、コンテンツ量産、広告・IAP |
| Idle Horizons | オートバトル、編成、スキルツリー、装備、PvP、レイド | Flutter UIが厚い運用型ゲーム |
| WalkScape | 歩数連動RPG、クエスト、マーケット、ランキング | センサー、バックエンド、アプリUIとの融合 |
| I/O Pinball | Forge2D、スプライト、Firebaseランキング | 2D物理と擬似3D表現 |
| Super Dash | 2人・6週間でWeb／iOS／Android向けに制作 | Tiled、カメラ、衝突、横スクロール |
| Tomb Toad | 重力回転パズル、100以上のレベル、レベルエディタ | 一つの操作を物理とレベル設計で展開 |
| Antimine | 10万DL超、テーマ、統計、保存、実績、ランキング | Flutter UI主体のパズル |
| Omnichess | 10万DL超、AI／オンライン、複数形状の盤面 | ボードゲームと低頻度同期 |
| The Darkblade | Steam配信の2DアクションRPG | 2D探索、戦闘、装備、スキル |

参照:

- Brick Mania: <https://play.google.com/store/apps/details?id=net.countrymania.brick>
- Idle Horizons: <https://apps.apple.com/us/app/idle-horizons-dawn-of-heroes/id6737143829>
- WalkScape: <https://walkscape.app/>
- I/O Pinball技術解説: <https://blog.flutter.dev/i-o-pinball-powered-by-flutter-and-firebase-d22423f3f5d>
- Super Dash技術解説: <https://medium.com/@vgv_team/how-we-built-the-new-super-dash-demo-in-flutter-and-flame-in-just-six-weeks-9c7aa2a5ad31>
- Tomb Toad: <https://play.google.com/store/apps/details?id=com.crescentmoongames.tombtoad>
- Antimine: <https://github.com/lucasnlm/antimine-flutter>
- Omnichess: <https://play.google.com/store/apps/details?id=club.omnichess>
- The Darkblade: <https://store.steampowered.com/app/3731570/The_Darkblade/>

この実績から、Flameは次の表現に適していると判断する。

- 固定画面の2D物理ゲーム
- 見下ろしシューター、Survivors系、弾幕
- 横スクロール、ランナー、2DアクションRPG
- タイルマップ、見下ろし、アイソメトリック
- パズル、ボード、カード、ストラテジー
- Flutter UIが厚いアイドル、育成、教育、フィットネスゲーム
- 2D素材の重なり、縮尺、アイソメトリックを使う2.5D
- 複数の小さなWorldを切り替えるステージ／フロア制ゲーム

## flame_3dの評価

`flame_3d 0.3.0`はFlutter GPUを利用してGLB、3Dシーン、カメラ、ライトを扱えるため、
正典ボクセルモデルを直接再利用できることはこの試作で確認できた。

ただし、公式は次の制約を明記している。

- Flutter GPU依存で実験段階
- API破壊の可能性があり、SemVerを保証しない
- ドキュメントとテストが不足する可能性がある
- 本番環境で使用しないよう案内している
- 正式な対象はAndroid、iOS、macOSで、Webはさらに実験的

公式情報: <https://pub.dev/packages/flame_3d>

今回確認した公式ショーケースと公開アプリには、`flame_3d`を使用した大規模商用成功例は
見つからなかった。したがって、現在の3D試作が動くことと、製品版で安全に採用できることは
分けて判断する必要がある。

## Three.jsとの比較

| 観点 | Flame / Flutter | Three.js |
| --- | --- | --- |
| 成熟した用途 | 2D／2.5Dモバイルゲーム、アプリとの融合 | Web 3D、GLB、シェーダー、ブラウザ配信 |
| ボクセルGLB | `flame_3d`で利用可能だが実験的 | 既存実装と運用実績がある |
| モバイルUI | Flutter Widgetをそのまま利用できる | HTML/CSSまたは独自UIとの統合 |
| App Store機能 | Flutterプラグイン群と自然に統合 | ネイティブラッパーとブリッジが必要 |
| Web配信 | Flame 2Dは対応、`flame_3d`は実験的 | 得意領域 |
| 3D制作環境 | エディタ、物理、LOD、ナビゲーションが未成熟 | Web 3D向けの選択肢と事例が豊富 |
| テスト | Widget、unit、goldenをDartで統合しやすい | Webテストとゲームロジックを別途設計 |
| 現在の移行コスト | 新規レンダラーと端末検証が必要 | 既存資産を継続利用できる |

Flameを選ぶ理由になり得る条件:

- 製品の中心がネイティブモバイルである
- ゲーム外の画面、育成、図鑑、会話、設定、ショップが多い
- 通知、IAP、広告、認証、センサーなどFlutterのプラグインを多用する
- チームのFlutter経験をそのまま生産性へ変えたい
- 3D表現を限定し、2D／2.5Dのゲームループを中心にできる

Three.jsを継続する理由:

- ボクセルGLBと3D空間そのものが製品価値の中心である
- Web配信を主要チャネルにする
- シェーダー、ポストプロセス、3D描画の自由度を重視する
- 既存Three.jsゲームと共通の実装・知見を再利用したい
- 実験的な3D APIを本番依存にしたくない

## このプロジェクトでの暫定方針

1. `08_FLUTTER_VOXEL_GAME`はFlutter／Flame／Flame 3Dの技術スパイクとして維持する。
2. 「Flutterエンジニアだから」という理由だけではThree.jsから移行しない。
3. 製品版エンジンは、ゲームの主要配信先とコアループを決めてから再評価する。
4. Flameを継続する場合は、一つの巨大3Dマップではなく、フロア単位のWorld、短い目的、
   収集、SMASH、DASH、スコア、育成UIという構成に寄せる。
5. `flame_3d`を本番候補にする場合は、レンダラーをゲームロジックから分離し、正典GLBから
   8方向スプライトを生成する2.5Dフォールバックも比較対象にする。

## 再評価の条件

次の情報が揃った時点で、Three.js、Flame 2D、Flame 3Dを再比較する。

- Webとネイティブモバイルのどちらを主要配信先にするか
- ゲーム外UIと継続運用機能の比率
- 同時表示キャラクター、動的オブジェクト、マップ規模の上限
- 必要な3D表現、ライト、影、ポストプロセス
- 対象端末でのフレーム時間、メモリ、発熱、復帰安定性
- `flame_3d`の本番利用に関する公式ステータスと商用事例
