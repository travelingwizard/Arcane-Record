import type { GameSystemDefinition } from '../game-system';
import { createBlankTorchbearer2eCharacter } from './create-character';
import {
  TORCHBEARER2E_SCHEMA_VERSION,
  TORCHBEARER2E_SYSTEM_ID,
  torchbearer2eSectionGroups,
  torchbearer2eSections,
} from './definitions';
import {
  migrateTorchbearer2eCharacter,
  torchbearer2eCharacterSchema,
  type Torchbearer2eCharacter,
} from './schema';
import { Torchbearer2eEditor } from './Torchbearer2eEditor';

export const torchbearer2eDefinition: GameSystemDefinition<Torchbearer2eCharacter> =
  {
    id: TORCHBEARER2E_SYSTEM_ID,
    name: 'Torchbearer Second Edition',
    shortName: 'Torchbearer 2e',
    description:
      'A local-first guided core character creator and editable Torchbearer Second Edition adventurer record.',
    currentSchemaVersion: TORCHBEARER2E_SCHEMA_VERSION,
    characterSchema: torchbearer2eCharacterSchema,
    createInitialCharacter: createBlankTorchbearer2eCharacter,
    migrateCharacter: (data, fromVersion) =>
      migrateTorchbearer2eCharacter(data, fromVersion),
    getDisplayName: (character) =>
      character.identity.name.trim() || 'Untitled Torchbearer',
    getSummary: (character) =>
      [character.identity.stock, character.identity.class]
        .filter(Boolean)
        .join(' · ') || 'Torchbearer 2e adventurer',
    getSearchText: (character) =>
      [
        ...Object.values(character.identity),
        ...Object.values(character.drives),
        ...character.traits.map(({ name }) => name),
        ...character.wises.map(({ name }) => name),
      ].join(' '),
    renameCharacter: (character, name) => ({
      ...character,
      identity: { ...character.identity, name },
    }),
    duplicateCharacter: (character) => ({
      ...structuredClone(character),
      identity: {
        ...character.identity,
        name: character.identity.name
          ? `${character.identity.name} (Copy)`
          : 'Untitled Torchbearer (Copy)',
      },
    }),
    CharacterEditor: Torchbearer2eEditor,
    appearance: {
      label: 'Torchbearer Second Edition sheet settings',
      description: 'Cross-game appearance for Torchbearer character sheets.',
    },
    sections: torchbearer2eSections,
    sectionGroups: torchbearer2eSectionGroups,
  };
