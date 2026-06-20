/**
 * Declarative capture manifest for the full-feature screenshot tour (Phase 3).
 * Each entry describes one UI target: how to open it, what screenshots to take, and captions.
 * Phase 4 doc generator consumes this for captions and coverage table.
 */

export interface TourShot {
  name: string;
  description: string;
}

export interface TourEntry {
  id: string;
  category: '02-facilities' | '03-panels';
  description: string;
  shots: TourShot[];
}

export const FEATURE_TOUR_MANIFEST: TourEntry[] = [
  // ── Facilities ────────────────────────────────────────────────────────────
  {
    id: 'guild-hall',
    category: '02-facilities',
    description: 'Central guild hall — the hub that connects all facilities and quest activity.',
    shots: [
      { name: 'guild-hall-wide', description: 'Wide angle of the guild hall scene with quest drum visible.' },
      { name: 'guild-hall-panel', description: 'Facilities panel grid (Bát Quái layout) showing all slots.' },
    ],
  },
  {
    id: 'logging-site',
    category: '02-facilities',
    description: 'Logging Site — produces Wood resources, the primary crafting material.',
    shots: [
      { name: 'logging-site-scene', description: '3D logging site room with timber framework.' },
      { name: 'logging-site-tray', description: 'Facility detail tray showing assigned workers and output.' },
    ],
  },
  {
    id: 'tavern',
    category: '02-facilities',
    description: 'Tavern — recruits mercenaries and hosts keeper-managed reputation events.',
    shots: [
      { name: 'tavern-scene', description: '3D tavern room with counter and atmospheric lighting.' },
      { name: 'tavern-panel', description: 'Tavern panel showing visitor roster and keeper slot.' },
    ],
  },
  {
    id: 'training-yard',
    category: '02-facilities',
    description: 'Training Yard — members train here to gain combat XP between missions.',
    shots: [
      { name: 'training-yard-scene', description: '3D training yard with bamboo-brass railing and practice area.' },
      { name: 'training-yard-panel', description: 'Training yard panel showing assigned trainees.' },
    ],
  },
  {
    id: 'infirmary',
    category: '02-facilities',
    description: 'Infirmary — heals wounded members after combat, reducing downtime.',
    shots: [
      { name: 'infirmary-scene', description: '3D infirmary room.' },
      { name: 'infirmary-tray', description: 'Facility tray showing recovery bed assignments.' },
    ],
  },
  {
    id: 'workshop',
    category: '02-facilities',
    description: 'Workshop — craft, dismantle, enhance, and repair equipment across four tabs.',
    shots: [
      { name: 'workshop-scene', description: '3D workshop room with forge and workbench.' },
      { name: 'workshop-tab-craft', description: 'Workshop Craft tab — select recipes to produce new gear.' },
      { name: 'workshop-tab-dismantle', description: 'Workshop Dismantle tab — break down gear for materials.' },
      { name: 'workshop-tab-enhance', description: 'Workshop Enhance tab — upgrade existing equipment.' },
      { name: 'workshop-tab-repair', description: 'Workshop Repair tab — restore durability.' },
    ],
  },
  {
    id: 'stone-quarry',
    category: '02-facilities',
    description: 'Stone Quarry — produces Stone resources needed for advanced construction.',
    shots: [
      { name: 'stone-quarry-scene', description: '3D stone quarry room or locked build-picker state.' },
      { name: 'stone-quarry-tray', description: 'Facility tray or build-picker if not yet unlocked.' },
    ],
  },
  {
    id: 'alchemy-lab',
    category: '02-facilities',
    description: 'Alchemy Lab — brews potions and consumables used in combat.',
    shots: [
      { name: 'alchemy-lab-scene', description: '3D alchemy lab or locked state.' },
      { name: 'alchemy-lab-panel', description: 'Alchemy craft panel or build-picker.' },
    ],
  },

  // ── HUD Panels ────────────────────────────────────────────────────────────
  {
    id: 'quest-board',
    category: '03-panels',
    description: 'Quest Board panel — browse and accept available missions.',
    shots: [
      { name: 'quest-board-list', description: 'Quest board list view with available quests.' },
      { name: 'quest-detail', description: 'Quest detail pane with requirements, rewards, and dispatch controls.' },
      { name: 'active-missions', description: 'Active missions list showing in-progress quests.' },
    ],
  },
  {
    id: 'guild-roster',
    category: '03-panels',
    description: 'Guild Roster panel — view and manage all guild members.',
    shots: [
      { name: 'roster-overview', description: 'Full roster grid showing all members with rank and level.' },
      { name: 'roster-member-detail', description: 'Character detail panel with stats, equipment, and skills.' },
    ],
  },
  {
    id: 'settings',
    category: '03-panels',
    description: 'Settings panel — audio, graphics quality, save management, and language.',
    shots: [
      { name: 'settings-panel', description: 'Settings panel showing all configuration options.' },
    ],
  },
  {
    id: 'combat-sequence',
    category: '03-panels',
    description: 'Combat view — auto-resolved tactical battle with formation and skill bar.',
    shots: [
      { name: 'combat-formation', description: 'Pre-combat formation setup screen.' },
      { name: 'combat-active', description: 'Active combat view showing battle animation.' },
      { name: 'combat-result', description: 'Combat result screen with loot and XP gains.' },
    ],
  },
  {
    id: 'tavern-negotiate',
    category: '03-panels',
    description: 'Tavern negotiation flow — bargain with a visitor to recruit them.',
    shots: [
      { name: 'tavern-negotiate-modal', description: 'Negotiate modal with roll mechanics and outcome.' },
    ],
  },
];
