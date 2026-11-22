// Mouse and keyboard input: translate clicks and keys into rules calls.
// One job: it never changes a rule itself — it only calls state.js.

import { computeLayout } from './render.js';
import { startGame, buyCard, sellCard, endDay, createGame } from './state.js';

// Map a browser event's client point onto the canvas's 1280x800 grid.
function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

// Attach input to a canvas. getGame/setGame let the handlers swap in a
// fresh game on start/restart; ui carries the hover state for rendering.
export function attachInput(canvas, getGame, setGame, ui) {
  canvas.addEventListener('mousemove', (event) => {
    const game = getGame();
    if (game.screen !== 'play') {
      ui.hover = null;
      return;
    }
    const point = canvasPoint(canvas, event);
    const layout = computeLayout(game);
    ui.hover = null;
    for (const rect of layout.marketCards) {
      if (inside(point, rect)) ui.hover = { type: 'market', index: rect.index };
    }
    for (const rect of layout.handCards) {
      if (inside(point, rect)) ui.hover = { type: 'hand', index: rect.index };
    }
    if (inside(point, layout.endDayBtn)) ui.hover = { type: 'endDay' };
  });

  canvas.addEventListener('click', (event) => {
    let game = getGame();
    if (game.screen === 'title') {
      setGame(startGame(game));
      return;
    }
    if (game.screen === 'win' || game.screen === 'loss') {
      setGame(startGame(createGame(game.seed)));
      return;
    }
    const point = canvasPoint(canvas, event);
    const layout = computeLayout(game);
    for (const rect of layout.marketCards) {
      if (inside(point, rect)) {
        buyCard(game, rect.index);
        return;
      }
    }
    for (const rect of layout.handCards) {
      if (inside(point, rect)) {
        sellCard(game, rect.index);
        return;
      }
    }
    if (inside(point, layout.endDayBtn)) endDay(game);
  });

  window.addEventListener('keydown', (event) => {
    let game = getGame();
    const key = event.key.toLowerCase();
    if (key === 'enter') {
      if (game.screen === 'title') setGame(startGame(game));
      else if (game.screen === 'win' || game.screen === 'loss') {
        setGame(startGame(createGame(game.seed)));
      }
      return;
    }
    if (game.screen !== 'play') {
      if (key === 'r') setGame(startGame(createGame(game.seed)));
      return;
    }
    if (key >= '1' && key <= '4') {
      buyCard(game, Number(key) - 1);
    } else if (key >= 'a' && key <= 'f') {
      sellCard(game, key.charCodeAt(0) - 'a'.charCodeAt(0));
    } else if (key === ' ' || key === 'spacebar') {
      event.preventDefault();
      endDay(game);
    }
  });
}
