# Data Model: Game Shop with Coins and Items

**Feature**: 001-game-shop | **Date**: 2026-03-28

## Entities

### Coin (in-level object)

| Field     | Type    | Description                              |
|-----------|---------|------------------------------------------|
| x         | number  | Horizontal position in the level         |
| y         | number  | Vertical position in the level           |
| width     | number  | Collision width (default: 20)            |
| height    | number  | Collision height (default: 20)           |
| collected | boolean | Whether the coin has been picked up      |

**Defined in**: `levels[]` array in script.js, as `coins: [{ x, y, width, height }]`
**Runtime state**: `collected` is set to `true` on pickup, resets on level reload

### Shop Item Definition (static catalog)

| Field       | Type   | Description                                         |
|-------------|--------|-----------------------------------------------------|
| id          | string | Unique key (e.g., "doubleJump", "shield")           |
| name        | string | Display name (e.g., "Double Jump")                  |
| description | string | What the item does                                  |
| price       | number | Cost in coins                                       |
| type        | string | "permanent" or "consumable"                         |
| effect      | string | Effect identifier used in game logic                |

**Defined in**: `SHOP_ITEMS` constant array in shop.js (and referenced in script.js)

### Save Data (localStorage)

| Field       | Type     | Description                                    |
|-------------|----------|------------------------------------------------|
| coins       | number   | Total coin balance                             |
| items       | string[] | Array of owned item IDs (duplicates = multiple) |

**Key**: `"oldFartJumper_save"`
**Format**: JSON string

## State Transitions

### Coin Lifecycle
```
[Placed in level] → [Player touches] → [collected=true, tempCoins++, disappears]
                                         ↓ on level win → coins added to save
                                         ↓ on death → tempCoins discarded
```

### Item Purchase Flow
```
[Shop displayed] → [Player clicks Buy] → [coins >= price?]
                                           ↓ YES → deduct coins, add item to save
                                           ↓ NO → show "insufficient coins" message
```

### Item Effect Activation
```
[Level loads] → [Check save data for owned items]
                 ↓ permanent item → modify player stats
                 ↓ consumable item → set flag, consume on trigger
```

## Relationships

- **Level → Coins**: Each level definition contains 0-N coins (hand-placed)
- **Save Data → Shop Items**: Save data references items by ID
- **Player → Items**: Player stats modified at level load based on owned items
