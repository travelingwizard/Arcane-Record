# Arcane Record

A local-first, multi-game tabletop character-record application. Characters are
saved only in IndexedDB in the current browser profile. There is no account,
backend, telemetry, or online backup. Mage: The Ascension 20th Anniversary
Edition is the first complete game module. Exalted First Edition is registered
with Solar and Dragon-Blooded sheets. Burning Wheel Gold + Codex adds a guided
character burner and playable sheet for Man, Dwarf, Elf, Orc, Roden, Great
Wolf, and Troll. Torchbearer Second Edition adds an editable two-page
adventurer record with the same local-first and responsive sheet controls.

The Mage long-form editor includes URL-addressable sections, a searchable Equipment
catalog, Combat and Do Maneuvers, a sticky desktop section rail, and a mobile
Sections sheet with independently collapsible sections. Expansion preferences
stay in browser-local interface storage and are not included in character
exports.

The desktop left rail, mobile Sections sheet, and pencil-gated group ordering
are shared character-sheet controls. Game modules provide stable section
definitions and persist any character-owned order required by that sheet.

## Local development

Requirements: a current Node.js release compatible with the checked-in dependencies and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173/`.

## Verification

```sh
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

The Playwright smoke test starts its own local Vite server. If the bundled browser is unavailable, install only the Playwright Chromium browser with `npx playwright install chromium`; no operating-system package installation is required for the rest of the project.

## Milestone scope

This milestone includes a game-neutral library, explicit game selection,
registry-routed character pages, recoverable unavailable-system records, and a
versioned JSON/YAML exchange envelope. The Mage 20 module includes the complete
existing editor and its browser-local autosave behavior. Burning Wheel also
supports legacy Charred Black `.char` interchange and an original locally
generated PDF. Its adapted catalogs and burner logic are clearly marked
GPL-3.0; provenance and source-build instructions are in
`docs/references/burning-wheel/charred-black-source.md`.

See [docs/00-project-charter.md](docs/00-project-charter.md) for goals and assumptions.
See [docs/16-multi-game-architecture.md](docs/16-multi-game-architecture.md) for
the game registry, persistence envelope, routes, and migration.
See [docs/17-exalted-1e-foundation.md](docs/17-exalted-1e-foundation.md) for the
two Exalted sheet variants and the implemented first-page scope.
See [docs/18-torchbearer-2e-foundation.md](docs/18-torchbearer-2e-foundation.md)
for the Torchbearer field map and deferred rules boundary.
See [docs/12-section-navigation.md](docs/12-section-navigation.md) for the
section registry, anchors, responsive behavior, and preference boundary.
See [docs/13-magick-sections-plan.md](docs/13-magick-sections-plan.md) for the
Focus, Wonders, and Rotes architecture, migration record, and content-review
boundary.
See [docs/14-equipment-implementation.md](docs/14-equipment-implementation.md)
for the Equipment catalog, ownership model, and schema migration.
See
[docs/features/combat-and-do-maneuvers.md](docs/features/combat-and-do-maneuvers.md)
for Combat Reference favorites and official Special Do Technique behavior.
