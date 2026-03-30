/**
 * Game tick loop hook — runs the Web Worker heartbeat and processes
 * mission phase transitions + injury recovery on each 1s tick.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import { processMissionTick, processInjuryRecovery } from '@/game/systems/mission-tick';
import { generateMercenaries } from '@/game/systems/mercenary-generator';
import { processFacilityProduction } from '@/game/systems/facility-production-system';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';
import { MISSIONS } from '@/game/data/missions';
import { playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';

const TAVERN_REFRESH_MS = 4 * 60 * 60 * 1000; // 4 real-time hours
const TAVERN_MERCENARY_COUNT = 3;

export function useGameTickLoop() {
  const workerRef = useRef<Worker | null>(null);

  const handleTick = useCallback((now: number) => {
    const store = useGameStore.getState();

    // Pause game tick during combat arena to prevent injury recovery, tavern refresh, etc.
    if (store.gameScene === 'combat-arena') return;

    // Advance game clock
    store.tickClock(now);

    // Process phase transitions and collect events
    const events = processMissionTick(store, now);

    for (const event of events) {
      switch (event.type) {
        case 'arrival':
          store.addNotification({
            id: `arrival-${event.missionId}-${now}`,
            result: null,
            missionName: event.missionName,
            timestamp: now,
            dismissed: false,
            notificationType: 'arrival',
          });
          playSFX(AUDIO.SFX_DISPATCH);
          break;

        case 'combat-complete': {
          const missionName = MISSIONS.find((m) => m.id === event.missionId)?.name ?? event.missionId;
          store.addNotification({
            id: `${event.missionId}-${now}`,
            result: event.result,
            missionName,
            timestamp: now,
            dismissed: false,
            notificationType: 'completion',
          });
          // Open combat replay for manual combat mode
          if (event.combatMode === 'manual') {
            store.setCurrentCombatReplay(event.result.combatResult);
          }
          playSFX(event.result.outcome === 'full-wipe' ? AUDIO.SFX_HIT : AUDIO.SFX_REWARD);
          break;
        }
      }
    }

    // Recover injured members whose timer expired
    processInjuryRecovery(store, now);

    // Refresh tavern mercenaries every 4 real-time hours (or on first load when lastRefreshTime=0)
    if (now - store.tavern.lastRefreshTime >= TAVERN_REFRESH_MS) {
      store.refreshTavern(generateMercenaries(TAVERN_MERCENARY_COUNT));
    }
  }, []);

  useEffect(() => {
    // Catch-up: resolve missions + process facility production while offline
    const store = useGameStore.getState();
    const elapsedMs = Date.now() - store.realTimeLastTick;

    if (elapsedMs >= 60_000) {
      const GAME_DAY_REAL_MS = 4 * 60 * 60 * 1000;
      const gameDays = Math.min(30, Math.floor(elapsedMs / GAME_DAY_REAL_MS));

      if (gameDays > 0) {
        const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
        const dailyUpkeep = calcTotalUpkeep(allMembers);
        const results = processFacilityProduction(store.facilities, allMembers, gameDays, dailyUpkeep);

        // Apply EXP gains
        for (const result of results) {
          for (const [memberId, exp] of Object.entries(result.expGains)) {
            store.addMemberExp(memberId, exp);
          }
        }

        // Apply item gains
        for (const result of results) {
          for (const [itemId, qty] of Object.entries(result.itemGains)) {
            if (qty && qty > 0) store.addItem(itemId as Parameters<typeof store.addItem>[0], qty);
          }
        }

        // Apply tavern upkeep savings
        const tavernResult = results.find((r) => r.facilityType === 'tavern');
        if (tavernResult && tavernResult.upkeepSaved > 0) {
          store.addGold(tavernResult.upkeepSaved);
        }

        // Store report for popup (only if any production occurred)
        const hasProduction = results.some((r) =>
          Object.keys(r.expGains).length > 0 ||
          Object.keys(r.itemGains).length > 0 ||
          r.upkeepSaved > 0,
        );
        if (hasProduction) {
          useGameStore.setState({
            offlineFacilityReport: results,
            offlineElapsedHours: elapsedMs / 3_600_000,
          });
        }
      }
    }

    handleTick(Date.now());

    const worker = new Worker(
      new URL('@/game/systems/workers/game-loop.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type !== 'tick') return;
      handleTick(e.data.time as number);
    };

    worker.postMessage({ type: 'start' });

    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
      workerRef.current = null;
    };
  }, [handleTick]);
}
