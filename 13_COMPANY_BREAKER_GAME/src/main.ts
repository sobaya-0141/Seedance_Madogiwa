import "./style.css";
import { CompanyBreakerGame } from "./game.js";

const root = document.querySelector<HTMLElement>("#app");

if (!root) throw new Error("#app が見つかりません");

void CompanyBreakerGame.create(root).catch((error: unknown) => {
  console.error(error);
  root.innerHTML = `
    <main class="fatal-error">
      <strong>3D解体演習場を起動できませんでした</strong>
      <p>WebGL対応ブラウザで再読み込みしてください。</p>
    </main>
  `;
});
