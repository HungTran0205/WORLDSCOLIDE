# Asset List — Audio

> JSON prompts for AI audio generation. All audio targets Howler.js playback.
> Generated: 2026-03-21

## Global Audio Style Guide

```json
{
  "globalStyle": {
    "genre": "fantasy RPG, medieval-meets-mystical",
    "mood_range": "calm exploration to tense combat",
    "format_primary": ".ogg (Vorbis, quality 4)",
    "format_fallback": ".m4a (AAC, 128kbps)",
    "normalization": "loudnorm (EBU R128)",
    "sampleRate": 44100,
    "channels": "stereo",
    "delivery": "public/audio/{key}.ogg + public/audio/{key}.m4a"
  },
  "bgmStyle": {
    "duration": "60-120 seconds",
    "looping": "seamless loop (no click/pop at loop point, crossfade tail)",
    "maxFileSize": "2MB per format",
    "volume_default": 0.3,
    "instruments_allowed": "orchestral, acoustic, synth pads (no vocals, no modern drums)"
  },
  "sfxStyle": {
    "duration": "0.2-2.0 seconds",
    "maxFileSize": "500KB per format",
    "tail": "clean fade-out, no abrupt cut",
    "volume_range": "0.4-0.7 default",
    "generation_tool": "sfxr/bfxr for retro SFX, Stable Audio for organic SFX"
  }
}
```

---

## 1. Background Music (2 tracks)

### BGM-Guild — Guild Hall Theme

```json
{
  "id": "bgm-guild",
  "type": "BGM",
  "file": "bgm-guild.ogg / bgm-guild.m4a",
  "howlerConfig": { "loop": true, "volume": 0.3 },
  "playContext": "Main guild hall screen, default BGM after character creation, resumes after combat ends",
  "codeRef": "src/ui/panels/char-creation.tsx:53 — playBGM(AUDIO.BGM_GUILD)",

  "prompt": {
    "style": "medieval fantasy ambient, HD-2D RPG idle game",
    "mood": "warm, welcoming, cozy, sense of home and safety, gentle optimism",
    "tempo": "slow to moderate (70-90 BPM)",
    "key": "C major or G major (bright, warm tonality)",
    "duration": "90 seconds, seamless loop",

    "instruments": {
      "lead": "acoustic lute or harp — gentle arpeggiated melody, simple 4-bar motif repeating with variation",
      "harmony": "soft string ensemble pad (viola + cello), sustained chords, low dynamics",
      "texture": "wooden flute countermelody entering at bar 8, weaving around lute",
      "bass": "gentle pizzicato cello on root notes, quarter-note pulse",
      "ambience": "crackling fireplace (subtle, mixed very low), distant birdsong (2-3 calls, sparse)"
    },

    "structure": {
      "intro": "0-8s: harp arpeggio alone, establishing key",
      "A_section": "8-32s: lute melody enters with string pad, warm and inviting",
      "B_section": "32-56s: flute takes melody, lute switches to accompaniment, slightly more movement",
      "A_return": "56-80s: lute melody returns, all instruments together, fuller arrangement",
      "outro_loop": "80-90s: gradual thin out to match intro texture for seamless loop back to 0s"
    },

    "reference_feel": "Stardew Valley tavern music, Octopath Traveler town themes, Guild Wars inn music",
    "avoid": "percussion, drums, electric instruments, vocals, dark/minor key passages, sudden dynamics"
  }
}
```

### BGM-Combat — Combat Encounter Theme

