# Asset List — Character Sprites (Layered)

> Layered character pipeline: each character = **body (bald) + hair + weapon** as 3 separate sprites.
> Enables hair style/color variation without regenerating body animations.
> Generated: 2026-04-13
> **Phase 1 priority:** Linh Son (LS) civilization. DQ/TL listed for reference.

---

## Layer Architecture

```
CharacterSprite (rendered at same world position)
├── BODY layer     ← full animation (walk, run, attack, idle, block) per direction
│                    bald head, no hair, no headgear
│                    ~768 frames/archetype (8 frames × 4 dir × 6 anims)
├── HAIR layer     ← static overlay per direction (4 sprites)
│                    hair + headgear only, transparent elsewhere
│                    color-tintable via shader
│                    shared pool — multiple characters can wear same hair
└── WEAPON layer   ← attached to hand bone (existing behavior, unchanged)
```

### Rendering rules
- Body and hair share **resolution, canvas size, head anchor Y position** — pixel-perfect overlay
- Hair sprite is rendered as `MeshBasicMaterial` plane stacked +1px Z above body, with `.color.set(tint)` multiply for color variants
- Hair is **static per direction** — does not animate per walk frame (head bob tolerance ≤ 2px)
- Each archetype has a `headAnchor: { yOffset, scale }` for slight per-body tuning

### Asset directory
```
public/sprites/characters/{CIV}-{ARCH}-{GENDER}/
├── body/                                ← replaces current animation folders
│   └── animations/...                   ← existing structure, but bald
│       ├── walking-8-frames/...
│       └── ...
hair/{hair-id}/                          ← shared pool, not per-character
├── north.png
├── south.png
├── east.png
└── west.png
weapon/{weapon-id}.png                   ← unchanged
```

---

## Global Style Guide

```json
{
  "globalStyle": {
    "format": "pixel art",
    "canvas": "128x128",
    "characterHeight": "~60% of canvas (~77px tall) — character centered with headroom + foot padding",
    "palette": "limited 16-color per sprite",
    "outline": "1px black outline, anti-aliased edges",
    "shading": "2-tone shading (base + shadow), no dithering",
    "perspective": "isometric 20° angle (low-angle iso — near side view with slight top tilt, NOT 3/4 top-down)",
    "background": "transparent",
    "fileFormat": "PNG with alpha channel"
  },
  "layerConstraints": {
    "headAnchorRule": "body and hair must share identical head position so hair overlays pixel-perfectly",
    "hairSpritePolicy": "hair+headgear only, fully transparent elsewhere (no face, no shoulders)",
    "bodySpritePolicy": "bald/shaved clean head, no hair, no headgear, no hat — neutral scalp with skin tone",
    "tintability": "hair base color should use near-white or grayscale values if shader tint required; colored hair uses direct hex"
  }
}
```

---

## 1. Linh Son (LS) — Ancient Mountain Warriors

**Civ identity:** Chiến binh cổ đại bám rễ vào núi rừng. Earth-tone palette, traditional Vietnamese armor, stone/wood motifs, sturdy build.
**Archetypes:** Warrior (tank/melee) + Scout (ranged/agile)

### 1.1 LS-Warrior (Male)

<!-- id: ls-warrior-m | civ: Linh Son | role: Tank/Melee DPS -->

**Body (bald):**
```json
{
  "id": "ls-warrior-m-body",
  "type": "character-body-sprite",
  "archetype": "warrior",
  "gender": "male",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "shape": "bald/shaved clean head, no hair, no headgear, no hat",
    "face": "square jaw, thick eyebrows, weathered skin (tan)"
  },
  "clothing": {
    "body": "half naked, bronze drum tattoo on the left shoulder, leather armor on the right shoulder",
    "lowBody": "golden loincloth, reinforced at thighs with leather strips",
    "arms": "bare forearms with stone-studded leather bracers, cord wraps at wrists",
    "legs": "shin guards made of carved wood plating",
    "shoes": "straw-soled sandals with ankle straps (Vietnamese dep guoc inspired)"
  },
  "colorPattern": {
    "primary": "#f5f0e6 (cream/bone)",
    "secondary": "#8B6914 (dark gold)",
    "accent": "#D4A017 (bright gold)",
    "skin": "#c49a6c (warm tan)",
    "metal": "#8c7853 (bronze)"
  },
  "expression": "stoic, determined, eyes forward"
}
```

**Hair:**
```json
{
  "id": "ls-warrior-m-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + headgear only, fully transparent elsewhere (no face, no skin)",
  "description": "short black hair tied in topknot (bun), bronze headband with mountain crest engraving across forehead",
  "colorPattern": {
    "hair": "#1a1a1a (black)",
    "headband": "#8c7853 (bronze)",
    "crest": "#D4A017 (bright gold crest engraving)"
  }
}
```

