# Project Changelog

All notable changes to Worlds Collide are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/).

**Current Version**: 1.10
**Release Date**: 2026-03-23 (Building System Refactor — Tile-Based Architecture)

---

## [1.10] — 2026-03-23 (Building System Refactor — Tile-Based Architecture)

### Major Refactor

#### Removed Room/RoomType Abstraction (Breaking Change)
- **Removed**: Fixed 6x6 room blocks with RoomType classification
- **Removed**: Room placement UI + room movement mechanics
- **Removed**: Room-specific panel access (onRoomClick obsolete)
- **Removed**: Multi-room grid cells logic (replaced with flat tile array)
- **Impact**: Saves v9→v10 migration required (compresses rooms → tiles+furniture)

#### New Floor Tile System (Major Feature)
- **FloorTile Array**: `guild.floorTiles: FloorTile[]` — Individual colored tiles at (x, z)
- **Paint Mode**: Click-to-paint color palette (5g per tile)
- **Erase Mode**: Click-to-erase tiles (blocked if furniture occupies)
- **Default Floor**: 6x6 gold floor auto-created on new games (36 tiles = #DAA520 color)
- **No Adjacency**: Tiles placed freely (no adjacency requirement, unlike rooms)
- **Cost**: 5g per tile (FLOOR_TILE_COST constant)

#### Refactored Furniture System (Major Feature)
- **Guild-Level Array**: `guild.furniture: PlacedFurniture[]` — Flat list (not nested per room)
- **New PlacedFurniture**: `{ id, type, level, position: { x, z }, rotation }`
- **Floor Validation**: Furniture must have floor tile underneath (mandatory)
- **Guild Level Unlock**: Each furniture type has `unlockedAtLevel` gate
- **Max Per Guild**: Each furniture type has max count limit (at guild level, not per-room)
- **No Per-Room Nesting**: Furniture tracked at guild level, not scoped to rooms
- **Placement Cost**: Validates gold + items from FurnitureDefinition.cost

#### Build Menu Refactor (UI Update)
- **Floor Tab**: Color palette for paint/erase modes
  - Shows current floor tile count
  - Color selector + paint/erase toggle buttons
- **Furniture Tab**: All furniture with level unlock badges
  - Filtered by guild.level >= unlockedAtLevel
  - Click to select → shows ghost preview at cursor
- **No Room Selection**: Rooms tab removed entirely

#### Build Overlay Changes (UI Update)
- **3 Modes**: floor-tile (paint), erase-tile (erase), furniture (place)
- **Ghost Preview**: Shows single cell for tiles, 1x1 box for furniture
- **Validation Color**: Green (valid) / Red (invalid)
  - Floor tile: checks cell not occupied
  - Erase: checks furniture not occupying
  - Furniture: checks floor exists + level unlocked + no overlap + cost OK

#### Furniture Effects Renamed (File Refactor)
- **Renamed**: `room-effects.ts` → `furniture-effects.ts`
- **Function Rename**: `calcRoomBonuses()` → `calcFurnitureBonuses()`
- **Logic Change**: Iterates `guild.furniture[]` (flat) instead of `guild.rooms[]`
- **Bonus Application**: Same bonus logic, applied from furniture array now
- **Example Effects**:
  - quest-board: +10% mission gold reward
  - tavern-counter: shows tavern panel when placed (not when room exists)
  - training: +5% combat EXP

#### Tutorial First-Build Step
- **Old Trigger**: `rooms.length > 1` (place 2+ rooms)
- **New Trigger**: `floorTiles.length > 36` (paint full 6x6 grid)
- **Progression**: Paint floor → unlock furniture placement tutorial

#### Panel Access Changes (Breaking)
- **Removed**: onRoomClick handlers (no room objects to click)
- **Panel Access Method**: HUD toggle bar buttons only
  - Quest Board → Button in HUD
  - Roster → Button in HUD
  - Build → Button in HUD
  - Tavern → Appears when bar-counter furniture placed (furniture effect trigger)
- **No Direct 3D Interaction**: Panels accessed only via HUD buttons, not by clicking scene objects

#### Save Migration v9 → v10 (Complex)
- **Version Bump**: `SAVE_VERSION` incremented from 9 to 10
- **Auto-Migration**: `migrateV9toV10()` runs on load
  - Flattens `guild.rooms[]` into `guild.floorTiles[]` + `guild.furniture[]`
  - For each room: generates tiles covering room bounds with room color
  - For each room's furniture: copies to guild.furniture[] with absolute position
  - Adjusts furniture positions from room-relative to guild-absolute
  - Clears old `rooms` field
- **Position Recalculation**: Room bounds (x, z, width, depth) → individual tile (x, z) positions
- **Backward Compatibility**: v9 saves load with transparent migration (auto-triggered)
- **Data Loss**: None (all room data recoverable from tiles + furniture array)

### Changed

#### Guild State (guild-slice.ts)
- **Removed Fields**: `guildHall.rooms: Room[]`
- **New Fields**: `guildHall.floorTiles: FloorTile[]`, `guildHall.furniture: PlacedFurniture[]`
- **New Actions**:
  - `placeFloorTile(x, z, color)` — Paint a tile (5g cost)
  - `eraseFloorTile(x, z)` — Erase if no furniture
  - `placeFurniture(type, pos, rotation)` — Place furniture (validates floor + cost)
  - `removeFurniture(furnitureId)` — Remove by ID from flat array
  - `upgradeFurniture(furnitureId)` — Level up furniture

#### Build Mode Slice (build-mode-slice.ts)
- **Removed**: `startMovingRoom()`, `startPlacement()` (room-centric)
- **New**: `startFloorTilePlacement(color)`, `startErasePlacement()`
- **Updated**: `startFurniturePlacement()` — No longer takes targetRoomId
- **activeItem Type**: Changed from `'new-room' | 'move-room' | 'new-furniture'` to `'floor-tile' | 'erase-tile' | 'furniture'`

#### Validation Systems (building-system.ts)
- **Removed**: `checkCellOverlap()`, `checkAdjacency()`, `generateRoomCells()`
- **New**: `canPlaceFurnitureOnFloor()` — Checks floor tile exists at position
- **Removed**: `canPlaceRoom()` (room placement logic gone)
- **Removed**: Room collision + adjacency checking (not applicable to tiles)

#### 3D Scene Rendering (guild-hall.tsx)
- **Removed**: RoomMesh components (no rooms to render)
- **New**: FloorTileMesh components (individual tiles with colors)
- **Simplified**: No room collision visualization needed
- **Grid Visualization**: Still shows grid cells during build mode (unchanged)

#### Furniture System (furniture-system.ts)
- **Removed**: Per-room furniture placement logic
- **New**: Guild-level furniture validation (`canPlaceFurnitureOnFloor()`)
- **Function**: `placeFurniture()` now operates on flat guild.furniture[]

### Fixed

#### Build Mode UX
- **Fixed**: Complex room placement mechanics replaced with simple tile painting
- **Fixed**: No way to customize floor appearance (now fully paintable)
- **Fixed**: Panels required clicking scene objects (now HUD buttons only)

#### Furniture System
- **Fixed**: Furniture tied to rooms (now guild-level, more flexible)
- **Fixed**: Max furniture limits per-room (now per-guild)
- **Fixed**: Furniture level != room level (decoupled: furniture has own level)

### Performance

- **Tile Storage**: O(1) lookup by (x, z) key (can add Set if >1000 tiles)
- **Furniture Storage**: O(n) linear scan where n = furniture count (typically <50)
- **Placement Validation**: O(m) where m = furniture count (checking floor coverage)
- **Migration v9→v10**: One-time cost, no ongoing impact

### Testing

- **New Test Coverage**:
  - Floor tile placement (cost, color, occupied check)
  - Floor tile erase (furniture blocking)
  - Furniture placement on floor (floor requirement)
  - Furniture removal + upgrades
  - Save migration v9→v10 (flattening correctness)
- **Test Count**: Full suite passing (tile + furniture + migration tests)

### Documentation

- Updated `system-architecture.md` with new build mode data flow (tile-based)
- Updated `codebase-summary.md` with FloorTile + PlacedFurniture structures
- Updated `project-changelog.md` (this entry) with v1.10 refactor details
- Renamed documentation references from rooms to tiles/furniture throughout

### Known Issues

None identified in v1.10 release. Floor tile painting, furniture placement, and save migration all tested and working.

### Limitations

- Tile painting is click-by-click (no drag-to-paint mode in v1.10)
- Furniture cannot be moved after placement (remove + re-place)
- No visual grid cell highlighting during paint (just preview color)

### Breaking Changes

- **Removed**: Room/RoomType abstraction entirely
- **Removed**: onRoomClick event handlers
- **Removed**: Room placement UI + room movement
- **Removed**: Room-scoped furniture system
- **Save Incompatibility**: v9 saves auto-migrate to v10 (transparent, one-time)
- **Code Incompatibility**: Any room-referencing systems must update to use tiles/furniture

---

## [1.9] — 2026-03-21 (Milestone 2 Vertical Slice)

### Added

#### Civilizations System (Major Feature)
- **3 Civilizations**: Linh Sơn, Đế Quốc, Thiên Lữ (complete replacement)
- **CIV_CONFIG**: Single source of truth for civilization data
  - Each civ defines stat bonuses, archetype classes, unique hero rosters
- **Character Creation**: Founder and members assigned to civilizations
  - Stat bonuses applied automatically on creation via `applyCivBonuses()`
  - Visual selector in character creation UI
- **Civ Badge Component**: Visual emblem + name display across UI
- **Roster Filtering**: Members can be filtered/sorted by civilization

#### Combat Passives (Major Feature)
- **3 Exclusive Passive Abilities**:
  - **Son The (Linh Sơn)**: +20% max HP per level
  - **Dien The Chi Huy (Đế Quốc)**: +30% EXP gain from missions
  - **Tinh Lo (Thiên Lữ)**: +15% dodge rate in combat
- **Passive Integration**: Automatically applied during combat simulation
- **UI Display**: Passive descriptions in character detail + roster panels
- **Combat Calculation**: Passives modify HP, dodge chance, and EXP rewards

#### Skills Expansion (Major Feature)
- **7 Skills Total** (up from 1)
- **Archetype-Based Organization**: `SKILLS_BY_ARCHETYPE` groups skills per class
- **Skill Variety**: Warrior, Mage, Rogue variants per civilization
- **Combat System**: Skill cooldown, mana, damage scaling, range
- **UI Display**: Full skill cards in character detail panel

#### Enemy Expansion (Major Feature)
- **15 Enemy Types** (up from 5)
  - F tier: 5 enemies
  - E tier: 5 enemies
  - D tier: 5 enemies
- **New Abilities**:
  - **Stun-attack**: Disables target for 1 turn
  - **Enrage**: Increases self damage by 50% for duration
  - **Heal-ally**: Restores HP to nearby enemies
- **Smart AI**: Enemies select targets strategically + use abilities tactically
- **Diverse Loot Tables**: Each enemy drops unique items + materials

#### Mission Expansion (Major Feature)
- **22 Total Missions** (up from 5)
  - F tier: 8 missions
  - E tier: 7 missions
  - D tier: 7 missions
- **2 Gate Bosses**: One-time elite challenges blocking tier progression
- **1 Quest Chain**: Multi-mission narrative story with escalating rewards
- **Mission Variety**: Standard combat, boss encounters, elite gates, story chains
- **Reward Scaling**: Gold + EXP adjust for difficulty tier + quest type
- **Travel Times**: Recalibrated per tier (F=10s, E=15s, D=20s)

#### Audio System Expansion (Major Feature)
- **6 New Audio Keys**:
  - `BGM_COMBAT`: Combat background music
  - `SFX_CRIT`: Critical hit sound effect
  - `SFX_DODGE`: Dodge/miss sound effect
  - `SFX_DEATH`: Enemy defeat sound effect
  - `SFX_SKILL`: Skill usage sound effect
  - `SFX_RECRUIT`: Character recruitment sound effect
- **Integration**: Sounds triggered during combat, recruitment, abilities
- **Audio Manager**: New keys registered in audio-manager.ts

### Changed

#### Character Creation
- **New Field**: `civId: string` on all members (founder + roster)
- **Founder Creation**: Includes civilization selector
- **Stat Bonuses**: Applied based on selected civilization
- **UI Update**: Character creation flow includes civ selection step

#### Combat Simulation
- **Passive Application**: Son The, Dien The Chi Huy, Tinh Lo checked during combat
- **Damage Calculation**: Passives modify damage, dodge, and other formulas
- **EXP Calculation**: Dien The Chi Huy bonus applied to mission rewards
- **HP Calculation**: Son The bonus affects max HP + healing

#### Roster & UI
- **Civ Badges**: All member displays show civilization emblem
- **Filter Options**: Roster can filter by civilization
- **Character Detail**: Shows applied passives + civ bonuses
- **Quest Board**: Displays civilization-specific quest chains

#### Mission System
- **Quest Chain Tracking**: Multi-mission story lines with progression
- **Gate Boss Logic**: One-time bosses unlock higher tiers on completion
- **Mission Variety**: Expanded enemy combinations per mission
- **Reward Scaling**: Adjusted for new mission count + difficulty tier

### Fixed

#### Civilization Representation
- **Fixed**: Old civilizations (Viet/Nordic/Saharan) replaced with lore-appropriate alternatives
- **Fixed**: No way to distinguish member civilizations in UI (now shows badges)
- **Fixed**: Stat bonuses not applied at character creation (now automatic via CIV_CONFIG)

#### Gameplay Progression
- **Fixed**: Limited mission variety (5 missions) → now 22 missions with quest chains
- **Fixed**: Limited enemy types (5) → now 15 enemies with special abilities
- **Fixed**: No audio feedback for combat actions → 6 new sound effects added
- **Fixed**: Skills limited to 1 type → now 7 skills organized by archetype

### Save Migration v8 → v9

- **Version Bump**: `SAVE_VERSION` incremented from 8 to 9
- **Auto-Migration**: `migrateV8toV9()` runs on load
  - Add `civId: string` field to all members
  - Map old civilization names to new IDs (if exists)
  - Ensure founder has valid civId assignment
- **Backward Compatibility**: Old v8 saves load with default civ assignments
- **Transparent**: No user interaction required

### Performance

- **Civilization Config**: O(1) lookup via CIV_CONFIG[civId]
- **Passive Application**: O(1) per passive during combat calc (simple multipliers)
- **Mission Filtering**: O(n) per filter (n = mission count, ~22)
- **Audio Keys**: No performance impact (enum-based registration)

### Testing

- **Civilization Tests**: CIV_CONFIG structure, stat bonus application
- **Passive Tests**: Son The, Dien The Chi Huy, Tinh Lo stat modifications
- **Mission Tests**: Quest chain progression, gate boss unlocks
- **Enemy Tests**: 15 types + abilities, loot generation
- **Audio Tests**: New keys registered, sound playback
- **Full Test Suite**: All systems passing with new features

### Documentation

- Updated `codebase-summary.md` with Milestone 2 features
- Updated `system-architecture.md` with civilization + passive data flows
- Updated `project-changelog.md` (this entry) with v1.9 features
- Updated `development-roadmap.md` Milestone 2 complete status

### Known Issues

None identified in v1.9 release. All civilization, passive, skill, enemy, mission, and audio features tested and working.

### Limitations

- Passives fixed per civilization (no customization)
- Quest chains linear (cannot skip chapters)
- Gate bosses must be defeated sequentially per tier

---

## [1.6] — 2026-03-16 (Roster Management & Combat Enhancements)

### Added

#### Multi-Member Quest Dispatch (Major Feature)
- **Party Size Flexibility**: Dispatch N+ members (above quest minimum) on single mission
- **EXP Sharing**: Reward divided by party size (`Math.max(1, Math.floor(expReward / members.length))`)
  - Larger parties earn less per member; incentivizes focused teams
  - Maintains gold earning (not divided, quest-level reward)
- **Dispatch UI**: Quest detail modal shows member count with "(selected/min+)" format

#### Skill Cooldown Rebalance (Gameplay Adjustment)
- **1-Turn Cooldown System**: Skills now cooldown for `attackIntervalMs * 2` instead of fixed `cooldownMs`
  - Forces minimum 1 normal attack between skill uses
  - Attack speed affects cooldown duration (AGI scaling)
  - Prevents skill spam, encourages turn-based flow
- **Combat Simulator Update**: `combat-simulator.ts` uses dynamic cooldown calculation
- **Balance Impact**: Higher AGI members have shorter skill cooldowns

#### Auto-cast Toggle Feature (NEW)
- **Store Action**: `toggleAutoCast(memberId)` added to roster slice
- **UI Implementation**: Toggle in Character Detail panel (roster page)
- **Combat Effect**: Auto-cast enabled members use skills automatically in combat
- **Persistent**: Auto-cast state saved with member data

#### Compact Roster UI (Major Refactor)
- **Condensed List Items**: Guild Roster panel shows minimized member cards
- **Character Detail Panel**: Left-side panel opens on member click with:
  - Avatar image (large preview)
  - Equipment placeholders (5 armor slots)
  - Skill section with auto-cast toggle
  - Talent/stat allocation UI
- **New Files**:
  - `roster-list-item.tsx` — Compact member card component
  - `character-detail-panel.tsx` — Left panel with stats/equipment/skills

#### Quest Board Label Updates (UI Polish)
- **Changed**: "Members: N" → "Min Members: N" (clarity on minimum requirement)
- **Dispatch Button**: Now shows "(selected/min+)" format indicating party size range
- **Modal Display**: Quest detail modal lists selected members with "(N selected)" label

### Changed

#### Mission Resolution (EXP Division)
- **Old**: EXP awarded equally to all members regardless of party size
- **New**: EXP divided by members.length for multi-member parties
  - Single-member missions: full EXP (no division)
  - Multi-member missions: EXP/count per survivor
  - Example: 100 EXP mission with 4-member party = 25 EXP each

#### Combat Simulator
- **Skill Cooldown Logic**: `cooldownMs` field replaced with dynamic calculation
  - Previous cooldown: fixed value
  - New cooldown: `Math.ceil(attackIntervalMs * 2)`
  - More responsive to character AGI/equipment

#### Guild Roster UI Structure
- **Old**: Full-width member cards with inline details
- **New**: Condensed list on right, expandable detail panel on left
- **Files Modified**: `guild-roster.tsx` (layout restructure), `quest-board.tsx` (label update), `quest-detail-modal.tsx` (member display)

#### Roster Slice (Zustand)
- **New Field**: `autoCastEnabled: Record<memberId, boolean>` tracking per-member auto-cast state
- **New Action**: `toggleAutoCast(memberId)` flips auto-cast flag
- **Persistence**: Auto-cast state included in save data (save migration required)

### Fixed

#### Multi-Member Party Dispatch
- **Fixed**: No EXP penalty for larger teams (now properly incentivizes focused groups)
- **Fixed**: Unclear party size requirements in UI (now shows "Min Members: N")

#### Skill Balance
- **Fixed**: Skills too spammable (now cooldown based on attack interval, forces tactical use)

#### Roster Navigation
- **Fixed**: No way to quickly view character details without opening quest modal
- **Fixed**: Equipment status not visible in roster (now shown in detail panel)

### Performance

- **Roster Rendering**: Compact list items reduce DOM nodes vs. full-width cards
- **Detail Panel**: Lazy-loads character data on open (minimal initial render cost)
- **EXP Division**: O(1) division operation (single multiplication + floor)
- **Auto-cast Toggle**: O(1) state update in Zustand

### Save Migration v5 → v6

- **Version Bump**: `SAVE_VERSION` incremented from 5 to 6
- **Auto-Migration**: `migrateV5toV6()` adds `autoCastEnabled` map to roster state
- **Backward Compatibility**: Old v5 saves load with all members defaulting to auto-cast disabled

---

## [1.5] — 2026-03-16 (Inventory & Multi-Resource Economy)

### Added

#### Item Database & Inventory System (Major Feature)
- **8 Core Item Types**: WOOD, STONE, IRON_ORE, SLIME_GEL, BOAR_PELT, WOLF_FANG, GOBLIN_EAR, ORC_TUSK
- **Inventory Zustand Slice**: Tracks quantity per item type in guild state
- **Atomic Operations**: `consumeItems()` validates inventory before deduction; `addItems()` increases quantities
- **Item Registry**: `items.ts` defines all items with name labels and stack limits (100+ per type)

#### Multi-Resource Loot System (Major Feature)
- **Loot Tables on Enemies**: Each enemy template has `LootRule[]` with `chance`, `minQuantity`, `maxQuantity`
  - Example: Goblin has chance to drop GOBLIN_EAR (1-3 qty)
  - Example: Boar has chance to drop BOAR_PELT (1-2 qty)
- **Loot Rolling**: Pure `rollLoot(enemyDef)` function generates random drops per enemy defeated
- **Loot Merging**: `mergeLoot(drops[])` combines all enemy drops into `ItemDropMap`
- **Mission Integration**: `MissionResult` now includes `lootEarned: ItemDropMap`
- **Notification Display**: Mission completion toast shows items earned (e.g., "+3 Wood, +2 Stone")

#### Multi-Resource Building Costs (Major Feature)
- **ResourceCost Type**: Buildings now cost `{ gold: number; items: ItemQuantityMap }`
  - Training Room: 200g + 10 Wood
  - Workshop: 300g + 5 Wood + 5 Iron Ore
  - Infirmary: 250g + 8 Stone
- **Placement Validation**: `canPlaceRoom()` checks both gold AND item inventory
  - Prevents placement if insufficient gold or items
  - Clear error message indicates what's missing
- **Cost Deduction**: Building placement atomically deducts both gold and items via `consumeItems()`
- **No Partial Deduction**: All-or-nothing transaction model ensures inventory consistency

#### Resource HUD Display (Major Feature)
- **Resource Bar Component**: Shows Wood/Stone/Iron quantities in top HUD (next to gold display)
- **Real-time Sync**: Quantities update immediately on loot earn or building cost deduction
- **Quick Reference**: At-a-glance inventory status during active gameplay
- **Quest Board Enhancement**: Mission listings show potential item drops from loot tables

#### Save Migration v4 → v5
- **Version Bump**: `SAVE_VERSION` incremented from 4 to 5
- **Auto-Migration**: `migrateV4toV5()` adds empty inventory structure to all members/guild
- **Default State**: New saves start with 0 items in inventory
- **Backward Compatibility**: Old v4 saves migrate seamlessly with zero-quantity inventory

### Changed

#### Mission Resolution
- **MissionResult Type**: Now includes `lootEarned: ItemDropMap` field
  - Loot generated during combat simulation (called for each defeated enemy)
  - Loot applied to guild inventory on mission completion

#### Building Costs Schema
- **Old**: `baseCost: number` (gold only)
- **New**: `cost: ResourceCost` (gold + items)
  - `RoomDefinition` interface updated
  - Building placement requires item validation

#### Guild State
- **New Field**: `inventory: Record<ItemType, number>` tracking item quantities
- **Inventory Actions**: `addItems()` and `consumeItems()` for atomic updates

#### Quest Board Panel
- **Dispatch Handler**: Calls `consumeItems()` to deduct building costs
- **Cost Display**: Shows both gold and item requirements before dispatch
- **Potential Drops**: Mission details modal lists item drops from loot tables

#### Item System Integration
- **Enemies Data**: `enemies.ts` includes `lootRules: LootRule[]`
  - Each rule: `{ itemType: ItemType; chance: 0-1; minQuantity: number; maxQuantity: number }`
- **Loot Rolling**: `loot-roller.ts` pure functions (no side effects)

### Fixed

#### Item Economy Gaps
- **Fixed**: No way to earn multi-resource items
  - Loot system now drops items from mission rewards
- **Fixed**: No use for multi-resource items
  - Building costs now require specific items
- **Fixed**: No inventory feedback to player
  - Resource bar shows current quantities

#### Building Cost Validation
- **Fixed**: Building placement had no item cost check
  - `canPlaceRoom()` now validates both gold and items
- **Fixed**: No indication of item requirements
  - Quest board shows required items before dispatch

### Performance

- **Loot Rolling**: O(n) where n = enemies defeated (typically 3-5 per mission)
- **Inventory Operations**: O(1) per consumeItems/addItems call (hash lookup)
- **Resource Bar Render**: Minimal re-render, only updates on inventory change
- **Save Migration**: One-time v4→v5 cost, no ongoing impact

### Testing

- **New Tests**: Full test coverage for loot generation, item consumption, building costs
- **Test Count**: All systems passing (inventory, loot, cost validation)
- **Coverage Areas**:
  - Loot rolling per enemy (chance + quantity)
  - Loot merging across multiple enemies
  - Inventory consumeItems validation
  - Building cost deduction (atomic transaction)
  - Resource bar update synchronization
  - Save migration v4→v5

### Documentation

- Updated `codebase-summary.md` with Inventory & Multi-Resource Economy section
- Updated `development-roadmap.md` Phase 5 Checkpoint 4 complete
- Updated `project-changelog.md` (this entry) with v1.5 features
- Updated `system-architecture.md` with multi-resource loot system data flows

### Known Issues

None identified in v1.5 release. All inventory, loot, and building cost features tested and working.

### Limitations

- Item stack limits fixed at 100+ per type (can be adjusted per item in items.ts)
- No item trading between members (design choice for v1.5)
- No item degradation or consumption during missions (reserved for future content)

---

## [1.4] — 2026-03-16 (Structures Utility — Mercenary System & Tavern)

### Added

#### Mercenary Recruitment System (Major Feature)
- **Member Rank Field**: Members now have `rank: 'MEMBER' | 'MERCENARY'` classification
- **Auto-Stat Distribution**: Mercenaries auto-distribute stat points on level-up (random across all 7 stats)
  - Regular members continue with manual stat allocation
  - No `unallocatedPoints` accumulation for mercenaries
- **Tavern Spawning**: Every 4 real-time hours, tavern generates 3 random mercenaries
  - Mercenaries appear in new Tavern panel
  - Click "Hire" to recruit mercenary to roster (costs 50% of quest reward upfront during mission dispatch)
- **Mercenary UI Badges**: Roster displays "MERC" badge on mercenary cards with distinct styling
- **Stat Allocation Guard**: Mercenary stat allocate buttons disabled in roster (auto-managed)
- **Upkeep Exclusion**: Mercenaries have 0 upkeep cost, excluded from `calcTotalUpkeep()`

#### Tavern System (New Room Type)
- **TavernState Interface**: Tracks `lastRefreshTime` and `availableMercenaries[]`
- **Tavern Panel**: New UI panel shows available mercenaries with stats, level, and hire button
- **Refresh Timer**: Displays countdown to next mercenary refresh (updates every tick)
- **Hire Action**: Button-driven recruitment moves mercenary from tavern → roster

#### Quest Board Tier Gating (Major Feature)
- **Room Level → Tier Mapping**: Quest board room level determines max quest tier
  - Lv1 → F tier, Lv2 → E tier, Lv3 → D tier, etc. (up to Lv5 → B tier)
  - `QUEST_BOARD_TIER_BY_LEVEL` constant map in `buildings.ts`
- **Dynamic Tier Filter**: Quest board panel reads highest-level quest-board room, filters missions accordingly
- **Locked Tier Display**: Missions above max tier automatically hidden from quest list
- **No Guild Level Gating**: Replaced old guild-level-based unlock system

#### Mission Dispatch Costs (Major Feature)
- **Mercenary Fee Validation**: Parties with ≥1 mercenary require 50% upfront gold fee
  - Fee calculated as `Math.floor(mission.goldRewardMin * 0.5)`
  - Gold deducted on dispatch (before mission sent to worker)
- **Gold Validation**: Dispatch blocked with clear message if insufficient gold for fee
- **Non-Mercenary Parties**: No fee change (0 mercenaries = no fee)
- **Clear Messaging**: UI shows fee requirement before dispatch

#### Save Migration v3 → v4
- **Version Bump**: `SAVE_VERSION` incremented to 4
- **Auto-Migration**: `migrateV3toV4()` adds:
  - `rank: 'MEMBER'` to all roster members + founder
  - `tavern: { lastRefreshTime: 0, availableMercenaries: [] }` to save data
- **Backward Compatibility**: Old saves load with default values

#### New Files
- `src/game/systems/mercenary-generator.ts`: Random mercenary generation
- `src/ui/panels/tavern-panel.tsx`: Tavern UI with hire interface

### Changed

#### Member Type & State
- **Member Interface**: Added `rank: MemberRank` field (default 'MEMBER')
- **Roster Slice**: `applyExpGain()` now branches on `member.rank`
  - Mercenaries: auto-distribute points immediately
  - Members: accumulate points for manual allocation

#### Quest Board Panel
- **Tier Logic**: Replaced guild-level-based unlock with quest-board room level lookup
- **useMemo Optimization**: `maxQuestTier` derived from highest-level quest-board room
- **Mission Filter**: `filteredMissions` now uses room-level-based tier cap
- **Dispatch Handler**: Validates mercenary fee, deducts gold if applicable

#### Guild Slice
- **Tavern State**: Added `tavern: TavernState` field
- **Tavern Actions**: `refreshTavern()` + `hireMercenary()` for tavern management
- **Game Tick Integration**: Tavern refresh check runs every game tick (4h interval check)

#### Game Tick Loop
- **Tavern Refresh Check**: Every tick, compare `Date.now() - tavern.lastRefreshTime` against 4h threshold
  - If exceeded, call `generateMercenaries(3)` and `refreshTavern()`
  - Implemented in tick handler (likely `use-game-tick-loop.ts`)

#### HUD & Panels
- **Tavern Room Click**: Tavern room 3D mesh click opens TavernPanel
- **Panel Toggle**: 'tavern' added to `PanelId` enum
- **Game Screen**: TavernPanel wired into panel routing

### Fixed

#### Quest Tier Access
- **Fixed**: Guild level no longer gates quest tiers
  - Now properly gated by quest-board room level
- **Fixed**: Max tier cap was not visually clear
  - Now shows filtered mission list with locked missions hidden

#### Mission Dispatch Validation
- **Fixed**: No gold cost for mercenary parties
  - Now correctly charges 50% upfront fee
- **Fixed**: No validation for insufficient gold
  - Dispatch blocked with clear message if gold < fee

#### Mercenary Progression
- **Fixed**: No way to recruit mercenaries
  - Tavern system spawns 3 every 4 hours
- **Fixed**: Mercenary stat growth uncontrolled
  - Auto-distribution ensures balanced progression

### Performance

- **Mercenary Generation**: O(3) per refresh (3 random members generated every 4h)
- **Tavern Refresh Check**: O(1) time check per tick (negligible)
- **Tier Lookup**: O(n) filter per room query (n = rooms, typically <10)
- **Save Migration**: One-time v3→v4 migration, no ongoing cost

### Testing

- **New Tests**: Full test coverage for mercenary generation and tavern interactions
- **Test Count**: 25/25 tests passing (including all mercenary/tavern flows)
- **Coverage Areas**:
  - Mercenary rank assignment + auto-stat distribution
  - Tavern refresh interval logic
  - Quest tier gating by room level
  - Mercenary fee validation & gold deduction
  - Save migration v3→v4

### Documentation

- Updated `codebase-summary.md` with Mercenary system & Tavern section
- Updated `development-roadmap.md` Phase 5 status (Structures Utility v1.4 complete)
- Updated `project-changelog.md` (this entry) with v1.4 features

### Known Issues

None identified in v1.4 release. All mercenary and tavern features tested and working.

### Limitations

- Tavern refresh limited to 3 mercenaries per spawn (by design)
- Mercenary stats capped at same level caps as regular members (100 levels)
- No mercenary dismissal UI (can be added in future patch)

---

## [1.3] — 2026-03-15 (Advanced Build Mode — Room Moving & Toggle)

### Added

#### Build Mode Toggle (Major Feature)
- **Build Mode Toggle Button**: Dedicated HUD button to enter/exit build mode
- **isBuildMode State**: Boolean flag controlling grid visibility and member visibility
- **Grid Visibility**: Grid shown during build mode for clear placement reference
- **Member Hiding**: All members hidden when in build mode for clean visual workspace

#### Room Moving & Manipulation (Major Feature)
- **Pick-Up Mechanic**: Click existing rooms to pick up and move them
- **Room Dragging**: Drag picked-up rooms around the grid with collision detection
- **Rotation During Move**: Press R to rotate rooms while moving
- **Cancel/Restore**: ESC or right-click to cancel move, room returns to originalPosition/Rotation
- **Collision Exclusion**: Moving rooms exclude themselves from collision checks (prevent self-blocking)

#### Advanced State Management
- **ActiveBuildItem Interface**: Unified interface for both new placements and room moves
  - `type: 'new' | 'existing'` — Placement type
  - `roomType: RoomType` — Room type being placed/moved
  - `rotation: Rotation` — Current rotation (0|90|180|270)
  - `roomId?: string` — ID of room being moved (existing only)
  - `originalPosition?: {x, z}` — Saved position for cancel restore (existing only)
  - `originalRotation?: Rotation` — Saved rotation for cancel restore (existing only)
- **Fresh State Pattern**: Each placement/move starts with clean state on entry
- **State Isolation**: Build mode state separate from gameplay state

#### Enhanced UI Components
- **BuildModeHint Context-Aware**:
  - Idle: "Click a room to move it"
  - Placing: "Placing: {room_name} ({rotation}°)"
  - Moving: "Moving: {room_name} ({rotation}°)"
  - Shows controls: click to place/drop, R to rotate, ESC/right-click to cancel
- **RoomMesh Interactive**: Click-to-pick-up in build mode, hide when being moved
- **Grid Persistence**: Grid remains visible throughout entire build mode session

#### Tests (NEW)
- `build-mode-advanced.test.ts`: 48 comprehensive tests covering:
  - toggleBuildMode: entry/exit with state cleanup
  - startMovingRoom: room capture with metadata preservation
  - rotatePlacement: rotation cycling during move
  - cancelPlacement: position/rotation restoration on cancel
  - activeItem transitions: proper state initialization and cleanup
  - Member visibility: members hidden when isBuildMode
  - Collision handling: excludes self from collision check during move

### Changed

#### Build Mode Architecture
- **Build Mode Slice**: Added `isBuildMode`, enhanced `activeItem` with move metadata
- **startPlacement()**: Now sets `activeItem.type = 'new'`
- **NEW startMovingRoom()**: Captures roomId, position, rotation for moves
- **toggleBuildMode()**: Replaces direct mode entry, handles full cleanup
- **cancelPlacement()**: Restores position/rotation if moving existing room

#### Guild Hall Rendering
- **RoomMesh**: Added onClick handler to pick up rooms in build mode
- **Visibility**: Rooms hidden when `activeItem.roomId` matches (being moved)
- **BuildOverlay**: Passes `excludeRoomId` to collision check when moving

#### Build Overlay
- **Unified Placement/Move**: Single overlay handles both new and existing room placement
- **Collision Exclusion**: Moving rooms exclude self: `checkCollision(..., excludeRoomId)`
- **Ghost Preview**: Shows preview for both new placements and room moves

### Fixed

#### Build Mode UX
- **Fixed**: No way to move existing rooms
  - Now clickable to pick up, drag, and drop with rotation
- **Fixed**: No build mode toggle
  - Dedicated button and isBuildMode state for easy mode switching
- **Fixed**: Members cluttered view during building
  - Now hidden when isBuildMode is true
- **Fixed**: No way to cancel room moves
  - ESC/right-click restores to original position and rotation
- **Fixed**: Moving rooms could collide with themselves
  - Collision check now excludes the room being moved

### Performance

- **State Management**: activeItem tracking adds ~2KB memory when active
- **Collision Detection**: excludeRoomId check adds 1 comparison per room (negligible)
- **Rendering**: Conditional visibility (hidden during move) no performance cost
- **Ghost Preview**: Real-time updates unaffected (same raycasting as v1.2)

### Testing

- New test file: `build-mode-advanced.test.ts` with 48 tests
- Test coverage: toggleBuildMode (5), startMovingRoom (6), rotatePlacement (3), cancelPlacement (4), collision (5), activeItem transitions (8), member visibility (3), integration (8)
- All tests passing, 100% success rate

### Documentation

- Updated `codebase-summary.md` with Advanced Build Mode features
- Updated `system-architecture.md` with ActiveBuildItem interface and move flow diagrams
- Updated `project-changelog.md` (this entry) with v1.3 features and breaking changes
- Updated `development-roadmap.md` Phase 5 status to include v1.3 completion

### Known Issues

None identified in v1.3 release. All major features tested and working.

### Limitations

- Max rotation: 4 values (0/90/180/270), no free-form rotation
- Grid snap: 0.5 cell minimum (no sub-cell precision)
- Single room move at a time (cannot multi-select)

---

See `v0-archive-changelog.md` for historical entries (v0.1 through v1.2)

---

## Version History Summary

| Version | Date | Focus | Status |
|---------|------|-------|--------|
| 1.3 | 2026-03-15 | Advanced Build Mode — room moving, toggle, member hiding | Complete |
| 1.4 | 2026-03-16 | Structures Utility — mercenary system, tavern, quest tier gating | Complete |
| 1.5 | 2026-03-16 | Inventory & Multi-Resource Economy — items, loot, building costs | Complete |
| 1.6 | 2026-03-16 | Roster Management & Combat Enhancements | Complete |
| 1.7 | 2026-03-16 | Guild Rank System — 5-tier hierarchy, promotion mechanics | Complete |
| 1.8 | 2026-03-16 | Save Migration & Enhanced Rank System (v7→v8) | Complete |
| 1.9 | 2026-03-21 | Milestone 2 Vertical Slice — Civilizations, Passives, 22 Missions, 15 Enemies, 7 Skills | Complete |
| 1.10 | 2026-03-23 | Building System Refactor — Tile-Based Architecture (rooms → tiles+furniture) | Complete |
| 2.0+ | TBD | Post-launch updates | Planned |

See `v0-archive-changelog.md` for v0.1-v1.2 history.

---

**Last Updated**: 2026-03-23 (v1.10 Building System Refactor)
**Maintained By**: Documentation Team
**Next Review**: 2026-03-24 (weekly) / 2026-04-15 (milestone)

For detailed file changes and historical information on v1.3-v1.6, see `v0-archive-changelog.md`.
