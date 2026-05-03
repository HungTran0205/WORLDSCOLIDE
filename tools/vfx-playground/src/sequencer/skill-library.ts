import { useState, useCallback, useEffect } from 'react'
import type { SkillSequence, SkillLibrary } from './sequence-types'
import { SAMPLE_SKILLS } from './sample-skills'

const STORAGE_KEY = 'wc-skill-library'

function loadLibrary(): SkillLibrary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const lib = JSON.parse(raw) as SkillLibrary
      const existingIds = new Set(lib.skills.map(s => s.id))
      const newSamples = SAMPLE_SKILLS.filter(s => !existingIds.has(s.id))
      if (newSamples.length > 0) return { ...lib, skills: [...lib.skills, ...newSamples] }
      return lib
    }
  } catch { /* ignore */ }
  return { version: 1, skills: SAMPLE_SKILLS }
}

function saveLibrary(lib: SkillLibrary) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lib)) } catch { /* ignore */ }
}

export function useSkillLibrary() {
  const [library, setLibrary] = useState<SkillLibrary>(loadLibrary)
  const [activeId, setActiveId] = useState<string>(() => loadLibrary().skills[0]?.id ?? '')

  const activeSkill = library.skills.find(s => s.id === activeId) ?? null

  useEffect(() => saveLibrary(library), [library])

  const updateSkill = useCallback((next: SkillSequence) => {
    setLibrary(lib => ({ ...lib, skills: lib.skills.map(s => s.id === next.id ? next : s) }))
  }, [])

  const createSkill = useCallback(() => {
    const newSkill: SkillSequence = {
      id: crypto.randomUUID(), name: 'New Skill', duration: 1500, clips: [],
    }
    setLibrary(lib => ({ ...lib, skills: [...lib.skills, newSkill] }))
    setActiveId(newSkill.id)
  }, [])

  const duplicateSkill = useCallback((id: string) => {
    setLibrary(lib => {
      const src = lib.skills.find(s => s.id === id)
      if (!src) return lib
      const copy: SkillSequence = { ...structuredClone(src), id: crypto.randomUUID(), name: `${src.name} (copy)` }
      return { ...lib, skills: [...lib.skills, copy] }
    })
  }, [])

  const deleteSkill = useCallback((id: string) => {
    setLibrary(lib => {
      const next = lib.skills.filter(s => s.id !== id)
      if (activeId === id) setActiveId(next[0]?.id ?? '')
      return { ...lib, skills: next }
    })
  }, [activeId])

  const exportLibrary = useCallback(() => {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'wc-skills.json'; a.click()
    URL.revokeObjectURL(url)
  }, [library])

  const importLibrary = useCallback((file: File) => {
    file.text().then(text => {
      const parsed = JSON.parse(text) as SkillLibrary
      setLibrary(parsed)
      setActiveId(parsed.skills[0]?.id ?? '')
    }).catch(console.error)
  }, [])

  return { library, activeSkill, setActiveId, updateSkill, createSkill, duplicateSkill, deleteSkill, exportLibrary, importLibrary }
}
