#!/bin/sh
# 手描きのコマが置いてあるキャラを全部アトラスにまとめ直す。リポジトリのルートから実行する:
#   sh 04_GAME_ASSETS/musou2d/tools/pack_all.sh
# コマの置き場: そば屋は 17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated/、
# 敵は 17_SOBAYA_MUSOU_2D_KORGE/art_prompts/generated_enemies/<名前>/（git には入れない）
# 基準コマ idle_01.png の足元（マゼンタ以外の一番下の行と、その中央）を <名前>_anims.txt の pivot に書いておくこと
set -e
command -v cwebp >/dev/null || { echo "cwebp が必要です（brew install webp）"; exit 1; }
M=04_GAME_ASSETS/musou2d
SRC=17_SOBAYA_MUSOU_2D_KORGE/art_prompts
JAVA=${JAVA:-java}
for name in sobaya guard captain police sergeant boss fx_light fx_art; do
  case $name in
    sobaya) dir=$SRC/generated ;;
    fx_*) dir=$SRC/generated_fx ;;  # エフェクト・擬音・アイテム（effect_prompts.md）
    *) dir=$SRC/generated_enemies/$name ;;
  esac
  # 動作一覧のコマが全部そろっているキャラだけをまとめる（途中まで届いたキャラは飛ばす）
  missing=$(awk '$1=="anim"{for(i=1;i<=$3;i++) printf "%s_%02d.png %s.png\n", $2, i, ($3==1 ? $2 : $2 "_" i)}' $M/${name}_anims.txt | while read f g; do [ -f "$dir/$f" ] || [ -f "$dir/$g" ] || echo "$f"; done | wc -l | tr -d ' ')
  if [ -f "$dir/HOLD.txt" ]; then
    echo "-- $name: 照合待ち・不合格のため飛ばす（$(cat "$dir/HOLD.txt")）"
  elif [ "$missing" = 0 ]; then
    echo "== $name"
    "$JAVA" $M/tools/PackSprites.java "$dir" $M/${name}_anims.txt $M/sprites $name
    # ゲームには WebP だけを入れる（PNG の数分の1。Web・スマホでも軽い）
    for png in $M/sprites/${name}_[0-9]*.png; do
      cwebp -quiet -q 90 -alpha_q 100 -m 6 "$png" -o "${png%.png}.webp" && rm "$png"
    done
  else
    echo "-- $name: コマが $missing 枚足りないので飛ばす（ゲームは採用3Dモデルの絵を使う）"
  fi
done
