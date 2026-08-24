import { useMemo, useState } from 'react';
import {
  filterAndSortMeritFlaws,
  projectMeritFlawTotals,
  type MeritFlawCatalogFilters,
  type MeritFlawTotals,
} from '../../../systems/mage-m20/merit-flaw-rules';
import {
  formatAllowedCosts,
  formatMeritFlawSources,
  meritFlawBooks,
  meritFlawCatalog,
  meritFlawCategories,
  meritFlawCosts,
  type MeritFlawDefinition,
} from '../../../systems/mage-m20/reference/merits-flaws';
import { DescriptionPreview } from './DescriptionPreview';

const defaultFilters: MeritFlawCatalogFilters = {
  search: '',
  kind: 'all',
  category: 'all',
  bookId: '',
  cost: 'all',
  sort: 'name-asc',
};

function projectedText(
  definition: MeritFlawDefinition,
  cost: number,
  totals: MeritFlawTotals,
) {
  const projected = projectMeritFlawTotals(totals, definition.kind, cost);
  return {
    label: `After adding this ${cost}-point ${definition.kind}`,
    compact: `Merits ${projected.meritPointTotal} · Flaws ${projected.flawPointTotal}/7 · Net ${projected.netCharacterCreationCost}`,
    excess: projected.excessFlawPoints,
  };
}

