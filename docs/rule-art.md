# Worlds Collide — Art Direction Rules

## Pixel Sprite + Miniature Storybook Dark Fantasy

### Version

v0.1

### Purpose

This document defines a practical art-direction ruleset for **Worlds Collide** using the following visual strategy:

**Pixel-integrated Miniature Storybook Dark Fantasy**

That means:

* characters remain **pixel sprite based**
* the world is presented like a **handcrafted fantasy miniature**
* lighting feels **theatrical and atmospheric**
* gameplay readability always wins over visual excess

This file is meant to be used as a production guide for:

* environment art
* character art
* VFX
* UI
* lighting
* shader/post-processing
* asset generation prompts
* art review decisions

---

## 1. Core Style Identity

### Style Name

**Miniature Storybook Dark Fantasy**

### Production Variant

**Pixel-integrated Miniature Fantasy**

### One-sentence style statement

> A stylized fantasy world presented like a handcrafted miniature diorama, lit like a theatrical storybook stage, with readable pixel characters integrated into a simplified atmospheric environment.

### Short internal mantra

> Handcrafted miniature fantasy, theatrical light, readable gameplay.

### Decision filter

Whenever a new asset, effect, or screen is created, ask:

> Does this look like it belongs in a handcrafted fantasy miniature built for play?

If the answer is no, it is probably off-style.

---

## 2. High-Level Artistic Goals

The art direction must always support these five goals:

### 2.1 Readability First

The player should understand:

* who is friendly
* who is hostile
* what is interactable
* where the gameplay plane is
* what object is most important in the scene

within about one second.

### 2.2 Miniature World Feeling

Scenes should feel like:

* a fantasy tabletop
* a handcrafted diorama
* a staged set for adventure
* a world made from intentional shapes rather than realistic simulation

### 2.3 Storybook Mood

The world should feel:

* slightly mysterious
* adventurous
* warm in selected areas
* melancholic in shadowed areas
* magical without becoming neon fantasy

### 2.4 Pixel Character Respect

The world must visually support the sprite characters instead of overpowering them.
The environment should stylize downward enough to meet the sprites.

### 2.5 Controlled Atmosphere

Atmosphere is important, but it must never destroy clarity.
Use mood carefully:

* fog
* soft bloom
* god rays
* color grading
* glow accents

Only in measured amounts.

---

## 3. Visual Pillars

### Pillar A — Handcrafted

Everything should feel authored by hand.
Avoid sterile, overly procedural, or overly photoreal visuals.

### Pillar B — Miniature

Large objects should feel like simplified physical pieces in a model world.
The player should feel the world is small enough to understand but rich enough to imagine beyond.

### Pillar C — Readable

All major visual decisions must preserve silhouette, contrast, gameplay layering, and interaction clarity.

### Pillar D — Atmospheric

Scenes should contain light, depth, and mood.
But atmosphere is always secondary to gameplay communication.

---

## 4. What This Style Is Not

This project should avoid drifting into the following incompatible directions:

### 4.1 Not Photoreal Fantasy

Do not aim for realistic bark, realistic stone, realistic foliage density, or physically accurate materials.

### 4.2 Not Luxury Painterly Illustration

Do not make environments so painterly, soft, and high-end that pixel sprites look pasted on top.

### 4.3 Not Hard Retro Pixel Purism

The game is not trying to mimic strict 16-bit era limitations.
Sprites can be modern pixel sprites as long as they remain crisp and readable.

### 4.4 Not Hyper-Neon Magic Fantasy

Avoid glowing fantasy colors everywhere.
Magic accents should feel rare and intentional.

### 4.5 Not Grimdark

The mood can be shadowy and ancient, but it should still contain charm, warmth, and wonder.

---

## 5. Sprite Compatibility Principle

### Rule

If the characters stay pixel-based, the world must stylize down to meet them.

This does **not** mean making the background ugly.
It means making it:

* simpler
* more shape-driven
* less noisy
* less photoreal
* less illustrative in micro-detail

### Result

Pixel characters can coexist beautifully with the world when:

* silhouettes are prioritized
* contrast is controlled
* palette is unified
* ground contact is convincing
* textures support form rather than steal focus

---

## 6. Character Sprite Rules

This section defines how character sprites should function within the style.

### 6.1 Sprite Purpose

