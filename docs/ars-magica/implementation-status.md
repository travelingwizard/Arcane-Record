# Ars Magica implementation status

Branch: `codex/ars-magica`. Isolated worktree: `.worktrees/ars-magica`.
Concurrent Exalted changes are not part of this branch.

## 1. Character-creation source certification — completed

The Definitive Edition core is authoritative. The replacement PDF has the same
SHA-256 as the original and therefore adds no different rules or locators. The
Reference Guide remains a checklist only. Printed pages are eight pages behind
PDF pages.

The checked-in creation inventories contain 12 Houses, 79 Abilities, 15 Arts,
330 spells, and 632 Virtue/Flaw options. Definitions use stable IDs, concise
adapted summaries, structured creation mechanics, and exact citations. The
Latin convenience definition is retained for record compatibility and represents
Dead Language with Latin as its specialty.

`character-creation-certification.json` records reviewed counts and the rules,
creator, migration, and browser fixtures. Runtime finalization recomputes catalog
counts and citation states; it does not trust a caller-supplied pass flag. The
source audit rejects missing mechanics, stale counts, invalid citations,
duplicate IDs, and missing evidence files.

Files: `catalog.ts`, `generated-spells.json`,
`generated-virtues-flaws.json`, `certification.ts`, `source-inventory.ts`, the
two generators, and `audit-ars-magica-sources.mjs`.

Remaining risk: Covenant, laboratory, and equipment catalogs retain their
separate partial/unresolved classifications. They do not drive character
creation or character finalization.

## 2. Production character model and creator — completed

The additive schema separates creator state, permanent definitions, mutable
play state, approvals, phase allocations, spell allocations, seasons, and
history. Schema-one records migrate to neutral schema-two creator fields without
inventing a creation history.

The ten-stage creator covers role and concept, identity and House,
Characteristics, Virtues/Flaws, childhood and later life, apprenticeship, Arts,
Abilities, spells, personal and Hermetic identity, older characters, and final
review. Magus, Companion, and Grog entry actions are role-specific. Mechanical
templates are editable drafts and contain no copied identities or histories.

Validation enforces exact nonlinear Characteristic spending, separate
native-language/childhood/later-life/apprenticeship ledgers, ledger-to-Trait
reconciliation, age caps, Ability categories and access, specialties, role
Virtue/Flaw limits, all twelve House benefits, the Gift, a Hermetic Flaw,
mandatory Hermetic Ability minimums, starting spell levels, learning limits,
requisites, older-magus annual budgets, laboratory seasons, and aging records.
Specific Storyguide approvals suppress only the exact objective issue they name.

Tests include valid finalizable Magus, Companion, and Grog fixtures and explicit
recognition of every House package. Rebuilding retains later seasons, wounds,
resources, spells, equipment, Covenant links, and history.

## 3. Character sheet and play records — completed

The shared Mage-style shell supplies navigation, Settings, themes, semantic
fields/cards, collapsible sections, per-mode ordering, and the exact save message
“Saved in this browser.” Magus-only sections are hidden for Companions and
Grogs. Permanent definitions lock in Play mode.

The sheet records full biography, Characteristics, Virtues/Flaws, Abilities,
Arts, spells/mastery/requisites, equipment, weapons, armor, fatigue, wounds,
Confidence, Warping, Twilight, aging, Decrepitude, personality, reputations,
raw vis, longevity, familiar, Covenant relationship, laboratory work, seasons,
and history. Manual records remain available without fabricated creation data.

## 4. Dice, magic, Covenant, laboratory, and seasons — partial

Pure and UI-backed records cover simple/stress dice, explosions, botches,
formulaic/spontaneous/ritual totals, requisites, penetration, vis limits,
laboratory totals, project progress, vis extraction, longevity, Covenant build
points, and Source Quality → Advancement Total → awarded XP ordering. Atomic
revision-checked multi-record persistence is implemented and has no sequential
fallback.

Still separate from the completed character creator: full Covenant package
creation, reviewed character/Covenant relinking, deletion warnings, atomic
project confirmation/idempotency UI, book-reading history, teaching limits, and
the full laboratory/season workflow. These capabilities must remain labeled
partial until their own certification passes.

## 5. Character-creator verification — completed

Typecheck passes. ESLint passes with the repository's ten pre-existing Fast
Refresh warnings and no errors. All 532 unit/integration tests pass across 109
files. The Ars Magica browser tests pass for creation routing, the certified
ten-stage creator, persistence, and 320px overflow. The full 78-test Playwright
suite produced one unrelated section-navigation timing failure under five-way
parallel execution; that exact test passed immediately in an isolated rerun, and
the other 77 tests passed. The production build, source audit, targeted formatting
check, and `git diff --check` pass.

The repository-wide Prettier check continues to report twelve pre-existing
review Markdown files. They are outside this isolated feature and were not
reformatted. Every changed Ars Magica source, test, script, JSON artifact, and
status document passes Prettier directly.

The remaining review is limited to the Ars Magica diff. No push or deployment
occurs without a separate authorized release action.
