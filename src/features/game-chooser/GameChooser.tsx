import { useEffect, useMemo, useState } from 'react';
import type { GameSystemRegistry } from '../../games/game-system-registry';
import type { ModuleRegistry } from '../../modules/registry/module-registry';
import {
  buildGameChooserEntries,
  creationSupportLabels,
  matchingLabels,
  normalizeGameSearch,
  type GameChooserEntry,
  type GameCreationSupport,
} from './game-chooser-catalog';
import {
  gameChooserPreferenceEvent,
  readGameChooserPreferences,
  writeGameChooserPreferences,
  type GameChooserPreferences,
} from './game-chooser-preferences';

const supportOrder: Readonly<Record<GameCreationSupport, number>> = {
  'builder-and-sheet': 0,
  'builder-only': 1,
  'sheet-only': 2,
};

function compareNames(a: GameChooserEntry, b: GameChooserEntry) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

function GameCard({
  entry,
  query,
  hidden,
  favorite,
  reorderEnabled,
  firstFavorite,
  lastFavorite,
  onChoose,
  onVisibilityChange,
  onFavoriteChange,
  onMove,
  onDragStart,
  onDrop,
}: {
  entry: GameChooserEntry;
  query: string;
  hidden: boolean;
  favorite: boolean;
  reorderEnabled: boolean;
  firstFavorite: boolean;
  lastFavorite: boolean;
  onChoose: () => void;
  onVisibilityChange: () => void;
  onFavoriteChange: () => void;
  onMove: (direction: 'earlier' | 'later') => void;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  const matches = matchingLabels(entry, query);
  return (
    <article
      className="game-system-card game-chooser-card"
      draggable={reorderEnabled}
      onDragStart={(event) => {
        if (!reorderEnabled) return;
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={(event) => {
        if (reorderEnabled) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!reorderEnabled) return;
        event.preventDefault();
        onDrop();
      }}
    >
      <div className="game-chooser-card__controls">
        {reorderEnabled ? (
          <span className="game-chooser-card__reorder">
            <button
              type="button"
              aria-label={`Move ${entry.name} earlier`}
              title="Move earlier"
              disabled={firstFavorite}
              onClick={() => onMove('earlier')}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${entry.name} later`}
              title="Move later"
              disabled={lastFavorite}
              onClick={() => onMove('later')}
            >
              ↓
            </button>
            <span aria-hidden="true" title="Drag to reorder">
              ↕
            </span>
          </span>
        ) : null}
        <button
          type="button"
          className="game-chooser-card__icon"
          aria-label={`${favorite ? 'Remove' : 'Add'} favorite: ${entry.name}`}
          aria-pressed={favorite}
          title={favorite ? 'Remove favorite' : 'Add favorite'}
          onClick={onFavoriteChange}
        >
          <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
        </button>
        <button
          type="button"
          className="game-chooser-card__icon"
          aria-label={`${hidden ? 'Restore' : 'Hide'} game: ${entry.name}`}
          aria-pressed={hidden}
          title={hidden ? 'Restore game' : 'Hide game'}
          onClick={onVisibilityChange}
        >
          <span aria-hidden="true">{hidden ? '↩' : '◉'}</span>
        </button>
      </div>
      <div className="game-chooser-card__badges">
        <span className="sheet-badge">{entry.engine.label}</span>
        <span className="sheet-badge">
          {creationSupportLabels[entry.creationSupport]}
        </span>
      </div>
      <h2>{entry.name}</h2>
      <p>{entry.description}</p>
      {matches.length ? (
        <p className="game-chooser-card__matches">
          <strong>Matches:</strong> {matches.join(', ')}
        </p>
      ) : null}
      <div className="game-chooser-card__actions">
        {!hidden ? (
          <button className="primary-button" onClick={onChoose}>
            Choose {entry.shortName}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function GameChooser({
  registry,
  moduleRegistry,
  onNavigate,
}: {
  registry: GameSystemRegistry;
  moduleRegistry?: ModuleRegistry;
  onNavigate: (path: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [draggedFavoriteId, setDraggedFavoriteId] = useState<string | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState('');
  const [preferences, setPreferences] = useState(readGameChooserPreferences);
  const entries = buildGameChooserEntries(registry, moduleRegistry);

  useEffect(() => {
    const refresh = () => setPreferences(readGameChooserPreferences());
    window.addEventListener('storage', refresh);
    window.addEventListener(gameChooserPreferenceEvent, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(gameChooserPreferenceEvent, refresh);
    };
  }, []);

  const updatePreferences = (next: GameChooserPreferences) => {
    const saved = writeGameChooserPreferences(next);
    setPreferences(saved);
  };
  const hiddenSet = useMemo(
    () => new Set(preferences.hiddenIds),
    [preferences.hiddenIds],
  );
  const favoriteSet = useMemo(
    () => new Set(preferences.favoriteIds),
    [preferences.favoriteIds],
  );
  const normalizedQuery = normalizeGameSearch(query);
  const filtered = entries.filter((entry) => {
    if (showHidden !== hiddenSet.has(entry.id)) return false;
    if (normalizedQuery && !entry.searchText.includes(normalizedQuery))
      return false;
    if (
      preferences.capability === 'builder' &&
      entry.creationSupport === 'sheet-only'
    )
      return false;
    if (
      preferences.capability === 'sheet-only' &&
      entry.creationSupport !== 'sheet-only'
    )
      return false;
    return true;
  });
  const sortEntries = (values: GameChooserEntry[]) =>
    [...values].sort((a, b) => {
      if (preferences.sort === 'name-desc') return compareNames(b, a);
      if (preferences.sort === 'engine')
        return (
          a.engine.label.localeCompare(b.engine.label) || compareNames(a, b)
        );
      if (preferences.sort === 'creation-support')
        return (
          supportOrder[a.creationSupport] - supportOrder[b.creationSupport] ||
          compareNames(a, b)
        );
      return compareNames(a, b);
    });
  const normallySorted = sortEntries(filtered);
  const favoriteEntries =
    !normalizedQuery && !showHidden
      ? preferences.favoriteIds
          .map((id) => filtered.find((entry) => entry.id === id))
          .filter((entry): entry is GameChooserEntry => Boolean(entry))
      : [];
  const favoriteEntrySet = new Set(favoriteEntries.map(({ id }) => id));
  const sorted = normalizedQuery
    ? normallySorted
    : [
        ...favoriteEntries,
        ...normallySorted.filter(({ id }) => !favoriteEntrySet.has(id)),
      ];
  const remainingEntries = normallySorted.filter(
    ({ id }) => !favoriteEntrySet.has(id),
  );
  const rawGroups: ReadonlyArray<readonly [string, GameChooserEntry[]]> =
    favoriteEntries.length
      ? [
          ['Favorites', favoriteEntries],
          ...(preferences.sort === 'engine'
            ? Object.entries(
                remainingEntries.reduce<Record<string, GameChooserEntry[]>>(
                  (result, entry) => {
                    (result[entry.engine.label] ??= []).push(entry);
                    return result;
                  },
                  {},
                ),
              )
            : [['All other games', remainingEntries] as const]),
        ]
      : preferences.sort === 'engine'
        ? Object.entries(
            normallySorted.reduce<Record<string, GameChooserEntry[]>>(
              (result, entry) => {
                (result[entry.engine.label] ??= []).push(entry);
                return result;
              },
              {},
            ),
          )
        : [['', normallySorted] as const];
  const groups = rawGroups.filter(([, groupEntries]) => groupEntries.length);
  const presentHiddenCount = entries.filter(({ id }) =>
    hiddenSet.has(id),
  ).length;

  const toggleHidden = (entry: GameChooserEntry) => {
    const next = new Set(preferences.hiddenIds);
    if (next.has(entry.id)) {
      next.delete(entry.id);
      if (!next.size) setShowHidden(false);
    } else next.add(entry.id);
    updatePreferences({ ...preferences, hiddenIds: [...next] });
  };

  const toggleFavorite = (entry: GameChooserEntry) => {
    const favoriteIds = preferences.favoriteIds.includes(entry.id)
      ? preferences.favoriteIds.filter((id) => id !== entry.id)
      : [...preferences.favoriteIds, entry.id];
    updatePreferences({ ...preferences, favoriteIds });
  };

  const reorderFavorite = (entryId: string, direction: 'earlier' | 'later') => {
    const visibleIds = favoriteEntries.map(({ id }) => id);
    const index = visibleIds.indexOf(entryId);
    const target = direction === 'earlier' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= visibleIds.length) return;
    const favoriteIds = [...preferences.favoriteIds];
    const left = favoriteIds.indexOf(visibleIds[index]);
    const right = favoriteIds.indexOf(visibleIds[target]);
    [favoriteIds[left], favoriteIds[right]] = [
      favoriteIds[right],
      favoriteIds[left],
    ];
    updatePreferences({ ...preferences, favoriteIds });
    setAnnouncement(
      `${entryId} moved ${direction === 'earlier' ? 'earlier' : 'later'}.`,
    );
  };

  const dropFavorite = (targetId: string) => {
    if (!draggedFavoriteId || draggedFavoriteId === targetId) return;
    const favoriteIds = preferences.favoriteIds.filter(
      (id) => id !== draggedFavoriteId,
    );
    const targetIndex = favoriteIds.indexOf(targetId);
    favoriteIds.splice(targetIndex, 0, draggedFavoriteId);
    updatePreferences({ ...preferences, favoriteIds });
    setAnnouncement(`${draggedFavoriteId} reordered.`);
    setDraggedFavoriteId(null);
  };

  return (
    <>
      <section
        className="game-chooser-controls"
        aria-label="Game catalog controls"
      >
        <label className="sheet-field game-chooser-search">
          <span className="sheet-field__label">Search games</span>
          <span className="game-chooser-search__input">
            <input
              type="search"
              value={query}
              placeholder="Try Solar, Ghoul, Keeper, or an engine"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setQuery('')}
              >
                Clear
              </button>
            ) : null}
          </span>
        </label>
        <label className="sheet-field">
          <span className="sheet-field__label">Sort games</span>
          <select
            aria-label="Sort games"
            value={preferences.sort}
            onChange={(event) =>
              updatePreferences({
                ...preferences,
                sort: event.target.value as GameChooserPreferences['sort'],
              })
            }
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="engine">Game engine</option>
            <option value="creation-support">Creation support</option>
          </select>
        </label>
        <label className="sheet-field">
          <span className="sheet-field__label">Creation support</span>
          <select
            aria-label="Creation support filter"
            value={preferences.capability}
            onChange={(event) =>
              updatePreferences({
                ...preferences,
                capability: event.target
                  .value as GameChooserPreferences['capability'],
              })
            }
          >
            <option value="all">All games</option>
            <option value="builder">Builder available</option>
            <option value="sheet-only">Sheet-only</option>
          </select>
        </label>
        {preferences.hiddenIds.length ? (
          <button
            type="button"
            className={showHidden ? 'primary-button' : 'secondary-button'}
            aria-pressed={showHidden}
            onClick={() => setShowHidden((value) => !value)}
          >
            {showHidden
              ? 'Show available games'
              : `Show hidden games (${presentHiddenCount})`}
          </button>
        ) : null}
      </section>

      <div className="game-chooser-results" aria-live="polite">
        <p>
          {sorted.length} {sorted.length === 1 ? 'game' : 'games'} shown
          {showHidden ? ' in hidden games' : ''}.
        </p>
        {showHidden ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              updatePreferences({ ...preferences, hiddenIds: [] });
              setShowHidden(false);
            }}
          >
            Restore all hidden games
          </button>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {!sorted.length ? (
        <section className="sheet-empty-state game-chooser-empty">
          <h2>{showHidden ? 'No hidden games match' : 'No games match'}</h2>
          <p>
            {showHidden
              ? 'Clear the search or filter, or return to available games.'
              : entries.length > 0 &&
                  entries.every(({ id }) => hiddenSet.has(id))
                ? 'Every installed game is hidden. Open hidden games to restore one.'
                : 'Clear the search or choose a different creation filter.'}
          </p>
          {query ? (
            <button className="secondary-button" onClick={() => setQuery('')}>
              Clear search
            </button>
          ) : null}
        </section>
      ) : (
        groups.map(([engine, groupEntries]) => (
          <section className="game-chooser-group" key={engine || 'all-games'}>
            {engine ? (
              <h2 className="game-chooser-group__title">{engine}</h2>
            ) : null}
            <div className="game-system-grid">
              {groupEntries.map((entry) => (
                <GameCard
                  key={entry.id}
                  entry={entry}
                  query={query}
                  hidden={showHidden}
                  favorite={favoriteSet.has(entry.id)}
                  reorderEnabled={
                    engine === 'Favorites' && !normalizedQuery && !showHidden
                  }
                  firstFavorite={entry.id === favoriteEntries[0]?.id}
                  lastFavorite={
                    entry.id === favoriteEntries[favoriteEntries.length - 1]?.id
                  }
                  onChoose={() => onNavigate(entry.route)}
                  onVisibilityChange={() => toggleHidden(entry)}
                  onFavoriteChange={() => toggleFavorite(entry)}
                  onMove={(direction) => reorderFavorite(entry.id, direction)}
                  onDragStart={() => setDraggedFavoriteId(entry.id)}
                  onDrop={() => dropFavorite(entry.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
