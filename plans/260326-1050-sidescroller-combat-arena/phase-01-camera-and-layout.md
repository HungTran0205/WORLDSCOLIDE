# Phase 1: Camera & Layout

## Overview
- **Priority**: High
- **Status**: complete
- Change camera from isometric [10,10,10] to beat-em-up [0,7,10], tighten formation Z spread, add boundary clamping.

## Related Files
- `src/scene/combat-arena.tsx` — camera position
- `src/game/systems/combat-arena-types.ts` — formation positions + boundary constants
- `src/game/systems/combat-ai.ts` — boundary clamp in moveToward

## Implementation Steps

### 1. Camera angle (`combat-arena.tsx`)
Change camera position from isometric to beat-em-up:
```tsx
// Before
camera={{ zoom: 60, position: [10, 10, 10], near: 0.1, far: 1000 }}

// After — beat-em-up ~35° from horizontal
camera={{ zoom: 60, position: [0, 7, 10], near: 0.1, far: 1000 }}
```

Replace `<CameraController />` with a fixed-camera setup for arena (no OrbitControls panning/zoom in combat). Use a simple component that just sets the camera target:

```tsx
// Inside CombatArenaCanvas, replace <CameraController /> with:
<ArenaCameraController />
```

Create inline or small component:
```tsx
function ArenaCameraController() {
  useFrame(({ camera }) => {
    camera.lookAt(0, 0, 0);
  });
  return null;
}
```

Alternatively, since it's just one line — keep CameraController but disable zoom+pan in arena context. Simpler: just remove `<CameraController />` and the camera will naturally look at its default target.

**Decision**: Remove `<CameraController />` from combat-arena.tsx entirely. The orthographic camera with `position=[0,7,10]` already faces origin by default in R3F. No orbit controls needed in combat.

### 2. Formation positions (`combat-arena-types.ts`)
Tighten Z spread from [-2, 0, 2] to [-1.5, 0, 1.5]:

```ts
// Before
front: [
  { x: -4, z: -2 },
  { x: -4, z: 0 },
  { x: -4, z: 2 },
],

// After
front: [
  { x: -4, z: -1.5 },
  { x: -4, z: 0 },
  { x: -4, z: 1.5 },
],
```

Same for back rows and enemy positions.

Add boundary constants:
```ts
/** Arena boundary limits for invisible walls */
export const ARENA_BOUNDS = {
  minX: -8,
  maxX: 8,
  minZ: -4,
  maxZ: 4,
} as const;
```

### 3. Boundary clamping (`combat-ai.ts`)
After position update in `moveToward`, clamp to arena bounds:

```ts
import { ARENA_BOUNDS } from './combat-arena-types';

// After updating entity.position.x and entity.position.z:
entity.position.x = Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, entity.position.x));
entity.position.z = Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, entity.position.z));
```

Add clamping at both exit points (snap and incremental move).

## TODO
- [x] Change camera position [10,10,10] → [0,7,10] in combat-arena.tsx
- [x] Remove CameraController import/usage from combat-arena.tsx
- [x] Tighten Z formation spread from 2 → 1.5 in combat-arena-types.ts
- [x] Add ARENA_BOUNDS constant in combat-arena-types.ts
- [x] Add boundary clamping in moveToward() in combat-ai.ts

## Success Criteria
- Camera shows beat-em-up angle — battlefield visible left-to-right with slight top-down
- Allies on left, enemies on right, depth visible but compressed
- Entities never leave arena bounds
- No zoom/pan controls during combat (fixed camera)
- All combat features work: HP bars, damage numbers, skills, status effects
