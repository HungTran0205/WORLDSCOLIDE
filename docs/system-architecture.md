# System Architecture

## Application Overview

**Worlds Collide** is a client-side idle RPG built with React + TypeScript, using Zustand for state management and IndexedDB for persistence. The architecture supports offline play through Web Workers and provides a complete save/load system with multi-slot support.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    React Application                         │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬────────────────────────┐   │
│  │ Title Screen │ Char Creator │ Game Screen            │   │
│  │ (slot mgmt)  │ (stat alloc)  │ (world + tick loop)    │   │
│  └──────────────┴──────────────┴────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │              UI Layer                                  │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Panels: Quest | Roster | Build | Combat         │ │  │
│  │  │ (Quest board has progress bars + detail modals) │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ HUD: Toggle Bar | Save Status Badge             │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Notifications: Toast Stack (5 max, 5s auto-dismiss) │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ 3D Scene (R3F): Guild Hall + Members            │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Game Tick Loop (1s heartbeat)            │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Web Worker (game-loop.worker.ts)                │ │  │
│  │  │  - Sends 'tick' message every 1s                │ │  │
│  │  │  - Continues offline (separate thread)          │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Mission Tick Handler (processMissionTick)        │ │  │
│  │  │  - Checks expired missions                      │ │  │
│  │  │  - Resolves via combat simulation               │ │  │
│  │  │  - Applies rewards (gold/EXP)                   │ │  │
│  │  │  - Sets injury status + recovery timers         │ │  │
│  │  │  - Pushes notifications to store                │ │  │
│  │  │  - Plays SFX feedback                           │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Injury Recovery Handler (processInjuryRecovery)  │ │  │
│  │  │  - Checks injured members' recovery timers      │ │  │
│  │  │  - Transitions injured → idle when expired      │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Zustand Store (State Management)              │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Game | Guild | Roster | Mission | Combat        │ │  │
│  │  │ SaveStatus | Notification (ephemeral)           │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │          Save System (Multi-Slot)                     │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ SaveManager: Orchestrates load/save              │ │  │
│  │  │ SaveStorage: 3-slot IndexedDB + Backup           │ │  │
│  │  │ SaveValidation: Type Guards + Migration          │ │  │
│  │  │ ActiveSlotStorage: Track active slot             │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Game Systems (Combat, Economy, Leveling)      │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Combat Resolver | Economy | Missions | Leveling │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │        Persistence Layer                             │  │
│  │  ┌──────────────┐  ┌──────────────────────────────┐  │  │
│  │  │ IndexedDB    │  │ localStorage (active slot)   │  │  │
│  │  │ 3 Slots      │  │                              │  │  │
│  │  │ + Backup     │  └──────────────────────────────┘  │  │
│  │  └──────────────┘                                    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow: Mission Phase State Machine

### Overview

Missions follow a strict phase progression:

```
[TRAVELING] → [ARRIVED] → [IN-COMBAT] → [COMPLETED] or [FAILED]
  ↓              ↓            ↓
 travelTimeMs   30s timeout   Instant
 (auto-driven)  (player/UI)   (resolution)
```

### State Definitions

| Phase | Duration | Trigger | Next Phase |
|-------|----------|---------|-----------|
| **traveling** | `mission.travelTimeMs` | Dispatch | `arrived` (auto) |
| **arrived** | 30s max | Player choice or timeout | `in-combat` (manual or auto) |
| **in-combat** | Instant | Combat resolves | `completed` or `failed` |
| **completed** | — | Success outcome | (removed from active) |
| **failed** | — | Full-wipe outcome | (removed from active) |

## Data Flow: Game Tick Loop

### Mission Phase Tick Processing (Every 1 Second)

