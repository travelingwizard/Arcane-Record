import type { SelectedBackground } from '../../types/character';
import type {
  BackgroundDefinition,
  BackgroundRestriction,
} from './reference/backgrounds';
import { backgroundById } from './reference/backgrounds';

export const backgroundCreationRules = {
  standardBackgroundPoints: 7,
  enforcement: 'warning',
} as const;

export const backgroundRatingRules = {
  extendedInterfaceMaximum: 10,
  extendedRatingsRequireApproval: true,
} as const;

export interface BackgroundTotals {
  pointsSpent: number;
  standardAllowance: number;
  pointsRemaining: number;
  pointsOver: number;
  selectedCount: number;
  unresolvedCount: number;
}

export function calculateBackgroundCreationCost(
  rating: number,
  definition: BackgroundDefinition,
) {
  return rating * definition.creationPointCostPerDot;
}

export function calculateBackgroundTotals(
  selections: SelectedBackground[],
  standardAllowance = backgroundCreationRules.standardBackgroundPoints,
): BackgroundTotals {
  let unresolvedCount = 0;
  const pointsSpent = selections.reduce((total, selection) => {
    const definition = backgroundById.get(selection.definitionId);
    if (!definition) {
      unresolvedCount += 1;
      return total;
    }
    return (
      total + calculateBackgroundCreationCost(selection.rating, definition)
    );
  }, 0);

  return {
    pointsSpent,
    standardAllowance,
    pointsRemaining: Math.max(0, standardAllowance - pointsSpent),
    pointsOver: Math.max(0, pointsSpent - standardAllowance),
    selectedCount: selections.length,
    unresolvedCount,
  };
}

export function projectBackgroundTotals(
  totals: BackgroundTotals,
  definition: BackgroundDefinition,
  rating = definition.minimumRating,
): BackgroundTotals {
  const pointsSpent =
    totals.pointsSpent + calculateBackgroundCreationCost(rating, definition);
  return {
    ...totals,
    pointsSpent,
    pointsRemaining: Math.max(0, totals.standardAllowance - pointsSpent),
    pointsOver: Math.max(0, pointsSpent - totals.standardAllowance),
    selectedCount: totals.selectedCount + 1,
  };
}

export type BackgroundCatalogSort =
  'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc';

export interface BackgroundCatalogFilters {
  search: string;
  bookId: string;
  maximum: 'all' | 'standard' | 'extended';
  costPerDot: 'all' | 1 | 2;
  restriction: 'all' | 'none' | BackgroundRestriction;
  repeatability: 'all' | 'single' | 'multiple';
  sort: BackgroundCatalogSort;
}

export function filterAndSortBackgrounds(
  definitions: BackgroundDefinition[],
  filters: BackgroundCatalogFilters,
) {
  const search = filters.search.trim().toLocaleLowerCase();
  return definitions
    .filter((definition) => {
      const searchable = [
        definition.name,
        ...definition.aliases,
        definition.mysticName,
        definition.technocraticName,
        definition.description,
      ]
        .join(' ')
        .toLocaleLowerCase();
      const restrictionMatches =
        filters.restriction === 'all' ||
        (filters.restriction === 'none'
          ? definition.restrictions.length === 0
          : definition.restrictions.includes(filters.restriction));
      return (
        (!search || searchable.includes(search)) &&
        (!filters.bookId ||
          definition.sources.some(
            (source) => source.bookId === filters.bookId,
          )) &&
        (filters.maximum === 'all' ||
          (filters.maximum === 'extended'
            ? definition.supportsRatingsAboveFive
            : !definition.supportsRatingsAboveFive)) &&
        (filters.costPerDot === 'all' ||
          definition.creationPointCostPerDot === filters.costPerDot) &&
        restrictionMatches &&
        (filters.repeatability === 'all' ||
          (filters.repeatability === 'multiple'
            ? definition.canBeSelectedMultipleTimes
            : !definition.canBeSelectedMultipleTimes))
      );
    })
    .sort((left, right) => {
      if (filters.sort === 'name-asc') {
        return left.name.localeCompare(right.name);
      }
      if (filters.sort === 'name-desc') {
        return right.name.localeCompare(left.name);
      }
      const delta =
        filters.sort === 'cost-asc'
          ? left.creationPointCostPerDot - right.creationPointCostPerDot
          : right.creationPointCostPerDot - left.creationPointCostPerDot;
      return delta || left.name.localeCompare(right.name);
    });
}
