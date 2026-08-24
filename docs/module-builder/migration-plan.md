# Controlled migration plan

## Principles

- Convert one capability/game at a time; never rewrite all editors together.
- Preserve existing records and exports before improving abstractions.
- Keep hard-coded and declarative interpreters side by side until parity gates
  pass.
- Convert definitions and character-owned instances separately.
- Treat unresolved IDs and over-limit records as data to preserve, not cleanup
  opportunities.
- Every schema change has an adjacent migration, fixtures, rollback/recovery,
  and import/export tests.

## Phase 0 — audit and specification

Deliver the ten documents in this folder and a prioritized backlog. No runtime,
builder, server, database, or character schema changes. Approval gate: resolve
the Phase 1 decisions in `architecture.md`, especially IDs, `moduleRef`, assets,
dependency locking, overlay order, and copy migration.

## Phase 1 — module runtime beside legacy systems

Goals:

- Zod-validated module envelope and normalized runtime types;
- bundled/local module and installation repositories in a new Dexie version;
- component type registry and a minimal standard renderer;
- game hierarchy, inheritance, dependencies, exact locks, and diagnostics;
- safe JSON/YAML staging and declarative migrations;
- unavailable/incompatible module recovery;
- feature-flagged `CharacterInterpreter` coexistence.

The minimal renderer should prove text, number, dot rating, groups/sections,
disclosure, visibility/editability, validation summary, and save through the
existing repository/navigation. Use a synthetic fixture module, not a partial
production game. Do not add the visual builder, formula/action execution beyond
what that fixture requires, or remove any current editor.

Database migration adds module tables only. Current `characters` rows remain
byte-equivalent. Character file version 1 remains default until a real module-
backed character exists.

Exit gate: envelope/graph/repository/import/recovery tests; generated fixture
meets keyboard/mobile/accessibility expectations; no change to Mage/Exalted/BW
golden fixtures.

## Phase 2 — Mage behavioral parity

Mage proves the broad standard component set and two advanced tracks. Work in
vertical slices:

1. identity, grouped Attributes/Abilities, layout modes and navigation;
2. Spheres, affinity, mobile list/desktop wheel;
3. Arete, permanent/temporary Willpower, 20-cell Q/P wheel, Health;
4. Background and Merit/Flaw catalogs/selections/totals/warnings;
5. Focus, Wonders, Rotes, Equipment, Maneuvers and Special Do;
6. Experience, save/import/export, settings integration.

Extract current catalogs into a module envelope without copying catalog bodies
into characters. Translate existing rules and warnings exactly; do not invent
limits. Keep every Mage migration v1–v10 and legacy file adapter as the source
conversion path.

Initially, “Convert to module preview” creates a new character with:

- a fresh UUID and provenance link to the source;
- exact module/game/sheet/template refs;
- every owned field/record UUID/unknown definition/override preserved;
- no derived/reference data copied;
- the source record untouched.

Run old and new data through golden selectors/calculations and rendered E2E
scenarios. Only after repeated parity may new Mage creation select the module
renderer by default. Retirement of the hard-coded editor is a separate change.

## Phase 3 — Exalted hierarchy and shared systems

Create one Exalted root node with shared definitions and Solar and Dragon-
Blooded child nodes/sheets. Do not duplicate languages, Backgrounds,
Derangements, combat equipment, possessions, or advancement systems.

Vertical slices:

1. identity, Attributes/Abilities, favored/aspect metadata, navigation;
2. languages, Backgrounds, Virtues, Willpower, Essence and Solar Limit;
3. Dragon-Blooded Merits/Flaws and Derangement linking;
4. Charms/Sorcery and shared/child availability;
5. Classic/Power combat, equipment, derived breakdowns and Combos;
6. possessions, Manses/Hearthstones, XP ledger/downtime and files.

The conversion schema must preserve unknown definitions even where current
Exalted Zod refinements reject them. Introduce an explicit unresolved reference
shape and prove selected records remain removable/repairable. Great Curse stays
separate from Derangements. Solar placeholders stay visibly incomplete.

Exit gate: shared definitions resolve once; child additions/overrides and DB XP
discounts match fixtures; all Exalted schema v1–v6 imports convert; both sheets
pass current integration/E2E plus hierarchy tests.

## Phase 4 — Burning Wheel and large catalogs

Create one root with seven stock nodes/sheets. Retain Charred Black provenance,
GPL-3.0 license text, corresponding source/build instructions, and an explicit
license review. Wizard additions resolve for Man and Path of Spite for Elf;
Troll, Roden, and Great Wolf remain stock-specific.

