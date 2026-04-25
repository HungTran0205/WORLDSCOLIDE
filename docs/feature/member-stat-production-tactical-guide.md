# Member Stat Production (Pool-Based) — Tactical Guide & Tuning

**Date:** 2026-04-23  
**Status:** Implementation Ready  
**Focus:** Practical tuning, player communication, and validation

---

## Quick Reference: Pool-Based System

**One Formula:**
```
Total Production = Base × (1 + k × TotalStats/400)
Per-Member = Total / MemberCount
```

**Key Parameters:**
- k = 1.5 (recommended)
- Base: Stone=100, Magic=50, Wood=150
- MaxStats = 400 (8 × 50)

---

## Section 1: Production Lookup Tables (k=1.5)

### 1.1 Stone Mining (Base 100, STR)

| Pool | Multiplier | Total | 1-Member | 2-Member | 4-Member | 8-Member |
|------|-----------|-------|----------|----------|----------|----------|
| 50 | 1.188 | 118.75 | 118.75 | 59.4 | 29.7 | 14.8 |
| 100 | 1.375 | 137.5 | 137.5 | 68.75 | 34.4 | 17.2 |
| 150 | 1.563 | 156.25 | 156.25 | 78.1 | 39.1 | 19.5 |
| 200 | 1.75 | 175 | 175 | 87.5 | 43.75 | 21.9 |
| 250 | 1.938 | 193.75 | 193.75 | 96.9 | 48.4 | 24.2 |
| 300 | 2.125 | 212.5 | 212.5 | 106.25 | 53.1 | 26.6 |
| 350 | 2.313 | 231.25 | 231.25 | 115.6 | 57.8 | 28.9 |
| 400 | 2.5 | 250 | 250 | 125 | 62.5 | 31.25 |

**Quick Read:** 8×STR50 = 250 total (31.25 each) | Solo STR50 = 119 total

### 1.2 Wood Extraction (Base 150, AGI)

| Pool | Multiplier | Total | 1-Member | 2-Member | 4-Member | 8-Member |
|------|-----------|-------|----------|----------|----------|----------|
| 50 | 1.188 | 178.1 | 178.1 | 89.1 | 44.5 | 22.3 |
| 100 | 1.375 | 206.25 | 206.25 | 103.1 | 51.6 | 25.8 |
| 200 | 1.75 | 262.5 | 262.5 | 131.25 | 65.6 | 32.8 |
| 300 | 2.125 | 318.75 | 318.75 | 159.4 | 79.7 | 39.8 |
| 400 | 2.5 | 375 | 375 | 187.5 | 93.75 | 46.9 |

**Quick Read:** 8×AGI50 = 375 total (47 each) | Solo AGI50 = 178 total

### 1.3 Magic Extraction (Base 50, INT)

| Pool | Multiplier | Total | 1-Member | 2-Member | 4-Member | 8-Member |
|------|-----------|-------|----------|----------|----------|----------|
| 50 | 1.188 | 59.4 | 59.4 | 29.7 | 14.8 | 7.4 |
| 100 | 1.375 | 68.75 | 68.75 | 34.4 | 17.2 | 8.6 |
| 200 | 1.75 | 87.5 | 87.5 | 43.75 | 21.9 | 10.9 |
| 300 | 2.125 | 106.25 | 106.25 | 53.1 | 26.6 | 13.3 |
| 400 | 2.5 | 125 | 125 | 62.5 | 31.25 | 15.6 |

**Quick Read:** 8×INT50 = 125 total (15.6 each) | Solo INT50 = 59 total

---

## Section 2: Tuning Strategy (If Playtest Shows Issues)

### 2.1 Tuning Table

| Symptom | Cause | Fix | New k | Result |
|---------|-------|-----|-------|--------|
| **Production too slow (player complaints)** | k too low | Increase k | 1.5 → 1.8 | +20% output |
| **Hoarding/economy broken** | k too high | Decrease k | 1.5 → 1.2 | -20% output |
| **Early game grindy** | Low-stat penalty | Already ok* | Keep 1.5 | STR10 = +13% |
| **Endgame trivial** | Max team too OP | Increase k or reduce Base | k or Base | See below |
| **Solo feels weak vs old design** | Reduced from 243 to 119 | OK by design** | Keep 1.5 | Teamwork encouraged |

