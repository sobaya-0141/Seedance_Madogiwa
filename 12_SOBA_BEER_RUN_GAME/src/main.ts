import "./style.css";
import { BeerRunnerGame } from "./game.js";

const root = document.querySelector<HTMLElement>("#app");

if (!root) throw new Error("#app が見つかりません");

new BeerRunnerGame(root);
