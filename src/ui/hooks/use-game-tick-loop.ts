/**
 * Game tick loop hook — runs the Web Worker heartbeat and processes
 * mission phase transitions + injury recovery on each 1s tick.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import { processMissionTick, processInjuryRecovery } from '@/game/systems/mission-tick';
import { generateMercenaries } from '@/game/systems/mercenary-generator';
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
    // Catch-up: resolve missions that progressed while offline
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
