# Feature Specification: Game Shop with Coins and Items

**Feature Branch**: `001-game-shop`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Rad bych mel ve hre obchod, kde si hrac kupuje nejaky predmety, ktery mu bud ulehcujou hru a nebo dostanou se pres tezke pasaze, pres ktere by se normalne nedostali. mena by mela byt mince, ktere budou tezce dosazitelne v levelech"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Collecting Coins in Levels (Priority: P1)

As a player, I want to collect coins placed in hard-to-reach spots within levels so that I earn currency for the shop. Coins are placed in challenging positions — on high platforms, behind obstacles, or in risky areas near spikes — making them a reward for skilled play.

**Why this priority**: Coins are the foundation of the shop economy. Without coin collection, the shop has no purpose. This must work first.

**Independent Test**: Can be fully tested by playing a level, reaching a coin, and verifying the coin count increases. Delivers value by rewarding exploration and skilled play.

**Acceptance Scenarios**:

1. **Given** a player is in a level with coins, **When** the player touches a coin, **Then** the coin disappears and the player's coin count increases by 1
2. **Given** a player has collected coins in a level, **When** the player completes the level, **Then** the collected coins are saved and persist across levels
3. **Given** a player dies in a level, **When** the player restarts, **Then** coins collected during that attempt are lost (coins reset with the level)
4. **Given** a level is loaded, **When** coins are rendered, **Then** they appear in hard-to-reach locations (high platforms, near hazards, off the main path)

---

### User Story 2 - Browsing and Buying Items in the Shop (Priority: P2)

As a player, I want to access a shop screen where I can see available items, their prices, and my coin balance, so that I can purchase items to help me in difficult levels.

**Why this priority**: The shop is the core feature — it connects coins to gameplay items. Without it, coins have no purpose.

**Independent Test**: Can be fully tested by navigating to the shop, viewing items with prices, purchasing an item, and verifying the coin balance decreases and the item is marked as owned.

**Acceptance Scenarios**:

1. **Given** the player is on the level selection or menu screen, **When** the player clicks the shop button, **Then** the shop screen opens showing available items, their prices, and the player's coin balance
2. **Given** the player has enough coins, **When** the player purchases an item, **Then** the coins are deducted and the item is added to the player's inventory
3. **Given** the player does not have enough coins, **When** the player tries to buy an item, **Then** the purchase is blocked and a message indicates insufficient coins
4. **Given** the player already owns an item, **When** viewing the shop, **Then** the item is shown as "owned" and cannot be purchased again

---

### User Story 3 - Using Purchased Items in Levels (Priority: P3)

As a player, I want to use items I purchased in the shop during gameplay so that I can overcome difficult passages that would otherwise be impassable.

**Why this priority**: This delivers the payoff of the entire shop system — items must actually affect gameplay to be valuable.

**Independent Test**: Can be fully tested by purchasing an item, entering a level, activating the item, and verifying the gameplay effect (e.g., double jump reaches a higher platform, shield survives a spike hit).

**Acceptance Scenarios**:

1. **Given** the player owns a usable item, **When** starting a level, **Then** the item's effect is active or available for activation
2. **Given** the player activates a consumable item, **When** the effect is used, **Then** the item is consumed and removed from inventory
3. **Given** the player owns a permanent item, **When** playing any level, **Then** the item's effect is always active

---

### Edge Cases

- What happens when the player collects a coin and immediately dies in the same frame? — Coin is lost (death takes priority).
- What happens when the player has maximum coins and collects more? — No maximum cap; coins accumulate without limit.
- What happens when the player refreshes the browser mid-level? — Coins from the current attempt are lost; previously saved coins persist.
- What happens when browser storage is cleared? — Coins and purchased items are lost (acceptable for a browser game).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display collectible coins at predefined hard-to-reach positions within each level
- **FR-002**: System MUST detect collision between the player and coins, removing the coin and incrementing the player's coin count
- **FR-003**: System MUST play a sound effect when a coin is collected
- **FR-004**: System MUST persist the player's total coin count and purchased items between sessions
- **FR-005**: System MUST provide a shop screen accessible from the level selection or menu screen
- **FR-006**: Shop MUST display all available items with name, description, price, and ownership status
- **FR-007**: Shop MUST display the player's current coin balance
- **FR-008**: System MUST prevent purchases when the player has insufficient coins
- **FR-009**: System MUST apply gameplay effects for owned items during level play
- **FR-010**: System MUST reset coins collected in a level if the player dies (coins earned during a failed attempt are not saved)
- **FR-011**: System MUST save coins to the player's balance only upon completing a level successfully
- **FR-012**: System MUST display the current coin count during gameplay (HUD element)

### Item Catalog

The shop offers these items:

| Item         | Type       | Effect                                                      | Price    |
|--------------|------------|-------------------------------------------------------------|----------|
| Double Jump  | Permanent  | Allows the player to jump a second time while airborne      | 50 coins |
| Shield       | Consumable | Survives one spike hit without dying (single use per level)  | 20 coins |
| Speed Boost  | Permanent  | Increases player movement speed by 30%                      | 40 coins |
| Extra Dash   | Permanent  | Reduces dash cooldown by 50% (available from Level 3 onward) | 60 coins |
| Magnet       | Permanent  | Coins within a radius are automatically attracted to player  | 80 coins |

### Key Entities

- **Coin**: A collectible object placed in a level at a specific position. Attributes: position (x, y), collected status, visual appearance (animated/shiny)
- **Shop Item**: A purchasable gameplay modifier. Attributes: name, description, price, type (permanent/consumable), effect, ownership status
- **Player Inventory**: The player's collection of owned items and coin balance. Persisted between sessions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can collect coins during gameplay and see their coin count update in real time on the HUD
- **SC-002**: Players can open the shop, browse items, and complete a purchase in under 30 seconds
- **SC-003**: Purchased permanent items visibly affect gameplay immediately upon entering a level
- **SC-004**: Coins are placed in locations that require skill to reach — at least 50% of coins per level are off the main path
- **SC-005**: Player progress (coins, items) persists across browser sessions without data loss under normal use
- **SC-006**: All 5 shop items are available and functional

## Assumptions

- The game runs in a single browser; there is no server-side storage or multiplayer — local browser storage is sufficient for persistence
- Coin positions are hand-designed per level (not randomly generated) to ensure they reward skilled play
- The existing level structure and progression system remain unchanged
- Sound effects for coin collection will follow the same pattern as existing game sounds (short .wav files)
- The shop is a separate HTML page or overlay, consistent with the existing multi-page structure (index.html, game.html, levels.html)
- Item balancing (prices, effects) may need adjustment after playtesting — initial values are starting points
