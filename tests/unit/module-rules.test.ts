import { describe, expect, it } from 'vitest';
import {
  evaluateExpression,
  evaluateFormulas,
} from '../../src/modules/rules/expression-engine';
import { runAction } from '../../src/modules/rules/action-engine';
import {
  advanceCreationFlow,
  creationFlowDiagnostics,
  startCreationFlow,
} from '../../src/modules/rules/creation-flow';
import { rollDice } from '../../src/modules/rules/dice-engine';
import type {
  ActionDefinition,
  CreationFlowDefinition,
  FormulaDefinition,
  ValidationRuleDefinition,
} from '../../src/modules/rules/rule-schema';

const path = (segments: string[]) => ({ root: 'character' as const, segments });

describe('declarative module rules runtime', () => {
  it('evaluates typed expressions without string coercion and enforces budgets', () => {
    expect(
      evaluateExpression(
        {
          op: 'add',
          values: [
            { op: 'literal', value: 2 },
            { op: 'path', path: path(['rating']) },
          ],
        },
        { character: { rating: 3 } },
      ),
    ).toBe(5);
    expect(() =>
      evaluateExpression(
        {
          op: 'add',
          values: [
            { op: 'literal', value: '2' },
            { op: 'literal', value: 3 },
          ],
        },
        { character: {} },
      ),
    ).toThrow(/finite number/i);
    expect(() =>
      evaluateExpression(
        { op: 'literal', value: 1 },
        { character: {} },
        { operations: 1, maximum: 1 },
      ),
    ).toThrow(/budget/i);
  });

  it('rejects cycles and preserves a last-valid value as stale', () => {
    const cyclic: FormulaDefinition[] = [
      {
        id: 'one',
        resultType: 'number',
        expression: { op: 'formula', id: 'two' },
      },
      {
        id: 'two',
        resultType: 'number',
        expression: { op: 'formula', id: 'one' },
      },
    ];
    expect(evaluateFormulas(cyclic, {}).get('one')?.status).toBe('error');
    const failing: FormulaDefinition[] = [
      {
        id: 'one',
        resultType: 'number',
        expression: {
          op: 'divide',
          left: { op: 'literal', value: 2 },
          right: { op: 'literal', value: 0 },
        },
      },
    ];
    expect(
      evaluateFormulas(failing, {}, new Map([['one', 7]])).get('one'),
    ).toMatchObject({ status: 'stale', value: 7 });
  });

  it('commits actions atomically, rolls failures back, and records undo snapshots', () => {
    const action: ActionDefinition = {
      id: 'spend',
      trigger: 'button',
      conditions: [],
      effects: [
        {
          id: 'decrease',
          type: 'decrement',
          path: path(['points']),
          amount: { op: 'literal', value: 2 },
        },
        { id: 'toggle', type: 'toggle', path: path(['active']) },
      ],
      validationRuleIds: ['nonnegative'],
      undo: 'single-step',
    };
    const rule: ValidationRuleDefinition = {
      id: 'nonnegative',
      code: 'nonnegative',
      severity: 'hard-limit',
      assertion: {
        op: 'gte',
        left: { op: 'path', path: path(['points']) },
        right: { op: 'literal', value: 0 },
      },
      message: 'Points cannot be negative.',
      targetComponentIds: [],
      appliesIn: ['build'],
      preserveExisting: true,
    };
    expect(
      runAction(action, { points: 3, active: false }, [rule]),
    ).toMatchObject({
      committed: true,
      character: { points: 1, active: true },
      undoSnapshot: { points: 3, active: false },
    });
    expect(
      runAction(action, { points: 1, active: false }, [rule]),
    ).toMatchObject({
      committed: false,
      character: { points: 1, active: false },
    });
  });

  it('supports reasoned soft overrides, resumable branching flows, and deterministic bounded dice', () => {
    const soft: ValidationRuleDefinition = {
      id: 'limit',
      code: 'limit',
      severity: 'soft-limit',
      assertion: { op: 'literal', value: false },
      message: 'Over limit.',
      targetComponentIds: [],
      appliesIn: ['build'],
      preserveExisting: true,
      override: { allowed: true, reasonRequired: true },
    };
    const action: ActionDefinition = {
      id: 'mark',
      trigger: 'button',
      conditions: [],
      effects: [
        {
          id: 'set',
          type: 'set',
          path: path(['value']),
          value: { op: 'literal', value: 2 },
        },
      ],
      validationRuleIds: ['limit'],
      undo: 'none',
    };
    expect(runAction(action, { value: 1 }, [soft]).committed).toBe(false);
    expect(
      runAction(
        action,
        { value: 1 },
        [soft],
        [
          {
            ruleId: 'limit',
            reason: 'Storyteller award',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      ).committed,
    ).toBe(true);
    const flow: CreationFlowDefinition = {
      id: 'burn',
      name: 'Burn',
      startStepId: 'start',
      steps: [
        {
          id: 'start',
          label: 'Start',
          componentIds: [],
          review: false,
          transitions: [
            {
              to: 'review',
              label: 'Continue',
              when: { op: 'literal', value: true },
            },
          ],
        },
        {
          id: 'review',
          label: 'Review',
          componentIds: [],
          review: true,
          transitions: [],
        },
      ],
    };
    const started = startCreationFlow(flow, '2026-01-01T00:00:00.000Z');
    expect(
      advanceCreationFlow(flow, started, {}, 0, '2026-01-02T00:00:00.000Z')
        .currentStepId,
    ).toBe('review');
    expect(creationFlowDiagnostics(flow)).toEqual([]);
    expect(
      rollDice(
        { id: 'd6', name: 'D6', sides: 6, maximumDice: 2 },
        2,
        () => 0.5,
      ),
    ).toEqual([4, 4]);
  });
});
