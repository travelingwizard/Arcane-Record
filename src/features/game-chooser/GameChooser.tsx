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
  onChoose,
  onVisibilityChange,
}: {
  entry: GameChooserEntry;
  query: string;
  hidden: boolean;
  onChoose: () => void;
  onVisibilityChange: () => void;
}) {
  const matches = matchingLabels(entry, query);
  return (
    <article className="game-system-card game-chooser-card">
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
        <button
          className="secondary-button"
          aria-label={`${hidden ? 'Restore' : 'Hide'} game: ${entry.name}`}
          onClick={onVisibilityChange}
        >
          {hidden ? 'Restore game' : 'Hide game'}
        </button>
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
  const sorted = [...filtered].sort((a, b) => {
    if (preferences.sort === 'name-desc') return compareNames(b, a);
    if (preferences.sort === 'engine')
      return a.engine.label.localeCompare(b.engine.label) || compareNames(a, b);
    if (preferences.sort === 'creation-support')
      return (
        supportOrder[a.creationSupport] - supportOrder[b.creationSupport] ||
        compareNames(a, b)
      );
    return compareNames(a, b);
  });
  const groups =
    preferences.sort === 'engine'
      ? Object.entries(
          sorted.reduce<Record<string, GameChooserEntry[]>>((result, entry) => {
            (result[entry.engine.label] ??= []).push(entry);
            return result;
          }, {}),
        )
      : [['', sorted] as const];
  const presentHiddenCount = entries.filter(({ id }) =>
    hiddenSet.has(id),
  ).length;

  const toggleHidden = (entry: GameChooserEntry) => {
    const next = new Set(preferences.hiddenIds);
    if (next.has(entry.id)) next.delete(entry.id);
    else next.add(entry.id);
    updatePreferences({ ...preferences, hiddenIds: [...next] });
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
                  onChoose={() => onNavigate(entry.route)}
                  onVisibilityChange={() => toggleHidden(entry)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
