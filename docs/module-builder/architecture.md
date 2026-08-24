# Arcane Module Builder architecture

## Status and scope

This is the Phase 0 architecture decision record for a future visual module
builder. It specifies boundaries and migration gates; it does not make the
current hard-coded sheets declarative and does not claim that builder or
publishing features exist.

The current application remains the production implementation until each game
passes fixture-based behavioral parity in the staged migration described in
`migration-plan.md`.

## Audit baseline

Arcane Record already has several useful core boundaries:

- `GameSystemRegistry` registers Mage 20, Exalted First Edition, and Burning
  Wheel by stable system ID.
- `GameSystemDefinition<T>` supplies a schema, migrations, creation adapter,
  summaries, editor, sections, variants, and optional legacy file adapter.
- `StoredCharacterRepository` keeps the UI independent from Dexie. Database
  version 10 stores game-neutral envelopes in the existing `characters` table.
- Zod validates character records at persistence and import boundaries.
- Shared application chrome provides library and creation routes, appearance,
  the desktop rail, the mobile Sections sheet, collapsible sections, and
  pencil-gated group reordering.
- Character resolution already preserves an unavailable or invalid system as
  recoverable raw data instead of deleting it.

The principal limitation is that `GameSystemDefinition` points to executable
React editors and TypeScript rule code. Section component maps, calculations,
catalog semantics, validation, actions, and migrations remain game-owned code.
Exalted and Burning Wheel each have large editor components, and the three
games use different local editing/store patterns. The current registry is an
in-memory code registry, not an installable package resolver.

## Target layers

### 1. Core application

The core owns routing, library screens, `CharacterRepository`, IndexedDB,
appearance preferences, accessibility, responsive navigation, import staging,
module installation, migration orchestration, renderer and builder registries,
safe formula/action execution, and error recovery. UI components receive
repositories or stores through typed boundaries and never access Dexie
directly.

### 2. Module runtime

The runtime validates immutable module packages, resolves dependencies and
inheritance, indexes definitions, compiles declarative schemas into safe
runtime plans, and exposes a resolved sheet to the renderer. “Compile” here
means validating and normalizing data into internal objects; it never means
JavaScript code generation, `eval`, `Function`, dynamic imports, or executable
plugins.

Suggested package boundary:

```text
src/modules/
├── schema/             # Zod envelopes and definition schemas
├── registry/           # installed/bundled package and dependency resolution
├── repository/         # interfaces plus Dexie implementation
├── resolution/         # game hierarchy, overlays, references, formulas
├── renderer/           # safe component registry and sheet renderer
├── rules/              # expression, validation, and action engines
├── creation/           # creation-flow state machine
├── interchange/        # staged JSON/YAML parsing and migrations
└── diagnostics/        # stable error codes and human-readable locations
```

### 3. Declarative game modules

A module is validated data described by `module-schema.md`. It contains a root
game, optional descendants, sheets, catalogs, formulas, rules, actions,
creation flows, themes, citations, and migrations. It cannot contain arbitrary
JavaScript, CSS, HTML, network URLs, DOM commands, or filesystem paths.

Bundled modules use exactly the same envelope as imported modules. A
`distribution` flag records whether a package is bundled, published, local,
overlay, fork, or draft; it does not grant capabilities.

### 4. Character-owned data

Characters store scalar values and record instances, not catalog bodies or
derived values. Each module-rendered character identifies the exact module,
game node, sheet template, and template version that interpret its data.
Character-level names, notes, choices, states, links, and explicit overrides
remain stable across catalog updates.

During migration, the existing `systemId`/`systemVersion` envelope remains
valid. An optional `moduleRef` is additive, so older character files and
hard-coded editors continue to work.

### 5. Homebrew overlays and forks

An overlay is an immutable package that depends on a base module and contains
only permitted additions and explicit overrides. It never mutates the base.
Resolution is deterministic:

1. character-level explicit override;
2. enabled overlays in the character's stored priority order, last enabled
   overlay winning only where the base marks a definition overrideable;
3. the resolved base module and its parent inheritance chain.

Conflicting overlay changes must be surfaced before activation. A full fork has
a new module ID, records `forkedFrom`, starts as a portable snapshot, and no
longer receives implicit base updates.

### 6. Optional publishing registry

Phase 8 provides a separately built service that stores only immutable module
packages, publisher authorization references, review/deprecation metadata,
checksums, catalog pointers, revocations, and audit events. It never receives
characters, appearance preferences, drafts, telemetry, or local
module-library inventories. The amended `AGENTS.md` authorizes this narrow
boundary while keeping deployment and public publication separate approvals.
See `phase-8-hosted-registry.md` and `publishing-security.md`.

## Resolution model

### Stable identifiers

Module IDs use a publisher-controlled reverse-domain namespace, for example
`net.travelingwizard.arcane-record.mage20`. Definition IDs are stable,
module-local slugs and are addressed externally as
`<moduleId>#<definitionType>/<definitionId>`. IDs are never derived at runtime
from labels, routes, filenames, or array positions.

UUIDs identify character-owned instances and drafts. Semantic module versions
identify immutable package releases. Integer `formatVersion` values identify
the Arcane module and character envelope schemas. These version domains must
not be conflated.

### Dependencies

The resolver first selects an exact installed version satisfying every declared
range, then topologically sorts dependencies. Missing, incompatible, and
circular dependencies prevent activation but do not delete the package or
characters. A lock record stores the exact resolved versions for a character.
Phase 1 should support exact versions and conservative compatible ranges; a
package manager solver is unnecessary until evidence requires one.