```json
{
  "id": "bgm-combat",
  "type": "BGM",
  "file": "bgm-combat.ogg / bgm-combat.m4a",
  "howlerConfig": { "loop": true, "volume": 0.3 },
  "playContext": "During active combat encounters, replaces bgm-guild when combat starts, switches back on combat end",
  "codeRef": "phase-06 plan — BGM switch on combat-start/combat-complete events",

  "prompt": {
    "style": "fantasy RPG battle music, orchestral action",
    "mood": "tense, urgent, heroic undertone, escalating danger but not hopeless",
    "tempo": "moderate-fast (120-140 BPM)",
    "key": "D minor or A minor (tense but driving)",
    "duration": "75 seconds, seamless loop",

    "instruments": {
      "lead": "aggressive string section (violin staccato runs + cello ostinato), driving rhythmic pattern",
      "harmony": "brass stabs on accents (horn + trumpet, short forte bursts on beats 1 and 3)",
      "percussion": "taiko-style drum pattern (big booms on downbeat), snare rolls on transitions, tambourine eighth-notes for momentum",
      "bass": "deep cello + contrabass on root, octave drops on key hits",
      "texture": "choir pad (ah vowel, no words, very low in mix) on sustained chords during B section"
    },

    "structure": {
      "intro": "0-4s: taiko drum hits (3 hits, accelerating), string tremolo rises",
      "A_section": "4-28s: driving string ostinato with brass accents, establishes combat energy",
      "B_section": "28-48s: melody shifts to higher register, choir pad enters, heroic feel, brass fanfare motif",
      "C_section": "48-64s: breakdown — percussion feature, string tremolo, building tension for loop",
      "bridge_loop": "64-75s: energy descends to match intro energy, taiko pattern returns for seamless loop to 0s"
    },

    "reference_feel": "Final Fantasy battle themes (FF Tactics), Octopath Traveler boss music (lighter), Fire Emblem skirmish music",
    "avoid": "electronic sounds, guitar, vocals with lyrics, extremely fast shredding, silence gaps"
  }
}
```

---

## 2. Sound Effects — Existing Keys (5 unique sounds)

### SFX-Click — UI Button Click

```json
{
  "id": "sfx-click",
  "type": "SFX",
  "file": "sfx-click.ogg / sfx-click.m4a",
  "howlerConfig": { "volume": 0.5 },
  "playContext": "Every UI button press, panel toggle, menu interaction",

  "prompt": {
    "style": "clean UI feedback, pixel art game aesthetic",
    "mood": "neutral, satisfying, crisp",
    "duration": "0.1-0.15 seconds (very short)",

    "sound_design": {
      "attack": "instant (0ms attack), sharp transient",
      "body": "short wooden tap or soft mechanical click, slight resonance",
      "decay": "fast exponential decay, no sustain, no tail",
      "frequency": "mid-high (800-2000 Hz fundamental)",
      "character": "wooden button press (like placing a chess piece), not metallic, not plasticky"
    },

    "generation": {
      "tool": "bfxr or sfxr",
      "preset_base": "pickup/coin preset, heavily shortened",
      "adjustments": "remove sweep, flatten pitch, shorten decay to 0.1s, reduce volume envelope"
    },

    "reference_feel": "Stardew Valley menu click, Minecraft button press (softer version)",
    "avoid": "reverb, echo, metallic ring, harsh high frequencies, sci-fi beeps"
  }
}
```

### SFX-Dispatch — Quest Dispatch Confirmation

```json
{
  "id": "sfx-dispatch",
  "type": "SFX",
  "file": "sfx-dispatch.ogg / sfx-dispatch.m4a",
  "howlerConfig": { "volume": 0.5 },
  "playContext": "When player confirms quest dispatch (party leaves on mission)",
  "codeRef": "src/ui/panels/quest-board.tsx:71, src/ui/hooks/use-game-tick-loop.ts:40",

  "prompt": {
    "style": "brief heroic fanfare, adventure call",
    "mood": "excitement, departure, courage, forward momentum",
    "duration": "0.8-1.2 seconds",

    "sound_design": {
      "attack": "quick brass-like attack (trumpet call feel)",
      "body": "short ascending 3-note fanfare (root → 3rd → 5th), major triad, each note ~0.2s",
      "tail": "final note sustains slightly longer with gentle decay, shimmer/sparkle layer on top",
      "frequency": "mid (400-1000 Hz melody), with high sparkle (3000+ Hz) on tail"
    },

    "layers": {
      "layer1_melody": "trumpet-like synth, 3-note ascending fanfare (C-E-G or similar major triad)",
      "layer2_support": "soft string swell underneath, single chord, rises with melody",
      "layer3_sparkle": "high-frequency chime/bell on final note (wind chime texture)"
    },

    "reference_feel": "Final Fantasy quest-accept jingle, Fire Emblem unit deploy sound, Octopath Traveler travel confirmation",
    "avoid": "percussion, drums, dark tones, descending phrases, excessive length"
  }
}
```

