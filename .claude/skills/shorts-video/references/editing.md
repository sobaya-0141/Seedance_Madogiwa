# 編集テンプレート

Node.js・npm・FFmpeg/ffprobe・Python 3が必要。既存採用Remotion 4.0.529、React 19.2.3をlockfile込みで固定。追加の画像生成や有料動画生成は不要。

## 初期化・編集・レンダー

```sh
# リポジトリルート。パスは対象作品に合わせる。
python3 .claude/skills/shorts-video/scripts/init_project.py \
  --project 03_SCRIPTS/my_episode/shorts \
  --video 03_SCRIPTS/my_episode/final_clean.mp4 \
  --audio 03_SCRIPTS/my_episode/final_adopted.mp4 \
  --title 'タイトル' --subtitle '小見出し'
cd 03_SCRIPTS/my_episode/shorts
npm ci
# shorts-manifest.jsonへ実発話に合うcaptionsと必要なcreditTextを記入
npm run typecheck
node render.mjs --manifest shorts-manifest.json --output ../final_remotion_shorts_9x16.mp4
```

`--audio`省略時は`--video`の音声を採用。無音映像は、音声付き完成版を別途指定する。完全無音作品の場合だけ`--silent`を使う。初期化は既存ディレクトリを上書きしない。入力はpublicへhardlink（別ボリューム時はcopy）。コピー元を編集するとhardlink側も変わるため、採用入力は不変として扱う。

`captions`の記入例（30fpsで1〜3秒）:

```json
{"startFrame":30,"endFrame":90,"speaker":"ゆめみん","text":"こんにちはみん！"}
```

これは形式の例。実作品に例文をそのまま追加しない。`durationInFrames`を短縮すれば映像・音声も同じ終端へ切る。シーンの差し替えは`clips`を編集する（`from`=出力開始フレーム、`trimBefore`=元素材開始フレーム、`duration`=出力区間）。最初の入力以外を使う場合、publicへ追加し、幅/高さも実測値へ更新する。順序変更・複数シーンの再構成では、同じ時間軸に編集した完成音声を`audioSource`へ指定する。

`creditText`例：`VOICEVOX:中国うさぎ / VOICEVOX:白上虎太郎`。本リポジトリではVOICEVOX動画内クレジットを維持する。複数行が長くなる場合は実フレームを見て位置や大きさを調整する。

元動画が可変fps、回転メタデータ付き、縦長の場合は初期化前に素材の扱いを確認する。テンプレートは横素材・固定fps用。対応範囲外を自動で速度変更しない。24/25/30/60/30000÷1001等の固定fpsは実測の比を使う。

## 配置

720×1280。背景blur34px、拡大1.13、opacity0.47、縦gradient。
タイトルx32〜688、y92、高さ220。小見出し30px、margin-bottom20。本文62px（10字超46px、15字超40px）、line-height1.22、色#fff2d4。
本編x0,y350,w720,h480へcontain（16:9の実映像高さ405）。字幕x40〜632、y876。名前28px・白、本文38px・メンバー色6px縁取り、line-height1.5。クレジットはy1160から20px。

文字色の正本は`03_SCRIPTS/00_TEMPLATES/subtitles/member-colors.ts`。初期化時にテンプレートへコピーするので、正本を改修したら既存プロジェクトのコピーも更新する。

## 検証の境界

レンダーは入力音声AACならstream copy、別codecならAACへ変換する。技術監査JSONには寸法・fps・フレーム数・終端デコードとmux元音声の一致を記録。元音声の保持とは、変換や終端trimの有無を区別する。

字幕の目視と通し試聴は別途実施する。任意フレームの確認例：

```sh
ffmpeg -ss 2 -i ../final_remotion_shorts_9x16.mp4 -frames:v 1 out/frame-2s.png
```

字幕焼き込み済み素材から文字を復元/除去する機能は同梱していない。編集元やクリーン素材を探し、できない場合は元字幕を維持する等の方針をユーザーと決める。
