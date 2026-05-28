# Member Stat Production — REVISED Design: Pool-Based Scaling

**Date:** 2026-04-23 (Revision)  
**Status:** Brainstorm + Research (New Approach)  
**Approach:** Pool-Based Scaling instead of Per-Member Sigmoid + Synergy

---

## Executive Summary

**Old Design:** Each member had individual scaling (sigmoid), plus a synergy penalty for multiple members.  
**New Design:** Sum all stats in the room into a "pool" (max 400 = 8×50), then scale total production based on pool utilization.

**Key Difference:**
- Old: Per-member calculation with diminishing returns punishing group size
- New: Room-level pool calculation where more members = bigger pool = more total production, but per-member efficiency naturally decreases

**Result:** Simpler formula, more predictable, encourages strategic team composition.

---

## Section 1: Core Formula (Pool-Based)

### 1.1 The Formula

```
Total Production = Base × (1 + k × TotalStats / 400)
Per-Member Production = Total Production / MemberCount

Where:
  Base = Room-specific constant (100, 50, 150)
  k = Scaling coefficient (to be determined: range 1.0–2.5)
  TotalStats = Sum of relevant stats (STR, INT, AGI) of all members
  MemberCount = Number of members assigned (1–8)
  MaxStats = 8 × 50 = 400 (theoretical maximum)
```

### 1.2 Room Configuration

| Room | Base | Stat Used | Max Pool | Scaling |
|------|------|-----------|----------|---------|
| Stone Mine | 100 | STR | 400 | k=? |
| Magic Extraction | 50 | INT | 400 | k=? |
| Wood Extraction | 150 | AGI | 400 | k=? |

### 1.3 Example: k = 1.5 (Recommended Candidate)

**Stone Mining with k=1.5**

```
Formula: Total = 100 × (1 + 1.5 × TotalStats/400)

Scenario A: 1 member (STR 50)
  TotalStats = 50
  Total = 100 × (1 + 1.5 × 50/400) = 100 × 1.1875 = 118.75
  Per-Member = 118.75 (only 1 member)
  
Scenario B: 2 members (STR 50 + STR 40)
  TotalStats = 90
  Total = 100 × (1 + 1.5 × 90/400) = 100 × 1.3375 = 133.75
  Per-Member = 133.75 / 2 = 66.88 each
  
Scenario C: 4 members (4× STR 50)
  TotalStats = 200
  Total = 100 × (1 + 1.5 × 200/400) = 100 × 1.75 = 175
  Per-Member = 175 / 4 = 43.75 each
  
Scenario D: 8 members (8× STR 50)
  TotalStats = 400
  Total = 100 × (1 + 1.5 × 400/400) = 100 × 2.5 = 250
  Per-Member = 250 / 8 = 31.25 each
```

---

## Section 2: Comparing All Approaches

### 2.1 Five Approaches Evaluated

| Approach | Formula | Pros | Cons | Score |
|----------|---------|------|------|-------|
| **A: Linear Per-Member (Old)** | Each: Base×(1+2S/(S+20))×1/(1+0.1M²) | Sigmoid feels good | Complex, punishes groups | 15/20 |
| **B: Pool Linear (k=1.0)** | Total: Base×(1+1.0×P/400) | Simple, additive | Lower scaling, may feel weak | 14/20 |
| **C: Pool Linear (k=1.5)** | Total: Base×(1+1.5×P/400) | Sweet spot, balanced | Requires tuning validation | **18/20** ⭐ |
| **D: Pool Linear (k=2.0)** | Total: Base×(1+2.0×P/400) | Powerful feeling | May break economy at high stats | 16/20 |
| **E: Pool Sigmoid** | Total: Base×(1+k×P/(P+200)) | Curved scaling | More complex, diminishing returns | 14/20 |

**RECOMMENDATION: Pool Linear with k=1.5** — Best balance of simplicity, balance, and fantasy.

---

## Section 3: Mathematical Analysis (k=1.5)

### 3.1 Single Member Progression

**Scaling Factor = 1 + 1.5 × (Stat / 400)**

| Stat | Pool % | Stone Mine | Wood Ext. | Magic Ext. | Reward Feeling |
|------|--------|-----------|----------|-----------|-----------------|
| 10 | 2.5% | 103.75 | 155.6 | 51.9 | Minimal, but present |
| 20 | 5% | 107.5 | 161.3 | 53.8 | Small boost |
| 30 | 7.5% | 111.25 | 167 | 55.6 | Noticeable |
| 40 | 10% | 115 | 172.5 | 57.5 | Good progression |
| 50 | 12.5% | 118.75 | 178.1 | 59.4 | **Hero moment** ⭐ |

