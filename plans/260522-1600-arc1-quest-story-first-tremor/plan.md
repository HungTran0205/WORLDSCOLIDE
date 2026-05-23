---
title: "Arc 1 Quest Story — First Tremor"
description: "Implement full Arc 1 'The First Tremor' quest chain: day-cycle recalibration, enemy/item data, 5 main quests + 5 expeditions, 2 new combat maps, quest board MAIN/EXPEDITION tabs, pre-arrival dialog system, and narrative facility unlock gates."
status: complete
priority: P1
created: 2026-05-22
branch: feature/WC-QuestStory
tags:
  - quest-story
  - arc1
  - combat-maps
  - dialog
  - facility
blockedBy: []
blocks: []
---

# Arc 1 Quest Story — First Tremor

## Overview

Design source: `plans/reports/260522-1300-arc1-quest-flow-design.md` (FINALIZED)

Implements the first 2-hour arc post-tutorial: 5 chained main quests following a causal narrative —
**bats flee cave → slimes invade forest → ancient ruins underground (2000-yr dormant machines) → Slime King (petroleum + ether creature from deep crack)**
— with narrative facility unlock gates, bilingual pre/post-combat dialog, and 2 new combat maps.

**No Đế Quốc narrative. Machines are prehistoric ruins, origin unknown.**

## Phases

| Phase | Name | Status | Effort | Priority |
|-------|------|--------|--------|----------|
| 1 | [Types & Save](./phase-01-types-save.md) | Complete | 1h | P1 |
| 2 | [Data Layer](./phase-02-data-layer.md) | Complete | 2h | P1 |
| 3 | [Quest Chain](./phase-03-quest-chain.md) | Complete | 2h | P1 |
| 4 | [Combat Maps](./phase-04-combat-maps.md) | Complete | 2h | P2 |
| 5 | [Quest Board UI](./phase-05-quest-board-ui.md) | Complete | 2h | P1 |
| 6 | [Pre-Arrival Dialog](./phase-06-pre-arrival-dialog.md) | Complete | 2h | P1 |
| 7 | [Narrative Unlock Gates](./phase-07-narrative-unlock-gates.md) | Complete | 1h | P2 |

## Execution Order

Phases 1→2→3 must be sequential (type deps). Phase 4 can run parallel with 5, 6, 7 after Phase 3.

## Key Files

| File | Phase |
|------|-------|
| `src/game/state/game-state.ts` | 1 |
| `src/game/save/save-migrations.ts` | 1 |
| `src/game/systems/facility-production-system.ts` | 2 |
| `src/game/systems/offline-progression.ts` | 2 |
| `src/ui/hooks/use-game-tick-loop.ts` | 2 |
| `src/game/data/facility-definitions.ts` | 2 |
| `src/game/data/enemies.ts` | 2 |
| `src/game/data/items.ts` | 2 |
| `src/game/data/missions.ts` | 3 |
| `src/scene/combat/maps/combat-map-registry.ts` | 4 |
| `src/scene/combat/maps/stages/crystal-cave.ts` | 4 (new) |
| `src/scene/combat/maps/stages/underground-entrance.ts` | 4 (new) |
| `src/ui/panels/quest-board.tsx` | 5 |
| `src/ui/panels/arrival-modal.tsx` | 6 |
| `src/ui/panels/combat-panel.tsx` | 6 |
| `src/game/data/facility-definitions.ts` | 7 |
| `src/ui/components/facility-detail-tray.tsx` | 7 |

## Validation Log

### Session 1 — 2026-05-22
**Trigger:** `/ck:plan validate` post red-team
**Questions asked:** 4

#### Verification Results
- **Tier:** Full (7 phases)
- **Claims checked:** 24
- **Verified:** 21 | **Failed:** 2 | **Unverified:** 1

#### Failures
1. [Fact Checker] Phase 4 risk note said "`spawnAnchors` may not be required" — FAILED. `stage-spec-types.ts:116` confirms it is required. Fixed in phase-04.
2. [Flow Tracer] Phase 6 said "find in `combat-panel.tsx` or `use-game-tick-loop.ts`" — FAILED. `setResult` is called only in `combat-fight-controller.tsx:72`. Fixed in phase-06.

#### Unverified
1. [Fact Checker] `SpawnSlot` exact field names in `stage-spec-types.ts` — implementer must read before writing stage specs.

#### Questions & Answers

1. **[Architecture]** Phase 4 spawn anchors approach for new maps?
   - Options: Copy lolo geometry adjusted | Mirror broken-cliff | Define unique
   - **Answer:** Copy lolo-village geometry, adjust X offsets
   - **Rationale:** Proven pattern, minimal risk; stage geometry can be refined with art pass later.

2. **[Scope]** Phase 3 missions.ts exceeds 200-line rule — split strategy?
   - Options: Create missions-arc1-first-tremor.ts | Accept oversize | Split tutorial out
   - **Answer:** Create `missions-arc1-first-tremor.ts`, re-export from `missions.ts`
   - **Rationale:** Respects file-size rule; clean chapter separation for future arcs.

