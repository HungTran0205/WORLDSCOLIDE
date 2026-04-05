# Asset List — Character Sprites (Chibi Vietnamese Style)

> JSON prompts for AI image generation. Redesigned in chibi Vietnamese contemporary art style.
> Base source: `asset-list-sprites.md`
> Generated: 2026-04-04

## Global Chibi Style Guide

> **Reference style:** Mature chibi — adult proportions compressed into cute scale.
> Think Korean webtoon character illustration or Vietnamese traditional figure art in chibi form.
> NOT super-deformed, NOT baby-like. Characters are clearly adults with refined features.

```json
{
  "globalStyle": {
    "format": "pixel art chibi",
    "resolution": "48x48",
    "proportions": "mature chibi 2.5-head-tall: head ~35-40% of total height, slender torso with visible waist, legs are elongated not stubby — adult body in cute compressed scale",
    "referenceStyle": "Vietnamese traditional figure chibi — similar to dolls in traditional clothing illustration: adult faces, graceful silhouettes, detailed garments, NOT super-deformed",
    "eyes": "medium-large refined almond eyes — adult expression, elegant shape, single subtle shine dot, well-defined eyebrows (not oversized baby eyes)",
    "face": "adult features: defined chin/jaw, refined nose bridge, composed expression — cute but clearly a grown warrior/mage/scholar",
    "outline": "1-2px clean outline, crisp not rounded-bubbly",
    "shading": "flat cel-shaded — base color + 1 shadow tone + 1 highlight, clean separation",
    "perspective": "front-facing, very slight 3/4 tilt",
    "background": "transparent",
    "fileFormat": "PNG with alpha channel",
    "vnStyle": "Vietnamese mature chibi — traditional garments preserved in full detail (áo yếm, wrap skirts, áo dài silhouette), cultural headgear as key identity element, Đông Sơn motifs as textile patterns not sticker badges",
    "chibiRules": [
      "Head larger than realistic but body is clearly adult — NOT 50% head ratio",
      "Arms and legs: slender and proportional, not cylindrical stumps",
      "Hands: small but shaped — visible thumb, simplified fingers",
      "Feet: properly formed sandals/shoes/bare feet",
      "Clothing: preserve full garment silhouette and key detail layers",
      "Cultural motifs (Đông Sơn spirals, bronze drum patterns) appear as woven textile patterns",
      "Weapons: slightly oversized for chibi charm, but character holds them with adult confidence",
      "Expression: composed adult emotion — not exaggerated cute/silly"
    ]
  }
}
```

---

## 1. Linh Son (LS) — Ancient Mountain Warriors

**Chibi identity:** Chiến binh vùng núi — earth tones, bronze accessories, Đông Sơn tattoo patterns woven into garments, composed adult warrior expressions.

---

### LS-Warrior (Male)

```json
{
  "id": "ls-warrior-chibi",
  "style": "pixel art mature chibi, Vietnamese lacquer-fantasy",
  "subject": "male chibi mountain warrior, ancient Vietnamese bronze age — adult warrior, composed and powerful",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized but body is slender adult — visible waist, defined shoulders, legs proportional not stubby. A-pose",
  "head": {
    "shape": "slightly large head, defined square jaw — adult male face, not baby-round",
    "hair": "topknot bun, clean tight wrap, a few short strands at temples",
    "face": "defined almond eyes (#4a2c0a brown iris, single shine point), thick angled brows, warm tan skin (#c49a6c), stoic closed mouth — adult warrior expression",
    "headgear": "bronze headband with mountain 3-peak engraving centered on forehead"
  },
  "body": {
    "torso": "bare athletic chest, Đông Sơn bronze drum spiral pattern tattooed on left pec (geometric circle motif), leather armor pauldron on right shoulder",
    "waist": "golden loincloth with leather reinforcement strips at hips, visible waistline",
    "arms": "lean proportional arms (not stubby), stone-studded leather bracers at wrists, cord wraps",
    "legs": "straight legs, carved wood shin guards with visible plating detail",
    "feet": "straw sandals with ankle strap, properly shaped feet"
  },
  "colorPalette": {
    "skin": "#c49a6c",
    "primary": "#f5f0e6",
    "secondary": "#8B6914",
    "accent": "#D4A017",
    "metal": "#8c7853"
  },
  "expression": "stoic determination — calm steady gaze, closed mouth, quiet strength. Adult warrior, not cartoonishly angry",
  "weapon": {
    "name": "bronze hand axe (Vietnamese bronze age)",
    "description": "held confidently at side, slightly oversized for chibi proportion but gripped with adult warrior stance, hemp-wrapped handle",
    "colors": { "blade": "#8c7853", "hilt": "#5c4033", "wrap": "#8B6914" }
  },
  "promptKeywords": "mature chibi pixel art, Vietnamese male warrior, bronze age, earth tones, Dong Son tattoo spiral, adult proportions, mountain crest headband, transparent background"
}
```

