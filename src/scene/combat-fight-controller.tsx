/**
 * Combat fight controller — drives CombatEngine tick loop inside the R3F Canvas.
 * Initializes engine on phase='fighting', ticks each frame, syncs snapshots to store.
 * Listens for 'combat-skill' CustomEvents from the skill hotbar.
 *
 * V2: Uses CombatStateBridge for GPU-driven rendering (Phase 04 redesign).
 * Engine → Bridge → AnimationStateBuffer → InstancedSpriteRenderer
 * Store sync throttled to 5Hz (UI panels only).
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree, type RootState } from '@react-three/fiber';
import { CombatEngine } from '@/game/systems/combat-engine';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { ENEMIES } from '@/game/data/enemies';
import { useArenaDebug } from './combat-arena-debug';
import { WaveManager, legacyToWaves } from '@/game/systems/combat-wave-manager';
// sprite-path-resolver used internally by mega-atlas-builder
import { combatLog, clearCombatLog, downloadCombatLog } from './combat-logger';
import { CombatStateBridge } from './combat/combat-state-bridge';
import { preloadCombatAtlases } from './combat/mega-atlas-builder';
import type { MegaAtlasResult } from './combat/mega-atlas-builder';
import type { DamageNumberPoolHandle } from './combat/damage-number-pool';
import type { CombatSlashPoolHandle } from './combat-slash-pool';
import type { CombatArrowPoolHandle } from './combat-arrow-pool';
import type { CanvasTexture } from 'three';
import type { SpriteRegistry } from './combat/sprite-registry';

/** Max dt per frame to prevent massive tick bursts after tab suspend */
const MAX_FRAME_DT_MS = 200;
/** Throttle store sync to ~5Hz (200ms) — reduced from 10Hz for less GC pressure */
const SYNC_INTERVAL_MS = 200;

/** Props passed down to CombatArena for instanced rendering */
export interface CombatRenderState {
  bridge: CombatStateBridge;
  atlasTextures: CanvasTexture[];
  registry: SpriteRegistry;
}

/** Shared render state stored in a ref for child components */
let _renderState: CombatRenderState | null = null;
export function getCombatRenderState(): CombatRenderState | null {
  return _renderState;
}