**Weapon:**
```json
{
  "id": "ls-warrior-m-weapon",
  "type": "weapon-sprite",
  "name": "long hand hatchet — Vietnamese bronze axe",
  "material": "forged iron with wooden hilt wrapped in hemp cord",
  "pose": "displayed upright, isolated on transparent background, slight angle to show depth",
  "colorPattern": {
    "blade": "#8c7853 (bronze)",
    "hilt": "#5c4033 (dark wood)",
    "wrap": "#8B6914 (dark gold — hemp cord)"
  }
}
```

---

### 1.2 LS-Warrior (Female)

<!-- id: ls-warrior-f | civ: Linh Son | role: Tank/Melee DPS -->

**Body (bald):**
```json
{
  "id": "ls-warrior-f-body",
  "type": "character-body-sprite",
  "archetype": "warrior",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "shape": "bald/shaved clean head, no hair, no headgear, no circlet — neutral scalp",
    "face": "strong cheekbones, fierce narrow eyes, warm tan skin"
  },
  "clothing": {
    "body": "bronze-dyed chest wrap (yếm-style — crossed front, tied at back), bronze drum tattoo on right shoulder blade, left arm has leather pauldron",
    "lowBody": "dark ochre wrap skirt (knee-length), reinforced at hips with leather strips, slit on right side for mobility",
    "arms": "bare forearms with Đông Sơn wave-band tattoos, stone-studded leather bracers on both wrists",
    "legs": "bare legs, shin guards made of carved wood plating",
    "shoes": "straw-soled sandals with ankle straps"
  },
  "colorPattern": {
    "primary": "#f5f0e6 (cream/bone)",
    "secondary": "#8B6914 (dark gold)",
    "accent": "#D4A017 (bright gold)",
    "skin": "#c49a6c (warm tan)",
    "metal": "#8c7853 (bronze)"
  },
  "expression": "fierce, unflinching, chin raised — warrior queen presence"
}
```

**Hair:**
```json
{
  "id": "ls-warrior-f-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + headgear only, fully transparent elsewhere",
  "description": "long black hair in high warrior bun, two loose strands framing face, bronze circlet with mountain crest engraving (thinner than male variant)",
  "colorPattern": {
    "hair": "#1a1a1a (black)",
    "circlet": "#8c7853 (bronze)",
    "crest": "#D4A017 (bright gold engraving)"
  }
}
```

**Weapon:**
```json
{
  "id": "ls-warrior-f-weapon",
  "type": "weapon-sprite",
  "name": "long hand hatchet — Vietnamese bronze axe",
  "material": "forged iron with wooden hilt wrapped in hemp cord",
  "pose": "displayed upright, isolated on transparent background, slight angle",
  "colorPattern": {
    "blade": "#8c7853 (bronze)",
    "hilt": "#5c4033 (dark wood)",
    "wrap": "#8B6914 (dark gold — hemp cord)"
  }
}
```

---

### 1.3 LS-Scout (Male)

<!-- id: ls-scout-m | civ: Linh Son | role: Ranged/Tracker -->

**Body (bald):**
```json
{
  "id": "ls-scout-m-body",
  "type": "character-body-sprite",
  "archetype": "scout",
  "gender": "male",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no feathers, no headdress",
    "face": "lean angular features, narrow eyes, dark geometric tattoo lines on cheeks (Lạc Việt xăm mình tradition)"
  },
  "clothing": {
    "body": "bare chest with dark spiral tattoos (Đông Sơn sun motif on sternum, wave-bands wrapping ribs), single diagonal strap for bamboo quiver across chest, small bronze medallion clasp at shoulder",
    "lowBody": "indigo-dyed wrap skirt (mid-thigh length, single wrap), woven hemp cord belt, small bone-toggle pouches on belt (2)",
    "arms": "bare forearms with geometric band tattoos (3 rings), simple cord bracelet with animal teeth on left wrist",
    "legs": "bare legs with spiral tattoo bands above ankles",
    "shoes": "barefoot (mud-stained soles visible in side view)"
  },
  "colorPattern": {
    "primary": "#2c3e50 (deep indigo, natural dye)",
    "secondary": "#8B6914 (dark gold/bronze)",
    "accent": "#1753d4 (bright bronze)",
    "skin": "#c49a6c (warm tan, tattoos #1a1a1a black)",
    "metal": "#8c7853 (bronze medallion)"
  },
  "expression": "alert, focused, eyes scanning — predator patience"
}
```

