# UI Facilities & Navigation Improvements

**Date**: 2026-04-10 19:42
**Severity**: Low
**Component**: UI/Game Mechanics
**Status**: Resolved

## What Happened

Delivered 5 focused UI improvements in single sprint: stat allocation buttons, new facility types, camera controls, menu restructure, and room navigation bar. All TypeScript compilation successful, committed cleanly.

## The Brutal Truth

Nothing broke, which feels suspicious given the scope. Five unrelated features touched in one session without merge conflicts or runtime errors. Code volume across all changes stayed reasonable (~400 lines delta). The real risk isn't what we shipped—it's that future devs won't understand *why* these five things got bundled together if they don't read the plan.

## Technical Details

**1. Stat Allocation (+5 Button)**
- Modified `allocateStat(archetype, stat, amount?)` to accept optional amount parameter
- Added button UI to character-detail-panel and member-book-detail-page
- Guard: only shows when `unallocatedPoints >= 5`

**2. New Facility Types**
- Logging Site & Stone Quarry added to FacilityTypes enum
- Extraction formula: `gatherSpeed = STR * 0.004` (balanced with existing facilities)
- Updates: game-state, facility-definitions, guild-slice, production system, facility-card bonus preview, DEFAULT_FACILITIES

**3. WASD Camera Pan**
- Merged ESC + WASD handlers in HomeButton
- Pans camera in facility rooms, explicitly disabled at guild hall
- No intervention mode (safe)

**4. Build Menu Simplification**
- Removed FloorTab, build-menu.tsx now renders FurnitureTab directly
- Reduced cognitive load in construction UI

**5. Room Navigation Bar**
- New: src/ui/hud/room-nav-bar.tsx
- Icon buttons above PanelToggle navigate camera to built rooms
- 2 new isometric icons from PixelLab (lumber camp, rock mine)

## Root Cause Analysis

Plan was well-scoped but items should've been smaller PRs. Bundling unrelated features reduces reviewability and increases merge risk in parallel development. Five-in-one worked *this time* because overlap was minimal and tests caught nothing.

## Lessons Learned

- **Keep sprints granular**: Even if all items fit one session, split across commits/PRs for team clarity
- **Icon dependencies need early planning**: Waiting on PixelLab shouldn't block other work—request parallel
- **Test camera controls thoroughly**: WASD disabling logic is easy to break if guild-hall state logic changes

## Next Steps

- Monitor room-nav-bar.tsx for UX feedback (button placement, icon clarity)
- Verify facility extraction formula doesn't break progression balance (STR scaling)
- Watch for merge conflicts if any team members working on facility definitions

**File paths:**
- src/ui/hud/room-nav-bar.tsx (new)
- src/game/state/game-state.ts
- src/ui/panels/build-menu.tsx
- src/ui/screens/game-screen.tsx
