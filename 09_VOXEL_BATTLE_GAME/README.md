# 窓際族バトル 〜立ち飲み処の決闘〜

窓際族物語のキャラクターを選んで、**離れた場所にいる相手とオンラインで1対1のターン制コマンドバトル**を楽しむ対戦ゲーム。GitHub Pages（静的配信）＋ Firebase Realtime Database（対戦同期）で動作する。

- **技術**: Vite + TypeScript + Three.js（既存ゲームと同じ構成）
- **モデル**: `04_GAME_ASSETS/voxel/models/*.glb` を `public/models/` から相対symlinkで参照（リポジトリ規約に準拠）
- **通信**: `src/transport.ts` の `Transport` インターフェース越しに、
  - **ローカル対戦**（`BroadcastChannel` + `localStorage`）… 同じPCの2タブで動作。外部サービス不要。開発・動作確認用。
  - **オンライン対戦**（Firebase Realtime Database）… 別々の端末で対戦。
- **同期モデル**: ホスト権威（host-authoritative）。部屋を立てた側だけがダメージ計算などの判定を行い、正となる状態を書き込む。ゲストは行動（コマンド）だけを送る。これで両画面が完全に一致し、チートも無効化される。

## ローカルで動かす

```bash
cd 09_VOXEL_BATTLE_GAME
npm install
npm run dev        # http://localhost:5185
```

動作確認は **同じブラウザで2つのタブ**を開き、片方で「部屋を作る」→表示された部屋コードを、もう片方の「部屋コード」に入力して「参加する」。対戦モードは「ローカル対戦」を選ぶ（Firebase未設定でも遊べる）。

ビルド:

```bash
npm run build      # tsc --noEmit && vite build → dist/
```

## オンライン対戦のセットアップ（Firebase）

オンライン対戦には Firebase プロジェクトが必要です。アカウント作成・コンソール操作は開発者自身で行ってください（数分で完了します）。

1. [Firebase コンソール](https://console.firebase.google.com/) で **プロジェクトを作成**。
2. 左メニュー **構築 → Realtime Database** を開き、**データベースを作成**。ロケーションを選び、最初は「ロックモード」で作成してよい（ルールは次の手順で貼り替える）。
3. **セキュリティルール** タブを開き、`firebase.rules.json` の内容を貼り付けて公開する（下記参照）。
4. プロジェクト設定（⚙️）→ **マイアプリ → ウェブアプリを追加**（`</>`）。表示される `firebaseConfig` をコピー。
5. `src/firebase.ts` の `firebaseConfig` を、コピーした値で置き換える。`databaseURL` が含まれていることを確認（例: `https://<project>-default-rtdb.firebaseio.com`）。
6. 再ビルド／再起動すると、ロビーで「オンライン対戦」が選べるようになる。

> **`apiKey` はコミットして大丈夫です。** Firebase Web の `apiKey` 等はプロジェクトを識別する**公開前提の値**で、秘密情報ではありません。アクセス制御は下記のセキュリティルールで行います。

### セキュリティルール（`firebase.rules.json`）

このゲームはログイン不要（匿名）で、部屋コードを知っている者同士が対戦する方式です。以下は「部屋コードを知っていれば読み書きできる」最小ルールです。友人同士のカジュアル対戦を想定しています。

```json
{
  "rules": {
    "rooms": {
      "$code": {
        ".read": true,
        ".write": true,
        ".validate": "$code.length <= 8"
      }
    }
  }
}
```

- より厳密にしたい場合は Firebase の **匿名認証（Anonymous Auth）** を有効にし、`".write": "auth != null"` などに変更する（クライアント側の認証処理の追加が必要）。
- Realtime Database に自動削除（TTL）はないため、古い部屋データは `rooms` に残り続けます。気になる場合はコンソールから手動削除するか、定期削除の仕組みを別途用意してください。

## キャラクター / バランス設計

8体それぞれに、設定ファイル `02_CHARACTERS/*.md` の性格に合わせたステータス（HP/MP/こうげき/ぼうぎょ/すばやさ）と固有スキルを設定しています（`src/characters.ts`）。数値・スキル効果はすべてこのファイルのテーブルを編集するだけで調整できます。

- 行動順は「すばやさ」で先攻が決まり、以降は交互。
- コマンド: こうげき / スキル（固有・MP消費）/ ぼうぎょ（被ダメ半減＋MP微回復）/ どうぐ（栄養ドリンクで回復、各2個）。
- スキル効果のプリミティブ: ダメージ（多段対応）/ 回復 / 自己バフ / 相手デバフ / MP吸収。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `src/characters.ts` | 8体のステータス・スキル定義（three.js非依存の純データ） |
| `src/battle.ts` | ターン解決エンジン（純粋関数・ホストのみ実行） |
| `src/transport.ts` | 通信抽象（Local / Firebase の2実装） |
| `src/firebase.ts` | Firebase 設定（ここに貼り付け） |
| `src/net.ts` | 部屋管理・ホスト権威ロジック・画面状態の導出 |
| `src/scene.ts` | Three.js バトルアリーナ（左=自分 / 右=相手） |
| `src/ui.ts` | 全画面のDOM UI（ロビー / 選択 / バトルHUD / 結果） |
| `src/main.ts` | 各層の配線 |
