# 02 — Core Loop & Pillars

**Game:** *2000s A.C — After the Collapse*

---

## The Core Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE LOOP                                │
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │ RECRUIT  │───▶│  BUILD   │───▶│ DISPATCH │                 │
│   │          │    │          │    │          │                 │
│   │ Tavern   │    │ Rooms &  │    │ Assign   │                 │
│   │ negotiate│    │ upgrades │    │ team to  │                 │
│   │ + hire   │    │ (guild   │    │ mission  │                 │
│   │ members  │    │  hall)   │    │ tier     │                 │
│   └──────────┘    └──────────┘    └──────────┘                 │
│        ▲                                │                       │
│        │                               ▼                       │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │  UNLOCK  │◀───│ UPGRADE  │◀───│ REWARD   │                 │
│   │          │    │          │    │          │                 │
│   │ New room │    │ Stats /  │    │ Gold,    │                 │
│   │ tiers,   │    │ equip /  │    │ loot,    │                 │
│   │ missions │    │ room lvl │    │ XP, rep  │                 │
│   └──────────┘    └──────────┘    └──────────┘                 │
│                                        │                       │
│                                        ▼                       │
│                              ┌──────────────────┐              │
│                              │     RESOLVE      │              │
│                              │                  │              │
│                              │  Auto-combat     │              │
│                              │  tick engine;    │              │
│                              │  offline OK      │              │
│                              └──────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Loop Stage Definitions

| Stage | Player Action | System Owner | GDD Section |
|---|---|---|---|
| **Recruit** | Visit Tavern, negotiate, hire | Tavern negotiation, member generation | [§08 Guild Hall](./08-guild-hall-rooms.md) / [rooms/tavern](./rooms/tavern.md) |
| **Build** | Place / upgrade rooms in guild hall | Facility system, room effects | [§08 Guild Hall](./08-guild-hall-rooms.md) |
| **Dispatch** | Assign team + submit mission | Mission dispatch, suitability check | [§09 Missions](./09-missions-quests.md) |
| **Resolve** | Wait (online or offline) | Combat tick engine, auto-resolve | [§06 Combat](./06-combat.md) |
| **Reward** | Collect gold / loot / XP | Economy, loot tables | [§07 Economy](./07-economy.md) / [§10 Items](./10-items-equipment.md) |
| **Upgrade** | Spend resources on members / rooms | Stat allocation, equipment, crafting | [§05 Characters](./05-characters-progression.md) / [§10 Items](./10-items-equipment.md) |
| **Unlock** | Reach thresholds → new rooms / missions | Progression gates, guild level | [§08](./08-guild-hall-rooms.md) / [§09](./09-missions-quests.md) |

---

## Idle Layer

The loop runs while offline. Key properties:

- Missions dispatched before close **resolve fully** on next open; reward awaits collection.
- Room production (wood, stone) accumulates offline up to a **storage cap** (prevents infinite AFK).
- Guild hall NPCs animate and wander on return — visual feedback that time passed.

*Offline tick behavior: `src/ui/hooks/use-game-tick-loop.ts`; storage cap logic: `src/game/state/game-state.ts`.*

---

## Pillar 1 — Guild Management Matters

**Design intent:** Decisions must have legible, material consequences.

- **Recruit choice:** each archetype has a stat-weight profile (`src/game/data/characters.ts →
  CIV_ARCHETYPE_PROFILES`). Sending a `philosopher` on a pure STR mission = higher failure odds.
- **Room choice:** each facility produces a specific resource or buff; building the wrong room wastes
  capped gold. See [`§08`](./08-guild-hall-rooms.md).
- **Civilization composition:** civ passives stack at the team level during combat. A mono-civ team
  activates fewer cross-civ synergies but maximizes the passive trigger rate of that civ.

---

## Pillar 2 — Idle Progression Feels Rewarding

**Design intent:** The game respects the player's time whether they are active or away.

- Offline returns surface a **summary of what happened** (missions resolved, resources produced).
- The reward curve is tuned so each session unlocks *something* — never a flat return.
- Guild hall visual state changes with progress (new rooms, upgraded props) — not purely HUD numbers.

---

## Pillar 3 — Civilizations Create Variety

**Design intent:** Civ selection is a strategic layer, not a cosmetic one.

- Each civ has 2 core archetypes + distinct stat bonuses (`CIV_CONFIG` in
  `src/game/data/civilization-config.ts`).
- Each civ has a unique **passive ability** that activates in combat under a condition (HP threshold,
  hit combo, stack count — see `04-civilizations.md` for specifics).
- Mission suitability is influenced by archetype profile, which varies by civ.
- Long-term: civ-specific quests and dialogue are planned (not yet authored).

---

*Next: [§03 World & Lore](./03-world-and-lore.md) — world context before diving into systems.*
*Systems detail: [§05](./05-characters-progression.md) through [§10](./10-items-equipment.md).*
