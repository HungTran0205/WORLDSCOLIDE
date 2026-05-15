import { useRef, useState, useCallback, useEffect } from 'react'
import { useVFXStore } from 'r3f-vfx'
import type { VFXParticlesProps } from 'r3f-vfx'
import type { SkillSequence, SequenceClip } from './sequence-types'
import { presetById } from '../presets/preset-registry'
import type { ParticlesPreset } from '../presets/preset-types'
import { splitPresetProps } from '../presets/preset-prop-classification'

export interface RuntimeState {
  time: number
  isPlaying: boolean
  liveClips: SequenceClip[]
  remountGen: number  // increments on scrub-back → forces meshline remount only
}

function computeLiveClips(time: number, clips: SequenceClip[]): SequenceClip[] {
  return clips.filter(c => time >= c.start && time < c.start + c.duration)
}

// Cap at 8 particles/frame — GPU budget for multiple concurrent systems.
function computeEmitCount(props: Partial<VFXParticlesProps>): number {
  const lt = props.lifetime as [number, number] | number | undefined
  const avg = Array.isArray(lt) ? (lt[0] + lt[1]) / 2 : typeof lt === 'number' ? lt : 1
  const max = (props.maxParticles as number | undefined) ?? 100
  return Math.min(8, Math.max(1, Math.ceil(max / (Math.max(0.01, avg) * 60))))
}

/** Collect particle preset ids that appear as VFX clips — for clear() on stop/scrub-back. */
function collectParticlePresetNames(seq: SkillSequence | null): string[] {
  if (!seq) return []
  const set = new Set<string>()
  for (const c of seq.clips) {
    if (c.track !== 'vfx') continue
    const p = presetById[c.kind]
    if (p && p.kind !== 'meshline') set.add(c.kind)
  }
  return [...set]
}

export function useSequenceRuntime(seq: SkillSequence | null) {
  const [state, setState] = useState<RuntimeState>({
    time: 0, isPlaying: false, liveClips: [], remountGen: 0,
  })

  const rafRef = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  const timeRef = useRef(0)
  const remountGenRef = useRef(0)
  const firedRef = useRef<Set<string>>(new Set())

  /**
   * Edge-trigger emit for particle clips: fire ONE burst when time crosses clip.start.
   * Uses programmatic `useVFXStore.getState().emit()` against the persistent
   * <AllPresetParticles> registered by name in coreStore.
   *
   * TODO(phase-7): position is currently sourced from clip.payload.position
   * fallback to [0,0,0]. Future: read EffectTarget worldPos via ref/prop.
   */
  const fireParticleClip = useCallback((clip: SequenceClip) => {
    const preset = presetById[clip.kind]
    if (!preset || preset.kind === 'meshline') return
    const particles = preset as ParticlesPreset
    const { overrides } = splitPresetProps(particles.props)
    const count = computeEmitCount(particles.props)
    const pos = (clip.payload?.position as [number, number, number] | undefined) ?? [0, 0, 0]
    useVFXStore.getState().emit(clip.kind, {
      x: pos[0], y: pos[1], z: pos[2],
      count,
      overrides: overrides as Record<string, unknown>,
    })
  }, [])

  /** Reset emission state — clear in-flight particles + edge-trigger memory. */
  const resetEmissionState = useCallback(() => {
    firedRef.current.clear()
    const names = collectParticlePresetNames(seq)
    const store = useVFXStore.getState()
    for (const name of names) store.clear(name)
  }, [seq])

  const tick = useCallback((timestamp: number) => {
    if (!seq) return
    const delta = timestamp - lastTsRef.current
    lastTsRef.current = timestamp
    timeRef.current = Math.min(timeRef.current + delta, seq.duration)

    // Edge-trigger: fire each particle clip once when time crosses its start.
    for (const clip of seq.clips) {
      if (clip.track !== 'vfx') continue
      if (firedRef.current.has(clip.id)) continue
      if (timeRef.current < clip.start) continue
      const preset = presetById[clip.kind]
      if (!preset || preset.kind === 'meshline') continue
      firedRef.current.add(clip.id)
      fireParticleClip(clip)
    }

    const liveClips = computeLiveClips(timeRef.current, seq.clips)
    setState(s => ({ ...s, time: timeRef.current, liveClips }))

    if (timeRef.current < seq.duration) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      setState(s => ({ ...s, isPlaying: false }))
    }
  }, [seq, fireParticleClip])

  const play = useCallback(() => {
    if (!seq) return
    lastTsRef.current = performance.now()
    setState(s => ({ ...s, isPlaying: true }))
    rafRef.current = requestAnimationFrame(tick)
  }, [seq, tick])

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setState(s => ({ ...s, isPlaying: false }))
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    timeRef.current = 0
    remountGenRef.current += 1
    resetEmissionState()
    setState({
      time: 0, isPlaying: false, liveClips: [],
      remountGen: remountGenRef.current,
    })
  }, [resetEmissionState])

  const scrub = useCallback((ms: number) => {
    if (!seq) return
    cancelAnimationFrame(rafRef.current)
    const goingBack = ms < timeRef.current
    timeRef.current = Math.max(0, Math.min(ms, seq.duration))
    if (goingBack) {
      remountGenRef.current += 1
      resetEmissionState()
      // Re-arm fired set: clips whose start is still ahead of new time can fire again.
      // (resetEmissionState already cleared firedRef.)
    }
    const liveClips = computeLiveClips(timeRef.current, seq.clips)
    setState(s => ({
      ...s,
      time: timeRef.current,
      isPlaying: false,
      liveClips,
      remountGen: remountGenRef.current,
    }))
  }, [seq, resetEmissionState])

  // Cancel RAF and reset when sequence changes
  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    timeRef.current = 0
    remountGenRef.current += 1
    firedRef.current.clear()
    setState({ time: 0, isPlaying: false, liveClips: [], remountGen: remountGenRef.current })
  }, [seq?.id])

  return { state, play, pause, stop, scrub }
}
