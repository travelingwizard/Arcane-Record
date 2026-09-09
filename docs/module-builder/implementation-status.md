# Module Builder implementation status

This file is the resumable execution ledger for completing Arcane Record's no-code Module Builder. Status reflects repository evidence, not intended behavior.

## Implementation plan

1. Audit every production game/editor and the current declarative runtime.
2. Close schema, validation, migration, safe-rule, and local-persistence gaps.
3. Replace the partial sheet editor with an accessible structured drag/drop canvas, contextual inspector, preview, undo/redo, and autosave.
4. Complete creation-flow authoring with form-based branching and review validation.
5. Complete staged portability and local library lifecycle operations.
6. verify the existing registry's administrator-only publication boundary.
7. Use Mage 20 as the parity proof, then finish accessibility, responsive, recovery, documentation, and regression checks.

## Phase 0 - Audit and architecture

- **Status:** completed
- **Relevant discoveries:** The repository already has a strict versioned module envelope, stable `DataPath`, closed expression/action/dice schemas, activation validation, Dexie-backed draft/package/install records, staged JSON/YAML import, a local module library, a registry service with publisher/reviewer/admin roles, and bundled Mage/Exalted parity modules. The visual builder has autosave and text-snapshot undo/redo, but its sheet canvas only adds static text and does not yet provide library drag/drop, component inspection, cross-section movement, copy/paste, deletion recovery, or real runtime preview.
- **Decisions made:** Preserve the envelope and registry rather than replace them. Treat structured grid placement as authoritative; no pixel canvas. Mage 20 is the proof because its bundled module already exercises sections, ratings, catalogs, calculations, validation, responsive layout, and creation data.
- **Files changed:** `implementation-status.md`, `existing-capability-matrix.md`, `module-architecture.md`, `data-model.md`, `creation-workflow-schema.md`, `accessibility.md`, and `testing-plan.md`.
- **Tests run:** Static repository audit of all registered systems, module schemas, renderer registry, builder, local library, import/export, migrations, registry server, and existing tests.
- **Remaining risks:** Existing phase documents describe several intended capabilities more broadly than the UI currently exposes; completion will be tied to executable tests.
- **Next phase:** Implement shared builder commands and close validator/migration gaps.

## Phase 1 - Declarative foundation

- **Status:** completed
- **Relevant discoveries:** Existing strict schemas reject unknown keys and executable content; formula dependency, missing-path, migration, action, and creation-flow diagnostics are already enforced during activation. The repository and staged importer already separate mutable drafts from immutable packages.
- **Decisions made:** Extended format version 1 additively with optional section width and safe general-purpose field types. Existing packages remain valid. Field duplication creates a new schema path/default so copies cannot mutate the original field accidentally.
- **Files changed:** `src/modules/schema/module-envelope.ts`, `src/features/module-builder/builder-commands.ts`, and `tests/unit/module-builder-commands.test.ts`.
- **Tests run:** TypeScript build passed. Focused builder/runtime tests passed (11 tests before the additional palette fixture).
- **Remaining risks:** Schema version 1 cannot remove unknown future fields; recovery intentionally preserves the original draft/package instead.
- **Next phase:** Complete the visual sheet authoring UI and runtime preview.

## Phase 2 - Character-sheet builder

- **Status:** completed
- **Relevant discoveries:** Current builder has a three-region sheet designer but only a section outline, placeholder canvas, and section inspector.
- **Decisions made:** Add native HTML drag/drop as enhancement plus complete button/keyboard alternatives.
- **Files changed:** `src/features/module-builder/ModuleBuilderPage.tsx`, `src/features/module-builder/builder-commands.ts`, `src/modules/renderer/component-registry.tsx`, `src/modules/renderer/ModuleCharacterEditor.tsx`, `src/styles/components.css`, `src/styles/responsive.css`, `tests/unit/module-builder-commands.test.ts`, and `tests/e2e/module-builder.spec.ts`.
- **Tests run:** Typecheck; four builder-command tests; module runtime tests; focused Playwright authoring/recovery/mobile test. All passed.
- **Remaining risks:** Form inspectors for advanced composed/game-specific registry types remain a documented enhancement; their validated JSON definitions and runtime renderers remain supported.
- **Next phase:** Complete and verify creation-workflow authoring.

