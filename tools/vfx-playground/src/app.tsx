import { useCallback, useState } from 'react'
import type { VfxPreset } from './presets/preset-types'
import type { CharacterConfig } from './sprites/animated-character'
import { DEFAULT_TARGET, type EffectTargetState } from './scene/effect-target'
import { DEFAULT_BLOOM, type BloomState } from './ui/bloom-panel'
import { Layout } from './ui/layout'
import { type AppMode } from './ui/mode-tabs'
import { useKeyboardShortcuts } from './ui/use-keyboard-shortcuts'
import { KeyboardCheatsheet } from './ui/keyboard-cheatsheet'
import { loadOverrides } from './presets/preset-overrides-store'

/**
 * Deep-clone a preset so live tweaks don't mutate the original definition.
 * For particle presets, also merge any saved overrides from localStorage so
 * the panel reopens with last-tweaked values.
 */
function clonePreset(preset: VfxPreset): VfxPreset {
  const cloned = structuredClone(preset)
  if (cloned.kind !== 'meshline') {
    const saved = loadOverrides(cloned.id)
    cloned.props = { ...cloned.props, ...saved }
  }
  return cloned
}

export function App() {
  const [mode, setMode] = useState<AppMode>('effect')
  const [activePreset, setActivePreset] = useState<VfxPreset | null>(null)
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig | null>(null)
  const [target, setTarget] = useState<EffectTargetState>(DEFAULT_TARGET)
  const [bloom, setBloom] = useState<BloomState>(DEFAULT_BLOOM)
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)

  const handlePresetSelect = useCallback((preset: VfxPreset) => {
    setActivePreset(clonePreset(preset))
  }, [])

  useKeyboardShortcuts({
    mode,
    setMode,
    toggleCheatsheet: useCallback(() => setCheatsheetOpen(v => !v), []),
  })

  return (
    <>
      <Layout
        mode={mode}
        onModeChange={setMode}
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
      <KeyboardCheatsheet open={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />
    </>
  )
}
