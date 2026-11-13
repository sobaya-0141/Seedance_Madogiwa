# そば屋無双 2D 〜ビール工場強奪作戦〜（KorGE 版）

3Dアクション「そば屋無双」（`12_SOBAYA_MUSOU_GODOT`）を、KorGE（Kotlin製の2Dゲームエンジン）で横スクロールのベルトアクションに作り直したものです。ビールが足りないそば屋が、押し寄せる警備員や警察官をビールジョッキでなぎ倒しながら3つのステージを進みます。

攻撃はドタバタ表現です。殴られた敵は吹っ飛んで目を回し（頭の上に★）、床に沈んで退場します（流血・死亡表現はしない）。

| ステージ | 舞台 | エリア | ゴール |
|---|---|---|---|
| 1 | ゴールデン麦酒 第一工場 | 正門ヤード → 倉庫 → 製造ライン | できたてビールのタンクで F 長押し |
| 2 | 麻布十番駅 → あくしでんちゅあ本社ビル | 駅前 → 商店街 → 本社ビル前 | 本社ビルの入口で F 長押し |
| 3 | あくしでんちゅあ本社ビル | ロビー → オフィスフロア → 窓際エリア | 窓際の立ち飲み処で F 長押し（開店） |

どのエリアも、決まった人数を倒し、途中で出てくる隊長格も倒すとゲートが開きます。最後のエリアのボスは地響き（衝撃波）を使い、体力が半分を切ると怒って速くなり、地響きを2連発します。

## 遊び方

| 操作 | キー |
|---|---|
| 移動（左右・奥行き） | WASD / 矢印キー |
| 通常攻撃（4段コンボ。4段目は周りを吹っ飛ばす） | J / Z |
| チャージ攻撃（周りを大きく吹っ飛ばす） | K / X |
| 無双乱舞（無双ゲージ満タンで3.2秒間、無敵で周りをなぎ倒す） | L / C |
| 回避（無敵時間あり） | Space |
| ゴールで長押し | F |
| ステージ選択（タイトル） | ← → |
| スタート / 次のステージへ | Enter |
| 一時停止 | P |
| やり直し / タイトルへ | R / Esc |

ゲームパッド（3D版と同じ割り当て）: 左スティック / 十字キーで移動、□（X）通常攻撃、△（Y）チャージ、○（B）無双乱舞、×（A）回避、R1 / R2 長押しでゴール、START で決定・一時停止、SELECT でやり直し。

- 敵は同時に3人までしか殴りかかってこない（残りは周りを囲んで順番を待つ）
- 隊長格（警備隊長・巡査部長・警部など）は、4段目・チャージ・無双乱舞でしかひるまない
- 倒した敵がときどき落とす缶ビールで無双ゲージ、枝豆で体力が回復する

## 起動

Gradle 8.8 は JDK 17〜22 で動きます（JDK 25 では動きません）。JDK 21 を `JAVA_HOME` に指定して起動してください。

```bash
cd 17_SOBAYA_MUSOU_2D_KORGE
JAVA_HOME=/path/to/jdk-21 ./gradlew runJvm
```

## 各環境向けの書き出し

Gradle 8.8 を動かすため、どれも JDK 21 を `JAVA_HOME` に指定する。

| 環境 | コマンド | 出力 | 確認状況（2026-11-12） |
| --- | --- | --- | --- |
| PC | `./gradlew runJvm` | ウィンドウで起動 | 動作確認済み |
| Web | `./gradlew jsBrowserDistribution --no-configuration-cache` | `build/dist/js/productionExecutable/`（約10MB） | ブラウザ・スマホ幅で動作確認済み。ゲームサイトへは `GAMES_PORTAL/games.json` の `"engine": "korge"` で載せる |
| Android | `./gradlew assembleDebug` | `build/outputs/apk/debug/sobaya-musou2d-debug.apk` | エミュレーター（API 37）で起動・タッチ操作を確認済み |
| iOS | `./gradlew packageIosSimulatorDebug --no-configuration-cache` | `build/platforms/ios/app.xcodeproj/build/Build/Products/Debug-iphonesimulator/そば屋無双2D.app` | シミュレーター（iPhone 18 Pro・iOS 27）で横画面での起動を確認済み。タッチ操作はシミュレーターでは未確認 |

