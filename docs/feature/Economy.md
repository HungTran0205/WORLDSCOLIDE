
---

## Problem Statement

**Current State:**

- Multiple rooms consume wood, stone, ore, magic items, and gold
- Players can build all rooms if resources are sufficient
- No penalty for "building everything" (generalist approach)
- No strong incentive to specialize (e.g., "I only want armor production")

**Target State:**

- **Low/Medium difficulty:** Resources feel abundant → building all rooms is viable
- **High difficulty:** Specialization becomes necessary → resource scarcity forces choices
- **Specialization bonus:** Investing in ONE production line unlocks bonus rooms elsewhere
  - Example: "Skip alchemy room → can build 2x stone mines instead"
- **Risk/reward system:** Generalist = balanced progression; Specialist = accelerated but focused

---

## Section 1: Resource Inventory & Current Flows

### 1.1 Primary Resources

| Resource | Source | Consumption | Storage |
|----------|--------|------------|---------|
| **Wood** | Wood extraction room | Workshop (crafting, repair), Alchemy fuel | Per room capacity |
| **Stone** | Stone mine (tier 1) | Workshop (smelting, crafting) | Per room capacity |
| **Iron Ore** | Stone mine (tier 2+) | Workshop (crafting armor/weapons) | Per room capacity |
| **Crystal** | Stone mine (tier 3+) | High-tier crafting, rare spells | Per room capacity |
| **Rare Ore** | Stone mine (tier 4+) | Legendary crafting, best equipment | Per room capacity |
| **Magic Items** (8 types) | Magic extraction room | Alchemy syringe crafting | Per room capacity |
| **Gold** | Quest rewards, mission completion | Recruitment, room upgrades, upkeep | Treasury |
| **Enchanted Items** | Double harvest/success procs | Stat boosts, equipment quality | Inventory |

### 1.2 Consumption Rates (Per Active Member / Assigned to Room)

**Workshop (Crafting Mode):**

- Weapon: 12 iron ore + 8 wood + recipe (per queue slot, 5-15min craft time)
- Armor: 10 iron ore + 6 wood + recipe (per queue slot, 5-15min craft time)
- Higher rarity = 2-3x material cost

**Alchemy Crafting:**

- Buff spell: 3 magic items + 4 wood (per syringe, 90-95% success rate)
- Debuff spell: 3 magic items + 4 wood (per syringe, 75-85% success rate)
- Healing potion: 4 magic items + 2 wood (per syringe, 90-95% success rate)

**Workshop Repair:**

- Cost scales with durability loss: ~2-4 ore + 2-3 wood per 20% durability restoration

---

## Section 2: Difficulty Tiers & Resource Demand

### 2.1 Map Difficulty Progression (Proposed)

| Difficulty | Enemy Tier | Party Req | Win Rate (avg) | Loot Multiplier | Upkeep Scaling |
|-----------|-----------|----------|----------------|-----------------|-----------------|
| **Easy** (F-Rank) | Tier 1 | 1-2 members | 90%+ | 1x | 1x |
| **Normal** (E-D Rank) | Tier 2 | 2-3 members | 75-85% | 1.2x | 1.2x |
| **Hard** (C-B Rank) | Tier 3 | 3-4 members | 60-70% | 1.5x | 1.5x |
| **Very Hard** (A-Rank) | Tier 4 | 4-5 members | 45-55% | 2x | 1.8x |
| **Nightmare** (S-Rank) | Tier 5 | 5-6 members | 30-40% | 2.5x | 2.5x |

### 2.2 Equipment Obsolescence & Replacement Demand

**Key Insight:** Players need fresh equipment for harder difficulties.

- **Low difficulty:** Equipment lasts 10+ missions (low breakage)
- **Medium difficulty:** Equipment lasts 5-8 missions (moderate repair costs)
- **High difficulty:** Equipment lasts 2-4 missions (frequent repairs, replacements needed)

**Material Demand Example (6-member party facing Hard Rank):**

- Initial equip: 6 weapons + 6 armor = 72 ore + 48 wood
- Per 5 missions: 3-4 equipment replacements + 4-6 repairs = 36 ore + 24 wood (combined)
- **5-mission cycle:** ~36 ore + 24 wood consumed purely for equipment maintenance

---

## Section 3: Current State Analysis

### 3.1 Production Capacity Calculation

**Scenario: Player with 6 members, builds ALL standard rooms**

- Tavern: No resource consumption (social hub)
- Training: No resource consumption (stat bonuses only)
- Infirmary: No resource consumption (healing bonuses)
- Barracks: No resource consumption (stat bonuses)
- Library: No resource consumption (EXP bonuses)
- Wood extraction: 3 assigned members
- Stone mine: 3 assigned members (some ore drops)
- Magic extraction: 1-2 assigned members
- Workshop: 0 members assigned (craft-only room)
- Alchemy: 1 assigned member
- **Total roster used:** 10-11 members (need to recruit extras)

### 3.2 Resource Flow at Easy Difficulty (Small Roster: 4 members)

**Production Per Hour (with 2 extraction rooms, 1 magic room):**

- Wood: 2 assigned members → 1,200 wood/hour
- Stone: 2 assigned members → 960 stone/hour
- Magic items: 1 assigned member → 360 items/hour

**Consumption Per Hour (1 Hard difficulty quest, 3 member party):**

- Quest equipment wear: 2-3 repairs (6-12 ore + 6-9 wood)
- Alchemy production (if running): 3 syringes/hour (9 magic items + 12 wood)
- Workshop crafting (if running): 1-2 weapons/hour (12-24 ore + 8-16 wood)

**Result:** Massive surplus. Players accumulate 500+ wood/hour net gain.

### 3.3 Resource Flow at Nightmare Difficulty (Full Roster: 8+ members)

**Production Per Hour (same setup):**

- Wood: 2 assigned members → 1,200 wood/hour
- Stone: 2 assigned members → 960 stone/hour
- Magic items: 1 assigned member → 360 items/hour

**Consumption Per Hour (3 S-Rank quests, 18-member total dispatches):**

- Equipment replacement: 5-6 pieces/hour (60-72 ore + 36-48 wood)
- Armor crafting (players want tier-2 gear): 3-4 pieces/hour (30-40 ore + 18-24 wood)
- Alchemy consumption (buff all squads): 12+ syringes/hour (36 magic items + 48 wood)
- Repairs (from failed attempts): 8-10 repairs/hour (16-40 ore + 16-30 wood)

**Demand:** 130-160 ore + 118-150 wood per hour  
**Supply:** ~960 stone/hour, but only ≈15-20% converts to ore at high tiers  
**Result:** **SHORTAGE** if player hasn't upgraded mining heavily.

---

## Section 4: Specialization Mechanics (Core Proposal)

### 4.1 Specialization Framework

**Concept:** Players declare a primary "Production Focus" at guild setup or mid-game. Each focus unlocks bonus room slots while disabling access to 1-2 other rooms.

### 4.2 Specialization Profiles

#### Profile A: **Armory Master** (Armor Production Focus)

**Primary Output:** High-tier armor + weapons

**Enabled Rooms:**

- Wood extraction
- Stone mine (max tier unlocked)
- Workshop (crafting mode preferred)
- Tavern, Training, Infirmary, Barracks, Library

**Disabled Rooms:**

- Alchemy (removed from grid)
- Magic extraction (removed from grid)

**Bonus Slots:**

- +1 Workshop slot (can queue 2 crafts simultaneously)
- +1 Stone mine slot (can assign 1 extra member)

**Tradeoff:** No potions/buffs → must rely on equipment + stat allocation for combat survivability

**Use Case:** Players who want deterministic progression through gear optimization. Risk: immobile in-game if equipment breaks during quest.

---

#### Profile B: **Potion Master** (Alchemy Focus)

**Primary Output:** Buff/debuff/healing syringes

**Enabled Rooms:**

- Wood extraction
- Magic extraction (max capacity)
- Alchemy
- Tavern, Training, Infirmary, Barracks, Library

**Disabled Rooms:**

- Stone mine (removed from grid)
- Workshop (removed from grid)

**Bonus Slots:**

- +2 Alchemy slots (can craft 3 syringe types simultaneously)
- +1 Magic extraction slot

**Tradeoff:** No equipment crafting → must farm lower-difficulty quests longer to get gear, OR buy from NPC shop at premium prices

**Use Case:** Players who want combat advantages through buffing/debuffing. Risk: if alchemy output drops, combat effectiveness plummets.

---

#### Profile C: **Generalist** (Balanced Approach)

**Primary Output:** Modest amounts of everything

**Enabled Rooms:**

- All standard rooms (wood, stone, magic, workshop, alchemy)
- Tavern, Training, Infirmary, Barracks, Library

**Disabled Rooms:**

- None

**Bonus Slots:**

- None (baseline configuration)

**Tradeoff:** Must allocate roster across 5+ production rooms → fewer members on quests simultaneously. Progression slower than specialists.

**Use Case:** Players who want flexibility and don't like permanent decisions.

