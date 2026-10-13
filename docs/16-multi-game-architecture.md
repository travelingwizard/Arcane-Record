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

Phase 1 adds a declarative `ModuleRegistry` beside this code registry. A
character with `moduleRef` resolves its exact installed package, game node,
sheet template, and dependency lock through the module interpreter; a character
without it follows the existing `GameSystemRegistry` path. The shared character
page handles both and preserves unavailable module records. The production
Mage, Exalted, Burning Wheel, and Torchbearer definitions remain code-owned
until their individual parity phases pass.

Definitions may also provide an optional system-specific legacy file adapter.
The shared import boundary invokes that adapter without inspecting or branching
on the game's payload. Burning Wheel uses this hook for Charred Black `.char`
files; JSON and YAML continue to use the common Arcane Record envelope.

Code-owned definitions may provide `prepareExport` for repository-resolved
portable data and `getDeleteWarning` for cross-record deletion warnings. City of
Mist uses these hooks for reviewed crew snapshots and linked-character warnings;
the library does not inspect game-specific fields. Sheet-level exports use the
same game-owned service. Shared preview editors use the repository's atomic
`saveIfUnchanged` transaction to reject stale writers and deleted records.

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

Database version 11 adds module package, installation, draft, and dependency-
lock tables. It does not rewrite existing character rows. Module-backed
character files use envelope format version 2; legacy format version 1 remains
supported.

## Preference scopes

- global: neutral shell appearance and motion;
- default sheet: cross-game theme, overlay, motion, and custom background;
- character view: optional appearance override keyed by character UUID, and
  per-character section expansion (`arcane-ledger:section-preferences:<id>`,
  see [12. Section navigation](12-section-navigation.md));
- character data: Build/Play layout and the pencil-gated section-group order,
  since reordering also reorders the sheet and must round-trip through
  export/import;
- transient: active navigation and save state.

Section **expansion** (open/collapsed) is a view-only preference keyed by
character ID; it is never included in character files. Section-group
**order** is character-owned data and is included in character files so a
reordered sheet survives export/import. Do not conflate the two.

Only character-owned game data is included in character files. UI preferences
remain browser-local.

## Registered systems

City of Mist groups Character and Crew sheet choices under one game card.
The Character choice retains Rift/Gatekeeper variants; Crew opens directly.
The crew keeps its `city-of-mist-crew` backing system ID for existing records,
links, and interchange. Optional `parentSystemId` and `sheetChoiceLabel`
definition metadata control creation presentation only, not persistence.

- `mage20` — Mage 20 editor;
- `exalted1e` — Exalted First Edition with `solar`, `dragon-blooded`, `lunar`,
  `abyssal`, `sidereal`, `alchemical`, and `fair-folk` variants, all certified
  per [18. Exalted First Edition — planned splat release model](18-exalted1e-splat-release.md);
- `burning-wheel` — Burning Wheel Gold + Codex with seven stock choices and a
  game-owned guided burner, play sheet, legacy adapter, and PDF generator;
- `torchbearer2e` — Torchbearer Second Edition guided core character creator
  plus an editable two-page adventurer record with shared navigation,
  persistence, appearance, and interchange; see
  [18. Torchbearer 2e foundation](18-torchbearer-2e-foundation.md);
- `shadowrun1e` — Shadowrun First Edition priority-build foundation with shared
  navigation, Build/Play modes, source ownership controls, and local
  interchange; see [22. Shadowrun 1e foundation](22-shadowrun-1e-foundation.md);
- `earthdawn4e` — Earthdawn Fourth Edition guided build plus play sheet; see
  [19. Earthdawn 4e source verification](19-earthdawn4e-source-verification.md);
- `city-of-mist` / `city-of-mist-crew` — City of Mist Character (Rift or
  Gatekeeper) and Crew sheets grouped under one game card; see
  [21. City of Mist implementation](21-city-of-mist-implementation.md);
- `curseborne` — Curseborne editable sheet preview (guided creation is still
  in development; clearly labeled as a preview, not a finished record); see
  [20. Curseborne implementation](20-curseborne-implementation.md);
- `legend-in-the-mist` / fellowship — Legend in the Mist guided Hero build
  plus a Fellowship sheet;
- `changeling20` — Changeling: The Dreaming 20th Anniversary guided build plus
  sheet; see [23. Changeling 20 module](23-changeling-20-module.md);
- `vampire-dark-ages20` — Vampire: The Dark Ages 20th Anniversary guided build
  plus sheet; see [24. Vampire Dark Ages 20 module](24-vampire-dark-ages20-module.md);
- `vampire20` — Vampire: The Masquerade 20th Anniversary source-cited
  fledgling creator and maturation workflow, with Vampire, Ghoul, and
  Revenant sheet choices;
- `werewolf20` — Werewolf: The Apocalypse 20th Anniversary guided Garou,
  Changing Breed, Kinfolk, and Wyrm-aligned creation;
- `wraith20` / `wraith20-shadow` — Wraith: The Oblivion 20th Anniversary
  guided Wraith/Medium creation, plus a linked Shadow sheet
  (`parentSystemId`);
- `mouse-guard2e` / patrol — Mouse Guard Second Edition, recruited or built
  from a rank template, plus a Patrol record;
- `band-of-blades` / legion / chosen — Band of Blades guided Legionnaire build
  plus linked Legion and Chosen records;
- `blades-in-the-dark` / crew — Blades in the Dark guided Scoundrel build plus
  a linked Crew record;
- `miseries-and-misfortunes` / campaign — Miseries & Misfortunes guided
  Protagonist build plus a linked campaign record;
- `monster-of-the-week` / keeper — Monster of the Week guided Hunter build
  plus a Keeper workspace;
- `call-of-cthulhu2e` / keeper — Call of Cthulhu Second Edition guided
  Investigator build plus a Keeper workspace;
- `call-of-cthulhu7e` — Call of Cthulhu Seventh Edition guided Investigator
  build plus a Keeper workspace; grouped with `call-of-cthulhu2e` under the
  shared "Call of Cthulhu" family card;
- `root-rpg` / campaign — Root: The Roleplaying Game guided Vagabond build
  plus a linked campaign record;
- `dragonbane` — Dragonbane guided Adventurer build plus sheet;
- `scum-and-villainy` / ship — Scum and Villainy guided Scoundrel build plus a
  linked Ship record;
- `ars-magica-definitive` — Ars Magica Definitive Edition with Magus and
  Companion build choices;
- `kult-divinity-lost` — KULT: Divinity Lost editable sheet.

This list is derived from `src/games/registry.ts`; treat that file, not this
document, as the source of truth if they ever disagree. See the
[README](../README.md#supported-games) for the equivalent reader-facing
table.
