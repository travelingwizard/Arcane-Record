import { useEffect, useState } from 'react';
import { CharacterEditor } from '../features/character-editor/CharacterEditor';
import { useAutosave } from '../features/character-editor/use-autosave';
import { CharacterLibrary } from '../features/character-library/CharacterLibrary';
import { useEditorStore } from '../state/editor-store';
import type { CharacterRepository } from '../storage/character-repository';
import { characterRepository } from '../storage/repository-instance';
import type { MageCharacter } from '../types/character';

const LAST_ACTIVE_CHARACTER_KEY = 'arcane-ledger:last-active-character';

export function App({
  repository = characterRepository,
}: {
  repository?: CharacterRepository;
}) {
  const [booting, setBooting] = useState(true);
  const character = useEditorStore((state) => state.character);
  const load = useEditorStore((state) => state.load);
  const clear = useEditorStore((state) => state.clear);
  const saveStatus = useEditorStore((state) => state.saveStatus);

  useAutosave(repository);

  useEffect(() => {
    let ignore = false;
    const previousId = window.localStorage.getItem(LAST_ACTIVE_CHARACTER_KEY);

    if (!previousId) {
      setBooting(false);
      return;
    }

    void repository
      .get(previousId)
      .then((storedCharacter) => {
        if (!ignore && storedCharacter) {
          load(storedCharacter);
        } else if (!storedCharacter) {
          window.localStorage.removeItem(LAST_ACTIVE_CHARACTER_KEY);
        }
      })
      .catch(() => {
        window.localStorage.removeItem(LAST_ACTIVE_CHARACTER_KEY);
      })
      .finally(() => {
        if (!ignore) {
          setBooting(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [load, repository]);

  const openCharacter = (nextCharacter: MageCharacter) => {
    window.localStorage.setItem(LAST_ACTIVE_CHARACTER_KEY, nextCharacter.id);
    load(nextCharacter);
  };

  const returnToLibrary = async () => {
    if (character && saveStatus !== 'saved') {
      try {
        await repository.save(character);
      } catch {
        return;
      }
    }
    window.localStorage.removeItem(LAST_ACTIVE_CHARACTER_KEY);
    clear();
  };

  if (booting) {
    return (
      <main className="boot-screen">
        <span aria-hidden="true">✦</span>
        <h1>Arcane Record</h1>
        <p role="status">Opening your browser-local records…</p>
      </main>
    );
  }

  return character ? (
    <CharacterEditor
      onReturnToLibrary={returnToLibrary}
      repository={repository}
      onImported={openCharacter}
    />
  ) : (
    <CharacterLibrary repository={repository} onOpen={openCharacter} />
  );
}