---

### 4.3 Dynamic Specialization (Alternative: Non-Permanent)

**"Specialization Season" Mechanic:**

- Players choose focus for 7-day periods (game time or real time)
- At end of season, can switch specialization with cooldown (24 hours, 1 gold cost)
- Bonus rooms scale with how long focus maintained (1 day = no bonus, 7 days = full bonus)

**Benefit:** Reduces decision paralysis. Players can experiment.  
**Risk:** Less impactful choices (can just respec constantly).

---

## Section 5: Resource Scarcity Progression Curve

### 5.1 Dynamic Upkeep Scaling

**Current:** Gold upkeep = fixed amount per room + roster size

**Proposal: Difficulty-Based Resource Tax**

```
Upkeep Cost = (Base Roster Cost) + (Active Mission Penalty)

Active Mission Penalty = (Number of Concurrent Missions) × (Mission Tier Difficulty) × (Modifier)

Example:
- Running 2 F-Rank quests: +5% upkeep
- Running 1 A-Rank + 1 B-Rank quest: +35% upkeep
- All roster on missions: +50% upkeep (unsustainable long-term)
```

**Effect:** Encourages players to let roster rest, not keep 100% mission saturation.

### 5.2 Resource Fatigue System

**Concept:** The longer a resource room runs, the lower its efficiency (simulating "ore depletion").

```
Production Multiplier = 1.0 - (Hours Running / 100)

After 50 hours continuous mining: 0.5x output
After 80 hours: 0.2x output
After 100+ hours: 0.1x output (nearly exhausted)

Recovery: Multiplier resets daily at midnight (simulated "resource respawn")
```

**Effect:**

- Prevents infinite progression without active attention
- Creates cycle of planning: "I need X ore this session, so I'll run mining for Y hours"
- Encourages mixed gameplay (not AFK farming forever)

### 5.3 Tiered Material Scarcity Curves

**Low Difficulty (F-E Rank):**

- Demand: 20-30 ore/hour
- Supply (3 miners): 960 stone/hour raw, but ore conversion ~5-8% = 48-77 ore/hour
- **Result:** Surplus (net +20-50 ore/hour). Player can build equipment.

**Medium Difficulty (D-C Rank):**

- Demand: 60-80 ore/hour (more equipment replacement)
- Supply (3 miners): Same, ~48-77 ore/hour with low tier drops
- **Result:** Breakeven to slight deficit. Player needs to choose: Farm more time or skip alchemy.

**Hard Difficulty (B-A Rank):**

- Demand: 120-160 ore/hour (frequent replacements + crafting)
- Supply (3 miners, tier drops at 10-15%): 96-144 ore/hour
- **Result:** Minor deficit (-20 ore/hour). Must specialize or add 4th miner (requires more gold, creates new cost).

**Nightmare Difficulty (S Rank):**

- Demand: 180-220 ore/hour
- Supply (same miners): 96-144 ore/hour
- **Result:** Major deficit (-80 ore/hour). Unsustainable without specialization.
  - If **Armory Master:** +1 mine slot → 144-192 ore/hour, now breakeven
  - If **Potion Master:** Cannot access mines → forced to buy premium ore from NPC shop

---

## Section 6: Specialization Incentive Mechanics

### 6.1 Specialization Bonus Framework

| Mechanic | Armory Master | Potion Master | Generalist |
|----------|---------------|---------------|-----------|
| **Extra Room Slots** | +1 Workshop, +1 Mine | +2 Alchemy, +1 Magic | None |
| **Production Speed** | +15% workshop speed | +20% alchemy speed | Baseline |
| **Material Efficiency** | -10% ore consumption | -10% potion ingredient cost | Baseline |
| **Unlock Tier Faster** | 20% faster mine tier unlock | 20% faster alchemy tier unlock | Baseline |
| **NPC Vendor Discount** | Equipment: -20% shop price | Potions: -30% shop price | Baseline |

### 6.2 Specialization Unlock Triggers

**Armory Master Unlocked When:**

- Craft 50+ total weapons/armor pieces, OR
- Reach B-Rank difficulty (require better gear), OR
- Player manually selects at start

**Potion Master Unlocked When:**

- Craft 50+ total syringes, OR
- Win S-Rank quest with only syringe buffs (no equipment advantage), OR
- Player manually selects at start

**Generalist (Default):** Always available, no unlock required

---

## Section 7: Specific Resource Consumption Numbers

### 7.1 Revised Consumption Per Difficulty Tier

**Easy Difficulty (F-Rank), 1 mission/hour, 2-member party:**

- Equipment wear: 1 replacement/3 hours = 0.33 ore/hour
- Alchemy (optional): 0 (no buff needed)
- **Total: 0.33 ore/hour**

**Normal Difficulty (E-D Rank), 2 missions/hour, 3-member party:**

- Equipment wear: 1 replacement/2 hours = 0.5 ore/hour
- Repairs: 0.5 repairs/hour = 1 ore/hour
- Alchemy (1 buff per mission): 3 syringes/hour = 9 magic items/hour
- **Total: 11.5 ore + 9 magic items/hour**

**Hard Difficulty (C-B Rank), 2 missions/hour, 4-member party:**

- Equipment wear: 1 replacement/1.5 hours = 0.67 ore/hour
- Repairs: 1.5 repairs/hour = 3 ore/hour
- Weapon/armor crafting for upgrades: 1 item/hour = 10 ore + 6 wood/hour
- Alchemy (2 buffs per mission): 4 syringes/hour = 12 magic items/hour
- **Total: 113.67 ore + 12 magic items + 6 wood/hour**

**Very Hard Difficulty (A Rank), 1.5 missions/hour, 5-member party:**

- Equipment wear: 1 replacement/1 hour = 1 ore/hour
- Repairs: 2.5 repairs/hour = 5 ore/hour
- Weapon/armor crafting: 1.5 items/hour = 15 ore + 9 wood/hour
- Alchemy (3 buffs per mission): 4.5 syringes/hour = 13.5 magic items/hour
- **Total: 21 ore + 13.5 magic items + 9 wood/hour**

**Nightmare Difficulty (S Rank), 1 mission/hour, 6-member party:**

- Equipment wear: 1 replacement/0.5 hour = 2 ore/hour
- Repairs: 4 repairs/hour = 8 ore/hour
- Weapon/armor crafting for tier-up: 2-3 items/hour = 20-30 ore + 12-18 wood/hour
- Alchemy (4-5 buffs per mission): 5+ syringes/hour = 15+ magic items/hour
- **Total: 30-40 ore + 15+ magic items + 12-18 wood/hour**

---

## Section 8: Resource Abundance vs. Scarcity Analysis

### 8.1 Production Scenarios

**Setup A: Casual (2 assignment members per extraction, 1 alchemy)**

- Production/hour: 1200 wood, 960 stone (48-77 ore at avg tier), 360 magic items

**Setup B: Balanced (3 per extraction, 1-2 alchemy)**

- Production/hour: 1800 wood, 1440 stone (72-115 ore), 540 magic items

**Setup C: Specialization (Armory: 4 miners, 1 magic; Potion: 3 magic, 2 alchemy)**

- Armory Production/hour: 2400 stone (120-192 ore), 180 magic items
- Potion Production/hour: 1200 wood, 540 magic items

### 8.2 Breakeven Analysis Per Difficulty

| Difficulty | Ore Demand/hr | Setup A Ore Supply/hr | Setup B Supply/hr | Setup C (Armory)/hr |
|-----------|--------------|----------------------|-------------------|----------------------|
| Easy | 0.33 | 48-77 (✓✓ Huge surplus) | 72-115 (✓✓) | 120-192 (✓✓) |
| Normal | 11.5 | 48-77 (✓ Surplus) | 72-115 (✓) | 120-192 (✓) |
| Hard | 113.67 | 48-77 (✗ Deficit) | 72-115 (✓ Breakeven) | 120-192 (✓ Surplus) |
| Very Hard | 21 | 48-77 (✓ Surplus) | 72-115 (✓) | 120-192 (✓) |
| Nightmare | 30-40 | 48-77 (✓ Tight) | 72-115 (✓ Tight) | 120-192 (✓ Comfortable) |

**Key Insight:** Hard Difficulty is the pivot point where generalist struggles but specialists thrive.

---

## Section 9: Mechanic Interactions & Emergent Gameplay

### 9.1 Specialization Trade-off Examples

**Scenario 1: Player is "Armory Master"**

- Can equip 6-member party with tier-2 armor consistently
- Cannot produce buffs → must either:
  - Accept reduced win rate on S-Rank (rely on gear/stats)
  - Buy potions from NPC shop (-30% discount, still costs gold)
  - Downgrade to A-Rank quests where buffs less critical
- **Emergent Play:** Gear-focused player might optimize for high DEF/VIT and sustain instead of ATK.

**Scenario 2: Player is "Potion Master"**