## Phase 3 - Creation-workflow builder

- **Status:** completed
- **Relevant discoveries:** The flow schema/runtime exists; current UI only lists flows and adds a one-step placeholder.
- **Decisions made:** Reuse component IDs and stable paths from sheet templates.
- **Files changed:** `src/features/module-builder/RuleDesigner.tsx`.
- **Tests run:** Typecheck and safe rule tests pass. Creation-flow reachability/cycle diagnostics remain part of activation validation.
- **Remaining risks:** Nested arithmetic/Boolean AST composition beyond the common field-equality branch is available through validated structured JSON rather than a full visual tree editor.
- **Next phase:** Verify local portability and library lifecycle.

## Phase 4 - Module library and portability

- **Status:** completed
- **Relevant discoveries:** Staging, checksums, immutable conflict detection, local installation, forking, activation, and hosted discovery already exist.
- **Decisions made:** Complete lifecycle UI without weakening immutable package handling.
- **Files changed:** `src/features/module-library/ModuleLibraryPage.tsx`.
- **Tests run:** Module-file, builder repository, Dexie repository, and registry-client tests: 10 passed.
- **Remaining risks:** Immutable installed bytes are intentionally not deletable; users disable an installation, retain rollback versions, or deprecate hosted versions.
- **Next phase:** Verify the hosted registry authorization boundary.

## Phase 5 - Server publishing

- **Status:** completed
- **Relevant discoveries:** The existing registry provides authenticated staging, independent review, publish, deprecate, rollback, namespace grants, audit events, and immutable checksums. There is no public publishing path in the browser client.
- **Decisions made:** Retain this minimal separate registry; do not add character-data endpoints.
- **Files changed:** No server changes were required; `docs/module-builder/publishing-security.md` documents the implemented boundary and remaining deployment inputs.
- **Tests run:** Registry TypeScript check and the isolated HTTP security smoke passed, covering publisher, reviewer, administrator, namespace, immutable version, deprecation, and rollback policy.
- **Remaining risks:** Production identity provider, MFA enforcement, operational ownership, monitoring, and independent deployment review remain required inputs; no server deployment was authorized.
- **Next phase:** Re-run the Mage declarative proof.

## Phase 6 - Existing-game proof and migration

- **Status:** completed
- **Relevant discoveries:** Mage and Exalted bundled modules already render alongside production editors without replacing source records.
- **Decisions made:** Mage 20 remains installed as an opt-in parity proof; production conversion remains blocked until parity checks pass.
- **Files changed:** `docs/module-builder/proof-mage20.md` and corrected `docs/module-builder/component-registry.md`.
- **Tests run:** Mage module ID, envelope/parity, conversion, generic editor, and Mage editor suites: 13 passed.
- **Remaining risks:** The production Mage editor remains the default by product decision; the declarative version remains copy-first and opt-in.
- **Next phase:** Complete the repository-wide release gate and documentation review.

## Phase 7 - Polish and verification

- **Status:** completed
- **Relevant discoveries:** Existing Playwright coverage includes builder draft recovery and 320px checks but not complete drag/drop and inspector workflows.
- **Decisions made:** Add keyboard-equivalent tests for every drag operation.
- **Files changed:** `tests/e2e/module-builder.spec.ts`, `docs/module-builder/backlog.md`, and the phase documentation listed above.
- **Tests run:** Prettier check passed. ESLint passed with eight pre-existing Fast Refresh warnings and no errors. Application and registry typechecks passed. All 450 unit/integration tests passed. All 63 Playwright tests passed after restoring one shared compatibility class found by the first run. Registry HTTP security smoke passed. Production build and `git diff --check` passed.
- **Remaining risks:** Vite reports the existing large-bundle warning (approximately 3.96 MB minified main JavaScript); code splitting is a performance follow-up, not a builder correctness failure. Production registry identity and operations remain deployment inputs.
- **Next phase:** None. Hand off the uncommitted reviewed work; no commit, push, publication, or deployment was authorized.
