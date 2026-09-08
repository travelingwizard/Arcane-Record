import { describe, expect, it } from 'vitest';
import {
  dav20Catalog,
  dav20Clans,
  dav20Bloodlines,
} from '../../src/games/vampire-dark-ages20/catalog';
import { createDav20Character } from '../../src/games/vampire-dark-ages20/create-character';
import {
  bloodLimits,
  canRefundDav20,
  dav20CreationIssues,
  dav20LedgerTotals,
  dav20XpCost,
  generationFromBackground,
  startingBlood,
} from '../../src/games/vampire-dark-ages20/rules';
import { dav20CharacterSchema } from '../../src/games/vampire-dark-ages20/schema';

describe('Vampire Dark Ages 20', () => {
  it('has unique stable cited catalog records for every published lineage', () => {
    expect(dav20Clans).toHaveLength(14);
    expect(dav20Bloodlines).toHaveLength(19);
    expect(new Set(dav20Catalog.map(({ id }) => id)).size).toBe(
      dav20Catalog.length,
    );
    expect(
      dav20Catalog.every(({ id, page }) => id.startsWith('dav20.') && page > 0),
    ).toBe(true);
  });
  it('creates a schema-valid fledgling with published base traits', () => {
    const character = createDav20Character();
    expect(dav20CharacterSchema.parse(character)).toEqual(character);
    expect(character.attributes).toHaveLength(9);
    expect(character.abilities).toHaveLength(30);
    expect(character.virtues.map(({ rating }) => rating)).toEqual([1, 1, 1]);
  });
  it('derives Generation and blood limits from the Background', () => {
    expect(generationFromBackground(0)).toBe(12);
    expect(generationFromBackground(5)).toBe(7);
    expect(bloodLimits(9)).toEqual({
      maximum: 14,
      perTurn: 2,
      traitMaximum: 5,
    });
    expect(startingBlood(8, 3, 4, 12)).toBe(12);
  });
  it('uses every published XP cost family', () => {
    expect(dav20XpCost('area', 3)).toBe(1);
    expect(dav20XpCost('ability', 0)).toBe(3);
    expect(dav20XpCost('clan-discipline', 3)).toBe(15);
    expect(dav20XpCost('other-discipline', 3)).toBe(21);
    expect(dav20XpCost('ritual', 0, 4)).toBe(8);
    expect(dav20XpCost('willpower', 6)).toBe(6);
  });
  it('blocks incomplete builds and derives ledger totals', () => {
    const character = createDav20Character();
    expect(dav20CreationIssues(character)).toContain(
      'Choose a clan or bloodline.',
    );
    expect(
      dav20LedgerTotals([
        {
          id: crypto.randomUUID(),
          date: '',
          storyId: '',
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
          date: '',
          storyId: '',
          kind: 'purchase',
          amount: -4,
          targetKind: 'willpower',
          targetId: null,
          targetName: '',
          previousRating: 4,
          newRating: 5,
          description: '',
          justification: '',
          approvalId: null,
          reversedEntryId: null,
          createdAt: new Date().toISOString(),
        },
      ]),
    ).toEqual({ total: 10, current: 6 });
  });
  it('prevents double refunds', () => {
    const purchase = {
      id: crypto.randomUUID(),
      date: '',
      storyId: '',
      kind: 'purchase' as const,
      amount: -4,
      targetKind: 'willpower',
      targetId: null,
      targetName: 'Willpower',
      previousRating: 4,
      newRating: 5,
      description: '',
      justification: '',
      approvalId: null,
      reversedEntryId: null,
      createdAt: new Date().toISOString(),
    };
    expect(canRefundDav20([purchase], purchase.id)).toBe(true);
    expect(
      canRefundDav20(
        [
          purchase,
          {
            ...purchase,
            id: crypto.randomUUID(),
            kind: 'refund',
            amount: 4,
            reversedEntryId: purchase.id,
          },
        ],
        purchase.id,
      ),
    ).toBe(false);
  });
});
