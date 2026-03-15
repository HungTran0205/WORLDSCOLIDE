import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/game/state/store';

describe('Game State Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.setState({
      gameTime: 0,
      realTimeLastTick: Date.now(),
      guildName: '',
      guildLevel: 1,
      gold: 100,
      guildHall: {
        level: 1,
        rooms: [{ id: 'room-quest-board', type: 'quest-board', level: 1, position: { x: 0, z: 0 }, rotation: 0 }],
        maxRooms: 3,
      },
      settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true },
      founder: null,
      roster: [],
      activeMissions: [],
      completedMissions: [],
      tutorialStep: 'char-creation',
    });
  });

  describe('ClockSlice', () => {
    it('should advance game time with 6x multiplier', () => {
      const store = useGameStore.getState();
      const now = store.realTimeLastTick + 1000; // 1 second later
      store.tickClock(now);

      const state = useGameStore.getState();
      expect(state.gameTime).toBe(6000); // 1s * 6 = 6s game time
      expect(state.realTimeLastTick).toBe(now);
    });
  });

  describe('GuildSlice', () => {
    it('should add gold', () => {
      useGameStore.getState().addGold(50);
      expect(useGameStore.getState().gold).toBe(150);
    });

    it('should spend gold when sufficient', () => {
      const result = useGameStore.getState().spendGold(50);
      expect(result).toBe(true);
      expect(useGameStore.getState().gold).toBe(50);
    });

    it('should not spend gold when insufficient', () => {
      const result = useGameStore.getState().spendGold(200);
      expect(result).toBe(false);
      expect(useGameStore.getState().gold).toBe(100);
    });

    it('should upgrade guild', () => {
      useGameStore.getState().upgradeGuild();
      const state = useGameStore.getState();
      expect(state.guildLevel).toBe(2);
      expect(state.guildHall.maxRooms).toBe(4);
    });
  });

  describe('RosterSlice', () => {
    it('should set founder', () => {
      const founder = {
        id: 'f1', name: 'Test', level: 1, exp: 0,
        stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 },
        unallocatedPoints: 0, skill: null, status: 'idle' as const,
        injuredUntil: null, civilization: 'Viet', isFounder: true,
      };
      useGameStore.getState().setFounder(founder);
      expect(useGameStore.getState().founder?.name).toBe('Test');
      expect(useGameStore.getState().founder?.isFounder).toBe(true);
    });

    it('should add and remove members', () => {
      const member = {
        id: 'm1', name: 'Recruit', level: 1, exp: 0,
        stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
        unallocatedPoints: 0, skill: null, status: 'idle' as const,
        injuredUntil: null, civilization: 'Nordic', isFounder: false,
      };
      useGameStore.getState().addMember(member);
      expect(useGameStore.getState().roster.length).toBe(1);

      useGameStore.getState().removeMember('m1');
      expect(useGameStore.getState().roster.length).toBe(0);
    });

    it('should allocate stat points', () => {
      const member = {
        id: 'm1', name: 'Test', level: 1, exp: 0,
        stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
        unallocatedPoints: 3, skill: null, status: 'idle' as const,
        injuredUntil: null, civilization: 'Viet', isFounder: false,
      };
      useGameStore.getState().addMember(member);
      useGameStore.getState().allocateStat('m1', 'STR');

      const updated = useGameStore.getState().roster[0];
      expect(updated.stats.STR).toBe(6);
      expect(updated.unallocatedPoints).toBe(2);
    });
  });

  describe('MissionSlice', () => {
    it('should dispatch and complete missions', () => {
      const mission = {
        missionId: 'test-mission',
        memberIds: ['m1'],
        startTime: Date.now(),
        estimatedEndTime: Date.now() + 60000,
      };
      useGameStore.getState().dispatchMission(mission);
      expect(useGameStore.getState().activeMissions.length).toBe(1);

      useGameStore.getState().completeMission('test-mission');
      expect(useGameStore.getState().activeMissions.length).toBe(0);
      expect(useGameStore.getState().completedMissions).toContain('test-mission');
    });
  });

  describe('JSON Serialization', () => {
    it('should round-trip through JSON without loss', () => {
      const state = useGameStore.getState();
      // Extract only data properties (not functions)
      const data = {
        gameTime: state.gameTime,
        realTimeLastTick: state.realTimeLastTick,
        guildName: state.guildName,
        guildLevel: state.guildLevel,
        gold: state.gold,
        guildHall: state.guildHall,
        settings: state.settings,
        founder: state.founder,
        roster: state.roster,
        activeMissions: state.activeMissions,
        completedMissions: state.completedMissions,
        tutorialStep: state.tutorialStep,
      };
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);
      expect(parsed.gold).toBe(data.gold);
      expect(parsed.guildHall.rooms.length).toBe(data.guildHall.rooms.length);
      expect(parsed.tutorialStep).toBe(data.tutorialStep);
    });
  });
});
