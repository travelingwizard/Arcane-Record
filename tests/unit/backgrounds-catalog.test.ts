import { describe, expect, it } from 'vitest';
import {
  calculateBackgroundCreationCost,
  calculateBackgroundTotals,
  filterAndSortBackgrounds,
  projectBackgroundTotals,
  type BackgroundCatalogFilters,
} from '../../src/systems/mage-m20/background-rules';
import {
  backgroundById,
  backgroundCatalog,
  backgroundCatalogSchema,
} from '../../src/systems/mage-m20/reference/backgrounds';
import type { SelectedBackground } from '../../src/types/character';

const defaultFilters: BackgroundCatalogFilters = {
  search: '',
  bookId: '',
  maximum: 'all',
  costPerDot: 'all',
  restriction: 'all',
  repeatability: 'all',
  sort: 'name-asc',
};

function selection(definitionId: string, rating: number): SelectedBackground {
  return {
    id: crypto.randomUUID(),
    definitionId,
    displayName: definitionId,
    rating,
    notes: '',
    addedAt: new Date().toISOString(),
    pooled: false,
  };
}

describe('Background catalog and creation rules', () => {
  it('validates all 33 unique source definitions', () => {
    expect(backgroundCatalogSchema.parse(backgroundCatalog)).toHaveLength(33);
    expect(new Set(backgroundCatalog.map(({ id }) => id)).size).toBe(33);
    expect(
      backgroundCatalog.filter(
        (definition) => definition.supportsRatingsAboveFive,
      ),
    ).toHaveLength(9);
    expect(
      backgroundCatalog.filter(
        (definition) => definition.creationPointCostPerDot === 2,
      ),
    ).toHaveLength(3);
    expect(
      backgroundCatalog.filter(
        (definition) => definition.canBeSelectedMultipleTimes,
      ),
    ).toHaveLength(8);
  });

  it('preserves aliases, restrictions, costs, and multiple citations', () => {
    expect(backgroundById.get('arcane-cloaking')).toMatchObject({
      aliases: ['Arcane', 'Cloaking'],
      mysticName: 'Arcane',
      technocraticName: 'Cloaking',
    });
    expect(backgroundById.get('requisitions')?.restrictions).toEqual([
      'technocracy-only',
    ]);
    expect(backgroundById.get('totem')).toMatchObject({
      creationPointCostPerDot: 2,
      restrictions: ['shamanic-character'],
    });
    expect(backgroundById.get('chantry-construct')?.sources).toHaveLength(2);
  });

  it('calculates one-point, two-point, remaining, over, and projected totals', () => {
    const resources = backgroundById.get('resources')!;
    const enhancement = backgroundById.get('enhancement')!;
    expect(calculateBackgroundCreationCost(3, resources)).toBe(3);
    expect(calculateBackgroundCreationCost(3, enhancement)).toBe(6);

    const totals = calculateBackgroundTotals([
      selection('resources', 3),
      selection('enhancement', 2),
    ]);
    expect(totals).toMatchObject({
      pointsSpent: 7,
      pointsRemaining: 0,
      pointsOver: 0,
      selectedCount: 2,
    });
    expect(
      projectBackgroundTotals(totals, backgroundById.get('allies')!),
    ).toMatchObject({ pointsSpent: 8, pointsRemaining: 0, pointsOver: 1 });
  });

  it('excludes unresolved references until they are repaired', () => {
    const totals = calculateBackgroundTotals([
      selection('resources', 3),
      selection('legacy-network', 4),
    ]);
    expect(totals).toMatchObject({
      pointsSpent: 3,
      unresolvedCount: 1,
      selectedCount: 2,
    });
  });

  it('searches names, aliases, and descriptions and applies every filter', () => {
    expect(
      filterAndSortBackgrounds(backgroundCatalog, {
        ...defaultFilters,
        search: 'Cloaking',
      }).map(({ id }) => id),
    ).toContain('arcane-cloaking');
    expect(
      filterAndSortBackgrounds(backgroundCatalog, {
        ...defaultFilters,
        search: 'cash flow',
      }).map(({ id }) => id),
    ).toEqual(['resources']);
    expect(
      filterAndSortBackgrounds(backgroundCatalog, {
        ...defaultFilters,
        bookId: 'operative-dossier',
      }).map(({ id }) => id),
    ).toEqual(['chantry-construct']);
    expect(
      filterAndSortBackgrounds(backgroundCatalog, {
        ...defaultFilters,
        maximum: 'extended',
        costPerDot: 1,
        restriction: 'technocracy-only',
        repeatability: 'single',
      }).map(({ id }) => id),
    ).toEqual(['requisitions']);
    expect(
      filterAndSortBackgrounds(backgroundCatalog, {
        ...defaultFilters,
        costPerDot: 2,
        sort: 'name-desc',
      }).map(({ id }) => id),
    ).toEqual(['totem', 'sanctum-laboratory', 'enhancement']);
  });
});
