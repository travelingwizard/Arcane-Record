# Existing-game capability matrix

## Purpose and audit method

This matrix maps implemented Arcane Record behavior to proposed safe builder
components. It is based on the registered definitions, Zod schemas, migrations,
editors, bundled catalogs, persistence/import code, and unit/integration/E2E
tests for Mage 20, Exalted First Edition, and Burning Wheel Gold + Codex.

“Generic now” means reusable code already exists. “Generic target” identifies
the declarative component or engine capability required for conversion.
“Advanced core” means a constrained renderer owned by Arcane Record, never
executable module code.

## Shared application capabilities

| Existing capability     | Current implementation                                           | Generic target                                         | Gap or migration note                                                                                                   |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Game registration       | `GameSystemRegistry` and executable `GameSystemDefinition`       | Module/package registry and interpreter registry       | Add immutable installed versions, dependencies, hierarchy, and declarative sheets; keep code registry during migration. |
| Character envelope      | ID, system ID/version, name, timestamps, opaque data             | Envelope plus `moduleRef` and dependency lock          | Additive migration; retain version-1 character imports.                                                                 |
| Local persistence       | Dexie `characters`, repository boundary                          | Character and module repositories                      | Add module/install/draft/lock tables; components must not access Dexie.                                                 |
| Unknown system recovery | Raw record remains exportable                                    | Unknown module/version/sheet/definition recovery       | Preserve unresolved instance data and add repair diagnostics.                                                           |
| JSON/YAML files         | Validated character envelope; direct import                      | Staged character/module import                         | Add limits, preview, dependency/conflict checks, and approval transaction.                                              |
| Library                 | Search, filter, create, duplicate, rename, export, delete        | Core character and module libraries                    | Module Library is new; character library stays unchanged.                                                               |
| Game selection          | Hard-coded game then variant/stock                               | Root game, game node, sheet template, creation profile | Direct sheet creation remains possible without a flow.                                                                  |
| Navigation              | Shared desktop rail/mobile sheet; stable IDs                     | Template navigation groups/sections                    | Preserve pencil-gated ordering and responsive/focus behavior.                                                           |
| Modes                   | Mage and Burning Wheel Build/Play; Exalted one order             | `SheetModeDefinition` and mode editability             | Mode state remains character-owned where it affects play workflow.                                                      |
| Disclosure              | Shared `SheetSection`; local preferences                         | Accordion/disclosure component and core chrome         | Keep expansion preference out of character exports unless a module explicitly models state.                             |
| Appearance              | Semantic token themes, overlays, per-character/local settings    | Safe theme token maps and core Settings extensions     | Module themes cannot alter geometry or inject CSS/assets.                                                               |
| Autosave                | Editor-specific active state through repository                  | Generic command store plus repository autosave         | Normalize save status and exact success phrase.                                                                         |
| Accessibility           | Labels, focus restoration, keyboard dots/navigation, modal sheet | Registry-level required accessibility metadata         | Builder preview and generated sheets require automated and manual gates.                                                |

## Field, layout, and record types

| Capability                | Existing examples                                               | Generic target                                | Notes                                                                                           |
| ------------------------- | --------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Text and multiline fields | Identity, Beliefs, Instincts, notes                             | Text, multiline, static/help text             | Enforce length limits and real labels.                                                          |
| Integer ratings           | Attributes, Abilities, Spheres, Essence                         | Number and dot/pip rating                     | Store integers, not Boolean dot arrays.                                                         |
| Checkbox/switch/select    | Equipped, profile, stock, settings                              | Checkbox, switch, radio, select, multi-select | Visibility/editability expressions replace editor branching.                                    |
| Grouped ratings           | Mage Attributes/Abilities; Exalted Attributes/Abilities/Virtues | Grouped matrix                                | Column/row layout is declarative and responsive.                                                |
| Permanent/temporary       | Willpower and Essence pools                                     | Permanent/temporary rating                    | Mage may render temporary Willpower as boxes or dots through settings.                          |
| Counters/tracks           | XP, Artha, motes, Limit, resource tax                           | Counter and resource track                    | Totals may be stored or derived according to existing rules.                                    |
| Cycling damage            | Mage health marks                                               | Stateful/cycling damage track                 | Ordered allowed states; Play-editable.                                                          |
| Overlapping tracks        | Mage 20-box Quintessence/Paradox wheel                          | Advanced opposed-track wheel                  | Independent 0–20 values, separate starting cells, Paradox visual precedence, no data overwrite. |
| Repeatable records        | Backgrounds, gear, languages, relationships                     | Structured repeatable record                  | UUID, owned fields, links, add/remove/undo policies.                                            |
| Catalog selection         | Merits/Flaws, Charms, Rotes, lifepaths                          | Searchable catalog + selected-instance list   | Lazy indexes and virtual/paginated results for large catalogs.                                  |
| Linked records            | Derangement Flaw, Combos, manses/hearthstones                   | Linked-record component                       | Removing one side unlinks unless a rule explicitly deletes.                                     |
| Ledger/history            | Exalted XP/downtime; BW advancement tests                       | Ledger/history                                | Signed amount and derived totals are schema/config driven.                                      |
| Equipment                 | Mage equipment; Exalted weapons/armor/ammo; BW possessions      | Equipment, weapon/attack, armor records       | Definitions separate from owned adjustments/state.                                              |
| Citation                  | Catalog source title/page and review markers                    | Source citation                               | Definitions reference a source registry; selected cards keep source visible.                    |