---

### LS-Warrior (Female)

```json
{
  "id": "ls-warrior-f-chibi",
  "style": "pixel art mature chibi, Vietnamese lacquer-fantasy",
  "subject": "female chibi mountain warrior, ancient Vietnamese bronze age — fierce adult woman warrior",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized but body is slender adult female — defined waist, graceful shoulders, proportional legs. A-pose",
  "head": {
    "shape": "slightly large head, defined cheekbones, strong-but-feminine jaw — adult female face",
    "hair": "high warrior bun, neatly wrapped, 2 loose strands framing face with natural flow",
    "face": "fierce almond eyes (#4a2c0a brown iris, clean shine), arched bold brows, warm tan skin (#c49a6c), confident closed lips — warrior queen presence",
    "headgear": "thin bronze circlet with mountain crest engraving, elegant on adult female head"
  },
  "body": {
    "torso": "bronze-dyed yếm chest wrap (crossed front, tied at back), Đông Sơn wave-band tattoo pattern on right shoulder blade, left arm has leather pauldron",
    "waist": "dark ochre wrap skirt (knee-length), visible feminine waistline, leather hip reinforcement strips, right-side slit for mobility",
    "arms": "lean proportional arms, Đông Sơn wave-band tattoo lines on both forearms (3 bands each), stone-studded leather bracers on wrists",
    "legs": "straight proportional bare legs, carved wood shin guards matching male",
    "feet": "straw sandals with ankle strap"
  },
  "colorPalette": {
    "skin": "#c49a6c",
    "primary": "#f5f0e6",
    "secondary": "#8B6914",
    "accent": "#D4A017",
    "metal": "#8c7853"
  },
  "expression": "warrior queen composure — chin raised, steady fierce gaze, quiet authority. Adult woman, not angry child",
  "weapon": {
    "name": "bronze hand axe (Vietnamese bronze age)",
    "description": "held at side with practiced grip, slightly oversized for chibi but wielded with full adult confidence",
    "colors": { "blade": "#8c7853", "hilt": "#5c4033", "wrap": "#8B6914" }
  },
  "promptKeywords": "mature chibi pixel art, female Vietnamese warrior, bronze age, yếm wrap, Dong Son wave tattoo, adult proportions, warrior queen, transparent background"
}
```

---

### LS-Scout (Male)

