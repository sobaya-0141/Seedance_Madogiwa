# Seedance Production Kit

## Characters
- そば屋
- たこさん
- とーくん
- よーたん
- 福ちゃん
- 無職やめたろう

## Theme
窓際族の日常コメディ

## 制作物 / Games
IP（世界観・キャラクター）を使った制作物。3Dモデルは全ゲーム共用の
`04_GAME_ASSETS/voxel/models/*.glb` を symlink で参照する。

- `05_OFFICE_CRASH_GAME/` — 「そば屋のオフィスクラッシュ」。備品を壊して得点を競う45秒スコアアタック（Three.js + vinext）。
- `06_VOXEL_CHARACTER_LAB/` — ボクセルキャラの確認・調整用ラボ。
- `07_SOBA_ESCAPE_GAME/` — 「そば屋の定時ダッシュ 〜バレずに脱出〜」。定時のオフィスを、巡回する仲間（福ちゃん・よーたん・とーくん・やめたろう）や監視スクリーン（おかやまん）に見つからず脱出するトップダウン型ステルス。右上の監視レーダーで各キャラの視界を読みながら出口を目指す（Vite + TypeScript + Three.js）。

## For Claude Code
プロジェクトのワークフローやSeedanceプロンプト作成ルールは `CLAUDE.md` を参照。
