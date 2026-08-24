# Character-creation flow schema

## Core principle

A creation flow edits the same module character schema used in Play. It is a
guided state machine and validation view, not a second character document and
not an executable wizard. A character can use a profile with no flow, pause and
resume a flow, revise completed steps, or continue freeform when the profile
permits it.

## Creation profile

```ts
interface CreationProfileDefinition {
  id: string;
  sheetTemplateId: string;
  name: string;
  description?: string;
  initialPatch?: DeclarativePatch[];
  enabledRuleIds: string[];
  budgetIds: string[];
  defaultFlowId?: string;
  allowFreeform: boolean;
  allowReopenAfterFinalize: boolean;
}
```

Profiles express alternatives such as a standard character, experienced
character, or freeform import without cloning the sheet schema. Profile
defaults apply only when creating missing data and never overwrite existing
values when reopening.

## Flow definition

```ts
interface CreationFlowDefinition {
  id: string;
  sheetTemplateId: string;
  name: string;
  description?: string;
  startStepId: string;
  steps: CreationStepDefinition[];
  completionCondition: Expression;
  reviewStepId: string;
  finalizeActionId: string;
  allowBacktracking: boolean;
}

interface CreationStepDefinition {
  id: string;
  label: string;
  helpText?: string;
  componentIds: string[];
  entryCondition?: Expression;
  completionCondition: Expression;
  validationRuleIds: string[];
  budgetIds: string[];
  onEnterActionIds: string[];
  onCompleteActionIds: string[];
  transitions: CreationTransition[];
  summaryFields: CreationSummaryField[];
  skippable: boolean;
}
```

Transitions have stable IDs, target step IDs, optional conditions, labels, and
priority. More than one valid transition requires an explicit user branch
choice unless the conditions are statically exclusive. No valid transition is
a visible diagnostic, not an implicit finalize.

## Progress metadata

Character ratings and records live at their normal paths. Creation progress is
character-owned metadata with no duplicated ratings:

```ts
interface CreationProgress {
  profileId: string;
  flowId: string | null;
  status: 'not-started' | 'in-progress' | 'completed' | 'reopened';
  currentStepId: string | null;
  visitedStepIds: string[];
  completedStepIds: string[];
  branchChoices: Record<string, string>;
  grantedEffects: CreationGrantReceipt[];
  overrides: ValidationOverrideRecord[];
  startedAt: string;
  updatedAt: string;
  finalizedAt: string | null;
}
```

Grant receipts identify the action/effect and created record UUIDs. Reopening a
step can therefore distinguish an automatic grant from a user-created record.
It must not delete either silently. A module update that removes a step leaves
unknown progress IDs preserved with a migration diagnostic.

## Budgets, limits, and choices

A budget declares a stable ID, source amount formula, spend formula or selected
record costs, scope, applicable steps/modes, and validation severity. The UI
shows available, spent, and remaining values with an explanation. Negative
remaining values preserve selections and use the configured warning/limit
behavior.

Minimum/maximum ratings, required choices, unique/mutually-exclusive options,
prerequisites, and dependent choices reuse validation rules. Automatic grants
use actions and receipts. User choices write ordinary character fields or
records. No flow-only answer may affect play without a declared destination in
the character schema or retained creation metadata.

## Entry, completion, and branching

- Entry conditions decide whether a step is reachable.
- Completion conditions report readiness; hard errors prevent completion.
- `onEnter` actions run once per entry receipt unless explicitly repeatable.
- `onComplete` actions and transition occur in one atomic command.
- Backtracking never reverses data automatically. It marks later steps for
  revalidation and shows consequences.
- Changing an early branch preserves now-inapplicable data until the user
  confirms a module-defined cleanup action or keeps it with an allowed override.

Activation analysis verifies that the start/review steps exist, referenced
steps and components exist, at least one structural path can reach review, and
there are no unconditional dead-end cycles. Conditional reachability is also
tested with module fixtures; it cannot be proven completely for every value.

## Final review and finalize

The review screen summarizes choices, budgets, hard errors, warnings, soft-limit
overrides, unresolved definitions, and source citations. Finalize is an atomic
action that:

1. validates the complete character and flow completion condition;
2. records required override reasons;
3. changes creation status and timestamps;
4. performs declared final grants/ledger entries once;
5. leaves progress, choices, receipts, and character data intact;
6. switches to a declared sheet mode only if configured.

Finalization is not export or persistence; normal autosave writes the committed
character and displays “Saved in this browser”. Reopening changes status and
does not restore an old snapshot.

## Visual designer

The creation-flow designer provides:

- a keyboard-reorderable step outline and focused step editor;
- a branch graph with an equivalent accessible list/table representation;
- compatible component/path pickers;
- condition, budget, rule, and action editors;
- test-value scenarios and deterministic transition preview;
- unreachable/dead-end/cycle and duplicate-grant diagnostics;
- desktop/mobile preview using the real generic renderer;
- saved draft revisions and undo/redo.

On narrow screens, outline, step editor, conditions, and preview become focused
screens. Dragging is never the only way to move a step or connect a transition.

## Burning Wheel proof case

Burning Wheel is the strongest existing creation flow and therefore converts
after Mage and Exalted establish the runtime. The flow must express stock
selection, ordered lifepaths, leads and requirements, variable time, age,
diminishing returns, Brutal Life, stat/shade allocation, required/optional
skills and Traits, resource purchases, relationships, and final warnings.

The specialized lifepath and shaded-allocation components remain core-owned,
but all catalogs, requirements, grants, budgets, questions, and sheet paths are
module data. Current default-on enforcement and explicit override settings must
remain behaviorally identical.

## Persistence and migration

Draft creation state saves with the character through the repository; it is not
kept only in component state. Template migrations transform progress IDs and
receipts alongside character data. Migration must never infer that an existing
legacy character completed a guided flow. Converted existing characters start
with a profile chosen for migration and `status: completed` only if that state
is explicitly part of the conversion policy; otherwise use a distinct
`not-recorded` migration status added to the final schema.

## Tests

- profile defaults validate and do not overwrite existing data;
- optional/freeform creation;
- branch choice, conditional skip, backtracking, and revalidation;
- budget totals and warning/soft/hard behavior;
- prerequisites, mutually exclusive and dependent selections;
- grants run once and receipts preserve provenance;
- pause, reload, resume, finalize, reopen, and migrate;
- incomplete and unresolved flow recovery;
- graph reachability/cycle diagnostics;
- keyboard move controls, focus, labels, mobile layout, and 320-pixel overflow;
- Burning Wheel fixture parity before its hard-coded burner is retired.

## Open decisions

- Final representation of migrated characters with no historical flow state.
- Whether a flow can span multiple sheet templates (not recommended initially).
- Maximum step/transition counts and static analysis budget.
- Cleanup UX when branch changes make retained data inapplicable.
- Whether creation history is always exported or may be omitted from a privacy-
  focused character export while retaining required state.
