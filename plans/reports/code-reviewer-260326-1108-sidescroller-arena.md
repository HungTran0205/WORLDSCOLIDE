# Code Review: Sidescroller Combat Arena Transformation

**Date:** 2026-03-26
**Scope:** 4 files, ~70 LOC changed (visual/layout refactor)
**Focus:** Boundary clamping correctness, import integrity, geometry positioning, camera angle

---

## Overall Assessment

Clean, well-scoped visual refactor. No logic regressions. All changes are internally consistent and TSC passes. One medium issue found via edge-case scouting; rest is solid.

---

## Scout Findings: Edge Cases

### 1. Formation back-row X at -6/+6 vs ARENA_BOUNDS minX/maxX at -8/+8

**Status: OK.** Back-row positions (-6, +6) are within bounds (-8, +8). Front-row at -4/+4 also safe. No entity spawns outside walls.

### 2. Wall meshes at x=-10/+10 vs ARENA_BOUNDS at -8/+8

**Status: OK (intentional).** Visual walls at x=10 are outside the clamping boundary at x=8. This gives a 2-unit buffer zone between invisible wall and visual wall, which feels natural in beat-em-ups (entities stop before hitting the wall sprite).

### 3. Ground plane 20x10 vs ARENA_BOUNDS

Ground is 20 wide (x: -10 to +10), bounds are 16 wide (x: -8 to +8). Entities stay on visible floor. Z: ground is 10 deep (-5 to +5), bounds clamp to -4/+4. Good margin.

### 4. Side indicators extend beyond bounds

Blue/red zone indicators are 6-unit wide planes centered at x=-5/+5, spanning x=-8 to -2 and x=2 to 8. These align perfectly with the clamped playable area. Good.

---

## Critical Issues

None.

---

## High Priority

None.

---

## Medium Priority

### 1. Center line Z-depth may clip under side indicators

`combat-arena-environment.tsx` line 41: Center line at y=-0.03, side indicators at y=-0.04. Center line is ABOVE indicators (correct). However, the ground plane is at y=-0.05. The layering order from bottom to top is:
- Ground: y=-0.05
- Side indicators: y=-0.04
- Center line: y=-0.03

**Verdict: Correct layering.** No Z-fighting risk since each layer is separated by 0.01 units with orthographic projection. Noted for awareness if more floor elements are added later.

### 2. `moveToward` clamping may cause entities to get stuck at boundary corners

If an entity is clamped at a corner (e.g., x=8, z=4) and its target is beyond that corner, `moveToward` will clamp every tick but the distance check `dist <= stopDistance` will never be satisfied because the entity can't actually reach the target. The entity will perpetually walk-into-the-wall.

**Impact:** Entity stays in `walking` anim state, never attacks. Only happens at extreme arena edges, which is rare given formation positions are well-centered.

**Suggested mitigation (low urgency):** After clamping, recalculate distance; if clamped position hasn't changed between ticks, switch to `idle` or re-target. Not blocking for MVP.

---

## Low Priority

### 1. `CameraController` import removed correctly

Confirmed: `CameraController` is only used in `world.tsx` (guild hall scene). No dangling import in `combat-arena.tsx`. Clean removal.

### 2. Magic numbers in environment geometry

Wall dimensions (22x8 background, 10x6 side walls, etc.) are not constants. Acceptable for placeholder geometry that will be replaced with 3D assets, but consider extracting if this grows.

### 3. No `castShadow` on environment meshes

Ground has `receiveShadow` but directional light and wall meshes have no `castShadow`. Shadows won't appear on the floor. Likely intentional for pixel-art style, but worth confirming intent.

---

## Positive Observations

1. **Boundary clamping is correctly applied in both code paths** of `moveToward` (snap-to-stop and incremental step) -- no gap in coverage
2. **`ARENA_BOUNDS` as const** -- prevents accidental mutation, good TypeScript practice
3. **Formation Z tightened from 2.0 to 1.5** matches beat-em-up shallow depth feel without cramping 3-entity rows
4. **Clean separation:** Visual constants (wall positions) stay in scene file, gameplay constants (ARENA_BOUNDS) stay in types file
5. **CombatEntitySprite direction logic** (`facingRight ? 'east' : 'west'`) already aligns with sidescroller left-right orientation -- no changes needed there

---

## Boundary Arithmetic Verification

| Constant | Value | Consistent? |
|---|---|---|
| Ground plane width | 20 (x: -10..+10) | Covers all bounds + walls |
| Ground plane depth | 10 (z: -5..+5) | Covers all bounds |
| ARENA_BOUNDS X | -8..+8 | Inside ground, inside walls |
| ARENA_BOUNDS Z | -4..+4 | Inside ground |
| Formation max X | 6 (back row enemy) | Inside bounds |
| Formation max Z | 1.5 | Inside bounds |
| Visual walls X | -10, +10 | Outside bounds (2-unit buffer) |
| Background wall Z | -5 | At ground edge, behind camera view |
| Camera position | [0, 7, 10] | Centered, elevated, looks down slightly |

All measurements are geometrically consistent.

---

## Recommended Actions

1. **No blockers** -- changes are safe to commit
2. **(Future)** Consider adding stuck-at-boundary detection if playtesting reveals corner-sticking behavior
3. **(Future)** Add `castShadow` to directional light if floor shadows are desired

---

## Metrics

- Type Coverage: Maintained (TSC clean)
- Test Coverage: N/A (visual-only changes, no testable logic added)
- Linting Issues: 0

---

## Unresolved Questions

- Is the lack of `castShadow` on the directional light intentional for the pixel-art aesthetic, or should beat-em-up floor shadows be added later?
