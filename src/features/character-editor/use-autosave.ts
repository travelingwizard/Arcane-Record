import { useEffect, useMemo } from 'react';
import { useEditorStore } from '../../state/editor-store';
import type { CharacterRepository } from '../../storage/character-repository';
import type { MageCharacter } from '../../types/character';
import { getMageCharacterData } from '../../games/mage20/character-adapter';
import {
  createSaveQueue,
  AUTOSAVE_DELAY_MS,
  type SaveQueue,
} from './save-queue';

/**
 * The comparable "did the stored record change under us" string for a
 * Mage character: the character's own data shape (schema-validated,
 * excluding metadata like `id`/`createdAt`/`updatedAt`), matching what
 * `mageToStoredCharacter` writes into `StoredCharacter.data`.
 */
function baselineFor(character: MageCharacter): string {
  return JSON.stringify(getMageCharacterData(character));
}

export function useAutosave(repository: CharacterRepository) {
  const character = useEditorStore((state) => state.character);
  const revision = useEditorStore((state) => state.revision);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const markSaving = useEditorStore((state) => state.markSaving);
  const markSaved = useEditorStore((state) => state.markSaved);
  const markSaveFailed = useEditorStore((state) => state.markSaveFailed);

  // One save queue per loaded character. Recreated only when switching to
  // a genuinely different character (by id) -- not on every edit, and not
  // on this editor's own save round-trip, which reloads the same
  // character's data without changing its id. `repository` is
  // referentially stable for the lifetime of a given editor instance, so
  // omitting it from the dependency list does not risk a stale capture in
  // practice.
  const queue = useMemo<SaveQueue<MageCharacter> | null>(() => {
    if (!character) return null;
    return createSaveQueue<MageCharacter>({
      repository,
      initialPersistedData: baselineFor(character),
      getPersistedData: baselineFor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id]);

  // Re-align the queue's baseline whenever a freshly-loaded, unedited
  // character is in the store -- including this editor's own save
  // round-trip, where `load()` resets `revision` to 0 once the
  // just-saved record is fed back in via `onRecordChanged`. The queue
  // already updates its own baseline right after a successful save, so
  // this is normally redundant, but it keeps the baseline correct if the
  // character is ever reloaded through some other path.
  useEffect(() => {
    if (character && revision === 0 && saveStatus === 'saved') {
      queue?.resetBaseline(baselineFor(character));
    }
  }, [character, revision, saveStatus, queue]);

  useEffect(() => {
    if (!character || !queue || saveStatus !== 'unsaved') {
      return;
    }

    const timer = window.setTimeout(() => {
      markSaving(revision);
      void queue
        .save(character)
        .then((saved) => markSaved(saved, revision))
        .catch(() => markSaveFailed(revision));
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    character,
    markSaveFailed,
    markSaved,
    markSaving,
    queue,
    revision,
    saveStatus,
  ]);

  // Warn before closing or navigating away with unsaved, unsynced, or
  // failed-to-save edits -- the debounce window and the "saving" phase
  // both leave a real window where a closed tab would lose a draft.
  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus !== 'saved') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [saveStatus]);

  return {
    /**
     * Force an immediate save of whatever is currently in the editor
     * store, through the same queue (and therefore the same CAS
     * protection) the debounce uses, rather than calling the repository
     * directly. Used for a final "flush" before navigating away. No-op
     * if there is nothing unsaved.
     */
    flush: async () => {
      const current = useEditorStore.getState();
      if (!current.character || current.saveStatus === 'saved' || !queue) {
        return;
      }
      const atRevision = current.revision;
      markSaving(atRevision);
      try {
        const saved = await queue.save(current.character);
        markSaved(saved, atRevision);
      } catch {
        markSaveFailed(atRevision);
      }
    },
  };
}
