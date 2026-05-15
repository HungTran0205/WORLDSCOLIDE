import type { VFXParticlesProps } from 'r3f-vfx'

/**
 * Per-preset override persistence to localStorage.
 *
 * Storage key: `vfx-playground:override:{presetId}` → JSON of tweaked fields.
 * On boot, <AllPresetParticles> merges saved bake-keys into mounted props,
 * and App merges saved override-keys into activePreset on select.
 *
 * Structural changes (maxParticles, geometry) only take effect on next
 * page reload — the persistent <VFXParticles> system is mounted once.
 */

const KEY_PREFIX = 'vfx-playground:override:'

export type PresetOverrides = Partial<VFXParticlesProps>

export function loadOverrides(presetId: string): PresetOverrides {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + presetId)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function loadAllOverrides(): Record<string, PresetOverrides> {
  const out: Record<string, PresetOverrides> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(KEY_PREFIX)) continue
      const id = k.slice(KEY_PREFIX.length)
      out[id] = loadOverrides(id)
    }
  } catch {
    // ignore
  }
  return out
}

const writeTimers = new Map<string, ReturnType<typeof setTimeout>>()

/** Debounced (500ms) write to localStorage. */
export function saveOverrides(presetId: string, overrides: PresetOverrides): void {
  const existing = writeTimers.get(presetId)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    try {
      // Drop undefined keys, drop empty result.
      const clean: PresetOverrides = {}
      for (const [k, v] of Object.entries(overrides)) {
        if (v !== undefined) (clean as Record<string, unknown>)[k] = v
      }
      if (Object.keys(clean).length === 0) {
        localStorage.removeItem(KEY_PREFIX + presetId)
      } else {
        localStorage.setItem(KEY_PREFIX + presetId, JSON.stringify(clean))
      }
    } catch {
      // quota / privacy mode — silent
    }
    writeTimers.delete(presetId)
  }, 500)
  writeTimers.set(presetId, timer)
}

export function clearOverrides(presetId: string): void {
  const t = writeTimers.get(presetId)
  if (t) { clearTimeout(t); writeTimers.delete(presetId) }
  try { localStorage.removeItem(KEY_PREFIX + presetId) } catch { /* ignore */ }
}

export function clearAllOverrides(): void {
  for (const t of writeTimers.values()) clearTimeout(t)
  writeTimers.clear()
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(KEY_PREFIX)) keys.push(k)
    }
    for (const k of keys) localStorage.removeItem(k)
  } catch { /* ignore */ }
}

/** Compute diff between current props and registry defaults, for save. */
export function diffFromDefaults(
  current: PresetOverrides,
  defaults: PresetOverrides,
): PresetOverrides {
  const out: PresetOverrides = {}
  for (const [k, v] of Object.entries(current)) {
    const defVal = (defaults as Record<string, unknown>)[k]
    if (JSON.stringify(v) !== JSON.stringify(defVal)) {
      ;(out as Record<string, unknown>)[k] = v
    }
  }
  return out
}
