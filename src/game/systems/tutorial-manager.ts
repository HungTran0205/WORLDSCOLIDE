import type { TutorialStep } from '@/game/state/game-state';
import type { GameStore } from '@/game/state/store';

export interface TutorialStepConfig {
  step: TutorialStep;
  message: string;
  highlightPanel?: string;
  autoAdvance: boolean;
  advanceCondition?: (state: GameStore) => boolean;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    step: 'char-creation',
    message: 'Create your character. Distribute 50 stat points.',
    autoAdvance: false,
  },
  {
    step: 'world-board',
    message: '', // Modal handles its own content
    autoAdvance: false,
  },
  {
    step: 'tutorial-quest-dispatch',
    message: 'A traveler needs help! Open the Quest Board and dispatch "Into the Clearing".',
    highlightPanel: 'quests',
    autoAdvance: true,
    advanceCondition: (state) =>
      state.activeMissions.some((m) => m.missionId === 'tutorial-into-the-clearing'),
  },
  {
    step: 'tutorial-quest-active',
    message: 'Your founder is on the way. Wait for the quest to complete.',
    autoAdvance: false, // Advanced by tutorial-quest-handler after combat resolves
  },
  {
    step: 'tutorial-kael-rescue',
    message: '', // Dialogue modal handles content
    autoAdvance: false,
  },
  {
    step: 'tutorial-reward',
    message: '', // Reward splash handles content
    autoAdvance: false,
  },
  {
    step: 'build-logging-site',
    message: 'Open the Build menu → Facilities tab to build your Logging Site.',
    highlightPanel: 'build',
    autoAdvance: true,
    advanceCondition: (state) =>
      state.facilities.some((f) => f.type === 'logging-site' && f.level > 0),
  },
  {
    step: 'assign-kael',
    message: 'Assign Kael to the Logging Site to begin harvesting wood.',
    highlightPanel: 'facilities',
    autoAdvance: true,
    advanceCondition: (state) => {
      const ls = state.facilities.find((f) => f.type === 'logging-site');
      return (ls?.assignedMemberIds.length ?? 0) > 0;
    },
  },
  {
    step: 'complete',
    message: 'Tutorial complete! Your guild adventure begins.',
    autoAdvance: false,
  },
];

export function getCurrentStep(tutorialStep: TutorialStep): TutorialStepConfig | undefined {
  return TUTORIAL_STEPS.find((s) => s.step === tutorialStep);
}

export function getNextStep(current: TutorialStep): TutorialStep | null {
  const idx = TUTORIAL_STEPS.findIndex((s) => s.step === current);
  if (idx < 0 || idx >= TUTORIAL_STEPS.length - 1) return null;
  return TUTORIAL_STEPS[idx + 1].step;
}

export function shouldAdvanceTutorial(currentStep: TutorialStep, state: GameStore): boolean {
  const config = getCurrentStep(currentStep);
  if (!config?.autoAdvance || !config.advanceCondition) return false;
  return config.advanceCondition(state);
}
