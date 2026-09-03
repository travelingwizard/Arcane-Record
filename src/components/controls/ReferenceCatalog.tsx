import { useMemo, useState } from 'react';
import { matchesReferenceSearch } from '../../systems/mage-m20/reference/magick';

export interface ReferenceCatalogEntry {
  id: string;
  name: string;
  family: string;
  summary: string;
  citation: string;
  reviewStatus: 'unverified' | 'verified';
  contentLabel: 'standard' | 'mature';
}

function familyLabel(value: string) {
  return value
    .split('-')
    .map((part) => `${part[0]?.toLocaleUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

export function ReferenceCatalog<Entry extends ReferenceCatalogEntry>({
  label,
  entries,
  selectedDefinitionIds,
  onAdd,
  getMeta,
  canAdd,
}: {
  label: string;
  entries: readonly Entry[];
  selectedDefinitionIds: Set<string>;
  onAdd: (entry: Entry) => void;
  getMeta?: (entry: Entry) => string;
  canAdd?: (entry: Entry) => boolean;
}) {
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('all');
  const [includeMature, setIncludeMature] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const families = useMemo(
    () => [...new Set(entries.map((entry) => entry.family))].sort(),
    [entries],
  );
  const results = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesReferenceSearch(entry, search) &&
          (family === 'all' || entry.family === family) &&
          (includeMature || entry.contentLabel !== 'mature'),
      ),
    [entries, family, includeMature, search],
  );

  return (
    <div
      className="reference-catalog"
      aria-label={`${label} reference catalog`}
    >
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span>Search {label.toLocaleLowerCase()}</span>
          <input
            type="search"
            value={search}
            placeholder="Name, description, or source"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          <span>Family</span>
          <select
            value={family}
            onChange={(event) => setFamily(event.target.value)}
          >
            <option value="all">All standard families</option>
            {families.map((option) => (
              <option value={option} key={option}>
                {familyLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="catalog-mature-toggle">
          <input
            type="checkbox"
            checked={includeMature}
            onChange={(event) => setIncludeMature(event.target.checked)}
          />
          <span>Include mature material</span>
        </label>
      </div>

      <p className="catalog-result-count" role="status">
        {results.length} of {entries.length} entries
      </p>

      <div className="catalog-results">
        {results.map((entry) => {
          const isExpanded = expanded.has(entry.id);
          const isSelected = selectedDefinitionIds.has(entry.id);
          const detailId = `${label
            .toLocaleLowerCase()
            .replace(/\s+/g, '-')}-${entry.id}-reference`;
          return (
            <article className="catalog-card" key={entry.id}>
              <div className="catalog-card__heading">
                <div>
                  <div className="catalog-card__labels">
                    <span className="kind-badge">
                      {familyLabel(entry.family)}
                    </span>
                    {entry.contentLabel === 'mature' ? (
                      <span>Mature</span>
                    ) : null}
                  </div>
                  <h4>{entry.name}</h4>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${
                    isExpanded ? 'Collapse' : 'Expand'
                  } reference for ${entry.name}`}
                  aria-expanded={isExpanded}
                  aria-controls={detailId}
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (next.has(entry.id)) {
                        next.delete(entry.id);
                      } else {
                        next.add(entry.id);
                      }
                      return next;
                    })
                  }
                >
                  {isExpanded ? '⌃' : '⌄'}
                </button>
              </div>
              <p className="catalog-card__source">{entry.citation}</p>
              <p>
                {entry.reviewStatus === 'verified'
                  ? 'Source verified'
                  : 'Unverified reference preview'}
                {canAdd && !canAdd(entry) ? ' · Source unavailable' : ''}
              </p>
              {getMeta ? (
                <p className="catalog-card__cost">{getMeta(entry)}</p>
              ) : null}
              {isExpanded ? (
                <div className="catalog-card__details" id={detailId}>
                  <p>{entry.summary}</p>
                  {entry.reviewStatus === 'unverified' ? (
                    <p className="catalog-card__review">
                      Reference preview: citation and wording still need source
                      verification.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                className={isSelected ? 'secondary-button' : 'primary-button'}
                disabled={isSelected || (canAdd ? !canAdd(entry) : false)}
                onClick={() => onAdd(entry)}
              >
                {isSelected ? 'Selected' : 'Add'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