## Mage 20

| Area                 | Existing behavior and data                                        | Generic/advanced component             | Rules/actions to preserve                                                                                      |
| -------------------- | ----------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Identity             | Nine editable strings                                             | Text field group                       | Rename/display summary remains adapter behavior until generic.                                                 |
| Attributes           | Physical/Social/Mental, ratings 1–5                               | Grouped dot matrix                     | Locked in Play.                                                                                                |
| Abilities            | Talents/Skills/Knowledges, ratings 0–5, includes Do               | Grouped dot matrix                     | Locked in Play; Do drives technique allowance.                                                                 |
| Spheres              | Nine ratings, configurable alphabetical/column ordering           | Dot list plus advanced sphere wheel    | Mobile always vertical; desktop list/wheel share paths; locked in Play.                                        |
| Affinity             | Zero or one Sphere                                                | Single-selection adornment             | Does not require a separate box; one active star.                                                              |
| Arete/Willpower      | Permanent ratings, temporary Willpower                            | Permanent/temporary rating             | Permanent locked in Play; temporary remains editable.                                                          |
| Quintessence/Paradox | Independent values 0–20 on a 20-cell circle                       | Advanced opposed-track wheel           | +/− actions; Q rises one direction and P the other; P wins only presentation where occupied.                   |
| Health               | Ordered damage marks                                              | Cycling damage track                   | Play-editable; state order and labels preserved.                                                               |
| Backgrounds          | Catalog-backed UUID selections, label, rating, notes, pooled flag | Catalog picker + record list           | Rating/repeat/pooling validation; seven-point warning; unknown definitions excluded from totals but preserved. |
| Merits/Flaws         | Fixed/variable cost, notes, compact selected cards                | Catalog picker + selected list         | Legal cost, repeat policy, separate totals, seven-Flaw benefit warning, remove and one-step undo.              |
| Focus                | Paradigm, Practice, Instruments, custom choices                   | Multi-catalog linked selections        | Requirements/advice remain warnings where currently advisory.                                                  |
| Wonders              | Catalog or custom owned records                                   | Catalog picker + equipment-like record | Preserve owned state and unresolved IDs.                                                                       |
| Rotes                | Catalog/custom records with structured Sphere requirements        | Catalog picker + requirement display   | Preserve legacy requirement text and unresolved IDs.                                                           |
| Equipment            | Catalog/custom, quantity, equipped, owned description/notes       | Equipment record                       | Catalog stats/citations stay reference-only; Play state remains editable.                                      |
| Maneuvers            | Combat reference favorites/custom and learned Special Do          | Catalogs + selected list               | Special Do allowance `max(0, Do−1)` capped at 4; over-limit records remain with warning.                       |
| Experience           | Stored total and current nonnegative integers                     | Experience totals fields               | No inferred historical spend.                                                                                  |
| Layout               | Per-mode group order and mode                                     | Core template navigation               | Current Build/Play default orders and page synchronization.                                                    |

Mage catalogs include Backgrounds, Merits/Flaws, Paradigms, Practices,
Instruments, Wonders, Rotes, Equipment, Combat maneuvers, and nine official
Special Do Techniques. Definitions and citations are excluded from character
exports.

## Exalted First Edition shared capabilities

