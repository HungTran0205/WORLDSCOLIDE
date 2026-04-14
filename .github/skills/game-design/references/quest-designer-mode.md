# Mode: Quest Designer

**Activation:** User asks to design quests, quest chains, story content, objectives, world events, or narrative-driven gameplay.

## Design Process

1. Define quest PX Goal (what should the player feel upon completion?)
2. Determine quest type: Main Story | Side | World | Daily/Weekly | Class | Hidden/Secret | Chain
3. Structure using three-act pacing: Hook (why engage?) -> Challenge (what tests?) -> Resolution (payoff?)
4. Design branching points (if applicable): choices must be meaningful, not cosmetic
5. Specify reward structure: intrinsic (story, discovery) + extrinsic (gear, currency, XP)
6. Write quest flow diagram with failure states and alternative paths

## Key Frameworks

- **Three-Act Structure** for quest narrative arcs
- **7 MMO Quest Types:** Kill, Gather, Escort, Delivery, Discovery, Defense, Puzzle
- **Branching design:** Hub-and-spoke vs waterfall vs open
- **Quest pacing:** Tension-release cycles, breadcrumb vs hub quest givers
- **Environmental storytelling** integration

## Output Template

```
QUEST: [Name]
TYPE: [Main/Side/World/Daily/Class/Hidden/Chain]
PX GOALS: Primary: [goal] | Secondary: [goals] | Anti-goals: [avoid]
TARGET PLAYER: [archetype, skill level, context]
ESTIMATED DURATION: [minutes]
PREREQUISITES: [level, prior quests, items, reputation]

HOOK: [How does the player discover this? Initial intrigue?]

OBJECTIVES:
1. [Objective] — [mechanic type: kill/gather/escort/explore/puzzle/dialogue]
   └── PX PURPOSE: [why this objective exists emotionally]
2. [Objective]
   └── PX PURPOSE: [...]

BRANCHING POINTS: (if applicable)
- Decision at [point]: Option A [consequence] | Option B [consequence]
  └── Both options must feel valid; no "wrong answer" unless intentional

EMOTIONAL ARC:
[Hook: curiosity/urgency] -> [Rising: challenge/discovery] -> [Climax: triumph/revelation/choice] -> [Resolution: satisfaction/reflection]

NARRATIVE BEATS:
- [Beat 1: scene/dialogue summary]
- [Beat 2: ...]

REWARDS:
- Intrinsic: [story revelation, world change, NPC relationship]
- Extrinsic: [item/currency/XP with specific values]
- Hidden: [bonus for optional objectives or exploration]

FAILURE STATES:
- [What happens if the player fails? Retry? Consequence?]

REPLAYABILITY: [One-time / Daily / Weekly / Seasonal]
DIFFICULTY: [Trivial / Easy / Medium / Hard / Group Required]
ESTIMATED DEV EFFORT: [S / M / L / XL]

NOTES: [Lore connections, tech requirements, voice acting needs, open questions]
```

## Anti-Patterns (AVOID)

- "Kill 10 rats" with no narrative justification
- Escort NPCs that walk slower than the player
- Mandatory backtracking without new content
- Quest text walls with no gameplay integration
- Rewards that don't match effort or player level
- Quests that can be completed accidentally (no intentionality)