```
Web Worker (game-loop.worker.ts)
    ↓ every 1s
postMessage({ type: 'tick', time: Date.now() })
    ↓
Main Thread: useGameTickLoop hook receives message
    ↓
handleTick(now) calls:
  1. store.tickClock(now) — advance game clock
  2. processMissionTick(store, now) — advance all mission phases
     → Emits MissionTickEvent[] for UI updates
  3. Handle events: arrival modal, combat-start, combat-complete
  4. processInjuryRecovery(store, now) — recover injured members
    ↓
Store updates:
  - activeMissions: Update phase, arrivalTime, combatMode; remove completed
  - members: Add EXP, update status (idle/injured)
  - guild.gold: Add earned gold
  - notifications: Add MissionNotification to stack
    ↓
UI re-renders:
  - Arrival modal appears (manual/auto choice)
  - Phase badges update (🚶 Traveling → 📍 Arrived → ⚔️ In Combat)
  - MissionNotification toast appears on completion
  - Quest board progress bars update
  - Roster status badges reflect member states
```

### Mission Phase Transitions (In processMissionTick)

#### Phase: Traveling → Arrived (Auto)

```
for each active mission:
  if phase === 'traveling':
    if now >= startTime + mission.travelTimeMs:
      updateMissionPhase(missionId, 'arrived', now)
      emit MissionTickEvent { type: 'arrival', missionId, missionName, zone }
      → UI shows arrival modal (Manual/Auto choice)
```

#### Phase: Arrived → In-Combat (Player or Timeout)

```
if phase === 'arrived':
  if combatMode set (player chose):
    → updateMissionPhase(missionId, 'in-combat')
    → emit { type: 'combat-start', missionId }
  else if now >= arrivalTime + ARRIVAL_TIMEOUT_MS (30s):
    → setCombatMode(missionId, 'auto')
    → updateMissionPhase(missionId, 'in-combat')
    → emit { type: 'combat-start', missionId }
    → UI auto-triggers combat
```

#### Phase: In-Combat → Completed/Failed (Instant Resolution)

```
if phase === 'in-combat':
  allMembers = store.founder + store.roster
  members = allMembers.filter(m => active.memberIds.includes(m.id))
  result = resolveMission(mission, members)
    → Runs combat sim, calculates rewards
    → Returns { outcome, goldEarned, expPerMember, survivors, injured }

  if outcome !== 'full-wipe':
    - addGold(result.goldEarned)
    - for each survivor: addMemberExp(memberId, result.expPerMember)
    - updateMemberStatus(memberId, 'idle')
    - completeMission(missionId) → phase auto-set 'completed'
  else:
    - failMission(missionId) → phase auto-set 'failed'

  injuryDuration = mission.durationMs * 0.5
  for each injured: setMemberInjuredUntil(memberId, now + injuryDuration)

  pushMissionResult(result) → notification
  emit { type: 'combat-complete', missionId, result }
```

### Offline Catch-Up (On App Load)

```
GameScreen mounts:
  1. useGameTickLoop() hook initializes
  2. Immediately calls handleTick(Date.now()) before worker starts
     → processMissionTick() advances ALL phases for missions offline
       - traveling → arrived (if travel time elapsed)
       - arrived → in-combat (if 30s timeout passed)
       - in-combat → completed/failed (calls resolveMission for detailed result)
     → Resolves all offline-completed missions with combat simulation
  3. Then starts Web Worker for ongoing ticks
  4. User unaware of catch-up (happens instantly)
  5. Notifications appear for offline-completed missions
```

### Event-Driven UI Updates

```
processMissionTick() emits MissionTickEvent[] union:

1. { type: 'arrival', missionId, missionName, zone }
   → Triggers arrival modal (manual/auto choice)

2. { type: 'combat-start', missionId }
   → Triggers combat start animation

3. { type: 'combat-complete', missionId, result: MissionResult }
   → Triggers notification toast (outcome + rewards)
   → result contains: outcome, goldEarned, expPerMember, survivors, injured
```

### Injury Recovery Flow (Continuous Check)

