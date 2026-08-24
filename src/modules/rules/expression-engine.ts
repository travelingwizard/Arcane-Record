import { readDataPath } from '../schema/data-path';
import type { FormulaDefinition, ModuleExpression } from './rule-schema';

export interface EvaluationContext {
  character: Record<string, unknown>;
  formulas?: ReadonlyMap<string, FormulaDefinition>;
  previous?: ReadonlyMap<string, unknown>;
}
export interface FormulaResult {
  status: 'valid' | 'stale' | 'error';
  value: unknown;
  message?: string;
}
const number = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Expected a finite number.');
  return value;
};
const boolean = (value: unknown) => {
  if (typeof value !== 'boolean') throw new Error('Expected a Boolean.');
  return value;
};

export function evaluateExpression(
  expression: ModuleExpression,
  context: EvaluationContext,
  budget = { operations: 0, maximum: 10_000 },
): unknown {
  budget.operations += 1;
  if (budget.operations > budget.maximum)
    throw new Error('Expression operation budget exceeded.');
  const run = (value: ModuleExpression) =>
    evaluateExpression(value, context, budget);
  switch (expression.op) {
    case 'literal':
      return structuredClone(expression.value);
    case 'path': {
      const value = readDataPath(context.character, expression.path);
      if (value === undefined) {
        if ('missing' in expression) return expression.missing;
        throw new Error(
          `Required path “${expression.path.segments.join('.')}” is missing.`,
        );
      }
      return value;
    }
    case 'formula': {
      const formula = context.formulas?.get(expression.id);
      if (!formula)
        throw new Error(`Formula “${expression.id}” is unavailable.`);
      return run(formula.expression);
    }
    case 'not':
      return !boolean(run(expression.value));
    case 'negate':
      return -number(run(expression.value));
    case 'round':
      return Math.round(number(run(expression.value)));
    case 'floor':
      return Math.floor(number(run(expression.value)));
    case 'ceil':
      return Math.ceil(number(run(expression.value)));
    case 'add':
      return expression.values.reduce<number>(
        (total, item) => total + number(run(item)),
        0,
      );
    case 'multiply':
      return expression.values.reduce<number>(
        (total, item) => total * number(run(item)),
        1,
      );
    case 'sum':
      return expression.values.reduce<number>(
        (total, item) => total + number(run(item)),
        0,
      );
    case 'min':
      return Math.min(...expression.values.map((item) => number(run(item))));
    case 'max':
      return Math.max(...expression.values.map((item) => number(run(item))));
    case 'and':
      return expression.values.every((item) => boolean(run(item)));
    case 'or':
      return expression.values.some((item) => boolean(run(item)));
    case 'subtract':
      return number(run(expression.left)) - number(run(expression.right));
    case 'divide': {
      const divisor = number(run(expression.right));
      if (divisor === 0) throw new Error('Division by zero.');
      return number(run(expression.left)) / divisor;
    }
    case 'modulo': {
      const divisor = number(run(expression.right));
      if (divisor === 0) throw new Error('Modulo by zero.');
      return number(run(expression.left)) % divisor;
    }
    case 'eq':
      return run(expression.left) === run(expression.right);
    case 'ne':
      return run(expression.left) !== run(expression.right);
    case 'lt':
      return number(run(expression.left)) < number(run(expression.right));
    case 'lte':
      return number(run(expression.left)) <= number(run(expression.right));
    case 'gt':
      return number(run(expression.left)) > number(run(expression.right));
    case 'gte':
      return number(run(expression.left)) >= number(run(expression.right));
    case 'if':
      return boolean(run(expression.condition))
        ? run(expression.then)
        : run(expression.else);
    case 'clamp':
      return Math.min(
        number(run(expression.maximum)),
        Math.max(
          number(run(expression.minimum)),
          number(run(expression.value)),
        ),
      );
  }
}

export function formulaDependencies(expression: ModuleExpression): string[] {
  const found = new Set<string>();
  const visit = (value: ModuleExpression) => {
    if (value.op === 'formula') found.add(value.id);
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object' && 'op' in child)
        visit(child as ModuleExpression);
      else if (Array.isArray(child))
        child.forEach((item) => {
          if (item && typeof item === 'object' && 'op' in item)
            visit(item as ModuleExpression);
        });
    }
  };
  visit(expression);
  return [...found];
}

export function evaluateFormulas(
  definitions: readonly FormulaDefinition[],
  character: Record<string, unknown>,
  previous = new Map<string, unknown>(),
) {
  const formulas = new Map(definitions.map((value) => [value.id, value]));
  const visiting = new Set<string>();
  const complete = new Map<string, FormulaResult>();
  const evaluate = (id: string): FormulaResult => {
    if (visiting.has(id))
      return {
        status: 'error',
        value: undefined,
        message: `Formula cycle includes “${id}”.`,
      };
    const cached = complete.get(id);
    if (cached) return cached;
    const formula = formulas.get(id);
    if (!formula)
      return {
        status: 'error',
        value: undefined,
        message: `Formula “${id}” is missing.`,
      };
    visiting.add(id);
    for (const dependency of formulaDependencies(formula.expression)) {
      const result = evaluate(dependency);
      if (result.status === 'error') {
        visiting.delete(id);
        const failed = {
          status: 'error' as const,
          value: previous.get(id) ?? formula.fallback,
          message: result.message,
        };
        complete.set(id, failed);
        return failed;
      }
    }
    try {
      const value = evaluateExpression(formula.expression, {
        character,
        formulas,
      });
      const result = { status: 'valid' as const, value };
      complete.set(id, result);
      visiting.delete(id);
      return result;
    } catch (error) {
      const old = previous.get(id);
      const result: FormulaResult = {
        status: old === undefined ? 'error' : 'stale',
        value: old ?? formula.fallback,
        message: error instanceof Error ? error.message : 'Formula failed.',
      };
      complete.set(id, result);
      visiting.delete(id);
      return result;
    }
  };
  definitions.forEach(({ id }) => evaluate(id));
  return complete;
}
