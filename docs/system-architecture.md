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

## Data Flow: Build Mode (Cell-Based v1.7)

### Overview

Build Mode uses cell-based rooms with 3 modes: new-room, new-furniture, move-room.

```
[Player clicks Build Mode toggle]
    ↓
toggleBuildMode(true) → isBuildMode = true, dynamic grid visible, members hidden
    ↓
[Player clicks existing room floor tile]
    ↓
startMovingRoom(roomId, roomType, cells)
  → activeItem = { type: 'move-room', roomId, roomType, rotation, originalCells }
  → Room floor tiles hidden during move
    ↓
OR [Player selects room type from Build Menu > Rooms tab]
    ↓
startPlacement(roomType)
  → activeItem = { type: 'new-room', roomType, rotation: 0 }
    ↓
OR [Player selects furniture from Build Menu > Furniture tab]
    ↓
startFurniturePlacement(furnitureType, targetRoomId)
  → activeItem = { type: 'new-furniture', furnitureType, targetRoomId, rotation: 0 }
    ↓
[BuildOverlay renders ghost preview — cells or furniture box]
    ↓
Mouse Position: Raycasted from 3D → snapped to grid cell
    ↓
Validation:
  new-room:  generateRoomCells(x,z,w,d) → checkCellOverlap + checkAdjacency
  move-room: generateRoomCells(x,z,w,d) → checkCellOverlap(exclude) + checkAdjacency
  new-furniture: canPlaceFurniture(room, type, pos, rotation)
    ↓
Ghost renders green (valid) or red (invalid)
    ↓
[Click to confirm | R to rotate | Esc/right-click to cancel]
    ↓
If valid click:
  new-room: buildRoom(type, cells) → spends gold+items, creates room + autoPlaceCoreFurniture
  move-room: update room.cells in store
  new-furniture: spends gold+items, adds PlacedFurniture to room
  → activeItem = null
    ↓
If cancel: cancelPlacement() → activeItem = null
```

### Placement Validation

```
canPlaceRoom(guildHall, roomType, gold, inventory):
  1. Check capacity: rooms.length < maxRooms
  2. Check gold >= cost
  3. Check inventory has required items
  4. Return { success, reason? }

checkCellOverlap(rooms, newCells, excludeRoomId?):
  1. Build Set of occupied cell keys from all rooms
  2. Return true if any newCell is in occupied set

checkAdjacency(rooms, newCells):
  1. If first room (rooms.length === 0) → always valid
  2. Check 4-directional neighbors of each newCell against occupied set
  3. Return true if any neighbor found

canPlaceFurniture(room, furnitureType, position, rotation):
  1. Check allowedRooms restriction
  2. Check maxPerRoom limit
  3. Check furniture cells fit within room cells
  4. Check no overlap with existing furniture
```

### Furniture & Room Levels

```
autoPlaceCoreFurniture(room):
  → Looks up RoomDefinition.coreFurniture → places at room center

upgradeCoreFurniture(room):
  → Finds core furniture → checks upgradeCosts[level-1]
  → Returns { room: upgraded, cost } or null if max level
  → Room.level = coreFurniture.level (kept in sync)
```

## Data Flow: Character Sprite Animation (NEW - v1.11)

### Sprite Path Resolution

```
Member (archetype, gender, civilization)
    ↓
getSpritePath(civ, archetype, gender):
  1. Look up CIV_SPRITE_PREFIX[civ] (TS=LinhSon, DQ=DeQuoc, TL=ThienLu)
  2. Build path: /sprites/characters/{PREFIX}-{ARCH}-{GENDER}
     → Example: /sprites/characters/TS-WARRIOR-M
    ↓
Returns base path for sprite folder
```

### Sprite Animation System

