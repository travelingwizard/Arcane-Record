import { describe, expect, it } from 'vitest';
import {
  v20Catalog,
  v20Clans,
  v20RevenantFamilies,
  v20Titles,
} from '../../src/games/vampire20/catalog';
import { createV20Character } from '../../src/games/vampire20/create-character';
import {
  generationFromBackground,
  v20CreationBudgets,
  v20LedgerTotals,
  v20XpCost,
} from '../../src/games/vampire20/rules';
import { v20CharacterSchema } from '../../src/games/vampire20/schema';

describe('Vampire 20', () => {
  it('has stable unique source-cited catalog records', () => {
    expect(v20Clans).toHaveLength(14);
    expect(v20RevenantFamilies.length).toBeGreaterThan(10);
    expect(v20Titles.length).toBeGreaterThan(5);
    expect(new Set(v20Catalog.map(({ id }) => id)).size).toBe(
      v20Catalog.length,
    );
    expect(
      v20Catalog.every(
        ({ page, sourceId }) => page > 0 && sourceId.startsWith('v20.'),
      ),
    ).toBe(true);
  });

  it('creates validated vampire, ghoul, and revenant records', () => {
    for (const characterType of ['vampire', 'ghoul', 'revenant'] as const) {
      const character = createV20Character({ characterType });
      expect(v20CharacterSchema.parse(character)).toEqual(character);
      expect(character.characterType).toBe(characterType);
      if (characterType !== 'vampire') {
        expect(character.enabledSources).toContain('v20.ghouls-revenants');
        expect(
          character.disciplines.find(({ name }) => name === 'Potence')?.rating,
        ).toBe(1);
      }
    }
  });

  it('uses distinct published creation budgets', () => {
    expect(v20CreationBudgets(createV20Character()).disciplines).toBe(3);
    expect(
      v20CreationBudgets(createV20Character({ characterType: 'ghoul' })),
    ).toMatchObject({
      attributes: [6, 4, 3],
      abilities: [11, 7, 4],
      freebies: 21,
    });
    expect(
      v20CreationBudgets(createV20Character({ characterType: 'revenant' }))
        .virtues,
    ).toBe(5);
  });

  it('calculates generation, advancement, and ledger totals', () => {
    expect(generationFromBackground(0)).toBe(13);
    expect(generationFromBackground(5)).toBe(8);
    expect(v20XpCost('ability', 0)).toBe(3);
    expect(v20XpCost('clan-discipline', 3)).toBe(15);
    const now = new Date().toISOString();
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
      createdAt: now,
    };
    expect(
      v20LedgerTotals([
        { ...base, id: crypto.randomUUID(), kind: 'award', amount: 10 },
        { ...base, id: crypto.randomUUID(), kind: 'purchase', amount: -3 },
      ]),
    ).toEqual({ total: 10, current: 7 });
  });
});
