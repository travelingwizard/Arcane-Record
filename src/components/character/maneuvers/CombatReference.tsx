import { useMemo, useState } from 'react';
import {
  combatManeuverCatalog,
  matchesManeuverSearch,
  type CombatManeuverCategory,
} from '../../../systems/mage-m20/reference/maneuvers';
import type { CustomCombatManeuver } from '../../../types/character';

const categoryLabels: Record<CombatManeuverCategory, string> = {
  general: 'General',
  defensive: 'Defensive',
  'close-combat': 'Close Combat',
  ranged: 'Ranged',
};

export function CombatReference({
  favorites,
  customManeuvers,
  onToggleFavorite,
  onAddCustom,
  onUpdateCustom,
  onRemoveCustom,
}: {
  favorites: string[];
  customManeuvers: CustomCombatManeuver[];
  onToggleFavorite: (maneuverId: string) => void;
  onAddCustom: (name: string, description: string) => string | null;
  onUpdateCustom: (
    maneuverId: string,
    update: Partial<
      Pick<CustomCombatManeuver, 'name' | 'description' | 'notes'>
    >,
  ) => void;
  onRemoveCustom: (maneuverId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | CombatManeuverCategory>(
    'all',
  );
  const [favoritesFirst, setFavoritesFirst] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);
  const canAddCustom =
    customName.trim().length > 0 && customDescription.trim().length > 0;

  const entries = useMemo(() => {
    const catalogEntries = combatManeuverCatalog
      .filter(
        (entry) =>
          (category === 'all' || entry.category === category) &&
          matchesManeuverSearch(entry, search),
      )
      .map((entry) => ({ ...entry, isCustom: false as const }));
    const customEntries =
      category === 'all'
        ? customManeuvers
            .filter((entry) =>
              matchesManeuverSearch(
                {
                  name: entry.name,
                  summary: entry.description,
                  notes: entry.notes,
                },
                search,
              ),
            )
            .map((entry) => ({
              ...entry,
              summary: entry.description,
              citation: 'Custom combat reference',
              category: 'general' as const,
              isCustom: true as const,
            }))
        : [];
    const combined = [...customEntries, ...catalogEntries];
    return favoritesFirst
      ? combined.sort(
          (left, right) =>
            Number(favoriteIds.has(right.id)) -
              Number(favoriteIds.has(left.id)) ||
            left.name.localeCompare(right.name),
        )
      : combined;
  }, [category, customManeuvers, favoriteIds, favoritesFirst, search]);

  return (
    <div className="maneuver-panel">
      <div className="maneuver-custom-adder">
        <label>
          <span>Custom combat maneuver name</span>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <label>
          <span>Custom combat description</span>
          <input
            value={customDescription}
            onChange={(event) => setCustomDescription(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!canAddCustom}
          onClick={() => {
            const id = onAddCustom(customName, customDescription);
            if (id) {
              setCustomName('');
              setCustomDescription('');
            }
          }}
        >
          Add custom combat maneuver
        </button>
      </div>

      <div className="maneuver-catalog-toolbar">
        <label>
          <span>Search combat maneuvers</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          <span>Category</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as 'all' | CombatManeuverCategory)
            }
          >
            <option value="all">All categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="maneuver-check-row">
          <input
            type="checkbox"
            checked={favoritesFirst}
            onChange={(event) => setFavoritesFirst(event.target.checked)}
          />
          <span>Favorites first</span>
        </label>
      </div>

      <p className="catalog-result-count" role="status">
        {entries.length} maneuver{entries.length === 1 ? '' : 's'} shown
      </p>

      <div className="maneuver-card-grid">
        {entries.map((entry) => {
          const isExpanded = expanded.has(entry.id);
          const isFavorite = favoriteIds.has(entry.id);
          const detailsId = `combat-maneuver-${entry.id}-details`;
          return (
            <article className="maneuver-card" key={entry.id}>
              <div className="maneuver-card__heading">
                <div>
                  <div className="catalog-card__labels">
                    <span className="kind-badge">
                      {entry.isCustom
                        ? 'Custom'
                        : categoryLabels[entry.category]}
                    </span>
                    {isFavorite ? <span>Favorite</span> : null}
                  </div>
                  <h3>{entry.name || 'Untitled maneuver'}</h3>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${
                    isExpanded ? 'Collapse' : 'Expand'
                  } ${entry.name || 'Untitled maneuver'}`}
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
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
              <p className="maneuver-card__summary">{entry.summary}</p>
              <button
                type="button"
                className="small-button small-button--quiet"
                aria-pressed={isFavorite}
                onClick={() => onToggleFavorite(entry.id)}
              >
                {isFavorite ? '★ Remove favorite' : '☆ Favorite'}
              </button>

              {isExpanded ? (
                <div className="maneuver-card__details" id={detailsId}>
                  {entry.isCustom ? (
                    <>
                      <label>
                        <span>Name</span>
                        <input
                          value={entry.name}
                          onChange={(event) =>
                            onUpdateCustom(entry.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Description</span>
                        <textarea
                          rows={3}
                          value={entry.description}
                          onChange={(event) =>
                            onUpdateCustom(entry.id, {
                              description: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Notes</span>
                        <textarea
                          rows={3}
                          value={entry.notes}
                          onChange={(event) =>
                            onUpdateCustom(entry.id, {
                              notes: event.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="small-button small-button--danger"
                        onClick={() => onRemoveCustom(entry.id)}
                      >
                        Remove custom maneuver
                      </button>
                    </>
                  ) : (
                    <p>
                      Reference preview: description and citation are supplied
                      locally and do not automate a combat roll.
                    </p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
