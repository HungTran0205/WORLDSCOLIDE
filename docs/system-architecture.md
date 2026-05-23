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
│  │  │ (Quest board: unified split-pane + mobile swap)  │ │  │
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

**[v1.20+] Sequential Turn Queue**: Replaced parallel ATB with strict sequential turn execution. Entities claim a turn lock (`activeActorId`) based on lowest `nextAttackAt`, complete full action cycle (melee: step-forward → attack → return-to-home; ranged: fire → anim-revert), then release lock to next entity. Status effects (poison, regen, passives) still tick every logic tick for all entities. Manual mode preserves existing pause behavior.

For detailed implementation, see:
- `codebase-summary.md` → "v1.10–v1.15 Releases Summary"
- Git commits v1.11–v1.14
- Combat system tests in `src/game/systems/*.test.ts`
- Sequential turn queue plan: `plans/260419-1147-combat-sequential-turn-engine/`

---

## Combat Stage Specification (v1.28+ — Platformer Layout Foundation)

**Status**: Phases 01–06 complete (phases 07+ deferred). Full authoring guide: [`combat-stage-spec.md`](./combat-stage-spec.md).

Typed DSL decouples stage design from hardcoded global positions. Stages own platform geometry, spawn anchors, decals, and background references. Supports multi-tier side-scroller layouts with optional Y-axis spatial elevation.

### Architecture Layers

**Data layer** (`src/scene/combat/maps/`):
- `stage-spec-types.ts` — 6 type interfaces (BgLayer, DecalPlacement, DecalDensitySpec, PlatformSpec, SpawnSlot, CombatStageSpec)
- `stages/{stage-id}.ts` — pure data specs (examples: lolo-village-outskirt, broken-cliff-outskirt, the-forest)
- `stage-formation-positions.ts` — helpers: `getStageSpec(mapId)`, `getStageSpawnPosition(spec, slotIndex, side)`
- `combat-map-registry.ts` — registry: `STAGE_SPECS` map + `getStageSpec()` resolver

**Render layer** (phases 04+):
- `<StageRenderHost spec>` — single dispatch point for all stages (replaces pre-refactor per-stage hardcoded JSX)
- `<CombatSceneShell>` — shell with render slots (background, ground, foreground)
- `<CombatPlatform platformSpec>` — per-platform renderer (`<TiledFloor>` + `<SideWall>` + `<FloorDecal>` scatter)

### Phases Progress

| Phase | Status | Scope |
|-------|--------|-------|
| 01 | ✅ | Decal palette curation (FloorDecal component + asset split) |
| 02 | ✅ | Tile palette reduction (50+ variants → 3–5 base + decal overlays) |
| 03 | ✅ | Stage spec DSL (types + data, dormant) |
| 04 | ✅ | Platform + SideWall + DecalScatter render components |
| 05 | ✅ | Engine spatial-Y + spawn anchor reading (FORMATION_POSITIONS deprecated) |
| 06 | ✅ | Multi-platform demo (broken-cliff-outskirt: allies y=0, enemies y=1.5) |
| 07 | 🔄 | Cleanup + docs sync (current — this task) |

**v1.28 Completion**: Tile palette flattened, stage layout spec-driven, spatial-Y enabled, broken-cliff-outskirt demo live. Engine now reads `spawnAnchors` from spec; `FORMATION_POSITIONS` deprecated but preserved for legacy non-spec code paths.

### Key Concepts

**Platform elevation** (y-axis):
- `PlatformSpec.position: [x, y, z]` — center of platform top surface
- Spawn anchors inherit Y from platform (e.g., upper-cliff at y=1.5 spawns allies/enemies there)
- Raised platforms expose `sideTile` (vertical wall face) with `sideHeight` (defaults to position.y)
- Sprites, shadows, AOE telegraphs all read entity.position.y for vertical offset

**Decal strategy**:
- **Manual** (`DecalPlacement[]`): exact world-coords for story moments (broken-edge accent, ritual circle center)
- **Scatter** (`DecalDensitySpec[]`): seed-driven per-cell probability for ambient grunge (grass tufts, moss, cracks)
- ❌ Avoid directional transition tiles (`grass-edge`) as random scatter — they appear striped

**Dead code removed**:
- `combat-arena-environment.tsx` — orphaned pre-D8 arena setup
- `combat-tile-grid.tsx` — orphaned flat-grid asset helper

### Render Flow Example

```
combat-scene.tsx resolves mapId
    ↓
getStageSpec(mapId) → CombatStageSpec
    ↓
<StageRenderHost spec={spec}>
    ↓
<CombatSceneShell> (4 render slots)
    ↓
For each platform in spec.platforms:
    <CombatPlatform platformSpec>
      ├─ <TiledFloor> (top surface)
      ├─ <SideWall> (if sideTile)
      └─ <FloorDecal>[] (manual + scatter)
    ↓
Engine spawns entities at getStageSpawnPosition(spec, slotIndex, side)
```

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

**Sprite-Sheet Loading** (`sprite-atlas.ts`, `sprite-sheet-manifest.ts`)
- Animation frames pre-packed: `scripts/pack-sprite-sheets.py` consolidates per-frame PNGs into sheet PNGs (one sheet per entity+animation, geometry auto-generated into manifest)
- Runtime: `buildAtlasFromSheet()` loads ONE sheet PNG and extracts UV coords per direction+frame via manifest geometry (cols, rows, dirRows[], frameCounts)
- Direction row resolved via `dirRows.indexOf(dir)` (no hardcoded maps); per-instance UV offset independent across different character sprites (shared three.js Texture, cloned per AnimationState)
- All world-layer animators (guild-hall-sprite-animator, working-animator, woodcutting-animator) load sheets via manifest
- Combat animators also use sheets; combat-mask-composite-atlas slices body frames from the sheet to composite masks at runtime

**MegaAtlasBuilder** (`mega-atlas-builder.ts`)
- ⚠️ **Legacy path (combat-only)**: Still pre-builds single mega-atlas for combat with ALL enemy spriteIds from ALL mission waves
- Loads sheet PNGs (not individual frames) for each enemy template + all allies
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

**CombatMaskOverlay** (`combat-mask-overlay.tsx`)
- Per-ally identity mask sprite (R3F plane inside Billboard) using deterministic mask from pool; tracks animation state with per-state offset table and frame lerp

**CombatVfxSpawner** (`combat-vfx-spawner.tsx`)
- VFX layer for combat effects (particle emitters, visual polish)

---

## Asset Path Resolution (Subpath Deployment Support)

**Critical for itch.io subpath deploys**: All public-asset loaders (GLB models, textures, audio, sprites) MUST wrap paths via `assetUrl()` utility.

| Path Type | Example | Wrapped | Issue | Solution |
|-----------|---------|---------|-------|----------|
| Root-absolute (`/models/...`) | `/models/tavern.glb` | `assetUrl('/models/tavern.glb')` | 403 on itch subpath (served from `hungtran0205/2000sac`, not domain root) | Always use `assetUrl()` |
| Relative | `sprites/avatar.png` | (OK as-is) | Works with current vite asset resolve | OK |
| Imported modules | `import deco from '@/assets/deco.png'` | (OK as-is) | Vite handles at build time | OK |

**Implementation**: `assetUrl(path)` in `src/lib/asset-url.ts` prepends base path from `import.meta.env.BASE_URL` (set by vite to deployment root).

**Coverage**: ~60 call sites across 29 files (drei useGLTF, useTexture, GLTFLoader, TextureLoader, AudioListener, preload for title flags, tavern decorations, all VFX/wall/floor textures). Note: `THREE.DefaultLoadingManager.setURLModifier` in `main.tsx` does NOT reliably intercept drei useGLTF hooks — per-site wrapping is the reliable fix.