- Can buff/debuff 3 squads per hour with potions
- Cannot produce weapons/armor → must either:
  - Farm Easy/Normal difficulty longer to accumulate gear naturally
  - Buy equipment from NPC shop (expensive, no specialization discount)
  - Rely on enchanted drops (risky, low rate)
- **Emergent Play:** Buff-focused player might optimize for support-heavy team that doesn't need premium gear.

**Scenario 3: Player is "Generalist" attempting Nightmare**

- Has balanced production of ore + potions
- But production rates are lower than specialists
- Takes longer to reach Nightmare, but more flexible when facing new enemy types
- **Emergent Play:** Generalist is riskier but more adaptable.

---

## Section 10: Gold Economy Integration

### 10.1 Upkeep Scaling Model

**Current:** Upkeep = roster size × base cost

**Proposal:**

```
Daily Upkeep = (Roster Size × 50) + (Room Count × 20) + (Difficulty Penalty)

Difficulty Penalty:
- Easy: +0
- Normal: +10% upkeep
- Hard: +25% upkeep
- Very Hard: +50% upkeep
- Nightmare: +100% upkeep

Example (Nightmare, 8 roster, 7 rooms):
(8 × 50) + (7 × 20) + (400 + 100%) = 400 + 140 + 800 = 1,340 gold/day
```

### 10.2 Gold Income vs. Difficulty

| Difficulty | Avg Gold/Mission | Missions/Day (3 active) | Daily Income | Daily Upkeep | Net Position |
|-----------|-----------------|------------------------|--------------|--------------|--------------|
| Easy | 100 | 36 | 3,600 | 300 | +3,300 |
| Normal | 250 | 36 | 9,000 | 330 | +8,670 |
| Hard | 500 | 36 | 18,000 | 450 | +17,550 |
| Very Hard | 1,200 | 24 | 28,800 | 600 | +28,200 |
| Nightmare | 2,500 | 12 | 30,000 | 1,340 | +28,660 |

**Insight:** Nightmare is profitable but SLOWER progression (fewer missions). Players must choose between safety (Normal) and speed (Nightmare).

---

## Section 11: NPC Shop Integration (Economic Safety Valve)

### 11.1 Purpose

Prevent specialization from creating "stuck" scenarios where players cannot progress due to resource shortage.

### 11.2 Shop Inventory

| Item | Base Price | Armory Master Discount | Potion Master Discount |
|------|-----------|----------------------|----------------------|
| Iron Ore (10x) | 100 gold | -20% (80) | No discount |
| Magic Items (10x) | 80 gold | No discount | -30% (56) |
| Wood (20x) | 40 gold | -10% (36) | -10% (36) |
| Buff Syringe | 50 gold | No discount | -20% (40) |
| Common Weapon | 200 gold | -20% (160) | No discount |
| Common Armor | 180 gold | -20% (144) | No discount |

### 11.3 Purchase Limits

- Max 10 purchases per day per item type (prevent infinite grinding = gold → resources)
- Resets daily

---

## Section 12: Progression Curves (Visualization Reference)

### 12.1 Resource Scarcity Curve

```
Resource Sufficiency %
100% │         Generalist (easy)
      │      ╱───────────────
 80%  │     ╱ 
      │    ╱  Hard pivot point
 60%  │   ╱───┐ 
      │  ╱    │ Specialist bonus
 40%  │ ╱     │╲
      │╱      │ ╲_____ Armory Master (nightmare)
 20%  │       │        Potion Master (struggle)
      │       │
  0%  ├───────┴──────────────────
      Easy  Normal  Hard  VeryHard  Nightmare
```

### 12.2 Specialization Impact on Difficulty Progression

```
Time to Complete Tier
  ▲
  │ Generalist
  │    ╱╲
  │   ╱  ╲  (flexible, slower)
  │  ╱    ╲
  │ ╱      ╲___
  │           ╲
  │ ┌──────┐   ╲___
  │ │Armor │ ╱─────ヽ (fast, then plateau)
  │ │Master│╱       ╲
  │ └──────┘        
  │ ┌──────┐
  │ │Potion│╱─────ヽ (slow, then catch-up)
  │ │Master│        ╲
  │ └──────┘ 
  │
  ├─────────────────────────────
  Easy  Normal  Hard  VeryHard  Nightmare
```

---

## Section 13: Implementation Recommendations

### 13.1 Phase 1: Core Mechanics (Low Risk)

1. **Resource Consumption Adjustment**
   - Implement difficulty-based equipment wear rates
   - Test at each difficulty tier
   - Validate that Easy/Normal stay surplus, Hard becomes tight

2. **Upkeep Scaling**
   - Add difficulty penalty to upkeep calculation
   - Tunable via config (start conservative: +10% per tier)

3. **NPC Shop**
   - Add buy dialog with item limits
   - Track daily purchase count
   - Simple implementation, high value for soft-gating

### 13.2 Phase 2: Specialization (Medium Risk)

1. **Specialization Selection UI**
   - Add screen during character creation (or migration dialog)
   - Show pros/cons of each choice
   - Allow toggle later (with cooldown to prevent constant respec)

2. **Grid Reconfiguration**
   - Hide/show rooms based on specialization
   - Preserve inventory if player switches
   - Database migration to handle existing saves

3. **Bonus Application**
   - Apply multipliers to production/consumption
   - Apply discount to NPC shop
   - Track active specialization in save file

### 13.3 Phase 3: Balance Tuning (Ongoing)

1. **Telemetry & Data Gathering**
   - Log specialization choices
   - Log resource surplus/deficit per tier
   - Identify balance deviations (e.g., Armory too strong at C-Rank)

2. **Iterative Rebalance**
   - Adjust consumption rates if needed
   - Modify specialization bonuses
   - Add new specializations if needed

---

## Section 14: Edge Cases & Risks

### 14.1 Risk: Specialization Remorse

**Problem:** Player picks Armory Master but wanted Potion Master after 10 hours.

**Mitigation:**

- Allow free respec during first 48 game-hours
- Subsequent respec requires 500 gold + 24-hour cooldown
- Warning dialog before committing to specialization

### 14.2 Risk: Accidental Softlock

**Problem:** Player specializes, then encounters new enemy type that requires specifically buffed stats.

**Mitigation:**

- NPC shop always available (players can buy potions)
- Specialization bonuses are +efficiency, not permission (Armor Master can still farm ore, just slowly)
- Difficulty selector lets players downgrade if stuck

### 14.3 Risk: Specialization Dominance

**Problem:** Armory Master is so strong that Potion Master is unviable.

**Mitigation:**

- Regular balance reviews (see telemetry above)
- A/B test different bonus structures
- Add new specializations if meta becomes stale

### 14.4 Risk: Economic Inflation/Deflation

**Problem:** If resource consumption is too low, gold accumulates infinitely. If too high, players starve.

**Mitigation:**

- NPC shop prices auto-adjust based on resource scarcity (buy high when gold surplus, sell low when gold scarce)
- Upgrade costs scale exponentially (prevent endgame stagnation)
- New difficulty tiers unlock that consume more

---

## Section 15: Alternative Approaches (Considered & Rejected)

### 15.1 "Flexible Rooms" (Rejected)

**Idea:** Players assign same physical room to multiple functions (e.g., same room = wood + ore mining, toggle per day).

**Why Rejected:**

- Too confusing in UI
- Removes specialization consequences
- Doesn't encourage meaningful choices

### 15.2 "Soft Specialization" (Considered, Lower Priority)

**Idea:** No permanent specialization, but bonus multipliers based on current resource production ratios.

- If you've been producing 80% ore → +10% ore production this session
- Incentivizes focused play without locking choices

**Status:** Valid alternative, but requires more UI clarity. Recommend Phase 1 permanent specialization first, then explore.

### 15.3 "Random Events" Resource Loss (Rejected)

**Idea:** Occasionally resources are "destroyed" (fire in workshop, ore theft, etc.) to create scarcity.

**Why Rejected:**

- Players hate losing progress to RNG
- Feels punishing rather than strategic
- Unpredictable, hard to plan around

---

## Section 16: Success Metrics & Validation Criteria

### 16.1 Metrics to Track

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Easy tier median clear time** | <5 min | Should feel trivial |
| **Hard tier win rate (generalist)** | 60-70% | Achievable but challenging |
| **Hard tier win rate (specialist)** | 75-85% | Specialization provides measurable edge |
| **Nightmare tier resource deficit** | -30 to -80 ore/hour for generalist | Motivates specialization choice |
| **Specialization adoption rate** | >70% of new players pick specialist | Positive reception |
| **Generalist retention at Nightmare** | <20% abandon (soft exit) | Specialization helps but not mandatory |
| **Gold income/upkeep ratio** | 10:1 at Normal, 3:1 at Nightmare | Meaningful economic pressure |

### 16.2 Validation Checkpoints

- **Week 1:** Monitor Easy/Normal resource surpluses (should be boring/stable)
- **Week 2:** Monitor Hard tier balance (should see resource pressure emerging)
- **Week 3:** Monitor Nightmare adoption and specialization rates
- **Week 4:** Balance pass based on telemetry