**Feeling at Max Stat:**
- STR 50 solo = 118.75 stone/cycle = +18.75% vs base (solo member feature)
- Not as dramatic as old sigmoid (250), BUT more reasonable

### 3.2 Multi-Member Scenarios (Pool = TotalStats)

**Stone Mining (Base 100)**

| Team Comp | Pool | Total | Per-Member | vs Solo STR50 |
|-----------|------|-------|-----------|---------------|
| 1×STR50 | 50 | 118.75 | 118.75 | Baseline |
| 2×STR50 | 100 | 137.5 | 68.75 | -42% efficiency |
| 3×STR50 | 150 | 156.25 | 52.08 | -56% efficiency |
| 4×STR50 | 200 | 175 | 43.75 | -63% efficiency |
| 5×STR50 | 250 | 193.75 | 38.75 | -67% efficiency |
| 6×STR50 | 300 | 212.5 | 35.42 | -70% efficiency |
| 7×STR50 | 350 | 231.25 | 33.04 | -72% efficiency |
| 8×STR50 | 400 | 250 | 31.25 | -74% efficiency |

**Interpretation:**
- Solo specialist (STR 50): 118.75 stone/cycle (hero moment)
- Full team (8×STR50): 250 stone/cycle (8.4x total, but 3.8x more members)
- Per-member diminishing return is NATURAL (not punitive)

### 3.3 Mixed Team Compositions

**Scenario: 6-Member Endgame Setup (Strategic Choice)**

```
Option A: Focused Team (High Stats, Fewer Members)
  Stone Mine: 2 members (STR 50, STR 45)
  - Pool = 95
  - Total = 100 × (1 + 1.5 × 95/400) = 135.625
  - Per-member = 67.8
  
  Magic Ext: 2 members (INT 40, INT 35)
  - Pool = 75
  - Total = 50 × (1 + 1.5 × 75/400) = 64.0625
  - Per-member = 32.0
  
  Wood Ext: 2 members (AGI 50, AGI 40)
  - Pool = 90
  - Total = 150 × (1 + 1.5 × 90/400) = 200.625
  - Per-member = 100.3
  
  TOTAL: 135.625 + 64.0625 + 200.625 = 400.3 resources/cycle

Option B: Distributed Team (Spread Members)
  Stone Mine: 3 members (STR 40, STR 35, STR 25)
  - Pool = 100
  - Total = 100 × (1 + 1.5 × 100/400) = 137.5
  - Per-member = 45.8
  
  Magic Ext: 2 members (INT 30, INT 20)
  - Pool = 50
  - Total = 50 × (1 + 1.5 × 50/400) = 59.375
  - Per-member = 29.7
  
  Wood Ext: 1 member (AGI 50)
  - Pool = 50
  - Total = 150 × (1 + 1.5 × 50/400) = 178.125
  - Per-member = 178.1
  
  TOTAL: 137.5 + 59.375 + 178.125 = 374.9 resources/cycle

Winner: Option A (focused) = 400.3 vs Option B (distributed) = 374.9
- Difference: +6.8% for focused team
- Not huge penalty for distribution, encouraging flexibility
```

---

## Section 4: Comparing Pool-Based vs Old Sigmoid+Synergy

### 4.1 Side-by-Side Comparison

**Scenario: 8 Members at STR 50 Each (Stone Mining, Base 100)**

| Metric | Old Sigmoid+Synergy | New Pool-Based (k=1.5) | Difference |
|--------|-------------------|----------------------|-----------|
| **Per-Member Formula** | 100×2.43×0.135 | 250÷8 | Different |
| **Per-Member Output** | 32.8 | 31.25 | -5% |
| **Total Room Output** | 262.4 | 250 | -5% |
| **Max scaling (1 member)** | 243 | 118.75 | -51% |
| **Economy Impact (per cycle)** | Moderate | Slight | ✓ Better |

**Key Insight:** Old design gives MORE to solo players (243 vs 118.75) but LESS to full teams (262 vs 250). New design is more balanced.

### 4.2 Player Experience Comparison

| Aspect | Old Sigmoid+Synergy | New Pool-Based |
|--------|-------------------|-----------------|
| **Solo specialist feels** | Extremely powerful (243 stone) | Rewarded but not OP (118.75 stone) |
| **Full team feels** | Penalized/weak (31 per-member) | Collaborative (31 per-member) |
| **Team diversity incentive** | Strong (synergy penalty hard on homogeneous) | Soft (naturally decreases per-member) |
| **Ease of understanding** | Complex (synergy penalty needs explanation) | Simple ("pool scales production") |
| **Economy predictability** | Hard (per-member × multiplier × penalty) | Easy (one pool formula) |
| **Extensibility** | Medium (hard to add bonuses without breaking) | High (easy to add pool modifiers) |

