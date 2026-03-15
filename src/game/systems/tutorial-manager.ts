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
    step: 'sandbox-intro',
    message: 'Welcome to your guild hall!',
    autoAdvance: false,
  },
  {
    step: 'first-build',
    message: 'Open the Build menu and check your Quest Board.',
    highlightPanel: 'build',
    autoAdvance: true,
    advanceCondition: (state) => state.guildHall.rooms.some((r) => r.type === 'quest-board'),
  },
  {
    step: 'first-quest',
    message: 'Open the Quest Board and dispatch a quest.',
    highlightPanel: 'quests',
    autoAdvance: true,
    advanceCondition: (state) => state.activeMissions.length > 0,
  },
  {
    step: 'first-combat',
    message: 'Your founder is on a quest! Wait for completion.',
    autoAdvance: true,
    advanceCondition: (state) => state.completedMissions.length > 0,
  },
  {
    step: 'first-recruit',
    message: 'Open the Roster to manage your guild members.',
    highlightPanel: 'roster',
    autoAdvance: true,
    advanceCondition: (state) => state.roster.length >= 1,
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
