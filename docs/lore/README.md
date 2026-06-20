# Lore — Narrative Canon

This folder holds the **narrative source of truth** for the game world. Content is written in
Vietnamese and kept as-authored (no translation). Design docs in [`../gdd/`](../gdd/README.md)
*summarize and link here* — they never duplicate bible prose.

## Canon authority (highest → lowest)

1. **[`canon-revision-v2.md`](./canon-revision-v2.md)** — top canon. The world premise: a setting
   ~2000 years after a civilizational collapse, held together by **Ether** at the edge of **The Mist**.
   Supersedes the deprecated `LORE.md` (now in [`../archive/deprecated/`](../archive/deprecated/)).
2. **[`faction-bible-v2.md`](./faction-bible-v2.md)** — each civilization as a complete worldview.
   Follows canon-revision-v2.
3. **[`region-bible-v1.md`](./region-bible-v1.md)** — geography, regions, world-building guidance.
4. **[`secret-lore.md`](./secret-lore.md)** — 🔒 dev-only spoilers / hidden truths. Not surfaced in
   player-facing GDD; do not leak into `gdd/03-world-and-lore.md`.

## Title & factions (canon vs code)

- **Title:** the project codename is **WORLDSCOLIDE** (repo/banner); the in-fiction title is
  **2000s A.C — After the Collapse**. The old marketing title *"Worlds Collide"* is **stale**.
- **World factions (lore):** Linh Sơn, Đế Quốc (Republic Empire), Thiên Lữ, Eliza, Scavenger, and
  others described in `faction-bible-v2.md`.
- **Playable civilizations (code):** only **Linh Sơn** is recruitable today
  (`src/game/data/civilization-config.ts` → `RECRUITABLE_UNITS`); Đế Quốc & Thiên Lữ are defined but
  ship empty; Eliza is roadmap-only. See [`../gdd/04-civilizations.md`](../gdd/04-civilizations.md)
  for the playable + roadmap view. **Lore breadth ≠ playable set** — keep the two framings distinct.

## Reading order

`canon-revision-v2` → `faction-bible-v2` → `region-bible-v1` → (`secret-lore`, devs only).
