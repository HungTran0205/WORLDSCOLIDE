import type { StateCreator } from 'zustand';

/** 1 real second = 6 game seconds */
export const GAME_TIME_MULTIPLIER = 6;

/**
 * `gameTime` is stored in game-milliseconds and advances 6× faster than wall-clock.
 *   1 real second  →  6,000 game-ms
 *   1 game day     →  86,400,000 game-ms  =  14,400 real seconds  =  4 real hours
 *
 * Any code computing the current game-day from `gameTime` MUST use this constant
 * (NOT facility-production-system's `TICKS_PER_DAY = 1800`, which counts
 * 1-tick-per-real-second cadence and is a different unit).
 */
export const MS_PER_GAME_DAY = 86_400_000;

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