```json
{
  "id": "ls-scout-chibi",
  "style": "pixel art mature chibi, Vietnamese lacquer-fantasy",
  "subject": "male chibi jungle scout, ancient Vietnamese bronze age — lean wiry adult tracker, silent and observant",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, lean wiry adult body — narrow shoulders, athletic build, proportional legs. A-pose",
  "head": {
    "shape": "slightly large head, angular jaw — lean adult male face, sharp features",
    "hair": "tight topknot with a few loose strands, practical hunter style",
    "face": "alert narrow almond eyes (#2c3e50 dark iris, subtle shine), sharp angled brows, warm tan skin (#c49a6c), neutral focused mouth — geometric tattoo lines on cheeks (Lạc Việt tradition: 2 short lines each side)",
    "headgear": "3 white crane feathers bound at hair base with indigo cloth wrap, tilted naturally back"
  },
  "body": {
    "torso": "bare chest, Đông Sơn sun spiral tattoo at sternum (circular geometric pattern), diagonal bamboo quiver strap across chest, small bronze medallion clasp at shoulder",
    "waist": "indigo-dyed wrap skirt (mid-thigh), hemp cord belt with 2 bone-toggle pouches",
    "arms": "lean proportional arms, 3 geometric band tattoos on each forearm, cord bracelet with animal teeth on left wrist",
    "legs": "proportional bare legs, spiral tattoo bands above ankles",
    "feet": "barefoot, natural standing stance — hunter's balance"
  },
  "colorPalette": {
    "skin": "#c49a6c",
    "primary": "#2c3e50",
    "secondary": "#8B6914",
    "accent": "#D4A017",
    "metal": "#8c7853"
  },
  "expression": "predator patience — eyes scanning the horizon, composed and still, adult hunter's focus",
  "weapon": {
    "name": "crossbow — nỏ (Vietnamese bronze-age crossbow)",
    "description": "held horizontally, slightly wide for chibi scale but gripped with practiced adult form, mulberry wood frame with bronze trigger",
    "colors": { "frame": "#5c4033", "trigger": "#8c7853", "string": "#e8dcc8" }
  },
  "promptKeywords": "mature chibi pixel art, Vietnamese male scout, bronze age, indigo dye, feather headdress, Dong Son tattoo, lean athletic proportions, transparent background"
}
```

---

### LS-Scout (Female)

```json
{
  "id": "ls-scout-f-chibi",
  "style": "pixel art mature chibi, Vietnamese lacquer-fantasy",
  "subject": "female chibi jungle scout, ancient Vietnamese bronze age — nimble adult woman, forest hunter with graceful precision",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, nimble adult female body — slender and light-footed, proportional. A-pose",
  "head": {
    "shape": "slightly large head, sharp angular jaw — adult female, elegant hunter features",
    "hair": "single thick braid down back woven with vine cord, 2 loose strands framing face with natural movement",
    "face": "focused almond eyes (#2c3e50 dark iris, subtle shine), 3 geometric dot tattoos under each eye (Lạc Việt tradition), warm tan skin (#c49a6c), composed slight smile — calm adult awareness",
    "headgear": "2 white crane feathers tucked into braid, indigo cloth headband across forehead"
  },
  "body": {
    "torso": "indigo yếm chest wrap (practical single layer), Đông Sơn spiral tattoo on upper back (circular geometric pattern), diagonal bamboo quiver strap, bronze clasp at left shoulder",
    "waist": "shorter indigo wrap skirt (above knee for mobility), hemp cord belt, 1 bone-toggle pouch + small herb bundle",
    "arms": "lean proportional arms, 2 geometric band tattoos on left upper arm, vine bracelet with single animal fang on right wrist",
    "legs": "proportional bare legs, spiral tattoo on left ankle",
    "feet": "barefoot, light natural stance — forest runner's posture"
  },
  "colorPalette": {
    "skin": "#c49a6c",
    "primary": "#2c3e50",
    "secondary": "#8B6914",
    "accent": "#D4A017",
    "metal": "#8c7853"
  },
  "expression": "quiet forest awareness — head slightly tilted, listening, calm adult hunter's composure",
  "weapon": {
    "name": "crossbow — nỏ (Vietnamese bronze-age crossbow)",
    "description": "same as male, held with practiced adult grip — lighter frame suits her swift movement style",
    "colors": { "frame": "#5c4033", "trigger": "#8c7853", "string": "#e8dcc8" }
  },
  "promptKeywords": "mature chibi pixel art, female Vietnamese scout, bronze age, indigo dye, braid hair, dot tattoo under eyes, nimble adult proportions, transparent background"
}
```

---

## 2. De Quoc (DQ) — Electro-Steam Empire

**Chibi identity:** Học giả & kỹ sư đế chế — navy & brass palette, spectacles/goggles as strong identity marker, cyan glow accents, steampunk elegance in compact form.

---

### DQ-Scholar (Male)

