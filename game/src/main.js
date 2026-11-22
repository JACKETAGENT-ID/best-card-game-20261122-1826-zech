// Bootstrap: build the game, wire input, run the render loop.
// ?shot=start|play|win|loss&seed=N renders one screenshot scene instead
// of the interactive game (see shots.js). No network, no assets.

import { TABLE_WIDTH, TABLE_HEIGHT } from './config.js';
import { createGame } from './state.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isFinite(seedParam) ? seedParam : (Date.now() % 2147483647);
const shot = params.get('shot');

let game = createGame(seed);
const ui = { hover: null };

if (shot) {
  const staged = applyShot(game, shot);
  if (staged) game = staged;
} else {
  attachInput(canvas, () => game, (next) => { game = next; }, ui);
}
window.__shot = shot;
Object.defineProperty(window, '__game', { get: () => game });

// One render loop for every screen; the game is drawn from state each frame.
function frame() {
  drawGame(ctx, game, ui);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
