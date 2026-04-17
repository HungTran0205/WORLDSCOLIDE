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

## Combat Arena System (v1.11–v1.14 — Real-Time Visual Combat)

**Archived**: Detailed combat arena documentation (formation grid, wave system, entity AI, pathfinding, event stream, camera controls) is in git history and codebase-summary.md. Core systems:

- **CombatEngine**: 100ms logic ticks, 60fps R3F rendering
- **Formation Grid**: 2×3 layout, range-based AI targeting
- **Wave Manager**: Progressive encounters, multi-wave support
- **Event Stream**: Damage, heal, skill, death, status effects  
- **Camera**: 35° isometric angle, multi-wave advancement

For detailed implementation, see:
- `codebase-summary.md` → "v1.10–v1.15 Releases Summary"
- Git commits v1.11–v1.14
- Combat system tests in `src/game/systems/*.test.ts`

---

## GPU-Instanced Combat Rendering Architecture (v1.19 — WebGPU-Compatible)

Combat rendering overhauled from per-entity React components to 1-draw-call GPU instancing. All sprite frames packed into mega-atlas. Animation & position state maintained in typed arrays (imperative, non-React).

### Rendering Pipeline Overview

```
┌─────────────────────────────────────┐
│  CombatEngine (100ms ticks)         │
│  ├─ Entity state (position, anim)   │
│  └─ Emits CombatEvent[]             │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  CombatStateBridge                  │
│  ├─ Derives typeId from entity      │
│  ├─ Syncs to AnimationStateBuffer   │
│  └─ Emits damage numbers to pool    │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  AnimationStateBuffer (Float32Array)│
│  ├─ 18 floats/entity (pos, frame..) │
│  └─ Zero React overhead             │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  InstancedSpriteRenderer            │
│  ├─ useFrame reads buffer           │
│  ├─ Updates InstancedMesh matrices  │
│  ├─ Updates per-instance attributes │
│  └─ GPU renders 1 draw call (48 max)│
└─────────────────────────────────────┘
```

### Core Modules (src/scene/combat/)

**MegaAtlasBuilder** (`mega-atlas-builder.ts`)
- Loads ALL sprite frames (walk, attack, death) for all character templates + all enemy waves
- Packs into shared CanvasTexture atlas (8 cols × N rows, max 4096×4096)
- Single atlas per sprite-size group (e.g. 128×128, 256×256)
- Critical: `flipY = false` (WebGPU UV convention; `flipY = true` breaks formula)
- Canvas disposed post-GPU upload to save RAM

**SpriteRegistry** (`sprite-registry.ts`)
- Maps (typeId, animState, frameIndex) → UV coords in atlas
- UV formula: v = bottom of frame row; h = negative height (feet→head)
- Cached O(1) lookups, populated by MegaAtlasBuilder

**AnimationStateBuffer** (`animation-state-buffer.ts`)
- Float32Array, 18 floats per entity stride
- Layout: targetX, targetZ, currentX, currentZ, animState, elapsed, frameIndex, fps, totalFrames, facingRight, hpRatio, isAlive, spriteTypeIndex, scaleX, scaleY, tintR, tintG, tintB
- No React involvement—pure imperative operations
- Position lerp (smooth movement), frame advance (animation timing), hit flash (red tint), death fade (elapsed timer after animation)

**CombatStateBridge** (`combat-state-bridge.ts`)
- Bridges CombatEngine → AnimationStateBuffer every frame
- Derives typeId: spriteId for enemies, civilization+archetype+gender for allies
- Emits combat events (damage numbers) to floating-text pool
- Syncs HP ratio, death state, animation index from engine

**InstancedSpriteRenderer** (`instanced-sprite-renderer.tsx`)
- Renders 48 entities in 1 draw call via InstancedMesh + PlaneGeometry
- Per-instance attributes: aUvRect (frame UV), aOpacity, aTint
- useFrame callback: read buffer → update matrices → update attributes → no render call (WebGPU handles it)
- Billboard rotation via camera quaternion (always face-on)
- WebGPU workaround: always render MAX_INSTANCES; hide unused via opacity=0 (dynamic count causes draw-call misses)
- Death fade: after death animation (~1s), entity opacity → 0 over 0.5s

**SpriteMaterial** (`sprite-material.ts`)
- Dual-path: MeshBasicNodeMaterial+TSL for WebGPU, ShaderMaterial+GLSL for WebGL fallback
- Per-instance UV remapping, tint overlay, alpha-test (discard transparent fragments)

**CombatTextLayer** (`combat-text-layer.tsx`)
- Entity name labels as canvas-texture sprites (NOT troika SDF, which uses custom GLSL incompatible with WebGPU)
- Fixed 256×48 canvas to avoid WebGPU texture-resize errors

**DamageNumberPool** (`damage-number-pool.tsx`)
- 32 pooled floating damage numbers as canvas-texture sprites
- Imperative spawn via ref
- Float-up + fade-out animation (1.5s duration, fixed 160×48 canvas)

**InstancedHpBars** (`instanced-hp-bars.tsx`)
- HP bars rendered via InstancedMesh (one bar per entity)
- Red fill = current HP, grey background

**CombatVfxSpawner** (`combat-vfx-spawner.tsx`)
- VFX layer for combat effects (particle emitters, visual polish)

### Combat Lifecycle

#### 1. Entry: Mission Arrival (processMissionTick)
```
Mission reaches "arrived" phase
    ↓
Emit MissionTickEvent { type: 'arrival', ... }
    ↓
ActiveMissionsList shows Modal:
  [Manual] [Auto] [timeout 30s → Auto]
    ↓
Player selects "Manual"
    ↓
setGameScene('combat-arena')
enterCombatPrep(missionId)
arenaPhase = 'prep'
```

