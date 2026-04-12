/**
 * AnimationStateBuffer — CPU-side animation state management via typed arrays.
 * CombatEngine writes entity state here; InstancedSpriteRenderer reads it in useFrame.
 * Zero React involvement — pure imperative typed array operations.
 */

/** Animation state enum (matching CombatEngine animState strings) */
export const ANIM_STATE = {
  idle: 0,
  walking: 1,
  attacking: 2,
  skill: 3,
  hit: 4,
  dead: 5,
  'battle-idle': 6,
  blocking: 7,
} as const;

export type AnimStateName = keyof typeof ANIM_STATE;

/** Map numeric anim state back to string — index MUST match numeric enum value */
const ANIM_STATE_NAMES: AnimStateName[] = [
  'idle', 'walking', 'attacking', 'skill', 'hit', 'dead', 'battle-idle', 'blocking',
];

export function animStateToName(state: number): AnimStateName {
  return ANIM_STATE_NAMES[state] ?? 'idle';
}

/**
 * Per-entity stride in the state buffer (Float32Array).
 * Layout per entity (18 floats):
 *   [0]  targetX          — target world X position (lerp destination)
 *   [1]  targetZ          — target world Z position (lerp destination)
 *   [2]  currentX         — current rendered X (smoothed)
 *   [3]  currentZ         — current rendered Z (smoothed)
 *   [4]  animState        — ANIM_STATE enum value
 *   [5]  elapsed          — time since last frame advance
 *   [6]  frameIndex       — current animation frame (0-based)
 *   [7]  fps              — animation playback speed
 *   [8]  totalFrames      — total frames in current animation
 *   [9]  facingRight      — 0 or 1
 *   [10] hpRatio          — currentHp / maxHp (0-1)
 *   [11] isAlive          — 0 or 1
 *   [12] spriteTypeIndex  — index into sprite type registry
 *   [13] scaleX           — render scale X (negative = flip)
 *   [14] scaleY           — render scale Y
 *   [15] tintR            — tint color R (0-1, 0=no tint)
 *   [16] tintG            — tint color G
 *   [17] tintB            — tint color B
 */
export const ENTITY_STRIDE = 18;

// Field offsets
const O_TARGET_X = 0;
const O_TARGET_Z = 1;
const O_CURRENT_X = 2;
const O_CURRENT_Z = 3;
const O_ANIM_STATE = 4;
const O_ELAPSED = 5;
const O_FRAME_INDEX = 6;
const O_FPS = 7;
const O_TOTAL_FRAMES = 8;
const O_FACING_RIGHT = 9;
const O_HP_RATIO = 10;
const O_IS_ALIVE = 11;
const O_SPRITE_TYPE_INDEX = 12;
const O_SCALE_X = 13;
const O_SCALE_Y = 14;
const O_TINT_R = 15;
const O_TINT_G = 16;
const O_TINT_B = 17;

/** Position lerp factor — higher = faster following */
const POSITION_LERP = 0.15;

/** Default FPS values per animation state */
const DEFAULT_FPS: Record<number, number> = {
  [ANIM_STATE.idle]: 10,
  [ANIM_STATE.walking]: 10,
  [ANIM_STATE.attacking]: 12,
  [ANIM_STATE.skill]: 12,
  [ANIM_STATE.hit]: 10,
  [ANIM_STATE.dead]: 8,
  [ANIM_STATE['battle-idle']]: 6,
  [ANIM_STATE.blocking]: 10,
};

/** Default frame counts per animation state */
const DEFAULT_FRAME_COUNT: Record<number, number> = {
  [ANIM_STATE.idle]: 1,    // idle = first walk frame
  [ANIM_STATE.walking]: 8,
  [ANIM_STATE.attacking]: 4,
  [ANIM_STATE.skill]: 4,
  [ANIM_STATE.hit]: 1,
  [ANIM_STATE.dead]: 8,
  [ANIM_STATE['battle-idle']]: 4,
  [ANIM_STATE.blocking]: 4,
};