Character sprites are the clearest gameplay actors in the scene.
They should communicate:

* archetype
* stance
* mood
* weapon type
* animation intent

### 6.2 Silhouette Rules

Character sprites must have strong silhouette recognition.
At gameplay distance, the player should be able to quickly read:

* head shape
* hair or helmet shape
* main weapon silhouette
* dominant pose line
* class posture

#### Good silhouette signs

* distinctive head accessory
* readable weapon outline
* clear arm and leg placement
* recognizable stance in idle and attack frames

#### Avoid

* tangled limbs
* muddy weapon shapes
* too many tiny straps or details that only work zoomed in
* silhouettes that merge into the background

### 6.3 Detail Density Rules

Sprite detail must remain moderate.
Do not over-render details that disappear at game scale.

#### Prioritize

* face readability
* weapon readability
* torso/limb separation
* costume color blocks

#### Limit

* sub-pixel decorative clutter
* excessive fabric noise
* too many contrast hotspots

### 6.4 Pixel Edge Rule

Character sprites should remain crisp and clearly pixel-authored.
Do not paint over them with soft brushwork that destroys the pixel language.

### 6.5 Palette Rules for Sprites

Sprite colors should stay inside a grounded fantasy palette.
Good sprite colors include:

* muted indigo
* dusty blue
* brown leather
* bone beige
* bronze accents
* warm skin tones
* desaturated reds

Avoid on main characters unless highly intentional:

* neon cyan
* saturated magenta
* electric purple
* synthetic glowing lime
* hyper-clean sci-fi white

### 6.6 Contrast Placement

Sprite contrast should concentrate around the focal gameplay areas:

* face
* head
* weapon
* upper torso

Lower body can be slightly quieter if needed.

### 6.7 Weapon Readability Rule

Weapons must read clearly in silhouette.
Dark weapons in dark scenes may require scene-level support such as:

* rim light
* edge highlight
* stronger top-edge spec accent
* local contrast boost

---

## 7. Character Grounding Rules

This is one of the most important sections for making pixel sprites belong in the world.

### 7.1 Contact Shadow

Every character should have a soft contact shadow directly beneath them.
This is mandatory.

#### Contact shadow should be

* darker closest to the feet
* soft-edged
* small and controlled
* shaped according to the stance

### 7.2 Ground Tint

Characters may receive a subtle color tint from the biome underneath.
Examples:

* greenish bounce in forest grass
* warm brown bounce on dirt
* cool gray bounce in stone interiors

This should be subtle.

### 7.3 Rim Light

When needed, a very gentle rim light can help separate the sprite from the background.
Use sparingly.

### 7.4 Motion Grounding

Movement should be reinforced by simple cues:

* dust puffs
* slight landing shadows
* subtle step feedback
* impact sparks appropriate to the biome

### 7.5 Avoid Floating

Any sprite that appears to hover unintentionally should be fixed immediately through:

* stronger contact shadow
* clearer foot placement
* ground tint
* animation timing adjustments

---

## 8. Environment Rules

The environment should feel like a stylized miniature world that supports sprites.

### 8.1 Environment Role

The environment must provide:

* mood
* place identity
* framing
* depth
* context

But it must not visually overpower the playable characters.

### 8.2 Shape Language

Environment shapes should be:

* chunky
* simplified
* readable
* slightly exaggerated
* intentional

#### Good environment shapes

* large tree trunks with readable roots
* grouped foliage masses
* rocks with clear big planes
* props shaped like fantasy game pieces
* bold roof shapes and iconic building silhouettes

#### Avoid

* over-fragmented shapes
* tiny realistic leaves everywhere
* noisy debris fields
* procedural clutter with no focal hierarchy

### 8.3 Miniature Rule

Ask whether major props look like they could exist in a handcrafted diorama.
That means they should feel:

* simplified
* slightly idealized
* clearly designed

### 8.4 Detail Budget Rule

Environment detail should mostly live in:

* silhouette variation
* medium-shape texture breakup
* value variation
* carefully placed small accents

Do not let detail rely on dense micro-noise.

### 8.5 Material Rule

Materials should read as stylized impressions, not realistic scans.

#### Wood

* warm
* readable grain, but restrained
* form first, grain second

#### Stone

* clear massing
* broad value changes
* softened stylized planes

