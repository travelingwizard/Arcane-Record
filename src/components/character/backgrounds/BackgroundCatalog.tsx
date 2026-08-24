import { useMemo, useState } from 'react';
import {
  filterAndSortBackgrounds,
  projectBackgroundTotals,
  type BackgroundCatalogFilters,
  type BackgroundTotals,
} from '../../../systems/mage-m20/background-rules';
import {
  backgroundBooks,
  backgroundCatalog,
  formatBackgroundRatingRange,
  formatBackgroundRestriction,
  formatBackgroundSources,
  type BackgroundDefinition,
} from '../../../systems/mage-m20/reference/backgrounds';
import { DescriptionPreview } from '../merits-flaws/DescriptionPreview';

const defaultFilters: BackgroundCatalogFilters = {
  search: '',
  bookId: '',
  maximum: 'all',
  costPerDot: 'all',
  restriction: 'all',
  repeatability: 'all',
  sort: 'name-asc',
};

export function BackgroundCatalog({
  totals,
  selectedDefinitionIds,
  onAdd,
  definitions = backgroundCatalog,
}: {
  totals: BackgroundTotals;
  selectedDefinitionIds: Set<string>;
  onAdd: (definition: BackgroundDefinition) => void;
  definitions?: readonly BackgroundDefinition[];
}) {
  const [filters, setFilters] =
    useState<BackgroundCatalogFilters>(defaultFilters);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const results = useMemo(
    () => filterAndSortBackgrounds([...definitions], filters),
    [definitions, filters],
  );
  const activeFilterCount = [
    filters.search,
    filters.bookId,
    filters.maximum !== 'all',
    filters.costPerDot !== 'all',
    filters.restriction !== 'all',
    filters.repeatability !== 'all',
  ].filter(Boolean).length;

  const updateFilter = <Key extends keyof BackgroundCatalogFilters>(
    key: Key,
    value: BackgroundCatalogFilters[Key],
  ) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="background-catalog" aria-label="Background catalog">
      <div className="background-catalog__toolbar">
        <label className="catalog-search">
          <span>Search Backgrounds</span>
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
          <div className="background-filters__grid">
            <label>
              <span>Source book</span>
              <select
                value={filters.bookId}
                onChange={(event) => updateFilter('bookId', event.target.value)}
              >
                <option value="">All books</option>
                {backgroundBooks.map((book) => (
                  <option value={book.id} key={book.id}>
                    {book.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Maximum rating</span>
              <select
                value={filters.maximum}
                onChange={(event) =>
                  updateFilter(
                    'maximum',
                    event.target.value as BackgroundCatalogFilters['maximum'],
                  )
                }
              >
                <option value="all">All ranges</option>
                <option value="standard">Standard maximum</option>
                <option value="extended">Supports above five</option>
              </select>
            </label>
            <label>
              <span>Points per dot</span>
              <select
                value={filters.costPerDot}
                onChange={(event) =>
                  updateFilter(
                    'costPerDot',
                    event.target.value === 'all'
                      ? 'all'
                      : (Number(event.target.value) as 1 | 2),
                  )
                }
              >
                <option value="all">All costs</option>
                <option value="1">1 point per dot</option>
                <option value="2">2 points per dot</option>
              </select>
            </label>
            <label>
              <span>Restriction</span>
              <select
                value={filters.restriction}
                onChange={(event) =>
                  updateFilter(
                    'restriction',
                    event.target
                      .value as BackgroundCatalogFilters['restriction'],
                  )
                }
              >
                <option value="all">All restrictions</option>
                <option value="none">No stated restriction</option>
                <option value="technocracy-only">Technocracy only</option>
                <option value="shamanic-character">Shamanic character</option>
                <option value="storyteller-approval">
                  Storyteller approval
                </option>
                <option value="other">Other restriction</option>
              </select>
            </label>
            <label>
              <span>Instances</span>
              <select
                value={filters.repeatability}
                onChange={(event) =>
                  updateFilter(
                    'repeatability',
                    event.target
                      .value as BackgroundCatalogFilters['repeatability'],
                  )
                }
              >
                <option value="all">All entries</option>
                <option value="single">Single instance</option>
                <option value="multiple">Multiple instances</option>
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select
                value={filters.sort}
                onChange={(event) =>
                  updateFilter(
                    'sort',
                    event.target.value as BackgroundCatalogFilters['sort'],
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
        {results.length} of {backgroundCatalog.length} entries
      </p>

      <div className="background-catalog__results">
        {results.map((definition) => {
          const isExpanded = expanded.has(definition.id);
          const detailId = `background-catalog-detail-${definition.id}`;
          const selectedSingle =
            selectedDefinitionIds.has(definition.id) &&
            !definition.canBeSelectedMultipleTimes;
          const projected = projectBackgroundTotals(totals, definition);
          return (
            <article className="background-catalog-card" key={definition.id}>
              <div className="background-catalog-card__heading">
                <div>
                  <h4>{definition.name}</h4>
                  {definition.aliases.length > 0 ? (
                    <p>Also known as {definition.aliases.join(' / ')}</p>
                  ) : null}
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
              <div className="background-catalog-card__facts">
                <span>Rating: {formatBackgroundRatingRange(definition)}</span>
                <span>
                  Cost per dot: {definition.creationPointCostPerDot} Background{' '}
                  {definition.creationPointCostPerDot === 1
                    ? 'point'
                    : 'points'}
                </span>
              </div>
              {definition.restrictions.map((restriction) => (
                <p
                  className="background-restriction"
                  key={restriction}
                  role="note"
                >
                  {formatBackgroundRestriction(restriction)}.
                </p>
              ))}
              <p className="catalog-card__source">
                {formatBackgroundSources(definition)}
              </p>

              {isExpanded ? (
                <div className="background-catalog-card__details" id={detailId}>
                  <p>{definition.description}</p>
                  <dl>
                    <div>
                      <dt>Rating range</dt>
                      <dd>{formatBackgroundRatingRange(definition)}</dd>
                    </div>
                    <div>
                      <dt>Above five</dt>
                      <dd>
                        {definition.supportsRatingsAboveFive
                          ? 'Supported with Storyteller approval'
                          : 'Not supported'}
                      </dd>
                    </div>
                    <div>
                      <dt>Initial creation cost</dt>
                      <dd>
                        1 dot × {definition.creationPointCostPerDot} ={' '}
                        {definition.creationPointCostPerDot}{' '}
                        {definition.creationPointCostPerDot === 1
                          ? 'point'
                          : 'points'}
                      </dd>
                    </div>
                    <div>
                      <dt>Instances</dt>
                      <dd>
                        {definition.canBeSelectedMultipleTimes
                          ? 'Multiple supported'
                          : 'One by default'}
                      </dd>
                    </div>
                    <div>
                      <dt>Pooling</dt>
                      <dd>
                        {definition.canBePooled
                          ? 'May be marked as pooled'
                          : 'Not stated'}
                      </dd>
                    </div>
                  </dl>
                  <div className="background-projection">
                    <span>Projected total before adding</span>
                    <strong>
                      Current: {totals.pointsSpent}/{totals.standardAllowance}{' '}
                      points
                    </strong>
                    <strong>
                      After adding {definition.name} 1: {projected.pointsSpent}/
                      {projected.standardAllowance} points
                    </strong>
                    <span>
                      {projected.pointsOver > 0
                        ? `${projected.pointsOver} points over the standard allowance`
                        : `${projected.pointsRemaining} points remaining`}
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                className="primary-button"
                disabled={selectedSingle}
                onClick={() => onAdd(definition)}
              >
                {selectedSingle ? 'Added' : 'Add'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
