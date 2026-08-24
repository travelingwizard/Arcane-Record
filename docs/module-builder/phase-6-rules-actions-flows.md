# Phase 6: rules, actions, and creation flows

Arcane Record now validates and runs a closed JSON AST for formulas,
conditions, validation rules, atomic actions, bounded dice, and guided creation
flows. It never evaluates source code, callbacks, HTML, CSS, regular
expressions, imports, or network operations.

The expression runtime provides finite arithmetic, comparison, Boolean,
conditional, rounding, clamping, path, literal, and formula-reference
operations. It enforces operation budgets, detects dependency cycles, reports
missing values and division by zero, and preserves a previous valid result as
explicitly stale rather than writing a derived value into character data.

Actions clone before execution, apply at most 100 declared effects, validate
the completed candidate, and either commit the whole candidate or return the
unchanged original. Supported effects are set, increment, decrement, toggle,
add record, and remove record. Soft-limit overrides require their configured
reason; hard limits cannot be overrideable. Undo-enabled actions return the
pre-transaction snapshot.

Creation flows have validated steps and guarded transitions, reachability and
missing-target diagnostics, resumable progress, timestamped step receipts,
review steps, and deterministic finalization. The builder exposes Rules and
Flows panels plus an isolated character-data sandbox. Dice definitions declare
sides and maximum pool size and accept injected randomness for deterministic
tests.

Focused tests cover type failures, budgets, formula cycles, stale values,
atomic rollback, undo, validation severities, override reasons, flow branches,
receipts, and deterministic dice.
