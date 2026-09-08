import { describe, expect, it } from 'vitest';
import {
  w20Catalog,
  w20ChangingBreeds,
  w20Tribes,
  w20WyrmTypes,
} from '../../src/games/werewolf20/catalog';
import { createW20Character } from '../../src/games/werewolf20/create-character';
import {
  evaluateW20Roll,
  w20CreationBudgets,
  w20CreationIssues,
  w20LedgerTotals,
  w20XpCost,
} from '../../src/games/werewolf20/rules';
import { w20CharacterSchema } from '../../src/games/werewolf20/schema';

describe('Werewolf 20', () => {
  it('provides stable source-cited catalogs for every family', () => {
    expect(w20Tribes).toHaveLength(13);
    expect(w20ChangingBreeds).toHaveLength(11);
    expect(w20WyrmTypes.length).toBeGreaterThan(5);
    expect(new Set(w20Catalog.map(({ id }) => id)).size).toBe(
      w20Catalog.length,
    );
    expect(
      w20Catalog.every(
        ({ page, sourceId }) => page > 0 && sourceId.startsWith('w20.'),
      ),
    ).toBe(true);
  });

  it('creates validated records with type-aware sources', () => {
    for (const characterType of [
      'garou',
      'changing-breed',
      'kinfolk',
      'wyrm-aligned',
    ] as const) {
      const character = createW20Character({ characterType });
      expect(w20CharacterSchema.parse(character)).toEqual(character);
      if (characterType !== 'garou')
        expect(character.enabledSources.length).toBeGreaterThan(1);
    }
  });

  it('uses Garou and Kinfolk creation budgets', () => {
    expect(w20CreationBudgets(createW20Character())).toMatchObject({
      attributes: [7, 5, 3],
      abilities: [13, 9, 5],
      gifts: 3,
      freebies: 15,
    });
    expect(
      w20CreationBudgets(createW20Character({ characterType: 'kinfolk' })),
    ).toMatchObject({
      attributes: [6, 4, 3],
      abilities: [11, 7, 4],
      gifts: 0,
      freebies: 21,
    });
    expect(
      w20CreationIssues(createW20Character({ characterType: 'wyrm-aligned' })),
    ).toContain('Wyrm-aligned characters require mature-content opt-in.');
  });

  it('calculates d10 pools including specialties and cancellations', () => {
    expect(evaluateW20Roll([10, 8, 1], 6, false)).toEqual({
      successes: 1,
      result: 'success',
    });
    expect(evaluateW20Roll([10, 1], 6, true)).toEqual({
      successes: 1,
      result: 'success',
    });
    expect(evaluateW20Roll([1, 2], 6, false).result).toBe('botch');
  });

  it('prices advancement and derives ledger totals', () => {
    expect(w20XpCost('ability', 0)).toBe(3);
    expect(w20XpCost('attribute', 3)).toBe(12);
    const base = {
      date: '',
      storyId: '',
      targetKind: null,
      targetId: null,
      targetName: '',
      previousRating: null,
      newRating: null,
      description: '',
      justification: '',
      approvalId: null,
      reversedEntryId: null,
      createdAt: new Date().toISOString(),
    };
    expect(
      w20LedgerTotals([
        { ...base, id: crypto.randomUUID(), kind: 'award', amount: 10 },
        { ...base, id: crypto.randomUUID(), kind: 'purchase', amount: -3 },
      ]),
    ).toEqual({ total: 10, current: 7 });
  });
});
