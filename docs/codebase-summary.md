# Codebase Summary

**Worlds Collide** — An HD-2D auto-RPG idle guild builder where civilizations collide. Build your guild hall, recruit members from different civilizations, dispatch quests, and watch your guild grow — even while you're away.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19 |
| Language | TypeScript | 5 |
| Build Tool | Vite | 8 |
| 3D Rendering | @react-three/fiber | Latest |
| State Management | Zustand | 5 |
| Audio | Howler.js | Latest |
| Persistence | IndexedDB (via idb) | — |
| Testing | Vitest | Latest |
| Localization | i18next | Latest |

## Project Structure

```
src/
├── game/                    # Core game logic & state
│   ├── state/              # Zustand store + slices (game, guild, roster, mission, combat, save-status, inventory, build-mode)
│   ├── systems/            # Game simulation (combat, leveling, economy, missions, building, combat-passives)
│   │   └── workers/        # Web Worker game loop for offline progression
│   ├── data/               # Static data (enemies, missions, skills, buildings, characters, civilization-config)
│   └── save/               # Persistence layer (3-slot IndexedDB + JSON import/export)
├── scene/                  # React Three Fiber 3D guild hall scene
├── ui/                     # User interface
│   ├── screens/            # Full-screen views (title screen with slot selection)
│   ├── panels/             # Collapsible UI panels (quest board, roster, build, combat, settings)
│   ├── hud/                # Heads-up display overlay + panel toggle bar + save status badge
│   ├── components/         # Reusable UI components (stat bars, cards, dialogs, civ-badge)
│   └── styles/             # CSS for panels, HUD, and screens
├── audio/                  # Howler.js audio manager + sound key enums (6 new keys)
├── i18n/                   # i18next localization (Vietnamese default)
└── main.tsx               # Application entry point
```

## Core Systems

### Mission Tick Game Loop (NEW - Real-time Mission Resolution)
- **Web Worker Heartbeat**: 1-second tick via worker thread, offline-safe
- **Mission Resolution**: Auto-resolves expired missions with combat simulation
- **Reward Distribution**: Gold + EXP applied on mission completion
- **Injury System**: Members marked injured/recovered on configurable timer (50% mission duration)
- **Status Updates**: Member states transition (active → idle/injured, injured → idle)
- **Toast Notifications**: Mission results displayed with auto-dismiss (5s) + click dismiss
- **Offline Catch-up**: Resolves all expired missions on app load (handles tab closure scenarios)

**Key Files**:
- `mission-tick.ts` — processMissionTick + processInjuryRecovery logic
- `use-game-tick-loop.ts` — Hook initializing worker, handling ticks + offline sync
- `notification-slice.ts` — Zustand slice for ephemeral mission notifications (not serialized)
- `mission-notification.tsx` — Toast component rendering notification stack
- `game-screen.tsx` — Extracted screen component managing tick loop lifecycle
- `game-loop.worker.ts` — Web Worker providing 1s tick heartbeat

### Save System (3-Slot Multi-Storage Architecture)
- **Storage**: 3 independent IndexedDB slots with shadow backup capability
- **Validation**: TypeScript type guards for import validation
- **Auto-save**: Every 60s + visibility change (tab loss)
- **Import/Export**: Slot-aware JSON serialization with validation
- **Status Tracking**: HUD badge (saving/saved/error states)
- **Offline Support**: Enables catch-up sync on return

**Key Files**:
- `save-storage.ts` — Multi-slot IndexedDB CRUD
- `save-manager.ts` — Orchestrates save/load/export/import lifecycle
- `save-validation.ts` — TypeScript type guards + migration pipeline
- `active-slot-storage.ts` — Track active slot in localStorage

### Game State (Zustand)
- **Game Slice**: Active guild, missions, combat log, game clock
- **Roster Slice**: Members with stats, EXP, levels, status (idle/injured)
- **Guild Slice**: Buildings, room effects, upkeep
- **Mission Slice**: Active missions, estimated end times (timestamps)
- **Combat Slice**: Combat simulator, turns, damage log
- **Save Status Slice**: Auto-save status for HUD feedback
- **Notification Slice**: Ephemeral mission results (not persisted)