export function MeritFlawCatalog({
  totals,
  selectedDefinitionIds,
  onAdd,
  onViewSelected,
  definitions = meritFlawCatalog,
}: {
  totals: MeritFlawTotals;
  selectedDefinitionIds: Set<string>;
  onAdd: (definition: MeritFlawDefinition, cost: number) => void;
  onViewSelected: (definitionId: string) => void;
  definitions?: readonly MeritFlawDefinition[];
}) {
  const [filters, setFilters] =
    useState<MeritFlawCatalogFilters>(defaultFilters);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [chosenCosts, setChosenCosts] = useState<Record<string, number>>({});

  const results = useMemo(
    () => filterAndSortMeritFlaws([...definitions], filters),
    [definitions, filters],
  );
  const activeFilterCount = [
    filters.search,
    filters.kind !== 'all',
    filters.category !== 'all',
    filters.bookId,
    filters.cost !== 'all',
  ].filter(Boolean).length;

  const updateFilter = <Key extends keyof MeritFlawCatalogFilters>(
    key: Key,
    value: MeritFlawCatalogFilters[Key],
  ) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="merit-flaw-catalog" aria-label="Merits and Flaws catalog">
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span>Search catalog</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Name or description"
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </label>
        <details className="catalog-filters">
          <summary>
            Filters
            {activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}
          </summary>
          <div className="catalog-filters__grid">
            <label>
              <span>Type</span>
              <select
                value={filters.kind}
                onChange={(event) =>
                  updateFilter(
                    'kind',
                    event.target.value as MeritFlawCatalogFilters['kind'],
                  )
                }
              >
                <option value="all">All types</option>
                <option value="merit">Merits</option>
                <option value="flaw">Flaws</option>
              </select>
            </label>
            <label>
              <span>Category</span>
              <select
                value={filters.category}
                onChange={(event) =>
                  updateFilter(
                    'category',
                    event.target.value as MeritFlawCatalogFilters['category'],
                  )
                }
              >
                <option value="all">All categories</option>
                {meritFlawCategories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Source book</span>
              <select
                value={filters.bookId}
                onChange={(event) => updateFilter('bookId', event.target.value)}
              >
                <option value="">All books</option>
                {meritFlawBooks.map((book) => (
                  <option value={book.id} key={book.id}>
                    {book.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Point cost</span>
              <select
                value={filters.cost}
                onChange={(event) =>
                  updateFilter(
                    'cost',
                    event.target.value === 'all'
                      ? 'all'
                      : Number(event.target.value),
                  )
                }
              >
                <option value="all">All costs</option>
                {meritFlawCosts.map((cost) => (
                  <option value={cost} key={cost}>
                    {cost}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select
                value={filters.sort}
                onChange={(event) =>
                  updateFilter(
                    'sort',
                    event.target.value as MeritFlawCatalogFilters['sort'],
                  )
                }
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="cost-asc">Lowest cost first</option>
                <option value="cost-desc">Highest cost first</option>
              </select>
            </label>
            <button
              type="button"
              className="small-button small-button--quiet"
              onClick={() => setFilters(defaultFilters)}
            >
              Clear all filters
            </button>
          </div>
        </details>
      </div>

      <p className="catalog-result-count" role="status">
        {results.length} of {meritFlawCatalog.length} entries
      </p>

      <div className="catalog-results">
        {results.map((definition) => {
          const isExpanded = expanded.has(definition.id);
          const alreadySelected = selectedDefinitionIds.has(definition.id);
          const fixedCost =
            definition.allowedCosts.length === 1
              ? definition.allowedCosts[0]
              : undefined;
          const chosenCost = fixedCost ?? chosenCosts[definition.id];
          const projection = chosenCost
            ? projectedText(definition, chosenCost, totals)
            : null;
          const detailId = `catalog-detail-${definition.id}`;

          return (
            <article className="catalog-card" key={definition.id}>
              <div className="catalog-card__heading">
                <div>
                  <div className="catalog-card__labels">
                    <span
                      className={`kind-badge kind-badge--${definition.kind}`}
                    >
                      {definition.kind}
                    </span>
                    <span>{definition.category}</span>
                  </div>
                  <h4>{definition.name}</h4>
                </div>
                <div className="catalog-card__header-actions">
                  <DescriptionPreview
                    name={definition.name}
                    description={definition.description}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`${
                      isExpanded ? 'Collapse' : 'Expand'
                    } description for ${definition.name}`}
                    aria-expanded={isExpanded}
                    aria-controls={detailId}
                    onClick={() =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (next.has(definition.id)) {
                          next.delete(definition.id);
                        } else {
                          next.add(definition.id);
                        }
                        return next;
                      })
                    }
                  >
                    {isExpanded ? '⌃' : '⌄'}
                  </button>
                </div>
              </div>

              <p className="catalog-card__source">
                {formatMeritFlawSources(definition)}
              </p>
              <p className="catalog-card__cost">
                {definition.kind === 'merit' ? 'Cost' : 'Benefit'}:{' '}
                {formatAllowedCosts(definition)}
              </p>

              {definition.allowedCosts.length > 1 ? (
                <label className="catalog-card__cost-select">
                  <span>Choose cost</span>
                  <select
                    value={chosenCosts[definition.id] ?? ''}
                    onChange={(event) =>
                      setChosenCosts((current) => ({
                        ...current,
                        [definition.id]: Number(event.target.value),
                      }))
                    }
                  >
                    <option value="">Select a legal cost</option>
                    {definition.allowedCosts.map((cost) => (
                      <option value={cost} key={cost}>
                        {cost} point{cost === 1 ? '' : 's'}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {isExpanded ? (
                <div className="catalog-card__details" id={detailId}>
                  <p>{definition.description}</p>
                  <dl>
                    <div>
                      <dt>Type</dt>
                      <dd>{definition.kind}</dd>
                    </div>
                    <div>
                      <dt>Category</dt>
                      <dd>{definition.category}</dd>
                    </div>
                    <div>
                      <dt>Allowed points</dt>
                      <dd>{formatAllowedCosts(definition)}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              {projection ? (
                <div className="catalog-card__projection">
                  <span>Current totals</span>
                  <strong>
                    Merits {totals.meritPointTotal} · Flaws{' '}
                    {totals.flawPointTotal}/7 · Net{' '}
                    {totals.netCharacterCreationCost}
                  </strong>
                  <span>{projection.label}</span>
                  <strong>{projection.compact}</strong>
                  {projection.excess > 0 ? (
                    <em>
                      {projection.excess} points exceed the standard creation
                      benefit.
                    </em>
                  ) : null}
                </div>
              ) : null}

              {definition.requiresReview ? (
                <p className="catalog-card__review">
                  Requires review: the source does not provide a point cost.
                </p>
              ) : null}

              <button
                type="button"
                className={
                  alreadySelected ? 'secondary-button' : 'primary-button'
                }
                disabled={
                  !alreadySelected &&
                  (definition.requiresReview || chosenCost === undefined)
                }
                onClick={() => {
                  if (alreadySelected) {
                    onViewSelected(definition.id);
                  } else if (chosenCost !== undefined) {
                    onAdd(definition, chosenCost);
                  }
                }}
              >
                {alreadySelected ? 'View selected' : 'Add'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
