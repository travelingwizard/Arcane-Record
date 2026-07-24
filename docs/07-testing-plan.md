# 07. Testing plan

## Unit

- Zod accepts a valid blank character and rejects malformed IDs, timestamps, ratings, and affinity values.
- Older records migrate through schema version 6 with default Abilities,
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
- The section registry covers stable unique IDs, order, groups, valid and
  invalid hashes, summary calculations, and warning text.
- Section preferences cover per-character keys, initial hash expansion,
  unknown-ID filtering, Expand All, Collapse All, and export exclusion.

## Integration

An in-memory repository test double exercises create, reopen, rename, duplicate with a fresh UUID, and delete. UI integration tests cover affinity selection, replacement, and clearing; Ability and Enlightenment editing; Background previews, ratings, names, costs, restrictions, repeatability, pooling, removal, and Undo; sequential Health damage; Merits and Flaws previews, selection, legal cost changes, totals, warnings, removal, and Undo; Focus catalog and custom selections; significant Instruments; Need; Wonder catalog and custom records; structured Rote requirements; Magick removal Undo; and IndexedDB schema migration.

Navigation integration covers desktop links and `aria-current`, keyboard focus
after navigation, valid and invalid initial hashes, history events, independent
mobile disclosures, focus recovery on collapse, modal Escape and focus
restoration, background-scroll prevention, bulk expansion controls, mounted
form-state preservation, and direct warning summaries.

## End to end

Playwright creates a character, sets Name, Strength, Alertness, Forces, affinity, Arete, and Health damage, reloads the app, and verifies persistence. A Background scenario searches, previews, expands, adds one- and two-point entries, rates them, verifies warning-only totals, edits character details, persists, removes, and restores a selection. A Merits and Flaws scenario searches, previews, expands, projects, adds, persists, changes cost, removes, and restores selections. File exchange verifies JSON download and local file import. The tests run against a local Vite server only.

A Magick scenario selects a catalog Paradigm, records a significant custom
Instrument, creates a Wonder and a Rote, persists them across refresh, verifies
their local JSON export, and checks 320px overflow.

Section-navigation scenarios cover the desktop rail at 1440px, the 1120px
breakpoint, IntersectionObserver active links, fragments, Back navigation,
mobile selection and independent expansion at 390px, preference restoration,
preserved edits, and 320px overflow.

## Manual/browser checks

Inspect the primary editor at approximately 320, 390, 768, 1119, 1120, and
1440 CSS pixels. Verify keyboard focus, Escape and Tab behavior, direct hashes,
Back and Forward, effective 200% zoom behavior, reduced motion, browser console
output, refresh persistence, heading scroll offset, and the absence of
page-level horizontal scrolling.