### Character System
- **Founder**: Player-named guild leader with 7 stats
- **Members**: Recruit from 3 civilizations, 80+ unique heroes
- **Progression**: EXP curves (1.35x scaling), stat allocation, 100 levels
- **Classes**: 3 archetypes per civilization

### Guild Rank System (NEW - v1.8)
- **5-Tier Hierarchy**: RECRUIT → MEMBER → VETERAN → OFFICER → COMMANDER (promotable)
- **Orthogonal Rank**: MERCENARY outside hierarchy (not promotable)
- **Rank Perks**:
  - Upkeep modifier (0.8x to 1.3x cost)
  - EXP bonus on mission rewards (0% to 20%)
- **Promotion Requirements**: Min level + missions completed + gold cost
- **Per-Member Tracking**: `missionsCompleted` counter for promotion eligibility
- **Player-Initiated Promotion**: Click to promote eligible member (costs gold)
- **Promotion Criteria** (example: RECRUIT → MEMBER):
  - Level ≥ 3, missions completed ≥ 5, cost 200g
  - VETERAN: Level ≥ 8, 20 missions, 800g
  - OFFICER: Level ≥ 15, 50 missions, 2500g
  - COMMANDER: Level ≥ 25, 100 missions, 8000g
- **Save Migration v7 → v8**: Auto-seed `missionsCompleted = level * 2`, all non-MERCENARY ranks set to RECRUIT

### Quest System & Mission Phase State Machine (NEW)
- **7-Tier Progression**: F, E, D, C, B, A, S ranks
- **Phase State Machine**: `traveling → arrived → in-combat → completed/failed`
  - **Traveling** (0–`travelTimeMs`): Party journeys to zone
  - **Arrived** (30s window): Player chooses Manual/Auto combat or timeout auto-triggers
  - **In-Combat**: Combat simulation runs, rewards/injuries applied
  - **Completed/Failed**: Mission removed from active list
- **Travel Times**: F=10s, E=15s, D=20s (scales by difficulty)
- **Arrival Timeout**: 30-second window (`ARRIVAL_TIMEOUT_MS`) for manual choice
- **Party Dispatch**: Select 1-6 members, auto-combat simulation
- **Rewards**: Gold (scaled by LCK), EXP to survivors
- **Injury System**: 50% of mission duration; scales with difficulty
- **Offline Completion**: `resolveMission()` called for offline catch-up

### Combat System
- **Tick-based Simulation**: Auto-RPG mechanics
- **Formulas**: AGI+weapon speed for action order, crit chance, status effects
- **Status Effects**: Poison, stun, vulnerability, defense buffs
- **Damage Calculation**: Base damage + scaling + weapon/armor

### Economy System
- **Gold**: Currency earned from quests, spent on recruitment/upkeep
- **Upkeep**: Daily cost scales with roster size + room count
- **Debt**: Accumulates if upkeep unpaid; penalties apply
- **Recruitment**: Fixed costs per civilization, unlock higher tiers with progression
- **Multi-Resource Economy**: 8 item types earned from loot, spent on building costs

### Guild Hall System (Cell-Based Build v1.7)
- **Cell-Based Rooms**: Room = collection of GridCell[] (6x6 default blocks), dynamic world bounds
- **5 Room Types**: guild-hall, tavern, workshop, training-room, infirmary (quest-board is now furniture)
- **Furniture System**: 8 items — 5 core (quest-board, bar-counter, alchemy-table, workbench, training-dummy) + 3 upgrade (reception-desk, wine-barrel, medical-bed)
- **Room Level = Core Furniture Level**: Upgrade core furniture → room levels up
- **3 Build Modes**: new-room, new-furniture, move-room with cell-based overlap + adjacency validation
- **Build Overlay**: Dynamic grid with padding, ghost cell/furniture preview (green/red)
- **Build Menu**: 2-tab layout (Rooms | Furniture) with room upgrade buttons
- **Room Effects**: Bonuses derived from furniture types/levels, not room types
- **Rendering**: Per-cell floor tiles with room-specific colors + furniture meshes

