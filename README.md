# Arcane Record

A local-first, multi-game tabletop character-record application. Characters are
saved only in IndexedDB in the current browser profile. There is no account,
backend, telemetry, or online backup for character data. Mage: The Ascension
20th Anniversary Edition is the first complete game module, with a guided
creation and advancement rules engine. Exalted First Edition is registered
with all seven splats — Solar, Dragon-Blooded, Lunar, Abyssal, Sidereal,
Alchemical, and Fair Folk — each with its own schema and creator stage.
Burning Wheel Gold + Codex adds a guided character burner and playable sheet
for Man, Dwarf, Elf, Orc, Roden, Great Wolf, and Troll. Torchbearer Second
Edition adds a guided core character creator and editable two-page adventurer
record with the same local-first and responsive sheet controls.

## Supported games

Every game below is reachable from the `/create` game-selection page and
shares the same local-first persistence, section navigation, and appearance
controls. The description in each row is the game's own in-app summary (see
`src/games/*/definition.tsx`), so it stays accurate as modules evolve; treat
that source, not this table, as authoritative if they ever disagree. See
[docs/16-multi-game-architecture.md](docs/16-multi-game-architecture.md) for
the registry-level detail, including which systems also have a dedicated
planning/implementation doc.

| Game                                                                                           | In-app description                                                                                                   |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Mage: The Ascension 20th Anniversary Edition                                                   | Guided creation and an advancement rules engine for mages, their Spheres, Focus, Advantages, and chronicles          |
| Exalted First Edition (Solar, Dragon-Blooded, Lunar, Abyssal, Sidereal, Alchemical, Fair Folk) | Unified First Edition records for the Exalted character family, each splat with its own guided creator stage         |
| Burning Wheel Gold + Codex                                                                     | A local-first character burner and play record for seven Burning Wheel stocks                                        |
| Torchbearer Second Edition                                                                     | A local-first guided core character creator and editable adventurer record                                           |
| Earthdawn Fourth Edition                                                                       | A guided local-first adept builder and play sheet                                                                    |
| Shadowrun First Edition                                                                        | A local-first priority builder and play sheet for the original Shadowrun rules                                       |
| City of Mist (Character: Rift/Gatekeeper; Crew)                                                | Guided Rift and Gatekeeper character creation, theme development, and structured play                                |
| Curseborne                                                                                     | **Preview** — editable sheet with curse resources, injuries, and manual EXP; guided creation is still in development |
| Legend in the Mist                                                                             | Guided mythic Hero creation, structured play, development, and local Fellowships                                     |
| Changeling: The Dreaming 20th Anniversary                                                      | An adaptive creator and local-first sheet for Kithain and other verified changeling families                         |
| Vampire: The Dark Ages 20th Anniversary                                                        | A source-cited fledgling creator, maturation workflow, and local-first Dark Medieval vampire sheet                   |
| Vampire: The Masquerade 20th Anniversary (Vampire, Ghoul, Revenant)                            | A source-cited fledgling creator, maturation workflow, and local-first modern World of Darkness vampire sheet        |
| Werewolf: The Apocalypse 20th Anniversary                                                      | Guided Garou, Changing Breed, Kinfolk, and Wyrm-aligned creation with local play and advancement tools               |
| Wraith: The Oblivion 20th Anniversary (Psyche and Shadow sheets)                               | Guided Wraith and Medium creation, linked Shadows, Haunts, Risen state, and restricted Spectres                      |
| Mouse Guard Second Edition                                                                     | Recruit a guardmouse, manage missions, roll tests, and advance through play                                          |
| Band of Blades                                                                                 | Build and play Legionnaires linked to a local Legion campaign                                                        |
| Blades in the Dark                                                                             | Build and play a scoundrel linked to a browser-local Crew                                                            |
| Miseries & Misfortunes                                                                         | Create and play a seventeenth-century protagonist through birth, lifepaths, fortune, and misfortune                  |
| Monster of the Week                                                                            | Build and play a Hunter linked to a browser-local Keeper campaign                                                    |
| Call of Cthulhu Second Edition                                                                 | Build and play a classic percentile investigator linked to a browser-local Keeper campaign                           |
| Call of Cthulhu Seventh Edition                                                                | Build and play a Seventh Edition investigator using the player-facing Investigator's Handbook                        |
| Root: The Roleplaying Game                                                                     | Build and play a Woodland vagabond linked to a browser-local campaign                                                |
| Dragonbane                                                                                     | Build and play an adventurer using the Dragonbane core rules                                                         |
| Scum and Villainy                                                                              | Build and play a spacefaring scoundrel linked to a browser-local ship                                                |
| Ars Magica Definitive Edition                                                                  | Guided and manual Magus, Companion, and Grog records using the Definitive Edition rules and sheet hierarchy          |
| KULT: Divinity Lost                                                                            | Manual General, Sleeper, Aware, and Enlightened sheets with source-backed inspiration and structured play records    |

Curseborne is the only system currently labeled a preview; every other row
above is a complete, non-placeholder creation flow and sheet. Deferred or
placeholder content inside any module (for example experimental declarative
previews) is always visibly labeled as a preview and never implied to be a
finished record.

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

The application now includes a game-neutral library, explicit game selection,
registry-routed character pages, recoverable unavailable-system records, and a
versioned JSON/YAML exchange envelope, shared across every game listed above.
The Mage 20 module includes the complete existing editor and its browser-local
autosave behavior. Burning Wheel also supports legacy Charred Black `.char`
interchange and an original locally generated PDF. Its adapted catalogs and
burner logic are clearly marked GPL-3.0; provenance and source-build
instructions are in `docs/references/burning-wheel/charred-black-source.md`.

A separately deployed, optional Module Registry (see
[docs/16-multi-game-architecture.md](docs/16-multi-game-architecture.md)) may
host authenticated publisher identities, validated module packages, and
review/audit metadata. It never receives character data, and every module the
app can render remains fully usable offline once cached locally.

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