**Hair:**
```json
{
  "id": "ls-scout-m-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + feathered headdress, transparent elsewhere",
  "description": "black hair tied back tightly in short topknot with loose strands, feathered headdress — 3 white crane feathers bound with indigo cloth wrap at base, tilted slightly back",
  "colorPattern": {
    "hair": "#1a1a1a (black)",
    "feathers": "#f5f5f5 (crane white)",
    "wrap": "#2c3e50 (indigo cloth)"
  }
}
```

**Weapon:**
```json
{
  "id": "ls-scout-m-weapon",
  "type": "weapon-sprite",
  "name": "compact crossbow — nỏ (Vietnamese bronze-age crossbow)",
  "material": "mulberry wood frame, bronze trigger mechanism, sinew string",
  "pose": "displayed horizontally, isolated on transparent background, slight angle",
  "colorPattern": {
    "frame": "#5c4033 (mulberry wood)",
    "trigger": "#8c7853 (bronze mechanism)",
    "string": "#e8dcc8 (sinew — off-white)",
    "quiver": "#c49a6c (bamboo tan)"
  }
}
```

---

### 1.4 LS-Scout (Female)

<!-- id: ls-scout-f | civ: Linh Son | role: Ranged/Tracker -->

**Body (bald):**
```json
{
  "id": "ls-scout-f-body",
  "type": "character-body-sprite",
  "archetype": "scout",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no braid, no headband — neutral scalp",
    "face": "sharp angular features, almond eyes, dark geometric tattoo dots under eyes (3 per side, Lạc Việt xăm mình)"
  },
  "clothing": {
    "body": "indigo-dyed chest wrap (yếm-style — single layer, tied at nape), Đông Sơn spiral tattoo visible on upper back and collarbone, diagonal bamboo quiver strap across chest, bronze clasp at left shoulder",
    "lowBody": "shorter indigo wrap skirt (above-knee, double-wrapped), hemp cord belt with bone-toggle pouch (1) and dried herb bundle",
    "arms": "bare arms with geometric band tattoos (2 rings on left upper arm), woven vine bracelet on right wrist with single animal fang pendant",
    "legs": "bare legs with small spiral tattoo on left ankle",
    "shoes": "barefoot (clean, nimble stance)"
  },
  "colorPattern": {
    "primary": "#2c3e50 (deep indigo)",
    "secondary": "#8B6914 (dark gold/bronze)",
    "accent": "#D4A017 (bright bronze)",
    "skin": "#c49a6c (warm tan, tattoos #1a1a1a black)",
    "metal": "#8c7853 (bronze clasp)"
  },
  "expression": "calm focus, slight head tilt — listening to forest sounds"
}
```

**Hair:**
```json
{
  "id": "ls-scout-f-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + feathers + headband, transparent elsewhere",
  "description": "long black hair in single thick braid down back, woven with thin vine cord, 2 white crane feathers tucked into braid, indigo cloth headband across forehead",
  "colorPattern": {
    "hair": "#1a1a1a (black)",
    "feathers": "#f5f5f5 (crane white)",
    "headband": "#2c3e50 (indigo)",
    "vine": "#5c4033 (brown cord)"
  }
}
```

**Weapon:**
```json
{
  "id": "ls-scout-f-weapon",
  "type": "weapon-sprite",
  "name": "compact crossbow — nỏ",
  "material": "mulberry wood frame, bronze trigger mechanism, sinew string",
  "pose": "displayed horizontally, isolated on transparent background, slight angle",
  "colorPattern": {
    "frame": "#5c4033 (mulberry wood)",
    "trigger": "#8c7853 (bronze mechanism)",
    "string": "#e8dcc8 (sinew — off-white)",
    "quiver": "#c49a6c (bamboo tan)"
  }
}
```

---

## 2. De Quoc (DQ) — Electro-Steam Empire

**Civ identity:** Steampunk/electropunk, brass/steel/glass, cyan energy accents, industrial Victorian.
**Archetypes:** Scholar (arcane-tech caster) + Engineer (gadgeteer/builder)
**Status:** Phase 2 priority — spec reference only.

### 2.1 DQ-Scholar (Male)

<!-- id: dq-scholar-m | civ: De Quoc | role: Arcane-Tech Caster -->