---

### Combat Lifecycle (Phase 3+ Redesign)

#### 1. Entry: Mission Arrival (processMissionTick)
```
Mission reaches "arrived" phase
    ↓
Emit MissionTickEvent { type: 'arrival', ... }
    ↓
ActiveMissionsList shows ArrivalModal (lightweight, no scene change):
  - Enemy count + level preview
  - "Enter Battle" button
  - "Close" button
    ↓
Player clicks "Enter Battle"
    ↓
openCombatPanel(missionId)
  → useCombatPanelStore.isOpen = true
  → phase = 'formation'
  → **IMPORTANT**: mission.phase NOT yet changed to 'in-combat'
  → ArrivalModal closes
```

**Key Difference (Phase 3)**: No scene change. Single Canvas + group toggle (D8):
- `world.tsx <group visible={!isCombatOpen}>` hides guild hall, facilities, post-processing
- `world.tsx <group visible={isCombatOpen}>` shows combat overlay (solid black D9 backdrop)
- `OrthographicCamera` switches to combat camera via `makeDefault={isCombatOpen}`
- `CameraController` unmounts during combat to avoid lerping

#### 2. Prep: Formation Setup (combat-panel-formation.tsx)
```
Combat panel opens in 'formation' phase
    ↓
Show 2×3 grid of formation slots
    ↓
Player assigns members to slots (1-6 members selected)
    ↓
Target priority toggle: Focus (single target) or Balance (distribute)
    ↓
Real-time stats preview (total HP, DPS, avg range)
    ↓
Click "Start Battle"
    ↓
**ONLY NOW**: setPhase('battle') + updateMissionPhase(missionId, 'in-combat')
startBattle()
  → engine.init(selectedMembers, formation, enemyTemplates)
  → combatPanelStore.phase = 'battle'
  → gameTickLoop paused
  → useFrame loop starts continuous engine.tick()
```

#### 3. Combat: Real-Time Fighting (combat-panel-battle.tsx — Phase 4 stub)
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

#### 4. Result: Outcome & Rewards (combat-panel-result.tsx)
```
Combat finishes
    ↓
arenaResult = { outcome, goldEarned, expPerMember, survivors, injured }
combatPanelStore.setResult(result)
  → phase = 'result'
    ↓
Show panel with:
  - Victory/Defeat banner
  - Gold earned (luck-scaled)
  - EXP per survivor (rank-modified)
  - Injury list (recovery time)
  - Loot summary
    ↓
Player clicks "Return to Guild Hall"
    ↓
closeCombatPanel()
  → isOpen = false
  → phase = null
  → applyArenaRewards() via arena-result-handler
  → Add gold to guild.gold
  → Add EXP to survivors
  → Mark injured members with recovery timer
  → completeMission(missionId)
  → gameScene = 'guild-hall'
  → gameTickLoop resumes
```

#### 5. Skip Button & Snapshot Simulator (Phase 6)

**Skip Button (D11: Snapshot + Simulate)**
```
Player clicks "Skip" during battle phase
    ↓
DOM button dispatches COMBAT_SKIP_DOM_EVENT (window event)
    ↓
combat-fight-controller listens and:
  1. cloneCombatEntity() — Deep-clone all live entities
     (HP, dead-flag, status effects, cooldowns preserved)
  2. Snapshot timestamp = engine.elapsedMs
  3. Rebase timestamps relative to snapshot (ensures effect duration continuity)
  4. Pass cloned state to simulateCombatFromSnapshot()
    ↓
simulateCombatFromSnapshot() runs to completion:
  - Re-target selection: random-alive per entity (simplified, no targeting priority)
  - Loop until victory/defeat
  - Return arenaResult (outcome, goldEarned, expPerMember, survivors, injured)
    ↓
Result is identical whether outcome from skip or final tick of active battle
  → phase = 'result', apply rewards same as normal completion
```

**Mid-Fight Snapshot Persistence (D12)**
```
During battle phase, combat-fight-controller autosaves every 2s:
  1. saveCombatSnapshot() action dispatched
  2. Snapshot = { entityList, elapsedMs, timestamp }
  3. Stored in ActiveMission.combatSnapshot + combatSnapshotTime
    ↓
On browser close + relaunch:
  1. mission-tick.ts detects mission.phase === 'in-combat'
  2. Checks if mission.combatSnapshot exists
  3. If yes: Resume via simulateCombatFromSnapshot() (same path as Skip)
  4. If no: Fall back to simulate-from-scratch (backward compat)
    ↓
Result: Close-tab during 50% health → relaunch → resume at ~50% (not rerolled)
```

**Damage Balance Tuning (Phase 6)**

`combat-formulas.ts` adds `BASE_DAMAGE_MULTIPLIER = 1.2`:
```typescript
const calcAutoAttackDamage = (entity, target) => {
  const baseDamage = ...
  const scaled = baseDamage * BASE_DAMAGE_MULTIPLIER  // 1.2x
  return applyDefense(scaled, target.armor)
}
```
- Applied equally to allies and enemies
- No save migration (all in-progress battles replay with 1.2x)
- Additive tuning knob for balance adjustments

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

#### Spawn Slide Animation (v1.28 — Cosmetic Wave Entry Visual)

New-wave enemies (wave > 0) spawn off-screen and slide in from the right edge for visual polish:
- **Field**: `ArenaEntity.spawnSlideFromX?: number` (optional, cosmetic only)
- **Set by engine**: `CombatEngine.addEnemies()` calculates `spawnSlideFromX ≥ +14 + formation.x` (off-screen right edge)
- **Initial wave**: Wave 0 enemies + allies have `spawnSlideFromX` undefined (spawn in-place, no slide)
- **Renderer**: `combat-idle-sprite.tsx` initializes group X to `spawnSlideFromX ?? position.x`, lerps to `position.x` over 400ms
- **Logic unaffected**: Combat AI, turn locks, victory checks unchanged; field is renderer-only

#### Backward Compatibility

- Missions without `waves` field default to single-wave mode (all enemies at once)
- Existing formation positions preserved for non-wave combat
- Post-processing additive (new DoF layers on top of existing vignette)
- `spawnSlideFromX` optional; missions without it render enemies at `position.x` immediately

## Combat Formation Movement (Phase 1 — Positional Attacks)

### Formation Home Slots
Units occupy fixed **home slots** in the formation grid. Melee units (warriors, dual-blades, engineers) step forward to attack, while ranged units (scouts, scholars, philosophers) attack from home position.

**New Fields in ArenaEntity** (`combat-arena-types.ts`):
- `homeX`, `homeZ` — Formation grid position (set at combat start)
- `attackMoveState: AttackMoveState` — State machine: `'home' | 'step-forward' | 'returning'`
- `stepTargetX?`, `stepTargetZ?` — Where melee unit is stepping toward

**State Transitions**:
```
home ─(action ready)→ step-forward ─(after FORMATION_STEP_DURATION_MS)→ returning ─(arrive)→ home
```

**Timing Constants** (`combat-arena-types.ts`):
- `FORMATION_STEP_DISTANCE = 1.5` — World units forward
- `FORMATION_STEP_DURATION_MS = 250` — Forward lerp time
- `FORMATION_RETURN_DURATION_MS = 300` — Return-to-home lerp time

**AI Impact**:
- Melee units path to `stepTarget` when attacking
- Ranged units stay at `homeX, homeZ` (no stepping)
- Position updated via `AnimationStateBuffer` (GPU instancing)

---

## ATB Timeline Bar (Phase 2 — Attack Order Visualization)

