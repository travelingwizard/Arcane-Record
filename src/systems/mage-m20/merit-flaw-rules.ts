import type { SelectedMeritFlaw } from '../../types/character';
import type {
  MeritFlawDefinition,
  MeritFlawKind,
} from './reference/merits-flaws';

export const meritFlawRules = {
  maximumFlawPointsGranted: 7,
  enforcement: 'warning',
} as const;

export interface MeritFlawTotals {
  meritPointTotal: number;
  flawPointTotal: number;
  flawPointsGranted: number;
  remainingFlawAllowance: number;
  excessFlawPoints: number;
  netCharacterCreationCost: number;
  meritCount: number;
  flawCount: number;
}

export function calculateMeritFlawTotals(
  merits: SelectedMeritFlaw[],
  flaws: SelectedMeritFlaw[],
): MeritFlawTotals {
  const meritPointTotal = merits.reduce(
    (total, selection) => total + selection.chosenCost,
    0,
  );
  const flawPointTotal = flaws.reduce(
    (total, selection) => total + selection.chosenCost,
    0,
  );
  const flawPointsGranted = Math.min(
    flawPointTotal,
    meritFlawRules.maximumFlawPointsGranted,
  );

  return {
    meritPointTotal,
    flawPointTotal,
    flawPointsGranted,
    remainingFlawAllowance: Math.max(
      0,
      meritFlawRules.maximumFlawPointsGranted - flawPointTotal,
    ),
    excessFlawPoints: Math.max(
      0,
      flawPointTotal - meritFlawRules.maximumFlawPointsGranted,
    ),
    netCharacterCreationCost: meritPointTotal - flawPointsGranted,
    meritCount: merits.length,
    flawCount: flaws.length,
  };
}

export function projectMeritFlawTotals(
  totals: MeritFlawTotals,
  kind: MeritFlawKind,
  cost: number,
): MeritFlawTotals {
  const meritPointTotal =
    totals.meritPointTotal + (kind === 'merit' ? cost : 0);
  const flawPointTotal = totals.flawPointTotal + (kind === 'flaw' ? cost : 0);
  const flawPointsGranted = Math.min(
    flawPointTotal,
    meritFlawRules.maximumFlawPointsGranted,
  );

  return {
    meritPointTotal,
    flawPointTotal,
    flawPointsGranted,
    remainingFlawAllowance: Math.max(
      0,
      meritFlawRules.maximumFlawPointsGranted - flawPointTotal,
    ),
    excessFlawPoints: Math.max(
      0,
      flawPointTotal - meritFlawRules.maximumFlawPointsGranted,
    ),
    netCharacterCreationCost: meritPointTotal - flawPointsGranted,
    meritCount: totals.meritCount + (kind === 'merit' ? 1 : 0),
    flawCount: totals.flawCount + (kind === 'flaw' ? 1 : 0),
  };
}

export type MeritFlawCatalogSort =
  'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc';

export interface MeritFlawCatalogFilters {
  search: string;
  kind: MeritFlawKind | 'all';
  category: MeritFlawDefinition['category'] | 'all';
  bookId: string;
  cost: number | 'all';
  sort: MeritFlawCatalogSort;
}

export function filterAndSortMeritFlaws(
  definitions: MeritFlawDefinition[],
  filters: MeritFlawCatalogFilters,
) {
  const search = filters.search.trim().toLocaleLowerCase();
  return definitions
    .filter((definition) => {
      const searchable = [
        definition.name,
        ...definition.aliases,
        definition.description,
      ]
        .join(' ')
        .toLocaleLowerCase();
      return (
        (!search || searchable.includes(search)) &&
        (filters.kind === 'all' || definition.kind === filters.kind) &&
        (filters.category === 'all' ||
          definition.category === filters.category) &&
        (!filters.bookId ||
          definition.sources.some(
            (source) => source.bookId === filters.bookId,
          )) &&
        (filters.cost === 'all' ||
          definition.allowedCosts.includes(filters.cost))
      );
    })
    .sort((left, right) => {
      if (filters.sort === 'name-asc') {
        return left.name.localeCompare(right.name);
      }
      if (filters.sort === 'name-desc') {
        return right.name.localeCompare(left.name);
      }
      const leftCost =
        filters.sort === 'cost-asc'
          ? Math.min(...left.allowedCosts, Number.POSITIVE_INFINITY)
          : Math.max(...left.allowedCosts, Number.NEGATIVE_INFINITY);
      const rightCost =
        filters.sort === 'cost-asc'
          ? Math.min(...right.allowedCosts, Number.POSITIVE_INFINITY)
          : Math.max(...right.allowedCosts, Number.NEGATIVE_INFINITY);
      const delta =
        filters.sort === 'cost-asc'
          ? leftCost - rightCost
          : rightCost - leftCost;
      return delta || left.name.localeCompare(right.name);
    });
}
