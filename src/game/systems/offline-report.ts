/**
 * Consolidated offline-progress report — what every facility produced while the
 * player was away. Built in the game tick-loop's catch-up pass and shown once on
 * return via OfflineFacilityPopup. Replaces the old wood/stone-only report so
 * crafted gear, learned/ranked skills, and injury recoveries also surface.
 */

import type { FacilityProductionResult } from './facility-production-system';

export interface OfflineTrainedSkill {
  memberName: string;
  skillId: string;
  skillName: string;
  level: number; // resulting level (rank) after the offline window
}

export interface OfflineReport {
  elapsedHours: number;
  /** Gathering facilities (logging site, stone quarry) — raw item gains. */
  production: FacilityProductionResult[];
  /** Workshop-crafted equipment, grouped by display name → quantity. */
  crafted: Record<string, number>;
  /** Alchemy-lab produced items, itemId → quantity. */
  alchemy: Record<string, number>;
  /** Skills learned (Lv0→Lv1) or ranked up at the Training Yard. */
  trained: OfflineTrainedSkill[];
  /** Names of members who finished recovering in the Infirmary. */
  recovered: string[];
}

/** True when a report has at least one thing worth showing the player. */
export function offlineReportHasContent(r: OfflineReport): boolean {
  return (
    r.production.some((p) => Object.keys(p.itemGains).length > 0) ||
    Object.keys(r.crafted).length > 0 ||
    Object.keys(r.alchemy).length > 0 ||
    r.trained.length > 0 ||
    r.recovered.length > 0
  );
}