### Timeline Display
New top-strip component showing all entities sorted by `nextAttackAt`. Updates at Zustand 5Hz sync rate.

**Component**: `combat-timeline-bar.tsx`
- Shows top 12 entities (max display)
- Each entry displays:
  - **Name abbreviation** (4 chars max, e.g., "Kael")
  - **Cooldown fill bar** (% of attackInterval elapsed)
  - **Waiting icon** (!) for manual-mode allies awaiting input
  - **Acting indicator** (step-forward state highlight)

**Styling** (`combat-timeline.css`):
- Ally entries: blue tint
- Boss entries: gold tint
- Enemy entries: red tint
- "Near ready" state (≥90% cooldown): bright glow
- "Waiting" state (manual mode): exclamation mark
- "Acting" state (step-forward): animation pulse

**Visibility**: Only shown during `arenaPhase === 'fighting'`.

**Performance**: `useMemo` caches sort, re-runs only when entities change (batched Zustand update).

---

## Manual Combat Mode (Phase 3 — Player Input Control)

### Overview
`combatMode: 'auto' | 'manual' | null` added to active mission state. Players toggle via **CombatManualToggle** button (top-right) to switch battle modes.

**Files Modified**:
- `game-state.ts` — combatMode field added to MissionState
- `mission-slice.ts` — toggleCombatMode(missionId) action
- `combat-engine.ts` — setManualMode(enabled) + queuing logic
- `combat-fight-controller.tsx` — Syncs combatMode to engine on change
- `game-screen.tsx` — CombatManualToggle button placement

### Manual Mode Mechanics

**When toggled ON**:
1. Allies switch to `waitingForInput = true` on their attack tick
2. Hotbar shows "waiting for input" glow on first ready ally
3. Engine waits for player action before ally attacks
4. Hotbar actions:
   - **Q key**: Fire basic auto-attack (first waiting ally)
   - **1-4 number keys**: Activate skills (if enough resources)
5. Target selection locked to manually-set target (default: closest enemy)

**When toggled OFF**:
1. Allies revert to `waitingForInput = false`
2. Normal auto-attack behavior resumes
3. Hotbar shows normal cooldown bars

**Waiting State Indicator**:
- Timeline entry: "!" icon badge
- Hotbar: Ally name + "Waiting…" glow (yellow border pulse)
- Member sprite: Optional visual feedback (anim state pending)

### Input Handling

**Combat Skill Hotbar** (`combat-skill-hotbar.tsx`):
- Listens for `'q'` key → `engine.fireBasicAttack()`
- Number keys 1-4 → Skill activation (already implemented)
- Prevents default (no QA in browser search)

**Engine Queuing** (`combat-engine.ts`):
```typescript
fireBasicAttack() {
  const waitingAlly = this.entities
    .filter(e => e.isAlly && e.waitingForInput)
    .sort((a, b) => a.nextAttackAt - b.nextAttackAt)[0];
  
  if (waitingAlly) {
    // Clear waitingForInput, enqueue attack
    waitingAlly.waitingForInput = false;
    this.enqueueAttack(waitingAlly);
  }
}
```

---

## Target Selection (Phase 4 — Manual Enemy Targeting)

### Overview
In manual mode, players click enemy entities in the 3D scene to lock target for waiting allies.

**Component**: `combat-target-selector.tsx` (new)
- Listens for mouse clicks on arena floor/entities
- R3F raycasting against enemy hitboxes
- Sets `manualTargetId` on entity

**Integration**:
- Engine respects `manualTargetId` when choosing attack target
- Fallback to auto-targeting (closest enemy) if manual target dies
- Visual feedback: Selected enemy outline/highlight (pending polish)

**Hitbox Setup**:
- Enemy sprites get invisible clickable meshes
- Raycast test: `raycaster.intersectObjects(enemyHitboxes)`

---

## Manual Mode Integration (Phase 5 — UI & State Sync)

### CombatManualToggle Button
Located in top-right of combat UI, near speed controls.

**Appearance**:
- Button text: "Manual" | "Auto" (toggles on click)
- Icon: Gamepad/hand cursor icon
- State-bound: Syncs to mission.combatMode

**Accessibility**:
- Keyboard shortcut: `Ctrl+M` (pending implementation)
- Tooltip: "Manual: Control each ally action | Auto: AI controls attacks"

### Hotbar Polish
`combat-skill-hotbar.tsx` enhancements:
- First waiting ally shown with yellow "Waiting…" glow
- Q key hint tooltip: "Press Q or click to attack"
- Skill buttons disabled if no manual target (optional)

### State Sync
`combat-fight-controller.tsx` watches `combatMode` from mission state:
```typescript
useEffect(() => {
  engineRef.current?.setManualMode(combatMode === 'manual');
}, [combatMode]);
```

Changes apply immediately on next engine tick.

### Save Persistence
`combatMode` saved in mission state — loaded from last session without explicit toggle.

---

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

## Equipment System (Phase 1 - v1.25)

### Overview

Equipment system introduces instance-based gear with flat stat bonuses. Members can equip up to 3 items (weapon, armor, headgear) that grant additive bonuses: weapons add flatDamage, armor/headgear add flatHp + flatDefense. Broken gear (durability=0) provides no bonus. Equipment inventory tracks unequipped items separately from standard inventory.

### Core Design

**Equipment Architecture:**
```
11 Static Templates (equipment-templates.ts)
    ├─ Weapons (5): WOODEN_AXE (dmg=10), WOODEN_CROSSBOW, STONE_SWORD (dmg=18), IRON_SWORD (dmg=30), IRON_SPEAR (dmg=28)
    ├─ Armor (3): CLOTH_VEST (hp=20, def=3), LEATHER_ARMOR (hp=40, def=7), IRON_ARMOR (hp=70, def=15)
    └─ Headgear (3): CLOTH_HOOD, LEATHER_HELMET, IRON_HELMET

Instance-Based Items (equipment-bonuses.ts)
    └─ EquipmentItem: { id: UUID, templateId, durability: number }

Member Equipment State (game-state.ts)
    └─ MemberEquipment: { weapon?, armor?, headgear? }
```

**Bonus Calculation:**
```typescript
calcGearBonuses(equipment): GearBonuses
  • Weapon (if durability > 0): +templateId.damage to flatDamage
  • Armor (if durability > 0): +hp, +defense to flatHp/flatDefense
  • Headgear (if durability > 0): +hp, +defense to flatHp/flatDefense
  • Returns: { flatDamage, flatHp, flatDefense }
```

### Starting Equipment

LinhSon civilization archetype members receive starting weapons at character creation:
- **Sword** (founder-only Templar) → WOODEN_SWORD (10 damage)
- **Warrior** → WOODEN_AXE (10 damage)
- **Scout** → WOODEN_CROSSBOW (10 damage)
- **Other archetypes/civilizations** → No starting gear

Starting weapons assigned via `getStartingWeapon(archetype)` which creates fresh EquipmentItem instances.

### UI Integration

**Equipment Slots** (3-slot display):
- Member Book Detail Page: Functional equip/unequip UI (member-book-detail-page.tsx)
- Character Detail Panel: Same 3-slot equipment UI (character-detail-panel.tsx)
- Guild Roster: Wired equipment props to detail page
- Inventory Panel: Separate equipment inventory section showing unequipped gear

**No Visual Sprite Change**: Equipment slot UI displays but does not alter member 3D model appearance (Phase 2 feature).

### Combat Integration

