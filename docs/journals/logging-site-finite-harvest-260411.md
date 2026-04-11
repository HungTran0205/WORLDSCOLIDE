# Logging Site — Finite Harvest System (v1.18.0)

**Date:** 2026-04-11  
**Feature:** Logging Site Finite Harvest System  
**Status:** Complete

## Technical Decisions

### 1. Dual Architecture (Daily + Per-Tick)
Existing facility production runs per game-day (offline catch-up). Logging site needed per-tick (1s) responsiveness. Solution: kept daily system for passive facilities; added `processLoggingSiteTick()` called every second from tick loop. Avoids rearchitecting core system while achieving granularity.

### 2. WC Skill as XP Proxy
Wood harvested = XP directly (`xpAccumulated = total wood ever cut`). No separate XP counter. Level-up via 11 threshold lookups. Clean and tight.

### 3. Floating-Point Reserve Clamping
Per-tick depletion accumulates float errors. Guard: `Math.max(0, reserve - produced)` prevents negatives. Reserve stored as float in state to preserve precision across ticks.

### 4. Permit-Only Gate via Build Cost
Added no new FacilityDef field. Instead: `buildCost: 0` signals permit-required. Gate logic in `buildFacility()` action (explicit logging-site check). UI derives from `isLoggingSite` flag. Keeps data model lean.

### 5. Optional upgradeCosts
Made `upgradeCosts?: [number, number]` optional in FacilityDef to support logging-site's no-upgrade design. Updated `upgradeFacility` to guard against undefined.

### 6. Save Migration (v13→v14)
- Added `craftSkills` to all members (including tavern mercenaries)
- Added `woodReserve` to all facilities
- Existing built logging sites get 1000 wood to prevent surprise depletion on load

### 7. DepletedFacilityCard Inline Component
Kept ~30 lines inline in facility-card.tsx. Shows Remove button only — no assign UI. Clean early-return guard.

## Execution Notes

**Smooth:**
- All 39 save migration tests passed first try
- TypeScript type narrowing with optional `craftSkills?` worked well
- R3F `<Html>` floating card integration clean

**Tricky:**
- `Set<'logging-site'>` type conflict in guild-slice required explicit `new Set<string>()` cast
- Removed erroneous double-import of `calcWcLevel` (doesn't exist in facility-definitions.ts, only in facility-production-system.ts)

## Lessons for Future

- Dual-architecture approach (daily + per-tick) works well when core system rearchitect isn't viable
- Using semantic model properties as gates (e.g., `buildCost: 0`) keeps migration burden light
- Early-return guards in component render reduce cognitive complexity of conditional UI logic
