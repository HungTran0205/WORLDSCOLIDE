/**
 * Combat fight controller — drives the CombatEngine tick loop inside the
 * shared world canvas (D8). Mounted by `<CombatScene>` and only does work
 * while `combatPanelStore.phase === 'battle'`.
 *
 * Responsibilities (Phase 4 minimal):
 *   - Initialize engine + WaveManager from active mission data when battle
 *     phase begins.
 *   - Tick engine each frame, throttle entity-snapshot store sync to ~5Hz.
 *   - Listen for the legacy `combat-skill` window event (skill hotbar).
 *   - Spawn damage / heal / poison popups via the projection store.
 *   - On finish: apply mission rewards via `applyMissionResultSideEffects`,
 *     then push the result into combat-panel-store so the result sub-phase
 *     opens. Mission cleanup (exitArena) is deferred to the panel close.
 *
 * GPU instancing, mega-atlas building, and damage-pool refs are all gone —
 * per the plan, that pipeline stays dormant in tree (D1) but is no longer
 * used. Per-entity sprites live in `combat-idle-sprite.tsx`.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useVFXEmitter } from 'r3f-vfx';
import { TextureLoader } from 'three';
import { CombatEngine } from '@/game/systems/combat-engine';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { MISSIONS } from '@/game/data/missions';
import { ENEMIES } from '@/game/data/enemies';
import { TUTORIAL_BEAR_MISSION_ID } from '@/game/data/tutorial-data';
import { WaveManager, legacyToWaves } from '@/game/systems/combat-wave-manager';
import { applyMissionResultSideEffects } from '@/game/systems/arena-result-handler';
import { simulateCombatFromSnapshot, cloneCombatEntity } from '@/game/systems/combat-simulator';
import { resolveCombatMapId, getStageSpec } from './maps/combat-map-registry';
import { useCombatProjectionStore } from './combat-projection-store';
import {
  getEnemyCombatFrameCount,
  resolveEnemyCombatSprite,
} from '@/scene/sprites/combat-sprite-resolver';
import {
  COMBAT_VFX_PRESETS, COMBAT_VFX_COUNTS,
  COMBAT_CRIT_DOM_EVENT, COMBAT_SKIP_DOM_EVENT,
} from './combat-vfx-bridge';
import type { CombatEvent, CombatResult } from '@/game/systems/combat-types';
import type { CombatEngine as CombatEngineType } from '@/game/systems/combat-engine';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

/** Emitter callbacks resolved per preset id at component mount via useVFXEmitter. */
type VfxEmit = (position: [number, number, number], count?: number) => void;
interface VfxEmitters {
  hit: VfxEmit;
  crit: VfxEmit;
  heal: VfxEmit;
  death: VfxEmit;
}

/** Cap per-frame engine dt so a tab-suspend resume doesn't replay 30s in one frame. */
const MAX_FRAME_DT_MS = 200;
/** Throttle store sync to ~5Hz (200ms) — keeps React renders cheap. */
const SYNC_INTERVAL_MS = 200;
/** Brief pause between waves so the player sees the clear before the next spawn. */
const WAVE_TRANSITION_MS = 1000;
/** Autosave engine entity snapshot to the active mission every 2s — keeps
 *  mid-fight reload (D12) cheap (~3.6KB serialized, ≪ once-per-tick churn). */
const SNAPSHOT_INTERVAL_MS = 2000;