### SFX-Reward — Reward Received / Victory

```json
{
  "id": "sfx-reward",
  "type": "SFX",
  "file": "sfx-reward.ogg / sfx-reward.m4a",
  "howlerConfig": { "volume": 0.6 },
  "playContext": "Quest reward distribution, loot received, gold gained. Also aliased as SFX_VICTORY",
  "codeRef": "src/ui/hooks/use-game-tick-loop.ts:57 (on non-wipe combat result)",

  "prompt": {
    "style": "treasure/loot collection jingle, satisfying reward feedback",
    "mood": "delight, accomplishment, treasure found, dopamine hit",
    "duration": "0.6-1.0 seconds",

    "sound_design": {
      "attack": "bright coin-like initial hit (high metallic ping)",
      "body": "cascading coin sounds (3-4 rapid pings, descending pitch slightly), layered with warm chime",
      "tail": "gentle sparkle decay (like coins settling), warm resolution",
      "frequency": "high (1500-4000 Hz coin pings), mid warmth (500-1000 Hz chime body)"
    },

    "layers": {
      "layer1_coins": "rapid metallic pings (4 hits in 0.3s, slight pitch variation each), coin-on-coin sound",
      "layer2_chime": "warm bell/chime chord (major), single hit timed with first coin",
      "layer3_sparkle": "high frequency shimmer tail (granular sparkle), 0.3s fade out"
    },

    "reference_feel": "Zelda chest-open jingle (short version), RPG gold pickup sound, Stardew Valley shipping total sound",
    "avoid": "dark tones, bass, percussion, fanfare (that's dispatch), length over 1s"
  }
}
```

### SFX-LevelUp — Level Up Celebration

```json
{
  "id": "sfx-levelup",
  "type": "SFX",
  "file": "sfx-levelup.ogg / sfx-levelup.m4a",
  "howlerConfig": { "volume": 0.7 },
  "playContext": "Character levels up from EXP gain",

  "prompt": {
    "style": "triumphant level-up jingle, classic RPG progression",
    "mood": "achievement, growth, celebration, power gained",
    "duration": "1.5-2.0 seconds",

    "sound_design": {
      "attack": "bright ascending arpeggio (harp-like), quick 4-note run upward",
      "body": "warm major chord resolves and sustains briefly, strings + chime together, sense of arrival",
      "tail": "sparkle shower (high frequency descending particles), gentle fade",
      "frequency": "wide range — low warm base (300 Hz) to high sparkle (5000+ Hz)"
    },

    "layers": {
      "layer1_arpeggio": "harp/glockenspiel ascending run (4 notes: root-3rd-5th-octave, each ~0.15s)",
      "layer2_chord": "string ensemble chord on arrival note, major chord, 0.8s sustain with gentle decay",
      "layer3_sparkle": "descending high-frequency particles (like fairy dust falling), 0.5s tail",
      "layer4_bass": "single deep warm note (octave below root) on chord hit, short sustain, grounds the sound"
    },

    "reference_feel": "Final Fantasy level-up fanfare (condensed to 2s), Dragon Quest level-up, Pokemon evolution complete",
    "avoid": "percussion, drums, dark minor tones, abrupt ending, excessive length beyond 2s"
  }
}
```

### SFX-Hit — Combat Hit Impact

