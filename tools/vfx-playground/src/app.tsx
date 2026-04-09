import { useState } from 'react'
import type { VfxPreset } from './presets/preset-types'
import { Layout } from './ui/layout'

export function App() {
  const [activePreset, setActivePreset] = useState<VfxPreset | null>(null)

  return (
    <Layout
      activePreset={activePreset}
      onPresetChange={setActivePreset}
    />
  )
}