**Body (bald):**
```json
{
  "id": "dq-scholar-m-body",
  "type": "character-body-sprite",
  "archetype": "scholar",
  "gender": "male",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no spectacles (spectacles move to hair layer)",
    "face": "thin face, sharp cheekbones, pale fair skin"
  },
  "clothing": {
    "body": "long dark navy lab coat over waistcoat, brass buttons, high collar with cyan trim, multiple pen loops on breast pocket, belt with vial holders (3 glass vials with glowing cyan liquid)",
    "lowBody": "formal dark grey trousers, creased",
    "arms": "coat sleeves rolled to reveal forearm-mounted device (brass armband with rotating dials and small tesla coil), other arm has leather writing glove",
    "legs": "no additional armor",
    "shoes": "polished black leather oxford shoes with brass toe caps"
  },
  "colorPattern": {
    "primary": "#1a1a2e (dark navy)",
    "secondary": "#3a3a4e (medium dark)",
    "accent": "#00d4ff (cyan energy/glow)",
    "skin": "#f0dcc0 (pale/fair)",
    "metal": "#b08d57 (brass fittings)"
  },
  "expression": "focused, analytical, slight knowing smile"
}
```

**Hair:**
```json
{
  "id": "dq-scholar-m-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + spectacles, transparent elsewhere",
  "description": "slicked-back dark hair with silver streaks at temples, round brass-framed spectacles on face",
  "colorPattern": {
    "hair": "#1a1a1a (dark)",
    "streaks": "#c0c0c0 (silver)",
    "frames": "#b08d57 (brass)",
    "lenses": "#e8f4ff (pale cyan tint)"
  }
}
```

**Weapon:**
```json
{
  "id": "dq-scholar-m-weapon",
  "type": "weapon-sprite",
  "name": "arcane-tech codex — floating grimoire",
  "material": "leather-bound tome, brass corner brackets, pages glow faintly cyan",
  "pose": "displayed open at slight angle, isolated on transparent background",
  "colorPattern": {
    "cover": "#1a1a2e (dark navy leather)",
    "brackets": "#b08d57 (brass corners)",
    "pages": "#e8f4ff (off-white with cyan glow)",
    "glow": "#00d4ff (cyan page luminance)"
  }
}
```

---

### 2.2 DQ-Scholar (Female)

<!-- id: dq-scholar-f | civ: De Quoc | role: Arcane-Tech Caster -->

**Body (bald):**
```json
{
  "id": "dq-scholar-f-body",
  "type": "character-body-sprite",
  "archetype": "scholar",
  "gender": "female",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no spectacles, no hairpins — neutral scalp",
    "face": "sharp features, defined brows, pale fair skin"
  },
  "clothing": {
    "body": "fitted dark navy frock coat (waist-length), high mandarin collar with cyan piping, brass toggle closures down front, leather corset belt with vial holders (3 glass vials — cyan glow), small epaulettes with gear emblems",
    "lowBody": "dark grey A-line skirt over leggings (knee-length), practical split-front for mobility",
    "arms": "coat sleeves tapered, left forearm has brass armband device (rotating dials + mini tesla coil), right hand has fingerless leather glove with conductive brass knuckle pads",
    "legs": "dark stockings, no additional armor",
    "shoes": "heeled ankle boots with brass buckles, low practical heel"
  },
  "colorPattern": {
    "primary": "#1a1a2e (dark navy)",
    "secondary": "#3a3a4e (medium dark)",
    "accent": "#00d4ff (cyan energy/glow)",
    "skin": "#f0dcc0 (pale/fair)",
    "metal": "#b08d57 (brass fittings)"
  },
  "expression": "composed, piercing gaze, one brow slightly raised"
}
```

**Hair:**
```json
{
  "id": "dq-scholar-f-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + pince-nez + pins, transparent elsewhere",
  "description": "dark hair in neat low chignon with brass hairpins, silver streak in front bangs, pince-nez spectacles with brass chain hanging toward collar",
  "colorPattern": {
    "hair": "#1a1a1a (dark)",
    "streak": "#c0c0c0 (silver bangs)",
    "pins": "#b08d57 (brass)",
    "chain": "#b08d57 (brass)"
  }
}
```

**Weapon:**
```json
{
  "id": "dq-scholar-f-weapon",
  "type": "weapon-sprite",
  "name": "arcane-tech codex — floating grimoire",
  "material": "leather-bound tome, brass corner brackets, cyan-glow pages",
  "pose": "displayed open at slight angle, transparent background",
  "colorPattern": {
    "cover": "#1a1a2e (dark navy)",
    "brackets": "#b08d57 (brass)",
    "pages": "#e8f4ff (off-white)",
    "glow": "#00d4ff (cyan)"
  }
}
```

---

### 2.3 DQ-Engineer (Male)

<!-- id: dq-engineer-m | civ: De Quoc | role: Gadgeteer/Field Mechanic -->

