#!/usr/bin/env bash
# Godot の環境構築（エディタ本体と Web 用書き出しテンプレート）。
# 偽物の配布物を避けるため、取得元は Godot 公式（GitHub の検証済み組織 godotengine の Releases）だけにし、
# 公式の SHA512-SUMS.txt で照合する。macOS ではさらに Apple の公証と Godot の開発元署名を確認する。
#
# 使い方:
#   godot_setup.sh check                    # 何が入っていて何が足りないかを表示するだけ（何も変更しない）
#   godot_setup.sh editor --yes             # エディタを入れる（brew が本物なら brew の公式 cask、無ければ公式 zip）
#   godot_setup.sh web-templates --yes      # 入っているエディタと同じ版の Web 用テンプレートを入れる
#   godot_setup.sh web-templates --yes --tpz <path>   # 取得済みの .tpz を使う（照合はする）
#
# --yes が無い場合はダウンロードせず、取得するファイル・取得元・サイズを表示して終了する。
# brew 自体のインストールは行わない（brew の偽サイトが出回っているため。必要ならユーザーに判断してもらう）。

set -euo pipefail

GODOT_TEAM_ID="6K46PWY5DM"   # Godot の macOS 版に署名している開発元（Prehensile Tales B.V.）
DEFAULT_VERSION="4.7.2-stable"
RELEASES="https://github.com/godotengine/godot/releases/download"

cmd="${1:-check}"
shift || true
yes=false
tpz=""
version="${GODOT_VERSION:-}"
while [ $# -gt 0 ]; do
	case "$1" in
		--yes) yes=true ;;
		--tpz) tpz="$2"; shift ;;
		--version) version="$2"; shift ;;
		*) echo "不明なオプション: $1" >&2; exit 2 ;;
	esac
	shift
done

os="$(uname -s)"
if [ "$os" = "Darwin" ]; then
	tpl_root="$HOME/Library/Application Support/Godot/export_templates"
	sha512() { shasum -a 512 -c "$@"; }
else
	tpl_root="$HOME/.local/share/godot/export_templates"
	sha512() { sha512sum -c "$@"; }
fi

# 入っているエディタの版（例: 4.7.2-stable）。無ければ空
installed_version() {
	command -v godot >/dev/null 2>&1 || { echo ""; return; }
	godot --version 2>/dev/null | head -1 | sed -E 's/^([0-9]+\.[0-9]+(\.[0-9]+)?)\.([a-z0-9]+)\..*/\1-\3/'
}

verify_macos_app() {
	local app="$1"
	local out
	out="$(spctl -a -vv "$app" 2>&1 || true)"
	[[ "$out" == *"accepted"* ]] || { echo "NG: Gatekeeper に拒否されました: $app" >&2; echo "$out" >&2; return 1; }
	[[ "$out" == *"Notarized Developer ID"* ]] || { echo "NG: Apple の公証がありません: $app" >&2; return 1; }
	local sig
	sig="$(codesign -dv "$app" 2>&1 || true)"
	[[ "$sig" == *"TeamIdentifier=$GODOT_TEAM_ID"* ]] || { echo "NG: 署名が Godot の開発元（$GODOT_TEAM_ID）ではありません: $app" >&2; return 1; }
	echo "OK: 公証済み・Godot 公式の署名（$GODOT_TEAM_ID）: $app"
}

download_verified() {
	# $1=ファイル名 $2=保存先ディレクトリ。SHA512-SUMS.txt と照合する
	local name="$1" dir="$2" ver="$3"
	mkdir -p "$dir"
	( cd "$dir"
		curl -fsSLO "$RELEASES/$ver/SHA512-SUMS.txt"
		[ -f "$name" ] || curl -fSLO --progress-bar "$RELEASES/$ver/$name"
		grep -E "  ${name//./\\.}\$" SHA512-SUMS.txt > "check_$name.txt"
		[ "$(wc -l < "check_$name.txt")" -eq 1 ] || { echo "NG: SHA512-SUMS に $name がありません" >&2; exit 1; }
		sha512 "check_$name.txt"
	)
}

status() {
	local v
	v="$(installed_version)"
	if [ -n "$v" ]; then
		echo "エディタ: $(command -v godot)（$v）"
		if [ "$os" = "Darwin" ] && [ -d /Applications/Godot.app ]; then verify_macos_app /Applications/Godot.app || true; fi
	else
		echo "エディタ: 未インストール"
	fi
	local want="${version:-${v:-$DEFAULT_VERSION}}"
	local dir="$tpl_root/${want/-/.}"
	if [ -f "$dir/web_nothreads_release.zip" ]; then
		echo "Web 用テンプレート: あり（$dir）"
	else
		echo "Web 用テンプレート: なし（$want 用。入れ先: $dir）"
	fi
	if command -v brew >/dev/null 2>&1; then
		echo "brew: $(command -v brew)（origin: $(git -C "$(brew --repo)" remote get-url origin 2>/dev/null || echo 不明)）"
	else
		echo "brew: なし"
	fi
}

