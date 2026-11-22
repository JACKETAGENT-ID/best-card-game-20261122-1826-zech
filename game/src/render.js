// Canvas drawing: title screen, market table, cards, win and loss screens.
// One job: everything the player sees. Layout lives here too, so input.js
// can hit-test the same rectangles this file draws.

import { GOODS, TABLE_WIDTH, TABLE_HEIGHT, TARGET_COINS, MAX_DAYS } from './config.js';
import { buyCost, sellPrice } from './state.js';

// Geometry of the interactive pieces, shared with input.js.
export function computeLayout(game) {
  const marketCards = [];
  const mw = 200, mh = 250, gap = 20;
  const totalW = 4 * mw + 3 * gap;
  const startX = 60;
  const marketY = 300;
  for (let i = 0; i < game.market.length; i += 1) {
    marketCards.push({ x: startX + i * (mw + gap), y: marketY, w: mw, h: mh, index: i });
  }
  const handCards = [];
  const hw = 168, hh = 196, hgap = 14;
  const handY = 600;
  for (let i = 0; i < game.player.hand.length; i += 1) {
    handCards.push({ x: 40 + i * (hw + hgap), y: handY, w: hw, h: hh, index: i });
  }
  return {
    marketCards,
    handCards,
    endDayBtn: { x: 968, y: 508, w: 272, h: 52 },
    startBtn: { x: 440, y: 640, w: 400, h: 64 },
    restartBtn: { x: 440, y: 620, w: 400, h: 64 },
    tableW: TABLE_WIDTH,
    tableH: TABLE_HEIGHT,
    _unused: totalW,
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The good's shape, drawn big so colour AND shape tell goods apart.
export function drawGoodShape(ctx, shape, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  } else if (shape === 'diamond') {
    ctx.moveTo(cx, cy - size / 2);
    ctx.lineTo(cx + size / 2, cy);
    ctx.lineTo(cx, cy + size / 2);
    ctx.lineTo(cx - size / 2, cy);
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? size / 2 : size / 5;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  } else if (shape === 'triangle') {
    ctx.moveTo(cx, cy - size / 2);
    ctx.lineTo(cx + size / 2, cy + size / 2);
    ctx.lineTo(cx - size / 2, cy + size / 2);
  } else if (shape === 'square') {
    ctx.rect(cx - size / 2, cy - size / 2, size, size);
  } else if (shape === 'heart') {
    ctx.moveTo(cx, cy + size * 0.35);
    ctx.bezierCurveTo(cx - size * 0.6, cy - size * 0.1, cx - size * 0.35, cy - size * 0.55, cx, cy - size * 0.15);
    ctx.bezierCurveTo(cx + size * 0.35, cy - size * 0.55, cx + size * 0.6, cy - size * 0.1, cx, cy + size * 0.35);
  }
  ctx.fill();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

// One goods card. mode 'market' shows the buy cost biggest; 'hand' shows
// today's sell price biggest. Prices are always large and high-contrast.
function drawCard(ctx, game, card, rect, mode, hovered) {
  const good = GOODS[card.good];
  const lift = hovered ? -10 : 0;
  const x = rect.x;
  const y = rect.y + lift;
  const { w, h } = rect;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = hovered ? 22 : 10;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 14);
  ctx.clip();
  // Colour band with the good's shape and name.
  ctx.fillStyle = good.color;
  ctx.fillRect(x, y, w, 74);
  ctx.fillStyle = good.dark;
  ctx.fillRect(x, y + 74, w, 6);
  drawGoodShape(ctx, '#fff8dc', x + 34, y + 37, 44, '#fff8dc');
  ctx.fillStyle = '#fff8dc';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(good.name, x + 64, y + 38);
  // Demand badge on market cards.
  if (mode === 'market') {
    const d = game.demand[card.good];
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(`x${d.toFixed(1)}`, x + w - 14, y + 38);
  }
  ctx.restore();

  // Prices: big numbers, dark on cream.
  ctx.fillStyle = '#221a08';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (mode === 'market') {
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillStyle = '#6b5a2a';
    ctx.fillText('BUY', x + w / 2, y + 118);
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillStyle = '#221a08';
    ctx.fillText(`${buyCost(card)}`, x + w / 2, y + 168);
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillStyle = '#4a6b2a';
    ctx.fillText(`SELL ${sellPrice(game, game.player, card)}`, x + w / 2, y + 200);
  } else {
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillStyle = '#6b5a2a';
    ctx.fillText('SELL NOW', x + w / 2, y + 110);
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillStyle = '#1d5c1d';
    ctx.fillText(`${sellPrice(game, game.player, card)}`, x + w / 2, y + 156);
  }
  // Effect text, wrapped, small but legible, pinned to the card's foot.
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#3d3220';
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, good.effect, w - 24);
  lines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, x + 12, y + h - 30 + i * 18);
  });

  if (hovered) {
    roundRect(ctx, x, y, w, h, 14);
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

// A face-down rival card: dark back with a crown mark.
function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#5a1f24';
  ctx.fill();
  ctx.strokeStyle = '#d8a93c';
  ctx.lineWidth = 3;
  ctx.stroke();
  drawGoodShape(ctx, '#d8a93c', x + w / 2, y + h / 2 - 8, 34, '#d8a93c');
  ctx.fillStyle = '#d8a93c';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('BRASS', x + w / 2, y + h - 16);
}