**Body (bald):**
```json
{
  "id": "dq-engineer-m-body",
  "type": "character-body-sprite",
  "archetype": "engineer",
  "gender": "male",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no cap, no goggles — neutral scalp",
    "face": "round cheeks, grease smudge on nose, bright eager eyes, freckles"
  },
  "clothing": {
    "body": "heavy leather apron over dark navy work shirt (sleeves rolled up), apron has multiple tool loops (pliers, wire cutters, small hammer visible), brass-buttoned suspenders under apron, chest pocket overflows with blueprints",
    "lowBody": "reinforced dark grey cargo pants, multiple deep pockets with bulging contents, leather knee patches (burn-scarred)",
    "arms": "left forearm has brass mechanical bracer (built-in multitool), right arm has thick leather welding glove, both arms grease-stained",
    "legs": "brass-plated shin guards (self-made, asymmetric), copper wire wrapped around left ankle",
    "shoes": "heavy steel-toed work boots, brass toe plate, laces replaced with copper wire"
  },
  "colorPattern": {
    "primary": "#2a2a3e (dark navy work clothes)",
    "secondary": "#5c4a3a (leather brown apron)",
    "accent": "#00d4ff (cyan crystal glow on bracer)",
    "skin": "#f0dcc0 (pale/fair, grease-smudged)",
    "metal": "#b08d57 (brass tools)",
    "soot": "#3a3a3a (dark grey grease stains)"
  },
  "expression": "enthusiastic, cocky half-grin, one eye squinting"
}
```

**Hair:**
```json
{
  "id": "dq-engineer-m-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + cap + goggles, transparent elsewhere",
  "description": "messy auburn hair, soot-streaked, partially hidden under leather flat cap (newsboy style), brass goggles pushed up on cap with amber tinted lens, one lens has magnification flip-up",
  "colorPattern": {
    "hair": "#8b4513 (auburn)",
    "cap": "#5c4a3a (leather brown)",
    "goggles": "#b08d57 (brass frame)",
    "lens": "#daa520 (amber tint)"
  }
}
```

**Weapon:**
```json
{
  "id": "dq-engineer-m-weapon",
  "type": "weapon-sprite",
  "name": "oversized steam-wrench — dual-purpose tool/weapon",
  "material": "heavy iron wrench head with steam pressure valve, brass handle with leather grip, cyan crystal embedded in jaw",
  "pose": "displayed upright, transparent background, slight angle",
  "colorPattern": {
    "head": "#555555 (heavy iron)",
    "handle": "#b08d57 (brass with leather grip)",
    "crystal": "#00d4ff (cyan glow)",
    "steam": "#e0e0e0 (faint white wisp)"
  }
}
```

---

### 2.4 DQ-Engineer (Female)

<!-- id: dq-engineer-f | civ: De Quoc | role: Gadgeteer/Field Mechanic -->

**Body (bald):**
```json
{
  "id": "dq-engineer-f-body",
  "type": "character-body-sprite",
  "archetype": "engineer",
  "gender": "female",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no goggles — neutral scalp",
    "face": "angular jaw, grease smudge on cheek, bright determined eyes, freckles across nose"
  },
  "clothing": {
    "body": "fitted leather work vest over dark navy tank top, vest has riveted tool loops, brass-buckle utility harness across chest (X-pattern), rolled blueprints tucked in back harness",
    "lowBody": "reinforced dark grey work shorts (above knee), multiple pockets with bulging contents, leather tool belt slung low on hip",
    "arms": "left forearm has brass mechanical bracer, right arm bare with bandage wrap at elbow (work injury), both arms grease-stained",
    "legs": "mismatched knee guards — left brass-plated, right leather-wrapped, copper wire coiled around right calf",
    "shoes": "steel-toed work boots (shorter), brass toe plate, laces replaced with wire"
  },
  "colorPattern": {
    "primary": "#2a2a3e (dark navy work clothes)",
    "secondary": "#5c4a3a (leather brown vest)",
    "accent": "#00d4ff (cyan crystal glow)",
    "skin": "#f0dcc0 (pale/fair)",
    "metal": "#b08d57 (brass tools)",
    "soot": "#3a3a3a (dark grey grease stains)"
  },
  "expression": "cocky smirk, head tilted, eyes sizing you up"
}
```

**Hair:**
```json
{
  "id": "dq-engineer-f-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + welding goggles, transparent elsewhere",
  "description": "short choppy auburn hair, soot-streaked, swept to one side with undercut visible on right, welding goggles pushed up on forehead (round lens, brass frame, one lens cracked, leather strap)",
  "colorPattern": {
    "hair": "#8b4513 (auburn)",
    "goggles": "#b08d57 (brass frame)",
    "strap": "#5c4a3a (leather brown)",
    "lens": "#c0c0c0 (silver with crack line)"
  }
}
```

