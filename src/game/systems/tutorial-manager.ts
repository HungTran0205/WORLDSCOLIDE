import type { TutorialStep } from '@/game/state/game-state';
import type { GameStore } from '@/game/state/store';
import type { CoachConfig } from '@/ui/coachmark/coachmark-config';
import { TUTORIAL_BEAR_MISSION_ID } from '@/game/data/tutorial-data';

export interface TutorialStepConfig {
  step: TutorialStep;
  message: string;
  highlightPanel?: string;
  autoAdvance: boolean;
  advanceCondition?: (state: GameStore) => boolean;
  /** Coachmark guidance for this beat (GDD §6). Absent when guidance lives in a
   *  dedicated overlay/panel (modals, combat panel, facilities inline hints). */
  coach?: CoachConfig;
}

/**
 * 14-beat onboarding flow (GDD §5). Order MUST match the TutorialStep union so
 * getNextStep walks it linearly. Each beat advances either via an autoAdvance
 * predicate (store-observable signal, evaluated in the tick loop) OR a UI/handler
 * callback (modals, quest-board selection, combat handler, first-haul handler).
 */
export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    // Founder creation — the char-creation panel advances to 'arrival-alarm' on confirm.
    step: 'char-creation',
    message: 'Create your character. Distribute 50 stat points.',
    autoAdvance: false,
  },
  {
    // World-board lore page → messenger alarm. Both modals advance via callbacks in game-screen.
    step: 'arrival-alarm',
    message: '', // WorldBoardModal + NpcAlarm handle their own content
    autoAdvance: false,
  },
  {
    // Beat the war drum to open the Quest Board. The drum coachmark (DrumTooltipArrow,
    // world-target) guides this; advance fires when the quest panel opens (cameraFocus).
    step: 'open-quest-board',
    message: 'Beat the war drum in the hall to open the Quest Board.',
    highlightPanel: 'quests',
    autoAdvance: true,
    advanceCondition: (state) => state.cameraFocus === 'quest-board',
  },
  {
    // Pick the tutorial quest. Quest-board selection advances to 'assign-and-dispatch'.
    step: 'accept-bear-quest',
    message: "Select the 'Bear the Bear' quest.",
    autoAdvance: false,
    coach: {
      targetType: 'dom',
      target: '.quest-card',
      caption: "Select 'Bear the Bear'",
      spotlight: true,
      arrow: true,
      pulse: true,
      advanceOn: 'quest-selected',
    },
  },
  {
    // Add the founder to the party and Dispatch. Advance when the mission goes active.
    step: 'assign-and-dispatch',
    message: 'Add your founder to the party, then Dispatch.',
    highlightPanel: 'quests',
    autoAdvance: true,
    advanceCondition: (state) =>
      state.activeMissions.some((m) => m.missionId === TUTORIAL_BEAR_MISSION_ID),
    coach: {
      targetType: 'dom',
      target: '.dispatch-button',
      caption: 'Add your founder, then Dispatch',
      arrow: true,
      pulse: true,
      advanceOn: 'mission-dispatched',
    },
  },
  {
    // Compressed travel (~4s). Advance the moment the party arrives.
    step: 'quest-travel',
    message: 'Your party is on the way to the village.',
    autoAdvance: true,
    advanceCondition: (state) =>
      state.activeMissions.some(
        (m) => m.missionId === TUTORIAL_BEAR_MISSION_ID && m.phase !== 'traveling',
      ),
  },
  {
    // Playable Moonbear fight (guaranteed win via Phase 04 HP-floor). The combat panel
    // hosts its own skill-bar coaching; tutorial-quest-handler advances on victory.
    step: 'moonbear-combat',
    message: 'Open the mission and defeat the Moonbear!',
    autoAdvance: false,
  },
  {
    step: 'kael-rescue',
    message: '', // KaelRescueDialogue handles content
    autoAdvance: false,
  },
  {
    step: 'reward-splash',
    message: '', // TutorialRewardSplash handles content
    autoAdvance: false,
  },
  {
    step: 'build-logging-site',
    message: 'Open the Facilities panel and build a Logging Site (uses your permit).',
    highlightPanel: 'facilities',
    autoAdvance: true,
    advanceCondition: (state) =>
      state.facilities.some((f) => f.type === 'logging-site' && f.level > 0),
  },
  {
    // Assign Kael → tutorial-first-haul-handler grants the scripted haul and advances.
    step: 'assign-kael',
    message: 'Assign Kael to the Logging Site to begin harvesting wood.',
    highlightPanel: 'facilities',
    autoAdvance: false, // handleFirstHaul advances after granting +200 wood / +200 gold
  },
  {
    step: 'first-haul-reward',
    message: '', // TutorialFirstHaulSplash handles content
    autoAdvance: false,
  },
  {
    step: 'build-tavern',
    message: 'Use your 200 Wood to build the Tavern.',
    highlightPanel: 'facilities',
    autoAdvance: true,
    advanceCondition: (state) =>
      state.facilities.some((f) => f.type === 'tavern' && f.level > 0),
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
