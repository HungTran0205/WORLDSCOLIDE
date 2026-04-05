# Codebase Summary

**Worlds Collide** — An HD-2D auto-RPG idle guild builder where civilizations collide. Build your guild hall, recruit members from different civilizations, dispatch quests, and watch your guild grow — even while you're away.

**Last Updated**: 2026-04-04 (Member Book UI v1.14 complete)

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
│   ├── components/         # Reusable UI components (stat bars, cards, dialogs, civ-badge, game-icon, cost-display, rank-badge, member-book)
│   ├── utils/              # Utility functions (icon-paths for convention-based icon resolution)
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
- `active-slot-storage.ts` — Slot tracking

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

### Guild Hall System (Tile-Based Build v1.10 Refactor — MAJOR)
- **Floor Tiles**: `guild.floorTiles: FloorTile[]` — Individual colored tiles at (x, z), cost 5g each
- **Flat Furniture**: `guild.furniture: PlacedFurniture[]` — Guild-level array (not room-scoped)
- **Removed**: Room/RoomType abstraction entirely (no more fixed blocks)
- **Removed**: onRoomClick panel access (use HUD buttons only)
- **2 Build Modes**: floor-tile (paint/erase), furniture (place on floor)
- **Build Menu**: 2-tab layout (Floor | Furniture)
  - Floor Tab: Color palette + paint/erase toggle buttons
  - Furniture Tab: All furniture with guild-level unlock badges
- **Floor Requirement**: Furniture must have floor tile underneath (mandatory)
- **Furniture Effects**: `calcFurnitureBonuses()` iterates guild.furniture[] array
- **Tutorial First-Build**: Paint 6x6 floor (36 tiles) to unlock furniture placement
- **Panel Access**: HUD buttons only (no direct 3D interaction) — tavern panel triggered by bar-counter furniture placement
- **Rendering**: Individual FloorTileMesh per tile + furniture mesh overlays

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

## Recent Changes (Building System Refactor — v1.10)

