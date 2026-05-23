/**
 * Tutorial chain tail — keeper assign spawns a guaranteed recruit, then the
 * recruit beat completes the tutorial. Covers step ordering, the keeper handler,
 * the spawn action, and the recruit-first-member advance condition.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, resetGameState } from '@/game/state/store';
import { handleKeeperAssigned } from './tutorial-keeper-handler';
import { getNextStep, shouldAdvanceTutorial } from './tutorial-manager';
import { TUTORIAL_RECRUIT_VISITOR } from '@/game/data/tutorial-data';
import type { Member } from '@/game/state/game-state';

function founder(): Member {
  return {
    id: 'founder-001', name: 'Founder', level: 5, exp: 0,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 10, LCK: 5, AGI: 5 },
    unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null,
    civilization: 'LinhSon', isFounder: true, rank: 'COMMANDER', missionsCompleted: 0, rarity: 1,
  };
}

function setupAtKeeperStep() {
  resetGameState();
  useGameStore.setState((s) => ({
    founder: founder(),
    tutorialStep: 'assign-keeper',
    facilities: s.facilities.map((f) =>
      f.type === 'tavern' ? { ...f, level: 1, placedSlot: 0 } : f,
    ),
  }));
}

describe('tutorial chain tail — keeper → guaranteed recruit', () => {
  beforeEach(() => resetGameState());

  describe('getNextStep ordering', () => {
    it('walks build-tavern → assign-keeper → recruit-first-member → complete', () => {
      expect(getNextStep('build-tavern')).toBe('assign-keeper');
      expect(getNextStep('assign-keeper')).toBe('recruit-first-member');
      expect(getNextStep('recruit-first-member')).toBe('complete');
    });
  });

  describe('handleKeeperAssigned', () => {
    it('spawns the scripted Ranger visitor and advances to recruit-first-member', () => {
      setupAtKeeperStep();
      handleKeeperAssigned('m1', 'tavern');
      const s = useGameStore.getState();
      expect(s.tutorialStep).toBe('recruit-first-member');
      const recruit = s.tavern.currentRoster.find((v) => v.id === TUTORIAL_RECRUIT_VISITOR.id);
      expect(recruit).toBeDefined();
      expect(recruit?.guaranteedRecruit).toBe(true);
      expect(recruit?.archetype).toBe('scout');
      expect(recruit?.gender).toBe('F');
    });

    it('is a no-op when not at the assign-keeper step', () => {
      setupAtKeeperStep();
      useGameStore.setState({ tutorialStep: 'complete' });
      handleKeeperAssigned('m1', 'tavern');
      expect(useGameStore.getState().tavern.currentRoster).toHaveLength(0);
      expect(useGameStore.getState().tutorialStep).toBe('complete');
    });

    it('is a no-op when assigning to a non-tavern facility', () => {
      setupAtKeeperStep();
      handleKeeperAssigned('m1', 'logging-site');
      expect(useGameStore.getState().tavern.currentRoster).toHaveLength(0);
      expect(useGameStore.getState().tutorialStep).toBe('assign-keeper');
    });
  });

  describe('spawnTutorialRecruit', () => {
    it('is idempotent — never double-adds the scripted visitor', () => {
      setupAtKeeperStep();
      useGameStore.getState().spawnTutorialRecruit();
      useGameStore.getState().spawnTutorialRecruit();
      const matches = useGameStore.getState().tavern.currentRoster.filter(
        (v) => v.id === TUTORIAL_RECRUIT_VISITOR.id,
      );
      expect(matches).toHaveLength(1);
    });
  });

  describe('day-tick preserves the scripted recruit', () => {
    it('tickTavernDay does not regenerate over a guaranteed visitor (HIGH-1 guard)', () => {
      setupAtKeeperStep();
      useGameStore.getState().spawnTutorialRecruit();
      useGameStore.getState().tickTavernDay(99); // simulate a day boundary / offline catch-up
      const roster = useGameStore.getState().tavern.currentRoster;
      expect(roster.some((v) => v.guaranteedRecruit)).toBe(true);
      expect(roster).toHaveLength(1);
    });
  });

  describe('recruit-first-member advance condition', () => {
    it('holds while the guaranteed visitor is still in the roster', () => {
      setupAtKeeperStep();
      useGameStore.getState().spawnTutorialRecruit();
      expect(shouldAdvanceTutorial('recruit-first-member', useGameStore.getState())).toBe(false);
    });

    it('fires once the guaranteed visitor leaves the roster (recruited)', () => {
      setupAtKeeperStep();
      useGameStore.setState((s) => ({ tavern: { ...s.tavern, currentRoster: [] } }));
      expect(shouldAdvanceTutorial('recruit-first-member', useGameStore.getState())).toBe(true);
    });
  });
});