**Combat Systems Updated:**
- `combat-types.ts` — Added `gearFlatDamage?`, `gearFlatHp?`, `gearFlatDefense?` to CombatEntity
- `combat-formulas.ts` — Added `flatBonus` param to `calcAutoAttackDamage()` (backward compatible, default=0)
- `combat-entity-factory.ts` — Applies gear HP and flatDamage/flatDefense to ArenaEntity during setup
- `combat-simulator.ts` — Gear bonuses applied in auto-resolve combat (HP, damage, defense)
- `combat-engine.ts` — Gear bonuses applied in real-time arena (HP, damage, defense)

### State Management

**New Interfaces** (`game-state.ts`):
```typescript
interface EquipmentItem {
  id: string;          // UUID
  templateId: EquipmentTemplateId;
  durability: number;  // Current durability (0 = broken, no bonus)
}

interface MemberEquipment {
  weapon?: EquipmentItem;
  armor?: EquipmentItem;
  headgear?: EquipmentItem;
}

interface Member {
  equipment?: MemberEquipment | null;  // Added field
}

interface InventoryState {
  equipmentInventory?: EquipmentItem[];  // Unequipped gear items
}
```

**State Actions** (`guild-slice.ts`):
- `equipGear(memberId, slot, itemId)` — Equip item to member's equipment slot
- `unequipGear(memberId, slot)` — Remove equipped item, move to equipmentInventory

**Inventory Integration** (`inventory-slice.ts`):
- `getUsedSlots()` — Now includes equipment items in slot calculation
- Equipment items count toward inventory capacity (Phase 2: dedicated equipment UI)

### Save System

**Version 19 Migration** (`save-types.ts` / `save-migrations.ts`):
- `SAVE_VERSION: 18 → 19`
- Migration `migrateV18toV19()`:
  - Adds `equipment: null` to all members
  - Adds `equipmentInventory: []` to inventory state
  - No data loss; backward compatible

**Backward Compatibility**:
- Old saves load with equipment: null (no equipped gear)
- Existing members without equipment field treated as unequipped
- equipmentInventory initializes empty on old saves

### File Changes Summary

**New Files:**
- `src/game/data/equipment-templates.ts` — 11 static gear templates
- `src/game/systems/equipment-bonuses.ts` — Bonus calc + item creation helpers

**Modified Files:**
- `src/game/state/game-state.ts` — EquipmentItem, MemberEquipment interfaces; equipment? field on Member; equipmentInventory? on InventoryState
- `src/game/systems/combat-types.ts` — Gear flat bonus fields on CombatEntity
- `src/game/systems/combat-formulas.ts` — flatBonus param to calcAutoAttackDamage
- `src/game/systems/combat-entity-factory.ts` — Apply gear bonuses to ArenaEntity
- `src/game/systems/combat-simulator.ts` — Gear bonuses in auto-resolve
- `src/game/systems/combat-engine.ts` — Gear bonuses in real-time arena
- `src/game/systems/character-creation.ts` — Starting weapon assignment
- `src/game/state/guild-slice.ts` — equipGear() / unequipGear() actions
- `src/game/state/inventory-slice.ts` — Equipment item counting in getUsedSlots()
- `src/game/save/save-types.ts` — SAVE_VERSION 19
- `src/game/save/save-migrations.ts` — v18→v19 migration
- `src/ui/components/member-book-detail-page.tsx` — Equipment UI with dropdown + unequip
- `src/ui/panels/guild-roster.tsx` — Equipment props wired to detail page
- `src/ui/panels/inventory-panel.tsx` — Equipment inventory section
- `src/ui/panels/character-detail-panel.tsx` — Equipment UI (same as member book)

### Phase 2 Roadmap

- **Visual Equipment Sprites**: Update member 3D model on equip (pose/material changes)
- **Equipment Durability Decay**: Apply wear-and-tear during combat
- **Workshop Crafting**: Forge new gear from materials using craftMaterial + craftCost
- **Enchantment System**: Add magical bonuses to gear
- **Equipment Loot**: Drop gear from defeated enemies
- **Transmog/Skins**: Cosmetic appearance separation from stats

---

## HD-2D Ink UI System (v1.26 — Design Tokens + Responsive Scale)

### Design Token Layer (`src/ui/styles/game-ui-tokens.css`)

**CSS Custom Property Namespace** (`--ink-*`):
- Color palette: `--ink-bg`, `--ink-border`, `--ink-text`, `--ink-gold`, `--ink-hp-bar`, `--ink-exp-bar`
- Maintains isolation from existing `--color-*` tokens; no breaking changes
- All new UI components use token values; allows theme recoloring via single CSS edit

**Responsive Scale System** (`--ui-scale`):
- `--ui-scale: 1.0` — Viewports ≥1200px (desktop)
- `--ui-scale: 0.9` — Viewports 1024–1199px (laptop)
- `--ui-scale: 0.75` — Viewports 768–1023px (tablet)
- `--ui-scale: 0.5` — Viewports <768px (mobile)
- Applied via `transform: scale(var(--ui-scale))` at root panel level; eliminates media query hardcoding
- All font-size, padding, gap values use `calc()` with scale variable for proportional zoom

**Utility Classes**:
- `.ink-panel` — Base card styling (border, padding, background)
- `.ink-tab-bar`, `.ink-tab` — Tab navigation styling
- `.ink-bar-hp`, `.ink-bar-exp` — Status bar styling with custom fill animations
- `.ink-pixelated` — Pixel-perfect font rendering (image-rendering: pixelated)
- `.ink-enter` — Entry animation (fade + slide from top)

### Guild Roster Redesign (v1.26)

**Component Hierarchy**:
```
GuildRosterPanel
├─ FilterBar (name text input, civ dropdown, status filter)
├─ MemberGrid (auto-fill CSS Grid, responsive columns)
│  └─ MemberCard (per member)
│     ├─ Avatar (with 404 fallback initials)
│     ├─ Name + Civilization badge
│     ├─ Top-2 stats display (STR + INT or DEF + LUK)
│     └─ Status indicator (idle/busy/injured)
└─ CharacterDetailPanel (on card click)
```

**Member Card**:
- Grid tile with fixed aspect ratio
- Avatar: fetch `public/sprites/avatars/{memberId}.png`, fallback to initials in colored tile
- Click navigation: `GuildRosterPanel → CharacterDetailPanel → back to Roster`
- Filters apply instantly (no pagination; all members visible in scrollable grid)

**UI Files**:
- `src/ui/panels/guild-roster.tsx` — Container, filter logic, grid layout
- `src/ui/components/member-card.tsx` — Single card component (new)
- `src/ui/styles/guild-roster.css` — Grid, card, filter pill styling

### Character Detail Tabs (v1.26)

**Tab Structure**:
```
CharacterDetailPanel
├─ Header: Portrait + Stats Summary
├─ TabBar: Stats | Equipment | Skills | Bio
├─ TabContent (single active)
│  ├─ StatsTab: HP bar (via calcMaxHp), EXP bar, stat rows, rank badge
│  ├─ EquipmentTab: Read-only slot display (icons), Equip button
│  ├─ SkillsTab: [Placeholder]
│  └─ BioTab: [Placeholder]
└─ Close Button
```

**Tab State**:
- Ephemeral (not persisted; no URL hash or route)
- Stored in component local state (not Zustand)
- Tab switching instant (no re-mount; content div display toggle)

**Equipment Preview Tab**:
- Shows 3 gear slots (weapon, armor, headgear) with item icons
- Shows 2 medicine slots (read-only) with condition label + item icon
- No edit interaction here; edit via "Equip" button → EquipModePanel
- Unequip action removed from detail tab (moved to equip mode only)

**UI Files**:
- `src/ui/panels/character-detail-panel.tsx` — Container, tab management
- `src/ui/components/character-tabs/stats-tab.tsx` — Stats display, HP/EXP bars (new)
- `src/ui/styles/character-detail.css` — Tab bar, content area, portrait frame

