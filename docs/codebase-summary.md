# Codebase Summary

**Worlds Collide** — An HD-2D auto-RPG idle guild builder where civilizations collide. Build your guild hall, recruit members from different civilizations, dispatch quests, and watch your guild grow — even while you're away.

**Last Updated**: 2026-05-21 (New Game Flow — Split-Hero Character-Creation Wizard)

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
.
├── src/                     # Main game application (Vite + React + Zustand)
│   ├── game/                # Core game logic & state
│   │   ├── state/           # Zustand store + slices (game, guild, roster, mission, combat, save-status, inventory, build-mode)
│   │   ├── systems/         # Game simulation (combat, leveling, economy, missions, building, combat-passives)
│   │   │   └── workers/     # Web Worker game loop for offline progression
│   │   ├── data/            # Static data (enemies, missions, skills, buildings, characters, civilization-config)
│   │   └── save/            # Persistence layer (3-slot IndexedDB + JSON import/export)
│   ├── scene/               # React Three Fiber 3D guild hall scene
│   ├── ui/                  # User interface
│   │   ├── screens/         # Full-screen views (title screen with slot selection)
│   │   ├── panels/          # Collapsible UI panels (quest board, roster, build, combat, settings)
│   │   ├── hud/             # Heads-up display overlay + panel toggle bar + save status badge
│   │   ├── components/      # Reusable UI components (stat bars, HP/EXP bars, tier-badge, rank-badge, member-card with rank treatment, inventory-slot with rarity modifier, civ-badge, game-icon, cost-display)
│   │   ├── utils/           # Utility functions (icon-paths for convention-based icon resolution)
│   │   └── styles/          # CSS for panels, HUD, and screens
│   ├── audio/               # Howler.js audio manager + sound key enums (6 new keys)
│   ├── i18n/                # i18next localization (Vietnamese default)
│   └── main.tsx             # Application entry point
│
└── tools/                   # Companion development tools
    └── map-playground/      # Map editor & asset prototyping tool (Phase 1 of WC-MAPMAKER)
        ├── src/
        │   ├── app.tsx      # 3-column layout (asset browser | viewport | properties)
        │   ├── main.tsx     # Entry point
        │   ├── store/
        │   │   └── scene-store.ts   # Zustand scene state (stub)
        │   └── ui/
        │       └── styles.css       # Layout styles
        ├── vite.config.ts   # Custom plugin: /api/asset-manifest + /game-assets/* server
        └── package.json     # Vite + React 19 + Zustand setup
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
- **Founder**: Player-named guild leader with 7 stats, created via the split-hero new-game wizard (Civilization → Class → Mask → Identity → Begin)
- **Founder Classes** (founder-only): Templar (`sword`), Forester (`warrior`), Ranger (`scout`) — Linh Sơn MVP, defined in `founder-archetypes.ts`. `sword` is NOT recruitable (excluded from `CIV_CONFIG.LinhSon.archetypes`, still `['warrior','scout']`)
- **`createFounder(name, stats, civilization, archetype, gender, maskSpriteId)`**: honors player class/gender/mask choice; founder skill is archetype-matched (sword/warrior→warrior kit, scout→scout kit). No SAVE_VERSION bump (fields already optional)
- **Members**: Recruit from 3 civilizations, 80+ unique heroes
- **Progression**: EXP curves (1.35x scaling), stat allocation (50 Talent Points), 100 levels
- **Classes**: 2 recruitable archetypes per civilization (see `civilization-config.ts`)

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

### Combat System (v1.19 GPU-Instanced Rendering)
- **Tick-based Logic**: CombatEngine (100ms ticks), auto-RPG mechanics
- **Formulas**: AGI+weapon speed for action order, crit chance, status effects
- **Status Effects**: Poison, stun, vulnerability, defense buffs
- **Damage Calculation**: Base damage + scaling + weapon/armor
- **Formation Grid**: 2×3 layout (3 allies + 3 enemies per row), range-based AI targeting
- **Wave System**: Multi-wave missions with atlas pre-loading of all enemy templates

### Combat Rendering (v1.19 — GPU Instancing, WebGPU-Compatible)

**Architecture**: Single draw call for ALL sprites via InstancedMesh. All sprite frames packed into shared mega-atlas. Animation/position state in Float32Array (imperative, non-React).

**Core Modules** (`src/scene/combat/`):
- **MegaAtlasBuilder** — Loads walk/attack/death frames for all characters + all waves → packs into shared CanvasTexture (flipY=false for WebGPU)
- **SpriteRegistry** — Maps (typeId, animState, frameIndex) → UV coords in atlas (O(1) cached lookups)
- **AnimationStateBuffer** — 18 floats per entity (pos, animState, frameIndex, hp%, alive, tint, scale); zero React overhead
- **CombatStateBridge** — Syncs CombatEngine → AnimationStateBuffer every frame; derives typeId from entity
- **InstancedSpriteRenderer** — Renders 48 entities in 1 draw call; billboard rotation via camera quaternion; WebGPU workaround: always render MAX_INSTANCES, hide unused via opacity=0
- **SpriteMaterial** — Dual-path material (MeshBasicNodeMaterial+TSL for WebGPU, ShaderMaterial+GLSL for fallback); per-instance UV remapping + tint + alpha-test
- **CombatTextLayer** — Entity name labels as canvas-texture sprites (fixed 256×48 canvas, NOT troika SDF which uses GLSL incompatible with WebGPU)
- **DamageNumberPool** — 32 pooled floating damage numbers, imperative spawn via ref, float-up + fade-out (fixed 160×48 canvas)
- **InstancedHpBars** — HP bars via InstancedMesh
- **CombatVfxSpawner** — VFX layer for visual effects

**WebGPU Compatibility Fixes**:
- CanvasTexture.flipY must be false (true breaks UV formula)
- Troika-three-text (SDF) replaced with canvas-texture sprites (GLSL incompatible with WebGPU)
- InstancedMesh.count dynamic changes not picked up; use opacity=0 for hidden slots instead
- Canvas texture resize errors; use fixed dimensions (256×48, 160×48)

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
- **Character Creation**: Split-hero wizard — large live `CharacterPreview` (avatar + live mask overlay) pinned left; right panel steps through Civilization → Class → Mask → Identity. Components: `civ-selector` (locked civs dimmed), `archetype-selector`, `mask-selector`, `stat-allocator` (50 Talent Points). See `docs/feature/new-game-flow.md`
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

