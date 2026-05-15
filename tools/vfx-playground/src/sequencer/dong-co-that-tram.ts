// Ultimate Skill: "Đồng Cổ Thất Trảm" (Seven Strikes of the Bronze Drum)
// Faction: Linh Sơn
// Total duration: 4500ms
//
// CONCEPT
//   Caster strikes the ground 7 times. Each strike pulses the bronze-drum
//   sigil drawn beneath them, kicks up earth particles, dims bloom threshold
//   so the sigil glows brighter, shakes the camera, and spawns a damage tick.
//   Cadence accelerates (600 → 250ms gap). The 7th strike unleashes a linear
//   flame wave that travels forward from the caster.
//
// USAGE
//   1. Open tools/skill-sequencer/index.html
//   2. Click "📋 Show export code", paste the JSON below into:
//      window.__skill = <this object> ; localStorage.setItem('seq', JSON.stringify(window.__skill))
//      OR replace makeSampleSkill() return value in sequencer-core.jsx with this.
//   3. Click "⬇ Download .tsx" to get DongCoThatTram.tsx
//
// NEW PRESETS REQUIRED (add to vfx-playground/src/presets/linh-son-presets.ts):
//   - 'ls-bronze-drum-mark'  meshline circle, large, on-ground, gold gradient
//   - 'ls-drum-pulse'        small particle burst rising from drum center
//   - 'ls-flame-wave'        linear meshline + fire particles, moves forward
//
// NEW TRACK KIND REQUIRED (add to sequencer track-registry):
//   - 'bloom' track  with kind 'threshold-dip' { from: number; to: number }