```json
{
  "id": "sfx-hit",
  "type": "SFX",
  "file": "sfx-hit.ogg / sfx-hit.m4a",
  "howlerConfig": { "volume": 0.4 },
  "playContext": "Normal melee attack lands on target in combat. Also aliased as SFX_WIPE (party wipe)",
  "codeRef": "src/ui/hooks/use-game-tick-loop.ts:57 (on full-wipe result)",

  "prompt": {
    "style": "melee impact, physical combat feedback",
    "mood": "impact, weight, contact, not painful/gory",
    "duration": "0.15-0.3 seconds",

    "sound_design": {
      "attack": "immediate thud (0ms attack), blunt impact transient",
      "body": "low-mid frequency punch with slight flesh-on-armor character, brief resonance",
      "tail": "very short decay, tiny rattling (armor jingle) barely audible on tail end",
      "frequency": "low-mid (150-600 Hz impact body), slight mid presence (800 Hz knock)"
    },

    "layers": {
      "layer1_impact": "deep thud (leather-on-leather feel), single hit, punchy",
      "layer2_knock": "lighter mid-frequency knock layered on top (wood or metal contact), shorter than thud",
      "layer3_rattle": "very subtle high-frequency rattle (chain mail jingle, almost subliminal), 0.1s tail"
    },

    "generation": {
      "tool": "bfxr",
      "preset_base": "explosion preset, shortened and pitched up",
      "adjustments": "short sustain, no sweep, slight lowpass filter, minimal decay"
    },

    "reference_feel": "Octopath Traveler physical attack, Fire Emblem sword hit (less sharp), classic RPG melee thud",
    "avoid": "slashing sounds (that's crit), magical effects, long reverb, wet/gore sounds"
  }
}
```

---

## 3. Sound Effects — New Keys (5 unique sounds)

### SFX-Crit — Critical Hit

```json
{
  "id": "sfx-crit",
  "type": "SFX",
  "file": "sfx-crit.ogg / sfx-crit.m4a",
  "howlerConfig": { "volume": 0.5 },
  "playContext": "Critical hit lands in combat (higher damage roll)",

  "prompt": {
    "style": "enhanced combat impact, sharper and more dramatic than normal hit",
    "mood": "devastating blow, decisive strike, power spike",
    "duration": "0.3-0.5 seconds (slightly longer than sfx-hit)",

    "sound_design": {
      "attack": "sharp metallic slash transient (blade cutting air), immediate and bright",
      "body": "combination of slash + heavy impact, layered — high frequency cut with low frequency thud simultaneously",
      "tail": "brief metallic ring (sword resonance) + impact echo, 0.2s decay",
      "frequency": "wide — high slash (2000-5000 Hz), low impact (100-400 Hz), creates full-spectrum dramatic hit"
    },

    "layers": {
      "layer1_slash": "sharp blade-through-air slash (high freq, bright, 0.1s)",
      "layer2_impact": "heavy thud (deeper and louder than sfx-hit, 1.5x volume of sfx-hit body)",
      "layer3_ring": "metallic ring/resonance on sword (mid-high, 0.2s sustain with decay)",
      "layer4_accent": "brief screen-shake feel — very short bass burst (sub 100 Hz, 0.05s)"
    },

    "relationship_to_sfx_hit": "same family but elevated — sfx-hit is the base, sfx-crit adds slash layer + metallic ring + deeper bass. Player should immediately feel the difference",

    "reference_feel": "Final Fantasy critical hit (with screen flash), Fire Emblem critical strike sound, Persona crit hit",
    "avoid": "magical sounds, sparkles, gentle tones, sounds similar to sfx-hit (must be clearly distinct)"
  }
}
```

### SFX-Dodge — Dodge / Miss

```json
{
  "id": "sfx-dodge",
  "type": "SFX",
  "file": "sfx-dodge.ogg / sfx-dodge.m4a",
  "howlerConfig": { "volume": 0.4 },
  "playContext": "Attack misses target (dodge roll success, especially Thien Lu passive dodge)",

  "prompt": {
    "style": "evasion whoosh, near-miss air displacement",
    "mood": "swift evasion, narrowly avoided, wind rush",
    "duration": "0.3-0.5 seconds",

    "sound_design": {
      "attack": "fast onset, not instant — 20ms ramp (wind building)",
      "body": "breathy whoosh sweeping from left to right (stereo pan L→R or R→L), white noise filtered through bandpass sweep",
      "tail": "quick fade to silence, slight cloth-flutter texture at end",
      "frequency": "mid to high (800-3000 Hz bandpass sweep, moves upward during whoosh)"
    },

    "layers": {
      "layer1_whoosh": "primary wind/air whoosh, bandpass filtered noise with frequency sweep (low→high over 0.3s)",
      "layer2_cloth": "subtle fabric flutter (layered at tail end, very low volume), suggests character's clothes moving",
      "layer3_stereo": "stereo panning element — main whoosh pans L to R (or R to L) suggesting lateral dodge movement"
    },

    "generation": {
      "tool": "bfxr or manual synthesis",
      "technique": "white noise with bandpass filter automation (sweep 800Hz → 3000Hz over 0.3s), apply volume envelope (quick rise, sustain, medium decay)"
    },

    "reference_feel": "Smash Bros dodge roll sound, Sekiro deflect whoosh (lighter), RPG miss/evade",
    "avoid": "impact sounds, metallic sounds, any sense of contact, magical sparkles"
  }
}
```

