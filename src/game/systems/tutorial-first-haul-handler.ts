/**
 * Tutorial first-haul handler — pure side-effect function.
 * Call right after a successful facility assign; no-op unless it's Kael being
 * assigned to the logging site during the `assign-kael` tutorial step.
 *
 * Grants the scripted first haul (+200 WOOD +200 gold) once, then advances the
 * tutorial step. The step gate doubles as the once-only guard: after advancing,
 * `tutorialStep` is no longer 'assign-kael' so a re-assign cannot re-fire it.
 */

import { useGameStore } from '@/game/state/store';
import { getNextStep } from '@/game/systems/tutorial-manager';

/** Scripted first-haul payout (GDD §8: 200 wood feeds the 200-wood tavern build). */
export const FIRST_HAUL_WOOD = 200;
export const FIRST_HAUL_GOLD = 200;

export function handleFirstHaul(memberId: string, facilityId: string): void {
  const store = useGameStore.getState();

  // Step gate (also the once-only guard once we advance below).
  if (store.tutorialStep !== 'assign-kael') return;

  // Must be the logging site.
  const facility = store.facilities.find((f) => f.id === facilityId);
  if (!facility || facility.type !== 'logging-site') return;

  // Must be Kael (matches handleTutorialQuestComplete's name-based identity).
  const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
  const member = allMembers.find((m) => m.id === memberId);
  if (!member || member.name !== 'Kael') return;

  // Grant the haul.
  store.addItem('WOOD', FIRST_HAUL_WOOD);
  store.addGold(FIRST_HAUL_GOLD);

  // Advance — closes the once-only gate. ALWAYS advance (fallback 'complete') so the gate
  // can never stay open and re-grant. Phase 06 inserts the first-haul/build-tavern steps;
  // getNextStep auto-picks them up (today it resolves to 'complete'). The handler advances
  // INTO the first-haul splash step; the splash's Continue advances OUT to build-tavern.
  store.setTutorialStep(getNextStep('assign-kael') ?? 'complete');
}
