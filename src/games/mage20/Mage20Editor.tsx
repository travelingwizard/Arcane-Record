import { useEffect, useMemo } from 'react';
import { CharacterEditor } from '../../features/character-editor/CharacterEditor';
import { useAutosave } from '../../features/character-editor/use-autosave';
import { useEditorStore } from '../../state/editor-store';
import type { CharacterRepository } from '../../storage/character-repository';
import type { GameCharacterEditorProps } from '../game-system';
import type { MageCharacterData } from '../../types/character';
import {
  mageToStoredCharacter,
  storedCharacterToMage,
} from './character-adapter';

export function Mage20Editor({
  record,
  repository,
  onBack,
  onRecordChanged,
}: GameCharacterEditorProps<MageCharacterData>) {
  const load = useEditorStore((state) => state.load);
  const clear = useEditorStore((state) => state.clear);

  const scopedRepository = useMemo<CharacterRepository>(
    () => ({
      list: async () =>
        (await repository.list())
          .filter((candidate) => candidate.systemId === record.systemId)
          .map(storedCharacterToMage),
      get: async (id) => {
        const candidate = await repository.get(id);
        return candidate?.systemId === record.systemId
          ? storedCharacterToMage(candidate)
          : null;
      },
      create: async (character) => {
        if (!character) {
          throw new Error('Mage character data is required.');
        }
        const stored = await repository.create(
          mageToStoredCharacter(character),
        );
        onRecordChanged(stored);
        return storedCharacterToMage(stored);
      },
      save: async (character) => {
        const stored = await repository.save(mageToStoredCharacter(character));
        onRecordChanged(stored);
        return storedCharacterToMage(stored);
      },
      duplicate: async () => {
        throw new Error('Use the character library to duplicate records.');
      },
      delete: (id) => repository.delete(id),
    }),
    [onRecordChanged, record.systemId, repository],
  );

  useEffect(() => {
    load(storedCharacterToMage(record));
    return () => clear();
  }, [clear, load, record]);

  useAutosave(scopedRepository);

  const returnToLibrary = async () => {
    const active = useEditorStore.getState().character;
    const status = useEditorStore.getState().saveStatus;
    if (active && status !== 'saved') {
      await scopedRepository.save(active);
    }
    await onBack();
  };

  return (
    <CharacterEditor
      repository={scopedRepository}
      onReturnToLibrary={returnToLibrary}
      onImported={(character) =>
        onRecordChanged(mageToStoredCharacter(character))
      }
    />
  );
}
