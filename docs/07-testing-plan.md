# 07. Testing plan

## Unit

- Zod accepts a valid blank character and rejects malformed IDs, timestamps, ratings, and affinity values.
- Older records migrate through schema version 4 with default Abilities, Enlightenment, and empty Merit/Flaw selections.
- Sphere sorting covers all modes, affinity tie-breaking, and preservation of the underlying ratings.
- DotRating covers pointer toggling, lower selection, keyboard commands, limits, labels, disabled, and read-only behavior.
- The desktop wheel toggle covers shared ratings, shared affinity, and local view preference.
- JSON and YAML round trips preserve character data while imports receive fresh IDs and timestamps.
- The Merits and Flaws catalog covers schema validation, entry counts, fixed/discrete/range costs, citations, aliases, search, filtering, sorting, totals, projections, and missing-cost review flags.

## Integration

An in-memory repository test double exercises create, reopen, rename, duplicate with a fresh UUID, and delete. UI integration tests cover affinity selection, replacement, and clearing; Ability and Enlightenment editing; sequential Health damage; Merits and Flaws previews, selection, legal cost changes, totals, warnings, removal, and Undo; and IndexedDB schema migration.

## End to end

Playwright creates a character, sets Name, Strength, Alertness, Forces, affinity, Arete, and Health damage, reloads the app, and verifies persistence. A Merits and Flaws scenario searches, previews, expands, projects, adds, persists, changes cost, removes, and restores selections. File exchange verifies JSON download and local file import. The tests run against a local Vite server only.

## Manual/browser checks

Inspect the primary editor at approximately 320, 768, and 1440 CSS pixels, verify keyboard focus, inspect the browser console, and confirm refresh persistence.
