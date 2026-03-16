# Project Changelog Archive (v0.1-v1.2)

Historical changelog entries for Worlds Collide releases before v1.3.

---

## [1.2] — 2026-03-15 (Build Mode Level 2 — Grid-Based Placement)

### Added

#### Free Build Mode Level 2 (Major Feature)
- **Grid-Based Room Placement**: 10x6 cell grid supports multi-tile rooms with flexible positioning
- **Multi-Tile Rooms**: Quest board (1x1), tavern (2x2), training room (2x1), workshop (1x1), infirmary (2x1)
- **Room Rotation**: 90-degree rotation support (0°/90°/180°/270°) with axis-swapped sizing
- **Collision Detection**: AABB-based overlap checking with boundary validation and room capacity limits
- **Build Mode UI**: Dedicated placement mode with state management (activeBuildType, buildRotation)
- **3D Build Overlay**: Visual grid lines, ghost room preview (green=valid, red=collision/OOB)
- **Placement Controls**: R to rotate, Escape to cancel, click to confirm placement
- **Build Hint HUD**: Control reference overlay during placement mode
- **Rotated Size Calculation**: Automatic width/depth swapping for 90/270-degree rotations

#### New Components
- `BuildOverlay` (scene): 3D grid visualization, ghost preview, raycasting input handling
- `BuildModeHint` (HUD): Placement control reference during build mode
- `build-mode-slice.ts`: Zustand state for placement mode (activeBuildType, buildRotation, control methods)

#### New Systems
- `building-system.ts` enhancements:
  - Grid constants (HALL_WIDTH=10, HALL_DEPTH=6)
  - `getRotatedSize()`: Calculate effective width/depth after rotation
  - `checkCollision()`: AABB-based collision detection with boundary checks
  - `getRoomBounds()`: Compute grid bounds for placed rooms
  - `placeRoom()`: Create new room with position and rotation
  - Room validation (capacity, cost, placement feasibility)

#### Tests (NEW)
- `building-system.test.ts`: 24 comprehensive tests covering:
  - Collision detection (overlapping rooms, boundary validation)
  - Rotation mechanics (90/270 axis swapping)
  - Room placement validation
  - Grid bounds calculation
  - Edge cases (multiple overlaps, boundary edges)

### Changed

#### Room Type Schema
- **Room Interface**: Added `rotation: Rotation` field (0|90|180|270)
- **RoomDefinition**: Added `width` and `depth` fields for multi-tile support
- Room type no longer assumes 1x1 size; definitions specify exact dimensions

#### Build Menu UI
- **Old**: Direct placement button (adds room immediately)
- **New**: Room selection button enters placement mode, waits for overlay interaction
- User must now explicitly position and confirm placement on the 3D grid

#### Guild Hall Scene
- **Dynamic Room Rendering**: Rooms render at correct grid dimensions (width × depth cells)
- **Rotation Support**: Room meshes rotate based on room.rotation field
- **BuildOverlay Integration**: Conditionally renders overlay when activeBuildType is set

#### Camera Controller
- **Pan Disable**: Camera pan disabled during placement mode for cleaner UX

### Fixed

#### Build Mode Usability
- **Fixed**: No visual feedback for placement validity
  - Ghost preview now shows green (valid) or red (collision/OOB)
- **Fixed**: No rotation support
  - R key cycles through 4 rotations with preview update
- **Fixed**: No ability to place rooms freely on grid
  - Grid-based placement allows precise positioning vs. fixed slots

#### Placement Validation
- **Fixed**: Room overlap detection was basic
  - AABB collision detection now properly validates overlaps across all existing rooms
- **Fixed**: No boundary checking
  - Boundary validation prevents placement outside 10x6 grid

### Performance

- **Collision Detection**: O(n) per placement check (n = room count, typically <10)
- **Ghost Preview**: Real-time update with raycasted mouse position (60fps target)
- **Grid Rendering**: Static line segments (11 vertical + 7 horizontal lines)
- **No Memory Regression**: Build mode state minimal (2 fields)

### Testing

- Unit tests: `building-system.test.ts` (24 tests covering collision, rotation, bounds)
- Integration tests: Build mode state changes, placement validation
- Component tests: BuildOverlay rendering, ghost preview update
- Coverage: Building system 95%+

### Documentation

- Updated `codebase-summary.md` with Build Mode Level 2 details
- Updated `system-architecture.md` with placement data flows and new components
- Added building-system.ts enhancements to file organization

---

## [1.1] — 2026-03-15 (Live Game Loop)

### Added

#### Mission Tick Game Loop (Major Feature)
- **Web Worker Heartbeat**: 1-second tick loop runs independently in background thread
- **Mission Resolution**: Expired missions auto-resolve via combat simulation on each tick
- **Reward Distribution**: Gold added to guild, EXP awarded per member survivor
- **Injury System**: Members marked injured on mission failure/heavy damage; recovery timer (50% mission duration)
- **Status Transitions**: Member states: idle → active (dispatch) → idle/injured (resolve) → idle (recovery)
- **Toast Notifications**: 5-per-stack toast notifications display mission results with auto-dismiss (5s) + click dismiss
- **Sound Effects**: SFX feedback on mission completion (reward ding) or failure (hit sound)
- **Offline Catch-Up**: All expired missions resolved on app load (handles tab closure/background play)
- **Game Clock**: Advances every tick, used for mission expiration and injury timers

