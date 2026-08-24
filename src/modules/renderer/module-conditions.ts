import { readDataPath } from '../schema/data-path';
import type { ModuleCondition } from '../schema/module-envelope';

export function evaluateModuleCondition(
  condition: ModuleCondition | undefined,
  character: unknown,
): boolean {
  if (!condition) return true;
  switch (condition.op) {
    case 'equals':
      return Object.is(
        readDataPath(character, condition.path),
        condition.value,
      );
    case 'truthy':
      return Boolean(readDataPath(character, condition.path));
    case 'not':
      return !evaluateModuleCondition(condition.condition, character);
    case 'and':
      return condition.conditions.every((child) =>
        evaluateModuleCondition(child, character),
      );
    case 'or':
      return condition.conditions.some((child) =>
        evaluateModuleCondition(child, character),
      );
  }
}
