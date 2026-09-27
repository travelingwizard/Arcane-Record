import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameSystemRegistry } from '../../games/registry';
import { resolveCharacter } from '../../games/resolve-character';
import type { StoredCharacter } from '../../storage/stored-character';
import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import {
  createCharacterFileName,
  prepareImportedRecord,
  serializeCharacter,
} from '../import-export/character-files';
import { useAppearance } from '../settings/appearance-context';
import type { ModuleRegistry } from '../../modules/registry/module-registry';
import { MAGE20_SYSTEM_ID } from '../../games/mage20/character-adapter';
import { convertMageCharacterToModuleCopy } from '../../games/mage20/module/convert-character';
import { EXALTED1E_SYSTEM_ID } from '../../games/exalted1e/definitions';
import { convertExaltedCharacterToModuleCopy } from '../../games/exalted1e/module/convert-character';
import {
  characterLibraryPreferenceEvent,
  readCharacterLibraryPreferences,
  reconcileCharacterLibraryPreferences,
  removeCharacterLibraryPreference,
  writeCharacterLibraryPreferences,
  type CharacterLibraryPreferences,
} from './character-library-preferences';

function formatUpdatedAt(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function downloadRecord(record: StoredCharacter) {
  const blob = new Blob([serializeCharacter(record, 'json')], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createCharacterFileName(record, 'json');
  link.click();
  URL.revokeObjectURL(url);
}

export function ArcaneRecordLibrary({
  repository,
  moduleRegistry,
  onNavigate,
}: {
  repository: StoredCharacterRepository;
  moduleRegistry: ModuleRegistry;
  onNavigate: (path: string) => void;
}) {
  const { removeCharacterOverride } = useAppearance();
  const [records, setRecords] = useState<StoredCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState('all');
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [preferences, setPreferences] = useState(
    readCharacterLibraryPreferences,
  );
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setRecords(await repository.list());
      setError('');
    } catch {
      setError('The local character library could not be opened.');
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => void refresh(), [refresh]);

  useEffect(() => {
    const refreshPreferences = () =>
      setPreferences(readCharacterLibraryPreferences());
    window.addEventListener('storage', refreshPreferences);
    window.addEventListener(
      characterLibraryPreferenceEvent,
      refreshPreferences,
    );
    return () => {
      window.removeEventListener('storage', refreshPreferences);
      window.removeEventListener(
        characterLibraryPreferenceEvent,
        refreshPreferences,
      );
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    setPreferences((current) => {
      const next = reconcileCharacterLibraryPreferences(
        current,
        records.map(({ id }) => id),
      );
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      return writeCharacterLibraryPreferences(next);
    });
  }, [loading, records]);

  const updatePreferences = (next: CharacterLibraryPreferences) => {
    const reconciled = reconcileCharacterLibraryPreferences(
      next,
      records.map(({ id }) => id),
    );
    setPreferences(writeCharacterLibraryPreferences(reconciled));
  };

  const resolvedRecords = records.map((record) =>
    resolveCharacter(record, gameSystemRegistry, moduleRegistry),
  );
  const archivedSet = useMemo(
    () => new Set(preferences.archivedIds),
    [preferences.archivedIds],
  );
  const favoriteSet = useMemo(
    () => new Set(preferences.favoriteIds),
    [preferences.favoriteIds],
  );
  const resultById = new Map(
    resolvedRecords.map((result) => [result.record.id, result]),
  );
  const matchesFilters = (result: (typeof resolvedRecords)[number]) => {
    if (systemFilter !== 'all' && result.record.systemId !== systemFilter) {
      return false;
    }
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return true;
    const systemName =
      gameSystemRegistry.get(result.record.systemId)?.name ?? '';
    const text =
      result.status === 'available'
        ? result.system.getSearchText(result.character)
        : result.record.name;
    return `${result.record.name} ${systemName} ${text}`
      .toLocaleLowerCase()
      .includes(needle);
  };
  const filteredView = Boolean(query.trim()) || systemFilter !== 'all';
  const resultsForIds = (ids: readonly string[]) =>
    ids
      .map((id) => resultById.get(id))
      .filter((result): result is (typeof resolvedRecords)[number] =>
        Boolean(result),
      );
  const orderedResults = (ids: readonly string[]) =>
    resultsForIds(ids).filter(matchesFilters);
  const favoriteResults = orderedResults(preferences.favoriteOrderIds);
  const regularResults = orderedResults(preferences.regularOrderIds);
  const archivedResults = showAllCharacters
    ? orderedResults(preferences.archivedOrderIds)
    : [];
  const displayGroups = [
    {
      id: 'favorites' as const,
      title: 'Favorite Characters',
      records: favoriteResults,
    },
    {
      id: 'regular' as const,
      title: 'Other Characters',
      records: regularResults,
    },
    ...(showAllCharacters
      ? [
          {
            id: 'archived' as const,
            title: 'Archived Characters',
            records: archivedResults,
          },
        ]
      : []),
  ].filter(({ records: groupRecords }) => groupRecords.length);
  const filtered = displayGroups.flatMap(
    ({ records: groupRecords }) => groupRecords,
  );
  const recentRecords = [
    ...resultsForIds(preferences.favoriteOrderIds),
    ...resolvedRecords.filter(
      ({ record }) =>
        !archivedSet.has(record.id) && !favoriteSet.has(record.id),
    ),
  ].slice(0, 3);

  const duplicate = async (record: StoredCharacter) => {
    const result = resolveCharacter(record, gameSystemRegistry, moduleRegistry);
    if (result.status !== 'available') return;
    const timestamp = new Date().toISOString();
    const data = result.system.duplicateCharacter(result.character);
    await repository.create({
      ...record,
      id: crypto.randomUUID(),
      name: result.system.getDisplayName(data),
      createdAt: timestamp,
      updatedAt: timestamp,
      data,
      systemVersion: result.system.currentSchemaVersion,
    });
    await refresh();
  };

  const rename = async (record: StoredCharacter) => {
    const result = resolveCharacter(record, gameSystemRegistry, moduleRegistry);
    if (result.status !== 'available') return;
    const data = result.system.renameCharacter(result.character, renameValue);
    await repository.save({
      ...record,
      name:
        result.interpreter === 'module'
          ? renameValue
          : result.system.getDisplayName(data),
      data,
      systemVersion: result.system.currentSchemaVersion,
    });
    setRenamingId(null);
    await refresh();
  };

  const previewMageModule = async (record: StoredCharacter) => {
    const copy = convertMageCharacterToModuleCopy(record);
    await repository.create(copy);
    onNavigate(`/characters/${encodeURIComponent(copy.id)}`);
  };

  const previewExaltedModule = async (record: StoredCharacter) => {
    const copy = convertExaltedCharacterToModuleCopy(record);
    await repository.create(copy);
    onNavigate(`/characters/${encodeURIComponent(copy.id)}`);
  };

  const importFile = async (file: File) => {
    try {
      const record = prepareImportedRecord(
        await file.text(),
        file.name,
        gameSystemRegistry,
        undefined,
        undefined,
        moduleRegistry,
      );
      await repository.create(record);
      onNavigate(`/characters/${encodeURIComponent(record.id)}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The character file could not be imported.',
      );
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const toggleFavorite = (id: string) => {
    const favorite = favoriteSet.has(id);
    updatePreferences({
      ...preferences,
      favoriteIds: favorite
        ? preferences.favoriteIds.filter((value) => value !== id)
        : [...preferences.favoriteIds, id],
      favoriteOrderIds: favorite
        ? preferences.favoriteOrderIds.filter((value) => value !== id)
        : [...preferences.favoriteOrderIds, id],
      regularOrderIds: favorite
        ? [...preferences.regularOrderIds, id]
        : preferences.regularOrderIds.filter((value) => value !== id),
    });
  };

  const setArchived = (id: string, archived: boolean) => {
    updatePreferences({
      ...preferences,
      archivedIds: archived
        ? [...preferences.archivedIds, id]
        : preferences.archivedIds.filter((value) => value !== id),
      favoriteOrderIds: archived
        ? preferences.favoriteOrderIds.filter((value) => value !== id)
        : favoriteSet.has(id)
          ? [...preferences.favoriteOrderIds, id]
          : preferences.favoriteOrderIds,
      regularOrderIds: archived
        ? preferences.regularOrderIds.filter((value) => value !== id)
        : favoriteSet.has(id)
          ? preferences.regularOrderIds
          : [...preferences.regularOrderIds, id],
      archivedOrderIds: archived
        ? [...preferences.archivedOrderIds, id]
        : preferences.archivedOrderIds.filter((value) => value !== id),
    });
  };

  const groupOrderKey = (
    group: 'favorites' | 'regular' | 'archived',
  ): 'favoriteOrderIds' | 'regularOrderIds' | 'archivedOrderIds' =>
    group === 'favorites'
      ? 'favoriteOrderIds'
      : group === 'regular'
        ? 'regularOrderIds'
        : 'archivedOrderIds';

  const moveRecord = (
    id: string,
    group: 'favorites' | 'regular' | 'archived',
    direction: 'earlier' | 'later',
  ) => {
    const key = groupOrderKey(group);
    const order = [...preferences[key]];
    const index = order.indexOf(id);
    const target = direction === 'earlier' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    updatePreferences({ ...preferences, [key]: order });
    setAnnouncement(
      `${id} moved ${direction === 'earlier' ? 'earlier' : 'later'}.`,
    );
  };

  const dropRecord = (
    targetId: string,
    group: 'favorites' | 'regular' | 'archived',
  ) => {
    if (!draggedRecordId || draggedRecordId === targetId) return;
    const key = groupOrderKey(group);
    if (!preferences[key].includes(draggedRecordId)) return;
    const order = preferences[key].filter((id) => id !== draggedRecordId);
    const targetIndex = order.indexOf(targetId);
    order.splice(targetIndex, 0, draggedRecordId);
    updatePreferences({ ...preferences, [key]: order });
    setAnnouncement(`${draggedRecordId} reordered.`);
    setDraggedRecordId(null);
  };

  return (
    <main className="app-shell library-shell neutral-shell">
      <header className="library-hero">
        <div className="library-hero__mark" aria-hidden="true">
          ✦
        </div>
        <p className="eyebrow">Local character records</p>
        <h1>Arcane Record</h1>
        <p className="library-hero__lede">
          Keep characters from supported tabletop games in one private,
          browser-local library.
        </p>
        <div className="library-hero__actions">
          <button
            className="primary-button"
            onClick={() => onNavigate('/create')}
          >
            <span aria-hidden="true">＋</span> Create Character
          </button>
          <label className="secondary-button file-picker-inline">
            Import Character
            <input
              ref={inputRef}
              type="file"
              accept=".json,.yaml,.yml,.char,application/json,application/yaml,text/yaml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file);
              }}
            />
          </label>
          <button
            className="text-button"
            onClick={() => onNavigate('/settings')}
          >
            Settings
          </button>
          <button
            className="text-button"
            onClick={() => onNavigate('/module-builder')}
          >
            Module Builder
          </button>
          <button
            className="text-button"
            onClick={() => onNavigate('/modules')}
          >
            Module Library
          </button>
        </div>
        <p className="local-promise">
          <span aria-hidden="true">◉</span> Saved in this browser — never sent
          to an account or cloud service.
        </p>
      </header>

      {!loading && recentRecords.length > 0 ? (
        <section className="recent-records" aria-labelledby="recent-title">
          <p className="eyebrow">Continue where you left off</p>
          <h2 id="recent-title">Recent characters</h2>
          <div className="recent-records__list">
            {recentRecords.map((result) => {
              const displayName =
                result.status === 'available'
                  ? result.system.getDisplayName(result.character)
                  : result.record.name || 'Unavailable character';
              return (
                <button
                  key={result.record.id}
                  onClick={() =>
                    onNavigate(
                      `/characters/${encodeURIComponent(result.record.id)}`,
                    )
                  }
                >
                  <strong>{displayName}</strong>
                  <small>
                    {result.status === 'available'
                      ? result.system.shortName
                      : 'Unavailable game'}
                  </small>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="library-section" aria-labelledby="library-title">
        <div className="library-section__heading">
          <div>
            <p className="eyebrow">Your records</p>
            <h2 id="library-title">All characters</h2>
          </div>
          <div className="library-section__controls">
            <label className="library-show-all">
              <input
                type="checkbox"
                checked={showAllCharacters}
                onChange={(event) => setShowAllCharacters(event.target.checked)}
              />
              <span>Show All Characters</span>
            </label>
            <span className="record-count">{filtered.length} shown</span>
          </div>
        </div>
        {filteredView ? (
          <p className="library-reorder-notice">
            Clear search and choose All games to reorder characters.
          </p>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
        <div className="library-filters">
          <label>
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, game, or summary"
            />
          </label>
          <label>
            <span>Game</span>
            <select
              value={systemFilter}
              onChange={(event) => setSystemFilter(event.target.value)}
            >
              <option value="all">All games</option>
              {gameSystemRegistry.list().map((system) => (
                <option key={system.id} value={system.id}>
                  {system.shortName}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        ) : null}
        {loading ? (
          <p role="status">Opening your browser-local records…</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__glyph" aria-hidden="true">
              ◇
            </span>
            <h3>
              {!showAllCharacters &&
              !filteredView &&
              preferences.archivedIds.length
                ? 'All characters are archived'
                : 'No matching characters'}
            </h3>
            <p>
              {!showAllCharacters &&
              !filteredView &&
              preferences.archivedIds.length
                ? 'Select Show All Characters to restore an archived record.'
                : 'Create a character, import an Arcane Record file, or clear the current filters.'}
            </p>
          </div>
        ) : (
          <div className="character-library-groups">
            {displayGroups.map((group) => (
              <section
                className="character-library-group"
                aria-labelledby={`character-group-${group.id}`}
                key={group.id}
              >
                <h3 id={`character-group-${group.id}`}>{group.title}</h3>
                <div className="character-grid">
                  {group.records.map((result, index) => {
                    const record = result.record;
                    const displayName =
                      result.status === 'available'
                        ? result.system.getDisplayName(result.character)
                        : record.name || 'Unavailable character';
                    const summary =
                      result.status === 'available'
                        ? result.system.getSummary(result.character)
                        : result.message;
                    return (
                      <article
                        className={`character-card${
                          archivedSet.has(record.id) ? ' is-archived' : ''
                        }`}
                        key={record.id}
                        draggable={!filteredView}
                        onDragStart={(event) => {
                          if (filteredView) return;
                          event.dataTransfer.effectAllowed = 'move';
                          setDraggedRecordId(record.id);
                        }}
                        onDragOver={(event) => {
                          if (!filteredView) event.preventDefault();
                        }}
                        onDrop={(event) => {
                          if (filteredView) return;
                          event.preventDefault();
                          dropRecord(record.id, group.id);
                        }}
                      >
                        <div className="character-card__controls">
                          {!filteredView ? (
                            <span className="character-card__reorder">
                              <button
                                type="button"
                                aria-label={`Move ${displayName} earlier`}
                                title="Move earlier"
                                disabled={index === 0}
                                onClick={() =>
                                  moveRecord(record.id, group.id, 'earlier')
                                }
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                aria-label={`Move ${displayName} later`}
                                title="Move later"
                                disabled={index === group.records.length - 1}
                                onClick={() =>
                                  moveRecord(record.id, group.id, 'later')
                                }
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
                            className="character-card__favorite"
                            aria-label={`${
                              favoriteSet.has(record.id) ? 'Remove' : 'Add'
                            } favorite: ${displayName}`}
                            aria-pressed={favoriteSet.has(record.id)}
                            title={
                              favoriteSet.has(record.id)
                                ? 'Remove favorite'
                                : 'Add favorite'
                            }
                            onClick={() => toggleFavorite(record.id)}
                          >
                            <span aria-hidden="true">
                              {favoriteSet.has(record.id) ? '★' : '☆'}
                            </span>
                          </button>
                        </div>
                        <button
                          className="character-card__open"
                          onClick={() =>
                            onNavigate(
                              `/characters/${encodeURIComponent(record.id)}`,
                            )
                          }
                          aria-label={`Open ${displayName}`}
                        >
                          <span
                            className="character-card__monogram"
                            aria-hidden="true"
                          >
                            {displayName.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="character-card__copy">
                            <strong>{displayName}</strong>
                            <small>
                              {result.status === 'available'
                                ? result.system.shortName
                                : `Unavailable · ${record.systemId}`}
                            </small>
                            <small>{summary}</small>
                            {archivedSet.has(record.id) ? (
                              <span className="sheet-badge">Archived</span>
                            ) : null}
                          </span>
                          <span aria-hidden="true">→</span>
                        </button>
                        <div className="character-card__footer">
                          <small>
                            Updated {formatUpdatedAt(record.updatedAt)}
                          </small>
                          <div className="card-actions">
                            {result.status === 'available' ? (
                              <>
                                <button
                                  onClick={() => {
                                    setRenamingId(record.id);
                                    setRenameValue(displayName);
                                  }}
                                >
                                  Rename
                                </button>
                                <button onClick={() => void duplicate(record)}>
                                  Duplicate
                                </button>
                                {result.interpreter === 'legacy' &&
                                record.systemId === MAGE20_SYSTEM_ID ? (
                                  <button
                                    onClick={() =>
                                      void previewMageModule(record)
                                    }
                                  >
                                    Preview module copy
                                  </button>
                                ) : null}
                                {result.interpreter === 'legacy' &&
                                record.systemId === EXALTED1E_SYSTEM_ID ? (
                                  <button
                                    onClick={() =>
                                      void previewExaltedModule(record)
                                    }
                                  >
                                    Preview module copy
                                  </button>
                                ) : null}
                              </>
                            ) : null}
                            <button
                              onClick={() =>
                                void (async () => {
                                  try {
                                    if (
                                      result.status === 'available' &&
                                      result.interpreter === 'legacy' &&
                                      result.system.prepareExport
                                    ) {
                                      const data =
                                        await result.system.prepareExport(
                                          result.character,
                                          repository,
                                        );
                                      downloadRecord({
                                        ...record,
                                        data,
                                        systemVersion:
                                          result.system.currentSchemaVersion,
                                      });
                                    } else downloadRecord(record);
                                  } catch (failure) {
                                    setError(
                                      failure instanceof Error
                                        ? failure.message
                                        : 'Could not prepare export.',
                                    );
                                  }
                                })()
                              }
                            >
                              Export
                            </button>
                            <button
                              onClick={() =>
                                setArchived(
                                  record.id,
                                  !archivedSet.has(record.id),
                                )
                              }
                            >
                              {archivedSet.has(record.id)
                                ? 'Restore'
                                : 'Archive'}
                            </button>
                            {deletingId === record.id ? (
                              <>
                                <button
                                  onClick={async () => {
                                    const warning = await gameSystemRegistry
                                      .get(record.systemId)
                                      ?.getDeleteWarning?.(
                                        record.id,
                                        repository,
                                      );
                                    if (warning && !window.confirm(warning))
                                      return;
                                    await repository.delete(record.id);
                                    setPreferences(
                                      writeCharacterLibraryPreferences(
                                        removeCharacterLibraryPreference(
                                          preferences,
                                          record.id,
                                        ),
                                      ),
                                    );
                                    removeCharacterOverride(record.id);
                                    setDeletingId(null);
                                    await refresh();
                                  }}
                                >
                                  Confirm delete
                                </button>
                                <button onClick={() => setDeletingId(null)}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setDeletingId(record.id)}>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        {renamingId === record.id ? (
                          <form
                            className="rename-form"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void rename(record);
                            }}
                          >
                            <label>
                              <span>Character name</span>
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(event) =>
                                  setRenameValue(event.target.value)
                                }
                              />
                            </label>
                            <div className="compact-actions">
                              <button className="small-button" type="submit">
                                Save name
                              </button>
                              <button
                                className="small-button small-button--quiet"
                                type="button"
                                onClick={() => setRenamingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
      <footer className="library-footer">
        Local-first by design. Clearing this browser’s site data removes these
        records.
      </footer>
    </main>
  );
}