```json
{
  "id": "dq-scholar-chibi",
  "style": "pixel art mature chibi, steampunk Victorian-Vietnamese electropunk",
  "subject": "male chibi arcane-tech scholar, steampunk empire — composed adult intellectual with sharp analytical presence",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, slender adult body with elegant upright posture. A-pose",
  "head": {
    "shape": "slightly large head, thin angular face — adult male scholar, refined features",
    "hair": "slicked-back dark hair, silver streaks at temples, neat and polished",
    "face": "focused almond eyes behind round brass spectacle frames (defining feature), sharp cheekbones, pale fair skin (#f0dcc0), slight knowing smile — adult intellectual composure",
    "headgear": "round brass spectacles — prominent, clean frame outlines, the character's clearest identifier"
  },
  "body": {
    "torso": "long navy lab coat (reaches past hip) over fitted waistcoat, brass buttons down front, high collar with cyan piping trim, pen loops on breast pocket, 3 glowing cyan vials in belt holder",
    "waist": "formal dark grey trousers, neat and pressed",
    "arms": "coat sleeves, left forearm has brass armband device with rotating dials, right arm has leather writing glove (fingerless)",
    "legs": "straight trouser legs with proper silhouette",
    "feet": "polished black oxford shoes, brass toe caps"
  },
  "colorPalette": {
    "skin": "#f0dcc0",
    "primary": "#1a1a2e",
    "secondary": "#3a3a4e",
    "accent": "#00d4ff",
    "metal": "#b08d57"
  },
  "expression": "analytical composure — eyes focused behind spectacles, slight knowing smirk, adult scholar confident in his intellect",
  "weapon": {
    "name": "arcane-tech grimoire (floating)",
    "description": "open leather tome floating at waist, pages with faint cyan glow, brass corner brackets — held or floating beside character",
    "colors": { "cover": "#1a1a2e", "brackets": "#b08d57", "glow": "#00d4ff" }
  },
  "promptKeywords": "mature chibi pixel art, steampunk scholar, brass spectacles, navy lab coat, cyan glow vials, adult proportions elegant posture, transparent background"
}
```

---

### DQ-Scholar (Female)

```json
{
  "id": "dq-scholar-f-chibi",
  "style": "pixel art mature chibi, steampunk Victorian-Vietnamese electropunk",
  "subject": "female chibi arcane-tech scholar, steampunk empire — poised adult woman of authority, razor intellect",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, slender adult female body with precise upright posture. A-pose",
  "head": {
    "shape": "slightly large head, sharp adult female face — defined chin, angular features",
    "hair": "low chignon at nape, neat and professional, 2 brass hairpins, single silver streak in front bangs",
    "face": "piercing almond eyes with pince-nez spectacles (bridge bar + 2 oval lenses, brass chain to collar), defined raised brow, pale fair skin (#f0dcc0), composed authority expression",
    "headgear": "pince-nez as defining identifier — perched on nose bridge, brass chain draped to collar brooch"
  },
  "body": {
    "torso": "fitted navy frock coat (waist-length), high mandarin collar with cyan piping, brass toggle closures down front, leather corset belt with 3 cyan-glow vials, gear emblem epaulettes on shoulders",
    "waist": "dark grey A-line skirt over leggings (knee-length, front split for mobility)",
    "arms": "tapered sleeves, left forearm has brass armband device with dials, right hand has fingerless leather glove with conductive brass knuckle pads",
    "legs": "dark stocking, proportional",
    "feet": "heeled ankle boots with brass buckles — low practical heel"
  },
  "colorPalette": {
    "skin": "#f0dcc0",
    "primary": "#1a1a2e",
    "secondary": "#3a3a4e",
    "accent": "#00d4ff",
    "metal": "#b08d57"
  },
  "expression": "intellectual authority — one brow arched, composed slight smile, eyes that say she already knows the answer. Adult female scholar commanding respect",
  "weapon": {
    "name": "arcane-tech grimoire (floating)",
    "description": "same open glowing tome as male — floating confidently beside her",
    "colors": { "cover": "#1a1a2e", "brackets": "#b08d57", "glow": "#00d4ff" }
  },
  "promptKeywords": "mature chibi pixel art, female steampunk scholar, pince-nez spectacles, navy frock coat, cyan glow vials, adult proportions commanding posture, transparent background"
}
```