```
SpriteAnimator Component (basePath, directionRef, isMovingRef):
  1. Load all 32 texture paths (4 directions × 8 frames)
     → Uses convention: {basePath}/animations/walking-8-frames/{dir}/frame_0XX.png
  2. Setup animation cycle: 10 FPS (frame updates every 100ms)
  3. On each frame (useFrame):
     → Read directionRef + isMovingRef (MutableRefObjects)
     → Calculate current frame index: (direction, elapsed time)
     → Render textured plane with current frame
  4. Textures use NearestFilter for crisp pixel-art rendering
  5. Three.js auto-caches textures by URL (sheets reused across instances)
```

### Member Layer Integration

```
MemberLayer renders all members:
  1. For each member: create MemberSprite component
  2. Initialize directional movement tracking:
     → directionRef: tracks current facing (north/south/east/west)
     → isMovingRef: tracks idle vs. walking state
  3. On each frame:
     → Pick random walkable cell center as movement target
     → Move toward target (delta-time based, 0.9 units/sec)
     → Calculate direction from movement delta (dx, dz)
     → Update directionRef for sprite animator
  4. At arrival:
     → Set isMovingRef = false (idle animation)
     → Wait 2-3 seconds before picking new target
  5. Wrap each sprite in Billboard component (faces camera always)
```

### Archetype & Gender Support

```
Character Model (game-state.ts Member interface):
  - archetype: CivArchetype | undefined (warrior, scout, engineer, etc.)
  - gender: 'M' | 'F' | undefined
  - civilization: Civilization

Fallback Strategy:
  - archetype defaults to 'warrior' if missing (old saves)
  - gender defaults to 'M' if missing (old saves)
  - Ensures backward compatibility with pre-v1.11 saves
```

### Sprite Folder Structure

```
/sprites/characters/
├── TS-WARRIOR-M/           # LinhSon Warrior Male
│   └── animations/walking-8-frames/
│       ├── north/          # 8 walking frames facing north
│       ├── south/          # 8 walking frames facing south
│       ├── east/           # 8 walking frames facing east
│       └── west/           # 8 walking frames facing west
├── TS-WARRIOR-F/           # LinhSon Warrior Female
├── TS-SCOUT-M/             # LinhSon Scout Male
├── TS-SCOUT-F/             # LinhSon Scout Female
├── DQ-ENGINEER-M/          # DeQuoc Engineer Male
├── DQ-ENGINEER-F/
├── DQ-SCHOLAR-M/           # DeQuoc Scholar Male
├── DQ-SCHOLAR-F/
├── TL-DUALBLADE-M/         # ThienLu DualBlade Male
├── TL-DUALBLADE-F/
├── TL-PHILOSOPHER-M/       # ThienLu Philosopher Male
└── TL-PHILOSOPHER-F/
```

Total: 12 character sprite sets (3 civs × 2 archetypes × 2 genders)

### Direction Detection

```
getDirectionFromMovement(dx, dz):
  1. Compare absolute values of dx and dz
  2. If |dx| > |dz|:
     → Return 'east' if dx > 0, else 'west'
  3. Else:
     → Return 'south' if dz > 0, else 'north'

  Result: 4-directional facing based on movement vector
```

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

## Data Flow: Civilization System (NEW - v1.9 Milestone 2)

### Civilization Selection & Stat Bonus Application

```
Character Creation UI
    ↓ Player selects civilization
selectCivilization(civId)
    ↓
Character.civId = civId (founder or new member)
    ↓
CIV_CONFIG[civId] lookup:
  - name: "Linh Sơn" | "Đế Quốc" | "Thiên Lữ"
  - statBonuses: { STR: +X, ... }
  - archetypes: ['Warrior', 'Mage', 'Rogue']
  - heroes: { 'Warrior': [...], 'Mage': [...], 'Rogue': [...] }
    ↓
applyCivBonuses(character, civId):
  1. Get CIV_CONFIG[civId].statBonuses
  2. For each stat bonus: character.stats[stat] += bonus
  3. Return updated character
    ↓
Character created with civ-adjusted stats
    ↓
Save includes civId field (save migration v8→v9)
    ↓
UI renders civ-badge component alongside member card
```