## v1.10–v1.15 Releases Summary

**v1.10 (Building System Refactor)**: Tile-based architecture, guild-level furniture placement, save migration v9→v10

**v1.11 (Auto-Battler Combat Arena)**: Real-time 3D combat with CombatEngine, 2×3 formation grid, manual/auto modes

**v1.12–v1.13 (Facility System & HD-2D)**: 4 facility types (Tavern/Training/Infirmary/Workshop), HD-2D forest diorama, 3D GLB props, shadow casting

**v1.14 (Combat Arena HD-2D Redesign)**: Beat-em-up camera (35° angle), arena expansion, tile grid floor, multi-wave encounters, depth-of-field

**v1.15 (Facility Rooms with Camera Navigation)**: Enter facility rooms, 3D scene per facility type, camera animation, WASD pan controls, smooth transitions

*Detailed release notes available in git history. Focus: recent features (v1.16+) documented in detail below.*

### Zero Breaking Changes
- Backward compat: missions without `waves` field default to single-wave mode
- Formation positioning unchanged for non-wave missions
- Post-processing additive (DoF on top of existing vignette)

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

### Game-Day Timing Constants (CRITICAL)
- **1 game-day = 14400 real ticks = 4 real-hour** (online scheduler runs at 1Hz via Web Worker)
- `TICKS_PER_DAY = 14400` const lives in `facility-production-system.ts`; `STONE_QUARRY_CONFIG.ticksPerDay = 14400` mirrors the same value
- Online tick path (`processLoggingSiteTick`, `processStoneQuarryTick`) runs once per real-second
- Offline catch-up (`processFacilityProduction`) multiplies per-tick rates × `TICKS_PER_DAY` per game-day → must use the same constant or rates diverge
- Vein strike probability: `dailyStrikeChance / 14400` per tick — keeps "X strikes per game-day" intent
- UI labels read "+N Wood/gameday" / "+N Stone/gameday" so player-visible numbers match the per-game-day rate

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

## Recent Changes (3D Facility Zone Visualization — v1.12.1)