/** Hit flash duration in seconds */
const HIT_FLASH_DURATION = 0.2;

export class AnimationStateBuffer {
  readonly maxEntities: number;
  /** Raw Float32Array — shared between writer (engine bridge) and reader (renderer) */
  readonly data: Float32Array;
  /** Entity ID → slot index mapping */
  private entitySlots = new Map<string, number>();
  /** Slot → entity type ID (for atlas lookup) */
  private typeIds: string[] = [];
  /** Slot → entity ID */
  private entityIds: string[] = [];
  /** Slot → entity name (for text labels) */
  private entityNames: string[] = [];
  /** Slot → isAlly flag */
  private allyFlags: boolean[] = [];
  /** Slot → flying flag */
  private flyingFlags: boolean[] = [];
  /** Active entity count */
  private _count = 0;
  /** Hit flash timers per entity (seconds remaining) */
  private hitFlashTimers: Float32Array;
  /** Death elapsed timers — tracks total time since death started */
  private deathTimers: Float32Array;

  constructor(maxEntities = 48) {
    this.maxEntities = maxEntities;
    this.data = new Float32Array(maxEntities * ENTITY_STRIDE);
    this.hitFlashTimers = new Float32Array(maxEntities);
    this.deathTimers = new Float32Array(maxEntities);
    this.typeIds = new Array(maxEntities).fill('');
    this.entityIds = new Array(maxEntities).fill('');
    this.entityNames = new Array(maxEntities).fill('');
    this.allyFlags = new Array(maxEntities).fill(false);
    this.flyingFlags = new Array(maxEntities).fill(false);
  }

  /** Number of active entities */
  get count(): number { return this._count; }

  /** Register a new entity in the buffer. Returns the slot index. */
  addEntity(
    entityId: string,
    typeId: string,
    name: string,
    isAlly: boolean,
    flying: boolean,
    x: number,
    z: number,
    scaleX: number,
    scaleY: number,
  ): number {
    const slot = this._count;
    if (slot >= this.maxEntities) {
      console.warn(`AnimationStateBuffer: max entities (${this.maxEntities}) reached`);
      return -1;
    }

    this.entitySlots.set(entityId, slot);
    this.typeIds[slot] = typeId;
    this.entityIds[slot] = entityId;
    this.entityNames[slot] = name;
    this.allyFlags[slot] = isAlly;
    this.flyingFlags[slot] = flying;

    const base = slot * ENTITY_STRIDE;
    this.data[base + O_TARGET_X] = x;
    this.data[base + O_TARGET_Z] = z;
    this.data[base + O_CURRENT_X] = x;
    this.data[base + O_CURRENT_Z] = z;
    this.data[base + O_ANIM_STATE] = ANIM_STATE.idle;
    this.data[base + O_ELAPSED] = 0;
    this.data[base + O_FRAME_INDEX] = 0;
    this.data[base + O_FPS] = DEFAULT_FPS[ANIM_STATE.idle];
    this.data[base + O_TOTAL_FRAMES] = 1;
    this.data[base + O_FACING_RIGHT] = 1;
    this.data[base + O_HP_RATIO] = 1;
    this.data[base + O_IS_ALIVE] = 1;
    this.data[base + O_SPRITE_TYPE_INDEX] = slot;
    this.data[base + O_SCALE_X] = scaleX;
    this.data[base + O_SCALE_Y] = scaleY;
    this.data[base + O_TINT_R] = 0;
    this.data[base + O_TINT_G] = 0;
    this.data[base + O_TINT_B] = 0;
    this.hitFlashTimers[slot] = 0;

    this._count++;
    return slot;
  }

  /** Get slot index for entity ID (returns -1 if not found) */
  getSlot(entityId: string): number {
    return this.entitySlots.get(entityId) ?? -1;
  }