```
processInjuryRecovery(store, now):
  For each member where status === 'injured':
    If injuredUntil <= now:
      - Clear injuredUntil timer
      - Status transitions to 'idle'
      - Quest board & roster reflect recovery
```

## Data Flow: Save & Load Cycle

### Save Flow (Auto-Save Every 60s or on Visibility Change)

```
useGameStore (current state)
    ↓
SaveManager.save()
    ↓
extractGameSaveData() → GameStateSnapshot
    ↓
createSaveEnvelope() → { gameState, metadata, version }
    ↓
saveSlot(slotId, envelope)
    ↓
saveStorage.ts: save to IndexedDB["slot-{id}"]
    ↓
setSaveStatus('saved') → HUD badge updates
    ↓
Auto-hide badge after 5s
```

### Load Flow (App Startup or Title Screen Slot Selection)

```
Title Screen: User clicks "Continue"
    ↓
SaveManager.load(slotId)
    ↓
loadSlot(slotId) → Fetch from IndexedDB
    ↓
migrateSave() → Apply format migrations
    ↓
validateAndMigrate() → Type guard validation
    ↓
If valid: Return SaveEnvelope
If corrupt: Try loadBackup(slotId)
If backup valid: Restore to primary + return
If both fail: Return null → Show error
    ↓
useGameStore.setState(envelope.gameState)
    ↓
setActiveSlotId(slotId) → Store in localStorage
    ↓
saveManager.startAutoSave() → Begin 60s interval
    ↓
setAppScreen('game') → Render World + HUD
```

### Slot Management Flow

```
Title Screen renders 3 SaveSlotCard components
    ↓
Each slot: listSlots() → Load metadata from all 3 IndexedDB slots
    ↓
Display: Founder name, play time, last save date
    ↓
User actions:
  - Continue: Load save from selected slot
  - New Game: Create new save (warn if slot populated)
  - Delete: Remove slot from IndexedDB + refresh UI
```

## Data Flow: Build Mode (Advanced v1.3)

### Overview

Build Mode now supports both new placements and moving existing rooms with cancel/restore.

```
[Player clicks Build Mode toggle]
    ↓
toggleBuildMode(true) → isBuildMode = true, grid visible, members hidden
    ↓
[Player clicks existing room]
    ↓
startMovingRoom(roomId, type, pos, rotation)
  → activeItem = { type: 'existing', roomId, roomType, position, rotation, originalPosition, originalRotation }
  → RoomMesh with roomId becomes invisible (rendering excluded)
    ↓
OR [Player clicks room button to place new]
    ↓
startPlacement(roomType)
  → activeItem = { type: 'new', roomType, rotation: 0 }
    ↓
[BuildOverlay renders ghost preview]
    ↓
[Player moves mouse, presses R, or clicks to place/drop]
    ↓
Mouse Position: Raycasted from 3D → snapped to grid (0.5 cell offset)
    ↓
GhostRoom Updates:
  - Calculate rotated size: getRotatedSize(width, depth, rotation)
  - Check collision: checkCollision(hall, x, z, w, h, excludeRoomId)
    ↓ (if moving) excludeRoomId prevents self-collision
  - Render green (valid) or red (invalid)
    ↓
[Player presses R]
    ↓
rotatePlacement() → buildRotation cycles, activeItem.rotation updates
    ↓
Ghost preview updates (size may swap if 90/270)
    ↓
[Player clicks or presses Escape/right-click]
    ↓
If valid click:
  NEW: placeRoom(type, {x,z}, rotation) → adds to hall.rooms, costs gold
  EXISTING: updateRoom(roomId, newPos, rotation) → moves room, no cost
  → activeItem = null
    ↓
If Escape/right-click: cancelPlacement()
  NEW: activeBuildType = null (no state change)
  EXISTING: room position restored to originalPosition, rotation to originalRotation
  → activeItem = null, RoomMesh becomes visible again
    ↓
[Player clicks Build Mode toggle to exit]
    ↓
toggleBuildMode(false) → isBuildMode = false, activeItem = null, grid hidden, members shown
```