### UI Architecture (Screen-Based Routing)
- **Title Screen**: Save slot selection (continue/new/delete)
- **Character Creation**: Stat allocation (50 points across 7 attributes)
- **Game Screen**: World scene + HUD + panels + mission tick loop + notification stack
- **Panels**: Quest board (with progress bars), roster, build menu, combat log, settings
- **Settings**: Audio/language toggle, import/export, return to title
- **Notifications**: Toast stack (5 max visible) auto-dismissing mission results

### Localization
- **Default**: Vietnamese (i18next)
- **Keys**: Game UI, panel headers, button labels, system messages
- **Title Screen**: Slot display, action buttons, messages
- **Save/Import Dialogs**: User-facing feedback

## Recent Changes (Milestone 2 Vertical Slice — v1.9)

### Civilizations System (NEW - Complete Overhaul)
- **3 Civilizations**: Linh Sơn, Đế Quốc, Thiên Lữ (replacing old Viet/Nordic/Saharan)
- **CIV_CONFIG**: Single source of truth in `src/game/data/civilization-config.ts`
  - Each civ: name, description, stat bonuses, archetype classes, hero roster (per class)
  - Stat bonuses applied at creation via `applyCivBonuses(founder, civId)`
- **Character Creation**: Civ selector integrated in founder creation UI
- **Civ Badge Component**: `civ-badge.tsx` displays civilization emblem + name
- **Roster Filter**: Quest board + roster show civ badges for filtering/identification
- **Save Migration v8→v9**: Transparent civ name remapping for old saves

### Combat Passives System (NEW - 3 Exclusive Abilities)
- **Son The (Linh Sơn)**: +20% max HP per level
- **Dien The Chi Huy (Đế Quốc)**: +30% EXP gain from missions
- **Tinh Lo (Thiên Lữ)**: +15% dodge rate in combat
- **Passive Application**: Automatically applied based on member's civilization
- **Combat Integration**: Passives checked during combat simulation + damage calculation
- **Display**: Passive abilities shown in character detail panel + roster list items

### Skills Expansion (NEW - 7 Total, was 1)
- **7 Skills Total**: Grouped by archetype via `SKILLS_BY_ARCHETYPE`
- **Each Archetype**: Has dedicated skill set (Warrior, Mage, Rogue variants per civ)
- **Skill Data**: Includes cooldown, damage scaling, range, mana cost
- **Combat Behavior**: Auto-cast + manual cast supported (existing system)
- **Display**: Skill cards in character detail panel with full stats

### Enemy Expansion (NEW - 15 Enemy Types, was 5)
- **15 Total Enemy Types**: Spread across F-D tiers
- **New Abilities**:
  - Stun-attack: Disables target for 1 turn
  - Enrage: Increases self damage by 50% temporarily
  - Heal-ally: Restores HP to nearby enemies
- **AI Behavior**: Smart target selection + ability usage during combat sim
- **Loot Tables**: Each enemy has distinct loot rules (items + materials)
- **Balance**: Progressive difficulty scaling per tier

### Mission Expansion (NEW - 22 Total Missions, was 5)
- **22 Total Missions**: F tier (8), E tier (7), D tier (7)
- **2 Gate Bosses**: One-time challenge missions blocking tier progression
- **1 Quest Chain**: Multi-mission narrative story line with escalating rewards
- **Mission Variety**:
  - Standard combat missions (1-3 enemies)
  - Boss encounters (single powerful enemy)
  - Gate bosses (elite challenge)
  - Quest chain steps (tied together with lore)
- **Rewards**: Gold + EXP + items scale by difficulty + quest type
- **Travel Times**: Adjusted for new difficulty tiers

