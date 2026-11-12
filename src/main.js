import { Game } from './game.js';
import { UI } from './ui.js';

const ui = new UI(document.getElementById('ui'));
const game = new Game(document.getElementById('app'), ui);
window.__game = game; // útil para depurar desde la consola
ui.showStart((s) => game.start(s));