*STR 10 solo = 50×1.038 = 51.9 (vs base 50) = +3.75% — small but acceptable.  
**Old design solo hero (243) discouraged grouping. New design (119) encourages teams.

### 2.2 Iterative Tuning (Week-by-Week)

**Week 1: Launch with k=1.5**
```
Collect feedback:
- "Too slow / Too fast?"
- "Solo feels weak / balanced / OP?"
- "Team with 8 members feels?"

Measure metrics:
- Average production per room per cycle
- Resource hoarding trends
- Player build diversity (all STR vs mixed?)
```

**Week 2: Adjust if Needed**
```
If 60%+ players say "too slow":
  → k = 1.5 → 1.7
  → 8×STR50: 250 → 285 (+14%)

If <20% say "too slow":
  → Keep 1.5

If economy shows hoarding:
  → k = 1.5 → 1.3
  → 8×STR50: 250 → 215 (-14%)
```

**Week 3: Validate & Lock**
```
Monitor production velocity vs demand
If balanced:
  → Lock k=1.5 (or new value) as official
  → Remove from hotfix rotation
```

### 2.3 Quick Adjustment (Single Parameter)

Unlike old design (which required changing 3 parameters: sigmoid coef, synergy coef, base value), new design only requires tuning **k**:

```typescript
// PRODUCTION_CONFIG.ts

export const PRODUCTION_CONFIG = {
  BASE_PRODUCTION: {
    stone: 100,
    magic: 50,
    wood: 150,
  },
  
  POOL_SCALING: {
    k: 1.5,  // ← ONLY THIS NEEDS TUNING
    // Easy to adjust: 1.0, 1.2, 1.5, 1.7, 2.0
  },
};
```

---

## Section 3: Edge Cases & Validation

### 3.1 Edge Case Testing Checklist

- [ ] **Zero members:** Production = 0 ✓ (no division by zero, game checks `members.length > 0`)
- [ ] **One member with stat 0:** Pool=0, Total = Base×1.0 = Base ✓ (no penalty)
- [ ] **Member stat exceeds 50:** Pool grows, output scales up (asymptotic, no spike) ✓
- [ ] **Pool exceeds 400:** e.g., 9×STR50 = 450. Total = Base×(1+1.5×450/400) = Base×2.6875. Still bounded. ✓
- [ ] **Mixed stats in pool:** Works correctly, e.g., STR50+STR40+STR20 = Pool100, same formula ✓
- [ ] **Mid-cycle member reassignment:** Pool recalculates next production tick ✓

### 3.2 Economy Stress Test (Scenario)

**10-Cycle Projection (k=1.5)**

```
Starting Guild: 6 members average STR 30
├─ Stone Mine (2 members, STR 35+30): Pool=65 → 100×1.244 = 124.4/cycle
├─ Wood Ext (2 members, AGI 40+30): Pool=70 → 150×1.263 = 189.4/cycle
├─ Magic Ext (2 members, INT 25+20): Pool=45 → 50×1.169 = 58.4/cycle
└─ Total: 372.2 resources/cycle

Demand (from Economy.md):
  - Cycle 1–2: New equipment crafting = 40 ore + 25 wood
  - Cycle 3–5: Maintenance (repair) = 15 ore + 10 wood
  - Cycle 6–10: Sustained = 8 ore + 5 wood
  - Average = 20 ore + 10 wood per cycle

Projection:
  Cycle 1: Produce 372.2, Consume ~65 (crafting) → Surplus 307.2
  Cycle 2: Produce 372.2, Consume ~65 → Surplus 672.4
  Cycle 3: Produce 372.2, Consume ~25 (maintenance) → Surplus 1019.6
  ...
  Cycle 10: Storage capped at 2000 → Stable

Verdict: ✅ SUSTAINABLE — Production meets/exceeds demand, players feel progression.
```

---

## Section 4: Player Communication

### 4.1 Patch Notes (Launch)

```
🎯 NEW FEATURE: Member Stats Now Drive Production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your guild's extraction rooms (Stone Mine, Magic Extraction, Wood Extraction) 
now scale production based on your team's collective stat power.

📊 HOW IT WORKS:

The more total strength (STR, INT, AGI) your team has in a room, 
the more resources they produce.

Examples:
  • 1 member with STR 50 → ~120 stone/cycle
  • 4 members with average STR 35 → ~175 stone/cycle
  • 8 members with average STR 40 → ~240 stone/cycle

💡 KEY INSIGHTS:
  ✓ More members = bigger team pool = more total output
  ✓ Higher-stat members contribute more to the pool
  ✓ Mixing strong and moderate members is viable
  ✓ Solo specialists can run efficient small teams
  ✓ Large teams get more resources but split per-member

🔧 ASSIGNMENT TIP:
   Check each room's "Pool Stats: X/400" to see team efficiency.
   
✅ Resources now feel tied to character progression!
```

