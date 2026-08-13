# 窓際ボクセル・退勤作戦（Flutter / Flame 3D Showcase）

正典のボクセルGLBをFlutter製モバイルゲームでも利用できるかという技術検証から発展させた、
Android / iOS向け展示品質ショーケースです。

Flameの公式な位置づけ、公開アプリの実績、Three.jsとの比較、暫定的な採用判断は
[`docs/FLAME_EVALUATION.md`](docs/FLAME_EVALUATION.md)にまとめています。

## ゲーム内容

- 左下の仮想スティックで「そば屋」を移動
- 1Fの広いオフィスでは、右下の`SMASH`で3つの荷物をコミカルに片付ける
- エレベーターへ入ると、コンポーネントを入れ替えて2Fの窓際ラウンジへ移動
- 2Fでは`DASH`でフロアを駆け回り、3つのDIYパーツを接触収集
- 窓際ゲートへ到達すると、新しい立ち飲み処がオープンしてクリア
- 10秒間操作がないと、2フロアを通してクリアまで見せるアトラクトモードを自動再生

Flutter WidgetでHUDとタッチ操作を構築し、Flame Component Systemでゲームループ、
`flame_3d`でGLB・3Dシーン・カメラ・ライトを扱っています。

## Flame駆動の構成

大規模な3Dオープンワールドではなく、Flameが得意な小さなゲームループと
コンポーネントの組み合わせで遊びを構成しています。

- `floor_definition.dart`: フロア境界、障害物、目的、開始地点、出口をデータ定義
- `ArenaScene`: 定義から床・壁・什器・ゲートを生成する交換可能な3Dコンポーネント
- `MadogiwaVoxelGame`: プレイヤーとスコアを維持したままフロアだけをmount/unmount
- 1Fは近接SMASH、2Fは接触収集と加速DASHという短いルール変更
- カメラは広いワールド内でプレイヤーを追従し、Flutter HUDは画面座標へ固定
- エレベーター、リザルト、アトラクト表示はFlutter Widgetでゲーム上へ合成

実機確認画像:

- [`docs/screenshots/flame-campaign-1f.png`](docs/screenshots/flame-campaign-1f.png)
- [`docs/screenshots/flame-campaign-2f.png`](docs/screenshots/flame-campaign-2f.png)

## 展示向けビジュアル

キャラクターGLB自体には手を加えず、次のリアルタイムエフェクトで映像を構成しています。

- `docs/concepts/concept-a-prismatic-daylight.png`を基準にした明るいパール／アクアのアトリウム
- ミントの発光グリッド、出口へ流れる誘導光、色が切り替わる立体ゲート
- 14個の立体デブリ、3Dリング、画面空間のプリズム衝撃波による破壊演出
- 移動トレイル、速度線、4色の空間ダスト、スキャンライン、昼光グロー
- 白いフロストHUD、ネイビーの情報文字、コーラルの`SMASH`アクション

実装後のiOSシミュレータ表示は
[`docs/screenshots/prismatic-daylight-ios.png`](docs/screenshots/prismatic-daylight-ios.png)で確認できます。
- スマッシュ時のカメラシェイク／FOVキック、ゲート解放時のカメラリビール
- 起動タイトル、STYLE／FLOW／タイム、S〜Bランク付きリザルトHUD
- モバイルの触覚フィードバック

画面空間エフェクトはFlutterの`CustomPainter`でゲーム画面の上に合成しています。
Widgetの再ビルドとは分離し、ゲーム更新に同期したrepaintだけを行います。
床・壁・机・ルート・ゲートなどの静的ジオメトリはマテリアル単位でバッチ化し、
画面FXは30Hz、3Dゲームループは端末の描画レートで更新します。

## セットアップ

Flutterバージョンは、モノレポルートの`.mise.toml`を正典とします。

```bash
cd ..
mise install
cd 08_FLUTTER_VOXEL_GAME
mise exec -- flutter pub get
mise exec -- flutter run
```

`flame_3d`はFlutter GPUを利用するため、次の設定をプロジェクトに含めています。

- iOS: `FLTEnableFlutterGPU`と`FLTEnableImpeller`
- Android: `io.flutter.embedding.android.EnableFlutterGPU`

## モデル資産

`assets/models`は次の正典ディレクトリへの相対symlinkです。

```text
assets/models -> ../../04_GAME_ASSETS/voxel/models
```

GLBをこのプロジェクトへコピーしたり、直接編集したりしないでください。モデル変更は
`04_GAME_ASSETS/voxel/tools/build_*_voxel_model.py`から再生成します。

ショーケースでは、GLB内の以下の共通ノードをDartから回転させ、歩行とスマッシュを
リアルタイム生成しています。

- `VoxelRig_ArmPrimary`
- `VoxelRig_ArmSecondary`
- `VoxelRig_LegLeft`
- `VoxelRig_LegRight`
- `VoxelRig_Locomotion_*`

## 検証コマンド

`ccpocket`と同様に、format・analyze・testを分けて実行します。

```bash
mise exec -- dart format --output=none --set-exit-if-changed lib test
mise exec -- dart analyze .
mise exec -- flutter test
mise exec -- flutter build apk --debug
mise exec -- flutter build ios --simulator --debug
```

テストには、移動・衝突ロジック、Flutter HUD操作、FXイベントの寿命管理、
正典`sobaya.glb`のパースと共通リグ検出が含まれます。

## 現時点の制約

`flame_3d 0.3.0`とFlutter GPUは実験的です。このプロジェクトは展示ショーケースであり、
本番ゲームへの採用前にAPI変更、端末別描画、フレーム時間、発熱、バックグラウンド復帰を
追加検証する必要があります。