### Placement Validation

```
canPlaceRoom(hall, roomType, gold):
  1. Check room capacity: hall.rooms.length < hall.maxRooms
  2. Find RoomDefinition by type, get base cost
  3. Check gold >= baseCost
  4. Return { success, reason? }

checkCollision(hall, x, z, width, depth, excludeRoomId?):
  1. Boundary check: x >= 0, z >= 0, x+w <= 10, z+h <= 6
  2. For each room in hall.rooms:
     - Skip if excludeRoomId matches
     - Get room bounds (with rotation): getRoomBounds(room)
     - Check AABB overlap: rectsOverlap(proposed, existing)
  3. Return true if collision, false if valid
```

### Rotation Mechanics

```
getRotatedSize(width, depth, rotation):
  - 0° or 180°: return { w: width, h: depth }
  - 90° or 270°: return { w: depth, h: width }  [axes swap]
```

**Example**: Tavern (2×2) rotated 90° → still 2×2 (square, no visual change)
**Example**: Training Room (2×1) rotated 90° → becomes 1×2 (tall instead of wide)

## Data Flow: Multi-Resource Loot & Inventory (NEW - v1.5)

### Mission Loot Generation

```
resolveMission(mission, members) called:
  1. Combat simulation runs
  2. For each defeated enemy:
     → rollLoot(enemyDef) checks each LootRule
       - If random < chance: generate minQty to maxQty of itemType
       - Return ItemDrop[] for this enemy
  3. mergeLoot(allDrops[]) combines all enemy drops
     → { WOOD: 5, IRON_ORE: 2, ... }
  4. MissionResult includes lootEarned: ItemDropMap
  5. Mission completion adds items to guild.inventory
  6. Toast notification shows "+5 Wood, +2 Iron Ore"
```

### Inventory Management

```
guild.inventory: Record<ItemType, number>
  - Tracks quantity for each of 8 item types
  - Updated via atomic actions: addItems(), consumeItems()

consumeItems(items: ItemQuantityMap):
  1. Validate: for each item, check inventory >= required qty
  2. If any insufficient: reject with reason
  3. If all valid: deduct all quantities atomically
  4. Side effect: playSound, emit change notification

addItems(items: ItemQuantityMap):
  1. For each item: increase quantity (respects 100+ stack limit)
  2. Atomic update to guild state
```

### Building Cost Integration

```
canPlaceRoom(hall, roomType, playerGold, playerInventory):
  1. Find RoomDefinition for roomType
  2. Extract cost: { gold: X, items: { WOOD: Y, ... } }
  3. Check: playerGold >= gold AND
           for each item: playerInventory[item] >= required qty
  4. Return { success: bool, reason?: string }

placeRoom(type, position, rotation):
  1. Validate via canPlaceRoom()
  2. Deduct gold: guild.gold -= cost.gold
  3. Deduct items: consumeItems(cost.items)
  4. If either fails: transaction rolls back
  5. If both succeed: add Room to guild.halls[0].rooms
```

### Resource Bar HUD

```
ResourceBar component:
  1. Subscribe to guild.inventory changes
  2. Render: Wood (qty), Stone (qty), Iron Ore (qty)
  3. Display in top HUD next to gold total
  4. Update on every inventory change (loot earned, building cost)
```

### Room Bounds Calculation

```
getRoomBounds(room: Room):
  1. Find RoomDefinition for room.type
  2. Get rotated size: { w, h } = getRotatedSize(width, depth, room.rotation)
  3. Return { x: room.position.x, z: room.position.z, w, h }
```

## State Management (Zustand Slices)

### Game Slice
- Active guild state
- Mission queue, timers
- Combat log history

