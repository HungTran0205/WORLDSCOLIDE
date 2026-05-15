import { useRef, useState, useEffect } from 'react'
import type { SkillSequence, SequenceClip, TrackKind } from '../sequence-types'
import { TRACK_META, TRACK_ORDER, TRACK_KINDS } from '../track-registry'

interface Props {
  sequence: SkillSequence
  onChange: (next: SkillSequence) => void
  selectedClipId: string | null
  onSelectClip: (id: string | null) => void
  currentTime: number
  zoom?: number
  snapMs?: number | null
}

function patchClip(seq: SkillSequence, id: string, patch: Partial<SequenceClip>): SkillSequence {
  return { ...seq, clips: seq.clips.map(c => c.id === id ? { ...c, ...patch } : c) }
}

const snapValue = (v: number, snap: number | null | undefined, bypass: boolean): number => {
  if (!snap || bypass) return Math.round(v)
  return Math.round(v / snap) * snap
}

export function TimelineDaw({
  sequence, onChange, selectedClipId, onSelectClip, currentTime,
  zoom = 1, snapMs = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; track: TrackKind; atMs: number } | null>(null)

  // Delete selected clip on Backspace/Delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) return
        onChange({ ...sequence, clips: sequence.clips.filter(c => c.id !== selectedClipId) })
        onSelectClip(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedClipId, sequence, onChange, onSelectClip])

  const getMsPerPx = (): number => {
    const body = containerRef.current?.querySelector('.track-body') as HTMLElement | null
    if (!body) return 1
    const w = body.getBoundingClientRect().width
    return w > 0 ? sequence.duration / w : 1
  }

  const startDrag = (e: React.PointerEvent, clip: SequenceClip) => {
    e.preventDefault()
    e.stopPropagation()
    onSelectClip(clip.id)
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startMs = clip.start
    const msPerPx = getMsPerPx()

    const onMove = (mv: PointerEvent) => {
      const delta = (mv.clientX - startX) * msPerPx
      const raw = Math.max(0, Math.min(startMs + delta, sequence.duration - clip.duration))
      const newStart = snapValue(raw, snapMs, mv.altKey)
      onChange(patchClip(sequence, clip.id, { start: newStart }))
    }
    const onUp = () => { el.releasePointerCapture(e.pointerId); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (e: React.PointerEvent, clip: SequenceClip) => {
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startDur = clip.duration
    const msPerPx = getMsPerPx()

    const onMove = (mv: PointerEvent) => {
      const raw = Math.max(50, startDur + (mv.clientX - startX) * msPerPx)
      const newDur = Math.max(50, snapValue(raw, snapMs, mv.altKey))
      onChange(patchClip(sequence, clip.id, { duration: newDur }))
    }
    const onUp = () => { el.releasePointerCapture(e.pointerId); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleTrackRightClick = (e: React.MouseEvent, track: TrackKind) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const atMs = Math.round(((e.clientX - rect.left) / rect.width) * sequence.duration)
    setCtxMenu({ x: e.clientX, y: e.clientY, track, atMs })
  }

  const addClip = (track: TrackKind, atMs: number) => {
    const def = TRACK_KINDS[track][0]
    const start = snapValue(Math.max(0, Math.min(atMs, sequence.duration - 200)), snapMs, false)
    const newClip: SequenceClip = {
      id: crypto.randomUUID(),
      track,
      kind: def?.id ?? 'custom',
      start,
      duration: 300,
      label: def?.label ?? track,
    }
    onChange({ ...sequence, clips: [...sequence.clips, newClip] })
    onSelectClip(newClip.id)
    setCtxMenu(null)
  }

  // Ruler ticks: 5 evenly spaced labels (zoom-aware density would require more work,
  // KISS for now — the labels rescale visually because container width grows with zoom).
  const rulerMarks = Array.from({ length: 5 }, (_, i) => ({
    pct: (i / 4) * 100,
    label: `${((i / 4) * sequence.duration / 1000).toFixed(1)}s`,
  }))

  // Inner width scales with zoom — overflow-x scroll on container handles overflow.
  const innerWidthPct = 100 * zoom
  const gridStepPct = snapMs ? (snapMs / sequence.duration) * 100 * zoom : 0

  return (
    <div className="timeline-container scrollable" ref={containerRef} onClick={() => setCtxMenu(null)}>
      <div className="timeline-inner" style={{ width: `${innerWidthPct}%` }}>
        <div className="timeline-ruler">
          {rulerMarks.map(m => (
            <span key={m.pct} style={{ left: `${m.pct}%` }}>{m.label}</span>
          ))}
        </div>

        {TRACK_ORDER.map(trackKind => {
          const meta = TRACK_META[trackKind]
          const clips = sequence.clips.filter(c => c.track === trackKind)
          return (
            <div key={trackKind} className="track-row">
              <div className="track-header">
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </div>
              <div
                className="track-body"
                onContextMenu={e => handleTrackRightClick(e, trackKind)}
                style={snapMs ? {
                  backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent calc(${gridStepPct}% - 1px), rgba(255,255,255,0.04) calc(${gridStepPct}% - 1px), rgba(255,255,255,0.04) ${gridStepPct}%)`,
                } : undefined}
              >
                <div className="playhead" style={{ left: `${(currentTime / sequence.duration) * 100}%` }} />
                {clips.map(clip => (
                  <div
                    key={clip.id}
                    className={`timeline-clip${clip.id === selectedClipId ? ' selected' : ''}`}
                    style={{
                      left: `${(clip.start / sequence.duration) * 100}%`,
                      width: `${Math.max(0.5, (clip.duration / sequence.duration) * 100)}%`,
                      background: meta.color,
                    }}
                    onPointerDown={e => startDrag(e, clip)}
                  >
                    <span style={{ pointerEvents: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {clip.label}
                    </span>
                    <div className="clip-resize-handle" onPointerDown={e => startResize(e, clip)} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {ctxMenu && (
        <div className="context-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }} onClick={e => e.stopPropagation()}>
          <div className="context-menu-item" onClick={() => addClip(ctxMenu.track, ctxMenu.atMs)}>
            + Add {TRACK_META[ctxMenu.track].label} clip here
          </div>
          <div className="context-menu-item" onClick={() => setCtxMenu(null)}>Cancel</div>
        </div>
      )}
    </div>
  )
}
