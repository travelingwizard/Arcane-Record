import { useCallback, useEffect, useState } from 'react';
import type { CharacterRepository } from '../../storage/character-repository';
import type { MageCharacter } from '../../types/character';

function formatUpdatedAt(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function CharacterLibrary({
  repository,
  onOpen,
}: {
  repository: CharacterRepository;
  onOpen: (character: MageCharacter) => void;
}) {
  const [characters, setCharacters] = useState<MageCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError('');
    try {
      setCharacters(await repository.list());
    } catch {
      setError('The local character library could not be opened.');
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCharacter = async () => {
    setError('');
    try {
      onOpen(await repository.create());
    } catch {
      setError('A new local character could not be created.');
    }
  };

  const duplicateCharacter = async (id: string) => {
    setError('');
    try {
      await repository.duplicate(id);
      await refresh();
    } catch {
      setError('The character could not be duplicated.');
    }
  };

  const startRename = (character: MageCharacter) => {
    setRenamingId(character.id);
    setRenameValue(character.identity.name);
  };

  const commitRename = async (character: MageCharacter) => {
    setError('');
    try {
      await repository.save({
        ...character,
        identity: { ...character.identity, name: renameValue },
      });
      setRenamingId(null);
      await refresh();
    } catch {
      setError('The character could not be renamed.');
    }
  };

  const deleteCharacter = async (id: string) => {
    setError('');
    try {
      await repository.delete(id);
      setDeletingId(null);
      await refresh();
    } catch {
      setError('The character could not be deleted.');
    }
  };

  return (
    <main className="app-shell library-shell">
      <header className="library-hero">
        <div className="library-hero__mark" aria-hidden="true">
          ✦
        </div>
        <p className="eyebrow">A private chronicle</p>
        <h1>Arcane Ledger</h1>
        <p className="library-hero__lede">
          Shape and keep your Mage M20 characters in an interactive sheet
          inspired by old-world ink and paper.
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={() => void createCharacter()}
        >
          <span aria-hidden="true">＋</span> Create character
        </button>
        <p className="local-promise">
          <span aria-hidden="true">◉</span>
          Saved in this browser — never sent to an account or cloud service.
        </p>
      </header>

      <section className="library-section" aria-labelledby="library-title">
        <div className="library-section__heading">
          <div>
            <p className="eyebrow">Your records</p>
            <h2 id="library-title">Character library</h2>
          </div>
          <span className="record-count">
            {characters.length} {characters.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {error ? (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="library-loading" role="status">
            Opening the local ledger…
          </p>
        ) : characters.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__glyph" aria-hidden="true">
              ◇
            </span>
            <h3>No characters inscribed yet</h3>
            <p>
              Create your first record. It will remain in this browser profile,
              including after refreshes and restarts.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void createCharacter()}
            >
              Create the first character
            </button>
          </div>
        ) : (
          <div className="character-grid">
            {characters.map((character) => {
              const displayName =
                character.identity.name.trim() || 'Untitled mage';
              const isRenaming = renamingId === character.id;
              const isDeleting = deletingId === character.id;

              return (
                <article className="character-card" key={character.id}>
                  <button
                    type="button"
                    className="character-card__open"
                    onClick={() => onOpen(character)}
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
                        {character.identity.concept || 'Concept unrecorded'}
                      </small>
                    </span>
                    <span className="character-card__arrow" aria-hidden="true">
                      →
                    </span>
                  </button>

                  {isRenaming ? (
                    <form
                      className="rename-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void commitRename(character);
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
                        <button type="submit" className="small-button">
                          Save name
                        </button>
                        <button
                          type="button"
                          className="small-button small-button--quiet"
                          onClick={() => setRenamingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : isDeleting ? (
                    <div className="delete-confirmation" role="alertdialog">
                      <p>
                        Delete <strong>{displayName}</strong> from this browser?
                        This cannot be undone.
                      </p>
                      <div className="compact-actions">
                        <button
                          type="button"
                          className="small-button small-button--danger"
                          onClick={() => void deleteCharacter(character.id)}
                        >
                          Delete character
                        </button>
                        <button
                          type="button"
                          className="small-button small-button--quiet"
                          onClick={() => setDeletingId(null)}
                        >
                          Keep character
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="character-card__footer">
                      <small>
                        Updated {formatUpdatedAt(character.updatedAt)}
                      </small>
                      <div className="card-actions">
                        <button
                          type="button"
                          onClick={() => startRename(character)}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => void duplicateCharacter(character.id)}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(character.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="library-footer">
        <span aria-hidden="true">⌁</span>
        Local-first by design. Clearing this browser’s site data will remove
        these records.
      </footer>
    </main>
  );
}
