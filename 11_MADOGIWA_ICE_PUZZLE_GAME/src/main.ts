import "./style.css";
import { IceRegulationGame } from "./game.js";

const root = document.querySelector<HTMLElement>("#app");

if (!root) throw new Error("#app が見つかりません");

new IceRegulationGame(root);