function drawCoinPile(ctx, cx, cy, scale) {
  ctx.fillStyle = '#ffd94d';
  ctx.strokeStyle = '#8a6d1d';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + i * 4 * scale, 26 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6d1d';
  ctx.font = `bold ${Math.round(20 * scale)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('¢', cx, cy + 8 * scale);
}

function drawTopBar(ctx, game) {
  ctx.fillStyle = '#120d05';
  ctx.fillRect(0, 0, TABLE_WIDTH, 64);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COIN & CROWN MARKET', 24, 33);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fdf6e3';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(`DAY ${Math.min(game.day, MAX_DAYS)} / ${MAX_DAYS}`, TABLE_WIDTH / 2, 33);
  ctx.textAlign = 'right';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(`TARGET ${TARGET_COINS}`, TABLE_WIDTH - 24, 33);
}

function drawCoinScore(ctx, game) {
  // Player coins: huge, left. Rival coins: huge, right of the rival row.
  drawCoinPile(ctx, 70, 130, 1.1);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(`${game.player.coins}`, 105, 132);
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#fdf6e3';
  ctx.fillText('YOUR COINS', 105, 168);
  ctx.fillText(`HAND ${game.player.hand.length}/6`, 105, 196);

  drawCoinPile(ctx, 70, 232, 0.9);
  ctx.fillStyle = '#e8b93c';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillText(`${game.rival.coins}`, 105, 232);
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillStyle = '#d8c9a3';
  ctx.fillText("BARON'S COINS", 105, 264);
}

function drawRivalHand(ctx, game) {
  ctx.fillStyle = '#fdf6e3';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('BARON BRASS — rival merchant', 300, 108);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#d8c9a3';
  ctx.fillText(`${game.rival.hand.length} goods hoarded — he sells when demand is hot`, 300, 134);
  const bw = 62, bh = 88;
  for (let i = 0; i < Math.min(game.rival.hand.length, 6); i += 1) {
    drawCardBack(ctx, 300 + i * 72, 150, bw, bh);
  }
  if (game.rival.hand.length === 0) {
    ctx.fillStyle = '#9db38a';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('His satchel is empty… for now.', 300, 200);
  }
}

function drawDemandPanel(ctx, game) {
  const x = 968, y = 300;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, x, y, 272, 200, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText("TODAY'S DEMAND", x + 16, y + 28);
  let rowY = y + 56;
  for (const key of Object.keys(GOODS)) {
    const good = GOODS[key];
    const d = game.demand[key];
    drawGoodShape(ctx, good.shape, x + 30, rowY, 20, good.color);
    ctx.fillStyle = '#fdf6e3';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(good.name, x + 48, rowY + 6);
    ctx.textAlign = 'right';
    ctx.fillStyle = d >= 1.2 ? '#7ee787' : d < 1.0 ? '#ff9a9a' : '#fdf6e3';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`x${d.toFixed(1)} ${d >= 1.2 ? '▲' : d < 1.0 ? '▼' : '—'}`, x + 256, rowY + 6);
    ctx.textAlign = 'left';
    rowY += 25;
  }
  // Last market log lines under the demand panel.
  ctx.fillStyle = '#d8c9a3';
  ctx.font = '15px Georgia, serif';
  const lines = game.log.slice(-4);
  lines.forEach((line, i) => {
    ctx.fillText(line.slice(0, 46), 968, 584 + i * 20);
  });
}

function drawEndDayButton(ctx, layout, hovered) {
  const b = layout.endDayBtn;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = hovered ? '#ffd94d' : '#e8b93c';
  ctx.fill();
  ctx.fillStyle = '#221a08';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END DAY  ⏎', b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawMessage(ctx, game) {
  ctx.fillStyle = '#fdf6e3';
  ctx.font = 'italic 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.message, TABLE_WIDTH / 2, 566);
}

function drawTable(ctx, game, ui) {
  // Felt table.
  ctx.fillStyle = '#1d4d2b';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  ctx.strokeStyle = '#2c6b3f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 560, 330, 0, 0, Math.PI * 2);
  ctx.stroke();

  drawTopBar(ctx, game);
  drawCoinScore(ctx, game);
  drawRivalHand(ctx, game);

  // Market row label.
  ctx.fillStyle = '#fdf6e3';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('MARKET — click a card to buy it  (keys 1–4)', 60, 288);

  const layout = computeLayout(game);
  layout.marketCards.forEach((rect) => {
    const hovered = ui.hover && ui.hover.type === 'market' && ui.hover.index === rect.index;
    drawCard(ctx, game, game.market[rect.index], rect, 'market', hovered);
  });
  drawDemandPanel(ctx, game);
  drawEndDayButton(ctx, layout, ui.hover && ui.hover.type === 'endDay');
  drawMessage(ctx, game);

  // Player hand label + cards.
  ctx.fillStyle = '#fdf6e3';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('YOUR HAND — click a card to sell it  (keys A–F)', 40, 588);
  if (game.player.hand.length === 0) {
    ctx.fillStyle = '#9db38a';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText('Your satchel is empty — buy something from the market!', 40, 660);
  }
  layout.handCards.forEach((rect) => {
    const hovered = ui.hover && ui.hover.type === 'hand' && ui.hover.index === rect.index;
    drawCard(ctx, game, game.player.hand[rect.index], rect, 'hand', hovered);
  });
}

function drawCrown(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - size / 2, cy + size * 0.3);
  ctx.lineTo(cx - size / 2, cy - size * 0.2);
  ctx.lineTo(cx - size * 0.25, cy);
  ctx.lineTo(cx, cy - size * 0.45);
  ctx.lineTo(cx + size * 0.25, cy);
  ctx.lineTo(cx + size / 2, cy - size * 0.2);
  ctx.lineTo(cx + size / 2, cy + size * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawTitle(ctx, game) {
  ctx.fillStyle = '#1d4d2b';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  ctx.strokeStyle = '#2c6b3f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 560, 330, 0, 0, Math.PI * 2);
  ctx.stroke();

  drawCrown(ctx, TABLE_WIDTH / 2, 130, 120, '#ffd94d');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('COIN & CROWN', TABLE_WIDTH / 2, 260);
  ctx.fillStyle = '#fdf6e3';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('M A R K E T', TABLE_WIDTH / 2, 320);
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = '#d8c9a3';
  ctx.fillText('A merchant duel: buy low, sell high, take the crown.', TABLE_WIDTH / 2, 372);
  ctx.font = '20px Georgia, serif';
  ctx.fillText('You vs Baron Brass — 8 market days. First to 150 coins wins.', TABLE_WIDTH / 2, 408);
  ctx.fillText('Click a market card to BUY · click your hand to SELL · END DAY to let the Baron trade.', TABLE_WIDTH / 2, 440);
  ctx.fillText('Keys: 1–4 buy · A–F sell · Space end day · Enter start', TABLE_WIDTH / 2, 472);

  // A row of the six goods — each told apart by colour and shape.
  const goodKeys = Object.keys(GOODS);
  const chipW = 150;
  const chipX0 = TABLE_WIDTH / 2 - (goodKeys.length * chipW) / 2;
  goodKeys.forEach((key, i) => {
    const good = GOODS[key];
    const cx = chipX0 + i * chipW + chipW / 2;
    drawGoodShape(ctx, good.shape, cx, 540, 52, good.color);
    ctx.fillStyle = '#fdf6e3';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(good.name, cx, 590);
  });

  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('— CLICK OR PRESS ENTER TO START —', TABLE_WIDTH / 2, 700);
}

function drawEndScreen(ctx, game, won) {
  ctx.fillStyle = won ? '#3a2f05' : '#2b0f12';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  drawCrown(ctx, TABLE_WIDTH / 2, 150, won ? 150 : 110, won ? '#ffd94d' : '#8a8a8a');
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd94d' : '#ff9a9a';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.fillText(won ? 'YOU WIN THE CROWN!' : 'OUTTRADED!', TABLE_WIDTH / 2, 300);
  ctx.fillStyle = '#fdf6e3';
  ctx.font = '28px Georgia, serif';
  ctx.fillText(game.message, TABLE_WIDTH / 2, 360);
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(`FINAL SCORE — You ${game.player.coins}  ·  Baron Brass ${game.rival.coins}`, TABLE_WIDTH / 2, 440);
  ctx.font = '22px Georgia, serif';
  ctx.fillStyle = '#d8c9a3';
  if (won) {
    ctx.fillText('The market is yours. The Baron tips his hat and pays up.', TABLE_WIDTH / 2, 490);
  } else {
    ctx.fillText('The Baron keeps the crown this time. Study the demand and come back.', TABLE_WIDTH / 2, 490);
  }
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('— PRESS R OR CLICK TO PLAY AGAIN —', TABLE_WIDTH / 2, 660);
}

// Main entry: draw the current screen.
export function drawGame(ctx, game, ui) {
  ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  if (game.screen === 'title') {
    drawTitle(ctx, game);
  } else if (game.screen === 'win') {
    drawEndScreen(ctx, game, true);
  } else if (game.screen === 'loss') {
    drawEndScreen(ctx, game, false);
  } else {
    drawTable(ctx, game, ui);
  }
}