### 4.2 In-Game Tooltips

**Room Detail Screen:**
```
┌─ STONE MINE PRODUCTION ───────────┐
│                                   │
│ POOL STATS: 95 / 400 (24%)       │
│                                   │
│ Members Assigned: 2               │
│ • Barbarian (STR 50)              │
│ • Fighter (STR 45)                │
│                                   │
│ TOTAL PRODUCTION: 136 stone/cycle │
│ Per Member: 68 stone/cycle        │
│                                   │
│ To increase production:           │
│ → Add members with high STR       │
│ → Recruit stronger barbarians     │
│ → Or recruit more members         │
│                                   │
│ ℹ️ Pool Stats measure your team's  │
│    combined strength. Closer to    │
│    400 = stronger team.            │
└───────────────────────────────────┘
```

**Member Assignment Preview:**
```
Dragging Barbarian (STR 40) to Stone Mine...

PREVIEW:
Current Pool: 50 / 400
↓ Add Barbarian ↓
New Pool: 90 / 400 (+80%)

IMPACT:
Room Production: 119 → 131 stone/cycle (+12 total, +6 per-member)

Barbarian's Estimated Share: ~65 stone/cycle
```

### 4.3 Tutorial / Onboarding

**New Player Milestone: "Understanding Pool Production"**

```
Narrator: "Assign your Barbarian (STR 40) to the Stone Mine. 
          Watch the pool grow!"

Player assigns 1 member:
  Pool: 40/400 (10%)
  Production: 100 × 1.15 = 115 stone/cycle

Narrator: "Great! Now assign your Fighter (STR 35). 
          The pool grows, and so does production!"

Player assigns 2nd member:
  Pool: 75/400 (19%)
  Production: 100 × 1.281 = 128 stone/cycle
  Per-member: 64 stone each

Narrator: "See? More members = bigger pool = more total production.
          Even though each member produces less individually,
          the team works together to produce more resources."
```

---

## Section 5: Comparison: Pool-Based vs Old Sigmoid+Synergy

### 5.1 Design Philosophy Shift

| Aspect | Old (Sigmoid+Synergy) | New (Pool-Based) | Winner |
|--------|---------------------|-----------------|--------|
| **System Complexity** | 3 formulas + penalty | 1 formula | **New** |
| **Intuitive Feel** | "Solo hero" | "Team effort" | **New** |
| **Economy Predictability** | Hard (3 moving parts) | Easy (1 parameter) | **New** |
| **Solo Player Experience** | Very powerful (243 stone) | Rewarded (119 stone) | Tied* |
| **Team Player Experience** | Penalized (32 per-member) | Collaborative (31 per-member) | **New** |
| **New Player Onboarding** | Complex (synergy penalty confusing) | Simple ("pool scales output") | **New** |
| **Extensibility** | Medium (synergy breaks with additions) | High (easy to add modifiers) | **New** |

