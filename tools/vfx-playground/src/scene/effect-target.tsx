import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import type { CharacterConfig } from '../sprites/animated-character'
import type { Direction } from '../sprites/sprite-types'

export type EffectTargetMode = 'world' | 'motion' | 'character'

export type MotionPathKind = 'linear' | 'arc' | 'sine' | 'orbit' | 'pingpong'

export interface MotionPathConfig {
  kind: MotionPathKind
  start: [number, number, number]
  end: [number, number, number]
  duration: number
  height: number
  amplitude: number
  loop: boolean
}

export type CharacterAnchor = 'center' | 'head' | 'hand' | 'feet'

export interface EffectTargetState {
  mode: EffectTargetMode
  worldPosition: [number, number, number]
  characterAnchor: CharacterAnchor
  motion: MotionPathConfig
}

export const DEFAULT_MOTION: MotionPathConfig = {
  kind: 'arc',
  start: [-3, 1, 0],
  end: [3, 1, 0],
  duration: 1.6,
  height: 1.5,
  amplitude: 0.5,
  loop: true,
}

export const DEFAULT_TARGET: EffectTargetState = {
  mode: 'world',
  worldPosition: [0, 1, 0],
  characterAnchor: 'center',
  motion: DEFAULT_MOTION,
}

interface Props {
  target: EffectTargetState
  character: CharacterConfig | null
  children: React.ReactNode
}

const _v = new THREE.Vector3()

function computeMotion(motion: MotionPathConfig, t: number): [number, number, number] {
  const dur = Math.max(0.05, motion.duration)
  let p: number
  if (motion.loop) {
    p = (t % dur) / dur
  } else {
    p = Math.min(1, t / dur)
  }
  const [sx, sy, sz] = motion.start
  const [ex, ey, ez] = motion.end
  switch (motion.kind) {
    case 'linear':
      return [sx + (ex - sx) * p, sy + (ey - sy) * p, sz + (ez - sz) * p]
    case 'arc': {
      const x = sx + (ex - sx) * p
      const z = sz + (ez - sz) * p
      const y = sy + (ey - sy) * p + Math.sin(p * Math.PI) * motion.height
      return [x, y, z]
    }
    case 'sine': {
      const x = sx + (ex - sx) * p
      const z = sz + (ez - sz) * p
      const y = sy + (ey - sy) * p + Math.sin(p * Math.PI * 4) * motion.amplitude
      return [x, y, z]
    }
    case 'orbit': {
      const cx = (sx + ex) / 2
      const cz = (sz + ez) / 2
      const r = Math.hypot((ex - sx) / 2, (ez - sz) / 2)
      const angle = p * Math.PI * 2
      return [cx + Math.cos(angle) * r, sy + (ey - sy) * p, cz + Math.sin(angle) * r]
    }
    case 'pingpong': {
      const pp = p < 0.5 ? p * 2 : (1 - p) * 2
      return [sx + (ex - sx) * pp, sy + (ey - sy) * pp, sz + (ez - sz) * pp]
    }
  }
}

/**
 * Anchor offsets relative to character center.
 * Direction-aware: hand offset flips based on facing direction.
 */
function getAnchorOffset(anchor: CharacterAnchor, direction: Direction | string): [number, number, number] {
  const facingRight = direction === 'east' || direction === 'north-east' || direction === 'south-east'
  const facingLeft = direction === 'west' || direction === 'north-west' || direction === 'south-west'
  const sideX = facingRight ? 0.6 : facingLeft ? -0.6 : 0
  const sideZ = direction === 'north' || direction === 'north-east' || direction === 'north-west' ? -0.4
    : direction === 'south' || direction === 'south-east' || direction === 'south-west' ? 0.4 : 0

  switch (anchor) {
    case 'head':
      return [0, 1.0, 0]
    case 'hand':
      return [sideX || 0.5, 0.2, sideZ || 0]
    case 'feet':
      return [0, -0.9, 0]
    case 'center':
    default:
      return [0, 0, 0]
  }
}

export function EffectTarget({ target, character, children }: Props) {
  const ref = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    if (target.mode === 'world') {
      ref.current.position.set(...target.worldPosition)
    } else if (target.mode === 'motion') {
      const [x, y, z] = computeMotion(target.motion, t)
      ref.current.position.set(x, y, z)
    } else if (target.mode === 'character' && character) {
      const offset = getAnchorOffset(target.characterAnchor, character.direction)
      ref.current.position.set(
        character.position[0] + offset[0],
        character.position[1] + offset[1],
        character.position[2] + offset[2],
      )
    } else {
      ref.current.position.set(0, 0, 0)
    }
  })

  return <group ref={ref}>{children}</group>
}

export type { CharacterConfig }
export { _v as _internalVec3 }