### Visual Facility Zones in Guild Hall (NEW - Always-Visible 3D Zones)
- **4 Permanent Zone Markers**: Colored floor planes indicating Tavern, Training Yard, Infirmary, Workshop locations
  - **Tavern**: Gold (#D4A017) footprint
  - **Training Yard**: Red (#B04040) footprint
  - **Infirmary**: Blue (#4080B0) footprint
  - **Workshop**: Brown (#8B6914) footprint
- **Locked vs. Active States**: Locked zones (level 0) render grey (opacity 0.15), active zones (level 1+) show facility color (opacity 0.25)
- **Level-Gated Props**: GLB furniture models scale to facility level progression
  - **Level 1**: 1 prop per zone (bar-counter, training-dummy, medical-bed, workbench)
  - **Level 2**: 2 props per zone (original + secondary pair, e.g., wine-barrel for tavern, alchemy-table for infirmary)
  - Models auto-scale to target height via `useScaledModel()` hook (preserves proportions)
- **Ambient Lighting**: Each zone has warm/cool point lights scaled to level (warmth for tavern/workshop, cool for infirmary)
- **Assigned Member Sprites**: Up to 4 idle members per zone render in 2×2 grid layout
  - Static (no wandering), always facing south, blob shadows on ground
  - Name labels above sprites with text-shadow for readability
  - Uses existing SpriteAnimator + sprite-path-resolver for consistent 4-directional sprites
- **Interactive Zones**: Clicking zone opens FacilitiesPanel focused on that facility (via `setPendingFacilityPanel`)
- **Build Mode Hiding**: All zones (markers, props, sprites) hidden when `isBuildMode = true` (preserves floor/furniture editing focus)
- **Zustand Bridge**: `FacilityZoneSlice` manages `pendingFacilityPanel` + `focusFacilityType` state for seamless R3F → UI panel transition

**Key Files (New)**:
- `src/scene/facility-zone-layer.tsx` — Master layer component rendering all 4 zones with click handling
- `src/scene/zone-floor-marker.tsx` — Colored semi-transparent plane mesh per zone (locked/active color logic)
- `src/scene/zone-props.tsx` — Level-gated GLB furniture models with auto-scaling + point lights
- `src/scene/zone-member-sprites.tsx` — Static 2×2 grid member sprite rendering with fallback gender/archetype
- `src/game/state/facility-zone-slice.ts` — Zustand slice for zone interaction state (pending panel, focus type)

**Key Files (Modified)**:
- `guild-hall.tsx` — Integrated FacilityZoneLayer into isometric scene (rendered alongside furniture layer)
- `game-screen.tsx` — Watches `pendingFacilityPanel` + auto-opens FacilitiesPanel on zone click

## Recent Changes (Facility Rooms with Camera Navigation — v1.15.0)

### Camera Navigation System (NEW - Animated Room Transitions)
- **4 Facility Rooms**: 7×7 rooms positioned behind guild hall (z < 0) for Tavern, Training Yard, Infirmary, Workshop
  - Each room has tinted floor (facility-specific color), 3 walls (back/left/right opaque), transparent front wall
  - HTML label showing facility name + level indicator
  - Rooms always rendered, accessible via camera animation
- **Zustand CameraSlice**: `cameraTarget: [x, y, z]` state + actions
  - `setCameraTarget(target)` — Trigger animation toward room center
  - `resetCameraToGuildHall()` — Return to default guild hall view [5, 0, 3.5]
  - Default: GUILD_HALL_CAMERA_TARGET = [5, 0, 3.5]
- **Camera Animation**: CameraController uses useFrame + lerp
  - Lerp speed: 0.08 per frame (≈500ms for full transition at 60fps)
  - Stops animating when within 0.01 unit threshold (on-demand rendering)
  - Offset formula: `cameraPosition = cameraTarget + [10, 10, 10.5]` (isometric perspective)
  - OrbitControls: Rotation disabled, pan disabled during build mode
- **UI Integration**: FacilitiesPanel "Enter Room" button
  - Click → `setCameraTarget(FACILITY_DEFINITIONS[type].roomCenter)` + close panel
  - Home button (🏠) calls `resetCameraToGuildHall()`
  - No state persistence (camera defaults to guild hall on load)

**Key Files (New)**:
- `src/game/state/camera-slice.ts` — CameraSlice state + actions
- `src/scene/camera-controller.tsx` — Animation controller using useFrame + lerp
- `src/scene/facility-room.tsx` — Single 7×7 room with walls, floor, label
- `src/scene/facility-rooms-layer.tsx` — Orchestrator for all 4 facility rooms

**Key Files (Modified)**:
- `src/game/state/store.ts` — Integrated CameraSlice into GameStore
- `src/scene/world.tsx` — Added FacilityRoomsLayer to Canvas (after GuildHall, before MemberLayer)
- `src/ui/panels/facilities-panel.tsx` — Added "Enter Room" button with setCameraTarget() call
- `src/scene/guild-hall.tsx` — FacilityZoneLayer removed from render (complemented by FacilityRoomsLayer)

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

## v1.6–v1.9 Releases (Roster, Rank System, Civilizations)

**v1.6 (Roster Management & Combat Enhancements)**:
- Multi-member quest dispatch, skill cooldown rebalance, auto-cast toggle
- Compact roster UI with character detail panel, roster-list-item component

**v1.7–v1.8 (Guild Rank System)**:
- 5-tier rank hierarchy (RECRUIT→MEMBER→VETERAN→OFFICER→COMMANDER)
- Mercenary rank, upkeep modifiers (0.8x–1.3x), EXP bonuses (0–20%)
- Promotion system: level + missions completed + gold cost

**v1.9 (Milestone 2 Vertical Slice)**:
- 3 civilizations (Human, Orc, Elf) with 3 combat passives
- 22 missions, 15 enemy types, 7 skills, 6 audio keys
- Civilization archetype system, icon asset integration (60+ pixel-art icons)

## Recent Changes (Inventory & Multi-Resource Economy — v1.5, Enhanced v1.20+)

### Item Database & Inventory System (Major Feature, v1.5 — Enhanced v1.20+)
- **Item Types**: 8 core materials (WOOD, STONE, IRON_ORE, etc.), consumables, equipment with rarity tiers
- **Rarity System**: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY — applies to items and equipment
- **Inventory State Structure**: `{ items: Partial<Record<ItemID, number>>; equipmentInventory?: EquipmentItem[]; categoryCapacity?: Partial<Record<InventoryCategory, number>>; }`
  - `items`: Quantity map by ItemID
  - `equipmentInventory`: Unequipped equipment instances (EquipmentItem with id, templateId, durability)
  - `categoryCapacity`: Optional per-category slot overrides (defaults to 30/category, max 200 when expanded)
- **Inventory Categories**: `'material' | 'consumable' | 'weapon' | 'armor'`
- **Inventory Zustand Slice**: Atomic `consumeItems()`, `addItem()`, `removeItem()`, `expandCategorySlots()`, `removeEquipmentFromInventory()`
- **Item Registry**: `items.ts` defines all item types with name, type, rarity, and stack limits
- **Unified Slot Entry** (NEW v1.20): Discriminated union pattern for inventory grid rendering
  - `{ kind: 'item'; itemId: ItemID; quantity: number }`
  - `{ kind: 'equipment'; item: EquipmentItem; templateId: EquipmentTemplateId }`

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

## Earlier Versions Summary (v1.2–v1.5)

**v1.3 (Build Mode Advanced)**:
- Build mode toggle, grid visibility, member hiding during placement
- Room moving/rotation/pickup mechanics with collision exclusion
- Context-aware placement hints, 48-test coverage

**v1.4 (Structures Utility)**:
- Mercenary system, Tavern recruitment, Quest Board tier gating
- Cost calculations for building placements

**Note**: Detailed release notes for v1.2–v1.5 archived in git history. Current focus on v1.6+ and recent features.

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

## Recent Changes (UI Enhancements & New Facilities — v1.16)

### +5 Stat Allocation Button (NEW - Gameplay Feature)
- **Per-Member Allocation**: Members gain 5 free stat points on reach each new level (new feature toggle)
- **UI Control**: "+5 Stats" button in character-detail-panel and member-book-detail-page
- **Point Distribution**: Player selects destination stat for each of 5 points
- **Persistence**: Consumed points tracked in member state

### New Facility Types: Logging Site & Stone Quarry
- **Logging Site**: STR-based wood production (introduced v1.18 with finite reserve system)
- **Stone Quarry**: STR-based stone production (similar mechanics, infinite reserve)
- **Production Formula**: `productPerTick = baseRate × (STR×0.5+END×0.3+DEX×0.2)/100`
- **Build Cost**: Variable by facility type (Logging Site requires permit, Quarry costs gold)

### WASD Camera Pan Controls (NEW - UI Feature)
- **Camera Navigation**: WASD keys pan facility room view left/right/forward/back
- **ESC to Exit**: ESC key returns to guild hall from facility room
- **Smooth Transitions**: Lerp-based camera movement (no snapping)
- **Keyboard Focus**: Only active in facility room view

### Room Navigation Bar (NEW - Facility Room UI)
- **room-nav-bar.tsx**: Top facility room component showing facility icon buttons
- **Facility Buttons**: Click to switch between assigned facilities (Tavern, Training, etc.)
- **Home Button**: Return to guild hall
- **Visual Feedback**: Active facility highlighted

## Recent Changes (Tutorial First-Session Flow — v1.17)

### Narrative Onboarding System (NEW - Player Experience)
- **World Board Lore Modal**: Initial onboarding screen explaining guild setting
- **Tutorial Quest Dispatch**: Auto-dispatched "Into the Clearing" mission on first session
- **Kael NPC Recruitment**: Tutorial quest completion unlocks free hero recruitment
- **Logging Permit Reward**: Tutorial quest grants 1 Logging Permit item
- **Facility Build Gate**: Tutorial progression: quest → dispatch → complete → build facility

### Panel Gating During Tutorial (NEW - Feature Gates)
- **Quest Board Filtering**: Only tutorial-related quests visible during onboarding
- **Facility Highlights**: New facility slots visually highlighted during build phase
- **Save Migration v11 → v12**: Adds `tutorialStep` tracking to game state

### Auto-Advance Mechanics (NEW - Quest System)
- **Quest Completion Trigger**: Tutorial advances on quest completion
- **Build Trigger**: Tutorial advances after first facility placement
- **Member Assignment Trigger**: Tutorial advances after assigning member to facility
- **Multi-Gate Progression**: World board → quest dispatch → quest active → Kael rescue → reward → build → assign → complete

## Recent Changes (Atmospheric VFX System — v1.19)

### Atmospheric Particle VFX Integration (NEW - Map Playground Support)
- **BiomeConfig Field**: Optional `atmosphericVFX: AtmosphericVFXPlacement[]` in arena config
- **VFX Presets**: 4 built-in effects (fog-mist, cave-ember, forest-spore, dust-motes) — expandable via ATMOSPHERIC_PRESETS map
- **R3F-VFX Integration**: Uses r3f-vfx particle system for performant effect rendering
- **Per-Effect Config**: Position, scale, particle count, colors, lifetime, gravity, blending
- **Map Playground Export**: Code generator outputs atmospheric VFX placements for copy-paste into BiomeConfig
- **Backward Compatible**: BiomeConfig without `atmosphericVFX` field renders normally (optional field)

**Key Files (New)**:
- `src/scene/arena-atmospheric-vfx.tsx` — Component rendering atmospheric VFX array from BiomeConfig
- `src/scene/arena-biome-config.ts` — Updated with `AtmosphericVFXPlacement` interface + optional `atmosphericVFX?` field

**Key Files (Modified)**:
- `src/scene/combat-arena-environment.tsx` — Added `<ArenaAtmosphericVFX placements={biomeConfig.atmosphericVFX ?? []} />` render

## Recent Changes (HD-2D Atmospheric Depth — Phase 01 Foundation — 2026-05-12)

### Per-Room Atmospheric Theming Foundation (NEW - Context & Plumbing Only)
- **Module**: `src/scene/atmospheric/` — 7-file foundation for room-specific post-FX, particles, and lighting presets
- **Context Provider**: `AtmosphereProvider` wraps world scene; exports `useAtmosphere()` for consumer components
- **Preset Registry**: 9 room IDs (guild-hall, main-hall, tavern, training-yard, infirmary, workshop, logging-site, stone-quarry, alchemy-lab) with typed `AtmospherePreset` shape
- **Active-Room Detection**: `useActiveRoomId()` derives current room from camera position; triggers smooth preset transitions via `useLerpedAtmosphere()` over 500ms
- **Settings Integration**: `GameSettings.atmosphericEnabled` toggle (default true); when disabled, provider returns null (zero overhead)
- **Zero Visual Changes at Phase 01**: Pure data/plumbing; phases 02–05 mount actual post-FX effects, particles, and lighting
- **Deviation Notes**: Phase 01 implemented 9 rooms (not 11 as prose stated); preset shape locked; context split into 3 files per react-refresh lint rules

**Key Files (New)**:
- `src/scene/atmospheric/atmosphere-types.ts` — `RoomId` union, `AtmospherePreset` interface, `BASELINE_PRESET`
- `src/scene/atmospheric/atmosphere-presets.ts` — Registry of 9 tuned presets (Phase 04 complete)
- `src/scene/atmospheric/atmosphere-context-store.ts` — Zustand store instance
- `src/scene/atmospheric/atmosphere-context.tsx` — React provider component
- `src/scene/atmospheric/use-atmosphere.ts` — Consumer hook
- `src/scene/atmospheric/use-active-room-id.ts` — Camera→room selector
- `src/scene/atmospheric/use-lerped-atmosphere.ts` — Numeric preset lerp helper

**Key Files (Modified)**:
- `src/game/state/guild-slice.ts` — Added `atmosphericEnabled: boolean` setting
- `src/scene/world.tsx` — Wrapped scene with `<AtmosphereProvider>`

### World Atmospheric Composer & Effect Stack (Phase 02–05 — 2026-05-12)
- **Replaces** static `src/scene/world-bloom-post.tsx` with preset-driven composer `src/scene/atmospheric/world-atmospheric-post.tsx`.
- **WebGL Stack**: N8AO → DOF (dynamic room-tracking target) → TiltShift → Bloom → GodRays → HueSat → BrightnessContrast → Vignette → Noise → ChromaticAberration → ToneMapping (ACES Filmic, last).
- **WebGPU Path** (Phase 05): TSL chain (Bloom → TiltShift → ColorGrade → Vignette → ChromaticAberration → ACES ToneMapping); functional parity for five core effects achieved (DOF/GodRays remain WebGL-only). TiltShift: Gaussian masked blur, SIGMA=4, half-res, mask formula `smoothstep(0, 0.3, abs(uv.y - 0.5) - halfWidth)` matches WebGL exactly.
- **Quality Tier**: `graphicsQuality='low'` strips DOF, GodRays, ChromaticAberration, LUT; Bloom + Noise + ToneMapping always on.
- **Per-Room Tuning**: DOF `focalLength` & `bokehScale` per preset; target syncs auto from camera controller lerp (no preset transition needed on room change).
- **RT Leak Fix** (Phase 05): `chainDisposables` array in pass closure collects TempNode dispose closures for cleanup on unmount.

**Key Files (New)**:
- `src/scene/atmospheric/world-atmospheric-post.tsx` — Composer entry wrapping effect stack or WebGPU pass
- `src/scene/atmospheric/atmospheric-effect-stack.tsx` — WebGL effect children chain
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` — TSL chain: bloom → tilt-shift → colorGrade → vignette → chromAb → ACES; refs-based preset sync; chainDisposables for RT cleanup
- `src/scene/atmospheric/tsl/vignette-node.ts` — TSL vignette node (pmndrs DEFAULT radial darkening)
- `src/scene/atmospheric/tsl/color-grade-node.ts` — TSL color-grade node (hue/saturation/brightness/contrast chained)
- `src/scene/atmospheric/tsl/tilt-shift-node.ts` — TSL tilt-shift node (Gaussian masked blur, SIGMA=4, half-res, strength-driven mask)
- `src/scene/atmospheric/tsl/types.ts` — `TslChainHolder` + uniform interfaces (bloom, vignette, colorGrade, tiltShift required; chromAb optional)
- `src/scene/atmospheric/atmospheric-leva-controls.ts` — Dev tuning multipliers schema

**Key Files (Modified)**:
- `src/scene/atmospheric/atmosphere-types.ts` — Added `GodRaysConfig.sourceId` field, `ChromaticAberrationConfig` on `AtmospherePreset`
- `src/scene/world.tsx` — Updated import: `world-bloom-post` → `world-atmospheric-post`

### Ambient Particle System (Phase 03 — 2026-05-12)
- **4 Particle Types**: dust-motes (warm drift), embers (upward hot), magic-motes (cool swirl), pollen (settlement). All use additive blending, wrap-on-bounds lifecycle, tier-aware counts.
- **Deterministic PRNG**: Mulberry32 seeded RNG (replaces Math.random for React purity compliance); deterministic particle layout per seed.
- **Procedural Texture**: 32×32 soft-circle DataTexture (SSR-safe singleton), reused across all archetypes.
- **Bounds Helper**: RoomId → Box3 lookup + `randomInBounds(prng)` utility; floor-Y assumption documented.
- **Router & Wiring**: `particles-router.tsx` key-driven preset.particles → component switch. Mounted in `world.tsx` inside AtmosphereProvider.
- **Tier Scaling**: Quality tier (`graphicsQuality='low'`) reduces counts by ~65% (dust: 30, embers: 20, magic: 15, pollen: 10).
- **React Integration**: useState + useRef for mutable frame buffers (idiomatic r3f pattern); exhaustive-deps compliant.

**Key Files (New)**:
- `src/scene/atmospheric/particles/shared-particle-texture.ts` — Shared 32×32 texture singleton
- `src/scene/atmospheric/particles/particle-prng.ts` — Mulberry32 PRNG with seed determinism
- `src/scene/atmospheric/particles/particle-bounds.ts` — RoomId bounds + spawn helpers
- `src/scene/atmospheric/particles/dust-motes.tsx` — Slow warm drift (high/low: 100/30)
- `src/scene/atmospheric/particles/embers.tsx` — Upward hot orange (high/low: 80/20)
- `src/scene/atmospheric/particles/magic-motes.tsx` — Cool purple swirl with opacity pulse (high/low: 60/15)
- `src/scene/atmospheric/particles/pollen.tsx` — Yellow settlement toward ground (high/low: 40/10)
- `src/scene/atmospheric/particles/particles-router.tsx` — Preset-driven particle type switch

**Key Files (Modified)**:
- `src/scene/world.tsx` — Mount `<AmbientParticlesRouter>` inside AtmosphereProvider

### Per-Room Atmospheric Presets Tuning (Phase 04 — 2026-05-12)
- **9 Tuned Presets**: Guild hall, main hall, tavern, training yard, infirmary, workshop, logging site, stone quarry, alchemy lab each with distinct mood, bloom, DOF, vignette, and particle settings.
- **Hemisphere Light Mounting**: Conditional mount in `AtmosphereProvider` reads `hemisphereLight` from lerped preset; rooms with `null` skip entirely (zero cost).
- **Mood Field**: Optional `mood?: string` added to `AtmospherePreset` for designer notes (documentation-only, not read at runtime).
- **Lerp Integration**: `useLerpedAtmosphere()` passes `mood` through unchanged; hemisphereLight properties (skyColor, groundColor, intensity) lerp smoothly across 500ms transitions.

**Key Files (Modified)**:
- `src/scene/atmospheric/atmosphere-presets.ts` — Replaced baseline stubs with 9 per-room tuned presets
- `src/scene/atmospheric/atmosphere-types.ts` — Added optional `mood?: string` field to `AtmospherePreset`
- `src/scene/atmospheric/use-lerped-atmosphere.ts` — Routes `mood` field from target preset (no lerp, informational only)
- `src/scene/atmospheric/atmosphere-context.tsx` — Conditional `<hemisphereLight>` mount gated by `hemi` presence

## Recent Changes (Inventory Panel Redesign — v1.20)

### Inventory Panel UI Overhaul (NEW - Major UI Component)
- **Tab Navigation**: All | Weapons | Armor | Materials | Consumables with tab counts
- **Search Bar**: Real-time filtering by item name (case-insensitive substring match)
- **Rarity Filter**: All | COMMON | UNCOMMON | RARE | EPIC | LEGENDARY (visual color-coded buttons)
- **Sort Options**: By rarity (default), by name (A–Z), by quantity (descending)
- **8-Column Grid Layout**: Responsive slot grid with empty placeholders
- **Detail Panel** (Right sidebar): Shows selected item/equipment details, rarity, stats, equipped-by info
- **Slot Expansion UI**: Per-category upgrade panel showing current capacity, cost, max (200)
- **Equip Mode Toggle**: Dedicated button to switch to equipment assignment for members
- **Keyboard Shortcut**: ESC closes panel

### Inventory UI Components (NEW - v1.20)
- **InventoryPanel**: Main container with tabs, search, filter, sort, grid + detail panel
- **InventorySlot**: Single grid cell showing item icon, rarity border, quantity badge
  - Rarity modifiers: `.inventory-slot--rarity-{uncommon,rare,epic,legendary}` (COMMON has no border)
  - Selected state: `.inventory-slot--selected` highlighting
  - Empty state: Grey placeholder
- **InventoryDetailPanel**: Right-side panel showing selected item/equipment full details
  - Item view: Icon, name, rarity, stack limit, description
  - Equipment view: Icon, name, rarity, stats (damage/HP/defense), durability, equipped-by member
- **InventorySlotExpansion**: Tier-based capacity upgrade UI showing costs and current/max slots

### Per-Category Slot System (NEW - v1.20)
- **Default Capacity**: 30 slots per category (weapon, armor, material, consumable)
- **Expansion Tiers**:
  - Tier 1: +10 slots → 40 total, costs 20 WOOD + 10 STONE
  - Tier 2: +10 slots → 50 total, costs 10 IRON_ORE + 2 GEM
  - Further expansions up to 200 per category
- **Slot Calculation**: Items that stack split into multiple visual slots (stack limit 99)
  - Non-stackable equipment: Each item = 1 visual slot
  - Stackable items: `ceil(quantity / 99)` slots per item type
- **Zustand Action**: `expandCategorySlots(category, amount)` — increments category capacity, capped at 200
- **Save Compatibility**: `categoryCapacity` field optional (old saves default to 30/category on load)

## Recent Changes (UI Handoff Ink Refresh — v1.20)

### Expanded Design Token System (NEW - HD-2D Token Library)
- **Token Prefix**: All new tokens use `--ink-*` convention per existing patterns
- **Token Growth**: 35 → 81 total `--ink-*` tokens in `game-ui-tokens.css`
- **New Token Groups**:
  - **Gold Bright**: `--ink-gold-bright` (#ffd700) for prominent highlights and display text
  - **Combat Log Accents**: `--ink-log-skill`, `--ink-log-dodge`, `--ink-log-heal`, `--ink-log-zone` for combat log line color-coding
  - **Wood/Chest Theme**: `--ink-wood-edge`, `--ink-wood-edge-light`, `--ink-wood-edge-dark`, `--ink-wood-fill-from`, `--ink-wood-fill-to`, `--ink-stud-bright`, `--ink-stud-mid` for InventoryPanel wooden chest aesthetic
  - **Rank Palette** (6 colors): `--ink-rank-recruit`, `--ink-rank-member`, `--ink-rank-veteran`, `--ink-rank-officer`, `--ink-rank-commander`, `--ink-rank-mercenary` for member card borders and insignia frames
  - **Tier Palette** (7 colors): `--ink-tier-f` through `--ink-tier-s` for quest difficulty badges
  - **Font UI**: `--ink-font-ui` (Segoe UI, sans-serif) for HUD top bar and title screen
  - **Type Scale** (8 sizes): `--ink-fs-display`, `--ink-fs-h1`, `--ink-fs-h2`, `--ink-fs-body`, `--ink-fs-small`, `--ink-fs-meta`, `--ink-fs-label`, `--ink-fs-tiny` (rem-based)
  - **Spacing Scale** (6 steps): `--ink-space-1` through `--ink-space-6` (4px base)
  - **Additional Radii**: `--ink-radius-lg` (8px), `--ink-radius-chest` (12px) for container shapes
  - **Additional Effects**: `--ink-glow-bright`, `--ink-shadow-panel`, `--ink-dur-fast`, `--ink-dur-bar` for motion and visual depth

### New Typography Utility Classes (NEW - `typography.css`)
- **9 semantic type classes**: `.ink-display`, `.ink-h1`, `.ink-h2`, `.ink-section-title`, `.ink-body`, `.ink-small`, `.ink-stat`, `.ink-label`, `.ink-tiny`
- **rem-based sizing**: Ensures `--ui-scale` responsive scaling doesn't double-apply (contrasts with px-based borders)
- **Font stacks**: Semantic pairing (title = Cinzel, body = IM Fell English, mono = Share Tech Mono, UI = Segoe UI sans)
- **Integration**: Single-source type styling eliminates inline font-size/color inconsistencies

### New Components: TierBadge & Refactored HpExpBar (NEW)
- **TierBadge**: Quest difficulty badge (F–S tiers) with per-tier scale compensation
  - `TIER_SCALE` record: Tier-specific size multipliers (F=1.00, S=1.05, A=1.20, D=1.20)
  - `TIER_COLOR` + `TIER_SOFT`: Per-tier color tokens + semi-transparent background
  - `TIER_DESCRIPTOR`: Readable labels (F="Errand", S="Legendary")
  - Props: `tier` (required), `size` (28|36|64px), `showLabel` (optional)
- **HpExpBar**: Consolidated HP/EXP value bar (was split across components)
  - Props: `kind` ('hp'|'exp'), `current`, `max`, `variant` ('compact'|'default'|'combat'), optional `label`
  - Gradient fill: `--ink-hp-*` for HP, `--ink-exp-*` for EXP
  - Animation: 300ms fill animation via `--ink-dur-bar` token, respects `prefers-reduced-motion`

### Refactored Components: RankBadge, MemberCard, InventorySlot (ENHANCED)
- **RankBadge**: Converted to CSS variable system
  - Before: inline `style={{ color, background }}` properties
  - After: `--rank-color` and `--rank-soft` CSS variables referencing `--ink-rank-*` tokens
  - Size variants: 'sm'|'md'|'lg' (14–48px icon sizes)
  - Mercenary rank: Special styling (lowercase "MERC" label)
- **MemberCard**: Full rank treatment with visual hierarchy
  - **6 rank modifiers**: `.member-card--{recruit,member,veteran,officer,commander,mercenary}` each sets `--rank-color` + `--rank-soft`
  - **Corner diamonds**: 4-corner rotated square ornaments (TL/TR via ::before/::after, BL/BR via child spans), scaled per rank
  - **Insignia frame**: Rank badge sprite in top-left corner (26×26px) with radial shadow + border
  - **Mercenary slash**: Diagonal gradient overlay on avatar band
  - **Commander glow**: Extra bright on hover, thicker 3px border
  - **Recruit dashed border**: Distinctive appearance for new members
- **InventorySlot**: Rarity modifier classes instead of inline styles
  - Before: `style={{ borderColor: rarityColor }}`
  - After: `.inventory-slot--rarity-{common,uncommon,rare,epic,legendary}` modifier classes
  - Selected state: `.inventory-slot--selected` for consistency

### CSS Extraction & File Organization (REFACTOR)
- **New**: `src/ui/styles/typography.css` — Semantic type utility classes (loaded after game-ui-tokens.css)
- **New**: `src/ui/styles/member-card.css` — Extracted from `guild-roster.css` for modularity
- **Moved**: All `.member-card*` rules from `guild-roster.css` → `member-card.css` (imported by `member-card.tsx`)
- **Existing**: `tier-badge.css`, `rank-badge.css`, `stat-bar.css` follow component-based naming

### Accessibility: `prefers-reduced-motion` Guards (NEW)
- **Added to**: All new/modified animation rules in `game-ui-tokens.css`, `member-card.css`, `tier-badge.css`
- **Pattern**:
  ```css
  @keyframes slide { ... }
  .my-class { animation: slide var(--ink-dur-panel); }
  @media (prefers-reduced-motion: reduce) { .my-class { animation: none; } }
  ```
- **Scope**: Covers panel slide-in, bar fills, member card hovers, badge animations

### Code Standards Update (DOCUMENTATION)
- **New Section**: "Design Tokens System (v1.20)" in `docs/code-standards.md`
- **Guidelines**: All future tokens must use `--ink-*` prefix, organized by category
- **Token Usage Pattern**: Components reference tokens, never hardcoded colors
- **Type Scale Usage**: Prefer `var(--ink-fs-*)` with rem units; avoid px-based type scaling
- **Responsive Scale**: `--ui-scale` media queries handle panel rescaling; developers should use rem for type, px for layout

## Recent Changes (Combat Panel Idle Redesign — Phase 3 - v1.27.3)

### Combat Panel Overlay (NEW - Single-Canvas Architecture D8)
- **Paradigm Shift**: Combat no longer scene-changes; remains on single Canvas with group visibility toggling
  - `world.tsx <group visible={!isCombatOpen}>` hides guild hall, facilities, post-processing
  - `world.tsx <group visible={isCombatOpen}>` shows combat backdrop (solid black plane D9)
  - `OrthographicCamera` switches to dedicated combat camera (position [0, 5, 10], zoom 60) via `makeDefault={isCombatOpen}`
  - `CameraController` unmounts when `isCombatOpen` to prevent lerping combat camera toward guild hall target
  - **Benefit**: Avoids WebGL context limit (only 1 Canvas per page) seen in multi-scene architecture
- **Ephemeral UI Store**: New Zustand store `useCombatPanelStore` (NOT persisted to IndexedDB)
  - `isOpen: boolean` — Panel visibility
  - `phase: 'formation' | 'battle' | 'result'` — Current sub-phase
  - `missionId: string | null` — Mission being fought
  - `resultData: MissionResult | null` — Combat outcome for result phase
  - `openCombatPanel(missionId)`, `setPhase()`, `setResult()`, `closeCombatPanel()` actions

### Combat Panel Components (NEW - HD-2D Ink Styling)
- **combat-panel.tsx** — Shell component, manages phase routing (formation → battle → result)
- **combat-panel-header.tsx** — Title bar, close button, phase indicators
- **combat-panel-formation.tsx** — 2×3 formation grid, member assignment, target priority (Focus/Balance toggle), "Start Battle" button
  - `target-priority-resolver.ts` — Pure resolver function for Focus vs Balance targeting preference
  - Refactored from legacy `combat-prep-panel.tsx` (kept but suppressed)
- **combat-panel-battle.tsx** — Phase 4 stub; will mount mini combat scene + VFX in Phase 4
- **combat-panel-result.tsx** — Victory/defeat banner, rewards, injury recovery list, "Return to Guild Hall" button
- **combat-panel.css** — New stylesheet using existing `--ink-*` tokens, no new tokens introduced

### Arrival Flow Changes
- **ArrivalModal** (lightweight): Shows when mission reaches "arrived" phase
  - Enemy count + level preview
  - "Enter Battle" button → `openCombatPanel(missionId)` (does NOT change mission.phase yet)
  - "Close" button → dismisses modal, mission stays in "arrived"
- **Key Fix (Phase 3)**: `mission.phase` stays "arrived" until player presses "Start Battle" in formation panel
  - Prevents race condition where mission tick loop would flip phase to "in-combat" before UI was ready
  - Only "Start Battle" click triggers `updateMissionPhase(missionId, 'in-combat')`
- **Legacy Panels Suppressed**: CombatPrepPanel, CombatTimelineBar, CombatSkillHotbar, CombatResultOverlay still exist in codebase but render hidden when `isCombatOpen` (Phase 7 will remove)

### New Sprites & Utilities
- **combat-sprite-resolver.ts** — Maps entity templates → sprite sheet paths (used by Phase 4 mini combat scene)

### Zero Breaking Changes (Phase 3 Scope)
- Combat engine (`src/game/systems/combat-engine.ts`) untouched — will refactor in Phase 7
- Save format stable (no v21→v22 migration yet, deferred to Phase 7)
- Existing combat-arena overlays suppressed but functional as fallback during transition

## Recent Changes (Combat Panel IDLE Redesign Phase 6 — Skip & Snapshot — v1.27.4)

### Skip Button with Combat Snapshot (D11)
- **Skip Mechanism**: DOM button dispatches `COMBAT_SKIP_DOM_EVENT` → `combat-fight-controller` listener owns engine handoff
- **Snapshot Path**: `cloneCombatEntity()` deep-clones all live entities (HP, dead-flags, status effects, cooldowns) → `simulateCombatFromSnapshot()` runs to completion
- **Re-Targeting**: Random-alive per entity during skip simulation (simplified per D11 spec)
- **Result Stability**: Skip outcome identical to active battle completion — no variance vs. live fighting
- **Key File**: `tests/combat-skip-snapshot.test.ts` — 7 tests validating cloning semantics + simulator paths

### Mid-Fight Snapshot Persistence (D12)
- **Autosave Cadence**: `saveCombatSnapshot()` action dispatched every 2s during battle phase
- **Snapshot Fields**: `ActiveMission.combatSnapshot` (entity list) + `combatSnapshotTime` (epoch)
- **Resume Flow**: On browser close + relaunch, `mission-tick.ts` detects `mission.phase === 'in-combat'` → checks for snapshot → calls `simulateCombatFromSnapshot()` if exists
- **Backward Compat**: Falls back to simulate-from-scratch if no snapshot (old saves)
- **Result**: Close-tab mid-battle no longer rerolls outcome; resume picks up at snapshot state (~losses preserved, no cheating)

### Combat Balance Tuning (Phase 6)
- **Damage Multiplier**: Added `BASE_DAMAGE_MULTIPLIER = 1.2` constant in `combat-formulas.ts`
- **Application**: Applied equally to allies + enemies in `calcAutoAttackDamage()`
- **Migration**: No save migration (in-progress battles replay with 1.2x)
- **Tuning Knob**: Additive for future balance adjustments

### Files Modified (Phase 6)
- `combat-formulas.ts` — Added `BASE_DAMAGE_MULTIPLIER = 1.2`
- `combat-engine.ts` — Added `simulateCombatFromSnapshot()` method + snapshot rebase logic
- `combat-fight-controller.tsx` — Added `saveCombatSnapshot` action + 2s autosave via useFrame
- `active-missions.ts` → mission save shape — Added optional `combatSnapshot` + `combatSnapshotTime` fields
- `combat-panel-battle.tsx` — Skip button → `COMBAT_SKIP_DOM_EVENT` dispatch
- `mission-tick.ts` — Resume path via simulator on close+relaunch

### Zero Breaking Changes (Phase 6 Scope)
- Snapshot is ephemeral (lost on browser restart, only persists within active session for auto-save)
- All existing combat formulas reused; multiplier is additive knob
- Tests: `tsc -b ✓`, all 7 combat-skip-snapshot tests pass

## Recent Changes (Logging Site Finite Harvest System — v1.18)

### Woodcutting Occupational Skill (NEW - Craft Skill System)
- **Skill Progression**: 11 levels (0–10) tied to wood harvested as XP
- **XP Thresholds**: [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 7500, 11000]
- **Bonus Scaling**: [0%, 10%, 22%, 38%, 58%, 80%, 105%, 133%, 165%, 200%, 240%] harvest rate multiplier
- **Auto-Level**: XP compared to threshold table each tick; level auto-advances on threshold cross
- **Persistence**: Stored as `member.craftSkills.woodcutting` in save data
- **Per-Member Tracking**: Each assigned member can develop woodcutting skill independently

### Finite Wood Reserve Depletion (NEW - Resource Management)
- **Reserve Pool**: Each logging site starts at 1000 wood capacity
- **Depletion Rate**: `woodPerTick = 0.0114 × (baseScore/100) × skillMultiplier`
  - baseScore = (STR×0.5) + (END×0.3) + (DEX×0.2)
  - skillMultiplier = 1 + (wcSkillBonusPct / 100)
  - Calibrated for ~7-day depletion with STR20/END15/DEX0
- **Multi-Member Stacking**: Per-tick production sums across all assigned members
- **Clamping**: Wood harvested never exceeds remaining reserve (prevents negatives)
- **Auto-Unassign**: Members auto-removed from assignment on depletion

### Depletion Lifecycle UI (NEW - State Machine)
- **Active State** (>25% reserve): Green progress bar, normal production
- **Warning State** (10–25% reserve): Amber bar + "⚠ Running Low" badge + ETA
- **Critical State** (<10% reserve): Red bar + "🔴 Almost Depleted" badge + short ETA
- **Depleted State** (0 reserve): Grey card, "DEPLETED" label, Remove Site button only
- **Facility Card**: WoodReserveBar component displays reserve % and production rate

### Permit-Based Unlock Gate (NEW - Build System)
- **Build Gate**: Logging site cannot be built with gold alone; requires 1× Logging Permit
- **Item Source**: 
  - Tutorial quest "Into the Clearing" guarantees 1 permit on completion
  - Forest area quests (5 missions) drop permit at 15% conditional chance
- **Consumption**: Permit item consumed (quantity decremented) when build confirmed
- **UI Gate**: Build button disabled + tooltip if player has 0 permits

### 3D Zone Tinting (NEW - Visual Feedback)
- **Reserve-Based Colors**: Zone floor tint changes by reserve percentage
  - Green (>25%): Normal production state
  - Amber (10–25%): Warning state approaching depletion
  - Red (<10%): Critical depletion warning
  - Grey (0%): Depleted, no production
- **Floating Zone Card**: HTML overlay in facility room showing reserve bar + wood/tick rate

### Production System Integration (NEW)
- **Per-Tick Processing**: Runs every 1-second game tick (not daily)
- **Zustand Actions**:
  - `applyLoggingProduction()` — Updates member WC XP, facility reserves, handles depletion
  - `removeFacility()` — Deletes facility from guild, frees placed slot
- **Mission System Extension**: Added `conditionalDrops` field to Mission interface
  - Entries: `{ itemId, chance: 0–1, quantity }`
  - Processed on mission success with random roll
- **Offline Integration**: Production continues in background (Web Worker)

### Save Migration v13 → v14 (NEW)
- **Version Bump**: SAVE_VERSION 13 → 14
- **Member Migration**: All members get `craftSkills: { woodcutting: { level: 0, xpAccumulated: 0 } }`
- **Facility Migration**:
  - Non-logging sites: `woodReserve: null`
  - Existing built logging sites (level > 0): `woodReserve: 1000` (full capacity)
- **Tests**: 39/39 save migration tests passing
- **Backward Compatibility**: Existing saves auto-migrate without data loss

**Key Files (New)**:
- `src/scene/woodcutting-animator.tsx` — Atlas-based 8-frame woodcutting sprite animator (east direction, 8fps)
- `src/scene/room-member-sprites.tsx` — Renders up to 4 assigned members at fixed chop spots in facility room
- `src/game/data/facility-slot-positions.ts` — Facility slot position constants for member placement

**Key Files (Modified)**:
- `src/game/state/game-state.ts` — Added `WoodcuttingSkill { level, xpAccumulated }`, `CraftSkills` type, `craftSkills?` on Member
- `src/game/data/facility-definitions.ts` — Added LOGGING_SITE_CONFIG with reserve, rate, skill thresholds, bonus percentages
- `src/game/systems/facility-production-system.ts` — Added `processLoggingSiteTick()` formula
- `src/game/state/guild-slice.ts` — Added `applyLoggingProduction`, `removeFacility`, `consumeLoggingPermit` actions
- `src/ui/hooks/use-game-tick-loop.ts` — Calls `processLoggingSiteTick` each tick
- `src/ui/panels/facility-card.tsx` — Added WoodReserveBar, WC level badges, DepletedFacilityCard
- `src/ui/panels/facilities-panel.tsx` — Sort depleted sites to bottom
- `src/ui/panels/build-menu.tsx` — Permit-gate UI for logging-site
- `src/scene/facility-room.tsx` — 3D forest room with props (trees, logs, stumps, bushes)
- `src/scene/zone-props.tsx` — Updated logging-site zone props (tree, pine, stump, bush models)
- `src/scene/zone-floor-marker.tsx` — Tinting system: green/amber/red/grey by reserve %

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start main dev server (port 5173, Vite) |
| `npm run map` | Start map-playground dev server (port 5175, arena map editor) |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint code quality check |

See `docs/map-playground-guide.md` for editor usage and workflow.

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