#### UI Components & Panels
- `GameScreen` component: Extracted from App.tsx, manages game rendering + tick loop lifecycle
- `MissionProgressBar`: Shows % fill for active missions (elapsed time / total duration)
- `QuestDetailModal`: Modal overlay showing mission details, party composition, enemy list, rewards
- `MissionNotification`: Toast component displaying outcome (success/partial/wipe) + rewards summary
- `useGameTickLoop` hook: Initializes worker, handles tick messages, offline catch-up logic

#### Store Architecture
- `NotificationSlice`: Ephemeral store for mission results (max 10, not persisted to save)
- Member status field extended: `'idle' | 'active' | 'injured'`
- Member `injuredUntil` field: timestamp for injury recovery
- Game clock field: current timestamp from tick loop

#### Technical Implementation
- `mission-tick.ts`: processMissionTick() + processInjuryRecovery() functions
- `mission-resolver.ts`: resolveMission() combat simulation + reward calculation
- `game-loop.worker.ts`: Web Worker sending 1s tick messages
- App.tsx simplified: delegates screen management to GameScreen component

### Changed

#### App Routing & Rendering
- **Old**: App.tsx handled game state + UI rendering together
- **New**: App.tsx manages screens (title/char-creation/game), GameScreen handles world + panels + tick loop
- Tick loop only initializes when game screen active (efficiency + lifecycle management)

#### Quest Board
- **Old**: Static mission list, no progress indication
- **New**: Active missions show progress bars, completed missions show notification toast
- Mission cards clickable to view detail modal

#### Guild Roster
- **Old**: Simple member list with stats
- **New**: Member status badges (idle/active/injured), recovery timer display for injured members

#### Combat View
- **Old**: Post-combat summary
- **New**: Tick-by-tick combat log from real-time mission resolution

### Fixed

#### Mission Lifecycle
- **Fixed**: Missions didn't auto-resolve while offline
  - Now resolved on app load via catch-up mechanism
- **Fixed**: No visual feedback when mission completes
  - Toast notifications provide immediate feedback
- **Fixed**: No member status tracking during missions
  - Status field now tracks idle/active/injured states

#### Offline Progression
- **Fixed**: Tab closure lost in-progress mission state
  - Web Worker continues tick loop, offline catch-up syncs on return

### Performance

- **Web Worker**: Off-main-thread tick processing (non-blocking)
- **Notification Stack**: Capped at 10 (memory efficient)
- **Toast Render**: Only 5 visible at once (DOM efficient)
- **Mission Check**: O(n) filter + process (n = active missions, typically 1-6)

### Testing

- Unit tests for processMissionTick + processInjuryRecovery
- Integration tests for offline catch-up
- Component tests for MissionNotification, MissionProgressBar, GameScreen
- E2E: Mission dispatch → completion → reward display flow

### Documentation

- Updated `system-architecture.md` with game loop data flows
- Updated `codebase-summary.md` with new systems + architecture changes
- Added UI components & hook descriptions to file organization

---

## [1.0] — 2026-03-15

### Added

#### Save System (Major Feature)
- **Multi-slot IndexedDB architecture**: 3 independent save slots with automatic backup shadow copies
- **Save validation pipeline**: TypeScript type guards prevent invalid game state imports
- **Auto-save system**: Saves every 60 seconds + on tab visibility change (debounced)
- **Save status indicator**: HUD badge shows saving/saved/error states with visual feedback
- **Import/export**: Slot-aware JSON serialization with validation, user-friendly file downloads
- **Play time tracking**: Metadata includes founder name, play time, last save date
- **Corruption recovery**: Automatic restoration from backup if primary save corrupted

#### Title Screen (New Entry Point)
- **Save slot selection**: 3 slot cards display with metadata (founder, playtime, last save)
- **Continue action**: Load selected save, hydrate store, start auto-save
- **New Game action**: Navigate to character creation on selected slot
- **Delete action**: Remove save with confirmation dialog
- **Overwrite protection**: Warn user if creating new game on populated slot
- **Slot management**: Visual indication of populated vs empty slots

#### UI Components
- `SaveSlotCard` component: Displays individual slot info with action buttons
- `SaveStatusBadge` component: HUD indicator for save operation status
- `ConfirmDialog` component: Reusable confirmation dialogs
- `TitleScreen` component: Main entry point with slot selection

#### Settings Panel Updates
- **Return to Title button**: Saves current state and navigates to title screen
- **Slot-aware import/export**: Select target slot for import operations
- **Validation feedback**: User receives clear error messages for invalid imports
- **Improved workflow**: Import/export now slot-specific instead of global