install_editor() {
	if [ -n "$(installed_version)" ]; then
		echo "エディタは入っています: $(installed_version)"
		[ "$os" = "Darwin" ] && [ -d /Applications/Godot.app ] && verify_macos_app /Applications/Godot.app
		return 0
	fi
	[ "$os" = "Darwin" ] || { echo "macOS 以外では公式サイトの手順で入れてください（CI では deploy-games-pages.yml の手順を参照）" >&2; exit 2; }
	local ver="${version:-$DEFAULT_VERSION}"
	if command -v brew >/dev/null 2>&1; then
		local origin
		origin="$(git -C "$(brew --repo)" remote get-url origin 2>/dev/null || true)"
		if [ "$origin" != "https://github.com/Homebrew/brew" ]; then
			echo "NG: brew の取得元が公式（https://github.com/Homebrew/brew）ではありません: $origin" >&2
			echo "brew は使わず、公式 zip で入れるには環境変数 GODOT_NO_BREW=1 を付けて再実行してください" >&2
			[ "${GODOT_NO_BREW:-}" = "1" ] || exit 1
		elif [ "${GODOT_NO_BREW:-}" != "1" ]; then
			echo "brew の公式 cask（godot）で入れます。配布元: $(brew info --cask godot 2>/dev/null | grep -m1 -E '^https?://' || echo godotengine.org)"
			$yes || { echo "（--yes が無いので実行しません）"; exit 0; }
			brew install --cask godot
			verify_macos_app /Applications/Godot.app
			return 0
		fi
	fi
	# brew が無い: 公式 zip（約170MB）を照合して ~/Applications へ
	local name="Godot_v${ver}_macos.universal.zip"
	echo "公式リリースから $name（約170MB）を取得します: $RELEASES/$ver/$name"
	$yes || { echo "（--yes が無いので実行しません）"; exit 0; }
	local dl="${TMPDIR:-/tmp}/godot-setup-$ver"
	download_verified "$name" "$dl" "$ver"
	mkdir -p "$HOME/Applications"
	unzip -q -o "$dl/$name" -d "$HOME/Applications"
	verify_macos_app "$HOME/Applications/Godot.app"
	mkdir -p "$HOME/.local/bin"
	ln -sf "$HOME/Applications/Godot.app/Contents/MacOS/Godot" "$HOME/.local/bin/godot"
	echo "入れました: $HOME/Applications/Godot.app（コマンドは $HOME/.local/bin/godot。PATH に無ければ追加してください）"
}

install_web_templates() {
	local ver="${version:-$(installed_version)}"
	[ -n "$ver" ] || ver="$DEFAULT_VERSION"
	local dir="$tpl_root/${ver/-/.}"
	if [ -f "$dir/web_nothreads_release.zip" ]; then
		echo "Web 用テンプレートは入っています: $dir"
		return 0
	fi
	local name="Godot_v${ver}_export_templates.tpz"
	echo "公式リリースから $name（全プラットフォーム分・約1.3GB）を取得し、Web 用だけを $dir へ入れます: $RELEASES/$ver/$name"
	$yes || { echo "（--yes が無いので実行しません）"; exit 0; }
	local dl
	if [ -n "$tpz" ]; then
		dl="$(cd "$(dirname "$tpz")" && pwd)"
		[ "$(basename "$tpz")" = "$name" ] || { echo "NG: --tpz のファイル名は $name にしてください" >&2; exit 1; }
	else
		dl="${TMPDIR:-/tmp}/godot-setup-$ver"
	fi
	download_verified "$name" "$dl" "$ver"
	# パストラバーサル対策: 中身が templates/ 配下だけであることを確認
	local listing
	listing="$(unzip -Z1 "$dl/$name")"
	if grep -vE '^templates/[A-Za-z0-9_.-]+$' <<< "$listing" | grep -q .; then
		echo "NG: アーカイブに想定外のパスがあります" >&2; exit 1
	fi
	mkdir -p "$dir"
	unzip -q -o -j "$dl/$name" templates/version.txt templates/web_nothreads_release.zip templates/web_nothreads_debug.zip -d "$dir"
	echo "入れました: $dir"
	ls -l "$dir"
}

case "$cmd" in
	check) status ;;
	editor) install_editor ;;
	web-templates) install_web_templates ;;
	*) echo "使い方: $0 check | editor [--yes] | web-templates [--yes] [--tpz <path>] [--version 4.7.2-stable]" >&2; exit 2 ;;
esac