#### Dirt / Ground

* simple texture rhythm
* readable path edge
* enough variation to feel alive
* not too noisy

#### Foliage

* grouped into masses
* fewer leaf-level details
* readable lighting volumes

---

## 9. Background Detail Hierarchy

### Core rule

The background must never become more visually important than the active gameplay layer.

### 9.1 Foreground

Foreground may be:

* darker
* blurrier
* more contrasty in silhouette
* framing-oriented

Its job is to create depth and stage the scene.

### 9.2 Gameplay Plane

This is the clearest layer.
It should contain:

* strongest readability
* clearest actor separation
* controlled texture
* controlled lighting

### 9.3 Midground

Supports atmosphere and place identity.
Should be softer than the gameplay plane.

### 9.4 Background

Should be more:

* desaturated
* lower contrast
* softer
* simplified

### 9.5 Anti-Mismatch Rule

If a background element feels more like a finished illustration than a game layer, simplify it.

---

## 10. Lighting Rules

Lighting is a major part of the style. It should feel theatrical and storybook-like.

### 10.1 Lighting Philosophy

Lighting is designed, not merely simulated.
It should guide the eye and build emotion.

### 10.2 Every Scene Should Have

#### Key Light

The main readable light source.

#### Accent Light

Used to emphasize an important object, hero prop, or combat beat.

#### Atmosphere Light

Used for haze, volume, fog, or subtle mood shaping.

### 10.3 Exterior Forest Lighting

Recommended pattern:

* warm directional sunlight
* soft cool ambient fill
* filtered light beams through trees
* subtle haze to separate layers

### 10.4 Interior Lighting

Recommended pattern:

* warm practical sources such as fire, torch, brazier, lantern
* deep shadows with readable forms
* focal light on hero object or central activity zone

### 10.5 Lighting Intensity Control

Avoid extreme contrast that makes sprites disappear.
Shadow mood is welcome, but sprite readability is non-negotiable.

### 10.6 Black Level Rule

Avoid pure black voids in most scenes.
Use:

* deep blue-green
* deep brown-black
* muted purple-black
* textured darkness
* fogged darkness

### 10.7 Beam / God Ray Rule

God rays should feel connected to the environment, not pasted as a post-process sticker.
They should originate from believable openings in foliage or structure.

---

## 11. Color Rules

### 11.1 Overall Palette Philosophy

Use grounded natural colors with selective magical accents.

### 11.2 Base Palette Family

Primary recurring world colors:

* moss green
* pine green
* bark brown
* warm earth brown
* muted stone gray-green
* deep teal shadow
* dusty navy / indigo character accents

### 11.3 Accent Palette Family

Accent colors should be limited and functional.

#### Suggested accent roles

* interactable magic: soft gold, pale yellow-green, faint cyan if needed
* enemy danger: muted red, controlled acidic green
* player-friendly UI: soft green-blue
* premium UI trim: brass / antique gold

### 11.4 70 / 20 / 10 Balance

A good general split:

* 70% grounded base colors
* 20% supporting variation
* 10% accents

### 11.5 Saturation Control

Reserve strong saturation for:

* key enemies
* magic effects
* important collectibles
* important UI states

Do not make all biomes or all props equally saturated.

---

## 12. Biome Rules

Each biome needs its own personality while staying within the global visual language.

### 12.1 Every Biome Needs

* one dominant palette story
* one main lighting feeling
* one main shape language bias
* one emotional identity

### 12.2 Example — Forest Biome

#### Palette

* moss green
* warm dirt brown
* bark brown
* soft gold light
* deep teal shadows

#### Light

* warm beams through canopy
* cool deep background atmosphere

#### Shape language

* thick trunks
* root forms
* grouped conifer silhouettes
* simplified forest props

#### Mood

* adventurous
* mystical
* slightly lonely
* safe-but-not-completely-safe

### 12.3 Example — Cave / Quarry Biome

#### Palette

* slate gray
* cool stone blue-gray
* muted brown scaffolds
* pale torch amber
* dusty mineral accents

#### Shape language

* vertical stone masses
* carved planes
* stronger shadow columns

#### Mood

* ancient
* hidden
* dangerous but discoverable

---

## 13. Room and Facility Rules

Facilities and management spaces should still follow the miniature fantasy rule.

### 13.1 Each Room Must Answer