export function CombatFightController() {
  const engineRef = useRef<CombatEngine | null>(null);
  const waveManagerRef = useRef<WaveManager | null>(null);
  const lastSyncRef = useRef(0);
  const lastSnapshotRef = useRef(0);
  const waveTransitioningRef = useRef(false);
  const waveTransitionUntilRef = useRef(0);
  // Engine-bound mission id — stashed at init so the skip handler always checks
  // the mission THIS engine instance was started for, not the live store value.
  // The store's missionId can update before the engine tears down on rapid
  // open/close, which would cause a stale-closure race in the skip handler.
  const engineBoundMissionIdRef = useRef<string | null>(null);

  const phase = useCombatPanelStore((s) => s.phase);
  const missionId = useCombatPanelStore((s) => s.missionId);
  const instanceId = useCombatPanelStore((s) => s.instanceId);
  const setPanelResult = useCombatPanelStore((s) => s.setResult);
  const showStoryDialog = useCombatPanelStore((s) => s.showStoryDialog);

  // Emitter handles for each combat VFX event. Resolved once per Canvas
  // lifetime — useVFXEmitter returns a stable closure tied to the preset
  // instance registered by <AllPresetParticles>.
  const hitEmitter = useVFXEmitter(COMBAT_VFX_PRESETS.hit);
  const critEmitter = useVFXEmitter(COMBAT_VFX_PRESETS.crit);
  const healEmitter = useVFXEmitter(COMBAT_VFX_PRESETS.heal);
  const deathEmitter = useVFXEmitter(COMBAT_VFX_PRESETS.death);
  const vfxRef = useRef<VfxEmitters | null>(null);
  vfxRef.current = {
    hit: (pos, count) => hitEmitter.emit(pos, count ?? COMBAT_VFX_COUNTS.hit),
    crit: (pos, count) => critEmitter.emit(pos, count ?? COMBAT_VFX_COUNTS.crit),
    heal: (pos, count) => healEmitter.emit(pos, count ?? COMBAT_VFX_COUNTS.heal),
    death: (pos, count) => deathEmitter.emit(pos, count ?? COMBAT_VFX_COUNTS.death),
  };

  const formation = useGameStore((s) => s.formation);
  const speedMultiplier = useGameStore((s) => s.speedMultiplier);
  const targetPriority = useGameStore((s) =>
    s.activeMissions.find((m) => m.instanceId === instanceId)?.targetPriority ?? 'focus',
  );
  const syncArenaState = useGameStore((s) => s.syncArenaState);
  const syncWaveState = useGameStore((s) => s.syncWaveState);
  const endCombat = useGameStore((s) => s.endCombat);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const inventory = useGameStore((s) => s.inventory);
  const removeItem = useGameStore((s) => s.removeItem);
  const saveCombatSnapshot = useGameStore((s) => s.saveCombatSnapshot);

  // (Re)initialize engine when the battle phase starts.
  useEffect(() => {
    if (phase !== 'battle' || !missionId || !instanceId) {
      engineRef.current = null;
      waveManagerRef.current = null;
      waveTransitioningRef.current = false;
      lastSyncRef.current = 0;
      lastSnapshotRef.current = 0;
      engineBoundMissionIdRef.current = null;
      return;
    }

    const allMembers = founder ? [founder, ...roster] : roster;
    const missionData = MISSIONS.find((m) => m.id === missionId);
    if (!missionData) return;

    const members = allMembers.filter((m) => formation.includes(m.id));
    const waves = missionData.waves ?? legacyToWaves(missionData.enemyIds);
    const waveManager = new WaveManager(waves);
    waveManagerRef.current = waveManager;

    const firstWave = waveManager.current();
    const enemyTemplates = firstWave.enemyIds.map((id) => ENEMIES[id]).filter(Boolean);

    // Resolve stage spec → engine reads spawn anchors (xyz) from spec.
    // Falls back to legacy FORMATION_POSITIONS (y=0) inside engine if spec
    // is missing for some mapId. resolveCombatMapId always returns a valid
    // mapId (defaults to lolo-village-outskirt on miss).
    const stageSpec = getStageSpec(resolveCombatMapId(missionId));

    const engine = new CombatEngine();
    engine.init(members, formation, enemyTemplates, firstWave.hpMultiplier ?? 1, inventory, stageSpec);
    engine.onWaveCheck = () => waveManagerRef.current?.hasNext() ?? false;
    engine.setTargetPriority(targetPriority);
    // Tutorial HP-floor (Phase 04): the Moonbear fight must be a guaranteed win.
    // Scoped to this one mission so all other combat is unaffected.
    engine.hpFloorActive = missionId === TUTORIAL_BEAR_MISSION_ID;
    engineRef.current = engine;
    // Stash the mission id that this engine was bound to. The skip handler reads
    // this ref (not getState().missionId) to avoid a close/re-open race where
    // the store updates before the old engine tears down.
    engineBoundMissionIdRef.current = missionId;

    syncWaveState(0, waveManager.totalWaves());
    syncArenaState(buildSnapshots(engine), 0, []);
    useCombatProjectionStore.getState().clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, instanceId]);

  // Sync targetPriority changes to running engine (player toggles in panel).
  useEffect(() => {
    engineRef.current?.setTargetPriority(targetPriority);
  }, [targetPriority]);

  // Skill activation pipe — same global event the legacy hotbar already emits.
  useEffect(() => {
    const handler = (e: Event) => {
      const memberId = (e as CustomEvent).detail;
      engineRef.current?.activateSkill(memberId);
    };
    window.addEventListener('combat-skill', handler);
    return () => window.removeEventListener('combat-skill', handler);
  }, []);

  // Skip → simulator handoff (D11). Snapshot the live engine state, deep
  // clone, run the headless tick loop with random target picking, then
  // finalize using the simulator's result instead of the engine's.
  useEffect(() => {
    const handler = () => {
      const engine = engineRef.current;
      if (!engine || engine.isFinished()) return;

      // Defense-in-depth: gate on the engine-bound mission id (stashed at init)
      // rather than the live store value to avoid a close/re-open race where the
      // store's missionId updates before this engine's useEffect cleanup runs.
      const boundId = engineBoundMissionIdRef.current;
      const boundMission = boundId ? MISSIONS.find((x) => x.id === boundId) : null;
      if (!boundMission || boundMission.isMainQuest || boundMission.id.startsWith('tutorial-')) return;

      const snapshot = engine.entities.map((e) => cloneCombatEntity(e));
      // Read missionId from the store (effect deps are [] → no stale closure) so
      // the Skip→simulate path honours the tutorial HP-floor too.
      const isTutorial = useCombatPanelStore.getState().missionId === TUTORIAL_BEAR_MISSION_ID;
      const skippedResult = simulateCombatFromSnapshot(snapshot, engine.time, isTutorial);
      finalizeCombat(engine, skippedResult);
    };
    window.addEventListener(COMBAT_SKIP_DOM_EVENT, handler);
    return () => window.removeEventListener(COMBAT_SKIP_DOM_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const engine = engineRef.current;
    if (!engine || phase !== 'battle') return;

    // Wave transition pause — engine is held while we let players see "wave clear".
    const now = performance.now();
    if (waveTransitioningRef.current) {
      if (now < waveTransitionUntilRef.current) return;
      waveTransitioningRef.current = false;
      const wm = waveManagerRef.current;
      if (wm) {
        const nextWave = wm.advance();
        if (nextWave) {
          const templates = nextWave.enemyIds.map((id) => ENEMIES[id]).filter(Boolean);
          engine.addEnemies(templates, nextWave.spawnXOffset, nextWave.hpMultiplier ?? 1);
          syncWaveState(wm.currentWaveIndex(), wm.totalWaves());
        }
      }
      // Sync immediately so new entities mount sprites this frame.
      syncArenaState(buildSnapshots(engine), engine.time, []);
      lastSyncRef.current = engine.time;
      return;
    }

    const dtMs = Math.min(delta * 1000, MAX_FRAME_DT_MS) * speedMultiplier;
    const events = engine.tick(dtMs);
    if (events.length > 0) {
      emitDamagePopups(events, engine);
      emitVfxFromEvents(events, engine, vfxRef.current);
    }

    // Detect wave clear → schedule pause before next spawn.
    if (events.some((e) => e.type === 'wave-cleared') && waveManagerRef.current?.hasNext()) {
      waveTransitioningRef.current = true;
      waveTransitionUntilRef.current = now + WAVE_TRANSITION_MS;
      // Preload next wave's enemy textures during the transition pause so the
      // subsequent CombatIdleSprite mounts are cache hits and cannot blank the
      // shared Suspense fallback (finding C from the red-team review).
      preloadNextWaveTextures(waveManagerRef.current);
    }

    const shouldSync = events.length > 0 || engine.time - lastSyncRef.current >= SYNC_INTERVAL_MS;
    if (shouldSync) {
      lastSyncRef.current = engine.time;
      syncArenaState(buildSnapshots(engine), engine.time, events);
    }

    // Autosave entity snapshot to active mission — supports mid-fight reload
    // (D12). Throttled to 2s to keep IndexedDB writes cheap.
    if (instanceId && engine.time - lastSnapshotRef.current >= SNAPSHOT_INTERVAL_MS) {
      lastSnapshotRef.current = engine.time;
      saveCombatSnapshot(
        instanceId,
        engine.entities.map((e) => cloneCombatEntity(e)),
        engine.time,
      );
    }

    // Cleanup transient damage popups (>1s old).
    useCombatProjectionStore.getState().pruneDamages(1000);

    if (engine.isFinished()) {
      finalizeCombat(engine);
    }
  });

  /** Apply rewards + transition panel to result sub-phase. Idempotent (engineRef cleared).
   *  When a `resultOverride` is supplied (e.g. from the Skip path), it replaces
   *  the engine's natural getResult() outcome. */
  function finalizeCombat(engine: CombatEngineType, resultOverride?: CombatResult) {
    const panel = useCombatPanelStore.getState();
    const id = panel.missionId;       // template id (MISSIONS lookup)
    const instId = panel.instanceId;  // unique active-mission id (identity)
    if (!id || !instId) return;

    const result = resultOverride ?? engine.getResult();
    if (engine.syringesConsumed > 0) removeItem('HEALING_SYRINGE', engine.syringesConsumed);

    // Combat resolved — drop snapshot so reload doesn't re-resolve from stale state.
    saveCombatSnapshot(instId, null, 0);
    syncArenaState(buildSnapshots(engine), engine.time, []);
    endCombat(result);

    const store = useGameStore.getState();
    const mission = MISSIONS.find((m) => m.id === id);
    const active = store.activeMissions.find((m) => m.instanceId === instId);
    if (!mission || !active) {
      engineRef.current = null;
      return;
    }
    const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
    const members = allMembers.filter((m) => active.memberIds.includes(m.id));

    const missionResult = applyMissionResultSideEffects(mission, active, members, result);
    // Story beat: main quests with post-combat dialog play it before the
    // result splash (success only — no dialog on a full wipe). The result is
    // held in the panel store and revealed when the player dismisses it.
    if (mission.postCombatDialog?.length && result.outcome !== 'full-wipe') {
      showStoryDialog(mission.postCombatDialog, missionResult);
    } else {
      setPanelResult(missionResult);
    }
    engineRef.current = null;
  }

  return null;
}

/** Build store snapshots from engine entities (used to drive UI subscriptions). */
function buildSnapshots(engine: CombatEngineType): ArenaEntitySnapshot[] {
  return engine.entities.map((e) => ({
    id: e.id,
    name: e.name,
    isAlly: e.isAlly,
    maxHp: e.maxHp,
    currentHp: e.currentHp,
    position: { x: e.position.x, y: e.position.y, z: e.position.z },
    animState: e.animState,
    facingRight: e.facingRight,
    skillCooldownUntil: e.skillCooldownUntil,
    statusEffects: e.statusEffects.map((se) => ({ type: se.type, ticksRemaining: se.ticksRemaining })),
    skillName: e.skill?.name,
    skillId: e.skill?.id,
    archetype: e.archetype,
    civilization: e.civilization,
    gender: e.gender,
    maskSpriteId: e.maskSpriteId,
    spriteId: e.spriteId,
    flying: e.flying,
    nextAttackAt: e.nextAttackAt,
    attackIntervalMs: e.attackIntervalMs,
    isBoss: e.isBoss,
    attackMoveState: e.attackMoveState,
    // Cosmetic slide hint — carried once (on the wave-spawn sync); subsequent
    // syncs overwrite with the same undefined (entity is already on-screen).
    spawnSlideFromX: e.spawnSlideFromX,
  }));
}

/**
 * Translate combat events into VFX preset emits + crit screen shake.
 * Crit shakes are dispatched via window event so the DOM panel listener can
 * toggle a CSS class without subscribing to the engine. Hit sparks also fire
 * for crits — we want both the spark and the larger gold burst on crit.
 */
function emitVfxFromEvents(
  events: CombatEvent[],
  engine: CombatEngineType,
  vfx: VfxEmitters | null,
): void {
  if (!vfx) return;
  for (const event of events) {
    if (event.type === 'auto-attack' || event.type === 'skill-use') {
      const target = engine.entities.find((e) => e.id === event.targetId);
      if (!target) continue;
      const pos: [number, number, number] = [target.position.x, 1.2, target.position.z];
      vfx.hit(pos);
      if (event.isCrit) {
        vfx.crit(pos);
        window.dispatchEvent(new CustomEvent(COMBAT_CRIT_DOM_EVENT));
      }
    } else if (event.type === 'heal' || event.type === 'syringe-used') {
      const targetId = event.type === 'heal' ? event.targetId : event.entityId;
      const target = engine.entities.find((e) => e.id === targetId);
      if (target) vfx.heal([target.position.x, 1.2, target.position.z]);
    } else if (event.type === 'death') {
      const dead = engine.entities.find((e) => e.id === event.entityId);
      if (dead) vfx.death([dead.position.x, 1.0, dead.position.z]);
    }
  }
}

/**
 * Kick texture preloads for the next wave's enemy sprites into the Three.js
 * loader cache (same cache useLoader reads) so that when CombatIdleSprite
 * mounts new entities, all textures are already resolved — no Suspense fallback
 * blank on the shared <Suspense fallback={null}> in combat-scene-shell.tsx.
 *
 * Called once when wave-cleared is detected, at the start of WAVE_TRANSITION_MS,
 * giving ~1000ms for the network/disk load before sprites mount.
 */
function preloadNextWaveTextures(wm: WaveManager): void {
  const nextWave = wm.peekNext();
  if (!nextWave) return;

  // Collect unique spriteIds from the next wave's enemy templates.
  const spriteIds = new Set<string>();
  for (const id of nextWave.enemyIds) {
    const tmpl = ENEMIES[id];
    if (tmpl) spriteIds.add(tmpl.spriteId ?? 'slime');
  }

  for (const spriteId of spriteIds) {
    // Preload idle frames — the primary animation; attack/death are warm on first use.
    const idleCount = getEnemyCombatFrameCount(spriteId, 'idle');
    const idlePaths = Array.from({ length: Math.max(1, idleCount) }, (_, i) =>
      resolveEnemyCombatSprite(spriteId, 'idle', i),
    );
    useLoader.preload(TextureLoader, idlePaths);

    // Preload attack frames to avoid a second suspend on first attack animation.
    const attackCount = getEnemyCombatFrameCount(spriteId, 'attack');
    const attackPaths = Array.from({ length: Math.max(1, attackCount) }, (_, i) =>
      resolveEnemyCombatSprite(spriteId, 'attack', i),
    );
    useLoader.preload(TextureLoader, attackPaths);
  }
}

/** Translate combat events into floating damage / heal / poison popups. */
function emitDamagePopups(events: CombatEvent[], engine: CombatEngineType): void {
  const spawn = useCombatProjectionStore.getState().spawnDamage;
  for (const event of events) {
    if (event.type === 'auto-attack' || event.type === 'skill-use') {
      spawn(event.targetId, String(event.damage), event.isCrit ? 'crit' : 'normal');
    } else if (event.type === 'effect-tick') {
      spawn(event.targetId, String(event.damage), event.effect === 'poison' ? 'poison' : 'normal');
    } else if (event.type === 'heal') {
      spawn(event.targetId, `+${event.amount}`, 'heal');
    } else if (event.type === 'syringe-used') {
      spawn(event.entityId, `+${event.healAmount}`, 'heal');
    } else if (event.type === 'dodge') {
      const target = engine.entities.find((e) => e.id === event.targetId);
      if (target) spawn(target.id, 'DODGE', 'normal');
    } else if (event.type === 'block') {
      spawn(event.targetId, `BLOCK ${event.reducedDamage}`, 'normal');
    }
  }
}

