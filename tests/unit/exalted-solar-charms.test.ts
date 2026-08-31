import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  solarCharmById,
  solarCharms,
} from '../../src/games/exalted1e/reference/solar-charms';
import { exalted1eCharacterSchema } from '../../src/games/exalted1e/schema';

const expectedAbilityCounts = {
  Archery: 14,
  Brawl: 11,
  Melee: 19,
  Thrown: 10,
  Endurance: 13,
  Performance: 5,
  Presence: 9,
  Resistance: 14,
  Survival: 9,
  Craft: 5,
  Linguistics: 3,
  Socialize: 4,
  Ride: 4,
  Sail: 8,
  Awareness: 4,
  Dodge: 1,
  Lore: 7,
  Medicine: 11,
  Occult: 4,
  Athletics: 4,
};

describe('Solar Charm handbook catalog', () => {
  it('preserves all handbook rows with stable unique IDs and Ability counts', () => {
    expect(solarCharms).toHaveLength(159);
    expect(new Set(solarCharms.map(({ id }) => id))).toHaveLength(159);
    expect(
      Object.fromEntries(
        Object.keys(expectedAbilityCounts).map((ability) => [
          ability,
          solarCharms.filter((charm) => charm.ability === ability).length,
        ]),
      ),
    ).toEqual(expectedAbilityCounts);
  });

  it('retains mechanics, requirements, prerequisites, and citations', () => {
    const charm = solarCharmById.get('wise-arrow');
    expect(charm).toMatchObject({
      name: 'Wise Arrow',
      ability: 'Archery',
      cost: '1m/die',
      duration: 'Instant',
      type: 'Supplemental',
      minimumEssence: 1,
      sourceDisplay: 'Exalted 154',
      reviewStatus: 'needs-review',
    });
    expect(charm?.minimumRequirements).toContainEqual({
      trait: 'Archery',
      rating: 1,
    });
    expect(
      solarCharmById.get('sight-without-eyes')?.prerequisiteCharms,
    ).toEqual(['wise-arrow']);
  });

  it('accepts Solar selections and keeps both Exalt catalogs isolated', () => {
    const solar = createBlankExaltedCharacter('solar');
    const selectedSolar = {
      ...solar,
      powers: {
        charms: [
          {
            id: crypto.randomUUID(),
            definitionId: 'wise-arrow',
            notes: 'Signature opening shot',
          },
        ],
        spells: [],
      },
    };
    expect(
      exalted1eCharacterSchema.parse(selectedSolar).powers.charms[0]
        ?.definitionId,
    ).toBe('wise-arrow');
    expect(() =>
      exalted1eCharacterSchema.parse({
        ...createBlankExaltedCharacter('dragon-blooded'),
        powers: selectedSolar.powers,
      }),
    ).toThrow();
  });
});