---

### DQ-Engineer (Male)

```json
{
  "id": "dq-engineer-chibi",
  "style": "pixel art mature chibi, steampunk Victorian-Vietnamese electropunk",
  "subject": "male chibi field engineer/gadgeteer, steampunk empire — cocky adult craftsman, grease-stained and confident",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, stocky adult male build — broad shoulders, solid stance. A-pose",
  "head": {
    "shape": "slightly large head, round cheeks with adult jaw — stocky guy energy, not baby-faced",
    "hair": "messy auburn hair with soot streaks, partially hidden under cap",
    "face": "eager bright eyes (adult enthusiasm not wide-eyed child wonder), freckles across nose, grease smudge on nose, cocky half-grin — young adult worker vibe",
    "headgear": "leather flat newsboy cap with amber-tinted brass goggles pushed up on forehead (one lens cracked)"
  },
  "body": {
    "torso": "heavy leather apron over navy work shirt (sleeves rolled), visible tool loops with pliers and small hammer, brass suspenders, breast pocket overflowing with blueprint roll",
    "waist": "reinforced dark grey cargo pants, deep pockets with bolts and gears visible, leather knee patches",
    "arms": "grease-stained forearms, left has brass mechanical bracer (multi-tool armband with dials), right has thick leather welding glove",
    "legs": "asymmetric brass shin guards (self-made, slightly crude — character detail), copper wire coiled at left ankle",
    "feet": "heavy steel-toed work boots, brass toe plate, wire-laced"
  },
  "colorPalette": {
    "skin": "#f0dcc0",
    "primary": "#2a2a3e",
    "secondary": "#5c4a3a",
    "accent": "#00d4ff",
    "metal": "#b08d57",
    "soot": "#3a3a3a"
  },
  "expression": "cocky adult confidence — half-grin, one eye squinting like he's already solved the problem. 'Easy fix.'",
  "weapon": {
    "name": "steam-wrench (dual-purpose tool/weapon)",
    "description": "large wrench held at side, steam pressure valve visible, cyan crystal embedded in jaw glowing, oversized but gripped casually — tool of a pro",
    "colors": { "head": "#555555", "handle": "#b08d57", "crystal": "#00d4ff", "steam": "#e0e0e0" }
  },
  "promptKeywords": "mature chibi pixel art, steampunk engineer, newsboy cap goggles, leather apron, grease stains, adult stocky build, cocky expression, transparent background"
}
```

---

### DQ-Engineer (Female)

```json
{
  "id": "dq-engineer-f-chibi",
  "style": "pixel art mature chibi, steampunk Victorian-Vietnamese electropunk",
  "subject": "female chibi field engineer/gadgeteer, steampunk empire — sharp adult woman, no-nonsense mechanic who knows her craft",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, compact adult female build — fit and practical. A-pose",
  "head": {
    "shape": "slightly large head, angular jaw — adult female with sharp practical features",
    "hair": "short choppy auburn hair swept to one side, undercut visible on right, soot-streaked",
    "face": "determined almond eyes, grease smudge on cheek, freckles across nose, adult cocky smirk — someone who knows exactly what she's doing",
    "headgear": "round welding goggles pushed up on forehead, one lens cracked, brass frame, leather strap"
  },
  "body": {
    "torso": "fitted leather work vest over navy tank top, riveted tool loops with visible pliers, X-pattern brass utility harness across chest, blueprint roll tucked in back",
    "waist": "dark grey work shorts with deep pockets, tool belt slung low on hip",
    "arms": "grease-stained arms, left forearm has brass mechanical bracer, right arm has bandage wrap at elbow (work injury — character detail)",
    "legs": "mismatched knee guards — left: polished brass-plated, right: improvised leather-wrapped, copper wire coiled on right calf",
    "feet": "steel-toed work boots, brass toe plate, wire-laced"
  },
  "colorPalette": {
    "skin": "#f0dcc0",
    "primary": "#2a2a3e",
    "secondary": "#5c4a3a",
    "accent": "#00d4ff",
    "metal": "#b08d57",
    "soot": "#3a3a3a"
  },
  "expression": "adult cocky confidence — head tilted, sizing you up, 'I can fix that' energy. Clearly a skilled professional not a kid playing with tools",
  "weapon": {
    "name": "steam-wrench (dual-purpose tool/weapon)",
    "description": "same wrench as male, one-handed confident grip at side — she makes it look effortless",
    "colors": { "head": "#555555", "handle": "#b08d57", "crystal": "#00d4ff", "steam": "#e0e0e0" }
  },
  "promptKeywords": "mature chibi pixel art, female steampunk engineer, welding goggles, leather work vest, mismatched knee guards, adult proportions confident stance, transparent background"
}
```

