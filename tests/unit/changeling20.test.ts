import { describe, expect, it } from 'vitest';
import { changeling20Catalog } from '../../src/games/changeling20/catalog';
import { createChangeling20Character } from '../../src/games/changeling20/create-character';
import {
  canRefundC20Entry,
  c20CreationIssues,
  c20LedgerTotals,
  c20XpCost,
} from '../../src/games/changeling20/rules';
import { changeling20CharacterSchema } from '../../src/games/changeling20/schema';

describe('Changeling 20 rules', () => {
  it('has stable unique, cited catalog entries', () => {
    expect(new Set(changeling20Catalog.map(({ id }) => id)).size).toBe(
      changeling20Catalog.length,
    );
    expect(
      changeling20Catalog.every(
        ({ id, page, sourceId }) =>
          id.startsWith('c20.') && page > 0 && sourceId === 'c20.core',
      ),
    ).toBe(true);
  });

  it('creates a valid local-first standard character with published tempers', () => {
    const character = createChangeling20Character();
    expect(changeling20CharacterSchema.parse(character)).toEqual(character);
    expect(character.tempers).toMatchObject({
      willpower: { permanent: 4 },
      glamour: { permanent: 5 },
      banality: { permanent: 3 },
    });
    expect(character.attributes).toHaveLength(9);
    expect(character.abilities).toHaveLength(30);
  });

  it('uses the published advancement table', () => {
    expect(c20XpCost('attribute', 3)).toBe(12);
    expect(c20XpCost('ability', 0)).toBe(3);
    expect(c20XpCost('ability', 3)).toBe(6);
    expect(c20XpCost('art', 0)).toBe(7);
    expect(c20XpCost('realm', 0)).toBe(5);
    expect(c20XpCost('glamour', 4)).toBe(12);
  });

  it('derives experience rather than storing authoritative totals', () => {
    expect(
      c20LedgerTotals([
        {
          id: crypto.randomUUID(),
          date: '2026-09-07',
          kind: 'award',
          amount: 10,
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
        },
        {
          id: crypto.randomUUID(),
          date: '2026-09-07',
          kind: 'purchase',
          amount: -6,
          targetKind: 'ability',
          targetId: 'x',
          targetName: 'Kenning',
          previousRating: 3,
          newRating: 4,
          description: '',
          justification: '',
          approvalId: null,
          reversedEntryId: null,
          createdAt: new Date().toISOString(),
        },
      ]),
    ).toEqual({ total: 10, current: 4 });
  });

  it('requires mature opt-in for antagonist-oriented profiles', () => {
    const character = createChangeling20Character();
    character.profile = 'dauntain';
    expect(c20CreationIssues(character)).toContain(
      'This antagonist-oriented profile requires mature-content opt-in.',
    );
  });

  it('allows a purchase refund only once', () => {
    const purchase = {
      id: crypto.randomUUID(),
      date: '2026-09-07',
      kind: 'purchase' as const,
      amount: -6,
      targetKind: 'ability' as const,
      targetId: 'kenning',
      targetName: 'Kenning',
      previousRating: 3,
      newRating: 4,
      description: '',
      justification: '',
      approvalId: null,
      reversedEntryId: null,
      createdAt: new Date().toISOString(),
    };
    expect(canRefundC20Entry([purchase], purchase.id)).toBe(true);
    expect(
      canRefundC20Entry(
        [
          purchase,
          {
            ...purchase,
            id: crypto.randomUUID(),
            kind: 'refund',
            amount: 6,
            reversedEntryId: purchase.id,
          },
        ],
        purchase.id,
      ),
    ).toBe(false);
  });
});
