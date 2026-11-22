// Deterministic randomness: one seeded generator for the whole game.
// The game never calls Math.random, so a seed replays the same market.

// mulberry32: small, fast, good enough for shuffling a deck of cards.
export function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Whole number in [min, max], inclusive, from the game's rng.
export function rollInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Pick one element of an array with the game's rng.
export function rollPick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Fisher-Yates shuffle, in place, driven by the game's rng.
export function shuffleDeck(rng, cards) {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
  return cards;
}