  /** Get type ID for a slot */
  getTypeId(slot: number): string { return this.typeIds[slot]; }

  /** Get entity ID for a slot */
  getEntityId(slot: number): string { return this.entityIds[slot]; }

  /** Get entity name for a slot */
  getEntityName(slot: number): string { return this.entityNames[slot]; }

  /** Get isAlly flag for a slot */
  isAlly(slot: number): boolean { return this.allyFlags[slot]; }

  /** Get flying flag for a slot */
  isFlying(slot: number): boolean { return this.flyingFlags[slot]; }

  /** Update entity state from CombatEngine (called every engine tick) */
  updateEntity(
    entityId: string,
    x: number,
    z: number,
    animState: AnimStateName,
    facingRight: boolean,
    hpRatio: number,
    isAlive: boolean,
  ): void {
    const slot = this.entitySlots.get(entityId);
    if (slot === undefined) return;

    const base = slot * ENTITY_STRIDE;
    this.data[base + O_TARGET_X] = x;
    this.data[base + O_TARGET_Z] = z;
    this.data[base + O_FACING_RIGHT] = facingRight ? 1 : 0;
    this.data[base + O_HP_RATIO] = hpRatio;
    this.data[base + O_IS_ALIVE] = isAlive ? 1 : 0;

    const newState = ANIM_STATE[animState] ?? ANIM_STATE.idle;
    const oldState = this.data[base + O_ANIM_STATE];

    if (newState !== oldState) {
      this.data[base + O_ANIM_STATE] = newState;
      this.data[base + O_ELAPSED] = 0;
      this.data[base + O_FRAME_INDEX] = 0;
      this.data[base + O_FPS] = DEFAULT_FPS[newState] ?? 10;
      this.data[base + O_TOTAL_FRAMES] = DEFAULT_FRAME_COUNT[newState] ?? 1;
    }
  }

  /** Trigger hit flash on an entity */
  triggerHitFlash(entityId: string): void {
    const slot = this.entitySlots.get(entityId);
    if (slot === undefined) return;
    this.hitFlashTimers[slot] = HIT_FLASH_DURATION;
  }

  /** Set total frames for a specific animation (called when atlas knows actual frame count) */
  setAnimFrameCount(slot: number, animState: number, frameCount: number): void {
    const base = slot * ENTITY_STRIDE;
    if (this.data[base + O_ANIM_STATE] === animState) {
      this.data[base + O_TOTAL_FRAMES] = frameCount;
    }
  }

  /**
   * Advance all entity animations by delta seconds.
   * Called from the single useFrame callback.
   */
  advanceAll(delta: number): void {
    for (let i = 0; i < this._count; i++) {
      const base = i * ENTITY_STRIDE;
      const isAlive = this.data[base + O_IS_ALIVE] !== 0;
      const animState = this.data[base + O_ANIM_STATE];

      // Skip dead entities UNLESS playing death animation
      if (!isAlive && animState !== ANIM_STATE.dead) continue;

      // --- Position lerp (alive only) ---
      if (isAlive) {
        const tx = this.data[base + O_TARGET_X];
        const tz = this.data[base + O_TARGET_Z];
        const cx = this.data[base + O_CURRENT_X];
        const cz = this.data[base + O_CURRENT_Z];
        this.data[base + O_CURRENT_X] = cx + (tx - cx) * POSITION_LERP;
        this.data[base + O_CURRENT_Z] = cz + (tz - cz) * POSITION_LERP;
      }

      // --- Death timer ---
      if (!isAlive && animState === ANIM_STATE.dead) {
        this.deathTimers[i] += delta;
      }

      // --- Frame advance ---
      const fps = this.data[base + O_FPS];
      const totalFrames = this.data[base + O_TOTAL_FRAMES];

      // Only advance for animated states
      if (animState === ANIM_STATE.idle || animState === ANIM_STATE.hit) continue;

      this.data[base + O_ELAPSED] += delta;
      const frameInterval = 1 / fps;

      if (this.data[base + O_ELAPSED] >= frameInterval) {
        this.data[base + O_ELAPSED] -= frameInterval;
        const currentFrame = this.data[base + O_FRAME_INDEX];

        if (animState === ANIM_STATE.dead || animState === ANIM_STATE.blocking) {
          // Play once, freeze on last frame
          if (currentFrame < totalFrames - 1) {
            this.data[base + O_FRAME_INDEX] = currentFrame + 1;
          }
        } else {
          // Loop
          this.data[base + O_FRAME_INDEX] = (currentFrame + 1) % totalFrames;
        }
      }

      // --- Hit flash decay (alive only) ---
      if (isAlive && this.hitFlashTimers[i] > 0) {
        this.hitFlashTimers[i] -= delta;
        if (this.hitFlashTimers[i] <= 0) {
          this.hitFlashTimers[i] = 0;
          this.data[base + O_TINT_R] = 0;
          this.data[base + O_TINT_G] = 0;
          this.data[base + O_TINT_B] = 0;
        } else {
          // Red tint during hit flash
          this.data[base + O_TINT_R] = 1;
          this.data[base + O_TINT_G] = 0.2;
          this.data[base + O_TINT_B] = 0.2;
        }
      }
    }
  }

