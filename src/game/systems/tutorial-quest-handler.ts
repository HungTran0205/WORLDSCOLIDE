/**
 * Tutorial quest completion handler — pure side-effect function.
 * Call after any mission completes; no-op unless it's the tutorial quest at the right step.
 */

import { useGameStore } from '@/game/state/store';
import { KAEL_TEMPLATE } from '@/game/data/tutorial-data';

export function handleTutorialQuestComplete(missionId: string): void {
  if (missionId !== 'tutorial-into-the-clearing') return;

  const store = useGameStore.getState();
  if (store.tutorialStep !== 'tutorial-quest-active') return;

  // Guard: don't add duplicate Kael
  const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
  if (allMembers.some((m) => m.name === 'Kael')) return;

  // Add Kael to roster with a fresh ID
  store.addMember({ ...KAEL_TEMPLATE, id: crypto.randomUUID() });

  // Grant key item
  store.addItem('LOGGING_SITE_ACCESS', 1);

  // Advance to rescue dialogue step
  store.setTutorialStep('tutorial-kael-rescue');
}