---

## 3. Thien Lu (TL) — Celestial Nomads

**Chibi identity:** Du mục thiên văn — midnight blue & aquamarine palette, star/moon accessories as natural extensions of identity, ethereal adult grace with cosmic mystique.

---

### TL-Dual-Blade (Male)

```json
{
  "id": "tl-dual-blade-chibi",
  "style": "pixel art mature chibi, celestial nomad, Vietnamese silk-dreamscape",
  "subject": "male chibi twin-blade assassin, celestial nomad tribe — fluid adult warrior, moving like starlight, controlled and deadly",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, lithe athletic adult male body — dancer's build, light and balanced. A-pose",
  "head": {
    "shape": "slightly large head, strong features — adult male face, dark skin, angular jaw with elegant nomad quality",
    "hair": "long silver-white locs/dreads loosely pulled back, star-shaped bead charms woven in (3-4 scattered)",
    "face": "serene intense almond eyes (dark iris with aquamarine tint highlight, sharp shine), dark skin (#6b4423), 3-point star tattoo under left eye (Đông Sơn-inspired mark), composed neutral expression — predator stillness",
    "headgear": "thin silver crescent moon circlet across forehead, elegant minimal band"
  },
  "body": {
    "torso": "open-front midnight blue vest over chest wraps, constellation pattern (Gemini stars) embroidered in silver thread on vest back, loose silk sash at waist tied to one side",
    "waist": "flowing harem-style pants (midnight blue) gathered at ankle, silver thread star pattern along outer seam",
    "arms": "bare lean upper arms with Gemini constellation tattoo (star pattern, not dots), forearm wraps of deep purple cloth with aquamarine gemstone clasp",
    "legs": "straight proportional legs under flowing pants, silver chain anklet over gathered cuffs",
    "feet": "soft leather sandals with toe loop, minimal — for silent movement"
  },
  "colorPalette": {
    "skin": "#6b4423",
    "primary": "#191970",
    "secondary": "#4a3f5c",
    "accent": "#7fffd4",
    "metal": "#c0c0c0"
  },
  "expression": "serene predator calm — steady gaze, faint composed smile, the stillness before a lightning strike. Adult warrior at peace with his power",
  "weapon": {
    "name": "twin curved daggers — linh dao (spirit blades)",
    "description": "crescent-shaped twin daggers held in both hands, aquamarine glow along blade edges, silver star-shaped pommels — carried with fluid adult grace",
    "colors": { "blade": "#3a3a4e", "edge_glow": "#7fffd4", "handle": "#4a3f5c", "pommel": "#c0c0c0" }
  },
  "promptKeywords": "mature chibi pixel art, celestial nomad, silver dreadlocks, star constellation tattoo, midnight blue, aquamarine blade glow, crescent circlet, adult athletic proportions, transparent background"
}
```

---

### TL-Dual-Blade (Female)

