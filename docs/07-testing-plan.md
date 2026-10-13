# 07. Testing plan

## Unit

- Zod accepts a valid blank character and rejects malformed IDs, timestamps, ratings, and affinity values.
- Older records migrate through schema version 7 with default Abilities,
  Enlightenment, catalog-backed or unresolved Backgrounds, empty Merit/Flaw
  selections where required, and lossless Magick placeholder conversion.
- Sphere sorting covers all modes, affinity tie-breaking, and preservation of the underlying ratings.
- DotRating covers pointer toggling, lower selection, keyboard commands, limits, labels, disabled, and read-only behavior.
- The desktop wheel toggle covers shared ratings, shared affinity, and local view preference.
- JSON and YAML round trips preserve character data while imports receive fresh IDs and timestamps.
- The Merits and Flaws catalog covers schema validation, entry counts, fixed/discrete/range costs, citations, aliases, search, filtering, sorting, totals, projections, and missing-cost review flags.
- The Background catalog covers all 33 definitions, standard and extended ratings, one- and two-point multipliers, aliases, citations, restrictions, repeatability, search, filtering, sorting, totals, projections, and unresolved references.
- Magick catalog tests cover 40 Paradigms, 38 Practices, 73 Instruments, 37
  Wonders, and 60 Rotes; unique stable IDs; families; preview status; mature
  labels; indexed-only entries; and search.
- Magick schema tests cover custom, catalog, and unresolved selections,
  structured Sphere ranges, wrong-kind references, duplicate IDs, and
  duplicate definitions.
- Equipment catalog tests cover all 271 definitions (133 supplied and 138
  comparison additions), categories,
  families, unique stable IDs, important information, citations, preview
  state, mature labels, and search.
- Equipment schema tests cover catalog, custom, and unresolved records,
  quantity bounds, category matching, duplicate IDs, and duplicate known
  definitions.
- Maneuver catalog tests cover 31 Combat entries across four categories, 12
  Revised Do entries, 3 Legacy Do entries, source/page data, search, unique
  stable IDs, and exclusion of The Final Blow.
- Maneuver schema tests cover favorites, custom Combat references, known,
  custom, and unresolved Do selections, duplicate IDs, and migration defaults.
- The section registry covers stable unique IDs, order, groups, valid and
  invalid hashes, summary calculations, and warning text.
- Section preferences cover per-character keys, initial hash expansion,
  unknown-ID filtering, Expand All, Collapse All, and export exclusion.
- Appearance preferences cover validated defaults, invalid-storage fallback,
  system light/dark resolution, and semantic root attributes.

## Integration

An in-memory repository test double exercises create, reopen, rename, duplicate with a fresh UUID, and delete. UI integration tests cover affinity selection, replacement, and clearing; Ability and Enlightenment editing; Background previews, ratings, names, costs, restrictions, repeatability, pooling, removal, and Undo; sequential Health damage; Merits and Flaws previews, selection, legal cost changes, totals, warnings, removal, and Undo; Focus catalog and custom selections; significant Instruments; Need; Wonder catalog and custom records; structured Rote requirements; Magick removal Undo; Equipment catalog/custom creation, important-information display, quantity, equipped state, removal, and Undo; Combat search, filters, favorites, custom references; Revised/Legacy Do visibility, selection, notes, custom entries, removal, and Undo; and IndexedDB schema migration.

Navigation integration covers desktop links and `aria-current`, keyboard focus
after navigation, valid and invalid initial hashes, history events, independent
mobile disclosures, focus recovery on collapse, modal Escape and focus
restoration, background-scroll prevention, bulk expansion controls, mounted
form-state preservation, and direct warning summaries.

Appearance integration covers all theme and overlay choices, explicit selected
states, the complete live sample, immediate root updates, browser-local
persistence, restoration, motion reduction, and full reset.

## End to end

Playwright creates a character, sets Name, Strength, Alertness, Forces,
affinity, Arete, Health damage, Total Experience, and Current Experience,
reloads the app, and verifies persistence. Exalted verifies ledger-derived
experience labels, and Burning Wheel verifies both totals in Play mode. A
Background scenario searches, previews, expands, adds one- and two-point
entries, rates them, verifies warning-only totals, edits character details,
persists, removes, and restores a selection. A Merits and Flaws scenario
searches, previews, expands, projects, adds, persists, changes cost, removes,
and restores selections. File exchange verifies JSON Save and local file
import. The tests run against a local Vite server only.

A Magick scenario selects a catalog Paradigm, records a significant custom
Instrument, creates a Wonder and a Rote, persists them across refresh, verifies
their local JSON export, and checks 320px overflow.

An Equipment scenario records catalog armor and custom field gear, persists
both across refresh, verifies local export boundaries, and checks 320px
overflow.

