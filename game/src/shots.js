// Screenshot mode: ?shot=start|play|win|loss&seed=1
// One job: drive the REAL rules forward from a fresh state with a fixed
// seed and a deterministic autopilot, so every screenshot is a true render
// of the game itself — never a staged mock.
//
// Autopilot (good): buy every market card that would sell at a profit of
// 2+ today, sell when demand is hot (x1.2+), sell everything on day 8.
// Autopilot (bad): buy the priciest card he can afford, never sell —
// the Baron out-trades him and the loss screen is earned, not faked.

import { startGame, buyCard, sellCard, endDay, buyCost, cardProfit } from './state.js';
import { MAX_DAYS } from './config.js';

function autopilotGoodDay(game) {
  // Buy: keep taking the most profitable affordable card.
  for (;;) {
    let bestIndex = -1;
    let bestProfit = 1;
    for (let i = 0; i < game.market.length; i += 1) {
      const card = game.market[i];
      if (buyCost(card) > game.player.coins) continue;
      if (game.player.hand.length >= 6) break;
      const profit = cardProfit(game, game.player, card);
      if (profit > bestProfit) {
        bestProfit = profit;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) break;
    if (!buyCard(game, bestIndex)) break;
    if (game.screen !== 'play') return;
  }
  // Sell: hot demand now, everything on the final day.
  for (let i = game.player.hand.length - 1; i >= 0; i -= 1) {
    const card = game.player.hand[i];
    if (game.demand[card.good] >= 1.2 || game.day >= MAX_DAYS) {
      sellCard(game, i);
      if (game.screen !== 'play') return;
    }
  }
}

// Autopilot (casual): a relaxed trader for the mid-game table shot —
// buys only clear bargains (profit 5+), sells only at peak demand (x1.5),
// so after a couple of days the table is busy but nobody has won yet.
function autopilotCasualDay(game) {
  let buys = 0;
  for (;;) {
    let bestIndex = -1;
    let bestProfit = 4;
    for (let i = 0; i < game.market.length; i += 1) {
      const card = game.market[i];
      if (buyCost(card) > game.player.coins) continue;
      if (game.player.hand.length >= 6) break;
      const profit = cardProfit(game, game.player, card);
      if (profit > bestProfit) {
        bestProfit = profit;
        bestIndex = i;
      }
    }
    if (bestIndex < 0 || buys >= 2) break;
    if (!buyCard(game, bestIndex)) break;
    buys += 1;
    if (game.screen !== 'play') return;
  }
  for (let i = game.player.hand.length - 1; i >= 0; i -= 1) {
    const card = game.player.hand[i];
    if (game.demand[card.good] >= 1.5) {
      sellCard(game, i);
      if (game.screen !== 'play') return;
    }
  }
}

// Autopilot (buy-only): fill the hand with bargains and sell nothing —
// used for the last stretch of the mid-game table shot.
function autopilotBuyOnlyDay(game) {
  let buys = 0;
  for (;;) {
    let bestIndex = -1;
    let bestProfit = 1;
    for (let i = 0; i < game.market.length; i += 1) {
      const card = game.market[i];
      if (buyCost(card) > game.player.coins) continue;
      if (game.player.hand.length >= 6) break;
      const profit = cardProfit(game, game.player, card);
      if (profit > bestProfit) {
        bestProfit = profit;
        bestIndex = i;
      }
    }
    if (bestIndex < 0 || buys >= 3) break;
    if (!buyCard(game, bestIndex)) break;
    buys += 1;
    if (game.screen !== 'play') return;
  }
}

function autopilotBadDay(game) {
  // Buy the priciest affordable card until the hand is full; never sell.
  for (;;) {
    let worstIndex = -1;
    let worstCost = -1;
    for (let i = 0; i < game.market.length; i += 1) {
      const card = game.market[i];
      const cost = buyCost(card);
      if (cost <= game.player.coins && cost > worstCost) {
        worstCost = cost;
        worstIndex = i;
      }
    }
    if (worstIndex < 0 || game.player.hand.length >= 6) break;
    if (!buyCard(game, worstIndex)) break;
    if (game.screen !== 'play') return;
  }
}

// Play whole days of the good autopilot until the game ends (win or loss).
function playGoodGame(game) {
  let guard = 0;
  while (game.screen === 'play' && guard < 12) {
    autopilotGoodDay(game);
    if (game.screen !== 'play') break;
    endDay(game);
    guard += 1;
  }
  return game;
}

function playBadGame(game) {
  let guard = 0;
  while (game.screen === 'play' && guard < 12) {
    autopilotBadDay(game);
    if (game.screen !== 'play') break;
    endDay(game);
    guard += 1;
  }
  return game;
}

// Apply one shot mode to a fresh title-screen game and return the game
// to render. Returns null for an unknown mode.
export function applyShot(game, shot) {
  if (shot === 'start') return game;
  let started = startGame(game);
  if (shot === 'play') {
    // Two full days of casual play, then a third day's buying: a busy
    // mid-game table, nobody near the crown yet.
    for (let day = 0; day < 2 && started.screen === 'play'; day += 1) {
      autopilotCasualDay(started);
      if (started.screen !== 'play') break;
      endDay(started);
    }
    if (started.screen === 'play') autopilotBuyOnlyDay(started);
    return started;
  }
  if (shot === 'win') return playGoodGame(started);
  if (shot === 'loss') return playBadGame(started);
  return null;
}