#### 2. Prep: Formation Setup (CombatPrepPanel)
```
Show 2×3 grid of formation slots
    ↓
Player assigns members to slots (1-6 members selected)
    ↓
Real-time stats preview (total HP, DPS, avg range)
    ↓
Click "Start Battle"
    ↓
startBattle()
  → engine.init(selectedMembers, formation, enemyTemplates)
  → arenaPhase = 'fighting'
  → gameTickLoop paused
  → useFrame loop starts continuous engine.tick()
```

#### 3. Combat: Real-Time Fighting (CombatFightController)
```
Every frame (useFrame callback):
  1. engine.tick(dt) — Advance 100ms logic ticks
  2. Process CombatEvent[] (damage, heal, status, death)
  3. Update entity positions (AI movement)
  4. Update animations (idle, walking, attacking, skill)
  5. syncArenaState() → Store entities for rendering
  6. Check victory/defeat condition
    ↓
Player presses key 1-4 to cast skill
  → activateSkill(memberId, skillId)
  → Engine checks cooldown, resources, range
  → If valid: enqueue skill event
  → Cooldown timer set, hotbar updates
    ↓
Speed toggle 1x/2x multiplier:
  → Affects LOGIC_TICK_MS frequency
  → Visual: animations play 2x faster on 2x speed
    ↓
Combat ends when:
  - All allies dead (defeat)
  - All enemies dead (victory)
  - 2-minute timer expires (stalemate → defeat)
```

#### 4. Result: Outcome & Rewards (CombatResultOverlay)
```
Combat finishes
    ↓
arenaResult = { outcome, goldEarned, expPerMember, survivors, injured }
arenaPhase = 'result'
    ↓
Show overlay with:
  - Victory/Defeat banner
  - Gold earned (luck-scaled)
  - EXP per survivor (rank-modified)
  - Injury list (recovery time)
  - Loot summary
    ↓
Player clicks "Return to Guild Hall"
    ↓
exitArena()
  → applyArenaRewards() via arena-result-handler
  → Add gold to guild.gold
  → Add EXP to survivors
  → Mark injured members with recovery timer
  → completeMission(missionId)
  → gameScene = 'guild-hall'
  → gameTickLoop resumes
```

### Arena Environment (Sidescroller Layout)

- **Camera Angle**: 35° from horizontal (beat-em-up sidescroller perspective, camera at [0, 7, 10])
- **Arena Bounds**: X ∈ [-8, 8], Z ∈ [-4, 4] (entities clamp to bounds)
- **Ground Plane**: Dark textured floor with center reference line
- **Walls**: Side walls at X=-8 and X=8; background wall at far Z
- **Lighting**: Front-above light (front-facing, combat-readable)
- **Formation Spread**: Tightened to Z ∈ ±1.5 per slot (reduced from ±2 for sidescroller depth clarity)

### Formation Grid (2×3 Layout)

```
Ally Formation:              Enemy Formation:
Front Row:                   Front Row:
  [0]  [1]  [2]               [3]  [4]  [5]
  x=-4 x=-4 x=-4              x=4  x=4  x=4
  z=-2 z=0  z=2               z=-2 z=0  z=2

Back Row:                    Back Row:
  [3]  [4]  [5]               [0]  [1]  [2]
  x=-6 x=-6 x=-6              x=6  x=6  x=6
  z=-2 z=0  z=2               z=-2 z=0  z=2

Distance: ~2-4 units between front/back row,
          ~8 units between ally and enemy front rows
```

### Entity AI & Pathfinding

```
For each allied entity:
  1. Find best target via findTarget(entity, enemies)
     - Prefer low-HP targets
     - Prioritize frontline if melee, backline if ranged
  2. Calculate distance to target
  3. If distance > attackRange:
     - moveToward(position, targetPosition, moveSpeed, dt)
     - Walk animation, face target direction
  4. Else if distance <= attackRange && action ready:
     - Auto-attack or cast ability
     - Attack animation, emit damage event
  5. Update status effects each tick via applyEffectTick()
     - Poison (flat damage/tick)
     - Stun (disable actions)
     - Vulnerability (damage multiplier)
     - Defense buffs (reduce damage)
```

### Event-Driven Updates (CombatEvent Stream)

```
CombatEvent types emitted by engine.tick():

1. DamageEvent: { type: 'damage', target, damage, source, isCrit, position }
   → Floating damage number at position
   → Sound effect (hit or crit)

2. HealEvent: { type: 'heal', target, amount, source, position }
   → Floating heal number (green)
   → Sound effect

3. SkillCastEvent: { type: 'skill-cast', member, skill, targets, position }
   → Skill animation (glow, projectile)
   → Sound effect (SFX_SKILL)

4. StatusEffectEvent: { type: 'status-apply' | 'status-remove', target, effect, duration }
   → Status icon displayed on entity
   → Stun animation (freeze frame)

5. DeathEvent: { type: 'death', entity }
   → Death animation (fade out)
   → Sound effect (SFX_DEATH)
   → Remove from active entities, keep for result screen

All events accumulated per tick → UI batches renders once per frame
```

### Key Systems Reused

- **Combat Formulas** (combat-formulas.ts): Damage, crit, armor
- **Combat Passives** (combat-passives.ts): All 3 civ passives applied
- **Status Effects** (combat-effects.ts): Poison, stun, vulnerability, buffs
- **Skills** (skills.ts): All 7 skills, archetype variants
- **Loot Tables** (enemies.ts): Same drop rates as auto-resolve
- **Mission Data** (missions.ts): Enemy templates, difficulty scaling

