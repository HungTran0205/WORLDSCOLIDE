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
│   ├── state/              # Zustand store + slices (game, guild, roster, mission, combat, save-status)
│   ├── systems/            # Game simulation (combat, leveling, economy, missions, building)
│   │   └── workers/        # Web Worker game loop for offline progression
│   ├── data/               # Static data (enemies, missions, skills, buildings, characters)
│   └── save/               # Persistence layer (3-slot IndexedDB + JSON import/export)
├── scene/                  # React Three Fiber 3D guild hall scene
├── ui/                     # User interface
│   ├── screens/            # Full-screen views (title screen with slot selection)
│   ├── panels/             # Collapsible UI panels (quest board, roster, build, combat, settings)
│   ├── hud/                # Heads-up display overlay + panel toggle bar + save status badge
│   ├── components/         # Reusable UI components (stat bars, cards, dialogs)
│   └── styles/             # CSS for panels, HUD, and screens
├── audio/                  # Howler.js audio manager + sound key enums
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

### Guild Hall System (Build Mode Level 2)
- **Grid-Based Placement**: 10x6 cell grid with multi-cell room support
- **Room Dimensions**: Quest board (1x1), tavern (2x2), training room (2x1), workshop (1x1), infirmary (2x1)
- **Room Rotation**: 0/90/180/270-degree rotation with axis-swapped sizing
- **Collision Detection**: AABB-based overlap checking with boundary validation
- **Build Overlay**: Real-time 3D grid visualization, ghost preview (green/red valid/invalid)
- **Placement Mode**: Dedicated UI state (activeBuildType, buildRotation) with R/Escape/click controls
- **Room Effects**: Bonus effects to character stats/EXP gain
- **Aesthetics**: Isometric guild hall scene with dynamic room sizing

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
