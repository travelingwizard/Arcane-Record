import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  defaultExaltedSectionGroupOrder,
  dragonBloodedAbilityGroups,
  solarAbilityGroups,
} from '../../src/games/exalted1e/definitions';
import {
  exalted1eCharacterSchema,
  migrateExalted1eCharacter,
} from '../../src/games/exalted1e/schema';

describe('Exalted First Edition foundation', () => {
  it.each(['solar', 'dragon-blooded'] as const)(
    'creates valid %s data with integer dot ratings',
    (sheetType) => {
      const character = createBlankExaltedCharacter(sheetType);
      expect(exalted1eCharacterSchema.parse(character)).toEqual(character);
      expect(character.sheetType).toBe(sheetType);
      expect(character.attributes.physical.strength).toBe(1);
      expect(character.abilities.archery).toBe(0);
      expect(character.virtues.compassion).toBe(1);
      expect(character.essence.rating).toBe(1);
      expect(character.powers).toEqual({ charms: [], spells: [] });
      expect(character.sheetLayout.groupOrder).toEqual(
        defaultExaltedSectionGroupOrder,
      );
    },
  );

  it('uses all 25 Abilities once in each sheet grouping', () => {
    for (const groups of [solarAbilityGroups, dragonBloodedAbilityGroups]) {
      const abilityIds = groups.flatMap((group) => group.abilityIds);
      expect(abilityIds).toHaveLength(25);
      expect(new Set(abilityIds)).toHaveLength(25);
    }
  });

  it('rejects invalid sheet types and non-integer ratings', () => {
    const character = createBlankExaltedCharacter('solar');
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...character,
        sheetType: 'lunar',
      }),
    ).toThrow();
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...character,
        abilities: { ...character.abilities, archery: 2.5 },
      }),
    ).toThrow();
  });

  it('stores stable Background definition IDs instead of visible labels', () => {
    const character = createBlankExaltedCharacter('solar');
    const parsed = exalted1eCharacterSchema.parse({
      ...character,
      backgrounds: [
        {
          id: crypto.randomUUID(),
          definitionId: 'artifact',
          rating: 3,
          notes: 'Orichalcum daiklave',
        },
      ],
    });

    expect(parsed.backgrounds[0]?.definitionId).toBe('artifact');
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...character,
        backgrounds: [
          {
            id: crypto.randomUUID(),
            definitionId: 'Artifact',
            rating: 3,
            notes: '',
          },
        ],
      }),
    ).toThrow();

    expect(() =>
      exalted1eCharacterSchema.parse({
        ...character,
        backgrounds: [
          {
            id: crypto.randomUUID(),
            definitionId: 'breeding',
            rating: 2,
            notes: '',
          },
        ],
      }),
    ).toThrow();
  });

  it('validates complete section orders and migrates version-one sheets', () => {
    const character = createBlankExaltedCharacter('solar');
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...character,
        sheetLayout: {
          groupOrder: ['character', 'traits', 'advantages', 'advantages'],
        },
      }),
    ).toThrow();

    const versionOne = { ...character } as Partial<typeof character>;
    delete versionOne.sheetLayout;
    expect(
      migrateExalted1eCharacter(versionOne, 1).sheetLayout.groupOrder,
    ).toEqual(defaultExaltedSectionGroupOrder);
  });

  it('stores Dragon-Blooded powers by stable definition ID', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    const parsed = exalted1eCharacterSchema.parse({
      ...character,
      powers: {
        charms: [
          {
            id: crypto.randomUUID(),
            definitionId: 'terrestrial-circle-sorcery',
            notes: 'Learned at the Heptagram',
          },
        ],
        spells: [
          {
            id: crypto.randomUUID(),
            definitionId: 'assassin-s-fatal-touch',
            notes: '',
          },
        ],
      },
    });
    expect(parsed.powers.charms[0]?.definitionId).toBe(
      'terrestrial-circle-sorcery',
    );
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...character,
        powers: {
          charms: [
            { id: crypto.randomUUID(), definitionId: 'Not a Charm', notes: '' },
          ],
          spells: [],
        },
      }),
    ).toThrow();
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...createBlankExaltedCharacter('solar'),
        powers: parsed.powers,
      }),
    ).toThrow();
  });

  it('migrates version-two sheets with empty power selections', () => {
    const versionTwo = createBlankExaltedCharacter('dragon-blooded') as Partial<
      ReturnType<typeof createBlankExaltedCharacter>
    >;
    delete versionTwo.powers;
    expect(migrateExalted1eCharacter(versionTwo, 2).powers).toEqual({
      charms: [],
      spells: [],
    });
  });
});
