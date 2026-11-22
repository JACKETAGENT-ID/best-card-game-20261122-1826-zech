// Game tuning: board size, economy, goods catalog and demand.
// One job: every number the rules use lives here, nowhere else.

// Canvas playfield (fixed internal resolution; CSS scales it).
export const TABLE_WIDTH = 1280;
export const TABLE_HEIGHT = 800;

// Economy.
export const START_COINS = 30;
export const TARGET_COINS = 150;
export const MAX_DAYS = 8;
export const HAND_LIMIT = 6;
export const MARKET_SIZE = 4;
export const DECK_COPIES_PER_GOOD = 6;

// Demand multipliers rolled fresh each day, one per good.
export const DEMAND_STEPS = [0.8, 1.0, 1.2, 1.5];

// A good: its name, table colour, table shape, price range and effect text.
// Colour AND shape tell goods apart, never text alone.
export const GOODS = {
  grain: {
    name: 'Grain', color: '#e8b93c', dark: '#8a6d1d', shape: 'circle',
    buyMin: 4, buyMax: 7, sellMin: 6, sellMax: 9,
    effect: 'Staple: buy −2 coins',  },
  spice: {
    name: 'Spice', color: '#e5484d', dark: '#7d1f24', shape: 'diamond',
    buyMin: 6, buyMax: 10, sellMin: 9, sellMax: 13,
    effect: 'Hot: +3 when sold',
  },
  silk: {
    name: 'Silk', color: '#b678e8', dark: '#5d2f86', shape: 'star',
    buyMin: 8, buyMax: 12, sellMin: 11, sellMax: 16,
    effect: 'Fine: +2 with a pair',
  },
  tea: {
    name: 'Tea', color: '#4caf6d', dark: '#1f5c33', shape: 'triangle',
    buyMin: 5, buyMax: 8, sellMin: 7, sellMax: 11,
    effect: 'Calm: +1 free card to hand',
  },
  gems: {
    name: 'Gems', color: '#38b6d6', dark: '#155e73', shape: 'square',
    buyMin: 12, buyMax: 18, sellMin: 16, sellMax: 24,
    effect: 'Rare: first sale pays x2',
  },
  wine: {
    name: 'Wine', color: '#c94f7c', dark: '#6e2140', shape: 'heart',
    buyMin: 7, buyMax: 11, sellMin: 10, sellMax: 15,
    effect: 'Aged: +4 from day 5',
  },
};

export const GOOD_KEYS = Object.keys(GOODS);
