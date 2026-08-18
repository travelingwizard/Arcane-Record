import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { migrateExalted1eCharacter } from '../../src/games/exalted1e/schema';
import {
  getDragonBloodedEssenceExperienceCost,
  getDragonBloodedPowerExperienceCost,
  getExperienceTotals,
} from '../../src/games/exalted1e/shared/advancement/rules';
import {
  dragonBloodedCharms,
  dragonBloodedSpells,
} from '../../src/games/exalted1e/reference/dragonblooded-powers';

describe('shared Exalted records and Dragon-Blooded advancement', () => {
  it('keeps native, permanent, temporary, and custom languages distinct', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.languages.push(
      {
        id: crypto.randomUUID(),
        definitionId: 'high-realm',
        customName: '',
        proficiency: 'native',
        spoken: true,
        written: true,
        notes: '',
        sourceType: 'linguistics',
        sourceId: null,
      },
      {
        id: crypto.randomUUID(),
        definitionId: null,
        customName: 'Harbor Cant',
        proficiency: 'temporary',
        spoken: true,
        written: false,
        notes: 'Language-Learning Ritual',
        sourceType: 'charm',
        sourceId: 'language-learning-ritual',
      },
    );
    expect(character.languages[0]?.proficiency).toBe('native');
    expect(character.languages[1]).toMatchObject({
      customName: 'Harbor Cant',
      proficiency: 'temporary',
      sourceType: 'charm',
    });
  });

  it('derives XP totals from signed ledger entries', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.experienceLedger = [
      {
        id: crypto.randomUUID(),
        date: '2026-08-18',
        session: '1',
        type: 'award',
        amount: 12,
        category: 'Session',
        targetId: null,
        targetName: '',
        previousRating: null,
        newRating: null,
        description: 'Award',
        notes: '',
        createdAt: '2026-08-18T12:00:00.000Z',
      },
      {
        id: crypto.randomUUID(),
        date: '2026-08-18',
        session: '',
        type: 'purchase',
        amount: -10,
        category: 'Charm',
        targetId: 'test',
        targetName: 'Test Charm',
        previousRating: null,
        newRating: null,
        description: 'Purchase',
        notes: '',
        createdAt: '2026-08-18T13:00:00.000Z',
      },
      {
        id: crypto.randomUUID(),
        date: '2026-08-18',
        session: '',
        type: 'refund',
        amount: 2,
        category: 'Correction',
        targetId: null,
        targetName: '',
        previousRating: null,
        newRating: null,
        description: 'Refund',
        notes: '',
        createdAt: '2026-08-18T14:00:00.000Z',
      },
    ];
    expect(getExperienceTotals(character.experienceLedger)).toEqual({
      available: 4,
      lifetimeEarned: 12,
      lifetimeSpent: 10,
    });
  });

  it('applies Dragon-Blooded Charm, Immaculate, and Essence overrides', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    const charm = dragonBloodedCharms.find(
      ({ category }) => category !== 'immaculate-martial-art',
    )!;
    character.favoredAbilities = [
      charm.ability.toLocaleLowerCase().replace(/[^a-z]/g, '') as never,
    ];
    expect(getDragonBloodedPowerExperienceCost(character, charm).cost).toBe(10);
    const immaculate = dragonBloodedCharms.find(
      ({ category }) => category === 'immaculate-martial-art',
    )!;
    character.favoredAbilities = [];
    expect(
      getDragonBloodedPowerExperienceCost(character, immaculate).cost,
    ).toBe(15);
    character.favoredAbilities = ['martialArts'];
    expect(
      getDragonBloodedPowerExperienceCost(character, immaculate).cost,
    ).toBe(12);
    expect(
      getDragonBloodedPowerExperienceCost(character, dragonBloodedSpells[0]!)
        .cost,
    ).toBe(12);
    expect(getDragonBloodedEssenceExperienceCost(3)).toBe(30);
  });

  it('migrates shared collections empty without inferring historical XP', () => {
    const legacy = createBlankExaltedCharacter('dragon-blooded') as Record<
      string,
      unknown
    >;
    for (const key of [
      'languages',
      'derangements',
      'experienceLedger',
      'downtimeAdvancement',
      'possessions',
      'manses',
      'hearthstones',
    ]) {
      delete legacy[key];
    }
    const migrated = migrateExalted1eCharacter(legacy, 5);
    expect(migrated.languages).toEqual([]);
    expect(migrated.derangements).toEqual([]);
    expect(migrated.experienceLedger).toEqual([]);
    expect(migrated.downtimeAdvancement).toEqual([]);
  });
});
