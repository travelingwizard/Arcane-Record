import { describe, expect, it } from 'vitest';
import { evaluateModuleCondition } from '../../src/modules/renderer/module-conditions';

describe('minimal module conditions', () => {
  const character = { layout: { mode: 'build' }, traits: { resolve: 3 } };

  it('evaluates safe path equality and Boolean composition', () => {
    expect(
      evaluateModuleCondition(
        {
          op: 'and',
          conditions: [
            {
              op: 'equals',
              path: { root: 'character', segments: ['layout', 'mode'] },
              value: 'build',
            },
            {
              op: 'not',
              condition: {
                op: 'equals',
                path: { root: 'character', segments: ['traits', 'resolve'] },
                value: 0,
              },
            },
          ],
        },
        character,
      ),
    ).toBe(true);
  });

  it('treats a missing path as false without changing the character', () => {
    const before = structuredClone(character);
    expect(
      evaluateModuleCondition(
        {
          op: 'truthy',
          path: { root: 'character', segments: ['traits', 'missing'] },
        },
        character,
      ),
    ).toBe(false);
    expect(character).toEqual(before);
  });
});
