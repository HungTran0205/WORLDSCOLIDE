# GDD Sync Guide

## Expectation

When you change game logic under `src/game/{systems,data,state}/**`, update the matching `docs/gdd/`
section before marking the task done. The GDD is authored directly from source — when code diverges from
the spec, both the spec and the reasoning behind future changes erode.

A non-blocking PostToolUse hook fires automatically when you edit files in these directories and injects a
reminder pointing to the right section. It never blocks your edit.

## Path → GDD Section Map

This is the canonical map used by [`scripts/gdd-sync-reminder.cjs`](../../scripts/gdd-sync-reminder.cjs).
Keep script and guide in sync.

| File pattern (under `src/game/{systems,data,state}/`) | GDD Section |
|-------------------------------------------------------|-------------|
| `combat*` | [`06-combat.md`](./06-combat.md) |
| `equipment*` / `item*` / `inventory*` / `alchemy-recipe*` / `loot*` | [`10-items-equipment.md`](./10-items-equipment.md) |
| `facility*` / `building*` / `furniture*` / `workshop*` / `tavern*` / `stone-quarry*` / `alchemy-production*` | [`08-guild-hall-rooms.md`](./08-guild-hall-rooms.md) + [`rooms/`](./rooms/) |
| `mission*` / `quest*` | [`09-missions-quests.md`](./09-missions-quests.md) |
| `tutorial*` | [`11-onboarding-retention.md`](./11-onboarding-retention.md) |
| `leveling*` / `stat*` / `derived*` / `rank*` / `trait*` / `character*` | [`05-characters-progression.md`](./05-characters-progression.md) |
| `economy*` / `upkeep*` / `recruit*` / `guild-upgrade*` / `offline-progression*` | [`07-economy.md`](./07-economy.md) |
| `civilization*` / `founder*` | [`04-civilizations.md`](./04-civilizations.md) |

Matching is keyword-based on the **filename** (first match wins). Files that match none of the above still
get a generic reminder to check `docs/gdd/` if behaviour changed.

Full section index: [`README.md`](./README.md).

## Hook Implementation

Script (version-controlled): [`scripts/gdd-sync-reminder.cjs`](../../scripts/gdd-sync-reminder.cjs).

Behaviour:
- Fires only for `src/game/(systems|data|state)/` paths.
- Emits nothing and exits 0 for every other path (CSS, UI, assets, etc.).
- Never blocks any tool call — exit 0 on all paths including errors.
- Cross-platform: normalizes Windows `\` backslashes before matching.

## Enabling the reminder (per-developer, local)

The script is tracked, but the **hook registration is local** — `.claude/` is gitignored in this repo, so
the trigger is not shared automatically. To enable the reminder in your own environment, add a `PostToolUse`
hook to your local `.claude/settings.json` that runs the tracked script:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/scripts/gdd-sync-reminder.cjs" }
        ]
      }
    ]
  }
}
```

Without the hook the script is harmless and dormant; the sync expectation above still applies manually.
