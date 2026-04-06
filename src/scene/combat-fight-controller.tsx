/**
 * Combat fight controller — drives CombatEngine tick loop inside the R3F Canvas.
 * Initializes engine on phase='fighting', ticks each frame, syncs snapshots to store.
 * Listens for 'combat-skill' CustomEvents from the skill hotbar.
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree, type RootState } from '@react-three/fiber';
import { CombatEngine } from '@/game/systems/combat-engine';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { ENEMIES } from '@/game/data/enemies';
import { useArenaDebug } from './combat-arena-debug';
import { WaveManager, legacyToWaves } from '@/game/systems/combat-wave-manager';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

/** Max dt per frame to prevent massive tick bursts after tab suspend */
const MAX_FRAME_DT_MS = 200;
/** Throttle store sync to ~10Hz (100ms) to avoid 60fps GC pressure */
const SYNC_INTERVAL_MS = 100;

export function CombatFightController() {
  const engineRef = useRef<CombatEngine | null>(null);
  const waveManagerRef = useRef<WaveManager | null>(null);
  const lastSyncRef = useRef(0);
  const waveTransitioningRef = useRef(false);
  const waveTransitionUntilRef = useRef(0);
  const { camera } = useThree();
  const arenaPhase = useGameStore(s => s.arenaPhase);
  const formation = useGameStore(s => s.formation);
  const arenaMissionId = useGameStore(s => s.arenaMissionId);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const syncArenaState = useGameStore(s => s.syncArenaState);
  const syncWaveState = useGameStore(s => s.syncWaveState);
  const endCombat = useGameStore(s => s.endCombat);
  const founder = useGameStore(s => s.founder);
  const roster = useGameStore(s => s.roster);

  // Initialize engine when fighting starts
  useEffect(() => {
    if (arenaPhase !== 'fighting') {
      engineRef.current = null;
      waveManagerRef.current = null;
      waveTransitioningRef.current = false;
      return;
    }

    const allMembers = founder ? [founder, ...roster] : roster;
    const missionData = MISSIONS.find(m => m.id === arenaMissionId);
    if (!missionData) return;

    const members = allMembers.filter(m => formation.includes(m.id));

    // Wave system: use mission.waves if present, else wrap enemyIds as single wave
    const waves = missionData.waves ?? legacyToWaves(missionData.enemyIds);
    const waveManager = new WaveManager(waves);
    waveManagerRef.current = waveManager;

    const firstWave = waveManager.current();
    const enemyTemplates = firstWave.enemyIds.map(id => ENEMIES[id]).filter(Boolean);

    const engine = new CombatEngine();
    engine.init(members, formation, enemyTemplates, firstWave.hpMultiplier ?? 1);
    engine.onWaveCheck = () => waveManagerRef.current?.hasNext() ?? false;
    engineRef.current = engine;

    syncWaveState(0, waveManager.totalWaves());

    // Initial sync so entities appear immediately
    const snapshots = buildSnapshots(engine);
    syncArenaState(snapshots, 0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaPhase]);

  // Listen for skill activation events from hotbar
  useEffect(() => {
    const handler = (e: Event) => {
      const memberId = (e as CustomEvent).detail;
      engineRef.current?.activateSkill(memberId);
    };
    window.addEventListener('combat-skill', handler);
    return () => window.removeEventListener('combat-skill', handler);
  }, []);

  // Tick engine each frame — skip when debug paused
  const debugPaused = useArenaDebug()?.paused ?? false;
  useFrame((_, delta) => {
    const engine = engineRef.current;
    if (!engine || arenaPhase !== 'fighting' || debugPaused) return;

    const now = performance.now();

    // Wave transition pause — skip engine tick, camera still follows allies
    if (waveTransitioningRef.current) {
      advanceCameraFollow(engine, camera);
      if (now >= waveTransitionUntilRef.current) {
        waveTransitioningRef.current = false;
        const wm = waveManagerRef.current;
        if (wm) {
          const nextWave = wm.advance();
          if (nextWave) {
            const templates = nextWave.enemyIds.map(id => ENEMIES[id]).filter(Boolean);
            engine.addEnemies(templates, nextWave.spawnXOffset, nextWave.hpMultiplier ?? 1);
            syncWaveState(wm.currentWaveIndex(), wm.totalWaves());
          }
        }
      }
      return;
    }

    const dtMs = Math.min(delta * 1000, MAX_FRAME_DT_MS) * speedMultiplier;
    const events = engine.tick(dtMs);

    // Handle wave-cleared: start 1s transition pause
    const waveClearedEvent = events.find(e => e.type === 'wave-cleared');
    if (waveClearedEvent && !waveTransitioningRef.current && waveManagerRef.current?.hasNext()) {
      waveTransitioningRef.current = true;
      waveTransitionUntilRef.current = now + 1000;
    }

    // Camera follow — lerp toward ally centroid
    advanceCameraFollow(engine, camera);

    // Throttle store sync to ~10Hz to reduce GC pressure
    const shouldSync = events.length > 0 || engine.time - lastSyncRef.current >= SYNC_INTERVAL_MS;
    if (shouldSync) {
      lastSyncRef.current = engine.time;
      const snapshots = buildSnapshots(engine);
      syncArenaState(snapshots, engine.time, events);
    }

    // Check if combat finished
    if (engine.isFinished()) {
      const snapshots = buildSnapshots(engine);
      syncArenaState(snapshots, engine.time, events);
      endCombat(engine.getResult());
    }
  });

  return null; // Pure logic component — no visual output
}

/** Smoothly lerp camera X toward ally centroid */
function advanceCameraFollow(
  engine: CombatEngine,
  camera: RootState['camera'],
): void {
  const allies = engine.entities.filter(e => e.isAlly && e.currentHp > 0);
  if (allies.length === 0) return;
  const centroidX = allies.reduce((sum, e) => sum + e.position.x, 0) / allies.length;
  camera.position.x += (centroidX - camera.position.x) * 0.05;
}

/** Convert engine entities to serializable snapshots for Zustand store */
function buildSnapshots(engine: CombatEngine): ArenaEntitySnapshot[] {
  return engine.entities.map(e => ({
    id: e.id,
    name: e.name,
    isAlly: e.isAlly,
    maxHp: e.maxHp,
    currentHp: e.currentHp,
    position: { x: e.position.x, z: e.position.z },
    animState: e.animState,
    facingRight: e.facingRight,
    skillCooldownUntil: e.skillCooldownUntil,
    statusEffects: e.statusEffects.map(se => ({ type: se.type, ticksRemaining: se.ticksRemaining })),
    skillName: e.skill?.name,
    skillId: e.skill?.id,
    archetype: e.archetype,
    civilization: e.civilization,
    gender: e.gender,
    spriteId: e.spriteId,
    flying: e.flying,
  }));
}
