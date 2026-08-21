# 16. Multi-game architecture

## Shared boundary

Arcane Record owns the library, routes, local persistence, import/export
envelope, settings, and error recovery. It does not know a game's fields.
`GameSystemRegistry` is the shared lookup boundary. A registered
`GameSystemDefinition<TCharacter>` supplies identity, schema version, Zod
schema, initial data, migration, summary/search adapters, rename/duplicate
adapters, its editor component, section and section-group metadata, and
optional appearance metadata. Editors consume the shared left-rail/mobile
navigation and pencil-order controls with those game-owned definitions.

Definitions may also provide an optional system-specific legacy file adapter.
The shared import boundary invokes that adapter without inspecting or branching
on the game's payload. Burning Wheel uses this hook for Charred Black `.char`
files; JSON and YAML continue to use the common Arcane Record envelope.

Mage 20 registers as `mage20`. The older `mage-m20` identifier remains only in
the legacy Mage editor model and legacy-file detector.

## Routes

- `/` — neutral character library with search, game filter, import, and cards;
- `/create` — game selection;
- `/create/:systemId` — local creation for single-sheet games, or direct sheet
  choice and creation for games with variants;
- `/characters/:id` — shared resolver and module-owned editor;
- `/settings` — global preferences and character-sheet appearance defaults.

The app uses the browser History API. Production hosting must retain its SPA
fallback to `index.html`.

## Persistence migration

The existing `arcane-ledger` IndexedDB database and `characters` table stay in
place. Database version 10 converts recognizable legacy Mage rows into the
generic `StoredCharacter` envelope while preserving IDs and timestamps.
Recognized rows first pass through the complete existing Mage migration chain.
Already wrapped rows are unchanged. Rows that cannot be validated are wrapped
without deleting their raw content; the character page offers raw JSON export
instead of trying to open them.

## Preference scopes

- global: neutral shell appearance and motion;
- default sheet: cross-game theme, overlay, motion, and custom background;
- character view: optional appearance override keyed by character UUID;
- character data: Build/Play layout and section expansion/order;
- transient: active navigation and save state.

Only character-owned game data is included in character files. UI preferences
remain browser-local.

## Registered systems

- `mage20` — Mage 20 editor;
- `exalted1e` — Exalted First Edition with `solar` and `dragon-blooded`
  variants;
- `burning-wheel` — Burning Wheel Gold + Codex with seven stock choices and a
  game-owned guided burner, play sheet, legacy adapter, and PDF generator.
