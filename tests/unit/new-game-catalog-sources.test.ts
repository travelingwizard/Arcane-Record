import { describe, expect, it } from 'vitest';
import inventory from '../../docs/references/character-source-inventory.json';
import { cityThemeCatalog } from '../../src/games/city-of-mist/catalog';
import { citySources } from '../../src/games/city-of-mist/sources';
import {
  createCityCharacter,
  createCityCrew,
  migrateCityCharacter,
} from '../../src/games/city-of-mist/schema';
import { curseCatalog } from '../../src/games/curseborne/catalog';
import { curseSources } from '../../src/games/curseborne/sources';
import {
  createCurseCharacter,
  migrateCurseCharacter,
} from '../../src/games/curseborne/schema';
import {
  canAutomateCatalogEntry,
  catalogAvailability,
  sourceSelectionSchema,
} from '../../src/games/shared/catalog-sources';

describe('Curseborne and City source infrastructure', () => {
  it('keeps required sources enabled while preserving unknown future IDs', () => {
    expect(sourceSelectionSchema(citySources).parse(['future.city'])).toEqual([
      'com.players-guide',
      'future.city',
    ]);
    expect(sourceSelectionSchema(curseSources).parse([])).toEqual([
      'curseborne.core',
    ]);
    expect(
      catalogAvailability('future.city', ['future.city'], citySources),
    ).toBe('unresolved');
  });

  it('has unique, cited City theme definitions whose pages belong to their source', () => {
    expect(cityThemeCatalog).toHaveLength(27);
    expect(new Set(cityThemeCatalog.map((d) => d.id)).size).toBe(27);
    for (const definition of cityThemeCatalog) {
      const source = citySources.find((s) => s.id === definition.sourceId)!;
      expect(source).toBeTruthy();
      expect(definition.page).toBeGreaterThan(0);
      expect(definition.page).toBeLessThanOrEqual(source.maxPage);
      expect(definition.summary.length).toBeGreaterThan(30);
      expect(canAutomateCatalogEntry(definition, false)).toBe(false);
    }
  });

  it('indexes only the four reviewed Accursed Adventures heirlooms', () => {
    expect(curseCatalog.map((d) => d.name)).toEqual([
      'The Lethean Blade',
      'Osseous Adze',
      'Witness Lens',
      'Varicia’s Knot',
    ]);
    expect(new Set(curseCatalog.map((d) => d.id)).size).toBe(
      curseCatalog.length,
    );
    expect(
      curseCatalog.every(
        (d) =>
          d.sourceId === 'curseborne.accursed-adventures' &&
          d.automation === 'reference-only',
      ),
    ).toBe(true);
  });

  it('migrates sources additively without inferring optional ownership', () => {
    const oldCity = {
      ...createCityCharacter(),
      schemaVersion: 2,
      enabledSources: undefined,
    };
    const oldCurse = {
      ...createCurseCharacter(),
      schemaVersion: 2,
      enabledSources: undefined,
    };
    expect(migrateCityCharacter(oldCity, 2).enabledSources).toEqual([
      'com.players-guide',
    ]);
    expect(migrateCurseCharacter(oldCurse, 2).enabledSources).toEqual([
      'curseborne.core',
    ]);
    expect(createCityCrew().enabledSources).toContain('com.players-guide');
  });

  it('tracks every inventoried heading as not yet mechanically verified', () => {
    expect(inventory.sources.map((source) => source.sourceId)).toEqual([
      'curseborne.core',
      'curseborne.accursed-adventures',
      'com.players-guide',
      'com.shadows-showdowns',
    ]);
    for (const source of inventory.sources) {
      expect(source.headings.length).toBeGreaterThan(0);
      expect(
        source.headings.every(
          (entry) => entry.status === 'needs-entry-review' && entry.pdfPage > 0,
        ),
      ).toBe(true);
      expect(
        new Set(
          source.headings.map(
            (entry) => `${entry.heading.toLowerCase()}:${entry.pdfPage}`,
          ),
        ).size,
      ).toBe(source.headings.length);
    }
  });
});
