# Civilization Sync: Passive Rework Implementation Complete

**Date**: 2026-04-04 21:55
**Severity**: Medium
**Component**: Combat passive abilities, civilization stat bonuses, combat formulas
**Status**: Resolved

## What Happened

Executed 4-phase civilization sync plan to harmonize civil.md/LORE.md documentation with codebase combat mechanics. All 95 tests pass, including 16 new passive unit tests. Plan marked Complete.

## The Brutal Truth

This was execution on a known spec — research work was already done in prior session. Felt more like plumbing than innovation. But plumbing matters: the stat mismatches between docs and code were creating cognitive debt. When H checks the code later, the passive descriptions now match what actually fires. No more "wait, why does the code say DEX when the doc says AGI?" moments at 3am.

## Technical Details

### Phase 1: Stat Bonus Corrections
- **DeQuoc**: Fixed DEX→AGI bonus (all ranks 1-5)
- **ThienLu**: Fixed CHA→DEX bonus (all ranks 1-5)
- **LinhSon**: Stat bonuses unchanged (already correct)
- Impact: Character stat calculations now reflect documented design

### Phase 2: LinhSon Sơn Thể Rework
**Old behavior**: Passive buff when healthy (+5% dmg, +50% crit, +2 dodge on all stats)
**New behavior**: Last-stand buff at HP ≤ 30% (END+30% only, 5-second duration, triggers once per combat)

Technical implementation:
```
Trigger: currentHP / maxHP <= 0.30
Effect: +30 END only (removed STR/DEX/AGI/CHA additions)
Duration: 5 seconds
Can reapply: Yes (buff expires, new trigger fires if still HP ≤ 30%)
```

Removed the DEX component because it was redundant with dodge mechanics. The "last stand" concept is cleaner: heal up or die, no partial bonus healing.

### Phase 3: DeQuoc Điện Thế Chỉ Huy Rework
**Old behavior**: Self-only 5-stack buff cycling CHA→INT over 10 seconds
**New behavior**: Team 3-stack Shock debuff + team +5% crit/dmg bonus for 5 seconds

Technical implementation:
```
Primary effect: Apply Shock debuff to all enemies (3 stacks)
  Shock = skip 1 combat tick (semantically similar to stun, but duration 1 tick only)
  Rationale: No "slow" mechanic exists in tick-based combat; Shock fits the "electrical" theme

Secondary effect: Team buff flag (_hasDeQuocBuff)
  +5% crit chance, +5% damage dealt
  Duration: 5 seconds
  Implementation: Boolean flag on entity (avoids stat revert complexity of stacking buffs)

Cooldown: Ability cooldown (phase file implies 1-per-engagement usage)
```

The shift from self-buffing support to team-wide offensive utility is intentional. H said "he's a leader" — leaders enable the team, not themselves.

### Phase 4: ThienLu Tinh Lộ Rework
**Old behavior**: +10% AGI, +10% dodge, init bonus
**New behavior**: 2-tier hit stacking → crit/clone effects

Technical implementation:
```
Tier 1 (5 hits landed): +100% crit damage for 5 seconds
  - Hit counter resets after tier 1 triggers
  - Stacks with other crit sources

Tier 2 (15 total hits in engagement): +1 clone action per auto-attack tick
  - Clone = extra attack roll (not a separate entity)
  - No HP, not targetable, scales with parent stats
  - Active for 5 seconds
  - Hit counter never fully resets (tracks per-engagement)

Edge case: If Tier 2 activates during Tier 1 buff duration, both are active.
```

The shift from "stat boost" to "action economy" is a big design change. Instead of passive bonuses, ThienLu now plays like a fast-attack swashbuckler who gets rewarded for sustained hits. Mechanically fits the "Tinh Lộ" (精妙 = exquisite, subtle) theme.

## What We Tried