**Zero Changes**: All existing combat logic reused; arena is purely visual

### Performance Considerations

- **Logic Ticks**: 100ms frequency (10 per second), independent of frame rate
- **Memory**: ~1-2MB per arena instance (6-12 entities, event queue)
- **Draw Calls**: 12 billboards + 1 ground plane + VFX layer (~20-30 calls/frame)
- **CPU**: Entity AI loop O(n²) worst-case (each entity checks all targets), n ≤ 12
- **Frame Budget**: 16.67ms per frame (60fps); engine tick amortized across multiple frames

### WebGPU Compatibility (v1.19 Critical Findings)

Architecture designed to work with WebGPU. Key constraints discovered during implementation:

| Issue | Solution | Impact |
|-------|----------|--------|
| `CanvasTexture.flipY = true` breaks UV formula | Always use `flipY = false` for atlas | Must invert UV v-coordinate formula |
| Troika-three-text (SDF) uses custom GLSL ShaderMaterial | Replace with canvas-texture sprite labels | Text now renders via InstancedMesh attribute batches |
| `InstancedMesh.count` dynamic changes not picked up by WebGPU | Always render MAX_INSTANCES (48), hide unused via opacity=0 | Minor performance overhead (~2-5 unused slots typical) |
| Canvas texture resize triggers WebGPU `Texture copy range` errors | Use fixed canvas dimensions (256×48 for labels, 160×48 for damage) | Must allocate worst-case size upfront |
| Alpha-test (discard) required for correct transparency | Use `alphaTest = 0.5` in SpriteMaterial | Fragments at 50%+ alpha rendered, below discarded |

### Wave System (v1.19 — Multi-Wave Mega-Atlas)

#### Overview
Multi-wave system adds progressive difficulty to combat arena. Missions define wave cohorts instead of single enemy set. Each wave clears triggers camera advance + next wave spawn.

**Key fix (v1.19)**: Mega-atlas now built with ALL enemy templates from ALL waves in mission, preventing sprite-missing errors during wave transitions.

#### Wave Flow

```
Mission.waves[] = [
  { enemies: [...], hpMultiplier: 0.4 },  // Wave 0: weak many
  { enemies: [...], hpMultiplier: 0.5 },  // Wave 1: stronger many
  { enemies: [...], hpMultiplier: 1.0 }   // Wave 2: tough few
]
    ↓
MegaAtlasBuilder loads sprites for ALL wave enemies
    ↓
CombatFightController detects 'wave-cleared' event
    ↓
Camera lerp X by ~15 units (1s transition)
    ↓
WaveManager.next() → engine.addEnemies(wave[n])
    (Sprites already in atlas, no stalls)
    ↓
Repeat until final wave cleared
    ↓
checkVictoryCondition() → combat result
```

#### Wave Manager (New Class)

```typescript
class WaveManager {
  current: number              // Current wave index
  definitions: WaveDefinition[] // Mission wave list
  
  next()                       // Advance to next wave
  isFinished(): boolean        // All waves cleared
  getCurrentWave()             // Return current wave def
}

interface WaveDefinition {
  enemies: string[]            // Enemy template IDs
  hpMultiplier: number         // 0.3-1.5 range
}
```

#### Enemy HP Tuning

- **Weak enemies** (hpMultiplier 0.3-0.4): 2-3 hits to kill, swarm-based waves
- **Normal enemies** (hpMultiplier 0.8-1.0): 5-8 hits to kill, mixed composition
- **Boss waves** (hpMultiplier 1.5): Elite 1-shot targets, 2-4 weak adds

#### Arena Bounds Expansion

Wave progression scrolls arena left-to-right:
- **Wave 0**: X ∈ [-30, 0]
- **Wave 1**: X ∈ [-15, 15]
- **Wave 2**: X ∈ [0, 30]

Camera follow keeps ally centroid in view while respecting wave zone.

#### Z-Axis Lane Movement

Beat-em-up depth controlled by lane constants:
- **Back lane**: Z = -2 (far from camera)
- **Mid lane**: Z = 0 (center)
- **Front lane**: Z = +2 (close to camera)

Formation slots pinned to lanes. AI targets nearby same-lane enemies (reduces diagonal beeline).

#### Tile Grid Floor

Instanced mesh system for arena ground:
- **Primary tiles** (~80%): Dominant terrain (grass, stone, ice)
- **Accent tiles** (~20%): Variation detail (cork, moss, cracks)
- **Elevation**: ±0.05u variation per tile for terrain feel
- **Performance**: 2 draw calls (InstancedMesh per type), 60×6 tile grid

#### Depth-of-Field Blur

Post-processing effect for HD-2D signature look:
- **Focal point**: Entity centroid (allies + enemies average)
- **Foreground blur**: High Z objects heavily blurred
- **Background blur**: Low Z objects lightly blurred
- **Tuning**: Leva debug controls (focalLength, bokehScale)

#### Camera Redesign (35° Angle)

Shifted from isometric (20°) to beat-em-up sidescroller:
- **Position**: [0, 8.4, 12] (was [0, 3.6, 10])
- **Zoom**: 80 (was 114)
- **Parallax**: Background Y offsets raised for 35° angle

#### Backward Compatibility

- Missions without `waves` field default to single-wave mode (all enemies at once)
- Existing formation positions preserved for non-wave combat
- Post-processing additive (new DoF layers on top of existing vignette)

