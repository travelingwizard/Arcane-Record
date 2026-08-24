# Formula, validation, and action DSL

## Safety model

The DSL is a JSON abstract syntax tree validated before activation. It never
parses or executes JavaScript, TypeScript, HTML, CSS, template strings, regular
expressions supplied as code, dynamic imports, or network operations. Every
operator and effect is registered by core with typed inputs, deterministic
behavior, cost accounting, and tests.

All values are JSON values. Numbers must be finite. Integer character fields
reject fractional writes. Property access uses validated `DataPath` segments
and never traverses prototypes.

## Expressions

```ts
type Expression =
  | { op: 'literal'; value: JsonValue }
  | { op: 'path'; path: DataPath; missing?: JsonValue }
  | { op: 'constant'; id: string }
  | { op: 'catalog-field'; definition: Expression; field: string }
  | { op: 'not'; value: Expression }
  | { op: 'negate'; value: Expression }
  | { op: 'add' | 'multiply' | 'and' | 'or'; values: Expression[] }
  | {
      op: 'subtract' | 'divide' | 'modulo';
      left: Expression;
      right: Expression;
    }
  | {
      op: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte';
      left: Expression;
      right: Expression;
    }
  | { op: 'if'; condition: Expression; then: Expression; else: Expression }
  | { op: 'min' | 'max' | 'sum'; values: Expression[] }
  | { op: 'count'; collection: Expression; where?: Expression }
  | { op: 'round' | 'floor' | 'ceil'; value: Expression }
  | {
      op: 'clamp';
      value: Expression;
      minimum: Expression;
      maximum: Expression;
    };
```

Collection predicates receive a lexical `item` and `index` scope represented by
distinct path roots; arbitrary variable names and closures are not supported.
Phase 1 may omit `catalog-field` and predicate `count` from execution until
their indexing/type design is proven, but it must reserve them in diagnostics
rather than inventing game-specific callbacks.

### Type checking

Activation infers an expression's scalar/collection/object type and compares it
with the target formula, condition, rule, or effect. Arithmetic never coerces
strings. Boolean operators require Booleans. Equality compares same-domain
values. Division/modulo by zero, missing required paths, invalid catalog refs,
and non-finite results are typed runtime diagnostics.

Rounding follows ECMAScript numeric semantics only after finite-number checks;
game-specific half-rounding rules need an explicit future operator rather than
an undocumented convention.

## Formulas and dependency graph

```ts
interface FormulaDefinition {
  id: string;
  resultType: ValueType;
  expression: Expression;
  fallback?: JsonValue;
  explanation?: LocalizedText;
}
```

The validator collects formula and derived-path references, builds a directed
graph, and rejects self-dependencies and strongly connected components. The
graph is topologically evaluated and memoized per immutable character revision.
Character edits invalidate only affected downstream nodes.

Each displayed formula result carries `valid`, `stale`, or `error` status. A
runtime error preserves the previous valid value in the active session, marks
it stale, and shows a diagnostic with the formula ID and failing operation. A
stale value is never written as authoritative character data. With no previous
value, a schema-valid declared fallback may display with an explicit warning.

Evaluation budgets limit AST depth, node count, collection visits, and total
formula operations per revision. A budget failure is an error state, not a
partial write.

## Validation rules

```ts
interface ValidationRuleDefinition {
  id: string;
  code: string;
  severity: 'information' | 'warning' | 'soft-limit' | 'hard-limit';
  when?: Expression;
  assertion: Expression;
  message: LocalizedText;
  targetComponentIds: string[];
  appliesIn: string[];
  override?: { allowed: boolean; reasonRequired: boolean };
  preserveExisting: boolean;
}
```

An assertion is valid when it evaluates to `true`. Information and warning
rules do not block commands. Soft limits block only when the module says an
override is required and no recorded reason exists. Hard limits block commands,
but imported or migrated legacy data that already violates a limit is preserved
in a recoverable over-limit state unless accepting it would violate structural
safety.

Overrides are character-owned records with rule ID, reason, timestamp, and
optional affected record IDs. Modules cannot label a hard limit overrideable.
Changing ratings does not silently trim collections.

## Actions

```ts
interface ActionDefinition {
  id: string;
  trigger: ActionTrigger;
  conditions: Expression[];
  effects: ActionEffect[];
  validationRuleIds: string[];
  successMessage?: LocalizedText;
  failureMessage?: LocalizedText;
  undo: 'none' | 'single-step' | 'transaction-history';
  ledgerEffectId?: string;
}
```