**Removed**:
- `src/ui/components/member-book-detail-page.tsx` — Superseded by character-detail-panel

### Equip Mode Drag-Drop Panel (v1.26)

**Component Structure**:
```
EquipModePanel (modal within roster flow)
├─ Header: "Equip {memberName}" + Close
├─ SplitLayout
│  ├─ Left: Equipment Slots (weapon, armor, headgear)
│  │  └─ Slot (click to unequip)
│  ├─ Right: Inventory Items (filterable, scrollable)
│  │  └─ DragItem (drag to slot or medicine slot)
│  └─ Bottom: Medicine Slots (2 slots)
│     ├─ Condition Selector (start/80/50/30/never)
│     ├─ Medicine Item (draggable)
│     └─ Clear Button
└─ Footer: Confirm (or auto-persist on change)
```

**Drag-Drop Mechanics**:
- DragStart: item UUID + source (inventory or medicine slot)
- DragOver: highlight valid drop targets (slots of compatible type)
- Drop: `setMedicineSlot(memberId, slotIndex, itemId, condition)` or `equipGear(memberId, slot, itemId)`
- Visual feedback: slot highlight, item opacity on drag

**Medicine Slot Selector**:
- Dropdown: select condition before assigning item
- Default: condition 'start', itemId null
- Clear: removes item, keeps condition
- UI shows condition label + item icon side-by-side

**HUD Integration**:
- `ui-store.isEquipModeOpen` flag triggers inventory panel auto-open
- On close: reset ui-store flag, return to character detail view

**UI Files**:
- `src/ui/components/equip-mode-panel.tsx` — Full split layout component (new)
- `src/ui/styles/equip-mode.css` — Split grid, drag-drop feedback, medicine selector

### Ephemeral UI State Store (`src/game/state/ui-store.ts`)

**Rationale**: Separate Zustand store for transient UI state prevents cluttering game state with UI flags.

**State Shape**:
```typescript
interface UIState {
  isEquipModeOpen: boolean;
  equipModeCharacterId: string | null;
}

interface UIStore extends UIState {
  openEquipMode: (memberId: string) => void;
  closeEquipMode: () => void;
}
```

**Subscribers**:
- `InventoryPanel`: Auto-opens when `isEquipModeOpen` becomes true
- `EquipModePanel`: Renders when `isEquipModeOpen && equipModeCharacterId` set
- `CharacterDetailPanel`: Triggers `openEquipMode(memberId)` on Equip button click

**Not Persisted**: No IndexedDB storage; resets on page reload (expected behavior for UI).

### Medicine Slots Data Model (v1.26)

**Interfaces** (`src/game/state/game-state.ts`):
```typescript
type MedicineCondition = 'start' | '80' | '50' | '30' | 'never';

interface MedicineSlot {
  itemId: string | null;
  condition: MedicineCondition;
}

interface Member {
  medicineSlots: [MedicineSlot, MedicineSlot];  // Always 2 slots
}
```

**State Actions** (`src/game/state/guild-slice.ts`):
- `setMedicineSlot(memberId, slotIndex, itemId, condition)` — Assign item + condition
- `clearMedicineSlot(memberId, slotIndex)` — Remove item, reset to null

**Default Initialization** (`src/game/systems/character-creation.ts`):
- Founder, roster recruits, tavern members: `medicineSlots: [{itemId:null,condition:'start'},{itemId:null,condition:'start'}]`
- Applied during member creation, not at runtime

**Combat Integration**: Out of scope for v1.26. UI captures intent only; consumption logic deferred.

### Save Migration v19 → v20 (`src/game/save/save-migrations.ts`)

**`migrateV19toV20()`**:
- Adds `medicineSlots: [{itemId:null,condition:'start'},{itemId:null,condition:'start'}]` to every member (founder, roster, tavern)
- No data loss; backward compatible
- Old saves load with slots initialized but empty

### Save Migration v25 → v26 (Phase 06 Tutorial State Machine Integration)

**`migrateV25toV26()`** (`src/game/save/save-migrations.ts`):
- **TutorialStep Remap** (`STEP_REMAP` table): Remaps legacy 8-step IDs forward to 14-beat narrative flow
  - 'char-creation' → 'char-creation' (unchanged)
  - 'world-board' → 'arrival-alarm' (prerequisites met; no blocking items)
  - 'tutorial-quest-dispatch', 'tutorial-quest-active' → 'open-quest-board' (dead mission strips below; player re-dispatches)
  - 'tutorial-kael-rescue' → 'kael-rescue' (Kael + permit already pre-granted)
  - 'tutorial-reward' → 'reward-splash' (permit already granted)
  - 'build-logging-site' → 'build-logging-site' (unchanged, new beat exists)
  - 'assign-kael' → 'assign-kael' (unchanged)
  - Unknown legacy IDs → 'complete' (defensive fallback)
