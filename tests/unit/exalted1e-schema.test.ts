import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  dragonBloodedAbilityGroups,
  solarAbilityGroups,
} from '../../src/games/exalted1e/definitions';
import { exalted1eCharacterSchema } from '../../src/games/exalted1e/schema';

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
});