### UI Enhancements (NEW - Civ-Aware Components)
- **Quest Board**: Shows civ filter + quest chain badges for multi-mission sets
- **Roster View**: Civ badges + passive ability displays per member
- **Character Detail**: Full passive ability description + stat bonuses from civ
- **Mission List**: Quest chain indicators + gate boss markers

### Audio System Expansion (NEW - 6 New Keys)
- **BGM_COMBAT**: Combat background music
- **SFX_CRIT**: Critical hit sound effect
- **SFX_DODGE**: Dodge/miss sound effect
- **SFX_DEATH**: Enemy defeat sound effect
- **SFX_SKILL**: Skill usage sound effect
- **SFX_RECRUIT**: Character recruitment sound effect

### Save Migration v8→v9 (TRANSPARENT)
- **Version Bump**: `SAVE_VERSION` incremented to 9
- **Auto-Migration**: `migrateV8toV9()` runs on load
  - Remap old civ names (if exists) to new civilization IDs
  - Add `civId: string` field to all members
  - Ensure founder has valid civId
- **Backward Compatibility**: Old saves load seamlessly with civ assignments

**Key Files (New)**:
- `src/game/data/civilization-config.ts` — CIV_CONFIG definitions, archetype classes, hero rosters per civ
- `src/game/systems/combat-passives.ts` — Passive ability definitions + application logic
- `src/ui/components/civ-badge.tsx` — Civilization display component
- `src/game/data/enemies.ts` — 15 enemy definitions with abilities + loot tables (updated)
- `src/game/data/missions.ts` — 22 mission definitions + quest chains + gate bosses (updated)
- `src/game/data/skills.ts` — 7 skills grouped by archetype (updated)

**Key Files (Modified)**:
- `character-creation.tsx` — Added civ selector UI
- `quest-board.tsx` — Filter by civ + show quest chain badges
- `guild-roster.tsx` — Display civ badges + sort by civilization
- `character-detail-panel.tsx` — Show passive abilities + civ bonuses
- `combat-simulator.ts` — Apply passives during combat calculation
- `save-migrations.ts` — Added migrateV8toV9() function
- `save-types.ts` — Updated SAVE_VERSION to 9
- `audio-manager.ts` — 6 new audio keys registered
- `roster-slice.ts` — Added civId field to members

## Recent Changes (Guild Rank System — v1.8)

### 5-Tier Rank Hierarchy (NEW - Major Feature)
- **Rank Progression**: RECRUIT → MEMBER → VETERAN → OFFICER → COMMANDER (5 tiers)
- **Orthogonal Mercenary Rank**: MERCENARY unpromotable, tracked separately
- **Rank Perks**:
  - **Upkeep Modifier**: RECRUIT (0.8x) to COMMANDER (1.3x) cost scaling
  - **EXP Bonus**: RECRUIT (0%) to COMMANDER (20%) mission reward multiplier
- **Promotion Criteria**:
  - **RECRUIT→MEMBER**: Lvl ≥3, 5 missions, 200g
  - **MEMBER→VETERAN**: Lvl ≥8, 20 missions, 800g
  - **VETERAN→OFFICER**: Lvl ≥15, 50 missions, 2500g
  - **OFFICER→COMMANDER**: Lvl ≥25, 100 missions, 8000g
- **Player-Initiated Promotion**: Click button in character detail panel (deducts gold atomically)

### Per-Member Mission Counter (NEW)
- **`missionsCompleted` Field**: Tracks lifetime mission participations (not mission count per se)
- **Incremented On**: Every mission completion (even if full-wipe) for survivor filtering
- **Promotion Requirement**: Must meet missions completed threshold to promote
- **Save Migration**: Seeded as `level * 2` for v7→v8 migration

### Rank UI Components (NEW)
- **rank-badge.tsx**: Color-coded badge (gray/blue/green/purple/gold for ranks)
- **rank-promotion-section.tsx**: Shows next rank requirements + promote button (disabled if ineligible)
- **Integration**: Added to character-detail-panel.tsx in roster view

