---
phase: 7
title: "Narrative Unlock Gates"
status: complete
priority: P2
effort: "1h"
dependencies: [3]
---

# Phase 7: Narrative Unlock Gates

## Overview

Gate Stone Quarry and Alchemy Lab behind completed main quests: Stone Quarry unlocks after Q3 (`ft-ancient-threshold` — found minerals entering the cave), Alchemy Lab after Q4 (`ft-ruins-forgotten-age` — deep ruins cleared). Add `unlockQuestId?: string` to `FacilityDef`. `facility-detail-tray.tsx` already checks `buildMaterialCost` — extend it to also check `unlockQuestId` against `completedMissions`.

## Requirements

- Functional:
  - `FacilityDef` gets optional `unlockQuestId?: string`
  - Stone Quarry: `unlockQuestId: 'ft-ancient-threshold'` (Q3 — cave minerals)
  - Alchemy Lab: `unlockQuestId: 'ft-ruins-forgotten-age'` (Q4 — ruins cleared)
  - `facility-detail-tray.tsx`: if `unlockQuestId` set AND not in `completedMissions`, show "locked" state (grayed out, tooltip explains prerequisite)
  - Workshop has NO unlock gate (buildable after Guild Lv2, which is gold-gated)
  - Tavern, Logging Site, Guild Hall: no change

- Non-functional:
  - `completedMissions` already in store — no new store state
  - No migration needed — `unlockQuestId` is purely static config

## Architecture

```
FacilityDef.unlockQuestId? ──→ facility-detail-tray.tsx
                                  useGameStore(completedMissions)
                                  isLocked = unlockQuestId && !completedMissions.includes(unlockQuestId)
                                  → show locked UI (dim + tooltip)
```

## Related Code Files

- Modify: `src/game/data/facility-definitions.ts` (add `unlockQuestId` to interface + stone-quarry + alchemy-lab)
- Modify: `src/ui/components/facility-detail-tray.tsx` (read `unlockQuestId`, show locked state)
- Modify: `src/i18n/ui.en.json` + `src/i18n/ui.vi.json` (locked facility message)

## Implementation Steps

1. **`src/game/data/facility-definitions.ts`** — add to `FacilityDef` interface:
   ```typescript
   /** Quest ID that must be completed before this facility can be built. */
   unlockQuestId?: string;
   ```

2. **`src/game/data/facility-definitions.ts`** — in `FACILITY_DEFINITIONS`:
   ```typescript
   'stone-quarry': {
     // ...existing fields...
     unlockQuestId: 'ft-ancient-threshold',  // cave entrance — STONE scripted drop ties here
   },
   'alchemy-lab': {
     // ...existing fields...
     unlockQuestId: 'ft-ruins-forgotten-age',  // ruins cleared — ether + materials available
   },
   ```

3. **`src/ui/components/facility-detail-tray.tsx`**:
   - Add store selector: `const completedMissions = useGameStore((s) => s.completedMissions);`
   - Add derived: `const isNarrativeLocked = !!(def.unlockQuestId && !completedMissions.includes(def.unlockQuestId));`
   - In the existing `affordable` / button-disable logic: add `&& !isNarrativeLocked` to the `canBuild` check
   - Add locked message below build cost (only if `isNarrativeLocked`):
     ```tsx
     {isNarrativeLocked && (
       <p style={{ color: '#888', fontSize: '0.75rem', fontStyle: 'italic' }}>
         {t('facilityTray.lockedByQuest')}
       </p>
     )}
     ```

4. **i18n keys**:
   - EN: `"facilityTray.lockedByQuest": "Complete the main quest to unlock this facility."`
   - VN: `"facilityTray.lockedByQuest": "Hoàn thành nhiệm vụ chính để mở khoá cơ sở này."`

5. **`npm run build`** + verify Stone Quarry shows locked before Q2 complete.

## Success Criteria

- [x] `FacilityDef.unlockQuestId?: string` added to interface
- [x] `stone-quarry` has `unlockQuestId: 'ft-ancient-threshold'`
- [x] `alchemy-lab` has `unlockQuestId: 'ft-ruins-forgotten-age'`
- [x] `facility-detail-tray.tsx` checks `unlockQuestId` vs `completedMissions` and blocks Build button
- [x] Locked message shown with i18n key in EN + VN
- [x] Workshop, Tavern, Logging Site unaffected (no `unlockQuestId`)
- [x] `npm run build` passes
- [x] Store-layer guard added in `guild-slice.ts buildFacility` (defense-in-depth, mirrors UI gate)
- [x] All 595 tests pass

## Risk Assessment

- **`completedMissions` selector**: Already used in `quest-board.tsx:39` — same pattern. No new store API.
- **Build button disable logic**: facility-detail-tray's `affordable` check is at line ~212. Read the full condition before adding `&& !isNarrativeLocked` to avoid breaking existing material-cost gate.
- **Existing save loads**: `unlockQuestId` is static config, not saved. No migration needed. New quest IDs (`ft-ancient-threshold`, `ft-ruins-forgotten-age`) won't exist in old saves → both facilities locked on old saves until player re-completes Q3/Q4. Acceptable for a fresh arc reset.