### Civilization Display & Filtering

```
Guild Roster Panel:
    ↓
Render all members with civ-badge (emblem + name)
    ↓
Filter Option: "Show all civilizations"
    ↓
User clicks civilization filter
    ↓
roster.filter(m => m.civId === selectedCivId)
    ↓
Filtered roster re-renders
    ↓
Quest board respects civ filter for mission recommendations
```

### Character Detail Panel Integration

```
User clicks member in roster
    ↓
character-detail-panel opens
    ↓
Display:
  - Civilization name + emblem (civ-badge)
  - Applied stat bonuses from CIV_CONFIG
  - Archetype (Warrior/Mage/Rogue per civ)
  - Combat passive ability description (next section)
```

## Data Flow: Combat Passives System (NEW - v1.9 Milestone 2)

### Passive Ability Application During Combat

```
resolveMission(mission, members) called:
    ↓
For each member:
  1. Look up member.civId
  2. Get CIV_CONFIG[civId].passive
     - Son The (Linh Sơn): +20% max HP per level
     - Dien The Chi Huy (Đế Quốc): +30% EXP gain
     - Tinh Lo (Thiên Lữ): +15% dodge rate
    ↓
Combat Simulation:
  Passive Type 1 - HP Bonus (Son The):
    - maxHP = baseHP * (1 + 0.2 * level)
    - Applied at combat start
    ↓
  Passive Type 2 - Dodge Bonus (Tinh Lo):
    - dodgeChance += 0.15
    - Checked during damage calculation
    - If random < dodgeChance: damage = 0, emit "dodge" event
    ↓
  Passive Type 3 - EXP Bonus (Dien The Chi Huy):
    - Applied post-mission to survivors only
    ↓
Mission Resolution:
  expReward = baseExp * (1 + member.rank.expBonusPct/100)
  if member.civId === 'DE_QUC':  // Đế Quốc
    expReward *= 1.3  // Dien The Chi Huy bonus
    ↓
Result.expPerMember includes passive bonus
    ↓
Notification shows: "Gained +XXX EXP (includes Dien The Chi Huy bonus)"
```

### Passive Display in UI

```
character-detail-panel:
    ↓
Section: "Combat Passive"
    ↓
Display:
  - Passive name (e.g., "Son The")
  - Civilization (Linh Sơn, etc.)
  - Bonus description with value
  - When it applies (combat start, during dmg, post-mission)
    ↓
roster-list-item:
    ↓
Small badge indicator: "Passive: +20% HP"
    ↓
Hover tooltip shows full passive description
```

## Data Flow: Guild Rank System (NEW - v1.8)

### Promotion Check & Execution

```
canPromote(member, gold):
  1. If rank === 'COMMANDER' or 'MERCENARY' → return false
  2. nextRank = getNextRank(member.rank)
  3. reqs = GUILD_RANKS[nextRank].promotion
  4. return member.level >= reqs.minLevel &&
           member.missionsCompleted >= reqs.minMissionsCompleted &&
           gold >= reqs.goldCost

promoteMember(memberId, goldCost):
  1. Validate checks pass
  2. Atomically: deductGold(goldCost), member.rank = nextRank
  3. Emit notification + SFX, update UI
```

### Upkeep & EXP Calculation

```
Daily upkeep = sum of:
  - UPKEEP_PER_MEMBER * member.rank.upkeepModifier per member
  - UPKEEP_PER_ROOM per building

Mission reward EXP = baseExp * (1 + member.rank.expBonusPct/100)
  - Applied per survivor on mission completion
  - ++member.missionsCompleted for next promotion check
```

### Save Migration v7 → v8