1. What is this place used for?
2. What is the emotional tone of this place?
3. What is the hero prop of this place?

### 13.2 Hero Prop Rule

Every room should have one main visual anchor.
Examples:

* brazier
* guild table
* rune stone
* giant stump
* brewing apparatus
* shrine

### 13.3 Support Prop Rule

After the hero prop, add:

* two or three supporting props
* one ambient effect if needed

### 13.4 Empty Prototype Room Warning

If a room feels like a box with scattered props, it needs:

* focal hierarchy
* better lighting
* stronger hero object
* stronger wall/floor identity

---

## 14. UI Rules

The UI should support the fantasy tone without stealing attention from the scene.

### 14.1 UI Identity

Recommended UI style:

* dark wood
* dark stone
* brass trim
* restrained ornamentation
* readable fantasy typography or pseudo-fantasy framing

### 14.2 UI Priority Rule

The gameplay scene is the main stage.
UI is the frame, not the main event.

### 14.3 UI Contrast Rule

UI must be readable but not brighter than the most important gameplay element unless absolutely necessary.

### 14.4 UI Accent Rule

Gold or brass should be used for:

* active choices
* key buttons
* headers
* premium or important indicators

### 14.5 Avoid

* glossy mobile-game gradients
* neon sci-fi glows
* too many competing highlight colors
* modern flat UI that clashes with the world tone

---

## 15. VFX Rules

VFX should be simple, readable, and style-coherent.

### 15.1 VFX Purpose

Effects should clarify:

* action
* magic
* hit timing
* movement
* state change

### 15.2 Good VFX Types for This Style

* dust puffs
* spark motes in sunbeams
* small weapon flash
* magical particle drift
* soft slime glow
* compact hit sparks
* brief impact lines

### 15.3 VFX Shape Rule

Effects should have controlled shape language.
They should not become noisy particle clouds.

### 15.4 VFX Color Rule

Use VFX color as communication.
Do not spam many unrelated effect colors in one scene.

### 15.5 Avoid

* excessive bloom explosions
* hyper-anime screen-filling slashes unless the game clearly commits to that style
* sci-fi neon trails
* particles so numerous they obscure sprites

---

## 16. Post-Processing Rules

Post-processing is allowed and useful, but must be disciplined.

### 16.1 Recommended Post Stack

* subtle color grading
* very light bloom
* vignette kept minimal
* atmospheric haze
* soft depth separation where appropriate

### 16.2 Main Goal of Post

Unify the world and the sprites.

### 16.3 Avoid

* heavy blur that muddies pixel sprites
* bloom that destroys crisp readability
* strong chromatic aberration
* cinematic filters that make the game look unlike itself

### 16.4 Pixel Protection Rule

Post-processing should never melt the pixel identity of characters.

---

## 17. Camera and Composition Rules

### 17.1 Camera Philosophy

The camera should feel staged, intentional, and easy to read.

### 17.2 Composition Goals

Scenes should have:

* focal hierarchy
* strong readable gameplay band
* visual framing elements
* good negative space around important actors

### 17.3 Combat Composition Rule

For combat:

* active units must stay readable against the background
* attack direction should be obvious
* enemy grouping should feel intentional, not randomly scattered
* the center gameplay band should remain the clearest value zone

### 17.4 Avoid

* backgrounds that visually split attention evenly across all corners
* giant props swallowing the combat layer
* clutter that blocks attack readability

---

## 18. Animation Rules

Animation is essential for making the style feel alive.

### 18.1 Animation Philosophy

Because the sprites are small, animation should emphasize:

* strong key poses
* anticipation
* follow-through
* directional clarity
* timing readability

### 18.2 Idle Animations

Should provide life without noise.
Small breathing, weapon drift, cloth or hair shift, and subtle stance energy are useful.

### 18.3 Attack Animations

Should be readable even if short.
Focus on:

* prep pose
* release pose
* recoil or follow-through
* hit readability

### 18.4 Ranger / Crossbow Specific Notes

For archer / crossbow classes:

* recoil should be visible
* body twist should be readable
* weapon flash should be compact
* shot direction should be unmistakable

### 18.5 Avoid

* over-busy idle loops
* unclear attack frames
* effects that replace rather than support motion clarity

---

## 19. Technical Art Notes

