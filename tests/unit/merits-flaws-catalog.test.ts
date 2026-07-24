import { describe, expect, it } from 'vitest';
import {
  calculateMeritFlawTotals,
  filterAndSortMeritFlaws,
  projectMeritFlawTotals,
} from '../../src/systems/mage-m20/merit-flaw-rules';
import {
  meritFlawById,
  meritFlawCatalog,
  meritFlawCatalogSchema,
} from '../../src/systems/mage-m20/reference/merits-flaws';

describe('Mage M20 Merits and Flaws catalog', () => {
  it('validates all definitions with stable unique IDs', () => {
    expect(meritFlawCatalogSchema.parse(meritFlawCatalog)).toEqual(
      meritFlawCatalog,
    );
    expect(meritFlawCatalog).toHaveLength(231);
    expect(
      meritFlawCatalog.filter((definition) => definition.kind === 'merit'),
    ).toHaveLength(115);
    expect(
      meritFlawCatalog.filter((definition) => definition.kind === 'flaw'),
    ).toHaveLength(116);
    expect(new Set(meritFlawCatalog.map(({ id }) => id)).size).toBe(231);
  });

  it('preserves fixed, discrete, ranged, and multiple-source data', () => {
    expect(meritFlawById.get('ambidextrous')?.allowedCosts).toEqual([1]);
    expect(meritFlawById.get('acute-senses')?.allowedCosts).toEqual([1, 3]);
    expect(meritFlawById.get('impediment')?.allowedCosts).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(meritFlawById.get('degeneration')?.allowedCosts).toEqual([3, 6, 9]);
    expect(meritFlawById.get('acute-senses')?.sources).toEqual([
      { bookId: 'mage-20', bookLabel: 'Mage 20', page: 642 },
      { bookId: 'bos', bookLabel: 'BoS', page: 35 },
    ]);
  });

  it('records the six definitions whose source omits point costs', () => {
    const reviewEntries = meritFlawCatalog.filter(
      (definition) => definition.requiresReview,
    );
    expect(reviewEntries.map(({ name }) => name)).toEqual([
      'Shadow Appeal',
      'Innocuous Aura',
      'Abyssal Mastery',
      'Saint of the Pit',
      'Spectral Presence',
      'Abyssal Lunatic',
    ]);
    expect(
      reviewEntries.every(({ allowedCosts }) => allowedCosts.length === 0),
    ).toBe(true);
  });

  it('searches names, aliases, and descriptions and applies filters', () => {
    const base = {
      search: '',
      kind: 'all' as const,
      category: 'all' as const,
      bookId: '',
      cost: 'all' as const,
      sort: 'name-asc' as const,
    };
    expect(
      filterAndSortMeritFlaws(meritFlawCatalog, {
        ...base,
        search: 'acute senses',
      }).map(({ id }) => id),
    ).toEqual(['acute-senses']);
    expect(
      filterAndSortMeritFlaws(meritFlawCatalog, {
        ...base,
        search: 'quantum voyager',
      }).map(({ id }) => id),
    ).toEqual(['stormwarden-quantum-voyager']);
    expect(
      filterAndSortMeritFlaws(meritFlawCatalog, {
        ...base,
        search: 'photographic memory',
      }).map(({ id }) => id),
    ).toEqual(['eidetic-memory']);
    const filtered = filterAndSortMeritFlaws(meritFlawCatalog, {
      ...base,
      kind: 'flaw',
      category: 'physical',
      bookId: 'bos',
      cost: 3,
      sort: 'cost-desc',
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (definition) =>
          definition.kind === 'flaw' &&
          definition.category === 'physical' &&
          definition.allowedCosts.includes(3) &&
          definition.sources.some(({ bookId }) => bookId === 'bos'),
      ),
    ).toBe(true);
  });

  it('calculates current and projected totals with the seven-point cap', () => {
    const merit = {
      id: crypto.randomUUID(),
      definitionId: 'acute-senses',
      chosenCost: 3,
      notes: '',
      addedAt: new Date().toISOString(),
    };
    const flaw = {
      ...merit,
      id: crypto.randomUUID(),
      definitionId: 'addiction',
      chosenCost: 3,
    };
    const totals = calculateMeritFlawTotals([merit], [flaw]);
    expect(totals).toMatchObject({
      meritPointTotal: 3,
      flawPointTotal: 3,
      flawPointsGranted: 3,
      remainingFlawAllowance: 4,
      netCharacterCreationCost: 0,
    });
    expect(projectMeritFlawTotals(totals, 'flaw', 5)).toMatchObject({
      flawPointTotal: 8,
      flawPointsGranted: 7,
      excessFlawPoints: 1,
      remainingFlawAllowance: 0,
      netCharacterCreationCost: -4,
    });
  });
});