```
On load:
  - Add missionsCompleted = 0 to all members
  - Non-MERCENARY: reset to RECRUIT, seed missionsCompleted = level * 2
  - MERCENARY: unchanged, seed missionsCompleted = level * 2
  - Version: 7 → 8 (transparent to user)
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

### Roster Slice (ENHANCED - v1.6, v1.8, v1.11)
- Array of members with stats, EXP, levels, class
- Equipment (armor, weapons)
- Status tracking (idle/injured/active)
- `archetype: CivArchetype | undefined` — Character archetype per civ (warrior, scout, engineer, etc.) — NEW v1.11
- `gender: 'M' | 'F' | undefined` — Character gender for sprite selection — NEW v1.11
- `autoCastEnabled: Record<memberId, boolean>` — Per-member auto-cast toggle state
- `toggleAutoCast(memberId)` — Toggle auto-cast for member in combat
- `rank: MemberRank` — Member rank (RECRUIT | MEMBER | VETERAN | OFFICER | COMMANDER | MERCENARY)
- `missionsCompleted: number` — Lifetime mission count (for promotion eligibility)
- `promoteMember(memberId, goldCost)` — Advance rank + deduct gold

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
| `resource-bar.tsx` | HUD resource display showing Wood/Stone/Iron quantities with item icons |
| `civ-badge.tsx` | Civilization emblem + name display component — NEW v1.9 |
| `game-icon.tsx` | Reusable icon renderer with size control + text fallback — NEW v1.10 |
| `cost-display.tsx` | Resource cost display with item icons — NEW v1.10 |
| Other components | Stat bars, cards, buttons, dialogs |

### `/ui/components/` — Reusable Components
| File | Purpose |
|------|---------|
| `confirm-dialog.tsx` | Delete/overwrite confirmation dialogs |
| `mission-progress-bar.tsx` | Progress fill % for active missions |
| `mission-notification.tsx` | Individual toast notification |
| `stat-bar.tsx` | Character stat bar with icon display |
| `rank-badge.tsx` | Rank display with icon + color coding |
| Other UI components | Stat bars, cards, buttons |

### `/ui/panels/` — Collapsible Panels
| File | Purpose |
|------|---------|
| `quest-board.tsx` | Dispatch missions, track progress with member count "(selected/min+)" display, quest chain badges, civ filter |
| `quest-detail-modal.tsx` | Modal showing quest info + party composition + multi-member rewards breakdown |
| `guild-roster.tsx` | Compact member list with character detail panel (NEW v1.6), civ badges, civilization filtering |
| `character-detail-panel.tsx` | Left-side detail panel (avatar, equipment, auto-cast toggle, stats, civ info, passives) — NEW v1.6, ENHANCED v1.9 |
| `build-menu.tsx` | Room selection UI (enter placement mode instead of direct placement) |
| `combat-view.tsx` | Combat log + tick-by-tick simulation details |
| `char-creation.tsx` | Stat allocation (50 points), civilization selector — ENHANCED v1.9 |
| `settings-panel.tsx` | Audio/lang toggle, import/export, return to title |

### `/ui/components/roster/` — Roster Components (NEW - v1.6, v1.8)
| File | Purpose |
|------|---------|
| `roster-list-item.tsx` | Compact member card component (condensed UI, with stat/skill icons) — NEW v1.6, ENHANCED v1.10 |
| `rank-badge.tsx` | Rank display with icon + color coding (RECRUIT/MEMBER/VETERAN/OFFICER/COMMANDER/MERCENARY) — NEW v1.8, ENHANCED v1.10 |
| `rank-promotion-section.tsx` | Promotion UI with eligibility check + button (in character detail panel) — NEW v1.8 |

### `/ui/utils/` — Utility Functions (NEW - v1.10)
| File | Purpose |
|------|---------|
| `icon-paths.ts` | Convention-based icon path resolver: maps (category, id) → `/sprites/icons/{prefix}-{filename}.png` with ID-to-filename overrides |

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
| `sprite-animator.tsx` | Animated sprite component: loads walking frames, cycles at 10 FPS, supports 4 directions — NEW v1.11 |
| `sprite-path-resolver.ts` | Convention-based sprite path resolution: (civ, archetype, gender) → `/sprites/characters/{PREFIX}-{ARCH}-{GENDER}` — NEW v1.11 |
| `member-layer.tsx` | Renders all guild members as animated sprite billboards, handles movement AI + direction tracking — ENHANCED v1.11 |
| Other scene files | Camera, lighting, world setup |

### `/game/state/` — Zustand Store
| File | Purpose |
|------|---------|
| `store.ts` | Combined store with all slices |
| `game-slice.ts` | Active guild, clock, combat log |
| `guild-slice.ts` | Buildings, rooms, treasury, upkeep, inventory |
| `roster-slice.ts` | Members, stats, EXP, levels, status, civId (ENHANCED v1.9) |
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
| `combat-passives.ts` | Passive ability definitions (Son The, Dien The Chi Huy, Tinh Lo), application logic during combat |
| `economy-system.ts` | Gold, upkeep, debt |
| `mission-system.ts` | Quest dispatch, timers |
| `mission-tick.ts` | Phase state machine: processMissionTick (advancing traveling→arrived→in-combat→completed/failed), MissionTickEvent emission |
| `mission-resolver.ts` | resolveMission: combat sim + reward calc (EXP divided by party size + passive bonuses) + loot generation |
| `combat-simulator.ts` | Combat simulation with skill cooldown (attackIntervalMs * 2) + auto-cast logic + passive application |
| `mission-dispatch.ts` | Dispatch mission, set initial phase to 'traveling' |
| `mission-board.ts` | Quest listing & dispatch UI logic |
| `leveling-system.ts` | EXP, levels, stat growth |
| `building-system.ts` | Grid constants, AABB collision detection, room placement validation, rotation sizing, resource cost validation |
| `loot-roller.ts` | Pure functions: rollLoot(enemy) generates drops, mergeLoot(drops[]) combines |
| `/workers/game-loop.worker.ts` | Web Worker: 1s tick heartbeat |

### `/game/systems/` — Rank System (NEW - v1.8)
| File | Purpose |
|------|---------|
| `guild-upgrade-system.ts` | Member promotion utilities (canPromote, meetsPromotionRequirements) |

### `/game/data/` — Static Data
| File | Purpose |
|------|---------|
| `civilization-config.ts` | CIV_CONFIG: 3 civilizations (Linh Sơn, Đế Quốc, Thiên Lữ), stat bonuses, CivArchetype types (6 total: warrior, scout, engineer, scholar, dualblade, philosopher), hero rosters, colors, name pools — ENHANCED v1.11 |
| `enemies.ts` | 15 enemy templates by tier (F/E/D), includes lootRules, special abilities (stun-attack, enrage, heal-ally) |
| `missions.ts` | 22 quest definitions (F/E/D tiers), quest chains, gate bosses, rewards, duration |
| `skills.ts` | 7 skills grouped by SKILLS_BY_ARCHETYPE (Warrior/Mage/Rogue per civ), cooldown, damage, range |
| `characters.ts` | 80+ hero templates per civilization |
| `buildings.ts` | Room definitions (type, name, cost: ResourceCost, width/depth, effect) |
| `items.ts` | Item registry (8 types: names, stack limits) |
| `ranks.ts` | Rank definitions (RECRUIT→COMMANDER + MERCENARY), perks, promotion requirements |

### `/ui/hooks/` — Custom React Hooks
| File | Purpose |
|------|---------|
| `use-game-tick-loop.ts` | Initialize Web Worker, handle ticks, process missions/injuries, offline catch-up |

### `/i18n/` — Localization
| File | Purpose |
|------|---------|
| `vi.json` | Vietnamese translations (default locale), includes Milestone 2 strings (civilizations, passives, new missions) |
| `index.ts` | i18next setup |

### `/audio/` — Audio Management
| File | Purpose |
|------|---------|
| `audio-manager.ts` | Audio key registry + Howler.js management, includes 6 new keys (v1.9): BGM_COMBAT, SFX_CRIT, SFX_DODGE, SFX_DEATH, SFX_SKILL, SFX_RECRUIT |
| `audio-keys.ts` | Enum of all audio keys |

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

## Icon Asset System (NEW - v1.10)

### Architecture

The icon system uses **convention-based path resolution** to map game entities → pixel-art assets without data-file changes.

```
GameIcon(category='stat', id='STR')
    ↓