### Guild Slice
- Buildings, rooms, effects
- Upkeep costs
- Treasury (gold)
- Inventory (8 item types with quantities)

### Roster Slice (ENHANCED - v1.6)
- Array of members with stats, EXP, levels, class
- Equipment (armor, weapons)
- Status tracking (idle/injured/active)
- `autoCastEnabled: Record<memberId, boolean>` — Per-member auto-cast toggle state
- `toggleAutoCast(memberId)` — Toggle auto-cast for member in combat

### Mission Slice
- Active missions
- Rewards pending
- Tier unlock status

### Combat Slice
- Current combat state
- Turn order
- Damage log

### Save Status Slice (NEW)
- `saveStatus`: 'idle' | 'saving' | 'saved' | 'error'
- `saveError`: Error message or null
- `setSaveStatus()`: Called by SaveManager to update HUD

### Build Mode Slice (ENHANCED - Advanced Features v1.3)
- `isBuildMode`: Boolean flag controlling grid/member visibility and interaction mode
- `activeBuildType`: RoomType | null (null = not actively placing/moving)
- `buildRotation`: 0 | 90 | 180 | 270 (current preview rotation)
- `activeItem`: ActiveBuildItem | null (tracks placement or move metadata)
  - `type: 'new' | 'existing'` — New purchase vs. existing room move
  - `roomType: RoomType` — Room type being placed/moved
  - `rotation: Rotation` — Current rotation
  - `roomId?: string` — ID of room being moved (existing only)
  - `originalPosition?: {x, z}` — Saved position for cancel (existing only)
  - `originalRotation?: Rotation` — Saved rotation for cancel (existing only)
- `toggleBuildMode(on)`: Enter/exit build mode, reset all placement state
- `startPlacement(type)`: New room placement, reset rotation to 0
- `startMovingRoom(roomId, type, pos, rotation)`: Pick up existing room with metadata capture
- `rotatePlacement()`: Cycle rotation, update activeItem rotation
- `cancelPlacement()`: Exit mode, restore original position/rotation if moving

## File Organization

### `/game/save/` — Save System (Core)
| File | Purpose |
|------|---------|
| `save-manager.ts` | Orchestrates load/save/import/export, manages auto-save interval |
| `save-storage.ts` | CRUD for 3 IndexedDB slots + backup shadow slots |
| `save-validation.ts` | TypeScript type guards, migration pipeline, import validation |
| `save-types.ts` | Type definitions: SaveEnvelope, GameState, SaveSlotMetadata |
| `active-slot-storage.ts` | Read/write active slot ID to localStorage |
| `format-play-time.ts` | Format playtime metadata for display |
| `save-migrations.ts` | Migrate old save formats to current version |

### `/ui/screens/` — Full-Screen Views
| File | Purpose |
|------|---------|
| `title-screen.tsx` | Save slot selection UI, continue/new/delete actions |
| `save-slot-card.tsx` | Individual slot card (metadata, buttons) |
| `game-screen.tsx` | Game world + HUD + panels + tick loop (extracted from App.tsx) |

### `/ui/hud/` — Heads-Up Display
| File | Purpose |
|------|---------|
| `hud.tsx` | Top-level HUD container |
| `save-status-badge.tsx` | Save status indicator (spinner/checkmark/error) |
| `panel-toggle.tsx` | Button bar for switching panels |
| `mission-notification.tsx` | Toast notification stack renderer |

### `/ui/components/` — Reusable Components (Build Mode & HUD)
| File | Purpose |
|------|---------|
| `build-mode-hint.tsx` | HUD hint overlay displaying placement controls (R, Escape, Click) |
| `resource-bar.tsx` | HUD resource display showing Wood/Stone/Iron quantities |
| Other components | Stat bars, cards, buttons, dialogs |

### `/ui/components/` — Reusable Components
| File | Purpose |
|------|---------|
| `confirm-dialog.tsx` | Delete/overwrite confirmation dialogs |
| `mission-progress-bar.tsx` | Progress fill % for active missions |
| `mission-notification.tsx` | Individual toast notification |
| Other UI components | Stat bars, cards, buttons |

