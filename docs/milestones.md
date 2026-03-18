# WORLDSCOLIDE Milestones

This document defines the milestone roadmap for **WORLDSCOLIDE** so development stays aligned with the core game vision instead of expanding randomly.

---

## Project State Summary

Current state: **Late Prototype / Early Vertical Slice**

The project already has a strong playable foundation:
- title screen and save slots
- character creation
- game screen with HUD and panels
- guild hall scene
- build mode
- quest dispatch
- combat simulation
- offline tick loop
- save/load persistence

What is still missing is not more systems for the sake of systems, but a clearer sequence of production goals.

---

## Guiding Principle

Every milestone must move the project closer to this question:

**Can a new player understand, enjoy, and want to continue the core guild-building loop?**

Core loop:
**Recruit -> Build -> Dispatch -> Resolve -> Reward -> Upgrade -> Unlock harder content**

---

## Milestone 0 — Freeze Direction

### Goal
Lock the game direction before adding more features.

### In Scope
- define the project vision in one page
- define player fantasy
- define 3 core pillars
- define anti-pillars
- define what the first playable must include
- separate backlog into must / should / nice-to-have

### Out of Scope
- new major mechanics
- visual overhaul
- deep lore expansion
- new content packs

### Definition of Done
- `docs/game-vision.md` exists
- `docs/milestones.md` exists
- core loop is written clearly
- project priorities are visible to future self

---

## Milestone 1 — First Playable

### Goal
Make the game understandable and playable for a new user in the first 5 minutes.

### In Scope
- title screen and save slot flow works reliably
- founder creation works
- guild naming works
- guild hall is usable
- at least 2 key rooms are interactable
- recruit at least 1 mercenary
- dispatch at least 1 mission
- mission can succeed or fail
- rewards are visible
- member status changes are visible
- game over and recovery logic are understandable
- basic onboarding/tutorial flow exists
- character identity exists at a functional level only

### Character Development Focus
At this milestone, character development must stay light and practical.
The goal is not emotional storytelling yet.
The goal is that members feel mechanically different.

Examples:
- founder has name, stats, civilization
- recruits have basic role identity
- civilization affects gameplay flavor
- members are recognizable as useful team pieces

### Out of Scope
- polished art pass
- large content variety
- deep balancing
- advanced VFX
- lore encyclopedia
- deep personal arcs
- relationship systems

### Definition of Done
A new player can:
1. create a founder
2. enter the game
3. recruit a member
4. dispatch a mission
5. receive a result
6. understand what to do next

If the player still needs developer explanation, this milestone is not done.

---

## Milestone 2 — Vertical Slice

### Goal
Build a small but representative slice that shows what the final game should feel like.

### In Scope
- one coherent guild hall presentation
- clearer visual identity beyond placeholder geometry
- 3 civilizations feel distinct enough to notice
- one polished early-game progression path
- one small quest arc or progression chain
- combat replay is readable
- UI feedback is clearer
- basic audio pass supports the game loop
- character identity begins to feel memorable

### Character Development Focus
This is the first milestone where character development should become visible to the player.
It should add flavor and attachment without overwhelming the core loop.

Examples:
- short founder flavor intro
- recruit archetypes or personality tags
- civilization-specific flavor text
- quest results that mention who contributed
- early named recruits or memorable role patterns

### Out of Scope
- full production content
- many zones
- huge enemy roster
- late-game balancing
- advanced monetization or platform work
- full relationship simulation

### Definition of Done
The project can be shown as a believable demo of the final direction.
A player should be able to say:
- what the game is
- why the guild loop is interesting
- what makes civilizations different
- why some characters are beginning to feel distinct

---

## Milestone 3 — Meta Progression

### Goal
Make long-term decisions matter so the player wants to come back.

### In Scope
- clearer civilization differences
- role identity between guild members
- room bonuses matter strategically
- guild upgrade path is meaningful
- economy tuning starts to matter
- injury / recovery / upkeep affects decisions
- better reward scaling
- progression gates feel intentional
- character development becomes a real progression system

### Character Development Focus
This is the main milestone for systemic character development.
Characters should no longer feel like disposable stat blocks.
They should become long-term investments.

Examples:
- traits or quirks
- affinity or compatibility
- rank-up or class growth
- loyalty or trust
- scars, veteran states, or survival history
- unlocks based on mission experience

### Out of Scope
- cosmetic-only systems
- large art expansion
- optional side systems with no effect on the loop
- massive narrative branching

