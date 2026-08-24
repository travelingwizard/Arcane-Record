# Phase 1 implementation report

## Goals

Phase 1 establishes a declarative module runtime beside the existing code-owned
Mage, Exalted, and Burning Wheel sheets. It deliberately uses a synthetic test
module rather than partially converting a production game.

Implemented foundations:

- version-1 `arcane-record-module` envelope with stable module/definition IDs,
  semantic module versions, provenance, hierarchy, sheets, safe components,
  catalogs, source references, and declarative migrations;
- structured diagnostics, structural import budgets, prohibited executable-
  content checks, minimum-core compatibility, exact dependency resolution,
  circular dependency/inheritance rejection, additions/override resolution,
  and missing-definition results;
- core component registry and minimal renderer for headings, static text, text,
  integers, dot ratings, and validation summaries;
- repository-mediated IndexedDB storage for immutable module packages,
  installations, builder drafts, and exact dependency locks;
- staged JSON/YAML parsing, normalization, preview data, deterministic
  canonical checksum, cancellation-safe install boundary, and same-version
  checksum protection;
- additive module character provenance and format-version-2 character files;
- shared character-page resolution for legacy and module interpreters,
  recoverable missing modules, repository autosave, Settings, desktop/mobile
  section navigation, disclosure, and pencil-gated group ordering;
- copy-safe declarative character migrations using typed path operations.

## Files and schema changes

Runtime code is under `src/modules/`. Database version 11 adds
`modulePackages`, `moduleInstallations`, `moduleDrafts`, and `moduleLocks` while
retaining the existing `characters` table and all version-10 migration behavior.

`StoredCharacter` gains an optional `moduleRef` containing exact module, game
node, sheet, template version, dependency-lock ID, and enabled overlays. Legacy
characters have no `moduleRef` and continue through `GameSystemRegistry`.

Normal legacy character files remain format version 1. Module-backed files use
format version 2 and contain only module provenance plus character-owned data;
they do not contain catalogs, citations, component definitions, or preferences.
Both versions import through the common character boundary. A missing module is
preserved for later recovery rather than discarded.

## UI behavior

There is no production Module Builder or Module Library UI in Phase 1. The
minimal renderer is exercised by a synthetic fixture and can open a valid
module-backed character already present in IndexedDB. It reuses core appearance,
save status, desktop rail, mobile Sections sheet, disclosure, responsive sheet,
and keyboard-accessible ordering.

No current game creation card or editor changed to the module renderer. No
server, account, publishing, asset rendering, formula/action execution,
creation-flow engine, overlays, or forks were added.

## Migration behavior

Database upgrade creates new empty module tables without rewriting characters.
Declarative module migrations currently support:

- set a default only when a path is missing;
- rename/move a path while preserving its value.

Migration chains must be unambiguous, acyclic, and reach the package's current
module version. Operations run on a clone and the final sheet schema must
validate before a caller can commit it.

Existing Mage v1–v10, Exalted v1–v6, and Burning Wheel records stay on their
existing migration code. Production-game conversion is not part of Phase 1.

## Security boundary

Imported modules are data only. Phase 1 rejects fields representing scripts,
HTML, CSS, event handlers, endpoints, or network operations. Formula, action,
dice, validation-rule, creation-flow, theme, and asset arrays are represented in
the envelope but a non-empty value is activation-blocking until its approved
runtime phase. This avoids pretending deferred capabilities are safe or usable.

YAML aliases/shared object graphs, prototype keys, non-finite values, excessive
file size/depth/node/key counts, bad IDs, missing references, incompatible core
versions, and dependency cycles fail in staging. Installation writes package,
activation metadata, and dependency lock in one Dexie transaction.

Installed package checksums are revalidated when the application loads the
module registry. A mismatched package remains in IndexedDB for recovery but is
not activated. Exact dependency locks are checked against required versions and
installed dependency checksums before a module-backed character opens.

## Tests

Focused coverage includes:

- envelope validation, IDs, paths, defaults, hierarchy/inheritance/overrides;
- missing and circular dependencies, deferred/executable content, core version;
- component registry, missing definition recovery, and declarative migrations;
- deterministic JSON/YAML staging and unsafe-input diagnostics;
- package/install/lock/draft persistence and checksum conflict atomicity;
- character format-version-2 provenance and missing-module preservation;
- renderer editing, Play protection, autosave, exact save message, Settings,
  ordering, mobile navigation, and 320-pixel overflow.

## Remaining risks and next phase

- Phase 1 intentionally supports exact dependency versions, not general SemVer
  range solving.
- Imported asset rendering remains disabled.
- Module packages are installed through the programmatic staging boundary; the
  user-facing Module Library belongs to Phase 7.
- The minimal character schema vocabulary and component registry will expand in
  vertical slices only when production-game parity requires them.
- Module IDs and copy-first production conversion still require final approval
  before freezing Mage's real ID map.

The recommended next phase is Phase 2, beginning only with the Mage identity,
grouped Attributes/Abilities, layout modes, and navigation slice plus golden
fixtures. Do not convert the full Mage sheet in one change.