### `/ui/panels/` — Collapsible Panels
| File | Purpose |
|------|---------|
| `quest-board.tsx` | Dispatch missions, track progress with member count "(selected/min+)" display |
| `quest-detail-modal.tsx` | Modal showing quest info + party composition + multi-member rewards breakdown |
| `guild-roster.tsx` | Compact member list with character detail panel (NEW v1.6) |
| `character-detail-panel.tsx` | Left-side detail panel (avatar, equipment, auto-cast toggle, stats) — NEW v1.6 |
| `build-menu.tsx` | Room selection UI (enter placement mode instead of direct placement) |
| `combat-view.tsx` | Combat log + tick-by-tick simulation details |
| `char-creation.tsx` | Stat allocation (50 points) |
| `settings-panel.tsx` | Audio/lang toggle, import/export, return to title |

### `/ui/components/roster/` — Roster Components (NEW - v1.6)
| File | Purpose |
|------|---------|
| `roster-list-item.tsx` | Compact member card component (condensed UI) — NEW v1.6 |

### `/ui/styles/` — Styling
| File | Purpose |
|------|---------|
| `title-screen.css` | Title screen layout + theme |
| `hud.css` | HUD bar + badge styling + notification stack + mission progress bars |
| `panels.css` | Panel container styling + quest detail modal |

### `/scene/` — 3D Rendering (React Three Fiber)
| File | Purpose |
|------|---------|
| `guild-hall.tsx` | Guild hall room rendering with dynamic dimensions and rotation |
| `build-overlay.tsx` | Build mode overlay: grid lines, ghost preview, raycasting, placement controls |
| Other scene files | Camera, lighting, sprites, world setup |

### `/game/state/` — Zustand Store
| File | Purpose |
|------|---------|
| `store.ts` | Combined store with all slices |
| `game-slice.ts` | Active guild, clock, combat log |
| `guild-slice.ts` | Buildings, rooms, treasury, upkeep, inventory |
| `roster-slice.ts` | Members, stats, EXP, levels, status |
| `mission-slice.ts` | Active missions, timers, rewards, rewards queue |
| `combat-slice.ts` | Current combat, turns, damage log |
| `save-status-slice.ts` | Auto-save status (idle/saving/saved/error) |
| `notification-slice.ts` | Ephemeral mission notifications (not persisted) |
| `build-mode-slice.ts` | Build mode state (activeBuildType, buildRotation, placement controls) |
| `inventory-slice.ts` | Inventory CRUD: addItems(), consumeItems() with atomic validation |

### `/game/systems/` — Game Logic
| File | Purpose |
|------|---------|
| `combat-system.ts` | Damage calculation, turn simulation |
| `economy-system.ts` | Gold, upkeep, debt |
| `mission-system.ts` | Quest dispatch, timers |
| `mission-tick.ts` | Phase state machine: processMissionTick (advancing traveling→arrived→in-combat→completed/failed), MissionTickEvent emission |
| `mission-resolver.ts` | resolveMission: combat sim + reward calc (EXP divided by party size) + loot generation |
| `combat-simulator.ts` | Combat simulation with skill cooldown (attackIntervalMs * 2) + auto-cast logic |
| `mission-dispatch.ts` | Dispatch mission, set initial phase to 'traveling' |
| `mission-board.ts` | Quest listing & dispatch UI logic |
| `leveling-system.ts` | EXP, levels, stat growth |
| `building-system.ts` | Grid constants, AABB collision detection, room placement validation, rotation sizing, resource cost validation |
| `loot-roller.ts` | Pure functions: rollLoot(enemy) generates drops, mergeLoot(drops[]) combines |
| `/workers/game-loop.worker.ts` | Web Worker: 1s tick heartbeat |

