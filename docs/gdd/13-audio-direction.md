# GDD 13 — Audio Direction

**Game:** 2000s A.C — After the Collapse (codename WORLDSCOLIDE)
**Status:** Living document — update when audio design decisions change.

---

## 1. Audio Design Intent

The audio layer must reinforce the Pixel-integrated Miniature Storybook Dark Fantasy visual identity.
Sound is atmospheric and narrative, not spectacle. Every audio cue should:

- Communicate context (safe / tense / transitioning).
- Reinforce spatial identity of each room.
- Never compete with UI readability or player focus.

**Global style:** Fantasy RPG, medieval-meets-mystical. Calm exploration to tense combat.
Instruments: orchestral, acoustic, synth pads. No vocals, no modern drums in BGM.

---

## 2. BGM Design

Three BGM contexts are currently defined (keys in `src/audio/audio-keys.ts`, Howler registration in `src/audio/audio-manager.ts`):

| Key | Context | Mood intent |
|-----|---------|-------------|
| `BGM_TITLE` (`bgm-title`) | Title / main menu screen | Atmospheric introduction; sets world tone |
| `BGM_GUILD` (`bgm-guild`) | Guild hall idle, post-combat default | Warm, welcoming, cozy — sense of home and safety |
| `BGM_COMBAT` (`bgm-combat`) | Active combat encounters | Tense, urgent, heroic undertone — escalating danger without hopelessness |

**Crossfade behavior:** `playBGM()` in `src/audio/audio-manager.ts` stops all BGM tracks before starting the new one; volume target is maintained as `musicVolumeTarget` for mid-fade correctness. A pending-stop timer system prevents silencing a track that was promoted back to active mid-fade.

**Format:** `.ogg` (Vorbis, quality 4) primary, `.m4a` (AAC 128 kbps) fallback. Files delivered to `public/audio/{key}.ogg + .m4a`. Normalization: loudnorm EBU R128. Default volume: 0.3.

**Loop requirement:** all BGM tracks must be seamless loops with no click or pop at the loop point.

**Reference feel targets:**
- Guild hall: Stardew Valley tavern, Octopath Traveler town themes.
- Combat: orchestral RPG battle — urgent but not chaotic.

---

## 3. SFX Design

SFX duration: 0.2–2.0 s. Clean fade-out, no abrupt cut. Volume range 0.4–0.7 default.

| Key | Sound event | Design note |
|-----|-------------|-------------|
| `SFX_CLICK` | UI interaction, button press | Lightweight, non-intrusive |
| `SFX_DISPATCH` | Mission dispatch, heavy confirmation | Weighty — marks a consequential player decision |
| `SFX_REWARD` | Reward / victory | Positive reinforcement, brief |
| `SFX_LEVELUP` | Member level-up | Celebratory, distinctive from reward |
| `SFX_HIT` | Combat hit landed | Impact clarity |
| `SFX_CRIT` | Critical hit | More impactful than hit; must read as "special" |
| `SFX_DODGE` | Dodge / evade | Light, quick — conveys avoidance |
| `SFX_DEATH` | Member death | Somber; not graphic |
| `SFX_SKILL` | Skill activation | Magical / distinctive — marks a special action |
| `SFX_RECRUIT` | New member recruited | Welcoming; milestone feel |

**Current aliases** (placeholder until dedicated CC0 assets sourced — see `src/audio/audio-keys.ts`):
- `SFX_VICTORY` → reuses `sfx-reward`
- `SFX_WIPE` → reuses `sfx-hit`
- Quest board diegetic SFX (`SFX_PAPER_UNROLL`, `SFX_PAPER_FLIP`, `SFX_WOOD_CLINK`) → alias to `sfx-click`
- `SFX_INK_STAMP`, `SFX_SEAL_BREAK` → alias to `sfx-dispatch`

When dedicated assets arrive, swap the value in `AUDIO` constant and register the `Howl` in `initAudio()`.

---

## 4. Room Audio Identity

Each room should have a distinct sonic character complementing its atmosphere preset (see `src/scene/atmospheric/atmosphere-presets.ts`):

| Room | BGM context | Sonic character intent |
|------|-------------|----------------------|
| Guild hall | `BGM_GUILD` | Warm hearth ambience, distant activity |
| Tavern | `BGM_GUILD` | Slightly livelier, social warmth |
| Workshop | `BGM_GUILD` | Subtle forge ambience — clank, bellows, ember crackle |
| Infirmary | `BGM_GUILD` | Hushed, ethereal — crystal resonance |
| Alchemy lab | `BGM_GUILD` | Mysterious bubbling, magical resonance |
| Logging site | `BGM_GUILD` | Outdoor — birdsong, wind, distant axe |
| Stone quarry | `BGM_GUILD` | Cave drips, torch flicker, deep resonance |
| Combat (any room) | `BGM_COMBAT` | Full transition — replaces guild BGM on combat start |

Room-specific ambient SFX layers are not yet implemented; the intent above is the design target.
<!-- TODO: verify ambient SFX layer implementation against src/audio/ when added -->

---

## 5. Audio Principles

1. **Silence is a tool.** Not every action needs audio feedback. Reserve SFX for meaningful events.
2. **Volume hierarchy:** BGM at 0.3 (background), SFX at 0.4–0.7 (foreground). BGM must never mask SFX.
3. **No audio clash:** BGM crossfade is managed; never let two BGM tracks play simultaneously.
4. **Pixel-art consistency:** SFX should lean slightly retro/organic (sfxr/bfxr for mechanical sounds, Stable Audio for organic). Avoid hyper-produced cinematic audio that clashes with the miniature diorama aesthetic.

---

## 6. Full Audio Catalog Reference

Complete asset list with prompt specs, Howler config, and file targets:
[`docs/reference/asset-list-audio.md`](../reference/asset-list-audio.md) — link only; do not duplicate here.

Audio implementation: `src/audio/audio-manager.ts`, `src/audio/audio-keys.ts`.
