import { describe, expect, it } from 'vitest';
import {
  combatManeuverCatalog,
  combatManeuverCatalogSchema,
  doManeuverCatalog,
  doManeuverCatalogSchema,
  getSpecialDoTechniqueAllowance,
  matchesManeuverSearch,
  officialDoTechniqueCatalog,
} from '../../src/systems/mage-m20/reference/maneuvers';

describe('Maneuver reference catalogs', () => {
  it('parses 31 categorized combat maneuvers with unique stable IDs', () => {
    expect(combatManeuverCatalogSchema.parse(combatManeuverCatalog)).toEqual(
      combatManeuverCatalog,
    );
    expect(combatManeuverCatalog).toHaveLength(31);
    expect(
      Object.fromEntries(
        ['general', 'defensive', 'close-combat', 'ranged'].map((category) => [
          category,
          combatManeuverCatalog.filter((entry) => entry.category === category)
            .length,
        ]),
      ),
    ).toEqual({
      general: 7,
      defensive: 4,
      'close-combat': 11,
      ranged: 9,
    });
    expect(new Set(combatManeuverCatalog.map(({ id }) => id)).size).toBe(
      combatManeuverCatalog.length,
    );
  });

  it('parses exactly nine official M20 Special Do Techniques', () => {
    expect(doManeuverCatalogSchema.parse(doManeuverCatalog)).toEqual(
      doManeuverCatalog,
    );
    expect(
      officialDoTechniqueCatalog.map(({ name, sourcePage }) => ({
        name,
        sourcePage,
      })),
    ).toEqual([
      { name: 'Arrow Cutting', sourcePage: '428' },
      { name: 'Hurricane Throw', sourcePage: '428-429' },
      { name: 'Iron Shirt', sourcePage: '429' },
      { name: 'Kiaijutsu', sourcePage: '429' },
      { name: 'Plum Flower Blossom', sourcePage: '429' },
      { name: 'Soft Fist', sourcePage: '429' },
      { name: 'Ten Thousand Weapons', sourcePage: '429' },
      { name: 'Typhoon Kick', sourcePage: '430' },
      { name: 'Weapon Art', sourcePage: '430' },
    ]);
    expect(
      officialDoTechniqueCatalog.every(
        ({
          roll,
          difficulty,
          damage,
          actions,
          category,
          official,
          legacy,
          sourceTitle,
          sourcePageStart,
        }) =>
          roll &&
          difficulty &&
          damage &&
          actions &&
          category === 'special-do-technique' &&
          official &&
          !legacy &&
          sourceTitle === 'Mage: The Ascension 20th Anniversary Edition' &&
          sourcePageStart >= 428,
      ),
    ).toBe(true);
    expect(doManeuverCatalog.filter(({ legacy }) => legacy)).toHaveLength(9);
    expect(
      doManeuverCatalog.some(({ name }) => name === 'The Final Blow'),
    ).toBe(false);
  });

  it('keeps source and page data visible and searchable', () => {
    expect(
      combatManeuverCatalog.every(
        ({ source, page, citation }) => source && page && citation,
      ),
    ).toBe(true);
    expect(
      doManeuverCatalog.every(({ source, page, citation }) =>
        Boolean(source && page && citation),
      ),
    ).toBe(true);
    expect(
      combatManeuverCatalog
        .filter((entry) => matchesManeuverSearch(entry, 'Athletics'))
        .map(({ id }) => id),
    ).toContain('combat-dodge');
    expect(
      doManeuverCatalog
        .filter((entry) => matchesManeuverSearch(entry, 'Iron Shout'))
        .map(({ id }) => id),
    ).toContain('do-kiaijutsu');
    expect(
      doManeuverCatalog
        .filter((entry) => matchesManeuverSearch(entry, 'Strength +5'))
        .map(({ id }) => id),
    ).toContain('do-typhoon-kick');
  });

  it('calculates the M20 allowance from Do', () => {
    expect([0, 1, 2, 3, 4, 5].map(getSpecialDoTechniqueAllowance)).toEqual([
      0, 0, 1, 2, 3, 4,
    ]);
  });
});
