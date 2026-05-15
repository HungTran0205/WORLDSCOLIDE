import type { SkillSequence } from './sequence-types'
import { dongCoThatTramSkill } from './dong-co-that-tram'

const uid = () => crypto.randomUUID()

export function makeSampleHeavenSlash(): SkillSequence {
  return {
    id: 'sample-heaven-slash',
    name: 'Heaven Slash',
    description: 'Quick slash with impact shockwave',
    duration: 1200,
    clips: [
      { id: uid(), track: 'vfx',    kind: 'ml-slash-diagonal', start: 0,    duration: 300,  label: 'Slash arc' },
      { id: uid(), track: 'vfx',    kind: 'gen-hit',            start: 280,  duration: 400,  label: 'Impact burst' },
      { id: uid(), track: 'camera', kind: 'shake',              start: 280,  duration: 200,  label: 'Shake',      payload: { intensity: 0.3, freq: 30 } },
      { id: uid(), track: 'time',   kind: 'hitstop',            start: 280,  duration: 80,   label: 'Hit-stop',   payload: { factor: 0 } },
      { id: uid(), track: 'flash',  kind: 'flash',              start: 280,  duration: 120,  label: 'White flash', payload: { color: '#ffffff', alpha: 0.6 } },
      { id: uid(), track: 'event',  kind: 'onHit',              start: 280,  duration: 50,   label: 'On Hit' },
      { id: uid(), track: 'event',  kind: 'onComplete',         start: 1150, duration: 50,   label: 'On Complete' },
    ],
  }
}

export function makeSampleLevelUp(): SkillSequence {
  return {
    id: 'sample-levelup',
    name: 'Level Up',
    description: 'Celebratory particle burst with stardust',
    duration: 2000,
    clips: [
      { id: uid(), track: 'vfx',    kind: 'gen-levelup',  start: 0,    duration: 1500, label: 'Level-up glow' },
      { id: uid(), track: 'vfx',    kind: 'tl-stardust',  start: 200,  duration: 1200, label: 'Stardust' },
      { id: uid(), track: 'camera', kind: 'zoom-in',      start: 0,    duration: 300,  label: 'Zoom',       payload: { factor: 1.15 } },
      { id: uid(), track: 'flash',  kind: 'flash',        start: 100,  duration: 200,  label: 'Gold flash', payload: { color: '#ffdd88', alpha: 0.4 } },
      { id: uid(), track: 'event',  kind: 'onComplete',   start: 1900, duration: 50,   label: 'Done' },
    ],
  }
}

export function makeSampleHealPulse(): SkillSequence {
  return {
    id: 'sample-heal-pulse',
    name: 'Heal Pulse',
    description: 'Gentle healing aura with green motes',
    duration: 2500,
    clips: [
      { id: uid(), track: 'vfx',   kind: 'ls-heal',    start: 0,   duration: 2000, label: 'Heal motes' },
      { id: uid(), track: 'vfx',   kind: 'ls-smoke',   start: 200, duration: 1500, label: 'Earth smoke' },
      { id: uid(), track: 'event', kind: 'onHit',      start: 0,   duration: 50,   label: 'Apply heal' },
    ],
  }
}

export const SAMPLE_SKILLS = [
  makeSampleHeavenSlash(),
  makeSampleLevelUp(),
  makeSampleHealPulse(),
  dongCoThatTramSkill as unknown as SkillSequence,
]
