import { allPresets } from '../presets/preset-registry'
import type { TrackKind } from './sequence-types'

export interface TrackMeta {
  kind: TrackKind
  label: string
  icon: string
  color: string
  description: string
}

export const TRACK_META: Record<TrackKind, TrackMeta> = {
  vfx:    { kind: 'vfx',    label: 'VFX',        icon: '✨', color: '#3a6ea8', description: 'Particle / meshline effect' },
  motion: { kind: 'motion', label: 'Motion',      icon: '🏃', color: '#6e4ea8', description: 'Target position path' },
  camera: { kind: 'camera', label: 'Camera',      icon: '📷', color: '#2a7a4a', description: 'Shake / zoom / pan' },
  time:   { kind: 'time',   label: 'Time Scale',  icon: '⏱️', color: '#8a5a2a', description: 'Hit-stop / slowmo' },
  flash:  { kind: 'flash',  label: 'Flash',       icon: '💥', color: '#8a2a2a', description: 'Screen flash overlay' },
  sfx:    { kind: 'sfx',    label: 'SFX',         icon: '🔊', color: '#2a6a6a', description: 'Sound effect trigger' },
  event:  { kind: 'event',  label: 'Event',       icon: '📡', color: '#5a5a2a', description: 'Game event (onHit, onComplete...)' },
}

export const TRACK_ORDER: TrackKind[] = ['vfx', 'motion', 'camera', 'time', 'flash', 'sfx', 'event']

export const TRACK_KINDS: Record<TrackKind, Array<{ id: string; label: string }>> = {
  vfx:    allPresets.map(p => ({ id: p.id, label: `${p.emoji} ${p.name}` })),
  motion: [
    { id: 'linear',   label: 'Linear' },
    { id: 'arc',      label: 'Arc' },
    { id: 'sine',     label: 'Sine wave' },
    { id: 'orbit',    label: 'Orbit' },
    { id: 'pingpong', label: 'Ping-pong' },
  ],
  camera: [
    { id: 'shake',    label: 'Camera Shake' },
    { id: 'zoom-in',  label: 'Zoom In' },
    { id: 'zoom-out', label: 'Zoom Out' },
  ],
  time:   [
    { id: 'hitstop', label: 'Hit-stop (freeze)' },
    { id: 'slowmo',  label: 'Slow-motion' },
  ],
  flash:  [{ id: 'flash',  label: 'Screen Flash' }],
  sfx:    [{ id: 'custom', label: 'Custom SFX' }],
  event:  [
    { id: 'onHit',      label: 'On Hit' },
    { id: 'onComplete', label: 'On Complete' },
    { id: 'custom',     label: 'Custom Event' },
  ],
}