**Verdict:** Pool-based is MORE accessible, less punitive to teams, easier to explain.

---

## Section 5: Finding the Right k Value

### 5.1 Testing Different k Values

**Goal: Find k where max production (8×STR50) ≈ sustainable economy level**

From Economy.md: ~5-cycle demand = 36 ore/cycle + 24 wood/cycle minimum.  
Our 8-member team should produce 5–8 cycles worth without being trivial.

**Calculation for Stone Mining (Base 100):**

| k | 1-Member STR50 | 8-Member STR50 Pool | Per-Member | Cycles of Demand | Verdict |
|---|---|---|---|---|---|
| **0.5** | 106.25 | 187.5 | 23.4 | 5 | Too conservative |
| **1.0** | 112.5 | 225 | 28.1 | 6.25 | Safe, maybe weak |
| **1.5** | 118.75 | 250 | 31.25 | 7 | **Goldilocks** ✓ |
| **2.0** | 125 | 300 | 37.5 | 8.3 | Powerful, watch economy |
| **2.5** | 131.25 | 350 | 43.75 | 9.7 | Risky, likely OP |

**Recommendation: k = 1.5**
- Produces 250 stone/cycle with max team (~7 cycles of demand) ✓
- Solo hero moment is meaningful but not trivializing (118.75 vs 243 in old design) ✓
- Natural per-member scaling without punishment ✓
- Easy to tune up/down if playtest shows issues ✓

### 5.2 Tuning Parameters for k

```
If production feels:
  TOO SLOW → Increase k from 1.5 → 1.7 or 2.0
  TOO FAST → Decrease k from 1.5 → 1.2 or 1.0
  
By adjusting only k, we keep formula simplicity while balancing economy.
```

---

## Section 6: Implementation: What Changes

### 6.1 Formula Change (Before → After)

**BEFORE (Per-Member + Synergy):**
```typescript
scalingFactor = 1 + (2 * stat) / (stat + 20);
synergyMultiplier = 1 / (1 + 0.1 * memberCount * memberCount);
production = base * scalingFactor * synergyMultiplier;
```

**AFTER (Pool-Based):**
```typescript
const totalStats = members.reduce((sum, m) => sum + m[statKey], 0);
const poolFactor = 1 + (k * totalStats / 400);
const totalProduction = base * poolFactor;
const perMemberProduction = totalProduction / members.length;
```

### 6.2 Line Count Reduction

- Old: ~30 lines (calculate per-member, apply synergy penalty, sum)
- New: ~10 lines (sum stats, apply pool factor, divide)
- **75% simpler** ✓

### 6.3 Config Change

```
// OLD
BASE_PRODUCTION: { stone: 100, magic: 50, wood: 150 }
SIGMOID: { coefficient: 2.0, midpoint: 20 }
SYNERGY: { coefficient: 0.1 }

// NEW
BASE_PRODUCTION: { stone: 100, magic: 50, wood: 150 }
POOL_SCALING: { k: 1.5 }  // Single parameter!
```

---

## Section 7: UI/UX Changes

### 7.1 Room Display (Before vs After)

**BEFORE:**
```
┌─ Stone Mine ────────────┐
│ Member 1 (STR 45):      │
│ • Scaling: 1.82x        │
│ • Efficiency: 37% (synergy penalty)
│ • Production: 91 stone  │
│                         │
│ Member 2 (STR 35):      │
│ • Scaling: 1.29x        │
│ • Efficiency: 37%       │
│ • Production: 70 stone  │
│                         │
│ Room Total: 250 stone   │
└─────────────────────────┘
```

**AFTER (Simpler):**
```
┌─ Stone Mine ────────────────┐
│ Pool Stats: 100/400 (25%)   │
│ Production: 150 stone/cycle │
│                             │
│ Members (2):                │
│ • STR 45 + STR 35 = 80 stats│
│ • Per-member: 75 stone      │
│                             │
│ To increase production:     │
│ → Add higher-STR members    │
│ → Or more members           │
└─────────────────────────────┘
```

**Benefit:** Easier to understand the pool concept.

### 7.2 Member Assignment Preview

**BEFORE:**
```
Dragging Barbarian (STR 45)...
• Barbarian scaling: 2.44x
• Room synergy becomes: 0.385x
• Barbarian's output: 91 stone
```