- **Stranded Member Cleanup**: Removes 'tutorial-into-the-clearing' mission from `activeMissions[]`
  - Any members stuck 'on-mission' for that mission reset to 'idle' status (frees them so they're available for new tutorial flow)
  - The deleted mission no longer exists in MISSIONS registry, so members would be stranded if not cleaned up
- **Data Preservation**: Transparent migration; auto-triggered on load, no player interaction required
- **Backward Compat**: Old saves load seamlessly with 14-beat flow; player simply continues from remapped beat

### Save Migration v26 → v27 (MVP Recruit Gating, VN Names & Roster Rename)

**`migrateV26toV27()`** (`src/game/save/save-migrations.ts`):
- **TavernVisitor Schema Change**: `TavernVisitor` adds required `name` + `gender` fields
  - Backfill existing `tavern.mercContracts[]` visitors (persisted active/pending contracts)
  - Founder visitors: assign name as `'Founder'`
  - Recruited visitors: deterministically assign from `CIV_CONFIG[civ].namePool` (same logic as new spawn)
  - All visitors get gender from archetype→gender mapping in `RECRUITABLE_UNITS`
- **Backward Compat**: Old saves load with proper names; no player interaction required
- **Archetype Gating**: New `RECRUITABLE_UNITS` config gates recruitable units per civilization (MVP: Linh Sơn only)
  - Non-recruitable archetypes (e.g., `LS-SCOUT-M`, `LS-WARRIOR-F`) never spawn in tavern or through recruitment system
  - Existing saves' members unaffected (loaded members keep archetype/gender as-is)

### Inventory Panel Updates (v1.26)

**Changes**:
- Auto-opens when `ui-store.isEquipModeOpen` set
- Subscribe to ui-store for open/close state
- On close: trigger `ui-store.closeEquipMode()` to clear equip mode flag
- Preserves existing equipment inventory section + alchemy UI

### HUD Updates (v1.26)

**Changes**:
- `src/ui/hud/hud.tsx` — Subscribe to ui-store, conditionally render inventory panel
- Auto-open triggered from character detail → equip button → `openEquipMode(memberId)`

### File Ownership & Changes Summary

**New Files**:
- `src/ui/styles/game-ui-tokens.css` — Design token CSS layer
- `src/ui/styles/guild-roster.css` — Roster + member card styling
- `src/ui/styles/character-detail.css` — Tab bar + detail panel styling
- `src/ui/styles/equip-mode.css` — Split drag-drop panel styling
- `src/ui/components/member-card.tsx` — Single member card component
- `src/ui/components/equip-mode-panel.tsx` — Drag-drop equip panel
- `src/ui/components/character-tabs/stats-tab.tsx` — Stats tab content
- `src/game/state/ui-store.ts` — Ephemeral UI state (new store)

**Modified Files**:
- `src/ui/panels/guild-roster.tsx` — Refactor to grid layout + filters
- `src/ui/panels/character-detail-panel.tsx` — Refactor to tabs, add equip button
- `src/ui/panels/inventory-panel.tsx` — Add auto-open trigger on equip mode
- `src/ui/hud/hud.tsx` — Subscribe to ui-store
- `src/game/state/guild-slice.ts` — Add `setMedicineSlot`, `clearMedicineSlot`
- `src/game/state/game-state.ts` — Add `MedicineCondition` type + `MedicineSlot` interface
- `src/game/state/store.ts` — Integrate ui-store
- `src/game/systems/character-creation.ts` — Initialize medicine slots
- `src/game/save/save-types.ts` — Update SAVE_VERSION to 20
- `src/game/save/save-migrations.ts` — Add `migrateV19toV20`
- `src/main.tsx` — Import `game-ui-tokens.css`

**Removed Files**:
- `src/ui/components/member-book-detail-page.tsx` — Replaced by character-detail-panel

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
  - archetypes: 2 recruitable per civ (e.g. LinhSon ['warrior','scout'])
    NOTE: founder-only 'sword' (Templar) is excluded here so recruits/tavern never roll it
  - heroes: { archetype: [...] }
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

### Roster Slice (ENHANCED - v1.6, v1.8, v1.11, v1.26)
- Array of members with stats, EXP, levels, class
- Equipment (armor, weapons) — v1.25
- Medicine slots (2 per member, with conditions) — NEW v1.26
- Status tracking (idle/injured/active)
- `archetype: CivArchetype | undefined` — Character archetype per civ (warrior, scout, engineer, etc.) — NEW v1.11
- `gender: 'M' | 'F' | undefined` — Character gender for sprite selection — NEW v1.11
- `autoCastEnabled: Record<memberId, boolean>` — Per-member auto-cast toggle state
- `toggleAutoCast(memberId)` — Toggle auto-cast for member in combat
- `rank: MemberRank` — Member rank (RECRUIT | MEMBER | VETERAN | OFFICER | COMMANDER | MERCENARY)
- `missionsCompleted: number` — Lifetime mission count (for promotion eligibility)
- `promoteMember(memberId, goldCost)` — Advance rank + deduct gold
- `medicineSlots: [MedicineSlot, MedicineSlot]` — Medicine auto-use assignments (NEW v1.26)
- `setMedicineSlot(memberId, slotIndex, itemId, condition)` — Assign medicine + trigger condition (NEW v1.26)
- `clearMedicineSlot(memberId, slotIndex)` — Remove medicine from slot (NEW v1.26)

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

### UI Store (NEW - v1.26)
- **Purpose**: Ephemeral UI state, not persisted to IndexedDB
- `isEquipModeOpen: boolean` — Equip mode panel visibility
- `equipModeCharacterId: string | null` — Which member is being equipped
- `openEquipMode(memberId)` — Open equip panel + auto-open inventory
- `closeEquipMode()` — Close equip panel + close inventory
- **Subscribers**: InventoryPanel, EquipModePanel, CharacterDetailPanel
- **Not persisted**: Resets on page reload (expected UI behavior)

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
| `title-screen-settings.tsx` | Settings overlay: BGM/SFX volume, language (en/vi), graphics quality (low/med/high) — NEW v1.29 Phase 5 |
| `title-screen-credits.tsx` | Credits overlay: scrollable credits list with role/name pairs — NEW v1.29 Phase 5 |
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
| `retro-speech-bubble.tsx` | JRPG-style narrative dialogue bubble with typewriter reveal + click-through (world-anchored via coachmark bridge or fixed-bottom fallback) — NEW v1.28, Phase 05 tutorial-quest-redesign |
| `npc-alarm.tsx` | Beat-2 narrative driver mounting RetroSpeechBubble (messenger alarm scene) — NEW v1.28, Phase 05 |
| Other UI components | Stat bars, cards, buttons |

### `/ui/panels/` — Collapsible Panels
| File | Purpose |
|------|---------|
| `quest-board.tsx` | Unified split-pane dispatch UI (desktop 55/45 list/detail; mobile single-pane swap). Parchment skin, "Return to Guild" close, wax-seal dispatch button. — REWRITTEN v1.28 |
| `quest-card.tsx` | List-item card component for mission entries — NEW v1.28 |
| `quest-detail-pane.tsx` | Right-side detail panel with empty state + party selection — NEW v1.28 |
| `quest-party-slots.tsx` | Facility-style square party slots (filled avatar tile + empty/add slots), required+expandable up to soft cap — NEW |
| `quest-roster-picker.tsx` | Right-anchored roster flyout of `MemberCard`s for filling a party slot (Esc/outside-click close) — NEW |
| `member-avatar.css` | Shared `.fp-avatar-*` member tile styles (facility tray + quest party slots) — NEW |
| `guild-roster.tsx` | Compact member list with character detail panel (NEW v1.6), civ badges, civilization filtering |
| `character-detail-panel.tsx` | Left-side detail panel (avatar, equipment, auto-cast toggle, stats, civ info, passives) — NEW v1.6, ENHANCED v1.9 |
| `build-menu.tsx` | Room selection UI (enter placement mode instead of direct placement) |
| `combat-view.tsx` | Combat log + tick-by-tick simulation details |
| `char-creation.tsx` | Split-hero new-game wizard orchestrator (Civilization → Class → Mask → Identity → Begin); pinned live preview + per-step rail — REBUILT (New Game Flow, 2026-05-21) |
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
| `panels.css` | Panel container styling |
| `quest-board.css` | Quest board unified split-pane + parchment skin + responsive mobile layout — NEW v1.28 |
| `parchment.css` | Parchment theme for diegetic UI (Phase 1) |

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

### `/i18n/` — Bilingual Localization (EN + VI)

i18next + react-i18next with device-level language preference. **Two-namespace architecture**: `ui` (interface chrome, 708 keys each language) and `content` (game-data display + narrative, with asymmetric source-language resolution).

**Key concepts**:
- **Source-language asymmetry**: EN-authored data (missions, items, enemies) has EN inline + VI overlay; VN-authored data (civ, skills) has VN inline + EN overlay.
- **`fallbackLng: false` for content namespace**: Critical for correct fallback behavior when resolving VN-authored entities.
- **`useLanguage()` hook**: Centralizes device-level preference (localStorage), one language across all save slots.
- **Typed wrappers** (`missionName`, `itemName`, `civName`, etc.): Never call data fields directly; use wrappers for automatic localization.
- **Coverage + parity guards**: `ui-parity.test.ts` (708 keys each), `content-coverage.test.ts` (entity field completeness).

**See** `docs/i18n.md` for full architecture, contributor guide, and testing details.

| File | Purpose |
|------|---------|
| `index.ts` | i18next init, lang storage, dev helpers (saveMissing for ui namespace) |
| `content-localization.ts` | `tContent(category, id, field, fallback)` resolver with `fallbackLng: false` |
| `content-wrappers.ts` | Typed per-category helpers: `missionName()`, `itemName()`, `civName()`, `skillName()`, etc. |
| `use-language.ts` | `useLanguage()` hook for device-level preference (localStorage + i18n) |
| `ui.en.json`, `ui.vi.json` | UI namespace (708 keys each, parity enforced) |
| `content.en.json`, `content.vi.json` | Content namespace (overlays per source-language direction) |
| `ui-parity.test.ts` | Guard: ensures ui.en.json ↔ ui.vi.json key alignment (708 keys each) |
| `content-coverage.test.ts` | Guard: ensures all entity fields have required overlay entries |

### `/audio/` — Audio Management
| File | Purpose |
|------|---------|
| `audio-manager.ts` | Audio key registry + Howler.js management, includes 6 new keys (v1.9): BGM_COMBAT, SFX_CRIT, SFX_DODGE, SFX_DEATH, SFX_SKILL, SFX_RECRUIT; `crossfadeBGM(key, durationMs=1500)` for smooth BGM transitions (Phase 6 Title Screen 2000s A.C.) |
| `audio-keys.ts` | Enum of all audio keys (includes BGM_TITLE for title screen BGM) |

## Diegetic UI Pattern (Quest Board v1.28+)

### Overview
Quest Board implements a "diegetic-with-DOM-overlay" hybrid pattern: a 3D mesh object (drum in guild hall) serves as the physical trigger, while DOM layers provide tooltips, panels, and keyboard access. This bridges R3F and React UI ownership with clean state boundaries.

### Component Hierarchy

```
game-screen.tsx (root, mounts global handlers)
  ├─ scene/
  │   └─ guild-hall.tsx
  │       ├─ <InteractiveDrum /> (R3F mesh, raycasting, click handler)
  │       │   └─ <DrumSparkleHint /> (conditional: !questBoardTutorialSeen)
  │       └─ ...other guild hall objects
  │
  ├─ hud/
  │   ├─ <KeyboardShortcuts /> (global Q/ESC capture-phase handler)
  │   └─ ...other HUD elements
  │
  └─ overlays/
      └─ <DrumTooltipArrow /> (conditional: !questBoardTutorialSeen)

ui-store (Zustand):
  - questBoardTutorialSeen (persisted localStorage)
  - activePanel ('quests' | ... | null)
  - resetTutorials action

camera-slice (Redux):
  - cameraFocus state ('guild-hall' | 'home' | ...)
  - pendingQuestPanel bridge to activePanel

game-screen.tsx (local):
  - activePanel state-tracking (sync with ui-store)
  - panel mount/unmount effects
```

### State Ownership

| Concern | Owner | Storage |
|---------|-------|---------|
| Tutorial seen flag | `useUIStore` | localStorage `questBoardTutorialSeen` |
| Active panel | `game-screen.tsx` local + `useUIStore` | React state (session-only) |
| Camera focus (R3F bridge) | `camera-slice` | Redux store |
| Drum interaction (R3F) | `interactive-drum.tsx` | useFrame + click handler |

### Event Handling & Capture Ordering

**Challenge:** Both `<HomeButton />` (HUD) and `<KeyboardShortcuts />` (global) want to handle ESC, but order matters.

**Solution:** `KeyboardShortcuts` uses **capture-phase** with `stopImmediatePropagation()` to win ESC ordering:
```typescript
// hud/keyboard-shortcuts.tsx
const handler = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && activePanel !== null) {
    e.preventDefault();
    e.stopImmediatePropagation(); // WIN vs HomeButton bubble
    setActivePanel(null);
  }
};
window.addEventListener('keydown', handler, true); // capture=true
```

**Result:** ESC closes active panel (capture) → HomeButton's bubble listener never fires.

### Accessibility Baseline (WCAG 2.1 AA)

**Dialog Semantics:**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-label="Quest Board"
>
  ...quest cards...
</div>
```

**Keyboard Navigation:**
- `Q` → toggle quest panel (or focus if sidebar)
- `ESC` → close quest panel
- `Tab` → cycle through quest cards → detail pane → dispatch button
- `Enter` → select/dispatch

**Screen Reader:**
- Drum (R3F mesh): No DOM node; tooltip has `role="status" aria-live="polite"` (non-intrusive update announcement)
- Quest cards: Plain `<button>` (native semantics, no custom `role="listbox"` override)
- Dispatch button: Native `<button role="button">`

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .drum-tooltip-arrow { animation: none; }
  .quest-detail-pane .animation { animation: none; }
}
```

### Implementation Notes

- **First-visit hint:** Sparkle particle (20 instances, R3F) + DOM tooltip. Both gated on `questBoardTutorialSeen`.
- **Debouncing:** Quest card hover SFX uses 120ms debounce to avoid spammy audio feedback.
- **Tooltip positioning:** Fixed % approximation (left: 50%, top: 45%). Upgrade to `Vector3.project()` if precision needed.
- **Reduced-motion:** Sparkle particle can be disabled in settings; tooltip animation removed entirely.

---

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

## Graphics Settings & Post-Processing (v1.23)

### Overview

User-facing graphics settings in Settings Panel allow players to control shadows and bloom effects. All settings persist via localStorage and are reactive through Zustand store.

### GameSettings Interface

**Location**: `src/game/state/game-state.ts`

```typescript
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoSkillDefault: boolean;
  graphicsQuality: 'high' | 'low';
  shadowsEnabled: boolean;        // NEW (v1.23)
  bloomEnabled: boolean;          // NEW (v1.23)
  bloomThreshold: number;         // NEW (v1.23) — range 0–1
}
```

**Defaults**:
- `shadowsEnabled: true` — Native PCFShadowMap on guild hall floor (WebGL & WebGPU compatible) + N8AO SSAO in WebGL post-processing
- `bloomEnabled: true` — World bloom effect enabled
- `bloomThreshold: 0.5` — Mid-range luminance threshold

**Persistence**:
- localStorage keys: `shadows-enabled`, `bloom-enabled`, `bloom-threshold`
- Auto-load on session restore
- No save migration needed (settings stored separately, not in game state)

### Settings Panel UI

**Location**: `src/ui/panels/settings-panel.tsx`

**Toggles**:
| Setting | Type | Effect |
|---------|------|--------|
| Shadows | On/Off button | Enables native PCFShadowMap + N8AO SSAO |
| Bloom | On/Off button | Enables post-processing bloom |
| Threshold | Slider (0–1) | Conditional display (only if Bloom = On) |

**Styling**:
- Inactive state: 60% opacity, gray border
- Active state: 100% opacity, green border (#4caf50)
- Threshold slider visible only when bloomEnabled = true

**Event Handlers**:
- `handleShadows(enabled)` → `updateSettings({ shadowsEnabled })`
- `handleBloom(enabled)` → `updateSettings({ bloomEnabled })`
- `handleBloomThreshold(value)` → `updateSettings({ bloomThreshold })`
- Changes apply immediately without page reload

### Post-Processing Pipeline

**Guild Hall Rendering** (`src/scene/guild-hall.tsx`):
- Native Three.js PCFShadowMap with orthographic frustum sized for 10×7 guild hall
- `directionalLight` casts shadows; floor + furniture models receive shadows
- Shadow map controlled reactively by `ShadowController` component (no scene reload required)
- Improves spatial clarity in isometric view, works on both WebGPU and WebGL

**World Post-Processing** (`src/scene/atmospheric/world-atmospheric-post.tsx`):
- Preset-driven composer replaces static bloom. Reads active room via `useAtmosphere()` context.
- **WebGL**: Full effect stack (N8AO → DOF → TiltShift → Bloom → GodRays → HueSat → BrightnessContrast → Vignette → Noise → ChromaticAberration → ToneMapping).
- **WebGPU** (Phase 05): TSL chain (Bloom → TiltShift → ColorGrade → Vignette → ChromaticAberration → ACES ToneMapping); functional parity for five core effects achieved. TiltShift uses Gaussian masked blur (SIGMA=4, half-res), mask formula: `smoothstep(0, 0.3, abs(uv.y - 0.5) - halfWidth)`. ColorGrade includes hue/saturation/brightness/contrast; vignette uses pmndrs DEFAULT radial darkening. DOF/GodRays remain WebGL-only. RT leak fixed via `chainDisposables` array collecting TempNode dispose closures.
- Per-room DOF target auto-syncs via camera controller lerp; no focus-point popping on room transitions.
- Quality tier: `graphicsQuality='low'` disables DOF, GodRays, ChromaticAberration, LUT; WebGPU chain always runs per preset.
- **Preset Sync Pattern**: Refs-based (`presetRef`/`overridesRef`) prevent seed-race during async TSL node import; `applyPreset()` helper syncs uniform `.value` in async tail + per-preset useEffect.
- **Shadow ownership**: PCFShadowMap (scene), N8AO/post-processing (separate concern)

**Store Integration**:
```typescript
const settings = useGameStore(s => s.settings);
const shadowsEnabled = settings.shadowsEnabled;
const bloomEnabled = settings.bloomEnabled;
const bloomThreshold = settings.bloomThreshold;
```

### Backward Compatibility

- Existing saves (v1.22 and earlier) load with default graphics settings
- Settings stored in Zustand + localStorage (not in IndexedDB save)
- No data loss on downgrade (settings are ephemeral)
- Leva dev panel unaffected (still available for advanced tuning)

### Performance Impact

- Toggle switching: O(1) state update via `ShadowController` (no scene reload)
- Bloom threshold slider: Uniform update per-frame (negligible cost)
- PCFShadowMap: GPU-side rendering (standard WebGL/WebGPU, mobile-compatible)
- N8AO SSAO: Optional (expensive on low-end hardware, gated by shadowsEnabled)
- No new draw calls or complex raycasting

### Future Enhancements

- [ ] Motion blur toggle
- [ ] Film grain intensity
- [ ] Contrast/brightness sliders
- [ ] Anti-aliasing mode selection

## Atmospheric Depth System (v1.28+ — Per-Room Post-FX & Lighting Foundation)

### Overview

Foundation infrastructure for per-room atmospheric theming: context provider, preset registry, active-room detection, and smooth lerp transitions. Phases 02–05 (post-FX stack, particles, volumetric lighting, diegetic UI) consume this plumbing.

### Architecture

**Module**: `src/scene/atmospheric/`

- **`atmosphere-types.ts`**: `RoomId` union (9 rooms), `AtmospherePreset` interface (bloom, tilt-shift, DOF, color-grading, vignette, fog, god rays, particles, hemisphere light), `BASELINE_PRESET` constant
- **`atmosphere-presets.ts`**: Registry mapping room IDs to presets; Phase 04 tuning complete (9 per-room presets)
- **`atmosphere-context.tsx` + `atmosphere-context-store.ts` + `use-atmosphere.ts`**: React Context provider and consumer hook
- **`use-active-room-id.ts`**: Derives current room ID from camera position relative to facility room centers (returns `'guild-hall' | 'tavern' | ... | null`)
- **`use-lerped-atmosphere.ts`**: Smooth transitions between presets over 500ms via frame-independent exponential lerp

### Settings Integration

- **GameSettings field**: `atmosphericEnabled: boolean` (default true; can be toggled in Settings Panel)
- When `atmosphericEnabled === false`, provider returns null; consumers no-op (zero overhead)

### Data Flow

```
Camera Position
    ↓
useActiveRoomId() → Room ID (e.g., 'tavern')
    ↓
getAtmospherePreset(roomId) → Preset
    ↓
useLerpedAtmosphere(preset) → Animated Preset (lerped over 500ms)
    ↓
AtmosphereProvider (React Context)
    ↓
useAtmosphere() hook (Phase 02+ consumers: post-FX composer, particles, lighting)
```

### Performance

- **Derivation Cost**: Active-room detection is O(n) nearest-room lookup on each frame (n = 9 rooms, negligible)
- **Lerp Cost**: Frame-independent exponential math only; no draws, textures, or re-renders of scene
- **Disabled Cost**: When `atmosphericEnabled = false`, provider skips computation entirely

### Ambient Particle System (Phase 03 — COMPLETE)

**Architecture**:
- 4 particle archetypes (dust-motes, embers, magic-motes, pollen) select via `preset.particles` string key
- Deterministic mulberry32 PRNG (seeded) replaces Math.random for React purity compliance
- Shared procedural texture: 32×32 soft-circle DataTexture (SSR-safe singleton, reused across all instances)
- Bounds helper: RoomId → Box3 lookup table + `randomInBounds(prng)` spawn utility (floor-Y assumption documented)
- Router component: Key-driven switch `${roomId}:${particleType}` remounts on preset change; zero stale particles
- Mounted in `world.tsx` inside `<AtmosphereProvider>` alongside post-FX stack

**Particle Types** (all use additive blending, wrap-on-bounds lifecycle):
- **dust-motes**: Warm slow drift, infinite lifecycle, spawn density high:100 / low:30
- **embers**: Hot orange upward-rising, 3–4s lifespan + fade-out, spawn high:80 / low:20
- **magic-motes**: Cool purple circular swirl, opacity pulse via sine wave, spawn high:60 / low:15
- **pollen**: Yellow outdoor vibe, slow settlement toward ground, respawn at top on wrap, spawn high:40 / low:10

**Data Flow**:
```
AtmosphereProvider (context)
    ↓
useAtmosphere() → { ..., particles: 'dust-motes' | 'embers' | ... | null }
    ↓
<AmbientParticlesRouter roomId={roomId} particleType={particles} />
    ↓
Component switch: dust-motes | embers | magic-motes | pollen | null
    ↓
Each component: useGraphicsQuality() → tier-aware spawn counts
```

**Performance**:
- **Tier Scaling**: `graphicsQuality='low'` reduces counts by ~65% (dust: 30, embers: 20, magic: 15, pollen: 10)
- **Buffer Strategy**: useState + useRef for mutable frame buffers (idiomatic r3f for useFrame mutations)
- **Determinism**: Mulberry32 seed produces identical particle layout across remounts (bonus: React pure)
- **Mount Cost**: Router key change forces component remount; previous particle instance cleaned up immediately

**Integration Points**:
- `atmosphere-presets.ts`: Each preset includes optional `particles: ParticleType | null` field
- `world.tsx`: Mounts `<AmbientParticlesRouter>` as child of `<AtmosphereProvider>`
- `guild-slice.ts`: Settings already include `atmosphericEnabled` toggle (gates entire provider)

### Completed Phases

- **Phase 02**: ✅ Post-FX stack (bloom, tilt-shift, DOF, color-grading, vignette, noise) mounted from `useAtmosphere()`. Full WebGL effect chain; WebGPU TSL chain (Bloom → ColorGrade → Vignette → ACES ToneMapping). Per-room DOF target auto-sync via camera lerp. Refs-based preset sync prevents mutation race during async TSL import.
- **Phase 03**: ✅ Ambient particle system (dust-motes, embers, magic-motes, pollen) per preset. Deterministic mulberry32 PRNG. Tier-aware counts (high: 100/80/60/40; low: 30/20/15/10). Additive blending, wrap-on-bounds lifecycle. Mounted in `world.tsx` via `<AmbientParticlesRouter>`.
- **Phase 04**: ✅ Per-room atmospheric presets tuned across 9 guild hall rooms. Hemisphere light conditionally mounted in `AtmosphereProvider` (reads `hemisphereLight` from preset; null = zero cost). Optional `mood?: string` field added to `AtmospherePreset` (documentation-only).
- **Phase 05 (WebGPU TSL Parity)**: ✅ Tilt-shift TSL node (Gaussian masked blur, SIGMA=4, half-res). Mask formula matches WebGL exactly. Chain order: Bloom → TiltShift → ColorGrade → Vignette → ChromaticAberration → ACES. RT leak fix via `chainDisposables` array for TempNode cleanup.

### Future Phases

- **Phase 06**: Diegetic UI lighting integration; auto-enable on high-tier graphics; profiling & perf validation

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
