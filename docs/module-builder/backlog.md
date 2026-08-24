# Prioritized module-builder backlog

## Backlog rules

This backlog is the output of Phase 0. Items are ordered by dependency and risk,
not by visual appeal. No phase begins without explicit approval of that phase.
An item is complete only when its acceptance criteria and required tests pass;
a placeholder is labeled as such.

Phase 1 was implemented locally on 2026-08-24. Its synthetic-fixture runtime,
repository, interchange, coexistence, and recovery scope is recorded in
`phase-1-runtime.md`. Production game conversion remains unstarted.

Priority labels:

- **P0** blocks safe runtime work or data compatibility.
- **P1** is required for the named phase's useful milestone.
- **P2** is valuable after parity and safety foundations.
- **Deferred** requires a product/security/license decision.

## Decision gates before Phase 1

| Priority | Item                                         | Acceptance criteria                                                                                                                 |
| -------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Approve module and definition ID conventions | Reverse-domain module IDs, local stable slugs, immutability, and rename policy recorded.                                            |
| P0       | Approve character provenance                 | Additive `moduleRef`, exact dependency lock, file-envelope v2, and v1 compatibility accepted.                                       |
| P0       | Select module version/range subset           | SemVer parsing, prerelease behavior, exact lock, and incompatibility diagnostics specified.                                         |
| P0       | Decide Phase 1 asset policy                  | Recommended metadata-only policy accepted or alternate threat review completed.                                                     |
| P0       | Approve overlay conflict order               | Character override and ordered overlay/base precedence plus conflict UX accepted.                                                   |
| P0       | Approve copy-first game conversion           | Existing character retained; converted copy gets new UUID and provenance.                                                           |
| P0       | Resolve current instruction mismatch         | Confirm builder creation-flow work is an approved future expansion beyond the current “editable sheet, not rules engine” milestone. |

## Phase 1 — runtime foundation

### Schema and diagnostics

| Priority | Item                                               | Dependencies         | Acceptance criteria                                                                                                                         |
| -------- | -------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Implement module envelope Zod schemas              | ID/version decisions | Valid complete fixture passes; unknown/executable fields, bad IDs, invalid defaults and unsupported versions fail with pointer diagnostics. |
| P0       | Add structural budgets and safe JSON normalization | Envelope             | Prototype keys, non-finite values, excessive depth/count/string length fail before activation.                                              |
| P0       | Build reference/type validation                    | Envelope             | Every game/sheet/component/catalog/source/formula/action ref is kind-checked; no ambiguous references.                                      |
| P0       | Create stable diagnostic model                     | Envelope             | Code, severity, pointer, related IDs, message/remediation render consistently in import and builder.                                        |

### Resolution

| Priority | Item                          | Dependencies         | Acceptance criteria                                                                                                           |
| -------- | ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| P0       | Module registry interface     | Envelope             | Bundled and repository packages resolve by exact ID/version with duplicate conflict detection.                                |
| P0       | Dependency resolver and lock  | Registry             | Missing/incompatible/circular dependencies are preserved but cannot activate; deterministic topological order and exact lock. |
| P0       | Game hierarchy resolver       | Registry             | One root, parent inheritance, child additions/explicit overrides, multiple sheets, and circular-parent rejection tested.      |
| P0       | Unknown-module recovery       | Interpreter boundary | Missing module/version/sheet displays recoverable state and raw export without mutating character.                            |
| P1       | In-memory resolved-plan cache | Resolver             | Cache keyed by checksums/lock, invalidated safely, and measured; no character catalog duplication.                            |

### Persistence and interchange