- Android: 署名用の鍵 `build/korge.keystore` が要る（開発用は `keytool -genkeypair -keystore build/korge.keystore -storepass password -keypass password -alias korge -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Madogiwa Dev"`）。ストア公開用の鍵は別に用意して `RELEASE_STORE_FILE` などのプロパティで渡す。画面は横向きに固定（`build.gradle.kts` の `orientation`）
- iOS:
    - KorGE は iOS 用の Xcode プロジェクトを XcodeGen（[yonaskolb/XcodeGen](https://github.com/yonaskolb/XcodeGen)、MIT のオープンソース）で作る。KorGE が取得する 2.42.0 は Xcode 27 でビルドできないので、`~/.korge/XcodeGen-2.42.0` で 2.46.0 をビルドしてある（`git checkout 2.46.0 && env PATH=/usr/bin:/bin:/usr/sbin:/sbin make build`）
    - swiftly で入れた Swift が PATH の先にあると、Xcode と版が合わずビルドに失敗する。Gradle を実行するときは PATH から `~/.swiftly/bin` を外す
    - KorGE 6.0.0 が生成する `main.m` と `Info.plist` は UIScene に対応しておらず、iOS 27 では起動直後に止められる。`build.gradle.kts` で、UIScene 対応・横向き固定にした `ios_template/` の版に差し替えている
    - 実機向けは `packageIosDeviceDebug`。Apple Developer のチーム（`korge { iosDevelopmentTeam = "..." }`）と署名が必要
- 画像は WebP（`04_GAME_ASSETS/musou2d/sprites/*.webp`）で入れている。PNG の数分の1で、PC・Web・Android で読めることを確認済み
- スマホでは画面に触れるとタッチ操作が出る（左半分＝その場に出るスティック、右下＝攻撃・チャージ・回避・無双、ゴール付近で「ゴール」ボタン、右上＝一時停止）。`src/TouchControls.kt`

## 動作確認（自動プレイ）

ボットが全3ステージを通しで遊び、要所のスクリーンショットを書き出して終了します。体力が減ると自動で回復するので、必ず最後まで進みます。`KORGE_HEADLESS=true` を付けるとウィンドウを開かずに描画し、`MADOGIWA_AUTO_SPEED`（既定4）倍速で進みます。

```bash
KORGE_HEADLESS=true MADOGIWA_AUTO=1 MADOGIWA_SHOTS=/tmp/musou2d ./gradlew runJvm
```

`AUTO: stage N clear ...` が3つ出て、最後に `ending.png` が書き出されれば、全ステージを通してクリアできています。

- `MADOGIWA_NO_HEAL=1`: 自動回復を切る（難易度の確認用）。2026-11-12 時点で、ボットはステージ1・2を毎回、ステージ3を4回中3回クリアする
- `MADOGIWA_START_STAGE=3`: 指定したステージから始める
- `MADOGIWA_RECORD=<ディレクトリ>` と `MADOGIWA_RECORD_SECONDS=20`: ステージ1を1/30秒ずつ進めて全コマを書き出す（`ffmpeg -framerate 30 -i <ディレクトリ>/frame_%04d.png ...` で動画にする）

## 手描きのコマを足すとき

1. コマ（マゼンタ背景・1280×1280）を `art_prompts/generated_enemies/<名前>/` に置く（git には入れない）。プロンプトは `art_prompts/`
2. 基準コマ `idle_01.png` の足元を測り、`04_GAME_ASSETS/musou2d/<名前>_anims.txt` の `pivot` に書く
3. リポジトリのルートで `sh 04_GAME_ASSETS/musou2d/tools/pack_all.sh` を実行する。コマが全部そろったキャラだけアトラス（`04_GAME_ASSETS/musou2d/sprites/`）が作られ、ゲームは起動時に自動でそれを使う（無いキャラは採用3Dモデルを描いた絵のまま）

## 素材

- キャラクターは、採用3Dモデル（`04_GAME_ASSETS/models3d/`）のアニメーションを横向きに描いたスプライトシート `04_GAME_ASSETS/models3d/sprites/sheets/` を `resources/sheets` から相対symlinkで参照しています（コピーしません）。作り直しは `04_GAME_ASSETS/models3d/README.md` を参照
  - そば屋: `sobaya.glb`＋ジョッキ（NG変更要素。右手の `PropSocket.R` に持たせて描いている）。コンボは `Hybrid_MugPunch` / `Hybrid_MugHook` / `Hybrid_MugSmash`、チャージは `MugAttack`、回避は `Procedural_RollForward`
  - 敵（手描きのアトラスが無いときの代わり）: CC0 のマネキン素体に、3D版と同じ方法で制服の色・帽子・警棒を付けて描いている
  - シートは右向きだけで、左向きは左右反転して表示する
- そば屋と敵5種（警備員・警備隊長・警察官・巡査部長・警部）はすべて手描きアニメ（`04_GAME_ASSETS/musou2d/`。デザイン画と照合チェックリストは `designs/`）。警部は登場時に intro の01〜06、体力が半分を切って怒った瞬間に07〜08（顔が真っ赤）を使う。照合に通らないコマがあるキャラは、`generated_enemies/<名前>/HOLD.txt` を置くと pack_all.sh がアトラスを作らない（ゲームは下の採用3Dモデルの絵を使う）
- 背景はエリアごとの手描きの1枚絵（全9枚。`04_GAME_ASSETS/musou2d/backgrounds/`、プロンプトは `art_prompts/background_prompts.md`）。画面が次のエリアへ進むと0.6秒で切り替え、エリアの中ではカメラに合わせて少しだけ横にずらして奥行きを出す。各ステージ最後のエリアは絵の右端にゴール（ビールのタンク・本社ビルの入口・立ち飲み処）が描いてある。エリアの境目のゲートもステージごとの手描き（`gates_anims.txt`、プロンプトは `art_prompts/gate_prompts.md`）で、開くと上に引き上げながら消える
- 当たりの光・衝撃波（警部の地響きは赤、無双は金）・無双のオーラ・ビールの泡・土ぼこり・擬音（ドカッ！／バシッ／ゴゴゴ）・アイテム（缶ビール・枝豆）は手描き素材（`04_GAME_ASSETS/musou2d/fx_light_anims.txt`・`fx_art_anims.txt`、プロンプトは `art_prompts/effect_prompts.md`、表示は `src/FxSprites.kt`）。光の素材は黒背景で描き、加算合成で重ねる。素材が無いときは `src/Particles.kt` の図形で描く。攻撃が当たった瞬間は一瞬だけ時間を止めて（ヒットストップ）重さを出す
- フォントは `04_GAME_ASSETS/fonts/MPLUSRounded1c-ExtraBold.ttf`（OFL）を `resources/fonts/` から symlink で参照しています

## 構成

- `src/Data.kt`: 数値の正本（敵の種類・ステージとエリア・コンボとチャージ）。3D版の `ENEMY_TYPES` / `ZONES` / `COMBO` / `CHARGE` を2Dに置き換えたもの。距離はメートルで書き、`M`（105px/m）で換算する
- `src/Battle.kt`: ゲームのルールと状態（そば屋の技、敵の動き・攻撃の順番待ち、エリアの進行、ゴール）。描画とは切り離してあり、自動プレイのボットもここにある
- `src/Sheet.kt`: スプライトシートの読み込みとコマの選択
- `src/main.kt`: 描画・入力・HUD・背景・演出・自動プレイと撮影

## 3D版との違い

- カメラの回転と奥行きの移動範囲は無く、横スクロールの床の帯の上で戦う
- エリアごとの人数は3D版より少なめ（2Dの画面に収まるテンポにしている）
- 効果音・BGMなし、タッチ操作は未対応