**Weapon:**
```json
{
  "id": "dq-engineer-f-weapon",
  "type": "weapon-sprite",
  "name": "oversized steam-wrench",
  "material": "heavy iron wrench head, brass handle with leather grip, cyan crystal in jaw",
  "pose": "displayed upright, transparent background",
  "colorPattern": {
    "head": "#555555 (iron)",
    "handle": "#b08d57 (brass)",
    "crystal": "#00d4ff (cyan glow)",
    "steam": "#e0e0e0 (white wisp)"
  }
}
```

---

## 3. Thien Lu (TL) — Celestial Nomads

**Civ identity:** Celestial/astral aesthetic, flowing fabrics, starlight patterns, midnight blues + aquamarine accents.
**Archetypes:** Dual Blade (swift melee assassin) + Philosopher (cosmic sage/support)
**Status:** Phase 2 priority — spec reference only.

### 3.1 TL-Dual-Blade (Male)

<!-- id: tl-dual-blade-m | civ: Thien Lu | role: Swift Melee Assassin -->

**Body (bald):**
```json
{
  "id": "tl-dual-blade-m-body",
  "type": "character-body-sprite",
  "archetype": "dual-blade",
  "gender": "male",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no circlet — neutral scalp",
    "face": "dark skin, strong features, tribal star tattoo under left eye (3-point star)"
  },
  "clothing": {
    "body": "open-front midnight blue vest over wrapped chest bindings, constellation patterns embroidered in silver thread on vest back, loose silk sash at waist tied to side",
    "lowBody": "flowing harem-style pants (midnight blue), gathered at ankles, silver thread star pattern along outer seam",
    "arms": "bare upper arms with silver star-brand tattoos (Gemini constellation), forearm wraps of deep purple cloth with aquamarine gemstone clasps",
    "legs": "light silver chain anklets over wrap-gathered pant cuffs",
    "shoes": "soft leather sandals with toe loop, minimal footprint"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#4a3f5c (purple-grey)",
    "accent": "#7fffd4 (aquamarine glow)",
    "skin": "#6b4423 (dark brown)",
    "metal": "#c0c0c0 (silver)"
  },
  "expression": "serene intensity, focused gaze"
}
```

**Hair:**
```json
{
  "id": "tl-dual-blade-m-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + circlet, transparent elsewhere",
  "description": "long silver-white locs/dreads, partially tied back, beaded with tiny star-shaped charms, crescent moon circlet (thin silver band) across forehead",
  "colorPattern": {
    "hair": "#e8e8e8 (silver-white)",
    "circlet": "#c0c0c0 (silver band)",
    "charms": "#7fffd4 (aquamarine star beads)"
  }
}
```

**Weapon:**
```json
{
  "id": "tl-dual-blade-m-weapon",
  "type": "weapon-sprite",
  "name": "twin curved daggers — linh dao (spirit blades)",
  "material": "dark steel blades with aquamarine edge glow, crescent moon shaped, wrapped leather handles with star pommel",
  "pose": "displayed as a pair crossed at center, transparent background",
  "colorPattern": {
    "blade": "#3a3a4e (dark steel)",
    "edge_glow": "#7fffd4 (aquamarine luminance)",
    "handle": "#4a3f5c (wrapped leather)",
    "pommel": "#c0c0c0 (silver star-shaped)"
  }
}
```

---

### 3.2 TL-Dual-Blade (Female)

<!-- id: tl-dual-blade-f | civ: Thien Lu | role: Swift Melee Assassin -->

**Body (bald):**
```json
{
  "id": "tl-dual-blade-f-body",
  "type": "character-body-sprite",
  "archetype": "dual-blade",
  "gender": "female",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no circlet — neutral scalp",
    "face": "dark skin, sharp elegant features, tribal crescent moon tattoo under right eye, aquamarine lip tint"
  },
  "clothing": {
    "body": "fitted midnight blue crop wrap (yếm-style, celestial), silver constellation embroidery across back, asymmetric — bare right shoulder, left shoulder has flowing sleeve cape (trail-like), silk waist sash tied to left hip with flowing tail",
    "lowBody": "midnight blue split skirt over fitted leggings (thigh-high slit on both sides for mobility), silver star pattern along edges",
    "arms": "bare right arm with silver star-brand tattoos (Gemini), left arm covered by sleeve cape to elbow then bare forearm with deep purple wrap and aquamarine clasp",
    "legs": "silver chain anklet on right ankle, left leg has thin throwing-knife holster strapped to outer thigh",
    "shoes": "soft leather sandals with toe loop, minimal"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#4a3f5c (purple-grey)",
    "accent": "#7fffd4 (aquamarine glow + pendant)",
    "skin": "#6b4423 (dark brown)",
    "metal": "#c0c0c0 (silver)"
  },
  "expression": "cold confidence, half-lidded eyes, slight head tilt"
}
```

