import type { GameSystemDefinition } from '../game-system';
import { createShadowrun1eCharacter } from './create-character';
import {
  SHADOWRUN1E_SCHEMA_VERSION,
  SHADOWRUN1E_SYSTEM_ID,
  shadowrun1eSectionGroups,
  shadowrun1eSections,
} from './definitions';
import { Shadowrun1eEditor } from './Shadowrun1eEditor';
import {
  migrateShadowrun1eCharacter,
  shadowrun1eCharacterSchema,
  type Shadowrun1eCharacter,
} from './schema';

export const shadowrun1eDefinition: GameSystemDefinition<Shadowrun1eCharacter> =
  {
    id: SHADOWRUN1E_SYSTEM_ID,
    name: 'Shadowrun First Edition',
    shortName: 'Shadowrun 1e',
    description:
      'A local-first priority builder and play sheet for the original Shadowrun rules.',
    currentSchemaVersion: SHADOWRUN1E_SCHEMA_VERSION,
    characterSchema: shadowrun1eCharacterSchema,
    createInitialCharacter: createShadowrun1eCharacter,
    creationActions: [
      {
        id: 'build',
        name: 'Build Character',
        description:
          'Start with the First Edition priority system and guided budgets.',
        createInitialCharacter: () =>
          createShadowrun1eCharacter({ status: 'draft', mode: 'build' }),
      },
      {
        id: 'play',
        name: 'Open Blank Play Sheet',
        description: 'Open a manual record directly in Play mode.',
        createInitialCharacter: () =>
          createShadowrun1eCharacter({ status: 'manual', mode: 'play' }),
      },
    ],
    migrateCharacter: migrateShadowrun1eCharacter,
    getDisplayName: (character) =>
      character.name || character.streetName || 'Untitled Shadowrunner',
    getSummary: (character) =>
      `${character.metatype} · ${character.archetype || 'Unspecified archetype'}`,
    getSearchText: (character) =>
      [
        character.name,
        character.streetName,
        character.player,
        character.metatype,
        character.archetype,
        ...character.skills.map(({ name }) => name),
      ].join(' '),
    renameCharacter: (character, name) => ({ ...character, name }),
    duplicateCharacter: (character) => ({
      ...structuredClone(character),
      name: character.name
        ? `${character.name} (Copy)`
        : 'Untitled Shadowrunner (Copy)',
    }),
    CharacterEditor: Shadowrun1eEditor,
    sections: shadowrun1eSections,
    sectionGroups: shadowrun1eSectionGroups,
    appearance: {
      label: 'Shadowrun First Edition sheet settings',
      description: 'Appearance and official-source controls for this runner.',
    },
  };