  /** Get elapsed time since death started (for fade-out in renderer) */
  getDeathElapsed(slot: number): number {
    return this.deathTimers[slot];
  }

  /** Read current position for a slot */
  getCurrentPosition(slot: number): { x: number; z: number } {
    const base = slot * ENTITY_STRIDE;
    return {
      x: this.data[base + O_CURRENT_X],
      z: this.data[base + O_CURRENT_Z],
    };
  }

  /** Read target position for a slot */
  getTargetPosition(slot: number): { x: number; z: number } {
    const base = slot * ENTITY_STRIDE;
    return {
      x: this.data[base + O_TARGET_X],
      z: this.data[base + O_TARGET_Z],
    };
  }

  /** Read anim state for a slot */
  getAnimState(slot: number): number {
    return this.data[slot * ENTITY_STRIDE + O_ANIM_STATE];
  }

  /** Read frame index for a slot */
  getFrameIndex(slot: number): number {
    return this.data[slot * ENTITY_STRIDE + O_FRAME_INDEX];
  }

  /** Read facing right flag */
  isFacingRight(slot: number): boolean {
    return this.data[slot * ENTITY_STRIDE + O_FACING_RIGHT] === 1;
  }

  /** Read HP ratio */
  getHpRatio(slot: number): number {
    return this.data[slot * ENTITY_STRIDE + O_HP_RATIO];
  }

  /** Read alive flag */
  getIsAlive(slot: number): boolean {
    return this.data[slot * ENTITY_STRIDE + O_IS_ALIVE] === 1;
  }

  /** Read scale */
  getScale(slot: number): { x: number; y: number } {
    const base = slot * ENTITY_STRIDE;
    return {
      x: this.data[base + O_SCALE_X],
      y: this.data[base + O_SCALE_Y],
    };
  }

  /** Read tint color */
  getTint(slot: number): { r: number; g: number; b: number } {
    const base = slot * ENTITY_STRIDE;
    return {
      r: this.data[base + O_TINT_R],
      g: this.data[base + O_TINT_G],
      b: this.data[base + O_TINT_B],
    };
  }

  /** Clear all state (combat exit) */
  clear(): void {
    this.data.fill(0);
    this.hitFlashTimers.fill(0);
    this.deathTimers.fill(0);
    this.entitySlots.clear();
    this.typeIds.fill('');
    this.entityIds.fill('');
    this.entityNames.fill('');
    this.allyFlags.fill(false);
    this.flyingFlags.fill(false);
    this._count = 0;
  }
}