**Hair:**
```json
{
  "id": "tl-dual-blade-f-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + circlet + pendant, transparent elsewhere",
  "description": "long silver-white hair in high ponytail, two thin braids framing face, star-shaped charms woven into braids, crescent moon circlet (thin silver band) across forehead with single aquamarine drop pendant at center",
  "colorPattern": {
    "hair": "#e8e8e8 (silver-white)",
    "circlet": "#c0c0c0 (silver)",
    "pendant": "#7fffd4 (aquamarine drop)",
    "charms": "#c0c0c0 (silver star beads)"
  }
}
```

**Weapon:**
```json
{
  "id": "tl-dual-blade-f-weapon",
  "type": "weapon-sprite",
  "name": "twin curved daggers — linh dao",
  "material": "dark steel blades with aquamarine edge glow, wrapped leather handles, star pommel",
  "pose": "displayed as a pair crossed at center, transparent background",
  "colorPattern": {
    "blade": "#3a3a4e (dark steel)",
    "edge_glow": "#7fffd4 (aquamarine)",
    "handle": "#4a3f5c (wrapped leather)",
    "pommel": "#c0c0c0 (silver star)"
  }
}
```

---

### 3.3 TL-Philosopher (Male)

<!-- id: tl-philosopher-m | civ: Thien Lu | role: Cosmic Sage/Support -->

**Body (bald):**
```json
{
  "id": "tl-philosopher-m-body",
  "type": "character-body-sprite",
  "archetype": "philosopher",
  "gender": "male",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no diadem — neutral scalp, faint celestial rune markings remain on cheeks (subtle, luminous)",
    "face": "androgynous features, dark skin, glowing aquamarine irises"
  },
  "clothing": {
    "body": "layered flowing robes — outer robe midnight blue with silver constellation embroidery (Orion, Lyra visible), inner robe deep purple, wide cloth belt with pouch for star charts, multiple scrolls tucked into belt",
    "lowBody": "robes reach ankles, split at front for mobility, dark leggings beneath",
    "arms": "wide sleeves with aquamarine trim at cuffs, left wrist has silver astrolabe bracelet (spinning dials), right hand has luminous rune circles floating around fingers (2-3 translucent rings)",
    "legs": "hidden beneath robes",
    "shoes": "barefoot (soles faintly glow aquamarine)"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#301050 (deep purple inner robe)",
    "accent": "#7fffd4 (aquamarine glow)",
    "skin": "#5a3a1a (deep brown)",
    "glow": "#7fffd4 soft bloom around hands"
  },
  "expression": "otherworldly calm, faint knowing smile, eyes glow softly"
}
```

**Hair:**
```json
{
  "id": "tl-philosopher-m-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + diadem + floating crystal, transparent elsewhere",
  "description": "long flowing white hair, unbound, reaches mid-back, moves as if weightless (zero-gravity feel), thin silver diadem with suspended aquamarine crystal floating 1px above forehead connected by light threads",
  "colorPattern": {
    "hair": "#f5f5f5 (pure white)",
    "diadem": "#c0c0c0 (silver thin band)",
    "crystal": "#7fffd4 (aquamarine suspended)",
    "threads": "#e8f4ff (faint light connection)"
  }
}
```

**Weapon:**
```json
{
  "id": "tl-philosopher-m-weapon",
  "type": "weapon-sprite",
  "name": "celestial focus staff — gay tinh (star staff)",
  "material": "dark petrified wood shaft, crescent moon headpiece cradling floating aquamarine orb, silver wire wrapping, small constellation map etched into shaft",
  "pose": "displayed upright, transparent background, orb glowing at top",
  "colorPattern": {
    "shaft": "#3a2a1a (dark petrified wood)",
    "headpiece": "#c0c0c0 (silver crescent)",
    "orb": "#7fffd4 (aquamarine pulsing)",
    "wire_wrap": "#c0c0c0 (silver wire)"
  }
}
```

---

### 3.4 TL-Philosopher (Female)

<!-- id: tl-philosopher-f | civ: Thien Lu | role: Cosmic Sage/Support -->