### Upkeep & EXP Calculation Updates (ENHANCED)
- **Daily Upkeep**: Member cost multiplied by `rankDef.upkeepModifier` per rank
- **Mission EXP**: Base reward multiplied by `1 + (rankDef.expBonusPct / 100)` per rank
- **Calculation Points**: `processMissionTick()` applies bonuses on reward distribution

### Save Migration v7 → v8 (TRANSPARENT)
- **Version Bump**: `SAVE_VERSION` incremented to 8
- **Auto-Migration**: `migrateV7toV8()` runs on load
  - Adds `missionsCompleted: 0` to all characters
  - All non-MERCENARY members reset to RECRUIT rank
  - Seeds `missionsCompleted = level * 2` heuristic for relevance
  - MERCENARY members unchanged (stay MERCENARY)
- **Backward Compatibility**: Old saves load with correct rank hierarchy + mission counters

**Key Files (New)**:
- `src/game/data/ranks.ts` — GUILD_RANKS definitions, getNextRank(), promotion requirement checks
- `src/ui/components/rank-badge.tsx` — Rank display component
- `src/ui/components/rank-promotion-section.tsx` — Promotion UI + eligibility logic
- `src/game/save/save-migrations.ts` — migrateV7toV8() migration function

**Key Files (Modified)**:
- `roster-slice.ts` — Added `promoteMember()` action, member.rank + member.missionsCompleted fields
- `mission-tick.ts` — Increments member.missionsCompleted on completion
- `mission-resolver.ts` — Apply rank.expBonusPct multiplier to survivor EXP
- `economy-system.ts` — Calculate daily upkeep with rank.upkeepModifier scaling
- `character-detail-panel.tsx` — Integrated rank-promotion-section component
- `save-types.ts` — Updated SAVE_VERSION to 8
- `guild-upgrade-system.ts` — Added member promotion utilities (canPromote, meetsPromotionRequirements)

## Recent Changes (Roster Management & Combat Enhancements — v1.6)

### Multi-Member Quest Dispatch (NEW - Major Feature)
- **Party Flexibility**: Dispatch N+ members above quest minimum on single mission
- **EXP Sharing**: Reward divided by party size (`Math.max(1, Math.floor(expReward / members.length))`)
- **Dispatch Display**: Quest board shows "(selected/min+)" format in dispatch button
- **Mission Integration**: `mission-resolver.ts` divides EXP among survivors

### Skill Cooldown Rebalance (NEW - Gameplay Adjustment)
- **Dynamic Cooldown**: Skills cooldown for `attackIntervalMs * 2` instead of fixed `cooldownMs`
- **AGI Scaling**: Higher AGI characters have shorter skill cooldowns
- **Prevents Spam**: Forces minimum 1 normal attack between skill uses
- **Combat Logic**: `combat-simulator.ts` updated with new cooldown calculation

### Auto-cast Toggle Feature (NEW)
- **Store Action**: `toggleAutoCast(memberId)` in roster slice
- **UI Control**: Toggle in Character Detail panel (new v1.6)
- **Combat Behavior**: Auto-cast enabled members use skills automatically in combat
- **Persistence**: Auto-cast state saved with member data

### Compact Roster UI (NEW - Major Refactor)
- **Condensed List**: Guild Roster panel shows minimized member cards
- **Detail Panel**: Left-side panel opens on member click
  - Avatar image (large preview)
  - Equipment placeholders (5 armor slots)
  - Skill section with auto-cast toggle
  - Talent/stat allocation UI
- **New Components**:
  - `roster-list-item.tsx` — Compact member card
  - `character-detail-panel.tsx` — Left panel with details
- **UI Update**: Guild roster restructured for better information hierarchy

### Quest Board Label Clarity (UI Polish)
- **Changed**: "Members: N" → "Min Members: N"
- **Dispatch Button**: Shows "(selected/min+)" indicating available party sizes
- **Modal Display**: Selected members labeled with "(N selected)"

**Key Files (New)**:
- `src/ui/panels/character-detail-panel.tsx` — Character detail panel component
- `src/ui/components/roster-list-item.tsx` — Compact roster item component

