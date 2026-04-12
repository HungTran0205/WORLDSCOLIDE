import { useEffect, useMemo, useState } from 'react'
import { loadSpriteManifest } from '../sprites/sprite-manifest'
import type { CharacterManifest } from '../sprites/sprite-types'
import type { CharacterConfig } from '../sprites/animated-character'

interface Props {
  config: CharacterConfig | null
  onChange: (cfg: CharacterConfig | null) => void
}

const DEFAULT_POS: [number, number, number] = [0, 1, 0]
const DEFAULT_SCALE = 2.5
const DEFAULT_FPS = 10

export function CharacterPanel({ config, onChange }: Props) {
  const [open, setOpen] = useState(true)
  const [characters, setCharacters] = useState<CharacterManifest[]>([])
  const [err, setErr] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState('')
  const [animation, setAnimation] = useState('')
  const [direction, setDirection] = useState<string>('south')
  const [pos, setPos] = useState<[number, number, number]>(DEFAULT_POS)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [fps, setFps] = useState(DEFAULT_FPS)

  useEffect(() => {
    loadSpriteManifest()
      .then(m => setCharacters(m.characters))
      .catch(e => setErr(String(e)))
  }, [])

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

  // When character changes, reset animation to first valid
  useEffect(() => {
    if (!current) return
    if (!current.animations.find(a => a.name === animation)) {
      setAnimation(current.animations[0]?.name ?? '')
    }
  }, [selectedId])

  // When animation changes, ensure direction is valid
  useEffect(() => {
    if (!currentAnim) return
    if (!availableDirs.includes(direction)) {
      setDirection(availableDirs[0] ?? 'south')
    }
  }, [animation, selectedId])

  // Emit config whenever anything changes
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

  const updatePos = (axis: 0 | 1 | 2, value: number) => {
    setPos(prev => {
      const next = [...prev] as [number, number, number]
      next[axis] = value
      return next
    })
  }

  return (
    <div className="character-panel">
      <div
        className={`panel-header ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>🧍</span>
        <span>Character Sprite</span>
        <span className="arrow">▶</span>
      </div>
      {open && (
        <div className="panel-body">
          {err && <div className="panel-err">{err}</div>}

          <label className="field">
            <span>Character</span>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">— none —</option>
              {characters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>
          </label>

          {current && (
            <>
              <label className="field">
                <span>Animation</span>
                <select
                  value={animation}
                  onChange={e => setAnimation(e.target.value)}
                >
                  {availableAnims.map(a => (
                    <option key={a.name} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Direction</span>
                <select
                  value={direction}
                  onChange={e => setDirection(e.target.value)}
                >
                  {availableDirs.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field vec3">
                <span>Position (x, y, z)</span>
                <div className="vec3-inputs">
                  {([0, 1, 2] as const).map(i => (
                    <input
                      key={i}
                      type="number"
                      step={0.1}
                      value={pos[i]}
                      onChange={e =>
                        updatePos(i, parseFloat(e.target.value) || 0)
                      }
                    />
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Scale: {scale.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={scale}
                  onChange={e => setScale(parseFloat(e.target.value))}
                />
              </label>

              <label className="field">
                <span>FPS: {fps}</span>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={fps}
                  onChange={e => setFps(parseInt(e.target.value))}
                />
              </label>

              <div className="status">
                {config ? (
                  <span className="ok">
                    ▶ {config.frames.length} frames · {config.direction}
                  </span>
                ) : (
                  <span className="warn">no frames available</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