getIconPath('stat', 'STR')
    ↓
ID_TO_FILENAME override check → 'str' (lowercase)
    ↓
PREFIX['stat'] = 'icon'
    ↓
/sprites/icons/icon-str.png
    ↓
GameIcon component renders <img> with fallback
```

### Categories & Prefixes

| Category | File Prefix | Example Path | Use Case |
|----------|------------|--------------|----------|
| `stat` | `icon-` | `/sprites/icons/icon-str.png` | Character stats (STR, AGI, INT, DEF, VIT, LCK, WIS) |
| `skill` | `icon-` | `/sprites/icons/icon-slash.png` | Ability/skill icons per archetype |
| `item` | `icon-` | `/sprites/icons/icon-wood.png` | Loot items (wood, stone, iron-ore, etc.) |
| `room` | `icon-room-` | `/sprites/icons/icon-room-tavern.png` | Guild hall rooms |
| `furniture` | `icon-furn-` | `/sprites/icons/icon-furn-quest-board.png` | Room furnishings |
| `badge` | `badge-` | `/sprites/icons/badge-d.png` | Mission tier badges (F, E, D, C, B, A, S) |
| `rank` | `badge-` | `/sprites/icons/badge-veteran.png` | Guild ranks |
| `emblem` | `emblem-` | `/sprites/icons/emblem-linh-son.png` | Civilization emblems |
| `status` | `status-` | `/sprites/icons/status-injured.png` | Character status (idle, injured, active) |

### ID-to-Filename Overrides

The `ID_TO_FILENAME` map in `icon-paths.ts` handles naming inconsistencies:

```typescript
// ItemID UPPER_SNAKE → kebab
WOOD: 'wood', STONE: 'stone', IRON_ORE: 'iron-ore', ...