**Key Files (Modified)**:
- `mission-resolver.ts` — EXP division by party size
- `combat-simulator.ts` — Dynamic skill cooldown calculation
- `roster-slice.ts` — Added `autoCastEnabled` map + `toggleAutoCast()` action
- `guild-roster.tsx` — Restructured layout with detail panel
- `quest-board.tsx` — Updated label format "(selected/min+)"
- `quest-detail-modal.tsx` — Multi-member party display
- `save-types.ts` — `SAVE_VERSION: 6`, auto-cast field
- `save-migrations.ts` — `migrateV5toV6()` migration

**Save Migration v5 → v6**:
- **Version Bump**: `SAVE_VERSION` incremented to 6
- **Auto-Migration**: `migrateV5toV6()` adds `autoCastEnabled` map to roster
- **Backward Compatibility**: Old saves load with auto-cast disabled for all members

## Recent Changes (Inventory & Multi-Resource Economy — v1.5)

### Item Database & Inventory System (Major Feature)
- **8 Core Item Types**: WOOD, STONE, IRON_ORE, SLIME_GEL, BOAR_PELT, WOLF_FANG, GOBLIN_EAR, ORC_TUSK
- **Inventory Zustand Slice**: Atomic `consumeItems()` and `addItems()` actions
- **Item Registry**: `items.ts` defines all item types with names and stack limits
- **Inventory State**: Stores quantity per item type in guild state

### Multi-Resource Loot System (Major Feature)
- **Loot Rules**: Each enemy has `LootRule[]` with `chance`, `minQuantity`, `maxQuantity`
- **Loot Rolling**: Pure `rollLoot()` function generates random item drops per enemy defeated
- **Loot Merging**: `mergeLoot()` combines drops into `ItemDropMap`
- **Mission Integration**: `MissionResult` includes `lootEarned: ItemDropMap`
- **Mission Notifications**: Toast notifications show items earned alongside gold/EXP

### Multi-Resource Building Costs (Major Feature)
- **ResourceCost Type**: `{ gold: number; items: ItemQuantityMap }`
- **Building Requirements**: Training Room (200g + 10 Wood), Workshop (300g + 5 Wood + 5 Iron Ore), Infirmary (250g + 8 Stone)
- **Placement Validation**: `canPlaceRoom()` checks both gold AND inventory items
- **Cost Deduction**: Building placement deducts resources atomically
- **Item Consumption**: `consumeItems()` action ensures inventory consistency

### Resource HUD Display (Major Feature)
- **Resource Bar**: Shows Wood/Stone/Iron quantities alongside gold in top bar
- **Quick Reference**: At-a-glance inventory status during gameplay
- **Quest Board**: Missions show potential item drops (from loot tables)

### Save Migration v4 → v5
- **Version Bump**: `SAVE_VERSION` incremented to 5
- **Auto-Migration**: `migrateV4toV5()` adds `inventory: { ... }` structure with zero quantities
- **Backward Compatibility**: Old saves load with default empty inventory

**Key Files (New)**:
- `src/game/data/items.ts` — Item type registry with name + stack limits
- `src/game/state/inventory-slice.ts` — Zustand slice for inventory CRUD
- `src/game/systems/loot-roller.ts` — `rollLoot()` + `mergeLoot()` pure functions
- `src/ui/components/resource-bar.tsx` — HUD resource display component

**Key Files (Modified)**:
- `game-state.ts` — `ItemDropMap` type, `ResourceCost` type
- `buildings.ts` — Updated cost definitions (ResourceCost format)
- `mission-resolver.ts` — Integrated loot earning into `MissionResult`
- `quest-board.tsx` — Display potential drops + call `consumeItems()` on dispatch
- `save-types.ts` — `SAVE_VERSION: 5`, inventory field
- `save-migrations.ts` — `migrateV4toV5` migration

**Test Coverage**: Full test suite passing with inventory/loot/cost validation

## Recent Changes (Build Mode Advanced — v1.3)

