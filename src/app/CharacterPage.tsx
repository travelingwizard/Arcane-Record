import { useEffect, useState } from 'react';
import type { GameSystemRegistry } from '../games/game-system-registry';
import { resolveCharacter } from '../games/resolve-character';
import type { StoredCharacter } from '../storage/stored-character';
import type { StoredCharacterRepository } from '../storage/stored-character-repository';
import {
  createCharacterFileName,
  serializeCharacter,
} from '../features/import-export/character-files';

function downloadRawRecord(record: StoredCharacter) {
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

export function CharacterPage({
  id,
  registry,
  repository,
  onNavigate,
}: {
  id: string;
  registry: GameSystemRegistry;
  repository: StoredCharacterRepository;
  onNavigate: (path: string) => void;
}) {
  const [record, setRecord] = useState<StoredCharacter | null>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;
    void repository.get(id).then((value) => {
      if (active) setRecord(value);
    });
    return () => {
      active = false;
    };
  }, [id, repository]);

  useEffect(() => {
    if (!record) return;
    document.documentElement.dataset.gameSystem = record.systemId;
    return () => {
      delete document.documentElement.dataset.gameSystem;
    };
  }, [record]);

  if (record === undefined) {
    return (
      <main className="boot-screen">
        <h1>Arcane Record</h1>
        <p role="status">Opening character…</p>
      </main>
    );
  }
  if (record === null) {
    return (
      <main className="app-shell neutral-shell error-shell">
        <h1>Character not found</h1>
        <p>This browser does not contain that record.</p>
        <button className="secondary-button" onClick={() => onNavigate('/')}>
          Return to library
        </button>
      </main>
    );
  }

  const result = resolveCharacter(record, registry);
  if (result.status !== 'available') {
    return (
      <main className="app-shell neutral-shell error-shell">
        <p className="eyebrow">Recoverable record</p>
        <h1>{record.name || 'Unavailable character'}</h1>
        <p role="alert">{result.message}</p>
        <p>Your original stored data has not been changed or deleted.</p>
        <div className="compact-actions">
          <button
            className="secondary-button"
            onClick={() => downloadRawRecord(record)}
          >
            Export raw record
          </button>
          <button className="text-button" onClick={() => onNavigate('/')}>
            Return to library
          </button>
          {confirmDelete ? (
            <>
              <button
                className="small-button small-button--danger"
                onClick={async () => {
                  await repository.delete(record.id);
                  onNavigate('/');
                }}
              >
                Confirm delete
              </button>
              <button
                className="small-button small-button--quiet"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="small-button small-button--danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete record
            </button>
          )}
        </div>
      </main>
    );
  }

  const Editor = result.system.CharacterEditor;
  return (
    <Editor
      record={record}
      character={result.character}
      repository={repository}
      onBack={async () => onNavigate('/')}
      onRecordChanged={(nextRecord) => {
        setRecord(nextRecord);
        if (nextRecord.id !== id) {
          onNavigate(`/characters/${encodeURIComponent(nextRecord.id)}`);
        }
      }}
    />
  );
}