*Old design strongly incentivizes solo specialist playstyle. New design encourages (but doesn't force) teams.

### 5.2 Key Differences in Play

**Old Design Encourages:**
- ❌ "I'll specialize in 1 room with 1 high-stat hero"
- ❌ Avoid grouping multiple members (synergy penalty harsh)

**New Design Encourages:**
- ✅ "I'll build a focused team (2–4 members per room)"
- ✅ Teams feel collaborative, not penalized
- ✅ Larger guilds can scale more rooms

---

## Section 6: Success Metrics (Post-Launch)

### 6.1 Validation Checklist

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Production felt impactful** | >70% positive feedback | Post-play survey |
| **Pool concept understood** | >80% players understand "more stats = more production" | Telemetry: pool optimization frequency |
| **Team diversity** | >50% teams have varied stats (not all STR 50) | Character build data sampling |
| **Economy stability** | Resource hoarding <5% below demand | Economy simulator logs |
| **Solo players satisfied** | >60% solo players feel rewarded | Segment feedback by playstyle |
| **Tuning frequency** | <2 adjustments in month 1 | Change log |

### 6.2 Red Flags (Intervention Needed)

- Production too slow → Day 3 complaints → Increase k by +0.2
- Infinite resources → Day 5 hoarding → Decrease k by -0.2 or reduce Base by -15%
- Players all maxing same stat (e.g., all STR) → Consider stat synergies as future feature
- "Pool concept confusing" → Day 2 feedback → Improve UI tooltips

---

## Section 7: Future Expansions (Post-Launch)

### 7.1 Possible Enhancements (NOT for launch)

| Feature | Complexity | Design |
|---------|-----------|--------|
| **Stat Synergies** (STR+END+AGI = +5% bonus) | High | Room receives bonus if pool has all 3 stats above threshold |
| **Specialist Bonus** (Pure STR > Mixed stats) | Medium | k_specialty = k × 1.1 if 70%+ pool is single stat |
| **Pool Modifiers** (Research: +10% pool effectiveness) | Medium | Multiplier on pool factor: `(1 + k × Pool/400) × ResearchBonus` |
| **Fatigue System** (Members produce less if overworked) | High | Reduce effective stat by X% after N cycles assigned |
| **Environmental Events** (Rainy day +20% wood) | Medium | Random modifier on production for 1–2 cycles |

### 7.2 NOT Recommended

- ❌ **Daily production caps** — Kills idle progression
- ❌ **Random variance** (80–120 randomly) — Breaks predictability
- ❌ **Per-room diminishing returns** (8th room costs 3x) — Too punitive

---

## Section 8: Implementation Checklist

- [ ] **Code:** Implement pool formula in `production-system.ts`
- [ ] **Tests:** Write unit tests for pool calculation
- [ ] **Config:** Set k=1.5 in production-config.ts
- [ ] **UI:** Display "Pool: X/400" in room screen
- [ ] **UI:** Member assignment preview shows production impact
- [ ] **Tutorial:** Add onboarding step for pool concept
- [ ] **Patch Notes:** Write communication (see Section 4.1)
- [ ] **Playtesting:** Collect feedback for 1 week
- [ ] **Tuning:** Adjust k if needed (1.0–2.0 range)
- [ ] **Monitoring:** Set up dashboards for production velocity & hoarding
- [ ] **Launch:** Deploy with k=1.5
- [ ] **Post-Launch:** Monitor for 2 weeks, hotfix k if needed

---

## Section 9: Rollback Plan (If Issues)

**If economy breaks within 48 hours:**
```
Option 1 (Quick): Reduce k from 1.5 → 1.0
  - Immediate: -33% production
  - Communicates: "Adjusted for balance"
  - Reversible: Can increase back if too harsh

Option 2 (Moderate): Reduce Base values by -20%
  - Stone: 100 → 80
  - Wood: 150 → 120
  - Magic: 50 → 40
  - More targeted than k adjustment

Option 3 (Full): Revert to old Sigmoid+Synergy (keep as fallback)
  - Last resort, communicates "trying new approach"
```

---

## Appendix A: Quick Formula Reference

```
POOL-BASED FORMULA (k=1.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Production = Base × (1 + 1.5 × TotalStats/400)
Per-Member Production = Total / Members

EXAMPLE (Stone Mining):
  2 members with STR 50 + STR 40
  Pool = 90
  Total = 100 × (1 + 1.5 × 90/400)
        = 100 × 1.3375
        = 133.75 stone/cycle
  Per-member = 66.9 stone each
```

---

## Appendix B: Side-by-Side Config Comparison

```
OLD SYSTEM (Sigmoid + Synergy):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const scalingFactor = 1 + (2 * stat) / (stat + 20);
const synergyMultiplier = 1 / (1 + 0.1 * memberCount * memberCount);
production = base * scalingFactor * synergyMultiplier;
// Lines: ~15 per-member calculations

NEW SYSTEM (Pool-Based):
━━━━━━━━━━━━━━━━━━━━━━
const totalStats = members.reduce((s, m) => s + m.stat, 0);
const poolFactor = 1 + (k * totalStats / 400);
const totalProduction = base * poolFactor;
const perMemberProduction = totalProduction / members.length;
// Lines: ~5 calculations total

REDUCTION: 75% simpler ✓
```

---

**End of Tactical Guide**
