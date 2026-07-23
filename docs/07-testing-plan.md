# 07. Testing plan

## Unit

- Zod accepts a valid blank character and rejects malformed IDs, timestamps, ratings, and affinity values.
- Version 1 records migrate to version 2 with default Abilities and Enlightenment values.
- Sphere sorting covers all modes, affinity tie-breaking, and preservation of the underlying ratings.
- DotRating covers pointer toggling, lower selection, keyboard commands, limits, labels, disabled, and read-only behavior.
- The desktop wheel toggle covers shared ratings, shared affinity, and local view preference.
- JSON and YAML round trips preserve character data while imports receive fresh IDs and timestamps.

## Integration

An in-memory repository test double exercises create, reopen, rename, duplicate with a fresh UUID, and delete. UI integration tests cover affinity selection, replacement, and clearing; Ability and Enlightenment editing; sequential Health damage; and IndexedDB schema migration.

## End to end

Playwright creates a character, sets Name, Strength, Alertness, Forces, affinity, Arete, and Health damage, reloads the app, and verifies persistence. It also verifies JSON download and local file import. The test runs against a local Vite server only.

## Manual/browser checks

Inspect the primary editor at approximately 320, 768, and 1440 CSS pixels, verify keyboard focus, inspect the browser console, and confirm refresh persistence.
