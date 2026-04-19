/**
 * CombatStateBridge — bridges CombatEngine → AnimationStateBuffer → GPU Renderers.
 * Separates rendering data (Float32Array, every frame) from UI data (Zustand, throttled 5Hz).
 *
 * Data flow:
 *   CombatEngine.tick() → bridge.syncFromEngine() → AnimationStateBuffer (imperative)
 *   Throttled:            bridge.buildUISnapshots() → Zustand store (React UI)
 */

import { AnimationStateBuffer } from './animation-state-buffer';
import type { AnimStateName } from './animation-state-buffer';
import type { CombatEngine } from '@/game/systems/combat-engine';
import type { ArenaEntity } from '@/game/systems/combat-arena-types';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';
import type { CombatEvent } from '@/game/systems/combat-types';
import type { SpriteRegistry } from './sprite-registry';
import { getSpritePath } from '../sprite-path-resolver';
import type { DamageNumberPoolHandle } from './damage-number-pool';
import type { CombatSlashPoolHandle } from '../combat-slash-pool';
import type { CombatArrowPoolHandle } from '../combat-arrow-pool';

const DEFAULT_SPRITE_SCALE = 2.1;
const BOSS_SPRITE_SCALE = 3.0;

export class CombatStateBridge {
  readonly buffer: AnimationStateBuffer;
  private entitySlotMap = new Map<string, number>();
  /** Ref to damage number pool for imperative spawning */
  private damagePoolRef: React.RefObject<DamageNumberPoolHandle | null> | null = null;
  /** Ref to slash VFX pool (LS-WARRIOR auto-attack) */
  private slashPoolRef: React.RefObject<CombatSlashPoolHandle | null> | null = null;
  /** Ref to arrow projectile pool (LS-SCOUT auto-attack) */
  private arrowPoolRef: React.RefObject<CombatArrowPoolHandle | null> | null = null;

  constructor(maxEntities = 48) {
    this.buffer = new AnimationStateBuffer(maxEntities);
  }

  /** Set the damage number pool ref for event dispatching */
  setDamagePool(ref: React.RefObject<DamageNumberPoolHandle | null>): void {
    this.damagePoolRef = ref;
  }

  /** Set the slash VFX pool ref (spawned on LS-WARRIOR auto-attacks) */
  setSlashPool(ref: React.RefObject<CombatSlashPoolHandle | null>): void {
    this.slashPoolRef = ref;
  }

  /** Set the arrow projectile pool ref (spawned on LS-SCOUT auto-attacks) */
  setArrowPool(ref: React.RefObject<CombatArrowPoolHandle | null>): void {
    this.arrowPoolRef = ref;
  }

  /** Initialize buffer slots from engine entities (call once when combat starts) */
  initFromEngine(engine: CombatEngine, registry: SpriteRegistry): void {
    this.buffer.clear();
    this.entitySlotMap.clear();

    for (const entity of engine.entities) {
      const typeId = this.getTypeId(entity);
      const scale = this.computeSpriteScale(entity, typeId, registry);

      const slot = this.buffer.addEntity(
        entity.id,
        typeId,
        entity.name,
        entity.isAlly,
        entity.flying ?? false,
        entity.position.x,
        entity.position.z,
        scale,
        scale,
      );

      if (slot >= 0) {
        this.entitySlotMap.set(entity.id, slot);

        // Set actual frame counts from atlas registry
        this.updateFrameCounts(slot, typeId, entity.isAlly, registry);
      }
    }
  }

  /** Add new entities to buffer (wave spawn) */
  addEntities(entities: ArenaEntity[], registry: SpriteRegistry): void {
    for (const entity of entities) {
      if (this.entitySlotMap.has(entity.id)) continue; // already registered

      const typeId = this.getTypeId(entity);
      const scale = this.computeSpriteScale(entity, typeId, registry);

      const slot = this.buffer.addEntity(
        entity.id,
        typeId,
        entity.name,
        entity.isAlly,
        entity.flying ?? false,
        entity.position.x,
        entity.position.z,
        scale,
        scale,
      );

      if (slot >= 0) {
        this.entitySlotMap.set(entity.id, slot);
        this.updateFrameCounts(slot, typeId, entity.isAlly, registry);
      }
    }
  }

  /**
   * Sync entity state from engine → buffer.
   * Called EVERY frame after engine.tick() — must be fast.
   */
  syncFromEngine(engine: CombatEngine): void {
    for (const entity of engine.entities) {
      this.buffer.updateEntity(
        entity.id,
        entity.position.x,
        entity.position.z,
        entity.animState as AnimStateName,
        entity.facingRight,
        entity.currentHp / entity.maxHp,
        entity.currentHp > 0,
      );
    }
  }

