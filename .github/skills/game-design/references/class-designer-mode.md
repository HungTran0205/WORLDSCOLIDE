# Mode: Class/Character Designer

**Activation:** User asks to design character classes, archetypes, ability kits, talent trees, specializations, or character progression systems.

## Design Process

1. Define the **Class Fantasy** — not what it DOES, but what it IS (identity pillars)
2. Map to PX Goals: What experience does playing this class deliver?
3. Define role (Tank / Healer / DPS / Support / Hybrid) and unique fulfillment
4. Design ability kit following the Kit Architecture
5. Create resource system that creates meaningful decisions
6. Design talent/specialization tree for build diversity
7. Balance against existing classes (asymmetric balance, not mirror)

## Kit Architecture (Follow This Structure)

```
ABILITY KIT LAYERS:
1. CORE ABILITY (Spammable)     — Bread-and-butter, defines basic rhythm
2. BUILDERS (Resource Gen)       — Generate class resource through gameplay
3. SPENDERS (Resource Use)       — Spend resource for impactful effects
4. UTILITY (Situational)         — Movement, CC, defensive, party buffs
5. COOLDOWNS (Medium CD)         — Powerful abilities, 30s-2min cooldowns
6. ULTIMATE (Long CD)            — Defining class moment, 3-5min CD
7. PASSIVE SYSTEM                — Background effects shaping playstyle
```

## Output Template

```
CLASS: [Name]
FANTASY: [2-3 sentence identity statement — what IS this class?]
IDENTITY PILLARS: [3 thematic anchors, e.g., "Shadow, Deception, Patience"]
PX GOALS: Primary: [goal] | Secondary: [goals]
ROLE: [Tank / Healer / DPS / Support / Hybrid]
RESOURCE: [Name and mechanics — e.g., "Rage: builds from damage dealt/taken, decays OOC"]
COMPLEXITY: [Low / Medium / High / Expert]

ABILITY KIT:

Core Ability:
- [Name]: [Description, damage/effect, resource interaction]
  PX Purpose: [Why this feels good to press repeatedly]

Builders:
- [Name]: [Description]

Spenders:
- [Name]: [Description, resource cost]

Utility:
- [Name]: [Description — movement/CC/defensive/buff]

Cooldowns:
- [Name]: [Description, cooldown, impact]

Ultimate:
- [Name]: [Description, long cooldown, signature moment]
  Signature Fantasy: [Class-defining ability feeling]

Passives:
- [Name]: [Description — how it shapes playstyle]

TALENT/SPEC TREE:
Spec A: [Name] — [Theme, playstyle shift, PX emphasis]
Spec B: [Name] — [Theme, playstyle shift]
Spec C: [Name] — [Theme, playstyle shift] (if applicable)

KEY DECISION POINTS:
[Meaningful build choices and trade-offs]

STRENGTHS: [2-3 situations where this class shines]
WEAKNESSES: [2-3 situations where this class struggles]
SYNERGIES: [Classes/roles that pair well and why]
COUNTERS: [What counters this class in PvP/competitive]

PROGRESSION CURVE:
- Levels 1-10: [Available abilities, learning curve]
- Levels 10-30: [Kit expansion, complexity increase]
- Levels 30-50: [Specialization unlocks, build diversity]
- Endgame: [Mastery expression, optimization ceiling]

BALANCE NOTES:
- PvE target DPS/HPS/TPS relative to benchmark
- PvP strengths/weaknesses by matchup
- Known degenerate builds to watch for
```

## Design Principles (ENFORCE)

- Fantasy first, balance second — boring but balanced = failure
- Every class needs a "moment to shine" — a situation where they're THE pick
- Build diversity > build optimization — multiple viable paths
- Complexity rewards investment, doesn't gatekeep (low floor, high ceiling)
- Asymmetric balance: classes are different, not equal in all dimensions
- Archetype != Class: "tank" is archetype, class implements it with unique flavor
- Progression expands options, not just inflates numbers
