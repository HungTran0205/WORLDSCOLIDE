import { useCallback, useState } from 'react'
import type { VfxPreset } from './presets/preset-types'
import type { CharacterConfig } from './sprites/animated-character'
import { DEFAULT_TARGET, type EffectTargetState } from './scene/effect-target'
import { DEFAULT_BLOOM, type BloomState } from './ui/bloom-panel'
import { Layout } from './ui/layout'

/**
 * Deep-clone a preset so live tweaks don't mutate the original definition.
 * Structured-clone covers nested arrays/objects in shapeParams + props.
 */
function clonePreset(preset: VfxPreset): VfxPreset {
  return structuredClone(preset)
}

export function App() {
  const [activePreset, setActivePreset] = useState<VfxPreset | null>(null)
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig | null>(null)
  const [target, setTarget] = useState<EffectTargetState>(DEFAULT_TARGET)
  const [bloom, setBloom] = useState<BloomState>(DEFAULT_BLOOM)

  // Selecting from sidebar = fresh editable clone
  const handlePresetSelect = useCallback((preset: VfxPreset) => {
    setActivePreset(clonePreset(preset))
  }, [])

  return (
    <Layout
      activePreset={activePreset}
      onPresetChange={handlePresetSelect}
      onPresetUpdate={setActivePreset}
      characterConfig={characterConfig}
      onCharacterChange={setCharacterConfig}
      target={target}
      onTargetChange={setTarget}
      bloom={bloom}
      onBloomChange={setBloom}
    />
  )
}