// Civilization PascalCase → kebab
LinhSon: 'linh-son', DeQuoc: 'de-quoc', ThienLu: 'thien-lu'

// GuildRank UPPER → lowercase
RECRUIT: 'recruit', MEMBER: 'member', VETERAN: 'veteran', ...

// Edge case: training-room → training (omit "-room")
'training-room': 'training'
```

### GameIcon Component

```typescript
<GameIcon
  category="stat"
  id="STR"
  size={24}
  fallbackText="S"      // Shown if image fails to load
  fallbackColor="#666"
/>
```

**Features:**
- Graceful fallback to text abbreviation if image unavailable
- Pixelated rendering preserves pixel-art aesthetic
- Size control via `size` prop (width/height in px)
- Error state tracking prevents infinite load loops

### UI Integration

Icons appear in 13 components across the UI:

- **Quest Board**: Mission tier badges
- **Roster**: Member stat icons, rank badges
- **Character Detail**: Stat breakdown, skill icons, passive emblems
- **Build Menu**: Room/furniture icons, cost display with item icons
- **Tavern**: Character card icons
- **Combat Log**: Ability icons, damage types
- **HUD**: Resource bar item icons
- **Mission List**: Quest chain icons, status badges

### Zero Data File Changes

- All icon mapping lives in `icon-paths.ts`
- No changes to game state data files
- No inventory, mission, or enemy data modified
- Icons purely rendering enhancement (additive feature)

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
