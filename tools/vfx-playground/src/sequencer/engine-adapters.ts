import { createContext } from 'react'
import type * as THREE from 'three'

/**
 * Contract between generated skill components and the game engine.
 * Copy this file into your game project and implement each method.
 */
export interface SkillEngineAdapter {
  playSfx(kind: string, payload?: Record<string, unknown>): void
  triggerCameraShake(params: { intensity: number; freq: number; duration: number }): void
  triggerHitStop(durationMs: number): void
  triggerSlowmo(factor: number, durationMs: number): void
  spawnDamageNumber(at: THREE.Vector3, value: number, color: string): void
  flashScreen(color: string, alpha: number, durationMs: number): void
}

export const SkillEngineCtx = createContext<SkillEngineAdapter | null>(null)

/** No-op adapter — safe default for playground / testing. */
export const NoopEngineAdapter: SkillEngineAdapter = {
  playSfx: () => {},
  triggerCameraShake: () => {},
  triggerHitStop: () => {},
  triggerSlowmo: () => {},
  spawnDamageNumber: () => {},
  flashScreen: () => {},
}