## Camera Navigation System (v1.15 — Facility Rooms)

### Overview

The camera navigation system enables smooth animated transitions between the guild hall and 4 facility rooms positioned behind the main hall. Players click "Enter Room" in FacilitiesPanel to trigger camera animation; a home button (🏠) returns to the guild hall.

### Architecture

```
Zustand Store (CameraSlice)
    │
    ├─ cameraTarget: [x, y, z]           Default: GUILD_HALL_CAMERA_TARGET [5, 0, 3.5]
    ├─ setCameraTarget(target)            Updates target, triggers animation
    └─ resetCameraToGuildHall()           Convenience method to return home

    ↓ Consumed by

CameraController (React Three Fiber)
    │
    ├─ Reads cameraTarget from store
    ├─ Computes goal vectors (offset by CAM_OFFSET_X/Y/Z = [10, 10, 10.5])
    ├─ useFrame(): Lerps camera + OrbitControls.target toward goals
    ├─ LERP_SPEED = 0.08 (8% per frame, ~500ms smooth transition)
    └─ Stops lerping when within ARRIVE_THRESHOLD (0.01 units)

    ↓ Controlled by

FacilitiesPanel UI
    │
    └─ "Enter Room" button → setCameraTarget(roomCenter) + onClose()

FacilityRoomsLayer (3D Scene)
    │
    └─ Renders 4 placeholder 7×7 rooms positioned at facility roomCenter coords
       (Tavern x=-10, Training x=-3, Infirmary x=3, Workshop x=10; all z < 0)
```

### Camera Target Coordinates

| Location | Coordinates | Notes |
|----------|-------------|-------|
| Guild Hall | [5, 0, 3.5] | Default spawn point |
| Tavern | [-10, 0, -5] | Warmth/gathering |
| Training Yard | [-3, 0, -8] | Combat focus |
| Infirmary | [3, 0, -7] | Healing sanctuary |
| Workshop | [10, 0, -4] | Crafting space |

Offset formula: `cameraPosition = cameraTarget + [CAM_OFFSET_X, CAM_OFFSET_Y, CAM_OFFSET_Z]`

### Animation Details

- **Lerp Speed**: 0.08 per frame (~60fps) = ~500ms for full transition
- **Threshold**: 0.01 units (demand frameloop stops once arrived)
- **Build Mode**: Pan disabled during build mode (zoom/scroll still work)
- **OrbitControls**: Rotation disabled (isometric view only)

### Room Rendering

Each facility room (`FacilityRoom` component):
- **Dimensions**: 7×7 units, 3 units tall
- **Walls**: Back, left, right semi-transparent; front wall 40% opaque
- **Floor**: Tinted per facility type (tavern dark brown, training grey, etc.)
- **Label**: HTML label showing facility name + level

### File Structure

```
src/game/state/
  ├─ camera-slice.ts          CameraSlice: state + actions
  └─ store.ts                 Integrates CameraSlice into GameStore

src/scene/
  ├─ camera-controller.tsx    CameraController: animation loop
  ├─ facility-rooms-layer.tsx FacilityRoomsLayer: orchestrator
  ├─ facility-room.tsx        FacilityRoom: single 7×7 room rendering
  └─ world.tsx                Canvas setup, includes FacilityRoomsLayer + CameraController

src/ui/panels/
  └─ facilities-panel.tsx     "Enter Room" button → setCameraTarget()
```

### State Persistence

Camera target is **not** persisted — always defaults to guild hall on load. This prevents players loading into isolated facility views.

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

## Data Flow: Build Mode (Tile-Based Refactor v1.10)

### Overview

Build Mode refactored from room-based to tile-based architecture. GuildHall now has:
- **floorTiles: FloorTile[]** — Individual colored tiles (5g each, click-to-paint mode)
- **furniture: PlacedFurniture[]** — Flat guild-level array (validated against floor tiles + guild level unlocks)

Build Menu has 2 tabs:
1. **Floor Tab** — Color palette (paint/erase floor tiles)
2. **Furniture Tab** — All furniture with guild level gating

```
[Player clicks Build Mode toggle]
    ↓
toggleBuildMode(true) → isBuildMode = true, grid visible, members hidden
    ↓
Build Menu: Floor Tab selected (default)
    ↓
[Player selects color + enters paint mode]
    ↓
startFloorTilePlacement(color)
  → activeItem = { type: 'floor-tile', color }
    ↓
[Mouse over grid → shows preview cell]
    ↓
[Click cell to paint tile (5g per tile)]
  → placeFloorTile(x, z, color) validates + deducts gold
  → Adds to floorTiles[] array
    ↓
OR [Player clicks erase mode]
    ↓
startErasePlacement()
  → activeItem = { type: 'erase-tile' }
    ↓
[Click tile to erase (blocked if furniture occupies)]
  → eraseFloorTile(x, z) checks furniture coverage
  → Removes from floorTiles[] if clear
    ↓
OR [Player clicks Build Menu > Furniture tab]
    ↓
[Shows all furniture with guild level unlock badges]
    ↓
[Click furniture type to select (if unlocked)]
    ↓
startFurniturePlacement(furnitureType)
  → activeItem = { type: 'furniture', furnitureType, rotation: 0 }
    ↓
[BuildOverlay renders ghost preview — 1x1 box with rotation guides]
    ↓
Mouse Position: Raycasted from 3D → snapped to grid cell
    ↓
Validation:
  1. Cell has floor tile underneath (mandatory)
  2. Furniture type unlocked at current guild level
  3. No furniture overlap at target position
  4. Cost check (gold + items)
    ↓
Ghost renders green (valid) or red (invalid)
    ↓
[Click to place | R to rotate | Esc to cancel]
    ↓
If valid click:
  → placeFurniture(type, pos, rotation) creates PlacedFurniture
  → Spends gold + items, adds to guild.furniture[] (flat)
  → activeItem = null
    ↓
If cancel: → activeItem = null
```

