import type { StateCreator } from 'zustand';

/** 1 real second = 6 game seconds */
export const GAME_TIME_MULTIPLIER = 6;

export interface ClockSlice {
  gameTime: number;
  realTimeLastTick: number;
  tickClock: (realNow: number) => void;
}

export const createClockSlice: StateCreator<ClockSlice> = (set) => ({
  gameTime: 0,
  realTimeLastTick: Date.now(),
  tickClock: (realNow) =>
    set((s) => {
      const realDelta = realNow - s.realTimeLastTick;
      return {
        gameTime: s.gameTime + realDelta * GAME_TIME_MULTIPLIER,
        realTimeLastTick: realNow,
      };
    }),
});
