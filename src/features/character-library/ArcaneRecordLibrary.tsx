import { useCallback, useEffect, useRef, useState } from 'react';
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

  const resolvedRecords = records.map((record) =>
    resolveCharacter(record, gameSystemRegistry, moduleRegistry),
  );
  const filtered = resolvedRecords.filter((result) => {
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
  });

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
        </div>
        <p className="local-promise">
          <span aria-hidden="true">◉</span> Saved in this browser — never sent
          to an account or cloud service.
        </p>
      </header>

      {!loading && resolvedRecords.length > 0 ? (
        <section className="recent-records" aria-labelledby="recent-title">
          <p className="eyebrow">Continue where you left off</p>
          <h2 id="recent-title">Recent characters</h2>
          <div className="recent-records__list">
            {resolvedRecords.slice(0, 3).map((result) => {
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
          <span className="record-count">{filtered.length} shown</span>
        </div>
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
            <h3>No matching characters</h3>
            <p>Create a character or import an Arcane Record file.</p>
          </div>
        ) : (
          <div className="character-grid">
            {filtered.map((result) => {
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
                <article className="character-card" key={record.id}>
                  <button
                    className="character-card__open"
                    onClick={() =>
                      onNavigate(`/characters/${encodeURIComponent(record.id)}`)
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
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>
                  <div className="character-card__footer">
                    <small>Updated {formatUpdatedAt(record.updatedAt)}</small>
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
                              onClick={() => void previewMageModule(record)}
                            >
                              Preview module copy
                            </button>
                          ) : null}
                          {result.interpreter === 'legacy' &&
                          record.systemId === EXALTED1E_SYSTEM_ID ? (
                            <button
                              onClick={() => void previewExaltedModule(record)}
                            >
                              Preview module copy
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      <button onClick={() => downloadRecord(record)}>
                        Export
                      </button>
                      {deletingId === record.id ? (
                        <>
                          <button
                            onClick={async () => {
                              await repository.delete(record.id);
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
        )}
      </section>
      <footer className="library-footer">
        Local-first by design. Clearing this browser’s site data removes these
        records.
      </footer>
    </main>
  );
}