### Build Mode Toggle & Grid Visibility (NEW)
- **Build Mode State**: `isBuildMode` boolean flag controls UI visibility and interaction modes
- **Build Toggle Button**: Dedicated button in HUD to enter/exit build mode
- **Grid Visibility**: Grid displayed during build mode for clear room placement reference
- **Member Hiding**: All members hidden when in build mode for clean visual workspace

### Room Moving & Rotation (NEW)
- **Pick-Up Mechanic**: Click existing rooms to pick up and move them
- **ActiveBuildItem Interface**: Tracks both new placements and existing room moves
  - `type: 'new' | 'existing'` — Placement type
  - `roomType: RoomType` — Room type being placed/moved
  - `rotation: Rotation` — Current rotation (0|90|180|270)
  - `roomId?: string` — ID of room being moved (existing only)
  - `originalPosition?: {x, z}` — Saved for cancel restore
  - `originalRotation?: Rotation` — Saved for cancel restore
- **Move Flow**: Click → pick up → drag → rotate (R) → drop (click) or cancel (ESC/right-click)
- **Collision Exclusion**: Moving rooms exclude themselves from collision checks (don't collide with own old position)

### Cancel & Restore (NEW)
- **ESC/Right-Click**: Cancel active placement or move
- **Position Restore**: Moved rooms return to originalPosition when cancelled
- **Rotation Restore**: Moved rooms return to originalRotation when cancelled
- **Fresh State Pattern**: Each placement/move starts with clean state

### Build Mode Slice Enhanced (v1.3)
- **toggleBuildMode(on: boolean)**: Enter/exit build mode (resets all placement state)
- **startMovingRoom(roomId, type, position, rotation)**: Pick up existing room with metadata capture
- **activeItem: ActiveBuildItem | null**: Tracks what's being placed/moved
- Maintains consistency between new placements and room moves

### Grid Visibility & Lighting (IMPROVED)
- **Grid Lines**: 11 vertical + 7 horizontal lines at y=0.01 (always visible in build mode)
- **Floor Highlighting**: Base floor becomes more visible during build mode
- **Real-time Updates**: Ghost preview updates as mouse moves and rotation changes

### Build Hint Context-Aware (ENHANCED)
- **Placement Mode**: Shows "Placing: {room_name} ({rotation}°)" with placement controls
- **Move Mode**: Shows "Moving: {room_name} ({rotation}°)" with drop controls
- **Idle Mode**: Shows "Click a room to move it" when in build mode but not actively placing
- **Controls**: Context-sensitive hints for R (rotate), click (place/drop), ESC/right-click (cancel)

### Tests (EXPANDED)
- **build-mode-advanced.test.ts**: 48 new tests covering:
  - toggleBuildMode: entry/exit with state cleanup
  - startMovingRoom: room capture, position/rotation save
  - rotatePlacement: rotation cycling for moving rooms
  - cancelPlacement: restore to original position/rotation
  - Collision during move: excludes self from collision check
  - activeItem state: proper initialization and transitions

**Key Files**:
- `build-mode-slice.ts` — ActiveBuildItem interface, enhanced toggleBuildMode, startMovingRoom
- `guild-hall.tsx` — RoomMesh onClick handler for pick-up, member hiding when isBuildMode
- `build-overlay.tsx` — Unified placement/move preview, collision exclusion for moving rooms
- `build-mode-hint.tsx` — Context-aware hints (idle/placing/moving modes)
- `member-layer.tsx` — Hidden when isBuildMode is true
- `camera-controller.tsx` — Pan disabled during any active placement/move
- `build-mode-advanced.test.ts` — Comprehensive test coverage (48 tests)

## Earlier Changes (Phase State Machine Implementation)

### Mission Phase State Machine (NEW)
- **Transitions**: `traveling → arrived → in-combat → completed/failed`
- **Types**: `MissionPhase` type with 6 states; `ActiveMission` holds `phase`, `arrivalTime`, `combatMode`
- **Travel Times**: Added `travelTimeMs` field (F=10s, E=15s, D=20s by tier)
- **Arrival Timeout**: 30-second window (`ARRIVAL_TIMEOUT_MS = 30_000`) for player to choose combat mode
- **Combat Mode Selection**: Manual (player choice) or Auto (timeout auto-triggers)
- **Tick Processing**: `processMissionTick()` advances phase state on every 1s tick

### Arrival Modal UI (NEW)
- Modal displays on arrival with Manual/Auto choice
- Countdown timer (30s) → auto-triggers if no choice made
- Phase badge in quest board: 🚶 Traveling / 📍 Arrived / ⚔️ In Combat

### Mission Resolution (Enhanced)
- `resolveMission()` now called synchronously in `in-combat` phase
- Detailed results: survivors, injured, gold earned, EXP per member
- Offline catch-up calls `resolveMission()` for accurate replay

### Save Migration
- Save version bumped 1→2
- Existing saves migrated with new `phase`, `arrivalTime`, `combatMode` fields

### Game Loop Architecture
- Separated game rendering from tick processing via extracted `GameScreen` component
- `useGameTickLoop` hook initializes Web Worker and processes ticks when component mounts
- Worker runs independently; main thread remains responsive for UI interactions
- Offline catch-up on app load ensures no mission progress is lost

### Mission Tick Processing
- Every 1s: check expired missions, advance state machine, resolve via combat simulation
- Apply rewards/injuries based on phase and outcome
- Rewards: gold added to guild treasury, EXP distributed per survivor
- Injuries: members marked with status + recovery timer (scales with mission difficulty)
- Failures: full-wipe missions mark members injured, no gold/EXP awarded

### Notification System (Ephemeral)
- Mission results pushed to notification store on completion
- Toast component displays up to 5 visible notifications with outcome + rewards
- Auto-dismiss after 5s or click to dismiss immediately
- SFX feedback: reward sound on success, hit sound on wipe

### Member Status Transitions
- Idle → Active (on mission dispatch)
- Active → Idle/Injured (on mission completion/failure)
- Injured → Idle (on timer expiration, checked every tick)

### Quest Board Updates
- Active missions show progress bars (fill % based on elapsed time)
- Phase badges display current state (traveling/arrived/in-combat)
- Click to view detailed mission modal with party composition + rewards
- Tick-by-tick combat log available in combat view panel

## Earlier Changes (Save System Overhaul)

### Multi-Slot IndexedDB Architecture
- Replaced localStorage+IndexedDB fallback with dedicated 3-slot system
- Each slot stores complete game state envelope
- Shadow backup for corruption recovery
- Enables independent save management per slot

### Title Screen Implementation
- New entry point before char creation
- Save slot cards showing founder name, play time, last save
- Actions: continue, new game, delete with confirmation
- Overwrite protection for existing slots

### Save Validation Pipeline
- TypeScript type guards (no external validation libs)
- Automatic migration for format changes
- Validation on import + load
- Error state reporting in HUD

### Auto-Save Status Indicator
- HUD badge showing: saving → saved → hidden (5s timeout)
- Error state persists until next save
- Status Zustand slice drives UI updates
- Visual feedback for offline play

### Settings Updates
- Slot-aware import/export (select target slot)
- Validation before import
- Return to Title button saves current state
- Delete slot with confirmation

### Internationalization
- Vietnamese translations for title screen (slot labels, actions, messages)
- Save/import dialog strings
- Status badge messages

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint code quality check |

## Testing Strategy

- **Unit Tests**: Vitest with save validation, type guards, migrations
- **Component Tests**: React component rendering, user interactions
- **Integration Tests**: Save/load lifecycle, slot management
- **Coverage**: Core systems (save, combat, economy)

## Architecture Principles

1. **State Centralization**: Zustand store is single source of truth
2. **Offline-First**: Web Worker enables play without server
3. **Type Safety**: TypeScript prevents invalid game states
4. **Modularity**: Systems isolated, loosely coupled
5. **Progressive Enhancement**: Graceful fallback if IndexedDB unavailable
6. **Accessibility**: Semantic HTML, keyboard navigation
