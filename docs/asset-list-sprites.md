# Asset List — Sprites & Icons

> JSON prompts for AI image generation. All sprites share a unified pixel art style.
> Generated: 2026-03-21

## Global Style Guide

```json
{
  "globalStyle": {
    "format": "pixel art",
    "resolution": "48x48",
    "palette": "limited 16-color per sprite",
    "outline": "1px black outline, anti-aliased edges",
    "shading": "2-tone shading (base + shadow), no dithering",
    "perspective": "3/4 top-down isometric (HD-2D style)",
    "background": "transparent",
    "fileFormat": "PNG with alpha channel"
  },
  "iconStyle": {
    "resolution": "32x32",
    "border": "1px rounded (2px corner radius)",
    "shading": "flat with subtle inner glow",
    "background": "dark gradient (#1a1a2e to #2d2d44)",
    "consistency": "same stroke weight, same shadow direction (bottom-right)"
  }
}
```

---

## 1. Character Sprites (12 total)

> Each civilization has 2 unique archetypes reflecting its cultural identity.
> No shared archetypes — every archetype is exclusive to its civilization.

### 1.1 Linh Son (LS) — Ancient Mountain Warriors

**Civ identity:** Chiến binh cổ đại bám rễ vào núi rừng. Earth-tone palette, traditional Vietnamese armor, stone/wood motifs, sturdy build.
**Archetypes:** Warrior (tank/melee) + Scout (ranged/agile)

#### LS-Warrior

<!-- id: ls-warrior | type: character-sprite | civilization: Linh Son | role: Tank / Melee DPS — frontline berserker rooted in mountain strength | emblem: mountain peak silhouette with 3 peaks, tattooed on right pectoral -->