export function CombatFightController({
  damagePoolRef,
  slashPoolRef,
  arrowPoolRef,
}: {
  damagePoolRef?: React.RefObject<DamageNumberPoolHandle | null>;
  slashPoolRef?: React.RefObject<CombatSlashPoolHandle | null>;
  arrowPoolRef?: React.RefObject<CombatArrowPoolHandle | null>;
}) {
  const engineRef = useRef<CombatEngine | null>(null);
  const waveManagerRef = useRef<WaveManager | null>(null);
  const bridgeRef = useRef<CombatStateBridge | null>(null);
  const atlasResultRef = useRef<MegaAtlasResult | null>(null);
  const lastSyncRef = useRef(0);
  const waveTransitioningRef = useRef(false);
  const waveTransitionUntilRef = useRef(0);
  const { camera } = useThree();
  const arenaPhase = useGameStore(s => s.arenaPhase);
  const formation = useGameStore(s => s.formation);
  const arenaMissionId = useGameStore(s => s.arenaMissionId);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const combatMode = useGameStore(s =>
    s.activeMissions.find(m => m.missionId === arenaMissionId)?.combatMode ?? 'auto',
  );
  const syncArenaState = useGameStore(s => s.syncArenaState);
  const syncWaveState = useGameStore(s => s.syncWaveState);
  const setActiveAllyTurn = useGameStore(s => s.setActiveAllyTurn);
  const endCombat = useGameStore(s => s.endCombat);
  const founder = useGameStore(s => s.founder);
  const roster = useGameStore(s => s.roster);
  const inventory = useGameStore(s => s.inventory);
  const removeItem = useGameStore(s => s.removeItem);

  // Initialize engine when fighting starts
  useEffect(() => {
    if (arenaPhase !== 'fighting') {
      engineRef.current = null;
      waveManagerRef.current = null;
      waveTransitioningRef.current = false;
      // Clean up bridge
      if (bridgeRef.current) {
        bridgeRef.current.clear();
        bridgeRef.current = null;
      }
      _renderState = null;
      return;
    }

    const allMembers = founder ? [founder, ...roster] : roster;
    const missionData = MISSIONS.find(m => m.id === arenaMissionId);
    if (!missionData) return;

    const members = allMembers.filter(m => formation.includes(m.id));

    // Clear previous combat log and start fresh
    clearCombatLog();
    combatLog(`=== COMBAT START === mission:${arenaMissionId} members:${members.map(m => m.name).join(',')}`);

    // Wave system
    const waves = missionData.waves ?? legacyToWaves(missionData.enemyIds);
    const waveManager = new WaveManager(waves);
    waveManagerRef.current = waveManager;

    const firstWave = waveManager.current();
    const enemyTemplates = firstWave.enemyIds.map(id => ENEMIES[id]).filter(Boolean);

    // Collect ALL unique enemy templates from ALL waves for atlas building
    const allEnemyIds = new Set<string>();
    for (const wave of waves) {
      for (const id of wave.enemyIds) allEnemyIds.add(id);
    }
    const allEnemyTemplates = [...allEnemyIds].map(id => ENEMIES[id]).filter(Boolean);

    // Initialize engine — engine distributes syringes from inventory internally
    const engine = new CombatEngine();
    engine.init(members, formation, enemyTemplates, firstWave.hpMultiplier ?? 1, inventory);
    // Deduct syringes that were loaded into combat
    if (engine.totalSyringesLoaded > 0) removeItem('HEALING_SYRINGE', engine.totalSyringesLoaded);
    engine.onWaveCheck = () => waveManagerRef.current?.hasNext() ?? false;
    engine.setManualMode(combatMode === 'manual');
    engineRef.current = engine;

    syncWaveState(0, waveManager.totalWaves());

    // Build mega-atlas and initialize bridge
    preloadCombatAtlases(members, allEnemyTemplates).then((result) => {
      atlasResultRef.current = result;

      // Create bridge
      const bridge = new CombatStateBridge();
      bridge.initFromEngine(engine, result.registry);
      if (damagePoolRef) bridge.setDamagePool(damagePoolRef);
      if (slashPoolRef) bridge.setSlashPool(slashPoolRef);
      if (arrowPoolRef) bridge.setArrowPool(arrowPoolRef);
      bridgeRef.current = bridge;

      // Expose render state for CombatArena
      _renderState = {
        bridge,
        atlasTextures: result.textures,
        registry: result.registry,
      };

      // Initial UI snapshot — don't syncFromEngine here so the buffer
      // retains the 'idle' state set by addEntity(), giving characters
      // their proper IDLE starting pose before the first frame renders.
      const snapshots = bridge.buildUISnapshots(engine);
      syncArenaState(snapshots, 0, []);

      combatLog(`Atlas built: ${result.textures.length} texture(s), ${result.registry.getTypeIds().length} types`);
    });

    // Legacy initial sync (before atlas is ready)
    const snapshots = buildLegacySnapshots(engine);
    syncArenaState(snapshots, 0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaPhase]);

  // Sync combatMode changes to running engine
  useEffect(() => {
    engineRef.current?.setManualMode(combatMode === 'manual');
  }, [combatMode]);

  // Listen for skill activation events from hotbar
  useEffect(() => {
    const handler = (e: Event) => {
      const memberId = (e as CustomEvent).detail;
      engineRef.current?.activateSkill(memberId);
    };
    window.addEventListener('combat-skill', handler);
    return () => window.removeEventListener('combat-skill', handler);
  }, []);

  // Listen for manual basic attack dispatch
  useEffect(() => {
    const handler = (e: Event) => {
      const memberId = (e as CustomEvent).detail;
      engineRef.current?.queueAttack(memberId);
    };
    window.addEventListener('combat-attack', handler);
    return () => window.removeEventListener('combat-attack', handler);
  }, []);

  // Listen for manual target selection
  useEffect(() => {
    const handler = (e: Event) => {
      const { allyId, enemyId } = (e as CustomEvent).detail;
      engineRef.current?.setManualTarget(allyId, enemyId);
    };
    window.addEventListener('combat-target', handler);
    return () => window.removeEventListener('combat-target', handler);
  }, []);

  // Update damage pool ref when it changes
  useEffect(() => {
    if (bridgeRef.current && damagePoolRef) {
      bridgeRef.current.setDamagePool(damagePoolRef);
    }
  }, [damagePoolRef]);

  // Update slash pool ref when it changes
  useEffect(() => {
    if (bridgeRef.current && slashPoolRef) {
      bridgeRef.current.setSlashPool(slashPoolRef);
    }
  }, [slashPoolRef]);

  // Update arrow pool ref when it changes
  useEffect(() => {
    if (bridgeRef.current && arrowPoolRef) {
      bridgeRef.current.setArrowPool(arrowPoolRef);
    }
  }, [arrowPoolRef]);

  // Tick engine each frame — skip when debug paused
  const debugPaused = useArenaDebug()?.paused ?? false;
  useFrame((_, delta) => {
    const engine = engineRef.current;
    if (!engine || arenaPhase !== 'fighting' || debugPaused) return;

    const bridge = bridgeRef.current;
    const now = performance.now();

    // Wave transition pause
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

            // Add new entities to bridge
            if (bridge && atlasResultRef.current) {
              bridge.addEntities(engine.entities.slice(-templates.length) as any, atlasResultRef.current.registry);
            }
          }
        }
      }
      return;
    }

    const dtMs = Math.min(delta * 1000, MAX_FRAME_DT_MS) * speedMultiplier;
    const events = engine.tick(dtMs);

    // Sync active ally turn to store each frame (cheap string or null)
    setActiveAllyTurn(engine.getPausedForAllyTurn());

    // Log combat events
    for (const e of events) {
      if (e.type === 'auto-attack' || e.type === 'skill-use') {
        const attacker = engine.entities.find(en => en.id === e.attackerId);
        const target   = engine.entities.find(en => en.id === e.targetId);
        combatLog(
          `${e.type} | ${attacker?.name ?? e.attackerId} → ${target?.name ?? e.targetId}` +
          ` | dmg=${e.damage}${e.isCrit ? '(CRIT)' : ''} | HP=${target?.currentHp ?? '?'}/${target?.maxHp ?? '?'}`,
        );
      } else if (e.type === 'death') {
        const dead = engine.entities.find(en => en.id === e.entityId);
        combatLog(`DEATH: ${dead?.name ?? e.entityId}`);
      } else if (e.type === 'dodge' || e.type === 'block') {
        combatLog(`${e.type.toUpperCase()}: ${e.targetId}`);
      } else if (e.type === 'wave-cleared') {
        combatLog(`--- WAVE CLEARED ---`);
      }
    }

    // Sync engine → buffer (every frame, fast)
    if (bridge) {
      bridge.syncFromEngine(engine);
      bridge.emitCombatEvents(events, engine);
    }

    // Handle wave-cleared
    const waveClearedEvent = events.find(e => e.type === 'wave-cleared');
    if (waveClearedEvent && !waveTransitioningRef.current && waveManagerRef.current?.hasNext()) {
      waveTransitioningRef.current = true;
      waveTransitionUntilRef.current = now + 1000;
    }

    // Camera follow
    advanceCameraFollow(engine, camera);

    // Throttled store sync for UI panels (5Hz)
    const shouldSync = events.length > 0 || engine.time - lastSyncRef.current >= SYNC_INTERVAL_MS;
    if (shouldSync && bridge) {
      lastSyncRef.current = engine.time;
      const snapshots = bridge.buildUISnapshots(engine);
      syncArenaState(snapshots, engine.time, events);
    }

    // Check if combat finished
    if (engine.isFinished()) {
      engineRef.current = null;
      if (bridge) {
        const snapshots = bridge.buildUISnapshots(engine);
        syncArenaState(snapshots, engine.time, events);
      }
      const result = engine.getResult();
      combatLog(`=== COMBAT END === outcome:${result.outcome} duration:${result.durationMs}ms`);
      downloadCombatLog();
      endCombat(result);
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

/** Legacy snapshot builder — used before atlas is ready */
function buildLegacySnapshots(engine: CombatEngine) {
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
    nextAttackAt: e.nextAttackAt,
    attackIntervalMs: e.attackIntervalMs,
    isBoss: e.isBoss,
    attackMoveState: e.attackMoveState,
    waitingForInput: e.waitingForInput,
    manualTargetId: e.manualTargetId,
  }));
}