Supported triggers are button activated, field changed, record added, record
removed, creation step entered, and creation step completed. Trigger bindings
identify a component or record collection; global wildcard field listeners are
not permitted.

### Effects

| Effect                                | Required configuration                        | Safety behavior                                                                 |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| `set`                                 | writable path, typed expression               | Target must exist in schema or be optional and allowed.                         |
| `increment` / `decrement`             | numeric path, amount                          | Finite arithmetic; bounds validate before commit.                               |
| `clamp`                               | numeric path, bounds                          | Explicit operation, never an implicit correction.                               |
| `toggle`                              | Boolean path                                  | No truthy coercion.                                                             |
| `add-record`                          | collection path, record expression            | Generates/provides UUID under declared policy; validates duplicate rules.       |
| `remove-record`                       | collection path, stable selector              | Missing target is a defined no-op or failure, never positional deletion.        |
| `update-record`                       | collection path, UUID selector, typed patch   | Cannot change UUID or prohibited definition identity.                           |
| `apply-condition` / `clear-condition` | condition collection and stable ID            | Condition schema and duplicate policy validate.                                 |
| `roll-dice`                           | dice system, pool expressions, result binding | Uses core RNG interface; deterministic tests; no remote randomness.             |
| `spend-resource` / `restore-resource` | numeric path, amount, bounds                  | Insufficient resource is a validation failure unless permitted override exists. |
| `append-ledger`                       | ledger path and complete entry expression     | Entry UUID/timestamp assigned once; ledger schema validates.                    |
| `show-message`                        | safe message and severity                     | Presentation effect occurs only after commit for success.                       |
| `navigate-creation-step`              | flow/step ID                                  | Target and transition conditions must validate.                                 |

The action engine should also provide a constrained `cycle-state` effect for
tracks such as Mage Health. It is safer and clearer than encoding array-index
arithmetic in a visual formula.

## Atomic execution

1. Create an immutable snapshot and action context (character revision, trigger,
   actor mode, record ID, deterministic timestamp/RNG interface).
2. Evaluate trigger conditions against the snapshot.
3. Resolve every effect in order into a proposed patch without mutating active
   state. Later effects may read prior proposed effects through a `proposed`
   root.
4. Validate effect types, record policies, referenced definitions, action rules,
   and the complete character schema.
5. Calculate downstream formulas and blocking rules under budget.
6. Commit one active-store revision, one undo transaction, and any ledger entry.
7. Queue resulting field/record triggers and show the success message.

Any failure discards the proposed patch, consumes no resources, appends no
ledger entry, and emits one structured diagnostic/failure message. Persistence
then autosaves the committed revision through `CharacterRepository`; Dexie is
not called by the action engine or component.

## Loop prevention

An execution context tracks depth, effect count, triggered action IDs, and
written paths. Recommended initial limits are 16 action invocations, 100 effects,
and 1,000 expression operations per user command, subject to performance tests.

A queued action may not re-enter the same action for the same trigger and
record in one command. Static activation analysis rejects obvious action cycles
where writes unconditionally retrigger prior actions. Dynamic cycles terminate
with the entire user command rolled back. Messages and navigation effects do
not trigger character actions.

## Undo and history

Undo stores inverse JSON patches plus character revision metadata, not module
code. A user command and all triggered effects are one undo unit. Ledger entries
created by an action are reversed according to the module's declared ledger
policy; append-only financial/XP-style ledgers should use an explicit refund or
correction action instead of destructive undo after persistence.

Builder undo/redo is a separate draft-command history and must not share the
character action stack.

## Dice systems

A safe dice system declares die sides, pool expression, success comparison,
exploding/reroll/cancel rules from core enums, botch/failure/success mapping, and
result presentation. Phase 1 should implement only primitives required by
converted, tested mechanics. Novel mechanics need a new reviewed core operator,
not a formula escape hatch.

Dice result records may include inputs, individual results, total successes,
outcome, timestamp, and action/target IDs when the module explicitly logs them.
No telemetry or server logging is permitted.

## Diagnostics and simulation

Every error includes module/formula/action/rule IDs, JSON pointer, stable code,
expected/actual type, and remediation. The builder sandbox accepts cloned test
character data, shows dependency and transaction previews, uses deterministic
dice seeds, and cannot save to a real character unless the user explicitly
applies a separately validated action.

## Open decisions

- Numeric precision and any game-specific rounding operators.
- Catalog query/index expression vocabulary.
- Initial execution budgets after mobile benchmarks.
- Persistent action history versus session-only undo.
- Exact dice primitives needed for the first converted systems.
- Whether soft-limit override records belong at a common character metadata
  path or a template-declared path.
