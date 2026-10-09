# Remotion — 105_sobaya_android_bungee_app の字幕付き最終結合

このランはユーザー指定で**会話字幕を焼き込む**ため、ffmpeg concatではなくRemotionで結合する。

## 構成

| ファイル | 役割 |
|---|---|
| `src/chapters.ts` | チャプター表（mp4名・フレーム数・話者・字幕文・セリフのフレーム範囲）。**直すのは基本ここだけ** |
| `src/Composition.tsx` | 各チャプターを`Sequence`で並べ、字幕カードを重ねる |
| `src/Root.tsx` | コンポジション登録（1344x768 / 24fps / 671フレーム＝27.96秒） |
| `public/` | チャプターmp4とセリフwavの置き場 |

## 字幕の仕様

- 話者名チップ（左寄せ）＋セリフ本文（中央）の2段。話者チップの色は`SPEAKER_COLORS`。
  - そば屋 `#c23fb0`（ALT DESIGNの仮面のマゼンタの星／紫の涙から）
  - やめ太郎 `#8b7fd4`（ラベンダーのシャツから）
- セリフはその章のセリフ音声が鳴る4フレーム前にフェードイン、終わりの6フレーム後にフェードアウト。
- **そば屋のセリフ末尾にトランプのスート**（ユーザー指定）: Ch1が`♠`、Ch4が`♥`。やめ太郎の行には付けない。
  黒い`♠`は暗い字幕プレートに沈むので、`SUIT_COLORS`でスートだけ別色にしている（♠=`#f2f2f2`、♥=`#ff5470`）。
- 字幕はRemotion側だけで入れる。**H3の出力自体にはテキストを一切出さない**（各Motion promptの画面内テキスト禁止句）。

## 音声

既定は`USE_EMBEDDED_AUDIO = true`＝H3がmp4に埋め込んだ音声をそのまま使う（`script.md`のStep 3）。
パイロットで音質劣化・二重発声・声変わりが聞こえた場合だけ`false`にすると、mp4をミュートして
`public/`のローカルwavを`speechIn`フレームから重ねる動作に切り替わる。

## 使い方

チャプターmp4が揃ったらラン直下の`assemble.sh`を実行する（フレーム数照合→staging→レンダリング→
コンタクトシートまで通しで行う）:

```bash
bash assemble.sh
```

単体で動かす場合:

```bash
npm install
npm run studio    # プレビュー
npm run render    # ../105_sobaya_android_bungee_app_final.mp4 を書き出す
npx tsc           # 型チェック
```

## 注意

`public/ch1.mp4`〜`ch5.mp4`は現在**ダミーの単色クリップ**（字幕レイアウト検証用に作ったもので、
フレーム数だけ本番と同じ）。本番のチャプターが届いたら`assemble.sh`が上書きする。