export const dongCoThatTramSkill = {
  id: 'ls-ult-dong-co-that-tram',
  name: 'DongCoThatTram',
  description: 'Linh Sơn ultimate — 7 accelerating drum strikes culminating in a forward flame wave',
  duration: 4500,
  clips: [
    // ── PHASE 0 — CAST: bronze drum mark draws on ground (0 → 800ms) ──────
    { id: 'mark',     track: 'vfx',    kind: 'ls-bronze-drum-mark', start: 0,    duration: 4500, label: 'Bronze drum sigil' },
    { id: 'cast-sfx', track: 'sfx',    kind: 'magic-cast',          start: 0,    duration: 800,  label: 'Cast incantation' },
    { id: 'cast-glow',track: 'flash',  kind: 'gold',                start: 600,  duration: 200,  label: 'Cast flash', payload: { alpha: 0.4 } },

    // Strike 1 (t=800ms, weakest)
    { id: 's1-slam',   track: 'motion', kind: 'recoil',           start: 800,  duration: 100, label: 'Slam 1' },
    { id: 's1-sfx',    track: 'sfx',    kind: 'impact-heavy',     start: 800,  duration: 250, label: 'Drum 1', payload: { volume: 0.6, pitch: 0.85 } },
    { id: 's1-pulse',  track: 'vfx',    kind: 'ls-drum-pulse',    start: 800,  duration: 500, label: 'Drum pulse 1' },
    { id: 's1-shake',  track: 'camera', kind: 'shake',            start: 800,  duration: 150, label: 'Shake 1', payload: { intensity: 0.2, freq: 25 } },
    { id: 's1-stop',   track: 'time',   kind: 'hitstop',          start: 800,  duration: 30,  label: 'Hit-stop 1' },
    { id: 's1-flash',  track: 'flash',  kind: 'gold',             start: 800,  duration: 80,  label: 'Sigil flash 1', payload: { alpha: 0.3 } },
    { id: 's1-bloom',  track: 'event',  kind: 'callback',         start: 800,  duration: 200, label: 'Bloom dip 1', payload: { name: 'bloomDip', threshold: 0.7, duration: 200 } },
    { id: 's1-dmg',    track: 'event',  kind: 'damage',           start: 820,  duration: 1,   label: 'Damage tick 1', payload: { multiplier: 0.4 } },

    // Strike 2 (t=1400ms)
    { id: 's2-slam',   track: 'motion', kind: 'recoil',           start: 1400, duration: 100, label: 'Slam 2' },
    { id: 's2-sfx',    track: 'sfx',    kind: 'impact-heavy',     start: 1400, duration: 250, label: 'Drum 2', payload: { volume: 0.7, pitch: 0.9 } },
    { id: 's2-pulse',  track: 'vfx',    kind: 'ls-drum-pulse',    start: 1400, duration: 500, label: 'Drum pulse 2' },
    { id: 's2-shake',  track: 'camera', kind: 'shake',            start: 1400, duration: 180, label: 'Shake 2', payload: { intensity: 0.3, freq: 28 } },
    { id: 's2-stop',   track: 'time',   kind: 'hitstop',          start: 1400, duration: 40,  label: 'Hit-stop 2' },
    { id: 's2-flash',  track: 'flash',  kind: 'gold',             start: 1400, duration: 90,  label: 'Sigil flash 2', payload: { alpha: 0.4 } },
    { id: 's2-bloom',  track: 'event',  kind: 'callback',         start: 1400, duration: 200, label: 'Bloom dip 2', payload: { name: 'bloomDip', threshold: 0.6, duration: 200 } },
    { id: 's2-dmg',    track: 'event',  kind: 'damage',           start: 1420, duration: 1,   label: 'Damage tick 2', payload: { multiplier: 0.5 } },

    // Strike 3 (t=1900ms)
    { id: 's3-slam',   track: 'motion', kind: 'recoil',           start: 1900, duration: 100, label: 'Slam 3' },
    { id: 's3-sfx',    track: 'sfx',    kind: 'impact-heavy',     start: 1900, duration: 250, label: 'Drum 3', payload: { volume: 0.8, pitch: 0.95 } },
    { id: 's3-pulse',  track: 'vfx',    kind: 'ls-drum-pulse',    start: 1900, duration: 500, label: 'Drum pulse 3' },
    { id: 's3-shake',  track: 'camera', kind: 'shake',            start: 1900, duration: 200, label: 'Shake 3', payload: { intensity: 0.4, freq: 30 } },
    { id: 's3-stop',   track: 'time',   kind: 'hitstop',          start: 1900, duration: 50,  label: 'Hit-stop 3' },
    { id: 's3-flash',  track: 'flash',  kind: 'gold',             start: 1900, duration: 100, label: 'Sigil flash 3', payload: { alpha: 0.5 } },
    { id: 's3-bloom',  track: 'event',  kind: 'callback',         start: 1900, duration: 200, label: 'Bloom dip 3', payload: { name: 'bloomDip', threshold: 0.5, duration: 200 } },
    { id: 's3-dmg',    track: 'event',  kind: 'damage',           start: 1920, duration: 1,   label: 'Damage tick 3', payload: { multiplier: 0.6 } },

    // Strike 4 (t=2300ms)
    { id: 's4-slam',   track: 'motion', kind: 'recoil',           start: 2300, duration: 100, label: 'Slam 4' },
    { id: 's4-sfx',    track: 'sfx',    kind: 'impact-heavy',     start: 2300, duration: 220, label: 'Drum 4', payload: { volume: 0.85, pitch: 1.0 } },
    { id: 's4-pulse',  track: 'vfx',    kind: 'ls-drum-pulse',    start: 2300, duration: 450, label: 'Drum pulse 4' },
    { id: 's4-shake',  track: 'camera', kind: 'shake',            start: 2300, duration: 200, label: 'Shake 4', payload: { intensity: 0.5, freq: 32 } },
    { id: 's4-stop',   track: 'time',   kind: 'hitstop',          start: 2300, duration: 60,  label: 'Hit-stop 4' },
    { id: 's4-flash',  track: 'flash',  kind: 'gold',             start: 2300, duration: 100, label: 'Sigil flash 4', payload: { alpha: 0.55 } },
    { id: 's4-bloom',  track: 'event',  kind: 'callback',         start: 2300, duration: 200, label: 'Bloom dip 4', payload: { name: 'bloomDip', threshold: 0.4, duration: 200 } },
    { id: 's4-dmg',    track: 'event',  kind: 'damage',           start: 2320, duration: 1,   label: 'Damage tick 4', payload: { multiplier: 0.7 } },

    // Strike 5 (t=2650ms)
    { id: 's5-slam',   track: 'motion', kind: 'recoil',           start: 2650, duration: 80,  label: 'Slam 5' },
    { id: 's5-sfx',    track: 'sfx',    kind: 'impact-heavy',     start: 2650, duration: 200, label: 'Drum 5', payload: { volume: 0.9, pitch: 1.05 } },
    { id: 's5-pulse',  track: 'vfx',    kind: 'ls-drum-pulse',    start: 2650, duration: 400, label: 'Drum pulse 5' },
    { id: 's5-shake',  track: 'camera', kind: 'shake',            start: 2650, duration: 220, label: 'Shake 5', payload: { intensity: 0.6, freq: 34 } },
    { id: 's5-stop',   track: 'time',   kind: 'hitstop',          start: 2650, duration: 70,  label: 'Hit-stop 5' },
    { id: 's5-flash',  track: 'flash',  kind: 'gold',             start: 2650, duration: 100, label: 'Sigil flash 5', payload: { alpha: 0.6 } },
    { id: 's5-bloom',  track: 'event',  kind: 'callback',         start: 2650, duration: 180, label: 'Bloom dip 5', payload: { name: 'bloomDip', threshold: 0.3, duration: 180 } },
    { id: 's5-dmg',    track: 'event',  kind: 'damage',           start: 2670, duration: 1,   label: 'Damage tick 5', payload: { multiplier: 0.8 } },

    // Strike 6 (t=2950ms — second-to-last, very dense)
    { id: 's6-slam',   track: 'motion', kind: 'recoil',           start: 2950, duration: 80,  label: 'Slam 6' },
    { id: 's6-sfx',    track: 'sfx',    kind: 'impact-heavy',     start: 2950, duration: 200, label: 'Drum 6', payload: { volume: 0.95, pitch: 1.1 } },
    { id: 's6-pulse',  track: 'vfx',    kind: 'ls-drum-pulse',    start: 2950, duration: 400, label: 'Drum pulse 6' },
    { id: 's6-shake',  track: 'camera', kind: 'shake',            start: 2950, duration: 250, label: 'Shake 6', payload: { intensity: 0.75, freq: 36 } },
    { id: 's6-stop',   track: 'time',   kind: 'hitstop',          start: 2950, duration: 90,  label: 'Hit-stop 6' },
    { id: 's6-flash',  track: 'flash',  kind: 'gold',             start: 2950, duration: 110, label: 'Sigil flash 6', payload: { alpha: 0.7 } },
    { id: 's6-bloom',  track: 'event',  kind: 'callback',         start: 2950, duration: 180, label: 'Bloom dip 6', payload: { name: 'bloomDip', threshold: 0.2, duration: 180 } },
    { id: 's6-dmg',    track: 'event',  kind: 'damage',           start: 2970, duration: 1,   label: 'Damage tick 6', payload: { multiplier: 0.9 } },

    // ── STRIKE 7 — CLIMAX (t=3200ms): flame wave forward ─────────────────
    { id: 's7-slam',   track: 'motion', kind: 'recoil',           start: 3200, duration: 150, label: 'Final slam' },
    { id: 's7-sfx',    track: 'sfx',    kind: 'impact-heavy',     start: 3200, duration: 400, label: 'Drum 7 — biggest', payload: { volume: 1.0, pitch: 0.7 } },
    { id: 's7-pulse',  track: 'vfx',    kind: 'gen-burst',        start: 3200, duration: 800, label: 'Mega burst from sigil' },
    { id: 's7-shake',  track: 'camera', kind: 'shake',            start: 3200, duration: 600, label: 'Massive shake', payload: { intensity: 1.0, freq: 38 } },
    { id: 's7-zoom',   track: 'camera', kind: 'zoom-in',          start: 3200, duration: 300, label: 'Climax zoom', payload: { factor: 1.3 } },
    { id: 's7-stop',   track: 'time',   kind: 'hitstop',          start: 3200, duration: 150, label: 'Hit-stop final' },
    { id: 's7-slowmo', track: 'time',   kind: 'slowmo',           start: 3350, duration: 500, label: 'Slowmo trail', payload: { factor: 0.4 } },
    { id: 's7-flash',  track: 'flash',  kind: 'white',            start: 3200, duration: 150, label: 'White flash final', payload: { alpha: 0.9 } },
    { id: 's7-flash2', track: 'flash',  kind: 'gold',             start: 3350, duration: 200, label: 'Gold afterglow', payload: { alpha: 0.5 } },
    { id: 's7-bloom',  track: 'event',  kind: 'callback',         start: 3200, duration: 800, label: 'Sigil max glow', payload: { name: 'bloomDip', threshold: 0.0, duration: 800 } },

    // Flame wave — linear travel forward from caster
    { id: 'wave-line', track: 'vfx',    kind: 'ls-flame-wave',    start: 3300, duration: 900, label: 'Flame wave (linear)' },
    { id: 'wave-fire', track: 'vfx',    kind: 'ls-fire',          start: 3300, duration: 900, label: 'Flame wave fire particles' },
    { id: 'wave-sfx',  track: 'sfx',    kind: 'whoosh',           start: 3300, duration: 600, label: 'Wave whoosh', payload: { volume: 1.0 } },
    { id: 'wave-dmg',  track: 'event',  kind: 'damage',           start: 3400, duration: 1,   label: 'Wave damage (huge)', payload: { multiplier: 4.0, aoe: 'cone-forward' } },
    { id: 'wave-num',  track: 'event',  kind: 'spawn-number',     start: 3420, duration: 1,   label: 'Final damage number', payload: { color: '#ff6600', big: true } },

    // Cooldown — sigil fades, recoil pose hold
    { id: 'cooldown',  track: 'motion', kind: 'recoil',           start: 4200, duration: 300, label: 'Recover stance' },
  ],
} as const
