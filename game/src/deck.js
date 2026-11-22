// The deck: build it, deal the opening market, refill the market row.
// One job: cards come from here and nowhere else.

import { GOODS, GOOD_KEYS, DECK_COPIES_PER_GOOD, MARKET_SIZE } from './config.js';
import { rollInt, shuffleDeck } from './random.js';

// A card is one good with its own buy/sell prices rolled inside the good's range.
export function buildDeck(rng) {
  const deck = [];
  let id = 0;
  for (const key of GOOD_KEYS) {
    const good = GOODS[key];
    for (let copy = 0; copy < DECK_COPIES_PER_GOOD; copy += 1) {
      deck.push({
        id: id++,
        good: key,
        buy: rollInt(rng, good.buyMin, good.buyMax),
        sell: rollInt(rng, good.sellMin, good.sellMax),
      });
    }
  }
  return shuffleDeck(rng, deck);
}

// Deal the opening market row from the top of the deck.
export function dealMarket(deck, size = MARKET_SIZE) {
  const market = [];
  while (market.length < size && deck.length > 0) {
    market.push(deck.pop());
  }
  return market;
}

// Top the market row back up to its size after a buy or a Tea bonus draw.
export function refillMarket(state) {
  while (state.market.length < MARKET_SIZE && state.deck.length > 0) {
    state.market.push(state.deck.pop());
  }
}