---

## Section 17: Open Questions for Refinement

1. **Specialization Switching Cost:** Should respec be free once/game, free always, or paid? Current proposal: paid after 48 hours.

2. **Room Slot Scarcity:** Is the 3x3 grid enforced? If we add specialization rooms, do we need 4x4 grid? (Assume yes, needs UI refactor)

3. **Difficulty Scaling:** Should resource demand curve be aggressive (exponential) or gentle (linear)? Recommend aggressive to create meaningful pivot at Hard.

4. **NPC Shop Prices:** Static or dynamic? Recommend dynamic (explained in Section 11).

5. **Specialization Count:** Start with 2 (Armory + Potion)? Or add "Harvester" (wood/stone focus) later? Recommend start small (2), expand based on feedback.

6. **Early-Game Specialization:** Should new players choose immediately (character creation) or after reaching Normal tier (informed choice)? Recommend mid-game unlock (level 10+).

---

## Summary & Recommendations

### Core Design Decisions

1. **Resource Scarcity via Difficulty:** Implement consumption rates that create natural scarcity at Hard+, not artificial RNG loss.

2. **Specialization as Trade-off:** Offer 2 specialization paths that trade room access for efficiency. No "best choice" — both viable but different.

3. **Economic Safety Valve:** NPC shop prevents permanent softlock scenarios. Discounts for specialists encourage investment without forcing it.

4. **Gradual Pressure:** Easy/Normal should feel abundant. Hard becomes tight. Nightmare forces specialization. Clear progression.

### Next Steps

1. **Immediate:** Propose these numbers to design team for review. Gather feedback on target difficulty curves and specialization appeal.

2. **Week 1:** Implement Phase 1 (resource consumption + upkeep scaling). Test at all difficulty tiers.

3. **Week 2:** Implement Phase 2 (specialization UI + grid reconfiguration).

4. **Week 3-4:** Balance tuning based on early player telemetry.

---

**Created:** April 21, 2026  
**Last Updated:** April 21, 2026  
**Status:** Ready for Design Review & Stakeholder Feedback

---

# Section 20: Room Upgrade Systems

**Purpose:** Define upgrade mechanics for production rooms to enable progression and economic challenge. Extraction rooms use exponential scaling for meaningful late-game investment. Crafting rooms use tier unlocks with penalties to enforce specialization trade-offs.

---

## Section 20.1: Extraction Room Upgrades (Wood, Stone, Magic)

### 20.1.1 Upgrade Framework (Approach 2: Exponential Scaling)

**Core Mechanics:**
- **5 Upgrades per room:** Each upgrade multiplies production rate by 1.5x, adds +1 assignable member slot.
- **Cost Scaling:** Exponential (doubles each time), starting at 1,000 gold for Tier 1.
- **Member Impact Formula:** Production rate = base_rate × (1 + sum(efficiency_bonus per member)), where efficiency_bonus = 0.25 × (0.8)^(member_index - 1) (diminishing returns).
- **Unlock Requirements:** Gold + guild level progression + boss map tickets.
- **Balance Goal:** Early upgrades accessible, late-game creates scarcity pivot at Hard difficulty.

### 20.1.2 Wood Extraction Upgrades

| Tier | Production Multiplier | Assignable Slots | Cost (Gold) | Cumulative Effect |
|------|----------------------|------------------|-------------|-------------------|
| Base | 1.0x (10 wood/min/member) | 3 | - | Baseline |
| Tier 1 | 1.5x | +1 (4 total) | 1,000 | 15 wood/min/member |
| Tier 2 | 2.25x | +1 (5 total) | 2,000 | 22.5 wood/min/member |
| Tier 3 | 3.375x | +1 (6 total) | 4,000 | 33.75 wood/min/member |
| Tier 4 | 5.0625x | +1 (7 total) | 8,000 | 50.625 wood/min/member |
| Tier 5 | 7.59375x | +1 (8 total) | 16,000 | 75.9375 wood/min/member |

**Member Example (Tier 5, 8 members):** Base 75.94 wood/min → With diminishing: ~1.61x total → ~122 wood/min effective.

### 20.1.3 Stone Mining Upgrades

| Tier | Production Multiplier | Assignable Slots | Cost (Gold) | Cumulative Effect |
|------|----------------------|------------------|-------------|-------------------|
| Base | 1.0x (8 stone/min/member) | 3 | - | Baseline |
| Tier 1 | 1.5x | +1 (4 total) | 1,000 | 12 stone/min/member |
| Tier 2 | 2.25x | +1 (5 total) | 2,000 | 18 stone/min/member |
| Tier 3 | 3.375x | +1 (6 total) | 4,000 | 27 stone/min/member |
| Tier 4 | 5.0625x | +1 (7 total) | 8,000 | 40.5 stone/min/member |
| Tier 5 | 7.59375x | +1 (8 total) | 16,000 | 60.75 stone/min/member |

**Ore Drop Scaling:** Upgrades increase rare ore drop rates (e.g., Tier 5: Iron 30%, Crystal 25%, Rare 20%).

### 20.1.4 Magic Extraction Upgrades

| Tier | Production Multiplier | Assignable Slots | Cost (Gold) | Cumulative Effect |
|------|----------------------|------------------|-------------|-------------------|
| Base | 1.0x (6 items/min/member) | 3 | - | Baseline |
| Tier 1 | 1.5x | +1 (4 total) | 1,000 | 9 items/min/member |
| Tier 2 | 2.25x | +1 (5 total) | 2,000 | 13.5 items/min/member |
| Tier 3 | 3.375x | +1 (6 total) | 4,000 | 20.25 items/min/member |
| Tier 4 | 5.0625x | +1 (7 total) | 8,000 | 30.375 items/min/member |
| Tier 5 | 7.59375x | +1 (8 total) | 16,000 | 45.5625 items/min/member |

**Item Tier Scaling:** Upgrades increase rare item drop rates (e.g., Tier 5: Spell Fragment 35%, Potion Ingredient 30%, Enchanted Essence 25%).

---

## Section 20.2: Crafting Room Upgrades (Workshop, Alchemy)

### 20.2.1 Upgrade Framework (Approach 1: Tier Unlock with Penalties)

**Core Mechanics:**
- **Upgrades unlock higher item tiers:** Each upgrade enables crafting next tier items.
- **Cost Scaling:** ×1.5x per upgrade (materials + gold).
- **Success Rate Penalty:** -10% per tier for higher rarity items.
- **Balance Goal:** Moderate penalties encourage specialization without frustration.

### 20.2.2 Workshop Upgrades

| Tier | Unlocks | Material Cost Multiplier | Success Rate Penalty | Notes |
|------|---------|------------------------|----------------------|-------|
| Base | Tier 1 Weapons/Armor | 1.0x | 95% (common) | Baseline crafting |
| Tier 1 | Tier 2 Weapons/Armor | 1.5x | -10% (85% for rare) | Increased durability |
| Tier 2 | Tier 3 Weapons/Armor | 2.25x | -20% (75% for epic) | Enchanted stats |
| Tier 3 | Tier 4 Weapons/Armor | 3.375x | -30% (65% for legendary) | Rare materials required |
| Tier 4 | Tier 5 Weapons/Armor | 5.0625x | -40% (55% for mythic) | Boss-tier quality |

**Crafting Time:** Scales with tier (5-15 min base, +50% per tier).

### 20.2.3 Alchemy Upgrades

| Tier | Unlocks | Material Cost Multiplier | Success Rate Penalty | Notes |
|------|---------|------------------------|----------------------|-------|
| Base | Basic Syringes | 1.0x | 90-95% | Healing/Buff/Debuff |
| Tier 1 | Advanced Syringes | 1.5x | -10% (80-85%) | Stronger effects |
| Tier 2 | Rare Syringes | 2.25x | -20% (70-75%) | Multi-target |
| Tier 3 | Epic Syringes | 3.375x | -30% (60-65%) | Permanent buffs |
| Tier 4 | Legendary Syringes | 5.0625x | -40% (50-55%) | Ultimate effects |

**Crafting Time:** Fixed 5-10 min, but random combination complexity increases.

---

## Section 20.3: Integration with Specialization & Economy

### 20.3.1 Specialization Impact

- **Armory Master:** Bonus -20% upgrade costs for Workshop, faster tier unlocks.
- **Potion Master:** Bonus -30% upgrade costs for Alchemy, faster tier unlocks.
- **Generalist:** No bonuses, but can upgrade all rooms.

### 20.3.2 Economic Flow Updates

**Hard Difficulty Pivot:** With max upgrades, specialists produce surplus (e.g., Armory: 400+ ore/hour), generalists deficit (-50 ore/hour), forcing specialization choice.

**Nightmare Scaling:** Upgrades enable Nightmare viability, but upkeep costs scale to prevent infinite progression.

---

## Section 20.4: Implementation Notes

- **UI:** Upgrade buttons in room interfaces, show before/after stats.
- **Persistence:** Upgrades saved in guild data.
- **Balance Testing:** Validate against Section 8 scarcity curves.
- **Future:** Add boss ticket requirements for Tier 4-5 to gate end-game.