### Floor Tile System (NEW)

```
FloorTile = { x: number, z: number, color: string }

placeFloorTile(x, z, color):
  1. Check gold >= 5g (FLOOR_TILE_COST)
  2. Check tile not already occupied
  3. If valid: deduct 5g, add tile to floorTiles[]
  4. Return success

eraseFloorTile(x, z):
  1. Find tile at (x, z)
  2. Check no furniture occupies this cell
     → canEraseCell(x, z) validates
  3. If clear: remove from floorTiles[]
  4. Return success

canEraseCell(x, z):
  → Checks furniture[] array for any piece occupying (x, z)
  → Returns true if cell clear (safe to erase)
```

### Furniture Placement & Validation (REFACTORED)

```
PlacedFurniture = {
  id: string,
  type: FurnitureType,
  level: number,
  position: { x, z },
  rotation: Rotation
}

placeFurniture(type, position, rotation):
  1. Check floor tile exists at position
  2. Check guild.level >= FurnitureDefinition.unlockedAtLevel
  3. Check guild furniture count < max guild limit
  4. Check resource cost (gold + items)
  5. If valid: create PlacedFurniture, add to guild.furniture[]
  6. Return success

canPlaceFurnitureOnFloor(position):
  1. Find floorTile at position in guild.floorTiles
  2. Return true if tile exists, false otherwise
  3. (Furniture must be placed on floor, not empty cells)

removeFurniture(furnitureId):
  → Removes by ID from guild.furniture[] (flat structure)
  → No room-specific lookups (guild-level array)
```

### Furniture Effects (RENAMED from room-effects.ts)

```
calcFurnitureBonuses(guild):
  → Renamed from calcRoomBonuses() in furniture-effects.ts
  → Iterates guild.furniture[] array (not rooms)
  → Each furniture type has passive + active effects
  → Example: quest-board increases mission reward by 10%
  → Example: tavern-counter shows tavern panel when placed
  → Returns aggregated { expBonus, goldBonus, statBonuses }
```

### Tutorial First-Build Step

```
Old: Check rooms.length > 1
New: Check floorTiles.length > 36 (6x6 grid fully painted)
  → Encourages player to paint floor before furniture
  → Unlocks furniture placement tutorial step
```

## Data Flow: Character Sprite Animation (NEW - v1.11)

### Sprite Path Resolution

```
Member (archetype, gender, civilization)
    ↓
getSpritePath(civ, archetype, gender):
  1. Look up CIV_SPRITE_PREFIX[civ] (LS=LinhSon, DQ=DeQuoc, TL=ThienLu)
  2. Build path: /sprites/characters/{PREFIX}-{ARCH}-{GENDER}
     → Example: /sprites/characters/LS-WARRIOR-M
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
├── LS-WARRIOR-M/           # LinhSon Warrior Male
│   └── animations/walking-8-frames/
│       ├── north/          # 8 walking frames facing north
│       ├── south/          # 8 walking frames facing south
│       ├── east/           # 8 walking frames facing east
│       └── west/           # 8 walking frames facing west
├── LS-WARRIOR-F/           # LinhSon Warrior Female
├── LS-SCOUT-M/             # LinhSon Scout Male
├── LS-SCOUT-F/             # LinhSon Scout Female
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

### Building Cost Integration (REFACTORED)

```
Floor Tile Costs:
  - Fixed cost: 5g per tile
  - No item costs (floor only)

Furniture Costs (from FurnitureDefinition):
  - cost: { gold: X, items: { WOOD: Y, ... } }
  - Validated against guild inventory + gold

placeFloorTile(x, z, color):
  1. Check gold >= 5 (FLOOR_TILE_COST)
  2. Check cell not occupied
  3. Deduct 5g, add tile to guild.floorTiles[]

placeFurniture(type, position, rotation):
  1. Validate floor tile exists at position
  2. Find FurnitureDefinition for type
  3. Check guild.level >= unlockedAtLevel
  4. Extract cost: { gold: X, items: { ... } }
  5. Check: playerGold >= cost.gold AND inventory sufficient
  6. If valid: deduct gold + items, add PlacedFurniture to guild.furniture[]
  7. Return success/reason
```

### Resource Bar HUD

```
ResourceBar component:
  1. Subscribe to guild.inventory changes
  2. Render: Wood (qty), Stone (qty), Iron Ore (qty)
  3. Display in top HUD next to gold total
  4. Update on every inventory change (loot earned, building cost)
```

## Guild Inventory System (NEW - v1.20 Milestone 16)

### Overview

Guild inventory provides a visual UI for viewing and managing items collected from missions, looted from combat, or used for building costs. Implements a slot-based system with capacity management via storage furniture and support for stackable items.

### Inventory Capacity Model

```
Capacity = Base Slots + Storage Furniture

Base Slots: 10 (always available)

Storage Chest Furniture:
  - Cost: 200g + 15 Wood + 5 Iron Ore
  - Category: 'upgrade'
  - Size: 1×1 footprint
  - Effect: +20 inventory slots per chest
  - Max per guild: 3 (max capacity = 10 + 60 = 70 slots)
  - Unlocked: Guild level 2

