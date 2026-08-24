# Safe component registry

## Boundary

The component registry is a core-owned allowlist of renderer and inspector
definitions. Modules choose a registered type and supply validated data. They
cannot provide React components, callbacks, markup, stylesheets, event code, or
URLs.

Each registry entry defines:

- a stable type ID and configuration Zod schema;
- supported character-schema value types and writable operations;
- a renderer and a builder inspector owned by core;
- accessible-name requirements, focus behavior, and keyboard interaction;
- supported layouts and responsive fallback;
- allowed Build/Play behavior;
- formula, action, validation, and citation attachment points;
- migration/default semantics and test fixtures.

Unknown types make a template incompatible. The recovery view preserves and
exports the module/character rather than guessing a substitute.

## Common component definition

Every concrete definition extends this conceptual shape:

```ts
interface ComponentBase {
  id: string;
  type: ComponentTypeId;
  label: string;
  helpText?: string;
  accessibilityLabel: string;
  dataPath?: DataPath;
  defaultValue?: JsonValue;
  layout: LayoutDefinition;
  visibleWhen?: Expression;
  editableWhen?: Expression;
  validationRuleIds: string[];
  display: DisplayFormat;
  sourceRefIds: string[];
  modes: Record<string, 'edit' | 'view' | 'hidden'>;
  buildBehavior?: ModeBehavior;
  playBehavior?: ModeBehavior;
  actionBindings?: ActionBinding[];
}
```

Labels cannot be replaced by placeholders. Help and citation controls are
reachable by keyboard. Conditions may hide presentation but never delete data.
Readonly components remain semantically readable and do not expose misleading
interactive roles.

## Layout model

Layout uses semantic constraints, not CSS strings:

- width: `full`, `half`, `third`, `content`, or grid span;
- minimum safe width selected from core tokens;
- vertical/horizontal stack with a declared mobile stack fallback;
- alignment and density from a small enum;
- group/section membership by stable ID;
- order as an integer plus keyboard-accessible move commands.

Core may collapse columns based on its existing breakpoints. Modules cannot set
pixel positioning, overflow, z-index, fixed positioning, or responsive
breakpoints. Every generated sheet must pass the 320 CSS-pixel no-horizontal-
scroll check.

## Standard registry

| Type ID                      | Value/configuration                            | Required behavior                                                             |
| ---------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `heading`                    | level, label, optional ornament/citation       | Preserves document heading order; no fake headings.                           |
| `static-text`                | safe plain text/limited structured paragraphs  | No HTML; URLs render only through a core-safe link policy.                    |
| `help-text`                  | concise guidance and optional disclosure       | Programmatically associated with the target.                                  |
| `source-citation`            | source registry IDs and page labels            | Visible source/page, optional details disclosure.                             |
| `text`                       | string, length, autocomplete category          | Single-line input with real label.                                            |
| `multiline-text`             | string, length, row hint                       | Textarea grows safely and remains usable on mobile.                           |
| `number`                     | integer/finite number, min/max/step            | Locale-readable display; no browser spinner dependency.                       |
| `checkbox`                   | Boolean                                        | Native semantics and explicit checked label.                                  |
| `switch`                     | Boolean                                        | Checkbox-backed switch with state text; settings only when appropriate.       |
| `radio-group`                | scalar enum and option labels/help             | Arrow-key/native operation; selected state not color-only.                    |
| `select`                     | scalar enum/reference                          | Native or core combobox based on size.                                        |
| `multi-select`               | array of unique values                         | Removable tokens and searchable list; count validation.                       |
| `dot-rating`                 | integer bounds, optional zero, readonly mode   | Existing keyboard/pointer semantics; integers persisted.                      |
| `permanent-temporary-rating` | two integer paths and ordering constraints     | Separate accessible labels; boxes/dots are display options.                   |
| `resource-counter`           | integer/number plus min/max                    | Explicit increment/decrement and direct entry policy.                         |
| `resource-track`             | rating plus bounded cells/states               | Core-defined states, labels, and readonly mode.                               |
| `opposed-tracks`             | two bounded paths and collision display policy | Values stay independent; renderer never mutates due to overlap.               |
| `cycling-damage-track`       | ordered cells and state enum                   | Click/keyboard cycles through declared states; text alternative.              |
| `tags`                       | string/reference array                         | Add/remove and normalization policies.                                        |
| `repeatable-list`            | primitive item schema                          | Stable ordering and UUID if items become addressable.                         |
| `structured-records`         | record schema and card layout                  | Explicit add/edit/remove; stable UUID; preserve owned fields.                 |
| `table`                      | typed columns, rows path, mobile card mapping  | Semantic table on wide screens and labeled cards on narrow screens.           |
| `searchable-catalog`         | catalog ref, indexes, result card fields       | Search/filter/pagination; no automatic character mutation.                    |
| `catalog-picker`             | catalog ref, selection schema/policy           | Explicit Add, variable choices before Add, selected instances separate.       |
| `derived-value`              | formula ref and format                         | Readonly result, explanation and last-valid/error state.                      |
| `grouped-matrix`             | row/column definitions and child components    | Responsive labels remain unambiguous.                                         |
| `conditional-container`      | visibility expression and children             | Hiding preserves child data and validation policy is explicit.                |
| `tabs`                       | labeled panels                                 | Arrow keys, correct roles, content available without hover.                   |
| `disclosure`                 | summary and children                           | `aria-expanded`, focus-safe collapse, mounted-content option.                 |
| `equipment-record`           | definition/custom instance schema              | Quantity/equipped/state/notes stay character-owned.                           |
| `weapon-attack-record`       | weapon instance and derived formula refs       | Shows base, adjustments, and derived breakdown.                               |
| `armor-record`               | armor instance and protection formulas         | Equipped/attuned/damaged state and citations.                                 |
| `linked-records`             | source/target record refs and unlink policy    | Validates links; delete behavior is never implicit.                           |
| `ledger-history`             | dated typed entry schema and total formulas    | Append-only by default, explicit corrections, derived summaries.              |
| `dice-pool-action`           | dice system/action refs                        | Announces result, accepts deterministic test source, logs only if configured. |
| `action-button`              | action ref, label, confirmation                | Uses the atomic action dispatcher; disabled reason is visible.                |
| `validation-summary`         | scope/severity filters                         | Links diagnostics to controls and includes overrides.                         |
| `creation-flow-control`      | flow/step commands                             | Resume/review/finalize without a second character model.                      |

