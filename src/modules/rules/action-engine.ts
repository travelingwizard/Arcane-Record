import { readDataPath, writeDataPath } from '../schema/data-path';
import type { ActionDefinition, ValidationRuleDefinition } from './rule-schema';
import { evaluateExpression } from './expression-engine';

export interface RuleOverride {
  ruleId: string;
  reason: string;
  createdAt: string;
}
export interface ActionResult {
  committed: boolean;
  character: Record<string, unknown>;
  diagnostics: string[];
  undoSnapshot?: Record<string, unknown>;
}

export function runAction(
  action: ActionDefinition,
  character: Record<string, unknown>,
  rules: readonly ValidationRuleDefinition[] = [],
  overrides: readonly RuleOverride[] = [],
): ActionResult {
  const original = structuredClone(character);
  const next = structuredClone(character);
  const diagnostics: string[] = [];
  try {
    if (
      !action.conditions.every(
        (condition) =>
          evaluateExpression(condition, { character: next }) === true,
      )
    )
      return {
        committed: false,
        character: original,
        diagnostics: [
          action.failureMessage ?? 'Action conditions were not met.',
        ],
      };
    if (action.effects.length > 100)
      throw new Error('Action effect budget exceeded.');
    for (const effect of action.effects) {
      if (effect.type === 'set')
        writeDataPath(
          next,
          effect.path,
          evaluateExpression(effect.value, { character: next }),
        );
      else if (effect.type === 'increment' || effect.type === 'decrement') {
        const current = readDataPath(next, effect.path);
        const amount = evaluateExpression(effect.amount, { character: next });
        if (typeof current !== 'number' || typeof amount !== 'number')
          throw new Error('Numeric action target is invalid.');
        writeDataPath(
          next,
          effect.path,
          current + amount * (effect.type === 'increment' ? 1 : -1),
        );
      } else if (effect.type === 'toggle') {
        const current = readDataPath(next, effect.path);
        if (typeof current !== 'boolean')
          throw new Error('Toggle target is not Boolean.');
        writeDataPath(next, effect.path, !current);
      } else if (effect.type === 'add-record') {
        const collection = readDataPath(next, effect.path);
        if (!Array.isArray(collection))
          throw new Error('Record target is not a collection.');
        collection.push(evaluateExpression(effect.record, { character: next }));
      } else {
        const collection = readDataPath(next, effect.path);
        const recordId = evaluateExpression(effect.recordId, {
          character: next,
        });
        if (!Array.isArray(collection))
          throw new Error('Record target is not a collection.');
        const index = collection.findIndex(
          (item) =>
            item &&
            typeof item === 'object' &&
            (item as { id?: unknown }).id === recordId,
        );
        if (index < 0 && effect.missing === 'fail')
          throw new Error('Record to remove is unavailable.');
        if (index >= 0) collection.splice(index, 1);
      }
    }
    for (const rule of rules.filter((item) =>
      action.validationRuleIds.includes(item.id),
    )) {
      if (
        rule.when &&
        evaluateExpression(rule.when, { character: next }) !== true
      )
        continue;
      if (evaluateExpression(rule.assertion, { character: next }) === true)
        continue;
      diagnostics.push(rule.message);
      const override = overrides.find(({ ruleId }) => ruleId === rule.id);
      if (
        rule.severity === 'hard-limit' ||
        (rule.severity === 'soft-limit' &&
          (!rule.override?.allowed ||
            !override ||
            (rule.override.reasonRequired && !override.reason.trim())))
      )
        throw new Error(rule.message);
    }
    return {
      committed: true,
      character: next,
      diagnostics,
      undoSnapshot: action.undo === 'none' ? undefined : original,
    };
  } catch (error) {
    return {
      committed: false,
      character: original,
      diagnostics: [
        ...diagnostics,
        error instanceof Error ? error.message : 'Action failed.',
      ],
    };
  }
}
