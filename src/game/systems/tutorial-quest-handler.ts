/**
 * Tutorial quest completion handler — pure side-effect function.
 * Call after any mission completes; no-op unless it's the tutorial quest at the right step.
 */

import { useGameStore } from '@/game/state/store';
import { KAEL_TEMPLATE, TUTORIAL_BEAR_MISSION_ID } from '@/game/data/tutorial-data';

export function handleTutorialQuestComplete(missionId: string): void {
  if (missionId !== TUTORIAL_BEAR_MISSION_ID) return;

  const store = useGameStore.getState();

  // Only fire during the fight beats (quest-travel covers the rare tick where combat
  // resolves before the travel→combat auto-advance has run).
  if (store.tutorialStep !== 'moonbear-combat' && store.tutorialStep !== 'quest-travel') return;

  // Only on an actual win — completeMission ran before this in both the live-panel
  // (arena-result-handler) and auto-resolve (mission-tick) paths; a full-wipe calls
  // failMission instead, so the id is absent → no Kael grant on loss.
  if (!store.completedMissions.includes(missionId)) return;

  // Guard: don't add duplicate Kael
  const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
  if (allMembers.some((m) => m.name === 'Kael')) return;

  // Add Kael to roster with a fresh ID
  store.addMember({ ...KAEL_TEMPLATE, id: crypto.randomUUID() });

  // Grant key item — the permit that lets the player build the Logging Site for free
  store.addItem('LOGGING_SITE_ACCESS', 1);

  // Advance to rescue dialogue step
  store.setTutorialStep('kael-rescue');
}
