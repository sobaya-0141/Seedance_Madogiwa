import type { Mood } from "./types";

/**
 * そば屋のSVGアバター。設定のNG変更（白い仮面・ビールジョッキ）を必ず守る。
 * 白い仮面＋赤いマーク＋額の点、半袖の白Tシャツ、大型ビールジョッキが必須要素。
 * 表情は仮面の「目（穴）」と口の描き分けで表現する。
 */
export function sobayaAvatar(mood: Mood): string {
  // 目（仮面の穴）の形を表情で変える。
  const eyes: Record<Mood, string> = {
    neutral: `<ellipse cx="88" cy="96" rx="9" ry="12" fill="#1a1a1a"/><ellipse cx="132" cy="96" rx="9" ry="12" fill="#1a1a1a"/>`,
    happy: `<path d="M79 98 q9 -12 18 0" stroke="#1a1a1a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M123 98 q9 -12 18 0" stroke="#1a1a1a" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    fluster: `<ellipse cx="88" cy="98" rx="7" ry="9" fill="#1a1a1a"/><ellipse cx="132" cy="98" rx="7" ry="9" fill="#1a1a1a"/>`,
    surprise: `<circle cx="88" cy="96" r="11" fill="#1a1a1a"/><circle cx="132" cy="96" r="11" fill="#1a1a1a"/>`,
  };
  // 口。
  const mouth: Record<Mood, string> = {
    neutral: `<rect x="100" y="128" width="20" height="7" rx="3" fill="#5b4b3a"/>`,
    happy: `<path d="M98 128 q12 12 24 0" stroke="#5b4b3a" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    fluster: `<rect x="104" y="129" width="12" height="6" rx="3" fill="#5b4b3a"/>`,
    surprise: `<ellipse cx="110" cy="132" rx="7" ry="9" fill="#5b4b3a"/>`,
  };
  // 照れ・喜びのときは頬に赤み。
  const blush =
    mood === "fluster" || mood === "happy"
      ? `<ellipse cx="72" cy="116" rx="12" ry="7" fill="#ff9bb3" opacity="0.55"/><ellipse cx="148" cy="116" rx="12" ry="7" fill="#ff9bb3" opacity="0.55"/>`
      : "";

  return `
  <svg class="sobaya-svg" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="そば屋さん">
    <!-- 体・白Tシャツ -->
    <path d="M40 300 L40 210 Q40 168 110 160 Q180 168 180 210 L180 300 Z" fill="#f5f5f5" stroke="#d9d9d9" stroke-width="2"/>
    <!-- 首 -->
    <rect x="94" y="150" width="32" height="26" rx="8" fill="#e9d7c3"/>
    <!-- 髪（黒・短髪ツンツン） -->
    <path d="M58 78 Q56 40 82 32 Q90 20 110 26 Q130 20 138 32 Q164 40 162 78 Q150 60 138 66 Q132 50 118 58 Q110 46 102 58 Q88 50 82 66 Q70 60 58 78 Z" fill="#2a2a2a"/>
    <!-- 白い仮面（NG変更：必須要素） -->
    <ellipse cx="110" cy="102" rx="58" ry="62" fill="#fbfbfb" stroke="#e2e2e2" stroke-width="2"/>
    <!-- 額の赤い点 -->
    <circle cx="110" cy="66" r="6" fill="#d23b3b"/>
    <!-- 目の下の赤いマーク（左右2本ずつ） -->
    <path d="M84 84 q-6 26 -2 46" stroke="#d23b3b" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M98 86 q-4 24 -1 40" stroke="#d23b3b" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M136 84 q6 26 2 46" stroke="#d23b3b" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M122 86 q4 24 1 40" stroke="#d23b3b" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${blush}
    ${eyes[mood]}
    ${mouth[mood]}
    <!-- 大型ビールジョッキ（NG変更：必須要素） -->
    <g transform="translate(150 196)">
      <rect x="0" y="0" width="46" height="60" rx="6" fill="#ffe08a" stroke="#e0a93b" stroke-width="3"/>
      <rect x="0" y="0" width="46" height="16" rx="6" fill="#fffdf5" stroke="#e0a93b" stroke-width="3"/>
      <path d="M46 12 q22 4 22 24 q0 20 -22 24" fill="none" stroke="#e0a93b" stroke-width="6"/>
      <rect x="8" y="22" width="6" height="30" rx="3" fill="#ffd15c" opacity="0.7"/>
    </g>
  </svg>`;
}
