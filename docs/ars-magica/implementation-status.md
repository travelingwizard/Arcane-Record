# Ars Magica implementation status

Branch: `codex/ars-magica`. Isolated worktree: `.worktrees/ars-magica`.
The concurrent Exalted working tree is not part of this change.

## 1. Source certification and catalogs — in progress

The Definitive Edition core has a usable text layer. The Reference Guide has
unresolved page placeholders and is only a checklist. Printed page references
in the core are eight pages behind PDF page numbers. The spell index on printed
pp. 553–556 contains 330 spell references.

The replacement file supplied on September 13 has SHA-256
`c767644ce9747117b6290deeffa352f97ff46430a38c6f2c7845c92971a5fb54`,
which exactly matches the original core file. It therefore resolves no new page
dependencies. Catalog citations now permit an explicitly absent printed/PDF page
pair. Missing locators no longer block unrelated work, but they also do not
promote an unresolved mechanic to verified status.

The core is the sole rules authority. OCR/text extraction never constitutes
mechanical verification. The generated spell index is deliberately
`reference-only`; it cannot calculate creation. Chapter inventories retain an
explicit unresolved disposition until every player-facing row is reviewed. No
production registration occurs while a certification dimension is incomplete.

Changed: `catalog.ts`, `generated-spells.json`, `source-inventory.ts`, the spell
index generator, source audit, license notice, and `package.json`.

Tests: the audit passes for 330 unique, cited spell references. Catalog tests
cover Houses, Arts, citations, and reference-only status.

Remaining risk: Virtues/Flaws, full Ability metadata, spell mechanics/guidelines,
equipment, Boons/Hooks, laboratories, and seasonal sources lack complete
row-level reviewed inventories. Next: visually review and disposition all rows.

## 2. Production character model and creator — in progress

Core p. 49 requires Parma Magica, Magic Theory, and Latin at least 1; the higher
values on p. 50 are recommendations. Creation experience remains separate from
later earned experience. Additive Zod defaults preserve unresolved/custom data.
Manual sheets have no invented baseline. Finalization calls character validation
and a certification flag, currently false.

Changed: `schema.ts`, `create-character.ts`, `creation-rules.ts`, `validation.ts`,
`CreatorPanel.tsx`, and `rebuild.ts`.

Editable, identity-free mechanical starter templates now cover Magus, Companion,
and Grog. They create ordinary resumable drafts and do not claim to be published
sample characters.

Tests: typecheck passes. Unit tests cover nonlinear Characteristics, age caps,
life-stage budgets, all House entries, Hermetic minimums, specific approvals,
strict versions, and three-way rebuild conflicts.

Remaining risk: several creator stages are summaries rather than full catalog
selectors and allocation ledgers. House effects, templates, complete Virtue/Flaw
rules, spell allocation, and older-magus year workflows remain incomplete. Next:
complete those components and fixtures for twelve Houses and all three roles.

## 3. Manual character sheets and references — completed

The shared Mage-style LocalSheet supplies navigation, themes, Settings, semantic
fields/cards, mode ordering, and the exact save confirmation. Magus-only sections
are hidden for Companions/Grogs. Permanent fields are read-only in Play. Dice
records include purpose and provenance; narrative outcomes remain manual.

Changed: `ArsMagicaEditor.tsx`, `TraitsPanel.tsx`, `DicePanel.tsx`, `dice.ts`,
`magic.ts`, `experience.ts`, and `ReferencePanels.tsx`.

The manual-sheet milestone now takes priority over guided creation. The four
embedded core character-sheet pages were inventoried directly. Additive fields
now cover current year and setting; complete biographical details; personality
traits and reputations; armor and combat modifiers; structured weapons and
equipment; Hermetic House/Covenant relationships; raw vis; longevity ritual;
familiar and cord records; and full spell Technique, Form, level, bonus,
Range/Duration/Target, mastery experience/options, requisites, and notes.
Schema-one records missing these additions migrate to neutral empty values rather
than inferred character history.

Tests: deterministic coverage exists for simple/stress dice, explosions, botches,
Art/Ability scales, formulaic/spontaneous/ritual arithmetic, requisites,
penetration, and vis limits. Editor autosave and semantic controls pass.

Completed: the Magus sheet exposes calculated base casting, ritual,
spontaneous, laboratory, fast-casting, effect-identification, targeting,
concentration, and magic-resistance references. Fatigue states, wound counts and
penalties, Twilight episodes, longevity records, complete familiar statistics,
structured combat/equipment, raw vis, and the four-page core sheet hierarchy are
represented. Companion and Grog records omit Hermetic-only sections.

Tests: schema-one migration uses neutral defaults, editor autosave/reload passes,
all shared unit/integration tests pass, and Ars-specific Playwright tests verify
entry routing and no horizontal overflow at 320px.

Deferred to the guided-creation/play-tool milestone: automated Confidence
payment, combat/damage resolution, recovery, aging, and Twilight consequences.
The manual sheet records all corresponding state without automating narrative
outcomes.

## 4. Covenant, laboratory, and seasons — in progress

Cross-record laboratory work requires all-or-nothing updates. Sequential saves
could consume vis without granting the result. `saveAtomicallyIfUnchanged`
compares complete envelopes, validates outputs, and commits one Dexie transaction;
there is no sequential fallback.

Changed: repository interface/implementation, `create-covenant.ts`,
`CovenantEditor.tsx`, `laboratory.ts`, `advancement.ts`, `seasons.ts`, and tests.

Tests: atomic success, stale revisions, duplicates, invalid output, and identity
changes are covered. Pure tests cover lab totals, lowest requisites, progress,
vis extraction, longevity, build-point costs, and Source Quality → Advancement
Total → awarded XP ordering.

Remaining risk: Covenant packages are not a complete creator. Link/relink review,
deletion warnings, project confirmation/idempotency, book history, teaching
limits, aging integration, and seasonal activity UIs remain incomplete. Next:
build that lifecycle around the atomic repository API.

## 5. Manual-sheet certification and integration — completed

The production registry exposes manual Magus, Companion, Grog, and Covenant
records. Guided creation is not exposed and still receives `certified={false}`
internally, preventing uncertified drafts from finalizing.

Release checks: ESLint passes with existing Fast Refresh warnings only; typecheck
passes; 550 unit/integration tests pass across 111 files; all 75 pre-existing
Playwright tests pass; both Ars-specific Playwright tests pass; the production
build passes; the source citation audit passes; and `git diff --check` passes.

Remaining work belongs to the later creator/Covenant-automation milestone:
complete selectable catalogs, guided creator validation, atomic laboratory
confirmation, and reviewed Covenant relinking. These features are not presented
as part of the completed manual-sheet release.

GitHub publication and VPS deployment are authorized by the active user goal and
may proceed from the reviewed manual-sheet commit.
