import { describe, expect, it } from 'vitest';
import {
  combatManeuverCatalog,
  combatManeuverCatalogSchema,
  doManeuverCatalog,
  doManeuverCatalogSchema,
  matchesManeuverSearch,
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

  it('parses 12 Revised and 3 Legacy Do maneuvers without The Final Blow', () => {
    expect(doManeuverCatalogSchema.parse(doManeuverCatalog)).toEqual(
      doManeuverCatalog,
    );
    expect(
      doManeuverCatalog.filter(({ version }) => version === 'revised'),
    ).toHaveLength(12);
    expect(
      doManeuverCatalog.filter(({ version }) => version === 'legacy'),
    ).toHaveLength(3);
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
      doManeuverCatalog.every(
        ({ source, page, citation }) => source && page && citation,
      ),
    ).toBe(true);
    expect(
      combatManeuverCatalog
        .filter((entry) => matchesManeuverSearch(entry, 'Athletics'))
        .map(({ id }) => id),
    ).toContain('combat-dodge');
    expect(
      doManeuverCatalog
        .filter((entry) => matchesManeuverSearch(entry, 'pressure-point'))
        .map(({ id }) => id),
    ).toContain('do-dim-mak');
  });
});
