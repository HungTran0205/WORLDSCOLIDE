export type TrackKind = 'vfx' | 'motion' | 'camera' | 'time' | 'flash' | 'sfx' | 'event'

export interface SequenceClip {
  id: string
  track: TrackKind
  kind: string        // vfx: preset.id | camera: 'shake'|'zoom-in'|'zoom-out' | etc.
  start: number       // ms
  duration: number    // ms
  label: string
  payload?: Record<string, unknown>
}

export interface SkillSequence {
  id: string
  name: string
  description?: string
  duration: number    // ms — total timeline length
  clips: SequenceClip[]
}

export interface SkillLibrary {
  version: 1
  skills: SkillSequence[]
}