### Floor Tile Painting System (NEW - Tile-Based Architecture)
- **FloorTile Array**: `guild.floorTiles: FloorTile[]` — Individual colored tiles, cost 5g each
- **Paint Mode**: Click grid cell + select color → paint tile (mandatory floor coverage for furniture)
- **Erase Mode**: Click tile to erase (blocked if furniture occupies cell)
- **Default Floor**: 6x6 gold floor auto-created on new games (36 tiles = #DAA520)
- **No Adjacency Requirement**: Tiles placed freely (unlike old rooms)
- **Grid-Snapped**: All tiles snap to grid cells, 1x1 unit each

### Guild-Level Furniture System (MAJOR REFACTOR)
- **Flat Furniture Array**: `guild.furniture: PlacedFurniture[]` — No room-scoping
- **Floor Validation**: Furniture must have floor tile underneath (mandatory)
- **Guild-Level Unlock**: Each furniture type has `unlockedAtLevel` gate (no per-room unlocks)
- **Max Per Guild**: Furniture count limits at guild level (not per-room)
- **PlacedFurniture Structure**: `{ id, type, level, position: { x, z }, rotation }`
- **Placement Cost**: Gold + items from FurnitureDefinition.cost
- **Remove/Upgrade**: Remove by ID, upgrade with resource costs

### Removed Room Abstraction (BREAKING)
- **Removed**: Room/RoomType, room placement, room moving mechanics
- **Removed**: Room-scoped furniture nesting
- **Removed**: onRoomClick panel access (replaced with HUD buttons)
- **Removed**: Room-specific color system (replaced with flexible tile colors)
- **Removed**: Room adjacency + overlap validation (not applicable to tiles)

### Build Menu Refactor (UI Update)
- **Floor Tab**: Color palette for paint/erase modes
- **Furniture Tab**: All furniture with level unlock badges
- **No Room Tab**: Room selection removed entirely
- **Ghost Preview**: Shows tile color or furniture box (green valid, red invalid)

### Furniture Effects Renamed (File Refactor)
- **Renamed**: `room-effects.ts` → `furniture-effects.ts`
- **Function**: `calcRoomBonuses()` → `calcFurnitureBonuses()`
- **Bonus Source**: Iterates `guild.furniture[]` array (flat)
- **Example Effects**:
  - quest-board: +10% mission gold
  - bar-counter: shows tavern panel (furniture effect trigger, not room-based)
  - training-dummy: +5% combat EXP

### Panel Access Changes (UI Interaction)
- **Removed**: Direct 3D click-to-open (no rooms to click)
- **New**: HUD button bar for all panels (Quest, Roster, Build, Settings)
- **Tavern Panel**: Triggered by bar-counter furniture placement (not room existence)
- **No Scene Interaction**: All panel access via HUD buttons only

### Save Migration v9 → v10 (Complex)
- **Version Bump**: SAVE_VERSION = 10
- **Auto-Migration**: `migrateV9toV10()` flattens rooms → tiles+furniture
  - For each room: generates FloorTile[] covering room bounds with room color
  - For each room's furniture: copies to guild.furniture[] with absolute position
  - Adjusts furniture positions from room-relative to guild-absolute
  - Clears old rooms field
- **Transparent**: Auto-triggered on load, no user interaction required
- **Data Preservation**: All room data recoverable from tiles + furniture

### Tutorial First-Build Step (Changed)
- **Old**: Place 2+ rooms (rooms.length > 1)
- **New**: Paint full 6x6 floor (floorTiles.length > 36)
- **Progression**: Paint floor → unlock furniture placement tutorial

**Key Files (New)**:
- `src/game/systems/furniture-effects.ts` — Renamed from room-effects.ts, applies bonuses from furniture[]
- Enhanced `src/game/systems/furniture-system.ts` — Guild-level furniture placement validation

**Key Files (Modified)**:
- `guild-slice.ts` — Removed rooms, added floorTiles + flat furniture array, new actions (placeFloorTile, eraseFloorTile, placeFurniture)
- `build-mode-slice.ts` — Removed room placement, added floor-tile/erase-tile modes
- `building-system.ts` — Removed room collision logic, added floor tile validation
- `guild-hall.tsx` — Removed RoomMesh, added FloorTileMesh components
- `build-menu.tsx` — Updated to Floor/Furniture tabs
- `save-migrations.ts` — Added v9→v10 migration with room flattening
- `game-state.ts` — Updated GuildHall interface (floorTiles + furniture)

### Breaking Changes
- Room/RoomType abstraction completely removed
- Save v9 → v10 migration required (auto-transparent)
- Any code referencing rooms/room placement must migrate to tiles/furniture
- onRoomClick removed (use HUD buttons)

## Recent Changes (Character Sprite Animation — v1.11)

### Animated Sprite System (NEW - Civ-Specific Visuals)
- **SpriteAnimator Component**: R3F animated sprite with 4 directional walking frames (8 frames each, 10 FPS)
- **Convention-Based Path Resolution**: Single utility (`sprite-path-resolver.ts`) maps (civilization, archetype, gender) → sprite folder path
- **Sprite Folder Structure**: `/sprites/characters/{PREFIX}-{ARCHETYPE}-{GENDER}/animations/walking-8-frames/{direction}/frame_XXX.png`
- **Civ Prefix Mapping**: TS (LinhSon), DQ (DeQuoc), TL (ThienLu) — differs from CIV_CONFIG.shortName
- **12 Character Sprite Sets**: 3 civilizations × 2 archetypes × 2 genders (warrior/scout, engineer/scholar, dualblade/philosopher)
- **Direction Detection**: Calculated from movement delta (dx, dz) → north/south/east/west
- **Member Movement AI**: Random walk between room cell centers at 0.9 units/sec, idle between moves
- **Billboard Rendering**: Sprites always face camera, use NearestFilter for crisp pixel art
- **Texture Caching**: Three.js auto-caches by URL, reuses sheets across member instances

**Key Files (New)**:
- `src/scene/sprite-animator.tsx` — Animated sprite component with frame cycling
- `src/scene/sprite-path-resolver.ts` — Path resolution + direction detection
- `src/scene/member-layer.tsx` — ENHANCED: Replaced colored rectangles with animated sprite billboards, added movement AI

**Key Files (Modified)**:
- `game-state.ts` — Member interface: added optional `archetype` and `gender` fields
- `civilization-config.ts` — Added CivArchetype type (6 archetypes), Gender type, archetype arrays per civ — ENHANCED v1.11
- `character-creation.ts` — Sets archetype + gender from civ selection
- `mercenary-generator.ts` — Randomly assigns archetype + gender during recruitment

### Zero Breaking Changes
- Sprite system fully additive (visual enhancement only)
- Fallback to 'warrior'/'M' for old saves missing archetype/gender
- No data model breaking changes (new fields are optional)

## Recent Changes (Auto-Battler Combat Arena — v1.11 LIVE)

### Real-Time Combat Arena (MAJOR FEATURE — Replaces Text-Log Combat)
- **CombatEngine Class**: Tick-based real-time simulation (100ms logic ticks, 60fps rendering)
- **Dual Combat Modes**: Manual (player-controlled arena) vs Auto (existing simulateCombat preserved)
- **Formation Grid**: 2×3 slots (6 party members) front/back row positioning before battle
- **3D Beat-Em-Up Arena**: R3F Canvas with sidescroller camera (35° angle from horizontal), billboard sprites, bounded arena (X:[-8,8], Z:[-4,4])
- **Visual Effects**: HP bars, floating damage numbers, status effect indicators, attack/skill animations
- **Skill Hotbar**: Keys 1-4 to activate manual skills (cooldown tracking per skill)
- **Speed Control**: 1x/2x multiplier during combat, realtime combat timer
- **Victory/Defeat Screen**: Detailed result overlay with rewards (gold, EXP), injuries applied
- **Mission Integration**: Arena rewards seamlessly applied to mission system (mission-resolver.ts)
- **Game Tick Pause**: Main game loop paused while combat active (resumes on completion)
- **Full Backwards Compatibility**: Auto-resolve preserved, existing simulateCombat unchanged

**Arena Flow**:
1. Player at mission "Arrived" phase chooses "Manual" mode
2. enterCombatPrep() initializes arena state + formation
3. Formation prep UI (CombatPrepPanel) for slot assignment
4. Player clicks "Start Battle" → startBattle() → arenaPhase='fighting'
5. CombatFightController runs engine.tick() in useFrame loop
6. Entities sync visual state (position, animation, HP)
7. On victory/defeat: endCombat(result) → result screen
8. Exit arena: exitArena() → apply rewards + return to guild-hall scene
9. Game tick resumes, mission completes normally

**Spatial Combat**:
- **2×3 Formation Grid**: 6 slots with predictable x/z positions
  - Front row (closer to enemy): indices 0-2
  - Back row (farther): indices 3-5
- **Range-Based AI**: Warrior/scout (melee 1.5-2.0u), mage/scholar (ranged 5.0u)
- **Movement AI**: Smart pathfinding toward enemies, respects formation grid
- **Distance Calculation**: 3D Euclidean distance for target selection + ability range checks

**UI Layers**:
- **CombatPrepPanel**: Formation selector (drag/drop or click-assign members to slots)
- **CombatSkillHotbar**: Active skills (key 1-4) with cooldown progress bars
- **CombatDamageNumber**: Floating text (green heal, red damage) at entity positions
- **CombatResultOverlay**: Detailed outcome (victory/defeat, gold/EXP, injuries, loot)

**Key Files (New)**:
- `src/game/systems/combat-arena-types.ts` — ArenaEntity, Formation, ARCHETYPE_RANGE constants
- `src/game/systems/combat-engine.ts` — CombatEngine class (tick loop, skill activation, victory)
- `src/game/systems/combat-ai.ts` — findTarget(), moveToward(), distance calculations
- `src/game/systems/arena-result-handler.ts` — Apply arena rewards to mission state
- `src/game/state/combat-arena-slice.ts` — 9th Zustand slice (9 total now)
- `src/scene/combat-arena.tsx` — Main Canvas component (orthographic R3F)
- `src/scene/combat-arena-environment.tsx` — 3D ground plane + lighting setup
- `src/scene/combat-entity-sprite.tsx` — Billboard sprite + HP bar renderer
- `src/scene/combat-fight-controller.tsx` — useFrame loop, engine tick, sync to store
- `src/scene/combat-damage-number.tsx` — Floating damage text VFX
- `src/scene/combat-vfx-layer.tsx` — VFX manager, damage numbers, effect particles
- `src/ui/panels/combat-prep-panel.tsx` — Formation setup UI (slot assignment)
- `src/ui/panels/combat-skill-hotbar.tsx` — Active skill bar (keys 1-4)
- `src/ui/panels/combat-result-overlay.tsx` — Victory/defeat results screen

**Key Files (Modified)**:
- `combat-types.ts` — Extended CombatEntity with spatial fields (position, animState, etc.)
- `game-state.ts` — Added CombatArenaSlice interface + GameScene type ('guild-hall' | 'combat-arena')
- `store.ts` — Combined 9 slices (added combat-arena-slice)
- `mission-tick.ts` — Trigger enterCombatPrep() on manual mode selection
- `mission-resolver.ts` — Apply arena results via arena-result-handler.ts
- `game-screen.tsx` — Render CombatArenaCanvas when gameScene='combat-arena'
- `active-missions-list.tsx` — Show "Manual/Auto" choice on arrival + mission detail modal
- `use-game-tick-loop.ts` — Pause tick loop during arenaPhase='fighting'
- `floor-tile-texture-generator.ts` — (new) Generate floor textures procedurally

**Zero Breaking Changes**:
- Arena system fully optional (manual mode only, auto-resolve untouched)
- All existing save data compatible (arenaPhase/formation initialized on prep)
- No changes to combat formulas, skills, passives, or loot tables
- Can disable arena UI and use auto-resolve exclusively (backwards compatible)

### Performance & Compatibility
- **Logic**: 100ms ticks ensure consistent frame-rate independent simulation
- **Rendering**: 60fps via R3F useFrame (capped by browser refresh rate)
- **Memory**: ArenaEntity snapshots per update (O(n) where n = 6-12 entities typically)
- **Assets**: Reuses existing member sprites + enemy models (no new assets required for combat)
- **Fallback**: Auto-resolve preserved in full for players preferring text-based combat

## Recent Changes (Forest Arena HD-2D Upgrade — v1.13)

### HD-2D Diorama + 3D Props System (NEW - Octopath Traveler Style)
- **Forest Biome Upgrade**: Replaced 2D parallax background with Octopath Traveler/Triangle Strategy style GLB diorama (ground) + 3D billboard sprite characters
- **GLB Asset Pipeline**:
  - Diorama ground model: `/arena/forest/3dtiles/optimized/forestground.glb` (receives shadows)
  - 9 prop models (trees, logs, rocks, etc.): `/arena/forest/3dprops/optimized/` (cast + receive shadows)
  - Preloading at module import time prevents hitching during combat
- **Shadow Casting System**:
  - Directional light with 1024×512 shadow map, bias tuning for artifact-free shadows
  - 3D props cast shadows onto ground plane
  - Billboard character sprites upgraded to `MeshStandardMaterial` (was `MeshBasicMaterial`) to receive shadows
  - `castShadow` enabled on all prop and sprite meshes
- **Conditional 3D Rendering**: `is3D = Boolean(config.diorama)` detects 3D biomes; forest + cave biomes now support HD-2D
- **Backward Compat**: `diorama` and `props3D` are optional in `BiomeConfig` — missing fields gracefully use 2D system

**Key Files (New)**:
- `src/scene/combat-arena-3d-props.tsx` — `Environment3DModel`, `Prop3DModel`, `Prop3DLayer` components for GLB asset rendering

**Key Files (Modified)**:
- `src/scene/arena-biome-config.ts` — Added `Prop3D` type, `diorama?`, `props3D?` optional fields to `BiomeConfig`; forest config uses GLB assets
- `src/scene/combat-arena-environment.tsx` — HD-2D rendering pipeline (conditional 3D/2D), shadow-casting directional light for 3D biomes
- `src/scene/combat-arena.tsx` — Enabled shadow maps on Canvas (`shadowMap={{ type: PCFShadowShadowMap }}`)
- `src/scene/combat-character-animator.tsx` — `MeshBasicMaterial` → `MeshStandardMaterial`, `castShadow` on sprites
- `src/scene/enemy-sprite-animator.tsx` — `MeshBasicMaterial` → `MeshStandardMaterial`, `castShadow` on sprites

### Leva Debug Controls for 3D Props (NEW - Dev Mode)
- Real-time prop position/rotation/scale tuning via Leva folders
- Per-prop controls (posX/Y/Z, rotY, scale) + diorama scale slider
- Dynamic folder generation from `config.props3D[]` (generic for all biomes)
- Copy-config button logs tuned values to console for quick config updates
- DEV-gated, zero production impact

### Zero Breaking Changes
- HD-2D system fully opt-in via BiomeConfig (forest + cave both have 3D support)
- Backward compat: old saves load with 2D fallback if props3D missing
- No changes to combat mechanics, AI, or damage formulas

## Recent Changes (Guild Facilities System — v1.12)

### Multi-Facility Management (NEW - 4 Functional Zones)
- **4 Facility Types**: Tavern (lv1 default), Training Yard, Infirmary, Workshop
- **Facility Levels**: 0 (locked/unbuilt) → 1–3 (active upgrades)
- **Build Requirements**: Guild level ≥ 2 to unlock Training Yard, Infirmary, Workshop; Tavern starts at lv1
- **Upgrade Costs**: Each facility has build cost + two upgrade paths (lv1→2, lv2→3) in gold

### Member Assignment System (NEW - Slotted Workers)
- **Per-Facility Slots**: Each facility has `maxSlots` per level ([lv1, lv2, lv3] array)
  - Tavern: [1, 2, 2], Training Yard: [2, 3, 4], Infirmary: [1, 2, 3], Workshop: [1, 2, 3]
- **Assignment Blocking**: Members assigned to facilities marked with `assigned` status, cannot dispatch on missions or promote
- **Unassign Mechanic**: Click to remove member from facility, frees status + enables missions again
- **Visual Feedback**: Facility cards show assigned member list + bonus calculations with current assignments

### Stat-Based Production & Bonuses (NEW - 4 Distinct Mechanics)
- **Training Yard** (EXP passive): Base daily EXP per level [12, 22, 40], scaled by assigned members' DEX+AGI
  - Formula: `base * (1 + (DEX+AGI)*0.002)` per member
- **Workshop** (Materials): Daily items based on level, STR affects quantity, DEX chance to double iron ore at lv2+
  - Base outputs: Lv1 [3 wood, 2 stone], Lv2 [5 wood, 3 stone, 1 iron], Lv3 [8 wood, 5 stone, 3 iron]
  - Multiplier: `1 + STR*0.004` per member
- **Tavern** (Upkeep reduction): CHA-based gold savings on daily upkeep
  - Formula: Min(10%, totalCHA * 0.0005 * level) of daily upkeep
  - Example: 3 members with 50 CHA each at lv2 = ~1.5% upkeep reduction
- **Infirmary** (Recovery multiplier): END+INT improves injury recovery speed (lower multiplier = faster)
  - Base recovery mult per level: [0.75, 0.55, 0.40] (Infirmary scales recovery time)
  - Applied during injury-recovery tick processing in mission system

### Offline Production Tracking (NEW - Login Popup)
- **OfflineFacilityPopup**: Shown on game load if facilities produced while away
- **Production Calculation**: For each game-day elapsed, facility production applied per assigned members
- **Displays**: EXP gains (training), items (workshop), upkeep saved (tavern), recovery applied (infirmary)
- **Dismissable**: Click to acknowledge, popup clears without manual claiming
- **No Offline Loss**: All production accumulated accurately from timestamp

### State Management (NEW - Game State Extension)
- **`facilities: GuildFacility[]`** — Array of facility objects (type, level, assignedMemberIds)
- **`facilityProduction: LastProductionDay`** — Timestamp tracking for offline catch-up
- **Zustand Actions**:
  - `buildFacility(type)` — Create facility at lv1 if not exists, cost validation
  - `upgradeFacility(type)` — Upgrade to next level, cost validation
  - `assignMemberToFacility(facilityType, memberId)` — Add to assignedMemberIds, mark member `assigned`
  - `unassignMemberFromFacility(facilityType, memberId)` — Remove from assignedMemberIds, clear `assigned` status

**Key Files (New)**:
- `src/game/data/facility-definitions.ts` — Static facility config (name, costs, slots, descriptions)
- `src/game/systems/facility-production-system.ts` — Pure production calculations per facility type + game-days
- `src/ui/panels/facilities-panel.tsx` — Unified UI for all 4 facilities + member slots
- `src/ui/panels/facility-card.tsx` — Single facility display with assignment UI + bonus preview
- `src/ui/components/offline-facility-popup.tsx` — Login popup showing offline production

**Key Files (Modified)**:
- `game-state.ts` — Added GuildFacility interface + FacilityType type
- `guild-slice.ts` — Added facilities[] array, facilityProduction timestamp, build/upgrade/assign actions
- `use-game-tick-loop.ts` — Calls processFacilityProduction() on game load for offline catch-up
- `game-screen.tsx` — Renders OfflineFacilityPopup if production occurred while away

### Panel Integration
- **HUD Button**: "Facilities" button in toggle bar (replaces old "Tavern" button)
- **Panel Layout**: Tabs or scrollable list of 4 facility cards
- **No Direct 3D Interaction**: All access via HUD panel only (consistent with furniture-based build system)

### Zero Breaking Changes
- Facilities fully optional (players can ignore, gameplay proceeds)
- No changes to core economy, combat, or mission mechanics
- Backward compatible with existing saves (new fields initialize on upgrade)
- Facility bonuses are passive (no active skills or complex triggers)

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

### Combat Passives System (REFINED - 3 Exclusive Abilities)
- **Son The (Linh Sơn)**: Last-stand mechanic — END +30% when HP ≤ 30% (survivability)
- **Dien The Chi Huy (Đế Quốc)**: 3-stack trigger → Shock debuff (enemy skip 1 tick) + team buff (+5% crit/dmg 5s)
- **Tinh Lo (Thiên Lữ)**: 2-tier hit stacking — 5 hits → +15% crit 5s, 15 hits → clone (extra attack 5s)
- **PassiveState Tracking**: Expanded to track stacks, Shock readiness, team buff duration, crit bonus, clone duration
- **Combat Integration**: Passives triggered on damage dealt, applied in real-time + simulator with synchronized behavior
- **Display**: Passive abilities shown in character detail panel + member book derived stats section

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

### UI & Audio Enhancements (NEW)
- **Civ Badges**: Quest board + roster show civilization emblems for filtering
- **Audio Expansion**: 6 new keys (BGM_COMBAT, SFX_CRIT, SFX_DODGE, SFX_DEATH, SFX_SKILL, SFX_RECRUIT)

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

## Recent Changes (Member Book UI — v1.14)

### Unified Book-Style Roster (NEW - Major UI Redesign)
- **Replaces Dual Overlays**: Single 680px-wide book panel replaces detached roster + character detail
- **Bookmark Navigation**: Left edge (78px) scrollable bookmark column with avatar thumbnails, short names, status dots
- **Status Indicators**: Gold (founder), green (available), blue (on-mission), red (injured), amber (mercenary)
- **Two-Page Layout**: Left page (identity, biography, civ passive, equipment, skill) + right page (talents, combat stats, guild stats)
- **Ruled-Line Texture**: Pure CSS gradient texture on both pages for ledger aesthetic
- **Sticky Footer**: Action footer (promote, invite, release) always visible; rank-aware (mercenary hides promote, shows invite cost)
- **Independent Scroll**: Both pages scroll independently; footer fixed outside scroll area

### Derived Combat & Guild Stats Display (NEW - Read-Model Stats)
- **Combat Stats Section**: 2-column grid (ATK, DEF, SPD, CRIT, HP, MP, EVA, ACC) calculated from member base stats
- **Guild Stats Section**: 4 labeled progress bars (member facility contributions) derived from facility assignments
- **Selector-Based**: All derived values computed on demand via `memberDerivedStats` selectors, no schema changes

### Member Book Components (NEW)
- **member-bookmark-list.tsx**: Scrollable bookmark column (78px) with active state gold accent
- **member-book-detail-page.tsx**: Two-page book layout with spine divider, title bar, sticky footer
- **member-derived-stats-section.tsx**: Combat stats grid + guild stats progress bars section
- **Integration**: Embedded in guild-roster.tsx as single unified panel

### Responsive Design
- **Wide Viewport (>720px)**: Two-page side-by-side layout
- **Narrow Viewport (<720px)**: Pages stack vertically, bookmark column fixed
- **Mobile Fallback**: Single column with horizontal scroll fallback

**Key Files (New)**:
- `src/ui/components/member-bookmark-list.tsx` — Bookmark navigation with status indicators
- `src/ui/components/member-book-detail-page.tsx` — Two-page book shell + layout
- `src/ui/components/member-derived-stats-section.tsx` — Derived stats display (combat + guild)

**Key Files (Modified)**:
- `src/ui/panels/guild-roster.tsx` — Replaced dual-overlay with unified book panel (680px)
- `src/ui/components/roster-list-item.tsx` — Preserved (bookmark uses avatar from this style)
- `src/ui/styles/panels.css` — Added book-specific styles (ruled-line texture, spine, page layout)
- `src/game/state/selectors.ts` — Selector-based derived stats queries

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
