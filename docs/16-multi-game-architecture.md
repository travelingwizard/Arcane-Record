# 16. Multi-game architecture

## Shared boundary

Arcane Record owns the library, routes, local persistence, import/export
envelope, settings, and error recovery. It does not know a game's fields.
`GameSystemRegistry` is the shared lookup boundary. A registered
`GameSystemDefinition<TCharacter>` supplies identity, schema version, Zod
schema, initial data, migration, summary/search adapters, rename/duplicate
adapters, its editor component, section metadata, and optional appearance
metadata.

Mage 20 registers as `mage20`. The older `mage-m20` identifier remains only in
the legacy Mage editor model and legacy-file detector.

## Routes

- `/` — neutral character library with search, game filter, import, and cards;
- `/create` — game selection;
- `/create/:systemId` — confirmation and local creation;
- `/create/:systemId/:variantId` — variant confirmation for games with more
  than one sheet type;
- `/characters/:id` — shared resolver and module-owned editor;
- `/settings` — global preferences and game appearance preferences.

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
- game: Mage 20 theme and identity overlay;
- character: Build/Play layout and section expansion/order;
- transient: active navigation and save state.

Only character-owned game data is included in character files. UI preferences
remain browser-local.

## Registered systems

- `mage20` — Mage 20 editor;
- `exalted1e` — Exalted First Edition with `solar` and `dragon-blooded`
  variants.
