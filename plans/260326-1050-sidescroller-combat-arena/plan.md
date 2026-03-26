---
status: complete
brainstorm: plans/reports/brainstorm-260326-1050-sidescroller-combat-arena.md
---

# Sidescroller Combat Arena

Transform combat arena from isometric view to beat-em-up sidescroller style.

## Context
- Brainstorm: [brainstorm report](../reports/brainstorm-260326-1050-sidescroller-combat-arena.md)
- Branch: `main`
- Scope: ~65 lines changed, 4 files modified, 0 new files

## Phases

| # | Phase | Status | Files |
|---|-------|--------|-------|
| 1 | [Camera & Layout](phase-01-camera-and-layout.md) | complete | combat-arena.tsx, combat-arena-types.ts, combat-ai.ts |
| 2 | [Arena Environment](phase-02-arena-environment.md) | complete | combat-arena-environment.tsx |

## Key Decisions
- Orthographic camera at [0, 7, 10] → ~35° beat-em-up angle
- Formation Z spread tightened [-1.5, 0, 1.5] for beat-em-up feel
- Invisible walls X:[-8,8] Z:[-4,4]
- Placeholder environment — user replaces with 3D objects later
- Billboard sprites unchanged — auto-face camera works at any angle
- No new animations in this phase

## Dependencies
- None — purely visual/layout change, no new data models or game logic

## Risk
LOW — all changes are rendering/constants, existing combat logic untouched.
