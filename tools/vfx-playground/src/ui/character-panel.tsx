import { useEffect, useMemo, useState } from 'react'
import { loadSpriteManifest } from '../sprites/sprite-manifest'
import type { CharacterManifest } from '../sprites/sprite-types'
import type { CharacterConfig } from '../sprites/animated-character'
import { PanelSection } from './controls/panel-section'
import { Slider } from './controls/slider'
import { Vec3Input } from './controls/vec3-input'
import { Select } from './controls/select'
import { SkeletonRow } from './controls/skeleton-row'

interface Props {
  config: CharacterConfig | null
  onChange: (cfg: CharacterConfig | null) => void
  source?: 'characters' | 'enemies'
  label?: string
  defaultPosition?: [number, number, number]
}

const DEFAULT_POS: [number, number, number] = [0, 1, 0]
const DEFAULT_SCALE = 2.5
const DEFAULT_FPS = 10

export function CharacterPanel({
  config,
  onChange,
  source = 'characters',
  label = 'Character Sprite',
  defaultPosition,
}: Props) {
  const [characters, setCharacters] = useState<CharacterManifest[]>([])
  const [err, setErr] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState('')
  const [animation, setAnimation] = useState('')
  const [direction, setDirection] = useState<string>('south')
  const [pos, setPos] = useState<[number, number, number]>(defaultPosition ?? DEFAULT_POS)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [fps, setFps] = useState(DEFAULT_FPS)

  useEffect(() => {
    loadSpriteManifest()
      .then(m => setCharacters(m[source] ?? []))
      .catch(e => setErr(String(e)))
  }, [source])

  const current = useMemo(
    () => characters.find(c => c.id === selectedId),
    [characters, selectedId],
  )
  const availableAnims = current?.animations ?? []
  const currentAnim = availableAnims.find(a => a.name === animation)
  const availableDirs = currentAnim
    ? Object.keys(currentAnim.directions).filter(
        d => currentAnim.directions[d]?.length > 0,
      )
    : []

  useEffect(() => {
    if (!current) return
    if (!current.animations.find(a => a.name === animation)) {
      setAnimation(current.animations[0]?.name ?? '')
    }
  }, [selectedId])

  useEffect(() => {
    if (!currentAnim) return
    if (!availableDirs.includes(direction)) {
      setDirection(availableDirs[0] ?? 'south')
    }
  }, [animation, selectedId])

  useEffect(() => {
    if (!current || !currentAnim) {
      onChange(null)
      return
    }
    const frames = currentAnim.directions[direction]
    if (!frames || frames.length === 0) {
      onChange(null)
      return
    }
    onChange({
      characterId: current.id,
      animation: currentAnim.name,
      direction,
      position: pos,
      scale,
      fps,
      frames,
    })
  }, [selectedId, animation, direction, pos[0], pos[1], pos[2], scale, fps])

  const charOptions = [
    { value: '', label: '— none —' },
    ...characters.map(c => ({ value: c.id, label: c.id })),
  ]
  const animOptions = availableAnims.map(a => ({ value: a.name, label: a.name }))
  const dirOptions = availableDirs.map(d => ({ value: d, label: d }))

  return (
    <PanelSection title={label} icon={source === 'enemies' ? '👾' : '🧍'}>
      {err && <div className="panel-section-error">{err}</div>}

      {!err && characters.length === 0 ? (
        <>
          <SkeletonRow />
          <SkeletonRow width="80%" />
          <SkeletonRow width="60%" />
        </>
      ) : (
        <div className="field-row">
          <span className="field-label">Character</span>
          <Select value={selectedId} onChange={v => setSelectedId(String(v))} options={charOptions} />
        </div>
      )}

      {current && (
        <>
          <div className="field-row">
            <span className="field-label">Animation</span>
            <Select value={animation} onChange={v => setAnimation(String(v))} options={animOptions} />
          </div>
          <div className="field-row">
            <span className="field-label">Direction</span>
            <Select value={direction} onChange={v => setDirection(String(v))} options={dirOptions} />
          </div>
          <Vec3Input
            label="Position"
            value={pos}
            onChange={setPos}
            step={0.1}
          />
          <Slider
            label="Scale"
            value={scale}
            onChange={setScale}
            min={0.5} max={10} step={0.1}
          />
          <Slider
            label="FPS"
            value={fps}
            onChange={v => setFps(Math.round(v))}
            min={1} max={30} step={1} precision={0}
          />
          <div className="character-status">
            {config ? (
              <span className="ok">▶ {config.frames.length} frames · {config.direction}</span>
            ) : (
              <span className="warn">no frames available</span>
            )}
          </div>
        </>
      )}
    </PanelSection>
  )
}
