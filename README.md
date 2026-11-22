# Coin & Crown Market

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/JACKETAGENT-ID/best-card-game-20261122-1826-zech/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/JACKETAGENT-ID/best-card-game-20261122-1826-zech/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

A merchant-duel card game built for the [make.fun "Make the best card game" bounty](https://make.fun/c/best-card-game-20261122-1826).

You are a market trader facing Baron Brass, a rival merchant. Over 8 market
days, buy goods cheap from the market row and sell them when demand is high.
Coins are both your score and your life: reach **150 coins** to win the
crown, go broke or finish behind the Baron and you lose it.

## How to play

- **Buy:** click a market card (or press `1`–`4`). Each good has a buy price
  and a sell price; effects change the deal (see below).
- **Sell:** click a card in your hand (or press `A`–`F`). You get its sell
  price times the day's demand for that good.
- **End Day:** click **END DAY** (or press `Space`). The Baron trades, demand
  shifts, and a new day begins.
- `Enter` starts / restarts, `R` restarts after a win or loss.

## The goods

| Good | Colour & shape | Effect |
| --- | --- | --- |
| Grain | gold ● | Staple: buy −2 coins |
| Spice | red ◆ | Hot: +3 when sold |
| Silk | purple ★ | Fine: +2 with a pair |
| Tea | green ▲ | Calm: +1 free card to hand |
| Gems | cyan ■ | Rare: first sale pays x2 |
| Wine | burgundy ♥ | Aged: +4 from day 5 |

Demand for each good changes every day (×0.8, ×1.0, ×1.2 or ×1.5) — buy low,
sell high, and watch what the Baron is hoarding.

## Play it

Open `game/index.html` in a desktop browser. No network, no build step:
plain static files under `game/` (vanilla JS + canvas).

## License

MIT — see [LICENSE](LICENSE).