| Priority | Item                                | Dependencies                | Acceptance criteria                                                                                            |
| -------- | ----------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| P0       | Add module repository interfaces    | Envelope                    | UI/runtime has no Dexie imports; immutable packages/installations/drafts/locks have typed APIs.                |
| P0       | Add Dexie tables in next DB version | Repositories                | Existing version-10 characters unchanged; upgrade/rollback fixtures; transaction failure leaves prior state.   |
| P0       | Staged JSON/YAML module importer    | Schemas/resolver/repository | Parse/validate/preview/cancel/approve; no write before approval; deterministic exports.                        |
| P0       | Declarative module migration runner | Schema/path engine          | Adjacent chains, atomic clone/validate/commit, missing/circular chain rejection, unresolved ID remap fallback. |
| P1       | Character file v2 support           | Provenance decision         | Module refs round-trip; v1 remains supported; normal files exclude catalogs/preferences.                       |

### Components and coexistence

| Priority | Item                                  | Dependencies                 | Acceptance criteria                                                                                                 |
| -------- | ------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P0       | Component registry API                | Schema/type validation       | Unknown types rejected; each entry owns config schema, renderer, inspector metadata, accessibility contract.        |
| P0       | Minimal renderer                      | Registry + resolved template | Text, number, dot, groups, sections, readonly mode, validation summary render synthetic module.                     |
| P0       | `CharacterInterpreter` coexistence    | Module resolver/renderer     | Legacy and module records resolve without route branching on game fields; hard-coded sheets unchanged.              |
| P1       | Reuse current navigation/settings     | Minimal renderer             | Desktop rail/mobile sheet, pencil order, disclosure, themes, autosave and exact save phrase pass existing behavior. |
| P1       | Phase 1 accessibility/responsive gate | Renderer                     | Keyboard/focus/labels/reduced motion and 320-pixel Playwright checks pass.                                          |

## Phase 2 — Mage parity backlog

| Priority | Slice                               | Acceptance criteria                                                                                     |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| P0       | Freeze Mage module/catalog ID map   | Every existing catalog/selection ID maps deterministically; unresolved IDs have fallback.               |
| P0       | Identity and grouped dot components | Stored ratings, Build/Play locks, summaries and order match fixtures.                                   |
| P0       | Sphere list/wheel and affinity      | Mobile vertical, desktop preference, sorting and one-star selection share data.                         |
| P0       | Q/P, Health, Willpower              | Independent 0–20 wheel values/collision visuals, damage cycles, temp display setting, Play edits match. |
| P0       | Background/Merit/Flaw catalogs      | Costs, duplicates, pooling, warnings, compact cards, remove/undo and unresolved preservation match.     |
| P1       | Focus/Wonders/Rotes                 | Structured requirements, custom entries, citations and unknown refs round-trip.                         |
| P1       | Equipment/Maneuvers/Special Do      | Play state, favorites, linked Do allowance and preserve-over-limit warning match.                       |
| P1       | Mage migration converter            | v1–v10 plus legacy files convert copy-first with no loss and golden parity.                             |
| P1       | Make module Mage opt-in preview     | Clear badge/fallback; full integration/E2E/performance/accessibility parity.                            |
| P2       | Default new Mage to module renderer | Separate approval after preview evidence; retain legacy fallback for a release window.                  |

## Phase 3 — Exalted parity backlog

| Priority | Slice                                          | Acceptance criteria                                                                          |
| -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| P0       | Root/Solar/DB hierarchy fixture                | Shared definitions resolve once; variant availability/overrides tested.                      |
| P0       | Unresolved reference representation            | Existing/unknown power, Trait and equipment IDs preserve owned fields and remain repairable. |
| P0       | Shared fields/languages/backgrounds            | Linguistics and temporary sources match; no duplicated child definitions.                    |
| P0       | Virtues/Willpower/Essence/Limit/Derangements   | Great Curse separation, Flaw link/unlink, pools and Play behavior match.                     |
| P0       | DB Merits/Flaws and powers                     | Catalog counts/IDs, costs, repeats, warnings, source/page, prerequisites match.              |
| P1       | Combat/equipment and Combo advanced components | Classic/Power calculations, material/quality, links, costs and explanations match fixtures.  |
| P1       | Experience/downtime/possessions                | Ledger-derived totals, DB XP overrides, separate downtime and links round-trip.              |
| P1       | Exalted v1–v6 converter                        | Both variants migrate copy-first; Solar placeholders remain explicit.                        |
| P2       | Module renderer default                        | Separate approval after both variants pass parity and legacy fallback window.                |