### Game hierarchy and inheritance

Every package has exactly one root game node. Other nodes reference a parent by
stable ID. A sheet can target any node. Resolution walks parent-first and then
applies child additions and explicitly declared overrides. Duplicate IDs,
unknown parents, multiple roots, and cycles are activation errors.

Definitions are inherited by namespace and kind. A child cannot silently
replace a parent definition: it must use an `override` record naming the target,
and the target must allow that operation. Removal is represented as an explicit
availability restriction or tombstone so existing character references remain
resolvable.

## Runtime lifecycle

1. Parse a candidate package in memory with file-size and structural limits.
2. Validate the envelope and every namespaced ID.
3. Resolve dependencies and hierarchy without modifying IndexedDB.
4. Validate component data paths, formula types/dependencies, action targets,
   creation-flow reachability, and migration continuity.
5. Produce diagnostics and a permission/content summary.
6. After explicit approval, write the immutable package and installation record
   in one Dexie transaction.
7. Resolve an activated package into a cached, read-only runtime plan.
8. Render characters through the plan; save only after the character schema and
   action transaction validate.

Activation and installation are distinct. An incompatible package may remain
installed for recovery/export but cannot create or edit characters.

## Persistence design

The next Dexie version should add tables without replacing `characters`:

| Table                 | Key                        | Purpose                                                |
| --------------------- | -------------------------- | ------------------------------------------------------ |
| `modulePackages`      | `[moduleId+moduleVersion]` | Immutable validated envelopes and checksum             |
| `moduleInstallations` | `moduleId`                 | Active version, origin, trust label, enabled overlays  |
| `moduleDrafts`        | `id`                       | Autosaved builder project and undo checkpoint metadata |
| `moduleLocks`         | `id`                       | Exact dependency resolution for characters/drafts      |

Repository interfaces mediate all access. Module drafts are local-only and are
not characters. Clearing site data may remove both, consistent with the
local-first product promise.

Do not place resolved catalogs or formula caches in character records. Derived
indexes may use ephemeral memory or a rebuildable cache table only after a
measured need.

## Rendering and state

The generic renderer consumes a resolved template outline, the character data,
validation diagnostics, and a command dispatcher. It reuses the current
`CharacterSectionProvider`, desktop/mobile navigation, `SheetSection`, semantic
theme tokens, and save-status behavior. The template describes groups,
sections, components, and modes; it does not replace core chrome.

Editors dispatch typed commands. Commands create a proposed next character,
run actions atomically, validate it, and then update the active editor store.
Autosave remains separate and writes through `CharacterRepository`. View-only
preferences such as appearance and expansion remain outside character data.

Advanced interfaces are trusted core renderer types with constrained
configuration. Mage's Quintessence/Paradox wheel, Exalted Combo analysis and
combat profile, and Burning Wheel wound/PTGS and lifepath interfaces are not
module scripts.

## Coexistence strategy

The code registry and module registry run side by side through a common
`CharacterInterpreter` abstraction:

- legacy records without `moduleRef` resolve through `GameSystemRegistry`;
- module records resolve through `ModuleRegistry`;
- the character page handles available, unavailable, invalid, and incompatible
  states for both;
- new declarative templates remain behind a development activation flag until
  parity is proven;
- converting a character initially creates a validated copy and preserves the
  original; in-place migration is deferred until repeatable rollback exists.

No phase may remove a hard-coded editor merely because its module renders. It
must first pass schema, import/export, accessibility, responsive, and golden
behavioral parity gates.

## Architectural invariants

- Character data and local modules remain in browser IndexedDB.
- The phrase “Saved in this browser” remains the successful persistence label.
- Normal character exports never embed full catalogs.
- Unknown module and definition references are preserved and repairable.
- Module content cannot execute code, make requests, style arbitrary selectors,
  or access the DOM.
- Warnings and permitted soft overrides never silently remove selections.
- All module, character, and migration boundaries are Zod-validated.
- Core controls retain keyboard support, focus visibility, reduced motion,
  practical touch targets, and 320 CSS-pixel overflow coverage.

## Decisions required before Phase 1

1. Approve reverse-domain module IDs and semantic module versions.
2. Approve the additive `moduleRef` on stored characters and a version-2
   character file envelope while retaining version-1 import.
3. Decide whether Phase 1 supports asset metadata only or safe raster assets.
   External runtime assets and SVG/HTML are out of scope under current rules.
4. Approve exact-version dependency locking and the proposed overlay conflict
   order.
5. Decide whether converted characters are copied by default (recommended) or
   migrated in place.

## Principal risks

- Behavioral parity is broader than visual parity; existing game-specific
  warnings and preservation behavior are easy to lose in a generic schema.
- Exalted currently rejects some unknown catalog IDs, while the target runtime
  must preserve them. Migration must not reuse those strict validators blindly.
- Burning Wheel's GPL-3.0-derived catalogs and logic require an explicit license
  review before redistribution as a module.
- Large catalogs and formula graphs could harm mobile performance without lazy
  indexes and budgets.
- An underspecified action DSL could turn advanced game behavior into hidden
  core code. Capability gaps should produce new constrained core primitives,
  not executable module escape hatches.
- Publishing cannot begin under the current no-backend/no-accounts product
  boundary.