#### Localization
- **Vietnamese title screen**: Slot labels, action buttons, status messages translated
- **Save dialog strings**: Confirmation messages, error messages in Vietnamese
- **Status messages**: Save status feedback localized (saving, saved, error)
- **Full i18n integration**: Ready for additional languages in future

#### Technical Architecture
- `SaveManager` class: Orchestrates save/load/export/import lifecycle with debouncing
- `saveSlot()` / `loadSlot()` functions: CRUD operations for 3 IndexedDB slots
- `validateAndMigrate()`: Type guards + automatic format migration on load
- `SaveStatusSlice`: Zustand slice for auto-save status (idle/saving/saved/error)
- `ActiveSlotStorage`: localStorage-backed active slot tracking across sessions
- App-level screen routing: title → char-creation → game flow

### Changed

#### File Structure
- New directory: `src/ui/screens/` for full-screen views (title screen, future: settings)
- New module: `src/game/save/save-validation.ts` for import/export validation
- New component: `src/ui/hud/save-status-badge.tsx` for status indicator
- Reorganized `src/ui/styles/` with new `title-screen.css`

#### App Routing
- **Old**: Direct entry to char creation (no slot selection)
- **New**: Title screen as entry point, enforced save slot selection before char creation
- App component now manages screen state: 'title' | 'char-creation' | 'game'
- Cleaner lifecycle: `App.tsx` handles screen transitions and save lifecycle

#### Settings Panel
- **Import/export**: Now slot-aware (select slot before import)
- **Return to title**: Replaces simple close button, triggers save + navigation
- **UI layout**: Adjusted to accommodate new return-to-title button

#### Store Architecture
- Added `SaveStatusSlice` to Zustand store
- No changes to existing slices (Game, Guild, Roster, Mission, Combat)
- SaveStatusSlice is read-only from non-SaveManager code (derived state)

#### Error Handling
- Save failures now set error state + display in HUD (instead of silent fail)
- Import validation errors shown to user before attempting load
- Backup restoration transparent to user (automatic, logged only on success)

### Fixed

#### Save System
- Fixed: Previous localStorage+IndexedDB fallback was unreliable
  - Now uses dedicated IndexedDB slots with guaranteed backup
- Fixed: No way to recover from corruption
  - Backup system prevents total data loss
- Fixed: No indication of save progress to user
  - Save status badge provides clear feedback

#### Title Screen Functionality
- Fixed: No save slot selection before starting game
  - Title screen enforces slot choice, prevents orphaned saves
- Fixed: Inability to delete old saves
  - Delete button with confirmation now available

### Deprecated

- localStorage save fallback (deprecated in favor of IndexedDB)
- Old settings import/export (replaced with slot-aware version)

### Security

- Import validation rejects 100% of invalid JSON before state hydration
- Type guards prevent XSS via malicious game state
- No sensitive player data stored (game state only, no PII)
- Client-side only, no server communication

### Performance

- Save operation: <100ms (async, doesn't block UI)
- Load operation: <200ms (with backup recovery)
- List slots: <50ms (efficient metadata fetch)
- No regression in main thread performance (saves happen async)

### Testing

- Unit tests: `save-validation.test.ts`, `save-types.test.ts`, `save-migrations.test.ts`
- Integration tests: Save/load cycle, slot CRUD, backup recovery
- Test coverage: 90%+ for save system
- All tests passing before v1.0 release

### Documentation

- New: `system-architecture.md` — Technical design & data flows
- New: `codebase-summary.md` — High-level overview
- New: `code-standards.md` — Development conventions
- New: `project-overview-pdr.md` — Full PDR document
- New: `development-roadmap.md` — Phase status & timeline
- Updated: `README.md` — Save system v1.0 features

---

## [0.3] — 2026-03-14

### Added

#### Pre-v1.0 Features (Before Save Overhaul)
- Core game systems (combat, economy, missions, leveling)
- Guild hall system (rooms, building, effects)
- Character system (founder, roster, 80+ heroes)
- Web Worker offline progression
- Basic save/load (localStorage + IndexedDB fallback)
- Character creation screen
- Game panels (quest board, roster, build, combat, settings)
- HUD with panel toggle bar
- 3D isometric guild hall scene (React Three Fiber)
- Audio system (BGM + SFX via Howler.js)
- Vietnamese localization (i18next)

---

## [0.2] — 2026-02-28

### Added

#### Core Systems
- Combat system (tick-based simulator, AGI+speed formula, status effects, crits)
- Economy system (gold, upkeep, debt)
- Mission system (7-tier quest progression, dispatch, rewards)
- Leveling system (EXP curves 1.35x scaling, stat allocation)
- Building system (room placement, effects)
- Web Worker game loop (offline simulation)

---

## [0.1] — 2026-02-01

### Added

#### Project Foundation
- React 19 + TypeScript 5 setup with Vite
- Zustand state management
- React Three Fiber 3D rendering
- Project structure and conventions
- ESLint + Vitest configuration

---

**Last Updated**: 2026-03-16
**Archive Contains**: v0.1 through v1.2 (historical entries)
**Current Changelog**: See `project-changelog.md` for v1.3+