These are practical suggestions for implementation.

### 19.1 Recommended Character Support Systems

* contact shadow under sprites
* optional rim light pass
* ground tint support
* small movement dust effects
* depth sorting discipline

### 19.2 Recommended Environment Support Systems

* simplified stylized materials
* restrained normal use if working in 3D
* clear fog layering
* controllable color grading by biome
* hero prop highlight tools

### 19.3 Shader Guidance

If using shaders, prefer them for:

* palette unification
* shadow softness
* atmosphere
* sprite grounding

Do not use shaders to make sprites look painterly if their identity is pixel-based.

---

## 20. Asset Review Checklist

Every major asset should pass this checklist.

### 20.1 Style Fit

* Does this feel handcrafted rather than sterile?
* Does this feel like it belongs in a miniature fantasy world?
* Does it preserve gameplay readability?

### 20.2 Shape

* Is the silhouette readable?
* Are big forms clear?
* Is detail density under control?

### 20.3 Palette

* Does the color fit the biome?
* Does it avoid unnecessary saturation?
* Does it harmonize with character sprites?

### 20.4 Scene Role

* Is it background, support, hero prop, or gameplay object?
* Is it acting at the right visual volume for that role?

### 20.5 Technical Integration

* Does it ground correctly in scene lighting?
* Does it clash with sprite sharpness?
* Does it introduce too much noise or contrast?

If an asset fails more than two of these checks, it should be revised.

---

## 21. Prompt Keywords for Asset Generation

These keywords can be reused in concept prompts or visual generation tasks.

### 21.1 Global Style Keywords

* handcrafted miniature fantasy
* storybook dark fantasy
* stylized fantasy diorama
* theatrical lighting
* atmospheric depth
* readable gameplay scene
* muted natural palette
* brass fantasy UI
* chunky silhouettes
* simplified fantasy environment

### 21.2 Environment Prompt Add-ons

* grouped foliage masses
* soft painterly gradients without excessive detail
* stylized roots and trunks
* warm directional sunlight
* cool atmospheric forest depth
* clear gameplay plane

### 21.3 Room Prompt Add-ons

* hero prop centered
* warm practical light source
* fantasy guild interior
* readable prop clustering
* stylized wooden architecture

### 21.4 What to Avoid in Prompts

* hyper realistic
* ultra detailed foliage
* photoreal materials
* cinematic AAA realism
* luxury oil painting background
* neon fantasy effects everywhere

---

## 22. Sample Environment Prompt

Use this as a base template for generating a forest combat environment that fits the current sprite style:

> Forest combat lane, handcrafted miniature fantasy diorama, stylized chunky tree trunks, grouped foliage masses, warm earthen path across the center, readable gameplay plane, atmospheric forest depth, soft golden sunlight beams through canopy, muted moss greens and warm browns, theatrical storybook lighting, simplified fantasy environment designed to fit small pixel RPG characters, dark fantasy mood with charm and adventure, restrained detail, no photorealism, no ultra-dense foliage.

---

## 23. Sample Character Integration Prompt

Use this when discussing how sprites should appear inside the world:

> Small readable pixel RPG character integrated into a stylized miniature fantasy environment, strong contact shadow, subtle ground tint, careful rim separation, muted natural palette, gameplay-first silhouette, grounded on the terrain, theatrical ambient lighting, atmospheric but clear presentation.

---

## 24. Production Priorities

If time is limited, focus on these items in order:

### Priority 1

* contact shadows for sprites
* palette unification
* background simplification
* gameplay plane clarity

### Priority 2

* better light hierarchy
* room hero props
* improved environment shape language
* stronger foreground / midground / background separation

### Priority 3

* biome-specific atmosphere tuning
* polish VFX
* richer environmental storytelling
* advanced shader unification

---

## 25. Final Guidance

The current project does **not** need to abandon pixel characters.
The correct move is to build a world that respects them.

The best artistic direction for the current production setup is:

## **Pixel-integrated Miniature Storybook Dark Fantasy**

That means:

* keep sprite readability
* simplify and stylize the world
* use theatrical light carefully
* ground characters into the scene
* keep palette disciplined
* make every place feel like a designed fantasy miniature

### Final production law

> Everything in Worlds Collide should look like a handcrafted fantasy miniature staged for play, while remaining clear enough to function as a game first.
