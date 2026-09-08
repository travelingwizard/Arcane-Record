import { describe, expect, it } from 'vitest';
import { wr20Catalog } from '../../src/games/wraith20/catalog';
import {
  createWr20Character,
  createWr20Shadow,
} from '../../src/games/wraith20/create-character';
import {
  creationIssues,
  evaluateRoll,
  ledgerTotals,
} from '../../src/games/wraith20/rules';
import {
  wr20CharacterSchema,
  wr20ShadowSchema,
} from '../../src/games/wraith20/schema';

describe('Wraith 20 module', () => {
  it('uses stable unique source-cited catalog definitions', () => {
    expect(new Set(wr20Catalog.map((x) => x.id)).size).toBe(wr20Catalog.length);
    expect(
      wr20Catalog.every(
        (x) => x.id.startsWith('wr20.') && x.page > 0 && x.summary.length > 10,
      ),
    ).toBe(true);
  });

  it('creates and validates each entry family and a separate Shadow', () => {
    for (const characterType of ['wraith', 'medium', 'spectre'] as const) {
      const character = createWr20Character({ characterType });
      expect(wr20CharacterSchema.parse(character).characterType).toBe(
        characterType,
      );
    }
    expect(wr20ShadowSchema.parse(createWr20Shadow()).permanentAngst).toBe(1);
  });

  it('requires mature-content approval for Spectres', () => {
    const character = createWr20Character({ characterType: 'spectre' });
    expect(creationIssues(character)).toContain(
      'Spectre creation requires mature-content opt-in and a recorded Storyteller approval.',
    );
    character.creation.matureContent = true;
    character.creation.storytellerApproved = true;
    character.creation.approvalReason = 'Chronicle premise';
    expect(creationIssues(character)).not.toContain(
      'Spectre creation requires mature-content opt-in and a recorded Storyteller approval.',
    );
  });

  it('counts standard dice and identifies Shadow-die ones', () => {
    expect(evaluateRoll([10, 7, 1, 1], 2, 2, 6)).toEqual({
      successes: 0,
      shadowOnes: 2,
      result: 'failure',
    });
    expect(evaluateRoll([1, 2], 2, 0, 6).result).toBe('botch');
  });

  it('derives current and lifetime experience from the ledger', () => {
    const character = createWr20Character();
    const now = new Date().toISOString();
    character.experienceLedger = [
      {
        id: crypto.randomUUID(),
        date: '2026-09-08',
        kind: 'award',
        amount: 5,
        targetId: null,
        targetName: '',
        previousRating: null,
        newRating: null,
        description: 'Award',
        reversedEntryId: null,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        date: '2026-09-08',
        kind: 'purchase',
        amount: -2,
        targetId: null,
        targetName: 'Ability',
        previousRating: 1,
        newRating: 2,
        description: 'Purchase',
        reversedEntryId: null,
        createdAt: now,
      },
    ];
    expect(ledgerTotals(character.experienceLedger)).toEqual({
      total: 5,
      current: 3,
    });
  });
});