## Phase 4 — Burning Wheel parity backlog

| Priority | Slice                                    | Acceptance criteria                                                                                     |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| P0       | GPL/license distribution review          | Provenance, license/corresponding source and broader obligations approved before public module release. |
| P0       | Large catalog module/indexes             | Exact 613/493/863 counts, unique IDs, merged stock content, search/filter performance budget.           |
| P0       | Seven-stock hierarchy                    | Man/Dwarf/Elf/Orc/Roden/Wolf/Troll sheets resolve shared and stock-specific definitions.                |
| P0       | Lifepath burner                          | Requirements/leads/time/age/repeats/diminishing returns/Brutal Life match engine fixtures.              |
| P0       | Stat/shade/skill/Trait allocation        | Pools, roots, opening costs, special weapons, required grants and overrides match.                      |
| P1       | Connections/resources/derived attributes | Relationships, affiliations, reputation, possessions, emotional attributes and calculations match.      |
| P1       | PTGS/wounds/Artha/advancement            | Advanced components and Play edits match; tests remain distinct from XP fields.                         |
| P1       | File/PDF adapters                        | JSON/YAML and `.char` round trips/loss warning; original local PDF remains safe.                        |
| P1       | v1/v2 converter and all-stock E2E        | Copy-first migration, complete representative burn, mobile/settings/files pass.                         |

## Phase 5 — visual builder

| Priority | Item                                    | Acceptance criteria                                                                               |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| P0       | Draft repository/autosave               | Invalid and valid drafts recover locally; no character table coupling; status clearly says draft. |
| P0       | Project dashboard and hierarchy editor  | Root/sub-games/sheets CRUD, duplicate/reorder/inheritance with diagnostics and keyboard controls. |
| P0       | Sheet designer outline/canvas/inspector | Registered types only; drag plus buttons/keyboard; real renderer preview; path/type validation.   |
| P0       | Undo/redo command history               | Atomic commands, inverse patches, redo invalidation, reload checkpoint tests.                     |
| P1       | Catalog designer                        | Schema/entries/bulk paste/search/citations/costs/requirements/diff with large-data handling.      |
| P1       | Desktop/mobile and Build/Play preview   | Real breakpoints/modes, no false simulation, accessible focused-screen mobile editor.             |
| P1       | Testing/import/export dashboard         | Fixture results, installable-snapshot validation, draft versus package distinction.               |
| P2       | Theme designer                          | Safe semantic tokens only; no CSS/layout/assets escape hatch.                                     |

## Phase 6 — rules/actions/flows

| Priority | Item                                    | Acceptance criteria                                                                               |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| P0       | Expression parser/validator/evaluator   | AST types, path typing, arithmetic/logic/condition/functions, budgets, no eval/code.              |
| P0       | Dependency graph and last-valid results | Cycle rejection, incremental invalidation, stale diagnostic without character corruption.         |
| P0       | Severity validation and overrides       | Information/warning/soft/hard behavior, recorded reasons, preserve existing over-limit data.      |
| P0       | Atomic action engine                    | All required effects, clone/validate/commit, rollback, execution limits and loop prevention.      |
| P1       | Rule/action visual editor/sandbox       | When/If/Then, paths, dependency/transaction preview, deterministic tests, no production mutation. |
| P1       | Creation flow runtime                   | Same character schema, branches/budgets/grants/receipts/resume/review/finalize/reopen.            |
| P1       | Creation flow designer                  | Accessible graph/list, reachability/cycle diagnostics, mobile focused screens.                    |
| P2       | Dice primitives                         | Only mechanics justified by converted games, deterministic/logging/privacy tests.                 |

