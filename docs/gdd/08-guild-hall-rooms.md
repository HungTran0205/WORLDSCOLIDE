# 08 — Guild Hall & Rooms

**Code refs:** `src/game/data/facility-definitions.ts`, `src/game/systems/building-system.ts`, `src/game/systems/facility-production-system.ts`

## Overview

The guild hall is the player's home base. Facilities (rooms) are discrete zones within it, each serving a distinct gameplay function — recruitment, production, crafting, healing, or storage. Rooms are built once and optionally upgraded up to level 3.

## Grid Placement

The guild hall uses a tile-based coordinate system (`FloorTile {x, z}`). Building rules are enforced by `src/game/systems/building-system.ts`:

- New tiles must be **adjacent** (4-direction) to at least one existing tile — `checkTileAdjacency()`
- A tile is **occupied** if any furniture footprint covers it — `isCellOccupiedByFurniture()`
- World bounds are computed from the current tile set — `getWorldBounds()`

Each facility has a world-space anchor (`zonePosition [x, y, z]`) and a tile footprint (`[width, depth]`) defined in `FACILITY_DEFINITIONS`. Facilities do not overlap — placement is validated before build confirmation.

## Facility Registry

All facilities defined in `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS`:

| Facility | Type key | Build cost | Material | Max slots (lv1/2/3) | Primary stats |
|----------|----------|-----------|----------|----------------------|---------------|
| Tavern | `tavern` | 0g | 200 WOOD | 1 / 2 / 2 | CHA |
| Workshop | `workshop` | 250g | 50 WOOD | 1 / 2 / 3 | STR + DEX |
| Logging Site | `logging-site` | 0g (permit) | — | 1 / 2 / 3 | STR + WC Skill |
| Stone Quarry | `stone-quarry` | 500g | 20 WOOD | 1 / 2 / 3 | STR + LCK |
| Alchemy Lab | `alchemy-lab` | 350g | 20 STONE + 50 WOOD | 1 / 2 / 3 | INT + DEX |
| Infirmary | `infirmary` | 500g | 50 STONE + 50 WOOD | 1 / 2 / 3 (beds) | — (no worker) |
| Training Yard | `training-yard` | 250g | — | 2 / 3 / 4 | DEX + AGI |

> Training Yard: passive EXP gain only — no dedicated room file; requires guild level 3.
> Inventory (guild storage) is always available — no build required.

## Room-Effect Model

Facilities produce effects through two mechanisms:

**1. Continuous per-tick production** (driven by `facility-production-system.ts`):
- Logging Site: `processLoggingSiteTick()` — wood from finite reserve, WC XP
- Stone Quarry: `processStoneQuarryTick()` — infinite stone, vein strikes, MC XP
- Both called every 1 s real-time (`use-game-tick-loop.ts`); results applied via store actions

**2. Queue-based crafting** (not auto-produced):
- Workshop: task queue consumed by workers — `workshop-system.ts`
- Alchemy Lab: per-member daily batch formula — `alchemy-production-system.ts`

**Not a production room:**
- Tavern: visitor spawn / negotiation system
- Infirmary: bed/queue injury recovery (beds heal fast by level, queue heals slow); see [`rooms/infirmary.md`](rooms/infirmary.md)
- Training Yard: passive daily EXP tick <!-- TODO: verify training-yard EXP formula against code -->

## Member Assignment

Members assigned to a facility contribute their primary stats to its production or effect. Assignment is stored in `GuildFacility.assignedMemberIds[]`. Rules:
- A member can only be in one facility at a time
- Injured members (`status === 'injured'`) cannot be assigned to production rooms
- Mercs (tavern contracts) cannot be assigned to production rooms

## Upgrade Path

Each facility supports 0→1 (build) and optionally 1→2 and 2→3 upgrades. Upgrade costs are defined per-facility in `upgradeCosts: [lv1→2, lv2→3]`. Upgrading increases `maxSlots` and facility-specific bonuses (speed, output, slots).

State managed in `src/game/state/facility-zone-slice.ts` and `build-mode-slice.ts`.

## Per-Room Detail Files

| Room | File |
|------|------|
| Tavern | [`rooms/tavern.md`](rooms/tavern.md) |
| Workshop | [`rooms/workshop.md`](rooms/workshop.md) |
| Alchemy Lab | [`rooms/alchemy.md`](rooms/alchemy.md) |
| Infirmary | [`rooms/infirmary.md`](rooms/infirmary.md) |
| Inventory | [`rooms/inventory.md`](rooms/inventory.md) |
| Logging Site | [`rooms/wood-mining.md`](rooms/wood-mining.md) |
| Stone Quarry | [`rooms/stone-quarry.md`](rooms/stone-quarry.md) |
