#!/usr/bin/env node
/**
 * gdd-sync-reminder.cjs — PostToolUse hook: remind Claude to update the GDD
 *
 * WHY THIS EXISTS:
 * The GDD (docs/gdd/) is a living spec authored directly from game-logic source.
 * When src/game/{systems,data,state}/** changes, the matching GDD section must
 * stay in sync. This hook fires a non-blocking, contextual reminder pointing at
 * the right section so the session never drifts silently.
 *
 * CANONICAL PATH→SECTION MAP: see docs/gdd/sync-guide.md
 *
 * BEHAVIOR:
 * - Fires ONLY for files under src/game/(systems|data|state)/
 * - Emits nothing (and exits 0) for every other path
 * - NEVER blocks the tool call — exit 0 on ALL paths, including errors
 * - Cross-platform: normalizes Windows backslashes before matching
 */

'use strict';

try {
  const fs = require('fs');

  /**
   * Map of filename keyword → GDD section path.
   * Evaluated in order; first match wins.
   * Canonical source: docs/gdd/sync-guide.md
   *
   * @type {Array<{ keywords: string[], section: string, extra?: string }>}
   */
  const PATH_SECTION_MAP = [
    // Combat system
    {
      keywords: ['combat'],
      section: 'docs/gdd/06-combat.md',
    },
    // Items, equipment, inventory, crafting, alchemy, loot
    {
      keywords: ['equipment', 'item', 'inventory', 'alchemy-recipe', 'loot'],
      section: 'docs/gdd/10-items-equipment.md',
    },
    // Guild hall rooms, facilities, buildings, furniture, production
    {
      keywords: [
        'facility', 'building', 'furniture', 'workshop', 'tavern',
        'stone-quarry', 'alchemy-production', 'infirmary', 'logging-site',
      ],
      section: 'docs/gdd/08-guild-hall-rooms.md',
      extra: '(and docs/gdd/rooms/ for the relevant room file)',
    },
    // Missions and quests
    {
      keywords: ['mission', 'quest'],
      section: 'docs/gdd/09-missions-quests.md',
    },
    // Onboarding / tutorial
    {
      keywords: ['tutorial'],
      section: 'docs/gdd/11-onboarding-retention.md',
    },
    // Characters, leveling, stats, traits, ranks
    {
      keywords: ['leveling', 'stat', 'derived', 'rank', 'trait', 'character'],
      section: 'docs/gdd/05-characters-progression.md',
    },
    // Economy, upkeep, recruiting, guild upgrade, offline progression
    {
      keywords: [
        'economy', 'upkeep', 'recruit', 'guild-upgrade', 'offline-progression',
      ],
      section: 'docs/gdd/07-economy.md',
    },
    // Civilizations / founders
    {
      keywords: ['civilization', 'founder'],
      section: 'docs/gdd/04-civilizations.md',
    },
  ];

  /**
   * Return the GDD section entry that best matches the file path,
   * or null if no section applies.
   *
   * @param {string} normalizedPath  forward-slash path
   * @returns {{ section: string, extra?: string } | null}
   */
  function findSection(normalizedPath) {
    // Match keywords against the FILENAME only, not the full path.
    // The directory always contains "state" (src/game/state/...), and "state"
    // contains the substring "stat" — matching the full path would mis-route
    // every state-slice file to the characters/progression section. All keywords
    // in PATH_SECTION_MAP are filename tokens (combat-*, mission-*, equipment-*,
    // etc.), so basename matching is both correct and sufficient.
    const basename = normalizedPath.split('/').pop().toLowerCase();

    for (const entry of PATH_SECTION_MAP) {
      const matched = entry.keywords.some((kw) => basename.includes(kw));
      if (matched) return entry;
    }
    return null;
  }

  /**
   * Return true only if the path is inside src/game/{systems,data,state}/
   *
   * @param {string} normalizedPath  forward-slash path
   */
  function isGameLogicPath(normalizedPath) {
    return /src\/game\/(systems|data|state)\//.test(normalizedPath);
  }

  function main() {
    // Read stdin synchronously (hook contract)
    let raw = '';
    try {
      raw = fs.readFileSync(0, 'utf-8').trim();
    } catch (_) {
      // stdin read failed — exit silently, never block
      process.exit(0);
    }

    if (!raw) process.exit(0);

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      // Malformed JSON from host — skip silently
      process.exit(0);
    }

    // tool_input.file_path is the file that was just edited/written
    const rawPath =
      payload?.tool_input?.file_path ||
      payload?.tool_response?.file_path ||
      '';

    if (!rawPath) process.exit(0);

    // Normalize Windows backslashes → forward slashes for cross-platform matching
    const normalizedPath = rawPath.replace(/\\/g, '/');

    // Only fire for game-logic source paths
    if (!isGameLogicPath(normalizedPath)) {
      process.exit(0); // no reminder needed — emit nothing
    }

    const entry = findSection(normalizedPath);
    if (!entry) {
      // Game-logic file but no specific section mapped — emit a generic reminder
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: [
            '## GDD Sync Reminder',
            `You edited a game-logic file: \`${normalizedPath}\``,
            'If this change affects game behaviour, update the matching section in `docs/gdd/`.',
            'See `docs/gdd/sync-guide.md` for the path→section map.',
          ].join('\n'),
        },
      };
      console.log(JSON.stringify(output));
      process.exit(0);
    }

    const extraNote = entry.extra ? ` ${entry.extra}` : '';
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: [
          '## GDD Sync Reminder',
          `You edited \`${normalizedPath}\`.`,
          `If this change affects game behaviour, update **\`${entry.section}\`**${extraNote}.`,
          'See `docs/gdd/sync-guide.md` for the full path→section map and sync expectations.',
        ].join('\n'),
      },
    };
    console.log(JSON.stringify(output));
    process.exit(0);
  }

  main();
} catch (_) {
  // Outer crash guard — never block the tool call
  process.exit(0);
}
