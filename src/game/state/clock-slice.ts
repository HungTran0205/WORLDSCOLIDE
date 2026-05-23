import type { StateCreator } from 'zustand';

/** 1 real second = 48 game seconds */
export const GAME_TIME_MULTIPLIER = 48;

/**
 * `gameTime` is stored in game-milliseconds and advances 48× faster than wall-clock.
 *   1 real second  →  48,000 game-ms
 *   1 game day     →  86,400,000 game-ms  =  1,800 real seconds  =  30 real minutes
 *
 * This 30-min/game-day cadence is the single source of truth for the day counter and
 * tavern refresh, and it matches the production systems (facility-production-system's
 * `TICKS_PER_DAY = 1800` at 1 tick/real-second, and offline catch-up's GAME_DAY_REAL_MS
 * = 30 min). Keep all three in sync — previously the clock ran at 6× (4 real hours/day),
 * 8× slower than production, so days/tavern lagged far behind resource yields.
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
