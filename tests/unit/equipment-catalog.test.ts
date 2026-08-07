import { describe, expect, it } from 'vitest';
import {
  equipmentById,
  equipmentCatalog,
  equipmentCatalogSchema,
} from '../../src/systems/mage-m20/reference/equipment';
import { matchesReferenceSearch } from '../../src/systems/mage-m20/reference/magick';

describe('Equipment catalog', () => {
  it('parses all supplied equipment with unique stable IDs', () => {
    expect(equipmentCatalogSchema.parse(equipmentCatalog)).toEqual(
      equipmentCatalog,
    );
    expect(equipmentCatalog).toHaveLength(271);
    expect(equipmentById.size).toBe(equipmentCatalog.length);
  });

  it('covers weapons, armor, gear, and mature material', () => {
    expect(new Set(equipmentCatalog.map(({ category }) => category))).toEqual(
      new Set(['melee', 'ranged', 'armor', 'gear']),
    );
    expect(new Set(equipmentCatalog.map(({ family }) => family))).toEqual(
      new Set(['mundane', 'military', 'technocratic', 'mystic', 'malign']),
    );
    expect(
      equipmentCatalog
        .filter(({ family }) => family === 'malign')
        .every(({ contentLabel }) => contentLabel === 'mature'),
    ).toBe(true);
  });

  it('keeps important information and citations in reference data', () => {
    expect(equipmentById.get('kevlar-vest')).toMatchObject({
      category: 'armor',
      statistics: 'Armor 3; Dexterity -1',
      reviewStatus: 'unverified',
    });
    expect(equipmentById.get('semi-auto-light')?.citation).toBe(
      'Mage 20, p. 452',
    );
    expect(
      equipmentCatalog.every(
        ({ name, summary, citation }) => name && summary && citation,
      ),
    ).toBe(true);
  });

  it('searches names, descriptions, and citations', () => {
    const results = equipmentCatalog.filter((entry) =>
      matchesReferenceSearch(entry, 'quantum'),
    );
    expect(results.map(({ id }) => id)).toContain('question-mark');
  });

  it('includes missing Firefly Dies Armory references with compatibility warnings', () => {
    expect(equipmentById.get('wod-armory-bayonet')).toMatchObject({
      name: 'Bayonet',
      category: 'melee',
      statistics: 'Damage 2 (L); Size 1/S; Durability 3; Cost •',
      reviewStatus: 'unverified',
    });
    expect(equipmentById.get('wod-armory-anthrax')).toMatchObject({
      category: 'gear',
      family: 'military',
    });
    expect(
      equipmentCatalog
        .filter(({ id }) => id.startsWith('wod-armory-'))
        .every(({ summary }) => summary.includes('convert statistics')),
    ).toBe(true);
  });
});