### SFX-Death — Entity Defeated

```json
{
  "id": "sfx-death",
  "type": "SFX",
  "file": "sfx-death.ogg / sfx-death.m4a",
  "howlerConfig": { "volume": 0.5 },
  "playContext": "Enemy or ally is defeated in combat (HP reaches 0)",

  "prompt": {
    "style": "defeat/collapse sound, entity falling",
    "mood": "finality, collapse, not gruesome — stylized defeat",
    "duration": "0.5-0.8 seconds",

    "sound_design": {
      "attack": "medium attack (30ms), not sharp — more of a crumble than a hit",
      "body": "low rumbling collapse (body falling + armor clattering), descending pitch",
      "tail": "settling dust/debris feel, very quiet rattling, fades to silence",
      "frequency": "low-heavy (100-500 Hz rumble body), mid clatter (600-1500 Hz armor)"
    },

    "layers": {
      "layer1_collapse": "descending pitch rumble (starts 400 Hz, drops to 100 Hz over 0.4s), represents body falling",
      "layer2_clatter": "brief metal-on-ground clatter (armor/weapon dropping, 2-3 quick metallic taps), mid frequency",
      "layer3_dust": "very subtle noise burst at tail (like debris settling), filtered high-pass, barely audible",
      "layer4_thud": "single deep thud at start (body hitting ground), layered with collapse"
    },

    "reference_feel": "Dark Souls enemy death (lighter version), Fire Emblem unit defeat, RPG enemy dissolve sound (more physical version)",
    "avoid": "screams, vocal elements, gore sounds, magical dissolve effects, comedy sounds"
  }
}
```

### SFX-Skill — Skill Activation

```json
{
  "id": "sfx-skill",
  "type": "SFX",
  "file": "sfx-skill.ogg / sfx-skill.m4a",
  "howlerConfig": { "volume": 0.5 },
  "playContext": "Any skill activation in combat (Danh Manh, Kiem Gia, Hoa Cau, etc.)",

  "prompt": {
    "style": "magical power activation, energy gathering and release",
    "mood": "power surge, channeling energy, heroic moment, brief but impactful",
    "duration": "0.5-0.8 seconds",

    "sound_design": {
      "attack": "energy gathering phase (0.15s) — rising shimmer/charge up",
      "body": "release burst — warm magical explosion outward, resonant mid-frequency with sparkle",
      "tail": "dissipating energy particles, gentle high-frequency decay",
      "frequency": "mid core (400-1200 Hz warm resonance), high sparkle (2000-6000 Hz shimmer)"
    },

    "layers": {
      "layer1_charge": "ascending shimmer (0.15s, pitch rises, volume rises — charging up)",
      "layer2_release": "warm resonant burst (like a bell being struck with a mallet, but more magical), single hit at peak of charge",
      "layer3_sparkle": "high-frequency particle scatter post-release (descending pitch particles, like sparkler embers)",
      "layer4_bass": "subtle sub-bass pulse on release (grounds the magic, prevents it from sounding thin)"
    },

    "note": "This is a GENERIC skill activation sound used for all 7 skills. Future versions may have unique sounds per skill. Should work for physical skills (Danh Manh = heavy strike) AND magical skills (Hoa Cau = fireball) — hence the hybrid physical+magical approach",

    "reference_feel": "Octopath Traveler skill activation, Fire Emblem special attack charge, Final Fantasy ability use",
    "avoid": "specific elemental sounds (no pure fire, no pure ice), overly sci-fi sounds, long charge-ups, voice clips"
  }
}
```

