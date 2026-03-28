# Implementation Plan: Game Shop with Coins and Items

**Branch**: `001-game-shop` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-game-shop/spec.md`

## Summary

Add an in-game economy: collectible coins placed at hard-to-reach positions in each level, a shop screen where players buy gameplay-modifying items (Double Jump, Shield, Speed Boost, Extra Dash, Magnet), and integration of purchased item effects into the game loop. Persistence via localStorage.

## Technical Context

**Language/Version**: JavaScript (ES6+, vanilla — no bundler)
**Primary Dependencies**: None (vanilla HTML/CSS/JS, Canvas 2D API)
**Storage**: localStorage for coin balance and purchased items
**Testing**: Manual browser testing (no test framework in project)
**Target Platform**: Desktop browsers (served via local HTTP server)
**Project Type**: Browser-based 2D platformer game (multi-page HTML)
**Performance Goals**: 60 fps game loop (already achieved)
**Constraints**: No build tools, no npm, no frameworks — pure vanilla JS
**Scale/Scope**: 6 levels, single-player, local-only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not configured (default template only). No gates to enforce. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/001-game-shop/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
./
├── index.html           # Main menu (add Shop button)
├── levels.html          # Level select (add Shop button)
├── game.html            # Game canvas (add coin HUD)
├── shop.html            # NEW: Shop screen
├── script.js            # Game logic (add coins, item effects, persistence)
├── shop.js              # NEW: Shop UI logic
├── style.css            # Styles (add shop styles, coin HUD)
├── coin.png             # NEW: Coin sprite
├── coin.wav             # NEW: Coin collect sound
├── dedek.png            # Player sprite (existing)
├── skikes.png           # Spike sprite (existing)
└── serve.sh             # Dev server (existing)
```

**Structure Decision**: Flat file structure matching the existing project pattern. One new HTML page (shop.html) with its own JS file (shop.js). Game logic additions go into the existing script.js. Shared persistence logic (localStorage read/write) is duplicated between script.js and shop.js to avoid introducing a module system.
