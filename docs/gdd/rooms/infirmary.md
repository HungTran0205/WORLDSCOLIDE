# Room: Infirmary

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS.infirmary`
**System:** injury recovery is applied via member `status`/`injuredUntil` fields in `src/game/state/game-state.ts`

## Purpose

Heals injured guild members. Not a production room — no resource output. Members with `status === 'injured'` are placed here to recover; they cannot be assigned to production or missions until healed.

## Build Requirements

- Cost: 300g (no material cost)
- Upgrades: +350g → Lv2, +600g → Lv3
- `maxSlots: [1, 2, 3]` — primary stats: END + INT
- Requires guild level 3 before appearing in build picker

## Recovery Model

Recovery slots are capped at the **party size** (number of members in one party):

- Example: 4-member party → 4 recovery slots max
- Members beyond the slot cap queue; queued members cannot join other rooms
- Queue slots can increase with Infirmary upgrades

Recovery time formula:

```
RecoveryTime = maxHp × 1.2 seconds
```

| maxHP | Recovery Time |
|-------|--------------|
| 100 | ~2 min |
| 200 | ~4 min |
| 300 | ~6 min |

## Interaction Rules

- Injured members **can** enter the Infirmary before fully recovered
- Members can be **withdrawn early** (returned to `idle`/`recovering` state), but cannot join production rooms or missions until HP is full
- While in Infirmary and HP not full: item repair/upgrade on that member is blocked
- If withdrawn and re-admitted: remaining healing time continues from where it left off

## Skip Option

When `remainingTime ≤ 5 minutes`: a **"Skip 5 min"** button appears — instantly completes recovery. One-shot per recovery session.

Premium instant recovery option also available (cost scales with remaining time or slot level). <!-- TODO: verify premium cost formula against code -->

## Merc vs Member Distinction

Guild members who reach HP = 0 in combat: status → `injured`, enter Infirmary on mission return.

**Tavern mercs who reach HP = 0: "Defeated" — do NOT enter Infirmary.** Mercs are temp-contract only; they despawn. See [`rooms/tavern.md`](tavern.md) §Merc System.

## Upgrade Path

Each level adds +1 recovery slot and reduces recovery time multiplier:

| Level | Slots | Unlocks |
|-------|-------|---------|
| 1 | 1 | Basic recovery |
| 2 | 2 | Faster recovery (END + INT scaling improves) |
| 3 | 3 | Queue overflow handling expanded |

<!-- TODO: verify per-level recovery time reduction factor against code -->

## References

- Member injury state: `src/game/state/game-state.ts` — `Member.status`, `Member.injuredUntil`
- Facility def: `src/game/data/facility-definitions.ts`