getMaxSlots() = 10 + (20 × chestCount)

getUsedSlots() = Σ ceil(quantity / STACK_LIMIT) for each item > 0
  (stackable items split into multiple slots at 99/stack)
  (non-stackable items: 1 slot each)

isInventoryFull() = getUsedSlots() >= getMaxSlots()
```

### Stack Limit & Item Categories

```
STACK_LIMIT = 99 per visual slot

Stackable Items (most materials):
  - WOOD, STONE, IRON_ORE, SLIME_GEL, BOAR_PELT, WOLF_FANG, etc.
  - 150 wood → 2 visual slots (99 + 51)
  - Consolidated in flat dict: { items: { WOOD: 150 } }

Non-Stackable Items:
  - LOGGING_SITE_ACCESS permit
  - 1 slot per item regardless of quantity
  - Consumable flag preserved in ItemTemplate.stackable

addItem(itemId, quantity, capacity):
  1. Calculate slots required: ceil(qty / STACK_LIMIT) if stackable
  2. Check if new slots + used slots <= maxSlots
  3. If fits: add to inventory, return true
  4. Else: reject, return false

Facility Production:
  - Production always succeeds (no item loss)
  - Capacity check not applied to auto-production
  - Only manual actions (build, buy) respect capacity
```

### Inventory Panel UI Architecture

```
InventoryPanel (overlay, centered)
    ├─ Header: "Guild Inventory" title + close button
    ├─ Capacity bar: "12/30 slots"
    ├─ Grid: 5 columns × N rows, 64px cells, 4px gap
    │   └─ InventorySlot[] (empty or occupied)
    │       ├─ Empty: dashed gold border
    │       ├─ Occupied: solid border + GameIcon + qty badge (bottom-right)
    │       ├─ Rarity color tint (left border):
    │       │   - COMMON: no tint
    │       │   - UNCOMMON: green
    │       │   - RARE: blue
    │       │   - EPIC: purple
    │       │   - LEGENDARY: gold
    │       └─ States: normal, hovered (glow), selected (gold)
    │
    └─ ItemDetailPopup (when slot selected)
        ├─ Icon + name (large)
        ├─ Type + rarity badge (color-coded)
        ├─ Description (italic)
        ├─ Quantity + sell value
        └─ Click outside or same slot → close