### Definition of Done
A player must start making strategic choices instead of pressing dispatch blindly.
Examples:
- who to recruit
- which room to prioritize
- which mission is worth the risk
- when to spend versus save gold
- which members are worth investing in long-term

---

## Milestone 4 — Content Production Phase 1

### Goal
Turn the prototype loop into an actual game with enough content to sustain play.

### In Scope
- expand mission roster significantly
- expand enemy variety
- expand item drops and rewards
- define 2 to 3 zone identities
- establish progression from F tier upward with enough content density
- add more event variation so repeated runs feel less flat
- expand character development into reusable content

### Character Development Focus
At this stage, character development grows horizontally through content.
The underlying systems should already exist from Milestone 3.
Now the project adds more situations, events, and variations that make guild members memorable.

Examples:
- personal events
- relationship events
- civilization-specific reactions
- rare recruit archetypes
- mini character arcs through missions
- event text tied to traits and history

### Out of Scope
- major systemic redesign
- engine rewrite
- multiplayer
- giant worldbuilding documents disconnected from gameplay

### Definition of Done
The player can continue progressing for a meaningful session without immediately seeing the same few missions repeat.
Character variation should feel broader, not just deeper.

---

## Milestone 5 — Alpha

### Goal
Reach feature-complete status for the intended alpha scope.

### In Scope
- all core systems required for the intended alpha are present
- progression works from early game to midgame
- save/load is stable
- economy is not obviously broken
- UI is understandable without hand-holding
- major blockers are removed
- character systems are integrated into the main progression loop

### Out of Scope
- final polish everywhere
- launch marketing assets
- full content scope for release

### Definition of Done
The game can be played from start to a meaningful midgame state with no missing core features.
This does **not** mean perfect polish. It means the skeleton is complete.

---

## Milestone 6 — Beta / Demo Candidate

### Goal
Prepare the game for external playtesting or a public demo.

### In Scope
- UX cleanup
- better onboarding
- performance pass
- bug fixing pass
- balancing pass for early content
- visual cleanup of key screens
- demo-ready packaging
- final readability pass on character-related systems

### Out of Scope
- endless new content addition
- new experimental mechanics
- scope creep disguised as polish

### Definition of Done
The game is stable and understandable enough that outside players can try it and give useful feedback.
Players should understand why characters matter, not just that they exist.

---

## Character Development Roadmap Summary

Character development should be introduced in layers:

### Milestone 1
Functional identity only.
Characters exist mainly as gameplay pieces.

### Milestone 2
Flavor and memorability.
Players start noticing individuals.

### Milestone 3
Systemic progression.
Players begin investing in specific characters.

### Milestone 4
Content expansion.
Characters generate stories, variation, and attachment.

This order matters.
Do not build deep emotional systems before characters are mechanically meaningful.

---

## Prioritization Rules

When deciding what to build next, always evaluate work in this order:

### Must Have
Things that make the game playable.

Examples:
- onboarding clarity
- recruit/build/dispatch/reward loop
- readable progression
- stable save/load
- mission variety sufficient for early play
- meaningful member roles

### Should Have
Things that make the game stronger and clearer.

Examples:
- stronger civilization differentiation
- better combat readability
- better hall visuals
- stronger audio feedback
- better economy presentation
- memorable character flavor

### Nice to Have
Things that are cool but not currently necessary.

Examples:
- fancy VFX
- extra cosmetic features
- extended lore database
- additional room gimmicks
- experimental side systems
- heavy narrative side content before core progression is stable

---

## Development Warnings

Do **not** fall into these traps between Milestone 0 and Milestone 3:
- adding new systems before current loop is satisfying
- polishing art before core decisions feel meaningful
- expanding lore before progression is strong
- building features because they are interesting to code
- replacing the current stack without hard evidence
- writing deep character arcs before character gameplay value exists

---

## Immediate Next Actions

Recommended next steps right now:

1. finalize `docs/game-vision.md`
2. review current backlog and tag each task as must / should / nice-to-have
3. focus only on remaining gaps for **Milestone 1 — First Playable**
4. keep character work in the M1 layer: role identity and civilization flavor only
5. do not introduce deep relationship or story-heavy systems until Milestone 2 or 3

---

## Success Metric

This roadmap is working if each new feature can clearly answer:

**Does this improve the guild-building core loop, or is it just distracting us?**

If the answer is unclear, it probably does not belong in the current milestone.