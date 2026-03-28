# Quickstart: Game Shop with Coins and Items

**Feature**: 001-game-shop | **Date**: 2026-03-28

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari)
- Python 3 (for local HTTP server)

## Running the Game

```bash
cd /Users/max323/workspace/OldFartJumper
./serve.sh
```

This starts a local server at `http://localhost:8080` and opens the browser.

## Testing the Feature

### Coins
1. Start a level from the level select screen
2. Look for yellow coins placed on high platforms or near hazards
3. Walk/jump into a coin — it should disappear and the coin counter in the HUD should increase
4. Complete the level — coins should persist (check via shop screen)
5. Die in a level — coins from that attempt should be lost

### Shop
1. From the main menu or level select, click the "Shop" button
2. Browse available items — each shows name, description, price
3. Purchase an item (if you have enough coins)
4. Verify coin balance decreases and item shows as "owned"

### Item Effects
1. Purchase "Double Jump" → enter a level → press Space while airborne → should jump again
2. Purchase "Shield" → enter a level → hit a spike → should survive (once)
3. Purchase "Speed Boost" → enter a level → movement should be visibly faster
4. Purchase "Extra Dash" → enter Level 3+ → dash cooldown should be shorter
5. Purchase "Magnet" → enter a level → nearby coins should fly toward you

## Key Files

| File       | Purpose                              |
|------------|--------------------------------------|
| script.js  | Game logic, coins, item effects      |
| shop.html  | Shop screen UI                       |
| shop.js    | Shop purchase logic                  |
| style.css  | Shared styles including shop         |

## Clearing Save Data

Open browser console and run:
```js
localStorage.removeItem("oldFartJumper_save");
```
