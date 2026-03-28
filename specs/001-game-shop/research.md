# Research: Game Shop with Coins and Items

**Feature**: 001-game-shop | **Date**: 2026-03-28

## R1: Persistence Strategy

**Decision**: Use `localStorage` with a single JSON key `"oldFartJumper_save"`
**Rationale**: The project is vanilla JS with no backend. localStorage is universally supported, synchronous, and simple. A single JSON object avoids key sprawl.
**Alternatives considered**:
- sessionStorage — rejected: data lost when tab closes
- IndexedDB — rejected: overkill for small save data
- Cookies — rejected: size limits, sent with requests

**Save data structure**:
```json
{
  "coins": 150,
  "items": ["doubleJump", "shield", "shield", "speedBoost"],
  "shieldCount": 2
}
```
Permanent items appear once. Consumable items (shield) can appear multiple times (one per purchase).

## R2: Coin Placement Strategy

**Decision**: Define coins as arrays in each level definition (same pattern as `platforms` and `spikes`)
**Rationale**: Matches existing level data structure. Hand-placed coins ensure they're in challenging but reachable positions.
**Alternatives considered**:
- Random placement — rejected: user wants coins to be "hard to reach", which requires intentional design
- Procedural along platforms — rejected: would place coins in easy spots

**Per-level coin counts**: 3-5 coins per level, increasing difficulty of placement in later levels.

## R3: Coin Collection Flow

**Decision**: Coins collected during a level are tracked in a temporary counter. On level win, they are added to the persistent balance. On death, they are lost.
**Rationale**: This matches the user's requirement that coins are "hard to get" — dying means losing progress, adding risk/reward.
**Alternatives considered**:
- Instant save on collect — rejected: removes risk, makes coins too easy to farm
- Save on checkpoint — rejected: no checkpoint system exists

## R4: Item Effects Integration

**Decision**: Check owned items at level load and modify player properties accordingly. Effects are applied in `loadLevel()` and checked in `update()`.
**Rationale**: Minimal changes to game loop. Each item maps to a simple parameter change:
- **Double Jump**: Add `hasDoubleJump` flag, allow second jump when airborne
- **Shield**: Add `hasShield` flag, on spike hit consume shield instead of dying
- **Speed Boost**: Multiply `player.speed` by 1.3
- **Extra Dash**: Multiply dash cooldown by 0.5
- **Magnet**: In update loop, move nearby coins toward player

## R5: Shop UI Pattern

**Decision**: Separate `shop.html` page with its own `shop.js`, styled with existing `style.css`
**Rationale**: Matches existing multi-page architecture (index.html, levels.html, game.html). Each page is standalone with its own script.
**Alternatives considered**:
- Canvas-rendered shop inside game — rejected: complex, doesn't match existing HTML-based menus
- Modal overlay on levels.html — rejected: clutters existing page

## R6: Coin Visual & Audio

**Decision**: Animated coin rendered as a yellow circle with shimmer effect on canvas (no external sprite required initially). Coin collect sound as short .wav.
**Rationale**: Keeps it simple. Can upgrade to sprite later. Yellow circle is universally recognized as a coin in platformers.
**Alternatives considered**:
- Sprite sheet animation — rejected: adds asset dependency, can be added later