## Catalog and selected-instance pattern

The shared catalog pattern has three distinct surfaces:

1. a Browse action and filters over immutable definitions;
2. definition cards with name, cost/rating, summary, source/page, requirements,
   availability, and expandable mechanics;
3. compact selected-instance cards with owned choices/state/notes and explicit
   edit/remove actions.

Default collapse rules are presentation settings. They may show selected
records while hiding Browse results, as current Exalted Merits/Flaws and
Charms/Sorcery do. A missing definition displays its saved ID and owned values
with repair/remove actions rather than disappearing.

## Advanced core registry

### `opposed-wheel-20`

Configuration names two 0–20 integer paths, 20 cell labels, independent start
cells/directions, glyphs, collision presentation priority, and increment/
decrement action IDs. It covers Mage Quintessence dots and Paradox X marks.
Collision priority affects presentation only; both values can reach 20.

### `sphere-rating-wheel`

Configuration supplies a finite catalog of labeled ratings, ordering formula,
single affinity path, maximum rating, and desktop-wheel preference key. Core
always renders a vertical mobile list and shares the same integer paths.

### `exalted-combat-profile`

Configuration references equipment categories, profile constants, rating
paths, and derived formula IDs. It renders Classic/Power breakdowns and source
citations. It cannot run Charm logic supplied as code.

### `exalted-combo-analyzer`

Configuration identifies owned power records, eligibility rules, costs, dynamic
cost choices, and linked-record output. Core presents unmet prerequisites and
cost explanations and dispatches a validated add/update action.

### `lifepath-burner`

Configuration references lifepath catalogs, setting/lead fields, requirement
expressions, time/resource/skill/trait grants, repeat policies, special answer
schemas, and the active creation profile. Core handles the ordered path state
machine and exposes derived totals through formulas.

### `shaded-rating-allocator`

Configuration defines shade enum/order, shift costs, source pools, rating roots,
and allocation paths. It displays remaining pools and preserves over-budget
values with configured severity.

### `wound-tolerance-track`

Configuration references PTGS formula outputs, wound instance paths, severity
labels, treatment states, and obstacle fields. Derived tolerances remain
readonly; wounds remain character-owned Play state.

### `advancement-test-matrix`

Configuration identifies rating/test paths, difficulty categories, advancement
rules, and history action. It supports Burning Wheel advancement without
pretending it is an XP ledger.

## Builder inspector contract

Each registry type publishes an inspector schema used to generate the right
pane. Inspector changes are commands with inverse operations for undo/redo.
Invalid drafts may be autosaved as drafts, but only the last validated snapshot
can be previewed, exported as installable, activated, or published.

The inspector shows:

- stable ID and type (type immutable after data exists unless converted);
- label/help/accessibility fields;
- compatible data paths and defaults;
- layout and responsive preview;
- visibility/editability expression builder;
- validation, action, format, mode, and citation references;
- diagnostics and affected dependencies.

Drag-and-drop is an enhancement. Every move, nest, unnest, and reorder command
has buttons and keyboard operation and is represented in undo history.

## Mode and permission behavior

Components declare `edit`, `view`, or `hidden` for each template mode. Runtime
conditions may further restrict editing but cannot grant editing when the mode
forbids it. Build/Play behavior affects UI commands only; imports and migrations
still validate the full character schema.

Module distribution/trust labels never grant runtime capabilities. Bundled and
local components use the same safe registry.

## Registry evolution

Component type versions are core versions, not module versions. A module states
its minimum core version. Breaking a configuration schema requires a new type
version or a core migration that preserves old behavior. Deprecation keeps old
renderers until installed characters can migrate safely.

## Test obligations

Every standard and advanced type needs schema tests, render/edit/readonly tests,
keyboard tests, accessible-name checks, narrow-screen fixtures, invalid-path
tests, and import round trips. Advanced types additionally require golden
parity fixtures from the game that motivated them.

## Open decisions

- Whether tabs are justified in generated character sheets or should initially
  be builder-only.
- Maximum nested component depth and repeatable-record count.
- Virtualization library or in-house pagination for large catalogs.
- Core ornament vocabulary for module themes.
- Whether record removal undo is universally available or action-configured.