**AFTER:**
```
Dragging Barbarian (STR 45)...
• Pool grows: 100 → 145 stats (36%)
• Room production: 150 → 175 stone (+25 total, +12.5 per-member)
• Barbarian's share: ~60 stone
```

**Benefit:** Show total room impact, not complex per-member calculations.

---

## Section 8: Economy Validation

### 8.1 Production vs Demand (5-Cycle Analysis)

**Demand (from Economy.md, 5-mission cycle):**
- Stone: 36 ore
- Wood: 24 wood
- Magic items: 8–12 items

**Supply (8-member endgame team, k=1.5):**
- Stone Mine (2 members STR 50, STR 45): Pool=95 → 100×1.356 = 135.6/cycle = **678 ore per 5 cycles** ✓
- Wood Ext (2 members AGI 50, AGI 40): Pool=90 → 150×1.338 = 200.6/cycle = **1,003 wood per 5 cycles** ✓
- Magic Ext (2 members INT 40, INT 35): Pool=75 → 50×1.281 = 64.1/cycle = **320 items per 5 cycles** ✓

**Buffer:** 19–27 cycles of sustainable production. Good equilibrium. ✓

---

## Section 9: Risk Analysis

| Risk | Severity | Pool-Based Solution | Mitigation |
|------|----------|-------------------|-----------|
| **Economy broken (infinite resources)** | High | Tuning: Start k=1.5, watch for hoarding | Playtest 2 weeks, adjust k if needed |
| **Solo players feel weak** | Medium | 118.75 vs 243 (old) | Document "pool encourages teamwork" |
| **Players don't understand pool concept** | Medium | Simple tooltip + tutorial | UI clearly shows "Pool: X/400" |
| **Balancing multiple rooms** | Low | Same formula all rooms, k affects all equally | Consistent design, easy to tune |
| **Endgame trivial** | Medium | Max production only 250/cycle (not 1,944) | Economic demand tuning handles this |

---

## Section 10: Recommended Parameters

```
STONE MINE:
  Base = 100
  Stat = STR
  k = 1.5

MAGIC EXTRACTION:
  Base = 50
  Stat = INT
  k = 1.5

WOOD EXTRACTION:
  Base = 150
  Stat = AGI
  k = 1.5

ALL ROOMS:
  Max Pool = 400 (8 × 50 base stat)
  Max Members = 8
  Member Stat Range = 0–60 (with items)
```

---

## Section 11: Next Steps (Revision Workflow)

1. **Validate Economy:** Run 10-cycle simulation with k=1.5 production
2. **Implement Pool Formula:** Update production-system.ts
3. **Simplify Unit Tests:** Remove synergy tests, add pool tests
4. **Update UI:** Show pool stats clearly, remove synergy explanation
5. **Playtest:** Get feedback on "pool feels good/weak/OP"
6. **Tune k if needed:** Adjust within 1.0–2.0 range based on feedback
7. **Launch:** Communicate "simplified stat system"

---

## Appendix A: Formula Comparison Matrix

```
FORMULA SUMMARY (k=1.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STONE MINING (STR-Based):
  Total = 100 × (1 + 1.5 × TotalSTR / 400)
  Per-Member = Total / Members

MAGIC EXTRACTION (INT-Based):
  Total = 50 × (1 + 1.5 × TotalINT / 400)
  Per-Member = Total / Members

WOOD EXTRACTION (AGI-Based):
  Total = 150 × (1 + 1.5 × TotalAGI / 400)
  Per-Member = Total / Members

SCALING REFERENCE:
  Pool 0%:   Multiplier = 1.0 (Base)
  Pool 25%:  Multiplier = 1.375
  Pool 50%:  Multiplier = 1.75
  Pool 75%:  Multiplier = 2.125
  Pool 100%: Multiplier = 2.5 (Max)
```

---

## Appendix B: Migration from Old Design

### Before (Still in codebase):
```typescript
// Per-member calculation with synergy
const scalingFactor = 1 + (2 * stat) / (stat + 20);
const synergyMultiplier = 1 / (1 + 0.1 * memberCount * memberCount);
const production = base * scalingFactor * synergyMultiplier;
```

### After (New design):
```typescript
// Pool-based calculation
const totalStats = members.reduce((sum, m) => sum + m[statKey], 0);
const poolFactor = 1 + (k * totalStats / 400);
const totalProduction = base * poolFactor;
const perMemberProduction = totalProduction / members.length;
```

### Deprecation Plan:
- Week 1: Implement parallel, log both values
- Week 2: Switch to new default, keep old available
- Week 3: Remove old code
- Week 4: Launch without old system

---

**End of Pool-Based Brainstorm & Research**
