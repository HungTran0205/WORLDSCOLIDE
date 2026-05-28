/**
 * Game tick loop hook — runs the Web Worker heartbeat and processes
 * mission phase transitions + injury recovery on each 1s tick.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import { GAME_TIME_MULTIPLIER, MS_PER_GAME_DAY } from '@/game/state/clock-slice';
import { processMissionTick } from '@/game/systems/mission-tick';
import { processInjuryRecovery } from '@/game/systems/infirmary-recovery';
import { shouldAdvanceTutorial, getNextStep } from '@/game/systems/tutorial-manager';
import { processFacilityProduction, processLoggingSiteTick } from '@/game/systems/facility-production-system';
import { processStoneQuarryTick } from '@/game/systems/stone-quarry-production-system';
import { advanceWorkshopQueues } from '@/game/systems/workshop-offline-system';
import { advanceAlchemyQueues } from '@/game/systems/alchemy-production-system';
import type { ItemID } from '@/game/data/items';
import type { EquipmentItem, Member, MemberEquipment } from '@/game/state/game-state';
import { MISSIONS } from '@/game/data/missions';
import { playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';

export function useGameTickLoop() {
  const workerRef = useRef<Worker | null>(null);
  const stoneAccumulatorRef = useRef(0);
  const woodAccumulatorRef = useRef(0);

  const handleTick = useCallback((now: number) => {
    const store = useGameStore.getState();

    // Pause game tick during combat arena to prevent injury recovery, tavern refresh, etc.
    if (store.gameScene === 'combat-arena') return;

    // Capture wall-clock delta BEFORE advancing the clock — the recovery engine accrues
    // progress per real-ms, and tickClock overwrites realTimeLastTick.
    const dt = Math.max(0, now - store.realTimeLastTick);

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
          playSFX(event.result.outcome === 'full-wipe' ? AUDIO.SFX_HIT : AUDIO.SFX_REWARD);
          break;
        }
      }
    }

    // Per-tick logging site production (1s cadence)
    const allMembersForTick = store.founder ? [store.founder, ...store.roster] : store.roster;
    const loggingResult = processLoggingSiteTick(store.facilities, allMembersForTick);
    if (loggingResult.woodProduced > 0 || loggingResult.reserveUpdates.length > 0) {
      store.applyLoggingProduction(loggingResult);
      // Accumulate fractional wood; addItem floors so we batch until we have >= 1
      // (~0.016 wood/tick at 29/gameday ÷ 1800 ticks — without this it floors to 0 every tick)
      woodAccumulatorRef.current += loggingResult.woodProduced;
      const woodToAdd = Math.floor(woodAccumulatorRef.current);
      if (woodToAdd > 0) {
        store.addItem('WOOD', woodToAdd);
        woodAccumulatorRef.current -= woodToAdd;
      }
    }

    // Per-tick stone quarry production (1s cadence) — infinite reserve, MC skill + vein strikes
    const quarryResult = processStoneQuarryTick(store.facilities, allMembersForTick);
    if (quarryResult.stoneProduced > 0 || quarryResult.mcXpGains.length > 0) {
      store.applyStoneQuarryProduction(quarryResult);
      // Accumulate fractional stone; addItem floors so we batch until we have >= 1
      stoneAccumulatorRef.current += quarryResult.stoneProduced;
      const stoneToAdd = Math.floor(stoneAccumulatorRef.current);
      if (stoneToAdd > 0) {
        store.addItem('STONE', stoneToAdd);
        stoneAccumulatorRef.current -= stoneToAdd;
      }
      for (const [itemId, qty] of Object.entries(quarryResult.bonusItemGains)) {
        if (qty > 0) store.addItem(itemId as ItemID, qty);
      }
    }

    // Tick alchemy craft queues — decrement timers, produce completed items
    store.tickAlchemyQueues();

    // Tick workshop queues — start pending tasks (skip-on-missing-mat), advance active
    store.tickWorkshopQueues();

    // Accrue infirmary recovery progress for injured members (bed/queue derived per tick)
    processInjuryRecovery(store, dt);

    // Auto-advance tutorial steps with conditions. Re-read fresh state: processMissionTick
    // and mid-tick handlers (e.g. handleTutorialQuestComplete) may have mutated
    // tutorialStep / activeMissions since the tick-start snapshot above.
    const tutorialState = useGameStore.getState();
    if (shouldAdvanceTutorial(tutorialState.tutorialStep, tutorialState)) {
      const next = getNextStep(tutorialState.tutorialStep);
      if (next) tutorialState.setTutorialStep(next);
    }

    // Tavern daily-tick (AD3 — inline, guarded by `lastDayProcessed` for idempotency).
    {
      const state = useGameStore.getState();
      const currentDay = Math.floor(state.gameTime / MS_PER_GAME_DAY);
      if (currentDay !== state.tavern.lastDayProcessed) {
        state.tickTavernDay(currentDay);
      }
    }
  }, []);

  useEffect(() => {
    // Catch-up: resolve missions + process facility production while offline
    const store = useGameStore.getState();
    const elapsedMs = Date.now() - store.realTimeLastTick;

    if (elapsedMs >= 60_000) {
      const GAME_DAY_REAL_MS = 30 * 60 * 1000;
      const gameDays = Math.min(30, Math.floor(elapsedMs / GAME_DAY_REAL_MS));

      if (gameDays > 0) {
        const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
        const results = processFacilityProduction(
          store.facilities, allMembers, gameDays,
        );

        // Apply EXP gains (Training Yard)
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

        // Apply logging-site WC XP + wood reserve depletion
        for (const result of results) {
          if (result.facilityType !== 'logging-site') continue;
          if (result.wcXpGains?.length || result.reserveUpdate) {
            store.applyLoggingProduction({
              wcXpGains: result.wcXpGains ?? [],
              reserveUpdates: result.reserveUpdate ? [result.reserveUpdate] : [],
              woodProduced: result.itemGains.WOOD ?? 0,
            });
          }
        }

        // Apply stone-quarry MC XP
        for (const result of results) {
          if (result.facilityType !== 'stone-quarry') continue;
          if (result.mcXpGains?.length) {
            store.applyStoneQuarryProduction({
              mcXpGains: result.mcXpGains,
              stoneProduced: result.itemGains.STONE ?? 0,
              bonusItemGains: {},
            });
          }
        }

        // Store report for popup (only if any production occurred)
        const hasProduction = results.some((r) =>
          Object.keys(r.expGains).length > 0 ||
          Object.keys(r.itemGains).length > 0,
        );
        if (hasProduction) {
          useGameStore.setState({
            offlineFacilityReport: results,
            offlineElapsedHours: elapsedMs / 3_600_000,
          });
        }
      }

      // Advance queue-based facilities (workshop, alchemy) over offline interval.
      // Cap at 30 game days (matches facility production cap so all subsystems share one window).
      const MAX_OFFLINE_REAL_SECONDS = (30 * GAME_DAY_REAL_MS) / 1000;
      const elapsedSecs = Math.min(MAX_OFFLINE_REAL_SECONDS, Math.floor(elapsedMs / 1000));
      const wsState = useGameStore.getState();
      const hasWorkshopWork = wsState.facilities.some(
        (f) => f.type === 'workshop' && f.level > 0 && (f.workshopQueue?.length ?? 0) > 0,
      );
      if (elapsedSecs > 0 && hasWorkshopWork) {
        const equipmentLookup = (id: string): EquipmentItem | null => {
          const fromInv = (wsState.inventory.equipmentInventory ?? []).find((e) => e.id === id);
          if (fromInv) return fromInv;
          const all: Member[] = wsState.founder ? [wsState.founder, ...wsState.roster] : wsState.roster;
          for (const m of all) {
            if (!m.equipment) continue;
            for (const slot of ['weapon', 'armor'] as const) {
              const cur = m.equipment[slot];
              if (cur && cur.id === id) return cur;
            }
          }
          return null;
        };

        const ws = advanceWorkshopQueues(
          wsState.facilities,
          wsState.inventory,
          equipmentLookup,
          elapsedSecs,
          wsState.gameTime,
          Math.random,
        );

        const didCraft = ws.summary.crafted > 0;
        const didModify = ws.updatedEquipment.size > 0 || didCraft || ws.summary.skipped > 0;
        if (didModify) {
          useGameStore.setState((s) => {
            // Inventory: apply material delta + new equipment + replacements
            const newItems = { ...s.inventory.items };
            for (const [id, qty] of Object.entries(ws.inventoryDelta) as [ItemID, number][]) {
              if (!qty) continue;
              const total = (newItems[id] ?? 0) + qty;
              if (total > 0) newItems[id] = total;
              else delete newItems[id];
            }

            let newEqInv = s.inventory.equipmentInventory ?? [];
            if (ws.updatedEquipment.size > 0) {
              newEqInv = newEqInv.map((e) => ws.updatedEquipment.get(e.id) ?? e);
            }
            if (ws.newEquipment.length > 0) {
              newEqInv = [...newEqInv, ...ws.newEquipment];
            }

            const replaceOnMember = (m: Member): Member => {
              if (!m.equipment || ws.updatedEquipment.size === 0) return m;
              let changed = false;
              const nextEq: MemberEquipment = { ...m.equipment };
              for (const slot of ['weapon', 'armor'] as const) {
                const cur = nextEq[slot];
                if (cur) {
                  const repl = ws.updatedEquipment.get(cur.id);
                  if (repl) {
                    nextEq[slot] = repl;
                    changed = true;
                  }
                }
              }
              return changed ? { ...m, equipment: nextEq } : m;
            };

            return {
              facilities: ws.facilities,
              inventory: { ...s.inventory, items: newItems, equipmentInventory: newEqInv },
              ...(s.founder ? { founder: replaceOnMember(s.founder) } : {}),
              roster: s.roster.map(replaceOnMember),
              offlineWorkshopSummary: ws.summary,
            };
          });
        }
      }

      // Advance alchemy lab craft queues over the offline window.
      // Mirrors workshop offline pattern — items only appear if a job was queued.
      const alState = useGameStore.getState();
      const hasAlchemyWork = alState.facilities.some(
        (f) => f.type === 'alchemy-lab' && f.level > 0 && (f.craftQueue?.length ?? 0) > 0,
      );
      if (elapsedSecs > 0 && hasAlchemyWork) {
        const allMembers = alState.founder ? [alState.founder, ...alState.roster] : alState.roster;
        const al = advanceAlchemyQueues(alState.facilities, allMembers, elapsedSecs);
        const producedTotal = Object.values(al.itemGains).reduce((s, q) => s + (q ?? 0), 0);
        if (producedTotal > 0 || al.acXpGains.length > 0) {
          useGameStore.setState({ facilities: al.facilities });
          for (const [itemId, qty] of Object.entries(al.itemGains)) {
            if (qty && qty > 0) useGameStore.getState().addItem(itemId as ItemID, qty);
          }
          if (al.acXpGains.length > 0) {
            useGameStore.getState().applyAlchemyProduction({ acXpGains: al.acXpGains });
          }
        }
      }
    }

    // Tavern offline catch-up (AD4): single jump to current game-day, no backlog.
    // Compute the post-offline game-day from the elapsed wall-clock; tickTavernDay is idempotent,
    // so the subsequent handleTick(Date.now()) won't double-fire.
    {
      const offlineState = useGameStore.getState();
      const projectedGameTime = offlineState.gameTime + (Date.now() - offlineState.realTimeLastTick) * GAME_TIME_MULTIPLIER;
      const currentDayAfterOffline = Math.floor(projectedGameTime / MS_PER_GAME_DAY);
      if (currentDayAfterOffline !== offlineState.tavern.lastDayProcessed) {
        offlineState.tickTavernDay(currentDayAfterOffline);
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
