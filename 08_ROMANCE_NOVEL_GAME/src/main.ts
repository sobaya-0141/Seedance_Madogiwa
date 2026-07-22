import "./style.css";
import { Game } from "./game";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("#app root element not found");

new Game(root);
