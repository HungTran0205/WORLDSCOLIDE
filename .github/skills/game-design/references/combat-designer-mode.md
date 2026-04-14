# Mode: Combat Designer

**Activation:** User asks to design combat systems, damage formulas, status effects, enemy AI, action economy, or combat feel.

## Design Process

1. Define combat PX Goal: Fast & visceral? Tactical & deliberate? Chaotic & emergent?
2. Establish action economy (GCD, animation locks, queue system)
3. Design damage formula and stat interactions
4. Create status effect taxonomy and interaction rules
5. Define enemy archetypes that test specific player skills
6. Specify combat feel requirements (feedback, juice, responsiveness)

## Combat System Pillars (from Lambottin)

1. **Unique Function per Ability** — no redundant tools
2. **Risk vs Reward Trade-offs** — power costs something
3. **Spatial-Temporal Evaluation** — distance + timing = skill expression
4. **Enemy-Ability Matching** — enemies teach tool usage
5. **Difficulty via Variation** — add complexity, don't break rules
6. **Player Anticipation & Agency** — clever choices, not twitch reactions alone

## Combat Feel Checklist

- Input responsiveness (< 100ms feedback)
- Hit confirmation (visual + audio + haptic)
- Animation weight and momentum
- Screen shake and impact freeze
- Particle and VFX clarity
- Sound design (hit, crit, block, dodge distinctions)

## Output Template

```
COMBAT SYSTEM: [Name/Game Title]
PX GOALS: Primary: [goal] | Secondary: [goals]
COMBAT TEMPO: [Slow-methodical / Medium-tactical / Fast-action / Frenetic-chaos]
ACTION ECONOMY: [GCD length, animation cancel policy, ability queue depth]

DAMAGE FORMULA:
[Base formula, scaling model (additive/multiplicative), crit system, damage types]
Example: FinalDmg = (BaseDmg + StatScaling) x SkillMult x (1 + CritBonus) x TypeMod - Mitigation

STAT SYSTEM:
- [Stat]: [What it affects, scaling curve, soft/hard caps]

STATUS EFFECTS:
| Effect | Duration | Stacking | Interaction Rules | Counterplay |
|--------|----------|----------|-------------------|-------------|
| [Stun] | [2s]     | [No]     | [DR after 2 apps] | [CC break]  |

ENEMY ARCHETYPES:
1. [Name] — [Behavior pattern, player skill tested, ability it teaches]
2. [Name] — [...]

COMBAT FEEL SPEC:
- Input-to-feedback latency: [target ms]
- Hit confirmation: [visual + audio + screen effects]
- Impact weight: [freeze frames, screen shake intensity]
- Readability priority: [player safety > visual spectacle]

DIFFICULTY SCALING:
[Stat inflation, mechanic addition, AI improvement, or combination?]

MULTIPLAYER CONSIDERATIONS:
[Netcode implications, ability interactions, friendly fire, group size scaling]
```

## Difficulty Scaling Approaches

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| Stat inflation | Easy to tune | Feels artificial | Early difficulty tiers |
| Mechanic addition | Adds depth | Complexity ceiling | Mid-to-late content |
| AI improvement | Feels fair | Hard to develop | Action-focused games |
| Combination | Most flexible | Hardest to balance | Live-service games |

## Enemy Design Principles

- Each archetype teaches player to use specific tools (shield enemy -> piercing attack)
- Scale by adding properties to existing mechanics, not breaking rules
- Enemies should be readable within 1-2 encounters
- Mix archetypes to create combo challenges (ranged + melee + healer)
- Boss enemies combine 2-3 archetype behaviors with unique signature ability