3. **[Architecture]** Phase 6 post-combat dialog injection point?
   - Options: story-dialog phase in store + fight-controller | Local state in fight-controller | Skip for MVP
   - **Answer:** Add `story-dialog` phase to `combat-panel-store`, inject in `combat-fight-controller.tsx:72`
   - **Rationale:** Clean state machine; avoids prop-drilling; `phase === 'story-dialog'` is auditable in store.

4. **[Assumptions]** Phase 2 flying-drone `flying: true` flag?
   - Options: Yes add it | No skip it
   - **Answer:** Yes, add `flying: true`
   - **Rationale:** `Enemy.flying` confirmed present at `enemies.ts:24`. Correct thematic behavior.

#### Confirmed Decisions
- SAVE_VERSION: 27 → 28 (additive migration, no data transform)
- missions.ts split: Arc 1 quests in `missions-arc1-first-tremor.ts`
- spawnAnchors: required, use lolo geometry adjusted for new platform X offsets
- Post-combat dialog: `story-dialog` phase in `combat-panel-store`, injected at `fight-controller:72`
- flying-drone: `flying: true`
- stun-attack + enrage: already valid ability types, no union change needed

#### Action Items
- [x] Phase 1: bump SAVE_VERSION 27 → 28
- [ ] Phase 2: add `flying: true` to flying-drone
- [x] Phase 3: create `missions-arc1-first-tremor.ts` (done — incl. VN overlay in content.vi.json for coverage test)
- [x] Phase 4: include `spawnAnchors` (read SpawnSlot type first) — done; mirrored broken-cliff geometry
- [ ] Phase 6: add `story-dialog` phase to store + wire fight-controller

#### Impact on Phases
- Phase 1: Save version number specified (27→28)
- Phase 2: flying-drone gets `flying: true`; ability types confirmed safe
- Phase 3: new file `missions-arc1-first-tremor.ts` + missions.ts as aggregator
- Phase 4: spawnAnchors required; risk note corrected
- Phase 6: fight-controller injection confirmed; store gets story-dialog phase

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 through phase-07
- Decision deltas checked: 5
- Reconciled stale references: 6 (ability union, flying flag, spawnAnchors risk note, setResult location, phase injection, file split)
- Unresolved contradictions: 0

### Session 2 — 2026-05-22 (Narrative Revision)
**Trigger:** User story redesign — new causal narrative for Arc 1

**Quest chain rewritten (phase-03):**

| # | Old ID / Zone | New ID / Zone |
|---|--------------|--------------|
| Q1 | ft-strange-rumbles / Village Outskirts (slimes) | ft-strange-exodus / Forest Edge (bats) |
| Q2 | ft-echoes-below / Crystal Cave (bats) | ft-path-to-depths / Deep Forest (slimes) |
| Q3 | ft-iron-wings / Abandoned Mine (drones) | ft-ancient-threshold / Cave Entrance (drones) |
| Q4 | ft-steel-claws / Underground Entrance (robots) | ft-ruins-forgotten-age / Underground Ruins (robots) |
| Q5 | ft-slime-throne / Crystal Throne Room | ft-slime-sovereign / Ancient Core |

**Narrative changes:**
- Slime King is no longer a captured power source — it's a petroleum + ether creature formed naturally in a deep earth crack
- No Đế Quốc faction. Machines are 2000-year-old prehistoric ruins, civilization unknown
- Bats (Q1) fled cave because slimes (Q2) invaded. Slimes drove animals out. Machines woke defending the core. Slime King is the source.

**Phase updates propagated:**
- phase-03: fully rewritten with new quest IDs, zones, dialog, narrative logic table
- phase-04: ZONE_TO_MAP updated to new zone names (Forest Edge, Deep Forest, Cave Entrance, Underground Ruins, Ancient Core)
- phase-07: unlockQuestId updated (stone-quarry → ft-ancient-threshold, alchemy-lab → ft-ruins-forgotten-age)
- plan.md: overview updated

**Consistency check:** Phase 2 enemies (cave-bat, slime, flying-drone, dog-robot) unchanged — same enemies, new ordering. Phase 5 quest board logic unchanged — reads isMainQuest/isExpedition flags. Phase 6 dialog mechanism unchanged. Phase 1 types unchanged. No unresolved contradictions.

---

## Open Questions (resolved in plan)

- **buildMaterialCost UI**: Already wired in `facility-detail-tray.tsx:212,220,254` — no new UI needed.
- **narrativeUnlock gate**: Use `completedMissions[]` (already in store + save) + new `unlockQuestId?` field on `FacilityDef`. No key-item needed.
- **Pre-arrival dialog trigger**: `arrival-modal.tsx` already shown at `traveling→arrived` transition — extend it with dialog lines before "Enter Battle".
- **Placeholder tiles**: Use existing `ruined-village_000X.png` / `cracked-stone-wall_0001.png` tiles for new maps until art pass.
