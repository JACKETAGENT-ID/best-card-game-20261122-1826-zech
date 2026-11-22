// Baron Brass, the rival merchant: a readable, beatable AI.
// One job: the Baron's whole turn. He buys what would sell at a profit
// today and sells when demand is high — so you can read his plan and
// counter it by buying the goods he wants first.

import { GOODS, HAND_LIMIT } from './config.js';
import { buyCost, sellPrice, cardProfit } from './state.js';

function rivalLog(game, line) {
  game.log.push(line);
  if (game.log.length > 5) game.log.shift();
}

// Sell one of the Baron's cards and log it.
function rivalSell(game, handIndex) {
  const card = game.rival.hand[handIndex];
  const price = sellPrice(game, game.rival, card);
  game.rival.hand.splice(handIndex, 1);
  game.rival.coins += price;
  rivalLog(game, `Baron sells ${GOODS[card.good].name} for ${price}.`);
}

// The Baron's turn, in two passes: buy, then sell.
export function playRivalTurn(game) {
  const rival = game.rival;

  // Pass 1 — buy: take the most profitable market card he can afford,
  // up to three buys, while his hand has room.
  let buys = 0;
  while (buys < 3 && rival.hand.length < HAND_LIMIT) {
    let bestIndex = -1;
    let bestProfit = 0;
    for (let i = 0; i < game.market.length; i += 1) {
      const card = game.market[i];
      if (buyCost(card) > rival.coins) continue;
      const profit = cardProfit(game, rival, card);
      if (profit > bestProfit) {
        bestProfit = profit;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) break;
    const card = game.market[bestIndex];
    const cost = buyCost(card);
    rival.coins -= cost;
    rival.hand.push(card);
    game.market.splice(bestIndex, 1);
    rivalLog(game, `Baron buys ${GOODS[card.good].name} for ${cost}.`);
    buys += 1;
  }

  // Pass 2 — sell: unload anything whose demand is hot, and on the last
  // day sell everything — the tally is what counts. He always keeps one
  // card in hand before the last day, so his satchel is never bare.
  for (let i = rival.hand.length - 1; i >= 0; i -= 1) {
    const card = rival.hand[i];
    if (rival.hand.length === 1 && game.day < 8) continue;
    if (game.demand[card.good] >= 1.2 || game.day >= 8) {
      rivalSell(game, i);
    }
  }

  // The market refills for the next day.
  while (game.market.length < 4 && game.deck.length > 0) {
    game.market.push(game.deck.pop());
  }
}
