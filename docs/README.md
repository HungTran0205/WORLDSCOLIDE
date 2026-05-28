# Documentation — 2000s A.C — After the Collapse

Map of all project documentation. *2000s A.C — After the Collapse* (repo codename **WORLDSCOLIDE**)
is an HD-2D auto-RPG idle guild builder. Docs are organized into **operational root docs** plus
**four tiers**.

> The old title *"Worlds Collide"* and the *Human/Orc/Elf* factions are **stale** — see
> [`lore/README.md`](./lore/README.md) for current canon.

## Start here

1. New to the project? Read [`project-overview-pdr.md`](./project-overview-pdr.md) for the product view.
2. Want the design? Open the **[GDD](./gdd/README.md)** — start at `01-high-concept` → `02-core-loop`.
3. Want the fiction? Open the **[Lore canon](./lore/README.md)**.
4. Want the architecture? Read [`system-architecture.md`](./system-architecture.md).

## Operational docs (root — depended on by tooling/agents; do not move)

| Doc | Purpose |
|-----|---------|
| [`project-overview-pdr.md`](./project-overview-pdr.md) | Product requirements (PDR) |
| [`system-architecture.md`](./system-architecture.md) | Technical design / architecture |
| [`code-standards.md`](./code-standards.md) | Coding conventions |
| [`codebase-summary.md`](./codebase-summary.md) | Codebase map |
| [`project-changelog.md`](./project-changelog.md) | Change history |

## The four tiers

| Tier | Folder | What it holds |
|------|--------|---------------|
| 🎮 **Design** | [`gdd/`](./gdd/README.md) | Living game-design spec, authored from code (sections 01–14 + `rooms/`) |
| 📖 **Canon** | [`lore/`](./lore/README.md) | Narrative source of truth (Vietnamese; bibles + secret lore) |
| 📚 **Reference** | [`reference/`](./reference/) | Lookup data: asset lists, economy calculator, map & VFX guides |
| 🗄️ **Archive** | [`archive/`](./archive/) | History: `journals/`, `brainstorms/`, `deprecated/` (append-only) |
| 🎨 **Concept art** | [`concept-art/`](./concept-art/) | Reference imagery & art notes |

## Conventions

- **Canon vs code:** lore describes the whole world; only **Linh Sơn** is playable today
  (`src/game/data/civilization-config.ts`). GDD `04` reconciles the two.
- **Grounded GDD:** every GDD section cites ≥1 `src/...` file; unverifiable claims are flagged
  `<!-- TODO: verify against code -->`, never invented.
- **No duplication:** GDD summarizes + links to `lore/` and `reference/`; it never copies them.
- **Sync:** editing `src/game/{systems,data,state}/**` triggers a non-blocking GDD-sync reminder
  (see [`gdd/sync-guide.md`](./gdd/sync-guide.md)).