### `/game/data/` — Static Data
| File | Purpose |
|------|---------|
| `enemies.ts` | Enemy templates by tier (includes lootRules) |
| `missions.ts` | Quest definitions, rewards, duration |
| `skills.ts` | Ability data |
| `characters.ts` | 80+ hero templates |
| `buildings.ts` | Room definitions (type, name, cost: ResourceCost, width/depth, effect) |
| `items.ts` | Item registry (8 types: names, stack limits) |

### `/ui/hooks/` — Custom React Hooks
| File | Purpose |
|------|---------|
| `use-game-tick-loop.ts` | Initialize Web Worker, handle ticks, process missions/injuries, offline catch-up |

### `/i18n/` — Localization
| File | Purpose |
|------|---------|
| `vi.json` | Vietnamese translations (default locale) |
| `index.ts` | i18next setup |

## Key Architectural Decisions

### 1. Multi-Slot IndexedDB Design
- **Why**: Prevents save corruption from affecting all progress
- **How**: 3 independent slots, each with shadow backup
- **Trade-off**: Slightly larger DB usage vs. safety

### 2. TypeScript Type Guards (No External Validation)
- **Why**: Reduces dependencies, clear validation logic
- **How**: `isValidSaveEnvelope()`, `isSaveSlotMetadata()` type predicates
- **Trade-off**: Manual guard maintenance vs. schema library overhead

### 3. Zustand for State + Save Status
- **Why**: Centralized, immutable updates, built-in middleware for persistence
- **How**: SaveStatusSlice drives HUD badge state
- **Trade-off**: Component re-renders when save status changes (acceptable)

### 4. Web Worker for Offline Simulation
- **Why**: Tick loop continues even if tab inactive
- **How**: Separate thread runs game systems, syncs on app return
- **Trade-off**: Complexity of worker communication vs. offline UX

### 5. Screen-Based Routing (Title → CharCreation → Game)
- **Why**: Clear lifecycle, enforced save slot selection before gameplay
- **How**: `appScreen` state in App.tsx, conditional rendering
- **Trade-off**: No deep-linking, but simpler state management

## Auto-Save Strategy

| Trigger | Action |
|---------|--------|
| Timer (60s) | SaveManager interval calls `save()` |
| Tab Visibility | `visibilitychange` event triggers save before hidden |
| Debounce | 5s minimum between saves to avoid hammering IndexedDB |

**Result**: Game state saved every 60s OR when user closes tab, whichever is first.

## Error Handling & Recovery

### Save Corruption
1. Primary save load fails
2. Try backup slot
3. If backup valid: restore to primary
4. If both invalid: show error, offer to start new game

### Slot Overflow
- Each slot has fixed structure
- No overflow scenarios (save size controlled)

### IndexedDB Unavailable
- Graceful fallback (game still playable, auto-save disabled)
- Import/export still functional

## Security Considerations

- **No sensitive data**: All data is game state only
- **Client-side only**: No server communication
- **JSON format**: Human-readable, easy to audit
- **Type validation**: Prevents injection of invalid game states
- **Offline-safe**: No authentication required

## Performance Characteristics

| Operation | Latency | Frequency |
|-----------|---------|-----------|
| Save | <100ms | Every 60s |
| Load | <200ms | On slot select |
| List slots | <50ms | On title screen |
| Export JSON | <50ms | On-demand |
| Import + validate | <100ms | On-demand |

**Result**: Save operations do not block UI (async).

## Browser Compatibility

- **IndexedDB**: IE10+, all modern browsers
- **Web Workers**: IE10+
- **localStorage**: All browsers
- **React 19**: Modern browsers (ES2020+)

## Testing Coverage

- **Save validation**: Unit tests for type guards, migrations
- **Save/load cycle**: Integration tests for full lifecycle
- **Slot management**: Tests for CRUD operations
- **Status updates**: Component tests for HUD badge