```json
{
  "id": "tl-dual-blade-f-chibi",
  "style": "pixel art mature chibi, celestial nomad, Vietnamese silk-dreamscape",
  "subject": "female chibi twin-blade assassin, celestial nomad tribe — deadly elegant adult woman, already three steps ahead of you",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, graceful nimble adult female body — lithe with controlled presence. A-pose",
  "head": {
    "shape": "slightly large head, sharp elegant adult female features — high cheekbones, defined jaw",
    "hair": "high ponytail flowing upward, 2 thin braids framing face, star bead charms in braids",
    "face": "half-lidded almond eyes (dark iris with aquamarine highlight, precise shine), crescent moon tattoo under right eye, dark skin (#6b4423), aquamarine-tinted lips, cold confident adult expression",
    "headgear": "thin silver crescent moon circlet, aquamarine drop pendant at center forehead (small glowing teardrop)"
  },
  "body": {
    "torso": "midnight blue celestial yếm-style crop wrap, Gemini constellation embroidery on back in silver thread, bare right shoulder, left has flowing silk sleeve cape (light fabric movement), silk sash at left hip",
    "waist": "midnight blue split skirt (thigh-high slit both sides) over fitted leggings, silver star thread along edges",
    "arms": "bare right arm with Gemini constellation tattoo (star pattern), left arm covered by sleeve cape then bare forearm with purple cloth wrap + aquamarine clasp",
    "legs": "proportional slender legs, silver chain anklet on right ankle, throwing-knife holster strapped to left thigh (thin strap)",
    "feet": "soft leather sandals with toe loop"
  },
  "colorPalette": {
    "skin": "#6b4423",
    "primary": "#191970",
    "secondary": "#4a3f5c",
    "accent": "#7fffd4",
    "metal": "#c0c0c0"
  },
  "expression": "cold adult confidence — half-lidded eyes, subtle head tilt, the silence before a blade appears. 'Already behind you.'",
  "weapon": {
    "name": "twin curved daggers — linh dao (spirit blades)",
    "description": "same crescent daggers as male, held with effortless grace — one in each hand or crossed at rest position",
    "colors": { "blade": "#3a3a4e", "edge_glow": "#7fffd4", "handle": "#4a3f5c", "pommel": "#c0c0c0" }
  },
  "promptKeywords": "mature chibi pixel art, female celestial nomad, silver ponytail, crescent moon tattoo, aquamarine pendant, midnight blue celestial, adult graceful proportions, transparent background"
}
```

---

### TL-Philosopher (Male)

```json
{
  "id": "tl-philosopher-chibi",
  "style": "pixel art mature chibi, celestial nomad, Vietnamese silk-dreamscape",
  "subject": "male chibi cosmic sage/support, celestial nomad tribe — ancient adult soul in ageless body, cosmic wisdom made flesh",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, flowing robes create elegant adult silhouette — upright and timeless. A-pose",
  "head": {
    "shape": "slightly large head, androgynous adult features — neither old nor young, ageless quality",
    "hair": "long flowing white hair, gravity defying drift as if weightless, falls below shoulders, moves like it's underwater",
    "face": "otherworldly almond eyes with aquamarine glowing irises (soft glow effect), dark skin (#5a3a1a), subtle luminous rune marks on each cheek (fine lines not dots), faint knowing smile — adult sage expression",
    "headgear": "thin silver diadem with single aquamarine crystal floating above center (slight gap = hover effect)"
  },
  "body": {
    "torso": "layered flowing robes — outer midnight blue with Orion & Lyra constellation embroidery in silver thread, inner deep purple visible at collar, wide cloth belt at waist with star chart scroll",
    "waist": "robes reach ankles, front slit reveals dark leggings",
    "arms": "wide sleeve left (aquamarine cuff trim), silver astrolabe bracelet at left wrist (functional spinning dial), right hand has 2 translucent rune rings orbiting fingers (faint glowing circles)",
    "legs": "hidden beneath robes, elegant drape",
    "feet": "bare feet with faint aquamarine glow at sole contact points"
  },
  "colorPalette": {
    "skin": "#5a3a1a",
    "primary": "#191970",
    "secondary": "#301050",
    "accent": "#7fffd4",
    "glow": "#7fffd4 soft bloom around hands"
  },
  "expression": "cosmic serenity — eyes glow softly, knowing smile of someone who has read the stars for a thousand years. Ageless adult wisdom",
  "weapon": {
    "name": "celestial focus staff — gậy tinh (star staff)",
    "description": "tall staff — dark petrified wood, silver crescent moon headpiece cradling floating aquamarine orb (glowing), constellation etching on shaft. Held upright with adult dignity",
    "colors": { "shaft": "#3a2a1a", "headpiece": "#c0c0c0", "orb": "#7fffd4" }
  },
  "promptKeywords": "mature chibi pixel art, cosmic sage, flowing white hair, glowing aquamarine eyes, midnight blue robes, constellation embroidery, ageless adult presence, transparent background"
}
```