**Body (bald):**
```json
{
  "id": "tl-philosopher-f-body",
  "type": "character-body-sprite",
  "archetype": "philosopher",
  "gender": "female",
  "pose": "standing upright, A-pose, facing forward",
  "head": {
    "shape": "bald/shaved clean head, no hair, no tiara — neutral scalp, faint celestial rune markings remain on forehead and bridge of nose (luminous dots)",
    "face": "dark skin, soft androgynous features, glowing aquamarine irises"
  },
  "clothing": {
    "body": "flowing layered robes — outer robe midnight blue, open front revealing deep purple inner wrap dress, silver constellation embroidery (Lyra, Cassiopeia on shoulders), high wrapped collar frames neck, wide cloth belt at natural waist with moon-phase buckle, star chart scrolls tucked at hip",
    "lowBody": "robes reach ankles, inner dress form-fitting to knee then flares, split at front",
    "arms": "left sleeve wide and flowing, right sleeve cut short at elbow revealing bare forearm with silver astrolabe bracelet and luminous rune rings (2 translucent rings orbit wrist), silver bangles (3) on right upper arm",
    "legs": "hidden beneath robes, faint glow at hem",
    "shoes": "barefoot (soles glow aquamarine)"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#301050 (deep purple inner dress)",
    "accent": "#7fffd4 (aquamarine glow)",
    "skin": "#5a3a1a (deep brown)",
    "glow": "#7fffd4 soft bloom around hands"
  },
  "expression": "ethereal serenity, gentle knowing smile"
}
```

**Hair:**
```json
{
  "id": "tl-philosopher-f-hair",
  "type": "character-hair-sprite",
  "canvas": "128x128, same head anchor as body sprite",
  "content": "hair + tiara + floating crystals + star motes, transparent elsewhere",
  "description": "very long flowing white hair, loose and unbound, adorned with tiny floating star motes (3-4 dots of light), hair drifts upward as if underwater, silver tiara with 3 suspended aquamarine crystals floating in arc above head connected by faint light threads",
  "colorPattern": {
    "hair": "#f5f5f5 (pure white)",
    "tiara": "#c0c0c0 (silver)",
    "crystals": "#7fffd4 (aquamarine — 3)",
    "motes": "#e8f4ff (faint light dots)"
  }
}
```

**Weapon:**
```json
{
  "id": "tl-philosopher-f-weapon",
  "type": "weapon-sprite",
  "name": "celestial focus staff — gay tinh",
  "material": "dark petrified wood shaft, crescent moon headpiece with floating aquamarine orb, silver wire wrapping",
  "pose": "displayed upright, transparent background",
  "colorPattern": {
    "shaft": "#3a2a1a (dark petrified wood)",
    "headpiece": "#c0c0c0 (silver crescent)",
    "orb": "#7fffd4 (aquamarine pulsing)",
    "wire_wrap": "#c0c0c0 (silver wire)"
  }
}
```

---

## 4. Generation Notes

### Generation order
1. **Phase 1 — LS body sprites (4 archetypes)** → regenerate full animation sets (walking, running, battle-idle, attack, blocking, woodcutting) × 4 directions × 8 frames with **bald head** prompt. Replaces existing `/sprites/characters/LS-*/animations/`.
2. **Phase 1 — LS hair sprites (4 archetypes × 4 dirs = 16 PNGs)** → static, no animation.
3. **Phase 1 — LS weapons** → already exist/unchanged.
4. **Phase 2** — repeat for DQ and TL after LS validation.

### Head anchor tuning
- After generating body + hair for each archetype, measure head-Y pixel offset in south-facing frame
- Store in `src/scene/head-anchor-data.ts` as `{ archetypeId: { hairYOffset: number, hairScale: number } }`
- Tune visually via debug overlay before committing

### Hair variant pool (future extension)
- Start with 1 canonical hair per archetype (matches original art direction above)
- Add alternative hair assets later (topknot-b, loose-long, shaved, warrior-braid...) as **new hair IDs** in shared pool
- Color variants via shader tint — no new assets needed
- Data model: `member.hairId: string`, `member.hairTint: hex`

### Constraints
- Body sprite MUST be fully bald — any hair leaked in will clip through overlay
- Hair sprite MUST be ONLY hair + headgear pixels, rest transparent — any face/shoulder pixels will double-render
- Body and hair MUST use same canvas size and head anchor — use same PixelLab prompt scaffold for pose/framing

---

## Unresolved Questions

1. PixelLab character generator có giữ **consistent body across frames** khi chỉ thay đổi hair prompt không? → Cần POC 1 archetype LS-SCOUT-M trước khi commit full regenerate
2. Hair sprite có cần generate riêng per direction (north/south/east/west) không, hay generate 1 front view rồi flip/transform? → Per direction là an toàn nhất (ponytail, braid trông khác giữa front/back/side)
3. DQ-Scholar có spectacles cứng vào face — tách sang hair layer hay giữ trong body? → Đã chọn tách (dễ đổi variant cận/không cận)
4. Rune markings của TL-Philosopher (cheeks/forehead) — tách sang hair layer hay giữ trong body? → Đã chọn **giữ trong body** (markings là face tattoo, không đổi theo hair)
