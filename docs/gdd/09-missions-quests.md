# 09 — Missions & Quests

**Code refs:** `src/game/data/missions.ts`, `src/game/systems/mission-dispatch.ts`, `src/game/systems/mission-resolver.ts`, `src/game/systems/mission-tick.ts`, `src/game/systems/offline-progression.ts`

## Quest Tier Model

All missions carry a `tier: QuestTier` field. Current tiers in `missions.ts`:

| Tier | Gold range | EXP | Party size | Level req | Count |
|------|-----------|-----|------------|-----------|-------|
| F | 50–250g | 100–250 | 1–2 | 1–3 | 7 + 1 QA |
| E | 100–400g | 275–400 | 2–3 | 2–5 | 7 |
| D | 200–450g | 750+ | 3+ | 5+ | 5+ |
| C–S | (planned) | — | — | — | — |

Boss-gate missions carry `isBossGate: true` — completing them unlocks access to higher zones.

## Dispatch & Validation

Dispatch validation is enforced in `src/game/systems/mission-dispatch.ts` — `validateDispatch()`:

- Party size (members + merc contracts) ≥ `mission.requiredMembers`
- All guild members have `status === 'idle'`
- All guild members are `level ≥ mission.requiredLevel`
- Merc contracts must have `status === 'available'` and meet level requirement

`createActiveMission()` stamps a unique `instanceId` (UUID) on each dispatch — active mission identity is per-instance, not per-template, so the same quest can run concurrently as separate instances.

## Active Mission Phases

```
traveling → arrived → in-combat → complete
```

Travel time: `mission.travelTimeMs` (10 000–20 000 ms). Phase transitions driven by `mission-tick.ts` on the 1 s tick loop.

## Reward Distribution (`mission-resolver.ts`)

On non-`full-wipe` outcome:

```
goldEarned   = randomInt(goldRewardMin, goldRewardMax) × (1 + avgLCK × 0.01)
expPerMember = floor(mission.expReward / partySize)  [min 1]
lootEarned   = mergeLoot(...enemyIds.map(id => rollLoot(ENEMIES[id].loot)))
```

- LCK bonus: average LCK of all party members scales gold up to ~+30% at LCK 30
- Loot: each enemy in `mission.enemyIds` rolls its loot table independently via `rollLoot()` — results merged
- Full-wipe: gold = 0, exp = 0, no loot

Conditional drops (e.g. `LOGGING_SITE_ACCESS`) roll separately via `mission.conditionalDrops[]`.

## Offline Mission Completion

`src/game/systems/offline-progression.ts` — `processOfflineTime()`:

- Offline window capped at 30 game-days (30 × 30 min real = 15 h)
- Missions whose travel completed while offline are auto-resolved via `resolveMission()`
- Tutorial bear mission (`TUTORIAL_BEAR_MISSION_ID`) is excluded from offline auto-resolve to preserve its HP-floor guarantee
- Results returned as `OfflineMissionOutcome[]` and shown in a catch-up report on next session

## Arc 1 — "The First Tremor" (`missions-arc1-first-tremor.ts`)

5-quest story chain (`chainId: 'chain-first-tremor'`, `chainOrder` 2–6). Each quest gates the next via `prerequisiteId`.

| ChainOrder | Quest ID | Zone | Key event |
|-----------|----------|------|-----------|
| 2 | `ft-strange-exodus` | Forest Edge | Cave bats flee mountains → BAT_WING drop |
| 3 | `ft-path-to-depths` | Deep Forest | Slime invasion → SLIME_GEL drop |
| 4 | `ft-ancient-threshold` | Cave Entrance | Ancient machines wake → unlocks Stone Quarry |
| 5 | `ft-ruins-forgotten-age` | Ruins | Ether/materials → unlocks Alchemy Lab |
| 6 | (Slime King finale) | — | — |

All arc-1 quests carry `isMainQuest: true` and bilingual pre/post-combat dialog (VN + EN).

## Tutorial Quest

`TUTORIAL_QUEST` (`tutorial-bear-the-bear`) — solo dispatch, ~4 s compressed travel, one Moonbear boss fight. HP-floor guarantee: tutorial party cannot be wiped (enforced by `resolveMission(hpFloor=true)`). Defined in `src/game/data/tutorial-data.ts`.

## Mission Board

Available missions displayed in the Quest Board panel (opened by interacting with the war drum in the guild hall). Filtering and party suitability hints driven by `src/game/systems/mission-board.ts`.

<!-- TODO: verify mission-board.ts filtering/suitability logic details against code -->