1. **Passive state representation**: Initially considered separate buff entity objects for each passive. Rejected — combat already tracks passives by ID; creating ghost entities added complexity.
2. **Clone implementation**: Considered a full "summon" entity. Rejected — H specified "no HP, not targetable"; extra code for partial entity was overkill. Simple flag + extra roll per tick is sufficient.
3. **Shock vs Stun naming**: Debated whether to use existing stun. Rejected — Shock (electrical effect) semantically fits DeQuoc's theme; 1-tick duration distinguishes it from stun. Tick-based combat has no "slow" so we use Shock as the crowd-control.
4. **Team buff state management**: Started with array of debuffs applied to each enemy. Switched to boolean flag (_hasDeQuocBuff) on each entity. Simpler: no reverting stat values on expiry, just flag check in damage calc.

## Root Cause Analysis

Why was there a sync issue in the first place?

1. **Passive reworks live in multiple places**: civil.md is narrative + mechanics flavor text. LORE.md is world-building. codebase is implementation. They diverged during iteration.
2. **No single source of truth enforcement**: The plan itself was created ad-hoc from H's feedback. No process prevents a coder from changing a passive without updating docs.
3. **Test coverage gap**: We had tests for passive triggers, but no "passive intent tests" that verify descriptions match behavior. Added 16 new tests that check both.

## Lessons Learned

1. **Passive abilities are high-leverage**: Small description changes (HP threshold, cooldown, team vs self) cascade into combat dynamics. These need explicit design sign-off before coding.

2. **Tick-based systems benefit from explicit vocabulary**: "Shock" vs "Stun" vs "Slow" — without clear definitions, devs guess. We now have:
   - **Stun**: Skip 1 tick (can stack in duration, tested elsewhere)
   - **Shock**: Skip 1 tick, thematic to electrical (DeQuoc)
   - No "slow" concept yet (if needed, will be % tick reduction)

3. **Team vs self-buff is a design inflection point**: DeQuoc went from selfish support (self 5-stack buff) to true leader (team 3-stack debuff + team bonus). This is a role clarification that should've been in the initial spec, not discovered mid-implementation.

4. **Stat revert on buff expiry is fragile**: Storing modified values and reverting them works until you have overlapping buffs. The boolean flag approach (_hasDeQuocBuff in damage calc) is cleaner for simple on/off bonuses.

5. **Hit counters and clones need explicit semantics**: "15 total hits" vs "15 consecutive hits" — we went with total-per-engagement. Clone is "extra roll, not an entity" — document this because the next person will assume "clone" means a summon.

## Next Steps

1. **Documentation sync complete**: civil.md/LORE.md/codebase now aligned.
2. **Test coverage expanded**: 16 new passive unit tests lock in the new behavior.
3. **No breaking changes for players**: Passive reworks are mid-design; no save data to migrate.
4. **Future protection**: If passives change again, update docs + tests in same commit. No async sync.

**Owner**: Implementation complete. Code-reviewer has blessed the changes.

**Timeline**: All 4 phases completed in single session. Zero blockers.

## Code Files Modified

- `src/game/systems/combat-formulas.ts` — DeQuoc/ThienLu stat bonus corrections, Shock debuff application
- `src/game/systems/combat-entity-factory.ts` — Passive state initialization, clone action setup
- `src/game/state/combat-arena-slice.ts` — Team buff flag (_hasDeQuocBuff), passive state tracking
- `tests/passive-abilities.test.ts` — 16 new tests (stat bonuses, Shock, Sơn Thể threshold, Tinh Lộ stacking)

**Test results**: 95/95 passing

---

## Emotional Checkpoint

Satisfaction is high here. The passives were nebulous before (docs vs code mismatch), and now they're locked in. The hit-stacking mechanic for ThienLu feels genuinely interesting — players who spam attacks get rewarded with exponential scaling. DeQuoc's shift to team leader is thematic and changes team composition strategy (no longer a self-buff utility, now a crit/debuff enabler).

One minor frustration: we discovered the Shock/Stun distinction was missing from the tick-based system vocabulary. Should've been in the combat-types.ts from day one. Not a blocker, just adds a small amount of cognitive overhead when H reads the code.

**Final status**: Ready for merge, tests locked in, no known regressions.