Convert catalogs first and benchmark indexes for 613 lifepaths, 493 skills, and
863 Traits. Then convert lifepath/lead/age/repeat/Brutal Life behavior, stat and
shade allocation, skill/Trait/resource pools, connections, derived attributes,
PTGS, wounds, Artha, gear, and advancement. Specialized core components remain
configured by module data.

Preserve JSON/YAML and `.char` behavior, loss warning, and original local PDF.
The `.char` adapter and PDF generator can remain trusted system adapters until a
safe generic adapter vocabulary exists; that exception must be visible in
module metadata and cannot grant imported modules executable behavior.

Exit gate: current engine/catalog/file tests and representative full-burn E2E
match; mobile catalog interactions meet measured budgets; all seven sheets pass;
license review approves distribution.

## Phase 5 — visual builder

Build local-only dashboard, hierarchy editor, sheet outline/canvas/inspector,
catalog designer, responsive/mode preview, validation panel, autosaved drafts,
and undo/redo. Drafts may be invalid; activation/export requires a validated
snapshot. Use core move commands and drag enhancement. Do not add formula/action
or creation-flow visual editors beyond read-only placeholders unless Phase 6 is
approved.

## Phase 6 — formulas, actions, and creation flows

Implement the typed expression engine, dependency graph/cycles, validation
severities/overrides, atomic action engine/loop budgets, dice primitives needed
by existing games, and creation-flow runtime/designers. Re-test converted games
against golden rules. Builder simulation never mutates production characters.

## Phase 7 — homebrew and local module management

Implement character custom content, overlays, forks, resolution precedence,
conflict preview, Module Library, staged imports, compare, duplication, and
exports. Published/bundled packages remain immutable; edits create overlays or
forks. Never auto-merge or overwrite local work.

## Phase 8 — optional registry

Blocked by current project instructions. Only after the explicit gates in
`publishing-security.md` may a separate service add public browse/download and
authorized staging/review/publish/deprecate/rollback. Characters remain local.

## Coexistence and routing

Routes continue to use stable interpreter/system IDs. They do not encode parent
hierarchy. Creation resolves game node and template after selection. During
migration, cards may show a clear “Legacy sheet” or “Module preview” badge, but
the same shared library, settings, appearance, and character page recovery are
used.

The resolver returns:

- available legacy interpreter;
- available module interpreter;
- missing module/dependency/template;
- installed but incompatible module;
- invalid character for an available interpreter.

Every failure state supports raw character export and names exact repair needs.

## Export compatibility

- Continue importing/exporting current format-version-1 files unchanged for
  legacy characters.
- Add format version 2 only for module provenance; import both indefinitely.
- A converted copy exports only character-owned values and exact module refs.
- Never silently convert a file merely because the matching module is present.
- Normal character files never bundle catalogs; future archives are distinct.
- Legacy `.char` and PDF remain explicit Burning Wheel adapters with warnings.

## Rollback

Installing a module or new version is reversible by changing activation metadata
without deleting immutable packages. Character migration initially copies and
therefore rolls back by reopening the legacy source. Later in-place migrations
must retain a validated pre-migration snapshot and offer one explicit rollback
until the upgraded character is knowingly edited/exported under new semantics.

Hard-coded editor code, migrations, and fixtures are not deleted in the same
release that changes the default renderer. Keep at least one release window and
an explicit fallback flag, subject to storage/security review.

## Cross-phase verification

Every implementation phase reports goals, files, schema, migration, UI, tests,
commands/results, risks, and recommended next phase. Required commands remain
format check, typecheck, lint, unit/integration tests, supported Playwright
smoke, production build, and `git diff --check`.

Golden fixtures compare character data, summaries, calculations, diagnostics,
allowed commands, export normalization, and selected rendered labels/states.
Visual snapshots alone are insufficient. Performance fixtures cover module
resolution and large-catalog search on representative mobile hardware budgets.

## Unresolved migration risks

- Exact module IDs and catalog ID maps must be frozen before real conversions.
- Existing editor-local undo and settings need explicit parity definitions.
- Burning Wheel schema version 2 needs an audited explicit v1 migration path in
  the module converter rather than relying on defaults.
- Exalted unknown-ID behavior differs from the target preservation invariant.
- Hard-coded PDF/legacy adapters need a long-term safe extension boundary.
- GPL obligations may affect how much of the runtime/distribution must be
  offered as corresponding source.
