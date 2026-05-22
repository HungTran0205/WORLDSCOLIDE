/**
 * Tutorial keeper-assign handler — pure side-effect function.
 * Call right after a successful facility assign; no-op unless a member is being
 * assigned to the Tavern during the `assign-keeper` tutorial step.
 *
 * Spawns the scripted guaranteed visitor immediately (so the player can recruit
 * without waiting for the next-day roll), then advances the tutorial step. The
 * step gate doubles as the once-only guard: after advancing, `tutorialStep` is no
 * longer 'assign-keeper' so a re-assign cannot re-fire it.
 */

import { useGameStore } from '@/game/state/store';
import { getNextStep } from '@/game/systems/tutorial-manager';

export function handleKeeperAssigned(_memberId: string, facilityId: string): void {
  const store = useGameStore.getState();

  // Step gate (also the once-only guard once we advance below).
  if (store.tutorialStep !== 'assign-keeper') return;

  // Must be the Tavern.
  const facility = store.facilities.find((f) => f.id === facilityId);
  if (!facility || facility.type !== 'tavern') return;

  // Drop the scripted visitor into the roster now, then advance to the recruit beat.
  store.spawnTutorialRecruit();
  store.setTutorialStep(getNextStep('assign-keeper') ?? 'complete');
}