## Phase 7 — homebrew and local Module Library

| Priority | Item                                        | Acceptance criteria                                                                                       |
| -------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P0       | Module Library states                       | Bundled/published/imported/overlay/fork/draft/legacy/missing/incompatible visibly distinct.               |
| P0       | Overlay resolver/conflict preview           | Base immutable, permitted overrides only, deterministic order, conflicts block activation until resolved. |
| P0       | Full fork snapshot                          | New ID, exact `forkedFrom`, portable snapshot, base updates never overwrite/merge.                        |
| P1       | Create Homebrew/Duplicate/Compare/Export    | Accessible workflows, semantic diffs, version comparison, deterministic files.                            |
| P1       | Character-level custom/override integration | Highest precedence, owned data remains across catalog updates, import/export covered.                     |
| P2       | Optional archive                            | Separate approved threat model and format; normal importer rejects it.                                    |

## Phase 8 — publishing (blocked/deferred)

| Priority | Item                              | Gate/acceptance criteria                                                                  |
| -------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| Deferred | Amend product boundary            | Explicit approval for separate backend/accounts and updated project instructions.         |
| Deferred | Threat model/service architecture | Auth, roles, hosting, DB/object store, retention/backups/incident response reviewed.      |
| Deferred | Public catalog/download           | Metadata and checksum only; offline cache; no character requests/telemetry.               |
| Deferred | Authorized staging/review/publish | Server-enforced namespace roles, exact-checksum review, immutable versions.               |
| Deferred | Deprecation/rollback              | No deletion/overwrite; pointer rollback and audited events.                               |
| Deferred | Security test suite               | Unauthorized access, CSRF/CORS, bombs/content, immutability, checksum, outage tests pass. |

## Cross-cutting test backlog

- Module envelope, stable IDs, hierarchy, sheets, inheritance/overrides,
  dependency and formula cycles.
- Formula types/evaluation/errors, action atomicity/loops/undo/ledger, validation
  severities and creation branches.
- Module-version migrations, unknown module/definition recovery, overlay
  precedence and fork isolation.
- IndexedDB module persistence, staging cancellation, JSON/YAML determinism and
  normal-export catalog exclusion.
- Keyboard reordering, labels/focus, reduced motion, Settings/themes, desktop
  and mobile layouts, and 320-pixel overflow.
- Large-catalog resolution/search/render budgets.
- Golden behavior for every current game before switching defaults.
- Publishing authorization/checksum tests only after Phase 8 is authorized.

## Known risks to track

| Risk                                      | Mitigation/owner decision                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Generic schema loses subtle game behavior | Vertical slices, extracted rule inventory, golden output/action/diagnostic tests.             |
| Stable ID changes break characters        | Freeze maps, tombstones/remaps, unresolved preservation, immutable releases.                  |
| Imported data becomes executable          | Closed schemas/registries, no code/HTML/CSS/network, structural budgets, server revalidation. |
| Large modules degrade mobile UX           | Indexed catalogs, pagination/virtualization, cached plans, measured budgets.                  |
| Formula/action loops corrupt state        | Static cycle checks, typed paths, cloned atomic transactions, dynamic budgets/rollback.       |
| Migration strands users                   | Side-by-side interpreters, copy-first conversion, raw export, retained legacy fallback.       |
| Exalted unknown IDs are rejected          | New unresolved instance shape and dedicated converter, not strict current refinement.         |
| Burning Wheel licensing is mishandled     | License review before public distribution; retain provenance/source/build instructions.       |
| Registry expands privacy/security scope   | Separate explicit approval/service; never store characters; security gates.                   |

## Recommended next phase

Review and approve the six Phase 1 decision gates first. Then implement only
Phase 1's synthetic-fixture runtime foundation. Do not start Mage conversion or
the visual builder in the same change set.
