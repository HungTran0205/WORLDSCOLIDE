# Enemy Sprites Generation Plan Created

**Date**: 2026-04-04 15:44
**Severity**: Medium
**Component**: Art Assets, Enemy Sprites, Sprite Generation Pipeline
**Status**: Planned

## What Happened

Created a focused plan to generate the 11 missing enemy sprites using a dual-tool strategy: Pixellab MCP for standard enemies, ai-artist for special cases that don't fit Pixellab templates. Current state: 4/15 sprites complete (slime, forest-spider, goblin, cave-bat), leaving a clear inventory of work.

Plan location: `d:/WORLDCOLIDE/plans/260404-1544-enemy-sprites-generation/`

## The Brutal Truth

We have a half-done sprite set with scattered raw frames and inconsistent organization. The goblin and cave-bat exist only as unstructured frame dumps. Rather than stare at this mess longer, we've locked down a concrete execution path: identify which enemies fit Pixellab's humanoid/quadruped templates (9 of 11) and which demand special handling (2 of 11—blobs and massive spiders).

The relief: we have tool coverage. We're not reinventing sprite generation; we're using existing services with known capabilities. The constraint: all sprites must match the slime standard—48×48, 4 directions, low top-down view, muted desaturated colors, 1px dark outline, transparent background. Bosses scale to 64×64.

## Technical Details

### Sprite Inventory

| Enemy | Status | Dimensions | Type |
|-------|--------|-----------|------|
| Slime | Done ✓ | 48×48 | Quadruped |
| Forest Spider | Done ✓ | 48×48 | Quadruped |
| Goblin | Raw frames | 48×48 | Humanoid |
| Cave Bat | Raw frames | 48×48 | Humanoid |
| Bandit | Missing | 48×48 | Humanoid (Pixellab) |
| Wild Boar | Missing | 48×48 | Quadruped (Pixellab bear template) |
| Wolf | Missing | 48×48 | Quadruped (Pixellab dog template) |
| Slime King | Missing | 64×64 | Special (ai-artist blob) |
| Goblin Shaman | Missing | 48×48 | Humanoid (Pixellab) |
| Queen Spider | Missing | 64×64 | Special (ai-artist 8-legged boss) |
| Orc Warrior | Missing | 48×48 | Humanoid (Pixellab) |
| Dire Wolf | Missing | 48×48 | Quadruped (Pixellab lion template) |
| Orc Berserker | Missing | 48×48 | Humanoid (Pixellab) |
| Stone Golem | Missing | 48×48 | Humanoid (Pixellab) |
| Warlord Grok | Missing | 64×64 | Humanoid boss (Pixellab) |

### Tool Assignment

**Pixellab MCP (`create_character`)**: 9 enemies
- Humanoids (6): bandit, goblin-shaman, orc-warrior, orc-berserker, stone-golem, warlord-grok
- Quadrupeds (3): wolf (dog template), wild-boar (bear template), dire-wolf (lion template)

**ai-artist**: 2 enemies
- Slime King: amorphous gelatinous blob, no humanoid skeleton, requires custom generation
- Queen Spider: 8-legged arachnid boss 64×64, beyond Pixellab's character templates

### Style Constraints (Locked)

- **Resolution**: 48×48 standard, 64×64 for bosses (Warlord Grok, Slime King, Queen Spider)
- **Directions**: 4 (up, down, left, right) matching top-down perspective
- **View**: Low top-down angle (matching existing slime standard)
- **Palette**: Muted, desaturated colors—no bright neons
- **Outline**: Dark 1px stroke on all sprites
- **Background**: Full transparency (no opaque pixels outside sprite bounds)

## What We Tried

1. **Single-tool approach (all Pixellab)** → Rejected. Pixellab excels at humanoids and standard quadrupeds. Slime King and Queen Spider don't fit anthropomorphic templates—would need heavy post-processing or custom prompts that fall outside Pixellab's design intent.

2. **Manual art for all 11** → Not feasible. Time cost is prohibitive; tool-assisted generation with post-processing is faster and more scalable.

3. **Keep raw frames as-is** → Creates tech debt. Raw frames need reorganization into structured folders (`up/`, `down/`, `left/`, `right/`) before integration into the sprite system. Addressed in plan as prerequisite.

## Root Cause Analysis

**Why sprite generation stalled**: Missing a clear decision framework for tool selection. We had tools available but no documented rationale for which tool handles which enemy. Plan locks this down.

**Why organization scattered**: Goblin and cave-bat were generated without cleanup protocol. When frames arrived, they got dumped into raw folders instead of sorted into directional subdirectories. This is a process gap, not a tool gap.

## Lessons Learned

1. **Lock Style Standards Early**: The "muted desaturated colors + 1px outline + 4 directions" spec should've existed before the first sprite. Now it's baked into the plan to avoid inconsistency across the new batch.

2. **Tool Capability Mapping Saves Iteration**: Knowing Pixellab's limits upfront (humanoid-centric, no blob/spider) means we pick ai-artist for edge cases without wasting Pixellab credit on doomed attempts.

3. **Raw Assets Need Intake Process**: Adding a "frame organization" step post-generation is cheaper than fixing it later. Goblin/cave-bat reorganization is now explicit in the plan.

4. **Sprite Inventory Prevents Drift**: Maintaining a clean table of what exists vs. what's missing keeps the team aligned. No guessing "did we do the dire wolf?"

## Next Steps

1. **Reorganize existing raw frames**: Sort goblin and cave-bat frames into directional folders (`up/`, `down/`, `left/`, `right/`). Prerequisite before integration testing.

2. **Generate Pixellab batch (9 enemies)**: Run `create_character` for all 9 Pixellab-suitable enemies with locked style prompt (muted palette, 1px outline, 4 directions, 48/64×48/64).

3. **Generate ai-artist specials (2 enemies)**: Use ai-artist for Slime King and Queen Spider with custom prompts emphasizing blob/arachnid anatomy.

4. **Post-process all**: Verify all sprites match style standard, clean up artifacts, export with transparency, organize into project sprite tree.

5. **Integration testing**: Load all 15 sprites into combat simulator, verify rendering, hitboxes, animation frame counts.

6. **Docs update**: Add sprite standard and generation pipeline to `docs/asset-standards.md` or new asset guide.

---

**Unresolved Questions**:
- Should Slime King have multiple frames (pulsate animation) or static blob? Plan assumes static, but pulsation might improve visual appeal.
- Queen Spider: should she have attack animation frame variants, or use same 4-direction set as movement? Clarify before ai-artist prompt.
- Goblin shaman: add staff/robe detail to distinguish from regular bandit, or keep minimalist? Style consistency vs. visual variety trade-off.