---

**Room Upgrades Status:** Defined and integrated  
**Next Steps:** Implement in game code, test progression curves

# Section 18: Player-to-Player Trading System

**Purpose:** Enable specialization players to trade surplus resources/items with other players. Armory Master trades excess ore to Potion Master who trades excess magic items back. Creates living economy and mutual benefit.

---

## Section 18.1: Trading Mechanics Overview

### 18.1.1 Core Concept

**Primary Goal:** Create resource flows between specialized players so specialization choice doesn't create permanent scarcity but enables trade opportunities.

**Example Trade Flows:**

- **Armory Master** produces 200 ore/hour surplus → lists 100 ore on market for 50 gold each
- **Potion Master** produces 300 magic items/hour surplus → lists 100 items on market for 30 gold each
- Both players buy from each other → stabilizes economy + creates gold sinks

### 18.1.2 Trade Platform Types

**Option A: Centralized Marketplace (Recommended for MVP)**

- Asynchronous player-to-player transactions
- Players list items/resources with asking price
- Other players browse + purchase instantly
- Simpler to implement than real-time matching
- Better for idle game (players don't need to be online simultaneously)

**Option B: Direct Player Trade (Secondary)**

- Real-time trade request system
- Both players must be online
- Higher trust environment (see who you're trading with)
- Risk: griefing, scams if not careful

**Recommendation:** Launch with Option A (marketplace), add Option B later as social feature.

---

## Section 18.2: Marketplace Mechanics

### 18.2.1 Tradeable Item Categories

| Category | Item Type | Tradeable | Notes |
|----------|-----------|-----------|-------|
| **Resources** | Wood, Stone, Iron Ore, Crystal, Rare Ore | ✅ YES | Stack 99, core trade goods |
| **Magic Items** | All 8 types (Herb, Essence, etc.) | ✅ YES | Stack 99, high trade volume |
| **Common Equipment** | Tier 1-2 Weapons/Armor | ✅ YES | Enables gear acquisition |
| **Rare Equipment** | Tier 3+ Weapons/Armor | ✅ YES | Enchanted items valuable |
| **Spells/Potions** | Buff, Debuff, Healing syringes | ⚠️ LIMITED | Can trade (see decay below) |
| **Crafting Materials** | Recipes, catalysts, vouchers | ✅ YES | Enable new crafting paths |
| **Currency** | Gold, Gems | ❌ NO | Prevent RMT abuse |

**Why Spells/Potions Limited:**

- Syringes designed for single-map use (decay when zone changes)
- Trading potions meant for different maps = lower value
- Risk: players spam-buy potions to trivialize content
- **Mitigation:** Limited listings per day (max 20 potion listings/player), higher tax (15% instead of 5%)

### 18.2.2 Listing Mechanics

**Creating a Listing:**

- Player selects item → clicks "List for Sale"
- Dialog: **Item Name | Quantity | Price Per Unit | Duration**
- Price validation: min 1 gold, max reasonable cap (prevents gold waste)
- Duration options: 24 hours / 7 days / 30 days
- Listing fee: **5 gold per listing** (small, covers server cost concept)

**Active Listings Limit:**

- Max 50 active listings per player (prevents market spam)
- Can remove listings anytime (get listing fee back)
- When listing expires or sells out, returns to available pool

**Listing Tax Example:**

```
Listing: 50 Iron Ore @ 40 gold each
  - Subtotal if sold: 2,000 gold
  - Marketplace fee: 2,000 × 5% = 100 gold
  - Player receives: 1,900 gold
  - (Plus 5 gold listing fee refunded if removed)
```

### 18.2.3 Buying & Transaction

**Purchase Flow:**

- Player browses marketplace tab
- Filters by category, sort by price/rating/recency
- Clicks item → preview stats/enchants
- Confirm purchase → gold deducted instantly
- Item delivered to inventory (or backlog if full)

**Transaction Confirmation:**

- Buyer receives item immediately (on marketplace backend)
- Seller gold credited after ~5 minutes delay (prevents "flip" botting)
- Both parties see transaction history (optional reputation track)

**Failure Handling:**

- If buyer inventory full: item goes to backlog queue (auto-deliver when space opens)
- If seller disconnects: listing remains active (async system)
- If price changes during transaction: locked at listed price when clicked

### 18.2.4 Marketplace Tax & Gold Sinks

**Transaction Fee Schedule:**

| Item Type | Marketplace Fee | Reasoning |
|-----------|-----------------|-----------|
| Resources (ore, wood, items) | 5% | Common trade good, low friction |
| Common Equipment | 8% | Moderate value, prevent inflation |
| Rare Equipment | 10% | High value, steep sink |
| Spells/Potions | 15% | Risk mitigation, limited copies |
| Crafting Materials | 7% | Medium priority |

**Gold Flow Example (Nightmare Economy):**

- 10 players trading daily
- Average transaction: 500 gold per trade
- Total traded: 5,000 gold daily
- Marketplace tax collected: ~400 gold (8% average) → removed from economy

**Benefit:** Prevents gold inflation at endgame, creates sustainable sink alongside upkeep costs.

---

## Section 18.3: Integration with Specialization System

### 18.3.1 Specialization Trade Flows

**Armory Master Surplus:**

- Produces: 150-200 ore/hour
- Needs: ~100 ore/hour for crafting + repairs
- **Surplus:** 50-100 ore/hour available for trade
- Market price: 35-50 gold per ore (determined by supply/demand)
- **Gold/hour from trading:** 1,750 - 5,000 gold

**Potion Master Surplus:**

- Produces: 400-500 magic items/hour
- Needs: ~300 items/hour for syringe crafting
- **Surplus:** 100-200 items/hour available for trade
- Market price: 20-35 gold per item
- **Gold/hour from trading:** 2,000 - 7,000 gold

**Generalist Modest Production:**

- Produces: 50 ore + 100 items/hour
- Needs: 80 ore + 150 items/hour (balanced demand)
- **Surplus:** Minimal or deficit
- **Strategy:** Generalists might buy specialty resources to bridge gaps

### 18.3.2 Specialization Encourages Trading

**Scenario 1: Armory Master reaches Nightmare**

- Cannot produce potions → faces lower win rates
- Options:
  1. Buy potions from marketplace (expensive, -15% tax)
  2. Keep NPC shop discount (still -30% but limited per day)
  3. Trade ore to Potion Masters for gold, buy potions → no gold penalty
- **Result:** Trading creates alternative progression path

**Scenario 2: Potion Master needs tier-3 equipment**

- Cannot craft tier-3 gear (no workshop)
- Options:
  1. Farm gear from lower-difficulty drops (slow)
  2. Buy from NPC shop (expensive)
  3. **Trade magic items for gold → buy from marketplace Armory Masters**
- **Result:** Marketplace becomes natural meeting point

**Scenario 3: Guild-wide coordination (future)**

- Armory Master player trades excess ore to Potion Master player
- Potion Master shares crafted potions with Armory Master for quests
- Creates **guild economy** without formal trade mechanics (good emerging behavior)

### 18.3.3 Anti-Specialization Exploitation

**Risk: "Arbitrage Flipping"**

- Player buys ore cheap, relists expensive (no added value)
- **Mitigation:** 5% tax + 5 gold listing fee makes flipping unprofitable (lose 10+ gold instantly)

**Risk: NPC Shop Undercutting**

- NPC shop sets price floor (discount applies to specialists)
- Players cannot trade lower than NPC floor (unfair comparison)
- **Mitigation:** NPC shop prices linked to marketplace median price (dynamic pricing)
  - If ore > 50 gold average on market, NPC shop buys at 40 gold (incentives trade-in)
  - If ore < 30 gold on market, NPC shop sells at 35 gold (price support)

---

## Section 18.4: Scam Prevention & Trust System

### 18.4.1 Marketplace Safety

**No Direct P2P Risk** (marketplace is escrow-like):

- Player lists → gold taken immediately, item in escrow
- Buyer pays → item released to inventory, gold released to seller after delay
- No scamming possible (system mediates all transactions)

**Risk: Fake Listings**

- Player lists item at 1 gold to artificially deflate market
- **Mitigation:**
  - Price floor based on rarity (common ore min 10 gold, rare min 50 gold)
  - Listing flagged if <50% of median market price (warning popup)
  - Rate limiting on price changes (can only adjust every 6 hours)

### 18.4.2 Reputation System (Optional, Phase 2)

**Player Reputation Tracked:**

- Transaction count (how many trades)
- Average price paid/received (reliability metric)
- Feedback rating (1-5 stars) from recent trades
- **Display in marketplace:** Player badge showing "Trustworthy Trader" or "New Player"

**Benefits:**

- Transparency builds confidence
- Encourages honest pricing (players avoid suspiciously cheap listings)
- Basis for future guild features

---

## Section 18.5: Marketplace Balancing

### 18.5.1 Supply Controls

**Resource Abundance Throttle:**

- If ore trading exceeds 10,000 units/day, marketplace tax increases to 7%
- If magic items exceed 30,000 units/day, tax increases to 8%
- **Rationale:** Prevent flooding if specialization creates too much surplus

**Rare Item Scarcity:**

- Tier-3+ equipment drops capped at ~5% encounter rate (prevent inflation)
- Marketplace limits: max 1 listing per Tier-4 item per player per week
- **Rationale:** Preserve legendary item value

### 18.5.2 Price Stability

**Weekly Price Report (Optional):**

- System tracks median prices weekly
- Large deviations trigger balance review
- If ore median price jumps >20% week-over-week → adjust NPC shop price

**Example:**

```
Week 1: Ore median = 40 gold
Week 2: Ore median = 55 gold (+37.5%)
Action: Flag for review, consider reducing mine tier ore drop rates slightly
Week 3: Ore median = 42 gold (stabilized)
```

### 18.5.3 Deflation Protection

**If Resources Become Too Cheap:**

- Players stop trading (no profit incentive)
- Economic stagnation
- **Solution:** New demand sinks
  - Introduce cosmetic upgrades (costs ore/gold)
  - Add "Guild Vault" storage rooms (upgrading costs resources)
  - Premium crafting catalyst (10 ore + 5 gold per craft)

---

## Section 18.6: Implementation Phases

### Phase 1: Basic Marketplace (Week 1)

1. **Listing system:** Create/remove listings, price limits
2. **Buying flow:** Browse, filter, instant purchase
3. **Inventory delivery:** Items land in inventory or backlog
4. **Marketplace fee:** 5% tax, automatically deducted
5. **Persistence:** Listings stored in save file + cloud backup

### Phase 2: Anti-Abuse (Week 2)

1. **Price floors/caps** by rarity
2. **Daily listing limits** per item type
3. **Tax adjustments** if supply explodes
4. **Cooldown:** Can't buy then immediately resell same item (6-hour min hold)

### Phase 3: Enhanced Features (Week 3+)

1. **Reputation system** (stars, trade count, median price)
2. **Advanced filters** (by seller rating, price range, enchant stats)
3. **Wishlist** (save searches, get notified when item listed)
4. **Marketplace history** (price trends, rarity heatmaps)
5. **Guild marketplace** (guild-only listings, internal trades)

---

## Section 18.7: Projected Economic Impact

### 18.7.1 Gold Flow Simulation

**Scenario: 100 active players, mix of specializations**

- 40 Armory Masters (ore surplus)
- 40 Potion Masters (magic item surplus)
- 20 Generalists (balanced)

**Daily Activity:**

```
Armory Masters
- Each trades 1,500 ore/day @ avg 40 gold = 60,000 gold per player
- Total: 2.4M gold traded daily
- Marketplace fee (5%): 120K gold removed from economy

Potion Masters
- Each trades 3,000 items/day @ avg 25 gold = 75,000 gold per player
- Total: 3M gold traded daily
- Marketplace fee (5%): 150K gold removed from economy

Generalists
- Buy ore + items to bridge gaps
- Average 50K gold spent daily per player
- Total: 1M gold traded daily
- Marketplace fee (5%): 50K gold removed

Daily Gold Sink via Marketplace: 320K gold
Combined with upkeep (assume 500K/day total) = 820K gold/day removed
Balanced against quest rewards + NPC shop sales
```

**Result:** Healthy deflationary pressure on top-tier economy without harsh penalties.

### 18.7.2 Player Engagement Metrics

**Expected Outcomes:**

- **Marketplace activity:** >70% of active players list/buy weekly
- **Trade completion rate:** >90% (items sell within 3 days)
- **Specialization satisfaction:** Specialists report marketplace trading as "profitable" vs "stuck with surplus"
- **Economic diversity:** Generalists remain viable through smart marketplace purchases

---

## Section 18.8: Edge Cases & Risk Mitigation

### 18.8.1 Risk: Multi-Account Farming

**Problem:** Player creates 10 alt accounts, each specialist, funnels surplus to main.

**Mitigation:**

- Marketplace fee scales with transaction count (10+ trades/day → +2% fee)
- Daily listing limits (50 listings per player, shared across alts if detected)
- Rate limiting: Can only trade same item type 5 times/hour
- Account linking: If IPs overlap, system flags accounts as related (optional restriction)

### 18.8.2 Risk: Gold Inflation Spiral

**Problem:** Players farm ore, sell to marketplace, buy potions, repeat → gold accumulates endlessly.

**Mitigation:**

- Marketplace tax (5-15%) removes gold consistently
- Upkeep costs scale with progression (endgame upkeep ~500K/day for full roster)
- New content introduces expensive cosmetics/upgrades
- NPC shop always available but discounted only for specialists (generalists pay full price)

### 18.8.3 Risk: Price Fixing Collusion

**Problem:** Armory Master players agree to list ore at 100 gold to artificially inflate prices.

**Mitigation:**

- Marketplace shows price history (last 7 days median price visible)
- Price gouging flag: Listing >150% median price gets warning icon
- Player reviews/reputation: Buyers avoid suspicious traders
- Moderator oversight: Can observe unusual price spikes, adjust NPC prices if needed

### 18.8.4 Risk: Dead Specialization

**Problem:** Potion Master produces so much surplus that prices crash (ore drops to 5 gold).

**Mitigation:**

- Dynamic difficulty: New content introduced requiring more potions (demand increases)
- Marketplace scaling: Tax increases when resource supply exceeds threshold (natural brake)
- NPC shop price floor: If marketplace price drops below threshold, NPC shop price supports it
- Seasonal rebalance: Every month, adjust specialization bonuses if needed

---

## Section 18.9: Success Metrics & Validation

### 18.9.1 Marketplace Health Metrics

| Metric | Target | Reasoning |
|--------|--------|-----------|
| **Weekly active traders** | >60% of players | High engagement with economy |
| **Median listing time** | <24 hours | Fast turnover indicates healthy demand |
| **Price variance (weekly)** | <±15% | Stable economy, predictable |
| **Average transaction size** | 500-2000 gold | Sweet spot for meaningful trades |
| **Specialization trade volume** | >50% of all marketplace activity | Validates specialization → trading loop |

### 18.9.2 Economic Health Indicators

| Indicator | Target | Action if Exceeded |
|-----------|--------|-------------------|
| **Daily gold sink** | 300-500K per 100 players | Add more sinks (cosmetics, guild upgrades) |
| **Ore average price** | 30-60 gold | Adjust mine drop rates, NPC shop price |
| **Potion average price** | 20-40 gold | Adjust alchemy production speed |
| **Generalist wealth ratio** | 80-120% of specialist average | Rebalance if generalists fall too far behind |

---

## Section 18.10: Marketplace Rules & TOS

### 18.10.1 Prohibited Conduct

**Not Allowed:**

- Listing items for 0 gold (market spam)
- Repeatedly buying/selling same item to manipulate prices (must hold 6+ hours)
- Account sharing or trading (accounts are personal)
- Phishing/scam communications (marketplace is safe, but external contact unsafe)
- Selling accounts or items for real money (RMT forbidden)

### 18.10.2 Enforcement

- **First offense:** Warning + listing fee forfeit
- **Second offense:** 7-day marketplace suspension
- **Third offense:** Permanent marketplace ban + rollback of suspicious trades
- **Severe (RMT):** Account permanent ban

---

## Section 18.11: Future Expansions

### Phase 4+: Advanced Trading

1. **Guild Marketplace:** Guild-only listings, internal trading at reduced tax (3%)
2. **Trading Contracts:** Players pre-agree trades, execute when items ready (scheduled trades)
3. **Escrow for High-Value:** For rare items, neutral marketplace holds pending 24-hour confirmation
4. **Trading Chat:** In-game channel for negotiation (moderated)
5. **Dynamic Events:** "Rare ore shortage" events that spike market prices for 24 hours

---

## Section 18.12: Summary

**Player-to-Player Trading System Design:**

✅ **Enables specialization economy** - Armory Masters trade ore, Potion Masters trade items, mutual benefit created  
✅ **Prevents abuse** - 5-15% tax + listing fees + price controls prevent exploitation  
✅ **Remains simple** - No complex matching algorithms, just list & buy at fixed price  
✅ **Scales gold sinks** - 300-500K gold removed daily keeps economy healthy  
✅ **Creates emergent gameplay** - Players discover trading as natural progression path  

**Launch with Phase 1 (basic marketplace) → iterate based on telemetry → expand to Phase 3+ features as needed.**

---

**Marketplace System Status:** Ready for Implementation  
**Integration with Specialization:** Direct (ore/potion trade flows)  
**Expected Player Impact:** +40% retention via economic engagement

---

# Section 19: Enhanced Specialization Branches with Interdependencies

**Purpose:** Adjust specialization branches to create meaningful interdependencies. Each specialization produces surpluses but requires marketplace purchases and adventure drops to progress, creating a living economy where players must engage with multiple systems.

---

## Section 19.1: Revised Specialization Framework

### 19.1.1 Core Philosophy

**Before:** Specializations were self-contained (produce everything needed internally)  
**After:** Specializations create surpluses but require external inputs to maximize potential

**Key Changes:**
- Each specialization has **surplus outputs** (what they produce in abundance)
- Each specialization has **critical dependencies** (what they must buy/acquire externally)
- Dependencies tie into **marketplace trading** and **adventure quest drops**
- Creates **economic loops** where specializations feed each other

---

## Section 19.2: Armory Master (Weapon/Armor Production Focus)

### 19.2.1 Core Production (Surplus)

**Primary Output:** High-tier weapons and armor  
**Surplus Items:** Tier 2-4 weapons/armor, refined ore, crafting catalysts  
**Marketplace Role:** Seller of equipment, buyer of recipes/materials

### 19.2.2 Critical Dependencies (What They Need)

**High-Tier Recipes:** Cannot craft Tier 3+ equipment without rare recipes
- **Source:** Marketplace purchases from Adventure Masters
- **Cost:** 500-2,000 gold per rare recipe
- **Drop Rate:** Rare recipes drop from S-Rank quests (5-10% chance)
- **Problem:** Armory Master doesn't do quests → must buy recipes from players who do

**Rare Crafting Materials:** Enchanted ore, crystal shards for legendary gear
- **Source:** Adventure drops (boss encounters) OR marketplace
- **Cost:** 200-500 gold per enchanted ore
- **Drop Rate:** 2-5% from A-Rank+ enemies
- **Problem:** Armory Master mines basic ore → needs rare materials for best gear

### 19.2.3 Economic Flow Example

```
Armory Master Progression Path:
├─ Early Game: Craft Tier 1-2 gear (self-sufficient)
├─ Mid Game: Need Tier 3 recipes → Buy from marketplace @ 1,000 gold each
├─ Late Game: Need enchanted materials → Buy from marketplace OR do occasional quests
├─ Revenue: Sell surplus Tier 2 gear @ 300 gold each → 5,000 gold/hour
├─ Net Position: Breaks even at mid-game, profitable at end-game
```

### 19.2.4 Balance Adjustments

**Production Bonuses:**
- +25% workshop speed (existing)
- +20% ore production (existing)
- **NEW:** +15% success rate on high-tier crafts (reduces recipe waste)

**Dependency Costs:**
- Must buy 80% of rare recipes from marketplace
- Must acquire 60% of enchanted materials externally
- **Mitigation:** -20% discount on equipment marketplace purchases (existing)

---

## Section 19.3: Potion Master (Alchemy Focus)

### 19.3.1 Core Production (Surplus)

**Primary Output:** Buff/debuff/healing syringes  
**Surplus Items:** Common syringes, excess magic items, alchemy catalysts  
**Marketplace Role:** Seller of potions, buyer of rare ingredients

### 19.3.2 Critical Dependencies (What They Need)

**Rare Magic Ingredients:** Enchanted essence, mutation gel, void dust
- **Source:** Adventure quest drops (specific enemy types)
- **Cost:** 150-400 gold per rare ingredient on marketplace
- **Drop Rate:** 3-8% from mutated creatures, ether beings, mist entities
- **Problem:** Potion Master extracts basic magic items → needs rare drops for advanced potions

**High-Tier Alchemy Recipes:** Advanced syringe formulas
- **Source:** Marketplace purchases OR occasional quest completion
- **Cost:** 800-1,500 gold per advanced recipe
- **Drop Rate:** 5-15% from boss encounters
- **Problem:** Potion Master focuses on alchemy → rarely completes quests for recipes

### 19.3.3 Economic Flow Example

```
Potion Master Progression Path:
├─ Early Game: Basic healing/buff syringes (self-sufficient)
├─ Mid Game: Need rare ingredients → Buy from marketplace @ 300 gold each
├─ Late Game: Need advanced recipes → Buy from marketplace OR complete 1-2 quests/week
├─ Revenue: Sell surplus syringes @ 50 gold each → 3,000 gold/hour
├─ Net Position: Small deficit at mid-game, highly profitable at end-game
```

### 19.3.4 Balance Adjustments

**Production Bonuses:**
- +30% alchemy speed (existing)
- +25% magic item production (existing)
- **NEW:** +20% double product chance on rare syringes

**Dependency Costs:**
- Must buy 70% of rare ingredients from marketplace
- Must acquire 50% of advanced recipes externally
- **Mitigation:** -30% discount on potion marketplace purchases (existing)

---

## Section 19.4: Adventure Master (Quest Completion Focus)

### 19.4.1 Core Production (Surplus)

**Primary Output:** Quest completion, rare drops, boss loot  
**Surplus Items:** Rare recipes, enchanted materials, surplus gear/potions  
**Marketplace Role:** Seller of rare drops/recipes, buyer of consumables

### 19.4.2 Critical Dependencies (What They Need)

**High-Quality Gear:** Tier 3+ weapons/armor for harder quests
- **Source:** Marketplace purchases from Armory Masters
- **Cost:** 800-2,000 gold per piece of rare gear
- **Problem:** Adventure Master focuses on quests → limited crafting time for gear

**Combat Consumables:** Buff/debuff syringes for boss fights
- **Source:** Marketplace purchases from Potion Masters
- **Cost:** 100-300 gold per syringe
- **Problem:** Adventure Master focuses on combat → limited alchemy time for potions

### 19.4.3 Economic Flow Example

```
Adventure Master Progression Path:
├─ Early Game: Basic quests with starter gear (self-sufficient)
├─ Mid Game: Need better gear → Buy from marketplace @ 1,200 gold each
├─ Late Game: Need potions for bosses → Buy from marketplace @ 200 gold each
├─ Revenue: Sell rare recipes @ 1,000 gold each + enchanted ore @ 400 gold each
├─ Net Position: Moderate deficit throughout, but highest quest rewards
```

### 19.4.4 Balance Adjustments

**Production Bonuses:**
- +20% quest completion speed
- +15% rare drop rate from enemies
- **NEW:** +25% gold rewards from quests (compensates for marketplace spending)

**Dependency Costs:**
- Must buy 60% of rare gear from marketplace
- Must buy 70% of combat potions from marketplace
- **Mitigation:** +10% sell price on all quest drops (recipes, materials)

---

## Section 19.5: Mining Master (Ore Production Focus)

### 19.5.1 Core Production (Surplus)

**Primary Output:** Raw ore, stone, refined metals  
**Surplus Items:** All ore types, surplus stone/wood  
**Marketplace Role:** Pure seller, minimal buyer

### 19.5.2 Critical Dependencies (What They Need)

**Mining Tools/Upgrades:** Advanced pickaxes, mining catalysts
- **Source:** Marketplace purchases OR occasional crafting
- **Cost:** 300-800 gold per mining upgrade
- **Problem:** Mining Master focuses on extraction → limited workshop time

**Rare Ore Processing:** Need workshop access for smelting
- **Source:** Must use limited workshop slots OR buy refined ore
- **Cost:** 50-100 gold per refined ore unit
- **Problem:** Mining Master has no workshop → must process externally

### 19.5.3 Economic Flow Example

```
Mining Master Progression Path:
├─ Early Game: Basic stone/ore mining (self-sufficient)
├─ Mid Game: Need mining upgrades → Buy from marketplace @ 500 gold each
├─ Late Game: Need smelting capacity → Rent workshop slots OR buy refined ore
├─ Revenue: Sell ore @ 40 gold each → 4,000 gold/hour
├─ Net Position: Small deficit at mid-game, highly profitable at end-game
```

### 19.5.4 Balance Adjustments

**Production Bonuses:**
- +30% mining speed (existing)
- +25% ore production (existing)
- **NEW:** +20% rare ore drop rate

**Dependency Costs:**
- Must buy 40% of mining upgrades from marketplace
- Must process 50% of rare ore externally
- **Mitigation:** -15% discount on mining-related marketplace purchases

---

## Section 19.6: Magic Item Master (Magic Extraction Focus)

### 19.6.1 Core Production (Surplus)

**Primary Output:** All magic item types, spell fragments  
**Surplus Items:** Common/rare magic items, excess fragments  
**Marketplace Role:** Pure seller, minimal buyer

### 19.6.2 Critical Dependencies (What They Need)

**Magic Extraction Tools:** Advanced catalysts, extraction enhancers
- **Source:** Marketplace purchases OR occasional crafting
- **Cost:** 400-900 gold per magic tool
- **Problem:** Magic Master focuses on extraction → limited workshop time

**Rare Magic Processing:** Need alchemy access for advanced items
- **Source:** Must use limited alchemy slots OR buy processed items
- **Cost:** 60-120 gold per processed magic item
- **Problem:** Magic Master has no alchemy → must process externally

### 19.6.3 Economic Flow Example

```
Magic Item Master Progression Path:
├─ Early Game: Basic magic extraction (self-sufficient)
├─ Mid Game: Need extraction tools → Buy from marketplace @ 600 gold each
├─ Late Game: Need processing capacity → Rent alchemy slots OR buy processed items
├─ Revenue: Sell magic items @ 25 gold each → 3,500 gold/hour
├─ Net Position: Small deficit at mid-game, highly profitable at end-game
```

### 19.6.4 Balance Adjustments

**Production Bonuses:**
- +30% magic extraction speed (existing)
- +25% magic item production (existing)
- **NEW:** +20% rare magic item drop rate

**Dependency Costs:**
- Must buy 40% of magic tools from marketplace
- Must process 50% of rare magic items externally
- **Mitigation:** -15% discount on magic-related marketplace purchases

---

## Section 19.7: Inter-Specialization Trade Flows

### 19.7.1 Economic Web Diagram

```
Armory Master ────► Adventure Master
     │                       │
     │                       │
     ▼                       ▼
Potion Master ◄─── Mining Master
     │                       │
     │                       │
     ▼                       ▼
Magic Item Master ◄────────────
```

**Key Trade Pairs:**
- **Armory ↔ Adventure:** Gear for recipes/materials
- **Potion ↔ Adventure:** Potions for rare ingredients/recipes
- **Mining ↔ Armory:** Raw ore for refined ore/tools
- **Magic ↔ Potion:** Raw magic items for processed items/tools

### 19.7.2 Marketplace Price Dynamics

**Supply/Demand by Specialization:**

| Item Type | High Supply From | High Demand From | Price Trend |
|-----------|------------------|------------------|-------------|
| Rare Recipes | Adventure Master | Armory Master | High (1,000-2,000 gold) |
| Rare Ingredients | Adventure Master | Potion Master | Medium-High (300-500 gold) |
| Raw Ore | Mining Master | Armory Master | Low-Medium (40-60 gold) |
| Raw Magic Items | Magic Item Master | Potion Master | Low-Medium (25-40 gold) |
| Tier 3+ Gear | Armory Master | Adventure Master | High (1,000-2,000 gold) |
| Syringes | Potion Master | Adventure Master | Medium (100-300 gold) |

### 19.7.3 Economic Balance Checks

**Profitability Comparison (End-Game):**

| Specialization | Revenue/Hour | Costs/Hour | Net Profit | Viability |
|----------------|--------------|------------|------------|----------|
| Armory Master | 5,000 gold | 3,000 gold | +2,000 | High |
| Potion Master | 3,000 gold | 2,500 gold | +500 | Medium-High |
| Adventure Master | 4,000 gold | 4,500 gold | -500 | Medium (quest rewards compensate) |
| Mining Master | 4,000 gold | 1,500 gold | +2,500 | High |
| Magic Item Master | 3,500 gold | 1,500 gold | +2,000 | High |

**Key Insight:** No specialization is "broken" - each has unique advantages and dependencies.

---

## Section 19.8: Adventure System Integration

### 19.8.1 Quest Drop Tables by Enemy Type

**Mutated Creatures (Potion Master needs these drops):**
- Mutation Gel: 8% drop rate
- Radiant Fragment: 5% drop rate
- Void Dust: 3% drop rate

**Ether Beings (Potion Master needs these drops):**
- Etherbloom Herb: 6% drop rate
- Etheric Slime: 4% drop rate

**Mist Entities (Potion Master needs these drops):**
- Mist Essence: 7% drop rate
- Fogweed: 5% drop rate

**Ancient Guardians (Armory Master needs these drops):**
- Enchanted Ore: 4% drop rate
- Crystal Shards: 6% drop rate
- Rare Ore: 2% drop rate

### 19.8.2 Boss Encounter Rewards

**Zone Bosses (S-Rank):**
- Rare recipes: 15% chance
- Advanced alchemy formulas: 10% chance
- Legendary crafting materials: 5% chance

**World Bosses (Special Events):**
- Unique recipes: 100% chance (one per boss)
- Epic materials: 20% chance
- Guild-wide marketplace listings

### 19.8.3 Adventure Master Quest Bonuses

**Quest Completion Rewards:**
- Base gold: 2,500 per S-Rank quest
- Rare drops: 25% bonus chance
- Recipe drops: 20% bonus chance
- **Total value:** 3,000-4,000 gold per quest (compensates for marketplace spending)

---

## Section 19.9: Implementation Phases

### Phase 1: Core Dependencies (Week 1-2)
1. **Recipe System:** Implement rare recipe drops from quests
2. **Marketplace Categories:** Add recipe and rare material trading
3. **Adventure Drops:** Balance drop rates for specialization dependencies
4. **Specialization Locks:** Prevent crafting without required recipes/materials

### Phase 2: Economic Balancing (Week 3-4)
1. **Price Monitoring:** Track marketplace prices by item type
2. **Dependency Ratios:** Tune how much each specialization must buy externally
3. **Profit Balancing:** Ensure no specialization is unviable
4. **Cross-Specialization Trades:** Verify trade flows work as intended

### Phase 3: Advanced Features (Week 5+)
1. **Recipe Research:** Allow players to research recipes (alternative to buying)
2. **Guild Trades:** Internal guild marketplace with reduced fees
3. **Seasonal Events:** Special quests that favor certain specializations
4. **Economic Analytics:** Dashboard showing specialization profitability

---

## Section 19.10: Risk Assessment & Mitigations

### 19.10.1 Risk: Specialization Frustration

**Problem:** Players get stuck because they can't buy critical dependencies  
**Mitigation:**
- NPC shop sells basic versions of all dependencies (expensive, no discount)
- Tutorial quests provide starter recipes/materials
- Free respec option during first 24 hours of specialization choice

### 19.10.2 Risk: Economic Imbalance

**Problem:** One specialization becomes dominant through trading  
**Mitigation:**
- Regular economic reviews (weekly price monitoring)
- Dynamic marketplace taxes (increase on oversupplied items)
- Balance patches that adjust dependency requirements

### 19.10.3 Risk: Player Confusion

**Problem:** Complex interdependencies overwhelm new players  
**Mitigation:**
- Clear UI indicators showing what each specialization needs/buys
- Specialization onboarding quests
- Marketplace tutorials with trade recommendations

### 19.10.4 Risk: Market Manipulation

**Problem:** Players coordinate to manipulate prices  
**Mitigation:**
- Price floors/ceilings prevent extreme manipulation
- Transaction volume limits per player
- Anti-bot measures (transaction delays, captcha for high-volume traders)

---

## Section 19.11: Success Metrics

### 19.11.1 Economic Health

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Cross-specialization trade volume** | >40% of marketplace activity | Validates interdependency design |
| **Specialization satisfaction** | >75% of players report feeling "strategic" | Dependencies create meaningful choices |
| **Marketplace dependency fulfillment** | >80% of critical items available | Prevents frustration |
| **Economic diversity** | No specialization <60% profitability of best | Maintains choice viability |

### 19.11.2 Player Behavior

| Behavior | Target | Measurement |
|----------|--------|-------------|
| **Specialization switching** | <15% switch within first week | Players commit to chosen path |
| **Marketplace engagement** | >70% of players trade weekly | Active participation in economy |
| **Adventure completion** | >60% of Adventure Masters complete 5+ quests/week | Core loop engagement |
| **Cross-system usage** | >50% of players use marketplace + adventures | Interdependency success |

---

## Section 19.12: Alternative Approaches Considered

### 19.12.1 "Soft Dependencies" (Rejected)

**Idea:** Specializations can slowly research dependencies internally (no marketplace requirement)  
**Why Rejected:** Removes trading incentive, makes specializations too self-sufficient

### 19.12.2 "Guild-Only Trading" (Deferred)

**Idea:** Dependencies only tradable within guilds  
**Why Deferred:** Too restrictive for solo players, implement after basic system proves successful

### 19.12.3 "Dynamic Specialization" (Considered)

**Idea:** Allow players to temporarily "borrow" other specialization capabilities  
**Why Considered:** Could reduce frustration, but might dilute specialization identity

---

## Section 19.13: Summary & Recommendations

**Enhanced Specialization Framework:**

✅ **Creates meaningful interdependencies** - Each specialization needs external inputs to maximize potential  
✅ **Integrates marketplace deeply** - Trading becomes core to specialization success  
✅ **Balances adventure system** - Quest drops become critical for progression  
✅ **Maintains specialization identity** - Each path still has unique advantages  
✅ **Prevents softlocks** - NPC shop + tutorial support ensure accessibility  

**Implementation Priority:**
1. **Phase 1:** Recipe drops + marketplace categories (core dependencies)
2. **Phase 2:** Economic balancing + price monitoring
3. **Phase 3:** Advanced features + analytics

**Expected Outcome:** Specializations become strategic choices with real trade-offs, creating a vibrant player-driven economy where marketplace activity is essential for optimal progression.

---

**Status:** Ready for Design Review  
**Complexity:** Medium-High (requires marketplace + adventure integration)  
**Timeline:** 4-6 weeks implementation  
**Risk Level:** Medium (economic balancing requires iteration)