A Maneuvers scenario favorites a Combat reference, adds custom Combat and
structured Do entries, selects an official M20 Special Do Technique within the
Do allowance, persists across refresh, verifies local export boundaries, and
checks 320px overflow.

Section-navigation scenarios cover the desktop rail at 1440px, the 1120px
breakpoint, IntersectionObserver active links, fragments, Back navigation,
mobile selection and independent expansion at 390px, preference restoration,
preserved edits, and 320px overflow.

Appearance scenarios cover legacy migration, per-character isolation,
default/universal actions, cross-game theme availability, custom background
colors, synchronized Mage Sphere settings, immediate root attributes, reload
restoration, live preview content, and mobile overflow.

## Coverage by game

Every registered game has unit and/or integration coverage for its schema,
adapter, and editor behavior. Most also have a dedicated Playwright e2e spec
under `tests/e2e/`; a few share coverage with a cross-game smoke spec instead
of a dedicated file, noted below.

| Game                   | Dedicated e2e spec                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mage 20                | `mage20-creation.spec.ts`, `mage20-module.spec.ts`, `mage20-sources.spec.ts`, `mage20-trait-pricing.spec.ts`, plus `magick.spec.ts`, `maneuvers.spec.ts`, `merits-flaws.spec.ts`, `backgrounds.spec.ts`, `equipment.spec.ts` |
| Exalted First Edition  | `exalted.spec.ts`, `exalted1e-module.spec.ts`, `exalted1e-lunar.spec.ts`, `exalted1e-abyssal.spec.ts`, `exalted1e-sidereal.spec.ts`, `exalted1e-alchemical.spec.ts`, `exalted1e-fair-folk.spec.ts`                           |
| Burning Wheel          | `burning-wheel.spec.ts`                                                                                                                                                                                                      |
| Torchbearer 2e         | `torchbearer2e.spec.ts`                                                                                                                                                                                                      |
| Earthdawn 4e           | `earthdawn4e.spec.ts`                                                                                                                                                                                                        |
| Shadowrun 1e           | `shadowrun1e.spec.ts`                                                                                                                                                                                                        |
| City of Mist           | shared `new-game-source-controls.spec.ts` smoke coverage; no dedicated spec yet                                                                                                                                              |
| Curseborne             | shared `new-game-source-controls.spec.ts` smoke coverage; no dedicated spec yet                                                                                                                                              |
| Legend in the Mist     | `legend-in-the-mist.spec.ts`                                                                                                                                                                                                 |
| Changeling 20          | `changeling20.spec.ts`                                                                                                                                                                                                       |
| Vampire Dark Ages 20   | `vampire-dark-ages20.spec.ts`                                                                                                                                                                                                |
| Vampire 20             | `vampire20.spec.ts`                                                                                                                                                                                                          |
| Werewolf 20            | `werewolf20.spec.ts`                                                                                                                                                                                                         |
| Wraith 20              | `wraith20.spec.ts`                                                                                                                                                                                                           |
| Mouse Guard 2e         | `mouse-guard2e.spec.ts`                                                                                                                                                                                                      |
| Band of Blades         | `band-of-blades.spec.ts`                                                                                                                                                                                                     |
| Blades in the Dark     | `blades-in-the-dark.spec.ts`                                                                                                                                                                                                 |
| Miseries & Misfortunes | `miseries-and-misfortunes.spec.ts`                                                                                                                                                                                           |
| Monster of the Week    | `monster-of-the-week.spec.ts`                                                                                                                                                                                                |
| Call of Cthulhu 2e     | `call-of-cthulhu2e.spec.ts`                                                                                                                                                                                                  |
| Call of Cthulhu 7e     | `call-of-cthulhu7e.spec.ts`                                                                                                                                                                                                  |
| Root RPG               | `root-rpg.spec.ts`                                                                                                                                                                                                           |
| Dragonbane             | `dragonbane.spec.ts`                                                                                                                                                                                                         |
| Scum and Villainy      | `scum-and-villainy.spec.ts`                                                                                                                                                                                                  |
| Ars Magica Definitive  | `ars-magica.spec.ts`                                                                                                                                                                                                         |
| KULT: Divinity Lost    | `kult-divinity-lost.spec.ts`                                                                                                                                                                                                 |

Cross-cutting behavior (library, game-chooser, section navigation, appearance,
module library/builder/runtime, local persistence, 320px overflow) is covered
once by shared specs rather than duplicated per game.

## Manual/browser checks

Inspect the primary editor at approximately 320, 390, 768, 1119, 1120, and
1440 CSS pixels. Verify keyboard focus, Escape and Tab behavior, direct hashes,
Back and Forward, effective 200% zoom behavior, reduced motion, browser console
output, refresh persistence, heading scroll offset, and the absence of
page-level horizontal scrolling.
