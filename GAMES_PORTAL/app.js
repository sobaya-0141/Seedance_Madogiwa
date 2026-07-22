const grid = document.querySelector("#game-grid");
const count = document.querySelector("#game-count");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderGame(game, index) {
  const card = element("article", "game-card");
  card.dataset.accent = game.accent;

  const media = element("div", "game-image");
  const image = document.createElement("img");
  image.src = game.image;
  image.alt = `${game.title}のゲーム画面`;
  image.loading = index === 0 ? "eager" : "lazy";
  media.append(image);

  const body = element("div", "game-body");
  const meta = element("div", "game-meta");
  const status = element("span", "", "PLAYABLE NOW");
  status.prepend(element("i", "status-dot"));
  meta.append(status, element("span", "", game.controls));

  const title = element("h3", "game-title", game.title);
  const subtitle = element("p", "game-subtitle", game.subtitle);
  const description = element("p", "game-description", game.description);
  const link = element("a", "play-link");
  link.href = `${game.outputDir}/`;
  link.setAttribute("aria-label", `${game.title}をプレイ`);
  link.append(element("span", "", "PLAY GAME"), element("span", "", "→"));

  body.append(meta, title, subtitle, description, link);
  card.append(media, body);
  return card;
}

try {
  const response = await fetch("./games.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const manifest = await response.json();
  count.textContent = String(manifest.games.length).padStart(2, "0");
  grid.replaceChildren(...manifest.games.map(renderGame));
} catch (error) {
  console.error(error);
  grid.append(element("p", "game-description", "ゲーム一覧を読み込めませんでした。ページを再読み込みしてください。"));
}
