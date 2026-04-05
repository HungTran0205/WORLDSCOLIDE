/**
 * Combat fight controller — drives CombatEngine tick loop inside the R3F Canvas.
 * Initializes engine on phase='fighting', ticks each frame, syncs snapshots to store.
 * Listens for 'combat-skill' CustomEvents from the skill hotbar.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CombatEngine } from '@/game/systems/combat-engine';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { ENEMIES } from '@/game/data/enemies';
import { useArenaDebug } from './combat-arena-debug';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

/** Max dt per frame to prevent massive tick bursts after tab suspend */
const MAX_FRAME_DT_MS = 200;
/** Throttle store sync to ~10Hz (100ms) to avoid 60fps GC pressure */
const SYNC_INTERVAL_MS = 100;

export function CombatFightController() {
  const engineRef = useRef<CombatEngine | null>(null);
  const lastSyncRef = useRef(0);
  const arenaPhase = useGameStore(s => s.arenaPhase);
  const formation = useGameStore(s => s.formation);
  const arenaMissionId = useGameStore(s => s.arenaMissionId);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const syncArenaState = useGameStore(s => s.syncArenaState);
  const endCombat = useGameStore(s => s.endCombat);
  const founder = useGameStore(s => s.founder);
  const roster = useGameStore(s => s.roster);

  // Initialize engine when fighting starts
  useEffect(() => {
    if (arenaPhase !== 'fighting') {
      engineRef.current = null;
      return;
    }

    const allMembers = founder ? [founder, ...roster] : roster;
    const missionData = MISSIONS.find(m => m.id === arenaMissionId);
    if (!missionData) return;

    const members = allMembers.filter(m => formation.includes(m.id));
    const enemyTemplates = missionData.enemyIds.map(id => ENEMIES[id]).filter(Boolean);

    const engine = new CombatEngine();
    engine.init(members, formation, enemyTemplates);
    engineRef.current = engine;

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

    const dtMs = Math.min(delta * 1000, MAX_FRAME_DT_MS) * speedMultiplier;
    const events = engine.tick(dtMs);

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
