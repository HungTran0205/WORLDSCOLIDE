# MVP Recruit Gating, VN Names & Roster Rename — Completed

**Date**: 2026-05-22 10:50  
**Severity**: High (MVP blocker)  
**Component**: Tavern recruitment, character naming, roster management  
**Status**: Resolved (ready for in-app review)

## What Happened

Shipped three coupled fixes for itch.io MVP (Linh Sơn, Act 1):

1. **Recruit gating** — tavern can only spawn 3 playable units: Templar (sword+M), Forester (warrior+M), Ranger (scout+F). NPC-only sprites LS-SCOUT-M and LS-WARRIOR-F made permanently unrecruitable.
2. **VN name pool** — replaced `Warrior #1a2b` placeholder names with deterministic 44-name Vietnamese pool, distinct within each day.
3. **Roster rename** — players can rename non-founder, non-mercenary roster members; founder name locked.

All three fixes integrated into single spawn-layer refactor: `TavernVisitor` now carries name + gender deterministically assigned at spawn, consumed consistently across all hire sites.

## The Brutal Truth

This was tighter than expected. The root problem wasn't the archetype allow-list (that was already correct); it was that **three independent sites invented gender at hire time**, resulting in scouts rendering as male (LS-SCOUT-M sprite) and making Ranger (scout+F) literally impossible to recruit. The fact that a visual bug was actually a recruitment bug felt like a mugging—discovered during in-app testing, not in static analysis.

Also, the save migration backfill hit 4 persist locations (currentRoster + visitorSnapshot in mercContracts/pendingPrompts/veteranPool), not 3. Scout found the initial 3; code review caught the 4th in the counter-offer modal. That's on me for not grepping the pattern repo-wide the first time.

## Technical Details

**Gender bug specifics:**
- `getSpritePath(archetype, gender)` was hardcoded `'M'` in tavern-visitor-card.tsx:46, tavern-panel.tsx:102, tavern-audition.ts:105
- Ranger archetype is `scout` with required gender `'F'`; hardcoded male spawn meant Ranger portrait + contract showed female, but actual sprite render was male
- Scout under-counted: missed counter-offer modal (tavern-panel.tsx:75, setRosterName setState-in-effect) and negotiate modal

**Recruitable units gating:**
```typescript
// LinhSon.recruitable_units = [
//   { archetype: 'sword', gender: 'M' },    // Templar
//   { archetype: 'warrior', gender: 'M' },  // Forester
//   { archetype: 'scout', gender: 'F' }     // Ranger
// ]
```
Disallowed `(scout, 'M')` and `(warrior, 'F')` by construction — those sprite assets unspawnable.

**Name pool:**
- 44-entry Vietnamese names, seeded on day-of-spawn (stable across reload)
- Linear-probe on archetype quota (constant draw count, deterministic, doesn't need per-session state)
- Backfilled onto all 4 persisted visitor snapshots via save v26→v27 migration

**Test coverage:**
- 586/586 tests green (21 new/updated, mostly visitor spawn + roster rename mutations)
- tsc clean, vite build clean, eslint clean on new code

## What We Tried

1. **Initial scout:** read hire sites, found 3 hardcoded `'M'` → assumed that was complete fix
2. **Code review catch:** found 4th site (counter-offer modal), grep-ed full pattern `getSpritePath(.*'M')` → found 2 more
3. **Gender vs. archetype:** realized the bug was gender-layer, not archetype-layer (archetype gating was already working)
4. **Spawn layer fix:** moved name+gender assignment from hire sites to `tavern-spawn.ts`, added to `TavernVisitor` shape, updated 4 persist locations in save migration

## Root Cause Analysis

**Why did gender inversion happen?**
- `TavernVisitor` type had no name or gender field; three independent sites (`tavern-visitor-card`, `tavern-panel`, `tavern-audition`) each invented both.
- Hire sites defaulted gender to `'M'` as a catch-all; designer didn't codify Ranger as female-only until design locked.
- Result: three sources of truth, all wrong.

**Why wasn't archetype gating caught earlier?**
- It wasn't broken—`LinhSon.archetypes` already excluded NPC-only types. But the gender bug masked a second problem: Ranger was literally unrecruitable because the hire layer hardcoded male.
- Static allow-list checks passed; runtime sprite lookup failed silently (portrait rendered fine, game sprite was wrong).

**Why backfill touches 4 locations, not 3?**
- currentRoster and visitorSnapshot were the obvious ones
- mercContracts.visitorSnapshot and pendingPrompts.visitorSnapshot weren't initially obvious; they cache visitor state for retry/counter-offer flows
- Initial scout hit currentRoster + visitorSnapshot (tavern-visitor-card, tavern-panel) but missed the contract persistence layer

## Lessons Learned

1. **Grep the pattern, not the read set.** When removing a hardcoded literal from one place, search the entire pattern repo-wide (`getSpritePath.*'M'`), not just the files you read. The 4th site wasn't in my initial file list because it was in an unrelated modal.

2. **Spawn layer owns truth.** Assigning name+gender once at spawn, with `TavernVisitor` carrying both, eliminated 3 sites of inconsistency. This also fixed the portrait card which a hire-time patch would've missed because the portrait is rendered before hire sites run.

3. **Gender is not derived from archetype (yet).** Future refactor could map archetype→gender in a single place. For MVP, encoding `(archetype, gender)` tuples in `RECRUITABLE_UNITS` is correct: it's explicit and gating works by construction.

4. **Save migrations cascade.** When you add a field to a persisted type, grep all persist locations (currentRoster, mercContracts snapshots, veteranPool snapshots, etc.). Don't assume the most obvious location is the only one.

5. **Two pre-existing lint errors untouched.** `save-migrations.ts:481` has `_drop` unused var; `tavern-panel.tsx:75` has setState-in-effect. Both in code this change never touched (verified via git blame). Scope discipline: don't expand into a risky behavioral refactor when the real bug is gender assignment.

## Next Steps

- In-app review: player recruits Ranger (should be female), visits tavern again (name should be stable across reload), renames non-founder member, founder rename blocked
- If any bugs surface: hotfix branch from feature/WC-QuestStory
- After approval: commit as single PR, merge to main, prepare itch.io upload

No blocking issues. 586 tests green. Ready for player testing.

## Files Changed (Summary)

- `src/game/data/characters.ts` — added RECRUITABLE_UNITS per civ
- `src/game/data/names.ts` — new 44-entry VN name pool
- `src/ui/panels/tavern-spawn.ts` — name+gender assigned here (source of truth)
- `src/ui/panels/tavern-visitor-card.tsx`, `tavern-panel.tsx`, `tavern-audition.ts` — consume `visitor.name`, `visitor.gender` (removed hardcoded 'M')
- `src/ui/panels/roster-rename-modal.tsx` — new rename form, founder gating
- `src/game/systems/save-migrations.ts` — v26→v27 backfill (name+gender on 4 persist locations)
- Deleted: `src/game/data/mercenary-generator.ts` (dead code, unused since i18n refactor)