---

### TL-Philosopher (Female)

```json
{
  "id": "tl-philosopher-f-chibi",
  "style": "pixel art mature chibi, celestial nomad, Vietnamese silk-dreamscape",
  "subject": "female chibi cosmic sage/support, celestial nomad tribe — ethereal adult woman, wears the cosmos as naturally as breathing",
  "proportions": "mature chibi 2.5-head-tall: head slightly oversized, ethereal adult female silhouette in flowing robes — graceful and otherworldly. A-pose",
  "head": {
    "shape": "slightly large head, soft elegant adult female features — graceful jaw, refined nose",
    "hair": "very long white hair loose and unbound, drifting slightly upward as if weightless (underwater movement), scattered floating star motes (3-4 small light points) around hair",
    "face": "ethereal almond eyes with aquamarine glowing irises (soft bloom glow), dark skin (#5a3a1a), constellation rune marks on forehead (fine lines in star pattern — not dots), gentle luminous smile — adult cosmic grace",
    "headgear": "silver tiara with 3 aquamarine crystals floating in arc above head (slight gaps = hovering effect)"
  },
  "body": {
    "torso": "flowing layered robes — outer midnight blue open-front over deep purple inner fitted dress, Lyra & Cassiopeia constellation embroidery in silver thread on shoulders, high wrapped collar, moon-phase buckle on wide cloth belt, star chart scroll at hip",
    "waist": "inner dress fitted to knee then flares, front split, aquamarine glow at hem edges",
    "arms": "left sleeve wide and flowing (fabric drifts naturally), right sleeve cut at elbow — bare forearm with silver astrolabe bracelet (spinning dials) + 2 translucent rune rings orbiting wrist, 3 silver bangles on right upper arm",
    "legs": "hidden beneath robes, ethereal glow at hem",
    "feet": "bare feet, aquamarine glow at sole contact points"
  },
  "colorPalette": {
    "skin": "#5a3a1a",
    "primary": "#191970",
    "secondary": "#301050",
    "accent": "#7fffd4",
    "glow": "#7fffd4 soft bloom around hands and floating hair motes"
  },
  "expression": "ethereal adult serenity — gentle luminous smile, softly glowing eyes, someone fully at home in the infinite cosmos",
  "weapon": {
    "name": "celestial focus staff — gậy tinh (star staff)",
    "description": "same tall staff as male, held with elegant adult presence — the glowing orb pulses softly at top",
    "colors": { "shaft": "#3a2a1a", "headpiece": "#c0c0c0", "orb": "#7fffd4" }
  },
  "promptKeywords": "mature chibi pixel art, female cosmic sage, floating white hair, triple aquamarine tiara, midnight blue celestial robes, starlight glow, adult ethereal grace, transparent background"
}
```

---

## Usage Notes

- All sprites: **48×48px, transparent PNG, pixel art mature chibi style**
- Weapons can be generated separately as **32×32px** isolated items
- Use `promptKeywords` field as final tag line for AI generation tools
- Color palette per sprite: limited to 6-8 colors
- **Mature chibi rule:** Characters are clearly adults — refined faces, proportional limbs, cultural garments preserved in full silhouette. NOT super-deformed or baby-proportioned.
- **Reference:** Vietnamese traditional figure dolls / Korean webtoon chibi style — adult faces with slightly enlarged head, elegant clothing detail
- VN style hook: LS characters have Đông Sơn spiral tattoo patterns as woven textiles; TL characters have constellation embroidery; DQ characters have brass/cyan tech accent glows
