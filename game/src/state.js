// Game state and the rules: buy, sell, end the day, win and lose.
// One job: every rule change flows through these functions, so the
// interactive game and the screenshot autopilot play the same game.

import {
  GOODS, GOOD_KEYS, START_COINS, TARGET_COINS, MAX_DAYS,
  HAND_LIMIT, DEMAND_STEPS,
} from './config.js';
import { createRng, rollPick } from './random.js';
import { buildDeck, dealMarket, refillMarket } from './deck.js';
import { playRivalTurn } from './ai.js';

// Roll one demand multiplier per good for the new day.
export function rollDemand(rng) {
  const demand = {};
  for (const key of GOOD_KEYS) demand[key] = rollPick(rng, DEMAND_STEPS);
  return demand;
}

// A fresh game. screen: 'title' | 'play' | 'win' | 'loss'.
export function createGame(seed) {
  const rng = createRng(seed);
  const deck = buildDeck(rng);
  const game = {
    seed,
    rng,
    screen: 'title',
    day: 1,
    player: { name: 'You', coins: START_COINS, hand: [], gemsDoubled: false },
    rival: { name: 'Baron Brass', coins: START_COINS, hand: [], gemsDoubled: false },
    market: dealMarket(deck),
    deck,
    demand: rollDemand(rng),
    log: ['Welcome to Coin & Crown Market. Buy low, sell high!'],
    message: 'Press ENTER or click to start trading.',
    winner: null,
  };
  return game;
}

// What a card costs to buy (Grain's Staple effect: 2 less, minimum 1).
export function buyCost(card) {
  if (card.good === 'grain') return Math.max(1, card.buy - 2);
  return card.buy;
}

// What a card pays when its owner sells it today:
// base sell x demand, then the good's effect (Spice +3, Silk +2 with a pair,
// Wine +4 from day 5, first Gems of the day x2).
export function sellPrice(game, trader, card) {
  let price = Math.round(card.sell * game.demand[card.good]);
  if (card.good === 'spice') price += 3;
  if (card.good === 'silk') {
    const otherSilk = trader.hand.some((c) => c.good === 'silk' && c.id !== card.id);
    if (otherSilk) price += 2;
  }
  if (card.good === 'wine' && game.day >= 5) price += 4;
  if (card.good === 'gems' && !trader.gemsDoubled) {
    price *= 2;
    trader.gemsDoubled = true;
  }
  return price;
}

// Profit of a market card right now (sell price minus buy cost).
export function cardProfit(game, trader, card) {
  return sellPrice(game, { ...trader, gemsDoubled: trader.gemsDoubled }, card) - buyCost(card);
}

function pushLog(game, line) {
  game.log.push(line);
  if (game.log.length > 5) game.log.shift();
}

function checkEnd(game) {
  if (game.player.coins >= TARGET_COINS) {
    game.screen = 'win';
    game.winner = 'player';
    game.message = `You reached ${TARGET_COINS} coins and take the crown!`;
    pushLog(game, `You hit ${TARGET_COINS} coins — CROWN YOURS!`);
    return true;
  }
  if (game.rival.coins >= TARGET_COINS) {
    game.screen = 'loss';
    game.winner = 'rival';
    game.message = `Baron Brass reached ${TARGET_COINS} coins first.`;
    pushLog(game, `Baron Brass hit ${TARGET_COINS} coins first.`);
    return true;
  }
  if (game.player.coins <= 0 && game.player.hand.length === 0) {
    game.screen = 'loss';
    game.winner = 'rival';
    game.message = 'Bankrupt! No coins, no goods — the market eats you alive.';
    pushLog(game, 'Bankrupt! No coins and an empty hand.');
    return true;
  }
  return false;
}

// Start a fresh game from the title screen.
export function startGame(game) {
  const fresh = createGame(game.seed);
  fresh.screen = 'play';
  fresh.message = 'Day 1: buy from the market, sell from your hand.';
  return fresh;
}

// Buy a market card into the player's hand.
export function buyCard(game, marketIndex) {
  if (game.screen !== 'play') return false;
  const card = game.market[marketIndex];
  if (!card) return false;
  const cost = buyCost(card);
  if (game.player.hand.length >= HAND_LIMIT) {
    game.message = 'Your hand is full (6 cards). Sell something first!';
    return false;
  }
  if (game.player.coins < cost) {
    game.message = `Not enough coins — ${GOODS[card.good].name} costs ${cost}.`;
    return false;
  }
  game.player.coins -= cost;
  game.player.hand.push(card);
  game.market.splice(marketIndex, 1);
  refillMarket(game);
  pushLog(game, `You bought ${GOODS[card.good].name} for ${cost} coins.`);
  // Tea's Calm effect: buying it draws one bonus card straight into
  // your hand for free (if your hand has room).
  if (card.good === 'tea' && game.deck.length > 0 && game.player.hand.length < HAND_LIMIT) {
    const bonus = game.deck.pop();
    game.player.hand.push(bonus);
    pushLog(game, `Tea calms the market: a free ${GOODS[bonus.good].name} joins your hand!`);
  }
  game.message = `Bought ${GOODS[card.good].name} for ${cost}. Sell it when demand is high!`;
  checkEnd(game);
  return true;
}

// Sell a card from the player's hand at today's price.
export function sellCard(game, handIndex) {
  if (game.screen !== 'play') return false;
  const card = game.player.hand[handIndex];
  if (!card) return false;
  const price = sellPrice(game, game.player, card);
  game.player.hand.splice(handIndex, 1);
  game.player.coins += price;
  pushLog(game, `You sold ${GOODS[card.good].name} for ${price} coins.`);
  game.message = `Sold ${GOODS[card.good].name} for ${price} coins.`;
  checkEnd(game);
  return true;
}

// End the day: the Baron trades, demand shifts, a new day begins.
// After day 8 the richer trader takes the crown.
export function endDay(game) {
  if (game.screen !== 'play') return false;
  playRivalTurn(game);
  if (game.screen !== 'play') return true;
  game.day += 1;
  if (game.day > MAX_DAYS) {
    if (game.player.coins > game.rival.coins) {
      game.screen = 'win';
      game.winner = 'player';
      game.message = `Final tally: you ${game.player.coins} — Baron ${game.rival.coins}. The crown is yours!`;
      pushLog(game, 'Day 8 ends. You out-traded the Baron!');
    } else if (game.rival.coins > game.player.coins) {
      game.screen = 'loss';
      game.winner = 'rival';
      game.message = `Final tally: you ${game.player.coins} — Baron ${game.rival.coins}. The Baron keeps the crown.`;
      pushLog(game, 'Day 8 ends. The Baron out-traded you.');
    } else {
      game.screen = 'loss';
      game.winner = 'rival';
      game.message = `A dead heat at ${game.player.coins} coins — the Baron keeps the crown on a tie.`;
      pushLog(game, 'A tie! The Baron keeps the crown.');
    }
    return true;
  }
  game.demand = rollDemand(game.rng);
  game.player.gemsDoubled = false;
  game.rival.gemsDoubled = false;
  refillMarket(game);
  game.message = `Day ${game.day} of ${MAX_DAYS}: demand shifted — check the market!`;
  pushLog(game, `— Day ${game.day} begins. Demand shifts. —`);
  checkEnd(game);
  return true;
}