### SFX-Recruit — New Member Recruited

```json
{
  "id": "sfx-recruit",
  "type": "SFX",
  "file": "sfx-recruit.ogg / sfx-recruit.m4a",
  "howlerConfig": { "volume": 0.6 },
  "playContext": "New mercenary hired from tavern or mercenary invited to guild",

  "prompt": {
    "style": "welcoming arrival jingle, new ally joined",
    "mood": "warm welcome, friendly arrival, guild growing, optimistic",
    "duration": "1.0-1.5 seconds",

    "sound_design": {
      "attack": "door-opening creak (brief, 0.1s) OR footstep arrival thud — signals someone arriving",
      "body": "warm welcoming chime melody (3 notes: 5th → root → 3rd, descending then up — inviting gesture), harp or glockenspiel",
      "tail": "soft crowd murmur reaction (1-2 muffled 'hm!' approval sounds, very subtle), gentle chime decay",
      "frequency": "mid-warm (400-1500 Hz melody), gentle highs (2000-4000 Hz chime)"
    },

    "layers": {
      "layer1_arrival": "soft wooden door thud or footstep (grounding — someone physically arrived)",
      "layer2_melody": "3-note welcoming chime (harp or bells): descending 5th → root, then ascending to 3rd — musical gesture of invitation",
      "layer3_warmth": "warm string pad underneath (single chord, very low volume, creates bed of warmth)",
      "layer4_crowd": "extremely subtle crowd approval murmur (1-2 very quiet 'hm' sounds, like tavern patrons noticing)"
    },

    "reference_feel": "Fire Emblem new unit recruited, Suikoden party join sound, RPG ally joins jingle",
    "avoid": "fanfare (too heroic — that's dispatch), combat sounds, sad/minor tones, mechanical sounds"
  }
}
```

---

## 4. Future Expansion (Not in M2 Scope)

Placeholders for post-M2 consideration. Not wired in code yet.

```json
{
  "future_audio": [
    { "id": "sfx-build", "desc": "Room construction complete", "priority": "P2" },
    { "id": "sfx-upgrade", "desc": "Furniture/room upgrade complete", "priority": "P2" },
    { "id": "sfx-promote", "desc": "Rank promotion fanfare", "priority": "P2" },
    { "id": "sfx-error", "desc": "Action denied / insufficient resources", "priority": "P3" },
    { "id": "sfx-notification", "desc": "Generic notification ping", "priority": "P3" },
    { "id": "bgm-title", "desc": "Title screen theme (grander, cinematic)", "priority": "P2" },
    { "id": "bgm-linh-son", "desc": "Civ-specific BGM (earth/mountain theme)", "priority": "P3" },
    { "id": "bgm-de-quoc", "desc": "Civ-specific BGM (steampunk/industrial theme)", "priority": "P3" },
    { "id": "bgm-thien-lu", "desc": "Civ-specific BGM (celestial/mystical theme)", "priority": "P3" }
  ]
}
```

---

## Summary

| Category | Count | Duration | Tool | Status |
|----------|-------|----------|------|--------|
| BGM tracks | 2 | 75-90s each | Suno / Stable Audio | code wired, files missing |
| SFX — existing keys | 5 | 0.1-2.0s | bfxr / Stable Audio | code wired, files missing |
| SFX — new keys | 5 | 0.3-1.5s | bfxr / Stable Audio | code wired, files missing |
| **TOTAL unique sounds** | **12** | | | |
| **TOTAL files (×2 formats)** | **24** | | | **0/24 exist** |

### Production Pipeline

```
1. Generate → Suno/Stable Audio (BGM), bfxr (SFX)
2. Edit    → Trim silence, verify loop points (BGM), normalize
3. Export  → ffmpeg -c:a libvorbis -q:a 4 → .ogg
             ffmpeg -c:a aac -b:a 128k   → .m4a
4. Place   → public/audio/{key}.ogg + .m4a
5. Test    → Chrome + Safari playback, loop seam check, volume balance
```