Backdrop: Full-screen overlay, 50% opacity dark
Theme: Chest-like appearance
  - Dark wood background (#1e140a)
  - Brown border (#8B4513)
  - Gold accents (#ffd700)
  - 4 corner studs (CSS box-shadow pseudo-elements)
  - Wood-grain texture effect
```

### HUD Integration

```
HUD Top Bar (left side, after ResourceBar):
    ├─ Inventory Button: backpack icon
    └─ Click → toggleInventoryPanel()

Panel Visibility:
    - Tracked in React state (separate from PanelId sidebar system)
    - Click backdrop or X button → close
    - Escape key → close
    - Persists panel state during session (not saved)
```

### Data Layer Implementation

Files modified:
- `src/game/data/items.ts` — Added `stackable: boolean` to ItemTemplate, `STACK_LIMIT = 99`
- `src/game/state/game-state.ts` — Added 'storage-chest' to FurnitureType union
- `src/game/data/furniture.ts` — Storage chest furniture definition
- `src/game/data/buildings.ts` — Unlocked storage-chest at guild level 2
- `src/game/state/inventory-slice.ts` — Capacity helpers + slot layout computation

Inventory slice API:
```typescript
getMaxSlots(guildHall): number
  // 10 + (20 × storage-chest count)

getUsedSlots(inventory: InventoryState): number
  // Σ ceil(qty / 99) per item

isInventoryFull(inventory, guildHall): boolean
  // getUsedSlots >= getMaxSlots

getInventorySlots(inventory): { itemId: ItemID; quantity: number }[]
  // Array of slots, split stacks > 99
  // Sorted by type, then rarity

addItem(itemId, quantity, guildHall): boolean
  // Checks capacity before adding; returns success/fail
  // Facility production bypasses this check

consumeItems(items: ItemQuantityMap): { success: boolean; reason? }
  // Validates & deducts items atomically
  // Cleanup: removes zero-quantity entries
```

### Component Files

- `src/ui/panels/inventory-panel.tsx` — Main panel, grid + header, slot rendering
- `src/ui/components/inventory-slot.tsx` — Single slot (empty/occupied/selected states)
- `src/ui/components/item-detail-popup.tsx` — Detail card (name, rarity, description, sell value)
- `src/ui/styles/inventory.css` — Chest theme, grid layout, animations, rarity colors

### Save Compatibility

- **No migration required**: Inventory remains flat dict at Zustand level
- **Presentation only**: Capacity + slot visualization computed at runtime
- **Existing saves**: Load immediately without data model changes
- **Facility production**: Unaffected by capacity system

### Code Quality Improvements

- `useMemo` for expensive slot computation (prevents re-layout thrashing)
- Defensive cap on non-stackable slot expansion (prevents infinite loops)
- `selectedItemId` index tracking (prevents stale detail popup on inventory changes)
- Zero-quantity cleanup in `consumeItems` (saves bandwidth on serialization)

---

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
| `facility-zone-layer.tsx` | Master layer rendering all 4 facility zones: floor markers, level-gated props, assigned member sprites — NEW v1.12.1 |
| `zone-floor-marker.tsx` | Colored semi-transparent plane mesh indicating zone footprint (locked/active color logic) — NEW v1.12.1 |
| `zone-props.tsx` | Level-gated GLB furniture models with auto-scaling + ambient point lights — NEW v1.12.1 |
| `zone-member-sprites.tsx` | Static 2×2 grid member sprite rendering with fallback gender/archetype — NEW v1.12.1 |
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
| `facility-zone-slice.ts` | Zone interaction state: pendingFacilityPanel (trigger to open panel), focusFacilityType (scroll target in panel) — NEW v1.12.1 |

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

## Logging-Site Finite Harvest System (v1.18)

### Overview

The logging site combines a finite-resource management system with an occupational skill (woodcutting) to create meaningful long-term progression. Players unlock logging sites via permits, assign members, watch them gain skills, and manage resource depletion over time.

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Game Tick (1s heartbeat from Web Worker)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ processLoggingSiteTick() (pure function)                     │
│ ├─ For each logging site:                                   │
│ │  ├─ For each assigned member:                             │
│ │  │  ├─ Calculate woodPerTick = baseRate × (STR×0.5 +     │
│ │  │  │                          END×0.3 + DEX×0.2) / 100 × │
│ │  │  │                          (1 + wcSkillBonus%)        │
│ │  │  ├─ Clamp to remaining reserve                         │
│ │  │  ├─ Update member.craftSkills.woodcutting.xpAccumulated│
│ │  │  └─ Check level threshold → auto-advance level         │
│ │  └─ Accumulate woodProduced across members                │
│ │  └─ Deduct from facility.woodReserve                      │
│ │  └─ Check depletion (reserve ≤ 0):                        │
│ │     ├─ Auto-unassign all members                          │
│ │     └─ Set facility.depletedAt timestamp                  │
│ └─ Return { memberId → (woodGained, xpGained) }             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ applyLoggingProduction (Zustand action)                     │
│ ├─ Apply XP gains to member craftSkills                     │
│ ├─ Add WOOD items to inventory                              │
│ └─ Update facility.woodReserve in store                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ UI Updates (facility-card.tsx, zone-floor-marker.tsx)       │
│ ├─ WoodReserveBar reflects current %                        │
│ ├─ Color tint: green/amber/red/grey by state               │
│ └─ Floating zone card displays rate + remaining wood        │
└─────────────────────────────────────────────────────────────┘
```

### Woodcutting Skill Progression

**Levels & Thresholds:**
- 11 levels (0–10)
- XP thresholds: [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 7500, 11000]
- Bonus multipliers: [0%, 10%, 22%, 38%, 58%, 80%, 105%, 133%, 165%, 200%, 240%]

**Auto-Leveling Logic:**
- Each tick: Compare member's `xpAccumulated` against threshold table
- On threshold cross: Auto-increment `level`, reset `xpAccumulated = 0`
- No player action required (passive skill progression)

**Persistence:**
- Stored as `member.craftSkills.woodcutting: { level, xpAccumulated }`
- Save migration v13→v14 seeds all members with `{ level: 0, xpAccumulated: 0 }`

### Reserve Depletion Mechanics

**Production Formula:**

```
woodPerTick = baseRate × baseScore / 100 × (1 + wcSkillBonus%)

where:
  baseRate = 0.0114 (LOGGING_SITE_CONFIG constant)
  baseScore = (STR × 0.5) + (END × 0.3) + (DEX × 0.2)
  wcSkillBonus% = wcSkillBonusPct[member.craftSkills.woodcutting.level]
```

**Stacking Behavior:**
- Multiple assigned members produce simultaneously
- Per-tick wood sums across all members
- Clamped to remaining reserve (prevents negatives)
- Depletion check runs after accumulation

**Depletion State Machine:**

```
┌──────────────────────┐
│ Active (>25% reserve)│ ← Green tile, normal production
└──────────────────────┘
            ↓
┌──────────────────────────────────┐
│ Warning (10–25% reserve)         │ ← Amber tile, "⚠ Running Low"
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│ Critical (<10% reserve)          │ ← Red tile, "🔴 Almost Depleted"
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│ Depleted (reserve = 0)           │ ← Grey tile, auto-unassign members
└──────────────────────────────────┘
```

**ETA Calculation:**
- `eta = remainingWood / (woodPerTickTotal + 1)`
- Displayed as "~X hours remaining" in warning/critical states

### Permit-Based Unlock System

**Permit Acquisition:**
1. Tutorial quest "Into the Clearing" → 1 guaranteed permit on completion
2. Forest area quests (5 missions) → 15% conditional drop chance per completion

**Build Mechanics:**
- Logging site added to build menu as permit-gated entry
- Build menu shows "Requires: Logging Permit (N/1)"
- On build confirmation: `consumeLoggingPermit()` decrements permit quantity
- Facility placed with `woodReserve: 1000` (full)

**No Gold Cost:**
- Unlike other facilities, logging site costs 0 gold (permit-only)
- Permit is consumable item (stackable, limited supply)

### 3D Zone Props & Animation

**Facility Room Scene:**
- **ground**: Bright green floor (#3d6b2a) with warm sunlight
- **props**: 3 large trees, 3 pine trees, 1 stump, 1 fallen log (GLB assets)
- **members**: Up to 4 assigned members rendered at fixed chop spots via RoomMemberSprites

**WoodcuttingAnimator Component:**
- **Input**: Member data + slot index (0–3)
- **Animation**: 8-frame east-facing woodcutting sprite loop (8fps)
- **Frame Atlas**: `/sprites/characters/{CIV}-woodcutter-male/animations/woodcutting-8-frames/east/frame_NNN.png`
- **Fallback**: Uses idle sprite if woodcutting frames unavailable

**Zone Floor Tinting:**
- **Reserve %**: Calculated as `currentReserve / 1000`
- **Tint Color**: Applied to zone-floor-marker mesh based on state
  - Green: >25% reserve (#4CAF50)
  - Amber: 10–25% reserve (#FFC107)
  - Red: <10% reserve (#F44336)
  - Grey: 0% reserve (#9E9E9E)

**Floating Zone Card:**
- HTML overlay (via `<Html>` in R3F) pinned to top-left of facility room
- Shows: Wood reserve bar + current wood/tick production rate
- Updates every tick with live reserve data

### Save Migration v13 → v14

**Schema Changes:**
- Member: Added `craftSkills?: { woodcutting: { level, xpAccumulated } }`
- GuildFacility: Added `woodReserve?: number | null`

**Migration Logic:**

```typescript
migrateV13toV14(save: SaveData): SaveData {
  // All members get woodcutting skill
  save.roster.forEach(member => {
    member.craftSkills ??= {
      woodcutting: { level: 0, xpAccumulated: 0 }
    };
  });

  // Logging sites get full reserve; others get null
  save.guild.facilities.forEach(facility => {
    if (facility.type === 'LOGGING_SITE' && facility.level > 0) {
      facility.woodReserve = 1000;
    } else {
      facility.woodReserve = null;
    }
  });

  return save;
}
```

**Backward Compat:**
- Old saves auto-migrate on load (transparent)
- Woodcutting skill starts at level 0 (no loss of progression data)
- Non-logging facilities unaffected (woodReserve: null)

## Woodcutting Skill Animation System (v1.18)

### Animation Convention

**Directory Structure:**
```
public/sprites/characters/
├── TS-woodcutter-male/
│   └── animations/
│       └── woodcutting-8-frames/
│           ├── east/
│           │   ├── frame_000.png
│           │   ├── frame_001.png
│           │   ...
│           │   └── frame_007.png
│           ├── north/
│           ├── south/
│           └── west/
├── DQ-woodcutter-male/
├── TL-woodcutter-male/
└── ...
```

**Naming Convention:**
- Prefix: Civilization code (TS, DQ, TL) + archetype prefix
- Type: `woodcutter` (occupational animator)
- Gender: `male` / `female`
- Frames: 8-frame sequence per direction (1-indexed: frame_000 to frame_007)
- FPS: 8fps playback (125ms per frame)

### WoodcuttingAnimator Component

**Props:**
```typescript
{
  member: Member,           // For civilization/gender lookup
  slotIndex: number,        // Position in facility room (0–3)
  isAnimating: boolean,     // Controls playback
}
```

**Behavior:**
- Reads `member.civilization` + `member.gender` to resolve sprite path
- Defaults to east direction (member facing east while chopping)
- Loops 8 frames at 8fps (125ms per frame)
- Falls back to idle SpriteAnimator if woodcutting frames unavailable

**Integration:**
- Embedded in `room-member-sprites.tsx`
- Slot 0: WoodcuttingAnimator (working member)
- Slots 1–3: Idle SpriteAnimator (other members loitering)

### Asset Pipeline

**Generation (One-Time Setup):**
- PixelLab or manual asset creation generates 8-frame woodcutting sequences per civilization
- All directional variants (east, north, south, west) created
- Uploaded to `public/sprites/characters/{CIV}-woodcutter-male/animations/woodcutting-8-frames/{direction}/`

**Loading & Caching:**
- CanvasTexture atlas created on first render (same approach as SpriteAnimator)
- Atlas cached in component state (no repeated canvas creation)
- Fallback to idle sprite if any frame fails to load

## Browser Compatibility

- **IndexedDB**: IE10+, all modern browsers

- **IndexedDB**: IE10+, all modern browsers
- **Web Workers**: IE10+
- **localStorage**: All browsers
- **React 19**: Modern browsers (ES2020+)

## Companion Tools & Editors

### Overview

Separate Vite-based tools to support game development and asset management:

| Tool | Port | Purpose | Status |
|------|------|---------|--------|
| **map-playground** | 5175 | Arena map editor (WC-MAPMAKER) | ✅ Complete (Phases 1–10) |

### Map Playground (WC-MAPMAKER Phases 1–10 COMPLETE)

**Purpose**: Visual combat arena map editor. Replaces manual number-tweaking in arena-biome-config.ts with click-to-place workflow. Generates TypeScript BiomeConfig for copy-paste into main game.

**Status**: Production-ready. Full asset editor with code generator.

**Full Documentation**: See `docs/map-playground-guide.md`

**Quick Features**:
- R3F orthogonal viewport with raycaster click-to-place
- Asset browser (3D props, backgrounds, VFX effects)
- Properties panel (position, scale, rotation sliders with live preview)
- Code generator → BiomeConfig TypeScript export → clipboard
- Undo/Redo (Ctrl+Z/Y), delete, duplicate (Ctrl+D)
- Scene objects list, code preview panel
- Leva debug panel (reactive lighting controls)

**Dev Server**:
- **Port 5175** (separate from main game)
- Custom Vite plugin:
  - `/api/asset-manifest` — Asset listing
  - `/game-assets/*` — Game assets from public/ folder

**Getting Started**:
```bash
npm run map    # Dev server on http://localhost:5175
```

## Testing Coverage

- **Save validation**: Unit tests for type guards, migrations
- **Save/load cycle**: Integration tests for full lifecycle
- **Slot management**: Tests for CRUD operations
- **Status updates**: Component tests for HUD badge
