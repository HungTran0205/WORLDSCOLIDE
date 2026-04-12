import type { SpriteManifest } from './sprite-types'

let cached: Promise<SpriteManifest> | null = null

export function loadSpriteManifest(): Promise<SpriteManifest> {
  if (!cached) {
    cached = fetch('/api/sprite-manifest').then(r => {
      if (!r.ok) throw new Error(`sprite-manifest fetch failed: ${r.status}`)
      return r.json() as Promise<SpriteManifest>
    })
  }
  return cached
}