| Area                            | Existing behavior and data                                            | Generic/advanced component                          | Rules/actions to preserve                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Game hierarchy                  | One registered game with Solar and Dragon-Blooded variants            | Root game + child game nodes + sheets               | Shared systems must be inherited, not copied.                                                                             |
| Identity/Attributes/Abilities   | Structured text and ratings, favored Abilities                        | Text, grouped matrix, tag/single controls           | Variant eligibility and favored/aspect discounts.                                                                         |
| Languages                       | UUID, catalog/custom name, proficiency, spoken/written, notes, source | Structured records + catalog                        | Native/known/temporary distinction; temporary effects do not mutate permanent languages; Linguistics integration.         |
| Backgrounds                     | Sheet-appropriate structured selections                               | Catalog picker + rating records                     | Link support and variant availability.                                                                                    |
| Virtues/Willpower/Essence       | Permanent/temp ratings and mote pools                                 | Matrices, permanent/temp, resource tracks           | Full-width Willpower layout is presentation; pools remain Play-editable.                                                  |
| Derangements                    | Duration/status/source/trigger/recovery and optional Flaw link        | Linked records                                      | Great Curse remains separate; removing linked Flaw unlinks, does not delete Derangement.                                  |
| Merits/Flaws                    | Dragon-Blooded catalog, fixed/variable costs, choice, notes           | Catalog picker + compact selected list              | Categories, exclusions, repeat policies, DB costs, approval warnings, default collapsed browse behavior.                  |
| Charms/Sorcery                  | Large DB catalogs, requirements, source/page                          | Searchable catalog + selected list                  | Known IDs, eligibility/prerequisite diagnostics, explicit Learn/Add Without XP.                                           |
| Combos                          | Character links to known Charms, costs, eligibility                   | Advanced Combo analyzer                             | Classic/Power and DB rules, cross-Ability and surcharge diagnostics.                                                      |
| Equipment/combat                | Weapons, armor, shields, ammo, material, quality, profile             | Weapon/armor/equipment plus advanced combat profile | Derived attack/damage/soak/protection with explanation and citations.                                                     |
| Possessions/Manses/Hearthstones | Owned records and links                                               | Structured and linked records                       | Keep definition and instance data separate.                                                                               |
| Experience                      | Signed ledger plus separate downtime events                           | Ledger + advancement action                         | Current/lifetime totals derived; DB overrides for Essence, Charms, spells, Immaculate Charms; insufficient-XP validation. |
| History & Description           | Shared editable character record                                      | Full-width text components                          | Preserves description, history, and the existing optional free-form notes.                                                |

Current Exalted schema migrations cover powers, Merits/Flaws, combat equipment,
Combos, languages, Derangements, experience, downtime, possessions, Manses, and
Hearthstones. Some current Exalted validators reject unknown definition IDs;
the module migration must instead preserve them as unresolved selections.

## Burning Wheel Gold + Codex

| Area               | Existing behavior and data                                                                               | Generic/advanced component                   | Rules/actions to preserve                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Stock hierarchy    | Man, Dwarf, Elf, Orc, Roden, Great Wolf, Troll                                                           | Root plus seven game nodes/sheets            | Wizard content merges into Man; Dark Elf Path of Spite into Elf.                           |
| Catalog scale      | 613 lifepaths, 493 skills, 863 traits plus resources                                                     | Indexed searchable catalog                   | Stable unique IDs, provenance, lazy filtering, performance budget.                         |
| Lifepaths          | Requirements, leads, time, age, repetition, diminishing returns                                          | Advanced lifepath burner + creation flow     | Starting path restrictions, variable time/resources, setting transitions, Orc Brutal Life. |
| Stat allocation    | Mental/physical/either pools, bonus and B/G/W shades                                                     | Advanced shaded rating allocator             | Shade point costs, pool warnings, no silent correction.                                    |
| Derived attributes | Health, Steel, Reflexes, Mortal Wound, Hesitation, Stride, Circles, Resources, emotional attribute, PTGS | Formula displays plus advanced PTGS renderer | Preserve stock and Trait/path branches and modifier breakdown.                             |
| Skills             | Required/available grants, roots, LP/general points, tests                                               | Catalog records + advanced skill allocator   | Opening costs, magical/training skill cost, custom Wises, Appropriate Weapons.             |
| Traits             | Required/common/lifepath/special costs                                                                   | Catalog picker + budget                      | Required grants, common/free and LP costs, warnings.                                       |
| Connections        | Relationships, affiliations, reputations                                                                 | Structured records                           | Importance and relationship flags calculate resource costs.                                |
| Gear/property      | Catalog/custom possession, cost, damaged state                                                           | Equipment/property records                   | Included in resource-point accounting.                                                     |
| Beliefs/Instincts  | Three multiline values each                                                                              | Repeated multiline fields                    | Play-editable.                                                                             |
| Wounds/PTGS        | Severity/obstacle/treatment plus derived tolerances                                                      | Advanced wound tolerance + records           | Play-editable wounds, original printable rendering.                                        |
| Artha/resources    | Fate/Persona/Deeds and resource tax                                                                      | Counters                                     | Play-editable.                                                                             |
| Advancement        | Per-stat/skill test counters and test history; total/current XP fields                                   | Advancement matrix + history                 | Do not confuse BW tests with Exalted XP ledger.                                            |
| Enforcement        | Default-on lifepath and point-limit settings                                                             | Validation rules with override settings      | Warnings and explicit overrides; Build selections locked in Play.                          |
| Files              | JSON/YAML, legacy `.char`, local PDF                                                                     | Optional system adapters and PDF renderer    | `.char` is lossy and must warn; original PDF only.                                         |
| License            | Charred Black-derived GPL-3.0 module                                                                     | License/provenance manifest                  | Corresponding source and build instructions remain available; legal review gate.           |

