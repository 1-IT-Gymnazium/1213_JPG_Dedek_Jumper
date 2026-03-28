# Tasks: Game Shop with Coins and Items

**Input**: Design documents from `/specs/001-game-shop/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No test framework in project. Tests are manual (browser-based).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Persistence system and shared constants used by all features

- [x] T001 Implement save/load helper functions (getSave, setSave) using localStorage key "oldFartJumper_save" in script.js
- [x] T002 [P] Define SHOP_ITEMS catalog constant (id, name, description, price, type, effect) in script.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Coin HUD display and save data integration into existing game flow

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add coin counter HUD element to game.html (inside .ui div, alongside score/timer/level)
- [x] T004 Add coin counter styling to style.css (position, font, coin icon)
- [x] T005 Load player save data on game start in script.js loadLevel() and display total coins in HUD

**Checkpoint**: Foundation ready — HUD shows coin count, save/load works, item catalog defined

---

## Phase 3: User Story 1 - Collecting Coins in Levels (Priority: P1) 🎯 MVP

**Goal**: Players can collect coins placed at hard-to-reach positions in levels. Coins are saved on level completion and lost on death.

**Independent Test**: Play a level, collect coins visible in HUD, complete level — coins persist. Die — coins from that attempt are lost.

### Implementation for User Story 1

- [x] T006 [US1] Add coins array to each level definition (3-5 coins per level at hard-to-reach positions) in script.js levels[]
- [x] T007 [US1] Add levelCoins runtime array and tempCoins counter variables to script.js
- [x] T008 [US1] Implement coin rendering in draw() function in script.js — yellow circle with shimmer, offset by cameraX
- [x] T009 [US1] Implement coin collision detection in update() function in script.js — mark collected, increment tempCoins, play sound
- [x] T010 [US1] Add coin collect sound effect (create coin.wav or reuse existing sound) and load in sounds object in script.js
- [x] T011 [US1] Update win condition in update() to save tempCoins to persistent balance via setSave() before navigating to next level in script.js
- [x] T012 [US1] Update resetGame() in script.js to reset tempCoins and restore coin collected states on death
- [x] T013 [US1] Update HUD coin display in real-time during gameplay (total + tempCoins) in script.js loop

**Checkpoint**: Coins are collectible in all 6 levels, saved on win, lost on death, displayed in HUD

---

## Phase 4: User Story 2 - Browsing and Buying Items in the Shop (Priority: P2)

**Goal**: Players can access a shop screen, view items with prices, and purchase items with collected coins.

**Independent Test**: Navigate to shop from menu, see items and coin balance, buy an item, verify coins deducted and item owned.

### Implementation for User Story 2

- [x] T014 [P] [US2] Create shop.html with item grid layout, coin balance display, and back-to-menu button
- [x] T015 [P] [US2] Add shop page styles to style.css — item cards, prices, buy buttons, owned/disabled states, coin balance header
- [x] T016 [US2] Create shop.js — load save data, render SHOP_ITEMS catalog with prices and ownership status, handle buy button clicks
- [x] T017 [US2] Implement purchase logic in shop.js — validate sufficient coins, deduct coins, add item to save data, update UI
- [x] T018 [US2] Implement insufficient coins feedback in shop.js — show message or disable buy button when player can't afford
- [x] T019 [US2] Show "Owned" badge on purchased permanent items, disable re-purchase in shop.js
- [x] T020 [US2] Allow re-purchase of consumable items (Shield) — increment count in save data in shop.js
- [x] T021 [P] [US2] Add "Shop" button to index.html main menu (menuButtons div)
- [x] T022 [P] [US2] Add "Shop" button to levels.html level select screen

**Checkpoint**: Shop is fully browsable and functional, purchases persist, accessible from menu and level select

---

## Phase 5: User Story 3 - Using Purchased Items in Levels (Priority: P3)

**Goal**: Purchased items modify gameplay — double jump, shield, speed boost, extra dash, magnet.

**Independent Test**: Purchase each item, enter a level, verify the gameplay effect works correctly.

### Implementation for User Story 3

- [x] T023 [US3] Load owned items from save data in loadLevel() and set player flags (hasDoubleJump, hasShield, hasSpeedBoost, hasExtraDash, hasMagnet) in script.js
- [x] T024 [US3] Implement Double Jump effect — allow second jump when airborne if hasDoubleJump is true, reset on grounded in update() in script.js
- [x] T025 [US3] Implement Shield effect — on spike collision, if hasShield, consume shield (decrement in save), set invincible briefly instead of dying in update() in script.js
- [x] T026 [US3] Implement Speed Boost effect — multiply player.speed by 1.3 in loadLevel() if hasSpeedBoost in script.js
- [x] T027 [US3] Implement Extra Dash effect — multiply dashCooldown reset value by 0.5 if hasExtraDash (level >= 2) in script.js
- [x] T028 [US3] Implement Magnet effect — in update(), if hasMagnet, move uncollected coins within radius toward player position in script.js
- [x] T029 [US3] Add active item indicators to game HUD in game.html and script.js draw() — show icons for owned items

**Checkpoint**: All 5 items have visible, functional gameplay effects

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Refinements that improve overall experience

- [x] T030 [P] Tune coin placement positions in all 6 levels for difficulty balance in script.js levels[]
- [x] T031 [P] Tune item prices for gameplay balance in SHOP_ITEMS catalog in script.js
- [x] T032 Run quickstart.md validation — test full flow: collect coins → buy item → use item in level

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (save/load helpers) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 1 (SHOP_ITEMS, save/load) — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Phase 1 (SHOP_ITEMS, save/load) — benefits from US1 (coins to test with) and US2 (shop to buy items)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 1 — Independent of US1 (shop works even with 0 coins)
- **User Story 3 (P3)**: Can start after Phase 1 — Functionally independent but best tested after US1+US2 (needs coins and shop to acquire items)

### Within Each User Story

- UI/HTML tasks can run in parallel with logic tasks (different files)
- Core gameplay logic before polish/indicators
- Commit after each task or logical group

### Parallel Opportunities

- T001 and T002 can run in parallel (Phase 1)
- T003 and T004 can run in parallel (Phase 2, different files)
- T014, T015, T021, T022 can run in parallel (US2, different files)
- T030 and T031 can run in parallel (Phase 6)
- US1 and US2 can be worked on in parallel after Phase 2

---

## Parallel Example: User Story 2

```bash
# Launch HTML/CSS tasks together (different files):
Task: "T014 — Create shop.html"
Task: "T015 — Add shop styles to style.css"
Task: "T021 — Add Shop button to index.html"
Task: "T022 — Add Shop button to levels.html"

# Then sequentially: shop.js logic (T016-T020)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005)
3. Complete Phase 3: User Story 1 (T006-T013)
4. **STOP and VALIDATE**: Play levels, collect coins, verify save/death behavior
5. Coins are working — game has new collectible content

### Incremental Delivery

1. Setup + Foundational → Save system and HUD ready
2. Add User Story 1 → Coins collectible → Playable increment
3. Add User Story 2 → Shop functional → Players can spend coins
4. Add User Story 3 → Items work in gameplay → Full feature complete
5. Polish → Balance tuning → Ship-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All file modifications target existing flat structure (no new directories except specs/)
- SHOP_ITEMS is defined in script.js and duplicated/imported in shop.js (no module system)
- Coin positions should prioritize challenge — high platforms, near spikes, off main path
- Shield is the only consumable item; all others are permanent (one-time purchase)
