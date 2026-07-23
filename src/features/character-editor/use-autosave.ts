import { useEffect } from 'react';
import { useEditorStore } from '../../state/editor-store';
import type { CharacterRepository } from '../../storage/character-repository';

const AUTOSAVE_DELAY_MS = 550;

export function useAutosave(repository: CharacterRepository) {
  const character = useEditorStore((state) => state.character);
  const revision = useEditorStore((state) => state.revision);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const markSaving = useEditorStore((state) => state.markSaving);
  const markSaved = useEditorStore((state) => state.markSaved);
  const markSaveFailed = useEditorStore((state) => state.markSaveFailed);

  useEffect(() => {
    if (!character || saveStatus !== 'unsaved') {
      return;
    }

    const timer = window.setTimeout(() => {
      markSaving(revision);
      void repository
        .save(character)
        .then((saved) => {
          markSaved(saved, revision);
        })
        .catch(() => {
          markSaveFailed(revision);
        });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    character,
    markSaveFailed,
    markSaved,
    markSaving,
    repository,
    revision,
    saveStatus,
  ]);
}
