import { describe, expect, it } from 'vitest';
import {
  focusDefinitionsByKind,
  instrumentCatalog,
  paradigmCatalog,
  practiceCatalog,
} from '../../src/systems/mage-m20/reference/focus';
import { matchesReferenceSearch } from '../../src/systems/mage-m20/reference/magick';
import {
  roteById,
  roteCatalog,
} from '../../src/systems/mage-m20/reference/rotes';
import {
  wonderById,
  wonderCatalog,
} from '../../src/systems/mage-m20/reference/wonders';

describe('Magick reference catalogs', () => {
  it('loads every organized reference list with stable unique IDs', () => {
    expect(paradigmCatalog).toHaveLength(40);
    expect(practiceCatalog).toHaveLength(38);
    expect(instrumentCatalog).toHaveLength(73);
    expect(wonderCatalog).toHaveLength(37);
    expect(roteCatalog).toHaveLength(60);

    for (const catalog of [
      paradigmCatalog,
      practiceCatalog,
      instrumentCatalog,
      wonderCatalog,
      roteCatalog,
    ]) {
      expect(new Set(catalog.map(({ id }) => id)).size).toBe(catalog.length);
      expect(
        catalog.every(
          (definition) =>
            definition.citation.length > 0 &&
            ['unverified', 'verified'].includes(definition.reviewStatus),
        ),
      ).toBe(true);
    }
  });

  it('keeps Focus definition families separate', () => {
    expect(focusDefinitionsByKind.paradigm.has('everything-is-data')).toBe(
      true,
    );
    expect(focusDefinitionsByKind.practice.has('reality-hacking')).toBe(true);
    expect(focusDefinitionsByKind.instrument.has('computer-gear')).toBe(true);
    expect(focusDefinitionsByKind.practice.has('everything-is-data')).toBe(
      false,
    );
  });

  it('preserves mature labels and incomplete indexed Rotes', () => {
    expect(wonderById.get('fido')?.contentLabel).toBe('mature');
    expect(roteById.get('timeless-agony')?.contentLabel).toBe('mature');
    expect(roteById.get('safecracker')).toMatchObject({
      family: 'indexed',
      requirements: '',
    });
  });

  it('searches names, descriptions, and citations case-insensitively', () => {
    const everythingIsData =
      focusDefinitionsByKind.paradigm.get('everything-is-data')!;
    expect(matchesReferenceSearch(everythingIsData, 'INFORMATION')).toBe(true);
    expect(matchesReferenceSearch(everythingIsData, 'Mage 20')).toBe(true);
    expect(matchesReferenceSearch(everythingIsData, 'dragon pearl')).toBe(
      false,
    );
  });
});