## Calculations, rules, actions, and workflows

| Kind                    | Existing examples                                                     | Proposed runtime primitive                            |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Pure calculation        | Mage totals, Exalted ledger totals, BW burn totals/derived attributes | Typed formula AST and dependency graph                |
| Conditional calculation | Exalted favored discounts, BW emotional attributes                    | Conditional expression plus catalog lookup primitive  |
| Validation              | Costs, duplicates, prerequisites, pool limits                         | Severity-based declarative validation                 |
| Preservation warning    | Over-limit Do, BW point pools                                         | Soft limit with preserve-existing policy              |
| Atomic edit             | Spend XP and update Trait                                             | Action with prevalidated effects and ledger append    |
| Linked lifecycle        | Derangement Flaw unlink                                               | Record update/remove action with link policy          |
| Stateful click          | Mage health cycle                                                     | Constrained cycle effect                              |
| Guided creation         | Burning Wheel burner                                                  | Creation flow plus advanced allocation components     |
| Dice mechanics          | Burning Wheel Brutal Life answer/roll; future pools                   | Dice system/action; deterministic test injection      |
| Undo                    | Mage add/remove one-step, builder reorder requirement                 | Core transaction history with explicit bounded policy |

No current game provides a general-purpose dice roller or generic formula/action
runtime. These must not be described as existing functionality.

## Advanced core component inventory

Phase conversions require these core-owned, safe components:

1. `opposed-wheel-20` for Mage Quintessence/Paradox.
2. `sphere-rating-wheel` with a list fallback and affinity selection.
3. `exalted-combat-profile` for Classic/Power derived combat breakdowns.
4. `exalted-combo-analyzer` for linked Charm eligibility and cost diagnostics.
5. `lifepath-burner` for Burning Wheel path eligibility and allocations.
6. `shaded-rating-allocator` for B/G/W ratings and point pools.
7. `wound-tolerance-track` for Burning Wheel PTGS and wounds.
8. `advancement-test-matrix` for Burning Wheel skill/stat tests.

Each accepts only schema-validated references, formulas, labels, and options. If
another game needs one, the API must be generalized through a core review
rather than accepting callbacks from a module.

## Theme variations

All games currently share semantic themes, overlays, motion reduction, custom
background, per-character overrides, and Settings access. Mage adds local-only
Sphere ordering/wheel and temporary-Willpower display. Burning Wheel adds local
burner preferences. Game-specific preferences are not exported character data.
A module may propose safe semantic token defaults, but the user and character
appearance scopes continue to take precedence.

## Conversion acceptance baseline

For each system, parity fixtures must cover default data, every migrated schema
version, representative populated characters, unresolved definitions,
JSON/YAML round trips, Play protections, catalogs, calculations, warnings,
section order, autosave, mobile navigation, keyboard operation, and 320-pixel
overflow. Burning Wheel additionally requires `.char`, PDF, catalog-performance,
and GPL distribution checks.

## Audit uncertainties

- Solar functionality remains intentionally less complete than Dragon-Blooded;
  placeholders must stay placeholders during conversion.
- Existing game editors implement some undo behavior locally rather than as a
  uniform transaction log.
- Some requirements are embedded in catalog-specific TypeScript and need
  explicit extraction before a declarative parity claim.
- The future dice vocabulary needs rules from real implemented mechanics; it
  should not be overgeneralized from anticipated games.