```json
{
  "archetype": "warrior",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "short black hair tied in topknot (bun)",
    "face": "square jaw, thick eyebrows, weathered skin (tan)",
    "headgear": "bronze headband with mountain crest engraving"
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

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "ls-warrior",
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

#### LS-Warrior (Female)

<!-- id: ls-warrior-f | type: character-sprite | civilization: Linh Son | role: Tank / Melee DPS — frontline berserker rooted in mountain strength | emblem: mountain peak silhouette with 3 peaks, tattooed on right shoulder blade -->

```json
{
  "archetype": "warrior",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "long black hair in high warrior bun, two loose strands framing face",
    "face": "strong cheekbones, fierce narrow eyes, warm tan skin",
    "headgear": "bronze circlet with mountain crest engraving, thinner than male variant"
  },
  "clothing": {
    "body": "bronze-dyed chest wrap (yếm-style — crossed front, tied at back), bronze drum tattoo on right shoulder blade, left arm has leather pauldron",
    "lowBody": "dark ochre wrap skirt (knee-length), reinforced at hips with leather strips, slit on right side for mobility",
    "arms": "bare forearms with Đông Sơn wave-band tattoos, stone-studded leather bracers on both wrists",
    "legs": "bare legs, shin guards made of carved wood plating (matching male)",
    "shoes": "straw-soled sandals with ankle straps (Vietnamese dep guoc inspired)"
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

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "ls-warrior-f",
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

#### LS-Scout

<!-- id: ls-scout | type: character-sprite | civilization: Linh Son | role: Ranged / Tracker — jungle hunter, ambush specialist, terrain reader | emblem: Đông Sơn sun spiral (small) — on bronze quiver clasp -->

```json
{
  "archetype": "scout",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "black hair tied back tightly, short topknot with loose strands",
    "face": "lean angular features, narrow eyes, dark geometric tattoo lines on cheeks (Lạc Việt xăm mình tradition)",
    "headgear": "feathered headdress — 3 white crane feathers bound with indigo cloth wrap at base, tilted slightly back"
  },
  "clothing": {
    "body": "bare chest with dark spiral tattoos (Đông Sơn sun motif on sternum, wave-bands wrapping ribs), single diagonal strap for bamboo quiver across chest, small bronze medallion clasp at shoulder",
    "lowBody": "indigo-dyed wrap skirt (mid-thigh length, single wrap), tied with woven hemp cord belt, small bone-toggle pouches on belt (2)",
    "arms": "bare forearms with geometric band tattoos (3 rings), simple cord bracelet with animal teeth on left wrist, right arm fully bare",
    "legs": "bare legs with spiral tattoo bands above ankles",
    "shoes": "barefoot (mud-stained soles visible in side view)"
  },
  "colorPattern": {
    "primary": "#2c3e50 (deep indigo, natural dye)",
    "secondary": "#8B6914 (dark gold/bronze)",
    "accent": "#D4A017 (bright bronze)",
    "skin": "#c49a6c (warm tan, tattoos #1a1a1a black)",
    "metal": "#8c7853 (bronze medallion/trigger)"
  },
  "expression": "alert, focused, eyes scanning — predator patience"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "ls-scout",
  "name": "compact crossbow — nỏ (Vietnamese bronze-age crossbow)",
  "material": "mulberry wood frame, bronze trigger mechanism, sinew string",
  "pose": "displayed horizontally, isolated on transparent background, slight angle to show depth",
  "colorPattern": {
    "frame": "#5c4033 (mulberry wood)",
    "trigger": "#8c7853 (bronze mechanism)",
    "string": "#e8dcc8 (sinew — off-white)",
    "quiver": "#c49a6c (bamboo tan — arrow quiver)"
  }
}
```

#### LS-Scout (Female)

<!-- id: ls-scout-f | type: character-sprite | civilization: Linh Son | role: Ranged / Tracker — jungle hunter, ambush specialist, terrain reader | emblem: Đông Sơn sun spiral (small) — tattooed behind left ear -->

```json
{
  "archetype": "scout",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "long black hair in single thick braid down back, woven with thin vine cord",
    "face": "sharp angular features, almond eyes, dark geometric tattoo dots under eyes (3 per side, Lạc Việt xăm mình)",
    "headgear": "2 white crane feathers tucked into hair braid, indigo cloth headband across forehead"
  },
  "clothing": {
    "body": "indigo-dyed chest wrap (yếm-style — single layer, tied at nape), Đông Sơn spiral tattoo visible on upper back and collarbone, diagonal bamboo quiver strap across chest, bronze clasp at left shoulder",
    "lowBody": "shorter indigo wrap skirt (above-knee, double-wrapped for tightness), hemp cord belt with bone-toggle pouch (1) and dried herb bundle",
    "arms": "bare arms with geometric band tattoos (2 rings on left upper arm), woven vine bracelet on right wrist with single animal fang pendant",
    "legs": "bare legs with small spiral tattoo on left ankle",
    "shoes": "barefoot (clean, nimble stance — lighter build than male)"
  },
  "colorPattern": {
    "primary": "#2c3e50 (deep indigo, natural dye)",
    "secondary": "#8B6914 (dark gold/bronze)",
    "accent": "#D4A017 (bright bronze)",
    "skin": "#c49a6c (warm tan, tattoos #1a1a1a black)",
    "metal": "#8c7853 (bronze clasp/trigger)"
  },
  "expression": "calm focus, slight head tilt — listening to forest sounds"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "ls-scout-f",
  "name": "compact crossbow — nỏ (Vietnamese bronze-age crossbow)",
  "material": "mulberry wood frame, bronze trigger mechanism, sinew string",
  "pose": "displayed horizontally, isolated on transparent background, slight angle to show depth",
  "colorPattern": {
    "frame": "#5c4033 (mulberry wood)",
    "trigger": "#8c7853 (bronze mechanism)",
    "string": "#e8dcc8 (sinew — off-white)",
    "quiver": "#c49a6c (bamboo tan — arrow quiver)"
  }
}
```

---

### 1.2 De Quoc (DQ) — Electro-Steam Empire

**Civ identity:** Nền văn minh hiện đại tái sinh thành đế chế điện-hơi nước-kính thép. Steampunk/electropunk aesthetic, brass/steel/glass, cyan energy accents, industrial Victorian.
**Archetypes:** Scholar (arcane-tech caster) + Engineer (gadgeteer/builder)

#### DQ-Scholar

<!-- id: dq-scholar | type: character-sprite | civilization: De Quoc | role: Arcane-Tech Caster — researches forbidden tech-magic, channels electric energy through codex | emblem: gear-and-lightning crest on lapel pin (small, polished brass) -->

```json
{
  "archetype": "scholar",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "slicked-back dark hair with silver streaks at temples",
    "face": "thin face, spectacles with round brass frames, sharp cheekbones",
    "headgear": "none (spectacles serve as identifier)"
  },
  "clothing": {
    "body": "long dark navy lab coat over waistcoat, brass buttons, high collar with cyan trim, multiple pen loops on breast pocket, belt with vial holders (3 glass vials with glowing cyan liquid)",
    "lowBody": "formal dark grey trousers, creased",
    "arms": "coat sleeves rolled to reveal forearm-mounted device (brass armband with rotating dials and small tesla coil), other arm has leather writing glove",
    "legs": "no additional armor, trousers only",
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

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "dq-scholar",
  "name": "arcane-tech codex — floating grimoire",
  "material": "leather-bound tome with brass corner brackets, pages glow faintly cyan, small chain at spine",
  "pose": "displayed open at slight angle, isolated on transparent background, pages facing viewer",
  "colorPattern": {
    "cover": "#1a1a2e (dark navy leather)",
    "brackets": "#b08d57 (brass corners)",
    "pages": "#e8f4ff (off-white with cyan glow)",
    "glow": "#00d4ff (cyan page luminance)"
  }
}
```

#### DQ-Scholar (Female)

<!-- id: dq-scholar-f | type: character-sprite | civilization: De Quoc | role: Arcane-Tech Caster — researches forbidden tech-magic, channels electric energy through codex | emblem: gear-and-lightning crest on collar brooch (polished brass) -->

```json
{
  "archetype": "scholar",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "dark hair in neat low chignon with brass hairpins, silver streak in front bangs",
    "face": "sharp features, pince-nez spectacles with brass chain to collar, defined brows",
    "headgear": "none (pince-nez + hairpins serve as identifiers)"
  },
  "clothing": {
    "body": "fitted dark navy frock coat (waist-length, not long), high mandarin collar with cyan piping, brass toggle closures down front, leather corset belt with vial holders (3 glass vials — cyan glow), small epaulettes with gear emblems",
    "lowBody": "dark grey A-line skirt over leggings (knee-length), practical split-front for mobility",
    "arms": "coat sleeves tapered, left forearm has brass armband device (rotating dials + mini tesla coil — matching male), right hand has fingerless leather glove with conductive brass knuckle pads",
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
  "expression": "composed, piercing gaze, one brow slightly raised — intellectual authority"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "dq-scholar-f",
  "name": "arcane-tech codex — floating grimoire",
  "material": "leather-bound tome with brass corner brackets, pages glow faintly cyan, small chain at spine",
  "pose": "displayed open at slight angle, isolated on transparent background, pages facing viewer",
  "colorPattern": {
    "cover": "#1a1a2e (dark navy leather)",
    "brackets": "#b08d57 (brass corners)",
    "pages": "#e8f4ff (off-white with cyan glow)",
    "glow": "#00d4ff (cyan page luminance)"
  }
}
```

#### DQ-Engineer

<!-- id: dq-engineer | type: character-sprite | civilization: De Quoc | role: Gadgeteer / Field Mechanic — builds turrets, deploys traps, repairs allies' gear mid-combat | emblem: gear-and-lightning crest stamped into leather apron chest pocket (partially hidden by blueprints) -->

```json
{
  "archetype": "engineer",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "messy auburn hair, soot-streaked, partially hidden under cap",
    "face": "round cheeks, grease smudge on nose, bright eager eyes, freckles",
    "headgear": "leather flat cap (newsboy style) with brass goggles pushed up, lens tinted amber, one lens has magnification flip-up"
  },
  "clothing": {
    "body": "heavy leather apron over dark navy work shirt (sleeves rolled up), apron has multiple tool loops (pliers, wire cutters, small hammer visible), brass-buttoned suspenders under apron, chest pocket overflows with blueprints (rolled paper sticking out)",
    "lowBody": "reinforced dark grey cargo pants, multiple deep pockets with bulging contents (bolts, springs, gears), leather knee patches (burn-scarred)",
    "arms": "left forearm has a brass mechanical bracer (built-in multitool — mini screwdriver, wire stripper, spark igniter), right arm has thick leather welding glove (only on right hand), both arms have soot/grease stains",
    "legs": "brass-plated shin guards (self-made, asymmetric, slightly crude), copper wire wrapped around left ankle (spare parts)",
    "shoes": "heavy steel-toed work boots, scuffed, brass toe plate, laces replaced with copper wire"
  },
  "colorPattern": {
    "primary": "#2a2a3e (dark navy work clothes)",
    "secondary": "#5c4a3a (leather brown apron)",
    "accent": "#00d4ff (cyan crystal glow on bracer)",
    "skin": "#f0dcc0 (pale/fair, grease-smudged)",
    "metal": "#b08d57 (brass tools/goggles)",
    "soot": "#3a3a3a (dark grey grease stains on arms and face)"
  },
  "expression": "enthusiastic, cocky half-grin, one eye squinting (assessing something to fix)"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "dq-engineer",
  "name": "oversized steam-wrench — dual-purpose tool/weapon",
  "material": "heavy iron wrench head with built-in steam pressure valve (small gauge visible), brass handle with leather grip, exhaust port at base, small cyan crystal embedded in wrench jaw",
  "pose": "displayed upright, isolated on transparent background, slight angle to show valve detail",
  "colorPattern": {
    "head": "#555555 (heavy iron)",
    "handle": "#b08d57 (brass with leather grip)",
    "crystal": "#00d4ff (cyan glow — embedded in jaw)",
    "steam": "#e0e0e0 (faint white wisp from exhaust port)"
  }
}
```

#### DQ-Engineer (Female)

<!-- id: dq-engineer-f | type: character-sprite | civilization: De Quoc | role: Gadgeteer / Field Mechanic — builds turrets, deploys traps, repairs allies' gear mid-combat | emblem: gear-and-lightning crest — brass pin on vest collar -->

```json
{
  "archetype": "engineer",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "short choppy auburn hair, soot-streaked, swept to one side, undercut visible on right",
    "face": "angular jaw, grease smudge on cheek, bright determined eyes, freckles across nose",
    "headgear": "welding goggles pushed up on forehead (round lens, brass frame), one lens cracked, leather strap"
  },
  "clothing": {
    "body": "fitted leather work vest over dark navy tank top, vest has riveted tool loops (pliers, wire cutters visible), brass-buckle utility harness across chest (X-pattern), rolled blueprints tucked in back harness",
    "lowBody": "reinforced dark grey work shorts (above knee), multiple pockets with bulging contents (springs, gears), leather tool belt slung low on hip",
    "arms": "left forearm has brass mechanical bracer (built-in multitool — matching male), right arm bare with bandage wrap at elbow (work injury), both arms grease-stained",
    "legs": "mismatched knee guards — left is brass-plated (polished), right is leather-wrapped (improvised), copper wire coiled around right calf (spare parts)",
    "shoes": "steel-toed work boots (shorter than male), brass toe plate, laces replaced with wire"
  },
  "colorPattern": {
    "primary": "#2a2a3e (dark navy work clothes)",
    "secondary": "#5c4a3a (leather brown vest)",
    "accent": "#00d4ff (cyan crystal glow on bracer)",
    "skin": "#f0dcc0 (pale/fair, grease-smudged)",
    "metal": "#b08d57 (brass tools/goggles)",
    "soot": "#3a3a3a (dark grey grease stains on arms and face)"
  },
  "expression": "cocky smirk, head tilted, eyes sizing you up — 'I can fix that'"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "dq-engineer-f",
  "name": "oversized steam-wrench — dual-purpose tool/weapon",
  "material": "heavy iron wrench head with steam pressure valve, brass handle with leather grip, cyan crystal embedded in wrench jaw",
  "pose": "displayed upright, isolated on transparent background, slight angle to show valve detail",
  "colorPattern": {
    "head": "#555555 (heavy iron)",
    "handle": "#b08d57 (brass with leather grip)",
    "crystal": "#00d4ff (cyan glow — embedded in jaw)",
    "steam": "#e0e0e0 (faint white wisp from exhaust port)"
  }
}
```

---

### 1.3 Thien Lu (TL) — Celestial Nomads

**Civ identity:** Du mục thần bí sống theo sao trời, mang theo cả bầu trời trong bước chân. Celestial/astral aesthetic, flowing fabrics, starlight patterns, midnight blues and aquamarine accents.
**Archetypes:** Dual Blade (swift melee assassin) + Philosopher (cosmic sage/support)

#### TL-Dual-Blade

<!-- id: tl-dual-blade | type: character-sprite | civilization: Thien Lu | role: Swift Melee Assassin — starlight-infused twin blades, high AGI dodge-fighter, strikes like a meteor | emblem: seven-pointed star (Sao Bac — North Star), woven into vest back center -->

```json
{
  "archetype": "dual-blade",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "long silver-white locs/dreads, partially tied back, beaded with tiny star-shaped charms",
    "face": "dark skin, strong features, tribal star tattoo under left eye (3-point star)",
    "headgear": "crescent moon circlet (thin silver band) across forehead"
  },
  "clothing": {
    "body": "open-front midnight blue vest over wrapped chest bindings, constellation patterns embroidered in silver thread on vest back, loose silk sash at waist tied to side",
    "lowBody": "flowing harem-style pants (midnight blue), gathered at ankles, silver thread star pattern along outer seam",
    "arms": "bare upper arms with silver star-brand tattoos (constellation of Gemini — twin motif), forearm wraps of deep purple cloth with aquamarine gemstone clasps",
    "legs": "light silver chain anklets over wrap-gathered pant cuffs",
    "shoes": "soft leather sandals with toe loop, minimal footprint (silent movement)"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#4a3f5c (purple-grey)",
    "accent": "#7fffd4 (aquamarine glow)",
    "skin": "#6b4423 (dark brown)",
    "metal": "#c0c0c0 (silver)"
  },
  "expression": "serene intensity, focused gaze, calm before storm"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "tl-dual-blade",
  "name": "twin curved daggers — linh dao (spirit blades)",
  "material": "dark steel blades with aquamarine edge glow, crescent moon shaped, wrapped leather handles with star-shaped pommel",
  "pose": "displayed as a pair crossed at center, isolated on transparent background",
  "colorPattern": {
    "blade": "#3a3a4e (dark steel)",
    "edge_glow": "#7fffd4 (aquamarine luminance along blade edge)",
    "handle": "#4a3f5c (wrapped leather)",
    "pommel": "#c0c0c0 (silver star-shaped)"
  }
}
```

#### TL-Dual-Blade (Female)

<!-- id: tl-dual-blade-f | type: character-sprite | civilization: Thien Lu | role: Swift Melee Assassin — starlight-infused twin blades, high AGI dodge-fighter, strikes like a meteor | emblem: seven-pointed star (small) — silver pendant on waist sash -->

```json
{
  "archetype": "dual-blade",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "long silver-white hair in high ponytail, two thin braids framing face, star-shaped charms woven into braids",
    "face": "dark skin, sharp elegant features, tribal crescent moon tattoo under right eye, aquamarine lip tint",
    "headgear": "crescent moon circlet (thin silver band) across forehead, single aquamarine drop pendant at center"
  },
  "clothing": {
    "body": "fitted midnight blue crop wrap (yếm-style but celestial), silver constellation embroidery across back, asymmetric — bare right shoulder, left shoulder has flowing sleeve cape (trail-like, moves as if weightless), silk waist sash tied to left hip with flowing tail",
    "lowBody": "midnight blue split skirt over fitted leggings (thigh-high slit on both sides for mobility), silver star pattern along edges",
    "arms": "bare right arm with silver star-brand tattoos (Gemini constellation — matching male), left arm covered by sleeve cape to elbow then bare forearm with deep purple wrap and aquamarine clasp",
    "legs": "silver chain anklet on right ankle, left leg has thin throwing-knife holster strapped to outer thigh",
    "shoes": "soft leather sandals with toe loop, minimal (matching male — silent movement)"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#4a3f5c (purple-grey)",
    "accent": "#7fffd4 (aquamarine glow + pendant)",
    "skin": "#6b4423 (dark brown)",
    "metal": "#c0c0c0 (silver)"
  },
  "expression": "cold confidence, half-lidded eyes, slight head tilt — 'already behind you'"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "tl-dual-blade-f",
  "name": "twin curved daggers — linh dao (spirit blades)",
  "material": "dark steel blades with aquamarine edge glow, crescent moon shaped, wrapped leather handles with star pommel",
  "pose": "displayed as a pair crossed at center, isolated on transparent background",
  "colorPattern": {
    "blade": "#3a3a4e (dark steel)",
    "edge_glow": "#7fffd4 (aquamarine luminance along blade edge)",
    "handle": "#4a3f5c (wrapped leather)",
    "pommel": "#c0c0c0 (silver star-shaped)"
  }
}
```

#### TL-Philosopher

<!-- id: tl-philosopher | type: character-sprite | civilization: Thien Lu | role: Cosmic Sage / Support — reads star patterns to buff allies, debuff enemies, channels celestial energy through astrolabe | emblem: seven-pointed star radiating light, center of outer robe back, silver thread on midnight blue -->

```json
{
  "archetype": "philosopher",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "long flowing white hair, unbound, reaches mid-back, moves as if weightless (zero-gravity feel)",
    "face": "androgynous features, dark skin, glowing aquamarine irises, celestial rune markings on cheeks (subtle, luminous)",
    "headgear": "thin silver diadem with suspended aquamarine crystal (floats 1px above forehead, connected by light threads)"
  },
  "clothing": {
    "body": "layered flowing robes — outer robe midnight blue with silver constellation embroidery (actual star patterns: Orion, Lyra visible), inner robe deep purple, wide cloth belt with pouch for star charts, multiple scrolls tucked into belt",
    "lowBody": "robes reach ankles, split at front for mobility, dark leggings beneath",
    "arms": "wide sleeves with aquamarine trim at cuffs, left wrist has silver astrolabe bracelet (functional, spinning dials — serves as focus), right hand has luminous rune circles floating around fingers (2-3 translucent rings)",
    "legs": "hidden beneath robes",
    "shoes": "barefoot (soles faintly glow aquamarine on contact with ground)"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#301050 (deep purple inner robe)",
    "accent": "#7fffd4 (aquamarine glow — runes, footprints, diadem crystal)",
    "skin": "#5a3a1a (deep brown)",
    "glow": "#7fffd4 with soft bloom effect around hands"
  },
  "expression": "otherworldly calm, faint knowing smile, eyes glow softly with starlight"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "tl-philosopher",
  "name": "celestial focus staff — gay tinh (star staff)",
  "material": "dark petrified wood shaft, crescent moon headpiece cradling floating aquamarine orb, silver wire wrapping, small constellation map etched into shaft",
  "pose": "displayed upright, isolated on transparent background, orb glowing at top",
  "colorPattern": {
    "shaft": "#3a2a1a (dark petrified wood)",
    "headpiece": "#c0c0c0 (silver crescent moon)",
    "orb": "#7fffd4 (aquamarine — pulsing glow)",
    "wire_wrap": "#c0c0c0 (silver wire wrapping)"
  }
}
```

#### TL-Philosopher (Female)

<!-- id: tl-philosopher-f | type: character-sprite | civilization: Thien Lu | role: Cosmic Sage / Support — reads star patterns to buff allies, debuff enemies, channels celestial energy through astrolabe | emblem: seven-pointed star — embroidered large on outer robe back, silver thread, radiating light lines -->

```json
{
  "archetype": "philosopher",
  "gender": "female",
  "pose": "standing upright, arms spread at shoulder width (A-pose), feet slightly apart, facing forward — animation reference frame",
  "head": {
    "hair": "very long flowing white hair, loose and unbound, adorned with tiny floating star motes (3-4 dots of light), hair drifts upward as if underwater",
    "face": "dark skin, soft androgynous features, glowing aquamarine irises, celestial rune markings on forehead and bridge of nose (luminous dots — constellation pattern)",
    "headgear": "silver tiara with 3 suspended aquamarine crystals (float in arc above head, connected by faint light threads)"
  },
  "clothing": {
    "body": "flowing layered robes — outer robe midnight blue, open front revealing deep purple inner wrap dress, silver constellation embroidery (Lyra and Cassiopeia visible on shoulders), high wrapped collar frames neck, wide cloth belt at natural waist with moon-phase buckle, star chart scrolls tucked at hip",
    "lowBody": "robes reach ankles, inner dress is form-fitting to knee then flares, split at front, bare feet visible beneath",
    "arms": "left sleeve wide and flowing (matches male), right sleeve cut short at elbow revealing bare forearm with silver astrolabe bracelet and luminous rune rings (2 translucent rings orbit wrist), silver bangles (3) on right upper arm",
    "legs": "hidden beneath robes, faint glow at hem",
    "shoes": "barefoot (soles glow aquamarine on ground contact)"
  },
  "colorPattern": {
    "primary": "#191970 (midnight blue)",
    "secondary": "#301050 (deep purple inner dress)",
    "accent": "#7fffd4 (aquamarine glow — runes, tiara crystals, footprints)",
    "skin": "#5a3a1a (deep brown)",
    "glow": "#7fffd4 with soft bloom around hands and floating hair motes"
  },
  "expression": "ethereal serenity, gentle knowing smile, eyes softly luminous — connected to cosmos"
}
```

**Weapon:**
```json
{
  "type": "weapon-sprite",
  "character": "tl-philosopher-f",
  "name": "celestial focus staff — gay tinh (star staff)",
  "material": "dark petrified wood shaft, crescent moon headpiece cradling floating aquamarine orb, silver wire wrapping",
  "pose": "displayed upright, isolated on transparent background, orb glowing at top",
  "colorPattern": {
    "shaft": "#3a2a1a (dark petrified wood)",
    "headpiece": "#c0c0c0 (silver crescent moon)",
    "orb": "#7fffd4 (aquamarine — pulsing glow)",
    "wire_wrap": "#c0c0c0 (silver wire wrapping)"
  }
}
```

---

## 2. Enemy Sprites (15 total)

### Global Enemy Style
```json
{
  "enemyStyle": {
    "resolution": "48x48 (bosses: 64x64)",
    "palette": "muted, desaturated compared to player characters",
    "outline": "1px dark outline (darker than character outlines — more menacing)",
    "shading": "2-tone with optional 3rd highlight for bosses",
    "pose": "aggressive idle (ready to attack)",
    "background": "transparent"
  }
}
```

### Level 1

```json
{
  "id": "slime",
  "type": "enemy-sprite",
  "name": "Slime",
  "level": 1,
  "boss": false,
  "resolution": "48x48",
  "body": "amorphous blob shape, round, jiggly (2-frame wobble), translucent body with darker core nucleus visible inside",
  "features": "2 simple dot eyes (white with black pupil), no mouth, small bubbles on surface (3-4 dots)",
  "colorPattern": {
    "body": "#7ec850 (lime green, translucent feel)",
    "core": "#3d6b1f (darker green nucleus)",
    "highlight": "#b8e986 (light green top highlight)",
    "shadow": "#2d5016 (dark green bottom shadow)"
  },
  "animation_hint": "idle wobble, squish vertically (2 frames)",
  "loot_visual": "drops gel puddle on defeat"
}
```

```json
{
  "id": "forest-spider",
  "type": "enemy-sprite",
  "name": "Forest Spider",
  "level": 1,
  "boss": false,
  "resolution": "48x48",
  "body": "compact arachnid, 4 visible legs (3/4 view hides back 4), round abdomen with chevron marking, small cephalothorax",
  "features": "6 red eyes (3 pairs, diminishing size), mandibles with visible drip (venom), hairy legs with barbs",
  "colorPattern": {
    "body": "#4a3728 (dark brown)",
    "abdomen_mark": "#8b4513 (reddish-brown chevron)",
    "eyes": "#ff3333 (red, glowing)",
    "legs": "#5c4033 (medium brown)",
    "venom_drip": "#90ee90 (pale green)"
  },
  "animation_hint": "legs shuffle, mandibles twitch",
  "special_visual": "poison-attack: green venom projectile arc"
}
```

### Level 2

```json
{
  "id": "goblin",
  "type": "enemy-sprite",
  "name": "Goblin",
  "level": 2,
  "boss": false,
  "resolution": "48x48",
  "body": "small humanoid (3/4 height of player), hunched posture, wiry build",
  "features": "large pointed ears, bulging yellow eyes, sharp-toothed grin, long crooked nose, patchy leather scraps as armor",
  "clothing": "ragged loincloth, one shoulder strap, crude belt with stolen trinkets",
  "weapon": "rusty short sword (chipped blade, wrapped handle)",
  "colorPattern": {
    "skin": "#6b8e23 (olive green)",
    "eyes": "#ffdd33 (yellow)",
    "clothing": "#5c4033 (dirty brown leather)",
    "weapon": "#8b7355 (rusty iron)"
  },
  "animation_hint": "bouncing on feet, weapon swaying",
  "special_visual": "poison-attack: throws venom pouch (green arc)"
}
```

```json
{
  "id": "bandit",
  "type": "enemy-sprite",
  "name": "Bandit",
  "level": 2,
  "boss": false,
  "resolution": "48x48",
  "body": "human-sized, lean build, hunched aggressive stance",
  "features": "face obscured by cloth mask (only eyes visible), stubble on chin, scar across bridge of nose",
  "clothing": "dark hooded cloak (torn hem), leather vest over dirty shirt, belt with coin purse, wrapped boots",
  "weapon": "curved dagger in right hand, small buckler on left forearm",
  "colorPattern": {
    "skin": "#c49a6c (tan)",
    "cloak": "#3a3a3a (charcoal)",
    "vest": "#5c4033 (brown leather)",
    "weapon": "#999999 (dull steel)"
  },
  "animation_hint": "shifting weight side-to-side, dagger twirling",
  "special_visual": "none"
}
```

```json
{
  "id": "cave-bat",
  "type": "enemy-sprite",
  "name": "Cave Bat",
  "level": 2,
  "boss": false,
  "resolution": "48x48",
  "body": "small winged creature, wingspan wider than body, membrane wings with visible finger bones",
  "features": "large pointed ears, tiny red eyes, open mouth showing fangs, fur tuft on chest",
  "colorPattern": {
    "body": "#3d3d5c (dark purple-grey)",
    "wing_membrane": "#4a4a6a (slightly lighter purple-grey, translucent feel)",
    "eyes": "#ff4444 (red pinpoints)",
    "ears_inner": "#8b6080 (pinkish-purple)"
  },
  "animation_hint": "flapping wings (2-frame cycle), hovering in place",
  "special_visual": "none — fast AGI represented by blur trail"
}
```

### Level 3

```json
{
  "id": "wolf",
  "type": "enemy-sprite",
  "name": "Wolf",
  "level": 3,
  "boss": false,
  "resolution": "48x48",
  "body": "quadruped canine, lean muscular build, hackles raised, low aggressive stance",
  "features": "amber eyes, bared fangs, pointed ears forward, bushy tail low, fur texture visible",
  "colorPattern": {
    "fur_primary": "#808080 (grey)",
    "fur_belly": "#b0b0b0 (light grey)",
    "fur_back": "#555555 (dark grey ridge line)",
    "eyes": "#daa520 (amber)",
    "nose_mouth": "#333333 (dark)"
  },
  "animation_hint": "low growl stance, slight head bob",
  "special_visual": "none"
}
```

```json
{
  "id": "wild-boar",
  "type": "enemy-sprite",
  "name": "Wild Boar",
  "level": 3,
  "boss": false,
  "resolution": "48x48",
  "body": "stocky quadruped, massive shoulders, low wide stance, bristly fur texture",
  "features": "small angry red eyes, upward-curving tusks (2, prominent), snorting steam from nostrils, thick hide with scars",
  "colorPattern": {
    "fur": "#6b4423 (dark brown)",
    "bristles": "#8b6914 (golden-brown highlights on back)",
    "tusks": "#f5f5dc (ivory/bone white)",
    "eyes": "#cc3333 (angry red)",
    "hooves": "#333333 (dark)"
  },
  "animation_hint": "pawing ground, snort particle (small white puff)",
  "special_visual": "enrage: red aura outline, eyes glow brighter"
}
```

```json
{
  "id": "slime-king",
  "type": "enemy-sprite",
  "name": "Slime King",
  "level": 3,
  "boss": false,
  "resolution": "48x48",
  "body": "larger slime (1.5x normal slime), crown embedded in gel body, smaller slime satellites orbit (2 tiny)",
  "features": "angry angled eyes (V-shaped brow), jagged mouth line, golden crown half-submerged in body, denser/less translucent than normal slime",
  "colorPattern": {
    "body": "#50a030 (deeper green than normal slime)",
    "core": "#2d6b1f (dark green, larger nucleus)",
    "crown": "#ffd700 (gold crown, 3 points visible)",
    "highlight": "#8ed860 (top shine)",
    "eyes": "#ffffff (white, angry)"
  },
  "animation_hint": "slower wobble than slime, crown bobs, satellite slimes orbit",
  "special_visual": "none — tanky (high END)"
}
```

### Level 4

```json
{
  "id": "goblin-shaman",
  "type": "enemy-sprite",
  "name": "Goblin Shaman",
  "level": 4,
  "boss": false,
  "resolution": "48x48",
  "body": "goblin-sized but hunched over staff, older/wrinkled appearance, bone jewelry",
  "features": "milky white left eye (blind), long drooping ears with bone piercings, tribal paint on face (white stripes), feathered headdress (3 crow feathers)",
  "clothing": "bone-and-bead necklace, tattered robe (dark green), potion gourds hanging from belt (2)",
  "weapon": "gnarled wooden staff topped with glowing green skull (small, goblin-sized)",
  "colorPattern": {
    "skin": "#5a7a1a (darker olive green — aged)",
    "robe": "#2d4a1a (dark green tattered)",
    "magic_glow": "#33ff66 (bright green healing aura)",
    "bones": "#e8dcc8 (bone white)",
    "feathers": "#1a1a1a (black crow)"
  },
  "animation_hint": "hunched sway, staff skull pulses green glow",
  "special_visual": "heal-ally: green particle spiral around target ally"
}
```

```json
{
  "id": "queen-spider",
  "type": "enemy-sprite",
  "name": "Queen Spider",
  "level": 4,
  "boss": true,
  "resolution": "64x64",
  "body": "massive spider (2x forest-spider), elongated abdomen with ornate natural markings (hourglass + web pattern), thicker armored legs",
  "features": "8 glowing red eyes (crown arrangement), massive dripping mandibles, egg sacs visible on abdomen underside, chitinous crown-like protrusions on head, web silk trailing from spinnerets",
  "colorPattern": {
    "body": "#2d1f14 (very dark brown, almost black)",
    "markings": "#8b0000 (crimson hourglass + web veins)",
    "eyes": "#ff0000 (bright red, glowing, 8 eyes)",
    "mandibles": "#5c4033 (brown with green venom drip)",
    "venom": "#7fff00 (chartreuse — brighter than normal spider)"
  },
  "animation_hint": "slow deliberate leg movement, mandibles click (2-frame), abdomen pulses",
  "special_visual": "poison-attack (30% chance): large venom spray (wider arc than forest-spider)",
  "boss_indicator": "subtle dark red aura outline, slightly larger than frame"
}
```

### Level 5

```json
{
  "id": "orc-warrior",
  "type": "enemy-sprite",
  "name": "Orc Warrior",
  "level": 5,
  "boss": false,
  "resolution": "48x48",
  "body": "large humanoid (1.3x player height), muscular, broad shouldered, standing upright with chest out",
  "features": "lower jaw tusks (2 upward), flat nose, heavy brow ridge, tribal war paint (red streaks under eyes), pointed ears",
  "clothing": "iron chainmail vest over bare green torso, leather war skirt with metal studs, metal shoulder pauldron (left only), bone trophy necklace",
  "weapon": "heavy iron battle-axe (single-head), wooden haft with leather grip",
  "colorPattern": {
    "skin": "#2d5a1a (dark green)",
    "armor": "#555555 (iron grey)",
    "war_paint": "#cc0000 (blood red)",
    "tusks": "#e8dcc8 (bone ivory)",
    "leather": "#4a3520 (dark brown)"
  },
  "animation_hint": "chest-forward stance, axe held ready at side",
  "special_visual": "none"
}
```

```json
{
  "id": "dire-wolf",
  "type": "enemy-sprite",
  "name": "Dire Wolf",
  "level": 5,
  "boss": false,
  "resolution": "48x48",
  "body": "massive wolf (1.5x normal wolf), more feral, spikier fur, scars across flank",
  "features": "glowing red eyes (distinct from normal wolf amber), exposed fangs with drool, torn left ear, darker mane ridge along spine",
  "colorPattern": {
    "fur_primary": "#3a3a3a (dark charcoal — darker than wolf)",
    "fur_mane": "#1a1a1a (black ridge)",
    "fur_belly": "#666666 (medium grey)",
    "eyes": "#ff2222 (glowing red)",
    "scars": "#999999 (grey scar lines on flank)"
  },
  "animation_hint": "snarling stance lower than normal wolf, drool drip",
  "special_visual": "stun-attack (10%): lunges with impact stars around target"
}
```

### Level 6-8

```json
{
  "id": "orc-berserker",
  "type": "enemy-sprite",
  "name": "Orc Berserker",
  "level": 6,
  "boss": false,
  "resolution": "48x48",
  "body": "orc-sized but leaner and more savage, no heavy armor, tribal scars on chest (self-inflicted ritual scars), frothing at mouth",
  "features": "bloodshot eyes, mohawk hairstyle (black with red tips), more prominent tusks, facial war paint (full face red skull pattern)",
  "clothing": "minimal — leather loincloth, bone-and-tooth belt, spiked leather wrist cuffs, no chest armor (scars are honor)",
  "weapon": "dual hand axes (crude iron, wrapped leather handles), chipped and bloodstained",
  "colorPattern": {
    "skin": "#3d6b1f (bright-ish green — adrenaline flushed)",
    "scars": "#8b0000 (dark red ritual scars)",
    "war_paint": "#cc0000 (red skull on face)",
    "leather": "#3a2010 (very dark brown)",
    "axes": "#777777 (crude iron, chipped)"
  },
  "animation_hint": "jerky aggressive movement, axes twitching, foam particles",
  "special_visual": "enrage (25%): red energy burst, eyes flare, +STR visual (muscles bulge 1px)"
}
```

```json
{
  "id": "stone-golem",
  "type": "enemy-sprite",
  "name": "Stone Golem",
  "level": 7,
  "boss": false,
  "resolution": "48x48",
  "body": "bulky humanoid made of stone slabs, thick limbs, no neck (head merges with torso), ancient rune carvings visible on chest and arms, cracks with inner glow",
  "features": "two glowing yellow eyes (carved eye sockets), no mouth, moss/lichen patches on shoulders, chunks missing from legs (ancient damage), grinding stone particles at joints",
  "colorPattern": {
    "body": "#808080 (grey stone)",
    "runes": "#daa520 (golden ancient runes, faint glow)",
    "cracks": "#ffa500 (orange inner glow through cracks)",
    "moss": "#556b2f (dark olive green patches)",
    "eyes": "#ffd700 (golden glow)"
  },
  "animation_hint": "slow heavy movement (1-frame slower than others), particle dust at feet on step",
  "special_visual": "none — extremely tanky (END 25), slow (AGI 1)"
}
```

```json
{
  "id": "warlord-grok",
  "type": "enemy-sprite",
  "name": "Warlord Grok",
  "level": 8,
  "boss": true,
  "resolution": "64x64",
  "body": "massive orc (1.5x orc-warrior), peak muscular build, commanding presence, stands tall and proud",
  "features": "large tusks with iron caps, ritual facial scars in symmetric pattern, red war paint as crown marking on forehead, gold earring (left ear), heavy brow with intelligence in eyes (unlike berserker)",
  "clothing": "heavy iron plate chest piece with trophy skulls on shoulders (2), red war cape (tattered at edges), commander belt with gold buckle, iron leg guards, bone trophy necklace (larger than warrior)",
  "weapon": "massive war hammer (two-handed) — iron head with spike on back, long wooden haft wrapped in red leather",
  "colorPattern": {
    "skin": "#1a4a0a (darkest green — eldest/strongest)",
    "armor": "#444444 (dark iron)",
    "cape": "#8b0000 (dark crimson)",
    "gold": "#ffd700 (gold accents — belt buckle, earring, tusk caps)",
    "eyes": "#ff6600 (orange, burning intelligence)"
  },
  "animation_hint": "slow powerful breathing, cape sway, hammer rests on shoulder",
  "special_visual_1": "enrage (20%): dark red aura explosion, cape billows",
  "special_visual_2": "stun-attack (15%): hammer slam with shockwave ring on ground",
  "boss_indicator": "dark red + gold aura outline, larger sprite (64x64)"
}
```

---

## 3. UI Icons

### 3.1 Stat Icons (7) — DONE ✅

```json
{
  "category": "stat-icons",
  "resolution": "32x32",
  "style": "flat icon on dark circular background, single dominant color per stat, simple symbolic shape, consistent 2px border",
  "items": [
    {
      "id": "icon-str",
      "stat": "STR",
      "label": "Strength",
      "symbol": "clenched fist (front view), knuckles forward",
      "color": "#e74c3c (red)",
      "bgGradient": "#2a1a1a to #3a2020",
      "style": "flat icon on dark circular background, single dominant color per stat, simple symbolic shape, consistent 2px border"
    },
    {
      "id": "icon-end",
      "stat": "END",
      "label": "Endurance",
      "symbol": "shield with heart center (durability/vitality)",
      "color": "#2ecc71 (green)",
      "bgGradient": "#1a2a1a to #203a20",
            "style": "flat icon on dark circular background, single dominant color per stat, simple symbolic shape, consistent 2px border"
    },
    {
      "id": "icon-int",
      "stat": "INT",
      "label": "Intelligence",
      "symbol": "open book with sparkle above (knowledge)",
      "color": "#3498db (blue)",
      "bgGradient": "#1a1a2a to #20203a"
    },
    {
      "id": "icon-dex",
      "stat": "DEX",
      "label": "Dexterity",
      "symbol": "crosshair/target reticle (precision)",
      "color": "#e67e22 (orange)",
      "bgGradient": "#2a1a0a to #3a2a1a"
    },
    {
      "id": "icon-cha",
      "stat": "CHA",
      "label": "Charisma",
      "symbol": "crown silhouette (leadership/presence)",
      "color": "#9b59b6 (purple)",
      "bgGradient": "#1a1a2a to #2a1a3a"
    },
    {
      "id": "icon-lck",
      "stat": "LCK",
      "label": "Luck",
      "symbol": "4-leaf clover",
      "color": "#f1c40f (gold/yellow)",
      "bgGradient": "#2a2a1a to #3a3a20"
    },
    {
      "id": "icon-agi",
      "stat": "AGI",
      "label": "Agility",
      "symbol": "winged boot (speed)",
      "color": "#1abc9c (teal)",
      "bgGradient": "#1a2a2a to #203a3a"
    }
  ]
}
```

### 3.2 Skill Icons (12 — 2 per archetype) — DONE ✅

> Skills are civ-specific. Each archetype has 2 skills reflecting its civilization's identity.

```json
{
  "category": "skill-icons",
  "resolution": "32x32",
  "style": "action icon on dark diamond-shaped background, dynamic pose/effect, warm energy glow, consistent 1px gold border. Each civ's skills use its accent color.",
  "items": [
    {
      "id": "icon-danh-manh",
      "skill": "Danh Manh",
      "label": "Heavy Strike",
      "civ": "Linh Son",
      "archetype": "warrior",
      "symbol": "downward axe slam with ground-crack impact spark (gold)",
      "color": "#D4A017 (gold slash arc)",
      "energy": "yellow-brown impact sparks, dust cloud"
    },
    {
      "id": "icon-kiem-gia",
      "skill": "Kiem Gia",
      "label": "Mountain Stance",
      "civ": "Linh Son",
      "archetype": "warrior",
      "symbol": "stone-like defensive pose, circular earth energy ring around character",
      "color": "#8B6914 (earth gold)",
      "energy": "stone fragments orbiting, golden aura ring"
    },
    {
      "id": "icon-ban-ten-nhanh",
      "skill": "Ban Ten Nhanh",
      "label": "Quick Shot",
      "civ": "Linh Son",
      "archetype": "scout",
      "symbol": "triple bamboo arrow volley (3 arrows in tight spread), leaf motion lines",
      "color": "#4a5d3a (forest green arrows)",
      "energy": "white motion blur streaks, falling leaves"
    },
    {
      "id": "icon-dam-luot",
      "skill": "Dam Luot",
      "label": "Jungle Dash",
      "civ": "Linh Son",
      "archetype": "scout",
      "symbol": "dagger thrust with vine-trail after-image, forward lunge blur",
      "color": "#2ecc71 (green dagger)",
      "energy": "earth-green dash trail, vine silhouette"
    },
    {
      "id": "icon-hoa-cau",
      "skill": "Hoa Cau",
      "label": "Volt Sphere",
      "civ": "De Quoc",
      "archetype": "scholar",
      "symbol": "crackling electric orb with arcing lightning tendrils, glass lens behind",
      "color": "#00d4ff (cyan electric core)",
      "energy": "cyan lightning arcs, small sparks radiating"
    },
    {
      "id": "icon-sung-sac",
      "skill": "Sung Sac",
      "label": "Arcane Overload",
      "civ": "De Quoc",
      "archetype": "scholar",
      "symbol": "exploding tech-magic circle (gear-shaped runic ring shattering with electric burst)",
      "color": "#00d4ff (cyan ring with brass gear teeth)",
      "energy": "cyan + brass sparks radiating outward, circuit-line patterns"
    },
    {
      "id": "icon-turret-deploy",
      "skill": "Turret Deploy",
      "label": "Steam Turret",
      "civ": "De Quoc",
      "archetype": "engineer",
      "symbol": "small brass turret with spinning barrel, steam wisps, being placed on ground",
      "color": "#b08d57 (brass turret body)",
      "energy": "cyan targeting laser line, steam puff"
    },
    {
      "id": "icon-overcharge",
      "skill": "Overcharge",
      "label": "Tesla Surge",
      "civ": "De Quoc",
      "archetype": "engineer",
      "symbol": "wrench slamming into ground with electric shockwave ring expanding outward",
      "color": "#00d4ff (cyan shockwave)",
      "energy": "brass sparks + cyan lightning radiating in ring pattern"
    },
    {
      "id": "icon-song-kiem",
      "skill": "Song Kiem",
      "label": "Twin Crescent",
      "civ": "Thien Lu",
      "archetype": "dual-blade",
      "symbol": "crossed crescent blades forming X-slash, aquamarine light trails",
      "color": "#7fffd4 (aquamarine slash arcs)",
      "energy": "starlight trail from blade edges, crescent moon shapes"
    },
    {
      "id": "icon-sao-bang",
      "skill": "Sao Bang",
      "label": "Meteor Step",
      "civ": "Thien Lu",
      "archetype": "dual-blade",
      "symbol": "figure dashing through enemy (after-image trail), star burst at impact point",
      "color": "#7fffd4 (aquamarine dash trail)",
      "energy": "star-shaped impact burst, silver after-image silhouettes (3)"
    },
    {
      "id": "icon-doc-tinh",
      "skill": "Doc Tinh",
      "label": "Star Reading",
      "civ": "Thien Lu",
      "archetype": "philosopher",
      "symbol": "floating astrolabe with constellation lines connecting to allies (buff visual), starfield expanding",
      "color": "#7fffd4 (aquamarine constellation lines)",
      "energy": "silver star dots, connecting lines form protective pattern"
    },
    {
      "id": "icon-thien-phat",
      "skill": "Thien Phat",
      "label": "Cosmic Judgement",
      "civ": "Thien Lu",
      "archetype": "philosopher",
      "symbol": "beam of starlight descending from above through floating orb, hitting ground",
      "color": "#7fffd4 (aquamarine beam with white core)",
      "energy": "radial star burst at impact, ascending particles"
    }
  ]
}
```

### 3.3 Item Icons (8) — DONE ✅

```json
{
  "category": "item-icons",
  "resolution": "32x32",
  "style": "object on dark rounded-square background, slight 3D depth (top-lit), rarity border color (common=grey, uncommon=green)",
  "items": [
    {
      "id": "icon-wood",
      "item": "WOOD",
      "label": "Oak Wood",
      "rarity": "COMMON",
      "symbol": "3 stacked wooden planks, grain texture visible, slight angle",
      "color": "#8b6914 (wood brown)",
      "border": "#95a5a6 (common grey)"
    },
    {
      "id": "icon-stone",
      "item": "STONE",
      "label": "Rough Stone",
      "rarity": "COMMON",
      "symbol": "irregular rough-hewn stone chunk, chipped edges, speckled texture",
      "color": "#808080 (stone grey)",
      "border": "#95a5a6 (common grey)"
    },
    {
      "id": "icon-iron-ore",
      "item": "IRON_ORE",
      "label": "Iron Ore",
      "rarity": "UNCOMMON",
      "symbol": "dark rock with metallic vein streaks (silver-blue), faceted crystal face on one side",
      "color": "#4a4a5a (dark grey-blue rock) with #a0a0b0 (metallic streaks)",
      "border": "#2ecc71 (uncommon green)"
    },
    {
      "id": "icon-slime-gel",
      "item": "SLIME_GEL",
      "label": "Slime Gel",
      "rarity": "COMMON",
      "symbol": "glass jar with green translucent gel inside, cork stopper, bubble visible in gel",
      "color": "#7ec850 (slime green gel) in #d4c4a0 (jar glass)",
      "border": "#95a5a6 (common grey)"
    },
    {
      "id": "icon-boar-pelt",
      "item": "BOAR_PELT",
      "label": "Boar Pelt",
      "rarity": "COMMON",
      "symbol": "folded brown hide/pelt with bristly texture on one side, smooth underside visible",
      "color": "#6b4423 (dark brown hide)",
      "border": "#95a5a6 (common grey)"
    },
    {
      "id": "icon-wolf-fang",
      "item": "WOLF_FANG",
      "label": "Wolf Fang",
      "rarity": "UNCOMMON",
      "symbol": "single large curved canine tooth, sharp point, root base visible, slight gleam highlight on tip",
      "color": "#f5f5dc (ivory/bone white) with #daa520 (base tinge)",
      "border": "#2ecc71 (uncommon green)"
    },
    {
      "id": "icon-goblin-ear",
      "item": "GOBLIN_EAR",
      "label": "Goblin Ear",
      "rarity": "COMMON",
      "symbol": "pointed severed ear (stylized, not gory), green skin, small bone piercing through lobe",
      "color": "#6b8e23 (goblin green)",
      "border": "#95a5a6 (common grey)"
    },
    {
      "id": "icon-orc-tusk",
      "item": "ORC_TUSK",
      "label": "Orc Tusk",
      "rarity": "UNCOMMON",
      "symbol": "large curved tusk with iron cap on base, wider and thicker than wolf fang, slight green tinge at root",
      "color": "#e8dcc8 (ivory) with #555555 (iron cap)",
      "border": "#2ecc71 (uncommon green)"
    }
  ]
}
```

### 3.4 Civilization Emblems (3) — DONE ✅

```json
{
  "category": "civ-emblems",
  "resolution": "128x128 (high-res for title cards)",
  "style": "heraldic emblem, painterly pixel art, rich detail, transparent background",
  "items": [
    {
      "id": "emblem-linh-son",
      "civ": "Linh Son",
      "displayName": "Linh Son",
      "symbol": "three mountain peaks (center tallest) rising from cloud base, ancient tree growing from center peak, roots visible through rock, sun rising behind peaks",
      "palette": "#f5f0e6 (cream bg aura), #8B6914 (gold mountains), #D4A017 (gold sun rays), #2E4053 (dark tree/roots), #4a5d3a (green tree canopy)",
      "border": "circular frame of braided rope/vine pattern, gold thread",
      "motto_visual": "stone tablet beneath (optional)"
    },
    {
      "id": "emblem-de-quoc",
      "civ": "De Quoc",
      "displayName": "De Quoc",
      "symbol": "mechanical gear (8 teeth) as main frame, lightning bolt striking through center vertically, small tesla coils flanking (2), steam wisps rising from top",
      "palette": "#1a1a2e (dark bg), #6c757d (steel gear), #00d4ff (cyan lightning, glowing), #b08d57 (brass coil details), #f8f5f0 (steam wisps)",
      "border": "octagonal industrial frame with riveted corners (8 rivets), brass",
      "motto_visual": "brass nameplate beneath (optional)"
    },
    {
      "id": "emblem-thien-lu",
      "civ": "Thien Lu",
      "displayName": "Thien Lu",
      "symbol": "seven-pointed star (North Star) as center, crescent moon cradling star from below, constellation dots connected by thin lines forming compass rose pattern, shooting star trail across top",
      "palette": "#191970 (midnight blue bg), #c0c0c0 (silver star/moon), #7fffd4 (aquamarine glow on star points + shooting star trail), #4a3f5c (purple constellation lines)",
      "border": "circular frame of woven starlight threads, aquamarine shimmer",
      "motto_visual": "scroll ribbon beneath (optional)"
    }
  ]
}
```

### 3.5 Room & Furniture Icons (13) — DONE ✅

```json
{
  "category": "room-furniture-icons",
  "resolution": "128x128",
  "style": "isometric mini-tile (matching game perspective), warm interior lighting feel, consistent shadow direction (bottom-right)",
  "rooms": [
    {
      "id": "icon-room-guild-hall",
      "type": "guild-hall",
      "symbol": "golden floor tile with quest board silhouette, banner hanging (pennant shape)",
      "color": "#DAA520 (gold floor), #8B6914 (board wood)"
    },
    {
      "id": "icon-room-tavern",
      "type": "tavern",
      "symbol": "brown floor tile with bar counter silhouette, mug on counter, warm glow",
      "color": "#8B4513 (brown floor), #D4A017 (warm glow)"
    },
    {
      "id": "icon-room-training",
      "type": "training-room",
      "symbol": "blue-grey floor tile with training dummy silhouette (straw body, wooden frame)",
      "color": "#4682B4 (blue floor), #8b6914 (straw/wood dummy)"
    },
    {
      "id": "icon-room-workshop",
      "type": "workshop",
      "symbol": "slate floor tile with workbench silhouette, hammer + anvil icon on bench",
      "color": "#708090 (slate floor), #555555 (iron tools)"
    },
    {
      "id": "icon-room-infirmary",
      "type": "infirmary",
      "symbol": "warm floor tile with alchemy table silhouette, potion vial (green liquid), cross symbol",
      "color": "#FF6347 (warm floor), #33ff66 (green potion glow)"
    }
  ],
  "furniture": [
    {
      "id": "icon-furn-quest-board",
      "type": "quest-board",
      "symbol": "wooden board with 3 pinned parchments (paper sheets), one has red wax seal",
      "color": "#8b6914 (wood), #f5f0e6 (parchments), #cc0000 (seal)"
    },
    {
      "id": "icon-furn-bar-counter",
      "type": "bar-counter",
      "symbol": "wooden counter with 2 mugs and barrel tap, foam overflowing",
      "color": "#8B4513 (counter), #daa520 (beer/foam), #6b4423 (barrel)"
    },
    {
      "id": "icon-furn-alchemy-table",
      "type": "alchemy-table",
      "symbol": "table with bubbling flask, herb bundle, mortar+pestle",
      "color": "#5c4033 (table), #33ff66 (bubbling green), #556b2f (herbs)"
    },
    {
      "id": "icon-furn-workbench",
      "type": "workbench",
      "symbol": "heavy wooden bench with vise, scattered tools (hammer, wrench)",
      "color": "#8b6914 (bench wood), #777777 (iron tools)"
    },
    {
      "id": "icon-furn-training-dummy",
      "type": "training-dummy",
      "symbol": "straw-stuffed dummy on wooden post, target rings on chest, sword slashes visible",
      "color": "#daa520 (straw), #6b4423 (wood post), #cc0000 (target rings)"
    },
    {
      "id": "icon-furn-reception-desk",
      "type": "reception-desk",
      "symbol": "curved desk with ledger book open, quill in inkwell, small bell on desk",
      "color": "#8b6914 (desk wood), #f5f0e6 (ledger), #ffd700 (bell)"
    },
    {
      "id": "icon-furn-wine-barrel",
      "type": "wine-barrel",
      "symbol": "round wooden barrel with iron bands, tap on front, wine stain on floor",
      "color": "#6b4423 (barrel wood), #555555 (iron bands), #8b0000 (wine stain)"
    },
    {
      "id": "icon-furn-medical-bed",
      "type": "medical-bed",
      "symbol": "simple wooden bed frame with white sheet, pillow, red cross on headboard",
      "color": "#8b6914 (bed frame), #f5f5f5 (white sheet), #cc0000 (red cross)"
    }
  ]
}
```

### 3.6 Quest Tier Badges (7) — DONE ✅

```json
{
  "category": "quest-tier-badges",
  "resolution": "24x24",
  "style": "shield-shaped badge with single bold letter, metallic finish, glow for higher tiers",
  "items": [
    { "id": "badge-F", "tier": "F", "letter": "F", "shieldColor": "#95a5a6 (grey)", "letterColor": "#ffffff", "glow": "none" },
    { "id": "badge-E", "tier": "E", "letter": "E", "shieldColor": "#27ae60 (green)", "letterColor": "#ffffff", "glow": "none" },
    { "id": "badge-D", "tier": "D", "letter": "D", "shieldColor": "#3498db (blue)", "letterColor": "#ffffff", "glow": "subtle blue" },
    { "id": "badge-C", "tier": "C", "letter": "C", "shieldColor": "#8e44ad (purple)", "letterColor": "#ffffff", "glow": "subtle purple" },
    { "id": "badge-B", "tier": "B", "letter": "B", "shieldColor": "#e67e22 (orange)", "letterColor": "#ffffff", "glow": "warm orange" },
    { "id": "badge-A", "tier": "A", "letter": "A", "shieldColor": "#e74c3c (red)", "letterColor": "#ffd700", "glow": "red pulse" },
    { "id": "badge-S", "tier": "S", "letter": "S", "shieldColor": "#ffd700 (gold)", "letterColor": "#1a1a2e", "glow": "golden radiance" }
  ]
}
```

### 3.7 Status Icons (4) — DONE ✅

```json
{
  "category": "status-icons",
  "resolution": "24x24",
  "style": "minimal circular icon, single color + white symbol, used as overlay badges on character portraits",
  "items": [
    { "id": "status-idle", "status": "idle", "symbol": "house/home silhouette (at guild)", "color": "#95a5a6 (grey)", "bgOpacity": 0.6 },
    { "id": "status-on-mission", "status": "on-mission", "symbol": "running figure with trail (adventuring)", "color": "#3498db (blue)", "bgOpacity": 0.8 },
    { "id": "status-injured", "status": "injured", "symbol": "bandage cross / red cross with pulse ring", "color": "#e74c3c (red)", "bgOpacity": 0.8 },
    { "id": "status-training", "status": "training", "symbol": "dumbbell / flexed arm (training)", "color": "#f39c12 (amber)", "bgOpacity": 0.7 }
  ]
}
```

### 3.8 Rank Badges (6) — DONE ✅

```json
{
  "category": "rank-badges",
  "resolution": "24x24",
  "style": "vertical chevron/military stripe badge, stacked bars indicate rank tier, color matches rank definition",
  "items": [
    {
      "id": "badge-mercenary",
      "rank": "MERCENARY",
      "symbol": "coin icon (hired sword — not guild hierarchy)",
      "color": "#d4a017 (gold coin)",
      "stripes": 0,
      "note": "circular coin shape, not chevron (distinct from guild ranks)"
    },
    {
      "id": "badge-recruit",
      "rank": "RECRUIT",
      "symbol": "single upward chevron (1 stripe)",
      "color": "#95a5a6 (grey)",
      "stripes": 1
    },
    {
      "id": "badge-member",
      "rank": "MEMBER",
      "symbol": "double upward chevron (2 stripes)",
      "color": "#3498db (blue)",
      "stripes": 2
    },
    {
      "id": "badge-veteran",
      "rank": "VETERAN",
      "symbol": "triple upward chevron (3 stripes)",
      "color": "#2ecc71 (green)",
      "stripes": 3
    },
    {
      "id": "badge-officer",
      "rank": "OFFICER",
      "symbol": "triple chevron + star above (3 stripes + 1 star)",
      "color": "#9b59b6 (purple)",
      "stripes": 3,
      "star": true
    },
    {
      "id": "badge-commander",
      "rank": "COMMANDER",
      "symbol": "triple chevron + 2 stars above (3 stripes + 2 stars)",
      "color": "#ffd700 (gold)",
      "stripes": 3,
      "stars": 2
    }
  ]
}
```

---

## Archetype Summary

| Civilization | Archetype 1 | Archetype 2 | Skills |
|-------------|-------------|-------------|--------|
| Linh Son | **Warrior** (tank/melee, bronze axe) | **Scout** (ranged/tracker, bamboo bow) | Danh Manh, Kiem Gia / Ban Ten Nhanh, Dam Luot |
| De Quoc | **Scholar** (arcane-tech caster, codex) | **Engineer** (gadgeteer, steam-wrench) | Hoa Cau, Sung Sac / Turret Deploy, Overcharge |
| Thien Lu | **Dual Blade** (swift assassin, twin daggers) | **Philosopher** (cosmic sage, star staff) | Song Kiem, Sao Bang / Doc Tinh, Thien Phat |

## Asset Summary

| Category | Count | Resolution | Notes |
|----------|-------|-----------|-------|
| Character sprites | 6+6 | 48x48 | 3 civs x 2 archetypes + 6 female variants (all civs) |
| Enemy sprites | 13 | 48x48 | Levels 1-7 |
| Boss sprites | 2 | 64x64 | Queen Spider, Warlord Grok |
| Civ emblems | 3 | 64x64 + 32x32 | High-res + badge variant |
| Stat icons | 7 | 32x32 | |
| Skill icons | 12 | 32x32 | 2 skills x 6 archetypes |
| Item icons | 8 | 32x32 | |
| Room icons | 5 | 32x32 | |
| Furniture icons | 8 | 32x32 | |
| Quest tier badges | 7 | 24x24 | |
| Status icons | 4 | 24x24 | |
| Rank badges | 6 | 24x24 | |
| **TOTAL** | **81** | | |