  /**
   * Process combat events — spawn damage numbers, trigger hit flashes.
   * Called after engine.tick() with the events from that frame.
   */
  emitCombatEvents(events: CombatEvent[], engine: CombatEngine): void {
    const pool = this.damagePoolRef?.current;
    const slashPool = this.slashPoolRef?.current;
    const arrowPool = this.arrowPoolRef?.current;

    for (const event of events) {
      if (event.type === 'auto-attack' || event.type === 'skill-use') {
        // Hit flash on target
        this.buffer.triggerHitFlash(event.targetId);

        // Spawn damage number
        if (pool) {
          const target = engine.entities.find(e => e.id === event.targetId);
          if (target) {
            pool.spawn({
              position: { x: target.position.x, z: target.position.z },
              damage: event.damage,
              isCrit: event.isCrit,
            });
          }
        }

        // Archetype-specific attacker VFX (auto-attack only)
        if (event.type === 'auto-attack') {
          const attacker = engine.entities.find(e => e.id === event.attackerId);
          if (attacker) {
            // LS-WARRIOR slash arc
            if (slashPool && this.isWarrior(attacker)) {
              slashPool.spawn(
                attacker.position.x,
                attacker.position.z,
                attacker.facingRight,
              );
            }
            // LS-SCOUT straight-line arrow projectile (allies only)
            if (arrowPool && attacker.isAlly && this.isScout(attacker)) {
              const tgt = engine.entities.find(e => e.id === event.targetId);
              if (tgt) {
                arrowPool.spawn(
                  attacker.position.x,
                  attacker.position.z,
                  tgt.position.x,
                  tgt.position.z,
                );
              }
            }
          }
        }
      }

      if (event.type === 'effect-tick' && pool) {
        const target = engine.entities.find(e => e.id === event.targetId);
        if (target) {
          pool.spawn({
            position: { x: target.position.x, z: target.position.z },
            damage: event.damage,
            isPoison: event.effect === 'poison',
          });
        }
      }

      if (event.type === 'heal' && pool) {
        const target = engine.entities.find(e => e.id === event.targetId);
        if (target) {
          pool.spawn({
            position: { x: target.position.x, z: target.position.z },
            damage: event.amount,
            isHeal: true,
          });
        }
      }
    }
  }

  /**
   * Build UI snapshots for Zustand store — THROTTLED (5Hz).
   * Only used by non-rendering UI (skill hotbar, combat log, result screen).
   */
  buildUISnapshots(engine: CombatEngine): ArenaEntitySnapshot[] {
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

  /** Clear all state on combat exit */
  clear(): void {
    this.buffer.clear();
    this.entitySlotMap.clear();
    this.damagePoolRef = null;
    this.slashPoolRef = null;
    this.arrowPoolRef = null;
  }

  /** LS-WARRIOR identity — both genders, scoped to LinhSon civilization. */
  private isWarrior(e: ArenaEntity): boolean {
    return e.civilization === 'LinhSon' && e.archetype === 'warrior';
  }

  /** LS-SCOUT identity — both genders, scoped to LinhSon civilization. */
  private isScout(e: ArenaEntity): boolean {
    return e.civilization === 'LinhSon' && e.archetype === 'scout';
  }

  // --- Private helpers ---

  /**
   * Compute per-entity render scale.
   * Boss vs default base, then compensated by (cell / native) so sprites that are
   * smaller than the atlas cell (padded) don't visually shrink when rendered on
   * the same quad as larger sprites in the same atlas.
   */
  private computeSpriteScale(entity: ArenaEntity, typeId: string, registry: SpriteRegistry): number {
    const base = entity.isBoss ? BOSS_SPRITE_SCALE : DEFAULT_SPRITE_SCALE;
    const entry = registry.getSpriteType(typeId);
    if (!entry || entry.nativeFrameWidth <= 0) return base;
    return base * (entry.frameWidth / entry.nativeFrameWidth);
  }

  /** Derive typeId from entity data */
  private getTypeId(entity: ArenaEntity): string {
    if (entity.spriteId) return entity.spriteId;
    if (entity.isAlly && entity.civilization && entity.archetype) {
      const basePath = getSpritePath(entity.civilization, entity.archetype, entity.gender ?? 'M');
      return basePath.split('/').pop() ?? basePath;
    }
    return 'LS-WARRIOR-M'; // fallback
  }

  /** Update frame counts in buffer from atlas registry for accurate animation */
  private updateFrameCounts(slot: number, typeId: string, _isAlly: boolean, registry: SpriteRegistry): void {
    const entry = registry.getSpriteType(typeId);
    if (!entry) return;

    // Update frame counts for each animation state
    for (const [animName, animInfo] of entry.animations) {
      let animState: number;
      switch (animName) {
        case 'walk': animState = 1; break;
        case 'attack': animState = 2; break;
        case 'death': animState = 5; break;
        case 'battle-idle': animState = 6; break;
        case 'blocking': animState = 7; break;
        default: continue;
      }
      this.buffer.setAnimFrameCount(slot, animState, animInfo.frameCount);
    }
  }
}
